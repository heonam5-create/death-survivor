/* =====================================================================
   게임 데이터
   ===================================================================== */
// 무기 등급: t1 일반 / t2 고급 / t3 전설 / t4 신화
const TIER_NAME = ['', '일반', '고급', '전설', '신화'];
const TIER_COL = ['', '#b0bec5', '#64b5f6', '#ffa726', '#ff1744'];
const CLASS_NAME = { rifle: '소총·기관총', blast: '대포·폭발', energy: '레이저·에너지', special: '특수 화기', future: '미래형' };
const ROLE_NAME = { flak: '파편 폭발형', barrage: '포격 요청형', nova: '충격파형', boomer: '부메랑형', wave: '파동 관통형', saw: '회전 근접형', harpoon: '견인형', gun: '연사형', laser: '관통 연사형', rocket: '폭발형', lob: '곡사 폭발형', cannon: '관통 포격형', rail: '직선 관통형', beam: '지속 광선형', spin: '회전 광선형', plasma: '관통 폭발형', chain: '연쇄형', cone: '근거리 지속형', tazer: '근거리 연쇄형', drone: '소환형', turret: '설치형', mine: '설치 폭발형', orbital: '광역 폭격형', ion: '지속 광역형', hole: '흡인형', split: '분열형' };
/* 무기 50종
   m: 발사 방식 / dmg: 1발 피해 / cd: 재사용(초) / range: 사거리 / s: [효과음, 음높이]
   공격 방식이 실제로 다른 19가지 엔진(m)에 무기별 수치·탄 모양·색·소리를 다르게 설정 */
const WEAPONS = [
  // ---------- 소총·기관총 10 ----------
  { id: 'rifle', nm: '기본 돌격소총', ic: '🔫', c: 'rifle', t: 1, m: 'gun', dmg: 7, cd: .3, spd: 720, range: 330, spread: .04, pk: 'tracer', col: '#ffd54f', s: ['rifle', 1], d: '균형 잡힌 자동 사격. 무난하게 강하다.' },
  { id: 'smg', nm: '기관단총', ic: '🔫', c: 'rifle', t: 1, m: 'gun', dmg: 5, cd: .14, spd: 640, range: 220, spread: .16, pk: 'bullet', col: '#ffe082', s: ['smg', 1.15], d: '짧은 사거리 대신 매우 빠른 연사.' },
  { id: 'hmg', nm: '중기관총', ic: '🪖', c: 'rifle', t: 2, m: 'gun', dmg: 9, cd: .22, spd: 760, range: 360, spread: .07, ap: .35, pk: 'slug', size: 1.4, col: '#ffb300', s: ['hmg', .85], d: '묵직한 탄환. 장갑 몬스터에게 강하다.' },
  { id: 'minigun', nm: '미니건', ic: '🌪️', c: 'rifle', t: 2, m: 'gun', dmg: 3, cd: .055, spd: 700, range: 260, spread: .16, spin: 1, pk: 'bullet', size: .8, col: '#fff59d', s: ['mini', 1.1], d: '예열할수록 빨라지는 초고속 탄막.' },
  { id: 'lmg', nm: '경기관총', ic: '🔫', c: 'rifle', t: 1, m: 'gun', dmg: 5, cd: .18, spd: 680, range: 300, spread: .12, pierce: 2, pk: 'tracer', col: '#ffcc80', s: ['rifle', .9], d: '끊김 없는 지속 사격, 탄이 2마리 관통.' },
  { id: 'tactical', nm: '전술 소총', ic: '🎯', c: 'rifle', t: 1, m: 'gun', dmg: 7, cd: .75, burst: 3, gap: .07, spd: 950, range: 420, spread: 0, pk: 'tracer', col: '#80deea', s: ['rifle', 1.3], d: '정확한 3점사. 사거리가 길다.' },
  { id: 'twinmg', nm: '이중 기관총', ic: '↔️', c: 'rifle', t: 2, m: 'gun', dmg: 6, cd: .2, spd: 700, range: 300, spread: .08, twin: 1, pk: 'bullet', col: '#ffab40', s: ['smg', .9], d: '앞뒤 양방향으로 동시에 발사. 포위될 때 강하다.' },
  { id: 'prifle', nm: '관통 소총', ic: '📍', c: 'rifle', t: 2, m: 'gun', dmg: 16, cd: .6, spd: 1200, range: 480, spread: 0, pierce: 5, ap: .5, pk: 'slug', size: 1.2, col: '#b2ebf2', s: ['rifle', .7], d: '일직선의 적 5마리를 꿰뚫는다.' },
  { id: 'exrifle', nm: '폭발탄 소총', ic: '💥', c: 'rifle', t: 2, m: 'gun', dmg: 7, cd: .38, spd: 700, range: 320, spread: .05, boom: 30, pk: 'slug', col: '#ff7043', s: ['rifle', .8], d: '명중하면 작은 폭발.' },
  { id: 'gatling', nm: '전설의 개틀링건', ic: '🌀', c: 'rifle', t: 3, m: 'gun', dmg: 4, cd: .05, spd: 820, range: 300, spread: .32, spin: 1, pierce: 2, n: 2, pk: 'tracer', size: 1.1, col: '#ffd740', s: ['mini', .8], d: '6열 총열이 쏟아내는 광역 탄막.' },
  // ---------- 대포·폭발 10 ----------
  { id: 'gl', nm: '소형 유탄발사기', ic: '🧨', c: 'blast', t: 1, m: 'lob', dmg: 18, cd: 1.15, range: 300, flight: .55, boom: 46, pk: 'grenade', col: '#8bc34a', s: ['gl', 1], d: '포물선으로 날아가 터지는 유탄.' },
  { id: 'rocket', nm: '로켓 발사기', ic: '🚀', c: 'blast', t: 1, m: 'rocket', dmg: 28, cd: 1.4, spd: 360, range: 380, boom: 52, pk: 'rocket', col: '#ff5722', s: ['rocket', 1], d: '명중 시 큰 폭발을 일으키는 로켓.' },
  { id: 'mlrs', nm: '다연장 로켓포', ic: '🎆', c: 'blast', t: 2, m: 'rocket', dmg: 11, cd: 2.0, n: 4, salvo: .09, spd: 330, range: 400, boom: 34, homing: 2, pk: 'missile', col: '#ff8a65', s: ['missile', 1], d: '소형 로켓 4발을 연속 발사.' },
  { id: 'cannon', nm: '중형 캐논', ic: '🔵', c: 'blast', t: 2, m: 'cannon', dmg: 42, cd: 1.8, spd: 420, range: 400, pierce: 3, size: 11, boom: 42, ap: .6, kb: 260, col: '#455a64', s: ['cannon', 1], d: '거대한 포탄이 적을 꿰뚫고 마지막에 폭발.' },
  { id: 'mortar', nm: '박격포', ic: '🎇', c: 'blast', t: 1, m: 'lob', dmg: 26, cd: 2.1, range: 480, flight: 1.0, boom: 60, pk: 'shell', far: 1, col: '#795548', s: ['mortar', 1], d: '멀리 있는 적 무리에 포탄을 떨어뜨린다.' },
  { id: 'agl', nm: '자동 유탄 기관총', ic: '🔶', c: 'blast', t: 2, m: 'lob', dmg: 11, cd: .45, range: 300, flight: .42, boom: 32, pk: 'grenade', size: .8, col: '#cddc39', s: ['gl', 1.3], d: '작은 유탄을 빠르게 연사.' },
  { id: 'cluster', nm: '집속탄 발사기', ic: '🌟', c: 'blast', t: 2, m: 'lob', dmg: 20, cd: 2.2, range: 340, flight: .7, boom: 40, cluster: 6, pk: 'shell', col: '#ffca28', s: ['mortar', 1.2], d: '터지면서 자탄 6개가 사방에 흩어진다.' },
  { id: 'flamecannon', nm: '화염 대포', ic: '☄️', c: 'blast', t: 2, m: 'lob', dmg: 22, cd: 2.0, range: 340, flight: .6, boom: 46, field: { k: 'fire', r: 52, dur: 3, dps: 10 }, burn: 5, pk: 'fireshell', col: '#ff3d00', s: ['cannon', 1.3], d: '착탄 지점을 3초간 불바다로 만든다.' },
  { id: 'railcannon', nm: '전자기 레일 캐논', ic: '⚡', c: 'blast', t: 3, m: 'rail', dmg: 60, cd: 1.9, range: 620, w: 12, charge: .25, ap: 1, col: '#40c4ff', s: ['rail', 1], d: '화면 끝까지 꿰뚫는 초고속 탄.' },
  { id: 'gravcannon', nm: '전설의 초중력 대포', ic: '🪐', c: 'blast', t: 3, m: 'lob', dmg: 60, cd: 3.6, range: 380, flight: .8, boom: 70, grav: { r: 125, dur: 1.2, pull: 180 }, pk: 'gravball', col: '#7c4dff', s: ['hole', 1.5], d: '중력장으로 적을 끌어모은 뒤 폭발.' },
  // ---------- 레이저·에너지 10 ----------
  { id: 'laser', nm: '기본 레이저건', ic: '🔴', c: 'energy', t: 1, m: 'laser', dmg: 8, cd: .36, spd: 1100, range: 360, pierce: 2, len: 22, col: '#ff1744', s: ['laser', 1], d: '빠른 레이저탄, 2마리 관통.' },
  { id: 'lrifle', nm: '연속 레이저 소총', ic: '📏', c: 'energy', t: 2, m: 'beam', dps: 40, cd: 1.8, dur: 1.4, len: 280, w: 8, col: '#ff4081', s: ['beam', 1], d: '적을 따라가며 지져버리는 지속 레이저.' },
  { id: 'plaser', nm: '관통 레이저', ic: '➖', c: 'energy', t: 2, m: 'rail', dmg: 24, cd: 1.05, range: 520, w: 6, charge: 0, col: '#18ffff', s: ['laser', .6], d: '순식간에 일직선의 모든 적을 관통.' },
  { id: 'slaser', nm: '확산 레이저', ic: '🔆', c: 'energy', t: 1, m: 'laser', dmg: 7, cd: .8, n: 5, fan: .22, spd: 900, range: 260, pierce: 1, len: 16, col: '#ffea00', s: ['laser', 1.4], d: '부채꼴로 퍼지는 레이저 5발.' },
  { id: 'spinlaser', nm: '회전 레이저 포탑', ic: '🎡', c: 'energy', t: 2, m: 'spin', dps: 28, n: 2, len: 140, rot: 2.2, w: 7, col: '#ea80fc', s: ['beam', 1.5], d: '주변을 계속 도는 레이저 2줄.' },
  { id: 'prifle2', nm: '플라즈마 소총', ic: '🟢', c: 'energy', t: 1, m: 'plasma', dmg: 17, cd: .85, spd: 280, range: 340, size: 8, boom: 34, col: '#00e676', s: ['plasma', 1], d: '느린 플라즈마 구체가 관통하며 지나간다.' },
  { id: 'pcannon', nm: '플라즈마 캐논', ic: '🟣', c: 'energy', t: 2, m: 'plasma', dmg: 28, cd: 2.3, spd: 190, range: 380, size: 17, boom: 64, col: '#d500f9', s: ['plasma', .6], d: '거대한 플라즈마 덩어리, 종착점에서 대폭발.' },
  { id: 'emp', nm: '전자기 충격총', ic: '🔷', c: 'energy', t: 1, m: 'chain', dmg: 12, cd: .9, range: 170, targets: 1, chain: 2, stun: .35, col: '#82b1ff', s: ['zap', 1.3], d: '짧은 사거리, 적을 잠깐 기절시키는 전격.' },
  { id: 'chaincannon', nm: '연쇄 번개포', ic: '🌩️', c: 'energy', t: 2, m: 'chain', dmg: 20, cd: 1.6, range: 330, targets: 2, chain: 4, col: '#b3e5fc', s: ['zap', .9], d: '번개가 적 사이를 4번 튕긴다.' },
  { id: 'doomlaser', nm: '전설의 파멸 레이저', ic: '🔥', c: 'energy', t: 3, m: 'beam', dps: 80, cd: 3.5, dur: 2.0, len: 440, w: 20, col: '#ff3d00', s: ['beam', .6], d: '굵고 긴 파멸의 광선.' },
  // ---------- 특수 화기 10 ----------
  { id: 'flamer', nm: '화염방사기', ic: '🔥', c: 'special', t: 1, m: 'cone', dps: 34, range: 100, arc: .55, burn: 6, col: '#ff6d00', s: ['flame', 1], d: '근거리 부채꼴 화염 + 화상.' },
  { id: 'freezer', nm: '냉동 방사기', ic: '❄️', c: 'special', t: 1, m: 'cone', dps: 16, range: 95, arc: .6, slow: .6, freeze: 1, col: '#80d8ff', s: ['freeze', 1], d: '피해는 낮지만 강력한 둔화와 빙결.' },
  { id: 'gas', nm: '독가스 발사기', ic: '☣️', c: 'special', t: 1, m: 'lob', dmg: 6, cd: 2.4, range: 300, flight: .6, boom: 0, field: { k: 'gas', r: 64, dur: 4, dps: 11 }, pk: 'canister', col: '#76ff03', s: ['gas', 1], d: '4초간 지속되는 독구름.' },
  { id: 'acid', nm: '산성탄 발사기', ic: '🧪', c: 'special', t: 2, m: 'gun', dmg: 7, cd: .85, spd: 420, range: 300, spread: .05, splash: 30, field: { k: 'acid', r: 34, dur: 3, dps: 8 }, shred: 1, pk: 'acid', size: 1.6, col: '#c6ff00', s: ['acid', 1], d: '산성 웅덩이를 남기고 적의 장갑을 녹인다.' },
  { id: 'tazer', nm: '전기 충격총', ic: '⚡', c: 'special', t: 1, m: 'tazer', dmg: 7, cd: .38, range: 115, targets: 3, col: '#ffff00', s: ['zap', 1.6], d: '주변 적 3마리에게 자동으로 전기 충격.' },
  { id: 'homing', nm: '자동 추적 미사일', ic: '🎯', c: 'special', t: 2, m: 'rocket', dmg: 14, cd: 1.3, n: 2, salvo: .12, spd: 300, range: 450, boom: 30, homing: 6, pk: 'missile', col: '#ff80ab', s: ['missile', 1.2], d: '적을 끝까지 쫓아가는 미사일.' },
  { id: 'droneg', nm: '드론 기관총', ic: '🛸', c: 'special', t: 1, m: 'drone', dmg: 4, cd: .26, n: 1, range: 270, col: '#b0bec5', s: ['drone', 1], d: '전투 드론이 따라다니며 자동 사격.' },
  { id: 'turret', nm: '자동 방어 포탑', ic: '🗼', c: 'special', t: 2, m: 'turret', dmg: 6.5, cd: 6, fire: .24, life: 9, n: 1, range: 240, col: '#90a4ae', s: ['turret', 1], d: '그 자리에 9초간 포탑을 설치.' },
  { id: 'mines', nm: '지뢰 살포기', ic: '💣', c: 'special', t: 1, m: 'mine', dmg: 32, cd: 2.0, n: 3, boom: 48, col: '#ff5252', s: ['mine', 1], d: '주변에 지뢰를 뿌려 접근한 적을 폭파.' },
  { id: 'orbital', nm: '전설의 궤도 폭격 장치', ic: '🛰️', c: 'special', t: 3, m: 'orbital', dmg: 80, cd: 4.0, boom: 80, burn: 8, col: '#ff1744', s: ['orbital', 1], d: '위성이 적이 가장 많은 곳을 폭격.' },
  // ---------- 미래형 10 ----------
  { id: 'quantum', nm: '양자 분열포', ic: '💠', c: 'future', t: 3, m: 'split', dmg: 38, cd: 1.15, spd: 520, range: 380, shards: 7, shardDmg: 11, col: '#00e5ff', s: ['quantum', 1], d: '명중하면 양자 파편 7개로 분열.' },
  { id: 'blackhole', nm: '블랙홀 생성기', ic: '🌌', c: 'future', t: 3, m: 'hole', dps: 26, cd: 5.5, dur: 3.2, r: 140, pull: 140, col: '#651fff', s: ['hole', 1], d: '적을 빨아들이는 블랙홀 생성.' },
  { id: 'ion', nm: '이온 캐논', ic: '🔦', c: 'future', t: 3, m: 'ion', dps: 70, cd: 3.0, dur: 1.6, r: 40, col: '#84ffff', s: ['ion', 1], d: '하늘에서 이온 광선이 적을 추적하며 태운다.' },
  { id: 'accel', nm: '입자 가속포', ic: '☢️', c: 'future', t: 3, m: 'rail', dmg: 120, cd: 3.0, range: 700, w: 18, charge: .6, ap: 1, col: '#ffea00', s: ['rail', .7], d: '0.6초 충전 후 초강력 관통 사격.' },
  { id: 'fusion', nm: '핵융합 플라즈마포', ic: '🌞', c: 'future', t: 4, m: 'plasma', dmg: 80, cd: 2.6, spd: 170, range: 420, size: 22, boom: 100, burn: 10, col: '#ffab00', s: ['plasma', .45], d: '태양 같은 구체가 모든 것을 녹이고 폭발.' },
  { id: 'storm', nm: '초전자 폭풍포', ic: '🌀', c: 'future', t: 4, m: 'chain', dmg: 22, cd: 1.7, range: 360, targets: 5, chain: 4, stun: .2, col: '#e1f5fe', s: ['zap', .7], d: '번개 5줄이 각각 5번씩 튕기는 전격 폭풍.' },
  { id: 'gcollapse', nm: '중력 붕괴포', ic: '⚫', c: 'future', t: 4, m: 'hole', dps: 14, cd: 4.2, dur: 1.3, r: 120, pull: 240, collapse: 90, boom: 100, col: '#311b92', s: ['hole', .7], d: '강하게 끌어당긴 뒤 붕괴 폭발.' },
  { id: 'dimlaser', nm: '차원 관통 레이저', ic: '✴️', c: 'future', t: 4, m: 'rail', dmg: 52, cd: 2.2, range: 650, w: 13, n: 3, fan: .18, charge: .2, ap: 1, col: '#e040fb', s: ['rail', 1.3], d: '차원을 가르는 3줄 관통 광선.' },
  { id: 'thunder', nm: '천둥의 미사일 시스템', ic: '🌩️', c: 'future', t: 4, m: 'rocket', dmg: 13, cd: 2.6, n: 8, salvo: .06, spd: 340, range: 480, boom: 30, homing: 7, sky: 1, zap: 1, pk: 'missile', col: '#fff176', s: ['missile', .8], d: '하늘에서 쏟아지는 번개 미사일 8발.' },
  { id: 'doomcannon', nm: '신화급 종말의 캐논', ic: '👑', c: 'future', t: 4, m: 'cannon', dmg: 200, cd: 4.5, spd: 300, range: 500, pierce: 99, size: 24, boom: 130, ap: 1, kb: 400, shards: 16, col: '#ff1744', s: ['doom', 1], d: '모든 것을 관통하는 종말의 포탄 + 파편 폭풍.' }
];
for (const w of WEAPONS) { w.st = OLD_ST[w.id]; w.tr = w.tr || []; }
WEAPONS.push(...genWeapons(WEAPONS));
for (const w of WEAPONS) w.cal = (typeof CAL !== 'undefined' && CAL[w.id]) || 1;
const WMAP = {}; WEAPONS.forEach((w, i) => { w.idx = i; WMAP[w.id] = w; });
function stageWeapons(n) { return WEAPONS.filter(w => w.st === n).map(w => w.id); }
const WMAX = 5, WSLOTS = 5;
// 레벨 3·5에서 무엇이 달라지는지 (발사 방식별)
const LV3 = { flak: '파편 +3', barrage: '포탄 +2', nova: '반경 +20%', boomer: '원반 +1', wave: '탄 +1', saw: '톱날 +1', harpoon: '작살 +1', gun: '탄환 +1', laser: '레이저 +1', rocket: '발사 수 +1', lob: '발사 수 +1', cannon: '관통 +2, 포탄 대형화', rail: '광선 굵기 +40%', beam: '지속시간·굵기 증가', spin: '레이저 +1줄', plasma: '구체 대형화, 폭발 +25%', chain: '연쇄 +1', cone: '사거리 +20%', tazer: '대상 +2', drone: '드론 +1', turret: '포탑 +1', mine: '지뢰 +2', orbital: '폭격 범위 +20%', ion: '광선 범위 +30%', hole: '반경 +25%', split: '파편 +3' };
const LV5 = { flak: '파편 +3 · 피해 증가', barrage: '포탄 +2 · 폭발 +20%', nova: '2연속 충격파', boomer: '원반 +1 · 대형화', wave: '탄 +1 · 관통 +2', saw: '톱날 +1 · 회전 가속', harpoon: '작살 +1 · 기절 연장', gun: '탄환 +1 · 탄 강화 이펙트', laser: '레이저 +1 · 관통 +2', rocket: '발사 수 +1 · 폭발 +20%', lob: '폭발 범위 +25%', cannon: '포탄 거대화 · 폭발 +30%', rail: '광선 추가 발사', beam: '광선 +1줄', spin: '회전 속도·길이 증가', plasma: '구체 거대화', chain: '대상 +1', cone: '피해 +30% · 범위 증가', tazer: '대상 +2 · 기절', drone: '드론 +1 · 연사 증가', turret: '포탑 수명 +50%', mine: '지뢰 +2 · 폭발 +25%', orbital: '폭격 범위 +20%', ion: '광선 +1', hole: '지속 +30%', split: '파편 +4 · 2차 분열' };
// 무기 진화 (최고 레벨 + 조건 충족 시)
const EVOS = {
  hmg: { need: { w: 'exrifle' }, n: '폭발 개틀링', ic: '💥', mod: { boom: 34, cdMul: .75, col: '#ff6e40' }, d: '중기관총 탄환이 모두 폭발한다.' },
  laser: { need: { p: 'pierce' }, n: '초관통 레이저', ic: '🔺', mod: { pierce: 99, spd: 1500, dmgMul: 1.5, len: 40, col: '#ff4081' }, d: '모든 적을 꿰뚫는 초고속 레이저.' },
  rocket: { need: { p: 'proj' }, n: '다연장 미사일', ic: '🎆', mod: { n: 5, salvo: .08, homing: 5, dmgMul: .75 }, d: '추적 로켓 5발 일제 발사.' },
  prifle2: { need: { w: 'chaincannon' }, n: '플라즈마 폭풍', ic: '⛈️', mod: { storm: 1, dmgMul: 1.3, size: 12 }, d: '플라즈마 구체가 주변에 번개를 뿌린다.' },
  droneg: { need: { w: 'smg' }, n: '전투 드론 편대', ic: '🛸', mod: { nAdd: 2, cdMul: .7 }, d: '드론 3기가 편대를 이뤄 사격.' },
  flamer: { need: { p: 'area' }, n: '지옥불 방사기', ic: '🌋', mod: { rangeMul: 1.4, dmgMul: 1.4, burn: 12 }, d: '사거리·화력이 크게 늘어난 화염.' },
  rifle: { need: { p: 'atk' }, n: '전설의 돌격소총', ic: '⭐', mod: { n: 2, pierce: 2, dmgMul: 1.2, col: '#ffea00' }, d: '2연발 관통탄을 쏘는 각성 소총.' },
  gl: { need: { p: 'area' }, n: '연쇄 유탄', ic: '🎇', mod: { cluster: 4 }, d: '유탄이 터지며 자탄 4개를 뿌린다.' }
};
// 패시브 스킬 (레벨업 카드)
const PASSIVES = {
  atk: { name: '공격력 증가', icon: '💪', max: 5, d: '모든 피해 +12%' },
  aspd: { name: '공격속도 증가', icon: '⏩', max: 5, d: '무기 재사용 시간 -9%' },
  proj: { name: '투사체 증가', icon: '➕', max: 2, d: '다발 무기 발사 수 +1' },
  pierce: { name: '관통 증가', icon: '📌', max: 3, d: '총탄·레이저 관통 +1' },
  area: { name: '범위 증가', icon: '⭕', max: 5, d: '폭발·광선·화염 범위 +12%' },
  crit: { name: '치명타 확률', icon: '🎯', max: 5, d: '치명타 확률 +7%' },
  hp: { name: '최대 체력', icon: '❤️', max: 5, d: '최대 체력 +25 (즉시 회복)' },
  armor: { name: '피해 감소', icon: '🛡️', max: 5, d: '받는 피해 -7%' },
  regen: { name: '자동 회복', icon: '💚', max: 5, d: '초당 체력 +0.5 회복' },
  speed: { name: '이동속도', icon: '👟', max: 5, d: '이동속도 +8%' },
  magnet: { name: '획득 범위', icon: '🧲', max: 5, d: '아이템 획득 범위 +35%' },
  greed: { name: '골드 획득', icon: '💰', max: 5, d: '골드 획득량 +20%' }
};
const PSLOTS = 6;
// 강화소 (골드로 영구 강화)
const UPGRADES = {
  atk: { n: '화력 강화', ic: '💥', max: 15, d: v => `모든 피해 +${v * 5}%`, base: 60 },
  hp: { n: '체력 강화', ic: '❤️', max: 15, d: v => `최대 체력 +${v * 12}`, base: 50 },
  armor: { n: '방탄 강화', ic: '🛡️', max: 10, d: v => `받는 피해 -${v * 2}%`, base: 70 },
  spd: { n: '기동 강화', ic: '👟', max: 10, d: v => `이동속도 +${v * 2}%`, base: 50 },
  gain: { n: '보급 강화', ic: '💰', max: 10, d: v => `경험치·골드 +${v * 5}%`, base: 60 },
  pot: { n: '물약 가방', ic: '🧪', max: 3, d: v => `스테이지 시작 물약 +${v}`, base: 150 }
};
function upCost(k, lv) { return Math.round(UPGRADES[k].base * Math.pow(1.36, lv) / 10) * 10; }

/* ------------------------- 몬스터 (48종) -------------------------
   ai: chase 기본 / flutter 날기 / zig 지그재그 / dash 돌진 / ranged 원거리 / phase 반투명 / bomb 자폭
       heal 치유 / summon 소환 / blink 순간이동 / static 구조물
   tag: 퀘스트 계산용 분류, armor: 피해 감소율 */
const ET = {
  // 1~5 좀비·감염자·돌연변이
  zombie: { n: '좀비', draw: 'zombie', hp: 14, spd: 34, dmg: 8, r: 13, xp: 1, tag: 'zombie' },
  runner: { n: '감염자', draw: 'runner', hp: 9, spd: 76, dmg: 6, r: 11, xp: 1, tag: 'zombie' },
  spitter: { n: '산성 감염자', draw: 'spitter', hp: 14, spd: 44, dmg: 7, r: 13, xp: 2, tag: 'zombie', ai: 'ranged', shot: 'acid' },
  bloater: { n: '자폭 좀비', draw: 'bloater', hp: 16, spd: 52, dmg: 15, r: 14, xp: 2, tag: 'zombie', ai: 'bomb' },
  brute: { n: '돌연변이', draw: 'brute', hp: 70, spd: 36, dmg: 14, r: 18, xp: 5, tag: 'mutant', armor: .35, ai: 'dash' },
  mhound: { n: '변종 들개', draw: 'wolf', pal: 'mutant', hp: 18, spd: 62, dmg: 9, r: 13, xp: 2, tag: 'mutant', ai: 'dash' },
  // 6~10 지하 괴물·야생 변종·얼음 괴물
  rat: { n: '거대 쥐', draw: 'rat', hp: 8, spd: 84, dmg: 5, r: 10, xp: 1, tag: 'beast', ai: 'zig' },
  bat: { n: '동굴 박쥐', draw: 'bat', hp: 6, spd: 82, dmg: 5, r: 10, xp: 1, tag: 'beast', ai: 'flutter', fly: 1 },
  cspider: { n: '동굴 거미', draw: 'spider', pal: 'caveSp', hp: 11, spd: 70, dmg: 6, r: 11, xp: 1, tag: 'beast', ai: 'zig' },
  ispider: { n: '감염 거미', draw: 'spider', pal: 'infSp', hp: 13, spd: 68, dmg: 6, r: 12, xp: 1, tag: 'beast', ai: 'zig' },
  infected: { n: '포자 감염체', draw: 'runner', pal: 'infected', hp: 12, spd: 64, dmg: 7, r: 12, xp: 1, tag: 'beast' },
  snowwolf: { n: '설원 늑대', draw: 'wolf', pal: 'snow', hp: 22, spd: 64, dmg: 9, r: 13, xp: 2, tag: 'ice', ai: 'dash' },
  yeti: { n: '설인', draw: 'golem', pal: 'yeti', hp: 85, spd: 34, dmg: 15, r: 19, xp: 5, tag: 'ice', armor: .3 },
  icewisp: { n: '얼음 정령', draw: 'ghost', pal: 'ice', hp: 14, spd: 48, dmg: 7, r: 12, xp: 2, tag: 'ice', ai: 'ranged', shot: 'ice' },
  iceslime: { n: '얼음 슬라임', draw: 'slime', pal: 'iceSlime', hp: 16, spd: 40, dmg: 7, r: 13, xp: 1, tag: 'ice', split: 'iceslimeS' },
  iceslimeS: { n: '작은 얼음 슬라임', draw: 'slime', pal: 'iceSlime', hp: 5, spd: 58, dmg: 4, r: 8, xp: 1, tag: 'ice', noDrop: 1 },
  // 11~15 화염 괴물·외계 생명체
  magmaslime: { n: '마그마 슬라임', draw: 'slime', pal: 'magma', hp: 18, spd: 42, dmg: 8, r: 13, xp: 1, tag: 'fire', split: 'magmaslimeS' },
  magmaslimeS: { n: '작은 마그마', draw: 'slime', pal: 'magma', hp: 6, spd: 60, dmg: 5, r: 8, xp: 1, tag: 'fire', noDrop: 1 },
  imp: { n: '화염 임프', draw: 'imp', hp: 13, spd: 66, dmg: 7, r: 12, xp: 2, tag: 'fire', ai: 'ranged', shot: 'fire', fly: 1 },
  lavahound: { n: '용암 사냥개', draw: 'wolf', pal: 'lava', hp: 24, spd: 66, dmg: 10, r: 13, xp: 2, tag: 'fire', ai: 'dash' },
  magmagolem: { n: '마그마 골렘', draw: 'golem', pal: 'magmaG', hp: 90, spd: 32, dmg: 16, r: 19, xp: 5, tag: 'fire', armor: .35 },
  alien: { n: '외계 병사', draw: 'alien', hp: 20, spd: 50, dmg: 8, r: 13, xp: 1, tag: 'alien' },
  xeno: { n: '외계 벌레', draw: 'xeno', hp: 12, spd: 76, dmg: 6, r: 12, xp: 1, tag: 'alien', ai: 'zig' },
  ashooter: { n: '외계 사수', draw: 'alien', pal: 'shooter', hp: 18, spd: 48, dmg: 8, r: 13, xp: 2, tag: 'alien', ai: 'ranged', shot: 'plasma' },
  brood: { n: '산란체', draw: 'xeno', pal: 'brood', hp: 60, spd: 30, dmg: 10, r: 18, xp: 5, tag: 'alien', ai: 'summon', minion: 'xeno' },
  // 16~20 로봇·전투 드론·기계 군단
  robot: { n: '전투 로봇', draw: 'robot', hp: 26, spd: 44, dmg: 9, r: 13, xp: 2, tag: 'robot', armor: .3 },
  drone: { n: '전투 드론', draw: 'drone', hp: 10, spd: 80, dmg: 6, r: 11, xp: 1, tag: 'drone', ai: 'flutter', fly: 1 },
  tankbot: { n: '중장갑 로봇', draw: 'tankbot', hp: 95, spd: 28, dmg: 14, r: 19, xp: 5, tag: 'robot', armor: .5, ai: 'ranged', shot: 'shell', keep: 120 },
  mspider: { n: '기계 거미', draw: 'mechspider', hp: 16, spd: 74, dmg: 7, r: 12, xp: 1, tag: 'robot', ai: 'zig', armor: .1 },
  bombbot: { n: '자폭 로봇', draw: 'bomber', pal: 'bot', hp: 14, spd: 64, dmg: 15, r: 12, xp: 2, tag: 'robot', ai: 'bomb' },
  sniperbot: { n: '저격 로봇', draw: 'robot', pal: 'sniper', hp: 20, spd: 40, dmg: 10, r: 13, xp: 2, tag: 'robot', ai: 'ranged', shot: 'laser', keep: 260 },
  repairbot: { n: '수리 드론', draw: 'drone', pal: 'repair', hp: 22, spd: 56, dmg: 4, r: 12, xp: 3, tag: 'drone', ai: 'heal', fly: 1 },
  // 21~25 방사능 변종·외계 군단
  radzombie: { n: '방사능 좀비', draw: 'zombie', pal: 'rad', hp: 20, spd: 42, dmg: 9, r: 13, xp: 1, tag: 'rad' },
  radrunner: { n: '방사능 감염자', draw: 'runner', pal: 'radr', hp: 13, spd: 80, dmg: 7, r: 11, xp: 1, tag: 'rad' },
  radbrute: { n: '방사능 거수', draw: 'brute', pal: 'radb', hp: 85, spd: 38, dmg: 15, r: 18, xp: 5, tag: 'rad', armor: .35, ai: 'dash' },
  radspitter: { n: '방사능 독침', draw: 'spitter', pal: 'rad', hp: 16, spd: 44, dmg: 8, r: 13, xp: 2, tag: 'rad', ai: 'ranged', shot: 'acid' },
  awarrior: { n: '외계 전사', draw: 'alien', pal: 'warrior', hp: 34, spd: 52, dmg: 10, r: 14, xp: 2, tag: 'alien', armor: .3 },
  manta: { n: '외계 비행체', draw: 'manta', hp: 16, spd: 78, dmg: 7, r: 13, xp: 2, tag: 'alien', ai: 'flutter', fly: 1 },
  assassin: { n: '외계 암살자', draw: 'alien', pal: 'shade', hp: 22, spd: 60, dmg: 11, r: 13, xp: 3, tag: 'alien', ai: 'blink' },
  // 26~30 암흑 기계·차원 괴물·최종 군단
  darkmech: { n: '암흑 기계병', draw: 'robot', pal: 'dark', hp: 34, spd: 48, dmg: 11, r: 14, xp: 2, tag: 'dark', armor: .35 },
  wraith: { n: '차원 망령', draw: 'ghost', pal: 'voidW', hp: 20, spd: 54, dmg: 9, r: 13, xp: 2, tag: 'dark', ai: 'phase' },
  watcher: { n: '감시자의 눈', draw: 'eye', hp: 26, spd: 46, dmg: 9, r: 14, xp: 3, tag: 'dark', ai: 'ranged', shot: 'laser', fly: 1 },
  voidslime: { n: '공허 슬라임', draw: 'slime', pal: 'void', hp: 22, spd: 44, dmg: 9, r: 14, xp: 1, tag: 'dark', split: 'voidslimeS' },
  voidslimeS: { n: '작은 공허', draw: 'slime', pal: 'void', hp: 7, spd: 62, dmg: 5, r: 8, xp: 1, tag: 'dark', noDrop: 1 },
  shound: { n: '그림자 사냥개', draw: 'wolf', pal: 'shadow', hp: 26, spd: 70, dmg: 11, r: 13, xp: 2, tag: 'dark', ai: 'dash' },
  vsummoner: { n: '차원 주술사', draw: 'eye', pal: 'summoner', hp: 55, spd: 30, dmg: 9, r: 16, xp: 5, tag: 'dark', ai: 'summon', minion: 'wraith', fly: 1 },
  darkdrone: { n: '암흑 드론', draw: 'drone', pal: 'darkD', hp: 14, spd: 84, dmg: 7, r: 11, xp: 1, tag: 'dark', ai: 'flutter', fly: 1 },
  // 특수
  golden: { n: '황금 몬스터', draw: 'runner', pal: 'goldM', hp: 140, spd: 95, dmg: 0, r: 13, xp: 10, tag: 'gold', ai: 'flee' },
  // 퀘스트 구조물
  portal: { n: '적 포탈', draw: 'portal', hp: 240, spd: 0, dmg: 0, r: 26, xp: 8, tag: 'obj', ai: 'static', armor: .2 },
  egg: { n: '괴생명체 알', draw: 'egg', hp: 70, spd: 0, dmg: 0, r: 15, xp: 2, tag: 'obj', ai: 'static' },
  device: { n: '기계 신전 장치', draw: 'device', hp: 420, spd: 0, dmg: 9, r: 24, xp: 8, tag: 'obj', ai: 'static', armor: .35 }
};
for (const k in ET) ET[k].id = k;

/* ------------------------- 보스 ------------------------- */
const BOSSES = {
  b_mutant: { name: '거대 돌연변이 왕', draw: 'zking', pal: 'mutant', r: 58, base: 2400, spd: 44, dmg: 22, pats: ['slam', 'radial', 'summon', 'charge', 'jump'], summon: 'runner' },
  b_ice: { name: '얼음 거인', draw: 'golem', pal: 'iceG', r: 62, base: 3600, spd: 38, dmg: 24, pats: ['slam', 'fan', 'charge', 'radial', 'summon'], summon: 'icewisp', shot: 'ice' },
  b_alien: { name: '외계 군주', draw: 'alien', pal: 'lord', r: 56, base: 5000, spd: 50, dmg: 26, pats: ['laser', 'radial', 'summon', 'blink', 'fan'], summon: 'xeno', shot: 'plasma' },
  b_mech: { name: '기계 군단 사령기', draw: 'tankbot', pal: 'bossMech', r: 64, base: 6600, spd: 40, dmg: 28, pats: ['laser', 'fan', 'slam', 'charge', 'summon'], summon: 'drone', shot: 'shell' },
  b_abyss: { name: '심연의 군주', draw: 'eye', pal: 'abyss', r: 60, base: 8400, spd: 46, dmg: 30, pats: ['laser', 'radial', 'summon', 'blink', 'slam', 'spiral'], summon: 'wraith', shot: 'plasma' },
  b_final: { name: '파멸의 신', draw: 'eye', pal: 'final', r: 74, base: 16000, spd: 44, dmg: 33, pats: ['laser', 'spiral', 'slam', 'summon', 'blink', 'radial', 'charge'], summon: 'darkmech', shot: 'laser', final: 1 },
  // 무작위 난입 보스 (약화판)
  m_brute: { name: '난입: 거대 돌연변이', draw: 'brute', pal: 'mutant', r: 40, base: 1300, spd: 46, dmg: 18, pats: ['charge', 'slam', 'summon'], summon: 'runner', mini: 1 },
  m_queen: { name: '난입: 산란 여왕', draw: 'xeno', pal: 'brood', r: 42, base: 2200, spd: 48, dmg: 20, pats: ['summon', 'radial', 'charge'], summon: 'xeno', mini: 1 },
  m_mech: { name: '난입: 전쟁 기계', draw: 'robot', pal: 'bossMech', r: 42, base: 3000, spd: 44, dmg: 22, pats: ['fan', 'laser', 'charge'], summon: 'drone', shot: 'shell', mini: 1 },
  m_void: { name: '난입: 공허의 사도', draw: 'eye', pal: 'voidW', r: 42, base: 3800, spd: 46, dmg: 24, pats: ['laser', 'blink', 'radial'], summon: 'wraith', mini: 1 }
};

/* ------------------------- 퀘스트 아이템 ------------------------- */
const QITEMS = {
  supply: { n: '군사 보급품', ic: '📦', col: '#a1887f' }, core: { n: '에너지 코어', ic: '🔋', col: '#00e676' }, crystal: { n: '얼음 결정', ic: '💎', col: '#80d8ff' },
  data: { n: '외계 데이터', ic: '💾', col: '#18ffff' }, part: { n: '기계 코어', ic: '⚙️', col: '#b0bec5' }, energy: { n: '외계 에너지', ic: '🔮', col: '#e040fb' }
};
const TAG_NAME = { zombie: '좀비', mutant: '돌연변이', beast: '야생 변종', ice: '얼음 괴물', fire: '화염 몬스터', alien: '외계 생명체', robot: '로봇', drone: '전투 드론', rad: '방사능 변종', dark: '암흑 몬스터' };

/* ------------------------- 30 스테이지 -------------------------
   bg: 배경, mobs: [몬스터, 가중치], main: 메인 목표(모두 달성 → 클리어/보스), side: 보조 목표(추가 보상)
   wp: 이 스테이지의 주요 무기 후보 (앞쪽 신규, 뒤쪽 기존), mu: 배경음악 테마, D: 난이도 상승 기준 시간 */
const STAGES = [
  { name: '폐허가 된 도시', mu: 'city', wx: 'dust', bg: { pat: 'asphalt', ground: ['#6f6e6a', '#63625e'], deco: [['crack', 10], ['rubble', 8], ['car', 3], ['blood', 3], ['cone', 3]] },
    mobs: [['zombie', 6], ['runner', 2], ['bloater', 1]], main: [{ k: 'kill', n: 600 }], wp: ['rifle', 'smg', 'gl'] },
  { name: '좀비가 점령한 도로', mu: 'city', wx: 'smoke', bg: { pat: 'road', ground: ['#4a4a4f', '#424247'], deco: [['car', 4], ['barrier', 3], ['blood', 5], ['crack', 6], ['cone', 4]] },
    mobs: [['zombie', 5], ['runner', 3], ['spitter', 2]], main: [{ k: 'kill', n: 800 }], wp: ['tactical', 'lmg', 'laser', 'rifle'] },
  { name: '버려진 군사기지', mu: 'military', wx: 'dust', bg: { pat: 'concrete', ground: ['#7c7a62', '#737158', 'rgba(0,0,0,.18)'], deco: [['sandbag', 4], ['crate', 6, '#6d7a3a'], ['helipad', 1], ['barrel', 4, '#556b2f'], ['wire', 3]], live: ['radar', 'blink'] },
    mobs: [['zombie', 4], ['runner', 3], ['mhound', 2], ['spitter', 1]], main: [{ k: 'collect', item: 'supply', n: 18 }], side: [{ k: 'kill', n: 600 }], wp: ['hmg', 'rocket', 'prifle'] },
  { name: '오염된 공장', mu: 'factory', wx: 'smoke', bg: { pat: 'plates', ground: ['#5d5f55', '#55574d'], deco: [['toxic', 6], ['pipe', 4, '#6d4c41'], ['barrel', 6, '#827717'], ['hazard', 3], ['grate', 3]], live: ['steam', 'fan'] },
    mobs: [['zombie', 4], ['bloater', 2], ['spitter', 2], ['brute', 1]], main: [{ k: 'kill', n: 900 }, { k: 'elite', n: 2 }], wp: ['flamer', 'freezer', 'prifle2'] },
  { name: '파괴된 연구소', mu: 'lab', wx: 'sparks', bg: { pat: 'tiles', ground: ['#c9d3d6', '#bcc7cb', 'rgba(0,60,90,.2)'], deco: [['glass', 6], ['table', 4], ['hazard', 2], ['blood', 3], ['tank', 2, 'rgba(118,255,3,.5)'], ['screen', 2]], live: ['blink', 'hologram'] },
    mobs: [['runner', 3], ['zombie', 3], ['brute', 2], ['mhound', 2], ['bloater', 1]], main: [{ k: 'kill', n: 700 }, { k: 'boss', id: 'b_mutant' }], side: [{ k: 'elite', n: 1 }], wp: ['minigun', 'mlrs', 'cannon', 'rifle'] },
  { name: '어두운 지하철', mu: 'subway', wx: 'dust', dark: .55, bg: { pat: 'rails', ground: ['#2b2b30', '#26262a'], deco: [['pillar', 4, '#5d5d66'], ['debris', 5], ['bones', 3], ['lights', 2, '#ffe082']], live: ['blink'] },
    mobs: [['rat', 4], ['bat', 3], ['cspider', 3], ['mhound', 1]], main: [{ k: 'survive', sec: 240 }], side: [{ k: 'kill', n: 1500 }], wp: ['emp', 'mines', 'gl', 'laser'] },
  { name: '감염된 숲', mu: 'forest', wx: 'spores', dark: .25, bg: { pat: 'blotch', ground: ['#2e4a2a', '#283f25'], grass: 'rgba(120,255,80,.18)', deco: [['mushroom', 8, '#ba68c8'], ['roots', 5], ['goo', 4, 'rgba(178,255,89,.3)'], ['rock', 3, '#4e5b48']] },
    mobs: [['ispider', 4], ['infected', 4], ['rat', 2], ['bat', 2]], main: [{ k: 'collect', item: 'core', n: 40 }], side: [{ k: 'elite', n: 1 }], wp: ['gas', 'acid', 'droneg', 'flamer'] },
  { name: '사막 전쟁터', mu: 'military', wx: 'dust', bg: { pat: 'sand', ground: ['#d9b97a', '#cfae6d', 'rgba(150,100,40,.18)'], deco: [['crater', 5], ['wreck', 2], ['wire', 3], ['rock', 4, '#b08d57'], ['sandbag', 2]] },
    mobs: [['mhound', 3], ['runner', 3], ['brute', 2], ['spitter', 2], ['bloater', 1]], main: [{ k: 'kill', n: 1400 }], side: [{ k: 'collect', item: 'supply', n: 15 }], wp: ['mortar', 'twinmg', 'exrifle', 'hmg'] },
  { name: '폭설이 내리는 기지', mu: 'ice', wx: 'snow', bg: { pat: 'snow', ground: ['#e8eef2', '#dbe4ea'], deco: [['prints', 6], ['crate', 4, '#90a4ae'], ['snowpile', 6], ['barrier', 2], ['icecrystal', 3]], live: ['radar'] },
    mobs: [['snowwolf', 3], ['icewisp', 2], ['iceslime', 3], ['yeti', 1]], main: [{ k: 'collect', item: 'crystal', n: 50 }], side: [{ k: 'kill', n: 1000 }], wp: ['tazer', 'slaser', 'freezer', 'lmg'] },
  { name: '얼어붙은 도시', mu: 'ice', wx: 'snow', bg: { pat: 'asphalt', ground: ['#b8cdd8', '#a9c0cc'], deco: [['car', 3, '#90a4ae'], ['icecrystal', 6], ['crack', 6], ['snowpile', 4]] },
    mobs: [['snowwolf', 3], ['iceslime', 3], ['icewisp', 2], ['yeti', 2]], main: [{ k: 'survive', sec: 200 }, { k: 'boss', id: 'b_ice' }], side: [{ k: 'kill', n: 1200 }], wp: ['agl', 'homing', 'cannon', 'minigun'] },
  { name: '화산 지대', mu: 'volcano', wx: 'embers', bg: { pat: 'rock', ground: ['#3a2a26', '#332420'], deco: [['lava', 8], ['lavapool', 2], ['rock', 5, '#4e342e'], ['ashpile', 4]], live: ['lavaglow'] },
    mobs: [['magmaslime', 4], ['imp', 2], ['lavahound', 3], ['magmagolem', 1]], main: [{ k: 'killTag', tag: 'fire', n: 2000 }], side: [{ k: 'elite', n: 2 }], wp: ['cluster', 'flamecannon', 'flamer', 'acid'] },
  { name: '용암 발전소', mu: 'volcano', wx: 'embers', bg: { pat: 'plates', ground: ['#4a3b36', '#40322d'], deco: [['grate', 5], ['lavapool', 3], ['pipe', 4, '#8d6e63'], ['stripes', 3]], live: ['gear', 'steam', 'lavaglow'] },
    mobs: [['magmaslime', 3], ['imp', 3], ['lavahound', 2], ['magmagolem', 2]], main: [{ k: 'defend', gens: 3, sec: 200 }], side: [{ k: 'kill', n: 1200 }], wp: ['lrifle', 'turret', 'droneg', 'mortar'] },
  { name: '외계 생명체 연구시설', mu: 'alien', wx: 'sparks', bg: { pat: 'hex', ground: ['#21424a', '#1c3a41', 'rgba(0,229,255,.18)'], deco: [['tank', 4], ['goo', 4], ['screen', 3, '#18ffff'], ['glass', 3]], live: ['hologram', 'blink'] },
    mobs: [['alien', 4], ['xeno', 4], ['ashooter', 2], ['brood', 1]], main: [{ k: 'killTag', tag: 'alien', n: 1500 }], side: [{ k: 'collect', item: 'core', n: 20 }], wp: ['chaincannon', 'spinlaser', 'prifle2', 'prifle'] },
  { name: '우주 정거장', mu: 'space', wx: 'stars', bg: { pat: 'plates', ground: ['#3b4250', '#353b48', 'rgba(0,0,0,.35)'], deco: [['window', 4], ['lights', 4], ['stripes', 3], ['hull', 2, '#4a5568']], live: ['blink', 'fan'] },
    mobs: [['alien', 3], ['xeno', 3], ['ashooter', 2], ['drone', 2]], main: [{ k: 'collect', item: 'data', n: 40 }], side: [{ k: 'kill', n: 1500 }], wp: ['plaser', 'pcannon', 'homing', 'twinmg'] },
  { name: '외계 행성', mu: 'alien', wx: 'spores', bg: { pat: 'blotch', ground: ['#4a2d5c', '#3f2650'], deco: [['plant', 6], ['crystal', 5, '#18ffff'], ['crater', 4], ['goo', 3, 'rgba(224,64,251,.3)']] },
    mobs: [['alien', 3], ['xeno', 4], ['ashooter', 2], ['brood', 1], ['awarrior', 1]], main: [{ k: 'kill', n: 1500 }, { k: 'boss', id: 'b_alien' }], side: [{ k: 'elite', n: 2 }], wp: ['railcannon', 'exrifle', 'mlrs', 'chaincannon'] },
  { name: '기계 군단의 공장', mu: 'techno', wx: 'sparks', bg: { pat: 'conveyor', ground: ['#4f5357', '#474b4f'], deco: [['gear', 4], ['crate', 4, '#607d8b'], ['stripes', 3], ['pipe', 3]], live: ['conveyor', 'gear', 'gear'] },
    mobs: [['robot', 4], ['mspider', 3], ['bombbot', 2], ['tankbot', 1]], main: [{ k: 'killTag', tag: 'robot', n: 1800 }], side: [{ k: 'collect', item: 'part', n: 25 }], wp: ['gatling', 'quantum', 'minigun', 'turret'] },
  { name: '로봇 생산기지', mu: 'techno', wx: 'sparks', bg: { pat: 'hex', ground: ['#3d4549', '#363e42', 'rgba(255,214,0,.15)'], deco: [['pad', 5], ['screen', 3], ['stripes', 2], ['gear', 2]], live: ['blink', 'hologram', 'fan'] },
    mobs: [['robot', 3], ['mspider', 3], ['drone', 3], ['repairbot', 1], ['sniperbot', 1]], main: [{ k: 'collect', item: 'part', n: 30 }], side: [{ k: 'elite', n: 2 }], wp: ['doomlaser', 'ion', 'lrifle'] },
  { name: '사이버펑크 도시', mu: 'cyber', wx: 'neonrain', dark: .35, bg: { pat: 'asphalt', ground: ['#1b1b2e', '#191a2a'], deco: [['neon', 5], ['puddle', 6], ['neon', 3, '#00e5ff'], ['car', 2, '#311b92']], live: ['neon', 'neon'] },
    mobs: [['drone', 5], ['robot', 2], ['sniperbot', 2], ['bombbot', 2], ['repairbot', 1]], main: [{ k: 'killTag', tag: 'drone', n: 1100 }], side: [{ k: 'kill', n: 1800 }], wp: ['accel', 'homing', 'droneg', 'spinlaser'] },
  { name: '네온빛 미래 도시', mu: 'cyber', wx: 'neonrain', dark: .3, bg: { pat: 'neongrid', ground: ['#0d0d24', '#14143a', 'rgba(0,229,255,.45)'], deco: [['neon', 4, '#e040fb'], ['puddle', 4, 'rgba(0,229,255,.35)'], ['glowline', 4, '#00e5ff']], live: ['neon', 'hologram'] },
    mobs: [['drone', 3], ['robot', 3], ['mspider', 3], ['sniperbot', 2]], main: [{ k: 'portal', n: 4 }], side: [{ k: 'kill', n: 1500 }], wp: ['gravcannon', 'blackhole', 'railcannon'] },
  { name: '거대 기계 요새', mu: 'techno', wx: 'sparks', bg: { pat: 'plates', ground: ['#3a3d40', '#323538', 'rgba(0,0,0,.4)'], deco: [['stripes', 4], ['pipe', 4, '#455a64'], ['gear', 3], ['crate', 3, '#37474f']], live: ['gear', 'blink', 'fan'] },
    mobs: [['robot', 3], ['tankbot', 2], ['mspider', 3], ['bombbot', 2], ['sniperbot', 1]], main: [{ k: 'survive', sec: 240 }, { k: 'boss', id: 'b_mech' }], side: [{ k: 'killTag', tag: 'robot', n: 1800 }], wp: ['orbital', 'fusion', 'pcannon'] },
  { name: '방사능 오염지역', mu: 'waste', wx: 'rad', bg: { pat: 'blotch', ground: ['#5f6532', '#565b2c'], grass: 'rgba(198,255,0,.18)', deco: [['radsign', 3], ['barrel', 5, '#c6ff00'], ['toxic', 5, 'rgba(198,255,0,.35)'], ['wreck', 1], ['bones', 3]] },
    mobs: [['radzombie', 5], ['radrunner', 3], ['radbrute', 2], ['radspitter', 2]], main: [{ k: 'killTag', tag: 'rad', n: 3000 }], side: [{ k: 'elite', n: 2 }], wp: ['storm', 'quantum', 'gatling', 'cluster'] },
  { name: '무너진 지하 벙커', mu: 'subway', wx: 'dust', dark: .5, bg: { pat: 'concrete', ground: ['#3d3b38', '#363431', 'rgba(0,0,0,.35)'], deco: [['debris', 6], ['crack', 8], ['lights', 2, '#ffab00'], ['crate', 3, '#5d4037'], ['radsign', 1]], live: ['blink'] },
    mobs: [['radzombie', 3], ['radrunner', 3], ['rat', 2], ['radbrute', 1], ['bloater', 2]], main: [{ k: 'defend', gens: 1, sec: 280 }], side: [{ k: 'kill', n: 2500 }], wp: ['dimlaser', 'gravcannon', 'turret'] },
  { name: '괴생명체의 둥지', mu: 'hive', wx: 'spores', dark: .4, bg: { pat: 'organic', ground: ['#4a1f2e', '#401a28', 'rgba(255,82,82,.25)'], deco: [['membrane', 6], ['eggdeco', 5], ['goo', 4, 'rgba(255,235,59,.25)'], ['bones', 3]], live: ['pulse'] },
    mobs: [['xeno', 4], ['brood', 2], ['awarrior', 2], ['manta', 2]], main: [{ k: 'egg', n: 30 }], side: [{ k: 'elite', n: 2 }], wp: ['thunder', 'flamecannon', 'gas'] },
  { name: '외계 우주선 내부', mu: 'space', wx: 'sparks', dark: .2, bg: { pat: 'hex', ground: ['#2a1f3d', '#241a35', 'rgba(224,64,251,.25)'], deco: [['glowline', 6, '#e040fb'], ['tank', 3, 'rgba(224,64,251,.5)'], ['screen', 3, '#e040fb'], ['crystal', 2]], live: ['pulse', 'hologram'] },
    mobs: [['awarrior', 3], ['ashooter', 3], ['assassin', 2], ['xeno', 3], ['manta', 2]], main: [{ k: 'collect', item: 'energy', n: 70 }], side: [{ k: 'kill', n: 2500 }], wp: ['gcollapse', 'ion', 'accel'] },
  { name: '차원 균열 지대', mu: 'rift', wx: 'void', dark: .3, bg: { pat: 'void', ground: ['#170d26', '#2a1146', 'rgba(224,64,251,.2)'], deco: [['rift', 5], ['debris', 5, '#4527a0'], ['crystal', 3, '#e040fb'], ['rune', 2]], live: ['rift', 'pulse'] },
    mobs: [['wraith', 3], ['assassin', 2], ['awarrior', 2], ['watcher', 2], ['voidslime', 2]], main: [{ k: 'kill', n: 2500 }, { k: 'boss', id: 'b_abyss' }], side: [{ k: 'elite', n: 3 }], wp: ['orbital', 'blackhole', 'doomlaser', 'fusion'] },
  { name: '검은 행성', mu: 'rift', wx: 'ash', dark: .35, bg: { pat: 'rock', ground: ['#1c1c22', '#18181d'], deco: [['crystal', 6, '#40c4ff'], ['crater', 5], ['rock', 5, '#2c2c34'], ['ashpile', 3]] },
    mobs: [['darkmech', 3], ['voidslime', 3], ['shound', 3], ['watcher', 2]], main: [{ k: 'killTag', tag: 'dark', n: 3800 }], side: [{ k: 'collect', item: 'core', n: 40 }], wp: ['doomcannon', 'storm', 'dimlaser'] },
  { name: '기계 신전', mu: 'techno', wx: 'sparks', dark: .25, bg: { pat: 'tiles', ground: ['#2e2a1e', '#28241a', 'rgba(255,214,0,.25)'], deco: [['circuit', 8], ['altar', 2], ['rune', 3, 'rgba(255,214,0,.4)'], ['gear', 3, '#a1887f']], live: ['gear', 'hologram'] },
    mobs: [['darkmech', 4], ['darkdrone', 3], ['watcher', 2], ['vsummoner', 1], ['mspider', 2]], main: [{ k: 'device', n: 4 }], side: [{ k: 'elite', n: 3 }], wp: ['thunder', 'gcollapse', 'railcannon'] },
  { name: '우주 전쟁터', mu: 'epic', wx: 'stars', bg: { pat: 'space', ground: ['#0a0a18', 'rgba(80,60,160,.35)'], deco: [['hull', 6, '#37474f'], ['asteroid', 4], ['debris', 5, '#546e7a'], ['lights', 2, '#ff5252']], live: ['blink'] },
    mobs: [['darkdrone', 3], ['awarrior', 3], ['darkmech', 2], ['manta', 3], ['assassin', 2]], main: [{ k: 'survive', sec: 360 }], side: [{ k: 'kill', n: 3500 }], wp: ['gatling', 'orbital', 'doomcannon', 'quantum'] },
  { name: '파멸의 요새', mu: 'doom', wx: 'embers', dark: .3, bg: { pat: 'plates', ground: ['#2b1414', '#241010', 'rgba(255,23,68,.25)'], deco: [['spikes', 5], ['lavapool', 2], ['skull', 5], ['stripes', 2], ['lava', 3, '#ff1744']], live: ['lavaglow', 'blink'] },
    mobs: [['shound', 3], ['darkmech', 3], ['wraith', 2], ['watcher', 2], ['vsummoner', 1], ['radbrute', 1]], main: [{ k: 'elite', n: 12 }], side: [{ k: 'kill', n: 3000 }], wp: ['fusion', 'doomlaser', 'storm', 'gravcannon'] },
  { name: '최종 보스의 차원 공간', mu: 'final', wx: 'void', dark: .35, bg: { pat: 'void', ground: ['#0b0614', '#1a0b2e', 'rgba(255,23,68,.25)'], deco: [['rune', 5, 'rgba(255,23,68,.5)'], ['rift', 4, '#ff1744'], ['crystal', 3, '#ff1744'], ['skull', 3]], live: ['rift', 'pulse', 'pulse'] },
    mobs: [['darkmech', 3], ['wraith', 2], ['shound', 2], ['watcher', 2], ['awarrior', 2], ['vsummoner', 1]], main: [{ k: 'survive', sec: 260 }, { k: 'boss', id: 'b_final' }], side: [{ k: 'elite', n: 3 }] },
  // ---------- 31~40 신규 지역 ----------
  { name: '붕괴된 천공 도시', mu: 'space', wx: 'clouds', bg: { pat: 'plates', ground: ['#8fa3b8', '#8297ad', 'rgba(255,255,255,.25)'], deco: [['cloud', 6], ['hull', 3, '#b0bec5'], ['lights', 3, '#e1f5fe'], ['crack', 5]], live: ['fan', 'blink'] },
    mobs: [['manta', 4], ['darkdrone', 3], ['imp', 2], ['awarrior', 2]], main: [{ k: 'kill', n: 2200 }], side: [{ k: 'elite', n: 3 }] },
  { name: '수몰된 해저 기지', mu: 'ice', wx: 'bubbles', dark: .35, bg: { pat: 'hex', ground: ['#0d3b4f', '#0b3344', 'rgba(128,222,234,.2)'], deco: [['coral', 6], ['kelp', 6], ['tank', 3, 'rgba(128,222,234,.5)'], ['bubblevent', 3]], live: ['steam', 'blink'] },
    mobs: [['iceslime', 4], ['xeno', 3], ['icewisp', 2], ['brood', 1]], main: [{ k: 'collect', item: 'energy', n: 55 }], side: [{ k: 'kill', n: 2200 }] },
  { name: '결정 동굴', mu: 'rift', wx: 'sparkle', dark: .45, bg: { pat: 'rock', ground: ['#271a3d', '#221636'], deco: [['crystal', 10, '#e040fb'], ['crystal', 6, '#40c4ff'], ['rock', 4, '#3a2d52']], live: ['pulse'] },
    mobs: [['wraith', 3], ['voidslime', 3], ['cspider', 3], ['watcher', 2]], main: [{ k: 'portal', n: 5 }], side: [{ k: 'elite', n: 3 }] },
  { name: '독성 정글', mu: 'forest', wx: 'spores', dark: .3, bg: { pat: 'blotch', ground: ['#1f3d1a', '#1a3416'], grass: 'rgba(198,255,0,.22)', deco: [['kelp', 6, '#558b2f'], ['mushroom', 8, '#76ff03'], ['toxic', 5], ['roots', 4]] },
    mobs: [['ispider', 4], ['infected', 3], ['radspitter', 2], ['xeno', 3]], main: [{ k: 'egg', n: 30 }], side: [{ k: 'kill', n: 2400 }] },
  { name: '사막 피라미드 기지', mu: 'military', wx: 'dust', bg: { pat: 'sand', ground: ['#d6b06b', '#caa45f', 'rgba(120,80,30,.2)'], deco: [['pyramid', 3], ['hiero', 5], ['wreck', 2], ['rock', 4, '#a1824e']], live: ['radar'] },
    mobs: [['alien', 2], ['mhound', 3], ['ashooter', 1], ['xeno', 4]], main: [{ k: 'device', n: 4 }], side: [{ k: 'elite', n: 3 }] },
  { name: '빙하 행성 코어', mu: 'ice', wx: 'snow', bg: { pat: 'snow', ground: ['#cfe8f5', '#bfdeee'], deco: [['icecrystal', 9, 'rgba(129,212,250,.9)'], ['snowpile', 5], ['crack', 4]] },
    mobs: [['snowwolf', 4], ['yeti', 2], ['icewisp', 3], ['iceslime', 2]], main: [{ k: 'defend', gens: 3, sec: 260 }], side: [{ k: 'kill', n: 2500 }] },
  { name: '태양 플라즈마 발전소', mu: 'volcano', wx: 'embers', bg: { pat: 'plates', ground: ['#5a3a1a', '#4f3316', 'rgba(255,214,0,.3)'], deco: [['sunpanel', 6], ['lavapool', 3], ['stripes', 3], ['pipe', 3, '#ff8f00']], live: ['lavaglow', 'gear'] },
    mobs: [['imp', 3], ['magmaslime', 3], ['lavahound', 3], ['magmagolem', 2]], main: [{ k: 'killTag', tag: 'fire', n: 2600 }], side: [{ k: 'collect', item: 'core', n: 30 }] },
  { name: '시간 왜곡 회랑', mu: 'rift', wx: 'void', dark: .3, bg: { pat: 'tiles', ground: ['#1d1533', '#19122c', 'rgba(179,136,255,.3)'], deco: [['clock', 5], ['gear', 4, '#7e57c2'], ['rune', 3], ['glowline', 3, '#b388ff']], live: ['gear', 'pulse'] },
    mobs: [['assassin', 3], ['wraith', 3], ['watcher', 2], ['darkdrone', 2], ['vsummoner', 1]], main: [{ k: 'survive', sec: 300 }], side: [{ k: 'elite', n: 4 }] },
  { name: '기계신의 심장', mu: 'doom', wx: 'sparks', dark: .3, bg: { pat: 'organic', ground: ['#3a1018', '#330e15', 'rgba(255,82,82,.35)'], deco: [['vein', 6], ['gear', 4, '#8d6e63'], ['membrane', 4], ['pipe', 3, '#5d4037']], live: ['pulse', 'gear'] },
    mobs: [['darkmech', 4], ['brood', 2], ['radbrute', 2], ['mspider', 3]], main: [{ k: 'elite', n: 10 }], side: [{ k: 'kill', n: 2800 }] },
  { name: '오메가 차원의 끝', mu: 'final', wx: 'void', dark: .4, bg: { pat: 'void', ground: ['#f2f2f7', '#dcdce8', 'rgba(0,0,0,.25)'], deco: [['rune', 6, 'rgba(0,0,0,.45)'], ['rift', 5, '#000000'], ['crystal', 3, '#ffd600']], live: ['rift', 'pulse'] },
    mobs: [['darkmech', 3], ['wraith', 2], ['shound', 3], ['watcher', 2], ['awarrior', 2], ['vsummoner', 1]], main: [{ k: 'survive', sec: 240 }], side: [{ k: 'elite', n: 4 }] }
];
// ---------- 스테이지별 시그니처 몬스터 40종 (새 외형 색·크기·능력) ----------
const SIG_NAMES = ['피투성이 좀비', '도로 폭주 감염자', '탈영병 좀비', '오염된 작업자', '실험 탈출체', '지하철 쥐왕 새끼', '포자 덩굴 괴물', '사막 변종 하이에나', '설원 사냥꾼', '얼음 기사', '용암 박쥐', '발전소 화염귀', '탈출한 실험체', '정거장 침입자', '외계 정찰병', '조립 로봇 병사', '생산 라인 거미', '네온 드론', '홀로그램 유령', '요새 경비 기계', '방사능 거머리', '벙커 변이체', '둥지 수호충', '함선 방위 병기', '균열 추적자', '검은 행성 거신', '신전 수호 기계', '우주 해적 전투병', '파멸의 사냥개', '혼돈의 사도', '천공 하피', '심해 해파리', '수정 망령', '정글 포식충', '피라미드 미라병', '빙하 거인병', '태양 불꽃 정령', '시간 도둑', '심장 경비 기계', '오메가의 그림자'];
const SIG_BASE = ['zombie', 'runner', 'zombie', 'bloater', 'brute', 'rat', 'spider', 'wolf', 'wolf', 'golem', 'bat', 'imp', 'alien', 'xeno', 'alien', 'robot', 'mechspider', 'drone', 'ghost', 'robot', 'slime', 'brute', 'xeno', 'tankbot', 'ghost', 'golem', 'robot', 'alien', 'wolf', 'eye', 'manta', 'ghost', 'ghost', 'xeno', 'zombie', 'golem', 'imp', 'alien', 'mechspider', 'eye'];
const SIG_AB = ['chase', 'fast', 'ranged', 'bomb', 'tank', 'fast', 'summon', 'dash', 'dash', 'tank', 'fast', 'ranged', 'blink', 'fast', 'ranged', 'tank', 'fast', 'ranged', 'phase', 'tank', 'heal', 'tank', 'summon', 'ranged', 'blink', 'tank', 'ranged', 'dash', 'dash', 'summon', 'fast', 'phase', 'blink', 'summon', 'tank', 'tank', 'ranged', 'blink', 'tank', 'blink'];
const SIG_SHOT = { 3: 'fire', 12: 'fire', 15: 'plasma', 18: 'laser', 24: 'shell', 27: 'laser', 37: 'fire' };
const ELITE_SKILLS = ['nova', 'charge', 'summon', 'missile', 'blink', 'shield'];
function hsl(h, s, l) { return `hsl(${((h % 360) + 360) % 360},${s}%,${l}%)`; }
for (let n = 1; n <= 40; n++) {
  const h = n * 47;
  PAL['sig' + n] = { a: hsl(h, 55, 52), b: hsl(h + 40, 45, 32), c: hsl(h + 200, 70, 55), e: hsl(h + 180, 95, 60), s: hsl(h + 90, 80, 55), glow: n > 20 ? hsl(h, 90, 60) : undefined };
}
// ---------- 스테이지 처리 ----------
const BOSS_FIXED = { 5: 'b_mutant', 10: 'b_ice', 15: 'b_alien', 20: 'b_mech', 25: 'b_abyss', 30: 'b_final' };
const BOSS_SPECS = [
  // [이름, 그림, 팔레트, 크기, 패턴, 소환, 탄]
  ['폭주 좀비 대장', 'zking', null, 46, ['charge', 'summon', 'slam'], 'zombie', 'orb'], ['도로의 학살자', 'brute', 'mutant', 44, ['charge', 'slam', 'fan'], 'runner', 'acid'],
  ['변이 군견 알파', 'wolf', 'mutant', 42, ['charge', 'summon', 'jump'], 'mhound', 'orb'], ['오염 공장장', 'bloater', 'radb', 48, ['slam', 'radial', 'summon'], 'bloater', 'acid'], null,
  ['지하철 거대쥐 왕', 'rat', 'shadow', 46, ['charge', 'summon', 'fan'], 'rat', 'orb'], ['포자 여왕', 'spider', 'infSp', 48, ['summon', 'radial', 'slam'], 'ispider', 'acid'],
  ['사막의 전차 괴수', 'tankbot', 'mutant', 52, ['fan', 'charge', 'slam'], 'runner', 'shell'], ['설원의 백곰 골렘', 'golem', 'yeti', 52, ['slam', 'charge', 'fan'], 'snowwolf', 'ice'], null,
  ['용암 군주', 'golem', 'magmaG', 54, ['slam', 'radial', 'summon', 'jump'], 'magmaslime', 'fire'], ['불꽃 정령왕', 'imp', null, 46, ['radial', 'fan', 'blink', 'summon'], 'imp', 'fire'],
  ['실험체 제로', 'alien', 'shooter', 48, ['laser', 'blink', 'summon', 'radial'], 'xeno', 'plasma'], ['정거장 경비 로봇', 'robot', 'sniper', 48, ['laser', 'fan', 'charge'], 'drone', 'laser'], null,
  ['조립 공장 주기계', 'tankbot', null, 56, ['fan', 'slam', 'summon'], 'mspider', 'shell'], ['로봇 생산 핵', 'mechspider', 'bossMech', 50, ['charge', 'summon', 'radial'], 'robot', 'orb'],
  ['네온 사냥꾼', 'drone', 'darkD', 46, ['laser', 'blink', 'spiral'], 'drone', 'laser'], ['홀로그램 마왕', 'eye', 'summoner', 50, ['blink', 'laser', 'summon', 'spiral'], 'darkdrone', 'plasma'], null,
  ['방사능 거인', 'brute', 'radb', 56, ['slam', 'charge', 'radial', 'summon'], 'radzombie', 'acid'], ['벙커 사령관', 'zking', 'rad', 54, ['summon', 'charge', 'fan'], 'radrunner', 'acid'],
  ['둥지의 어미', 'xeno', 'brood', 54, ['summon', 'radial', 'charge', 'spiral'], 'xeno', 'acid'], ['함선 제어 AI', 'eye', 'sniper', 50, ['laser', 'spiral', 'summon', 'blink'], 'awarrior', 'plasma'], null,
  ['검은 행성의 파수꾼', 'golem', 'dark', 56, ['slam', 'laser', 'summon', 'charge'], 'darkmech', 'laser'], ['기계신 사도', 'robot', 'dark', 52, ['laser', 'spiral', 'summon', 'blink'], 'darkdrone', 'laser'],
  ['우주 함대 기함', 'tankbot', 'bossMech', 60, ['fan', 'laser', 'slam', 'summon'], 'manta', 'shell'], ['파멸의 집행자', 'brute', 'shadow', 56, ['charge', 'slam', 'spiral', 'summon'], 'shound', 'plasma'], null,
  ['천공의 폭군', 'manta', 'sig31', 54, ['spiral', 'blink', 'fan', 'summon'], 'manta', 'plasma'], ['심해의 거대 눈', 'eye', 'sig32', 58, ['radial', 'laser', 'summon', 'slam'], 'iceslime', 'ice'],
  ['수정 골렘 왕', 'golem', 'sig33', 58, ['slam', 'radial', 'laser', 'summon'], 'wraith', 'plasma'], ['독 정글의 포식자', 'spider', 'sig34', 56, ['charge', 'radial', 'summon', 'jump'], 'ispider', 'acid'],
  ['피라미드 수호신', 'golem', 'goldM', 58, ['laser', 'slam', 'summon', 'spiral'], 'alien', 'fire'], ['빙하 행성의 핵', 'eye', 'iceG', 58, ['radial', 'laser', 'spiral', 'summon'], 'icewisp', 'ice'],
  ['태양로 정령', 'imp', 'sig37', 54, ['radial', 'blink', 'spiral', 'slam'], 'imp', 'fire'], ['시간의 파괴자', 'eye', 'sig38', 58, ['blink', 'spiral', 'laser', 'summon', 'charge'], 'assassin', 'plasma'],
  ['기계신의 심장', 'tankbot', 'sig39', 64, ['laser', 'fan', 'slam', 'summon', 'spiral'], 'darkmech', 'shell'], ['오메가', 'eye', 'final', 82, ['laser', 'spiral', 'slam', 'summon', 'blink', 'radial', 'charge'], 'darkmech', 'laser']
];
STAGES.forEach((s, i) => {
  const n = s.n = i + 1;
  s.D = n <= 5 ? 200 : n <= 10 ? 250 : n <= 20 ? 310 : n <= 30 ? 380 : 420;
  s.bg.n = n; s.side = s.side || [];
  s.crowd = Math.min(1.9, 1 + (n - 1) * 0.026);
  s.muVar = { tr: [0, 2, -2, 3, -1][n % 5], bpm: 1 + ((n % 4) - 1.5) * 0.02 };
  s.bg.live = s.bg.live || null;
  s.special = n % 10 === 0;
  // 모든 스테이지에 고유 보스 (원래 보스가 없던 스테이지는 메인 목표를 30% 줄여 플레이 시간 유지)
  let bq = s.main.find(q => q.k === 'boss');
  if (!bq) {
    for (const q of s.main) { if (q.n && !['portal', 'device'].includes(q.k)) q.n = Math.max(1, Math.round(q.n * (q.k === 'elite' ? 0.8 : 0.7))); if (q.sec) q.sec = Math.round(q.sec * 0.7); }
    const id = BOSS_FIXED[n] || ('s' + n);
    if (!BOSSES[id]) { const b = BOSS_SPECS[n - 1]; BOSSES[id] = { name: b[0], draw: b[1], pal: b[2], r: b[3], base: 0, spd: 40 + (n % 5) * 3, dmg: 0, pats: b[4], summon: b[5], shot: b[6] }; }
    s.main.push({ k: 'boss', id });
  }
  s.boss = s.main.find(q => q.k === 'boss').id;
  const B = BOSSES[s.boss]; B.stage = n;
  B.base = Math.round((1200 + 260 * n) * (s.special ? 1.5 : 1) * (n === 40 ? 1.4 : 1));
  B.dmg = Math.round(14 + n * 0.55);
  if (s.special) { B.special = 1; if (n === 30 || n === 40) B.final = 1; }
  // 시그니처 몬스터
  const tagCount = {}; for (const [m] of s.mobs) tagCount[ET[m].tag] = (tagCount[ET[m].tag] || 0) + 1;
  const tag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0][0];
  const ab = SIG_AB[i], base = SIG_BASE[i];
  const sig = { n: SIG_NAMES[i], draw: base, pal: 'sig' + n, hp: 22, spd: 52, dmg: 9, r: 14, xp: 2, tag, sig: 1 };
  if (ab === 'fast') { sig.spd = 92; sig.hp = 14; sig.r = 12; }
  if (ab === 'tank') { sig.hp = 75; sig.spd = 34; sig.armor = .4; sig.r = 19; sig.xp = 5; }
  if (ab === 'ranged') { sig.ai = 'ranged'; sig.shot = SIG_SHOT[n] || ['acid', 'ice', 'plasma', 'fire'][n % 4]; sig.hp = 18; }
  if (ab === 'dash' || ab === 'blink' || ab === 'phase' || ab === 'summon' || ab === 'heal' || ab === 'bomb') sig.ai = ab;
  if (ab === 'summon') { sig.minion = s.mobs[0][0]; sig.hp = 55; sig.r = 17; sig.xp = 5; }
  if (ab === 'bomb') { sig.dmg = 15; sig.spd = 60; }
  if (base === 'drone' || base === 'manta' || base === 'bat' || base === 'eye' || base === 'imp') sig.fly = 1;
  ET['sig' + n] = sig; sig.id = 'sig' + n;
  s.mobs.push(['sig' + n, ab === 'tank' || ab === 'summon' ? 1.5 : 2.5]);
  s.sig = 'sig' + n; s.eliteSkill = ELITE_SKILLS[i % ELITE_SKILLS.length];
  s.wp = stageWeapons(n);
});
// 무기 해금: 해당 스테이지까지 등장한 무기
function unlockedWeapons(upto) { const set = new Set(); for (let i = 0; i < Math.min(upto, STAGES.length); i++) for (const w of STAGES[i].wp) set.add(w); return set; }
function firstStageOf(id) { const w = WMAP[id]; return w ? w.st : 99; }
