#!/bin/bash

echo "Running Repository Health Diagnostics..."

echo "Checking for overly complex files..."
npx eslint --no-warn-ignored . || echo "ESLint found issues, please review."

echo "Checking Python package conventions..."
./scripts/ci/check_naming.sh || exit 1

echo "Checking dead exports (requires ts-prune if installed)..."
npx ts-prune -p tsconfig.json || true

echo "Repository Health Check Completed!"
