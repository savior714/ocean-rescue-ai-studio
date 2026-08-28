// Cinematic High-Fidelity Web Audio Synthesizer & Speech Engine for Ocean Rescue

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundVolume: number = 0.7;
  private voiceVolume: number = 0.85;
  private bgmVolume: number = 0.35;
  private isBgmPlaying: boolean = false;
  private isMuted: boolean = false;

  // Master Dynamics & Ambience Nodes
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  // Ambient BGM Nodes
  private bgmGain: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private bgmOscs: OscillatorNode[] = [];
  private bgmIntervalId: number | null = null;
  private chordProgressionIndex: number = 0;

  // Submarine Propulsion Hydro-Engine Nodes
  private engineGain: GainNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineTurbineOsc: OscillatorNode | null = null;
  private engineNoiseNode: AudioNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  constructor() {
    // Lazy initialized on first user gesture
  }

  public init() {
    this.initCtx();
  }

  public prime() {
    this.initCtx();
  }

  private initCtx(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupMasterChain();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private setupMasterChain() {
    if (!this.ctx) return;
    try {
      // Soft-knee limiter / master compressor for warm, cohesive dynamics
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(18, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(4.5, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.008, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio graph fallback
    }
  }

  private getDestination(): AudioNode {
    if (this.masterCompressor) return this.masterCompressor;
    if (this.ctx) return this.ctx.destination;
    throw new Error("No AudioContext");
  }

  public setSoundVolume(val: number) {
    this.soundVolume = Math.max(0, Math.min(1, val / 100));
  }

  public setVoiceVolume(val: number) {
    this.voiceVolume = Math.max(0, Math.min(1, val / 100));
  }

  public setBgmVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val / 100));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume * 0.4, this.ctx.currentTime, 0.2);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.ctx) this.ctx.suspend();
    } else {
      if (this.ctx) this.ctx.resume();
    }
    return this.isMuted;
  }

  // --- Cinematic Ambient Ocean Soundtrack ---
  public startBGM() {
    const ctx = this.initCtx();
    if (!ctx || this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    try {
      this.bgmGain = ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.bgmGain.gain.exponentialRampToValueAtTime(Math.max(0.001, this.bgmVolume * 0.4), ctx.currentTime + 3.0);

      this.bgmFilter = ctx.createBiquadFilter();
      this.bgmFilter.type = "lowpass";
      this.bgmFilter.frequency.setValueAtTime(320, ctx.currentTime);
      this.bgmFilter.Q.setValueAtTime(1.5, ctx.currentTime);

      this.bgmFilter.connect(this.bgmGain);
      this.bgmGain.connect(this.getDestination());

      // Warm, deep oceanic chord progressions (D minor 9 -> Bb maj7 -> G sus2 -> F add9)
      const chordSets = [
        [36.71, 73.42, 146.83, 174.61, 220.0, 261.63], // D1, D2, D3, F3, A3, C4
        [29.14, 58.27, 116.54, 174.61, 233.08, 293.66], // Bb0, Bb1, Bb2, F3, Bb3, D4
        [49.0, 98.0, 146.83, 220.0, 293.66, 392.0], // G1, G2, D3, A3, D4, G4
        [43.65, 87.31, 130.81, 174.61, 261.63, 329.63] // F1, F2, C3, F3, C4, E4
      ];

      this.bgmOscs = [];
      const currentChord = chordSets[0];

      currentChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const oscGain = ctx.createGain();

        osc.type = i < 2 ? "sine" : (i % 2 === 0 ? "triangle" : "sine");
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const panVal = i === 0 ? 0 : (i % 2 === 0 ? -0.45 : 0.45);
        if (panner) panner.pan.setValueAtTime(panVal, ctx.currentTime);

        // Lower frequency foundation gets stronger presence
        const noteVolume = i < 2 ? 0.28 : 0.12;
        oscGain.gain.setValueAtTime(noteVolume, ctx.currentTime);

        osc.connect(oscGain);
        if (panner) {
          oscGain.connect(panner);
          panner.connect(this.bgmFilter!);
        } else {
          oscGain.connect(this.bgmFilter!);
        }

        osc.start();
        this.bgmOscs.push(osc);
      });

      // Subtle slow ocean tide breathing LFO and chord progression morpher
      let phase = 0;
      this.chordProgressionIndex = 0;

      this.bgmIntervalId = window.setInterval(() => {
        if (!this.ctx || !this.bgmFilter || !this.isBgmPlaying) return;
        phase += 0.08;

        // Gentle tidal filter sweep (260Hz - 540Hz)
        const cutoff = 360 + Math.sin(phase) * 140;
        this.bgmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 1.2);

        // Slowly morph chords every ~14 seconds
        if (Math.floor(phase / (Math.PI * 2)) !== this.chordProgressionIndex) {
          this.chordProgressionIndex = Math.floor(phase / (Math.PI * 2));
          const nextChord = chordSets[this.chordProgressionIndex % chordSets.length];
          this.bgmOscs.forEach((osc, idx) => {
            if (nextChord[idx] && this.ctx) {
              osc.frequency.setTargetAtTime(nextChord[idx], this.ctx.currentTime, 3.5);
            }
          });
        }
      }, 400);
    } catch {
      // Audio autoplay policy guard
    }
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      window.clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    if (this.bgmGain && this.ctx) {
      try {
        this.bgmGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.5);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      this.bgmOscs.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.bgmOscs = [];
      if (this.bgmGain) {
        try {
          this.bgmGain.disconnect();
        } catch {
          // ignore
        }
        this.bgmGain = null;
      }
    }, 600);
  }

  public toggleBGM(): boolean {
    if (this.isBgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  // --- Submarine Propulsion Hydro-Engine Sound ---
  public startSubEngine() {
    const ctx = this.initCtx();
    if (!ctx || this.engineSubOsc) return;
    try {
      this.engineGain = ctx.createGain();
      this.engineFilter = ctx.createBiquadFilter();

      // Deep sub-bass propulsion fundamental (sine)
      this.engineSubOsc = ctx.createOscillator();
      this.engineSubOsc.type = "sine";
      this.engineSubOsc.frequency.setValueAtTime(38, ctx.currentTime);

      // Low-frequency turbine overtone (triangle)
      this.engineTurbineOsc = ctx.createOscillator();
      this.engineTurbineOsc.type = "triangle";
      this.engineTurbineOsc.frequency.setValueAtTime(76, ctx.currentTime);

      // Hydro-cavitation pink/brown noise texture
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02; // Brown noise approximation
        data[i] = lastOut * 2.8;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(110, ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.engineGain.gain.exponentialRampToValueAtTime(Math.max(0.001, this.soundVolume * 0.22), ctx.currentTime + 0.5);

      this.engineSubOsc.connect(this.engineFilter);
      this.engineTurbineOsc.connect(this.engineFilter);

      noiseSource.connect(noiseGain);
      noiseGain.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.getDestination());

      this.engineSubOsc.start();
      this.engineTurbineOsc.start();
      noiseSource.start();

      this.engineNoiseNode = noiseSource;
    } catch {
      // Audio policy guard
    }
  }

  public setEnginePitch(boosted: boolean) {
    if (!this.ctx || !this.engineSubOsc || !this.engineTurbineOsc || !this.engineFilter) return;
    const targetFreq = boosted ? 56 : 38;
    const turbineFreq = boosted ? 112 : 76;
    const filterFreq = boosted ? 190 : 110;

    this.engineSubOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);
    this.engineTurbineOsc.frequency.setTargetAtTime(turbineFreq, this.ctx.currentTime, 0.15);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.15);
  }

  public stopSubEngine() {
    if (this.engineGain && this.ctx) {
      try {
        this.engineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      if (this.engineSubOsc) {
        try {
          this.engineSubOsc.stop();
          this.engineSubOsc.disconnect();
        } catch {
          // ignore
        }
        this.engineSubOsc = null;
      }
      if (this.engineTurbineOsc) {
        try {
          this.engineTurbineOsc.stop();
          this.engineTurbineOsc.disconnect();
        } catch {
          // ignore
        }
        this.engineTurbineOsc = null;
      }
      if (this.engineNoiseNode) {
        try {
          (this.engineNoiseNode as AudioBufferSourceNode).stop();
          this.engineNoiseNode.disconnect();
        } catch {
          // ignore
        }
        this.engineNoiseNode = null;
      }
      if (this.engineGain) {
        try {
          this.engineGain.disconnect();
        } catch {
          // ignore
        }
        this.engineGain = null;
      }
    }, 250);
  }

  // --- Sophisticated, Cinematic Sound Effects ---

  // 1. Mission Tactical Alert (Deep resonant brass klaxon with warm acoustic presence)
  public playOctoAlert() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dual-tone harmonic marine tactical pulse (2 pulses instead of 4 screechy sirens)
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.55;

      const subOsc = ctx.createOscillator();
      const midOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      subOsc.type = "sine";
      midOsc.type = "triangle";

      // Fundamental and resonant fifth
      subOsc.frequency.setValueAtTime(146.83, t); // D3
      subOsc.frequency.exponentialRampToValueAtTime(220.0, t + 0.25); // A3
      subOsc.frequency.exponentialRampToValueAtTime(146.83, t + 0.48);

      midOsc.frequency.setValueAtTime(220.0, t);
      midOsc.frequency.exponentialRampToValueAtTime(329.63, t + 0.25); // E4
      midOsc.frequency.exponentialRampToValueAtTime(220.0, t + 0.48);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, t);
      filter.frequency.exponentialRampToValueAtTime(1100, t + 0.25);
      filter.frequency.exponentialRampToValueAtTime(500, t + 0.48);
      filter.Q.setValueAtTime(2.5, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(this.soundVolume * 0.38, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);

      subOsc.connect(filter);
      midOsc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestination());

      subOsc.start(t);
      midOsc.start(t);
      subOsc.stop(t + 0.53);
      midOsc.stop(t + 0.53);
    }
  }

  // 2. Hydro-Acoustic Sonar Ping (Authentic naval sonar with rich reverberant tail)
  public playSonarPing() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const subHarmonic = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(960, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.8);

    subHarmonic.type = "sine";
    subHarmonic.frequency.setValueAtTime(480, now);
    subHarmonic.frequency.exponentialRampToValueAtTime(460, now + 0.8);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(6, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.42, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    osc.connect(filter);
    subHarmonic.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    subHarmonic.start(now);
    osc.stop(now + 1.25);
    subHarmonic.stop(now + 1.25);
  }

  public playSonar() {
    this.playSonarPing();
  }

  // 3. Crystalline Glass Marimba / Hydro-Chime (Warm, tactile collectible chime)
  public playStarCollect() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic marimba / chime: D5 -> F#5 -> A5
    const notes = [587.33, 739.99, 880.0];

    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const t = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      harmonic.type = "sine";
      harmonic.frequency.setValueAtTime(freq * 2.76, t); // Metallic/glass overtone

      const oscGain = this.soundVolume * 0.28;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(oscGain, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      harmonic.connect(gain);
      gain.connect(this.getDestination());

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + 0.4);
      harmonic.stop(t + 0.4);
    });
  }

  public playCollect() {
    this.playStarCollect();
  }

  // 4. Hydrodynamic Propulsion Surge (Deep underwater acceleration swell)
  public playBoostRing() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(65, now);
    subOsc.frequency.exponentialRampToValueAtTime(140, now + 0.28);
    subOsc.frequency.exponentialRampToValueAtTime(80, now + 0.5);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.45, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    subOsc.start(now);
    subOsc.stop(now + 0.53);
  }

  public playTurboBoost() {
    this.playBoostRing();
  }

  // 5. Rock Clearing / Heavy Obstacle Fracture (Deep sub-dispersion and acoustic crumble)
  public playRockClear() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.3);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.48, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(gain);
    gain.connect(this.getDestination());

    subOsc.start(now);
    subOsc.stop(now + 0.35);
  }

  // 6. Tactile Hull Deflection / Bump (Muffled deep water impact)
  public playBump() {
    this.playHit();
  }

  public playHit() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.42, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    subOsc.start(now);
    subOsc.stop(now + 0.23);
  }

  // 7. Subtle Correction / Soft Damped Click (No jarring cartoon buzzers)
  public playWrong() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(196.0, now); // G3
    osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.18); // E3

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playGoalBanner() {
    this.playSuccess();
  }

  // 8. Tactile Organic Bubble / Haptic Tap (iOS/macOS-grade subtle interaction click)
  public playClick() {
    this.playBubble();
  }

  public playSelect() {
    this.playBubble();
  }

  public playBubble() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const startFreq = 480 + Math.random() * 120;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.35, now + 0.05);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.22, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 9. Airlock / Sub Hatch Pressure Release
  public playDoorOpen() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.28);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 10. Precision Ultrasonic Hydro-Cutter & Cord Release
  public playCut() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.38, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.15);

    this.playCordSnap(now + 0.02);
  }

  private playCordSnap(startTime: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(380, startTime);
    osc.frequency.exponentialRampToValueAtTime(95, startTime + 0.1);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.32, startTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.11);

    osc.connect(gain);
    gain.connect(this.getDestination());

    osc.start(startTime);
    osc.stop(startTime + 0.12);
  }

  // 11. Magnetic Clamp Grab / Release
  public playGrab() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.35, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playDrop() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.38, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // 12. Modular Bio-Connector / Clamp Lock
  public playConnect() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [440, 554.37, 659.25]; // A4, C#5, E5
    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const t = now + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(this.soundVolume * 0.28, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // 13. Therapeutic Micro-Aerosol Bio-Mist
  public playSpray() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.16;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.28, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    noise.start(now);
    noise.stop(now + 0.16);
  }

  // 14. Gentle Oceanic Nourishment Ripple
  public playMunch() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [329.63, 440.0, 523.25]; // E4, A4, C5
    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const t = now + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(this.soundVolume * 0.22, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start(t);
      osc.stop(t + 0.11);
    });
  }

  // 15. Evocative Humpback Whale Acoustic Song
  public playWhaleCall() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    carrier.type = "sine";
    carrier.frequency.setValueAtTime(220, now);
    carrier.frequency.exponentialRampToValueAtTime(380, now + 0.45);
    carrier.frequency.exponentialRampToValueAtTime(290, now + 1.2);

    modulator.type = "sine";
    modulator.frequency.setValueAtTime(4.8, now); // Gentle natural vibrato
    modGain.gain.setValueAtTime(18, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(550, now);

    modulator.connect(carrier.frequency);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.45, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 1.25);
    carrier.stop(now + 1.25);
  }

  // 16. Telemetry Scanner Pulse
  public playScannerBleep() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.setValueAtTime(1470, now + 0.035);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1600, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.soundVolume * 0.22, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    osc.start(now);
    osc.stop(now + 0.095);
  }

  // 17. Triumphant Oceanic Cadence (Warm, cinematic orchestral chord resolution)
  public playSuccess() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Rich harmonic chord resolution: D add9 (D3, A3, F#4, A4, E5)
    const chordNotes = [146.83, 220.0, 369.99, 440.0, 659.25];

    chordNotes.forEach((freq, idx) => {
      if (!ctx) return;
      const t = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = idx < 2 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, t);

      const noteVolume = idx < 2 ? this.soundVolume * 0.42 : this.soundVolume * 0.28;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(noteVolume, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestination());

      osc.start(t);
      osc.stop(t + 0.78);
    });
  }

  // 18. Natural, Professional Voice Speech Synthesis
  public speak(text: string, options?: { companion?: string }) {
    if (!("speechSynthesis" in window)) return;
    if (this.voiceVolume <= 0.05 || this.isMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = this.voiceVolume;
    utterance.rate = 1.0; // Natural, unhurried professional cadence

    const companion = options?.companion?.toLowerCase() || "";
    if (companion.includes("barnacles") || companion.includes("바나클")) {
      utterance.pitch = 0.92; // Deep, calm commanding officer
    } else if (companion.includes("kwazii") || companion.includes("콰지")) {
      utterance.pitch = 0.98; // Confident explorer
    } else if (companion.includes("peso") || companion.includes("페소")) {
      utterance.pitch = 1.04; // Gentle, composed marine medical officer
    } else if (companion.includes("tweak") || companion.includes("트윅")) {
      utterance.pitch = 1.04; // Focused, articulate engineer
    } else if (companion.includes("dashi") || companion.includes("대시")) {
      utterance.pitch = 1.02; // Clear tactical comms officer
    } else {
      utterance.pitch = 1.0;
    }

    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find(v => v.lang.startsWith("ko") || v.lang.includes("KR"));
    if (koVoice) {
      utterance.voice = koVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  public pauseSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  }

  public resumeSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  }

  public cancelSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  public playLaunch() {
    this.playOctoAlert();
  }

  public playBoost() {
    this.playBoostRing();
  }

  public playCollision() {
    this.playHit();
  }

  public playLaserCut() {
    this.playStarCollect();
  }

  public playHeartbeat() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
    gain.gain.setValueAtTime(this.soundVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCelebration() {
    this.playSuccess();
  }

  public testSoundVolume() {
    this.playStarCollect();
  }

  public testVoiceVolume() {
    this.speak("해양 탐사대 본부, 음성 통신 테스트를 진행합니다.");
  }

  public getSettings() {
    return {
      soundVolume: Math.round(this.soundVolume * 100),
      voiceVolume: Math.round(this.voiceVolume * 100),
      bgmVolume: Math.round(this.bgmVolume * 100),
      isMuted: this.isMuted
    };
  }
}

export const Audio = new SoundEngine();

if (typeof window !== "undefined") {
  (window as unknown as { OceanRescue?: { Audio?: SoundEngine }; Audio?: SoundEngine }).OceanRescue = {
    ...((window as unknown as { OceanRescue?: Record<string, unknown> }).OceanRescue || {}),
    Audio
  };
  (window as unknown as { Audio?: SoundEngine }).Audio = Audio;
}
