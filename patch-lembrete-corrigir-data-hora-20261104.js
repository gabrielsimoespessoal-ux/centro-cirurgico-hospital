(()=>{
'use strict';
if(window.__hsjLembreteCorrigirHorario20261104)return;
window.__hsjLembreteCorrigirHorario20261104=true;
const original=window.hsjMapReminderV12;
if(typeof original!=='function'){console.error('Lembrete WhatsApp não foi carregado.');return}
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const path=id=>'/rest/v1/surgery_appointment_details?surgery_id=eq.'+encodeURIComponent(id)+'&select=*';
const time=t=>String(t||'').slice(0,5);
const valid=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
let saving=false;
function close(){document.getElementById('hsj-reminder-fix-modal')?.remove()}
function openForm(id,p,d){
 close();
 const cover=document.createElement('div');cover.id='hsj-reminder-fix-modal';
 cover.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#10213cbb;display:flex;align-items:center;justify-content:center;padding:14px';
 cover.innerHTML='<div role="dialog" aria-modal="true" aria-labelledby="hsj-fix-title" style="background:#fff;color:#152238;border-radius:12px;width:min(680px,100%);max-height:94vh;overflow:auto;padding:22px;box-shadow:0 14px 45px #0004">'+
 '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h2 id="hsj-fix-title" style="margin:0;font-size:18px">Confirmar data e horário da cirurgia</h2><button type="button" class="btn" id="hsj-fix-close">Fechar</button></div>'+
 '<p style="font-size:13px">O lembrete do WhatsApp precisa da data e do horário salvos. Confirme os dados do paciente antes de preparar a mensagem.</p>'+
 '<p><b>Paciente:</b> '+esc(p.patient_name)+'<br><b>Procedimento:</b> '+esc(p.procedure_name||'—')+'<br><b>Sala:</b> '+esc(p.map_room||'—')+'</p>'+
 '<div class="grid">'+
 '<div class="field"><label for="hsj-fix-date">Data da cirurgia *</label><input id="hsj-fix-date" type="date" required value="'+esc(p.surgery_date||d.scheduled_date||'')+'"></div>'+
 '<div class="field"><label for="hsj-fix-time">Horário do procedimento *</label><input id="hsj-fix-time" type="time" required step="60" value="'+esc(time(d.scheduled_time))+'"></div>'+
 '<div class="field"><label for="hsj-fix-arrival">Horário de chegada (opcional)</label><input id="hsj-fix-arrival" type="time" value="'+esc(time(d.arrival_time))+'"></div>'+
 '<div class="field"><label for="hsj-fix-by">Responsável pelo agendamento *</label><input id="hsj-fix-by" autocomplete="name" value="'+esc(d.scheduled_by_name||p.map_responsible||'')+'"></div>'+
 '<div class="field span2"><label for="hsj-fix-location">Local *</label><input id="hsj-fix-location" value="'+esc(d.location||'Hospital São José — Centro Cirúrgico')+'"></div>'+
 '<div class="field span3"><label for="hsj-fix-instructions">Orientações ao paciente *</label><textarea id="hsj-fix-instructions" rows="4">'+esc(d.instructions||'Seguir as orientações fornecidas pela equipe assistencial. Confirmar previamente as instruções específicas de jejum e medicamentos.')+'</textarea></div>'+
 '</div><p id="hsj-fix-error" role="alert" style="color:#b42318;font-size:13px"></p>'+
 '<div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="hsj-fix-cancel">Cancelar</button><button class="btn primary" type="button" id="hsj-fix-save">Salvar e preparar lembrete</button></div></div>';
 document.body.appendChild(cover);
 cover.querySelector('#hsj-fix-close').onclick=close;
 cover.querySelector('#hsj-fix-cancel').onclick=close;
 cover.querySelector('#hsj-fix-save').onclick=async()=>{
  if(saving)return;
  const get=k=>cover.querySelector('#hsj-fix-'+k)?.value?.trim()||'';
  const date=get('date'),hour=get('time'),by=get('by'),location=get('location'),instructions=get('instructions');
  const err=cover.querySelector('#hsj-fix-error');
  if(!date||!valid(hour)||!by||!location||!instructions){
   err.textContent='Preencha data, horário válido, responsável, local e orientações.';return;
  }
  if(p.surgery_date&&p.surgery_date!==date){
   err.textContent='A data difere da registrada no Mapa ('+p.surgery_date.split('-').reverse().join('/')+'). Corrija a data no Mapa Cirúrgico antes de enviar o lembrete.';return;
  }
  saving=true;const btn=cover.querySelector('#hsj-fix-save');btn.disabled=true;btn.textContent='Salvando e conferindo...';err.textContent='';
  try{
   const current=await api(path(id));
   const old=current?.[0]||{};
   const payload={
    surgery_id:id,scheduled_date:date,scheduled_time:hour,
    arrival_time:get('arrival')||null,
    scheduled_by_name:by,location,instructions,
    scheduled_by:old.scheduled_by||uid,updated_at:new Date().toISOString()
   };
   const result=await api('/rest/v1/surgery_appointment_details?on_conflict=surgery_id',{
    method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
   if(!Array.isArray(result)||result.length!==1)throw Error('O servidor não confirmou o agendamento.');
   const verified=await api(path(id));
   if(verified?.length!==1||String(verified[0].scheduled_date).slice(0,10)!==date||time(verified[0].scheduled_time)!==hour)
    throw Error('A verificação do horário após salvar falhou.');
   close();
   await original(id);
  }catch(ex){if(cover.isConnected)err.textContent='Não foi possível confirmar o agendamento: '+ex.message}
  finally{saving=false;if(btn.isConnected){btn.disabled=false;btn.textContent='Salvar e preparar lembrete'}}
 };
 cover.querySelector('#hsj-fix-time')?.focus();
}
window.hsjMapReminderV12=async function(id){
 const p=S.rows.find(x=>String(x.id)===String(id));
 if(!p)return alert('Paciente não localizado. Atualize o Mapa.');
 try{
  const result=await api(path(id));
  const d=result?.[0]||{};
  if(d.scheduled_date&&valid(time(d.scheduled_time)))return original(id);
  return openForm(id,p,d);
 }catch(ex){alert('Não foi possível consultar os dados de agendamento: '+ex.message)}
};
})();