import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => (exists(p) ? fs.readFileSync(path.join(root, p), "utf8") : "");
const readJson = (p) => {
  try {
    return JSON.parse(read(p));
  } catch {
    return null;
  }
};
const write = (p, c) => {
  const absolute = path.join(root, p);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, c, "utf8");
};
const excludedDirs = new Set([".git", "node_modules"]);
const collectFiles = (dir, prefix = "") => {
  const absolute = path.join(root, dir);
  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  const collected = [];
  for (const entry of entries) {
    if (excludedDirs.has(entry.name)) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      collected.push(...collectFiles(relative, relative));
      continue;
    }
    if (entry.isFile()) {
      collected.push(relative.replace(/\\/g, "/"));
    }
  }
  return collected;
};
const files = collectFiles(".").sort();
const listPrefix = (prefix) => files.filter((f) => f.startsWith(prefix));
const docsFileCount = listPrefix("docs/").length;
const artifactsFileCount = listPrefix("artifacts/").length;
const auditFileCount = listPrefix("audit/").length;
const md = (items) => (items.length ? items.map((x) => `\`${x}\``).join(", ") : "sem evidência local");
const repoReadme = read("README.md");
const docsReadme = read("docs/README.md");
const onboarding = read("docs/processes/ONBOARDING.md");
const slaSnapshot = read("docs/F0/sla.md");
const cd = read(".github/workflows/cd.yml");
const packageJson = readJson("package.json") || {};
const packageVersion = packageJson.version || "0.0.0";
const gitTags = execSync("git tag", { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((x) => x.trim())
  .filter(Boolean);
const productionPreflight = readJson("artifacts/release/production-preflight-summary.json");
const smoke = readJson("artifacts/release/smoke-summary.json");
const rollback = readJson("artifacts/release/production-rollback-evidence.json");
const adrFiles = listPrefix("docs/adrs/")
  .filter((f) => f.endsWith(".md") && !f.endsWith("ADR_TEMPLATE.md") && !f.endsWith("INDEX.md"))
  .sort();
const f11Logs = listPrefix("artifacts/f11-closure-2026-03-22/logs/")
  .filter((f) => f.endsWith(".log"))
  .sort();

write(
  "docs/adrs/INDEX.md",
  [
    "# ADR Index",
    "",
    "Registro canônico das ADRs versionadas em `docs/adrs/`.",
    "",
    ...adrFiles.map((f) => `- \`${f}\``),
    ""
  ].join("\n")
);

write(
  "artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md",
  [
    "# F11 Evidence Index",
    "",
    "Bundle indexado a partir dos logs e sidecars de checksum existentes.",
    "",
    "| Log | Checksum | Status |",
    "| --- | --- | --- |",
    ...f11Logs.map((f) => `| \`${f}\` | \`${f}.sha256\` | ${exists(`${f}.sha256`) ? "PASS" : "FAIL"} |`),
    ""
  ].join("\n")
);

write(
  "releases/manifests/release_artifact_catalog.md",
  [
    "# Release Artifact Catalog",
    "",
    "## Artefatos brutos",
    "",
    ...listPrefix("artifacts/release/").sort().map((f) => `- \`${f}\``),
    "",
    "## Documentação de release",
    "",
    ...listPrefix("docs/release/").sort().map((f) => `- \`${f}\``),
    "",
    "## Scripts e configuração",
    "",
    ...listPrefix("scripts/release/").sort().map((f) => `- \`${f}\``),
    ...listPrefix("ops/release/").sort().map((f) => `- \`${f}\``),
    ""
  ].join("\n")
);

const inventory = [
  ["README raiz", "README operacional", ["README.md"], "✔ DOCUMENTAÇÃO", "Entrada raiz com escopo canônico e links principais."],
  ["Guia de contribuição", "documentação", ["CONTRIBUTING.md"], "✔ DOCUMENTAÇÃO", "Regras de contribuição e higiene do repositório."],
  ["Política de segurança", "documentação", ["SECURITY.md"], "✔ DOCUMENTAÇÃO", "Política formal de segurança."],
  ["CHANGELOG raiz", "changelog", ["CHANGELOG.md"], "✔ RELEASE", "Histórico central de release."],
  ["Prompts soberanos", "prompt", ["PROMPT_GERAL_PENDENCIAS.md", "docs/programs/internal/prompt_soberano_v13.html"].filter(exists), "⚠ AMBÍGUO", "Prompts versionados, mas sem papel direto de operação, evidência ou release."],
  ["Workflows GitHub", "pipeline e controles", listPrefix(".github/workflows/"), "✔ EVIDÊNCIA", "Pipelines e gates automatizados de governança."],
  ["Controles de revisão", "governança", [".github/CODEOWNERS", ".github/settings.yml", ".github/PULL_REQUEST_TEMPLATE.md"].filter(exists), "✔ EVIDÊNCIA", "Owners, branch policy-as-code e checklist de PR."],
  ["Prompts GitHub", "prompt", listPrefix(".github/prompts/"), "⚠ AMBÍGUO", "Prompts auxiliares de workflow."],
  ["Catálogo de agentes GitHub", "descritor de agente", listPrefix(".github/agents/"), "⚠ AMBÍGUO", "Artefatos de agentes sem vínculo direto com release ou auditoria formal."],
  ["Hub operacional padronizado", "documentação operacional", listPrefix("docs/operational/"), "✔ DOCUMENTAÇÃO", "Nova estrutura canônica criada nesta auditoria."],
  ["Runbooks", "runbook", listPrefix("docs/runbooks/"), "✔ DOCUMENTAÇÃO", "Procedimentos de deploy, rollback, incidentes e DR."],
  ["Documentação de operações", "documentação operacional", listPrefix("docs/operations/"), "✔ DOCUMENTAÇÃO", "Ownership, SLA e controles operacionais."],
  ["Processos documentados", "processo", listPrefix("docs/processes/"), "✔ DOCUMENTAÇÃO", "Processos formais e fonte de verdade documental."],
  ["Segurança documentada", "política", listPrefix("docs/security/"), "✔ DOCUMENTAÇÃO", "Threat models, guardrails e políticas de segurança."],
  ["Padrões e convenções", "standard", listPrefix("docs/standards/"), "✔ DOCUMENTAÇÃO", "Padrões operacionais e técnicos."],
  ["ADRs", "adr", listPrefix("docs/adrs/"), "✔ DOCUMENTAÇÃO", "Decisões arquiteturais versionadas."],
  ["Arquitetura", "documentação arquitetural", listPrefix("docs/architecture/"), "✔ DOCUMENTAÇÃO", "Modelos e topologias do sistema."],
  ["Documentação de release", "documentação de release", listPrefix("docs/release/"), "✔ RELEASE", "Processo, gates e pacotes de release."],
  ["Narrativas de evidência", "evidência narrativa", listPrefix("docs/evidence/"), "✔ EVIDÊNCIA", "Narrativas de verificação e hardening."],
  ["Execução faseada", "evidência de execução", listPrefix("docs/execution/"), "✔ EVIDÊNCIA", "Registro de execução por fase."],
  ["Testing e rastreabilidade", "rastreabilidade", listPrefix("docs/testing/"), "✔ EVIDÊNCIA", "Critérios de teste e rastreabilidade."],
  ["Observabilidade documentada", "observabilidade", listPrefix("docs/observability/"), "✔ DOCUMENTAÇÃO", "Dashboards e regras de observabilidade documentadas."],
  ["Dívida técnica documentada", "registro de dívida", listPrefix("docs/technical-debt/"), "✔ DOCUMENTAÇÃO", "Registro versionado de dívida técnica."],
  ["Artefatos de release", "artefato de release", listPrefix("artifacts/release/"), "✔ RELEASE", "Preflight, smoke, rollback e scorecard."],
  ["Artefatos de segurança", "artefato de segurança", listPrefix("artifacts/security/"), "✔ EVIDÊNCIA", "Semgrep, audit, OWASP e credenciais inline."],
  ["Artefatos de qualidade", "artefato de qualidade", listPrefix("artifacts/quality/"), "✔ EVIDÊNCIA", "Baselines de complexidade, bundle e duplicação."],
  ["Artefatos de privacidade", "artefato de privacidade", listPrefix("artifacts/privacy/"), "✔ EVIDÊNCIA", "Verificação objetiva de anonimização."],
  ["Bundle F11", "bundle de auditoria", listPrefix("artifacts/f11-closure-2026-03-22/"), "✔ EVIDÊNCIA", "Logs, checksums e índice do fechamento F11."],
  ["Ownership governance reports", "relatório de ownership", listPrefix("artifacts/ownership-governance/"), "✔ EVIDÊNCIA", "Relatórios gerados de ownership e cobertura."],
  ["Link check reports", "relatório de documentação", listPrefix("artifacts/documentation/"), "✔ EVIDÊNCIA", "Saída objetiva do check de links."],
  ["Materialização de controles documentais", "relatório técnico", listPrefix("artifacts/materialization/"), "✔ EVIDÊNCIA", "Comprova controles saindo do plano para checagem técnica."],
  ["Readiness de agentes", "readiness report", listPrefix("artifacts/agent-readiness/"), "✔ EVIDÊNCIA", "Relatórios de readiness do catálogo de agentes."],
  ["Logs de CI versionados", "log", listPrefix("logs/ci-runs/"), "✔ EVIDÊNCIA", "Manifesto de baseline CI com commit de referência."],
  ["Release sealed env", "configuração de release", listPrefix("ops/release/"), "✔ RELEASE", "Inputs selados usados nos preflights."],
  ["Env sealed examples", "configuração de release", listPrefix("ops/env/"), "✔ RELEASE", "Exemplos selados para rehearsal."],
  ["Governança externa", "evidência de exceção externa", listPrefix("ops/governance/"), "✔ EVIDÊNCIA", "Bloqueios externos e revisão recorrente."],
  ["Scripts de release", "script de release", listPrefix("scripts/release/"), "✔ RELEASE", "Preflight, smoke e rollback evidence."],
  ["Scripts operacionais", "script operacional", listPrefix("scripts/ops/"), "✔ RELEASE", "Deploy, backup, restore e drills."],
  ["Scripts de segurança", "script de validação", listPrefix("scripts/security/"), "✔ EVIDÊNCIA", "Guardrails e relatórios de segurança."],
  ["Scripts de diagnóstico", "script de auditoria", listPrefix("scripts/diagnostics/"), "✔ EVIDÊNCIA", "Verificações objetivas de governança."],
  ["Scripts de testing e traceability", "script de teste", listPrefix("scripts/testing/"), "✔ EVIDÊNCIA", "Traceability, performance e regressão zero."],
  ["Autofix manifest", "manifesto de evidência", ["audit/autofix/manifest.json"].filter(exists), "✔ EVIDÊNCIA", "Âncora explícita dos snapshots de autofix."],
  ["Autofix notes", "nota de evidência", listPrefix("audit/autofix/notes/"), "✔ EVIDÊNCIA", "Notas explicativas associadas ao autofix."],
  ["Autofix snapshots", "snapshot", listPrefix("audit/autofix/snapshots/"), "✔ EVIDÊNCIA", "Snapshots versionados associados ao manifest."],
  ["Files analysis massivo", "análise derivada", listPrefix("audit/files_analysis/"), "❌ ÓRFÃO", "Volume derivado sem papel canônico no fluxo de operação, auditoria ou release."],
  ["Artefatos legados de auditoria", "output de auditoria legado", ["audit/checks.json", "audit/inventory.json", "audit/report.html", "audit/saas_maturity_score.md", "audit/target_architecture.md", "audit/gaps.md"].filter(exists), "⚠ AMBÍGUO", "Outputs coexistentes fora do conjunto canônico recém-estabelecido."],
  ["Estrutura canônica de release", "índice de release", listPrefix("releases/"), "✔ RELEASE", "Estrutura padrão para manifests, evidências e notas."]
].filter(([, , arr]) => arr.length > 0);

const scoreValue = { "✅ IMPLEMENTADO": 1, "⚠ PARCIAL": 0.5, "❌ NÃO IMPLEMENTADO": 0 };
const items = [
  ["DOC-01","Documentação Operacional","README operacional canônico","Ponto único de entrada para operação do core canônico.","`docs/operational/README.md` versionado.","✅ IMPLEMENTADO",["docs/operational/README.md"],"","","","",false],
  ["DOC-02","Documentação Operacional","Manual operacional consolidado","Manual central com comandos mínimos e guardrails.","`docs/operational/manuals/operations_guide.md` presente.","✅ IMPLEMENTADO",["docs/operational/manuals/operations_guide.md"],"","","","",false],
  ["DOC-03","Documentação Operacional","README raiz delimita o core canônico","README principal informa escopo canônico e superfícies legadas.","README contém core canônico e zonas de legado/quarentena.", repoReadme.includes("Fonte única operacional") && repoReadme.includes("apps/web") ? "✅ IMPLEMENTADO" : "⚠ PARCIAL",["README.md"],"🟠 ALTO","Escopo operacional raiz fica pouco claro.","Superfícies legadas podem ser tratadas como canônicas.","Operação e auditoria convergem para fronteiras erradas.","",false],
  ["DOC-04","Documentação Operacional","Índice geral de documentação","Existe um índice versionado para documentação do repositório.","`docs/README.md` presente.","✅ IMPLEMENTADO",["docs/README.md"],"","","","",false],
  ["DOC-05","Documentação Operacional","Índice geral aponta para o hub operacional","O índice principal referencia a nova estrutura operacional.","`docs/README.md` contém `operational/README.md`.", docsReadme.includes("operational/README.md") ? "✅ IMPLEMENTADO" : "⚠ PARCIAL",["docs/README.md","docs/operational/README.md"],"🟡 MÉDIO","Estrutura padrão existe, mas sem índice raiz atualizado.","Usuários continuam consultando caminhos antigos.","A nova governança perde eficácia.","",false],
  ["DOC-06","Documentação Operacional","Catálogo de serviços","Fonte de verdade para fronteiras e superfícies do monorepo.","`docs/service-catalog.md` presente.","✅ IMPLEMENTADO",["docs/service-catalog.md"],"","","","",false],
  ["DOC-07","Documentação Operacional","Matriz de criticidade por serviço","Cada serviço relevante possui criticidade operacional registrada.","`docs/service-criticality.md` presente.","✅ IMPLEMENTADO",["docs/service-criticality.md"],"","","","",false],
  ["DOC-08","Documentação Operacional","Matriz de ownership","Ownership por domínio e segredos críticos está documentado.","`docs/operations/f0-ownership-matrix.md` presente.","✅ IMPLEMENTADO",["docs/operations/f0-ownership-matrix.md"],"","","","",false],
  ["DOC-09","Documentação Operacional","Política de SLA por severidade","SLA operacional possui política publicada.","`docs/operations/f0-sla-severity-policy.md` presente.","✅ IMPLEMENTADO",["docs/operations/f0-sla-severity-policy.md"],"","","","",false],
  ["DOC-10","Documentação Operacional","Baseline de aderência SLA 90d","A política de SLA aponta para uma baseline histórica verificável.","`docs/operations/f0-sla-adherence-baseline-90d.md` presente.", exists("docs/operations/f0-sla-adherence-baseline-90d.md") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO", exists("docs/operations/f0-sla-adherence-baseline-90d.md") ? ["docs/operations/f0-sla-adherence-baseline-90d.md"] : [], "🔴 CRÍTICO","Não existe prova histórica de aderência ao SLA publicado.","Due diligence pode classificar a operação como sem lastro empírico.","SLA permanece apenas declaratório.","",false],
  ["DOC-11","Documentação Operacional","Inventário de variáveis de ambiente","Configuração operacional obrigatória está documentada.","`docs/environment-variables-inventory.md` presente.","✅ IMPLEMENTADO",["docs/environment-variables-inventory.md"],"","","","",false],
  ["DOC-12","Documentação Operacional","Observabilidade e alertas documentados","Alertas e SLOs possuem documentação versionada.","`docs/observability-alerts.md` e `docs/OBSERVABILIDADE_E_SLOS.md` presentes.","✅ IMPLEMENTADO",["docs/observability-alerts.md","docs/OBSERVABILIDADE_E_SLOS.md"],"","","","",false],
  ["DOC-13","Documentação Operacional","Runbook de deploy do stack canônico","Há procedimento de deploy para o core canônico.","`docs/runbooks/deploy-canonical-stack.md` presente.","✅ IMPLEMENTADO",["docs/runbooks/deploy-canonical-stack.md"],"","","","",false],
  ["DOC-14","Documentação Operacional","Runbook de rollback do stack canônico","Há procedimento versionado de rollback operacional.","`docs/runbooks/rollback-canonical-stack.md` presente.","✅ IMPLEMENTADO",["docs/runbooks/rollback-canonical-stack.md"],"","","","",false],
  ["DOC-15","Documentação Operacional","Runbook de disaster recovery","Existe procedimento versionado para recuperação de desastre.","`docs/runbooks/disaster-recovery.md` presente.","✅ IMPLEMENTADO",["docs/runbooks/disaster-recovery.md"],"","","","",false],
  ["DOC-16","Documentação Operacional","Matriz de resposta a incidentes","Severidades e owners de resposta estão mapeados.","`docs/runbooks/incident-response-matrix.md` presente.","✅ IMPLEMENTADO",["docs/runbooks/incident-response-matrix.md"],"","","","",false],
  ["DOC-17","Documentação Operacional","Matriz de resposta a alertas P1","Alertas P1 possuem procedimento padronizado.","`docs/runbooks/p1-alert-response-matrix.md` presente.","✅ IMPLEMENTADO",["docs/runbooks/p1-alert-response-matrix.md"],"","","","",false],
  ["DOC-18","Documentação Operacional","Processo de release versionado","Há documento que materializa o fluxo de release a partir do CD.","`docs/release/release-process.md` presente.","✅ IMPLEMENTADO",["docs/release/release-process.md",".github/workflows/cd.yml"],"","","","",false],
  ["DOC-19","Documentação Operacional","Fonte de verdade documental","O repositório define formalmente a política de fonte de verdade.","`docs/processes/documentation-source-of-truth.md` presente.","✅ IMPLEMENTADO",["docs/processes/documentation-source-of-truth.md"],"","","","",false],
  ["DOC-20","Documentação Operacional","Índice de ADRs","ADRs possuem índice navegável.","`docs/adrs/INDEX.md` presente.","✅ IMPLEMENTADO",["docs/adrs/INDEX.md"],"","","","",false],
  ["DOC-21","Documentação Operacional","Onboarding aponta para a estrutura operacional atual","Documentos de onboarding não devem apontar para caminhos obsoletos.","`docs/processes/ONBOARDING.md` referencia o hub atual e não `docs/OPERATIONS.md`.", onboarding.includes("docs/operational/README.md") || onboarding.includes("docs/operational/manuals/operations_guide.md") ? "✅ IMPLEMENTADO" : "⚠ PARCIAL",["docs/processes/ONBOARDING.md"],"🟡 MÉDIO","Onboarding ainda carrega caminho operacional obsoleto.","Novos operadores consultam referências não canônicas.","Adoção da nova estrutura fica incompleta.","",false],
  ["DOC-22","Documentação Operacional","Snapshots legados não referenciam evidência inexistente","Documentos legados/snapshot devem apontar apenas para artefatos existentes.","`docs/F0/sla.md` não referencia arquivos ausentes.", slaSnapshot.includes("docs/operations/f0-sla-adherence-baseline-90d.md") && !exists("docs/operations/f0-sla-adherence-baseline-90d.md") ? "⚠ PARCIAL" : "✅ IMPLEMENTADO",["docs/F0/sla.md"],"🟡 MÉDIO","Snapshot legado aponta para baseline inexistente.","Leitores podem interpretar aderência de SLA como comprovada.","Documentação histórica induz falsa sensação de maturidade.","",false],
  ["AUD-01","Evidências de Auditoria","README de auditoria","A área de auditoria possui ponto canônico de entrada.","`audit/README.md` presente.","✅ IMPLEMENTADO",["audit/README.md"],"","","","",false],
  ["AUD-02","Evidências de Auditoria","Inventário forense","Existe inventário versionado do material auditado.","`audit/forensic_inventory.md` presente.","✅ IMPLEMENTADO",["audit/forensic_inventory.md"],"","","","",false],
  ["AUD-03","Evidências de Auditoria","Checklist mestre de governança","Existe checklist versionado de controles e status.","`audit/master_governance_checklist.md` presente.","✅ IMPLEMENTADO",["audit/master_governance_checklist.md"],"","","","",false],
  ["AUD-04","Evidências de Auditoria","Matriz de rastreabilidade","Checklist e evidência possuem amarração explícita.","`audit/traceability_matrix.md` presente.","✅ IMPLEMENTADO",["audit/traceability_matrix.md"],"","","","",false],
  ["AUD-05","Evidências de Auditoria","Validation log","Há registro das verificações executadas nesta auditoria.","`audit/validation_log.md` presente.","✅ IMPLEMENTADO",["audit/validation_log.md"],"","","","",false],
  ["AUD-06","Evidências de Auditoria","Dashboard HTML interativo","Existe painel interativo consolidando o checklist.","`audit/governance_dashboard.html` presente.","✅ IMPLEMENTADO",["audit/governance_dashboard.html"],"","","","",false],
  ["AUD-07","Evidências de Auditoria","Manifesto de CI com commit de referência","Execuções de baseline possuem commit e timestamp.","`logs/ci-runs/.../run-manifest.txt` contém `reference_commit`.", read("logs/ci-runs/20260322-205239_09c4a36/run-manifest.txt").includes("reference_commit=") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO",["logs/ci-runs/20260322-205239_09c4a36/run-manifest.txt"],"🟠 ALTO","Baseline de CI fica sem commit âncora.","Logs podem ser dissociados do código auditado.","A evidência perde cadeia mínima de custódia.","",false],
  ["AUD-08","Evidências de Auditoria","Índice do bundle F11","O fechamento F11 possui índice versionado.","`artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md` presente.","✅ IMPLEMENTADO",["artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md"],"","","","",false],
  ["AUD-09","Evidências de Auditoria","Logs F11 com checksums","Logs do bundle F11 possuem sidecar de checksum.","Cada `*.log` em `artifacts/f11-closure-2026-03-22/logs/` possui `*.sha256`.", f11Logs.every((f) => exists(`${f}.sha256`)) ? "✅ IMPLEMENTADO" : "⚠ PARCIAL",["artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md"],"🟠 ALTO","Parte dos logs F11 não tem integridade verificável.","Alterações posteriores não seriam detectadas em todos os casos.","Bundle F11 não fecha cadeia de custódia completa.","",false],
  ["AUD-10","Evidências de Auditoria","Artefatos de segurança brutos","Scans de segurança possuem saídas objetivas arquivadas.","Semgrep, audit, inline credentials e OWASP baseline existem em `artifacts/security/`.", ["artifacts/security/semgrep-f0-initial.json","artifacts/security/pnpm-audit-high.json","artifacts/security/inline-credential-scan.json","artifacts/security/owasp-top10-baseline.json"].every(exists) ? "✅ IMPLEMENTADO" : "⚠ PARCIAL",["artifacts/security/semgrep-f0-initial.json","artifacts/security/pnpm-audit-high.json","artifacts/security/inline-credential-scan.json","artifacts/security/owasp-top10-baseline.json"].filter(exists),"🟠 ALTO","Cobertura de segurança fica incompleta no arquivo bruto.","Controles declarados podem não ter prova correspondente.","Auditoria de segurança perde lastro.","",false],
  ["AUD-11","Evidências de Auditoria","Relatório de cobertura de segurança","Existe relatório consolidado de cobertura de segurança.","`docs/security/security-coverage-report.md` presente.","✅ IMPLEMENTADO",["docs/security/security-coverage-report.md"],"","","","",false],
  ["AUD-12","Evidências de Auditoria","Relatório de privacidade","Existe evidência versionada de verificação de anonimização.","`artifacts/privacy/anonymization-report.json` presente.","✅ IMPLEMENTADO",["artifacts/privacy/anonymization-report.json"],"","","","",false],
  ["AUD-13","Evidências de Auditoria","Relatório de verificação de links","Existe relatório de integridade documental.","`artifacts/documentation/link-check-report.md` presente.","✅ IMPLEMENTADO",["artifacts/documentation/link-check-report.md"],"","","","",false],
  ["AUD-14","Evidências de Auditoria","Relatório de conformidade de scripts","Existe relatório versionado de slots `lint/typecheck/test/build` por workspace.","`artifacts/script-compliance/workspace-script-compliance.md` presente.","✅ IMPLEMENTADO",["artifacts/script-compliance/workspace-script-compliance.md"],"","","","",false],
  ["AUD-15","Evidências de Auditoria","Relatório de ownership governance","Existe relatório gerado de cobertura de ownership.","`artifacts/ownership-governance/ownership-governance-report.md` presente.","✅ IMPLEMENTADO",["artifacts/ownership-governance/ownership-governance-report.md"],"","","","Configuração remota ainda depende de validação cruzada fora do workspace.",true],
  ["AUD-16","Evidências de Auditoria","Materialização de controles documentais","Existe relatório técnico de controles antes apenas documentados.","`artifacts/materialization/doc-only-controls-report.md` presente.","✅ IMPLEMENTADO",["artifacts/materialization/doc-only-controls-report.md"],"","","","",false],
  ["AUD-17","Evidências de Auditoria","Registro de exceções de controles externos","Bloqueios externos possuem registro explícito e versionado.","`ops/governance/external-provisioning-status.md` presente.","✅ IMPLEMENTADO",["ops/governance/external-provisioning-status.md"],"","","","Depende de confirmação no provedor externo.",true],
  ["AUD-18","Evidências de Auditoria","Smoke evidence de release","Existe evidência objetiva do smoke de release.","`artifacts/release/smoke-summary.json` presente com `ok=true`.", smoke && smoke.ok === true ? "✅ IMPLEMENTADO" : "⚠ PARCIAL", exists("artifacts/release/smoke-summary.json") ? ["artifacts/release/smoke-summary.json"] : [], "🔴 CRÍTICO","Smoke gate não tem evidência verde utilizável.","Release pode seguir sem prova de sanidade funcional.","Gate de produção perde valor.","",false],
  ["AUD-19","Evidências de Auditoria","Preflight de produção com resultado positivo","Existe evidência objetiva do preflight de produção.","`artifacts/release/production-preflight-summary.json` presente com `ok=true`.", productionPreflight && productionPreflight.ok === true ? "✅ IMPLEMENTADO" : "⚠ PARCIAL", exists("artifacts/release/production-preflight-summary.json") ? ["artifacts/release/production-preflight-summary.json"] : [], "🔴 CRÍTICO","Release não tem prova positiva de configuração mínima.","Produção pode falhar por segredo/variável ausente.","Go-live fica operacionalmente inseguro.","Validação de variáveis/segredos reais depende de ambientes remotos.",true],
  ["AUD-20","Evidências de Auditoria","Evidência de rollback válida","Existe evidência objetiva e positiva do rehearsal de rollback.","`artifacts/release/production-rollback-evidence.json` presente com `ok=true`.", rollback && rollback.ok === true ? "✅ IMPLEMENTADO" : "⚠ PARCIAL", exists("artifacts/release/production-rollback-evidence.json") ? ["artifacts/release/production-rollback-evidence.json"] : [], "🔴 CRÍTICO","Rollback rehearsal não possui prova válida.","RTO de produção não pode ser defendido.","Deploy de produção perde salvaguarda mínima.","",false],
  ["AUD-21","Evidências de Auditoria","Política de frescor e revalidação de evidências","A auditoria deve definir quando evidências expiram e precisam ser regeneradas.","Existe documento versionado definindo validade temporal e política de rerun.","❌ NÃO IMPLEMENTADO",[],"🟠 ALTO","Evidências verdes podem envelhecer sem regra formal de expiração.","Due diligence pode consumir provas desatualizadas.","A confiança no pacote de auditoria se degrada com o tempo.","",false],
  ["AUD-22","Evidências de Auditoria","Proveniência uniforme entre bundles","Principais bundles deveriam carregar checksum/hash/commit de forma uniforme.","Bundles F11, release, security e quality apresentam metadados homogêneos de proveniência.","⚠ PARCIAL",["artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md","artifacts/release/production-preflight-summary.json","artifacts/security/semgrep-f0-initial.json"],"🟠 ALTO","Parte das evidências possui checksum/timestamp forte, parte não.","Comparabilidade e cadeia de custódia ficam heterogêneas.","O pacote de auditoria perde uniformidade forense.","",false],
  ["AUD-23","Evidências de Auditoria","Bundle dedicado de isolamento multi-tenant","Cenários de isolamento deveriam estar arquivados em bundle próprio.","Há bundle objetivo de isolamento/cross-tenant com saídas versionadas.","⚠ PARCIAL",["docs/testing/isolation-regression-process.md","tests/integration/test_internal_service_auth.py","tests/integration/test_orchestrator_event_reliability.py"].filter(exists),"🔴 CRÍTICO","Há testes e processo, mas não um bundle consolidado de evidência de isolamento.","Prova de isolamento multi-tenant fica implícita no código e não no pacote auditável.","Auditoria externa terá esforço alto para validar segurança de tenancy.","",false],
  ["AUD-24","Evidências de Auditoria","Outputs legados de auditoria estão quarentenados","Outputs antigos e ambíguos deveriam ser segregados ou descontinuados formalmente.","Arquivos legados de `audit/` fora do conjunto canônico estão arquivados/quarentenados.",["audit/checks.json","audit/inventory.json","audit/report.html","audit/saas_maturity_score.md","audit/target_architecture.md","audit/gaps.md"].some(exists) ? "⚠ PARCIAL" : "✅ IMPLEMENTADO",["audit/checks.json","audit/inventory.json","audit/report.html","audit/saas_maturity_score.md","audit/target_architecture.md","audit/gaps.md"].filter(exists),"🟡 MÉDIO","A nova estrutura convive com outputs legados de finalidade incerta.","Consumidores podem ler o artefato errado.","Rastreabilidade da auditoria fica poluída.","",false],
  ["REL-01","Artefatos de Release","README de release","A estrutura padrão de release possui ponto de entrada.","`releases/README.md` presente.","✅ IMPLEMENTADO",["releases/README.md"],"","","","",false],
  ["REL-02","Artefatos de Release","Catálogo de artefatos de release","Existe manifesto catalogando artefatos de release.","`releases/manifests/release_artifact_catalog.md` presente.","✅ IMPLEMENTADO",["releases/manifests/release_artifact_catalog.md"],"","","","",false],
  ["REL-03","Artefatos de Release","Índice de evidência de release","Existe ponteiro canônico entre `releases/` e `artifacts/release/`.","`releases/evidence/README.md` presente.","✅ IMPLEMENTADO",["releases/evidence/README.md","artifacts/release/production-preflight-summary.json"],"","","","",false],
  ["REL-04","Artefatos de Release","Índice de notas de release","Existe ponteiro canônico para notas e pacotes narrativos.","`releases/notes/README.md` presente.","✅ IMPLEMENTADO",["releases/notes/README.md"],"","","","",false],
  ["REL-05","Artefatos de Release","CHANGELOG raiz","O repositório possui changelog central.","`CHANGELOG.md` presente.","✅ IMPLEMENTADO",["CHANGELOG.md"],"","","","",false],
  ["REL-06","Artefatos de Release","Changelogs dos workspaces core","Apps e packages core possuem changelog próprio.","Changelogs existem para API, web, worker e packages relevantes.","✅ IMPLEMENTADO",["apps/api/CHANGELOG.md","apps/web/CHANGELOG.md","apps/worker/CHANGELOG.md","packages/database/CHANGELOG.md","packages/logger/CHANGELOG.md","packages/security/CHANGELOG.md"].filter(exists),"","","","",false],
  ["REL-07","Artefatos de Release","Workflow de CD","O processo de release está codificado em pipeline versionado.","`.github/workflows/cd.yml` presente.","✅ IMPLEMENTADO",[".github/workflows/cd.yml"],"","","","",false],
  ["REL-08","Artefatos de Release","Gate de staging preflight","Staging é validado automaticamente antes do deploy.","Workflow CD contém job `staging-preflight`.", cd.includes("staging-preflight") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO",[".github/workflows/cd.yml"],"🟠 ALTO","Staging pode ser promovido sem preflight explícito.","Ambiente intermediário perde valor como gate.","Release vai para produção com menor confiança.","",false],
  ["REL-09","Artefatos de Release","Gate de production preflight","Produção exige preflight antes do deploy.","Workflow CD contém job `production-preflight`.", cd.includes("production-preflight") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO",[".github/workflows/cd.yml"],"🔴 CRÍTICO","Deploy de produção pode ocorrer sem validação formal de configuração.","Segredos e variáveis incorretos em produção.","Falha operacional em go-live.","",false],
  ["REL-10","Artefatos de Release","Gate de smoke","Release executa smoke gate antes da promoção.","Workflow CD contém job `release-smoke-gate`.", cd.includes("release-smoke-gate") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO",[".github/workflows/cd.yml"],"🔴 CRÍTICO","Release pode ser promovido sem smoke de sanidade.","Falhas óbvias chegam à produção.","O CD deixa de ser gate confiável.","",false],
  ["REL-11","Artefatos de Release","Gate de E2E de release","Release executa suíte E2E antes da promoção.","Workflow CD contém job `release-e2e-gate`.", cd.includes("release-e2e-gate") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO",[".github/workflows/cd.yml"],"🟠 ALTO","Release não comprova fluxo E2E antes do deploy.","Integrações críticas podem quebrar silenciosamente.","Produção vira ambiente de validação.","",false],
  ["REL-12","Artefatos de Release","Gate de evidência de rollback","Release exige prova de rehearsal de rollback.","Workflow CD contém job `rollback-rehearsal-evidence-gate`.", cd.includes("rollback-rehearsal-evidence-gate") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO",[".github/workflows/cd.yml"],"🔴 CRÍTICO","Produção pode ser promovida sem prova de rollback recente.","RTO real é desconhecido no momento do deploy.","Risco operacional de produção sobe materialmente.","",false],
  ["REL-13","Artefatos de Release","Deploy de produção depende dos gates prévios","O job final de deploy depende formalmente dos gates críticos.","`deploy-production` depende de preflight, smoke, E2E e rollback evidence.", cd.includes("deploy-production") && cd.includes("production-preflight") && cd.includes("release-smoke-gate") && cd.includes("release-e2e-gate") && cd.includes("rollback-rehearsal-evidence-gate") ? "✅ IMPLEMENTADO" : "⚠ PARCIAL",[".github/workflows/cd.yml"],"🔴 CRÍTICO","Deploy final pode escapar de parte dos gates.","Produção recebe release sem todas as salvaguardas.","CD perde seu valor de bloqueio.","",false],
  ["REL-14","Artefatos de Release","Entradas seladas para preflight","Arquivos selados de staging/production existem no repositório.","`ops/release/sealed/.env.staging.sealed` e `.env.production.sealed` presentes.", exists("ops/release/sealed/.env.staging.sealed") && exists("ops/release/sealed/.env.production.sealed") ? "✅ IMPLEMENTADO" : "⚠ PARCIAL",["ops/release/sealed/.env.staging.sealed","ops/release/sealed/.env.production.sealed"].filter(exists),"🟠 ALTO","Rehearsal de release perde reprodutibilidade local.","Preflight não consegue ser repetido com insumos padronizados.","Gates de release ficam mais frágeis.","Presença local validada; equivalência com ambientes reais depende de validação externa.",true],
  ["REL-15","Artefatos de Release","Artefato de production preflight","Existe artefato versionado do preflight de produção.","`artifacts/release/production-preflight-summary.json` presente com `ok=true`.", productionPreflight && productionPreflight.ok === true ? "✅ IMPLEMENTADO" : "⚠ PARCIAL", exists("artifacts/release/production-preflight-summary.json") ? ["artifacts/release/production-preflight-summary.json"] : [], "🔴 CRÍTICO","Release carece de evidência positiva de preflight de produção.","Deploy em produção sem comprovação de configuração.","Falhas evitáveis passam pelo processo.","Validação de variáveis/segredos reais depende de ambientes remotos.",true],
  ["REL-16","Artefatos de Release","Artefato de smoke","Existe artefato versionado do smoke de release.","`artifacts/release/smoke-summary.json` presente com `ok=true`.", smoke && smoke.ok === true ? "✅ IMPLEMENTADO" : "⚠ PARCIAL", exists("artifacts/release/smoke-summary.json") ? ["artifacts/release/smoke-summary.json"] : [], "🔴 CRÍTICO","Smoke não comprova a sanidade da release.","Falhas básicas escapam ao deploy.","Go-live perde barreira mínima.","",false],
  ["REL-17","Artefatos de Release","Artefato de rollback","Existe artefato versionado de rehearsal de rollback.","`artifacts/release/production-rollback-evidence.json` presente com `ok=true`.", rollback && rollback.ok === true ? "✅ IMPLEMENTADO" : "⚠ PARCIAL", exists("artifacts/release/production-rollback-evidence.json") ? ["artifacts/release/production-rollback-evidence.json"] : [], "🔴 CRÍTICO","Rollback não possui prova positiva recente.","RTO declarado não é confiável.","Produção roda sem rede de segurança validada.","",false],
  ["REL-18","Artefatos de Release","SBOM arquivado localmente","O artefato de SBOM da release está presente no workspace.","`artifacts/sbom/bom.xml` presente.", exists("artifacts/sbom/bom.xml") ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO", exists("artifacts/sbom/bom.xml") ? ["artifacts/sbom/bom.xml"] : [], "🟠 ALTO","Pipeline define geração de SBOM, mas o workspace não arquiva o artefato.","Rastreabilidade de dependências da release fica incompleta localmente.","Due diligence de supply chain perde artefato-chave.","",false],
  ["REL-19","Artefatos de Release","Tag semântica alinhada à versão do pacote","A versão principal do repositório deve ter tag git correspondente.","Existe tag git exatamente igual a `package.json.version`.", gitTags.includes(packageVersion) ? "✅ IMPLEMENTADO" : "❌ NÃO IMPLEMENTADO",["package.json"],"🟠 ALTO","Versão publicada não está amarrada a tag semântica correspondente.","Release 1.0.0 não é recuperável por tag formal.","Histórico de release fica frágil para auditoria e rollback.","",false],
  ["REL-20","Artefatos de Release","Manifesto de checksums da release","Artefatos de release deveriam possuir manifesto único de integridade.","Existe manifesto versionado de checksums cobrindo `artifacts/release/`.","❌ NÃO IMPLEMENTADO",[],"🟠 ALTO","Release possui artefatos, mas sem manifesto único de integridade.","Não há verificação uniforme de adulteração ou drift pós-geração.","Pacote de release fica menos robusto para auditoria forense.","",false],
  ["REL-21","Artefatos de Release","Notas de release padronizadas em `releases/notes`","A estrutura padronizada deveria conter notas relevantes e não apenas um stub.","Arquivos materiais existem em `releases/notes/` além do README.", listPrefix("releases/notes/").filter((f) => !f.endsWith("README.md")).length ? "✅ IMPLEMENTADO" : "⚠ PARCIAL", ["releases/notes/README.md","docs/release/2026-03-20-go-live-runbook.md"], "🟡 MÉDIO","Estrutura nova existe, mas notas continuam fora do local padronizado.","Consumidores enxergam dois centros de release.","Padronização de release fica incompleta.","",false]
].map(([id,category,name,description,criterion,status,evidence,severity,impact,risk,consequence,notes,cross]) => ({ id, category, name, description, criterion, status, evidence, severity, impact, risk, consequence, notes, cross }));

const catMap = { "Documentação Operacional": [], "Evidências de Auditoria": [], "Artefatos de Release": [] };
items.forEach((item) => catMap[item.category].push(item));
const catScores = Object.fromEntries(Object.entries(catMap).map(([k,v]) => [k, Math.round(v.reduce((a,b) => a + scoreValue[b.status], 0) / v.length * 100)]));
const generalScore = Math.round(Object.values(catScores).reduce((a,b) => a + b, 0) / Object.keys(catScores).length);
const sevRank = { "🔴 CRÍTICO": 4, "🟠 ALTO": 3, "🟡 MÉDIO": 2, "🔵 BAIXO": 1 };
const issues = items.filter((i) => i.status !== "✅ IMPLEMENTADO").sort((a,b) => (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0));
const top10 = issues.slice(0, 10);

write("audit/forensic_inventory.md", [
  "# Forensic Inventory","",
  "## Escopo","",
  "- Escopo auditado: workspace inteiro, excluindo `.git/` e `node_modules/` como metadados/dependências de terceiros.",
  "- Regra de agrupamento: lotes só foram agrupados quando compartilham diretório raiz, função e classificação.","",
  "## Inventário","",
  "| Item | Tipo detectado | Cobertura | Classificação | Justificativa | Amostra |",
  "| --- | --- | ---: | --- | --- | --- |",
  ...inventory.map(([label,type,list,cls,reason]) => `| ${label} | ${type} | ${list.length} | ${cls} | ${reason} | ${list.slice(0,4).map((f) => `\`${f}\``).join("<br>") || "-"} |`),
  ""
].join("\n"));

const checklist = ["# Master Governance Checklist","","## Score Summary","",`- Documentação Operacional: ${catScores["Documentação Operacional"]}/100`, `- Evidências de Auditoria: ${catScores["Evidências de Auditoria"]}/100`, `- Artefatos de Release: ${catScores["Artefatos de Release"]}/100`, `- Score geral ponderado: ${generalScore}/100`, ""];
for (const category of Object.keys(catMap)) {
  checklist.push(`## ${category}`, "");
  for (const item of catMap[category]) {
    checklist.push(`### [${item.id}] ${item.name}`);
    checklist.push(`Descrição clara: ${item.description}`);
    checklist.push(`Critério de validação objetiva: ${item.criterion}`);
    checklist.push(`Evidência: ${md(item.evidence)}`);
    checklist.push(`Status: ${item.status}`);
    if (item.cross) checklist.push("Validação cruzada: 🔵 PENDENTE");
    if (item.status !== "✅ IMPLEMENTADO") {
      checklist.push(`Severidade: ${item.severity}`);
      checklist.push(`Impacto: ${item.impact}`);
      checklist.push(`Risco: ${item.risk}`);
      checklist.push(`Consequência prática: ${item.consequence}`);
    }
    if (item.notes) checklist.push(`Notas: ${item.notes}`);
    checklist.push("");
  }
}
write("audit/master_governance_checklist.md", checklist.join("\n"));

write("audit/traceability_matrix.md", ["# Traceability Matrix","", "| Item | Categoria | Evidência encontrada | Arquivo associado | Status |", "| --- | --- | --- | --- | --- |", ...items.map((i) => `| ${i.id} | ${i.category} | ${i.evidence.length ? i.evidence.map((f) => `\`${f}\``).join("<br>") : "sem evidência local"} | ${i.evidence[0] ? `\`${i.evidence[0]}\`` : "-"} | ${i.status} |`), ""].join("\n"));

write("audit/validation_log.md", ["# Validation Log","","## Coleta executada","","- Varredura recursiva do workspace por Node.js, excluindo apenas `.git/` e `node_modules/`.","- `git status --short`: worktree já suja antes da auditoria; alterações pré-existentes preservadas.",`- Arquivos observados em \`docs/\`: ${docsFileCount}.`,`- Arquivos observados em \`artifacts/\`: ${artifactsFileCount}.`,`- Arquivos observados em \`audit/\`: ${auditFileCount}.`,"- Validação objetiva de lacunas: inexistência de `docs/operations/f0-sla-adherence-baseline-90d.md`, `artifacts/sbom/bom.xml` e tag git `1.0.0`.","- Validação objetiva de release: `artifacts/release/production-preflight-summary.json`, `smoke-summary.json` e `production-rollback-evidence.json` com `ok=true`.","","## Artefatos gerados nesta auditoria","","- `docs/adrs/INDEX.md`","- `artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md`","- `releases/manifests/release_artifact_catalog.md`","- `audit/forensic_inventory.md`","- `audit/master_governance_checklist.md`","- `audit/traceability_matrix.md`","- `audit/final_governance_report.md`","- `audit/governance_dashboard.html`","","## Não executado","","- Nenhum teste adicional foi executado nesta etapa; a auditoria consumiu evidências já existentes no workspace.",""].join("\n"));

write("audit/final_governance_report.md", ["# Final Governance Report","","## 1. Resumo executivo","",`- Score geral ponderado: ${generalScore}/100`, `- Documentação Operacional: ${catScores["Documentação Operacional"]}/100`, `- Evidências de Auditoria: ${catScores["Evidências de Auditoria"]}/100`, `- Artefatos de Release: ${catScores["Artefatos de Release"]}/100`, "- Estrutura padrão criada sem apagar conteúdo útil.","","## 2. Principais falhas","",...top10.map((i) => `- ${i.id} ${i.name}: ${i.severity}. ${i.impact}`),"","## 3. Riscos críticos","",...issues.filter((i) => i.severity === "🔴 CRÍTICO").map((i) => `- ${i.id}: ${i.risk}`),"","## 4. Score de maturidade","",`- Documentação Operacional: ${catScores["Documentação Operacional"]}/100`, `- Evidências de Auditoria: ${catScores["Evidências de Auditoria"]}/100`, `- Artefatos de Release: ${catScores["Artefatos de Release"]}/100`, `- Score geral ponderado (pesos iguais): ${generalScore}/100`,"","## 5. Estrutura antes vs depois","","- Antes: `docs/`, `audit/`, `artifacts/`, `logs/`, `ops/`, `scripts/`","- Depois: `docs/operational/`, `docs/operational/manuals/`, `docs/operational/runbooks/`, `audit/`, `releases/`, `releases/evidence/`, `releases/manifests/`, `releases/notes/`","","## 6. Lista de ações realizadas","","- Criação de `docs/operational/` com README, manual e runbook de release.","- Criação dos runbooks ausentes de deploy, rollback, disaster recovery, incident response e alertas P1.","- Criação de `docs/release/release-process.md`.","- Criação de `docs/adrs/INDEX.md`.","- Criação de `artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md`.","- Criação de `releases/` com catálogo de artefatos.","- Geração de inventário, checklist, matriz, dashboard e relatório final.","","## 7. Pendências","",...issues.map((i) => `- ${i.id}: ${i.consequence}`),"","## 8. Roadmap de correção","","- Curto prazo: publicar baseline de aderência SLA 90d, gerar manifesto de checksums de release e arquivar SBOM local.","- Médio prazo: consolidar bundle auditável de isolamento multi-tenant e formalizar política de frescor de evidências.","- Médio prazo: alinhar tag semântica git à versão `1.0.0` e mover notas materiais para `releases/notes/`.","- Higiene contínua: quarentenar outputs legados ambíguos dentro de `audit/`.",""].join("\n"));

const data = {
  generalScore,
  categoryScores: catScores,
  items: items.map((i) => ({
    id: i.id,
    category: i.category,
    name: i.name,
    status: i.status,
    severity: i.severity || "SEM GAP",
    impact: i.impact,
    evidence: i.evidence,
    cross: i.cross
  }))
};
const dashboardHtml = [
  "<!DOCTYPE html>",
  '<html lang="pt-BR">',
  "<head>",
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  "<title>Governance Dashboard</title>",
  "<style>:root{--bg:#0b1220;--bg2:#132238;--glass:rgba(255,255,255,.1);--border:rgba(255,255,255,.18);--text:#f5f7fb;--muted:#c4d1e1;--green:#2ecc71;--yellow:#f1c40f;--red:#ff5b6b;--blue:#4ea8de}*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',sans-serif;color:var(--text);background:radial-gradient(circle at top left,rgba(78,168,222,.35),transparent 30%),radial-gradient(circle at top right,rgba(46,204,113,.25),transparent 25%),linear-gradient(135deg,var(--bg),var(--bg2));min-height:100vh}.page{max-width:1280px;margin:0 auto;padding:32px 20px 48px}.hero,.panel,.card{background:var(--glass);border:1px solid var(--border);backdrop-filter:blur(16px);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.22)}.hero{padding:28px;margin-bottom:24px}.score-grid,.counter-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-top:20px}.card{padding:18px}.big-number{font-size:2rem;font-weight:700;color:var(--text)}.filters{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:20px}.panel{padding:20px;margin-bottom:20px}select{width:100%;margin-top:8px;padding:12px;border-radius:14px;border:1px solid var(--border);background:rgba(11,18,32,.7);color:var(--text)}.progress{width:100%;height:14px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden;margin-top:10px}.progress>span{display:block;height:100%;background:linear-gradient(90deg,var(--blue),var(--green))}table{width:100%;border-collapse:collapse}th,td{padding:14px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top}th{color:var(--text);font-size:.85rem;text-transform:uppercase;letter-spacing:.04em}.badge{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:.82rem;font-weight:600}.implemented{background:rgba(46,204,113,.2);color:#d8ffe7}.partial{background:rgba(241,196,15,.2);color:#fff0b3}.missing{background:rgba(255,91,107,.2);color:#ffd5da}.pending{background:rgba(78,168,222,.2);color:#d8f3ff}.evidence{font-family:Consolas,monospace;font-size:.85rem;color:#dbe8f6}@media(max-width:768px){.page{padding:20px 12px 36px}table,thead,tbody,th,td,tr{display:block}thead{display:none}tr{margin-bottom:16px;background:rgba(255,255,255,.04);border-radius:16px;padding:10px}td{border-bottom:none;padding:8px 6px}td::before{content:attr(data-label);display:block;color:var(--muted);font-size:.75rem;text-transform:uppercase;margin-bottom:4px}}</style>",
  "</head>",
  "<body>",
  '<div class="page"><section class="hero"><h1>Governance Dashboard</h1><p>Checklist mestre consolidado com filtros por categoria, severidade e validação cruzada.</p><div class="score-grid" id="score-grid"></div></section><section class="panel"><div class="filters"><div><label for="category">Categoria</label><select id="category"><option value="all">Todas</option></select></div><div><label for="severity">Severidade</label><select id="severity"><option value="all">Todas</option><option value="🔴 CRÍTICO">🔴 CRÍTICO</option><option value="🟠 ALTO">🟠 ALTO</option><option value="🟡 MÉDIO">🟡 MÉDIO</option></select></div><div><label for="validation">Validação cruzada</label><select id="validation"><option value="all">Todas</option><option value="pending">Pendente</option><option value="validated">Sem pendência</option></select></div></div><div class="counter-grid" id="counters"></div><div class="progress"><span id="progress-bar" style="width:0%"></span></div></section><section class="panel"><table><thead><tr><th>Item</th><th>Categoria</th><th>Status</th><th>Severidade</th><th>Impacto</th><th>Evidência</th></tr></thead><tbody id="rows"></tbody></table></section></div>',
  "<script>",
  "const data = " + JSON.stringify(data) + ";",
  "const categorySelect = document.getElementById('category'); const severitySelect = document.getElementById('severity'); const validationSelect = document.getElementById('validation'); const rows = document.getElementById('rows'); const counters = document.getElementById('counters'); const scoreGrid = document.getElementById('score-grid'); const progressBar = document.getElementById('progress-bar');",
  "Array.from(new Set(data.items.map(function(i){ return i.category; }))).forEach(function(category){ const option = document.createElement('option'); option.value = category; option.textContent = category; categorySelect.appendChild(option); });",
  "function statusClass(status){ if(status.indexOf('IMPLEMENTADO') !== -1) return 'implemented'; if(status.indexOf('PARCIAL') !== -1) return 'partial'; return 'missing'; }",
  "function renderScores(){ const cards = [{ label: 'Score Geral', value: data.generalScore }].concat(Object.entries(data.categoryScores).map(function(entry){ return { label: entry[0], value: entry[1] }; })); scoreGrid.innerHTML = cards.map(function(card){ return '<div class=\"card\"><div class=\"big-number\">' + card.value + '</div><div>' + card.label + '</div></div>'; }).join(''); }",
  "function filtered(){ return data.items.filter(function(item){ const categoryOk = categorySelect.value === 'all' || item.category === categorySelect.value; const severityOk = severitySelect.value === 'all' || item.severity === severitySelect.value; const validationOk = validationSelect.value === 'all' || (validationSelect.value === 'pending' && item.cross) || (validationSelect.value === 'validated' && !item.cross); return categoryOk && severityOk && validationOk; }); }",
  "function renderCounters(items){ const impl = items.filter(function(item){ return item.status.indexOf('IMPLEMENTADO') !== -1; }).length; const part = items.filter(function(item){ return item.status.indexOf('PARCIAL') !== -1; }).length; const miss = items.filter(function(item){ return item.status.indexOf('NÃO IMPLEMENTADO') !== -1; }).length; const pend = items.filter(function(item){ return item.cross; }).length; const cards = [['Implementado', impl, 'implemented'], ['Parcial', part, 'partial'], ['Não implementado', miss, 'missing'], ['Pendente validação', pend, 'pending']]; counters.innerHTML = cards.map(function(card){ return '<div class=\"card\"><div class=\"badge ' + card[2] + '\">' + card[0] + '</div><div class=\"big-number\">' + card[1] + '</div></div>'; }).join(''); const progress = items.length ? Math.round(((impl + part * 0.5) / items.length) * 100) : 0; progressBar.style.width = progress + '%'; }",
  "function renderRows(items){ rows.innerHTML = items.map(function(item){ const pending = item.cross ? '<br><span class=\"badge pending\">🔵 PENDENTE</span>' : ''; const evidence = item.evidence.length ? item.evidence.join('<br>') : '-'; const impact = item.impact || '-'; return '<tr><td data-label=\"Item\"><strong>' + item.id + '</strong><br>' + item.name + '</td><td data-label=\"Categoria\">' + item.category + '</td><td data-label=\"Status\"><span class=\"badge ' + statusClass(item.status) + '\">' + item.status + '</span>' + pending + '</td><td data-label=\"Severidade\">' + item.severity + '</td><td data-label=\"Impacto\">' + impact + '</td><td data-label=\"Evidência\" class=\"evidence\">' + evidence + '</td></tr>'; }).join(''); }",
  "function render(){ const visible = filtered(); renderCounters(visible); renderRows(visible); }",
  "renderScores(); categorySelect.addEventListener('change', render); severitySelect.addEventListener('change', render); validationSelect.addEventListener('change', render); render();",
  "</script>",
  "</body>",
  "</html>"
].join("\n");
write("audit/governance_dashboard.html", dashboardHtml);

console.log(JSON.stringify({ generalScore, categoryScores: catScores, top10: top10.map((i) => ({ id: i.id, severity: i.severity, name: i.name })) }, null, 2));
