import { PrismaClient } from "@prisma/client";

import { developmentTenants, ensureOrganization, ensureUsers, seedPlanCatalog, type TenantSeed } from "./shared.js";

export async function seedUsers(prisma: PrismaClient, tenants: TenantSeed[] = developmentTenants) {
  const planMap = await seedPlanCatalog(prisma);

  for (const tenant of tenants) {
    const organization = await ensureOrganization(prisma, tenant, planMap);
    await ensureUsers(prisma, tenant, organization.id, organization.tenantId);
  }
}
