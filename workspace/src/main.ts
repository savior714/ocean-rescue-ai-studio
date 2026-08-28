import { SpaceExplorerApp } from "./space-explorer-app";

function init() {
  const app = new SpaceExplorerApp();
  app.boot();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
