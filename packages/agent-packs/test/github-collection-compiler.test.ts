import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { isInstallableManifest, loadManifestCatalog } from "@birthub/agents-core";
import { parseAgentManifest } from "@birthub/agents-core";

const OFFICIAL_COLLECTION_DESCRIPTOR_ID = "corporate-v1-catalog";
const OFFICIAL_INSTALLABLE_COUNT = 42;
const OFFICIAL_TOTAL_COUNT = 43;

void test("official agent pack catalog remains canonical and loadable", async () => {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFile), "..");
  const collectionRoot = path.join(packageRoot, "corporate-v1");
  const catalog = await loadManifestCatalog(collectionRoot);
  const installableCatalog = catalog.filter((entry) => isInstallableManifest(entry.manifest));
  const descriptor = catalog.find((entry) => entry.manifest.agent.id === OFFICIAL_COLLECTION_DESCRIPTOR_ID);
  const maestro = catalog.find((entry) => entry.manifest.agent.id === "maestro-orchestrator-pack");

  assert.equal(catalog.length, OFFICIAL_TOTAL_COUNT);
  assert.equal(installableCatalog.length, OFFICIAL_INSTALLABLE_COUNT);
  assert.ok(descriptor, "Expected official collection descriptor manifest.");
  assert.ok(maestro, "Expected maestro-orchestrator-pack in the official collection.");
  assert.match(maestro.manifest.agent.prompt, /IDENTIDADE E MISSAO/);
  assert.match(maestro.manifest.agent.prompt, /FORMATO DE SAIDA/);
});

void test("official manifests remain parseable from disk", async () => {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFile), "..");
  const collectionRoot = path.join(packageRoot, "corporate-v1");
  const catalog = await loadManifestCatalog(collectionRoot);

  for (const entry of catalog) {
    assert.doesNotThrow(() => parseAgentManifest(entry.manifest));
  }
});
