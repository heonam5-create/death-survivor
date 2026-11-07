/* =====================================================================
   v4 확장 그리기: 탑승 장비 17개 차체 + 14개 무기 장착부 + 부착물,
                   AI 동료 10종, 구조 장소, 물약·수리 키트, HUD
   ===================================================================== */
function wheel(g, x, y, r, t) {
  circ(g, x, y, r); fs(g, '#212121', 1.5); circ(g, x, y, r * .55); fs(g, '#9e9e9e', 1);
  g.strokeStyle = '#424242'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 3; i++) { const a = t * 8 + i * 2.1; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5); } g.stroke();
}
function leg(g, x, y, len, ph, w, col) {
  const k = Math.sin(ph) * .5, kx = x + Math.sin(ph) * len * .3, ky = y + len * .5, fx = x + Math.sin(ph + .6) * len * .35, fy = y + len;
  g.lineCap = 'round'; line(g, x, y, kx, ky, w + 2, OL); line(g, kx, ky, fx, fy, w + 2, OL); line(g, x, y, kx, ky, w, col); line(g, kx, ky, fx, fy, w, col);
  rr(g, fx - w, fy - 2, w * 2.4, 4, 1.5); fs(g, '#37474f', 1); void k;
}
function cockpit(g, x, y, w, h, col) {
  g.beginPath(); g.ellipse(x, y, w, h, 0, Math.PI, 0); g.closePath(); fs(g, col, 1.3);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - w * .3, y - h * .5, w * .25, h * .25, -.5, 0, TAU); g.fill();
  g.fillStyle = 'rgba(30,30,40,.6)'; circ(g, x + w * .15, y - h * .35, Math.min(w, h) * .35); g.fill();
}
function rider(g, x, y) {
  rr(g, x - 5, y - 8, 10, 10, 3); fs(g, '#556b2f', 1.3);
  circ(g, x, y - 14, 7); fs(g, '#ffe0bd', 1.3);
  g.beginPath(); g.arc(x, y - 15, 7.6, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(7, y - 13); g.lineTo(-7, y - 13); g.closePath(); fs(g, '#4e5b31', 1.2);
  g.fillStyle = '#1a1a2e'; circ(g, x + 3, y - 12, 1.3); g.fill();
}
// 차체 17종 (오른쪽을 보는 기준, 원점=지면 중심)
const VBODY = {
  bike(g, c, t, mv, m) {
    wheel(g, -13, -7, 7, mv ? t : 0); wheel(g, 13, -7, 7, mv ? t : 0);
    g.beginPath(); g.moveTo(-15, -12); g.lineTo(-4, -19); g.lineTo(10, -20); g.lineTo(16, -12); g.lineTo(4, -9); g.closePath(); fs(g, c.a, 1.4);
    rr(g, -2, -24, 12, 6, 3); fs(g, c.b, 1.2); line(g, 12, -20, 16, -27, 2.5, '#424242'); line(g, 13, -27, 19, -27, 2.5, '#424242');
    g.fillStyle = c.c; g.fillRect(-12, -15, 10, 2.5);
    if (m) rider(g, -2, -18);
  },
  buggy(g, c, t, mv, m) {
    wheel(g, -15, -8, 8.5, mv ? t : 0); wheel(g, 15, -8, 8.5, mv ? t : 0);
    g.beginPath(); g.moveTo(-22, -12); g.lineTo(-18, -20); g.lineTo(18, -20); g.lineTo(23, -13); g.lineTo(17, -9); g.lineTo(-17, -9); g.closePath(); fs(g, c.a, 1.4);
    g.strokeStyle = '#37474f'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-12, -20); g.lineTo(-8, -34); g.lineTo(8, -34); g.lineTo(12, -20); g.stroke();
    g.fillStyle = c.c; g.fillRect(-18, -17, 36, 2.5);
    if (m) rider(g, 0, -20);
  },
  jeep(g, c, t, mv, m) {
    wheel(g, -15, -8, 8.5, mv ? t : 0); wheel(g, 15, -8, 8.5, mv ? t : 0);
    rr(g, -24, -24, 48, 15, 3); fs(g, c.a, 1.5); rr(g, -24, -14, 48, 4, 1); fs(g, c.b, 1);
    g.beginPath(); g.moveTo(4, -24); g.lineTo(10, -34); g.lineTo(13, -34); g.lineTo(9, -24); g.closePath(); fs(g, c.gl, 1.2);
    circ(g, -26, -18, 6); fs(g, '#212121', 1.2); g.fillStyle = '#ffeb3b'; g.fillRect(21, -21, 3, 3);
    if (m) rider(g, -4, -24);
  },
  rover(g, c, t, mv) {
    for (const x of [-20, 0, 20]) wheel(g, x, -7, 7, mv ? t : 0);
    g.beginPath(); g.moveTo(-28, -12); g.lineTo(-26, -28); g.lineTo(14, -30); g.lineTo(27, -18); g.lineTo(27, -12); g.closePath(); fs(g, c.a, 1.5);
    rr(g, -18, -26, 16, 6, 2); fs(g, c.b, 1); rr(g, 8, -27, 10, 5, 2); fs(g, c.gl, 1);
    g.fillStyle = c.c; g.fillRect(-24, -16, 48, 2);
  },
  apc(g, c, t, mv) {
    for (const x of [-20, -7, 7, 20]) wheel(g, x, -7, 6.5, mv ? t : 0);
    g.beginPath(); g.moveTo(-28, -11); g.lineTo(-28, -26); g.lineTo(18, -28); g.lineTo(29, -18); g.lineTo(29, -11); g.closePath(); fs(g, c.a, 1.6);
    g.strokeStyle = c.b; g.lineWidth = 1.5; for (const x of [-16, -4, 8]) { g.strokeRect(x, -24, 10, 9); }
    rr(g, 14, -26, 8, 4, 1); fs(g, c.gl, 1); g.fillStyle = c.c; g.fillRect(-28, -13, 57, 2);
  },
  tank(g, c, t, mv) {
    rr(g, -28, -14, 56, 13, 6); fs(g, '#37474f', 1.5);
    for (let i = 0; i < 6; i++) { circ(g, -21 + i * 8.4, -7.5, 4); fs(g, '#616161', 1); }
    g.strokeStyle = '#212121'; g.lineWidth = 1; g.setLineDash([3, 3]); g.lineDashOffset = mv ? -t * 60 : 0; rr(g, -28, -14, 56, 13, 6); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(-26, -14); g.lineTo(-22, -22); g.lineTo(22, -22); g.lineTo(28, -14); g.closePath(); fs(g, c.a, 1.5);
    g.beginPath(); g.ellipse(0, -24, 13, 8, 0, Math.PI, 0); g.closePath(); fs(g, c.b, 1.4); g.fillStyle = c.c; g.fillRect(-10, -26, 6, 2);
  },
  hbike(g, c, t) {
    g.fillStyle = c.c; g.globalAlpha = .45 + .25 * Math.sin(t * 20); g.beginPath(); g.ellipse(0, -4, 18, 3, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(-20, -10); g.lineTo(-8, -20); g.lineTo(14, -19); g.lineTo(22, -12); g.lineTo(6, -7); g.lineTo(-16, -7); g.closePath(); fs(g, c.a, 1.4);
    g.strokeStyle = c.c; g.lineWidth = 2; g.beginPath(); g.moveTo(-16, -11); g.lineTo(16, -13); g.stroke();
    rr(g, -18, -8, 8, 4, 2); fs(g, c.b, 1); rr(g, 10, -9, 8, 4, 2); fs(g, c.b, 1);
  },
  htank(g, c, t) {
    g.fillStyle = c.c; g.globalAlpha = .4 + .2 * Math.sin(t * 16); g.beginPath(); g.ellipse(0, -3, 26, 4, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(-30, -8); g.lineTo(-24, -20); g.lineTo(22, -20); g.lineTo(31, -10); g.lineTo(24, -6); g.lineTo(-24, -6); g.closePath(); fs(g, c.a, 1.6);
    g.beginPath(); g.moveTo(-14, -20); g.lineTo(-8, -30); g.lineTo(12, -30); g.lineTo(16, -20); g.closePath(); fs(g, c.b, 1.4);
    g.strokeStyle = c.c; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-24, -13); g.lineTo(24, -13); g.stroke();
  },
  minibot(g, c, t, mv) {
    const ph = mv ? t * 12 : 0; leg(g, -5, -14, 14, ph, 3.5, c.b); leg(g, 5, -14, 14, ph + Math.PI, 3.5, c.b);
    rr(g, -10, -30, 20, 17, 4); fs(g, c.a, 1.5); rr(g, -7, -38, 14, 9, 3); fs(g, c.b, 1.3);
    g.fillStyle = c.c; g.fillRect(-4, -35, 10, 3);
  },
  mech(g, c, t, mv) {
    const ph = mv ? t * 9 : 0; leg(g, -7, -20, 20, ph, 5, c.b); leg(g, 7, -20, 20, ph + Math.PI, 5, c.b);
    g.beginPath(); g.moveTo(-14, -20); g.lineTo(-16, -38); g.lineTo(14, -40); g.lineTo(16, -20); g.closePath(); fs(g, c.a, 1.6);
    rr(g, -20, -42, 10, 9, 3); fs(g, c.b, 1.3); rr(g, 10, -42, 10, 9, 3); fs(g, c.b, 1.3);
    cockpit(g, 2, -32, 8, 6, c.gl);
  },
  spider(g, c, t, mv) {
    const ph = mv ? t * 14 : 0;
    for (let i = 0; i < 4; i++) { const x = -18 + i * 12, s = Math.sin(ph + i * 1.6) * 4; g.lineCap = 'round'; line(g, x * .6, -18, x, -28 + s, 5, OL); line(g, x, -28 + s, x * 1.2 + 4, -2, 5, OL); line(g, x * .6, -18, x, -28 + s, 3, c.b); line(g, x, -28 + s, x * 1.2 + 4, -2, 3, c.b); }
    g.beginPath(); g.ellipse(0, -20, 18, 9, 0, 0, TAU); fs(g, c.a, 1.5); cockpit(g, 6, -24, 7, 5, c.gl); g.fillStyle = c.c; g.fillRect(-14, -19, 10, 2);
  },
  titan(g, c, t, mv) {
    const ph = mv ? t * 6 : 0; leg(g, -10, -30, 28, ph, 8, c.b); leg(g, 10, -30, 28, ph + Math.PI, 8, c.b);
    g.beginPath(); g.moveTo(-20, -28); g.lineTo(-24, -54); g.lineTo(20, -58); g.lineTo(24, -28); g.closePath(); fs(g, c.a, 1.8);
    rr(g, -30, -62, 16, 14, 4); fs(g, c.b, 1.5); rr(g, 14, -62, 16, 14, 4); fs(g, c.b, 1.5);
    rr(g, -7, -66, 14, 10, 3); fs(g, c.b, 1.4); g.fillStyle = c.c; g.fillRect(-4, -63, 10, 3);
    cockpit(g, 4, -44, 9, 7, c.gl); g.fillStyle = c.c; g.fillRect(-18, -34, 36, 3);
  },
  heli(g, c, t) {
    line(g, -10, -2, 12, -2, 2.5, '#424242'); line(g, -6, -2, -4, -10, 2, '#424242'); line(g, 8, -2, 6, -10, 2, '#424242');
    g.beginPath(); g.moveTo(-14, -12); g.quadraticCurveTo(-16, -28, 4, -28); g.quadraticCurveTo(22, -26, 22, -16); g.lineTo(14, -10); g.closePath(); fs(g, c.a, 1.5);
    g.beginPath(); g.moveTo(-12, -20); g.lineTo(-38, -22); g.lineTo(-38, -18); g.lineTo(-12, -15); g.closePath(); fs(g, c.b, 1.2);
    g.save(); g.translate(-38, -22); g.rotate(t * 40); line(g, -6, 0, 6, 0, 2, '#9e9e9e'); g.restore();
    g.beginPath(); g.ellipse(10, -20, 8, 6, 0, 0, TAU); fs(g, c.gl, 1.2);
    line(g, 0, -28, 0, -33, 3, '#424242'); g.globalAlpha = .6; const L = 30 * Math.abs(Math.sin(t * 25)); line(g, -L, -34, L, -34, 2.5, '#cfd8dc'); g.globalAlpha = 1;
  },
  jet(g, c, t) {
    g.fillStyle = '#ff9800'; g.globalAlpha = .7 + .3 * Math.random(); g.beginPath(); g.moveTo(-26, -18); g.lineTo(-38 - Math.random() * 8, -16); g.lineTo(-26, -14); g.fill(); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(-26, -20); g.lineTo(14, -22); g.lineTo(30, -16); g.lineTo(14, -12); g.lineTo(-26, -12); g.closePath(); fs(g, c.a, 1.5);
    g.beginPath(); g.moveTo(-8, -16); g.lineTo(-18, -4); g.lineTo(-10, -4); g.lineTo(6, -14); g.closePath(); fs(g, c.b, 1.2);
    g.beginPath(); g.moveTo(-20, -20); g.lineTo(-26, -32); g.lineTo(-18, -32); g.lineTo(-12, -20); g.closePath(); fs(g, c.b, 1.2);
    g.beginPath(); g.ellipse(10, -21, 9, 4, -.1, Math.PI, 0); g.closePath(); fs(g, c.gl, 1.2); g.fillStyle = c.c; g.fillRect(-20, -17, 26, 2);
  },
  dpod(g, c, t) {
    line(g, -20, -22, 20, -22, 3, '#455a64');
    for (const x of [-20, 20]) { circ(g, x, -24, 3); fs(g, '#263238', 1); g.globalAlpha = .55; line(g, x - 9 * Math.abs(Math.cos(t * 30)), -27, x + 9 * Math.abs(Math.cos(t * 30)), -27, 2, '#b0bec5'); g.globalAlpha = 1; }
    g.beginPath(); g.ellipse(0, -18, 12, 10, 0, 0, TAU); fs(g, c.a, 1.5); g.beginPath(); g.ellipse(2, -21, 8, 6, 0, 0, TAU); fs(g, c.gl, 1.1);
    g.fillStyle = c.c; circ(g, 0, -9, 2.5); g.fill();
  },
  gunship(g, c, t) {
    g.beginPath(); g.moveTo(-30, -16); g.quadraticCurveTo(-30, -32, -6, -32); g.lineTo(18, -30); g.quadraticCurveTo(32, -26, 30, -16); g.lineTo(-24, -12); g.closePath(); fs(g, c.a, 1.6);
    rr(g, -8, -26, 14, 10, 2); fs(g, '#263238', 1); g.beginPath(); g.ellipse(18, -24, 9, 6, 0, 0, TAU); fs(g, c.gl, 1.2);
    for (const x of [-22, 16]) { rr(g, x - 4, -40, 8, 8, 2); fs(g, c.b, 1.2); g.globalAlpha = .55; const L = 16 * Math.abs(Math.sin(t * 26 + x)); line(g, x - L, -41, x + L, -41, 2, '#cfd8dc'); g.globalAlpha = 1; }
  },
  saucer(g, c, t) {
    g.fillStyle = c.c; g.globalAlpha = .25; g.beginPath(); g.moveTo(-8, -12); g.lineTo(8, -12); g.lineTo(14, 0); g.lineTo(-14, 0); g.fill(); g.globalAlpha = 1;
    g.beginPath(); g.ellipse(0, -16, 28, 8, 0, 0, TAU); fs(g, c.a, 1.6); g.beginPath(); g.ellipse(0, -14, 20, 4, 0, 0, Math.PI); fs(g, c.b, 1);
    g.beginPath(); g.ellipse(0, -22, 11, 10, 0, Math.PI, 0); g.closePath(); fs(g, c.gl, 1.3);
    for (let i = 0; i < 6; i++) { const a = t * 3 + i * TAU / 6, x = Math.cos(a) * 24; if (Math.sin(a) < 0) continue; g.fillStyle = i % 2 ? c.c : '#fff59d'; circ(g, x, -15, 2.2); g.fill(); }
  }
};
// 부착물 (같은 차체라도 모양이 달라지는 장비 부품)
function drawKit(g, k, ch, c, t) {
  const r = ch.r, top = -ch.mh - 6;
  switch (k) {
    case 'plates': rr(g, -r * .6, top + 12, r * .5, 6, 1); fs(g, c.b, 1.2); rr(g, r * .1, top + 12, r * .45, 6, 1); fs(g, c.b, 1.2); break;
    case 'spikes': if (ch.cat === 'air') break; g.fillStyle = '#cfd8dc'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(r * .95, -8 - i * 5); g.lineTo(r * 1.3, -10 - i * 5); g.lineTo(r * .95, -12 - i * 5); g.fill(); } break;
    case 'antenna': line(g, -r * .5, top + 8, -r * .65, top - 10, 1.5, '#424242'); g.fillStyle = Math.sin(t * 6) > 0 ? '#ff1744' : '#5d0000'; circ(g, -r * .65, top - 10, 2); g.fill(); break;
    case 'pods': rr(g, -r * .9, top + 16, 10, 8, 2); fs(g, c.b, 1.2); g.fillStyle = c.c; circ(g, -r * .9 + 5, top + 20, 2); g.fill(); break;
    case 'lights': g.fillStyle = 'rgba(255,245,157,.35)'; g.beginPath(); g.moveTo(r * .9, -14); g.lineTo(r * 2, -22); g.lineTo(r * 2, -6); g.closePath(); g.fill(); g.fillStyle = '#fff59d'; circ(g, r * .9, -14, 2.5); g.fill(); break;
    case 'exhaust': line(g, -r * .85, -16, -r * 1.05, -24, 3, '#616161'); g.fillStyle = 'rgba(120,120,120,.4)'; circ(g, -r * 1.1, -28 - (t * 20 % 8), 3 + (t * 20 % 8) * .4); g.fill(); break;
    case 'radar': g.save(); g.translate(-r * .3, top + 4); g.scale(Math.cos(t * 3), 1); g.beginPath(); g.arc(0, 0, 6, Math.PI, 0); fs(g, '#cfd8dc', 1); g.restore(); break;
    case 'stripes': g.strokeStyle = c.c; g.lineWidth = 2; g.beginPath(); g.moveTo(-r * .7, top + 18); g.lineTo(-r * .4, top + 10); g.moveTo(-r * .45, top + 18); g.lineTo(-r * .15, top + 10); g.stroke(); break;
    case 'wings': g.beginPath(); g.moveTo(-4, -14); g.lineTo(-14, -2); g.lineTo(-6, -2); g.lineTo(6, -12); g.closePath(); fs(g, c.c, 1); break;
    case 'shieldgen': g.globalAlpha = .25 + .15 * Math.sin(t * 5); g.strokeStyle = c.c; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -ch.mh * .6, r * 1.15, r * .9, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; break;
  }
}
// 무기 장착부 14종 (포구 방향 = +x)
function drawWMount(g, key, col, atk, spin, t) {
  g.lineJoin = 'round';
  switch (key) {
    case 'mg': rr(g, -6, -4, 14, 8, 2); fs(g, '#455a64', 1.2); g.fillStyle = '#263238'; g.fillRect(8, -3, 14, 2); g.fillRect(8, 1, 14, 2); break;
    case 'minigun': circ(g, 0, 0, 6); fs(g, '#546e7a', 1.2); g.save(); g.translate(14, 0); for (let i = 0; i < 3; i++) { const y = Math.sin(spin * 40 + i * 2.1) * 3; g.fillStyle = i === 0 ? '#90a4ae' : '#607d8b'; g.fillRect(-8, y - 1, 16, 2); } g.restore(); rr(g, 20, -4, 4, 8, 1); fs(g, '#37474f', 1); break;
    case 'rocket': rr(g, -6, -7, 22, 14, 2); fs(g, '#4e5b31', 1.3); g.fillStyle = '#212121'; circ(g, 15, -3.5, 2.8); g.fill(); circ(g, 15, 3.5, 2.8); g.fill(); g.fillStyle = col; g.fillRect(-4, -7, 3, 14); break;
    case 'homing': rr(g, -6, -8, 18, 16, 2); fs(g, '#546e7a', 1.3); g.fillStyle = '#ff7043'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(12, -6 + i * 4); g.lineTo(16, -5 + i * 4); g.lineTo(12, -4 + i * 4); g.fill(); } break;
    case 'grenade': rr(g, -4, -5, 16, 10, 4); fs(g, '#558b2f', 1.3); circ(g, 13, 0, 5); fs(g, '#33691e', 1.2); g.fillStyle = '#111'; circ(g, 14, 0, 2.6); g.fill(); break;
    case 'shell': rr(g, -8, -6, 12, 12, 3); fs(g, '#455a64', 1.3); rr(g, 2, -3, 30, 6, 2); fs(g, '#37474f', 1.3); rr(g, 30, -4.5, 7, 9, 1.5); fs(g, '#263238', 1.2); break;
    case 'mortar': g.save(); g.rotate(-0.5); rr(g, -4, -5, 20, 10, 3); fs(g, '#5d4037', 1.3); circ(g, 16, 0, 5); fs(g, '#3e2723', 1); g.restore(); break;
    case 'laser': rr(g, -4, -4, 18, 8, 4); fs(g, '#eceff1', 1.2); g.fillStyle = col; g.fillRect(0, -1.5, 12, 3); if (QC.glow) { g.globalAlpha = .5 + atk * .5; g.drawImage(glowSprite(col), 10, -9, 18, 18); g.globalAlpha = 1; } circ(g, 16, 0, 2.6); fs(g, col, 0); break;
    case 'plasma': rr(g, -6, -6, 16, 12, 5); fs(g, '#311b92', 1.3); circ(g, 13, 0, 6); fs(g, '#4a148c', 1.2); if (QC.glow) g.drawImage(glowSprite(col), 3, -10, 20, 20); g.fillStyle = col; circ(g, 13, 0, 3.5 + Math.sin(t * 12)); g.fill(); break;
    case 'flame': circ(g, -4, 2, 6); fs(g, '#e53935', 1.2); rr(g, -2, -3, 20, 6, 2); fs(g, '#616161', 1.2); g.fillStyle = '#ff6d00'; g.fillRect(17, -2, 3, 4); break;
    case 'rail': rr(g, -6, -5, 14, 10, 2); fs(g, '#263238', 1.3); g.fillStyle = '#37474f'; g.fillRect(6, -5, 30, 3); g.fillRect(6, 2, 30, 3); g.strokeStyle = col; g.lineWidth = 1.4; g.globalAlpha = .6 + .4 * Math.sin(t * 10); g.beginPath(); g.moveTo(8, 0); g.lineTo(34, 0); g.stroke(); g.globalAlpha = 1; break;
    case 'tesla': rr(g, -5, -5, 10, 10, 2); fs(g, '#455a64', 1.2); for (let i = 0; i < 4; i++) { circ(g, 8 + i * 3.5, 0, 4.5 - i * .5); fs(g, i % 2 ? '#b0bec5' : '#78909c', .8); } g.fillStyle = col; circ(g, 22, 0, 3); g.fill(); if (Math.random() < .4) { g.strokeStyle = '#e1bee7'; g.lineWidth = 1; g.beginPath(); g.moveTo(22, 0); g.lineTo(26 + Math.random() * 4, (Math.random() - .5) * 10); g.stroke(); } break;
    case 'mlrs': rr(g, -8, -9, 22, 18, 2); fs(g, '#4e5b31', 1.3); g.fillStyle = '#212121'; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { circ(g, 12, -5.5 + j * 5.5, 1.8); g.fill(); } g.fillStyle = col; g.fillRect(-8, -1, 6, 2); break;
    case 'beam': rr(g, -6, -5, 14, 10, 3); fs(g, '#263238', 1.3); g.beginPath(); g.ellipse(12, 0, 4, 9, 0, 0, TAU); fs(g, '#90a4ae', 1.2); g.fillStyle = col; g.beginPath(); g.ellipse(13, 0, 2, 6, 0, 0, TAU); g.fill(); break;
  }
}
function drawVehicle(g, v, x, y, mounted) {
  const ch = v.ch, c = v.def.col, t = G.time + v.bob, face = v.face || 1;
  const air = ch.cat === 'air', hov = ch.cat === 'hover';
  let alt = air ? 16 + Math.sin(t * 3) * 2 : hov ? 5 + Math.sin(t * 4) * 1.5 : 0;
  if (v.hoverT > 0) alt += 22 * Math.sin(Math.min(1, (1.4 - v.hoverT) / 0.3) * Math.PI / 2) * Math.min(1, v.hoverT / 0.3);
  const dk = v.drop ? Math.min(1, v.drop.t / v.drop.dur) : 1; if (v.drop) alt += (1 - dk) * 300;
  g.save(); g.translate(x, y + ch.r * 0.55); g.scale(1.15, 1.15);
  g.fillStyle = `rgba(0,0,0,${.12 + .18 * dk})`; g.beginPath(); g.ellipse(0, 0, ch.r * (air ? .9 : 1.15) * (.5 + .5 * dk), ch.r * .3 * (.5 + .5 * dk), 0, 0, TAU); g.fill();
  if (mounted) { g.strokeStyle = 'rgba(120,220,255,.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, ch.r * 1.25, ch.r * .38, 0, 0, TAU); g.stroke(); }
  if (mounted && P.inv > 0 && P.dashT <= 0 && Math.floor(G.time * 20) % 2) g.globalAlpha = .55;
  g.translate(0, -alt);
  const tilt = mounted && P.moving && !ch.cat.includes('mech') ? (air ? .08 : .03) * (P.lastMx * face > 0 ? 1 : -1) : 0;
  g.save(); g.scale(face, 1); g.rotate(tilt); g.lineJoin = 'round';
  VBODY[v.def.ch](g, c, t, mounted && P.moving, mounted);
  for (const k of v.def.kit) drawKit(g, k, ch, c, t);
  if (v.flash > 0) { g.globalAlpha = .45; g.fillStyle = '#ff5252'; g.beginPath(); g.ellipse(0, -ch.mh * .6, ch.r * 1.1, ch.r * .8, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
  g.restore();
  // 무기 장착부: 조준 방향으로 회전
  const drawMount = (key, aim, dx, dy, sc) => {
    g.save(); g.translate(dx * face, dy); g.rotate(aim); if (Math.cos(aim) < 0) g.scale(1, -1); g.scale(sc, sc); g.translate(-(v.recoil || 0) * .6, 0);
    const S = v.sl[0] || {}; drawWMount(g, key, VWPN[key].col, mounted && P.atkT > 0 ? 1 : 0, S.spin || 0, t); g.restore();
  };
  const big = ch.r >= 24 ? 1.15 : ch.r >= 20 ? .95 : .85;
  const a1 = mounted ? v.aim : (face > 0 ? 0 : Math.PI);
  if (ch.cat === 'mech' && v.def.ch !== 'spider') { drawMount(v.def.wp, a1, ch.r * .55, -ch.mh * .85, big); if (v.def.sub) drawMount(v.def.sub, mounted ? v.aim2 : a1, -ch.r * .55, -ch.mh * .85, big * .8); }
  else { drawMount(v.def.wp, a1, ch.r * .1, -ch.mh - (air ? -10 : 2), big); if (v.def.sub) drawMount(v.def.sub, mounted ? v.aim2 : a1, -ch.r * .45, -ch.mh - (air ? -14 : 6), .8); }
  if (v.drop) { // 낙하산
    const sw = Math.sin(G.time * 2.4 + v.bob) * .12; g.save(); g.rotate(sw); const top = -ch.mh - 70;
    g.strokeStyle = '#eceff1'; g.lineWidth = 1.2; g.beginPath(); for (const sx of [-34, -12, 12, 34]) { g.moveTo(sx, top); g.lineTo(sx * .35, -ch.mh * .8); } g.stroke();
    g.beginPath(); g.moveTo(-40, top); g.quadraticCurveTo(-36, top - 46, 0, top - 50); g.quadraticCurveTo(36, top - 46, 40, top); g.quadraticCurveTo(20, top - 8, 0, top - 2); g.quadraticCurveTo(-20, top - 8, -40, top); g.closePath(); fs(g, '#ff7043', 1.6);
    g.fillStyle = '#fff3e0'; g.beginPath(); g.moveTo(-14, top - 5); g.quadraticCurveTo(-10, top - 44, 0, top - 48); g.quadraticCurveTo(10, top - 44, 14, top - 5); g.closePath(); g.fill(); g.restore();
  }
  g.restore(); g.globalAlpha = 1;
  // 주차된 장비: 탑승 안내
  if (!mounted && v.drop) { g.font = '900 11px "Noto Sans KR",sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000'; const ty = y - ch.mh - 40; g.strokeText('🪂 투하 중 ' + Math.max(0, v.drop.dur - v.drop.t).toFixed(1) + '초', x, ty); g.fillStyle = '#ffccbc'; g.fillText('🪂 투하 중 ' + Math.max(0, v.drop.dur - v.drop.t).toFixed(1) + '초', x, ty); }
  else if (!mounted) {
    const near = G.rideNear === v, by = y - ch.mh - 30 - Math.abs(Math.sin(G.time * 4)) * 6;
    g.fillStyle = near ? '#64ffda' : '#4dd0e1'; g.beginPath(); g.moveTo(x - 7, by - 10); g.lineTo(x + 7, by - 10); g.lineTo(x, by); g.closePath(); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke();
    g.font = '900 10px "Noto Sans KR",sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000';
    const nm = (v.bonus ? '⭐ ' : '') + v.def.name; g.strokeText(nm, x, by - 15); g.fillStyle = near ? '#64ffda' : '#e0f7fa'; g.fillText(nm, x, by - 15);
    if (v.hp < v.maxHp) { const w = 40; g.fillStyle = '#000a'; g.fillRect(x - w / 2, by - 30, w, 4); g.fillStyle = '#4dd0e1'; g.fillRect(x - w / 2, by - 30, w * v.hp / v.maxHp, 4); }
    if (near) { g.strokeStyle = 'rgba(100,255,218,.8)'; g.lineWidth = 2; g.setLineDash([6, 5]); circ(g, x, y, ch.r + 22); g.stroke(); g.setLineDash([]); }
  }
}
/* ------------------------- AI 동료 ------------------------- */
function drawAlly(g, a, x, y, staticPose) {
  const c = a.c || ACL[a.cls], cls = a.cls || a.spec.cls, sp = a.spec || a, hue = sp.hue || 120;
  const uni = sp.special ? '#5d4037' : hsl(hue, 28, 36), uni2 = sp.special ? '#3e2723' : hsl(hue, 26, 24);
  const mv = !staticPose && a.moving, s = mv ? Math.sin((a.walkT || 0) * 14) : 0, face = a.face || 1, t = G.time;
  g.save(); g.translate(x, y);
  if (a.down > 0) { g.globalAlpha = .6; g.rotate(Math.PI / 2 * face); }
  if (a.flash > 0) g.globalAlpha = .55;
  const fly = c.fly, fy = fly ? -20 - Math.sin(t * 4 + (a.id || 0) * 9) * 3 : 0;
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 9, fly ? 8 : 10, 3, 0, 0, TAU); g.fill();
  if (!staticPose && a.down <= 0) { g.strokeStyle = sp.special ? 'rgba(255,213,79,.85)' : 'rgba(105,240,174,.7)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 9, 12, 4, 0, 0, TAU); g.stroke(); }
  g.translate(0, fy); g.save(); g.scale(face, 1); g.lineJoin = 'round';
  const k = c.kind;
  if (k === 'soldier') {
    rr(g, -5, 2 + s * 1.5, 4, 7, 1.5); fs(g, uni2, 1.2); rr(g, 1, 2 - s * 1.5, 4, 7, 1.5); fs(g, uni2, 1.2);
    if (cls === 'flame') { rr(g, -10, -9, 6, 11, 2); fs(g, '#e53935', 1.2); }
    if (cls === 'medic') { rr(g, -10, -6, 5, 7, 1.5); fs(g, '#eceff1', 1); }
    rr(g, -6, -8, 12, 11, 3); fs(g, cls === 'medic' ? '#eceff1' : uni, 1.4);
    circ(g, 0, -13, 6.5); fs(g, '#ffe0bd', 1.3);
    if (cls === 'sniper') { g.beginPath(); g.arc(0, -14, 7.4, Math.PI * .9, Math.PI * 2.05); g.closePath(); fs(g, '#558b2f', 1.2); g.fillStyle = '#33691e'; for (let i = 0; i < 3; i++) g.fillRect(-6 + i * 4, -19, 2, 3); }
    else { g.beginPath(); g.arc(0, -14, 7, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(7, -12.5); g.lineTo(-7, -12.5); g.closePath(); fs(g, cls === 'medic' ? '#fafafa' : uni2, 1.2); if (cls === 'medic') { g.fillStyle = '#e53935'; g.fillRect(-1, -20, 2, 5); g.fillRect(-3, -18, 6, 1.6); } }
    g.fillStyle = '#1a1a2e'; circ(g, 3, -12, 1.2); g.fill();
    if (sp.perk === 'vet' || sp.special) { g.fillStyle = '#ffd54f'; g.fillRect(-6, -3, 12, 1.6); }
  } else if (k === 'beast') {
    const wolf = cls === 'wolf', col = wolf ? '#78909c' : '#8d6e63', dk = wolf ? '#455a64' : '#5d4037';
    for (const [lx, ph] of [[-7, 0], [6, Math.PI]]) { const sw = mv ? Math.sin((a.walkT || 0) * 18 + ph) * 3 : 0; line(g, lx + sw, 0, lx - sw, 8, 3.5, OL); line(g, lx + sw, 0, lx - sw, 8, 2.2, dk); }
    g.beginPath(); g.ellipse(0, -2, wolf ? 12 : 10, 6, 0, 0, TAU); fs(g, col, 1.3);
    g.beginPath(); g.moveTo(-10, -4); g.quadraticCurveTo(-18, -10 + Math.sin(t * 10) * 2, -16, -2); fs(g, col, 1);
    g.beginPath(); g.ellipse(11, -7, 6, 5, 0, 0, TAU); fs(g, col, 1.2); g.beginPath(); g.moveTo(14, -6); g.lineTo(20, -4); g.lineTo(14, -3); g.closePath(); fs(g, dk, 1);
    g.beginPath(); g.moveTo(8, -11); g.lineTo(9, -16); g.lineTo(12, -11); g.closePath(); fs(g, dk, 1);
    g.fillStyle = wolf ? '#ff1744' : '#111'; circ(g, 13, -8, 1.4); g.fill();
    if (cls === 'dog') { g.fillStyle = '#d32f2f'; g.fillRect(6, -4, 6, 2); } else { g.fillStyle = '#b0bec5'; g.fillRect(-4, -8, 8, 2); }
    if (a.bite > 0) { a.bite -= 0.016; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(19, -6); g.lineTo(23, -4); g.lineTo(19, -2); g.fill(); }
  } else if (k === 'drone') {
    line(g, -12, -2, 12, -2, 2.5, '#455a64');
    for (const dx of [-12, 12]) { g.globalAlpha = .6; const L = 7 * Math.abs(Math.cos(t * 30 + dx)); line(g, dx - L, -5, dx + L, -5, 2, '#cfd8dc'); g.globalAlpha = 1; }
    g.beginPath(); g.ellipse(0, 0, 8, 6, 0, 0, TAU); fs(g, sp.special ? '#ffca28' : hsl(hue, 40, 55), 1.3); g.fillStyle = '#18ffff'; circ(g, 4, 1, 2.2); g.fill();
  } else if (k === 'robot') {
    rr(g, -9, 2, 18, 6, 3); fs(g, '#37474f', 1.2); rr(g, -8, -14, 16, 16, 3); fs(g, sp.special ? '#ffb300' : hsl(hue, 20, 55), 1.4);
    g.fillStyle = '#18ffff'; g.fillRect(-2, -10, 8, 3);
    g.globalAlpha = .4 + .2 * Math.sin(t * 6); g.beginPath(); g.ellipse(11, -5, 4, 12, 0, 0, TAU); fs(g, '#80d8ff', 1.2); g.globalAlpha = a.flash > 0 ? .55 : 1;
  } else if (k === 'mecha') {
    const ph = mv ? (a.walkT || 0) * 10 : 0; leg(g, -4, -6, 12, ph, 3.5, '#455a64'); leg(g, 4, -6, 12, ph + Math.PI, 3.5, '#455a64');
    rr(g, -9, -20, 18, 15, 3); fs(g, sp.special ? '#ffb300' : hsl(hue, 30, 48), 1.4); rr(g, -6, -26, 10, 7, 2); fs(g, '#37474f', 1.2); g.fillStyle = '#ff5252'; g.fillRect(-2, -24, 5, 2);
  }
  g.restore();
  // 총 / 무기 (조준 방향)
  if (k === 'soldier' || k === 'mecha' || k === 'robot') {
    const ang = a.atkT > 0 ? a.aim : (face > 0 ? 0 : Math.PI);
    g.save(); g.translate(0, k === 'mecha' ? -14 : -4); g.rotate(ang); if (Math.cos(ang) < 0) g.scale(1, -1);
    if (cls === 'sniper') { rr(g, -4, -2, 24, 4, 1.5); fs(g, '#37474f', 1); g.fillStyle = '#90caf9'; g.fillRect(4, -5, 6, 3); }
    else if (cls === 'rocket') { rr(g, -10, -4, 24, 8, 3); fs(g, '#4e5b31', 1.2); g.fillStyle = '#ff7043'; circ(g, 14, 0, 2.5); g.fill(); }
    else if (cls === 'flame') { rr(g, -2, -2, 16, 4, 1.5); fs(g, '#616161', 1); g.fillStyle = '#ff6d00'; g.fillRect(13, -2, 3, 4); }
    else if (cls === 'medic') { rr(g, 0, -2, 9, 4, 1.5); fs(g, '#546e7a', 1); }
    else if (k === 'mecha') { rr(g, -4, -4, 22, 8, 2); fs(g, '#37474f', 1.2); }
    else if (k === 'robot') { rr(g, 0, -2, 12, 4, 1.5); fs(g, '#263238', 1); }
    else { rr(g, -3, -2, 17, 4, 1.5); fs(g, '#37474f', 1); }
    g.restore();
  }
  if (cls === 'flame' && a.fireOn && a.down <= 0 && QC.glow) { g.globalAlpha = .18; g.fillStyle = '#ff6d00'; g.beginPath(); g.moveTo(0, -4); g.arc(0, -4, 120, a.fireAng - .45, a.fireAng + .45); g.closePath(); g.fill(); g.globalAlpha = 1; }
  g.restore(); g.globalAlpha = 1;
  if (!staticPose) {
    const w = 22, hy = y + 13; g.fillStyle = '#000a'; g.fillRect(x - w / 2, hy, w, 3); g.fillStyle = a.down > 0 ? '#ff5252' : sp.special ? '#ffd54f' : '#69f0ae'; g.fillRect(x - w / 2, hy, w * (a.down > 0 ? 1 - a.down / 15 : a.hp / a.maxHp), 3);
    if (a.down > 0) { g.font = '900 11px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ff8a80'; g.fillText('✚ ' + Math.ceil(a.down), x, y - 20); }
    else if (sp.special) { g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillText('⭐', x, y - 30 + fy); }
  }
}
/* ------------------------- 구조 장소 ------------------------- */
function drawRescue(r) {
  const x = r.x, y = r.y, t = G.time, k = r.prog / r.need;
  // 구조 범위 + 진행도
  ctx.save(); ctx.translate(x, y); ctx.scale(1, .55);
  if (r.active) { ctx.fillStyle = 'rgba(105,240,174,.13)'; circ(ctx, 0, 0, r.r); ctx.fill(); }
  ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 20; ctx.strokeStyle = 'rgba(105,240,174,.7)'; ctx.lineWidth = 2.5; circ(ctx, 0, 0, r.r); ctx.stroke(); ctx.setLineDash([]);
  if (k > 0) { ctx.strokeStyle = '#69f0ae'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, r.r, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke(); }
  ctx.restore();
  drawAlly(ctx, { spec: r.spec, cls: r.spec.cls, c: ACL[r.spec.cls], face: Math.sin(t * .7 + x) > 0 ? 1 : -1, down: 0, id: x }, x, y, true);
  if (r.kind === 'cage') { ctx.strokeStyle = '#78909c'; ctx.lineWidth = 2.5; for (let i = -2; i <= 2; i++) line(ctx, x + i * 7, y - 34, x + i * 7, y + 10, 2.5, '#78909c'); rr(ctx, x - 18, y - 38, 36, 6, 2); fs(ctx, '#546e7a', 1.4); rr(ctx, x - 18, y + 8, 36, 6, 2); fs(ctx, '#546e7a', 1.4); ctx.fillStyle = '#ffd54f'; ctx.fillRect(x + 12, y - 16, 5, 6); }
  else if (r.kind === 'capsule') { ctx.globalAlpha = .35; ctx.fillStyle = '#80deea'; ctx.beginPath(); ctx.ellipse(x, y - 12, 18, 26, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#e0f7fa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 12, 18, 26, 0, 0, TAU); ctx.stroke(); rr(ctx, x - 20, y + 8, 40, 7, 3); fs(ctx, '#37474f', 1.4); ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff1744' : '#69f0ae'; circ(ctx, x, y + 11, 2); ctx.fill(); }
  else { rr(ctx, x - 26, y - 30, 6, 42, 2); fs(ctx, '#5d4037', 1.3); ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(x - 20, y - 20); ctx.quadraticCurveTo(x - 10, y - 6, x - 2, y - 4); ctx.stroke(); ctx.setLineDash([]); }
  ctx.font = '900 10px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
  const lab = r.active ? `구조 중 ${Math.floor(k * 100)}%` : '🆘 구조 요청';
  ctx.strokeText(lab, x, y - 46); ctx.fillStyle = '#b9f6ca'; ctx.fillText(lab, x, y - 46);
  ctx.font = '700 9px "Noto Sans KR",sans-serif'; ctx.strokeText(r.spec.name, x, y - 58); ctx.fillStyle = '#fff'; ctx.fillText(r.spec.name, x, y - 58);
}
function drawZone(x, y, r, col, label, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, .55); ctx.fillStyle = col + '22'; circ(ctx, 0, 0, r); ctx.fill();
  ctx.setLineDash([12, 8]); ctx.lineDashOffset = G.time * 30; ctx.strokeStyle = col; ctx.lineWidth = 3; circ(ctx, 0, 0, r); ctx.stroke(); ctx.setLineDash([]);
  if (k > 0) { ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, k)); ctx.stroke(); }
  ctx.restore();
  ctx.font = '900 11px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(label, x, y - r * .55 - 8); ctx.fillStyle = col; ctx.fillText(label, x, y - r * .55 - 8);
}
function vis(x, y, m) { return Math.abs(x - G.camX) < VW / 2 + m && Math.abs(y - G.camY) < VH / 2 + m; }
function drawWorldExt(layer) {
  if (layer === 'under') {
    drawPools(); drawTurrets();
    if (G.hold && !G.hold.q.done && vis(G.hold.x, G.hold.y, 140)) drawZone(G.hold.x, G.hold.y, G.hold.r, '#ffab40', `🚩 구역 사수 ${Math.max(0, Math.ceil(G.hold.q.sec - G.hold.q.cur))}초`, G.hold.q.cur / G.hold.q.sec);
    const R = G.radio; if (R && vis(R.x, R.y, 160)) {
      drawZone(R.x, R.y, R.r, '#ffd54f', R.phase === 'go' ? '📻 고립된 아군' : `🛡️ 방어 ${Math.floor(R.prog / R.need * 100)}%`, R.prog / R.need);
      drawAlly(ctx, { spec: R.spec, cls: R.spec.cls, c: ACL[R.spec.cls], face: 1, down: 0, id: 3 }, R.x, R.y, true);
      if (Math.sin(G.time * 8) > 0) { ctx.fillStyle = '#ff1744'; circ(ctx, R.x + 14, R.y - 30, 3); ctx.fill(); }
    }
    for (const r of rescues) if (!r.done && vis(r.x, r.y, 120)) drawRescue(r);
    for (const v of vehs) if (!v.dead && v !== G.veh && vis(v.x, v.y, 90)) drawVehicle(ctx, v, v.x, v.y, false);
    for (const a of allies) if (!a.seated && !a.c.fly && vis(a.x, a.y, 40)) drawAlly(ctx, a, a.x, a.y, false);
  } else {
    for (const a of allies) if (!a.seated && a.c.fly && vis(a.x, a.y, 40)) drawAlly(ctx, a, a.x, a.y, false);
    const v = G.veh;
    if (v && v.ultBeam) { const [x1, y1, x2, y2] = v.ultBeam, w = 46 + Math.sin(G.time * 50) * 6; ctx.lineCap = 'round'; if (QC.glow) { ctx.globalAlpha = .35; ctx.strokeStyle = '#ff4081'; ctx.lineWidth = w * 2.2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); } ctx.globalAlpha = 1; ctx.strokeStyle = '#ff80ab'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = w * .35; ctx.stroke(); }
    if (v && v.beam) { const [x1, y1, x2, y2, col] = v.beam; ctx.lineCap = 'round'; if (QC.glow) { ctx.globalAlpha = .35; ctx.strokeStyle = col; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); } ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 9 + Math.sin(G.time * 40) * 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
    if (v) for (const S of v.sl) if (S && S.on && QC.glow && v.def.wp === 'flame') { ctx.globalAlpha = .16; ctx.fillStyle = '#ff6d00'; ctx.beginPath(); ctx.moveTo(P.x, P.y - v.ch.mh * .55); ctx.arc(P.x, P.y - v.ch.mh * .55, VWPN.flame.range, S.ang - .5, S.ang + .5); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
  }
}
function drawPickupExt(p) {
  const bob = Math.sin(G.time * 4 + p.x) * 2;
  if (p.kind === 'hpot') {
    const y = p.y - bob * 1.3;
    if (QC.glow) { ctx.globalAlpha = .55 + .2 * Math.sin(G.time * 5); ctx.drawImage(glowSprite('#ff1744'), p.x - 30, y - 36, 60, 60); ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(p.x, y); ctx.scale(1.25, 1.25);
    ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(4, -16); ctx.lineTo(4, -9); ctx.quadraticCurveTo(12, -5, 11, 3); ctx.quadraticCurveTo(10, 11, 0, 11); ctx.quadraticCurveTo(-10, 11, -11, 3); ctx.quadraticCurveTo(-12, -5, -4, -9); ctx.closePath(); fs(ctx, 'rgba(255,255,255,.85)', 1.6);
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(0, -3, 10, 0); ctx.quadraticCurveTo(10, 10, 0, 10); ctx.quadraticCurveTo(-10, 10, -10, 0); ctx.fillStyle = '#e53935'; ctx.fill();
    rr(ctx, -5, -20, 10, 5, 1.5); fs(ctx, '#8d6e63', 1.2);
    ctx.fillStyle = '#fff'; ctx.fillRect(-1.2, 1, 2.4, 7); ctx.fillRect(-3.5, 3.3, 7, 2.4);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circ(ctx, -5, -2, 1.8); ctx.fill();
    ctx.restore();
    if (Q.level && Math.random() < .12) addPart(p.x + rand(-6, 6), y - 6, 0, -30, '#ff8a80', .6, 2.5);
    return true;
  }
  if (p.kind === 'rkit') {
    if (QC.glow) { ctx.globalAlpha = .5; ctx.drawImage(glowSprite('#00e5ff'), p.x - 26, p.y - 30, 52, 52); ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(p.x, p.y - bob); rr(ctx, -12, -9, 24, 17, 3); fs(ctx, '#00838f', 1.6); rr(ctx, -5, -13, 10, 5, 2); fs(ctx, '#006064', 1.2);
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔧', 0, 5); ctx.restore(); return true;
  }
  if (p.kind === 'wsup') {
    if (QC.glow) { ctx.globalAlpha = .55 + .2 * Math.sin(G.time * 6); ctx.drawImage(glowSprite('#ffd54f'), p.x - 34, p.y - 38, 68, 68); ctx.globalAlpha = 1; }
    ctx.globalAlpha = .45; const gr = ctx.createLinearGradient(p.x, p.y - 120, p.x, p.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, '#ffd54f'); ctx.fillStyle = gr; ctx.fillRect(p.x - 7, p.y - 120, 14, 120); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(p.x, p.y - bob); rr(ctx, -15, -12, 30, 23, 3); fs(ctx, '#5d4037', 1.8); rr(ctx, -15, -12, 30, 7, 2); fs(ctx, '#ffb300', 1.4);
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔫', 0, 8); ctx.restore(); return true;
  }
  if (p.kind === 'scrate') {
    if (QC.glow) { ctx.globalAlpha = .45 + .2 * Math.sin(G.time * 4); ctx.drawImage(glowSprite('#90caf9'), p.x - 32, p.y - 36, 64, 64); ctx.globalAlpha = 1; }
    ctx.globalAlpha = .45; const gr = ctx.createLinearGradient(p.x, p.y - 110, p.x, p.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, '#90caf9'); ctx.fillStyle = gr; ctx.fillRect(p.x - 7, p.y - 110, 14, 110); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(p.x, p.y - bob); rr(ctx, -14, -13, 28, 24, 2); fs(ctx, '#1565c0', 1.8); line(ctx, -14, -1, 14, -1, 2, '#0d47a1');
    ctx.fillStyle = '#fff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', 0, 4); ctx.restore(); return true;
  }
  return false;
}
// 화면 효과: 폭풍(시야 제한)
function drawScreenExt(cx, cy) {
  if (G.stormT > 0 || G.stormWarn > 0) {
    const k = G.stormT > 0 ? Math.min(1, Math.min(G.stormT, 14 - G.stormT) / 1.5 + .001) : (2.5 - G.stormWarn) / 2.5 * .25;
    const pxp = cx + (P.x - G.camX) * K, pyp = cy + (P.y - G.camY) * K;
    const gr = ctx.createRadialGradient(pxp, pyp, 70 * K, pxp, pyp, 190 * K); gr.addColorStop(0, 'rgba(90,70,40,0)'); gr.addColorStop(1, `rgba(70,55,30,${0.88 * k})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, cv.width, cv.height);
    if (Q.level && G.stormT > 0) { ctx.fillStyle = `rgba(210,180,120,${.25 * k})`; for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * cv.width, Math.random() * cv.height, 14 * DPR, 1.5 * DPR); }
  }
}
function drawHudExt(L, hy, W) {
  drawHudX(W);
  ctx.textAlign = 'center';
  // 난이도 표시
  const d = DF(); ctx.font = '900 10px "Noto Sans KR",sans-serif'; ctx.fillStyle = d.col; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
  const tx = Math.min(L + (W - L - 10 - SAFE.r) / 2 + 30, W - SAFE.r - 110); ctx.strokeText(d.ic + ' ' + d.n, tx, hy + (G.powerT > 0 ? 44 : 30)); ctx.fillText(d.ic + ' ' + d.n, tx, hy + (G.powerT > 0 ? 44 : 30));
  // 탑승 장비 패널 (무기 슬롯 자리)
  const v = G.veh;
  if (v) {
    const pw = Math.min(200, W * .5); ctx.fillStyle = 'rgba(0,30,40,.7)'; rr(ctx, L, hy + 22, pw, 34, 7); ctx.fill(); ctx.strokeStyle = v.def.col.c; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.textAlign = 'left'; ctx.font = '900 10px "Noto Sans KR",sans-serif'; ctx.fillStyle = '#e0f7fa'; ctx.fillText('🚘 ' + v.def.name, L + 6, hy + 34);
    const bw = pw - 12, k = clamp(v.hp / v.maxHp, 0, 1); ctx.fillStyle = '#000a'; rr(ctx, L + 6, hy + 40, bw, 10, 5); ctx.fill();
    ctx.fillStyle = k < .3 ? '#ff5252' : '#26c6da'; rr(ctx, L + 6, hy + 40, Math.max(10, bw * k), 10, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 9px sans-serif'; ctx.fillText(`내구도 ${Math.ceil(v.hp)} / ${v.maxHp}${v.repairs ? '  🔧' + v.repairs + '/2' : ''}`, L + 6 + bw / 2, hy + 48.5);
    const tk = clamp(v.time / v.maxTime, 0, 1), warn = v.time <= 5;
    ctx.fillStyle = 'rgba(0,30,40,.7)'; rr(ctx, L, hy + 58, pw, 18, 7); ctx.fill();
    ctx.fillStyle = warn && Math.floor(G.time * 6) % 2 ? '#ff1744' : '#ffd54f'; rr(ctx, L + 3, hy + 61, Math.max(8, (pw - 6) * tk), 12, 5); ctx.fill();
    ctx.fillStyle = '#000'; ctx.font = '900 10px "Noto Sans KR",sans-serif'; ctx.fillText(`⏱ 남은 사용시간 ${Math.ceil(v.time)}초`, L + pw / 2, hy + 71);
    if (v.ovT > 0) { ctx.fillStyle = '#ffd54f'; ctx.fillText('⏩ 과부하 ' + Math.ceil(v.ovT) + 's', L + pw / 2, hy + 88); }
  }
  // 구조 진행 게이지 (화면 하단 중앙)
  let rr0 = null; for (const r of rescues) if (r.active && !r.done) rr0 = r;
  const R = G.radio && G.radio.phase === 'hold' ? G.radio : null;
  const H = G.hold && !G.hold.q.done && Math.hypot(P.x - G.hold.x, P.y - G.hold.y) < G.hold.r ? G.hold : null;
  const gauge = rr0 ? ['🔓 동료 구조 중', rr0.prog / rr0.need, '#69f0ae'] : R ? ['🛡️ 고립 아군 방어', R.prog / R.need, '#ffd54f'] : H ? ['🚩 구역 사수', H.q.cur / H.q.sec, '#ffab40'] : null;
  if (gauge) {
    const gw = Math.min(220, W * .55), gx = (W - gw) / 2, gy = H_() * .66;
    ctx.fillStyle = 'rgba(0,0,0,.65)'; rr(ctx, gx - 4, gy - 18, gw + 8, 34, 8); ctx.fill();
    ctx.fillStyle = gauge[2]; ctx.font = '900 11px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${gauge[0]} ${Math.floor(gauge[1] * 100)}%`, W / 2, gy - 4);
    ctx.fillStyle = '#263238'; rr(ctx, gx, gy + 2, gw, 9, 4); ctx.fill(); ctx.fillStyle = gauge[2]; rr(ctx, gx, gy + 2, Math.max(8, gw * clamp(gauge[1], 0, 1)), 9, 4); ctx.fill();
  }
}
function H_() { return H; }

/* ------------------------- 확장팩 연출 ------------------------- */
function drawEffectX(f, k) {
  switch (f.type) {
    case 'xring': ctx.globalAlpha = (1 - k) * .85; ctx.strokeStyle = f.col; ctx.lineWidth = 7 * (1 - k) + 1.5; circ(ctx, f.x, f.y, f.r * (.35 + k * .75)); ctx.stroke(); ctx.globalAlpha = (1 - k) * .18; ctx.fillStyle = f.col; ctx.fill(); ctx.globalAlpha = 1; break;
    case 'ering': ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col; ctx.lineWidth = 3; circ(ctx, f.x, f.y, f.r * (.3 + k)); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); const L = f.r * (1.4 - k * .4); ctx.moveTo(f.x - L, f.y); ctx.lineTo(f.x + L, f.y); ctx.moveTo(f.x, f.y - L); ctx.lineTo(f.x, f.y + L); ctx.stroke(); ctx.globalAlpha = 1; break;
    case 'hitx': {
      ctx.save(); ctx.translate(f.x, f.y); ctx.globalAlpha = 1 - k;
      if (f.cls === 'energy' || f.cls === 'future') { ctx.strokeStyle = f.col; ctx.lineWidth = 2.5; circ(ctx, 0, 0, 4 + k * f.r * .9); ctx.stroke(); ctx.fillStyle = '#fff'; circ(ctx, 0, 0, 3 * (1 - k)); ctx.fill(); }
      else if (f.cls === 'special') { ctx.fillStyle = f.col; for (let i = 0; i < 5; i++) { const a = i * 1.26 + f.x, d = 3 + k * 12; circ(ctx, Math.cos(a) * d, Math.sin(a) * d, 2.2 * (1 - k)); ctx.fill(); } }
      else { ctx.rotate(f.ang); ctx.strokeStyle = '#fff8e1'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = -2; i <= 2; i++) { const a = Math.PI + i * .45, d = 4 + k * 14; ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d); } ctx.stroke(); ctx.fillStyle = f.col; circ(ctx, 0, 0, 4 * (1 - k)); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1; break; }
    case 'combo': {
      const T = ['연속 처치!', '콤보 폭발!', '학살 모드!', '대량 처치 보너스!'], cols = ['#fff59d', '#ffab40', '#ff5252', '#ffd54f'];
      const y = P.y - 60 - k * 40, sc = 1 + (k < .15 ? (.15 - k) * 4 : 0) + f.lv * .15;
      ctx.save(); ctx.translate(P.x, y); ctx.scale(sc, sc); ctx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; ctx.textAlign = 'center';
      ctx.font = '900 20px "Black Han Sans","Noto Sans KR",sans-serif'; ctx.lineWidth = 5; ctx.strokeStyle = '#000';
      ctx.strokeText(`${f.c} COMBO`, 0, 0); ctx.fillStyle = cols[f.lv]; ctx.fillText(`${f.c} COMBO`, 0, 0);
      ctx.font = '900 13px "Noto Sans KR",sans-serif'; ctx.lineWidth = 4; ctx.strokeText(T[f.lv], 0, 18); ctx.fillStyle = '#fff'; ctx.fillText(T[f.lv], 0, 18);
      ctx.restore(); ctx.globalAlpha = 1; break; }
  }
}
// 정예 고유 장식 (외형 차별화)
function drawElxDeco(e) {
  const r = e.r, x = e.x, y = e.y, t = G.time, pal = PAL[e.pal] || {}, d = e.elx.deco;
  ctx.save(); ctx.translate(x, y); ctx.scale(e.face || 1, 1); ctx.lineJoin = 'round';
  switch (d) {
    case 'armor': rr(ctx, -r * .7, -r * .6, r * 1.4, r * .35, 3); fs(ctx, '#78909c', 1.5); ctx.fillStyle = '#ff1744'; ctx.fillRect(-r * .3, -r * .52, r * .6, r * .12); break;
    case 'spikes': ctx.fillStyle = '#cfd8dc'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * .3 - 4, -r * .8); ctx.lineTo(i * r * .3, -r * 1.25); ctx.lineTo(i * r * .3 + 4, -r * .8); ctx.fill(); } break;
    case 'pods': for (const s of [-1, 1]) { rr(ctx, s * r * .75 - 6, -r * .9, 12, 14, 2); fs(ctx, '#546e7a', 1.3); ctx.fillStyle = '#ff7043'; circ(ctx, s * r * .75, -r * .82, 2.5); ctx.fill(); } break;
    case 'tanks': case 'tubes': for (const s of [-1, 1]) { rr(ctx, -r * .95, -r * .4 + s * 8, 8, 14, 3); fs(ctx, d === 'tanks' ? '#9ccc65' : '#4dd0e1', 1.2); } break;
    case 'drill': ctx.save(); ctx.translate(r * .95, 0); ctx.rotate(Math.sin(t * 20) * .1); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(16, 0); ctx.lineTo(0, 7); ctx.closePath(); fs(ctx, '#ffca28', 1.4); ctx.restore(); break;
    case 'spores': ctx.fillStyle = pal.s || '#b2ff59'; for (let i = 0; i < 5; i++) { const a = t * 1.5 + i * 1.26; circ(ctx, Math.cos(a) * r * 1.1, Math.sin(a) * r * .6 - r * .3, 3); ctx.fill(); } break;
    case 'tail': ctx.strokeStyle = pal.b || '#333'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-r * .7, 0); ctx.quadraticCurveTo(-r * 1.4, -r * 1.2 + Math.sin(t * 4) * 4, -r * .4, -r * 1.3); ctx.stroke(); ctx.fillStyle = '#ff1744'; circ(ctx, -r * .4, -r * 1.3, 4); ctx.fill(); break;
    case 'ice': ctx.fillStyle = 'rgba(179,229,252,.9)'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * .4 - 5, -r * .75); ctx.lineTo(i * r * .4, -r * 1.3 - Math.abs(i) * -4); ctx.lineTo(i * r * .4 + 5, -r * .75); ctx.closePath(); ctx.fill(); } break;
    case 'lava': ctx.strokeStyle = `rgba(255,${120 + Math.sin(t * 8) * 60},0,.9)`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-r * .5, -r * .3); ctx.lineTo(-r * .1, r * .1); ctx.lineTo(r * .3, -r * .2); ctx.moveTo(-r * .2, r * .4); ctx.lineTo(r * .4, r * .3); ctx.stroke(); break;
    case 'core': ctx.fillStyle = pal.glow || '#ff1744'; ctx.globalAlpha = .6 + .4 * Math.sin(t * 6); circ(ctx, 0, -r * .2, r * .28); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; circ(ctx, 0, -r * .2, r * .28); ctx.stroke(); break;
    case 'scope': rr(ctx, r * .2, -r * .9, r * .9, 6, 2); fs(ctx, '#263238', 1.2); ctx.fillStyle = '#ff1744'; circ(ctx, r * 1.1, -r * .87, 2.5); ctx.fill(); break;
    case 'antenna': line(ctx, 0, -r * .8, 0, -r * 1.5, 2, '#90a4ae'); ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ff1744' : '#ffeb3b'; circ(ctx, 0, -r * 1.5, 3.5); ctx.fill(); break;
    case 'coil': for (let i = 0; i < 3; i++) { circ(ctx, -r * .3 + i * r * .3, -r * .95, 4); fs(ctx, '#b0bec5', 1); } if (Math.random() < .5) { ctx.strokeStyle = '#80d8ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * .3, -r * .95); ctx.lineTo(rand(-r, r), -r * 1.4); ctx.stroke(); } break;
    case 'neon': ctx.strokeStyle = pal.c || '#00e5ff'; ctx.lineWidth = 2; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(0, r * .2, r * 1.2, r * .45, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; break;
    case 'crown': ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.moveTo(-9, -r * .9); ctx.lineTo(-9, -r * 1.25); ctx.lineTo(-4, -r * 1.05); ctx.lineTo(0, -r * 1.35); ctx.lineTo(4, -r * 1.05); ctx.lineTo(9, -r * 1.25); ctx.lineTo(9, -r * .9); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke(); break;
    case 'void': ctx.fillStyle = 'rgba(30,0,50,.55)'; for (let i = 0; i < 4; i++) { const a = -t * 2 + i * 1.57; circ(ctx, Math.cos(a) * r * 1.05, Math.sin(a) * r * .5, 4); ctx.fill(); } break;
    case 'wings': ctx.fillStyle = pal.b || '#555'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -r * .4); ctx.lineTo(s * r * 1.5, -r * .9 + Math.sin(t * 10) * 5); ctx.lineTo(s * r * .8, -r * .1); ctx.closePath(); ctx.fill(); } break;
    case 'crystal': ctx.fillStyle = 'rgba(234,128,252,.85)'; for (const [cx, h] of [[-r * .5, 14], [0, 20], [r * .5, 12]]) { ctx.beginPath(); ctx.moveTo(cx - 5, -r * .7); ctx.lineTo(cx, -r * .7 - h); ctx.lineTo(cx + 5, -r * .7); ctx.closePath(); ctx.fill(); } break;
  }
  ctx.restore();
  if (e.elx.aura) { ctx.globalAlpha = .10 + .04 * Math.sin(t * 4); ctx.fillStyle = '#ffab91'; circ(ctx, x, y, 150); ctx.fill(); ctx.globalAlpha = 1; }
}
function drawHudX(W) {
  // 콤보
  if (G.combo >= 5) {
    const x = W - SAFE.r - 14, y = (G.veh ? 236 : 150) + SAFE.t; ctx.textAlign = 'right';
    const big = G.combo >= 100 ? 26 : G.combo >= 50 ? 23 : G.combo >= 30 ? 21 : 19;
    ctx.font = `900 ${big}px "Black Han Sans","Noto Sans KR",sans-serif`; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    const col = G.combo >= 100 ? '#ffd54f' : G.combo >= 50 ? '#ff5252' : G.combo >= 30 ? '#ffab40' : '#fff59d';
    ctx.strokeText(`🔥${G.combo}`, x, y); ctx.fillStyle = col; ctx.fillText(`🔥${G.combo}`, x, y);
    ctx.font = '900 9px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('COMBO', x, y + 11);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 44, y + 15, 44, 3); ctx.fillStyle = col; ctx.fillRect(x - 44, y + 15, 44 * clamp(G.comboT / 2.4, 0, 1), 3);
  }
  // 전투 보급 효과
  if (G.sup && G.sup.t > 0) { const S = SUPK[G.sup.k]; ctx.textAlign = 'center'; ctx.font = '900 11px "Noto Sans KR",sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; const tx = W / 2, ty = H * .2 + SAFE.t; const s = `${S.ic} ${S.n} ${Math.ceil(G.sup.t)}초${G.veh ? ' (하차 후)' : ''}`; ctx.strokeText(s, tx, ty); ctx.fillStyle = '#ffd54f'; ctx.fillText(s, tx, ty); }
}

/* ------------------------- 보스 다중 체력바 (던전앤파이터식) ------------------------- */
function drawBossBars(b, y, W) {
  const bw = Math.min(W - 30 - SAFE.l - SAFE.r, 380), bx = (W - bw) / 2, h = 18;
  const per = b.maxHp / b.bars, cur = Math.min(b.bars - 1, b.bar || 0), left = b.bars - cur;
  const inBar = clamp((Math.max(0, b.hp) - (b.bars - 1 - cur) * per) / per, 0, 1);
  if (G.barFlash > 0) G.barFlash -= 0.016;
  ctx.fillStyle = 'rgba(0,0,0,.78)'; rr(ctx, bx - 4, y - 4, bw + 8, h + 26, 7); ctx.fill();
  // 아래에 다음 줄 색을 깔고, 현재 줄을 위에 그림
  ctx.fillStyle = left > 1 ? BAR_COLS[Math.min(2, cur + 1)] : '#263238'; rr(ctx, bx, y, bw, h, 6); ctx.fill();
  if (left > 1) { ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, bx, y, bw, h, 6); ctx.fill(); }
  // 지연 감소 표시(흰색) → 현재 체력
  b.trail = b.trail === undefined || b.trailBar !== cur ? inBar : Math.max(inBar, b.trail - 0.008); b.trailBar = cur;
  ctx.fillStyle = 'rgba(255,255,255,.75)'; rr(ctx, bx, y, Math.max(3, bw * b.trail), h, 6); ctx.fill();
  const col = BAR_COLS[Math.min(2, cur)], gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#ffffff55'); gr.addColorStop(.35, col); gr.addColorStop(1, col);
  ctx.fillStyle = gr; rr(ctx, bx, y, Math.max(3, bw * inBar), h, 6); ctx.fill();
  for (let i = 1; i < 10; i++) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(bx + bw * i / 10, y + 2, 1, h - 4); }
  if (G.barFlash > 0) { ctx.globalAlpha = Math.min(1, G.barFlash * 1.6); ctx.fillStyle = '#fff'; rr(ctx, bx, y, bw, h, 6); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.strokeStyle = b.exposeT > 0 ? '#ffd54f' : 'rgba(255,255,255,.5)'; ctx.lineWidth = b.exposeT > 0 ? 3 : 1.5; rr(ctx, bx, y, bw, h, 6); ctx.stroke();
  // 남은 줄 수 (x3) + 이름
  ctx.textAlign = 'right'; ctx.font = '900 17px "Black Han Sans","Noto Sans KR",sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
  ctx.strokeText('x' + left, bx + bw - 6, y + 15); ctx.fillStyle = '#fff'; ctx.fillText('x' + left, bx + bw - 6, y + 15);
  ctx.textAlign = 'left'; ctx.font = '900 11px "Noto Sans KR",sans-serif'; ctx.lineWidth = 3;
  const label = `👑 ${b.bdef.name}${b.exposeT > 0 ? '  ⚡약점!' : ''}`; ctx.strokeText(label, bx + 6, y + 13); ctx.fillText(label, bx + 6, y + 13);
  // 남은 체력바 아이콘
  for (let i = 0; i < b.bars; i++) { const on = i >= cur; ctx.fillStyle = on ? BAR_COLS[i] : 'rgba(255,255,255,.15)'; rr(ctx, bx + i * 22, y + h + 5, 18, 8, 3); ctx.fill(); }
  ctx.font = '700 9px "Noto Sans KR",sans-serif'; ctx.fillStyle = '#eee'; ctx.textAlign = 'left'; ctx.fillText(`체력바 ${left}/${b.bars} · ${['1페이즈', '2페이즈', '3페이즈'][cur]}`, bx + b.bars * 22 + 4, y + h + 12);
  return h + 30;
}
// 보스 머리 위 남은 체력바 개수
function drawBossTag(e) {
  if (!e.bars) return; const left = e.bars - (e.bar || 0);
  ctx.font = '900 13px "Black Han Sans","Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
  const y = e.y - e.r - 26 - (e.z || 0); ctx.strokeText('x' + left, e.x, y); ctx.fillStyle = BAR_COLS[Math.min(2, e.bar || 0)]; ctx.fillText('x' + left, e.x, y);
}
