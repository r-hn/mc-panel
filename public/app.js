'use strict';
const $=s=>document.querySelector(s),A=$('#app'),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
let S={},tab='Overview',es,poll,fp='';
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2800)}
async function api(m,u,b,raw){const r=await fetch('/api/'+u,{method:m,headers:{'X-Panel':'1',...(b&&!raw?{'Content-Type':'application/json'}:{})},body:raw?b:b?JSON.stringify(b):undefined});
 if(r.status===401&&u!=='login'){loginView();throw Error('Session expired')}const t=await r.json().catch(()=>({}));if(!r.ok)throw Error(t.error||r.statusText);return t}
const run=async(f,ok)=>{try{const r=await f();ok&&toast(ok);return r}catch(e){toast(e.message)}};
const tog=(id,on)=>`<input type="checkbox" class="tog" id="${id}" ${on?'checked':''}>`;
const val=id=>{const e=$('#'+id);return e.type==='checkbox'?e.checked:e.value};

function loginView(){clearInterval(poll);es?.close();A.innerHTML=`<div class="login"><div class="logo">⛏</div><h1>Minecraft Panel</h1><p class="mut">Sign in to manage your server</p>
 <div class="card"><input id="u" placeholder="Username" autocomplete="username" autofocus><input id="p" type="password" placeholder="Password" autocomplete="current-password"></div>
 <button class="pri big" id="go">Sign in</button></div>`;
 const go=()=>run(async()=>{await api('POST','login',{username:val('u'),password:val('p')});boot()});
 $('#go').onclick=go;$('#p').onkeydown=e=>e.key==='Enter'&&go()}

async function boot(){S=await api('GET','state').catch(()=>null);if(!S)return;
 if(S.cfg.created&&!S.installing)dash();else if(S.installing)installView();else chooser()}

function chooser(){A.innerHTML=`<h1>Welcome</h1><p class="mut">Start fresh or bring a backup back to life.</p>
 <div class="choose"><div class="tile" id="new"><span style="font-size:30px">✨</span><b>Create new server</b><span class="mut">Fabric, ready in about a minute</span></div>
 <div class="tile"><span style="font-size:30px">📦</span><b>Choose backup</b>${S.backups.length?S.backups.map(b=>`<div class="row"><div class="g">${esc(b)}</div><button class="sm pri" data-r="${esc(b)}">Restore</button></div>`).join(''):'<span class="mut">No backups yet. Drop .tar.gz files into the <code>backups</code> folder.</span>'}</div></div>`;
 $('#new').onclick=wizard;A.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>run(async()=>{await api('POST','restore',{name:b.dataset.r});boot()}))}

async function wizard(){const vs=await api('GET','versions');let icon='';
 A.innerHTML=`<h1>New server</h1><p class="mut">Fabric · you can change most of this later.</p>
 <div class="card"><div class="row"><div class="g">Icon<small>Cropped to 64×64</small></div><img class="ic" id="ip" alt=""><input type="file" id="if" accept="image/*" style="width:auto"></div>
 <div class="row"><label>Name</label><input id="name" value="My Server"></div><div class="row"><label>MOTD</label><input id="motd" value="A Minecraft Server"></div>
 <div class="row"><label>Max players</label><input id="mp" type="number" min="1" value="20"></div>
 <div class="row"><div class="g">RAM<small id="rl">2 GB</small></div><input id="ram" type="range" min="1" max="16" value="2" style="width:45%"></div>
 <div class="row"><label>Version</label><select id="ver">${vs.map(v=>`<option>${v}</option>`).join('')}</select></div></div>
 <div class="card"><div class="row"><div class="g">Install recommended plugins<small>Fabric API, Lithium, FerriteCore, Spark</small></div>${tog('pl',1)}</div>
 <div class="row"><div class="g">Auto shutdown<small>Stop when nobody is online</small></div>${tog('as',0)}</div>
 <div class="row" id="ir" hidden><label>Idle timeout (min)</label><input id="idle" type="number" min="1" value="10"></div>
 <div class="row"><div class="g">Auto start<small>Wake the server when someone tries to join</small></div>${tog('au',0)}</div></div>
 <div class="card"><div class="row"><div class="g">I accept the <a href="https://aka.ms/MinecraftEULA" target="_blank" rel="noopener" style="color:var(--acc)">Minecraft EULA</a></div>${tog('eula',0)}</div></div>
 <button class="pri big" id="mk">Create server</button>`;
 $('#ram').oninput=()=>$('#rl').textContent=val('ram')+' GB';$('#as').onchange=()=>$('#ir').hidden=!val('as');
 $('#if').onchange=e=>{const f=e.target.files[0];if(!f)return;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),m=Math.min(im.width,im.height);
  x.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,64,64);icon=c.toDataURL('image/png');$('#ip').src=icon};im.src=URL.createObjectURL(f)};
 $('#mk').onclick=()=>run(async()=>{await api('POST','create',{name:val('name'),motd:val('motd'),maxPlayers:val('mp'),ram:val('ram')*1024,version:val('ver'),icon,plugins:val('pl'),autoShutdown:val('as'),idle:val('idle'),autoStart:val('au'),eula:val('eula')});boot()})}

function installView(){A.innerHTML=`<div class="login"><div class="logo">⛏</div><h1>Setting up…</h1><p class="mut" id="im">${esc(S.installing)}</p><div class="prog"><i></i></div></div>`;
 const t=setInterval(async()=>{S=await api('GET','state');if(S.installErr){clearInterval(t);toast(S.installErr);chooser()}else if(!S.installing){clearInterval(t);boot()}else $('#im').textContent=S.installing},1500)}

function dash(){es?.close();clearInterval(poll);
 A.innerHTML=`<div class="head"><div><h1>${esc(S.cfg.name)}</h1><span class="mut">Fabric ${esc(S.cfg.version)}</span></div><div><span id="st" class="pill"></span> <button class="sm" id="lo">Sign out</button></div></div>
 <div class="tabs">${['Overview','Plugins','Files','Settings'].map(t=>`<button class="${t===tab?'on':''}" data-t="${t}">${t}</button>`).join('')}</div><div id="v"></div>`;
 A.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;dash()});$('#lo').onclick=async()=>{await api('POST','logout');loginView()};
 poll=setInterval(async()=>{try{S=await api('GET','state');paint()}catch{}},3000);paint();({Overview:overview,Plugins:plugins,Files:files,Settings:settings})[tab]()}
function paint(){const s=$('#st');if(!s)return;s.className='pill '+S.status;s.textContent=S.status;const p=$('#pl2');if(p)p.innerHTML=S.players.length?S.players.map(n=>`<span class="chip">${esc(n)}</span>`).join(''):'<span class="mut">Nobody online</span>';
 const c=$('#cnt');if(c)c.textContent=`${S.players.length}/${S.cfg.maxPlayers}`}

function overview(){$('#v').innerHTML=`<div class="card"><div class="row"><div class="g">Players</div><b id="cnt"></b></div><div class="row" style="display:block" id="pl2"></div></div>
 <div class="btns"><button class="ok" data-a="start">Start</button><button class="blk" data-a="restart">Restart</button><button class="dng" data-a="stop">Stop</button></div>
 <div id="con"></div><div class="cmd"><input id="ci" placeholder="Send a command…"><button class="pri" id="cs">Send</button></div>`;paint();
 A.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>run(()=>api('POST',b.dataset.a),b.textContent+'…'));
 const con=$('#con');es=new EventSource('/api/logs');es.onmessage=e=>{const n=con.scrollTop+con.clientHeight>=con.scrollHeight-30;con.append(JSON.parse(e.data)+'\n');while(con.childNodes.length>400)con.firstChild.remove();if(n)con.scrollTop=con.scrollHeight};
 const send=()=>{const v=val('ci');if(v){api('POST','cmd',{cmd:v});$('#ci').value=''}};$('#cs').onclick=send;$('#ci').onkeydown=e=>e.key==='Enter'&&send()}

async function plugins(){$('#v').innerHTML=`<div class="cmd"><input id="q" placeholder="Search Modrinth for ${esc(S.cfg.version)}…"><button class="pri" id="qs">Search</button></div>
 <div id="res"></div><h2>Installed</h2><div class="card" id="inst"></div><h2>Upload</h2><div class="card"><div class="row"><div class="g">Add a .jar file</div><input type="file" id="up" accept=".jar" style="width:auto"></div></div>`;
 const list=async()=>{const l=await api('GET','plugins');$('#inst').innerHTML=l.length?l.map(f=>`<div class="row"><div class="g">${esc(f)}</div><button class="sm dng" data-d="${esc(f)}">Remove</button></div>`).join(''):'<div class="row mut">No plugins installed</div>';
  $('#inst').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>confirm('Remove '+b.dataset.d+'?')&&run(async()=>{await api('DELETE','file?p='+encodeURIComponent('mods/'+b.dataset.d));list()},'Removed'))};list();
 const search=()=>run(async()=>{const r=await api('GET','plugins/search?q='+encodeURIComponent(val('q')));$('#res').innerHTML='<div class="card">'+(r.map(p=>`<div class="row">${p.icon?`<img class="ic" src="${esc(p.icon)}" alt="">`:'<div class="ic"></div>'}<div class="g"><b>${esc(p.title)}</b><small>${esc(p.description)}</small></div><button class="sm pri" data-i="${esc(p.slug)}">Install</button></div>`).join('')||'<div class="row mut">No results</div>')+'</div>';
  $('#res').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{b.disabled=true;b.textContent='…';run(async()=>{await api('POST','plugins/install',{slug:b.dataset.i});b.textContent='Done';list()},'Installed — restart to apply').then(()=>b.disabled=false)})});
 $('#qs').onclick=search;$('#q').onkeydown=e=>e.key==='Enter'&&search();search();
 $('#up').onchange=e=>run(async()=>{const f=e.target.files[0];await api('POST',`upload?p=mods&name=${encodeURIComponent(f.name)}`,f,1);list()},'Uploaded')}

async function files(){const v=$('#v');
 const open=async p=>{fp=p;const l=await api('GET','files?p='+encodeURIComponent(p)),parts=p.split('/').filter(Boolean);
  v.innerHTML=`<div class="crumb"><a data-p="">server</a>${parts.map((x,i)=>' / <a data-p="'+esc(parts.slice(0,i+1).join('/'))+'">'+esc(x)+'</a>').join('')}</div>
  <div class="card">${l.map(f=>`<div class="row f" data-n="${esc(f.name)}" data-d="${f.dir?1:0}"><div class="g nm">${f.dir?'📁':'📄'} ${esc(f.name)}</div><span class="mut">${f.dir?'':(f.size/1024).toFixed(1)+' KB'}</span><button class="sm dng" data-x="${esc(f.name)}">Delete</button></div>`).join('')||'<div class="row mut">Empty folder</div>'}</div>
  <div class="btns"><button id="mkd">New folder</button><button onclick="this.nextElementSibling.click()">Upload file</button><input type="file" id="fu" hidden></div>`;
  v.querySelectorAll('[data-p]').forEach(a=>a.onclick=()=>open(a.dataset.p));
  v.querySelectorAll('.f').forEach(r=>r.onclick=e=>{if(e.target.dataset.x)return;const n=(p?p+'/':'')+r.dataset.n;r.dataset.d==='1'?open(n):edit(n)});
  v.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>confirm('Delete '+b.dataset.x+'?')&&run(async()=>{await api('DELETE','file?p='+encodeURIComponent((p?p+'/':'')+b.dataset.x));open(p)},'Deleted'));
  $('#mkd').onclick=()=>{const n=prompt('Folder name');n&&run(async()=>{await api('POST','mkdir?p='+encodeURIComponent((p?p+'/':'')+n));open(p)})};
  $('#fu').onchange=e=>run(async()=>{const f=e.target.files[0];await api('POST',`upload?p=${encodeURIComponent(p)}&name=${encodeURIComponent(f.name)}`,f,1);open(p)},'Uploaded')};
 const edit=async n=>{const r=await run(()=>api('GET','file?p='+encodeURIComponent(n)));if(!r)return;
  v.innerHTML=`<div class="crumb">${esc(n)}</div><textarea id="ta" spellcheck="false">${esc(r.content)}</textarea><div class="btns"><button id="bk">Back</button><button class="pri" id="sv">Save</button></div>`;
  $('#bk').onclick=()=>open(fp);$('#sv').onclick=()=>run(()=>api('PUT','file?p='+encodeURIComponent(n),{content:val('ta')}),'Saved')};
 open(fp)}

async function settings(){const c=S.cfg,d=c.discord||{},pr=await api('GET','props');
 const f=(id,l,v,t='text',h='')=>`<div class="row"><div class="g">${l}${h?`<small>${h}</small>`:''}</div><input id="${id}" type="${t}" value="${esc(v)}"></div>`;
 $('#v').innerHTML=`<h2>General</h2><div class="card">${f('name','Name',c.name)}${f('motd','MOTD',c.motd)}${f('mp','Max players',c.maxPlayers,'number')}${f('ram','RAM (MB)',c.ram,'number','Applies on next start')}</div>
 <h2>Automation</h2><div class="card"><div class="row"><div class="g">Auto shutdown<small>Stop when idle</small></div>${tog('as',c.autoShutdown)}</div>${f('idle','Idle timeout (min)',c.idle,'number')}
 <div class="row"><div class="g">Auto start<small>Wake on join attempt</small></div>${tog('au',c.autoStart)}</div></div>
 <h2>Discord</h2><div class="card">${f('tk','Bot token','','password',d.hasToken?'Saved — leave blank to keep':'')}${f('or','Op role ID',d.opRole||'')}${f('pc','Panel channel ID',d.panelChat||'','text','Status, players, buttons')}${f('cc','Console channel ID',d.consoleChat||'')}${f('xc','Cross-chat channel ID',d.crossChat||'')}</div>
 <button class="pri big" id="sv">Save settings</button>
 <h2>Backups</h2><div class="card">${S.backups.map(b=>`<div class="row"><div class="g">${esc(b)}</div><button class="sm" data-r="${esc(b)}">Restore</button><button class="sm dng" data-x="${esc(b)}">Delete</button></div>`).join('')}<div class="row"><button id="bk" class="sm blk">Create backup now</button></div></div>
 <h2>server.properties</h2><div class="card">${Object.entries(pr).map(([k,v])=>`<div class="row"><label>${esc(k)}</label><input data-k="${esc(k)}" value="${esc(v)}"></div>`).join('')||'<div class="row mut">Start the server once to generate this file</div>'}</div>
 <button class="pri big" id="sp">Save properties</button>`;
 $('#sv').onclick=()=>run(async()=>{await api('POST','settings',{name:val('name'),motd:val('motd'),maxPlayers:val('mp'),ram:val('ram'),autoShutdown:val('as'),idle:val('idle'),autoStart:val('au'),discord:{token:val('tk'),opRole:val('or'),panelChat:val('pc'),consoleChat:val('cc'),crossChat:val('xc')}});S=await api('GET','state')},'Saved');
 $('#sp').onclick=()=>{const o={};A.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k]=i.value);run(()=>api('POST','props',o),'Saved — restart to apply')};
 $('#bk').onclick=()=>run(async()=>{await api('POST','backups');S=await api('GET','state');settings()},'Backup created');
 A.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>confirm('Replace current server with this backup?')&&run(async()=>{await api('POST','restore',{name:b.dataset.r});boot()},'Restored'));
 A.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>run(async()=>{await api('DELETE','backups?name='+encodeURIComponent(b.dataset.x));S=await api('GET','state');settings()}))}
boot().then(()=>{if(!S.cfg)loginView()});
