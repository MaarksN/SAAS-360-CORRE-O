#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_DIR="${ROOT_DIR}/artifacts/release"
LOG_DIR="${ROOT_DIR}/logs/releases"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
LOG_FILE="${LOG_DIR}/cycle0-flow-${TIMESTAMP}.log"
SUMMARY_JSON="${ARTIFACT_DIR}/cycle0-flow-summary.json"
SUMMARY_TXT="${ARTIFACT_DIR}/cycle0-flow-summary.txt"

mkdir -p "${ARTIFACT_DIR}" "${LOG_DIR}"

run_step() {
  local label="$1"
  local command="$2"

  echo "[cycle0] START ${label}" | tee -a "${LOG_FILE}"
  if bash -lc "${command}" >>"${LOG_FILE}" 2>&1; then
    echo "[cycle0] PASS  ${label}" | tee -a "${LOG_FILE}"
    return 0
  fi

  echo "[cycle0] FAIL  ${label}" | tee -a "${LOG_FILE}"
  return 1
}

status="passed"
failed_step=""

run_step "pnpm install" "cd '${ROOT_DIR}' && pnpm install" || { status="failed"; failed_step="pnpm install"; }
if [[ "${status}" == "passed" ]]; then
  run_step "pnpm build" "cd '${ROOT_DIR}' && pnpm build" || { status="failed"; failed_step="pnpm build"; }
fi
if [[ "${status}" == "passed" ]]; then
  run_step "pnpm release:bundle" "cd '${ROOT_DIR}' && pnpm release:bundle" || { status="failed"; failed_step="pnpm release:bundle"; }
fi

cat >"${SUMMARY_JSON}" <<JSON
{
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "${status}",
  "failedStep": "${failed_step}",
  "logFile": "${LOG_FILE}"
}
JSON

{
  echo "cycle0_flow_status=${status}"
  echo "failed_step=${failed_step}"
  echo "log_file=${LOG_FILE}"
} >"${SUMMARY_TXT}"

if [[ "${status}" != "passed" ]]; then
  exit 1
fi
