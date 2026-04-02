-- Align legacy tenant RLS policies with tenant_access_allowed() semantics.
-- This preserves tenant isolation once a session tenant is pinned while
-- allowing bootstrap/admin setup flows before app.current_tenant_id is fixed.

ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_organizations ON "organizations";
CREATE POLICY tenant_isolation_policy_organizations ON "organizations"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_members ON "members";
CREATE POLICY tenant_isolation_policy_members ON "members"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agents" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_agents ON "agents";
CREATE POLICY tenant_isolation_policy_agents ON "agents"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "workflows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflows" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_workflows ON "workflows";
CREATE POLICY tenant_isolation_policy_workflows ON "workflows"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "workflow_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_steps" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_workflow_steps ON "workflow_steps";
CREATE POLICY tenant_isolation_policy_workflow_steps ON "workflow_steps"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "workflow_transitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_transitions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_workflow_transitions ON "workflow_transitions";
CREATE POLICY tenant_isolation_policy_workflow_transitions ON "workflow_transitions"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "workflow_executions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_executions" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_workflow_executions ON "workflow_executions";
CREATE POLICY tenant_isolation_policy_workflow_executions ON "workflow_executions"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "step_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "step_results" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy_step_results ON "step_results";
CREATE POLICY tenant_isolation_policy_step_results ON "step_results"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));
