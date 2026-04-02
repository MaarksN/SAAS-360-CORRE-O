#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.vps"
BACKUP_FILE=""
FORCE_FLAG=0

while (($# > 0)); do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --force)
      FORCE_FLAG=1
      shift
      ;;
    -*)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 [--env-file PATH] --force BACKUP_FILE" >&2
      exit 1
      ;;
    *)
      if [[ -n "$BACKUP_FILE" ]]; then
        echo "Only one backup file can be provided." >&2
        exit 1
      fi
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 [--env-file PATH] --force BACKUP_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Missing backup file: $BACKUP_FILE" >&2
  exit 1
fi

if [[ "$FORCE_FLAG" -ne 1 ]]; then
  echo "Refusing to restore without --force." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

DB_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  echo "DATABASE_URL or DIRECT_DATABASE_URL must be set." >&2
  exit 1
fi

ABS_BACKUP_FILE="$(cd "$(dirname "$BACKUP_FILE")" && pwd)/$(basename "$BACKUP_FILE")"

docker run --rm \
  -e DATABASE_URL="$DB_URL" \
  -v "$ABS_BACKUP_FILE:/restore/input.dump:ro" \
  postgres:16-alpine \
  sh -lc 'pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$DATABASE_URL" /restore/input.dump'

echo "Restore completed from $ABS_BACKUP_FILE"
