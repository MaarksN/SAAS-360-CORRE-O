import { setMaxListeners } from "node:events";
setMaxListeners(20);
import assert from "node:assert/strict";
import test from "node:test";

import { MembershipStatus, Role, UserStatus, prisma } from "@birthub/database";
import request from "supertest";

import { createApp } from "../src/app.js";
import { createTestApiConfig } from "./test-config.js";
import { sha256 } from "../src/modules/auth/crypto.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function createRbacApp() {
  return createApp({
    config: createTestApiConfig(),
    shouldExposeDocs: false
  });
}

void test("RBAC matrix on /api/v1/users enforces role policy", async () => {
  const roleByUserId: Record<string, Role> = {
    user_admin: Role.ADMIN,
    user_member: Role.MEMBER,
    user_owner: Role.OWNER,
    user_readonly: Role.READONLY
  };
  const userByTokenHash: Record<string, string> = {
    [sha256("atk_admin")]: "user_admin",
    [sha256("atk_member")]: "user_member",
    [sha256("atk_owner")]: "user_owner",
    [sha256("atk_readonly")]: "user_readonly"
  };

  const restores = [
    stubMethod(prisma.organization, "findFirst", () => Promise.resolve({
      id: "org_1",
      tenantId: "tenant_1"
    })),
    stubMethod(prisma.session, "findUnique", (args: { where?: { token?: string } }) => {
      const userId = args.where?.token ? userByTokenHash[args.where.token] : undefined;

      if (!userId) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        expiresAt: new Date(Date.now() + 60_000),
        id: `session_${userId}`,
        organizationId: "org_1",
        tenantId: "tenant_1",
        revokedAt: null,
        userId
      });
    }),
    stubMethod(prisma.session, "update", () => Promise.resolve({ id: "session_any" })),
    stubMethod(prisma.user, "findUnique", (args: { where?: { id?: string } }) => Promise.resolve({
      id: args.where?.id ?? "",
      status: UserStatus.ACTIVE
    })),
    stubMethod(prisma.membership, "findMany", () => Promise.resolve([
      {
        createdAt: new Date("2026-03-13T00:00:00.000Z"),
        organizationId: "org_1",
        role: Role.MEMBER,
        status: MembershipStatus.ACTIVE,
        user: {
          email: "member@birthub.local",
          name: "Member Example",
          status: UserStatus.ACTIVE
        },
        userId: "user_member"
      }
    ])),
    stubMethod(
      prisma.membership,
      "findUnique",
      (args: { where?: { organizationId_userId?: { userId?: string } } }) => {
        const userId = args.where?.organizationId_userId?.userId ?? "";
        const role = roleByUserId[userId];

        if (!role) {
          return Promise.resolve(null);
        }

        return Promise.resolve({
          organizationId: "org_1",
          role,
          status: MembershipStatus.ACTIVE,
          userId
        });
      }
    )
  ];

  try {
    const app = createRbacApp();

    const ownerResponse = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer atk_owner")
      .expect(200);
    const ownerBody = ownerResponse.body as { items: unknown[] };
    assert.equal(Array.isArray(ownerBody.items), true);

    await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer atk_admin")
      .expect(200);

    await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer atk_member")
      .expect(403);

    await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer atk_readonly")
      .expect(403);

    await request(app)
      .get("/api/v1/users")
      .expect(401);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
