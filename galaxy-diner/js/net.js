// 은하수식당 온라인 통신 (PeerJS / WebRTC P2P — 서버 비용 0원)
// 방장 폰이 게임을 진행하고, 참가자 폰은 화면 표시 + 자기 차례 선택만 담당합니다.
(function () {
  const PREFIX = 'gdiner-v1-';
  const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const LIBS = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
  const ICE = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
    ]
  };
  const PING_MS = 3000, DEAD_MS = 13000;

  let libP = null;
  function loadLib() {
    if (window.Peer) return Promise.resolve();
    if (libP) return libP;
    libP = new Promise((res, rej) => {
      let i = 0;
      const next = () => {
        if (i >= LIBS.length) { libP = null; rej(new Error('통신 모듈을 불러오지 못했어요. 인터넷 연결을 확인하세요')); return; }
        const s = document.createElement('script'); s.src = LIBS[i++];
        s.onload = () => (window.Peer ? res() : next()); s.onerror = () => { s.remove(); next(); };
        document.head.appendChild(s);
      };
      next();
    });
    return libP;
  }
  function genCode() { let s = ''; for (let i = 0; i < 5; i++) s += CODE_CH[Math.floor(Math.random() * CODE_CH.length)]; return s; }
  function errMsg(e) {
    const t = e && e.type;
    if (t === 'peer-unavailable') return '방을 찾을 수 없어요. 코드를 확인하거나 방장에게 다시 링크를 받아 주세요';
    if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return '온라인 서버에 연결하지 못했어요. 인터넷 연결을 확인하세요';
    if (t === 'browser-incompatible') return '이 브라우저는 온라인 대전을 지원하지 않아요. 사파리나 크롬으로 열어 주세요';
    return (e && e.message) || '연결 오류';
  }
  function openPeer(id) {
    return new Promise((res, rej) => {
      const p = id ? new Peer(id, { config: ICE, debug: 0 }) : new Peer({ config: ICE, debug: 0 });
      const fail = e => { clearTimeout(to); p.off('open', ok); p.off('error', fail); try { p.destroy(); } catch (x) { } rej(e); };
      const ok = () => { clearTimeout(to); p.off('error', fail); res(p); };
      const to = setTimeout(() => fail(new Error('온라인 서버 연결 시간 초과. 인터넷 연결을 확인하세요')), 15000);
      p.on('open', ok); p.on('error', fail);
    });
  }
  // 연결 1개를 감싸기: JSON 문자열로 주고받고, 핑으로 끊김 감지
  function wrap(conn, onMsg, onClose) {
    const W = { conn, alive: true, last: Date.now() };
    let closed = false;
    const close = () => { if (closed) return; closed = true; W.alive = false; clearInterval(W.iv); try { conn.close(); } catch (e) { } onClose(W); };
    W.send = m => { if (!closed && conn.open) try { conn.send(typeof m === 'string' ? m : JSON.stringify(m)); } catch (e) { } };
    W.close = close;
    conn.on('data', d => {
      W.last = Date.now();
      let m; try { m = typeof d === 'string' ? JSON.parse(d) : d; } catch (e) { return; }
      if (!m) return;
      if (m.t === '_ping') { W.send('{"t":"_pong"}'); return; }
      if (m.t === '_pong') return;
      onMsg(W, m);
    });
    conn.on('close', close);
    conn.on('error', close);
    W.iv = setInterval(() => { if (Date.now() - W.last > DEAD_MS) close(); else W.send('{"t":"_ping"}'); }, PING_MS);
    return W;
  }

  // 방 만들기. h = { onJoin(W), onMsg(W,m), onLeave(W), onError(msg) }
  async function host(h) {
    await loadLib();
    let peer = null, code = null, lastErr = null;
    for (let i = 0; i < 6 && !peer; i++) {
      code = genCode();
      try { peer = await openPeer(PREFIX + code); } catch (e) { lastErr = e; if (e.type !== 'unavailable-id') throw new Error(errMsg(e)); }
    }
    if (!peer) throw new Error(errMsg(lastErr));
    const conns = new Set();
    peer.on('connection', conn => {
      conn.on('open', () => { const W = wrap(conn, h.onMsg, W2 => { conns.delete(W2); h.onLeave(W2); }); conns.add(W); h.onJoin(W); });
    });
    peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => { try { if (!peer.destroyed && peer.disconnected) peer.reconnect(); } catch (e) { } }, 1500); });
    peer.on('error', e => { if (e.type !== 'peer-unavailable' && h.onError) h.onError(errMsg(e)); });
    return {
      code,
      broadcast(m) { const s = JSON.stringify(m); conns.forEach(W => W.send(s)); },
      close() { const s = '{"t":"bye"}'; conns.forEach(W => W.send(s)); setTimeout(() => { conns.forEach(W => W.close()); try { peer.destroy(); } catch (e) { } }, 300); }
    };
  }

  // 방 참가. h = { onMsg(m), onClose() }
  async function join(code, h) {
    await loadLib();
    const peer = await openPeer(null).catch(e => { throw new Error(errMsg(e)); });
    return new Promise((res, rej) => {
      let done = false;
      const fail = e => { if (done) return; done = true; clearTimeout(to); try { peer.destroy(); } catch (x) { } rej(new Error(errMsg(e))); };
      const to = setTimeout(() => fail(new Error('방에 연결하지 못했어요. 방장 폰이 화면을 켜 두고 있는지 확인해 주세요')), 15000);
      peer.on('error', e => { if (!done) fail(e); });
      const conn = peer.connect(PREFIX + String(code).toUpperCase().trim(), { reliable: true, serialization: 'raw' });
      conn.on('open', () => {
        if (done) return; done = true; clearTimeout(to);
        const W = wrap(conn, (_, m) => h.onMsg(m), () => { try { peer.destroy(); } catch (e) { } h.onClose(); });
        res({ send: m => W.send(m), close: () => W.close() });
      });
    });
  }

  window.GNET = { host, join, loadLib };
})();
