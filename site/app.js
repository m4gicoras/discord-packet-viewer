const base = new URL('./', location.href).href;
const loaderURL = new URL('loader.html', base).href;
// The loader and recorder reuse one window. eval runs in the DevTools command.
const command = `eval(await (async () => {
  const origin = ${JSON.stringify(new URL(base).origin)};
  const nonce = crypto.randomUUID();
  const help = '팝업이 차단됐습니다. 디스코드 탭 주소창 오른쪽의 팝업 차단 아이콘 → discord.com의 팝업 및 리디렉션 항상 허용 → 완료. 그다음 이 코드를 다시 실행하세요.';
  return await new Promise((resolve, reject) => {
    let popup;
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); };
    const receive = async event => {
      if (event.origin !== origin || event.source !== popup || event.data?.nonce !== nonce || event.data?.type !== 'discord-recorder-source') return;
      cleanup();
      if (event.data.error || typeof event.data.code !== 'string') {
        popup.close(); reject(new Error(event.data.error || '실행 코드가 없습니다.')); return;
      }
      try {
        popup.location = 'about:blank';
        const deadline = Date.now() + 5000;
        while (true) {
          if (popup.closed) throw new Error('기록 창이 닫혔습니다.');
          try { if (popup.document.URL === 'about:blank' && popup.document.body) break; } catch {}
          if (Date.now() > deadline) throw new Error('기록 창 준비가 지연됐습니다. 전체 코드 복사로 실행하세요.');
          await new Promise(r => setTimeout(r, 30));
        }
        window.__discordRecorderLaunchWindow = popup;
        resolve(event.data.code);
      } catch(error) { reject(error); }
    };
    const timer = setTimeout(() => { cleanup(); popup?.close(); reject(new Error('실행 파일을 못 받았습니다. 사이트의 전체 코드 복사로 실행하세요.')); }, 30000);
    window.addEventListener('message', receive);
    popup = window.open(${JSON.stringify(loaderURL)} + '?nonce=' + encodeURIComponent(nonce) + '&origin=' + encodeURIComponent(location.origin), 'discord_event_recorder', 'width=1400,height=900');
    if (!popup) {
      cleanup(); console.error('%c'+help, 'font-size:15px;line-height:1.8;color:#b33');
      alert(help); reject(new Error(help));
    }
  });
})());`;
document.querySelector('#loader').value = command;
async function copy(text, area) {
  area.value = text;
  try { await navigator.clipboard.writeText(text); document.querySelector('#status').textContent = '복사했습니다. 디스코드 웹 Console에서 실행하세요.'; }
  catch { area.hidden = false; area.closest('details').open = true; area.select(); document.querySelector('#status').textContent = '선택된 코드를 Ctrl+C로 복사하세요.'; }
}
document.querySelector('#copy-loader').onclick = () => copy(command, document.querySelector('#loader'));
document.querySelector('#copy-full').onclick = async event => {
  const button = event.currentTarget; button.disabled = true;
  try { const r = await fetch(new URL('recorder.js', base), { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP '+r.status); await copy(await r.text(), document.querySelector('#full')); }
  catch(e) { document.querySelector('#status').textContent = '코드를 불러오지 못했습니다: '+e.message; }
  finally { button.disabled = false; }
};

document.querySelector('#show-help').onclick = () => { const help = document.querySelector('#popup-help'); help.open = true; help.scrollIntoView({behavior:'smooth',block:'center'}); };
