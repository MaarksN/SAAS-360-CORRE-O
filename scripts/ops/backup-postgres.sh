#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.vps"
OUTPUT_DIR="$ROOT_DIR/artifacts/backups"
BACKUP_NAME="postgres-$(date -u +%Y%m%dT%H%M%SZ).dump"

while (($# > 0)); do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --name)
      BACKUP_NAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 [--env-file PATH] [--output-dir PATH] [--name FILE]" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

DB_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  echo "DATABASE_URL or DIRECT_DATABASE_URL must be set." >&2
  exit 1
fi

docker run --rm \
  -e DATABASE_URL="$DB_URL" \
  -e BACKUP_NAME="$BACKUP_NAME" \
  -v "$OUTPUT_DIR:/backup" \
  postgres:16-alpine \
  sh -lc 'pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file "/backup/$BACKUP_NAME"'

echo "Backup written to $OUTPUT_DIR/$BACKUP_NAME"
