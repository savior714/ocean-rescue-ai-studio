import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = join(ROOT, "workspace");

const pixiMap = join(WORKSPACE, "src", "vendor", "pixi.min.js.map");
if (!existsSync(pixiMap)) {
  writeFileSync(pixiMap, '{"version":3,"file":"pixi-8.19.0.min.js","sources":[],"mappings":""}\n', "utf8");
}

const { createServer } = await import("vite");

const server = await createServer({
  root: WORKSPACE,
  configFile: join(WORKSPACE, "vite.config.ts"),
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
});

await server.listen();
server.printUrls();


