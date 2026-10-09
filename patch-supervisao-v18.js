(()=>{
// Extensão isolada. Não substitui tabelas, registros nem os formulários existentes.
const V='supervisao';
labels[V]='🛡 Supervisão';
const allowed=['fila','pendencias','consulta_preop','exames','recebimento_nir','programacao','entrevista_tecnico','avaliacao_enfermeiro','mapa_cirurgico','cancelada','pos_operatorio','concluida'];
let referrals=[];
const byId=id=>S.rows.find(x=>x.id===id);
const fmt=t=>t?new Date(t).toLocaleString('pt-BR'):'—';
const duration=t=>{
 const m=Math.max(0,Math.floor((Date.now()-new Date(t).getTime())/60000));
 return m<60?m+' min':Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'min';
};
const originalTabs=window.renderTabs;
window.renderTabs=function(){
 originalTabs();
 const tabs=document.getElementById('tabs');
 if(tabs&&!tabs.querySelector('[data-supervisao]')){
 const b=document.createElement('button');b.className='tab '+(S.view===V?'on':'');
 b.dataset.supervisao='1';b.textContent='🛡 Supervisão';
 b.onclick=()=>{S.view=V;renderTabs();renderCurrent()};tabs.appendChild(b);
 }
};
const originalView=window.setView;
window.setView=function(v,el){if(v===V){S.view=v;renderTabs();renderCurrent();return}originalView(v,el)};
async function getReferrals(){
 try{referrals=await api('/rest/v1/supervision_referrals?select=*&order=created_at.desc&limit=3000');}
 catch(e){console.warn('Encaminhamentos não disponíveis:',e);referrals=[];}
}
const nativeLoad=window.load;
window.load=async function(){const result=await nativeLoad();await getReferrals();return result;};
function badgeFor(x){
 const last=referrals.find(r=>r.surgery_id===x.id);
 if(!last)return '';
 return last.status==='respondido'
 ?'<span class="pill ok" title="'+esc(last.resolution||'')+'">✅ Respondido</span>'
 :'<span class="pill warn" title="Aguardando tratativa">⏱ Em análise</span>';
}
window.openReferralV18=function(id,target='supervisao'){
 const x=byId(id);if(!x)return;
 const m=document.getElementById('modal');
 m.innerHTML='<div class="back"><div class="modal" style="max-width:650px"><div class="mh"><b>📨 Encaminhar atendimento</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><p><b>'+esc(x.patient_name)+'</b> • '+esc(x.procedure_name||'')+'</p><div class="field"><label>Destino</label><select id="refTargetV18"><option value="supervisao" '+(target==='supervisao'?'selected':'')+'>Supervisão</option><option value="avaliacao_enfermeiro" '+(target==='avaliacao_enfermeiro'?'selected':'')+'>Enfermeiro</option></select></div><div class="field"><label>Justificativa obrigatória *</label><textarea id="refReasonV18" rows="5" placeholder="Descreva o problema, a pendência e a providência solicitada."></textarea></div><div class="notice">O registro será incluído no histórico com data, horário e etapa de origem. O cadastro do paciente não será apagado.</div></div><div class="mf"><button class="btn primary" onclick="saveReferralV18(\''+x.id+'\')">Registrar encaminhamento</button></div></div></div>';
};
window.saveReferralV18=async function(id){
 const reason=document.getElementById('refReasonV18')?.value.trim();
 const destination=document.getElementById('refTargetV18')?.value;
 const x=byId(id);
 if(!x||!reason){alert('A justificativa escrita é obrigatória.');return}
 if(!['supervisao','avaliacao_enfermeiro'].includes(destination))return;
 try{
 await api('/rest/v1/supervision_referrals',{method:'POST',body:JSON.stringify({surgery_id:id,origin_stage:x.stage,destination,reason,created_by:uid})});
 document.getElementById('modal').innerHTML='';
 await getReferrals();renderCurrent();
 alert('Encaminhamento registrado. A etapa do paciente foi preservada.');
 }catch(e){alert('Não foi possível registrar o encaminhamento: '+e.message)}
};
const originalActions=window.actionButtons;
window.actionButtons=function(x){
 return originalActions(x)+' <span class="ref-actions-v18"><button class="btn small" onclick="openReferralV18(\''+x.id+'\',\'supervisao\')">🛡 Supervisão</button><button class="btn small" onclick="openReferralV18(\''+x.id+'\',\'avaliacao_enfermeiro\')">🩺 Enfermeiro</button> '+badgeFor(x)+'</span>';
};
function renderInboxV18(dest){
 const arr=referrals.filter(r=>r.destination===dest);
 const pending=arr.filter(r=>r.status==='aguardando');
 const answered=arr.filter(r=>r.status==='respondido');
 return '<div class="notice"><b>⏱ '+pending.length+' aguardando tratativa</b> • '+answered.length+' respondidos no histórico • O tempo é calculado desde o encaminhamento.</div><div class="tablewrap"><table class="table"><thead><tr><th>PACIENTE</th><th>ORIGEM</th><th>JUSTIFICATIVA</th><th>ENCAMINHADO EM</th><th>ESPERA</th><th>STATUS</th><th>AÇÃO</th></tr></thead><tbody>'+arr.map(r=>{
 const x=byId(r.surgery_id),on=r.status==='aguardando';
 return '<tr><td><b>'+esc(x?.patient_name||'Paciente não encontrado')+'</b><div class="sub">'+esc(x?.surgeon||'')+'</div></td><td>'+esc(labels[r.origin_stage]||r.origin_stage)+'</td><td>'+esc(r.reason)+'</td><td>'+esc(fmt(r.created_at))+'</td><td>'+(on?'<b>⏱ '+duration(r.created_at)+'</b>':'—')+'</td><td>'+(on?'<span class="pill warn">Aguardando</span>':'<span class="pill ok">✅ Respondido</span><div class="sub">'+esc(r.resolution||'')+'</div>')+'</td><td>'+(on?'<button class="btn small primary" onclick="openResolveV18(\''+r.id+'\')">Responder / Encaminhar</button>':'<span class="sub">'+esc(fmt(r.resolved_at))+' → '+esc(labels[r.return_stage]||r.return_stage||'')+'</span>')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}
window.renderSupervisionV18=()=>{
 document.getElementById('content').innerHTML='<section class="card"><div class="section-head"><div><h2>🛡 Supervisão</h2><div class="sub">Encaminhamentos com justificativa, cronômetro, resposta e rastreabilidade.</div></div></div>'+renderInboxV18('supervisao')+'</section>';
};
window.openResolveV18=function(id){
 const r=referrals.find(v=>v.id===id);if(!r||r.status!=='aguardando')return;
 const x=byId(r.surgery_id);
 const options=allowed.map(s=>'<option value="'+s+'" '+(s===r.origin_stage?'selected':'')+'>'+esc(labels[s]||s)+'</option>').join('');
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal" style="max-width:700px"><div class="mh"><b>✅ Responder encaminhamento</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><p><b>'+esc(x?.patient_name||'')+'</b> • Aberto em '+esc(fmt(r.created_at))+'</p><div class="notice">Solicitação: '+esc(r.reason)+'</div><div class="field"><label>Tratativa / resposta obrigatória *</label><textarea id="refResolutionV18" rows="5"></textarea></div><div class="field"><label>Etapa de destino (padrão: devolver à origem)</label><select id="refReturnV18">'+options+'</select></div></div><div class="mf"><button class="btn green" onclick="resolveReferralV18(\''+r.id+'\')">✅ Responder e encaminhar</button></div></div></div>';
};
window.resolveReferralV18=async function(id){
 const text=document.getElementById('refResolutionV18')?.value.trim();
 const stage=document.getElementById('refReturnV18')?.value;
 if(!text||!allowed.includes(stage)){alert('Informe a resposta e a etapa de destino.');return}
 if(!confirm('Confirmar a resposta e encaminhar o paciente para a etapa selecionada?'))return;
 try{
 await api('/rest/v1/rpc/resolve_supervision_referral',{method:'POST',body:JSON.stringify({p_referral_id:id,p_resolution:text,p_return_stage:stage})});
 document.getElementById('modal').innerHTML='';
 await load();renderCurrent();
 }catch(e){alert('Não foi possível concluir a tratativa: '+e.message)}
};
// Agrupamento alfabético por cirurgião, sem qualquer edição do banco.
const originalMap=window.renderMap;
window.renderMap=function(){
 const original=window.filtered;
 window.filtered=function(rows){
 const result=original(rows);
 if(!Array.isArray(result))return result;
 return [...result].sort((a,b)=>String(a.surgeon||'').localeCompare(String(b.surgeon||''),'pt-BR',{sensitivity:'base'})||String(a.surgery_date||'').localeCompare(String(b.surgery_date||''))||String(a.patient_name||'').localeCompare(String(b.patient_name||''),'pt-BR'));
 };
 try{originalMap()}finally{window.filtered=original}
 const container=document.getElementById('content');
 container?.querySelectorAll('button[onclick^="editMapPatient("]').forEach(b=>{
 const id=b.getAttribute('onclick')?.match(/'([0-9a-f-]{36})'/)?.[1];if(!id)return;
 const node=document.createElement('span');node.innerHTML=' <button class="btn small" onclick="openReferralV18(\''+id+'\',\'supervisao\')">🛡 Supervisão</button> <button class="btn small" onclick="openReferralV18(\''+id+'\',\'avaliacao_enfermeiro\')">🩺 Enfermeiro</button> '+badgeFor(byId(id));
 b.parentElement.appendChild(node);
 });
};
const originalNurse=window.renderNurse;
window.renderNurse=function(){
 originalNurse();
 const c=document.getElementById('content');
 if(c){const s=document.createElement('section');s.className='card';s.style.marginTop='16px';s.innerHTML='<div class="section-head"><h2>📨 Encaminhamentos recebidos pelo enfermeiro</h2></div>'+renderInboxV18('avaliacao_enfermeiro');c.appendChild(s)}
};
const originalCurrent=window.renderCurrent;
window.renderCurrent=function(){if(S.view===V)return renderSupervisionV18();return originalCurrent()};
const style=document.createElement('style');style.textContent='.ref-actions-v18{display:inline-flex;flex-wrap:wrap;gap:4px;align-items:center}.ref-actions-v18 .pill{white-space:nowrap}';document.head.appendChild(style);
getReferrals().then(()=>{renderTabs();renderCurrent()});
setInterval(()=>{if(S.view===V||S.view==='avaliacao_enfermeiro')renderCurrent()},60000);
})();