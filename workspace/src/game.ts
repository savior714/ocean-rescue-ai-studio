import {
  GamePhase,
  MissionData,
  GupData,
  UserStats,
  QuizQuestion,
  MissionProgressRecord,
  GupUpgrades
} from "./types";
import { MISSIONS, GUPS, ECO_QUIZ_QUESTIONS } from "./missions-data";
import { TravelEngine } from "./travel-engine";
import { RescueEngine } from "./rescue-engine";
import { Audio } from "./audio";
import { RescueReadiness } from "./travel/readiness";

const STORAGE_KEY = "ocean_rescue_restoration_v4";

export class OceanRescueGame {
  private currentPhase: GamePhase = GamePhase.MISSION_SELECT;
  private selectedMission: MissionData = MISSIONS[0];
  private selectedGup: GupData = GUPS[0];

  private travelEngine: TravelEngine | null = null;
  private rescueEngine: RescueEngine | null = null;
  private canvas: HTMLCanvasElement;

  private isPaused = false;
  private isBgmMuted = false;

  // Persistent User Progress: Stars, Upgrades, Ecosystem Restoration & Badges
  private userStats: UserStats = {
    totalStars: 120,
    completedMissions: {},
    collectedBadges: [],
    totalRescuedAnimals: 0,
    ecosystemRestoration: 0,
    unlockedGups: ["gup-a", "gup-b", "gup-c"],
    gupUpgrades: {
      "gup-a": { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 },
      "gup-b": { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 },
      "gup-c": { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 },
      "gup-d": { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 },
      "gup-e": { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 }
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
          totalStars: parsed.totalStars ?? 120,
          completedMissions: parsed.completedMissions || {},
          collectedBadges: parsed.collectedBadges || [],
          unlockedGups: parsed.unlockedGups || ["gup-a", "gup-b", "gup-c"],
          gupUpgrades: {
            ...this.userStats.gupUpgrades,
            ...(parsed.gupUpgrades || {})
          }
        };
      }
    } catch {
      // Fallback
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
    const restoEl = document.getElementById("ocean-rescue-stat-resto");

    if (starsEl) {
      starsEl.textContent = `${this.userStats.totalStars} ⭐️`;
    }
    if (badgesEl) {
      badgesEl.textContent = `${this.userStats.collectedBadges.length} / ${MISSIONS.length}`;
    }
    if (restoEl) {
      restoEl.textContent = `${this.userStats.ecosystemRestoration}%`;
    }
  }

  private bindUI() {
    // Navigation bar buttons
    document.getElementById("btn-nav-missions")?.addEventListener("click", () => {
      Audio.playBubble();
      this.renderMissionSelect();
      this.setPhase(GamePhase.MISSION_SELECT);
    });

    document.getElementById("btn-nav-garage")?.addEventListener("click", () => {
      Audio.playBubble();
      this.renderGarage();
      this.setPhase(GamePhase.GUP_GARAGE);
    });

    document.getElementById("btn-nav-logbook")?.addEventListener("click", () => {
      Audio.playBubble();
      this.renderLogbook();
      this.setPhase(GamePhase.LOGBOOK);
    });

    document.getElementById("btn-nav-quiz")?.addEventListener("click", () => {
      Audio.playBubble();
      this.startQuiz();
    });

    // Audio & BGM Toggle
    document.getElementById("btn-toggle-bgm")?.addEventListener("click", () => {
      this.isBgmMuted = !this.isBgmMuted;
      Audio.toggleBGM();
      const btn = document.getElementById("btn-toggle-bgm");
      if (btn) {
        btn.textContent = this.isBgmMuted ? "🔇 BGM 꺼짐" : "🎵 BGM 켜짐";
      }
    });

    // Submarine Sonar HUD Button
    document.getElementById("btn-sonar-ping")?.addEventListener("click", () => {
      if (this.travelEngine) {
        this.travelEngine.triggerSonar();
      }
    });
  }

  public setPhase(phase: GamePhase) {
    this.currentPhase = phase;

    // Show/Hide overlays
    const views = [
      "view-mission-select",
      "view-gup-select",
      "view-gup-garage",
      "view-launch",
      "view-travel",
      "view-rescue",
      "view-success",
      "view-logbook",
      "view-quiz"
    ];

    views.forEach((v) => {
      const el = document.getElementById(v);
      if (el) el.classList.add("hidden");
    });

    if (phase === GamePhase.MISSION_SELECT) {
      document.getElementById("view-mission-select")?.classList.remove("hidden");
    } else if (phase === GamePhase.GUP_SELECT) {
      document.getElementById("view-gup-select")?.classList.remove("hidden");
    } else if (phase === GamePhase.GUP_GARAGE) {
      document.getElementById("view-gup-garage")?.classList.remove("hidden");
    } else if (phase === GamePhase.LAUNCH) {
      document.getElementById("view-launch")?.classList.remove("hidden");
    } else if (phase === GamePhase.TRAVEL) {
      document.getElementById("view-travel")?.classList.remove("hidden");
    } else if (phase === GamePhase.RESCUE_ACTIVE || phase === GamePhase.RESCUE_CARE) {
      document.getElementById("view-rescue")?.classList.remove("hidden");
    } else if (phase === GamePhase.MISSION_SUCCESS) {
      document.getElementById("view-success")?.classList.remove("hidden");
    } else if (phase === GamePhase.LOGBOOK) {
      document.getElementById("view-logbook")?.classList.remove("hidden");
    } else if (phase === GamePhase.ECO_QUIZ) {
      document.getElementById("view-quiz")?.classList.remove("hidden");
    }
  }

  // 1. Mission Select Screen
  private renderMissionSelect() {
    const listEl = document.getElementById("mission-card-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    MISSIONS.forEach((m) => {
      const isCompleted = !!this.userStats.completedMissions[m.id]?.completed;
      const card = document.createElement("div");
      card.className = `p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer ${
        isCompleted
          ? "bg-slate-900/90 border-cyan-500/60 shadow-cyan-500/10"
          : "bg-slate-900/80 border-slate-700/80 hover:border-amber-400/80"
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <span class="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800">
            수심 ${m.depthMeters}m
          </span>
          <span class="text-xs font-semibold ${isCompleted ? "text-emerald-400" : "text-amber-400"}">
            ${isCompleted ? "⭐️ 구조 성공" : `⭐️ +${m.rewardStars} 별`}
          </span>
        </div>
        <div class="flex items-center space-x-4 mb-4">
          <div class="text-5xl p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            ${m.animalIcon}
          </div>
          <div>
            <h3 class="text-xl font-bold text-white mb-1">${m.title}</h3>
            <p class="text-xs text-cyan-200 font-medium">${m.animalName}</p>
          </div>
        </div>
        <p class="text-sm text-slate-300 mb-4 line-clamp-2 leading-relaxed">
          ${m.summary}
        </p>
        <div class="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span class="text-slate-400">함께할 대원: <strong class="text-amber-300">${m.companionAvatar} ${m.companion}</strong></span>
          <button class="px-4 py-2 rounded-xl font-bold transition-all ${
            isCompleted
              ? "bg-cyan-600 hover:bg-cyan-500 text-white"
              : "bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-md shadow-amber-500/20"
          }">
            ${isCompleted ? "다시 출동" : "탐험선 선택"}
          </button>
        </div>
      `;

      card.addEventListener("click", () => {
        Audio.playBubble();
        this.selectedMission = m;
        this.renderGupSelect();
        this.setPhase(GamePhase.GUP_SELECT);
      });

      listEl.appendChild(card);
    });
  }

  // 2. GUP Select Screen
  private renderGupSelect() {
    const titleEl = document.getElementById("gup-select-mission-title");
    if (titleEl) {
      titleEl.textContent = `🎯 ${this.selectedMission.title} - 출동 탐험선 선택`;
    }

    const listEl = document.getElementById("gup-card-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    GUPS.forEach((gup) => {
      const isUnlocked = this.userStats.unlockedGups.includes(gup.id);
      const card = document.createElement("div");
      card.className = `p-6 rounded-2xl border transition-all duration-300 ${
        isUnlocked
          ? "bg-slate-900/80 border-slate-700 hover:border-amber-400 hover:-translate-y-1 cursor-pointer"
          : "bg-slate-950/60 border-slate-800 opacity-60 cursor-not-allowed"
      }`;

      const upgrades = this.userStats.gupUpgrades[gup.id] || { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 };

      card.innerHTML = `
        <div class="flex items-center space-x-4 mb-3">
          <div class="text-5xl p-3 bg-slate-800/80 rounded-2xl border border-slate-700" style="border-color: ${gup.color}">
            ${gup.icon}
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">${gup.name}</h3>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold" style="background-color: ${gup.color}22; color: ${gup.color}">
              ${gup.armorLabel}
            </span>
          </div>
        </div>
        <p class="text-xs text-slate-300 mb-4">${gup.description}</p>
        <div class="space-y-1.5 text-xs text-slate-400 mb-4 bg-slate-950/40 p-3 rounded-xl">
          <div class="flex justify-between">
            <span>속도 레벨:</span>
            <strong class="text-amber-300">Lv.${upgrades.speedLevel}</strong>
          </div>
          <div class="flex justify-between">
            <span>실드 레벨:</span>
            <strong class="text-cyan-300">Lv.${upgrades.shieldLevel}</strong>
          </div>
          <div class="flex justify-between">
            <span>특수 능력:</span>
            <strong class="text-emerald-300">${gup.specialAbility}</strong>
          </div>
        </div>
        <button class="w-full py-2.5 rounded-xl font-bold transition-all ${
          isUnlocked
            ? "bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold shadow-md shadow-amber-500/20"
            : "bg-slate-800 text-slate-500"
        }">
          ${isUnlocked ? "탐험선 탑승 & 출동 준비" : gup.unlockRequirement || "잠김"}
        </button>
      `;

      if (isUnlocked) {
        card.addEventListener("click", () => {
          Audio.playBubble();
          this.selectedGup = gup;
          this.startLaunchCinematic();
        });
      }

      listEl.appendChild(card);
    });
  }

  // 3. GUP Garage & Upgrades
  private renderGarage() {
    const listEl = document.getElementById("garage-gup-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    GUPS.forEach((gup) => {
      const isUnlocked = this.userStats.unlockedGups.includes(gup.id);
      const card = document.createElement("div");
      card.className = "bg-slate-900/80 border border-slate-700/80 p-6 rounded-2xl shadow-xl";

      const upgrades = this.userStats.gupUpgrades[gup.id] || { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 };
      const upgradeCost = 40;

      card.innerHTML = `
        <div class="flex items-center space-x-4 mb-4">
          <div class="text-5xl p-3 bg-slate-800/80 rounded-2xl border" style="border-color: ${gup.color}">
            ${gup.icon}
          </div>
          <div>
            <h3 class="text-xl font-bold text-white">${gup.name}</h3>
            <p class="text-xs text-slate-400">${gup.specialAbility}</p>
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <!-- Speed Upgrade -->
          <div class="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl">
            <div>
              <div class="text-sm font-bold text-slate-200">🚀 터보 엔진 추진력</div>
              <div class="text-xs text-slate-400">레벨 ${upgrades.speedLevel} / 5</div>
            </div>
            <button id="upgrade-speed-${gup.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold ${
              upgrades.speedLevel >= 5
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : this.userStats.totalStars >= upgradeCost
                ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                : "bg-slate-800 text-slate-400"
            }">
              ${upgrades.speedLevel >= 5 ? "최고 레벨" : `강화 (⭐️ ${upgradeCost})`}
            </button>
          </div>

          <!-- Shield Upgrade -->
          <div class="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl">
            <div>
              <div class="text-sm font-bold text-slate-200">🛡️ 에너지 실드 장갑</div>
              <div class="text-xs text-slate-400">레벨 ${upgrades.shieldLevel} / 5</div>
            </div>
            <button id="upgrade-shield-${gup.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold ${
              upgrades.shieldLevel >= 5
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : this.userStats.totalStars >= upgradeCost
                ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                : "bg-slate-800 text-slate-400"
            }">
              ${upgrades.shieldLevel >= 5 ? "최고 레벨" : `강화 (⭐️ ${upgradeCost})`}
            </button>
          </div>

          <!-- Sonar Upgrade -->
          <div class="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl">
            <div>
              <div class="text-sm font-bold text-slate-200">📡 광역 소나 탐지기</div>
              <div class="text-xs text-slate-400">레벨 ${upgrades.sonarLevel} / 5</div>
            </div>
            <button id="upgrade-sonar-${gup.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold ${
              upgrades.sonarLevel >= 5
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : this.userStats.totalStars >= upgradeCost
                ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950"
                : "bg-slate-800 text-slate-400"
            }">
              ${upgrades.sonarLevel >= 5 ? "최고 레벨" : `강화 (⭐️ ${upgradeCost})`}
            </button>
          </div>
        </div>
      `;

      listEl.appendChild(card);

      // Bind upgrade actions
      setTimeout(() => {
        document.getElementById(`upgrade-speed-${gup.id}`)?.addEventListener("click", () => {
          if (upgrades.speedLevel < 5 && this.userStats.totalStars >= upgradeCost) {
            this.userStats.totalStars -= upgradeCost;
            upgrades.speedLevel++;
            this.userStats.gupUpgrades[gup.id] = upgrades;
            Audio.playBoost();
            this.saveStats();
            this.renderGarage();
          }
        });

        document.getElementById(`upgrade-shield-${gup.id}`)?.addEventListener("click", () => {
          if (upgrades.shieldLevel < 5 && this.userStats.totalStars >= upgradeCost) {
            this.userStats.totalStars -= upgradeCost;
            upgrades.shieldLevel++;
            this.userStats.gupUpgrades[gup.id] = upgrades;
            Audio.playBoost();
            this.saveStats();
            this.renderGarage();
          }
        });

        document.getElementById(`upgrade-sonar-${gup.id}`)?.addEventListener("click", () => {
          if (upgrades.sonarLevel < 5 && this.userStats.totalStars >= upgradeCost) {
            this.userStats.totalStars -= upgradeCost;
            upgrades.sonarLevel++;
            this.userStats.gupUpgrades[gup.id] = upgrades;
            Audio.playSonarPing();
            this.saveStats();
            this.renderGarage();
          }
        });
      }, 0);
    });
  }

  // 4. Launch Cinematic
  private startLaunchCinematic() {
    this.setPhase(GamePhase.LAUNCH);
    Audio.playOctoAlert();
    Audio.speak(`${this.selectedMission.companion} 대원! ${this.selectedGup.name} 출동 준비 완료!`);

    const companionAvatarEl = document.getElementById("launch-companion-avatar");
    const companionNameEl = document.getElementById("launch-companion-name");
    const briefingTextEl = document.getElementById("launch-briefing-text");
    const countdownEl = document.getElementById("launch-countdown");

    if (companionAvatarEl) companionAvatarEl.textContent = this.selectedMission.companionAvatar;
    if (companionNameEl) companionNameEl.textContent = this.selectedMission.companion;
    if (briefingTextEl) briefingTextEl.textContent = this.selectedMission.briefing;

    let count = 3;
    if (countdownEl) countdownEl.textContent = `${count}`;

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        if (countdownEl) countdownEl.textContent = `${count}`;
        Audio.playBubble();
      } else {
        clearInterval(timer);
        if (countdownEl) countdownEl.textContent = "출동 (LAUNCH)!";
        Audio.playBoost();
        setTimeout(() => {
          this.startTravel();
        }, 800);
      }
    }, 1000);
  }

  // 5. Travel Phase
  private startTravel() {
    this.setPhase(GamePhase.TRAVEL);
    if (this.travelEngine) {
      this.travelEngine.stop();
    }

    const upgrades = this.userStats.gupUpgrades[this.selectedGup.id] || { speedLevel: 1, shieldLevel: 1, sonarLevel: 1, lightLevel: 1 };

    this.travelEngine = new TravelEngine(
      this.canvas,
      this.selectedMission,
      this.selectedGup,
      upgrades,
      () => {
        // On Arrival at target coordinate
        this.startRescue();
      },
      (starsGained) => {
        this.userStats.totalStars += starsGained;
        this.saveStats();
      }
    );

    this.travelEngine.start();
  }

  // 6. Rescue Phase
  private startRescue() {
    if (this.travelEngine) {
      this.travelEngine.stop();
      this.travelEngine = null;
    }

    this.setPhase(GamePhase.RESCUE_ACTIVE);
    Audio.speak(`${this.selectedMission.animalName}을(를) 발견했습니다! ${this.selectedMission.tutorial}`);

    if (this.rescueEngine) {
      this.rescueEngine.stop();
    }

    this.rescueEngine = new RescueEngine(
      this.canvas,
      this.selectedMission,
      this.selectedGup,
      (step) => {
        // Step done
      },
      () => {
        // All rescued!
        this.completeMissionSuccess();
      }
    );

    this.rescueEngine.start();
  }

  // 7. Mission Success & Rewards
  private completeMissionSuccess() {
    if (this.rescueEngine) {
      this.rescueEngine.stop();
      this.rescueEngine = null;
    }

    this.setPhase(GamePhase.MISSION_SUCCESS);
    Audio.playCelebration();

    // Grant stars and badge
    this.userStats.totalStars += this.selectedMission.rewardStars;
    if (!this.userStats.collectedBadges.includes(this.selectedMission.badge)) {
      this.userStats.collectedBadges.push(this.selectedMission.badge);
    }
    this.userStats.totalRescuedAnimals++;
    this.userStats.ecosystemRestoration = Math.min(100, Math.round((this.userStats.collectedBadges.length / MISSIONS.length) * 100));

    // Unlock special GUPs
    if (this.userStats.collectedBadges.length >= 2 && !this.userStats.unlockedGups.includes("gup-d")) {
      this.userStats.unlockedGups.push("gup-d");
    }
    if (this.userStats.collectedBadges.length >= 3 && !this.userStats.unlockedGups.includes("gup-e")) {
      this.userStats.unlockedGups.push("gup-e");
    }

    const prevRecord = this.userStats.completedMissions[this.selectedMission.id];
    this.userStats.completedMissions[this.selectedMission.id] = {
      completed: true,
      rescuedCount: (prevRecord?.rescuedCount || 0) + 1,
      firstRescuedAt: prevRecord?.firstRescuedAt || new Date().toLocaleDateString(),
      bestStarsEarned: this.selectedMission.rewardStars,
      readinessAchieved: 1.0
    };

    this.saveStats();

    // Populate Success UI
    const animalIconEl = document.getElementById("success-animal-icon");
    const animalNameEl = document.getElementById("success-animal-name");
    const factEl = document.getElementById("success-ecology-fact");
    const badgeNameEl = document.getElementById("success-badge-name");
    const starsEarnedEl = document.getElementById("success-stars-earned");

    if (animalIconEl) animalIconEl.textContent = this.selectedMission.animalIcon;
    if (animalNameEl) animalNameEl.textContent = this.selectedMission.animalName;
    if (factEl) factEl.textContent = this.selectedMission.ecologyFact;
    if (badgeNameEl) badgeNameEl.textContent = `🎖️ ${this.selectedMission.badge}`;
    if (starsEarnedEl) starsEarnedEl.textContent = `+${this.selectedMission.rewardStars} ⭐️`;

    const btnContinue = document.getElementById("btn-success-continue");
    if (btnContinue) {
      btnContinue.onclick = () => {
        Audio.playBubble();
        this.renderMissionSelect();
        this.setPhase(GamePhase.MISSION_SELECT);
      };
    }

    const btnQuiz = document.getElementById("btn-success-quiz");
    if (btnQuiz) {
      btnQuiz.onclick = () => {
        Audio.playBubble();
        this.startQuiz();
      };
    }
  }

  // 8. Eco Quiz Challenge
  private startQuiz() {
    this.quizQuestions = [...ECO_QUIZ_QUESTIONS];
    this.currentQuizIndex = 0;
    this.quizCorrectCount = 0;
    this.renderQuizQuestion();
    this.setPhase(GamePhase.ECO_QUIZ);
  }

  private renderQuizQuestion() {
    if (this.currentQuizIndex >= this.quizQuestions.length) {
      this.finishQuiz();
      return;
    }

    const q = this.quizQuestions[this.currentQuizIndex];
    const qIndexEl = document.getElementById("quiz-step-index");
    const animalIconEl = document.getElementById("quiz-animal-icon");
    const questionTextEl = document.getElementById("quiz-question-text");
    const optionsContainerEl = document.getElementById("quiz-options-container");
    const explanationEl = document.getElementById("quiz-explanation-box");

    if (qIndexEl) qIndexEl.textContent = `문제 ${this.currentQuizIndex + 1} / ${this.quizQuestions.length}`;
    if (animalIconEl) animalIconEl.textContent = q.animalIcon;
    if (questionTextEl) questionTextEl.textContent = q.question;
    if (explanationEl) explanationEl.classList.add("hidden");

    if (!optionsContainerEl) return;
    optionsContainerEl.innerHTML = "";

    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "w-full text-left p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all";
      btn.innerHTML = `<span class="inline-block w-6 h-6 rounded-full bg-slate-800 text-center leading-6 text-xs text-amber-400 mr-2">${idx + 1}</span> ${opt}`;

      btn.addEventListener("click", () => {
        // Disable all buttons
        const allBtns = optionsContainerEl.querySelectorAll("button");
        allBtns.forEach((b) => ((b as HTMLButtonElement).disabled = true));

        if (idx === q.correctIndex) {
          btn.className = "w-full text-left p-4 rounded-xl bg-emerald-900/80 border border-emerald-500 text-emerald-200 font-bold text-sm";
          Audio.playSuccess();
          this.quizCorrectCount++;
          this.userStats.totalStars += q.rewardStars;
          this.saveStats();
        } else {
          btn.className = "w-full text-left p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 font-bold text-sm";
          Audio.playWrong();
          const correctBtn = allBtns[q.correctIndex];
          if (correctBtn) {
            correctBtn.className = "w-full text-left p-4 rounded-xl bg-emerald-900/80 border border-emerald-500 text-emerald-200 font-bold text-sm";
          }
        }

        // Show explanation
        if (explanationEl) {
          explanationEl.textContent = `💡 해설: ${q.explanation}`;
          explanationEl.classList.remove("hidden");
        }

        setTimeout(() => {
          this.currentQuizIndex++;
          this.renderQuizQuestion();
        }, 2200);
      });

      optionsContainerEl.appendChild(btn);
    });
  }

  private finishQuiz() {
    Audio.playCelebration();
    const listEl = document.getElementById("quiz-options-container");
    const questionTextEl = document.getElementById("quiz-question-text");
    const qIndexEl = document.getElementById("quiz-step-index");
    const explanationEl = document.getElementById("quiz-explanation-box");

    if (qIndexEl) qIndexEl.textContent = "🏆 퀴즈 챌린지 완료!";
    if (questionTextEl) questionTextEl.textContent = `총 ${this.quizQuestions.length}문제 중 ${this.quizCorrectCount}문제를 맞혔습니다!`;
    if (explanationEl) explanationEl.classList.add("hidden");

    if (listEl) {
      listEl.innerHTML = `
        <div class="text-center py-6">
          <div class="text-6xl mb-4">🏅</div>
          <h4 class="text-xl font-bold text-amber-300 mb-2">옥토 해양 생태 박사 인증 완료!</h4>
          <p class="text-sm text-slate-300 mb-6">퀴즈 보상으로 별 ⭐️을 획득하였습니다. 탐험선 업그레이드에 사용하세요!</p>
          <button id="btn-quiz-done" class="px-6 py-3 rounded-xl font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950">
            미션 본부로 돌아가기
          </button>
        </div>
      `;
      document.getElementById("btn-quiz-done")?.addEventListener("click", () => {
        Audio.playBubble();
        this.renderMissionSelect();
        this.setPhase(GamePhase.MISSION_SELECT);
      });
    }
  }

  // 9. Logbook Screen
  private renderLogbook() {
    const badgeContainer = document.getElementById("logbook-badge-container");
    const animalCountEl = document.getElementById("logbook-total-animals");
    const restorationBarEl = document.getElementById("logbook-restoration-bar");
    const restorationTextEl = document.getElementById("logbook-restoration-text");

    if (animalCountEl) animalCountEl.textContent = `${this.userStats.totalRescuedAnimals}마리`;
    if (restorationTextEl) restorationTextEl.textContent = `${this.userStats.ecosystemRestoration}%`;
    if (restorationBarEl) restorationBarEl.style.width = `${this.userStats.ecosystemRestoration}%`;

    if (!badgeContainer) return;
    badgeContainer.innerHTML = "";

    MISSIONS.forEach((m) => {
      const hasBadge = this.userStats.collectedBadges.includes(m.badge);
      const badgeBox = document.createElement("div");
      badgeBox.className = `p-4 rounded-xl border text-center transition-all ${
        hasBadge
          ? "bg-slate-900/90 border-amber-400/80 shadow-lg shadow-amber-500/10"
          : "bg-slate-950/40 border-slate-800 opacity-50"
      }`;

      badgeBox.innerHTML = `
        <div class="text-4xl mb-2">${hasBadge ? "🎖️" : "🔒"}</div>
        <h4 class="text-sm font-bold text-white mb-1">${m.badge}</h4>
        <p class="text-xs text-slate-400">${hasBadge ? `${m.animalName} 구조 완료` : "미션 미완료"}</p>
      `;

      badgeContainer.appendChild(badgeBox);
    });
  }
}
