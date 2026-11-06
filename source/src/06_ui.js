/* =====================================================================
   UI / 메뉴 / 입력 / 메인 루프
   ===================================================================== */
const cdEls = { sk1: $('bSk1').querySelector('.cdv'), sk2: $('bSk2').querySelector('.cdv'), pot: $('bPot').querySelector('.cdv') };
const cdLast = {};
function setCd(k, frac) { const v = Math.round(frac * 40); if (cdLast[k] === v) return; cdLast[k] = v; cdEls[k].style.background = v > 0 ? `conic-gradient(rgba(0,0,0,.65) ${v * 9}deg, transparent 0)` : 'none'; }
function updateButtons() { if (!G.veh) setCd('sk1', Math.max(0, G.sk1) / SK1_CD); setCd('sk2', Math.max(0, G.sk2) / SK2_CD); setCd('pot', Math.max(0, G.potCd)); }

/* ------------------------- 레벨업 카드 ------------------------- */
function evoReady(w) {
  const ev = EVOS[w.id]; if (!ev || w.evo || w.lv < WMAX) return false;
  if (ev.need.w) return G.weapons.some(o => o.id === ev.need.w);
  if (ev.need.p) return (G.pass[ev.need.p] || 0) > 0;
  return false;
}
function buildOptions() {
  const pool = [], out = [];
  for (const w of G.weapons) if (evoReady(w)) out.push({ kind: 'evo', id: w.id });
  for (const w of G.weapons) if (w.lv < WMAX) pool.push({ kind: 'wup', id: w.id, wt: 1.4 });
  if (G.weapons.length < WSLOTS) {
    // 이번 스테이지 무기: 일반·고급만 레벨업 카드로 등장 (전설·신화는 보스·전설 상자 전용)
    for (const id of G.st.wp) { const W_ = WMAP[id]; if (W_.t <= 2 && !G.weapons.find(w => w.id === id)) pool.push({ kind: 'wnew', id, wt: W_.t === 1 ? 1.6 : 0.8 }); }
    // 이전 스테이지 무기: 이미 발견한 무기 위주로 낮은 확률
    for (let k = 1; k < G.stage; k++) for (const id of STAGES[k - 1].wp) { const W_ = WMAP[id]; if (W_.t <= 2 && !G.weapons.find(w => w.id === id)) pool.push({ kind: 'wnew', id, wt: save.codex[id] ? 0.6 / Math.max(1, G.stage - 1) * 3 : 0.04 }); }
  }
  const owned = Object.keys(G.pass).length;
  for (const id in PASSIVES) { const lv = G.pass[id] || 0; if (lv < PASSIVES[id].max && (lv > 0 || owned < PSLOTS)) pool.push({ kind: 'pas', id, wt: 1 }); }
  while (out.length < 3 && pool.length) {
    let s = 0; for (const o of pool) s += o.wt; let r = Math.random() * s; let i = 0;
    for (; i < pool.length; i++) { r -= pool[i].wt; if (r <= 0) break; }
    out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
  }
  if (!out.length) out.push({ kind: 'heal' }, { kind: 'gold' });
  return out.slice(0, 3);
}
function weaponCardInfo(id, lv) {
  const W_ = WMAP[id];
  if (lv === 0) return `<b style="color:${TIER_COL[W_.t]}">[${TIER_NAME[W_.t]} · ${ROLE_NAME[W_.m]}]</b> ${W_.d}`;
  if (lv === 1 || lv === 3) return '피해 +22%, 연사 +5%' + (lv === 3 ? ' · ' + LV3[W_.m] : '');
  if (lv === 2) return LV3[W_.m] + ' · 피해 +22%';
  return '최종 강화: ' + LV5[W_.m] + ' · 피해 +22%';
}
function openLevelUp() {
  G.pendingLv--; G.state = 'levelup'; joy.id = null; joy.mag = 0;
  AU.sfx('levelup');
  $('lvTitle').textContent = 'LEVEL UP!';
  const opts = buildOptions(); const box = $('cards'); box.innerHTML = '';
  if (window.__botPick) { chooseOption(opts[window.__botPick(opts)] || opts[0]); return; }
  for (const o of opts) {
    const b = document.createElement('button'); b.className = 'card';
    let icon, name, desc, pips = '', tag = '';
    if (o.kind === 'wnew' || o.kind === 'wup') {
      const W_ = WMAP[o.id]; const cur = o.kind === 'wnew' ? 0 : G.weapons.find(w => w.id === o.id).lv;
      icon = W_.ic; name = W_.nm; desc = weaponCardInfo(o.id, cur); tag = o.kind === 'wnew' ? (G.knownBefore[o.id] ? 'NEW 무기' : '✨ 첫 발견!') : `Lv ${cur} → ${cur + 1}`;
      pips = '★'.repeat(cur + 1) + '☆'.repeat(WMAX - cur - 1); if (o.kind === 'wnew') b.classList.add('new'); b.style.borderColor = TIER_COL[W_.t];
      if (o.kind === 'wnew' && G.st.wp.includes(o.id)) tag += ' · 이번 스테이지 주력';
    } else if (o.kind === 'evo') {
      const ev = EVOS[o.id]; icon = ev.ic; name = '진화! ' + ev.n; desc = ev.d; tag = WMAP[o.id].nm + ' 진화'; b.classList.add('evo');
    } else if (o.kind === 'pas') {
      const p = PASSIVES[o.id], cur = G.pass[o.id] || 0; icon = p.icon; name = p.name; desc = p.d; tag = cur ? `Lv ${cur} → ${cur + 1}` : 'NEW';
      pips = '★'.repeat(cur + 1) + '☆'.repeat(p.max - cur - 1);
      const evoHint = Object.keys(EVOS).find(id => EVOS[id].need.p === o.id && G.weapons.some(w => w.id === id && !w.evo));
      if (evoHint) desc += ` <span style="color:#ff8a80">(${WMAP[evoHint].nm} 진화 조건)</span>`;
    } else if (o.kind === 'heal') { icon = '🍗'; name = '체력 회복'; desc = '체력을 50 회복합니다.'; }
    else { icon = '💰'; name = '골드 주머니'; desc = '골드 +' + 20 * G.stage; }
    b.innerHTML = `<div class="ci">${icon}</div><div><div class="cn">${name}<em>${tag}</em></div><div class="cd">${desc}</div>${pips ? `<div class="pips">${pips}</div>` : ''}</div>`;
    b.addEventListener('click', () => chooseOption(o), { once: true });
    box.appendChild(b);
  }
  showScreen('scrLevel');
}
function chooseOption(o) {
  if (G.state !== 'levelup') return;
  AU.sfx('button');
  if (o.kind === 'wnew') addWeapon(o.id);
  else if (o.kind === 'wup') { const w = G.weapons.find(w => w.id === o.id); w.lv++; const c = codexOf(w.id); c.maxLv = Math.max(c.maxLv || 1, w.lv); }
  else if (o.kind === 'evo') { const w = G.weapons.find(w => w.id === o.id); w.evo = true; codexOf(w.id).evo = 1; AU.sfx('evolve'); toast(`🔥 ${EVOS[o.id].n} 진화!`, 1.6, '#ff8a80'); G.flash = 0.4; G.flashCol = '255,200,0'; }
  else if (o.kind === 'pas') { G.pass[o.id] = (G.pass[o.id] || 0) + 1; recalc(); }
  else if (o.kind === 'heal') heal(50);
  else G.gold += 20 * G.stage;
  showScreen(null); G.state = 'play'; G.lastFrame = performance.now();
}

/* ------------------------- 승리 / 패배 ------------------------- */
function playerDie() {
  if (G.state !== 'play') return;
  G.state = 'dying'; G.deadT = 1.2; AU.sfx('bossdie'); G.shake = 10;
  for (let i = 0; i < 30; i++) addPart(P.x, P.y, rand(-150, 150), rand(-150, 150), '#e53935', 0.8, 4);
}
function finishRun(win) {
  save.gold += G.gold; save.stats.kills += G.kills; save.stats.runs++; save.stats.bestLv = Math.max(save.stats.bestLv, G.lv);
  for (const id in G.wkills) { if (WMAP[id]) codexOf(id).kills = (codexOf(id).kills || 0) + G.wkills[id]; }
  for (const w of G.weapons) { const c = codexOf(w.id); c.maxLv = Math.max(c.maxLv || 1, w.lv); }
  if (win) { save.cleared = Math.max(save.cleared, G.stage); const b = save.best[G.stage] || {}; save.best[G.stage] = { time: b.time ? Math.min(b.time, Math.round(G.t)) : Math.round(G.t), side: Math.max(b.side || 0, G.quests.filter(q => !q.main && q.done).length) }; }
  writeSave();
}
function stageWin() {
  const first = save.cleared < G.stage;
  const n = G.stage, dmul = diffRewardMul(), clearG = Math.round((60 + 30 * n) * dmul);
  const sides = G.quests.filter(q => !q.main && !q.sp), sideDone = sides.filter(q => q.done);
  const sideG = Math.round(sideDone.length * (40 + 20 * n) * dmul);
  const special = first && n % 5 === 0 ? (n % 10 === 0 ? 300 * n / 5 : 150 * n / 5) : 0;
  G.gold += clearG + sideG + special;
  G.state = 'result'; $('gameUI').classList.remove('on');
  const newUnlocks = n < 40 && first ? STAGES[n].wp.filter(id => firstStageOf(id) === n + 1) : [];
  finishRun(true); AU.bgm('win');
  $('rTitle').textContent = n === 40 ? '최종 승리!' : 'STAGE CLEAR!'; $('rTitle').className = 'res-t win';
  const qrows = G.quests.map(q => `<div class="stat"><span>${q.done ? '✔' : '✖'} ${q.main ? '' : q.sp ? '[특별] ' : '[보조] '}${qLabel(q)}</span><span style="color:${q.done ? '#69f0ae' : '#ef9a9a'}">${q.done ? '완료' : '미완료'}</span></div>`).join('');
  $('rStats').innerHTML = statRows([['스테이지', `${n}. ${G.st.name}`], ['난이도', `${DF().ic} ${DF().n} (보상 x${dmul.toFixed(2)})`], ['클리어 시간', fmtTime(G.t)], ['도달 레벨', 'Lv ' + G.lv], ['처치 수', G.kills], ['구출한 동료', G.rescued + '명'], ['탑승한 장비', G.vehUsed + '회']]) + qrows +
    statRows([['클리어 보상', '+' + clearG + 'G'], ...(sideG ? [['보조 목표 보상', '+' + sideG + 'G']] : []), ...(special ? [[n % 10 === 0 ? '🏆 10스테이지 전설 보급' : '🎖️ 5스테이지 특별 보상', '+' + special + 'G']] : []), ['획득 골드 합계', '💰 ' + G.gold], ['보유 골드', '💰 ' + save.gold]]) +
    (G.newFound.length ? `<p class="unl">✨ 새로 발견한 무기: ${G.newFound.map(id => WMAP[id].ic + ' ' + WMAP[id].nm).join(', ')}</p>` : '') +
    (newUnlocks.length ? `<p class="unl">🔓 다음 스테이지 신규 무기: ${newUnlocks.map(id => WMAP[id].ic + ' ' + WMAP[id].nm).join(', ')}</p>` : '') +
    (G.newVeh ? `<p class="unl">🚘 새로 탑승한 장비 ${G.newVeh}종 · 장비 도감 ${Object.keys(save.vfound).length} / ${VEH.length}</p>` : '') +
    (n === 40 ? '<p class="unl">🎉 40개 스테이지를 모두 정복했습니다!</p>' : '');
  const btns = $('rBtns'); btns.innerHTML = '';
  if (n < 40) addBtn(btns, '다음 스테이지 ▶', '', () => startStage(n + 1));
  addBtn(btns, '🔧 강화소', 'blue', () => openShop('result'));
  addBtn(btns, '스테이지 선택', 'gray', openStageSelect);
  showScreen('scrResult');
}
function stageLose() {
  G.state = 'result'; $('gameUI').classList.remove('on'); finishRun(false); AU.bgm('lose');
  $('rTitle').textContent = 'GAME OVER'; $('rTitle').className = 'res-t lose';
  const qrows = G.quests.map(q => `<div class="stat"><span>${q.done ? '✔' : '✖'} ${q.main ? '' : '[보조] '}${qLabel(q)}</span><span>${q.k === 'boss' ? (q.done ? '완료' : '미완료') : qProgress(q)}</span></div>`).join('');
  $('rStats').innerHTML = (G.failReason ? `<p class="unl" style="color:#ef9a9a">${G.failReason}</p>` : '') + statRows([['스테이지', `${G.stage}. ${G.st.name}`], ['버틴 시간', fmtTime(G.t)], ['도달 레벨', 'Lv ' + G.lv], ['처치 수', G.kills]]) + qrows +
    statRows([['획득 골드 (보관됨)', '💰 ' + G.gold], ['보유 골드', '💰 ' + save.gold]]) +
    `<p style="font-size:13px;opacity:.85;margin-top:8px;line-height:1.5">💡 골드로 <b>강화소</b>에서 화력·체력을 올리면 더 쉬워집니다. 빨간 경고 구역은 💨질주로 피하세요.</p>`;
  const btns = $('rBtns'); btns.innerHTML = '';
  addBtn(btns, '다시 도전', '', () => startStage(G.stage));
  addBtn(btns, '🔧 강화소', 'blue', () => openShop('result'));
  addBtn(btns, '스테이지 선택', 'gray', openStageSelect);
  showScreen('scrResult');
}
function fmtTime(t) { return `${Math.floor(t / 60)}분 ${Math.floor(t % 60)}초`; }
function statRows(rows) { return rows.map(([a, b]) => `<div class="stat"><span>${a}</span><span>${b}</span></div>`).join(''); }
function addBtn(parent, label, cls, fn) { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; b.addEventListener('click', () => { AU.sfx('button'); fn(); }); parent.appendChild(b); }

/* ------------------------- 화면 전환 ------------------------- */
const SCREENS = ['scrTitle', 'scrStage', 'scrLevel', 'scrPause', 'scrResult', 'scrSet', 'scrHelp', 'scrShop', 'scrCodex', 'scrChest', 'scrShare', 'modal'];
function showScreen(id) { for (const s of SCREENS) $(s).classList.toggle('on', s === id); }
let toastTimer = null;
function toast(html, dur = 1.5, col = '#fff') { const t = $('toast'); t.innerHTML = html; t.style.color = col; t.style.opacity = 1; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.opacity = 0, dur * 1000); }

/* ------------------------- 스테이지 선택 ------------------------- */
let selStage = 1;
function openStageSelect() {
  G.state = 'menu'; $('gameUI').classList.remove('on'); AU.bgm('menu');
  $('sGold').textContent = '💰 ' + save.gold;
  const grid = $('sGrid'); grid.innerHTML = '';
  selStage = Math.min(save.cleared + 1, 40);
  for (let i = 1; i <= 40; i++) {
    const c = document.createElement('div'); const avail = i <= save.cleared + 1;
    c.className = 'scell' + (i <= save.cleared ? ' clear' : avail ? ' open' : ' lock') + (STAGES[i - 1].special ? ' boss' : '');
    c.innerHTML = avail ? `${i}` : `🔒<small>${i}</small>`;
    c.addEventListener('click', () => { AU.sfx('button'); if (avail) { selStage = i; renderStageInfo(); } else renderStageInfo(i); });
    grid.appendChild(c);
  }
  renderStageInfo(); segSet('segDiffS', String(diffIdx())); renderDiffNote(); showScreen('scrStage');
}
function renderStageInfo(lockedN) {
  const box = $('sInfo');
  if (lockedN) { box.innerHTML = `<div class="nm">🔒 ${lockedN}. ${STAGES[lockedN - 1].name}</div><div class="ds">이전 스테이지를 클리어하면 열립니다.</div>`; $('sGo').style.visibility = 'hidden'; $('sStart').innerHTML = ''; return; }
  const s = STAGES[selStage - 1];
  const mobs = [...new Set(s.mobs.map(m => ET[m[0]].n))].join(', ');
  const f = save.settings.fast ? 0.25 : 1;
  const qtxt = (q, main) => { const o = mkQ(q, main, f); return `${main ? '▶' : '☆ [보조]'} ${qLabel(o)}${o.n ? ' ' + o.n : ''}${o.sec ? ' ' + fmtTime(o.sec) : ''}${o.k === 'boss' ? ': ' + BOSSES[o.id].name : ''}`; };
  const best = save.best[s.n];
  box.innerHTML = `<div class="nm">STAGE ${s.n}. ${s.name}</div><div class="ds">
    ${s.main.map(q => qtxt(q, true)).join('<br>')}${s.side.length ? '<br>' + s.side.map(q => qtxt(q, false)).join('<br>') : ''}<br>
    ${stageMissions(s.n).map(m => '🏅 [특별] ' + SPM_LABEL[m.k] + (m.n > 1 ? ' ' + m.n : '') + (m.sec ? ' ' + m.sec + '초' : '')).join('<br>')}<br>
    🚘 탑승 장비: ${VEH_ST[s.n].map(v => `<span style="color:${save.vfound[v.id] ? '#80deea' : '#b0bec5'}">${s.n <= save.cleared + 1 ? v.name : '???'}</span>`).join(', ')}<br>
    🤝 구조 대상: ${ALLY_ST[s.n].slice(0, 2).map(a => ACL[a.cls].ic + ' ' + a.name + ' <small>(' + APERK[a.perk].n + ')</small>').join(', ')}<br>
    👾 ${mobs}<br>🔫 주력 무기: ${s.wp.map(id => `<span style="color:${TIER_COL[WMAP[id].t]}">${WMAP[id].ic}${WMAP[id].nm}</span>`).join(', ')}
    ${best ? `<br>🏅 최고 기록: ${fmtTime(best.time)}` : ''}</div>`;
  $('sGo').style.visibility = 'visible';
  [...$('sGrid').children].forEach((c, i) => c.style.outline = i + 1 === selStage ? '3px solid #fff' : '');
  // 출전 무기 선택 (도감에서 발견한 무기 중)
  const found = WEAPONS.filter(w => save.codex[w.id] && firstStageOf(w.id) <= Math.max(save.cleared + 1, selStage));
  if (!found.some(w => w.id === 'rifle')) found.unshift(WMAP.rifle);
  if (!found.some(w => w.id === save.startW)) save.startW = 'rifle';
  $('sStart').innerHTML = '<div class="lbl">출전 무기</div>' + found.map(w => `<button class="wchip${w.id === save.startW ? ' on' : ''}" data-id="${w.id}" style="border-color:${TIER_COL[w.t]}">${w.ic}<small>${w.nm}</small></button>`).join('');
}
$('sStart').addEventListener('click', e => { const b = e.target.closest('.wchip'); if (!b) return; AU.sfx('button'); save.startW = b.dataset.id; writeSave(); [...$('sStart').querySelectorAll('.wchip')].forEach(x => x.classList.toggle('on', x === b)); });

/* ------------------------- 강화소 ------------------------- */
let shopReturn = 'stage';
function openShop(ret) {
  shopReturn = ret; G.state = 'menu'; renderShop(); showScreen('scrShop');
}
function renderShop() {
  $('shGold').textContent = '💰 ' + save.gold;
  $('shList').innerHTML = Object.entries(UPGRADES).map(([k, u]) => {
    const lv = save.up[k], max = lv >= u.max, cost = upCost(k, lv);
    return `<div class="shrow"><div class="ci">${u.ic}</div><div class="sx"><b>${u.n}</b> <small>Lv ${lv}/${u.max}</small><div class="cd">${u.d(lv)}${max ? '' : ` → <b style="color:#69f0ae">${u.d(lv + 1)}</b>`}</div></div>
      <button class="btn sm ${max || save.gold < cost ? 'gray' : ''}" data-k="${k}" ${max ? 'disabled' : ''}>${max ? 'MAX' : '💰' + cost}</button></div>`;
  }).join('');
}
$('shList').addEventListener('click', e => {
  const b = e.target.closest('button[data-k]'); if (!b) return; const k = b.dataset.k, lv = save.up[k], cost = upCost(k, lv);
  if (lv >= UPGRADES[k].max) return;
  if (save.gold < cost) { AU.sfx('hurt'); toast('골드가 부족합니다', 1, '#ff8a80'); return; }
  save.gold -= cost; save.up[k]++; writeSave(); AU.sfx('levelup'); renderShop();
});
$('shBack').addEventListener('click', () => { AU.sfx('button'); if (shopReturn === 'result') { showScreen('scrResult'); G.state = 'result'; } else openStageSelect(); });

/* ------------------------- 무기 도감 ------------------------- */
let codexRet = 'scrTitle';
function openCodex(ret) {
  codexRet = ret; const unl = unlockedWeapons(save.cleared + 1); let found = 0;
  const html = STAGES.map(st => `<div class="cxh">STAGE ${st.n} · ${st.name}</div><div class="cxg cx7">` + st.wp.map(id => {
    const w = WMAP[id], c = save.codex[id]; if (c) found++;
    const s2 = c ? 'found' : unl.has(id) ? 'unl' : 'lock';
    return `<button class="cx ${s2}" data-id="${id}" style="border-color:${c ? TIER_COL[w.t] : '#444'}">${s2 === 'lock' ? '❔' : w.ic}<small>${s2 === 'lock' ? '???' : w.nm}</small></button>`;
  }).join('') + '</div>').join('');
  $('cxList').innerHTML = html; $('cxCount').textContent = `발견 ${found} / ${WEAPONS.length}`;
  $('cxInfo').innerHTML = '무기를 누르면 자세한 정보가 표시됩니다.';
  showScreen('scrCodex');
}
$('cxList').addEventListener('click', e => {
  const b = e.target.closest('.cx'); if (!b) return; AU.sfx('button');
  const w = WMAP[b.dataset.id], c = save.codex[w.id], unl = unlockedWeapons(save.cleared + 1).has(w.id), fs_ = firstStageOf(w.id);
  if (!c && !unl) { $('cxInfo').innerHTML = `<b>??? (미해금)</b><br>스테이지 ${fs_}에 도달하면 해금됩니다.`; return; }
  const ev = EVOS[w.id]; const evoTxt = ev ? `<br>🔥 진화: <b>${ev.n}</b> — 최고 레벨 + ${ev.need.w ? WMAP[ev.need.w].nm + ' 보유' : PASSIVES[ev.need.p].name + ' 습득'}${c && c.evo ? ' (달성!)' : ''}` : '';
  const trTxt = w.tr && w.tr.length ? '<br>✨ 특성: ' + w.tr.map(k => `<b style="color:${TRAIT_MAP[k].col || '#fff'}">${TRAIT_MAP[k].adj}</b>(${TRAIT_MAP[k].d})`).join(', ') : '';
  const howTxt = w.t >= 3 ? '보스 확정 보상 · 전설 보물상자' : '레벨업 카드 · 정예 처치 · 보스 · 전설 상자';
  $('cxInfo').innerHTML = `<b style="color:${TIER_COL[w.t]}">${w.ic} ${w.nm}</b> <small>[스테이지 ${w.st} · ${TIER_NAME[w.t]} · ${CLASS_NAME[w.c]} · ${ROLE_NAME[w.m]}]</small><br>${w.d}${trTxt}<br>🎁 획득: ${howTxt}<br>
    ${c ? `📈 최고 강화: Lv ${c.maxLv || 1} · 💀 누적 처치: ${c.kills || 0}` : `아직 발견하지 못했습니다. (스테이지 ${fs_})`}${evoTxt}`;
});
$('cxBack').addEventListener('click', () => { AU.sfx('button'); if (codexRet === 'scrStage') openStageSelect(); else showScreen(codexRet); });

/* ------------------------- 일시정지 / 설정 ------------------------- */
function pauseGame() {
  if (G.state !== 'play') return;
  G.state = 'pause'; joy.id = null; joy.mag = 0;
  const wl = G.weapons.map(w => `${w.evo ? EVOS[w.id].ic : WMAP[w.id].ic} ${w.evo ? EVOS[w.id].n : WMAP[w.id].nm} Lv${w.lv}`).join('<br>');
  const pl = Object.entries(G.pass).map(([k, v]) => `${PASSIVES[k].icon}${v}`).join(' ');
  segSet('segDiffP', String(diffIdx()));
  const sq = allies.map(a => `${ACL[a.cls].ic} ${a.spec.name}${a.down > 0 ? ' (부상)' : ''}`).join('<br>');
  $('pInfo').innerHTML = statRows([['스테이지', `${G.stage}. ${G.st.name}`], ['레벨', 'Lv ' + G.lv], ...(G.veh ? [['탑승 장비', `${G.veh.def.name} (${Math.ceil(G.veh.hp)}/${G.veh.maxHp})`]] : [])]) + (sq ? `<div style="font-size:12px;margin:6px 0;line-height:1.5;color:#b9f6ca">${sq}</div>` : '') + G.quests.map(q => `<div class="stat"><span>${q.done ? '✔' : q.main ? '▶' : q.sp ? '🏅' : '☆'} ${qLabel(q)}</span><span>${qProgress(q)}</span></div>`).join('') + `<div style="font-size:13px;margin-top:8px;line-height:1.6">${wl}<br>${pl || ''}</div>`;
  showScreen('scrPause');
}
function resumeGame() { if (G.state !== 'pause') return; showScreen(null); G.state = 'play'; }
let setReturn = 'scrTitle';
function openSettings(ret) {
  setReturn = ret; const s = save.settings;
  $('vMusic').value = Math.round(s.music * 100); $('vSfx').value = Math.round(s.sfx * 100);
  segSet('segQ', s.quality); segSet('segShake', String(s.shake)); segSet('segDmg', String(s.dmgNum)); segSet('segFast', String(s.fast));
  showScreen('scrSet');
}
function segSet(id, v) { [...$(id).children].forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
function bindSeg(id, fn) { $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; AU.sfx('button'); segSet(id, b.dataset.v); fn(b.dataset.v); writeSave(); }); }
bindSeg('segQ', v => { save.settings.quality = v; applyQualitySetting(); });
bindSeg('segShake', v => save.settings.shake = +v);
bindSeg('segDmg', v => save.settings.dmgNum = +v);
bindSeg('segFast', v => save.settings.fast = +v);
bindSeg('segDiffP', v => setDiff(+v));
bindSeg('segDiffS', v => { setDiff(+v); renderDiffNote(); });
function renderDiffNote() { const d = DF(); $('diffNote').innerHTML = `${d.ic} <b style="color:${d.col}">${d.n}</b> — 적 체력 ${Math.round(d.hp * 100)}% · 공격력 ${Math.round(d.dmg * 100)}% · 등장 수 ${Math.round(d.cnt * 100)}% · 골드 x${d.gold}`; }
$('vMusic').addEventListener('input', e => { save.settings.music = e.target.value / 100; AU.applyVol(); });
$('vSfx').addEventListener('input', e => { save.settings.sfx = e.target.value / 100; AU.applyVol(); });
$('vMusic').addEventListener('change', writeSave); $('vSfx').addEventListener('change', () => { writeSave(); AU.sfx('coin'); });
$('setClose').addEventListener('click', () => { AU.sfx('button'); writeSave(); showScreen(setReturn); });
$('setReset').addEventListener('click', () => {
  confirmBox('저장 데이터 초기화', '클리어 기록, 골드, 강화, 무기 도감이 모두 삭제됩니다.<br>정말 초기화할까요?', () => {
    save = DEFAULT_SAVE(); writeSave(); applyQualitySetting(); AU.applyVol(); toast('초기화 완료', 1.2); showScreen('scrTitle'); G.state = 'title';
  }, () => showScreen('scrSet'));
});
function confirmBox(title, text, yes, no) { $('mTitle').textContent = title; $('mText').innerHTML = text; showScreen('modal'); $('mYes').onclick = () => { AU.sfx('button'); yes(); }; $('mNo').onclick = () => { AU.sfx('button'); no(); }; }
$('tStart').addEventListener('click', () => { AU.sfx('button'); openStageSelect(); });
$('tCodex').addEventListener('click', () => { AU.sfx('button'); openCodex('scrTitle'); });
$('tHelp').addEventListener('click', () => { AU.sfx('button'); showScreen('scrHelp'); });
$('helpClose').addEventListener('click', () => { AU.sfx('button'); showScreen('scrTitle'); });
$('tSet').addEventListener('click', () => { AU.sfx('button'); openSettings('scrTitle'); });
$('sBack').addEventListener('click', () => { AU.sfx('button'); G.state = 'title'; AU.bgm('title'); showScreen('scrTitle'); });
$('sShop').addEventListener('click', () => { AU.sfx('button'); openShop('stage'); });
$('sCodex').addEventListener('click', () => { AU.sfx('button'); openCodex('scrStage'); });
$('sGo').addEventListener('click', () => { AU.sfx('button'); startStage(selStage); });
$('pResume').addEventListener('click', () => { AU.sfx('button'); resumeGame(); });
$('pSet').addEventListener('click', () => { AU.sfx('button'); openSettings('scrPause'); });
$('pQuit').addEventListener('click', () => { AU.sfx('button'); confirmBox('포기하기', '지금까지 모은 골드는 보관됩니다.<br>스테이지를 포기할까요?', () => { finishRun(false); openStageSelect(); }, () => showScreen('scrPause')); });
function bindPress(id, fn) { $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); }); }
bindPress('bSk1', useSkill1); bindPress('bSk2', useSkill2); bindPress('bPot', usePotion); bindPress('bRide', () => { AU.sfx('button'); rideToggle(); });
bindPress('bPause', () => { AU.sfx('button'); pauseGame(); });

/* ------------------------- 터치 조이스틱 ------------------------- */
cv.addEventListener('pointerdown', e => {
  if (G.state !== 'play' || joy.id !== null) return;
  e.preventDefault(); joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = 0; joy.dy = 0; joy.mag = 0;
  try { cv.setPointerCapture(e.pointerId); } catch (_) { }
});
cv.addEventListener('pointermove', e => {
  if (e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy); const R = 50;
  if (d > R * 1.4) { joy.ox = e.clientX - dx / d * R * 1.4; joy.oy = e.clientY - dy / d * R * 1.4; dx = e.clientX - joy.ox; dy = e.clientY - joy.oy; }
  const m = Math.hypot(dx, dy); joy.mag = m / R; joy.dx = m ? dx / m : 0; joy.dy = m ? dy / m : 0;
});
const joyEnd = e => { if (e.pointerId === joy.id) { joy.id = null; joy.mag = 0; } };
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd); cv.addEventListener('lostpointercapture', joyEnd);
window.addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = true;
  if (k === 'j') useSkill1(); if (k === 'k') useSkill2(); if (k === 'l' || k === 'q') usePotion(); if (k === 'e' || k === 'f') rideToggle();
  if (k === 'Escape' || k === 'p') { if (G.state === 'play') pauseGame(); else if (G.state === 'pause') resumeGame(); }
});
window.addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (G.state === 'play') pauseGame(); if (AU.ctx) AU.ctx.suspend().catch(() => { }); writeSave(); }
  else if (AU.ctx) AU.ctx.resume().catch(() => { });
});
window.addEventListener('pagehide', writeSave);

/* ------------------------- 메인 루프 ------------------------- */
G.lastFrame = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - G.lastFrame) / 1000; G.lastFrame = now;
  if (!(dt > 0)) dt = 0.016; dt = Math.min(dt, 0.05);
  try {
    if (G.state === 'play') { update(dt); updateButtons(); }
    else if (G.state === 'dying') { G.deadT -= dt; for (const q of parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; } parts = parts.filter(q => q.life > 0); if (G.deadT <= 0) stageLose(); }
    render();
  } catch (err) { console.error(err); }
  if (Q.auto && G.state === 'play') {
    Q.fpsAcc += dt; Q.fpsN++;
    if (Q.fpsAcc >= 3) {
      const fps = Q.fpsN / Q.fpsAcc; Q.fpsAcc = 0; Q.fpsN = 0;
      if (fps < 42 && Q.level > 0) { Q.level--; QC = qualityCfg(); resize(); }
      else if (fps > 57 && Q.level < 2 && enemies.length < 80) { Q.level++; QC = qualityCfg(); resize(); }
    }
  }
}
applyQualitySetting();
AU.bgm('title');
requestAnimationFrame(frame);
window.__DS = { ext: () => ({ allies, vehs, rescues, VEH, VEH_ST, ALLY_ST, DIFFS, setDiff, boardVehicle, exitVehicle, addAlly, useVehSpecial, extEvent, rideToggle, spawnBoss, bossHpMul }), eprojs: () => eprojs, hazards: () => hazards, gens: () => gens, G, joy, get P() { return P; }, get enemies() { return enemies; }, pickups: () => pickups, startStage, update, save: () => save, STAGES, WEAPONS, wstat, addWeapon, recalc, hitEnemy, spawnEnemy, buildGrid };

/* ------------------------- 무기 획득 (슬롯이 가득 찬 경우 교체) ------------------------- */
function openSwap(id) {
  const W_ = WMAP[id];
  if (window.__botPick) { const low = G.weapons.slice().sort((a, b) => a.lv - b.lv)[0]; if (low && WMAP[low.id].t < W_.t) { const i = G.weapons.indexOf(low); const lv = Math.max(1, low.lv - 1); G.weapons.splice(i, 1); const nw = addWeapon(id); nw.lv = lv; } return; }
  G.state = 'levelup'; joy.id = null; joy.mag = 0;
  $('lvTitle').textContent = '새 무기 획득!';
  const box = $('cards'); box.innerHTML = `<div class="swapinfo" style="border-color:${TIER_COL[W_.t]}"><span style="font-size:30px">${W_.ic}</span><div><b style="color:${TIER_COL[W_.t]}">[${TIER_NAME[W_.t]}] ${W_.nm}</b><br><small>${W_.d}</small></div></div><div style="font-size:13px;margin:4px 0 6px;opacity:.85">무기 슬롯이 가득 찼습니다. 교체할 무기를 고르세요.</div>`;
  for (const w of G.weapons) {
    const b = document.createElement('button'); b.className = 'card'; b.style.padding = '8px 12px';
    b.innerHTML = `<div class="ci" style="width:42px;height:42px;font-size:26px">${WMAP[w.id].ic}</div><div><div class="cn">교체: ${w.evo ? EVOS[w.id].n : WMAP[w.id].nm}<em>Lv${w.lv}</em></div><div class="cd">새 무기는 Lv${Math.max(1, w.lv - 1)}로 시작 (레벨 일부 계승)</div></div>`;
    b.addEventListener('click', () => { const lv = Math.max(1, w.lv - 1); const i = G.weapons.indexOf(w); G.weapons.splice(i, 1); const nw = addWeapon(id); nw.lv = lv; G.weapons.splice(G.weapons.indexOf(nw), 1); G.weapons.splice(i, 0, nw); AU.sfx('button'); closeOverlay(); }, { once: true });
    box.appendChild(b);
  }
  const k = document.createElement('button'); k.className = 'btn gray sm'; k.textContent = '교체 안 함 (도감에만 등록)';
  k.addEventListener('click', () => { AU.sfx('button'); closeOverlay(); }, { once: true }); box.appendChild(k);
  showScreen('scrLevel');
}
function closeOverlay() { showScreen(null); G.state = 'play'; G.lastFrame = performance.now(); }
/* ------------------------- 전설 보물상자 ------------------------- */
function rollChest() {
  const st = G.st, pool = [];
  const own = id => G.weapons.some(w => w.id === id);
  const leg = STAGES.slice(0, G.stage).flatMap(x => x.wp).filter(id => WMAP[id].t >= 3 && !own(id) && WMAP[id].st >= G.stage - 4);
  const legLocal = st.wp.filter(id => WMAP[id].t >= 3 && !own(id));
  const legPool = legLocal.length ? legLocal : leg;
  if (legPool.length) pool.push({ k: 'leg', id: pick(legPool), w: 0.55 });
  const nw = st.wp.filter(id => WMAP[id].t <= 2 && !own(id)); if (nw.length) pool.push({ k: 'wpn', id: pick(nw.filter(id => !save.codex[id]).length ? nw.filter(id => !save.codex[id]) : nw), w: 3 });
  if (G.weapons.some(w => w.lv < WMAX)) pool.push({ k: 'up', w: 2.2 });
  pool.push({ k: 'atk', w: 1.5 }, { k: 'aspd', w: 1.5 }, { k: 'crit', w: 1.1 }, { k: 'spd', w: 0.9 }, { k: 'barrier', w: 1 });
  if (!G.buff.vamp) pool.push({ k: 'vamp', w: 0.8 });
  if (P.hp < P.maxHp * 0.8) pool.push({ k: 'heal', w: 1.2 });
  const out = [];
  while (out.length < 3 && pool.length) { const it = wpick(pool.map((x, i) => [i, x.w])); out.push(pool.splice(it, 1)[0]); }
  return out;
}
const CHEST_TXT = {
  leg: o => [WMAP[o.id].ic, `[${TIER_NAME[WMAP[o.id].t]}] ${WMAP[o.id].nm}`, WMAP[o.id].d], wpn: o => [WMAP[o.id].ic, `신규 무기: ${WMAP[o.id].nm}`, WMAP[o.id].d],
  up: () => ['⬆️', '무기 강화', '보유 무기 1개 레벨 +1 (가장 낮은 무기 우선)'], atk: () => ['💥', '공격력 증가', '이번 스테이지 동안 모든 피해 +15%'], aspd: () => ['⏩', '공격 속도 증가', '이번 스테이지 동안 연사 +12%'],
  crit: () => ['🎯', '치명타 확률 증가', '이번 스테이지 동안 치명타 +8%'], spd: () => ['👟', '이동 속도 증가', '이번 스테이지 동안 이동속도 +10%'], heal: () => ['💖', '체력 완전 회복', '체력을 최대치까지 회복'],
  barrier: () => ['🛡️', '특수 능력: 보호막', '피해를 5회 막아 주는 보호막'], vamp: () => ['🩸', '특수 능력: 흡혈', '적 처치 시 일정 확률로 체력 회복']
};
function openLegendChest() {
  const opts = rollChest();
  if (window.__botPick) { G.chestLog = (G.chestLog || []).concat(opts.map(o => o.k)); chooseChest(opts.find(o => o.k === 'leg') || opts[0]); return; }
  G.state = 'levelup'; joy.id = null; joy.mag = 0;
  $('chestCards').innerHTML = ''; $('chestBox').className = 'chestbox shake'; $('chestMsg').textContent = '전설 보물상자를 여는 중…';
  showScreen('scrChest'); AU.sfx('legend');
  setTimeout(() => { $('chestBox').className = 'chestbox open'; AU.sfx('chest'); $('chestMsg').textContent = '보상 1개를 선택하세요!'; }, 900);
  setTimeout(() => {
    for (const o of opts) {
      const [ic, nm, d] = CHEST_TXT[o.k](o); const b = document.createElement('button'); b.className = 'card' + (o.k === 'leg' ? ' evo' : o.k === 'wpn' ? ' new' : '');
      b.innerHTML = `<div class="ci">${ic}</div><div><div class="cn">${nm}${o.k === 'leg' ? '<em>✨ 전설</em>' : ''}</div><div class="cd">${d}</div></div>`;
      b.addEventListener('click', () => chooseChest(o), { once: true }); $('chestCards').appendChild(b);
    }
  }, 1400);
}
function chooseChest(o) {
  AU.sfx('button');
  switch (o.k) {
    case 'leg': case 'wpn': showScreen(null); G.state = 'play'; acquireWeapon(o.id, 'chest'); return;
    case 'up': { const w = G.weapons.filter(w => w.lv < WMAX).sort((a, b) => a.lv - b.lv)[0]; if (w) { w.lv++; codexOf(w.id).maxLv = Math.max(codexOf(w.id).maxLv || 1, w.lv); toast(`⬆ ${WMAP[w.id].nm} Lv${w.lv}`, 1.4, '#ffd54f'); } break; }
    case 'atk': G.buff.atk += 0.15; break; case 'aspd': G.buff.aspd += 0.12; break; case 'crit': G.buff.crit += 0.08; break; case 'spd': G.buff.spd += 0.10; break;
    case 'heal': heal(P.maxHp); break; case 'barrier': G.buff.barrier += 5; break; case 'vamp': G.buff.vamp = 1; break;
  }
  recalc(); closeOverlay();
}
