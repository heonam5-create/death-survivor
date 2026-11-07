/* =========================================================================
   v9: 터렛 시스템
   - 드랍(정예·보물상자·주기적 보급)으로 터렛 아이템 획득, 슬롯 최대 2칸
   - 슬롯 버튼을 끌어서 원하는 위치에 놓아 설치 (짧게 누르면 내 앞에 설치)
   - 동시에 최대 2개 유지: 3번째를 설치하면 가장 오래된 터렛을 회수(교체)
   - 지속시간 · 내구도 · 설치 쿨타임 · 설치 거리 제한으로 밸런스
   - 스테이지 테마별 4종 조합 (짝수 스테이지는 1종이 바뀜)
   ========================================================================= */
const TURRETS = {
  mg:      { n: '기관총 터렛', ic: '🔫', col: '#90caf9', range: 250, cd: 0.16, dmg: 7,  d: '빠른 연사 · 단일 공격' },
  elec:    { n: '전기 터렛',   ic: '⚡', col: '#80d8ff', range: 215, cd: 1.0,  dmg: 22, d: '연쇄 번개 4체 · 감속' },
  cannon:  { n: '포탄 터렛',   ic: '💣', col: '#ffb74d', range: 310, cd: 1.7,  dmg: 50, d: '폭발 포탄 · 범위 피해' },
  flame:   { n: '화염 터렛',   ic: '🔥', col: '#ff7043', range: 150, cd: 0.14, dmg: 5,  d: '근거리 화염 방사 · 화상' },
  ice:     { n: '빙결 터렛',   ic: '❄️', col: '#b3e5fc', range: 205, cd: 1.6,  dmg: 22, d: '냉기 폭발 · 감속/빙결' },
  laser:   { n: '레이저 터렛', ic: '🔆', col: '#ff80ab', range: 330, cd: 1.15, dmg: 34, d: '관통 레이저' },
  missile: { n: '미사일 터렛', ic: '🚀', col: '#ff8a65', range: 380, cd: 2.5,  dmg: 24, d: '유도 미사일 4발' },
  poison:  { n: '독가스 터렛', ic: '☣️', col: '#aed581', range: 220, cd: 2.6,  dmg: 8,  d: '독구름 · 지속 피해' },
  mortar:  { n: '박격포 터렛', ic: '🎯', col: '#bcaaa4', range: 430, cd: 2.3,  dmg: 46, d: '장거리 곡사 · 범위 피해' }
};
const TUR_POOL = {
  city: ['mg', 'cannon', 'elec', 'flame'], military: ['mg', 'missile', 'elec', 'cannon'], factory: ['flame', 'poison', 'mg', 'cannon'],
  subway: ['mg', 'elec', 'flame', 'mortar'], forest: ['poison', 'mg', 'flame', 'mortar'], ice: ['elec', 'ice', 'mg', 'cannon'],
  volcano: ['flame', 'cannon', 'mg', 'laser'], waste: ['poison', 'mortar', 'mg', 'elec'], lab: ['laser', 'elec', 'poison', 'ice'],
  hive: ['flame', 'poison', 'mg', 'missile'], techno: ['laser', 'missile', 'elec', 'mg'], cyber: ['laser', 'elec', 'missile', 'ice'],
  alien: ['laser', 'poison', 'elec', 'cannon'], space: ['laser', 'missile', 'ice', 'elec'], rift: ['laser', 'ice', 'flame', 'mortar'],
  doom: ['flame', 'cannon', 'missile', 'laser'], epic: ['missile', 'laser', 'cannon', 'elec'], final: ['laser', 'missile', 'flame', 'ice']
};
const TUR_ALT = { city: 'mortar', military: 'mortar', factory: 'elec', subway: 'cannon', forest: 'ice', ice: 'mortar', volcano: 'missile', waste: 'flame',
  lab: 'mg', hive: 'cannon', techno: 'cannon', cyber: 'mg', alien: 'missile', space: 'cannon', rift: 'elec', doom: 'mortar', epic: 'ice', final: 'cannon' };
const TUR_MAX = 2, TUR_DUR = 38, TUR_PLACE_CD = 4, TUR_MAX_DIST = 280;
let pturrets = [];
function turPool(n) {
  const st = STAGES[(n || G.stage) - 1]; const mu = (st && st.mu) || 'city';
  const p = (TUR_POOL[mu] || TUR_POOL.city).slice();
  if ((n || G.stage) % 2 === 0) p[3] = TUR_ALT[mu] || p[3];   // 같은 테마라도 스테이지마다 조합이 조금씩 달라짐
  return p;
}
function turDmg(T) { return T.dmg * (1 + G.stage * 0.11) * (0.55 + 0.45 * P.dmgMul); }
function turStageStart() {
  pturrets = []; G.tInv = []; G.turT = 45; G.tPlaceCd = 0; G.tFullMsg = 0; G.tDrag = null;
  updTurBtns(true);
}
function turDropAt(x, y, id) { dropPickup('tdrop', x, y, 0, id || pick(turPool())); }
function turPick(p) {
  if (G.tInv.length >= TUR_MAX) return false;
  G.tInv.push(p.item); AU.sfx('power');
  const T = TURRETS[p.item]; toast(`${T.ic} ${T.n} 획득!<br><span style="font-size:13px">오른쪽 터렛 버튼을 끌어서 원하는 곳에 설치</span>`, 1.8, T.col);
  updTurBtns(true); return true;
}
// 설치 위치 검사: 너무 멀거나 다른 터렛·목표물·차량과 겹치면 불가
function turValid(x, y) {
  if (Math.hypot(x - P.x, y - P.y) > TUR_MAX_DIST) return false;
  for (const t of pturrets) if (Math.hypot(t.x - x, t.y - y) < 64) return false;
  for (const e of enemies) if (!e.dead && (e.static || e.boss) && Math.hypot(e.x - x, e.y - y) < e.r + 30) return false;
  for (const g of gens) if (Math.hypot(g.x - x, g.y - y) < g.r + 30) return false;
  for (const v of vehs) if (!v.dead && Math.hypot(v.x - x, v.y - y) < v.ch.r + 30) return false;
  return true;
}
function turPlace(slot, x, y) {
  const id = G.tInv[slot]; if (!id || G.state !== 'play') return false;
  if (G.tPlaceCd > 0) { toast(`⏳ 터렛 설치 대기 ${Math.ceil(G.tPlaceCd)}초`, .9); return false; }
  if (!turValid(x, y)) { toast('🚫 여기에는 설치할 수 없어요 (너무 멀거나 겹침)', 1); return false; }
  if (pturrets.length >= TUR_MAX) { const old = pturrets.shift(); effects.push({ type: 'poof', x: old.x, y: old.y, r: 24, t: 0, dur: .35 }); toast(`♻️ 가장 오래된 ${TURRETS[old.id].n}을(를) 회수하고 교체`, 1.2); }
  const T = TURRETS[id], hp = Math.round((240 + G.stage * 30) * (1 + 0.04 * effUp('hp')));
  pturrets.push({ id, x, y, hp, maxHp: hp, t: TUR_DUR, cd: 0.4, ang: -Math.PI / 2, hitT: 0, fx: 0 });
  G.tInv.splice(slot, 1); G.tPlaceCd = TUR_PLACE_CD;
  effects.push({ type: 'nova', x, y, r: 46, t: 0, dur: .35, col: T.col }); AU.sfx('turret', .8);
  updTurBtns(true); return true;
}
function turTarget(t, R) { let best = null, bd = R * R; for (const e of query(t.x, t.y, R)) { if (e.dead || e.obj) continue; const d = (e.x - t.x) ** 2 + (e.y - t.y) ** 2; if (d < bd) { bd = d; best = e; } } return best; }
function turFire(t, e) {
  const T = TURRETS[t.id], dm = turDmg(T), a = Math.atan2(e.y - t.y, e.x - t.x); t.ang = a; t.fx = .12;
  const mx = t.x + Math.cos(a) * 16, my = t.y - 12 + Math.sin(a) * 16;
  switch (t.id) {
    case 'mg': mkProj({ kind: 'tracer', x: mx, y: my, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, ang: a, r: 4, dmg: dm, pierce: 1, life: T.range / 760 + .05, col: T.col, size: .9, kb: 18, ally: 'turret' }); AU.sfx('smg', 1.6); break;
    case 'elec': { let cur = e; const hit = new Set(); let px = mx, py = my;
      for (let k = 0; k < 4 && cur; k++) { hit.add(cur); effects.push({ type: 'bolt', pts: [[px, py], [cur.x, cur.y]], t: 0, dur: .16, seed: Math.random() * 100, col: T.col }); hitEnemy(cur, dm * (k ? .7 : 1), { slow: .35, ally: 'turret', silent: true }); px = cur.x; py = cur.y;
        let nb = null, nd = 125 * 125; for (const o of query(cur.x, cur.y, 125)) if (!o.dead && !hit.has(o) && !o.obj) { const d = (o.x - cur.x) ** 2 + (o.y - cur.y) ** 2; if (d < nd) { nd = d; nb = o; } } cur = nb; }
      AU.sfx('zap', 1.2); break; }
    case 'cannon': mkProj({ kind: 'cball', x: mx, y: my, vx: Math.cos(a) * 470, vy: Math.sin(a) * 470, ang: a, r: 7, dmg: dm, pierce: 1, life: Math.hypot(e.x - mx, e.y - my) / 470 + .02, col: T.col, boom: 72, explodeEnd: 1, size: 11, kb: 90, ally: 'turret' }); AU.sfx('cannon', 1.2); break;
    case 'flame': for (let k = 0; k < 2; k++) { const aa = a + rand(-.22, .22); addPart(mx, my, Math.cos(aa) * rand(240, 320), Math.sin(aa) * rand(240, 320), pick(['#ff7043', '#ffab40', '#ffd54f']), .45, rand(4, 7)); }
      for (const o of query(t.x, t.y, T.range)) { if (o.dead || o.obj) continue; const oa = Math.atan2(o.y - t.y, o.x - t.x); let df = Math.abs(oa - a); if (df > Math.PI) df = TAU - df; if (df < .4) hitEnemy(o, dm, { burn: dm * 1.5, ally: 'turret', silent: true, tick: 1 }); }
      if (Math.random() < .25) AU.sfx('flame', 1.1); break;
    case 'ice': effects.push({ type: 'nova', x: e.x, y: e.y, r: 90, t: 0, dur: .35, col: T.col }); for (const o of query(e.x, e.y, 90)) if (!o.dead && !o.obj) hitEnemy(o, dm, { slow: .5, freeze: 1, ally: 'turret', silent: true });
      effects.push({ type: 'bolt', pts: [[mx, my], [e.x, e.y]], t: 0, dur: .12, seed: Math.random() * 100, col: '#e1f5fe' }); AU.sfx('freeze', 1.1); break;
    case 'laser': { const L = T.range, x2 = mx + Math.cos(a) * L, y2 = my + Math.sin(a) * L; effects.push({ type: 'rail', x1: mx, y1: my, x2, y2, w: 7, col: T.col, t: 0, dur: .22 });
      for (const o of query((mx + x2) / 2, (my + y2) / 2, L / 2 + 20)) if (!o.dead && !o.obj && segDist2(o.x, o.y, mx, my, x2, y2) < (o.r + 6) ** 2) hitEnemy(o, dm, { ap: .3, ally: 'turret', silent: true });
      AU.sfx('laser', 1.1); break; }
    case 'missile': for (let k = 0; k < 4; k++) later(k * .1, () => { if (G.state !== 'play') return; const aa = -Math.PI / 2 + rand(-.6, .6); mkProj({ kind: 'missile', x: t.x, y: t.y - 18, vx: Math.cos(aa) * 160, vy: Math.sin(aa) * 160, ang: aa, acc: 460, r: 5, dmg: dm, pierce: 1, life: 2, col: T.col, boom: 38, homing: 5, target: e.dead ? null : e, explodeEnd: 1, size: .8, ally: 'turret' }); });
      AU.sfx('missile', 1.3); break;
    case 'poison': addPool({ k: 'gas', x: e.x, y: e.y, r: 70, delay: 0, dur: 4, dps: dm, friendly: 1 }); AU.sfx('acid', 1); break;
    case 'mortar': { const tx = e.x, ty = e.y; effects.push({ type: 'target', x: tx, y: ty, r: 60, t: 0, dur: .7, col: T.col });
      later(.7, () => { if (G.state === 'play') explode(tx, ty, 80, dm, true, '#ffcc80', { ally: 'turret' }); }); AU.sfx('mortar', 1); break; }
  }
}
function turretUpdate(dt) {
  if (G.tPlaceCd > 0) G.tPlaceCd -= dt;
  // 주기적 터렛 보급 (보스 처치 후 정리 시간 제외)
  if (G.bossState !== 3) { G.turT -= dt; if (G.turT <= 0) { G.turT = rand(70, 90); const a = rand(0, TAU), d = rand(140, 220); turDropAt(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); toast('🗼 터렛 보급품 투하!', 1.3, '#80d8ff'); } }
  for (const t of pturrets) {
    const T = TURRETS[t.id]; t.t -= dt; t.fx -= dt; t.hitT -= dt;
    // 근접한 적에게 공격받으면 내구도 감소
    for (const e of query(t.x, t.y, 26)) if (!e.dead && !e.obj) { t.hp -= (e.dmg || 8) * dt * (e.boss ? 3 : e.elite ? 1.5 : .8); t.hitT = .1; }
    for (const q of eprojs) if (!q.dead && Math.abs(q.x - t.x) < 16 && Math.abs(q.y - (t.y - 8)) < 18) { q.dead = true; t.hp -= (q.dmg || 8); t.hitT = .1; }
    t.cd -= dt;
    if (t.cd <= 0) { const e = turTarget(t, T.range); if (e) { t.cd = T.cd; turFire(t, e); } else t.cd = .2; }
    if (t.hp <= 0 || t.t <= 0) { t.dead = true; effects.push({ type: 'poof', x: t.x, y: t.y, r: 26, t: 0, dur: .4 }); if (t.hp <= 0) { explodeFx(t.x, t.y, 30, T.col); toast(`💥 ${T.n} 파괴됨`, .9); } }
  }
  if (pturrets.some(t => t.dead)) { pturrets = pturrets.filter(t => !t.dead); updTurBtns(true); }
  updTurBtns(false);
}
/* ---- 그리기: 아군 터렛은 청록 테두리로 적과 구분, 효과는 절제 ---- */
function drawTurrets() {
  for (const t of pturrets) {
    const T = TURRETS[t.id], x = t.x, y = t.y;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(100,255,218,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 2, 22, 9, 0, 0, TAU); ctx.stroke();
    rr(ctx, x - 13, y - 10, 26, 13, 4); fs(ctx, t.hitT > 0 ? '#fff' : '#455a64', 1.4);
    ctx.save(); ctx.translate(x, y - 12); ctx.rotate(t.ang);
    rr(ctx, -8, -8, 16, 16, 5); fs(ctx, T.col, 1.4);
    rr(ctx, 4, -2.5, 15 + (t.fx > 0 ? -2 : 0), 5, 2); fs(ctx, '#263238', 1);
    ctx.restore();
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(T.ic, x, y - 12); ctx.textBaseline = 'alphabetic';
    // 내구도 + 남은 시간
    const w = 30; ctx.fillStyle = '#000a'; ctx.fillRect(x - w / 2, y - 30, w, 4); ctx.fillStyle = '#64ffda'; ctx.fillRect(x - w / 2, y - 30, w * clamp(t.hp / t.maxHp, 0, 1), 4);
    ctx.fillStyle = '#ffffffaa'; ctx.fillRect(x - w / 2, y - 25, w * clamp(t.t / TUR_DUR, 0, 1), 2);
  }
}
function drawTurretGhost() {
  const d = G.tDrag; if (!d || !d.moved) return;
  const T = TURRETS[G.tInv[d.slot]]; if (!T) return;
  const ok = turValid(d.wx, d.wy), sx = W / 2 + (d.wx - G.camX) * S, sy = H / 2 + (d.wy - G.camY) * S, pr = TUR_MAX_DIST * S;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = .18; ctx.strokeStyle = '#64ffda'; ctx.lineWidth = 1.5; circ(ctx, W / 2 + (P.x - G.camX) * S, H / 2 + (P.y - G.camY) * S, pr); ctx.stroke();
  ctx.globalAlpha = .14; ctx.fillStyle = ok ? T.col : '#ff5252'; circ(ctx, sx, sy, T.range * S); ctx.fill();
  ctx.globalAlpha = .9; ctx.fillStyle = ok ? 'rgba(100,255,218,.35)' : 'rgba(255,82,82,.35)'; circ(ctx, sx, sy, 20 * S); ctx.fill();
  ctx.strokeStyle = ok ? '#64ffda' : '#ff5252'; ctx.lineWidth = 2; circ(ctx, sx, sy, 20 * S); ctx.stroke();
  ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(T.ic, sx, sy);
  ctx.font = '800 11px "Noto Sans KR",sans-serif'; ctx.fillStyle = ok ? '#64ffda' : '#ff8a80'; ctx.fillText(ok ? '손을 떼면 설치' : '설치 불가', sx, sy + 30 * S);
  ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
}
/* ---- 슬롯 버튼 (모바일: 끌어서 놓기 / 짧게 누르면 내 앞에 설치, PC: 1·2 키) ---- */
let turBtnKey = '';
function updTurBtns(force) {
  const key = (G.tInv || []).join(',') + '|' + Math.ceil(Math.max(0, G.tPlaceCd || 0)) + '|' + pturrets.length + '|' + (G.state === 'play' && !G.veh ? 1 : 0);
  if (!force && key === turBtnKey) return; turBtnKey = key;
  for (let i = 0; i < TUR_MAX; i++) {
    const b = $('bT' + (i + 1)); if (!b) continue;
    const id = G.tInv && G.tInv[i], on = !!id && G.state === 'play' && !G.veh;
    b.style.display = on ? 'flex' : 'none';
    if (on) { const T = TURRETS[id]; b.querySelector('.ic').textContent = T.ic; b.querySelector('.lb').textContent = G.tPlaceCd > 0 ? Math.ceil(G.tPlaceCd) + '초' : '설치'; b.style.borderColor = T.col; b.classList.toggle('dis', G.tPlaceCd > 0); }
  }
}
function turScreenToWorld(cx, cy) { return [G.camX + (cx - W / 2) / S, G.camY + (cy - H / 2) / S]; }
function bindTurBtn(i) {
  const b = $('bT' + (i + 1)); if (!b) return;
  b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); if (!G.tInv[i] || G.state !== 'play') return; try { b.setPointerCapture(ev.pointerId); } catch (e) {} G.tDrag = { slot: i, sx: ev.clientX, sy: ev.clientY, moved: false, wx: P.x, wy: P.y, t0: performance.now() }; });
  b.addEventListener('pointermove', ev => { const d = G.tDrag; if (!d || d.slot !== i) return; if (Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) > 14) d.moved = true; [d.wx, d.wy] = turScreenToWorld(ev.clientX, ev.clientY); });
  const end = ev => { const d = G.tDrag; if (!d || d.slot !== i) return; G.tDrag = null;
    const r = b.getBoundingClientRect(), overBtn = ev.clientX >= r.left - 10 && ev.clientX <= r.right + 10 && ev.clientY >= r.top - 10 && ev.clientY <= r.bottom + 10;
    if (!d.moved) { const a = P.moving ? Math.atan2(P.lastMy, P.lastMx) : -Math.PI / 2; turPlace(i, P.x + Math.cos(a) * 46, P.y + Math.sin(a) * 46); }   // 짧게 누르기 → 내 앞에 설치
    else if (!overBtn) turPlace(i, d.wx, d.wy);   // 끌어다 놓기 (버튼 위로 되돌리면 취소)
  };
  b.addEventListener('pointerup', end); b.addEventListener('pointercancel', () => { G.tDrag = null; });
}
bindTurBtn(0); bindTurBtn(1);
addEventListener('keydown', ev => { if (G.state !== 'play') return; if (ev.key === '1' || ev.key === '2') { const i = +ev.key - 1; if (G.tInv && G.tInv[i]) { const a = P.moving ? Math.atan2(P.lastMy, P.lastMx) : -Math.PI / 2; turPlace(i, P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 60); } } });
