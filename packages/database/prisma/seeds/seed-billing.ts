import { PrismaClient } from "@prisma/client";

import { developmentTenants, ensureBilling, ensureOrganization, seedPlanCatalog, type TenantSeed } from "./shared.js";

export async function seedBilling(prisma: PrismaClient, tenants: TenantSeed[] = developmentTenants) {
  const planMap = await seedPlanCatalog(prisma);

  for (const tenant of tenants) {
    const organization = await ensureOrganization(prisma, tenant, planMap);
    await ensureBilling(prisma, tenant, organization.id, organization.tenantId, planMap);
  }
}
