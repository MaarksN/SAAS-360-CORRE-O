import { PrismaClient } from "@prisma/client";

import { developmentTenants, ensureAgents, ensureOrganization, seedPlanCatalog, type TenantSeed } from "./shared.js";

export async function seedAgents(prisma: PrismaClient, tenants: TenantSeed[] = developmentTenants) {
  const planMap = await seedPlanCatalog(prisma);

  for (const tenant of tenants) {
    const organization = await ensureOrganization(prisma, tenant, planMap);
    await ensureAgents(prisma, tenant, organization.id, organization.tenantId);
  }
}
