#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

import { buildEnv, projectRoot } from './shared.mjs';

const critical=[];
const warnings=[];

function trackedFiles(){
  try {
    const output = execSync('git ls-files', {
      cwd: projectRoot,
      encoding: 'utf8',
      env: buildEnv()
    }).trim();
    return {
      files: output ? output.split('\n').filter(Boolean) : [],
      source: 'git'
    };
  } catch {
    warnings.push(
      'git ls-files was unavailable; monorepo doctor fell back to a filesystem scan and skipped tracked-artifact enforcement.'
    );
    return {
      files: walkWorkspaceFiles(),
      source: 'filesystem'
    };
  }
}

function walkWorkspaceFiles(){
  const ignoredDirectories = new Set([
    '.git',
    '.next',
    '.nuxt',
    '.pytest_cache',
    '.turbo',
    'artifacts',
    'coverage',
    'dist',
    'node_modules',
    'playwright-report',
    'test-results',
    '__pycache__'
  ]);
  const roots = ['agents', 'apps', 'docs', 'infra', 'packages', 'scripts', 'tests'];
  const files = [];
  const queue = roots
    .map((entry) => path.join(projectRoot, entry))
    .filter((entry) => fs.existsSync(entry));

  while(queue.length){
    const current = queue.pop();
    for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      const fullPath = path.join(current, entry.name);
      if(entry.isDirectory()){
        if(!ignoredDirectories.has(entry.name)){
          queue.push(fullPath);
        }
        continue;
      }
      files.push(path.relative(projectRoot, fullPath).replaceAll('\\','/'));
    }
  }

  return files;
}

function readWorkspaceContract(){
  const contractPath = path.join(projectRoot, 'scripts', 'ci', 'workspace-contract.json');
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

function isWithinAllowedRoots(file, allowedRoots){
  return allowedRoots.some((allowedRoot) => file === allowedRoot || file.startsWith(`${allowedRoot}/`));
}

const tracked=trackedFiles();
const files=tracked.files.filter((file) => fs.existsSync(path.join(projectRoot, file)));
const workspaceContract = readWorkspaceContract();

function getAllowedDuplicateDirectoryMap(contract){
  const allowedByBase = new Map();
  const conflicts = Array.isArray(contract?.conflicts) ? contract.conflicts : [];

  for(const conflict of conflicts){
    const requiredPath = conflict?.requiredPath;
    if(typeof requiredPath !== 'string') continue;

    const segments = requiredPath.replaceAll('\\','/').split('/').filter(Boolean);
    if(segments.length < 2) continue;

    const [base, dirName] = segments;
    if(!base || !dirName) continue;

    const key = dirName.toLowerCase().replace(/[-_]/g,'');
    if(!allowedByBase.has(base)){
      allowedByBase.set(base, new Map());
    }

    const byKey = allowedByBase.get(base);
    if(!byKey.has(key)){
      byKey.set(key, new Set());
    }
    byKey.get(key).add(dirName);
  }

  return allowedByBase;
}

const allowedDuplicateDirs = getAllowedDuplicateDirectoryMap(workspaceContract);

const legacyImportRule = workspaceContract.importRules.find((rule) => rule.packageName === '@birthub/db');
const legacyImports=files.filter((f)=>/^(apps|packages)\//.test(f) && /\.(ts|tsx|js|mjs|cjs)$/.test(f)).flatMap((f)=>{
  const c=fs.readFileSync(path.join(projectRoot, f),'utf8');
  return c.includes('@birthub/db')?[f]:[];
});
const legacyImportViolations = legacyImports.filter(
  (file) => !legacyImportRule || !isWithinAllowedRoots(file, legacyImportRule.allowedRoots)
);
const legacyImportQuarantine = legacyImports.filter(
  (file) => legacyImportRule && isWithinAllowedRoots(file, legacyImportRule.allowedRoots)
);
if(legacyImportViolations.length) {
  critical.push(`Forbidden @birthub/db imports found outside the legacy quarantine: ${legacyImportViolations.join(', ')}`);
}
if(legacyImportQuarantine.length) {
  warnings.push(`Legacy quarantine still active for @birthub/db in: ${legacyImportQuarantine.join(', ')}`);
}

if(tracked.source === 'git'){
  const generated=files.filter((f)=>
    fs.existsSync(path.join(projectRoot, f)) &&
    (f.endsWith('.tsbuildinfo') || (f.endsWith('.js') && files.includes(f.replace(/\.js$/,'.ts'))))
  );
  if(generated.length) critical.push(`Generated artifacts tracked: ${generated.join(', ')}`);
}

const pkgFiles=files.filter((f)=>/^apps\/[^/]+\/package\.json$/.test(f));
const ports=new Map();
for(const pf of pkgFiles){
  const pkg=JSON.parse(fs.readFileSync(path.join(projectRoot, pf),'utf8'));
  const dev=pkg.scripts?.dev;
  const m=typeof dev==='string'?dev.match(/-p\s*(\d+)/):null;
  if(m){
    const port=m[1];
    const app=pf.split('/')[1];
    ports.set(port,[...(ports.get(port)||[]),app]);
  }
}
for(const [port,apps] of ports){
  if(apps.length>1) critical.push(`Local port collision ${port}: ${apps.join(', ')}`);
}

const dirCandidates=['agents','docs'];
for(const base of dirCandidates){
  const absoluteBase = path.join(projectRoot, base);
  if(!fs.existsSync(absoluteBase)) continue;
  const entries=fs.readdirSync(absoluteBase,{withFileTypes:true}).filter((d)=>d.isDirectory()).map((d)=>d.name);
  const map=new Map();
  for(const e of entries){
    const key=e.toLowerCase().replace(/[-_]/g,'');
    map.set(key,[...(map.get(key)||[]),e]);
  }
  for(const [k,v] of map){
    if(v.length<=1) continue;

    const allowedForBase = allowedDuplicateDirs.get(base);
    const allowedNames = allowedForBase?.get(k);
    const isAllowedDuplicate = Boolean(
      allowedNames &&
      allowedNames.size > 1 &&
      v.every((name)=>allowedNames.has(name))
    );

    if(!isAllowedDuplicate){
      warnings.push(`Potential duplicate directories in ${base} (${k}): ${v.join(', ')}`);
    }
  }
}

const report = [
  '# Monorepo Doctor Report',
  '',
  `Generated at: ${new Date().toISOString()}`,
  'Scope: canonical go-live gate = apps/web + apps/api + apps/worker + packages/database',
  '',
  '## Critical findings',
  ...(critical.length?critical.map((x)=>`- ${x}`):['- none']),
  '',
  '## Warnings',
  ...(warnings.length?warnings.map((x)=>`- ${x}`):['- none'])
].join('\n');

fs.mkdirSync('artifacts/doctor',{recursive:true});
fs.writeFileSync('artifacts/doctor/monorepo-doctor-report.md',report);
console.log(report);

if(critical.length){
  process.exit(1);
}
