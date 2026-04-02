---
description: "Use when creating or editing agents, skills, hooks, or prompts with tool execution, permissions, or security impact."
applyTo: ".github/agents/**/*.md, .github/skills/**/SKILL.md, .github/hooks/**/*.json"
---
# Segurança para Customizações

- Nunca permitir execução de comandos destrutivos sem confirmação.
- Bloqueie ou solicite aprovação quando houver ambiguidade de risco.
- Limite `tools` ao mínimo necessário por função.
- Exija seção de riscos e mitigação em entregas sensíveis.
- Não incluir segredos, tokens ou credenciais em arquivos versionados.
