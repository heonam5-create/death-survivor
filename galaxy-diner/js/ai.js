// 은하수식당 AI (쉬움/보통/어려움) — 공개 정보만 사용
(function (root) {
  const isNode = typeof module !== 'undefined';
  const D = isNode ? require('./data.js') : root.GD;
  const E = isNode ? require('./engine.js') : root.GE;
  const { CARDS, ORDERS, GUESTS, EXPERTS } = D;
  const card = id => CARDS[id];

  const LV = {
    easy: { noise: 9, combo: false, guestSee: 0.45, jokerGuest: false, expertAware: 0, majority: 0.3, keep: 0.2 },
    normal: { noise: 3, combo: true, guestSee: 1, jokerGuest: true, expertAware: 0.6, majority: 0.8, keep: 0.5 },
    hard: { noise: 0.6, combo: true, guestSee: 1, jokerGuest: true, expertAware: 1, majority: 1.2, keep: 0.8 }
  };
  const R_VAL = { extra: 9, exchLook1: 3, exch1: 2, exch2: 3, exchLook2: 5, deck1: 4, deck2: 8, dice: 5, market1: 5, market2: 9, diceMinus: 2, steal1: 4, stealLook1: 6, discardLook1: 5 };

  function combos3(arr) { const out = []; for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) for (let k = j + 1; k < arr.length; k++) out.push([arr[i], arr[j], arr[k]]); return out; }

  // 카드 가치: 앞으로 제공 가능한 칸 + 손님 조건 가능성
  function cardValue(G, p, id, L) {
    const c = card(id);
    let v = 3;
    const open = E.openSlots(G, c.f);
    const main = E.mainRow(G);
    open.forEach(s => { v += s.r === main ? 2.2 : 1; });
    // 다음 라운드에 열릴 줄
    if (G.round < 3) { const nr = G.round; G.rows[nr].forEach((o, ci) => ORDERS[o.id].d.forEach((d, si) => { if (d === c.f) v += 0.8; })); }
    if (L && L.keep > 0.3) {
      const P = G.players[p];
      G.guests.forEach(g => { if (!g.done.includes(p)) { const others = P.hand.filter(x => x !== id); if (guestFitWith(g.id, c, others)) v += 3 * L.keep; } });
    }
    return Math.min(v, 16);
  }
  function guestFitWith(gid, c, others) {
    for (let i = 0; i < others.length; i++) for (let j = i + 1; j < others.length; j++) {
      if (E.evalGuest(gid, [c, card(others[i]), card(others[j])], 3).ok) return true;
    }
    return false;
  }

  // 전문가 요청 진행도 변화 평가
  function expertDelta(G, p, stAfter) {
    const P = G.players[p];
    if (!P.experts.length) return 0;
    const before = P.experts.some(e => EXPERTS[e].fn(P.st)) ? 1 : 0;
    const after = P.experts.some(e => EXPERTS[e].fn(stAfter)) ? 1 : 0;
    return (after - before) * 5;
  }
  function cloneSt(st) { return { played: st.played.slice(), served: Object.assign({}, st.served), rows: st.rows.slice(), combos: st.combos, diceGained: st.diceGained, diceUsed: st.diceUsed, guests: st.guests, guestSpecial: st.guestSpecial, extra: st.extra, stole: st.stole, exchanged: st.exchanged }; }

  function majorityValue(G, p, t, L) {
    const o = G.rows[t.r][t.c];
    const cnt = {}; o.tok.forEach(x => { if (x !== null) cnt[x] = (cnt[x] || 0) + 1; });
    const mine = (cnt[p] || 0) + 1;
    let maxOther = 0; for (const k in cnt) if (+k !== p) maxOther = Math.max(maxOther, cnt[k]);
    const prevWin = (cnt[p] || 0) > maxOther;
    const win = mine > maxOther;
    if (!win || prevWin) return 0;
    const val = G.round === 4 ? ORDERS[o.id].s * 1.5 : (R_VAL[ORDERS[o.id].r] || 3);
    // 남은 칸 수(상대가 다시 뺏을 가능성)
    const left = ORDERS[o.id].a - E.filled(o) - 1;
    return val * L.majority * (left > 0 ? 0.6 : 1) + (maxOther > 0 ? 2 * L.majority : 0);
  }

  function serveCandidates(G, p, L) {
    const P = G.players[p];
    const out = [];
    const byFood = {};
    P.hand.forEach(id => { const f = card(id).f; (byFood[f] = byFood[f] || []).push(id); });
    for (const f in byFood) {
      const slots = E.openSlots(G, f);
      if (!slots.length) continue;
      // 칸 가치 순 정렬, 같은 주문카드 중복 제외
      const scored = slots.map(s => ({ s, v: E.rowPoints(G, s.r) + majorityValue(G, p, s, L) })).sort((a, b) => b.v - a.v);
      const pick = []; const used = new Set();
      for (const x of scored) { const k = x.s.r + ':' + x.s.c; if (!used.has(k)) { used.add(k); pick.push(x); } }
      // 버릴 카드는 가치 낮은 것부터
      const ids = byFood[f].slice().sort((a, b) => cardValue(G, p, a, L) - cardValue(G, p, b, L));
      const maxK = Math.min(L.combo ? 3 : 1, ids.length, pick.length, P.tokens);
      for (let k = 1; k <= maxK; k++) {
        const use = ids.slice(0, k), tg = pick.slice(0, k);
        let v = tg.reduce((s, x) => s + x.v, 0);
        v += k * 4.5; // 제공 후 같은 수만큼 카드 받기
        v -= use.reduce((s, id) => s + cardValue(G, p, id, L), 0) * 0.55;
        if (L.expertAware) {
          const st = cloneSt(P.st);
          use.forEach(id => st.played.push(card(id)));
          tg.forEach(x => { const key = G.rows[x.s.r][x.s.c].id; st.served[key] = (st.served[key] || 0) + 1; if (!st.rows.includes(x.s.r)) st.rows.push(x.s.r); });
          st.combos += k - 1;
          v += expertDelta(G, p, st) * L.expertAware;
        }
        out.push({ a: { t: 'serve', ids: use, targets: tg.map(x => x.s) }, v });
      }
    }
    // 조커 주사위로 요리 제공 (손님용으로 아껴둘지 판단)
    if (P.dice > 0) {
      const slots = E.openSlots(G, null);
      if (slots.length) {
        const best = slots.map(s => ({ s, v: E.rowPoints(G, s.r) + majorityValue(G, p, s, L) })).sort((a, b) => b.v - a.v)[0];
        let v = best.v - 6 - (L.keep * 4) + (G.round === 4 && G.acts[p] <= 1 ? 6 : 0);
        if (L.expertAware) { const st = cloneSt(P.st); st.diceUsed++; const key = G.rows[best.s.r][best.s.c].id; st.served[key] = (st.served[key] || 0) + 1; if (!st.rows.includes(best.s.r)) st.rows.push(best.s.r); v += expertDelta(G, p, st) * L.expertAware; }
        out.push({ a: { t: 'serve', joker: true, targets: [best.s] }, v });
      }
    }
    return out;
  }

  function guestCandidates(G, p, L) {
    const P = G.players[p];
    const out = [];
    if (P.hand.length < 3) return out;
    const tri = combos3(P.hand);
    G.guests.forEach((g, gi) => {
      if (g.done.includes(p)) return;
      if (E.rnd(G) > L.guestSee) return; // 쉬움: 가끔 손님을 놓침
      const first = g.first === null;
      const rv = first ? (R_VAL[GUESTS[g.id].r] || 4) : 0;
      let best = null;
      for (const t of tri) {
        const cs = t.map(card);
        const ev = E.evalGuest(g.id, cs, P.hand.length - 3);
        const lost = t.reduce((s, id) => s + cardValue(G, p, id, L), 0) * 0.45;
        let exp = 0;
        if (ev.ok) {
          let v = 20 + (ev.special ? 5 : 0) + rv - lost;
          if (L.expertAware) { const st = cloneSt(P.st); st.guests++; if (ev.special) st.guestSpecial++; exp = expertDelta(G, p, st) * L.expertAware; }
          v += exp;
          if (!best || v > best.v) best = { a: { t: 'guest', gi, ids: t }, v };
        } else if (L.jokerGuest && P.dice > 0) {
          const ch = E.jokerChance(g.id, cs, P.hand.length - 3);
          if (ch.ok >= (L === LV.hard ? 0.34 : 0.5)) {
            let v = ch.ok * (20 + rv - lost) + ch.sp * 5 - 5;
            if (!best || v > best.v) best = { a: { t: 'guest', gi, ids: t, joker: true }, v };
          }
        }
      }
      if (best) out.push(best);
    });
    return out;
  }

  function drawCandidates(G, p, L) {
    const P = G.players[p];
    const out = [];
    const room = 7 - P.hand.length;
    const handBonus = P.hand.length <= 2 ? 6 : P.hand.length <= 4 ? 2 : 0;
    if (G.deck.length + G.discard.length) out.push({ a: { t: 'draw', src: 'deck' }, v: 2 * 6.2 + handBonus - (room < 2 ? 8 : 0) });
    if (G.market.length) {
      const vals = G.market.map(id => ({ id, v: cardValue(G, p, id, L) })).sort((a, b) => b.v - a.v);
      const need = Math.min(2, vals.length);
      const pick = vals.slice(0, need);
      out.push({ a: { t: 'draw', src: 'market', ids: pick.map(x => x.id) }, v: pick.reduce((s, x) => s + x.v, 0) + handBonus - (room < 2 ? 8 : 0) });
    }
    return out;
  }

  function chooseTurn(G, p, extra) {
    const L = LV[G.diff] || LV.normal;
    const P = G.players[p];
    let cands = [];
    cands = cands.concat(serveCandidates(G, p, L), guestCandidates(G, p, L), drawCandidates(G, p, L));
    if (P.dice < E.MAX_DICE) {
      let v = 5 + (P.dice === 0 ? 2 : 0);
      if (L.expertAware) { const st = cloneSt(P.st); st.diceGained++; v += expertDelta(G, p, st) * L.expertAware; }
      cands.push({ a: { t: 'dice' }, v });
    }
    if (!cands.length) return { t: 'pass' };
    cands.forEach(c => { c.v += (E.rnd(G) * 2 - 1) * L.noise; });
    cands.sort((a, b) => b.v - a.v);
    for (const c of cands) if (!E.validate(G, p, c.a)) return c.a;
    return { t: 'pass' };
  }

  function weakest(G, p, ids, n) { const L = LV[G.diff] || LV.normal; return ids.slice().sort((a, b) => cardValue(G, p, a, L) - cardValue(G, p, b, L)).slice(0, n); }
  function strongest(G, p, ids, n) { const L = LV[G.diff] || LV.normal; return ids.slice().sort((a, b) => cardValue(G, p, b, L) - cardValue(G, p, a, L)).slice(0, n); }

  function chooseTarget(G, p, req) {
    const cand = req.cand;
    if (G.diff === 'easy') return cand[Math.floor(E.rnd(G) * cand.length)];
    // 점수가 가장 높은 상대(동점이면 카드/주사위 많은 쪽)
    return cand.slice().sort((a, b) => {
      const A = G.players[a], B = G.players[b];
      if (req.r === 'diceMinus') return B.dice - A.dice || B.score - A.score;
      return B.score - A.score || B.hand.length - A.hand.length;
    })[0];
  }

  function chooseExpert(G, p) {
    const P = G.players[p];
    const ok = P.experts.filter(e => EXPERTS[e].fn(P.st));
    if (ok.length) return G.diff === 'easy' ? ok[Math.floor(E.rnd(G) * ok.length)] : ok[0];
    if (G.diff === 'easy') return P.experts[Math.floor(E.rnd(G) * P.experts.length)];
    // 앞으로 달성하기 어려운 카드부터 버림
    const hardness = { 4: 3, 8: 3, 9: 3, 5: 3, 17: 4, 18: 4, 12: 2, 13: 2, 3: 3, 19: 2, 20: 2, 6: 2, 16: 2, 10: 2, 11: 2, 14: 1, 15: 2, 1: 1, 2: 1, 7: 1 };
    const later = G.round >= 3 ? [18] : [];
    return P.experts.slice().sort((a, b) => (hardness[b] + (later.includes(b) ? -3 : 0)) - (hardness[a] + (later.includes(a) ? -3 : 0)))[0];
  }

  function aiAsk(G, p, req) {
    const P = G.players[p];
    switch (req.type) {
      case 'turn': return chooseTurn(G, p, req.extra);
      case 'discard': return weakest(G, p, P.hand, req.n);
      case 'drawSrc': {
        const L = LV[G.diff] || LV.normal;
        if (!G.market.length) return 'deck';
        const best = G.market.map(id => ({ id, v: cardValue(G, p, id, L) })).sort((a, b) => b.v - a.v)[0];
        return (best.v >= 7 || G.diff === 'hard' && best.v >= 6) && G.diff !== 'easy' ? best.id : 'deck';
      }
      case 'pickMarket': return strongest(G, p, G.market, 1)[0];
      case 'pickDiscard': return strongest(G, p, G.discard.slice(-20), 1)[0];
      case 'target': return chooseTarget(G, p, req);
      case 'pickFrom': return strongest(G, p, G.players[req.from].hand, req.n);
      case 'give': return weakest(G, p, P.hand, req.n);
      case 'expert': return chooseExpert(G, p);
    }
    return null;
  }

  const A = { aiAsk, LV };
  if (isNode) module.exports = A; else root.GAI = A;
})(this);
