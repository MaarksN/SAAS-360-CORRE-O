// [SOURCE] Checklist-Session-Security.md - GAP-SEC-001
import assert from "node:assert/strict";
import test from "node:test";
import { setMaxListeners } from "node:events";
setMaxListeners(20);

import { prisma, Role, UserStatus } from "@birthub/database";
import request from "supertest";

import { createApp } from "../src/app.js";
import { authenticateRequest, createSession, refreshSession, verifyMfaChallenge } from "../src/modules/auth/auth.service.js";
import { setAuthCookies } from "../src/modules/auth/cookies.js";
import { encryptTotpSecret, generateCurrentTotp, generateTotpSecret } from "../src/modules/auth/mfa.service.js";
import { sha256 } from "../src/modules/auth/crypto.js";
import { createTestApiConfig } from "./test-config.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function createAuthTestApp() {
  return createApp({
    config: createTestApiConfig(),
    healthService: () => Promise.resolve({
      checkedAt: new Date("2026-03-13T00:00:00.000Z").toISOString(),
      services: {
        database: { status: "up" as const },
        externalDependencies: [],
        redis: { status: "up" as const }
      },
      status: "ok" as const
    }),
    shouldExposeDocs: false
  });
}

void test("auth login returns 200 and creates a session", async () => {
  const restores = [
    stubMethod(prisma.organization, "findFirst", () => Promise.resolve({ id: "org_1", tenantId: "tenant_1" })),
    stubMethod(prisma.membership, "findFirst", () => Promise.resolve({
      organizationId: "org_1",
      role: "OWNER",
      tenantId: "tenant_1",
      user: {
        email: "owner@birthub.local",
        id: "user_1",
        mfaEnabled: false,
        passwordHash: sha256("password123"),
        status: UserStatus.ACTIVE
      },
      userId: "user_1"
    })),
    stubMethod(prisma.user, "update", () => Promise.resolve({ id: "user_1" })),
    stubMethod(prisma.session, "findFirst", () => Promise.resolve(null)),
    stubMethod(prisma.session, "create", () => Promise.resolve({
      id: "session_1"
    })),
    stubMethod(prisma.session, "findMany", () => Promise.resolve([{ id: "session_1" }])),
    stubMethod(prisma.session, "updateMany", () => Promise.resolve({ count: 0 }))
  ];

  try {
    const app = createAuthTestApp();
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "owner@birthub.local",
        password: "password123",
        tenantId: "birthhub-alpha"
      })
      .expect(200);

    const body = response.body as { mfaRequired: boolean; session: { tenantId: string; userId: string } };
    assert.equal(body.mfaRequired, false);
    assert.equal(body.session.userId, "user_1");
    assert.equal(body.session.tenantId, "tenant_1");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("createSession generates session id with 16-byte hex entropy", async () => {
  const config = createTestApiConfig();
  let capturedSessionId: string | null = null;

  const restores = [
    stubMethod(prisma.session, "create", (args: { data?: { id?: unknown } }) => {
      const sessionId = args.data?.id;

      if (typeof sessionId !== "string") {
        throw new Error("MISSING_SESSION_ID");
      }

      capturedSessionId = sessionId;
      return Promise.resolve({ id: sessionId });
    })
  ];

  try {
    const created = await createSession({
      config,
      ipAddress: "127.0.0.1",
      organizationId: "org_1",
      tenantId: "tenant_1",
      userAgent: "auth-test",
      userId: "user_1"
    });

    assert.match(created.sessionId, /^[a-f0-9]{32}$/);
    assert.equal(created.sessionId.length, 32);
    assert.equal(capturedSessionId, created.sessionId);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("auth login with MFA enabled returns challenge token", async () => {
  const restores = [
    stubMethod(prisma.organization, "findFirst", () => Promise.resolve({ id: "org_1", tenantId: "tenant_1" })),
    stubMethod(prisma.membership, "findFirst", () => Promise.resolve({
      organizationId: "org_1",
      role: "OWNER",
      tenantId: "tenant_1",
      user: {
        email: "owner@birthub.local",
        id: "user_1",
        mfaEnabled: true,
        passwordHash: sha256("password123"),
        status: UserStatus.ACTIVE
      },
      userId: "user_1"
    })),
    stubMethod(prisma.user, "update", () => Promise.resolve({ id: "user_1" })),
    stubMethod(prisma.session, "findFirst", () => Promise.resolve(null)),
    stubMethod(prisma.mfaChallenge, "create", () => Promise.resolve({ id: "challenge_1" }))
  ];

  try {
    const app = createAuthTestApp();
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "owner@birthub.local",
        password: "password123",
        tenantId: "birthhub-alpha"
      })
      .expect(200);

    const body = response.body as { challengeToken: string; mfaRequired: boolean };
    assert.equal(body.mfaRequired, true);
    assert.equal(typeof body.challengeToken, "string");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("auth MFA challenge verification accepts valid TOTP", async () => {
  const config = createTestApiConfig();
  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret, config.AUTH_MFA_ENCRYPTION_KEY);
  const validTotp = generateCurrentTotp(secret);

  const restores = [
    stubMethod(prisma.mfaChallenge, "findUnique", () => Promise.resolve({
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      id: "challenge_1",
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    })),
    stubMethod(prisma.user, "findUnique", () => Promise.resolve({
      id: "user_1",
      mfaSecret: encrypted
    })),
    stubMethod(prisma.mfaChallenge, "updateMany", () => Promise.resolve({ count: 1 })),
    stubMethod(prisma.membership, "findUnique", () => Promise.resolve({ role: Role.OWNER })),
    stubMethod(prisma.session, "create", () => Promise.resolve({ id: "session_2" })),
    stubMethod(prisma.session, "findMany", () => Promise.resolve([{ id: "session_2" }])),
    stubMethod(prisma.session, "updateMany", () => Promise.resolve({ count: 0 }))
  ];

  try {
    const app = createApp({
      config,
      shouldExposeDocs: false
    });

    const response = await request(app)
      .post("/api/v1/auth/mfa/challenge")
      .send({
        challengeToken: "mfa_token_for_test",
        totpCode: validTotp
      })
      .expect(200);

    const body = response.body as { mfaRequired: boolean; session: { tenantId: string; userId: string } };
    assert.equal(body.mfaRequired, false);
    assert.equal(body.session.userId, "user_1");
    assert.equal(body.session.tenantId, "tenant_1");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("verifyMfaChallenge rejects MFA challenge token reuse after first success", async () => {
  const config = createTestApiConfig();
  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret, config.AUTH_MFA_ENCRYPTION_KEY);
  const validTotp = generateCurrentTotp(secret);
  let consumeCount = 0;

  const restores = [
    stubMethod(prisma.mfaChallenge, "findUnique", () => Promise.resolve({
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      id: "challenge_1",
      organizationId: "org_1",
      tenantId: "tenant_1",
      userId: "user_1"
    })),
    stubMethod(prisma.user, "findUnique", () => Promise.resolve({
      id: "user_1",
      mfaSecret: encrypted
    })),
    stubMethod(prisma.mfaChallenge, "updateMany", () => {
      consumeCount += 1;
      return Promise.resolve({ count: consumeCount === 1 ? 1 : 0 });
    }),
    stubMethod(prisma.membership, "findUnique", () => Promise.resolve({ role: Role.OWNER })),
    stubMethod(prisma.session, "create", () => Promise.resolve({ id: "session_2" })),
    stubMethod(prisma.session, "findMany", () => Promise.resolve([{ id: "session_2" }])),
    stubMethod(prisma.session, "updateMany", () => Promise.resolve({ count: 0 }))
  ];

  try {
    await verifyMfaChallenge({
      challengeToken: "mfa_token_for_test",
      config,
      ipAddress: null,
      totpCode: validTotp,
      userAgent: "auth-test"
    });

    await assert.rejects(
      () =>
        verifyMfaChallenge({
          challengeToken: "mfa_token_for_test",
          config,
          ipAddress: null,
          totpCode: validTotp,
          userAgent: "auth-test"
        }),
      (error: unknown) => error instanceof Error && error.message === "MFA_CODE_ALREADY_USED"
    );
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("auth logout returns 200 for a valid session token", async () => {
  const expiresAt = new Date(Date.now() + 60_000);
  const sessionToken = "atk_valid";

  const restores = [
    stubMethod(prisma.session, "findUnique", () => Promise.resolve({
      expiresAt,
      id: "session_1",
      organizationId: "org_1",
      tenantId: "tenant_1",
      revokedAt: null,
      userId: "user_1"
    })),
    stubMethod(prisma.user, "findUnique", () => Promise.resolve({
      id: "user_1",
      status: UserStatus.ACTIVE
    })),
    stubMethod(prisma.membership, "findUnique", () => Promise.resolve({
      role: Role.MEMBER,
      status: "ACTIVE"
    })),
    stubMethod(prisma.session, "update", () => Promise.resolve({ id: "session_1" }))
  ];

  try {
    const app = createAuthTestApp();
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${sessionToken}`)
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .expect(200);

    const body = response.body as { revokedSessions: number };
    assert.equal(body.revokedSessions, 1);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("refreshSession rotates refresh tokens and revokes the previous session", async () => {
  const config = createTestApiConfig();
  let createdSessionId: string | null = null;
  let revokedReplacementId: string | null = null;

  const restores = [
    stubMethod(prisma.session, "findUnique", (args: { where?: { refreshTokenHash?: string } }) => {
      if (args.where?.refreshTokenHash !== sha256("refresh_current")) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        id: "session_current",
        organizationId: "org_1",
        refreshExpiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        tenantId: "tenant_1",
        userId: "user_1"
      });
    }),
    stubMethod(prisma.session, "create", (args: { data?: { id?: unknown } }) => {
      const nextId = typeof args.data?.id === "string" ? args.data.id : "session_next";
      createdSessionId = nextId;
      return Promise.resolve({ id: nextId });
    }),
    stubMethod(prisma.session, "findMany", () => Promise.resolve([{ id: createdSessionId ?? "session_next" }])),
    stubMethod(prisma.session, "updateMany", () => Promise.resolve({ count: 0 })),
    stubMethod(prisma.session, "update", (args: { data?: { replacedBySessionId?: string | null } }) => {
      revokedReplacementId = args.data?.replacedBySessionId ?? null;
      return Promise.resolve({ id: "session_current" });
    })
  ];

  try {
    const result = await refreshSession({
      config,
      ipAddress: "127.0.0.1",
      refreshToken: "refresh_current",
      userAgent: "auth-test"
    });

    assert.equal(result.breached, false);
    assert.equal(result.organizationId, "org_1");
    assert.equal(result.tenantId, "tenant_1");
    assert.equal(result.userId, "user_1");
    assert.equal(result.sessionId, createdSessionId);
    assert.ok(result.tokens);
    assert.notEqual(result.tokens?.refreshToken, "refresh_current");
    assert.equal(revokedReplacementId, createdSessionId);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("setAuthCookies hardens auth cookies with Strict sameSite and secure transport", () => {
  const config = {
    ...createTestApiConfig(),
    REQUIRE_SECURE_COOKIES: true
  };
  const writtenCookies: Array<{ name: string; options: Record<string, unknown>; value: string }> = [];
  const response = {
    cookie(name: string, value: string, options: Record<string, unknown>) {
      writtenCookies.push({ name, options, value });
      return this;
    }
  };

  setAuthCookies(response as never, config, {
    csrfToken: "csrf_1",
    expiresAt: new Date("2026-03-22T12:00:00.000Z"),
    refreshToken: "refresh_1",
    token: "atk_1"
  });

  const sessionCookie = writtenCookies.find((entry) => entry.name === config.API_AUTH_COOKIE_NAME);
  const refreshCookie = writtenCookies.find((entry) => entry.name === config.API_AUTH_REFRESH_COOKIE_NAME);
  const csrfCookie = writtenCookies.find((entry) => entry.name === config.API_CSRF_COOKIE_NAME);

  assert.ok(sessionCookie);
  assert.equal(sessionCookie.options.httpOnly, true);
  assert.equal(sessionCookie.options.sameSite, "strict");
  assert.equal(sessionCookie.options.secure, true);

  assert.ok(refreshCookie);
  assert.equal(refreshCookie.options.httpOnly, true);
  assert.equal(refreshCookie.options.sameSite, "strict");
  assert.equal(refreshCookie.options.secure, true);

  assert.ok(csrfCookie);
  assert.equal(csrfCookie.options.httpOnly, false);
  assert.equal(csrfCookie.options.sameSite, "strict");
  assert.equal(csrfCookie.options.secure, true);
});
void test("auth protected endpoint returns 401 for expired or invalid session tokens", async () => {
  const app = createAuthTestApp();

  let restore = stubMethod(prisma.session, "findUnique", () => Promise.resolve({
    expiresAt: new Date(Date.now() - 60_000), id: "s1", organizationId: "o1", tenantId: "t1", revokedAt: null, userId: "u1"
  }));

  let restoreMembership = stubMethod(prisma.membership, "findUnique", () => Promise.resolve({
    role: Role.MEMBER, status: "ACTIVE"
  }));

  await request(app).get("/api/v1/sessions").set("Authorization", "Bearer atk_expired").expect(401);
  restore();
  restoreMembership();

  restore = stubMethod(prisma.session, "findUnique", () => Promise.resolve(null));
  restoreMembership = stubMethod(prisma.membership, "findUnique", () => Promise.resolve({
    role: Role.MEMBER, status: "ACTIVE"
  }));
  await request(app).get("/api/v1/sessions").set("Authorization", "Bearer atk_invalid").expect(401);
  restore();
  restoreMembership();
});

void test("createSession enforces concurrent session limit for privileged roles", async () => {
  const config = createTestApiConfig();
  const revokedPayloads: unknown[] = [];

  const restores = [
    stubMethod(prisma.session, "create", () => Promise.resolve({ id: "session_new" })),
    stubMethod(
      prisma.session,
      "findMany",
      () => Promise.resolve([{ id: "session_new" }, { id: "session_old_1" }, { id: "session_old_2" }])
    ),
    stubMethod(prisma.session, "updateMany", (args: unknown) => {
      revokedPayloads.push(args);
      return Promise.resolve({ count: 2 });
    })
  ];

  try {
    await createSession({
      config,
      ipAddress: "127.0.0.1",
      organizationId: "org_1",
      role: Role.ADMIN,
      tenantId: "tenant_1",
      userAgent: "auth-test",
      userId: "user_1"
    });

    assert.equal(revokedPayloads.length, 1);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

void test("authenticateRequest rejects idle-expired session", async () => {
  const restores = [
    stubMethod(prisma.session, "findUnique", () => Promise.resolve({
      expiresAt: new Date(Date.now() + 60_000),
      id: "session_idle_expired",
      lastActivityAt: new Date(Date.now() - 31 * 60_000),
      organizationId: "org_1",
      refreshExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revokedAt: null,
      tenantId: "tenant_1",
      userId: "user_1"
    }))
  ];

  try {
    const authenticated = await authenticateRequest({
      config: { API_AUTH_IDLE_TIMEOUT_MINUTES: 30 },
      sessionToken: "atk_idle_expired"
    });
    assert.equal(authenticated, null);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});

