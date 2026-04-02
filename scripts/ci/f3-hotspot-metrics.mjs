import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const hotspots = [
  {
    afterPath: "apps/api/src/modules/analytics/service.ts",
    beforeLines: 500,
    id: "analytics-service"
  },
  {
    afterPath: "apps/api/src/modules/agents/service.ts",
    beforeLines: 850,
    id: "installed-agents-service"
  },
  {
    afterPath: "apps/worker/src/worker.ts",
    beforeLines: 826,
    id: "worker-bootstrap"
  },
  {
    afterPath: "apps/worker/src/agents/runtime.ts",
    beforeLines: 991,
    id: "agent-runtime"
  }
];

function countLines(filePath) {
  const content = readFileSync(filePath, "utf8").trimEnd();
  return content.length === 0 ? 0 : content.split(/\r?\n/).length;
}

const results = hotspots.map((hotspot) => {
  const afterLines = countLines(hotspot.afterPath);
  const delta = hotspot.beforeLines - afterLines;
  const reductionPct =
    hotspot.beforeLines > 0
      ? Number(((delta / hotspot.beforeLines) * 100).toFixed(2))
      : 0;

  return {
    ...hotspot,
    afterLines,
    deltaLines: delta,
    meetsLimit: afterLines <= 400,
    reductionPct
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  threshold: {
    maxLines: 400
  },
  hotspots: results
};

const writeIndex = process.argv.indexOf("--write");
if (writeIndex >= 0) {
  const outputPath = process.argv[writeIndex + 1];
  if (!outputPath) {
    throw new Error("Missing path after --write");
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
