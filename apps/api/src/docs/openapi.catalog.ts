type HttpMethod = "delete" | "get" | "patch" | "post" | "put";
type SuccessStatus = "200" | "201" | "202" | "204";

export interface OpenApiRouteCatalogEntry {
  method: HttpMethod;
  path: string;
  secured: boolean;
  successStatus: SuccessStatus;
  summary: string;
  tag: string;
}

interface RelativeRouteDefinition {
  method: HttpMethod;
  path: string;
  secured?: boolean;
  successStatus?: SuccessStatus;
  summary: string;
}

function route(
  method: HttpMethod,
  path: string,
  summary: string,
  options: Partial<Pick<OpenApiRouteCatalogEntry, "secured" | "successStatus" | "tag">> & {
    tag: string;
  }
): OpenApiRouteCatalogEntry {
  return {
    method,
    path,
    secured: options.secured ?? true,
    successStatus: options.successStatus ?? "200",
    summary,
    tag: options.tag
  };
}

function withPrefix(
  prefix: string,
  tag: string,
  routes: readonly RelativeRouteDefinition[]
): OpenApiRouteCatalogEntry[] {
  return routes.map((item) =>
    route(
      item.method,
      item.path === "/" ? prefix : `${prefix}${item.path}`,
      item.summary,
      {
        secured: item.secured ?? true,
        successStatus: item.successStatus ?? "200",
        tag
      }
    )
  );
}

const marketplaceRelativeRoutes = [
  {
    method: "get",
    path: "/search",
    summary: "Search marketplace agents"
  },
  {
    method: "get",
    path: "/recommendations",
    summary: "List marketplace recommendations"
  },
  {
    method: "get",
    path: "/compare/matrix",
    summary: "Compare marketplace agents side by side"
  },
  {
    method: "get",
    path: "/:agentId/docs",
    summary: "Read marketplace agent documentation"
  },
  {
    method: "get",
    path: "/:agentId/changelog",
    summary: "Read marketplace agent changelog"
  }
] as const satisfies ReadonlyArray<RelativeRouteDefinition>;

export const openApiRouteCatalog = [
  route("get", "/api/openapi.json", "Fetch the generated OpenAPI document", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/metrics", "Read process metrics", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/api/v1/metrics", "Read versioned process metrics", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/health", "Read basic health status", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/api/v1/health", "Read versioned basic health status", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/health/deep", "Read deep dependency health status", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/api/v1/health/deep", "Read versioned deep dependency health status", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/health/readiness", "Read readiness status", {
    secured: false,
    tag: "Operational"
  }),
  route("get", "/api/v1/health/readiness", "Read versioned readiness status", {
    secured: false,
    tag: "Operational"
  }),
  route("post", "/api/v1/auth/login", "Authenticate with email and password", {
    secured: false,
    tag: "Auth"
  }),
  route("post", "/api/v1/auth/mfa/challenge", "Complete MFA challenge", {
    secured: false,
    tag: "Auth"
  }),
  route("post", "/api/v1/auth/refresh", "Refresh an authenticated session", {
    secured: false,
    tag: "Auth"
  }),
  route("post", "/api/v1/auth/logout", "Logout the current session", {
    tag: "Auth"
  }),
  route("get", "/api/v1/sessions", "List active sessions for the current user", {
    tag: "Auth"
  }),
  route("get", "/api/v1/auth/introspect", "Introspect an API key token", {
    secured: false,
    tag: "Auth"
  }),
  route("post", "/api/v1/auth/mfa/setup", "Start MFA enrollment for the current user", {
    tag: "Auth"
  }),
  route("post", "/api/v1/auth/mfa/enable", "Enable MFA for the current user", {
    tag: "Auth"
  }),
  route("delete", "/api/v1/sessions/:sessionId", "Revoke a single session", {
    tag: "Auth"
  }),
  route("post", "/api/v1/sessions/logout-all", "Logout all sessions for the current user", {
    tag: "Auth"
  }),
  route("post", "/api/v1/auth/logout-all", "Logout all sessions through the auth alias", {
    tag: "Auth"
  }),
  route("post", "/api/v1/organizations", "Provision a new organization", {
    secured: false,
    successStatus: "201",
    tag: "Organizations"
  }),
  route("get", "/api/v1/me", "Read the current user and billing snapshot", {
    tag: "Core"
  }),
  route("post", "/api/v1/tasks", "Enqueue a governed task for worker processing", {
    secured: true,
    successStatus: "202",
    tag: "Core"
  }),
  route("post", "/api/v1/admin/impersonations", "Create an admin impersonation session", {
    tag: "Admin"
  }),
  ...withPrefix("/api/v1/apikeys", "API Keys", [
    {
      method: "get",
      path: "/",
      summary: "List API keys"
    },
    {
      method: "post",
      path: "/",
      summary: "Create an API key",
      successStatus: "201"
    },
    {
      method: "post",
      path: "/:id/rotate",
      summary: "Rotate an API key"
    },
    {
      method: "delete",
      path: "/:id",
      summary: "Revoke an API key"
    }
  ]),
  ...withPrefix("/api/v1/agents", "Agents", [
    {
      method: "get",
      path: "/installed",
      summary: "List installed agents"
    },
    {
      method: "get",
      path: "/installed/:installedAgentId",
      summary: "Read installed agent details"
    },
    {
      method: "post",
      path: "/installed/:installedAgentId/run",
      summary: "Start a live installed-agent execution",
      successStatus: "202"
    },
    {
      method: "get",
      path: "/installed/:installedAgentId/policies",
      summary: "List installed-agent policies"
    },
    {
      method: "post",
      path: "/installed/:installedAgentId/policies",
      summary: "Create a managed installed-agent policy",
      successStatus: "201"
    },
    {
      method: "patch",
      path: "/installed/:installedAgentId/policies/:policyId",
      summary: "Update a managed installed-agent policy"
    },
    {
      method: "post",
      path: "/installed/:installedAgentId/policies/templates",
      summary: "Apply a managed policy template"
    },
    {
      method: "get",
      path: "/installed/:installedAgentId/metrics",
      summary: "Read installed-agent metrics"
    },
    {
      method: "get",
      path: "/installed/:installedAgentId/run/stream",
      summary: "Stream a live installed-agent execution",
      secured: false
    }
  ]),
  ...withPrefix("/api/v1/analytics", "Analytics", [
    {
      method: "get",
      path: "/usage",
      summary: "Read usage analytics"
    },
    {
      method: "get",
      path: "/executive",
      summary: "Read executive analytics"
    },
    {
      method: "get",
      path: "/cohort",
      summary: "Read cohort analytics"
    },
    {
      method: "get",
      path: "/billing/export",
      summary: "Export billing analytics"
    },
    {
      method: "get",
      path: "/active-tenants",
      summary: "Read active tenant analytics"
    },
    {
      method: "get",
      path: "/cs-risk",
      summary: "Read customer-success risk analytics"
    },
    {
      method: "get",
      path: "/quality-report",
      summary: "Read quality analytics"
    },
    {
      method: "get",
      path: "/agent-performance",
      summary: "Read agent performance analytics"
    },
    {
      method: "get",
      path: "/master-dashboard",
      summary: "Read master dashboard analytics"
    },
    {
      method: "get",
      path: "/operations",
      summary: "Read operations analytics"
    }
  ]),
  ...withPrefix("/api/v1/billing", "Billing", [
    {
      method: "get",
      path: "/plans",
      secured: false,
      summary: "List active billing plans"
    },
    {
      method: "post",
      path: "/checkout",
      summary: "Create a billing checkout session"
    },
    {
      method: "get",
      path: "/portal",
      summary: "Create a customer portal session"
    },
    {
      method: "get",
      path: "/invoices",
      summary: "List billing invoices"
    },
    {
      method: "get",
      path: "/usage",
      summary: "Read billing usage"
    }
  ]),
  ...withPrefix("/api/v1/budgets", "Budgets", [
    {
      method: "get",
      path: "/usage",
      summary: "Read budget usage"
    },
    {
      method: "post",
      path: "/limits",
      summary: "Create or update budget limits"
    },
    {
      method: "get",
      path: "/estimate",
      summary: "Estimate budget impact"
    },
    {
      method: "get",
      path: "/export.csv",
      summary: "Export budget usage as CSV"
    },
    {
      method: "post",
      path: "/consume",
      summary: "Consume budget explicitly"
    }
  ]),
  ...withPrefix("/api/v1/connectors", "Connectors", [
    {
      method: "get",
      path: "/",
      summary: "List connector accounts"
    },
    {
      method: "post",
      path: "/",
      summary: "Create a connector account",
      successStatus: "201"
    },
    {
      method: "post",
      path: "/:provider/connect",
      summary: "Start provider connection flow"
    },
    {
      method: "post",
      path: "/:provider/callback",
      summary: "Handle provider callback"
    },
    {
      method: "get",
      path: "/:provider/callback",
      summary: "Handle provider callback redirect"
    },
    {
      method: "post",
      path: "/:provider/sync",
      summary: "Trigger provider synchronization",
      successStatus: "202"
    }
  ]),
  route("get", "/api/v1/dashboard/metrics", "Read dashboard metrics", {
    tag: "Dashboard"
  }),
  route("get", "/api/v1/dashboard/agent-statuses", "Read dashboard agent statuses", {
    tag: "Dashboard"
  }),
  route("get", "/api/v1/dashboard/recent-tasks", "Read dashboard recent tasks", {
    tag: "Dashboard"
  }),
  route("get", "/api/v1/dashboard/billing-summary", "Read dashboard billing summary", {
    tag: "Dashboard"
  }),
  ...withPrefix("/api/v1", "Feedback", [
    {
      method: "get",
      path: "/executions/:id/feedback",
      summary: "Read execution feedback"
    },
    {
      method: "post",
      path: "/executions/:id/feedback",
      summary: "Save execution feedback"
    }
  ]),
  ...withPrefix("/api/v1", "Invites", [
    {
      method: "post",
      path: "/invites",
      summary: "Create an invite",
      successStatus: "201"
    },
    {
      method: "get",
      path: "/invites",
      summary: "List invites"
    },
    {
      method: "post",
      path: "/invites/accept",
      secured: false,
      summary: "Accept an invite"
    },
    {
      method: "post",
      path: "/invites/:id/revoke",
      summary: "Revoke an invite"
    }
  ]),
  ...withPrefix("/api/v1/agents", "Marketplace", marketplaceRelativeRoutes),
  ...withPrefix("/api/v1/marketplace", "Marketplace", marketplaceRelativeRoutes),
  ...withPrefix("/api/v1", "Notifications", [
    {
      method: "get",
      path: "/notifications",
      summary: "List notifications"
    },
    {
      method: "patch",
      path: "/notifications/read-all",
      summary: "Mark all notifications as read"
    },
    {
      method: "patch",
      path: "/notifications/:id/read",
      summary: "Mark one notification as read"
    },
    {
      method: "get",
      path: "/notifications/preferences",
      summary: "Read notification preferences"
    },
    {
      method: "put",
      path: "/notifications/preferences",
      summary: "Save notification preferences"
    }
  ]),
  ...withPrefix("/api/v1", "Organizations", [
    {
      method: "post",
      path: "/orgs",
      summary: "Create an organization alias",
      successStatus: "201"
    },
    {
      method: "post",
      path: "/organizations",
      summary: "Create an organization",
      successStatus: "201"
    },
    {
      method: "get",
      path: "/orgs/:id/members",
      summary: "List organization members"
    },
    {
      method: "patch",
      path: "/orgs/:id/members/:memberId",
      summary: "Update an organization member"
    },
    {
      method: "delete",
      path: "/orgs/:id/members/:memberId",
      summary: "Remove an organization member"
    },
    {
      method: "get",
      path: "/orgs/:id/audit",
      summary: "Read organization audit logs"
    },
    {
      method: "get",
      path: "/orgs/:id/audit/export",
      summary: "Export organization audit logs"
    }
  ]),
  ...withPrefix("/api/v1/outputs", "Outputs", [
    {
      method: "get",
      path: "/",
      summary: "List outputs"
    },
    {
      method: "post",
      path: "/",
      summary: "Create an output",
      successStatus: "201"
    },
    {
      method: "get",
      path: "/:outputId",
      summary: "Read an output"
    },
    {
      method: "post",
      path: "/:outputId/approve",
      summary: "Approve an output"
    },
    {
      method: "get",
      path: "/:outputId/export",
      summary: "Export an output"
    },
    {
      method: "post",
      path: "/prune",
      summary: "Prune retained outputs",
      successStatus: "202"
    }
  ]),
  ...withPrefix("/api/v1/packs", "Packs", [
    {
      method: "post",
      path: "/install",
      summary: "Install a pack",
      successStatus: "202"
    },
    {
      method: "post",
      path: "/uninstall",
      summary: "Uninstall a pack",
      successStatus: "202"
    },
    {
      method: "get",
      path: "/status",
      summary: "Read pack installation status"
    },
    {
      method: "post",
      path: "/:packId/version",
      summary: "Pin a pack version"
    },
    {
      method: "get",
      path: "/:packId",
      summary: "Read pack details"
    }
  ]),
  ...withPrefix("/api/v1/privacy", "Privacy", [
    {
      method: "get",
      path: "/export",
      summary: "Export privacy data"
    },
    {
      method: "post",
      path: "/delete-account",
      summary: "Delete an account",
      successStatus: "202"
    }
  ]),
  ...withPrefix("/api/v1", "Users", [
    {
      method: "get",
      path: "/users",
      summary: "List users"
    },
    {
      method: "patch",
      path: "/users/:userId/suspend",
      summary: "Suspend a user"
    },
    {
      method: "patch",
      path: "/users/:userId/role",
      summary: "Update a user role"
    },
    {
      method: "delete",
      path: "/users/:userId",
      summary: "Remove a user"
    },
    {
      method: "get",
      path: "/team/members",
      summary: "List team members"
    },
    {
      method: "patch",
      path: "/team/members/:userId/role",
      summary: "Update a team member role"
    }
  ]),
  route("post", "/webhooks/trigger/:id", "Trigger a published webhook workflow", {
    secured: false,
    successStatus: "202",
    tag: "Webhooks"
  }),
  route("get", "/api/v1/settings/webhooks", "List outbound webhook endpoints", {
    tag: "Webhooks"
  }),
  route("post", "/api/v1/settings/webhooks", "Create an outbound webhook endpoint", {
    successStatus: "201",
    tag: "Webhooks"
  }),
  route("patch", "/api/v1/settings/webhooks/:id", "Update an outbound webhook endpoint", {
    tag: "Webhooks"
  }),
  route("get", "/api/v1/settings/webhooks/:id/deliveries", "List outbound webhook deliveries", {
    tag: "Webhooks"
  }),
  route("post", "/api/v1/settings/webhooks/deliveries/:id/retry", "Retry an outbound webhook delivery", {
    successStatus: "202",
    tag: "Webhooks"
  }),
  route("post", "/api/webhooks/stripe", "Receive Stripe webhooks", {
    secured: false,
    successStatus: "202",
    tag: "Webhooks"
  }),
  route("get", "/api/v1/workflows", "List workflows", {
    tag: "Workflows"
  }),
  route("post", "/api/v1/workflows", "Create a workflow", {
    successStatus: "201",
    tag: "Workflows"
  }),
  route("get", "/api/v1/workflows/:id", "Read workflow details", {
    tag: "Workflows"
  }),
  route("put", "/api/v1/workflows/:id", "Update a workflow", {
    tag: "Workflows"
  }),
  route("delete", "/api/v1/workflows/:id", "Archive a workflow", {
    successStatus: "204",
    tag: "Workflows"
  }),
  route("post", "/api/v1/workflows/:id/run", "Run a workflow immediately", {
    successStatus: "202",
    tag: "Workflows"
  }),
  route("get", "/api/v1/workflows/:id/webhook-url", "Read a workflow webhook URL", {
    tag: "Workflows"
  }),
  route("post", "/api/v1/workflows/events/:topic", "Emit a workflow internal event", {
    successStatus: "202",
    tag: "Workflows"
  })
] as const satisfies ReadonlyArray<OpenApiRouteCatalogEntry>;

export const openApiTags = [...new Set(openApiRouteCatalog.map((entry) => entry.tag))].map((name) => ({
  description: `${name} routes in the canonical BirthHub 360 API surface.`,
  name
}));
