# Knowledge Transfer, Domain Glossary and Onboarding Notes

Este documento concentra os itens de transferencia de conhecimento do F10. O que depende de sessao humana ficou operacionalizado com agenda, dono e evidencia esperada.

## Guided learning path

1. Leia `README.md` e `docs/f10/architecture.md`.
2. Execute `pnpm monorepo:doctor` e `pnpm docs:verify`.
3. Use `docs/runbooks/new-engineer-onboarding.md` para chegar ao primeiro PR.
4. Revise `docs/technical-debt/dashboard.md` para entender riscos remanescentes.

## Knowledge transfer session register

| Dominio | Dono sugerido | Material base | Evidencia esperada | Status |
| --- | --- | --- | --- | --- |
| Billing | API Core + Finance Ops | `apps/api/src/modules/billing`, `docs/f10/architecture.md` | gravacao, notas e Q&A publicados | Operationalized |
| Auth | Identity Core | `apps/api/src/modules/auth`, `docs/security`, `docs/adrs/ADR-010-auth-provider.md` | gravacao, notas e Q&A publicados | Operationalized |
| Agents and workflows | Platform Runtime | `apps/worker`, `packages/workflows-core`, `packages/agent-packs` | gravacao, notas e Q&A publicados | Operationalized |

## Non-obvious design decisions

- O lane canonico de go-live considera `apps/web`, `apps/api`, `apps/worker` e `packages/database`; o resto opera como compatibilidade controlada.
- A execucao assincrona fica no worker para proteger latencia e isolamento da API.
- `packages/db` continua como shim de migracao; novos imports devem apontar para `@birthub/database`.
- A politica de breaking changes e deprecacao foi formalizada para evitar upgrades silenciosos em agents e workflows.
- A observabilidade de incidentes privilegia blast radius, tenant context e falha de tool para reduzir MTTR.

## Glossary

| Termo | Significado |
| --- | --- |
| BirthHub360 | Plataforma SaaS com foco em automacao, agentes e operacao multi-tenant. |
| Tenant | Organizacao isolada logicamente em runtime, auth, billing e dados. |
| Core lane | Conjunto oficial de servicos suportados para go-live e evidencias de release. |
| Workflow | Orquestracao declarativa de steps executada pelo runtime e worker. |
| Agent pack | Pacote versionado de agente e manifesto distribuido pelo marketplace interno. |
| Output | Resultado persistido de uma execucao, exportacao ou automacao. |
| DLQ | Dead letter queue para jobs esgotados ou falhos de forma terminal. |
| Cutover | Mudanca controlada do legado para a superficie canonica. |
| RPO/RTO | Objetivos de perda de dados e tempo de recuperacao em disaster recovery. |

## Common anti-patterns

- Criar feature nova no `apps/dashboard` em vez de priorizar `apps/web`.
- Fazer logica pesada ou IO lento diretamente na API em vez de enfileirar para o worker.
- Criar dependencias diretas no legado (`apps/api-gateway`, `packages/db`) sem RFC.
- Promover integracao externa sem timeout, retry, fallback e evidencias operacionais.
- Atualizar docs manualmente sem rodar `pnpm docs:verify`.

## Technical FAQ

### Onde encontro a superficie oficial do produto?
Em `apps/web`, `apps/api`, `apps/worker` e `packages/database`.

### Quando devo tocar o legado?
Somente para compatibilidade, cutover ou remocao controlada. Novas features devem evitar o legado.

### Como publico ou valido documentacao operacional?
Edite os artefatos em `docs`, rode `pnpm docs:verify` e relacione a evidencia no PR.

### Como sei se uma mudanca exige RFC ou ADR?
Se alterar fronteira arquitetural, rollout, observabilidade, seguranca ou contrato externo, use o template de RFC e avalie ADR.

### Qual e o caminho mais curto para um incidente de fila?
Comece por `docs/runbooks/p1-alert-response-matrix.md` e depois aprofunde em `docs/runbooks/high-fail-rate-triage.md`.

## Business processes that impact code

### Billing lifecycle

- Checkout, portal e invoices dependem do contrato com Stripe.
- Mudancas em grace period, dunning ou budgets afetam authz, UI e auditoria.

### Compliance and privacy

- Operacoes com PII precisam seguir LGPD, politica de logs e trilha de auditoria.
- Exportacoes e retention policy precisam respeitar prazo e base legal.

### Approvals and policy engine

- Workflows com aprovacao impactam SLA, escalacao e payload retention.
- Mudancas no policy engine exigem impacto em seguranca, UX e runtime.

### Marketplace and pack lifecycle

- Mudancas em manifestos exigem versionamento, changelog e migracao segura.
- Packs afetam instalacao, billing e suporte de CS.

## Onboarding validation protocol

O fechamento real deste item depende de um engenheiro novo executando o roteiro sem ajuda externa. O protocolo e o registro de execucao ficam em `docs/f10/continuity-validation.md`.
