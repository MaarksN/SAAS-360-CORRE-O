#!/usr/bin/env node
import { access, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const clientPkgJson = require.resolve('@prisma/client/package.json');
const runtimeDir = path.join(path.dirname(clientPkgJson), 'runtime');

const targets = [
  'cockroachdb',
  'mysql',
  'postgresql',
  'sqlite',
  'sqlserver'
];

async function ensureAlias(sourceName, targetName) {
  const source = path.join(runtimeDir, sourceName);
  const target = path.join(runtimeDir, targetName);

  try {
    await access(target);
    return false;
  } catch {
    await copyFile(source, target);
    return true;
  }
}

let created = 0;
for (const dialect of targets) {
  if (await ensureAlias(`query_compiler_bg.${dialect}.js`, `query_compiler_fast_bg.${dialect}.js`)) {
    created += 1;
  }
  if (await ensureAlias(`query_compiler_bg.${dialect}.mjs`, `query_compiler_fast_bg.${dialect}.mjs`)) {
    created += 1;
  }
  if (
    await ensureAlias(
      `query_compiler_bg.${dialect}.wasm-base64.js`,
      `query_compiler_fast_bg.${dialect}.wasm-base64.js`
    )
  ) {
    created += 1;
  }
  if (
    await ensureAlias(
      `query_compiler_bg.${dialect}.wasm-base64.mjs`,
      `query_compiler_fast_bg.${dialect}.wasm-base64.mjs`
    )
  ) {
    created += 1;
  }
}

process.stdout.write(`[prisma-runtime-compat] runtime aliases ensured (created=${created})\n`);
