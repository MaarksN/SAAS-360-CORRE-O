#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

import { buildEnv, projectRoot } from './shared.mjs';

const gates = [];
const rawMinimumScore = process.env.RELEASE_SCORECARD_MIN_SCORE ?? '100';
const minimumScore = Number.parseInt(rawMinimumScore, 10);

function gate(name, pass, detail){gates.push({name,pass,detail});}

function runNodeScript(relativePath) {
  return spawnSync(process.execPath, [relativePath], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: buildEnv(),
    stdio: 'pipe'
  });
}

try {
  const workspaceAudit = runNodeScript('scripts/ci/workspace-audit.mjs');
  gate(
    'Workspace audit',
    (workspaceAudit.status ?? 1) === 0,
    (workspaceAudit.status ?? 1) === 0 ? 'Workspace contract matches the canonical core lane' : 'Workspace audit failed'
  );

  const doctor = runNodeScript('scripts/ci/monorepo-doctor.mjs');
  gate(
    'Monorepo doctor',
    (doctor.status ?? 1) === 0,
    (doctor.status ?? 1) === 0 ? 'No critical findings in the canonical go-live scope' : 'Critical findings found'
  );
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  gate('Workspace audit',false,detail);
  gate('Monorepo doctor',false,detail);
}

const hasSecurityReport=fs.existsSync('docs/security/security-coverage-report.md');
gate('Security baseline report',hasSecurityReport, hasSecurityReport?'Report present':'Missing docs/security/security-coverage-report.md');

const hasMigrationsLock=fs.existsSync('packages/database/prisma/migrations/migration_lock.toml');
gate('Schema migration lock',hasMigrationsLock, hasMigrationsLock?'Prisma lock present':'Prisma migration lock missing');

const hasSloDoc=fs.existsSync('docs/OBSERVABILIDADE_E_SLOS.md');
gate('SLO baseline',hasSloDoc, hasSloDoc?'SLO documentation present':'Missing SLO document');

if (!Number.isInteger(minimumScore) || minimumScore < 0 || minimumScore > 100) {
  gate('Minimum score threshold', false, `Invalid RELEASE_SCORECARD_MIN_SCORE='${rawMinimumScore}' (expected integer 0-100)`);
}

const passedGates = gates.filter((g) => g.pass).length;
const totalGates = gates.length;
const score = totalGates === 0 ? 0 : Math.round((passedGates / totalGates) * 100);
const thresholdPass = score >= minimumScore;
gate(
  'Score threshold',
  thresholdPass,
  thresholdPass ? `Score ${score} meets minimum ${minimumScore}` : `Score ${score} is below minimum ${minimumScore}`
);

const md=[
  '# Release Scorecard',
  `Generated at: ${new Date().toISOString()}`,
  `Minimum score threshold: ${minimumScore}`,
  `Score: ${score}`,
  '',
  'Canonical go-live scope: `apps/web`, `apps/api`, `apps/worker`, `packages/database`.',
  'Legacy and satellite surfaces stay outside the 2026-03-20 launch gate unless promoted explicitly.',
  '',
  '| Gate | Status | Detail |',
  '| --- | --- | --- |'
];
for(const g of gates){md.push(`| ${g.name} | ${g.pass?'PASS':'FAIL'} | ${g.detail} |`);}

fs.mkdirSync('artifacts/release',{recursive:true});
const out='artifacts/release/scorecard.md';
fs.writeFileSync(out,md.join('\n'));
console.log(md.join('\n'));

if(gates.some((g)=>!g.pass)) process.exit(1);
