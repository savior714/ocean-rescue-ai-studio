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

  /**
   * Generates a provisional Sea Turtle Carapace (Shell) Texture.
   */
  public static getSeaTurtleCarapaceTexture(): Texture {
    const key = "turtle_carapace";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 180;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Carapace Outer Shadow / Rim
    ctx.fillStyle = "#1b382b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 102, 74, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main Carapace Gradient (Deep olive to golden amber)
    const shellGrad = ctx.createRadialGradient(-15, -20, 15, 0, 0, 100);
    shellGrad.addColorStop(0, "#8da858"); // warm olive highlight
    shellGrad.addColorStop(0.35, "#527339");
    shellGrad.addColorStop(0.7, "#354e28");
    shellGrad.addColorStop(1, "#1e2e17");

    ctx.fillStyle = shellGrad;
    ctx.strokeStyle = "#1b2a15";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 96, 68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Scute Plates (Geometric vertebral and costal scutes with dark grooved margins)
    ctx.strokeStyle = "rgba(25, 40, 20, 0.85)";
    ctx.lineWidth = 2.5;

    // Center vertebral ridge scutes
    const scuteCenters = [-52, -18, 18, 52];
    for (let i = 0; i < scuteCenters.length; i++) {
      const sx = scuteCenters[i];
      ctx.fillStyle = "rgba(180, 210, 120, 0.18)";
      ctx.beginPath();
      ctx.moveTo(sx - 16, 0);
      ctx.lineTo(sx - 8, -24);
      ctx.lineTo(sx + 8, -24);
      ctx.lineTo(sx + 16, 0);
      ctx.lineTo(sx + 8, 24);
      ctx.lineTo(sx - 8, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Radiating growth rings within scutes
      ctx.fillStyle = "rgba(255, 235, 150, 0.12)";
      ctx.beginPath();
      ctx.ellipse(sx, 0, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Costal Lateral Scutes (Upper & Lower)
    for (let i = 0; i < 3; i++) {
      const lx = -35 + i * 36;
      // Top costal
      ctx.beginPath();
      ctx.moveTo(lx - 12, -26);
      ctx.lineTo(lx, -56);
      ctx.lineTo(lx + 24, -54);
      ctx.lineTo(lx + 14, -26);
      ctx.stroke();

      // Bottom costal
      ctx.beginPath();
      ctx.moveTo(lx - 12, 26);
      ctx.lineTo(lx, 56);
      ctx.lineTo(lx + 24, 54);
      ctx.lineTo(lx + 14, 26);
      ctx.stroke();
    }

    // 4. Marginal Rim Scutes (Outer scalloped edge)
    ctx.strokeStyle = "rgba(240, 230, 170, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 91, 63, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Sea Turtle Plastron (Belly) Texture.
   */
  public static getSeaTurtlePlastronTexture(): Texture {
    const key = "turtle_plastron";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const bellyGrad = ctx.createRadialGradient(cx, cy - 10, 10, cx, cy, 80);
    bellyGrad.addColorStop(0, "#fff9c4"); // soft warm cream
    bellyGrad.addColorStop(0.5, "#f0e68c");
    bellyGrad.addColorStop(1, "#c5b358");

    ctx.fillStyle = bellyGrad;
    ctx.strokeStyle = "#8c7b30";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 82, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Sea Turtle Head Texture.
   */
  public static getSeaTurtleHeadTexture(): Texture {
    const key = "turtle_head";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 110;
    canvas.height = 80;
    const ctx = canvas.getContext("2d")!;
    const cx = 35;
    const cy = 40;

    // Neck base
    const neckGrad = ctx.createLinearGradient(0, 20, 40, 20);
    neckGrad.addColorStop(0, "#3e5628");
    neckGrad.addColorStop(1, "#607d3b");
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.bezierCurveTo(20, 20, 35, 24, 45, 28);
    ctx.lineTo(45, 52);
    ctx.bezierCurveTo(30, 56, 15, 56, 0, 52);
    ctx.closePath();
    ctx.fill();

    // Cranium & Snout
    const headGrad = ctx.createRadialGradient(50, 34, 6, 50, 36, 40);
    headGrad.addColorStop(0, "#8cb04a");
    headGrad.addColorStop(0.6, "#557434");
    headGrad.addColorStop(1, "#2e421c");

    ctx.fillStyle = headGrad;
    ctx.strokeStyle = "#203014";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(25, 25);
    ctx.bezierCurveTo(45, 12, 75, 16, 92, 34); // crown to beak tip
    ctx.bezierCurveTo(98, 40, 96, 48, 86, 52); // sharp hooked rhamphotheca (beak)
    ctx.bezierCurveTo(70, 56, 50, 60, 25, 50); // lower jaw to throat
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nostril
    ctx.fillStyle = "#1e2b14";
    ctx.beginPath();
    ctx.ellipse(84, 33, 2.5, 1.8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Jaw Line
    ctx.strokeStyle = "#1b2611";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(88, 42);
    ctx.bezierCurveTo(74, 42, 58, 40, 48, 44);
    ctx.stroke();

    // Temporal scales pattern
    ctx.fillStyle = "rgba(230, 245, 180, 0.3)";
    ctx.beginPath();
    ctx.ellipse(40, 28, 6, 4, 0.4, 0, Math.PI * 2);
    ctx.ellipse(50, 24, 5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(36, 38, 5, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Sea Turtle Eye Texture.
   */
  public static getSeaTurtleEyeTexture(): Texture {
    const key = "turtle_eye";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 36;
    canvas.height = 36;
    const ctx = canvas.getContext("2d")!;
    const cx = 18;
    const cy = 18;

    // Dark almond eye socket
    ctx.fillStyle = "#152010";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Warm deep amber/brown iris
    const irisGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 10);
    irisGrad.addColorStop(0, "#d7ccc8");
    irisGrad.addColorStop(0.4, "#5d4037");
    irisGrad.addColorStop(0.8, "#271c19");
    irisGrad.addColorStop(1, "#0d0a08");

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Large dark expressive pupil
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.ellipse(cx + 1, cy, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular glass light catch (two moisture glints)
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Sea Turtle Fore Flipper (Paddle) Texture.
   */
  public static getSeaTurtleForeFlipperTexture(): Texture {
    const key = "turtle_fore_flipper";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 180;
    canvas.height = 80;
    const ctx = canvas.getContext("2d")!;

    // Flipper blade (tapered hydrodynamic wing)
    const flipperGrad = ctx.createLinearGradient(10, 40, 160, 40);
    flipperGrad.addColorStop(0, "#48622c");
    flipperGrad.addColorStop(0.4, "#6d8f3e");
    flipperGrad.addColorStop(0.8, "#8bb252");
    flipperGrad.addColorStop(1, "#364c1e");

    ctx.fillStyle = flipperGrad;
    ctx.strokeStyle = "#1e2e12";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(10, 35); // shoulder joint
    ctx.bezierCurveTo(40, 10, 110, 12, 168, 38); // leading edge wing curve
    ctx.bezierCurveTo(150, 60, 90, 72, 40, 60); // trailing feathered edge
    ctx.bezierCurveTo(20, 55, 10, 48, 10, 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Scale plates on leading wing edge
    ctx.fillStyle = "rgba(255, 240, 180, 0.25)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(35 + i * 24, 25 + i * 2, 8 - i * 0.8, 5 - i * 0.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Sea Turtle Hind Flipper Texture.
   */
  public static getSeaTurtleHindFlipperTexture(): Texture {
    const key = "turtle_hind_flipper";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 90;
    canvas.height = 50;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createRadialGradient(20, 25, 5, 45, 25, 40);
    grad.addColorStop(0, "#739943");
    grad.addColorStop(1, "#33491f");

    ctx.fillStyle = grad;
    ctx.strokeStyle = "#1b2910";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(8, 25);
    ctx.bezierCurveTo(25, 10, 65, 12, 82, 25);
    ctx.bezierCurveTo(65, 42, 25, 40, 8, 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Ancient Reef Arch / Anchor Rock Texture.
   */
  public static getReefArchTexture(): Texture {
    const key = "reef_arch";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 380;
    canvas.height = 460;
    const ctx = canvas.getContext("2d")!;

    // Massive coral reef arch formation
    const archGrad = ctx.createLinearGradient(0, 460, 0, 50);
    archGrad.addColorStop(0, "#1f2d3d");
    archGrad.addColorStop(0.5, "#2e4057");
    archGrad.addColorStop(0.8, "#3e5c76");
    archGrad.addColorStop(1, "#1d2d44");

    ctx.fillStyle = archGrad;
    ctx.strokeStyle = "#0d1b2a";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(20, 460);
    ctx.bezierCurveTo(30, 280, 70, 160, 160, 80);
    ctx.bezierCurveTo(240, 20, 320, 80, 360, 220);
    ctx.bezierCurveTo(380, 340, 370, 420, 360, 460);
    ctx.lineTo(280, 460);
    ctx.bezierCurveTo(290, 340, 280, 220, 240, 180);
    ctx.bezierCurveTo(180, 140, 130, 240, 100, 460);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sprouting sea sponges & pink encrusting coralline algae
    const algaeColors = ["#e91e63", "#f06292", "#ba68c8", "#ff7043", "#4db6ac"];
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = algaeColors[i % algaeColors.length];
      const ax = 50 + (i * 20) % 290;
      const ay = 100 + (i * 24) % 320;
      ctx.beginPath();
      ctx.ellipse(ax, ay, 12 + (i % 4) * 4, 8 + (i % 3) * 3, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = Texture.from(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Generates a provisional Sonar Scanner Wave Texture.
   */
  public static getScanWaveTexture(): Texture {
    const key = "scan_wave";
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    const cx = 80;
    const cy = 80;

    const ringGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 76);
    ringGrad.addColorStop(0, "rgba(0, 229, 255, 0)");
    ringGrad.addColorStop(0.7, "rgba(0, 229, 255, 0.4)");
    ringGrad.addColorStop(0.95, "rgba(255, 255, 255, 0.85)");
    ringGrad.addColorStop(1, "rgba(0, 229, 255, 0)");

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 76, 0, Math.PI * 2);
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
