import { tenants } from "./seed/data.js";
import {
  disconnectSeedClient,
  seedPlans,
  wipeDatabase
} from "./seed/helpers.js";
import {
  createTenant,
  disconnectTenantClient
} from "./seed/tenant.js";
import { disconnectWorkflowClient } from "./seed/workflows.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-seed");

async function main(): Promise<void> {
  await wipeDatabase();
  const seededPlans = await seedPlans();

  for (const tenant of tenants) {
    await createTenant(tenant, seededPlans);
  }
}

main()
  .catch((error) => {
    logger.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([
      disconnectSeedClient(),
      disconnectTenantClient(),
      disconnectWorkflowClient()
    ]);
  });
