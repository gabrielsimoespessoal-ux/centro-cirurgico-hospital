(()=>{
'use strict';
if(window.__hsjSuspensaoMapaObrigatoria20261105)return;
window.__hsjSuspensaoMapaObrigatoria20261105=true;
const UUID=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const destinations={enfermeiro:'Monitoramento Enfermeiro',supervisao:'Monitoramento Supervisão',administrativo:'Monitoramento Administrativo'};
let submitting=false,events=[],loaded=false;
const dateBR=s=>{const t=String(s||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(t)?t.split('-').reverse().join('/'):t||'—'};
function openSuspension(id){
 const x=(S.rows||[]).find(p=>String(p.id)===String(id));
 if(!x)return alert('Paciente não encontrado. Atualize o mapa.');
 if(x.stage!=='mapa_cirurgico')return alert('Paciente não está mais no mapa cirúrgico. Atualize a tela.');
 const html='<div class="back"><div class="modal" style="max-width:700px"><div class="mh"><b>⚠ Registrar cirurgia suspensa</b><button class="btn" type="button" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div>'+
 '<div class="mb"><div class="notice"><b>'+safe(x.patient_name)+'</b><div>Cirurgia: '+safe(dateBR(x.surgery_date))+' · '+safe(x.procedure_name||'')+'</div><small>O motivo e a equipe de monitoramento são obrigatórios. A operação só será concluída quando o encaminhamento também for salvo.</small></div>'+
 '<div class="field"><label>Motivo da suspensão *</label><textarea rows="4" id="hsjSuspReason" placeholder="Descreva objetivamente o motivo (ex.: falta de anestesista)" maxlength="2000"></textarea></div>'+
 '<div class="field"><label>Encaminhar obrigatoriamente para *</label><select id="hsjSuspMonitor"><option value="">Selecione a equipe responsável</option>'+
 Object.entries(destinations).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></div></div>'+
 '<div class="mf"><button class="btn primary" id="hsjSuspSave" type="button">Confirmar suspensão e encaminhar</button></div></div></div>';
 document.getElementById('modal').innerHTML=html;
 document.getElementById('hsjSuspSave').onclick=()=>saveSuspension(id,x.updated_at);
}
async function saveSuspension(id,expected){
 const reason=document.getElementById('hsjSuspReason')?.value.trim(),dest=document.getElementById('hsjSuspMonitor')?.value;
 if(!reason||reason.length<3)return alert('Informe obrigatoriamente o motivo da suspensão.');
 if(!destinations[dest])return alert('Selecione Enfermeiro, Supervisão ou Administrativo.');
 if(submitting)return;
 if(!confirm('Confirmar suspensão e encaminhar o paciente ao '+destinations[dest]+'? A ocorrência ficará registrada no relatório.'))return;
 submitting=true;const b=document.getElementById('hsjSuspSave');if(b)b.disabled=true;
 try{
  const out=await api('/rest/v1/rpc/hsj_suspender_cirurgia_mapa',{method:'POST',body:JSON.stringify({p_surgery_id:id,p_reason:reason,p_destination:dest,p_expected_updated_at:expected})});
  if(!out)throw Error('O banco não retornou confirmação do encaminhamento.');
  document.getElementById('modal').innerHTML='';
  await load();renderCurrent();
  alert('Cirurgia suspensa registrada e encaminhada para '+destinations[dest]+'. O paciente saiu do Mapa e a ocorrência foi incluída no relatório.');
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
 document.getElementById('hsjSuspPrint').onclick=()=>window.print();
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
function drawRows(){
 const target=document.getElementById('hsjSuspRows');if(!target||S.view!=='suspensas'||!loaded)return;
 const rows=filteredEvents();
 const header='<table class="table"><thead><tr><th>Data da suspensão</th><th>Paciente</th><th>Data prevista</th><th>Procedimento</th><th>Especialidade</th><th>Médico</th><th>Motivo obrigatório</th><th>Monitoramento</th></tr></thead><tbody>';
 target.innerHTML='<div class="notice"><b>Total de suspensões no filtro: '+rows.length+'</b>. Cada ocorrência permanece registrada mesmo após o paciente avançar para outra etapa.</div><div class="tablewrap">'+header+
 (rows.map(r=>{const p=S.rows.find(x=>x.id===r.surgery_id)||{};return '<tr><td>'+safe(new Date(r.suspended_at).toLocaleString('pt-BR'))+'</td><td>'+safe(p.patient_name||'Cadastro indisponível')+'</td><td>'+safe(dateBR(r.surgery_date))+'</td><td>'+safe(p.procedure_name||'—')+'</td><td>'+safe(p.specialty||'—')+'</td><td>'+safe(p.surgeon||'—')+'</td><td>'+safe(r.reason)+'</td><td>'+safe(destinations[r.destination]||r.destination)+'</td></tr>'}).join('')||'<tr><td colspan="8">Nenhuma cirurgia suspensa registrada no período.</td></tr>')+'</tbody></table></div>';
}
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
     if(option.textContent!=='Cirurgias Suspensas (Indicadores) — somente relatório')option.textContent='Cirurgias Suspensas (Indicadores) — somente relatório';
     option.disabled=true;
     if(option.selected)select.value='';
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
if(typeof oldConfirm==='function')window.hsjConfirmarEtapaV26=function(){
 if(document.getElementById('hsjStageV26')?.value==='suspensas')return alert('Cirurgias Suspensas (Indicadores) é apenas um relatório. Use a ação Cirurgia suspensa no Mapa Cirúrgico.');
 return oldConfirm.apply(this,arguments);
};
const oldAdminConfirm=window.hsjConcluirAdminV26;
if(typeof oldAdminConfirm==='function')window.hsjConcluirAdminV26=function(){
 if(document.getElementById('hsjAdminReturnV26')?.value==='suspensas')return alert('A aba Cirurgias Suspensas (Indicadores) não recebe pacientes.');
 return oldAdminConfirm.apply(this,arguments);
};
const modalTarget=document.getElementById('modal');
if(modalTarget)new MutationObserver(renameSuspensionUI).observe(modalTarget,{childList:true,subtree:true});
renameSuspensionUI();

})();