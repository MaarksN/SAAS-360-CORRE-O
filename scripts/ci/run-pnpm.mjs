#!/usr/bin/env node
import { runPnpm } from './shared.mjs';

const args = process.argv.slice(2);

if (args.length === 0) {
  throw new Error('Usage: node scripts/ci/run-pnpm.mjs <pnpm args...>');
}

runPnpm(args);
