import {
  MembershipStatus,
  Role,
  UserStatus,
  prisma
} from "@birthub/database";

import {
  resolveTenantIdForOrganization,
  rolePriority
} from "./auth.service.shared.js";

export async function getRoleForUser(input: {
  organizationId: string;
  userId: string;
}): Promise<Role | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId
      }
    },
    select: {
      role: true,
      status: true
    }
  });

  if (!membership || membership.status !== MembershipStatus.ACTIVE) {
    return null;
  }

  return membership.role;
}

export async function assertRole(input: {
  minimumRole: Role;
  organizationId: string;
  userId: string;
}): Promise<boolean> {
  const role = await getRoleForUser({
    organizationId: input.organizationId,
    userId: input.userId
  });

  if (!role) {
    return false;
  }

  return rolePriority(role) >= rolePriority(input.minimumRole);
}

export async function suspendUser(input: {
  actorUserId: string;
  organizationId: string;
  targetUserId: string;
}) {
  const before = await prisma.user.findUnique({
    where: {
      id: input.targetUserId
    }
  });

  if (!before) {
    throw new Error("USER_NOT_FOUND");
  }

  const updated = await prisma.user.update({
    data: {
      status: UserStatus.SUSPENDED,
      suspendedAt: new Date()
    },
    where: {
      id: input.targetUserId
    }
  });
  const tenantId =
    (await resolveTenantIdForOrganization(input.organizationId)) ?? input.organizationId;

  await prisma.auditLog.create({
    data: {
      action: "user.suspended",
      actorId: input.actorUserId,
      diff: {
        after: {
          status: updated.status
        },
        before: {
          status: before.status
        }
      },
      entityId: input.targetUserId,
      entityType: "user",
      tenantId
    }
  });
}

export async function updateUserRoleWithAudit(input: {
  actorUserId: string;
  organizationId: string;
  role: Role;
  targetUserId: string;
}) {
  const before = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.targetUserId
      }
    }
  });

  if (!before) {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  const updated = await prisma.membership.update({
    data: {
      role: input.role
    },
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.targetUserId
      }
    }
  });
  const tenantId =
    (await resolveTenantIdForOrganization(input.organizationId)) ?? input.organizationId;

  await prisma.auditLog.create({
    data: {
      action: "membership.role.updated",
      actorId: input.actorUserId,
      diff: {
        after: {
          role: updated.role
        },
        before: {
          role: before.role
        }
      },
      entityId: input.targetUserId,
      entityType: "membership",
      tenantId
    }
  });

  return updated;
}
