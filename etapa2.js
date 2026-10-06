/* Gastos · Etapa 2: fijos, aportes, suscripciones y calendario. Se carga después de index.html. */
const st=document.createElement('style');st.textContent=`nav button{min-width:0;flex:1;font-size:12px;padding:0 2px}nav .fab{flex:0 0 56px}
.r2{display:flex;gap:10px;align-items:center}.r2>*{flex:1}.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.cal b{font-weight:500;color:var(--m);font-size:12px;text-align:center}
.cd{position:relative;aspect-ratio:1;min-height:44px;border-radius:12px;border:0;background:var(--c);color:var(--t);font:inherit;font-size:14px;text-align:left;padding:6px;cursor:pointer}.cd i{position:absolute;bottom:5px;width:7px;height:7px;border-radius:4px}
.big3{font-size:26px;font-weight:700}@media(min-width:900px){main.v-fijos,main.v-cal{max-width:720px;margin:0 auto;width:100%}}`;document.head.appendChild(st);
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const dmax=(y,m)=>new Date(y,m,0).getDate(),pad=n=>String(n).padStart(2,'0');
const cobroFecha=(f,b)=>`${b.slice(0,7)}-${pad(Math.min(f.dia,dmax(+b.slice(0,4),+b.slice(5,7))))}`;
const pagadoMes=(f,mes)=>S.movs.some(x=>x.extra?.fijo_id==f.id&&x.fecha.slice(0,7)==mes);
function proxCobro(f){const h=hoyS();if(!pagadoMes(f,h.slice(0,7)))return cobroFecha(f,h);return cobroFecha(f,iso(new Date(+h.slice(0,4),+h.slice(5,7),1)))}
const semsHasta=c=>Math.max(1,Math.ceil((dt(c)-dt(hoyS()))/(864e5*7)));
const reunido=f=>Math.max(0,S.aportes.filter(a=>a.fijo_id==f.id).reduce((a,x)=>a+x.monto,0)-S.movs.filter(x=>x.extra?.fijo_id==f.id).reduce((a,x)=>a+x.monto,0));
const fijosDue=()=>S.fijos.filter(f=>proxCobro(f)<=hoyS());
cargar=async function(){const q=t=>SB.from(t).select();const[a,s,m,w,f,fj,ap]=await Promise.all([q('ajustes').maybeSingle(),q('sobres').eq('activo',true).order('orden'),q('movimientos').order('fecha',{ascending:false}).order('creado',{ascending:false}),q('semanas'),q('frecuentes'),q('fijos').eq('activo',true).order('dia'),q('aportes_fijos')]);
 S.aj=a.data;S.sobres=s.data||[];S.movs=m.data||[];S.sems=w.data||[];S.frec=f.data||[];S.fijos=fj.data||[];S.aportes=ap.data||[];draw()};
draw=function(){const a=$('#app');if(!S.user)return vAuth();if(locked)return vPin();if(!S.aj?.listo)return vWizard();
 const v={inicio:vInicio,fijos:vFijos,cal:vCal,movs:vMovs,aj:vAjustes}[S.v](),T=[['inicio','Inicio'],['fijos','Fijos'],0,['cal','Calendario'],['movs','Gastos'],['aj','Ajustes']];
 a.innerHTML=`<main class="v-${S.v}">${v}<button class="help" aria-label="Ayuda" onclick="ayuda()">?</button></main><nav>${T.map(t=>t?`<button class="${S.v==t[0]?'on':''}" onclick="ir('${t[0]}')">${t[1]}</button>`:'<button class="fab" aria-label="Nuevo gasto" onclick="abrirGasto()">+</button>').join('')}</nav>`};
const _vi=vInicio;vInicio=function(){let h=_vi();const p=fijosDue();if(p.length)h=h.replace('</h1></div>',`</h1></div><div class="warn" style="grid-column:1/-1">Tienes ${p.length} cobro${p.length>1?'s':''} fijo${p.length>1?'s':''} por confirmar: ${p.map(f=>esc(f.nombre)).join(', ')}.<br><button class="btn" style="margin-top:10px" onclick="ir('fijos')">Ver fijos</button></div>`);return h};
/* ---------- fijos ---------- */
function vFijos(){const h=hoyS(),lun=lunesDe(h),fin=addD(lun,6);let sug=0,apo=0;
 const cards=S.fijos.map(f=>{const c=proxCobro(f),due=c<=h,re=reunido(f),falta=Math.max(0,f.monto-re),s=Math.ceil(falta/(due?1:semsHasta(c))/100)*100,ya=S.aportes.filter(a=>a.fijo_id==f.id&&a.fecha>=lun&&a.fecha<=fin).reduce((a,x)=>a+x.monto,0),rest=Math.max(0,s-ya);if(!due)sug+=rest;apo+=ya;
  return `<div class="card"><div class="l"><b>${esc(f.nombre)}</b><span>${fm(f.monto)} · día ${f.dia}</span></div><div class="t"><i style="width:${Math.min(100,re/f.monto*100)}%;background:var(--g)"></i></div><small>Reunido ${fm(re)} de ${fm(f.monto)} · cobro ${dm(c)}${due?' (por confirmar)':''}</small>
  ${due?`<button class="btn" onclick="confFijo('${f.id}')">Confirmar pago de ${fm(f.monto)}</button>`:`<div class="r2"><button class="btn2" onclick="aportar('${f.id}',${rest})">Aportar</button><small>Sugerido esta semana: ${fm(rest)}</small></div>`}
  <div class="r2"><button class="btn2" onclick="editaFijo('${f.id}')">Editar</button><button class="btn2" onclick="quitaFijo('${f.id}')">Quitar</button></div></div>`}).join('');
 const sus=S.fijos.filter(f=>f.suscripcion),tm=sus.reduce((a,f)=>a+f.monto,0);
 return `<h1>Fijos</h1><div class="card"><span class="m">Esta semana</span><div class="l"><span>Aportado</span><b>${fm(apo)}</b></div><div class="l"><span>Te falta aportar (sugerido)</span><b>${fm(sug)}</b></div><small>Puedes aportar el monto que quieras, cuando quieras. Si aportas de más, lo sugerido baja solo en las semanas siguientes.</small></div>
 ${cards||'<p>Aún no tienes gastos fijos. Agrega arriendo, internet, suscripciones o lo que se cobre una vez al mes.</p>'}<button class="btn" onclick="editaFijo()">+ Nuevo gasto fijo</button>
 ${sus.length?`<div class="card"><b>Suscripciones</b>${sus.map(f=>`<div class="l"><label class="ck"><input type="checkbox" ${f.extra?.cancelar?'checked':''} onchange="cancelaF('${f.id}',this.checked)"> ${esc(f.nombre)}</label><span>${fm(f.monto)}/mes · ${fm(f.monto*12)}/año</span></div>`).join('')}<div class="l"><b>Total</b><b>${fm(tm)}/mes · ${fm(tm*12)}/año</b></div><small>Marca las que quieras cancelar.</small></div>`:''}`}
function editaFijo(id){const f=S.fijos.find(x=>x.id==id)||{nombre:'',monto:'',dia:'',suscripcion:false},d=$('#dlg');
 d.innerHTML=`<h3>${id?'Editar':'Nuevo'} gasto fijo</h3><input id="fn" placeholder="Nombre (ej. Arriendo, Spotify)" value="${esc(f.nombre)}" aria-label="Nombre"><input id="fo" inputmode="numeric" placeholder="Monto mensual" value="${f.monto}" aria-label="Monto mensual"><input id="fd" inputmode="numeric" placeholder="Día del mes en que se cobra (1 a 31)" value="${f.dia}" aria-label="Día de cobro"><label class="ck"><input type="checkbox" id="fs" ${f.suscripcion?'checked':''}> Es una suscripción</label><div class="r2"><button class="btn2" onclick="this.closest('dialog').close()">Cancelar</button><button class="btn" onclick="guardaFijo('${id||''}')">Guardar</button></div>`;d.onclose=null;d.showModal()}
async function guardaFijo(id){const dia=parseInt($('#fd').value),o={nombre:$('#fn').value.trim(),monto:parseM($('#fo').value),dia,suscripcion:$('#fs').checked};if(!o.nombre||!o.monto||!(dia>=1&&dia<=31))return toast('Completa nombre, monto y un día entre 1 y 31');
 const r=id?await SB.from('fijos').update(o).eq('id',id):await SB.from('fijos').insert(o);if(r.error)return toast(r.error.message);$('#dlg').close();cargar()}
async function aportar(id,def){const v=await ask('¿Cuánto apartas para este fijo?',def||'','numeric');if(v==null)return;const m=parseM(v);if(m>0){await SB.from('aportes_fijos').insert({fijo_id:id,monto:m});cargar()}}
async function confFijo(id){const f=S.fijos.find(x=>x.id==id);const{error}=await SB.from('movimientos').insert({monto:f.monto,nota:f.nombre,fecha:hoyS(),sobre_id:null,extra:{fijo_id:id}});if(error)return toast(error.message);toast('Pago confirmado');cargar()}
async function quitaFijo(id){if(confirm('¿Quitar este gasto fijo? Los pagos ya registrados se mantienen.')){await SB.from('fijos').update({activo:false}).eq('id',id);cargar()}}
async function cancelaF(id,v){const f=S.fijos.find(x=>x.id==id);await SB.from('fijos').update({extra:{...f.extra,cancelar:v}}).eq('id',id)}
/* ---------- calendario ---------- */
const mesMov=n=>{const[y,m]=S.mes.split('-').map(Number);S.mes=iso(new Date(y,m-1+n,1)).slice(0,7);draw()};
function vCal(){const mes=S.mes=S.mes||hoyS().slice(0,7),[y,m]=mes.split('-').map(Number),nd=dmax(y,m),ini=mes+'-01',fin=`${mes}-${pad(nd)}`,lunes=[];
 for(let l=lunesDe(ini);l<=fin;l=addD(l,7))if(l>=ini)lunes.push(l);
 const ing=lunes.reduce((a,l)=>a+(S.sems.find(x=>x.lunes==l)?.pago||0),0),delMes=S.movs.filter(x=>{const l=lunesDe(x.fecha);return l>=ini&&l<=fin}),gas=delMes.reduce((a,x)=>a+x.monto,0),fij=delMes.filter(x=>x.extra?.fijo_id).reduce((a,x)=>a+x.monto,0),q=ing-gas;
 const porDia={};S.movs.forEach(x=>{if(x.fecha.slice(0,7)==mes)porDia[x.fecha]=(porDia[x.fecha]||0)+x.monto});const mx=Math.max(1,...Object.values(porDia));
 let cel=Array((new Date(y,m-1,1).getDay()+6)%7).fill('<span></span>').join('');
 for(let d=1;d<=nd;d++){const f=`${mes}-${pad(d)}`,g=porDia[f]||0,a=g?.15+.7*g/mx:0,cb=S.fijos.some(x=>cobroFecha(x,f)==f),pg=S.sems.some(x=>x.lunes==f&&x.pago!=null);
  cel+=`<button class="cd" style="${g?`background:rgba(91,140,255,${a.toFixed(2)});${a>.5?'color:#0A1020':''}`:''}" onclick="diaDet('${f}')" aria-label="${dm(f)}">${d}${cb?'<i style="right:6px;background:var(--y)"></i>':''}${pg?'<i style="left:6px;background:var(--g)"></i>':''}</button>`}
 const sob=S.sobres.map(b=>[b.nombre,delMes.filter(x=>x.sobre_id==b.id).reduce((a,x)=>a+x.monto,0)]).filter(x=>x[1]);
 return `<h1>Calendario</h1><div class="r2"><button class="btn2" onclick="mesMov(-1)" aria-label="Mes anterior">◀</button><b style="text-align:center">${MESES[m-1]} ${y}</b><button class="btn2" onclick="mesMov(1)" aria-label="Mes siguiente">▶</button></div>
 <div class="card"><div class="l"><span>Ganado en el mes</span><b class="big3">${fm(ing)}</b></div><div class="l"><span>Gastado en el mes</span><b class="big3">${fm(gas)}</b></div><div class="l"><span>Te quedó</span><b class="big3" style="color:${q>=0?'var(--g)':'var(--r)'}">${fm(q)}</b></div><small>${lunes.length} semanas completas, de lunes a domingo (cada semana cuenta en el mes donde cae su lunes).${fij?` Incluye ${fm(fij)} en pagos fijos.`:''}</small></div>
 <div class="card"><div class="cal">${DIAS.map(d=>`<b>${d}</b>`).join('')}${cel}</div><small>Más azul = más gasto ese día. Punto verde: día de pago. Punto amarillo: cobro de un gasto fijo. Toca un día para ver el detalle.</small></div>
 ${sob.length?`<div class="card"><b>Gastado por sobre</b>${sob.map(x=>`<div class="l"><span>${esc(x[0])}</span><span>${fm(x[1])}</span></div>`).join('')}</div>`:''}`}
function diaDet(f){const d=$('#dlg'),L=S.movs.filter(x=>x.fecha==f),C=S.fijos.filter(x=>cobroFecha(x,f)==f);
 d.innerHTML=`<h3>${dm(f)}</h3>${C.map(x=>`<div class="l"><span>Cobro: ${esc(x.nombre)}</span><b>${fm(x.monto)}</b></div>`).join('')}${L.map(x=>`<div class="l"><span>${esc(x.nota||S.sobres.find(s=>s.id==x.sobre_id)?.nombre||'Gasto')}</span><b>${fm(x.monto)}</b></div>`).join('')||'<p>Sin gastos este día.</p>'}<button class="btn" onclick="this.closest('dialog').close()">Cerrar</button>`;d.onclose=null;d.showModal()}
/* ---------- ayuda ---------- */
function ayuda(){const T={inicio:['Inicio','Aquí ves tu semana, de lunes a domingo. "Te quedan" es lo que falta por gastar entre todos los sobres. El semáforo compara lo gastado con los días que van de la semana: verde vas bien, amarillo ojo con el ritmo, rojo vas muy rápido. Si el pago se atrasa, toca "Registrar pago" cuando llegue.'],
 fijos:['Fijos','Son los gastos que se cobran una vez al mes. Cada semana puedes apartar una parte para tenerlos listos: la app sugiere cuánto, pero tú decides el monto. Cuando llega el día de cobro, confirma el pago con un toque.'],
 cal:['Calendario','Arriba ves lo ganado, lo gastado y lo que te quedó del mes. Debajo, cada día se pinta más azul mientras más gastaste. Toca un día para ver el detalle.'],
 movs:['Gastos','Aquí están tus gastos, del más reciente al más antiguo. Con la ✕ borras uno y tienes 5 segundos para deshacer. Para anotar uno nuevo toca el botón +.'],
 aj:['Ajustes','Aquí cambias el nombre y el monto semanal de cada sobre, y qué pasa con lo que sobra: "Pasa" lo suma a la semana siguiente y "Se pierde" no. También ves tus accesos rápidos, ajustas el semáforo y cambias tu PIN.']}[S.v],d=$('#dlg');
 d.innerHTML=`<h3>${T[0]}</h3><p>${T[1]}</p><button class="btn2" onclick="$('#dlg').close();tour()">Ver cómo funciona la app</button><button class="btn" onclick="this.closest('dialog').close()">Entendido</button>`;d.onclose=null;d.showModal()}
if(S.user)cargar();
