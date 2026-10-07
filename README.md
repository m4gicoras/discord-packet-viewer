# Discord 로그

사이트: https://m4gicoras.github.io/discord-packet-viewer/

사이트에서 실행 코드를 복사한 뒤 디스코드 웹의 개발자 도구 Console에서 실행합니다. Vencord나 토큰 입력은 필요 없습니다. 열린 기록 창에서 서버 ID와 선택적 채널 ID를 입력하고 기록 시작을 누릅니다. 수신은 늘고 해제가 0이면 재연결 버튼을 누릅니다. 이 버튼은 디스코드 Gateway를 잠깐 끊고 클라이언트의 자동 재연결을 기다립니다.

## 파일

- `site/recorder.js`: WebSocket 수집과 기록 창. 지역별 Gateway 주소와 JSON + zlib-stream을 지원합니다.
- `site/index.html`, `app.js`: 실행 코드 복사 화면.
- `site/loader.html`, `loader.js`: Pages에서 recorder.js를 읽어 호출한 디스코드 탭에 전달합니다. Discord 페이지에서 외부 fetch를 하지 않습니다. 전달 시 origin, popup source, nonce를 확인합니다.
- `site/viewer.html`: 저장된 HAR와 기록 JSON 열람. HTML만 열어서는 실시간 수집이 시작되지 않습니다.

메시지 생성/갱신/삭제와 입력 중 알림을 서버명, 채널명, 사용자 ID 및 서버 별명과 기록합니다. 이름과 별명은 실제로 수신한 메타데이터가 있을 때만 표시합니다. 삭제 이벤트의 작성자와 본문은 이전에 관측한 메시지가 있을 때만 보완합니다. 타이핑 내용과 종료 시각은 전달되지 않습니다. 메시지 갱신에는 임베드 변경 등이 포함될 수 있습니다.

기록은 사용자의 브라우저 localStorage에 최대 10,000개 보관되며 JSON/CSV로 내보낼 수 있습니다. 수집 데이터를 사이트 서버로 보내지 않습니다. 기록 창과 원래 디스코드 탭을 열어 두어야 하며, 디스코드 탭을 새로고침하면 다시 실행해야 합니다. 동일 HAR를 재수입하면 중복됩니다.

## 배포

GitHub 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다. `main`에 push하거나 Actions의 **Deploy Pages → Run workflow**를 실행하면 `site/`가 배포됩니다.

## 로더가 차단될 때

팝업 차단을 해제합니다. 브라우저 정책·DevTools 환경에 따라 코드 실행이 제한될 수 있습니다. 사이트의 **전체 코드 복사**를 사용하거나 Sources → Snippets에 저장하여 실행할 수 있습니다. 로더의 실제 Discord 세션 실행은 사용 환경에서 확인이 필요합니다.
