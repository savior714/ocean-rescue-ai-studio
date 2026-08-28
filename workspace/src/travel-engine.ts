import {
  GupData,
  MissionData,
  TravelObstacle,
  CollectibleStar,
  BoostRing,
  FishBoid,
  JellyfishEntity,
  GupUpgrades
} from "./types";
import { Audio } from "./audio";

interface BackgroundDistantCreature {
  x: number;
  y: number;
  speed: number;
  scale: number;
  type: "manta" | "whale" | "shark";
  alpha: number;
  sinOffset: number;
}

interface ForegroundParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  blur: number;
}

export class TravelEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mission: MissionData;
  private gup: GupData;
  private upgrades: GupUpgrades;
  private onArrival: () => void;

  // Submarine 2.5D State
  public subX = 280;
  public subY = 360;
  public subTargetY = 360;
  public subPitch = 0;
  public subRoll = 0;
  public baseSpeed = 320;
  public currentSpeed = 320;
  public distance = 0;
  public totalDistance = 3800;
  public isCompleted = false;

  // Cavitation & Wake Vortex Particles (3D depth bubbles)
  private wakeVortices: Array<{ x: number; y: number; z: number; size: number; alpha: number; vx: number; vy: number }> = [];

  // Shield & Boost & Sonar States
  private boostTimer = 0;
  private sonarPulseRadius = 0;
  private sonarActive = false;
  private shieldCharges = 0;
  public starsCollected = 0;
  public totalStarsCount = 0;

  // Pointer / Touch Input
  private isPointerDown = false;
  private pointerY = 360;
  private lastTapY: number | null = null;
  private isHoldMode = false;
  private pointerHoldTime = 0;

  // 2.5D Entities & Multi-layer Parallax
  private obstacles: TravelObstacle[] = [];
  private stars: CollectibleStar[] = [];
  private boostRings: BoostRing[] = [];
  private fishSchool: FishBoid[] = [];
  private jellyfishList: JellyfishEntity[] = [];
  private distantCreatures: BackgroundDistantCreature[] = [];
  private foregroundElements: ForegroundParticle[] = [];
  private bubbles: Array<{ x: number; y: number; size: number; speed: number; alpha: number; z: number }> = [];
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size?: number }> = [];

  // Visual Effects & Lighting
  private waveOffset = 0;
  private shakeTime = 0;
  private isSlowedDown = false;
  private slowDownTimer = 0;

  // Keyboard
  private keysPressed: { [key: string]: boolean } = {};

  // Loop control
  private animFrameId: number | null = null;
  private lastTime = 0;
  private isRunning = false;
  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: (() => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    gup: GupData,
    upgrades: GupUpgrades | undefined,
    onArrival: () => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context not available");
    this.ctx = context;
    this.mission = mission;
    this.gup = gup;
    this.upgrades = upgrades || { speedLevel: 0, shieldLevel: 0, sonarLevel: 0 };
    this.shieldCharges = this.upgrades.shieldLevel;
    this.onArrival = onArrival;

    this.initEntities();
    this.init2D5ParallaxElements();
    this.bindEvents();
  }

  private initEntities() {
    this.obstacles = [];
    this.stars = [];
    this.boostRings = [];
    this.starsCollected = 0;

    const spacing = 520;
    const count = 7;
    const env = this.mission.environment;

    // Obstacles with 2.5D depth properties
    for (let i = 0; i < count; i++) {
      const worldX = 650 + i * spacing;
      const isTop = i % 2 === 0;
      const y = isTop ? 140 + Math.random() * 90 : 540 - Math.random() * 90;
      const width = 110 + Math.random() * 50;
      const height = 160 + Math.random() * 70;

      let kind = "coral-rock";
      let color = "#e06377";
      let name = "산호 기둥";

      if (env === "kelp-forest") {
        kind = "kelp-rock";
        color = "#2e7d32";
        name = "다시마 암초";
      } else if (env === "deep-trench") {
        kind = "trench-pillar";
        color = "#37474f";
        name = "심해 현무암";
      } else if (env === "arctic-ocean") {
        kind = "iceberg";
        color = "#80deea";
        name = "빙하 빙산";
      } else if (env === "abyssal-zone") {
        kind = "hydrothermal-vent";
        color = "#4a148c";
        name = "심해 열수구";
      }

      this.obstacles.push({
        id: `obs-${i}`,
        worldX,
        y,
        width,
        height,
        kind,
        color,
        name
      });
    }

    // Collectible Stars / Bio Orbs in dynamic sine paths
    for (let i = 0; i < 20; i++) {
      const worldX = 400 + i * 175;
      const y = 150 + Math.sin(i * 0.85) * 170 + 170;
      this.stars.push({
        id: `star-${i}`,
        worldX,
        y,
        collected: false,
        type: i % 4 === 0 ? "bio-orb" : "star"
      });
    }
    this.totalStarsCount = this.stars.length;

    // Boost Turbo Rings
    for (let i = 0; i < 4; i++) {
      const worldX = 900 + i * 780;
      const y = 240 + Math.sin(i * 1.5) * 140;
      this.boostRings.push({
        id: `ring-${i}`,
        worldX,
        y,
        radius: 46,
        passed: false
      });
    }

    // 3D Fish School Boids
    this.fishSchool = [];
    for (let i = 0; i < 18; i++) {
      this.fishSchool.push({
        x: Math.random() * 1280,
        y: 80 + Math.random() * 560,
        vx: -(40 + Math.random() * 70),
        vy: (Math.random() - 0.5) * 20,
        size: 8 + Math.random() * 8,
        color: Math.random() < 0.5 ? "#ffd54f" : "#4fc3f7"
      });
    }

    // Bioluminescent Jellyfish
    this.jellyfishList = [];
    for (let i = 0; i < 6; i++) {
      this.jellyfishList.push({
        x: 300 + i * 220 + Math.random() * 80,
        y: 120 + Math.random() * 480,
        size: 18 + Math.random() * 16,
        color: i % 2 === 0 ? "#ba68c8" : "#00e5ff",
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    // Ambient 3D Bubbles with Z-depth
    this.bubbles = [];
    for (let i = 0; i < 40; i++) {
      this.bubbles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: 2 + Math.random() * 7,
        speed: 25 + Math.random() * 45,
        alpha: 0.2 + Math.random() * 0.45,
        z: 0.3 + Math.random() * 1.2
      });
    }
  }

  private init2D5ParallaxElements() {
    // Distant background creatures (Manta rays, Whale silhouettes in the deep)
    this.distantCreatures = [
      { x: 300, y: 220, speed: 25, scale: 1.2, type: "manta", alpha: 0.22, sinOffset: 0 },
      { x: 950, y: 380, speed: 18, scale: 1.8, type: "whale", alpha: 0.18, sinOffset: 2.1 },
      { x: 1400, y: 180, speed: 30, scale: 0.9, type: "manta", alpha: 0.2, sinOffset: 4.2 }
    ];

    // Foreground High-Speed Depth-of-field motes & bubbles
    this.foregroundElements = [];
    for (let i = 0; i < 14; i++) {
      this.foregroundElements.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: 14 + Math.random() * 22,
        speed: 120 + Math.random() * 180,
        alpha: 0.12 + Math.random() * 0.18,
        blur: 4 + Math.random() * 6
      });
    }
  }

  private bindEvents() {
    const handlePointer = (clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = this.canvas.height / rect.height;
      const targetY = (clientY - rect.top) * scaleY;
      this.pointerY = Math.max(80, Math.min(640, targetY));
      this.subTargetY = this.pointerY;
    };

    this.boundPointerDown = (e: PointerEvent) => {
      this.isPointerDown = true;
      this.pointerHoldTime = 0;
      this.lastTapY = e.clientY;
      handlePointer(e.clientY);
    };

    this.boundPointerMove = (e: PointerEvent) => {
      if (this.isPointerDown) {
        handlePointer(e.clientY);
      }
    };

    this.boundPointerUp = () => {
      this.isPointerDown = false;
      this.isHoldMode = false;
    };

    this.boundKeyDown = (e: KeyboardEvent) => {
      this.keysPressed[e.key] = true;
      if (e.key === " " || e.key === "Enter") {
        this.triggerSonar();
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keysPressed[e.key] = false;
    };

    this.canvas.addEventListener("pointerdown", this.boundPointerDown);
    window.addEventListener("pointermove", this.boundPointerMove);
    window.addEventListener("pointerup", this.boundPointerUp);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  public triggerSonar() {
    if (!this.sonarActive) {
      this.sonarActive = true;
      this.sonarPulseRadius = 20;
      Audio.playSonar();
    }
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    this.isPointerDown = false;
    this.keysPressed = {};
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.boundPointerDown) {
      this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
      this.boundPointerDown = null;
    }
    if (this.boundPointerMove) {
      window.removeEventListener("pointermove", this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.boundPointerUp) {
      window.removeEventListener("pointerup", this.boundPointerUp);
      this.boundPointerUp = null;
    }
    if (this.boundKeyDown) {
      window.removeEventListener("keydown", this.boundKeyDown);
      this.boundKeyDown = null;
    }
    if (this.boundKeyUp) {
      window.removeEventListener("keyup", this.boundKeyUp);
      this.boundKeyUp = null;
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.waveOffset += dt;

    // Keyboard Steering
    if (this.keysPressed["ArrowUp"] || this.keysPressed["w"] || this.keysPressed["W"]) {
      this.subTargetY = Math.max(80, this.subTargetY - 420 * dt);
    }
    if (this.keysPressed["ArrowDown"] || this.keysPressed["s"] || this.keysPressed["S"]) {
      this.subTargetY = Math.min(640, this.subTargetY + 420 * dt);
    }

    // Boost & Speed Management
    const speedBonus = (this.upgrades.speedLevel || 0) * 45;
    let targetSpeed = this.baseSpeed + speedBonus;

    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      targetSpeed *= 1.75;
    }
    if (this.isSlowedDown) {
      this.slowDownTimer -= dt;
      targetSpeed *= 0.45;
      if (this.slowDownTimer <= 0) {
        this.isSlowedDown = false;
      }
    }

    this.currentSpeed += (targetSpeed - this.currentSpeed) * (dt * 5);
    this.distance += this.currentSpeed * dt;

    // 2.5D Submarine Smooth Pitch & Roll Physics
    const dy = this.subTargetY - this.subY;
    const vy = dy * 4.5;
    this.subY += vy * dt;
    this.subPitch = Math.max(-0.35, Math.min(0.35, vy * 0.0016));
    this.subRoll = Math.sin(this.waveOffset * 3) * 0.06 + this.subPitch * 0.4;

    // Cavitation Wake Bubbles with 3D Depth
    if (Math.random() < 0.65) {
      const propOffsetZ = (Math.random() - 0.5) * 20;
      this.wakeVortices.push({
        x: this.subX - 60,
        y: this.subY + Math.sin(this.waveOffset * 15) * 6,
        z: propOffsetZ,
        size: 3 + Math.random() * 6,
        alpha: 0.8,
        vx: -(this.currentSpeed * 0.4 + Math.random() * 80),
        vy: (Math.random() - 0.5) * 35
      });
    }

    for (let i = this.wakeVortices.length - 1; i >= 0; i--) {
      const v = this.wakeVortices[i];
      v.x += v.vx * dt;
      v.y += v.vy * dt;
      v.size += dt * 12;
      v.alpha -= dt * 1.5;
      if (v.alpha <= 0 || v.x < -50) {
        this.wakeVortices.splice(i, 1);
      }
    }

    // Update Sonar Pulse
    if (this.sonarActive) {
      this.sonarPulseRadius += 380 * dt;
      if (this.sonarPulseRadius > 580) {
        this.sonarActive = false;
      }
    }

    // Update Distant Parallax Creatures
    for (const c of this.distantCreatures) {
      c.x -= (c.speed + this.currentSpeed * 0.15) * dt;
      c.y += Math.sin(this.waveOffset * 1.2 + c.sinOffset) * 12 * dt;
      if (c.x < -300) {
        c.x = this.canvas.width + 300 + Math.random() * 400;
        c.y = 120 + Math.random() * 450;
      }
    }

    // Update Foreground Depth Particles
    for (const f of this.foregroundElements) {
      f.x -= (f.speed + this.currentSpeed * 1.4) * dt;
      if (f.x < -80) {
        f.x = this.canvas.width + 80 + Math.random() * 150;
        f.y = Math.random() * this.canvas.height;
      }
    }

    // Update Ambient Bubbles
    for (const b of this.bubbles) {
      b.y -= b.speed * dt;
      b.x -= this.currentSpeed * 0.3 * dt * b.z;
      if (b.y < -30) {
        b.y = this.canvas.height + 30;
        b.x = Math.random() * this.canvas.width;
      }
      if (b.x < -30) {
        b.x = this.canvas.width + 30;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Marine Life
    for (const f of this.fishSchool) {
      f.x += (f.vx - this.currentSpeed * 0.5) * dt;
      f.y += f.vy * dt + Math.sin(this.waveOffset * 3 + f.x * 0.05) * 8 * dt;
      if (f.x < -80) {
        f.x = this.canvas.width + 80 + Math.random() * 200;
        f.y = 80 + Math.random() * 560;
      }
    }

    // Collectibles Collision Check
    const subRadius = 40;
    for (const star of this.stars) {
      if (star.collected) continue;
      const screenStarX = star.worldX - this.distance;
      if (screenStarX > -50 && screenStarX < this.canvas.width + 50) {
        const dist = Math.hypot(this.subX - screenStarX, this.subY - star.y);
        if (dist < subRadius + 28) {
          star.collected = true;
          this.starsCollected++;
          Audio.playCollect();

          // Sparkle burst
          for (let k = 0; k < 16; k++) {
            this.particles.push({
              x: screenStarX,
              y: star.y,
              vx: (Math.random() - 0.5) * 240,
              vy: (Math.random() - 0.5) * 240,
              life: 0.65,
              color: star.type === "star" ? "#ffeb3b" : "#69f0ae",
              size: 5
            });
          }
        }
      }
    }

    // Boost Rings Collision Check
    for (const ring of this.boostRings) {
      if (ring.passed) continue;
      const screenRingX = ring.worldX - this.distance;
      if (screenRingX > -60 && screenRingX < this.canvas.width + 60) {
        const dist = Math.hypot(this.subX - screenRingX, this.subY - ring.y);
        if (dist < subRadius + ring.radius) {
          ring.passed = true;
          this.boostTimer = 2.4;
          this.shakeTime = 0.25;
          Audio.playTurboBoost();

          for (let k = 0; k < 22; k++) {
            this.particles.push({
              x: screenRingX,
              y: ring.y,
              vx: (Math.random() - 0.5) * 320,
              vy: (Math.random() - 0.5) * 320,
              life: 0.8,
              color: "#00e5ff",
              size: 6
            });
          }
        }
      }
    }

    // Obstacles Collision Check
    for (const obs of this.obstacles) {
      const screenObsX = obs.worldX - this.distance;
      if (screenObsX > -120 && screenObsX < this.canvas.width + 120) {
        const dx = Math.abs(this.subX - screenObsX);
        const dy = Math.abs(this.subY - obs.y);
        if (dx < subRadius + obs.width * 0.4 && dy < subRadius + obs.height * 0.4) {
          if (!this.isSlowedDown) {
            if (this.shieldCharges > 0) {
              this.shieldCharges--;
              this.shakeTime = 0.22;
              Audio.playConnect();
              for (let k = 0; k < 18; k++) {
                this.particles.push({
                  x: this.subX + 25,
                  y: this.subY,
                  vx: (Math.random() - 0.5) * 260,
                  vy: (Math.random() - 0.5) * 260,
                  life: 0.6,
                  color: "#00e5ff",
                  size: 6
                });
              }
            } else {
              this.isSlowedDown = true;
              this.slowDownTimer = 1.1;
              this.shakeTime = 0.38;
              Audio.playHit();

              for (let k = 0; k < 16; k++) {
                this.particles.push({
                  x: this.subX + 25,
                  y: this.subY,
                  vx: (Math.random() - 0.5) * 240,
                  vy: (Math.random() - 0.5) * 240,
                  life: 0.6,
                  color: "#ff7043",
                  size: 5
                });
              }
            }
          }
        }
      }
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
    }

    // Update Progress UI
    const progressEl = document.getElementById("ocean-rescue-travel-progress-bar") as HTMLProgressElement;
    const progressVal = document.getElementById("ocean-rescue-travel-progress-value");
    const percent = Math.min(100, Math.floor((this.distance / this.totalDistance) * 100));
    if (progressEl) progressEl.value = percent;
    if (progressVal) progressVal.textContent = `${percent}%`;

    if (this.distance >= this.totalDistance && !this.isCompleted) {
      this.isCompleted = true;
      this.stop();
      this.onArrival();
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Screen Shake effect
    if (this.shakeTime > 0) {
      const shakeX = (Math.random() - 0.5) * 14;
      const shakeY = (Math.random() - 0.5) * 14;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Deep Ocean Atmospheric Gradient
    this.renderAtmosphericBackground(ctx, w, h);

    // 2. Distant Deep Creatures Silhouette (Layer -2)
    this.renderDistantCreatures(ctx);

    // 3. Volumetric 3D Light Caustic Curtains
    this.renderVolumetricCaustics(ctx, w, h);

    // 4. Multi-Layer 2.5D Sea Floor Topography (Layer -1)
    this.renderParallaxSeaFloor(ctx, w, h);

    // 5. Background Marine Life (Fish & Jellyfish)
    this.renderMarineLife(ctx);

    // 6. 3D Holographic Boost Rings
    this.renderBoostRings(ctx);

    // 7. 3D Isometric Faceted Obstacles
    this.renderObstacles(ctx);

    // 8. 3D Spinning Stars & Bio-Orbs
    this.renderStars(ctx);

    // 9. Cavitation Wake Vortex Bubbles
    this.renderWakeVortices(ctx);

    // 10. 3D Volumetric Submarine (GUP) with Dynamic Drop Shadow & Lighting
    this.render2D5Submarine(ctx, h);

    // 11. Sonar Pulse Wave
    if (this.sonarActive) {
      ctx.save();
      ctx.strokeStyle = "rgba(77, 208, 225, 0.8)";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#4dd0e1";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.subX, this.subY, this.sonarPulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 12. Sparkle Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, (p.size || 4) * (p.life / 0.8)), 0, Math.PI * 2);
      ctx.fill();
    }

    // 13. Foreground Depth-of-Field Particles (Layer +1)
    this.renderForegroundDepthParticles(ctx);

    // 14. Speed Warp Lines during Turbo Boost
    if (this.boostTimer > 0) {
      this.renderSpeedLines(ctx, w, h);
    }

    // 15. Holographic Cockpit Telemetry HUD
    this.renderCockpitHUD(ctx, w, h);

    ctx.restore();
  }

  private renderAtmosphericBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (this.mission.environment === "coral-reef") {
      bgGrad.addColorStop(0, "#0e446c");
      bgGrad.addColorStop(0.4, "#082a46");
      bgGrad.addColorStop(1, "#031422");
    } else if (this.mission.environment === "kelp-forest") {
      bgGrad.addColorStop(0, "#084d42");
      bgGrad.addColorStop(0.4, "#052e28");
      bgGrad.addColorStop(1, "#021512");
    } else if (this.mission.environment === "deep-trench") {
      bgGrad.addColorStop(0, "#081b30");
      bgGrad.addColorStop(0.5, "#040e1a");
      bgGrad.addColorStop(1, "#01050a");
    } else if (this.mission.environment === "arctic-ocean") {
      bgGrad.addColorStop(0, "#0c3b5c");
      bgGrad.addColorStop(0.4, "#072338");
      bgGrad.addColorStop(1, "#02101b");
    } else {
      bgGrad.addColorStop(0, "#160731");
      bgGrad.addColorStop(0.5, "#0b0319");
      bgGrad.addColorStop(1, "#020006");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  }

  private renderDistantCreatures(ctx: CanvasRenderingContext2D) {
    for (const c of this.distantCreatures) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = "#80deea";

      if (c.type === "manta") {
        // Giant Manta Ray Silhouette gliding in the deep
        const wingFlap = Math.sin(this.waveOffset * 3 + c.sinOffset) * 12;
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.quadraticCurveTo(10, -35 + wingFlap, -40, -45 + wingFlap * 1.5);
        ctx.quadraticCurveTo(-20, 0, -40, 45 - wingFlap * 1.5);
        ctx.quadraticCurveTo(10, 35 - wingFlap, 40, 0);
        ctx.closePath();
        ctx.fill();

        // Long Tail
        ctx.strokeStyle = "#80deea";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-35, 0);
        ctx.lineTo(-90, 0);
        ctx.stroke();
      } else if (c.type === "whale") {
        // Distant Blue Whale silhouette
        ctx.beginPath();
        ctx.ellipse(0, 0, 85, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail fluke
        ctx.beginPath();
        ctx.moveTo(-75, 0);
        ctx.lineTo(-120, -20);
        ctx.lineTo(-110, 0);
        ctx.lineTo(-120, 20);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderVolumetricCaustics(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.globalAlpha = this.mission.environment === "abyssal-zone" ? 0.06 : 0.16;
    ctx.fillStyle = this.mission.environment === "arctic-ocean" ? "#b2ebf2" : "#80cbc4";

    const t = this.waveOffset * 0.8;
    for (let i = 0; i < 7; i++) {
      const rayX = (i * 240 + Math.sin(t + i * 1.2) * 80) % (w + 240) - 120;
      ctx.beginPath();
      ctx.moveTo(rayX, 0);
      ctx.lineTo(rayX + 130, 0);
      ctx.lineTo(rayX - 40, h);
      ctx.lineTo(rayX - 170, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private renderParallaxSeaFloor(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // 1. Deepest Layer (Slowest Parallax)
    const scrollFar = this.distance * 0.18;
    ctx.fillStyle = this.mission.environment === "coral-reef" ? "#062234" : "#02121e";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 50) {
      const gy = h - 110 + Math.sin((x + scrollFar) * 0.005) * 35;
      ctx.lineTo(x, gy);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 2. Mid Layer (Medium Parallax)
    const scrollMid = this.distance * 0.38;
    ctx.fillStyle = this.mission.environment === "coral-reef" ? "#0f384a" : "#062330";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 40) {
      const gy = h - 70 + Math.sin((x + scrollMid) * 0.009) * 25 + Math.cos((x + scrollMid) * 0.02) * 15;
      ctx.lineTo(x, gy);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // 3. 2.5D Kelp Stalks / Ice Crystals
    const scrollKelp = this.distance * 0.85;
    if (this.mission.environment === "arctic-ocean") {
      ctx.fillStyle = "rgba(128, 222, 234, 0.32)";
      for (let i = 0; i < 8; i++) {
        const iceX = (i * 180 - scrollKelp % (w + 200) + w + 200) % (w + 200) - 50;
        ctx.beginPath();
        ctx.moveTo(iceX, h);
        ctx.lineTo(iceX + 35, h - 90);
        ctx.lineTo(iceX + 70, h);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "rgba(46, 125, 50, 0.55)";
      for (let i = 0; i < 11; i++) {
        const kelpX = (i * 140 - scrollKelp % (w + 200) + w + 200) % (w + 200) - 50;
        const kelpBaseY = h - 25;
        const wave = Math.sin(this.waveOffset * 2.8 + i) * 28;

        ctx.beginPath();
        ctx.moveTo(kelpX - 14, kelpBaseY);
        ctx.quadraticCurveTo(kelpX + wave, kelpBaseY - 100, kelpX + wave * 1.7, kelpBaseY - 200);
        ctx.quadraticCurveTo(kelpX + wave * 0.6, kelpBaseY - 100, kelpX + 14, kelpBaseY);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private renderMarineLife(ctx: CanvasRenderingContext2D) {
    // School of Fish with 3D Depth Shading
    for (const f of this.fishSchool) {
      ctx.save();
      ctx.translate(f.x, f.y);
      const fishGrad = ctx.createLinearGradient(0, -f.size * 0.5, 0, f.size * 0.5);
      fishGrad.addColorStop(0, "#ffffff");
      fishGrad.addColorStop(0.5, f.color);
      fishGrad.addColorStop(1, "#0d47a1");
      ctx.fillStyle = fishGrad;

      ctx.beginPath();
      ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail fin
      ctx.beginPath();
      ctx.moveTo(f.size * 0.8, 0);
      ctx.lineTo(f.size * 1.4, -f.size * 0.4);
      ctx.lineTo(f.size * 1.4, f.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Translucent Luminous Jellyfish with Pulsing Bell
    for (const j of this.jellyfishList) {
      ctx.save();
      ctx.translate(j.x, j.y);
      const pulse = 1 + Math.sin(this.waveOffset * 3.5 + j.pulseOffset) * 0.18;

      ctx.shadowColor = j.color;
      ctx.shadowBlur = 18;

      // 3D Volumetric Jellyfish Bell
      const jGrad = ctx.createRadialGradient(0, -j.size * 0.3, 2, 0, 0, j.size * pulse);
      jGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      jGrad.addColorStop(0.6, j.color);
      jGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = jGrad;

      ctx.beginPath();
      ctx.arc(0, 0, j.size * pulse, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Flowing Tentacles
      ctx.strokeStyle = j.color;
      ctx.lineWidth = 2;
      for (let t = -2; t <= 2; t++) {
        const tx = t * (j.size * 0.35);
        const wave = Math.sin(this.waveOffset * 4.5 + t) * 10;
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.quadraticCurveTo(tx + wave, j.size * 0.9, tx - wave, j.size * 1.8);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderBoostRings(ctx: CanvasRenderingContext2D) {
    for (const ring of this.boostRings) {
      const screenX = ring.worldX - this.distance;
      if (screenX < -100 || screenX > this.canvas.width + 100) continue;

      ctx.save();
      ctx.translate(screenX, ring.y);
      const pulse = 1 + Math.sin(this.waveOffset * 6) * 0.12;

      ctx.shadowColor = ring.passed ? "#78909c" : "#00e5ff";
      ctx.shadowBlur = ring.passed ? 6 : 24;

      // 3D Holographic Torus Outer Rim
      ctx.strokeStyle = ring.passed ? "rgba(120, 144, 156, 0.35)" : "#00e5ff";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.radius * pulse, ring.radius * 0.65 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Core Ring
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, (ring.radius - 6) * pulse, (ring.radius * 0.65 - 4) * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (!ring.passed) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚡ TURBO", 0, 0);
      }

      ctx.restore();
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      const screenX = obs.worldX - this.distance;
      if (screenX < -150 || screenX > this.canvas.width + 150) continue;

      ctx.save();
      ctx.translate(screenX, obs.y);

      // 3D Drop Shadow behind obstacle
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.roundRect(-obs.width / 2 + 14, -obs.height / 2 + 14, obs.width, obs.height, 24);
      ctx.fill();

      // 3D Faceted Shading (Main Pillar)
      const obsGrad = ctx.createLinearGradient(-obs.width / 2, 0, obs.width / 2, 0);
      obsGrad.addColorStop(0, "#ffffff");
      obsGrad.addColorStop(0.25, obs.color);
      obsGrad.addColorStop(0.85, "#1b2838");
      obsGrad.addColorStop(1, "#0a1018");
      ctx.fillStyle = obsGrad;

      ctx.beginPath();
      ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 22);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3D Highlight Bevel on top
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.ellipse(0, -obs.height / 2 + 12, obs.width * 0.45, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Obstacle Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(obs.name, 0, obs.height / 2 + 22);

      ctx.restore();
    }
  }

  private renderStars(ctx: CanvasRenderingContext2D) {
    for (const s of this.stars) {
      if (s.collected) continue;
      const screenX = s.worldX - this.distance;
      if (screenX < -60 || screenX > this.canvas.width + 60) continue;

      ctx.save();
      ctx.translate(screenX, s.y);
      const floatY = Math.sin(this.waveOffset * 4 + s.worldX) * 8;
      ctx.translate(0, floatY);

      if (s.type === "star") {
        // 3D Spinning Star Coin
        const spinX = Math.cos(this.waveOffset * 5 + s.worldX * 0.01);
        ctx.scale(Math.abs(spinX) * 0.7 + 0.3, 1.0);

        ctx.shadowColor = "#ffd54f";
        ctx.shadowBlur = 20;

        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", 0, 0);
      } else {
        // 3D Glowing Bio-Orb with Orbital Rings
        ctx.shadowColor = "#69f0ae";
        ctx.shadowBlur = 22;

        // Core Sphere
        const orbGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 18);
        orbGrad.addColorStop(0, "#ffffff");
        orbGrad.addColorStop(0.5, "#00e676");
        orbGrad.addColorStop(1, "#004d40");
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // 3D Revolving Orbital Rings
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 8, this.waveOffset * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderWakeVortices(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const v of this.wakeVortices) {
      ctx.fillStyle = `rgba(180, 235, 255, ${v.alpha})`;
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private render2D5Submarine(ctx: CanvasRenderingContext2D, h: number) {
    // 1. 2.5D Dynamic Ground Shadow (Projected onto Sea Bed)
    const altitude = h - 60 - this.subY;
    const shadowScale = Math.max(0.4, 1.2 - altitude / 600);
    const shadowAlpha = Math.max(0.1, 0.5 - altitude / 800);

    ctx.save();
    ctx.translate(this.subX, h - 50);
    ctx.scale(shadowScale, shadowScale * 0.35);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Submarine Body with 2.5D Pitch and Roll Transformation
    ctx.save();
    ctx.translate(this.subX, this.subY);
    ctx.rotate(this.subPitch);
    ctx.transform(1, this.subRoll * 0.3, 0, 1, 0, 0); // 2.5D Banking Skew

    // Dual Volumetric Searchlight Beams (Illuminates Ahead)
    ctx.save();
    ctx.globalAlpha = 0.28;
    const beamGrad = ctx.createLinearGradient(38, 0, 320, 0);
    beamGrad.addColorStop(0, "rgba(255, 255, 220, 0.95)");
    beamGrad.addColorStop(0.35, "rgba(255, 255, 220, 0.4)");
    beamGrad.addColorStop(1, "rgba(255, 255, 220, 0)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(38, -12);
    ctx.lineTo(320, -85);
    ctx.lineTo(320, 85);
    ctx.lineTo(38, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Shield Dome if Active
    if (this.shieldCharges > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 229, 255, 0.85)";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 48, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3D Volumetric Submarine Hull
    const hullGrad = ctx.createLinearGradient(0, -38, 0, 38);
    hullGrad.addColorStop(0, "#ffffff");
    hullGrad.addColorStop(0.18, this.gup.color);
    hullGrad.addColorStop(0.85, "#0b263d");
    hullGrad.addColorStop(1, "#03101c");
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 64, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Metallic Accent Stripe
    const stripeGrad = ctx.createLinearGradient(0, 0, 0, 22);
    stripeGrad.addColorStop(0, this.gup.accentColor);
    stripeGrad.addColorStop(1, "#051829");
    ctx.fillStyle = stripeGrad;
    ctx.beginPath();
    ctx.ellipse(0, 9, 56, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Glass Cockpit Dome (Spherical Highlight & Inner Pilot)
    const domeGrad = ctx.createRadialGradient(28, -6, 2, 28, -6, 24);
    domeGrad.addColorStop(0, "#ffffff");
    domeGrad.addColorStop(0.4, "#80deea");
    domeGrad.addColorStop(0.85, "#00838f");
    domeGrad.addColorStop(1, "#004d40");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(28, -5, 22, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Companion Avatar inside Cockpit (Bobbing Pilot)
    const pilotBob = Math.sin(this.waveOffset * 6) * 1.5;
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.mission.companionAvatar, 24, -5 + pilotBob);

    // 3D Rotating Propeller with Cavitation Blur
    const propAngle = this.distance * 0.25;
    ctx.fillStyle = "#90a4ae";
    ctx.save();
    ctx.translate(-64, 0);
    ctx.rotate(propAngle);
    ctx.fillRect(-4, -22, 8, 44);
    ctx.restore();

    // Periscope / Antenna
    ctx.fillStyle = this.gup.color;
    ctx.beginPath();
    ctx.roundRect(-8, -48, 16, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#ffd54f";
    ctx.shadowColor = "#ffd54f";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -48, 7, 0, Math.PI * 2);
    ctx.fill();

    // GUP Identification Name
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.gup.name.split(" ")[0], -4, 5);

    ctx.restore();
  }

  private renderForegroundDepthParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const f of this.foregroundElements) {
      ctx.fillStyle = `rgba(200, 245, 255, ${f.alpha})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderSpeedLines(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 18; i++) {
      const lineY = (i * 45 + Math.sin(this.waveOffset * 12 + i) * 35) % h;
      const lineX = w - ((this.distance * 3.5 + i * 140) % (w + 400));
      ctx.beginPath();
      ctx.moveTo(lineX, lineY);
      ctx.lineTo(lineX - 160, lineY);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderCockpitHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // 1. Mini-Radar Hologram at Top-Right
    const radarW = 220;
    const radarH = 38;
    const radarX = w - radarW - 24;
    const radarY = 20;

    ctx.fillStyle = "rgba(6, 22, 40, 0.94)";
    ctx.strokeStyle = "rgba(77, 208, 225, 0.65)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(radarX, radarY, radarW, radarH, 12);
    ctx.fill();
    ctx.stroke();

    // Radar Track
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.moveTo(radarX + 14, radarY + radarH / 2);
    ctx.lineTo(radarX + radarW - 14, radarY + radarH / 2);
    ctx.stroke();

    const subProgress = Math.min(1, this.distance / this.totalDistance);
    const subRadarX = radarX + 14 + subProgress * (radarW - 28);
    ctx.fillStyle = "#ffd54f";
    ctx.shadowColor = "#ffd54f";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(subRadarX, radarY + radarH / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚩", radarX + radarW - 12, radarY + radarH / 2);

    // 2. Cockpit Telemetry at Top-Left
    ctx.fillStyle = "rgba(6, 22, 40, 0.94)";
    ctx.strokeStyle = "rgba(77, 208, 225, 0.65)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(24, 20, 260, 56, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#80deea";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`수심: ${this.mission.depthMeters}m | 속도: ${Math.round(this.currentSpeed * 0.1)} knot`, 38, 42);

    ctx.fillStyle = "#ffd54f";
    ctx.fillText(`⭐ 획득: ${this.starsCollected} / ${this.totalStarsCount}`, 38, 62);

    if (this.shieldCharges > 0) {
      ctx.fillStyle = "#00e5ff";
      ctx.fillText(`🛡️ 실드: ${this.shieldCharges}`, 175, 62);
    }

    // 3. Sonar Control Button Prompt at Bottom-Left
    ctx.fillStyle = "rgba(6, 22, 40, 0.92)";
    ctx.strokeStyle = "rgba(77, 208, 225, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(24, h - 70, 185, 46, 23);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📡 소나 탐색 (Space)", 116, h - 43);

    ctx.restore();
  }
}
