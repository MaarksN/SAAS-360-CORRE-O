---
description: "Use when defining agent architecture, decomposition, responsibilities, boundaries, and orchestration strategy for custom agents and skills."
applyTo: ".github/agents/**/*.md, .github/skills/**/SKILL.md"
---
# Arquitetura de Agentes

- Separe responsabilidade por agente (single purpose).
- Evite sobreposição entre agentes; se houver conflito, explicite precedência.
- Prefira composição por handoff/subagent a agentes monolíticos.
- Defina entradas e saídas explícitas no corpo de cada agente.
- Para fluxos repetíveis, prefira skills com assets e referências versionadas.
