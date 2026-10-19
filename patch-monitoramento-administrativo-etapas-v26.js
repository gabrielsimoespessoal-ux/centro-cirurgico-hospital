(()=>{
if(window.__hsjMonitorAdministrativoV26)return;window.__hsjMonitorAdministrativoV26=true;
const adminStage='monitoramento_administrativo';
const stageOptions=['fila','consulta_preop','exames','recebimento_nir','programacao','entrevista_tecnico','avaliacao_enfermeiro','mapa_cirurgico','pos_operatorio','concluida','suspensas'];
labels.supervisao='Monitoramento Supervisão';
labels.avaliacao_enfermeiro='Monitoramento Enfermeiro';
labels[adminStage]='Monitoramento Administrativo';
let adminRows=[],saving=false;
const asText=x=>esc(String(x??''));
const loadAdmin=async()=>{try{const rows=await api('/rest/v1/administrative_referrals?select=*&order=created_at.desc&limit=3000');adminRows=Array.isArray(rows)?rows:[]}catch(e){console.warn('Monitoramento administrativo indisponível',e);adminRows=[]}};
const oldLoad=window.load;
window.load=async function(){const out=await oldLoad.apply(this,arguments);await loadAdmin();return out};
const oldTabs=window.renderTabs;
window.renderTabs=function(){
 oldTabs.apply(this,arguments);
 const tabs=document.getElementById('tabs');if(!tabs)return;
 let admin=tabs.querySelector('[data-admin-monitor]');
 if(!admin){admin=document.createElement('button');admin.className='tab';admin.dataset.adminMonitor='1';admin.onclick=()=>{S.view=adminStage;renderTabs();renderCurrent()};tabs.appendChild(admin)}
 admin.textContent='Monitoramento Administrativo';
 const nurse=[...tabs.querySelectorAll('.tab')].find(b=>(b.getAttribute('onclick')||'').includes('avaliacao_enfermeiro')||b.textContent.includes('Avaliação Enfermeiro')||b.textContent.includes('Monitoramento Enfermeiro'));
 const supervisor=tabs.querySelector('[data-supervisao]');
 if(nurse){nurse.textContent='Monitoramento Enfermeiro';tabs.appendChild(nurse)}
 if(supervisor){supervisor.textContent='Monitoramento Supervisão';tabs.appendChild(supervisor)}
 tabs.appendChild(admin);
 tabs.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b===admin?S.view===adminStage:b!==admin&&b.textContent===labels[S.view]));
};
const oldRender=window.renderCurrent;
window.renderCurrent=function(){if(S.view===adminStage)return window.hsjRenderAdminMonitorV26();return oldRender.apply(this,arguments)};
const oldReferral=window.openReferralV18;
window.openReferralV18=function(id,target='supervisao'){
 if(target!=='administrativo'){
  oldReferral.apply(this,arguments);
  const select=document.getElementById('refTargetV18');
  if(select&&!select.querySelector('option[value="administrativo"]')){const option=document.createElement('option');option.value='administrativo';option.textContent='Monitoramento Administrativo';select.add(option)}
  return;
 }
 const x=S.rows.find(r=>r.id===id);if(!x)return;
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal" style="max-width:680px"><div class="mh"><b>📨 Monitoramento Administrativo — '+asText(x.patient_name)+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><div class="field"><label>Justificativa obrigatória *</label><textarea id="hsjAdminReasonV26" rows="5" placeholder="Descreva o motivo do encaminhamento"></textarea></div><div class="notice">O paciente permanecerá na etapa atual até decisão expressa de movimentação.</div></div><div class="mf"><button class="btn primary" onclick="hsjSalvarAdminV26(\''+id+'\')">Encaminhar ao Monitoramento Administrativo</button></div></div></div>';
};
const oldSaveReferral=window.saveReferralV18;
window.saveReferralV18=async function(id){
 if(document.getElementById('refTargetV18')?.value!=='administrativo')return oldSaveReferral.apply(this,arguments);
 const reason=document.getElementById('refReasonV18')?.value?.trim();
 if(!reason)return alert('A justificativa escrita é obrigatória.');
 return window.hsjSalvarAdminV26(id,reason);
};
window.hsjSalvarAdminV26=async function(id,reason){
 const x=S.rows.find(r=>r.id===id);
 reason=reason||document.getElementById('hsjAdminReasonV26')?.value?.trim();
 if(!x||!reason)return alert('Informe a justificativa.');
 try{
 await api('/rest/v1/administrative_referrals',{method:'POST',body:JSON.stringify({surgery_id:id,origin_stage:x.stage,reason,created_by:uid})});
 document.getElementById('modal').innerHTML='';await loadAdmin();renderCurrent();alert('Encaminhamento registrado, sem alterar a etapa do paciente.');
 }catch(e){alert('Falha ao registrar encaminhamento: '+e.message)}
};
const oldActions=window.actionButtons;
window.actionButtons=function(x){
 const original=oldActions(x);
 return original+' <button type="button" class="btn small" onclick="openReferralV18(\''+x.id+'\',\'administrativo\')">📋 Administrativo</button>';
};
const fmt=t=>t?new Date(t).toLocaleString('pt-BR'):'—';
window.hsjRenderAdminMonitorV26=function(){
 const pending=adminRows.filter(r=>r.status==='aguardando').length;
 document.getElementById('content').innerHTML='<section class="card"><div class="section-head"><div><h2>📋 Monitoramento Administrativo</h2><div class="sub">Encaminhamentos, tratativas e devoluções com histórico preservado.</div></div></div><div class="notice"><b>'+pending+' aguardando tratativa</b> · '+(adminRows.length-pending)+' respondidos</div><div class="tablewrap"><table class="table"><thead><tr><th>PACIENTE</th><th>ETAPA DE ORIGEM</th><th>JUSTIFICATIVA</th><th>DATA</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>'+adminRows.map(r=>{const x=S.rows.find(s=>s.id===r.surgery_id);return '<tr><td><b>'+asText(x?.patient_name||'Não encontrado')+'</b></td><td>'+asText(labels[r.origin_stage]||r.origin_stage)+'</td><td>'+asText(r.reason)+'</td><td>'+asText(fmt(r.created_at))+'</td><td>'+asText(r.status==='respondido'?'✅ Respondido':'⏱ Aguardando')+(r.resolution?'<div class="sub">'+asText(r.resolution)+'</div>':'')+'</td><td>'+(r.status==='aguardando'?'<button class="btn small primary" onclick="hsjResponderAdminV26(\''+r.id+'\')">Responder / Encaminhar</button>':'')+(x?' <button class="btn small" onclick="hsjConsultarCadastroV24(\''+x.id+'\')">Consultar cadastro</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div></section>';
};
window.hsjResponderAdminV26=function(id){
 const r=adminRows.find(v=>v.id===id);if(!r||r.status!=='aguardando')return;
 const opts=stageOptions.map(s=>'<option value="'+s+'" '+(s===r.origin_stage?'selected':'')+'>'+asText(labels[s]||s)+'</option>').join('');
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal"><div class="mh"><b>Responder monitoramento administrativo</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><div class="notice">'+asText(r.reason)+'</div><div class="field"><label>Resposta obrigatória</label><textarea id="hsjAdminResolutionV26" rows="5"></textarea></div><div class="field"><label>Encaminhar para etapa</label><select id="hsjAdminReturnV26">'+opts+'</select></div></div><div class="mf"><button class="btn primary" onclick="hsjConcluirAdminV26(\''+id+'\')">Confirmar resposta</button></div></div></div>';
};
window.hsjConcluirAdminV26=async function(id){
 if(saving)return;
 const reason=document.getElementById('hsjAdminResolutionV26')?.value?.trim(),stage=document.getElementById('hsjAdminReturnV26')?.value;
 const r=adminRows.find(v=>v.id===id),x=S.rows.find(v=>v.id===r?.surgery_id);
 if(!r||!x||!reason||!stageOptions.includes(stage))return alert('Informe a resposta e a etapa de destino.');
 if(!confirm('Confirmar resposta e encaminhamento para '+(labels[stage]||stage)+'?'))return;
 saving=true;
 try{
 const record=await api('/rest/v1/administrative_referrals?id=eq.'+encodeURIComponent(id)+'&status=eq.aguardando',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'respondido',resolution:reason,return_stage:stage,resolved_at:new Date().toISOString(),resolved_by:uid})});
 if(!Array.isArray(record)||record.length!==1)throw Error('Resposta já registrada por outro usuário. Atualize.');
 if(stage!==x.stage)await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(x.id)+'&stage=eq.'+encodeURIComponent(x.stage),{method:'PATCH',body:JSON.stringify({stage,updated_by:uid})});
 document.getElementById('modal').innerHTML='';await load();renderTabs();renderCurrent();
 }catch(e){alert('Resposta registrada ou operação incompleta. Confira a situação antes de repetir: '+e.message)}
 finally{saving=false}
};
const oldNext=window.nextStage;
window.nextStage=function(id){return window.hsjEscolherEtapaV26(id)};
window.hsjEscolherEtapaV26=function(id){
 const x=S.rows.find(v=>v.id===id);if(!x)return;
 const visibleTabs=[...document.querySelectorAll('#tabs .tab')];
 const visibleStages=visibleTabs.map(b=>{
  if(b.dataset.adminMonitor!==undefined)return {stage:'administrativo',name:'Monitoramento Administrativo'};
  if(b.dataset.supervisao!==undefined)return {stage:'supervisao',name:'Monitoramento Supervisão'};
  const match=(b.getAttribute('onclick')||'').match(/setView\('([^']+)'/);
  if(!match)return null;
  return {stage:match[1],name:b.textContent.trim()};
 }).filter(v=>v&&v.name&&v.stage!=='indicadores'&&v.stage!=='suspensas');
 const options=visibleStages.map(v=>'<option value="'+v.stage+'" '+(x.stage===v.stage?'selected':'')+'>'+asText(v.name)+'</option>').join('');
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal" style="max-width:570px"><div class="mh"><b>Escolher etapa — '+asText(x.patient_name)+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><div class="field"><label>Etapa de destino</label><select id="hsjStageV26">'+options+'</select></div><div class="notice">A mudança será compartilhada com os demais computadores. Monitoramentos são encaminhamentos separados, sem retirar o paciente de sua etapa.</div></div><div class="mf"><button class="btn primary" onclick="hsjConfirmarEtapaV26(\''+id+'\')">Confirmar etapa</button></div></div></div>';
};
window.hsjConfirmarEtapaV26=async function(id){
 const to=document.getElementById('hsjStageV26')?.value,x=S.rows.find(v=>v.id===id);
 if(!x||!to)return;
 if(to==='administrativo'||to==='supervisao'){
  document.getElementById('modal').innerHTML='';
  return openReferralV18(id,to);
 }
 const selectedTab=[...document.querySelectorAll('#tabs .tab')].some(b=>(b.getAttribute('onclick')||'').includes("setView('"+to+"'"));
 if(!selectedTab)return alert('Selecione uma aba disponível no aplicativo.');
 if(to===x.stage){document.getElementById('modal').innerHTML='';return}
 if(!confirm('Mover '+x.patient_name+' para '+(labels[to]||to)+'?'))return;
 try{
 await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&stage=eq.'+encodeURIComponent(x.stage),{method:'PATCH',body:JSON.stringify({stage:to,updated_by:uid})});
 document.getElementById('modal').innerHTML='';await load();renderTabs();renderCurrent();
 }catch(e){alert('Não foi possível alterar a etapa: '+e.message)}
};
const oldRenderAll=window.renderCurrent;
window.renderCurrent=function(){
 const out=oldRenderAll.apply(this,arguments);
 const root=document.getElementById('content');
 root?.querySelectorAll('button').forEach(b=>{if(/pr[oó]xima etapa/i.test(b.textContent)){b.textContent='↪ Escolher etapa';const match=(b.getAttribute('onclick')||'').match(/'([0-9a-f-]{36})'/);if(match)b.onclick=()=>hsjEscolherEtapaV26(match[1])}});
 return out;
};
const oldMap=window.renderMap;
window.renderMap=function(){const r=oldMap.apply(this,arguments);return r};
loadAdmin().then(()=>{renderTabs();renderCurrent()});
})();