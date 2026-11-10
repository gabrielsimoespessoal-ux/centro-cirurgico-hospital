(()=>{
'use strict';
if(window.__hsjMapaDataHora20261104)return;
window.__hsjMapaDataHora20261104=true;
const previousEdit=window.editMapPatient;
const previousSave=window.hsjSaveMapExtraV2;
if(typeof previousEdit!=='function'||typeof previousSave!=='function'){console.error('Mapa: funções de agendamento indisponíveis.');return}
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const apptPath=id=>'/rest/v1/surgery_appointment_details?surgery_id=eq.'+encodeURIComponent(id)+'&select=*';
const records={};
async function loadDetails(id){if(!records[id])records[id]=api(apptPath(id)).then(r=>r?.[0]||{}).catch(e=>{delete records[id];throw e});return records[id]}
window.editMapPatient=function(id){
 const result=previousEdit.apply(this,arguments);
 const dateField=document.getElementById('f_surgery_date');
 if(!dateField)return result;
 const wrapper=dateField.closest('.field');
 if(!wrapper||document.getElementById('f_map_surgery_time'))return result;
 const field=document.createElement('div');field.className='field';field.innerHTML='<label for="f_map_surgery_time">Horário do procedimento *</label><input id="f_map_surgery_time" type="time" required step="60" aria-describedby="hsj-map-time-help"><small id="hsj-map-time-help" style="font-size:11px;color:#52667b">Informe o horário confirmado da cirurgia.</small>';
 wrapper.after(field);
 const saveButton=document.querySelector('#modal .mf button.primary');
 if(saveButton){saveButton.disabled=true;saveButton.dataset.hsjTimeLoading='1'}
 loadDetails(id).then(d=>{
  const input=document.getElementById('f_map_surgery_time');
  if(input)input.value=String(d.scheduled_time||'').slice(0,5);
 }).catch(err=>{
  const hint=document.getElementById('hsj-map-time-help');
  if(hint)hint.textContent='Não foi possível consultar o horário anterior. Confira e preencha o horário para salvar.';
  console.warn('Falha ao consultar horário do procedimento:',err);
 }).finally(()=>{
  const b=document.querySelector('#modal .mf button.primary');
  if(b?.dataset.hsjTimeLoading){b.disabled=false;delete b.dataset.hsjTimeLoading}
 });
 return result;
};
window.hsjSaveMapExtraV2=async function(id){
 const time=document.getElementById('f_map_surgery_time')?.value||'';
 const date=document.getElementById('f_surgery_date')?.value||'';
 const by=document.getElementById('f_map_responsible')?.value.trim()||'';
 const input=document.getElementById('f_map_surgery_time');
 if(!date){alert('Informe a data da cirurgia.');document.getElementById('f_surgery_date')?.focus();return}
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){alert('Informe o horário confirmado do procedimento.');input?.focus();return}
 const button=document.querySelector('#modal .mf button.primary');
 if(button)button.disabled=true;
 let previous;
 try{previous=await loadDetails(id)}
 catch(e){if(button)button.disabled=false;alert('Não foi possível carregar os dados anteriores do agendamento. Tente novamente para evitar perda de informações.');return}
 const responsible=by||String(previous.scheduled_by_name||'').trim();
 if(!responsible){if(button)button.disabled=false;alert('Informe o nome do responsável pelo agendamento para salvar data e horário.');document.getElementById('f_map_responsible')?.focus();return}
 try{
  await previousSave.apply(this,arguments);
  // A função original fecha o formulário somente quando a gravação do Mapa foi confirmada.
  if(document.getElementById('f_map_surgery_time'))return;
  const rec={
   surgery_id:id,scheduled_date:date,scheduled_time:time,
   arrival_time:previous.arrival_time||null,
   location:previous.location||'Hospital São José — Centro Cirúrgico',
   instructions:previous.instructions||'Confirme com a equipe assistencial as orientações para o procedimento.',
   scheduled_by_name:responsible,
   scheduled_by:previous.scheduled_by||uid,
   updated_at:new Date().toISOString()
  };
  // Registros existentes são atualizados sem reatribuir a autoria original.
  // Registros novos usam o usuário autenticado como responsável técnico pelo registro.
  const exists=Boolean(previous.surgery_id);
  const payload={...rec};
  if(exists){delete payload.surgery_id;delete payload.scheduled_by}
  else{payload.scheduled_by=uid}
  const response=await api(exists?apptPath(id):'/rest/v1/surgery_appointment_details?select=*',{
   method:exists?'PATCH':'POST',
   headers:{Prefer:'return=representation'},body:JSON.stringify(payload)
  });
  if(!Array.isArray(response)||response.length!==1)throw new Error('Servidor não confirmou o registro do horário.');
  records[id]=Promise.resolve(response[0]);
 }catch(e){
  delete records[id];
  alert('Atenção: confira o agendamento antes de enviar o lembrete. O horário não pôde ser confirmado: '+e.message);
 }finally{if(button?.isConnected)button.disabled=false}
};
})();