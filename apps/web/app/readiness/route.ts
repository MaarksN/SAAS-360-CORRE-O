import { incrementCounter, observeHistogram } from "@birthub/logger";
import { NextResponse } from "next/server";

import { evaluateWebOperationalHealth } from "../../lib/operational-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = performance.now();
  const payload = await evaluateWebOperationalHealth();
  const responseStatus = payload.status === "ok" ? 200 : 503;
  const durationMs = performance.now() - startedAt;

  incrementCounter(
    "birthub_web_healthcheck_requests_total",
    {
      endpoint: "readiness",
      status: payload.status
    },
    1,
    "Total web healthcheck requests grouped by endpoint and status."
  );
  observeHistogram(
    "birthub_web_healthcheck_duration_ms",
    durationMs,
    {
      endpoint: "readiness",
      status: payload.status
    },
    {
      help: "Web healthcheck latency in milliseconds grouped by endpoint and status."
    }
  );

  return NextResponse.json(payload, {
    headers: {
      "cache-control": "no-store"
    },
    status: responseStatus
  });
}
