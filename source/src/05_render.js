/* =====================================================================
   렌더링
   ===================================================================== */
function render() {
  const st = G.st;
  if (!st || !['play', 'levelup', 'pause', 'result', 'dying'].includes(G.state)) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0d0818'; ctx.fillRect(0, 0, cv.width, cv.height); return; }
  const sh = save.settings.shake ? G.shake : 0;
  G.camX = P.x + (sh ? rand(-sh, sh) : 0); G.camY = P.y + (sh ? rand(-sh, sh) : 0);
  const cx = cv.width / 2, cy = cv.height / 2;
  const setW = () => ctx.setTransform(K, 0, 0, K, cx - G.camX * K, cy - G.camY * K);
  setW();
  // 지면 + 움직이는 장치
  const tile = bakeGround(st.bg);
  const x0 = Math.floor((G.camX - VW / 2) / TILE) * TILE, y0 = Math.floor((G.camY - VH / 2) / TILE) * TILE;
  for (let x = x0; x < G.camX + VW / 2; x += TILE) for (let y = y0; y < G.camY + VH / 2; y += TILE) { ctx.drawImage(tile, x, y, TILE + 0.5, TILE + 0.5); drawLive(st.bg, x, y); }
  // 장판 (화염·독·산성·블랙홀)
  for (const f of fields) drawField(f);
  // 위험 구역
  for (const h of hazards) {
    const p = Math.min(1, h.t / h.delay);
    if (h.kind === 'circle') {
      ctx.fillStyle = 'rgba(255,30,30,0.18)'; circ(ctx, h.x, h.y, h.r); ctx.fill();
      ctx.fillStyle = 'rgba(255,30,30,0.35)'; circ(ctx, h.x, h.y, h.r * p); ctx.fill();
      ctx.strokeStyle = 'rgba(255,60,60,0.9)'; ctx.lineWidth = 2; circ(ctx, h.x, h.y, h.r); ctx.stroke();
    } else if (h.kind === 'line') {
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.ang);
      ctx.fillStyle = h.thin ? 'rgba(255,30,30,0.15)' : 'rgba(255,30,30,0.2)'; ctx.fillRect(0, -h.w / 2, h.len, h.w);
      ctx.fillStyle = 'rgba(255,30,30,0.35)'; ctx.fillRect(0, -h.w / 2, h.len * p, h.w);
      if (!h.thin) { ctx.strokeStyle = 'rgba(255,60,60,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(0, -h.w / 2, h.len, h.w); }
      ctx.restore();
    }
  }
  // 지뢰, 발전기
  for (const m of mines) { circ(ctx, m.x, m.y, 6); fs(ctx, '#37474f', 1.5); ctx.fillStyle = m.armed && Math.sin(G.time * 10) > 0 ? '#ff1744' : '#5d0000'; circ(ctx, m.x, m.y, 2.5); ctx.fill(); }
  for (const g of gens) {
    const s = getSprite('gen', g.r, Math.floor(G.time * 4) % 4, g.hitT > 0);
    ctx.globalAlpha = g.dead ? 0.35 : 1; ctx.drawImage(s.c, g.x - s.box / 2, g.y - s.box / 2, s.box, s.box); ctx.globalAlpha = 1;
    if (!g.dead) { ctx.save(); ctx.translate(g.x, g.y - 18); circ(ctx, 0, 0, 6); fs(ctx, '#455a64', 1.5); ctx.rotate(g.a || 0); rr(ctx, 0, -2, 14, 4, 1.5); fs(ctx, '#263238', 1); ctx.restore(); }
    if (!g.dead) { const w = 44; ctx.fillStyle = '#000a'; ctx.fillRect(g.x - w / 2, g.y - g.r - 18, w, 6); ctx.fillStyle = g.hp / g.maxHp < 0.3 ? '#ff1744' : '#00e676'; ctx.fillRect(g.x - w / 2, g.y - g.r - 18, w * g.hp / g.maxHp, 6); if (g.repair) { ctx.fillStyle = '#69f0ae'; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔧 수리 중', g.x, g.y - g.r - 22); } }
  }
  drawWorldExt('under');
  // 아이템
  for (const p of pickups) { if (p.dead || Math.abs(p.x - G.camX) > VW / 2 + 30 || Math.abs(p.y - G.camY) > VH / 2 + 30) continue; drawPickup(p); }
  // 포탑
  for (const t of turrets) drawTurret(t);
  // 적
  const fr = Math.floor(G.time * 7);
  for (const e of enemies) {
    if (e.dead) continue;
    if (Math.abs(e.x - G.camX) > VW / 2 + e.r * 2 || Math.abs(e.y - G.camY) > VH / 2 + e.r * 2) continue;
    if (e.elite || e.boss || e.type === 'golden') {
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(G.time * 6);
      ctx.drawImage(glowSprite(e.boss ? '#b388ff' : e.type === 'golden' ? '#ffd54f' : e.affix === 'aura' ? '#ff3d00' : e.affix === 'shield' ? '#40c4ff' : '#ff9800'), e.x - e.r * 1.6, e.y - e.r * 1.4, e.r * 3.2, e.r * 3.2); ctx.globalAlpha = 1;
    }
    const f = e.static && e.type !== 'portal' ? Math.floor(G.time * 3) % 4 : (fr + Math.floor(e.seed * 3)) % 4;
    const s = getSprite(e.draw, e.r, e.stunT > 0 && !e.static ? 0 : f, e.flash > 0, e.pal);
    const z = e.z || 0;
    if (z > 0) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r, e.r, e.r * .3, 0, 0, TAU); ctx.fill(); }
    if (e.alpha < 1) ctx.globalAlpha = e.alpha;
    ctx.setTransform((e.static ? 1 : e.face) * K, 0, 0, K, cx + (e.x - G.camX) * K, cy + (e.y - z - G.camY) * K);
    ctx.drawImage(s.c, -s.box / 2, -s.box / 2, s.box, s.box);
    setW(); ctx.globalAlpha = 1;
    if (e.elite && !e.boss) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(G.time * 1.5); ctx.setLineDash([8, 6]); ctx.strokeStyle = e.affix === 'aura' ? '#ff3d00' : '#ffd54f'; ctx.lineWidth = 2.5; circ(ctx, 0, 0, e.r * 1.25); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.moveTo(e.x - 10, e.y - e.r * 1.25); ctx.lineTo(e.x - 6, e.y - e.r * 1.25 - 10); ctx.lineTo(e.x, e.y - e.r * 1.25 - 4); ctx.lineTo(e.x + 6, e.y - e.r * 1.25 - 10); ctx.lineTo(e.x + 10, e.y - e.r * 1.25); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.font = '900 9px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.strokeText('정예 ' + e.d.n, e.x, e.y - e.r * 1.5 - 12); ctx.fillText('정예 ' + e.d.n, e.x, e.y - e.r * 1.5 - 12);
    }
    if (e.shieldT > 0) { ctx.globalAlpha = .35 + .15 * Math.sin(G.time * 12); ctx.fillStyle = '#40c4ff'; circ(ctx, e.x, e.y, e.r * 1.35); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#e1f5fe'; ctx.lineWidth = 2; circ(ctx, e.x, e.y, e.r * 1.35); ctx.stroke(); }
    if (e.burn > 0 && e.burn > 1.6 && Q.level) { ctx.globalAlpha = .7; ctx.fillStyle = '#ff6d00'; ctx.beginPath(); const fx = e.x, fy = e.y - e.r * .2, fl = Math.sin(G.time * 25 + e.seed) * 2; ctx.moveTo(fx - 5, fy); ctx.quadraticCurveTo(fx, fy - 14 - fl, fx + 5, fy); ctx.fill(); ctx.globalAlpha = 1; }
    if (e.frozen > 0) { ctx.fillStyle = 'rgba(179,229,252,.55)'; circ(ctx, e.x, e.y, e.r * 1.05); ctx.fill(); ctx.strokeStyle = '#e1f5fe'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x - e.r * .6, e.y - e.r * .4); ctx.lineTo(e.x + e.r * .4, e.y + e.r * .5); ctx.moveTo(e.x + e.r * .5, e.y - e.r * .5); ctx.lineTo(e.x - e.r * .2, e.y + e.r * .3); ctx.stroke(); }
    if (e.markT > 0) { ctx.strokeStyle = '#ff4081'; ctx.lineWidth = 1.5; circ(ctx, e.x, e.y - e.r * .2, e.r * .55); ctx.stroke(); line(ctx, e.x - e.r * .8, e.y - e.r * .2, e.x + e.r * .8, e.y - e.r * .2, 1.2, '#ff4081'); }
    else if (e.slowT > 0) { ctx.strokeStyle = 'rgba(128,216,255,.7)'; ctx.lineWidth = 2; circ(ctx, e.x, e.y + e.r * .6, e.r * .7); ctx.stroke(); }
    if (e.poison > 0 && Q.level && Math.random() < 0.12) addPart(e.x + rand(-e.r, e.r) * .5, e.y, 0, -40, '#76ff03', .4, 2.5);
    if (e.burn > 0 && Q.level && Math.random() < 0.15) addPart(e.x + rand(-e.r, e.r) * .5, e.y, 0, -50, '#ff7043', .35, 2.5);
    if (e.stunT > 0 && !e.frozen && !e.static) { ctx.fillStyle = '#ffeb3b'; for (let i = 0; i < 3; i++) { const a = G.time * 6 + i * 2.1; circ(ctx, e.x + Math.cos(a) * e.r * .6, e.y - e.r * 1.1 + Math.sin(a) * 3, 2); ctx.fill(); } }
    if ((e.elite || e.static || e.type === 'golden') && !e.boss) { const w = Math.max(28, e.r * 2); ctx.fillStyle = '#000a'; ctx.fillRect(e.x - w / 2, e.y - e.r * 1.5 - 4, w, 4); ctx.fillStyle = e.static ? '#e040fb' : e.type === 'golden' ? '#ffd54f' : '#ff9800'; ctx.fillRect(e.x - w / 2, e.y - e.r * 1.5 - 4, w * Math.max(0, e.hp / e.maxHp), 4); }
    if (e.d.ai === 'bomb' && e.st === 1) { ctx.strokeStyle = 'rgba(255,50,0,.8)'; ctx.lineWidth = 2; circ(ctx, e.x, e.y, 55); ctx.stroke(); ctx.fillStyle = 'rgba(255,50,0,.25)'; circ(ctx, e.x, e.y, 55 * (1 - e.aiT / 0.9)); ctx.fill(); }
    if (e.d.ai === 'dash' && e.st === 1) { ctx.strokeStyle = 'rgba(255,0,0,.55)'; ctx.lineWidth = e.r; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dang) * 150, e.y + Math.sin(e.dang) * 150); ctx.stroke(); }
    if (e.type === 'egg') { ctx.fillStyle = '#fff'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(e.hatch), e.x, e.y + 3); }
  }
  // 플레이어
  for (const f of effects) if (f.type === 'ghost') { ctx.globalAlpha = 0.35 * (1 - f.t / f.dur); drawPlayer(ctx, f.x, f.y, f.face, 0, true); ctx.globalAlpha = 1; }
  if (G.powerT > 0 && QC.glow) { ctx.globalAlpha = .45 + .15 * Math.sin(G.time * 8); ctx.drawImage(glowSprite('#ff1744'), P.x - 32, P.y - 40, 64, 64); ctx.globalAlpha = 1; }
  if (G.veh) drawVehicle(ctx, G.veh, P.x, P.y, true); else drawPlayer(ctx, P.x, P.y, P.face, P.walkT, false);
  // 드론
  if (!G.veh) {
  for (const w of G.weapons) if (w.drones) for (const d of w.drones) drawDrone(d, w.evo);
  for (const w of G.weapons) if (w.saws && w.sawS) for (const [x, y, a] of w.saws) { ctx.save(); ctx.translate(x, y); ctx.rotate(G.time * 18); ctx.fillStyle = w.sawS.col; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 7 : 11; ctx.lineTo(Math.cos(i / 16 * TAU) * r, Math.sin(i / 16 * TAU) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#455a64'; circ(ctx, 0, 0, 3); ctx.fill(); ctx.restore(); }
  for (const p of projs) if (p.harp && !p.dead) { ctx.strokeStyle = 'rgba(141,110,99,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(P.x, P.y - 4); ctx.lineTo(p.x, p.y); ctx.stroke(); }
  // 광선 (회전 레이저·연속 레이저)
  for (const w of G.weapons) if (w.beams && w.beamS) for (const b of w.beams) drawBeam(b, w.beamS);
  }
  for (const w of G.weapons) if (!G.veh && w.coneOn && w.coneS && QC.glow) { const [mx, my] = muzzle(w.coneAng); ctx.globalAlpha = .18; ctx.fillStyle = w.coneS.col; ctx.beginPath(); ctx.moveTo(mx, my); ctx.arc(mx, my, w.coneS.range, w.coneAng - w.coneS.arc, w.coneAng + w.coneS.arc); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
  drawWorldExt('over');
  // 투사체
  for (const p of projs) drawProj(p);
  for (const b of eprojs) drawEProj(b);
  for (const f of effects) drawEffect(f);
  for (const q of parts) { const a = Math.max(0, q.life / q.max); ctx.globalAlpha = a; ctx.fillStyle = q.col; if (q.grow) { circ(ctx, q.x, q.y, q.size * (1 + (1 - a) * q.grow)); ctx.fill(); } else ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }
  ctx.globalAlpha = 1;
  // 데미지 숫자
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  for (const t of texts) {
    const life = t.big ? 1.4 : t.crit ? 0.9 : 0.7, k = t.t / life, y = t.y - 22 * k - (t.pl ? 10 * k : 0);
    const sz = t.big ? 18 : t.crit ? 17 : t.pl ? 14 : 12; const sc = t.crit && k < .15 ? 1 + (0.15 - k) * 4 : 1;
    ctx.font = `900 ${Math.round(sz * sc)}px "Noto Sans KR",sans-serif`; ctx.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
    ctx.lineWidth = 3; ctx.strokeStyle = '#000'; const s = typeof t.v === 'number' ? (t.crit ? t.v + '!' : String(t.v)) : t.v;
    ctx.strokeText(s, t.x, y); ctx.fillStyle = t.col || (t.crit ? '#ffeb3b' : '#fff'); ctx.fillText(s, t.x, y);
  }
  ctx.globalAlpha = 1;
  // 화면 효과: 어둠(조명), 보스 조명, 날씨
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const bossOn = G.bossState === 1 || G.bossState === 2;
  const dark = Math.max(st.dark || 0, bossOn ? 0.35 : 0);
  if (dark > 0) { const pxp = cx + (P.x - G.camX) * K, pyp = cy + (P.y - G.camY) * K; const gr = ctx.createRadialGradient(pxp, pyp, 60 * K, pxp, pyp, Math.max(cx, cy) * 1.3); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(${bossOn ? '40,0,20' : '0,0,10'},${dark})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, cv.width, cv.height); }
  if (bossOn) { ctx.fillStyle = `rgba(120,0,40,${0.07 + 0.05 * Math.sin(G.time * 2)})`; ctx.fillRect(0, 0, cv.width, cv.height); }
  drawWeather(st.wx);
  drawScreenExt(cx, cy);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.flash > 0) { ctx.fillStyle = `rgba(${G.flashCol},${Math.min(0.4, G.flash)})`; ctx.fillRect(0, 0, cv.width, cv.height); }
  if (P.hp > 0 && P.hp / P.maxHp < 0.3) { const a = 0.25 + 0.15 * Math.sin(G.time * 6); const gr = ctx.createRadialGradient(cx, cy, Math.min(cx, cy) * 0.6, cx, cy, Math.max(cx, cy) * 1.2); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(255,0,0,${a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, cv.width, cv.height); }
  if (G.bossState === 1) { ctx.fillStyle = `rgba(150,0,0,${0.15 + 0.12 * Math.sin(G.time * 10)})`; ctx.fillRect(0, 0, cv.width, cv.height); }
  drawArrows();
  drawHUD();
}
// 총기 모양: 무기 계열별로 다르게
function drawGun(g, wid, atk) {
  const W0 = WMAP[wid] || WMAP.rifle, col = W0.col;
  if (W0.gun) wid = { rifle: 'rifle', minigun: 'minigun', smg: 'smg', prifle: 'prifle', tactical: 'tactical', hmg: 'hmg', twinmg: 'twinmg', blast: 'gl', mlrs: 'mlrs', cannon: 'cannon', energy: 'laser', special: 'tazer', flamer: 'flamer', freezer: 'freezer', gas: 'gas', future: 'quantum' }[W0.gun] || 'rifle';
  const c = WMAP[wid].c;
  g.lineJoin = 'round';
  if (c === 'rifle') {
    const long = wid === 'prifle' || wid === 'tactical' ? 1.3 : wid === 'smg' ? .7 : 1;
    rr(g, -4, -3, 14 * long + 4, 5, 1.5); fs(g, '#37474f', 1.2); rr(g, -6, -2, 6, 6, 1.5); fs(g, '#5d4037', 1);
    if (wid === 'minigun' || wid === 'gatling') { for (let i = -1; i <= 1; i++) { g.fillStyle = '#90a4ae'; g.fillRect(8, -1.5 + i * 2.2, 14, 1.6); } circ(g, 4, 0, 5); fs(g, '#546e7a', 1.2); }
    else if (wid === 'hmg') { rr(g, 2, -5, 6, 4, 1); fs(g, '#455a64', 1); circ(g, 3, 4, 4); fs(g, '#795548', 1); }
    else { g.fillStyle = '#263238'; g.fillRect(2, 1, 3, 5); }
    if (wid === 'twinmg') { rr(g, -14, -2, 10, 4, 1.5); fs(g, '#37474f', 1); }
  } else if (c === 'blast') {
    const big = wid === 'cannon' || wid === 'railcannon' || wid === 'gravcannon';
    rr(g, -6, -5, big ? 26 : 22, big ? 10 : 8, 3); fs(g, wid === 'railcannon' ? '#263238' : wid === 'gravcannon' ? '#311b92' : '#4e5b31', 1.3);
    g.fillStyle = col; g.fillRect(big ? 16 : 13, -4, 3, big ? 8 : 6);
    if (wid === 'railcannon') { g.strokeStyle = '#40c4ff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-2, -3); g.lineTo(18, -3); g.stroke(); }
    if (wid === 'mlrs') { g.fillStyle = '#ff7043'; for (let i = 0; i < 4; i++) { circ(g, 17, -3 + (i % 2) * 5, 1.6); g.fill(); } }
  } else if (c === 'energy') {
    rr(g, -4, -4, 18, 7, 3.5); fs(g, '#eceff1', 1.2); g.fillStyle = col; g.fillRect(0, -2, 10, 2.5);
    if (QC.glow) { g.globalAlpha = .6 + atk * .4; g.drawImage(glowSprite(col), 10, -8, 14, 14); g.globalAlpha = 1; }
    circ(g, 15, -0.5, 2.4); fs(g, col, 0);
  } else if (c === 'special') {
    if (wid === 'flamer' || wid === 'freezer' || wid === 'gas') { circ(g, -6, 4, 5); fs(g, wid === 'freezer' ? '#4fc3f7' : wid === 'gas' ? '#689f38' : '#e53935', 1.2); rr(g, -4, -3, 20, 6, 2); fs(g, '#616161', 1.2); g.fillStyle = col; g.fillRect(15, -2, 3, 4); }
    else { rr(g, -4, -4, 18, 8, 3); fs(g, '#546e7a', 1.2); g.fillStyle = col; circ(g, 12, 0, 2.5); g.fill(); }
  } else { // 미래형
    g.beginPath(); g.moveTo(-6, -4); g.lineTo(18, -2); g.lineTo(22, 0); g.lineTo(18, 2); g.lineTo(-6, 5); g.closePath(); fs(g, '#212121', 1.2);
    g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-3, 0); g.lineTo(17, 0); g.stroke();
    if (QC.glow) { g.globalAlpha = .5 + .3 * Math.sin(G.time * 8); g.drawImage(glowSprite(col), 12, -10, 20, 20); g.globalAlpha = 1; }
  }
}
function drawPlayer(g, x, y, face, wt, ghost) {
  g.save(); g.translate(x, y);
  if (!ghost && P.inv > 0 && P.dashT <= 0 && Math.floor(G.time * 20) % 2) g.globalAlpha = 0.5;
  const s = P.moving && !ghost ? Math.sin(wt * 14) : 0, bob = Math.abs(s) * 1.5;
  if (!ghost) { g.strokeStyle = 'rgba(120,220,255,.75)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 12, 14, 5, 0, 0, TAU); g.stroke(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 12, 10, 3.5, 0, 0, TAU); g.fill(); }
  if (ghost) { g.fillStyle = '#80d8ff'; circ(g, 0, -4, 11); g.fill(); g.restore(); return; }
  g.save(); g.scale(face, 1); g.lineJoin = 'round';
  // 전술 조끼 차림의 생존자
  g.beginPath(); g.moveTo(-5, -6 - bob); g.quadraticCurveTo(-13 - s * 2, 2, -10, 8); g.lineTo(2, 6); g.closePath(); fs(g, '#5d4037', 1.4);
  rr(g, -6, 3 + s * 2, 5, 8, 2); fs(g, '#37474f', 1.4); rr(g, 1, 3 - s * 2, 5, 8, 2); fs(g, '#37474f', 1.4);
  g.fillStyle = '#212121'; g.fillRect(-7, 9 + s * 2, 7, 3); g.fillRect(0, 9 - s * 2, 7, 3);
  rr(g, -7, -8 - bob, 14, 13, 4); fs(g, '#556b2f', 1.6);
  rr(g, -6, -6 - bob, 12, 8, 2); fs(g, '#3e4a26', 1); g.fillStyle = '#ffca28'; g.fillRect(-7, 1 - bob, 14, 2);
  circ(g, 0, -15 - bob, 9); fs(g, '#ffe0bd', 1.6);
  g.beginPath(); g.arc(0, -16 - bob, 9.6, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(9, -14 - bob); g.lineTo(-9, -14 - bob); g.closePath(); fs(g, '#4e5b31', 1.4);
  g.fillStyle = '#3e4a26'; g.fillRect(-9, -16 - bob, 18, 2.5);
  g.fillStyle = '#1a1a2e'; circ(g, 3, -12.5 - bob, 1.6); g.fill(); circ(g, 7, -12.5 - bob, 1.4); g.fill();
  g.restore();
  // 총 (조준 방향으로 회전)
  const a = P.aim, rec = P.recoil || 0, atk = P.atkT > 0 ? P.atkT / 0.16 : 0;
  g.save(); g.translate(0, -3 - bob); g.rotate(a); if (Math.cos(a) < 0) g.scale(1, -1); g.translate(4 - rec, 0);
  drawGun(g, P.atkW || G.weapons[0].id, atk);
  g.fillStyle = '#ffe0bd'; circ(g, 0, 2, 3); g.fill(); g.lineWidth = 1; g.strokeStyle = OL; g.stroke();
  g.restore();
  g.restore();
}
function drawDrone(d, evo) {
  ctx.save(); ctx.translate(d.x, d.y);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 26, 8, 3, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, 4); ctx.moveTo(9, -4); ctx.lineTo(-9, 4); ctx.stroke();
  ctx.fillStyle = 'rgba(200,230,255,.5)'; for (const [x, y] of [[-9, -4], [9, -4], [-9, 4], [9, 4]]) { ctx.beginPath(); ctx.ellipse(x, y, 5, 1.5 + Math.abs(Math.sin(G.time * 40 + x)) * 1.5, 0, 0, TAU); ctx.fill(); }
  circ(ctx, 0, 0, 5.5); fs(ctx, evo ? '#ffd54f' : '#b0bec5', 1.5);
  ctx.fillStyle = '#00e5ff'; circ(ctx, Math.cos(d.a) * 2, Math.sin(d.a) * 2, 2); ctx.fill();
  ctx.restore();
}
function drawTurret(t) {
  ctx.save(); ctx.translate(t.x, t.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 8, 14, 5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-10, 8); ctx.moveTo(0, -4); ctx.lineTo(10, 8); ctx.moveTo(0, -4); ctx.lineTo(0, 9); ctx.stroke();
  ctx.translate(0, -10); circ(ctx, 0, 0, 8); fs(ctx, '#78909c', 1.5);
  ctx.rotate(t.a); rr(ctx, 0, -2.5, 16, 5, 1.5); fs(ctx, '#37474f', 1.2);
  ctx.rotate(-t.a); ctx.fillStyle = t.life < 2 && Math.sin(G.time * 15) > 0 ? '#ff1744' : '#00e676'; circ(ctx, 0, 0, 2.5); ctx.fill();
  ctx.restore();
}
function drawBeam(b, s) {
  const [x1, y1, x2, y2] = b; const w = s.w * (0.85 + 0.15 * Math.sin(G.time * 40));
  ctx.lineCap = 'round';
  if (QC.glow) { ctx.globalAlpha = .35; ctx.strokeStyle = s.col; ctx.lineWidth = w * 2.2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  ctx.globalAlpha = .9; ctx.strokeStyle = s.col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = w * 0.35; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  if (QC.glow) ctx.drawImage(glowSprite(s.col), x2 - w * 2, y2 - w * 2, w * 4, w * 4);
}
function drawField(f) {
  const k = f.t / f.dur, fade = Math.min(1, (f.dur - f.t) * 3, f.t * 6);
  ctx.globalAlpha = fade;
  if (f.k === 'fire') { ctx.fillStyle = 'rgba(255,87,34,.28)'; circ(ctx, f.x, f.y, f.r); ctx.fill(); ctx.fillStyle = 'rgba(255,214,0,.25)'; circ(ctx, f.x, f.y, f.r * (.5 + .1 * Math.sin(G.time * 12))); ctx.fill(); }
  else if (f.k === 'gas') { for (let i = 0; i < 5; i++) { const a = i * 1.3 + G.time * .6; ctx.fillStyle = 'rgba(118,255,3,.16)'; circ(ctx, f.x + Math.cos(a) * f.r * .35, f.y + Math.sin(a) * f.r * .3, f.r * .65); ctx.fill(); } }
  else if (f.k === 'acid') { ctx.fillStyle = 'rgba(198,255,0,.3)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * .7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; circ(ctx, f.x - f.r * .3, f.y - f.r * .15, f.r * .15); ctx.fill(); }
  else if (f.k === 'hole' || f.k === 'grav') {
    ctx.save(); ctx.translate(f.x, f.y);
    if (QC.glow) { ctx.globalAlpha = fade * .6; ctx.drawImage(glowSprite(f.col), -f.r, -f.r, f.r * 2, f.r * 2); ctx.globalAlpha = fade; }
    for (let i = 0; i < 4; i++) { ctx.rotate(G.time * 3 + i); ctx.strokeStyle = i % 2 ? '#b388ff' : '#7c4dff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, f.r * (0.35 + i * .15) * (1 - k * .3), 0, 2.5); ctx.stroke(); }
    ctx.fillStyle = '#000'; circ(ctx, 0, 0, f.r * .22 * (f.k === 'grav' ? 1 + k : 1)); ctx.fill(); ctx.strokeStyle = '#e1bee7'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  } else if (f.k === 'ion') {
    ctx.fillStyle = 'rgba(132,255,255,.25)'; circ(ctx, f.x, f.y, f.r); ctx.fill();
    const gr = ctx.createLinearGradient(f.x, f.y - 400, f.x, f.y); gr.addColorStop(0, 'rgba(132,255,255,0)'); gr.addColorStop(1, 'rgba(224,255,255,.9)');
    ctx.fillStyle = gr; const w = f.r * (.55 + .15 * Math.sin(G.time * 30)); ctx.fillRect(f.x - w / 2, f.y - 400, w, 400);
    ctx.fillStyle = '#fff'; ctx.fillRect(f.x - w / 6, f.y - 400, w / 3, 400);
    if (Math.random() < .6) addPart(f.x + rand(-f.r, f.r), f.y + rand(-10, 10), rand(-60, 60), rand(-120, -40), '#e0f7fa', .3, 3);
  }
  ctx.globalAlpha = 1;
}
function drawPickup(p) {
  if (drawPickupExt(p)) return;
  const bob = Math.sin(G.time * 4 + p.x) * 2;
  switch (p.kind) {
    case 'gem': {
      const v = p.v, col = v >= 50 ? '#e040fb' : v >= 20 ? '#7c4dff' : v >= 5 ? '#1de9b6' : v >= 2 ? '#00e5ff' : '#40c4ff';
      const s = (v >= 50 ? 13 : v >= 20 ? 11 : v >= 5 ? 9.5 : v >= 2 ? 8.5 : 7.5) * (1 + (p.pulse > 0 ? p.pulse : 0));
      if (p.pulse > 0) p.pulse -= 0.016;
      const y = p.y - bob;
      if (QC.glow) { ctx.globalAlpha = 0.55 + 0.15 * Math.sin(G.time * 5 + p.x); ctx.drawImage(glowSprite(col), p.x - s * 1.9, y - s * 1.9, s * 3.8, s * 3.8); ctx.globalAlpha = 1; }
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(p.x, y - s); ctx.lineTo(p.x + s * .72, y); ctx.lineTo(p.x, y + s); ctx.lineTo(p.x - s * .72, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.moveTo(p.x, y - s * .75); ctx.lineTo(p.x + s * .3, y - s * .1); ctx.lineTo(p.x - s * .15, y - s * .05); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, y - s); ctx.lineTo(p.x + s * .72, y); ctx.lineTo(p.x, y + s); ctx.lineTo(p.x - s * .72, y); ctx.closePath(); ctx.stroke();
      const tw = Math.sin(G.time * 6 + p.x * 0.7); if (tw > 0.75) { ctx.fillStyle = '#fff'; const k = (tw - 0.75) * 4 * s * 0.5; ctx.fillRect(p.x + s * .4 - k, y - s * .6 - .6, k * 2, 1.2); ctx.fillRect(p.x + s * .4 - .6, y - s * .6 - k, 1.2, k * 2); }
      break; }
    case 'wdrop': { const W_ = WMAP[p.item]; const col = TIER_COL[W_.t];
      ctx.globalAlpha = .55; const gr = ctx.createLinearGradient(p.x, p.y - 120, p.x, p.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, col); ctx.fillStyle = gr; ctx.fillRect(p.x - 8, p.y - 120, 16, 120); ctx.globalAlpha = 1;
      if (QC.glow) { ctx.globalAlpha = .7; ctx.drawImage(glowSprite(col), p.x - 26, p.y - 30, 52, 52); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(p.x, p.y - 6 - bob); rr(ctx, -15, -15, 30, 30, 8); fs(ctx, 'rgba(20,12,40,.9)', 0); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke(); ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(W_.ic, 0, 7); ctx.restore(); break; }
    case 'legend': {
      const y = p.y - bob * 1.5, t = G.time;
      ctx.save(); ctx.translate(p.x, y);
      ctx.globalAlpha = .45; ctx.rotate(t * 0.6); ctx.fillStyle = '#ffd54f'; for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -70); ctx.lineTo(7, -70); ctx.closePath(); ctx.fill(); } ctx.restore();
      ctx.globalAlpha = .6; const gr = ctx.createLinearGradient(p.x, p.y - 220, p.x, p.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, '#ffd54f'); ctx.fillStyle = gr; ctx.fillRect(p.x - 14, p.y - 220, 28, 220); ctx.globalAlpha = 1;
      if (QC.glow) { ctx.globalAlpha = .8; ctx.drawImage(glowSprite('#ffd600'), p.x - 50, y - 54, 100, 100); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(p.x, y); ctx.scale(1.6, 1.6);
      rr(ctx, -13, -6, 26, 16, 2.5); fs(ctx, '#b8860b', 1.8); rr(ctx, -14, -13, 28, 9, 4); fs(ctx, '#ffca28', 1.8);
      ctx.fillStyle = '#fff59d'; ctx.fillRect(-14, -6, 28, 2.5); ctx.fillStyle = '#d50000'; circ(ctx, 0, -2, 3.5); ctx.fill(); ctx.strokeStyle = '#ffd600'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
      if (Q.level && Math.random() < .4) addPart(p.x + rand(-24, 24), p.y + rand(-20, 6), rand(-15, 15), rand(-60, -25), pick(['#fff59d', '#ffd54f', '#ffffff']), .7, 3);
      break; }
    case 'coin': ctx.fillStyle = '#ffc107'; circ(ctx, p.x, p.y - bob, 5.5); ctx.fill(); ctx.strokeStyle = '#8d6e00'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff59d'; ctx.fillRect(p.x - 1, p.y - 3 - bob, 2, 6); break;
    case 'meat': ctx.save(); ctx.translate(p.x, p.y - bob); ctx.rotate(-0.6); ctx.fillStyle = '#eee'; ctx.fillRect(4, -2, 8, 4); circ(ctx, 12, -2, 2.5); ctx.fill(); circ(ctx, 12, 2, 2.5); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, TAU); fs(ctx, '#bf5f30', 1.5); ctx.restore(); break;
    case 'magnet': ctx.save(); ctx.translate(p.x, p.y - bob); ctx.strokeStyle = '#e53935'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 7, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#ccc'; ctx.fillRect(-9.5, 0, 5, 4); ctx.fillRect(4.5, 0, 5, 4); ctx.restore(); break;
    case 'power': if (QC.glow) { ctx.globalAlpha = .6; ctx.drawImage(glowSprite('#ff1744'), p.x - 24, p.y - 28, 48, 48); ctx.globalAlpha = 1; } ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚡', p.x, p.y + 6 - bob); break;
    case 'qitem': { const it = QITEMS[p.item]; const ph = (G.time * 2 + p.x) % 1;
      ctx.globalAlpha = .5; const gr = ctx.createLinearGradient(p.x, p.y - 70, p.x, p.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, it.col); ctx.fillStyle = gr; ctx.fillRect(p.x - 5, p.y - 70, 10, 70); ctx.globalAlpha = 1;
      ctx.strokeStyle = it.col; ctx.lineWidth = 2; circ(ctx, p.x, p.y, 8 + ph * 10); ctx.globalAlpha = 1 - ph; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(it.ic, p.x, p.y + 6 - bob); break; }
    case 'chest': case 'secret': case 'crate': {
      const col = p.kind === 'secret' ? '#e040fb' : p.kind === 'crate' ? '#90caf9' : '#ffd54f';
      if (QC.glow) { ctx.globalAlpha = .5 + .2 * Math.sin(G.time * 5); ctx.drawImage(glowSprite(col), p.x - 30, p.y - 34, 60, 60); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(p.x, p.y - bob);
      if (p.kind === 'crate') { rr(ctx, -12, -12, 24, 22, 2); fs(ctx, '#6d7a3a', 1.6); line(ctx, -12, -1, 12, -1, 2, '#3e4a26'); ctx.fillStyle = '#fff'; ctx.fillRect(-3, -9, 6, 14); ctx.fillRect(-7, -5, 14, 6); ctx.fillStyle = '#e53935'; ctx.fillRect(-2, -8, 4, 12); ctx.fillRect(-6, -4, 12, 4); }
      else { rr(ctx, -11, -6, 22, 14, 2); fs(ctx, p.kind === 'secret' ? '#4a148c' : '#8d5524', 1.6); rr(ctx, -12, -12, 24, 8, 3); fs(ctx, p.kind === 'secret' ? '#7b1fa2' : '#a0632c', 1.6); ctx.fillStyle = col; ctx.fillRect(-2.5, -8, 5, 7); }
      ctx.restore(); break; }
  }
}
function drawProj(p) {
  if (p.dead) return;
  ctx.save(); ctx.translate(p.x, p.y - (p.z || 0));
  if (p.lob) {
    ctx.restore(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 5 * p.size, 2.5 * p.size, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(p.ang);
    const sz = (p.kind === 'shell' ? 7 : p.kind === 'gravball' ? 9 : p.kind === 'fireshell' ? 7 : 5) * p.size;
    if (p.kind === 'gravball') { if (QC.glow) ctx.drawImage(glowSprite(p.col), -sz * 2.5, -sz * 2.5, sz * 5, sz * 5); circ(ctx, 0, 0, sz); fs(ctx, '#000', 0); ctx.strokeStyle = '#b388ff'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (p.kind === 'fireshell') { if (QC.glow) ctx.drawImage(glowSprite('#ff3d00'), -sz * 2.5, -sz * 2.5, sz * 5, sz * 5); circ(ctx, 0, 0, sz); fs(ctx, '#ff6d00', 1.2); }
    else if (p.kind === 'canister') { rr(ctx, -sz, -sz * .6, sz * 2, sz * 1.2, 2); fs(ctx, '#558b2f', 1.2); ctx.fillStyle = '#ffeb3b'; ctx.fillRect(-1, -sz * .6, 2, sz * 1.2); }
    else { circ(ctx, 0, 0, sz); fs(ctx, p.kind === 'shell' ? '#5d4037' : '#556b2f', 1.2); ctx.fillStyle = p.col; ctx.fillRect(-sz * .3, -sz, sz * .6, sz * .5); }
    ctx.restore(); return;
  }
  ctx.rotate(p.ang); const sz = p.size || 1;
  switch (p.kind) {
    case 'bullet': ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 4 * sz, 1.8 * sz, 0, 0, TAU); ctx.fill(); break;
    case 'tracer': ctx.strokeStyle = p.col; ctx.globalAlpha = .45; ctx.lineWidth = 2.5 * sz; ctx.beginPath(); ctx.moveTo(-16 * sz, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 4 * sz, 1.6 * sz, 0, 0, TAU); ctx.fill(); break;
    case 'slug': ctx.fillStyle = p.col; rr(ctx, -5 * sz, -2.2 * sz, 9 * sz, 4.4 * sz, 2 * sz); ctx.fill(); ctx.fillStyle = '#fff8e1'; ctx.fillRect(1 * sz, -1 * sz, 3 * sz, 2 * sz); break;
    case 'acid': if (QC.glow) ctx.drawImage(glowSprite(p.col), -10, -10, 20, 20); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#33691e'; circ(ctx, 1, -1, 1.5); ctx.fill(); break;
    case 'shard': ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-3, -2.5); ctx.lineTo(-3, 2.5); ctx.closePath(); ctx.fill(); break;
    case 'lbolt': { const L = p.len || 20; if (QC.glow) { ctx.strokeStyle = p.col; ctx.globalAlpha = .4; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.globalAlpha = 1; } ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.strokeStyle = p.col; ctx.lineWidth = 3.5; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.globalAlpha = 1; break; }
    case 'rocket': case 'missile': { const s2 = p.kind === 'rocket' ? 1 : .7;
      ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.moveTo(-9 * s2, 0); ctx.lineTo(-16 * s2 - Math.random() * 6, -3 * s2); ctx.lineTo(-16 * s2 - Math.random() * 6, 3 * s2); ctx.fill();
      rr(ctx, -9 * s2, -3 * s2, 16 * s2, 6 * s2, 2.5 * s2); fs(ctx, p.kind === 'rocket' ? '#eceff1' : '#cfd8dc', 1); ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(7 * s2, -3 * s2); ctx.lineTo(11 * s2, 0); ctx.lineTo(7 * s2, 3 * s2); ctx.fill();
      ctx.fillStyle = '#546e7a'; ctx.fillRect(-9 * s2, -5 * s2, 4 * s2, 10 * s2); break; }
    case 'cball': if (QC.glow && p.size > 15) ctx.drawImage(glowSprite(p.col), -p.r * 2.5, -p.r * 2.5, p.r * 5, p.r * 5); circ(ctx, 0, 0, p.r); fs(ctx, p.size > 15 ? '#212121' : '#37474f', 2); ctx.fillStyle = 'rgba(255,255,255,.35)'; circ(ctx, -p.r * .3, -p.r * .3, p.r * .3); ctx.fill(); if (p.size > 15) { ctx.strokeStyle = p.col; ctx.lineWidth = 3; circ(ctx, 0, 0, p.r * .7); ctx.stroke(); } break;
    case 'plasma': if (QC.glow) ctx.drawImage(glowSprite(p.col), -p.r * 2.6, -p.r * 2.6, p.r * 5.2, p.r * 5.2); ctx.fillStyle = p.col; circ(ctx, 0, 0, p.r * (0.9 + 0.1 * Math.sin(G.time * 30))); ctx.fill(); ctx.fillStyle = '#fff'; circ(ctx, 0, 0, p.r * .45); ctx.fill(); break;
    case 'needle': ctx.strokeStyle = p.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(4, -1.5); ctx.lineTo(4, 1.5); ctx.fill(); break;
    case 'disc': { const r = 9 * (p.size || 1); if (QC.glow) ctx.drawImage(glowSprite(p.col), -r * 2.2, -r * 2.2, r * 4.4, r * 4.4); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .55, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; circ(ctx, 0, 0, r * .25); ctx.fill(); break; }
    case 'wavebolt': if (QC.glow) ctx.drawImage(glowSprite(p.col), -14, -14, 28, 28); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(1, 0, 4, 2, 0, 0, TAU); ctx.fill(); break;
    case 'harpoon': ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, -6); ctx.lineTo(7, 0); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.stroke(); break;
    case 'quantum': ctx.rotate(G.time * 10); ctx.strokeStyle = p.col; ctx.lineWidth = 2; ctx.strokeRect(-6, -6, 12, 12); ctx.rotate(.78); ctx.strokeRect(-5, -5, 10, 10); ctx.fillStyle = '#fff'; circ(ctx, 0, 0, 3); ctx.fill(); break;
  }
  ctx.restore();
}
function drawEProj(b) {
  if (b.kind === 'arrow') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang); ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(3, -4); ctx.lineTo(3, 4); ctx.fill(); ctx.restore(); return; }
  if (b.kind === 'laser') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang); ctx.strokeStyle = b.col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(4, 0); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); return; }
  if (QC.glow) ctx.drawImage(glowSprite(b.col), b.x - b.r * 2.3, b.y - b.r * 2.3, b.r * 4.6, b.r * 4.6);
  ctx.fillStyle = '#fff'; circ(ctx, b.x, b.y, b.r * 0.55); ctx.fill(); ctx.strokeStyle = b.col; ctx.lineWidth = 2.5; circ(ctx, b.x, b.y, b.r); ctx.stroke();
}
function drawEffect(f) {
  const k = f.t / f.dur;
  switch (f.type) {
    case 'flash': { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang); ctx.globalAlpha = 1 - k; const s = 6 * f.size; ctx.fillStyle = '#fff8e1'; ctx.beginPath(); ctx.moveTo(0, -s * .6); ctx.lineTo(s * 2.2, 0); ctx.lineTo(0, s * .6); ctx.closePath(); ctx.fill(); ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 1.5, -s * .3); ctx.lineTo(s * 1.2, 0); ctx.lineTo(s * 1.5, s * .3); ctx.lineTo(0, s); ctx.closePath(); ctx.globalAlpha = (1 - k) * .7; ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; break; }
    case 'boom': { ctx.globalAlpha = 1 - k;
      if (QC.glow) ctx.drawImage(glowSprite(f.col), f.x - f.r * 1.4, f.y - f.r * 1.4, f.r * 2.8, f.r * 2.8);
      ctx.fillStyle = k < .3 ? '#fff8e1' : '#ffab40'; circ(ctx, f.x, f.y, f.r * (0.4 + k * 0.7)); ctx.fill();
      ctx.strokeStyle = '#ff6d00'; ctx.lineWidth = 3; circ(ctx, f.x, f.y, f.r * (0.6 + k * 0.5)); ctx.stroke(); ctx.globalAlpha = 1; break; }
    case 'bolt': { const rnd = mulberry(Math.floor(f.seed + f.t * 30)); ctx.globalAlpha = 1 - k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, c] of [[7, f.col ? f.col + '88' : 'rgba(100,180,255,.5)'], [2.5, '#ffffff']]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(f.pts[0][0], f.pts[0][1]);
        for (let i = 1; i < f.pts.length; i++) { const [ax, ay] = f.pts[i - 1], [bx, by] = f.pts[i]; for (let s = 1; s <= 4; s++) { const t = s / 4; ctx.lineTo(lerp(ax, bx, t) + (s < 4 ? (rnd() - .5) * 16 : 0), lerp(ay, by, t) + (s < 4 ? (rnd() - .5) * 16 : 0)); } }
        ctx.stroke();
      } ctx.globalAlpha = 1; break; }
    case 'rail': { ctx.globalAlpha = 1 - k; ctx.lineCap = 'round';
      if (QC.glow) { ctx.strokeStyle = f.col; ctx.globalAlpha = (1 - k) * .4; ctx.lineWidth = f.w * 2.4; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.globalAlpha = 1 - k; }
      ctx.strokeStyle = f.col; ctx.lineWidth = f.w * (1 - k * .6); ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = f.w * .3 * (1 - k); ctx.stroke(); ctx.globalAlpha = 1; break; }
    case 'charge': { const [mx, my] = muzzle(P.aim); ctx.globalAlpha = .4 + k * .6; if (QC.glow) ctx.drawImage(glowSprite(f.col), mx - 6 - k * 14, my - 6 - k * 14, 12 + k * 28, 12 + k * 28); ctx.strokeStyle = f.col; ctx.lineWidth = 2; circ(ctx, mx, my, 18 * (1 - k) + 3); ctx.stroke(); ctx.globalAlpha = 1; break; }
    case 'target': { ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.globalAlpha = .9; circ(ctx, f.x, f.y, f.r * (1.3 - k * .3)); ctx.stroke(); ctx.fillStyle = f.col + '33'; circ(ctx, f.x, f.y, f.r * k); ctx.fill(); ctx.beginPath(); ctx.moveTo(f.x - f.r, f.y); ctx.lineTo(f.x + f.r, f.y); ctx.moveTo(f.x, f.y - f.r); ctx.lineTo(f.x, f.y + f.r); ctx.stroke(); ctx.globalAlpha = 1; break; }
    case 'skybeam': { ctx.globalAlpha = 1 - k; const gr = ctx.createLinearGradient(f.x, f.y - 500, f.x, f.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, f.col); ctx.fillStyle = gr; ctx.fillRect(f.x - f.r * (1 - k * .5), f.y - 500, f.r * 2 * (1 - k * .5), 500); ctx.fillStyle = '#fff'; ctx.fillRect(f.x - f.r * .25, f.y - 500, f.r * .5, 500); ctx.globalAlpha = 1; break; }
    case 'spin': { ctx.save(); ctx.translate(P.x, P.y); ctx.globalAlpha = 1 - k; ctx.strokeStyle = 'rgba(180,230,255,.8)'; ctx.lineWidth = 10 * (1 - k); circ(ctx, 0, 0, f.r * (0.5 + k * 0.5)); ctx.stroke(); ctx.rotate(k * 12);
      for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, f.r * (0.4 + k * 0.55), 0, 1.0); ctx.stroke(); } ctx.restore(); ctx.globalAlpha = 1; break; }
    case 'nova': { ctx.globalAlpha = (1 - k) * .9; ctx.strokeStyle = f.col; ctx.lineWidth = 10 * (1 - k) + 2; circ(ctx, f.x, f.y, f.r * (0.15 + k * 0.85)); ctx.stroke(); ctx.globalAlpha = (1 - k) * .2; ctx.fillStyle = f.col; circ(ctx, f.x, f.y, f.r * (0.15 + k * 0.85)); ctx.fill(); ctx.globalAlpha = 1; break; }
    case 'crit': { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.t * 6); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff59d'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? f.r * .35 : f.r * (1.1 + k * .6); ctx.lineTo(Math.cos(i / 8 * TAU) * r, Math.sin(i / 8 * TAU) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; break; }
    case 'shock': ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col || '#ffccbc'; ctx.lineWidth = 6 * (1 - k) + 1; circ(ctx, f.x, f.y, f.r * (0.4 + k * 0.8)); ctx.stroke(); ctx.fillStyle = 'rgba(121,85,72,.4)'; circ(ctx, f.x, f.y, f.r * 0.8); ctx.fill(); ctx.globalAlpha = 1; break;
    case 'poof': ctx.globalAlpha = (1 - k) * .7; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; circ(ctx, f.x, f.y, f.r * (0.6 + k)); ctx.stroke(); ctx.globalAlpha = 1; break;
    case 'healfx': ctx.globalAlpha = (1 - k) * .6; ctx.strokeStyle = '#00e676'; ctx.lineWidth = 3; circ(ctx, f.x, f.y, f.r * k); ctx.stroke(); ctx.globalAlpha = 1; break;
    case 'portal': { ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, 0.5); ctx.rotate(G.time * 5); ctx.globalAlpha = k < .8 ? 1 : (1 - k) * 5;
      ctx.strokeStyle = '#b388ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 18 * Math.min(1, k * 3), 0, 4.5); ctx.stroke();
      ctx.fillStyle = 'rgba(80,0,140,.6)'; circ(ctx, 0, 0, 14 * Math.min(1, k * 3)); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; break; }
    case 'pillar': { const a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8; const gr = ctx.createLinearGradient(f.x, f.y - 160, f.x, f.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, f.col);
      ctx.globalAlpha = a * 0.7; ctx.fillStyle = gr; ctx.fillRect(f.x - 9, f.y - 160, 18, 160); ctx.globalAlpha = 1; break; }
    case 'drop': { const z = (1 - k) * 260; ctx.fillStyle = `rgba(0,0,0,${0.15 + k * .25})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, 10 + k * 8, 4 + k * 3, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(f.x, f.y - z); ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(0, -26); ctx.lineTo(10, -2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -26, 16, Math.PI, 0); fs(ctx, '#eceff1', 1.2); rr(ctx, -10, -4, 20, 16, 2); fs(ctx, '#6d7a3a', 1.2); ctx.restore(); break; }
  }
}
// 화면 밖 목표물 방향 표시
function drawArrows() {
  const list = [];
  for (const e of enemies) if (!e.dead && (e.static || e.boss || e.type === 'golden')) list.push([e.x, e.y, e.boss ? '#ff1744' : e.type === 'golden' ? '#ffd54f' : '#e040fb']);
  for (const p of pickups) if (!p.dead && (p.kind === 'qitem' || p.kind === 'secret' || p.kind === 'crate' || p.kind === 'legend' || p.kind === 'wdrop')) list.unshift([p.x, p.y, p.kind === 'qitem' ? QITEMS[p.item].col : p.kind === 'secret' ? '#e040fb' : p.kind === 'legend' ? '#ffd600' : p.kind === 'wdrop' ? '#64b5f6' : '#90caf9', p.kind === 'legend']);
  for (const e of enemies) if (!e.dead && e.elite) list.push([e.x, e.y, '#ff9800']);
  for (const g of gens) if (!g.dead) list.push([g.x, g.y, '#00e676']);
  extArrows(list);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cx = W / 2, cy = H / 2, mL = 18 + SAFE.l, mR = 18 + SAFE.r, mT = 130 + SAFE.t, mB = 150 + SAFE.b;
  let n = 0;
  for (const [x, y, col, big] of list) {
    const sx = cx + (x - G.camX) * S, sy = cy + (y - G.camY) * S;
    if (sx > 0 && sx < W && sy > 0 && sy < H) continue;
    if (++n > 8) break;
    const a = Math.atan2(sy - cy, sx - cx);
    const ex = clamp(cx + Math.cos(a) * 1000, mL, W - mR), ey = clamp(cy + Math.sin(a) * 1000, mT, H - mB);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.globalAlpha = .85 + .15 * Math.sin(G.time * 6);
    if (big) ctx.scale(1.6, 1.6);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function drawHUD() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const L = 10 + SAFE.l, T = 8 + SAFE.t, Wd = W - L - 10 - SAFE.r;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, L, T, Wd, 12, 6); ctx.fill();
  const xpw = Wd * clamp(G.xp / G.need, 0, 1);
  if (xpw > 3) { ctx.fillStyle = '#29b6f6'; rr(ctx, L, T, Math.max(12, xpw), 12, 6); ctx.fill(); }
  ctx.font = '900 10px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('Lv ' + G.lv, L + Wd / 2, T + 10);
  const hy = T + 18, hw = Math.min(170, Wd * 0.45);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, L, hy, hw, 16, 8); ctx.fill();
  const hpw = hw * clamp(P.hp / P.maxHp, 0, 1);
  if (hpw > 2) { ctx.fillStyle = P.hp / P.maxHp < 0.3 ? '#ff1744' : '#e53935'; rr(ctx, L, hy, Math.max(16, hpw), 16, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(L + 6, hy + 2, Math.max(0, hpw - 12), 4); }
  ctx.fillStyle = '#fff'; ctx.font = '900 11px "Noto Sans KR",sans-serif'; ctx.fillText(`❤ ${Math.ceil(P.hp)} / ${P.maxHp}`, L + hw / 2, hy + 12);
  // 경과 시간
  const mm = Math.floor(G.t / 60), ss = Math.floor(G.t % 60);
  ctx.font = '900 18px "Noto Sans KR",sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
  const tx = Math.min(L + Wd / 2 + 30, W - SAFE.r - 110), txt = G.bossState >= 1 && G.bossState < 3 ? 'BOSS' : `${mm}:${String(ss).padStart(2, '0')}`;
  ctx.strokeText(txt, tx, hy + 15); ctx.fillStyle = G.bossState >= 1 && G.bossState < 3 ? '#ff5252' : '#fff'; ctx.fillText(txt, tx, hy + 15);
  if (G.powerT > 0) { ctx.font = '900 11px sans-serif'; ctx.fillStyle = '#ff8a80'; ctx.fillText(`⚡x1.5 ${Math.ceil(G.powerT)}s`, tx, hy + 30); }
  ctx.textAlign = 'right'; ctx.font = '900 12px "Noto Sans KR",sans-serif';
  ctx.strokeText(`💀 ${G.kills}`, W - SAFE.r - 12, hy + 10); ctx.fillStyle = '#fff'; ctx.fillText(`💀 ${G.kills}`, W - SAFE.r - 12, hy + 10);
  ctx.strokeText(`💰 ${G.gold}`, W - SAFE.r - 12, hy + 26); ctx.fillStyle = '#ffd54f'; ctx.fillText(`💰 ${G.gold}`, W - SAFE.r - 12, hy + 26);
  // 무기 슬롯
  ctx.textAlign = 'center'; let sx = L;
  drawHudExt(L, hy, W); ctx.textAlign = 'center';
  if (!G.veh) for (const w of G.weapons) {
    const t = WMAP[w.id].t;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, sx, hy + 22, 30, 30, 7); ctx.fill(); ctx.strokeStyle = w.evo ? '#ff1744' : w.lv >= WMAX ? '#ffd54f' : TIER_COL[t]; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(w.evo ? EVOS[w.id].ic : WMAP[w.id].ic, sx + 15, hy + 43);
    ctx.font = '900 9px sans-serif'; ctx.fillStyle = w.evo ? '#ff8a80' : '#ffd54f'; ctx.fillText(w.evo ? 'EVO' : w.lv >= WMAX ? 'MAX' : 'Lv' + w.lv, sx + 15, hy + 61);
    sx += 33;
  }
  // 보스 체력바
  let qy = hy + 68;
  const boss = (G.boss && !G.boss.dead && G.bossState === 2) ? G.boss : (G.mini && !G.mini.dead ? G.mini : null);
  if (boss) {
    const bw = Math.min(W - 40 - SAFE.l - SAFE.r, 360), bx = (W - bw) / 2, by = qy;
    ctx.fillStyle = 'rgba(0,0,0,.7)'; rr(ctx, bx - 3, by - 3, bw + 6, 20, 6); ctx.fill();
    const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, boss.p2 ? '#ff1744' : '#7b1fa2'); gr.addColorStop(1, boss.p2 ? '#ff8a80' : '#e040fb');
    ctx.fillStyle = gr; rr(ctx, bx, by, Math.max(4, bw * boss.hp / boss.maxHp), 14, 5); ctx.fill();
    ctx.font = '900 11px "Noto Sans KR",sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    const label = `👑 ${boss.bdef.name}${boss.p2 ? ' (분노)' : ''}`; ctx.strokeText(label, W / 2, by + 11); ctx.fillText(label, W / 2, by + 11);
    qy += 24;
  }
  // 퀘스트 목표
  const qs = G.quests; const lineH = 16, qw = Math.min(230, Wd * 0.62);
  const shown = qs.filter(q => q.k !== 'boss' || G.st.boss);
  const qh = 20 + shown.length * lineH;
  ctx.fillStyle = 'rgba(10,6,24,.6)'; rr(ctx, L, qy, qw, qh, 8); ctx.fill();
  ctx.textAlign = 'left'; ctx.font = '900 11px "Noto Sans KR",sans-serif'; ctx.fillStyle = '#ffd54f';
  ctx.fillText(`STAGE ${G.stage} — ${G.st.name}`, L + 8, qy + 14);
  let y = qy + 14 + lineH;
  for (const q of shown) {
    const fresh = q.done && G.time - q.doneT < 1.2;
    ctx.font = (fresh ? '900 ' : '700 ') + '11px "Noto Sans KR",sans-serif';
    ctx.fillStyle = q.done ? '#69f0ae' : q.main ? '#fff' : '#b0bec5';
    const mark = q.done ? '✔' : q.main ? '▶' : q.sp ? '🏅' : '☆';
    ctx.fillText(`${mark} ${q.main ? '' : q.sp ? '[특별] ' : '[보조] '}${qLabel(q)}`, L + 8, y);
    ctx.textAlign = 'right'; ctx.fillText(qProgress(q), L + qw - 8, y); ctx.textAlign = 'left';
    y += lineH;
  }
  // 조이스틱
  const jr = 50; let jx, jy, kx, ky; const act = joy.id !== null;
  if (act) { jx = joy.ox; jy = joy.oy; kx = joy.ox + joy.dx * Math.min(1, joy.mag) * jr; ky = joy.oy + joy.dy * Math.min(1, joy.mag) * jr; }
  else { jx = 85 + SAFE.l; jy = H - 100 - SAFE.b; kx = jx; ky = jy; }
  ctx.globalAlpha = act ? 0.9 : 0.4;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; circ(ctx, jx, jy, jr); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; circ(ctx, kx, ky, 22); ctx.fill(); ctx.strokeStyle = '#7e57c2'; ctx.lineWidth = 3; ctx.stroke();
  ctx.globalAlpha = 1;
}
