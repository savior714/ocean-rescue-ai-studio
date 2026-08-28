export enum GamePhase {
  BOOT = "BOOT",
  PROFILE_CHOICE = "PROFILE_CHOICE",
  MISSION_SELECT = "MISSION_SELECT",
  GUP_SELECT = "GUP_SELECT",
  GUP_GARAGE = "GUP_GARAGE",
  LAUNCH = "LAUNCH",
  TRAVEL = "TRAVEL",
  RESCUE_ACTIVE = "RESCUE_ACTIVE",
  RESCUE_CARE = "RESCUE_CARE",
  RESCUE_CELEBRATION = "RESCUE_CELEBRATION",
  MISSION_SUCCESS = "MISSION_SUCCESS",
  LOGBOOK = "LOGBOOK",
  ECO_QUIZ = "ECO_QUIZ",
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
  badge: string;
  funTrivia: string[];
  depthMeters: number;
  careTreatName: string;
  careTreatIcon: string;
  rewardStars: number;
}

export interface GupData {
  id: string;
  name: string;
  description: string;
  color: string;
  accentColor: string;
  type: "speed" | "balanced" | "heavy" | "claw" | "medical";
  icon: string;
  baseSpeedMultiplier: number;
  armorLabel: string;
  specialAbility: string;
  unlockedByDefault?: boolean;
  unlockRequirement?: string;
}

export interface GupUpgrades {
  speedLevel: number; // 1..5
  shieldLevel: number; // 1..5
  sonarLevel: number; // 1..5
  lightLevel: number; // 1..5
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
  kind: "coral" | "rock" | "jellyfish" | "mine" | "plastic_bag";
  color: string;
  name: string;
  hitAnim?: number;
}

export interface BoostRing {
  id: string;
  worldX: number;
  y: number;
  passed: boolean;
  radius: number;
}

export interface StarCollectible {
  id: string;
  worldX: number;
  y: number;
  collected: boolean;
  size: number;
  glowPhase: number;
}

export interface SonarEchoPoint {
  id: string;
  worldX: number;
  y: number;
  discovered: boolean;
  type: "signal" | "creature" | "waypoint" | "star_cluster";
  name: string;
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

export interface RescueVitals {
  heartRate: number; // BPM
  stressLevel: number; // %
  oxygenLevel: number; // %
  scanned: boolean;
  medicineSprayed: number; // 0..100%
  treatFedCount: number; // 0..3
  healthPercent: number; // 0..100%
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  animalIcon: string;
  rewardStars: number;
}

export interface MissionProgressRecord {
  completed: boolean;
  rescuedCount: number;
  firstRescuedAt?: string;
  bestStarsEarned?: number;
  readinessAchieved: number;
}

export interface UserStats {
  totalStars: number;
  completedMissions: Record<string, MissionProgressRecord>;
  collectedBadges: string[];
  totalRescuedAnimals: number;
  ecosystemRestoration: number; // 0% -> 100%
  unlockedGups: string[];
  gupUpgrades: Record<string, GupUpgrades>;
  quizMasterUnlocked: boolean;
}
