import { OceanRescueGame } from "./game";

function init() {
  const game = new OceanRescueGame();
  game.boot();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

