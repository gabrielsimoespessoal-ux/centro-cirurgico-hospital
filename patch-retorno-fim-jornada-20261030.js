(()=>{
 if(window.__hsjRetornoFimJornada20261030)return;window.__hsjRetornoFimJornada20261030=true;
 const stages=[['fila','Fila de Cirurgia'],['consulta_preop','Consulta Pré-Op'],['exames','Exames (NIR)'],['recebimento_nir','Recebimento NIR'],['programacao','Programação'],['entrevista_tecnico','Entrevista'],['avaliacao_enfermeiro','Monitoramento Enfermeiro'],['mapa_cirurgico','Mapa Cirúrgico'],['pos_operatorio','Pós-Operatório'],['supervisao','Monitoramento Supervisão'],['administrativo','Monitoramento Administrativo']];
 let saving=false;
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c]));
 window.hsjDevolverFimJornada=function(id){
  const x=S.rows.find(r=>r.id===id);if(!x||x.stage!=='concluida')return alert('Atualize os dados do paciente antes de devolver.');
  const opts=stages.map(([v,t])=>'<option value="'+v+'">'+safe(t)+'</option>').join('');
  document.getElementById('modal').innerHTML='<div class="back"><div class="modal" style="max-width:620px"><div class="mh"><b>↩ Devolver paciente para etapa anterior</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><p><b>'+safe(x.patient_name)+'</b></p><div class="field"><label>Etapa de destino *</label><select id="hsjReturnStage">'+opts+'</select></div><div class="field" style="margin-top:12px"><label>Justificativa da devolução *</label><textarea rows="4" id="hsjReturnReason" placeholder="Explique por que o paciente retorna à etapa selecionada."></textarea></div><p class="notice">Os dados históricos e as respostas de satisfação existentes serão preservados. Para retorno ao mapa, confira a data da cirurgia e a situação do procedimento.</p></div><div class="mf"><button class="btn primary" onclick="hsjConfirmarRetornoFimJornada(\''+id+'\')">Confirmar devolução</button></div></div></div>';
 };
 window.hsjConfirmarRetornoFimJornada=async function(id){
  if(saving)return;
  const dest=document.getElementById('hsjReturnStage')?.value;
  const reason=document.getElementById('hsjReturnReason')?.value?.trim();
  if(!reason||!stages.some(([v])=>v===dest))return alert('Selecione a etapa e registre a justificativa.');
  const x=S.rows.find(r=>r.id===id);if(!x||x.stage!=='concluida')return alert('Cadastro não está mais no Fim da Jornada.');
  if(['supervisao','administrativo','avaliacao_enfermeiro'].includes(dest)){
   if(!confirm('O paciente será encaminhado ao monitoramento escolhido, com justificativa. Confirma?'))return;
   document.getElementById('modal').innerHTML='';
   if(typeof window.openReferralV18==='function'){
    window.openReferralV18(id,dest);
    const area=document.getElementById('refReasonV18')||document.getElementById('hsjAdminReasonV26');
    if(area)area.value=reason;
   }else alert('Encaminhamento indisponível. Atualize o aplicativo.');
   return;
  }
  if(!confirm('Confirmar devolução de '+x.patient_name+' para '+(stages.find(v=>v[0]===dest)?.[1]||dest)+'?'))return;
  saving=true;
  try{
   const result=await api('/rest/v1/rpc/hsj_devolver_fim_jornada',{method:'POST',body:JSON.stringify({p_surgery_id:id,p_destino:dest,p_motivo:reason,p_usuario:uid})});
   if(result!==true)throw Error('O banco não confirmou a devolução.');
   document.getElementById('modal').innerHTML='';
   await load();renderCurrent();alert('Paciente devolvido para '+(stages.find(v=>v[0]===dest)?.[1]||dest)+'. Motivo informado: '+reason);
  }catch(e){alert('Devolução não concluída: '+(e?.message||e))}
  finally{saving=false}
 };
 const prev=window.renderCurrent;
 window.renderCurrent=function(){
  const value=prev.apply(this,arguments);
  if(S.view!=='concluida')return value;
  const root=document.getElementById('content');if(!root)return value;
  root.querySelectorAll('button[onclick^="editPatient("]').forEach(btn=>{
   const id=(btn.getAttribute('onclick')||'').match(/'([0-9a-f-]{36})'/)?.[1];
   if(!id||btn.parentElement.querySelector('[data-hsj-return-final]'))return;
   const b=document.createElement('button');b.type='button';b.className='btn small';b.dataset.hsjReturnFinal='1';b.textContent='↩ Devolver para etapa';b.onclick=()=>window.hsjDevolverFimJornada(id);btn.after(b);
  });
  return value;
 };
})();