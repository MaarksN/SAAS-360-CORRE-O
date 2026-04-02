<!-- [SOURCE] BirthHub360_Agentes_Parallel_Plan - BudgetFluid -->
# BudgetFluid - Acceptance Criteria

| Critério | Input mínimo | Output esperado | Como verificar | Evidência |
|---|---|---|---|---|
| Sucesso Nominal | Request com target efficiency e segmentos alvo definidos. | Status `success` e schema válido com score de eficiência e realocação. | Validar contra `BudgetFluidOutputSchema`. | Testes de unit e schema aprovados. |
| Falha Parcial (Fallback) | Uma ou mais tools falham (simuladas com throws). | Fallback aplicado = `true`, status = `fallback` e preenchimento `degraded_report`. | Garantir retry schedule de `baseDelayMs` = 500, depois fallback emitido. | Métricas `toolFailures` > 0 registradas e eventos de `fallback.applied`. |
| Limite Extrapolado (Hard Fail) | Inputs além das restrições de schema ou falha com fallback de hard fail ativo. | Output `status=error` explícito. | Schema parse com Zod Error explícito na validação de fronteira ou throws se falha irrecuperável. | Assert explícito sobre erro no test suite. |
| Observabilidade | Execução limpa. | Todos eventos emitidos no decorrer da execução (`request.received`, `tool.call.started`, `response.generated`, etc). | Acompanhar a array de observability output events. | Cobertura de eventos em `test_unit.ts`. |
