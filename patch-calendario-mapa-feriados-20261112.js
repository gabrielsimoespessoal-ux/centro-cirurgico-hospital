(()=>{
'use strict';
if(window.__hsjCalendarioMapaFeriados20261112)return;
if(typeof window.renderMap!=='function'||typeof window.api!=='function')return;
window.__hsjCalendarioMapaFeriados20261112=true;

// Calendário do centro cirúrgico em Aracaju: feriados nacionais, estaduais e municipais.
// Pontos facultativos são informativos; somente feriados e fins de semana pedem autorização.
const originalApi=window.api;
const originalRender=window.renderMap;
const pad=x=>String(x).padStart(2,'0');
const iso=(y,m,d)=>y+'-'+pad(m)+'-'+pad(d);
const displayDate=v=>String(v||'').split('-').reverse().join('/');
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fixed={
 '01-01':['Confraternização Universal','Nacional'],
 '03-17':['Aniversário de Aracaju / mudança da capital','Municipal'],
 '04-21':['Tiradentes','Nacional'],
 '05-01':['Dia do Trabalhador','Nacional'],
 '06-24':['São João','Municipal'],
 '07-08':['Emancipação política de Sergipe','Estadual'],
 '09-07':['Independência do Brasil','Nacional'],
 '10-12':['Nossa Senhora Aparecida','Nacional'],
 '11-02':['Finados','Nacional'],
 '11-15':['Proclamação da República','Nacional'],
 '11-20':['Consciência Negra','Nacional'],
 '12-08':['Nossa Senhora da Conceição, padroeira de Aracaju','Municipal'],
 '12-25':['Natal','Nacional']
};
function easter(year){
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,
       f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),
       h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,
       l=(32+2*e+2*i-h-k+7)%7,m=Math.floor((a+11*h+22*l)/451);
 const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
 return iso(year,month,day);
}
function shift(date,days){
 const p=String(date).split('-').map(Number);
 const d=new Date(Date.UTC(p[0],p[1]-1,p[2]+days));
 return iso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());
}
function classification(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return null;
 const y=Number(date.slice(0,4)),em=easter(y);
 const md=date.slice(5);
 let h=fixed[md];
 if(date===shift(em,-2))h=['Paixão de Cristo (Sexta-feira Santa)','Nacional'];
 if(date===shift(em,60))h=['Corpus Christi','Municipal em Aracaju'];
 let optional='';
 if(date===shift(em,-48)||date===shift(em,-47))optional='Carnaval — ponto facultativo (confira a escala institucional)';
 if(date===shift(em,-46))optional='Quarta-feira de Cinzas — ponto facultativo (confira a escala)';
 if(date===shift(em,-3))optional='Quinta-feira Santa — ponto facultativo (confira a escala)';
 if(md==='10-28')optional='Dia do Servidor Público — ponto facultativo (confira a escala)';
 if(md==='12-24'||md==='12-31')optional='Véspera de feriado — confirme a escala';
 const p=date.split('-').map(Number);
 const dow=new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay();
 const weekend=dow===0||dow===6;
 if(h)return {kind:'holiday',name:h[0],scope:h[1],requiresAuthorization:true,weekend};
 if(weekend)return {kind:'weekend',name:dow===6?'Sábado — sem cirurgias de rotina':'Domingo — sem cirurgias de rotina',scope:'Regra institucional',requiresAuthorization:true,weekend:true};
 if(optional)return {kind:'optional',name:optional,scope:'Informativo',requiresAuthorization:false,weekend:false};
 return null;
}
window.hsjClassificarDataCirurgica=classification;
const authorizations=new Set();
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function getParam(path,name){
 const parts=String(path).split('?');
 const value=new URLSearchParams(parts[1]||'').get(name)||'';
 return value.startsWith('eq.')?value.slice(3):'';
}
async function authorizedException(date,surgeryId,source){
 const info=classification(date);
 if(!info?.requiresAuthorization)return;
 const id=uuidPattern.test(surgeryId||'')?surgeryId:null;
 const key=(id||'sem-id')+'|'+date;
 if(authorizations.has(key))return;
 const message='ATENÇÃO: '+displayDate(date)+' — '+info.name+'.\n\nO Hospital São José não realiza cirurgias de rotina em feriados, sábados e domingos.\n\nSomente uma situação ATÍPICA, confirmada pela gestão, deve prosseguir. Deseja solicitar uma exceção?';
 if(!window.confirm(message))throw Error('Agendamento cancelado: data não operacional.');
 const reason=String(window.prompt('JUSTIFICATIVA OBRIGATÓRIA\nExplique a excepcionalidade e a autorização institucional (mínimo de 10 caracteres):','')||'').trim();
 if(reason.length<10)throw Error('Agendamento não salvo. Informe uma justificativa de no mínimo 10 caracteres para a exceção.');
 // Guarda a autorização da tentativa ANTES da alteração do agendamento.
 // Se a gravação do agendamento falhar, o evento permanece como tentativa justificada.
 const rows=await originalApi('/rest/v1/surgery_calendar_exceptions',{
  method:'POST',headers:{Prefer:'return=representation'},
  body:JSON.stringify({surgery_id:id,scheduled_date:date,justification:reason,source:source})
 });
 if(!Array.isArray(rows)||rows.length!==1||!rows[0].id)throw Error('Não foi possível registrar a autorização excepcional. Agendamento interrompido.');
 authorizations.add(key);
}
let stateDate=new Date();
let month=stateDate.getMonth(),year=stateDate.getFullYear(),selectedDate='',loading=false,error='',loadSerial=0;
const cache=new Map();
function currentKey(){return iso(year,month+1,1).slice(0,7)}
function monthRange(y,m){return [iso(y,m+1,1),shift(iso(y+(m===11?1:0),(m+1)%12+1,1),0)]}
function currentData(){return cache.get(currentKey())?.rows||[]}
function currentCategories(row){
 const status=String(row.patient_status||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 if(/SUSPENS|CANCEL|NEGAD/.test(status))return 'suspended';
 if(row.stage==='realizadas'||status==='REALIZADA')return 'history';
 return 'scheduled';
}
function totals(date){
 const result={scheduled:0,history:0,suspended:0,total:0};
 for(const x of currentData())if(x.surgery_date===date){result[currentCategories(x)]++}
 result.total=result.scheduled+result.history;
 return result;
}
async function fetchMonth(y,m){
 const start=iso(y,m+1,1),end=iso(y+(m===11?1:0),(m+1)%12+1,1);
 const all=[];
 for(let offset=0;offset<50000;offset+=500){
  const path='/rest/v1/surgeries?select=id,patient_name,ids,procedure_name,surgery_date,map_room,surgeon,specialty,patient_status,stage'
   +'&active=eq.true&stage=in.(mapa_cirurgico,realizadas)'
   +'&surgery_date=gte.'+start+'&surgery_date=lt.'+end
   +'&order=surgery_date.asc,id.asc&limit=500&offset='+offset;
  const page=await originalApi(path);
  if(!Array.isArray(page))throw Error('O banco retornou dados inválidos para o calendário.');
  all.push(...page);
  if(page.length<500)return all;
 }
 throw Error('O calendário excedeu o limite de registros para o mês.');
}
async function refresh(force=false){
 const key=currentKey(),old=cache.get(key);
 if(!force&&old&&Date.now()-old.at<45000){draw();return}
 if(loading)return;
 const seq=++loadSerial,y=year,m=month;
 loading=true;error='';draw();
 try{
  const rows=await fetchMonth(y,m);
  cache.set(key,{rows,at:Date.now()});
 }catch(e){error=e.message||String(e)}
 finally{loading=false;if(seq===loadSerial)draw()}
}
const style=document.createElement('style');
style.id='hsj-surgical-calendar-styles';
style.textContent=[
 '#hsj-surgical-calendar{margin:12px 0 17px;padding:16px;background:#f9fbff;border:1px solid #c9d9ed;border-radius:12px}',
 '#hsj-surgical-calendar *{box-sizing:border-box}',
 '#hsj-surgical-calendar .sc-head{display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:10px}',
 '#hsj-surgical-calendar .sc-title{font-size:17px;font-weight:800;color:#173f6c}',
 '#hsj-surgical-calendar .sc-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
 '#hsj-surgical-calendar .sc-actions button,#hsj-surgical-calendar .sc-detail button{border:1px solid #b3c8e3;background:white;color:#204879;border-radius:7px;padding:7px 10px;cursor:pointer;font-weight:700}',
 '#hsj-surgical-calendar .sc-month{min-width:130px;text-align:center;text-transform:capitalize;font-size:14px;font-weight:800}',
 '#hsj-surgical-calendar .sc-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}',
 '#hsj-surgical-calendar .sc-week{margin-bottom:5px;font-size:11px;text-align:center;color:#526986;font-weight:800}',
 '#hsj-surgical-calendar .sc-day{min-height:84px;background:#fff;border:1px solid #d5e2f2;border-radius:8px;padding:7px;display:flex;flex-direction:column;gap:4px;text-align:left;cursor:pointer;color:#17314e}',
 '#hsj-surgical-calendar .sc-day:hover{border-color:#1d67ac}',
 '#hsj-surgical-calendar .sc-day.selected{outline:3px solid #3476ba}',
 '#hsj-surgical-calendar .sc-day.busy{background:#eaf4ff;border-color:#aac9ed}',
 '#hsj-surgical-calendar .sc-day.holiday{background:#ffebe6;border-color:#eab4a4}',
 '#hsj-surgical-calendar .sc-day.weekend{background:#f5effa;border-color:#d6c7ea}',
 '#hsj-surgical-calendar .sc-day.optional{background:#fff7e1;border-color:#ebd49a}',
 '#hsj-surgical-calendar .sc-day .sc-date{font-weight:900;font-size:15px}',
 '#hsj-surgical-calendar .sc-day .sc-total{font-size:12px;font-weight:800}',
 '#hsj-surgical-calendar .sc-day .sc-sub{font-size:10px;line-height:1.35}',
 '#hsj-surgical-calendar .sc-day .sc-restricted{color:#a23a2e;font-weight:800;font-size:10px}',
 '#hsj-surgical-calendar .sc-legend{font-size:11px;color:#4b6179;display:flex;gap:15px;flex-wrap:wrap;margin-top:10px}',
 '#hsj-surgical-calendar .sc-detail{margin-top:11px;background:#fff;border:1px solid #d5e1f1;border-radius:9px;padding:12px;font-size:12px}',
 '#hsj-surgical-calendar .sc-detail table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}',
 '#hsj-surgical-calendar .sc-detail th,#hsj-surgical-calendar .sc-detail td{padding:7px;border-bottom:1px solid #e1e8f1;text-align:left}',
 '#hsj-surgical-calendar .sc-error{margin-top:8px;color:#a42f2f;font-size:12px}',
 '.hsj-surgery-date-alert{grid-column:1/-1;border-radius:8px;padding:9px 12px;margin-top:5px;font-size:12px;background:#fff0e9;color:#923b25;border:1px solid #e7af97}',
 '.hsj-surgery-date-alert.optional{background:#fff8e3;color:#80601a;border-color:#eddaa3}',
 '@media(max-width:690px){#hsj-surgical-calendar{padding:9px}#hsj-surgical-calendar .sc-grid{gap:2px}#hsj-surgical-calendar .sc-day{min-height:70px;padding:4px}#hsj-surgical-calendar .sc-day .sc-sub{font-size:9px}#hsj-surgical-calendar .sc-day .sc-total{font-size:10px}}',
 '@media print{#hsj-surgical-calendar,.hsj-surgery-date-alert{display:none!important}}'
].join('\n');
document.head.appendChild(style);
function selectedInfo(){
 if(!selectedDate)return '';
 const rows=currentData().filter(x=>x.surgery_date===selectedDate);
 const count=totals(selectedDate),special=classification(selectedDate);
 const kindText={scheduled:'No mapa',history:'Encerrada / histórico',suspended:'Suspensa / cancelada'};
 const warning=special?'<div style="margin:5px 0;color:#a94d29"><strong>'+safe(special.name)+'</strong> · '+safe(special.scope)+(special.requiresAuthorization?' · Não operacional para cirurgias de rotina':' · Ponto facultativo: confirmar funcionamento')+'</div>':'';
 const table=rows.length?'<div style="overflow-x:auto"><table><thead><tr><th>Paciente</th><th>Procedimento</th><th>Sala</th><th>Médico</th><th>Situação</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+safe(x.patient_name)+'</td><td>'+safe(x.procedure_name||'—')+'</td><td>'+safe(x.map_room||'—')+'</td><td>'+safe(x.surgeon||'—')+'</td><td>'+safe(kindText[currentCategories(x)])+'</td></tr>').join('')+'</tbody></table></div>':'<div style="padding:8px 0">Nenhuma cirurgia cadastrada para esta data.</div>';
 return '<div class="sc-detail"><strong>Dia '+displayDate(selectedDate)+'</strong> · '+count.scheduled+' no mapa · '+count.history+' encerrada(s) no histórico'+(count.suspended?' · '+count.suspended+' suspensa(s)':'')
  +warning+table+'<button type="button" id="hsj-sc-map-date">Abrir mapa deste dia</button></div>';
}
function html(){
 let cells='';
 const offset=new Date(year,month,1).getDay(),n=new Date(year,month+1,0).getDate();
 for(let i=0;i<offset;i++)cells+='<div aria-hidden="true"></div>';
 for(let d=1;d<=n;d++){
  const date=iso(year,month+1,d),st=totals(date),special=classification(date);
  let status=special?.kind||((st.total>0)?'busy':'');
  const title=(special?special.name+'; ':'')+st.scheduled+' no mapa, '+st.history+' no histórico, '+st.suspended+' suspensas';
  cells+='<button type="button" class="sc-day '+status+(date===selectedDate?' selected':'')+'" data-hsj-sc-date="'+date+'" title="'+safe(title)+'" aria-label="'+safe(displayDate(date)+': '+title)+'">'
   +'<span class="sc-date">'+d+'</span><span class="sc-total">'+st.total+' cirurgia(s)</span>'
   +'<span class="sc-sub">'+st.scheduled+' no mapa · '+st.history+' histórico'+(st.suspended?' · '+st.suspended+' susp.':'')+'</span>'
   +(special?'<span class="sc-restricted">'+(special.kind==='holiday'?'⚠ FERIADO':special.kind==='weekend'?'SEM CIRURGIAS':'P. FACULTATIVO')+'</span>':'')
   +'</button>';
 }
 const label=new Date(year,month,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const data=cache.get(currentKey());
 const loadingText=loading?' · Atualizando dados do banco...':data?' · Dados atualizados':' · Buscando dados';
 return '<div class="sc-head"><div><div class="sc-title">📅 Calendário do Mapa Cirúrgico</div><div style="font-size:12px;color:#61728a">Cirurgias por data · Aracaju/SE'+loadingText+'</div></div>'
  +'<div class="sc-actions"><button type="button" id="hsj-sc-prev">‹</button><span class="sc-month">'+safe(label)+'</span><button type="button" id="hsj-sc-next">›</button><button type="button" id="hsj-sc-today">Hoje</button><button type="button" id="hsj-sc-refresh">↻ Atualizar</button></div></div>'
  +'<div class="sc-grid sc-week">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>'<span>'+x+'</span>').join('')+'</div>'
  +'<div class="sc-grid">'+cells+'</div>'
  +'<div class="sc-legend"><span>🔵 Com cirurgias no mapa</span><span>🟠 Feriado</span><span>🟣 Fim de semana</span><span>🟡 Ponto facultativo</span><span>• Histórico não significa cirurgia realizada</span></div>'
  +(selectedDate?selectedInfo():'<div style="font-size:12px;color:#526984;margin-top:9px">Selecione uma data para ver os pacientes e abrir o mapa daquele dia.</div>')
  +(error?'<div class="sc-error">Não foi possível consultar o banco: '+safe(error)+'. Se houver dados anteriores, foram preservados.</div>':'');
}
function draw(){
 const root=document.getElementById('hsj-surgical-calendar');
 if(!root||S.view!=='mapa_cirurgico')return;
 root.innerHTML=html();
 root.querySelector('#hsj-sc-prev').onclick=()=>moveMonth(-1);
 root.querySelector('#hsj-sc-next').onclick=()=>moveMonth(1);
 root.querySelector('#hsj-sc-today').onclick=()=>{
  const d=new Date();year=d.getFullYear();month=d.getMonth();selectedDate=iso(year,month+1,d.getDate());draw();refresh();
 };
 root.querySelector('#hsj-sc-refresh').onclick=()=>refresh(true);
 root.querySelectorAll('[data-hsj-sc-date]').forEach(b=>b.onclick=()=>{
  selectedDate=b.dataset.hsjScDate;draw();
 });
 const open=root.querySelector('#hsj-sc-map-date');
 if(open)open.onclick=()=>{
  S.mapFilters={doctor:'',specialty:'',from:selectedDate,to:selectedDate};
  S.room='all';S.mapMode='daily';window.renderMap();
  document.querySelector('#hsj-map-actions-repair')?.scrollIntoView({block:'start',behavior:'smooth'});
 };
}
function moveMonth(step){
 let d=new Date(year,month+step,1);year=d.getFullYear();month=d.getMonth();selectedDate='';
 draw();refresh();
}
function mount(){
 if(S.view!=='mapa_cirurgico')return;
 const card=document.querySelector('#content .map-print-v11');
 if(!card)return;
 let root=document.getElementById('hsj-surgical-calendar');
 if(!root){
  root=document.createElement('section');root.id='hsj-surgical-calendar';
  const head=card.querySelector('.section-head');
  if(head)head.insertAdjacentElement('afterend',root);else card.prepend(root);
 }
 draw();
 if(!cache.get(currentKey())||Date.now()-cache.get(currentKey()).at>45000)refresh();
}
window.renderMap=function(){
 const ret=originalRender.apply(this,arguments);
 mount();
 return ret;
};
function attachDateNotice(){
 const modal=document.getElementById('modal');if(!modal)return;
 for(const input of modal.querySelectorAll('#f_surgery_date,#ac_date')){
  if(input.dataset.hsjHolidayWatch)return;
  input.dataset.hsjHolidayWatch='1';
  const place=input.closest('.field')||input.parentElement;
  if(!place)continue;
  const note=document.createElement('div');note.className='hsj-surgery-date-alert';note.style.display='none';
  place.after(note);
  const update=()=>{
   const info=classification(input.value);
   note.style.display=info?'block':'none';
   note.classList.toggle('optional',info?.kind==='optional');
   note.textContent=!info?'':info.requiresAuthorization?
     '⚠ '+info.name+' ('+info.scope+'). Não há cirurgias de rotina nesta data. Para reagendar excepcionalmente, será exigida confirmação e justificativa ao salvar.':
     'ℹ '+info.name+'. Ponto facultativo ou véspera: confira o funcionamento institucional antes de agendar.';
  };
  input.addEventListener('input',update);
  input.addEventListener('change',update);
  update();
 }
}
const modal=document.getElementById('modal');
if(modal)new MutationObserver(attachDateNotice).observe(modal,{subtree:true,childList:true});
attachDateNotice();
window.api=async function(path,opt={}){
 const method=String(opt.method||'GET').toUpperCase();
 const surgery=String(path).startsWith('/rest/v1/surgeries?')||String(path)==='/rest/v1/surgeries';
 const detail=String(path).startsWith('/rest/v1/surgery_appointment_details?')||String(path)==='/rest/v1/surgery_appointment_details';
 let payload=null;
 if((surgery||detail)&&['POST','PUT','PATCH'].includes(method)&&opt.body){
  try{payload=typeof opt.body==='string'?JSON.parse(opt.body):opt.body}catch{}
 }
 if(payload&&!Array.isArray(payload)){
  const date=String(surgery?payload.surgery_date||'':payload.scheduled_date||'').slice(0,10);
  if(classification(date)?.requiresAuthorization){
   const id=surgery?(getParam(path,'id')||payload.id||''):(payload.surgery_id||getParam(path,'surgery_id')||'');
   const key=(uuidPattern.test(id)?id:'sem-id')+'|'+date;
   if(!authorizations.has(key)){
    let previous=null;
    if(uuidPattern.test(id)){
     // Não requisitar exceção em edições onde a data já é a mesma.
     const p=surgery?'/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=surgery_date':
       '/rest/v1/surgery_appointment_details?surgery_id=eq.'+encodeURIComponent(id)+'&select=scheduled_date';
     const existing=await originalApi(p);
     previous=String(existing?.[0]?.[surgery?'surgery_date':'scheduled_date']||'').slice(0,10);
    }
    if(previous!==date)await authorizedException(date,id,surgery?'Mapa/cadastro de cirurgia':'Agendamento cirúrgico / WhatsApp');
   }
  }
 }
 const saved=await originalApi.apply(this,arguments);
 if(payload&&!Array.isArray(payload)&&(payload.surgery_date||payload.scheduled_date)){
  cache.clear();
  if(S.view==='mapa_cirurgico')refresh(true);
 }
 return saved;
};
if(S.view==='mapa_cirurgico')mount();
})();