/* =====================================================================
   업데이트: 다중 체력바 보스 · 무기 계승 · 강화 수준 기반 난이도 보정 ·
             차량 자동 탑승 · 차량 무기 임팩트 강화
   ===================================================================== */
const BOSS_HP_X = 7.5;                         // 최종 보스 총 체력 배율: v6(2.5배)의 정확히 3배 (체력바 합계 기준)
const BAR_COLS = ['#e53935', '#ff9800', '#8e24aa'];  // 1번째 빨강 → 2번째 주황 → 3번째 보라
const BAR_NAMES = ['빨간', '주황', '보라'];
function bossBarsFor(n, special) { return 3; } // 1~40 모든 보스 3줄

/* ------------------------- 다중 체력바 ------------------------- */
function initBossBars(e) { if (e.mini) return; e.bars = bossBarsFor(G.stage, e.bdef.special); e.bar = 0; }
function bossBarUpdate(e) {
  if (!e.bars) return;
  const per = e.maxHp / e.bars, idx = Math.min(e.bars - 1, Math.floor((e.maxHp - Math.max(0, e.hp)) / per));
  if (idx > e.bar && e.hp > 0) { e.bar = idx; barBreak(e); }
}
function barBreak(e) {
  const left = e.bars - e.bar;
  G.barFlash = 0.7; G.shake = Math.max(G.shake, 10); G.flash = 0.35; G.flashCol = e.bar >= 2 ? '180,60,255' : '255,140,0';
  effects.push({ type: 'xring', x: e.x, y: e.y, r: e.r * 3.2, t: 0, dur: 0.6, col: BAR_COLS[Math.min(2, e.bar)] });
  effects.push({ type: 'nova', x: e.x, y: e.y, r: e.r * 4, t: 0, dur: 0.6, col: BAR_COLS[Math.min(2, e.bar)] });
  for (let i = 0; i < 30; i++) addPart(e.x, e.y, rand(-260, 260), rand(-260, 120), BAR_COLS[Math.min(2, e.bar)], rand(.5, 1), rand(3, 6), 200);
  // 체력바 전환: 잠깐 멈춰 섰다가(회피 시간) 새 패턴 시작
  e.ps = 'idle'; e.pt = 1.6; e.stagger = 1.0; archPhase(e);
  AU.sfx('rage'); AU.sfx('bigboom');
  toast(`💢 ${e.bdef.name} — 체력바 ${left}줄 남음!<br><span style="font-size:15px">${e.bar === 1 ? '2페이즈: 공격 속도 증가 · 새로운 특수 공격' : '3페이즈: 광역 공격 · 고유 필살기 「' + (e.arch ? e.arch.un : '') + '」'}</span>`, 2, BAR_COLS[Math.min(2, e.bar)]);
}

/* ------------------------- 무기 계승 ------------------------- */
function inheritValid(ih) { return ih && typeof ih === 'object' && WMAP[ih.id] ? ih : null; }
// 계승 무기 최대 2개 장착 (진화 상태 유지, 강화 단계는 Lv.2로 시작)
function applyInherit() {
  const names = [];
  for (const ih of inhList()) {
    let w = G.weapons.find(x => x.id === ih.id); if (!w) { if (G.weapons.length >= WSLOTS) continue; w = addWeapon(ih.id); }
    w.lv = clamp(Math.min(ih.lv | 0, INH_LV), 1, WMAX); w.evo = !!ih.evo && !!EVOS[ih.id]; w.inh = true;
    const c = codexOf(w.id); c.maxLv = Math.max(c.maxLv || 1, w.lv);
    names.push(`${w.evo ? EVOS[w.id].n : WMAP[w.id].nm} Lv${w.lv}`);
  }
  if (names.length) later(1.2, () => toast(`🔁 계승 무기 장착: ${names.join(', ')}`, 2, '#80deea'));
}
function inheritLabel() { const L = inhList(); if (!L.length) return '없음'; return L.map(ih => `${WMAP[ih.id].ic} ${ih.evo && EVOS[ih.id] ? EVOS[ih.id].n : WMAP[ih.id].nm} Lv${ih.lv}${ih.evo ? ' 🔥' : ''}`).join(', '); }

/* ------------------------- 강화 수준 기반 난이도 보정 (상한 있음) ------------------------- */
// 플레이어가 골드 강화·계승 무기로 강해진 만큼, 다음 스테이지 적을 '일부만' 강화 (난이도별 상한 15~25%, 누적 없음)
// v8: 강화 단계 확장에 맞춰 '최대치 대비 비율'로 계산, 완만하게 포화(1-e^-x), 초반 스테이지는 상한을 낮게
function adaptStrength() {
  const f = k => effUp(k) / effLv(k, UPGRADES[k].max);   // 0~1
  let S = 1.0 * f('atk') + 0.5 * f('hp') + 0.35 * f('armor') + 0.3 * f('aspd') + 0.1 * f('spd');
  for (const ih of inhList()) S += 0.06 * ih.lv + (ih.evo ? 0.15 : 0) + (WMAP[ih.id].t >= 3 ? 0.05 : 0);
  return S;
}
function adaptCap() { return [0.18, 0.22, 0.27, 0.32][diffIdx()]; }
function adaptStageF() { return 0.45 + 0.55 * Math.min(1, ((G.stage || 1) - 1) / 25); }
// 스테이지 중 동료 성장(활동 동료 수 × 동료 성장도) 반영분 포함, 상한 내에서만 — 누적 없음
function adaptNow() { return Math.min(adaptCap(), (G.adapt || 0) + (G.adaptLive || 0)); }
function computeAdapt() { return adaptCap() * adaptStageF() * (1 - Math.exp(-adaptStrength() * 0.6)); }
function CNT() { return DF().cnt * (1 + adaptNow() * 0.5); }

/* ------------------------- 차량 자동 탑승 ------------------------- */
function autoBoard() {
  for (const v of vehs) if (v.noAuto && !v.dead && Math.hypot(v.x - P.x, v.y - P.y) > 110) v.noAuto = false;
  if (G.veh || P.hp <= 0 || G.state !== 'play' || P.dashT > 0) return;
  const v = nearVeh(); if (!v || v.noAuto || v.dead || v.drop) return;
  // 탑승 연출: 캐릭터가 차량으로 뛰어오르는 잔상
  const x0 = P.x, y0 = P.y;
  for (let i = 1; i <= 4; i++) { const k = i / 5; effects.push({ type: 'ghost', x: lerp(x0, v.x, k), y: lerp(y0, v.y, k) - Math.sin(k * Math.PI) * 24, face: P.face, t: -i * 0.03, dur: 0.3 }); }
  boardVehicle(v);
}

/* ------------------------- 차량 무기 임팩트 ------------------------- */
// 차량 발사체 표시: 크기·폭발 반경 확대 + 대형 폭발 연출 (피해량 계산은 기존 차량 화력 규칙 유지)
function vehProj(o) {
  if (!G.veh || o.wid || o.ally) return;
  o.vfx = 1; o.size = (o.size || 1) * 1.35; if (o.r) o.r *= 1.25; if (o.boom) o.boom *= 1.18; if (o.len) o.len *= 1.4;
}
function vehBoomFx(x, y, r) {
  if (!onScreen({ x, y }, r + 60)) return;
  if (effects.length < FXCAP) effects.push({ type: 'xring', x, y, r: r * 1.5, t: 0, dur: 0.42, col: '#fff3e0' });
  for (let i = 0; i < (Q.level ? 8 : 3); i++) { const a = rand(0, TAU), s = rand(120, 300); addPart(x, y, Math.cos(a) * s, Math.sin(a) * s - 60, pick(['#ffeb3b', '#ff9800', '#ff5722', '#ffffff']), rand(.4, .7), rand(3, 5.5), 300); }
  G.shake = Math.max(G.shake, Math.min(5, 1.5 + r / 35));
}
function vehLaserHit(p, e) {
  if (effects.length < FXCAP && Q.level) effects.push({ type: 'ering', x: e.x, y: e.y, r: e.r * 2.2, t: 0, dur: .25, col: p.col });
  for (const o of query(e.x, e.y, 34)) if (o !== e && !o.dead) hitEnemy(o, p.dmg * 0.3, { silent: true, tick: 1 });
}

/* ------------------------- 후반 스테이지 몬스터 조합 다양화 ------------------------- */
for (let n = 21; n <= 40; n++) {
  const st = STAGES[n - 1]; if (st.main.some(q => q.k === 'killTag') || st.side.some(q => q.k === 'killTag')) continue;
  const have = new Set(st.mobs.map(m => m[0]));
  for (const s2 of [STAGES[n - 11], STAGES[n - 16]]) {
    const m = s2.mobs.find(m => !have.has(m[0]) && !ET[m[0]].sig && ET[m[0]].ai !== 'summon' && ET[m[0]].ai !== 'heal');
    if (m) { st.mobs.push([m[0], 1]); have.add(m[0]); }
  }
}
