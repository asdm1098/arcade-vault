// PostToolUse (Write|Edit): Prettier + ESLint sobre el archivo creado/editado.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let filePath;
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!filePath) process.exit(0);

const root = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
const file = resolve(filePath);
const rel = relative(root, file);

if (rel.startsWith("..") || !existsSync(file)) process.exit(0);
const skip = ["node_modules", ".next", "references", ".playwright"];
if (rel.split(sep).some((p) => skip.some((s) => p.startsWith(s))))
  process.exit(0);

const run = (args) =>
  spawnSync(`pnpm exec ${args.join(" ")}`, {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });

const prettier = run(["prettier", "--write", "--ignore-unknown", `"${file}"`]);
let errors = prettier.status === 0 ? "" : prettier.stderr + prettier.stdout;

if (/\.(jsx?|tsx?|mjs|cjs)$/.test(file)) {
  const eslint = run(["eslint", "--fix", `"${file}"`]);
  if (eslint.status !== 0) errors += eslint.stdout + eslint.stderr;
}

if (errors.trim()) {
  console.error(`Format/lint issues en ${rel}:\n${errors}`);
  process.exit(2);
}
