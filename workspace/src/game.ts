import { GamePhase, MissionData, GupData, UserStats, GupUpgrades, QuizQuestion } from "./types";
import { MISSIONS, GUPS, ECO_QUIZ_QUESTIONS } from "./missions-data";
import { TravelEngine } from "./travel-engine";
import { RescueEngine } from "./rescue-engine";
import { Audio } from "./audio";

const STORAGE_KEY = "ocean_rescue_stats_v2";

export class OceanRescueGame {
  private currentPhase: GamePhase = GamePhase.MISSION_SELECT;
  private selectedMission: MissionData = MISSIONS[0];
  private selectedGup: GupData = GUPS[0];

  private travelEngine: TravelEngine | null = null;
  private rescueEngine: RescueEngine | null = null;
  private canvas: HTMLCanvasElement;

  private isPaused = false;
  private resumeCountdownTimer: number | null = null;
  private launchTimer: number | null = null;
  private isBgmMuted = true;

  // Persistent User Progress
  private userStats: UserStats = {
    completedMissions: {},
    collectedBadges: [],
    totalRescuedAnimals: 0,
    totalStars: 0,
    upgrades: {
      speedLevel: 0,
      shieldLevel: 0,
      sonarLevel: 0
    },
    quizMasterUnlocked: false
  };

  // Quiz State
  private currentQuizIndex = 0;
  private quizQuestions: QuizQuestion[] = [];
  private quizCorrectCount = 0;

  constructor() {
    const canvasEl = document.getElementById("ocean-rescue-canvas") as HTMLCanvasElement;
    if (!canvasEl) throw new Error("ocean-rescue-canvas element not found");
    this.canvas = canvasEl;
    this.canvas.width = 1280;
    this.canvas.height = 720;

    this.loadStats();
    this.bindUI();
    this.updateStatsUI();
  }

  public boot() {
    this.renderMissionSelect();
    this.setPhase(GamePhase.MISSION_SELECT);
  }

  private loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.userStats = {
          ...this.userStats,
          ...parsed,
          upgrades: {
            ...this.userStats.upgrades,
            ...(parsed.upgrades || {})
          }
        };
      }
    } catch {
      // LocalStorage fallback
    }
  }

  private saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userStats));
    } catch {
      // ignore
    }
    this.updateStatsUI();
  }

  private updateStatsUI() {
    const starsEl = document.getElementById("ocean-rescue-stat-stars");
    const badgesEl = document.getElementById("ocean-rescue-stat-badges");

    if (starsEl) starsEl.textContent = String(this.userStats.totalStars);
    if (badgesEl) {
      badgesEl.textContent = `${this.userStats.collectedBadges.length} / ${MISSIONS.length}`;
    }
  }

  private bindUI() {
    // Top Bar Actions
    const bgmBtn = document.getElementById("ocean-rescue-btn-bgm");
    const muteBtn = document.getElementById("ocean-rescue-btn-mute");
    const logbookBtn = document.getElementById("ocean-rescue-btn-logbook");
    const logbookModal = document.getElementById("ocean-rescue-logbook-modal");
    const logbookClose = document.getElementById("ocean-rescue-logbook-close");

    const hangarBtn = document.getElementById("ocean-rescue-btn-hangar");
    const hangarModal = document.getElementById("ocean-rescue-hangar-modal");
    const hangarClose = document.getElementById("ocean-rescue-hangar-close");

    const quizBtn = document.getElementById("ocean-rescue-btn-quiz");
    const quizModal = document.getElementById("ocean-rescue-quiz-modal");
    const quizClose = document.getElementById("ocean-rescue-quiz-close");

    if (bgmBtn) {
      bgmBtn.addEventListener("click", () => {
        const playing = Audio.toggleBGM();
        this.isBgmMuted = !playing;
        bgmBtn.textContent = playing ? "🎵 BGM ON" : "🔇 BGM OFF";
        Audio.playBubble();
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        const muted = Audio.toggleMute();
        muteBtn.textContent = muted ? "🔇 음소거" : "🔊 사운드";
        if (!muted) Audio.playBubble();
      });
    }

    const showModal = (modal: HTMLElement | null) => {
      if (!modal) return;
      modal.hidden = false;
      modal.style.display = "flex";
      Audio.playBubble();
    };

    const hideModal = (modal: HTMLElement | null) => {
      if (!modal) return;
      modal.hidden = true;
      modal.style.display = "none";
      Audio.playBubble();
    };

    // Modal Opening & Closing with Backdrop clicks
    if (logbookBtn && logbookModal) {
      logbookBtn.addEventListener("click", () => {
        this.renderLogbook();
        showModal(logbookModal);
      });
    }

    if (logbookClose && logbookModal) {
      logbookClose.addEventListener("click", () => {
        hideModal(logbookModal);
      });
    }
    if (logbookModal) {
      logbookModal.addEventListener("click", (e) => {
        if (e.target === logbookModal) {
          hideModal(logbookModal);
        }
      });
    }

    if (hangarBtn && hangarModal) {
      hangarBtn.addEventListener("click", () => {
        this.renderHangar();
        showModal(hangarModal);
      });
    }

    if (hangarClose && hangarModal) {
      hangarClose.addEventListener("click", () => {
        hideModal(hangarModal);
      });
    }
    if (hangarModal) {
      hangarModal.addEventListener("click", (e) => {
        if (e.target === hangarModal) {
          hideModal(hangarModal);
        }
      });
    }

    if (quizBtn && quizModal) {
      quizBtn.addEventListener("click", () => {
        this.startQuiz();
        showModal(quizModal);
      });
    }

    if (quizClose && quizModal) {
      quizClose.addEventListener("click", () => {
        hideModal(quizModal);
      });
    }
    if (quizModal) {
      quizModal.addEventListener("click", (e) => {
        if (e.target === quizModal) {
          hideModal(quizModal);
        }
      });
    }

    // Global Keydown for Escape & Pause shortcut
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (logbookModal && !logbookModal.hidden) {
          hideModal(logbookModal);
          return;
        }
        if (hangarModal && !hangarModal.hidden) {
          hideModal(hangarModal);
          return;
        }
        if (quizModal && !quizModal.hidden) {
          hideModal(quizModal);
          return;
        }
        if (this.currentPhase === GamePhase.TRAVEL || this.currentPhase === GamePhase.RESCUE_ACTIVE) {
          this.togglePause(!this.isPaused);
        }
      } else if (e.key === "p" || e.key === "P") {
        if (this.currentPhase === GamePhase.TRAVEL || this.currentPhase === GamePhase.RESCUE_ACTIVE) {
          this.togglePause(!this.isPaused);
        }
      }
    });

    // Upgrade buttons
    this.bindUpgradeButtons();

    // GUP back & launch buttons
    const gupBackBtn = document.getElementById("ocean-rescue-gup-back");
    const gupLaunchBtn = document.getElementById("ocean-rescue-gup-launch");

    if (gupBackBtn) {
      gupBackBtn.addEventListener("click", () => {
        this.renderMissionSelect();
        this.setPhase(GamePhase.MISSION_SELECT);
        Audio.playBubble();
      });
    }

    if (gupLaunchBtn) {
      gupLaunchBtn.addEventListener("click", () => {
        this.startLaunchSequence();
      });
    }

    // Launch skip
    const launchSection = document.getElementById("ocean-rescue-launch");
    const launchSkip = document.getElementById("ocean-rescue-launch-skip");
    const skipFn = (e?: Event) => {
      if (e) e.stopPropagation();
      if (this.currentPhase === GamePhase.LAUNCH) {
        this.startTravel();
      }
    };
    if (launchSection) launchSection.addEventListener("click", skipFn);
    if (launchSkip) launchSkip.addEventListener("click", skipFn);

    // Pause Controls
    const pauseBtn = document.getElementById("ocean-rescue-pause-button");
    const pauseResume = document.getElementById("ocean-rescue-pause-resume");
    const pauseMenuBtn = document.getElementById("ocean-rescue-pause-menu-button");

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => this.togglePause(true));
    }
    if (pauseResume) {
      pauseResume.addEventListener("click", () => this.resumeGame());
    }
    if (pauseMenuBtn) {
      pauseMenuBtn.addEventListener("click", () => {
        this.togglePause(false);
        this.stopEngines();
        this.renderMissionSelect();
        this.setPhase(GamePhase.MISSION_SELECT);
      });
    }

    // Volume Sliders
    const soundSlider = document.getElementById("ocean-rescue-volume-sound") as HTMLInputElement;
    const voiceSlider = document.getElementById("ocean-rescue-volume-voice") as HTMLInputElement;
    const soundVal = document.getElementById("ocean-rescue-volume-sound-val");
    const voiceVal = document.getElementById("ocean-rescue-volume-voice-val");

    if (soundSlider) {
      soundSlider.addEventListener("input", () => {
        const val = Number(soundSlider.value);
        Audio.setSoundVolume(val);
        if (soundVal) soundVal.textContent = String(val);
        Audio.playBubble();
      });
    }
    if (voiceSlider) {
      voiceSlider.addEventListener("input", () => {
        const val = Number(voiceSlider.value);
        Audio.setVoiceVolume(val);
        if (voiceVal) voiceVal.textContent = String(val);
      });
    }

    // Mission Complete Buttons
    const continueBtn = document.getElementById("ocean-rescue-mission-complete-continue");
    const replayBtn = document.getElementById("ocean-rescue-mission-complete-replay");

    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        const currentIdx = MISSIONS.findIndex(m => m.id === this.selectedMission.id);
        const nextMission = MISSIONS[(currentIdx + 1) % MISSIONS.length];
        this.selectedMission = nextMission;
        this.renderMissionSelect();
        this.setPhase(GamePhase.MISSION_SELECT);
        Audio.playBubble();
      });
    }
    if (replayBtn) {
      replayBtn.addEventListener("click", () => {
        this.startLaunchSequence();
      });
    }
  }

  // --- Upgrade Workshop / Hangar ---
  private renderHangar() {
    const upg = this.userStats.upgrades || { speedLevel: 0, shieldLevel: 0, sonarLevel: 0 };
    
    const hangarSubtitle = document.querySelector("#ocean-rescue-hangar-modal .ocean-rescue-modal-card p");
    if (hangarSubtitle) {
      hangarSubtitle.innerHTML = `별(⭐)을 사용하여 탐험선 장비를 강화하세요.<br><span style="display:inline-block; margin-top:6px; font-weight:700; color:#ffd54f; background:rgba(255,213,79,0.15); padding:4px 10px; border-radius:6px; border:1px solid rgba(255,213,79,0.3);">⭐ 현재 보유 별: ${this.userStats.totalStars}개</span>`;
    }

    // Speed
    const speedLvlEl = document.getElementById("ocean-rescue-upg-speed-lvl");
    const speedBtn = document.getElementById("ocean-rescue-btn-upg-speed") as HTMLButtonElement;
    if (speedLvlEl) speedLvlEl.textContent = String(upg.speedLevel);
    this.updateDots("ocean-rescue-upg-speed-dots", upg.speedLevel);
    if (speedBtn) {
      const cost = 10;
      speedBtn.disabled = upg.speedLevel >= 3 || this.userStats.totalStars < cost;
      speedBtn.textContent = upg.speedLevel >= 3 ? "최대 강화 완료 (MAX)" : `강화 (⭐ ${cost}개 필요)`;
    }

    // Shield
    const shieldLvlEl = document.getElementById("ocean-rescue-upg-shield-lvl");
    const shieldBtn = document.getElementById("ocean-rescue-btn-upg-shield") as HTMLButtonElement;
    if (shieldLvlEl) shieldLvlEl.textContent = String(upg.shieldLevel);
    this.updateDots("ocean-rescue-upg-shield-dots", upg.shieldLevel);
    if (shieldBtn) {
      const cost = 15;
      shieldBtn.disabled = upg.shieldLevel >= 3 || this.userStats.totalStars < cost;
      shieldBtn.textContent = upg.shieldLevel >= 3 ? "최대 강화 완료 (MAX)" : `강화 (⭐ ${cost}개 필요)`;
    }

    // Sonar
    const sonarLvlEl = document.getElementById("ocean-rescue-upg-sonar-lvl");
    const sonarBtn = document.getElementById("ocean-rescue-btn-upg-sonar") as HTMLButtonElement;
    if (sonarLvlEl) sonarLvlEl.textContent = String(upg.sonarLevel);
    this.updateDots("ocean-rescue-upg-sonar-dots", upg.sonarLevel);
    if (sonarBtn) {
      const cost = 12;
      sonarBtn.disabled = upg.sonarLevel >= 3 || this.userStats.totalStars < cost;
      sonarBtn.textContent = upg.sonarLevel >= 3 ? "최대 강화 완료 (MAX)" : `강화 (⭐ ${cost}개 필요)`;
    }
  }

  private updateDots(containerId: string, level: number) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const dots = container.querySelectorAll(".ocean-rescue-upgrade-dot");
    dots.forEach((d, idx) => {
      if (idx < level) {
        d.classList.add("active");
      } else {
        d.classList.remove("active");
      }
    });
  }

  private bindUpgradeButtons() {
    const speedBtn = document.getElementById("ocean-rescue-btn-upg-speed");
    const shieldBtn = document.getElementById("ocean-rescue-btn-upg-shield");
    const sonarBtn = document.getElementById("ocean-rescue-btn-upg-sonar");

    if (speedBtn) {
      speedBtn.addEventListener("click", () => {
        if (!this.userStats.upgrades) this.userStats.upgrades = { speedLevel: 0, shieldLevel: 0, sonarLevel: 0 };
        if (this.userStats.upgrades.speedLevel < 3 && this.userStats.totalStars >= 10) {
          this.userStats.totalStars -= 10;
          this.userStats.upgrades.speedLevel++;
          Audio.playSuccess();
          Audio.speak("터보 엔진 업그레이드 완료!", { companion: "트윅" });
          this.saveStats();
          this.renderHangar();
        }
      });
    }

    if (shieldBtn) {
      shieldBtn.addEventListener("click", () => {
        if (!this.userStats.upgrades) this.userStats.upgrades = { speedLevel: 0, shieldLevel: 0, sonarLevel: 0 };
        if (this.userStats.upgrades.shieldLevel < 3 && this.userStats.totalStars >= 15) {
          this.userStats.totalStars -= 15;
          this.userStats.upgrades.shieldLevel++;
          Audio.playSuccess();
          Audio.speak("에너지 방어막 업그레이드 완료!", { companion: "트윅" });
          this.saveStats();
          this.renderHangar();
        }
      });
    }

    if (sonarBtn) {
      sonarBtn.addEventListener("click", () => {
        if (!this.userStats.upgrades) this.userStats.upgrades = { speedLevel: 0, shieldLevel: 0, sonarLevel: 0 };
        if (this.userStats.upgrades.sonarLevel < 3 && this.userStats.totalStars >= 12) {
          this.userStats.totalStars -= 12;
          this.userStats.upgrades.sonarLevel++;
          Audio.playSuccess();
          Audio.speak("장거리 초음파 소나 업그레이드 완료!", { companion: "트윅" });
          this.saveStats();
          this.renderHangar();
        }
      });
    }
  }

  // --- Marine Ecology Quiz Challenge ---
  private startQuiz() {
    this.quizQuestions = [...ECO_QUIZ_QUESTIONS];
    this.currentQuizIndex = 0;
    this.quizCorrectCount = 0;
    this.renderCurrentQuizQuestion();
  }

  private renderCurrentQuizQuestion() {
    const q = this.quizQuestions[this.currentQuizIndex];
    if (!q) {
      this.finishQuiz();
      return;
    }

    const progressEl = document.getElementById("ocean-rescue-quiz-progress-text");
    const categoryEl = document.getElementById("ocean-rescue-quiz-category-tag");
    const questionEl = document.getElementById("ocean-rescue-quiz-question");
    const optionsEl = document.getElementById("ocean-rescue-quiz-options");
    const expBox = document.getElementById("ocean-rescue-quiz-explanation-box");

    if (progressEl) progressEl.textContent = `문제 ${this.currentQuizIndex + 1} / ${this.quizQuestions.length}`;
    if (categoryEl) categoryEl.textContent = q.category;
    if (questionEl) questionEl.textContent = q.question;
    if (expBox) expBox.hidden = true;

    if (optionsEl) {
      optionsEl.innerHTML = "";
      q.options.forEach((optText, optIdx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ocean-rescue-quiz-opt";
        btn.innerHTML = `<span style="font-weight: 800; color: #ffd54f;">${optIdx + 1}.</span> <span>${optText}</span>`;
        btn.addEventListener("click", () => this.handleQuizAnswer(optIdx, btn, q));
        optionsEl.appendChild(btn);
      });
    }
  }

  private handleQuizAnswer(selectedIdx: number, selectedBtn: HTMLButtonElement, q: QuizQuestion) {
    const optionsEl = document.getElementById("ocean-rescue-quiz-options");
    if (optionsEl) {
      const allBtns = optionsEl.querySelectorAll<HTMLButtonElement>("button");
      allBtns.forEach(b => (b.disabled = true));
    }

    const isCorrect = selectedIdx === q.correctAnswer;
    const expBox = document.getElementById("ocean-rescue-quiz-explanation-box");
    const resTitle = document.getElementById("ocean-rescue-quiz-result-title");
    const expText = document.getElementById("ocean-rescue-quiz-explanation");
    const nextBtn = document.getElementById("ocean-rescue-quiz-next-btn");

    if (isCorrect) {
      this.quizCorrectCount++;
      selectedBtn.classList.add("correct");
      Audio.playSuccess();
      if (resTitle) resTitle.textContent = "🎉 정답입니다! (+⭐ 5개 획득)";
      this.userStats.totalStars += 5;
      this.saveStats();
    } else {
      selectedBtn.classList.add("wrong");
      Audio.playHit();
      if (resTitle) resTitle.textContent = `❌ 아쉽네요! 정답은 ${q.correctAnswer + 1}번입니다.`;
    }

    if (expText) expText.textContent = q.explanation;
    if (expBox) expBox.hidden = false;

    if (nextBtn) {
      nextBtn.textContent = this.currentQuizIndex === this.quizQuestions.length - 1 ? "결과 보기 🏆" : "다음 문제 ▶";
      nextBtn.onclick = () => {
        this.currentQuizIndex++;
        this.renderCurrentQuizQuestion();
        Audio.playBubble();
      };
    }
  }

  private finishQuiz() {
    const questionEl = document.getElementById("ocean-rescue-quiz-question");
    const optionsEl = document.getElementById("ocean-rescue-quiz-options");
    const expBox = document.getElementById("ocean-rescue-quiz-explanation-box");
    const progressEl = document.getElementById("ocean-rescue-quiz-progress-text");
    const categoryEl = document.getElementById("ocean-rescue-quiz-category-tag");

    if (progressEl) progressEl.textContent = "퀴즈 완료";
    if (categoryEl) categoryEl.textContent = "최종 결과";
    if (optionsEl) optionsEl.innerHTML = "";
    if (expBox) expBox.hidden = true;

    if (questionEl) {
      const passed = this.quizCorrectCount >= 4;
      if (passed && !this.userStats.quizMasterUnlocked) {
        this.userStats.quizMasterUnlocked = true;
        this.userStats.collectedBadges.push("옥토 퀴즈 박사");
        this.saveStats();
      }

      questionEl.innerHTML = `
        <div style="text-align: center; padding: 16px 8px;">
          <div style="font-size: 38px; margin-bottom: 10px;">🎓 퀴즈 챌린지 완료!</div>
          <div style="font-size: 20px; color: #ffd54f; font-weight: 800; margin-bottom: 8px;">
            맞힌 문제: ${this.quizCorrectCount} / ${this.quizQuestions.length}
          </div>
          <p style="margin-top: 10px; font-size: 14px; color: #b2ebf2; line-height: 1.6;">
            ${passed ? "대단해요! 해양 생태에 대해 깊이 이해하고 계시네요! 🎖️ <strong>[옥토 퀴즈 박사]</strong> 훈장이 수여되었습니다!" : "수고하셨습니다! 도감을 참고하여 다시 도전해보세요!"}
          </p>
          <div style="margin-top: 20px; display: flex; justify-content: center; gap: 12px;">
            <button id="ocean-rescue-quiz-retry-btn" type="button" class="ocean-rescue-btn-secondary" style="font-weight: 700;">🔄 다시 풀기</button>
          </div>
        </div>
      `;

      const retryBtn = document.getElementById("ocean-rescue-quiz-retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          this.startQuiz();
          Audio.playBubble();
        });
      }
    }
  }

  public setPhase(phase: GamePhase) {
    this.currentPhase = phase;
    const root = document.getElementById("ocean-rescue-root");
    if (root) {
      root.setAttribute("data-phase", phase.toLowerCase());
      root.setAttribute("data-ocean-rescue-ready", "true");
    }

    // Toggle Section visibilities
    const missionSection = document.getElementById("ocean-rescue-mission-select");
    const gupSection = document.getElementById("ocean-rescue-gup-select");
    const launchSection = document.getElementById("ocean-rescue-launch");
    const stageSection = document.getElementById("ocean-rescue-stage");
    const rescueOverlay = document.getElementById("ocean-rescue-rescue-overlay");
    const successSection = document.getElementById("ocean-rescue-mission-success");
    const pauseBtn = document.getElementById("ocean-rescue-pause-button");
    const travelHelp = document.getElementById("ocean-rescue-travel-help");
    const travelProgress = document.getElementById("ocean-rescue-travel-progress");

    if (missionSection) missionSection.style.display = phase === GamePhase.MISSION_SELECT ? "block" : "none";
    if (gupSection) gupSection.hidden = phase !== GamePhase.GUP_SELECT;
    if (launchSection) launchSection.hidden = phase !== GamePhase.LAUNCH;
    if (stageSection) stageSection.hidden = phase !== GamePhase.TRAVEL && phase !== GamePhase.RESCUE_ACTIVE && phase !== GamePhase.RESCUE_TUTORIAL && phase !== GamePhase.RESCUE_SITE_TRANSITION;
    if (rescueOverlay) rescueOverlay.hidden = phase !== GamePhase.RESCUE_ACTIVE && phase !== GamePhase.RESCUE_TUTORIAL && phase !== GamePhase.RESCUE_SITE_TRANSITION;
    if (successSection) successSection.hidden = phase !== GamePhase.MISSION_SUCCESS;
    if (pauseBtn) pauseBtn.hidden = phase !== GamePhase.TRAVEL && phase !== GamePhase.RESCUE_ACTIVE;
    if (travelHelp) travelHelp.hidden = phase !== GamePhase.TRAVEL;
    if (travelProgress) travelProgress.hidden = phase !== GamePhase.TRAVEL;
  }

  // --- 1. Mission Select ---
  private renderMissionSelect() {
    const list = document.getElementById("ocean-rescue-mission-list");
    if (!list) return;
    list.innerHTML = "";

    MISSIONS.forEach((m) => {
      const isCompleted = !!this.userStats.completedMissions[m.id];
      const stars = this.userStats.completedMissions[m.id]?.stars || 0;
      const starIcons = isCompleted ? "⭐".repeat(stars) : "";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ocean-rescue-mission-card";
      btn.innerHTML = `
        <span class="ocean-rescue-mission-avatar">${m.animalIcon}</span>
        <span class="ocean-rescue-mission-title">${m.title}</span>
        <span class="ocean-rescue-mission-companion">대원: ${m.companion}</span>
        <span class="ocean-rescue-mission-summary">${m.summary}</span>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
          <span class="ocean-rescue-mission-status">${isCompleted ? "구조 완료 " + starIcons : "출동 대기"}</span>
          <span style="font-size: 11px; color: #80deea; background: rgba(0,0,0,0.3); padding: 3px 6px; border-radius: 6px;">수심 ${m.depthMeters}m</span>
        </div>
      `;
      btn.addEventListener("click", () => {
        this.selectedMission = m;
        this.renderGupSelect();
        this.setPhase(GamePhase.GUP_SELECT);
        Audio.playBubble();
      });
      list.appendChild(btn);
    });

    const status = document.getElementById("ocean-rescue-status");
    if (status) status.textContent = "구조할 해양 생물 미션을 선택하세요.";
  }

  // --- 2. GUP Select ---
  private renderGupSelect() {
    const list = document.getElementById("ocean-rescue-gup-list");
    const missionLabel = document.getElementById("ocean-rescue-gup-mission");
    if (missionLabel) missionLabel.textContent = `출동 미션: ${this.selectedMission.title}`;
    if (!list) return;
    list.innerHTML = "";

    GUPS.forEach((g) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ocean-rescue-gup-card ${this.selectedGup.id === g.id ? "selected" : ""}`;
      btn.setAttribute("aria-pressed", this.selectedGup.id === g.id ? "true" : "false");
      btn.innerHTML = `
        <span class="ocean-rescue-gup-icon">${g.icon}</span>
        <span class="ocean-rescue-gup-name">${g.name}</span>
        <span class="ocean-rescue-gup-description">${g.description}</span>
        <div class="ocean-rescue-gup-spec">
          <span>속도: ${Math.round(g.speedMultiplier * 100)}%</span>
          <span>특수기: ${g.specialAbility}</span>
        </div>
      `;
      btn.addEventListener("click", () => {
        this.selectedGup = g;
        const allBtns = list.querySelectorAll("button");
        allBtns.forEach(b => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        Audio.playBubble();
      });
      list.appendChild(btn);
    });

    const status = document.getElementById("ocean-rescue-status");
    if (status) status.textContent = "탑승할 탐험선(GUP)을 선택하세요.";
  }

  // --- 3. Launch Sequence ---
  private startLaunchSequence() {
    this.stopEngines();
    this.setPhase(GamePhase.LAUNCH);
    Audio.playOctoAlert();

    const gupName = document.getElementById("ocean-rescue-launch-gup-name");
    const companion = document.getElementById("ocean-rescue-launch-companion");
    const briefing = document.getElementById("ocean-rescue-launch-briefing");

    if (gupName) gupName.textContent = this.selectedGup.name;
    if (companion) companion.textContent = `${this.selectedMission.companion}:`;
    if (briefing) briefing.textContent = this.selectedMission.briefing;

    Audio.speak(this.selectedMission.briefing, { companion: this.selectedMission.companion });

    const status = document.getElementById("ocean-rescue-status");
    if (status) status.textContent = `출동 준비: ${this.selectedGup.name} — ${this.selectedMission.title}`;

    if (this.launchTimer !== null) {
      window.clearTimeout(this.launchTimer);
    }

    this.launchTimer = window.setTimeout(() => {
      this.launchTimer = null;
      if (this.currentPhase === GamePhase.LAUNCH) {
        this.startTravel();
      }
    }, 3200);
  }

  // --- 4. Travel Scene ---
  private startTravel() {
    this.stopEngines();
    this.setPhase(GamePhase.TRAVEL);

    const helpEl = document.getElementById("ocean-rescue-travel-help");
    if (helpEl) {
      helpEl.textContent = "장애물을 피해 이동하세요! 꾹 누르면 계속 이동하며, Space키로 소나를 쏩니다.";
    }

    const status = document.getElementById("ocean-rescue-status");
    if (status) status.textContent = "탐험선 항해 중: 구조 현장으로 이동합니다.";

    this.travelEngine = new TravelEngine(
      this.canvas,
      this.selectedMission,
      this.selectedGup,
      this.userStats.upgrades,
      () => this.startRescue()
    );
    this.travelEngine.start();
  }

  // --- 5. Rescue Scene ---
  private startRescue() {
    this.stopEngines();
    this.setPhase(GamePhase.RESCUE_ACTIVE);

    const companionEl = document.getElementById("ocean-rescue-rescue-companion");
    const situationEl = document.getElementById("ocean-rescue-rescue-situation");
    const instructionEl = document.getElementById("ocean-rescue-rescue-instruction");
    const progressEl = document.getElementById("ocean-rescue-rescue-progress");
    const statusEl = document.getElementById("ocean-rescue-status");

    if (companionEl) companionEl.textContent = `${this.selectedMission.companion}:`;
    if (situationEl) situationEl.textContent = this.selectedMission.situation;
    if (instructionEl) instructionEl.textContent = this.selectedMission.tutorial;
    if (progressEl) progressEl.textContent = "구조 도구를 작동해주세요!";
    if (statusEl) statusEl.textContent = this.selectedMission.situation;

    Audio.speak(this.selectedMission.situation + " " + this.selectedMission.tutorial, {
      companion: this.selectedMission.companion
    });

    this.rescueEngine = new RescueEngine(
      this.canvas,
      this.selectedMission,
      this.selectedGup,
      this.userStats.upgrades,
      (step) => {
        const dialog = this.selectedMission.dialogues[step - 1];
        if (dialog) {
          Audio.speak(dialog, { companion: this.selectedMission.companion });
        }
      },
      () => this.completeMission()
    );
    this.rescueEngine.start();
  }

  // --- 6. Mission Complete ---
  private completeMission() {
    const travelStars = this.travelEngine ? this.travelEngine.starsCollected : 10;
    this.stopEngines();
    this.setPhase(GamePhase.MISSION_SUCCESS);

    // Save Progress
    const starsRating = travelStars >= 12 ? 3 : travelStars >= 6 ? 2 : 1;
    this.userStats.completedMissions[this.selectedMission.id] = {
      stars: starsRating,
      bestTime: 45,
      unlockedAt: new Date().toISOString()
    };
    if (!this.userStats.collectedBadges.includes(this.selectedMission.badge)) {
      this.userStats.collectedBadges.push(this.selectedMission.badge);
    }
    this.userStats.totalStars += travelStars;
    this.userStats.totalRescuedAnimals += 1;
    this.saveStats();

    // Populate Mission Success UI
    const animalEl = document.getElementById("ocean-rescue-mission-success-animal");
    const destEl = document.getElementById("ocean-rescue-mission-success-destination");
    const starsEl = document.getElementById("ocean-rescue-mission-stars");
    const badgeText = document.getElementById("ocean-rescue-badge-text");
    const ecologyEl = document.getElementById("ocean-rescue-mission-success-ecology");
    const triviaList = document.getElementById("ocean-rescue-trivia-list");

    if (animalEl) animalEl.textContent = this.selectedMission.animalIcon;
    if (destEl) destEl.textContent = `${this.selectedMission.title} 완료!`;
    if (starsEl) starsEl.textContent = "⭐".repeat(starsRating);
    if (badgeText) badgeText.textContent = `새 훈장 수여: [${this.selectedMission.badge}]`;
    if (ecologyEl) {
      ecologyEl.innerHTML = `<strong>🌱 생태 보호 이야기:</strong><br>${this.selectedMission.ecologyFact}`;
    }

    if (triviaList) {
      triviaList.innerHTML = "";
      this.selectedMission.funTrivia.forEach(t => {
        const li = document.createElement("li");
        li.textContent = t;
        triviaList.appendChild(li);
      });
    }

    Audio.speak("임무를 완수했습니다! 멋진 구조 작전이었어요!", {
      companion: this.selectedMission.companion
    });
  }

  // --- 7. Logbook & Badge Gallery ---
  private renderLogbook() {
    const list = document.getElementById("ocean-rescue-logbook-list");
    if (!list) return;
    list.innerHTML = "";

    MISSIONS.forEach(m => {
      const isCompleted = !!this.userStats.completedMissions[m.id];
      const stars = this.userStats.completedMissions[m.id]?.stars || 0;
      const card = document.createElement("div");
      card.className = `ocean-rescue-logbook-card ${isCompleted ? "unlocked" : "locked"}`;
      card.style.cursor = isCompleted ? "pointer" : "default";

      if (isCompleted) {
        card.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 38px;">${m.animalIcon}</span>
              <div>
                <div style="font-weight: 800; color: #fff; font-size: 17px;">${m.animalName}</div>
                <div style="font-size: 12px; color: #80deea;">담당 대원: ${m.companion} | 수심 ${m.depthMeters}m</div>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="ocean-rescue-badge-tag" style="display: inline-block;">🎖️ ${m.badge}</span>
              <div style="font-size: 13px; margin-top: 4px;">${"⭐".repeat(stars)}</div>
            </div>
          </div>

          <p style="font-size: 13px; color: #eceff1; margin: 10px 0 6px 0; line-height: 1.5; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 8px;">
            <strong>🌱 생태 이야기:</strong> ${m.ecologyFact}
          </p>

          <div style="margin-top: 8px; font-size: 12px; color: #ffd54f; line-height: 1.4;">
            <strong>💡 탐험 일지:</strong>
            <ul style="margin: 4px 0 0 16px; padding: 0; list-style-type: disc;">
              ${m.funTrivia.map(t => `<li style="margin-bottom: 2px;">${t}</li>`).join("")}
            </ul>
          </div>

          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="ocean-rescue-btn-voice-replay ocean-rescue-btn-secondary" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
              🗣️ ${m.companion} 브리핑 듣기
            </button>
            <button type="button" class="ocean-rescue-btn-sound-replay ocean-rescue-btn-secondary" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
              🎵 동물 소리 재생
            </button>
          </div>
        `;

        const voiceBtn = card.querySelector(".ocean-rescue-btn-voice-replay");
        if (voiceBtn) {
          voiceBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            Audio.speak(`${m.animalName} 생태 정보입니다. ${m.ecologyFact}`, { companion: m.companion });
          });
        }

        const soundBtn = card.querySelector(".ocean-rescue-btn-sound-replay");
        if (soundBtn) {
          soundBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (m.id === "young-whale") {
              Audio.playWhaleCall();
            } else if (m.id === "sea-otter") {
              Audio.playMunch();
            } else {
              Audio.playBubble();
            }
          });
        }
      } else {
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; opacity: 0.6;">
            <span style="font-size: 38px;">🔒</span>
            <div>
              <div style="font-weight: 700; color: #90a4ae; font-size: 16px;">미확인 생물 [${m.animalName}]</div>
              <div style="font-size: 12px; color: #78909c;">${m.title} 미션을 완료하여 도감과 훈장을 잠금 해제하세요!</div>
            </div>
          </div>
        `;
      }
      list.appendChild(card);
    });
  }

  // --- Pause & Resumption ---
  private togglePause(pause: boolean) {
    this.isPaused = pause;
    const pauseOverlay = document.getElementById("ocean-rescue-pause-overlay");
    if (pauseOverlay) pauseOverlay.hidden = !pause;

    if (pause) {
      if (this.travelEngine) this.travelEngine.stop();
      if (this.rescueEngine) this.rescueEngine.stop();
    } else {
      if (this.currentPhase === GamePhase.TRAVEL && this.travelEngine) {
        this.travelEngine.start();
      } else if (this.currentPhase === GamePhase.RESCUE_ACTIVE && this.rescueEngine) {
        this.rescueEngine.start();
      }
    }
  }

  private resumeGame() {
    const countdownEl = document.getElementById("ocean-rescue-pause-countdown");
    if (!countdownEl) {
      this.togglePause(false);
      return;
    }

    countdownEl.hidden = false;
    let count = 3;
    countdownEl.textContent = String(count);

    if (this.resumeCountdownTimer !== null) {
      window.clearInterval(this.resumeCountdownTimer);
    }

    this.resumeCountdownTimer = window.setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.textContent = String(count);
        Audio.playBubble();
      } else {
        if (this.resumeCountdownTimer !== null) {
          window.clearInterval(this.resumeCountdownTimer);
          this.resumeCountdownTimer = null;
        }
        countdownEl.hidden = true;
        this.togglePause(false);
      }
    }, 600);
  }

  private stopEngines() {
    if (this.launchTimer !== null) {
      window.clearTimeout(this.launchTimer);
      this.launchTimer = null;
    }
    if (this.resumeCountdownTimer !== null) {
      window.clearInterval(this.resumeCountdownTimer);
      this.resumeCountdownTimer = null;
    }
    if (this.travelEngine) {
      this.travelEngine.stop();
      this.travelEngine = null;
    }
    if (this.rescueEngine) {
      this.rescueEngine.stop();
      this.rescueEngine = null;
    }
  }
}
