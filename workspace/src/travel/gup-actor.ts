import { Container, Sprite, Graphics } from "pixi.js";
import { GupData, MissionData } from "../types";
import { ProvisionalAssetFactory } from "./provisional-assets";
import { ReadinessSnapshot } from "./readiness";

/**
 * GUP ACTOR (SPRITE-DRIVEN)
 *
 * Implements the single presentation authority for the GUP vehicle actor in PixiJS.
 * Translates authoritative TravelEngine gameplay state into texture-backed sprite
 * presentation, transforms, propeller rotation, boost exhaust, and readiness visual cues.
 */

export interface GupPresentationState {
  readonly x: number;
  readonly y: number;
  readonly pitch: number; // Pitch in radians
  readonly speedRatio: number; // 0..2 (1.0 = normal cruise, >1.0 = boost/current)
  readonly isBoosting: boolean;
  readonly inCurrent: boolean;
  readonly collisionWobble: number; // 0..1 recoil intensity
  readonly collisionShakeAngle: number; // radians offset
  readonly readiness: ReadinessSnapshot;
  readonly time: number; // seconds
}

export class GupActor extends Container {
  private recoilContainer: Container;
  private hullSprite: Sprite;
  private cockpitSprite: Sprite;
  private canopyGlassSprite: Sprite;
  private propellerContainer: Container;
  private propellerSprite: Sprite;
  private thrusterPlumeSprite: Sprite;
  private searchlightBeam: Sprite;
  private searchlightGlow: Graphics;
  private laserCutterSprite: Sprite;

  private gupData: GupData;
  private missionData: MissionData;

  private propAngle: number = 0;

  constructor(gup: GupData, mission: MissionData) {
    super();
    this.gupData = gup;
    this.missionData = mission;

    // Recoil Container encapsulates collision recoil and angular shake
    this.recoilContainer = new Container();
    this.addChild(this.recoilContainer);

    // 1. Searchlight Volumetric Beam & Headlight Glow (Underneath hull)
    this.searchlightBeam = new Sprite(ProvisionalAssetFactory.getSearchlightTexture());
    this.searchlightBeam.anchor.set(0, 0.5);
    this.searchlightBeam.position.set(70, 0);
    this.searchlightBeam.alpha = 0.55;
    this.recoilContainer.addChild(this.searchlightBeam);

    this.searchlightGlow = new Graphics();
    this.searchlightGlow.circle(74, 0, 18);
    this.searchlightGlow.fill({ color: 0xfff59d, alpha: 0.35 });
    this.recoilContainer.addChild(this.searchlightGlow);

    // 2. Thruster Jet Plume (Behind hull)
    this.thrusterPlumeSprite = new Sprite(ProvisionalAssetFactory.getBoostPlumeTexture());
    this.thrusterPlumeSprite.anchor.set(1.0, 0.5);
    this.thrusterPlumeSprite.position.set(-86, 0);
    this.thrusterPlumeSprite.visible = false;
    this.recoilContainer.addChild(this.thrusterPlumeSprite);

    // 3. Ducted Propeller
    this.propellerContainer = new Container();
    this.propellerContainer.position.set(-78, 0);
    this.propellerSprite = new Sprite(ProvisionalAssetFactory.getPropellerTexture());
    this.propellerSprite.anchor.set(0.5, 0.5);
    this.propellerContainer.addChild(this.propellerSprite);
    this.recoilContainer.addChild(this.propellerContainer);

    // 4. Main Submarine Hull
    this.hullSprite = new Sprite(ProvisionalAssetFactory.getGupHullTexture(gup));
    this.hullSprite.anchor.set(0.5, 0.5);
    this.recoilContainer.addChild(this.hullSprite);

    // 5. Cockpit Cabin Interior & Companion Pilot
    this.cockpitSprite = new Sprite(ProvisionalAssetFactory.getCockpitTexture(mission.companionAvatar));
    this.cockpitSprite.anchor.set(0.5, 0.5);
    this.cockpitSprite.position.set(16, -10);
    this.cockpitSprite.scale.set(0.85);
    this.recoilContainer.addChild(this.cockpitSprite);

    // 6. Glass Canopy Specular Dome
    this.canopyGlassSprite = new Sprite(ProvisionalAssetFactory.getCanopyGlassTexture());
    this.canopyGlassSprite.anchor.set(0.5, 0.5);
    this.canopyGlassSprite.position.set(16, -10);
    this.canopyGlassSprite.scale.set(0.85);
    this.recoilContainer.addChild(this.canopyGlassSprite);

    // 7. Precision Laser Cutter Attachment (Mounted on nose)
    this.laserCutterSprite = new Sprite(ProvisionalAssetFactory.getLaserCutterTexture());
    this.laserCutterSprite.anchor.set(0.1, 0.5);
    this.laserCutterSprite.position.set(72, 8);
    this.laserCutterSprite.visible = false;
    this.recoilContainer.addChild(this.laserCutterSprite);
  }

  /**
   * Updates sprite transforms, animations, and visual presentation from authoritative state.
   */
  public update(state: GupPresentationState, dt: number): void {
    // 1. Base Position + Subtle Living Hover (idle breathing)
    const hoverBobY = Math.sin(state.time * 2.8) * 3.5;
    const hoverBobX = Math.cos(state.time * 1.4) * 1.5;

    this.position.set(state.x + hoverBobX, state.y + hoverBobY);

    // 2. Pitch / Tilt Rotation (smooth hydrodynamic responsiveness)
    this.rotation = state.pitch;

    // 3. Collision Recoil & Angular Wobble Transform
    if (state.collisionWobble > 0) {
      const recoilOffset = -state.collisionWobble * 22; // shift backwards
      this.recoilContainer.position.set(recoilOffset, 0);
      this.recoilContainer.rotation = state.collisionShakeAngle * state.collisionWobble;
      this.hullSprite.tint = state.collisionWobble > 0.4 ? 0xffcdd2 : 0xffffff;
    } else {
      this.recoilContainer.position.set(0, 0);
      this.recoilContainer.rotation = 0;
      this.hullSprite.tint = 0xffffff;
    }

    // 4. Propeller Rotation Velocity
    const propSpeed = state.isBoosting ? 38 : state.inCurrent ? 24 : 12;
    this.propAngle += propSpeed * dt;
    this.propellerSprite.rotation = this.propAngle;

    // 5. Thruster Exhaust Plume Presentation
    if (state.isBoosting) {
      this.thrusterPlumeSprite.visible = true;
      const pulse = 1.0 + Math.sin(state.time * 30) * 0.15;
      this.thrusterPlumeSprite.scale.set(1.4 * pulse, 1.2 * pulse);
      this.thrusterPlumeSprite.alpha = 0.95;
    } else if (state.inCurrent) {
      this.thrusterPlumeSprite.visible = true;
      const pulse = 1.0 + Math.sin(state.time * 18) * 0.08;
      this.thrusterPlumeSprite.scale.set(0.9 * pulse, 0.7 * pulse);
      this.thrusterPlumeSprite.alpha = 0.65;
    } else {
      this.thrusterPlumeSprite.visible = false;
    }

    // 6. Rescue Readiness Visual Cues
    // Milestone 1 (Searchlight)
    if (state.readiness.searchlight) {
      this.searchlightBeam.visible = true;
      this.searchlightBeam.alpha = 0.65 + Math.sin(state.time * 4) * 0.08;
      this.searchlightBeam.scale.set(1.1, 1.1);
      this.searchlightGlow.visible = true;
    } else {
      this.searchlightBeam.visible = true;
      this.searchlightBeam.alpha = 0.3;
      this.searchlightBeam.scale.set(0.8, 0.8);
      this.searchlightGlow.visible = false;
    }

    // Milestone 2 (Aux Thruster)
    if (state.readiness.thruster) {
      // Enhanced subtle cyan glow around propeller housing
      this.propellerContainer.scale.set(1.08);
    } else {
      this.propellerContainer.scale.set(1.0);
    }

    // Milestone 3 (Cutter / Tool Deployment)
    this.laserCutterSprite.visible = state.readiness.cutter;
    if (state.readiness.cutter) {
      // Pulsing laser emitter tip
      this.laserCutterSprite.alpha = 0.9 + Math.sin(state.time * 12) * 0.1;
    }

    // 7. Dynamic Forward Posture (subtle squash/stretch on high speed)
    if (state.isBoosting) {
      this.scale.set(1.06, 0.94);
    } else {
      this.scale.set(1.0, 1.0);
    }
  }
}
