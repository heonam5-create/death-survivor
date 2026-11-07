// 은하수식당 화면/조작
(function () {
  const D = window.GD, E = window.GE, AI = window.GAI;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const card = id => D.CARDS[id];
  const FOOD_ORDER = D.FOOD_KEYS;
  const img = {
    food: n => `img/food/${n}.webp`, order: n => `img/order/${n}.webp`, guest: n => `img/guest/${n}.webp`,
    expert: n => `img/expert/${n}.webp`, back: k => `img/ui/back_${k}.webp`
  };
  const SAVE = 'gd_save_v1', OPT = 'gd_opt_v1';
  let G = null, RUN = 0;
  const UI = { req: null, resolve: null, sel: [], targets: [], joker: false };
  const opt = Object.assign({ sfx: true, bgm: true, fast: false }, JSON.parse(localStorage.getItem(OPT) || '{}'));
  const sp = () => (opt.fast ? 0.45 : 1);
  const wait = ms => new Promise(r => setTimeout(r, ms * sp()));
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------- 화면 전환 ----------
  function show(id) { $$('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
  function toast(msg, err) { const t = document.createElement('div'); t.className = 'tst' + (err ? ' err' : ''); t.innerHTML = msg; const tb = $('#toast'); tb.appendChild(t); while (tb.children.length > 3) tb.firstChild.remove(); setTimeout(() => t.remove(), 2700); if (err) SND.play('bad'); }
  function modal(html, cls) { const m = $('#modal'); $('#m-box').className = 'm-box ' + (cls || ''); $('#m-box').innerHTML = html; m.classList.remove('hidden'); $('#m-box').scrollTop = 0; }
  function closeModal() { $('#modal').classList.add('hidden'); $('#m-box').innerHTML = ''; }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && !UI.modalLock) closeModal(); });

  function hasSave() { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && !s.over ? s : null; } catch (e) { return null; } }
  function refreshMenu() { $('#b-cont').disabled = !hasSave(); }

  // ---------- 메뉴 ----------
  let setupN = 3, setupD = 'normal';
  $('#b-new').onclick = () => { SND.init(); SND.play('tap'); show('scr-setup'); };
  $('#b-cont').onclick = () => { SND.init(); const s = hasSave(); if (s) startRun(s); };
  $('#b-rules').onclick = () => { SND.init(); renderRules(); show('scr-rules'); };
  $('#b-set').onclick = () => { SND.init(); show('scr-set'); };
  $$('[data-back]').forEach(b => b.onclick = () => { refreshMenu(); show('scr-menu'); });
  $$('#seg-n button').forEach(b => b.onclick = () => { setupN = +b.dataset.v; $$('#seg-n button').forEach(x => x.classList.toggle('on', x === b)); SND.play('tap'); });
  $$('#seg-d button').forEach(b => b.onclick = () => { setupD = b.dataset.v; $$('#seg-d button').forEach(x => x.classList.toggle('on', x === b)); SND.play('tap'); });
  $('#b-start').onclick = () => {
    const go = () => { const g = E.newGame(setupN, setupD, (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0); startRun(g); };
    if (hasSave()) {
      modal(`<h3>저장된 게임이 있어요</h3><p class="info" style="text-align:center">새 게임을 시작하면 이전에 하던 게임이 지워집니다.</p>
        <div class="m-btns"><button class="btn ghost" id="x-no">취소</button><button class="btn" id="x-yes">새 게임 시작</button></div>`);
      $('#x-no').onclick = closeModal; $('#x-yes').onclick = () => { closeModal(); go(); };
    } else go();
  };
  // 설정
  $('#o-sfx').checked = opt.sfx; $('#o-bgm').checked = opt.bgm; $('#o-fast').checked = opt.fast;
  SND.S.sfx = opt.sfx; SND.S.bgm = opt.bgm;
  const saveOpt = () => localStorage.setItem(OPT, JSON.stringify(opt));
  $('#o-sfx').onchange = e => { opt.sfx = e.target.checked; SND.set('sfx', opt.sfx); saveOpt(); };
  $('#o-bgm').onchange = e => { opt.bgm = e.target.checked; SND.set('bgm', opt.bgm); saveOpt(); };
  $('#o-fast').onchange = e => { opt.fast = e.target.checked; saveOpt(); };
  $('#b-wipe').onclick = () => { localStorage.removeItem(SAVE); toast('저장 데이터를 지웠습니다'); refreshMenu(); };
  $('#b-share').onclick = share;
  function share() {
    const url = location.href.split('#')[0].split('?')[0];
    if (navigator.share) navigator.share({ title: '은하수식당', text: '은하수식당 카드게임 같이 해요! 링크 누르면 바로 시작돼요 🚀', url }).catch(() => { });
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('링크를 복사했어요! 카카오톡에 붙여넣기 하세요'));
    else prompt('이 주소를 복사하세요', url);
  }

  // ---------- 게임 실행 ----------
  function startRun(g) {
    G = g; RUN++; const my = RUN;
    UI.sel = []; UI.targets = []; UI.joker = false; UI.req = null;
    closeModal(); show('scr-game'); render();
    const ask = (p, req) => {
      if (my !== RUN) return new Promise(() => { });
      if (G.players[p].ai) {
        const d = req.type === 'turn' ? 450 + Math.random() * 450 : 250;
        return wait(d).then(() => { if (my !== RUN) return new Promise(() => { }); return AI.aiAsk(G, p, req); });
      }
      return humanAsk(req);
    };
    const H = {
      save: g2 => { if (my === RUN) try { localStorage.setItem(SAVE, JSON.stringify(g2)); } catch (e) { } },
      event: e => (my === RUN ? onEvent(e) : new Promise(() => { })),
      invalid: (p, a, err) => { if (!G.players[p].ai) toast('규칙 위반: ' + esc(err), true); }
    };
    if (G.over) { render(); showResult(); return; }
    E.run(G, ask, H).then(() => { if (my === RUN) showResult(); }).catch(err => { console.error(err); toast('오류: ' + esc(err.message), true); });
  }

  function humanAsk(req) {
    return new Promise(res => {
      UI.req = req; UI.resolve = v => { UI.req = null; UI.resolve = null; UI.sel = []; UI.targets = []; UI.joker = false; closeModal(); res(v); render(); };
      if (req.type === 'turn') { render(); if (req.extra) toast('🎁 보상: 추가 액션 1회!'); scrollMain(); }
      else openReqModal(req);
    });
  }
  function scrollMain() { const m = $('.orow.main'); if (m) m.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

  // ---------- 렌더링 ----------
  function render() {
    if (!G) return;
    const me = G.players[0];
    $('#t-round').textContent = `${G.round}/4 라운드`;
    $('#t-turn').textContent = G.over ? '게임 종료' : G.phase === 'cleanup' ? '라운드 정리 중' : `${G.players[G.cur].name} 차례`;
    $('#t-acts').innerHTML = '내 액션 ' + [0, 1, 2, 3].map(i => i < G.acts[0] ? '●' : '○').join('');
    renderPlayers(); renderGuests(); renderRows(); renderMarket(); renderHand(); renderPrompt(); renderActions();
  }
  function renderPlayers() {
    $('#g-players').innerHTML = G.players.map((P, i) => `
      <div class="pchip ${i === G.cur && G.phase === 'action' && !G.over ? 'cur' : ''} ${UI.think === i ? 'think' : ''}" data-p="${i}">
        <div class="pn"><span class="dot" style="background:${P.color}"></span>${esc(P.name)}</div>
        <div class="ps">${P.score}</div>
        <div class="pi">🃏${P.hand.length} 🎲${P.dice} ⬤${P.tokens}</div>
      </div>`).join('');
    $$('.pchip').forEach(el => el.onclick = () => playerInfo(+el.dataset.p));
  }
  function guestLife(g) { return G.round - g.rev === 0 ? '2R 남음' : '마지막'; }
  function renderGuests() {
    const box = $('#g-guests');
    if (!G.guests.length) { box.innerHTML = ''; return; }
    const myTurn = UI.req && UI.req.type === 'turn';
    box.innerHTML = `<div class="sec-t"><span>✨ 특별한 손님 (카드 3장으로 대접 · +20)</span></div><div class="glist">` + G.guests.map((g, gi) => {
      let can = false;
      if (myTurn && UI.sel.length === 3 && !g.done.includes(0)) can = E.evalGuest(g.id, UI.sel.map(card), G.players[0].hand.length - 3).ok;
      return `<div class="gcard ${can ? 'can' : ''}" data-gi="${gi}"><img src="${img.guest(g.id)}" alt="">
        <span class="life">${guestLife(g)}</span>${g.first !== null ? `<span class="crown">👑</span>` : ''}
        <div class="marks">${g.done.map(p => `<span class="mk" style="background:${G.players[p].color}"></span>`).join('')}</div></div>`;
    }).join('') + '</div>';
    $$('.gcard').forEach(el => el.onclick = () => guestModal(+el.dataset.gi));
  }
  function slotTargets() {
    if (!UI.req || UI.req.type !== 'turn') return [];
    if (UI.joker) return E.openSlots(G, null);
    if (!UI.sel.length || UI.sel.length > 3) return [];
    const f = card(UI.sel[0]).f;
    if (!UI.sel.every(id => card(id).f === f)) return [];
    return E.openSlots(G, f);
  }
  function renderRows() {
    const can = slotTargets();
    const main = E.mainRow(G), usable = E.usableRows(G);
    let h = '';
    for (let r = 2; r >= 0; r--) {
      const locked = !usable.includes(r);
      const pts = locked ? '🔒' : (r === main ? '×10' : '×5');
      h += `<div class="orow ${r === main ? 'main' : ''} ${locked ? 'locked' : ''}"><div class="rl"><b>${r + 1}R</b>${pts}</div><div class="ocs">` +
        G.rows[r].map((o, c) => {
          const O = D.ORDERS[o.id];
          const w = E.cardWinner(o);
          return `<div class="ocard" data-r="${r}" data-c="${c}"><img src="${img.order(o.id)}" alt=""><span class="cap">${E.filled(o)}/${O.a}</span>` +
            [0, 1, 2].map(s => {
              const t = o.tok[s];
              const isCan = can.some(x => x.r === r && x.c === c && x.s === s);
              const isPick = UI.targets.some(x => x.r === r && x.c === c && x.s === s);
              return `<div class="slot s${s} ${isCan ? 'can' : ''} ${isPick ? 'pick' : ''}" data-s="${s}">${t !== null ? `<div class="tok" style="background:${G.players[t].color}">${o.jk[s] ? '🎲' : ''}</div>` : ''}</div>`;
            }).join('') + (w !== null ? `<span class="win" style="background:${G.players[w].color}"></span>` : '') + `</div>`;
        }).join('') + `</div></div>`;
    }
    $('#g-rows').innerHTML = `<div class="sec-t"><span>🍽 주문카드 (노란 줄 = 이번 라운드 메인 줄)</span></div>` + h;
    $$('.ocard').forEach(el => el.onclick = e => {
      const r = +el.dataset.r, c = +el.dataset.c;
      const sl = e.target.closest('.slot');
      if (sl && (sl.classList.contains('can') || sl.classList.contains('pick'))) { pickSlot(r, c, +sl.dataset.s); return; }
      orderInfo(r, c);
    });
  }
  function renderMarket() {
    $('#g-market').innerHTML = `<div class="sec-t"><span>🛒 공개된 요리카드</span><span>덱 ${G.deck.length} · 버림 ${G.discard.length}</span></div><div class="mlist">` +
      G.market.map(id => `<div class="mcard" data-id="${id}"><img src="${img.food(id)}" alt=""></div>`).join('') +
      `<div class="mcard deck"><img src="${img.back('food')}" alt=""><span class="cnt">${G.deck.length}</span></div></div>`;
    $$('#g-market .mcard[data-id]').forEach(el => el.onclick = () => foodZoom(+el.dataset.id));
  }
  function sortedHand(h) { return h.slice().sort((a, b) => FOOD_ORDER.indexOf(card(a).f) - FOOD_ORDER.indexOf(card(b).f) || a - b); }
  function renderHand() {
    const me = G.players[0];
    const box = $('#g-hand');
    if (!me.hand.length) { box.innerHTML = `<div class="empty-hand">손패가 없어요. ① 카드 얻기로 요리카드를 가져오세요!</div>`; return; }
    const selF = UI.sel.length ? card(UI.sel[0]).f : null;
    box.innerHTML = sortedHand(me.hand).map(id => {
      const c = card(id);
      return `<div class="hc ${UI.sel.includes(id) ? 'sel' : ''}" data-id="${id}"><img src="${img.food(id)}" alt=""><span class="cdot" style="background:${D.COLOR_HEX[c.c]}"></span></div>`;
    }).join('');
    $$('.hc').forEach(el => bindPress(el, () => tapHand(+el.dataset.id), () => foodZoom(+el.dataset.id)));
  }
  function bindPress(el, tap, long) {
    let t = null, fired = false;
    el.addEventListener('pointerdown', () => { fired = false; t = setTimeout(() => { fired = true; long(); }, 480); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => clearTimeout(t)));
    el.addEventListener('click', () => { if (!fired) tap(); });
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  function myTurn() { return UI.req && UI.req.type === 'turn'; }
  function renderPrompt() {
    const P = $('#g-prompt');
    if (G.over) { P.innerHTML = '게임이 끝났습니다'; return; }
    if (!myTurn()) { P.innerHTML = G.phase === 'cleanup' ? '라운드 정리 중...' : `<span>⏳ ${esc(G.players[G.cur].name)} 차례입니다... (카드를 길게 누르면 확대)</span>`; return; }
    if (UI.joker) {
      P.innerHTML = `🎲 조커 주사위로 가릴 요리 칸을 누르세요 ${UI.targets.length ? `<button class="pbtn" id="p-ok">제공하기</button>` : ''}<button class="pbtn g" id="p-cancel">취소</button>`;
    } else if (UI.sel.length) {
      const f = card(UI.sel[0]).f;
      const same = UI.sel.every(id => card(id).f === f);
      let msg = '';
      if (same && UI.sel.length <= 3) {
        const n = slotTargets().length;
        msg = `${esc(D.FOODS[f])} ×${UI.sel.length}${UI.sel.length > 1 ? ` <b style="color:#ffd54a">(${UI.sel.length - 1}COMBO)</b>` : ''} → 초록 칸 선택 ${UI.targets.length}/${UI.sel.length}` + (n === 0 ? ' <span style="color:#ff9a9a">(제공할 수 있는 칸 없음)</span>' : '');
      } else msg = `카드 ${UI.sel.length}장 선택`;
      if (UI.sel.length === 3) msg += ' · 3장은 ✨손님 대접 가능';
      P.innerHTML = `<span>${msg}</span>` + (same && UI.targets.length === UI.sel.length ? `<button class="pbtn" id="p-ok">제공하기</button>` : '') + `<button class="pbtn g" id="p-cancel">선택 해제</button>`;
    } else {
      P.innerHTML = `<span>🌟 <b>내 차례${UI.req.extra ? ' (보상 추가 액션)' : ''}!</b> 행동 1개를 고르세요. 요리카드를 눌러 선택 → 초록 칸에 제공</span>`;
    }
    const ok = $('#p-ok'); if (ok) ok.onclick = submitServe;
    const cc = $('#p-cancel'); if (cc) cc.onclick = () => { UI.sel = []; UI.targets = []; UI.joker = false; render(); };
  }
  function renderActions() {
    const t = myTurn(), me = G.players[0];
    $('#a-draw').disabled = !t; $('#a-dice').disabled = !t || me.dice >= E.MAX_DICE;
    $('#a-serve').disabled = !t; $('#a-guest').disabled = !t || !G.guests.length;
    $('#a-dice').innerHTML = `<b>②</b>조커주사위<br>받기 🎲${me.dice}/${E.MAX_DICE}`;
  }

  // ---------- 조작 ----------
  function tapHand(id) {
    if (!myTurn()) { foodZoom(id); return; }
    SND.play('tap');
    UI.joker = false;
    if (UI.sel.includes(id)) UI.sel = UI.sel.filter(x => x !== id); else UI.sel.push(id);
    // 타겟 정리
    const can = slotTargets();
    UI.targets = UI.targets.filter(t => can.some(x => x.r === t.r && x.c === t.c && x.s === t.s)).slice(0, UI.sel.length);
    render();
  }
  function pickSlot(r, c, s) {
    if (!myTurn()) return;
    SND.play('tap');
    const i = UI.targets.findIndex(t => t.r === r && t.c === c && t.s === s);
    if (i >= 0) UI.targets.splice(i, 1);
    else {
      const max = UI.joker ? 1 : UI.sel.length;
      const same = UI.targets.findIndex(t => t.r === r && t.c === c);
      if (same >= 0) { UI.targets.splice(same, 1); toast('한 번에 같은 주문카드에는 1개만 제공할 수 있어요', true); }
      UI.targets.push({ r, c, s });
      while (UI.targets.length > max) UI.targets.shift();
    }
    render();
    if (UI.joker && UI.targets.length === 1) submitServe();
  }
  function submit(a) {
    const err = E.validate(G, 0, a);
    if (err) { toast('⚠ ' + esc(err), true); return false; }
    UI.resolve(a); return true;
  }
  function submitServe() {
    if (UI.joker) submit({ t: 'serve', joker: true, targets: UI.targets.slice() });
    else submit({ t: 'serve', ids: UI.sel.slice(), targets: UI.targets.slice() });
  }
  $('#a-dice').onclick = () => { if (myTurn()) submit({ t: 'dice' }); };
  $('#a-draw').onclick = () => { if (myTurn()) drawModal(); };
  $('#a-serve').onclick = () => {
    if (!myTurn()) return;
    const me = G.players[0];
    if (UI.sel.length && UI.targets.length === UI.sel.length && card(UI.sel[0]).f && UI.sel.every(id => card(id).f === card(UI.sel[0]).f)) { submitServe(); return; }
    modal(`<h3>③ 요리 제공</h3><div class="info">
      <p>• 손패에서 <b>같은 요리카드</b>를 1~3장 누른 뒤, 주문카드의 <b style="color:#7cff8a">초록 칸</b>을 눌러 제공하세요.</p>
      <p>• 같은 요리 2장 = 추가 제공(1COMBO), 3장 = 마지막 제공(2COMBO). 한 번에 같은 주문카드에는 1개만!</p>
      <p>• 메인 줄 ×10점, 이전 줄 ×5점. 제공한 토큰 수만큼 카드를 다시 받아요.</p>
      <p>• 외계인 수(${'👽'}) = 그 주문카드에 제공할 수 있는 최대 요리 수.</p></div>
      <div class="m-btns"><button class="btn ghost" id="x-c">닫기</button>${me.dice > 0 ? `<button class="btn" id="x-j">🎲 조커 주사위로 제공</button>` : ''}</div>`);
    $('#x-c').onclick = closeModal;
    const j = $('#x-j'); if (j) j.onclick = () => { closeModal(); UI.sel = []; UI.targets = []; UI.joker = true; render(); if (!E.openSlots(G, null).length) toast('제공할 수 있는 칸이 없어요', true); };
  };
  $('#a-guest').onclick = () => {
    if (!myTurn()) return;
    if (G.guests.length === 1) { guestModal(0); return; }
    modal(`<h3>④ 특별한 손님 선택</h3><div class="grid">` + G.guests.map((g, gi) => `<div class="pick ${g.done.includes(0) ? 'no' : ''}" data-gi="${gi}"><img src="${img.guest(g.id)}"></div>`).join('') + `</div><p class="mini">이미 대접한 손님은 흐리게 보여요. 각 손님은 1인당 1회만 대접할 수 있어요.</p><div class="m-btns"><button class="btn ghost" id="x-c">닫기</button></div>`);
    $$('#m-box .pick').forEach(el => el.onclick = () => guestModal(+el.dataset.gi));
    $('#x-c').onclick = closeModal;
  };
  $('#a-exp').onclick = expertModal;
  $('#b-gmenu').onclick = () => {
    modal(`<h3>메뉴</h3>
      ${myTurn() ? `<button class="btn ghost" id="x-pass">⏭ 이번 행동 넘기기</button>` : ''}
      <button class="btn ghost" id="x-log">📜 진행 기록</button>
      <button class="btn ghost" id="x-rules">📖 게임 방법</button>
      <button class="btn ghost" id="x-share">🔗 링크 공유</button>
      <label class="row-set">효과음 <input type="checkbox" id="x-sfx" ${opt.sfx ? 'checked' : ''}></label>
      <label class="row-set">배경음악 <input type="checkbox" id="x-bgm" ${opt.bgm ? 'checked' : ''}></label>
      <label class="row-set">빠른 진행 <input type="checkbox" id="x-fast" ${opt.fast ? 'checked' : ''}></label>
      <button class="btn ghost" id="x-home">🏠 메인 메뉴 (자동 저장됨)</button>
      <button class="btn" id="x-c">계속하기</button>`);
    $('#x-c').onclick = closeModal;
    const ps = $('#x-pass'); if (ps) ps.onclick = () => { closeModal(); UI.resolve({ t: 'pass' }); };
    $('#x-log').onclick = () => modal(`<h3>진행 기록</h3><div class="info">${G.log.slice().reverse().map(esc).join('<br>')}</div><div class="m-btns"><button class="btn" id="x-c">닫기</button></div>`) || ($('#x-c').onclick = closeModal);
    $('#x-rules').onclick = () => { closeModal(); renderRules(true); show('scr-rules'); };
    $('#x-share').onclick = share;
    $('#x-sfx').onchange = e => { opt.sfx = e.target.checked; SND.set('sfx', opt.sfx); saveOpt(); };
    $('#x-bgm').onchange = e => { opt.bgm = e.target.checked; SND.set('bgm', opt.bgm); saveOpt(); };
    $('#x-fast').onchange = e => { opt.fast = e.target.checked; saveOpt(); };
    $('#x-home').onclick = () => { closeModal(); RUN++; G = null; refreshMenu(); show('scr-menu'); };
  };

  // ---------- 모달들 ----------
  function foodZoom(id) {
    const c = card(id);
    modal(`<img class="zimg" src="${img.food(id)}"><div class="info" style="text-align:center"><b>${esc(D.FOODS[c.f])}</b> · 숫자 ${c.n} · ${D.COLORS[c.c]} <span class="cdot" style="position:static;display:inline-block;background:${D.COLOR_HEX[c.c]}"></span></div><div class="m-btns"><button class="btn" id="x-c">닫기</button></div>`);
    $('#x-c').onclick = closeModal;
  }
  function orderInfo(r, c) {
    const o = G.rows[r][c], O = D.ORDERS[o.id];
    const dish = (d, s) => d === null ? '— (은하수 길: 요리 없음)' : d === 'same' ? `동일요리 → ${E.slotFoods(G, r, c, s).map(f => D.FOODS[f]).join(' / ') || '없음'}` : D.FOODS[d];
    modal(`<img class="zimg" src="${img.order(o.id)}"><div class="info">
      <b>요리:</b><br>${O.d.map((d, s) => `${['위', '중간', '아래'][s]}: ${esc(dish(d, s))} ${o.tok[s] !== null ? `<span style="color:${G.players[o.tok[s]].color}">● ${esc(G.players[o.tok[s]].name)}</span>` : ''}`).join('<br>')}
      <br><b>외계인 ${O.a}명</b> → 최대 ${O.a}개 제공 (현재 ${E.filled(o)}개)
      <br><b>보상(가장 많이 제공한 사람):</b> ${esc(D.REWARD_TEXT[O.r])}
      <br><b>4라운드 별:</b> ${'★'.repeat(O.s)}${O.g ? `<br><b>특별손님 아이콘:</b> ${O.g}개` : ''}</div>
      <div class="m-btns"><button class="btn" id="x-c">닫기</button></div>`);
    $('#x-c').onclick = closeModal;
  }
  function checklist(gid, cs, handAfter) {
    const g = D.GUESTS[gid];
    if (cs.length < 3) return `<ul class="chk">${g.b.map(([t]) => `<li>○ ${esc(t)}</li>`).join('')}<li class="s">★ 특별조건: ${esc(g.s[0])} (+5)</li></ul>`;
    return `<ul class="chk">${g.b.map(([t, fn]) => `<li class="${fn(cs) ? 'y' : 'n'}">${fn(cs) ? '✔' : '✘'} ${esc(t)}</li>`).join('')}<li class="${g.s[1](cs, handAfter) ? 'y' : 's'}">${g.s[1](cs, handAfter) ? '✔' : '★'} 특별조건: ${esc(g.s[0])} (+5)</li></ul>`;
  }
  function guestModal(gi) {
    const g = G.guests[gi]; if (!g) return;
    const GG = D.GUESTS[g.id];
    const me = G.players[0];
    const can = myTurn() && !g.done.includes(0);
    let sel = UI.sel.filter(id => me.hand.includes(id)).slice(0, 3);
    let useJ = false;
    const draw = () => {
      const cs = sel.map(card);
      const ev = sel.length === 3 ? E.evalGuest(g.id, cs, me.hand.length - 3) : null;
      let jtxt = '';
      if (sel.length === 3 && me.dice > 0 && !ev.ok) { const ch = E.jokerChance(g.id, cs, me.hand.length - 3); jtxt = `조커 성공 확률 약 ${Math.round(ch.ok * 100)}%`; }
      modal(`<h3>✨ ${esc(GG.name)}</h3><img class="zimg" style="max-height:30vh" src="${img.guest(g.id)}">
        <div class="info">${checklist(g.id, cs, me.hand.length - 3)}
        1등 보상: <b>${esc(D.REWARD_TEXT[GG.r])}</b> ${g.first !== null ? `(이미 ${esc(G.players[g.first].name)}이(가) 1등)` : '(아직 아무도 대접 안 함!)'}<br>
        대접 완료: ${g.done.length ? g.done.map(p => esc(G.players[p].name)).join(', ') : '없음'} · ${guestLife(g)}</div>
        ${can ? `<p class="mini" style="margin-top:6px">내 손패에서 3장을 고르세요 (${sel.length}/3)</p><div class="grid">${sortedHand(me.hand).map(id => `<div class="pick ${sel.includes(id) ? 'sel' : ''}" data-id="${id}"><img src="${img.food(id)}"></div>`).join('')}</div>
        ${me.dice > 0 ? `<label class="row-set" style="font-size:14px">🎲 조커 주사위 1개 사용 (주사위 1번 굴려 숫자 ±, 색상 1개 대체 시 카드 1장 비용, 실패하면 주사위만 버려짐) <input type="checkbox" id="x-j" ${useJ ? 'checked' : ''}></label><div class="mini">${jtxt}</div>` : ''}` : (g.done.includes(0) ? '<p class="mini">이미 이 손님을 대접했어요.</p>' : '')}
        <div class="m-btns"><button class="btn ghost" id="x-c">닫기</button>${can ? `<button class="btn" id="x-ok" ${sel.length === 3 && (ev.ok || useJ) ? '' : 'disabled'}>대접하기</button>` : ''}</div>`);
      $('#x-c').onclick = () => { UI.sel = sel.slice(); closeModal(); render(); };
      $$('#m-box .pick[data-id]').forEach(el => el.onclick = () => { const id = +el.dataset.id; if (sel.includes(id)) sel = sel.filter(x => x !== id); else if (sel.length < 3) sel.push(id); SND.play('tap'); draw(); });
      const j = $('#x-j'); if (j) j.onchange = e => { useJ = e.target.checked; draw(); };
      const ok = $('#x-ok'); if (ok) ok.onclick = () => submit({ t: 'guest', gi, ids: sel.slice(), joker: useJ && !(ev && ev.ok) });
    };
    draw();
  }
  function drawModal() {
    let sel = [];
    const need = Math.min(2, G.market.length);
    const draw = () => {
      modal(`<h3>① 요리카드 얻기</h3><div class="info">덱에서 2장 뽑거나, 공개된 카드 중 ${need}장을 고르세요. (손패 최대 7장)</div>
        <div class="grid" style="grid-template-columns:repeat(5,1fr)">${G.market.map(id => `<div class="pick ${sel.includes(id) ? 'sel' : ''}" data-id="${id}"><img src="${img.food(id)}"></div>`).join('')}</div>
        <div class="m-btns"><button class="btn ghost" id="x-deck" ${G.deck.length + G.discard.length ? '' : 'disabled'}>🂠 덱에서 2장</button><button class="btn" id="x-ok" ${sel.length === need && need ? '' : 'disabled'}>공개 카드 ${sel.length}/${need} 가져오기</button></div>
        <div class="m-btns"><button class="btn ghost" id="x-c">취소</button></div>`);
      $$('#m-box .pick').forEach(el => el.onclick = () => { const id = +el.dataset.id; if (sel.includes(id)) sel = sel.filter(x => x !== id); else { sel.push(id); if (sel.length > need) sel.shift(); } SND.play('tap'); draw(); });
      $('#x-deck').onclick = () => submit({ t: 'draw', src: 'deck' });
      $('#x-ok').onclick = () => submit({ t: 'draw', src: 'market', ids: sel.slice() });
      $('#x-c').onclick = closeModal;
    };
    draw();
  }
  function expertModal() {
    const me = G.players[0];
    modal(`<h3>📋 내 전문가 요청 카드</h3><div class="info">라운드 정리 때 1장을 골라 확인해요. 달성하면 +5, 성공 여부와 관계없이 그 카드는 버려집니다.</div>
      <div class="grid" style="grid-template-columns:repeat(2,1fr)">${me.experts.map(e => { const ok = D.EXPERTS[e].fn(me.st); return `<div class="pick ${ok ? 'ok' : ''}"><img src="${img.expert(e)}"><div class="mini" style="text-align:center">${ok ? '<span style="color:#7cff8a">현재 달성 ✔</span>' : '아직 미달성'}</div></div>`; }).join('') || '<p>남은 카드 없음</p>'}</div>
      ${roundStatsHtml(me)}
      <div class="m-btns"><button class="btn" id="x-c">닫기</button></div>`);
    $('#x-c').onclick = closeModal;
  }
  function roundStatsHtml(P) {
    const st = P.st;
    return `<div class="mini">이번 라운드: 사용 카드 ${st.played.length}장 (${[...new Set(st.played.map(c => D.COLORS[c.c]))].join('·') || '-'}) · 제공한 주문카드 ${Object.keys(st.served).length}곳 · 줄 ${st.rows.length}개 · COMBO ${st.combos} · 손님 ${st.guests} · 조커 얻음 ${st.diceGained}/사용 ${st.diceUsed}</div>`;
  }
  function playerInfo(i) {
    const P = G.players[i];
    modal(`<h3><span class="dot" style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${P.color}"></span> ${esc(P.name)}</h3>
      <div class="info">만족도 <b>${P.score}</b> · 손패 ${P.hand.length}장 · 조커 ${P.dice}개 · 요리토큰 ${P.tokens}개 · 전문가 카드 ${P.experts.length}장</div>
      ${roundStatsHtml(P)}
      <p class="mini" style="margin-top:6px">이번 라운드 앞에 낸 요리카드:</p>
      <div class="grid" style="grid-template-columns:repeat(6,1fr)">${P.st.played.map(c => `<div class="pick"><img src="${img.food(c.n)}"></div>`).join('') || '<span class="mini">없음</span>'}</div>
      ${P.expertLog.length ? `<p class="mini">전문가 기록: ${P.expertLog.map(x => `${x.round}R ${x.ok ? '✔' : '✘'}`).join(' · ')}</p>` : ''}
      <div class="m-btns"><button class="btn" id="x-c">닫기</button></div>`);
    $('#x-c').onclick = closeModal;
  }

  // 엔진 요청(사람)
  function openReqModal(req) {
    const me = G.players[0];
    UI.modalLock = true;
    const done = v => { UI.modalLock = false; UI.resolve(v); };
    const pickGrid = (ids, n, title, desc, faceSrc) => {
      let sel = [];
      const draw = () => {
        modal(`<h3>${title}</h3><div class="info">${desc}</div><div class="grid">${ids.map(id => `<div class="pick ${sel.includes(id) ? 'sel' : ''}" data-id="${id}"><img src="${(faceSrc || img.food)(id)}"></div>`).join('')}</div>
          <div class="m-btns"><button class="btn" id="x-ok" ${sel.length === n ? '' : 'disabled'}>확인 (${sel.length}/${n})</button></div>`);
        $$('#m-box .pick').forEach(el => el.onclick = () => { const id = +el.dataset.id; if (sel.includes(id)) sel = sel.filter(x => x !== id); else { sel.push(id); if (sel.length > n) sel.shift(); } SND.play('tap'); draw(); });
        $('#x-ok').onclick = () => done(sel.slice());
      };
      draw();
    };
    switch (req.type) {
      case 'drawSrc': {
        modal(`<h3>요리카드 받기 (${req.left}장 남음)</h3><div class="info">제공한 요리 수만큼 카드를 받아요. 공개 카드를 누르거나 덱에서 받으세요.</div>
          <div class="grid" style="grid-template-columns:repeat(5,1fr)">${G.market.map(id => `<div class="pick" data-id="${id}"><img src="${img.food(id)}"></div>`).join('')}</div>
          <div class="m-btns"><button class="btn" id="x-deck">🂠 덱에서 받기</button></div>`);
        $$('#m-box .pick').forEach(el => el.onclick = () => done(+el.dataset.id));
        $('#x-deck').onclick = () => done('deck');
        break;
      }
      case 'pickMarket': pickGrid(G.market.slice(), 1, '공개 카드 1장 가져오기', '원하는 카드를 고르세요.'); break;
      case 'pickDiscard': pickGrid(G.discard.slice().reverse(), 1, '버린 덱에서 1장 얻기', '버린 카드 중 원하는 카드를 고르세요.'); break;
      case 'jokerCost': pickGrid(sortedHand(me.hand), 1, '🎲 색상 대체 비용', '조커로 색상을 바꿨어요. 아무 색상 카드 1장을 비용으로 내세요.'); break;
      case 'discard': pickGrid(sortedHand(me.hand), req.n, `손패 한도 초과! ${req.n}장 버리기`, '손패는 최대 7장이에요. 버릴 카드를 고르세요.'); break;
      case 'give': pickGrid(sortedHand(me.hand), req.n, `${esc(G.players[req.to].name)}에게 줄 카드 ${req.n}장`, '교환으로 상대에게 줄 내 카드를 고르세요.'); break;
      case 'pickFrom': pickGrid(sortedHand(G.players[req.from].hand), req.n, `${esc(G.players[req.from].name)}의 손패`, `가져올 카드 ${req.n}장을 고르세요.`); break;
      case 'target': {
        modal(`<h3>🎯 ${esc(D.REWARD_TEXT[req.r])}</h3><div class="info">대상 플레이어를 고르세요.</div><div class="tgt">${req.cand.map(i => { const P = G.players[i]; return `<button class="btn ghost" data-i="${i}"><span style="color:${P.color}">●</span> ${esc(P.name)} — 만족도 ${P.score} · 🃏${P.hand.length} · 🎲${P.dice}</button>`; }).join('')}</div>`);
        $$('#m-box [data-i]').forEach(b => b.onclick = () => done(+b.dataset.i));
        break;
      }
      case 'expert': {
        modal(`<h3>📋 전문가 요청 확인</h3><div class="info">1장을 골라 내려놓으세요. 조건을 달성했으면 +5! (달성 못해도 1장은 버려져요)</div>
          <div class="grid" style="grid-template-columns:repeat(2,1fr)">${me.experts.map(e => { const ok = D.EXPERTS[e].fn(me.st); return `<div class="pick ${ok ? 'ok' : ''}" data-id="${e}"><img src="${img.expert(e)}"><div class="mini" style="text-align:center">${ok ? '<span style="color:#7cff8a">달성 ✔ +5</span>' : '미달성 (버림)'}</div></div>`; }).join('')}</div>${roundStatsHtml(me)}`);
        $$('#m-box .pick').forEach(el => el.onclick = () => done(+el.dataset.id));
        break;
      }
      default: done(null);
    }
    if (req.type === 'pickMarket' || req.type === 'pickDiscard') { const orig = UI.resolve; UI.resolve = v => orig(Array.isArray(v) ? v[0] : v); }
  }

  // ---------- 연출 ----------
  function rectOf(el) { return el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 }; }
  function floatText(txt, el, color) {
    const r = rectOf(el); const f = document.createElement('div'); f.className = 'float'; f.textContent = txt;
    if (color) f.style.color = color;
    f.style.left = (r.left + r.width / 2 - 18) + 'px'; f.style.top = (r.top + 4) + 'px';
    $('#fx').appendChild(f); setTimeout(() => f.remove(), 1000);
  }
  function banner(html, ms) { const b = document.createElement('div'); b.className = 'banner'; b.innerHTML = html; $('#fx').appendChild(b); setTimeout(() => b.remove(), ms || 1100); }
  function fly(src, fromEl, toEl) {
    const a = rectOf(fromEl), b = rectOf(toEl);
    const f = document.createElement('img'); f.className = 'fly'; f.src = src;
    f.style.left = a.left + 'px'; f.style.top = a.top + 'px'; $('#fx').appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.left = (b.left + b.width / 2 - 26) + 'px'; f.style.top = (b.top) + 'px'; f.style.transform = 'scale(.5)'; f.style.opacity = '.3'; }));
    setTimeout(() => f.remove(), 500);
  }
  const chip = p => $(`.pchip[data-p="${p}"]`);
  function confetti() { const cs = ['#ffd54a', '#ff6fa8', '#7cff8a', '#3fb6ff', '#b06bff']; for (let i = 0; i < 70; i++) { const c = document.createElement('div'); c.className = 'conf'; c.style.left = Math.random() * 100 + 'vw'; c.style.background = cs[i % 5]; c.style.animationDuration = (1.8 + Math.random() * 1.8) + 's'; c.style.animationDelay = Math.random() * .6 + 's'; $('#fx').appendChild(c); setTimeout(() => c.remove(), 4200); } }

  async function onEvent(e) {
    switch (e.t) {
      case 'turn': {
        UI.think = G.players[e.p].ai ? e.p : null; render();
        if (!G.players[e.p].ai) SND.play('tap');
        return;
      }
      case 'draw': {
        const fromEl = e.open ? $('#g-market .mlist') : $('#g-market .deck');
        const to = e.p === 0 ? $('#g-hand') : chip(e.p);
        e.ids.forEach((id, i) => setTimeout(() => fly(e.open || e.p === 0 ? img.food(id) : img.back('food'), fromEl, to), i * 120));
        SND.play('card'); UI.think = null; render(); await wait(e.p === 0 ? 350 : 500); return;
      }
      case 'gain': {
        const fromEl = e.open ? $('#g-market .mlist') : $('#g-market .deck');
        fly(e.p === 0 || e.open ? img.food(e.id) : img.back('food'), fromEl, e.p === 0 ? $('#g-hand') : chip(e.p));
        SND.play('card'); render(); await wait(260); return;
      }
      case 'dice': UI.think = null; render(); floatText(e.d > 0 ? '🎲+1' : '🎲-1', chip(e.p)); SND.play('dice'); await wait(450); return;
      case 'serve': {
        UI.think = null; render();
        if (e.ids.length > 1) { banner(`${e.ids.length - 1}COMBO!<small>${esc(G.players[e.p].name)} — ${esc(D.FOODS[card(e.ids[0]).f])} ×${e.ids.length}</small>`, 1000); SND.play('combo'); }
        else SND.play('serve');
        e.targets.forEach(t => { const el = $(`.ocard[data-r="${t.r}"][data-c="${t.c}"] .slot.s${t.s}`); if (el) { el.scrollIntoView({ block: 'nearest' }); floatText('🍽', el); } });
        await wait(e.ids.length > 1 ? 900 : 450); return;
      }
      case 'score': floatText('+' + e.pts, chip(e.p)); SND.play('score'); render(); await wait(e.pts >= 20 ? 300 : 180); return;
      case 'roll': {
        const d = document.createElement('div'); d.className = 'die'; d.textContent = e.d; $('#fx').appendChild(d); SND.play('dice');
        await wait(1000); d.remove();
        if (!e.ok) toast(`🎲 ${e.d} — ${esc(G.players[e.p].name)} 조커 실패! 주사위를 잃었어요`, e.p === 0);
        else if (e.info) { const f = e.info; const parts = []; if (f.dn) parts.push(`${f.card} → ${f.card + f.dn}`); if (f.col) parts.push(`색상 → ${D.COLORS[f.col] || f.col} (카드 1장 비용)`); toast(`🎲 ${e.d} 성공! ${parts.join(' · ') || '그대로 성공'}`); }
        return;
      }
      case 'guest': {
        UI.think = null; render();
        const im = document.createElement('img'); im.className = 'gpop'; im.src = img.guest(e.gid); $('#fx').appendChild(im);
        SND.play('guest');
        banner(`특별한 손님 대접!<small>${esc(G.players[e.p].name)} → ${esc(D.GUESTS[e.gid].name)}${e.first ? ' 👑1등' : ''}${e.special ? ' ★특별조건' : ''}</small>`, 1300);
        await wait(1300); im.remove(); return;
      }
      case 'reward': toast(`🎁 ${esc(G.players[e.p].name)} — ${esc(e.why)}: ${esc(D.REWARD_TEXT[e.r])}`); render(); await wait(650); return;
      case 'steal': toast(`🫳 ${esc(G.players[e.p].name)}이(가) ${esc(G.players[e.from].name)}의 카드 1장을 뺏었어요`); SND.play('card'); render(); await wait(500); return;
      case 'exchange': toast(`🔄 ${esc(G.players[e.p].name)} ↔ ${esc(G.players[e.with].name)} 카드 ${e.n}장 교환`); SND.play('card'); render(); await wait(500); return;
      case 'extraAction': if (G.players[e.p].ai) toast(`⚡ ${esc(G.players[e.p].name)} 추가 액션!`); await wait(300); return;
      case 'expert': toast(`📋 ${esc(G.players[e.p].name)} 전문가 요청 「${esc(D.EXPERTS[e.id].t)}」 ${e.ok ? '<b style="color:#7cff8a">성공 +5</b>' : '실패'}`); render(); await wait(600); return;
      case 'cleanupStart': UI.think = null; render(); banner(`${e.round}라운드 정리`, 1000); SND.play('round'); await wait(1000); return;
      case 'roundStart': {
        await roundSummary();
        render(); banner(`${e.round}라운드 시작!<small>${e.round === 4 ? '마지막 라운드 · 모든 줄 ×5 · 별 경쟁!' : e.guests ? `특별한 손님 ${e.guests}명 등장!` : ''}</small>`, 1300); SND.play('round');
        await wait(1300); scrollMain(); return;
      }
      case 'gameOver': render(); return;
    }
  }
  function summaryHtml(S) {
    if (!S) return '';
    const name = p => `<span style="color:${G.players[p].color}">${esc(G.players[p].name)}</span>`;
    let h = '';
    if (S.rewards.length) h += `<p class="mini">주문카드 보상: ${S.rewards.map(x => `${name(x.p)} ${esc(D.REWARD_TEXT[D.ORDERS[x.id].r])}`).join(' · ')}</p>`;
    if (S.stars) h += `<p class="mini">별: ${S.stars.map((s, p) => `${name(p)} ★${s}`).join(' · ')}</p>`;
    if (S.experts.length) h += `<p class="mini">전문가: ${S.experts.map(x => `${name(x.p)} ${x.ok ? '✔+5' : '✘'}`).join(' · ')}</p>`;
    return h;
  }
  function scoreTable() { return `<table class="res-t">${G.players.map((P, i) => ({ P, i })).sort((a, b) => b.P.score - a.P.score || a.P.hand.length - b.P.hand.length).map(({ P, i }, k) => `<tr><td>${k + 1}. <span style="color:${P.color}">●</span> ${esc(P.name)} <span class="mini">손패 ${P.hand.length}</span></td><td>${P.score}</td></tr>`).join('')}</table>`; }
  function roundSummary() {
    return new Promise(res => {
      UI.modalLock = true;
      modal(`<h3>${G.lastSummary.round}라운드 결과</h3>${summaryHtml(G.lastSummary)}${scoreTable()}<div class="m-btns"><button class="btn" id="x-n">${G.round}라운드 시작 →</button></div>`);
      $('#x-n').onclick = () => { UI.modalLock = false; closeModal(); res(); };
    });
  }
  function showResult() {
    render();
    const win = G.winners.includes(0);
    UI.modalLock = true;
    if (win) { confetti(); SND.play('win'); } else SND.play('round');
    modal(`<h3 style="font-size:26px">${win ? '🏆 승리! 최고의 은하수식당!' : '게임 종료'}</h3>
      <p class="info" style="text-align:center">승리: ${G.winners.map(i => `<b style="color:${G.players[i].color}">${esc(G.players[i].name)}</b>`).join(', ')}</p>
      ${summaryHtml(G.lastSummary)}${scoreTable()}<p class="mini">동점이면 손패가 적은 사람이 이겨요. 난이도: ${{ easy: '쉬움', normal: '보통', hard: '어려움' }[G.diff]}</p>
      <div class="m-btns"><button class="btn ghost" id="x-home">메인 메뉴</button><button class="btn" id="x-again">다시 하기</button></div>`);
    $('#x-home').onclick = () => { UI.modalLock = false; closeModal(); RUN++; refreshMenu(); show('scr-menu'); };
    $('#x-again').onclick = () => { UI.modalLock = false; closeModal(); startRun(E.newGame(G.n, G.diff, (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0)); };
  }

  // ---------- 게임 방법 ----------
  function renderRules(fromGame) {
    $('#rules-body').innerHTML = `<h2>📖 은하수식당 게임 방법</h2>
    <p>외계 식당의 주인이 되어 외계인 손님에게 요리를 대접하고 <b>만족도</b>를 가장 많이 얻으면 승리! (4라운드)</p>
    <h3>게임 준비</h3><ul><li>주문카드를 위에서 아래로 인원-1(3R) / 인원(2R) / 인원+1(1R) 장 배치</li><li>요리카드 72장 중 5장 공개, 전문가 요청 카드 4장씩, 요리토큰 8개, 조커주사위 2개</li><li>1라운드 줄의 손님 아이콘 수만큼 특별한 손님 등장</li></ul>
    <h3>라운드 진행</h3><ul><li>각자 라운드마다 <b>4액션</b>, 1액션씩 시계방향으로 돌아가며 진행</li>
    <li><b>① 카드 얻기</b>: 덱에서 2장 또는 공개 5장 중 2장 (손패 최대 7장)</li>
    <li><b>② 조커 주사위 얻기</b>: 내 차례 행동으로 조커 주사위 1개 받기 (시작 0개, 최대 2개)</li>
    <li><b>③ 요리 제공</b>: 주문카드의 요리와 같은 카드를 내고 토큰 배치. 같은 요리 2장 → 추가 제공(COMBO), 3장 → 마지막 제공. 한 번에 같은 주문카드에는 1개만. 외계인 수 = 그 카드에 제공 가능한 최대 수. 제공한 토큰 수만큼 카드를 다시 받음. 조커 주사위로 아무 요리나 가릴 수도 있음.</li>
    <li><b>④ 특별한 손님</b>: 조건에 맞는 카드 3장을 한 번에 내면 +20, 특별조건 +5, 가장 먼저 대접하면 1등 보상. 손님마다 1인 1회. 조커 주사위 1개 사용 가능(색 1개 대체 + 주사위 1번 굴려 숫자 ±, 실패하면 주사위만 잃음)</li></ul>
    <h3>점수</h3><ul><li>이번 라운드 메인 줄 요리 1개 = 10, 이전 줄 = 5, 4라운드는 모든 줄 5</li><li>얻는 즉시 점수판에 표시</li></ul>
    <h3>라운드 정리</h3><ul><li>선부터, 주문카드에 내 토큰이 가장 많은 곳의 보상 실행 (동률이면 없음)</li><li>전문가 요청 카드 1장을 골라 확인: 달성 +5, 성공 여부와 관계없이 버림 (카드 조건은 최소 2장 이상 조합)</li><li>토큰 회수 → 바로 위 줄이 다음 메인 줄 → 그 줄의 손님 아이콘만큼 새 손님</li><li>특별한 손님은 2라운드만 유지</li><li>4라운드는 보상 대신 별: 별을 가장 많이 얻은 사람(동률 모두) +10</li><li>선은 매 라운드 시계방향, 마지막 라운드는 만족도 최저 플레이어가 선</li></ul>
    <h3>승리</h3><ul><li>4라운드 후 만족도 최고 승리, 동률이면 손패가 적은 사람</li></ul>
    <h3>디지털판에서 정한 해석</h3>
    <div class="note">룰북에 명확하지 않은 부분은 이렇게 처리했어요:<br>
    • 게임 시작 시 모든 플레이어 요리카드 6장<br>
    • COMBO: 같은 요리카드 N장으로 서로 다른 주문카드 N곳에 동시에 제공 (2장=1COMBO, 3장=2COMBO)<br>
    • 조커 주사위는 각자 최대 2개(구성품: 색상당 2개)<br>
    • 동일요리 칸 = 바로 왼쪽/오른쪽 주문카드의 같은 위치 요리 중 선택<br>
    • 주문카드 '+1액션' 보상은 라운드 정리 중 즉시 1액션 추가<br>
    • '1장 교환'은 상대 카드를 무작위로 1장 받고 내 카드 1장을 줌, '보고 교환'은 상대 손패를 보고 고름<br>
    • 카드 3번(행성 고리 도넛)의 큰 숫자 '30' 인쇄는 3으로, 카드 7번 노란 숫자는 보라색으로 처리</div>
    <button class="btn" id="r-back" style="margin-top:16px">← 돌아가기</button>`;
    $('#r-back').onclick = () => { if (fromGame && G) show('scr-game'); else show('scr-menu'); };
  }

  // 첫 터치에 오디오 시작
  document.addEventListener('pointerdown', () => SND.init(), { once: true });
  refreshMenu();
  if ('serviceWorker' in navigator && location.protocol === 'https:') { const had = !!navigator.serviceWorker.controller; let done = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !done) { done = true; location.reload(); } }); navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => { }); }
  window.__G = () => G;
})();
