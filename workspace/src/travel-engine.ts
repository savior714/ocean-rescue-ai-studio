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
import { RescueReadiness, ReadinessSnapshot } from "./travel/readiness";
import { PixiTravelRenderer, TravelRenderSnapshot } from "./travel/pixi-travel-renderer";
import { TurtleState } from "./discovery/turtle-actor";

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

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class TravelEngine {
  private baseCanvas: HTMLCanvasElement;
  private travelCanvas: HTMLCanvasElement | null = null;
  private mission: MissionData;
  private gup: GupData;
  private onCompleteTravel: () => void;

  private renderer: PixiTravelRenderer;

  // Level & World Dimension
  public worldLength = 2600;
  public worldHeight = 720;
  public cameraX = 0;
  public cameraY = 0;

  // Authoritative Submarine State (Authority Invariant: Input -> State -> Actor -> Render)
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
  public collisionShakeAngle = 0;
  public inCurrent = false;

  // Discovery Sequence State
  public inDiscoveryZone = false;
  public isScanEligible = false;
  public isScanning = false;
  public scanProgress = 0;
  public isReadyForRescue = false;
  private settleDwellTimer = 0;
  private discoveryAnnounced = false;
  private settledAnnounced = false;
  private startledAnnounceCooldown = 0;

  // Input
  private isPointerDown = false;
  private pointerScreenX = 0;
  private pointerScreenY = 0;
  private keydownHandler?: (e: KeyboardEvent) => void;

  // Parallax Planes & Environment Entities
  private fishSchool: FishBoid[] = [];
  private jellyfishList: JellyfishEntity[] = [];
  private currentStreams: CurrentStream[] = [];
  private boostRings: BoostRing[] = [];
  private obstacles: TravelObstacle[] = [];
  private bubbles: BubbleParticle[] = [];
  private sparkParticles: SparkParticle[] = [];

  // Readiness & Radio Dialogue
  private milestoneFlags = { searchlight: false, thruster: false, cutter: false };
  public radioMessage = "";
  public radioTimer = 0;

  // Loop
  private animId: number | null = null;
  private lastTime = 0;
  private isFinished = false;
  private totalElapsedTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    gup: GupData,
    onCompleteTravel: () => void
  ) {
    this.baseCanvas = canvas;
    this.mission = mission;
    this.gup = gup;
    this.onCompleteTravel = onCompleteTravel;

    this.renderer = new PixiTravelRenderer(mission, gup, () => this.triggerScan());
    this.initWorld();
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
    this.totalElapsedTime = 0;

    this.inDiscoveryZone = false;
    this.isScanEligible = false;
    this.isScanning = false;
    this.scanProgress = 0;
    this.isReadyForRescue = false;
    this.settleDwellTimer = 0;
    this.discoveryAnnounced = false;
    this.settledAnnounced = false;
    this.startledAnnounceCooldown = 0;

    RescueReadiness.reset();

    // 1. Fish School (Midground Parallax)
    this.fishSchool = [];
    for (let i = 0; i < 22; i++) {
      this.fishSchool.push({
        x: 400 + Math.random() * 1800,
        y: 120 + Math.random() * 480,
        vx: 80 + Math.random() * 40,
        vy: (Math.random() - 0.5) * 15,
        size: 10 + Math.random() * 8,
        color: i % 2 === 0 ? "#80deea" : "#ffd54f",
        scale: 0.8 + Math.random() * 0.4,
        tailPhase: Math.random() * Math.PI * 2
      });
    }

    // 2. Jellyfish Entities
    this.jellyfishList = [];
    for (let i = 0; i < 9; i++) {
      this.jellyfishList.push({
        x: 350 + i * 210 + Math.random() * 60,
        y: 160 + (i % 3) * 160 + Math.random() * 40,
        size: 24 + Math.random() * 14,
        color: i % 2 === 0 ? "rgba(225, 190, 231, 0.7)" : "rgba(128, 222, 234, 0.7)",
        scale: 0.75 + Math.random() * 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
        speedY: -12 - Math.random() * 10
      });
    }

    // 3. Current Streams
    this.currentStreams = [
      { id: "c1", worldX: 450, y: 220, width: 340, height: 110, flowSpeed: 140 },
      { id: "c2", worldX: 1100, y: 420, width: 380, height: 120, flowSpeed: 150 },
      { id: "c3", worldX: 1650, y: 260, width: 320, height: 110, flowSpeed: 160 }
    ];

    // 4. Boost Propulsion Rings (Sensory boost rings placed along the main travel canal)
    this.boostRings = [
      { id: "b1", worldX: 360, y: 340, active: true, passed: false, radius: 46 },
      { id: "b2", worldX: 850, y: 240, active: true, passed: false, radius: 46 },
      { id: "b3", worldX: 1400, y: 460, active: true, passed: false, radius: 46 },
      { id: "b4", worldX: 1880, y: 320, active: true, passed: false, radius: 46 }
    ];

    // 5. Coral Reef & Natural Obstacles
    this.obstacles = [
      { id: "o1", worldX: 620, y: 480, width: 90, height: 160, kind: "coral", color: "#e91e63", name: "사슴뿔 산호초" },
      { id: "o2", worldX: 980, y: 140, width: 80, height: 140, kind: "rock", color: "#546e7a", name: "돌출 해저 암벽" },
      { id: "o3", worldX: 1300, y: 490, width: 100, height: 170, kind: "coral", color: "#ff7043", name: "부채 산호 군락" },
      { id: "o4", worldX: 1580, y: 150, width: 85, height: 130, kind: "seaweed_cluster", color: "#2e7d32", name: "거대 해조 덩굴" }
    ];

    this.showRadio(`🚢 ${this.mission.companion}: 탐험선 발진! 산호초 수로를 따라 구조 지점으로 이동하세요!`, 3.8);
  }

  private setupCanvasAndInput(): HTMLCanvasElement {
    const stageContainer = document.getElementById("ocean-rescue-stage") || this.baseCanvas.parentElement || document.body;
    let travelCanvas = document.getElementById("pixi-travel-canvas") as HTMLCanvasElement | null;

    if (!travelCanvas) {
      travelCanvas = document.createElement("canvas");
      travelCanvas.id = "pixi-travel-canvas";
      travelCanvas.width = 1280;
      travelCanvas.height = 720;
      travelCanvas.style.position = "absolute";
      travelCanvas.style.top = "0";
      travelCanvas.style.left = "0";
      travelCanvas.style.width = "100%";
      travelCanvas.style.height = "100%";
      travelCanvas.style.zIndex = "5";
      stageContainer.appendChild(travelCanvas);
    }
    this.travelCanvas = travelCanvas;

    const updateTarget = (clientX: number, clientY: number) => {
      if (!this.travelCanvas) return;
      const rect = this.travelCanvas.getBoundingClientRect();
      const scaleY = this.travelCanvas.height / rect.height;
      this.pointerScreenX = (clientX - rect.left) * (this.travelCanvas.width / rect.width);
      this.pointerScreenY = (clientY - rect.top) * scaleY;
      this.targetY = Math.max(80, Math.min(this.worldHeight - 80, this.pointerScreenY));
    };

    const isPointerOverScanButton = (screenX: number, screenY: number): boolean => {
      // Touch-friendly bounding box for the visible SCAN button (centered at 640, 597)
      return screenX >= 460 && screenX <= 820 && screenY >= 540 && screenY <= 655;
    };

    this.travelCanvas.addEventListener("pointerdown", (e) => {
      if (!this.travelCanvas) return;
      const rect = this.travelCanvas.getBoundingClientRect();
      const scaleX = this.travelCanvas.width / rect.width;
      const scaleY = this.travelCanvas.height / rect.height;
      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;

      // Check if clicking visible contextual SCAN button
      if (this.isScanEligible && isPointerOverScanButton(screenX, screenY)) {
        if (!this.isScanning && !this.isReadyForRescue) {
          this.triggerScan();
        }
        // Explicitly return without altering GUP steering target or starting pointer drag
        return;
      }

      // Standard Water Drag / Steering Input
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

    this.travelCanvas.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        updateTarget(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // Keyboard support: Space or S key triggers Scan ONLY when scan is eligible
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "KeyS" || e.code === "Enter") {
        if (this.isScanEligible && !this.isScanning && !this.isReadyForRescue) {
          e.preventDefault();
          this.triggerScan();
        }
      }
    };
    window.addEventListener("keydown", this.keydownHandler);

    return travelCanvas;
  }

  public showRadio(msg: string, duration = 3.0) {
    this.radioMessage = msg;
    this.radioTimer = duration;
  }

  /**
   * Contextual Scan Action Trigger (Available only when scan conditions are stably satisfied)
   */
  public triggerScan(): void {
    if (!this.isScanEligible || this.isScanning || this.isReadyForRescue) return;

    this.isScanning = true;
    this.scanProgress = 0;
    Audio.playSonarPing();
    Audio.playBoostRing();
    this.showRadio(`🔍 ${this.mission.companion}: 소나 스캔 가동! 그물 위치를 분석합니다...`, 3.5);
  }

  public async start(): Promise<void> {
    const canvas = this.setupCanvasAndInput();
    await this.renderer.init(canvas);

    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(0.08, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.step(dt);
      this.render(dt);

      if (!this.isFinished) {
        this.animId = requestAnimationFrame(loop);
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  /**
   * Authoritative Physics & State Step
   */
  public step(dt: number): void {
    if (this.isFinished) return;
    this.totalElapsedTime += dt;

    if (this.radioTimer > 0) {
      this.radioTimer -= dt;
    }
    if (this.startledAnnounceCooldown > 0) {
      this.startledAnnounceCooldown -= dt;
    }

    // 1. Discovery Zone Entry Trigger & Proximity-driven Reaction Logic
    if (this.subX >= 1950) {
      this.inDiscoveryZone = true;
      if (!this.discoveryAnnounced) {
        this.discoveryAnnounced = true;
        Audio.playSonarPing();
        this.showRadio(`🐢 ${this.mission.companion}: 저 앞 산호초에 바다거북이 있어요! 조심스럽게 다가가 보세요.`, 4.0);
      }

      // Proximity, Speed, and Settled Reaction Evaluation
      const turtleWorldX = 2450;
      const turtleWorldY = 380;
      const distToTurtle = Math.hypot(this.subX - turtleWorldX, this.subY - turtleWorldY);
      const isClose = distToTurtle <= 380;
      const isSpeedCalm = Math.abs(this.currentSpeed) < 140 && Math.abs(this.subVy) < 150;
      const turtleState = this.renderer.turtleActor.currentState;
      const isStartled = turtleState === TurtleState.STARTLED_GUARDED;
      const isTurtleCalm = (turtleState === TurtleState.WATCHFUL_SETTLING || turtleState === TurtleState.BEING_SCANNED);

      // Startled Radio Guidance (with cooldown, non-punitive)
      if (isStartled && this.startledAnnounceCooldown <= 0 && !this.isScanning && !this.isReadyForRescue) {
        this.startledAnnounceCooldown = 4.5;
        this.showRadio(`⚠️ ${this.mission.companion}: 거북이가 깜짝 놀랐어요! 천천히 움직여 안정을 찾게 해주세요.`, 3.5);
      }

      // Dwell Timer & Scan Eligibility State Machine
      if (isClose && isSpeedCalm && isTurtleCalm && !isStartled) {
        this.settleDwellTimer = Math.min(1.0, this.settleDwellTimer + dt * 2.2);
      } else if (isStartled) {
        this.settleDwellTimer = 0;
      } else {
        this.settleDwellTimer = Math.max(0, this.settleDwellTimer - dt * 2.5);
      }

      const wasEligible = this.isScanEligible;
      this.isScanEligible = (this.settleDwellTimer >= 0.8) && !this.isScanning && !this.isReadyForRescue;

      // First-time settled announcement
      if (this.isScanEligible && !wasEligible && !this.settledAnnounced) {
        this.settledAnnounced = true;
        Audio.playSonarPing();
        this.showRadio(`🔍 ${this.mission.companion}: 거북이가 안정을 찾았어요! [그물 스캔하기]를 눌러 그물을 확인하세요.`, 4.0);
      }
    }

    // 2. Scan Progress State Machine
    if (this.isScanning) {
      this.scanProgress += dt / 3.0;
      if (this.scanProgress >= 1.0) {
        this.scanProgress = 1.0;
        this.isScanning = false;
        this.isReadyForRescue = true;
        Audio.playSuccess();
        this.showRadio(`✨ ${this.mission.companion}: 스캔 완료! 거북이를 풀어줄 준비가 되었어요!`, 5.0);
      }
    }

    // 3. Steering & Vertical Velocity Easing
    const dy = this.targetY - this.subY;
    const accelY = dy * (this.inDiscoveryZone ? 5.0 : 6.5);
    this.subVy += accelY * dt;
    this.subVy *= 0.90; // Hydrodynamic drag damping
    this.subY += this.subVy * dt;
    this.subY = Math.max(80, Math.min(this.worldHeight - 80, this.subY));

    // Pitch Angle based on hydrodynamic vertical climb/dive
    const targetPitch = Math.max(-0.42, Math.min(0.42, (this.subVy / 220) * 0.42));
    this.subPitch += (targetPitch - this.subPitch) * 0.16;

    // 4. Collision Wobble Decay
    if (this.collisionWobble > 0) {
      this.collisionWobble = Math.max(0, this.collisionWobble - dt * 2.2);
      this.collisionShakeAngle = Math.sin(this.totalElapsedTime * 35) * 0.08;
    } else {
      this.collisionShakeAngle = 0;
    }

    // 5. Boost Countdown
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      this.isBoosting = true;
    } else {
      this.isBoosting = false;
    }

    // 6. Current Stream Detection
    let insideCurrent = false;
    for (const stream of this.currentStreams) {
      if (
        this.subX + 40 >= stream.worldX &&
        this.subX - 40 <= stream.worldX + stream.width &&
        this.subY >= stream.y &&
        this.subY <= stream.y + stream.height
      ) {
        insideCurrent = true;
        break;
      }
    }
    if (insideCurrent && !this.inCurrent) {
      Audio.playBoostRing();
    }
    this.inCurrent = insideCurrent;

    // 7. Horizontal Cruising Speed & Discovery Approach Easing
    let targetSpeed = 160;
    if (this.isBoosting) {
      targetSpeed = 380;
    } else if (this.inCurrent) {
      targetSpeed = 260;
    }
    if (this.collisionWobble > 0.4) {
      targetSpeed *= 0.65;
    }

    // In Discovery Zone, smoothly ease forward speed so GUP hovers in optimal rescue position (x: 2180 ~ 2280)
    if (this.inDiscoveryZone) {
      const approachDistance = 2240 - this.subX;
      if (approachDistance > 0) {
        targetSpeed = Math.max(30, Math.min(targetSpeed, approachDistance * 1.2));
      } else {
        targetSpeed = Math.max(-20, approachDistance * 1.5);
      }
    }

    this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.14;
    this.subX += this.currentSpeed * dt;
    this.subVx = this.currentSpeed;

    // 8. Boost Ring Triggering
    for (const ring of this.boostRings) {
      if (ring.active) {
        const dist = Math.hypot(this.subX - ring.worldX, this.subY - ring.y);
        if (dist < ring.radius + 35) {
          ring.active = false;
          this.boostTimer = 1.4;
          Audio.playBoostRing();
          RescueReadiness.onBoost();

          // Boost shockwave particles
          for (let i = 0; i < 8; i++) {
            this.sparkParticles.push({
              x: ring.worldX,
              y: ring.y,
              vx: (Math.random() - 0.5) * 200,
              vy: (Math.random() - 0.5) * 200,
              life: 1.0,
              color: "#00e5ff"
            });
          }
        }
      }
    }

    // 9. Non-punitive Obstacle Collisions
    for (const obs of this.obstacles) {
      const gupLeft = this.subX - 45;
      const gupRight = this.subX + 45;
      const gupTop = this.subY - 24;
      const gupBottom = this.subY + 24;

      const obsLeft = obs.worldX;
      const obsRight = obs.worldX + obs.width;
      const obsTop = obs.y;
      const obsBottom = obs.y + obs.height;

      if (
        gupRight >= obsLeft &&
        gupLeft <= obsRight &&
        gupBottom >= obsTop &&
        gupTop <= obsBottom
      ) {
        if (this.collisionWobble < 0.15) {
          this.collisionWobble = 1.0;
          Audio.playBump();
          RescueReadiness.onCollision();

          if (this.subY < obs.y + obs.height / 2) {
            this.subVy = -180;
          } else {
            this.subVy = 180;
          }

          for (let s = 0; s < 6; s++) {
            this.sparkParticles.push({
              x: this.subX,
              y: this.subY,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              life: 1.0,
              color: "#ffca28"
            });
          }
        }
      }
    }

    // 10. Rescue Readiness Progression & Milestone Announcements
    RescueReadiness.step(dt * 1000, true, this.inCurrent);
    const readinessSnap = RescueReadiness.getSnapshot();

    if (readinessSnap.searchlight && !this.milestoneFlags.searchlight) {
      this.milestoneFlags.searchlight = true;
      Audio.playSuccess();
      this.showRadio(`🐧 ${this.mission.companion}: 탐험선 탐조등(Searchlight) 가동 완료! 전방 수로가 환해졌어요!`, 3.5);
    }
    if (readinessSnap.thruster && !this.milestoneFlags.thruster) {
      this.milestoneFlags.thruster = true;
      Audio.playSuccess();
      this.showRadio(`⚡ ${this.mission.companion}: 보조 추진기(Thruster) 출력 최적화! 속도가 상승했습니다!`, 3.5);
    }
    if (readinessSnap.cutter && !this.milestoneFlags.cutter) {
      this.milestoneFlags.cutter = true;
      Audio.playSuccess();
      this.showRadio(`🛠️ ${this.mission.companion}: 정밀 레이저 절단기(Cutter) 장착 완료! 곧 구조 지점에 도착합니다!`, 3.5);
    }

    // 11. Camera Follow & Cinematic Framing
    let targetCameraX = Math.max(0, this.subX - 260);
    if (this.inDiscoveryZone) {
      // In discovery zone, lock into cinematic dual framing centered on both GUP and Sea Turtle
      targetCameraX = Math.min(1860, Math.max(0, this.subX - 260));
    }
    this.cameraX += (targetCameraX - this.cameraX) * 0.12;

    // 12. Update Particles
    if (Math.random() < 0.35 || this.isBoosting) {
      this.bubbles.push({
        x: this.subX - 60,
        y: this.subY + (Math.random() - 0.5) * 16,
        vx: -60 - Math.random() * 40,
        vy: -20 - Math.random() * 20,
        radius: 4 + Math.random() * 6,
        alpha: 0.8,
        life: 0,
        maxLife: 1.8
      });
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life += dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.alpha = Math.max(0, 0.8 * (1 - b.life / b.maxLife));
      if (b.life >= b.maxLife) {
        this.bubbles.splice(i, 1);
      }
    }

    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const sp = this.sparkParticles[i];
      sp.life -= dt * 2.5;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      if (sp.life <= 0) {
        this.sparkParticles.splice(i, 1);
      }
    }
  }

  /**
   * Render pass: Passes authoritative snapshot to PixiJS renderer
   */
  public render(dt: number): void {
    const snapshot: TravelRenderSnapshot = {
      subX: this.subX,
      subY: this.subY,
      subVx: this.subVx,
      subPitch: this.subPitch,
      speedRatio: this.currentSpeed / 160,
      isBoosting: this.isBoosting,
      inCurrent: this.inCurrent,
      collisionWobble: this.collisionWobble,
      collisionShakeAngle: this.collisionShakeAngle,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      worldLength: this.worldLength,
      worldHeight: this.worldHeight,
      currentStreams: this.currentStreams,
      boostRings: this.boostRings,
      obstacles: this.obstacles,
      fishSchool: this.fishSchool,
      jellyfishList: this.jellyfishList,
      bubbles: this.bubbles,
      sparks: this.sparkParticles,
      readiness: RescueReadiness.getSnapshot(),
      radioMessage: this.radioMessage,
      radioTimer: this.radioTimer,
      time: this.totalElapsedTime,
      // Discovery
      inDiscoveryZone: this.inDiscoveryZone,
      canScan: this.isScanEligible,
      isScanning: this.isScanning,
      scanProgress: this.scanProgress,
      isReadyForRescue: this.isReadyForRescue,
      turtleReactionState: this.renderer.turtleActor.currentState
    };

    this.renderer.render(snapshot, dt);
  }

  public stop(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.keydownHandler) {
      window.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = undefined;
    }
    this.renderer.destroy();
    if (this.travelCanvas && this.travelCanvas.parentElement) {
      this.travelCanvas.parentElement.removeChild(this.travelCanvas);
      this.travelCanvas = null;
    }
  }
}

