from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
AUDIT_DIR = ROOT / "audit"
PHASE_RE = re.compile(r"(?i)(?:^|[^a-z0-9])(f(?:1[01]|[0-9]))(?:[^a-z0-9]|$)")
CYCLE_RE = re.compile(r"(?i)cycle[-_ ]?(\d{1,2})")
EXTERNAL_PROMPT_FILES = [
    (r"C:\Users\Marks\Desktop\Nova pasta\auditoria_forense_codex.html", "HTML de auditoria forense do Codex"),
    (r"C:\Users\Marks\Desktop\Nova pasta\JULES_PRE_VALIDACAO.md", "pre-validacao do Jules"),
    (r"C:\Users\Marks\Desktop\Nova pasta\UNDECLARED_OBSERVATIONS.md", "observacoes nao declaradas e hipoteses"),
    (r"C:\Users\Marks\Desktop\Nova pasta\CHECKLIST_ITEM_A_ITEM_STATUS_2026-03-20.md", "status item a item consolidado"),
    (r"C:\Users\Marks\Desktop\Nova pasta\JULES_EXECUTION_REPORT_F0.md", "relatorio de execucao do Jules para F0"),
    (r"C:\Users\Marks\Desktop\Nova pasta\JULES_PARECER_FINAL.md", "parecer final do Jules"),
    (r"C:\Users\Marks\Desktop\Nova pasta\auditoria_forense_repositorio.html", "HTML de auditoria forense do repositorio"),
    (r"C:\Users\Marks\Desktop\Nova pasta\checklist_governanca_unificada_2026-03-22.html", "checklist unificado de governanca"),
    (r"C:\Users\Marks\Desktop\Nova pasta\baseline-execution-report-2026-03-22.md", "baseline execution report"),
    (r"C:\Users\Marks\Desktop\Nova pasta\f0-baseline-report-2026-03-22.md", "baseline report da fase F0"),
    (r"C:\Users\Marks\Desktop\Nova pasta\f0-freeze-signoff-2026-03-22.md", "sign-off final de freeze F0"),
    (r"C:\Users\Marks\Desktop\Nova pasta\PROMPT_GERAL_PENDENCIAS.md", "prompt geral de pendencias forenses"),
    (r"C:\Users\Marks\Desktop\Nova pasta\COMMERCIALIZATION_REQUIREMENTS.md", "requisitos de comercializacao"),
    (r"C:\Users\Marks\Desktop\Nova pasta\organization-audit-2026-03-22.md", "auditoria de organizacao do repositorio"),
    (r"C:\Users\Marks\Desktop\Nova pasta\audit_forensic_report.md", "relatorio forense consolidado historico"),
]


def latest_inventory_json() -> Path:
    candidates = sorted(
        AUDIT_DIR.glob("governance_inventory_complete_*.json"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError("Nenhum inventario governance_inventory_complete_*.json encontrado em audit/.")
    return candidates[0]


def read_inventory(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def extract_phase_cycle(*values: str | None) -> tuple[str | None, str | None]:
    phase = None
    cycle = None
    for value in values:
        if not value:
            continue
        if phase is None:
            match = PHASE_RE.search(value)
            if match:
                phase = match.group(1).upper()
        if cycle is None:
            match = CYCLE_RE.search(value)
            if match:
                cycle = f"Cycle-{int(match.group(1)):02d}"
        if phase and cycle:
            break
    return phase, cycle


def classify_group(entry: dict) -> tuple[str, int]:
    rel = entry["path"]
    phase, cycle = extract_phase_cycle(
        rel,
        entry.get("related_primary"),
        entry.get("related_source_path"),
        entry.get("description"),
        entry.get("evidence"),
    )
    if phase:
        return f"Fase {phase}", 10 + int(phase[1:])
    if cycle:
        return f"Ciclo {cycle.split('-')[1]}", 100 + int(cycle.split("-")[1])
    lower = rel.lower()
    if any(token in lower for token in ("release", "preflight", "smoke", "rollback", "scorecard")):
        return "Release / Cross-cycle", 300
    if entry["origin"] == "Derivado (files_analysis)" and entry["status"] == "Inconsistente":
        return "Mirror Orfao / Historico", 400
    return "Transversal / Sem fase-ciclo explicito", 500


def artifact_anchor(rel: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", rel.lower()).strip("-")


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def inventory_counts(summary: dict) -> list[tuple[str, int]]:
    return sorted(summary["total_by_category"].items(), key=lambda item: item[0])


def collect_grouped_entries(entries: list[dict]) -> tuple[dict[str, list[dict]], Counter[str], Counter[str]]:
    groups: dict[str, list[dict]] = defaultdict(list)
    phase_counts: Counter[str] = Counter()
    cycle_counts: Counter[str] = Counter()

    for entry in entries:
        phase, cycle = extract_phase_cycle(
            entry["path"],
            entry.get("related_primary"),
            entry.get("related_source_path"),
            entry.get("description"),
            entry.get("evidence"),
        )
        group_name, group_order = classify_group(entry)
        entry["_phase"] = phase
        entry["_cycle"] = cycle
        entry["_group"] = group_name
        entry["_group_order"] = group_order
        groups[group_name].append(entry)
        if phase:
            phase_counts[phase] += 1
        if cycle:
            cycle_counts[cycle] += 1

    return groups, phase_counts, cycle_counts


def ordered_groups(groups: dict[str, list[dict]]) -> list[tuple[str, list[dict]]]:
    return sorted(groups.items(), key=lambda item: (item[1][0]["_group_order"], item[0]))


def render_markdown(
    report: dict,
    inventory_path: Path,
    output_md: Path,
    output_html: Path,
    prompt_path: Path,
) -> str:
    entries: list[dict] = report["inventory"]
    summary = report["summary"]
    groups, _, _ = collect_grouped_entries(entries)
    corpus_html = inventory_path.with_suffix(".html").name
    generated_at = report.get("generated_at", datetime.now().isoformat())

    lines: list[str] = [
        "# Checklist Mestre de Auditoria de Governanca e Artefatos",
        "",
        f"- Gerado em: `{generated_at}`",
        f"- Fonte do inventario: `{inventory_path.name}`",
        f"- Corpus HTML completo: `{corpus_html}`",
        f"- Checklist HTML: `{output_html.name}`",
        f"- Prompt do Jules: `{prompt_path.name}`",
        f"- Total de artefatos: `{summary['total_files_found']}`",
        f"- Derivados em files_analysis: `{summary['derived_files_analysis']}`",
        f"- Itens marcados como duplicados: `{summary['duplicate_files']}`",
        f"- Itens inconsistentes: `{summary['inconsistent_files']}`",
        "",
        "## Totais por categoria",
        "",
    ]

    for category, count in inventory_counts(summary):
        lines.append(f"- {category}: `{count}`")

    lines.extend([
        "",
        "## Alertas criticos de base",
        "",
    ])
    for alert in report.get("critical_alerts", []):
        lines.append(f"- {alert}")

    lines.extend([
        "",
        "## Itens auditaveis",
        "",
        "Cada item abaixo representa um artefato do inventario consolidado. Marque quando o artefato tiver sido efetivamente revisado durante a auditoria.",
        "",
    ])

    for group_name, items in ordered_groups(groups):
        items_sorted = sorted(
            items,
            key=lambda item: (
                item.get("_phase") or "ZZ",
                item.get("_cycle") or "ZZ",
                item["category"],
                item["path"],
            ),
        )
        lines.extend([
            f"## {group_name}",
            "",
            f"Total nesta secao: `{len(items_sorted)}`",
            "",
        ])
        for entry in items_sorted:
            anchor = artifact_anchor(entry["path"])
            details = [
                f"`{entry['category']}`",
                f"`{entry['technical_type']}`",
                f"`{entry['origin']}`",
                f"`{entry['status']}`",
            ]
            if entry.get("_phase"):
                details.append(f"`{entry['_phase']}`")
            if entry.get("_cycle"):
                details.append(f"`{entry['_cycle']}`")
            lines.append(
                f"- [ ] `{entry['path']}` | {' | '.join(details)} | [corpus]({corpus_html}#{anchor})"
            )
            lines.append(f"  Evidencia: {entry['evidence']}")
            lines.append(f"  Descricao: {entry['description']}")
        lines.append("")

    return "\n".join(lines)


def render_html(
    report: dict,
    inventory_path: Path,
    output_md: Path,
    output_html: Path,
    prompt_path: Path,
) -> str:
    entries: list[dict] = report["inventory"]
    summary = report["summary"]
    groups, phase_counts, cycle_counts = collect_grouped_entries(entries)
    corpus_html = inventory_path.with_suffix(".html").name
    generated_at = report.get("generated_at", datetime.now().isoformat())

    group_nav: list[str] = []
    group_sections: list[str] = []
    total_items = 0

    for group_name, items in ordered_groups(groups):
        group_id = slugify(group_name)
        items_sorted = sorted(
            items,
            key=lambda item: (
                item.get("_phase") or "ZZ",
                item.get("_cycle") or "ZZ",
                item["category"],
                item["path"],
            ),
        )
        total_items += len(items_sorted)
        category_counts = Counter(item["category"] for item in items_sorted)
        category_badges = "".join(
            f'<span class="badge cat">{escape(category)} ({count})</span>'
            for category, count in sorted(category_counts.items())
        )
        group_nav.append(
            f'<a class="group-link" href="#{group_id}">{escape(group_name)} <span>{len(items_sorted)}</span></a>'
        )

        rows: list[str] = []
        for index, entry in enumerate(items_sorted, start=1):
            anchor = artifact_anchor(entry["path"])
            phase = entry.get("_phase") or "n/a"
            cycle = entry.get("_cycle") or "n/a"
            rows.append(
                f"""
<label class="artifact-row" data-path="{escape(entry['path'].lower())}" data-category="{escape(entry['category'].lower())}" data-status="{escape(entry['status'].lower())}" data-origin="{escape(entry['origin'].lower())}" data-phase="{escape((entry.get('_phase') or '').lower())}" data-cycle="{escape((entry.get('_cycle') or '').lower())}">
  <input type="checkbox" class="artifact-check" data-key="{escape(entry['path'])}">
  <span class="index">{index}</span>
  <span class="artifact-main">
    <span class="artifact-path">{escape(entry['path'])}</span>
    <span class="artifact-meta">
      <span class="badge">{escape(entry['category'])}</span>
      <span class="badge">{escape(entry['technical_type'])}</span>
      <span class="badge">{escape(entry['origin'])}</span>
      <span class="badge">{escape(entry['status'])}</span>
      <span class="badge">{escape(phase)}</span>
      <span class="badge">{escape(cycle)}</span>
    </span>
    <span class="artifact-desc">{escape(entry['description'])}</span>
    <span class="artifact-evidence"><strong>Evidencia:</strong> {escape(entry['evidence'])}</span>
  </span>
  <span class="artifact-actions">
    <a href="{escape(corpus_html)}#{anchor}" target="_blank" rel="noreferrer">Abrir corpus</a>
  </span>
</label>
"""
            )

        group_sections.append(
            f"""
<section class="group" id="{group_id}">
  <div class="group-header">
    <div>
      <h2>{escape(group_name)}</h2>
      <p>{len(items_sorted)} artefatos nesta secao</p>
    </div>
    <div class="group-badges">{category_badges}</div>
  </div>
  <div class="artifact-list">
    {''.join(rows)}
  </div>
</section>
"""
        )

    phase_rows = "\n".join(
        f"<tr><td>{escape(phase)}</td><td>{count}</td></tr>"
        for phase, count in sorted(phase_counts.items(), key=lambda item: int(item[0][1:]))
    ) or "<tr><td colspan=\"2\">Sem fases explicitas.</td></tr>"

    cycle_rows = "\n".join(
        f"<tr><td>{escape(cycle)}</td><td>{count}</td></tr>"
        for cycle, count in sorted(cycle_counts.items(), key=lambda item: int(item[0].split('-')[1]))
    ) or "<tr><td colspan=\"2\">Sem ciclos explicitos.</td></tr>"

    category_rows = "\n".join(
        f"<tr><td>{escape(category)}</td><td>{count}</td></tr>"
        for category, count in inventory_counts(summary)
    )

    critical_alerts = "".join(
        f"<li>{escape(alert)}</li>" for alert in report.get("critical_alerts", [])
    ) or "<li>Nenhum alerta critico registrado.</li>"

    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Checklist Mestre de Auditoria</title>
  <style>
    :root {{
      --bg: #f5f1e8;
      --panel: #fffaf0;
      --ink: #1e1f1c;
      --muted: #6e6658;
      --line: #d9ccb3;
      --accent: #916c2f;
      --accent-2: #2d5f5d;
      --danger: #8d3d2e;
      --ok: #2c6b3f;
      --shadow: 0 10px 30px rgba(30, 31, 28, 0.08);
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(145, 108, 47, 0.16), transparent 28%),
        radial-gradient(circle at bottom right, rgba(45, 95, 93, 0.14), transparent 34%),
        var(--bg);
    }}
    a {{ color: var(--accent-2); }}
    .layout {{
      display: grid;
      grid-template-columns: 320px 1fr;
      min-height: 100vh;
    }}
    .sidebar {{
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
      padding: 24px 20px 40px;
      background: rgba(255, 250, 240, 0.92);
      border-right: 1px solid var(--line);
      backdrop-filter: blur(10px);
    }}
    .brand {{
      margin-bottom: 24px;
    }}
    .brand h1 {{
      margin: 0 0 10px;
      font-size: 1.45rem;
      line-height: 1.2;
    }}
    .brand p {{
      margin: 0;
      color: var(--muted);
      font-size: 0.95rem;
    }}
    .nav {{
      display: grid;
      gap: 8px;
      margin-top: 22px;
    }}
    .group-link {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 12px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: white;
      text-decoration: none;
    }}
    .group-link span {{
      color: var(--accent);
      font-weight: 700;
    }}
    .main {{
      padding: 30px;
    }}
    .hero {{
      background: linear-gradient(135deg, rgba(145, 108, 47, 0.92), rgba(45, 95, 93, 0.92));
      color: white;
      border-radius: 20px;
      padding: 28px;
      box-shadow: var(--shadow);
    }}
    .hero h1 {{
      margin: 0 0 12px;
      font-size: 2rem;
    }}
    .hero p {{
      margin: 0;
      max-width: 1080px;
      line-height: 1.5;
    }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin: 22px 0 28px;
    }}
    .stat {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px;
      box-shadow: var(--shadow);
    }}
    .stat strong {{
      display: block;
      font-size: 1.55rem;
      margin-bottom: 6px;
    }}
    .toolbar {{
      display: grid;
      grid-template-columns: 1.6fr repeat(4, minmax(150px, 1fr));
      gap: 12px;
      margin: 22px 0;
    }}
    .toolbar input,
    .toolbar select {{
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: white;
      color: var(--ink);
    }}
    .panels {{
      display: grid;
      grid-template-columns: 1.1fr 0.9fr 0.9fr;
      gap: 18px;
      margin-bottom: 28px;
    }}
    .panel {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 18px;
      box-shadow: var(--shadow);
    }}
    .panel h2 {{
      margin: 0 0 12px;
      font-size: 1.1rem;
    }}
    .panel table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.94rem;
    }}
    .panel td {{
      padding: 7px 6px;
      border-bottom: 1px solid rgba(217, 204, 179, 0.7);
      vertical-align: top;
    }}
    .group {{
      margin-bottom: 26px;
      background: rgba(255, 250, 240, 0.86);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 22px;
      box-shadow: var(--shadow);
    }}
    .group-header {{
      display: flex;
      gap: 18px;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
    }}
    .group-header h2 {{
      margin: 0 0 6px;
    }}
    .group-header p {{
      margin: 0;
      color: var(--muted);
    }}
    .group-badges {{
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      border: 1px solid rgba(145, 108, 47, 0.26);
      padding: 5px 10px;
      background: rgba(145, 108, 47, 0.08);
      font-size: 0.8rem;
      line-height: 1.2;
    }}
    .cat {{
      background: rgba(45, 95, 93, 0.08);
      border-color: rgba(45, 95, 93, 0.24);
    }}
    .artifact-list {{
      display: grid;
      gap: 10px;
    }}
    .artifact-row {{
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      gap: 14px;
      align-items: flex-start;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(217, 204, 179, 0.8);
      background: white;
    }}
    .artifact-row.is-hidden {{
      display: none;
    }}
    .artifact-check {{
      margin-top: 4px;
      inline-size: 18px;
      block-size: 18px;
      accent-color: var(--ok);
    }}
    .index {{
      color: var(--muted);
      font-size: 0.85rem;
      min-width: 34px;
      padding-top: 2px;
    }}
    .artifact-main {{
      display: grid;
      gap: 8px;
    }}
    .artifact-path {{
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.92rem;
      word-break: break-word;
    }}
    .artifact-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .artifact-desc,
    .artifact-evidence {{
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.45;
    }}
    .artifact-actions a {{
      white-space: nowrap;
      text-decoration: none;
      font-weight: 700;
    }}
    .progress {{
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 16px;
      color: white;
      font-weight: 600;
    }}
    .alert-list {{
      margin: 0;
      padding-left: 18px;
      color: var(--danger);
    }}
    @media (max-width: 1280px) {{
      .layout {{ grid-template-columns: 1fr; }}
      .sidebar {{ position: relative; height: auto; }}
      .toolbar, .panels {{ grid-template-columns: 1fr; }}
    }}
    @media (max-width: 900px) {{
      .main {{ padding: 18px; }}
      .artifact-row {{ grid-template-columns: auto 1fr; }}
      .index, .artifact-actions {{ grid-column: 2; }}
    }}
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <h1>Checklist Mestre</h1>
        <p>Checklist completo para auditoria dos 3292 artefatos de governanca, auditoria, rastreabilidade, fases e readiness.</p>
      </div>
      <div>
        <strong>Arquivos base</strong>
        <p><a href="{escape(corpus_html)}" target="_blank" rel="noreferrer">{escape(corpus_html)}</a></p>
        <p><a href="{escape(output_md.name)}" target="_blank" rel="noreferrer">{escape(output_md.name)}</a></p>
        <p><a href="{escape(prompt_path.name)}" target="_blank" rel="noreferrer">{escape(prompt_path.name)}</a></p>
      </div>
      <nav class="nav">{''.join(group_nav)}</nav>
    </aside>
    <main class="main">
      <section class="hero">
        <h1>Checklist unificado para auditoria forense</h1>
        <p>Este arquivo foi gerado em {escape(generated_at)} a partir do inventario consolidado {escape(inventory_path.name)}. Cada checkbox representa um artefato auditavel. O estado dos checkboxes e salvo localmente no navegador para permitir execucao longa por um auditor humano ou por um agente como o Jules.</p>
        <div class="progress">
          <span>Total: <strong id="total-count">{total_items}</strong></span>
          <span>Marcados: <strong id="checked-count">0</strong></span>
          <span>Pendentes: <strong id="pending-count">{total_items}</strong></span>
        </div>
      </section>
      <section class="stats">
        <article class="stat"><strong>{summary['total_files_found']}</strong><span>Artefatos no inventario</span></article>
        <article class="stat"><strong>{summary['derived_files_analysis']}</strong><span>Derivados em files_analysis</span></article>
        <article class="stat"><strong>{summary['duplicate_files']}</strong><span>Itens marcados como duplicados</span></article>
        <article class="stat"><strong>{summary['inconsistent_files']}</strong><span>Itens inconsistentes</span></article>
        <article class="stat"><strong>{summary['version_conflict_groups']}</strong><span>Grupos com conflito de versao</span></article>
      </section>
      <section class="toolbar">
        <input id="search" type="search" placeholder="Filtrar por caminho, descricao, evidencia, categoria ou fase">
        <select id="filter-origin">
          <option value="">Origem: todas</option>
          <option value="primario">Primario</option>
          <option value="derivado (files_analysis)">Derivado (files_analysis)</option>
        </select>
        <select id="filter-status">
          <option value="">Status: todos</option>
          <option value="existe">Existe</option>
          <option value="duplicado">Duplicado</option>
          <option value="inconsistente">Inconsistente</option>
        </select>
        <select id="filter-phase">
          <option value="">Fase: todas</option>
          <option value="f0">F0</option><option value="f1">F1</option><option value="f2">F2</option>
          <option value="f3">F3</option><option value="f4">F4</option><option value="f5">F5</option>
          <option value="f6">F6</option><option value="f7">F7</option><option value="f8">F8</option>
          <option value="f9">F9</option><option value="f10">F10</option><option value="f11">F11</option>
        </select>
        <select id="filter-cycle">
          <option value="">Ciclo: todos</option>
          <option value="cycle-01">Cycle-01</option><option value="cycle-02">Cycle-02</option>
          <option value="cycle-03">Cycle-03</option><option value="cycle-04">Cycle-04</option>
          <option value="cycle-05">Cycle-05</option><option value="cycle-06">Cycle-06</option>
          <option value="cycle-07">Cycle-07</option><option value="cycle-08">Cycle-08</option>
          <option value="cycle-09">Cycle-09</option><option value="cycle-10">Cycle-10</option>
          <option value="cycle-11">Cycle-11</option><option value="cycle-12">Cycle-12</option>
        </select>
      </section>
      <section class="panels">
        <article class="panel"><h2>Totais por categoria</h2><table><tbody>{category_rows}</tbody></table></article>
        <article class="panel"><h2>Mapa de fases</h2><table><tbody>{phase_rows}</tbody></table></article>
        <article class="panel"><h2>Mapa de ciclos</h2><table><tbody>{cycle_rows}</tbody></table></article>
      </section>
      <section class="panel">
        <h2>Alertas criticos do inventario base</h2>
        <ul class="alert-list">{critical_alerts}</ul>
      </section>
      {''.join(group_sections)}
    </main>
  </div>
  <script>
    const STORAGE_KEY = "governance-audit-checklist-state-2026-03-29";
    const rows = Array.from(document.querySelectorAll(".artifact-row"));
    const checks = Array.from(document.querySelectorAll(".artifact-check"));
    const search = document.getElementById("search");
    const filterOrigin = document.getElementById("filter-origin");
    const filterStatus = document.getElementById("filter-status");
    const filterPhase = document.getElementById("filter-phase");
    const filterCycle = document.getElementById("filter-cycle");
    const checkedCount = document.getElementById("checked-count");
    const pendingCount = document.getElementById("pending-count");
    const totalCount = document.getElementById("total-count");
    function loadState() {{
      try {{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{{}}"); }}
      catch (_error) {{ return {{}}; }}
    }}
    function saveState(state) {{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }}
    function updateProgress() {{
      const checked = checks.filter((input) => input.checked).length;
      checkedCount.textContent = String(checked);
      pendingCount.textContent = String(checks.length - checked);
      totalCount.textContent = String(checks.length);
    }}
    function applyFilters() {{
      const term = search.value.trim().toLowerCase();
      const origin = filterOrigin.value;
      const status = filterStatus.value;
      const phase = filterPhase.value;
      const cycle = filterCycle.value;
      rows.forEach((row) => {{
        const haystack = row.textContent.toLowerCase();
        const matchesTerm = !term || haystack.includes(term);
        const matchesOrigin = !origin || row.dataset.origin === origin;
        const matchesStatus = !status || row.dataset.status === status;
        const matchesPhase = !phase || row.dataset.phase === phase;
        const matchesCycle = !cycle || row.dataset.cycle === cycle;
        row.classList.toggle("is-hidden", !(matchesTerm && matchesOrigin && matchesStatus && matchesPhase && matchesCycle));
      }});
    }}
    const state = loadState();
    checks.forEach((input) => {{
      const key = input.dataset.key;
      if (state[key]) {{ input.checked = true; }}
      input.addEventListener("change", () => {{
        state[key] = input.checked;
        if (!input.checked) delete state[key];
        saveState(state);
        updateProgress();
      }});
    }});
    [search, filterOrigin, filterStatus, filterPhase, filterCycle].forEach((node) => {{
      node.addEventListener("input", applyFilters);
      node.addEventListener("change", applyFilters);
    }});
    updateProgress();
    applyFilters();
  </script>
</body>
</html>
"""


def render_jules_prompt(
    report: dict,
    inventory_path: Path,
    checklist_md: Path,
    checklist_html: Path,
    corpus_html: Path,
) -> str:
    summary = report["summary"]
    category_lines = "\n".join(
        f"- {category}: {count}" for category, count in inventory_counts(summary)
    )
    alert_lines = "\n".join(f"- {alert}" for alert in report.get("critical_alerts", []))
    external_lines = "\n".join(
        f"{index}. `{path}` - {label}"
        for index, (path, label) in enumerate(EXTERNAL_PROMPT_FILES, start=1)
    )
    generated_at = report.get("generated_at", datetime.now().isoformat())

    return f"""# Prompt Mestre para Jules: Auditoria Completa de 3292 Artefatos

## Contexto

Voce deve executar uma auditoria forense completa, robusta e sem omissoes sobre os artefatos de governanca, auditoria, rastreabilidade, ciclos/fases, readiness, arquitetura e derivados analiticos existentes neste repositorio.

Esta auditoria deve ser executada com base no corpus consolidado gerado em `{generated_at}`.

## Arquivos obrigatorios de entrada

1. Corpus HTML completo com o conteudo integral dos artefatos:
   `C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\{corpus_html.name}`
2. Checklist mestre em HTML:
   `C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\{checklist_html.name}`
3. Checklist mestre em Markdown:
   `C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\{checklist_md.name}`
4. Inventario JSON estruturado:
   `C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\{inventory_path.name}`

## Pacote externo obrigatorio de confronto

Os arquivos abaixo tambem fazem parte da auditoria e devem ser lidos e confrontados com o estado real do repositorio e com o corpus principal de 3292 artefatos:

{external_lines}

## Volume auditavel

- Total de artefatos: {summary['total_files_found']}
- Derivados em `audit/files_analysis`: {summary['derived_files_analysis']}
- Itens marcados como duplicados: {summary['duplicate_files']}
- Itens inconsistentes: {summary['inconsistent_files']}
- Grupos de duplicidade exata: {summary['exact_duplicate_groups']}
- Grupos de conflito de versao: {summary['version_conflict_groups']}
- Espelhos orfaos: {summary['orphan_mirror_files']}
- Referencias `sourcePath` ausentes: {summary['missing_source_references']}

## Distribuicao por categoria

{category_lines}

## Alertas criticos ja conhecidos

{alert_lines}

## Objetivo

Validar a integridade, consistencia, cobertura e utilidade operacional dos 3292 artefatos. O foco nao e o codigo funcional da plataforma. O foco e o sistema de controle, execucao, readiness e auditoria da engenharia.

## Regras obrigatorias

1. Zero omissao. Nenhum item do checklist pode ficar sem verificacao.
2. Zero invencao. Se nao houver evidencia direta no corpus ou no arquivo real, registrar como `NAO COMPROVADO`.
3. Tratar o checklist HTML e o inventario JSON como lista canonica de escopo.
4. Tratar o corpus HTML como fonte principal de leitura rapida. Se houver ambiguidade, validar no arquivo real do repositorio.
5. Respeitar a organizacao por fases, ciclos e grupos transversais.
6. Diferenciar claramente: artefato primario, artefato derivado, duplicado, inconsistente e espelho orfao.
7. Todo achado deve conter evidencia objetiva: caminho, trecho, metadado ou contradicao verificavel.
8. Se um artefato for apenas documental e nao tiver lastro operacional, registrar isso explicitamente.
9. Confrontar obrigatoriamente o pacote externo de evidencias com o inventario principal e registrar qualquer divergencia de escopo, contagem, status, aprovacao, freeze, baseline ou claim de implementacao.
10. Se um documento externo afirmar que algo esta `APROVADO`, `CONCLUIDO` ou `PRONTO`, validar no repositorio e registrar como inconsistencia critica caso nao exista lastro tecnico correspondente.

## Metodo de execucao

1. Abrir o checklist HTML e usar os grupos por fase/ciclo como ordem de varredura.
2. Para cada artefato, verificar no minimo:
   - existencia real
   - coerencia do nome e do caminho
   - categoria e tipo tecnico
   - aderencia ao objetivo de governanca/auditoria
   - evidencia util ou evidencia fraca
   - duplicidade ou conflito de versao
   - relacao com readiness, traceabilidade, arquitetura ou lifecycle
   - se e acionavel, apenas documental ou espelho derivado
3. Para o pacote externo de confronto, verificar tambem:
   - se os totais e escopos declarados batem com o universo atual de 3292 artefatos
   - se os status `aprovado`, `concluido`, `pronto` ou equivalentes possuem evidencia empirica no repositorio
   - se existem pendencias, observacoes nao declaradas ou gaps citados fora da trilha oficial
   - se baseline, freeze, sign-off e organization audit convergem com os artefatos vivos do repositorio
   - se os documentos HTML externos descrevem o mesmo sistema de governanca ou uma fotografia historica divergente
   - se `COMMERCIALIZATION_REQUIREMENTS.md` depende de gaps ainda abertos ou de controles inexistentes
4. Ao final de cada grupo, consolidar: achados criticos, lacunas, contradicoes, artefatos redundantes e artefatos obsoletos.
5. Ao final da auditoria completa, gerar uma avaliacao executiva do sistema de governanca da engenharia.

## Saidas obrigatorias

Gerar os seguintes arquivos:

1. `C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\jules_full_audit_report_2026-03-29.md`
2. `C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\jules_findings_2026-03-29.json`
3. `C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\jules_remediation_backlog_2026-03-29.md`

## Estrutura minima do relatorio principal

### 1. Resumo executivo
- estado geral da governanca
- principais riscos
- nivel de confianca da auditoria

### 2. Cobertura real da auditoria
- total auditado
- total com evidencia forte
- total com evidencia fraca
- total inconsistente
- total derivado sem primario vivo

### 3. Achados por severidade
- critico
- alto
- medio
- baixo

### 4. Achados por fase/ciclo
- F0 ate F11
- ciclos detectados
- grupos transversais

### 5. Achados estruturais
- duplicidade
- conflitos de versao
- espelhos orfaos
- sourcePath quebrado
- fragmentacao documental
- ausencia de implementacao operacional
- contradicoes entre pacote externo e repositorio vivo

### 6. Mapa de maturidade da governanca
- controles fortes
- controles incompletos
- controles simulados
- controles ausentes

### 7. Backlog de remediacao priorizado
- item
- severidade
- impacto
- acao recomendada
- artefatos afetados

## Formato de cada finding

Para cada finding, use este formato:

- `id`: identificador unico
- `severity`: critico | alto | medio | baixo
- `title`: titulo objetivo
- `artifacts`: lista de caminhos afetados
- `evidence`: trecho objetivo ou contradicao verificavel
- `impact`: risco gerado
- `recommendation`: acao de remediacao
- `phase_cycle_scope`: fase, ciclo ou grupo transversal
- `confidence`: alta | media | baixa

## Criterios de julgamento

- `APROVADO`: artefato consistente, util e aderente ao controle esperado
- `APROVADO COM RESSALVAS`: existe, mas com lacunas, ambiguidade ou baixa operacionalidade
- `REPROVADO`: inconsistente, redundante, quebrado, sem lastro ou enganoso
- `NAO COMPROVADO`: evidencia insuficiente para concluir

## Restricoes

- Nao reduzir a auditoria a um resumo superficial.
- Nao pular grupos menores.
- Nao assumir que arquivos em `files_analysis` substituem o primario.
- Nao tratar duplicidade como aceitavel sem justificativa.
- Nao encerrar a execucao sem cobrir os 3292 itens do checklist.

## Resultado esperado

Uma auditoria utilizavel para tomada de decisao executiva e saneamento do repositorio, com rastreabilidade clara entre achado, evidencia e remediacao.
"""


def main() -> None:
    inventory_path = latest_inventory_json()
    report = read_inventory(inventory_path)

    output_md = AUDIT_DIR / "governance_audit_master_checklist_2026-03-29.md"
    output_html = AUDIT_DIR / "governance_audit_master_checklist_2026-03-29.html"
    prompt_path = AUDIT_DIR / "jules_full_audit_prompt_2026-03-29.md"
    corpus_html = inventory_path.with_suffix(".html")

    output_md.write_text(
        render_markdown(report, inventory_path, output_md, output_html, prompt_path),
        encoding="utf-8",
    )
    output_html.write_text(
        render_html(report, inventory_path, output_md, output_html, prompt_path),
        encoding="utf-8",
    )
    prompt_path.write_text(
        render_jules_prompt(report, inventory_path, output_md, output_html, corpus_html),
        encoding="utf-8",
    )

    print(json.dumps({
        "inventory": str(inventory_path),
        "checklist_md": str(output_md),
        "checklist_html": str(output_html),
        "jules_prompt": str(prompt_path),
        "total_artifacts": report["summary"]["total_files_found"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
