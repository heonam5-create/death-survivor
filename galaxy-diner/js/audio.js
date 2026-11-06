// 효과음·배경음악 (WebAudio로 직접 합성 — 외부 파일 없음)
(function (root) {
  let ctx = null, master = null, bgmGain = null, bgmTimer = null, step = 0;
  const S = { sfx: true, bgm: true };
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.gain.value = 0.16; bgmGain.connect(master);
    if (S.bgm) startBgm();
  }
  function tone(f, t0, dur, type, vol, dest) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol) {
    if (!ctx) return;
    const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 2500; g.gain.value = vol || 0.2;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  const FX = {
    tap: t => tone(880, t, 0.06, 'triangle', 0.12),
    card: t => { noise(t, 0.08, 0.15); tone(660, t + 0.02, 0.08, 'triangle', 0.1); },
    serve: t => { tone(784, t, 0.12, 'sine', 0.25); tone(1175, t + 0.07, 0.18, 'sine', 0.2); },
    combo: t => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.06, 0.2, 'square', 0.08)),
    score: t => { tone(988, t, 0.08, 'square', 0.07); tone(1319, t + 0.07, 0.2, 'square', 0.07); },
    guest: t => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.35, 'triangle', 0.18)),
    dice: t => { for (let i = 0; i < 6; i++) noise(t + i * 0.07, 0.05, 0.25); },
    round: t => [659, 784, 988].forEach((f, i) => tone(f, t + i * 0.12, 0.5, 'sine', 0.2)),
    bad: t => { tone(220, t, 0.18, 'sawtooth', 0.08); tone(180, t + 0.1, 0.2, 'sawtooth', 0.08); },
    win: t => [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, t + i * 0.11, 0.4, 'triangle', 0.18))
  };
  function play(name) { if (!S.sfx || !ctx) return; try { FX[name] && FX[name](ctx.currentTime + 0.01); } catch (e) { } }
  // 은은한 우주 분위기 배경음악 (펜타토닉 아르페지오 + 패드)
  const SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
  const CH = [[0, 2, 4], [3, 5, 7], [1, 4, 6], [2, 4, 7]];
  function startBgm() {
    if (!ctx || bgmTimer) return;
    let next = ctx.currentTime + 0.1;
    bgmTimer = setInterval(() => {
      while (next < ctx.currentTime + 0.6) {
        const ch = CH[Math.floor(step / 16) % CH.length];
        if (step % 16 === 0) ch.forEach(i => tone(SCALE[i] / 2, next, 3.2, 'sine', 0.12, bgmGain));
        if (step % 2 === 0) { const n = ch[(step / 2) % 3] + (step % 8 === 0 ? 3 : 0); tone(SCALE[n % 8] * (n >= 8 ? 2 : 1), next, 0.45, 'triangle', 0.09, bgmGain); }
        if (step % 8 === 6) tone(SCALE[(ch[2] + 2) % 8] * 2, next, 0.3, 'sine', 0.05, bgmGain);
        next += 0.2; step++;
      }
    }, 150);
  }
  function stopBgm() { clearInterval(bgmTimer); bgmTimer = null; }
  function set(k, v) { S[k] = v; if (k === 'bgm') { if (v) { init(); startBgm(); } else stopBgm(); } }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  root.SND = { init, play, set, S };
})(this);
