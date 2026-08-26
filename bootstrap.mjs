import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SOURCE_REPO = "https://github.com/savior714/game.git";
const SOURCE_BASE = "f984670efa538aa679f65bea729f03dafec5fa66";
const TEMP = join(ROOT, ".canonical-tmp");
const WORKSPACE = join(ROOT, "workspace");
const REFERENCE = join(ROOT, "reference");
const BASE_MARKER = join(WORKSPACE, ".source-base");

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    ...options,
  });
}

function currentWorkspaceMatches() {
  if (!existsSync(BASE_MARKER)) return false;
  return readFileSync(BASE_MARKER, "utf8").trim() === SOURCE_BASE;
}

function materializeCanonicalSource() {
  if (currentWorkspaceMatches()) return;

  rmSync(TEMP, { recursive: true, force: true });
  rmSync(WORKSPACE, { recursive: true, force: true });
  rmSync(REFERENCE, { recursive: true, force: true });
  mkdirSync(TEMP, { recursive: true });

  run("git", ["init", "--quiet", TEMP]);
  run("git", ["-C", TEMP, "remote", "add", "origin", SOURCE_REPO]);
  run("git", ["-C", TEMP, "config", "core.sparseCheckout", "true"]);
  mkdirSync(join(TEMP, ".git", "info"), { recursive: true });
  writeFileSync(
    join(TEMP, ".git", "info", "sparse-checkout"),
    [
      "/domains/ocean-rescue/",
      "/docs/specs/product/AIDENGAME_OCEAN_RESCUE_MVP_PRD.md",
      "/docs/specs/technical/AIDENGAME_OCEAN_RESCUE_DEVELOPMENT_ARCHITECTURE.md",
      "/AGENTS.md",
      "",
    ].join("\n"),
    "utf8",
  );
  run("git", [
    "-C",
    TEMP,
    "-c",
    "protocol.version=2",
    "fetch",
    "--quiet",
    "--depth=1",
    "--filter=blob:none",
    "origin",
    SOURCE_BASE,
  ]);
  run("git", ["-C", TEMP, "checkout", "--quiet", "--detach", "FETCH_HEAD"]);

  cpSync(join(TEMP, "domains", "ocean-rescue"), WORKSPACE, { recursive: true });
  mkdirSync(join(REFERENCE, "docs", "product"), { recursive: true });
  mkdirSync(join(REFERENCE, "docs", "technical"), { recursive: true });
  cpSync(
    join(TEMP, "docs", "specs", "product", "AIDENGAME_OCEAN_RESCUE_MVP_PRD.md"),
    join(REFERENCE, "docs", "product", "AIDENGAME_OCEAN_RESCUE_MVP_PRD.md"),
  );
  cpSync(
    join(TEMP, "docs", "specs", "technical", "AIDENGAME_OCEAN_RESCUE_DEVELOPMENT_ARCHITECTURE.md"),
    join(REFERENCE, "docs", "technical", "AIDENGAME_OCEAN_RESCUE_DEVELOPMENT_ARCHITECTURE.md"),
  );
  cpSync(join(TEMP, "AGENTS.md"), join(REFERENCE, "AGENTS.md"));
  writeFileSync(BASE_MARKER, `${SOURCE_BASE}\n`, "utf8");
  rmSync(TEMP, { recursive: true, force: true });
}

function ensureDependencies() {
  const viteBin = join(WORKSPACE, "node_modules", ".bin", "vite");
  if (existsSync(viteBin)) return viteBin;
  run(
    "npm",
    ["install", "--no-package-lock", "--no-audit", "--no-fund", "--ignore-scripts"],
    { cwd: WORKSPACE },
  );
  return viteBin;
}

materializeCanonicalSource();
const viteBin = ensureDependencies();

console.log(`Ocean Rescue AI Studio workspace materialized from ${SOURCE_BASE}`);
console.log("Editable game root: workspace/");
console.log("Read-only product/architecture references: reference/");

const child = spawn(
  viteBin,
  ["--config", "vite.config.ts", "--host", "0.0.0.0", "--port", "5173", "--strictPort"],
  {
    cwd: WORKSPACE,
    stdio: "inherit",
    env: process.env,
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
