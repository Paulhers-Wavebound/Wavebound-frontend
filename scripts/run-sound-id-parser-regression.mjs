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

const sourceUrl = new URL("../src/utils/soundIdParser.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: "soundIdParser.ts",
  reportDiagnostics: true,
});

const errors = (output.diagnostics || []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
if (errors.length > 0) {
  throw new Error(
    ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    }),
  );
}

const tmpFile = join(
  tmpdir(),
  `sound-id-parser-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`,
);
await writeFile(tmpFile, output.outputText, "utf8");

try {
  const { extractSoundId } = await import(pathToFileURL(tmpFile).href);
  const cases = [
    [
      "https://www.tiktok.com/music/Dance-No-More-7613798254214055937",
      "7613798254214055937",
      "named music URL",
    ],
    [
      "https://www.tiktok.com/music/7613798254214055937",
      "7613798254214055937",
      "bare music URL",
    ],
    [
      "https://www.tiktok.com/music/-7613798254214055937",
      "7613798254214055937",
      "stored dash music URL",
    ],
    [
      "https://www.tiktok.com/@artist/video/7613798254214055937",
      null,
      "video URL is not a sound URL",
    ],
  ];

  for (const [input, expected, label] of cases) {
    assertEqual(extractSoundId(input), expected, label);
  }

  console.log("sound id parser regression passed");
} finally {
  await rm(tmpFile, { force: true });
}
