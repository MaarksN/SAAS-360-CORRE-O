import assert from "node:assert/strict";
import test from "node:test";

import { MembershipStatus, Role, UserStatus, prisma } from "@birthub/database";
import request from "supertest";

import { createApp } from "../src/app.js";
import { sha256 } from "../src/modules/auth/crypto.js";
import { createTestApiConfig } from "./test-config.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

function createAuthenticatedAdminStubs() {
  return [
    stubMethod(prisma.session, "findUnique", (args: { where?: { token?: string } }) => {
      if (args.where?.token !== sha256("atk_admin")) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        expiresAt: new Date(Date.now() + 60_000),
        id: "session_1",
        organizationId: "org_1",
        tenantId: "tenant_1",
        revokedAt: null,
        userId: "user_1"
      });
    }),
    stubMethod(prisma.session, "update", () => Promise.resolve({ id: "session_1" })),
    stubMethod(prisma.user, "findUnique", () => Promise.resolve({
      id: "user_1",
      status: UserStatus.ACTIVE
    })),
    stubMethod(prisma.membership, "findUnique", () => Promise.resolve({
      organizationId: "org_1",
      role: Role.ADMIN,
      status: MembershipStatus.ACTIVE,
      userId: "user_1"
    }))
  ];
}

void test("webhook settings reject loopback targets", async () => {
  const restores = [...createAuthenticatedAdminStubs()];

  try {
    const app = createApp({
      config: createTestApiConfig(),
      shouldExposeDocs: false
    });

    const response = await request(app)
      .post("/api/v1/settings/webhooks")
      .set("Authorization", "Bearer atk_admin")
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .send({
        topics: ["workflow.completed"],
        url: "http://127.0.0.1:8080/internal"
      })
      .expect(400);

    const body = response.body as { detail?: string };
    assert.match(String(body.detail ?? ""), /not allowed|invalid/i);
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
