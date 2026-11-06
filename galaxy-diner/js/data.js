// 은하수식당 카드 데이터 (원본 카드 이미지에서 직접 옮겨 적음)
(function (root) {
  const FOODS = {
    noodle: '은하수 누들', pretzel: '갤럭시 프레첼', donut: '행성 고리 도넛', jelly: '우주 젤리 컵',
    dumpling: '외계 용암 만두', choco: '초신성 초콜릿 케이크', moon: '달조각 케이크', pop: '혜성 케이크 팝',
    burger: 'UFO 우주 버거', tart: '블랙홀 베리 타르트', fudge: '운석 퍼지 블록', omu: '우주 카레 오므라이스'
  };
  const COLORS = { R: '빨강', G: '초록', P: '보라', W: '흰색' };
  const COLOR_HEX = { R: '#e0413a', G: '#2fb34a', P: '#4a2a9a', W: '#ffffff' };

  // [번호, 음식, 색상]  (번호 = 카드 숫자)
  const F = 'noodle pretzel donut jelly dumpling choco moon pop burger tart fudge omu'.split(' ');
  const RAW = [
    [1,'noodle','R'],[2,'pretzel','W'],[3,'donut','W'],[4,'jelly','P'],[5,'dumpling','G'],[6,'choco','P'],
    [7,'moon','P'],[8,'pop','P'],[9,'burger','G'],[10,'tart','P'],[11,'fudge','R'],[12,'omu','P'],
    [13,'pretzel','P'],[14,'noodle','P'],[15,'omu','R'],[16,'fudge','P'],[17,'noodle','R'],[18,'pretzel','G'],
    [19,'donut','W'],[20,'jelly','R'],[21,'choco','R'],[22,'dumpling','W'],[23,'pop','R'],[24,'moon','P'],
    [25,'tart','R'],[26,'burger','P'],[27,'omu','G'],[28,'fudge','G'],[29,'jelly','P'],[30,'donut','W'],
    [31,'pretzel','R'],[32,'noodle','G'],[33,'jelly','G'],[34,'donut','G'],[35,'dumpling','R'],[36,'choco','G'],
    [37,'moon','W'],[38,'pop','W'],[39,'burger','P'],[40,'tart','P'],[41,'fudge','R'],[42,'omu','W'],
    [43,'dumpling','P'],[44,'choco','P'],[45,'pretzel','R'],[46,'noodle','G'],[47,'donut','G'],[48,'jelly','W'],
    [49,'choco','R'],[50,'dumpling','R'],[51,'pop','G'],[52,'moon','G'],[53,'tart','G'],[54,'burger','R'],
    [55,'fudge','W'],[56,'omu','G'],[57,'pop','W'],[58,'moon','G'],[59,'noodle','W'],[60,'pretzel','W'],
    [61,'jelly','W'],[62,'donut','R'],[63,'choco','W'],[64,'dumpling','G'],[65,'moon','R'],[66,'pop','P'],
    [67,'tart','R'],[68,'burger','G'],[69,'omu','P'],[70,'fudge','W'],[71,'burger','W'],[72,'tart','W']
  ];
  const CARDS = {};
  RAW.forEach(([n, f, c]) => { CARDS[n] = { n, f, c }; });

  // 주문카드: dishes(위→아래), null=은하수 길(요리 없음), 'same'=동일요리
  // a=외계인 수(이 카드에 제공 가능한 최대 요리 수), s=4라운드 별, g=특별손님 아이콘, r=보상효과
  const ORDERS = {
    1: { d: ['moon', 'jelly', 'choco'], a: 2, s: 4, g: 1, r: 'extra' },
    2: { d: ['dumpling', 'donut', 'noodle'], a: 3, s: 4, g: 0, r: 'exchLook1' },
    3: { d: ['donut', 'pretzel', 'tart'], a: 3, s: 4, g: 0, r: 'exch1' },
    4: { d: ['donut', null, 'pretzel'], a: 3, s: 4, g: 0, r: 'extra' },
    5: { d: ['omu', 'jelly', 'tart'], a: 2, s: 4, g: 1, r: 'exch2' },
    6: { d: ['moon', 'burger', 'pop'], a: 3, s: 5, g: 1, r: 'deck2' },
    7: { d: ['omu', 'noodle', 'fudge'], a: 2, s: 5, g: 0, r: 'deck1' },
    8: { d: ['choco', null, 'omu'], a: 2, s: 5, g: 1, r: 'dice' },
    9: { d: ['tart', null, 'dumpling'], a: 2, s: 5, g: 0, r: 'exchLook2' },
    10: { d: ['pretzel', null, 'burger'], a: 2, s: 5, g: 1, r: 'exch1' },
    11: { d: ['omu', 'pop', 'choco'], a: 2, s: 4, g: 1, r: 'market2' },
    12: { d: ['fudge', 'pop', 'jelly'], a: 3, s: 4, g: 1, r: 'diceMinus' },
    13: { d: ['noodle', 'pretzel', 'tart'], a: 3, s: 4, g: 1, r: 'steal1' },
    14: { d: ['burger', null, 'fudge'], a: 2, s: 4, g: 1, r: 'extra' },
    15: { d: ['donut', 'moon', 'choco'], a: 2, s: 4, g: 1, r: 'market1' },
    16: { d: ['pop', 'dumpling', 'jelly'], a: 3, s: 3, g: 0, r: 'dice' },
    17: { d: ['tart', 'noodle', 'fudge'], a: 2, s: 3, g: 0, r: 'deck1' },
    18: { d: ['same', 'same', 'same'], a: 3, s: 3, g: 0, r: 'dice' },
    19: { d: ['moon', null, 'dumpling'], a: 2, s: 3, g: 0, r: 'steal1' },
    20: { d: ['same', null, 'same'], a: 2, s: 3, g: 0, r: 'extra' }
  };

  const REWARD_TEXT = {
    extra: '액션 +1', exchLook1: '1사람 지목, 보고 1장 교환', exch1: '1사람 지목, 1장 교환',
    exch2: '1사람 지목, 2장 교환', exchLook2: '1사람 지목, 보고 2장 교환', deck1: '덱에서 1장 받기',
    deck2: '덱에서 2장 받기', dice: '조커주사위 +1', market1: '공개 시장카드 1장 얻기',
    market2: '공개 시장카드 2장 얻기', diceMinus: '1사람 지목, 조커주사위 -1', steal1: '1사람 지목, 1장 뺏기',
    stealLook1: '1사람 지목, 보고 1장 뺏기', discardLook1: '버린 덱 보고 1장 얻기'
  };

  // ---------- 특별한 손님 조건 ----------
  const cnt = (cs, fn) => cs.filter(fn).length;
  const colorCount = (cs, col) => cnt(cs, x => x.c === col);
  const foodCount = (cs, f) => cnt(cs, x => x.f === f);
  const all = (cs, fn) => cs.every(fn);
  const between = (a, b) => x => x.n >= a && x.n <= b;
  const sum = cs => cs.reduce((s, x) => s + x.n, 0);
  const nColors = cs => new Set(cs.map(x => x.c)).size;
  const odd = x => x.n % 2 === 1, even = x => x.n % 2 === 0;
  const hasFood = (cs, f, pred) => cs.some(x => x.f === f && (!pred || pred(x)));
  const perm3 = cs => [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(o => o.map(i => cs[i]));
  const foodsExactly = (cs, fs) => { const a = cs.map(x => x.f).sort().join(); return a === fs.slice().sort().join(); };

  // b: 기본 조건 목록 [설명, 판정], s: 특별조건 [설명, 판정(카드, 지불후 손패 수)], r: 1등 보상, h: 모래시계(카드 표기)
  const GUESTS = {
    1: { name: '마릴린 먼로', h: 2, b: [['초록 3장', cs => colorCount(cs, 'G') === 3], ['모두 30~60 사이', cs => all(cs, between(30, 60))]],
      s: ['모두 다른 음식', cs => new Set(cs.map(x => x.f)).size === 3], r: 'dice' },
    2: { name: '엘비스 프레슬리', h: 2, b: [['보라 1장 + 1~10 사이 2장', cs => perm3(cs).some(([a, b, c]) => a.c === 'P' && between(1, 10)(b) && between(1, 10)(c))]],
      s: ['블랙홀 베리 타르트 포함 + 보라 2장', cs => hasFood(cs, 'tart') && colorCount(cs, 'P') >= 2], r: 'steal1' },
    3: { name: '스티브 잡스', h: 2, b: [['모두 홀수', cs => all(cs, odd)], ['색상 모두 다름', cs => nColors(cs) === 3], ['행성 고리 도넛 1장만 포함', cs => foodCount(cs, 'donut') === 1]],
      s: ['숫자 30 이하 달조각 케이크 포함', cs => hasFood(cs, 'moon', x => x.n <= 30)], r: 'discardLook1' },
    4: { name: '일론 머스크', h: 2, b: [['모두 짝수', cs => all(cs, even)], ['색상 모두 동일', cs => nColors(cs) === 1], ['운석 퍼지 블록 1장만 포함', cs => foodCount(cs, 'fudge') === 1]],
      s: ['숫자 30 이하 운석 퍼지 블록 포함', cs => hasFood(cs, 'fudge', x => x.n <= 30)], r: 'stealLook1' },
    5: { name: '부다', h: 2, b: [['흰색 2장 + 보라 1장', cs => colorCount(cs, 'W') === 2 && colorCount(cs, 'P') === 1], ['혜성 케이크 팝 1장 포함', cs => hasFood(cs, 'pop')]],
      s: ['40 이상 우주 젤리 컵 포함', cs => hasFood(cs, 'jelly', x => x.n >= 40)], r: 'market1' },
    6: { name: '소크라테스', h: 2, b: [['같은 색 2장 + 다른 색 1장', cs => nColors(cs) === 2], ['모두 짝수', cs => all(cs, even)], ['초신성 초콜릿 케이크 포함', cs => hasFood(cs, 'choco')]],
      s: ['(지불 후) 손패 2장 이하', (cs, h) => h <= 2], r: 'exchLook1' },
    7: { name: '다윈', h: 2, b: [['보라·초록 조합 3장', cs => all(cs, x => x.c === 'P' || x.c === 'G')], ['30 이하 외계 용암 만두 1장 포함', cs => hasFood(cs, 'dumpling', x => x.n <= 30)]],
      s: ['외계 용암 만두 2장', cs => foodCount(cs, 'dumpling') >= 2], r: 'dice' },
    8: { name: '안나 파블로바', h: 1, b: [['모두 60 이상', cs => all(cs, x => x.n >= 60)], ['색상 모두 다름', cs => nColors(cs) === 3]],
      s: ['우주 카레 오므라이스 포함', cs => hasFood(cs, 'omu')], r: 'exchLook2' },
    9: { name: '아인슈타인', h: 1, b: [['빨강 2장 포함', cs => colorCount(cs, 'R') >= 2], ['총합 50 이하', cs => sum(cs) <= 50]],
      s: ['초신성 초콜릿 케이크 포함', cs => hasFood(cs, 'choco')], r: 'deck1' },
    10: { name: '퀴리', h: 2, b: [['은하수 누들 + 갤럭시 프레첼 + 행성 고리 도넛', cs => foodsExactly(cs, ['noodle', 'pretzel', 'donut'])]],
      s: ['모두 1~31 사이', cs => all(cs, between(1, 31))], r: 'stealLook1' },
    11: { name: '호킹', h: 2, b: [['우주 젤리 컵 + 운석 퍼지 블록 + UFO 우주 버거', cs => foodsExactly(cs, ['jelly', 'fudge', 'burger'])]],
      s: ['모두 32~72 사이', cs => all(cs, between(32, 72))], r: 'deck2' },
    12: { name: '모나리자', h: 2, b: [['흰색 2장 포함', cs => colorCount(cs, 'W') >= 2], ['총합 60 이상', cs => sum(cs) >= 60], ['외계 용암 만두 1장 포함', cs => hasFood(cs, 'dumpling')]],
      s: ['갤럭시 프레첼 포함', cs => hasFood(cs, 'pretzel')], r: 'exchLook2' },
    13: { name: '프리다 칼로', h: 2, b: [['초신성 초콜릿 케이크 + 외계 용암 만두 + 블랙홀 베리 타르트', cs => foodsExactly(cs, ['choco', 'dumpling', 'tart'])]],
      s: ['모두 1가지 색상', cs => nColors(cs) === 1], r: 'steal1' },
    14: { name: '나폴레옹', h: 2, b: [['달조각 케이크 + 외계 용암 만두 + 블랙홀 베리 타르트', cs => foodsExactly(cs, ['moon', 'dumpling', 'tart'])]],
      s: ['3가지 색상', cs => nColors(cs) === 3], r: 'market1' },
    15: { name: '간디', h: 2, b: [['보라 2장 + 흰색 1장', cs => colorCount(cs, 'P') === 2 && colorCount(cs, 'W') === 1], ['우주 카레 오므라이스 1장만 포함', cs => foodCount(cs, 'omu') === 1]],
      s: ['30 이하 UFO 우주 버거 포함', cs => hasFood(cs, 'burger', x => x.n <= 30)], r: 'deck1' },
    16: { name: '링컨', h: 2, b: [['홀수 2장 + 짝수 1장', cs => cnt(cs, odd) === 2], ['혜성 케이크 팝·달조각 케이크 포함', cs => hasFood(cs, 'pop') && hasFood(cs, 'moon')]],
      s: ['(지불 후) 손패 3장 이하', (cs, h) => h <= 3], r: 'exchLook1' },
    17: { name: '클레오파트라', h: 2, b: [['빨강 1장 + 초록 2장', cs => colorCount(cs, 'R') === 1 && colorCount(cs, 'G') === 2], ['모두 1~45 사이', cs => all(cs, between(1, 45))]],
      s: ['30 이하 혜성 케이크 팝 포함', cs => hasFood(cs, 'pop', x => x.n <= 30)], r: 'dice' },
    18: { name: '셰익스피어', h: 1, b: [['같은 음식 3장', cs => new Set(cs.map(x => x.f)).size === 1], ['총합 70 이하', cs => sum(cs) <= 70]],
      s: ['운석 퍼지 블록 포함', cs => hasFood(cs, 'fudge')], r: 'deck2' },
    19: { name: '피카소', h: 2, b: [['빨강 2장 + 흰색 1장', cs => colorCount(cs, 'R') === 2 && colorCount(cs, 'W') === 1], ['모두 20~55 사이', cs => all(cs, between(20, 55))]],
      s: ['갤럭시 프레첼·혜성 케이크 팝 포함', cs => hasFood(cs, 'pretzel') && hasFood(cs, 'pop')], r: 'deck1' },
    20: { name: '마이클 잭슨', h: 2, b: [['숫자 연속 3장', cs => { const n = cs.map(x => x.n).sort((a, b) => a - b); return n[1] === n[0] + 1 && n[2] === n[1] + 1; }], ['UFO 우주 버거 1장 포함', cs => foodCount(cs, 'burger') === 1]],
      s: ['모두 40 이하', cs => all(cs, x => x.n <= 40)], r: 'deck1' }
  };

  // ---------- 전문가 요청 ----------
  // st: 이번 라운드 기록 {played:[카드], cardsServed:{orderKey:개수}, rows:Set, combos, diceGained, diceUsed, guests, guestSpecial, extra, stole, exchanged}
  const playedOK = st => st.played.length >= 2; // 카드 조건은 최소 2장 조합
  const cardsWithMine = st => Object.keys(st.served).length;
  const EXPERTS = {
    1: { name: '셰프 오릭스', t: '조커 주사위를 1개 얻으면', fn: st => st.diceGained >= 1 },
    2: { name: '신비 전문가 루나', t: '특별한 손님 처리 시', fn: st => st.guests >= 1 },
    3: { name: '셰프 그라크', t: '특별한 손님 특수조건 처리 시', fn: st => st.guestSpecial >= 1 },
    4: { name: '구이전문가 불난 야리', t: '2장의 주문카드에 각각 2개 요리 제공 시', fn: st => Object.values(st.served).filter(v => v >= 2).length >= 2 },
    5: { name: '셰프 넥스', t: '4종 색상 요리카드 사용 시', fn: st => playedOK(st) && new Set(st.played.map(x => x.c)).size === 4 },
    6: { name: '해산물 전문가 라이라', t: '+1액션 보상효과 얻으면', fn: st => st.extra >= 1 },
    7: { name: '과일전문가 셰프 키로', t: '조커 주사위 1개 사용 시', fn: st => st.diceUsed >= 1 },
    8: { name: '셰프 그라크', t: '주문카드 4곳만 제공 시', fn: st => cardsWithMine(st) === 4 },
    9: { name: '육식 전문가 드렉스', t: '정확히 2COMBO를 했다면', fn: st => st.combos === 2 },
    10: { name: '채소 전문가 리오라', t: '짝수 요리만 제공 시', fn: st => playedOK(st) && st.played.every(x => x.n % 2 === 0) },
    11: { name: '제과제빵 전문가 제니', t: '홀수 요리만 제공 시', fn: st => playedOK(st) && st.played.every(x => x.n % 2 === 1) },
    12: { name: '100년장인 셰프 본', t: '주문카드 2줄에만 제공 시', fn: st => st.rows.length === 2 },
    13: { name: '100년장인 셰프 본', t: '주문카드 2줄에만 제공 시', fn: st => st.rows.length === 2 },
    14: { name: '제과 전문가 코트', t: '주문카드 2곳에만 제공 시', fn: st => cardsWithMine(st) === 2 },
    15: { name: '셰프 보락스', t: '3종 색상 요리카드만 사용 시', fn: st => playedOK(st) && new Set(st.played.map(x => x.c)).size === 3 },
    16: { name: '꼬마요리사 키코', t: '1COMBO만 했다면', fn: st => st.combos === 1 },
    17: { name: '셰프 UNIT 7', t: '이번 라운드 요리카드 8장 이상 사용 시', fn: st => st.played.length >= 8 },
    18: { name: '셰프 글린트', t: '주문카드 3줄 사용 시', fn: st => st.rows.length === 3 },
    19: { name: '대지 전문가 록키', t: '카드를 뺏었다면', fn: st => st.stole >= 1 },
    20: { name: '향료 전문가 셰프 닉스', t: '카드를 교환했다면', fn: st => st.exchanged >= 1 }
  };

  const D = { FOODS, COLORS, COLOR_HEX, CARDS, ORDERS, GUESTS, EXPERTS, REWARD_TEXT, FOOD_KEYS: F };
  if (typeof module !== 'undefined') module.exports = D; else root.GD = D;
})(this);
