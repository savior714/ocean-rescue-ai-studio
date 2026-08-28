import { cpSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = join(ROOT, "workspace");
const DIST = join(ROOT, "dist");

// Ensure workspace dependencies
if (!existsSync(join(WORKSPACE, "node_modules", ".bin", "vite"))) {
  execFileSync("npm", ["install", "--include=dev", "--no-package-lock", "--no-audit", "--no-fund", "--ignore-scripts", "--engine-strict=false"], {
    cwd: WORKSPACE,
    stdio: "inherit",
  });
}

// Run production build in workspace
execFileSync("npm", ["run", "build:production"], {
  cwd: WORKSPACE,
  stdio: "inherit",
});

// Populate root dist directory
mkdirSync(DIST, { recursive: true });
if (existsSync(join(WORKSPACE, "dist"))) {
  cpSync(join(WORKSPACE, "dist"), DIST, { recursive: true });
}
if (existsSync(join(WORKSPACE, "index.html"))) {
  cpSync(join(WORKSPACE, "index.html"), join(DIST, "index.html"));
}
