import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  isInstallableManifest,
  loadManifestCatalog,
  runAgentDryRun
} from "@birthub/agents-core";

void test("dry-run smoke execution works for every manifest", async () => {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFile), "..");
  const catalogRoot = packageRoot;
  const catalog = await loadManifestCatalog(catalogRoot);
  const installableCatalog = catalog.filter((entry) => isInstallableManifest(entry.manifest));
  const catalogDescriptors = catalog.filter((entry) => !isInstallableManifest(entry.manifest));
  const officialCollectionRoot = path.join(packageRoot, "corporate-v1");
  const officialCatalog = catalog.filter((entry) => entry.manifestPath.startsWith(officialCollectionRoot));
  const officialInstallableCatalog = officialCatalog.filter((entry) => isInstallableManifest(entry.manifest));
  const officialCatalogDescriptors = officialCatalog.filter((entry) => !isInstallableManifest(entry.manifest));

  assert.ok(catalog.length >= 43);
  assert.ok(installableCatalog.length >= 42);
  assert.ok(catalogDescriptors.length >= 1);
  assert.equal(officialCatalog.length, 43);
  assert.equal(officialInstallableCatalog.length, 42);
  assert.equal(officialCatalogDescriptors.length, 1);

  for (const entry of catalog) {
    const result = await runAgentDryRun(entry.manifest);

    assert.ok(result.logs.some((log) => log.includes("Simulating LLM call")));
    assert.ok(result.outputHash.length === 64);
  }
});
