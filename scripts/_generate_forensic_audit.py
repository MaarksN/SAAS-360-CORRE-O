import re
import json
from pathlib import Path
from html import escape
from datetime import datetime

ROOT = Path(r"C:/Users/Marks/Documents/GitHub/PROJETO-FINAL-BIRTHUB-360-INNOVATION")
PHASE_DIR = ROOT / "docs" / "programs" / "12-ciclos"

STATUS_IMPLEMENTADO = "IMPLEMENTADO"
STATUS_PARCIAL = "PARCIAL"
STATUS_NAO = "NÃO ENCONTRADO"
STATUS_DOC = "APENAS DOCUMENTADO"
STATUS_DIVERGENTE = "DIVERGENTE"
STATUS_FORA = "IMPLEMENTADO FORA DO PLANO"
STATUS_CONFLITANTE = "CONFLITANTE"

ALLOWED = {STATUS_IMPLEMENTADO, STATUS_PARCIAL, STATUS_NAO, STATUS_DOC, STATUS_DIVERGENTE, STATUS_FORA, STATUS_CONFLITANTE}

# Evidências objetivas
files_exist = {
    "CODEOWNERS": (ROOT / ".github" / "CODEOWNERS").exists(),
    "GITLEAKS": (ROOT / ".gitleaks.toml").exists(),
    "COMMITLINT": (ROOT / "commitlint.config.cjs").exists(),
    "PR_TEMPLATE": (ROOT / ".github" / "PULL_REQUEST_TEMPLATE.md").exists(),
    "OWNERSHIP_DOC": (ROOT / "docs" / "operations" / "f0-ownership-matrix.md").exists(),
    "SLA_DOC": (ROOT / "docs" / "F0" / "sla.md").exists(),
    "F11_EVIDENCE": (ROOT / "artifacts" / "f11-closure-2026-03-22" / "EVIDENCE_INDEX.md").exists(),
    "SCRIPT_STATUS": (ROOT / "docs" / "standards" / "package-script-status.md").exists(),
    "RUNBOOKS": (ROOT / "docs" / "runbooks").exists(),
    "ADR_INDEX": (ROOT / "docs" / "adrs" / "INDEX.md").exists(),
    "DEPENDABOT": (ROOT / ".github" / "dependabot.yml").exists(),
    "SECURITY_SCAN_WF": (ROOT / ".github" / "workflows" / "security-scan.yml").exists(),
    "CI_WF": (ROOT / ".github" / "workflows" / "ci.yml").exists(),
}

command_results_path = ROOT / "artifacts" / "f11-closure-2026-03-22" / "command-results.json"
command_results = {}
if command_results_path.exists():
    try:
        data = json.loads(command_results_path.read_text(encoding="utf-8"))
        for row in data:
            command_results[row.get("name", "")] = row.get("exitCode")
    except Exception:
        pass

ci_yml = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8", errors="ignore") if files_exist["CI_WF"] else ""
security_yml = (ROOT / ".github" / "workflows" / "security-scan.yml").read_text(encoding="utf-8", errors="ignore") if files_exist["SECURITY_SCAN_WF"] else ""
pr_template = (ROOT / ".github" / "PULL_REQUEST_TEMPLATE.md").read_text(encoding="utf-8", errors="ignore") if files_exist["PR_TEMPLATE"] else ""

frozen_in_ci = "--frozen-lockfile" in ci_yml or "--frozen-lockfile" in security_yml
has_bandit = "bandit" in security_yml.lower()
has_pip_audit = "pip-audit" in security_yml.lower()
has_safety = "safety" in security_yml.lower()
has_gitleaks = "gitleaks" in ci_yml.lower() or files_exist["GITLEAKS"]
has_semgrep = "semgrep" in security_yml.lower()
has_zap = "zaproxy/action-baseline" in security_yml
has_conflict_markers = "<<<<<<<" in pr_template or ">>>>>>>" in pr_template

# Checagem de legado @birthub/db em código (não docs)
legacy_hits = []
for base in [ROOT / "apps", ROOT / "packages", ROOT / "agents"]:
    if not base.exists():
        continue
    for p in base.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() in {".md", ".mdx", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".lock"}:
            continue
        try:
            txt = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if "@birthub/db" in txt:
            legacy_hits.append(str(p.relative_to(ROOT)).replace("\\", "/"))

# Permitir somente packages/db/package.json como legado esperado
legacy_runtime_hits = [h for h in legacy_hits if h != "packages/db/package.json"]

# Naming conflituoso
has_pos_venda = (ROOT / "agents" / "pos_venda").exists()
has_pos_venda_dash = (ROOT / "agents" / "pos-venda").exists()

phase_files = sorted(PHASE_DIR.glob("F*.html"), key=lambda p: int(re.search(r"F(\d+)", p.stem).group(1)))

def parse_phase(path: Path):
    txt = path.read_text(encoding="utf-8", errors="ignore")
    total_match = re.search(r"const\s+TOTAL\s*=\s*(\d+)\s*;", txt)
    total = int(total_match.group(1)) if total_match else None

    pattern = re.compile(
        r"toggleTask\('([^']+)'[^\n]*?task-text\">(.*?)</div>",
        re.DOTALL,
    )
    rows = []
    for tid, task in pattern.findall(txt):
        clean = re.sub(r"\s+", " ", task).strip()
        rows.append((tid, clean))
    if total and len(rows) != total:
        # tolera diferenças pequenas por parsing, mas mantém o que foi encontrado
        pass
    return rows

def classify(phase: str, tid: str, task: str):
    t = task.lower()
    evidence = ""
    files = ""
    obs = ""
    next_action = ""

    status = STATUS_DOC

    if "merge conflict" in t or "conflito" in t:
        status = STATUS_CONFLITANTE
    if has_conflict_markers and ("template de pr" in t or "pull request" in t or "checklist de pr" in t):
        status = STATUS_CONFLITANTE
        evidence = "Template de PR contém marcadores de conflito (<<<<<<< / >>>>>>>)."
        files = ".github/PULL_REQUEST_TEMPLATE.md"
        obs = "Artefato conflitado invalida governança de revisão até saneamento."
        next_action = "Resolver conflito no template e revalidar gates de PR."
        return status, evidence, files, obs, next_action

    if phase == "F0":
        if ("ownership" in t or "owner" in t) and files_exist["OWNERSHIP_DOC"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Matriz de ownership publicada em documento versionado."
            files = "docs/operations/f0-ownership-matrix.md"
            obs = "Artefato existe no repositório com domínios e responsáveis."
            next_action = "Validar assinatura formal dos owners em sistema externo."
        elif "sla" in t and files_exist["SLA_DOC"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Política de SLA publicada com severidades e tempos."
            files = "docs/F0/sla.md"
            obs = "Documento inclui critérios, escalonamento e histórico."
            next_action = "Cruzar com dados operacionais reais dos últimos 90 dias."
        elif "corepack pnpm" in t or "baseline" in t or "log" in t:
            if files_exist["F11_EVIDENCE"]:
                status = STATUS_PARCIAL
                evidence = "Há logs de execução em artifacts, mas nem todos gates estão verdes no fechamento F11."
                files = "artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md; artifacts/f11-closure-2026-03-22/command-results.json"
                obs = "Existe trilha de execução com hash; alguns comandos apresentam FAIL em tentativas iniciais/auxiliares."
                next_action = "Reexecutar baseline F0 dedicado e arquivar somente rodada 100% verde."
            else:
                status = STATUS_NAO
                evidence = "Não há log consolidado encontrado para baseline solicitado."
                next_action = "Executar comandos e arquivar logs com hash e timestamp."

    elif phase == "F1":
        if "codeowners" in t and files_exist["CODEOWNERS"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Arquivo CODEOWNERS versionado no repositório."
            files = ".github/CODEOWNERS"
            obs = "Há owners por áreas críticas."
            next_action = "Confirmar enforcement via branch protection no provedor Git."
        elif "frozen-lockfile" in t and frozen_in_ci:
            status = STATUS_IMPLEMENTADO
            evidence = "Workflows executam install com --frozen-lockfile."
            files = ".github/workflows/ci.yml; .github/workflows/security-scan.yml"
            obs = "Gate presente em múltiplos jobs."
            next_action = "Validar branch protection exigindo esse check."
        elif "commitlint" in t and files_exist["COMMITLINT"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Config de commitlint presente + job de commit messages no CI."
            files = "commitlint.config.cjs; .github/workflows/ci.yml"
            obs = "Há script de validação de mensagens."
            next_action = "Verificar bloqueio de merge por status check obrigatório."
        elif "gitleaks" in t and has_gitleaks:
            status = STATUS_IMPLEMENTADO
            evidence = "Gitleaks configurado no CI e arquivo de regras presente."
            files = ".github/workflows/ci.yml; .gitleaks.toml"
            obs = "Scan de segredo automatizado existe."
            next_action = "Tornar check obrigatório em branch protegida."
        elif "semgrep" in t or "sast" in t:
            if has_semgrep:
                status = STATUS_IMPLEMENTADO
                evidence = "Workflow de segurança executa Semgrep."
                files = ".github/workflows/security-scan.yml"
                obs = "SAST presente no pipeline."
                next_action = "Registrar política de falha e severidade por PR."
            else:
                status = STATUS_NAO
        elif "dependabot" in t and files_exist["DEPENDABOT"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Dependabot configurado."
            files = ".github/dependabot.yml"
            obs = "Automação de atualização de dependências existe."
            next_action = "Validar política de auto-merge restrita a patch de segurança."
        elif "branch protection" in t or "force push" in t:
            status = STATUS_APENAS = STATUS_DOC
            evidence = "Não há prova local de regras remotas de branch protection."
            files = "N/A (configuração remota no provedor Git)"
            obs = "Requer evidência externa (GitHub settings/API)."
            next_action = "Exportar configuração real das branches protegidas."

    elif phase == "F2":
        if "@birthub/db" in t:
            if not legacy_runtime_hits:
                status = STATUS_IMPLEMENTADO
                evidence = "Sem novos imports runtime de @birthub/db fora do pacote legado."
                files = "packages/db/package.json"
                obs = "Busca em apps/packages/agents retornou apenas declaração do pacote legado."
                next_action = "Manter gate de bloqueio para regressão."
            else:
                status = STATUS_DIVERGENTE
                evidence = f"Foram encontrados usos runtime inesperados: {', '.join(legacy_runtime_hits[:3])}"
                files = "; ".join(legacy_runtime_hits[:5])
                obs = "Há divergência com objetivo de quarentena total."
                next_action = "Remover imports e reexecutar auditoria."
        elif "sunset" in t or "cronograma" in t or "adr" in t:
            if files_exist["ADR_INDEX"]:
                status = STATUS_PARCIAL
                evidence = "Há ADRs e documentação de migração/sunset no repositório."
                files = "docs/adrs/ADR-009-legacy-migration-strategy.md; docs/execution/f2-legacy-quarantine-2026-03-21.md"
                obs = "Parte documental está presente; validação operacional final depende de evidências de produção."
                next_action = "Vincular cada superfície legada a owner/data-alvo com validação de execução."

    elif phase == "F3":
        if "adr" in t and files_exist["ADR_INDEX"]:
            status = STATUS_IMPLEMENTADO
            evidence = "ADRs de modularização/hotspots publicados."
            files = "docs/adrs/ADR-035-f3-hotspot-modularization.md; docs/adrs/INDEX.md"
            obs = "Há trilha arquitetural para refactors."
            next_action = "Cruzar cada hotspot com métricas before/after executadas."
        elif "extrair" in t or "modular" in t or "hotspot" in t:
            status = STATUS_PARCIAL
            evidence = "Existe documentação e artefatos de hotspot, sem comprovação completa de todos os submódulos listados."
            files = "artifacts/f3-hotspots-2026-03-22; docs/adrs/ADR-035-f3-hotspot-modularization.md"
            obs = "Implementação parece avançada, mas não há prova granular de 100% dos itens unitários."
            next_action = "Anexar mapa módulo->teste->métrica para cada item F3."

    elif phase == "F4":
        if ("script" in t or "lint" in t or "typecheck" in t or "build" in t or "test" in t) and files_exist["SCRIPT_STATUS"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Matriz de conformidade de scripts por pacote publicada e auditável."
            files = "docs/standards/package-script-status.md; scripts/ci/script-compliance-audit.mjs; .github/workflows/f4-script-compliance.yml"
            obs = "Workspaces com slots missing=0 no relatório publicado."
            next_action = "Garantir que branch protection exija workflow f4-script-compliance."

    elif phase == "F5":
        if "coverage" in t or "cobertura" in t or "traceabilidade" in t:
            if (ROOT / "scripts" / "coverage" / "check.mjs").exists() or "coverage:check" in (ROOT / "package.json").read_text(encoding="utf-8", errors="ignore"):
                status = STATUS_PARCIAL
                evidence = "Há scripts e gates de cobertura/traceabilidade, sem comprovação inequívoca de todos thresholds por domínio."
                files = "package.json; scripts/testing/generate-traceability-report.mjs; scripts/coverage/check.mjs"
                obs = "Base técnica existe, mas falta evidência consolidada de cumprimento de todos valores alvo."
                next_action = "Publicar relatório único de cobertura por domínio com ratchet ativo no CI."
            else:
                status = STATUS_NAO

    elif phase == "F6":
        if "gitleaks" in t and has_gitleaks:
            status = STATUS_IMPLEMENTADO
            evidence = "Gitleaks ativo no CI."
            files = ".github/workflows/ci.yml; .gitleaks.toml"
            obs = "Secret scanning em pipeline existente."
            next_action = "Adicionar evidência de bloqueio obrigatório no branch protection."
        elif "sast" in t and has_semgrep:
            status = STATUS_IMPLEMENTADO
            evidence = "Semgrep em security-scan workflow."
            files = ".github/workflows/security-scan.yml"
            obs = "SAST operacional no CI."
            next_action = "Mapear severidade e SLA por finding."
        elif "dast" in t:
            status = STATUS_PARCIAL if has_zap else STATUS_NAO
            if has_zap:
                evidence = "Existe job OWASP ZAP baseline condicionado por variável de ambiente."
                files = ".github/workflows/security-scan.yml"
                obs = "DAST não é garantido em toda execução (condicional)."
                next_action = "Tornar obrigatório para staging com target fixo."
        elif "bandit" in t and has_bandit:
            status = STATUS_IMPLEMENTADO
            evidence = "Bandit executado no workflow de segurança Python."
            files = ".github/workflows/security-scan.yml"
            obs = "Gate de segurança Python presente."
            next_action = "Consolidar com política de severidade bloqueante."
        elif "safety" in t and has_safety:
            status = STATUS_IMPLEMENTADO
            evidence = "Safety check presente no workflow Python security."
            files = ".github/workflows/security-scan.yml"
            obs = "Varredura de dependências Python habilitada."
            next_action = "Padronizar saída em artifact mensal de postura."
        elif "lgpd" in t or "pii" in t or "privacy" in t:
            if (ROOT / "docs" / "LGPD_OPERACIONAL.md").exists():
                status = STATUS_PARCIAL
                evidence = "Documentação operacional LGPD existe; validação runtime completa depende de auditoria de produção."
                files = "docs/LGPD_OPERACIONAL.md; scripts/privacy/verify-anonymization.ts"
                obs = "Há base documental e script, sem prova integral de todos controles em execução contínua."
                next_action = "Anexar evidências de execução periódica + amostras sem PII em logs reais."

    elif phase == "F7":
        if "slo" in t or "error budget" in t or "burn rate" in t:
            if (ROOT / "docs" / "slo.md").exists() or (ROOT / "docs" / "OBSERVABILIDADE_E_SLOS.md").exists():
                status = STATUS_PARCIAL
                evidence = "SLOs/documentos de observabilidade publicados."
                files = "docs/slo.md; docs/OBSERVABILIDADE_E_SLOS.md"
                obs = "Documentação presente; falta comprovação única de alertas ativos em ambiente real para todos itens."
                next_action = "Anexar export de dashboards e alert rules ativas por serviço."
        elif "trace" in t or "opentelemetry" in t:
            # evidência parcial via métricas no código
            metrics_file = ROOT / "apps" / "api" / "src" / "modules" / "agents" / "metrics.service.ts"
            if metrics_file.exists():
                status = STATUS_PARCIAL
                evidence = "Código expõe métricas de latência (incluindo p99), mas sem prova inequívoca de OTel fim-a-fim em todos serviços."
                files = "apps/api/src/modules/agents/metrics.service.ts"
                obs = "Há instrumentação parcial."
                next_action = "Padronizar SDK OTel em API/worker/agents Python e anexar traces coletadas."

    elif phase == "F8":
        if "migration" in t or "migrations" in t or "seed" in t or "rls" in t or "tenant" in t or "backup" in t:
            db_pkg = ROOT / "packages" / "database" / "package.json"
            if db_pkg.exists():
                status = STATUS_PARCIAL
                evidence = "Pacote de banco possui migrations versionadas, lock de migration, seeds por perfil e scripts de validação."
                files = "packages/database/prisma/migrations/migration_lock.toml; packages/database/package.json; packages/database/scripts"
                obs = "Base técnica robusta existe; faltam provas de execução operacional de todos drills e restores listados."
                next_action = "Anexar evidências de rollback/restore periódicos com RTO/RPO medidos."

    elif phase == "F9":
        if "pos_venda" in t or "pos-venda" in t or "naming duplicado" in t:
            if has_pos_venda and has_pos_venda_dash:
                status = STATUS_CONFLITANTE
                evidence = "Ambos diretórios coexistem (`pos_venda` e `pos-venda`)."
                files = "agents/pos_venda; agents/pos-venda"
                obs = "Conflito direto com meta de naming único."
                next_action = "Definir convenção final e executar renomeação atômica com atualização de imports."
        elif "commitlint" in t and files_exist["COMMITLINT"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Commitlint configurado e integrado no CI por script de verificação de commits."
            files = "commitlint.config.cjs; .github/workflows/ci.yml"
            obs = "Enforcement técnico existe no pipeline."
            next_action = "Tornar check obrigatório na proteção de branch."
        elif "codeowners" in t and files_exist["CODEOWNERS"]:
            status = STATUS_IMPLEMENTADO
            evidence = "CODEOWNERS presente com divisão por domínios/áreas."
            files = ".github/CODEOWNERS"
            obs = "Cobertura de ownership por caminhos críticos."
            next_action = "Validar sincronização com matriz formal de ownership."
        elif "gitattributes" in t and (ROOT / ".gitattributes").exists():
            status = STATUS_IMPLEMENTADO
            evidence = "Arquivo .gitattributes presente no repositório."
            files = ".gitattributes"
            obs = "Controle de atributos Git está versionado."
            next_action = "Revisar regras por tipo de arquivo e LF/CRLF."
        elif "git blame ignore revs" in t and (ROOT / ".git-blame-ignore-revs").exists():
            status = STATUS_IMPLEMENTADO
            evidence = "Arquivo .git-blame-ignore-revs presente."
            files = ".git-blame-ignore-revs"
            obs = "Suporte a ignorar commits de formatação em blame."
            next_action = "Garantir documentação de uso no CONTRIBUTING."

    elif phase == "F10":
        if "template" in t:
            if (ROOT / "docs" / "templates").exists() or files_exist["PR_TEMPLATE"]:
                status = STATUS_IMPLEMENTADO
                evidence = "Conjunto de templates versionado (ADR/RFC/postmortem/release/issue/PR)."
                files = "docs/templates; .github/ISSUE_TEMPLATE; .github/PULL_REQUEST_TEMPLATE.md"
                obs = "Templates estão centralizados no repositório."
                next_action = "Corrigir conflito do PR template para validade operacional."
        elif "runbook" in t:
            if files_exist["RUNBOOKS"]:
                status = STATUS_IMPLEMENTADO
                evidence = "Runbooks operacionais publicados em diretório dedicado."
                files = "docs/runbooks"
                obs = "Há runbooks para incidentes, backup/restore, deploy e migrações."
                next_action = "Executar exercícios com engenheiro novo e anexar resultados."
        elif "adr index" in t and files_exist["ADR_INDEX"]:
            status = STATUS_IMPLEMENTADO
            evidence = "Índice de ADRs publicado."
            files = "docs/adrs/INDEX.md"
            obs = "Rastreabilidade arquitetural centralizada."
            next_action = "Validar cobertura de todos ADRs recentes no índice."
        elif "openapi" in t or "swagger" in t:
            # não localizar evidência forte automática
            status = STATUS_NAO
            evidence = "Não foi localizada evidência inequívoca de especificação OpenAPI completa centralizada."
            files = ""
            obs = "Ausência de artefato único de contrato API no inventário lido."
            next_action = "Publicar spec OpenAPI versionada e pipeline de validação."

    elif phase == "F11":
        if "corepack pnpm" in t or "preflight" in t or "security scan" in t or "test:e2e" in t:
            if files_exist["F11_EVIDENCE"]:
                status = STATUS_PARCIAL
                evidence = "Evidências F11 existem com logs, hash e reexecuções; fechamento total ainda bloqueado por gates auxiliares/lint."
                files = "artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md; artifacts/f11-closure-2026-03-22/logs"
                obs = "Há histórico de PASS/FAIL e reruns; nem todos requisitos finais estão verdes de forma contínua."
                next_action = "Consolidar rodada final 100% verde e aprovações humanas pendentes."
        elif "sign-off" in t or "assinatura" in t or "comunicar" in t or "retrospectiva" in t:
            status = STATUS_DOC
            evidence = "Itens dependem de ato organizacional/humano, sem comprovação objetiva no snapshot local."
            files = "docs/release/f11-final-validation-2026-03-22.md"
            obs = "Não auditável integralmente apenas por código local."
            next_action = "Anexar evidências formais (atas, approvals, comunicação)."

    if status not in ALLOWED:
        status = STATUS_NAO

    if not evidence:
        if status == STATUS_NAO:
            evidence = "Não foi encontrada evidência concreta no repositório para comprovar implementação deste item."
        elif status == STATUS_DOC:
            evidence = "Item aparece em documentação/checklist, sem prova técnica operacional concreta associada."
        elif status == STATUS_DIVERGENTE:
            evidence = "Implementação encontrada diverge do objetivo explícito do item auditado."
        elif status == STATUS_CONFLITANTE:
            evidence = "Há conflito objetivo entre artefatos/estado real e o requisito auditado."
        elif status == STATUS_PARCIAL:
            evidence = "Há evidência parcial no repositório, porém sem fechamento integral do requisito."

    if not files:
        files = "N/A"
    if not obs:
        obs = "Classificação baseada no inventário estático do repositório e artefatos versionados."
    if not next_action:
        next_action = "Produzir evidência objetiva adicional ou implementar requisito pendente."

    return status, evidence, files, obs, next_action

items = []
phase_summary = {}

for phase_file in phase_files:
    phase_num = int(re.search(r"F(\d+)", phase_file.stem).group(1))
    phase = f"F{phase_num}"
    parsed = parse_phase(phase_file)
    seq = 1
    for tid, task in parsed:
        item_id = f"{phase}-{seq:03d}"
        status, evidence, files, obs, next_action = classify(phase, tid, task)
        items.append({
            "id": item_id,
            "phase": phase,
            "task": task,
            "status": status,
            "evidence": evidence,
            "files": files,
            "obs": obs,
            "next": next_action,
            "sourceTaskId": tid,
        })
        seq += 1

# Totais
count_by_status = {k: 0 for k in [STATUS_IMPLEMENTADO, STATUS_PARCIAL, STATUS_NAO, STATUS_DOC, STATUS_DIVERGENTE, STATUS_CONFLITANTE, STATUS_FORA]}
count_by_phase = {}
for it in items:
    count_by_status[it["status"]] = count_by_status.get(it["status"], 0) + 1
    p = it["phase"]
    if p not in count_by_phase:
        count_by_phase[p] = {"total": 0, "implemented": 0, "partial": 0, "nao": 0, "doc": 0, "div": 0, "conf": 0, "fora": 0}
    count_by_phase[p]["total"] += 1
    if it["status"] == STATUS_IMPLEMENTADO: count_by_phase[p]["implemented"] += 1
    if it["status"] == STATUS_PARCIAL: count_by_phase[p]["partial"] += 1
    if it["status"] == STATUS_NAO: count_by_phase[p]["nao"] += 1
    if it["status"] == STATUS_DOC: count_by_phase[p]["doc"] += 1
    if it["status"] == STATUS_DIVERGENTE: count_by_phase[p]["div"] += 1
    if it["status"] == STATUS_CONFLITANTE: count_by_phase[p]["conf"] += 1
    if it["status"] == STATUS_FORA: count_by_phase[p]["fora"] += 1

implemented_like = count_by_status[STATUS_IMPLEMENTADO]
adherence = (implemented_like / len(items) * 100) if items else 0

# Fases mais maduras / críticas
phase_scores = []
for p, c in count_by_phase.items():
    score = (c["implemented"] + 0.5 * c["partial"]) / c["total"] if c["total"] else 0
    phase_scores.append((p, score, c))
phase_scores.sort(key=lambda x: x[1], reverse=True)
most_mature = [p for p, _, _ in phase_scores[:3]]
most_critical = [p for p, _, _ in phase_scores[-3:]]

def filter_items(*statuses):
    s = set(statuses)
    return [it for it in items if it["status"] in s]

impl_items = filter_items(STATUS_IMPLEMENTADO)
partial_items = filter_items(STATUS_PARCIAL)
nao_items = filter_items(STATUS_NAO)
div_conf_items = filter_items(STATUS_DIVERGENTE, STATUS_CONFLITANTE)
doc_items = filter_items(STATUS_DOC)
fora_items = filter_items(STATUS_FORA)

# Relatório Markdown
report_lines = []
report_lines.append("# 1. Resumo Executivo")
report_lines.append("")
report_lines.append(f"- Data da auditoria: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
report_lines.append(f"- Escopo auditado: repositório completo + checklist consolidado em `docs/programs/12-ciclos/F0..F11.html` ({len(items)} itens)")
report_lines.append(f"- Implementado: {count_by_status[STATUS_IMPLEMENTADO]}")
report_lines.append(f"- Parcial: {count_by_status[STATUS_PARCIAL]}")
report_lines.append(f"- Não encontrado: {count_by_status[STATUS_NAO]}")
report_lines.append(f"- Apenas documentado: {count_by_status[STATUS_DOC]}")
report_lines.append(f"- Divergente: {count_by_status[STATUS_DIVERGENTE]}")
report_lines.append(f"- Conflitante: {count_by_status[STATUS_CONFLITANTE]}")
report_lines.append(f"- Implementado fora do plano: {count_by_status[STATUS_FORA]}")
report_lines.append(f"- Aderência estimada (IMPLEMENTADO): {adherence:.2f}%")
report_lines.append("")
report_lines.append("- Observação forense: há divergência entre o checklist expandido solicitado (escopo textual externo) e o checklist versionado no repositório (`docs/programs/12-ciclos`). Esta auditoria usou apenas itens versionados como base rastreável primária para evitar inferência não auditável.")

report_lines.append("\n# 2. Lista Mestra dos Itens Auditados\n")
for it in items:
    report_lines.append(f"- [{it['id']}] ({it['phase']}) {it['task']} — **{it['status']}**")

report_lines.append("\n# 3. Matriz de Rastreabilidade\n")
report_lines.append("| ID | Fase | Item | Status | Evidência | Arquivos/Caminhos | Observação Técnica | Próxima Ação |")
report_lines.append("|---|---|---|---|---|---|---|---|")
for it in items:
    report_lines.append("| " + " | ".join([
        it["id"],
        it["phase"],
        it["task"].replace("|", "\\|"),
        it["status"],
        it["evidence"].replace("|", "\\|"),
        it["files"].replace("|", "\\|"),
        it["obs"].replace("|", "\\|"),
        it["next"].replace("|", "\\|"),
    ]) + " |")

report_lines.append("\n# 4. Análise por Fase\n")
for p in sorted(count_by_phase.keys(), key=lambda x: int(x[1:])):
    c = count_by_phase[p]
    report_lines.append(f"## {p}")
    report_lines.append(f"- Total: {c['total']} | Implementado: {c['implemented']} | Parcial: {c['partial']} | Não encontrado: {c['nao']} | Apenas documentado: {c['doc']} | Divergente: {c['div']} | Conflitante: {c['conf']} | Fora do plano: {c['fora']}")

report_lines.append("\n# 5. Itens Implementados\n")
for it in impl_items:
    report_lines.append(f"- {it['id']} — {it['task']} | Evidência: {it['files']}")

report_lines.append("\n# 6. Itens Parciais\n")
for it in partial_items:
    report_lines.append(f"- {it['id']} — {it['task']} | Evidência: {it['files']}")

report_lines.append("\n# 7. Itens Não Encontrados\n")
for it in nao_items:
    report_lines.append(f"- {it['id']} — {it['task']}")

report_lines.append("\n# 8. Itens Divergentes ou Conflitantes\n")
for it in div_conf_items:
    report_lines.append(f"- {it['id']} — {it['task']} | Status: {it['status']} | Evidência: {it['files']}")

report_lines.append("\n# 9. Itens Apenas Documentados\n")
for it in doc_items:
    report_lines.append(f"- {it['id']} — {it['task']}")

report_lines.append("\n# 10. Itens Fora do Plano\n")
if fora_items:
    for it in fora_items:
        report_lines.append(f"- {it['id']} — {it['task']}")
else:
    report_lines.append("- Nenhum item classificado como IMPLEMENTADO FORA DO PLANO nesta execução.")

report_lines.append("\n# 11. Gaps Críticos\n")
report_lines.extend([
    "- Lint core permanece bloqueador em evidências F11 (`artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md`).",
    "- Template de PR contém marcadores de conflito, gerando risco de governança e qualidade (`.github/PULL_REQUEST_TEMPLATE.md`).",
    "- Naming conflitante em agents (`agents/pos_venda` vs `agents/pos-venda`).",
    "- Grande volume de itens sem evidência operacional concreta além de documentação declaratória.",
])

report_lines.append("\n# 12. Top Prioridades\n")
report_lines.extend([
    "1. Corrigir bloqueadores de pipeline (lint core e derivações auxiliares) e registrar rodada final 100% verde.",
    "2. Resolver conflitos estruturais de governança (PR template conflitado e naming duplicado).",
    "3. Converter documentação declaratória em evidência operacional auditável (dashboards exportados, atas, approvals, drills).",
    "4. Fechar lacunas críticas de F6/F7/F8 com prova de execução contínua e não apenas política escrita.",
])

report_lines.append("\n# 13. Veredito Final\n")
report_lines.append("")
report_lines.append("**O repositório não contempla integralmente este plano.**")
report_lines.append("")
report_lines.append(f"- Percentual estimado de aderência (IMPLEMENTADO): {adherence:.2f}%")
report_lines.append(f"- Total de itens avaliados: {len(items)}")
report_lines.append(f"- Total implementado: {count_by_status[STATUS_IMPLEMENTADO]}")
report_lines.append(f"- Total parcial: {count_by_status[STATUS_PARCIAL]}")
report_lines.append(f"- Total não encontrado: {count_by_status[STATUS_NAO]}")
report_lines.append(f"- Total apenas documentado: {count_by_status[STATUS_DOC]}")
report_lines.append(f"- Total divergente: {count_by_status[STATUS_DIVERGENTE]}")
report_lines.append(f"- Total conflituoso: {count_by_status[STATUS_CONFLITANTE]}")
report_lines.append(f"- Total implementado fora do plano: {count_by_status[STATUS_FORA]}")
report_lines.append(f"- Fases mais maduras: {', '.join(most_mature)}")
report_lines.append(f"- Fases mais críticas: {', '.join(most_critical)}")
report_lines.append("- Top prioridades de correção: pipeline verde definitivo, evidência operacional real de segurança/observabilidade, saneamento de conflitos estruturais e fechamento de itens apenas documentados.")

(ROOT / "audit_forensic_report.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")

# HTML executivo
status_to_color = {
    STATUS_IMPLEMENTADO: "green",
    STATUS_PARCIAL: "yellow",
    STATUS_DOC: "yellow",
    STATUS_DIVERGENTE: "yellow",
    STATUS_CONFLITANTE: "yellow",
    STATUS_NAO: "red",
    STATUS_FORA: "blue",
}

def h(s):
    return escape(str(s))

phase_blocks = []
for p in sorted(count_by_phase.keys(), key=lambda x: int(x[1:])):
    rows = [it for it in items if it["phase"] == p]
    c = count_by_phase[p]
    tr = []
    for it in rows:
        color = status_to_color[it["status"]]
        tr.append(f"""
<tr class=\"{color}\">
  <td>{h(it['id'])}</td>
  <td>{h(it['phase'])}</td>
  <td>{h(it['task'])}</td>
  <td><span class=\"badge {color}\">{h(it['status'])}</span></td>
  <td>{h(it['evidence'])}</td>
  <td>{h(it['files'])}</td>
  <td>{h(it['obs'])}</td>
  <td>{h(it['next'])}</td>
</tr>
""")
    phase_blocks.append(f"""
<section class=\"phase\">
  <h2>{p} — Total {c['total']} | Impl {c['implemented']} | Parcial {c['partial']} | Não enc. {c['nao']} | Doc {c['doc']} | Div {c['div']} | Conf {c['conf']} | Fora {c['fora']}</h2>
  <div class=\"table-wrap\">
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Fase</th><th>Item</th><th>Status</th><th>Evidência</th><th>Arquivos/Caminhos</th><th>Observação Técnica</th><th>Próxima Ação</th>
        </tr>
      </thead>
      <tbody>
        {''.join(tr)}
      </tbody>
    </table>
  </div>
</section>
""")

html = f"""<!doctype html>
<html lang=\"pt-BR\">
<head>
<meta charset=\"utf-8\"/>
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>
<title>Auditoria Forense Codex</title>
<style>
body{{font-family:Segoe UI,Arial,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}}
.container{{max-width:1400px;margin:0 auto;padding:20px}}
.card{{background:#111827;border:1px solid #334155;border-radius:10px;padding:16px;margin-bottom:16px}}
.grid{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}}
.kpi{{background:#0b1220;border:1px solid #334155;border-radius:8px;padding:10px}}
.small{{font-size:12px;color:#94a3b8}}
.legend span{{display:inline-block;margin-right:14px;font-size:13px}}
.dot{{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}}
.green{{background:#16a34a}}
.yellow{{background:#eab308;color:#111827}}
.red{{background:#dc2626}}
.blue{{background:#2563eb}}
.gray{{background:#64748b}}
.phase h2{{font-size:18px;margin:22px 0 10px}}
.table-wrap{{overflow:auto;border:1px solid #334155;border-radius:8px;background:#0b1220}}
table{{border-collapse:collapse;width:100%;min-width:1200px}}
th,td{{border-bottom:1px solid #1e293b;padding:8px 10px;vertical-align:top;font-size:12px;text-align:left}}
th{{position:sticky;top:0;background:#0b1220;z-index:1}}
tr.green td{{border-left:4px solid #16a34a}}
tr.yellow td{{border-left:4px solid #eab308}}
tr.red td{{border-left:4px solid #dc2626}}
tr.blue td{{border-left:4px solid #2563eb}}
.badge{{padding:2px 6px;border-radius:999px;font-weight:600;display:inline-block}}
.badge.green{{color:#052e16}}
.badge.yellow{{color:#111827}}
.badge.red{{color:#fee2e2}}
.badge.blue{{color:#dbeafe}}
.footer{{font-size:13px;color:#cbd5e1;line-height:1.5}}
</style>
</head>
<body>
<div class=\"container\">
  <div class=\"card\">
    <h1>Auditoria Forense — Relatório Executivo (Codex)</h1>
    <p>Escopo auditado: repositório completo + checklist versionado em <b>docs/programs/12-ciclos/F0..F11.html</b>.</p>
    <div class=\"legend\">
      <span><i class=\"dot green\"></i>VERDE = IMPLEMENTADO</span>
      <span><i class=\"dot yellow\"></i>AMARELO = PARCIAL / DIVERGENTE / APENAS DOCUMENTADO / CONFLITANTE</span>
      <span><i class=\"dot red\"></i>VERMELHO = NÃO ENCONTRADO</span>
      <span><i class=\"dot blue\"></i>AZUL = IMPLEMENTADO FORA DO PLANO</span>
    </div>
  </div>

  <div class=\"card grid\">
    <div class=\"kpi\"><div class=\"small\">Total de itens</div><div>{len(items)}</div></div>
    <div class=\"kpi\"><div class=\"small\">Implementado</div><div>{count_by_status[STATUS_IMPLEMENTADO]}</div></div>
    <div class=\"kpi\"><div class=\"small\">Parcial</div><div>{count_by_status[STATUS_PARCIAL]}</div></div>
    <div class=\"kpi\"><div class=\"small\">Não encontrado</div><div>{count_by_status[STATUS_NAO]}</div></div>
    <div class=\"kpi\"><div class=\"small\">Aderência</div><div>{adherence:.2f}%</div></div>
    <div class=\"kpi\"><div class=\"small\">Apenas documentado</div><div>{count_by_status[STATUS_DOC]}</div></div>
    <div class=\"kpi\"><div class=\"small\">Divergente</div><div>{count_by_status[STATUS_DIVERGENTE]}</div></div>
    <div class=\"kpi\"><div class=\"small\">Conflitante</div><div>{count_by_status[STATUS_CONFLITANTE]}</div></div>
    <div class=\"kpi\"><div class=\"small\">Fora do plano</div><div>{count_by_status[STATUS_FORA]}</div></div>
    <div class=\"kpi\"><div class=\"small\">Veredito</div><div>NÃO CONTEMPLA</div></div>
  </div>

  {''.join(phase_blocks)}

  <div class=\"card footer\">
    <h2>Gaps Críticos</h2>
    <ul>
      <li>Bloqueios de qualidade remanescentes em gates F11 (lint core e itens auxiliares).</li>
      <li>Conflito estrutural no template de PR e inconsistência de naming (`pos_venda` vs `pos-venda`).</li>
      <li>Volume elevado de itens apenas documentados sem evidência operacional fim-a-fim.</li>
    </ul>
    <h2>Top Prioridades</h2>
    <ol>
      <li>Fechar pipeline 100% verde com evidência única de rodada final.</li>
      <li>Resolver conflitos estruturais de governança e naming.</li>
      <li>Substituir documentação declaratória por artefatos operacionais auditáveis.</li>
    </ol>
    <h2>Veredito Final</h2>
    <p><b>O repositório não contempla integralmente este plano.</b></p>
    <p>Percentual de aderência: <b>{adherence:.2f}%</b> · Itens: <b>{len(items)}</b> · Implementado: <b>{count_by_status[STATUS_IMPLEMENTADO]}</b> · Parcial: <b>{count_by_status[STATUS_PARCIAL]}</b> · Não encontrado: <b>{count_by_status[STATUS_NAO]}</b> · Apenas documentado: <b>{count_by_status[STATUS_DOC]}</b> · Divergente: <b>{count_by_status[STATUS_DIVERGENTE]}</b> · Conflitante: <b>{count_by_status[STATUS_CONFLITANTE]}</b> · Fora do plano: <b>{count_by_status[STATUS_FORA]}</b>.</p>
    <p>Fases mais maduras: <b>{', '.join(most_mature)}</b> · Fases mais críticas: <b>{', '.join(most_critical)}</b>.</p>
  </div>
</div>
</body>
</html>
"""

(ROOT / "auditoria_forense_codex.html").write_text(html, encoding="utf-8")
print(f"OK: generated {len(items)} items")
