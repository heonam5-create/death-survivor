/* =====================================================================
   무기 280종 설계
   - 기존 50종 + 신규 230종 = 280종, 40스테이지 × 7종
   - 신규 무기 = [발사 타입 49종] × [특수 특성 23종] 조합.
     같은 (타입+특성) 조합은 단 하나만 존재하도록 생성 시 검증합니다.
   ===================================================================== */
// 기존 50종의 등장 스테이지
const OLD_ST = { rifle: 1, smg: 1, gl: 1, tactical: 2, lmg: 2, laser: 2, hmg: 3, rocket: 3, prifle: 3, flamer: 4, freezer: 4, prifle2: 4, minigun: 5, mlrs: 5, cannon: 5, emp: 6, mines: 6, gas: 7, acid: 7, droneg: 7, mortar: 8, twinmg: 8, exrifle: 8, tazer: 9, slaser: 9, agl: 10, homing: 10, cluster: 11, flamecannon: 11, lrifle: 12, turret: 12, chaincannon: 13, spinlaser: 13, plaser: 14, pcannon: 14, railcannon: 15, gatling: 16, quantum: 16, doomlaser: 17, ion: 17, accel: 18, gravcannon: 19, blackhole: 19, orbital: 20, fusion: 20, storm: 21, dimlaser: 22, thunder: 23, gcollapse: 24, doomcannon: 26 };
// 발사 타입 49종 (m: 발사 엔진, minS: 등장 시작 스테이지, gun: 손에 든 총 모양)
const WTYPES = [
  // 소총·기관총
  { k: 'mg', nm: '기관총', ic: '🔫', c: 'rifle', m: 'gun', minS: 1, gun: 'rifle', dmg: 6, cd: .22, spd: 720, range: 320, spread: .07, pk: 'tracer', col: '#ffd54f', s: ['rifle', 1], d: '빠른 연사의 표준 기관총' },
  { k: 'mini', nm: '미니건', ic: '🌪️', c: 'rifle', m: 'gun', minS: 8, gun: 'minigun', dmg: 2.6, cd: .055, spd: 700, range: 260, spread: .18, spin: 1, pk: 'bullet', size: .8, col: '#fff59d', s: ['mini', 1.05], d: '예열 후 초고속 탄막' },
  { k: 'shot', nm: '산탄총', ic: '💨', c: 'rifle', m: 'gun', minS: 1, gun: 'smg', dmg: 4.2, n: 6, fanG: .11, cd: .85, spd: 620, range: 190, spread: .04, kb: 120, pk: 'bullet', col: '#ffcc80', s: ['hmg', 1.25], d: '근거리 부채꼴 산탄 6발' },
  { k: 'snip', nm: '저격소총', ic: '🎯', c: 'rifle', m: 'gun', minS: 8, gun: 'prifle', dmg: 34, cd: 1.5, spd: 1500, range: 560, spread: 0, pierce: 3, ap: .6, critB: .2, pk: 'slug', size: 1.3, col: '#e1f5fe', s: ['rail', 1.7], d: '먼 적을 꿰뚫는 한 방' },
  { k: 'ar', nm: '돌격소총', ic: '🔫', c: 'rifle', m: 'gun', minS: 1, gun: 'tactical', dmg: 6.5, cd: .7, burst: 3, gap: .08, spd: 800, range: 360, spread: .02, pk: 'tracer', col: '#80deea', s: ['rifle', 1.2], d: '정확한 3점사' },
  { k: 'smg', nm: '기관단총', ic: '🔫', c: 'rifle', m: 'gun', minS: 1, gun: 'smg', dmg: 4.5, cd: .14, spd: 640, range: 220, spread: .16, pk: 'bullet', col: '#ffe082', s: ['smg', 1.15], d: '짧고 빠른 연사' },
  { k: 'hcan', nm: '중기관포', ic: '🪖', c: 'rifle', m: 'gun', minS: 4, gun: 'hmg', dmg: 11, cd: .32, spd: 760, range: 360, spread: .06, ap: .4, pk: 'slug', size: 1.5, col: '#ffb300', s: ['hmg', .8], d: '장갑을 뚫는 대구경 탄' },
  { k: 'needle', nm: '니들건', ic: '📌', c: 'rifle', m: 'gun', minS: 4, gun: 'smg', dmg: 3, n: 3, fanG: .05, cd: .2, spd: 1100, range: 300, spread: .02, pierce: 3, pk: 'needle', col: '#b2ff59', s: ['laser', 1.9], d: '관통 바늘 3연발' },
  { k: 'twin', nm: '쌍열 기관총', ic: '↔️', c: 'rifle', m: 'gun', minS: 1, gun: 'twinmg', dmg: 5.5, cd: .2, spd: 700, range: 290, spread: .08, twin: 1, pk: 'bullet', col: '#ffab40', s: ['smg', .9], d: '앞뒤 동시 사격' },
  { k: 'flak', nm: '플레셰트포', ic: '🎇', c: 'rifle', m: 'flak', minS: 8, gun: 'hmg', dmg: 9, shards: 6, shardDmg: 4.5, cd: 1.1, spd: 520, range: 300, pk: 'slug', size: 1.3, col: '#ffd180', s: ['hmg', 1.05], d: '목표 지점에서 파편탄이 터짐' },
  // 대포·폭발
  { k: 'rkt', nm: '로켓포', ic: '🚀', c: 'blast', m: 'rocket', minS: 1, gun: 'blast', dmg: 26, cd: 1.4, spd: 360, range: 380, boom: 50, pk: 'rocket', col: '#ff5722', s: ['rocket', 1], d: '명중 시 큰 폭발' },
  { k: 'msl', nm: '다연장 미사일', ic: '🎆', c: 'blast', m: 'rocket', minS: 4, gun: 'mlrs', dmg: 10, n: 4, salvo: .09, cd: 2.0, spd: 330, range: 400, boom: 32, homing: 3, pk: 'missile', col: '#ff8a65', s: ['missile', 1], d: '소형 유도 미사일 4발' },
  { k: 'gl', nm: '유탄발사기', ic: '🧨', c: 'blast', m: 'lob', minS: 1, gun: 'blast', dmg: 17, cd: 1.1, range: 300, flight: .55, boom: 44, pk: 'grenade', col: '#8bc34a', s: ['gl', 1], d: '포물선 유탄' },
  { k: 'mortar', nm: '박격포', ic: '🎇', c: 'blast', m: 'lob', minS: 4, gun: 'blast', dmg: 25, cd: 2.1, range: 480, flight: 1.0, boom: 58, far: 1, pk: 'shell', col: '#795548', s: ['mortar', 1], d: '먼 적 무리에 포탄 낙하' },
  { k: 'cannon', nm: '캐논포', ic: '🔵', c: 'blast', m: 'cannon', minS: 8, gun: 'cannon', dmg: 40, cd: 1.8, spd: 420, range: 400, pierce: 3, size: 11, boom: 40, ap: .6, kb: 260, col: '#455a64', s: ['cannon', 1], d: '관통 후 폭발하는 포탄' },
  { k: 'howit', nm: '곡사포', ic: '💣', c: 'blast', m: 'lob', minS: 13, gun: 'cannon', dmg: 40, cd: 2.8, range: 520, flight: 1.3, boom: 80, far: 1, pk: 'shell', size: 1.5, col: '#6d4c41', s: ['cannon', .8], d: '느리지만 거대한 폭발' },
  { k: 'clus', nm: '확산탄포', ic: '🌟', c: 'blast', m: 'lob', minS: 8, gun: 'blast', dmg: 18, cd: 2.2, range: 340, flight: .7, boom: 38, cluster: 6, pk: 'shell', col: '#ffca28', s: ['mortar', 1.2], d: '자탄 6개 확산' },
  { k: 'atg', nm: '대전차포', ic: '🛡️', c: 'blast', m: 'cannon', minS: 13, gun: 'cannon', dmg: 55, cd: 2.2, spd: 700, range: 460, pierce: 6, size: 7, boom: 0, ap: 1, kb: 200, col: '#90a4ae', s: ['cannon', 1.4], d: '장갑을 무시하는 고속 철갑탄' },
  { k: 'barr', nm: '포격 지원기', ic: '📡', c: 'blast', m: 'barrage', minS: 13, gun: 'special', dmg: 20, n: 5, cd: 3.0, boom: 40, col: '#ff7043', s: ['mortar', .9], d: '주변 적에게 포탄 5발 요청' },
  // 레이저·에너지
  { k: 'lasc', nm: '레이저포', ic: '🔴', c: 'energy', m: 'laser', minS: 1, gun: 'energy', dmg: 8.5, cd: .36, spd: 1100, range: 360, pierce: 2, len: 22, col: '#ff1744', s: ['laser', 1], d: '빠른 관통 레이저탄' },
  { k: 'lbeam', nm: '레이저 소총', ic: '📏', c: 'energy', m: 'beam', minS: 8, gun: 'energy', dps: 38, cd: 1.8, dur: 1.4, len: 280, w: 8, col: '#ff4081', s: ['beam', 1], d: '적을 따라가는 지속 광선' },
  { k: 'plas', nm: '플라즈마포', ic: '🟢', c: 'energy', m: 'plasma', minS: 4, gun: 'energy', dmg: 17, cd: .9, spd: 280, range: 340, size: 8, boom: 34, col: '#00e676', s: ['plasma', 1], d: '관통하는 에너지 구체 + 충격파' },
  { k: 'emc', nm: '전자기포', ic: '🧲', c: 'energy', m: 'rail', minS: 4, gun: 'energy', dmg: 26, cd: 1.1, range: 520, w: 7, charge: 0, col: '#18ffff', s: ['laser', .6], d: '순간 관통 전자기탄' },
  { k: 'rail', nm: '레일건', ic: '⚡', c: 'energy', m: 'rail', minS: 13, gun: 'cannon', dmg: 60, cd: 1.9, range: 620, w: 12, charge: .25, ap: 1, col: '#40c4ff', s: ['rail', 1], d: '충전 후 화면 끝까지 관통' },
  { k: 'part', nm: '입자포', ic: '☢️', c: 'energy', m: 'rail', minS: 13, gun: 'future', dmg: 40, cd: 1.6, range: 480, w: 22, charge: .35, col: '#ffea00', s: ['rail', .8], d: '굵은 입자 광선' },
  { k: 'shk', nm: '전기 충격포', ic: '🌩️', c: 'energy', m: 'chain', minS: 4, gun: 'energy', dmg: 18, cd: 1.5, range: 320, targets: 2, chain: 3, col: '#b3e5fc', s: ['zap', .95], d: '적 사이를 튕기는 번개' },
  { k: 'tesla', nm: '테슬라 코일', ic: '🔌', c: 'energy', m: 'tazer', minS: 1, gun: 'special', dmg: 7, cd: .38, range: 120, targets: 3, col: '#ffff00', s: ['zap', 1.6], d: '주변 적 자동 감전' },
  { k: 'spinl', nm: '회전 레이저', ic: '🎡', c: 'energy', m: 'spin', minS: 8, gun: 'energy', dps: 26, n: 2, len: 135, rot: 2.2, w: 7, col: '#ea80fc', s: ['beam', 1.5], d: '주변을 도는 레이저' },
  { k: 'pulse', nm: '펄스포', ic: '💫', c: 'energy', m: 'nova', minS: 8, gun: 'energy', dmg: 22, cd: 2.4, r: 130, col: '#80d8ff', s: ['plasma', 1.6], d: '주변으로 퍼지는 충격파' },
  { k: 'disc', nm: '광자 원반', ic: '🥏', c: 'energy', m: 'boomer', minS: 4, gun: 'energy', dmg: 14, cd: 1.3, spd: 420, range: 260, size: 1, col: '#84ffff', s: ['laser', 1.3], d: '날아갔다 되돌아오는 원반' },
  { k: 'wave', nm: '파동포', ic: '〰️', c: 'energy', m: 'wave', minS: 4, gun: 'energy', dmg: 12, cd: .7, spd: 380, range: 340, amp: 28, freq: 10, pierce: 3, col: '#69f0ae', s: ['plasma', 1.3], d: '물결치며 나아가는 관통탄' },
  // 특수 화기
  { k: 'flame', nm: '화염방사기', ic: '🔥', c: 'special', m: 'cone', minS: 1, gun: 'flamer', dps: 32, range: 100, arc: .55, burn: 6, col: '#ff6d00', s: ['flame', 1], d: '근거리 부채꼴 화염' },
  { k: 'cryo', nm: '냉동포', ic: '❄️', c: 'special', m: 'cone', minS: 1, gun: 'freezer', dps: 15, range: 95, arc: .6, slow: .6, freeze: 1, col: '#80d8ff', s: ['freeze', 1], d: '적을 얼리는 냉기 분사' },
  { k: 'acid', nm: '산성포', ic: '🧪', c: 'special', m: 'gun', minS: 4, gun: 'special', dmg: 9, cd: .85, spd: 420, range: 300, spread: .05, splash: 30, field: { k: 'acid', r: 34, dur: 3, dps: 8 }, shred: 1, pk: 'acid', size: 1.6, col: '#c6ff00', s: ['acid', 1], d: '산성 웅덩이 + 장갑 부식' },
  { k: 'gas', nm: '독가스포', ic: '☣️', c: 'special', m: 'lob', minS: 4, gun: 'gas', dmg: 6, cd: 2.4, range: 300, flight: .6, boom: 0, field: { k: 'gas', r: 64, dur: 4, dps: 11 }, pk: 'canister', col: '#76ff03', s: ['gas', 1], d: '지속 독구름' },
  { k: 'drone', nm: '전투 드론', ic: '🛸', c: 'special', m: 'drone', minS: 1, gun: 'special', dmg: 4, cd: .26, n: 1, range: 270, col: '#b0bec5', s: ['drone', 1], d: '따라다니며 자동 사격' },
  { k: 'turr', nm: '자동 포탑', ic: '🗼', c: 'special', m: 'turret', minS: 4, gun: 'special', dmg: 6.5, cd: 6, fire: .24, life: 9, n: 1, range: 240, col: '#90a4ae', s: ['turret', 1], d: '설치형 자동 포탑' },
  { k: 'mine', nm: '지뢰 살포기', ic: '💣', c: 'special', m: 'mine', minS: 1, gun: 'special', dmg: 30, cd: 2.0, n: 3, boom: 46, col: '#ff5252', s: ['mine', 1], d: '접근한 적을 폭파' },
  { k: 'saw', nm: '톱날 디스크', ic: '⚙️', c: 'special', m: 'saw', minS: 8, gun: 'special', dmg: 9, n: 2, r: 72, rot: 3, col: '#cfd8dc', s: ['drone', .6], d: '주변을 도는 톱날' },
  { k: 'harp', nm: '작살포', ic: '🔱', c: 'special', m: 'harpoon', minS: 8, gun: 'cannon', dmg: 22, cd: 1.6, spd: 620, range: 320, col: '#a1887f', s: ['rail', 2.2], d: '적을 끌어당겨 기절시킴' },
  { k: 'incd', nm: '소이탄포', ic: '☄️', c: 'special', m: 'lob', minS: 8, gun: 'blast', dmg: 16, cd: 2.0, range: 340, flight: .6, boom: 40, field: { k: 'fire', r: 50, dur: 3, dps: 10 }, burn: 5, pk: 'fireshell', col: '#ff3d00', s: ['cannon', 1.3], d: '착탄 지점 불바다' },
  // 미래형
  { k: 'orb', nm: '궤도 포격기', ic: '🛰️', c: 'future', m: 'orbital', minS: 18, gun: 'special', dmg: 80, cd: 4.0, boom: 76, col: '#ff1744', s: ['orbital', 1], d: '위성 정밀 폭격' },
  { k: 'ionc', nm: '이온포', ic: '🔦', c: 'future', m: 'ion', minS: 18, gun: 'future', dps: 65, cd: 3.0, dur: 1.6, r: 40, col: '#84ffff', s: ['ion', 1], d: '하늘에서 추적 광선' },
  { k: 'gravc', nm: '중력포', ic: '🌌', c: 'future', m: 'hole', minS: 18, gun: 'future', dps: 24, cd: 5.5, dur: 3, r: 135, pull: 140, col: '#651fff', s: ['hole', 1], d: '적을 빨아들이는 중력장' },
  { k: 'splc', nm: '분열포', ic: '💠', c: 'future', m: 'split', minS: 13, gun: 'future', dmg: 34, cd: 1.15, spd: 520, range: 380, shards: 7, shardDmg: 10, col: '#00e5ff', s: ['quantum', 1], d: '명중 시 파편 분열' },
  { k: 'anti', nm: '반물질포', ic: '⚫', c: 'future', m: 'cannon', minS: 18, gun: 'cannon', dmg: 90, cd: 3.6, spd: 320, range: 460, pierce: 99, size: 16, boom: 100, ap: 1, kb: 300, col: '#311b92', s: ['doom', 1.2], d: '모든 것을 관통하는 반물질 탄' },
  { k: 'dimc', nm: '차원포', ic: '✴️', c: 'future', m: 'rail', minS: 18, gun: 'future', dmg: 44, cd: 2.2, range: 600, w: 12, n: 3, fan: .18, charge: .2, ap: 1, col: '#e040fb', s: ['rail', 1.3], d: '3줄 차원 광선' },
  { k: 'storm', nm: '번개 폭풍포', ic: '⛈️', c: 'future', m: 'chain', minS: 13, gun: 'future', dmg: 20, cd: 1.7, range: 360, targets: 4, chain: 4, col: '#e1f5fe', s: ['zap', .75], d: '번개 4줄 연쇄' },
  { k: 'swarm', nm: '마이크로 미사일', ic: '🐝', c: 'future', m: 'rocket', minS: 13, gun: 'mlrs', dmg: 6, n: 8, salvo: .05, cd: 2.2, spd: 340, range: 460, boom: 22, homing: 7, sky: 1, pk: 'missile', col: '#fff176', s: ['missile', .8], d: '하늘에서 유도탄 8발' }
];
// 특수 특성 23종 (cost: 피해량 보정, only/not: 어울리는 발사 방식)
const PROJ_MODES = ['gun', 'laser', 'wave', 'boomer', 'harpoon', 'flak', 'plasma', 'split'];
const AREA_MODES = ['lob', 'rocket', 'cannon', 'plasma', 'nova', 'cone', 'beam', 'rail', 'orbital', 'ion', 'hole', 'mine', 'barrage'];
const WTRAITS = [
  { k: 'burn', adj: '화염', col: '#ff7043', cost: .88, d: '명중 시 화상(지속 피해)' },
  { k: 'freeze', adj: '빙결', col: '#80d8ff', cost: .86, d: '둔화 + 누적 시 빙결' },
  { k: 'poison', adj: '맹독', col: '#76ff03', cost: .88, d: '중독(지속 피해)' },
  { k: 'shock', adj: '전격', col: '#ffee58', cost: .87, not: ['chain', 'tazer'], d: '명중 시 주변 적에게 번개 전이' },
  { k: 'blast', adj: '폭렬', col: '#ff9100', cost: .8, only: ['gun', 'laser', 'wave', 'boomer', 'saw', 'harpoon', 'flak', 'drone', 'turret'], d: '명중 지점 소폭발' },
  { k: 'split', adj: '분열', col: '#00e5ff', cost: .84, only: ['gun', 'laser', 'wave', 'harpoon'], d: '명중 시 파편 3개로 분열' },
  { k: 'ric', adj: '도탄', col: '#eeeeee', cost: .9, only: ['gun', 'laser'], d: '탄이 다음 적에게 튕김' },
  { k: 'pierce', adj: '관통', col: '#b2ebf2', cost: .92, only: ['gun', 'laser', 'wave', 'cannon', 'boomer', 'needle'], d: '관통 +2' },
  { k: 'knock', adj: '충격', col: '#ffffff', cost: .92, d: '강한 넉백 + 경직' },
  { k: 'stun', adj: '마비', col: '#fff59d', cost: .86, d: '일정 확률 기절' },
  { k: 'shred', adj: '부식', col: '#c6ff00', cost: .9, d: '장갑 무력화' },
  { k: 'mark', adj: '표적', col: '#ff4081', cost: .9, d: '맞은 적이 받는 피해 +25%' },
  { k: 'vortex', adj: '중력', col: '#b388ff', cost: .85, not: ['hole'], d: '명중 지점에 작은 중력장' },
  { k: 'crit', adj: '정밀', col: '#fffde7', cost: .9, d: '치명타 확률 +18%' },
  { k: 'exec', adj: '처형', col: '#d50000', cost: .9, d: '체력 30% 이하 적에게 2배 피해' },
  { k: 'leech', adj: '흡혈', col: '#ff5252', cost: .9, d: '처치 시 체력 회복' },
  { k: 'nova', adj: '파쇄', col: '#ffab40', cost: .88, d: '처치 시 주변 충격파' },
  { k: 'homing', adj: '유도', col: '#ea80fc', cost: .9, only: ['gun', 'laser', 'wave', 'plasma', 'split'], d: '탄이 적을 추적' },
  { k: 'rapid', adj: '속사', cost: 1, not: ['cone', 'spin', 'saw'], d: '연사 +33%, 1발 피해 -25%' },
  { k: 'heavy', adj: '중장', cost: 1, not: ['cone', 'spin', 'saw', 'drone'], d: '1발 피해 +45%, 연사 -30%, 넉백 증가' },
  { k: 'wide', adj: '광역', cost: .9, only: AREA_MODES, d: '범위 +35%' },
  { k: 'multi', adj: '다연장', cost: .8, only: ['gun', 'laser', 'rocket', 'lob', 'drone', 'turret', 'orbital', 'barrage', 'saw', 'boomer', 'wave', 'harpoon'], d: '발사 수 +1' },
  { k: 'long', adj: '장거리', cost: .95, only: ['gun', 'laser', 'rocket', 'cannon', 'rail', 'plasma', 'split', 'beam', 'wave', 'boomer', 'harpoon', 'chain', 'flak'], d: '사거리 +40%' }
];
const TRAIT_MAP = {}; WTRAITS.forEach(t => TRAIT_MAP[t.k] = t);
function traitOk(tr, ty) {
  if (tr.only && !(tr.only.includes(ty.m) || (tr.k === 'pierce' && ty.k === 'needle'))) return false;
  if (tr.not && tr.not.includes(ty.m)) return false;
  if (tr.k === 'pierce' && ty.pierce >= 99) return false;
  if (tr.k === 'burn' && (ty.burn || ty.k === 'flame' || ty.k === 'incd')) return false;
  if (tr.k === 'freeze' && ty.k === 'cryo') return false;
  if (tr.k === 'poison' && ty.k === 'gas') return false;
  if (tr.k === 'shred' && ty.k === 'acid') return false;
  if (tr.k === 'homing' && ty.homing) return false;
  return true;
}
const TIER_MUL = [1, 1, 1.22, 1.5, 1.8];
const stagePow = s => 1 + 0.03 * (s - 1);
const CODES = 'ABCDEFGHJKLMNPRSTVXZ';
function genWeapons(old) {
  let seed = 20261106; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const usedCombo = new Set(), typeUse = {}, traitUse = {};
  const out = [];
  for (let s = 1; s <= 40; s++) {
    const olds = old.filter(w => OLD_ST[w.id] === s);
    const want = [1, 1, 1, 1, 2, 2, s % 10 === 0 ? 4 : 3];
    for (const w of olds) { const i = want.indexOf(w.t); if (i >= 0) want.splice(i, 1); else want.splice(want.length - 1, 1); }
    const usedModes = new Set(olds.map(w => w.m));
    const usedTypes = new Set();
    for (let slot = 0; slot < want.length; slot++) {
      const t = want[slot];
      let pool = WTYPES.filter(ty => ty.minS <= s && !usedTypes.has(ty.k));
      if (t >= 3) { const strong = pool.filter(ty => ty.minS >= 8 || ty.c === 'future' || ty.c === 'blast'); if (strong.length) pool = strong; }
      if (t === 4) { const fut = pool.filter(ty => ty.c === 'future'); if (fut.length) pool = fut; }
      // 같은 스테이지 안에서 같은 발사 방식이 겹치지 않도록 우선
      const fresh = pool.filter(ty => !usedModes.has(ty.m)); if (fresh.length >= 2) pool = fresh;
      pool.sort((a, b) => (typeUse[a.k] || 0) - (typeUse[b.k] || 0) + (rnd() - 0.5) * 1.5);
      let made = null;
      for (const ty of pool) {
        const nt = t >= 3 ? 2 : 1;
        const trs = WTRAITS.filter(tr => traitOk(tr, ty)).sort((a, b) => (traitUse[a.k] || 0) - (traitUse[b.k] || 0) + (rnd() - 0.5) * 2);
        for (let i = 0; i < trs.length && !made; i++) {
          const pick = [trs[i]];
          if (nt === 2) { const second = trs.find(x => x !== trs[i] && !(x.k === 'rapid' && trs[i].k === 'heavy') && !(x.k === 'heavy' && trs[i].k === 'rapid')); if (!second) continue; pick.push(second); }
          const combo = ty.k + '|' + pick.map(x => x.k).sort().join('+');
          if (usedCombo.has(combo)) continue;
          usedCombo.add(combo); made = { ty, tr: pick };
        }
        if (made) break;
      }
      if (!made) throw new Error('무기 조합 부족: 스테이지 ' + s);
      usedTypes.add(made.ty.k); usedModes.add(made.ty.m);
      typeUse[made.ty.k] = (typeUse[made.ty.k] || 0) + 1; for (const x of made.tr) traitUse[x.k] = (traitUse[x.k] || 0) + 1;
      out.push(buildWeapon(made.ty, made.tr, t, s, out.length));
    }
  }
  return out;
}
function buildWeapon(ty, trs, t, s, idx) {
  const w = JSON.parse(JSON.stringify(ty)); delete w.k; delete w.minS;
  w.id = 'w' + s + '_' + ty.k + '_' + trs.map(x => x.k).join('_');
  w.t = t; w.st = s; w.type = ty.k; w.tr = trs.map(x => x.k);
  const code = CODES[(s * 7 + idx) % CODES.length] + '-' + (s * 10 + (idx % 7) + 1);
  const adj = trs.map(x => x.adj).join('·');
  w.nm = (t === 4 ? '신화급 ' : t === 3 ? '전설의 ' : '') + adj + ' ' + ty.nm + (t <= 2 ? ' ' + code : '');
  w.d = ty.d + ' / ' + trs.map(x => x.d).join(' / ');
  // 수치: 등급 × 스테이지 × 특성 보정
  let mul = TIER_MUL[t] * stagePow(s); for (const x of trs) mul *= x.cost;
  const tset = new Set(w.tr);
  if (tset.has('rapid')) { if (w.cd) w.cd *= 0.75; if (w.fire) w.fire *= 0.75; mul *= 0.75; }
  if (tset.has('heavy')) { if (w.cd) w.cd *= 1.3; if (w.fire) w.fire *= 1.3; mul *= 1.45; w.kb = (w.kb || 60) * 1.8; w.size = (w.size || 1) * 1.25; }
  if (tset.has('wide')) { for (const f of ['boom', 'r', 'w', 'arc']) if (w[f]) w[f] *= 1.35; if (w.field) w.field.r *= 1.35; if (w.m === 'cone') w.range *= 1.15; }
  if (tset.has('multi')) w.n = (w.n || 1) + 1;
  if (tset.has('long')) { if (w.range) w.range *= 1.4; if (w.len) w.len *= 1.3; }
  if (tset.has('pierce')) w.pierce = (w.pierce || 1) + 2;
  if (tset.has('crit')) w.critB = (w.critB || 0) + 0.18;
  for (const f of ['dmg', 'dps', 'shardDmg']) if (w[f]) w[f] = Math.round(w[f] * mul * 100) / 100;
  if (w.field) w.field.dps = Math.round(w.field.dps * mul * 100) / 100;
  const tc = trs.find(x => x.col); if (tc) { w.col2 = tc.col; if (!['cone'].includes(w.m)) w.col = tc.col; }
  if (t >= 3) w.size = (w.size || 1) * 1.15;
  return w;
}
