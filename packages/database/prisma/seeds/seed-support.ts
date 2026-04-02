import { PrismaClient } from "@prisma/client";

import { developmentTenants, ensureOrganization, ensureSupportArtifacts, ensureUsers, seedPlanCatalog, type TenantSeed } from "./shared.js";

export async function seedSupportArtifacts(prisma: PrismaClient, tenants: TenantSeed[] = developmentTenants) {
  const planMap = await seedPlanCatalog(prisma);

  for (const tenant of tenants) {
    const organization = await ensureOrganization(prisma, tenant, planMap);
    const users = await ensureUsers(prisma, tenant, organization.id, organization.tenantId);
    await ensureSupportArtifacts(prisma, tenant, organization.id, organization.tenantId, users[0]?.id);
  }
}
