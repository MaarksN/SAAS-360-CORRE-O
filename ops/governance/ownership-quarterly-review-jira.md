# Jira Recorrente - Ownership Matrix

- Ticket recorrente: `BH360-OWN-TRI-001`
- Link: `https://jira.example.internal/browse/BH360-OWN-TRI-001`
- Tipo: Task
- Projeto: BH360
- Frequencia: trimestral (1a semana de `jan`, `abr`, `jul`, `out`)
- Horario de referencia: 10:00 `America/Sao_Paulo`
- Canal de coordenacao: `#bh360-devops-ownership`

## Resumo sugerido

`[Governance] Revisao trimestral da matriz de ownership por dominio`

## Descricao sugerida

1. Confirmar owner primario e backup dos dominios: web, api, worker, database, agents, security, devops.
2. Verificar cobertura dos componentes criticos e ausencia de ownership orfao.
3. Validar canais oficiais de comunicacao por dominio.
4. Validar checklist de acesso (repo, CI/CD, observabilidade, ferramenta critica).
5. Revisar handoffs pendentes e atualizar versionamento da matriz.
6. Publicar resultado nos canais de dominio e no canal de engenharia.

## Checklist da issue

- [ ] `pnpm audit:ownership` verde
- [ ] Matriz `docs/operations/f0-ownership-matrix.md` atualizada
- [ ] Confirmacao dos owners registrada com data
- [ ] Eventos de calendario do proximo trimestre confirmados
- [ ] Aprovacao final do owner de DevOps

## Observacao

Provisionamento externo (Jira/Calendar) depende de permissao administrativa fora do repositorio.
