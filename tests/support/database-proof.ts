export function resolveDatabaseProofUrl(testLabel: string): string {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

  if (!databaseUrl && process.env.REQUIRE_DATABASE_PROOF === "1") {
    throw new Error(
      `[db-proof] ${testLabel} requires DATABASE_URL because REQUIRE_DATABASE_PROOF=1 was enabled for this lane.`
    );
  }

  return databaseUrl;
}
