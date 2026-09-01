import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle
} from "pixi.js";
import {
  MissionData,
  GupData,
  CurrentStream,
  TravelObstacle,
  BoostRing,
  FishBoid,
  JellyfishEntity
} from "../types";
import { GupActor, GupPresentationState } from "./gup-actor";
import { ProvisionalAssetFactory } from "./provisional-assets";
import { ReadinessSnapshot } from "./readiness";

/**
 * PIXI TRAVEL RENDERER
 *
 * Full-scene PixiJS renderer for Sea Turtle / Sprite Travel Slice 1.
 * Maintains layer hierarchy:
 *   farBackground -> midground -> gameplayWorld -> gupActor -> foreground -> effects -> HUD
 *
 * Implements smooth camera follow, multi-plane parallax depth, and real-time state visualization.
 */

export interface TravelRenderSnapshot {
  readonly subX: number;
  readonly subY: number;
  readonly subPitch: number;
  readonly speedRatio: number;
  readonly isBoosting: boolean;
  readonly inCurrent: boolean;
  readonly collisionWobble: number;
  readonly collisionShakeAngle: number;
  readonly cameraX: number;
  readonly cameraY: number;
  readonly worldLength: number;
  readonly worldHeight: number;
  readonly currentStreams: readonly CurrentStream[];
  readonly boostRings: readonly BoostRing[];
  readonly obstacles: readonly TravelObstacle[];
  readonly fishSchool: readonly FishBoid[];
  readonly jellyfishList: readonly JellyfishEntity[];
  readonly bubbles: ReadonlyArray<{ x: number; y: number; radius: number; alpha: number }>;
  readonly sparks: ReadonlyArray<{ x: number; y: number; color: string; life: number }>;
  readonly readiness: ReadinessSnapshot;
  readonly radioMessage: string;
  readonly radioTimer: number;
  readonly time: number;
}

export class PixiTravelRenderer {
  public app: Application;
  private isInitialized = false;

  // Layer Hierarchy
  private farBackgroundLayer: Container;
  private midgroundLayer: Container;
  private gameplayWorldLayer: Container;
  private foregroundLayer: Container;
  private effectsLayer: Container;
  private hudLayer: Container;

  // Actor
  private gupActor: GupActor;

  // Background graphics
  private bgGraphics: Graphics;
  private causticsGraphics: Graphics;
  private currentStreamsGraphics: Graphics;
  private obstaclesContainer: Container;
  private boostRingsContainer: Container;
  private fishContainer: Container;
  private jellyfishContainer: Container;
  private bubblesContainer: Container;
  private sparksContainer: Container;
  private foregroundKelpGraphics: Graphics;

  // Distant megafauna
  private distantMantaSprite: Sprite;

  // HUD Elements
  private hudTitleText: Text;
  private hudDepthText: Text;
  private hudRadioContainer: Container;
  private hudRadioText: Text;
  private hudRadioAvatarText: Text;
  private hudProgressBar: Graphics;
  private hudProgressGup: Text;
  private hudMilestoneIcons: Text;

  private mission: MissionData;
  private gup: GupData;

  constructor(mission: MissionData, gup: GupData) {
    this.mission = mission;
    this.gup = gup;
    this.app = new Application();

    this.farBackgroundLayer = new Container();
    this.midgroundLayer = new Container();
    this.gameplayWorldLayer = new Container();
    this.foregroundLayer = new Container();
    this.effectsLayer = new Container();
    this.hudLayer = new Container();

    this.bgGraphics = new Graphics();
    this.causticsGraphics = new Graphics();
    this.currentStreamsGraphics = new Graphics();
    this.obstaclesContainer = new Container();
    this.boostRingsContainer = new Container();
    this.fishContainer = new Container();
    this.jellyfishContainer = new Container();
    this.bubblesContainer = new Container();
    this.sparksContainer = new Container();
    this.foregroundKelpGraphics = new Graphics();

    this.distantMantaSprite = new Sprite(ProvisionalAssetFactory.getMantaTexture());
    this.gupActor = new GupActor(gup, mission);

    // Initialize HUD texts with safe defaults
    const titleStyle = new TextStyle({
      fontFamily: "system-ui, sans-serif",
      fontSize: 18,
      fontWeight: "bold",
      fill: "#ffffff"
    });
    this.hudTitleText = new Text({ text: `${mission.title}`, style: titleStyle });

    const depthStyle = new TextStyle({
      fontFamily: "system-ui, sans-serif",
      fontSize: 14,
      fill: "#80deea"
    });
    this.hudDepthText = new Text({ text: `수심 ${mission.depthMeters}m`, style: depthStyle });

    this.hudRadioContainer = new Container();
    this.hudRadioText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        fontWeight: "bold",
        fill: "#ffffff"
      })
    });
    this.hudRadioAvatarText = new Text({
      text: mission.companionAvatar,
      style: new TextStyle({ fontSize: 24 })
    });

    this.hudProgressBar = new Graphics();
    this.hudProgressGup = new Text({ text: gup.icon, style: new TextStyle({ fontSize: 16 }) });
    this.hudMilestoneIcons = new Text({
      text: "🔦 ⚡ 🛠️",
      style: new TextStyle({ fontSize: 14, fill: "#b0bec5" })
    });
  }

  public async init(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({
      canvas,
      width: 1280,
      height: 720,
      backgroundColor: 0x011627,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    });

    // 1. Setup Layer Order
    this.app.stage.addChild(this.farBackgroundLayer);
    this.app.stage.addChild(this.midgroundLayer);
    this.app.stage.addChild(this.gameplayWorldLayer);
    this.app.stage.addChild(this.foregroundLayer);
    this.app.stage.addChild(this.effectsLayer);
    this.app.stage.addChild(this.hudLayer);

    // 2. Far Background
    this.farBackgroundLayer.addChild(this.bgGraphics);
    this.farBackgroundLayer.addChild(this.causticsGraphics);

    this.distantMantaSprite.anchor.set(0.5, 0.5);
    this.distantMantaSprite.alpha = 0.35;
    this.distantMantaSprite.scale.set(0.9);
    this.farBackgroundLayer.addChild(this.distantMantaSprite);

    // 3. Midground
    this.midgroundLayer.addChild(this.fishContainer);
    this.midgroundLayer.addChild(this.jellyfishContainer);

    // 4. Gameplay World (Includes streams, rings, obstacles, and GUP Actor)
    this.gameplayWorldLayer.addChild(this.currentStreamsGraphics);
    this.gameplayWorldLayer.addChild(this.boostRingsContainer);
    this.gameplayWorldLayer.addChild(this.obstaclesContainer);
    this.gameplayWorldLayer.addChild(this.gupActor);

    // 5. Foreground (Cinematic depth)
    this.foregroundLayer.addChild(this.foregroundKelpGraphics);

    // 6. Effects
    this.effectsLayer.addChild(this.bubblesContainer);
    this.effectsLayer.addChild(this.sparksContainer);

    // 7. HUD Setup
    this.setupHud();

    this.isInitialized = true;
  }

  private setupHud(): void {
    // Top Left Mission Info Pill
    const infoBg = new Graphics();
    infoBg.roundRect(24, 20, 360, 52, 16);
    infoBg.fill({ color: 0x012a4a, alpha: 0.85 });
    infoBg.stroke({ color: 0x00e5ff, width: 1.5 });
    this.hudLayer.addChild(infoBg);

    this.hudTitleText.position.set(40, 26);
    this.hudDepthText.position.set(40, 48);
    this.hudLayer.addChild(this.hudTitleText);
    this.hudLayer.addChild(this.hudDepthText);

    // Top Right Progress Bar Pill
    const progressBg = new Graphics();
    progressBg.roundRect(860, 20, 396, 52, 16);
    progressBg.fill({ color: 0x012a4a, alpha: 0.85 });
    progressBg.stroke({ color: 0x00e5ff, width: 1.5 });
    this.hudLayer.addChild(progressBg);

    const progressLabel = new Text({
      text: "목적지 탐색 경로 (Sonar)",
      style: new TextStyle({ fontFamily: "system-ui, sans-serif", fontSize: 12, fill: "#cfd8dc" })
    });
    progressLabel.position.set(880, 26);
    this.hudLayer.addChild(progressLabel);

    this.hudLayer.addChild(this.hudProgressBar);
    this.hudLayer.addChild(this.hudProgressGup);

    // Radio Transmission Message Banner (Bottom Center)
    this.hudRadioContainer.position.set(340, 640);
    const radioBg = new Graphics();
    radioBg.roundRect(0, 0, 600, 56, 18);
    radioBg.fill({ color: 0x0a2239, alpha: 0.92 });
    radioBg.stroke({ color: 0x4dd0e1, width: 2 });
    this.hudRadioContainer.addChild(radioBg);

    this.hudRadioAvatarText.position.set(16, 12);
    this.hudRadioText.position.set(56, 18);
    this.hudRadioContainer.addChild(this.hudRadioAvatarText);
    this.hudRadioContainer.addChild(this.hudRadioText);
    this.hudRadioContainer.visible = false;
    this.hudLayer.addChild(this.hudRadioContainer);
  }

  /**
   * Renders the complete scene snapshot every animation frame.
   */
  public render(snapshot: TravelRenderSnapshot, dt: number): void {
    if (!this.isInitialized) return;

    const { cameraX, cameraY, time } = snapshot;

    // 1. Render Far Deep Ocean Abyss Background
    this.renderFarBackground(snapshot);

    // 2. Parallax Midground Layer
    this.renderMidground(snapshot);

    // 3. Gameplay World Layer (Translated by Camera)
    this.gameplayWorldLayer.position.set(-cameraX, -cameraY);

    // Render Streams, Rings, Obstacles in Gameplay World
    this.renderCurrentStreams(snapshot);
    this.renderBoostRings(snapshot);
    this.renderObstacles(snapshot);

    // 4. Update authoritative GUP Actor
    const gupState: GupPresentationState = {
      x: snapshot.subX,
      y: snapshot.subY,
      pitch: snapshot.subPitch,
      speedRatio: snapshot.speedRatio,
      isBoosting: snapshot.isBoosting,
      inCurrent: snapshot.inCurrent,
      collisionWobble: snapshot.collisionWobble,
      collisionShakeAngle: snapshot.collisionShakeAngle,
      readiness: snapshot.readiness,
      time: snapshot.time
    };
    this.gupActor.update(gupState, dt);

    // 5. Foreground Parallax (Kelp silhouettes close to camera)
    this.renderForeground(snapshot);

    // 6. Effects (Bubbles, Sparks)
    this.renderEffects(snapshot);

    // 7. HUD Update
    this.updateHud(snapshot);
  }

  private renderFarBackground(snapshot: TravelRenderSnapshot): void {
    const { cameraX, time } = snapshot;
    const w = 1280;
    const h = 720;

    // Background Gradient Fill
    this.bgGraphics.clear();
    this.bgGraphics.rect(0, 0, w, h);
    this.bgGraphics.fill({ color: 0x011627 });

    // Secondary deep gradient tint
    this.bgGraphics.rect(0, 300, w, 420);
    this.bgGraphics.fill({ color: 0x000c18, alpha: 0.7 });

    // Caustic Sunbeams (Drifting slowly)
    this.causticsGraphics.clear();
    for (let i = 0; i < 5; i++) {
      const baseX = ((i * 320 - cameraX * 0.12 + time * 18) % 1600) - 200;
      this.causticsGraphics.moveTo(baseX, 0);
      this.causticsGraphics.lineTo(baseX + 160, 720);
      this.causticsGraphics.lineTo(baseX + 220, 720);
      this.causticsGraphics.lineTo(baseX + 80, 0);
      this.causticsGraphics.closePath();
      this.causticsGraphics.fill({ color: 0x80deea, alpha: 0.05 + Math.sin(time * 2 + i) * 0.02 });
    }

    // Distant Manta Silhouette Parallax (moves slowly across background)
    const mantaX = ((1400 - cameraX * 0.18 + time * 24) % 1800) - 200;
    const mantaY = 220 + Math.sin(time * 0.8) * 40;
    this.distantMantaSprite.position.set(mantaX, mantaY);
  }

  private renderMidground(snapshot: TravelRenderSnapshot): void {
    const { cameraX, cameraY, fishSchool, jellyfishList } = snapshot;

    // Sync Fish Boids in Midground Container
    while (this.fishContainer.children.length < fishSchool.length) {
      const fishSprite = new Sprite(ProvisionalAssetFactory.getFishTexture("#ffd54f"));
      fishSprite.anchor.set(0.5, 0.5);
      this.fishContainer.addChild(fishSprite);
    }
    while (this.fishContainer.children.length > fishSchool.length) {
      this.fishContainer.removeChildAt(this.fishContainer.children.length - 1);
    }

    for (let i = 0; i < fishSchool.length; i++) {
      const boid = fishSchool[i];
      const sprite = this.fishContainer.children[i] as Sprite;
      const screenX = boid.x - cameraX * 0.6;
      const screenY = boid.y - cameraY * 0.6;
      sprite.position.set(screenX, screenY);
      sprite.scale.set(boid.scale * 0.85);
      sprite.alpha = 0.75;
      sprite.rotation = Math.sin(snapshot.time * 6 + i) * 0.12;
    }

    // Sync Jellyfish in Midground Container
    while (this.jellyfishContainer.children.length < jellyfishList.length) {
      const jfSprite = new Sprite(ProvisionalAssetFactory.getJellyfishTexture("rgba(206, 147, 216, 0.75)"));
      jfSprite.anchor.set(0.5, 0.5);
      this.jellyfishContainer.addChild(jfSprite);
    }
    while (this.jellyfishContainer.children.length > jellyfishList.length) {
      this.jellyfishContainer.removeChildAt(this.jellyfishContainer.children.length - 1);
    }

    for (let i = 0; i < jellyfishList.length; i++) {
      const jf = jellyfishList[i];
      const sprite = this.jellyfishContainer.children[i] as Sprite;
      const screenX = jf.x - cameraX * 0.7;
      const screenY = jf.y - cameraY * 0.7;
      sprite.position.set(screenX, screenY);
      sprite.scale.set(jf.scale * (1.0 + Math.sin(snapshot.time * 3 + i) * 0.1));
      sprite.alpha = 0.65 + Math.sin(snapshot.time * 2 + i) * 0.2;
    }
  }

  private renderCurrentStreams(snapshot: TravelRenderSnapshot): void {
    const { currentStreams, time } = snapshot;
    this.currentStreamsGraphics.clear();

    for (const stream of currentStreams) {
      // Flowing glowing current ribbon
      this.currentStreamsGraphics.roundRect(stream.worldX, stream.y, stream.width, stream.height, 24);
      this.currentStreamsGraphics.fill({ color: 0x00e5ff, alpha: 0.15 + Math.sin(time * 4) * 0.04 });
      this.currentStreamsGraphics.stroke({ color: 0x80deea, width: 2, alpha: 0.4 });

      // Flow streamline arrows inside current
      const flowOffset = (time * 180) % 80;
      for (let fx = stream.worldX + flowOffset; fx < stream.worldX + stream.width - 40; fx += 90) {
        this.currentStreamsGraphics.moveTo(fx, stream.y + stream.height / 2);
        this.currentStreamsGraphics.lineTo(fx + 24, stream.y + stream.height / 2);
        this.currentStreamsGraphics.lineTo(fx + 16, stream.y + stream.height / 2 - 8);
        this.currentStreamsGraphics.moveTo(fx + 24, stream.y + stream.height / 2);
        this.currentStreamsGraphics.lineTo(fx + 16, stream.y + stream.height / 2 + 8);
        this.currentStreamsGraphics.stroke({ color: 0x00e5ff, width: 2.5, alpha: 0.65 });
      }
    }
  }

  private renderBoostRings(snapshot: TravelRenderSnapshot): void {
    const { boostRings, time } = snapshot;

    while (this.boostRingsContainer.children.length < boostRings.length) {
      const ringSprite = new Sprite(ProvisionalAssetFactory.getBoostRingTexture());
      ringSprite.anchor.set(0.5, 0.5);
      this.boostRingsContainer.addChild(ringSprite);
    }
    while (this.boostRingsContainer.children.length > boostRings.length) {
      this.boostRingsContainer.removeChildAt(this.boostRingsContainer.children.length - 1);
    }

    for (let i = 0; i < boostRings.length; i++) {
      const ring = boostRings[i];
      const sprite = this.boostRingsContainer.children[i] as Sprite;
      sprite.position.set(ring.worldX, ring.y);

      if (ring.active) {
        sprite.visible = true;
        const pulse = 1.0 + Math.sin(time * 6 + i) * 0.12;
        sprite.scale.set(pulse, pulse);
        sprite.alpha = 0.9;
      } else {
        sprite.visible = false;
      }
    }
  }

  private renderObstacles(snapshot: TravelRenderSnapshot): void {
    const { obstacles } = snapshot;

    while (this.obstaclesContainer.children.length < obstacles.length) {
      const obs = obstacles[this.obstaclesContainer.children.length];
      const kind = obs.kind.includes("coral") ? "coral" : obs.kind.includes("kelp") ? "seaweed_cluster" : "rock";
      const sprite = new Sprite(ProvisionalAssetFactory.getObstacleTexture(kind, obs.color));
      sprite.anchor.set(0.5, 0.5);
      this.obstaclesContainer.addChild(sprite);
    }
    while (this.obstaclesContainer.children.length > obstacles.length) {
      this.obstaclesContainer.removeChildAt(this.obstaclesContainer.children.length - 1);
    }

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const sprite = this.obstaclesContainer.children[i] as Sprite;
      sprite.position.set(obs.worldX + obs.width / 2, obs.y + obs.height / 2);
      sprite.width = obs.width * 1.1;
      sprite.height = obs.height * 1.1;
    }
  }

  private renderForeground(snapshot: TravelRenderSnapshot): void {
    const { cameraX, time } = snapshot;
    this.foregroundKelpGraphics.clear();

    // Foreground Kelp Fronds passing rapidly near camera (Depth immersion)
    for (let k = 0; k < 6; k++) {
      const fx = ((k * 420 - cameraX * 1.35) % 1800) - 200;
      const sway = Math.sin(time * 2.2 + k) * 24;

      this.foregroundKelpGraphics.moveTo(fx, 720);
      this.foregroundKelpGraphics.bezierCurveTo(fx - 40 + sway, 560, fx + 30 + sway, 380, fx + sway * 1.5, 200);
      this.foregroundKelpGraphics.stroke({ color: 0x004d40, width: 24, alpha: 0.35 });
    }
  }

  private renderEffects(snapshot: TravelRenderSnapshot): void {
    const { cameraX, cameraY, bubbles, sparks } = snapshot;

    // Bubbles
    while (this.bubblesContainer.children.length < bubbles.length) {
      const bubbleSprite = new Sprite(ProvisionalAssetFactory.getBubbleTexture());
      bubbleSprite.anchor.set(0.5, 0.5);
      this.bubblesContainer.addChild(bubbleSprite);
    }
    while (this.bubblesContainer.children.length > bubbles.length) {
      this.bubblesContainer.removeChildAt(this.bubblesContainer.children.length - 1);
    }

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const sprite = this.bubblesContainer.children[i] as Sprite;
      sprite.position.set(b.x - cameraX, b.y - cameraY);
      sprite.scale.set((b.radius / 12) * 1.2);
      sprite.alpha = b.alpha;
    }

    // Sparks
    this.sparksContainer.position.set(-cameraX, -cameraY);
    while (this.sparksContainer.children.length < sparks.length) {
      const sparkG = new Graphics();
      sparkG.circle(0, 0, 3.5);
      sparkG.fill({ color: 0xffeb3b });
      this.sparksContainer.addChild(sparkG);
    }
    while (this.sparksContainer.children.length > sparks.length) {
      this.sparksContainer.removeChildAt(this.sparksContainer.children.length - 1);
    }

    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const sprite = this.sparksContainer.children[i] as Graphics;
      sprite.position.set(sp.x, sp.y);
      sprite.alpha = sp.life;
    }
  }

  private updateHud(snapshot: TravelRenderSnapshot): void {
    const { subX, worldLength, radioMessage, radioTimer, readiness } = snapshot;

    // Progress Bar Track
    const progress = Math.min(1.0, Math.max(0, subX / worldLength));
    this.hudProgressBar.clear();

    // Track line
    this.hudProgressBar.roundRect(880, 48, 350, 10, 5);
    this.hudProgressBar.fill({ color: 0x001a33 });

    // Filled progress
    this.hudProgressBar.roundRect(880, 48, 350 * progress, 10, 5);
    this.hudProgressBar.fill({ color: 0x00e5ff });

    // GUP Icon on track
    this.hudProgressGup.position.set(880 + 350 * progress - 8, 42);

    // Radio Transmission Message
    if (radioTimer > 0 && radioMessage) {
      this.hudRadioContainer.visible = true;
      this.hudRadioText.text = radioMessage;
    } else {
      this.hudRadioContainer.visible = false;
    }
  }

  public destroy(): void {
    this.isInitialized = false;
    try {
      this.app.destroy(true, { children: true, texture: false });
    } catch (e) {
      // Ignored
    }
  }
}
