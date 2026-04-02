-- F8 hardening: tenant RLS coverage, immutable audit trail and high-write table tuning.

CREATE OR REPLACE FUNCTION tenant_access_allowed(row_tenant_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT get_current_tenant_id() IS NULL OR row_tenant_id = get_current_tenant_id();
$$;

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;

ALTER TABLE "agent_budget_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_budget_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_agent_budget_events ON "agent_budget_events"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "agent_budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_budgets" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_agent_budgets ON "agent_budgets"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "agent_executions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_executions" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_agent_executions ON "agent_executions"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "agent_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_feedback" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_agent_feedback ON "agent_feedback"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "agent_handoffs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_handoffs" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_agent_handoffs ON "agent_handoffs"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_api_keys ON "api_keys"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_audit_logs ON "audit_logs"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "billing_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_credits" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_billing_credits ON "billing_credits"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "billing_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_billing_events ON "billing_events"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "connector_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connector_accounts" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_connector_accounts ON "connector_accounts"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "connector_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connector_credentials" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_connector_credentials ON "connector_credentials"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "connector_sync_cursors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connector_sync_cursors" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_connector_sync_cursors ON "connector_sync_cursors"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "conversation_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation_messages" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_conversation_messages ON "conversation_messages"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "conversation_threads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation_threads" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_conversation_threads ON "conversation_threads"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "crm_sync_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_sync_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_crm_sync_events ON "crm_sync_events"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_customers ON "customers"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "dataset_exports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dataset_exports" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_dataset_exports ON "dataset_exports"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invites" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_invites ON "invites"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_invoices ON "invoices"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "job_signing_secrets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_signing_secrets" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_job_signing_secrets ON "job_signing_secrets"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "login_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "login_alerts" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_login_alerts ON "login_alerts"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "mfa_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mfa_challenges" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_mfa_challenges ON "mfa_challenges"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "mfa_recovery_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mfa_recovery_codes" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_mfa_recovery_codes ON "mfa_recovery_codes"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_notifications ON "notifications"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "output_artifacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "output_artifacts" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_output_artifacts ON "output_artifacts"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_methods" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_payment_methods ON "payment_methods"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "quota_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quota_usage" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_quota_usage ON "quota_usage"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_sessions ON "sessions"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_subscriptions ON "subscriptions"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "tenant_activity_windows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_activity_windows" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_tenant_activity_windows ON "tenant_activity_windows"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "usage_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_records" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_usage_records ON "usage_records"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_preferences" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_user_preferences ON "user_preferences"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "webhook_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_deliveries" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_webhook_deliveries ON "webhook_deliveries"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

ALTER TABLE "webhook_endpoints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_endpoints" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy_webhook_endpoints ON "webhook_endpoints"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));

DROP TRIGGER IF EXISTS audit_logs_append_only_guard ON "audit_logs";
CREATE TRIGGER audit_logs_append_only_guard
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_action_createdAt_idx"
  ON "audit_logs"("tenantId", "action", "createdAt");

ALTER TABLE "agent_budget_events" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 50
);

ALTER TABLE "audit_logs" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 50
);

ALTER TABLE "billing_events" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 50
);

ALTER TABLE "crm_sync_events" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 50
);

ALTER TABLE "webhook_deliveries" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 50
);

