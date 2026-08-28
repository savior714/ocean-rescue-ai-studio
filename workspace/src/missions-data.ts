import { MissionData, GupData, QuizQuestion } from "./types";

export const MISSIONS: MissionData[] = [
  {
    id: "sea-turtle",
    title: "산호초 바다거북 구출 작전",
    subtitle: "Coral Reef Sea Turtle Rescue",
    companion: "페소 (Peso)",
    companionAvatar: "🐧",
    summary: "산호초 사이에서 버려진 어망과 밧줄에 엉킨 바다거북이를 구출해주세요!",
    environment: "coral-reef",
    animalName: "푸른바다거북 (Green Sea Turtle)",
    animalIcon: "🐢",
    briefing: "옥토경보 발령! 산호초 지대 35m 수심에서 아기 바다거북이가 버려진 어망과 밧줄에 엉켜 숨을 쉬러 올라가지 못하고 있습니다! 레이저 커터로 신속히 밧줄을 잘라주세요!",
    situation: "바다거북이가 3중 그물과 밧줄에 묶여 있습니다!",
    tutorial: "엉킨 밧줄을 탭하거나 스와이프하여 레이저로 잘라내세요!",
    toolLabel: "정밀 레이저 절단기",
    targetLabel: "엉킨 폐어망 밧줄",
    depthMeters: 35,
    careTreatName: "해초 비타민 젤리",
    careTreatIcon: "🌿",
    dialogues: [
      "첫 번째 밧줄 절단 완료! 지느러미가 풀렸어요!",
      "좋아요! 등껍질의 위험한 폐그물도 제거되었어요!",
      "완벽한 구조 작전! 바다거북이가 자유롭게 수면으로 숨을 쉬러 올라갑니다!"
    ],
    ecologyFact: "바다거북은 아가미가 아닌 폐로 숨을 쉬기 때문에 20~30분마다 물 위로 올라와야 해요. 폐그물은 거북이에게 치명적인 위험이 됩니다.",
    funTrivia: [
      "바다거북은 지구상에서 1억 년 이상 살아온 고대 생물입니다.",
      "눈가에 눈물처럼 보이는 소금 분비샘이 있어 바닷물의 염분을 배출해요.",
      "자신이 태어난 모래사장으로 수천 킬로미터를 헤엄쳐 돌아가 알을 낳습니다."
    ],
    badge: "산호초 바다거북 수호 훈장"
  },
  {
    id: "crab",
    title: "다시마 숲 아기 꽃게 구출 작전",
    subtitle: "Kelp Forest Baby Crab Rescue",
    companion: "트윅 (Tweak)",
    companionAvatar: "🐰",
    summary: "다시마 숲 깊은 곳에서 무너진 해저 바위에 갇힌 아기 꽃게를 구출하세요!",
    environment: "kelp-forest",
    animalName: "알락꽃게 (Spotted Shore Crab)",
    animalIcon: "🦀",
    briefing: "긴급 상황이야! 해류로 인해 바위가 무너져 아기 꽃게의 안식처 입구가 완전히 막혀버렸어! 탐험선의 파워 집게팔을 이용해 무거운 바위를 안전하게 치워줘!",
    situation: "무거운 해저 바위 3개가 아기 꽃게를 가두고 있어요!",
    tutorial: "바위를 터치하여 드래그하거나 탭해 바깥으로 치워주세요!",
    toolLabel: "초강력 파워 집게발",
    targetLabel: "무너진 해저 바위",
    depthMeters: 65,
    careTreatName: "유기질 조개 간식",
    careTreatIcon: "🐚",
    dialogues: [
      "치직! 첫 번째 바위를 안전하게 들어올려 치웠어!",
      "대단해! 두 번째 바위도 제거 완료!",
      "야호! 아기 꽃게가 무사히 엄마 꽃게 품으로 돌아갔어!"
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
    subtitle: "Deep Trench Baby Whale Rescue",
    companion: "바나클 대장 (Captain Barnacles)",
    companionAvatar: "🐻‍❄️",
    summary: "빛이 닿지 않는 심해 해구에서 대형 해양 쓰레기에 걸린 아기 혹등고래를 견인 구출하세요!",
    environment: "deep-trench",
    animalName: "아기 혹등고래 (Baby Humpback Whale)",
    animalIcon: "🐋",
    briefing: "옥토포드 전원 주목! 수심 180m 심해 해구에서 길을 잃은 아기 혹등고래가 대형 플라스틱 컨테이너와 폐로프에 얽혀 있습니다. 고출력 마그넷 견인 와이어로 쓰레기를 제거하십시오!",
    situation: "아기 혹등고래가 대형 해양 폐기물과 로프에 묶여 있습니다!",
    tutorial: "폐기물을 탭하여 마그넷 와이어를 연결하고 견인하세요!",
    toolLabel: "고출력 마그넷 견인 와이어",
    targetLabel: "대형 해양 폐기물 컨테이너",
    depthMeters: 180,
    careTreatName: "크릴새우 비타민 젤리",
    careTreatIcon: "🦐",
    dialogues: [
      "견인 와이어 체결! 첫 번째 대형 부표 분리 성공!",
      "좋은 솜씨입니다! 두 번째 플라스틱 폐기물도 안전하게 제거되었습니다!",
      "옥토 구조대 임무 완수! 아기 고래가 기쁨의 심해 노래를 부르며 엄마 고래를 향해 유영합니다!"
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
    title: "북극해 유빙 아기 해달 구출 작전",
    subtitle: "Arctic Sea Otter Rescue",
    companion: "콰지 (Kwazii)",
    companionAvatar: "🐱",
    summary: "빙하 지대에서 유출된 검은 기름때로 털이 젖어 체온이 떨어진 아기 해달을 세척하고 구출하세요!",
    environment: "arctic-ocean",
    animalName: "북극 바다해달 (Sea Otter)",
    animalIcon: "🦦",
    briefing: "으르렁! 빙하 균열 지역에서 유출된 기름 오염으로 아기 해달의 털이 뭉쳐버렸어! 털의 공기층이 사라지면 얼음물에서 저체온증에 걸린다구! 생체 세척 폼으로 기름을 깨끗이 닦아내자!",
    situation: "아기 해달 털에 검은 오일 얼룩이 번져 체온이 급격히 떨어지고 있습니다!",
    tutorial: "오일 얼룩 부위를 문지르거나 탭하여 바이오 세척 폼으로 정화하세요!",
    toolLabel: "바이오 세척 폼 분사기",
    targetLabel: "유출된 검은 오일 얼룩",
    depthMeters: 15,
    careTreatName: "성게 영양 단백질",
    careTreatIcon: "🦪",
    dialogues: [
      "좋아! 첫 번째 기름 얼룩이 말끔히 씻겨나갔어!",
      "털의 방수 공기층이 되살아나고 있어! 조금만 더 힘내자!",
      "완벽해! 해달이 뽀송뽀송해져서 조개를 품에 안고 헤엄치기 시작했어!"
    ],
    ecologyFact: "해달은 지방층 대신 1제곱센티미터당 10만 가닥이 넘는 빽빽한 털 사이에 공기를 가두어 혹한의 바다에서 체온을 유지합니다. 기름이 묻으면 치명적이에요.",
    funTrivia: [
      "해달은 물 위에 누워 잘 때 조류에 떠내려가지 않도록 다시마 줄기를 몸에 감고 자요.",
      "배 위에 돌을 올려놓고 단단한 조개와 성게를 깨먹는 똑똑한 도구 사용자입니다.",
      "소중한 도구(돌멩이)를 겨드랑이의 피부 주머니에 쏙 넣고 다닙니다."
    ],
    badge: "북극해 수호 백은훈장"
  },
  {
    id: "giant-squid",
    title: "암흑 심해 대왕오징어 얽힘 구출 작전",
    subtitle: "Abyssal Giant Squid Rescue",
    companion: "대시 (Dashi)",
    companionAvatar: "🐕",
    summary: "빛이 닿지 않는 450m 암흑 심해에서 해저 통신선에 감긴 대왕오징어의 촉수를 정밀 구조하세요!",
    environment: "abyssal-zone",
    animalName: "심해 대왕오징어 (Giant Squid)",
    animalIcon: "🦑",
    briefing: "카메라 센서 감지! 450m 암흑 해구에서 대왕오징어의 긴 촉수가 버려진 해저 케이블에 얽혀 발광 기관이 꺼져가고 있습니다! 심해 전용 초음파 절단기로 케이블을 분리해주세요!",
    situation: "대왕오징어의 2개 긴 촉수가 두꺼운 케이블에 감겨 있습니다!",
    tutorial: "엉킨 케이블 연결부를 탭하여 초음파 진동으로 분리하세요!",
    toolLabel: "초음파 진동 분단기",
    targetLabel: "얽힌 고압 해저 케이블",
    depthMeters: 450,
    careTreatName: "발광 바이오 플랑크톤 젤",
    careTreatIcon: "✨",
    dialogues: [
      "지잉-! 첫 번째 고압 케이블 절단 완료! 촉수가 자유로워졌습니다!",
      "환상적이에요! 두 번째 케이블도 분리되어 피부의 발광 패턴이 다시 켜졌어요!",
      "완벽한 구조! 대왕오징어가 아름다운 생체 발광 빛을 뿜으며 심해 속으로 유영합니다!"
    ],
    ecologyFact: "대왕오징어는 농구공만 한 거대한 눈을 가지고 있어 빛이 전혀 없는 수백 미터 심해에서도 희미한 생체 발광 신호를 감지할 수 있습니다.",
    funTrivia: [
      "대왕오징어의 몸길이는 최대 13m에 달하며 눈 지름만 30cm에 이릅니다.",
      "촉수 흡반에는 날카로운 톱니 모양의 고리가 달려 있어 먹이를 단단히 잡습니다.",
      "몸속에 암모늄 이온을 가득 채워 깊은 바다에서도 가라앉지 않고 중성 부력을 유지합니다."
    ],
    badge: "심해 암흑 수호 다이아훈장"
  }
];

export const GUPS: GupData[] = [
  {
    id: "gup-a",
    name: "탐험선 A (GUP-A)",
    description: "바나클 대장의 만능 탐험선! 안정적인 속도와 뛰어난 조종성",
    color: "#ffca28",
    accentColor: "#26c6da",
    type: "balanced",
    icon: "🚤",
    speedMultiplier: 1.0,
    armorLabel: "표준 티타늄 합금",
    specialAbility: "만능 조종 & 수중 헤드라이트"
  },
  {
    id: "gup-b",
    name: "탐험선 B (GUP-B)",
    description: "콰지의 상어 모양 초고속 탐험선! 날렵한 터보 부스터",
    color: "#ff7043",
    accentColor: "#ffffff",
    type: "speed",
    icon: "🦈",
    speedMultiplier: 1.35,
    armorLabel: "초경량 탄소섬유",
    specialAbility: "터보 부스터 & 민첩한 회피"
  },
  {
    id: "gup-c",
    name: "탐험선 C (GUP-C)",
    description: "고래 형태의 강력한 견인 탐험선! 무거운 장애물 돌파",
    color: "#42a5f5",
    accentColor: "#1565c0",
    type: "heavy",
    icon: "🐋",
    speedMultiplier: 0.9,
    armorLabel: "강화 장갑판",
    specialAbility: "슈퍼 마그넷 견인 와이어"
  },
  {
    id: "gup-d",
    name: "탐험선 D (GUP-D)",
    description: "트윅의 다목적 집게발 탐험선! 미세한 구조 작업에 최적화",
    color: "#ab47bc",
    accentColor: "#e1bee7",
    type: "claw",
    icon: "🦀",
    speedMultiplier: 1.05,
    armorLabel: "다목적 듀얼 프레임",
    specialAbility: "초정밀 파워 집게발"
  },
  {
    id: "gup-e",
    name: "탐험선 E (GUP-E)",
    description: "페소의 구급 탐험선! 다친 해양 생물 긴급 치료 및 스캔",
    color: "#26a69a",
    accentColor: "#80cbc4",
    type: "medical",
    icon: "🐡",
    speedMultiplier: 1.1,
    armorLabel: "생체 적응형 캡슐",
    specialAbility: "바이오 스캐너 & 자동 회복광선"
  },
  {
    id: "gup-x",
    name: "탐험선 X (GUP-X)",
    description: "최강의 무한궤도 옥토 구조선! 험난한 심해 지형 완벽 주파",
    color: "#e53935",
    accentColor: "#ffd54f",
    type: "heavy",
    icon: "🐙",
    speedMultiplier: 1.15,
    armorLabel: "초중장갑 세라믹",
    specialAbility: "암석 분쇄기 & 전방위 실드"
  }
];

export const ECO_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-turtle",
    question: "푸른바다거북이 주기적으로 바다 위 수면으로 올라와야 하는 진짜 이유는 무엇일까요?",
    options: [
      "물고기 친구들과 인사하기 위해",
      "폐로 숨을 쉬기 때문에 산소가 필요해서",
      "등껍질을 햇볕에 말리기 위해",
      "시원한 바람을 쐬기 위해"
    ],
    correctIndex: 1,
    explanation: "바다거북은 파충류로서 아가미가 아닌 허파(폐)로 숨을 쉬기 때문에 20~30분마다 수면 위로 올라와 신선한 공기를 마셔야 합니다.",
    animalIcon: "🐢"
  },
  {
    id: "q-otter",
    question: "해달이 차가운 북극 바다에서도 얼어붙지 않고 체온을 유지하는 비밀은 무엇일까요?",
    options: [
      "두꺼운 지방층을 많이 쌓아두어서",
      "털 사이에 가둔 공기층의 단열 효과",
      "뜨거운 온천 물속에만 살아서",
      "몸에서 전기를 만들어내어 따뜻해서"
    ],
    correctIndex: 1,
    explanation: "해달은 지방층이 없는 대신 1㎠당 10만 가닥이 넘는 빽빽한 털 사이에 공기를 머금어 보온층을 형성합니다. 그래서 털 손질이 생명입니다!",
    animalIcon: "🦦"
  },
  {
    id: "q-whale",
    question: "혹등고래가 수천 킬로미터 떨어진 동료들과 소통하기 위해 사용하는 방법은?",
    options: [
      "수면 위로 물을 높이 뿜어 올리기",
      "물속 멀리 울려 퍼지는 아름다운 고래 노래",
      "지느러미로 수면을 강하게 때리는 신호",
      "눈에서 나오는 빛을 깜빡이기"
    ],
    correctIndex: 1,
    explanation: "혹등고래는 저주파와 고주파가 어우러진 복잡하고 웅장한 '고래 노래'를 만들어 수천 킬로미터 너머의 다른 고래들과 교신합니다.",
    animalIcon: "🐋"
  },
  {
    id: "q-squid",
    question: "빛이 전혀 없는 450m 이상의 깊은 암흑 심해에서 대왕오징어가 가진 신체적 특징은?",
    options: [
      "농구공 크기(지름 약 30cm)의 거대한 눈",
      "청각 대신 발달한 긴 코",
      "다리가 100개로 늘어남",
      "돌처럼 딱딱한 껍질"
    ],
    correctIndex: 0,
    explanation: "대왕오징어는 동물계에서 가장 큰 축구공/농구공 크기의 눈을 지녀 극도로 희미한 생체 발광 빛까지 포착할 수 있습니다.",
    animalIcon: "🦑"
  },
  {
    id: "q-crab",
    question: "꽃게가 몸이 점점 커질 때 단단한 껍질을 어떻게 바꿀까요?",
    options: [
      "껍질에 물을 흡수시켜 풍선처럼 부풀린다",
      "기존의 단단한 껍질을 벗고 새 껍질을 만드는 '탈피'를 한다",
      "주변의 버려진 조개껍데기를 주워 입는다",
      "평생 껍질을 바꾸지 않는다"
    ],
    correctIndex: 1,
    explanation: "꽃게는 단단한 외골격이 늘어나지 않기 때문에 성장에 맞춰 주기적으로 껍질을 벗는 '탈피(Molting)' 과정을 거칩니다.",
    animalIcon: "🦀"
  }
];
