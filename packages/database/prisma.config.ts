import { defineConfig } from "prisma/config";

const nodeEnv = process.env.NODE_ENV ?? "development";
const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/birthub?schema=public";

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const isDevOrTest = nodeEnv === "development" || nodeEnv === "test";

  if (isDevOrTest) {
    // Default to a local database only in development or test environments.
    process.env.DATABASE_URL = fallbackDatabaseUrl;
    return fallbackDatabaseUrl;
  }

  throw new Error(
    "DATABASE_URL environment variable must be set for Prisma in non-development environments."
  );
}

const databaseUrl = resolveDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: databaseUrl
  }
});
