import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = join(ROOT, "workspace");
const DIST = join(ROOT, "dist");

const { build } = await import("vite");

await build({
  root: WORKSPACE,
  configFile: join(WORKSPACE, "vite.config.ts"),
  build: {
    outDir: DIST,
    emptyOutDir: true,
  },
});

