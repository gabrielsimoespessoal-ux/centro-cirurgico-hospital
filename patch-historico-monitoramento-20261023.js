/* Histórico clínico/operacional: somente leitura; não altera cadastros. */
(()=>{
 if(window.__hsjHistory20261023)return;window.__hsjHistory20261023=true;
 const escapeText=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[m]));
 const date=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
 const original=window.actionButtons;
 window.actionButtons=function(x){return original(x)+' <button class="btn small" onclick="hsjHistory(\''+x.id+'\')">📋 Histórico de monitoramento</button>'};
 window.hsjHistory=async function(id){
  const x=S.rows.find(r=>r.id===id);if(!x)return alert('Paciente não localizado');
  document.getElementById('modal').innerHTML='<div class="back"><div class="modal"><div class="mh"><b>Histórico de monitoramento — '+escapeText(x.patient_name)+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb">Carregando registros...</div></div></div>';
  try{
   const urls=['nurse_reviews','supervision_referrals','administrative_referrals'].map(t=>'/rest/v1/'+t+'?surgery_id=eq.'+encodeURIComponent(id)+'&select=*');
   const result=await Promise.all(urls.map(u=>api(u)));
   const records=[];
   for(const r of result[0]||[])records.push({type:'Enfermeiro',at:r.reviewed_at,by:r.reviewed_by,reason:r.reason,decision:r.decision,reply:r.assessment,notes:r.notes});
   for(const r of result[1]||[])records.push({type:'Supervisão',at:r.resolved_at||r.created_at,by:r.resolved_by,reason:r.reason,decision:r.status,reply:r.resolution,notes:r.destination});
   for(const r of result[2]||[])records.push({type:'Administrativo',at:r.resolved_at||r.created_at,by:r.resolved_by,reason:r.reason,decision:r.status,reply:r.resolution,notes:r.return_stage});
   if(x.nurse_at||x.nurse_observations)records.push({type:'Avaliação do enfermeiro (cadastro)',at:x.nurse_at,by:x.nurse_by,reason:x.nurse_referral_reason,decision:'Avaliação registrada',reply:x.nurse_observations,notes:''});
   records.sort((a,b)=>new Date(b.at||0)-new Date(a.at||0));
   const body=records.map(r=>'<section style="border:1px solid #d7e0ea;border-radius:8px;padding:12px;margin-bottom:10px"><b>'+escapeText(r.type)+'</b> — '+escapeText(date(r.at))+'<div><b>Motivo:</b> '+escapeText(r.reason||'—')+'</div><div><b>Conduta / situação:</b> '+escapeText(r.decision||'—')+'</div><div><b>Resposta:</b> '+escapeText(r.reply||'—')+'</div><div><b>Observações:</b> '+escapeText(r.notes||'—')+'</div><small>Identificador do profissional: '+escapeText(r.by||'—')+'</small></section>').join('');
   const modal=document.querySelector('#modal .mb');if(modal)modal.innerHTML='<p class="notice">Registros de monitoramento preservados, inclusive os finalizados.</p>'+(body||'<p>Nenhum registro de monitoramento encontrado.</p>');
  }catch(e){const modal=document.querySelector('#modal .mb');if(modal)modal.textContent='Falha ao consultar histórico: '+e.message;}
 };
})();