# Checklist F1-F5

## F1 — Descoberta
- `description` segue padrão "Use when...".
- Contém palavras-chave reais do domínio.

## F2 — Contrato
- Objetivo em 1 frase.
- Entrada esperada definida.
- Saída obrigatória definida.
- Fora de escopo explícito.

## F3 — Prompting
- Instruções sem ambiguidades.
- Formato de saída claro e verificável.

## F4 — Implementação
- Local correto (`.github/agents`, `.github/skills`, etc.).
- `tools` mínimos para a função.
- Sem dependências implícitas não documentadas.

## F5 — Validação Cruzada
- Revisão por agente revisor.
- Checagem de políticas de segurança.
- Registro de riscos e pendências, quando houver.
