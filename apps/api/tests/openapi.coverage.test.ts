import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { openApiRouteCatalog } from "../src/docs/openapi.catalog.js";
import { openApiDocument } from "../src/docs/openapi.js";

type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

interface RouteSource {
  file: string;
  prefixes?: string[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const routePattern =
  /(?:app|router)\.(get|post|put|patch|delete)\(\s*(?:\/\/.*\n\s*)*(?:\r?\n\s*)*["'`]([^"'`]+)["'`]/gm;

const routeSources: RouteSource[] = [
  { file: "apps/api/src/app/auth-routes.ts" },
  { file: "apps/api/src/app/core-business-routes.ts" },
  { file: "apps/api/src/app/core.ts" },
  { file: "apps/api/src/modules/admin/router.ts" },
  { file: "apps/api/src/modules/agents/router.ts", prefixes: ["/api/v1/agents"] },
  { file: "apps/api/src/modules/analytics/router.ts", prefixes: ["/api/v1/analytics"] },
  { file: "apps/api/src/modules/apikeys/router.ts", prefixes: ["/api/v1/apikeys"] },
  { file: "apps/api/src/modules/auth/router.ts", prefixes: ["/api/v1/auth"] },
  { file: "apps/api/src/modules/billing/router.ts", prefixes: ["/api/v1/billing"] },
  { file: "apps/api/src/modules/budget/budget-routes.ts", prefixes: ["/api/v1/budgets"] },
  { file: "apps/api/src/modules/connectors/router.ts", prefixes: ["/api/v1/connectors"] },
  { file: "apps/api/src/modules/dashboard/router.ts" },
  { file: "apps/api/src/modules/feedback/router.ts", prefixes: ["/api/v1"] },
  { file: "apps/api/src/modules/invites/router.ts", prefixes: ["/api/v1"] },
  {
    file: "apps/api/src/modules/marketplace/marketplace-routes.ts",
    prefixes: ["/api/v1/agents", "/api/v1/marketplace"]
  },
  { file: "apps/api/src/modules/notifications/router.ts", prefixes: ["/api/v1"] },
  { file: "apps/api/src/modules/organizations/router.ts", prefixes: ["/api/v1"] },
  { file: "apps/api/src/modules/outputs/output-routes.ts", prefixes: ["/api/v1/outputs"] },
  { file: "apps/api/src/modules/packs/pack-installer-routes.ts", prefixes: ["/api/v1/packs"] },
  { file: "apps/api/src/modules/privacy/router.ts", prefixes: ["/api/v1/privacy"] },
  { file: "apps/api/src/modules/sessions/router.ts", prefixes: ["/api/v1"] },
  { file: "apps/api/src/modules/users/router.ts", prefixes: ["/api/v1"] },
  { file: "apps/api/src/modules/webhooks/router.ts" },
  { file: "apps/api/src/modules/webhooks/stripe.router.ts", prefixes: ["/api/webhooks"] },
  { file: "apps/api/src/modules/workflows/router.ts" }
];

function joinPrefix(prefix: string, routePath: string): string {
  return routePath === "/" ? prefix : `${prefix}${routePath}`;
}

function normalizePath(routePath: string): string {
  return routePath.replace(/\/{2,}/g, "/");
}

function discoverRoutes(): string[] {
  const discovered = new Set<string>();

  for (const source of routeSources) {
    const filePath = path.join(repoRoot, source.file);
    const content = fs.readFileSync(filePath, "utf8");
    const prefixes = source.prefixes && source.prefixes.length > 0 ? source.prefixes : [""];

    for (const match of content.matchAll(routePattern)) {
      const method = match[1]?.toUpperCase() as HttpMethod | undefined;
      const routePath = match[2];

      if (!method || !routePath) {
        continue;
      }

      for (const prefix of prefixes) {
        const fullPath = normalizePath(prefix ? joinPrefix(prefix, routePath) : routePath);
        discovered.add(`${method} ${fullPath}`);
      }
    }
  }

  return [...discovered].sort();
}

function documentedRoutes(): string[] {
  return openApiRouteCatalog
    .map((entry) => `${entry.method.toUpperCase()} ${entry.path}`)
    .sort();
}

void test("OpenAPI coverage matches the canonical route surface", () => {
  const runtimeRoutes = discoverRoutes();
  const documented = documentedRoutes();

  const undocumented = runtimeRoutes.filter((route) => !documented.includes(route));
  const stale = documented.filter((route) => !runtimeRoutes.includes(route));

  assert.deepEqual(undocumented, []);
  assert.deepEqual(stale, []);
  assert.ok(runtimeRoutes.length >= 70, "Expected at least 70 documented routes in the canonical surface.");
});

void test("OpenAPI document exposes representative canonical routes", () => {
  const paths = openApiDocument.paths;

  assert.ok(paths["/api/v1/auth/login"]?.post);
  assert.ok(paths["/api/v1/agents/installed"]?.get);
  assert.ok(paths["/api/v1/marketplace/search"]?.get);
  assert.ok(paths["/api/v1/workflows/:id/run"]?.post);
  assert.ok(paths["/api/v1/settings/webhooks"]?.get);
  assert.ok(paths["/api/v1/billing/checkout"]?.post);
  assert.ok(paths["/api/webhooks/stripe"]?.post);
});
