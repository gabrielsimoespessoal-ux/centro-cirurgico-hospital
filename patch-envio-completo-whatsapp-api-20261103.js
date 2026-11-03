(()=>{
 if(window.__hsjEnvioCompletoApi20261103)return;
 window.__hsjEnvioCompletoApi20261103=true;
 let busy=false;
 async function enviar(id){
  if(busy)return;
  const x=S.rows.find(p=>String(p.id)===String(id));
  if(!x)return alert('Paciente não localizado. Atualize os dados.');
  if(!confirm('Enviar agora o lembrete e as imagens de orientação para o WhatsApp cadastrado de '+x.patient_name+'? Confirme antes de prosseguir.'))return;
  busy=true;
  try{
   const response=await fetch('/api/enviar-lembrete-cirurgia',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({surgeryId:id})});
   const data=await response.json();
   if(!response.ok){
    alert((data.error||'Falha na integração de WhatsApp.')+(data.partial?' Algumas mensagens podem ter sido enviadas: confira a conversa antes de tentar novamente.':''));
    return;
   }
   alert('O WhatsApp aceitou '+data.count+' mensagens (lembrete e orientações). Verifique a entrega no WhatsApp Business.');
  }catch(err){alert('Não foi possível confirmar o envio. Verifique a conversa antes de tentar novamente.')}
  finally{busy=false;}
 }
 window.hsjEnviarLembreteImagensApi=enviar;
 function installButtons(){
  const root=document.getElementById('content');if(!root)return;
  const old=[...root.querySelectorAll('button[data-hsj-map-reminder]')];
  for(const b of old){
   if(b.parentElement?.querySelector('[data-hsj-api-reminder]'))continue;
   const fn=b.getAttribute('onclick')||'';
   const existing=b.onclick?.toString()||'';
   const m=(fn+' '+existing).match(/(?:hsjMapReminderV12|reminder)\s*\(\s*['"]([0-9a-f-]{36})['"]/i);
   // In map reminder source, button onclick is an event handler closure and the patient id
   // may not be present in the handler text. Resolve from the nearest row patient instead.
   const action=b.closest('tr');
   const marker=[...action?.querySelectorAll('button[onclick]')||[]].map(n=>n.getAttribute('onclick')||'').join(' ');
   const patientId=m?.[1]||marker.match(/['"]([0-9a-f-]{36})['"]/)?.[1];
   if(!patientId)continue;
   const button=document.createElement('button');button.type='button';button.className='btn small green';
   button.dataset.hsjApiReminder='1';button.textContent='Enviar lembrete + imagens (automático)';
   button.onclick=()=>enviar(patientId);b.after(button);
  }
 }
 const old=window.renderMap;
 if(typeof old==='function'){
  window.renderMap=function(){const r=old.apply(this,arguments);installButtons();return r;};
  installButtons();
 }
 const oldAgenda=window.hsjAgendaSurgery;
 if(typeof oldAgenda==='function'){
  window.hsjAgendaSurgery=async function(id){
   const result=await oldAgenda.apply(this,arguments);
   const footer=document.querySelector('#modal .mf');
   if(footer&&!footer.querySelector('[data-hsj-api-reminder]')){
    const btn=document.createElement('button');btn.type='button';btn.className='btn green';
    btn.dataset.hsjApiReminder='1';btn.textContent='Enviar lembrete + imagens (automático)';
    btn.onclick=()=>enviar(id);footer.appendChild(btn);
   }
   return result;
  };
 }
})();