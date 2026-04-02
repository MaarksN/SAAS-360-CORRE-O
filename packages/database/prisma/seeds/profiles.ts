import { PrismaClient } from "@prisma/client";

import { buildStagingTenants, smokeTenants } from "./shared.js";
import { seedAgents } from "./seed-agents.js";
import { seedBilling } from "./seed-billing.js";
import { seedSupportArtifacts } from "./seed-support.js";
import { seedTenants } from "./seed-tenants.js";
import { seedUsers } from "./seed-users.js";
import { seedWorkflows } from "./seed-workflows.js";

export type SeedProfile = "ci" | "development" | "smoke" | "staging";

export async function runSeedProfile(prisma: PrismaClient, profile: SeedProfile) {
  const tenants = profile === "staging" ? buildStagingTenants() : profile === "smoke" || profile === "ci" ? smokeTenants : undefined;

  await seedTenants(prisma, tenants);
  await seedUsers(prisma, tenants);
  await seedAgents(prisma, tenants);
  await seedWorkflows(prisma, tenants);
  await seedBilling(prisma, tenants);
  await seedSupportArtifacts(prisma, tenants);
}
