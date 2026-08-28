import { MissionData, GupData, QuizQuestion } from "./types";

export const MISSIONS: MissionData[] = [
  {
    id: "sea-turtle",
    title: "산호초 바다거북 구출 작전",
    subtitle: "Coral Reef Sea Turtle Rescue (Laser Cutter)",
    companion: "페소 (Peso)",
    companionAvatar: "🐧",
    summary: "산호초 사이에서 버려진 폐어망과 밧줄에 엉킨 바다거북이를 정밀 레이저로 구출하고 치료하세요!",
    environment: "coral-reef",
    animalName: "푸른바다거북 (Green Sea Turtle)",
    animalIcon: "🐢",
    briefing: "옥토경보 발령! 산호초 지대 35m 수심에서 아기 바다거북이가 버려진 어망과 밧줄에 엉켜 숨을 쉬러 올라가지 못하고 있습니다! 정밀 레이저 커터로 신속히 밧줄을 자르고 회복 치료를 진행해주세요!",
    situation: "바다거북이가 3중 그물과 밧줄에 묶여 호흡 곤란 상태입니다!",
    tutorial: "엉킨 밧줄을 터치하거나 스와이프하여 레이저로 정밀 절단하세요!",
    toolLabel: "정밀 레이저 절단기",
    targetLabel: "엉킨 폐어망 밧줄",
    depthMeters: 35,
    careTreatName: "해초 비타민 젤리",
    careTreatIcon: "🌿",
    rewardStars: 50,
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
    rewardStars: 60,
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
    toolLabel: "고출력 마그넷 견인 와이어",
    targetLabel: "대형 해양 폐기물 컨테이너",
    depthMeters: 180,
    careTreatName: "크릴새우 비타민 젤리",
    careTreatIcon: "🦐",
    rewardStars: 80,
    dialogues: [
      "견인 와이어 체결! 첫 번째 대형 부표 분리 성공!",
      "좋은 솜씨입니다! 두 번째 플라스틱 폐기물도 안전하게 제거되었습니다!",
      "옥토 구조대 임무 완수! 아기 고래에게 진정 치료를 해줍시다!"
    ],
    ecologyFact: "혹등고래는 수천 킬로미터에 걸쳐 울려 퍼지는 아름다운 노래로 대화하며, 지구상에서 가장 지능이 높은 해양 포유류 중 하나입니다.",
    funTrivia: [
      "혹등고래는 숨구멍으로 물을 뿜을 때 최대 6m 높이까지 물보라를 뿜어냅니다.",
      "아기 고래는 태어날 때부터 몸무게가 1톤이 넘으며 하루에 400리터의 모유를 마셔요.",
      "지느러미가 전체 몸길이의 3분의 1에 달해 '큰 날개를 가진 바다의 거인'이라 불려요."
    ],
    badge: "심해 거인 수호 금훈장"
  },
  {
    id: "sea-otter",
    title: "연안 다시마밭 아기 해달 구출 작전",
    subtitle: "Coastal Kelp Bed Sea Otter Rescue (Gentle Detangle)",
    companion: "셸링턴 (Shellington)",
    companionAvatar: "🦦",
    summary: "파도에 휩쓸려 비닐 쓰레기에 얽힌 아기 해달을 조심스럽게 풀어주고 영양 만점 조개를 선물하세요!",
    environment: "kelp-shore",
    animalName: "북방 아기 해달 (Sea Otter Pup)",
    animalIcon: "🦦",
    briefing: "옥토 대원들! 연안 수심 20m 다시마밭에서 아기 해달이 떠내려온 비닐봉지와 포장 끈에 얽혀 엄마를 찾고 있습니다. 부드러운 손길로 끈을 풀고 체온을 지켜주세요!",
    situation: "아기 해달이 비닐 끈에 얽혀 털을 다듬지 못하고 있습니다!",
    tutorial: "얽힌 비닐 매듭을 차례대로 탭하여 조심스럽게 풀어주세요!",
    toolLabel: "섬세한 매듭 해제 핀셋",
    targetLabel: "얽힌 비닐 포장 끈",
    depthMeters: 20,
    careTreatName: "신선한 참전복 간식",
    careTreatIcon: "🦪",
    rewardStars: 70,
    dialogues: [
      "매듭 하나가 풀렸어요! 해달이 안도하고 있습니다.",
      "두 번째 비닐 끈도 깨끗하게 제거 완료!",
      "구출 성공! 배 위에 조개를 올려 맛있게 먹을 수 있게 케어해줍시다!"
    ],
    ecologyFact: "해달은 다시마를 갉아먹는 성게를 잡아먹어 다시마 숲과 해양 생태계의 균형을 지키는 핵심 생물입니다.",
    funTrivia: [
      "해달은 물 위에 떠서 잘 때 떠내려가지 않으려고 서로 손을 꼭 잡거나 다시마를 몸에 감아요.",
      "가장 좋아하는 조개 깨기용 '전용 돌멩이'를 겨드랑이 주머니에 넣고 다닙니다.",
      "동물 중 가장 빽빽한 털(1제곱센티미터당 약 10만 가닥)을 가지고 있어 물이 피부에 닿지 않아요."
    ],
    badge: "다시마 숲 수호자 은훈장"
  },
  {
    id: "giant-squid",
    title: "심해 암흑대 대왕오징어 소나 탐사 작전",
    subtitle: "Midnight Abyss Giant Squid Bio-Scan",
    companion: "콰지 (Kwazii)",
    companionAvatar: "🐱",
    summary: "수심 400m 심해 암흑대에서 거대한 대왕오징어의 조난 음파를 추적하고 치료 소나를 발사하세요!",
    environment: "abyssal-zone",
    animalName: "심해 대왕오징어 (Architeuthis Dux)",
    animalIcon: "🦑",
    briefing: "으르렁! 전설의 바다 괴물 크라켄으로 불리던 대왕오징어가 심해 광물 케이블에 걸려 신음하고 있다냥! 탐험선의 강력한 고주파 소나 펄스로 케이블을 분해하고 바다로 돌려보내자냥!",
    situation: "대왕오징어가 심해 케이블 파편에 걸려 발광 신호를 보내고 있습니다!",
    tutorial: "광물 케이블 연결부를 탭하여 고출력 소나 에너지로 파쇄하세요!",
    toolLabel: "고주파 소나 펄스 건",
    targetLabel: "심해 광물 케이블 파편",
    depthMeters: 400,
    careTreatName: "발광 플랑크톤 젤",
    careTreatIcon: "✨",
    rewardStars: 100,
    dialogues: [
      "소나 펄스 명중! 첫 번째 케이블 파쇄 완료다냥!",
      "훌륭하다냥! 거대한 촉수가 자유를 찾았다냥!",
      "심해의 거인이 빛을 되찾았다냥! 얼른 원격 바이탈 스캔으로 상태를 확인하자냥!"
    ],
    ecologyFact: "대왕오징어는 지구상에서 가장 큰 무척추동물로, 사람 머리만 한 거대한 눈을 가지고 있어 칠흑 같은 심해의 미세한 빛을 감지합니다.",
    funTrivia: [
      "대왕오징어의 눈 지름은 최대 30cm로 동물계에서 가장 큽니다.",
      "몸길이가 최대 13미터에 달하며 깊은 바다의 향유고래와 라이벌 관계입니다.",
      "심해의 높은 수압을 견디기 위해 근육 속에 염화암모늄을 함유하여 부력을 유지해요."
    ],
    badge: "심해 암흑대 정복자 대훈장"
  }
];

export const GUPS: GupData[] = [
  {
    id: "gup-a",
    name: "탐험선 A (GUP-A)",
    description: "바나클 대장의 전용 탐험선. 유선형 아귀 형태로 기동성이 우수하며 터보 제트 추진기가 장착되어 있습니다.",
    color: "#ffc107",
    accentColor: "#ff9800",
    type: "speed",
    icon: "🚤",
    baseSpeedMultiplier: 1.0,
    armorLabel: "표준 티타늄 합금",
    specialAbility: "터보 부스트 가속 & 고성능 소나",
    unlockedByDefault: true
  },
  {
    id: "gup-b",
    name: "탐험선 B (GUP-B)",
    description: "콰지의 상어형 초고속 탐험선. 날렵한 유선형 바디로 급선회와 신속한 현장 도착이 가능합니다.",
    color: "#ff7043",
    accentColor: "#d84315",
    type: "speed",
    icon: "🦈",
    baseSpeedMultiplier: 1.25,
    armorLabel: "경량 알루미늄 합금",
    specialAbility: "샤크 대시 급가속 & 날렵한 방향전환",
    unlockedByDefault: true
  },
  {
    id: "gup-c",
    name: "탐험선 C (GUP-C)",
    description: "트윅이 개조한 강력한 고래형 견인선. 강력한 집게발과 고출력 윈치가 장착되어 무거운 장애물을 제거합니다.",
    color: "#42a5f5",
    accentColor: "#1565c0",
    type: "heavy",
    icon: "🐋",
    baseSpeedMultiplier: 0.95,
    armorLabel: "강화 복합 장갑",
    specialAbility: "파워 크레인 견인 & 고압 에어 블래스트",
    unlockedByDefault: true
  },
  {
    id: "gup-d",
    name: "탐험선 D (GUP-D)",
    description: "다목적 곰치형 심해 잠수정. 두 개의 정밀 집게 드릴과 심해 내압 쉘로 극한 환경을 탐사합니다.",
    color: "#ab47bc",
    accentColor: "#6a1b9a",
    type: "claw",
    icon: "🤿",
    baseSpeedMultiplier: 1.05,
    armorLabel: "초심해 내압 장갑",
    specialAbility: "듀얼 드릴 암 & 탐사 서치라이트",
    unlockedByDefault: false,
    unlockRequirement: "미션 2개 완료 시 해금"
  },
  {
    id: "gup-e",
    name: "탐험선 E (GUP-E)",
    description: "페소의 의료 구급 탐험선. 생물 진료실과 구급 캡슐이 탑재되어 부상당한 해양 생물을 신속히 치료합니다.",
    color: "#26a69a",
    accentColor: "#00695c",
    type: "medical",
    icon: "🚑",
    baseSpeedMultiplier: 1.1,
    armorLabel: "생체 보호 바이오 쉘",
    specialAbility: "원격 바이탈 스캐너 & 해양 케어 키트",
    unlockedByDefault: false,
    unlockRequirement: "미션 3개 완료 시 해금"
  }
];

export const ECO_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "바다거북은 숨을 쉬기 위해 어디로 올라와야 할까요?",
    options: ["물 위 수면", "모래 속", "산호초 동굴", "심해 해구"],
    correctIndex: 0,
    explanation: "바다거북은 아가미가 아닌 허파(폐)로 숨을 쉬기 때문에 주기적으로 물 위로 올라와 공기를 마셔야 합니다.",
    animalIcon: "🐢",
    rewardStars: 20
  },
  {
    id: "q2",
    question: "꽃게가 냄새와 맛을 느끼는 감각 기관은 어디에 있을까요?",
    options: ["등껍질", "다리 끝의 감각 털", "눈", "배딱지"],
    correctIndex: 1,
    explanation: "꽃게는 다리 끝에 미세한 화학 감각 털이 있어 바닥을 짚으며 맛과 냄새를 느낍니다.",
    animalIcon: "🦀",
    rewardStars: 20
  },
  {
    id: "q3",
    question: "혹등고래가 수천 킬로미터 떨어진 친구와 소통하는 특별한 방법은?",
    options: ["바다거품 만들기", "빛 깜빡이기", "아름다운 심해 고래 노래", "꼬리로 바위 두드리기"],
    correctIndex: 2,
    explanation: "혹등고래는 복잡하고 아름다운 '고래 노래(Whale Song)'를 불러 수중에서 먼 거리까지 소통합니다.",
    animalIcon: "🐋",
    rewardStars: 20
  },
  {
    id: "q4",
    question: "해달이 잠을 잘 때 물에 떠내려가지 않기 위해 하는 귀여운 행동은?",
    options: ["돌멩이를 꼭 쥐기", "서로 손을 잡거나 다시마를 몸에 감기", "물속에 머리 박기", "모래 속에 숨기"],
    correctIndex: 1,
    explanation: "해달은 파도에 떠내려가지 않도록 서로 손을 꼭 잡거나 미역/다시마를 온몸에 둘둘 감고 자요!",
    animalIcon: "🦦",
    rewardStars: 20
  },
  {
    id: "q5",
    question: "대왕오징어가 칠흑 같은 어두운 심해에서도 사물을 볼 수 있는 비결은?",
    options: ["사람 머리만 한 거대한 눈 (지름 약 30cm)", "더듬이", "후각", "초음파"],
    correctIndex: 0,
    explanation: "대왕오징어는 동물계에서 가장 큰 거대한 눈을 가지고 있어 심해의 미세한 발광 생물 빛까지 감지합니다.",
    animalIcon: "🦑",
    rewardStars: 20
  },
  {
    id: "q6",
    question: "바다에 버려진 폐그물과 플라스틱 쓰레기를 줄이기 위해 우리가 실천할 수 있는 것은?",
    options: ["일회용 플라스틱 줄이기 & 올바른 분리배출", "해변에 쓰레기 버리기", "바다에 비닐 던지기", "생물 괴롭히기"],
    correctIndex: 0,
    explanation: "일회용품을 줄이고 분리배출을 잘하면 바다로 흘러 들어가는 해양 플라스틱을 막아 소중한 해양 동물들을 지킬 수 있어요!",
    animalIcon: "🌊",
    rewardStars: 20
  }
];
