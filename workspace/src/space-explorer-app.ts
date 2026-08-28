import { PLANETS_DATA, SUN_DATA, MOON_DATA } from "./space-data";
import { CelestialBodyData } from "./space-types";
import { SpaceSimulationEngine } from "./space-simulation";
import { SpaceRenderer, ScreenLabelPosition } from "./space-renderer";
import { SpaceAudioEngine } from "./space-audio";

export class SpaceExplorerApp {
  private canvas!: HTMLCanvasElement;
  private renderer!: SpaceRenderer;
  private simEngine!: SpaceSimulationEngine;
  private audioEngine!: SpaceAudioEngine;

  private lastTime = 0;
  private isRunning = true;
  private currentFocusedId: string | null = null;

  // DOM Elements
  private elDateDisplay!: HTMLElement;
  private elSpeedLabel!: HTMLElement;
  private elReturnBtn!: HTMLElement;
  private elDetailCard!: HTMLElement;
  private elLabelsContainer!: HTMLElement;
  private elPlanetRibbon!: HTMLElement;
  private elTimeControls!: HTMLElement;
  private elSoundToggleBtn!: HTMLElement;
  private elHelpModal!: HTMLElement;
  private labelBadgesMap: Map<string, HTMLDivElement> = new Map();

  public boot() {
    this.canvas = document.getElementById("space-explorer-canvas") as HTMLCanvasElement;
    if (!this.canvas) {
      console.error("Canvas element not found!");
      return;
    }

    this.simEngine = new SpaceSimulationEngine();
    this.audioEngine = new SpaceAudioEngine();
    this.renderer = new SpaceRenderer(this.canvas);

    this.initDOMElements();
    this.bindRendererCallbacks();
    this.bindUIEvents();
    this.renderPlanetRibbon();
    this.updateTimeUI();

    // Start render loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      this.renderer.handleResize();
    });
    if (this.canvas.parentElement) {
      resizeObserver.observe(this.canvas.parentElement);
    }
    window.addEventListener("resize", () => this.renderer.handleResize());

    // Page visibility handling to save battery/performance when tab is inactive
    document.addEventListener("visibilitychange", () => {
      this.isRunning = !document.hidden;
      if (this.isRunning) {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
      }
    });

    console.log("🚀 AidenGame Space Explorer 3D initialized successfully.");
  }

  private initDOMElements() {
    this.elDateDisplay = document.getElementById("space-date-display")!;
    this.elSpeedLabel = document.getElementById("space-speed-badge")!;
    this.elReturnBtn = document.getElementById("btn-return-overview")!;
    this.elDetailCard = document.getElementById("planet-detail-card")!;
    this.elLabelsContainer = document.getElementById("screen-labels-layer")!;
    this.elPlanetRibbon = document.getElementById("planet-nav-ribbon")!;
    this.elTimeControls = document.getElementById("time-controls-bar")!;
    this.elSoundToggleBtn = document.getElementById("btn-toggle-sound")!;
    this.elHelpModal = document.getElementById("space-help-modal")!;
  }

  private bindRendererCallbacks() {
    this.renderer.onPlanetSelected = (id: string | null) => {
      this.currentFocusedId = id;
      this.updateDetailCard(id);
      this.updateRibbonActiveState(id);
      this.updateReturnButtonVisibility(id);
      if (id) {
        this.audioEngine.playFlyTransition();
      } else {
        this.audioEngine.playReturnChime();
      }
    };

    this.renderer.onSelectSoundRequested = () => {
      this.audioEngine.playSelectChime();
    };
  }

  private bindUIEvents() {
    // 1. First user interaction unlocks AudioContext
    const unlockAudio = () => {
      this.audioEngine.init();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    // 2. Sound Toggle
    this.elSoundToggleBtn.addEventListener("click", () => {
      this.audioEngine.init();
      const currentMuted = this.audioEngine.getMuted();
      this.audioEngine.setMuted(!currentMuted);
      this.elSoundToggleBtn.innerHTML = !currentMuted ? "<span>🔇</span> <span class='hidden sm:inline'>음소거</span>" : "<span>🔊</span> <span class='hidden sm:inline'>사운드 켜짐</span>";
      this.audioEngine.playClick();
    });

    // 2.5 Orbit Lines Toggle
    const btnToggleOrbits = document.getElementById("btn-toggle-orbits");
    btnToggleOrbits?.addEventListener("click", () => {
      this.audioEngine.init();
      const isVisible = this.renderer.toggleOrbits();
      btnToggleOrbits.innerHTML = isVisible
        ? "<span>🪐</span> <span class='hidden sm:inline'>궤도선 켜짐</span>"
        : "<span>⭕</span> <span class='hidden sm:inline'>궤도선 숨김</span>";
      if (!isVisible) {
        btnToggleOrbits.className = "px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-400 transition-all hover:scale-105 active:scale-95 flex items-center gap-1";
      } else {
        btnToggleOrbits.className = "px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-1";
      }
      this.audioEngine.playClick();
    });

    // 3. Return to Overview Button
    this.elReturnBtn.addEventListener("click", () => {
      this.audioEngine.init();
      this.renderer.focusOnBody(null);
      this.audioEngine.playClick();
    });

    // 4. Time Controls
    const btnPause = document.getElementById("btn-time-pause")!;
    const btnPlayRealtime = document.getElementById("btn-time-realtime")!;
    const btnSpeed1 = document.getElementById("btn-speed-1d")!;
    const btnSpeed7 = document.getElementById("btn-speed-7d")!;
    const btnSpeed30 = document.getElementById("btn-speed-30d")!;
    const btnSpeed365 = document.getElementById("btn-speed-365d")!;
    const btnPrev10 = document.getElementById("btn-time-prev10")!;
    const btnNext10 = document.getElementById("btn-time-next10")!;

    btnPause?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.isPaused = !this.simEngine.isPaused;
      this.updateTimeUI();
      this.audioEngine.playClick();
    });

    btnPlayRealtime?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.isPaused = false;
      this.simEngine.timeSpeedDaysPerSec = 0.00001157; // 1 second = 1 second
      this.updateTimeUI();
      this.audioEngine.playClick();
    });

    btnSpeed1?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.isPaused = false;
      this.simEngine.timeSpeedDaysPerSec = 1;
      this.updateTimeUI();
      this.audioEngine.playClick();
    });

    btnSpeed7?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.isPaused = false;
      this.simEngine.timeSpeedDaysPerSec = 7;
      this.updateTimeUI();
      this.audioEngine.playClick();
    });

    btnSpeed30?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.isPaused = false;
      this.simEngine.timeSpeedDaysPerSec = 30;
      this.updateTimeUI();
      this.audioEngine.playClick();
    });

    btnSpeed365?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.isPaused = false;
      this.simEngine.timeSpeedDaysPerSec = 365;
      this.updateTimeUI();
      this.audioEngine.playClick();
    });

    btnPrev10?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.addDays(-10);
      this.audioEngine.playClick();
    });

    btnNext10?.addEventListener("click", () => {
      this.audioEngine.init();
      this.simEngine.addDays(10);
      this.audioEngine.playClick();
    });

    // 5. Help modal toggle
    const btnHelp = document.getElementById("btn-open-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    btnHelp?.addEventListener("click", () => {
      this.audioEngine.init();
      this.elHelpModal.classList.remove("hidden");
      this.audioEngine.playClick();
    });
    btnCloseHelp?.addEventListener("click", () => {
      this.elHelpModal.classList.add("hidden");
    });
  }

  private renderPlanetRibbon() {
    this.elPlanetRibbon.innerHTML = "";

    // 1. Overview Button
    const overviewBtn = document.createElement("button");
    overviewBtn.id = "ribbon-btn-overview";
    overviewBtn.className = "px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 bg-slate-800/90 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950 transition-all hover:scale-105 active:scale-95 shadow-md flex-shrink-0";
    overviewBtn.innerHTML = `<span>🌌</span> <span>전체보기</span>`;
    overviewBtn.addEventListener("click", () => {
      this.audioEngine.init();
      this.renderer.focusOnBody(null);
      this.audioEngine.playClick();
    });
    this.elPlanetRibbon.appendChild(overviewBtn);

    // 2. Sun Button
    const sunBtn = document.createElement("button");
    sunBtn.id = "ribbon-btn-sun";
    sunBtn.className = "px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-amber-950/70 text-amber-200 border border-amber-500/40 hover:bg-amber-900 transition-all hover:scale-105 active:scale-95 shadow-md flex-shrink-0";
    sunBtn.innerHTML = `<span>☀️</span> <span>태양</span>`;
    sunBtn.addEventListener("click", () => {
      this.audioEngine.init();
      this.renderer.focusOnBody("sun");
      this.audioEngine.playSelectChime();
    });
    this.elPlanetRibbon.appendChild(sunBtn);

    // 3. 8 Planets
    for (const planet of PLANETS_DATA) {
      const btn = document.createElement("button");
      btn.id = `ribbon-btn-${planet.id}`;
      btn.className = "px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-slate-900/80 text-slate-200 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-md flex-shrink-0";
      btn.innerHTML = `<span>${planet.icon}</span> <span>${planet.nameKo}</span>`;
      btn.addEventListener("click", () => {
        this.audioEngine.init();
        this.renderer.focusOnBody(planet.id);
        this.audioEngine.playSelectChime();
      });
      this.elPlanetRibbon.appendChild(btn);
    }
  }

  private updateRibbonActiveState(focusedId: string | null) {
    const allButtons = this.elPlanetRibbon.querySelectorAll("button");
    allButtons.forEach((btn) => {
      btn.classList.remove("ring-2", "ring-cyan-400", "bg-cyan-600/30", "scale-105");
    });

    if (!focusedId) {
      const ov = document.getElementById("ribbon-btn-overview");
      ov?.classList.add("ring-2", "ring-cyan-400", "bg-cyan-600/30");
    } else {
      const activeBtn = document.getElementById(`ribbon-btn-${focusedId}`);
      activeBtn?.classList.add("ring-2", "ring-cyan-400", "bg-cyan-600/30", "scale-105");
    }
  }

  private updateReturnButtonVisibility(focusedId: string | null) {
    if (focusedId) {
      this.elReturnBtn.classList.remove("hidden");
    } else {
      this.elReturnBtn.classList.add("hidden");
    }
  }

  private updateDetailCard(id: string | null) {
    if (!id) {
      this.elDetailCard.classList.add("hidden");
      return;
    }

    this.elDetailCard.classList.remove("hidden");

    let data: CelestialBodyData | typeof SUN_DATA | typeof MOON_DATA;
    if (id === "sun") {
      data = SUN_DATA;
    } else if (id === "moon") {
      data = MOON_DATA as unknown as CelestialBodyData;
    } else {
      data = PLANETS_DATA.find((p) => p.id === id) || PLANETS_DATA[0];
    }

    const titleEl = document.getElementById("card-planet-title")!;
    const categoryEl = document.getElementById("card-planet-category")!;
    const comparisonEl = document.getElementById("card-planet-comparison")!;
    const overviewEl = document.getElementById("card-planet-overview")!;
    const statsContainerEl = document.getElementById("card-planet-stats")!;
    const factsListEl = document.getElementById("card-planet-facts")!;
    const extraActionsEl = document.getElementById("card-planet-extra-actions")!;

    titleEl.innerHTML = `<span class="text-3xl">${data.icon}</span> <span>${data.nameKo}</span> <span class="text-xs text-cyan-300 font-normal ml-2">${data.nameEn}</span>`;
    categoryEl.innerText = data.categoryKo;
    comparisonEl.innerText = data.shortComparisonKo;
    overviewEl.innerText = data.overviewFactKo;

    // Stats Grid
    statsContainerEl.innerHTML = `
      <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div class="text-[11px] text-slate-400">☀️ 위치 / 순서</div>
        <div class="text-xs sm:text-sm font-bold text-amber-300">${(data as any).stats.orderFromSun || (data as any).stats.orbitTarget}</div>
      </div>
      <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div class="text-[11px] text-slate-400">🔄 1년 (공전 주기)</div>
        <div class="text-xs sm:text-sm font-bold text-cyan-300">${data.stats.orbitTime}</div>
      </div>
      <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div class="text-[11px] text-slate-400">⏱️ 하루 (자전 주기)</div>
        <div class="text-xs sm:text-sm font-bold text-emerald-300">${data.stats.dayLength}</div>
      </div>
      <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div class="text-[11px] text-slate-400">🌡️ 평균 기온</div>
        <div class="text-xs sm:text-sm font-bold text-rose-300">${data.stats.temperature}</div>
      </div>
    `;

    // Fun facts
    factsListEl.innerHTML = "";
    for (const fact of data.factsKo) {
      const li = document.createElement("li");
      li.className = "flex items-start gap-2 text-xs sm:text-sm text-slate-200";
      li.innerHTML = `<span class="text-amber-400 text-base">✦</span><span>${fact}</span>`;
      factsListEl.appendChild(li);
    }

    // Extra Actions (e.g. Inspect Moon for Earth, Inspect Rings for Saturn)
    extraActionsEl.innerHTML = "";
    if (id === "earth") {
      const btnMoon = document.createElement("button");
      btnMoon.className = "w-full py-2 px-3 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/50 rounded-xl text-xs sm:text-sm font-bold text-indigo-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm";
      btnMoon.innerHTML = "<span>🌕</span> <span>달(Moon) 궤도 집중 관찰하기</span>";
      btnMoon.addEventListener("click", () => {
        this.audioEngine.init();
        this.renderer.focusOnBody("moon");
        this.audioEngine.playSelectChime();
      });
      extraActionsEl.appendChild(btnMoon);
    } else if (id === "saturn") {
      const btnRings = document.createElement("button");
      btnRings.className = "w-full py-2 px-3 bg-amber-900/80 hover:bg-amber-800 border border-amber-500/50 rounded-xl text-xs sm:text-sm font-bold text-amber-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm";
      btnRings.innerHTML = "<span>🪐</span> <span>토성 얼음 고리(Rings) 자세히 보기</span>";
      btnRings.addEventListener("click", () => {
        this.audioEngine.init();
        this.renderer.focusOnBody("saturn", "rings");
        this.audioEngine.playSelectChime();
      });
      extraActionsEl.appendChild(btnRings);
    } else if (id === "moon") {
      const btnBackEarth = document.createElement("button");
      btnBackEarth.className = "w-full py-2 px-3 bg-blue-900/80 hover:bg-blue-800 border border-blue-500/50 rounded-xl text-xs sm:text-sm font-bold text-blue-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm";
      btnBackEarth.innerHTML = "<span>🌍</span> <span>지구로 돌아가기</span>";
      btnBackEarth.addEventListener("click", () => {
        this.audioEngine.init();
        this.renderer.focusOnBody("earth");
        this.audioEngine.playSelectChime();
      });
      extraActionsEl.appendChild(btnBackEarth);
    }
  }

  private updateTimeUI() {
    const isPaused = this.simEngine.isPaused;
    const speed = this.simEngine.timeSpeedDaysPerSec;

    const btnPause = document.getElementById("btn-time-pause");
    if (btnPause) {
      btnPause.innerHTML = isPaused ? "▶️ 재생" : "⏸️ 일시정지";
      btnPause.className = isPaused
        ? "px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95"
        : "px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all active:scale-95";
    }

    if (isPaused) {
      this.elSpeedLabel.innerText = "⏸️ 일시정지 중";
      this.elSpeedLabel.className = "text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/40";
    } else if (speed < 0.01) {
      this.elSpeedLabel.innerText = "⏱️ 실시간 (1x)";
      this.elSpeedLabel.className = "text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/40";
    } else {
      this.elSpeedLabel.innerText = `🚀 ${speed}일 / 초`;
      this.elSpeedLabel.className = "text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40";
    }

    // Highlight active speed button
    const speedButtons = [
      { id: "btn-time-realtime", active: !isPaused && speed < 0.01 },
      { id: "btn-speed-1d", active: !isPaused && speed === 1 },
      { id: "btn-speed-7d", active: !isPaused && speed === 7 },
      { id: "btn-speed-30d", active: !isPaused && speed === 30 },
      { id: "btn-speed-365d", active: !isPaused && speed === 365 }
    ];

    for (const item of speedButtons) {
      const el = document.getElementById(item.id);
      if (el) {
        if (item.active) {
          el.classList.add("bg-cyan-500", "text-slate-950", "font-black");
          el.classList.remove("bg-slate-800", "text-slate-200");
        } else {
          el.classList.remove("bg-cyan-500", "text-slate-950", "font-black");
          el.classList.add("bg-slate-800", "text-slate-200");
        }
      }
    }
  }

  private updateScreenLabels(labelPositions: ScreenLabelPosition[]) {
    const activeIds = new Set<string>();

    for (const label of labelPositions) {
      if (!label.visible) continue;
      activeIds.add(label.id);

      let badge = this.labelBadgesMap.get(label.id);
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "absolute pointer-events-auto cursor-pointer select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black shadow-lg backdrop-blur-md border transition-transform duration-75";
        badge.innerHTML = `<span>${label.icon}</span> <span>${label.nameKo}</span>`;
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          this.audioEngine.init();
          this.renderer.focusOnBody(label.id);
          this.audioEngine.playSelectChime();
        });
        this.elLabelsContainer.appendChild(badge);
        this.labelBadgesMap.set(label.id, badge);
      }

      badge.style.display = "flex";
      badge.style.transform = `translate3d(${label.screenX}px, ${label.screenY - 24}px, 0) translate(-50%, -100%)`;

      if (label.isFocused) {
        badge.className = "absolute pointer-events-auto cursor-pointer select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black shadow-lg backdrop-blur-md border transition-transform duration-75 bg-amber-500/90 text-slate-950 border-amber-300 scale-110 ring-2 ring-amber-300/80";
      } else {
        badge.className = "absolute pointer-events-auto cursor-pointer select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black shadow-lg backdrop-blur-md border transition-transform duration-75 bg-slate-900/85 text-cyan-200 border-cyan-500/40 hover:bg-cyan-900/90 hover:scale-110";
      }
    }

    // Hide any labels not currently visible
    for (const [id, badge] of this.labelBadgesMap.entries()) {
      if (!activeIds.has(id)) {
        badge.style.display = "none";
      }
    }
  }

  private loop(now: number) {
    if (!this.isRunning) return;

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Simulation step
    this.simEngine.update(delta);

    // 2. Render 3D WebGL Scene & Camera
    this.renderer.update(delta, this.simEngine);

    // 3. Update Date display
    if (this.elDateDisplay) {
      this.elDateDisplay.innerText = this.simEngine.getSimulationDateString();
    }

    // 4. Update 2D Floating Planet Screen Badges
    const screenPositions = this.renderer.getScreenPositions();
    this.updateScreenLabels(screenPositions);

    requestAnimationFrame(this.loop.bind(this));
  }
}
