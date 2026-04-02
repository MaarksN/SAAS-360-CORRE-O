import { AsyncLocalStorage } from "node:async_hooks";

import { resolveDefaultQueryTimeout, type QueryBudgetCategory } from "../f8.config.js";

export interface QueryBudgetContext {
  category: QueryBudgetCategory;
  timeoutMs: number;
}

const DEFAULT_QUERY_BUDGET_CATEGORY: QueryBudgetCategory = "oltp";
const queryBudgetStorage = new AsyncLocalStorage<Readonly<QueryBudgetContext>>();

function parseTimeoutOverride(category: QueryBudgetCategory): number {
  const envKey = `PRISMA_QUERY_TIMEOUT_${category.toUpperCase()}_MS`;
  const rawValue = process.env[envKey];
  const value = Number(rawValue);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return resolveDefaultQueryTimeout(category);
}

export function getCurrentQueryBudget(): Readonly<QueryBudgetContext> {
  return (
    queryBudgetStorage.getStore() ?? {
      category: DEFAULT_QUERY_BUDGET_CATEGORY,
      timeoutMs: parseTimeoutOverride(DEFAULT_QUERY_BUDGET_CATEGORY)
    }
  );
}

export function resolveQueryTimeoutMs(category: QueryBudgetCategory): number {
  return parseTimeoutOverride(category);
}

export function runWithQueryBudget<T>(category: QueryBudgetCategory, callback: () => T): T {
  return queryBudgetStorage.run(
    Object.freeze({
      category,
      timeoutMs: resolveQueryTimeoutMs(category)
    }),
    callback
  );
}
