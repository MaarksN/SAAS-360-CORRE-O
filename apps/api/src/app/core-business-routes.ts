import type { ApiConfig } from "@birthub/config";
import type { z } from "zod";
import {
  createOrganizationRequestSchema,
  createOrganizationResponseSchema,
  taskEnqueuedResponseSchema,
  taskRequestSchema
} from "@birthub/config";
import { createLogger } from "@birthub/logger";
import type { Express } from "express";

import { requireAuthenticatedSession } from "../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../lib/problem-details.js";
import {
  enqueueTask,
  QueueBackpressureError,
  TenantQueueRateLimitError
} from "../lib/queue.js";
import { validateBody } from "../middleware/validate-body.js";
import { budgetService } from "../modules/budget/budget.service.js";
import { BudgetExceededError } from "../modules/budget/budget.types.js";
import { getBillingSnapshot } from "../modules/billing/index.js";
import { createOrganization } from "../modules/organizations/service.js";

const logger = createLogger("api");
type EnqueueTaskDependency = typeof enqueueTask;

export function registerCoreBusinessRoutes(
  app: Express,
  config: ApiConfig,
  dependencies: {
    enqueueTask?: EnqueueTaskDependency;
  } = {}
): void {
  const enqueueTaskDependency = dependencies.enqueueTask ?? enqueueTask;

  app.post(
    "/api/v1/organizations",
    validateBody(createOrganizationRequestSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as z.infer<typeof createOrganizationRequestSchema>;
      const organization = await createOrganization({
        adminEmail: body.adminEmail,
        adminName: body.adminName,
        adminPassword: body.adminPassword,
        name: body.name,
        requestId: request.context.requestId,
        ...(body.slug ? { slug: body.slug } : {})
      });

      request.context.organizationId = organization.organizationId;
      request.context.tenantId = organization.tenantId ?? null;
      request.context.userId = organization.ownerUserId;

      logger.info(
        {
          organizationId: organization.organizationId,
          requestId: request.context.requestId,
          tenantId: organization.tenantId,
          userId: organization.ownerUserId
        },
        "Provisioned organization"
      );

      response.status(201).json(createOrganizationResponseSchema.parse(organization));
    })
  );

  app.get(
    "/api/v1/me",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      if (!request.context.organizationId || !request.context.tenantId) {
        throw new ProblemDetailsError({
          detail: "Tenant context is required to resolve profile.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const billing = await getBillingSnapshot(
        request.context.organizationId,
        config.BILLING_GRACE_PERIOD_DAYS
      );

      response.status(200).json({
        plan: {
          code: billing.plan.code,
          creditBalanceCents: billing.creditBalanceCents,
          currentPeriodEnd: billing.currentPeriodEnd,
          hardLocked: billing.hardLocked,
          isPaid: billing.isPaid,
          isWithinGracePeriod: billing.isWithinGracePeriod,
          name: billing.plan.name,
          secondsUntilHardLock: billing.secondsUntilHardLock,
          status: billing.status
        },
        plan_status: {
          code: billing.plan.code,
          hardLocked: billing.hardLocked,
          isWithinGracePeriod: billing.isWithinGracePeriod,
          status: billing.status
        },
        requestId: request.context.requestId,
        user: {
          id: request.context.userId,
          tenantId: request.context.tenantId
        }
      });
    })
  );

  app.post(
    "/api/v1/tasks",
    requireAuthenticatedSession,
    validateBody(taskRequestSchema),
    asyncHandler(async (request, response) => {
      const body = request.body as z.infer<typeof taskRequestSchema>;
      const organizationId = request.context.organizationId;
      const tenantId = request.context.tenantId;
      const userId = request.context.userId;

      if (!organizationId || !tenantId || !userId) {
        throw new ProblemDetailsError({
          detail: "A valid authenticated session is required.",
          status: 401,
          title: "Unauthorized"
        });
      }

      try {
        await budgetService.consumeBudget({
          actorId: userId,
          agentId: body.agentId,
          costBRL: body.estimatedCostBRL,
          executionMode: body.executionMode,
          organizationId,
          requestId: request.context.requestId,
          tenantId
        });
      } catch (error) {
        if (error instanceof BudgetExceededError) {
          throw new ProblemDetailsError({
            detail: `Agent ${error.agentId} reached 100% budget usage and is blocked.`,
            status: 402,
            title: "Budget Exceeded"
          });
        }

        throw error;
      }

      let job: { jobId: string };
      try {
        job = await enqueueTaskDependency(config, {
          agentId: body.agentId,
          approvalRequired: body.approvalRequired,
          context: {
            actorId: userId,
            jobId: request.context.requestId,
            organizationId,
            scopedAt: new Date().toISOString(),
            tenantId
          },
          estimatedCostBRL: body.estimatedCostBRL,
          executionMode: body.executionMode,
          payload: body.payload,
          requestId: request.context.requestId,
          signature: Buffer.from(`${tenantId}:${request.context.requestId}`).toString("base64url"),
          tenantId,
          type: body.type,
          userId,
          version: "1"
        });
      } catch (error) {
        if (error instanceof TenantQueueRateLimitError) {
          throw new ProblemDetailsError({
            detail: `Tenant ${error.tenantId} exceeded the queue rate limit. Retry later.`,
            status: 429,
            title: "Too Many Requests"
          });
        }

        if (error instanceof QueueBackpressureError) {
          throw new ProblemDetailsError({
            detail: `Queue backlog reached ${error.pendingJobs} pending jobs. Retry later.`,
            status: 503,
            title: "Service Unavailable"
          });
        }

        throw error;
      }

      logger.info(
        {
          jobId: job.jobId,
          requestId: request.context.requestId,
          tenantId: request.context.tenantId,
          userId: request.context.userId
        },
        "Queued task for worker processing"
      );

      response.status(202).json(
        taskEnqueuedResponseSchema.parse({
          jobId: job.jobId,
          requestId: request.context.requestId
        })
      );
    })
  );
}
