#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
NODE_IMAGE="${NODE_IMAGE:-node:22-bookworm-slim}"
ENV_FILE="$ROOT_DIR/.env.vps"
SKIP_MIGRATE=0

while (($# > 0)); do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --skip-migrate)
      SKIP_MIGRATE=1
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 [--env-file PATH] [--skip-migrate]" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required_vars=(
  APP_DOMAIN
  API_DOMAIN
  CADDY_EMAIL
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_API_URL
  API_CORS_ORIGINS
  DATABASE_URL
  REDIS_URL
  NEXTAUTH_SECRET
  SESSION_SECRET
  AUTH_MFA_ENCRYPTION_KEY
  JOB_HMAC_GLOBAL_SECRET
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
)

for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required variable: $key" >&2
    exit 1
  fi
done

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "==> Building application images"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build web api worker

if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
  echo "==> Applying Prisma migrations"
  docker run --rm \
    -e DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}" \
    -v "$ROOT_DIR:/repo" \
    -w /repo \
    "$NODE_IMAGE" \
    sh -lc "corepack enable && pnpm install --frozen-lockfile && pnpm --filter @birthub/database db:migrate:deploy"
else
  echo "==> Skipping Prisma migrations"
fi

echo "==> Starting services"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d caddy web api worker

echo "==> Waiting for health endpoints"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T web wget --no-verbose --tries=20 --waitretry=2 -O- http://localhost:3001/health >/dev/null
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T api wget --no-verbose --tries=20 --waitretry=2 -O- http://localhost:3000/health >/dev/null
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T worker wget --no-verbose --tries=20 --waitretry=2 -O- http://localhost:3002/health >/dev/null

echo "==> Stack status"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "Deploy finished."
echo "App URL: $NEXT_PUBLIC_APP_URL"
echo "API URL: $NEXT_PUBLIC_API_URL"
