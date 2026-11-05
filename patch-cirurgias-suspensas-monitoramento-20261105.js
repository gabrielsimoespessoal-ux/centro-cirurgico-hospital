(()=>{
'use strict';
if(window.__hsjSuspensaoMapaObrigatoria20261105)return;
window.__hsjSuspensaoMapaObrigatoria20261105=true;
const UUID=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const destinations={enfermeiro:'Monitoramento Enfermeiro',supervisao:'Monitoramento Supervisão',administrativo:'Monitoramento Administrativo'};
let submitting=false,events=[],loaded=false;
const hsjSuspensionPreflight=new Map();
const dateBR=s=>{const t=String(s||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(t)?t.split('-').reverse().join('/'):t||'—'};
function openSuspension(id){
 const x=(S.rows||[]).find(p=>String(p.id)===String(id));
 if(!x)return alert('Paciente não encontrado. Atualize o mapa.');
 if(['concluida','realizadas'].includes(x.stage))return alert('Paciente finalizado. Confira o cadastro antes de registrar a suspensão.');
 const html='<div class="back"><div class="modal" style="max-width:700px"><div class="mh"><b>⚠ Registrar cirurgia suspensa</b><button class="btn" type="button" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div>'+
 '<div class="mb"><div class="notice"><b>'+safe(x.patient_name)+'</b><div>Cirurgia: '+safe(dateBR(x.surgery_date))+' · '+safe(x.procedure_name||'')+'</div><small>O motivo e a equipe de monitoramento são obrigatórios. A operação só será concluída quando o encaminhamento também for salvo.</small></div>'+
 '<div class="field"><label>Data prevista da cirurgia *</label><input id="hsjSuspDate" type="date" required value="'+safe(String(x.surgery_date||'').slice(0,10))+'"><small>Informe a data em que a cirurgia estava programada para ocorrer.</small></div>'+
 '<div class="field"><label>Motivo da suspensão *</label><textarea rows="4" id="hsjSuspReason" placeholder="Descreva objetivamente o motivo (ex.: falta de anestesista)" maxlength="2000"></textarea></div>'+
 '<div class="field"><label>Encaminhar obrigatoriamente para *</label><select id="hsjSuspMonitor" disabled><option value="">Conferindo monitoramentos...</option>'+
 Object.entries(destinations).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select><div id="hsjSuspPendingInfo" class="sub" role="status" style="margin-top:7px;color:#785b1c">Verificando encaminhamentos abertos para evitar duplicidade...</div></div></div>'+
 '<div class="mf"><button class="btn primary" id="hsjSuspSave" type="button">Confirmar suspensão e encaminhar</button></div></div></div>';
 document.getElementById('modal').innerHTML=html;
 const save=document.getElementById('hsjSuspSave');save.disabled=true;
 save.onclick=()=>saveSuspension(id,x.updated_at);
 checkSuspensionPending(id);
}
async function checkSuspensionPending(id){
 const select=document.getElementById('hsjSuspMonitor'),note=document.getElementById('hsjSuspPendingInfo'),save=document.getElementById('hsjSuspSave');
 if(!select||!note||!save)return;
 hsjSuspensionPreflight.set(id,{ready:false});
 try{
  const paths=[
   '/rest/v1/supervision_referrals?select=id,reason&status=eq.aguardando&surgery_id=eq.'+encodeURIComponent(id),
   '/rest/v1/administrative_referrals?select=id,reason&status=eq.aguardando&surgery_id=eq.'+encodeURIComponent(id),
   '/rest/v1/monitoring_claims_hsj?select=id,reason,monitor_type&status=eq.aguardando&surgery_id=eq.'+encodeURIComponent(id)
  ];
  const [supervision,administrative,claims]=await Promise.all(paths.map(p=>api(p)));
  if(!select.isConnected)return;
  const pendings=[
   ...(supervision||[]).map(x=>({...x,type:'supervisao'})),
   ...(administrative||[]).map(x=>({...x,type:'administrativo'})),
   ...(claims||[]).map(x=>({...x,type:x.monitor_type}))
  ];
  if(pendings.length>1){
   note.textContent='⚠ Este paciente já possui '+pendings.length+' encaminhamentos aguardando. Regularize as pendências antes de registrar uma nova suspensão.';
   hsjSuspensionPreflight.set(id,{ready:false});return;
  }
  const existing=pendings[0];
  select.disabled=false;
  if(existing){
   select.value=existing.type;
   for(const option of select.options)option.disabled=Boolean(option.value&&option.value!==existing.type);
   note.textContent='⚠ Já existe encaminhamento aberto em '+(destinations[existing.type]||existing.type)+'. A suspensão poderá ser registrada nessa equipe, preservando o encaminhamento anterior e sem gerar outro. Para mudar de equipe, conclua ou redirecione primeiro a pendência existente.';
  }else{
   for(const option of select.options)option.disabled=false;
   select.value='';
   note.textContent='Nenhum encaminhamento pendente. Escolha a equipe que acompanhará esta suspensão.';
  }
  hsjSuspensionPreflight.set(id,{ready:true,type:existing?.type||null});
  save.disabled=false;
 }catch(err){
  if(!note.isConnected)return;
  note.textContent='Falha ao consultar monitoramentos: '+err.message+'. Não é seguro registrar a suspensão antes de conferir a pendência.';
  hsjSuspensionPreflight.set(id,{ready:false});
 }
}
async function saveSuspension(id,expected){
 const reason=document.getElementById('hsjSuspReason')?.value.trim(),dest=document.getElementById('hsjSuspMonitor')?.value,plannedDate=document.getElementById('hsjSuspDate')?.value;
 const preflight=hsjSuspensionPreflight.get(id);
 if(!preflight?.ready)return alert('É necessário conferir primeiro os encaminhamentos existentes.');
 if(preflight.type&&dest!==preflight.type)return alert('Este paciente já possui monitoramento aberto em '+(destinations[preflight.type]||preflight.type)+'. Selecione essa equipe.');
 if(!plannedDate||!/^\d{4}-\d{2}-\d{2}$/.test(plannedDate))return alert('Informe obrigatoriamente a data prevista da cirurgia.');
 if(!reason||reason.length<3)return alert('Informe obrigatoriamente o motivo da suspensão.');
 if(!destinations[dest])return alert('Selecione Enfermeiro, Supervisão ou Administrativo.');
 if(submitting)return;
 if(!confirm('Confirmar suspensão da cirurgia prevista para '+dateBR(plannedDate)+' e encaminhar o paciente ao '+destinations[dest]+'? A ocorrência ficará registrada no relatório.'))return;
 submitting=true;const b=document.getElementById('hsjSuspSave');if(b)b.disabled=true;
 try{
  const out=await api('/rest/v1/rpc/hsj_suspender_cirurgia_mapa',{method:'POST',body:JSON.stringify({p_surgery_id:id,p_reason:reason,p_destination:dest,p_expected_updated_at:expected,p_surgery_date:plannedDate})});
  if(!out)throw Error('O banco não retornou confirmação do encaminhamento.');
  document.getElementById('modal').innerHTML='';
  await load();renderCurrent();
  alert('Suspensão registrada no relatório e vinculada ao '+destinations[dest]+'. O cadastro permanece na Fila de Cirurgia.');
 }catch(e){alert('Suspensão NÃO concluída: '+e.message+'. Confira os dados antes de repetir.')}
 finally{submitting=false;if(b)b.disabled=false}
}
window.hsjOpenSuspensaoMapa20261105=openSuspension;
window.suspendPatient=function(id){openSuspension(id)};
function addButtons(){
 if(S.view!=='mapa_cirurgico')return;
 const root=document.getElementById('content');if(!root)return;
 for(const b of root.querySelectorAll('button[onclick*="editMapPatient("],button[onclick*="hsjMarcarCirurgiaRealizada"]')){
  const id=(b.getAttribute('onclick')||'').match(UUID)?.[0];
  if(!id)continue;
  const x=S.rows.find(p=>p.id===id);
  if(!x||x.stage!=='mapa_cirurgico')continue;
  const group=b.closest('td')||b.parentElement;
  if(!group||group.querySelector('[data-hsj-suspensao-id="'+id+'"]'))continue;
  const btn=document.createElement('button');btn.type='button';btn.className='btn small';
  btn.dataset.hsjSuspensaoId=id;btn.textContent='⚠ Cirurgia suspensa';
  btn.style.cssText='margin:3px;background:#b42318;color:white;border:1px solid #a02016;font-weight:bold';
  btn.onclick=()=>openSuspension(id);group.append(' ',btn);
 }
}
async function loadEvents(){
 try{const r=await api('/rest/v1/surgery_suspension_events_hsj?select=*&order=suspended_at.desc&limit=5000');events=Array.isArray(r)?r:[];loaded=true}
 catch(e){loaded=false;const el=document.getElementById('hsjSuspRows');if(el)el.textContent='Não foi possível carregar o relatório: '+e.message}
}
function renderReport(){
 const root=document.getElementById('content');if(!root)return;
 root.innerHTML='<section class="card"><div class="section-head"><div><h2>📊 Relatório de Cirurgias Suspensas</h2><div class="sub">Histórico de ocorrências — não é uma etapa de permanência do paciente</div></div><div><button type="button" class="btn" id="hsjSuspReload">↻ Atualizar</button> <button type="button" class="btn" id="hsjSuspCsv">⬇ Excel (CSV)</button> <button type="button" class="btn" id="hsjSuspPrint">🖨 Imprimir</button></div></div>'+
 '<div class="filters" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px"><label>De <input type="date" id="hsjSuspFrom"></label><label>Até <input type="date" id="hsjSuspTo"></label><input id="hsjSuspSearch" placeholder="Paciente, médico, especialidade ou motivo" style="min-width:280px"></div>'+
 '<div id="hsjSuspRows">Carregando histórico...</div></section>';
 document.getElementById('hsjSuspReload').onclick=async()=>{loaded=false;await loadEvents();if(S.view==='suspensas')drawRows()};
 document.getElementById('hsjSuspCsv').onclick=()=>downloadReport();
 document.getElementById('hsjSuspPrint').onclick=printSuspensionReport;
 for(const k of ['hsjSuspFrom','hsjSuspTo','hsjSuspSearch'])document.getElementById(k).addEventListener('input',drawRows);
 if(loaded)drawRows();else loadEvents().then(()=>{if(S.view==='suspensas')drawRows()});
}
function filteredEvents(){
 const start=document.getElementById('hsjSuspFrom')?.value||'',end=document.getElementById('hsjSuspTo')?.value||'',
 q=(document.getElementById('hsjSuspSearch')?.value||'').toLowerCase();
 return events.filter(r=>{
  const d=String(r.suspended_at||'').slice(0,10),p=S.rows.find(x=>x.id===r.surgery_id)||{};
  return (!start||d>=start)&&(!end||d<=end)&&(!q||[p.patient_name,p.specialty,p.surgeon,p.procedure_name,r.reason].some(x=>String(x||'').toLowerCase().includes(q)));
 });
}
function summarizeSuspensions(rows){
 const tally=fn=>{const m=new Map();for(const r of rows){const k=String(fn(r)||'Não informado').trim()||'Não informado';m.set(k,(m.get(k)||0)+1)}return [...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'))};
 const reasons=tally(r=>r.reason),destinationsCount=tally(r=>destinations[r.destination]||r.destination);
 const specialty=tally(r=>S.rows.find(p=>p.id===r.surgery_id)?.specialty);
 const dates=rows.map(r=>String(r.suspended_at||'').slice(0,10)).filter(Boolean).sort();
 return {total:rows.length,reasons,destinationsCount,specialty,first:dates[0],last:dates[dates.length-1]};
}
function summaryMarkup(summary){
 const grid=(name,items)=>'<div class="hsj-susp-summary-card"><b>'+safe(name)+'</b>'+
 (items.length?items.map(([key,n])=>'<div class="hsj-susp-summary-entry"><span>'+safe(key)+'</span><strong>'+n+'</strong></div>').join(''):'<p>Sem ocorrências.</p>')+'</div>';
 return '<section id="hsjSuspSummary"><h3>Resumo das suspensões</h3>'+
 '<div class="hsj-susp-summary-kpis"><div><strong>'+summary.total+'</strong><span>Cirurgias suspensas</span></div><div><strong>'+summary.reasons.length+'</strong><span>Motivos registrados</span></div><div><strong>'+summary.specialty.length+'</strong><span>Especialidades</span></div></div>'+
 '<div class="hsj-susp-summary-grid">'+grid('Por especialidade',summary.specialty)+grid('Encaminhamentos',summary.destinationsCount)+'</div></section>';
}
function reportTable(rows){
 const header='<table class="table"><thead><tr><th>Data da suspensão</th><th>Paciente</th><th>Data prevista</th><th>Procedimento</th><th>Especialidade</th><th>Médico</th><th>Motivo</th><th>Monitoramento</th></tr></thead><tbody>';
 return header+(rows.map(r=>{const p=S.rows.find(x=>x.id===r.surgery_id)||{};return '<tr><td>'+safe(new Date(r.suspended_at).toLocaleString('pt-BR'))+'</td><td>'+safe(p.patient_name||'Cadastro indisponível')+'</td><td>'+safe(dateBR(r.surgery_date))+'</td><td>'+safe(p.procedure_name||'—')+'</td><td>'+safe(p.specialty||'—')+'</td><td>'+safe(p.surgeon||'—')+'</td><td>'+safe(r.reason)+'</td><td>'+safe(destinations[r.destination]||r.destination)+'</td></tr>'}).join('')||'<tr><td colspan="8">Nenhuma cirurgia suspensa registrada no período.</td></tr>')+'</tbody></table>';
}
function drawRows(){
 const target=document.getElementById('hsjSuspRows');if(!target||S.view!=='suspensas'||!loaded)return;
 const rows=filteredEvents(),summary=summarizeSuspensions(rows);
 target.innerHTML=summaryMarkup(summary)+'<h3 class="hsj-susp-detail-heading">Relação detalhada das suspensões</h3><div class="tablewrap">'+reportTable(rows)+'</div>';
}
function printSuspensionReport(){
 if(!loaded)return alert('O relatório ainda está carregando. Atualize os indicadores antes de imprimir.');
 const rows=filteredEvents(),summary=summarizeSuspensions(rows);
 const from=document.getElementById('hsjSuspFrom')?.value||'',to=document.getElementById('hsjSuspTo')?.value||'';
 const range=from||to?('Período do filtro: '+(from?dateBR(from):'Início')+' até '+(to?dateBR(to):'Hoje')):'Todas as datas';
 const w=window.open('','_blank');
 if(!w)return alert('Permita abrir janelas para imprimir o relatório de suspensões.');
 const css='@page{size:A4 landscape;margin:10mm}body{font-family:Arial,Helvetica,sans-serif;color:#1c2f43;font-size:10px;margin:12px}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin-top:16px}.hsj-susp-summary-kpis{display:flex;gap:10px;margin:10px 0}.hsj-susp-summary-kpis>div{flex:1;border:1px solid #bdcddd;padding:10px}.hsj-susp-summary-kpis strong{display:block;font-size:19px}.hsj-susp-summary-kpis span{display:block}.hsj-susp-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.hsj-susp-summary-card{border:1px solid #bdcddd;padding:10px;break-inside:avoid}.hsj-susp-summary-entry{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #e3e8ed;padding:4px 0}.hsj-susp-summary-entry span{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:9px}th,td{border:1px solid #b8c6d6;padding:6px 4px;vertical-align:top;overflow-wrap:anywhere}th{background:#e8eef5;text-align:left}tr{break-inside:avoid}thead{display:table-header-group}h3{font-size:13px}';
 w.document.open();w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Cirurgias Suspensas</title><style>'+css+'</style></head><body><h1>Hospital São José — Cirurgias Suspensas (Indicadores)</h1><p>'+safe(range)+' · Total de ocorrências: '+rows.length+'</p>'+summaryMarkup(summary)+'<h2>Relação detalhada das suspensões</h2>'+reportTable(rows)+'</body></html>');w.document.close();w.focus();w.print();
}
const reportStyles=document.createElement('style');
reportStyles.textContent='#hsjSuspSummary{margin:14px 0}.hsj-susp-summary-kpis{display:flex;gap:10px;margin:10px 0}.hsj-susp-summary-kpis>div{flex:1;border:1px solid #c9d7e7;border-radius:7px;padding:12px;background:#f4f8fe}.hsj-susp-summary-kpis strong{display:block;font-size:23px}.hsj-susp-summary-kpis span{font-size:11px}.hsj-susp-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.hsj-susp-summary-card{padding:12px;border:1px solid #c9d7e7;border-radius:7px}.hsj-susp-summary-entry{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #e5edf4;padding:6px 0;font-size:12px}.hsj-susp-summary-entry span{overflow-wrap:anywhere}.hsj-susp-detail-heading{margin-top:16px}@media(max-width:680px){.hsj-susp-summary-grid{grid-template-columns:1fr}}';
document.head.appendChild(reportStyles);
function downloadReport(){
 const cols=['Data da suspensão','Paciente','IDS','Data da cirurgia','Procedimento','Especialidade','Médico','Motivo','Monitoramento'];
 const data=filteredEvents().map(r=>{const p=S.rows.find(x=>x.id===r.surgery_id)||{};return [new Date(r.suspended_at).toLocaleString('pt-BR'),p.patient_name||'',p.ids||'',dateBR(r.surgery_date),p.procedure_name||'',p.specialty||'',p.surgeon||'',r.reason,destinations[r.destination]||r.destination]});
 if(typeof window.downloadCsv==='function')return window.downloadCsv('relatorio_cirurgias_suspensas.csv',[cols,...data]);
 alert('Exportação CSV indisponível.');
}
const previousRender=window.renderCurrent;
window.renderCurrent=function(){if(S.view==='suspensas')return renderReport();const result=previousRender.apply(this,arguments);if(S.view==='mapa_cirurgico')queueMicrotask(addButtons);return result};
const obs=new MutationObserver(()=>{if(S.view==='mapa_cirurgico')addButtons()});
const root=document.getElementById('content');
if(root)obs.observe(root,{childList:true,subtree:true});
if(S.view==='suspensas')renderReport();else if(S.view==='mapa_cirurgico')addButtons();
/* Nomenclatura padronizada; indicadores nunca são destinos operacionais. */
labels.suspensas='Cirurgias Suspensas (Indicadores)';
function renameSuspensionUI(){
 const tabs=document.getElementById('tabs');
 if(tabs){
  for(const b of tabs.querySelectorAll('button')){
   const onclick=b.getAttribute('onclick')||'';
   if(onclick.includes("setView('suspensas'"))if(b.textContent!=='Cirurgias Suspensas (Indicadores)')b.textContent='Cirurgias Suspensas (Indicadores)';
  }
 }
 const modal=document.getElementById('modal');
 if(modal){
  for(const select of modal.querySelectorAll('select')){
   for(const option of select.options){
    if(option.value==='suspensas'){
     if(option.textContent!=='Cirurgias Suspensas (Indicadores)')option.textContent='Cirurgias Suspensas (Indicadores)';
     if(option.disabled)option.disabled=false;
    }
   }
  }
 }
}
const oldTabs=window.renderTabs;
window.renderTabs=function(){const result=oldTabs.apply(this,arguments);renameSuspensionUI();return result};
const oldChoose=window.hsjEscolherEtapaV26;
if(typeof oldChoose==='function')window.hsjEscolherEtapaV26=function(){const result=oldChoose.apply(this,arguments);renameSuspensionUI();return result};
const oldConfirm=window.hsjConfirmarEtapaV26;
if(typeof oldConfirm==='function')window.hsjConfirmarEtapaV26=function(id){
 if(document.getElementById('hsjStageV26')?.value==='suspensas')return openSuspension(id);
 return oldConfirm.apply(this,arguments);
};
const oldAdminConfirm=window.hsjConcluirAdminV26;
if(typeof oldAdminConfirm==='function')window.hsjConcluirAdminV26=function(){
 if(document.getElementById('hsjAdminReturnV26')?.value==='suspensas')return alert('Para registrar uma suspensão, use Escolher etapa e selecione Cirurgias Suspensas (Indicadores), com motivo e monitoramento obrigatórios.');
 return oldAdminConfirm.apply(this,arguments);
};
const modalTarget=document.getElementById('modal');
if(modalTarget)new MutationObserver(renameSuspensionUI).observe(modalTarget,{childList:true,subtree:true});
renameSuspensionUI();

})();