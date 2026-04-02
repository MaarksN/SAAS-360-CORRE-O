from __future__ import annotations

import json
import re
import subprocess
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


def ordered_groups(entries: list[dict]) -> tuple[list[tuple[str, list[dict]]], Counter[str], Counter[str]]:
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

    ordered = sorted(groups.items(), key=lambda item: (item[1][0]["_group_order"], item[0]))
    return ordered, phase_counts, cycle_counts


def browser_path() -> Path:
    candidates = [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Nenhum browser headless compatível encontrado para renderização PDF.")


def render_html(report: dict, inventory_path: Path) -> str:
    entries: list[dict] = report["inventory"]
    summary = report["summary"]
    corpus_html = inventory_path.with_suffix(".html").name
    ordered, phase_counts, cycle_counts = ordered_groups(entries)
    generated_at = report.get("generated_at", datetime.now().isoformat())

    category_rows = "".join(
        f"<tr><td>{escape(category)}</td><td>{count}</td></tr>"
        for category, count in sorted(summary["total_by_category"].items(), key=lambda item: item[0])
    )
    phase_rows = "".join(
        f"<tr><td>{escape(phase)}</td><td>{count}</td></tr>"
        for phase, count in sorted(phase_counts.items(), key=lambda item: int(item[0][1:]))
    ) or "<tr><td colspan='2'>Sem fases explicitas.</td></tr>"
    cycle_rows = "".join(
        f"<tr><td>{escape(cycle)}</td><td>{count}</td></tr>"
        for cycle, count in sorted(cycle_counts.items(), key=lambda item: int(item[0].split('-')[1]))
    ) or "<tr><td colspan='2'>Sem ciclos explicitos.</td></tr>"
    alerts = "".join(f"<li>{escape(alert)}</li>" for alert in report.get("critical_alerts", []))
    external_rows = "".join(
        f"<tr><td>{index}</td><td><code>{escape(path)}</code></td><td>{escape(label)}</td></tr>"
        for index, (path, label) in enumerate(EXTERNAL_PROMPT_FILES, start=1)
    )

    sections: list[str] = []
    item_number = 0
    for group_name, items in ordered:
        items_sorted = sorted(
            items,
            key=lambda item: (
                item.get("_phase") or "ZZ",
                item.get("_cycle") or "ZZ",
                item["category"],
                item["path"],
            ),
        )
        rows: list[str] = []
        for entry in items_sorted:
            item_number += 1
            extras = []
            if entry.get("_phase"):
                extras.append(f"fase={entry['_phase']}")
            if entry.get("_cycle"):
                extras.append(f"ciclo={entry['_cycle']}")
            if entry.get("related_primary"):
                extras.append(f"primario_rel={entry['related_primary']}")
            if entry.get("related_source_path"):
                extras.append(f"sourcePath={entry['related_source_path']}")
            extra_text = " | ".join(extras) if extras else "sem referencia adicional"
            rows.append(
                "<tr>"
                f"<td>{item_number}</td>"
                f"<td><code>{escape(entry['path'])}</code></td>"
                f"<td>{escape(entry['category'])}</td>"
                f"<td>{escape(entry['technical_type'])}</td>"
                f"<td>{escape(entry['origin'])}</td>"
                f"<td>{escape(entry['status'])}</td>"
                f"<td>{escape(extra_text)}</td>"
                f"<td>{escape(entry['evidence'])}</td>"
                f"<td>{escape(entry['description'])}</td>"
                "</tr>"
            )
        sections.append(
            f"""
<section class="group">
  <h2>{escape(group_name)}</h2>
  <p class="group-summary">Total nesta secao: {len(items_sorted)}</p>
  <table class="artifact-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Caminho</th>
        <th>Categoria</th>
        <th>Tipo tecnico</th>
        <th>Origem</th>
        <th>Status</th>
        <th>Referencia</th>
        <th>Evidencia</th>
        <th>Descricao</th>
      </tr>
    </thead>
    <tbody>
      {''.join(rows)}
    </tbody>
  </table>
</section>
"""
        )

    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Prompt Mestre Jules - Auditoria 3292 Artefatos</title>
  <style>
    @page {{
      size: A4 landscape;
      margin: 12mm;
    }}
    body {{
      font-family: "Segoe UI", Arial, sans-serif;
      color: #1e1f1c;
      font-size: 10px;
      line-height: 1.35;
      margin: 0;
    }}
    h1, h2, h3 {{ margin: 0 0 8px; }}
    h1 {{ font-size: 22px; }}
    h2 {{ font-size: 16px; margin-top: 18px; }}
    h3 {{ font-size: 13px; margin-top: 14px; }}
    p, li {{ margin: 0 0 6px; }}
    .cover {{
      padding: 14px 16px 10px;
      border: 2px solid #916c2f;
      background: #f8f3e7;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 14px 0;
    }}
    .stat {{
      border: 1px solid #d9ccb3;
      padding: 10px;
      background: #fffaf0;
    }}
    .section {{
      margin-top: 16px;
      page-break-inside: avoid;
    }}
    .two-col {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }}
    th, td {{
      border: 1px solid #cdbd9f;
      padding: 5px 6px;
      vertical-align: top;
      word-break: break-word;
    }}
    th {{
      background: #efe4cf;
      text-align: left;
    }}
    .artifact-table {{
      font-size: 8.2px;
    }}
    .artifact-table th:nth-child(1), .artifact-table td:nth-child(1) {{ width: 30px; }}
    .artifact-table th:nth-child(2), .artifact-table td:nth-child(2) {{ width: 22%; }}
    .artifact-table th:nth-child(3), .artifact-table td:nth-child(3) {{ width: 12%; }}
    .artifact-table th:nth-child(4), .artifact-table td:nth-child(4) {{ width: 11%; }}
    .artifact-table th:nth-child(5), .artifact-table td:nth-child(5) {{ width: 8%; }}
    .artifact-table th:nth-child(6), .artifact-table td:nth-child(6) {{ width: 8%; }}
    .artifact-table th:nth-child(7), .artifact-table td:nth-child(7) {{ width: 14%; }}
    .artifact-table th:nth-child(8), .artifact-table td:nth-child(8) {{ width: 12%; }}
    .artifact-table th:nth-child(9), .artifact-table td:nth-child(9) {{ width: 13%; }}
    code {{ font-family: Consolas, "Courier New", monospace; font-size: 8.1px; }}
    ul, ol {{ padding-left: 18px; margin: 6px 0; }}
    .group {{ margin-top: 14px; page-break-inside: avoid; }}
    .group-summary {{ color: #6e6658; }}
    .muted {{ color: #6e6658; }}
    .page-break {{ page-break-before: always; }}
  </style>
</head>
<body>
  <section class="cover">
    <h1>Prompt Mestre para Jules: Auditoria Completa de 3292 Artefatos</h1>
    <p>Documento autossuficiente. O Jules nao precisa abrir um checklist separado para saber o que verificar. Este PDF contem o protocolo de auditoria, os criterios de julgamento e a lista integral dos 3292 artefatos auditaveis.</p>
    <p class="muted">Gerado em {escape(generated_at)}. Corpus de leitura integral dos artefatos: <code>{escape(str((AUDIT_DIR / corpus_html).resolve()))}</code></p>
  </section>

  <section class="grid">
    <div class="stat"><strong>Total</strong><br>{summary['total_files_found']} artefatos</div>
    <div class="stat"><strong>Derivados</strong><br>{summary['derived_files_analysis']} em files_analysis</div>
    <div class="stat"><strong>Duplicados</strong><br>{summary['duplicate_files']} itens marcados</div>
    <div class="stat"><strong>Inconsistentes</strong><br>{summary['inconsistent_files']} itens</div>
    <div class="stat"><strong>Conflitos</strong><br>{summary['version_conflict_groups']} grupos de versao</div>
    <div class="stat"><strong>Espelhos orfaos</strong><br>{summary['orphan_mirror_files']} itens</div>
    <div class="stat"><strong>sourcePath ausente</strong><br>{summary['missing_source_references']} casos</div>
    <div class="stat"><strong>Corpus base</strong><br><code>{escape(corpus_html)}</code></div>
  </section>

  <section class="section">
    <h2>Objetivo</h2>
    <p>Validar integridade, consistencia, cobertura e utilidade operacional dos artefatos de governanca, auditoria, rastreabilidade, ciclos/fases, readiness, arquitetura alvo, maturidade e derivados analiticos do repositorio. O foco nao e o codigo funcional da plataforma.</p>
  </section>

  <section class="section two-col">
    <div>
      <h2>Regras obrigatorias</h2>
      <ol>
        <li>Zero omissao. Nenhum item deste PDF pode ficar sem verificacao.</li>
        <li>Zero invencao. Se nao houver evidencia direta, registrar como <code>NAO COMPROVADO</code>.</li>
        <li>Usar o inventario JSON como escopo canonico e este PDF como roteiro operacional.</li>
        <li>Usar o corpus HTML completo para leitura do conteudo integral dos artefatos.</li>
        <li>Diferenciar artefato primario, derivado, duplicado, inconsistente e espelho orfao.</li>
        <li>Todo achado precisa de evidencia objetiva: caminho, trecho, metadado ou contradicao verificavel.</li>
        <li>Se um artefato for apenas documental, sem lastro operacional, registrar isso explicitamente.</li>
        <li>Ler e confrontar obrigatoriamente o pacote externo de evidencias listado neste PDF.</li>
        <li>Qualquer claim externo de <code>APROVADO</code>, <code>CONCLUIDO</code> ou <code>PRONTO</code> deve ser validado no repositorio vivo.</li>
      </ol>
    </div>
    <div>
      <h2>Criterios de julgamento</h2>
      <ul>
        <li><code>APROVADO</code>: consistente, util e aderente ao controle esperado.</li>
        <li><code>APROVADO COM RESSALVAS</code>: existe, mas com lacunas, ambiguidade ou baixa operacionalidade.</li>
        <li><code>REPROVADO</code>: inconsistente, redundante, quebrado, sem lastro ou enganoso.</li>
        <li><code>NAO COMPROVADO</code>: evidencia insuficiente para concluir.</li>
      </ul>
      <h3>Formato de cada finding</h3>
      <ul>
        <li><code>id</code>, <code>severity</code>, <code>title</code>, <code>artifacts</code>, <code>evidence</code>, <code>impact</code>, <code>recommendation</code>, <code>phase_cycle_scope</code>, <code>confidence</code>.</li>
      </ul>
    </div>
  </section>

  <section class="section">
    <h2>Matriz obrigatoria de verificacao por artefato</h2>
    <ol>
      <li>Existencia real do arquivo e compatibilidade com o caminho registrado.</li>
      <li>Coerencia entre nome, categoria, tipo tecnico, origem e status.</li>
      <li>Qualidade da evidencia registrada: forte, fraca, contraditoria ou inexistente.</li>
      <li>Utilidade operacional: controle executavel, registro confiavel, documento normativo ou apenas espelho analitico.</li>
      <li>Rastreabilidade: existencia de relacao com fase, ciclo, readiness, release, arquitetura, BI, prompt, gap ou inventario.</li>
      <li>Duplicidade: duplicado exato, versao conflitante, derivacao controlada ou redundancia sem dono.</li>
      <li>Integridade de sourcePath e de primario relacionado, quando houver.</li>
      <li>Obsolescencia: arquivo vivo, historico, legado, orfao ou inconsistente.</li>
      <li>Risco de governanca: alto, medio ou baixo impacto caso o artefato esteja incorreto.</li>
    </ol>
  </section>

  <section class="section">
    <h2>Pacote externo obrigatorio de confronto</h2>
    <p>Os arquivos abaixo tambem devem ser lidos pelo Jules. Eles nao substituem o corpus principal, mas devem ser confrontados com o repositorio vivo e com os 3292 artefatos mapeados para detectar divergencias historicas, claims sem lastro, aprovacoes indevidas e escopos conflitantes.</p>
    <table>
      <thead>
        <tr><th>#</th><th>Caminho absoluto</th><th>Papel no confronto</th></tr>
      </thead>
      <tbody>{external_rows}</tbody>
    </table>
  </section>

  <section class="section">
    <h2>Verificacoes obrigatorias sobre o pacote externo</h2>
    <ol>
      <li>Comparar escopo e contagens declaradas nesses documentos com o universo atual de 3292 artefatos.</li>
      <li>Validar se aprovacoes, conclusoes, freezes, baselines, sign-offs e pareceres finais possuem lastro tecnico no repositorio.</li>
      <li>Mapear pendencias, observacoes nao declaradas e gaps citados fora da trilha oficial do inventario.</li>
      <li>Identificar contradicoes entre relatorios externos e o estado vivo dos arquivos do repositorio.</li>
      <li>Distinguir documento historico valido de documento obsoleto, enganoso ou inconsistente.</li>
      <li>Registrar como finding critico qualquer documento externo que apresente conclusao positiva sem evidencia operacional correspondente.</li>
      <li>Verificar se os requisitos de comercializacao dependem de controles ainda ausentes, gaps nao resolvidos ou readiness nao comprovado.</li>
    </ol>
  </section>

  <section class="section two-col">
    <div>
      <h2>Totais por categoria</h2>
      <table><tbody>{category_rows}</tbody></table>
    </div>
    <div>
      <h2>Alertas criticos conhecidos</h2>
      <ul>{alerts}</ul>
    </div>
  </section>

  <section class="section two-col">
    <div>
      <h2>Mapa de fases</h2>
      <table><tbody>{phase_rows}</tbody></table>
    </div>
    <div>
      <h2>Mapa de ciclos</h2>
      <table><tbody>{cycle_rows}</tbody></table>
    </div>
  </section>

  <section class="section">
    <h2>Saidas obrigatorias da auditoria do Jules</h2>
    <ol>
      <li><code>{escape(str((AUDIT_DIR / 'jules_full_audit_report_2026-03-29.md').resolve()))}</code></li>
      <li><code>{escape(str((AUDIT_DIR / 'jules_findings_2026-03-29.json').resolve()))}</code></li>
      <li><code>{escape(str((AUDIT_DIR / 'jules_remediation_backlog_2026-03-29.md').resolve()))}</code></li>
    </ol>
  </section>

  <section class="section page-break">
    <h2>Checklist integral embutido neste PDF</h2>
    <p>Os itens abaixo sao o universo completo de verificacao. O Jules nao precisa abrir um checklist externo para saber o que auditar. Para ler o conteudo integral de cada artefato, deve usar o corpus HTML completo referenciado neste documento.</p>
  </section>

  {''.join(sections)}
</body>
</html>
"""


def main() -> None:
    inventory_path = latest_inventory_json()
    report = read_inventory(inventory_path)
    html_path = AUDIT_DIR / "jules_full_audit_prompt_2026-03-29.html"
    pdf_path = AUDIT_DIR / "jules_full_audit_prompt_2026-03-29.pdf"
    html_path.write_text(render_html(report, inventory_path), encoding="utf-8")

    browser = browser_path()
    subprocess.run(
        [
            str(browser),
            "--headless",
            "--disable-gpu",
            "--allow-file-access-from-files",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            html_path.resolve().as_uri(),
        ],
        check=True,
        cwd=str(ROOT),
    )

    print(json.dumps({
        "html": str(html_path),
        "pdf": str(pdf_path),
        "browser": str(browser),
        "total_artifacts": report["summary"]["total_files_found"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
