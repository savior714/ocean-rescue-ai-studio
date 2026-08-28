export interface CelestialBodyData {
  id: string;
  nameKo: string;
  nameEn: string;
  categoryKo: string; // 항성, 암석형 행성, 가스형 거대행성, 얼음형 거대행성, 위성
  icon: string;
  realRadiusKm: number;
  visualRadius: number; // 3D viewport scaled radius
  distanceAU: number; // Distance in AU
  visualDistance: number; // 3D viewport orbital radius
  orbitalPeriodDays: number; // Days to complete 1 orbit around Sun
  rotationPeriodHours: number; // Hours for 1 self-rotation (negative = retrograde)
  eccentricity: number;
  inclinationDeg: number;
  axialTiltDeg: number;
  baseColor: string;
  atmosphereColor?: string;
  hasRings?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  hasClouds?: boolean;
  hasMoon?: boolean;
  shortComparisonKo: string; // 한눈에 보는 직관적 비교
  overviewFactKo: string; // 대표 핵심 특징
  factsKo: string[]; // 어린이 눈높이 꿀잼 지식
  stats: {
    orderFromSun: string;
    orbitTime: string;
    dayLength: string;
    temperature: string;
    moonsCount: string;
    sizeComparison: string;
  };
}

export type TimeSpeedPreset = 0 | 1 | 7 | 30 | 180 | 365;

export interface SimulationState {
  timeDays: number;
  timeSpeedDaysPerSec: number;
  isPaused: boolean;
  focusedBodyId: string | null; // null = solar system overview
  cameraTransitionProgress: number; // 0 to 1
  isTransitioning: boolean;
  cameraDistance: number;
  cameraAzimuth: number;
  cameraElevation: number;
  soundEnabled: boolean;
  selectedSubFocus: 'planet' | 'moon' | 'rings' | null;
}
