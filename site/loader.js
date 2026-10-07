(async () => {
  const params = new URLSearchParams(location.search);
  const nonce = params.get('nonce');
  const origin = params.get('origin');
  const status = document.querySelector('#status');
  if (!window.opener || !nonce || !/^https:\/\/(?:canary\.|ptb\.)?discord\.com$/.test(origin || '')) {
    status.textContent = '디스코드 웹 Console에서 실행 코드를 사용하세요.';
    return;
  }
  try {
    const response = await fetch('recorder.js?v=20261007-5', { cache: 'no-store' });
    if (!response.ok) throw new Error('recorder.js HTTP '+response.status);
    const code = await response.text();
    window.opener.postMessage({ type: 'discord-recorder-source', nonce, code }, origin);
    status.textContent = '전달했습니다. 임시 로더 창을 닫는 중입니다.';
  } catch(error) {
    status.textContent = '불러오기 실패: '+error.message;
    window.opener.postMessage({ type: 'discord-recorder-source', nonce, error: error.message }, origin);
  }
})();
