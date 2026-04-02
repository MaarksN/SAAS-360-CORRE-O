import type { DateRange } from "./analytics.types.js";

export function resolveDateRange(range?: Partial<DateRange>, fallbackDays = 30): DateRange {
  return {
    from: range?.from ?? new Date(Date.now() - fallbackDays * 24 * 60 * 60 * 1000),
    to: range?.to ?? new Date()
  };
}

export function uniqueTenantCount(values: string[]): number {
  return new Set(values).size;
}
