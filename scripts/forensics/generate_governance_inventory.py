from __future__ import annotations

import hashlib
import json
import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
AUDIT_DIR = ROOT / "audit"
STAMP = datetime.now().date().isoformat()
OUTPUT_BASENAME = f"governance_inventory_complete_{STAMP}"
OUTPUT_JSON = AUDIT_DIR / f"{OUTPUT_BASENAME}.json"
OUTPUT_MD = AUDIT_DIR / f"{OUTPUT_BASENAME}.md"
OUTPUT_NAMES = {OUTPUT_JSON.name.lower(), OUTPUT_MD.name.lower()}

EXCLUDE_PARTS = {".git", "node_modules", ".tools", "__pycache__", ".venv"}
MIRROR_ROOT = "audit/files_analysis/"

CATEGORY_GOVERNANCE = "Governance & Audit Artifacts"
CATEGORY_CONTROL = "Control & Verification (checklists, checks.json)"
CATEGORY_TRACEABILITY = "Traceability & Inventory"
CATEGORY_GAP = "Gap & Remediation"
CATEGORY_ARCH = "Architecture & Maturity"
CATEGORY_LIFECYCLE = "Agent Lifecycle (ciclos / fases / F1–F5)"
CATEGORY_PROMPTS = "Instructional Artifacts (prompts)"
CATEGORY_RELEASE = "Readiness & Release Assurance"
CATEGORY_DERIVED = "Derived / Analytical Mirror (files_analysis)"

CATEGORIES = [
    CATEGORY_GOVERNANCE,
    CATEGORY_CONTROL,
    CATEGORY_TRACEABILITY,
    CATEGORY_GAP,
    CATEGORY_ARCH,
    CATEGORY_LIFECYCLE,
    CATEGORY_PROMPTS,
    CATEGORY_RELEASE,
    CATEGORY_DERIVED,
]

CONTROL_DOC_DIRS = {
    "docs/adr/",
    "docs/adrs/",
    "docs/architecture/",
    "docs/evidence/",
    "docs/execution/",
    "docs/f0/",
    "docs/f10/",
    "docs/observability/",
    "docs/operational/",
    "docs/operations/",
    "docs/policies/",
    "docs/processes/",
    "docs/programs/",
    "docs/release/",
    "docs/runbooks/",
    "docs/security/",
    "docs/standards/",
    "docs/support/",
    "docs/technical-debt/",
    "docs/templates/",
    "docs/testing/",
    "docs/workflows/",
}

DOC_KEYWORDS = (
    "audit",
    "checklist",
    "governance",
    "validation",
    "traceability",
    "gap",
    "forensic",
    "inventory",
    "cycle",
    "phase",
    "f0",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "readiness",
    "release",
    "preflight",
    "smoke",
    "prompt",
    "instruction",
    "maturity",
    "architecture",
    "matrix",
    "bi",
    "kpi",
    "policy",
    "sla",
    "score",
    "risk",
    "runbook",
    "playbook",
    "ownership",
    "catalog",
    "manifest",
    "roadmap",
)

ROOT_FILES = {
    ".gitleaks.toml",
    "SECURITY.md",
    "PROMPT_GERAL_PENDENCIAS.md",
    "audit_forensic_report.md",
    "auditoria_forense_codex.html",
}

PACK_ROOT = "packages/agent-packs/github-agents-v1/"
IGNORE_CONFLICT_BASENAMES = {
    "readme.md",
    "manifest.json",
    "readiness.json",
    "evidence.json",
    "changelog.md",
    "index.md",
    "skill.md",
}

SEMANTIC_NAME_KEYWORDS = (
    "audit",
    "checklist",
    "governance",
    "validation",
    "traceability",
    "gap",
    "forensic",
    "inventory",
    "readiness",
    "release",
    "preflight",
    "smoke",
    "prompt",
    "instruction",
    "maturity",
    "architecture",
    "matrix",
    "policy",
    "sla",
    "score",
    "risk",
    "runbook",
    "playbook",
    "ownership",
    "catalog",
    "template",
)


@dataclass
class Entry:
    path: str
    name: str
    category: str
    technical_type: str
    origin: str
    status: str
    description: str
    evidence: str
    sha256: str
    size: int
    related_primary: str | None = None
    related_source_path: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "path": self.path,
            "name": self.name,
            "category": self.category,
            "technical_type": self.technical_type,
            "origin": self.origin,
            "status": self.status,
            "description": self.description,
            "evidence": self.evidence,
            "sha256": self.sha256,
            "size": self.size,
            "related_primary": self.related_primary,
            "related_source_path": self.related_source_path,
        }


def rel_posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def is_excluded(path: Path) -> bool:
    rel = rel_posix(path)
    if path.name.lower() in OUTPUT_NAMES:
        return True
    return any(part in EXCLUDE_PARTS for part in path.parts) or rel.startswith(".git/")


def enumerate_files() -> list[Path]:
    files: list[Path] = []
    for current_root, dirs, filenames in os.walk(ROOT, topdown=True):
        dirs[:] = [name for name in dirs if name not in EXCLUDE_PARTS]
        current_path = Path(current_root)
        if any(part in EXCLUDE_PARTS for part in current_path.parts):
            continue
        for filename in filenames:
            path = current_path / filename
            if is_excluded(path):
                continue
            files.append(path)
    return files


def starts_with_any(value: str, prefixes: set[str]) -> bool:
    return any(value.startswith(prefix) for prefix in prefixes)


def mirror_path_for_primary(rel: str) -> str:
    if "/" not in rel:
        return f"audit/files_analysis/_root/{rel}.md"
    return f"audit/files_analysis/{rel}.md"


def original_from_mirror(rel: str) -> str | None:
    if not rel.startswith(MIRROR_ROOT):
        return None
    tail = rel[len(MIRROR_ROOT) :]
    if not tail.endswith(".md"):
        return None
    raw = tail[:-3]
    if raw.startswith("_root/"):
        return raw[len("_root/") :]
    return raw


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_bytes(path: Path) -> bytes:
    return path.read_bytes()


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def include_doc_by_keyword(rel_lower: str) -> bool:
    return any(keyword in rel_lower for keyword in DOC_KEYWORDS)


def include_primary(rel: str) -> bool:
    rel_lower = rel.lower()
    if rel_lower.startswith("audit/files_analysis/"):
        return False

    if rel in ROOT_FILES:
        return True
    if rel_lower.startswith("audit/"):
        return True
    if rel_lower.startswith(".github/"):
        return True
    if rel_lower.startswith("artifacts/"):
        return True
    if rel_lower.startswith("releases/"):
        return True
    if rel_lower.startswith("ops/governance/") or rel_lower.startswith("ops/release/") or rel_lower.startswith("ops/env/"):
        return True
    if rel_lower == "ops/release-secrets-inventory-2026-03-24.md":
        return True
    if rel_lower.startswith("logs/ci-runs/"):
        return True
    if rel_lower.startswith(PACK_ROOT):
        parts = rel_lower.split("/")
        if len(parts) == 4 and parts[-1] in {"manifest.json", "collection-report.json", "readiness-gate-report.json"}:
            return True
        if len(parts) == 5 and parts[-1] in {"manifest.json", "readiness.json", "evidence.json"}:
            return True
        return False
    if rel_lower.startswith("docs/"):
        if starts_with_any(rel_lower, CONTROL_DOC_DIRS):
            return True
        if rel_lower in {
            "docs/architecture.md",
            "docs/observability-alerts.md",
            "docs/observabilidade_e_slos.md",
            "docs/slo.md",
            "docs/service-catalog.md",
            "docs/service-criticality.md",
            "docs/security-pr-acceptance.md",
            "docs/taxonomy.md",
            "docs/readme.md",
            "docs/rfc-template.md",
            "docs/log-retention-policy.md",
            "docs/tenant-deletion-policy.md",
        }:
            return True
        if rel_lower.startswith("docs/agent-packs/"):
            return include_doc_by_keyword(rel_lower)
        if rel_lower.startswith("docs/ux/") or rel_lower.startswith("docs/billing/"):
            return include_doc_by_keyword(rel_lower)
        return False
    if rel_lower.startswith("scripts/"):
        return any(
            rel_lower.startswith(prefix)
            for prefix in (
                "scripts/audit/",
                "scripts/ci/",
                "scripts/diagnostics/",
                "scripts/docs/",
                "scripts/f0/",
                "scripts/forensics/",
                "scripts/quality/",
                "scripts/release/",
                "scripts/security/",
                "scripts/testing/",
            )
        ) or include_doc_by_keyword(rel_lower)
    if rel_lower.startswith("packages/database/scripts/"):
        return include_doc_by_keyword(rel_lower)
    if rel_lower.startswith("tests/"):
        return include_doc_by_keyword(rel_lower)
    return False


def include_mirror(rel: str) -> bool:
    original = original_from_mirror(rel)
    if not original:
        return False
    return include_primary(original)


def parse_json(text: str) -> Any | None:
    try:
        return json.loads(text)
    except Exception:
        return None


def compact(value: str, limit: int = 220) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    if len(value) <= limit:
        return value
    return value[: limit - 3].rstrip() + "..."


def first_non_empty_line(text: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return ""


def first_heading(text: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("#").strip()
        if stripped.startswith("title:"):
            return stripped
        if stripped.startswith("name:"):
            return stripped
        if stripped.startswith("description:"):
            return stripped
    return first_non_empty_line(text)


def html_title(text: str) -> str:
    match = re.search(r"<title>(.*?)</title>", text, flags=re.IGNORECASE | re.DOTALL)
    if match:
        return compact(match.group(1))
    match = re.search(r"<h1[^>]*>(.*?)</h1>", text, flags=re.IGNORECASE | re.DOTALL)
    if match:
        return compact(re.sub(r"<[^>]+>", "", match.group(1)))
    return compact(first_non_empty_line(text))


def csv_header(text: str) -> str:
    for line in text.splitlines():
        if line.strip():
            return compact(line.strip())
    return ""


def basename(rel: str) -> str:
    return rel.rsplit("/", 1)[-1]


def technical_type(rel: str, origin: str = "primary", original_rel: str | None = None) -> str:
    target = (original_rel if origin.startswith("Derivado") and original_rel else rel).lower()
    name = basename(target)

    if origin.startswith("Derivado"):
        return f"files_analysis mirror ({technical_type(target)})"
    if name == "codeowners":
        return "ownership matrix"
    if target.startswith(".github/workflows/"):
        return "CI/CD control workflow"
    if target.startswith(".github/issue_template/"):
        return "issue intake template"
    if name.endswith(".prompt.md") or "prompt_soberano" in name or name == "prompt_geral_pendencias.md":
        return "operational prompt"
    if name.endswith(".instructions.md") or "/instructions/" in target:
        return "instruction set"
    if name == "skill.md":
        return "skill definition"
    if "checklist" in name:
        return "checklist"
    if name == "checks.json":
        return "control check registry"
    if "traceability" in name and name.endswith(".json"):
        return "traceability dataset"
    if "traceability" in name or "matrix" in name:
        return "traceability matrix"
    if "inventory" in name:
        return "inventory"
    if name == "manifest.json" and target.startswith(PACK_ROOT):
        return "collection manifest" if target.count("/") == 3 else "agent pack manifest"
    if name == "collection-report.json":
        return "collection inventory"
    if name == "readiness-gate-report.json":
        return "readiness gate report"
    if name == "readiness.json":
        return "readiness report"
    if name == "evidence.json":
        return "evidence bundle"
    if "scorecard" in name:
        return "scorecard"
    if "preflight" in name:
        return "preflight report" if target.startswith("artifacts/") or target.startswith("docs/") else "preflight automation"
    if "smoke" in name:
        return "smoke report" if target.startswith("artifacts/") or target.startswith("docs/") else "smoke automation"
    if "rollback" in name and target.endswith(".sql"):
        return "rollback script"
    if "rollback" in name:
        return "rollback evidence"
    if name.endswith(".sha256"):
        return "integrity checksum"
    if target.startswith("docs/adrs/") or target.startswith("docs/adr/"):
        return "ADR"
    if "architecture" in name or target.startswith("docs/architecture/") or name == "architecture.md":
        return "architecture artifact"
    if "maturity" in name:
        return "maturity assessment"
    if target.startswith("docs/execution/") or re.search(r"/f[0-9]+", target):
        return "phase execution record"
    if target.startswith(".github/prompts/") or target.startswith(".github/instructions/") or target.startswith(".github/skills/"):
        return "instruction asset"
    if target.startswith(".github/hooks/"):
        return "governance hook"
    if target.startswith(".github/lockfile/"):
        return "integrity lock artifact"
    if target.startswith(".github/"):
        return "repository governance control"
    if target.startswith("artifacts/release/"):
        return "release evidence artifact"
    if target.startswith("artifacts/security/"):
        return "security evidence artifact"
    if target.startswith("artifacts/quality/"):
        return "quality baseline artifact"
    if target.startswith("artifacts/privacy/"):
        return "privacy evidence artifact"
    if target.startswith("artifacts/ownership-governance/"):
        return "ownership governance report"
    if target.startswith("artifacts/materialization/"):
        return "control materialization report"
    if target.startswith("artifacts/agent-readiness/"):
        return "agent readiness artifact"
    if target.startswith("artifacts/f11-closure-"):
        return "closure evidence artifact"
    if target.startswith("artifacts/"):
        return "audit artifact"
    if target.startswith("audit/autofix/notes/"):
        return "remediation note"
    if target.startswith("audit/autofix/snapshots/"):
        return "remediation snapshot"
    if target.startswith("audit/autofix/"):
        return "autofix manifest"
    if target.startswith("audit/") and name.endswith(".html"):
        return "audit dashboard"
    if target.startswith("audit/") and name.endswith(".json"):
        return "audit dataset"
    if target.startswith("audit/"):
        return "audit report"
    if target.startswith("releases/manifests/"):
        return "release manifest"
    if target.startswith("releases/evidence/"):
        return "release evidence index"
    if target.startswith("releases/"):
        return "release structure document"
    if target.startswith("ops/governance/") and name.endswith(".ics"):
        return "review schedule"
    if target.startswith("ops/governance/"):
        return "governance record"
    if target.startswith("ops/release/") or target.startswith("ops/env/"):
        return "release sealed artifact"
    if target.startswith("scripts/release/"):
        return "release automation"
    if target.startswith("scripts/security/"):
        return "security audit script"
    if target.startswith("scripts/testing/"):
        return "testing audit script"
    if target.startswith("scripts/diagnostics/") or target.startswith("scripts/audit/") or target.startswith("scripts/forensics/"):
        return "audit automation"
    if target.startswith("scripts/quality/"):
        return "quality baseline generator"
    if target.startswith("scripts/ci/"):
        return "CI governance script"
    if target.startswith("scripts/f0/"):
        return "governance baseline generator"
    if target.startswith("scripts/docs/"):
        return "documentation control script"
    if target.startswith("scripts/"):
        return "control script"
    if target.startswith("docs/runbooks/"):
        return "runbook"
    if target.startswith("docs/testing/"):
        return "testing control document"
    if target.startswith("docs/technical-debt/"):
        return "technical debt register"
    if target.startswith("docs/observability/"):
        return "observability dataset"
    if target.startswith("docs/evidence/"):
        return "evidence narrative"
    if target.startswith("docs/release/"):
        return "release readiness document"
    if target.startswith("docs/templates/") or name.endswith("-template.md"):
        return "template"
    if target.startswith("docs/programs/"):
        return "program prompt"
    if target.startswith("docs/workflows/"):
        return "workflow governance document"
    if target.startswith("docs/operational/") or target.startswith("docs/operations/") or target.startswith("docs/processes/"):
        return "operational governance document"
    if target.startswith("docs/security/"):
        return "security governance document"
    if target.startswith("docs/standards/"):
        return "engineering standard"
    if target.startswith("docs/") and name.endswith(".csv"):
        return "BI dataset"
    if target.startswith("docs/"):
        return "governance document"
    if target.startswith("tests/"):
        return "control test"
    return "governance artifact"


def category_for(rel: str, origin: str, original_rel: str | None = None) -> str:
    target = (original_rel if origin.startswith("Derivado") and original_rel else rel).lower()

    if origin.startswith("Derivado"):
        return CATEGORY_DERIVED
    if any(
        token in target
        for token in (
            "/prompts/",
            "/instructions/",
            "/skills/",
            "prompt_geral_pendencias",
            "prompt_soberano",
            ".prompt.md",
            "copilot-instructions",
        )
    ):
        return CATEGORY_PROMPTS
    if any(
        token in target
        for token in (
            "readiness",
            "release",
            "preflight",
            "smoke",
            "rollback",
            "scorecard",
            "go-live",
            "production_gate",
            "production-gate",
        )
    ):
        return CATEGORY_RELEASE
    if any(
        token in target
        for token in (
            "maturity",
            "architecture",
            "adr",
            "adrs/",
            "service-catalog",
            "service-criticality",
            "observability",
            "slo",
        )
    ):
        return CATEGORY_ARCH
    if any(
        token in target
        for token in (
            "gap",
            "remediation",
            "autofix",
            "technical-debt",
            "documentation-gap",
            "debt",
            "residual-risk",
            "risk-register",
        )
    ):
        return CATEGORY_GAP
    if any(
        token in target
        for token in (
            "/execution/",
            "cycle-",
            "f0-",
            "f1-",
            "f2-",
            "f3-",
            "f4-",
            "f5-",
            "playbook_agentes",
            "playbook",
            "/agents/bi/",
            "relatorio_conformidade_f1_f5",
            "matriz_agente_vertical",
            "vertical_personas",
        )
    ):
        return CATEGORY_LIFECYCLE
    if any(
        token in target
        for token in (
            "traceability",
            "inventory",
            "matrix",
            "catalog",
            "manifest",
            "codeowners",
            "collection-report",
            "bi_",
            "kpi",
            "ownership",
            "dataset",
            "evidence_index",
        )
    ):
        return CATEGORY_TRACEABILITY
    if any(
        token in target
        for token in (
            "checklist",
            "checks.json",
            "workflow",
            "policy",
            "acceptance-criteria",
            "criteria",
            "compliance",
            "quality",
            "guard",
            "hook",
            "validate",
            "verification",
        )
    ):
        return CATEGORY_CONTROL
    return CATEGORY_GOVERNANCE


def description_for(rel: str, tech_type: str, origin: str, original_rel: str | None = None) -> str:
    target = original_rel if origin.startswith("Derivado") and original_rel else rel
    if origin.startswith("Derivado"):
        return f"Espelho analitico em Markdown do artefato `{original_rel}` preservado em `audit/files_analysis`."
    if tech_type == "agent pack manifest":
        pack = Path(target).parent.name
        return f"Manifesto compilado do pack `{pack}`, com identidade do agente, politicas, skills e ferramentas."
    if tech_type == "readiness report":
        pack = Path(target).parent.name
        return f"Relatorio estruturado de prontidao do pack `{pack}`, cobrindo manifesto, integracao, politica e adaptadores."
    if tech_type == "evidence bundle":
        pack = Path(target).parent.name
        return f"Evidencia executavel do pack `{pack}`, com dry-run, bindings runtime e rastreio da fonte compilada."
    if tech_type == "traceability matrix":
        return "Matriz que relaciona requisitos, fases, fluxos criticos ou artefatos com evidencias correspondentes."
    if tech_type == "inventory":
        return "Inventario versionado de artefatos, ativos, segredos, ambientes ou evidencias controladas."
    if tech_type == "checklist":
        return "Checklist operacional ou de governanca usado para validar gates, conformidade ou readiness."
    if tech_type == "control check registry":
        return "Registro estruturado de checks e estados de controle dentro do workspace de auditoria."
    if tech_type == "scorecard":
        return "Scorecard de release ou conformidade usado para sintetizar gates e criterio minimo de aprovacao."
    if tech_type == "audit dashboard":
        return "Painel HTML do workspace de auditoria com consolidacao visual de governanca e evidencias."
    if tech_type == "audit report":
        return "Relatorio versionado do workspace de auditoria com conclusoes, lacunas ou rastreabilidade."
    if tech_type == "maturity assessment":
        return "Avaliacao de maturidade SaaS ou de engenharia usada para posicionar o estado alvo."
    if tech_type == "architecture artifact":
        return "Artefato arquitetural que define alvo, principios, decisoes ou topologias do sistema."
    if tech_type == "ADR":
        return "Decision record arquitetural usado para rastrear escolhas permanentes e trade-offs."
    if tech_type == "operational prompt":
        return "Prompt operacional versionado para orientar execucao, revisao ou consolidacao de pendencias."
    if tech_type == "instruction set" or tech_type == "instruction asset":
        return "Instrucao versionada para padronizar comportamento de agentes, skills ou revisoes."
    if tech_type == "skill definition":
        return "Skill versionada com procedimento, referencias e checklist de validacao."
    if tech_type == "CI/CD control workflow":
        return "Workflow de GitHub Actions usado para enforcement de controles, quality gates ou materializacao documental."
    if tech_type == "repository governance control":
        return "Controle versionado de governanca do repositorio, como owners, templates, settings ou allowlists."
    if tech_type == "ownership matrix":
        return "Matriz de ownership usada para definir responsabilidade formal por areas e caminhos do repositorio."
    if tech_type == "governance hook":
        return "Hook local de governanca que valida pre-uso ou pos-uso de ferramentas e artefatos."
    if tech_type == "release readiness document":
        return "Documento de readiness, rollout ou go-live usado para garantir liberacao controlada."
    if tech_type == "release evidence artifact":
        return "Artefato objetivo de release, como preflight, smoke, rollback ou score consolidado."
    if tech_type == "closure evidence artifact":
        return "Artefato de fechamento com logs, checksums ou indice de evidencias da rodada final."
    if tech_type == "security evidence artifact":
        return "Evidencia objetiva de seguranca, como OWASP baseline, audit de dependencias ou scan de credenciais."
    if tech_type == "quality baseline artifact":
        return "Baseline de qualidade usado para acompanhar complexidade, bundle, duplicidade ou conformidade."
    if tech_type == "technical debt register":
        return "Registro de divida tecnica ou remediacao usado para planejar correcoes e acompanhar pendencias."
    if tech_type == "remediation note":
        return "Nota de remediacao ligada a um lote de correcao ou snapshot tecnico do processo de autofix."
    if tech_type == "remediation snapshot":
        return "Snapshot tecnico versionado para sustentar uma evidencia de remediacao dentro da auditoria."
    if tech_type == "collection manifest":
        return "Manifesto raiz da colecao compilada de agent packs usada como catalogo governado."
    if tech_type == "collection inventory":
        return "Inventario da colecao compilada de agents, com cobertura e metadados de catalogacao."
    if tech_type == "readiness gate report":
        return "Relatorio agregado de readiness para a colecao inteira de packs compilados."
    if tech_type == "BI dataset":
        return "Dataset em CSV/JSON usado para BI, KPI, conformidade ou priorizacao de artefatos."
    if tech_type == "runbook":
        return "Runbook operacional para deploy, incidente, DR, rollback ou execucao controlada."
    if tech_type == "phase execution record":
        return "Registro datado de fase/ciclo com checkpoints, gates ou execucao controlada do plano."
    if tech_type == "control script":
        return "Script versionado de suporte ao sistema de controle, verificacao ou auditoria."
    if tech_type == "audit automation":
        return "Automacao de auditoria ou diagnostico usada para materializar verificacoes e relatorios."
    if tech_type == "release automation":
        return "Automacao de release usada para preflight, smoke, rollback ou migracao final."
    if tech_type == "security audit script":
        return "Script de seguranca usado para varredura, baseline ou relatorio objetivo."
    if tech_type == "testing audit script":
        return "Script de teste usado para gerar rastreabilidade, regressao zero ou performance evidence."
    if tech_type == "CI governance script":
        return "Script de governanca do CI usado para hygiene, compliance, freeze ou score de release."
    if tech_type == "governance baseline generator":
        return "Gerador de baseline usado para estabelecer um estado minimo de governanca auditavel."
    if tech_type == "documentation control script":
        return "Script de controle documental usado para dashboard tecnico, links ou dependencias."
    if tech_type == "control test":
        return "Teste automatizado que protege evidencias, readiness, smoke, seguranca ou rastreabilidade."
    return "Artefato de governanca e auditoria do repositorio."


def evidence_for(path: Path, rel: str, origin: str, original_rel: str | None = None) -> str:
    if origin.startswith("Derivado"):
        text = read_text(path)
        return compact(f"Espelho de `{original_rel}`; abertura: {first_heading(text)}")

    name = path.name.lower()
    text = read_text(path)
    if path.suffix.lower() == ".json":
        payload = parse_json(text)
        if isinstance(payload, dict):
            if "agent" in payload and isinstance(payload["agent"], dict):
                agent = payload["agent"]
                return compact(
                    f"agent.id={agent.get('id')}; kind={agent.get('kind')}; version={agent.get('version')}"
                )
            if "readiness" in payload and isinstance(payload["readiness"], dict):
                source_path = None
                evidence = payload.get("evidence")
                if isinstance(evidence, dict):
                    source_path = evidence.get("sourcePath")
                return compact(
                    f"readiness.overall={payload['readiness'].get('overall')}; sourcePath={source_path}"
                )
            if "agentId" in payload:
                return compact(
                    f"agentId={payload.get('agentId')}; generatedAt={payload.get('generatedAt')}; sourcePath={payload.get('sourcePath')}"
                )
            if isinstance(payload.get("path"), str):
                return compact(f"path={payload.get('path')}; status={payload.get('status')}")
            keys = ", ".join(list(payload.keys())[:6])
            return compact(f"JSON keys: {keys}")
        if isinstance(payload, list):
            if payload and isinstance(payload[0], dict):
                keys = ", ".join(list(payload[0].keys())[:6])
                return compact(f"Lista JSON ({len(payload)} itens); chaves iniciais: {keys}")
            return compact(f"Lista JSON com {len(payload)} itens")
    if path.suffix.lower() in {".md", ".mdx", ".txt", ".yml", ".yaml", ".toml", ".ps1", ".sh", ".ts", ".js", ".mjs", ".py", ".sql"}:
        heading = first_heading(text)
        if heading:
            return compact(heading)
    if path.suffix.lower() == ".html":
        return compact(html_title(text))
    if path.suffix.lower() == ".csv":
        return compact(csv_header(text))
    if path.suffix.lower() == ".ics":
        return compact(first_non_empty_line(text))
    if name.endswith(".sha256"):
        return compact(first_non_empty_line(text))
    return compact(f"Estrutura: {rel}")


def source_reference_for(path: Path) -> str | None:
    if path.suffix.lower() != ".json":
        return None
    payload = parse_json(read_text(path))
    if not isinstance(payload, dict):
        return None
    if "sourcePath" in payload and isinstance(payload["sourcePath"], str):
        return payload["sourcePath"]
    evidence = payload.get("evidence")
    if isinstance(evidence, dict) and isinstance(evidence.get("sourcePath"), str):
        return evidence["sourcePath"]
    return None


def build_primary_entries(files: list[Path]) -> dict[str, Entry]:
    entries: dict[str, Entry] = {}
    for path in files:
        rel = rel_posix(path)
        if not include_primary(rel):
            continue
        raw = read_bytes(path)
        tech_type = technical_type(rel)
        source_ref = source_reference_for(path)
        entry = Entry(
            path=rel,
            name=path.name,
            category=category_for(rel, "Primario"),
            technical_type=tech_type,
            origin="Primario",
            status="Existe",
            description=description_for(rel, tech_type, "Primario"),
            evidence=evidence_for(path, rel, "Primario"),
            sha256=sha256_bytes(raw),
            size=len(raw),
            related_source_path=source_ref,
        )
        entries[rel] = entry
    return entries


def build_derived_entries(files: list[Path], primary_entries: dict[str, Entry]) -> dict[str, Entry]:
    entries: dict[str, Entry] = {}
    for path in files:
        rel = rel_posix(path)
        if not include_mirror(rel):
            continue
        original_rel = original_from_mirror(rel)
        if not original_rel:
            continue
        raw = read_bytes(path)
        status = "Duplicado" if original_rel in primary_entries else "Inconsistente"
        tech_type = technical_type(rel, origin="Derivado (files_analysis)", original_rel=original_rel)
        entry = Entry(
            path=rel,
            name=path.name,
            category=CATEGORY_DERIVED,
            technical_type=tech_type,
            origin="Derivado (files_analysis)",
            status=status,
            description=description_for(rel, tech_type, "Derivado (files_analysis)", original_rel),
            evidence=evidence_for(path, rel, "Derivado (files_analysis)", original_rel),
            sha256=sha256_bytes(raw),
            size=len(raw),
            related_primary=original_rel,
        )
        entries[rel] = entry
    return entries


def mark_primary_duplicates(primary_entries: dict[str, Entry]) -> tuple[list[list[str]], list[dict[str, Any]]]:
    hash_groups: dict[str, list[str]] = defaultdict(list)
    for rel, entry in primary_entries.items():
        hash_groups[entry.sha256].append(rel)

    exact_duplicates: list[list[str]] = []
    for rels in hash_groups.values():
        if len(rels) <= 1:
            continue
        sizes = [primary_entries[rel].size for rel in rels]
        if max(sizes) <= 4:
            continue
        exact_duplicates.append(sorted(rels))
        for rel in rels:
            primary_entries[rel].status = "Duplicado"

    normalized_groups: dict[str, list[str]] = defaultdict(list)
    for rel in primary_entries:
        base = basename(rel).lower()
        if base in IGNORE_CONFLICT_BASENAMES:
            continue
        if not any(keyword in base for keyword in SEMANTIC_NAME_KEYWORDS):
            continue
        norm = re.sub(r"[^a-z0-9]", "", base)
        if not norm:
            continue
        normalized_groups[norm].append(rel)

    version_conflicts: list[dict[str, Any]] = []
    for rels in normalized_groups.values():
        if len(rels) <= 1:
            continue
        hashes = {primary_entries[rel].sha256 for rel in rels}
        if len(hashes) <= 1:
            continue
        if not any(include_doc_by_keyword(rel.lower()) for rel in rels):
            continue
        group = sorted(rels)
        version_conflicts.append({"files": group, "hashes": sorted(hashes)})
        for rel in group:
            if primary_entries[rel].status != "Duplicado":
                primary_entries[rel].status = "Inconsistente"

    exact_duplicates.sort()
    version_conflicts.sort(key=lambda item: item["files"])
    return exact_duplicates, version_conflicts


def count_missing_source_refs(primary_entries: dict[str, Entry]) -> list[dict[str, str]]:
    missing: list[dict[str, str]] = []
    for entry in primary_entries.values():
        source_ref = entry.related_source_path
        if not source_ref:
            continue
        if (ROOT / source_ref).exists():
            continue
        mirror_candidate = ROOT / mirror_path_for_primary(source_ref)
        missing.append(
            {
                "artifact": entry.path,
                "source_path": source_ref,
                "mirror_exists": "yes" if mirror_candidate.exists() else "no",
            }
        )
    missing.sort(key=lambda item: (item["source_path"], item["artifact"]))
    return missing


def build_coverage(entries_by_path: dict[str, Entry]) -> list[dict[str, str]]:
    def pick(*paths: str) -> tuple[str, str]:
        for item in paths:
            if item in entries_by_path:
                return "SIM", item
        return "NAO", "NAO ENCONTRADO"

    checklist = pick("audit/master_governance_checklist.md", "audit/master_execution_checklist.md")
    traceability = pick("audit/traceability_matrix.md", "docs/testing/F5_TRACEABILITY.md")
    validation = pick("audit/validation_log.md")
    inventory = pick("audit/inventory.json", "audit/forensic_inventory.md")
    gap = pick("audit/gaps.md", "docs/technical-debt/tracker.json")
    maturity = pick("audit/saas_maturity_score.md")
    architecture = pick("audit/target_architecture.md", "docs/ARCHITECTURE.md")
    lifecycle = pick("docs/execution/f1-kickoff-2026-03-25.md", "audit/files_analysis/.github/agents/RELATORIO_CONFORMIDADE_F1_F5.md.md")
    release = pick("docs/release/V1_PRODUCTION_GATE.md", "artifacts/release/scorecard.md")

    return [
        {"question": "Existe checklist mestre?", "answer": checklist[0], "file": checklist[1]},
        {"question": "Existe matriz de rastreabilidade?", "answer": traceability[0], "file": traceability[1]},
        {"question": "Existe log de validacao?", "answer": validation[0], "file": validation[1]},
        {"question": "Existe inventario completo?", "answer": inventory[0], "file": inventory[1]},
        {"question": "Existe gap analysis?", "answer": gap[0], "file": gap[1]},
        {"question": "Existe score de maturidade?", "answer": maturity[0], "file": maturity[1]},
        {"question": "Existe arquitetura alvo?", "answer": architecture[0], "file": architecture[1]},
        {"question": "Existe controle de ciclos/fases?", "answer": lifecycle[0], "file": lifecycle[1]},
        {"question": "Existe readiness de release?", "answer": release[0], "file": release[1]},
    ]


def build_alerts(
    entries: list[Entry],
    exact_duplicates: list[list[str]],
    version_conflicts: list[dict[str, Any]],
    orphan_mirrors: list[Entry],
    missing_source_refs: list[dict[str, str]],
) -> list[str]:
    alerts: list[str] = []
    if "audit/master_governance_checklist.md" not in {entry.path for entry in entries}:
        alerts.append("Falta artefato essencial de checklist mestre no workspace `audit/`.")
    if orphan_mirrors:
        alerts.append(
            f"Ha {len(orphan_mirrors)} espelhos em `audit/files_analysis` cujo artefato primario nao existe mais na arvore viva."
        )
    if missing_source_refs:
        alerts.append(
            f"Ha {len(missing_source_refs)} artefatos compilados com `sourcePath` apontando para arquivos ausentes na arvore viva; a rastreabilidade depende apenas do espelho `files_analysis`."
        )
    if exact_duplicates:
        alerts.append(
            f"Foram encontrados {len(exact_duplicates)} grupos de duplicidade exata entre artefatos primarios, exigindo consolidacao de fonte de verdade."
        )
    if version_conflicts:
        alerts.append(
            f"Foram encontrados {len(version_conflicts)} grupos de versoes conflitantes por nome normalizado e conteudo divergente."
        )
    if any(entry.path == "audit/forensic_inventory.md" for entry in entries):
        alerts.append(
            "O inventario ja existente em `audit/forensic_inventory.md` e resumido; ele nao substitui a listagem arquivo a arquivo desta varredura."
        )
    if any(entry.path == "releases/manifests/release-secrets-inventory-2026-03-24.md" for entry in entries) and any(
        entry.path == "ops/release-secrets-inventory-2026-03-24.md" for entry in entries
    ):
        alerts.append(
            "O inventario de segredos de release existe em `releases/manifests/` e em `ops/`, indicando duplicidade potencial de manutencao."
        )
    return alerts


def render_markdown(
    entries: list[Entry],
    category_counts: Counter[str],
    exact_duplicates: list[list[str]],
    version_conflicts: list[dict[str, Any]],
    mirror_pairs: list[Entry],
    orphan_mirrors: list[Entry],
    missing_source_refs: list[dict[str, str]],
    coverage: list[dict[str, str]],
    alerts: list[str],
) -> str:
    lines: list[str] = []
    lines.append("# Inventario Forense de Governanca e Auditoria")
    lines.append("")
    lines.append("## 1. INVENTARIO GLOBAL")
    lines.append("")
    lines.append(f"- Total de arquivos encontrados: {len(entries)}")
    lines.append("- Total por categoria:")
    for category in CATEGORIES:
        lines.append(f"  - {category}: {category_counts.get(category, 0)}")
    duplicate_total = sum(1 for entry in entries if entry.status == "Duplicado")
    derived_total = sum(1 for entry in entries if entry.origin == "Derivado (files_analysis)")
    inconsistent_total = sum(1 for entry in entries if entry.status == "Inconsistente")
    lines.append(f"- Total de duplicados: {duplicate_total}")
    lines.append(f"- Total de arquivos derivados (files_analysis): {derived_total}")
    lines.append(f"- Total de arquivos inconsistentes: {inconsistent_total}")
    lines.append("")
    lines.append("## 2. LISTA COMPLETA DE ARQUIVOS")
    lines.append("")

    grouped: dict[str, list[Entry]] = defaultdict(list)
    for entry in entries:
        grouped[entry.category].append(entry)

    for category in CATEGORIES:
        items = sorted(grouped.get(category, []), key=lambda item: item.path.lower())
        if not items:
            continue
        lines.append(f"### {category}")
        lines.append("")
        for index, entry in enumerate(items, start=1):
            lines.append(f"#### {category} :: {index:04d} :: {entry.name}")
            lines.append(f"- Caminho completo: `{entry.path}`")
            lines.append(f"- Nome do arquivo: `{entry.name}`")
            lines.append(f"- Categoria: `{entry.category}`")
            lines.append(f"- Tipo tecnico: `{entry.technical_type}`")
            lines.append(f"- Origem: `( ) Primario` `( ) Derivado (files_analysis)` -> `{entry.origin}`")
            lines.append(f"- Status: `( ) Existe` `( ) Duplicado` `( ) Inconsistente` -> `{entry.status}`")
            lines.append(f"- Descricao objetiva (1-2 linhas): {entry.description}")
            lines.append(f"- Evidencia (trecho do arquivo ou estrutura): {entry.evidence}")
            if entry.related_primary:
                lines.append(f"- Relacao primaria: `{entry.related_primary}`")
            if entry.related_source_path:
                lines.append(f"- Referencia de origem declarada: `{entry.related_source_path}`")
            lines.append("")

    lines.append("## 3. ANALISE DE DUPLICIDADE")
    lines.append("")
    lines.append("### Arquivos duplicados")
    if exact_duplicates:
        for group in exact_duplicates:
            lines.append(f"- Grupo: `{'; '.join(group)}`")
    else:
        lines.append("- Nenhum grupo de duplicidade exata entre artefatos primarios.")
    lines.append("")
    lines.append("### Versoes conflitantes")
    if version_conflicts:
        for group in version_conflicts:
            lines.append(f"- Grupo: `{'; '.join(group['files'])}`")
    else:
        lines.append("- Nenhum grupo de versoes conflitantes detectado por nome normalizado.")
    lines.append("")
    lines.append("### Arquivos espelhados em `/files_analysis`")
    if mirror_pairs:
        for entry in sorted(mirror_pairs, key=lambda item: item.path.lower()):
            lines.append(f"- Espelho: `{entry.path}` -> Primario: `{entry.related_primary}`")
    else:
        lines.append("- Nenhum espelho relevante em `audit/files_analysis`.")
    lines.append("")
    lines.append("### Espelhos orfaos")
    if orphan_mirrors:
        for entry in sorted(orphan_mirrors, key=lambda item: item.path.lower()):
            lines.append(f"- Orfao: `{entry.path}` -> Primario ausente: `{entry.related_primary}`")
    else:
        lines.append("- Nenhum espelho orfao relevante.")
    lines.append("")
    lines.append("### Referencias de origem ausentes em artefatos compilados")
    if missing_source_refs:
        for item in missing_source_refs:
            lines.append(
                f"- Artefato: `{item['artifact']}` -> sourcePath ausente: `{item['source_path']}` -> mirror_exists={item['mirror_exists']}"
            )
    else:
        lines.append("- Nenhum `sourcePath` ausente detectado nos artefatos compilados relevantes.")
    lines.append("")

    lines.append("## 4. MAPA DE COBERTURA")
    lines.append("")
    for item in coverage:
        lines.append(f"- {item['question']}")
        lines.append(f"  - {item['answer']}")
        lines.append(f"  - Arquivo correspondente: `{item['file']}`")
    lines.append("")

    lines.append("## 5. ALERTAS CRITICOS")
    lines.append("")
    if alerts:
        for alert in alerts:
            lines.append(f"- {alert}")
    else:
        lines.append("- Nenhum alerta critico adicional.")
    lines.append("")
    return "\n".join(lines) + "\n"


def main() -> None:
    files = enumerate_files()
    primary_entries = build_primary_entries(files)
    derived_entries = build_derived_entries(files, primary_entries)
    exact_duplicates, version_conflicts = mark_primary_duplicates(primary_entries)

    all_entries = list(primary_entries.values()) + list(derived_entries.values())
    all_entries.sort(key=lambda item: (item.category, item.path.lower()))

    mirror_pairs = [entry for entry in derived_entries.values() if entry.status == "Duplicado"]
    orphan_mirrors = [entry for entry in derived_entries.values() if entry.status == "Inconsistente"]
    missing_source_refs = count_missing_source_refs(primary_entries)

    entries_by_path = {entry.path: entry for entry in all_entries}
    coverage = build_coverage(entries_by_path)
    category_counts = Counter(entry.category for entry in all_entries)
    alerts = build_alerts(all_entries, exact_duplicates, version_conflicts, orphan_mirrors, missing_source_refs)

    payload = {
        "generated_at": datetime.now().isoformat(),
        "repository_root": str(ROOT),
        "summary": {
            "total_files_found": len(all_entries),
            "total_by_category": dict(category_counts),
            "duplicate_files": sum(1 for entry in all_entries if entry.status == "Duplicado"),
            "derived_files_analysis": sum(1 for entry in all_entries if entry.origin == "Derivado (files_analysis)"),
            "inconsistent_files": sum(1 for entry in all_entries if entry.status == "Inconsistente"),
            "exact_duplicate_groups": len(exact_duplicates),
            "version_conflict_groups": len(version_conflicts),
            "orphan_mirror_files": len(orphan_mirrors),
            "missing_source_references": len(missing_source_refs),
        },
        "inventory": [entry.as_dict() for entry in all_entries],
        "duplication_analysis": {
            "exact_duplicate_groups": exact_duplicates,
            "version_conflicts": version_conflicts,
            "mirror_pairs": [
                {"mirror": entry.path, "primary": entry.related_primary}
                for entry in sorted(mirror_pairs, key=lambda item: item.path.lower())
            ],
            "orphan_mirrors": [
                {"mirror": entry.path, "primary": entry.related_primary}
                for entry in sorted(orphan_mirrors, key=lambda item: item.path.lower())
            ],
            "missing_source_references": missing_source_refs,
        },
        "coverage_map": coverage,
        "critical_alerts": alerts,
    }

    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUTPUT_MD.write_text(
        render_markdown(
            all_entries,
            category_counts,
            exact_duplicates,
            version_conflicts,
            mirror_pairs,
            orphan_mirrors,
            missing_source_refs,
            coverage,
            alerts,
        ),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "json": str(OUTPUT_JSON),
                "markdown": str(OUTPUT_MD),
                "total_files": len(all_entries),
                "derived": sum(1 for entry in all_entries if entry.origin == "Derivado (files_analysis)"),
                "duplicates": sum(1 for entry in all_entries if entry.status == "Duplicado"),
                "inconsistent": sum(1 for entry in all_entries if entry.status == "Inconsistente"),
                "orphan_mirrors": len(orphan_mirrors),
                "missing_source_refs": len(missing_source_refs),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
