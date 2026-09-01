import { MissionData, GupData } from "./types";

export const MISSIONS: MissionData[] = [
  {
    id: "sea-turtle",
    title: "산호초 바다거북 구출 작전",
    subtitle: "Coral Reef Sea Turtle Rescue (Precision Cutter)",
    companion: "페소 (Peso)",
    companionAvatar: "🐧",
    summary: "산호초 사이에서 버려진 폐어망과 밧줄에 엉킨 아기 바다거북이를 구출하고 건강을 보살펴주세요!",
    environment: "coral-reef",
    animalName: "푸른바다거북 (Green Sea Turtle)",
    animalIcon: "🐢",
    briefing: "옥토경보 발령! 산호초 지대 35m 수심에서 아기 바다거북이가 버려진 어망과 밧줄에 엉켜 숨을 쉬러 올라가지 못하고 있습니다! 탐험선을 조종하여 산호초 수로를 통과하고, 정밀 레이저 커터로 밧줄을 잘라주세요!",
    situation: "바다거북이가 3중 그물과 밧줄에 묶여 호흡 곤란 상태입니다!",
    tutorial: "엉킨 밧줄을 터치하거나 스와이프하여 레이저로 정밀 절단하세요!",
    toolLabel: "정밀 레이저 절단기",
    targetLabel: "엉킨 폐어망 밧줄",
    depthMeters: 35,
    careTreatName: "해초 비타민 젤리",
    careTreatIcon: "🌿",
    dialogues: [
      "첫 번째 밧줄 절단 완료! 지느러미가 풀렸어요!",
      "좋아요! 등껍질의 위험한 폐그물도 제거되었어요!",
      "완벽한 구조 작전! 바이탈을 점검하고 회복 치료를 시작합시다!"
    ],
    ecologyFact: "바다거북은 아가미가 아닌 폐로 숨을 쉬기 때문에 20~30분마다 물 위로 올라와야 해요. 폐그물은 거북이에게 치명적인 위협이 됩니다.",
    funTrivia: [
      "바다거북은 지구상에서 1억 년 이상 살아온 고대 생물입니다.",
      "눈가에 눈물처럼 보이는 소금 분비샘이 있어 바닷물의 염분을 배출해요.",
      "자신이 태어난 모래사장으로 수천 킬로미터를 헤엄쳐 돌아가 알을 낳습니다."
    ],
    badge: "산호초 거북 수호 훈장"
  },
  {
    id: "crab",
    title: "다시마 숲 아기 꽃게 구출 작전",
    subtitle: "Kelp Forest Baby Crab Rescue (Power Claw)",
    companion: "트윅 (Tweak)",
    companionAvatar: "🐰",
    summary: "다시마 숲 깊은 곳에서 무너진 해저 바위에 갇힌 아기 꽃게를 집게발로 치워 구출하세요!",
    environment: "kelp-forest",
    animalName: "알락꽃게 (Spotted Shore Crab)",
    animalIcon: "🦀",
    briefing: "긴급 상황이야! 강한 해류로 바위가 무너져 아기 꽃게의 입구가 완전히 막혀버렸어! 탐험선의 파워 집게발을 이용해 무거운 바위를 안전하게 들어 옮겨줘!",
    situation: "무거운 해저 바위 3개가 아기 꽃게를 가두고 있어요!",
    tutorial: "바위를 터치하여 드래그하거나 탭해 바깥으로 안전하게 치워주세요!",
    toolLabel: "초강력 파워 집게발",
    targetLabel: "무너진 해저 바위",
    depthMeters: 65,
    careTreatName: "유기질 조개 간식",
    careTreatIcon: "🐚",
    dialogues: [
      "치직! 첫 번째 바위를 안전하게 들어올려 치웠어!",
      "대단해! 두 번째 바위도 제거 완료!",
      "야호! 아기 꽃게가 무사히 구출되었어! 영양 간식을 챙겨주자!"
    ],
    ecologyFact: "꽃게는 다리 끝의 감각 털로 냄새와 맛을 느끼며, 다시마 숲의 유기물을 정화하는 바다의 청소부 역할을 합니다.",
    funTrivia: [
      "꽃게는 위협을 느끼면 옆으로 아주 빠르게 질주하며 모래 속으로 3초 만에 숨어요.",
      "단단한 껍질이 자라지 않아서 성장할 때마다 탈피(허물 벗기)를 반복합니다.",
      "앞 집게발의 힘은 자기 몸무게의 30배가 넘는 물체를 들어 올릴 수 있어요."
    ],
    badge: "다시마 숲 청소부 수호 훈장"
  },
  {
    id: "young-whale",
    title: "심해 해구 아기 고래 구출 작전",
    subtitle: "Deep Trench Baby Whale Rescue (Magnetic Tow)",
    companion: "바나클 대장 (Captain Barnacles)",
    companionAvatar: "🐻‍❄️",
    summary: "빛이 닿지 않는 심해 해구에서 대형 해양 폐기물에 걸린 아기 혹등고래를 마그넷으로 견인 구출하세요!",
    environment: "deep-trench",
    animalName: "아기 혹등고래 (Baby Humpback Whale)",
    animalIcon: "🐋",
    briefing: "옥토포드 전원 주목! 수심 180m 심해 해구에서 길을 잃은 아기 혹등고래가 대형 플라스틱 폐기물에 얽혀 있습니다. 고출력 마그넷 견인 와이어로 쓰레기를 제거하십시오!",
    situation: "아기 혹등고래가 대형 해양 폐기물과 로프에 묶여 있습니다!",
    tutorial: "폐기물을 탭하여 마그넷 와이어를 체결하고 뒤로 당겨 견인 분리하세요!",
    toolLabel: "고장력 마그넷 견인기",
    targetLabel: "대형 해양 폐기물",
    depthMeters: 180,
    careTreatName: "크릴새우 비타민 칵테일",
    careTreatIcon: "🦐",
    dialogues: [
      "마그넷 와이어 잠금 완료! 엔진 최대 출력으로 당기십시오!",
      "폐기물 컨테이너 분리 성공! 고래의 움직임이 자유로워졌습니다!",
      "구조 임무 완수! 아기 고래에게 크릴 영양식을 전달하십시오!"
    ],
    ecologyFact: "혹등고래는 긴 가슴지느러미로 바다를 우아하게 유영하며, 아름다운 노랫소리로 수백 킬로미터 떨어진 동료들과 소통합니다.",
    funTrivia: [
      "혹등고래의 꼬리 무늬는 인간의 지문처럼 개체마다 모두 다릅니다.",
      "새끼는 태어나자마자 엄마 고래의 도움을 받아 수면 위로 첫 숨을 쉬러 올라갑니다.",
      "하루에 최대 1.5톤의 크릴새우와 작은 물고기를 섭취합니다."
    ],
    badge: "심해 해구 고래 수호 훈장"
  }
];

export const GUPS: GupData[] = [
  {
    id: "gup-a",
    name: "탐험선 A호 (GUP-A)",
    description: "아귀를 본뜬 기동형 탐험선. 유연한 선체와 전방 발광 낚싯대 탐조등을 갖추고 있습니다.",
    color: "#ffc107",
    accentColor: "#ff9800",
    type: "balanced",
    icon: "🟡",
    baseSpeedMultiplier: 1.0,
    armorLabel: "표준 기동형 선체",
    specialAbility: "생체 발광 탐조등 & 정밀 레이저"
  },
  {
    id: "gup-b",
    name: "탐험선 B호 (GUP-B)",
    description: "상어를 모티브로 한 초고속 추격형 탐험선. 날렵한 유선형 선체와 강력한 터보 추진력을 자랑합니다.",
    color: "#ff5722",
    accentColor: "#d84315",
    type: "speed",
    icon: "🦈",
    baseSpeedMultiplier: 1.25,
    armorLabel: "고속 추격형 선체",
    specialAbility: "터보 부스트 가속 & 날렵한 선회력"
  },
  {
    id: "gup-c",
    name: "탐험선 C호 (GUP-C)",
    description: "고래상어를 모티브로 한 중장비 견인 탐험선. 강력한 크레인과 견인 마그넷을 장착하고 있습니다.",
    color: "#0288d1",
    accentColor: "#01579b",
    type: "heavy",
    icon: "🐳",
    baseSpeedMultiplier: 0.9,
    armorLabel: "초강력 강화 장갑",
    specialAbility: "고출력 마그넷 견인 & 중장비 크레인"
  }
];
