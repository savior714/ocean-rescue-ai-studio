import {
  MissionData,
  GupData,
  CurrentStream,
  TravelObstacle,
  BoostRing,
  FishBoid,
  JellyfishEntity
} from "./types";
import { Audio } from "./audio";
import { RescueReadiness } from "./travel/readiness";
import { renderGupSubmarine } from "./render-gup";

interface ParallaxSilhouette {
  x: number;
  y: number;
  type: "manta" | "whale";
  scale: number;
  speed: number;
  phase: number;
}

interface BubbleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface CausticBeam {
  x: number;
  width: number;
  angle: number;
  alpha: number;
  speed: number;
}

export class TravelEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mission: MissionData;
  private gup: GupData;
  private onCompleteTravel: () => void;

  // Level & World Dimension
  public worldLength = 2200; // ~45s of dynamic travel
  public worldHeight = 720;
  public cameraX = 0;
  public cameraY = 0;

  // Submarine State (Authority Invariant: State -> Presentation -> Render)
  public subX = 140;
  public subY = 360;
  public subVx = 160;
  public subVy = 0;
  public subPitch = 0;
  public targetY = 360;
  public currentSpeed = 160;
  public isBoosting = false;
  public boostTimer = 0;
  public collisionWobble = 0;
  public inCurrent = false;

  // Input
  private isPointerDown = false;
  private pointerScreenX = 0;
  private pointerScreenY = 0;

  // Parallax Planes & Environment Entities
  private distantSilhouettes: ParallaxSilhouette[] = [];
  private causticBeams: CausticBeam[] = [];
  private fishSchool: FishBoid[] = [];
  private jellyfishList: JellyfishEntity[] = [];
  private currentStreams: CurrentStream[] = [];
  private boostRings: BoostRing[] = [];
  private obstacles: TravelObstacle[] = [];
  private bubbles: BubbleParticle[] = [];
  private sparkParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

  // Readiness Tracking
  private milestoneFlags = { searchlight: false, thruster: false, cutter: false };
  public radioMessage = "";
  public radioTimer = 0;

  // Animation Loop
  private animId: number | null = null;
  private lastTime = 0;
  private isFinished = false;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    gup: GupData,
    onCompleteTravel: () => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context not available");
    this.ctx = context;
    this.mission = mission;
    this.gup = gup;
    this.onCompleteTravel = onCompleteTravel;

    this.initWorld();
    this.bindControls();
  }

  private initWorld() {
    this.subX = 140;
    this.subY = this.worldHeight / 2;
    this.subVx = 160;
    this.subVy = 0;
    this.targetY = this.subY;
    this.isFinished = false;
    this.collisionWobble = 0;
    this.boostTimer = 0;
    this.isBoosting = false;

    RescueReadiness.reset();

    // 1. Distant Silhouettes (Depth Plane 1)
    this.distantSilhouettes = [
      { x: 300, y: 180, type: "manta", scale: 1.2, speed: 25, phase: 0 },
      { x: 900, y: 320, type: "whale", scale: 1.6, speed: 18, phase: 1.2 },
      { x: 1600, y: 220, type: "manta", scale: 1.0, speed: 28, phase: 2.5 }
    ];

    // 2. Caustic Light Beams
    this.causticBeams = [];
    for (let i = 0; i < 8; i++) {
      this.causticBeams.push({
        x: i * 220,
        width: 60 + Math.random() * 80,
        angle: -0.15 + Math.random() * 0.3,
        alpha: 0.1 + Math.random() * 0.15,
        speed: 0.2 + Math.random() * 0.3
      });
    }

    // 3. Fish School (Depth Plane 3)
    this.fishSchool = [];
    for (let i = 0; i < 22; i++) {
      this.fishSchool.push({
        x: 400 + Math.random() * 1600,
        y: 120 + Math.random() * 480,
        vx: 80 + Math.random() * 40,
        vy: (Math.random() - 0.5) * 15,
        size: 10 + Math.random() * 8,
        color: i % 2 === 0 ? "#80deea" : "#ffd54f",
        tailPhase: Math.random() * Math.PI * 2
      });
    }

    // 4. Jellyfish Entities
    this.jellyfishList = [];
    for (let i = 0; i < 9; i++) {
      this.jellyfishList.push({
        x: 350 + i * 210 + Math.random() * 60,
        y: 160 + (i % 3) * 160 + Math.random() * 40,
        size: 24 + Math.random() * 14,
        color: i % 2 === 0 ? "rgba(225, 190, 231, 0.7)" : "rgba(128, 222, 234, 0.7)",
        pulseOffset: Math.random() * Math.PI * 2,
        speedY: -12 - Math.random() * 10
      });
    }

    // 5. Current Streams
    this.currentStreams = [
      { id: "c1", worldX: 450, y: 220, width: 340, height: 110, flowSpeed: 140 },
      { id: "c2", worldX: 1100, y: 420, width: 380, height: 120, flowSpeed: 150 },
      { id: "c3", worldX: 1650, y: 260, width: 320, height: 110, flowSpeed: 160 }
    ];

    // 6. Boost Propulsion Rings (Temporary speed sensation, not score collectible)
    this.boostRings = [
      { id: "b1", worldX: 360, y: 340, passed: false, radius: 46 },
      { id: "b2", worldX: 850, y: 240, passed: false, radius: 46 },
      { id: "b3", worldX: 1400, y: 460, passed: false, radius: 46 },
      { id: "b4", worldX: 1880, y: 320, passed: false, radius: 46 }
    ];

    // 7. Coral Reef & Natural Obstacles (Non-punitive navigation targets)
    this.obstacles = [
      { id: "o1", worldX: 620, y: 480, width: 90, height: 160, kind: "coral", color: "#e91e63", name: "사슴뿔 산호초" },
      { id: "o2", worldX: 980, y: 140, width: 80, height: 140, kind: "rock", color: "#546e7a", name: "돌출 해저 암벽" },
      { id: "o3", worldX: 1300, y: 490, width: 100, height: 170, kind: "coral", color: "#ff7043", name: "부채 산호 군락" },
      { id: "o4", worldX: 1580, y: 150, width: 85, height: 130, kind: "seaweed_cluster", color: "#2e7d32", name: "거대 해조 덩굴" }
    ];

    this.showRadio("🚢 옥토포드 발진! 산호초 수로를 따라 구조 지점으로 이동하세요!", 3.5);
  }

  private bindControls() {
    const updateTarget = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = this.canvas.height / rect.height;
      this.pointerScreenX = (clientX - rect.left) * (this.canvas.width / rect.width);
      this.pointerScreenY = (clientY - rect.top) * scaleY;
      this.targetY = Math.max(70, Math.min(this.worldHeight - 70, this.pointerScreenY));
    };

    this.canvas.addEventListener("pointerdown", (e) => {
      this.isPointerDown = true;
      updateTarget(e.clientX, e.clientY);
      Audio.playBubble();
    });

    window.addEventListener("pointermove", (e) => {
      if (this.isPointerDown) {
        updateTarget(e.clientX, e.clientY);
      }
    });

    window.addEventListener("pointerup", () => {
      this.isPointerDown = false;
    });

    // Touch support fallback
    this.canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        updateTarget(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  public showRadio(msg: string, duration = 3.0) {
    this.radioMessage = msg;
    this.radioTimer = duration;
  }

  public start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(0.08, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.update(dt);
      this.render();

      if (!this.isFinished) {
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
    const time = performance.now();

    if (this.radioTimer > 0) {
      this.radioTimer -= dt;
    }

    if (this.collisionWobble > 0) {
      this.collisionWobble = Math.max(0, this.collisionWobble - dt * 2.2);
    }

    // 1. Current Stream Interaction
    let currentBoost = 0;
    this.inCurrent = false;
    for (const stream of this.currentStreams) {
      if (
        this.subX >= stream.worldX &&
        this.subX <= stream.worldX + stream.width &&
        this.subY >= stream.y - stream.height / 2 &&
        this.subY <= stream.y + stream.height / 2
      ) {
        this.inCurrent = true;
        currentBoost = stream.flowSpeed;
        break;
      }
    }

    // 2. Boost Ring Interaction (Temporary velocity boost, no score)
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.isBoosting = false;
      }
    }

    for (const ring of this.boostRings) {
      if (!ring.passed) {
        const dist = Math.hypot(this.subX - ring.worldX, this.subY - ring.y);
        if (dist < ring.radius + 20) {
          ring.passed = true;
          this.isBoosting = true;
          this.boostTimer = 1.8;
          Audio.playBoostRing();
          RescueReadiness.onBoost();
          this.spawnBoostSparks(ring.worldX, ring.y);
          this.showRadio("⚡ 터보 링 통과! 순간 가속 추진력 발생!", 2.0);
        }
      }
    }

    // 3. Submarine Physics (Direct Responsive Piloting + Buoyancy)
    const baseTargetSpeed = (this.gup.baseSpeedMultiplier || 1.0) * 175;
    const targetVx = (baseTargetSpeed + currentBoost + (this.isBoosting ? 140 : 0)) * (this.collisionWobble > 0.4 ? 0.6 : 1.0);
    this.subVx += (targetVx - this.subVx) * (dt * 4.0);
    this.currentSpeed = this.subVx;

    // Vertical Movement (Immediate responsiveness with hydrodynamic easing)
    const dy = this.targetY - this.subY;
    const verticalSpeed = dy * 4.2;
    this.subVy += (verticalSpeed - this.subVy) * (dt * 6.0);

    // Natural Buoyancy Hover Bobbing
    const idleBob = Math.sin(time * 0.003) * 1.5;
    this.subY += (this.subVy + idleBob) * dt;
    this.subY = Math.max(65, Math.min(this.worldHeight - 65, this.subY));

    this.subX += this.subVx * dt;

    // Pitch Angle based on vertical steering velocity
    const targetPitch = Math.max(-0.35, Math.min(0.35, this.subVy * 0.0018));
    this.subPitch += (targetPitch - this.subPitch) * (dt * 8.0);

    // Progress continuous readiness based on clean travel
    RescueReadiness.step(dt * 1000, true, this.inCurrent);

    // Check Equipment Readiness Milestones
    const readiness = RescueReadiness.getSnapshot();
    if (readiness.searchlight && !this.milestoneFlags.searchlight) {
      this.milestoneFlags.searchlight = true;
      Audio.playScannerBleep();
      this.showRadio("💡 전방 탐조등 준비 완료! 심해 가시거리 대폭 확보!", 2.8);
    }
    if (readiness.thruster && !this.milestoneFlags.thruster) {
      this.milestoneFlags.thruster = true;
      Audio.playBoostRing();
      this.showRadio("🚀 보조 터보 추진기 가동! 고속 순항 모드 진입!", 2.8);
    }
    if (readiness.cutter && !this.milestoneFlags.cutter) {
      this.milestoneFlags.cutter = true;
      Audio.playCut();
      this.showRadio("⚡ 정밀 레이저 절단기 충전 완료! 구조 지점에 근접!", 3.0);
    }

    // 4. Non-Punitive Obstacle Collision (Wobble & subtle delay without punishing player)
    for (const obs of this.obstacles) {
      const inX = this.subX + 35 >= obs.worldX - obs.width / 2 && this.subX - 35 <= obs.worldX + obs.width / 2;
      const inY = this.subY + 25 >= obs.y - obs.height / 2 && this.subY - 25 <= obs.y + obs.height / 2;

      if (inX && inY && this.collisionWobble < 0.2) {
        this.collisionWobble = 1.0;
        this.subVx *= 0.45; // Gentle speed damping
        RescueReadiness.onCollision();
        Audio.playBump();
        this.spawnSparks(this.subX + 20, this.subY, "#80deea", 10);
        this.showRadio(`⚠️ ${obs.name} 접촉! 자세를 바로잡고 계속 나아가세요.`, 2.0);
        break;
      }
    }

    // 5. Spawn Propulsion Bubbles
    if (Math.random() < (this.isBoosting ? 0.8 : 0.45)) {
      this.bubbles.push({
        x: this.subX - 54,
        y: this.subY + (Math.random() - 0.5) * 8,
        vx: -80 - Math.random() * 80,
        vy: -15 - Math.random() * 25,
        radius: 3 + Math.random() * (this.isBoosting ? 6 : 4),
        alpha: 0.8,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.6
      });
    }

    // Update Bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life += dt;
      b.alpha = Math.max(0, 1 - b.life / b.maxLife);
      if (b.life >= b.maxLife) {
        this.bubbles.splice(i, 1);
      }
    }

    // Update Spark Particles
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const sp = this.sparkParticles[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) {
        this.sparkParticles.splice(i, 1);
      }
    }

    // 6. Update Marine Life (Fish schooling & Jellyfish undulating)
    for (const f of this.fishSchool) {
      f.x -= (f.vx - this.subVx * 0.15) * dt;
      f.tailPhase += dt * 8.0;
      if (f.x < this.cameraX - 100) {
        f.x = this.cameraX + this.canvas.width + 200 + Math.random() * 300;
        f.y = 100 + Math.random() * (this.worldHeight - 200);
      }
    }

    for (const j of this.jellyfishList) {
      j.pulseOffset += dt * 3.0;
      j.y += Math.sin(j.pulseOffset) * j.speedY * dt;
    }

    // 7. Camera Look-Ahead Tracking
    const lookAhead = 160;
    const targetCamX = this.subX - this.canvas.width * 0.35 + lookAhead;
    this.cameraX += (targetCamX - this.cameraX) * (dt * 5.0);
    this.cameraX = Math.max(0, this.cameraX);

    // 8. Reached Destination Discovery Beacon
    if (this.subX >= this.worldLength && !this.isFinished) {
      this.isFinished = true;
      Audio.playSuccess();
      this.showRadio(`🎯 ${this.mission.animalName} 구조 지점 도달! 구조 스테이션으로 진입합니다!`, 2.5);
      setTimeout(() => {
        this.stop();
        this.onCompleteTravel();
      }, 1200);
    }
  }

  private spawnSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.sparkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        color
      });
    }
  }

  private spawnBoostSparks(x: number, y: number) {
    this.spawnSparks(x, y, "#00e5ff", 18);
    this.spawnSparks(x, y, "#ffd54f", 12);
  }

  private render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const time = performance.now();

    this.ctx.clearRect(0, 0, width, height);

    // ==========================================
    // LAYER 1: Deep Oceanic Gradient & Sunlight Caustics (Far Background)
    // ==========================================
    const oceanGrad = this.ctx.createLinearGradient(0, 0, 0, height);
    if (this.mission.environment === "coral-reef") {
      oceanGrad.addColorStop(0, "#006994");
      oceanGrad.addColorStop(0.4, "#004777");
      oceanGrad.addColorStop(1, "#001a33");
    } else if (this.mission.environment === "kelp-forest") {
      oceanGrad.addColorStop(0, "#004d40");
      oceanGrad.addColorStop(0.5, "#00332c");
      oceanGrad.addColorStop(1, "#001814");
    } else {
      oceanGrad.addColorStop(0, "#0d1b2a");
      oceanGrad.addColorStop(0.6, "#050b14");
      oceanGrad.addColorStop(1, "#000308");
    }

    this.ctx.fillStyle = oceanGrad;
    this.ctx.fillRect(0, 0, width, height);

    // Shimmering God Rays / Caustic Beams
    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";
    for (const beam of this.causticBeams) {
      const beamX = ((beam.x - this.cameraX * 0.1) % (width + 300)) - 100;
      const beamGrad = this.ctx.createLinearGradient(beamX, 0, beamX + Math.sin(beam.angle) * height, height);
      const dynamicAlpha = beam.alpha * (0.7 + Math.sin(time * 0.002 * beam.speed + beam.x) * 0.3);
      beamGrad.addColorStop(0, `rgba(178, 235, 242, ${dynamicAlpha * 1.5})`);
      beamGrad.addColorStop(0.7, `rgba(128, 222, 234, ${dynamicAlpha * 0.5})`);
      beamGrad.addColorStop(1, "rgba(0, 77, 102, 0)");

      this.ctx.fillStyle = beamGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(beamX - beam.width / 2, 0);
      this.ctx.lineTo(beamX + beam.width / 2, 0);
      this.ctx.lineTo(beamX + beam.width * 1.4 + Math.sin(beam.angle) * height, height);
      this.ctx.lineTo(beamX - beam.width * 0.6 + Math.sin(beam.angle) * height, height);
      this.ctx.closePath();
      this.ctx.fill();
    }
    this.ctx.restore();

    // ==========================================
    // LAYER 2: Distant Megafauna & Ridge Silhouettes (0.15x Parallax)
    // ==========================================
    this.ctx.save();
    for (const sil of this.distantSilhouettes) {
      const silWorldX = sil.x + Math.sin(time * 0.001 + sil.phase) * 30;
      const screenX = silWorldX - this.cameraX * 0.15;
      if (screenX >= -200 && screenX <= width + 200) {
        this.ctx.save();
        this.ctx.translate(screenX, sil.y);
        this.ctx.scale(sil.scale, sil.scale);
        this.ctx.fillStyle = "rgba(0, 30, 60, 0.4)";

        if (sil.type === "manta") {
          // Graceful manta ray gliding
          const wingFlap = Math.sin(time * 0.003 + sil.phase) * 0.2;
          this.ctx.beginPath();
          this.ctx.moveTo(40, 0);
          this.ctx.quadraticCurveTo(10, -25 + wingFlap * 15, -30, -35);
          this.ctx.quadraticCurveTo(-15, 0, -40, 0);
          this.ctx.quadraticCurveTo(-15, 0, -30, 35);
          this.ctx.quadraticCurveTo(10, 25 - wingFlap * 15, 40, 0);
          this.ctx.fill();
          // Tail
          this.ctx.strokeStyle = "rgba(0, 30, 60, 0.4)";
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(-40, 0);
          this.ctx.lineTo(-70, Math.sin(time * 0.004) * 4);
          this.ctx.stroke();
        } else {
          // Distant Blue Whale silhouette
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, 70, 24, 0, 0, Math.PI * 2);
          this.ctx.fill();
          // Fluke
          this.ctx.beginPath();
          this.ctx.moveTo(-65, 0);
          this.ctx.lineTo(-90, -16);
          this.ctx.lineTo(-84, 0);
          this.ctx.lineTo(-90, 16);
          this.ctx.closePath();
          this.ctx.fill();
        }
        this.ctx.restore();
      }
    }
    this.ctx.restore();

    // ==========================================
    // LAYER 3: Midground Reef Mountains & Kelp Stalks (0.45x Parallax)
    // ==========================================
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 45, 80, 0.55)";
    for (let i = 0; i < 14; i++) {
      const midX = i * 220 - (this.cameraX * 0.45) % (width + 300);
      this.ctx.beginPath();
      this.ctx.moveTo(midX, height);
      this.ctx.quadraticCurveTo(midX + 70, height - 160 - (i % 3) * 40, midX + 160, height);
      this.ctx.fill();
    }

    // Midground School of Fish
    for (const fish of this.fishSchool) {
      const fx = fish.x - this.cameraX * 0.55;
      if (fx >= -50 && fx <= width + 50) {
        this.ctx.save();
        this.ctx.translate(fx, fish.y);
        this.ctx.fillStyle = fish.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, fish.size, fish.size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Wagging Tail
        const tailWag = Math.sin(fish.tailPhase) * (fish.size * 0.4);
        this.ctx.beginPath();
        this.ctx.moveTo(-fish.size * 0.8, 0);
        this.ctx.lineTo(-fish.size * 1.5, tailWag - fish.size * 0.4);
        this.ctx.lineTo(-fish.size * 1.5, tailWag + fish.size * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }
    }
    this.ctx.restore();

    // ==========================================
    // LAYER 4: Gameplay Layer (1.0x Parallax: GUP, Currents, Boost Rings, Hazards)
    // ==========================================
    this.ctx.save();
    this.ctx.translate(-this.cameraX, 0);

    // 1. Current Streams
    for (const stream of this.currentStreams) {
      const currentGrad = this.ctx.createLinearGradient(stream.worldX, 0, stream.worldX + stream.width, 0);
      currentGrad.addColorStop(0, "rgba(0, 229, 255, 0.05)");
      currentGrad.addColorStop(0.5, "rgba(0, 229, 255, 0.25)");
      currentGrad.addColorStop(1, "rgba(0, 229, 255, 0.05)");

      this.ctx.fillStyle = currentGrad;
      this.ctx.beginPath();
      this.ctx.roundRect(stream.worldX, stream.y - stream.height / 2, stream.width, stream.height, 20);
      this.ctx.fill();

      // Animated Water Streamlines
      this.ctx.strokeStyle = "rgba(128, 222, 234, 0.6)";
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const lineY = stream.y - stream.height / 2 + 20 + i * 24;
        const lineOffset = (time * 0.2 + i * 50) % (stream.width * 0.8);
        this.ctx.beginPath();
        this.ctx.moveTo(stream.worldX + lineOffset, lineY);
        this.ctx.lineTo(stream.worldX + lineOffset + 60, lineY);
        this.ctx.stroke();
      }
    }

    // 2. Boost Propulsion Rings
    for (const ring of this.boostRings) {
      this.ctx.save();
      this.ctx.translate(ring.worldX, ring.y);
      const ringPulse = 1.0 + Math.sin(time * 0.006) * 0.08;
      this.ctx.scale(ringPulse, ringPulse);

      // Outer Energy Glow Ring
      this.ctx.strokeStyle = ring.passed ? "rgba(77, 208, 225, 0.3)" : "#00e5ff";
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = "#00e5ff";
      this.ctx.shadowBlur = ring.passed ? 6 : 16;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, ring.radius * 0.5, ring.radius, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      // Inner Core
      this.ctx.fillStyle = ring.passed ? "rgba(0, 229, 255, 0.05)" : "rgba(0, 229, 255, 0.25)";
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, ring.radius * 0.5, ring.radius, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Speed Chevrons
      if (!ring.passed) {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 13px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("⚡ BOOST", 0, 0);
      }
      this.ctx.restore();
    }

    // 3. Natural Obstacles (Corals & Reef Spires)
    for (const obs of this.obstacles) {
      this.ctx.save();
      this.ctx.translate(obs.worldX, obs.y);

      if (obs.kind === "coral") {
        // Multi-branching Staghorn Coral
        this.ctx.fillStyle = obs.color;
        this.ctx.strokeStyle = "#880e4f";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, obs.height / 2);
        this.ctx.lineTo(-obs.width * 0.4, 0);
        this.ctx.lineTo(-obs.width * 0.45, -obs.height * 0.4);
        this.ctx.lineTo(-obs.width * 0.2, -obs.height * 0.2);
        this.ctx.lineTo(0, -obs.height * 0.48);
        this.ctx.lineTo(obs.width * 0.2, -obs.height * 0.2);
        this.ctx.lineTo(obs.width * 0.45, -obs.height * 0.4);
        this.ctx.lineTo(obs.width * 0.4, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      } else if (obs.kind === "rock") {
        // Granite Reef Boulder
        const rockGrad = this.ctx.createRadialGradient(0, 0, 10, 0, 0, obs.width / 2);
        rockGrad.addColorStop(0, "#78909c");
        rockGrad.addColorStop(1, "#37474f");
        this.ctx.fillStyle = rockGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Giant Kelp Vine Cluster
        this.ctx.strokeStyle = "#2e7d32";
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(0, obs.height / 2);
        this.ctx.quadraticCurveTo(Math.sin(time * 0.003) * 20, 0, 0, -obs.height / 2);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    // 4. Jellyfish Float
    for (const j of this.jellyfishList) {
      this.ctx.save();
      this.ctx.translate(j.x, j.y);
      const jPulse = 1.0 + Math.sin(j.pulseOffset) * 0.15;
      this.ctx.scale(1, jPulse);

      // Bell Dome
      this.ctx.fillStyle = j.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, j.size, Math.PI, 0);
      this.ctx.closePath();
      this.ctx.fill();

      // Tentacles
      this.ctx.strokeStyle = j.color;
      this.ctx.lineWidth = 1.5;
      for (let k = -2; k <= 2; k++) {
        this.ctx.beginPath();
        this.ctx.moveTo(k * (j.size * 0.35), 0);
        this.ctx.quadraticCurveTo(
          k * (j.size * 0.35) + Math.sin(j.pulseOffset + k) * 6,
          j.size * 0.8,
          k * (j.size * 0.35),
          j.size * 1.5
        );
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 5. Bubbles Trail
    for (const b of this.bubbles) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(224, 247, 250, ${b.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 6. Spark Particles
    for (const sp of this.sparkParticles) {
      this.ctx.save();
      this.ctx.fillStyle = sp.color;
      this.ctx.beginPath();
      this.ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 7. Volumetric Searchlight Cone from GUP Bow
    this.ctx.save();
    const beamStartX = this.subX + 46;
    const beamStartY = this.subY;
    const beamLength = this.milestoneFlags.searchlight ? 360 : 220;
    const beamSpread = this.milestoneFlags.searchlight ? 110 : 70;

    const lightGrad = this.ctx.createRadialGradient(
      beamStartX,
      beamStartY,
      10,
      beamStartX + beamLength * 0.7,
      beamStartY,
      beamLength
    );
    lightGrad.addColorStop(0, "rgba(255, 255, 224, 0.45)");
    lightGrad.addColorStop(0.4, "rgba(255, 245, 157, 0.2)");
    lightGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

    this.ctx.fillStyle = lightGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(beamStartX, beamStartY);
    this.ctx.lineTo(beamStartX + beamLength, beamStartY - beamSpread);
    this.ctx.lineTo(beamStartX + beamLength, beamStartY + beamSpread);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 8. Player GUP Submarine (Living Actor)
    this.ctx.save();
    this.ctx.translate(this.subX, this.subY);
    renderGupSubmarine(this.ctx, {
      gupId: this.gup.id,
      color: this.gup.color,
      accentColor: this.gup.accentColor,
      subPitch: this.subPitch,
      currentSpeed: this.currentSpeed,
      isBoosting: this.isBoosting,
      boostTimer: this.boostTimer,
      collisionWobble: this.collisionWobble,
      readinessMilestones: this.milestoneFlags,
      companionAvatar: this.mission.companionAvatar,
      scale: 1.15,
      isDocked: false,
      time: time
    });
    this.ctx.restore();

    // 9. Destination Sonar Beacon (Target Animal Encounter)
    const destX = this.worldLength;
    const destY = this.worldHeight / 2;
    const beaconPulse = (time * 0.004) % 1.0;
    this.ctx.save();
    this.ctx.translate(destX, destY);

    // Sonar concentric rings
    this.ctx.strokeStyle = `rgba(0, 229, 255, ${1 - beaconPulse})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, beaconPulse * 160, 0, Math.PI * 2);
    this.ctx.stroke();

    // Animal Waypoint Hologram Silhouette
    this.ctx.fillStyle = "rgba(255, 213, 79, 0.9)";
    this.ctx.font = "54px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.mission.animalIcon, 0, Math.sin(time * 0.004) * 8);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.fillText("🚨 구조 신호 감지", 0, 42);
    this.ctx.restore();

    this.ctx.restore();

    // ==========================================
    // LAYER 5: Foreground Silhouette & HUD Overlays
    // ==========================================
    this.renderForegroundAndHUD(width, height);
  }

  private renderForegroundAndHUD(width: number, height: number) {
    const time = performance.now();

    // 1. Foreground Sea Kelp Silhouettes (1.35x Parallax)
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 15, 30, 0.65)";
    for (let i = 0; i < 6; i++) {
      const fgX = i * 360 - (this.cameraX * 1.35) % (width + 400);
      const sway = Math.sin(time * 0.002 + i) * 24;
      this.ctx.beginPath();
      this.ctx.moveTo(fgX, height);
      this.ctx.quadraticCurveTo(fgX + sway, height - 140, fgX + 40, height);
      this.ctx.fill();
    }
    this.ctx.restore();

    // 2. Mission Progress HUD (Clean, Child-Friendly Waypoint Bar)
    this.ctx.save();
    const hudW = Math.min(width - 48, 520);
    const hudX = (width - hudW) / 2;
    const hudY = 20;

    // Background capsule
    this.ctx.fillStyle = "rgba(8, 24, 44, 0.88)";
    this.ctx.strokeStyle = "rgba(77, 208, 225, 0.5)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(hudX, hudY, hudW, 44, 22);
    this.ctx.fill();
    this.ctx.stroke();

    // Distance Track Line
    const trackStartX = hudX + 50;
    const trackEndX = hudX + hudW - 50;
    const progressRatio = Math.min(1.0, this.subX / this.worldLength);

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(trackStartX, hudY + 22);
    this.ctx.lineTo(trackEndX, hudY + 22);
    this.ctx.stroke();

    // Active Filled Progress Line
    this.ctx.strokeStyle = "#00e5ff";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(trackStartX, hudY + 22);
    this.ctx.lineTo(trackStartX + (trackEndX - trackStartX) * progressRatio, hudY + 22);
    this.ctx.stroke();

    // Origin Sub Icon & Target Animal Icon
    this.ctx.font = "18px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("🚢", hudX + 26, hudY + 22);
    this.ctx.fillText(this.mission.animalIcon, hudX + hudW - 26, hudY + 22);

    // GUP Current Position Marker
    const markerX = trackStartX + (trackEndX - trackStartX) * progressRatio;
    this.ctx.fillStyle = "#ffd54f";
    this.ctx.beginPath();
    this.ctx.arc(markerX, hudY + 22, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Equipment Readiness Icons on Top HUD
    const eqY = hudY + 22;
    // 1. Searchlight @ 33%
    const slX = trackStartX + (trackEndX - trackStartX) * 0.33;
    this.ctx.font = "12px sans-serif";
    this.ctx.fillText(this.milestoneFlags.searchlight ? "💡" : "⚪", slX, eqY - 14);

    // 2. Thruster @ 66%
    const thX = trackStartX + (trackEndX - trackStartX) * 0.66;
    this.ctx.fillText(this.milestoneFlags.thruster ? "🚀" : "⚪", thX, eqY - 14);

    // 3. Cutter @ 90%
    const cutX = trackStartX + (trackEndX - trackStartX) * 0.90;
    this.ctx.fillText(this.milestoneFlags.cutter ? "⚡" : "⚪", cutX, eqY - 14);

    // 3. Radio / Navigator Speech Banner
    if (this.radioTimer > 0 && this.radioMessage) {
      const bannerW = Math.min(width - 40, 680);
      const bx = (width - bannerW) / 2;
      const by = height - 76;

      this.ctx.fillStyle = "rgba(10, 30, 56, 0.94)";
      this.ctx.strokeStyle = "#ffd54f";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(bx, by, bannerW, 48, 24);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 15px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(this.radioMessage, width / 2, by + 24);
    }

    this.ctx.restore();
  }
}
