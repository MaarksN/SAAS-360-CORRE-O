#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { capturePnpm } from '../ci/shared.mjs';

const root = process.cwd();
const outputDir = path.join(root, 'artifacts', 'sbom');
const outputFile = path.join(outputDir, 'bom.xml');
const spdxOutputFile = path.join(outputDir, 'sbom.spdx.json');

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function execPnpm(args) {
  const result = capturePnpm(args, { cwd: root });

  if ((result.status ?? 1) !== 0) {
    throw new Error(result.stderr || result.stdout || `pnpm ${args.join(' ')} failed`);
  }

  return result.stdout;
}

await mkdir(outputDir, { recursive: true });

const listOutput = execPnpm(['ls', '-r', '--depth', '0', '--json']);
const projects = JSON.parse(listOutput);
const componentMap = new Map();

for (const project of projects) {
  const dependencies = {
    ...project.dependencies,
    ...project.devDependencies,
    ...project.optionalDependencies
  };

  for (const [name, dep] of Object.entries(dependencies ?? {})) {
    const version = dep.version ?? dep.path?.split('@').at(-1) ?? '0.0.0-unknown';
    const purl = `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`;
    const key = `${name}@${version}`;
    componentMap.set(key, { name, version, purl });
  }
}

const metadataHash = createHash('sha256')
  .update(JSON.stringify([...componentMap.values()].map((item) => `${item.name}@${item.version}`)))
  .digest('hex');
const serialUuid = `${metadataHash.slice(0, 8)}-${metadataHash.slice(8, 12)}-${metadataHash.slice(12, 16)}-${metadataHash.slice(16, 20)}-${metadataHash.slice(20, 32)}`;

const componentsXml = [...componentMap.values()]
  .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
  .map(
    (component) =>
      `    <component type="library" bom-ref="${escapeXml(component.purl)}">\n` +
      `      <name>${escapeXml(component.name)}</name>\n` +
      `      <version>${escapeXml(component.version)}</version>\n` +
      `      <purl>${escapeXml(component.purl)}</purl>\n` +
      '    </component>'
  )
  .join('\n');

const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH;
const bomTimestamp = sourceDateEpoch
  ? new Date(Number(sourceDateEpoch) * 1000).toISOString()
  : new Date().toISOString();

const bom = `<?xml version="1.0" encoding="UTF-8"?>
<bom xmlns="http://cyclonedx.org/schema/bom/1.5" serialNumber="urn:uuid:${serialUuid}" version="1">
  <metadata>
    <timestamp>${bomTimestamp}</timestamp>
    <tools>
      <tool>
        <vendor>BirthHub</vendor>
        <name>release-sbom-generator</name>
        <version>1.0.0</version>
      </tool>
    </tools>
    <component type="application" bom-ref="pkg:npm/birthub-360@1.0.0">
      <name>birthub-360</name>
      <version>1.0.0</version>
      <purl>pkg:npm/birthub-360@1.0.0</purl>
    </component>
  </metadata>
  <components>
${componentsXml}
  </components>
</bom>
`;

await writeFile(outputFile, bom, 'utf8');

const sourceDateEpochForSpdx = process.env.SOURCE_DATE_EPOCH;
const spdxCreated = sourceDateEpochForSpdx
  ? new Date(Number(sourceDateEpochForSpdx) * 1000).toISOString()
  : new Date().toISOString();

const spdxDocument = {
  SPDXID: 'SPDXRef-DOCUMENT',
  spdxVersion: 'SPDX-2.3',
  name: 'birthub-360',
  dataLicense: 'CC0-1.0',
  documentNamespace: `https://birthub.local/spdx/${serialUuid}`,
  creationInfo: {
    created: spdxCreated,
    creators: ['Tool: release-sbom-generator@1.0.0']
  },
  documentDescribes: ['SPDXRef-Package-birthub-360'],
  packages: [
    {
      SPDXID: 'SPDXRef-Package-birthub-360',
      name: 'birthub-360',
      versionInfo: '1.0.0',
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      supplier: 'Organization: BirthHub',
      externalRefs: [
        {
          referenceCategory: 'PACKAGE-MANAGER',
          referenceType: 'purl',
          referenceLocator: 'pkg:npm/birthub-360@1.0.0'
        }
      ]
    },
    ...[...componentMap.values()]
      .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
      .map((component) => ({
        SPDXID: `SPDXRef-Package-${createHash('sha256')
          .update(`${component.name}@${component.version}`)
          .digest('hex')
          .slice(0, 16)}`,
        name: component.name,
        versionInfo: component.version,
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        supplier: 'NOASSERTION',
        externalRefs: [
          {
            referenceCategory: 'PACKAGE-MANAGER',
            referenceType: 'purl',
            referenceLocator: component.purl
          }
        ]
      }))
  ]
};

await writeFile(spdxOutputFile, `${JSON.stringify(spdxDocument, null, 2)}\n`, 'utf8');
process.stdout.write(
  `SBOM generated at ${path.relative(root, outputFile)} and ${path.relative(root, spdxOutputFile)} with ${componentMap.size} components.\n`
);
