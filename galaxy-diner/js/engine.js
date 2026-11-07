// 은하수식당 규칙 엔진 (룰북 기준)
(function (root) {
  const D = (typeof module !== 'undefined') ? require('./data.js') : root.GD;
  const { CARDS, ORDERS, GUESTS, EXPERTS } = D;

  // ---- 시드 난수 (저장/불러오기 시 순서 보존) ----
  function rnd(G) { // mulberry32
    let t = (G.rng = (G.rng + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function shuffle(G, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(G) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const card = id => CARDS[id];
  const HAND_LIMIT = 7, TOKENS = 8, MAX_DICE = 2, START_HAND = 6;
  const PCOLORS = ['#3fb6ff', '#ffd23f', '#ff6fa8', '#7cff8a'];
  const PNAMES = ['나', 'AI 루나', 'AI 오릭스', 'AI 넥스'];

  function newStats() { return { played: [], served: {}, rows: [], combos: 0, diceGained: 0, diceUsed: 0, guests: 0, guestSpecial: 0, extra: 0, stole: 0, exchanged: 0 }; }

  function newGame(n, diff, seed) {
    const G = { ver: 1, rng: (seed >>> 0) || 1, n, diff, round: 1, phase: 'action', over: false, log: [], turnNo: 0 };
    G.players = [];
    for (let i = 0; i < n; i++) G.players.push({ name: PNAMES[i], ai: i !== 0, color: PCOLORS[i], hand: [], experts: [], tokens: TOKENS, dice: 0, score: 0, st: newStats(), expertLog: [] });
    G.deck = shuffle(G, Object.keys(CARDS).map(Number));
    G.discard = [];
    // 시작 손패: 모든 플레이어(사람·AI, 2~4인 공통) 요리카드 6장
    G.players.forEach(P => { P.hand = G.deck.splice(0, START_HAND); });
    if (G.players.some(P => P.hand.length !== START_HAND)) throw new Error('시작 손패 배분 오류');
    G.market = G.deck.splice(0, 5);
    // 주문카드: 위에서 아래로 인원-1(3R) / 인원(2R) / 인원+1(1R)
    const od = shuffle(G, Object.keys(ORDERS).map(Number));
    const mk = k => od.splice(0, k).map(id => ({ id, tok: [null, null, null], jk: [false, false, false] }));
    G.rows = [mk(n + 1), mk(n), mk(n - 1)]; // rows[0]=1라운드(아래), rows[1]=2라운드, rows[2]=3라운드(위)
    G.expertDeck = shuffle(G, Object.keys(EXPERTS).map(Number));
    G.players.forEach(p => { p.experts = G.expertDeck.splice(0, 4); });
    G.guestDeck = shuffle(G, Object.keys(GUESTS).map(Number));
    G.guests = [];
    G.start = Math.floor(rnd(G) * n);
    G.cur = G.start;
    G.acts = G.players.map(() => 4);
    placeGuests(G, 0);
    log(G, `게임 시작! ${G.players[G.start].name}부터 시작합니다.`);
    return G;
  }

  function placeGuests(G, rowIdx) {
    const icons = G.rows[rowIdx].reduce((s, o) => s + ORDERS[o.id].g, 0);
    for (let i = 0; i < icons && G.guestDeck.length; i++) G.guests.push({ id: G.guestDeck.shift(), rev: G.round, done: [], first: null });
    return icons;
  }

  function log(G, msg) { G.log.push(msg); if (G.log.length > 80) G.log.shift(); }

  // ---- 덱 ----
  function drawDeck(G) {
    if (!G.deck.length && G.discard.length) { G.deck = shuffle(G, G.discard); G.discard = []; log(G, '버린 카드를 섞어 새 덱을 만들었습니다.'); }
    return G.deck.length ? G.deck.shift() : null;
  }
  function refillMarket(G) { while (G.market.length < 5) { const c = drawDeck(G); if (c == null) break; G.market.push(c); } }

  // ---- 행 / 슬롯 ----
  const mainRow = G => (G.round <= 3 ? G.round - 1 : -1);
  const usableRows = G => (G.round <= 3 ? [...Array(G.round).keys()] : [0, 1, 2]);
  const rowPoints = (G, r) => (r === mainRow(G) ? 10 : 5);
  function slotFoods(G, r, c, s) { // 이 칸에 낼 수 있는 음식 목록
    const d = ORDERS[G.rows[r][c].id].d[s];
    if (d === null) return [];
    if (d !== 'same') return [d];
    const out = [];
    [c - 1, c + 1].forEach(nc => { const o = G.rows[r][nc]; if (o) { const nd = ORDERS[o.id].d[s]; if (nd && nd !== 'same' && !out.includes(nd)) out.push(nd); } });
    return out;
  }
  const filled = o => o.tok.filter(t => t !== null).length;
  // 음식 f를 낼 수 있는 빈 칸 목록 (f=null이면 조커: 어떤 요리든)
  function openSlots(G, f) {
    const res = [];
    usableRows(G).forEach(r => G.rows[r].forEach((o, c) => {
      if (filled(o) >= ORDERS[o.id].a) return;
      for (let s = 0; s < 3; s++) {
        if (o.tok[s] !== null) continue;
        const fs = slotFoods(G, r, c, s);
        if (!fs.length) continue;
        if (f === null || fs.includes(f)) res.push({ r, c, s });
      }
    }));
    return res;
  }

  // ---- 점수 ----
  async function addScore(G, p, pts, why, H) {
    G.players[p].score += pts;
    log(G, `${G.players[p].name} +${pts} (${why})`);
    if (H && H.event) await H.event({ t: 'score', p, pts, why });
  }

  // ---- 손패 한도 ----
  async function enforceLimit(G, p, ask) {
    const P = G.players[p];
    if (P.hand.length > HAND_LIMIT) {
      const n = P.hand.length - HAND_LIMIT;
      let ids = await ask(p, { type: 'discard', n });
      ids = (ids || []).filter(id => P.hand.includes(id)).slice(0, n);
      while (ids.length < n) ids.push(P.hand.find(id => !ids.includes(id)));
      ids.forEach(id => { P.hand.splice(P.hand.indexOf(id), 1); G.discard.push(id); });
      log(G, `${P.name} 손패 한도(7장) 초과로 ${n}장 버림`);
    }
  }

  async function gainFromSource(G, p, n, ask, H, forced) { // 덱 또는 공개 카드에서 n장 (forced: 'deck'|'market')
    const P = G.players[p];
    for (let i = 0; i < n; i++) {
      let src = forced;
      if (!src) src = await ask(p, { type: 'drawSrc', left: n - i });
      let id = null;
      if (typeof src === 'number' && G.market.includes(src)) { id = src; G.market.splice(G.market.indexOf(src), 1); refillMarket(G); }
      else if (src === 'market' && G.market.length) { const pick = await ask(p, { type: 'pickMarket' }); id = G.market.includes(pick) ? pick : G.market[0]; G.market.splice(G.market.indexOf(id), 1); refillMarket(G); }
      else id = drawDeck(G);
      if (id == null && G.market.length) { id = G.market.shift(); refillMarket(G); }
      if (id == null) break;
      P.hand.push(id);
      if (H && H.event) await H.event({ t: 'gain', p, id, open: typeof src === 'number' || src === 'market' });
    }
    await enforceLimit(G, p, ask);
  }

  // ---- 액션 ----
  function canDraw(G) { return G.deck.length + G.discard.length + G.market.length >= 1; }

  // act: {t:'draw', src:'deck'} | {t:'draw', src:'market', ids:[a,b]} | {t:'dice'} | {t:'serve', ids:[..], joker:false, targets:[{r,c,s}]}
  //      | {t:'guest', gi, ids:[3], joker:true/false} | {t:'pass'}
  function validate(G, p, a) {
    const P = G.players[p];
    if (!a || !a.t) return '행동이 없습니다';
    if (a.t === 'pass') return null;
    if (a.t === 'draw') {
      if (a.src === 'deck') return (G.deck.length + G.discard.length) ? null : '덱이 비었습니다';
      if (a.src === 'market') {
        const ids = a.ids || [];
        const need = Math.min(2, G.market.length);
        if (ids.length !== need || new Set(ids).size !== ids.length || !ids.every(id => G.market.includes(id))) return `공개된 카드 중 ${need}장을 골라야 합니다`;
        return null;
      }
      return '잘못된 카드 얻기';
    }
    if (a.t === 'dice') return P.dice < MAX_DICE ? null : '조커 주사위는 최대 2개까지 가질 수 있습니다';
    if (a.t === 'serve') {
      const tg = a.targets || [];
      if (a.joker) {
        if (P.dice < 1) return '조커 주사위가 없습니다';
        if (tg.length !== 1) return '조커 주사위는 요리 1개를 가립니다';
      } else {
        const ids = a.ids || [];
        if (!ids.length || ids.length > 3) return '요리카드를 1~3장 고르세요';
        if (!ids.every(id => P.hand.includes(id)) || new Set(ids).size !== ids.length) return '손패에 없는 카드입니다';
        const f = card(ids[0]).f;
        if (!ids.every(id => card(id).f === f)) return 'COMBO는 같은 요리카드끼리만 가능합니다';
        if (tg.length !== ids.length) return `제공할 곳을 ${ids.length}곳 골라야 합니다`;
        if (P.tokens < ids.length) return '요리토큰이 부족합니다';
      }
      const f = a.joker ? null : card(a.ids[0]).f;
      const open = openSlots(G, f);
      const seen = new Set();
      for (const t of tg) {
        if (!open.some(o => o.r === t.r && o.c === t.c && o.s === t.s)) return a.joker ? '그 칸에는 제공할 수 없습니다' : '그 칸은 이 요리를 받을 수 없거나 이미 제공되었습니다';
        const k = t.r + ':' + t.c;
        if (seen.has(k)) return '한 번에 같은 주문카드에는 1개만 제공할 수 있습니다';
        seen.add(k);
      }
      return null;
    }
    if (a.t === 'guest') {
      const g = G.guests[a.gi];
      if (!g) return '손님이 없습니다';
      if (g.done.includes(p)) return '이 손님에게는 이미 요리를 제공했습니다';
      const ids = a.ids || [];
      if (ids.length !== 3 || new Set(ids).size !== 3 || !ids.every(id => P.hand.includes(id))) return '요리카드 3장을 골라야 합니다';
      if (a.joker && P.dice < 1) return '조커 주사위가 없습니다';
      const ev = evalGuest(g.id, ids.map(card), P.hand.length - 3);
      if (!a.joker && !ev.ok) return '조건 불충족: ' + ev.fails.join(', ');
      return null;
    }
    return '알 수 없는 행동';
  }

  function evalGuest(gid, cs, handAfter) {
    const g = GUESTS[gid];
    const fails = g.b.filter(([t, fn]) => !fn(cs)).map(x => x[0]);
    const ok = fails.length === 0;
    const sp = ok && g.s[1](cs, handAfter);
    return { ok, special: !!sp, fails };
  }
  // 조커: 주사위 1번 굴린 결과 d로 3장 중 1장의 색상 대체 + 숫자 ±d (가장 좋은 조합 자동 선택)
  function jokerBest(gid, cs, handAfter, d) {
    let best = null;
    for (let i = 0; i < 3; i++) for (const col of [null, 'R', 'G', 'P', 'W']) for (const dn of [0, d, -d]) {
      const m = cs.map((x, j) => j === i ? { n: x.n + dn, f: x.f, c: col || x.c } : x);
      const ev = evalGuest(gid, m, handAfter);
      if (ev.ok && (!best || (ev.special && !best.special))) best = { ok: true, special: ev.special, i, col, dn };
      if (best && best.special) return best;
    }
    return best || { ok: false };
  }
  function jokerChance(gid, cs, handAfter) { // 성공 확률(보상 판단용)
    let ok = 0, sp = 0;
    for (let d = 1; d <= 6; d++) { const b = jokerBest(gid, cs, handAfter, d); if (b.ok) ok++; if (b.special) sp++; }
    return { ok: ok / 6, sp: sp / 6 };
  }

  async function perform(G, p, a, ask, H) {
    const P = G.players[p];
    if (a.t === 'pass') { log(G, `${P.name} 행동 넘김`); return; }
    if (a.t === 'draw') {
      if (a.src === 'deck') {
        const got = [];
        for (let i = 0; i < 2; i++) { const id = drawDeck(G); if (id == null) break; got.push(id); P.hand.push(id); }
        log(G, `${P.name} 덱에서 ${got.length}장 뽑기`);
        if (H && H.event) await H.event({ t: 'draw', p, ids: got, open: false });
      } else {
        a.ids.forEach(id => { G.market.splice(G.market.indexOf(id), 1); P.hand.push(id); });
        log(G, `${P.name} 공개 카드 ${a.ids.map(i => i + '번').join(', ')} 가져옴`);
        if (H && H.event) await H.event({ t: 'draw', p, ids: a.ids, open: true });
        refillMarket(G);
      }
      await enforceLimit(G, p, ask);
      return;
    }
    if (a.t === 'dice') {
      P.dice++; P.st.diceGained++;
      log(G, `${P.name} 조커 주사위 1개 얻음`);
      if (H && H.event) await H.event({ t: 'dice', p, d: 1 });
      return;
    }
    if (a.t === 'serve') {
      const placed = [];
      for (const t of a.targets) {
        const o = G.rows[t.r][t.c];
        o.tok[t.s] = p; o.jk[t.s] = !!a.joker;
        const key = o.id;
        P.st.served[key] = (P.st.served[key] || 0) + 1;
        if (!P.st.rows.includes(t.r)) P.st.rows.push(t.r);
        placed.push(t);
      }
      if (a.joker) {
        P.dice--; P.st.diceUsed++;
        log(G, `${P.name} 조커 주사위로 요리 제공`);
      } else {
        a.ids.forEach(id => { P.hand.splice(P.hand.indexOf(id), 1); P.st.played.push(card(id)); });
        P.tokens -= a.ids.length;
        if (a.ids.length > 1) P.st.combos += a.ids.length - 1;
        log(G, `${P.name} ${D.FOODS[card(a.ids[0]).f]} ${a.ids.length}개 제공${a.ids.length > 1 ? ` (${a.ids.length - 1}COMBO!)` : ''}`);
      }
      if (H && H.event) await H.event({ t: 'serve', p, targets: placed, ids: a.ids || [], joker: !!a.joker });
      for (const t of placed) await addScore(G, p, rowPoints(G, t.r), t.r === mainRow(G) ? '메인 줄 요리' : '요리 제공', H);
      if (!a.joker) await gainFromSource(G, p, a.ids.length, ask, H); // 제공한 요리토큰 수만큼 받기
      return;
    }
    if (a.t === 'guest') {
      const g = G.guests[a.gi];
      const cs = a.ids.map(card);
      const after = P.hand.length - 3;
      let ev = evalGuest(g.id, cs, after), jinfo = null;
      if (a.joker) {
        P.dice--; P.st.diceUsed++;
        const d = 1 + Math.floor(rnd(G) * 6);
        const b = jokerBest(g.id, cs, after, d);
        jinfo = { d, ...b };
        if (H && H.event) await H.event({ t: 'roll', p, d, ok: b.ok });
        if (!b.ok) { log(G, `${P.name} 조커 주사위(${d}) 실패 — 주사위를 잃었습니다`); return; }
        ev = { ok: true, special: b.special };
      }
      a.ids.forEach(id => { P.hand.splice(P.hand.indexOf(id), 1); G.discard.push(id); });
      g.done.push(p);
      P.st.guests++;
      const first = g.first === null;
      if (first) { g.first = p; if (P.tokens > 0) { P.tokens--; g.tok = p; } }
      log(G, `${P.name} 특별한 손님 ${GUESTS[g.id].name} 대접!${a.joker ? ` (조커 ${jinfo.d})` : ''}`);
      if (H && H.event) await H.event({ t: 'guest', p, gi: a.gi, gid: g.id, special: ev.special, first, joker: jinfo });
      await addScore(G, p, 20, '특별한 손님', H);
      if (ev.special) { P.st.guestSpecial++; await addScore(G, p, 5, '특별조건', H); }
      if (first) await doReward(G, p, GUESTS[g.id].r, ask, H, '1등 보상');
      return;
    }
  }

  // ---- 보상 효과 ----
  async function doReward(G, p, r, ask, H, why) {
    const P = G.players[p];
    const others = G.players.map((_, i) => i).filter(i => i !== p);
    log(G, `${P.name} 보상: ${D.REWARD_TEXT[r]}`);
    if (H && H.event) await H.event({ t: 'reward', p, r, why });
    switch (r) {
      case 'dice': if (P.dice < MAX_DICE) { P.dice++; P.st.diceGained++; } else log(G, '조커 주사위가 이미 2개라 받지 못함'); break;
      case 'deck1': await gainFromSource(G, p, 1, ask, H, 'deck'); break;
      case 'deck2': await gainFromSource(G, p, 2, ask, H, 'deck'); break;
      case 'market1': case 'market2': {
        const n = r === 'market1' ? 1 : 2;
        for (let i = 0; i < n && G.market.length; i++) { let id = await ask(p, { type: 'pickMarket' }); if (!G.market.includes(id)) id = G.market[0]; G.market.splice(G.market.indexOf(id), 1); P.hand.push(id); refillMarket(G); if (H && H.event) await H.event({ t: 'gain', p, id, open: true }); }
        await enforceLimit(G, p, ask); break;
      }
      case 'discardLook1': {
        if (!G.discard.length) { log(G, '버린 덱이 비어 있음'); break; }
        let id = await ask(p, { type: 'pickDiscard' }); if (!G.discard.includes(id)) id = G.discard[G.discard.length - 1];
        G.discard.splice(G.discard.indexOf(id), 1); P.hand.push(id);
        if (H && H.event) await H.event({ t: 'gain', p, id, open: true });
        await enforceLimit(G, p, ask); break;
      }
      case 'diceMinus': {
        const cand = others.filter(i => G.players[i].dice > 0);
        if (!cand.length) { log(G, '조커 주사위를 가진 상대가 없음'); break; }
        let t = await ask(p, { type: 'target', r, cand }); if (!cand.includes(t)) t = cand[0];
        G.players[t].dice--; log(G, `${G.players[t].name} 조커 주사위 -1`);
        if (H && H.event) await H.event({ t: 'dice', p: t, d: -1 });
        break;
      }
      case 'steal1': case 'stealLook1': {
        const cand = others.filter(i => G.players[i].hand.length > 0);
        if (!cand.length) { log(G, '뺏을 카드가 없음'); break; }
        let t = await ask(p, { type: 'target', r, cand }); if (!cand.includes(t)) t = cand[0];
        const T = G.players[t];
        let id;
        if (r === 'stealLook1') { id = await ask(p, { type: 'pickFrom', from: t, n: 1 }); id = Array.isArray(id) ? id[0] : id; if (!T.hand.includes(id)) id = T.hand[0]; }
        else id = T.hand[Math.floor(rnd(G) * T.hand.length)];
        T.hand.splice(T.hand.indexOf(id), 1); P.hand.push(id); P.st.stole++;
        log(G, `${P.name}이(가) ${T.name}의 카드 1장을 뺏음`);
        if (H && H.event) await H.event({ t: 'steal', p, from: t, id });
        await enforceLimit(G, p, ask); break;
      }
      case 'exch1': case 'exch2': case 'exchLook1': case 'exchLook2': {
        const want = (r === 'exch2' || r === 'exchLook2') ? 2 : 1;
        const look = r.startsWith('exchLook');
        if (!P.hand.length) { log(G, '교환할 내 카드가 없음'); break; }
        const cand = others.filter(i => G.players[i].hand.length > 0);
        if (!cand.length) { log(G, '교환할 상대 카드가 없음'); break; }
        let t = await ask(p, { type: 'target', r, cand }); if (!cand.includes(t)) t = cand[0];
        const T = G.players[t];
        const n = Math.min(want, P.hand.length, T.hand.length);
        let take;
        if (look) { take = await ask(p, { type: 'pickFrom', from: t, n }); take = (take || []).filter(id => T.hand.includes(id)).slice(0, n); while (take.length < n) take.push(T.hand.find(id => !take.includes(id))); }
        else { const pool = T.hand.slice(); shuffle(G, pool); take = pool.slice(0, n); }
        let give = await ask(p, { type: 'give', n, to: t });
        give = (give || []).filter(id => P.hand.includes(id)).slice(0, n); while (give.length < n) give.push(P.hand.find(id => !give.includes(id)));
        take.forEach(id => { T.hand.splice(T.hand.indexOf(id), 1); P.hand.push(id); });
        give.forEach(id => { P.hand.splice(P.hand.indexOf(id), 1); T.hand.push(id); });
        P.st.exchanged++;
        log(G, `${P.name} ↔ ${T.name} 카드 ${n}장 교환`);
        if (H && H.event) await H.event({ t: 'exchange', p, with: t, n });
        break;
      }
      case 'extra': {
        P.st.extra++;
        if (H && H.event) await H.event({ t: 'extraAction', p });
        const a = await ask(p, { type: 'turn', extra: true });
        const err = validate(G, p, a);
        await perform(G, p, err ? { t: 'pass' } : a, ask, H);
        break;
      }
    }
  }

  // ---- 라운드 정리 ----
  function cardWinner(o) {
    const c = {}; o.tok.forEach(t => { if (t !== null) c[t] = (c[t] || 0) + 1; });
    let best = -1, who = null, tie = false;
    for (const k in c) { if (c[k] > best) { best = c[k]; who = +k; tie = false; } else if (c[k] === best) tie = true; }
    return tie ? null : who;
  }

  async function cleanup(G, ask, H) {
    const n = G.n, order = [...Array(n).keys()].map(i => (G.start + i) % n);
    if (H && H.event) await H.event({ t: 'cleanupStart', round: G.round });
    const summary = { round: G.round, rewards: [], experts: [], stars: null };
    if (G.round <= 3) {
      for (const p of order) {
        for (let r = 0; r < 3; r++) for (const o of G.rows[r]) {
          if (cardWinner(o) === p) { summary.rewards.push({ p, id: o.id }); await doReward(G, p, ORDERS[o.id].r, ask, H, '주문카드 보상'); }
        }
      }
    } else {
      const stars = G.players.map(() => 0);
      for (let r = 0; r < 3; r++) for (const o of G.rows[r]) { const w = cardWinner(o); if (w !== null) stars[w] += ORDERS[o.id].s; }
      const mx = Math.max(...stars);
      summary.stars = stars.slice();
      if (mx > 0) for (let p = 0; p < n; p++) if (stars[p] === mx) await addScore(G, p, 10, `별 ${mx}개 1등`, H);
    }
    // 전문가 요청: 1장 선택해 체크, 성공 여부와 관계없이 버림
    for (const p of order) {
      const P = G.players[p];
      if (!P.experts.length) continue;
      let e = await ask(p, { type: 'expert' });
      if (!P.experts.includes(e)) e = P.experts[0];
      const ok = !!EXPERTS[e].fn(P.st);
      P.experts.splice(P.experts.indexOf(e), 1);
      P.expertLog.push({ round: G.round, id: e, ok });
      summary.experts.push({ p, id: e, ok });
      if (H && H.event) await H.event({ t: 'expert', p, id: e, ok });
      if (ok) await addScore(G, p, 5, '전문가 요청', H); else log(G, `${P.name} 전문가 요청 실패 (${EXPERTS[e].t})`);
    }
    // 토큰 회수, 사용 카드 버림
    for (let r = 0; r < 3; r++) for (const o of G.rows[r]) { o.tok = [null, null, null]; o.jk = [false, false, false]; }
    G.guests.forEach(g => { if (g.tok != null) g.tok = null; });
    G.players.forEach(P => { P.tokens = TOKENS; P.st.played.forEach(c => G.discard.push(c.n)); P.st = newStats(); });
    // 특별한 손님: 공개 후 다음 라운드 정리 단계에 제거 (2라운드 유지)
    G.guests = G.guests.filter(g => G.round - g.rev < 1);
    G.lastSummary = summary;
    if (G.round === 4) { finish(G); if (H && H.event) await H.event({ t: 'gameOver' }); return; }
    G.round++;
    let icons = 0;
    if (G.round <= 3) icons = placeGuests(G, G.round - 1);
    if (G.round === 4) { // 마지막 라운드: 만족도 최저 플레이어가 선
      const prevStart = G.start;
      let best = null;
      for (let i = 1; i <= n; i++) { const p = (prevStart + i) % n; if (best === null || G.players[p].score < G.players[best].score) best = p; }
      G.start = best;
    } else G.start = (G.start + 1) % n;
    G.cur = G.start; G.acts = G.players.map(() => 4); G.phase = 'action';
    log(G, `${G.round}라운드 시작 — ${G.players[G.start].name} 선${icons ? `, 특별한 손님 ${icons}명 등장` : ''}`);
    if (H && H.event) await H.event({ t: 'roundStart', round: G.round, guests: icons });
  }

  function finish(G) {
    G.over = true; G.phase = 'over';
    const rank = G.players.map((P, i) => ({ i, s: P.score, h: P.hand.length })).sort((a, b) => b.s - a.s || a.h - b.h);
    G.rank = rank.map(x => x.i);
    const top = rank[0];
    G.winners = rank.filter(x => x.s === top.s && x.h === top.h).map(x => x.i);
    log(G, `게임 종료! 승리: ${G.winners.map(i => G.players[i].name).join(', ')}`);
  }

  // ---- 메인 루프 ----
  // ask(p, req) -> Promise(answer). H.event(e) -> Promise, H.save(G)
  async function run(G, ask, H, maxSteps) {
    let steps = 0;
    while (!G.over) {
      if (maxSteps && ++steps > maxSteps) throw new Error('step limit');
      if (G.phase === 'action') {
        if (G.acts.every(a => a === 0)) { G.phase = 'cleanup'; continue; }
        const p = G.cur;
        if (G.acts[p] === 0) { G.cur = (p + 1) % G.n; continue; }
        if (H && H.save) H.save(G);
        if (H && H.event) await H.event({ t: 'turn', p });
        let a = await ask(p, { type: 'turn' });
        let err = validate(G, p, a);
        if (err) { if (H && H.invalid) H.invalid(p, a, err); a = { t: 'pass' }; }
        G.turnNo++;
        await perform(G, p, a, ask, H);
        G.acts[p]--;
        G.cur = (p + 1) % G.n;
      } else if (G.phase === 'cleanup') {
        await cleanup(G, ask, H);
        if (H && H.save) H.save(G);
      }
    }
    if (H && H.save) H.save(G);
    return G;
  }

  const E = { START_HAND, newGame, run, validate, perform, openSlots, slotFoods, usableRows, mainRow, rowPoints, evalGuest, jokerBest, jokerChance, cardWinner, card, rnd, filled, HAND_LIMIT, MAX_DICE, TOKENS };
  if (typeof module !== 'undefined') module.exports = E; else root.GE = E;
})(this);
