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


def artifact_path(rel_path: str) -> Path:
    return ROOT / Path(rel_path)


def read_artifact_text(path: Path) -> tuple[str, bool]:
    raw = path.read_bytes()
    if b"\x00" in raw:
        preview = raw[:256].hex(" ")
        return f"[binary preview]\nsize={len(raw)} bytes\nhex={preview}", True
    try:
        return raw.decode("utf-8"), False
    except UnicodeDecodeError:
        return raw.decode("utf-8", errors="replace"), False


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


def render_badge(label: str, cls: str) -> str:
    return f'<span class="badge {cls}">{escape(label)}</span>'


def render_entry(entry: dict, full_text: str, is_binary: bool, phase: str | None, cycle: str | None) -> str:
    rel = entry["path"]
    anchor = artifact_anchor(rel)
    lines = full_text.count("\n") + 1 if full_text else 0
    badges = [
        render_badge(entry["category"], "cat"),
        render_badge(entry["technical_type"], "type"),
        render_badge(entry["origin"], "origin"),
        render_badge(entry["status"], "status"),
    ]
    if phase:
        badges.append(render_badge(phase, "phase"))
    if cycle:
        badges.append(render_badge(cycle, "cycle"))
    if is_binary:
        badges.append(render_badge("binary-preview", "binary"))

    meta = [
        ("Caminho", rel),
        ("Nome", entry["name"]),
        ("Categoria", entry["category"]),
        ("Tipo tecnico", entry["technical_type"]),
        ("Origem", entry["origin"]),
        ("Status", entry["status"]),
        ("Fase", phase or "n/a"),
        ("Ciclo", cycle or "n/a"),
        ("Linhas", str(lines)),
        ("Bytes", str(entry.get("size", ""))),
        ("SHA256", entry.get("sha256", "")),
    ]
    if entry.get("related_primary"):
        meta.append(("Primario relacionado", entry["related_primary"]))
    if entry.get("related_source_path"):
        meta.append(("sourcePath declarado", entry["related_source_path"]))

    meta_rows = "\n".join(
        f"<tr><th>{escape(key)}</th><td>{escape(value)}</td></tr>"
        for key, value in meta
    )

    return f"""
<details class="artifact" id="{anchor}" data-path="{escape(rel.lower())}" data-category="{escape(entry['category'].lower())}" data-status="{escape(entry['status'].lower())}" data-origin="{escape(entry['origin'].lower())}" data-phase="{escape((phase or '').lower())}" data-cycle="{escape((cycle or '').lower())}">
  <summary>
    <span class="artifact-path">{escape(rel)}</span>
    <span class="artifact-name">{escape(entry['name'])}</span>
    <span class="badges">{''.join(badges)}</span>
  </summary>
  <div class="artifact-body">
    <p class="desc">{escape(entry['description'])}</p>
    <p class="evidence"><strong>Evidencia:</strong> {escape(entry['evidence'])}</p>
    <table class="meta">
      <tbody>
        {meta_rows}
      </tbody>
    </table>
    <pre class="content"><code>{escape(full_text)}</code></pre>
  </div>
</details>
"""


def main() -> None:
    inventory_path = latest_inventory_json()
    report = read_inventory(inventory_path)
    entries: list[dict] = report["inventory"]
    output_path = inventory_path.with_suffix(".html")

    groups: dict[str, list[dict]] = defaultdict(list)
    phase_counts: Counter[str] = Counter()
    cycle_counts: Counter[str] = Counter()
    total_bytes = 0

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
        total_bytes += int(entry.get("size", 0))

    ordered_groups = sorted(groups.items(), key=lambda item: (item[1][0]["_group_order"], item[0]))
    group_nav = []
    group_sections = []

    for group_name, items in ordered_groups:
        group_id = artifact_anchor(group_name)
        group_nav.append(
            f'<a href="#{group_id}" class="group-link">{escape(group_name)} <span>{len(items)}</span></a>'
        )
        rendered_entries = []
        items_sorted = sorted(
            items,
            key=lambda item: (
                item.get("_phase") or "ZZ",
                item.get("_cycle") or "ZZ",
                item["category"],
                item["path"],
            ),
        )
        category_counts = Counter(item["category"] for item in items_sorted)
        category_badges = "".join(
            render_badge(f"{category} ({count})", "groupcat")
            for category, count in sorted(category_counts.items())
        )
        for entry in items_sorted:
            path = artifact_path(entry["path"])
            if path.exists():
                full_text, is_binary = read_artifact_text(path)
            else:
                full_text = "[ARQUIVO AUSENTE NA ARVORE ATUAL]\nConteudo nao pode ser materializado nesta execucao."
                is_binary = False
            rendered_entries.append(
                render_entry(entry, full_text, is_binary, entry.get("_phase"), entry.get("_cycle"))
            )
        group_sections.append(
            f"""
<section class="group" id="{group_id}">
  <div class="group-header">
    <h2>{escape(group_name)}</h2>
    <div class="group-meta">
      <span>{len(items_sorted)} arquivos</span>
      <span>{category_badges}</span>
    </div>
  </div>
  {''.join(rendered_entries)}
</section>
"""
        )

    phase_table_rows = "\n".join(
        f"<tr><td>{escape(phase)}</td><td>{count}</td></tr>"
        for phase, count in sorted(phase_counts.items(), key=lambda item: int(item[0][1:]))
    ) or '<tr><td colspan="2">Sem fases explicitas detectadas.</td></tr>'

    cycle_table_rows = "\n".join(
        f"<tr><td>{escape(cycle)}</td><td>{count}</td></tr>"
        for cycle, count in sorted(cycle_counts.items(), key=lambda item: int(item[0].split('-')[1]))
    ) or '<tr><td colspan="2">Sem ciclos explicitos detectados.</td></tr>'

    summary = report["summary"]
    total_mb = total_bytes / (1024 * 1024) if total_bytes else 0.0
    generated_at = report.get("generated_at", datetime.now().isoformat())
    critical_alerts = "".join(
        f"<li>{escape(alert)}</li>" for alert in report.get("critical_alerts", [])
    ) or "<li>Nenhum alerta crítico registrado.</li>"

    html = f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Corpus HTML de Governanca e Auditoria</title>
  <style>
    :root {{
      --bg: #f3efe6;
      --panel: #fffdf8;
      --ink: #1f1a17;
      --muted: #6c5f57;
      --line: #d7cbbd;
      --accent: #7f2f1d;
      --accent-2: #2f5d50;
      --accent-3: #8e6a14;
      --shadow: 0 12px 30px rgba(61, 37, 23, 0.08);
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Georgia, "Times New Roman", serif; background: linear-gradient(180deg, #efe6d6 0%, #f7f3eb 30%, #ece4d7 100%); color: var(--ink); }}
    a {{ color: var(--accent); }}
    .shell {{ max-width: 1680px; margin: 0 auto; padding: 24px; }}
    .hero {{ background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 24px; box-shadow: var(--shadow); }}
    .hero h1 {{ margin: 0 0 8px; font-size: 2rem; }}
    .hero p {{ margin: 0; color: var(--muted); line-height: 1.5; }}
    .toolbar {{ margin-top: 18px; display: grid; grid-template-columns: 1.2fr .8fr .8fr .8fr; gap: 12px; }}
    .toolbar input, .toolbar select {{ width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; font: inherit; background: #fff; }}
    .kpis {{ margin-top: 20px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }}
    .kpi {{ background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 14px; box-shadow: var(--shadow); }}
    .kpi .label {{ font-size: .85rem; color: var(--muted); }}
    .kpi .value {{ margin-top: 6px; font-size: 1.7rem; font-weight: 700; }}
    .layout {{ display: grid; grid-template-columns: 320px 1fr; gap: 18px; margin-top: 18px; align-items: start; }}
    .side, .content-wrap {{ display: grid; gap: 18px; }}
    .panel {{ background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 18px; box-shadow: var(--shadow); }}
    .panel h2, .panel h3 {{ margin-top: 0; }}
    .group-link {{ display: flex; justify-content: space-between; align-items: center; gap: 12px; text-decoration: none; padding: 8px 10px; border-radius: 10px; color: var(--ink); }}
    .group-link:hover {{ background: #f3ebdf; }}
    .group-link span:last-child {{ color: var(--muted); }}
    .summary-table {{ width: 100%; border-collapse: collapse; }}
    .summary-table td, .summary-table th {{ border-bottom: 1px solid var(--line); padding: 8px 6px; text-align: left; font-size: .95rem; }}
    .group {{ background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 18px; box-shadow: var(--shadow); }}
    .group-header {{ position: sticky; top: 10px; background: rgba(255, 253, 248, 0.96); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); margin: -18px -18px 16px; padding: 16px 18px; border-radius: 18px 18px 0 0; z-index: 3; }}
    .group-header h2 {{ margin: 0 0 8px; }}
    .group-meta {{ display: flex; flex-wrap: wrap; gap: 8px; color: var(--muted); font-size: .92rem; }}
    details.artifact {{ border: 1px solid var(--line); border-radius: 14px; margin: 0 0 12px; background: #fff; overflow: hidden; }}
    details.artifact summary {{ cursor: pointer; list-style: none; padding: 14px 16px; display: grid; gap: 8px; }}
    details.artifact summary::-webkit-details-marker {{ display: none; }}
    .artifact summary:hover {{ background: #faf3e7; }}
    .artifact-path {{ font-family: "Consolas", "Courier New", monospace; font-size: .95rem; word-break: break-all; }}
    .artifact-name {{ color: var(--muted); }}
    .artifact-body {{ border-top: 1px solid var(--line); padding: 14px 16px 16px; }}
    .badges {{ display: flex; flex-wrap: wrap; gap: 6px; }}
    .badge {{ display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 10px; font-size: .78rem; border: 1px solid transparent; background: #f0e6d8; }}
    .badge.cat {{ background: #f8ead7; border-color: #e2c9a0; }}
    .badge.type {{ background: #e8f2ee; border-color: #9fbbaf; }}
    .badge.origin {{ background: #ece7f6; border-color: #b8abd8; }}
    .badge.status {{ background: #f8e0df; border-color: #d1a0a0; }}
    .badge.phase {{ background: #f9efc9; border-color: #d5bb58; }}
    .badge.cycle {{ background: #dfeee8; border-color: #83ae9c; }}
    .badge.binary {{ background: #ececec; border-color: #bcbcbc; }}
    .badge.groupcat {{ background: #f4efe9; border-color: #d6c8b7; }}
    .desc, .evidence {{ line-height: 1.5; }}
    .meta {{ width: 100%; border-collapse: collapse; margin: 12px 0; }}
    .meta th, .meta td {{ border-bottom: 1px solid var(--line); padding: 7px 8px; text-align: left; vertical-align: top; font-size: .92rem; }}
    .meta th {{ width: 220px; color: var(--muted); }}
    .content {{ margin: 0; max-height: 820px; overflow: auto; border: 1px solid var(--line); border-radius: 12px; background: #17130f; color: #f9f4ef; padding: 14px; line-height: 1.45; font-size: .88rem; }}
    .alerts li {{ margin-bottom: 8px; }}
    .footer {{ margin-top: 18px; color: var(--muted); font-size: .92rem; }}
    .hidden {{ display: none !important; }}
    @media (max-width: 1200px) {{
      .layout {{ grid-template-columns: 1fr; }}
      .kpis {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      .toolbar {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <h1>Corpus HTML de Governanca, Auditoria, Fases e Ciclos</h1>
      <p>Gerado em {escape(generated_at)} a partir de <code>{escape(inventory_path.name)}</code>. Este bundle contém o conteúdo integral dos artefatos relevantes do repositório, com classificação forense, navegação por fases/ciclos e suporte a auditoria completa.</p>
      <div class="toolbar">
        <input id="search" type="search" placeholder="Filtrar por caminho, conteúdo, categoria, fase, ciclo...">
        <select id="statusFilter">
          <option value="">Todos os status</option>
          <option>Existe</option>
          <option>Duplicado</option>
          <option>Inconsistente</option>
        </select>
        <select id="originFilter">
          <option value="">Todas as origens</option>
          <option>Primario</option>
          <option>Derivado (files_analysis)</option>
        </select>
        <select id="groupFilter">
          <option value="">Todos os grupos</option>
          {''.join(f'<option>{escape(name)}</option>' for name, _ in ordered_groups)}
        </select>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="label">Arquivos relevantes</div><div class="value">{summary['total_files_found']}</div></div>
        <div class="kpi"><div class="label">Derivados files_analysis</div><div class="value">{summary['derived_files_analysis']}</div></div>
        <div class="kpi"><div class="label">Duplicados</div><div class="value">{summary['duplicate_files']}</div></div>
        <div class="kpi"><div class="label">Inconsistentes</div><div class="value">{summary['inconsistent_files']}</div></div>
        <div class="kpi"><div class="label">Volume bruto</div><div class="value">{total_mb:.1f} MB</div></div>
      </div>
    </section>

    <div class="layout">
      <aside class="side">
        <section class="panel">
          <h2>Navegacao por grupo</h2>
          {''.join(group_nav)}
        </section>
        <section class="panel">
          <h3>Cobertura por fase</h3>
          <table class="summary-table">
            <thead><tr><th>Fase</th><th>Arquivos</th></tr></thead>
            <tbody>{phase_table_rows}</tbody>
          </table>
        </section>
        <section class="panel">
          <h3>Cobertura por ciclo</h3>
          <table class="summary-table">
            <thead><tr><th>Ciclo</th><th>Arquivos</th></tr></thead>
            <tbody>{cycle_table_rows}</tbody>
          </table>
        </section>
        <section class="panel">
          <h3>Alertas criticos</h3>
          <ul class="alerts">{critical_alerts}</ul>
        </section>
      </aside>

      <main class="content-wrap">
        {''.join(group_sections)}
      </main>
    </div>

    <div class="footer">
      <p>Arquivo gerado automaticamente para auditoria forense. Os conteúdos foram escapados e preservados em blocos <code>&lt;pre&gt;</code> para inspeção linha a linha.</p>
    </div>
  </div>

  <script>
    const search = document.getElementById('search');
    const statusFilter = document.getElementById('statusFilter');
    const originFilter = document.getElementById('originFilter');
    const groupFilter = document.getElementById('groupFilter');
    const groups = Array.from(document.querySelectorAll('.group'));

    function applyFilters() {{
      const term = (search.value || '').toLowerCase();
      const wantedStatus = (statusFilter.value || '').toLowerCase();
      const wantedOrigin = (originFilter.value || '').toLowerCase();
      const wantedGroup = groupFilter.value || '';

      groups.forEach(group => {{
        const groupMatches = !wantedGroup || group.querySelector('h2').textContent === wantedGroup;
        let visible = 0;
        group.querySelectorAll('.artifact').forEach(artifact => {{
          const haystack = artifact.textContent.toLowerCase();
          const path = artifact.dataset.path || '';
          const status = artifact.dataset.status || '';
          const origin = artifact.dataset.origin || '';
          const matches =
            (!term || haystack.includes(term) || path.includes(term)) &&
            (!wantedStatus || status.includes(wantedStatus)) &&
            (!wantedOrigin || origin.includes(wantedOrigin)) &&
            groupMatches;
          artifact.classList.toggle('hidden', !matches);
          if (matches) visible += 1;
        }});
        group.classList.toggle('hidden', visible === 0 || !groupMatches);
      }});
    }}

    [search, statusFilter, originFilter, groupFilter].forEach(el => el.addEventListener('input', applyFilters));
    applyFilters();
  </script>
</body>
</html>
"""

    output_path.write_text(html, encoding="utf-8")
    print(json.dumps({"html": str(output_path), "source_json": str(inventory_path), "groups": len(groups), "artifacts": len(entries)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
