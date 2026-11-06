/* =====================================================================
   게임 로직
   ===================================================================== */
const G = { state: 'title', paused: false };
let P = null;
let enemies = [], projs = [], eprojs = [], pickups = [], parts = [], texts = [], effects = [], hazards = [], fields = [], turrets = [], mines = [], gens = [], laterQ = [];
const joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0 };
const keys = {};
function later(t, fn) { laterQ.push({ t: G.time + t, fn }); }
function xpNeed(l) { return Math.floor(5 + l * 3.5 + l * l * 0.18); }

function recalc() {
  const p = G.pass, u = save.up;
  P.dmgMul = (1 + 0.12 * (p.atk || 0)) * (1 + 0.05 * u.atk);
  P.cdMul = 1 / (1 + 0.1 * (p.aspd || 0));
  P.projAdd = p.proj || 0; P.pierceAdd = p.pierce || 0;
  P.areaMul = 1 + 0.12 * (p.area || 0);
  P.crit = 0.05 + 0.07 * (p.crit || 0);
  const oldMax = P.maxHp; P.maxHp = 100 + 25 * (p.hp || 0) + 12 * u.hp; if (P.maxHp > oldMax) P.hp += P.maxHp - oldMax;
  P.armor = Math.min(0.6, 0.07 * (p.armor || 0) + 0.02 * u.armor);
  P.regen = 0.5 * (p.regen || 0);
  P.spd = 125 * (1 + 0.08 * (p.speed || 0)) * (1 + 0.02 * u.spd);
  P.magnet = 75 * (1 + 0.35 * (p.magnet || 0));
  P.greed = (1 + 0.2 * (p.greed || 0)) * (1 + 0.05 * u.gain); P.xpMul = 1 + 0.05 * u.gain;
  const b = G.buff || {}; P.dmgMul *= 1 + (b.atk || 0); P.cdMul /= 1 + (b.aspd || 0); P.crit += b.crit || 0; P.spd *= 1 + (b.spd || 0);
}
function codexOf(id) { return save.codex[id] || (save.codex[id] = { found: 1, maxLv: 1, kills: 0 }); }
function addWeapon(id) {
  const w = { id, lv: 1, cd: 0.3, evo: false };
  G.weapons.push(w); const c = codexOf(id); if (!c.found) c.found = 1;
  if (!G.newFound.includes(id) && !(G.knownBefore[id])) G.newFound.push(id);
  return w;
}

/* ------------------------- 스테이지 시작 ------------------------- */
function startStage(n) {
  const st = STAGES[n - 1];
  G.stage = n; G.st = st; G.t = 0; G.time = 0;
  G.hpMul = 1 + (n - 1) * 0.16; G.dmgMul = 1 + (n - 1) * 0.07; G.spdMul = 1 + (n - 1) * 0.006;
  P = { x: 0, y: 0, r: 12, hp: 100, maxHp: 100, face: 1, aim: 0, walkT: 0, moving: false, inv: 0, hurtT: 0, dashT: 0, dashVx: 0, dashVy: 0, lastMx: 1, lastMy: 0, slowT: 0, atkT: 0, recoil: 0 };
  G.pass = {}; G.buff = { atk: 0, aspd: 0, crit: 0, spd: 0, barrier: 0, vamp: 0 }; G.swapQ = []; G.legT = st.D * rand(0.22, 0.45); G.legSpawned = false; G.legGot = false; G.mergeT = 0; G.weapons = []; G.newFound = []; G.knownBefore = {}; for (const k in save.codex) G.knownBefore[k] = 1;
  recalc(); P.hp = P.maxHp;
  let sw = save.startW; if (!WMAP[sw] || !save.codex[sw] || firstStageOf(sw) > Math.max(save.cleared + 1, n)) sw = 'rifle';
  addWeapon(sw);
  G.lv = 1; G.xp = 0; G.need = xpNeed(1); G.pendingLv = 0; G.kills = 0; G.gold = 0; G.eid = 0; G.elitesKilled = 0; G.tagKills = {};
  G.potions = 3 + save.up.pot; G.potCd = 0; G.sk1 = 0; G.sk2 = 0; G.spawnT = 0.5; G.evT = 28; G.eliteT = 22; G.itemT = 12; G.qPity = 0;
  G.bossState = 0; G.boss = null; G.mini = null; G.intruded = false; G.warnT = 0; G.winT = 0; G.deadT = 0; G.shake = 0; G.flash = 0; G.flashCol = '255,0,0';
  G.powerT = 0; G.camX = 0; G.camY = 0; G.dmgDealt = 0; G.clearing = 0; G.failReason = ''; G.wkills = {};
  enemies = []; projs = []; eprojs = []; pickups = []; parts = []; texts = []; effects = []; hazards = []; fields = []; turrets = []; mines = []; gens = []; laterQ = [];
  joy.id = null; joy.mag = 0;
  initQuests(st);
  G.paused = false; G.state = 'play';
  showScreen(null); $('gameUI').classList.add('on'); updatePotBadge();
  AU.bgm(st.mu, st.muVar);
  toast(`STAGE ${n}<br><span style="font-size:22px">${st.name}</span>`, 2.4, '#ffd54f');
}

/* ------------------------- 퀘스트 ------------------------- */
function initQuests(st) {
  const f = save.settings.fast ? 0.25 : 1;
  G.quests = [];
  for (const q of st.main) G.quests.push(mkQ(q, true, f));
  for (const q of st.side) G.quests.push(mkQ(q, false, f));
  for (const q of G.quests) {
    if (q.k === 'portal') for (let i = 0; i < q.n; i++) { const a = i / q.n * TAU + rand(-.3, .3), d = rand(380, 520); spawnEnemy('portal', Math.cos(a) * d, Math.sin(a) * d, { obj: 1 }); }
    if (q.k === 'device') for (let i = 0; i < q.n; i++) { const a = i / q.n * TAU + rand(-.3, .3), d = rand(380, 540); spawnEnemy('device', Math.cos(a) * d, Math.sin(a) * d, { obj: 1 }); }
    if (q.k === 'defend') {
      const hp = 1000 + G.stage * 60;
      for (let i = 0; i < q.gens; i++) { const a = i / q.gens * TAU - Math.PI / 2, d = q.gens > 1 ? 95 : 0; gens.push({ x: Math.cos(a) * d, y: Math.sin(a) * d - (q.gens > 1 ? 0 : 0), r: 20, hp, maxHp: hp, hitT: 0, dead: false }); }
      if (q.gens === 1) { P.y = 60; }
    }
  }
}
function mkQ(q, main, f) { const o = Object.assign({ main, cur: 0, done: false }, q); if (o.n) o.n = Math.max(1, Math.round(o.n * f)); if (o.sec) o.sec = Math.max(15, Math.round(o.sec * f)); return o; }
function qLabel(q) {
  switch (q.k) {
    case 'kill': return '몬스터 처치'; case 'killTag': return TAG_NAME[q.tag] + ' 처치'; case 'elite': return '정예 몬스터 처치';
    case 'collect': return QITEMS[q.item].ic + ' ' + QITEMS[q.item].n + ' 수집'; case 'survive': return '생존';
    case 'defend': return q.gens > 1 ? `발전기 ${q.gens}개 방어` : '벙커 코어 방어'; case 'portal': return '적 포탈 파괴';
    case 'egg': return '괴생명체 알 파괴'; case 'device': return '신전 장치 파괴'; case 'boss': return '보스 처치';
  }
  return '';
}
function qProgress(q) {
  if (q.k === 'survive' || q.k === 'defend') { const r = Math.max(0, q.sec - q.cur); return q.done ? '완료' : `${Math.floor(r / 60)}:${String(Math.floor(r % 60)).padStart(2, '0')}`; }
  if (q.k === 'boss') return q.done ? '완료' : G.bossState >= 1 ? '전투 중!' : '대기';
  return `${Math.min(q.cur, q.n)} / ${q.n}`;
}
function qAdd(k, v = 1, filter) {
  for (const q of G.quests) {
    if (q.done || q.k !== k) continue;
    if (filter && !filter(q)) continue;
    q.cur += v; if (q.cur >= q.n) completeQuest(q);
  }
}
function completeQuest(q) {
  if (q.done) return; q.done = true; q.doneT = G.time; AU.sfx('quest');
  texts.push({ x: P.x, y: P.y - 40, t: 0, v: q.main ? '✔ 목표 달성!' : '✔ 보조 목표 달성!', col: q.main ? '#69f0ae' : '#ffd54f', pl: 1, big: 1 });
}
function updateQuests(dt) {
  for (const q of G.quests) {
    if (q.done) continue;
    if (q.k === 'survive') { q.cur = G.t; if (q.cur >= q.sec) completeQuest(q); }
    if (q.k === 'defend') { q.cur = G.t; if (q.cur >= q.sec) completeQuest(q); else if (gens.length && gens.every(g => g.dead)) { G.failReason = q.gens > 1 ? '발전기가 모두 파괴되었습니다' : '벙커 코어가 파괴되었습니다'; playerDie(); return; } }
  }
  const mainRest = G.quests.filter(q => q.main && !q.done && q.k !== 'boss');
  if (mainRest.length === 0 && G.bossState === 0 && G.clearing === 0) {
    if (G.st.boss) { startBossWarning(); }
    else { G.clearing = 2.0; toast('🎉 임무 완료!', 1.8, '#69f0ae'); clearField(); }
  }
  if (G.clearing > 0) { G.clearing -= dt; if (G.clearing <= 0 && G.state === 'play') stageWin(); }
}
function clearField() {
  for (const e of enemies) if (!e.dead && !e.static) { e.dead = true; effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r, t: 0, dur: 0.3 }); dropGem(e.x, e.y, 1); }
  eprojs.length = 0; hazards.length = 0;
  for (const p of pickups) if (p.kind === 'gem' || p.kind === 'coin' || p.kind === 'qitem') p.mag = true;
}

/* ------------------------- 적 생성 ------------------------- */
function edgePos(margin = 50) {
  const hw = VW / 2 + margin, hh = VH / 2 + margin;
  let side = Math.floor(Math.random() * 4);
  if (P.moving && Math.random() < 0.35) side = Math.abs(P.lastMx) > Math.abs(P.lastMy) ? (P.lastMx > 0 ? 1 : 3) : (P.lastMy > 0 ? 2 : 0);
  if (side === 0) return [P.x + rand(-hw, hw), P.y - hh];
  if (side === 1) return [P.x + hw, P.y + rand(-hh, hh)];
  if (side === 2) return [P.x + rand(-hw, hw), P.y + hh];
  return [P.x - hw, P.y + rand(-hh, hh)];
}
function progress() { return Math.min(1, G.t / G.st.D); }
function spawnEnemy(type, x, y, o = {}) {
  const d = ET[type]; const el = !!o.elite; const sc = el ? 2.0 : 1;
  const p = progress(), late = G.t > G.st.D ? Math.min(0.6, (G.t - G.st.D) / G.st.D * 0.6) : 0;
  let hp = d.hp * G.hpMul * (o.obj ? (1 + G.stage * 0.12) * (type === 'device' && G.stage > 27 ? 0.7 : 1) : (1 + p * 3 + late * 3)) * (el ? 11 : 1);
  if (type === 'golden') hp = d.hp * G.hpMul * 2;
  const e = { id: ++G.eid, type, d, x, y, r: d.r * sc, hp, maxHp: hp, dmg: d.dmg * G.dmgMul * (el ? 1.4 : 1),
    spd: d.spd * rand(0.9, 1.1) * G.spdMul * (1 + p * 0.1) * (el ? 0.85 : 1), elite: el, face: 1, flash: 0, atkCd: 0, kx: 0, ky: 0,
    seed: Math.random() * 10, burn: 0, burnDps: 0, burnTick: 0, poison: 0, poisonDps: 0, slowT: 0, slowF: 1, stunT: 0, shredT: 0, chill: 0,
    st: 0, aiT: rand(0.5, 2), ang: 0, orbCd: 0, dead: false, alpha: 1, armor: d.armor || 0, static: d.ai === 'static', pal: d.pal, draw: d.draw, z: 0, life: 0 };
  if (el) { e.affix = pick(['fast', 'shield', 'aura']); if (e.affix === 'fast') e.spd *= 1.4; if (e.affix === 'shield') e.armor = Math.min(0.7, e.armor + 0.25); e.skill = o.skill || G.st.eliteSkill; e.skT = rand(2, 3.5); }
  if (o.tgtGen) e.tgtGen = true;
  enemies.push(e); return e;
}
function maxEnemies() { return Math.round((Q.level === 0 ? 130 : 200 + G.stage * 4) * G.st.crowd); }
function aliveCount() { let n = 0; for (const e of enemies) if (!e.dead) n++; return n; }
function director(dt) {
  const st = G.st, p = progress();
  const late = G.t > st.D ? Math.min(0.5, (G.t - st.D) / st.D * 0.5) : 0;
  const defend = G.quests.some(q => q.k === 'defend' && !q.done);
  if ((G.bossState === 0 || G.bossState === 2) && G.clearing === 0) {
    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      G.spawnT = lerp(0.7, 0.2, p) / st.crowd * (G.bossState === 2 ? 2.4 : 1) * (1 - late * 0.4);
      const batch = 1 + Math.floor(p * 4.5 + Math.random() * 1.5);
      let alive = aliveCount(); let ranged = 0; for (const e of enemies) if (!e.dead && e.d.ai === 'ranged') ranged++;
      for (let i = 0; i < batch && alive < maxEnemies(); i++, alive++) {
        let type = wpick(st.mobs);
        if (ET[type].ai === 'ranged' && ranged >= 3 + Math.floor(G.stage / 4)) type = st.mobs[0][0]; else if (ET[type].ai === 'ranged') ranged++;
        const [x, y] = edgePos(); spawnEnemy(type, x, y, { tgtGen: defend && Math.random() < 0.3 });
      }
    }
  }
  if (G.bossState === 1) { G.warnT -= dt; if (G.warnT <= 0) spawnBoss(st.boss); }
  G.mergeT -= dt; if (G.mergeT <= 0) { G.mergeT = 0.5; mergeGems(); }
  if (!G.legSpawned && G.clearing === 0) { G.legT -= dt; if (G.legT <= 0) spawnLegendChest(); }
  if (G.bossState !== 0 || G.clearing) return;
  // 무작위 이벤트
  G.evT -= dt;
  if (G.evT <= 0) { G.evT = rand(32, 46); randomEvent(); }
  // 정예 퀘스트가 있으면 정예를 꾸준히 등장시킴
  const eq = G.quests.find(q => q.k === 'elite' && !q.done);
  if (eq) { G.eliteT -= dt; if (G.eliteT <= 0) { G.eliteT = eq.n >= 6 ? 17 : 24; spawnElite(); } }
  // 수집 퀘스트 아이템 맵 배치
  const cq = G.quests.find(q => q.k === 'collect' && !q.done);
  if (cq) { G.itemT -= dt; if (G.itemT <= 0) { G.itemT = 22; const a = rand(0, TAU), d = rand(170, 300); dropPickup('qitem', P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, 0, cq.item, true); } }
  // 괴생명체 알
  const egq = G.quests.find(q => q.k === 'egg' && !q.done);
  if (egq) {
    let eggs = 0; for (const e of enemies) if (!e.dead && e.type === 'egg') eggs++;
    if (eggs < 4) { const a = rand(0, TAU), d = rand(260, 420), cx = P.x + Math.cos(a) * d, cy = P.y + Math.sin(a) * d; for (let i = 0; i < 3; i++) { const e = spawnEnemy('egg', cx + rand(-40, 40), cy + rand(-40, 40), { obj: 1 }); e.hatch = 32; } }
  }
}
// 정예 몬스터 고유 기술
function eliteSkill(e, dt, pdist) {
  if (e.stunT > 0) return;
  e.skT -= dt; if (e.skT > 0 || !onScreen(e, 20)) { if (e.shieldT > 0) e.shieldT -= dt; return; }
  const a = Math.atan2(P.y - e.y, P.x - e.x);
  switch (e.skill) {
    case 'nova': e.skT = 4.5; for (let i = 0; i < 12; i++) eShot(e.x, e.y, i / 12 * TAU + G.time, 150, e.dmg * 0.45, 'orb'); effects.push({ type: 'shock', x: e.x, y: e.y, r: e.r * 2, t: 0, dur: .35, col: '#ff9800' }); AU.sfx('eshot'); break;
    case 'charge': e.skT = 5; hazards.push({ kind: 'line', x: e.x, y: e.y, ang: a, len: 300, w: e.r * 1.6, t: 0, delay: 0.75, dmg: 0 }); e.st = 1; e.aiT = 0.75; e.dang = a; e.forceDash = 1; break;
    case 'summon': e.skT = 7; for (let i = 0; i < 3; i++) { const x = e.x + rand(-60, 60), y = e.y + rand(-60, 60); effects.push({ type: 'portal', x, y, t: 0, dur: .6 }); later(.5, () => { if (G.state === 'play' && aliveCount() < maxEnemies()) spawnEnemy(G.st.mobs[0][0], x, y); }); } break;
    case 'missile': e.skT = 4; for (let i = -1; i <= 1; i += 2) { eShot(e.x, e.y, a + i * 0.9, 120, e.dmg * 0.5, 'fire'); const b = eprojs[eprojs.length - 1]; b.hom = 1; b.life = 4; } AU.sfx('missile', 1.4); break;
    case 'blink': e.skT = 5; effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r * 1.4, t: 0, dur: .3 }); { const b2 = rand(0, TAU); e.x = P.x + Math.cos(b2) * 110; e.y = P.y + Math.sin(b2) * 110; } e.stunT = 0.4; for (let i = 0; i < 8; i++) eShot(e.x, e.y, i / 8 * TAU, 130, e.dmg * 0.4, 'plasma'); AU.sfx('portal'); break;
    case 'shield': e.skT = 6; e.shieldT = 2.5; AU.sfx('clank'); break;
  }
}
// 전설 보물상자: 스테이지마다 최소 1회 등장 (맵에 실제 배치)
function spawnLegendChest() {
  G.legSpawned = true; const a = rand(0, TAU), d = rand(230, 320);
  const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
  dropPickup('legend', x, y, 0, null, true);
  effects.push({ type: 'pillar', x, y, t: 0, dur: 2.5, col: '#ffd54f' });
  toast('✨ 전설 보물상자 출현! ✨<br><span style="font-size:15px">화살표 방향으로 가서 획득하세요</span>', 2.6, '#ffd54f'); AU.sfx('legend');
}
// 경험치 구슬 자동 합치기 (성능 유지)
function mergeGems() {
  const cells = new Map();
  for (const p of pickups) {
    if (p.dead || p.kind !== 'gem' || p.mag) continue;
    const k = Math.floor(p.x / 26) * 100003 + Math.floor(p.y / 26);
    const q = cells.get(k); if (q) { q.v += p.v; p.dead = true; q.pulse = 0.3; } else cells.set(k, p);
  }
}
function randomEvent() {
  const st = G.st, opts = [['horde', 3], ['elite', 2], ['supply', 2], ['golden', 1.5], ['secret', 1], ['power', 1.5]];
  if (st.n >= 3 && !st.special && !G.intruded && G.t > st.D * 0.35) opts.push(['intrude', 1.2]);
  const ev = wpick(opts);
  if (ev === 'horde') ringWave();
  else if (ev === 'elite') spawnElite();
  else if (ev === 'supply') { const a = rand(0, TAU), d = rand(90, 190), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d; effects.push({ type: 'drop', x, y, t: 0, dur: 1.3 }); later(1.3, () => { dropPickup('crate', x, y); G.shake = Math.max(G.shake, 3); AU.sfx('slam'); }); toast('📦 보급 상자 낙하!', 1.3, '#90caf9'); }
  else if (ev === 'golden') { const [x, y] = edgePos(); const e = spawnEnemy('golden', x, y); e.life = 22; toast('✨ 황금 몬스터 출현!', 1.4, '#ffd54f'); }
  else if (ev === 'secret') { const a = rand(0, TAU), d = rand(320, 440); dropPickup('secret', P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); toast('🗝️ 비밀 보물 상자 발견!', 1.4, '#ffd54f'); }
  else if (ev === 'power') { const a = rand(0, TAU), d = rand(110, 200); dropPickup('power', P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); toast('⚡ 공격력 강화 아이템!', 1.3, '#ff8a80'); }
  else if (ev === 'intrude') { G.intruded = true; const id = st.n <= 8 ? 'm_brute' : st.n <= 15 ? 'm_queen' : st.n <= 22 ? 'm_mech' : 'm_void'; spawnBoss(id, true); }
}
function ringWave() {
  const pool = G.st.mobs.filter(m => !ET[m[0]].ai || ['zig', 'flutter', 'chase', 'phase'].includes(ET[m[0]].ai));
  const type = (pool.length ? pick(pool) : G.st.mobs[0])[0];
  const n = Math.min(60, 14 + G.stage * 2), rad = Math.max(VW, VH) * 0.55;
  toast('⚠ 몬스터 대량 습격!', 1.2, '#ff7043');
  for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(type, P.x + Math.cos(a) * rad, P.y + Math.sin(a) * rad); }
}
function spawnElite() {
  const pool = G.st.mobs.filter(m => ET[m[0]].ai !== 'bomb' && ET[m[0]].ai !== 'summon');
  const type = Math.random() < 0.6 && ET[G.st.sig].ai !== 'bomb' ? G.st.sig : wpick(pool.length ? pool : G.st.mobs);
  const [x, y] = edgePos(); const e = spawnEnemy(type, x, y, { elite: true });
  const SKN = { nova: '충격 폭발', charge: '돌진', summon: '소환', missile: '유도탄', blink: '순간이동', shield: '보호막' };
  toast(`⚠ 정예 출현: ${e.d.n}<br><span style="font-size:16px">기술: ${SKN[e.skill] || ''}</span>`, 1.6, '#ff9800');
  AU.sfx('alarm'); G.flash = Math.max(G.flash, 0.18); G.flashCol = '255,120,0';
}
function startBossWarning() {
  G.bossState = 1; G.warnT = 3; AU.sfx('bosswarn'); AU.bgm(BOSSES[G.st.boss].final ? 'finalboss' : 'boss'); G.shake = Math.max(G.shake, 6);
  toast('⚠ 보스 출현 ⚠<br><span style="font-size:20px">' + BOSSES[G.st.boss].name + '</span>', 2.8, '#ff5252');
}
function spawnBoss(id, intrude) {
  const b = BOSSES[id]; if (!intrude) G.bossState = 2;
  const ang = rand(0, TAU), dist = Math.min(VW, VH) * 0.42;
  const hp = b.base * (1 + Math.min(G.lv, 55) * 0.045) * (b.mini ? 0.8 * (1 + G.stage * 0.03) : 1) * (save.settings.fast ? 0.4 : 1);
  const e = { id: ++G.eid, type: 'boss', bdef: b, d: { xp: 0 }, x: P.x + Math.cos(ang) * dist, y: P.y + Math.sin(ang) * dist, r: b.r, hp, maxHp: hp,
    dmg: b.dmg * G.dmgMul, spd: b.spd, face: 1, flash: 0, atkCd: 0, kx: 0, ky: 0, seed: 0, burn: 0, burnDps: 0, burnTick: 0, poison: 0, poisonDps: 0, slowT: 0, slowF: 1, stunT: 0, shredT: 0, chill: 0,
    boss: true, mini: !!intrude, ps: 'idle', pt: 2.0, sub: 0, lastPat: '', p2: false, dead: false, alpha: 1, orbCd: 0, z: 0, armor: 0.15, draw: b.draw, pal: b.pal };
  enemies.push(e); if (intrude) G.mini = e; else G.boss = e;
  G.shake = 14; G.flash = 0.5; G.flashCol = '255,40,40';
  for (let i = 0; i < 30; i++) addPart(e.x, e.y, rand(-200, 200), rand(-200, 200), '#b388ff', 0.8, 5);
  AU.sfx('slam'); if (intrude) { AU.sfx('alarm'); toast('👿 ' + b.name + '!', 2, '#ff5252'); }
}

/* ------------------------- 공간 분할 ------------------------- */
const CELL = 64; const grid = new Map(); const gpool = []; let gused = 0;
function buildGrid() {
  for (const a of grid.values()) a.length = 0; grid.clear(); gused = 0;
  for (const e of enemies) {
    if (e.dead) continue;
    const k = ((Math.floor(e.x / CELL) + 4096) << 13) | (Math.floor(e.y / CELL) + 4096);
    let a = grid.get(k); if (!a) { a = gpool[gused] || (gpool[gused] = []); gused++; a.length = 0; grid.set(k, a); }
    a.push(e);
  }
}
const QBUF = [];
function query(x, y, r, out = QBUF) {
  out.length = 0;
  const x0 = Math.floor((x - r - 40) / CELL), x1 = Math.floor((x + r + 40) / CELL), y0 = Math.floor((y - r - 40) / CELL), y1 = Math.floor((y + r + 40) / CELL);
  for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
    const a = grid.get(((cx + 4096) << 13) | (cy + 4096)); if (!a) continue;
    for (const e of a) { if (e.dead) continue; const dx = e.x - x, dy = e.y - y, rr2 = r + e.r; if (dx * dx + dy * dy <= rr2 * rr2) out.push(e); }
  }
  return out;
}
function nearest(x, y, maxD = 9999, skip) {
  let best = null, bd = maxD * maxD;
  for (const e of enemies) { if (e.dead || (skip && skip.has(e.id))) continue; const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e; } }
  return best;
}
function nearestK(x, y, maxD, k) {
  const arr = []; const m2 = maxD * maxD;
  for (const e of enemies) { if (e.dead) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < m2) arr.push([d, e]); }
  arr.sort((a, b) => a[0] - b[0]); return arr.slice(0, k).map(a => a[1]);
}
const DBUF = [];
function densest(maxD) {
  const cand = []; const m2 = maxD * maxD;
  for (const e of enemies) if (!e.dead && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < m2) cand.push(e);
  if (!cand.length) return null;
  let best = null, bn = -1;
  for (let i = 0; i < Math.min(14, cand.length); i++) { const e = cand[Math.floor(Math.random() * cand.length)]; const n = query(e.x, e.y, 70, DBUF).length + (e.boss ? 6 : 0); if (n > bn) { bn = n; best = e; } }
  return best;
}
function onScreen(e, m = 0) { return Math.abs(e.x - P.x) < VW / 2 + m && Math.abs(e.y - P.y) < VH / 2 + m; }

/* ------------------------- 피해 처리 ------------------------- */
function hitEnemy(e, base, o = {}) {
  if (e.dead) return;
  const W_ = o.wid && !o.noTrait ? WMAP[o.wid] : null, tr = W_ && W_.tr && W_.tr.length ? W_.tr : null;
  let dmg = base * P.dmgMul * (G.powerT > 0 ? 1.5 : 1) * (0.9 + Math.random() * 0.2); let crit = false;
  if (!o.noCrit && Math.random() < P.crit + (W_ && W_.critB || 0)) { dmg *= (W_ && W_.critB ? 2.4 : 2); crit = true; }
  if (e.markT > 0) dmg *= 1.25;
  if (tr && tr.includes('exec') && e.hp < e.maxHp * 0.3 && !e.boss) dmg *= 2;
  if (e.shieldT > 0) dmg *= 0.25;
  let arm = e.shredT > 0 ? 0 : (e.armor || 0); arm *= (1 - (o.ap || 0)); dmg *= (1 - arm); if (e.shredT > 0) dmg *= 1.2;
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.08; G.dmgDealt += dmg; if (o.wid) { e.lastW = o.wid; e.lastDmg = base; }
  if (G.wdmg && o.wid) G.wdmg[o.wid] = (G.wdmg[o.wid] || 0) + dmg;
  let kb = o.kb || 0; if (tr && tr.includes('knock')) kb = (o.tick || W_.m === 'cone' || W_.m === 'beam') ? (kb || 14) * 1.5 : (kb || 60) * 3;
  if (kb && !e.boss && !e.static) { const a = o.ang !== undefined ? o.ang : Math.atan2(e.y - P.y, e.x - P.x); const m = e.elite ? 0.3 : 1; e.kx += Math.cos(a) * kb * m; e.ky += Math.sin(a) * kb * m; }
  if (o.burn) { e.burn = 2.2; e.burnDps = Math.max(e.burnDps, o.burn); }
  if (o.poison) { e.poison = 3; e.poisonDps = Math.max(e.poisonDps, o.poison); }
  if (o.slow) { e.slowT = 1.5; e.slowF = Math.min(e.slowF, 1 - o.slow * (e.boss ? 0.5 : 1)); }
  if (o.stun && !e.boss && !e.static) e.stunT = Math.max(e.stunT, o.stun);
  if (o.freeze && !e.boss && !e.static) { e.chill += 0.1; if (e.chill > 1.6) { e.chill = 0; e.stunT = 1.0; e.frozen = 1.0; } }
  if (o.shred) e.shredT = 3;
  // ---- 무기 특성 효과 ----
  if (tr) {
    const cf = o.tick ? 0.18 : 1;
    for (const k of tr) switch (k) {
      case 'burn': e.burn = 2.2; e.burnDps = Math.max(e.burnDps, base * 0.4 * (o.tick ? 3 : 1)); break;
      case 'freeze': e.slowT = 1.6; e.slowF = Math.min(e.slowF, e.boss ? 0.75 : 0.5); if (!e.boss && !e.static) { e.chill += o.tick ? 0.05 : 0.22; if (e.chill > 1.6) { e.chill = 0; e.stunT = 1.1; e.frozen = 1.1; } } break;
      case 'poison': e.poison = 3.2; e.poisonDps = Math.max(e.poisonDps, base * 0.35 * (o.tick ? 3 : 1)); break;
      case 'shock': if (!o.chainHit && Math.random() < 0.32 * cf) { const t2 = nearest(e.x, e.y, 120, new Set([e.id])); if (t2) zap(e.x, e.y, t2, base * 0.55, { wid: o.wid, chainHit: 1, col: '#ffee58' }); } break;
      case 'stun': if (!e.boss && !e.static && Math.random() < 0.2 * cf) e.stunT = Math.max(e.stunT, 0.5); break;
      case 'knock': if (!e.boss && !e.static) e.stunT = Math.max(e.stunT, 0.12); break;
      case 'shred': e.shredT = 3; break;
      case 'mark': e.markT = 3; break;
      case 'vortex': if (Math.random() < 0.1 * cf && fields.length < 30) fields.push({ k: 'hole', x: e.x, y: e.y, r: 60, t: 0, dur: 0.7, dps: 0, pull: 170, tick: 0, col: '#b388ff', mini: 1 }); break;
    }
  }
  if (save.settings.dmgNum && texts.length < 70 && (!o.tick || Math.random() < 0.35)) texts.push({ x: e.x + rand(-6, 6), y: e.y - e.r, t: 0, v: dmg, crit, col: o.col });
  // 타격 효과 (치명타는 별도 연출)
  if (!o.tick && Q.level) {
    const hc = (W_ && W_.col) || '#fff59d';
    if (crit) { if (effects.length < 160) effects.push({ type: 'crit', x: e.x, y: e.y - e.r * .3, r: e.r, t: 0, dur: 0.22, col: hc }); AU.sfx('crit'); }
    else if (parts.length < QC.particles * 0.7) for (let i = 0; i < 2; i++) addPart(e.x + rand(-4, 4), e.y - e.r * .3, rand(-110, 110), rand(-110, 60), hc, 0.18, 2.5);
  }
  if (!o.silent && !crit) AU.sfx(arm > 0.25 ? 'clank' : W_ && W_.c === 'energy' ? 'hitE' : W_ && (W_.c === 'blast' || (W_.dmg || 0) > 30) ? 'hitH' : 'hit');
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  if (e.dead) return; e.dead = true;
  const W_ = e.lastW ? WMAP[e.lastW] : null, tr = W_ && W_.tr;
  const big = e.boss || e.elite || (e.lastDmg || 0) >= 40 || (W_ && (W_.c === 'blast' || W_.c === 'future'));
  const n = e.boss ? 60 : e.elite ? 22 : big ? 10 : 6;
  const col = PAL[e.pal] ? PAL[e.pal].a : '#b0bec5';
  for (let i = 0; i < n; i++) addPart(e.x, e.y, rand(-120, 120) * (e.boss ? 2 : big ? 1.4 : 1), rand(-140, 80) * (e.boss ? 2 : 1), col || '#fff', rand(0.3, 0.6), rand(2, 4.5), 200);
  if (big && !e.boss && effects.length < 150) { effects.push({ type: 'shock', x: e.x, y: e.y, r: e.r * 2.2, t: 0, dur: 0.3, col: W_ ? W_.col : '#ffccbc' }); if (e.elite || (e.lastDmg || 0) > 80) G.shake = Math.max(G.shake, 2.5); }
  else effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r, t: 0, dur: 0.3 });
  AU.sfx('die');
  if (e.lastW) { G.wkills[e.lastW] = (G.wkills[e.lastW] || 0) + 1; }
  if (e.boss) { bossDefeated(e); return; }
  if (e.static) { // 퀘스트 구조물
    if (e.type === 'portal') { qAdd('portal'); explode(e.x, e.y, 60, 0, false, '#b388ff'); toast('🌀 포탈 파괴!', 1, '#b388ff'); }
    if (e.type === 'egg') qAdd('egg');
    if (e.type === 'device') { qAdd('device'); explode(e.x, e.y, 70, 0, false, '#ffd600'); toast('⚙️ 장치 파괴!', 1, '#ffd600'); }
    dropGem(e.x, e.y, e.d.xp); return;
  }
  G.kills++;
  qAdd('kill');
  const tag = e.d.tag; G.tagKills[tag] = (G.tagKills[tag] || 0) + 1;
  qAdd('killTag', 1, q => q.tag === tag);
  // 처치 시 특성 / 상자 버프
  if (tr && tr.includes('leech')) { G.leechAcc = (G.leechAcc || 0) + 0.7 + G.stage * 0.03; if (G.leechAcc >= 1) { const h = Math.floor(G.leechAcc); G.leechAcc -= h; P.hp = Math.min(P.maxHp, P.hp + h); } }
  if (G.buff && G.buff.vamp && Math.random() < 0.25) P.hp = Math.min(P.maxHp, P.hp + 1 + G.stage * 0.05);
  if (tr && tr.includes('nova') && Math.random() < 0.35) explode(e.x, e.y, 50, (e.lastDmg || 10) * 0.7, true, '#ffab40', { wid: e.lastW, noTrait: 1 });
  if (e.elite) {
    G.elitesKilled++; qAdd('elite');
    if (Math.random() < 0.35) { const id = pickDropWeapon(2); if (id) { dropPickup('wdrop', e.x + 14, e.y, 0, id); toast('🔫 정예가 무기를 떨어뜨렸다!', 1.3, '#64b5f6'); } }
  }
  if (e.d.split) for (let i = 0; i < 2; i++) { const s = spawnEnemy(e.d.split, e.x + rand(-8, 8), e.y + rand(-8, 8)); s.kx = rand(-150, 150); s.ky = rand(-150, 150); }
  if (e.d.ai === 'bomb') explode(e.x, e.y, 34, 0, false);
  if (e.type === 'golden') { for (let i = 0; i < 18; i++) dropPickup('coin', e.x + rand(-30, 30), e.y + rand(-30, 30), randi(2, 4)); toast('💰 황금 몬스터 처치!', 1.2, '#ffd54f'); }
  if (!e.d.noDrop || Math.random() < 0.4) dropGem(e.x, e.y, e.elite ? 25 : e.d.xp);
  if (Math.random() < (e.elite ? 1 : 0.035)) dropPickup('coin', e.x + rand(-10, 10), e.y + rand(-10, 10), e.elite ? randi(15, 30) : randi(1, 3));
  if (Math.random() < 0.012) dropPickup('meat', e.x, e.y);
  if (Math.random() < 0.003) dropPickup('magnet', e.x, e.y);
  if (e.elite) dropPickup('chest', e.x, e.y);
  const cq = G.quests.find(q => q.k === 'collect' && !q.done);
  if (cq) { G.qPity++; if (Math.random() < 0.008 + 0.0012 * G.qPity || e.elite) { G.qPity = 0; dropPickup('qitem', e.x, e.y, 0, cq.item); } }
}
function damagePlayer(dmg, src) {
  if (P.inv > 0 || G.state !== 'play' || P.hp <= 0 || G.clearing > 0) return;
  if (G.buff && G.buff.barrier > 0) { G.buff.barrier--; P.inv = 0.5; effects.push({ type: 'shock', x: P.x, y: P.y, r: 40, t: 0, dur: 0.35, col: '#80d8ff' }); AU.sfx('clank'); texts.push({ x: P.x, y: P.y - 24, t: 0, v: '보호막!', col: '#80d8ff', pl: 1 }); return; }
  dmg = Math.max(1, Math.round(dmg * (1 - P.armor)));
  if (G.dmgLog) G.dmgLog[src || '?'] = (G.dmgLog[src || '?'] || 0) + dmg;
  P.hp -= dmg; P.inv = 0.35; P.hurtT = 0.25; G.flash = Math.max(G.flash, 0.25); G.flashCol = '255,0,0';
  G.shake = Math.max(G.shake, 4); AU.sfx('hurt');
  texts.push({ x: P.x, y: P.y - 20, t: 0, v: dmg, crit: false, col: '#ff5252', pl: 1 });
  if (P.hp <= 0) { P.hp = 0; playerDie(); }
}
// 드롭 무기 선택: 이번 스테이지 무기 중 미보유 우선 (maxTier 이하)
function pickDropWeapon(maxTier, bossMode) {
  const st = G.st.wp.map(id => WMAP[id]).filter(w => w.t <= maxTier);
  const unfound = st.filter(w => !save.codex[w.id] && !G.weapons.some(x => x.id === w.id));
  const pool = unfound.length ? unfound : (bossMode ? [] : st.filter(w => !G.weapons.some(x => x.id === w.id)));
  if (!pool.length) return null;
  const wt = w => bossMode ? [0, 1, 2, 3, 3][w.t] : [0, 3, 1.5, 0.4, 0.2][w.t];
  return wpick(pool.map(w => [w.id, wt(w)]));
}
// 무기 획득 처리 (보스·정예·상자 공통)
function acquireWeapon(id, src) {
  const W_ = WMAP[id]; if (!W_) return;
  const c = codexOf(id); const first = !G.knownBefore[id] && !G.newFound.includes(id);
  if (first) G.newFound.push(id);
  const owned = G.weapons.find(w => w.id === id);
  AU.sfx(W_.t >= 3 ? 'legend' : 'item');
  if (owned) { if (owned.lv < WMAX) { owned.lv++; c.maxLv = Math.max(c.maxLv || 1, owned.lv); toast(`⬆ ${W_.nm} Lv${owned.lv}`, 1.3, '#ffd54f'); } else { G.gold += 30 * G.stage; toast(`💰 강화 재료로 전환 +${30 * G.stage}G`, 1.3, '#ffd54f'); } return; }
  if (G.weapons.length < WSLOTS) { addWeapon(id); toast(`🔫 신규 무기 획득!<br><span style="font-size:18px;color:${TIER_COL[W_.t]}">${W_.nm}</span>`, 1.8, '#fff'); return; }
  G.swapQ = G.swapQ || []; G.swapQ.push(id);
}
function explode(x, y, r, dmg, friendly, col = '#ff9800', o = {}) {
  effects.push({ type: 'boom', x, y, r, t: 0, dur: 0.35, col });
  const np = Q.level ? Math.min(22, 8 + r / 6) : 6;
  for (let i = 0; i < np; i++) { const a = rand(0, TAU), s = rand(40, 180) * r / 50; addPart(x, y, Math.cos(a) * s, Math.sin(a) * s, pick(['#ffeb3b', '#ff9800', '#ff5722', col]), rand(0.25, 0.55), rand(2.5, 5)); }
  AU.sfx(r > 85 ? 'bigboom' : 'boom');
  if (friendly) { for (const e of query(x, y, r).slice()) hitEnemy(e, dmg, Object.assign({ kb: 120, ang: Math.atan2(e.y - y, e.x - x), silent: true }, o)); }
}

/* ------------------------- 드롭 ------------------------- */
function dropGem(x, y, v) {
  if (pickups.length > 320) { for (let i = 0; i < pickups.length; i++) { const p = pickups[i]; if (p.kind === 'gem' && !p.dead) { p.v += v; return; } } }
  pickups.push({ kind: 'gem', x, y, v, t: 0, mag: false, vx: 0, vy: 0 });
}
function dropPickup(kind, x, y, v = 0, item, placed) { pickups.push({ kind, x, y, v, item, t: 0, mag: false, vx: placed ? 0 : rand(-40, 40), vy: placed ? 0 : rand(-80, -40), z: placed ? undefined : 0, placed: !!placed }); }
function gainXp(v) { G.xp += v * P.xpMul; while (G.xp >= G.need) { G.xp -= G.need; G.lv++; G.need = xpNeed(G.lv); G.pendingLv++; } }
function collect(p) {
  switch (p.kind) {
    case 'gem': gainXp(p.v); AU.sfx('gem'); break;
    case 'coin': { const g = Math.round(p.v * P.greed); G.gold += g; AU.sfx('coin'); texts.push({ x: P.x, y: P.y - 26, t: 0, v: '+' + g + 'G', col: '#ffd54f', pl: 1 }); break; }
    case 'meat': heal(25); break;
    case 'magnet': for (const q of pickups) if (q.kind === 'gem') q.mag = true; AU.sfx('heal'); toast('🧲 자석!', 0.8, '#90caf9'); break;
    case 'qitem': AU.sfx('item'); qAdd('collect', 1, q => q.item === p.item); texts.push({ x: P.x, y: P.y - 30, t: 0, v: QITEMS[p.item].ic + '+1', col: QITEMS[p.item].col, pl: 1 }); break;
    case 'wdrop': acquireWeapon(p.item, 'drop'); break;
    case 'legend': G.legGot = true; openLegendChest(); break;
    case 'power': G.powerT = 15; AU.sfx('power'); toast('⚡ 공격력 1.5배 (15초)!', 1.4, '#ff8a80'); break;
    case 'crate': { heal(30); const g = Math.round(10 * G.stage * P.greed); G.gold += g; for (let i = 0; i < 8; i++) dropGem(p.x + rand(-30, 30), p.y + rand(-30, 30), 3); qAdd('collect', 1, q => q.item === 'supply'); AU.sfx('chest'); toast(`📦 보급! 체력 회복 +${g}G`, 1.2, '#90caf9'); break; }
    case 'chest': case 'secret': {
      AU.sfx('chest'); const g = Math.round(randi(25, 45) * (p.kind === 'secret' ? 2.5 : 1) * (1 + G.stage * 0.15) * P.greed); G.gold += g;
      G.pendingLv++; effects.push({ type: 'pillar', x: p.x, y: p.y, t: 0, dur: 1.0, col: '#ffd54f' });
      toast(`🎁 ${p.kind === 'secret' ? '비밀 보물 상자' : '보물 상자'}! +${g}G`, 1.4, '#ffd54f'); break;
    }
  }
}
function heal(v) { const before = P.hp; P.hp = Math.min(P.maxHp, P.hp + v); AU.sfx('heal'); texts.push({ x: P.x, y: P.y - 22, t: 0, v: '+' + Math.round(P.hp - before), col: '#69f0ae', pl: 1 }); for (let i = 0; i < 10; i++) addPart(P.x + rand(-12, 12), P.y + rand(-5, 10), 0, rand(-60, -30), '#69f0ae', 0.6, 3); }
function addPart(x, y, vx, vy, col, life, size, grav = 0) { if (parts.length >= QC.particles) return; parts.push({ x, y, vx, vy, col, life, max: life, size, grav }); }

/* =====================================================================
   무기 50종 — 발사 방식 엔진
   ===================================================================== */
function wstat(w) {
  const b = WMAP[w.id], lv = w.lv, e = w.evo ? EVOS[w.id].mod : null;
  const s = Object.assign({}, b); if (e) Object.assign(s, e);
  const dm = (1 + 0.22 * (lv - 1)) * (e && e.dmgMul || 1) * (b.cal || 1);
  if (s.dmg) s.dmg *= dm; if (s.dps) s.dps *= dm; if (s.shardDmg) s.shardDmg *= dm;
  s.cd = (b.cd || 0) * (1 - 0.05 * (lv - 1)) * (e && e.cdMul || 1) * P.cdMul; if (s.fire) s.fire *= P.cdMul * (1 - 0.05 * (lv - 1));
  const m = s.m; let n = s.n || 1;
  if (s.field) { s.field = Object.assign({}, s.field); s.field.dps *= dm; }
  if (lv >= 3) switch (m) {
    case 'gun': case 'laser': case 'rocket': n++; break; case 'lob': if (s.grav) s.boom *= 1.2; else n++; break;
    case 'cannon': s.pierce += 2; s.size *= 1.2; break; case 'rail': s.w *= 1.4; break; case 'beam': s.dur *= 1.3; s.w *= 1.3; break;
    case 'spin': case 'drone': case 'turret': n++; break; case 'orbital': s.boom *= 1.2; break; case 'plasma': s.size *= 1.25; s.boom *= 1.25; break;
    case 'chain': s.chain++; break; case 'cone': s.range *= 1.2; break; case 'tazer': s.targets += 2; break; case 'mine': n += 2; break;
    case 'ion': s.r *= 1.3; break; case 'hole': s.r *= 1.25; break; case 'split': s.shards += 3; break;
    case 'flak': s.shards += 3; break; case 'barrage': n += 2; break; case 'nova': s.r *= 1.2; break; case 'boomer': case 'wave': case 'saw': case 'harpoon': n++; break;
  }
  if (lv >= 5) switch (m) {
    case 'gun': n++; break; case 'laser': n++; s.pierce = (s.pierce || 1) + 2; break; case 'rocket': n++; s.boom *= 1.2; break;
    case 'lob': s.boom *= 1.25; if (s.field) s.field.r *= 1.25; break; case 'cannon': s.size *= 1.25; s.boom *= 1.3; break;
    case 'rail': n++; s.fan = s.fan || 0.12; break; case 'beam': n++; break; case 'spin': s.len *= 1.25; break;
    case 'plasma': s.size *= 1.3; break; case 'chain': s.targets++; break; case 'cone': s.dps *= 1.3; s.arc *= 1.2; break;
    case 'tazer': s.targets += 2; s.stun = 0.3; break; case 'drone': n++; s.cd *= 0.8; break; case 'turret': s.life *= 1.5; break;
    case 'mine': n += 2; s.boom *= 1.25; break; case 'orbital': case 'ion': n++; break; case 'hole': s.dur *= 1.3; break;
    case 'split': s.shards += 4; s.split2 = 1; break;
    case 'flak': s.shards += 3; s.shardDmg *= 1.2; break; case 'barrage': n += 2; s.boom *= 1.2; break; case 'nova': s.twice = 1; break;
    case 'boomer': n++; s.size *= 1.3; break; case 'wave': n++; s.pierce = (s.pierce || 1) + 2; break; case 'saw': n++; s.rot *= 1.3; break; case 'harpoon': n++; s.stunT = 1.0; break;
  }
  if (e && e.nAdd) n += e.nAdd;
  if (m === 'chain') s.targets += P.projAdd; else if (['gun', 'laser', 'rocket', 'lob', 'drone', 'orbital', 'barrage', 'boomer', 'wave', 'saw', 'harpoon'].includes(m)) n += P.projAdd;
  s.n = n;
  if (['gun', 'laser', 'cannon', 'wave'].includes(m)) s.pierce = (s.pierce || 1) + P.pierceAdd;
  const A = P.areaMul;
  if (s.boom) s.boom *= A; if (s.field) s.field.r *= A; if (s.w) s.w *= A; if (s.splash) s.splash *= A;
  if (m === 'cone') s.range *= A * (e && e.rangeMul || 1);
  if (m === 'ion' || m === 'hole' || m === 'nova' || m === 'saw') s.r *= A; if (m === 'spin') s.len *= A;
  s.size = (s.size || 1) * (1 + 0.06 * (lv - 1)); s.lv = lv;
  return s;
}
function setAim(a, w, s) { P.aim = a; P.atkT = 0.16; P.atkW = w.id; P.recoil = Math.min(4, (s.dmg || 10) / 12 + 1); if (Math.abs(Math.cos(a)) > 0.2) P.face = Math.cos(a) > 0 ? 1 : -1; }
function muzzle(a) { return [P.x + Math.cos(a) * 18, P.y - 4 + Math.sin(a) * 18]; }
function flash(a, col, size = 1) { const [x, y] = muzzle(a); effects.push({ type: 'flash', x, y, ang: a, col, t: 0, dur: 0.06, size }); }
function wsnd(s) { AU.sfx(s.s[0], s.s[1]); }

function updateWeapons(dt) {
  for (const w of G.weapons) {
    const s = wstat(w), m = s.m;
    if (m === 'spin') { updateSpin(w, s, dt); continue; }
    if (m === 'cone') { updateCone(w, s, dt); continue; }
    if (m === 'drone') { updateDrones(w, s, dt); continue; }
    if (m === 'saw') { updateSaw(w, s, dt); continue; }
    if (w.beamT > 0) updateBeam(w, s, dt);
    if (w.burstLeft > 0) { w.burstT -= dt; if (w.burstT <= 0) { w.burstLeft--; w.burstT = s.gap; const t = nearest(P.x, P.y, s.range); fireGun(w, s, t ? Math.atan2(t.y - P.y, t.x - P.x) : w.burstAng, true); } }
    w.cd -= dt; if (w.cd > 0) continue;
    const range = s.range || 300;
    let tgt;
    if (m === 'orbital' || m === 'hole' || m === 'ion' || m === 'barrage') tgt = densest(Math.min(VW, VH) * 0.6);
    else if (m === 'nova') tgt = nearest(P.x, P.y, s.r * 0.95);
    else if (m === 'lob' && s.far) tgt = densest(range) || nearest(P.x, P.y, range);
    else if (m === 'turret' || m === 'mine') tgt = nearest(P.x, P.y, 330);
    else tgt = nearest(P.x, P.y, range);
    if (!tgt) { w.cd = 0.12; if (s.spin) w.spinV = Math.max(0, (w.spinV || 0) - 0.5); continue; }
    const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
    w.cd = s.cd;
    switch (m) {
      case 'gun': fireGun(w, s, a); if (s.burst) { w.burstLeft = s.burst - 1; w.burstT = s.gap; w.burstAng = a; } break;
      case 'laser': fireLaser(w, s, a); break;
      case 'rocket': fireRocket(w, s, tgt); break;
      case 'lob': fireLob(w, s, tgt); break;
      case 'cannon': fireCannon(w, s, a); break;
      case 'rail': fireRail(w, s, a); break;
      case 'beam': w.beamT = s.dur; w.beamAng = a; w.beamTick = 0; setAim(a, w, s); wsnd(s); break;
      case 'plasma': firePlasma(w, s, a); break;
      case 'chain': fireChain(w, s); break;
      case 'tazer': fireTazer(w, s); break;
      case 'turret': deployTurret(w, s); break;
      case 'mine': layMines(w, s); break;
      case 'orbital': fireOrbital(w, s, tgt); break;
      case 'ion': fireIon(w, s, tgt); break;
      case 'hole': fireHole(w, s, tgt); break;
      case 'split': fireSplit(w, s, a); break;
      case 'flak': fireFlak(w, s, tgt); break;
      case 'barrage': fireBarrage(w, s); break;
      case 'nova': fireNova(w, s); if (s.twice) later(0.35, () => { if (G.state === 'play') fireNova(w, s); }); break;
      case 'boomer': fireBoomer(w, s, a); break;
      case 'wave': fireWave(w, s, a); break;
      case 'harpoon': fireHarpoon(w, s, a); break;
    }
  }
}
function mkProj(o) {
  o.hit = o.hit || new Set(); o.life = o.life || 1;
  const W_ = o.wid ? WMAP[o.wid] : null;
  if (W_ && W_.tr && W_.tr.length && !o.lob && !o.noTr) { const t = W_.tr; if (t.includes('ric')) o.ric = 2; if (t.includes('split')) o.splitT = 1; if (t.includes('blast')) o.blastT = 1; if (t.includes('homing')) o.homT = 3.2; o.trCol = W_.col2; }
  if (projs.length > 650 && (o.kind === 'bullet' || o.kind === 'tracer' || o.kind === 'shard' || o.kind === 'needle')) { o.dead = true; return o; }
  projs.push(o); return o;
}
function fireGun(w, s, a, fromBurst) {
  if (s.spin) { w.spinV = Math.min(1, (w.spinV || 0) + 0.05); w.cd = s.cd / (0.35 + 0.65 * w.spinV); }
  setAim(a, w, s);
  const dirs = s.twin ? [a, a + Math.PI] : [a];
  for (const base of dirs) for (let i = 0; i < s.n; i++) {
    const ang = base + (i - (s.n - 1) / 2) * (s.fanG || 0.08) + rand(-s.spread, s.spread);
    const [x, y] = muzzle(base);
    mkProj({ kind: s.pk, x, y, vx: Math.cos(ang) * s.spd, vy: Math.sin(ang) * s.spd, ang, r: 4 * s.size, dmg: s.dmg, pierce: s.pierce || 1, life: s.range / s.spd, col: s.col, size: s.size, boom: s.boom, ap: s.ap, splash: s.splash, field: s.field, shred: s.shred, wid: w.id, lv: s.lv, kb: s.kb || (s.pk === 'slug' ? 90 : 40) });
  }
  flash(a, s.col, s.size); wsnd(s);
  if (Q.level >= 1 && s.pk !== 'acid' && s.pk !== 'needle') addPart(P.x, P.y - 4, rand(-60, -20) * P.face, rand(-90, -50), s.size > 1.2 ? '#ffb300' : '#ffca28', 0.45, s.size > 1.2 ? 3 : 2, 420);
}
function fireLaser(w, s, a) {
  setAim(a, w, s);
  for (let i = 0; i < s.n; i++) {
    const ang = a + (s.fan ? (i - (s.n - 1) / 2) * s.fan : (i - (s.n - 1) / 2) * 0.06);
    const [x, y] = muzzle(a);
    mkProj({ kind: 'lbolt', x, y, vx: Math.cos(ang) * s.spd, vy: Math.sin(ang) * s.spd, ang, r: 5, dmg: s.dmg, pierce: s.pierce || 1, life: s.range / s.spd, col: s.col, len: s.len * s.size, wid: w.id, kb: 30 });
  }
  flash(a, s.col); wsnd(s);
}
function fireRocket(w, s, tgt) {
  for (let i = 0; i < s.n; i++) later(i * (s.salvo || 0.1), () => {
    if (G.state !== 'play') return;
    const t = (tgt && !tgt.dead) ? tgt : nearest(P.x, P.y, s.range); if (!t) return;
    let x, y, a;
    if (s.sky) { x = P.x + rand(-80, 80); y = P.y - 240; a = Math.atan2(t.y - y, t.x - x); }
    else { a = Math.atan2(t.y - P.y, t.x - P.x) + (s.n > 1 ? rand(-0.5, 0.5) : 0); [x, y] = muzzle(a); setAim(Math.atan2(t.y - P.y, t.x - P.x), w, s); }
    mkProj({ kind: s.pk, x, y, vx: Math.cos(a) * s.spd * 0.45, vy: Math.sin(a) * s.spd * 0.45, ang: a, acc: s.spd, r: 6, dmg: s.dmg, pierce: 1, life: (s.range / s.spd) * 1.6, col: s.col, boom: s.boom, homing: s.homing, target: t, wid: w.id, zap: s.zap, size: s.size, explodeEnd: 1 });
    wsnd(s);
  });
}
function fireLob(w, s, tgt) {
  setAim(Math.atan2(tgt.y - P.y, tgt.x - P.x), w, s);
  for (let i = 0; i < s.n; i++) {
    const tx = tgt.x + (i ? rand(-50, 50) : 0), ty = tgt.y + (i ? rand(-50, 50) : 0);
    const [x, y] = muzzle(Math.atan2(ty - P.y, tx - P.x));
    mkProj({ kind: s.pk, lob: 1, x0: x, y0: y, tx, ty, x, y, vx: 0, vy: 0, ang: 0, T: s.flight * (0.9 + i * 0.08), tt: 0, r: 0, dmg: s.dmg, life: 9, col: s.col, boom: s.boom, cluster: s.cluster, field: s.field, grav: s.grav, burn: s.burn, wid: w.id, size: s.size, nohit: 1 });
  }
  flash(Math.atan2(tgt.y - P.y, tgt.x - P.x), s.col, 1.2); wsnd(s);
}
function fireCannon(w, s, a) {
  setAim(a, w, s); const [x, y] = muzzle(a);
  mkProj({ kind: 'cball', x, y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, ang: a, r: s.size, dmg: s.dmg, pierce: s.pierce, life: s.range / s.spd, col: s.col, boom: s.boom, ap: s.ap, kb: s.kb, shards: s.shards, wid: w.id, size: s.size, explodeEnd: 1 });
  flash(a, '#ffab40', 2); wsnd(s); G.shake = Math.max(G.shake, 2); P.recoil = 6;
}
function fireRail(w, s, a) {
  setAim(a, w, s);
  const shoot = () => {
    if (G.state !== 'play') return;
    for (let i = 0; i < s.n; i++) {
      const ang = P.aim + (i - (s.n - 1) / 2) * (s.fan || 0);
      const [x1, y1] = muzzle(P.aim), x2 = x1 + Math.cos(ang) * s.range, y2 = y1 + Math.sin(ang) * s.range;
      effects.push({ type: 'rail', x1, y1, x2, y2, w: s.w, col: s.col, t: 0, dur: 0.28 });
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      for (const e of query(mx, my, s.range / 2 + 10).slice()) { if (segDist2(e.x, e.y, x1, y1, x2, y2) < (s.w / 2 + e.r) ** 2) hitEnemy(e, s.dmg, { ap: s.ap, kb: 60, ang, wid: w.id, silent: true }); }
    }
    wsnd(s); P.recoil = 5; G.shake = Math.max(G.shake, s.dmg > 80 ? 4 : 1.5);
  };
  if (s.charge > 0) { effects.push({ type: 'charge', t: 0, dur: s.charge, col: s.col }); later(s.charge, shoot); } else shoot();
}
function updateBeam(w, s, dt) {
  w.beamT -= dt; const t = nearest(P.x, P.y, s.len + 40);
  if (t) { const ta = Math.atan2(t.y - P.y, t.x - P.x); w.beamAng += angDiff(ta, w.beamAng) * Math.min(1, dt * 6); }
  P.aim = w.beamAng; P.atkT = 0.1; P.atkW = w.id; if (Math.abs(Math.cos(w.beamAng)) > 0.2) P.face = Math.cos(w.beamAng) > 0 ? 1 : -1;
  w.beamTick -= dt;
  const n = s.n;
  w.beams = [];
  for (let i = 0; i < n; i++) {
    const ang = w.beamAng + (i - (n - 1) / 2) * 0.22;
    const [x1, y1] = muzzle(ang), x2 = x1 + Math.cos(ang) * s.len, y2 = y1 + Math.sin(ang) * s.len;
    w.beams.push([x1, y1, x2, y2]);
    if (w.beamTick <= 0) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; for (const e of query(mx, my, s.len / 2 + 10).slice()) if (segDist2(e.x, e.y, x1, y1, x2, y2) < (s.w / 2 + e.r) ** 2) hitEnemy(e, s.dps * 0.1, { silent: true, tick: 1, wid: w.id, burn: w.id === 'doomlaser' ? 6 : 0 }); }
    if (Math.random() < 0.5) addPart(x2, y2, rand(-80, 80), rand(-80, 80), s.col, 0.25, 3);
  }
  if (w.beamTick <= 0) { w.beamTick = 0.1; AU.sfx('beam', s.s[1]); }
  w.beamS = s;
  if (w.beamT <= 0) w.beams = null;
}
function updateSpin(w, s, dt) {
  w.ang = (w.ang || 0) + s.rot * dt; w.tick = (w.tick || 0) - dt; w.beams = []; w.beamS = s;
  for (let i = 0; i < s.n; i++) {
    const a = w.ang + i / s.n * TAU, x1 = P.x, y1 = P.y - 4, x2 = x1 + Math.cos(a) * s.len, y2 = y1 + Math.sin(a) * s.len;
    w.beams.push([x1, y1, x2, y2]);
    for (const e of query((x1 + x2) / 2, (y1 + y2) / 2, s.len / 2 + 8).slice()) if (e.orbCd <= 0 && segDist2(e.x, e.y, x1, y1, x2, y2) < (s.w / 2 + e.r) ** 2) { e.orbCd = 0.35; hitEnemy(e, s.dps * 0.6, { silent: true, wid: w.id, kb: 60 }); }
  }
  if (w.tick <= 0) { w.tick = 0.15; if (enemies.length && Math.random() < .3) AU.sfx('beam', s.s[1]); }
}
function firePlasma(w, s, a) {
  setAim(a, w, s); const [x, y] = muzzle(a); const t = nearest(P.x, P.y, s.range); const dist = t ? Math.hypot(t.x - x, t.y - y) + 50 : s.range;
  mkProj({ kind: 'plasma', x, y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, ang: a, r: s.size, dmg: s.dmg, pierce: 999, life: Math.min(s.range, dist) / s.spd, col: s.col, boom: s.boom, burn: s.burn, storm: s.storm, wid: w.id, size: s.size, explodeEnd: 1 });
  flash(a, s.col, 1.5); wsnd(s);
}
function zap(x1, y1, t, dmg, o) {
  effects.push({ type: 'bolt', pts: [[x1, y1], [t.x, t.y]], t: 0, dur: 0.18, seed: Math.random() * 100, col: o.col });
  hitEnemy(t, dmg, Object.assign({ silent: true }, o));
}
function fireChain(w, s) {
  const ts = nearestK(P.x, P.y, s.range, s.targets); if (!ts.length) return;
  setAim(Math.atan2(ts[0].y - P.y, ts[0].x - P.x), w, s);
  for (const t of ts) {
    const pts = [muzzle(Math.atan2(t.y - P.y, t.x - P.x)), [t.x, t.y]]; const hit = new Set([t.id]);
    hitEnemy(t, s.dmg, { silent: true, stun: s.stun, wid: w.id }); let cur = t;
    for (let c = 0; c < s.chain; c++) {
      let best = null, bd = 140 * 140;
      for (const e of query(cur.x, cur.y, 140)) { if (hit.has(e.id) || e.dead) continue; const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2; if (d < bd) { bd = d; best = e; } }
      if (!best) break; hit.add(best.id); pts.push([best.x, best.y]); hitEnemy(best, s.dmg * 0.8, { silent: true, stun: s.stun, wid: w.id }); cur = best;
    }
    effects.push({ type: 'bolt', pts, t: 0, dur: 0.22, seed: Math.random() * 100, col: s.col });
  }
  wsnd(s);
}
function fireTazer(w, s) {
  const ts = nearestK(P.x, P.y, s.range, s.targets); if (!ts.length) return;
  setAim(Math.atan2(ts[0].y - P.y, ts[0].x - P.x), w, s);
  for (const t of ts) zap(P.x, P.y - 4, t, s.dmg, { stun: s.stun || 0.12, wid: w.id, col: s.col });
  wsnd(s);
}
function updateCone(w, s, dt) {
  const t = nearest(P.x, P.y, s.range + 25); w.coneOn = !!t; w.coneS = s;
  if (!t) return;
  const a = Math.atan2(t.y - P.y, t.x - P.x); w.coneAng = a; P.aim = a; P.atkT = 0.1; P.atkW = w.id; if (Math.abs(Math.cos(a)) > 0.2) P.face = Math.cos(a) > 0 ? 1 : -1;
  w.tick = (w.tick || 0) - dt;
  const [mx, my] = muzzle(a);
  const np = Q.level ? 3 : 1;
  for (let i = 0; i < np; i++) { const pa = a + rand(-s.arc, s.arc), sp = s.range * rand(2.2, 3.2); addPart(mx, my, Math.cos(pa) * sp, Math.sin(pa) * sp, w.id === 'freezer' ? pick(['#e1f5fe', '#80d8ff', '#fff']) : pick(['#ffeb3b', '#ff9800', '#ff5722', '#ff3d00']), 0.32, rand(4, 8)); }
  if (w.tick <= 0) {
    w.tick = 0.1;
    for (const e of query(mx, my, s.range).slice()) {
      const ea = Math.atan2(e.y - my, e.x - mx); if (Math.abs(angDiff(ea, a)) > s.arc + 0.15 && Math.hypot(e.x - mx, e.y - my) > e.r + 10) continue;
      hitEnemy(e, s.dps * 0.1, { silent: true, tick: 1, wid: w.id, burn: s.burn, slow: s.slow, freeze: s.freeze, noCrit: true });
    }
    AU.sfx('cone', 1); AU.sfx(s.s[0], s.s[1]);
  }
}
function updateDrones(w, s, dt) {
  w.drones = w.drones || [];
  while (w.drones.length < s.n) w.drones.push({ x: P.x, y: P.y, cd: Math.random() * s.cd, a: 0 });
  w.drones.length = s.n;
  w.dang = (w.dang || 0) + dt * 1.5;
  w.drones.forEach((d, i) => {
    const ta = w.dang + i / s.n * TAU, tx = P.x + Math.cos(ta) * 42, ty = P.y - 30 + Math.sin(ta) * 14;
    d.x += (tx - d.x) * Math.min(1, dt * 6); d.y += (ty - d.y) * Math.min(1, dt * 6);
    d.cd -= dt; if (d.cd > 0) return;
    const t = nearest(d.x, d.y, s.range); if (!t) { d.cd = 0.15; return; }
    d.cd = s.cd; const a = Math.atan2(t.y - d.y, t.x - d.x); d.a = a;
    mkProj({ kind: 'bullet', x: d.x, y: d.y, vx: Math.cos(a) * 650, vy: Math.sin(a) * 650, ang: a + rand(-0.05, 0.05), r: 4, dmg: s.dmg, pierce: 1, life: s.range / 650, col: s.col, size: .8, wid: w.id, kb: 20 });
    AU.sfx('drone', s.s[1]);
  });
}
function deployTurret(w, s) {
  for (let i = 0; i < s.n; i++) turrets.push({ x: P.x + (i - (s.n - 1) / 2) * 34, y: P.y + 18, life: s.life, max: s.life, cd: 0.4, a: 0, dmg: s.dmg, fire: s.fire, range: s.range, wid: w.id, col: s.col });
  while (turrets.filter(t => t.wid === w.id).length > s.n * 2) turrets.splice(turrets.findIndex(t => t.wid === w.id), 1);
  AU.sfx('mine', 0.6);
}
function updateTurrets(dt) {
  for (const t of turrets) {
    t.life -= dt; t.cd -= dt; if (t.cd > 0) continue;
    const e = nearest(t.x, t.y, t.range); if (!e) { t.cd = 0.2; continue; }
    t.cd = t.fire; t.a = Math.atan2(e.y - t.y, e.x - t.x);
    const x = t.x + Math.cos(t.a) * 14, y = t.y - 10 + Math.sin(t.a) * 14;
    mkProj({ kind: 'tracer', x, y, vx: Math.cos(t.a) * 700, vy: Math.sin(t.a) * 700, ang: t.a, r: 4, dmg: t.dmg, pierce: 1, life: t.range / 700, col: '#ffe082', size: .9, wid: t.wid, kb: 30 });
    AU.sfx('turret', 1);
  }
  turrets = turrets.filter(t => t.life > 0);
}
function layMines(w, s) {
  for (let i = 0; i < s.n; i++) { const a = rand(0, TAU), d = rand(40, 120); mines.push({ x: P.x, y: P.y, tx: P.x + Math.cos(a) * d, ty: P.y + Math.sin(a) * d, t: 0, armed: false, life: 16, dmg: s.dmg, boom: s.boom, wid: w.id }); }
  while (mines.length > 24) mines.shift();
  AU.sfx('mine', 1);
}
function updateMines(dt) {
  for (const m of mines) {
    m.t += dt; m.life -= dt;
    if (m.t < 0.35) { const k = m.t / 0.35; m.x = lerp(m.x, m.tx, k); m.y = lerp(m.y, m.ty, k); continue; }
    m.armed = true;
    if (query(m.x, m.y, 22).length) { m.life = 0; explode(m.x, m.y, m.boom, m.dmg, true, '#ff5252', { wid: m.wid }); }
  }
  mines = mines.filter(m => m.life > 0);
}
function fireOrbital(w, s, tgt) {
  for (let i = 0; i < s.n; i++) {
    const t = i === 0 ? tgt : densest(Math.min(VW, VH) * 0.6) || tgt; const x = t.x + (i ? rand(-30, 30) : 0), y = t.y + (i ? rand(-30, 30) : 0);
    effects.push({ type: 'target', x, y, r: s.boom, t: 0, dur: 0.9, col: s.col });
    later(0.9, () => { if (G.state !== 'play') return; effects.push({ type: 'skybeam', x, y, r: s.boom * 0.5, t: 0, dur: 0.45, col: '#ff8a80' }); explode(x, y, s.boom, s.dmg, true, '#ff1744', { burn: s.burn, wid: w.id, ap: 0.5 }); G.shake = Math.max(G.shake, 6); });
  }
  AU.sfx('orbital', 1);
}
function fireIon(w, s, tgt) {
  for (let i = 0; i < s.n; i++) { const t = i === 0 ? tgt : nearest(tgt.x + rand(-100, 100), tgt.y + rand(-100, 100), 300) || tgt; fields.push({ k: 'ion', x: t.x, y: t.y, r: s.r, t: 0, dur: s.dur, dps: s.dps, follow: t, tick: 0, wid: w.id, col: s.col }); }
  wsnd(s);
}
function fireHole(w, s, tgt) {
  const t = tgt; fields.push({ k: 'hole', x: t.x, y: t.y, r: s.r, t: 0, dur: s.dur, dps: s.dps, pull: s.pull, collapse: s.collapse, boom: s.boom, tick: 0, wid: w.id, col: s.col });
  wsnd(s);
}
function fireSplit(w, s, a) {
  setAim(a, w, s); const [x, y] = muzzle(a);
  mkProj({ kind: 'quantum', x, y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, ang: a, r: 7, dmg: s.dmg, pierce: 1, life: s.range / s.spd, col: s.col, shards: s.shards, shardDmg: s.shardDmg, split2: s.split2, wid: w.id, explodeEnd: 1, size: 1 });
  flash(a, s.col, 1.3); wsnd(s);
}
function shardBurst(x, y, n, dmg, col, wid, split2, skipId) {
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.1, 0.1); const p = mkProj({ kind: 'shard', x, y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, ang: a, r: 4, dmg, pierce: 1, life: 0.45, col, wid, size: .8, split2: split2 ? 1 : 0 }); if (skipId) p.hit.add(skipId); }
}
function projEnd(p, hitE) {
  if (p.ended) return; p.ended = true; p.dead = true;
  if (p.boom) explode(p.x, p.y, p.boom, p.dmg * (p.kind === 'cball' ? 0.8 : 1), true, p.col, { burn: p.burn, wid: p.wid, ap: p.ap });
  if (p.zap) { const t = nearest(p.x, p.y, 120); if (t) zap(p.x, p.y, t, p.dmg * 0.6, { wid: p.wid, col: '#fff59d' }); }
  if (p.flak) { for (let i = 0; i < p.shards; i++) { const a = p.ang + (i - (p.shards - 1) / 2) * 0.18; const q = mkProj({ kind: 'shard', x: p.x, y: p.y, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, ang: a, r: 4, dmg: p.shardDmg, pierce: 1, life: 0.35, col: p.col, wid: p.wid, size: .9, noTr: 1 }); if (hitE) q.hit.add(hitE.id); } effects.push({ type: 'flash', x: p.x, y: p.y, ang: p.ang, col: p.col, t: 0, dur: 0.08, size: 2 }); AU.sfx('hmg', 1.4); }
  else if (p.shards) shardBurst(p.x, p.y, p.shards, p.shardDmg || p.dmg * 0.25, p.col, p.wid, p.split2, hitE && hitE.id);
  if (p.kind === 'plasma' && effects.length < 150) effects.push({ type: 'shock', x: p.x, y: p.y, r: (p.boom || 30) * 1.2, t: 0, dur: 0.35, col: p.col });
  if (p.kind === 'shard' && p.split2 && hitE) shardBurst(p.x, p.y, 3, p.dmg * 0.6, p.col, p.wid, 0, hitE.id);
}
function landLob(p) {
  p.dead = true;
  if (p.grav) { fields.push({ k: 'grav', x: p.tx, y: p.ty, r: p.grav.r, t: 0, dur: p.grav.dur, dps: 0, pull: p.grav.pull, collapse: 1, boom: p.boom, dmg: p.dmg, tick: 0, wid: p.wid, col: p.col }); AU.sfx('hole', 1.3); return; }
  if (p.boom) explode(p.tx, p.ty, p.boom, p.dmg, true, p.col, { burn: p.burn, wid: p.wid });
  else { effects.push({ type: 'boom', x: p.tx, y: p.ty, r: 26, t: 0, dur: 0.3, col: p.col }); }
  if (p.cluster) for (let i = 0; i < p.cluster; i++) { const a = rand(0, TAU), d = rand(40, 95); mkProj({ kind: 'grenade', lob: 1, x0: p.tx, y0: p.ty, tx: p.tx + Math.cos(a) * d, ty: p.ty + Math.sin(a) * d, x: p.tx, y: p.ty, vx: 0, vy: 0, ang: 0, T: 0.35, tt: 0, r: 0, dmg: p.dmg * 0.55, life: 9, col: '#ffca28', boom: 30 * P.areaMul, wid: p.wid, size: .6, nohit: 1 }); }
  if (p.field) { fields.push({ k: p.field.k, x: p.tx, y: p.ty, r: p.field.r, t: 0, dur: p.field.dur, dps: p.field.dps * (1 + 0.22 * ((G.weapons.find(w => w.id === p.wid) || { lv: 1 }).lv - 1)), tick: 0, wid: p.wid, col: p.col }); if (p.field.k === 'gas') AU.sfx('gas', 1); }
}
function updateProjs(dt) {
  for (const p of projs) {
    if (p.dead) continue;
    if (p.lob) { p.tt += dt; const k = Math.min(1, p.tt / p.T); p.x = lerp(p.x0, p.tx, k); p.y = lerp(p.y0, p.ty, k); p.z = Math.sin(k * Math.PI) * (40 + Math.hypot(p.tx - p.x0, p.ty - p.y0) * 0.25); p.ang += dt * 10; if (k >= 1) landLob(p); continue; }
    if (p.acc) { const sp = Math.hypot(p.vx, p.vy), ns = Math.min(p.acc, sp + p.acc * 2.2 * dt); if (p.homing && p.target && !p.target.dead) { const ta = Math.atan2(p.target.y - p.y, p.target.x - p.x); p.ang += clamp(angDiff(ta, p.ang), -p.homing * dt, p.homing * dt); } else if (p.homing && (!p.target || p.target.dead)) p.target = nearest(p.x, p.y, 300); p.vx = Math.cos(p.ang) * ns; p.vy = Math.sin(p.ang) * ns; if (Math.random() < (Q.level ? 0.9 : 0.4)) addPart(p.x - Math.cos(p.ang) * 8, p.y - Math.sin(p.ang) * 8, rand(-20, 20), rand(-20, 20), pick(['#ffab40', '#ffd180', '#bdbdbd']), 0.35, rand(2, 4)); }
    if (p.homT) { const t = p.htg && !p.htg.dead ? p.htg : (p.htg = nearest(p.x, p.y, 260, p.hit)); if (t) { const sp = Math.hypot(p.vx, p.vy), ta = Math.atan2(t.y - p.y, t.x - p.x); p.ang += clamp(angDiff(ta, p.ang), -p.homT * dt, p.homT * dt); p.vx = Math.cos(p.ang) * sp; p.vy = Math.sin(p.ang) * sp; } }
    if (p.boomer) { p.tt = (p.tt || 0) + dt; if (!p.back && p.tt >= p.out) { p.back = 1; p.hit.clear(); } if (p.back) { const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(p.vx, p.vy) * 1.05; p.vx = dx / d * sp; p.vy = dy / d * sp; if (d < 18) { p.dead = true; continue; } } p.ang += dt * 18; }
    if (p.wave) { p.tt += dt; p.bx += p.vx * dt; p.by += p.vy * dt; const nx = -Math.sin(p.ang), ny = Math.cos(p.ang), off = Math.sin(p.tt * p.freq + p.ph) * p.amp; const ox = p.x, oy = p.y; p.x = p.bx + nx * off; p.y = p.by + ny * off; p.life -= dt; projCollide(p); if (Q.level && Math.random() < .4) addPart(ox, oy, 0, 0, p.col, .25, 3); if (p.life <= 0) p.dead = true; continue; }
    if (p.acc && Q.level && Math.random() < 0.7) parts.length < QC.particles && parts.push({ x: p.x - Math.cos(p.ang) * 10, y: p.y - Math.sin(p.ang) * 10, vx: rand(-10, 10), vy: rand(-10, 10), col: 'rgba(200,200,200,.55)', life: 0.6, max: 0.6, size: 4, grav: 0, grow: 2.2 });
    if (p.trCol && Q.level >= 2 && Math.random() < 0.25) addPart(p.x, p.y, rand(-20, 20), rand(-20, 20), p.trCol, 0.25, 2.5);
    const steps = Math.min(5, Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * dt / (p.r + 9))));
    p.life -= dt;
    if (p.storm) { p.st = (p.st || 0) - dt; if (p.st <= 0) { p.st = 0.3; const t = nearest(p.x, p.y, 110); if (t) zap(p.x, p.y, t, p.dmg * 0.45, { wid: p.wid, col: '#b9f6ca' }); } }
    if (p.kind === 'plasma' && Math.random() < 0.6) addPart(p.x + rand(-p.r, p.r) * .5, p.y + rand(-p.r, p.r) * .5, -p.vx * .2, -p.vy * .2, p.col, 0.3, rand(2, 4));
    for (let k = 0; k < steps && !p.dead; k++) { p.x += p.vx * dt / steps; p.y += p.vy * dt / steps; projCollide(p); }
    if (!p.dead && p.life <= 0) { if (p.explodeEnd) projEnd(p); else p.dead = true; }
  }
}
function projCollide(p) {
    for (const e of query(p.x, p.y, p.r).slice()) {
      if (p.hit.has(e.id) || e.dead) continue; p.hit.add(e.id);
      if (p.kind === 'rocket' || p.kind === 'missile' || p.kind === 'quantum') { if (p.kind === 'quantum') hitEnemy(e, p.dmg, { wid: p.wid, ang: p.ang, kb: 60 }); projEnd(p, e); break; }
      if (p.kind === 'plasma' || p.kind === 'disc') { hitEnemy(e, p.dmg, { silent: p.kind === 'plasma', wid: p.wid, burn: p.burn, kb: 40, ang: p.ang }); if (p.blastT && Math.random() < .5) explode(e.x, e.y, 26, p.dmg * 0.35, true, p.trCol || '#ff9100', { wid: p.wid, noTrait: 1 }); continue; }
      if (p.harp) { hitEnemy(e, p.dmg, { wid: p.wid, ang: p.ang, kb: 0 }); if (!e.boss && !e.static) { const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1; const pull = Math.min(d - 40, 260); e.kx += dx / d * pull * 4; e.ky += dy / d * pull * 4; e.stunT = Math.max(e.stunT, p.stunT || 0.6); } effects.push({ type: 'shock', x: e.x, y: e.y, r: e.r * 1.6, t: 0, dur: .25, col: p.col }); if (p.splitT) { shardBurst(e.x, e.y, 3, p.dmg * 0.35, p.trCol || p.col, p.wid, 0, e.id); } if (p.blastT) explode(e.x, e.y, 30, p.dmg * 0.4, true, p.trCol || '#ff9100', { wid: p.wid, noTrait: 1 }); p.dead = true; break; }
      hitEnemy(e, p.dmg, { kb: p.kb || 50, ang: p.ang, ap: p.ap, wid: p.wid, shred: p.shred, burn: p.burn });
      if (p.boom && p.kind !== 'cball' && !p.flak) { explode(p.x, p.y, p.boom, p.dmg * 0.6, true, p.col, { wid: p.wid }); }
      if (p.blastT) explode(p.x, p.y, 28, p.dmg * 0.4, true, p.trCol || '#ff9100', { wid: p.wid, noTrait: 1 });
      if (p.splitT && !p.splitDone) { p.splitDone = 1; for (let i = -1; i <= 1; i++) { const a = p.ang + i * 0.5; const q = mkProj({ kind: 'shard', x: p.x, y: p.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, ang: a, r: 4, dmg: p.dmg * 0.35, pierce: 1, life: 0.35, col: p.trCol || p.col, wid: p.wid, size: .8, noTr: 1 }); q.hit.add(e.id); } }
      if (p.splash) { for (const o of query(p.x, p.y, p.splash).slice()) if (o !== e) hitEnemy(o, p.dmg * 0.5, { silent: true, wid: p.wid, shred: p.shred }); if (p.field) fields.push({ k: p.field.k, x: p.x, y: p.y, r: p.field.r, t: 0, dur: p.field.dur, dps: p.field.dps, tick: 0, wid: p.wid, col: p.col }); AU.sfx('acid', 1.2); }
      if (p.flak) { projEnd(p, e); break; }
      if (p.kind === 'wavebolt' || p.boomer) { if (--p.pierce <= 0 && !p.boomer) { p.dead = true; break; } continue; }
      // 도탄: 관통 대신 다음 적에게 튕김
      if (p.ric > 0) { const t2 = nearest(p.x, p.y, 200, p.hit); if (t2) { p.ric--; const sp = Math.hypot(p.vx, p.vy); p.ang = Math.atan2(t2.y - p.y, t2.x - p.x); p.vx = Math.cos(p.ang) * sp; p.vy = Math.sin(p.ang) * sp; p.life = Math.max(p.life, 0.4); if (Q.level) addPart(p.x, p.y, rand(-60, 60), rand(-60, 60), '#ffffff', .2, 2.5); break; } }
      if (--p.pierce <= 0) { if (p.explodeEnd) projEnd(p, e); else { p.dead = true; if (p.kind === 'shard' && p.split2) projEnd(p, e); } break; }
    }
}
// ---------- 신규 발사 방식 ----------
function fireFlak(w, s, tgt) {
  const a = Math.atan2(tgt.y - P.y, tgt.x - P.x); setAim(a, w, s); const [x, y] = muzzle(a);
  const d = Math.min(s.range, Math.hypot(tgt.x - x, tgt.y - y) + 10);
  mkProj({ kind: 'slug', flak: 1, x, y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, ang: a, r: 5 * s.size, dmg: s.dmg, pierce: 1, life: d / s.spd, col: s.col, size: s.size, shards: s.shards, shardDmg: s.shardDmg, wid: w.id, explodeEnd: 1, kb: 80 });
  flash(a, s.col, 1.4); wsnd(s);
}
function fireBarrage(w, s) {
  const list = enemies.filter(e => !e.dead && onScreen(e, -20)); if (!list.length) return;
  for (let i = 0; i < s.n; i++) {
    const t = pick(list); const x = t.x + rand(-25, 25), y = t.y + rand(-25, 25);
    later(i * 0.12, () => { effects.push({ type: 'target', x, y, r: s.boom * 0.8, t: 0, dur: 0.55, col: s.col }); });
    later(i * 0.12 + 0.55, () => { if (G.state !== 'play') return; effects.push({ type: 'skybeam', x, y, r: 8, t: 0, dur: 0.18, col: '#ffccbc' }); explode(x, y, s.boom, s.dmg, true, s.col, { wid: w.id }); });
  }
  wsnd(s);
}
function fireNova(w, s) {
  effects.push({ type: 'nova', x: P.x, y: P.y, r: s.r, t: 0, dur: 0.38, col: s.col });
  for (const e of query(P.x, P.y, s.r).slice()) hitEnemy(e, s.dmg, { wid: w.id, kb: 180, silent: true });
  AU.sfx(s.s[0], s.s[1]); G.shake = Math.max(G.shake, 1.5);
}
function fireBoomer(w, s, a) {
  setAim(a, w, s);
  for (let i = 0; i < s.n; i++) { const ang = a + (i - (s.n - 1) / 2) * 0.35; const [x, y] = muzzle(ang); mkProj({ kind: 'disc', boomer: 1, x, y, vx: Math.cos(ang) * s.spd, vy: Math.sin(ang) * s.spd, ang, r: 9 * s.size, dmg: s.dmg, pierce: 99, life: 4, out: s.range / s.spd, col: s.col, size: s.size, wid: w.id }); }
  wsnd(s);
}
function fireWave(w, s, a) {
  setAim(a, w, s);
  for (let i = 0; i < s.n; i++) { const [x, y] = muzzle(a); mkProj({ kind: 'wavebolt', x, y, bx: x, by: y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, ang: a, r: 7, dmg: s.dmg, pierce: s.pierce || 3, life: s.range / s.spd, amp: s.amp, freq: s.freq, ph: i * Math.PI / Math.max(1, s.n - 1) + (i % 2 ? Math.PI : 0), tt: 0, col: s.col, size: 1, wid: w.id, wave: 1 }); }
  flash(a, s.col, 1.2); wsnd(s);
}
function fireHarpoon(w, s, a) {
  setAim(a, w, s);
  for (let i = 0; i < s.n; i++) { const ang = a + (i - (s.n - 1) / 2) * 0.25; const [x, y] = muzzle(ang); mkProj({ kind: 'harpoon', harp: 1, x, y, ox: P.x, oy: P.y, vx: Math.cos(ang) * s.spd, vy: Math.sin(ang) * s.spd, ang, r: 7, dmg: s.dmg, pierce: 1, life: s.range / s.spd, col: s.col, size: 1, stunT: s.stunT || 0.6, wid: w.id }); }
  wsnd(s);
}
function updateSaw(w, s, dt) {
  w.sawA = (w.sawA || 0) + s.rot * dt; w.saws = w.saws || []; w.saws.length = 0; w.sawS = s;
  for (let i = 0; i < s.n; i++) {
    const a = w.sawA + i / s.n * TAU, x = P.x + Math.cos(a) * s.r, y = P.y - 4 + Math.sin(a) * s.r * 0.9; w.saws.push([x, y, a]);
    for (const e of query(x, y, 12).slice()) { if ((e.sawCd || 0) > G.time) continue; e.sawCd = G.time + 0.4; hitEnemy(e, s.dmg, { wid: w.id, kb: 90, ang: a + Math.PI / 2, silent: true }); if (w.blastT === undefined) w.blastT = (WMAP[w.id].tr || []).includes('blast'); if (w.blastT && Math.random() < .3) explode(e.x, e.y, 26, s.dmg * 0.4, true, '#ff9100', { wid: w.id, noTrait: 1 }); if (Math.random() < .25) AU.sfx('clank'); }
  }
}
function updateFields(dt) {
  for (const f of fields) {
    f.t += dt; f.tick -= dt;
    if (f.follow && !f.follow.dead) { f.x += (f.follow.x - f.x) * Math.min(1, dt * 4); f.y += (f.follow.y - f.y) * Math.min(1, dt * 4); }
    if (f.pull) for (const e of query(f.x, f.y, f.r)) { if (e.boss || e.static) continue; const dx = f.x - e.x, dy = f.y - e.y, d = Math.hypot(dx, dy) || 1; const pw = f.pull * (0.4 + 0.6 * (1 - d / f.r)); e.x += dx / d * Math.min(d, pw * dt); e.y += dy / d * Math.min(d, pw * dt); }
    if (f.tick <= 0 && f.dps > 0) {
      f.tick = 0.25;
      const o = { silent: true, tick: 1, noCrit: true, wid: f.wid };
      if (f.k === 'fire') o.burn = 4; if (f.k === 'gas') o.poison = f.dps * 0.5; if (f.k === 'acid') o.shred = 1;
      for (const e of query(f.x, f.y, f.r).slice()) hitEnemy(e, f.dps * 0.25, o);
    }
    if (f.k === 'fire' && Math.random() < (Q.level ? 0.6 : 0.2)) addPart(f.x + rand(-f.r, f.r) * .7, f.y + rand(-f.r, f.r) * .5, 0, -60, pick(['#ff9800', '#ffeb3b', '#ff5722']), 0.4, 4);
    if (f.t >= f.dur) {
      f.dead = true;
      if (f.collapse) { explode(f.x, f.y, f.k === 'grav' ? f.boom : f.boom, f.k === 'grav' ? f.dmg : f.collapse, true, f.col, { wid: f.wid, ap: 0.5 }); G.shake = Math.max(G.shake, 6); }
    }
  }
  fields = fields.filter(f => !f.dead);
}

/* ------------------------- 액티브 스킬 / 물약 ------------------------- */
const SK1_CD = 10, SK2_CD = 5;
function useSkill1() {
  if (G.state !== 'play' || G.paused || G.sk1 > 0 || P.hp <= 0) return;
  G.sk1 = SK1_CD; const r = 115 * P.areaMul; const dmg = 30 + G.lv * 3 + G.stage * 4;
  effects.push({ type: 'spin', t: 0, dur: 0.45, r });
  for (const e of query(P.x, P.y, r).slice()) hitEnemy(e, dmg, { kb: 320 });
  for (const b of eprojs) if (Math.hypot(b.x - P.x, b.y - P.y) < r) b.dead = true;
  G.shake = Math.max(G.shake, 5); AU.sfx('spin');
}
function useSkill2() {
  if (G.state !== 'play' || G.paused || G.sk2 > 0 || P.hp <= 0) return;
  G.sk2 = SK2_CD; let dx = joy.mag > 0.1 ? joy.dx : P.lastMx, dy = joy.mag > 0.1 ? joy.dy : P.lastMy;
  const kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0), ky = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (kx || ky) { dx = kx; dy = ky; }
  const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
  P.dashT = 0.16; P.dashVx = dx * 950; P.dashVy = dy * 950; P.inv = Math.max(P.inv, 0.45);
  AU.sfx('dash');
}
function usePotion() {
  if (G.state !== 'play' || G.paused || G.potCd > 0 || G.potions <= 0 || P.hp >= P.maxHp || P.hp <= 0) return;
  G.potions--; G.potCd = 1; heal(Math.round(P.maxHp * 0.35)); updatePotBadge();
}
function updatePotBadge() { $('potN').textContent = G.potions; $('bPot').classList.toggle('dis', G.potions <= 0); }

/* ------------------------- 보스 AI ------------------------- */
function bossUpdate(e, dt) {
  const b = e.bdef, dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy) || 1;
  if (!e.p2 && e.hp < e.maxHp * 0.5) { e.p2 = true; G.shake = 12; G.flash = 0.4; G.flashCol = '255,0,60'; AU.sfx('rage'); toast('💢 ' + b.name + ' 분노! (2페이즈)', 1.8, '#ff1744'); if (b.final) e.armor = 0.25; }
  if (b.special && !e.p3 && e.hp < e.maxHp * 0.25) { e.p3 = true; e.armor = 0.3; G.shake = 16; G.flash = 0.5; G.flashCol = '255,215,0'; AU.sfx('rage'); toast('🔥 ' + b.name + ' 최종 페이즈!', 2, '#ffd600'); e.pats3 = [...new Set([...b.pats, 'spiral', 'laser', 'slam'])]; }
  const rate = e.p3 ? 1.6 : e.p2 ? 1.35 : 1;
  e.face = dx >= 0 ? 1 : -1;
  if (e.ps === 'idle') {
    const sp = e.spd * (e.p2 ? 1.25 : 1) * (dist > VW * 0.7 ? 2.5 : 1) * (e.slowT > 0 ? e.slowF : 1);
    e.x += dx / dist * sp * dt; e.y += dy / dist * sp * dt;
    e.pt -= dt * rate;
    if (e.pt <= 0) { const PS = e.pats3 || b.pats; let pat; do { pat = pick(PS); } while (pat === e.lastPat && PS.length > 1); e.lastPat = pat; e.ps = pat; e.sub = 0; e.step = 0; startPattern(e, pat); }
    return;
  }
  e.sub += dt * rate;
  const shot = b.shot || 'orb';
  switch (e.ps) {
    case 'charge':
      if (e.step === 0 && e.sub >= 0.9) { e.step = 1; e.sub = 0; AU.sfx('dash'); }
      if (e.step === 1) { e.x += Math.cos(e.cang) * 560 * dt; e.y += Math.sin(e.cang) * 560 * dt; if (Math.random() < .6) addPart(e.x, e.y + e.r * .6, rand(-30, 30), rand(-30, 30), '#bcaaa4', .4, 4); if (e.sub >= 0.75) endPattern(e, e.p2 && !e.again ? 'charge2' : null); }
      break;
    case 'radial': { const n = e.p2 ? 22 : 14;
      if (e.step === 0) { ringShot(e, n, 0, 135, shot); e.step = 1; }
      if (e.step === 1 && e.sub >= 0.45) { ringShot(e, n, Math.PI / n, 125, shot); e.step = 2; }
      if (e.step === 2 && e.p2 && e.sub >= 0.9) { ringShot(e, n, 0, 115, shot); e.step = 3; }
      if (e.sub >= 1.3) endPattern(e); break; }
    case 'fan':
      if (e.sub >= e.step * 0.32 && e.step < 3) { const n = e.p2 ? 9 : 5, a0 = Math.atan2(dy, dx); for (let i = 0; i < n; i++) eShot(e.x, e.y, a0 + (i - (n - 1) / 2) * 0.16, 210, e.dmg * 0.5, shot === 'orb' ? 'arrow' : shot); AU.sfx('eshot'); e.step++; }
      if (e.sub >= 1.3) endPattern(e); break;
    case 'spiral':
      e.spA = (e.spA || 0) + dt * 4.2; e.spT = (e.spT || 0) - dt;
      if (e.spT <= 0) { e.spT = e.p2 ? 0.07 : 0.1; for (let k = 0; k < (e.p2 ? 3 : 2); k++) eShot(e.x, e.y, e.spA + k * TAU / (e.p2 ? 3 : 2), 150, e.dmg * 0.4, 'orb'); }
      if (e.sub >= 2.6) endPattern(e); break;
    case 'laser':
      if (e.step === 0 && e.sub >= 1.0) { e.step = 1; AU.sfx('elaser'); G.shake = Math.max(G.shake, 5); }
      if (e.sub >= 1.5) endPattern(e); break;
    case 'blink':
      if (e.step === 0 && e.sub >= 0.5) { e.step = 1; effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r * 1.5, t: 0, dur: .4 }); const a = rand(0, TAU); e.x = P.x + Math.cos(a) * 170; e.y = P.y + Math.sin(a) * 170; effects.push({ type: 'portal', x: e.x, y: e.y, t: 0, dur: 0.5 }); AU.sfx('portal'); }
      if (e.step === 1 && e.sub >= 0.9) { e.step = 2; ringShot(e, e.p2 ? 18 : 12, rand(0, 1), 140, shot); }
      if (e.sub >= 1.3) endPattern(e); break;
    case 'slam': if (e.sub >= 1.4) endPattern(e); break;
    case 'summon': if (e.sub >= 0.8) endPattern(e); break;
    case 'jump':
      if (e.step === 0) { const k = Math.min(1, e.sub / 1.1); e.z = Math.sin(k * Math.PI) * 120; e.x = lerp(e.jx0, e.jx, k); e.y = lerp(e.jy0, e.jy, k);
        if (e.sub >= 1.1) { e.step = 1; e.z = 0; G.shake = 10; AU.sfx('slam'); effects.push({ type: 'shock', x: e.x, y: e.y, r: e.r * 2.2, t: 0, dur: 0.4 }); if (Math.hypot(P.x - e.x, P.y - e.y) < e.r * 1.7 + P.r) damagePlayer(e.dmg * 1.3, 'boss'); if (e.p2) ringShot(e, 12, 0, 150, shot); } }
      if (e.sub >= 1.6) endPattern(e); break;
  }
}
function startPattern(e, pat) {
  if (pat === 'charge') { e.cang = Math.atan2(P.y - e.y, P.x - e.x); hazards.push({ kind: 'line', x: e.x, y: e.y, ang: e.cang, len: 440, w: e.r * 1.6, t: 0, delay: 0.9, dmg: 0 }); }
  if (pat === 'slam') { const n = e.p2 ? 6 : 4; for (let i = 0; i < n; i++) { const x = i === 0 ? P.x : P.x + rand(-130, 130), y = i === 0 ? P.y : P.y + rand(-130, 130); hazards.push({ kind: 'circle', x, y, r: 58, t: 0, delay: 1.15 + i * 0.06, dmg: e.dmg * 1.1 }); } }
  if (pat === 'laser') { const n = e.p2 ? 5 : 3, a0 = Math.atan2(P.y - e.y, P.x - e.x); for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * (e.p2 ? 0.5 : 0.65); hazards.push({ kind: 'line', x: e.x, y: e.y, ang: a, len: 560, w: 26, t: 0, delay: 1.0, dmg: e.dmg * 1.1, beam: 1 }); } }
  if (pat === 'summon') {
    const cnt = e.mini ? 4 : e.p2 ? 9 : 6;
    for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU, x = e.x + Math.cos(a) * 90, y = e.y + Math.sin(a) * 90; effects.push({ type: 'portal', x, y, t: 0, dur: 0.7 }); later(0.6, () => { if (G.state === 'play' && !e.dead) spawnEnemy(e.bdef.summon, x, y); }); }
    AU.sfx('portal');
  }
  if (pat === 'jump') { e.jx0 = e.x; e.jy0 = e.y; e.jx = P.x; e.jy = P.y; hazards.push({ kind: 'circle', x: P.x, y: P.y, r: e.r * 1.7, t: 0, delay: 1.1, dmg: 0 }); }
}
function endPattern(e, next) {
  if (next === 'charge2') { e.again = true; e.ps = 'charge'; e.sub = 0; e.step = 0; startPattern(e, 'charge'); return; }
  e.again = false; e.ps = 'idle'; e.pt = e.p2 ? 1.3 : 1.9;
}
function ringShot(e, n, off, spd, kind) { for (let i = 0; i < n; i++) eShot(e.x, e.y, off + i / n * TAU, spd, e.dmg * 0.45, kind === 'laser' ? 'plasma' : kind); AU.sfx('eshot'); }
const SHOT = { arrow: { spd: 1, r: 4, col: '#d32f2f' }, orb: { spd: 1, r: 7, col: '#d500f9' }, acid: { spd: .95, r: 6, col: '#c6ff00' }, fire: { spd: 1.05, r: 6, col: '#ff6d00' }, ice: { spd: .9, r: 6, col: '#80d8ff' }, plasma: { spd: .85, r: 8, col: '#e040fb' }, laser: { spd: 2.6, r: 4, col: '#ff1744' }, shell: { spd: .75, r: 8, col: '#5d4037' } };
function eShot(x, y, a, spd, dmg, kind) { const k = SHOT[kind] || SHOT.orb; eprojs.push({ x, y, vx: Math.cos(a) * spd * k.spd, vy: Math.sin(a) * spd * k.spd, ang: a, r: k.r, dmg, kind, col: k.col, life: 5 }); }
function bossDefeated(e) {
  if (e.mini) {
    G.mini = null; G.shake = 12; AU.sfx('bossdie'); explode(e.x, e.y, 80, 0, false, '#b388ff');
    dropPickup('chest', e.x, e.y); for (let i = 0; i < 10; i++) dropGem(e.x + rand(-50, 50), e.y + rand(-50, 50), 6);
    toast('👿 난입 보스 격퇴!', 1.8, '#ffd54f'); return;
  }
  G.bossState = 3; G.winT = 3.2; G.shake = 20; G.flash = 0.8; G.flashCol = '255,255,255'; AU.sfx('bossdie');
  save.stats.bossKills++;
  for (let i = 0; i < 6; i++) later(i * 0.15, () => explode(e.x + rand(-50, 50), e.y + rand(-50, 50), 50, 0, false, '#b388ff'));
  for (let i = 0; i < 20; i++) dropGem(e.x + rand(-60, 60), e.y + rand(-60, 60), 10);
  dropPickup('coin', e.x, e.y, 40 * G.stage);
  effects.push({ type: 'pillar', x: e.x, y: e.y, t: 0, dur: 3, col: '#ffb300' });
  for (const m of enemies) if (!m.dead && !m.boss && !m.static) { m.dead = true; effects.push({ type: 'poof', x: m.x, y: m.y, r: m.r, t: 0, dur: 0.3 }); }
  eprojs.length = 0; hazards.length = 0;
  for (const p of pickups) if (p.kind === 'gem' || p.kind === 'coin' || p.kind === 'qitem') p.mag = true;
  for (const q of G.quests) if (q.k === 'boss') completeQuest(q);
  const wid = pickDropWeapon(4, true);
  if (wid) { dropPickup('wdrop', e.x, e.y + 20, 0, wid); G.bossDrop = wid; toast(`👑 보스 처치! 👑<br><span style="font-size:17px">확정 보상: ${WMAP[wid].nm}</span>`, 3, '#ffd54f'); }
  else { const own = G.weapons.filter(w => w.lv < WMAX); if (own.length) { const w = pick(own); w.lv++; } const g = 80 * G.stage; G.gold += g; toast(`👑 보스 처치! 👑<br><span style="font-size:16px">무기를 모두 모아 강화 재료 지급 (+${g}G, 무기 강화)</span>`, 3, '#ffd54f'); }
}

/* ------------------------- 일반 몬스터 AI ------------------------- */
const SEP = [];
function updateEnemies(dt) {
  const far = Math.max(VW, VH) * 0.95;
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt; if (e.atkCd > 0) e.atkCd -= dt; if (e.orbCd > 0) e.orbCd -= dt; if (e.markT > 0) e.markT -= dt; if (e.shredT > 0) e.shredT -= dt; if (e.frozen > 0) e.frozen -= dt;
    if (e.burn > 0) { e.burn -= dt; e.burnTick -= dt; if (e.burnTick <= 0) { e.burnTick = 0.5; hitEnemy(e, e.burnDps * 0.5, { noCrit: true, silent: true, tick: 1, col: '#ff9800' }); if (Q.level) addPart(e.x + rand(-6, 6), e.y - e.r * .5, 0, -40, '#ff9800', .4, 3); if (e.dead) continue; } }
    if (e.poison > 0) { e.poison -= dt; e.poisonTick = (e.poisonTick || 0) - dt; if (e.poisonTick <= 0) { e.poisonTick = 0.5; hitEnemy(e, e.poisonDps * 0.5, { noCrit: true, silent: true, tick: 1, col: '#76ff03' }); if (e.dead) continue; } }
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowF = 1; }
    let tx = P.x, ty = P.y;
    if (e.tgtGen) { let bd = 1e9; for (const g of gens) { if (g.dead) continue; const d = (g.x - e.x) ** 2 + (g.y - e.y) ** 2; if (d < bd) { bd = d; tx = g.x; ty = g.y; } } if (bd === 1e9) e.tgtGen = false; }
    const dx = tx - e.x, dy = ty - e.y; const dist = Math.hypot(dx, dy) || 1; const nx = dx / dist, ny = dy / dist;
    const pdist = Math.hypot(P.x - e.x, P.y - e.y);
    if (e.boss) { if (e.stunT > 0) e.stunT = 0; bossUpdate(e, dt); }
    else if (e.static) { staticUpdate(e, dt, pdist); }
    else {
      if (!e.elite && e.type !== 'golden' && (Math.abs(P.x - e.x) > far || Math.abs(P.y - e.y) > far)) { const [x, y] = edgePos(30); e.x = x; e.y = y; continue; }
      if (e.stunT > 0) { e.stunT -= dt; e.x += e.kx * dt; e.y += e.ky * dt; const kd = Math.pow(0.002, dt); e.kx *= kd; e.ky *= kd; continue; }
      let vx = nx * e.spd, vy = ny * e.spd;
      e.aiT -= dt;
      if (e.forceDash) { if (e.st === 1) { vx = 0; vy = 0; if (e.aiT <= 0) { e.st = 2; e.aiT = 0.45; } } else if (e.st === 2) { vx = Math.cos(e.dang) * e.spd * 5; vy = Math.sin(e.dang) * e.spd * 5; if (e.aiT <= 0) { e.st = 0; e.forceDash = 0; } } }
      else switch (e.d.ai) {
        case 'flutter': { const s = Math.sin(G.time * 6 + e.seed) * 0.8; vx = (nx - ny * s) * e.spd; vy = (ny + nx * s) * e.spd; break; }
        case 'zig': if (e.aiT <= 0) { e.aiT = rand(0.4, 0.8); e.ang = rand(-0.9, 0.9); } { const c = Math.cos(e.ang), s = Math.sin(e.ang); vx = (nx * c - ny * s) * e.spd; vy = (nx * s + ny * c) * e.spd; } break;
        case 'dash':
          if (e.st === 0 && dist < 190 && e.aiT <= 0) { e.st = 1; e.aiT = 0.55; e.dang = Math.atan2(dy, dx); }
          if (e.st === 1) { vx = 0; vy = 0; if (e.aiT <= 0) { e.st = 2; e.aiT = 0.42; } }
          else if (e.st === 2) { vx = Math.cos(e.dang) * e.spd * 4; vy = Math.sin(e.dang) * e.spd * 4; if (e.aiT <= 0) { e.st = 0; e.aiT = rand(1.8, 3); } }
          break;
        case 'ranged': { const keep = e.d.keep || 170;
          if (pdist < keep * 0.85) { vx = -nx * e.spd; vy = -ny * e.spd; } else if (pdist < keep * 1.4) { vx = -ny * e.spd * 0.6; vy = nx * e.spd * 0.6; }
          if (e.aiT <= 0 && onScreen(e, -15)) {
            const a = Math.atan2(P.y - e.y, P.x - e.x);
            if (e.d.shot === 'laser') { e.aiT = rand(3.4, 4.6); hazards.push({ kind: 'line', x: e.x, y: e.y, ang: a, len: 400, w: 8, t: 0, delay: 0.7, dmg: 0, thin: 1 }); later(0.7, () => { if (!e.dead && G.state === 'play') { eShot(e.x, e.y, a, 200, e.dmg * 0.75, 'laser'); AU.sfx('laser', .5); } }); }
            else { e.aiT = rand(3, 4.5); eShot(e.x, e.y, a, 175, e.dmg * 0.6, e.d.shot); }
          }
          break; }
        case 'phase': e.alpha = 0.55 + 0.4 * Math.sin(G.time * 3 + e.seed); { const s = Math.sin(G.time * 2 + e.seed) * 0.5; vx = (nx - ny * s) * e.spd; vy = (ny + nx * s) * e.spd; } break;
        case 'bomb':
          if (e.st === 0 && pdist < 46) { e.st = 1; e.aiT = 0.9; }
          if (e.st === 1) { vx = 0; vy = 0; e.flash = (Math.floor(G.time * 12) % 2) ? 0.05 : 0;
            if (e.aiT <= 0) { e.dead = true; G.kills++; qAdd('kill'); qAdd('killTag', 1, q => q.tag === e.d.tag); explode(e.x, e.y, 55, 0, false, '#ff5722'); if (Math.hypot(P.x - e.x, P.y - e.y) < 55 + P.r * 0.5) damagePlayer(e.dmg, 'bomb'); continue; } }
          break;
        case 'heal':
          if (pdist < 150) { vx = -nx * e.spd; vy = -ny * e.spd; }
          if (e.aiT <= 0) { e.aiT = 4; let n = 0; for (const o of query(e.x, e.y, 120)) { if (o === e || o.boss || o.static) continue; o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.15); n++; } if (n) effects.push({ type: 'healfx', x: e.x, y: e.y, r: 130, t: 0, dur: 0.6 }); }
          break;
        case 'summon':
          if (pdist < 200) { vx = -nx * e.spd * 0.5; vy = -ny * e.spd * 0.5; }
          if (e.aiT <= 0 && onScreen(e, 40)) { e.aiT = 5.5; for (let i = 0; i < 2; i++) { const x = e.x + rand(-50, 50), y = e.y + rand(-50, 50); effects.push({ type: 'portal', x, y, t: 0, dur: .6 }); later(.5, () => { if (G.state === 'play' && aliveCount() < maxEnemies()) spawnEnemy(e.d.minion, x, y); }); } }
          break;
        case 'blink':
          if (e.aiT <= 0 && pdist > 110) { e.aiT = rand(3, 4.5); effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r * 1.4, t: 0, dur: .3 }); const a = rand(0, TAU); e.x = P.x + Math.cos(a) * 75; e.y = P.y + Math.sin(a) * 75; e.stunT = 0.35; effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r * 1.4, t: 0, dur: .3 }); }
          break;
        case 'flee': { vx = -nx * e.spd; vy = -ny * e.spd; e.life -= dt; if (Math.random() < .3) addPart(e.x, e.y, rand(-20, 20), rand(-30, 0), '#ffd54f', .5, 3); if (e.life <= 0) { e.dead = true; effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r * 2, t: 0, dur: .4 }); } break; }
      }
      if (e.slowT > 0) { vx *= e.slowF; vy *= e.slowF; }
      e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;
      const kd = Math.pow(0.002, dt); e.kx *= kd; e.ky *= kd;
      if (Math.abs(vx) > 3) e.face = vx > 0 ? 1 : -1;
      if (e.affix === 'aura') { e.auraT = (e.auraT || 0) - dt; if (e.auraT <= 0 && pdist < e.r + 50) { e.auraT = 0.5; damagePlayer(e.dmg * 0.3, 'aura'); } }
      if (e.elite && e.skill) eliteSkill(e, dt, pdist);
    }
    if (!e.static) {
      const near = query(e.x, e.y, e.r, SEP); let c = 0;
      for (const o of near) {
        if (o === e || c > 6) continue; c++;
        const ox = e.x - o.x, oy = e.y - o.y, d2 = ox * ox + oy * oy, rr2 = e.r + o.r;
        if (d2 > 0.01 && d2 < rr2 * rr2) { const d = Math.sqrt(d2), push = (rr2 - d) * (o.static ? 1 : 0.5); if (!e.boss) { e.x += ox / d * push; e.y += oy / d * push; } }
      }
    }
    // 접촉 피해 (플레이어 / 발전기)
    if (e.dmg > 0 && !e.static) {
      if (pdist < e.r * 0.85 + P.r && e.atkCd <= 0 && (!e.boss || e.z < 20)) { e.atkCd = 0.8; damagePlayer(e.boss && e.ps === 'charge' ? e.dmg * 1.4 : e.dmg, e.boss ? 'boss' : e.type); }
      if (e.tgtGen && e.atkCd <= 0) for (const g of gens) { if (!g.dead && Math.hypot(g.x - e.x, g.y - e.y) < g.r + e.r) { e.atkCd = 0.8; g.hp -= e.dmg * 0.4; g.hitT = 0.15; if (g.hp <= 0) { g.dead = true; explode(g.x, g.y, 60, 0, false, '#00e676'); AU.sfx('alarm'); toast('⚠ 방어 시설 파괴!', 1.4, '#ff5252'); } break; } }
    }
  }
}
function staticUpdate(e, dt, pdist) {
  if (e.type === 'portal') { e.aiT -= dt; if (e.aiT <= 0 && pdist < 650) { e.aiT = 4.5; for (let i = 0; i < 2; i++) { if (aliveCount() >= maxEnemies()) break; const a = rand(0, TAU); spawnEnemy(wpick(G.st.mobs), e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40); } effects.push({ type: 'portal', x: e.x, y: e.y, t: 0, dur: .5 }); } }
  if (e.type === 'egg') { e.hatch -= dt; if (e.hatch <= 0) { e.dead = true; effects.push({ type: 'poof', x: e.x, y: e.y, r: e.r * 1.5, t: 0, dur: .4 }); for (let i = 0; i < 3; i++) spawnEnemy('xeno', e.x + rand(-15, 15), e.y + rand(-15, 15)); } }
  if (e.type === 'device') { e.aiT -= dt; if (e.aiT <= 0 && pdist < 330) { e.aiT = G.stage > 27 ? 4.2 : 3.5; for (let i = 0; i < 8; i++) eShot(e.x, e.y - 20, i / 8 * TAU + G.time, 130, e.dmg, 'orb'); AU.sfx('eshot'); } }
}
function updateEProjs(dt) {
  for (const b of eprojs) {
    if (b.dead) continue;
    if (b.hom) { const sp = Math.hypot(b.vx, b.vy), ta = Math.atan2(P.y - b.y, P.x - b.x); b.ang += clamp(angDiff(ta, b.ang), -1.6 * dt, 1.6 * dt); b.vx = Math.cos(b.ang) * sp; b.vy = Math.sin(b.ang) * sp; } b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { b.dead = true; continue; }
    if ((b.x - P.x) ** 2 + (b.y - P.y) ** 2 < (b.r + P.r * 0.7) ** 2) { b.dead = true; damagePlayer(b.dmg, 'shot'); if (b.kind === 'ice') P.slowT = 1.2; if (b.kind === 'shell') explode(b.x, b.y, 30, 0, false, '#8d6e63'); }
  }
}
function updateHazards(dt) {
  for (const h of hazards) {
    if (h.dead) continue; h.t += dt;
    if (h.t >= h.delay) {
      h.dead = true;
      if (h.kind === 'circle' && h.dmg > 0) {
        effects.push({ type: 'shock', x: h.x, y: h.y, r: h.r, t: 0, dur: 0.35 }); AU.sfx('slam'); G.shake = Math.max(G.shake, 5);
        for (let i = 0; i < 10; i++) addPart(h.x, h.y, rand(-150, 150), rand(-150, 150), '#a1887f', .5, 4);
        if (Math.hypot(P.x - h.x, P.y - h.y) < h.r + P.r * 0.5) damagePlayer(h.dmg, 'slam');
      }
      if (h.kind === 'line' && h.beam) {
        const x2 = h.x + Math.cos(h.ang) * h.len, y2 = h.y + Math.sin(h.ang) * h.len;
        effects.push({ type: 'rail', x1: h.x, y1: h.y, x2, y2, w: h.w, col: '#ff1744', t: 0, dur: 0.35 });
        if (segDist2(P.x, P.y, h.x, h.y, x2, y2) < (h.w / 2 + P.r * 0.5) ** 2) damagePlayer(h.dmg, 'beam');
      }
    }
  }
}
function updateGens(dt) {
  for (const g of gens) { if (g.dead) continue; if (g.hitT > 0) g.hitT -= dt;
    // 방어 시설 자동 포탑
    g.cd = (g.cd || 0) - dt;
    if (g.cd <= 0) { const t = nearest(g.x, g.y, 190); if (t) { g.cd = 0.4; g.a = Math.atan2(t.y - g.y, t.x - g.x); mkProj({ kind: 'tracer', x: g.x, y: g.y - 18, vx: Math.cos(g.a) * 700, vy: Math.sin(g.a) * 700, ang: g.a, r: 4, dmg: 9 + G.stage * 1.5, pierce: 2, life: 0.3, col: '#69f0ae', size: 1, kb: 50 }); AU.sfx('turret', 1.3); } else g.cd = 0.2; } if (Math.hypot(P.x - g.x, P.y - g.y) < 75) { g.hp = Math.min(g.maxHp, g.hp + (20 + G.stage) * dt); g.repair = true; } else g.repair = false; }
}

/* ------------------------- 메인 업데이트 ------------------------- */
function update(dt) {
  G.time += dt; G.t += dt;
  if (laterQ.length) { const now = G.time; const run = laterQ.filter(l => l.t <= now); laterQ = laterQ.filter(l => l.t > now); for (const l of run) l.fn(); }
  let mx = joy.mag > 0.12 ? joy.dx * Math.min(1, joy.mag * 1.15) : 0, my = joy.mag > 0.12 ? joy.dy * Math.min(1, joy.mag * 1.15) : 0;
  const kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0), ky = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (kx || ky) { const m = Math.hypot(kx, ky); mx = kx / m; my = ky / m; }
  P.moving = Math.hypot(mx, my) > 0.05;
  const spd = P.spd * (P.slowT > 0 ? 0.6 : 1);
  if (P.dashT > 0) { P.dashT -= dt; P.x += P.dashVx * dt; P.y += P.dashVy * dt; if (Math.random() < 0.9) effects.push({ type: 'ghost', x: P.x, y: P.y, face: P.face, t: 0, dur: 0.25 }); }
  else if (P.moving) { P.x += mx * spd * dt; P.y += my * spd * dt; P.walkT += dt; const m = Math.hypot(mx, my); P.lastMx = mx / m; P.lastMy = my / m; if (Math.abs(mx) > 0.15 && P.atkT <= 0) P.face = mx > 0 ? 1 : -1; }
  if (P.inv > 0) P.inv -= dt; if (P.hurtT > 0) P.hurtT -= dt; if (P.atkT > 0) P.atkT -= dt; if (P.slowT > 0) P.slowT -= dt; if (P.recoil > 0) P.recoil = Math.max(0, P.recoil - dt * 30);
  if (P.regen > 0 && P.hp > 0) P.hp = Math.min(P.maxHp, P.hp + P.regen * dt);
  if (G.sk1 > 0) G.sk1 -= dt; if (G.sk2 > 0) G.sk2 -= dt; if (G.potCd > 0) G.potCd -= dt; if (G.powerT > 0) G.powerT -= dt;
  director(dt);
  buildGrid();
  updateWeapons(dt); updateProjs(dt); updateFields(dt); updateTurrets(dt); updateMines(dt);
  buildGrid();
  updateEnemies(dt); updateEProjs(dt); updateHazards(dt); updateGens(dt);
  if (G.state !== 'play') return;
  updateQuests(dt);
  const mg2 = P.magnet * P.magnet;
  for (const p of pickups) {
    if (p.dead) continue; p.t += dt;
    if (p.kind !== 'gem' && p.z !== undefined && p.t < 0.5) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }
    const dx = P.x - p.x, dy = P.y - p.y, d2 = dx * dx + dy * dy;
    const big = p.kind === 'chest' || p.kind === 'meat' || p.kind === 'magnet' || p.kind === 'crate' || p.kind === 'secret' || p.kind === 'power' || p.kind === 'wdrop' || p.kind === 'legend';
    const rng = big ? 24 * 24 : p.kind === 'qitem' ? Math.max(mg2, 55 * 55) : mg2;
    if (p.t > 0.4 && d2 < rng) p.mag = true;
    if (p.mag) { const d = Math.sqrt(d2) || 1, sp = 260 + p.t * 60; p.x += dx / d * sp * dt; p.y += dy / d * sp * dt; if (d < P.r + 6) { p.dead = true; collect(p); } }
  }
  for (const q of parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.grav * dt; q.vx *= 0.96; q.vy *= 0.96; }
  for (const t of texts) t.t += dt;
  for (const f of effects) f.t += dt;
  updateWeather(dt, G.st.wx);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  if (G.flash > 0) G.flash -= dt;
  if (G.time % 0.25 < dt) { enemies = enemies.filter(e => !e.dead); eprojs = eprojs.filter(b => !b.dead); pickups = pickups.filter(p => !p.dead); hazards = hazards.filter(h => !h.dead); }
  parts = parts.filter(q => q.life > 0); texts = texts.filter(t => t.t < (t.big ? 1.4 : t.crit ? 0.9 : 0.7)); effects = effects.filter(f => f.t < f.dur);
  projs = projs.filter(p => !p.dead);
  if (G.swapQ && G.swapQ.length && G.state === 'play' && P.hp > 0) openSwap(G.swapQ.shift());
  else if (G.pendingLv > 0 && G.state === 'play' && P.hp > 0 && G.clearing === 0) openLevelUp();
  if (G.bossState === 3) { G.winT -= dt; if (G.winT <= 0 && G.state === 'play') stageWin(); }
}
