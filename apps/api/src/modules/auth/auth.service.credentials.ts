import type { ApiConfig } from "@birthub/config";
import {
  MembershipStatus,
  prisma,
  UserStatus
} from "@birthub/database";

import {
  hashPassword,
  randomToken,
  sha256,
  verifyPasswordHash
} from "./crypto.js";
import {
  createNewDeviceAlert,
  createSession
} from "./auth.service.sessions.js";
import {
  buildOtpauthUrl,
  buildQrCodeDataUrl,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode
} from "./mfa.service.js";
import type { SessionTokens } from "./auth.service.shared.js";

export async function loginWithPassword(input: {
  config: ApiConfig;
  email: string;
  ipAddress: string | null;
  organizationId: string;
  password: string;
  userAgent: string | null;
}): Promise<
  | {
      challengeExpiresAt: Date;
      challengeToken: string;
      mfaRequired: true;
    }
  | {
      mfaRequired: false;
      organizationId: string;
      sessionId: string;
      tenantId: string;
      tokens: SessionTokens;
      userId: string;
    }
> {
  const membership = await prisma.membership.findFirst({
    include: {
      user: true
    },
    where: {
      organizationId: input.organizationId,
      status: MembershipStatus.ACTIVE,
      user: {
        email: input.email
      }
    }
  });

  if (!membership) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (membership.user.status === UserStatus.SUSPENDED) {
    throw new Error("ACCOUNT_SUSPENDED");
  }

  const passwordCheck = await verifyPasswordHash(
    input.password,
    membership.user.passwordHash,
    input.config.AUTH_BCRYPT_SALT_ROUNDS
  );

  if (!passwordCheck.isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (passwordCheck.needsRehash) {
    await prisma.user.update({
      data: {
        passwordHash: await hashPassword(
          input.password,
          input.config.AUTH_BCRYPT_SALT_ROUNDS
        )
      },
      where: {
        id: membership.userId
      }
    });
  }

  await createNewDeviceAlert({
    ipAddress: input.ipAddress,
    organizationId: input.organizationId,
    tenantId: membership.tenantId,
    userAgent: input.userAgent,
    userId: membership.userId
  });

  if (membership.user.mfaEnabled) {
    const challengeToken = `mfa_${randomToken(36)}`;
    const challengeExpiresAt = new Date(
      Date.now() + input.config.AUTH_MFA_CHALLENGE_TTL_SECONDS * 1000
    );

    await prisma.mfaChallenge.create({
      data: {
        expiresAt: challengeExpiresAt,
        organizationId: input.organizationId,
        tenantId: membership.tenantId,
        tokenHash: sha256(challengeToken),
        userId: membership.userId
      }
    });

    return {
      challengeExpiresAt,
      challengeToken,
      mfaRequired: true
    };
  }

  const session = await createSession({
    config: input.config,
    ipAddress: input.ipAddress,
    organizationId: input.organizationId,
    role: membership.role,
    tenantId: membership.tenantId,
    userAgent: input.userAgent,
    userId: membership.userId
  });

  return {
    mfaRequired: false,
    organizationId: input.organizationId,
    sessionId: session.sessionId,
    tenantId: membership.tenantId,
    tokens: session.tokens,
    userId: membership.userId
  };
}

export async function verifyMfaChallenge(input: {
  challengeToken: string;
  config: ApiConfig;
  ipAddress: string | null;
  recoveryCode?: string;
  totpCode?: string;
  userAgent: string | null;
}): Promise<{
  organizationId: string;
  sessionId: string;
  tenantId: string;
  tokens: SessionTokens;
  userId: string;
}> {
  const challenge = await prisma.mfaChallenge.findUnique({
    where: {
      tokenHash: sha256(input.challengeToken)
    }
  });

  if (!challenge) {
    throw new Error("INVALID_MFA_CHALLENGE");
  }

  if (challenge.consumedAt || challenge.expiresAt.getTime() < Date.now()) {
    throw new Error("MFA_CHALLENGE_EXPIRED");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: challenge.userId
    }
  });

  if (!user || !user.mfaSecret) {
    throw new Error("MFA_NOT_CONFIGURED");
  }

  let verified = false;

  if (input.totpCode) {
    const decryptedSecret = decryptTotpSecret(
      user.mfaSecret,
      input.config.AUTH_MFA_ENCRYPTION_KEY
    );
    verified = verifyTotpCode({
      clockSkewWindows: input.config.AUTH_MFA_CLOCK_SKEW_WINDOWS,
      code: input.totpCode,
      secret: decryptedSecret
    });
  }

  if (!verified && input.recoveryCode) {
    const hashed = hashRecoveryCode(input.recoveryCode);
    const recoveryCode = await prisma.mfaRecoveryCode.findFirst({
      where: {
        codeHash: hashed,
        usedAt: null,
        userId: challenge.userId
      }
    });

    if (recoveryCode) {
      await prisma.mfaRecoveryCode.update({
        data: {
          usedAt: new Date()
        },
        where: {
          id: recoveryCode.id
        }
      });
      verified = true;
    }
  }

  if (!verified) {
    throw new Error("INVALID_MFA_CODE");
  }

  const consumed = await prisma.mfaChallenge.updateMany({
    data: {
      consumedAt: new Date()
    },
    where: {
      consumedAt: null,
      id: challenge.id
    }
  });

  if (consumed.count !== 1) {
    throw new Error("MFA_CODE_ALREADY_USED");
  }

  const membershipRole = (
    await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: challenge.organizationId,
          userId: challenge.userId
        }
      },
      select: {
        role: true
      }
    })
  )?.role;

  const createdSession = await createSession({
    config: input.config,
    ipAddress: input.ipAddress,
    organizationId: challenge.organizationId,
    ...(membershipRole ? { role: membershipRole } : {}),
    tenantId: challenge.tenantId,
    userAgent: input.userAgent,
    userId: challenge.userId
  });

  return {
    organizationId: challenge.organizationId,
    sessionId: createdSession.sessionId,
    tenantId: challenge.tenantId,
    tokens: createdSession.tokens,
    userId: challenge.userId
  };
}

export async function setupMfaForUser(input: {
  config: ApiConfig;
  email: string;
  tenantId?: string;
  userId: string;
}) {
  const secret = generateTotpSecret();
  const encryptedSecret = encryptTotpSecret(secret, input.config.AUTH_MFA_ENCRYPTION_KEY);
  const recoveryCodes = generateRecoveryCodes();
  const hashedCodes = recoveryCodes.map((code) => hashRecoveryCode(code));
  const otpauthUrl = buildOtpauthUrl({
    accountName: input.email,
    issuer: input.config.AUTH_MFA_ISSUER,
    secret
  });
  const membership = await prisma.membership.findFirst({
    where: {
      userId: input.userId
    }
  });
  const tenantId = input.tenantId ?? membership?.tenantId;

  if (!tenantId) {
    throw new Error("TENANT_NOT_FOUND_FOR_USER");
  }

  await prisma.$transaction([
    prisma.user.update({
      data: {
        mfaEnabled: false,
        mfaSecret: encryptedSecret
      },
      where: {
        id: input.userId
      }
    }),
    prisma.mfaRecoveryCode.deleteMany({
      where: {
        userId: input.userId
      }
    }),
    prisma.mfaRecoveryCode.createMany({
      data: hashedCodes.map((codeHash) => ({
        codeHash,
        tenantId,
        userId: input.userId
      }))
    })
  ]);

  return {
    otpauthUrl,
    qrCodeDataUrl: buildQrCodeDataUrl(otpauthUrl),
    recoveryCodes
  };
}

export async function enableMfaForUser(input: {
  config: ApiConfig;
  totpCode: string;
  userId: string;
}): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      id: input.userId
    }
  });

  if (!user?.mfaSecret) {
    throw new Error("MFA_NOT_CONFIGURED");
  }

  const decryptedSecret = decryptTotpSecret(
    user.mfaSecret,
    input.config.AUTH_MFA_ENCRYPTION_KEY
  );

  const isValid = verifyTotpCode({
    clockSkewWindows: input.config.AUTH_MFA_CLOCK_SKEW_WINDOWS,
    code: input.totpCode,
    secret: decryptedSecret
  });

  if (!isValid) {
    return false;
  }

  await prisma.user.update({
    data: {
      mfaEnabled: true
    },
    where: {
      id: input.userId
    }
  });

  return true;
}