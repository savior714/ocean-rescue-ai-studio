import {
  MissionData,
  GupData,
  RescueVitals,
  SeaTurtleRope,
  RopePhysicsFragment,
  CrabRock,
  WhaleDebris,
  OtterTangle,
  SquidCrystal
} from "./types";
import { Audio } from "./audio";
import { RescueReadiness } from "./travel/readiness";
import { renderGupSubmarine } from "./render-gup";
import {
  renderSeaTurtle,
  renderCrab,
  renderHumpbackWhale,
  renderBraidedRope,
  renderReefBoulder,
  renderHoloBioScan,
  renderMarineTreat
} from "./render-creatures";

export class RescueEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mission: MissionData;
  private gup: GupData;
  private onStepSuccess: (step: number) => void;
  private onAllRescued: () => void;

  // Staging & Animal Position
  public animalX = 700;
  public animalY = 360;
  public animalScale = 1.0;
  public animalAngle = 0;
  public animalSwimOffset = 0;

  // Rescue Phases:
  // Phase 1: Danger Removal (Laser cutter, power claw, magnetic tow, untangle, sonar pulse)
  // Phase 2: Bio-Care Medical Clinic (1. Vitals scanner, 2. Treatment spray, 3. Treat feeding)
  // Phase 3: Freedom & Celebration
  public currentPhase: "danger_removal" | "bio_care" | "celebration" = "danger_removal";
  public careSubStep: "scan" | "spray" | "feed" = "scan";

  public currentStep = 0;
  public totalSteps = 3;
  public isDangerCleared = false;
  public isCompleted = false;

  // Dynamic Vitals Monitor
  public vitals: RescueVitals = {
    heartRate: 115,
    oxygenLevel: 75,
    stressLevel: 88,
    healthPercent: 35,
    scanned: false,
    medicineSprayed: 0,
    treatFedCount: 0
  };

  // Interactive Tools & Pointer
  private isPointerDown = false;
  private pointerPos = { x: 0, y: 0 };
  private laserTrail: Array<{ x: number; y: number; alpha: number }> = [];

  // Mission-specific obstacle data
  private turtleRopes: SeaTurtleRope[] = [];
  private ropeFragments: RopePhysicsFragment[] = [];
  private crabRocks: CrabRock[] = [];
  private draggingRockIndex: number | null = null;
  private rockDragOffset = { x: 0, y: 0 };
  private whaleDebrisList: WhaleDebris[] = [];
  private otterTangles: OtterTangle[] = [];
  private squidCrystals: SquidCrystal[] = [];

  // Feedback FX
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }> = [];
  private celebrationHeartBubbles: Array<{ x: number; y: number; size: number; vy: number; alpha: number }> = [];
  public bannerMessage = "";
  private bannerTimer = 0;

  private animId: number | null = null;
  private lastTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mission: MissionData,
    gup: GupData,
    onStepSuccess: (step: number) => void,
    onAllRescued: () => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    this.mission = mission;
    this.gup = gup;
    this.onStepSuccess = onStepSuccess;
    this.onAllRescued = onAllRescued;

    this.initMissionEntities();
    this.bindControls();
  }

  private initMissionEntities() {
    this.currentPhase = "danger_removal";
    this.careSubStep = "scan";
    this.currentStep = 0;
    this.isDangerCleared = false;
    this.isCompleted = false;

    this.vitals = {
      heartRate: 115,
      oxygenLevel: 75,
      stressLevel: 88,
      healthPercent: 35,
      scanned: false,
      medicineSprayed: 0,
      treatFedCount: 0
    };

    const readiness = RescueReadiness.getSnapshot();
    if (readiness.cutter) {
      this.showBanner("⚡ 구조 장비 최대 출력 가동!");
    } else {
      this.showBanner(`🎯 ${this.mission.title}`);
    }

    if (this.mission.id === "sea-turtle") {
      this.totalSteps = 3;
      this.turtleRopes = [
        { id: "r1", order: 1, label: "앞지느러미 폐그물", x1: 620, y1: 300, x2: 780, y2: 340, cut: false, angle: 0.2, color: "#8d6e63" },
        { id: "r2", order: 2, label: "등껍질 굵은 밧줄", x1: 640, y1: 370, x2: 770, y2: 370, cut: false, angle: 0.0, color: "#5d4037" },
        { id: "r3", order: 3, label: "뒷지느러미 엉킨 로프", x1: 630, y1: 420, x2: 790, y2: 390, cut: false, angle: -0.2, color: "#795548" }
      ];
    } else if (this.mission.id === "crab") {
      this.totalSteps = 3;
      this.crabRocks = [
        { id: "cr1", order: 1, x: 670, y: 310, radius: 46, cleared: false, color: "#546e7a", isBeingDragged: false },
        { id: "cr2", order: 2, x: 740, y: 360, radius: 52, cleared: false, color: "#455a64", isBeingDragged: false },
        { id: "cr3", order: 3, x: 680, y: 430, radius: 48, cleared: false, color: "#37474f", isBeingDragged: false }
      ];
    } else if (this.mission.id === "young-whale") {
      this.totalSteps = 2;
      this.whaleDebrisList = [
        { id: "wd1", order: 1, name: "대형 해양 부표", x: 650, y: 320, width: 84, height: 64, hooked: false, cleared: false, color: "#e65100" },
        { id: "wd2", order: 2, name: "산업 폐기물 드럼통", x: 730, y: 400, width: 78, height: 72, hooked: false, cleared: false, color: "#263238" }
      ];
    } else if (this.mission.id === "sea-otter") {
      this.totalSteps = 2;
      this.otterTangles = [
        { id: "ot1", order: 1, x: 660, y: 330, radius: 36, cleared: false, label: "비닐 포장 끈" },
        { id: "ot2", order: 2, x: 740, y: 390, radius: 38, cleared: false, label: "폐비닐 매듭" }
      ];
    } else if (this.mission.id === "giant-squid") {
      this.totalSteps = 2;
      this.squidCrystals = [
        { id: "sq1", order: 1, x: 650, y: 320, cleared: false, label: "심해 광물 케이블" },
        { id: "sq2", order: 2, x: 740, y: 400, cleared: false, label: "얽힌 광통신선" }
      ];
    }
  }

  private bindControls() {
    const getPos = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener("pointerdown", (e) => {
      this.isPointerDown = true;
      this.pointerPos = getPos(e);
      this.handlePointerAction(this.pointerPos.x, this.pointerPos.y);
    });

    window.addEventListener("pointermove", (e) => {
      if (this.isPointerDown) {
        this.pointerPos = getPos(e);
        this.handlePointerMove(this.pointerPos.x, this.pointerPos.y);
      }
    });

    window.addEventListener("pointerup", () => {
      this.isPointerDown = false;
      this.handlePointerUp();
    });
  }

  private handlePointerAction(x: number, y: number) {
    if (this.isCompleted) return;

    if (this.currentPhase === "danger_removal") {
      // 1. Sea Turtle Laser Cut
      if (this.mission.id === "sea-turtle") {
        this.turtleRopes.forEach((rope) => {
          if (rope.cut) return;
          const dist = this.pointToSegmentDist(x, y, rope.x1, rope.y1, rope.x2, rope.y2);
          if (dist < 40) {
            this.cutTurtleRope(rope);
          }
        });
      }

      // 2. Crab Rock Drag
      else if (this.mission.id === "crab") {
        for (let i = 0; i < this.crabRocks.length; i++) {
          const r = this.crabRocks[i];
          if (r.cleared) return;
          const dist = Math.hypot(x - r.x, y - r.y);
          if (dist < r.radius + 15) {
            this.draggingRockIndex = i;
            r.isBeingDragged = true;
            this.rockDragOffset = { x: r.x - x, y: r.y - y };
            Audio.playBubble();
            break;
          }
        }
      }

      // 3. Whale Debris Tow
      else if (this.mission.id === "young-whale") {
        this.whaleDebrisList.forEach((debris) => {
          if (debris.cleared) return;
          if (
            x >= debris.x - debris.width / 2 &&
            x <= debris.x + debris.width / 2 &&
            y >= debris.y - debris.height / 2 &&
            y <= debris.y + debris.height / 2
          ) {
            this.towWhaleDebris(debris);
          }
        });
      }

      // 4. Sea Otter Untangle
      else if (this.mission.id === "sea-otter") {
        this.otterTangles.forEach((t) => {
          if (t.cleared) return;
          const dist = Math.hypot(x - t.x, y - t.y);
          if (dist < t.radius + 20) {
            t.cleared = true;
            this.currentStep++;
            Audio.playBubble();
            this.spawnSparks(t.x, t.y, "#80deea", 14);
            this.showBanner(`${t.label} 해제 완료!`);
            this.checkDangerCleared();
          }
        });
      }

      // 5. Giant Squid Sonar
      else if (this.mission.id === "giant-squid") {
        this.squidCrystals.forEach((c) => {
          if (c.cleared) return;
          const dist = Math.hypot(x - c.x, y - c.y);
          if (dist < 45) {
            c.cleared = true;
            this.currentStep++;
            Audio.playLaserCut();
            this.spawnSparks(c.x, c.y, "#ffd54f", 16);
            this.showBanner(`${c.label} 소나 분해 완료!`);
            this.checkDangerCleared();
          }
        });
      }
    } else if (this.currentPhase === "bio_care") {
      this.handleBioCareAction(x, y);
    }
  }

  private handlePointerMove(x: number, y: number) {
    if (this.currentPhase === "danger_removal") {
      if (this.mission.id === "sea-turtle") {
        this.laserTrail.push({ x, y, alpha: 1.0 });
        this.turtleRopes.forEach((rope) => {
          if (rope.cut) return;
          const dist = this.pointToSegmentDist(x, y, rope.x1, rope.y1, rope.x2, rope.y2);
          if (dist < 35) {
            this.cutTurtleRope(rope);
          }
        });
      } else if (this.mission.id === "crab" && this.draggingRockIndex !== null) {
        const rock = this.crabRocks[this.draggingRockIndex];
        rock.x = x + this.rockDragOffset.x;
        rock.y = y + this.rockDragOffset.y;

        // Check if dragged far away from crab nest
        const distFromNest = Math.hypot(rock.x - this.animalX, rock.y - this.animalY);
        if (distFromNest > 200) {
          rock.cleared = true;
          rock.isBeingDragged = false;
          this.draggingRockIndex = null;
          this.currentStep++;
          Audio.playBump();
          this.spawnSparks(rock.x, rock.y, "#80deea", 16);
          this.showBanner("바위를 안전한 곳으로 치웠습니다!");
          this.checkDangerCleared();
        }
      }
    } else if (this.currentPhase === "bio_care") {
      this.handleBioCareAction(x, y);
    }
  }

  private handlePointerUp() {
    if (this.draggingRockIndex !== null) {
      const rock = this.crabRocks[this.draggingRockIndex];
      rock.isBeingDragged = false;
      this.draggingRockIndex = null;
    }
  }

  private handleBioCareAction(x: number, y: number) {
    const distToAnimal = Math.hypot(x - this.animalX, y - this.animalY);
    if (distToAnimal > 200) return;

    if (this.careSubStep === "scan") {
      this.vitals.scanned = true;
      Audio.playScannerBleep();
      this.spawnSparks(x, y, "#00e5ff", 12);
      this.careSubStep = "spray";
      this.showBanner("🔍 바이탈 스캔 완료! 치유 스프레이를 골고루 분사하세요!");
    } else if (this.careSubStep === "spray") {
      this.vitals.medicineSprayed = Math.min(100, this.vitals.medicineSprayed + 20);
      this.vitals.stressLevel = Math.max(10, this.vitals.stressLevel - 15);
      this.vitals.healthPercent = Math.min(85, this.vitals.healthPercent + 15);
      Audio.playSpray();
      this.spawnSparks(x, y, "#4caf50", 14);

      if (this.vitals.medicineSprayed >= 100) {
        this.careSubStep = "feed";
        this.showBanner(`🧴 연고 치료 완료! ${this.mission.careTreatName}을(를) 먹여주세요!`);
      }
    } else if (this.careSubStep === "feed") {
      this.vitals.treatFedCount++;
      this.vitals.healthPercent = Math.min(100, this.vitals.healthPercent + 25);
      this.vitals.heartRate = 72;
      this.vitals.stressLevel = 0;
      Audio.playMunch();
      this.spawnSparks(x, y, "#ffd54f", 18);

      if (this.vitals.treatFedCount >= 2) {
        this.completeRescue();
      }
    }
  }

  private cutTurtleRope(rope: SeaTurtleRope) {
    rope.cut = true;
    this.currentStep++;
    Audio.playLaserCut();
    this.spawnSparks((rope.x1 + rope.x2) / 2, (rope.y1 + rope.y2) / 2, "#ffd54f", 20);

    // Spawn physics rope fragments floating away
    this.ropeFragments.push({
      x: rope.x1,
      y: rope.y1,
      vx: (Math.random() - 0.5) * 40,
      vy: -30 - Math.random() * 30,
      angle: rope.angle,
      vAngle: (Math.random() - 0.5) * 2,
      length: 40,
      color: rope.color,
      life: 2.0
    });

    this.showBanner(`${rope.label} 절단 완료!`);
    this.checkDangerCleared();
  }

  private towWhaleDebris(debris: WhaleDebris) {
    debris.cleared = true;
    this.currentStep++;
    Audio.playBoost();
    this.spawnSparks(debris.x, debris.y, "#ff9800", 22);
    this.showBanner(`${debris.name} 마그넷 견인 분리 성공!`);
    this.checkDangerCleared();
  }

  private checkDangerCleared() {
    if (this.currentStep >= this.totalSteps) {
      this.isDangerCleared = true;
      Audio.playSuccess();
      setTimeout(() => {
        this.currentPhase = "bio_care";
        this.careSubStep = "scan";
        this.showBanner("🩺 1단계 위험 요소 제거 완료! 원격 바이탈 스캔을 시작하세요!");
      }, 600);
    }
  }

  private completeRescue() {
    this.currentPhase = "celebration";
    this.isCompleted = true;
    Audio.playCelebration();
    this.showBanner(`🎉 ${this.mission.animalName} 완벽 회복 & 구조 성공!`);

    // Spawn Heart Bubbles
    for (let i = 0; i < 30; i++) {
      this.celebrationHeartBubbles.push({
        x: this.animalX + (Math.random() - 0.5) * 160,
        y: this.animalY + (Math.random() - 0.5) * 120,
        size: 16 + Math.random() * 18,
        vy: -40 - Math.random() * 60,
        alpha: 1.0
      });
    }

    setTimeout(() => {
      this.onAllRescued();
    }, 2400);
  }

  public showBanner(msg: string) {
    this.bannerMessage = msg;
    this.bannerTimer = 3.2;
  }

  private spawnSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 120;
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

  public start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.update(dt);
      this.render();

      this.animId = requestAnimationFrame(loop);
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
    if (this.bannerTimer > 0) this.bannerTimer -= dt;

    // Animal idle animation
    this.animalSwimOffset += dt * 2.5;
    if (this.currentPhase === "celebration") {
      this.animalAngle = Math.sin(this.animalSwimOffset * 1.5) * 0.2;
      this.animalX = 700 + Math.cos(this.animalSwimOffset) * 40;
      this.animalY = 360 + Math.sin(this.animalSwimOffset * 2) * 25;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Laser Trail
    for (let i = this.laserTrail.length - 1; i >= 0; i--) {
      this.laserTrail[i].alpha -= dt * 2.5;
      if (this.laserTrail[i].alpha <= 0) this.laserTrail.splice(i, 1);
    }

    // Update Heart Bubbles
    for (let i = this.celebrationHeartBubbles.length - 1; i >= 0; i--) {
      const h = this.celebrationHeartBubbles[i];
      h.y += h.vy * dt;
      h.alpha -= dt * 0.4;
      if (h.alpha <= 0) this.celebrationHeartBubbles.splice(i, 1);
    }
  }

  private render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.save();

    // 1. Water Background
    const bgGrad = this.ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
    bgGrad.addColorStop(0, "#003b6f");
    bgGrad.addColorStop(1, "#001a35");
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    // 2. Underwater Stage Decor (Corals / Kelp / Rocks)
    this.renderEnvironmentDecor(width, height);

    // 3. Animal Subject
    this.renderAnimalSubject();

    // 4. Mission Hazards / Obstacles
    this.renderObstacles();

    // 5. Bio-Care Clinic UI / Effects
    if (this.currentPhase === "bio_care") {
      this.renderBioCareStage();
    }

    // 6. Celebration Heart Bubbles & Sparks
    this.celebrationHeartBubbles.forEach((h) => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, h.alpha);
      this.ctx.font = `${h.size}px sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.fillText("💖", h.x, h.y);
      this.ctx.restore();
    });

    this.particles.forEach((p) => {
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 7. Submarine Docked on the Left
    this.renderDockedGup();

    // 8. HUD & Vitals Telemetry Box
    this.renderRescueHUD(width, height);

    this.ctx.restore();
  }

  private renderEnvironmentDecor(width: number, height: number) {
    this.ctx.save();
    // Seabed
    this.ctx.fillStyle = "#011627";
    this.ctx.beginPath();
    this.ctx.ellipse(width / 2, height + 40, width * 0.7, 120, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Ambient bubbles
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 16; i++) {
      const bx = (i * 85 + (performance.now() * 0.02) * (i % 3 + 1)) % width;
      const by = (height - (performance.now() * 0.05 * (i % 2 + 1) + i * 40)) % height;
      this.ctx.beginPath();
      this.ctx.arc(bx, by, 3 + (i % 4), 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private renderAnimalSubject() {
    const creatureState = {
      healthPercent: this.vitals.healthPercent,
      isHealed: this.vitals.healthPercent >= 80,
      isCelebration: this.currentPhase === "celebration",
      time: performance.now(),
      swimOffset: this.animalSwimOffset,
      pointerX: this.pointerPos.x,
      pointerY: this.pointerPos.y
    };

    if (this.mission.id === "sea-turtle") {
      renderSeaTurtle(this.ctx, this.animalX, this.animalY, this.animalAngle, creatureState);
    } else if (this.mission.id === "crab") {
      renderCrab(this.ctx, this.animalX, this.animalY, this.animalAngle, creatureState);
    } else if (this.mission.id === "young-whale") {
      renderHumpbackWhale(this.ctx, this.animalX, this.animalY, this.animalAngle, creatureState);
    } else {
      // Fallback with enhanced procedural aura
      this.ctx.save();
      this.ctx.translate(this.animalX, this.animalY);
      this.ctx.rotate(this.animalAngle);
      this.ctx.shadowColor = this.currentPhase === "celebration" ? "#ffd54f" : "rgba(0,0,0,0.5)";
      this.ctx.shadowBlur = 24;
      this.ctx.font = "110px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(this.mission.animalIcon, 0, 0);
      if (this.vitals.healthPercent > 80) {
        this.ctx.font = "28px sans-serif";
        this.ctx.fillText("✨", 45, -45);
      }
      this.ctx.restore();
    }
  }

  private renderObstacles() {
    const time = performance.now();

    // 1. Turtle Ropes (Braided Nylon with Frayed Ends)
    if (this.mission.id === "sea-turtle") {
      this.turtleRopes.forEach((r) => {
        if (r.cut) return;
        const isHovered = this.pointToSegmentDist(this.pointerPos.x, this.pointerPos.y, r.x1, r.y1, r.x2, r.y2) < 35;
        renderBraidedRope(this.ctx, r.x1, r.y1, r.x2, r.y2, r.color, 0, isHovered, time);
      });
    }

    // 2. Crab Rocks (Mossy Limestone Boulders)
    else if (this.mission.id === "crab") {
      this.crabRocks.forEach((rock) => {
        if (rock.cleared) return;
        renderReefBoulder(this.ctx, rock.x, rock.y, rock.radius, !!rock.isBeingDragged, time);
      });
    }

    // 3. Whale Debris (Industrial Cargo Containers)
    else if (this.mission.id === "young-whale") {
      this.whaleDebrisList.forEach((d) => {
        if (d.cleared) return;
        this.ctx.save();
        this.ctx.translate(d.x, d.y);

        // Drop shadow
        this.ctx.fillStyle = "rgba(0, 10, 25, 0.5)";
        this.ctx.filter = "blur(8px)";
        this.ctx.beginPath();
        this.ctx.roundRect(-d.width / 2, -d.height / 2 + 12, d.width, d.height, 10);
        this.ctx.fill();
        this.ctx.filter = "none";

        // Metal crate body
        const crateGrad = this.ctx.createLinearGradient(0, -d.height / 2, 0, d.height / 2);
        crateGrad.addColorStop(0, "#ff9800");
        crateGrad.addColorStop(0.5, d.color || "#e65100");
        crateGrad.addColorStop(1, "#bf360c");

        this.ctx.fillStyle = crateGrad;
        this.ctx.strokeStyle = "#3e2723";
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.roundRect(-d.width / 2, -d.height / 2, d.width, d.height, 10);
        this.ctx.fill();
        this.ctx.stroke();

        // Hazard Chevrons / Stripes
        this.ctx.fillStyle = "rgba(33, 33, 33, 0.4)";
        for (let i = -d.width / 2 + 8; i < d.width / 2 - 8; i += 18) {
          this.ctx.beginPath();
          this.ctx.moveTo(i, -d.height / 2 + 4);
          this.ctx.lineTo(i + 10, -d.height / 2 + 4);
          this.ctx.lineTo(i - 4, d.height / 2 - 4);
          this.ctx.lineTo(i - 14, d.height / 2 - 4);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // Label
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 12px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(d.name, 0, -4);
        this.ctx.fillStyle = "#ffd54f";
        this.ctx.fillText("🧲 마그넷 견인", 0, 14);
        this.ctx.restore();
      });
    }

    // 4. Otter Tangles
    else if (this.mission.id === "sea-otter") {
      this.otterTangles.forEach((t) => {
        if (t.cleared) return;
        this.ctx.save();
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.strokeStyle = "#80deea";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = "#004d40";
        this.ctx.font = "bold 12px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("매듭 풀기", t.x, t.y);
        this.ctx.restore();
      });
    }

    // 5. Giant Squid Crystals
    else if (this.mission.id === "giant-squid") {
      this.squidCrystals.forEach((c) => {
        if (c.cleared) return;
        this.ctx.save();
        this.ctx.fillStyle = "rgba(0, 229, 255, 0.6)";
        this.ctx.strokeStyle = "#ffd54f";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, 35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 12px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText("📡 소나 파쇄", c.x, c.y);
        this.ctx.restore();
      });
    }

    // Laser / Tool Beam from GUP Arm to Pointer while interacting
    if (this.isPointerDown && this.currentPhase === "danger_removal") {
      this.ctx.save();
      const armStartX = 180 + 36 * 1.35;
      const armStartY = 360 + 14 * 1.35;

      // Laser Beam Core
      const beamGrad = this.ctx.createLinearGradient(armStartX, armStartY, this.pointerPos.x, this.pointerPos.y);
      beamGrad.addColorStop(0, "rgba(255, 213, 79, 0.9)");
      beamGrad.addColorStop(0.5, "rgba(255, 152, 0, 0.95)");
      beamGrad.addColorStop(1, "rgba(255, 235, 59, 1.0)");

      this.ctx.strokeStyle = beamGrad;
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = "#ffb300";
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.moveTo(armStartX, armStartY);
      this.ctx.lineTo(this.pointerPos.x, this.pointerPos.y);
      this.ctx.stroke();

      // Plasma Cutting Point at Cursor
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(this.pointerPos.x, this.pointerPos.y, 7, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private renderBioCareStage() {
    const time = performance.now();
    this.ctx.save();

    // 1. High-Tech Holographic Medical Scanner Grid
    if (this.careSubStep === "scan") {
      renderHoloBioScan(this.ctx, this.animalX, this.animalY, 130, time);
    } else {
      // Gentle clinic care circle
      this.ctx.strokeStyle = "rgba(77, 208, 225, 0.4)";
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([8, 8]);
      this.ctx.beginPath();
      this.ctx.arc(this.animalX, this.animalY, 140, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // 2. Nutritious Treat Icon floating in Feeding Step
    if (this.careSubStep === "feed") {
      renderMarineTreat(this.ctx, this.animalX + 90, this.animalY - 30, this.mission.careTreatIcon, time);
    }

    // 3. Action Tool Floating Prompt
    this.ctx.fillStyle = "rgba(8, 24, 44, 0.92)";
    this.ctx.strokeStyle = "#ffd54f";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(this.animalX - 170, this.animalY + 125, 340, 50, 25);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.textAlign = "center";
    if (this.careSubStep === "scan") {
      this.ctx.fillText("🔍 동물을 탭하여 바이탈을 스캔하세요!", this.animalX, this.animalY + 155);
    } else if (this.careSubStep === "spray") {
      this.ctx.fillText(`🧴 치유 연고 분사 중 (${this.vitals.medicineSprayed}%)`, this.animalX, this.animalY + 155);
    } else if (this.careSubStep === "feed") {
      this.ctx.fillText(`${this.mission.careTreatIcon} ${this.mission.careTreatName} 먹여주기 (${this.vitals.treatFedCount}/2)`, this.animalX, this.animalY + 155);
    }
    this.ctx.restore();
  }

  private renderDockedGup() {
    this.ctx.save();
    this.ctx.translate(180, 360);
    renderGupSubmarine(this.ctx, {
      gupId: this.gup.id,
      color: this.gup.color,
      accentColor: this.gup.accentColor,
      subPitch: 0,
      currentSpeed: 0,
      isBoosting: false,
      boostTimer: 0,
      shieldEnergy: 0,
      maxShield: 100,
      companionAvatar: this.mission.companionAvatar,
      scale: 1.35,
      isDocked: true,
      armExtended: true,
      armTargetX: 180,
      armTargetY: -10,
      time: performance.now()
    });
    this.ctx.restore();
  }

  private renderRescueHUD(width: number, height: number) {
    // Vitals Telemetry Panel at Top Right
    this.ctx.save();
    const panelWidth = 320;
    const px = width - panelWidth - 24;
    const py = 24;

    this.ctx.fillStyle = "rgba(8, 24, 44, 0.9)";
    this.ctx.strokeStyle = "rgba(77, 208, 225, 0.6)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(px, py, panelWidth, 120, 16);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = "#ffd54f";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`🩺 바이탈 모니터 (${this.mission.animalName})`, px + 16, py + 26);

    // Health Percent Bar
    this.ctx.fillStyle = "#cfd8dc";
    this.ctx.font = "12px sans-serif";
    this.ctx.fillText(`생체 회복도: ${this.vitals.healthPercent}%`, px + 16, py + 54);
    this.ctx.fillStyle = "rgba(255,255,255,0.2)";
    this.ctx.fillRect(px + 16, py + 62, 280, 10);
    this.ctx.fillStyle = this.vitals.healthPercent > 70 ? "#4caf50" : "#ff9800";
    this.ctx.fillRect(px + 16, py + 62, 280 * (this.vitals.healthPercent / 100), 10);

    // Heart Rate & Stress
    this.ctx.fillStyle = "#80deea";
    this.ctx.font = "12px sans-serif";
    this.ctx.fillText(`💓 심박수: ${this.vitals.heartRate} BPM`, px + 16, py + 96);
    this.ctx.fillText(`⚠️ 스트레스: ${this.vitals.stressLevel}%`, px + 160, py + 96);

    // Notification Banner
    if (this.bannerTimer > 0 && this.bannerMessage) {
      const bannerW = 560;
      const bx = (width - bannerW) / 2;
      const by = height - 80;
      this.ctx.fillStyle = "rgba(14, 38, 66, 0.95)";
      this.ctx.strokeStyle = "#ffd54f";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(bx, by, bannerW, 46, 23);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 15px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.bannerMessage, width / 2, by + 28);
    }

    this.ctx.restore();
  }

  private pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }
}
