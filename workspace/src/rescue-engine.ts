import {
  MissionData,
  GupData,
  VitalsData,
  TurtleRope,
  CrabRock,
  WhaleDebris,
  OtterOilSpot,
  SquidCable,
  BioCareTarget,
  GupUpgrades
} from "./types";
import { Audio } from "./audio";

export class RescueEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mission: MissionData;
  private gup: GupData;
  private upgrades: GupUpgrades;
  private onStepSuccess: (step: number) => void;
  private onAllRescued: () => void;

  // Staging & Animal Position in 2.5D Depth Arena
  public animalX = 740;
  public animalY = 380;
  public animalScale = 1.0;

  // Rescue Progress & Phases
  public currentStep = 0;
  public totalSteps = 3;
  public isDangerCleared = false;
  public isCarePhase = false;
  public isCompleted = false;

  // Dynamic Vitals Monitor
  public vitals: VitalsData = {
    heartRate: 115,
    oxygenLevel: 82,
    stressLevel: 85,
    healthPercent: 35
  };
  private ecgPhase = 0;

  // Companion Comms & Dialogues
  public companionSpeech = "";
  public companionSpeechTimer = 0;

  // Interactive Tools & Pointer
  private isPointerDown = false;
  private pointerPos = { x: 0, y: 0 };
  private pointerDownPos = { x: 0, y: 0 };
  private laserTrail: Array<{ x: number; y: number; alpha: number }> = [];

  // 2.5D Articulated Submarine Arm
  private armBase = { x: 190, y: 260 };
  private armElbow = { x: 340, y: 290 };
  private armWrist = { x: 480, y: 320 };
  private armTarget = { x: 600, y: 360 };

  // Bio-Care Phase States
  private careTargets: BioCareTarget[] = [];
  private activeCareIndex = 0;
  private careToolDragging = false;
  private careToolPos = { x: 640, y: 640 };

  // Obstacle Entity Lists
  private turtleRopes: TurtleRope[] = [];
  private ropeFragments: Array<{ x: number; y: number; vx: number; vy: number; angle: number; vAngle: number; length: number; color: string; life: number }> = [];
  private crabRocks: CrabRock[] = [];
  private draggingRockIndex: number | null = null;
  private rockDragOffset = { x: 0, y: 0 };
  private whaleDebrisList: WhaleDebris[] = [];
  private otterOilSpots: OtterOilSpot[] = [];
  private squidCables: SquidCable[] = [];

  // Particles, Bubbles & Juice
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }> = [];
  private ambientBubbles: Array<{ x: number; y: number; radius: number; speed: number; alpha: number; wobbleSpeed: number; wobbleAmp: number }> = [];
  private heartBubbles: Array<{ x: number; y: number; size: number; vy: number; alpha: number }> = [];
  private actionBursts: Array<{ text: string; x: number; y: number; color: string; life: number; maxLife: number; scale: number }> = [];

  // Animation Timing
  private time = 0;
  private idleTime = 0;
  private hintActive = false;
  private screenShake = 0;
  private freedomAnimTimer = 0;
  private isBlinking = false;
  private animalBlinkTimer = 0;
  private eyeAngle = 0;

  // Loop control
  private animFrameId: number | null = null;
  private lastTime = 0;
  private isRunning = false;
  private completeTimeoutId: number | null = null;
  private boundPointerDown: ((e: PointerEvent) => void) | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: (() => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    gup: GupData,
    upgrades: GupUpgrades | undefined,
    onStepSuccess: (step: number) => void,
    onAllRescued: () => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context not available");
    this.ctx = context;
    this.mission = mission;
    this.gup = gup;
    this.upgrades = upgrades || { speedLevel: 0, shieldLevel: 0, sonarLevel: 0 };
    this.onStepSuccess = onStepSuccess;
    this.onAllRescued = onAllRescued;

    this.initMissionEntities();
    this.initBioCareTargets();
    this.initAtmosphere();
    this.bindPointerEvents();

    this.companionSpeech = this.mission.tutorial;
    this.companionSpeechTimer = 4.5;
  }

  private initMissionEntities() {
    this.currentStep = 0;
    this.isDangerCleared = false;
    this.isCarePhase = false;
    this.isCompleted = false;

    const ax = this.animalX;
    const ay = this.animalY;

    if (this.mission.id === "sea-turtle") {
      this.totalSteps = 3;
      this.turtleRopes = [
        { id: "rope-1", x1: ax - 85, y1: ay - 45, x2: ax + 85, y2: ay - 35, cut: false, color: "#d7ccc8", order: 0 },
        { id: "rope-2", x1: ax - 70, y1: ay + 5, x2: ax + 70, y2: ay + 15, cut: false, color: "#bcaaa4", order: 1 },
        { id: "rope-3", x1: ax - 95, y1: ay + 45, x2: ax + 95, y2: ay + 40, cut: false, color: "#a1887f", order: 2 }
      ];
    } else if (this.mission.id === "crab") {
      this.totalSteps = 3;
      this.crabRocks = [
        { id: "rock-1", x: ax + 70, y: ay - 45, radius: 46, cleared: false, color: "#5d4037", order: 0, startX: ax + 70, startY: ay - 45 },
        { id: "rock-2", x: ax - 65, y: ay + 35, radius: 42, cleared: false, color: "#4e342e", order: 1, startX: ax - 65, startY: ay + 35 },
        { id: "rock-3", x: ax + 60, y: ay + 55, radius: 40, cleared: false, color: "#3e2723", order: 2, startX: ax + 60, startY: ay + 55 }
      ];
    } else if (this.mission.id === "young-whale") {
      this.totalSteps = 3;
      this.whaleDebrisList = [
        { id: "deb-1", x: ax - 70, y: ay - 25, width: 75, height: 45, cleared: false, name: "대형 폐그물", color: "#37474f", order: 0, hooked: false },
        { id: "deb-2", x: ax + 20, y: ay + 35, width: 85, height: 48, cleared: false, name: "부유 플라스틱", color: "#455a64", order: 1, hooked: false },
        { id: "deb-3", x: ax + 95, y: ay - 35, width: 70, height: 50, cleared: false, name: "녹슨 철제 파편", color: "#263238", order: 2, hooked: false }
      ];
    } else if (this.mission.id === "sea-otter") {
      this.totalSteps = 3;
      this.otterOilSpots = [
        { id: "oil-1", x: ax - 45, y: ay - 20, radius: 36, cleanedPercent: 0, cleared: false, order: 0 },
        { id: "oil-2", x: ax + 40, y: ay + 15, radius: 38, cleanedPercent: 0, cleared: false, order: 1 },
        { id: "oil-3", x: ax + 5, y: ay - 30, radius: 34, cleanedPercent: 0, cleared: false, order: 2 }
      ];
    } else if (this.mission.id === "giant-squid") {
      this.totalSteps = 3;
      this.squidCables = [
        { id: "cable-1", x1: ax - 80, y1: ay - 55, x2: ax + 90, y2: ay - 45, cut: false, color: "#29b6f6", order: 0 },
        { id: "cable-2", x1: ax - 90, y1: ay + 5, x2: ax + 85, y2: ay + 20, cut: false, color: "#00e5ff", order: 1 },
        { id: "cable-3", x1: ax - 75, y1: ay + 60, x2: ax + 95, y2: ay + 50, cut: false, color: "#40c4ff", order: 2 }
      ];
    }
  }

  private initBioCareTargets() {
    this.careTargets = [
      {
        id: "care-1",
        label: "비타민 바이오 스프레이",
        type: "spray",
        icon: "🩺",
        progress: 0,
        completed: false
      },
      {
        id: "care-2",
        label: "체력 회복 영양 미끼",
        type: "feed",
        icon: "🦐",
        progress: 0,
        completed: false
      },
      {
        id: "care-3",
        label: "메디컬 생체 활력 스캔",
        type: "scan",
        icon: "🔬",
        progress: 0,
        completed: false
      }
    ];
  }

  private initAtmosphere() {
    this.ambientBubbles = [];
    for (let i = 0; i < 35; i++) {
      this.ambientBubbles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        radius: 3 + Math.random() * 8,
        speed: 25 + Math.random() * 45,
        alpha: 0.2 + Math.random() * 0.45,
        wobbleSpeed: 2 + Math.random() * 2,
        wobbleAmp: 15 + Math.random() * 20
      });
    }
  }

  private bindPointerEvents() {
    const getPos = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.boundPointerDown = (e: PointerEvent) => {
      this.isPointerDown = true;
      this.idleTime = 0;
      const pos = getPos(e);
      this.pointerPos = pos;
      this.pointerDownPos = pos;

      if (!this.isDangerCleared) {
        this.handleDangerPointerDown(pos.x, pos.y);
      } else if (this.isCarePhase) {
        this.handleCarePointerDown(pos.x, pos.y);
      }
    };

    this.boundPointerMove = (e: PointerEvent) => {
      const pos = getPos(e);
      this.pointerPos = pos;

      if (this.isPointerDown) {
        this.idleTime = 0;
        if (!this.isDangerCleared) {
          this.handleDangerPointerMove(pos.x, pos.y);
        } else if (this.isCarePhase) {
          this.handleCarePointerMove(pos.x, pos.y);
        }
      }
    };

    this.boundPointerUp = () => {
      this.isPointerDown = false;
      this.handleDangerPointerUp();
      this.handleCarePointerUp();
    };

    this.canvas.addEventListener("pointerdown", this.boundPointerDown);
    window.addEventListener("pointermove", this.boundPointerMove);
    window.addEventListener("pointerup", this.boundPointerUp);
  }

  private addActionBurst(text: string, x: number, y: number, color = "#ffd54f") {
    this.actionBursts.push({
      text,
      x,
      y,
      color,
      life: 1.2,
      maxLife: 1.2,
      scale: 0.6
    });
  }

  // --- Danger Handling Logic ---
  private handleDangerPointerDown(x: number, y: number) {
    if (this.mission.id === "sea-turtle") {
      this.handleTurtleLaserCutting(x, y);
    } else if (this.mission.id === "crab") {
      this.handleCrabRockGrab(x, y);
    } else if (this.mission.id === "young-whale") {
      this.handleWhaleDebrisHook(x, y);
    } else if (this.mission.id === "sea-otter") {
      this.handleOtterOilCleaning(x, y);
    } else if (this.mission.id === "giant-squid") {
      this.handleSquidCableCutting(x, y);
    }
  }

  private handleDangerPointerMove(x: number, y: number) {
    if (this.mission.id === "sea-turtle") {
      this.handleTurtleLaserCutting(x, y);
    } else if (this.mission.id === "crab") {
      this.handleCrabRockDrag(x, y);
    } else if (this.mission.id === "sea-otter") {
      this.handleOtterOilCleaning(x, y);
    } else if (this.mission.id === "giant-squid") {
      this.handleSquidCableCutting(x, y);
    }
  }

  private handleDangerPointerUp() {
    if (this.mission.id === "crab" && this.draggingRockIndex !== null) {
      const rock = this.crabRocks[this.draggingRockIndex];
      const distFromStart = Math.hypot(rock.x - rock.startX, rock.y - rock.startY);
      if (distFromStart > 110) {
        rock.cleared = true;
        this.screenShake = 6;
        Audio.playRockClear();
        this.addActionBurst("💎 BOULDER CLEARED!", rock.x, rock.y, "#ffd54f");
        this.advanceDangerStep();
      } else {
        rock.x = rock.startX;
        rock.y = rock.startY;
      }
      this.draggingRockIndex = null;
    }
  }

  private handleTurtleLaserCutting(x: number, y: number) {
    this.laserTrail.push({ x, y, alpha: 1.0 });

    for (const rope of this.turtleRopes) {
      if (rope.cut || rope.order !== this.currentStep) continue;

      const d = this.distToSegment(x, y, rope.x1, rope.y1, rope.x2, rope.y2);
      if (d < 45) {
        rope.cut = true;
        this.screenShake = 6;
        Audio.playCut();
        this.advanceDangerStep();

        const midX = (rope.x1 + rope.x2) / 2;
        const midY = (rope.y1 + rope.y2) / 2;
        this.addActionBurst("✂️ ROPE CUT!", midX, midY, "#ffd54f");

        // Emit 3D flying rope fragments
        for (let i = 0; i < 4; i++) {
          this.ropeFragments.push({
            x: midX + (i - 1.5) * 16,
            y: midY,
            vx: (Math.random() - 0.5) * 220,
            vy: -(60 + Math.random() * 80),
            angle: Math.random() * Math.PI,
            vAngle: (Math.random() - 0.5) * 8,
            length: 24 + Math.random() * 16,
            color: rope.color,
            life: 1.2
          });
        }

        // Particle sparks
        for (let i = 0; i < 20; i++) {
          this.particles.push({
            x: midX,
            y: midY,
            vx: (Math.random() - 0.5) * 280,
            vy: (Math.random() - 0.5) * 280,
            life: 0.65,
            maxLife: 0.65,
            color: "#ffd54f",
            size: 4 + Math.random() * 4
          });
        }
        break;
      }
    }
  }

  private handleCrabRockGrab(x: number, y: number) {
    for (let i = 0; i < this.crabRocks.length; i++) {
      const rock = this.crabRocks[i];
      if (rock.cleared || rock.order !== this.currentStep) continue;

      const d = Math.hypot(x - rock.x, y - rock.y);
      if (d < rock.radius + 20) {
        this.draggingRockIndex = i;
        this.rockDragOffset = { x: rock.x - x, y: rock.y - y };
        Audio.playGrab();
        break;
      }
    }
  }

  private handleCrabRockDrag(x: number, y: number) {
    if (this.draggingRockIndex !== null) {
      const rock = this.crabRocks[this.draggingRockIndex];
      rock.x = x + this.rockDragOffset.x;
      rock.y = y + this.rockDragOffset.y;

      if (Math.random() < 0.3) {
        this.particles.push({
          x: rock.x,
          y: rock.y,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          life: 0.4,
          maxLife: 0.4,
          color: "#8d6e63",
          size: 4
        });
      }
    }
  }

  private handleWhaleDebrisHook(x: number, y: number) {
    for (const deb of this.whaleDebrisList) {
      if (deb.cleared || deb.order !== this.currentStep) continue;

      const dx = Math.abs(x - deb.x);
      const dy = Math.abs(y - deb.y);
      if (dx < deb.width / 2 + 25 && dy < deb.height / 2 + 25) {
        if (!deb.hooked) {
          deb.hooked = true;
          Audio.playConnect();
          this.addActionBurst("🧲 TOW HOOK ATTACHED!", deb.x, deb.y, "#00e5ff");
        } else {
          deb.cleared = true;
          deb.velocity = { x: 340, y: -220 };
          this.screenShake = 7;
          Audio.playTurboBoost();
          this.addActionBurst("🚀 TOWED AWAY!", deb.x, deb.y, "#69f0ae");
          this.advanceDangerStep();
        }
        break;
      }
    }
  }

  private handleOtterOilCleaning(x: number, y: number) {
    for (const oil of this.otterOilSpots) {
      if (oil.cleared || oil.order !== this.currentStep) continue;

      const dist = Math.hypot(x - oil.x, y - oil.y);
      if (dist < oil.radius + 35) {
        oil.cleanedPercent += 18;
        Audio.playSpray();

        // 3D Foam bubbles
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: x + (Math.random() - 0.5) * 35,
            y: y + (Math.random() - 0.5) * 35,
            vx: (Math.random() - 0.5) * 80,
            vy: -(30 + Math.random() * 45),
            life: 0.6,
            maxLife: 0.6,
            color: "#e0f7fa",
            size: 6 + Math.random() * 4
          });
        }

        if (oil.cleanedPercent >= 100) {
          oil.cleared = true;
          this.screenShake = 5;
          Audio.playSuccess();
          this.addActionBurst("✨ SQUEAKY CLEAN!", oil.x, oil.y, "#69f0ae");
          this.advanceDangerStep();
        }
      }
    }
  }

  private handleSquidCableCutting(x: number, y: number) {
    for (const cable of this.squidCables) {
      if (cable.cut || cable.order !== this.currentStep) continue;

      const d = this.distToSegment(x, y, cable.x1, cable.y1, cable.x2, cable.y2);
      if (d < 50) {
        cable.cut = true;
        this.screenShake = 8;
        Audio.playCut();
        this.advanceDangerStep();

        const midX = (cable.x1 + cable.x2) / 2;
        const midY = (cable.y1 + cable.y2) / 2;
        this.addActionBurst("⚡ CABLE SEVERED!", midX, midY, "#00e5ff");

        for (let i = 0; i < 30; i++) {
          this.particles.push({
            x: midX,
            y: midY,
            vx: (Math.random() - 0.5) * 360,
            vy: (Math.random() - 0.5) * 360,
            life: 0.8,
            maxLife: 0.8,
            color: Math.random() < 0.6 ? "#00e5ff" : "#ffeb3b",
            size: 5
          });
        }
        break;
      }
    }
  }

  private advanceDangerStep() {
    this.currentStep++;
    this.vitals.heartRate = Math.max(72, this.vitals.heartRate - 12);
    this.vitals.stressLevel = Math.max(15, this.vitals.stressLevel - 25);
    this.vitals.healthPercent = Math.min(80, this.vitals.healthPercent + 15);

    const dialog = this.mission.dialogues[this.currentStep - 1];
    if (dialog) {
      this.companionSpeech = dialog;
      this.companionSpeechTimer = 4.0;
    }

    this.onStepSuccess(this.currentStep);

    if (this.currentStep >= this.totalSteps) {
      this.isDangerCleared = true;
      this.isCarePhase = true;
      this.activeCareIndex = 0;
      this.companionSpeech = "위험 요소 완전 제거 성공! 이제 페소의 바이오 메디컬 치료를 진행합시다!";
      this.companionSpeechTimer = 4.5;
      Audio.playOctoAlert();

      // Emit heart bubbles
      for (let i = 0; i < 16; i++) {
        this.heartBubbles.push({
          x: this.animalX + (Math.random() - 0.5) * 180,
          y: this.animalY + (Math.random() - 0.5) * 90,
          size: 24 + Math.random() * 16,
          vy: -(45 + Math.random() * 35),
          alpha: 1.0
        });
      }
    }
  }

  // --- Bio-Care Phase Handling ---
  private handleCarePointerDown(x: number, y: number) {
    const target = this.careTargets[this.activeCareIndex];
    if (!target) return;

    const toolX = 640;
    const toolY = 640;
    const distToTool = Math.hypot(x - toolX, y - toolY);
    const distToAnimal = Math.hypot(x - this.animalX, y - this.animalY);

    if (distToTool < 75) {
      this.careToolDragging = true;
      this.careToolPos = { x, y };
      Audio.playGrab();
    } else if (distToAnimal < 160) {
      this.applyCareProgress(target, x, y, 22);
    }
  }

  private handleCarePointerMove(x: number, y: number) {
    const target = this.careTargets[this.activeCareIndex];
    if (!target) return;

    if (this.careToolDragging) {
      this.careToolPos = { x, y };
    }

    const distToAnimal = Math.hypot(x - this.animalX, y - this.animalY);
    if (distToAnimal < 160) {
      this.applyCareProgress(target, x, y, 5.0);
    }
  }

  private applyCareProgress(target: BioCareTarget, x: number, y: number, amount: number) {
    target.progress += amount;

    if (target.type === "spray") {
      Audio.playSpray();
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 35,
          y: y + (Math.random() - 0.5) * 35,
          vx: (Math.random() - 0.5) * 80,
          vy: -(35 + Math.random() * 45),
          life: 0.6,
          maxLife: 0.6,
          color: "#69f0ae",
          size: 6
        });
      }
    } else if (target.type === "feed") {
      if (Math.random() < 0.4) Audio.playMunch();
      this.heartBubbles.push({
        x: this.animalX + (Math.random() - 0.5) * 80,
        y: this.animalY,
        size: 22,
        vy: -55,
        alpha: 1.0
      });
    } else if (target.type === "scan") {
      if (Math.random() < 0.35) Audio.playScannerBleep();
    }

    this.vitals.healthPercent = Math.min(100, 80 + Math.round((this.activeCareIndex + target.progress / 100) * 6.7));

    if (target.progress >= 100) {
      target.completed = true;
      this.careToolDragging = false;
      this.careToolPos = { x: 640, y: 640 };
      Audio.playSuccess();
      this.addActionBurst("💖 COMPLETE!", this.animalX, this.animalY - 60, "#69f0ae");

      this.activeCareIndex++;
      if (this.activeCareIndex >= this.careTargets.length) {
        // All Bio-Care Completed!
        this.vitals.heartRate = 65;
        this.vitals.stressLevel = 0;
        this.vitals.oxygenLevel = 99;
        this.vitals.healthPercent = 100;
        this.isCompleted = true;
        this.isCarePhase = false;

        this.companionSpeech = "완벽한 치료 완료! 건강을 100% 회복하여 바다로 기쁘게 돌아갑니다!";
        this.companionSpeechTimer = 5.0;

        Audio.speak("완벽한 치료 완료! 건강을 100% 회복하여 바다로 돌아갑니다!", {
          companion: this.mission.companion
        });

        this.completeTimeoutId = window.setTimeout(() => {
          this.onAllRescued();
        }, 3400);
      }
    }
  }

  private handleCarePointerUp() {
    this.careToolDragging = false;
    this.careToolPos = { x: 640, y: 640 };
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    this.isPointerDown = false;
    this.careToolDragging = false;
    this.draggingRockIndex = null;
    if (this.completeTimeoutId !== null) {
      clearTimeout(this.completeTimeoutId);
      this.completeTimeoutId = null;
    }
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
    this.time += dt;
    this.idleTime += dt;
    this.hintActive = this.idleTime > 1.3 && !this.isCompleted;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 18);
    }

    if (this.companionSpeechTimer > 0) {
      this.companionSpeechTimer -= dt;
    }

    // 2.5D Articulated Submarine Arm Inverse Kinematics Tracking
    const subStationY = 240 + Math.sin(this.time * 2) * 8;
    this.armBase = { x: 190, y: subStationY + 20 };

    if (this.isPointerDown) {
      this.armTarget = { x: this.pointerPos.x, y: this.pointerPos.y };
    } else {
      this.armTarget = { x: this.animalX - 90, y: this.animalY + Math.sin(this.time * 3) * 15 };
    }

    // 2-Joint Robotic Arm positioning
    const dx = this.armTarget.x - this.armBase.x;
    const dy = this.armTarget.y - this.armBase.y;
    this.armElbow = {
      x: this.armBase.x + dx * 0.45 - 25,
      y: this.armBase.y + dy * 0.45 - 45
    };
    this.armWrist = {
      x: this.armBase.x + dx * 0.85,
      y: this.armBase.y + dy * 0.85
    };

    // Eye blinking & pupil tracking
    this.animalBlinkTimer += dt;
    if (this.animalBlinkTimer > 3.2) {
      this.isBlinking = true;
      if (this.animalBlinkTimer > 3.4) {
        this.isBlinking = false;
        this.animalBlinkTimer = 0;
      }
    }
    this.eyeAngle = Math.atan2(this.pointerPos.y - this.animalY, this.pointerPos.x - this.animalX);

    this.ecgPhase += dt * (this.vitals.heartRate / 60) * Math.PI * 2;

    // Ambient Bubbles
    for (const b of this.ambientBubbles) {
      b.y -= b.speed * dt;
      b.x += Math.sin(this.time * b.wobbleSpeed) * b.wobbleAmp * dt;
      if (b.y < -20) {
        b.y = 740;
        b.x = Math.random() * 1280;
      }
    }

    // Action Text Bursts
    for (let i = this.actionBursts.length - 1; i >= 0; i--) {
      const ab = this.actionBursts[i];
      ab.life -= dt;
      ab.y -= 35 * dt;
      ab.scale = Math.min(1.2, ab.scale + dt * 2);
      if (ab.life <= 0) {
        this.actionBursts.splice(i, 1);
      }
    }

    // Laser Trail Fade
    for (let i = this.laserTrail.length - 1; i >= 0; i--) {
      this.laserTrail[i].alpha -= dt * 3.5;
      if (this.laserTrail[i].alpha <= 0) {
        this.laserTrail.splice(i, 1);
      }
    }

    // Rope Fragments Physics
    for (let i = this.ropeFragments.length - 1; i >= 0; i--) {
      const rf = this.ropeFragments[i];
      rf.x += rf.vx * dt;
      rf.y += rf.vy * dt;
      rf.angle += rf.vAngle * dt;
      rf.vy -= 15 * dt;
      rf.life -= dt;
      if (rf.life <= 0) {
        this.ropeFragments.splice(i, 1);
      }
    }

    // Whale Debris flying away
    for (const deb of this.whaleDebrisList) {
      if (deb.cleared && deb.velocity) {
        deb.x += deb.velocity.x * dt;
        deb.y += deb.velocity.y * dt;
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Heart Bubbles
    for (let i = this.heartBubbles.length - 1; i >= 0; i--) {
      const hb = this.heartBubbles[i];
      hb.y += hb.vy * dt;
      hb.alpha -= dt * 0.4;
      if (hb.alpha <= 0 || hb.y < -30) {
        this.heartBubbles.splice(i, 1);
      }
    }

    // Completed Celebration Swim
    if (this.isCompleted) {
      this.freedomAnimTimer += dt;
      this.animalX += Math.cos(this.freedomAnimTimer * 2) * 85 * dt + 80 * dt;
      this.animalY += Math.sin(this.freedomAnimTimer * 3) * 55 * dt;
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Screen Shake effect
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake * 2;
      const sy = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(sx, sy);
    }

    // 1. Cinematic Deep Ocean Background
    this.renderCinematicBackground(ctx, w, h);

    // 2. 2.5D Isometric Textured Seabed Platform & Grid
    this.render2D5SeabedArena(ctx, w, h);

    // 3. Animated Water Light Caustics
    this.renderWaterCaustics(ctx, w, h);

    // 4. Ambient Marine Bubbles & Floating Plankton
    this.renderAmbientAtmosphere(ctx);

    // 5. Environment Background Details (Corals, Kelp, Arctic Ice, Abyss)
    this.renderEnvironmentBackground(ctx, w, h);

    // 6. GUP Submarine Command Base on Left with Articulated 3D Arm
    this.renderGupSubStation(ctx);

    // 7. Dynamic Drop Shadow under Rescued Marine Animal
    this.renderAnimalSeabedShadow(ctx);

    // 8. Rescued Marine Animal (2.5D Volumetric Handcrafted Rendering)
    this.renderRescuedAnimal(ctx);

    // 9. Interactive Obstacles & Dangers in 2.5D Depth
    if (!this.isDangerCleared) {
      if (this.mission.id === "sea-turtle") {
        this.renderTurtleRopes(ctx);
      } else if (this.mission.id === "crab") {
        this.renderCrabRocks(ctx);
      } else if (this.mission.id === "young-whale") {
        this.renderWhaleDebris(ctx);
      } else if (this.mission.id === "sea-otter") {
        this.renderOtterOilSpots(ctx);
      } else if (this.mission.id === "giant-squid") {
        this.renderSquidCables(ctx);
      }
    }

    // 10. Bio-Care Medical Dock (Phase 2)
    if (this.isCarePhase) {
      this.renderBioCareHUD(ctx, w, h);
    }

    // 11. Laser Cut Trail
    this.renderLaserTrail(ctx);

    // 12. Floating Particles & Sparkles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }

    // 13. Heart Bubbles
    for (const hb of this.heartBubbles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, hb.alpha);
      ctx.font = `${hb.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💖", hb.x, hb.y);
      ctx.restore();
    }

    // 14. Floating Action Text Bursts
    for (const ab of this.actionBursts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ab.life / ab.maxLife);
      ctx.translate(ab.x, ab.y);
      ctx.scale(ab.scale, ab.scale);
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.roundRect(-85, -20, 170, 40, 14);
      ctx.fill();
      ctx.strokeStyle = ab.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = ab.color;
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ab.text, 0, 0);
      ctx.restore();
    }

    // 15. Dynamic Integrated HUD (Comms, Vitals, Stage Chips)
    this.renderIntegratedHUD(ctx, w, h);

    ctx.restore();
  }

  private renderCinematicBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w / 1.05);
    if (this.mission.environment === "coral-reef") {
      bgGrad.addColorStop(0, "#0c3b60");
      bgGrad.addColorStop(0.7, "#052038");
      bgGrad.addColorStop(1, "#020f1c");
    } else if (this.mission.environment === "kelp-forest") {
      bgGrad.addColorStop(0, "#094339");
      bgGrad.addColorStop(0.7, "#03231d");
      bgGrad.addColorStop(1, "#01120f");
    } else if (this.mission.environment === "arctic-ocean") {
      bgGrad.addColorStop(0, "#0f3c57");
      bgGrad.addColorStop(0.7, "#072235");
      bgGrad.addColorStop(1, "#03111c");
    } else if (this.mission.environment === "abyssal-zone" || this.mission.environment === "deep-trench") {
      bgGrad.addColorStop(0, "#180b33");
      bgGrad.addColorStop(0.7, "#0a0319");
      bgGrad.addColorStop(1, "#03010b");
    } else {
      bgGrad.addColorStop(0, "#071c32");
      bgGrad.addColorStop(0.7, "#031020");
      bgGrad.addColorStop(1, "#010811");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  }

  private render2D5SeabedArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // 2.5D Isometric Stage Floor Platform
    ctx.save();
    const stageY = h - 140;

    // Platform Base Gradient
    const floorGrad = ctx.createLinearGradient(0, stageY, 0, h);
    floorGrad.addColorStop(0, "rgba(8, 38, 62, 0.95)");
    floorGrad.addColorStop(0.5, "rgba(4, 22, 38, 0.98)");
    floorGrad.addColorStop(1, "rgba(2, 10, 18, 1)");
    ctx.fillStyle = floorGrad;

    ctx.beginPath();
    ctx.moveTo(80, stageY);
    ctx.lineTo(w - 80, stageY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 2.5D Holographic Grid Lines on Seabed
    ctx.strokeStyle = "rgba(77, 208, 225, 0.15)";
    ctx.lineWidth = 1.5;

    // Longitudinal grid lines converging in perspective
    for (let x = 120; x <= w - 120; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, stageY);
      const bottomX = (x - w / 2) * 1.35 + w / 2;
      ctx.lineTo(bottomX, h);
      ctx.stroke();
    }

    // Latitudinal grid lines with perspective spacing
    for (let y = stageY + 25; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Glowing Neon Edge along Stage Horizon
    ctx.strokeStyle = "rgba(77, 208, 225, 0.6)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#4dd0e1";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(80, stageY);
    ctx.lineTo(w - 80, stageY);
    ctx.stroke();

    ctx.restore();
  }

  private renderWaterCaustics(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#80deea";
    ctx.lineWidth = 16;

    const t = this.time * 0.8;
    for (let y = 80; y < h; y += 130) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 40) {
        const wave = Math.sin(x * 0.012 + t + y * 0.02) * 22 + Math.cos(x * 0.02 - t) * 14;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderAmbientAtmosphere(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const b of this.ambientBubbles) {
      ctx.fillStyle = `rgba(178, 235, 242, ${b.alpha})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bubble 3D specular highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 1.3})`;
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderEnvironmentBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    if (this.mission.environment === "coral-reef") {
      ctx.fillStyle = "#ef5350";
      ctx.beginPath();
      ctx.arc(120, h - 20, 110, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#ff7043";
      ctx.beginPath();
      ctx.arc(200, h - 10, 80, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = "#66bb6a";
      ctx.beginPath();
      ctx.arc(w - 140, h - 20, 120, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#ab47bc";
      ctx.beginPath();
      ctx.arc(w - 240, h - 10, 85, Math.PI, 0);
      ctx.fill();
    } else if (this.mission.environment === "kelp-forest") {
      ctx.fillStyle = "rgba(46, 125, 50, 0.45)";
      for (let i = 0; i < 8; i++) {
        const x = 240 + i * 130;
        const wave = Math.sin(this.time * 2 + i * 0.8) * 24;
        ctx.beginPath();
        ctx.moveTo(x - 14, h);
        ctx.quadraticCurveTo(x + wave, h / 2, x - wave * 0.8, 40);
        ctx.quadraticCurveTo(x + wave * 0.5, h / 2, x + 14, h);
        ctx.fill();
      }
    } else if (this.mission.environment === "arctic-ocean") {
      ctx.fillStyle = "rgba(128, 222, 234, 0.25)";
      ctx.beginPath();
      ctx.moveTo(80, 0);
      ctx.lineTo(240, 320);
      ctx.lineTo(340, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w - 380, 0);
      ctx.lineTo(w - 200, 360);
      ctx.lineTo(w - 60, 0);
      ctx.closePath();
      ctx.fill();
    } else if (this.mission.environment === "abyssal-zone" || this.mission.environment === "deep-trench") {
      for (let j = 0; j < 3; j++) {
        const jx = 260 + j * 360 + Math.sin(this.time + j) * 40;
        const jy = 180 + Math.sin(this.time * 1.5 + j) * 60;
        ctx.fillStyle = "rgba(0, 229, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(jx, jy, 24, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 229, 255, 0.25)";
        ctx.lineWidth = 2;
        for (let t = -2; t <= 2; t++) {
          ctx.beginPath();
          ctx.moveTo(jx + t * 8, jy);
          ctx.lineTo(jx + t * 10 + Math.sin(this.time * 3 + t) * 12, jy + 35);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private renderGupSubStation(ctx: CanvasRenderingContext2D) {
    const subX = 140;
    const subY = 240 + Math.sin(this.time * 2) * 8;

    ctx.save();

    // 1. Dual Volumetric Searchlight Cone
    ctx.save();
    ctx.globalAlpha = 0.28;
    const beamGrad = ctx.createLinearGradient(subX + 40, subY, subX + 640, subY + 140);
    beamGrad.addColorStop(0, "rgba(255, 255, 220, 0.95)");
    beamGrad.addColorStop(0.35, "rgba(255, 255, 220, 0.4)");
    beamGrad.addColorStop(1, "rgba(255, 255, 220, 0)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(subX + 45, subY - 18);
    ctx.lineTo(subX + 640, subY - 40);
    ctx.lineTo(subX + 640, subY + 280);
    ctx.lineTo(subX + 45, subY + 24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Articulated 3-Segment 2.5D Mechanical Robotic Arm
    ctx.save();
    // Segment 1 (Shoulder to Elbow)
    ctx.strokeStyle = "#455a64";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(this.armBase.x, this.armBase.y);
    ctx.lineTo(this.armElbow.x, this.armElbow.y);
    ctx.stroke();

    // Shoulder Gold Joint
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(this.armBase.x, this.armBase.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Segment 2 (Elbow to Wrist)
    ctx.strokeStyle = "#78909c";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(this.armElbow.x, this.armElbow.y);
    ctx.lineTo(this.armWrist.x, this.armWrist.y);
    ctx.stroke();

    // Elbow Joint Disc
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(this.armElbow.x, this.armElbow.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Precision Tool Emitter Head (Wrist to Target)
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.armWrist.x, this.armWrist.y);
    ctx.lineTo(this.armTarget.x, this.armTarget.y);
    ctx.stroke();

    // Emitter Glow Point
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.armTarget.x, this.armTarget.y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Submarine Hull (GUP Base)
    ctx.translate(subX, subY);

    const bodyGrad = ctx.createLinearGradient(0, -48, 0, 48);
    bodyGrad.addColorStop(0, "#ffffff");
    bodyGrad.addColorStop(0.18, this.gup.color);
    bodyGrad.addColorStop(0.85, "#0b263d");
    bodyGrad.addColorStop(1, "#03101c");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 84, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Accent Stripe
    const stripeGrad = ctx.createLinearGradient(0, 0, 0, 24);
    stripeGrad.addColorStop(0, this.gup.accentColor);
    stripeGrad.addColorStop(1, "#051829");
    ctx.fillStyle = stripeGrad;
    ctx.beginPath();
    ctx.ellipse(0, 10, 74, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Glass Dome & Companion Pilot
    const domeGrad = ctx.createRadialGradient(38, -6, 2, 38, -6, 28);
    domeGrad.addColorStop(0, "#ffffff");
    domeGrad.addColorStop(0.4, "#80deea");
    domeGrad.addColorStop(0.85, "#00838f");
    domeGrad.addColorStop(1, "#004d40");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(38, -6, 28, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.mission.companionAvatar, 34, -6);

    ctx.restore();
  }

  private renderAnimalSeabedShadow(ctx: CanvasRenderingContext2D) {
    // 2.5D Soft Contact Drop Shadow on the Seabed Grid
    ctx.save();
    const shadowY = 560;
    const shadowScale = 1.0 + Math.sin(this.time * 2.5) * 0.08;

    ctx.translate(this.animalX, shadowY);
    ctx.scale(shadowScale, 0.35);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Rescued Marine Animal Handcrafted Renderers ---
  private renderRescuedAnimal(ctx: CanvasRenderingContext2D) {
    const ax = this.animalX;
    const ay = this.animalY + Math.sin(this.time * 2.5) * 10;

    ctx.save();
    ctx.translate(ax, ay);

    if (this.mission.id === "sea-turtle") {
      this.renderSeaTurtle(ctx);
    } else if (this.mission.id === "crab") {
      this.renderCoconutCrab(ctx);
    } else if (this.mission.id === "young-whale") {
      this.renderYoungWhale(ctx);
    } else if (this.mission.id === "sea-otter") {
      this.renderSeaOtter(ctx);
    } else if (this.mission.id === "giant-squid") {
      this.renderGiantSquid(ctx);
    }

    if (!this.isDangerCleared && !this.isCompleted) {
      ctx.fillStyle = "#80deea";
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💧", 40 + Math.sin(this.time * 8) * 4, -95);
    }

    ctx.restore();
  }

  private renderSeaTurtle(ctx: CanvasRenderingContext2D) {
    const flipperWave = Math.sin(this.time * 3) * 0.18;

    // Rear Flippers
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.ellipse(-52, 78, 26, 16, 0.4, 0, Math.PI * 2);
    ctx.ellipse(52, 78, 26, 16, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Front Flippers with 3D Bevel
    ctx.fillStyle = "#388e3c";
    ctx.save();
    ctx.rotate(flipperWave);
    ctx.beginPath();
    ctx.ellipse(-110, -35, 56, 24, -0.6, 0, Math.PI * 2);
    ctx.ellipse(110, -35, 56, 24, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#81c784";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Volumetric 3D Carapace Shell with Radial Gradient
    const shellGrad = ctx.createRadialGradient(-15, -20, 15, 0, 0, 96);
    shellGrad.addColorStop(0, "#81c784");
    shellGrad.addColorStop(0.35, "#4caf50");
    shellGrad.addColorStop(0.75, "#2e7d32");
    shellGrad.addColorStop(1, "#1b5e20");
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 96, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a5d6a7";
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3D Beveled Scute Plates
    ctx.fillStyle = "#66bb6a";
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 2.5;
    for (let s = -2; s <= 2; s++) {
      ctx.beginPath();
      ctx.arc(s * 32, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    for (let s = -1; s <= 1; s++) {
      ctx.beginPath();
      ctx.arc(s * 38, -34, 14, 0, Math.PI * 2);
      ctx.arc(s * 38, 34, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Turtle Head
    const headGrad = ctx.createLinearGradient(0, -125, 0, -65);
    headGrad.addColorStop(0, "#81c784");
    headGrad.addColorStop(0.6, "#388e3c");
    headGrad.addColorStop(1, "#1b5e20");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -98, 30, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a5d6a7";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Expressive Tracking Eyes
    this.renderAnimalEyes(ctx, -14, -105, 14, -105, 8);

    // Mouth / Smile
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (this.isDangerCleared || this.isCompleted) {
      ctx.arc(0, -86, 12, 0.1 * Math.PI, 0.9 * Math.PI);
    } else {
      ctx.arc(0, -80, 9, 1.1 * Math.PI, 1.9 * Math.PI);
    }
    ctx.stroke();
  }

  private renderCoconutCrab(ctx: CanvasRenderingContext2D) {
    const clawWave = Math.sin(this.time * 3) * 0.14;

    // Jointed Legs on Sides
    ctx.strokeStyle = "#d32f2f";
    ctx.lineWidth = 9;
    for (let l = -3; l <= 3; l++) {
      if (l === 0) continue;
      const side = l > 0 ? 1 : -1;
      const legY = l * 18;
      ctx.beginPath();
      ctx.moveTo(side * 55, legY);
      ctx.lineTo(side * 95, legY - 18);
      ctx.lineTo(side * 125, legY + 22);
      ctx.stroke();
    }

    // Huge 3D Carapace Shell
    const crabGrad = ctx.createRadialGradient(-10, -15, 10, 0, 0, 75);
    crabGrad.addColorStop(0, "#ff5252");
    crabGrad.addColorStop(0.65, "#c62828");
    crabGrad.addColorStop(1, "#3e2723");
    ctx.fillStyle = crabGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 74, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff8a80";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Giant 3D Claws
    ctx.save();
    ctx.rotate(clawWave);
    const drawClaw = (cx: number, cy: number, flip: number) => {
      ctx.fillStyle = "#b71c1c";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 38, 24, flip * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff8a80";
      ctx.lineWidth = 3.5;
      ctx.stroke();
    };
    drawClaw(-98, -55, -1);
    drawClaw(98, -55, 1);
    ctx.restore();

    // Stalk Eyes with Tracking
    ctx.strokeStyle = "#c62828";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.lineTo(-24, -34);
    ctx.moveTo(18, -12);
    ctx.lineTo(24, -34);
    ctx.stroke();

    this.renderAnimalEyes(ctx, -24, -36, 24, -36, 8.5);
  }

  private renderYoungWhale(ctx: CanvasRenderingContext2D) {
    const tailWave = Math.sin(this.time * 3) * 20;

    // Body with 3D Depth Shading
    const whaleGrad = ctx.createLinearGradient(0, -70, 0, 70);
    whaleGrad.addColorStop(0, "#546e7a");
    whaleGrad.addColorStop(0.5, "#37474f");
    whaleGrad.addColorStop(1, "#102027");
    ctx.fillStyle = whaleGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 155, 74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Ventral Grooves (Pleated White Belly)
    ctx.fillStyle = "#eceff1";
    ctx.beginPath();
    ctx.ellipse(25, 26, 110, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#b0bec5";
    ctx.lineWidth = 2.5;
    for (let l = -3; l <= 3; l++) {
      ctx.beginPath();
      ctx.moveTo(-40 + l * 25, 12);
      ctx.lineTo(-20 + l * 25, 48);
      ctx.stroke();
    }

    // 3D Fluke Tail
    ctx.fillStyle = "#37474f";
    ctx.beginPath();
    ctx.moveTo(-145, 0);
    ctx.lineTo(-215, -48 + tailWave);
    ctx.quadraticCurveTo(-185, tailWave, -215, 48 + tailWave);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pectoral Fin
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.ellipse(15, 52, 74, 22, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Reflective Deep Sea Eye
    this.renderAnimalEyes(ctx, 100, -15, 100, -15, 8.5, true);

    if (this.isCompleted) {
      ctx.fillStyle = "rgba(179, 229, 252, 0.95)";
      ctx.beginPath();
      ctx.moveTo(60, -70);
      ctx.quadraticCurveTo(40, -150, 10, -175);
      ctx.quadraticCurveTo(80, -150, 60, -70);
      ctx.fill();
    }
  }

  private renderSeaOtter(ctx: CanvasRenderingContext2D) {
    const otterGrad = ctx.createLinearGradient(0, -48, 0, 48);
    otterGrad.addColorStop(0, "#8d6e63");
    otterGrad.addColorStop(0.6, "#5d4037");
    otterGrad.addColorStop(1, "#3e2723");
    ctx.fillStyle = otterGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a1887f";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Fluffy Cream Belly
    ctx.fillStyle = "#d7ccc8";
    ctx.beginPath();
    ctx.ellipse(15, -4, 70, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Otter Head
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.arc(100, -10, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.arc(88, -44, 11, 0, Math.PI * 2);
    ctx.arc(114, -44, 11, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    for (let w = -1; w <= 1; w++) {
      ctx.beginPath();
      ctx.moveTo(116, -8 + w * 6);
      ctx.lineTo(140, -12 + w * 10);
      ctx.stroke();
    }

    // Nose
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(118, -10, 8, 0, Math.PI * 2);
    ctx.fill();

    this.renderAnimalEyes(ctx, 102, -24, 102, -24, 6.5, true);

    // Cute Paws Clasping
    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.arc(10, 8, 17, 0, Math.PI * 2);
    ctx.arc(38, 8, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private renderGiantSquid(ctx: CanvasRenderingContext2D) {
    const squidGrad = ctx.createLinearGradient(-160, 0, 70, 0);
    squidGrad.addColorStop(0, "#880e4f");
    squidGrad.addColorStop(0.6, "#c2185b");
    squidGrad.addColorStop(1, "#e91e63");
    ctx.fillStyle = squidGrad;
    ctx.beginPath();
    ctx.ellipse(-48, 0, 120, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff4081";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Fins
    ctx.beginPath();
    ctx.moveTo(-160, 0);
    ctx.lineTo(-120, -58);
    ctx.lineTo(-80, 0);
    ctx.lineTo(-120, 58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sinuous Tentacles with 2.5D Depth Sorter
    ctx.strokeStyle = "#ad1457";
    ctx.lineWidth = 11;
    for (let t = -3; t <= 3; t++) {
      const wave = Math.sin(this.time * 3 + t * 0.9) * 26;
      ctx.beginPath();
      ctx.moveTo(70, t * 12);
      ctx.quadraticCurveTo(145 + wave, t * 28, 235, t * 38 + wave * 1.5);
      ctx.stroke();

      // Suction Cup Lights
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(145 + wave, t * 28, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gigantic Glowing Deep-Sea Eye
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(52, -15, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(52 + Math.cos(this.eyeAngle) * 6, -15 + Math.sin(this.eyeAngle) * 6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(52 + Math.cos(this.eyeAngle) * 7, -15 + Math.sin(this.eyeAngle) * 7, 6.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderAnimalEyes(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, radius: number, isSingleSide = false) {
    if (this.isBlinking) {
      ctx.strokeStyle = "#212121";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1 - radius, y1);
      ctx.lineTo(x1 + radius, y1);
      if (!isSingleSide) {
        ctx.moveTo(x2 - radius, y2);
        ctx.lineTo(x2 + radius, y2);
      }
      ctx.stroke();
      return;
    }

    const drawEye = (x: number, y: number) => {
      // Sclera
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#212121";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pupil with tracking
      const pupilOffset = radius * 0.35;
      const px = x + Math.cos(this.eyeAngle) * pupilOffset;
      const py = y + Math.sin(this.eyeAngle) * pupilOffset;

      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(px - radius * 0.2, py - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    };

    drawEye(x1, y1);
    if (!isSingleSide) {
      drawEye(x2, y2);
    }
  }

  // --- Obstacle Renderers (Ropes, Rocks, Debris, Oil, Cables) ---
  private renderTurtleRopes(ctx: CanvasRenderingContext2D) {
    for (const rope of this.turtleRopes) {
      if (rope.cut) continue;

      const isCurrent = rope.order === this.currentStep;
      ctx.save();

      // Drop Shadow on Animal Body
      ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(rope.x1 + 4, rope.y1 + 6);
      ctx.lineTo(rope.x2 + 4, rope.y2 + 6);
      ctx.stroke();

      if (isCurrent) {
        ctx.shadowColor = "#ffeb3b";
        ctx.shadowBlur = 24;
        ctx.strokeStyle = "#fff59d";
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.moveTo(rope.x1, rope.y1);
        ctx.lineTo(rope.x2, rope.y2);
        ctx.stroke();
      }

      // Braided Nautical Rope Texture
      ctx.strokeStyle = rope.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(rope.x1, rope.y1);
      ctx.lineTo(rope.x2, rope.y2);
      ctx.stroke();

      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      const midX = (rope.x1 + rope.x2) / 2;
      const midY = (rope.y1 + rope.y2) / 2;

      this.renderSequenceBadge(ctx, midX, midY, rope.order + 1, isCurrent);

      if (isCurrent) {
        this.renderTargetPrompt(ctx, midX, midY - 35, "✂️ 레이저로 절단!");
        if (this.hintActive) {
          this.renderAnimatedHandHint(ctx, midX, midY);
        }
      }

      ctx.restore();
    }

    for (const rf of this.ropeFragments) {
      ctx.save();
      ctx.translate(rf.x, rf.y);
      ctx.rotate(rf.angle);
      ctx.strokeStyle = rf.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-rf.length / 2, 0);
      ctx.lineTo(rf.length / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderCrabRocks(ctx: CanvasRenderingContext2D) {
    for (const rock of this.crabRocks) {
      if (rock.cleared) continue;

      const isCurrent = rock.order === this.currentStep;
      ctx.save();

      // Rock Contact Shadow
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(rock.x + 8, rock.y + 12, rock.radius, rock.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = isCurrent ? "#ffd54f" : "rgba(0,0,0,0.7)";
      ctx.shadowBlur = isCurrent ? 28 : 14;

      // 3D Shaded Volumetric Boulder
      const rockGrad = ctx.createRadialGradient(rock.x - 15, rock.y - 15, 10, rock.x, rock.y, rock.radius);
      rockGrad.addColorStop(0, "#d7ccc8");
      rockGrad.addColorStop(0.65, rock.color);
      rockGrad.addColorStop(1, "#271c19");
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isCurrent ? "#ffd54f" : "#4e342e";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Surface Cracks
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rock.x - rock.radius * 0.4, rock.y - rock.radius * 0.2);
      ctx.lineTo(rock.x + rock.radius * 0.2, rock.y + rock.radius * 0.3);
      ctx.stroke();

      this.renderSequenceBadge(ctx, rock.x, rock.y, rock.order + 1, isCurrent);

      if (isCurrent) {
        this.renderTargetPrompt(ctx, rock.x, rock.y - rock.radius - 18, "🖐️ 바깥으로 드래그!");
        if (this.hintActive) {
          this.renderAnimatedDragHint(ctx, rock.x, rock.y, rock.x + 120, rock.y + 80);
        }
      }

      ctx.restore();
    }
  }

  private renderWhaleDebris(ctx: CanvasRenderingContext2D) {
    for (const deb of this.whaleDebrisList) {
      if (deb.cleared) continue;

      const isCurrent = deb.order === this.currentStep;
      ctx.save();
      ctx.translate(deb.x, deb.y);

      // Debris Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(-deb.width / 2 + 8, -deb.height / 2 + 8, deb.width, deb.height, 14);
      ctx.fill();

      ctx.shadowColor = isCurrent ? "#00e5ff" : "rgba(0,0,0,0.6)";
      ctx.shadowBlur = isCurrent ? 28 : 12;

      // 3D Metallic Shading
      const debGrad = ctx.createLinearGradient(0, -deb.height / 2, 0, deb.height / 2);
      debGrad.addColorStop(0, "#78909c");
      debGrad.addColorStop(0.5, deb.color);
      debGrad.addColorStop(1, "#1c2833");
      ctx.fillStyle = debGrad;

      ctx.beginPath();
      ctx.roundRect(-deb.width / 2, -deb.height / 2, deb.width, deb.height, 14);
      ctx.fill();
      ctx.strokeStyle = isCurrent ? "#00e5ff" : "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(deb.name, 0, 0);

      this.renderSequenceBadge(ctx, 0, -deb.height / 2 - 12, deb.order + 1, isCurrent);

      if (isCurrent) {
        this.renderTargetPrompt(ctx, 0, -deb.height / 2 - 32, deb.hooked ? "🚀 탭하여 견인 분리!" : "🧲 마그넷 와이어 연결!");
        if (this.hintActive) {
          this.renderAnimatedHandHint(ctx, deb.x, deb.y);
        }
      }

      ctx.restore();
    }
  }

  private renderOtterOilSpots(ctx: CanvasRenderingContext2D) {
    for (const oil of this.otterOilSpots) {
      if (oil.cleared) continue;

      const isCurrent = oil.order === this.currentStep;
      ctx.save();
      ctx.translate(oil.x, oil.y);

      // Iridescent Rainbow Oil Slick
      const currentRadius = oil.radius * (1 - oil.cleanedPercent / 120);
      const oilGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, currentRadius);
      oilGrad.addColorStop(0, "#212121");
      oilGrad.addColorStop(0.6, "#37474f");
      oilGrad.addColorStop(0.85, "#00e5ff");
      oilGrad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = oilGrad;
      ctx.shadowColor = isCurrent ? "#ffd54f" : "#000000";
      ctx.shadowBlur = isCurrent ? 24 : 10;

      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isCurrent ? "#ffd54f" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      this.renderSequenceBadge(ctx, 0, 0, oil.order + 1, isCurrent);

      if (isCurrent) {
        this.renderTargetPrompt(ctx, 0, -oil.radius - 18, `🧼 문질러 세척! (${oil.cleanedPercent}%)`);
        if (this.hintActive) {
          this.renderAnimatedHandHint(ctx, oil.x, oil.y);
        }
      }

      ctx.restore();
    }
  }

  private renderSquidCables(ctx: CanvasRenderingContext2D) {
    for (const cable of this.squidCables) {
      if (cable.cut) continue;

      const isCurrent = cable.order === this.currentStep;
      ctx.save();

      // High-voltage Neon Glow
      if (isCurrent) {
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 28;
        ctx.strokeStyle = "#80d8ff";
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.moveTo(cable.x1, cable.y1);
        ctx.lineTo(cable.x2, cable.y2);
        ctx.stroke();
      }

      ctx.strokeStyle = cable.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cable.x1, cable.y1);
      ctx.lineTo(cable.x2, cable.y2);
      ctx.stroke();

      const midX = (cable.x1 + cable.x2) / 2;
      const midY = (cable.y1 + cable.y2) / 2;

      this.renderSequenceBadge(ctx, midX, midY, cable.order + 1, isCurrent);

      if (isCurrent) {
        this.renderTargetPrompt(ctx, midX, midY - 32, "⚡ 초음파 레이저 절단!");
        if (this.hintActive) {
          this.renderAnimatedHandHint(ctx, midX, midY);
        }
      }

      ctx.restore();
    }
  }

  private renderSequenceBadge(ctx: CanvasRenderingContext2D, x: number, y: number, num: number, isCurrent: boolean) {
    ctx.save();
    ctx.fillStyle = isCurrent ? "#ffd54f" : "rgba(10, 30, 50, 0.85)";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isCurrent ? "#ffffff" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = isCurrent ? "#051829" : "#ffffff";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(num), x, y);

    if (isCurrent) {
      const pulse = 1 + Math.sin(this.time * 6) * 0.18;
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 22 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderTargetPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
    ctx.save();
    ctx.fillStyle = "rgba(5, 20, 38, 0.94)";
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 90, y - 14, 180, 28, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  private renderAnimatedHandHint(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    const bounce = Math.sin(this.time * 6) * 12;
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👆", x, y - 45 + bounce);
    ctx.restore();
  }

  private renderAnimatedDragHint(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) {
    ctx.save();
    const progress = (this.time * 1.5) % 1;
    const curX = startX + (endX - startX) * progress;
    const curY = startY + (endY - startY) * progress;

    ctx.strokeStyle = "rgba(255, 213, 79, 0.6)";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🖐️", curX, curY);
    ctx.restore();
  }

  // --- Bio-Care Dock HUD ---
  private renderBioCareHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const target = this.careTargets[this.activeCareIndex];
    if (!target) return;

    ctx.save();

    // 2.5D Holographic Bio-Care Dock Base
    const dockW = 480;
    const dockH = 96;
    const dockX = (w - dockW) / 2;
    const dockY = h - 114;

    ctx.fillStyle = "rgba(6, 24, 44, 0.96)";
    ctx.strokeStyle = "rgba(105, 240, 174, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(dockX, dockY, dockW, dockH, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#69f0ae";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🩺 바이오 치료 (${this.activeCareIndex + 1}/3): ${target.label}`, dockX + dockW / 2, dockY + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText("도구를 터치하여 동물에게 드래그하거나 직접 탭하세요!", dockX + dockW / 2, dockY + 54);

    const tx = this.careToolPos.x;
    const ty = this.careToolPos.y;

    if (this.careToolDragging) {
      ctx.strokeStyle = "rgba(105, 240, 174, 0.6)";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(this.animalX, this.animalY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(0, 230, 118, 0.95)";
    ctx.shadowColor = "#00e676";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(tx, ty, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(target.icon, tx, ty);

    ctx.restore();
  }

  private renderLaserTrail(ctx: CanvasRenderingContext2D) {
    if (this.laserTrail.length < 2) return;

    ctx.save();
    for (let i = 1; i < this.laserTrail.length; i++) {
      const p1 = this.laserTrail[i - 1];
      const p2 = this.laserTrail[i];
      ctx.strokeStyle = `rgba(255, 235, 59, ${p2.alpha})`;
      ctx.lineWidth = 7 * p2.alpha;
      ctx.shadowColor = "#ffeb3b";
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Dynamic Integrated Top HUD ---
  private renderIntegratedHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();

    // 1. Top-Left: Companion Comms Hologram Box
    const commsW = 340;
    const commsH = 82;
    const commsX = 24;
    const commsY = 20;

    ctx.fillStyle = "rgba(6, 22, 40, 0.94)";
    ctx.strokeStyle = "rgba(77, 208, 225, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(commsX, commsY, commsW, commsH, 16);
    ctx.fill();
    ctx.stroke();

    // Avatar Ring
    ctx.fillStyle = "rgba(0, 229, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(commsX + 38, commsY + 41, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.mission.companionAvatar, commsX + 38, commsY + 41);

    // Audio Equalizer Waveform
    ctx.fillStyle = "#69f0ae";
    for (let bar = 0; bar < 5; bar++) {
      const barH = 4 + Math.sin(this.time * 8 + bar) * 6;
      ctx.fillRect(commsX + 74 + bar * 6, commsY + 22 - barH / 2, 3, barH);
    }

    ctx.fillStyle = "#ffd54f";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${this.mission.companion}:`, commsX + 110, commsY + 24);

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px system-ui, sans-serif";
    const speech = this.companionSpeech || this.mission.tutorial;
    ctx.fillText(speech.length > 22 ? speech.slice(0, 22) + "..." : speech, commsX + 74, commsY + 46);
    if (speech.length > 22) {
      ctx.fillText(speech.slice(22, 44), commsX + 74, commsY + 64);
    }

    // 2. Top-Center: Biometric Vitals Monitor
    const vitalsW = 280;
    const vitalsH = 82;
    const vitalsX = (w - vitalsW) / 2;
    const vitalsY = 20;

    ctx.fillStyle = "rgba(6, 22, 40, 0.94)";
    ctx.strokeStyle = "rgba(105, 240, 174, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(vitalsX, vitalsY, vitalsW, vitalsH, 16);
    ctx.fill();
    ctx.stroke();

    // Real-time ECG Graph Line
    ctx.strokeStyle = this.vitals.healthPercent > 70 ? "#69f0ae" : "#ff5252";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    const ecgStartX = vitalsX + 16;
    const ecgStartY = vitalsY + 48;
    const ecgW = 85;

    for (let i = 0; i <= ecgW; i += 3) {
      const angle = (i / ecgW) * Math.PI * 4 - this.ecgPhase;
      let offset = Math.sin(angle) * 5;
      if (Math.abs(Math.sin(angle)) > 0.82) {
        offset *= 2.6;
      }
      ctx.lineTo(ecgStartX + i, ecgStartY + offset);
    }
    ctx.stroke();

    // Vitals Readouts
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`❤️ ${this.vitals.heartRate} BPM`, vitalsX + 115, vitalsY + 28);
    ctx.fillText(`⚡ 스트레스: ${this.vitals.stressLevel}%`, vitalsX + 115, vitalsY + 48);

    // Health Recovery Bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(vitalsX + 115, vitalsY + 58, 145, 10, 5);
    ctx.fill();

    const hpGrad = ctx.createLinearGradient(vitalsX + 115, 0, vitalsX + 260, 0);
    hpGrad.addColorStop(0, "#ff5252");
    hpGrad.addColorStop(0.6, "#ffd54f");
    hpGrad.addColorStop(1, "#69f0ae");
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(vitalsX + 115, vitalsY + 58, Math.max(12, 145 * (this.vitals.healthPercent / 100)), 10, 5);
    ctx.fill();

    // 3. Top-Right: Step Progress Chips
    const stepW = 260;
    const stepH = 82;
    const stepX = w - stepW - 24;
    const stepY = 20;

    ctx.fillStyle = "rgba(6, 22, 40, 0.94)";
    ctx.strokeStyle = "rgba(77, 208, 225, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(stepX, stepY, stepW, stepH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd54f";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.isCarePhase ? "💖 바이오 메디컬 케어" : `🎯 ${this.mission.toolLabel}`, stepX + stepW / 2, stepY + 28);

    for (let s = 0; s < 3; s++) {
      const chipX = stepX + 50 + s * 80;
      const chipY = stepY + 54;
      const isDone = this.isCarePhase ? (this.activeCareIndex > s) : (this.currentStep > s);
      const isCurrent = this.isCarePhase ? (this.activeCareIndex === s) : (this.currentStep === s);

      ctx.fillStyle = isDone ? "#69f0ae" : isCurrent ? "#ffd54f" : "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(chipX, chipY, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDone || isCurrent ? "#051829" : "#90a4ae";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillText(isDone ? "✓" : `${s + 1}`, chipX, chipY + 4);
    }

    ctx.restore();
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }
}
