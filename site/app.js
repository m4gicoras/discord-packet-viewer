const base = new URL('./', location.href).href;
const version = '20261007-3';
const area = document.querySelector('#loader');
const status = document.querySelector('#status');
const button = document.querySelector('#copy-loader');
let source = '';
async function loadSource() {
  button.disabled = true;
  status.textContent = '실행 파일을 불러오는 중…';
  try {
    const response = await fetch(new URL('recorder.js?v='+version, base), {cache:'no-store'});
    if (!response.ok) throw new Error('HTTP '+response.status);
    source = await response.text();
    area.value = source;
    status.textContent = '준비됐습니다. 실행 코드를 복사하세요.';
  } catch(error) {
    status.textContent = '실행 파일을 불러오지 못했습니다: '+error.message+' · 버튼을 눌러 다시 시도하세요.';
  } finally { button.disabled = false; }
}
button.onclick = async () => {
  if (!source) { await loadSource(); return; }
  try {
    await navigator.clipboard.writeText(source);
    status.textContent = '복사했습니다. 디스코드 웹 Console에 붙여넣고 Enter를 누르세요.';
  } catch {
    area.closest('details').open = true;
    area.select();
    status.textContent = '선택된 코드를 Ctrl+C로 복사하세요.';
  }
};
document.querySelector('#show-help').onclick = () => {
  const help = document.querySelector('#popup-help');
  help.open = true;
  help.scrollIntoView({behavior:'smooth',block:'center'});
};
loadSource();
