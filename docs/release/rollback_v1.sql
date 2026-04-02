BEGIN;
-- Rollback baseline for release_v1.0.0
-- 1. Stop workers and outbound integrations.
-- 2. Restore the latest physical backup before the cycle 5 migration window.
-- 3. Re-apply only the migrations required by the previous stable release.
-- 4. Rebuild plan/subscription snapshots from backup.
ROLLBACK;
