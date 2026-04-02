import type { ApiConfig } from "@birthub/config";
import { getApiConfig } from "@birthub/config";
import express from "express";
import type { Express } from "express";

import {
  createDeepHealthService,
  createHealthService,
  createReadinessHealthService
} from "./lib/health.js";
import { enqueueTask } from "./lib/queue.js";
import {
  configureAppInfrastructure,
  registerGlobalErrorHandling,
  registerOperationalRoutes
} from "./app/core.js";
import { registerAuthAndCoreRoutes } from "./app/auth-and-core-routes.js";
import { mountModuleRouters } from "./app/module-routes.js";

export interface AppDependencies {
  config?: ApiConfig;
  deepHealthService?: ReturnType<typeof createDeepHealthService>;
  enqueueTask?: typeof enqueueTask;
  healthService?: ReturnType<typeof createHealthService>;
  readinessService?: ReturnType<typeof createReadinessHealthService>;
  shouldExposeDocs?: boolean;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const config = dependencies.config ?? getApiConfig();
  const shouldExposeDocs = dependencies.shouldExposeDocs ?? config.NODE_ENV !== "production";
  const app = express();

  configureAppInfrastructure(app, config);
  registerOperationalRoutes(app, config, {
    ...(dependencies.deepHealthService ? { deepHealthService: dependencies.deepHealthService } : {}),
    ...(dependencies.healthService ? { healthService: dependencies.healthService } : {}),
    ...(dependencies.readinessService ? { readinessService: dependencies.readinessService } : {}),
    shouldExposeDocs
  });
  registerAuthAndCoreRoutes(app, config, {
    ...(dependencies.enqueueTask ? { enqueueTask: dependencies.enqueueTask } : {})
  });
  mountModuleRouters(app, config);

  registerGlobalErrorHandling(app);

  return app;
}
