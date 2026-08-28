import { CelestialBodyData } from "./space-types";

export const SUN_DATA: CelestialBodyData = {
  id: "sun",
  nameKo: "태양",
  nameEn: "Sun",
  categoryKo: "항성 (스스로 빛을 내는 별)",
  icon: "☀️",
  realRadiusKm: 696340,
  visualRadius: 18,
  distanceAU: 0,
  visualDistance: 0,
  orbitalPeriodDays: 0,
  rotationPeriodHours: 600, // 약 25일
  eccentricity: 0,
  inclinationDeg: 0,
  axialTiltDeg: 7.25,
  baseColor: "#ffaa00",
  atmosphereColor: "#ffdd44",
  shortComparisonKo: "태양계 전체 질량의 99.8%를 차지하는 뜨거운 중심별!",
  overviewFactKo: "지구가 130만 개나 들어갈 수 있을 정도로 거대하며, 표면 온도는 약 5,500°C에 달합니다.",
  factsKo: [
    "태양에서 나온 빛이 지구까지 도착하는 데는 약 8분 20초가 걸려요.",
    "태양 표면에서는 거대한 불꽃 폭발인 '플레어'와 '홍염'이 일어나요.",
    "태양의 강력한 중력이 지구를 포함한 모든 행성들을 붙잡아 돌리고 있어요."
  ],
  stats: {
    orderFromSun: "중심 (0번째)",
    orbitTime: "은하 중심 공전 (약 2억 3천만 년)",
    dayLength: "약 25일~35일 (기체라 부위별로 다름)",
    temperature: "약 5,500°C (중심부는 1,500만°C)",
    moonsCount: "행성 8개 + 왜소행성 다수",
    sizeComparison: "지구 지름의 109배"
  }
};

export const PLANETS_DATA: CelestialBodyData[] = [
  {
    id: "mercury",
    nameKo: "수성",
    nameEn: "Mercury",
    categoryKo: "암석형 행성",
    icon: "🪨",
    realRadiusKm: 2439.7,
    visualRadius: 3.2,
    distanceAU: 0.387,
    visualDistance: 42,
    orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1407.6, // 58.6일
    eccentricity: 0.2056,
    inclinationDeg: 7.0,
    axialTiltDeg: 0.034,
    baseColor: "#9c9c9c",
    shortComparisonKo: "달처럼 수많은 운석 구덩이가 숭숭 뚫린 가장 빠른 행성!",
    overviewFactKo: "태양과 가장 가까워 낮에는 430°C까지 펄펄 끓고, 밤에는 -180°C까지 꽁꽁 얼어붙어요.",
    factsKo: [
      "공기가 거의 없어서 낮과 밤의 온도 차이가 태양계에서 가장 심해요.",
      "태양 주위를 단 88일 만에 가장 쌩쌩 빠르게 한 바퀴 돌아요.",
      "지구의 달처럼 거대한 운석 충돌 구덩이(크레이터)로 가득 차 있어요."
    ],
    stats: {
      orderFromSun: "태양에서 1번째",
      orbitTime: "약 88일 (지구 기준 3달 미만)",
      dayLength: "약 59일 (자전이 매우 느려요)",
      temperature: "낮 430°C / 밤 -180°C",
      moonsCount: "0개 (위성 없음)",
      sizeComparison: "지구의 약 38% (달보다 조금 큼)"
    }
  },
  {
    id: "venus",
    nameKo: "금성",
    nameEn: "Venus",
    categoryKo: "암석형 행성",
    icon: "🟡",
    realRadiusKm: 6051.8,
    visualRadius: 5.6,
    distanceAU: 0.723,
    visualDistance: 64,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5, // 243일 (역자전)
    eccentricity: 0.0067,
    inclinationDeg: 3.39,
    axialTiltDeg: 177.36,
    baseColor: "#e3bb76",
    atmosphereColor: "#f3d999",
    hasClouds: true,
    shortComparisonKo: "두꺼운 독성 구름 온실효과로 태양계에서 가장 뜨거운 행성!",
    overviewFactKo: "밤하늘에서 달 다음으로 밝게 빛나는 '샛별'이지만, 표면 온도는 465°C에 달해요.",
    factsKo: [
      "두꺼운 이산화탄소 대기 온실효과 때문에 수성보다 태양에서 멀어도 훨씬 더 뜨거워요.",
      "다른 행성들과 반대 방향(시계 방향)으로 거꾸로 천천히 자전해요.",
      "금성에서는 태양이 서쪽에서 떠서 동쪽으로 져요!"
    ],
    stats: {
      orderFromSun: "태양에서 2번째",
      orbitTime: "약 225일 (지구 기준 7.5개월)",
      dayLength: "약 243일 (공전보다 하루가 더 길어요!)",
      temperature: "약 465°C (납도 녹이는 고온)",
      moonsCount: "0개 (위성 없음)",
      sizeComparison: "지구의 약 95% (지구의 쌍둥이 크기)"
    }
  },
  {
    id: "earth",
    nameKo: "지구",
    nameEn: "Earth",
    categoryKo: "암석형 행성 (푸른 오아시스)",
    icon: "🌍",
    realRadiusKm: 6371.0,
    visualRadius: 6.0,
    distanceAU: 1.0,
    visualDistance: 92,
    orbitalPeriodDays: 365.25,
    rotationPeriodHours: 23.934,
    eccentricity: 0.0167,
    inclinationDeg: 0.0,
    axialTiltDeg: 23.44,
    baseColor: "#2b65ec",
    atmosphereColor: "#64b5f6",
    hasClouds: true,
    hasMoon: true,
    shortComparisonKo: "액체 물과 산소가 풍부하여 유일하게 생명체가 살아 숨 쉬는 우리 집!",
    overviewFactKo: "우주에서 가장 아름다운 푸른 보석 행성으로, 하나의 다정한 달이 주위를 돌고 있어요.",
    factsKo: [
      "표면의 71%가 바다로 덮여 있어 우주에서 보면 푸른 대리석처럼 보여요.",
      "23.5도 기울어진 축 덕분에 아름다운 봄·여름·가을·겨울 사계절이 생겨요.",
      "지구 주위를 도는 달은 항상 지구에게 같은 얼굴(앞면)만 보여준답니다."
    ],
    stats: {
      orderFromSun: "태양에서 3번째",
      orbitTime: "365.25일 (1년)",
      dayLength: "24시간 (하루)",
      temperature: "평균 약 15°C (살기 딱 좋은 온도)",
      moonsCount: "1개 (달 · Moon)",
      sizeComparison: "기준 (지름 12,742 km)"
    }
  },
  {
    id: "mars",
    nameKo: "화성",
    nameEn: "Mars",
    categoryKo: "암석형 행성 (붉은 사막)",
    icon: "🔴",
    realRadiusKm: 3389.5,
    visualRadius: 4.0,
    distanceAU: 1.524,
    visualDistance: 122,
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.62,
    eccentricity: 0.0934,
    inclinationDeg: 1.85,
    axialTiltDeg: 25.19,
    baseColor: "#cc5533",
    atmosphereColor: "#e57373",
    shortComparisonKo: "산화철 먼지로 붉게 빛나는 사막 행성! 미래 탐사의 핵심 목적지!",
    overviewFactKo: "에베레스트의 3배 높이인 태양계 최대 화산 '올림포스 산'과 거대한 협곡이 있어요.",
    factsKo: [
      "토양에 붉은 녹(산화철) 성분이 많아서 하늘에서도 붉게 반짝여요.",
      "남극과 북극에는 얼음과 드라이아이스로 된 '극관'이 있어 계절마다 크기가 변해요.",
      "지구의 24시간과 아주 비슷한 약 24시간 37분의 자전 주기를 가져요."
    ],
    stats: {
      orderFromSun: "태양에서 4번째",
      orbitTime: "약 687일 (지구 기준 1.9년)",
      dayLength: "약 24시간 37분 (지구와 매우 비슷)",
      temperature: "평균 -63°C (최저 -140°C)",
      moonsCount: "2개 (포보스, 데이모스)",
      sizeComparison: "지구의 약 53% (지구의 절반 크기)"
    }
  },
  {
    id: "jupiter",
    nameKo: "목성",
    nameEn: "Jupiter",
    categoryKo: "가스형 거대행성 (태양계의 거인)",
    icon: "🟠",
    realRadiusKm: 69911,
    visualRadius: 13.5,
    distanceAU: 5.204,
    visualDistance: 175,
    orbitalPeriodDays: 4332.59,
    rotationPeriodHours: 9.925,
    eccentricity: 0.0484,
    inclinationDeg: 1.30,
    axialTiltDeg: 3.13,
    baseColor: "#d39c63",
    atmosphereColor: "#e6c280",
    hasClouds: true,
    shortComparisonKo: "지구 1,300개가 쏙 들어가는 태양계에서 가장 거대한 왕 행성!",
    overviewFactKo: "지구보다 큰 초대형 소용돌이 폭풍인 '대적점(Great Red Spot)'을 품고 있어요.",
    factsKo: [
      "태양계 다른 모든 행성을 다 합친 것보다 2.5배나 더 무겁고 거대해요.",
      "거대한 크기에도 불구하고 단 10시간 만에 한 바퀴를 도는 초고속 자전을 해요.",
      "가니메데, 유로파 등 95개 이상의 신비로운 위성들을 거느리고 있어요."
    ],
    stats: {
      orderFromSun: "태양에서 5번째",
      orbitTime: "약 11.86년 (지구 시간 12년)",
      dayLength: "약 9시간 55분 (초고속 자전)",
      temperature: "구름 상층부 약 -110°C",
      moonsCount: "95개 확인 (가니메데, 유로파 등)",
      sizeComparison: "지구 지름의 11.2배 (부피는 1300배)"
    }
  },
  {
    id: "saturn",
    nameKo: "토성",
    nameEn: "Saturn",
    categoryKo: "가스형 거대행성 (고리의 마술사)",
    icon: "🪐",
    realRadiusKm: 58232,
    visualRadius: 11.2,
    distanceAU: 9.582,
    visualDistance: 232,
    orbitalPeriodDays: 10759.22,
    rotationPeriodHours: 10.656,
    eccentricity: 0.0541,
    inclinationDeg: 2.48,
    axialTiltDeg: 26.73,
    baseColor: "#e2bf7d",
    atmosphereColor: "#f5deb3",
    hasRings: true,
    ringInnerRadius: 15,
    ringOuterRadius: 28,
    shortComparisonKo: "얼음과 암석 조각으로 이루어진 눈부시게 아름다운 거대 고리 행성!",
    overviewFactKo: "밀도가 물보다 낮아서 만약 거대한 우주 바다가 있다면 물 위에 둥둥 뜰 수 있어요!",
    factsKo: [
      "토성의 환상적인 고리는 수많은 얼음 덩어리와 우주 암석 조각들이 반사하는 빛이에요.",
      "고리의 너비는 수만 킬로미터에 달하지만, 두께는 약 10미터~1킬로미터로 매우 얇아요.",
      "타이탄이라는 두꺼운 대기를 가진 태양계 2위 크기의 신비로운 위성을 가지고 있어요."
    ],
    stats: {
      orderFromSun: "태양에서 6번째",
      orbitTime: "약 29.46년 (지구 시간 약 30년)",
      dayLength: "약 10시간 33분 (빠른 자전)",
      temperature: "구름 상층부 약 -140°C",
      moonsCount: "146개 확인 (태양계 1위 위성 부자)",
      sizeComparison: "지구 지름의 9.4배"
    }
  },
  {
    id: "uranus",
    nameKo: "천왕성",
    nameEn: "Uranus",
    categoryKo: "얼음형 거대행성 (누워서 도는 푸른 행성)",
    icon: "🩵",
    realRadiusKm: 25362,
    visualRadius: 7.8,
    distanceAU: 19.201,
    visualDistance: 285,
    orbitalPeriodDays: 30685.4,
    rotationPeriodHours: -17.24, // 97.77도 기울기 (누워서 회전)
    eccentricity: 0.0472,
    inclinationDeg: 0.77,
    axialTiltDeg: 97.77,
    baseColor: "#72d5d8",
    atmosphereColor: "#a7f3d0",
    hasRings: true,
    ringInnerRadius: 10,
    ringOuterRadius: 13,
    shortComparisonKo: "자전축이 98도나 옆으로 누워 공처럼 데굴데굴 구르며 도는 차가운 얼음 거인!",
    overviewFactKo: "메탄 가스가 붉은빛을 흡수해 신비로운 청록색(에메랄드빛)을 띱니다.",
    factsKo: [
      "자전축이 거의 90도 이상 누워 있어 한쪽 극지방은 42년 동안 낮, 42년 동안 밤이 지속돼요.",
      "태양계에서 가장 차가운 대기 기온(영하 -224°C)을 기록한 극저온 행성이에요.",
      "눈에 잘 보이지 않는 13개의 얇고 어두운 세로 방향 고리를 가지고 있어요."
    ],
    stats: {
      orderFromSun: "태양에서 7번째",
      orbitTime: "약 84년 (사람의 일생과 비슷)",
      dayLength: "약 17시간 14분 (역방향 눕방 자전)",
      temperature: "최저 -224°C (극저온 얼음 행성)",
      moonsCount: "28개 확인 (미란다, 아리엘 등)",
      sizeComparison: "지구 지름의 4.0배"
    }
  },
  {
    id: "neptune",
    nameKo: "해왕성",
    nameEn: "Neptune",
    categoryKo: "얼음형 거대행성 (폭풍의 심해 행성)",
    icon: "🔵",
    realRadiusKm: 24622,
    visualRadius: 7.5,
    distanceAU: 30.047,
    visualDistance: 338,
    orbitalPeriodDays: 60189.0,
    rotationPeriodHours: 16.11,
    eccentricity: 0.0086,
    inclinationDeg: 1.77,
    axialTiltDeg: 28.32,
    baseColor: "#2750e0",
    atmosphereColor: "#38bdf8",
    shortComparisonKo: "시속 2,000km가 넘는 태양계 최강의 초음속 폭풍이 몰아치는 푸른 보석!",
    overviewFactKo: "태양계의 가장 바깥을 지키는 행성으로, 태양을 한 바퀴 도는 데 무려 165년이 걸려요.",
    factsKo: [
      "음속보다 빠른 시속 2,100km의 맹렬한 폭풍 소용돌이가 휘몰아쳐요.",
      "태양에서 너무 멀어 망원경 없이는 절대 볼 수 없고, 수학적 계산으로 먼저 발견되었어요.",
      "거대한 위성 '트리톤'은 질소 화산이 얼음을 뿜어내는 신기한 곳이에요."
    ],
    stats: {
      orderFromSun: "태양에서 8번째 (가장 먼 행성)",
      orbitTime: "약 164.8년 (지구 시간 약 165년)",
      dayLength: "약 16시간 6분",
      temperature: "평균 약 -214°C",
      moonsCount: "16개 확인 (트리톤 등)",
      sizeComparison: "지구 지름의 3.9배"
    }
  }
];

export const MOON_DATA = {
  id: "moon",
  nameKo: "달",
  nameEn: "Moon (Luna)",
  categoryKo: "지구의 천연 위성",
  icon: "🌕",
  realRadiusKm: 1737.4,
  visualRadius: 1.6,
  orbitalPeriodDays: 27.32,
  distanceFromEarthVisual: 14.5,
  shortComparisonKo: "지구 곁을 45억 년 동안 묵묵히 지켜온 우리와 가장 가까운 우주 친구!",
  overviewFactKo: "인간이 직접 발을 디뎌본 유일한 외계 천체로, 달의 중력이 지구의 밀물과 썰물을 만들어요.",
  factsKo: [
    "자전 주기와 공전 주기가 27.3일로 똑같아서 항상 지구에는 앞면만 보여줘요.",
    "낮에는 120°C까지 뜨겁고, 밤에는 -130°C까지 차가워져요.",
    "대기가 없어 바람이나 비가 오지 않아서 닐 암스트롱이 남긴 첫 발자국이 지금도 그대로 남아있어요."
  ],
  stats: {
    orbitTarget: "지구 공전",
    orbitTime: "약 27.3일",
    dayLength: "약 27.3일 (동주기 자전)",
    temperature: "낮 120°C / 밤 -130°C",
    distanceFromEarth: "약 384,400 km",
    sizeComparison: "지구의 약 27% (지구 지름의 1/4)"
  }
};
