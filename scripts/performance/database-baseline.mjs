import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";

import { PrismaClient } from "@birthub/database";

const databaseUrl = process.env.DATABASE_URL ?? "";
const artifactPath = path.join(process.cwd(), "artifacts", "performance", "database-baseline.json");
mkdirSync(path.dirname(artifactPath), { recursive: true });

if (!databaseUrl) {
  writeFileSync(artifactPath, JSON.stringify({ generatedAt: new Date().toISOString(), skipped: true, reason: "DATABASE_URL not configured" }, null, 2) + "\n", "utf8");
  process.exit(0);
}

const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = databaseUrl;
const prisma = new PrismaClient();

try {
  const organization = await prisma.organization.create({
    data: {
      name: "Performance Tenant",
      slug: `performance-${Date.now()}`
    }
  });

  await prisma.customer.createMany({
    data: Array.from({ length: 10000 }, (_, index) => ({
      email: `perf-${index}@birthub.local`,
      name: `Perf Customer ${index}`,
      organizationId: organization.id,
      status: "active",
      tenantId: organization.tenantId
    }))
  });

  const startedAt = performance.now();
  await prisma.customer.findMany({
    orderBy: { id: "asc" },
    take: 100,
    where: { tenantId: organization.tenantId }
  });
  const durationMs = performance.now() - startedAt;
  const summary = {
    durationMs,
    generatedAt: new Date().toISOString(),
    passed: durationMs < 100,
    thresholdMs: 100
  };
  writeFileSync(artifactPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  if (!summary.passed) {
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
  if (previousDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = previousDatabaseUrl;
  }
}
