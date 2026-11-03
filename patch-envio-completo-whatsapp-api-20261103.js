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
 async function habilitarSeConfigurado(){
  let configured=false;
  try{const res=await fetch('/api/enviar-lembrete-cirurgia',{cache:'no-store'});const data=await res.json();configured=res.ok&&data.configured===true;}catch(_){}
  if(!configured){console.info('Envio automático de imagens aguardando configuração da conta WhatsApp Business API. Fluxo manual preservado.');return;}
  const originalReminder=window.hsjMapReminderV12;
  if(typeof originalReminder==='function'){
   window.hsjMapReminderV12=function(id){return enviar(id)};
  }
  const originalAgenda=window.hsjAgendaSurgery;
  if(typeof originalAgenda==='function'){
   window.hsjAgendaSurgery=async function(id){
    const result=await originalAgenda.apply(this,arguments);
    const footer=document.querySelector('#modal .mf');
    if(footer&&!footer.querySelector('[data-hsj-api-reminder]')){
     const btn=document.createElement('button');btn.type='button';btn.className='btn green';
     btn.dataset.hsjApiReminder='1';btn.textContent='Enviar lembrete + imagens (automático)';
     btn.onclick=()=>enviar(id);footer.appendChild(btn);
    }
    return result;
   };
  }
  const relabel=()=>{
   document.querySelectorAll('button[data-hsj-map-reminder]').forEach(b=>b.textContent='WhatsApp — lembrete + imagens');
  };
  const old=window.renderMap;
  if(typeof old==='function'){
   window.renderMap=function(){const result=old.apply(this,arguments);relabel();return result};
   relabel();
  }
 }
 habilitarSeConfigurado();
})();