const base = new URL('./', location.href).href;
const loaderURL = new URL('loader.html', base).href;
// eval is deliberately at the top level of the DevTools command.
const command = `eval(await (async () => {
  const origin = ${JSON.stringify(new URL(base).origin)};
  const nonce = crypto.randomUUID();
  const view = window.open('about:blank', 'discord_event_recorder', 'width=1400,height=900');
  if (!view) throw new Error('팝업을 허용한 뒤 다시 실행하세요.');
  view.document.body.textContent = '실행 파일을 불러오는 중…';
  return await new Promise((resolve, reject) => {
    let popup;
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); popup?.close(); };
    const receive = event => {
      if (event.origin !== origin || event.source !== popup || event.data?.nonce !== nonce || event.data?.type !== 'discord-recorder-source') return;
      cleanup();
      if (event.data.error) reject(new Error(event.data.error));
      else if (typeof event.data.code === 'string') resolve(event.data.code);
      else reject(new Error('실행 코드가 없습니다.'));
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('실행 파일을 못 받았습니다. 팝업 허용과 Pages 배포 상태를 확인하세요.')); }, 30000);
    window.addEventListener('message', receive);
    popup = window.open(${JSON.stringify(loaderURL)} + '?nonce=' + encodeURIComponent(nonce) + '&origin=' + encodeURIComponent(location.origin), 'discord_recorder_loader', 'width=460,height=240');
    if (!popup) { cleanup(); reject(new Error('로더 팝업을 허용하세요.')); }
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
