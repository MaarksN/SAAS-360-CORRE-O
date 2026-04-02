import { PrismaClient } from "@prisma/client";

import { developmentTenants, ensureOrganization, ensureWorkflows, seedPlanCatalog, type TenantSeed } from "./shared.js";

export async function seedWorkflows(prisma: PrismaClient, tenants: TenantSeed[] = developmentTenants) {
  const planMap = await seedPlanCatalog(prisma);

  for (const tenant of tenants) {
    const organization = await ensureOrganization(prisma, tenant, planMap);
    await ensureWorkflows(prisma, organization.id, organization.tenantId);
  }
}
