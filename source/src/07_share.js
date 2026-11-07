/* ------------------------- 카카오톡 / 링크 공유 ------------------------- */
const SHARE = {
  title: '데스 서바이버 확장팩 V10',
  text: '설치 없이 터치 한 번으로 바로 플레이! 무기 360종 · 탑승 장비 120종 · 40스테이지 대량 처치 액션',
  url() {
    const c = (window.GAME_CONFIG && GAME_CONFIG.url) || '';
    if (/^https?:/.test(location.protocol) && !/claude|localhost|127\.0\.0\.1/.test(location.hostname)) return location.origin + location.pathname.replace(/index\.html$/, '');
    return c || location.href;
  },
  inKakao: /KAKAOTALK/i.test(navigator.userAgent),
  kakaoReady: false,
  loadKakao() {
    const key = window.GAME_CONFIG && GAME_CONFIG.kakaoKey;
    if (!key) return Promise.reject(new Error('nokey'));
    if (window.Kakao && Kakao.isInitialized && Kakao.isInitialized()) return Promise.resolve();
    return new Promise((res, rej) => {
      const sc = document.createElement('script'); sc.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'; sc.async = true;
      const to = setTimeout(() => rej(new Error('timeout')), 6000);
      sc.onload = () => { clearTimeout(to); try { if (!Kakao.isInitialized()) Kakao.init(key); res(); } catch (e) { rej(e); } };
      sc.onerror = () => { clearTimeout(to); rej(new Error('load')); };
      document.head.appendChild(sc);
    });
  },
  kakao() {
    const url = this.url(), img = url.replace(/\/?$/, '/') + 'og.jpg?v=5';
    return this.loadKakao().then(() => {
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: { title: this.title, description: this.text, imageUrl: img, imageWidth: 1200, imageHeight: 630, link: { mobileWebUrl: url, webUrl: url } },
        buttons: [{ title: '지금 바로 플레이', link: { mobileWebUrl: url, webUrl: url } }],
      });
    });
  },
  native() {
    if (!navigator.share) return Promise.reject(new Error('noshare'));
    return navigator.share({ title: this.title, text: this.text, url: this.url() });
  },
  copy() {
    const t = this.title + '\n' + this.url();
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, t.length);
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove(); return ok;
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(() => true, () => fallback());
    return Promise.resolve(fallback());
  },
  openPanel(msg) {
    $('shUrl').textContent = this.url();
    $('shKakao').style.display = window.GAME_CONFIG && GAME_CONFIG.kakaoKey ? '' : 'none';
    $('shNative').style.display = navigator.share ? '' : 'none';
    if (msg) $('shMsg').innerHTML = msg;
    showScreen('scrShare');
  },
  // 메인 화면 '카카오톡 공유' 버튼: 카카오 공유 → 기본 공유창 → 공유 패널(링크 복사) 순서로 시도
  quick() {
    AU.sfx('button');
    this.kakao().catch(() => this.native().catch(e => { if (e && e.name === 'AbortError') return; this.openPanel(); }));
  },
};
$('tShare').addEventListener('click', () => SHARE.quick());
$('shKakao').addEventListener('click', () => { AU.sfx('button'); SHARE.kakao().catch(() => toast('카카오 공유를 사용할 수 없어 링크 복사를 이용해 주세요', 2.2, '#ffe082')); });
$('shNative').addEventListener('click', () => { AU.sfx('button'); SHARE.native().catch(() => { }); });
$('shCopy').addEventListener('click', () => {
  AU.sfx('button');
  SHARE.copy().then(ok => {
    if (ok) toast('✅ 링크 복사 완료!<br><span style="font-size:14px">카카오톡 대화창에 붙여넣기 하세요</span>', 2.4, '#ffe082');
    else toast('위 주소를 길게 눌러 복사해 주세요', 2.4, '#ffe082');
  });
});
$('shClose').addEventListener('click', () => { AU.sfx('button'); showScreen('scrTitle'); });

// V9: 로딩 화면 닫기 (스크립트 준비 완료 후)
(() => { const b = document.getElementById('boot'); if (b) { setTimeout(() => { b.classList.add('hide'); setTimeout(() => b.remove(), 400); }, 250); } })();
