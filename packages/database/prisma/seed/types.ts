import type {
  Role,
  WorkflowStatus,
  WorkflowStepType,
  WorkflowTransitionRoute,
  WorkflowTriggerType
} from "@prisma/client";

export type PlanSeed = {
  code: string;
  currency: string;
  description: string;
  limits: Record<string, unknown>;
  monthlyPriceCents: number;
  name: string;
  stripePriceId: string;
  stripeProductId: string;
  yearlyPriceCents: number;
};

export type TenantSeed = {
  agents: string[];
  members: Array<{ email: string; name: string; role: Role }>;
  name: string;
  planCode: string;
  slug: string;
};

export type SeedWorkflowStep = {
  config: Record<string, unknown>;
  isTrigger?: boolean;
  key: string;
  name: string;
  type: WorkflowStepType;
};

export type SeedWorkflowTransition = {
  route: WorkflowTransitionRoute;
  sourceKey: string;
  targetKey: string;
};

export type SeedWorkflowDefinition = {
  cronExpression?: string;
  description: string;
  eventTopic?: string;
  name: string;
  status: WorkflowStatus;
  steps: SeedWorkflowStep[];
  transitions: SeedWorkflowTransition[];
  triggerConfig: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
  webhookSecret?: string;
};

export type SeededPlanMap = Map<string, { id: string; limits: Record<string, unknown> }>;
