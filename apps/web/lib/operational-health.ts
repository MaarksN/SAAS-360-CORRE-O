import { getWebConfig, type WebConfig } from "@birthub/config";

type DependencyStatus = "up" | "down";

export interface WebDependencyCheck {
  name: string;
  mandatory: boolean;
  status: DependencyStatus;
  url: string;
  latencyMs?: number;
  httpStatus?: number;
  message?: string;
}

export interface WebOperationalHealth {
  checkedAt: string;
  service: "web";
  status: "ok" | "degraded";
  dependencies: WebDependencyCheck[];
}

function buildMandatoryDependencies(config: WebConfig): Array<{ name: string; url: string }> {
  return [{ name: "api", url: `${config.NEXT_PUBLIC_API_URL}/api/v1/health` }];
}

export async function evaluateWebOperationalHealth(input?: {
  config?: WebConfig;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<WebOperationalHealth> {
  const config = input?.config ?? getWebConfig();
  const timeoutMs = input?.timeoutMs ?? 1500;
  const fetchImpl = input?.fetchImpl ?? fetch;
  const dependencies = buildMandatoryDependencies(config);

  const checks = await Promise.all(
    dependencies.map(async (dependency): Promise<WebDependencyCheck> => {
      const startedAt = performance.now();

      try {
        const response = await fetchImpl(dependency.url, {
          cache: "no-store",
          signal: AbortSignal.timeout(timeoutMs)
        });

        return {
          httpStatus: response.status,
          latencyMs: Math.round(performance.now() - startedAt),
          mandatory: true,
          name: dependency.name,
          status: response.ok ? "up" : "down",
          url: dependency.url,
          ...(response.ok
            ? {}
            : {
                message: `Dependency responded with non-success status code ${response.status}.`
              })
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown dependency error";
        return {
          latencyMs: Math.round(performance.now() - startedAt),
          mandatory: true,
          message,
          name: dependency.name,
          status: "down",
          url: dependency.url
        };
      }
    })
  );

  const isHealthy = checks.every((dependency) => !dependency.mandatory || dependency.status === "up");

  return {
    checkedAt: new Date().toISOString(),
    dependencies: checks,
    service: "web",
    status: isHealthy ? "ok" : "degraded"
  };
}
