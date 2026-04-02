import { renderPrometheusMetrics } from "@birthub/logger";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(renderPrometheusMetrics(), {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; version=0.0.4"
    },
    status: 200
  });
}
