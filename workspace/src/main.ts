import { OceanRescueGame } from "./game";

function init() {
  const canvas = document.getElementById("ocean-rescue-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  // High-definition 16:9 canvas dimensions
  canvas.width = 1280;
  canvas.height = 720;

  new OceanRescueGame(canvas);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
