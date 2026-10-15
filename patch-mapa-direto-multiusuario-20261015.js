(()=>{
if(window.__hsjMapaDiretoMultiV1)return;window.__hsjMapaDiretoMultiV1=true;
let busy=false,dirty=false,lastSignature='';
const sig=rows=>JSON.stringify((rows||[]).map(x=>[x.id,x.updated_at,x.stage]));
window.hsjMapaDireto=function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return alert('Paciente não localizado. Atualize a tela.');
 if(x.stage==='mapa_cirurgico')return alert('Paciente já está no Mapa Cirúrgico.');
 const existing=document.getElementById('modal');
 if(!existing)return;
 existing.innerHTML='<div class="back"><div class="modal" style="max-width:650px"><div class="mh"><b>🏥 Encaminhar diretamente ao Mapa Cirúrgico</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><p><b>'+esc(x.patient_name)+'</b> — '+esc(x.procedure_name||'')+'</p><div class="notice">A etapa será modificada no banco compartilhado. O cadastro e os registros anteriores serão preservados. Verifique as condições pré-operatórias e o agendamento antes de confirmar.</div><div class="field"><label>Justificativa do encaminhamento *</label><textarea id="hsjMapaReason" rows="4"></textarea></div></div><div class="mf"><button id="hsjMapaConfirm" class="btn primary" onclick="hsjConfirmarMapaDireto(\''+id+'\')">Confirmar encaminhamento</button></div></div></div>';
};
window.hsjConfirmarMapaDireto=async function(id){
 if(busy)return;
 const reason=(document.getElementById('hsjMapaReason')?.value||'').trim();
 if(!reason)return alert('Informe a justificativa.');
 const previous=S.rows.find(x=>x.id===id);if(!previous)return;
 if(!confirm('Confirma encaminhar este paciente diretamente ao Mapa Cirúrgico?'))return;
 const button=document.getElementById('hsjMapaConfirm');if(button)button.disabled=true;
 busy=true;
 try{
  // Releitura individual antes de alterar, impedindo avanço a partir de uma etapa antiga.
  const current=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,stage,updated_at,patient_name');
  if(!Array.isArray(current)||current.length!==1)throw Error('Paciente não localizado no servidor.');
  const row=current[0];
  if(row.stage!==previous.stage||row.updated_at!==previous.updated_at)throw Error('Paciente modificado em outro computador. Atualize antes de encaminhar.');
  const endpoint='/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&stage=eq.'+encodeURIComponent(row.stage)+'&updated_at=eq.'+encodeURIComponent(row.updated_at);
  const updated=await api(endpoint,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({stage:'mapa_cirurgico',updated_by:uid})});
  if(!Array.isArray(updated)||updated.length!==1)throw Error('Mudança simultânea detectada. Nenhum encaminhamento confirmado.');
  document.getElementById('modal').innerHTML='';
  await load();renderCurrent();
  alert('Paciente encaminhado ao Mapa Cirúrgico no banco compartilhado.');
 }catch(e){alert('Encaminhamento não confirmado: '+e.message+'\nConfira o estado atualizado do paciente.')}
 finally{busy=false;if(button)button.disabled=false}
};
const oldActions=window.actionButtons;
window.actionButtons=function(x){return oldActions(x)+(x.stage==='mapa_cirurgico'?'':' <button class="btn small" onclick="hsjMapaDireto(\''+x.id+'\')">🏥 Mapa Cirúrgico</button>')};
const oldCurrent=window.renderCurrent;
window.renderCurrent=function(){
 const r=oldCurrent.apply(this,arguments);
 // Telas com botões próprios: incluir ação direta onde houver botão de edição identificado.
 document.querySelectorAll('#content button[onclick^="editMapPatient("]').forEach(b=>{
  const id=(b.getAttribute('onclick')||'').match(/'([0-9a-f-]{36})'/)?.[1];
  if(!id||b.parentElement.querySelector('[data-mapa-direto]'))return;
  const x=S.rows.find(t=>t.id===id);if(!x||x.stage==='mapa_cirurgico')return;
  const a=document.createElement('button');a.className='btn small';a.dataset.mapaDireto='1';a.textContent='🏥 Mapa Cirúrgico';a.onclick=()=>hsjMapaDireto(id);b.after(a);
 });
 // Caixa da Supervisão: acrescentar opção diretamente ao lado de Editar cadastro.
 if(S.view==='supervisao')document.querySelectorAll('#content button[data-hsj-edit]').forEach(b=>{
   if(b.parentElement.querySelector('[data-mapa-direto]'))return;
   const label=b.closest('tr')?.querySelector('td b')?.textContent||'';
   const matches=S.rows.filter(x=>x.patient_name===label);
   if(matches.length!==1||matches[0].stage==='mapa_cirurgico')return;
   const a=document.createElement('button');a.className='btn small';a.dataset.mapaDireto='1';a.textContent='🏥 Mapa Cirúrgico';a.onclick=()=>hsjMapaDireto(matches[0].id);b.after(a);
 });
 return r;
};
// Sincronização de leitura entre computadores. Não substitui formulários em edição.
async function sync(){
 if(busy||document.hidden||document.querySelector('#modal .back'))return;
 try{
  const rows=await api('/rest/v1/surgeries?select=*&active=eq.true&order=created_at.desc&limit=5000');
  if(!Array.isArray(rows))return;
  const next=sig(rows);if(next===lastSignature)return;
  lastSignature=next;
  S.rows=rows;
  if(typeof fillFilters==='function')fillFilters();
  renderCurrent();
 }catch(e){console.warn('Sincronização compartilhada indisponível:',e)}
}
lastSignature=sig(S.rows);
setInterval(sync,12000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
})();