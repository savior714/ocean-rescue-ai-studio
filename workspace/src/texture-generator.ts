import * as THREE from "three";

/**
 * High quality procedural texture generator for all celestial bodies.
 * Uses 2D Canvas to generate high-resolution, self-contained textures in memory.
 */
export class TextureGenerator {
  private static canvasCache: Map<string, THREE.CanvasTexture> = new Map();

  public static createSunTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("sun")) return this.canvasCache.get("sun")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base fiery orange-yellow gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#ff5500");
    grad.addColorStop(0.3, "#ffaa00");
    grad.addColorStop(0.5, "#ffea00");
    grad.addColorStop(0.7, "#ff8800");
    grad.addColorStop(1, "#ff3300");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Solar granulation cells
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 2 + Math.random() * 8;
      const alpha = 0.2 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255, 255, 200, ${alpha})` : `rgba(255, 100, 0, ${alpha})`;
      ctx.fill();
    }

    // Solar flare hot ribbons
    ctx.strokeStyle = "rgba(255, 255, 230, 0.4)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      let cx = 0;
      let cy = Math.random() * canvas.height;
      ctx.moveTo(cx, cy);
      while (cx < canvas.width) {
        cx += 40 + Math.random() * 60;
        cy += (Math.random() - 0.5) * 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    this.canvasCache.set("sun", tex);
    return tex;
  }

  public static createMercuryTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("mercury")) return this.canvasCache.get("mercury")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base rocky gray
    ctx.fillStyle = "#8a8782";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise variations
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 1 + Math.random() * 6;
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(70, 68, 65, 0.4)" : "rgba(180, 175, 170, 0.3)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact craters with highlighted rims
    for (let i = 0; i < 120; i++) {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      const cr = 4 + Math.random() * 20;

      // Dark basin
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(45, 43, 40, 0.7)";
      ctx.fill();

      // Bright rim
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, cr + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(220, 215, 205, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("mercury", tex);
    return tex;
  }

  public static createVenusTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("venus")) return this.canvasCache.get("venus")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Thick amber & golden haze gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#d89c56");
    grad.addColorStop(0.3, "#f0c987");
    grad.addColorStop(0.5, "#e6ba76");
    grad.addColorStop(0.7, "#f7d89b");
    grad.addColorStop(1, "#c98e47");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Swirling atmospheric chevron bands
    for (let i = 0; i < 30; i++) {
      const y = (i / 30) * canvas.height;
      ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 245, 215, 0.4)" : "rgba(180, 110, 40, 0.35)";
      ctx.lineWidth = 12 + Math.random() * 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += 30) {
        const wave = Math.sin((x / canvas.width) * Math.PI * 4 + i) * 15;
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("venus", tex);
    return tex;
  }

  public static createEarthTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("earth")) return this.canvasCache.get("earth")!;

    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    // Deep ocean blue gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, "#0e3870");
    oceanGrad.addColorStop(0.5, "#154c9e");
    oceanGrad.addColorStop(1, "#0d3161");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Polar ice caps
    ctx.fillStyle = "#ffffff";
    // North pole
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, 40, canvas.width / 2, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    // South pole (Antarctica)
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height - 40, canvas.width / 2, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Procedural Continents (Eurasia, Africa, Americas, Australia)
    ctx.fillStyle = "#2d7037"; // Forest green
    const drawLandMass = (cx: number, cy: number, rx: number, ry: number, color: string = "#2d7037") => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rough coastlines
      for (let j = 0; j < 25; j++) {
        const angle = (j / 25) * Math.PI * 2;
        const ox = cx + Math.cos(angle) * rx * 0.8;
        const oy = cy + Math.sin(angle) * ry * 0.8;
        ctx.beginPath();
        ctx.arc(ox, oy, rx * 0.35 + Math.random() * (rx * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Eurasia
    drawLandMass(1300, 350, 340, 160, "#386b35");
    // Desert Sahara
    drawLandMass(1100, 480, 180, 110, "#c29b38");
    // Africa southern
    drawLandMass(1120, 620, 140, 160, "#3e7033");
    // North America
    drawLandMass(480, 350, 220, 140, "#3c753b");
    // South America
    drawLandMass(620, 660, 150, 200, "#286629");
    // Australia
    drawLandMass(1650, 720, 130, 90, "#b88a3b");

    // Mountainous highlights
    ctx.fillStyle = "#6d5b3d";
    for (let k = 0; k < 40; k++) {
      ctx.fillRect(400 + Math.random() * 1100, 250 + Math.random() * 450, 15, 8);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("earth", tex);
    return tex;
  }

  public static createEarthCloudsTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("earth-clouds")) return this.canvasCache.get("earth-clouds")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fluffy cloud swirls
    for (let i = 0; i < 400; i++) {
      const cx = Math.random() * canvas.width;
      const cy = 80 + Math.random() * (canvas.height - 160);
      const r = 10 + Math.random() * 35;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
      grad.addColorStop(0.7, "rgba(255, 255, 255, 0.35)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("earth-clouds", tex);
    return tex;
  }

  public static createMoonTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("moon")) return this.canvasCache.get("moon")!;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Pale lunar highlands
    ctx.fillStyle = "#c5c5c7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dark lunar maria (바다)
    ctx.fillStyle = "rgba(90, 92, 98, 0.75)";
    ctx.beginPath();
    ctx.ellipse(180, 100, 70, 50, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(320, 130, 80, 55, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(240, 160, 60, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lunar impact craters
    for (let i = 0; i < 80; i++) {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      const cr = 2 + Math.random() * 12;

      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(60, 60, 65, 0.6)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, cr + 1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(240, 240, 245, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("moon", tex);
    return tex;
  }

  public static createMarsTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("mars")) return this.canvasCache.get("mars")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Rust ochre base
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#d86036");
    grad.addColorStop(0.5, "#bd4826");
    grad.addColorStop(1, "#a83e1f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Polar ice caps (화성 극관)
    ctx.fillStyle = "#f5f5f7";
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, 20, canvas.width / 3, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height - 20, canvas.width / 3, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark volcanic basalt regions & Valles Marineris canyon
    ctx.fillStyle = "rgba(75, 30, 18, 0.65)";
    for (let i = 0; i < 15; i++) {
      const cx = 100 + i * 60;
      const cy = 200 + Math.sin(i) * 60;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 45, 25, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Huge canyon streak
    ctx.strokeStyle = "rgba(50, 18, 10, 0.85)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(350, 260);
    ctx.bezierCurveTo(450, 290, 580, 240, 720, 270);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("mars", tex);
    return tex;
  }

  public static createJupiterTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("jupiter")) return this.canvasCache.get("jupiter")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Multi-layered planetary bands
    const bandColors = [
      "#d9a26a", "#c77c41", "#ebd2b0", "#a85f2d",
      "#dfba89", "#8f441c", "#f3dfc6", "#bc7238",
      "#e5caa6", "#995226", "#eedac1", "#b26532"
    ];

    const bandH = canvas.height / bandColors.length;
    for (let i = 0; i < bandColors.length; i++) {
      ctx.fillStyle = bandColors[i];
      ctx.fillRect(0, i * bandH, canvas.width, bandH);

      // Add atmospheric turbulence waves
      ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.25)" : "rgba(80, 30, 0, 0.25)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, i * bandH + bandH / 2);
      for (let x = 0; x <= canvas.width; x += 20) {
        ctx.lineTo(x, i * bandH + bandH / 2 + Math.sin((x / 50) + i) * 6);
      }
      ctx.stroke();
    }

    // Great Red Spot (목성 대적점)
    const grsX = 640;
    const grsY = 320;
    const grsGrad = ctx.createRadialGradient(grsX, grsY, 0, grsX, grsY, 55);
    grsGrad.addColorStop(0, "#cc3311");
    grsGrad.addColorStop(0.6, "#e06030");
    grsGrad.addColorStop(1, "rgba(200, 100, 50, 0)");
    ctx.fillStyle = grsGrad;
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, 70, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // White oval storms
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.ellipse(200 + i * 140, 380 + (i % 2) * 20, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("jupiter", tex);
    return tex;
  }

  public static createSaturnTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("saturn")) return this.canvasCache.get("saturn")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Golden butterscotch bands
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#b89e6c");
    grad.addColorStop(0.2, "#dfc698");
    grad.addColorStop(0.4, "#ecd9b2");
    grad.addColorStop(0.6, "#d8be8a");
    grad.addColorStop(0.8, "#c9ad78");
    grad.addColorStop(1, "#aa905e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 16) {
      ctx.fillStyle = y % 32 === 0 ? "rgba(255, 250, 230, 0.18)" : "rgba(100, 80, 40, 0.12)";
      ctx.fillRect(0, y, canvas.width, 10);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("saturn", tex);
    return tex;
  }

  public static createSaturnRingsTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("saturn-rings")) return this.canvasCache.get("saturn-rings")!;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    // Horizontal linear gradient representing concentric radius from inner to outer ring
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    // Inner C Ring (faint)
    grad.addColorStop(0.0, "rgba(160, 140, 110, 0.0)");
    grad.addColorStop(0.15, "rgba(180, 160, 120, 0.35)");
    // B Ring (brightest and densest)
    grad.addColorStop(0.25, "rgba(235, 215, 175, 0.95)");
    grad.addColorStop(0.55, "rgba(215, 195, 155, 0.90)");
    // Cassini Division (dark gap)
    grad.addColorStop(0.58, "rgba(30, 25, 20, 0.05)");
    grad.addColorStop(0.64, "rgba(30, 25, 20, 0.05)");
    // A Ring (medium bright)
    grad.addColorStop(0.67, "rgba(220, 200, 160, 0.85)");
    grad.addColorStop(0.85, "rgba(195, 175, 140, 0.70)");
    // Encke Gap and outer edge
    grad.addColorStop(0.92, "rgba(150, 130, 100, 0.3)");
    grad.addColorStop(1.0, "rgba(100, 90, 70, 0.0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fine ringlet stripes
    for (let x = 0; x < canvas.width; x += 4) {
      if (Math.random() > 0.4) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fillRect(x, 0, 2, canvas.height);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("saturn-rings", tex);
    return tex;
  }

  public static createUranusTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("uranus")) return this.canvasCache.get("uranus")!;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#6cdbe0");
    grad.addColorStop(0.5, "#93e8ec");
    grad.addColorStop(1, "#5bcad0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("uranus", tex);
    return tex;
  }

  public static createNeptuneTexture(): THREE.CanvasTexture {
    if (this.canvasCache.has("neptune")) return this.canvasCache.get("neptune")!;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#1c4cb8");
    grad.addColorStop(0.3, "#2762e3");
    grad.addColorStop(0.5, "#3b7cf5");
    grad.addColorStop(0.8, "#2055cb");
    grad.addColorStop(1, "#163f9d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bright methane storm cirrus streaks
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const y = 80 + i * 18;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(150, y + 10, 350, y - 10, canvas.width, y);
      ctx.stroke();
    }

    // Great Dark Spot (해왕성 대흑점)
    ctx.fillStyle = "rgba(10, 30, 80, 0.7)";
    ctx.beginPath();
    ctx.ellipse(320, 110, 40, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.canvasCache.set("neptune", tex);
    return tex;
  }
}
