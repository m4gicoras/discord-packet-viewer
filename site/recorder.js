
function capture(boot){
 function isGateway(url){try{return /^gateway(?:-[a-z0-9-]+)?\.discord\.gg$/i.test(new URL(url).hostname);}catch{return false;}}
 if(globalThis.__stopDiscordCapture)globalThis.__stopDiscordCapture();
 const prepared=window.__discordRecorderLaunchWindow;delete window.__discordRecorderLaunchWindow;const popup=prepared&&!prepared.closed?prepared:window.open('about:blank','discord_event_recorder','width=1400,height=900');
 if(!popup){const help='팝업이 차단됐습니다. 디스코드 탭 주소창 오른쪽 팝업 차단 아이콘 → discord.com의 팝업 및 리디렉션 항상 허용 → 완료 후 다시 실행하세요.';window.alert(help);throw Error(help);}
 popup.__discordRecorderStop?.();
 const subscriptions=new Map();
 const C={FluxDispatcher:{subscribe(t,f){if(!subscriptions.has(t))subscriptions.set(t,new Set());subscriptions.get(t).add(f);},unsubscribe(t,f){subscriptions.get(t)?.delete(f);}}};
 C.capture=capture;boot(popup,C);
 const api=popup.__discordRecorder;
 const diagnostics=()=>api.diagnostics();
 globalThis.__discordRecorderDiagnostics=diagnostics;
 const Original=window.WebSocket;let stopped=false;const sockets=new Set(),handled=new WeakSet();const dataDescriptor=Object.getOwnPropertyDescriptor(MessageEvent.prototype,'data');let hookedGetter;
 const notify=s=>api.status(s);C.reconnect=()=>{let count=0;for(const ws of [...sockets]){if(ws.readyState===0||ws.readyState===1){count++;ws.close(1000,'recorder reconnect');}}if(count)notify('다시 연결하는 중입니다.');else notify('연결을 찾는 중입니다. 잠시 후 다시 눌러 주세요.');};
 function event(o,time){if(stopped||popup.closed)return;api.decoded(o.t||('op '+o.op),time);api.scan(o.d);api.observe(o);if(o.op===0)for(const f of subscriptions.get(o.t)||[])f({...o.d,__receivedAt:time});}
 function attach(ws){if(sockets.has(ws)||!isGateway(ws.url))return;sockets.add(ws);api.connection('연결 중');ws.addEventListener('open',()=>{api.connection('연결됨');notify('연결됐습니다. 기록 시작을 누르세요.');},{once:true});
  const params=new URL(ws.url).searchParams;if(params.get('encoding')!=='json'){notify('현재 연결 방식을 지원하지 않습니다.');return;}
  const compression=params.get('compress');let writer,reader,buffer='',textDecoder=new TextDecoder(),times=[],queue=Promise.resolve(),streamStarted=false,scanIndex=0,depth=0,objectStart=-1,quoted=false,escaped=false;
  if(compression&&compression!=='zlib-stream'){notify('현재 연결 방식을 지원하지 않습니다.');return;}
  if(compression){const ds=new DecompressionStream('deflate');writer=ds.writable.getWriter();reader=ds.readable.getReader();
   (async()=>{try{while(!stopped&&!popup.closed){const r=await reader.read();if(r.done)break;buffer+=textDecoder.decode(r.value,{stream:true});let consumed=0;for(;scanIndex<buffer.length;scanIndex++){const c=buffer[scanIndex];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}if(c==='"')quoted=true;else if(c==='{'){if(depth++===0)objectStart=scanIndex;}else if(c==='}'&&--depth===0){event(JSON.parse(buffer.slice(objectStart,scanIndex+1)),times.shift()||new Date().toISOString());consumed=scanIndex+1;}}if(consumed){buffer=buffer.slice(consumed);scanIndex-=consumed;objectStart-=consumed;}}}catch(e){if(!stopped)notify('알림을 읽지 못했습니다. 재연결을 누르세요.');}})();
  }
  const feed=data=>{const time=new Date().toISOString();api.connection('연결됨');api.packet(time);queue=queue.then(async()=>{if(stopped||popup.closed)return;
   if(typeof data==='string'){event(JSON.parse(data),time);return;}
   const bytes=data instanceof Blob?new Uint8Array(await data.arrayBuffer()):new Uint8Array(data);
   if(!compression){event(JSON.parse(textDecoder.decode(bytes)),time);return;}
   if(!streamStarted){if(bytes.length<2||bytes[0]!==0x78||((bytes[0]*256+bytes[1])%31)!==0){notify('기록을 준비하려면 재연결을 누르세요.');return;}streamStarted=true;}if(bytes.length>=4&&bytes.slice(-4).every((b,i)=>b===[0,0,255,255][i]))times.push(time);
   await writer.write(bytes);
  }).catch(e=>notify('알림을 읽지 못했습니다. 재연결을 누르세요.'));};
  const onMessage=m=>{if(handled.has(m))return;const value=m.data;if(handled.has(m))return;handled.add(m);feed(value);};ws.__eventRecorderFeed=feed;ws.addEventListener('message',onMessage);
  const cleanup=()=>{api.connection('연결 끊김');notify('연결을 기다리는 중입니다.');ws.removeEventListener('message',onMessage);reader?.cancel().catch(()=>{});writer?.abort().catch(()=>{});sockets.delete(ws);};
  ws.addEventListener('close',cleanup,{once:true});ws.__eventRecorderCleanup=cleanup;
  notify('알림을 기다리는 중입니다.');
 }
 const Wrapped=new Proxy(Original,{construct(target,args,newTarget){const ws=Reflect.construct(target,args,newTarget);attach(ws);return ws;}});
 window.WebSocket=Wrapped;
 if(dataDescriptor?.get&&dataDescriptor.configurable){hookedGetter=function(){const value=dataDescriptor.get.call(this);const ws=this.currentTarget;if(!stopped&&ws instanceof Original&&isGateway(ws.url)&&!handled.has(this)){handled.add(this);attach(ws);ws.__eventRecorderFeed?.(value);}return value;};Object.defineProperty(MessageEvent.prototype,'data',{...dataDescriptor,get:hookedGetter});}
 function stop(){if(stopped)return;stopped=true;if(window.WebSocket===Wrapped)window.WebSocket=Original;if(hookedGetter&&Object.getOwnPropertyDescriptor(MessageEvent.prototype,'data')?.get===hookedGetter)Object.defineProperty(MessageEvent.prototype,'data',dataDescriptor);for(const ws of [...sockets])ws.__eventRecorderCleanup?.();popup.__discordRecorderStop?.();clearInterval(timer);if(globalThis.__stopDiscordCapture===stop)delete globalThis.__stopDiscordCapture;if(globalThis.__discordRecorderDiagnostics===diagnostics)delete globalThis.__discordRecorderDiagnostics;}
 const timer=setInterval(()=>{if(popup.closed)stop();},1000);globalThis.__stopDiscordCapture=stop;
 window.addEventListener('beforeunload',stop,{once:true});
 notify('연결을 확인하는 중입니다. 기록이 진행되지 않을 경우, 재연결을 누르세요.');
}

function recorder(w,C){
 function isGateway(url){try{return /^gateway(?:-[a-z0-9-]+)?\.discord\.gg$/i.test(new URL(url).hostname);}catch{return false;}}
 const D=w.document; D.title='Discord Event Logger'; D.body.replaceChildren();
 const make=(tag,text,parent=D.body)=>{const n=D.createElement(tag);if(text!==undefined)n.textContent=text;parent.append(n);return n;};
 const style=make('style',`*{box-sizing:border-box}body{margin:0;padding:20px;background:#f5f6f8;color:#20242b;font:13px Arial,'Malgun Gothic',sans-serif}h1{font-size:20px;margin:0 0 6px;font-weight:600}p{color:#626a75;line-height:1.6;margin:8px 0}input,select,button,textarea{background:white;border:1px solid #cbd0d8;border-radius:4px;color:#252a32;padding:7px 9px;font:inherit}button{cursor:pointer;white-space:nowrap}button:disabled{opacity:.45;cursor:default}button:hover:not(:disabled){background:#eceff4}.bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}input{min-width:215px}label{display:flex;gap:5px;align-items:center}label input{min-width:0}table{border-collapse:collapse;width:100%;font-size:12px;background:white}th,td{padding:9px 10px;border-bottom:1px solid #e0e3e8;text-align:left;vertical-align:top}th{background:#eceff3;position:sticky;top:0;font-weight:600}td{white-space:pre-wrap;overflow-wrap:anywhere;max-width:350px}.sub{color:#7b8492;font-size:11px;margin-top:4px}.status{padding:8px 10px;background:white;border:1px solid #d9dde4;border-radius:4px;margin-bottom:8px}.health{display:flex;flex-wrap:wrap;gap:24px;padding:12px 10px;background:white;border:1px solid #d9dde4;border-radius:4px;margin-bottom:8px}.health strong{font-size:14px}.hint{padding:8px 10px;background:#fff9e8;border-left:3px solid #d7b455;font-size:12px;color:#66572b;line-height:1.6;margin-bottom:12px}textarea{width:100%;height:130px;font:11px monospace}details{margin:16px 0}summary{cursor:pointer;color:#505969}small{color:#747e8b}.tablebox{overflow:auto;max-height:65vh;border:1px solid #d9dde4}#start{background:#3c536d;color:white;border-color:#3c536d}`);
 make('h1','Discord 이벤트 뷰어');
 make('p',C?'실시간 기록':'저장한 기록 보기');
 const bar=make('div');bar.className='bar';
 make('span','서버 ID',bar);const guild=make('input',undefined,bar);guild.value='1134059900666916935';
 make('span','채널 ID (선택)',bar);const channel=make('input',undefined,bar);channel.placeholder='미입력 시, 해당 서버 전체';
 const apply=make('button','설정 적용',bar);const start=make('button','기록 시작',bar);start.id='start';start.disabled=!C;
 const stop=make('button','중지',bar);stop.disabled=true;const reconnect=make('button','재연결',bar);reconnect.disabled=!C;reconnect.onclick=()=>{if(C?.reconnect){C.reconnect();}else say('실시간 기록에서 사용할 수 있습니다.');};
 const filters=make('div');filters.className='bar';const enabled={};
 const TYPES=['MESSAGE_CREATE','MESSAGE_UPDATE','MESSAGE_DELETE','TYPING_START'];
 const labels={MESSAGE_CREATE:'새 메시지',MESSAGE_UPDATE:'메시지 변경',MESSAGE_DELETE:'메시지 삭제',TYPING_START:'입력 중'};
 for(const t of TYPES){const l=make('label',undefined,filters);const i=make('input',undefined,l);i.type='checkbox';i.checked=true;make('span',labels[t],l);enabled[t]=i;}
 const search=make('input',undefined,filters);search.placeholder='이름 / ID / 내용 검색';search.oninput=()=>{page=1;render();};
 const out=make('div');out.className='bar';const exp=make('button','JSON 저장',out);const csv=make('button','CSV 저장',out);const clear=make('button','기록 비우기',out);
 const load=make('input',undefined,out);load.type='file';load.accept='.har,.json';
 const healthBox=make('div');healthBox.className='health';
 const connectionLabel=make('strong',C?'연결 대기':'파일 열람',healthBox);
 const packetLabel=make('span','수신 0',healthBox);const decodedLabel=make('span','읽은 알림 0',healthBox);const lastLabel=make('span','마지막 수신 —',healthBox);
 const hint=make('div',C?'연결을 기다리는 중입니다.':'저장한 HAR 또는 JSON 파일을 선택하세요.');hint.className='hint';
 const status=make('div','준비됨');status.className='status';
 const health={state:C?'연결 대기':'파일 열람',packets:0,decoded:0,last:null,lastType:null};
 function healthRender(){connectionLabel.textContent=health.state;connectionLabel.style.color=health.state==='연결됨'?'#247247':health.state==='연결 끊김'?'#a33b32':'#626a75';packetLabel.textContent='수신 '+health.packets;decodedLabel.textContent='읽은 알림 '+health.decoded;lastLabel.textContent='마지막 수신 '+(health.last?new Date(health.last).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour12:false}):'—');}

 const box=make('div');box.className='tablebox';const table=make('table',undefined,box);const head=make('tr',undefined,make('thead',undefined,table));
 for(const t of ['시각 (KST)','이벤트','서버 / 채널','별명 / 사용자','본문 / 변경 전','메시지 ID'])make('th',t,head);
 const tbody=make('tbody',undefined,table);
 const paging=make('div');paging.className='bar';
 make('span','최대 표시 수',paging);const limitInput=make('input',undefined,paging);limitInput.id='display-limit';limitInput.type='number';limitInput.min='1';limitInput.max='10000';limitInput.step='1';limitInput.style.minWidth='0';limitInput.style.width='100px';
 make('span','페이지당',paging);const sizeInput=make('select',undefined,paging);sizeInput.id='page-size';
 for(const size of [10,25,50,100,200,500]){const option=make('option',size+'개',sizeInput);option.value=String(size);}
 const first=make('button','처음',paging),prev=make('button','이전',paging);
 const pageLabel=make('span','',paging);pageLabel.id='page-label';pageLabel.setAttribute?.('aria-live','polite');
 const next=make('button','다음',paging),last=make('button','마지막',paging);
 let displayLimit=10000,pageSize=50,page=1;
 limitInput.onchange=()=>{displayLimit=Math.max(1,Math.min(10000,Math.floor(Number.isFinite(Number(limitInput.value))?Number(limitInput.value):10000)));limitInput.value=String(displayLimit);page=1;persist();render();};
 sizeInput.onchange=()=>{pageSize=[10,25,50,100,200,500].includes(Number(sizeInput.value))?Number(sizeInput.value):50;page=1;persist();render();};
 first.onclick=()=>{page=1;render();};prev.onclick=()=>{page--;render();};next.onclick=()=>{page++;render();};last.onclick=()=>{page=Math.ceil(Math.min(selected().length,displayLimit)/pageSize)||1;render();};

 let target=guild.value,chan='',rows=[],active=false,handlers=[],storageFailed=false;
 const messages=new Map(),users=new Map(),guilds=new Map(),channels=new Map(),members=new Map();
 const observedTypes={},observedGuilds={},recentEvents=[];
 function observe(o){
  if(o.op!==0||!TYPES.includes(o.t))return;
  const d=o.d||{},cid=d.channel_id||null,gid=d.guild_id||channels.get(cid)?.guild_id||null;
  observedTypes[o.t]=(observedTypes[o.t]||0)+1;
  if(gid)observedGuilds[gid]=(observedGuilds[gid]||0)+1;
  recentEvents.push({type:o.t,guildId:gid,channelId:cid});
  if(recentEvents.length>10)recentEvents.shift();
 }
 function diagnostics(){return {serverId:target,channelId:chan||null,serverName:guilds.get(target)||null,recording:active,received:health.packets,decoded:health.decoded,stored:rows.length,eventTypes:{...observedTypes},servers:{...observedGuilds},lastEvents:recentEvents.slice()};}
 const key='discord-event-recorder-v1';
 try{const saved=JSON.parse(w.localStorage.getItem(key)||'null');if(saved&&Array.isArray(saved.rows)){rows=saved.rows;target=saved.target||target;chan=saved.chan||'';guild.value=target;channel.value=chan;displayLimit=Math.max(1,Math.min(10000,Math.floor(Number(saved.displayLimit)||10000)));pageSize=[10,25,50,100,200,500].includes(Number(saved.pageSize))?Number(saved.pageSize):50;}}catch{}
 limitInput.value=String(displayLimit);sizeInput.value=String(pageSize);
 const say=s=>{hint.textContent=s;};
 function persist(){try{w.localStorage.setItem(key,JSON.stringify({target,chan,rows,displayLimit,pageSize}));storageFailed=false;}catch{storageFailed=true;}}
 function scan(o,gid){if(!o||typeof o!=='object')return;if(Array.isArray(o)){for(const x of o)scan(x,gid);return;}
  let here=gid;if(o.id&&(o.name||o.properties?.name)&&(o.channels||o.members||o.roles)){guilds.set(o.id,o.name||o.properties.name);here=o.id;for(const ch of [...(o.channels||[]),...(o.threads||[])])channels.set(ch.id,{...ch,guild_id:ch.guild_id||here});}
  if(o.id&&o.username)users.set(o.id,o);
  if(o.user?.id){users.set(o.user.id,o.user);if(here)members.set(here+':'+o.user.id,o);}
  if(o.id&&o.name&&o.guild_id)channels.set(o.id,o);
  for(const [k,v]of Object.entries(o)){if(k==='guild_id'&&typeof v==='string')here=v;}
  if(o.user?.id&&here)members.set(here+':'+o.user.id,o);
  for(const [k,v]of Object.entries(o))if(k!=='user')scan(v,here);
 }
 function lookup(gid,cid,uid,member){const ch=C?.ChannelStore?.getChannel?.(cid)||channels.get(cid);const g=C?.GuildStore?.getGuild?.(gid);const u=C?.UserStore?.getUser?.(uid)||users.get(uid);const m=C?.GuildMemberStore?.getMember?.(gid,uid)||member||members.get(gid+':'+uid);
  return {guildName:g?.name||guilds.get(gid)||null,channelName:ch?.name||null,nickname:m?.nick||null,username:u?.username||null,globalName:u?.globalName||u?.global_name||null,displayName:m?.nick||u?.globalName||u?.global_name||u?.username||uid||'미확인'};}
 function ingest(type,e,receivedAt=new Date().toISOString(),source='live'){
  if(!TYPES.includes(type))return;
  receivedAt=e.__receivedAt||receivedAt; const m=e.message||e;const cid=m.channel_id||m.channelId||e.channelId;const mid=m.id||e.id;
  const cached=mid?messages.get(cid+':'+mid):null;
  const stored=C?.MessageStore?.getMessage?.(cid,mid);
  const merged={...(stored||{}),...(cached||{}),...m};const ch=C?.ChannelStore?.getChannel?.(cid)||channels.get(cid);
  const gid=m.guild_id||m.guildId||e.guildId||merged.guild_id||merged.guildId||ch?.guild_id||ch?.guildId;
  if(gid!==target||(chan&&cid!==chan))return;
  const uid=m.user_id||m.userId||merged.author?.id||null;
  if(m.author?.id)users.set(m.author.id,m.author);
  const previous=cached?.content??null;
  if(type!=='TYPING_START'&&mid){messages.set(cid+':'+mid,merged);if(messages.size>10000)messages.delete(messages.keys().next().value);}
  const ts=type==='TYPING_START'&&typeof m.timestamp==='number'?new Date(m.timestamp*1000).toISOString():null;
  const row={type,guildId:gid,channelId:cid,userId:uid,messageId:type==='TYPING_START'?null:mid||null,...lookup(gid,cid,uid,m.member),receivedAt,eventTimestamp:ts,source,content:type==='TYPING_START'?null:merged.content??null,previousContent:type==='MESSAGE_UPDATE'?previous:null,editedTimestamp:m.edited_timestamp||m.editedTimestamp||null,attachments:type==='TYPING_START'?[]:(merged.attachments||[]).map(a=>({id:a.id,filename:a.filename,url:a.url})),customTypingIndicatorConfig:type==='TYPING_START'?(m.customTypingIndicatorConfig??null):undefined};
  rows.push(row);if(rows.length>10000)rows.shift();persist();render();
 }
 function selected(){const q=search.value.toLowerCase();return rows.filter(r=>r.guildId===target&&(!chan||r.channelId===chan)&&enabled[r.type]?.checked&&(!q||JSON.stringify(r).toLowerCase().includes(q)));}
 function render(){const view=selected(),visible=view.slice(-displayLimit).reverse(),pages=Math.max(1,Math.ceil(visible.length/pageSize));page=Math.max(1,Math.min(page,pages));const offset=(page-1)*pageSize;pageLabel.textContent=page+' / '+pages+' 페이지';first.disabled=prev.disabled=page===1;next.disabled=last.disabled=page===pages;tbody.replaceChildren();for(const r of visible.slice(offset,offset+pageSize)){
  const tr=make('tr',undefined,tbody);const time=r.eventTimestamp||r.receivedAt;make('td',time?new Date(time).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false}):'시각 미확인',tr);
  make('td',labels[r.type]||r.type,tr);const gc=make('td',(r.guildName||'서버명 미확인')+' / '+(r.channelName||'채널명 미확인'),tr);make('div',r.guildId+'\n'+r.channelId,gc).className='sub';
  const uc=make('td',r.displayName||r.userId||'작성자 미확인',tr);make('div',(r.username?'@'+r.username+'\n':'')+(r.userId||'ID 없음'),uc).className='sub';
  const body=make('td',r.type==='TYPING_START'?'입력 중':r.content??'본문 미확인',tr);if(r.previousContent!==null&&r.previousContent!==undefined&&r.previousContent!==r.content)make('div','변경 전: '+r.previousContent,body).className='sub';make('td',r.messageId||'—',tr);
 }
 status.textContent=(active?'기록 중':'기록 중지')+' · 저장 '+rows.length+'개 · 검색 결과 '+view.length+'개 · 표시 '+visible.length+'개'+(storageFailed?' · 자동 저장 실패: JSON으로 내려받으세요.':'');
 if(!visible.length){const tr=make('tr',undefined,tbody);const cell=make('td',search.value?'검색 결과가 없습니다.':active?'새 알림을 기다리는 중입니다.':'기록이 없습니다.',tr);cell.colSpan=6;cell.style.color='#7b8492';}}
 const save=(name,data,mime)=>{const url=w.URL.createObjectURL(new Blob([data],{type:mime}));const a=make('a');a.href=url;a.download=name;a.click();a.remove();setTimeout(()=>w.URL.revokeObjectURL(url),10000);};
 exp.onclick=()=>save('discord-events-'+target+'.json',JSON.stringify({version:1,targetGuildId:target,exportedAt:new Date().toISOString(),events:selected()},null,2),'application/json');
 csv.onclick=()=>{const cols=['type','receivedAt','eventTimestamp','guildId','guildName','channelId','channelName','userId','nickname','username','globalName','displayName','messageId','content','previousContent'];const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';save('discord-events-'+target+'.csv','\ufeff'+[cols.join(','),...selected().map(r=>cols.map(k=>esc(/^[=+@\-]/.test(String(r[k]??''))?"'"+r[k]:r[k])).join(','))].join('\r\n'),'text/csv;charset=utf-8');};
 clear.onclick=()=>{if(w.confirm('저장된 기록을 모두 지울까요?')){rows=[];messages.clear();page=1;persist();render();}};
 apply.onclick=()=>{if(!/^\d{15,22}$/.test(guild.value.trim())||(channel.value.trim()&&!/^\d{15,22}$/.test(channel.value.trim()))){say('서버 ID와 채널 ID를 확인하세요.');return false;}target=guild.value.trim();chan=channel.value.trim();page=1;persist();render();say('설정을 적용했습니다.');return true;};
 for(const i of Object.values(enabled))i.onchange=()=>{page=1;render();};
 function halt(){if(C)for(const [t,f]of handlers)C.FluxDispatcher.unsubscribe(t,f);handlers=[];active=false;start.disabled=!C;start.textContent='기록 시작';stop.disabled=true;render();}
 start.onclick=()=>{if(!apply.onclick())return;halt();for(const t of TYPES){const f=e=>{try{ingest(t,e);}catch(ex){say('기록하지 못했습니다. 코드를 다시 실행하세요.');}};C.FluxDispatcher.subscribe(t,f);handlers.push([t,f]);}active=true;start.disabled=true;stop.disabled=false;start.textContent='기록 중';if(!health.packets)say('기록을 시작했습니다. 알림을 기다리는 중입니다.');else say('기록 중입니다. 새 알림이 여기에 표시됩니다.');render();};stop.onclick=halt;
 w.addEventListener('beforeunload',halt);
 function parseObjects(s){const result=[];let depth=0,start=-1,string=false,escape=false;for(let i=0;i<s.length;i++){const c=s[i];if(string){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')string=false;continue;}if(c==='"')string=true;else if(c==='{'){if(depth++===0)start=i;}else if(c==='}'&&--depth===0)result.push(JSON.parse(s.slice(start,i+1)));}if(depth!==0)throw Error('파일이 완전하지 않습니다.');return result;}
 load.onchange=async()=>{try{say('파일을 여는 중…');const data=JSON.parse(await load.files[0].text());if(data.log?.entries){const decoded=[];for(const entry of data.log.entries){if(!isGateway(entry.request?.url||''))continue;const frames=(entry._webSocketMessages||[]).filter(m=>m.type==='receive');const binary=frames.filter(m=>m.opcode===2);if(!binary.length)continue;const chunks=binary.map(m=>Uint8Array.from(atob(m.data),c=>c.charCodeAt(0)));const total=chunks.reduce((a,b)=>a+b.length,0);const joined=new Uint8Array(total);let pos=0;for(const b of chunks){joined.set(b,pos);pos+=b.length;}if(joined[0]!==0x78)throw Error('연결 시작부터 저장한 HAR 파일이 필요합니다.');const raw=new Uint8Array(total-2+5);raw.set(joined.subarray(2,total),0);raw.set([1,0,0,255,255],total-2);const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));const text=await new Response(stream).text();const objects=parseObjects(text);if(objects.length!==binary.length)throw Error('파일 일부가 누락됐습니다. 다시 저장해 주세요.');objects.forEach((o,i)=>decoded.push({o,time:new Date(binary[i].time*1000).toISOString()}));}
  page=1;for(const x of decoded)scan(x.o.d);for(const x of decoded)if(x.o.op===0)ingest(x.o.t,x.o.d,x.time,'har');render();
 }else{const list=Array.isArray(data)?data:data.events;if(!Array.isArray(list))throw Error('HAR 또는 기록 JSON을 선택하세요.');for(const r of list)if(TYPES.includes(r.type)&&r.guildId===target&&(!chan||r.channelId===chan))rows.push(r);rows=rows.slice(-10000);page=1;persist();render();}
 say('파일을 열었습니다.');}catch(ex){say('파일을 열지 못했습니다. HAR 또는 기록 JSON인지 확인하세요.');}finally{load.value='';}};
 make('small','최근 10,000개 자동 저장 · 표시 설정은 저장·내보내기에 영향을 주지 않습니다.');

 // Creator footer matches the main page.
 make('style',".recorder-footer { padding: 12px 0 28px; line-height: 1.7; }\n\n.creator {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  margin: 0;\n  color: #747e8b;\n  font-size: 14px;\n  text-decoration: none;\n}\n\n.creator-by {\n  color: #747e8b;\n  font-size: 12px;\n}\n\n.creator-avatar {\n  display: block;\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  border: 1px solid #dce0e5;\n  object-fit: cover;\n}");
 const footer = make('footer');
 footer.className = 'recorder-footer';
 const creator = make('div', undefined, footer);
 creator.className = 'creator';
 make('span', 'by', creator).className = 'creator-by';
 const avatar = make('img', undefined, creator);
 avatar.className = 'creator-avatar';
 avatar.src = "https://cdn.discordapp.com/avatars/433514511513681920/6c25509f6799e247818ef5ab9906b80c.png?size=64";
 avatar.alt = '';
 avatar.width = 32;
 avatar.height = 32;
 make('span', "__m4gi__", creator);
 w.__discordRecorderStop=halt;w.__discordRecorder={ingest,selected,scan,observe,diagnostics,status:say,connection:s=>{health.state=s;healthRender();render();},packet:time=>{health.packets++;health.last=time;healthRender();if(health.packets===1)render();},decoded:(type,time)=>{health.decoded++;health.lastType=type;healthRender();},health};healthRender();render();
}
capture(recorder);
'기록 창을 열었습니다. 서버 ID를 확인하고 기록 시작을 누르세요.';
