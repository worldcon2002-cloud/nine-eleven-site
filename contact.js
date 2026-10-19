(() => {
  'use strict';
  const config = window.NINEELEVEN_CONTACT || {};
  const httpsUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
  function enable(id, href, label) {
    const link = document.getElementById(id);
    link.href = href;
    link.removeAttribute('aria-disabled');
    link.querySelector('strong').textContent = label;
  }
  const phone = String(config.phone || '').trim();
  if (/^\+?[\d ()-]{7,24}$/.test(phone)) {
    const compact = phone.replace(/[^+\d]/g, '');
    const display = compact.replace(/^\+8210(\d{4})(\d{4})$/, '010-$1-$2');
    enable('contact-phone', `tel:${compact}`, display);
  }
  const kakao = httpsUrl(config.kakaoUrl);
  const kakaoId = String(config.kakaoId || '').trim();
  const kakaoLink = document.getElementById('contact-kakao');
  const kakaoHelp = document.getElementById('kakao-help');
  if (kakao) {
    enable('contact-kakao', kakao, '카카오톡으로 이야기하기');
    kakaoLink.querySelector('span').textContent = '카카오톡 상담';
    kakaoHelp.textContent = '';
  } else if (kakaoId) {
    enable('contact-kakao', '#kakao-help', kakaoId);
    kakaoLink.addEventListener('click', async event => {
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(kakaoId);
        kakaoHelp.textContent = `아이디 ${kakaoId}를 복사했습니다. 카카오톡에서 검색해 주세요.`;
      } catch {
        kakaoHelp.textContent = `자동 복사를 사용할 수 없습니다. ${kakaoId}를 직접 복사해 카카오톡에서 검색해 주세요.`;
      }
    });
  }
  const form = document.getElementById('inquiry-form');
  const button = form.querySelector('button[type="submit"]');
  const note = document.getElementById('inquiry-note');
  const status = document.getElementById('inquiry-status');
  const email = String(config.email || '').trim();
  const emailReady = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email);
  if (!emailReady) { button.disabled = true; note.textContent = '문의 수신처가 설정되지 않았습니다.'; return; }
  enable('contact-email', `mailto:${email}`, email);
  const external = httpsUrl(config.formUrl);
  if (external) { enable('contact-external-form', external, '온라인 상담 신청하기'); form.hidden = true; return; }
  enable('contact-external-form', '#inquiry-form', '상담 문의 작성하기');
  const direct = config.delivery === 'formsubmit' && /^https?:$/.test(window.location.protocol);
  let submitting = false;
  form.action = `https://formsubmit.co/${email}`;
  form.method = 'POST';
  if (direct) {
    const source = document.createElement('input');
    source.type = 'hidden'; source.name = '_url'; source.value = window.location.origin + window.location.pathname;
    form.append(source);
  } else {
    button.textContent = '이메일 초안 열기 ↗';
    note.textContent = '파일 미리보기에서는 이메일 앱으로 문의를 보냅니다. 웹사이트에서는 이 폼에서 바로 접수할 수 있습니다.';
  }
  const defaultLabel = button.textContent;
  window.addEventListener('pageshow', () => { submitting = false; button.disabled = false; button.textContent = defaultLabel; form.removeAttribute('aria-busy'); });
  form.addEventListener('submit', event => {
    if (submitting) { event.preventDefault(); return; }
    if (!form.reportValidity()) { event.preventDefault(); return; }
    if (direct) {
      // Native POST retains the provider's spam challenge and delivery/error screens.
      submitting = true;
      button.disabled = true;
      button.textContent = '접수 화면으로 이동 중…';
      form.setAttribute('aria-busy', 'true');
      status.textContent = '다음 화면에서 보안 확인과 접수 결과를 확인해 주세요.';
      return;
    }
    event.preventDefault();
    const values = new FormData(form);
    const subject = `[나인일레븐 상담] ${values.get('brand')}`;
    const body = `브랜드 / 회사명: ${values.get('brand')}\n담당자: ${values.get('name')}\n회신 이메일: ${values.get('email')}\n상품 / 홈페이지: ${values.get('product')}\n\n상담 내용\n${values.get('message')}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = '이메일 앱에서 직접 전송을 완료해 주세요. 아직 접수된 것은 아닙니다.';
  });
})();
