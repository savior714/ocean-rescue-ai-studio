import {
  GupData,
  MissionData,
  TravelObstacle,
  BoostRing,
  FishBoid,
  JellyfishEntity,
  CurrentStream,
  SonarEchoPoint,
  StarCollectible,
  GupUpgrades
} from "./types";
import { Audio } from "./audio";
import { RescueReadiness } from "./travel/readiness";
import { renderGupSubmarine } from "./render-gup";

interface BackgroundDistantCreature {
  x: number;
  y: number;
  speed: number;
  scale: number;
  type: "manta" | "whale" | "shark";
  alpha: number;
  sinOffset: number;
}

interface BubbleParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  z: number;
}

interface WakeVortex {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
}

export class TravelEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mission: MissionData;
  private gup: GupData;
  private upgrades: GupUpgrades;
  private onArrival: () => void;
  private onStarCollected?: (stars: number) => void;

  // Submarine 2.5D Position & Physics
  public subX = 260;
  public subY = 360;
  public subTargetX = 260;
  public subTargetY = 360;
  public subPitch = 0; // tilt angle
  public subRoll = 0;

  public baseSpeed = 130;
  public currentSpeed = 130;
  public distance = 0;
  public totalDistance = 2200; // Total nautical meters
  public isCompleted = false;

  // Steering & Input
  private isPointerDown = false;
  private isPiloting = false;
  private pilotInactivityTimer = 0;

  // Star Collectibles, Currents, Obstacles, Boosts & Sonar
  private starCollectibles: StarCollectible[] = [];
  public collectedStarsInRun = 0;
  private currentStreams: CurrentStream[] = [];
  private obstacles: TravelObstacle[] = [];
  private boostRings: BoostRing[] = [];
  private sonarEchoes: SonarEchoPoint[] = [];

  // Shield & Hull
  public shieldEnergy = 100;
  public maxShield = 100;

  // Environmental Living Ocean
  private fishSchool: FishBoid[] = [];
  private jellyfishList: JellyfishEntity[] = [];
  private distantCreatures: BackgroundDistantCreature[] = [];
  private bubbles: BubbleParticle[] = [];
  private wakeVortices: WakeVortex[] = [];
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }> = [];

  // Feedback FX
  private boostTimer = 0;
  private collisionTimer = 0;
  private screenShake = 0;
  private sonarPulseRadius = 0;
  public sonarActive = false;
  private sonarCooldown = 0;
  private isInCurrentStream = false;

  // Milestone Notification Banners
  private milestoneBannerText = "";
  private milestoneBannerTimer = 0;

  // Animation Frame Handle
  private animId: number | null = null;
  private lastTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    gup: GupData,
    upgrades: GupUpgrades = { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 },
    onArrival: () => void,
    onStarCollected?: (stars: number) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context from canvas");
    this.ctx = context;
    this.mission = mission;
    this.gup = gup;
    this.upgrades = upgrades;
    this.onArrival = onArrival;
    this.onStarCollected = onStarCollected;

    // Apply GUP Upgrades
    const speedBonus = 1.0 + (this.upgrades.speedLevel - 1) * 0.15;
    this.baseSpeed = 130 * this.gup.baseSpeedMultiplier * speedBonus;
    this.currentSpeed = this.baseSpeed;
    this.maxShield = 100 + (this.upgrades.shieldLevel - 1) * 25;
    this.shieldEnergy = this.maxShield;

    // Initialize readiness state
    RescueReadiness.reset();

    this.initWorld();
    this.bindControls();
  }

  private initWorld() {
    this.distance = 0;
    this.isCompleted = false;
    this.subX = 240;
    this.subY = this.canvas.height / 2;
    this.subTargetX = this.subX;
    this.subTargetY = this.subY;
    this.collectedStarsInRun = 0;

    // 1. Generate Star Collectibles along the path
    this.starCollectibles = [];
    for (let x = 400; x < this.totalDistance; x += 180 + Math.random() * 120) {
      this.starCollectibles.push({
        id: `star-${x}`,
        worldX: x,
        y: 120 + Math.random() * (this.canvas.height - 240),
        collected: false,
        size: 14 + Math.random() * 6,
        glowPhase: Math.random() * Math.PI * 2
      });
    }

    // 2. Generate Hydrodynamic Current Streams
    this.currentStreams = [
      { id: "c1", worldX: 350, y: 160, width: 450, height: 110, flowSpeed: 190 },
      { id: "c2", worldX: 1000, y: 380, width: 520, height: 120, flowSpeed: 210 },
      { id: "c3", worldX: 1650, y: 220, width: 480, height: 115, flowSpeed: 230 }
    ];

    // 3. Generate Boost Acceleration Rings
    this.boostRings = [
      { id: "br1", worldX: 620, y: 220, passed: false, radius: 46 },
      { id: "br2", worldX: 1280, y: 440, passed: false, radius: 46 },
      { id: "br3", worldX: 1880, y: 280, passed: false, radius: 46 }
    ];

    // 4. Generate Thematic Obstacles with safe lane gaps
    this.obstacles = [];
    const kinds: Array<TravelObstacle["kind"]> = ["coral", "rock", "jellyfish", "mine", "plastic_bag"];
    for (let x = 500; x < this.totalDistance - 250; x += 320 + Math.random() * 180) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const y = 140 + Math.random() * (this.canvas.height - 280);
      this.obstacles.push({
        id: `obs-${x}`,
        worldX: x,
        y: y,
        width: 60,
        height: 60,
        kind: kind,
        color: kind === "mine" ? "#f44336" : kind === "jellyfish" ? "#e91e63" : "#00bcd4",
        name: kind === "mine" ? "해저 기뢰" : kind === "jellyfish" ? "형광 해파리 군집" : "날카로운 산호초",
        hitAnim: 0
      });
    }

    // 5. Generate Sonar Waypoints & Echoes
    this.sonarEchoes = [
      { id: "s1", worldX: 550, y: 280, discovered: false, type: "creature", name: "산호초 무리 신호" },
      { id: "s2", worldX: 1200, y: 350, discovered: false, type: "star_cluster", name: "별빛 크리스탈 군집" },
      { id: "s3", worldX: 1800, y: 420, discovered: false, type: "waypoint", name: "조난 신호 근접점" },
      { id: "s4", worldX: 2300, y: 360, discovered: false, type: "signal", name: `${this.mission.animalName} 구조 좌표` }
    ];

    // 6. Ambient Bio-luminescent Fauna
    this.fishSchool = [];
    for (let i = 0; i < 28; i++) {
      this.fishSchool.push({
        x: Math.random() * this.canvas.width,
        y: 80 + Math.random() * (this.canvas.height - 160),
        vx: 30 + Math.random() * 50,
        vy: (Math.random() - 0.5) * 12,
        size: 5 + Math.random() * 7,
        color: Math.random() > 0.5 ? "#ffd54f" : "#4dd0e1"
      });
    }

    this.jellyfishList = [];
    for (let i = 0; i < 8; i++) {
      this.jellyfishList.push({
        x: Math.random() * this.canvas.width,
        y: 100 + Math.random() * (this.canvas.height - 200),
        size: 16 + Math.random() * 18,
        color: i % 2 === 0 ? "rgba(233, 30, 99, 0.7)" : "rgba(0, 229, 255, 0.7)",
        pulseOffset: Math.random() * Math.PI * 2,
        speedY: (Math.random() - 0.5) * 15
      });
    }

    this.distantCreatures = [
      { x: 300, y: 200, speed: 25, scale: 0.6, type: "manta", alpha: 0.25, sinOffset: 0 },
      { x: 900, y: 450, speed: 32, scale: 0.8, type: "whale", alpha: 0.2, sinOffset: 1.5 }
    ];

    this.bubbles = [];
    for (let i = 0; i < 40; i++) {
      this.bubbles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 2 + Math.random() * 6,
        speed: 25 + Math.random() * 45,
        alpha: 0.2 + Math.random() * 0.5,
        z: Math.random()
      });
    }
  }

  private bindControls() {
    const updateTarget = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const targetX = (clientX - rect.left) * scaleX;
      const targetY = (clientY - rect.top) * scaleY;

      // Keep submarine within bounds
      this.subTargetX = Math.max(100, Math.min(this.canvas.width - 200, targetX));
      this.subTargetY = Math.max(80, Math.min(this.canvas.height - 80, targetY));
      this.isPiloting = true;
      this.pilotInactivityTimer = 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      this.isPointerDown = true;
      updateTarget(e.clientX, e.clientY);
      Audio.playBubble();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.isPointerDown) {
        updateTarget(e.clientX, e.clientY);
      }
    };

    const onPointerUp = () => {
      this.isPointerDown = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const step = 45;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        this.subTargetY = Math.max(80, this.subTargetY - step);
        this.isPiloting = true;
        this.pilotInactivityTimer = 0;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        this.subTargetY = Math.min(this.canvas.height - 80, this.subTargetY + step);
        this.isPiloting = true;
        this.pilotInactivityTimer = 0;
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this.subTargetX = Math.max(100, this.subTargetX - step);
        this.isPiloting = true;
        this.pilotInactivityTimer = 0;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this.subTargetX = Math.min(this.canvas.width - 200, this.subTargetX + step);
        this.isPiloting = true;
        this.pilotInactivityTimer = 0;
      } else if (e.key === " " || e.key === "Enter") {
        this.triggerSonar();
      }
    };

    this.canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
  }

  public triggerSonar() {
    if (this.sonarCooldown > 0) return;
    this.sonarActive = true;
    this.sonarPulseRadius = 10;
    const sonarBonus = 1.0 + (this.upgrades.sonarLevel - 1) * 0.35;
    this.sonarCooldown = Math.max(1.5, 3.5 / sonarBonus);
    Audio.playSonarPing();

    RescueReadiness.onScan();
    this.spawnSparks(this.subX + 40, this.subY, "#00e5ff", 14);

    // Reveal nearby echo points
    this.sonarEchoes.forEach((echo) => {
      const screenX = echo.worldX - this.distance;
      if (screenX > -100 && screenX < this.canvas.width + 100) {
        echo.discovered = true;
      }
    });
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.update(dt);
      this.render();

      if (!this.isCompleted) {
        this.animId = requestAnimationFrame(loop);
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private update(dt: number) {
    if (this.isCompleted) return;

    // Pilot inactivity decay
    this.pilotInactivityTimer += dt;
    if (this.pilotInactivityTimer > 1.2) {
      this.isPiloting = false;
    }

    // Cooldown timers
    if (this.sonarCooldown > 0) this.sonarCooldown -= dt;
    if (this.sonarActive) {
      this.sonarPulseRadius += dt * 480;
      if (this.sonarPulseRadius > 700) {
        this.sonarActive = false;
      }
    }
    if (this.boostTimer > 0) this.boostTimer -= dt;
    if (this.collisionTimer > 0) this.collisionTimer -= dt;
    if (this.screenShake > 0) this.screenShake -= dt * 25;
    if (this.milestoneBannerTimer > 0) this.milestoneBannerTimer -= dt;

    // Shield regeneration
    if (this.shieldEnergy < this.maxShield && this.collisionTimer <= 0) {
      this.shieldEnergy = Math.min(this.maxShield, this.shieldEnergy + dt * 8);
    }

    // 1. Submarine Smooth Interpolation Steering (2D direct navigation)
    const prevSubY = this.subY;
    const lerpSpeed = 6.5;
    this.subX += (this.subTargetX - this.subX) * lerpSpeed * dt;
    this.subY += (this.subTargetY - this.subY) * lerpSpeed * dt;

    const deltaY = this.subY - prevSubY;
    this.subPitch = Math.max(-0.25, Math.min(0.25, deltaY * 0.035));

    // 2. Current Stream Interaction
    this.isInCurrentStream = false;
    let streamSpeedBoost = 0;
    this.currentStreams.forEach((stream) => {
      const streamScreenX = stream.worldX - this.distance;
      if (
        this.subX >= streamScreenX &&
        this.subX <= streamScreenX + stream.width &&
        this.subY >= stream.y - stream.height / 2 &&
        this.subY <= stream.y + stream.height / 2
      ) {
        this.isInCurrentStream = true;
        streamSpeedBoost = stream.flowSpeed;
      }
    });

    // 3. Compute Forward Speed
    let targetSpeed = this.baseSpeed;
    if (this.isPiloting) targetSpeed += 35;
    if (this.isInCurrentStream) targetSpeed += streamSpeedBoost;
    if (this.boostTimer > 0) targetSpeed += 220;
    if (this.collisionTimer > 0) targetSpeed *= 0.65;

    this.currentSpeed += (targetSpeed - this.currentSpeed) * 4.0 * dt;
    this.distance += this.currentSpeed * dt;

    // Readiness update on distance travel
    RescueReadiness.step(dt * 1000, this.isPiloting, this.isInCurrentStream);

    // Check Milestones for notifications
    const readiness = RescueReadiness.getSnapshot();
    if (readiness.cutter && !readiness.searchlight) {
      this.showMilestoneBanner("⚡ 고출력 구조 절단기 (Rescue Cutter) 가동 완료!");
    } else if (readiness.thruster && !readiness.searchlight) {
      this.showMilestoneBanner("🚀 터보 추진기 (Turbo Thruster) 최대 출력!");
    } else if (readiness.searchlight && this.milestoneBannerText === "") {
      this.showMilestoneBanner("💡 심해 탐조등 (Searchlight) 준비 완료!");
    }

    // 4. Star Collectibles Collision
    this.starCollectibles.forEach((star) => {
      if (star.collected) return;
      const screenX = star.worldX - this.distance;
      const dist = Math.hypot(this.subX - screenX, this.subY - star.y);
      if (dist < 55) {
        star.collected = true;
        this.collectedStarsInRun++;
        Audio.playStarCollect();
        this.spawnSparks(this.subX, this.subY, "#ffd54f", 12);
        if (this.onStarCollected) {
          this.onStarCollected(1);
        }
      }
    });

    // 5. Boost Rings Check
    this.boostRings.forEach((ring) => {
      if (ring.passed) return;
      const ringScreenX = ring.worldX - this.distance;
      if (Math.abs(this.subX - ringScreenX) < 35 && Math.abs(this.subY - ring.y) < ring.radius) {
        ring.passed = true;
        this.boostTimer = 1.8;
        this.screenShake = 6;
        Audio.playBoost();
        RescueReadiness.onBoost();
        this.spawnSparks(this.subX + 40, this.subY, "#00e5ff", 20);
      }
    });

    // 6. Obstacles Collision Check
    this.obstacles.forEach((obs) => {
      const obsScreenX = obs.worldX - this.distance;
      const dist = Math.hypot(this.subX - obsScreenX, this.subY - obs.y);
      if (dist < 48 && this.collisionTimer <= 0) {
        this.collisionTimer = 0.8;
        this.screenShake = 12;
        this.shieldEnergy = Math.max(0, this.shieldEnergy - 25);
        obs.hitAnim = 0.5;
        Audio.playCollision();
        RescueReadiness.onCollision();
        this.spawnSparks(this.subX, this.subY, "#ff5252", 18);
      }
      if (obs.hitAnim && obs.hitAnim > 0) {
        obs.hitAnim -= dt;
      }
    });

    // 7. Ambient Particle Spawns
    if (Math.random() < 0.8) {
      this.wakeVortices.push({
        x: this.subX - 45,
        y: this.subY + (Math.random() - 0.5) * 12,
        size: 8 + Math.random() * 10,
        alpha: 0.7,
        vx: -this.currentSpeed * 0.4,
        vy: (Math.random() - 0.5) * 10,
        life: 0.6
      });
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

    // Update Wake Vortices
    for (let i = this.wakeVortices.length - 1; i >= 0; i--) {
      const v = this.wakeVortices[i];
      v.x += v.vx * dt;
      v.y += v.vy * dt;
      v.size += dt * 25;
      v.alpha -= dt * 1.2;
      v.life -= dt;
      if (v.life <= 0 || v.alpha <= 0) {
        this.wakeVortices.splice(i, 1);
      }
    }

    // Update Bubbles
    this.bubbles.forEach((b) => {
      b.y -= b.speed * dt;
      b.x -= this.currentSpeed * 0.15 * dt;
      if (b.y < -20) {
        b.y = this.canvas.height + 20;
        b.x = Math.random() * this.canvas.width;
      }
      if (b.x < -20) {
        b.x = this.canvas.width + 20;
      }
    });

    // Update Fish
    this.fishSchool.forEach((f) => {
      f.x -= (this.currentSpeed * 0.35 + f.vx) * dt;
      f.y += f.vy * dt;
      if (f.x < -40) {
        f.x = this.canvas.width + 40;
        f.y = 80 + Math.random() * (this.canvas.height - 160);
      }
    });

    // Check Arrival
    if (this.distance >= this.totalDistance && !this.isCompleted) {
      this.isCompleted = true;
      Audio.playOctoAlert();
      setTimeout(() => {
        this.onArrival();
      }, 500);
    }
  }

  private spawnSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        color: color,
        size: 3 + Math.random() * 4
      });
    }
  }

  private showMilestoneBanner(text: string) {
    this.milestoneBannerText = text;
    this.milestoneBannerTimer = 3.0;
  }

  private render() {
    this.ctx.save();

    // Screen shake on boost/hit
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    const width = this.canvas.width;
    const height = this.canvas.height;

    // 1. Water Gradient Background according to depth
    const depthProgress = Math.min(1.0, this.distance / this.totalDistance);
    const grad = this.ctx.createLinearGradient(0, 0, 0, height);
    if (this.mission.environment === "coral-reef") {
      grad.addColorStop(0, "#006994");
      grad.addColorStop(1, "#003366");
    } else if (this.mission.environment === "kelp-forest" || this.mission.environment === "kelp-shore") {
      grad.addColorStop(0, "#004d40");
      grad.addColorStop(1, "#00251a");
    } else {
      // Deep trench / abyssal zone
      grad.addColorStop(0, "#011627");
      grad.addColorStop(1, "#000814");
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, width, height);

    // 2. Underwater Sunbeams (God Rays)
    if (this.mission.depthMeters < 100) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.08 * (1 - depthProgress * 0.5);
      this.ctx.fillStyle = "#e0f7fa";
      for (let i = 0; i < 5; i++) {
        this.ctx.beginPath();
        const startX = 150 + i * 220;
        this.ctx.moveTo(startX, 0);
        this.ctx.lineTo(startX + 140, height);
        this.ctx.lineTo(startX + 80, height);
        this.ctx.lineTo(startX - 60, 0);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 3. Current Streams Visual
    this.currentStreams.forEach((c) => {
      const screenX = c.worldX - this.distance;
      if (screenX + c.width > 0 && screenX < width) {
        this.ctx.save();
        const cGrad = this.ctx.createLinearGradient(screenX, 0, screenX + c.width, 0);
        cGrad.addColorStop(0, "rgba(0, 229, 255, 0.05)");
        cGrad.addColorStop(0.5, "rgba(0, 229, 255, 0.22)");
        cGrad.addColorStop(1, "rgba(0, 229, 255, 0.05)");
        this.ctx.fillStyle = cGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(screenX, c.y - c.height / 2, c.width, c.height, 24);
        this.ctx.fill();

        // Flow lines
        this.ctx.strokeStyle = "rgba(128, 222, 234, 0.4)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([12, 16]);
        this.ctx.lineDashOffset = -performance.now() * 0.06;
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, c.y);
        this.ctx.lineTo(screenX + c.width, c.y);
        this.ctx.stroke();
        this.ctx.restore();
      }
    });

    // 4. Boost Acceleration Rings Visual
    this.boostRings.forEach((ring) => {
      const screenX = ring.worldX - this.distance;
      if (screenX > -100 && screenX < width + 100) {
        this.ctx.save();
        this.ctx.strokeStyle = ring.passed ? "#4caf50" : "#ffd54f";
        this.ctx.lineWidth = 5;
        this.ctx.shadowColor = ring.passed ? "#81c784" : "#ffb300";
        this.ctx.shadowBlur = 16;
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, ring.y, 16, ring.radius, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner glowing core
        this.ctx.fillStyle = ring.passed ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 213, 79, 0.25)";
        this.ctx.fill();
        this.ctx.restore();
      }
    });

    // 5. Star Collectibles Visual
    this.starCollectibles.forEach((star) => {
      if (star.collected) return;
      const screenX = star.worldX - this.distance;
      if (screenX > -50 && screenX < width + 50) {
        this.ctx.save();
        const pulse = 1.0 + Math.sin(performance.now() * 0.005 + star.glowPhase) * 0.18;
        this.ctx.translate(screenX, star.y);
        this.ctx.scale(pulse, pulse);

        // Glowing Star Aura
        this.ctx.shadowColor = "#ffd54f";
        this.ctx.shadowBlur = 18;
        this.ctx.fillStyle = "#fff9c4";
        this.ctx.font = "24px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("⭐️", 0, 0);
        this.ctx.restore();
      }
    });

    // 6. Obstacles Visual
    this.obstacles.forEach((obs) => {
      const screenX = obs.worldX - this.distance;
      if (screenX > -100 && screenX < width + 100) {
        this.ctx.save();
        this.ctx.translate(screenX, obs.y);

        if (obs.kind === "mine") {
          this.ctx.fillStyle = "#37474f";
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
          this.ctx.fill();
          // Spikes
          this.ctx.strokeStyle = "#f44336";
          this.ctx.lineWidth = 3;
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
            this.ctx.lineTo(Math.cos(angle) * 32, Math.sin(angle) * 32);
            this.ctx.stroke();
          }
          // Blinking light
          const blink = (Math.sin(performance.now() * 0.01) + 1) / 2;
          this.ctx.fillStyle = `rgba(244, 67, 54, ${0.4 + blink * 0.6})`;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (obs.kind === "jellyfish") {
          this.ctx.fillStyle = "rgba(233, 30, 99, 0.85)";
          this.ctx.shadowColor = "#f06292";
          this.ctx.shadowBlur = 14;
          this.ctx.beginPath();
          this.ctx.arc(0, -6, 20, Math.PI, 0, false);
          this.ctx.fill();
          // Tentacles
          this.ctx.strokeStyle = "rgba(244, 143, 177, 0.7)";
          this.ctx.lineWidth = 2;
          for (let i = -14; i <= 14; i += 7) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, -6);
            this.ctx.quadraticCurveTo(i + Math.sin(performance.now() * 0.005 + i) * 6, 12, i, 26);
            this.ctx.stroke();
          }
        } else {
          // Coral rock
          this.ctx.fillStyle = "#00838f";
          this.ctx.beginPath();
          this.ctx.roundRect(-24, -24, 48, 48, 12);
          this.ctx.fill();
          this.ctx.strokeStyle = "#4dd0e1";
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }
        this.ctx.restore();
      }
    });

    // 7. Ambient Fish & Jellyfish
    this.fishSchool.forEach((f) => {
      this.ctx.save();
      this.ctx.fillStyle = f.color;
      this.ctx.beginPath();
      this.ctx.ellipse(f.x, f.y, f.size * 1.5, f.size * 0.7, 0, 0, Math.PI * 2);
      this.ctx.fill();
      // Tail
      this.ctx.beginPath();
      this.ctx.moveTo(f.x + f.size, f.y);
      this.ctx.lineTo(f.x + f.size * 2, f.y - f.size * 0.6);
      this.ctx.lineTo(f.x + f.size * 2, f.y + f.size * 0.6);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 8. Wake Vortices
    this.wakeVortices.forEach((v) => {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(178, 235, 242, ${v.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(v.x, v.y, v.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 9. Submarine Headlight Beam (Casting light into the deep)
    const lightBonus = 1.0 + (this.upgrades.lightLevel - 1) * 0.3;
    const beamLength = 460 * lightBonus;
    this.ctx.save();
    const beamGrad = this.ctx.createRadialGradient(
      this.subX + 45,
      this.subY,
      10,
      this.subX + 45 + beamLength * 0.6,
      this.subY,
      beamLength
    );
    beamGrad.addColorStop(0, "rgba(255, 255, 230, 0.45)");
    beamGrad.addColorStop(0.3, "rgba(255, 255, 200, 0.2)");
    beamGrad.addColorStop(1, "rgba(255, 255, 200, 0.0)");

    this.ctx.fillStyle = beamGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(this.subX + 40, this.subY);
    this.ctx.arc(this.subX + 40, this.subY, beamLength, -0.22, 0.22);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 10. Draw GUP Submarine (High-Fidelity Procedural Modeling)
    this.ctx.save();
    this.ctx.translate(this.subX, this.subY);
    renderGupSubmarine(this.ctx, {
      gupId: this.gup.id,
      color: this.gup.color,
      accentColor: this.gup.accentColor,
      subPitch: this.subPitch,
      currentSpeed: this.currentSpeed,
      isBoosting: this.boostTimer > 0,
      boostTimer: this.boostTimer,
      shieldEnergy: this.shieldEnergy,
      maxShield: this.maxShield,
      companionAvatar: this.mission.companionAvatar,
      scale: 1.15,
      isDocked: false,
      time: performance.now()
    });
    this.ctx.restore();

    // 11. Sonar Pulse Effect
    if (this.sonarActive) {
      this.ctx.save();
      this.ctx.strokeStyle = `rgba(0, 229, 255, ${Math.max(0, 1 - this.sonarPulseRadius / 700)})`;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(this.subX, this.subY, this.sonarPulseRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 12. Particles (Sparks & Bubbles)
    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 13. HUD & Cockpit Telemetry
    this.renderHUD(width, height);

    this.ctx.restore();
  }

  private renderHUD(width: number, height: number) {
    // Progress Meter at Top Center
    const progress = Math.min(1.0, this.distance / this.totalDistance);
    const meterWidth = 360;
    const meterX = (width - meterWidth) / 2;
    const meterY = 24;

    this.ctx.save();
    // Glass HUD Backing
    this.ctx.fillStyle = "rgba(8, 24, 44, 0.85)";
    this.ctx.strokeStyle = "rgba(77, 208, 225, 0.5)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(meterX - 16, meterY - 14, meterWidth + 32, 54, 16);
    this.ctx.fill();
    this.ctx.stroke();

    // Progress Bar Track
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    this.ctx.beginPath();
    this.ctx.roundRect(meterX, meterY + 12, meterWidth, 10, 5);
    this.ctx.fill();

    // Progress Fill
    this.ctx.fillStyle = "linear-gradient(90deg, #4dd0e1, #ffd54f)";
    this.ctx.beginPath();
    this.ctx.roundRect(meterX, meterY + 12, meterWidth * progress, 10, 5);
    this.ctx.fill();

    // Text & Indicators
    this.ctx.fillStyle = "#e0f7fa";
    this.ctx.font = "bold 13px sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`🚨 ${this.mission.title}`, meterX, meterY + 4);

    this.ctx.textAlign = "right";
    this.ctx.fillStyle = "#ffd54f";
    this.ctx.fillText(`${Math.round(progress * 100)}% (${Math.round(this.distance)}m / ${this.totalDistance}m)`, meterX + meterWidth, meterY + 4);

    // Left HUD: Speed & Depth & Collected Stars
    this.ctx.fillStyle = "rgba(8, 24, 44, 0.85)";
    this.ctx.beginPath();
    this.ctx.roundRect(24, height - 120, 220, 96, 14);
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(77, 208, 225, 0.4)";
    this.ctx.stroke();

    this.ctx.fillStyle = "#80deea";
    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText("⚡ 추진 속도", 38, height - 98);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.fillText(`${Math.round(this.currentSpeed)} knots`, 38, height - 80);

    this.ctx.fillStyle = "#80deea";
    this.ctx.font = "12px sans-serif";
    this.ctx.fillText("⭐️ 수집한 별", 140, height - 98);
    this.ctx.fillStyle = "#ffd54f";
    this.ctx.font = "bold 15px sans-serif";
    this.ctx.fillText(`+${this.collectedStarsInRun}개`, 140, height - 80);

    // Shield Bar
    this.ctx.fillStyle = "#cfd8dc";
    this.ctx.font = "11px sans-serif";
    this.ctx.fillText("🛡️ 에너지 실드", 38, height - 52);
    this.ctx.fillStyle = "rgba(255,255,255,0.2)";
    this.ctx.fillRect(38, height - 44, 190, 8);
    this.ctx.fillStyle = this.shieldEnergy > 30 ? "#00e5ff" : "#ff5252";
    this.ctx.fillRect(38, height - 44, 190 * (this.shieldEnergy / this.maxShield), 8);

    // Milestone Banner Popups
    if (this.milestoneBannerTimer > 0 && this.milestoneBannerText) {
      const bannerWidth = 480;
      const bx = (width - bannerWidth) / 2;
      const by = 88;
      this.ctx.fillStyle = "rgba(14, 38, 66, 0.95)";
      this.ctx.strokeStyle = "#ffd54f";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(bx, by, bannerWidth, 42, 20);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 14px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.milestoneBannerText, width / 2, by + 26);
    }

    this.ctx.restore();
  }
}
