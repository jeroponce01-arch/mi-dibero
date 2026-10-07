const $=s=>document.querySelector(s),K='mi-dinero-v1',uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const mk0=()=>today().slice(0,7),fd=d=>d.split('-').reverse().join('/'),num=id=>Math.round(pnum($('#'+id).value)*100)/100;
const def=()=>({name:'Mi Dinero',cur:'$',theme:'auto',budget:0,
accounts:['Efectivo','Mercado Pago','Banco'].map((n,i)=>({id:'a'+i,name:n,ini:0})),
cats:[],tx:[],goals:[],investments:[],plans:{}});
let S;try{S=JSON.parse(localStorage.getItem(K))||def()}catch(e){S=def()}
if(!Array.isArray(S.investments))S.investments=[];
if(!S.plans||typeof S.plans!='object')S.plans={};
function cleanDefaultCats(){S.cats=(Array.isArray(S.cats)?S.cats:[]).filter(c=>!(c.fixed&&!S.tx.some(t=>t.cat==c.id))).map(c=>({...c,fixed:false,subs:(c.subs||[]).map(x=>({...x,fixed:false}))}));}
cleanDefaultCats();
const save=()=>localStorage.setItem(K,JSON.stringify(S));
const f=n=>{const r=Math.round((+n||0)*100)/100,[i,d]=Math.abs(r).toFixed(2).split('.');return(r<0?'-':'')+S.cur+i.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+d};
const fi=n=>n?String(n).replace('.',','):'';
const nm=(a,id)=>a.find(x=>x.id==id)?.name||'—';
const opt=(a,sel)=>a.map(o=>`<option value="${o.id}" ${o.id==sel?'selected':''}>${esc(o.name)}</option>`).join('');
const MN=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],ml=m=>MN[+m.slice(5)-1];
const last6=(e=mk0())=>{const[ey,em]=e.split('-').map(Number),o=[];for(let i=5;i>=0;i--){const x=new Date(ey,em-1-i,1);o.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'))}return o};
const netAmt=x=>x.type=='gasto'?Math.max(0,(+x.amount||0)-(+x.refund||0)):(+x.amount||0);
const sumM=(m,t)=>S.tx.filter(x=>x.type==t&&x.date.startsWith(m)).reduce((a,x)=>a+netAmt(x),0);
const catSpent=(c,m)=>S.tx.filter(x=>x.type=='gasto'&&x.cat==c&&x.date.startsWith(m)).reduce((a,x)=>a+netAmt(x),0);
const savM=m=>{const ac=S.cats.find(c=>c.name.toLowerCase()=='ahorro');return S.goals.flatMap(g=>g.hist||[]).filter(h=>h.d.startsWith(m)).reduce((a,h)=>a+h.a,0)+(ac?catSpent(ac.id,m):0)};
const bal=(id,u='9999')=>(S.accounts.find(x=>x.id==id)?.ini||0)+S.tx.reduce((s,t)=>{if(t.date>u)return s;
if(t.type=='ingreso'&&t.acc==id)s+=t.amount;if(t.type=='gasto'){if(t.acc==id)s-=+t.amount||0;if((+t.refund||0)>0&&t.refundAcc==id)s+=+t.refund||0}
if(t.type=='transferencia'){if(t.acc==id)s-=t.amount;if(t.to==id)s+=t.amount}return s},0);
const totBal=u=>S.accounts.reduce((a,x)=>a+bal(x.id,u),0);
const bar=p=>`<div class="bar"><i style="width:${Math.min(p,100)}%;background:${p>=100?'var(--r)':p>=80?'#f59e0b':'var(--p)'}"></i></div>`;
const PAL=['#0f9d75','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#84cc16','#64748b'];
function bars(d){const mx=Math.max(1,...d.flatMap(x=>[x.a,x.b]));return `<svg viewBox="0 0 320 150" class="chart">`+d.map((x,i)=>{const X=10+i*52,ha=x.a/mx*110,hb=x.b/mx*110;
return `<rect x="${X}" y="${120-ha}" width="18" height="${ha}" rx="4" fill="var(--g)"/><rect x="${X+20}" y="${120-hb}" width="18" height="${hb}" rx="4" fill="var(--r)"/><text x="${X+19}" y="140" text-anchor="middle">${x.l}</text>`}).join('')+`</svg>`}
function line(v,l){const mn=Math.min(...v),r=(Math.max(...v)-mn)||1,p=v.map((y,i)=>[20+i*56,110-(y-mn)/r*90]);
return `<svg viewBox="0 0 320 150" class="chart"><polyline points="${p.map(q=>q.join(',')).join(' ')}" fill="none" stroke="var(--p)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${p.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="var(--p)"/><text x="${q[0]}" y="140" text-anchor="middle">${l[i]}</text>`).join('')}</svg>`}
const leg='<div class="leg"><span style="color:var(--g)">● Ingresos</span><span style="color:var(--r)">● Gastos</span></div>';
const mchart=e=>{const L=last6(e);return leg+bars(L.map(m=>({l:ml(m),a:sumM(m,'ingreso'),b:sumM(m,'gasto')})))};
const txRow=t=>{const c=S.cats.find(x=>x.id==t.cat),s=c?.subs.find(x=>x.id==t.sub),tr=t.type=='transferencia',a=nm(S.accounts,t.acc),na=netAmt(t),rf=t.type=='gasto'&&(+t.refund||0)>0;
return `<div class="row" onclick="txForm('${t.id}')"><span class="dot ${t.type}">${tr?'⇄':t.type=='ingreso'?'↑':'↓'}</span><div class="fl"><b>${esc(t.desc||(tr?'Transferencia':c?c.name:'Sin categoría'))}</b><small>${esc(tr?a+' → '+nm(S.accounts,t.to):[c?.name,s?.name,a].filter(Boolean).join(' · '))} · ${fd(t.date)}${rf?` · Devolución ${f(t.refund)} → ${esc(nm(S.accounts,t.refundAcc||t.acc))}`:''}</small></div><b class="${t.type=='ingreso'?'g':tr?'':'r'}">${t.type=='gasto'?'-':t.type=='ingreso'?'+':''}${f(na)}</b></div>`};
let tab='home',T,CE,CB,SM=null,F={q:'',d1:'',d2:'',cat:'',sub:'',type:'',acc:''};const views={};
const TABS=[['home','🏠','Inicio'],['hist','🧾','Historial'],['stats','📊','Estadísticas'],['gastos','💸','Gastos e ingresos'],['invest','📈','Inversiones'],['goals','🎯','Metas'],['cfg','⚙️','Ajustes']];
function render(){document.documentElement.dataset.t=S.theme=='auto'?'':S.theme;$('#ttl').textContent=S.name;document.title=S.name;
$('#nav').innerHTML=TABS.map(([k,i,l])=>`<button class="${k==tab?'on':''}" onclick="go('${k}')"><span>${i}</span>${l}</button>`).join('');
const m=$('#main');m.innerHTML=views[tab]();m.className='';void m.offsetWidth;m.className='fade';if(tab=='hist')hl()}
const go=k=>{tab=k;scrollTo(0,0);render()};
function toggleTheme(){const d=matchMedia('(prefers-color-scheme: dark)').matches,cur=S.theme=='auto'?(d?'dark':'light'):S.theme;S.theme=cur=='dark'?'light':'dark';save();render()}
const sheet=h=>{$('#sheet').innerHTML=h;document.body.classList.add('open')},closeSheet=()=>document.body.classList.remove('open');
function numSheet(t,v,cb,l){CB=cb;sheet(`<h3>${esc(t)}</h3><label>${l||'Monto'}</label><input id="ns" class="big" type="text" inputmode="decimal" value="${fi(v)}"><button class="btn" onclick="CB(num('ns'));closeSheet()">Guardar</button>`)}

views.home=()=>{const m=mk0(),inc=sumM(m,'ingreso'),exp=sumM(m,'gasto'),rem=S.budget?S.budget-exp:null;
return `<div class="hero"><small>Saldo total</small><b>${f(totBal())}</b></div>
<div class="grid">${S.accounts.map(a=>`<div class="card"><small>${esc(a.name)}</small><b>${f(bal(a.id))}</b></div>`).join('')}</div>
<div class="grid"><div class="card"><small>Ingresos del mes</small><b class="g">${f(inc)}</b></div><div class="card"><small>Gastos del mes</small><b class="r">${f(exp)}</b></div>
<div class="card"><small>Ahorros del mes</small><b>${f(savM(m))}</b></div><div class="card"><small>Presupuesto restante</small><b class="${rem<0?'r':''}">${rem===null?'Sin definir':f(rem)}</b></div></div>
<div class="card"><b>Ingresos y gastos</b>${mchart()}</div>
<h2>Últimos movimientos</h2><div class="card">${S.tx.length?S.tx.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(txRow).join(''):'<small>Todavía no hay movimientos. Tocá ＋ para crear el primero.</small>'}</div>`};

function txForm(id){if(!S.accounts.length)return alert('Primero creá una cuenta en Ajustes');
const t=id?S.tx.find(x=>x.id==id):{type:'gasto',date:today(),amount:'',acc:S.accounts[0].id,to:S.accounts[1]?.id,cat:'',sub:'',desc:'',refund:0,refundAcc:S.accounts[0].id};T={...t,refundAcc:t.refundAcc||t.acc||S.accounts[0]?.id};
sheet(`<h3>${id?'Editar':'Nuevo'} movimiento</h3><div class="seg">${['gasto','ingreso','transferencia'].map(k=>`<button id="s_${k}" onclick="setType('${k}')">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
<label>Importe pagado/cobrado</label><input id="f_a" class="big" type="text" inputmode="decimal" placeholder="0" value="${fi(t.amount)}">
<div id="refundbox"><label>Devolución / reintegro que te devolvieron <small>(opcional)</small></label><input id="f_r" type="text" inputmode="decimal" placeholder="0" value="${fi(t.refund||'')}" oninput="toggleRefundAcc()"><label>Billetera de la devolución</label><select id="f_ra">${opt(S.accounts,T.refundAcc)}</select><small>Ejemplo: pagaste $10.000 con Mercado Pago y tu amigo te devuelve $5.000 en Efectivo. Se descuentan $10.000 de Mercado Pago y se suman $5.000 a Efectivo; el gasto neto es $5.000.</small></div>
<label>Fecha</label><input id="f_d" type="date" value="${t.date}">
<label id="l_acc">Cuenta</label><select id="f_acc">${opt(S.accounts,t.acc)}</select>
<div id="tobox"><label>Cuenta destino</label><select id="f_to">${opt(S.accounts,t.to)}</select></div>
<div id="catbox"><label>Categoría</label><select id="f_c" onchange="fillSubs()"><option value="">Sin categoría</option>${opt(S.cats,t.cat)}</select><label>Subcategoría</label><select id="f_s"></select></div>
<label>Descripción</label><input id="f_ds" value="${esc(t.desc||'')}" placeholder="Opcional">
<button class="btn" onclick="saveTx('${id||''}')">Guardar</button>${id?`<button class="btn del" onclick="delTx('${id}')">Eliminar movimiento</button>`:''}`);setType(T.type);fillSubs(t.sub)}
function setType(k){T.type=k;['gasto','ingreso','transferencia'].forEach(x=>$('#s_'+x).classList.toggle('on',x==k));
$('#tobox').style.display=k=='transferencia'?'':'none';$('#catbox').style.display=k=='transferencia'?'none':'';$('#refundbox').style.display=k=='gasto'?'':'none';$('#l_acc').textContent=k=='transferencia'?'Cuenta origen':'Cuenta';if(k=='gasto')toggleRefundAcc()}
function toggleRefundAcc(){const r=$('#f_r');const box=$('#f_ra');if(!r||!box)return;const has=num('f_r')>0;box.disabled=!has;box.parentElement.style.opacity=has?'1':'.55'}
function fillSubs(sel){const c=S.cats.find(x=>x.id==$('#f_c').value);$('#f_s').innerHTML='<option value="">Sin subcategoría</option>'+(c?opt(c.subs,sel):'')}
function saveTx(id){const a=num('f_a');if(a<=0)return alert('Ingresá un importe mayor a 0');const tr=T.type=='transferencia',acc=$('#f_acc').value,to=tr?$('#f_to').value:'';
if(tr&&acc==to)return alert('La cuenta origen y destino deben ser distintas');
const refund=T.type=='gasto'?num('f_r'):0;if(refund<0||refund>a)return alert('La devolución no puede ser mayor que el importe pagado.');
const refundAcc=T.type=='gasto'&&refund>0?$('#f_ra').value:'';
const o={id:id||uid(),type:T.type,amount:a,refund,refundAcc,date:$('#f_d').value||today(),acc,to,cat:tr?'':$('#f_c').value,sub:tr?'':$('#f_s').value,desc:$('#f_ds').value.trim()};
if(id)S.tx[S.tx.findIndex(x=>x.id==id)]=o;else S.tx.push(o);save();closeSheet();render()}
function delTx(id){if(confirm('¿Eliminar este movimiento?')){S.tx=S.tx.filter(x=>x.id!=id);save();closeSheet();render()}}

function histSubs(sel=''){const c=S.cats.find(x=>x.id==F.cat);return '<option value="">Todas las subcategorías</option>'+(c?opt(c.subs,sel):'')}
function hcat(v){F.cat=v;F.sub='';render()}
views.hist=()=>`<div class="card"><input placeholder="🔍 Buscar..." value="${esc(F.q)}" oninput="F.q=this.value;hl()">
<div class="two"><div><label>Desde</label><input type="date" value="${F.d1}" onchange="F.d1=this.value;hl()"></div><div><label>Hasta</label><input type="date" value="${F.d2}" onchange="F.d2=this.value;hl()"></div></div>
<div class="two"><select onchange="hcat(this.value)"><option value="">Todas las categorías</option>${opt(S.cats,F.cat)}</select>
<select id="f_sub" ${F.cat?'':'disabled'} onchange="F.sub=this.value;hl()">${histSubs(F.sub)}</select></div>
<div class="two"><select onchange="F.type=this.value;hl()">${[['','Todos los tipos'],['gasto','Gastos'],['ingreso','Ingresos'],['transferencia','Transferencias']].map(([v,l])=>`<option value="${v}" ${F.type==v?'selected':''}>${l}</option>`).join('')}</select>
<select onchange="F.acc=this.value;hl()"><option value="">Todas las cuentas</option>${opt(S.accounts,F.acc)}</select></div>
<button class="btn sec" style="margin:0" onclick="F={q:'',d1:'',d2:'',cat:'',sub:'',type:'',acc:''};render()">Limpiar filtros</button></div><div class="card" id="hl"></div>`;
function hl(){const q=F.q.toLowerCase(),r=S.tx.filter(t=>{const c=S.cats.find(x=>x.id==t.cat);
return(!F.d1||t.date>=F.d1)&&(!F.d2||t.date<=F.d2)&&(!F.cat||t.cat==F.cat)&&(!F.sub||t.sub==F.sub)&&(!F.type||t.type==F.type)&&(!F.acc||t.acc==F.acc||t.to==F.acc)&&
(!q||[t.desc,c?.name,c?.subs.find(s=>s.id==t.sub)?.name,nm(S.accounts,t.acc),String(t.amount)].join(' ').toLowerCase().includes(q))}).sort((a,b)=>b.date.localeCompare(a.date));
$('#hl').innerHTML=`<small style="margin-bottom:10px">${r.length} movimiento(s)</small>`+(r.map(txRow).join('')||'<small>No hay resultados.</small>')}

const MF=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],p2=n=>String(n).padStart(2,'0');
function setPeriod(){SM=$('#py').value+'-'+$('#pm').value;render()}
function shiftM(d){const m=SM||mk0(),x=new Date(+m.slice(0,4),+m.slice(5)-1+d,1);SM=x.getFullYear()+'-'+p2(x.getMonth()+1);render()}
views.stats=()=>{const m=SM||mk0(),y=+m.slice(0,4),mo=m.slice(5),cy=new Date().getFullYear();let y0=Math.min(y,cy),y1=Math.max(y,cy);S.tx.forEach(t=>{const a=+t.date.slice(0,4);if(a<y0)y0=a;if(a>y1)y1=a});
const mt=S.tx.filter(t=>t.date.startsWith(m)),by={};mt.filter(t=>t.type=='gasto').forEach(t=>by[t.cat]=(by[t.cat]||0)+netAmt(t));
const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]),inc=sumM(m,'ingreso'),tot=sumM(m,'gasto'),nt=mt.filter(t=>t.type=='transferencia').length,L=last6(m),ex=L.map(x=>sumM(x,'gasto')),mx=Math.max(1,...ex),lb=MF[+mo-1]+' '+y,yo=[];
for(let a=y1;a>=y0;a--)yo.push(`<option ${a==y?'selected':''}>${a}</option>`);
return `<div class="row"><button class="ic" onclick="shiftM(-1)" aria-label="Mes anterior">‹</button><select id="pm" style="flex:1;min-width:0" onchange="setPeriod()">${MF.map((n,i)=>`<option value="${p2(i+1)}" ${p2(i+1)==mo?'selected':''}>${n}</option>`).join('')}</select><select id="py" style="width:96px" onchange="setPeriod()">${yo.join('')}</select><button class="ic" onclick="shiftM(1)" aria-label="Mes siguiente">›</button></div>
<div class="hero"><small>Balance de ${lb}</small><b>${f(inc-tot)}</b><small>Ingresos − gastos (las transferencias no se cuentan)</small></div>
<div class="grid"><div class="card"><small>Total gastado</small><b class="r">${f(tot)}</b></div><div class="card"><small>Total ingresado</small><b class="g">${f(inc)}</b></div>
<div class="card"><small>Total ahorrado</small><b>${f(savM(m))}</b></div><div class="card"><small>Movimientos</small><b>${mt.length}</b>${nt?`<small>${nt} transferencia(s) incluidas</small>`:''}</div></div>
<div class="card"><b>Gastos por categoría</b>${rows.length?rows.map(([c,v],i)=>`<div style="margin-top:12px"><div class="row" style="margin:0"><span class="fl">${esc(nm(S.cats,c)=='—'?'Sin categoría':nm(S.cats,c))}</span><b>${f(v)}</b><small>${Math.round(v/tot*100)}%</small></div><div class="bar"><i style="width:${v/tot*100}%;background:${PAL[i%9]}"></i></div></div>`).join(''):'<small>Sin gastos en este período</small>'}</div>
<div class="card"><b>Ingresos vs gastos</b>${mchart(m)}</div>
<div class="card"><b>Evolución del saldo</b>${line(L.map(x=>totBal(x+'-31')),L.map(ml))}</div>
<div class="card"><b>Gastos de los últimos 6 meses</b>${L.slice().reverse().map((x,i)=>{const v=ex[5-i];return `<div style="margin-top:12px"><div class="row" style="margin:0"><span class="fl">${ml(x)} ${x.slice(0,4)}</span><b>${f(v)}</b></div><div class="bar"><i style="width:${v/mx*100}%;background:var(--r)"></i></div></div>`}).join('')}</div>
<h2>Movimientos de ${lb}</h2><div class="card">${mt.length?mt.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(txRow).join(''):'<small>Sin movimientos en este período.</small>'}</div>`};


/* ===== Inversiones ===== */
const INV_TYPES=[
  ['dolares','Dólares'],['plazo_fijo','Plazo fijo'],['fci','FCI'],
  ['bonos','Bonos'],['on','Obligaciones negociables'],['cedears','CEDEARs'],
  ['acciones','Acciones'],['crypto','Criptomonedas'],['letras','Letras'],['otros','Otros']
];
const invTypeName=t=>INV_TYPES.find(x=>x[0]==t)?.[1]||'Otros';
const invValue=x=>x.status=='cerrada'?0:(+x.quantity||0)*(+x.currentPrice||0);
const invCost=x=>+x.capital||0;
const invIncome=x=>(+x.income||0);
const invGain=x=>invValue(x)-invCost(x)+invIncome(x);
const invPct=x=>invCost(x)?invGain(x)/invCost(x)*100:0;
const invTotalCost=()=>S.investments.filter(x=>x.status!='cerrada').reduce((a,x)=>a+invCost(x),0);
const invTotalValue=()=>S.investments.reduce((a,x)=>a+invValue(x),0);
const invTotalIncome=()=>S.investments.reduce((a,x)=>a+invIncome(x),0);
const invTotalGain=()=>S.investments.reduce((a,x)=>a+invGain(x),0);

function invForm(id){
  const x=id?S.investments.find(v=>v.id==id):{
    name:'',type:'dolares',date:today(),capital:'',purchasePrice:'',quantity:'',
    currentPrice:'',income:0,status:'abierta',notes:'',history:[]
  };
  sheet(`<h3>${id?'Editar inversión':'Nueva inversión'}</h3>
<label>Nombre</label><input id="iv_n" value="${esc(x.name)}" placeholder="Ej.: Dólares, CEDEAR de...">
<label>Tipo</label><select id="iv_t">${INV_TYPES.map(([v,l])=>`<option value="${v}" ${x.type==v?'selected':''}>${l}</option>`).join('')}</select>
<label>Fecha de compra / inicio</label><input id="iv_d" type="date" value="${x.date||today()}">
<label>Capital invertido</label><input id="iv_c" type="text" inputmode="decimal" value="${fi(x.capital)}" placeholder="0,00">
<label>Precio de compra por unidad</label><input id="iv_pp" type="text" inputmode="decimal" value="${fi(x.purchasePrice)}" placeholder="0,00">
<label>Cantidad</label><input id="iv_q" type="text" inputmode="decimal" value="${fi(x.quantity)}" placeholder="0,00">
<label>Precio actual por unidad</label><input id="iv_cp" type="text" inputmode="decimal" value="${fi(x.currentPrice)}" placeholder="0,00">
<label>Rendimientos cobrados (dividendos/intereses)</label><input id="iv_i" type="text" inputmode="decimal" value="${fi(x.income)}" placeholder="0,00">
<label>Estado</label><select id="iv_st"><option value="abierta" ${x.status!='cerrada'?'selected':''}>Abierta</option><option value="cerrada" ${x.status=='cerrada'?'selected':''}>Cerrada</option></select>
<label>Notas</label><input id="iv_no" value="${esc(x.notes||'')}" placeholder="Opcional">
<button class="btn" onclick="saveInv('${id||''}')">Guardar inversión</button>
${id?`<button class="btn del" onclick="delInv('${id}')">Eliminar inversión</button>`:''}`);
}
function saveInv(id){
  const name=$('#iv_n').value.trim();
  if(!name)return alert('Poné un nombre');
  const o={
    id:id||uid(),name,type:$('#iv_t').value,date:$('#iv_d').value||today(),
    capital:num('iv_c'),purchasePrice:num('iv_pp'),quantity:num('iv_q'),
    currentPrice:num('iv_cp'),income:num('iv_i'),status:$('#iv_st').value,
    notes:$('#iv_no').value.trim(),history:id?(S.investments.find(x=>x.id==id)?.history||[]):[]
  };
  if(id)S.investments[S.investments.findIndex(x=>x.id==id)]=o;else{
    o.history=[{d:o.date,action:'Alta',amount:o.capital}];
    S.investments.push(o);
  }
  save();closeSheet();render();
}
function delInv(id){
  if(confirm('¿Eliminar esta inversión?')){S.investments=S.investments.filter(x=>x.id!=id);save();closeSheet();render()}
}
function invIncomeForm(id){
  const x=S.investments.find(v=>v.id==id);
  numSheet('Registrar rendimiento de '+x.name,'',v=>{
    x.income=(+x.income||0)+v;(x.history=x.history||[]).push({d:today(),action:'Rendimiento cobrado',amount:v});
    save();render();
  },'Monto cobrado');
}
function invClose(id){
  const x=S.investments.find(v=>v.id==id);
  if(confirm('¿Marcar esta inversión como cerrada? Su valor actual pasará a $0 en el cálculo de cartera.')){
    x.status='cerrada';(x.history=x.history||[]).push({d:today(),action:'Cierre',amount:invValue(x)});
    save();render();
  }
}
views.invest=()=>{
  const arr=S.investments||[],open=arr.filter(x=>x.status!='cerrada'),cost=invTotalCost(),val=invTotalValue(),inc=invTotalIncome(),gain=invTotalGain();
  const by={};open.forEach(x=>by[x.type]=(by[x.type]||0)+invValue(x));
  const groups=Object.entries(by).sort((a,b)=>b[1]-a[1]);
  return `<div class="hero"><small>Patrimonio invertido actual</small><b>${f(val)}</b><small>Ganancia/pérdida estimada: ${gain>=0?'+':''}${f(gain)} (${cost?gain/cost*100:0|0}%)</small></div>
<div class="grid">
<div class="card"><small>Capital invertido</small><b>${f(cost)}</b></div>
<div class="card"><small>Valor actual</small><b>${f(val)}</b></div>
<div class="card"><small>Ganancia/pérdida</small><b class="${gain>=0?'g':'r'}">${gain>=0?'+':''}${f(gain)}</b></div>
<div class="card"><small>Rendimientos cobrados</small><b>${f(inc)}</b></div></div>
${groups.length?`<div class="card"><b>Distribución de cartera</b>${groups.map(([t,v])=>`<div style="margin-top:12px"><div class="row" style="margin:0"><span class="fl">${esc(invTypeName(t))}</span><b>${f(v)}</b><small>${val?Math.round(v/val*100):0}%</small></div>${bar(val?v/val*100:0)}</div>`).join('')}</div>`:''}
<h2>Mis inversiones</h2>
${arr.length?arr.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(x=>{
 const v=invValue(x),g=invGain(x),p=invPct(x);
 return `<div class="card"><div class="row" style="margin:0"><div class="fl"><b>${esc(x.name)}</b><small>${esc(invTypeName(x.type))} · ${x.status=='cerrada'?'Cerrada':'Abierta'} · ${x.date?fd(x.date):''}</small></div><b class="${g>=0?'g':'r'}">${g>=0?'+':''}${f(g)}</b></div>
 <div class="two" style="margin-top:10px"><div><small>Capital</small><b>${f(invCost(x))}</b></div><div><small>Valor actual</small><b>${f(v)}</b></div></div>
 <small>Rendimiento: ${g>=0?'+':''}${p.toFixed(2).replace('.',',')}% · ${f(x.quantity)} unidades × ${f(x.currentPrice)}</small>
 ${x.notes?`<small style="margin-top:5px">${esc(x.notes)}</small>`:''}
 <div class="two" style="margin:10px 0 0"><button class="btn sec" style="margin:0" onclick="invForm('${x.id}')">Editar</button>${x.status!='cerrada'?`<button class="btn sec" style="margin:0" onclick="invIncomeForm('${x.id}')">Cobrar</button>`:''}</div>
 ${x.status!='cerrada'?`<button class="btn sec" style="margin:0" onclick="invClose('${x.id}')">Marcar como cerrada</button>`:''}
 </div>`}).join(''):'<div class="card"><small>Todavía no cargaste inversiones.</small></div>'}
<button class="btn" onclick="invForm()">+ Nueva inversión</button>

<h2>¿En qué invertir?</h2>
<div class="card"><small>Esta sección es educativa. No garantiza rendimientos ni reemplaza asesoramiento financiero. El riesgo y el rendimiento real dependen del instrumento y del mercado.</small></div>
${INV_TYPES.filter(x=>x[0]!='otros').map(([k,l])=>{
 const info={
 dolares:['Dólares','Exposición al dólar. Liquidez alta si se mantiene en una forma fácil de vender.','Riesgo: medio','Horizonte: corto a largo plazo.'],
 plazo_fijo:['Plazo fijo','Depósito bancario con una tasa pactada por un período.','Riesgo: bajo/medio','Liquidez: depende de la modalidad y del banco.'],
 fci:['FCI','Fondo que reúne dinero de varios inversores y lo coloca según su estrategia.','Riesgo: bajo a alto según el fondo','Liquidez: depende del fondo.'],
 bonos:['Bonos','Instrumentos de deuda emitidos por gobiernos o empresas.','Riesgo: medio/alto según emisor y plazo','El precio puede subir o bajar antes del vencimiento.'],
 on:['Obligaciones negociables','Deuda emitida por empresas.','Riesgo: medio/alto','Revisar emisor, vencimiento, tasa y liquidez.'],
 cedears:['CEDEARs','Certificados que permiten tener exposición a acciones extranjeras desde Argentina.','Riesgo: medio/alto','El precio puede verse afectado por la acción y el tipo de cambio.'],
 acciones:['Acciones','Participación en empresas cotizadas.','Riesgo: alto','Horizonte habitual: largo plazo.'],
 crypto:['Criptomonedas','Activos digitales con variaciones de precio muy grandes.','Riesgo: muy alto','No usar dinero que no puedas asumir perder.'],
 letras:['Letras','Instrumentos de deuda de corto plazo.','Riesgo: depende del emisor','Revisar vencimiento, rendimiento y liquidez.']
 }[k]||['Instrumento','Informate sobre su funcionamiento, costos y riesgos.','Riesgo variable','Compará alternativas antes de invertir.'];
 return `<div class="card"><b>${l}</b><small style="margin-top:5px">${info[0]}: ${info[1]}</small><small>${info[2]}</small><small>${info[3]}</small></div>`
}).join('')}
<div class="card"><b>Cómo evaluar una inversión</b><small style="margin-top:6px">1. Qué estás comprando.</small><small>2. Cuánto podés perder.</small><small>3. Cuándo podés necesitar el dinero.</small><small>4. Liquidez y costos.</small><small>5. Diversificación.</small><small>6. Rendimiento histórico, sin asumir que se repetirá.</small></div>`;
};

function monthPlan(m){if(!S.plans[m])S.plans[m]={cats:{}};if(!S.plans[m].cats)S.plans[m].cats={};return S.plans[m]}
function planVal(m,id,k){return +((monthPlan(m).cats[id]||{})[k]||0)}
function budgetCat(id,m){const c=S.cats.find(x=>x.id==id),p=monthPlan(m),v=p.cats[id]||{spend:0,income:0};
sheet(`<h3>Presupuesto · ${esc(c?.name||'Categoría')}</h3><small>Definí cuánto querés gastar y cuánto esperás ingresar en esta categoría durante ${esc(mlab(m))}.</small><label>Quiero gastar</label><input id="bp_s" type="text" inputmode="decimal" value="${fi(v.spend)}" placeholder="0"><label>Espero ganar</label><input id="bp_i" type="text" inputmode="decimal" value="${fi(v.income)}" placeholder="0"><button class="btn" onclick="saveBudgetCat('${id}','${m}')">Guardar</button>`)}
function saveBudgetCat(id,m){const p=monthPlan(m);p.cats[id]={spend:num('bp_s'),income:num('bp_i')};save();closeSheet();render()}
views.goals=()=>{const m=renderBudgetMonth||mk0(),p=monthPlan(m),actualE=sumM(m,'gasto'),actualI=sumM(m,'ingreso'),rows=S.cats.map(c=>{const ps=planVal(m,c.id,'spend'),pi=planVal(m,c.id,'income'),as=catSpent(c.id,m),ai=S.tx.filter(t=>t.type=='ingreso'&&t.cat==c.id&&t.date.startsWith(m)).reduce((a,t)=>a+netAmt(t),0);return {c,ps,pi,as,ai}}).filter(x=>x.ps||x.pi||x.as||x.ai),planE=rows.reduce((a,x)=>a+x.ps,0),planI=rows.reduce((a,x)=>a+x.pi,0),planBal=planI-planE,actualBal=actualI-actualE,remainE=planE-actualE,remainI=planI-actualI;
return `<h2>Presupuesto</h2><div class="card"><div class="two"><div><small>Mes</small><select onchange="budMonth(this.value)">${(()=>{const y=m.slice(0,4);return MF.map((n,i)=>`<option value="${y}-${p2(i+1)}" ${m==y+'-'+p2(i+1)?'selected':''}>${n} ${y}</option>`).join('')})()}</select></div><div><small>Resultado planificado</small><b class="${planBal<0?'r':'g'}">${f(planBal)}</b></div></div><div class="grid"><div class="card"><small>Espero ingresar</small><b class="g">${f(planI)}</b></div><div class="card"><small>Quiero gastar</small><b class="r">${f(planE)}</b></div><div class="card"><small>Ingresado hasta hoy</small><b class="g">${f(actualI)}</b></div><div class="card"><small>Gastado hasta hoy</small><b class="r">${f(actualE)}</b></div></div><div class="card" style="margin:0"><small>Resultado actual</small><b class="${actualBal<0?'r':'g'}">${f(actualBal)}</b><small>${actualBal>=0?'Hasta ahora llevás ahorrados':'Hasta ahora te faltan'} ${f(Math.abs(actualBal))}. Si cumplís el plan, ${planBal>=0?'esperás ahorrar':'esperás quedar debiendo'} ${f(Math.abs(planBal))} al cierre del mes.</small></div></div>
<h3>Presupuesto por categoría</h3>${rows.length?rows.map(x=>{const sp=x.ps?Math.round(x.as/x.ps*100):0,ip=x.pi?Math.round(x.ai/x.pi*100):0;return `<div class="card" onclick="budgetCat('${x.c.id}','${m}')"><div class="row" style="margin:0"><b class="fl">${esc(x.c.name)}</b><span>›</span></div><div class="two" style="margin:10px 0 0"><div><small>Gasto</small><b class="r">${f(x.as)} / ${f(x.ps)}</b><small>${x.ps?(sp+'% usado'):'Sin límite'}</small></div><div><small>Ingreso</small><b class="g">${f(x.ai)} / ${f(x.pi)}</b><small>${x.pi?(ip+'% alcanzado'):'Sin objetivo'}</small></div></div>${x.ps?bar(sp):''}${x.pi?`<div class="bar"><i style="width:${Math.min(ip,100)}%;background:var(--g)"></i></div>`:''}</div>`}).join(''):'<div class="card"><small>Todavía no configuraste categorías para este mes. Tocá una categoría para definir cuánto querés gastar y cuánto esperás ganar.</small></div>'}
${S.cats.length?`<h3>Agregar al presupuesto</h3><div class="card">${S.cats.filter(c=>!rows.some(x=>x.c.id==c.id)).map(c=>`<div class="row" style="margin:0" onclick="budgetCat('${c.id}','${m}')"><span class="fl"><b>${esc(c.name)}</b><small>Sin objetivos para este mes</small></span><span>＋</span></div>`).join('')}</div>`:''}
<div class="card"><b>¿Cuánto ahorraré o deberé a fin de mes?</b><div class="two" style="margin-top:10px"><div><small>Si cumplís el plan</small><b class="${planBal<0?'r':'g'}">${planBal<0?'Deberías ': 'Ahorrar '}${f(Math.abs(planBal))}</b></div><div><small>Margen del plan</small><b>${planBal>=0?'Positivo':'Negativo'}</b></div></div><small>Se calcula como ingresos esperados − gastos planificados. Las transferencias no afectan este cálculo.</small></div>
<h2>Objetivos de ahorro</h2>${S.goals.map(g=>{const q=g.target?Math.round(g.saved/g.target*100):0,dl=g.date?Math.ceil((new Date(g.date)-new Date(today()))/864e5):null;return `<div class="card"><div class="row" style="margin:0"><b class="fl">${esc(g.name)}</b><b>${q}%</b></div><small>${f(g.saved)} de ${f(g.target)}${g.date?' · meta '+fd(g.date)+(dl>=0?' ('+dl+' días)':' (vencida)'):''}</small>${bar(q)}<div class="two" style="margin:10px 0 0"><button class="btn sec" style="margin:0" onclick="aport('${g.id}')">Aportar</button><button class="btn sec" style="margin:0" onclick="goalForm('${g.id}')">Editar</button></div></div>`}).join('')||'<small style="margin-bottom:10px">Todavía no creaste objetivos.</small>'}<button class="btn" onclick="goalForm()">+ Nuevo objetivo</button>`};
function budMonth(m){closeSheet();renderBudgetMonth=m;render()}
let renderBudgetMonth='';
function aport(id){const g=S.goals.find(x=>x.id==id);numSheet('Aportar a '+g.name,'',v=>{g.saved+=v;(g.hist=g.hist||[]).push({d:today(),a:v});save();render()},'Monto (negativo para retirar)')}
function goalForm(id){const g=id?S.goals.find(x=>x.id==id):{name:'',target:'',saved:'',date:''};
sheet(`<h3>${id?'Editar':'Nuevo'} objetivo</h3><label>Nombre</label><input id="g_n" value="${esc(g.name)}"><label>Objetivo total</label><input id="g_t" type="text" inputmode="decimal" value="${fi(g.target)}"><label>Dinero ahorrado</label><input id="g_s" type="text" inputmode="decimal" value="${fi(g.saved)}"><label>Fecha objetivo (opcional)</label><input id="g_d" type="date" value="${g.date||''}">
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
<h2>Datos</h2><button class="btn" style="margin:0 0 8px" onclick="$('#xi').click()">Importar movimientos desde Excel</button><input type="file" id="xi" accept=".xlsx" hidden onchange="xlsPick(event)"><button class="btn sec" style="margin:0 0 8px" onclick="exp_()">Exportar copia de seguridad</button><button class="btn sec" style="margin:0 0 8px" onclick="$('#fi').click()">Importar copia de seguridad</button>
<input type="file" id="fi" accept=".json,application/json" hidden onchange="imp(event)"><button class="btn del" style="margin:0" onclick="wipe()">Eliminar todos los datos</button>`;
function accForm(id){const a=id?S.accounts.find(x=>x.id==id):{name:'',ini:''};
sheet(`<h3>${id?'Editar':'Nueva'} cuenta</h3><label>Nombre</label><input id="a_n" value="${esc(a.name)}"><label>Saldo inicial</label><input id="a_i" type="text" inputmode="decimal" value="${fi(a.ini)}">
<button class="btn" onclick="saveAcc('${id||''}')">Guardar</button>${id?`<button class="btn del" onclick="delAcc('${id}')">Eliminar cuenta</button>`:''}`)}
function saveAcc(id){const n=$('#a_n').value.trim();if(!n)return alert('Poné un nombre');if(id){const a=S.accounts.find(x=>x.id==id);a.name=n;a.ini=num('a_i')}else S.accounts.push({id:uid(),name:n,ini:num('a_i')});save();closeSheet();render()}
function delAcc(id){if(S.tx.some(t=>t.acc==id||t.to==id))return alert('Esta cuenta tiene movimientos. Eliminá o editá esos movimientos primero.');if(confirm('¿Eliminar cuenta?')){S.accounts=S.accounts.filter(x=>x.id!=id);save();closeSheet();render()}}
function iniForm(){sheet(`<h3>Saldo inicial</h3><small style="margin-bottom:8px">¿Cuánto dinero tenías en cada cuenta al empezar a usar la app?</small>${S.accounts.map(a=>`<label>${esc(a.name)}</label><input id="i_${a.id}" type="text" inputmode="decimal" value="${fi(a.ini)}">`).join('')}<button class="btn" onclick="S.accounts.forEach(a=>a.ini=num('i_'+a.id));save();closeSheet();render()">Guardar</button>`)}
function catForm(id){CE=id?JSON.parse(JSON.stringify(S.cats.find(c=>c.id==id))):{id:uid(),name:'',subs:[],budget:0,isNew:1};drawCat()}
function drawCat(){sheet(`<h3>${CE.isNew?'Nueva':'Editar'} categoría</h3><label>Nombre</label><input value="${esc(CE.name)}" ${CE.fixed?'readonly':''} oninput="CE.name=this.value"><label>Presupuesto mensual (opcional)</label><input type="text" inputmode="decimal" value="${fi(CE.budget)}" oninput="CE.budget=pnum(this.value)">
<label>Subcategorías</label>${CE.subs.map((s,i)=>`<div class="row"><input style="margin:0" value="${esc(s.name)}" ${s.fixed?'readonly':''} placeholder="Nombre" oninput="CE.subs[${i}].name=this.value">${s.fixed?'':`<button class="ic" style="margin:0" onclick="CE.subs.splice(${i},1);drawCat()">✕</button>`}</div>`).join('')}
<button class="btn sec" onclick="CE.subs.push({id:uid(),name:''});drawCat()">+ Agregar subcategoría</button><button class="btn" onclick="saveCat()">Guardar</button>${CE.fixed?'<small style="margin-top:10px">Categoría predeterminada: no se puede renombrar ni eliminar. Podés agregar subcategorías propias.</small>':''}${CE.isNew||CE.fixed?'':'<button class="btn sec" onclick="mvForm(\''+CE.id+'\')">Mover sus movimientos a otra categoría</button><button class="btn del" onclick="delCat()">Eliminar categoría</button>'}`)}
function saveCat(){CE.name=CE.name.trim();if(!CE.name)return alert('Poné un nombre');CE.subs=CE.subs.filter(s=>s.name.trim());const isNew=CE.isNew;delete CE.isNew;
if(isNew)S.cats.push(CE);else S.cats[S.cats.findIndex(c=>c.id==CE.id)]=CE;save();closeSheet();render()}
function delCat(){if(confirm('¿Eliminar categoría? Los movimientos quedarán "Sin categoría".')){S.cats=S.cats.filter(c=>c.id!=CE.id);save();closeSheet();render()}}
function exp_(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='mi-dinero-'+today()+'.json';a.click()}
function imp(e){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.accounts||!d.cats||!d.tx)throw 0;
if(confirm('Esto reemplaza los datos de movimientos, cuentas y categorías. Las inversiones y metas actuales se conservarán si la copia no las contiene. ¿Continuar?')){const oldInv=Array.isArray(S.investments)?S.investments:[];const oldGoals=Array.isArray(S.goals)?S.goals:[];S={...def(),...d,investments:Array.isArray(d.investments)?d.investments:oldInv,goals:Array.isArray(d.goals)?d.goals:oldGoals};cleanDefaultCats();save();render();alert('Copia importada correctamente')}}catch(x){alert('El archivo no es una copia válida')}};r.readAsText(e.target.files[0])}
function wipe(){if(confirm('¿Eliminar TODOS tus datos? No se puede deshacer.')&&confirm('¿Seguro? Se borrará todo.')){S=def();render()}}
/* ===== Importar movimientos desde Excel (hoja AGENDA) ===== */
const nz=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
let XI=null;
async function inflate(d){return new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer())}
async function unzip(buf){const dv=new DataView(buf),u=new Uint8Array(buf);let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!=0x06054b50)e--;if(e<0)throw 0;
const n=dv.getUint16(e+10,true),out={};let p=dv.getUint32(e+16,true);
for(let i=0;i<n;i++){const m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
const st=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),d=u.subarray(st,st+cs);out[name]=m==0?d:await inflate(d)}return out}
const xml=(z,n)=>z[n]?new DOMParser().parseFromString(new TextDecoder().decode(z[n]),'text/xml'):null;
const txt=el=>[...el.getElementsByTagName('t')].filter(x=>x.parentNode.nodeName!='rPh').map(x=>x.textContent).join('');
const colN=r=>r.replace(/\d/g,'').split('').reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0)-1;
async function readSheet(buf,name){const z=await unzip(buf),wb=xml(z,'xl/workbook.xml'),rel=xml(z,'xl/_rels/workbook.xml.rels');
const s=[...wb.getElementsByTagName('sheet')].find(x=>x.getAttribute('name').trim().toUpperCase()==name);if(!s)throw new Error('No encontré una hoja llamada AGENDA en el Excel.');
const rid=s.getAttribute('r:id'),t=[...rel.getElementsByTagName('Relationship')].find(r=>r.getAttribute('Id')==rid).getAttribute('Target').replace(/^\//,''),path=t.startsWith('xl/')?t:'xl/'+t;
const ss=xml(z,'xl/sharedStrings.xml'),strs=ss?[...ss.getElementsByTagName('si')].map(txt):[],rows=[];
for(const r of xml(z,path).getElementsByTagName('row')){const row=[];for(const c of r.getElementsByTagName('c')){const ty=c.getAttribute('t'),vv=c.getElementsByTagName('v')[0],v=vv?vv.textContent:null;
row[colN(c.getAttribute('r'))]=ty=='s'?strs[+v]:ty=='inlineStr'?txt(c):(ty=='str'||ty=='e'||ty=='b')?v:v==null?'':+v}rows.push(row)}return rows}
const pdate=v=>{if(typeof v=='number'&&v>20000)return new Date(Math.floor(v-25569)*864e5).toISOString().slice(0,10);const s=String(v).trim();
let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);if(m){let y=+m[3];if(y<100)y+=2000;return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}return ''};
const pnum=v=>{if(typeof v=='number')return v;let s=String(v).replace(/[$\s]/g,'');if(!s)return 0;
if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else if(s.includes(','))s=s.replace(',','.');else if(/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');return parseFloat(s)||0};
const ktype=(a,b)=>{for(const s of[nz(a),nz(b)]){if(/transfer/.test(s))return'transferencia';if(/ingres/.test(s))return'ingreso';if(/gast|egres|salida/.test(s))return'gasto'}return''};
const dir=s=>{s=nz(s);return/sal|orig|egres|envi|-/.test(s)?'out':/ent|dest|ingres|recib|\+/.test(s)?'in':''};
function parseAgenda(rows){const h=rows.findIndex((r,i)=>i<15&&r.some(v=>nz(v)=='fecha')&&r.some(v=>nz(v)=='monto'));if(h<0)throw new Error('No encontré las columnas Fecha y Monto en la hoja AGENDA.');
const H=Array.from(rows[h],nz),ix=f=>H.findIndex(f),c={fe:ix(x=>x=='fecha'),it:ix(x=>x=='item'),ca:ix(x=>x=='categoria'),su:ix(x=>x=='subcategoria'),bi:ix(x=>x=='billetera'),mo:ix(x=>x=='monto'),ti:ix(x=>x.startsWith('tipo')),im:ix(x=>x=='impacto'),se:ix(x=>x.startsWith('sentido'))};
const out={items:[],skip:{},bad:{}},legs=[],sk=k=>out.skip[k]=(out.skip[k]||0)+1;
for(const r of rows.slice(h+1)){if(!r||!r.some(v=>String(v??'').trim()!==''))continue;const g=i=>i<0?'':r[i]??'';
const date=pdate(g(c.fe)),amount=Math.abs(pnum(g(c.mo))),type=ktype(g(c.ti),g(c.im));
if(!date){sk('Sin fecha válida');continue}if(!amount){sk('Sin monto');continue}
if(!type){const k=String(g(c.ti)).trim()||'(vacío)';out.bad[k]=(out.bad[k]||0)+1;continue}
const o={type,date,amount,desc:String(g(c.it)).trim(),cat:String(g(c.ca)).trim(),sub:String(g(c.su)).trim(),acc:String(g(c.bi)).trim(),to:''};
if(type=='transferencia'){o.cat=o.sub='';const p=o.acc.split(/\s*(?:→|->|=>|>)\s*/);
if(p.length==2&&p[0]&&p[1]&&nz(p[0])!=nz(p[1])){o.acc=p[0];o.to=p[1];out.items.push(o)}else if(o.acc)legs.push({...o,dir:dir(g(c.se))||dir(g(c.im))});else sk('Sin billetera')}
else if(!o.acc)sk('Sin billetera');else out.items.push(o)}
const used=new Set(),ok=(a,b,k,same)=>!used.has(k)&&b.dir=='in'&&b.date==a.date&&b.amount==a.amount&&nz(b.acc)!=nz(a.acc)&&(!same||nz(b.desc)==nz(a.desc));
legs.forEach((a,i)=>{if(used.has(i)||a.dir!='out')return;let j=legs.findIndex((b,k)=>ok(a,b,k,1));if(j<0)j=legs.findIndex((b,k)=>ok(a,b,k,0));
if(j>=0){used.add(i);used.add(j);out.items.push({type:a.type,date:a.date,amount:a.amount,desc:a.desc,cat:'',sub:'',acc:a.acc,to:legs[j].acc})}});
legs.forEach((a,i)=>{if(!used.has(i))sk('Transferencia sin contraparte')});
const cnt={};out.items.forEach(o=>{const k=nz([o.type,o.date,o.desc,o.cat,o.sub,o.acc,o.to,o.amount].join('|'));cnt[k]=(cnt[k]||0)+1;o.key='x:'+k+'#'+cnt[k]});return out}
function xlsPreview(o){XI=o;const have=new Set(S.tx.map(t=>t.key).filter(Boolean)),dup=o.items.filter(i=>have.has(i.key)).length,n=t=>o.items.filter(i=>i.type==t).length,A=new Set(),C=new Set();
o.items.forEach(i=>{[i.acc,i.to].filter(Boolean).forEach(a=>{if(!S.accounts.some(x=>nz(x.name)==nz(a)))A.add(a)});if(i.cat&&!S.cats.some(x=>nz(x.name)==nz(i.cat)))C.add(i.cat)});
const sk=[...Object.entries(o.skip).map(([k,v])=>`${k}: ${v}`),...Object.entries(o.bad).map(([k,v])=>`Tipo no reconocido "${k}": ${v}`)];
sheet(`<h3>Importar movimientos</h3><div class="card"><b>${o.items.length} movimientos encontrados</b><small>Gastos: ${n('gasto')} · Ingresos: ${n('ingreso')} · Transferencias: ${n('transferencia')}</small><small>Ya importados antes: ${dup}</small></div>
${A.size?`<small style="margin-bottom:8px">Se crearán cuentas nuevas (saldo inicial $0): ${esc([...A].join(', '))}</small>`:''}${C.size?`<small style="margin-bottom:8px">Se crearán ${C.size} categorías nuevas.</small>`:''}
${sk.length?`<div class="card"><b class="r">No se importarán</b>${sk.map(s=>`<small>${esc(s)}</small>`).join('')}</div>`:''}
<label style="display:flex;gap:12px;align-items:center;font-size:15px;color:var(--t)"><input type="checkbox" id="xd" checked style="width:24px;height:24px;margin:0">Evitar duplicados si ya importé este Excel</label>
<button class="btn" onclick="xlsApply()">Importar ${o.items.length} movimientos</button><button class="btn sec" onclick="closeSheet()">Cancelar</button>`)}
function xlsApply(){if(!XI||!Array.isArray(XI.items))return alert('No hay datos de Excel para importar.');const dd=$('#xd').checked,have=new Set(S.tx.map(t=>t.key).filter(Boolean));let add=0,dup=0;
const acc=n=>{let a=S.accounts.find(x=>nz(x.name)==nz(n));if(!a)S.accounts.push(a={id:uid(),name:n,ini:0});return a.id};
for(const i of XI.items){if(dd&&have.has(i.key)){dup++;continue}let cat='',sub='';
if(i.cat){let c=S.cats.find(x=>nz(x.name)==nz(i.cat));if(!c)S.cats.push(c={id:uid(),name:i.cat,subs:[],budget:0});cat=c.id;
if(i.sub){let s=c.subs.find(x=>nz(x.name)==nz(i.sub));if(!s)c.subs.push(s={id:uid(),name:i.sub});sub=s.id}}
S.tx.push({id:uid(),type:i.type,amount:i.amount,refund:0,date:i.date,acc:acc(i.acc),to:i.to?acc(i.to):'',cat,sub,desc:i.desc,key:i.key});add++}
save();closeSheet();render();alert(`Se importaron ${add} movimientos.`+(dup?` Se omitieron ${dup} duplicados.`:''))}
async function xlsPick(e){const f=e.target.files[0];e.target.value='';if(!f)return;
try{if(typeof DecompressionStream=='undefined')throw new Error('Tu navegador no puede leer Excel. Actualizá iOS/Safari.');xlsPreview(parseAgenda(await readSheet(await f.arrayBuffer(),'AGENDA')))}
catch(x){alert(x.message&&x.message.length<200?x.message:'No pude leer el archivo. Tiene que ser un Excel .xlsx con una hoja llamada AGENDA.')}}

/* Las categorías son totalmente personalizables. Ya no se crean categorías predeterminadas. */
function mvForm(id){const t=S.tx.filter(x=>x.cat==id).length;sheet(`<h3>Mover movimientos</h3><small style="margin-bottom:8px">${t} movimiento(s) de “${esc(nm(S.cats,id))}” pasarán a la categoría que elijas. No se borra ningún movimiento.</small><label>Nueva categoría</label><select id="mv_c" onchange="mvSubs()"><option value="">Elegir…</option>${opt(S.cats.filter(c=>c.id!=id),'')}</select><label>Subcategoría (opcional)</label><select id="mv_s"><option value="">Sin subcategoría</option></select><button class="btn" onclick="mvDo('${id}')">Mover</button>`)}
function mvSubs(){const c=S.cats.find(x=>x.id==$('#mv_c').value);$('#mv_s').innerHTML='<option value="">Sin subcategoría</option>'+(c?opt(c.subs,''):'')}
function mvDo(id){const c=S.cats.find(x=>x.id==$('#mv_c').value);if(!c)return alert('Elegí una categoría');const old=S.cats.find(x=>x.id==id),s0=$('#mv_s').value;
S.tx.forEach(t=>{if(t.cat!=id)return;const on=old?.subs.find(s=>s.id==t.sub)?.name,m=on&&c.subs.find(s=>nz(s.name)==nz(on));t.cat=c.id;t.sub=m?m.id:s0});save();closeSheet();render();alert('Movimientos movidos a '+c.name)}

/* ===== Historial de gastos e ingresos ===== */
let G={y:'',m:'',c:'',s:'',o:'',a:'',b:''};
const gset=(k,v)=>{G[k]=v;if(k=='c')G.s='';render()},gtog=id=>{G.o=G.o==id?'':id;render()},mlab=m=>MF[+m.slice(5)-1]+' '+m.slice(0,4),o2=(arr,cur)=>arr.map(([v,l])=>`<option value="${v}" ${v==cur?'selected':''}>${esc(l)}</option>`).join('');
const gW=n=>`style="width:${n*40>320?n*40+'px':'100%'};max-width:none;height:auto"`,gL=(m)=>ml(m)+(G.y?'':"'"+m.slice(2,4));
const gbars=(v,l,col)=>{const n=v.length,mx=Math.max(1,...v);return `<div class="scroll"><svg viewBox="0 0 ${Math.max(320,n*40)} 150" ${gW(n)} class="chart">`+v.map((y,i)=>{const h=y/mx*105;return `<rect x="${i*40+8}" y="${120-h}" width="24" height="${h}" rx="4" fill="${col}"/><text x="${i*40+20}" y="138" text-anchor="middle" style="font-size:9px">${l[i]}</text>`}).join('')+`<text x="2" y="10" style="font-size:9px">Máx ${f(mx)}</text></svg></div>`};
const gdual=(a,b,l)=>{const n=a.length,mx=Math.max(1,...a,...b);return `<div class="scroll"><svg viewBox="0 0 ${Math.max(320,n*40)} 150" ${gW(n)} class="chart">`+a.map((y,i)=>{const h=y/mx*105,k=b[i]/mx*105;return `<rect x="${i*40+4}" y="${120-h}" width="15" height="${h}" rx="3" fill="var(--g)"/><rect x="${i*40+21}" y="${120-k}" width="15" height="${k}" rx="3" fill="var(--r)"/><text x="${i*40+20}" y="138" text-anchor="middle" style="font-size:9px">${l[i]}</text>`}).join('')+`<text x="2" y="10" style="font-size:9px">Máx ${f(mx)}</text></svg></div>`};
const gline=(v,l)=>{const n=v.length,mx=Math.max(1,...v),p=v.map((y,i)=>[i*40+20,115-y/mx*95]);return `<div class="scroll"><svg viewBox="0 0 ${Math.max(320,n*40)} 150" ${gW(n)} class="chart"><polyline points="${p.map(q=>q.join(',')).join(' ')}" fill="none" stroke="var(--p)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${p.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="3.5" fill="var(--p)"/><text x="${q[0]}" y="140" text-anchor="middle" style="font-size:9px">${l[i]}</text>`).join('')}<text x="2" y="10" style="font-size:9px">Máx ${f(mx)}</text></svg></div>`};
views.gastos=()=>{const pd=d=>(!G.y||d.startsWith(G.y))&&(!G.m||d.slice(5,7)==G.m),sel=S.tx.filter(t=>pd(t.date)),gs=sel.filter(t=>t.type=='gasto'),sum=a=>a.reduce((x,t)=>x+netAmt(t),0),inc=sum(sel.filter(t=>t.type=='ingreso')),tot=sum(gs),
ac=S.cats.find(c=>nz(c.name)=='ahorro'),sav=S.goals.flatMap(g=>g.hist||[]).filter(h=>pd(h.d)).reduce((x,h)=>x+h.a,0)+sum(gs.filter(t=>ac&&t.cat==ac.id)),big=gs.reduce((b,t)=>netAmt(t)>(b?netAmt(b):0)?t:b,null),
by={};gs.forEach(t=>{const o=by[t.cat]=by[t.cat]||{v:0,n:0,s:{}};o.v+=netAmt(t);o.n++;o.s[t.sub]=(o.s[t.sub]||0)+netAmt(t)});const rows=Object.entries(by).sort((p,q)=>q[1].v-p[1].v),byI={};sel.filter(t=>t.type=='ingreso').forEach(t=>{const o=byI[t.cat]=byI[t.cat]||{v:0,n:0,s:{}};o.v+=netAmt(t);o.n++;o.s[t.sub]=(o.s[t.sub]||0)+netAmt(t)});const rowsI=Object.entries(byI).sort((p,q)=>q[1].v-p[1].v),
years=[...new Set([...S.tx.map(t=>t.date.slice(0,4)),...(G.y?[G.y]:[])])].sort(),
lb=G.y&&G.m?MF[+G.m-1]+' '+G.y:G.y?'Año '+G.y:G.m?MF[+G.m-1]+' (todos los años)':'Historial completo',
cn=id=>nm(S.cats,id)=='—'?'Sin categoría':nm(S.cats,id);
const match=t=>(!G.c||t.cat==G.c)&&(!G.s||t.sub==G.s),okG=t=>t.type=='gasto'&&match(t),okI=t=>t.type=='ingreso'&&match(t),sg={},si={},al=new Set();
S.tx.forEach(t=>{if(t.type=='transferencia'||(G.y&&!t.date.startsWith(G.y)))return;const m=t.date.slice(0,7);al.add(m);if(okI(t))si[m]=(si[m]||0)+t.amount;if(okG(t))sg[m]=(sg[m]||0)+netAmt(t)});
let M=[];if(G.y)for(let i=1;i<=12;i++)M.push(G.y+'-'+p2(i));else if(al.size){const k=[...al].sort();let[y,mo]=k[0].split('-').map(Number);for(;;){const x=y+'-'+p2(mo);M.push(x);if(x>=k[k.length-1])break;if(++mo>12){mo=1;y++}}}
const vg=M.map(m=>sg[m]||0),vi=M.map(m=>si[m]||0),lab=M.map(gL),co=S.cats.find(c=>c.id==G.c);
const allM=[...new Set(S.tx.filter(t=>t.type=='gasto').map(t=>t.date.slice(0,7)))].sort(),A=G.a||allM[allM.length-2]||allM[0]||'',B=G.b||allM[allM.length-1]||'',
sp=m=>{const o={};S.tx.forEach(t=>{if(t.type=='gasto'&&t.date.startsWith(m))o[t.cat]=(o[t.cat]||0)+netAmt(t)});return o},pa=sp(A),pb=sp(B),ta=Object.values(pa).reduce((x,v)=>x+v,0),tb=Object.values(pb).reduce((x,v)=>x+v,0),
dc=[...new Set([...Object.keys(pa),...Object.keys(pb)])].map(c=>[c,(pa[c]||0),(pb[c]||0)]).sort((p,q)=>Math.abs(q[2]-q[1])-Math.abs(p[2]-p[1]));
return `<h2 style="margin-top:4px">Historial de gastos e ingresos</h2><div class="two"><div><label>Año</label><select onchange="gset('y',this.value)">${o2([['','Todos'],...years.map(y=>[y,y])],G.y)}</select></div><div><label>Mes</label><select onchange="gset('m',this.value)">${o2([['','Todos'],...MF.map((n,i)=>[p2(i+1),n])],G.m)}</select></div></div>
<div class="hero"><small>Balance · ${lb}</small><b>${f(inc-tot)}</b><small>Ingresos − gastos (las transferencias no se cuentan)</small></div>
<div class="grid"><div class="card"><small>Total gastado</small><b class="r">${f(tot)}</b></div><div class="card"><small>Total ingresado</small><b class="g">${f(inc)}</b></div><div class="card"><small>Total ahorrado</small><b>${f(sav)}</b></div><div class="card"><small>Cantidad de gastos</small><b>${gs.length}</b></div><div class="card"><small>Cantidad de ingresos</small><b>${sel.filter(t=>t.type=='ingreso').length}</b></div><div class="card"><small>Promedio de ingreso</small><b>${f(sel.filter(t=>t.type=='ingreso').length?inc/sel.filter(t=>t.type=='ingreso').length:0)}</b></div>
<div class="card"><small>Promedio de gasto</small><b>${f(gs.length?tot/gs.length:0)}</b></div><div class="card"><small>Mayor gasto</small><b>${f(big?netAmt(big):0)}</b>${big?`<small>${esc(big.desc||cn(big.cat))} · ${fd(big.date)}</small>`:''}</div></div>
<div class="card"><b>Gastos por categoría</b><small style="margin-bottom:6px">Tocá una categoría para ver sus subcategorías</small><div class="tb h"><span>Categoría</span><span>Total</span><span>%</span><span>Mov.</span></div>
${rows.length?rows.map(([c,o],i)=>`<div onclick="gtog('${c}')"><div class="tb"><span>${esc(cn(c))} ${G.o==c?'▴':'▾'}</span><b style="font-size:14px">${f(o.v)}</b><span>${Math.round(o.v/tot*100)}%</span><span>${o.n}</span></div><div class="bar" style="margin:0 0 4px"><i style="width:${o.v/tot*100}%;background:${PAL[i%9]}"></i></div>${G.o==c?Object.entries(o.s).sort((p,q)=>q[1]-p[1]).map(([s,v])=>`<div class="sub"><span>${esc(nm((S.cats.find(x=>x.id==c)||{subs:[]}).subs,s)=='—'?'Sin subcategoría':nm(S.cats.find(x=>x.id==c).subs,s))}</span><span>${f(v)}</span></div>`).join(''):''}</div>`).join(''):'<small>Sin gastos en este período</small>'}</div>
<div class="card"><b>Ingresos por categoría</b><small style="margin-bottom:6px">Tocá una categoría para ver sus subcategorías</small><div class="tb h"><span>Categoría</span><span>Total</span><span>%</span><span>Mov.</span></div>
${rowsI.length?rowsI.map(([c,o],i)=>`<div onclick="gtog('I${c}')"><div class="tb"><span>${esc(cn(c))} ${G.o=='I'+c?'▴':'▾'}</span><b style="font-size:14px">${f(o.v)}</b><span>${inc?Math.round(o.v/inc*100):0}%</span><span>${o.n}</span></div><div class="bar" style="margin:0 0 4px"><i style="width:${inc?o.v/inc*100:0}%;background:${PAL[i%9]}"></i></div>${G.o=='I'+c?Object.entries(o.s).sort((p,q)=>q[1]-p[1]).map(([s,v])=>`<div class="sub"><span>${esc(nm((S.cats.find(x=>x.id==c)||{subs:[]}).subs,s)=='—'?'Sin subcategoría':nm(S.cats.find(x=>x.id==c).subs,s))}</span><span>${f(v)}</span></div>`).join(''):''}</div>`).join(''):'<small>Sin ingresos en este período</small>'}</div>
<h2>Evolución de gastos e ingresos</h2><div class="card"><small style="margin-bottom:8px">Año: ${G.y||'todos'} (el selector de Mes no limita esta sección). Elegí una categoría o subcategoría para ver los gastos <b>y también los ingresos</b> de ese período.</small>
<select onchange="gset('c',this.value)"><option value="">Todas las categorías</option>${opt(S.cats,G.c)}</select><select onchange="gset('s',this.value)"><option value="">Todas las subcategorías</option>${co?opt(co.subs,G.s):''}</select>
<div class="two"><div><small>Total de gastos</small><b class="r">${f(vg.reduce((x,v)=>x+v,0))}</b></div><div><small>Total de ingresos</small><b class="g">${f(vi.reduce((x,v)=>x+v,0))}</b></div></div></div>
${M.length?`<div class="card"><b>Gastos por mes</b>${gbars(vg,lab,'var(--r)')}</div><div class="card"><b>Ingresos por mes</b>${gbars(vi,lab,'var(--g)')}</div><div class="card"><b>Evolución a través del tiempo</b>${gline(vg,lab)}</div><div class="card"><b>Ingresos vs gastos</b>${leg}${gdual(vi,vg.map((v,i)=>v),lab)}<small>Los ingresos se muestran completos; el filtro de categoría afecta solamente a los gastos.</small></div>
<div class="card"><b>Mes por mes</b>${M.map((m,i)=>{const v=vg[i],incm=vi[i],bal=incm-v,p=i?vg[i-1]:0,dl=i&&p>0?Math.round((v-p)/p*100):0;return `<div class="row month-row" style="margin:8px 0"><span class="fl">${mlab(m)}<small>Gastos ${f(v)} · Ingresos ${f(incm)} · Balance ${f(bal)}</small></span><div class="month-values"><b class="r">${f(v)}</b><b class="g">${f(incm)}</b></div><small class="month-delta ${dl>0?'r':'g'}">${dl?(dl>0?'▲ ':'▼ ')+Math.abs(dl)+'%':''}</small></div>`}).join('')}</div>`:'<div class="card"><small>Todavía no hay movimientos.</small></div>'}
<h2>Comparar meses</h2><div class="card">${allM.length?`<div class="two"><select onchange="gset('a',this.value)">${o2(allM.slice().reverse().map(m=>[m,mlab(m)]),A)}</select><select onchange="gset('b',this.value)">${o2(allM.slice().reverse().map(m=>[m,mlab(m)]),B)}</select></div>
<div class="two"><div><small>${mlab(A)}</small><b>${f(ta)}</b></div><div><small>${mlab(B)}</small><b>${f(tb)}</b></div></div><b class="${tb>ta?'r':'g'}">Diferencia: ${tb>ta?'+':''}${f(tb-ta)}${ta?' ('+(tb>=ta?'+':'')+Math.round((tb-ta)/ta*100)+'%)':''}</b>
${dc.map(([c,x,y])=>`<div class="row" style="margin:8px 0"><span class="fl">${esc(cn(c))}<small>${f(x)} → ${f(y)}</small></span><b class="${y>x?'r':'g'}">${y>x?'+':''}${f(y-x)}</b></div>`).join('')}`:'<small>Sin gastos para comparar.</small>'}</div>`};
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js'));
cleanDefaultCats();save();render();
