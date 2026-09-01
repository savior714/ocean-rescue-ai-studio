export enum GamePhase {
  MISSION_SELECT = "MISSION_SELECT",
  LAUNCH = "LAUNCH",
  TRAVEL = "TRAVEL",
  RESCUE_ACTIVE = "RESCUE_ACTIVE",
  RESCUE_CARE = "RESCUE_CARE",
  RESCUE_CELEBRATION = "RESCUE_CELEBRATION",
  MISSION_SUCCESS = "MISSION_SUCCESS",
  PAUSE = "PAUSE"
}

export type OceanEnvironment = "coral-reef" | "kelp-forest" | "deep-trench" | "kelp-shore" | "abyssal-zone";

export interface MissionData {
  id: string;
  title: string;
  subtitle: string;
  companion: string;
  companionAvatar: string;
  summary: string;
  environment: OceanEnvironment;
  animalName: string;
  animalIcon: string;
  briefing: string;
  situation: string;
  tutorial: string;
  toolLabel: string;
  targetLabel: string;
  dialogues: string[];
  ecologyFact: string;
  funTrivia: string[];
  depthMeters: number;
  careTreatName: string;
  careTreatIcon: string;
}

export interface GupData {
  id: string;
  name: string;
  description: string;
  color: string;
  accentColor: string;
  type: "speed" | "balanced" | "heavy" | "claw" | "medical";
  icon: string;
  armorLabel: string;
  specialAbility: string;
}

export interface CurrentStream {
  id: string;
  worldX: number;
  y: number;
  width: number;
  height: number;
  flowSpeed: number;
}

export interface TravelObstacle {
  id: string;
  worldX: number;
  y: number;
  width: number;
  height: number;
  kind: "coral" | "rock" | "jellyfish" | "seaweed_cluster";
  color: string;
  name: string;
  hitAnim?: number;
}

export interface BoostRing {
  id: string;
  worldX: number;
  y: number;
  passed: boolean;
  active?: boolean;
  radius: number;
}

export interface SonarEchoPoint {
  id: string;
  worldX: number;
  y: number;
  discovered: boolean;
  type: "signal" | "creature" | "waypoint";
  name: string;
}

export interface FishBoid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  scale?: number;
  tailPhase: number;
}

export interface JellyfishEntity {
  x: number;
  y: number;
  size: number;
  color: string;
  scale?: number;
  pulseOffset: number;
  speedY: number;
}

export interface SeaTurtleRope {
  id: string;
  order: number;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cut: boolean;
  angle: number;
  color: string;
}

export interface RopePhysicsFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  length: number;
  color: string;
  life: number;
}

export interface CrabRock {
  id: string;
  order: number;
  x: number;
  y: number;
  radius: number;
  cleared: boolean;
  color: string;
  isBeingDragged: boolean;
  targetX?: number;
  targetY?: number;
}

export interface WhaleDebris {
  id: string;
  order: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hooked: boolean;
  cleared: boolean;
  color: string;
  velocity?: { x: number; y: number };
}

export interface OtterTangle {
  id: string;
  order: number;
  x: number;
  y: number;
  radius: number;
  cleared: boolean;
  label: string;
}

export interface SquidCrystal {
  id: string;
  order: number;
  x: number;
  y: number;
  cleared: boolean;
  label: string;
}

export interface UserStats {
  rescuedCount?: number;
}

export interface RescueVitals {
  heartRate: number; // BPM
  stressLevel: number; // %
  oxygenLevel: number; // %
  scanned: boolean;
  medicineSprayed: number; // 0..100%
  treatFedCount: number; // 0..3
  healthPercent: number; // 0..100%
}
