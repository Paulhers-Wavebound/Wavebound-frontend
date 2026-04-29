import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const sourceUrl = new URL("../src/data/contentDashboardHelpers.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: "contentDashboardHelpers.ts",
  reportDiagnostics: true,
});

const errors = (output.diagnostics || []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
if (errors.length > 0) {
  throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  }));
}

const tmpFile = join(
  tmpdir(),
  `content-dashboard-helpers-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`,
);
await writeFile(tmpFile, output.outputText, "utf8");

try {
  const { getContentHealthMeta } = await import(pathToFileURL(tmpFile).href);
  const meta = getContentHealthMeta({
    posting_freq_7d: 0.5714285714,
    posting_freq_30d: 0.5333333333,
    posting_cadence: "daily",
    days_since_last_post: 2,
    performance_trend: "improving",
  });

  const separator = String.fromCharCode(0xb7);
  assertEqual(meta.status, "Inconsistent", "Max McNown status");
  assertEqual(meta.cadenceLabel, "0.6/wk", "Max McNown cadence label");
  assertEqual(meta.recencyLabel, "2d ago", "Max McNown recency label");
  assertEqual(
    meta.evidenceLabel,
    `0.6/wk ${separator} 2d ago`,
    "Max McNown evidence label",
  );
  assertEqual(meta.staleCadence, true, "Max McNown stale cadence flag");
  assertEqual(meta.staleCadenceLabel, "daily", "Max McNown stale cadence label");
  assertEqual(
    meta.numericCadenceLabel,
    "biweekly",
    "Max McNown numeric cadence label",
  );

  console.log("content health regression passed");
} finally {
  await rm(tmpFile, { force: true });
}
