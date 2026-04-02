import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const scriptsLibDir = dirname(currentFile);

export const databasePackageRoot = resolve(scriptsLibDir, "..", "..");
export const workspaceRoot = resolve(databasePackageRoot, "..", "..");
export const artifactsRoot = resolve(workspaceRoot, "artifacts", "database");
export const docsRoot = resolve(databasePackageRoot, "docs");
export const prismaRoot = resolve(databasePackageRoot, "prisma");
export const schemaPath = resolve(prismaRoot, "schema.prisma");
export const migrationsDir = resolve(prismaRoot, "migrations");
export const migrationRegistryPath = resolve(prismaRoot, "migration-registry.json");
