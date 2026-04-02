import { Role, WorkflowStatus, WorkflowStepType, WorkflowTransitionRoute, WorkflowTriggerType } from "@prisma/client";
import { createHash } from "node:crypto";

import type { PlanSeed, SeedWorkflowDefinition, TenantSeed } from "./types.js";

export const plans: PlanSeed[] = [
  {
    code: "starter",
    currency: "usd",
    description: "Plano de entrada para times pequenos.",
    limits: {
      agents: 5,
      aiPrompts: 5_000,
      apiRequests: 5_000,
      emails: 2_500,
      features: {
        advancedAnalytics: false,
        agents: true,
        customerPortal: true,
        workflows: true
      },
      monthlyTokens: 250_000,
      storageGb: 100,
      workflows: 30
    },
    monthlyPriceCents: 4900,
    name: "Starter",
    stripePriceId: "price_starter_monthly",
    stripeProductId: "prod_starter",
    yearlyPriceCents: 47040
  },
  {
    code: "pro",
    currency: "usd",
    description: "Plano para operação em escala com automações avançadas.",
    limits: {
      agents: 25,
      aiPrompts: 25_000,
      apiRequests: 25_000,
      emails: 10_000,
      features: {
        advancedAnalytics: true,
        agents: true,
        customerPortal: true,
        workflows: true
      },
      monthlyTokens: 2_500_000,
      storageGb: 500,
      workflows: 250
    },
    monthlyPriceCents: 14900,
    name: "Pro",
    stripePriceId: "price_pro_monthly",
    stripeProductId: "prod_pro",
    yearlyPriceCents: 143040
  },
  {
    code: "enterprise",
    currency: "usd",
    description: "Plano enterprise com limites ilimitados e suporte prioritário.",
    limits: {
      agents: -1,
      aiPrompts: -1,
      apiRequests: -1,
      emails: -1,
      features: {
        advancedAnalytics: true,
        agents: true,
        customerPortal: true,
        prioritySupport: true,
        workflows: true
      },
      monthlyTokens: -1,
      storageGb: -1,
      workflows: -1
    },
    monthlyPriceCents: 49900,
    name: "Enterprise",
    stripePriceId: "price_enterprise_monthly",
    stripeProductId: "prod_enterprise",
    yearlyPriceCents: 479040
  }
];

export const tenants: TenantSeed[] = [
  {
    agents: ["Alpha Concierge", "Alpha Revenue Scout", "Alpha Retention Radar"],
    members: [
      { email: "owner.alpha@birthub.local", name: "Alpha Owner", role: Role.OWNER },
      { email: "admin.alpha@birthub.local", name: "Alpha Admin", role: Role.ADMIN },
      { email: "ops.alpha@birthub.local", name: "Alpha Ops", role: Role.ADMIN },
      { email: "member.alpha@birthub.local", name: "Alpha Member", role: Role.MEMBER },
      { email: "success.alpha@birthub.local", name: "Alpha Success", role: Role.MEMBER },
      { email: "readonly.alpha@birthub.local", name: "Alpha Readonly", role: Role.READONLY }
    ],
    name: "BirthHub Alpha",
    planCode: "pro",
    slug: "birthhub-alpha"
  },
  {
    agents: ["Beta Concierge", "Beta Revenue Scout", "Beta Retention Radar"],
    members: [
      { email: "owner.beta@birthub.local", name: "Beta Owner", role: Role.OWNER },
      { email: "admin.beta@birthub.local", name: "Beta Admin", role: Role.ADMIN },
      { email: "ops.beta@birthub.local", name: "Beta Ops", role: Role.ADMIN },
      { email: "member.beta@birthub.local", name: "Beta Member", role: Role.MEMBER },
      { email: "success.beta@birthub.local", name: "Beta Success", role: Role.MEMBER },
      { email: "readonly.beta@birthub.local", name: "Beta Readonly", role: Role.READONLY }
    ],
    name: "BirthHub Beta",
    planCode: "starter",
    slug: "birthhub-beta"
  }
];

export function buildTenantWorkflows(tenantId: string): SeedWorkflowDefinition[] {
  return [
    {
      description: "Fluxo de onboarding com trigger de webhook, espera e ação final HTTP.",
      name: "Onboarding Workflow",
      status: WorkflowStatus.PUBLISHED,
      steps: [
        {
          config: {
            expects: "user_created"
          },
          isTrigger: true,
          key: "trigger_webhook",
          name: "Webhook Trigger",
          type: WorkflowStepType.TRIGGER_WEBHOOK
        },
        {
          config: {
            channel: "email",
            message: "Bem-vindo(a) ao BirthHub 360!",
            to: "{{ trigger.output.email }}"
          },
          key: "send_welcome_email",
          name: "Send Welcome Email",
          type: WorkflowStepType.SEND_NOTIFICATION
        },
        {
          config: {
            duration_ms: 86_400_000
          },
          key: "wait_24h",
          name: "Wait 24h",
          type: WorkflowStepType.DELAY
        },
        {
          config: {
            body: {
              source: "workflow_onboarding",
              tenantId,
              userEmail: "{{ trigger.output.email }}"
            },
            method: "POST",
            timeout_ms: 2_500,
            url: "https://example.local/internal/followup"
          },
          key: "create_followup",
          name: "Create Follow-up Task",
          type: WorkflowStepType.HTTP_REQUEST
        }
      ],
      transitions: [
        {
          route: WorkflowTransitionRoute.ALWAYS,
          sourceKey: "trigger_webhook",
          targetKey: "send_welcome_email"
        },
        {
          route: WorkflowTransitionRoute.ALWAYS,
          sourceKey: "send_welcome_email",
          targetKey: "wait_24h"
        },
        {
          route: WorkflowTransitionRoute.ALWAYS,
          sourceKey: "wait_24h",
          targetKey: "create_followup"
        }
      ],
      triggerConfig: {
        method: "POST",
        path: "/webhooks/trigger/onboarding"
      },
      triggerType: WorkflowTriggerType.WEBHOOK,
      webhookSecret: createHash("sha256").update(`${tenantId}:onboarding-webhook`).digest("hex")
    },
    {
      cronExpression: "0 8 * * *",
      description: "Fluxo de alerta operacional diário com branch condicional.",
      name: "Alert Workflow",
      status: WorkflowStatus.PUBLISHED,
      steps: [
        {
          config: {
            cron: "0 8 * * *"
          },
          isTrigger: true,
          key: "trigger_cron",
          name: "Daily Trigger",
          type: WorkflowStepType.TRIGGER_CRON
        },
        {
          config: {
            method: "GET",
            timeout_ms: 2_500,
            url: "https://example.local/internal/health-summary"
          },
          key: "fetch_health",
          name: "Fetch Health Summary",
          type: WorkflowStepType.HTTP_REQUEST
        },
        {
          config: {
            operator: ">",
            path: "steps.fetch_health.output.failRate",
            value: 0.2
          },
          key: "check_fail_rate",
          name: "Check Fail Rate",
          type: WorkflowStepType.CONDITION
        },
        {
          config: {
            channel: "inapp",
            message: "Fail rate acima do limite no tenant {{ trigger.output.tenantId }}.",
            to: "ops@birthub.local"
          },
          key: "notify_ops",
          name: "Notify Ops",
          type: WorkflowStepType.SEND_NOTIFICATION
        },
        {
          config: {
            map: {
              observedAt: "{{ steps.fetch_health.output.checkedAt }}",
              status: "ok"
            }
          },
          key: "log_normal_state",
          name: "Log Normal State",
          type: WorkflowStepType.TRANSFORMER
        }
      ],
      transitions: [
        {
          route: WorkflowTransitionRoute.ALWAYS,
          sourceKey: "trigger_cron",
          targetKey: "fetch_health"
        },
        {
          route: WorkflowTransitionRoute.ALWAYS,
          sourceKey: "fetch_health",
          targetKey: "check_fail_rate"
        },
        {
          route: WorkflowTransitionRoute.IF_TRUE,
          sourceKey: "check_fail_rate",
          targetKey: "notify_ops"
        },
        {
          route: WorkflowTransitionRoute.IF_FALSE,
          sourceKey: "check_fail_rate",
          targetKey: "log_normal_state"
        }
      ],
      triggerConfig: {
        cron: "0 8 * * *",
        timezone: "America/Sao_Paulo"
      },
      triggerType: WorkflowTriggerType.CRON
    }
  ];
}
