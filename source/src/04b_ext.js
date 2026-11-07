/* =====================================================================
   v4 확장: 난이도 4단계 · 탑승 장비 120종 · AI 동료 구출 · 물약 리젠
            보스 강화 · 랜덤 전장 이벤트 · 특별 임무
   (기존 코드는 그대로 두고, 필요한 지점에서 이 파일의 함수를 호출)
   ===================================================================== */

/* ------------------------- 난이도 ------------------------- */
const DIFFS = [
  { k: 'easy', n: '쉬움', ic: '🌱', col: '#69f0ae', hp: .85, dmg: .8, cnt: 1.04, spd: 1, elite: .9, potT: 26, gold: .8, xp: 1, boss: .85, rescue: .85, pat: 0 },
  { k: 'normal', n: '보통', ic: '⚔️', col: '#90caf9', hp: 1.2, dmg: 1.15, cnt: 1.38, spd: 1.08, elite: 1.45, potT: 34, gold: 1.1, xp: 1.05, boss: 1.15, rescue: 1, pat: 1 },
  { k: 'hard', n: '어려움', ic: '🔥', col: '#ffb74d', hp: 1.65, dmg: 1.5, cnt: 1.67, spd: 1.13, elite: 1.85, potT: 44, gold: 1.4, xp: 1.12, boss: 1.4, rescue: 1.12, pat: 2 },
  { k: 'hell', n: '지옥', ic: '👹', col: '#ff5252', hp: 2.3, dmg: 1.9, cnt: 2.0, spd: 1.2, elite: 2.4, potT: 54, gold: 1.9, xp: 1.25, boss: 1.8, rescue: 1.25, pat: 3 }
];
function diffIdx() { const d = save.settings.diff; return d >= 0 && d <= 3 ? d : 1; }
function DF() { return DIFFS[diffIdx()]; }
// 게임 중 난이도 변경: 적 체력은 '남은 비율'을 그대로 유지 (회복되지 않음), 플레이어 상태는 그대로
function setDiff(i) {
  i = clamp(i | 0, 0, 3); const old = DF(); if (DIFFS[i] === old) return;
  save.settings.diff = i; writeSave(); const nw = DF();
  if (P && G.st && ['play', 'pause', 'levelup'].includes(G.state)) {
    for (const e of enemies) {
      if (e.dead || e.static) continue;
      const r = e.boss ? nw.boss / old.boss : nw.hp / old.hp;
      e.hp *= r; e.maxHp *= r; if (e.bud !== undefined) e.bud *= r;
      if (!e.boss) e.spd *= nw.spd / old.spd;
    }
    recalc(); G.adapt = computeAdapt();
    toast(`${nw.ic} 난이도: ${nw.n}`, 1.2, nw.col);
  }
}
// 보상 배율: 스테이지에서 각 난이도로 플레이한 시간 비율만큼 가중 평균
function diffRewardMul() {
  const a = G.diffAcc; if (!a) return DF().gold; let s = 0, w = 0;
  for (let i = 0; i < 4; i++) { s += a[i] * DIFFS[i].gold; w += a[i]; }
  return w > 1 ? s / w : DF().gold;
}

/* ------------------------- 탑승 장비 데이터 ------------------------- */
// cat: ground 지상 / hover 부양 / mech 보행 로봇 / air 비행
// link: 동료 연동 — A 동승 전투(2석), A1 1석(50% 확률), B 호위 전투, C 공중+지상 지원
const VCH = {
  bike: { n: '전투 오토바이', cat: 'ground', spd: 210, hp: 100, time: 25, ar: .10, r: 16, crush: 10, link: 'B', open: 1, mh: 10 },
  buggy: { n: '전투 버기', cat: 'ground', spd: 190, hp: 125, time: 25, ar: .14, r: 18, crush: 14, link: 'A1', open: 1, mh: 12 },
  jeep: { n: '경장갑 차량', cat: 'ground', spd: 170, hp: 150, time: 35, ar: .18, r: 20, crush: 16, link: 'A1', open: 1, mh: 16 },
  rover: { n: '6륜 장갑 로버', cat: 'ground', spd: 145, hp: 205, time: 35, ar: .24, r: 22, crush: 20, link: 'A', mh: 20 },
  apc: { n: '장갑차', cat: 'ground', spd: 130, hp: 255, time: 35, ar: .28, r: 24, crush: 22, link: 'A', mh: 20 },
  tank: { n: '중형 전차', cat: 'ground', spd: 108, hp: 285, time: 40, ar: .32, r: 25, crush: 30, link: 'B', mh: 18 },
  hbike: { n: '호버 바이크', cat: 'hover', spd: 232, hp: 100, time: 25, ar: .08, r: 16, crush: 8, link: 'B', open: 1, mh: 14 },
  htank: { n: '호버 전차', cat: 'hover', spd: 145, hp: 250, time: 40, ar: .30, r: 25, crush: 24, link: 'B', mh: 22 },
  minibot: { n: '소형 전투 로봇', cat: 'mech', spd: 155, hp: 150, time: 25, ar: .18, r: 18, crush: 12, link: 'B', mh: 22 },
  mech: { n: '중형 전투 로봇', cat: 'mech', spd: 135, hp: 205, time: 35, ar: .25, r: 22, crush: 18, link: 'B', mh: 28 },
  spider: { n: '다족 보행 메카', cat: 'mech', spd: 150, hp: 190, time: 35, ar: .24, r: 23, crush: 16, link: 'B', mh: 22 },
  titan: { n: '거대 메카', cat: 'mech', spd: 102, hp: 310, time: 40, ar: .32, r: 31, crush: 34, link: 'B', mh: 40 },
  heli: { n: '전투 헬리콥터', cat: 'air', spd: 175, hp: 165, time: 30, ar: .14, r: 23, crush: 0, link: 'C', mh: 30 },
  jet: { n: '고속 전투기', cat: 'air', spd: 252, hp: 105, time: 24, ar: .10, r: 21, crush: 0, link: 'C', mh: 30 },
  dpod: { n: '드론 탑승 장비', cat: 'air', spd: 192, hp: 120, time: 25, ar: .12, r: 19, crush: 0, link: 'C', mh: 30 },
  gunship: { n: '중형 건쉽', cat: 'air', spd: 140, hp: 215, time: 30, ar: .22, r: 27, crush: 0, link: 'A', mh: 32 },
  saucer: { n: '반중력 비행체', cat: 'air', spd: 196, hp: 175, time: 30, ar: .20, r: 23, crush: 0, link: 'C', mh: 32 }
};
const VCAT_NAME = { ground: '지상', hover: '부양', mech: '보행', air: '비행' };
// 차량 무기 14종: 발사체 크기·속도·방향·폭발 범위·이펙트가 모두 다름
const VWPN = {
  mg: { n: '기관총', cd: .12, dmg: 9, range: 330, col: '#ffe082', s: ['hmg', 1.25] },
  minigun: { n: '회전 기관포', cd: .055, dmg: 7, range: 320, col: '#fff59d', s: ['mini', 1] },
  rocket: { n: '로켓', cd: .8, dmg: 34, boom: 52, range: 380, col: '#ff7043', s: ['rocket', 1] },
  homing: { n: '추적 미사일', cd: 1.5, dmg: 24, boom: 40, k: 4, range: 460, col: '#ff8a65', s: ['missile', 1] },
  grenade: { n: '유탄', cd: .85, dmg: 30, boom: 56, range: 300, col: '#aed581', s: ['gl', 1] },
  shell: { n: '대구경 포탄', cd: 1.7, dmg: 90, boom: 78, range: 440, col: '#ffab40', s: ['cannon', 1] },
  mortar: { n: '박격포', cd: 1.9, dmg: 40, boom: 62, k: 3, range: 420, col: '#ffcc80', s: ['mortar', 1] },
  laser: { n: '양팔 레이저', cd: .17, dmg: 13, range: 380, col: '#ff1744', s: ['laser', 1.1] },
  plasma: { n: '플라즈마포', cd: .6, dmg: 40, boom: 42, range: 360, col: '#e040fb', s: ['plasma', 1] },
  flame: { n: '화염 방사기', cd: .1, dps: 75, range: 125, col: '#ff6d00', s: ['flame', 1] },
  rail: { n: '레일건', cd: 1.7, dmg: 115, range: 520, col: '#40c4ff', s: ['rail', 1] },
  tesla: { n: '테슬라 코일', cd: .65, dmg: 30, k: 4, range: 300, col: '#b388ff', s: ['zap', 1] },
  mlrs: { n: '다연장 로켓', cd: 2.5, dmg: 19, boom: 36, k: 8, range: 480, col: '#ffd180', s: ['missile', .8] },
  beam: { n: '에너지 빔', cd: 1.9, dps: 130, dur: .9, range: 340, col: '#18ffff', s: ['beam', 1] }
};
// 특수능력 12종 (탑승 중 🌀 버튼)
const VSP = {
  nitro: { s: '니트로', n: '니트로 돌진', ic: '🔥', cd: 9, d: '1.4초 동안 2배 속도 + 충돌 피해 3배' },
  smoke: { s: '연막탄', n: '연막탄', ic: '💨', cd: 14, d: '주변 적 감속 + 잠깐 무적' },
  shield: { s: '보호막', n: '에너지 보호막', ic: '🛡️', cd: 16, d: '공격 3회 막는 보호막' },
  stomp: { s: '지면강타', n: '지면 강타', ic: '💥', cd: 8, d: '주변 충격파 + 기절' },
  salvo: { s: '일제사격', n: '일제 사격', ic: '🎆', cd: 12, d: '사방으로 추적 미사일 16발' },
  airstrike: { s: '공습', n: '공습 요청', ic: '✈️', cd: 15, d: '적 밀집 지역 폭격 10회' },
  emp: { s: 'EMP', n: 'EMP 폭발', ic: '⚡', cd: 18, d: '화면 안 적 2초 기절 + 적 탄 제거' },
  repair: { s: '자가수리', n: '긴급 자가 수리', ic: '🔧', cd: 24, d: '내구도 25% 회복' },
  overdrive: { s: '과부하', n: '과부하 사격', ic: '⏩', cd: 18, d: '6초 동안 연사 속도 2배' },
  flare: { s: '플레어', n: '플레어 살포', ic: '🎇', cd: 10, d: '주변 적 탄 제거 + 무적 0.8초' },
  ram: { s: '충각돌격', n: '충각 돌격', ic: '🐏', cd: 10, d: '전방 돌격, 강한 충돌 피해' },
  hover: { s: '부양', n: '부양 회피', ic: '🛸', cd: 9, d: '1.4초 떠올라 무적, 착지 충격파' }
};
const VCOMP = {
  bike: ['mg', 'minigun', 'rocket', 'grenade', 'tesla', 'plasma'], buggy: ['mg', 'rocket', 'grenade', 'flame', 'minigun', 'mortar'],
  jeep: ['mg', 'grenade', 'rocket', 'minigun', 'homing', 'flame'], rover: ['minigun', 'mortar', 'homing', 'tesla', 'mlrs', 'grenade'],
  apc: ['mg', 'grenade', 'minigun', 'homing', 'mortar', 'flame'], tank: ['shell', 'rail', 'plasma', 'mortar', 'mlrs', 'flame'],
  hbike: ['plasma', 'laser', 'tesla', 'rail', 'minigun', 'homing'], htank: ['rail', 'plasma', 'beam', 'shell', 'mlrs', 'tesla'],
  minibot: ['mg', 'laser', 'flame', 'grenade', 'rocket', 'tesla'], mech: ['laser', 'plasma', 'minigun', 'rocket', 'flame', 'beam'],
  spider: ['laser', 'tesla', 'mortar', 'homing', 'plasma', 'flame'], titan: ['rail', 'mlrs', 'beam', 'shell', 'plasma', 'laser'],
  heli: ['minigun', 'homing', 'rocket', 'mg', 'mlrs', 'laser'], jet: ['homing', 'minigun', 'rocket', 'laser', 'rail', 'plasma'],
  dpod: ['homing', 'laser', 'tesla', 'plasma', 'mg', 'beam'], gunship: ['minigun', 'mlrs', 'shell', 'homing', 'beam', 'rocket'],
  saucer: ['beam', 'plasma', 'tesla', 'laser', 'rail', 'homing']
};
const VSIG = { bike: 'mg', buggy: 'rocket', jeep: 'grenade', rover: 'mortar', apc: 'minigun', tank: 'shell', hbike: 'tesla', htank: 'rail', minibot: 'laser', mech: 'laser',
  spider: 'flame', titan: 'plasma', heli: 'mlrs', jet: 'homing', dpod: 'tesla', gunship: 'shell', saucer: 'beam' };
const VSUBTIER = [[], ['mg', 'grenade', 'rocket'], ['homing', 'tesla', 'minigun'], ['rail', 'mlrs', 'plasma']];
// 차량 필살기 (탑승마다 1회)
const VULT = { tank: 'bigshell', htank: 'bigshell', gunship: 'bigshell', heli: 'carpet', jet: 'strafe', mech: 'megalaser', minibot: 'megalaser', titan: 'megalaser', spider: 'megalaser',
  apc: 'barrage', rover: 'barrage', jeep: 'barrage', buggy: 'barrage', bike: 'barrage', hbike: 'emstorm', saucer: 'emstorm', dpod: 'emstorm' };
const VULT_NAME = { bigshell: '초대형 포격', carpet: '미사일 융단폭격', strafe: '전방 대규모 폭격', megalaser: '초대형 레이저', barrage: '전방 집중 기관포 난사', emstorm: '전자기 폭풍' };
const VSPPOOL = { ground: ['nitro', 'smoke', 'ram', 'shield', 'repair', 'overdrive', 'airstrike'], hover: ['hover', 'nitro', 'shield', 'emp', 'overdrive', 'flare'],
  mech: ['stomp', 'shield', 'overdrive', 'emp', 'salvo', 'repair'], air: ['salvo', 'flare', 'airstrike', 'emp', 'overdrive', 'shield'] };
const VMODEL = {
  bike: ['스콜피온', '바이퍼', '블레이드', '썬더볼트', '코브라', '스팅어', '팬서', '레이저백'], buggy: ['샌드러너', '듄', '하이에나', '자칼', '태풍', '랩터', '맹그로브', '스키프'],
  jeep: ['레인저', '버팔로', '그리즐리', '마스티프', '패트롤', '와일드캣', '베어캣', '오리온'], rover: ['헤라클레스', '센티넬', '카이만', '보아', '타이탄캣', '아틀라스', '오카피', '바실리스크'],
  apc: ['스트라이커', '불독', '아이언하이드', '라이노', '코뿔소', '해머', '포트리스', '바스티온'], tank: ['레오파드', '타이거', '팬저', '아브람스', '센츄리온', '맘모스', '메르카바', '흑표'],
  hbike: ['제피르', '스파크', '블리츠', '네온윙', '세라프', '플럭스', '아크', '스위프트'], htank: ['오벨리스크', '모노리스', '할버드', '이지스', '프리즘', '메테오', '자이로', '퀘이사'],
  minibot: ['코그', '볼트', '스카우트', '피칸', '미니맥스', '로키', '핀', '스프링'], mech: ['가디언', '워해머', '아이언맨틀', '센츄리온-M', '듀얼리스트', '바이킹', '팔랑크스', '스파르탄'],
  spider: ['아라크네', '타란툴라', '위도우', '리클루스', '헌츠맨', '오브위버', '젠틀', '크레이터'], titan: ['콜로서스', '골리앗', '아스트라', '레비아탄', '오딘', '제우스', '라그나', '네메시스'],
  heli: ['아파치', '하운드', '블랙호크', '카이오와', '이글', '와이번', '팔콘', '스톰버드'], jet: ['스트라이크', '랩터-X', '팔콘-Z', '노스트롬', '스펙터', '이카로스', '피닉스', '라이트닝'],
  dpod: ['호넷', '비틀', '모스', '크리켓', '드래곤플라이', '와스프', '나방', '반딧불'], gunship: ['스펙터-G', '드래곤', '고스트', '레드폭스', '그리폰', '키메라', '세이버', '헬하운드'],
  saucer: ['에테르', '노바', '갤럭시', '헤일로', '오로라', '엘리시움', '오메가', '셀레스티아']
};
const VGROUPS = [
  ['bike', 'buggy', 'jeep', 'minibot', 'rover', 'apc'],
  ['tank', 'heli', 'mech', 'apc', 'spider', 'gunship', 'jeep'],
  ['jet', 'mech', 'htank', 'rover', 'dpod', 'spider', 'gunship', 'hbike'],
  ['titan', 'saucer', 'hbike', 'htank', 'jet', 'dpod', 'mech', 'spider']
];
const VKITS = ['plates', 'spikes', 'antenna', 'pods', 'lights', 'exhaust', 'radar', 'stripes', 'wings', 'shieldgen'];
const VEH = [], VEH_ST = [];
(function genVehicles() {
  const used = new Set(), usedCW = new Set(), mcount = {}; let prev = '';
  for (let n = 1; n <= 40; n++) {
    const rnd = mulberry(n * 977 + 13), g = Math.floor((n - 1) / 10), pool = VGROUPS[g].slice();
    let chs;
    for (let tries = 0; tries < 20; tries++) {
      const sh = pool.slice(); for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
      chs = sh.slice(0, 3); const cats = new Set(chs.map(c => VCH[c].cat)); const key = chs.slice().sort().join();
      if (key !== prev && cats.size >= 2) break;
    }
    prev = chs.slice().sort().join();
    const list = [], stW = new Set();
    chs.forEach((c, k) => {
      // 차체마다 고정된 전용 무기 (오토바이=쌍열 기관총, 전차=초대형 포탄, 헬기=다연장 미사일 …)
      let wp = VSIG[c]; stW.add(wp); usedCW.add(c + wp);
      const cat = VCH[c].cat, spp = VSPPOOL[cat].slice().sort(() => rnd() - .5);
      let sp = spp.find(s => !used.has(c + wp + s)) || spp[0];
      // 스테이지가 높아질수록 새로운 보조 무기 해금 (같은 차체라도 공격 방식이 달라짐)
      let sub = null; if (g >= 1) { const subs = VSUBTIER[g].filter(x => x !== wp); sub = subs[(n + k) % subs.length]; }
      used.add(c + wp + sp);
      const kp = VKITS.filter(x => (x !== 'wings' || cat === 'air' || cat === 'hover') && (x !== 'spikes' || cat === 'ground' || cat === 'mech')).sort(() => rnd() - .5);
      const mi = mcount[c] = (mcount[c] || 0) + 1, ml = VMODEL[c];
      const model = ml[(mi - 1) % ml.length] + (mi > ml.length ? ' Mk.' + ['', 'I', 'II', 'III', 'IV'][Math.ceil(mi / ml.length)] : '');
      const h = (n * 41 + k * 113) % 360;
      const col = g === 0 ? { a: hsl(60 + (n * 23 + k * 50) % 90, 26, 40 + k * 3), b: hsl(60 + (n * 23 + k * 50) % 90, 24, 26), c: hsl(h + 30, 85, 55), gl: '#b3e5fc' }
        : g === 1 ? { a: hsl(190 + (n * 17 + k * 40) % 80, 18, 46), b: hsl(200 + (n * 17) % 60, 20, 28), c: hsl(h, 90, 55), gl: '#80deea' }
          : g === 2 ? { a: hsl(h, 50, 40), b: hsl(h + 20, 45, 22), c: hsl(h + 170, 95, 60), gl: '#e1bee7' }
            : { a: hsl(h, 12, 86), b: hsl(h, 14, 55), c: hsl(h + 180, 95, 58), gl: '#ffecb3' };
      const def = { id: `v${n}_${k}`, st: n, k, tier: g, ch: c, wp, sub, sp, kit: kp.slice(0, 2), col, name: model + ' ' + VCH[c].n, idx: VEH.length };
      VEH.push(def); list.push(def);
    });
    VEH_ST[n] = list;
  }
})();

/* ------------------------- AI 동료 데이터 ------------------------- */
const ACL = {
  rifle: { n: '돌격 소총병', ic: '🪖', kind: 'soldier', hp: 70, spd: 150, range: 270, cd: .9, d: '3점사 연속 사격' },
  sniper: { n: '저격병', ic: '🎯', kind: 'soldier', hp: 55, spd: 140, range: 520, cd: 2.2, d: '원거리 정밀 관통 사격 (강한 적 우선)' },
  rocket: { n: '로켓 병사', ic: '🚀', kind: 'soldier', hp: 70, spd: 135, range: 340, cd: 2.5, d: '범위 폭발 로켓' },
  medic: { n: '의무병', ic: '⛑️', kind: 'soldier', hp: 65, spd: 150, range: 240, cd: 1.1, d: '9초마다 주인공·동료 회복 (탑승 시 차량 수리)' },
  dog: { n: '군견', ic: '🐕', kind: 'beast', hp: 60, spd: 235, range: 210, cd: .55, d: '빠른 이동 · 근접 물기 · 기절' },
  wolf: { n: '전투 늑대', ic: '🐺', kind: 'beast', hp: 75, spd: 248, range: 300, cd: .6, d: '먼 적까지 추적 · 출혈 피해' },
  drone: { n: '전투 드론', ic: '🛸', kind: 'drone', hp: 45, spd: 230, range: 270, cd: .45, fly: 1, d: '공중 자동 사격' },
  guard: { n: '방어 로봇', ic: '🛡️', kind: 'robot', hp: 150, spd: 140, range: 220, cd: 1.2, d: '적 탄환 차단 · 주변 적 도발' },
  flame: { n: '화염 방사병', ic: '🔥', kind: 'soldier', hp: 80, spd: 140, range: 125, cd: .1, d: '근거리 지속 화염' },
  mecha: { n: '전투 메카', ic: '🤖', kind: 'mecha', hp: 160, spd: 128, range: 340, cd: 1.4, d: '중화기 포격 + 기관총' }
};
const APERK = {
  inc: { n: '소이탄', d: '화상 피해' }, frost: { n: '냉각탄', d: '적 감속' }, ap: { n: '철갑탄', d: '방어 무시' }, shock: { n: '전격탄', d: '연쇄 번개' },
  rapid: { n: '속사', d: '공격 속도 +35%' }, heavy: { n: '고폭탄', d: '명중 시 소폭발' }, regen: { n: '자가 회복', d: '체력 재생' }, swift: { n: '고기동', d: '이동 속도 +30%' },
  mark: { n: '표적 지정', d: '맞은 적 받는 피해 +25%' }, pierce: { n: '관통탄', d: '적 관통' }, aura: { n: '사기 고양', d: '주인공 공격 속도 +6%' }, vet: { n: '베테랑', d: '피해 +25%' }
};
const APERK_K = Object.keys(APERK);
const AGROUP = [['rifle', 'dog', 'medic', 'rocket', 'sniper'], ['rifle', 'sniper', 'rocket', 'medic', 'dog', 'flame', 'drone', 'wolf'],
  ['rifle', 'sniper', 'rocket', 'medic', 'wolf', 'flame', 'drone', 'guard', 'mecha'], Object.keys(ACL)];
const APREFIX = ['폐허 생존자', '도로 순찰대', '기지 잔존병', '공장 경비대', '연구소 경호원', '지하철 수색대', '숲 레인저', '사막 특전대', '설원 정찰대', '빙결 도시 수비대',
  '화산 구조대', '발전소 기술병', '격리 시설 보안대', '정거장 승무원', '행성 탐사대', '공장 해방군', '생산기지 저항군', '네온 자경단', '미래 도시 경찰', '요새 침투조',
  '방사능 제독병', '벙커 생존병', '둥지 토벌대', '함선 침투조', '균열 감시대', '검은 행성 개척단', '신전 조사단', '우주 함대 해병', '요새 돌격대', '차원 결사대',
  '천공 수비대', '해저 기지 대원', '수정 광부', '정글 수색대', '피라미드 탐사대', '빙하 핵 연구원', '태양로 기술자', '시간 감시자', '심장부 저항군', '오메가 최후의 부대'];
const ALLY_ST = [];
(function genAllies() {
  let prev = [];
  for (let n = 1; n <= 40; n++) {
    const g = Math.floor((n - 1) / 10), pool = AGROUP[g], rnd = mulberry(n * 613 + 7);
    let a, b;
    if (n === 11) { a = 'flame'; b = 'drone'; } else if (n === 12) { a = 'wolf'; b = 'sniper'; } else if (n === 21) { a = 'guard'; b = 'mecha'; }
    else { for (let t = 0; t < 30; t++) { a = pool[Math.floor(rnd() * pool.length)]; b = pool[Math.floor(rnd() * pool.length)]; if (a !== b && !(prev.includes(a) && prev.includes(b))) break; } }
    const p1 = APERK_K[(n * 5 + 1) % APERK_K.length], p2 = APERK_K[(n * 7 + 4) % APERK_K.length];
    const spPool = pool.filter(c => c !== a && c !== b);
    const sc = spPool[Math.floor(rnd() * spPool.length)], sp1 = APERK_K[(n * 3 + 2) % APERK_K.length];
    ALLY_ST[n] = [
      { cls: a, perk: p1, name: `${APREFIX[n - 1]} ${ACL[a].n}`, hue: (n * 53) % 360 },
      { cls: b, perk: p2 === p1 ? APERK_K[(n * 7 + 5) % APERK_K.length] : p2, name: `${APREFIX[n - 1]} ${ACL[b].n}`, hue: (n * 53 + 150) % 360 },
      { cls: sc, perk: sp1, name: `특수부대 ${ACL[sc].n}`, hue: 45, special: 1 }
    ];
    prev = [a, b];
  }
})();
// 동료 합동 공격 (서로 다른 동료 조합 → 특별 공격, 재사용 대기시간 적용)
const COMBOS = [
  { a: 'sniper', b: 'drone', n: '정밀 추적 사격', ic: '🎯' }, { a: 'flame', b: 'guard', n: '화염 폭발', ic: '🔥' }, { a: 'flame', b: 'mecha', n: '화염 폭발', ic: '🔥' },
  { a: 'medic', b: 'guard', n: '보호막·회복 지원', ic: '💚' }, { a: 'rocket', b: 'mecha', n: '집중 포격', ic: '💥' }, { a: 'dog', b: 'wolf', n: '사냥 본능', ic: '🐾' },
  { a: 'rifle', b: 'sniper', n: '제압 사격', ic: '🔫' }, { a: 'drone', b: 'rocket', n: '공중 유도 폭격', ic: '🛸' }, { a: 'medic', b: 'rifle', n: '전장 응급 처치', ic: '⛑️' }
];
const ALLY_MAX = 5;

/* ------------------------- 특별 임무 (선택형 보조 목표) ------------------------- */
const SPM_KEYS = ['rescue', 'scrate', 'commander', 'hold', 'ride'];
function stageMissions(n) {
  const a = SPM_KEYS[n % 5], out = [a];
  if (n >= 16) { const b = SPM_KEYS[(n * 3 + 2) % 5]; if (b !== a) out.push(b); }
  return out.map(k => k === 'rescue' ? { k, n: 2 } : k === 'scrate' ? { k, n: 3 } : k === 'hold' ? { k, sec: 30 } : { k, n: 1 });
}
const SPM_LABEL = { rescue: '아군 병사 구출', scrate: '보급품 확보', commander: '적 지휘관 처치', hold: '지정 구역 사수', ride: '전투 차량 탑승' };

/* ------------------------- 스테이지 시작 ------------------------- */
let allies = [], vehs = [], rescues = [];
function extStageStart() {
  const n = G.stage;
  G.diffAcc = [0, 0, 0, 0]; G.veh = null; G.rkit = 0; G.comboCd = 8; G.acomboT = {}; G.cmdSpawned = false; G.cmdKilled = false;
  G.hpotT = DF().potT * 0.6; G.lastHpot = 0; G.rkitT = 40; G.radio = null; G.stormT = 0; G.stormWarn = 0; G.artT = 0; G.artTick = 0; G.surroundT = 30;
  G.extEvT = rand(55, 70); G.allyRank = 1; G.allyBoost = 1; G.pdps = 40; G.pAcc = 0; G.pdT = 0; G.allyEliteT = 40; G.hold = null; G.rescued = 0; G.vehUsed = 0; G.lungeN = 0; G.spDone = 0;
  allies = []; vehs = []; rescues = [];
  P.baseR = P.r;
  // 탑승 장비: 스테이지 진행률 45~75% 구간에 낙하산으로 투하 (3종 중 스테이지별 확률로 1종)
  const a0 = rand(0, TAU);
  G.vdropT = G.st.D * rand(0.45, 0.75); G.vdropDone = false;
  // 구조 대상 2명
  const al = ALLY_ST[n], b0 = a0 + Math.PI / 3;
  for (let i = 0; i < 2; i++) { const a = b0 + i * Math.PI + rand(-.4, .4), d = rand(380, 640); rescues.push(mkRescue(al[i], Math.cos(a) * d, Math.sin(a) * d, ['cage', 'capsule', 'chains'][(n + i) % 3])); }
  // 특별 임무
  for (const m of stageMissions(n)) {
    const q = mkQ(m, false, save.settings.fast ? 0.25 : 1); q.sp = true; G.quests.push(q);
    if (m.k === 'scrate') for (let i = 0; i < q.n; i++) { const a = rand(0, TAU), d = rand(460, 760); dropPickup('scrate', Math.cos(a) * d, Math.sin(a) * d, 0, null, true); }
    if (m.k === 'hold') { const a = rand(0, TAU), d = rand(380, 520); G.hold = { x: Math.cos(a) * d, y: Math.sin(a) * d, r: 110, q }; }
  }
  setRideBtn(); setSkillBtn();
}

/* ------------------------- 탑승 장비 ------------------------- */
function mkVeh(def, x, y) {
  const ch = VCH[def.ch], hp = Math.round(ch.hp * (1 + (G.stage - 1) * 0.075) * (1 + 0.03 * effUp('hp')) / Math.sqrt(DF().dmg));
  return { def, ch, x, y, hp, maxHp: hp, time: ch.time, maxTime: ch.time, tier: def.tier || 0, ultUsed: false, ultT: 0, repairs: 0, aim: 0, aim2: 0, face: 1, walkT: 0, recoil: 0, skCd: 2, ovT: 0, nitroT: 0, hoverT: 0, ramT: 0, sl: [], seats: [], dead: false, flash: 0, bob: rand(0, 6), seen: false };
}
// 실측(군중 상대) 피해량 기준 무기별 보정 — 단일 대상 무기는 덜 깎아 보스전 가치를 유지
const VW_MEAS = { mg: 300, minigun: 304, rocket: 801, homing: 829, grenade: 845, shell: 1336, mortar: 1603, laser: 329, plasma: 1044, flame: 1458, rail: 1355, tesla: 568, mlrs: 667, beam: 688 };
const VW_F = {}; for (const k in VW_MEAS) VW_F[k] = Math.pow(700 / VW_MEAS[k], 0.95);
// 적 체력 성장 지표 (시간·스테이지·난이도)
function enemyH() { return G.hpMul * (1 + 3 * progress()) * DF().hp; }
// 주인공의 최근 실제 화력 (탑승 중에는 탑승 시점 화력 + 레벨업 반영)
// 보유 무기 능력치로 계산한 화력 추정 (탑승 중 레벨업으로 무기가 강해져도 반영)
function powEst() {
  let s = 0;
  for (const w of G.weapons) { const st = wstat(w); const one = st.dmg && st.cd ? st.dmg * (st.n || 1) / Math.max(0.05, st.cd) : (st.dps || 20) * (st.n || 1); s += one * (st.boom || st.splash ? 1.5 : 1) * (w.evo ? 1.4 : 1); }
  return s;
}
function playerPow() { return Math.max((G.pdps || 40) / P.dmgMul * (G.veh ? 0.85 : 1), 1.6 * (1 + 0.16 * (G.stage - 1)) * powEst()); }
// 탑승 장비 화력: 주인공 화력의 약 1.35배, 단 스테이지 초반에도 의미 있도록 적 체력 기반 하한
function vehDmg(key, slot) {
  if (window.__VDM) return window.__VDM;
  const fl = 60 * enemyH() / Math.sqrt(DF().hp), target = clamp(2.6 * playerPow(), fl, fl * 8); // 시간제한형 고화력 (하한 + 상한)
  const share = G.veh && G.veh.def.sub ? (slot ? 0.38 : 0.72) : 1;
  return target / 300 * (key ? VW_F[key] : 1) * share;
}
function vehSpd() { const v = G.veh; return v.ch.spd * (1 + Math.min(0.3, 0.02 * effUp('spd'))) * (v.nitroT > 0 ? 2.1 : 1) * (P.slowT > 0 ? 0.7 : 1); }
function nearVeh() {
  if (G.veh) return null; let best = null, bd = 64 * 64;
  for (const v of vehs) { if (v.dead || v.drop) continue; const d = (v.x - P.x) ** 2 + (v.y - P.y) ** 2; if (d < bd) { bd = d; best = v; } }
  return best;
}
function rideToggle() {
  if (G.state !== 'play' || P.hp <= 0) return;
  if (G.veh) exitVehicle(false); // 탑승은 자동 (버튼 없음)
}
function boardVehicle(v) {
  G.veh = v; G.lvAtMount = G.lv; recalc(); P.x = v.x; P.y = v.y; P.r = v.ch.r * 0.8; P.inv = Math.max(P.inv, 0.6);
  if (!save.vfound[v.def.id]) { save.vfound[v.def.id] = 1; G.newVeh = (G.newVeh || 0) + 1; }
  G.vehUsed++; qAdd('ride');
  AU.sfx('power'); G.shake = Math.max(G.shake, 4);
  effects.push({ type: 'shock', x: P.x, y: P.y, r: v.ch.r * 2.2, t: 0, dur: .4, col: v.def.col.c });
  const L = linkAllies(v);
  toast(`🚘 탑승: ${v.def.name} (${Math.ceil(v.time)}초)<br><span style="font-size:14px">${VWPN[v.def.wp].n}${v.def.sub ? ' + ' + VWPN[v.def.sub].n : ''} · 특수: ${VSP[v.def.sp].n} · 필살기: ${VULT_NAME[VULT[v.def.ch]]}${L ? '<br>' + L : ''}</span>`, 2.4, v.def.col.c);
  setRideBtn(); setSkillBtn(); setUltBtn();
}
function exitVehicle(destroyed) {
  const v = G.veh; if (!v) return;
  G.veh = null; P.r = P.baseR || 12; recalc();
  for (const a of allies) if (a.seated === v) { a.seated = null; const ang = rand(0, TAU); a.x = P.x + Math.cos(ang) * 34; a.y = P.y + Math.sin(ang) * 34; }
  v.seats = [];
  if (destroyed === 'time') {
    v.dead = true; P.inv = Math.max(P.inv, 1.2); AU.sfx('clank'); G.shake = Math.max(G.shake, 4);
    for (let i = 0; i < 18; i++) addPart(P.x + rand(-20, 20), P.y - 10, rand(-60, 60), rand(-120, -40), 'rgba(90,90,90,.7)', 1.2, 6);
    effects.push({ type: 'shock', x: P.x, y: P.y, r: 70, t: 0, dur: .4, col: '#b0bec5' });
    toast('⏱️ 사용 시간 종료 — 장비 전투 불능<br><span style="font-size:14px">안전하게 하차했습니다</span>', 1.8, '#b0bec5');
  } else if (destroyed) {
    v.dead = true; P.inv = Math.max(P.inv, 1.6);
    explode(P.x, P.y, 90, 120 * vehDmg(), true, '#ff6d00'); G.shake = 14; G.flash = 0.35; G.flashCol = '255,120,0';
    for (let i = 0; i < 26; i++) addPart(P.x, P.y, rand(-260, 260), rand(-260, 120), pick(['#455a64', '#263238', '#ff9800', v.def.col.a]), rand(.5, 1), rand(3, 6), 300);
    toast('💥 탑승 장비 파괴! 자동 하차', 1.6, '#ff8a65');
  } else {
    v.x = P.x; v.y = P.y; P.x += 30; v.noAuto = true; AU.sfx('clank'); toast('하차 (멀어졌다가 다시 다가가면 자동 탑승)', 1.2, '#b0bec5');
  }
  setRideBtn(); setSkillBtn(); setUltBtn();
}
function vehHit(dmg, src) {
  const v = G.veh;
  if (v.hoverT > 0) return;
  if (v.ch.cat === 'air' && src && ET[src] && !ET[src].fly) dmg *= 0.5; // 비행 중 지상 근접 공격 절반
  const ar = Math.min(0.6, v.ch.ar + P.armor * 0.5);
  const d = Math.max(1, Math.round(dmg * (1 - ar)));
  v.hp -= d; v.flash = 0.12; P.inv = 0.22; G.shake = Math.max(G.shake, 2.5); AU.sfx('clank');
  if (G.dmgLog) G.dmgLog[src || '?'] = (G.dmgLog[src || '?'] || 0) + d;
  texts.push({ x: P.x, y: P.y - 26, t: 0, v: d, col: '#ffab91', pl: 1 });
  if (G.rkit && v.hp < v.maxHp * 0.5 && v.repairs < 2) { G.rkit = 0; repairVeh(v); }
  if (v.hp <= 0) exitVehicle(true);
}
function repairVeh(v) {
  v.repairs++; const h = Math.round(v.maxHp * 0.35); v.hp = Math.min(v.maxHp, v.hp + h); AU.sfx('heal');
  texts.push({ x: P.x, y: P.y - 30, t: 0, v: '🔧+' + h, col: '#80deea', pl: 1, big: 1 });
  toast(`🔧 차량 수리 (${v.repairs}/2)`, 1.1, '#80deea');
}
function vSlot(v, i) { return v.sl[i] || (v.sl[i] = { cd: 0.4 + i * .35, spin: 0, alt: 0, beamT: 0, ang: 0, on: 0, tick: 0 }); }
// 무기 장착 높이·포구 위치 (장비마다 다름)
function vMuzzle(v, a, side) {
  const len = v.ch.r * 0.9 + 6, h = v.ch.mh + (v.hoverT > 0 ? 18 : 0), off = side ? side * 7 : 0;
  return [P.x + Math.cos(a) * len - Math.sin(a) * off, P.y - h * 0.55 + Math.sin(a) * len + Math.cos(a) * off];
}
function vFlash(x, y, a, col, size) { if (effects.length < 170) effects.push({ type: 'flash', x, y, ang: a, col, t: 0, dur: 0.07, size }); }
function vWeapon(v, key, i, dt) {
  const W = VWPN[key], S = vSlot(v, i), dm = vehDmg(key, i), rate = (v.ovT > 0 ? 2 : 1) * (1 / P.cdMul);
  if (key === 'flame') {
    const FR = W.range * (1 + .15 * (v.tier || 0)); const t = nearest(P.x, P.y, FR + 20); S.on = !!t; if (!t) return;
    const ta = Math.atan2(t.y - P.y, t.x - P.x); S.ang += angDiff(ta, S.ang) * Math.min(1, dt * 8); if (!i) v.aim = S.ang; else v.aim2 = S.ang;
    S.tick -= dt * rate;
    const [mx, my] = vMuzzle(v, S.ang);
    if (Q.level && Math.random() < 0.9) for (let k = 0; k < Q.level; k++) { const aa = S.ang + rand(-.4, .4), sp = rand(200, 320); addPart(mx, my, Math.cos(aa) * sp, Math.sin(aa) * sp, pick(['#ff9800', '#ffeb3b', '#ff5722', '#fff3e0']), .38, rand(3, 6)); }
    if (S.tick <= 0) { S.tick = 0.1; for (const e of query(P.x, P.y, FR).slice()) { const ea = Math.atan2(e.y - P.y, e.x - P.x); if (Math.abs(angDiff(ea, S.ang)) < 0.5) hitEnemy(e, W.dps * 0.1 * dm, { tick: 1, silent: true, noCrit: true, burn: W.dps * 0.25 * dm, kb: 10, ang: S.ang }); } AU.sfx('flame', 1.1); }
    return;
  }
  if (S.beamT > 0) {
    S.beamT -= dt; const t = nearest(P.x, P.y, W.range + 30);
    if (t) { const ta = Math.atan2(t.y - P.y, t.x - P.x); S.ang += angDiff(ta, S.ang) * Math.min(1, dt * 5); }
    if (!i) v.aim = S.ang; else v.aim2 = S.ang;
    S.tick -= dt; const [x1, y1] = vMuzzle(v, S.ang), x2 = x1 + Math.cos(S.ang) * W.range, y2 = y1 + Math.sin(S.ang) * W.range;
    v.beam = [x1, y1, x2, y2, W.col];
    if (S.tick <= 0) { S.tick = 0.1; for (const e of query((x1 + x2) / 2, (y1 + y2) / 2, W.range / 2 + 10).slice()) if (segDist2(e.x, e.y, x1, y1, x2, y2) < (8 + 4 * (v.tier || 0) + e.r) ** 2) hitEnemy(e, W.dps * 0.1 * dm, { tick: 1, silent: true }); AU.sfx('beam', 1.2); }
    if (Math.random() < .6) addPart(x2, y2, rand(-90, 90), rand(-90, 90), W.col, .25, 3);
    if (S.beamT <= 0) v.beam = null;
    return;
  }
  S.cd -= dt * rate; if (S.cd > 0) return;
  const tgt = (key === 'mortar' || key === 'mlrs') ? (densest(W.range) || nearest(P.x, P.y, W.range)) : nearest(P.x, P.y, W.range);
  if (!tgt) { S.cd = 0.15; S.spin = Math.max(0, S.spin - 0.3); return; }
  const a = Math.atan2(tgt.y - P.y, tgt.x - P.x); S.ang = a; if (!i) v.aim = a; else v.aim2 = a;
  if (Math.abs(Math.cos(a)) > 0.25 && !i) v.face = Math.cos(a) > 0 ? 1 : -1;
  S.cd = W.cd;
  const col = W.col, tier = v.tier || 0;
  switch (key) {
    case 'mg': { S.alt ^= 1; const nb = tier >= 2 ? 3 : 2; for (let b = 0; b < nb; b++) { const [x, y] = vMuzzle(v, a, (S.alt ? 1 : -1) * (1 + b * 1.6)); const ang = a + rand(-.05, .05) + (b ? (S.alt ? .06 : -.06) : 0); mkProj({ kind: 'tracer', x, y, vx: Math.cos(ang) * 780, vy: Math.sin(ang) * 780, ang, r: 4, dmg: W.dmg * dm / (1 + (nb - 1) * .6), pierce: 2 + (tier >= 3 ? 1 : 0), life: W.range / 780, col, size: 1.1 + tier * .1, kb: 40 }); vFlash(x, y, a, col, 1.2); if (Q.level && Math.random() < .6) addPart(P.x, P.y - 12, rand(-70, 70), rand(-110, -60), '#ffca28', .45, 2, 420); } v.recoil = 2; break; }
    case 'minigun': { S.spin = Math.min(1, S.spin + 0.06); S.cd = W.cd / (0.3 + 0.7 * S.spin); for (let m = -1; m <= 1; m++) { const [x, y] = vMuzzle(v, a, m * 1.4); const ang = a + m * .13 + rand(-.07, .07); mkProj({ kind: 'tracer', x, y, vx: Math.cos(ang) * 820, vy: Math.sin(ang) * 820, ang, r: 4, dmg: W.dmg * dm * .55, pierce: 2, life: W.range / 820, col, size: 1, kb: 25 }); if (m === 0 || Math.random() < .4) vFlash(x, y, ang, col, 1.1); } v.recoil = 1.5; if (Q.level && Math.random() < .5) addPart(P.x, P.y - 10, rand(-60, 60), rand(-100, -50), '#ffca28', .4, 2, 420); break; }
    case 'rocket': { const nr = 2 + tier; for (let r2 = 0; r2 < nr; r2++) { S.alt ^= 1; const aa = a + (r2 - (nr - 1) / 2) * 0.16; const [x, y] = vMuzzle(v, aa, S.alt ? 1 : -1); mkProj({ kind: 'rocket', x, y, vx: Math.cos(aa) * 200, vy: Math.sin(aa) * 200, ang: aa, acc: 560, r: 6, dmg: W.dmg * dm * (1.35 + .25 * tier) / nr, pierce: 1, life: 1.3, col, boom: W.boom * (1 + .1 * tier), homing: tier >= 2 ? 2.5 : 0, target: tgt, explodeEnd: 1, size: 1.1 }); vFlash(x, y, aa, '#ffab40', 1.6); } v.recoil = 4; break; }
    case 'homing': { const K2 = W.k + 4 + 2 * tier; for (let k = 0; k < K2; k++) later(k * 0.06, () => { if (G.state !== 'play' || !G.veh) return; const t = (tgt && !tgt.dead) ? tgt : nearest(P.x, P.y, W.range); if (!t) return; const aa = a + (k - 1.5) * 0.45; const [x, y] = vMuzzle(v, aa); mkProj({ kind: 'missile', x, y, vx: Math.cos(aa) * 160, vy: Math.sin(aa) * 160, ang: aa, acc: 520, r: 5, dmg: W.dmg * dm * W.k * (1.35 + .2 * tier) / K2, pierce: 1, life: 2.2, sz2: 1, col, boom: W.boom, homing: 5, target: t, explodeEnd: 1, size: 1 }); AU.sfx('missile', 1.1); }); v.recoil = 2; break; }
    case 'grenade': { const [x, y] = vMuzzle(v, a); const d = Math.min(W.range, Math.hypot(tgt.x - x, tgt.y - y)); for (let g = -1; g <= 1; g++) mkProj({ kind: 'grenade', lob: 1, x0: x, y0: y, tx: x + Math.cos(a + g * .3) * d, ty: y + Math.sin(a + g * .3) * d, x, y, vx: 0, vy: 0, ang: 0, T: 0.5, tt: 0, r: 0, dmg: W.dmg * dm * (tier ? .75 : 1) * .5, life: 9, col, boom: W.boom, cluster: tier ? 2 + tier : 0, size: 1.1 + tier * .1, nohit: 1 }); vFlash(x, y, a, '#c5e1a5', 1.4); v.recoil = 3; break; }
    case 'shell': { const [x, y] = vMuzzle(v, a); mkProj({ kind: 'cball', x, y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, ang: a, r: 9 + tier, dmg: W.dmg * dm * (tier >= 2 ? .8 : 1), pierce: 3, life: W.range / 520, col, boom: W.boom * (1 + .12 * tier), multi: 4 + tier, shards: tier >= 2 ? 6 + tier * 2 : 0, shardDmg: W.dmg * dm * .12, explodeEnd: 1, size: 16 + tier * 2, kb: 140 }); vFlash(x, y, a, '#ffab40', 3.2); for (let k = 0; k < 8; k++) addPart(x, y, Math.cos(a + rand(-.8, .8)) * rand(60, 160), Math.sin(a + rand(-.8, .8)) * rand(60, 160), 'rgba(200,200,200,.6)', .6, 5); v.recoil = 9; G.shake = Math.max(G.shake, 4); break; }
    case 'mortar': { const K3 = W.k + 2 + tier; for (let k = 0; k < K3; k++) later(k * 0.2, () => { if (G.state !== 'play' || !G.veh) return; const tx = tgt.x + rand(-60, 60), ty = tgt.y + rand(-60, 60); const [x, y] = vMuzzle(v, -Math.PI / 2); mkProj({ kind: 'shell', lob: 1, x0: x, y0: y, tx, ty, x, y, vx: 0, vy: 0, ang: 0, T: 0.9, tt: 0, r: 0, dmg: W.dmg * dm * W.k * (1.3 + .2 * tier) / K3, life: 9, col, boom: W.boom, size: 1.2, nohit: 1 }); effects.push({ type: 'target', x: tx, y: ty, r: W.boom * .7, t: 0, dur: .9, col: '#ffcc80' }); vFlash(x, y, -Math.PI / 2, '#ffe0b2', 1.8); AU.sfx('mortar', 1); }); v.recoil = 4; break; }
    case 'laser': { S.alt ^= 1; const [x, y] = vMuzzle(v, a, S.alt ? 1.6 : -1.6); const nl = tier >= 2 ? 4 : 2; S.pc = (S.pc || 0) + 1; if (S.pc % 4 === 0) mkProj({ kind: 'plasma', x, y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, ang: a, r: 9, dmg: W.dmg * dm * 2.2, pierce: 999, life: Math.min(W.range, Math.hypot(tgt.x - x, tgt.y - y) + 30) / 420, col: '#ff4081', boom: 46, shock: 70, explodeEnd: 1, size: 9 }); for (let l = 0; l < nl; l++) { const aa = a + (l - (nl - 1) / 2) * .1; const q = mkProj({ kind: 'lbolt', x, y, vx: Math.cos(aa) * 900, vy: Math.sin(aa) * 900, ang: aa, r: 5, dmg: W.dmg * dm * (1.3 / nl), pierce: 2 + (tier >= 1 ? 2 : 0), life: W.range / 900, col, len: 26 + tier * 6, kb: 25 }); if (tier >= 1 && !l) q.storm = 1; } vFlash(x, y, a, col, 1 + tier * .2); break; }
    case 'plasma': { const [x, y] = vMuzzle(v, a); const d = Math.min(W.range, Math.hypot(tgt.x - x, tgt.y - y) + 40); mkProj({ kind: 'plasma', x, y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, ang: a, r: 10 + tier * 2, dmg: W.dmg * dm, pierce: 999, life: d / 380, col, boom: W.boom * (1.2 + .15 * tier), shock: 110 + tier * 15, shards: tier >= 2 ? 5 + tier : 0, shardDmg: W.dmg * dm * .2, explodeEnd: 1, size: 10 + tier * 2 }); vFlash(x, y, a, col, 2); v.recoil = 4; break; }
    case 'rail': { const nRail = tier >= 2 ? 3 : 2; const [x1, y1] = vMuzzle(v, a); effects.push({ type: 'charge', t: 0, dur: 0.25, col }); later(0.25, () => { if (G.state !== 'play' || !G.veh) return; for (let rl = 0; rl < nRail; rl++) { const ra = a + (rl - (nRail - 1) / 2) * .12; const [xa, ya] = vMuzzle(v, ra), x2 = xa + Math.cos(ra) * W.range, y2 = ya + Math.sin(ra) * W.range; effects.push({ type: 'rail', x1: xa, y1: ya, x2, y2, w: 12 + tier * 2, col, t: 0, dur: 0.3 }); for (const e of query((xa + x2) / 2, (ya + y2) / 2, W.range / 2 + 10).slice()) if (segDist2(e.x, e.y, xa, ya, x2, y2) < (8 + e.r) ** 2) hitEnemy(e, W.dmg * dm * (1.3 / nRail), { ap: 0.6, kb: 90, ang: ra, silent: true }); if (Q.level && fxOk()) effects.push({ type: 'ering', x: x2, y: y2, r: 30, t: 0, dur: .3, col }); } AU.sfx('rail', 1); v.recoil = 8; G.shake = Math.max(G.shake, 4); }); void x1; break; }
    case 'tesla': { const [x, y] = vMuzzle(v, a); const ts = nearestK(P.x, P.y, W.range, W.k + 2 + tier); for (const t of ts) { const pts = [[x, y], [t.x, t.y]]; hitEnemy(t, W.dmg * dm, { silent: true, stun: 0.15 }); let cur = t; const hit = new Set([t.id]); for (let c = 0; c < 3; c++) { let best = null, bd = 140 * 140; for (const e of query(cur.x, cur.y, 130)) { if (hit.has(e.id)) continue; const dd = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2; if (dd < bd) { bd = dd; best = e; } } if (!best) break; hit.add(best.id); pts.push([best.x, best.y]); hitEnemy(best, W.dmg * dm * 0.7, { silent: true }); cur = best; } effects.push({ type: 'bolt', pts, t: 0, dur: 0.2, seed: Math.random() * 100, col }); } break; }
    case 'mlrs': { const list = enemies.filter(e => !e.dead && onScreen(e, -10)); const K4 = Math.round((W.k + 3 * tier) * 1.25); for (let k = 0; k < K4; k++) later(k * 0.07, () => { if (G.state !== 'play' || !G.veh || !list.length) return; const t = pick(list); if (t.dead) return; const aa = -Math.PI / 2 + rand(-.6, .6); const [x, y] = vMuzzle(v, aa); mkProj({ kind: 'missile', x, y, vx: Math.cos(aa) * 220, vy: Math.sin(aa) * 220, ang: aa, acc: 480, r: 5, dmg: W.dmg * dm * W.k * (1.3 + .2 * tier) / K4, pierce: 1, life: 2.4, col, boom: W.boom, homing: 4.5, target: t, explodeEnd: 1, size: .9 }); vFlash(x, y, aa, '#ffd180', 1); }); AU.sfx('missile', .8); v.recoil = 3; break; }
    case 'beam': { S.beamT = W.dur; S.tick = 0; AU.sfx('beam', 1); break; }
  }
  if (key !== 'homing' && key !== 'mortar' && key !== 'mlrs' && key !== 'beam' && key !== 'rail') { AU.sfx(W.s[0], W.s[1] * (v.ch.r >= 25 ? 0.72 : v.ch.r <= 17 ? 1.3 : 1)); if (v.ch.r >= 25 || key === 'shell') AU.sfx('boom', 1); if (v.ch.cat === 'hover' || v.def.ch === 'saucer' || v.def.ch === 'dpod') AU.sfx('zap', 1.4); }
  if (key === 'rocket' || key === 'plasma' || key === 'grenade') G.shake = Math.max(G.shake, 2.2);
}
function updateVehicle(dt) {
  const v = G.veh;
  v.time -= dt;
  if (v.time <= 5 && Math.floor(v.time * 2) !== Math.floor((v.time + dt) * 2)) AU.sfx('alarm');
  if (v.time <= 0) { exitVehicle('time'); return; }
  if (v.ultT > 0) updateUlt(v, dt);
  v.x = P.x; v.y = P.y; if (P.moving) { v.walkT += dt; if (Math.abs(P.lastMx) > 0.2) v.face = P.lastMx > 0 ? 1 : -1; }
  if (v.recoil > 0) v.recoil = Math.max(0, v.recoil - dt * 30); if (v.flash > 0) v.flash -= dt;
  if (v.skCd > 0) v.skCd -= dt; if (v.ovT > 0) v.ovT -= dt; if (v.nitroT > 0) v.nitroT -= dt; if (v.ramT > 0) v.ramT -= dt;
  if (v.hoverT > 0) { v.hoverT -= dt; P.inv = Math.max(P.inv, 0.05); if (v.hoverT <= 0) { G.shake = 8; AU.sfx('slam'); effects.push({ type: 'shock', x: P.x, y: P.y, r: 130, t: 0, dur: .4, col: v.def.col.c }); for (const e of query(P.x, P.y, 130).slice()) hitEnemy(e, 135 * vehDmg(), { kb: 220, ang: Math.atan2(e.y - P.y, e.x - P.x), stun: .8, silent: true }); } }
  v.beam = null;
  vWeapon(v, v.def.wp, 0, dt);
  if (v.def.sub) vWeapon(v, v.def.sub, 1, dt);
  // 동승한 동료의 보조 화기
  for (const a of v.seats) seatFire(a, v, dt);
  // 충돌(밀어붙이기) 피해: 지상·보행 장비
  if (v.ch.crush && (P.moving || v.ramT > 0)) {
    const mul = (v.nitroT > 0 ? 3 : 1) * (v.ramT > 0 ? 5 : 1);
    for (const e of query(P.x, P.y, P.r + 6).slice()) {
      if (e.static || (e.crushCd || 0) > G.time) continue; e.crushCd = G.time + 0.45;
      hitEnemy(e, v.ch.crush * vehDmg() * 3 * mul * (e.boss ? 0.4 : 1), { kb: e.boss ? 0 : 200, ang: Math.atan2(e.y - P.y, e.x - P.x), silent: true });
      if (Q.level) addPart(e.x, e.y, rand(-80, 80), rand(-80, 0), '#bcaaa4', .3, 3);
    }
  }
  if (v.ch.cat !== 'air' && P.moving && Q.level && Math.random() < 0.35) addPart(P.x - v.face * v.ch.r * .8, P.y + v.ch.r * .4, -v.face * rand(20, 60), rand(-30, -5), 'rgba(160,140,120,.55)', .5, 4);
  if ((v.ch.cat === 'air' || v.ch.cat === 'hover') && Q.level && Math.random() < 0.25) addPart(P.x + rand(-v.ch.r, v.ch.r), P.y + v.ch.r * .5, rand(-40, 40), rand(5, 25), 'rgba(200,220,255,.35)', .4, 4);
  if (v.nitroT > 0 && Math.random() < .9) addPart(P.x - v.face * v.ch.r, P.y, -v.face * rand(80, 160), rand(-20, 20), pick(['#ff9800', '#ffeb3b', '#80d8ff']), .3, 4);
  if (v.hp < v.maxHp * 0.3 && Math.random() < 0.3) addPart(P.x + rand(-8, 8), P.y - v.ch.mh, rand(-15, 15), rand(-70, -40), 'rgba(60,60,60,.6)', .9, 5);
}
function useVehSpecial() {
  const v = G.veh; if (!v || v.skCd > 0 || G.state !== 'play' || G.paused) return;
  const sp = v.def.sp, dm = vehDmg() * 3; v.skCd = VSP[sp].cd;
  AU.sfx('power');
  switch (sp) {
    case 'nitro': v.nitroT = 1.4; P.inv = Math.max(P.inv, .3); AU.sfx('dash'); break;
    case 'smoke': fields.push({ k: 'gas', x: P.x, y: P.y, r: 140, t: 0, dur: 4, dps: 0, tick: 0, col: '#b0bec5', pull: 0 }); for (const e of query(P.x, P.y, 150)) { e.slowT = 3; e.slowF = Math.min(e.slowF, e.boss ? .7 : .4); } P.inv = Math.max(P.inv, 1); for (let i = 0; i < 30; i++) addPart(P.x + rand(-90, 90), P.y + rand(-60, 60), rand(-30, 30), rand(-40, -10), 'rgba(207,216,220,.7)', 1.6, 8); break;
    case 'shield': G.buff.barrier = (G.buff.barrier || 0) + 3; effects.push({ type: 'shock', x: P.x, y: P.y, r: 60, t: 0, dur: .4, col: '#80d8ff' }); toast('🛡️ 보호막 3회', 0.9, '#80d8ff'); break;
    case 'stomp': G.shake = 10; AU.sfx('slam'); effects.push({ type: 'shock', x: P.x, y: P.y, r: 150, t: 0, dur: .45, col: v.def.col.c }); for (const e of query(P.x, P.y, 150).slice()) hitEnemy(e, 60 * dm, { kb: 260, ang: Math.atan2(e.y - P.y, e.x - P.x), stun: 1, silent: true }); break;
    case 'salvo': for (let k = 0; k < 16; k++) later(k * 0.04, () => { if (G.state !== 'play') return; const aa = k / 16 * TAU; const t = nearest(P.x + Math.cos(aa) * 150, P.y + Math.sin(aa) * 150, 300); mkProj({ kind: 'missile', x: P.x, y: P.y - 10, vx: Math.cos(aa) * 200, vy: Math.sin(aa) * 200, ang: aa, acc: 480, r: 5, dmg: 30 * dm, pierce: 1, life: 2.2, col: '#ff8a65', boom: 42, homing: 4, target: t, explodeEnd: 1, size: 1 }); }); AU.sfx('missile', 1); break;
    case 'airstrike': for (let k = 0; k < 10; k++) { const t = densest(Math.min(VW, VH) * 0.6) || nearest(P.x, P.y, 400); if (!t) break; const x = t.x + rand(-50, 50), y = t.y + rand(-50, 50); later(k * 0.12, () => effects.push({ type: 'target', x, y, r: 50, t: 0, dur: 0.6, col: '#ff5252' })); later(k * 0.12 + 0.6, () => { if (G.state !== 'play') return; effects.push({ type: 'skybeam', x, y, r: 9, t: 0, dur: .2, col: '#ffccbc' }); explode(x, y, 70, 55 * dm, true, '#ff7043'); }); } toast('✈️ 공습 요청!', .9, '#ff8a65'); break;
    case 'emp': G.flash = .3; G.flashCol = '120,180,255'; for (const e of enemies) if (!e.dead && onScreen(e, 20)) { if (e.boss) { e.slowT = 2.5; e.slowF = .6; } else if (!e.static) e.stunT = Math.max(e.stunT, 2.2); } for (const b of eprojs) if (Math.abs(b.x - P.x) < VW / 2 && Math.abs(b.y - P.y) < VH / 2) b.dead = true; effects.push({ type: 'nova', x: P.x, y: P.y, r: Math.max(VW, VH) * .6, t: 0, dur: .5, col: '#82b1ff' }); AU.sfx('zap'); break;
    case 'repair': { const h = Math.round(v.maxHp * .25); v.hp = Math.min(v.maxHp, v.hp + h); AU.sfx('heal'); texts.push({ x: P.x, y: P.y - 30, t: 0, v: '🔧+' + h, col: '#80deea', pl: 1, big: 1 }); break; }
    case 'overdrive': v.ovT = 6; toast('⏩ 과부하 사격!', .9, '#ffd54f'); break;
    case 'flare': for (const b of eprojs) if ((b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 260 * 260) b.dead = true; P.inv = Math.max(P.inv, .8); for (let i = 0; i < 24; i++) { const aa = rand(0, TAU); addPart(P.x, P.y, Math.cos(aa) * rand(80, 220), Math.sin(aa) * rand(80, 220), pick(['#fff59d', '#ffab40', '#ffffff']), .9, 4, 120); } break;
    case 'ram': { let dx = P.lastMx, dy = P.lastMy; const t = nearest(P.x, P.y, 260); if (t) { const d = Math.hypot(t.x - P.x, t.y - P.y) || 1; dx = (t.x - P.x) / d; dy = (t.y - P.y) / d; } P.dashT = .35; P.dashVx = dx * 700; P.dashVy = dy * 700; v.ramT = .45; P.inv = Math.max(P.inv, .45); AU.sfx('dash'); break; }
    case 'hover': v.hoverT = 1.4; AU.sfx('portal'); break;
  }
}

/* ------------------------- 구조 / 동료 ------------------------- */
function mkRescue(spec, x, y, kind) {
  return { spec, x, y, kind, prog: 0, need: clamp((5 + G.stage * 0.08) * DF().rescue, 5, 10.5) * (save.settings.fast ? 0.5 : 1), done: false, active: false, spawnT: 1.5, r: 78, warned: false };
}
function mkAlly(spec, x, y) {
  const c = ACL[spec.cls], hpm = (1 + (G.stage - 1) * 0.1) * (spec.special ? 1.5 : 1);
  return { spec, cls: spec.cls, c, x, y, hp: c.hp * hpm, maxHp: c.hp * hpm, cd: rand(.2, .8), face: 1, walkT: 0, aim: 0, down: 0, seated: null, tgt: null, atkT: 0, healT: 4, flash: 0, id: Math.random(), bite: 0, fireOn: 0, fireAng: 0, fireTick: 0, z: 0 };
}
function activeAllies() { let n = 0; for (const a of allies) if (a.down <= 0) n++; return n; }
function addAlly(spec, x, y) {
  if (allies.length >= ALLY_MAX) {
    const g = goldX((40 + 15 * G.stage) * P.greed); G.gold += g; heal(Math.round(P.maxHp * .2));
    toast(`동료가 가득 차 보급을 받았습니다 +${g}G`, 1.6, '#ffd54f'); return null;
  }
  const a = mkAlly(spec, x, y); allies.push(a);
  if (!save.afound[spec.cls + spec.perk]) save.afound[spec.cls + spec.perk] = 1;
  if (G.veh) linkAllies(G.veh, true);
  return a;
}
// 동료 1명 화력 ≈ 주인공 화력의 15% (스테이지 초반 하한 포함)
// 동료 성장: 주인공 공격력 증가분의 약 50%만 반영 (주인공 +100% → 동료 +50%)
function allyGrowth() {
  let lvs = 0; for (const w of G.weapons) lvs += w.lv + (w.evo ? 2 : 0); const avg = G.weapons.length ? lvs / G.weapons.length : 1;
  const idx = P.dmgMul * (1 + 0.04 * (G.lv - 1)) * (1 + 0.08 * (avg - 1));
  return 1 + 0.5 * Math.max(0, idx - 1);
}
function aRank() { return Math.min(5, 1 + Math.floor((G.lv - 1) / 6)); }
function allyBase() { return 5 * enemyH() / Math.sqrt(DF().hp) * allyGrowth() * (G.allyBoost || 1) / 27; }
function aDmg(a) { return allyBase() * (a.spec.perk === 'vet' ? 1.25 : 1) * (a.spec.special ? 1.4 : 1); }
function linkAllies(v, quiet) {
  const L = v.ch.link; let seats = L === 'A' ? 2 : (L === 'A1' && (v.def.idx % 2 === 0)) ? 1 : 0;
  v.seats = v.seats.filter(a => allies.includes(a) && a.down <= 0);
  for (const a of allies) {
    if (seats <= v.seats.length) break;
    if (a.seated || a.down > 0 || a.c.kind !== 'soldier') continue;
    a.seated = v; v.seats.push(a);
  }
  if (quiet || !allies.length) return '';
  if (v.seats.length) return `🚌 동승 전투: 동료 ${v.seats.length}명 탑승 (보조 화기)`;
  if (v.ch.cat === 'air') return allies.some(a => a.c.fly) ? '✈️ 공중 지원 + 🪖 지상 지원' : '🪖 지상 지원: 동료가 지상에서 따라옵니다';
  return '🛡️ 호위 전투: 동료가 주변에서 호위합니다';
}
function seatFire(a, v, dt) {
  a.cd -= dt * (a.spec.perk === 'rapid' ? 1.35 : 1); if (a.cd > 0) return;
  const dm = aDmg(a);
  if (a.cls === 'medic') { a.cd = 1; v.hp = Math.min(v.maxHp, v.hp + v.maxHp * 0.012); return; }
  const t = nearest(P.x, P.y, 320); if (!t) { a.cd = .2; return; }
  const ang = Math.atan2(t.y - P.y, t.x - P.x), x = P.x + rand(-8, 8), y = P.y - v.ch.mh * .5;
  if (a.cls === 'rocket') { a.cd = 2.2; mkProj({ kind: 'missile', x, y, vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200, ang, acc: 460, r: 5, dmg: 26 * dm, pierce: 1, life: 1.6, col: '#ff8a65', boom: 40, homing: 4, target: t, explodeEnd: 1, size: .9 }); AU.sfx('missile', 1.3); }
  else if (a.cls === 'flame') { a.cd = .15; for (const e of query(P.x, P.y, 110).slice()) hitEnemy(e, 6 * dm, { tick: 1, silent: true, noCrit: true, burn: 10 * dm }); if (Q.level) addPart(x, y, Math.cos(ang) * 200, Math.sin(ang) * 200, '#ff9800', .3, 4); }
  else if (a.cls === 'sniper') { a.cd = 2; mkProj({ kind: 'slug', x, y, vx: Math.cos(ang) * 1100, vy: Math.sin(ang) * 1100, ang, r: 4, dmg: 55 * dm, pierce: 4, life: .45, col: '#fff176', size: 1.2, kb: 80 }); AU.sfx('rifle', .7); }
  else { a.cd = .16; mkProj({ kind: 'tracer', x, y, vx: Math.cos(ang) * 760, vy: Math.sin(ang) * 760, ang: ang + rand(-.06, .06), r: 4, dmg: 6 * dm, pierce: 1, life: .45, col: '#ffe082', size: .9, kb: 20 }); AU.sfx('smg', 1.3); }
}
function allyHit(a, e, base, o = {}) {
  const p = a.spec.perk; const opt = Object.assign({ silent: true }, o);
  if (p === 'inc') opt.burn = base * 0.35; if (p === 'frost') opt.slow = 0.35; if (p === 'ap') opt.ap = 0.6; if (p === 'mark') e.markT = 3;
  opt.ally = 1; hitEnemy(e, base, opt);
  if (p === 'shock' && Math.random() < .3 && !e.dead) { const t2 = nearest(e.x, e.y, 120, new Set([e.id])); if (t2) zap(e.x, e.y, t2, base * .5, { col: '#ffee58' }); }
  if (p === 'heavy' && Math.random() < .35) explode(e.x, e.y, 30, base * .4, true, '#ff9100');
}
function allyShoot(a, t, dm, rk = 1) {
  const c = a.c, ang = Math.atan2(t.y - a.y, t.x - a.x), x = a.x + Math.cos(ang) * 12, y = a.y - 6 + Math.sin(ang) * 12, p = a.spec.perk;
  a.aim = ang; a.atkT = .2; if (Math.abs(Math.cos(ang)) > .2) a.face = Math.cos(ang) > 0 ? 1 : -1;
  const sz = 1 + .08 * (rk - 1); const pr = (o) => { if (o.size) o.size *= sz; if (o.r) o.r *= sz; o.ally = a; return mkProj(o); };
  switch (a.cls) {
    case 'rifle': for (let k = 0; k < (rk >= 4 ? 4 : 3); k++) later(k * 0.08, () => { if (G.state !== 'play' || a.down > 0 || a.seated) return; const aa = Math.atan2(t.y - a.y, t.x - a.x) + rand(-.06, .06); pr({ kind: 'tracer', x: a.x + Math.cos(aa) * 12, y: a.y - 6 + Math.sin(aa) * 12, vx: Math.cos(aa) * 720, vy: Math.sin(aa) * 720, ang: aa, r: 4, dmg: 8 * dm, pierce: (p === 'pierce' ? 3 : 1) + (rk >= 3 ? 1 : 0), life: c.range / 720, col: rk >= 3 ? '#80deea' : '#ffe082', size: .9, kb: 25 }); AU.sfx('rifle', 1.25); }); break;
    case 'sniper': pr({ kind: 'slug', x, y, vx: Math.cos(ang) * 1200, vy: Math.sin(ang) * 1200, ang, r: 4, dmg: 62 * dm, pierce: 5 + rk, boom: rk >= 4 ? 34 : 0, life: c.range / 1200, col: '#fff176', size: 1.3, kb: 100, ap: .4 }); effects.push({ type: 'rail', x1: x, y1: y, x2: x + Math.cos(ang) * 120, y2: y + Math.sin(ang) * 120, w: 2, col: '#fff59d', t: 0, dur: .12 }); AU.sfx('rifle', .6); break;
    case 'rocket': for (let k = 0; k < (rk >= 4 ? 2 : 1); k++) { const aa = ang + (k ? .2 : 0); pr({ kind: 'rocket', x, y, vx: Math.cos(aa) * 180, vy: Math.sin(aa) * 180, ang: aa, acc: 480, r: 6, dmg: 34 * dm * (rk >= 4 ? .6 : 1), pierce: 1, life: 1.4, col: '#ff7043', boom: 55 * (1 + .12 * (rk - 1)), homing: k ? 3 : 0, target: t, explodeEnd: 1, size: 1 }); } effects.push({ type: 'flash', x, y, ang, col: '#ffab40', t: 0, dur: .07, size: 1.4 }); AU.sfx('rocket', 1.2); break;
    case 'medic': pr({ kind: 'bullet', x, y, vx: Math.cos(ang) * 650, vy: Math.sin(ang) * 650, ang, r: 4, dmg: 7 * dm, pierce: 1, life: c.range / 650, col: '#e0f7fa', size: .9, kb: 15 }); AU.sfx('smg', 1.5); break;
    case 'drone': a.shots = (a.shots || 0) + 1; if (rk >= 2 && a.shots % (rk >= 4 ? 2 : 3) === 0) { pr({ kind: 'missile', x: a.x, y: a.y - 26, vx: 0, vy: -180, ang: -Math.PI / 2, acc: 460, r: 5, dmg: 18 * dm, pierce: 1, life: 2, col: '#ff8a65', boom: 32, homing: 5, target: t, explodeEnd: 1, size: .8 }); AU.sfx('missile', 1.4); }
      pr({ kind: 'lbolt', x: a.x, y: a.y - 26, vx: Math.cos(ang) * 850, vy: Math.sin(ang) * 850, ang, r: 4, dmg: 7 * dm, pierce: p === 'pierce' ? 3 : 1, life: c.range / 850, col: '#18ffff', len: 14, kb: 10 }); AU.sfx('drone', 1.2); break;
    case 'guard': pr({ kind: 'bullet', x, y, vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620, ang, r: 4, dmg: 12 * dm, pierce: 1, life: c.range / 620, col: '#80d8ff', size: 1.1, kb: 50 }); AU.sfx('turret', .9); break;
    case 'mecha': a.alt = (a.alt || 0) ^ 1;
      if (a.alt) { pr({ kind: 'cball', x, y: y - 6, vx: Math.cos(ang) * 480, vy: Math.sin(ang) * 480, ang, r: 7, dmg: 40 * dm, pierce: 2, life: c.range / 480, col: '#ffab40', boom: 52, explodeEnd: 1, size: 12, kb: 100 }); effects.push({ type: 'flash', x, y: y - 6, ang, col: '#ffab40', t: 0, dur: .08, size: 2.4 }); AU.sfx('cannon', 1.3); }
      else if (rk >= 3) { for (const sd of [-5, 5]) pr({ kind: 'lbolt', x: a.x, y: a.y - 14 + sd, vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900, ang, r: 5, dmg: 16 * dm, pierce: 3, life: .4, col: '#ff1744', len: 24, kb: 20 }); AU.sfx('laser', 1.2); }
      else for (let k = 0; k < 4; k++) later(k * .07, () => { if (G.state !== 'play' || a.down > 0 || a.seated) return; const aa = Math.atan2(t.y - a.y, t.x - a.x) + rand(-.08, .08); pr({ kind: 'tracer', x: a.x, y: a.y - 10, vx: Math.cos(aa) * 760, vy: Math.sin(aa) * 760, ang: aa, r: 4, dmg: 9 * dm, pierce: 1, life: .45, col: '#ffe082', size: 1, kb: 25 }); AU.sfx('hmg', 1.4); });
      break;
  }
}
function updateAllies(dt) {
  const n = allies.length; G.hasGuard = false; if (!n) return;
  for (const a of allies) if (a.cls === 'guard' && a.down <= 0 && !a.seated) G.hasGuard = true;
  const mv = Math.hypot(P.lastMx, P.lastMy) || 1, bx = P.moving ? -P.lastMx / mv : 0, by = P.moving ? -P.lastMy / mv : 1;
  const air = G.veh && G.veh.ch.cat === 'air';
  const rk = aRank(); if (rk > (G.allyRank || 1)) { G.allyRank = rk; toast(`⭐ 동료 전원 진급! 계급 ${rk}<br><span style="font-size:14px">${['', '', '연사·특수탄 강화', '소총병 관통탄 · 메카 쌍열 레이저 해금', '저격 폭발탄 · 로켓 2연발 · 드론 미사일 증가', '최대 계급: 모든 능력 강화'][rk]}</span>`, 1.8, '#ffd54f'); }
  let i = 0;
  for (const a of allies) {
    if (a.seated) { a.x = P.x; a.y = P.y; i++; continue; }
    const c = a.c, idx = i++;
    if (a.flash > 0) a.flash -= dt; if (a.atkT > 0) a.atkT -= dt;
    if (a.spec.perk === 'regen' && a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.02 * dt);
    // 쓰러짐 → 일정 시간 후 복귀
    if (a.down > 0) {
      a.down -= dt * (allies.some(m => m.cls === 'medic' && m.down <= 0 && m !== a) ? 2 : 1);
      if (a.down <= 0) { a.hp = a.maxHp * .5; texts.push({ x: a.x, y: a.y - 20, t: 0, v: '복귀!', col: '#69f0ae', pl: 1 }); effects.push({ type: 'healfx', x: a.x, y: a.y, r: 40, t: 0, dur: .5 }); }
    }
    // 대형 위치 (플레이어 뒤쪽 반원)
    const fly = !!c.fly, spread = n > 1 ? (idx / (n - 1) - 0.5) * 2.4 : 0;
    const ba = Math.atan2(by, bx) + spread, rad = fly ? 46 : (G.veh ? G.veh.ch.r + 34 : 52) + (idx % 2) * 14;
    let sx = P.x + Math.cos(ba) * rad, sy = P.y + Math.sin(ba) * rad;
    if (fly) { const oa = G.time * 1.6 + idx * 2; sx = P.x + Math.cos(oa) * rad; sy = P.y + Math.sin(oa) * rad * .7; }
    let tx = sx, ty = sy, spd = c.spd * (a.spec.perk === 'swift' ? 1.3 : 1) * (a.down > 0 ? .6 : 1) * (air && fly ? 1.6 : 1);
    // 근접형: 적을 향해 돌진
    const pd = Math.hypot(P.x - a.x, P.y - a.y);
    if (a.down <= 0 && c.kind === 'beast') {
      if (!a.tgt || a.tgt.dead || Math.hypot(a.tgt.x - P.x, a.tgt.y - P.y) > c.range + 60) a.tgt = nearest(a.x, a.y, c.range);
      if (a.tgt && pd < c.range + 80) { tx = a.tgt.x; ty = a.tgt.y; spd *= 1.15; }
    }
    // 이동 (멀리 떨어지면 빠르게 따라오고, 너무 멀면 재합류)
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (pd > 480) { effects.push({ type: 'poof', x: a.x, y: a.y, r: 14, t: 0, dur: .3 }); const ra = rand(0, TAU); a.x = P.x + Math.cos(ra) * 60; a.y = P.y + Math.sin(ra) * 60; effects.push({ type: 'portal', x: a.x, y: a.y, t: 0, dur: .4 }); continue; }
    const catchUp = pd > 170 ? 1.7 : 1;
    if (d > 4) { const st = Math.min(d, spd * catchUp * dt); a.x += dx / d * st; a.y += dy / d * st; a.walkT += dt; if (Math.abs(dx) > 2 && a.atkT <= 0) a.face = dx > 0 ? 1 : -1; a.moving = true; } else a.moving = false;
    // 서로 겹치지 않게
    for (const o of allies) { if (o === a || o.seated) continue; const ox = a.x - o.x, oy = a.y - o.y, dd = ox * ox + oy * oy; if (dd > 0.01 && dd < 26 * 26) { const dl = Math.sqrt(dd), push = (26 - dl) * .5; a.x += ox / dl * push; a.y += oy / dl * push; } }
    // 플레이어(차량)와도 겹치지 않게
    { const ox = a.x - P.x, oy = a.y - P.y, dd = ox * ox + oy * oy, rr = P.r + 12; if (!fly && dd > 0.01 && dd < rr * rr) { const dl = Math.sqrt(dd); a.x += ox / dl * (rr - dl) * .6; a.y += oy / dl * (rr - dl) * .6; } }
    if (a.down > 0) continue;
    // 접촉 피해 (적에게 둘러싸이면 맞음)
    if (!fly) for (const e of query(a.x, a.y, 10)) { if (e.static || e.dmg <= 0 || e.atkCd > 0) continue; e.atkCd = 0.8; a.hp -= e.dmg * DF().dmg * 0.7; a.flash = .1; if (a.hp <= 0) { a.hp = 0; a.down = 15; a.tgt = null; texts.push({ x: a.x, y: a.y - 20, t: 0, v: '부상!', col: '#ff8a80', pl: 1 }); AU.sfx('hurt'); } break; }
    // 의무병: 회복
    if (a.cls === 'medic') { a.healT -= dt; if (a.healT <= 0) { a.healT = 9; if (P.hp < P.maxHp) heal(Math.round(P.maxHp * (.05 + .01 * rk))); for (const o of allies) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * .2); if (G.veh) G.veh.hp = Math.min(G.veh.maxHp, G.veh.hp + G.veh.maxHp * .04); effects.push({ type: 'healfx', x: a.x, y: a.y, r: 90, t: 0, dur: .6 }); } }
    // 방어 로봇: 적 탄환 차단
    if (a.cls === 'guard') for (const b of eprojs) { if (!b.dead && (b.x - a.x) ** 2 + (b.y - a.y) ** 2 < (40 + 6 * rk) ** 2) { b.dead = true; effects.push({ type: 'shock', x: b.x, y: b.y, r: 12, t: 0, dur: .2, col: '#80d8ff' }); } }
    // 공격
    const dm = aDmg(a);
    if (a.cls === 'flame') {
      const FRa = c.range * (1 + .06 * (rk - 1)); a.fireR = FRa; const t = nearest(a.x, a.y, FRa); a.fireOn = !!t; if (!t) continue;
      const ta = Math.atan2(t.y - a.y, t.x - a.x); a.fireAng += angDiff(ta, a.fireAng) * Math.min(1, dt * 8); a.aim = a.fireAng; a.atkT = .2; a.face = Math.cos(ta) > 0 ? 1 : -1;
      if (Q.level && Math.random() < .8) { const aa = a.fireAng + rand(-.35, .35), sp = rand(150, 240); addPart(a.x + Math.cos(a.fireAng) * 12, a.y - 6 + Math.sin(a.fireAng) * 12, Math.cos(aa) * sp, Math.sin(aa) * sp, pick(['#ff9800', '#ffeb3b', '#ff5722']), .35, rand(3, 5)); }
      a.fireTick -= dt; if (a.fireTick <= 0) { a.fireTick = .15; for (const e of query(a.x, a.y, FRa).slice()) { const ea = Math.atan2(e.y - a.y, e.x - a.x); if (Math.abs(angDiff(ea, a.fireAng)) < .45) allyHit(a, e, 7 * dm, { tick: 1, noCrit: true, burn: 12 * dm * (1 + .15 * rk) }); } if (Math.random() < .3) AU.sfx('flame', 1.3); }
      continue;
    }
    a.cd -= dt * (a.spec.perk === 'rapid' ? 1.35 : 1) * (1 + 0.06 * (rk - 1)); if (a.cd > 0) continue;
    if (c.kind === 'beast') {
      const t = a.tgt && !a.tgt.dead ? a.tgt : null; if (!t) { a.cd = .15; continue; }
      if (Math.hypot(t.x - a.x, t.y - a.y) < t.r + 16) {
        a.cd = c.cd; a.bite = .15;
        allyHit(a, t, (a.cls === 'wolf' ? 16 : 13) * dm * (1 + .1 * (rk - 1)) * (t.boss ? .6 : 1), { kb: 50, ang: Math.atan2(t.y - a.y, t.x - a.x), stun: a.cls === 'dog' ? .35 : 0, poison: a.cls === 'wolf' ? 9 * dm : 0 });
        if (Q.level) for (let k = 0; k < 4; k++) addPart(t.x, t.y, rand(-80, 80), rand(-80, 30), a.cls === 'wolf' ? '#d50000' : '#fff', .25, 2.5);
        AU.sfx('hit');
      } else a.cd = .1;
      continue;
    }
    let t;
    if (a.cls === 'sniper') { let best = null, bh = 0; for (const e of enemies) { if (e.dead) continue; const dd = (e.x - a.x) ** 2 + (e.y - a.y) ** 2; if (dd > c.range * c.range) continue; const sc = e.hp * (e.boss ? 3 : e.elite ? 2 : 1); if (sc > bh) { bh = sc; best = e; } } t = best; }
    else t = nearest(a.x, a.y, c.range);
    if (!t) { a.cd = .2; continue; }
    a.cd = c.cd; allyShoot(a, t, dm * (t.boss ? .6 : 1), rk);
  }
  // 합동 공격
  G.comboCd -= dt;
  if (G.comboCd <= 0) {
    G.comboCd = 1;
    const has = {}; for (const a of allies) if (a.down <= 0) has[a.cls] = 1;
    let on = 0; for (const e of enemies) if (!e.dead && onScreen(e, -20)) on++;
    if (on >= 4) for (const cb of COMBOS) {
      if (!has[cb.a] || !has[cb.b]) continue; const key = cb.a + cb.b;
      if ((G.acomboT[key] || 0) > G.time) continue;
      G.acomboT[key] = G.time + 28; G.comboCd = 7; doCombo(cb); break;
    }
  }
}
function doCombo(cb) {
  const dm = allyBase();
  toast(`${cb.ic} 동료 합동 공격: ${cb.n}!`, 1.4, '#ffd54f'); AU.sfx('power');
  const k = cb.a + cb.b;
  if (k === 'sniperdrone') { const ts = enemies.filter(e => !e.dead && onScreen(e, 0)).sort((a, b) => b.hp - a.hp).slice(0, 6); ts.forEach((t, i) => later(i * .1, () => { if (G.state !== 'play' || t.dead) return; effects.push({ type: 'target', x: t.x, y: t.y, r: t.r * 1.4, t: 0, dur: .35, col: '#18ffff' }); later(.35, () => { if (G.state !== 'play') return; effects.push({ type: 'rail', x1: P.x, y1: P.y - 200, x2: t.x, y2: t.y, w: 5, col: '#18ffff', t: 0, dur: .25 }); if (!t.dead) hitEnemy(t, 140 * dm, { ap: .7, silent: true }); AU.sfx('rail', 1.4); }); })); }
  else if (k === 'flameguard' || k === 'flamemecha') { const t = densest(300) || nearest(P.x, P.y, 300); if (t) { effects.push({ type: 'target', x: t.x, y: t.y, r: 110, t: 0, dur: .6, col: '#ff6d00' }); later(.6, () => { if (G.state !== 'play') return; explode(t.x, t.y, 120, 80 * dm, true, '#ff3d00', { burn: 20 * dm }); fields.push({ k: 'fire', x: t.x, y: t.y, r: 90, t: 0, dur: 4, dps: 30 * dm, tick: 0, col: '#ff6d00' }); G.shake = 8; }); } }
  else if (k === 'medicguard') { G.buff.barrier = (G.buff.barrier || 0) + 2; heal(Math.round(P.maxHp * .15)); for (const a of allies) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * .5); if (G.veh) G.veh.hp = Math.min(G.veh.maxHp, G.veh.hp + G.veh.maxHp * .1); effects.push({ type: 'healfx', x: P.x, y: P.y, r: 140, t: 0, dur: .8 }); }
  else if (k === 'rocketmecha' || k === 'dronerocket') { for (let i = 0; i < 8; i++) { const t = densest(Math.min(VW, VH) * .55) || nearest(P.x, P.y, 400); if (!t) break; const x = t.x + rand(-60, 60), y = t.y + rand(-60, 60); later(i * .12, () => effects.push({ type: 'target', x, y, r: 45, t: 0, dur: .55, col: '#ff7043' })); later(i * .12 + .55, () => { if (G.state === 'play') explode(x, y, 60, 50 * dm, true, '#ff7043'); }); } }
  else if (k === 'dogwolf') { for (const a of allies) if (a.c.kind === 'beast' && a.down <= 0) { effects.push({ type: 'shock', x: a.x, y: a.y, r: 90, t: 0, dur: .4, col: '#d50000' }); for (const e of query(a.x, a.y, 90).slice()) hitEnemy(e, 35 * dm, { stun: 1.2, poison: 12 * dm, silent: true }); } }
  else if (k === 'riflesniper') { for (const e of enemies) if (!e.dead && onScreen(e, -10) && !e.boss) { e.slowT = 3; e.slowF = Math.min(e.slowF, .45); e.markT = 4; } for (let i = 0; i < 18; i++) later(i * .05, () => { const t = nearest(P.x + rand(-150, 150), P.y + rand(-150, 150), 300); if (t && G.state === 'play') { mkProj({ kind: 'tracer', x: P.x, y: P.y - 6, vx: (t.x - P.x) * 3, vy: (t.y - P.y) * 3, ang: Math.atan2(t.y - P.y, t.x - P.x), r: 4, dmg: 14 * dm, pierce: 2, life: .4, col: '#ffe082', size: 1, kb: 20 }); AU.sfx('rifle', 1.3); } }); }
  else if (k === 'medicrifle') { heal(Math.round(P.maxHp * .12)); for (const a of allies) { a.hp = a.maxHp; if (a.down > 0) a.down = .01; } effects.push({ type: 'healfx', x: P.x, y: P.y, r: 120, t: 0, dur: .7 }); }
}
function updateRescues(dt) {
  for (const r of rescues) {
    if (r.done) continue;
    const d = Math.hypot(P.x - r.x, P.y - r.y), inside = d < r.r;
    if (inside) {
      r.prog += dt; r.active = true;
      if (!r.warned) { r.warned = true; toast(`🔓 구조 시작! ${Math.ceil(r.need)}초 동안 범위 안에서 버티세요<br><span style="font-size:14px">적이 몰려옵니다!</span>`, 1.8, '#69f0ae'); AU.sfx('alarm'); }
      r.spawnT -= dt;
      if (r.spawnT <= 0) { r.spawnT = 2.2; const k = 3 + Math.floor(G.stage / 8); for (let i = 0; i < k && aliveCount() < maxEnemies(); i++) { const [x, y] = edgePos(); spawnEnemy(wpick(G.st.mobs), x, y); } }
      if (r.prog >= r.need) {
        r.done = true; G.rescued++; qAdd('rescue');
        AU.sfx('quest'); effects.push({ type: 'pillar', x: r.x, y: r.y, t: 0, dur: 1.4, col: '#69f0ae' });
        for (let i = 0; i < 20; i++) addPart(r.x, r.y, rand(-160, 160), rand(-160, 40), pick(['#69f0ae', '#b9f6ca', '#fff']), .7, 3.5, 200);
        const a = addAlly(r.spec, r.x, r.y);
        if (a) toast(`🤝 동료 합류: ${r.spec.name}<br><span style="font-size:14px">${ACL[r.spec.cls].d} · 특기: ${APERK[r.spec.perk].n}</span>`, 2.2, '#69f0ae');
      }
    } else { r.active = false; if (r.prog > 0) r.prog = Math.max(0, r.prog - dt * 0.45); }
  }
}

/* ------------------------- 랜덤 전장 이벤트 (사전 경고 포함) ------------------------- */
const DIR8 = ['동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽', '북쪽', '북동쪽'];
function extEvent() {
  const opts = [['radio', G.radio || allies.length >= ALLY_MAX ? 0 : 2.2], ['vehicle', G.vdropDone && !G.veh && !vehs.some(v => !v.dead) ? 0.6 : 0], ['supply2', 1.4], ['lasergrid', G.theme === 'neon' || G.theme === 'plasma' ? 1.4 : 0.3], ['storm', G.theme === 'dust' || G.st.wx === 'dust' ? 1.6 : 0.8], ['artillery', G.theme === 'war' ? 2.4 : 1.1], ['ambush', 1.4], ['eliteRaid', 1]];
  const ev = wpick(opts.filter(o => o[1] > 0));
  if (ev === 'radio') {
    const a = rand(0, TAU), d = rand(520, 700), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    const dir = DIR8[((Math.round(a / (TAU / 8)) % 8) + 8) % 8];
    G.radio = { x, y, phase: 'go', t: 0, timeout: 60, prog: 0, need: (save.settings.fast ? 8 : 16), spawnT: 0, spec: ALLY_ST[G.stage][2], r: 110 };
    toast(`📻 긴급 구조 요청!<br><span style="font-size:15px">${dir} 지역에 아군이 고립되었습니다</span>`, 3, '#69f0ae'); AU.sfx('alarm');
  } else if (ev === 'vehicle') {
    const pool = VEH_ST[Math.min(40, G.stage + 5)], def = pool[Math.floor(Math.random() * 3)];
    vehicleDrop(def, true);
  } else if (ev === 'storm') { G.stormWarn = 2.5; toast('🌪️ 경고: 모래폭풍 접근!<br><span style="font-size:14px">곧 시야가 좁아집니다</span>', 2.4, '#ffcc80'); AU.sfx('alarm'); }
  else if (ev === 'supply2' || ev === 'lasergrid') extEvent2(ev);
  else if (ev === 'artillery') { G.artWarn = 2.2; toast('🚀 경고: 적의 미사일 포격!<br><span style="font-size:14px">빨간 원을 피하세요</span>', 2.2, '#ff5252'); AU.sfx('alarm'); }
  else if (ev === 'ambush') {
    toast('⚠ 적의 대규모 기습 임박!<br><span style="font-size:14px">양쪽에서 몰려옵니다</span>', 2, '#ff7043'); AU.sfx('alarm');
    later(2, () => { if (G.state !== 'play' || G.bossState !== 0) return; const base = rand(0, TAU), n = Math.min(65, (12 + G.stage * 1.5) * MOB_X) * DF().cnt * densF(), rad = Math.max(VW, VH) * .55; for (let s = 0; s < 2; s++) for (let i = 0; i < n / 2; i++) { const aa = base + s * Math.PI + rand(-.5, .5); spawnEnemy(wpick(G.st.mobs), P.x + Math.cos(aa) * rad * rand(1, 1.2), P.y + Math.sin(aa) * rad * rand(1, 1.2)); } });
  } else if (ev === 'eliteRaid') { toast('⚠ 정예 몬스터 습격!', 1.4, '#ff9800'); later(1.5, () => { if (G.state === 'play' && G.bossState === 0) { spawnElite(); if (G.stage > 10) later(2, () => { if (G.state === 'play' && G.bossState === 0) spawnElite(); }); } }); }
}
function updateExtEvents(dt) {
  // 폭풍(시야 제한)
  if (G.stormWarn > 0) { G.stormWarn -= dt; if (G.stormWarn <= 0) G.stormT = 14; }
  if (G.stormT > 0) G.stormT -= dt;
  // 적 포격
  if (G.artWarn > 0) { G.artWarn -= dt; if (G.artWarn <= 0) G.artT = 8; }
  if (G.artT > 0) {
    G.artT -= dt; G.artTick -= dt;
    if (G.artTick <= 0) { G.artTick = .75; const x = P.x + rand(-120, 120) + P.lastMx * 60, y = P.y + rand(-120, 120) + P.lastMy * 60; hazards.push({ src: 'env', kind: 'circle', x, y, r: 55, t: 0, delay: 1.4, dmg: (10 + G.stage * 0.8) }); later(1.15, () => { if (G.state === 'play') effects.push({ type: 'skybeam', x, y, r: 7, t: 0, dur: .25, col: '#ff8a80' }); }); }
  }
  // 구조 요청 이벤트
  const R = G.radio;
  if (R) {
    R.t += dt; const d = Math.hypot(P.x - R.x, P.y - R.y);
    if (R.phase === 'go') { if (d < R.r) { R.phase = 'hold'; toast('🛡️ 고립된 아군 발견! 방어하세요!', 1.8, '#69f0ae'); AU.sfx('alarm'); } else if (R.t > R.timeout) { G.radio = null; toast('📻 구조 요청 신호가 끊겼습니다', 1.4, '#b0bec5'); } }
    else if (R.phase === 'hold') {
      if (d < R.r) R.prog += dt;
      R.spawnT -= dt;
      if (R.spawnT <= 0) { R.spawnT = 1.6; const k = 4 + Math.floor(G.stage / 6); for (let i = 0; i < k && aliveCount() < maxEnemies(); i++) { const aa = rand(0, TAU), rr = rand(260, 340); spawnEnemy(wpick(G.st.mobs), R.x + Math.cos(aa) * rr, R.y + Math.sin(aa) * rr); } }
      if (R.prog >= R.need) {
        G.radio = null; G.rescued++; qAdd('rescue'); AU.sfx('quest');
        effects.push({ type: 'pillar', x: R.x, y: R.y, t: 0, dur: 1.6, col: '#ffd54f' });
        const g = goldX((60 + 20 * G.stage) * P.greed); G.gold += g;
        const a = addAlly(R.spec, R.x, R.y);
        if (a) toast(`⭐ 특별 동료 합류: ${R.spec.name}<br><span style="font-size:14px">${ACL[R.spec.cls].d} · +${g}G</span>`, 2.4, '#ffd54f');
      }
    }
  }
}

/* ------------------------- 체력 물약 리젠 ------------------------- */
function potCount() { let n = 0; for (const p of pickups) if (!p.dead && p.kind === 'hpot') n++; return n; }
function freeSpot(minD, maxD) {
  for (let t = 0; t < 12; t++) {
    const a = rand(0, TAU), d = rand(minD, maxD), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (query(x, y, 26).length === 0 && !gens.some(g => Math.hypot(g.x - x, g.y - y) < 50)) return [x, y];
  }
  const a = rand(0, TAU); return [P.x + Math.cos(a) * minD, P.y + Math.sin(a) * minD];
}
function spawnHpot(near) {
  if (potCount() >= 3) return false;
  const [x, y] = near ? freeSpot(90, 160) : freeSpot(170, 360);
  dropPickup('hpot', x, y, 0, null, true); G.lastHpot = G.t;
  effects.push({ type: 'pillar', x, y, t: 0, dur: 1.2, col: '#ff5252' }); return true;
}
function updatePotions(dt) {
  if (G.bossState === 3 || G.clearing) return;
  const low = P.hp / P.maxHp < 0.4;
  G.hpotT -= dt * (low ? 1.8 : 1);
  if (G.hpotT <= 0) { G.hpotT = DF().potT * rand(.85, 1.15); spawnHpot(false); }
  // 최고 난이도에서도 회복 수단이 끊기지 않도록 보장
  if (P.hp / P.maxHp < 0.3 && G.t - G.lastHpot > 25 && potCount() === 0 && G.potions === 0) { if (spawnHpot(true)) toast('🧪 긴급 회복 물약 보급!', 1.2, '#ff8a80'); }
  // 차량 긴급 수리 키트 (낮은 확률, 수리 횟수 제한)
  G.rkitT -= dt;
  if (G.rkitT <= 0) { G.rkitT = 45; if (G.veh && G.veh.hp < G.veh.maxHp * .7 && G.veh.repairs < 2 && Math.random() < .35) { const [x, y] = freeSpot(120, 220); dropPickup('rkit', x, y, 0, null, true); toast('🔧 수리 키트 발견!', 1, '#80deea'); } }
}

/* ------------------------- 적 강화 (난이도 / 동료 수) ------------------------- */
function allySpawnMul() { const n = activeAllies(); return 1 + Math.max(0, n - 1) * 0.1 + (G.veh ? 0.45 : 0); }
function extDirector(dt) {
  G.extEvT -= dt;
  if (G.extEvT <= 0 && G.bossState === 0 && !G.clearing) { G.extEvT = rand(48, 66); extEvent(); }
  if (G.bossState !== 0 || G.clearing) return;
  const n = activeAllies();
  // 동료 3명 이상 → 정예 출현 소폭 증가 / 난이도별 정예 빈도
  G.allyEliteT -= dt * (DF().elite + (n >= 3 ? 0.35 : 0) + (G.adapt || 0) * 2) * 0.5;
  if (G.allyEliteT <= 0) { G.allyEliteT = 55; if (DF().elite > 1 || n >= 3) spawnElite(); }
  // 동료 4명 이상 → 적의 협동 포위 공격
  if (n >= 4 || DF().pat >= 2) {
    G.surroundT -= dt;
    if (G.surroundT <= 0) {
      G.surroundT = n >= 4 && DF().pat >= 2 ? 26 : 34;
      toast('⚠ 적이 포위해 옵니다!', 1.3, '#ff7043');
      const pool = G.st.mobs.filter(m => !ET[m[0]].ai || ['zig', 'chase', 'dash'].includes(ET[m[0]].ai)), type = (pool.length ? pick(pool) : G.st.mobs[0])[0];
      const cnt = Math.round(Math.min(52, (10 + G.stage) * MOB_X) * DF().cnt * densF()), rad = Math.max(VW, VH) * .5;
      later(1.2, () => { if (G.state !== 'play' || G.bossState !== 0) return; for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU; const e = spawnEnemy(type, P.x + Math.cos(a) * rad, P.y + Math.sin(a) * rad); e.spd *= 1.15; } });
    }
  }
  // 적 지휘관 (특별 임무)
  const cq = G.quests.find(q => q.k === 'commander' && !q.done);
  if (cq && !G.cmdSpawned && G.t > G.st.D * 0.22) {
    G.cmdSpawned = true; const [x, y] = edgePos(); const e = spawnEnemy(G.st.sig, x, y, { elite: true }); e.cmd = true; e.hp *= 1.8; e.maxHp *= 1.8; e.r *= 1.15; e.skill = 'summon';
    toast('🎖️ 적 지휘관 출현!<br><span style="font-size:15px">처치하면 특별 보상</span>', 2, '#ffd54f'); AU.sfx('alarm');
  }
}
// 어려움·지옥: 체력만 높이는 것이 아니라 새로운 공격 패턴 추가
function diffAI(e, dt, pdist) {
  const pat = Math.min(3, DF().pat + ((G.adapt || 0) > 0.12 ? 1 : 0)); if (!pat || e.stunT > 0 || e.forceDash) return;
  if (e.dT === undefined) e.dT = rand(3, 7);
  e.dT -= dt; if (e.dT > 0 || !onScreen(e, -10)) return;
  e.dT = pat >= 2 ? rand(3, 5) : rand(5, 8);
  const a = Math.atan2(P.y - e.y, P.x - e.x);
  if (e.d.ai === 'ranged') { const n = pat >= 2 ? 3 : 2; for (let i = 0; i < n; i++) eShot(e.x, e.y, a + (i - (n - 1) / 2) * 0.28, 165, e.dmg * 0.45, e.d.shot || 'orb'); }
  else if (pat >= 2 && pdist < 190 && pdist > 50 && G.lungeN < 5 && Math.random() < 0.45) {
    G.lungeN++; hazards.push({ kind: 'line', x: e.x, y: e.y, ang: a, len: 160, w: e.r * 1.4, t: 0, delay: 0.6, dmg: 0, thin: 1 });
    e.st = 1; e.aiT = 0.6; e.dang = a; e.forceDash = 1; later(1.2, () => { G.lungeN = Math.max(0, G.lungeN - 1); });
  } else if (pat >= 2 && e.elite && Math.random() < .5) { for (let i = 0; i < 8; i++) eShot(e.x, e.y, i / 8 * TAU + rand(0, .4), 140, e.dmg * .35, 'orb'); }
}
function allyTarget(e) {
  if (!allies.length || (e.id % 4 !== 0 && !G.hasGuard)) return null;
  let best = null, bd = 1e9;
  for (const a of allies) {
    if (a.down > 0 || a.seated || a.c.fly) continue;
    const d = (a.x - e.x) ** 2 + (a.y - e.y) ** 2;
    const taunt = a.cls === 'guard' && d < 150 * 150;
    if (!taunt && e.id % 4 !== 0) continue;
    if (d < bd && d < 280 * 280) { bd = d; best = a; }
  }
  if (best && bd > (P.x - e.x) ** 2 + (P.y - e.y) ** 2 && !(best.cls === 'guard' && bd < 150 * 150)) return null;
  return best;
}

/* ------------------------- 보스 강화 ------------------------- */
const BOSS_XPAT = ['missile', 'barrage', 'sweep'];
for (const id in BOSSES) {
  const b = BOSSES[id]; if (b.mini) continue;
  const n = b.stage || 1, add = [BOSS_XPAT[n % 3]]; if (n >= 15 || b.special) add.push(BOSS_XPAT[(n + 1) % 3]);
  b.pats = b.pats.concat(add.filter(p => !b.pats.includes(p))); b.xpats = add;
}
function bossHpMul(mini) {
  const n = activeAllies();
  return (mini ? 1.1 : 1.2) * DF().boss * (1 + 0.06 * n) * (G.veh ? 1.08 : 1);
}
// 너무 빨리 죽지 않도록 초당 받는 피해에 완만한 상한, 너무 오래 버티면 약점 노출
function bossGovern(e, dmg) {
  if (e.mini || save.settings.fast) return dmg;
  const now = G.time; if (e.budT === undefined) { e.budT = now; e.bud = e.maxHp * 0.05; e.spT = now; }
  const rate = e.maxHp * 0.045, cap = e.maxHp * (e.exposeT > 0 ? 0.14 : 0.07);
  e.bud = Math.min(cap, e.bud + rate * (now - e.budT)); e.budT = now;
  if (dmg > e.bud) { const over = dmg - e.bud; dmg = e.bud + over * 0.3; e.bud = 0; } else e.bud -= dmg;
  const ft = now - e.spT;
  if (ft > 75) { if (!e.weakMsg) { e.weakMsg = 1; toast('💢 보스 약점 노출! 받는 피해 증가', 1.6, '#ffd54f'); } dmg *= 1 + Math.min(2.2, (ft - 75) / 50); }
  return dmg;
}
function bossExtStart(e, pat) {
  const lv = DF().pat;
  if (typeof bossArchStart === 'function') bossArchStart(e, pat);
  if (pat === 'missile') { e.msN = (e.p2 ? 6 : 4) + lv; toast('🚀 보스 미사일 발사 준비!', .9, '#ff8a80'); }
  if (pat === 'barrage') { const n = (e.p2 ? 9 : 6) + lv * 2; for (let i = 0; i < n; i++) { const x = P.x + rand(-170, 170) + (i === 0 ? 0 : 0), y = P.y + rand(-170, 170); hazards.push({ src: 'boss', kind: 'circle', x: i === 0 ? P.x : x, y: i === 0 ? P.y : y, r: 52, t: 0, delay: 1.2 + i * 0.12, dmg: e.dmg * 0.9 }); } AU.sfx('alarm'); }
  if (pat === 'sweep') { e.swA = Math.atan2(P.y - e.y, P.x - e.x) - 1.2; e.swDir = Math.random() < .5 ? 1 : -1; if (e.swDir < 0) e.swA += 2.4; hazards.push({ src: 'boss', kind: 'line', x: e.x, y: e.y, ang: e.swA, len: 520, w: 22, t: 0, delay: 1.0, dmg: 0 }); AU.sfx('elaser'); }
}
function bossExtUpdate(e, dt) {
  if (typeof bossArchUpdate === 'function' && bossArchUpdate(e, dt)) return true;
  switch (e.ps) {
    case 'missile':
      if (e.step < e.msN && e.sub >= 0.6 + e.step * 0.18) { const a = Math.atan2(P.y - e.y, P.x - e.x) + (e.step % 2 ? 1 : -1) * (0.6 + Math.random() * .6); eShot(e.x, e.y, a, 150, e.dmg * 0.5, 'fire'); const b = eprojs[eprojs.length - 1]; b.hom = 1; b.life = 4.5; AU.sfx('missile', 1.3); e.step++; }
      if (e.sub >= 0.8 + e.msN * 0.18) endPattern(e); return true;
    case 'barrage': if (e.sub >= 2.2) endPattern(e); return true;
    case 'sweep':
      if (e.sub >= 1.0 && e.sub < 2.6) {
        e.swA += e.swDir * dt * 1.5; const x2 = e.x + Math.cos(e.swA) * 520, y2 = e.y + Math.sin(e.swA) * 520;
        if (effects.length < 180) effects.push({ type: 'rail', x1: e.x, y1: e.y, x2, y2, w: 18, col: '#ff1744', t: 0, dur: 0.06 });
        if (segDist2(P.x, P.y, e.x, e.y, x2, y2) < (11 + P.r * .5) ** 2) damagePlayer(e.dmg * 0.8, 'beam');
      }
      if (e.sub >= 2.8) endPattern(e); return true;
  }
  return false;
}

/* ------------------------- 특별 임무 보상 / 물품 ------------------------- */
function spReward(q) {
  G.spDone++;
  const g = goldX((40 + 20 * G.stage) * diffRewardMul()); G.gold += g;
  for (let i = 0; i < 10; i++) dropGem(P.x + rand(-40, 40), P.y + rand(-40, 40), 4 + G.stage);
  const r = pick(['pot', 'wlv', 'power']); let t = '';
  if (r === 'pot') { G.potions++; updatePotBadge(); t = '🧪 물약 +1'; }
  else if (r === 'wlv') { const own = G.weapons.filter(w => w.lv < WMAX); if (own.length) { const w = pick(own); w.lv++; t = `⬆ ${WMAP[w.id].nm} Lv${w.lv}`; } else { G.powerT = 20; t = '⚡ 공격력 강화 20초'; } }
  else { G.powerT = 20; t = '⚡ 공격력 강화 20초'; }
  toast(`🏅 특별 임무 완료: ${SPM_LABEL[q.k]}<br><span style="font-size:15px">+${g}G · ${t}</span>`, 2.2, '#ffd54f');
}
function extCollect(p) {
  switch (p.kind) {
    case 'hpot':
      if (P.hp < P.maxHp - 1) heal(Math.round(P.maxHp * .3));
      else if (G.potions < 6) { G.potions++; updatePotBadge(); AU.sfx('item'); texts.push({ x: P.x, y: P.y - 26, t: 0, v: '🧪+1', col: '#ff8a80', pl: 1 }); }
      else { const g = goldX(5 * G.stage * P.greed); G.gold += g; AU.sfx('coin'); }
      return true;
    case 'rkit':
      if (G.veh && G.veh.repairs < 2) repairVeh(G.veh);
      else if (G.veh) { const g = goldX(15 * G.stage * P.greed); G.gold += g; toast(`이 차량은 더 수리할 수 없습니다 (+${g}G)`, 1.2, '#b0bec5'); }
      else { G.rkit = 1; AU.sfx('item'); toast('🔧 수리 키트 보관 (탑승 장비가 손상되면 자동 사용)', 1.6, '#80deea'); }
      return true;
    case 'wsup': collectSup(); return true;
    case 'scrate': { const g = goldX(12 * G.stage * P.greed); G.gold += g; qAdd('scrate'); AU.sfx('chest'); heal(Math.round(P.maxHp * .1)); texts.push({ x: P.x, y: P.y - 26, t: 0, v: '📦 보급품 확보', col: '#90caf9', pl: 1, big: 1 }); return true; }
  }
  return false;
}

/* ------------------------- 확장 메인 업데이트 ------------------------- */
function extUpdate(dt) {
  G.diffAcc[diffIdx()] += dt;
  // 주인공 화력 추적 (빠르게 오르고 천천히 내려감)
  G.pdT = (G.pdT || 0) + dt;
  if (G.pdT >= 1) { const cur = (G.pAcc || 0) * 1.15 / G.pdT; G.pAcc = 0; G.pdT = 0; if (!G.veh) G.pdps = cur > G.pdps ? lerp(G.pdps, cur, 0.15) : lerp(G.pdps, cur, 0.02); }
  if (G.veh) updateVehicle(dt);
  updateAllies(dt); updateRescues(dt); updateExtEvents(dt); updatePotions(dt);
  for (const v of vehs) { if (v.dead || v === G.veh) continue; if (!v.seen && Math.hypot(v.x - P.x, v.y - P.y) < 300) { v.seen = true; toast(`🚘 탑승 장비 발견: ${v.def.name}`, 1.4, '#80deea'); } }
  // 지정 구역 사수
  const H = G.hold;
  if (H && !H.q.done) {
    if (Math.hypot(P.x - H.x, P.y - H.y) < H.r) { H.q.cur += dt; H.spawnT = (H.spawnT || 0) - dt; if (H.spawnT <= 0) { H.spawnT = 2; for (let i = 0; i < 3 + Math.floor(G.stage / 8) && aliveCount() < maxEnemies(); i++) { const [x, y] = edgePos(); spawnEnemy(wpick(G.st.mobs), x, y); } } if (H.q.cur >= H.q.sec) completeQuest(H.q); }
  }
  // 탑승 버튼 표시
  autoBoard();
  const nv = nearVeh(); if (nv !== G.rideNear) { G.rideNear = nv; setRideBtn(); }
  if (G.veh) setSkillCd();
  updateSquadHud();
}
function extArrows(list) {
  if (G.radio) list.unshift([G.radio.x, G.radio.y, '#ffd54f', true]);
  if (G.hold && !G.hold.q.done) list.push([G.hold.x, G.hold.y, '#ffab40']);
}

/* ------------------------- 화면 버튼 (탑승 / 특수능력 / 분대 표시) ------------------------- */
function setRideBtn() {
  const b = $('bRide'); if (!b) return;
  if (G.veh) { b.style.display = 'flex'; b.classList.add('exit'); b.innerHTML = '<span class="ic">⏏</span><span class="lb">하차</span>'; }
  else b.style.display = 'none';
}
let skLast = '';
function setSkillBtn() {
  const b = $('bSk1'); if (!b) return; const ic = b.querySelector('.ic'), lb = b.querySelector('.lb');
  if (G.veh) { const s = VSP[G.veh.def.sp]; ic.textContent = s.ic; lb.textContent = s.s; b.classList.add('vsp'); }
  else { ic.textContent = '🌀'; lb.textContent = '회오리'; b.classList.remove('vsp'); }
  skLast = '';
}
function setSkillCd() { const v = G.veh; if (!v) return; setCd('sk1', Math.max(0, v.skCd) / VSP[v.def.sp].cd); }
let squadKey = '';
function updateSquadHud() {
  G.sqT = (G.sqT || 0) - 1; if (G.sqT > 0) return; G.sqT = 10;
  const el = $('squad'); if (!el) return;
  const k = allies.map(a => a.cls + (a.down > 0 ? 'd' : '') + (a.seated ? 's' : '')).join(',');
  if (k === squadKey) return; squadKey = k;
  el.innerHTML = allies.map(a => `<span class="ally${a.down > 0 ? ' down' : ''}${a.seated ? ' seat' : ''}${a.spec.special ? ' sp' : ''}" title="${a.spec.name}">${ACL[a.cls].ic}</span>`).join('');
}
