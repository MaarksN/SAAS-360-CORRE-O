# Política de Frescor e Revalidação de Evidências

Este documento define as regras formais para expiração, revalidação e rerun das evidências de governança e operacionais do BirthHub 360, atendendo aos requisitos de due diligence e ao gap **[AUD-21]**.

## 1. Princípio do Frescor Contínuo (Continuous Evidence Freshness)

As evidências estáticas tornam-se obsoletas caso haja mudanças drásticas no core da arquitetura (e.g., atualizações de dependências críticas ou refatorações profundas de isolamento multi-tenant). Para mitigar o decaimento de confiança (confidence decay) nas evidências arquivadas em `/artifacts/` e `/audit/`, as regras a seguir são imperativas.

## 2. Prazos de Expiração de Evidências

Cada tipo de artefato ou bundle possui um tempo de vida (TTL) predeterminado para uso em processos de compliance e auditorias B2B.

| Categoria da Evidência | Caminho Relativo | Prazo de Expiração (TTL) | Gatilho Adicional para Invalidação |
|-------------------------|------------------|--------------------------|------------------------------------|
| **Bundles F11 (Logs/Hashes)** | `artifacts/f11-closure-*/` | 90 dias | Nova grande arquitetura de CI/CD ou mudança radical na malha de eventos. |
| **Testes de Isolamento Multi-tenant** | `artifacts/security/tenant-*` | 30 dias | Alteração em middlewares de Auth ou tabelas do banco com RLS ativo. |
| **Relatórios de Scan de Segurança (SAST/SCA)** | `artifacts/security/semgrep-*`, `pnpm-audit*` | 14 dias | Qualquer alteração no `pnpm-lock.yaml` ou submissão de código que afete rotas públicas (apps/api). |
| **Smoke Tests de Release** | `artifacts/release/smoke-*` | Próxima Release | O artefato só vale para a release específica. Nova release = nova evidência exigida. |
| **Relatórios de Due Diligence / Penetration Tests** | N/A (Externo/Vendor) | 365 dias | Alteração severa na topologia de infraestrutura da Nuvem. |

## 3. Política de Revalidação (Rerun) Automática

As evidências não precisam (nem devem) ser regeradas manualmente na sua totalidade. A pipeline de CI/CD atualizada atua como motor de revalidação.

1. **Expiração Silenciosa:** Se um artefato atingiu seu TTL (ex: Relatório de Semgrep com mais de 14 dias), o repositório é considerado temporariamente não-complacente até o próximo rerun agendado.
2. **Cron Job Noturno (Nightly Assurance):** O job de segurança (`ci:security-guardrails`) deve rodar nightly para assegurar frescor máximo das evidências mais críticas (Segurança, Isolamento).
3. **Auditoria Trimestral (Quarterly Re-Audit):** Uma revalidação completa (regenerando o bundle F11 e as métricas SaaS Maturity Score) deve ser disparada a cada 90 dias (conforme a janela do [DOC-10] SLA Adherence).

## 4. Retenção (Cadeia de Custódia)

Artefatos expirados **NÃO devem ser excluídos**, mas sim segregados.
- **Destino:** Evidências obsoletas devem ser mantidas como append-only ou consolidadas em branches/pastas de arquivo longo (archive) seguindo a política em `docs/log-retention-policy.md`.
- **Justificativa:** Provar a saúde da plataforma durante negociações B2B retroativas (ex: incidentes passados e due diligence que analisa comportamento de anos anteriores).

## 5. Exceções e Overrides

Qualquer bypass das regras de TTL ou rerun das evidências deve ser aprovado pelo comitê técnico, com abertura de um documento ADR descrevendo a exceção (ex: travamento de fornecedor de scan de segurança por uma semana impossibilitando a recriação do artefato).