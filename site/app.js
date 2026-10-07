const base = new URL("./", location.href).href;
const version = "20261007v1";
const loaderURL = new URL("loader.html?v=" + version, base).href;
const source = `eval(await new Promise((resolve, reject) => {
  const origin = ${JSON.stringify(new URL(base).origin)}, nonce = crypto.randomUUID();
  const view = window.open('about:blank', '_blank', 'width=1400,height=900');
  if (!view) { reject(Error()); return; }
  let loader;
  const finish = error => {
    clearTimeout(timer); window.removeEventListener('message', receive); loader?.close();
    if (error) { view.close(); reject(error); }
  };
  const receive = event => {
    if (event.origin !== origin || event.source !== loader || event.data?.nonce !== nonce || event.data?.type !== 'discord-recorder-source') return;
    if (event.data.error || typeof event.data.code !== 'string') { finish(Error(event.data.error || undefined)); return; }
    if (view.closed) { finish(Error()); return; }
    finish(); window.__discordRecorderLaunchWindow = view; resolve(event.data.code);
  };
  const timer = setTimeout(() => finish(Error()), 30000);
  window.addEventListener('message', receive);
  loader = window.open(${JSON.stringify(loaderURL)} + '&nonce=' + nonce + '&origin=' + encodeURIComponent(location.origin), '_blank', 'width=460,height=240');
  if (!loader) finish(Error());
}));`;
const area = document.querySelector("#loader");
area.value = source;
document.querySelector("#copy-loader").onclick = async () => {
  try {
    await navigator.clipboard.writeText(source);
    document.querySelector("#status").textContent =
      "코드를 복사했습니다. 디스코드 웹 Console에서 실행하세요.";
  } catch {
    area.closest("details").open = true;
    area.select();
    document.querySelector("#status").textContent =
      "선택된 코드를 Ctrl+C로 복사하세요.";
  }
};
document.querySelector("#show-help").onclick = () => {
  const help = document.querySelector("#popup-help");
  help.open = true;
  help.scrollIntoView({ behavior: "smooth", block: "center" });
};
