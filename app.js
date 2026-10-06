const $=s=>document.querySelector(s),K='mi-dinero-v1',uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const mk0=()=>today().slice(0,7),fd=d=>d.split('-').reverse().join('/'),num=id=>parseFloat(String($('#'+id).value).replace(',','.'))||0;
const def=()=>({name:'Mi Dinero',cur:'$',theme:'auto',budget:0,
accounts:['Efectivo','Mercado Pago','Banco'].map((n,i)=>({id:'a'+i,name:n,ini:0})),
cats:['Comida','Transporte','Salud','Entretenimiento','Compras','Servicios','Suscripciones','Ahorro','Otros'].map((n,i)=>({id:'c'+i,name:n,subs:[],budget:0})),tx:[],goals:[]});
let S;try{S=JSON.parse(localStorage.getItem(K))||def()}catch(e){S=def()}
const save=()=>localStorage.setItem(K,JSON.stringify(S));
const f=n=>(n<0?'-':'')+S.cur+Math.abs(n).toLocaleString('es-AR',{maximumFractionDigits:2});
const nm=(a,id)=>a.find(x=>x.id==id)?.name||'—';
const opt=(a,sel)=>a.map(o=>`<option value="${o.id}" ${o.id==sel?'selected':''}>${esc(o.name)}</option>`).join('');
const MN=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],ml=m=>MN[+m.slice(5)-1];
const last6=()=>{const d=new Date(),o=[];for(let i=5;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);o.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'))}return o};
const sumM=(m,t)=>S.tx.filter(x=>x.type==t&&x.date.startsWith(m)).reduce((a,x)=>a+x.amount,0);
const catSpent=(c,m)=>S.tx.filter(x=>x.type=='gasto'&&x.cat==c&&x.date.startsWith(m)).reduce((a,x)=>a+x.amount,0);
const savM=m=>{const ac=S.cats.find(c=>c.name.toLowerCase()=='ahorro');return S.goals.flatMap(g=>g.hist||[]).filter(h=>h.d.startsWith(m)).reduce((a,h)=>a+h.a,0)+(ac?catSpent(ac.id,m):0)};
const bal=(id,u='9999')=>(S.accounts.find(x=>x.id==id)?.ini||0)+S.tx.reduce((s,t)=>{if(t.date>u)return s;
if(t.type=='ingreso'&&t.acc==id)s+=t.amount;if(t.type=='gasto'&&t.acc==id)s-=t.amount;
if(t.type=='transferencia'){if(t.acc==id)s-=t.amount;if(t.to==id)s+=t.amount}return s},0);
const totBal=u=>S.accounts.reduce((a,x)=>a+bal(x.id,u),0);
const bar=p=>`<div class="bar"><i style="width:${Math.min(p,100)}%;background:${p>=100?'var(--r)':p>=80?'#f59e0b':'var(--p)'}"></i></div>`;
const PAL=['#0f9d75','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#84cc16','#64748b'];
function bars(d){const mx=Math.max(1,...d.flatMap(x=>[x.a,x.b]));return `<svg viewBox="0 0 320 150" class="chart">`+d.map((x,i)=>{const X=10+i*52,ha=x.a/mx*110,hb=x.b/mx*110;
return `<rect x="${X}" y="${120-ha}" width="18" height="${ha}" rx="4" fill="var(--g)"/><rect x="${X+20}" y="${120-hb}" width="18" height="${hb}" rx="4" fill="var(--r)"/><text x="${X+19}" y="140" text-anchor="middle">${x.l}</text>`}).join('')+`</svg>`}
function line(v,l){const mn=Math.min(...v),r=(Math.max(...v)-mn)||1,p=v.map((y,i)=>[20+i*56,110-(y-mn)/r*90]);
return `<svg viewBox="0 0 320 150" class="chart"><polyline points="${p.map(q=>q.join(',')).join(' ')}" fill="none" stroke="var(--p)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${p.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="var(--p)"/><text x="${q[0]}" y="140" text-anchor="middle">${l[i]}</text>`).join('')}</svg>`}
const leg='<div class="leg"><span style="color:var(--g)">● Ingresos</span><span style="color:var(--r)">● Gastos</span></div>';
const mchart=()=>{const L=last6();return leg+bars(L.map(m=>({l:ml(m),a:sumM(m,'ingreso'),b:sumM(m,'gasto')})))};
const txRow=t=>{const c=S.cats.find(x=>x.id==t.cat),s=c?.subs.find(x=>x.id==t.sub),tr=t.type=='transferencia',a=nm(S.accounts,t.acc);
return `<div class="row" onclick="txForm('${t.id}')"><span class="dot ${t.type}">${tr?'⇄':t.type=='ingreso'?'↑':'↓'}</span><div class="fl"><b>${esc(t.desc||(tr?'Transferencia':c?c.name:'Sin categoría'))}</b><small>${esc(tr?a+' → '+nm(S.accounts,t.to):[c?.name,s?.name,a].filter(Boolean).join(' · '))} · ${fd(t.date)}</small></div><b class="${t.type=='ingreso'?'g':tr?'':'r'}">${t.type=='gasto'?'-':t.type=='ingreso'?'+':''}${f(t.amount)}</b></div>`};
let tab='home',T,CE,CB,SM=null,F={q:'',d1:'',d2:'',cat:'',type:'',acc:''};const views={};
const TABS=[['home','🏠','Inicio'],['hist','🧾','Historial'],['stats','📊','Estadísticas'],['goals','🎯','Metas'],['cfg','⚙️','Ajustes']];
function render(){document.documentElement.dataset.t=S.theme=='auto'?'':S.theme;$('#ttl').textContent=S.name;document.title=S.name;
$('#nav').innerHTML=TABS.map(([k,i,l])=>`<button class="${k==tab?'on':''}" onclick="go('${k}')"><span>${i}</span>${l}</button>`).join('');
const m=$('#main');m.innerHTML=views[tab]();m.className='';void m.offsetWidth;m.className='fade';if(tab=='hist')hl()}
const go=k=>{tab=k;scrollTo(0,0);render()};
function toggleTheme(){const d=matchMedia('(prefers-color-scheme: dark)').matches,cur=S.theme=='auto'?(d?'dark':'light'):S.theme;S.theme=cur=='dark'?'light':'dark';save();render()}
const sheet=h=>{$('#sheet').innerHTML=h;document.body.classList.add('open')},closeSheet=()=>document.body.classList.remove('open');
function numSheet(t,v,cb,l){CB=cb;sheet(`<h3>${esc(t)}</h3><label>${l||'Monto'}</label><input id="ns" class="big" type="number" inputmode="decimal" value="${v||''}"><button class="btn" onclick="CB(num('ns'));closeSheet()">Guardar</button>`)}

views.home=()=>{const m=mk0(),inc=sumM(m,'ingreso'),exp=sumM(m,'gasto'),rem=S.budget?S.budget-exp:null;
return `<div class="hero"><small>Saldo total</small><b>${f(totBal())}</b></div>
<div class="grid">${S.accounts.map(a=>`<div class="card"><small>${esc(a.name)}</small><b>${f(bal(a.id))}</b></div>`).join('')}</div>
<div class="grid"><div class="card"><small>Ingresos del mes</small><b class="g">${f(inc)}</b></div><div class="card"><small>Gastos del mes</small><b class="r">${f(exp)}</b></div>
<div class="card"><small>Ahorros del mes</small><b>${f(savM(m))}</b></div><div class="card"><small>Presupuesto restante</small><b class="${rem<0?'r':''}">${rem===null?'Sin definir':f(rem)}</b></div></div>
<div class="card"><b>Ingresos y gastos</b>${mchart()}</div>
<h2>Últimos movimientos</h2><div class="card">${S.tx.length?S.tx.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(txRow).join(''):'<small>Todavía no hay movimientos. Tocá ＋ para crear el primero.</small>'}</div>`};

function txForm(id){if(!S.accounts.length)return alert('Primero creá una cuenta en Ajustes');
const t=id?S.tx.find(x=>x.id==id):{type:'gasto',date:today(),amount:'',acc:S.accounts[0].id,to:S.accounts[1]?.id,cat:'',sub:'',desc:''};T={...t};
sheet(`<h3>${id?'Editar':'Nuevo'} movimiento</h3><div class="seg">${['gasto','ingreso','transferencia'].map(k=>`<button id="s_${k}" onclick="setType('${k}')">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
<label>Importe</label><input id="f_a" class="big" type="number" inputmode="decimal" placeholder="0" value="${t.amount}">
<label>Fecha</label><input id="f_d" type="date" value="${t.date}">
<label id="l_acc">Cuenta</label><select id="f_acc">${opt(S.accounts,t.acc)}</select>
<div id="tobox"><label>Cuenta destino</label><select id="f_to">${opt(S.accounts,t.to)}</select></div>
<div id="catbox"><label>Categoría</label><select id="f_c" onchange="fillSubs()"><option value="">Sin categoría</option>${opt(S.cats,t.cat)}</select><label>Subcategoría</label><select id="f_s"></select></div>
<label>Descripción</label><input id="f_ds" value="${esc(t.desc||'')}" placeholder="Opcional">
<button class="btn" onclick="saveTx('${id||''}')">Guardar</button>${id?`<button class="btn del" onclick="delTx('${id}')">Eliminar movimiento</button>`:''}`);setType(T.type);fillSubs(t.sub)}
function setType(k){T.type=k;['gasto','ingreso','transferencia'].forEach(x=>$('#s_'+x).classList.toggle('on',x==k));
$('#tobox').style.display=k=='transferencia'?'':'none';$('#catbox').style.display=k=='transferencia'?'none':'';$('#l_acc').textContent=k=='transferencia'?'Cuenta origen':'Cuenta'}
function fillSubs(sel){const c=S.cats.find(x=>x.id==$('#f_c').value);$('#f_s').innerHTML='<option value="">Sin subcategoría</option>'+(c?opt(c.subs,sel):'')}
function saveTx(id){const a=num('f_a');if(a<=0)return alert('Ingresá un importe mayor a 0');const tr=T.type=='transferencia',acc=$('#f_acc').value,to=tr?$('#f_to').value:'';
if(tr&&acc==to)return alert('La cuenta origen y destino deben ser distintas');
const o={id:id||uid(),type:T.type,amount:a,date:$('#f_d').value||today(),acc,to,cat:tr?'':$('#f_c').value,sub:tr?'':$('#f_s').value,desc:$('#f_ds').value.trim()};
if(id)S.tx[S.tx.findIndex(x=>x.id==id)]=o;else S.tx.push(o);save();closeSheet();render()}
function delTx(id){if(confirm('¿Eliminar este movimiento?')){S.tx=S.tx.filter(x=>x.id!=id);save();closeSheet();render()}}

views.hist=()=>`<div class="card"><input placeholder="🔍 Buscar..." value="${esc(F.q)}" oninput="F.q=this.value;hl()">
<div class="two"><div><label>Desde</label><input type="date" value="${F.d1}" onchange="F.d1=this.value;hl()"></div><div><label>Hasta</label><input type="date" value="${F.d2}" onchange="F.d2=this.value;hl()"></div></div>
<div class="two"><select onchange="F.cat=this.value;hl()"><option value="">Todas las categorías</option>${opt(S.cats,F.cat)}</select>
<select onchange="F.type=this.value;hl()">${[['','Todos los tipos'],['gasto','Gastos'],['ingreso','Ingresos'],['transferencia','Transferencias']].map(([v,l])=>`<option value="${v}" ${F.type==v?'selected':''}>${l}</option>`).join('')}</select></div>
<select onchange="F.acc=this.value;hl()"><option value="">Todas las cuentas</option>${opt(S.accounts,F.acc)}</select>
<button class="btn sec" style="margin:0" onclick="F={q:'',d1:'',d2:'',cat:'',type:'',acc:''};render()">Limpiar filtros</button></div><div class="card" id="hl"></div>`;
function hl(){const q=F.q.toLowerCase(),r=S.tx.filter(t=>{const c=S.cats.find(x=>x.id==t.cat);
return(!F.d1||t.date>=F.d1)&&(!F.d2||t.date<=F.d2)&&(!F.cat||t.cat==F.cat)&&(!F.type||t.type==F.type)&&(!F.acc||t.acc==F.acc||t.to==F.acc)&&
(!q||[t.desc,c?.name,c?.subs.find(s=>s.id==t.sub)?.name,nm(S.accounts,t.acc),String(t.amount)].join(' ').toLowerCase().includes(q))}).sort((a,b)=>b.date.localeCompare(a.date));
$('#hl').innerHTML=`<small style="margin-bottom:10px">${r.length} movimiento(s)</small>`+(r.map(txRow).join('')||'<small>No hay resultados.</small>')}

views.stats=()=>{const m=SM||mk0(),by={};S.tx.filter(t=>t.type=='gasto'&&t.date.startsWith(m)).forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amount);
const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]),tot=rows.reduce((a,r)=>a+r[1],0),L=last6(),ex=L.map(x=>sumM(x,'gasto')),mx=Math.max(1,...ex);
return `<label>Mes</label><input type="month" value="${m}" onchange="SM=this.value||null;render()">
<div class="card"><small>Gastos del mes</small><b class="r" style="font-size:28px">${f(tot)}</b></div>
<div class="card"><b>Gastos por categoría</b>${rows.length?rows.map(([c,v],i)=>`<div style="margin-top:12px"><div class="row" style="margin:0"><span class="fl">${esc(nm(S.cats,c)=='—'?'Sin categoría':nm(S.cats,c))}</span><b>${f(v)}</b><small>${Math.round(v/tot*100)}%</small></div><div class="bar"><i style="width:${v/tot*100}%;background:${PAL[i%9]}"></i></div></div>`).join(''):'<small>Sin gastos en este mes</small>'}</div>
<div class="card"><b>Ingresos vs gastos</b>${mchart()}</div>
<div class="card"><b>Evolución del saldo</b>${line(L.map(x=>totBal(x+'-31')),L.map(ml))}</div>
<div class="card"><b>Gastos de meses anteriores</b>${L.slice().reverse().map((x,i)=>{const v=ex[5-i];return `<div style="margin-top:12px"><div class="row" style="margin:0"><span class="fl">${ml(x)} ${x.slice(0,4)}</span><b>${f(v)}</b></div><div class="bar"><i style="width:${v/mx*100}%;background:var(--r)"></i></div></div>`}).join('')}</div>`};

views.goals=()=>{const m=mk0(),exp=sumM(m,'gasto'),b=S.budget,p=b?Math.round(exp/b*100):0;
return `<h2>Presupuesto del mes</h2><div class="card" onclick="numSheet('Presupuesto mensual',S.budget,v=>{S.budget=v;save();render()})"><div class="two"><div><small>Presupuesto</small><b>${f(b)}</b></div><div><small>Gastado</small><b class="r">${f(exp)}</b></div></div>
<div class="two"><div><small>Disponible</small><b>${b?f(b-exp):'—'}</b></div><div><small>Utilizado</small><b>${b?p+'%':'—'}</b></div></div>${bar(p)}<small class="tap">Tocá para editar</small></div>
<h3>Por categoría</h3>${S.cats.map(c=>{const s=catSpent(c.id,m),q=c.budget?Math.round(s/c.budget*100):0;return `<div class="card" onclick="catBud('${c.id}')"><div class="row" style="margin:0"><b class="fl">${esc(c.name)}</b><small>${c.budget?f(s)+' de '+f(c.budget)+' · '+q+'%':'Sin presupuesto · gastado '+f(s)}</small></div>${c.budget?bar(q):''}</div>`}).join('')}
<h2>Objetivos de ahorro</h2>${S.goals.map(g=>{const q=g.target?Math.round(g.saved/g.target*100):0,dl=g.date?Math.ceil((new Date(g.date)-new Date(today()))/864e5):null;
return `<div class="card"><div class="row" style="margin:0"><b class="fl">${esc(g.name)}</b><b>${q}%</b></div><small>${f(g.saved)} de ${f(g.target)}${g.date?' · meta '+fd(g.date)+(dl>=0?' ('+dl+' días)':' (vencida)'):''}</small>${bar(q)}
<div class="two" style="margin:10px 0 0"><button class="btn sec" style="margin:0" onclick="aport('${g.id}')">Aportar</button><button class="btn sec" style="margin:0" onclick="goalForm('${g.id}')">Editar</button></div></div>`}).join('')||'<small style="margin-bottom:10px">Todavía no creaste objetivos.</small>'}
<button class="btn" onclick="goalForm()">+ Nuevo objetivo</button>`};
function catBud(id){const c=S.cats.find(x=>x.id==id);numSheet('Presupuesto de '+c.name,c.budget,v=>{c.budget=v;save();render()},'Presupuesto mensual')}
function aport(id){const g=S.goals.find(x=>x.id==id);numSheet('Aportar a '+g.name,'',v=>{g.saved+=v;(g.hist=g.hist||[]).push({d:today(),a:v});save();render()},'Monto (negativo para retirar)')}
function goalForm(id){const g=id?S.goals.find(x=>x.id==id):{name:'',target:'',saved:'',date:''};
sheet(`<h3>${id?'Editar':'Nuevo'} objetivo</h3><label>Nombre</label><input id="g_n" value="${esc(g.name)}"><label>Objetivo total</label><input id="g_t" type="number" inputmode="decimal" value="${g.target}"><label>Dinero ahorrado</label><input id="g_s" type="number" inputmode="decimal" value="${g.saved}"><label>Fecha objetivo (opcional)</label><input id="g_d" type="date" value="${g.date||''}">
<button class="btn" onclick="saveGoal('${id||''}')">Guardar</button>${id?`<button class="btn del" onclick="delGoal('${id}')">Eliminar</button>`:''}`)}
function saveGoal(id){const n=$('#g_n').value.trim();if(!n)return alert('Poné un nombre');const o={name:n,target:num('g_t'),saved:num('g_s'),date:$('#g_d').value};
if(id)Object.assign(S.goals.find(x=>x.id==id),o);else S.goals.push({id:uid(),hist:[],...o});save();closeSheet();render()}
function delGoal(id){if(confirm('¿Eliminar objetivo?')){S.goals=S.goals.filter(x=>x.id!=id);save();closeSheet();render()}}

views.cfg=()=>`<h2>General</h2><div class="card"><label>Nombre de la aplicación</label><input value="${esc(S.name)}" onchange="S.name=this.value.trim()||'Mi Dinero';save();render()">
<label>Símbolo de moneda</label><input value="${esc(S.cur)}" maxlength="5" onchange="S.cur=this.value.trim()||'$';save();render()">
<label>Tema</label><select onchange="S.theme=this.value;save();render()">${[['auto','Automático'],['light','Claro'],['dark','Oscuro']].map(([v,l])=>`<option value="${v}" ${S.theme==v?'selected':''}>${l}</option>`).join('')}</select></div>
<h2>Cuentas y billeteras</h2><div class="card">${S.accounts.map(a=>`<div class="row" onclick="accForm('${a.id}')"><div class="fl"><b>${esc(a.name)}</b><small>Saldo inicial ${f(a.ini)}</small></div><b>${f(bal(a.id))}</b></div>`).join('')||'<small>Sin cuentas</small>'}</div>
<button class="btn sec" style="margin:0 0 8px" onclick="accForm()">+ Agregar cuenta</button><button class="btn" style="margin:0" onclick="iniForm()">Configurar saldo inicial</button>
<h2>Categorías y subcategorías</h2><div class="card">${S.cats.map(c=>`<div class="row" onclick="catForm('${c.id}')"><div class="fl"><b>${esc(c.name)}</b><small>${c.subs.length?esc(c.subs.map(s=>s.name).join(', ')):'Sin subcategorías'}</small></div><span>›</span></div>`).join('')}</div>
<button class="btn sec" style="margin:0" onclick="catForm()">+ Nueva categoría</button>
<h2>Datos</h2><button class="btn sec" style="margin:0 0 8px" onclick="exp_()">Exportar copia de seguridad</button><button class="btn sec" style="margin:0 0 8px" onclick="$('#fi').click()">Importar copia de seguridad</button>
<input type="file" id="fi" accept=".json,application/json" hidden onchange="imp(event)"><button class="btn del" style="margin:0" onclick="wipe()">Eliminar todos los datos</button>`;
function accForm(id){const a=id?S.accounts.find(x=>x.id==id):{name:'',ini:''};
sheet(`<h3>${id?'Editar':'Nueva'} cuenta</h3><label>Nombre</label><input id="a_n" value="${esc(a.name)}"><label>Saldo inicial</label><input id="a_i" type="number" inputmode="decimal" value="${a.ini||''}">
<button class="btn" onclick="saveAcc('${id||''}')">Guardar</button>${id?`<button class="btn del" onclick="delAcc('${id}')">Eliminar cuenta</button>`:''}`)}
function saveAcc(id){const n=$('#a_n').value.trim();if(!n)return alert('Poné un nombre');if(id){const a=S.accounts.find(x=>x.id==id);a.name=n;a.ini=num('a_i')}else S.accounts.push({id:uid(),name:n,ini:num('a_i')});save();closeSheet();render()}
function delAcc(id){if(S.tx.some(t=>t.acc==id||t.to==id))return alert('Esta cuenta tiene movimientos. Eliminá o editá esos movimientos primero.');if(confirm('¿Eliminar cuenta?')){S.accounts=S.accounts.filter(x=>x.id!=id);save();closeSheet();render()}}
function iniForm(){sheet(`<h3>Saldo inicial</h3><small style="margin-bottom:8px">¿Cuánto dinero tenías en cada cuenta al empezar a usar la app?</small>${S.accounts.map(a=>`<label>${esc(a.name)}</label><input id="i_${a.id}" type="number" inputmode="decimal" value="${a.ini||''}">`).join('')}<button class="btn" onclick="S.accounts.forEach(a=>a.ini=num('i_'+a.id));save();closeSheet();render()">Guardar</button>`)}
function catForm(id){CE=id?JSON.parse(JSON.stringify(S.cats.find(c=>c.id==id))):{id:uid(),name:'',subs:[],budget:0,isNew:1};drawCat()}
function drawCat(){sheet(`<h3>${CE.isNew?'Nueva':'Editar'} categoría</h3><label>Nombre</label><input value="${esc(CE.name)}" oninput="CE.name=this.value"><label>Presupuesto mensual (opcional)</label><input type="number" inputmode="decimal" value="${CE.budget||''}" oninput="CE.budget=+this.value||0">
<label>Subcategorías</label>${CE.subs.map((s,i)=>`<div class="row"><input style="margin:0" value="${esc(s.name)}" placeholder="Nombre" oninput="CE.subs[${i}].name=this.value"><button class="ic" style="margin:0" onclick="CE.subs.splice(${i},1);drawCat()">✕</button></div>`).join('')}
<button class="btn sec" onclick="CE.subs.push({id:uid(),name:''});drawCat()">+ Agregar subcategoría</button><button class="btn" onclick="saveCat()">Guardar</button>${CE.isNew?'':'<button class="btn del" onclick="delCat()">Eliminar categoría</button>'}`)}
function saveCat(){CE.name=CE.name.trim();if(!CE.name)return alert('Poné un nombre');CE.subs=CE.subs.filter(s=>s.name.trim());const isNew=CE.isNew;delete CE.isNew;
if(isNew)S.cats.push(CE);else S.cats[S.cats.findIndex(c=>c.id==CE.id)]=CE;save();closeSheet();render()}
function delCat(){if(confirm('¿Eliminar categoría? Los movimientos quedarán "Sin categoría".')){S.cats=S.cats.filter(c=>c.id!=CE.id);save();closeSheet();render()}}
function exp_(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='mi-dinero-'+today()+'.json';a.click()}
function imp(e){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.accounts||!d.cats||!d.tx)throw 0;
if(confirm('Esto reemplaza todos tus datos actuales. ¿Continuar?')){S=d;save();render();alert('Copia importada correctamente')}}catch(x){alert('El archivo no es una copia válida')}};r.readAsText(e.target.files[0])}
function wipe(){if(confirm('¿Eliminar TODOS tus datos? No se puede deshacer.')&&confirm('¿Seguro? Se borrará todo.')){S=def();save();render()}}
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js'));
render();
