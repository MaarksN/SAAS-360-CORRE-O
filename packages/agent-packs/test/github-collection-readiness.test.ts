import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { isInstallableManifest, loadManifestCatalog } from "@birthub/agents-core";

const REQUIRED_PROMPT_SECTIONS = [
  "IDENTIDADE E MISSAO",
  "QUANDO ACIONAR",
  "ENTRADAS OBRIGATORIAS",
  "RACIOCINIO OPERACIONAL ESPERADO",
  "MODO DE OPERACAO AUTONOMA",
  "ROTINA DE MONITORAMENTO E ANTECIPACAO",
  "CRITERIOS DE PRIORIZACAO",
  "CRITERIOS DE ESCALACAO",
  "OBJETIVOS PRIORITARIOS",
  "FERRAMENTAS ESPERADAS",
  "SAIDAS OBRIGATORIAS",
  "GUARDRAILS",
  "CHECKLIST DE QUALIDADE",
  "APRENDIZADO COMPARTILHADO",
  "FORMATO DE SAIDA"
] as const;

void test("official installable packs keep the required readiness contract", async () => {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFile), "..");
  const collectionRoot = path.join(packageRoot, "corporate-v1");
  const catalog = await loadManifestCatalog(collectionRoot);
  const installableEntries = catalog.filter((entry) => isInstallableManifest(entry.manifest));

  assert.ok(installableEntries.length > 0, "Expected installable manifests in the official collection.");

  for (const entry of installableEntries) {
    const { manifest } = entry;

    assert.ok(manifest.skills.length > 0, `${manifest.agent.id} must declare at least one skill.`);
    assert.ok(manifest.tools.length > 0, `${manifest.agent.id} must declare at least one tool.`);
    assert.ok(manifest.policies.length > 0, `${manifest.agent.id} must declare at least one policy.`);

    for (const section of REQUIRED_PROMPT_SECTIONS) {
      assert.match(
        manifest.agent.prompt,
        new RegExp(section),
        `${manifest.agent.id} is missing prompt section '${section}'.`
      );
    }
  }
});
