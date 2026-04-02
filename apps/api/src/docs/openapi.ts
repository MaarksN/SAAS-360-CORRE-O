import type { OpenApiRouteCatalogEntry } from "./openapi.catalog.js";
import { openApiRouteCatalog, openApiTags } from "./openapi.catalog.js";

type SecurityRequirement = Record<string, string[]>;

interface OpenApiOperationObject {
  operationId: string;
  responses: Record<string, { description: string }>;
  security?: SecurityRequirement[];
  summary: string;
  tags: string[];
}

type OpenApiPathItemObject = Partial<
  Record<OpenApiRouteCatalogEntry["method"], OpenApiOperationObject>
>;

function toOperationId(entry: OpenApiRouteCatalogEntry): string {
  return `${entry.method}_${entry.path}`
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function toResponseDescription(entry: OpenApiRouteCatalogEntry): string {
  if (entry.successStatus === "201") {
    return `${entry.summary} completed and created a resource.`;
  }

  if (entry.successStatus === "202") {
    return `${entry.summary} completed asynchronously.`;
  }

  if (entry.successStatus === "204") {
    return `${entry.summary} completed without returning a body.`;
  }

  return `${entry.summary} completed successfully.`;
}

function buildPathItem(entry: OpenApiRouteCatalogEntry): OpenApiOperationObject {
  return {
    operationId: toOperationId(entry),
    responses: {
      [entry.successStatus]: {
        description: toResponseDescription(entry)
      }
    },
    ...(entry.secured
      ? {
          security: [{ sessionCookieAuth: [] }, { apiKeyAuth: [] }]
        }
      : {}),
    summary: entry.summary,
    tags: [entry.tag]
  };
}

function buildPaths(): Record<string, OpenApiPathItemObject> {
  const paths: Record<string, OpenApiPathItemObject> = {};

  for (const entry of openApiRouteCatalog) {
    const pathItem = paths[entry.path] ?? {};
    pathItem[entry.method] = buildPathItem(entry);
    paths[entry.path] = pathItem;
  }

  return paths;
}

export const openApiDocument = {
  components: {
    securitySchemes: {
      apiKeyAuth: {
        in: "header",
        name: "x-api-key",
        type: "apiKey"
      },
      sessionCookieAuth: {
        in: "cookie",
        name: "bh360_session",
        type: "apiKey"
      }
    }
  },
  info: {
    description:
      "Canonical BirthHub 360 API inventory. Coverage is generated from the maintained route catalog and guarded by automated drift tests.",
    title: "BirthHub360 API",
    version: "1.0.0"
  },
  openapi: "3.0.0",
  paths: buildPaths(),
  servers: [
    {
      url: "http://localhost:3000"
    }
  ],
  tags: openApiTags
} as const;
