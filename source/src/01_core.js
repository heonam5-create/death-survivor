'use strict';
/* =====================================================================
   데스 서바이버: 전설의 귀환 — v2 (현대 화기 50종 / 30스테이지 / 퀘스트)
   ===================================================================== */
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function wpick(list) { let s = 0; for (const it of list) s += it[1]; let r = Math.random() * s; for (const it of list) { r -= it[1]; if (r <= 0) return it[0]; } return list[0][0]; }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function angDiff(a, b) { let d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); }
function segDist2(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = clamp(t, 0, 1); const x = ax + dx * t - px, y = ay + dy * t - py; return x * x + y * y; }

/* ------------------------- 저장 (v1 데이터와 호환) ------------------------- */
const SAVE_KEY = 'deathSurvivor_save_v1';
const DEFAULT_SAVE = () => ({
  v: 1, cleared: 0, gold: 0,
  stats: { kills: 0, bossKills: 0, runs: 0, bestLv: 1 },
  settings: { music: 0.6, sfx: 0.8, quality: 'auto', shake: 1, dmgNum: 1, fast: 0, diff: 1 },
  // v2 추가 항목 (기존 저장에는 없으므로 기본값으로 채움)
  up: { atk: 0, hp: 0, armor: 0, spd: 0, gain: 0, pot: 0 },
  codex: {},        // 무기 도감: { id: { found:1, maxLv, kills } }
  startW: 'rifle',  // 출전 무기
  best: {},         // 스테이지별 최고 기록 { n: {time, side} }
  // v4 추가 항목
  vfound: {},       // 탑승한 적 있는 장비 { id: 1 }
  afound: {},       // 구출한 동료 종류 { 'cls+perk': 1 }
  inherit: []       // 다음 스테이지 계승 무기 (최대 2개) [{ id, lv, evo, from }]
});
let save = DEFAULT_SAVE();
function loadSave() {
  for (const key of [SAVE_KEY, SAVE_KEY + '_bak']) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const d = JSON.parse(raw);
      if (!d || typeof d !== 'object' || d.v !== 1) continue;
      const def = DEFAULT_SAVE();
      save = Object.assign(def, d);
      save.stats = Object.assign(DEFAULT_SAVE().stats, d.stats || {});
      save.settings = Object.assign(DEFAULT_SAVE().settings, d.settings || {});
      save.up = Object.assign(DEFAULT_SAVE().up, d.up || {});
      save.codex = (d.codex && typeof d.codex === 'object') ? d.codex : {};
      save.best = (d.best && typeof d.best === 'object') ? d.best : {};
      save.vfound = (d.vfound && typeof d.vfound === 'object') ? d.vfound : {};
      save.afound = (d.afound && typeof d.afound === 'object') ? d.afound : {};
      { const raw = Array.isArray(d.inherit) ? d.inherit : d.inherit ? [d.inherit] : []; save.inherit = raw.filter(x => x && typeof x === 'object' && typeof x.id === 'string').slice(0, 2).map(x => ({ id: x.id, lv: Math.max(1, Math.min(5, x.lv | 0)), evo: !!x.evo, from: x.from | 0 })); }
      save.settings.diff = [0, 1, 2, 3].includes(save.settings.diff) ? save.settings.diff : 1;
      save.cleared = clamp(Math.floor(+save.cleared || 0), 0, 40);
      save.gold = Math.max(0, Math.floor(+save.gold || 0));
      for (const k in save.up) save.up[k] = Math.max(0, Math.floor(+save.up[k] || 0));
      return;
    } catch (e) { /* 손상된 데이터 → 백업 시도 */ }
  }
}
function writeSave() {
  try { const s = JSON.stringify(save); localStorage.setItem(SAVE_KEY, s); localStorage.setItem(SAVE_KEY + '_bak', s); } catch (e) { }
}
loadSave();

/* ------------------------- 오디오 (Web Audio, 외부 파일 없음) ------------------------- */
const AU = {
  ctx: null, want: null, wantVar: null, trackName: null, track: null, step: 0, nextT: 0, last: {}, tr: 0, bpmMul: 1, switching: false,
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume().catch(() => { }); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.comp = c.createDynamicsCompressor(); this.comp.connect(c.destination);
    this.master = c.createGain(); this.master.connect(this.comp);
    this.fade = c.createGain(); this.fade.connect(this.master); this.fade.gain.value = 1;
    this.mg = c.createGain(); this.mg.connect(this.fade);
    this.sg = c.createGain(); this.sg.connect(this.master);
    const len = c.sampleRate; const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) { }
    if (c.state !== 'running') c.resume().catch(() => { });
    this.applyVol();
    setInterval(() => this.sched(), 40);
    if (this.want) { const w = this.want, v = this.wantVar; this.want = null; this.bgm(w, v); }
  },
  applyVol() { if (!this.ctx) return; this.mg.gain.value = save.settings.music * 0.3; this.sg.gain.value = save.settings.sfx * 0.5; },
  // 페이드 아웃 → 곡 교체 → 페이드 인
  bgm(name, variant) {
    const key = name + '|' + (variant ? variant.tr + ',' + variant.bpm : '');
    this.want = name; this.wantVar = variant || null;
    if (!this.ctx) return;
    if (this.trackName === key) return;
    this.trackName = key;
    const c = this.ctx, now = c.currentTime, f = this.fade.gain;
    const apply = () => {
      this.track = TRACKS[name] || null; this.step = 0; this.tr = variant ? variant.tr : 0; this.bpmMul = variant ? variant.bpm : 1;
      this.nextT = c.currentTime + 0.05;
      f.cancelScheduledValues(c.currentTime); f.setValueAtTime(0.0001, c.currentTime); f.exponentialRampToValueAtTime(1, c.currentTime + 1.2);
    };
    if (this.track) {
      f.cancelScheduledValues(now); f.setValueAtTime(Math.max(0.0001, f.value), now); f.exponentialRampToValueAtTime(0.0001, now + 0.6);
      clearTimeout(this.swT); this.track = null; this.swT = setTimeout(apply, 620);
    } else apply();
  },
  tone(freq, t, dur, type, vol, dest, f2) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sg); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(t, dur, vol, ftype, f1, f2, dest, q) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = ftype; f.frequency.setValueAtTime(f1, t); if (q) f.Q.value = q;
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sg); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  midi(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  sched() {
    const c = this.ctx; if (!c || !this.track || c.state !== 'running') return;
    const tr = this.track, sd = 60 / (tr.bpm * this.bpmMul) / 4;
    if (this.nextT < c.currentTime - 0.3) this.nextT = c.currentTime + 0.05;
    while (this.nextT < c.currentTime + 0.2) {
      this.playStep(tr, this.step, this.nextT, sd);
      this.nextT += sd; this.step++;
      if (this.step >= tr.len) { if (tr.loop) this.step = 0; else { this.track = null; break; } }
    }
  },
  playStep(tr, i, t, sd) {
    const bar = Math.floor(i / 16), s = i % 16, ch = tr.prog[bar % tr.prog.length], mg = this.mg, root = tr.root + this.tr;
    const bp = tr.bass[s]; if (bp === 'x') this.tone(this.midi(root - 12 + ch[0]), t, sd * (tr.bassLen || 1.7), tr.bassWave, tr.bassVol || 0.45, mg);
    else if (bp === 'o') this.tone(this.midi(root + ch[0]), t, sd * 1.2, tr.bassWave, (tr.bassVol || 0.45) * 0.7, mg);
    const lp = tr.lead[bar % tr.lead.length], lc = lp[s];
    if (lc && lc !== '.') {
      const idx = +lc; const n = idx < ch.length ? ch[idx] : ch[idx % ch.length] + 12 * Math.floor(idx / ch.length);
      this.tone(this.midi(root + 12 + n), t, sd * (tr.leadLen || 1.6), tr.leadWave, tr.leadVol || 0.14, mg);
    }
    if (tr.kick && tr.kick[s] === 'x') this.tone(150, t, 0.16, 'sine', 0.8, mg, 40);
    if (tr.snare && tr.snare[s] === 'x') { this.noise(t, 0.14, 0.32, 'bandpass', 1800, 900, mg, 0.7); this.tone(190, t, 0.08, 'triangle', 0.22, mg, 120); }
    if (tr.tom && tr.tom[s] === 'x') this.tone(110 + (s % 4) * 18, t, 0.2, 'sine', 0.5, mg, 60);
    if (tr.hat && tr.hat[s] === 'x') this.noise(t, 0.035, 0.11, 'highpass', 7500, 0, mg);
    if (tr.clap && tr.clap[s] === 'x') this.noise(t, 0.09, 0.25, 'bandpass', 1200, 0, mg, 1.5);
    if (tr.pad && s === 0) for (const n of ch) this.tone(this.midi(root + n), t, sd * 15, tr.padWave || 'triangle', 0.045, mg);
    if (tr.bell && tr.bell[s] === 'x') this.tone(this.midi(root + 24 + ch[(bar + s) % ch.length]), t, sd * 6, 'sine', 0.09, mg);
  },
  sfx(name, pitch) {
    const c = this.ctx; if (!c || c.state !== 'running' || save.settings.sfx <= 0) return;
    const now = c.currentTime, gap = SFX_GAP[name] || 0.04;
    if (this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    const f = SFX[name]; if (f) f(this, now, pitch || 1);
  }
};
const SFX_GAP = { crit: 0.06, hitE: 0.05, hitH: 0.06, legend: 0.5, hit: 0.045, gem: 0.03, die: 0.04, coin: 0.05, smg: 0.06, mini: 0.05, rifle: 0.07, hmg: 0.07, flame: 0.12, beam: 0.14, cone: 0.12, drone: 0.12, turret: 0.12, boom: 0.06, zap: 0.08, laser: 0.07 };
const SFX = {
  // ---- 무기 발사음 (무기마다 종류+음높이로 구분) ----
  rifle: (a, t, p) => { a.noise(t, 0.07, 0.35, 'bandpass', 2200 * p, 700, null, 0.9); a.tone(320 * p, t, 0.05, 'square', 0.08, null, 90); },
  smg: (a, t, p) => { a.noise(t, 0.045, 0.25, 'highpass', 1800 * p, 0); a.tone(500 * p, t, 0.03, 'square', 0.05, null, 200); },
  hmg: (a, t, p) => { a.noise(t, 0.1, 0.45, 'lowpass', 1600 * p, 300); a.tone(140 * p, t, 0.09, 'square', 0.12, null, 50); },
  mini: (a, t, p) => { a.noise(t, 0.035, 0.22, 'bandpass', 3000 * p, 1500, null, 1.2); },
  gl: (a, t, p) => { a.tone(180 * p, t, 0.12, 'sine', 0.35, null, 70); a.noise(t, 0.08, 0.25, 'lowpass', 900, 200); },
  rocket: (a, t, p) => { a.noise(t, 0.35, 0.35, 'bandpass', 600 * p, 2500, null, 1.5); a.tone(120 * p, t, 0.2, 'sawtooth', 0.08, null, 260); },
  cannon: (a, t, p) => { a.noise(t, 0.45, 0.7, 'lowpass', 700 * p, 80); a.tone(70 * p, t, 0.4, 'sine', 0.6, null, 28); },
  mortar: (a, t, p) => { a.tone(240 * p, t, 0.18, 'triangle', 0.3, null, 90); a.noise(t, 0.15, 0.3, 'lowpass', 600, 100); },
  rail: (a, t, p) => { a.tone(2400 * p, t, 0.25, 'sawtooth', 0.12, null, 120); a.noise(t, 0.2, 0.3, 'highpass', 2000, 0); a.tone(60, t, 0.3, 'sine', 0.4, null, 30); },
  laser: (a, t, p) => { a.tone(1500 * p, t, 0.12, 'square', 0.08, null, 300 * p); },
  beam: (a, t, p) => { a.tone(220 * p, t, 0.16, 'sawtooth', 0.06, null, 240 * p); a.tone(660 * p, t, 0.16, 'sine', 0.05); },
  plasma: (a, t, p) => { a.tone(400 * p, t, 0.22, 'sine', 0.22, null, 1400 * p); a.tone(200 * p, t, 0.2, 'triangle', 0.12, null, 600); },
  zap: (a, t, p) => { a.tone(1400 * p, t, 0.12, 'sawtooth', 0.11, null, 180); a.tone(900 * p, t + 0.03, 0.1, 'square', 0.07, null, 2000); a.noise(t, 0.12, 0.18, 'highpass', 4000, 0); },
  flame: (a, t, p) => { a.noise(t, 0.2, 0.28, 'lowpass', 1200 * p, 500); },
  freeze: (a, t, p) => { a.noise(t, 0.2, 0.2, 'highpass', 5000 * p, 0); a.tone(1800 * p, t, 0.15, 'sine', 0.05, null, 2600); },
  gas: (a, t, p) => { a.noise(t, 0.4, 0.2, 'bandpass', 900 * p, 400, null, 0.6); },
  acid: (a, t, p) => { a.tone(300 * p, t, 0.12, 'sine', 0.2, null, 900); a.noise(t, 0.1, 0.15, 'bandpass', 2000, 0); },
  missile: (a, t, p) => { a.noise(t, 0.25, 0.25, 'bandpass', 1200 * p, 4000, null, 2); },
  drone: (a, t, p) => { a.tone(900 * p, t, 0.04, 'square', 0.05, null, 400); },
  turret: (a, t, p) => { a.tone(700 * p, t, 0.05, 'square', 0.06, null, 300); a.noise(t, 0.04, 0.12, 'highpass', 2500, 0); },
  mine: (a, t, p) => { a.tone(600 * p, t, 0.06, 'triangle', 0.15, null, 900); },
  orbital: (a, t, p) => { a.tone(3000 * p, t, 0.6, 'sine', 0.1, null, 200); a.noise(t + 0.4, 0.8, 0.6, 'lowpass', 1500, 60); },
  quantum: (a, t, p) => { a.tone(800 * p, t, 0.15, 'square', 0.1, null, 1600); a.tone(1200 * p, t + 0.05, 0.15, 'square', 0.08, null, 400); },
  hole: (a, t, p) => { a.tone(90 * p, t, 1.2, 'sawtooth', 0.15, null, 30); a.noise(t, 1.0, 0.2, 'lowpass', 300, 60); },
  ion: (a, t, p) => { a.tone(150 * p, t, 0.8, 'sawtooth', 0.1, null, 900); a.noise(t, 0.6, 0.2, 'bandpass', 1500, 3000, null, 3); },
  doom: (a, t, p) => { a.noise(t, 1.0, 0.9, 'lowpass', 1500, 40); a.tone(55, t, 0.9, 'sawtooth', 0.4, null, 25); a.tone(110, t, 0.5, 'square', 0.15, null, 40); },
  // ---- 공통 효과음 ----
  boom: (a, t) => { a.noise(t, 0.4, 0.55, 'lowpass', 900, 120); a.tone(90, t, 0.3, 'sine', 0.45, null, 30); },
  bigboom: (a, t) => { a.noise(t, 0.8, 0.8, 'lowpass', 1200, 50); a.tone(60, t, 0.7, 'sine', 0.6, null, 25); },
  hit: (a, t) => a.tone(260, t, 0.05, 'square', 0.06, null, 120),
  hitE: (a, t) => a.tone(1200, t, 0.05, 'sine', 0.05, null, 600),
  hitH: (a, t) => { a.tone(140, t, 0.08, 'sine', 0.12, null, 60); a.noise(t, 0.05, 0.08, 'lowpass', 900, 200); },
  crit: (a, t) => { a.tone(1800, t, 0.08, 'square', 0.07, null, 2600); a.noise(t, 0.06, 0.12, 'highpass', 5000, 0); },
  legend: (a, t) => { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => a.tone(f, t + i * 0.07, 0.4, 'triangle', 0.14)); a.tone(2093, t + 0.5, 0.8, 'sine', 0.08); },
  clank: (a, t) => { a.tone(900, t, 0.06, 'square', 0.07, null, 500); a.tone(1300, t, 0.05, 'triangle', 0.05); },
  die: (a, t) => { a.tone(480, t, 0.12, 'triangle', 0.13, null, 90); a.noise(t, 0.08, 0.1, 'bandpass', 1200, 400); },
  gem: (a, t) => a.tone(1300 + Math.random() * 400, t, 0.06, 'sine', 0.08, null, 2200),
  coin: (a, t) => { a.tone(1320, t, 0.06, 'square', 0.05); a.tone(1760, t + 0.06, 0.12, 'square', 0.05); },
  item: (a, t) => { a.tone(880, t, 0.08, 'triangle', 0.15); a.tone(1320, t + 0.07, 0.15, 'triangle', 0.15); },
  levelup: (a, t) => { [523, 659, 784, 1047].forEach((f, i) => a.tone(f, t + i * 0.07, 0.22, 'triangle', 0.25)); },
  quest: (a, t) => { [659, 784, 988, 1319].forEach((f, i) => a.tone(f, t + i * 0.09, 0.3, 'square', 0.12)); },
  evolve: (a, t) => { [392, 494, 587, 784, 988, 1175, 1568].forEach((f, i) => a.tone(f, t + i * 0.06, 0.35, 'sawtooth', 0.08)); },
  hurt: (a, t) => { a.tone(220, t, 0.18, 'sawtooth', 0.2, null, 70); a.noise(t, 0.1, 0.22, 'lowpass', 800, 200); },
  heal: (a, t) => { a.tone(600, t, 0.25, 'sine', 0.2, null, 1200); a.tone(900, t + 0.08, 0.25, 'sine', 0.15, null, 1600); },
  chest: (a, t) => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => a.tone(f, t + i * 0.06, 0.25, 'square', 0.08)); },
  button: (a, t) => a.tone(880, t, 0.05, 'sine', 0.15, null, 1200),
  spin: (a, t) => { a.noise(t, 0.4, 0.45, 'bandpass', 400, 4000, null, 2); a.tone(300, t, 0.35, 'sawtooth', 0.06, null, 900); },
  dash: (a, t) => a.noise(t, 0.18, 0.35, 'highpass', 800, 5000),
  bosswarn: (a, t) => { for (let i = 0; i < 4; i++) { a.tone(440, t + i * 0.4, 0.2, 'square', 0.16, null, 660); a.tone(660, t + i * 0.4 + 0.2, 0.2, 'square', 0.16, null, 440); } },
  bossdie: (a, t) => { a.noise(t, 1.2, 0.8, 'lowpass', 1200, 60); a.tone(200, t, 1.0, 'sawtooth', 0.25, null, 30); },
  slam: (a, t) => { a.noise(t, 0.35, 0.5, 'lowpass', 600, 80); a.tone(70, t, 0.3, 'sine', 0.5, null, 30); },
  eshot: (a, t) => a.tone(500, t, 0.1, 'square', 0.05, null, 250),
  elaser: (a, t) => { a.tone(300, t, 0.5, 'sawtooth', 0.12, null, 80); a.noise(t, 0.4, 0.2, 'bandpass', 2500, 800, null, 2); },
  rage: (a, t) => { a.tone(110, t, 0.8, 'sawtooth', 0.3, null, 55); a.noise(t, 0.6, 0.3, 'lowpass', 500, 100); },
  power: (a, t) => { [523, 784, 1047, 1568].forEach((f, i) => a.tone(f, t + i * 0.05, 0.3, 'sawtooth', 0.08)); },
  alarm: (a, t) => { a.tone(880, t, 0.15, 'square', 0.12); a.tone(660, t + 0.18, 0.15, 'square', 0.12); },
  portal: (a, t) => { a.tone(200, t, 0.5, 'sine', 0.2, null, 800); }
};

/* ------------------------- 배경음악: 테마 18종 + 스테이지별 변주 ------------------------- */
function mkTrack(o) { return Object.assign({ len: o.prog.length * 16, loop: true, bassWave: 'triangle', leadWave: 'square' }, o); }
const TRACKS = {
  title: mkTrack({ bpm: 84, root: 57, prog: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], bass: 'x.......x.......', pad: 1,
    lead: ['0...1...2...4...', '2...1...0...1...', '0...2...4...5...', '4...2...1.......'], leadWave: 'triangle', leadVol: 0.12, leadLen: 3, hat: '....x.......x...' }),
  menu: mkTrack({ bpm: 96, root: 55, prog: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], bass: 'x.....x.x.......', pad: 1,
    lead: ['0.2.4...2.......', '4.2.0...........'], leadWave: 'triangle', leadVol: 0.1, leadLen: 2.5, hat: '..x...x...x...x.' }),
  // 폐허 도시: 긴장감 있는 전자음악
  city: mkTrack({ bpm: 124, root: 50, prog: [[0, 3, 7], [0, 3, 7], [-2, 2, 5], [-4, 0, 3]], bass: 'x..xx..xx..xx.x.', bassWave: 'sawtooth', bassVol: 0.32,
    lead: ['0..2..4..2..1...', '................', '4..2..1..0..1...', '0...........2...'], leadVol: 0.09, kick: 'x...x...x...x...', hat: '..x...x...x...x.', snare: '....x.......x...' }),
  // 군사기지: 빠른 전투 음악
  military: mkTrack({ bpm: 150, root: 52, prog: [[0, 3, 7], [3, 7, 10], [-2, 2, 5], [0, 3, 7]], bass: 'x.x.x.x.x.x.x.x.',
    lead: ['0.0.2.4.....2.1.', '4.4.5.4.2...1...', '0.0.2.4.....5.4.', '2.1.0...........'], leadVol: 0.1, kick: 'x...x...x...x...', snare: '....x..x....x.x.', hat: 'x.x.x.x.x.x.x.x.' }),
  // 공장: 묵직한 금속성
  factory: mkTrack({ bpm: 118, root: 45, prog: [[0, 3, 6], [0, 3, 6], [1, 4, 8], [0, 3, 6]], bass: 'x...x.x.x...x.x.', bassWave: 'square', bassVol: 0.3,
    lead: ['0.......2.......', '........1...0...'], leadWave: 'sawtooth', leadVol: 0.07, kick: 'x..x..x.x..x..x.', hat: '.xx..xx..xx..xx.', clap: '....x.......x...' }),
  // 연구소: 기묘한 신스
  lab: mkTrack({ bpm: 108, root: 57, prog: [[0, 4, 7], [1, 5, 8], [0, 4, 7], [-1, 3, 6]], bass: 'x...x...x...x...', pad: 1, padWave: 'sine',
    lead: ['0.1.2.1.0.1.2.4.', '2.1.0.1.2.1.0...'], leadWave: 'triangle', leadVol: 0.1, hat: '..x...x...x...x.', bell: 'x.......x.......' }),
  // 지하철/벙커: 어둡고 낮게
  subway: mkTrack({ bpm: 96, root: 48, prog: [[0, 3, 7], [1, 4, 8], [0, 3, 7], [-1, 3, 6]], bass: 'x.......x...x...', bassVol: 0.5,
    lead: ['................', '0.......1.......', '................', '2.......1.......'], leadWave: 'sine', leadVol: 0.12, leadLen: 4, hat: '....x.......x...', kick: 'x.......x.......' }),
  // 감염된 숲: 불길함
  forest: mkTrack({ bpm: 88, root: 45, prog: [[0, 3, 7], [-4, 0, 3], [1, 4, 8], [0, 3, 7]], bass: 'x.......x.......', pad: 1,
    lead: ['0...........1...', '................', '2.......1.......', '0...............'], leadWave: 'triangle', leadVol: 0.12, leadLen: 5, tom: 'x.........x.....' }),
  // 얼음 지역: 차갑고 신비로운
  ice: mkTrack({ bpm: 100, root: 64, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], bass: 'x.......x.......', bassWave: 'sine', pad: 1, padWave: 'sine',
    lead: ['0.2.4.2.3.4.2...', '3.2.1.0.........'], leadWave: 'sine', leadVol: 0.12, leadLen: 3, bell: 'x...x...x...x...', hat: '........x.......' }),
  // 화산: 강렬한 타악기
  volcano: mkTrack({ bpm: 140, root: 41, prog: [[0, 3, 7], [0, 3, 7], [-2, 1, 5], [0, 3, 7]], bass: 'x..x..x.x..x..x.', bassWave: 'sawtooth', bassVol: 0.3,
    lead: ['................', '0..0..1.2.......'], leadVol: 0.08, kick: 'x..x.x..x..x.xx.', tom: '...x..x....x..x.', snare: '....x.......x...' }),
  // 외계: SF 분위기
  alien: mkTrack({ bpm: 112, root: 55, prog: [[0, 4, 8], [2, 6, 10], [0, 4, 8], [-2, 2, 6]], bass: 'x.x...x.x.x...x.', bassWave: 'sine', bassVol: 0.5,
    lead: ['0123012301230123', '3210321032103210'], leadWave: 'sawtooth', leadVol: 0.05, leadLen: 1, kick: 'x.......x.......', hat: '..x...x...x...x.', pad: 1 }),
  // 우주 정거장: 장대한 SF
  space: mkTrack({ bpm: 126, root: 52, prog: [[0, 4, 7], [5, 9, 12], [3, 7, 10], [7, 11, 14]], bass: 'x...x...x...x...',
    lead: ['0.....2.4.......', '4.....2.1.......', '0.....2.4.....5.', '4...............'], leadWave: 'triangle', leadVol: 0.13, leadLen: 2.5, kick: 'x...x...x...x...', hat: '..x...x...x...x.', pad: 1 }),
  // 기계 공장: 테크노
  techno: mkTrack({ bpm: 132, root: 45, prog: [[0, 3, 7], [0, 3, 7], [0, 3, 7], [-2, 2, 5]], bass: '.x.x.x.x.x.x.x.x', bassWave: 'square', bassVol: 0.25,
    lead: ['0...0...3...0.2.', '0...0...4...3...'], leadWave: 'sawtooth', leadVol: 0.08, kick: 'x...x...x...x...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' }),
  // 미래 도시: 사이버펑크
  cyber: mkTrack({ bpm: 120, root: 49, prog: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], bass: 'x.xxx.xxx.xxx.xx', bassWave: 'sawtooth', bassVol: 0.25,
    lead: ['0.1.2.4.2.1.0...', '4.2.4.5.4.2.1...'], leadVol: 0.08, kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.' }),
  // 방사능 황무지
  waste: mkTrack({ bpm: 104, root: 47, prog: [[0, 3, 6], [0, 3, 6], [-1, 3, 6], [1, 4, 7]], bass: 'x.....x...x.....', bassWave: 'sawtooth', bassVol: 0.3, pad: 1,
    lead: ['0.......1.......', '2.......0.......'], leadWave: 'triangle', leadVol: 0.1, leadLen: 4, kick: 'x.......x.......', hat: '....x.......x...' }),
  // 괴생명체 둥지
  hive: mkTrack({ bpm: 92, root: 44, prog: [[0, 1, 5], [0, 1, 5], [-1, 2, 6], [0, 1, 5]], bass: 'x...x.......x...', bassVol: 0.5, pad: 1,
    lead: ['0.1.0...........', '........2.1.0...'], leadWave: 'sawtooth', leadVol: 0.06, tom: 'x..x......x.....' }),
  // 차원 균열
  rift: mkTrack({ bpm: 116, root: 46, prog: [[0, 3, 6], [3, 6, 9], [6, 9, 12], [3, 6, 9]], bass: 'x..x..x...x..x..', bassWave: 'square', bassVol: 0.25,
    lead: ['0.1.2.3.2.1.0...', '3.2.1.0.1.2.3...'], leadWave: 'triangle', leadVol: 0.1, kick: 'x.......x.......', hat: '..x...x...x...x.', bell: 'x...........x...' }),
  // 우주 전쟁터: 웅장한 전투
  epic: mkTrack({ bpm: 138, root: 50, prog: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [3, 7, 10]], bass: 'x.x.x.x.x.x.x.x.', pad: 1,
    lead: ['0...2...4...5...', '4...2...1...0...', '0...2...4...6...', '5...4...2.......'], leadWave: 'triangle', leadVol: 0.14, leadLen: 3, kick: 'x...x...x...x...', snare: '....x.......x.xx', tom: '..............xx' }),
  // 파멸의 요새
  doom: mkTrack({ bpm: 160, root: 40, prog: [[0, 3, 7], [1, 4, 8], [0, 3, 7], [6, 10, 13]], bass: 'xxxxxxxxxxxxxxxx', bassWave: 'sawtooth', bassVol: 0.22,
    lead: ['0..0..1..2..4...', '4..2..1..0..1...'], leadVol: 0.08, leadWave: 'sawtooth', kick: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...' }),
  // 최종 결전
  final: mkTrack({ bpm: 150, root: 50, prog: [[0, 3, 7], [1, 5, 8], [-2, 2, 5], [0, 3, 7], [3, 7, 10], [1, 5, 8], [-1, 2, 6], [-1, 2, 6]], bass: 'x.xxx.xxx.xxx.xx', bassWave: 'sawtooth', bassVol: 0.25, pad: 1,
    lead: ['0...1...2...4...', '4...2...1...0...'], leadWave: 'square', leadVol: 0.1, leadLen: 3, kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }),
  boss: mkTrack({ bpm: 156, root: 50, prog: [[0, 3, 7], [1, 5, 8], [0, 3, 7], [-2, 1, 5]], bass: 'xxxxxxxxxxxxxxxx', bassWave: 'sawtooth', bassVol: 0.3,
    lead: ['0..0..1..2..4...', '4..2..1..0..1...'], leadVol: 0.09, leadWave: 'sawtooth', kick: 'x..x..x.x..x..x.', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.x.' }),
  finalboss: mkTrack({ bpm: 172, root: 47, prog: [[0, 3, 7], [1, 4, 8], [6, 10, 13], [5, 8, 12]], bass: 'xxxxxxxxxxxxxxxx', bassWave: 'sawtooth', bassVol: 0.3, pad: 1,
    lead: ['0.1.2.4.2.1.0.1.', '4.5.4.2.1.2.4...'], leadVol: 0.09, leadWave: 'square', kick: 'x.x.x.x.x.x.x.x.', snare: '....x.......x.xx', tom: '............xxxx' }),
  win: mkTrack({ bpm: 150, root: 60, prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], bass: 'x.......x.......', loop: false,
    lead: ['0.1.2.4.........', '0.1.2.4.........', '0.1.2.4.5.4.....', '4...............'], leadWave: 'triangle', leadVol: 0.2, leadLen: 3, kick: 'x.......x.......' }),
  lose: mkTrack({ bpm: 70, root: 52, prog: [[0, 3, 7], [-1, 2, 7], [-4, 0, 3], [-5, -1, 2]], bass: 'x...............', loop: false,
    lead: ['4...2...', '2...1...', '1...0...', '0...............'], leadWave: 'triangle', leadVol: 0.16, leadLen: 4, pad: 1 })
};
function unlockAudio() { AU.init(); }
['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
