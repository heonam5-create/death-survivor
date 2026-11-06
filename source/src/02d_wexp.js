/* =====================================================================
   확장팩 신규 무기 80종 (40스테이지 × 2종)
   - 확장 발사 타입 14종 × 특수 특성 조합. (타입+특성) 조합은 기존 280종과도 겹치지 않음
   - 스테이지가 오를수록 등급·발사 수·효과 크기가 발전 (단, 등급·스테이지 배율은 기존 규칙과 동일)
   ===================================================================== */
const WTYPES_X = [
  { k: 'x_hrkt', nm: '자동 유도 로켓', ic: '🎯', c: 'blast', m: 'rocket', minS: 1, gun: 'blast', dmg: 15, n: 2, salvo: .12, cd: 1.5, spd: 360, range: 420, boom: 38, homing: 4.5, pk: 'rocket', col: '#ff7043', s: ['rocket', 1.15], d: '2연발 자동 유도 로켓' },
  { k: 'x_hmini', nm: '초고속 회전 기관총', ic: '🌀', c: 'rifle', m: 'gun', minS: 1, gun: 'minigun', dmg: 2.1, cd: .04, spd: 820, range: 280, spread: .15, spin: 1, pierce: 2, pk: 'tracer', size: .85, col: '#fff176', s: ['mini', 1.25], d: '예열 후 관통 탄막 난사' },
  { k: 'x_mgl', nm: '다연장 유탄 발사기', ic: '🎳', c: 'blast', m: 'lob', minS: 1, gun: 'blast', dmg: 10, n: 3, cd: 1.6, range: 320, flight: .5, boom: 34, pk: 'grenade', col: '#9ccc65', s: ['gl', 1.2], d: '유탄 3발 동시 투척' },
  { k: 'x_lmg', nm: '초고속 레이저 기관총', ic: '🔆', c: 'energy', m: 'laser', minS: 3, gun: 'energy', dmg: 3.3, cd: .1, spd: 1300, range: 340, pierce: 1, len: 14, col: '#ff5252', s: ['laser', 1.6], d: '쉼 없이 쏟아지는 레이저탄' },
  { k: 'x_pshot', nm: '플라즈마 산탄포', ic: '🟣', c: 'energy', m: 'gun', minS: 3, gun: 'energy', dmg: 6.5, n: 5, fanG: .15, cd: 1.0, spd: 430, range: 230, spread: .03, splash: 26, pk: 'plasma', size: 1.6, kb: 90, col: '#e040fb', s: ['plasma', 1.4], d: '부채꼴 플라즈마 5발 + 범위 피해' },
  { k: 'x_elas', nm: '관통형 에너지 레이저', ic: '📏', c: 'energy', m: 'laser', minS: 5, gun: 'energy', dmg: 12, cd: .62, spd: 1500, range: 460, pierce: 7, len: 42, col: '#18ffff', s: ['laser', .8], d: '일렬로 선 적을 모두 꿰뚫는 레이저' },
  { k: 'x_chainc', nm: '연쇄 번개 캐논', ic: '🌩️', c: 'energy', m: 'chain', minS: 5, gun: 'cannon', dmg: 24, cd: 1.45, range: 340, targets: 1, chain: 6, col: '#ffff8d', s: ['zap', .7], d: '한 줄기 번개가 6번 튕김' },
  { k: 'x_mmsl', nm: '다중 추적 미사일', ic: '🎆', c: 'blast', m: 'rocket', minS: 7, gun: 'mlrs', dmg: 7, n: 6, salvo: .045, cd: 2.0, spd: 340, range: 470, boom: 24, homing: 6.5, pk: 'missile', col: '#ffab91', s: ['missile', 1.1], d: '서로 다른 적을 쫓는 미사일 6발' },
  { k: 'x_fcan', nm: '대형 화염 캐논', ic: '☄️', c: 'special', m: 'lob', minS: 7, gun: 'cannon', dmg: 26, cd: 2.3, range: 360, flight: .42, boom: 60, field: { k: 'fire', r: 70, dur: 4, dps: 12 }, burn: 6, pk: 'fireshell', size: 1.5, col: '#ff3d00', s: ['cannon', 1.1], d: '거대한 화염탄 + 넓은 불바다' },
  { k: 'x_emrail', nm: '전자기 레일건', ic: '🧲', c: 'energy', m: 'rail', minS: 10, gun: 'cannon', dmg: 34, cd: 1.55, range: 580, w: 9, n: 2, fan: .07, charge: .12, ap: .8, col: '#82b1ff', s: ['rail', 1.25], d: '2줄 전자기 관통탄' },
  { k: 'x_bdrone', nm: '전술 폭격 드론', ic: '🛩️', c: 'special', m: 'barrage', minS: 10, gun: 'special', dmg: 16, n: 4, cd: 2.4, boom: 44, col: '#ffa726', s: ['mortar', 1.3], d: '드론이 적 무리에 폭탄 4발 투하' },
  { k: 'x_gbomb', nm: '중력 폭탄 발사기', ic: '🪐', c: 'future', m: 'lob', minS: 14, gun: 'future', dmg: 40, cd: 3.2, range: 360, flight: .7, boom: 66, grav: { r: 115, dur: 1.3, pull: 200 }, pk: 'gravball', col: '#7c4dff', s: ['hole', 1.3], d: '적을 끌어모은 뒤 폭발' },
  { k: 'x_pnova', nm: '플라즈마 충격 방출기', ic: '💥', c: 'energy', m: 'nova', minS: 14, gun: 'energy', dmg: 26, cd: 2.0, r: 150, col: '#ea80fc', s: ['plasma', .9], d: '넓은 범위 전기 충격파' },
  { k: 'x_qdisc', nm: '양자 분열 원반', ic: '💠', c: 'future', m: 'split', minS: 20, gun: 'future', dmg: 26, cd: 1.0, spd: 560, range: 400, shards: 9, shardDmg: 8, col: '#64ffda', s: ['quantum', 1.2], d: '명중 시 파편 9개로 분열' }
];
function genWeaponsX(all) {
  let seed = 20261107; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const used = new Set(all.map(w => (w.type || w.id) + '|' + (w.tr || []).slice().sort().join('+')));
  const typeUse = {}, traitUse = {}, out = [];
  for (let s = 1; s <= 40; s++) {
    const tiers = [2, s % 5 === 0 ? 3 : 2];
    const usedT = new Set();
    tiers.forEach((t, slot) => {
      let pool = WTYPES_X.filter(ty => ty.minS <= s && !usedT.has(ty.k));
      // 스테이지가 오를수록 최신 타입 우선
      pool.sort((a, b) => ((typeUse[a.k] || 0) - (typeUse[b.k] || 0)) * 1.2 - (a.minS - b.minS) * 0.04 + (rnd() - .5) * 1.4);
      let made = null;
      for (const ty of pool) {
        const trs = WTRAITS.filter(tr => traitOk(tr, ty)).sort((a, b) => (traitUse[a.k] || 0) - (traitUse[b.k] || 0) + (rnd() - .5) * 2);
        const nt = t >= 3 || s >= 25 ? 2 : 1;
        for (let i = 0; i < trs.length && !made; i++) {
          const pk = [trs[i]];
          if (nt === 2) { const sec = trs.find(x => x !== trs[i] && !((x.k === 'rapid' && trs[i].k === 'heavy') || (x.k === 'heavy' && trs[i].k === 'rapid'))); if (!sec) continue; pk.push(sec); }
          const combo = ty.k + '|' + pk.map(x => x.k).sort().join('+');
          if (used.has(combo)) continue;
          used.add(combo); made = { ty, tr: pk };
        }
        if (made) break;
      }
      usedT.add(made.ty.k); typeUse[made.ty.k] = (typeUse[made.ty.k] || 0) + 1; for (const x of made.tr) traitUse[x.k] = (traitUse[x.k] || 0) + 1;
      const w = buildWeapon(made.ty, made.tr, t, s, 900 + out.length);
      w.id = 'x' + s + '_' + slot + '_' + made.ty.k.slice(2); w.type = made.ty.k; w.xp = 1;
      w.nm = (t === 3 ? '전설의 ' : '') + made.tr.map(x => x.adj).join('·') + ' ' + made.ty.nm + ' EX-' + (s * 10 + slot + 1);
      // 스테이지 진행에 따라 외형·효과 발전 (발사체 크기·폭발 범위 소폭 확대)
      const g = Math.floor((s - 1) / 10); w.size = (w.size || 1) * (1 + g * 0.08); if (w.boom) w.boom *= 1 + g * 0.06;
      out.push(w);
    });
  }
  return out;
}
