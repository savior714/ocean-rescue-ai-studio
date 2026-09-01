import { Container, Sprite, Graphics } from "pixi.js";
import { ProvisionalAssetFactory } from "../travel/provisional-assets";

export enum TurtleState {
  DISTANT_WORRIED = "DISTANT_WORRIED",
  AWARENESS = "AWARENESS",
  STARTLED_GUARDED = "STARTLED_GUARDED",
  WATCHFUL_SETTLING = "WATCHFUL_SETTLING",
  BEING_SCANNED = "BEING_SCANNED",
  READY_FOR_RESCUE = "READY_FOR_RESCUE"
}

export interface TurtlePresentationInput {
  gupX: number;
  gupY: number;
  gupSpeed: number;
  isScanning: boolean;
  scanProgress: number; // 0..1
  isReadyForRescue: boolean;
  time: number;
}

export interface RopeStressPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  subLabel: string;
  highlighted: boolean;
}

export class TurtleActor extends Container {
  public currentState: TurtleState = TurtleState.DISTANT_WORRIED;
  public anchorWorldX: number = 2450;
  public anchorWorldY: number = 380;

  // Visual Parts Hierarchy
  private bodyContainer: Container;
  private hindFlipperSprite: Sprite;
  private plastronSprite: Sprite;
  private carapaceSprite: Sprite;

  private leftFlipperContainer: Container;
  private leftFlipperSprite: Sprite;

  private rightFlipperContainer: Container;
  private rightFlipperSprite: Sprite;

  private headContainer: Container;
  private headSprite: Sprite;
  private eyeSprite: Sprite;
  private eyeBlinkGraphics: Graphics;

  // Entanglement Ropes & Scan Nodes
  private ropesGraphics: Graphics;
  private ropeGlowGraphics: Graphics;
  private stressNodesContainer: Container;
  private scanBeamOverlay: Graphics;

  // Internal Animation & Emotion Variables
  private breathePhase: number = 0;
  private flipperAngleL: number = 0;
  private flipperAngleR: number = 0;
  private headTargetAngle: number = 0;
  private headCurrentAngle: number = 0;
  private eyeLookOffsetX: number = 0;
  private eyeLookOffsetY: number = 0;
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private startledTimer: number = 0;
  private struggleTwitch: number = 0;

  // Stress points
  public stressPoints: RopeStressPoint[] = [
    { id: "sn1", x: -42, y: 18, label: "1. 전방 지느러미 결속", subLabel: "Flipper Snag", highlighted: false },
    { id: "sn2", x: 10, y: -24, label: "2. 등껍질 주 구속부", subLabel: "Carapace Coil", highlighted: false },
    { id: "sn3", x: 68, y: 46, label: "3. 해저 암초 고정점", subLabel: "Anchor Line", highlighted: false }
  ];

  constructor() {
    super();

    this.bodyContainer = new Container();
    this.addChild(this.bodyContainer);

    // 1. Hind Flippers (Behind body)
    this.hindFlipperSprite = new Sprite(ProvisionalAssetFactory.getSeaTurtleHindFlipperTexture());
    this.hindFlipperSprite.anchor.set(0.1, 0.5);
    this.hindFlipperSprite.position.set(-82, 18);
    this.bodyContainer.addChild(this.hindFlipperSprite);

    // 2. Plastron (Belly)
    this.plastronSprite = new Sprite(ProvisionalAssetFactory.getSeaTurtlePlastronTexture());
    this.plastronSprite.anchor.set(0.5, 0.5);
    this.plastronSprite.position.set(0, 8);
    this.bodyContainer.addChild(this.plastronSprite);

    // 3. Right / Distal Fore Flipper
    this.rightFlipperContainer = new Container();
    this.rightFlipperContainer.position.set(38, -26);
    this.rightFlipperSprite = new Sprite(ProvisionalAssetFactory.getSeaTurtleForeFlipperTexture());
    this.rightFlipperSprite.anchor.set(0.08, 0.5);
    this.rightFlipperSprite.scale.set(0.85, 0.85);
    this.rightFlipperSprite.alpha = 0.82;
    this.rightFlipperContainer.addChild(this.rightFlipperSprite);
    this.bodyContainer.addChild(this.rightFlipperContainer);

    // 4. Carapace (Main Shell)
    this.carapaceSprite = new Sprite(ProvisionalAssetFactory.getSeaTurtleCarapaceTexture());
    this.carapaceSprite.anchor.set(0.5, 0.5);
    this.bodyContainer.addChild(this.carapaceSprite);

    // 5. Left / Proximal Fore Flipper (Front flipper caught in ropes)
    this.leftFlipperContainer = new Container();
    this.leftFlipperContainer.position.set(42, 22);
    this.leftFlipperSprite = new Sprite(ProvisionalAssetFactory.getSeaTurtleForeFlipperTexture());
    this.leftFlipperSprite.anchor.set(0.08, 0.5);
    this.leftFlipperContainer.addChild(this.leftFlipperSprite);
    this.bodyContainer.addChild(this.leftFlipperContainer);

    // 6. Head Container (Rotates with gaze)
    this.headContainer = new Container();
    this.headContainer.position.set(78, -4);

    this.headSprite = new Sprite(ProvisionalAssetFactory.getSeaTurtleHeadTexture());
    this.headSprite.anchor.set(0.2, 0.5);
    this.headContainer.addChild(this.headSprite);

    // Expressive Sea Turtle Eye
    this.eyeSprite = new Sprite(ProvisionalAssetFactory.getSeaTurtleEyeTexture());
    this.eyeSprite.anchor.set(0.5, 0.5);
    this.eyeSprite.position.set(52, -10);
    this.headContainer.addChild(this.eyeSprite);

    this.eyeBlinkGraphics = new Graphics();
    this.headContainer.addChild(this.eyeBlinkGraphics);

    this.bodyContainer.addChild(this.headContainer);

    // 7. Entanglement Ropes (Dynamic physical strands)
    this.ropeGlowGraphics = new Graphics();
    this.ropesGraphics = new Graphics();
    this.bodyContainer.addChild(this.ropeGlowGraphics);
    this.bodyContainer.addChild(this.ropesGraphics);

    // 8. Stress Nodes Container (Inspection markers)
    this.stressNodesContainer = new Container();
    this.bodyContainer.addChild(this.stressNodesContainer);

    // 9. Scan Beam Overlay
    this.scanBeamOverlay = new Graphics();
    this.addChild(this.scanBeamOverlay);

    this.position.set(this.anchorWorldX, this.anchorWorldY);
  }

  /**
   * Updates state, dynamic reaction, physics and animation.
   */
  public update(input: TurtlePresentationInput, dt: number): void {
    const { gupX, gupY, gupSpeed, isScanning, scanProgress, isReadyForRescue, time } = input;

    const distToGup = Math.hypot(gupX - this.x, gupY - this.y);
    const dx = gupX - this.x;
    const dy = gupY - this.y;

    // 1. Determine Authoritative Emotion / Reaction State
    if (isReadyForRescue) {
      this.currentState = TurtleState.READY_FOR_RESCUE;
    } else if (isScanning) {
      this.currentState = TurtleState.BEING_SCANNED;
    } else if (distToGup < 340 && gupSpeed > 260) {
      // Rapid / aggressive approach triggers startled guarded state
      this.startledTimer = 1.8;
      this.currentState = TurtleState.STARTLED_GUARDED;
    } else if (this.startledTimer > 0) {
      this.startledTimer -= dt;
      this.currentState = TurtleState.STARTLED_GUARDED;
    } else if (distToGup < 480) {
      this.currentState = TurtleState.WATCHFUL_SETTLING;
    } else if (distToGup < 780) {
      this.currentState = TurtleState.AWARENESS;
    } else {
      this.currentState = TurtleState.DISTANT_WORRIED;
    }

    // 2. Breathing & Body Hover
    this.breathePhase += dt * (this.currentState === TurtleState.STARTLED_GUARDED ? 3.5 : 1.4);
    const breatheScale = 1.0 + Math.sin(this.breathePhase) * 0.025;
    const bodyHoverY = Math.sin(time * 1.8) * 6;
    const bodyHoverX = Math.cos(time * 0.9) * 3;

    this.bodyContainer.position.set(bodyHoverX, bodyHoverY);
    this.carapaceSprite.scale.set(breatheScale, breatheScale);
    this.plastronSprite.scale.set(breatheScale, breatheScale);

    // 3. Eye Blinking Logic (natural organic timing)
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer < -0.15) {
        this.isBlinking = false;
        this.blinkTimer = 2.8 + Math.random() * 3.5;
      }
    }

    this.eyeBlinkGraphics.clear();
    if (this.isBlinking) {
      this.eyeBlinkGraphics.ellipse(52, -10, 11, 7);
      this.eyeBlinkGraphics.fill({ color: 0x425828 });
    }

    // 4. Head & Gaze Dynamics based on Current Reaction State
    switch (this.currentState) {
      case TurtleState.DISTANT_WORRIED: {
        // Head hung slightly down, slow weak struggle
        this.headTargetAngle = 0.18 + Math.sin(time * 1.2) * 0.06;
        this.eyeLookOffsetX = -1;
        this.eyeLookOffsetY = 1;
        this.struggleTwitch = Math.sin(time * 0.8) > 0.7 ? Math.sin(time * 15) * 4 : 0;
        break;
      }

      case TurtleState.AWARENESS: {
        // Head raises up, tracking incoming GUP
        const angleToGup = Math.atan2(dy, dx);
        this.headTargetAngle = Math.max(-0.35, Math.min(0.25, angleToGup * 0.45));
        this.eyeLookOffsetX = Math.max(-2.5, Math.min(2.5, (dx / 400) * 2.5));
        this.eyeLookOffsetY = Math.max(-2, Math.min(2, (dy / 400) * 2));
        this.struggleTwitch = 0;
        break;
      }

      case TurtleState.STARTLED_GUARDED: {
        // Recoils head back towards shell, eyes wide
        this.headTargetAngle = -0.12 + Math.sin(time * 25) * 0.04;
        this.eyeLookOffsetX = -2;
        this.eyeLookOffsetY = 0;
        this.struggleTwitch = Math.sin(time * 30) * 6; // Rope pulls tight
        break;
      }

      case TurtleState.WATCHFUL_SETTLING: {
        // Calm steady gaze directly into GUP cockpit
        const angleToGup = Math.atan2(dy, dx);
        this.headTargetAngle = Math.max(-0.3, Math.min(0.2, angleToGup * 0.5));
        this.eyeLookOffsetX = Math.max(-2.5, Math.min(2.5, (dx / 300) * 2.5));
        this.eyeLookOffsetY = Math.max(-2, Math.min(2, (dy / 300) * 2));
        this.struggleTwitch = 0;
        break;
      }

      case TurtleState.BEING_SCANNED: {
        // Follows the sweeping light beam with curiosity and blinking
        this.headTargetAngle = -0.15 + scanProgress * 0.35;
        this.eyeLookOffsetX = -1.5 + scanProgress * 3.0;
        this.eyeLookOffsetY = Math.sin(scanProgress * Math.PI) * 1.5;
        this.struggleTwitch = 0;
        break;
      }

      case TurtleState.READY_FOR_RESCUE: {
        // Relaxed, trusting posture with gentle nodding gaze
        this.headTargetAngle = -0.05 + Math.sin(time * 1.5) * 0.05;
        this.eyeLookOffsetX = 0.5;
        this.eyeLookOffsetY = 0.5;
        this.struggleTwitch = 0;
        break;
      }
    }

    // Smooth head rotation interpolation
    this.headCurrentAngle += (this.headTargetAngle - this.headCurrentAngle) * (dt * 5.0);
    this.headContainer.rotation = this.headCurrentAngle;
    this.eyeSprite.position.set(52 + this.eyeLookOffsetX, -10 + this.eyeLookOffsetY);

    // 5. Flipper Articulation
    let targetFlipperL = 0.2;
    let targetFlipperR = -0.2;

    if (this.currentState === TurtleState.STARTLED_GUARDED) {
      // Tucked in guard posture
      targetFlipperL = 0.65;
      targetFlipperR = -0.65;
    } else if (this.currentState === TurtleState.BEING_SCANNED || this.currentState === TurtleState.READY_FOR_RESCUE) {
      // Calm drooping paddle posture
      targetFlipperL = 0.15 + Math.sin(time * 1.6) * 0.08;
      targetFlipperR = -0.15 + Math.sin(time * 1.6) * 0.08;
    } else {
      // Gentle swimming/floating paddle strokes
      targetFlipperL = 0.25 + Math.sin(this.breathePhase * 1.2) * 0.18;
      targetFlipperR = -0.25 + Math.sin(this.breathePhase * 1.2 + 0.4) * 0.18;
    }

    this.flipperAngleL += (targetFlipperL - this.flipperAngleL) * (dt * 4.5);
    this.flipperAngleR += (targetFlipperR - this.flipperAngleR) * (dt * 4.5);

    this.leftFlipperContainer.rotation = this.flipperAngleL;
    this.rightFlipperContainer.rotation = this.flipperAngleR;
    this.hindFlipperSprite.rotation = Math.sin(time * 1.5) * 0.08;

    // 6. Draw Entanglement Ropes & Scan Highlights
    this.renderRopes(input);

    // 7. Draw Scan Beam Overlay if Active
    this.renderScanBeam(input);
  }

  /**
   * Renders the dynamic, physical rope strands with tension, sag, and scan illumination.
   */
  private renderRopes(input: TurtlePresentationInput): void {
    const { isScanning, scanProgress, isReadyForRescue, time } = input;

    this.ropesGraphics.clear();
    this.ropeGlowGraphics.clear();

    const twitch = this.struggleTwitch;
    const isTaut = this.currentState === TurtleState.STARTLED_GUARDED;

    // Tension / glow color
    const baseRopeColor = 0x8d6e63; // weathered synthetic manila rope
    const highlightRopeColor = 0x00e5ff; // glowing turquoise scanner reveal
    const glowAlpha = isReadyForRescue ? 0.9 : isScanning ? 0.4 + scanProgress * 0.5 : 0.0;

    // --- Strand 1: Reef Anchor Line (From deep coral rock to turtle plastron & left shoulder) ---
    const anchorX = 140;
    const anchorY = 180;
    const shoulderX = 42 + twitch;
    const shoulderY = 22;

    const sag1 = isTaut ? 8 : 28 + Math.sin(time * 2) * 4;

    // Background rope shadow
    this.ropesGraphics.moveTo(anchorX, anchorY);
    this.ropesGraphics.quadraticCurveTo((anchorX + shoulderX) / 2 + 10, (anchorY + shoulderY) / 2 + sag1, shoulderX, shoulderY);
    this.ropesGraphics.stroke({ color: 0x3e2723, width: 7 });

    // Main rope strand
    this.ropesGraphics.moveTo(anchorX, anchorY);
    this.ropesGraphics.quadraticCurveTo((anchorX + shoulderX) / 2 + 10, (anchorY + shoulderY) / 2 + sag1, shoulderX, shoulderY);
    this.ropesGraphics.stroke({ color: baseRopeColor, width: 5 });

    // --- Strand 2: Left Flipper Constriction Coil (Wrapped tightly around the front flipper) ---
    const flipperMidX = this.leftFlipperContainer.x + 36;
    const flipperMidY = this.leftFlipperContainer.y + 14;

    this.ropesGraphics.moveTo(shoulderX, shoulderY);
    this.ropesGraphics.bezierCurveTo(shoulderX - 16, shoulderY - 8, flipperMidX - 10, flipperMidY + 12, flipperMidX + 16, flipperMidY - 6);
    this.ropesGraphics.stroke({ color: baseRopeColor, width: 5 });

    // Double wrap knot on flipper
    this.ropesGraphics.ellipse(flipperMidX, flipperMidY, 12, 8);
    this.ropesGraphics.stroke({ color: baseRopeColor, width: 5.5 });

    // --- Strand 3: Carapace Coil (Traversing across the top of the shell) ---
    const shellTopX = 8;
    const shellTopY = -36;
    const rearAnchorX = -58;
    const rearAnchorY = 8;

    this.ropesGraphics.moveTo(flipperMidX, flipperMidY);
    this.ropesGraphics.bezierCurveTo(40, -10, shellTopX + 20, shellTopY - 6, shellTopX, shellTopY);
    this.ropesGraphics.bezierCurveTo(shellTopX - 30, shellTopY - 4, rearAnchorX - 10, rearAnchorY - 14, rearAnchorX, rearAnchorY);
    this.ropesGraphics.stroke({ color: baseRopeColor, width: 4.5 });

    // Additional cross-strands (Ghost Netting diamond meshes)
    this.ropesGraphics.moveTo(shoulderX + 10, shoulderY - 12);
    this.ropesGraphics.lineTo(shellTopX + 15, shellTopY + 18);
    this.ropesGraphics.stroke({ color: 0x6d4c41, width: 2.5, alpha: 0.85 });

    this.ropesGraphics.moveTo(flipperMidX - 8, flipperMidY - 14);
    this.ropesGraphics.lineTo(shellTopX - 8, shellTopY + 14);
    this.ropesGraphics.stroke({ color: 0x6d4c41, width: 2.5, alpha: 0.85 });

    // --- Scanner Glowing Hologram Highlight Overlay ---
    if (glowAlpha > 0.05) {
      // Glow underlay
      this.ropeGlowGraphics.moveTo(anchorX, anchorY);
      this.ropeGlowGraphics.quadraticCurveTo((anchorX + shoulderX) / 2 + 10, (anchorY + shoulderY) / 2 + sag1, shoulderX, shoulderY);
      this.ropeGlowGraphics.moveTo(shoulderX, shoulderY);
      this.ropeGlowGraphics.bezierCurveTo(shoulderX - 16, shoulderY - 8, flipperMidX - 10, flipperMidY + 12, flipperMidX + 16, flipperMidY - 6);
      this.ropeGlowGraphics.moveTo(flipperMidX, flipperMidY);
      this.ropeGlowGraphics.bezierCurveTo(40, -10, shellTopX + 20, shellTopY - 6, shellTopX, shellTopY);
      this.ropeGlowGraphics.bezierCurveTo(shellTopX - 30, shellTopY - 4, rearAnchorX - 10, rearAnchorY - 14, rearAnchorX, rearAnchorY);
      this.ropeGlowGraphics.stroke({ color: highlightRopeColor, width: 8, alpha: glowAlpha * 0.45 });

      // Crisp neon vector line
      this.ropeGlowGraphics.stroke({ color: 0xffffff, width: 2.5, alpha: glowAlpha * 0.95 });
    }

    // --- Update Stress Node Markers (3 release points) ---
    this.updateStressNodes(input, glowAlpha);
  }

  /**
   * Updates holographic stress nodes revealing the rescue release points.
   */
  private updateStressNodes(input: TurtlePresentationInput, glowAlpha: number): void {
    const { time, isReadyForRescue } = input;

    this.stressNodesContainer.removeChildren();

    if (glowAlpha < 0.2) return;

    // Node coordinates relative to body
    const nodeCoords = [
      { x: 38, y: 20, name: "절단 부위 1: 지느러미 결속 해제" },
      { x: 8, y: -34, name: "절단 부위 2: 등껍질 구속 해제" },
      { x: 120, y: 130, name: "절단 부위 3: 해저 고정줄 분리" }
    ];

    for (let i = 0; i < nodeCoords.length; i++) {
      const nc = nodeCoords[i];
      const nodeG = new Graphics();

      const pulse = 1.0 + Math.sin(time * 6 + i * 1.5) * 0.18;
      const radius = (14 + (isReadyForRescue ? 3 : 0)) * pulse;

      // Outer holographic reticle ring
      nodeG.circle(nc.x, nc.y, radius);
      nodeG.stroke({ color: 0x00e5ff, width: 2.5, alpha: glowAlpha });

      // Concentric inner ring
      nodeG.circle(nc.x, nc.y, radius * 0.55);
      nodeG.fill({ color: 0x00e5ff, alpha: glowAlpha * 0.35 });
      nodeG.stroke({ color: 0xffffff, width: 1.5, alpha: glowAlpha * 0.85 });

      // Reticle tick crosshairs
      const tick = radius + 6;
      nodeG.moveTo(nc.x - tick, nc.y);
      nodeG.lineTo(nc.x - radius + 2, nc.y);
      nodeG.moveTo(nc.x + radius - 2, nc.y);
      nodeG.lineTo(nc.x + tick, nc.y);
      nodeG.moveTo(nc.x, nc.y - tick);
      nodeG.lineTo(nc.x, nc.y - radius + 2);
      nodeG.moveTo(nc.x, nc.y + radius - 2);
      nodeG.lineTo(nc.x, nc.y + tick);
      nodeG.stroke({ color: 0x80deea, width: 1.8, alpha: glowAlpha * 0.9 });

      this.stressNodesContainer.addChild(nodeG);
    }
  }

  /**
   * Renders the volumetric scan sweep beam passing across the turtle.
   */
  private renderScanBeam(input: TurtlePresentationInput): void {
    const { isScanning, scanProgress, gupX, gupY } = input;
    this.scanBeamOverlay.clear();

    if (!isScanning) return;

    // Scan beam originates from GUP nose toward Turtle
    const sourceX = gupX - this.x;
    const sourceY = gupY - this.y;

    const sweepAngle = -0.4 + scanProgress * 0.8;
    const coneLen = 650;

    const endX1 = sourceX + Math.cos(sweepAngle - 0.25) * coneLen;
    const endY1 = sourceY + Math.sin(sweepAngle - 0.25) * coneLen;
    const endX2 = sourceX + Math.cos(sweepAngle + 0.25) * coneLen;
    const endY2 = sourceY + Math.sin(sweepAngle + 0.25) * coneLen;

    // Volumetric fan beam
    this.scanBeamOverlay.moveTo(sourceX, sourceY);
    this.scanBeamOverlay.lineTo(endX1, endY1);
    this.scanBeamOverlay.lineTo(endX2, endY2);
    this.scanBeamOverlay.closePath();
    this.scanBeamOverlay.fill({ color: 0x00e5ff, alpha: 0.18 });

    // Sweeping scan line
    const leadX = sourceX + Math.cos(sweepAngle) * coneLen;
    const leadY = sourceY + Math.sin(sweepAngle) * coneLen;
    this.scanBeamOverlay.moveTo(sourceX, sourceY);
    this.scanBeamOverlay.lineTo(leadX, leadY);
    this.scanBeamOverlay.stroke({ color: 0xffffff, width: 3.5, alpha: 0.85 });

    // Acoustic sonar wavefront arc across turtle
    const waveRadius = scanProgress * 550;
    this.scanBeamOverlay.arc(sourceX, sourceY, waveRadius, sweepAngle - 0.35, sweepAngle + 0.35);
    this.scanBeamOverlay.stroke({ color: 0x00e5ff, width: 4, alpha: 0.6 * (1 - scanProgress) });
  }
}
