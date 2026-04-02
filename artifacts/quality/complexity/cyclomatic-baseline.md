# Cyclomatic Complexity Baseline

- generatedAt: 2026-03-23T02:41:05.090Z
- filesScanned: 813
- functionsScanned: 5229

## Modules

| Module | Functions | Avg | P95 | Max | >=20 |
| --- | ---: | ---: | ---: | ---: | ---: |
| packages/agents-core | 485 | 4.87 | 9 | 471 | 7 |
| apps/api | 1194 | 2.95 | 9 | 38 | 3 |
| packages/workflows-core | 68 | 3.34 | 10 | 35 | 1 |
| apps/web | 614 | 2.69 | 9 | 35 | 4 |
| apps/dashboard | 411 | 2.29 | 6 | 33 | 4 |
| packages/agents | 812 | 3.33 | 21 | 31 | 42 |
| apps/api-gateway | 521 | 2.26 | 7 | 25 | 3 |
| apps/worker | 450 | 2.39 | 8 | 24 | 3 |
| packages/database | 213 | 2.55 | 10 | 22 | 1 |
| apps/voice-engine | 44 | 2.30 | 5 | 17 | 0 |
| packages/integrations | 57 | 1.81 | 5 | 13 | 0 |
| packages/testing | 14 | 2.50 | 12 | 12 | 0 |
| packages/config | 43 | 2.63 | 9 | 12 | 0 |
| packages/logger | 53 | 2.45 | 8 | 11 | 0 |
| packages/agents-registry | 46 | 2.11 | 5 | 9 | 0 |
| agents/ae | 4 | 4.50 | 8 | 8 | 0 |
| agents/financeiro | 4 | 4.50 | 8 | 8 | 0 |
| agents/juridico | 4 | 4.50 | 8 | 8 | 0 |
| agents/marketing | 4 | 4.50 | 8 | 8 | 0 |
| agents/pos_venda | 4 | 4.50 | 8 | 8 | 0 |
| apps/agent-orchestrator | 13 | 3.46 | 8 | 8 | 0 |
| packages/auth | 18 | 1.78 | 7 | 7 | 0 |
| agents/sdr | 4 | 3.50 | 6 | 6 | 0 |
| packages/agent-runtime | 5 | 2.80 | 6 | 6 | 0 |
| packages/llm-client | 7 | 3.14 | 6 | 6 | 0 |
| packages/queue | 50 | 1.52 | 4 | 5 | 0 |
| agents/analista | 4 | 2.50 | 4 | 4 | 0 |
| agents/ldr | 3 | 2.00 | 4 | 4 | 0 |
| agents/shared | 4 | 1.75 | 4 | 4 | 0 |
| packages/conversation-core | 10 | 1.30 | 3 | 3 | 0 |
| packages/security | 14 | 1.29 | 3 | 3 | 0 |
| packages/agent-packs | 11 | 1.36 | 2 | 2 | 0 |
| packages/db | 20 | 1.20 | 2 | 2 | 0 |
| packages/emails | 5 | 1.40 | 2 | 2 | 0 |
| packages/shared | 2 | 1.00 | 1 | 1 | 0 |
| packages/shared-types | 2 | 1.00 | 1 | 1 | 0 |
| packages/utils | 12 | 1.00 | 1 | 1 | 0 |

## Top Hotspots (complexity >= 20)

- packages/agents-core/docs/assets/main.js:3 <anonymous> (complexity=471)
- packages/agents-core/docs/assets/main.js:3 <anonymous> (complexity=281)
- packages/agents-core/docs/assets/main.js:3 <anonymous> (complexity=281)
- apps/api/src/modules/connectors/router.ts:170 createConnectorsRouter (complexity=38)
- apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx:84 WorkflowRunsPage (complexity=35)
- packages/workflows-core/src/nodes/executeStep.ts:31 executeStep (complexity=35)
- apps/dashboard/components/sales-os/ToolView.tsx:18 ToolView (complexity=33)
- apps/web/app/(dashboard)/settings/developers/webhooks/page.tsx:35 DeveloperWebhooksPage (complexity=33)
- packages/agents/executivos/brandguardian/agent.ts:489 run (complexity=31)
- packages/agents/executivos/churndeflector/agent.ts:489 run (complexity=31)
- packages/agents/executivos/competitorxray/agent.ts:487 run (complexity=31)
- packages/agents/executivos/crisisnavigator/agent.ts:487 run (complexity=31)
- packages/agents/executivos/culturepulse/agent.ts:489 run (complexity=31)
- packages/agents/executivos/expansionmapper/agent.ts:489 run (complexity=31)
- packages/agents/executivos/marketsentinel/agent.ts:489 run (complexity=31)
- packages/agents/executivos/narrativeweaver/agent.ts:497 run (complexity=31)
- packages/agents/executivos/pipelineoracle/agent.ts:490 run (complexity=31)
- packages/agents/executivos/pricingoptimizer/agent.ts:487 run (complexity=31)
- packages/agents/executivos/quotaarchitect/agent.ts:490 run (complexity=31)
- packages/agents/executivos/trendcatcher/agent.ts:489 run (complexity=31)
- packages/agents/executivos/brandguardian/agent.ts:205 parseContractOverridesFromObject (complexity=30)
- packages/agents/executivos/budgetfluid/agent.ts:203 parseContractOverridesFromObject (complexity=30)
- packages/agents/executivos/budgetfluid/agent.ts:487 run (complexity=30)
- packages/agents/executivos/capitalallocator/agent.ts:203 parseContractOverridesFromObject (complexity=30)
- packages/agents/executivos/capitalallocator/agent.ts:487 run (complexity=30)
