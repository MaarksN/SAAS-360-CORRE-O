import { performance } from "node:perf_hooks";
import { createPrismaClient } from "@birthub/database";
import { PackInstallerService } from "../../src/modules/packs/pack-installer.service.js";

async function runBenchmark() {
  const prisma = createPrismaClient();
  const service = new PackInstallerService();
  const tenantId = `bench-${Date.now()}`;
  const packId = "test-pack";

  console.log(`Setting up benchmark for tenant ${tenantId}...`);

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Benchmark Org",
      slug: `bench-org-${Date.now()}`,
      tenantId: tenantId,
    },
  });

  // Create 50 agents for this pack
  const agentCount = 50;
  console.log(`Creating ${agentCount} agents...`);

  for (let i = 0; i < agentCount; i++) {
    await prisma.agent.create({
      data: {
        name: `Agent ${i}`,
        tenantId: tenantId,
        organizationId: org.id,
        config: {
          packId: packId,
          installedVersion: "1.0.0",
          latestAvailableVersion: "1.0.0",
        },
      },
    });
  }

  console.log("Starting benchmark...");
  const start = performance.now();

  await service.updatePackVersion({
    actorId: "benchmark-runner",
    packId: packId,
    tenantId: tenantId,
    latestAvailableVersion: "1.1.0"
  });

  const end = performance.now();
  const duration = end - start;

  console.log(`Benchmark completed in ${duration.toFixed(2)}ms`);

  // Cleanup
  console.log("Cleaning up...");
  await prisma.agent.deleteMany({ where: { tenantId } });
  await prisma.organization.delete({ where: { id: org.id } });

  await prisma.$disconnect();

  return duration;
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
