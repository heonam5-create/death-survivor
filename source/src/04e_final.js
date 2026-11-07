/* =====================================================================
   최종 개선: 스테이지별 보스 고유 공격(10유형 × 3페이즈 + 필살기),
              보스 처치 후 보석 자동 회수, 클리어 화면(강화·무기 2개 계승·다음 버튼)
   ===================================================================== */

/* ------------------------- 보스 유형 ------------------------- */
const BARCH = {
  charge: { n: '돌진형', p1: ['charge', 'dashx', 'slam'], p2: ['jump', 'dashx', 'radial'], p3: ['dashx', 'jump', 'slam', 'charge'], ult: 'meteor', un: '연속 파멸 돌진' },
  artillery: { n: '포격형', p1: ['barrage', 'missile', 'fan'], p2: ['mortarx', 'barrage', 'radial'], p3: ['mortarx', 'missile', 'barrage'], ult: 'carpet', un: '융단 포격' },
  laser: { n: '레이저형', p1: ['laser', 'sweep', 'fan'], p2: ['rotlaser', 'laser', 'spiral'], p3: ['rotlaser', 'sweep', 'laser'], ult: 'crossbeam', un: '6연 회전 레이저' },
  summon: { n: '소환형', p1: ['summon', 'radial', 'blink'], p2: ['summon', 'spiral', 'charge'], p3: ['summon', 'spiral', 'barrage'], ult: 'horde', un: '대군단 소환' },
  mech: { n: '기계형', p1: ['turrets', 'fan', 'missile'], p2: ['turrets', 'laser', 'barrage'], p3: ['turrets', 'sweep', 'missile'], ult: 'fortress', un: '포탑 요새 전개' },
  fire: { n: '화염형', p1: ['firepool', 'fan', 'charge'], p2: ['firepool', 'radial', 'jump'], p3: ['firepool', 'spiral', 'barrage'], ult: 'inferno', un: '지옥불 고리' },
  ice: { n: '냉기형', p1: ['frost', 'fan', 'slam'], p2: ['frost', 'radial', 'charge'], p3: ['frost', 'spiral', 'sweep'], ult: 'blizzard', un: '절대 빙결 폭풍' },
  electric: { n: '전기형', p1: ['chainl', 'fan', 'blink'], p2: ['chainl', 'spiral', 'laser'], p3: ['chainl', 'rotlaser', 'radial'], ult: 'storm', un: '천둥 폭풍' },
  gravity: { n: '중력형', p1: ['gwell', 'radial', 'blink'], p2: ['gwell', 'spiral', 'slam'], p3: ['gwell', 'rotlaser', 'barrage'], ult: 'blackhole', un: '블랙홀 붕괴' },
  final: { n: '최종형', p1: ['laser', 'summon', 'barrage', 'charge'], p2: ['rotlaser', 'chainl', 'firepool', 'gwell'], p3: ['dashx', 'frost', 'turrets', 'sweep', 'spiral'], ult: 'apocalypse', un: '종말의 심판' }
};
// 스테이지 배경에 맞춘 보스 유형 (1~40)
const STAGE_ARCH = [null, 'charge', 'charge', 'artillery', 'fire', 'summon', 'summon', 'summon', 'artillery', 'ice', 'ice',
  'fire', 'electric', 'laser', 'mech', 'gravity', 'mech', 'mech', 'laser', 'electric', 'artillery',
  'fire', 'artillery', 'summon', 'laser', 'gravity', 'gravity', 'electric', 'artillery', 'charge', 'final',
  'electric', 'ice', 'laser', 'summon', 'fire', 'ice', 'fire', 'gravity', 'mech', 'final'];
function phasePats(e, ph) {
  const A = e.arch, own = e.bdef.pats.filter(p => !['missile', 'barrage', 'sweep'].includes(p));
  const mine = own[(G.stage * 3) % own.length];   // 보스 고유 기술 1개 섞기
  const set = ph === 0 ? A.p1.concat([mine]) : ph === 1 ? A.p1.concat(A.p2) : A.p3.concat(A.p2);
  return [...new Set(set)];
}
function initArch(e) {
  if (e.mini) return; const k = STAGE_ARCH[G.stage] || 'charge'; e.arch = BARCH[k]; e.archK = k;
  e.patsCur = phasePats(e, 0); e.ultT = 999;
  later(1.5, () => toast(`👑 ${e.bdef.name} — ${e.arch.n} 보스<br><span style="font-size:14px">3페이즈 필살기: ${e.arch.un}</span>`, 2, '#ff8a80'));
}
function archPhase(e) { if (!e.arch) return; e.patsCur = phasePats(e, e.bar); if (e.bar >= 2) e.ultT = 4; }

/* ------------------------- 지속 장판 (화염·냉기·중력정) ------------------------- */
let pools = [];
function addPool(o) { pools.push(Object.assign({ t: 0, tick: 0 }, o)); }
function updatePools(dt) {
  for (const p of pools) {
    p.t += dt; if (p.t < p.delay) continue;
    if (p.friendly) { p.tick -= dt; if (p.tick <= 0) { p.tick = 0.5; for (const e of query(p.x, p.y, p.r)) if (!e.dead && !e.obj) hitEnemy(e, p.dps * 0.5, { poison: p.dps * 0.4, ally: 'turret', silent: true, tick: 1 }); } if (Q.level && Math.random() < 0.25) addPart(p.x + rand(-p.r, p.r) * .7, p.y + rand(-p.r, p.r) * .5, 0, -20, '#c5e1a5', .6, 4); continue; }
    const d = Math.hypot(P.x - p.x, P.y - p.y), inside = d < p.r;
    if (p.k === 'well') { if (d > 8 && d < p.r * 2.2) { const pw = p.pull * dt; P.x += (p.x - P.x) / d * Math.min(d, pw); P.y += (p.y - P.y) / d * Math.min(d, pw); } }
    else if (inside) { p.tick -= dt; if (p.tick <= 0) { p.tick = 0.5; damagePlayer(p.dps * 0.5, p.k); if (p.k === 'frost') P.slowT = Math.max(P.slowT, 0.6); } }
    if (Q.level && Math.random() < 0.4) addPart(p.x + rand(-p.r, p.r) * .7, p.y + rand(-p.r, p.r) * .5, 0, p.k === 'well' ? 0 : -40, p.k === 'fire' ? pick(['#ff6d00', '#ffab00']) : p.k === 'frost' ? '#e1f5fe' : '#b388ff', .5, 3);
  }
  pools = pools.filter(p => p.t < p.delay + p.dur);
}
function drawPools() {
  for (const p of pools) {
    if (Math.abs(p.x - G.camX) > VW / 2 + p.r || Math.abs(p.y - G.camY) > VH / 2 + p.r) continue;
    const warm = p.t < p.delay, k = warm ? p.t / p.delay : 1, col = p.k === 'fire' ? '255,90,0' : p.k === 'frost' ? '128,216,255' : p.k === 'gas' ? '174,213,129' : '124,77,255';
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, .6);
    if (p.friendly) { ctx.fillStyle = `rgba(${col},${.16 + .05 * Math.sin(G.time * 5 + p.x)})`; circ(ctx, 0, 0, p.r); ctx.fill(); }
    else if (warm) { ctx.strokeStyle = `rgba(${col},.3)`; ctx.lineWidth = 1.2; circ(ctx, 0, 0, p.r); ctx.stroke(); ctx.fillStyle = `rgba(${col},.12)`; circ(ctx, 0, 0, p.r * k); ctx.fill(); }
    else if (p.k === 'well') { ctx.rotate(G.time * 3); for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${col},${.7 - i * .2})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, p.r * (.3 + i * .3), 0, 4.2); ctx.stroke(); } ctx.fillStyle = '#000'; circ(ctx, 0, 0, 14); ctx.fill(); }
    else { const a = .35 + .1 * Math.sin(G.time * 8 + p.x); ctx.fillStyle = `rgba(${col},${a * .8})`; circ(ctx, 0, 0, p.r); ctx.fill(); ctx.strokeStyle = `rgba(${col},.45)`; ctx.lineWidth = 1.5; circ(ctx, 0, 0, p.r); ctx.stroke(); }
    ctx.restore();
  }
}

/* ------------------------- 보스 유형별 공격 (모두 경고 표시 후 발동) ------------------------- */
const FIXED_TURRET = { n: '보스 포탑', draw: 'device', pal: 'bossMech', hp: 260, spd: 0, dmg: 0, r: 18, xp: 3, tag: 'obj', ai: 'static', armor: .3 };
ET.bturret = Object.assign({ id: 'bturret' }, FIXED_TURRET);
function bossArchStart(e, pat) {
  const d = e.dmg, ph = e.bar || 0;
  switch (pat) {
    case 'dashx': e.dn = ph >= 2 ? 4 : 3; e.dashPhase = 0; break;
    case 'mortarx': { const n = 8 + ph * 2; for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-.2, .2), rr = rand(60, 170); hazards.push({ src: 'boss', kind: 'circle', x: P.x + Math.cos(a) * rr, y: P.y + Math.sin(a) * rr, r: 50, t: 0, delay: 1.2 + i * 0.1, dmg: d * .85 }); } hazards.push({ src: 'boss', kind: 'circle', x: P.x, y: P.y, r: 46, t: 0, delay: 1.5, dmg: d * .85 }); AU.sfx('alarm'); break; }
    case 'rotlaser': { e.rlN = ph >= 2 ? 4 : 3; e.rlA = rand(0, TAU); e.rlDir = Math.random() < .5 ? 1 : -1; for (let i = 0; i < e.rlN; i++) hazards.push({ src: 'boss', kind: 'line', x: e.x, y: e.y, ang: e.rlA + i * TAU / e.rlN, len: 560, w: 20, t: 0, delay: 1.0, dmg: 0, thin: 1 }); AU.sfx('elaser'); break; }
    case 'turrets': { const alive = enemies.filter(o => !o.dead && o.type === 'bturret').length, n = Math.min(5 - alive, 2 + (ph >= 1 ? 1 : 0)); for (let i = 0; i < n; i++) { const a = rand(0, TAU), x = e.x + Math.cos(a) * 120, y = e.y + Math.sin(a) * 120; effects.push({ type: 'portal', x, y, t: 0, dur: .8 }); later(.7, () => { if (G.state !== 'play' || e.dead) return; const t = spawnEnemy('bturret', x, y, { obj: 1 }); t.dmg = d * .4; t.aiT = 1.2; }); } AU.sfx('portal'); break; }
    case 'firepool': { const n = 3 + ph; for (let i = 0; i < n; i++) addPool({ k: 'fire', x: P.x + (i ? rand(-150, 150) : 0), y: P.y + (i ? rand(-150, 150) : 0), r: 62, delay: 1.1, dur: 6, dps: d * .55 }); for (let i = 0; i < 5; i++) eShot(e.x, e.y, Math.atan2(P.y - e.y, P.x - e.x) + (i - 2) * .22, 170, d * .45, 'fire'); AU.sfx('flame'); break; }
    case 'frost': { for (let i = 0; i < 2 + ph; i++) addPool({ k: 'frost', x: P.x + (i ? rand(-140, 140) : 0), y: P.y + (i ? rand(-140, 140) : 0), r: 70, delay: 1.0, dur: 5, dps: d * .3 }); later(.8, () => { if (G.state === 'play' && !e.dead) { for (let i = 0; i < 14; i++) eShot(e.x, e.y, i / 14 * TAU, 140, d * .35, 'ice'); AU.sfx('freeze'); } }); break; }
    case 'chainl': { let x = P.x + rand(-180, 180), y = P.y + rand(-180, 180); const n = 4 + ph; for (let i = 0; i < n; i++) { const x2 = i === Math.floor(n / 2) ? P.x : P.x + rand(-200, 200), y2 = i === Math.floor(n / 2) ? P.y : P.y + rand(-200, 200), ang = Math.atan2(y2 - y, x2 - x), len = Math.hypot(x2 - x, y2 - y) + 20; hazards.push({ src: 'boss', kind: 'line', x, y, ang, len, w: 18, t: 0, delay: 1.0 + i * 0.12, dmg: d * .75, beam: 1 }); x = x2; y = y2; } AU.sfx('zap'); break; }
    case 'gwell': { const wx = (e.x + P.x) / 2 + rand(-60, 60), wy = (e.y + P.y) / 2 + rand(-60, 60); addPool({ k: 'well', x: wx, y: wy, r: 70, delay: .8, dur: 2.6 + ph * .4, pull: 85 + ph * 15 }); hazards.push({ src: 'boss', kind: 'circle', x: wx, y: wy, r: 95, t: 0, delay: 3.4 + ph * .4, dmg: d * 1.1 }); AU.sfx('hole'); break; }
    case 'ult': bossUltStart(e); break;
  }
}
function bossArchUpdate(e, dt) {
  switch (e.ps) {
    case 'dashx':
      if (e.dashPhase === 0) { e.dang = Math.atan2(P.y - e.y, P.x - e.x); hazards.push({ src: 'boss', kind: 'line', x: e.x, y: e.y, ang: e.dang, len: 330, w: e.r * 1.5, t: 0, delay: .55, dmg: 0 }); e.dashPhase = 1; e.sub = 0; }
      else if (e.dashPhase === 1 && e.sub >= .55) { e.dashPhase = 2; e.sub = 0; AU.sfx('dash'); }
      else if (e.dashPhase === 2) { e.x += Math.cos(e.dang) * 640 * dt; e.y += Math.sin(e.dang) * 640 * dt; if (Q.level && Math.random() < .7) addPart(e.x, e.y + e.r * .5, rand(-40, 40), rand(-40, 40), '#bcaaa4', .4, 5);
        if (e.sub >= .45) { e.dashPhase = 0; e.dn--; G.shake = Math.max(G.shake, 6); effects.push({ type: 'xring', x: e.x, y: e.y, r: e.r * 2.6, t: 0, dur: .4, col: '#ffccbc' }); for (let i = 0; i < 10; i++) eShot(e.x, e.y, i / 10 * TAU, 150, e.dmg * .4, e.bdef.shot || 'orb'); AU.sfx('slam'); if (e.dn <= 0) endPattern(e); } }
      return true;
    case 'mortarx': if (e.sub >= 2.4) endPattern(e); return true;
    case 'rotlaser':
      if (e.sub >= 1.0 && e.sub < 3.6) { e.rlA += e.rlDir * dt * .85; for (let i = 0; i < e.rlN; i++) { const a = e.rlA + i * TAU / e.rlN, x2 = e.x + Math.cos(a) * 560, y2 = e.y + Math.sin(a) * 560; if (effects.length < FXCAP) effects.push({ type: 'rail', x1: e.x, y1: e.y, x2, y2, w: 16, col: '#ff1744', t: 0, dur: .06 }); if (segDist2(P.x, P.y, e.x, e.y, x2, y2) < (10 + P.r * .5) ** 2) damagePlayer(e.dmg * .8, 'beam'); } }
      if (e.sub >= 3.8) endPattern(e); return true;
    case 'turrets': case 'firepool': case 'frost': case 'chainl': if (e.sub >= 1.4) endPattern(e); return true;
    case 'gwell': if (e.sub >= 2.2) endPattern(e); return true;
    case 'ult': return bossUltUpdate(e, dt);
  }
  return false;
}
function bossUltStart(e) {
  const A = e.arch, d = e.dmg; e.ultK = A.ult; e.uStep = 0;
  G.flash = .3; G.flashCol = '255,0,40'; G.shake = Math.max(G.shake, 8); AU.sfx('bosswarn');
  toast(`☠ 보스 필살기: ${A.un}!`, 1.8, '#ff1744');
  switch (A.ult) {
    case 'meteor': e.dn = 5; e.dashPhase = 0; break;
    case 'carpet': for (let i = 0; i < 26; i++) { const gx = (i % 6 - 2.5) * 80 + rand(-20, 20), gy = (Math.floor(i / 6) - 2) * 80 + rand(-20, 20); hazards.push({ src: 'boss', kind: 'circle', x: P.x + gx, y: P.y + gy, r: 54, t: 0, delay: 1.4 + i * 0.07, dmg: d }); } break;
    case 'crossbeam': e.rlN = 6; e.rlA = rand(0, TAU); e.rlDir = 1; for (let i = 0; i < 6; i++) hazards.push({ src: 'boss', kind: 'line', x: e.x, y: e.y, ang: e.rlA + i * TAU / 6, len: 600, w: 22, t: 0, delay: 1.3, dmg: 0, thin: 1 }); break;
    case 'horde': for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, x = P.x + Math.cos(a) * 260, y = P.y + Math.sin(a) * 260; effects.push({ type: 'portal', x, y, t: 0, dur: .9 }); later(.8, () => { if (G.state === 'play' && !e.dead) spawnEnemy(e.bdef.summon, x, y); }); } later(1, () => { if (G.state === 'play' && !e.dead) spawnElite(); }); break;
    case 'fortress': bossArchStart(e, 'turrets'); bossArchStart(e, 'mortarx'); later(1.2, () => { if (G.state === 'play' && !e.dead) bossArchStart(e, 'turrets'); }); break;
    case 'inferno': { const gap = rand(0, TAU); for (let i = 0; i < 9; i++) { const a = gap + (i + 1) / 10 * TAU; addPool({ k: 'fire', x: P.x + Math.cos(a) * 120, y: P.y + Math.sin(a) * 120, r: 58, delay: 1.3, dur: 6, dps: e.dmg * .6 }); } hazards.push({ src: 'boss', kind: 'circle', x: P.x, y: P.y, r: 60, t: 0, delay: 2.2, dmg: d }); break; }
    case 'blizzard': later(1.2, () => { if (G.state === 'play') P.slowT = Math.max(P.slowT, 4); }); for (let i = 0; i < 20; i++) hazards.push({ src: 'boss', kind: 'circle', x: P.x + rand(-220, 220), y: P.y + rand(-220, 220), r: 46, t: 0, delay: 1.4 + i * .12, dmg: d * .8 }); break;
    case 'storm': for (let w = 0; w < 3; w++) later(w * .9, () => { if (G.state === 'play' && !e.dead) { e.bar2 = e.bar; bossArchStart(e, 'chainl'); } }); break;
    case 'blackhole': addPool({ k: 'well', x: e.x, y: e.y, r: 90, delay: 1.0, dur: 3.4, pull: 95 }); hazards.push({ src: 'boss', kind: 'circle', x: e.x, y: e.y, r: 170, t: 0, delay: 4.4, dmg: d * 1.4 }); break;
    case 'apocalypse': bossArchStart(e, 'mortarx'); later(1.4, () => { if (G.state === 'play' && !e.dead) { e.rlN = 4; e.ps = 'rotlaser'; e.sub = 0; bossArchStart(e, 'rotlaser'); } }); later(2.6, () => { if (G.state === 'play' && !e.dead) bossArchStart(e, 'gwell'); }); break;
  }
}
function bossUltUpdate(e, dt) {
  switch (e.ultK) {
    case 'meteor': e.ps = 'dashx'; return bossArchUpdate(e, dt);
    case 'crossbeam': e.ps = 'rotlaser'; e.sub = Math.max(e.sub, 0); { const r = bossArchUpdate(e, dt); if (e.ps !== 'rotlaser') return r; e.ps = 'ult'; } return true;
    case 'apocalypse': if (e.sub >= 3.2) endPattern(e); return true;
    case 'blackhole': if (e.sub >= 4.6) endPattern(e); return true;
    default: if (e.sub >= 2.6) endPattern(e); return true;
  }
}
function bossUltTick(e, dt) {
  if (!e.arch || e.bar < 2) return;
  e.ultT -= dt;
  if (e.ultT <= 0 && e.ps === 'idle') { e.ultT = 20; e.ps = 'ult'; e.sub = 0; e.step = 0; bossUltStart(e); }
}

/* ------------------------- 보스 처치 후 정리 시간 (v8: 자동 회수 없음) ------------------------- */
// 보석은 바닥에 그대로 남고, 정리 시간(POSTBOSS_T초) 동안 직접 주울 수 있음. '바로 클리어' 버튼으로 즉시 종료 가능.
function postBossFinish() { if (G.bossState === 3 && G.state === 'play') G.winT = 0; }
/* ------------------------- 클리어 화면: 골드 강화 + 무기 2개 계승 + 다음 버튼 ------------------------- */
const INH_MAX = 2, INH_LV = 2;   // 계승 무기는 다음 스테이지에서 Lv.2부터
function inhList() { const a = Array.isArray(save.inherit) ? save.inherit : save.inherit ? [save.inherit] : []; return a.filter(x => x && WMAP[x.id]).slice(0, INH_MAX); }
function renderClearExtras() {
  // 무기 계승 선택 (최대 2개, 선택 즉시 저장)
  const sel = new Set(inhList().filter(x => G.weapons.some(w => w.id === x.id)).map(x => x.id));
  G.inhSel = sel;
  const draw = () => {
    const list = G.weapons.slice().sort((a, b) => (b.evo - a.evo) || (b.lv - a.lv));
    $('rInhSel').innerHTML = `<div class="secT">🔁 다음 스테이지에 가져갈 무기 (최대 ${INH_MAX}개) — <b>${G.inhSel.size}/${INH_MAX}</b></div><div class="ihg">` +
      list.map(w => { const W_ = WMAP[w.id], on = G.inhSel.has(w.id), nm = w.evo ? EVOS[w.id].n : W_.nm;
        return `<button class="ihc${on ? ' on' : ''}" data-id="${w.id}" style="border-color:${on ? '#64ffda' : TIER_COL[W_.t]}"><span class="ii">${w.evo ? EVOS[w.id].ic : W_.ic}</span><span class="in">${nm}</span><span class="it">${CLASS_NAME[W_.c] || ''} · ${TIER_NAME[W_.t]}</span><span class="il">현재 Lv${w.lv}${w.evo ? ' 🔥' : ''} → 다음 Lv${INH_LV}</span>${on ? '<span class="ic2">✔</span>' : ''}</button>`; }).join('') +
      `</div><div class="ihnote">선택한 무기만 다음 스테이지로 가져가며 <b>강화 단계는 Lv.2로 초기화</b>됩니다 (무기 종류·특성은 유지). 선택하지 않은 무기는 사라집니다.</div>`;
  };
  draw();
  $('rInhSel').onclick = ev => {
    const b = ev.target.closest('.ihc'); if (!b) return; AU.sfx('button'); const id = b.dataset.id;
    if (G.inhSel.has(id)) G.inhSel.delete(id); else { if (G.inhSel.size >= INH_MAX) { toast(`최대 ${INH_MAX}개까지 선택할 수 있습니다`, 1, '#ff8a80'); return; } G.inhSel.add(id); }
    saveInheritSel(); draw();
  };
  saveInheritSel();
  renderClearShop();
}
function saveInheritSel() {
  save.inherit = G.weapons.filter(w => G.inhSel.has(w.id)).map(w => ({ id: w.id, lv: INH_LV, evo: !!w.evo, from: G.stage, prevLv: w.lv }));
  writeSave();
}
function renderClearShop() {
  const el = $('rShop'); if (!el) return;
  el.innerHTML = `<div class="secT">🔧 골드로 캐릭터 강화 <span class="gold">💰 ${save.gold}</span></div>` + Object.entries(UPGRADES).map(([k, u]) => {
    const lv = save.up[k], max = lv >= u.max, cost = upCost(k, lv);
    return `<div class="shrow sm"><div class="ci">${u.ic}</div><div class="sx"><b>${u.n}</b> <small>Lv ${lv}/${u.max}</small><div class="cd">${u.d(lv)}${max ? '' : ` → <b style="color:#69f0ae">${u.d(lv + 1)}</b>`}</div></div>
      <button class="btn sm ${max || save.gold < cost ? 'gray' : ''}" data-k="${k}" ${max ? 'disabled' : ''}>${max ? 'MAX' : '💰' + cost}</button></div>`;
  }).join('') + `<div class="ihnote">💪 강화할수록 다음 스테이지 적도 조금 강해집니다 (현재 보정 +${Math.round(computeAdapt() * 100)}%, 상한 ${Math.round(adaptCap() * 100)}%). 강화한 만큼 확실히 유리합니다.</div>`;
  el.onclick = ev => {
    const b = ev.target.closest('button[data-k]'); if (!b) return; const k = b.dataset.k, lv = save.up[k], cost = upCost(k, lv);
    if (lv >= UPGRADES[k].max) return;
    if (save.gold < cost) { AU.sfx('hurt'); toast('골드가 부족합니다', 1, '#ff8a80'); return; }
    save.gold -= cost; save.up[k]++; writeSave(); AU.sfx('levelup'); renderClearShop();
    const gs = document.querySelector('#rStats .goldNow'); if (gs) gs.textContent = '💰 ' + save.gold;
  };
}

/* ------------------------- v8: 차량 · 구출 동료 위치 표시 ------------------------- */
const VCH_IC = { bike: '🏍️', buggy: '🏎️', jeep: '🚙', rover: '🚐', apc: '🚛', tank: '🚜', hbike: '🛵', htank: '🚤', minibot: '🤖', mech: '🦾', spider: '🕷️', titan: '🦿', heli: '🚁', jet: '✈️', dpod: '🛩️', gunship: '🛫', saucer: '🛸' };
function trackTargets() {
  const L = [];
  for (const v of vehs) if (!v.dead && v !== G.veh && v.time > 0) L.push({ x: v.x, y: v.y, ic: VCH_IC[v.def.ch] || '🚘', col: '#4dd0e1', lb: v.drop ? '착륙 중' : '탑승', veh: 1 });
  for (const p of pickups) if (!p.dead && p.kind === 'legend') L.push({ x: p.x, y: p.y, ic: '🎁', col: '#ffd54f', lb: '전설', off: 1 });
  for (const t of pturrets) L.push({ x: t.x, y: t.y, ic: '🗼', col: '#64ffda', lb: '내 터렛', off: 1 });
  for (const p of pickups) if (!p.dead && p.kind === 'tdrop') L.push({ x: p.x, y: p.y, ic: (TURRETS[p.item] || TURRETS.mg).ic, col: '#64ffda', lb: '터렛', off: 1 });
  for (const r of rescues) if (!r.done) L.push({ x: r.x, y: r.y, ic: (ACL[r.spec.cls] || {}).ic || '🙋', col: '#69f0ae', lb: r.active ? '구출 중' : '구출' });
  return L;
}
let finShown = false, finSec = -1;
function updFinBtn() {
  const on = G.bossState === 3 && G.state === 'play', b = $('bFin'); if (!b) return;
  if (on !== finShown) { finShown = on; b.style.display = on ? 'block' : 'none'; }
  if (on) { const s = Math.max(0, Math.ceil(G.winT)); if (s !== finSec) { finSec = s; $('finT').textContent = s; } }
}
function drawTrackers(W, H) {
  updFinBtn(); drawTurretGhost();
  if (G.state !== 'play' && G.state !== 'pause') return;
  const L = trackTargets(); if (!L.length) return;
  const cx = W / 2, cy = H / 2, mL = 30 + SAFE.l, mR = 30 + SAFE.r, mT = 200 + SAFE.t, mB = 205 + SAFE.b;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const bob = Math.sin(G.time * 5) * 3; let n = 0; const placed = [];
  for (const t of L) {
    const sx = cx + (t.x - G.camX) * S, sy = cy + (t.y - G.camY) * S, dist = Math.round(Math.hypot(t.x - P.x, t.y - P.y) / 10);
    const on = sx > 10 && sx < W - 10 && sy > 30 && sy < H - 10;
    let bx, by, a = Math.atan2(sy - cy, sx - cx);
    if (on && t.off) continue;   // 화면 안에 보이는 상자·터렛은 표시 생략 (화면 깔끔하게)
    if (on) { bx = sx; by = sy - 40 + bob; }
    else { if (++n > 9) continue; bx = clamp(cx + Math.cos(a) * 2000, mL, W - mR); by = clamp(cy + Math.sin(a) * 2000, mT, H - mB);
      // 같은 방향 표시가 겹치면 가장자리를 따라 옆으로 비켜서 각각 보이게
      for (let k = 0; k < 8 && placed.some(q => Math.abs(q[0] - bx) < 44 && Math.abs(q[1] - by) < 34); k++) { const side = bx <= mL + 1 || bx >= W - mR - 1; if (side) by = clamp(by + (by > H / 2 ? -36 : 36), mT, H - mB); else bx = clamp(bx + (bx > W / 2 ? -46 : 46), mL, W - mR); }
      placed.push([bx, by]); }
    ctx.globalAlpha = .93;
    if (!on) { // 방향 화살표
      ctx.save(); ctx.translate(bx, by); ctx.rotate(a); ctx.fillStyle = t.col; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(13, -5); ctx.lineTo(13, 5); ctx.closePath(); ctx.fill(); ctx.restore();
    } else { ctx.fillStyle = t.col; ctx.beginPath(); ctx.moveTo(bx - 5, by + 11); ctx.lineTo(bx + 5, by + 11); ctx.lineTo(bx, by + 17); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.66)'; ctx.beginPath(); ctx.arc(bx, by, 12, 0, TAU); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = t.col; ctx.stroke();
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(t.ic, bx, by + 1);
    const txt = on ? t.lb : `${t.lb} ${dist}m`;
    ctx.font = '800 9px "Noto Sans KR",sans-serif'; const tw = ctx.measureText(txt).width + 6;
    ctx.fillStyle = 'rgba(0,0,0,.66)'; rr(ctx, bx - tw / 2, by + 13 + (on ? 5 : 0), tw, 12, 5); ctx.fill();
    ctx.fillStyle = t.col; ctx.fillText(txt, bx, by + 19.5 + (on ? 5 : 0));
  }
  ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
}
