import type { ApiConfig } from "@birthub/config";
import type { Express } from "express";

import { registerAuthRoutes } from "./auth-routes.js";
import { registerCoreBusinessRoutes } from "./core-business-routes.js";
import { enqueueTask } from "../lib/queue.js";

export function registerAuthAndCoreRoutes(
  app: Express,
  config: ApiConfig,
  dependencies: {
    enqueueTask?: typeof enqueueTask;
  } = {}
): void {
  registerAuthRoutes(app, config);
  registerCoreBusinessRoutes(app, config, dependencies);
}
