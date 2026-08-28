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

function sandboxBypassPlugin() {
  return {
    name: "ai-studio-sandbox-bypass",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/" || req.url === "/index.html") {
          req.url = "/index.dev.html";
        }
        next();
      });
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const bypassScript = `
  <script id="ai-studio-sandbox-preview-bootstrap">
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        if (!window.localStorage.getItem("study_rewards")) {
          window.localStorage.setItem("study_rewards", JSON.stringify({
            gems: 2,
            youtube_minutes: 10,
            unlocked_games: ["ocean-rescue"],
            timestamp: Date.now()
          }));
        }
      }
    } catch (e) {}
    document.addEventListener("DOMContentLoaded", function() {
      var gate = document.getElementById("ocean-rescue-admission-gate");
      if (gate) {
        gate.setAttribute("hidden", "");
        gate.style.display = "none";
      }
      var root = document.getElementById("ocean-rescue-root");
      if (root) {
        root.setAttribute("data-access-denied", "false");
      }
    });
  </script>`;
        if (html.includes("</head>")) {
          return html.replace("</head>", `${bypassScript}\n</head>`);
        }
        return bypassScript + html;
      },
    },
  };
}

const server = await createServer({
  root: WORKSPACE,
  configFile: join(WORKSPACE, "vite.config.ts"),
  plugins: [sandboxBypassPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
});

await server.listen();
server.printUrls();


