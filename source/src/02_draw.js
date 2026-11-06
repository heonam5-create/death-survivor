/* ------------------------- 화면 / 품질 ------------------------- */
const cv = $('cv'), ctx = cv.getContext('2d', { alpha: false });
let W = 0, H = 0, DPR = 1, S = 1, VW = 400, VH = 700, K = 1;
const SAFE = { t: 0, r: 0, b: 0, l: 0 };
const Q = { level: 2, auto: true, fpsAcc: 0, fpsN: 0 };
function qualityCfg() { const l = Q.level; return { dprCap: l >= 2 ? 2 : l === 1 ? 1.5 : 1, particles: l >= 2 ? 450 : l === 1 ? 230 : 100, glow: l >= 1, weather: l >= 2 ? 60 : l === 1 ? 35 : 15 }; }
let QC = qualityCfg();
function applyQualitySetting() { const q = save.settings.quality; Q.auto = q === 'auto'; Q.level = q === 'low' ? 0 : 2; QC = qualityCfg(); resize(); }
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  if (window.visualViewport) { W = Math.round(window.visualViewport.width); H = Math.round(window.visualViewport.height); }
  DPR = Math.min(window.devicePixelRatio || 1, QC.dprCap);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  S = W <= H ? Math.min(W / 400, H / 640) : H / 700; S = Math.max(0.6, S);
  VW = W / S; VH = H / S; K = S * DPR;
  const cs = getComputedStyle($('safe'));
  SAFE.t = parseFloat(cs.paddingTop) || 0; SAFE.r = parseFloat(cs.paddingRight) || 0; SAFE.b = parseFloat(cs.paddingBottom) || 0; SAFE.l = parseFloat(cs.paddingLeft) || 0;
  SPR.clear(); groundCache.clear();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
document.addEventListener('touchmove', e => { if (!e.target.closest('.panel,.scrollable')) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());

/* ------------------------- 그리기 도우미 ------------------------- */
const OL = '#1d1a2b';
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, TAU); }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fs(g, fill, lw) { g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } }
function shadow(g, r, y = 0.95, w = 0.75) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(0, r * y, r * w, r * 0.24, 0, 0, TAU); g.fill(); }
function eyes(g, x1, y1, x2, y2, r1, col = '#fff', pup = '#111') {
  g.fillStyle = col; circ(g, x1, y1, r1); g.fill(); circ(g, x2, y2, r1); g.fill();
  g.fillStyle = pup; circ(g, x1 + r1 * 0.3, y1, r1 * 0.5); g.fill(); circ(g, x2 + r1 * 0.3, y2, r1 * 0.5); g.fill();
}
function line(g, x1, y1, x2, y2, w, col) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
const pc = (p, k, d) => (p && p[k]) || d;

/* ------------------------- 몬스터 그리기 (색상 팔레트로 변종 표현) ------------------------- */
const DRAW = {
  zombie(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r); g.lineJoin = 'round';
    const skin = pc(p, 'a', '#9ccf6f'), cloth = pc(p, 'b', '#6b8fb3'), pant = pc(p, 'd', '#4b3f63'), eye = pc(p, 'e', '#c62828');
    rr(g, -r * .4, r * .3 + s * r * .1, r * .32, r * .58, r * .1); fs(g, pant, r * .1);
    rr(g, r * .05, r * .3 - s * r * .1, r * .32, r * .58, r * .1); fs(g, pant, r * .1);
    rr(g, -r * .55, -r * .25, r, r * .72, r * .2); fs(g, cloth, r * .1);
    g.fillStyle = skin; g.beginPath(); g.moveTo(-r * .3, r * .47); g.lineTo(-r * .12, r * .15); g.lineTo(r * .05, r * .47); g.fill();
    rr(g, r * .05, -r * .12 + s * r * .06, r * .9, r * .24, r * .11); fs(g, skin, r * .09);
    rr(g, -r * .05, r * .1 - s * r * .06, r * .85, r * .24, r * .11); fs(g, skin, r * .09);
    circ(g, r * .02, -r * .62, r * .5); fs(g, skin, r * .1);
    g.fillStyle = 'rgba(0,0,0,.18)'; circ(g, -r * .2, -r * .8, r * .1); g.fill();
    eyes(g, r * .15, -r * .7, r * .38, -r * .62, r * .13, '#fff', eye);
    line(g, r * .08, -r * .38, r * .36, -r * .4, r * .07, OL);
    if (p && p.glow) { g.fillStyle = p.glow; g.globalAlpha = .35; circ(g, 0, 0, r * 1.1); g.fill(); g.globalAlpha = 1; }
  },
  runner(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r); g.lineCap = 'round';
    const skin = pc(p, 'a', '#b0bec5'), cloth = pc(p, 'b', '#8e2b2b'), eye = pc(p, 'e', '#ffeb3b');
    line(g, -r * .1, r * .2, -r * .5 + s * r * .4, r * .95, r * .26, OL); line(g, -r * .1, r * .2, -r * .5 + s * r * .4, r * .95, r * .14, skin);
    line(g, r * .1, r * .2, r * .45 - s * r * .4, r * .95, r * .26, OL); line(g, r * .1, r * .2, r * .45 - s * r * .4, r * .95, r * .14, skin);
    g.save(); g.rotate(.35); rr(g, -r * .35, -r * .5, r * .7, r * .8, r * .2); fs(g, cloth, r * .1); g.restore();
    line(g, r * .2, -r * .25, r * 1.0, -r * .1 - s * r * .2, r * .22, OL); line(g, r * .2, -r * .25, r * 1.0, -r * .1 - s * r * .2, r * .11, skin);
    circ(g, r * .45, -r * .62, r * .36); fs(g, skin, r * .1);
    g.fillStyle = eye; circ(g, r * .58, -r * .66, r * .09); g.fill(); circ(g, r * .74, -r * .62, r * .07); g.fill();
    g.fillStyle = '#300'; rr(g, r * .5, -r * .48, r * .3, r * .1, r * .04); g.fill();
  },
  spitter(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); DRAW.zombie(g, r, f, Object.assign({ a: '#a5d66f', b: '#5d6b3a' }, p));
    g.fillStyle = pc(p, 's', '#c6ff00'); circ(g, r * .25, -r * .2, r * (.32 + s * .04)); g.fill(); g.lineWidth = r * .07; g.strokeStyle = OL; g.stroke();
    g.fillStyle = pc(p, 's', '#c6ff00'); circ(g, r * .5, -r * .3 + s * r * .2, r * .07); g.fill();
  },
  bloater(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .95, .9);
    const body = pc(p, 'a', '#9e9d24'), boil = pc(p, 'b', '#f06292');
    rr(g, -r * .45, r * .5, r * .3, r * .38, r * .1); fs(g, '#4b3f63', r * .08); rr(g, r * .15, r * .5, r * .3, r * .38, r * .1); fs(g, '#4b3f63', r * .08);
    g.beginPath(); g.ellipse(0, r * .05, r * (.85 + s * .04), r * (.72 - s * .03), 0, 0, TAU); fs(g, body, r * .1);
    g.fillStyle = boil; for (const [x, y, z] of [[-.4, -.1, .14], [.3, .25, .12], [.1, -.35, .1], [-.15, .4, .09]]) { circ(g, r * x, r * y, r * z); g.fill(); }
    circ(g, r * .1, -r * .78, r * .28); fs(g, pc(p, 'c', '#c5e1a5'), r * .08);
    g.fillStyle = '#d50000'; circ(g, r * .2, -r * .82, r * .06); g.fill();
  },
  brute(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .95, .95); g.lineJoin = 'round';
    const skin = pc(p, 'a', '#8d6e63'), plate = pc(p, 'b', '#607d8b'), eye = pc(p, 'e', '#ff5252');
    rr(g, -r * .5, r * .35 + s * r * .06, r * .38, r * .55, r * .12); fs(g, '#3e2723', r * .08); rr(g, r * .1, r * .35 - s * r * .06, r * .38, r * .55, r * .12); fs(g, '#3e2723', r * .08);
    rr(g, -r * .75, -r * .45, r * 1.5, r * .95, r * .3); fs(g, skin, r * .09);
    rr(g, -r * .55, -r * .35, r * 1.1, r * .45, r * .1); fs(g, plate, r * .07);
    g.fillStyle = 'rgba(255,255,255,.3)'; for (const x of [-.4, 0, .4]) { circ(g, r * x, -r * .12, r * .05); g.fill(); }
    circ(g, -r * .85, r * .05 - s * r * .05, r * .32); fs(g, skin, r * .08); circ(g, r * .9, r * .05 + s * r * .05, r * .35); fs(g, skin, r * .08);
    rr(g, -r * .22, -r * .82, r * .5, r * .42, r * .12); fs(g, skin, r * .08);
    g.fillStyle = eye; circ(g, r * .02, -r * .64, r * .06); g.fill(); circ(g, r * .18, -r * .64, r * .06); g.fill();
  },
  rat(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .7, .9);
    const fur = pc(p, 'a', '#8d8d8d');
    g.strokeStyle = '#f48fb1'; g.lineWidth = r * .1; g.beginPath(); g.moveTo(-r * .8, r * .1); g.quadraticCurveTo(-r * 1.3, -r * .3 + s * r * .2, -r * 1.5, r * .2); g.stroke();
    for (const [x, ph] of [[-.4, s], [.3, -s]]) { rr(g, r * x - r * .1, r * .25 + ph * r * .08, r * .18, r * .3, r * .06); fs(g, '#5d4037', r * .06); }
    g.beginPath(); g.ellipse(-r * .1, 0, r * .8, r * .45, 0, 0, TAU); fs(g, fur, r * .1);
    g.beginPath(); g.moveTo(r * .5, -r * .3); g.lineTo(r * 1.15, r * .05); g.lineTo(r * .5, r * .25); g.closePath(); fs(g, fur, r * .08);
    circ(g, r * .45, -r * .4, r * .2); fs(g, '#f8bbd0', r * .06);
    g.fillStyle = pc(p, 'e', '#ff1744'); circ(g, r * .75, -r * .08, r * .07); g.fill(); g.fillStyle = '#000'; circ(g, r * 1.13, r * .05, r * .06); g.fill();
  },
  bat(g, r, f, p) {
    const fl = [1, .4, -.5, .4][f]; shadow(g, r, 1.6, .6); g.lineJoin = 'round'; const wc = pc(p, 'a', '#6a3d9a'), bc = pc(p, 'b', '#4a2470');
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, -r * .1); g.lineTo(sd * r * 1.3, -r * .6 * fl - r * .2); g.lineTo(sd * r * 1.05, r * .1 - r * .2 * fl); g.lineTo(sd * r * .7, -r * .05); g.lineTo(sd * r * .5, r * .25); g.closePath(); fs(g, wc, r * .1); }
    circ(g, 0, 0, r * .55); fs(g, bc, r * .1);
    g.fillStyle = pc(p, 'e', '#ffeb3b'); circ(g, -r * .18, -r * .08, r * .13); g.fill(); circ(g, r * .2, -r * .08, r * .13); g.fill();
  },
  slime(g, r, f, p) {
    const sq = [0, .08, 0, -.08][f]; shadow(g, r, .9, .85); const w = r * (1 + sq), h = r * (1 - sq);
    g.beginPath(); g.moveTo(-w, r * .7); g.quadraticCurveTo(-w * 1.05, -h * .9, 0, -h * 1.05); g.quadraticCurveTo(w * 1.05, -h * .9, w, r * .7); g.quadraticCurveTo(0, r * .95, -w, r * .7); g.closePath(); fs(g, pc(p, 'a', '#4dd0e1'), r * .11);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-w * .4, -h * .45, r * .2, r * .12, -.6, 0, TAU); g.fill();
    eyes(g, -r * .05, -r * .1, r * .38, -r * .1, r * .17, '#fff', pc(p, 'e', '#1a237e'));
    if (p && p.core) { g.fillStyle = p.core; circ(g, -r * .1, r * .35, r * .14); g.fill(); }
  },
  wolf(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .85, .95); g.lineJoin = 'round'; const fur = pc(p, 'a', '#8a8a9e'), dk = pc(p, 'b', '#6c6c80');
    for (const [lx, ph] of [[-r * .55, s], [-r * .25, -s], [r * .25, -s], [r * .5, s]]) { rr(g, lx - r * .1, r * .2 + ph * r * .08, r * .2, r * .5, r * .08); fs(g, dk, r * .08); }
    g.beginPath(); g.moveTo(-r * .85, -r * .1); g.quadraticCurveTo(-r * 1.4, -r * .5 + s * r * .2, -r * 1.25, -r * .75); g.quadraticCurveTo(-r * 1.1, -r * .3, -r * .75, r * .1); fs(g, dk, r * .08);
    g.beginPath(); g.ellipse(-r * .1, 0, r * .85, r * .45, 0, 0, TAU); fs(g, fur, r * .1);
    if (p && p.c) { g.fillStyle = p.c; g.beginPath(); g.ellipse(-r * .2, -r * .15, r * .5, r * .12, 0, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(r * .45, -r * .55); g.lineTo(r * .55, -r * 1.05); g.lineTo(r * .75, -r * .6); fs(g, dk, r * .08);
    circ(g, r * .7, -r * .3, r * .42); fs(g, fur, r * .1);
    g.beginPath(); g.moveTo(r * .9, -r * .45); g.lineTo(r * 1.35, -r * .25); g.lineTo(r * .95, -r * .05); fs(g, fur, r * .08);
    g.fillStyle = pc(p, 'e', '#ffca28'); circ(g, r * .82, -r * .42, r * .1); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(r * 1.0, -r * .08); g.lineTo(r * 1.05, r * .05); g.lineTo(r * 1.12, -r * .1); g.fill();
  },
  spider(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .8, .9);
    g.strokeStyle = pc(p, 'd', '#2b1b3a'); g.lineWidth = r * .14; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const a = (-.9 + i * .55), ph = (i % 2 ? s : -s) * .25; g.beginPath(); g.moveTo(0, 0); const kx = Math.cos(a + ph) * r * .9 * sd, ky = Math.sin(a + ph) * r * .6; g.lineTo(kx, ky - r * .35); g.lineTo(kx * 1.35, ky + r * .3); g.stroke(); }
    circ(g, -r * .3, r * .05, r * .6); fs(g, pc(p, 'a', '#5b2a6e'), r * .1);
    g.fillStyle = pc(p, 'b', '#e53935'); g.beginPath(); g.moveTo(-r * .3, -r * .25); g.lineTo(-r * .15, r * .05); g.lineTo(-r * .3, r * .35); g.lineTo(-r * .45, r * .05); g.fill();
    circ(g, r * .35, -r * .05, r * .38); fs(g, pc(p, 'c', '#3e1d4d'), r * .1);
    g.fillStyle = pc(p, 'e', '#ff1744'); for (const [x, y] of [[.42, -.18], [.58, -.12], [.45, 0], [.6, .05]]) { circ(g, r * x, r * y, r * .07); g.fill(); }
  },
  ghost(g, r, f, p) {
    const w = [0, .1, 0, -.1][f]; g.globalAlpha = .9;
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, r * 1.2, r * .6, r * .18, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-r * .75, r * .6); g.lineTo(-r * .75, -r * .2); g.arc(0, -r * .2, r * .75, Math.PI, 0); g.lineTo(r * .75, r * .6);
    for (let i = 0; i < 4; i++) { const x0 = r * .75 - i * r * .375; g.quadraticCurveTo(x0 - r * .19, r * (.95 + (i % 2 ? w : -w)), x0 - r * .375, r * .6); }
    g.closePath(); fs(g, pc(p, 'a', '#e3f2fd'), r * .1);
    g.fillStyle = pc(p, 'e', '#263238'); g.beginPath(); g.ellipse(-r * .05, -r * .25, r * .13, r * .2, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(r * .35, -r * .25, r * .13, r * .2, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(r * .15, r * .1, r * .12, r * .16, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
  },
  bomber(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .95, .8);
    rr(g, -r * .45, r * .55 + s * r * .08, r * .3, r * .3, r * .1); fs(g, pc(p, 'b', '#ff7043'), r * .08); rr(g, r * .15, r * .55 - s * r * .08, r * .3, r * .3, r * .1); fs(g, pc(p, 'b', '#ff7043'), r * .08);
    circ(g, 0, 0, r * .78); fs(g, pc(p, 'a', '#37344a'), r * .11);
    g.fillStyle = 'rgba(255,255,255,.3)'; circ(g, -r * .3, -r * .3, r * .2); g.fill();
    rr(g, -r * .14, -r * 1.0, r * .28, r * .25, r * .05); fs(g, '#8d8a99', r * .07);
    g.strokeStyle = '#a1887f'; g.lineWidth = r * .08; g.beginPath(); g.moveTo(0, -r * 1.0); g.quadraticCurveTo(r * .3, -r * 1.3, r * .2, -r * 1.45); g.stroke();
    g.fillStyle = f % 2 ? '#ffeb3b' : '#ff9800'; circ(g, r * .2, -r * 1.48, r * .16); g.fill();
    g.fillStyle = pc(p, 'e', '#ff1744'); g.beginPath(); g.moveTo(-r * .35, -r * .25); g.lineTo(0, -r * .1); g.lineTo(-r * .35, -r * .02); g.fill(); g.beginPath(); g.moveTo(r * .45, -r * .25); g.lineTo(r * .1, -r * .1); g.lineTo(r * .45, -r * .02); g.fill();
  },
  golem(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .95, .95); g.lineJoin = 'round';
    const a = pc(p, 'a', '#90a4ae'), b = pc(p, 'b', '#607d8b'), e = pc(p, 'e', '#4fc3f7');
    rr(g, -r * .55, r * .35 + s * r * .06, r * .42, r * .55, r * .12); fs(g, b, r * .08); rr(g, r * .13, r * .35 - s * r * .06, r * .42, r * .55, r * .12); fs(g, b, r * .08);
    rr(g, -r * .7, -r * .55, r * 1.4, r * 1.0, r * .25); fs(g, a, r * .09);
    g.strokeStyle = e; g.lineWidth = r * .07; g.globalAlpha = .8; g.beginPath(); g.moveTo(-r * .3, -r * .4); g.lineTo(-r * .1, -r * .1); g.lineTo(-r * .3, r * .2); g.moveTo(r * .35, -r * .3); g.lineTo(r * .2, 0); g.stroke(); g.globalAlpha = 1;
    rr(g, -r * 1.05, -r * .35 + s * r * .08, r * .4, r * .75, r * .15); fs(g, a, r * .08); rr(g, r * .65, -r * .35 - s * r * .08, r * .4, r * .75, r * .15); fs(g, a, r * .08);
    rr(g, -r * .3, -r * .95, r * .6, r * .45, r * .12); fs(g, a, r * .08);
    if (p && p.fur) { g.fillStyle = p.fur; for (let i = 0; i < 7; i++) { circ(g, -r * .6 + i * r * .2, -r * .55, r * .12); g.fill(); } }
    g.fillStyle = e; circ(g, -r * .1, -r * .74, r * .07); g.fill(); circ(g, r * .14, -r * .74, r * .07); g.fill();
  },
  imp(g, r, f, p) {
    const fl = [1, .5, -.3, .5][f]; shadow(g, r, 1.4, .55); g.lineJoin = 'round'; const body = pc(p, 'a', '#e53935');
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * r * .2, -r * .1); g.lineTo(sd * r * 1.1, -r * .55 * fl - r * .2); g.lineTo(sd * r * .8, r * .2); g.closePath(); fs(g, pc(p, 'b', '#7f0000'), r * .08); }
    circ(g, 0, 0, r * .55); fs(g, body, r * .1);
    g.beginPath(); g.moveTo(-r * .3, -r * .4); g.lineTo(-r * .45, -r * .85); g.lineTo(-r * .1, -r * .5); g.moveTo(r * .3, -r * .4); g.lineTo(r * .45, -r * .85); g.lineTo(r * .1, -r * .5); fs(g, '#fff3e0', r * .06);
    g.fillStyle = pc(p, 'f', '#ffca28'); g.beginPath(); g.moveTo(-r * .2, -r * .55); g.quadraticCurveTo(0, -r * (1.25 + fl * .1), r * .2, -r * .55); g.fill();
    g.fillStyle = '#ffeb3b'; circ(g, -r * .15, -r * .05, r * .1); g.fill(); circ(g, r * .2, -r * .05, r * .1); g.fill();
    g.strokeStyle = OL; g.lineWidth = r * .06; g.beginPath(); g.arc(r * .05, r * .15, r * .15, .3, Math.PI - .3); g.stroke();
  },
  alien(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r); g.lineCap = 'round';
    const skin = pc(p, 'a', '#9ccc65'), suit = pc(p, 'b', '#455a64'), eye = pc(p, 'e', '#111');
    line(g, -r * .15, r * .3, -r * .25 + s * r * .15, r * .95, r * .2, OL); line(g, r * .15, r * .3, r * .25 - s * r * .15, r * .95, r * .2, OL);
    rr(g, -r * .38, -r * .2, r * .76, r * .62, r * .18); fs(g, suit, r * .08);
    g.fillStyle = pc(p, 'c', '#00e5ff'); circ(g, 0, r * .05, r * .1); g.fill();
    line(g, r * .3, -r * .05, r * .8, r * .1, r * .16, skin); if (p && p.gun) { rr(g, r * .65, -r * .05, r * .5, r * .16, r * .05); fs(g, p.gun, r * .05); }
    g.beginPath(); g.ellipse(r * .05, -r * .7, r * .5, r * .55, 0, 0, TAU); fs(g, skin, r * .09);
    g.fillStyle = eye; g.beginPath(); g.ellipse(r * .02, -r * .68, r * .12, r * .2, -.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(r * .32, -r * .68, r * .12, r * .2, .4, 0, TAU); g.fill();
    if (p && p.crown) { g.beginPath(); g.moveTo(-r * .35, -r * 1.1); g.lineTo(-r * .3, -r * 1.45); g.lineTo(-r * .1, -r * 1.25); g.lineTo(r * .05, -r * 1.55); g.lineTo(r * .2, -r * 1.25); g.lineTo(r * .4, -r * 1.45); g.lineTo(r * .45, -r * 1.1); g.closePath(); fs(g, p.crown, r * .05); }
  },
  xeno(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .8, .95); const a = pc(p, 'a', '#6a1b9a'), b = pc(p, 'b', '#ab47bc');
    g.strokeStyle = OL; g.lineWidth = r * .12; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const x = -r * .4 + i * r * .4, ph = (i % 2 ? s : -s) * r * .15; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + ph, sd * r * .6); g.lineTo(x + ph + r * .15, sd * r * .85); g.stroke(); }
    for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-r * .55 + i * r * .42, 0, r * .3, r * .38, 0, 0, TAU); fs(g, i === 1 ? b : a, r * .08); }
    circ(g, r * .55, -r * .05, r * .3); fs(g, b, r * .08);
    g.strokeStyle = pc(p, 'e', '#e1f5fe'); g.lineWidth = r * .08; g.beginPath(); g.moveTo(r * .75, -r * .2); g.lineTo(r * 1.05, -r * .3 + s * r * .08); g.moveTo(r * .75, r * .1); g.lineTo(r * 1.05, r * .2 - s * r * .08); g.stroke();
    g.fillStyle = pc(p, 'e', '#76ff03'); circ(g, r * .62, -r * .14, r * .07); g.fill(); circ(g, r * .62, r * .04, r * .07); g.fill();
  },
  robot(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r); g.lineJoin = 'round';
    const m = pc(p, 'a', '#90a4ae'), dk = pc(p, 'b', '#455a64'), eye = pc(p, 'e', '#ff1744');
    rr(g, -r * .4, r * .35 + s * r * .08, r * .3, r * .55, r * .06); fs(g, dk, r * .08); rr(g, r * .1, r * .35 - s * r * .08, r * .3, r * .55, r * .06); fs(g, dk, r * .08);
    rr(g, -r * .55, -r * .3, r * 1.1, r * .72, r * .1); fs(g, m, r * .09);
    g.fillStyle = dk; g.fillRect(-r * .3, -r * .1, r * .6, r * .1); g.fillStyle = eye; g.fillRect(-r * .25, r * .12, r * .14, r * .12); g.fillStyle = '#ffeb3b'; g.fillRect(r * .05, r * .12, r * .14, r * .12);
    rr(g, r * .4, -r * .2 + s * r * .05, r * .55, r * .2, r * .05); fs(g, dk, r * .06); g.fillStyle = OL; g.fillRect(r * .9, -r * .17 + s * r * .05, r * .2, r * .14);
    rr(g, -r * .35, -r * .9, r * .7, r * .55, r * .12); fs(g, m, r * .08);
    rr(g, -r * .25, -r * .72, r * .55, r * .18, r * .06); fs(g, '#111', 0); g.fillStyle = eye; g.fillRect(-r * .2 + (f % 2) * r * .2, -r * .7, r * .22, r * .12);
    line(g, 0, -r * .9, 0, -r * 1.2, r * .06, OL); g.fillStyle = eye; circ(g, 0, -r * 1.22, r * .08); g.fill();
  },
  drone(g, r, f, p) {
    shadow(g, r, 1.5, .7); const m = pc(p, 'a', '#78909c'), eye = pc(p, 'e', '#ff1744');
    g.strokeStyle = OL; g.lineWidth = r * .14; g.beginPath(); g.moveTo(-r * .8, -r * .8); g.lineTo(r * .8, r * .8); g.moveTo(r * .8, -r * .8); g.lineTo(-r * .8, r * .8); g.stroke();
    for (const [x, y] of [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]]) { g.fillStyle = 'rgba(200,220,255,.35)'; g.beginPath(); g.ellipse(r * x, r * y, r * .42, r * (.12 + (f % 2) * .1), f * .8, 0, TAU); g.fill(); g.fillStyle = OL; circ(g, r * x, r * y, r * .1); g.fill(); }
    circ(g, 0, 0, r * .5); fs(g, m, r * .09);
    circ(g, 0, 0, r * .22); fs(g, '#111', 0); g.fillStyle = eye; circ(g, 0, 0, r * .13); g.fill();
    if (p && p.cross) { g.fillStyle = p.cross; g.fillRect(-r * .06, -r * .45, r * .12, r * .2); }
  },
  tankbot(g, r, f, p) {
    shadow(g, r, .9, 1); const m = pc(p, 'a', '#6d7a5a'), dk = pc(p, 'b', '#3a4230');
    for (const y of [-.6, .35]) { rr(g, -r * .9, r * y, r * 1.8, r * .35, r * .12); fs(g, '#333', r * .07); g.fillStyle = '#666'; for (let i = 0; i < 6; i++) g.fillRect(-r * .8 + ((i * .3 + f * .075) % 1.8) * r, r * (y + .08), r * .1, r * .2); }
    rr(g, -r * .75, -r * .4, r * 1.5, r * .85, r * .15); fs(g, m, r * .08);
    circ(g, -r * .05, 0, r * .4); fs(g, dk, r * .07);
    rr(g, r * .2, -r * .1, r * .9, r * .2, r * .05); fs(g, dk, r * .06);
    g.fillStyle = pc(p, 'e', '#ff3d00'); circ(g, -r * .1, -r * .1, r * .08); g.fill();
  },
  mechspider(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, .8, .9); g.lineJoin = 'miter';
    g.strokeStyle = pc(p, 'b', '#37474f'); g.lineWidth = r * .14;
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const a = -.6 + i * .6, ph = (i % 2 ? s : -s) * .2; const kx = Math.cos(a + ph) * r * .8 * sd, ky = Math.sin(a + ph) * r * .5; g.beginPath(); g.moveTo(0, 0); g.lineTo(kx, ky - r * .5); g.lineTo(kx * 1.4, ky + r * .4); g.stroke(); }
    g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.lineTo(Math.cos(a) * r * .55, Math.sin(a) * r * .45); } g.closePath(); fs(g, pc(p, 'a', '#b0bec5'), r * .09);
    g.fillStyle = pc(p, 'e', '#ff1744'); circ(g, r * .2, -r * .05, r * .14); g.fill(); g.fillStyle = '#fff'; circ(g, r * .24, -r * .09, r * .05); g.fill();
  },
  manta(g, r, f, p) {
    const fl = [0, .15, 0, -.15][f]; shadow(g, r, 1.5, .8); const a = pc(p, 'a', '#5e35b1'), e = pc(p, 'e', '#18ffff');
    g.beginPath(); g.moveTo(r * .9, 0); g.quadraticCurveTo(r * .2, -r * (1.1 + fl), -r * .6, -r * (.9 + fl)); g.quadraticCurveTo(-r * .3, 0, -r * .6, r * (.9 + fl)); g.quadraticCurveTo(r * .2, r * (1.1 + fl), r * .9, 0); fs(g, a, r * .09);
    line(g, -r * .5, 0, -r * 1.3, fl * r * 2, r * .1, a);
    g.fillStyle = e; for (const [x, y] of [[.1, -.45], [.1, .45], [-.2, -.6], [-.2, .6]]) { circ(g, r * x, r * y, r * .07); g.fill(); }
    circ(g, r * .5, 0, r * .14); fs(g, e, r * .05);
  },
  eye(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); shadow(g, r, 1.4, .7); const flesh = pc(p, 'a', '#4a148c'), iris = pc(p, 'e', '#ff1744');
    g.strokeStyle = flesh; g.lineWidth = r * .16; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = Math.PI * .3 + i * Math.PI * .1; g.beginPath(); g.moveTo(Math.cos(a) * r * .6, Math.sin(a) * r * .6); g.quadraticCurveTo(Math.cos(a) * r * 1.0 + s * r * .2 * (i % 2 ? 1 : -1), Math.sin(a) * r * 1.0, Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.3); g.stroke(); }
    circ(g, 0, -r * .1, r * .8); fs(g, pc(p, 'b', '#f3e5f5'), r * .1);
    g.strokeStyle = 'rgba(200,0,0,.5)'; g.lineWidth = r * .04; for (let i = 0; i < 5; i++) { const a = i * 1.3; g.beginPath(); g.moveTo(Math.cos(a) * r * .75, -r * .1 + Math.sin(a) * r * .75); g.lineTo(Math.cos(a + .2) * r * .45, -r * .1 + Math.sin(a + .2) * r * .45); g.stroke(); }
    circ(g, r * .2, -r * .1, r * .38); fs(g, iris, 0); g.fillStyle = '#000'; g.beginPath(); g.ellipse(r * .25, -r * .1, r * .1, r * .26, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; circ(g, r * .05, -r * .3, r * .1); g.fill();
    if (p && p.crown) { g.beginPath(); g.moveTo(-r * .5, -r * .8); g.lineTo(-r * .55, -r * 1.3); g.lineTo(-r * .25, -r * 1.05); g.lineTo(0, -r * 1.45); g.lineTo(r * .25, -r * 1.05); g.lineTo(r * .55, -r * 1.3); g.lineTo(r * .5, -r * .8); g.closePath(); fs(g, p.crown, r * .05); }
  },
  zking(g, r, f, p) {
    const s = Math.sin(f * Math.PI / 2); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-r * .55, -r * .3); g.lineTo(-r * .95, r * .85 + s * r * .05); g.lineTo(r * .3, r * .85 - s * r * .05); g.lineTo(r * .2, -r * .3); fs(g, pc(p, 'c', '#8e1b2e'), r * .07);
    DRAW.zombie(g, r, f, p);
    g.beginPath(); g.moveTo(-r * .38, -r * 1.0); g.lineTo(-r * .42, -r * 1.42); g.lineTo(-r * .18, -r * 1.2); g.lineTo(r * .02, -r * 1.5); g.lineTo(r * .22, -r * 1.2); g.lineTo(r * .46, -r * 1.42); g.lineTo(r * .42, -r * 1.0); g.closePath(); fs(g, '#ffc107', r * .06);
  },
  // ---- 퀘스트 구조물 ----
  portal(g, r, f) {
    g.save(); g.scale(1, .55); g.rotate(f * Math.PI / 8);
    for (let i = 0; i < 3; i++) { g.strokeStyle = ['#7c4dff', '#b388ff', '#ea80fc'][i]; g.lineWidth = r * .18; g.beginPath(); g.arc(0, 0, r * (1 - i * .25), i, i + 4.5); g.stroke(); }
    g.fillStyle = 'rgba(40,0,80,.85)'; circ(g, 0, 0, r * .55); g.fill(); g.restore();
    g.fillStyle = '#e1bee7'; circ(g, 0, 0, r * .12); g.fill();
  },
  egg(g, r, f) {
    const s = 1 + [0, .04, 0, -.04][f]; shadow(g, r, .9, .8);
    g.beginPath(); g.ellipse(0, 0, r * .7 * s, r * .95 / s, 0, 0, TAU); fs(g, '#c2185b', r * .09);
    g.strokeStyle = '#f48fb1'; g.lineWidth = r * .07; g.beginPath(); g.moveTo(-r * .3, -r * .6); g.quadraticCurveTo(0, -r * .1, -r * .2, r * .5); g.moveTo(r * .3, -r * .5); g.quadraticCurveTo(r * .1, 0, r * .35, r * .5); g.stroke();
    g.fillStyle = 'rgba(255,235,59,.6)'; circ(g, 0, 0, r * .2 * s); g.fill();
  },
  device(g, r, f) {
    shadow(g, r, .9, .9); rr(g, -r * .7, r * .2, r * 1.4, r * .6, r * .1); fs(g, '#4e342e', r * .08);
    g.beginPath(); g.moveTo(-r * .45, r * .25); g.lineTo(-r * .25, -r * .7); g.lineTo(r * .25, -r * .7); g.lineTo(r * .45, r * .25); g.closePath(); fs(g, '#795548', r * .08);
    g.fillStyle = ['#ffd600', '#ffab00', '#ffd600', '#fff176'][f]; g.beginPath(); g.moveTo(0, -r * 1.25); g.lineTo(r * .25, -r * .8); g.lineTo(0, -r * .5); g.lineTo(-r * .25, -r * .8); g.closePath(); g.fill(); g.strokeStyle = OL; g.lineWidth = r * .06; g.stroke();
    g.fillStyle = '#ffd600'; for (const x of [-.4, 0, .4]) { circ(g, r * x, r * .5, r * .07); g.fill(); }
  },
  gen(g, r, f) {
    shadow(g, r, .9, 1); rr(g, -r * .8, -r * .6, r * 1.6, r * 1.3, r * .15); fs(g, '#546e7a', r * .08);
    rr(g, -r * .6, -r * .4, r * 1.2, r * .5, r * .08); fs(g, '#263238', 0);
    g.fillStyle = f % 2 ? '#00e676' : '#69f0ae'; g.beginPath(); g.moveTo(r * .05, -r * .35); g.lineTo(-r * .15, -r * .05); g.lineTo(0, -r * .05); g.lineTo(-r * .08, r * .05); g.lineTo(r * .15, -r * .2); g.lineTo(0, -r * .2); g.closePath(); g.fill();
    for (const x of [-.5, -.2, .1, .4]) { g.fillStyle = '#90a4ae'; g.fillRect(r * x, r * .25, r * .14, r * .3); }
  }
};
let RES = 1;
const SPR = new Map();
function getSprite(kind, r, frame, flash, palName) {
  const key = kind + '|' + (palName || '') + '|' + r.toFixed(1) + '|' + frame + (flash ? 'F' : '');
  let s = SPR.get(key); if (s) return s;
  const box = r * 3.4, px = Math.max(4, Math.ceil(box * K));
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'); g.translate(px / 2, px / 2); g.scale(K, K);
  try { (DRAW[kind] || DRAW.zombie)(g, r, frame, PAL[palName]); } catch (e) { }
  if (flash) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, px, px); }
  s = { c, box }; SPR.set(key, s);
  if (SPR.size > 1400) { const it = SPR.keys(); for (let i = 0; i < 300; i++) SPR.delete(it.next().value); }
  return s;
}
const GLOW = new Map();
function glowSprite(col) {
  let s = GLOW.get(col); if (s) return s;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); GLOW.set(col, c); return c;
}
// 팔레트 (같은 그림을 다른 종으로 보이게 하는 색 조합)
const PAL = {
  rad: { a: '#c6ff00', b: '#5d4037', e: '#76ff03', glow: '#b2ff59' }, radr: { a: '#dce775', b: '#33691e', e: '#76ff03' }, radb: { a: '#9e9d24', b: '#827717', e: '#c6ff00' },
  mutant: { a: '#a1887f', b: '#6d4c41', c: '#e57373', e: '#ff5252' }, snow: { a: '#eceff1', b: '#b0bec5', e: '#4fc3f7' }, lava: { a: '#5d4037', b: '#3e2723', c: '#ff6d00', e: '#ffab00' }, shadow: { a: '#37474f', b: '#212121', c: '#7c4dff', e: '#e040fb' },
  ice: { a: '#b3e5fc', e: '#01579b' }, iceSlime: { a: '#81d4fa', e: '#01579b', core: '#e1f5fe' }, magma: { a: '#ff7043', e: '#3e2723', core: '#ffeb3b' }, void: { a: '#7e57c2', e: '#fff', core: '#000' }, voidW: { a: '#9575cd', e: '#ff1744' },
  yeti: { a: '#eceff1', b: '#b0bec5', e: '#29b6f6', fur: '#fff' }, magmaG: { a: '#5d4037', b: '#3e2723', e: '#ff6d00' }, iceG: { a: '#b3e5fc', b: '#4fc3f7', e: '#e1f5fe' },
  shooter: { a: '#80cbc4', b: '#37474f', e: '#000', gun: '#26c6da' }, warrior: { a: '#7986cb', b: '#283593', e: '#000', c: '#ff4081', gun: '#ff4081' }, shade: { a: '#b39ddb', b: '#311b92', e: '#e040fb' }, lord: { a: '#aed581', b: '#4a148c', e: '#000', crown: '#ffd600', gun: '#e040fb' },
  brood: { a: '#880e4f', b: '#f06292', e: '#ffeb3b' }, sniper: { a: '#546e7a', b: '#263238', e: '#00e5ff' }, dark: { a: '#424242', b: '#1a1a1a', e: '#d500f9' }, bossMech: { a: '#b0bec5', b: '#37474f', e: '#ff1744' },
  repair: { a: '#e0e0e0', e: '#00e676', cross: '#00e676' }, darkD: { a: '#212121', e: '#d500f9' }, alienD: { a: '#26a69a', e: '#76ff03' },
  summoner: { a: '#1a237e', b: '#c5cae9', e: '#7c4dff' }, abyss: { a: '#311b92', b: '#d1c4e9', e: '#651fff' }, final: { a: '#b71c1c', b: '#ffccbc', e: '#ffd600', crown: '#ffd600' },
  goldM: { a: '#ffd54f', b: '#ffb300', e: '#fff' }, bot: { a: '#455a64', b: '#ffab00', e: '#ff1744' }, caveSp: { a: '#4e342e', c: '#3e2723', b: '#ff8f00', e: '#ffeb3b' },
  infected: { a: '#b39ddb', b: '#4a148c', e: '#76ff03' }, infSp: { a: '#33691e', c: '#1b5e20', b: '#c6ff00', e: '#c6ff00' }
};

/* ------------------------- 30개 지역 배경 ------------------------- */
const groundCache = new Map();
const TILE = 512;
function decoDraw(g, kind, rnd, col) {
  const R = () => rnd() * 2 - 1;
  switch (kind) {
    case 'crack': g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); for (let i = 0; i < 4; i++) g.lineTo(R() * 30, R() * 30); g.stroke(); break;
    case 'rubble': for (let i = 0; i < 5; i++) { rr(g, R() * 18, R() * 12, 5 + rnd() * 8, 4 + rnd() * 6, 2); fs(g, col || '#9e9e9e', 1.2); } break;
    case 'car': g.rotate(R()); rr(g, -30, -15, 60, 30, 8); fs(g, col || pick(['#8d6e63', '#546e7a', '#7b1f1f', '#455a64']), 2); rr(g, -14, -12, 28, 24, 5); fs(g, '#263238', 1.5); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-34, -17, 6, 6); g.fillRect(28, 11, 6, 6); break;
    case 'blood': g.fillStyle = 'rgba(120,0,0,.45)'; for (let i = 0; i < 4; i++) { circ(g, R() * 14, R() * 10, 4 + rnd() * 9); g.fill(); } break;
    case 'sandbag': for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-24 + i * 15, 0, 9, 6, 0, 0, TAU); fs(g, '#bcaaa4', 1.5); } for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-17 + i * 15, -8, 9, 6, 0, 0, TAU); fs(g, '#a1887f', 1.5); } break;
    case 'crate': rr(g, -13, -13, 26, 26, 2); fs(g, col || '#8d6e63', 2); line(g, -13, -13, 13, 13, 2, 'rgba(0,0,0,.35)'); line(g, 13, -13, -13, 13, 2, 'rgba(0,0,0,.35)'); break;
    case 'helipad': circ(g, 0, 0, 44); fs(g, 'rgba(255,255,255,.08)', 0); g.strokeStyle = 'rgba(255,235,59,.6)'; g.lineWidth = 3; g.stroke(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-14, -18, 6, 36); g.fillRect(8, -18, 6, 36); g.fillRect(-8, -3, 16, 6); break;
    case 'barrel': circ(g, 0, 0, 10); fs(g, col || '#e65100', 2); g.strokeStyle = 'rgba(0,0,0,.3)'; circ(g, 0, 0, 6); g.stroke(); break;
    case 'toxic': g.fillStyle = col || 'rgba(118,255,3,.35)'; g.beginPath(); g.ellipse(0, 0, 26 + rnd() * 14, 14 + rnd() * 8, rnd() * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; circ(g, -6, -3, 3); g.fill(); break;
    case 'pipe': g.rotate(rnd() < .5 ? 0 : Math.PI / 2); rr(g, -50, -6, 100, 12, 5); fs(g, col || '#78909c', 2); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-20, -7, 4, 14); g.fillRect(20, -7, 4, 14); break;
    case 'glass': g.strokeStyle = 'rgba(200,240,255,.6)'; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { g.beginPath(); const x = R() * 16, y = R() * 16; g.moveTo(x, y); g.lineTo(x + R() * 8, y + R() * 8); g.lineTo(x + R() * 8, y + R() * 8); g.closePath(); g.stroke(); } break;
    case 'table': rr(g, -26, -12, 52, 24, 3); fs(g, col || '#cfd8dc', 2); g.fillStyle = '#4fc3f7'; circ(g, -12, -2, 4); g.fill(); g.fillStyle = '#e91e63'; g.fillRect(4, -6, 6, 10); break;
    case 'hazard': circ(g, 0, 0, 13); fs(g, '#ffd600', 2); g.fillStyle = OL; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 0, 10, i * TAU / 3 - .45, i * TAU / 3 + .45); g.lineTo(0, 0); g.fill(); } circ(g, 0, 0, 3); fs(g, '#ffd600', 0); break;
    case 'pillar': circ(g, 0, 0, 16); fs(g, col || '#757575', 2.5); g.fillStyle = 'rgba(255,255,255,.12)'; circ(g, -4, -4, 8); g.fill(); break;
    case 'mushroom': for (let i = 0; i < 3; i++) { const x = R() * 14, y = R() * 10; g.fillStyle = 'rgba(255,255,255,.2)'; circ(g, x, y, 9); g.fill(); g.beginPath(); g.arc(x, y, 6, Math.PI, 0); fs(g, col || '#ba68c8', 1); g.fillStyle = '#e1f5fe'; circ(g, x - 2, y - 3, 1.5); g.fill(); } break;
    case 'roots': g.strokeStyle = col || '#4e342e'; g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(R() * 30, R() * 30, R() * 45, R() * 45); g.stroke(); } break;
    case 'rock': g.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; g.lineTo(Math.cos(a) * (10 + rnd() * 8), Math.sin(a) * (8 + rnd() * 6)); } g.closePath(); fs(g, col || '#8d8d8d', 2); break;
    case 'crater': circ(g, 0, 0, 22 + rnd() * 10); fs(g, 'rgba(0,0,0,.22)', 0); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 22, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break;
    case 'wreck': g.rotate(R()); rr(g, -32, -18, 64, 36, 5); fs(g, '#5d5a3a', 2); circ(g, 0, 0, 12); fs(g, '#4a472c', 2); line(g, 0, 0, 34, -10, 6, '#3a3822'); g.fillStyle = 'rgba(0,0,0,.4)'; circ(g, 18, 8, 6); g.fill(); break;
    case 'wire': g.strokeStyle = '#757575'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 8; i++) { g.arc(-35 + i * 10, 0, 5, 0, Math.PI, i % 2); } g.stroke(); break;
    case 'prints': g.fillStyle = 'rgba(120,144,156,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(-30 + i * 12, (i % 2) * 8, 3, 5, 0, 0, TAU); g.fill(); } break;
    case 'icecrystal': for (let i = 0; i < 3; i++) { g.save(); g.rotate(-.5 + i * .5); g.beginPath(); g.moveTo(0, 0); g.lineTo(-5, -10); g.lineTo(0, -26 - rnd() * 10); g.lineTo(5, -10); g.closePath(); fs(g, col || 'rgba(179,229,252,.9)', 1.5); g.restore(); } break;
    case 'lava': g.strokeStyle = col || '#ff6d00'; g.lineWidth = 4; g.shadowColor = '#ff3d00'; g.shadowBlur = 8; g.beginPath(); g.moveTo(0, 0); for (let i = 0; i < 4; i++) g.lineTo(R() * 40, R() * 40); g.stroke(); g.shadowBlur = 0; break;
    case 'lavapool': g.fillStyle = '#ff6d00'; g.beginPath(); g.ellipse(0, 0, 30, 18, rnd() * 3, 0, TAU); g.fill(); g.fillStyle = '#ffd600'; g.beginPath(); g.ellipse(-4, -2, 14, 7, 0, 0, TAU); g.fill(); g.strokeStyle = '#3e2723'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 30, 18, 0, 0, TAU); g.stroke(); break;
    case 'grate': g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; rr(g, -24, -24, 48, 48, 2); g.stroke(); for (let i = -16; i <= 16; i += 8) { line(g, i, -24, i, 24, 2, 'rgba(0,0,0,.35)'); } break;
    case 'tank': circ(g, 0, 0, 18); fs(g, '#37474f', 2); circ(g, 0, 0, 13); fs(g, col || 'rgba(0,229,255,.55)', 0); g.fillStyle = 'rgba(30,60,30,.8)'; g.beginPath(); g.ellipse(0, 2, 5, 8, 0, 0, TAU); g.fill(); break;
    case 'goo': g.fillStyle = col || 'rgba(0,230,118,.4)'; for (let i = 0; i < 4; i++) { circ(g, R() * 16, R() * 10, 5 + rnd() * 8); g.fill(); } break;
    case 'lights': g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-60, -3, 120, 6); for (let i = 0; i < 6; i++) { g.fillStyle = col || '#80deea'; g.fillRect(-55 + i * 20, -2, 8, 4); } break;
    case 'stripes': g.save(); rr(g, -40, -8, 80, 16, 2); g.clip(); g.fillStyle = '#ffd600'; g.fillRect(-40, -8, 80, 16); g.fillStyle = '#212121'; for (let i = -50; i < 50; i += 14) { g.beginPath(); g.moveTo(i, 8); g.lineTo(i + 7, 8); g.lineTo(i + 17, -8); g.lineTo(i + 10, -8); g.fill(); } g.restore(); break;
    case 'window': rr(g, -30, -20, 60, 40, 6); fs(g, '#05051a', 2.5); g.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { g.globalAlpha = .4 + rnd() * .6; g.fillRect(-26 + rnd() * 52, -16 + rnd() * 32, 1.5, 1.5); } g.globalAlpha = 1; break;
    case 'plant': for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + R() * .8; g.strokeStyle = col || '#26c6da'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * 10, Math.sin(a) * 20, Math.cos(a) * 18, Math.sin(a) * 30); g.stroke(); g.fillStyle = '#e040fb'; circ(g, Math.cos(a) * 18, Math.sin(a) * 30, 4); g.fill(); } break;
    case 'crystal': for (let i = 0; i < 3; i++) { g.save(); g.rotate(-.4 + i * .4); g.beginPath(); g.moveTo(-5, 0); g.lineTo(0, -22 - rnd() * 12); g.lineTo(5, 0); g.closePath(); fs(g, col || '#7c4dff', 1.5); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-1, -16, 2, 10); g.restore(); } break;
    case 'gear': g.save(); g.fillStyle = col || '#78909c'; for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.fillRect(-4, -20, 8, 8); } circ(g, 0, 0, 15); fs(g, col || '#78909c', 2); circ(g, 0, 0, 5); fs(g, '#263238', 0); g.restore(); break;
    case 'pad': circ(g, 0, 0, 24); fs(g, '#263238', 2); g.strokeStyle = col || '#00e5ff'; g.lineWidth = 3; circ(g, 0, 0, 17); g.stroke(); g.fillStyle = col || '#00e5ff'; g.fillRect(-2, -10, 4, 20); break;
    case 'neon': g.save(); g.shadowColor = col || '#ff4081'; g.shadowBlur = 10; g.strokeStyle = col || '#ff4081'; g.lineWidth = 3; rr(g, -24, -10, 48, 20, 5); g.stroke(); g.restore(); g.fillStyle = col || '#ff4081'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText(pick(['BAR', '24H', 'NEO', 'ZONE', '酒', 'HOT']), 0, 4); break;
    case 'puddle': g.fillStyle = 'rgba(120,160,255,.18)'; g.beginPath(); g.ellipse(0, 0, 30, 12, 0, 0, TAU); g.fill(); g.fillStyle = col || 'rgba(255,64,129,.35)'; g.beginPath(); g.ellipse(4, 0, 12, 4, 0, 0, TAU); g.fill(); break;
    case 'radsign': circ(g, 0, 0, 14); fs(g, '#ffd600', 2); g.fillStyle = OL; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 11, i * TAU / 3 + .3, i * TAU / 3 + 1.25); g.closePath(); g.fill(); } break;
    case 'membrane': g.strokeStyle = col || 'rgba(244,143,177,.5)'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(R() * 40, R() * 40); g.bezierCurveTo(R() * 40, R() * 40, R() * 40, R() * 40, R() * 40, R() * 40); g.stroke(); } break;
    case 'eggdeco': for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(R() * 14, R() * 10, 6, 8, 0, 0, TAU); fs(g, '#ad1457', 1.2); } break;
    case 'glowline': g.save(); g.shadowColor = col || '#b388ff'; g.shadowBlur = 8; line(g, -60, 0, 60, 0, 2.5, col || '#b388ff'); g.restore(); break;
    case 'rift': g.save(); g.shadowColor = col || '#e040fb'; g.shadowBlur = 14; g.strokeStyle = col || '#e040fb'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, -10); g.lineTo(-10, 4); g.lineTo(4, -8); g.lineTo(30, 10); g.stroke(); g.restore(); break;
    case 'debris': for (let i = 0; i < 4; i++) { g.save(); g.translate(R() * 22, R() * 16); g.rotate(rnd() * 3); g.fillStyle = col || '#616161'; g.fillRect(-6, -3, 12, 6); g.restore(); } break;
    case 'circuit': g.strokeStyle = col || 'rgba(255,214,0,.5)'; g.lineWidth = 2; g.beginPath(); let x = -40, y = 0; g.moveTo(x, y); for (let i = 0; i < 5; i++) { if (i % 2) y += R() * 20; else x += 18; g.lineTo(x, y); } g.stroke(); g.fillStyle = col || '#ffd600'; circ(g, x, y, 3); g.fill(); break;
    case 'altar': rr(g, -22, -16, 44, 32, 4); fs(g, '#3e2723', 2); g.fillStyle = col || '#ffd600'; g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 0); g.lineTo(0, 12); g.lineTo(-8, 0); g.fill(); break;
    case 'spikes': for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-24 + i * 12, 6); g.lineTo(-18 + i * 12, -16); g.lineTo(-12 + i * 12, 6); g.closePath(); fs(g, col || '#424242', 1.5); } break;
    case 'rune': g.strokeStyle = col || 'rgba(224,64,251,.5)'; g.lineWidth = 2; circ(g, 0, 0, 22); g.stroke(); g.beginPath(); for (let i = 0; i < 5; i++) { const a = i * TAU * 2 / 5 - Math.PI / 2; g.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); } g.closePath(); g.stroke(); break;
    case 'skull': circ(g, 0, 0, 7); fs(g, '#e0e0e0', 1.2); g.fillStyle = OL; circ(g, -2.5, -1, 1.6); g.fill(); circ(g, 2.5, -1, 1.6); g.fill(); break;
    case 'cone': g.beginPath(); g.moveTo(-7, 6); g.lineTo(0, -12); g.lineTo(7, 6); g.closePath(); fs(g, '#ff6d00', 1.5); g.fillStyle = '#fff'; g.fillRect(-4, -3, 8, 3); break;
    case 'barrier': rr(g, -30, -6, 60, 12, 3); fs(g, '#eeeeee', 2); g.fillStyle = '#e53935'; for (let i = -26; i < 26; i += 12) g.fillRect(i, -6, 6, 12); break;
    case 'snowpile': g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) { circ(g, R() * 16, R() * 8, 8 + rnd() * 6); g.fill(); } break;
    case 'ashpile': g.fillStyle = 'rgba(50,40,40,.6)'; for (let i = 0; i < 4; i++) { circ(g, R() * 16, R() * 8, 6 + rnd() * 6); g.fill(); } break;
    case 'bones': g.strokeStyle = '#e0e0e0'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); const a = rnd() * 3; g.moveTo(Math.cos(a) * -9, Math.sin(a) * -9); g.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); g.stroke(); } break;
    case 'screen': rr(g, -20, -14, 40, 28, 3); fs(g, '#0d1b2a', 2); g.fillStyle = col || '#00e676'; for (let i = 0; i < 4; i++) g.fillRect(-15, -9 + i * 5, 10 + rnd() * 18, 2); break;
    case 'stars': g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { g.globalAlpha = .3 + rnd() * .7; circ(g, R() * 40, R() * 40, rnd() * 1.4 + .3); g.fill(); } g.globalAlpha = 1; break;
    case 'asteroid': g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.lineTo(Math.cos(a) * (14 + rnd() * 8), Math.sin(a) * (14 + rnd() * 8)); } g.closePath(); fs(g, col || '#5d4037', 2); g.fillStyle = 'rgba(0,0,0,.3)'; circ(g, 4, 3, 4); g.fill(); break;
    case 'cloud': g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { circ(g, R() * 30, R() * 10, 14 + rnd() * 12); g.fill(); } break;
    case 'coral': g.strokeStyle = col || pick(['#ff7043', '#f06292', '#ffca28']); g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, 8); const a = -Math.PI / 2 + R() * .9; g.quadraticCurveTo(Math.cos(a) * 10, Math.sin(a) * 10, Math.cos(a) * 20, Math.sin(a) * 22); g.stroke(); } break;
    case 'kelp': g.strokeStyle = col || '#2e7d32'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(i * 8 - 8, 10); g.bezierCurveTo(i * 8 - 18, -10, i * 8 + 4, -20, i * 8 - 10, -38); g.stroke(); } break;
    case 'bubblevent': circ(g, 0, 0, 10); fs(g, '#37474f', 2); g.strokeStyle = 'rgba(178,235,242,.8)'; g.lineWidth = 1.5; for (let i = 0; i < 4; i++) { circ(g, R() * 8, -14 - i * 9, 2 + i); g.stroke(); } break;
    case 'pyramid': g.beginPath(); g.moveTo(-50, 30); g.lineTo(0, -40); g.lineTo(50, 30); g.closePath(); fs(g, '#c9a15b', 2.5); g.beginPath(); g.moveTo(0, -40); g.lineTo(50, 30); g.lineTo(8, 30); g.closePath(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fill(); g.fillStyle = '#00e5ff'; circ(g, 0, -10, 4); g.fill(); break;
    case 'hiero': rr(g, -22, -16, 44, 32, 3); fs(g, '#b8925a', 1.5); g.strokeStyle = '#6d4c41'; g.lineWidth = 2; g.beginPath(); g.arc(-10, -2, 5, 0, TAU); g.moveTo(2, -10); g.lineTo(2, 8); g.moveTo(8, -6); g.lineTo(16, 6); g.stroke(); break;
    case 'sunpanel': g.save(); g.rotate(.3); rr(g, -26, -16, 52, 32, 2); fs(g, '#1a237e', 2); g.strokeStyle = 'rgba(144,202,249,.6)'; g.lineWidth = 1; for (let i = -18; i <= 18; i += 9) line(g, i, -16, i, 16, 1, g.strokeStyle); line(g, -26, 0, 26, 0, 1, g.strokeStyle); g.restore(); break;
    case 'clock': circ(g, 0, 0, 20); fs(g, '#311b92', 2); g.strokeStyle = '#b388ff'; g.lineWidth = 1.5; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(g, Math.cos(a) * 15, Math.sin(a) * 15, Math.cos(a) * 18, Math.sin(a) * 18, 1.5, '#b388ff'); } line(g, 0, 0, 0, -13, 2.5, '#ffd54f'); line(g, 0, 0, 9, 4, 2, '#ffd54f'); break;
    case 'vein': g.strokeStyle = col || 'rgba(229,57,53,.6)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-40, R() * 20); g.bezierCurveTo(-10, R() * 30, 10, R() * 30, 40, R() * 20); g.stroke(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,138,128,.6)'; g.stroke(); break;
    case 'hull': rr(g, -40, -24, 80, 48, 4); fs(g, col || '#455a64', 2); g.fillStyle = 'rgba(0,0,0,.35)'; for (const [x, y] of [[-34, -18], [30, -18], [-34, 14], [30, 14]]) { circ(g, x, y, 2); g.fill(); } break;
  }
}
// 지면 패턴
function basePattern(g, st, rnd) {
  const [c1, c2, c3] = st.ground; g.fillStyle = c1; g.fillRect(0, 0, TILE, TILE);
  const pat = st.pat;
  const inside = m => [m + rnd() * (TILE - 2 * m), m + rnd() * (TILE - 2 * m)];
  if (pat === 'blotch' || pat === 'sand' || pat === 'snow' || pat === 'organic' || pat === 'rock') {
    for (let i = 0; i < 24; i++) { const [x, y] = inside(40); g.fillStyle = c2; g.beginPath(); g.ellipse(x, y, 20 + rnd() * 30, 12 + rnd() * 18, rnd() * 3, 0, TAU); g.fill(); }
  }
  if (pat === 'sand') { g.strokeStyle = c3 || 'rgba(0,0,0,.08)'; g.lineWidth = 2; for (let i = 0; i < 16; i++) { const y = 16 + i * 31; g.beginPath(); for (let x = 0; x <= TILE; x += 16) g.lineTo(x, y + Math.sin(x / 40 + i) * 6); g.stroke(); } }
  if (pat === 'organic') { g.strokeStyle = c3 || 'rgba(255,100,150,.25)'; g.lineWidth = 3; for (let i = 0; i < 10; i++) { const [x, y] = inside(30); g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + rnd() * 80 - 40, y + rnd() * 80 - 40, x + rnd() * 80 - 40, y + rnd() * 80 - 40, x + rnd() * 100 - 50, y + rnd() * 100 - 50); g.stroke(); } }
  if (pat === 'asphalt' || pat === 'road') {
    for (let i = 0; i < 400; i++) { g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.fillRect(rnd() * TILE, rnd() * TILE, 2, 2); }
    for (let i = 0; i < 10; i++) { const [x, y] = inside(30); g.fillStyle = c2; g.beginPath(); g.ellipse(x, y, 25 + rnd() * 30, 15 + rnd() * 20, rnd() * 3, 0, TAU); g.fill(); }
    if (pat === 'road') { g.fillStyle = 'rgba(255,214,0,.75)'; for (let y = 0; y < TILE; y += 64) { g.fillRect(TILE / 2 - 4, y + 8, 8, 34); } g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(40, 0, 5, TILE); g.fillRect(TILE - 45, 0, 5, TILE); }
  }
  if (pat === 'plates' || pat === 'tiles' || pat === 'concrete') {
    const sz = pat === 'plates' ? 64 : pat === 'tiles' ? 32 : 128;
    for (let y = 0; y < TILE; y += sz) for (let x = 0; x < TILE; x += sz) { if (rnd() < .35) { g.fillStyle = c2; g.fillRect(x + 1, y + 1, sz - 2, sz - 2); } }
    g.strokeStyle = c3 || 'rgba(0,0,0,.25)'; g.lineWidth = pat === 'tiles' ? 1 : 2;
    for (let i = 0; i <= TILE; i += sz) { line(g, i, 0, i, TILE, g.lineWidth, g.strokeStyle); line(g, 0, i, TILE, i, g.lineWidth, g.strokeStyle); }
    if (pat === 'plates') { g.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 0; y < TILE; y += sz) for (let x = 0; x < TILE; x += sz) { for (const [a, b] of [[6, 6], [sz - 6, 6], [6, sz - 6], [sz - 6, sz - 6]]) { circ(g, x + a, y + b, 2); g.fill(); } } }
  }
  if (pat === 'hex') {
    g.strokeStyle = c3 || 'rgba(0,0,0,.25)'; g.lineWidth = 2; const s = 32, h = s * Math.sqrt(3);
    for (let row = -1; row < TILE / h * 2 + 1; row++) for (let col = -1; col < TILE / (s * 3) + 1; col++) {
      const cx = col * s * 3 + (row % 2) * s * 1.5, cy = row * h / 2;
      if (rnd() < .2) { g.fillStyle = c2; g.beginPath(); for (let i = 0; i < 6; i++) g.lineTo(cx + Math.cos(i * TAU / 6) * s, cy + Math.sin(i * TAU / 6) * s); g.closePath(); g.fill(); }
      g.beginPath(); for (let i = 0; i < 6; i++) g.lineTo(cx + Math.cos(i * TAU / 6) * s, cy + Math.sin(i * TAU / 6) * s); g.closePath(); g.stroke();
    }
  }
  if (pat === 'grid' || pat === 'neongrid') {
    for (let i = 0; i < 8; i++) { const [x, y] = inside(30); g.fillStyle = c2; g.beginPath(); g.ellipse(x, y, 40, 25, 0, 0, TAU); g.fill(); }
    g.save(); if (pat === 'neongrid') { g.shadowColor = c3; g.shadowBlur = 6; } g.strokeStyle = c3 || 'rgba(0,229,255,.25)'; g.lineWidth = 1.5;
    for (let i = 0; i <= TILE; i += 64) { line(g, i, 0, i, TILE, 1.5, g.strokeStyle); line(g, 0, i, TILE, i, 1.5, g.strokeStyle); } g.restore();
  }
  if (pat === 'rails') {
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(rnd() * TILE, rnd() * TILE, 2, 2); }
    for (const x0 of [96, 352]) { g.fillStyle = '#3e2723'; for (let y = 0; y < TILE; y += 24) g.fillRect(x0 - 30, y, 60, 10); g.fillStyle = '#9e9e9e'; g.fillRect(x0 - 22, 0, 5, TILE); g.fillRect(x0 + 17, 0, 5, TILE); }
  }
  if (pat === 'conveyor') { // 컨베이어 벨트 바탕 (움직임은 실시간으로 그림)
    g.strokeStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i <= TILE; i += 64) line(g, 0, i, TILE, i, 2, g.strokeStyle);
    g.fillStyle = '#263238'; g.fillRect(0, 200, TILE, 70); g.fillStyle = '#ffd600'; g.fillRect(0, 196, TILE, 4); g.fillRect(0, 270, TILE, 4);
  }
  if (pat === 'space' || pat === 'void') {
    for (let i = 0; i < 160; i++) { g.fillStyle = '#fff'; g.globalAlpha = rnd() * .8; circ(g, rnd() * TILE, rnd() * TILE, rnd() * 1.3); g.fill(); } g.globalAlpha = 1;
    if (pat === 'void') { g.strokeStyle = c3 || 'rgba(224,64,251,.18)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const [x, y] = inside(60); g.beginPath(); const n = 3 + Math.floor(rnd() * 4), rad = 20 + rnd() * 40; for (let k = 0; k <= n; k++) g.lineTo(x + Math.cos(k / n * TAU) * rad, y + Math.sin(k / n * TAU) * rad); g.stroke(); } }
    else { for (let i = 0; i < 3; i++) { const [x, y] = inside(80); const gr = g.createRadialGradient(x, y, 0, x, y, 80); gr.addColorStop(0, c2); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 80, y - 80, 160, 160); } }
  }
  if (pat === 'snow') { for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(rnd() * TILE, rnd() * TILE, 2, 2); } }
  if (pat === 'rock') { for (let i = 0; i < 14; i++) { const [x, y] = inside(30); decoDraw2(g, x, y, 'crack', rnd); } }
  if (st.grass) { for (let i = 0; i < 60; i++) { const [x, y] = inside(8); g.strokeStyle = st.grass; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 7); g.moveTo(x, y); g.lineTo(x + 1, y - 9); g.moveTo(x, y); g.lineTo(x + 4, y - 6); g.stroke(); } }
}
function decoDraw2(g, x, y, kind, rnd, col) { g.save(); g.translate(x, y); g.lineJoin = 'round'; decoDraw(g, kind, rnd, col); g.restore(); }
function bakeGround(st) {
  const key = st.n; let c = groundCache.get(key); if (c) return c;
  const R = Math.min(2, Math.max(1, K)); c = document.createElement('canvas'); c.width = c.height = Math.round(TILE * R);
  const g = c.getContext('2d'); g.scale(R, R); const rnd = mulberry(st.n * 999 + 7);
  basePattern(g, st, rnd);
  for (const [kind, cnt, col] of st.deco) for (let i = 0; i < cnt; i++) {
    const m = 50, x = m + rnd() * (TILE - 2 * m), y = m + rnd() * (TILE - 2 * m);
    decoDraw2(g, x, y, kind, rnd, col);
  }
  groundCache.set(key, c); return c;
}
// 움직이는 배경 장치 (톱니, 경고등, 컨베이어, 네온 깜빡임 등)
function drawLive(st, x0, y0) {
  if (!st.live || Q.level === 0) return;
  const t = G.time, rnd = mulberry((Math.floor(x0 / TILE) * 73856093) ^ (Math.floor(y0 / TILE) * 19349663) ^ st.n);
  for (const kind of st.live) {
    const x = x0 + 60 + rnd() * (TILE - 120), y = y0 + 60 + rnd() * (TILE - 120);
    ctx.save(); ctx.translate(x, y);
    if (kind === 'gear') { ctx.rotate(t * (rnd() < .5 ? 1.2 : -1.2)); decoDraw(ctx, 'gear', rnd, '#90a4ae'); }
    else if (kind === 'fan') { circ(ctx, 0, 0, 22); fs(ctx, '#263238', 2); ctx.rotate(t * 8); ctx.fillStyle = '#78909c'; for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.ellipse(0, -10, 5, 10, 0, 0, TAU); ctx.fill(); } }
    else if (kind === 'blink') { const on = Math.sin(t * 5 + x) > 0; circ(ctx, 0, 0, 6); fs(ctx, on ? '#ff1744' : '#4a0000', 1.5); if (on && QC.glow) { ctx.globalAlpha = .35; ctx.drawImage(glowSprite('#ff1744'), -24, -24, 48, 48); } }
    else if (kind === 'conveyor') { ctx.translate(-x + x0, -y + y0); ctx.fillStyle = '#455a64'; const off = (t * 40) % 32; for (let i = -32; i < TILE; i += 32) ctx.fillRect(i + off, 210, 16, 50); }
    else if (kind === 'neon') { const on = Math.sin(t * 13 + x * .1) > -0.85; ctx.globalAlpha = on ? 1 : .25; decoDraw(ctx, 'glowline', rnd, pick(['#ff4081', '#00e5ff', '#d500f9'])); }
    else if (kind === 'lavaglow') { ctx.globalAlpha = .4 + .3 * Math.sin(t * 2 + x); ctx.drawImage(glowSprite('#ff6d00'), -50, -50, 100, 100); }
    else if (kind === 'rift') { ctx.globalAlpha = .5 + .5 * Math.sin(t * 3 + x); decoDraw(ctx, 'rift', rnd, '#e040fb'); }
    else if (kind === 'radar') { circ(ctx, 0, 0, 26); fs(ctx, 'rgba(0,40,0,.6)', 2); ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 2) * 24, Math.sin(t * 2) * 24); ctx.stroke(); }
    else if (kind === 'steam') { ctx.globalAlpha = .25; for (let i = 0; i < 3; i++) { const k = ((t * .6 + i / 3) % 1); circ(ctx, Math.sin(k * 6) * 4, -k * 50, 8 + k * 12); ctx.fillStyle = '#eceff1'; ctx.fill(); } }
    else if (kind === 'hologram') { ctx.globalAlpha = .45 + .2 * Math.sin(t * 9); ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2; ctx.rotate(t); ctx.strokeRect(-14, -14, 28, 28); ctx.rotate(.78); ctx.strokeRect(-10, -10, 20, 20); }
    else if (kind === 'pulse') { const k = (t * .8 + x * .01) % 1; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 3; circ(ctx, 0, 0, 10 + k * 40); ctx.stroke(); }
    ctx.restore();
  }
}
// 화면 날씨 효과 (먼지, 눈, 비, 불씨, 포자, 연기 등)
const weather = [];
function updateWeather(dt, kind) {
  const n = kind ? QC.weather : 0;
  while (weather.length < n) weather.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), p: Math.random() * 10 });
  weather.length = Math.min(weather.length, n);
  for (const w of weather) {
    const s = w.s;
    switch (kind) {
      case 'snow': w.y += (30 + s * 40) * dt; w.x += Math.sin(G.time + w.p) * 20 * dt; break;
      case 'rain': case 'neonrain': w.y += (500 + s * 300) * dt; w.x -= 120 * dt; break;
      case 'embers': case 'void': case 'rad': case 'bubbles': w.y -= (20 + s * 40) * dt; w.x += Math.sin(G.time * 2 + w.p) * 15 * dt; break;
      case 'ash': w.y += (20 + s * 25) * dt; w.x += (10 + Math.sin(G.time + w.p) * 10) * dt; break;
      case 'smoke': case 'clouds': w.x += (8 + s * 10) * dt; w.y -= 5 * dt; break;
      case 'sparkle': w.y -= 6 * dt; break;
      case 'stars': w.x -= (40 + s * 120) * dt; break;
      default: w.x += (15 + s * 25) * dt; w.y += Math.sin(G.time + w.p) * 8 * dt; // dust, spores
    }
    if (w.y > H + 20) { w.y = -10; w.x = Math.random() * W; } if (w.y < -20) { w.y = H + 10; w.x = Math.random() * W; }
    if (w.x > W + 20) { w.x = -10; } if (w.x < -20) { w.x = W + 10; }
  }
}
function drawWeather(kind) {
  if (!kind) return; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const w of weather) {
    const s = w.s;
    switch (kind) {
      case 'snow': ctx.fillStyle = 'rgba(255,255,255,.85)'; circ(ctx, w.x, w.y, 1.2 + s * 2.2); ctx.fill(); break;
      case 'rain': ctx.strokeStyle = 'rgba(160,200,255,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + 5, w.y - 14); ctx.stroke(); break;
      case 'neonrain': ctx.strokeStyle = s < .5 ? 'rgba(255,64,129,.45)' : 'rgba(0,229,255,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + 5, w.y - 16); ctx.stroke(); break;
      case 'embers': ctx.fillStyle = s < .5 ? 'rgba(255,145,0,.85)' : 'rgba(255,214,0,.8)'; ctx.fillRect(w.x, w.y, 2 + s * 2, 2 + s * 2); break;
      case 'ash': ctx.fillStyle = 'rgba(90,90,90,.6)'; ctx.fillRect(w.x, w.y, 2 + s * 2, 2 + s * 2); break;
      case 'spores': ctx.fillStyle = s < .5 ? 'rgba(178,255,89,.55)' : 'rgba(234,128,252,.5)'; circ(ctx, w.x, w.y, 1.5 + s * 2.5); ctx.fill(); break;
      case 'rad': ctx.fillStyle = 'rgba(198,255,0,.55)'; circ(ctx, w.x, w.y, 1 + s * 2); ctx.fill(); break;
      case 'void': ctx.fillStyle = 'rgba(224,64,251,.55)'; ctx.fillRect(w.x, w.y, 2 + s * 3, 2 + s * 3); break;
      case 'smoke': ctx.fillStyle = 'rgba(80,80,80,.07)'; circ(ctx, w.x, w.y, 30 + s * 50); ctx.fill(); break;
      case 'stars': ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(w.x, w.y, 1 + s * 10, 1); break;
      case 'sparks': if (Math.sin(G.time * 10 + w.p * 5) > .7) { ctx.fillStyle = '#ffeb3b'; ctx.fillRect(w.x, w.y, 2, 2); } break;
      case 'bubbles': ctx.strokeStyle = 'rgba(178,235,242,.55)'; ctx.lineWidth = 1.2; circ(ctx, w.x, w.y, 2 + s * 4); ctx.stroke(); break;
      case 'sparkle': if (Math.sin(G.time * 4 + w.p * 7) > .4) { ctx.fillStyle = s < .5 ? 'rgba(224,64,251,.85)' : 'rgba(128,216,255,.85)'; ctx.fillRect(w.x - 3, w.y - .5, 6, 1); ctx.fillRect(w.x - .5, w.y - 3, 1, 6); } break;
      case 'clouds': ctx.fillStyle = 'rgba(255,255,255,.08)'; circ(ctx, w.x, w.y, 40 + s * 60); ctx.fill(); break;
      default: ctx.fillStyle = 'rgba(210,180,140,.35)'; circ(ctx, w.x, w.y, 1 + s * 2); ctx.fill();
    }
  }
}
