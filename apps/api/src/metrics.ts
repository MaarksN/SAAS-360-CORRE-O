import { performance } from "node:perf_hooks";

import { prisma } from "@birthub/database";
import {
  incrementCounter,
  observeHistogram,
  renderPrometheusMetrics,
  setActiveSpanAttributes,
  setGauge
} from "@birthub/logger";
import type { NextFunction, Request, Response } from "express";

export function recordTenantJobMetric(
  tenantId: string,
  jobName: string,
  status = "accepted"
): void {
  incrementCounter(
    "birthub_tenant_jobs_total",
    {
      job_name: jobName,
      status,
      tenant_id: tenantId
    },
    1,
    "Total worker jobs grouped by tenant, job name and status."
  );
}

export function setTenantStorageMetric(tenantId: string, bytes: number): void {
  setGauge(
    "birthub_tenant_storage_bytes",
    bytes,
    { tenant_id: tenantId },
    "Current storage footprint estimate grouped by tenant."
  );
}

export function recordBillingProcessedMetric(input: {
  amountCents: number;
  currency?: string;
  source?: string;
  status?: string;
}): void {
  incrementCounter(
    "birthub_billing_events_total",
    {
      currency: input.currency ?? "unknown",
      source: input.source ?? "billing",
      status: input.status ?? "processed"
    },
    1,
    "Total processed billing events grouped by source and status."
  );
  incrementCounter(
    "birthub_billing_processed_cents_total",
    {
      currency: input.currency ?? "unknown",
      source: input.source ?? "billing"
    },
    Math.max(0, Math.round(input.amountCents)),
    "Total billing volume processed in cents."
  );
}

export function recordWebVitalMetric(input: {
  name: "CLS" | "FCP" | "INP" | "LCP" | "TTFB";
  path: string;
  rating?: string;
  value: number;
}): void {
  const labels = {
    name: input.name,
    path: input.path,
    rating: input.rating ?? "unknown"
  };

  if (input.name === "CLS") {
    setGauge(
      "birthub_web_vital_score",
      input.value,
      labels,
      "Current Web Vital score-style metrics grouped by route and rating."
    );
    return;
  }

  observeHistogram(
    "birthub_web_vital_ms",
    input.value,
    labels,
    {
      help: "Web Vital latency metrics in milliseconds grouped by route and rating."
    }
  );
}

function resolveRoutePath(request: Request): string {
  const route = request.route as { path?: string } | undefined;
  return route?.path ?? request.path;
}

async function refreshBusinessMetrics(): Promise<void> {
  const [activeTenants, agentsRunning, paidInvoices, paidInvoiceCount] = await Promise.all([
    prisma.organization.count(),
    prisma.agentExecution.count({
      where: {
        status: "RUNNING"
      }
    }),
    prisma.invoice.aggregate({
      _sum: {
        amountPaidCents: true
      }
    }),
    prisma.invoice.count({
      where: {
        status: "paid"
      }
    })
  ]);

  setGauge(
    "birthub_business_active_tenants",
    activeTenants,
    {},
    "Current number of active tenants."
  );
  setGauge(
    "birthub_business_agents_running",
    agentsRunning,
    {},
    "Current number of running agent executions."
  );
  setGauge(
    "birthub_business_billing_processed_cents",
    paidInvoices._sum.amountPaidCents ?? 0,
    {},
    "Current cumulative billing volume marked as paid."
  );
  setGauge(
    "birthub_business_paid_invoices_total",
    paidInvoiceCount,
    {},
    "Current number of paid invoices."
  );
}

export function metricsMiddleware(request: Request, response: Response, next: NextFunction): void {
  const startedAt = performance.now();

  response.on("finish", () => {
    const durationMs = performance.now() - startedAt;
    const route = resolveRoutePath(request);
    const tenantId = request.context?.tenantId ?? "anonymous";

    incrementCounter(
      "birthub_http_requests_total",
      {
        method: request.method,
        route,
        status: String(response.statusCode),
        tenant_id: tenantId
      },
      1,
      "Total HTTP requests grouped by method, route, status and tenant."
    );
    observeHistogram(
      "birthub_http_request_duration_ms",
      durationMs,
      {
        method: request.method,
        route,
        status: String(response.statusCode)
      },
      {
        help: "HTTP request latency in milliseconds grouped by method, route and status."
      }
    );

    if (response.statusCode >= 400) {
      incrementCounter(
        "birthub_http_request_errors_total",
        {
          method: request.method,
          route,
          status: String(response.statusCode)
        },
        1,
        "Total HTTP request errors grouped by method, route and status."
      );
    }

    setActiveSpanAttributes({
      "birthub.http.route": route,
      "birthub.http.status_code": response.statusCode,
      "birthub.tenant.id": tenantId
    });
  });

  next();
}

export async function metricsHandler(_request: Request, response: Response): Promise<void> {
  await refreshBusinessMetrics();
  response.type("text/plain; version=0.0.4").send(renderPrometheusMetrics());
}
