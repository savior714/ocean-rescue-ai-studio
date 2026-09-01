import { Texture } from "pixi.js";
import { GupData, MissionData } from "../types";

/**
 * PROVISIONAL ASSETS FACTORY FOR OCEAN RESCUE (Travel Slice 1)
 *
 * NOTE: These textures are explicitly marked as PROVISIONAL external candidates
 * to prove the PixiJS sprite-backed actor runtime, state mapping, and game feel
 * without claiming canonical asset approval.
 */

export class ProvisionalAssetFactory {
  private static cache: Map<string, Texture> = new Map();

  /**
   * Generates a provisional GUP submarine hull texture.
   */
  public static getGupHullTexture(gup: GupData): Texture {
    const key = `gup_hull_${gup.id}_${gup.color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Thruster Pylon Mount
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.roundRect(-70, -16, 24, 32, 6);
    ctx.fill();

    // Cylindrical Thruster Housing
    const thrusterGrad = ctx.createLinearGradient(-85, -22, -85, 22);
    thrusterGrad.addColorStop(0, "#455a64");
    thrusterGrad.addColorStop(0.5, "#90a4ae");
    thrusterGrad.addColorStop(1, "#263238");
    ctx.fillStyle = thrusterGrad;
    ctx.strokeStyle = "#1e272c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-90, -20, 26, 40, 8);
    ctx.fill();
    ctx.stroke();

    // 2. Main Streamlined Pod Hull (Bulbous nose, tapered stern)
    const hullGrad = ctx.createLinearGradient(0, -50, 0, 50);
    hullGrad.addColorStop(0, adjustColorBrightness(gup.color, 45)); // sun specular highlight
    hullGrad.addColorStop(0.35, gup.color);
    hullGrad.addColorStop(0.8, adjustColorBrightness(gup.color, -25));
    hullGrad.addColorStop(1, adjustColorBrightness(gup.color, -55));

    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = adjustColorBrightness(gup.color, -60);
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(76, 0);
    ctx.bezierCurveTo(76, -42, 38, -52, -24, -48);
    ctx.bezierCurveTo(-60, -45, -74, -28, -76, 0);
    ctx.bezierCurveTo(-74, 28, -60, 45, -24, 48);
    ctx.bezierCurveTo(38, 52, 76, 42, 76, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Lower Keel Accent Stripe
    const bellyGrad = ctx.createLinearGradient(0, 10, 0, 48);
    bellyGrad.addColorStop(0, gup.accentColor);
    bellyGrad.addColorStop(1, adjustColorBrightness(gup.accentColor, -35));

    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.moveTo(66, 10);
    ctx.bezierCurveTo(56, 34, 22, 48, -24, 46);
    ctx.bezierCurveTo(-56, 44, -70, 28, -73, 10);
    ctx.bezierCurveTo(-32, 25, 32, 25, 66, 10);
    ctx.closePath();
    ctx.fill();

    // 4. White Pinstripe Streamline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-54, -18);
    ctx.bezierCurveTo(-15, -28, 24, -25, 60, -10);
    ctx.stroke();

    // 5. Signature Antenna / Fin per GUP
    if (gup.id === "gup-a") {
      // Angler Stalk Antenna & Glowing Lure
      ctx.strokeStyle = "#ffb300";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(44, -44);
      ctx.bezierCurveTo(60, -70, 82, -66, 86, -44);
      ctx.stroke();

      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(86, -44, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (gup.id === "gup-b") {
      // High Shark Dorsal Fin
      ctx.fillStyle = "#d84315";
      ctx.beginPath();
      ctx.moveTo(-10, -48);
      ctx.quadraticCurveTo(-22, -74, -38, -74);
      ctx.lineTo(-44, -46);
      ctx.closePath();
      ctx.fill();
    } else if (gup.id === "gup-c") {
      // Heavy Crane Frame
      ctx.strokeStyle = "#1565c0";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-30, -48);
      ctx.lineTo(-18, -70);
      ctx.lineTo(18, -70);
      ctx.lineTo(28, -46);
      ctx.stroke();
    }

    // 6. Nose Headlight Fixture
    ctx.fillStyle = "#b0bec5";
    ctx.strokeStyle = "#37474f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(72, 0, 9, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Cockpit Interior & Pilot Texture.
   */
  public static getCockpitTexture(companionAvatar: string): Texture {
    const key = `cockpit_${companionAvatar}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Dark cabin backdrop
    ctx.fillStyle = "#00384d";
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    // Cabin instrument console rim
    ctx.fillStyle = "#1e3d59";
    ctx.beginPath();
    ctx.arc(cx, cy + 18, 22, 0, Math.PI);
    ctx.fill();

    // Pilot Avatar Emoji
    ctx.font = "38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(companionAvatar, cx, cy - 4);

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Glass Canopy Dome Overlay.
   */
  public static getCanopyGlassTexture(): Texture {
    const key = "canopy_glass";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = 38;

    // Dome glass specular gradient
    const glassGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    glassGrad.addColorStop(0, "rgba(224, 247, 250, 0.7)");
    glassGrad.addColorStop(0.35, "rgba(128, 222, 234, 0.2)");
    glassGrad.addColorStop(0.7, "rgba(0, 188, 212, 0.15)");
    glassGrad.addColorStop(1, "rgba(0, 96, 100, 0.45)");

    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Specular Highlight Arc
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, -2.4, -1.0);
    ctx.stroke();

    // Outer Titanium Ring Bezel
    ctx.strokeStyle = "#37474f";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Spinning Propeller Texture.
   */
  public static getPropellerTexture(): Texture {
    const key = "propeller";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d")!;
    const cx = 24;
    const cy = 24;

    ctx.fillStyle = "#cfd8dc";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 6, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#37474f";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Boost Flame / Jet Plume Texture.
   */
  public static getBoostPlumeTexture(): Texture {
    const key = "boost_plume";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    // Outer fiery plasma flame
    const flameGrad = ctx.createLinearGradient(160, 32, 0, 32);
    flameGrad.addColorStop(0, "rgba(255, 152, 0, 0.95)");
    flameGrad.addColorStop(0.5, "rgba(255, 87, 34, 0.8)");
    flameGrad.addColorStop(1, "rgba(255, 235, 59, 0)");

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(160, 12);
    ctx.quadraticCurveTo(80, 0, 0, 32);
    ctx.quadraticCurveTo(80, 64, 160, 52);
    ctx.closePath();
    ctx.fill();

    // Inner Core electric blue flame
    const coreGrad = ctx.createLinearGradient(160, 32, 40, 32);
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.4, "#00e5ff");
    coreGrad.addColorStop(1, "rgba(0, 229, 255, 0)");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(160, 20);
    ctx.lineTo(50, 32);
    ctx.lineTo(160, 44);
    ctx.closePath();
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Volumetric Searchlight Cone Texture.
   */
  public static getSearchlightTexture(): Texture {
    const key = "searchlight_beam";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 380;
    canvas.height = 200;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createRadialGradient(0, 100, 10, 260, 100, 360);
    grad.addColorStop(0, "rgba(255, 255, 224, 0.55)");
    grad.addColorStop(0.4, "rgba(255, 245, 157, 0.22)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(380, 10);
    ctx.lineTo(380, 190);
    ctx.closePath();
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Precision Cutter Tool Mount Texture.
   */
  public static getLaserCutterTexture(): Texture {
    const key = "laser_cutter_tool";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    // Cutter armature mount
    ctx.fillStyle = "#607d8b";
    ctx.fillRect(0, 10, 24, 12);

    // Laser emitter lens
    ctx.fillStyle = "#ff1744";
    ctx.beginPath();
    ctx.arc(32, 16, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(32, 16, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Boost Ring Texture.
   */
  public static getBoostRingTexture(): Texture {
    const key = "boost_ring";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 120;
    const ctx = canvas.getContext("2d")!;

    const cx = 40;
    const cy = 60;

    // Glowing outer ellipse ring
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 54, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner energetic core
    ctx.fillStyle = "rgba(0, 229, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 30, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Marine Life Texture (Fish).
   */
  public static getFishTexture(color: string): Texture {
    const key = `fish_${color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 28;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(24, 14, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(10, 14);
    ctx.lineTo(0, 4);
    ctx.lineTo(0, 24);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(32, 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(33, 12, 1.2, 0, Math.PI * 2);
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Manta Ray Silhouette Texture.
   */
  public static getMantaTexture(): Texture {
    const key = "manta_silhouette";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    const cx = 80;
    const cy = 50;

    ctx.fillStyle = "rgba(0, 30, 60, 0.55)";
    ctx.beginPath();
    ctx.moveTo(cx + 50, cy);
    ctx.quadraticCurveTo(cx + 15, cy - 36, cx - 40, cy - 44);
    ctx.quadraticCurveTo(cx - 20, cy, cx - 50, cy);
    ctx.quadraticCurveTo(cx - 20, cy, cx - 40, cy + 44);
    ctx.quadraticCurveTo(cx + 15, cy + 36, cx + 50, cy);
    ctx.fill();

    // Tail
    ctx.strokeStyle = "rgba(0, 30, 60, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy);
    ctx.lineTo(cx - 80, cy);
    ctx.stroke();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Jellyfish Texture.
   */
  public static getJellyfishTexture(color: string): Texture {
    const key = `jellyfish_${color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 80;
    const ctx = canvas.getContext("2d")!;
    const cx = 32;

    // Bell dome
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, 32, 28, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Tentacles
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(cx + k * 8, 32);
      ctx.quadraticCurveTo(cx + k * 8 + 4, 52, cx + k * 8, 76);
      ctx.stroke();
    }

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Obstacle Texture (Coral, Rock, Seaweed).
   */
  public static getObstacleTexture(kind: "coral" | "rock" | "seaweed_cluster", color: string): Texture {
    const key = `obstacle_${kind}_${color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 140;
    canvas.height = 200;
    const ctx = canvas.getContext("2d")!;
    const cx = 70;

    if (kind === "coral") {
      // Branching Staghorn Coral
      ctx.fillStyle = color;
      ctx.strokeStyle = "#880e4f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, 190);
      ctx.lineTo(cx - 45, 100);
      ctx.lineTo(cx - 55, 30);
      ctx.lineTo(cx - 20, 70);
      ctx.lineTo(cx, 15);
      ctx.lineTo(cx + 20, 70);
      ctx.lineTo(cx + 55, 30);
      ctx.lineTo(cx + 45, 100);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (kind === "rock") {
      // Granite Boulder
      const rockGrad = ctx.createRadialGradient(cx, 100, 20, cx, 100, 60);
      rockGrad.addColorStop(0, "#78909c");
      rockGrad.addColorStop(1, "#37474f");
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.ellipse(cx, 100, 55, 75, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Giant Kelp Cluster
      ctx.strokeStyle = "#2e7d32";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, 190);
      ctx.bezierCurveTo(cx - 30, 130, cx + 30, 70, cx, 10);
      ctx.stroke();
    }

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Bubble Particle Texture.
   */
  public static getBubbleTexture(): Texture {
    const key = "bubble_particle";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "rgba(224, 247, 250, 0.85)";
    ctx.beginPath();
    ctx.arc(12, 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Tiny highlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(9, 9, 3, 0, Math.PI * 2);
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}

function adjustColorBrightness(hex: string, percent: number): string {
  let num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) num = 0xffc107;
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
