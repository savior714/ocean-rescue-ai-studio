import { GamePhase, MissionData, GupData } from "./types";
import { MISSIONS, GUPS } from "./missions-data";
import { Audio } from "./audio";
import { TravelEngine } from "./travel-engine";
import { RescueEngine } from "./rescue-engine";

export class OceanRescueGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: GamePhase = GamePhase.MISSION_SELECT;
  private selectedMission: MissionData = MISSIONS[0];
  private selectedGup: GupData = GUPS[0];

  private travelEngine: TravelEngine | null = null;
  private rescueEngine: RescueEngine | null = null;

  // DOM Elements
  private rootEl: HTMLElement;
  private helpEl: HTMLElement | null = null;
  private modalBackdrop: HTMLElement | null = null;
  private briefingModal: HTMLElement | null = null;
  private successModal: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not acquire 2D canvas context");
    this.ctx = context;
    this.rootEl = document.getElementById("ocean-rescue-root") || document.body;

    this.initDOM();
    this.bindEvents();
    this.setPhase(GamePhase.MISSION_SELECT);
  }

  private initDOM() {
    this.helpEl = document.getElementById("ocean-rescue-travel-help");
    this.modalBackdrop = document.getElementById("ocean-rescue-modal-backdrop");
    this.briefingModal = document.getElementById("ocean-rescue-briefing-modal");
    this.successModal = document.getElementById("ocean-rescue-success-modal");
  }

  private bindEvents() {
    // Sound & Music Toggle
    const soundBtn = document.getElementById("btn-toggle-sound");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        const isMuted = Audio.toggleMute();
        soundBtn.textContent = isMuted ? "🔇" : "🔊";
      });
    }

    // Launch Mission Button in Briefing Modal
    const btnLaunch = document.getElementById("btn-launch-mission");
    if (btnLaunch) {
      btnLaunch.addEventListener("click", () => {
        Audio.init();
        Audio.playOctoAlert();
        this.startLaunch();
      });
    }

    // Mission Select Cards Click handlers
    const missionCards = document.querySelectorAll(".mission-card");
    missionCards.forEach((card) => {
      card.addEventListener("click", () => {
        const missionId = card.getAttribute("data-mission-id");
        const found = MISSIONS.find((m) => m.id === missionId);
        if (found) {
          this.selectedMission = found;
          Audio.playBubble();
          this.openBriefingModal();
        }
      });
    });

    // Success Modal Action Buttons
    const btnNextMission = document.getElementById("btn-success-next");
    if (btnNextMission) {
      btnNextMission.addEventListener("click", () => {
        this.closeModals();
        this.setPhase(GamePhase.MISSION_SELECT);
      });
    }
  }

  public setPhase(phase: GamePhase) {
    this.phase = phase;

    // Cleanup previous engines
    if (this.travelEngine) {
      this.travelEngine.stop();
      this.travelEngine = null;
    }
    if (this.rescueEngine) {
      this.rescueEngine.stop();
      this.rescueEngine = null;
    }

    if (this.helpEl) {
      this.helpEl.hidden = phase !== GamePhase.TRAVEL;
    }

    switch (phase) {
      case GamePhase.MISSION_SELECT:
        this.renderMissionSelect();
        break;
      case GamePhase.LAUNCH:
        this.renderLaunchAnimation();
        break;
      case GamePhase.TRAVEL:
        this.startTravel();
        break;
      case GamePhase.RESCUE_ACTIVE:
        this.startRescue();
        break;
      case GamePhase.MISSION_SUCCESS:
        this.showSuccessScreen();
        break;
    }
  }

  private openBriefingModal() {
    if (!this.briefingModal || !this.modalBackdrop) return;
    this.modalBackdrop.hidden = false;
    this.briefingModal.hidden = false;

    // Populate Mission Details
    const titleEl = document.getElementById("briefing-title");
    const animalEl = document.getElementById("briefing-animal");
    const descEl = document.getElementById("briefing-desc");
    const toolEl = document.getElementById("briefing-tool");

    if (titleEl) titleEl.textContent = this.selectedMission.title;
    if (animalEl) animalEl.textContent = `${this.selectedMission.animalIcon} ${this.selectedMission.animalName}`;
    if (descEl) descEl.textContent = this.selectedMission.briefing;
    if (toolEl) toolEl.textContent = `🛠️ 권장 장비: ${this.selectedMission.toolLabel}`;
  }

  private closeModals() {
    if (this.modalBackdrop) this.modalBackdrop.hidden = true;
    if (this.briefingModal) this.briefingModal.hidden = true;
    if (this.successModal) this.successModal.hidden = true;
  }

  private startLaunch() {
    this.closeModals();
    this.setPhase(GamePhase.LAUNCH);
  }

  private renderMissionSelect() {
    this.closeModals();
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Background underwater deep render
    const bgGrad = this.ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 700);
    bgGrad.addColorStop(0, "#012a4a");
    bgGrad.addColorStop(0.6, "#011627");
    bgGrad.addColorStop(1, "#000814");
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    // Title & Octo-Emblem
    this.ctx.save();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 28px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText("🌊 옥토포드 해양 구조 본부 🌊", width / 2, 80);

    this.ctx.fillStyle = "#80deea";
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText("구조가 필요한 바다 생물을 선택하여 탐험선을 출동시키세요!", width / 2, 115);

    // Render Mission Cards Preview on Canvas
    MISSIONS.forEach((m, idx) => {
      const cardW = 320;
      const cardH = 340;
      const cardX = width / 2 - (MISSIONS.length * (cardW + 30) - 30) / 2 + idx * (cardW + 30);
      const cardY = 160;

      // Card Background
      this.ctx.fillStyle = m.id === this.selectedMission.id ? "rgba(10, 45, 80, 0.95)" : "rgba(8, 24, 44, 0.85)";
      this.ctx.strokeStyle = m.id === this.selectedMission.id ? "#00e5ff" : "rgba(77, 208, 225, 0.4)";
      this.ctx.lineWidth = m.id === this.selectedMission.id ? 3 : 1.5;
      this.ctx.beginPath();
      this.ctx.roundRect(cardX, cardY, cardW, cardH, 20);
      this.ctx.fill();
      this.ctx.stroke();

      // Animal Large Icon
      this.ctx.font = "72px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText(m.animalIcon, cardX + cardW / 2, cardY + 100);

      // Animal Title
      this.ctx.fillStyle = "#ffd54f";
      this.ctx.font = "bold 18px sans-serif";
      this.ctx.fillText(m.animalName, cardX + cardW / 2, cardY + 160);

      // Situation
      this.ctx.fillStyle = "#cfd8dc";
      this.ctx.font = "13px sans-serif";
      this.wrapText(m.summary, cardX + 24, cardY + 195, cardW - 48, 20);

      // Action Button Pill
      this.ctx.fillStyle = "#00bcd4";
      this.ctx.beginPath();
      this.ctx.roundRect(cardX + 40, cardY + cardH - 60, cardW - 80, 40, 20);
      this.ctx.fill();

      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 15px sans-serif";
      this.ctx.fillText("구조 출동 준비 ➔", cardX + cardW / 2, cardY + cardH - 35);
    });

    this.ctx.restore();
  }

  private renderLaunchAnimation() {
    let countdown = 3;
    Audio.playOctoAlert();

    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        this.setPhase(GamePhase.TRAVEL);
      }
    }, 800);

    const animateLaunch = () => {
      if (this.phase !== GamePhase.LAUNCH) return;
      const width = this.canvas.width;
      const height = this.canvas.height;

      // Dark dramatic launch tunnel
      this.ctx.fillStyle = "#000a14";
      this.ctx.fillRect(0, 0, width, height);

      // Launch Tubes & Lighting
      this.ctx.save();
      this.ctx.fillStyle = "#00e5ff";
      this.ctx.font = "bold 80px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.shadowColor = "#00e5ff";
      this.ctx.shadowBlur = 30;
      this.ctx.fillText(countdown > 0 ? `${countdown}` : "GO!", width / 2, height / 2);

      this.ctx.font = "bold 24px sans-serif";
      this.ctx.fillStyle = "#ffd54f";
      this.ctx.shadowBlur = 10;
      this.ctx.fillText("🚢 탐험선 발진 포드 가압 완료! 전방 수로 진입!", width / 2, height / 2 + 100);
      this.ctx.restore();

      requestAnimationFrame(animateLaunch);
    };
    requestAnimationFrame(animateLaunch);
  }

  private startTravel() {
    this.travelEngine = new TravelEngine(
      this.canvas,
      this.selectedMission,
      this.selectedGup,
      () => {
        this.setPhase(GamePhase.RESCUE_ACTIVE);
      }
    );
    this.travelEngine.start();
  }

  private startRescue() {
    this.rescueEngine = new RescueEngine(
      this.canvas,
      this.selectedMission,
      this.selectedGup,
      (step: number) => {
        Audio.playSuccess();
      },
      () => {
        this.setPhase(GamePhase.MISSION_SUCCESS);
      }
    );
    this.rescueEngine.start();
  }

  private showSuccessScreen() {
    if (!this.successModal || !this.modalBackdrop) return;
    this.modalBackdrop.hidden = false;
    this.successModal.hidden = false;

    const animalEl = document.getElementById("success-animal-name");
    const factEl = document.getElementById("success-ecology-fact");

    if (animalEl) animalEl.textContent = `${this.selectedMission.animalIcon} ${this.selectedMission.animalName}`;
    if (factEl) factEl.textContent = this.selectedMission.ecologyFact;
  }

  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = this.ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        this.ctx.fillText(line, x + maxWidth / 2, curY);
        line = words[n] + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x + maxWidth / 2, curY);
  }
}
