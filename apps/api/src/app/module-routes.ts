import type { ApiConfig } from "@birthub/config";
import type { Express } from "express";

import { createAdminRouter } from "../modules/admin/router.js";
import { createInstalledAgentsRouter } from "../modules/agents/router.js";
import { createAnalyticsRouter } from "../modules/analytics/router.js";
import { createApiKeysRouter } from "../modules/apikeys/router.js";
import { createAuthRouter } from "../modules/auth/router.js";
import { createBillingRouter } from "../modules/billing/index.js";
import { createBudgetRouter } from "../modules/budget/budget-routes.js";
import { createConnectorsRouter } from "../modules/connectors/index.js";
import { createDashboardRouter } from "../modules/dashboard/router.js";
import { createFeedbackRouter } from "../modules/feedback/index.js";
import { createInvitesRouter } from "../modules/invites/router.js";
import { createMarketplaceRouter } from "../modules/marketplace/marketplace-routes.js";
import { createNotificationsRouter } from "../modules/notifications/index.js";
import { createOrganizationsRouter } from "../modules/organizations/router.js";
import { createOutputRouter } from "../modules/outputs/output-routes.js";
import { createPackInstallerRouter } from "../modules/packs/pack-installer-routes.js";
import { createPrivacyRouter } from "../modules/privacy/router.js";
import { createSessionsRouter } from "../modules/sessions/router.js";
import { createUsersRouter } from "../modules/users/router.js";
import { createWebhooksRouter } from "../modules/webhooks/index.js";
import { createWorkflowsRouter } from "../modules/workflows/index.js";

export function mountModuleRouters(app: Express, config: ApiConfig): void {
  const marketplaceRouter = createMarketplaceRouter();
  const installedAgentsRouter = createInstalledAgentsRouter();

  app.use(createAdminRouter(config));
  app.use("/api/v1/auth", createAuthRouter(config));
  app.use("/api/v1", createSessionsRouter(config));
  app.use("/api/v1/apikeys", createApiKeysRouter(config));
  app.use("/api/v1/agents", installedAgentsRouter);
  app.use("/api/v1/agents", marketplaceRouter);
  app.use("/api/v1/analytics", createAnalyticsRouter());
  app.use(createDashboardRouter());
  app.use("/api/v1/connectors", createConnectorsRouter(config));
  app.use("/api/v1/marketplace", marketplaceRouter);
  app.use("/api/v1/billing", createBillingRouter(config));
  app.use("/api/v1/budgets", createBudgetRouter());
  app.use("/api/v1", createFeedbackRouter());
  app.use("/api/v1", createInvitesRouter());
  app.use("/api/v1", createNotificationsRouter());
  app.use("/api/v1", createOrganizationsRouter());
  app.use("/api/v1/packs", createPackInstallerRouter());
  app.use("/api/v1/outputs", createOutputRouter());
  app.use("/api/v1/privacy", createPrivacyRouter(config));
  app.use("/api/v1", createUsersRouter());
  app.use(createWorkflowsRouter(config));
  app.use(createWebhooksRouter(config));
}
