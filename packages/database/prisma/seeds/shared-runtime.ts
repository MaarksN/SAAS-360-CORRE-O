import {
  AgentStatus,
  InviteStatus,
  MembershipStatus,
  Prisma,
  PrismaClient,
  Role,
  SessionStatus,
  WorkflowStatus,
  WorkflowStepType,
  WorkflowTransitionRoute,
  WorkflowTriggerType
} from "@prisma/client";

import { asJson, passwordHash, type TenantSeed } from "./shared-foundation.js";

type WorkflowSeed = {
  description: string;
  name: string;
  steps: Array<{
    config: Record<string, unknown>;
    isTrigger?: boolean;
    key: string;
    name: string;
    type: WorkflowStepType;
  }>;
  transitions: Array<{
    route: WorkflowTransitionRoute;
    sourceKey: string;
    targetKey: string;
  }>;
  triggerConfig: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
};

export async function ensureUsers(prisma: PrismaClient, tenant: TenantSeed, organizationId: string, tenantId: string) {
  const users = [] as Array<{ id: string; email: string }>;

  for (const [index, member] of tenant.members.entries()) {
    const user = await prisma.user.upsert({
      create: {
        email: member.email,
        name: member.name,
        passwordHash: passwordHash(member.email)
      },
      update: {
        name: member.name,
        passwordHash: passwordHash(member.email)
      },
      where: {
        email: member.email
      }
    });

    await prisma.membership.upsert({
      create: {
        organizationId,
        role: member.role,
        status: MembershipStatus.ACTIVE,
        tenantId,
        userId: user.id
      },
      update: {
        role: member.role,
        status: MembershipStatus.ACTIVE,
        tenantId
      },
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id
        }
      }
    });

    await prisma.session.upsert({
      create: {
        csrfToken: `${tenant.slug}-${index + 1}-csrf`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        organizationId,
        refreshExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        refreshTokenHash: passwordHash(`${tenant.slug}-${index + 1}-refresh`),
        status: SessionStatus.ACTIVE,
        tenantId,
        token: `${tenant.slug}-${index + 1}-session`,
        userId: user.id
      },
      update: {
        csrfToken: `${tenant.slug}-${index + 1}-csrf`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        organizationId,
        refreshExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        refreshTokenHash: passwordHash(`${tenant.slug}-${index + 1}-refresh`),
        status: SessionStatus.ACTIVE,
        tenantId,
        userId: user.id
      },
      where: {
        token: `${tenant.slug}-${index + 1}-session`
      }
    });

    await prisma.userPreference.upsert({
      create: {
        organizationId,
        tenantId,
        userId: user.id
      },
      update: {
        tenantId,
        updatedAt: new Date()
      },
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id
        }
      }
    });

    users.push({ id: user.id, email: user.email });
  }

  await prisma.invite.upsert({
    create: {
      email: `invite.${tenant.slug}@birthub.local`,
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
      invitedByUserId: users[0]?.id ?? null,
      organizationId,
      role: Role.MEMBER,
      status: InviteStatus.PENDING,
      tenantId,
      token: `${tenant.slug}-invite-token`
    },
    update: {
      invitedByUserId: users[0]?.id ?? null,
      organizationId,
      status: InviteStatus.PENDING,
      tenantId
    },
    where: {
      token: `${tenant.slug}-invite-token`
    }
  });

  return users;
}

export async function ensureAgents(prisma: PrismaClient, tenant: TenantSeed, organizationId: string, tenantId: string) {
  for (const [index, agentName] of tenant.agents.entries()) {
    await prisma.agent.upsert({
      create: {
        config: {
          channel: index === 0 ? "concierge" : index === 1 ? "growth" : "retention"
        },
        name: agentName,
        organizationId,
        status: AgentStatus.ACTIVE,
        tenantId
      },
      update: {
        config: {
          channel: index === 0 ? "concierge" : index === 1 ? "growth" : "retention"
        },
        organizationId,
        status: AgentStatus.ACTIVE
      },
      where: {
        tenantId_name: {
          name: agentName,
          tenantId
        }
      }
    });
  }
}

function buildWorkflowSeeds(tenantId: string): WorkflowSeed[] {
  return [
    {
      description: "Fluxo de onboarding com webhook e follow-up.",
      name: "Onboarding Workflow",
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
        }
      ],
      triggerConfig: {
        method: "POST",
        path: `/webhooks/trigger/${tenantId}/onboarding`
      },
      triggerType: WorkflowTriggerType.WEBHOOK
    },
    {
      description: "Fluxo diario de alerta operacional.",
      name: "Alert Workflow",
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
        }
      ],
      transitions: [
        {
          route: WorkflowTransitionRoute.ALWAYS,
          sourceKey: "trigger_cron",
          targetKey: "fetch_health"
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

export async function ensureWorkflows(prisma: PrismaClient, organizationId: string, tenantId: string) {
  for (const workflowSeed of buildWorkflowSeeds(tenantId)) {
    const workflow = await prisma.workflow.upsert({
      create: {
        definition: {
          nodes: workflowSeed.steps,
          transitions: workflowSeed.transitions
        } as Prisma.InputJsonValue,
        description: workflowSeed.description,
        name: workflowSeed.name,
        organizationId,
        publishedAt: new Date(),
        status: WorkflowStatus.PUBLISHED,
        tenantId,
        triggerConfig: asJson(workflowSeed.triggerConfig),
        triggerType: workflowSeed.triggerType
      },
      update: {
        definition: {
          nodes: workflowSeed.steps,
          transitions: workflowSeed.transitions
        } as Prisma.InputJsonValue,
        description: workflowSeed.description,
        organizationId,
        publishedAt: new Date(),
        status: WorkflowStatus.PUBLISHED,
        triggerConfig: asJson(workflowSeed.triggerConfig),
        triggerType: workflowSeed.triggerType
      },
      where: {
        tenantId_name: {
          name: workflowSeed.name,
          tenantId
        }
      }
    });

    await prisma.stepResult.deleteMany({ where: { workflowId: workflow.id } });
    await prisma.workflowTransition.deleteMany({ where: { workflowId: workflow.id } });
    await prisma.workflowStep.deleteMany({ where: { workflowId: workflow.id } });

    const stepIds = new Map<string, string>();

    for (const step of workflowSeed.steps) {
      const createdStep = await prisma.workflowStep.create({
        data: {
          config: asJson(step.config),
          isTrigger: step.isTrigger ?? false,
          key: step.key,
          name: step.name,
          organizationId,
          tenantId,
          type: step.type,
          workflowId: workflow.id
        }
      });
      stepIds.set(step.key, createdStep.id);
    }

    for (const transition of workflowSeed.transitions) {
      await prisma.workflowTransition.create({
        data: {
          organizationId,
          route: transition.route,
          sourceStepId: stepIds.get(transition.sourceKey)!,
          targetStepId: stepIds.get(transition.targetKey)!,
          tenantId,
          workflowId: workflow.id
        }
      });
    }
  }
}
