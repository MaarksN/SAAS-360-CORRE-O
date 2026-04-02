import { PrismaClient } from "@prisma/client";

import { developmentTenants, ensureOrganization, seedPlanCatalog, type TenantSeed } from "./shared.js";

export async function seedTenants(prisma: PrismaClient, tenants: TenantSeed[] = developmentTenants) {
  const planMap = await seedPlanCatalog(prisma);

  for (const tenant of tenants) {
    await ensureOrganization(prisma, tenant, planMap);
  }

  return planMap;
}
