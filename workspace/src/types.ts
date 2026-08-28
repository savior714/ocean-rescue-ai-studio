export enum GamePhase {
  BOOT = "BOOT",
  PROFILE_CHOICE = "PROFILE_CHOICE",
  MISSION_SELECT = "MISSION_SELECT",
  GUP_SELECT = "GUP_SELECT",
  GUP_HANGAR = "GUP_HANGAR",
  LAUNCH = "LAUNCH",
  TRAVEL = "TRAVEL",
  RESCUE_SITE_TRANSITION = "RESCUE_SITE_TRANSITION",
  RESCUE_TUTORIAL = "RESCUE_TUTORIAL",
  RESCUE_ACTIVE = "RESCUE_ACTIVE",
  RESCUE_BIOCARE = "RESCUE_BIOCARE",
  RESCUE_SUCCESS = "RESCUE_SUCCESS",
  MISSION_SUCCESS = "MISSION_SUCCESS",
  LOGBOOK = "LOGBOOK",
  ECO_QUIZ = "ECO_QUIZ",
  PAUSE = "PAUSE"
}

export type OceanEnvironment = "coral-reef" | "kelp-forest" | "deep-trench" | "arctic-ocean" | "abyssal-zone";

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
  badge: string;
  funTrivia: string[];
  depthMeters: number;
  careTreatName?: string;
  careTreatIcon?: string;
}

export interface GupData {
  id: string;
  name: string;
  description: string;
  color: string;
  accentColor: string;
  type: "speed" | "balanced" | "heavy" | "claw" | "medical";
  icon: string;
  speedMultiplier: number;
  armorLabel: string;
  specialAbility: string;
}

export interface GupUpgrades {
  speedLevel: number; // 0..3 (+10% per level)
  shieldLevel: number; // 0..3 (absorbs 1..3 hits)
  sonarLevel: number; // 0..3 (+25% pulse radius)
}

export interface TravelObstacle {
  id: string;
  worldX: number;
  y: number;
  width: number;
  height: number;
  kind: string;
  color: string;
  name: string;
  hitAnim?: number;
}

export interface CollectibleStar {
  id: string;
  worldX: number;
  y: number;
  collected: boolean;
  type: "star" | "bio-orb";
}

export interface BoostRing {
  id: string;
  worldX: number;
  y: number;
  passed: boolean;
  radius: number;
}

export interface FishBoid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export interface JellyfishEntity {
  x: number;
  y: number;
  size: number;
  color: string;
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

export interface OtterOilSpot {
  id: string;
  order: number;
  x: number;
  y: number;
  radius: number;
  cleanedPercent: number; // 0 -> 100
  cleared: boolean;
}

export interface SquidCable {
  id: string;
  order: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cut: boolean;
  color: string;
  angle: number;
}

export interface BioCareTarget {
  id: string;
  type: "spray" | "feed" | "scan";
  label: string;
  icon: string;
  x: number;
  y: number;
  progress: number;
  completed: boolean;
}

export interface RescueVitals {
  heartRate: number; // BPM (e.g. 110 -> 65)
  stressLevel: number; // 100% -> 0%
  oxygenLevel: number; // 75% -> 98%
  scanned: boolean;
  healthPercent: number; // 20% -> 100%
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  animalIcon: string;
}

export interface UserStats {
  completedMissions: Record<string, { stars: number; bestTime: number; unlockedAt: string }>;
  collectedBadges: string[];
  totalRescuedAnimals: number;
  totalStars: number;
  upgrades: Record<string, GupUpgrades>;
  quizPassedCount: number;
}
