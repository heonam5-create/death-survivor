/* =====================================================================
   데스 서바이버 확장팩: 타격감·대량 처치·콤보·연쇄 폭발, 스테이지별 정예 40종,
   정예 보상 선택, 전투 보급, 차량 낙하산 투하·사용시간·필살기, 스테이지 테마 연출
   ===================================================================== */
const FXCAP = 240;
const fxOk = () => effects.length < FXCAP;

/* ------------------------- 스테이지 테마 (폭발·처치 연출·효과음) ------------------------- */
const THEME_OF = { city: 'war', military: 'war', factory: 'tox', lab: 'tox', subway: 'dust', forest: 'bio', hive: 'bio', ice: 'ice', volcano: 'lava', alien: 'plasma', space: 'plasma', epic: 'plasma', techno: 'neon', cyber: 'neon', waste: 'rad', rift: 'void', doom: 'void', final: 'void' };
const THEMES = {
  war: { n: '포격전', cols: ['#ffb74d', '#ff7043', '#9e9e9e', '#ffe082'], debris: '#4e342e', ring: '#ffcc80', smoke: 1 },
  tox: { n: '오염', cols: ['#c6ff00', '#76ff03', '#ffee58'], debris: '#556b2f', ring: '#c6ff00', snd: 'acid' },
  dust: { n: '흙먼지', cols: ['#bcaaa4', '#8d6e63', '#ffcc80'], debris: '#5d4037', ring: '#d7ccc8', smoke: 1 },
  bio: { n: '생체', cols: ['#b2ff59', '#69f0ae', '#ce93d8'], debris: '#33691e', ring: '#b9f6ca', snd: 'acid' },
  ice: { n: '빙결', cols: ['#e1f5fe', '#80d8ff', '#ffffff'], debris: '#b3e5fc', ring: '#e1f5fe', snd: 'freeze' },
  lava: { n: '용암', cols: ['#ff6d00', '#ffab00', '#ff3d00', '#ffd180'], debris: '#3e2723', ring: '#ff9100', snd: 'flame' },
  plasma: { n: '플라즈마', cols: ['#e040fb', '#7c4dff', '#18ffff'], debris: '#4a148c', ring: '#ea80fc', snd: 'plasma' },
  neon: { n: '전자기', cols: ['#00e5ff', '#ff4081', '#76ff03', '#ffffff'], debris: '#263238', ring: '#18ffff', snd: 'zap' },
  rad: { n: '방사능', cols: ['#c6ff00', '#eeff41', '#76ff03'], debris: '#33691e', ring: '#eeff41', snd: 'acid' },
  void: { n: '차원', cols: ['#b388ff', '#ff1744', '#e040fb'], debris: '#1a0b2e', ring: '#b388ff', snd: 'hole' }
};
const TH = () => THEMES[G.theme] || THEMES.war;
// 폭발: 충격파 고리 + 파편 + 테마 입자 (실제 피해 범위 r 과 같은 크기)
function explodeFx(x, y, r, col) {
  if (!onScreen({ x, y }, r + 40)) return;
  const th = TH();
  if (fxOk()) effects.push({ type: 'xring', x, y, r: r * 1.15, t: 0, dur: 0.32, col: th.ring });
  const nd = Q.level ? Math.min(10, 3 + r / 14) : 2;
  for (let i = 0; i < nd; i++) { const a = rand(0, TAU), s = rand(80, 220) * r / 55; addPart(x, y, Math.cos(a) * s, Math.sin(a) * s - 80, th.debris, rand(.5, .9), rand(2.5, 4.5), 420); }
  if (Q.level) for (let i = 0; i < 4; i++) { const a = rand(0, TAU), s = rand(40, 140); addPart(x, y, Math.cos(a) * s, Math.sin(a) * s, pick(th.cols), .45, rand(2, 4)); }
  if (th.smoke && Q.level >= 2 && r > 40) for (let i = 0; i < 3; i++) parts.length < QC.particles && parts.push(newPart(x + rand(-r, r) * .3, y + rand(-r, r) * .3, rand(-20, 20), rand(-40, -15), 'rgba(90,90,90,.45)', 1.1, 7, 0, 2));
  if (r >= 70) G.shake = Math.max(G.shake, 3 + r / 40);
  if (th.snd && r > 50) AU.sfx(th.snd, 0.7);
}
// 무기 계열별 처치 연출
function killFx(e, W_) {
  if (!Q.level || !fxOk() || !onScreen(e, 30)) return;
  const c = W_ ? W_.c : null, col = W_ ? W_.col : pick(TH().cols);
  if (c === 'energy' || c === 'future') effects.push({ type: 'ering', x: e.x, y: e.y, r: e.r * 2, t: 0, dur: .3, col });
  else if (c === 'blast') for (let i = 0; i < 5; i++) addPart(e.x, e.y, rand(-150, 150), rand(-200, -40), pick(['#ff9800', '#ffeb3b', '#ff5722']), .5, 3.5, 380);
  else if (c === 'special') effects.push({ type: 'xring', x: e.x, y: e.y, r: e.r * 1.6, t: 0, dur: .25, col });
}
// 명중 연출 (무기 계열별): 소총=불꽃, 에너지=고리, 특수=튀김
function hitFx(e, W_, o) {
  if (!Q.level || effects.length > 170 || (e.hfxT || 0) > G.time || !onScreen(e, 10)) return;
  e.hfxT = G.time + 0.09;
  const fast = W_ && W_.cd && W_.cd < 0.12;
  if (fast && Math.random() < 0.6) return;
  effects.push({ type: 'hitx', x: e.x + rand(-4, 4), y: e.y - e.r * .3, r: e.r, ang: o.ang !== undefined ? o.ang : Math.atan2(e.y - P.y, e.x - P.x), t: 0, dur: .14, col: (W_ && W_.col) || '#fff59d', cls: W_ ? W_.c : 'rifle' });
}

/* ------------------------- 콤보 · 연쇄 폭발 ------------------------- */
const COMBO_MS = [10, 30, 50, 100];
function onKill(e) {
  G.combo++; G.comboT = 2.4; if (G.combo > G.comboMax) G.comboMax = G.combo;
  if (COMBO_MS.includes(G.combo) || (G.combo > 100 && G.combo % 50 === 0)) comboMilestone(G.combo);
  // 짧은 시간에 여러 마리를 쓰러뜨리면 연쇄 폭발 (실제 범위 피해)
  G.kwin.push(G.time); while (G.kwin.length && G.kwin[0] < G.time - 0.3) G.kwin.shift();
  if (G.kwin.length >= (G.veh ? 4 : 6) && G.chainCd <= 0 && onScreen(e, 0)) {
    G.chainCd = G.veh ? 0.1 : 0.14; const r = (G.veh ? 58 : 44) + Math.min(30, G.kwin.length * 2), x = e.x, y = e.y, dmg = Math.max(e.lastDmg || 0, e.maxHp * 0.5) * 0.5;
    later(0.06, () => { if (G.state === 'play') explode(x, y, r, dmg, true, pick(TH().cols), { noTrait: 1 }); });
    if (Math.random() < .25 && texts.length < 70) texts.push({ x, y: y - 16, t: 0, v: '연쇄 폭발!', col: '#ffab40', big: 1 });
  }
}
function comboMilestone(c) {
  const lv = c >= 100 ? 3 : c >= 50 ? 2 : c >= 30 ? 1 : 0;
  effects.push({ type: 'combo', c, lv, t: 0, dur: 1.3 });
  const g = goldX((2 + lv * 4) * (1 + G.stage * 0.15) * diffRewardMul());
  if (G.comboGold < (150 + G.stage * 15) * GOLD_X) { G.comboGold += g; G.gold += g; }
  if (lv >= 1) for (let i = 0; i < 2 + lv * 2; i++) dropGem(P.x + rand(-50, 50), P.y + rand(-50, 50), 2 + Math.round(G.stage * 0.25));
  AU.sfx(['coin', 'quest', 'power', 'legend'][lv]);
  if (lv >= 2) { G.flash = Math.max(G.flash, .18); G.flashCol = lv === 3 ? '255,215,0' : '255,120,40'; if (fxOk()) effects.push({ type: 'nova', x: P.x, y: P.y, r: 160 + lv * 40, t: 0, dur: .5, col: lv === 3 ? '#ffd54f' : '#ff7043' }); }
}

/* ------------------------- 스테이지별 정예 몬스터 40종 ------------------------- */
// [이름, 기술1, 기술2, 특성(aura: 주변 강화 / flank: 포위 이동), 장식]
const ELX_DEF = [
  ['중장갑 돌격병', 'charge', 'mgun', '', 'armor'], ['폭주 트럭 좀비', 'rush', 'charge', 'flank', 'spikes'], ['미사일 전투 로봇', 'missile', 'mgun', '', 'pods'],
  ['독성 처리기', 'poison', 'summon', 'aura', 'tanks'], ['실험체 알파', 'blink', 'nova', 'flank', 'tubes'], ['터널 굴착기', 'charge', 'bombard', '', 'drill'],
  ['포자 거수', 'poison', 'rush', 'aura', 'spores'], ['거대 전갈형 기계', 'poison', 'missile', 'flank', 'tail'], ['냉각 전투 메카', 'freeze', 'mgun', '', 'ice'],
  ['서리 거인', 'freeze', 'nova', 'aura', 'ice'], ['용암 장갑 괴수', 'lava', 'charge', '', 'lava'], ['과열 융합로', 'lava', 'shock', 'aura', 'core'],
  ['탈주 생체병기', 'blink', 'rush', 'flank', 'tubes'], ['무중력 저격기', 'mgun', 'blink', '', 'scope'], ['산란 군주', 'summon', 'poison', 'aura', 'spores'],
  ['조립 파쇄기', 'charge', 'bombard', '', 'drill'], ['원격 지휘 로봇', 'summon', 'shield', 'aura', 'antenna'], ['전자기 전투 로봇', 'shock', 'mgun', 'flank', 'coil'],
  ['홀로그램 암살자', 'blink', 'shock', 'flank', 'neon'], ['요새 포격 병기', 'bombard', 'missile', '', 'pods'], ['방사능 돌연변이', 'poison', 'nova', 'aura', 'tanks'],
  ['벙커 경비대장', 'mgun', 'shield', 'aura', 'armor'], ['둥지 수호 여왕', 'summon', 'rush', 'aura', 'crown'], ['함선 방위 드론', 'missile', 'shock', 'flank', 'coil'],
  ['균열 추적자', 'blink', 'nova', 'flank', 'void'], ['흑요석 거신', 'charge', 'lava', '', 'armor'], ['신전 수호 기계', 'shield', 'shock', 'aura', 'core'],
  ['강습 전투정', 'missile', 'bombard', 'flank', 'pods'], ['파멸 사냥꾼', 'rush', 'charge', 'flank', 'spikes'], ['혼돈의 사도', 'mega', 'summon', 'aura', 'void'],
  ['폭풍 하피', 'rush', 'missile', 'flank', 'wings'], ['심해 포식자', 'freeze', 'poison', 'flank', 'tail'], ['수정 골렘', 'nova', 'shield', 'aura', 'crystal'],
  ['돌격형 돌연변이', 'rush', 'poison', 'flank', 'spikes'], ['미라 포격대장', 'bombard', 'blink', 'aura', 'crown'], ['냉각 전투 메카 MK-II', 'freeze', 'mgun', 'flank', 'ice'],
  ['플라즈마 화염귀', 'lava', 'nova', 'aura', 'lava'], ['시간 도둑', 'blink', 'mega', 'flank', 'void'], ['심장 방위 병기', 'mega', 'shock', 'aura', 'core'], ['거대 파괴 병기', 'mega', 'bombard', 'aura', 'armor']
];
const SKN_X = { nova: '충격 폭발', charge: '돌진', summon: '소환', missile: '유도탄', blink: '순간이동', shield: '보호막', mgun: '기관총 난사', poison: '독성 포격', freeze: '빙결 파동', lava: '용암 폭발', shock: '전기 충격', mega: '다중 광역 공격', rush: '고속 추적', bombard: '포격 요청' };
const ELX = [];
for (let n = 1; n <= 40; n++) {
  const d = ELX_DEF[n - 1], sig = ET['sig' + n], h = (n * 47 + 180) % 360;
  PAL['elx' + n] = { a: hsl(h, 40, 40), b: hsl(h + 20, 35, 20), c: hsl(h + 180, 95, 60), e: '#ff1744', s: hsl(h + 60, 95, 62), glow: hsl(h, 100, 62) };
  const def = Object.assign({}, sig, { n: d[0], pal: 'elx' + n, hp: sig.hp * 1.3, r: Math.min(20, sig.r * 1.08), xp: 6, ai: ['dash', 'blink', 'phase'].includes(sig.ai) ? sig.ai : undefined, sig: 0, id: 'elx' + n, minion: undefined });
  delete def.shot; delete def.keep; ET['elx' + n] = def;
  ELX[n] = { n: d[0], sk: [d[1], d[2]], aura: d[3] === 'aura', flank: d[3] === 'flank', deco: d[4] };
  STAGES[n - 1].elx = 'elx' + n;
}
function setupElx(e) {
  const X = ELX[G.stage]; e.elx = X; e.skill = X.sk[0]; e.skill2 = X.sk[1]; e.skT = 2.2;
  if (X.flank) e.flankA = rand(0, TAU);
}
function eliteSkillX(e, a) {
  const dm = e.dmg;
  switch (e.skill) {
    case 'mgun': e.skT = 4.5; hazards.push({ kind: 'line', x: e.x, y: e.y, ang: a, len: 340, w: 16, t: 0, delay: 0.7, dmg: 0, thin: 1 });
      for (let i = 0; i < 10; i++) later(0.7 + i * 0.06, () => { if (G.state === 'play' && !e.dead) { eShot(e.x, e.y, a + rand(-.07, .07), 270, dm * .32, 'arrow'); if (i % 3 === 0) AU.sfx('eshot'); } }); break;
    case 'poison': e.skT = 5; for (let i = 0; i < 3; i++) hazards.push({ kind: 'circle', x: P.x + (i ? rand(-90, 90) : 0), y: P.y + (i ? rand(-90, 90) : 0), r: 52, t: 0, delay: 1.2 + i * .1, dmg: dm * .8 }); for (let i = 0; i < 3; i++) eShot(e.x, e.y, a + (i - 1) * .3, 150, dm * .4, 'acid'); break;
    case 'freeze': e.skT = 5.5; hazards.push({ kind: 'circle', x: e.x, y: e.y, r: 130, t: 0, delay: 0.95, dmg: dm * .7 }); later(.95, () => { if (G.state !== 'play' || e.dead) return; if (Math.hypot(P.x - e.x, P.y - e.y) < 135) P.slowT = 2.2; for (let i = 0; i < 12; i++) eShot(e.x, e.y, i / 12 * TAU, 150, dm * .35, 'ice'); AU.sfx('freeze'); }); break;
    case 'lava': e.skT = 5; for (let i = 0; i < 6; i++) { const aa = i / 6 * TAU; hazards.push({ kind: 'circle', x: e.x + Math.cos(aa) * 90, y: e.y + Math.sin(aa) * 90, r: 46, t: 0, delay: 1.0, dmg: dm * .9 }); } hazards.push({ kind: 'circle', x: P.x, y: P.y, r: 48, t: 0, delay: 1.3, dmg: dm * .9 }); later(1, () => { if (G.state === 'play') for (let i = 0; i < 16; i++) addPart(e.x, e.y, rand(-200, 200), rand(-220, 0), pick(['#ff6d00', '#ffab00']), .7, 4, 300); }); break;
    case 'shock': e.skT = 5; { const b0 = rand(0, TAU); for (let i = 0; i < 4; i++) hazards.push({ kind: 'line', x: e.x, y: e.y, ang: b0 + i * Math.PI / 2, len: 270, w: 18, t: 0, delay: 0.9, dmg: dm * .8, beam: 1 }); } AU.sfx('zap'); break;
    case 'mega': e.skT = 6.5; for (let i = 0; i < 3; i++) hazards.push({ kind: 'circle', x: P.x + (i ? rand(-110, 110) : 0), y: P.y + (i ? rand(-110, 110) : 0), r: 56, t: 0, delay: 1.1 + i * .15, dmg: dm }); for (let i = 0; i < 2; i++) hazards.push({ kind: 'line', x: e.x, y: e.y, ang: a + (i ? .5 : -.5), len: 380, w: 20, t: 0, delay: 1.2, dmg: dm * .8, beam: 1 }); later(.6, () => { if (G.state === 'play' && !e.dead) for (let i = 0; i < 16; i++) eShot(e.x, e.y, i / 16 * TAU, 140, dm * .35, 'plasma'); }); AU.sfx('alarm'); break;
    case 'rush': e.skT = 6; e.rushT = 2.6; hazards.push({ kind: 'line', x: e.x, y: e.y, ang: a, len: 200, w: e.r * 1.6, t: 0, delay: .5, dmg: 0, thin: 1 }); texts.push({ x: e.x, y: e.y - e.r - 8, t: 0, v: '고속 추적!', col: '#ff5252', big: 1 }); AU.sfx('dash'); break;
    case 'bombard': e.skT = 6; for (let i = 0; i < 5; i++) { const x = P.x + rand(-140, 140), y = P.y + rand(-140, 140); hazards.push({ kind: 'circle', x, y, r: 58, t: 0, delay: 1.3 + i * .15, dmg: dm * .9 }); later(1.05 + i * .15, () => { if (G.state === 'play') effects.push({ type: 'skybeam', x, y, r: 7, t: 0, dur: .25, col: '#ff8a80' }); }); } AU.sfx('alarm'); break;
    default: e.skT = 4;
  }
}
function updateElitesX(dt) {
  G.auraT = (G.auraT || 0) - dt; const doAura = G.auraT <= 0; if (doAura) G.auraT = 1;
  for (const e of enemies) {
    if (e.dead || !e.elx) continue;
    if (doAura && e.elx.aura) for (const o of query(e.x, e.y, 150)) if (!o.elite && !o.boss && !o.static) o.buffT = 1.6;
  }
}
// 정예의 포위 이동 / 동료 공격 대상
function extTarget(e) {
  if (e.flankA !== undefined) {
    const d = Math.hypot(P.x - e.x, P.y - e.y);
    if (d > 170) { e.flankA += 0.004; return [P.x + Math.cos(e.flankA) * 140, P.y + Math.sin(e.flankA) * 140]; }
    return null;
  }
  if (allies.length && !e.boss) { const at = allyTarget(e); if (at) return [at.x, at.y]; }
  return null;
}
function eliteDeathFx(e) {
  const th = TH();
  explode(e.x, e.y, 95, e.maxHp * 0.04, true, th.ring);
  if (fxOk()) effects.push({ type: 'nova', x: e.x, y: e.y, r: 150, t: 0, dur: .5, col: e.elx ? PAL[e.pal].glow || th.ring : th.ring });
  for (let i = 0; i < 24; i++) addPart(e.x, e.y, rand(-260, 260), rand(-300, 60), pick(th.cols.concat(['#ffffff'])), rand(.5, 1), rand(3, 5.5), 350);
  G.shake = Math.max(G.shake, 7); AU.sfx('bigboom');
  if (Math.random() < (e.elx ? 0.65 : 0.35)) G.eliteRw = (G.eliteRw || 0) + 1;
}

/* ------------------------- 정예 처치 보상 선택 ------------------------- */
const EREW = [
  { k: 'wup', ic: '⬆️', n: '무기 강화', d: '보유 무기 하나의 레벨 +1', ok: () => G.weapons.some(w => w.lv < WMAX) },
  { k: 'aspd', ic: '⚡', n: '공격 속도 증가', d: '이번 스테이지 공격 속도 +8% (최대 4회)', ok: () => (G.erAspd || 0) < 4 },
  { k: 'ally', ic: '🤝', n: '동료 강화', d: '동료 공격력 +15% · 동료 체력 전부 회복', ok: () => allies.length > 0 && (G.allyBoost || 1) < 1.8 },
  { k: 'heal', ic: '❤️', n: '체력 회복', d: '최대 체력의 45% 회복', ok: () => true },
  { k: 'pot', ic: '🧪', n: '회복 물약', d: '물약 +1', ok: () => G.potions < 6 },
  { k: 'crit', ic: '🎯', n: '정밀 사격', d: '이번 스테이지 치명타 확률 +5% (최대 3회)', ok: () => (G.erCrit || 0) < 3 }
];
function openEliteReward() {
  G.eliteRw--; const pool = EREW.filter(r => r.ok()).sort(() => Math.random() - .5).slice(0, 3);
  if (window.__botPick) { applyEliteReward(pool[0]); return; }
  G.state = 'levelup'; joy.id = null; joy.mag = 0; AU.sfx('chest');
  $('lvTitle').textContent = '🎖️ 정예 처치 보상!';
  const box = $('cards'); box.innerHTML = '';
  for (const r of pool) {
    const b = document.createElement('button'); b.className = 'card'; b.style.borderColor = '#ffd54f';
    b.innerHTML = `<div class="ci">${r.ic}</div><div><div class="cn">${r.n}<em>정예 보상</em></div><div class="cd">${r.d}</div></div>`;
    b.addEventListener('click', () => { if (G.state !== 'levelup') return; AU.sfx('button'); applyEliteReward(r); showScreen(null); G.state = 'play'; G.lastFrame = performance.now(); }, { once: true });
    box.appendChild(b);
  }
  showScreen('scrLevel');
}
function applyEliteReward(r) {
  switch (r.k) {
    case 'wup': { const own = G.weapons.filter(w => w.lv < WMAX); const w = pick(own); w.lv++; const c = codexOf(w.id); c.maxLv = Math.max(c.maxLv || 1, w.lv); toast(`⬆ ${WMAP[w.id].nm} Lv${w.lv}`, 1.2, '#ffd54f'); break; }
    case 'aspd': G.erAspd = (G.erAspd || 0) + 1; G.buff.aspd += 0.08; recalc(); break;
    case 'ally': G.allyBoost = (G.allyBoost || 1) * 1.15; for (const a of allies) { a.hp = a.maxHp; if (a.down > 0) a.down = .01; } break;
    case 'heal': heal(Math.round(P.maxHp * .45)); break;
    case 'pot': G.potions++; updatePotBadge(); break;
    case 'crit': G.erCrit = (G.erCrit || 0) + 1; G.buff.crit += 0.05; recalc(); break;
  }
}

/* ------------------------- 전투 보급 (차량 보급과 별도) ------------------------- */
const SUPK = { fire: { n: '화력 강화', ic: '🔥', d: '공격력 +35%' }, ammo: { n: '탄약 증강', ic: '🎯', d: '발사체 +1' }, rapid: { n: '속사 모드', ic: '⏩', d: '공격 속도 +30%' } };
function supApply() {
  const S = G.sup; if (!S || S.t <= 0 || G.veh) return;
  if (S.k === 'fire') P.dmgMul *= 1.35; else if (S.k === 'ammo') P.projAdd += 1; else if (S.k === 'rapid') P.cdMul /= 1.3;
}
function extEvent2(ev) {
  if (ev === 'supply2') {
    const [x, y] = freeSpot(100, 190); effects.push({ type: 'drop', x, y, t: 0, dur: 1.3 });
    later(1.3, () => { if (G.state !== 'play') return; dropPickup('wsup', x, y, 0, null, true); G.shake = Math.max(G.shake, 3); AU.sfx('slam'); });
    toast('🎁 무기 보급 상자 투하!', 1.4, '#ffd54f');
  } else if (ev === 'lasergrid') {
    toast('⚠ 경고: 레이저 격자 공격!<br><span style="font-size:14px">흐릿한 경고 줄을 피하세요</span>', 2, '#ff5252'); AU.sfx('alarm');
    for (let w = 0; w < 3; w++) later(w * 1.6, () => {
      if (G.state !== 'play') return; const base = rand(0, Math.PI);
      for (let i = -1; i <= 1; i++) { const a = base + (w % 2 ? Math.PI / 2 : 0), ox = Math.cos(a + Math.PI / 2) * i * 90, oy = Math.sin(a + Math.PI / 2) * i * 90; hazards.push({ src: 'env', kind: 'line', x: P.x + ox - Math.cos(a) * 400, y: P.y + oy - Math.sin(a) * 400, ang: a, len: 800, w: 16, t: 0, delay: 1.25, dmg: 9 + G.stage * .7, beam: 1 }); }
    });
  }
}
function collectSup() {
  const k = pick(Object.keys(SUPK)), S = G.sup;
  if (S && S.t > 0) { S.t = Math.max(S.t, 20); S.k = k; } else G.sup = { k, t: 20 };
  recalc(); AU.sfx('power');
  toast(`🎁 ${SUPK[k].ic} ${SUPK[k].n}! (${SUPK[k].d}, 20초)${G.veh ? '<br><span style="font-size:13px">하차 후 적용됩니다</span>' : ''}`, 1.6, '#ffd54f');
}

/* ------------------------- 차량 낙하산 투하 ------------------------- */
function pickDropDef(n) { const w = [[.5, .3, .2], [.2, .5, .3], [.3, .2, .5]][n % 3]; return VEH_ST[n][wpick([[0, w[0]], [1, w[1]], [2, w[2]]])]; }
function vehicleDrop(def, bonus) {
  const [x, y] = freeSpot(200, 320);
  const v = mkVeh(def, x, y); v.drop = { t: 0, dur: 4.2, spawnT: .6 }; v.bonus = !!bonus; v.seen = true; vehs.push(v);
  toast(`🪂 특수 전투 장비 투하!<br><span style="font-size:15px">${def.name} · 착륙하면 탑승!</span>`, 2.6, '#80deea'); AU.sfx('alarm');
}
function updateDrops(dt) {
  if (!G.vdropDone && G.bossState < 3 && !G.clearing && (G.t >= G.vdropT || G.bossState === 1)) { G.vdropDone = true; vehicleDrop(pickDropDef(G.stage)); }
  for (const v of vehs) {
    if (!v.drop) continue; const D = v.drop; D.t += dt; D.spawnT -= dt;
    // 낙하 중에는 주변 적이 몰려옴
    if (D.spawnT <= 0) { D.spawnT = 1; for (let i = 0; i < 3 + Math.floor(G.stage / 8) && aliveCount() < maxEnemies(); i++) { const a = rand(0, TAU), r = rand(240, 320); spawnEnemy(wpick(G.st.mobs), v.x + Math.cos(a) * r, v.y + Math.sin(a) * r); } }
    if (D.t >= D.dur) {
      v.drop = null; G.shake = Math.max(G.shake, 6); AU.sfx('slam');
      effects.push({ type: 'xring', x: v.x, y: v.y, r: 90, t: 0, dur: .45, col: '#d7ccc8' });
      for (let i = 0; i < 18; i++) addPart(v.x + rand(-30, 30), v.y + 10, rand(-160, 160), rand(-90, -20), 'rgba(190,170,140,.7)', .8, 5);
      for (const e of query(v.x, v.y, 60).slice()) hitEnemy(e, 30 * vehDmg(), { kb: 260, ang: Math.atan2(e.y - v.y, e.x - v.x), silent: true });
      toast('✅ 착륙 완료! 가까이 가서 탑승하세요', 1.6, '#64ffda');
    }
  }
}

/* ------------------------- 차량 필살기 (탑승마다 1회) ------------------------- */
function useVehUlt() {
  const v = G.veh; if (!v || v.ultUsed || G.state !== 'play') return;
  v.ultUsed = true; const k = VULT[v.def.ch], dm = vehDmg(); setUltBtn();
  G.flash = .35; G.flashCol = '255,230,150'; G.shake = Math.max(G.shake, 8); AU.sfx('power'); AU.sfx('bigboom');
  toast(`💥 필살기: ${VULT_NAME[k]}!`, 1.4, '#ffd54f');
  const face = v.face || 1, fa = P.moving ? Math.atan2(P.lastMy, P.lastMx) : (face > 0 ? 0 : Math.PI);
  if (k === 'bigshell') {
    for (let i = 0; i < 7; i++) { const t = densest(Math.min(VW, VH) * .6); const x = t ? t.x + rand(-60, 60) : P.x + Math.cos(fa) * (120 + i * 40), y = t ? t.y + rand(-60, 60) : P.y + Math.sin(fa) * (120 + i * 40);
      later(i * .14, () => effects.push({ type: 'target', x, y, r: 110, t: 0, dur: .7, col: '#ff6d00' }));
      later(i * .14 + .7, () => { if (G.state !== 'play') return; effects.push({ type: 'skybeam', x, y, r: 16, t: 0, dur: .3, col: '#ffe0b2' }); explode(x, y, 110, 45 * dm, true, '#ff6d00'); AU.sfx('cannon', .7); }); }
  } else if (k === 'carpet') {
    for (let i = 0; i < 36; i++) { const x = P.x + ((i % 6) - 2.5) * 70 + rand(-15, 15), y = P.y + (Math.floor(i / 6) - 2.5) * 70 + rand(-15, 15);
      later(.2 + i * .04, () => { if (G.state !== 'play') return; mkProj({ kind: 'missile', x: P.x + rand(-30, 30), y: P.y - 40, vx: 0, vy: -200, ang: -Math.PI / 2, acc: 600, r: 5, dmg: 20 * dm, pierce: 1, life: 1.2, col: '#ff8a65', boom: 55, explodeEnd: 1, target: { x, y, dead: false }, homing: 9, size: 1 }); }); }
    AU.sfx('missile');
  } else if (k === 'strafe') {
    P.dashT = .7; P.dashVx = Math.cos(fa) * 650; P.dashVy = Math.sin(fa) * 650; P.inv = Math.max(P.inv, .9);
    for (let i = 0; i < 12; i++) later(.1 + i * .06, () => { if (G.state !== 'play') return; const x = P.x + rand(-60, 60), y = P.y + rand(-60, 60); explode(x, y, 72, 30 * dm, true, '#ff7043'); });
  } else if (k === 'megalaser') { v.ultK = k; v.ultT = 2.3; v.ultAng = fa; const t = densest(500); if (t) v.ultAng = Math.atan2(t.y - P.y, t.x - P.x); AU.sfx('ion'); }
  else if (k === 'barrage') { v.ultK = k; v.ultT = 3; v.ultAng = fa; const t = densest(400); if (t) v.ultAng = Math.atan2(t.y - P.y, t.x - P.x); }
  else if (k === 'emstorm') {
    for (let w = 0; w < 3; w++) later(w * .4, () => { if (G.state !== 'play') return; effects.push({ type: 'nova', x: P.x, y: P.y, r: Math.max(VW, VH) * .55, t: 0, dur: .4, col: '#82b1ff' }); for (const e of enemies) if (!e.dead && onScreen(e, 10)) { if (fxOk() && Math.random() < .5) effects.push({ type: 'bolt', pts: [[P.x, P.y - 20], [e.x, e.y]], t: 0, dur: .2, seed: Math.random() * 100, col: '#b388ff' }); hitEnemy(e, 18 * dm, { stun: .8, silent: true }); } AU.sfx('zap'); });
  }
}
function updateUlt(v, dt) {
  v.ultT -= dt; const dm = vehDmg();
  if (v.ultK === 'megalaser') {
    const t = nearest(P.x, P.y, 600); if (t) v.ultAng += angDiff(Math.atan2(t.y - P.y, t.x - P.x), v.ultAng) * Math.min(1, dt * 2);
    const x1 = P.x, y1 = P.y - v.ch.mh * .6, x2 = x1 + Math.cos(v.ultAng) * 650, y2 = y1 + Math.sin(v.ultAng) * 650;
    v.ultBeam = [x1, y1, x2, y2]; v.ultTick = (v.ultTick || 0) - dt;
    if (v.ultTick <= 0) { v.ultTick = .1; for (const e of query((x1 + x2) / 2, (y1 + y2) / 2, 335).slice()) if (segDist2(e.x, e.y, x1, y1, x2, y2) < (24 + e.r) ** 2) hitEnemy(e, 6 * dm, { tick: 1, silent: true, kb: 40, ang: v.ultAng }); AU.sfx('beam', .8); G.shake = Math.max(G.shake, 3); }
    if (Q.level) addPart(x2, y2, rand(-120, 120), rand(-120, 120), '#ff80ab', .3, 4);
  } else if (v.ultK === 'barrage') {
    v.ultTick = (v.ultTick || 0) - dt;
    while (v.ultTick <= 0) { v.ultTick += .02; const a = v.ultAng + rand(-.5, .5), [x, y] = vMuzzle(v, a); mkProj({ kind: 'tracer', x, y, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, ang: a, r: 4, dmg: 3 * dm, pierce: 3, life: .45, col: '#ffe082', size: 1.2, kb: 30 }); if (Math.random() < .3) vFlash(x, y, a, '#ffe082', 1.4); }
    if (Math.random() < .5) AU.sfx('mini', 1.1);
  }
  if (v.ultT <= 0) { v.ultK = null; v.ultBeam = null; }
}
function setUltBtn() {
  const b = $('bUlt'); if (!b) return; const v = G.veh;
  if (v && !v.ultUsed) { b.style.display = 'flex'; b.querySelector('.lb').textContent = '필살기'; } else b.style.display = 'none';
}

/* ------------------------- 확장팩 스테이지 시작 / 업데이트 ------------------------- */
function xpStageStart() {
  G.theme = THEME_OF[G.st.mu] || 'war';
  pools = []; G.adaptLive = 0; turStageStart();
  G.combo = 0; G.comboT = 0; G.comboMax = 0; G.comboGold = 0; G.kwin = []; G.chainCd = 0; G.eliteRw = 0; G.erAspd = 0; G.erCrit = 0; G.sup = null; G.auraT = 0;
  // 스테이지 전환 시 메모리 정리: 지난 스테이지 배경 타일·스프라이트 캐시 해제
  groundCache.clear(); if (SPR.size > 700) SPR.clear();
  setUltBtn();
}
function xpUpdate(dt) {
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
  if (G.chainCd > 0) G.chainCd -= dt;
  if (G.sup && G.sup.t > 0) { G.sup.t -= dt; if (G.sup.t <= 0) { G.sup = null; recalc(); toast('보급 효과 종료', .9, '#b0bec5'); } }
  updateElitesX(dt); updateDrops(dt); updatePools(dt); turretUpdate(dt); G.adaptT = (G.adaptT || 0) - dt; if (G.adaptT <= 0) { G.adaptT = 1; G.adaptLive = Math.min(0.08, 0.012 * activeAllies() * clamp(allyGrowth(), 1, 2.5)); }
  if (effects.length > 280) effects.splice(0, effects.length - 280);
}
