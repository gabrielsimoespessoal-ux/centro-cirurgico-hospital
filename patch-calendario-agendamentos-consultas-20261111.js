(()=>{
'use strict';
if(window.__jordanaConsultaCalendarInstalled)return;
window.__jordanaConsultaCalendarInstalled=true;
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const pad=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>y+'-'+pad(m)+'-'+pad(d);
const dateBR=s=>s? s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
const today=()=>{const d=new Date();return iso(d.getFullYear(),d.getMonth()+1,d.getDate())};
const special=['geral','ortopedia','urologia'];
let ref=new Date(),month=ref.getMonth(),year=ref.getFullYear(),selectedMode='geral',selectedDate='',calendarBusy=false;
let rows=[],error='';
let lastLoad=0,lastAttempt=0;
function appliedRules(day,mode){
 const w=new Date(day+'T12:00:00').getDay();
 let rules=[];
 if(w===2)rules.push({kind:'geral',label:'Limite total de terça-feira',max:10});
 if(mode==='ortopedia'&&w===3)rules.push({kind:'ortopedia',label:'Ortopedia na quarta-feira',max:7});
 if(mode==='urologia'&&w>=1&&w<=5)rules.push({kind:'urologia',label:'Urologia nos dias úteis',max:2});
 return rules;
}
function nCount(day,kind){
 return rows.filter(x=>x.consultation_date===day&&(kind==='geral'||norm(x.specialty).includes(kind==='ortopedia'?'ORTOPED':'UROLOG'))).length;
}
function status(day,mode){
 const rules=appliedRules(day,mode);
 const total=rows.filter(x=>x.consultation_date===day).length;
 const relevant=rows.filter(x=>x.consultation_date===day&&(mode==='geral'||norm(x.specialty).includes(mode==='ortopedia'?'ORTOPED':'UROLOG'))).length;
 const details=rules.map(r=>({...r,used:nCount(day,r.kind)}));
 const remaining=details.length?Math.min(...details.map(r=>r.max-r.used)):null;
 const pct=details.length?Math.max(...details.map(r=>r.used/r.max)):0;
 return {total,relevant,details,remaining,pct,state:!details.length?'no-limit':remaining<=0?'full':relevant?'partial':'available'};
}
async function fetchRows(){
 // Leitura direta do banco, sem depender da quantidade de pacientes carregados na Fila.
 const t=localStorage.getItem('sb_access_token')||'';
 if(!t)throw Error('Faça login antes de consultar a agenda.');
 let result=[];
 for(let offset=0;offset<100000;offset+=500){
  const url='https://uulsxmdycbihwkbftcdv.supabase.co/rest/v1/surgeries?select=id,consultation_date,specialty,patient_name,active&active=eq.true&consultation_date=not.is.null&order=consultation_date.asc,id.asc&limit=500&offset='+offset;
  const response=await fetch(url,{headers:{apikey:'sb_publishable_odmXzemIQZwx1BxrJiUYnQ_iZfPVHlV',Authorization:'Bearer '+t}});
  if(!response.ok)throw Error('Erro ao consultar vagas: '+response.status);
  const page=await response.json();
  if(!Array.isArray(page))throw Error('Resposta inválida ao consultar vagas.');
  result.push(...page);
  if(page.length<500){rows=result;lastLoad=Date.now();return}
 }
 throw Error('Limite de paginação excedido. Dados anteriores preservados.');
}
const css=`
#jordana-cal{margin:14px 0 18px;border:1px solid #d7e1ee;border-radius:13px;background:#fbfdff;padding:15px;box-shadow:0 1px 4px #24426a13}
#jordana-cal *{box-sizing:border-box}
#jordana-cal .jc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
#jordana-cal h3{color:#153f76;font-size:17px;margin:0 0 4px}
#jordana-cal .jc-sub{font-size:12px;color:#526982}
#jordana-cal .jc-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#jordana-cal select,#jordana-cal .jc-button{border:1px solid #bbcde3;border-radius:8px;background:white;color:#1e426c;padding:8px 10px;font-size:12px;font-weight:700}
#jordana-cal .jc-month{font-weight:800;color:#193e71;font-size:15px;min-width:140px;text-align:center;text-transform:capitalize}
#jordana-cal .jc-week,#jordana-cal .jc-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}
#jordana-cal .jc-week{margin-bottom:6px}
#jordana-cal .jc-week span{text-align:center;font-size:11px;font-weight:800;color:#63758b;padding:4px}
#jordana-cal .jc-day{border:1px solid #dce4ee;background:white;text-align:left;min-height:78px;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:5px;color:#1c3352;cursor:pointer}
#jordana-cal .jc-day:hover{outline:2px solid #7baedc}
#jordana-cal .jc-day.jc-selected{outline:3px solid #1c6ab8}
#jordana-cal .jc-day.jc-outside{opacity:.32;cursor:default}
#jordana-cal .jc-day.jc-past{opacity:.7}
#jordana-cal .jc-day.jc-available{background:#eaf8f1;border-color:#a0d7b6}
#jordana-cal .jc-day.jc-partial{background:#fff6da;border-color:#e5cb83}
#jordana-cal .jc-day.jc-full{background:#ffebeb;border-color:#e4a5a5}
#jordana-cal .jc-day.jc-no-limit{background:#f2f6fb;border-color:#d4deea}
#jordana-cal .jc-date{font-size:14px;font-weight:900}
#jordana-cal .jc-meta{font-size:11px;line-height:1.3}
#jordana-cal .jc-lbl{font-size:11px;font-weight:800}
#jordana-cal .jc-foot{display:flex;flex-wrap:wrap;gap:13px;margin-top:11px;font-size:11px;color:#54657b}
#jordana-cal .jc-dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:middle}
#jordana-cal .jc-detail{border:1px solid #d6e4f2;border-radius:9px;padding:12px;background:white;margin-top:12px;font-size:12px;line-height:1.7}
#jordana-cal .jc-note{font-size:11px;color:#627389;margin-top:9px}
@media(max-width:700px){#jordana-cal{padding:9px}#jordana-cal .jc-day{padding:4px;min-height:69px}#jordana-cal .jc-date{font-size:12px}#jordana-cal .jc-meta,#jordana-cal .jc-lbl{font-size:9px}#jordana-cal .jc-week,#jordana-cal .jc-days{gap:2px}}
@media print{#jordana-cal .jc-bar,#jordana-cal .jc-foot{display:none!important}#jordana-cal{break-inside:avoid}#jordana-cal .jc-day{min-height:65px}}
`;
let el=document.createElement('style');el.id='jordana-cal-css';el.textContent=css;document.head.appendChild(el);
function countLabel(info){
 if(info.remaining==null)return info.relevant?info.relevant+' marcada(s)':'Sem agendamento';
 return info.remaining>0?info.remaining+' vaga(s) livre(s)':'Lotado';
}
function html(){
 const monthName=new Date(year,month,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const first=new Date(year,month,1).getDay();
 const days=new Date(year,month+1,0).getDate();
 let daysHtml='';
 for(let i=0;i<42;i++){
  const dateNum=i-first+1;
  if(dateNum<1||dateNum>days){daysHtml+='<div class="jc-day jc-outside" aria-hidden="true"></div>';continue}
  const dt=iso(year,month+1,dateNum),inf=status(dt,selectedMode);
  const label=inf.remaining==null?'Sem limite definido':inf.remaining<=0?'Lotado':inf.relevant?'Parcialmente ocupado':'Disponível';
  daysHtml+='<button type="button" data-jc-date="'+dt+'" class="jc-day jc-'+inf.state+(dt===selectedDate?' jc-selected':'')+(dt<today()?' jc-past':'')+'" title="'+label+' — '+inf.relevant+' consultas" aria-label="'+dateBR(dt)+': '+label+'">'
   +'<span class="jc-date">'+dateNum+'</span><span class="jc-meta">'+inf.relevant+' agendada(s)</span><span class="jc-lbl">'+(inf.remaining==null?'Sem limite':countLabel(inf))+'</span></button>';
 }
 const detail=selectedDate?status(selectedDate,selectedMode):null;
 return '<div class="jc-head"><div><h3>📅 Calendário de disponibilidade — Consultas</h3><div class="jc-sub">Ocupação real da agenda e vagas segundo as regras de cada especialidade</div></div><div class="jc-bar">'
  +'<label style="font-size:12px">Visualizar <select id="jc-mode"><option value="geral">Agenda geral</option><option value="ortopedia">Ortopedia</option><option value="urologia">Urologia</option></select></label>'
  +'<button type="button" class="jc-button" id="jc-prev" aria-label="Mês anterior">‹</button><span class="jc-month">'+monthName+'</span><button type="button" class="jc-button" id="jc-next" aria-label="Mês seguinte">›</button><button type="button" class="jc-button" id="jc-today">Hoje</button><button type="button" class="jc-button" id="jc-update">Atualizar vagas</button></div></div>'
  +'<div class="jc-week">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="jc-days">'+daysHtml+'</div>'
  +'<div class="jc-foot"><span><i class="jc-dot" style="background:#a3dac0"></i>Disponível</span><span><i class="jc-dot" style="background:#ebcb74"></i>Parcialmente ocupado</span><span><i class="jc-dot" style="background:#e9aaaa"></i>Lotado</span><span><i class="jc-dot" style="background:#dae4f0"></i>Sem limite configurado</span></div>'
  +(selectedDate?'<div class="jc-detail"><b>📍 '+dateBR(selectedDate)+'</b> · '+detail.relevant+' consulta(s) '+(selectedMode==='geral'?'na agenda geral':'de '+(selectedMode==='ortopedia'?'Ortopedia':'Urologia'))+' · '+(detail.remaining==null?'Sem capacidade máxima configurada para a seleção nesse dia.':Math.max(0,detail.remaining)+' vaga(s) disponíveis')+'<div>'+detail.details.map(r=>r.label+': <b>'+r.used+'/'+r.max+'</b>').join(' · ')+'</div><button type="button" class="jc-button" id="jc-filter-date">Visualizar consultas deste dia</button></div>':'')
  +'<div class="jc-note">Terça: 10 consultas no total. Quarta: 7 vagas para Ortopedia. Urologia: 2 vagas por dia útil. Nos demais dias/especialidades sem regra, o sistema não presume uma capacidade máxima. A atualização não modifica nenhum agendamento.</div>'
  +(error?'<div class="jc-detail" style="color:#a42318">Não foi possível atualizar vagas: '+String(error).replace(/</g,'&lt;')+'. Dados anteriores preservados.</div>':'');
}
function redraw(){
 const e=document.getElementById('jordana-cal');
 if(!e||S.view!=='consulta_preop')return;
 e.innerHTML=html();
 e.querySelector('#jc-mode').value=selectedMode;
 e.querySelector('#jc-mode').onchange=x=>{selectedMode=x.target.value;redraw()};
 e.querySelector('#jc-prev').onclick=()=>{month--;if(month<0){year--;month=11}selectedDate='';redraw()};
 e.querySelector('#jc-next').onclick=()=>{month++;if(month>11){year++;month=0}selectedDate='';redraw()};
 e.querySelector('#jc-today').onclick=()=>{const d=new Date();year=d.getFullYear();month=d.getMonth();selectedDate=today();redraw()};
 e.querySelector('#jc-update').onclick=refresh;
 e.querySelectorAll('[data-jc-date]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.jcDate;redraw()});
 if(selectedDate){
  e.querySelector('#jc-filter-date').onclick=()=>{
   const f=document.getElementById('gfDateFrom'),t=document.getElementById('gfDateTo'),single=document.getElementById('gfDate');
   if(f&&t){f.value=selectedDate;t.value=selectedDate;f.dispatchEvent(new Event('change',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}))}
   else if(single){single.value=selectedDate;single.dispatchEvent(new Event('change',{bubbles:true}))}
   else {alert('Dia selecionado: '+dateBR(selectedDate)+'. Utilize os filtros de data da consulta para ver os pacientes.');return}
   if(typeof renderConsult==='function')renderConsult();
  }
 }
}
function mount(){
 if(typeof S==='undefined'||S.view!=='consulta_preop')return;
 const card=document.querySelector('#content section.card');
 if(!card)return;
 let box=card.querySelector('#jordana-cal');
 if(!box){
  box=document.createElement('section');box.id='jordana-cal';
  const anchor=card.querySelector('.consult-filters');
  if(anchor)anchor.insertAdjacentElement('afterend',box);else card.querySelector('.section-head')?.insertAdjacentElement('afterend',box);
 }
 redraw();
 if(!lastLoad&&!calendarBusy&&Date.now()-lastAttempt>15000)refresh();
}
async function refresh(){
 if(calendarBusy)return;calendarBusy=true;lastAttempt=Date.now();
 try{await fetchRows();error=''}catch(e){error=e.message||String(e)}
 finally{calendarBusy=false;mount()}
}
function install(){
 if(typeof S==='undefined'||typeof renderConsult!=='function')return false;
 if(window.__jordanaCalendarWrap)return true;
 window.__jordanaCalendarWrap=true;
 const old=window.renderConsult;
 window.renderConsult=function(){const value=old.apply(this,arguments);mount();return value};
 const oldCurrent=window.renderCurrent;
 window.renderCurrent=function(){const result=oldCurrent.apply(this,arguments);if(S.view==='consulta_preop')mount();return result};
 if(S.view==='consulta_preop')mount();
 if(localStorage.getItem('sb_access_token'))refresh();
 setInterval(()=>{if(S.view==='consulta_preop'&&Date.now()-lastLoad>60000)refresh()},60000);
 return true;
}
let n=0;const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},200);install();
})();