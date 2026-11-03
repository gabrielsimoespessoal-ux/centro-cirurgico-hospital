(()=>{
 'use strict';
 if(window.__hsjLembreteImagensManual20261103)return;
 window.__hsjLembreteImagensManual20261103=true;
 const arquivos={
  acompanhantes:{nome:'Orientações para acompanhantes',url:'/orientacoes/acompanhantes.svg',arquivo:'HSJ_ORIENTACOES_ACOMPANHANTES.png'},
  manha:{nome:'Urologia — manhã',url:'/orientacoes/urologia-manha.svg',arquivo:'HSJ_UROLOGIA_MANHA.png'},
  tarde:{nome:'Urologia — tarde',url:'/orientacoes/urologia-tarde.svg',arquivo:'HSJ_UROLOGIA_TARDE.png'}
 };
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=d=>{const m=String(d||'').slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:'Não informada'};
 const numero=(raw)=>{let n=String(raw||'').replace(/\D/g,'');if(n.startsWith('55')&&[12,13].includes(n.length))n=n.slice(2);return [10,11].includes(n.length)?'55'+n:null};
 const limparEspecialidade=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 async function imagePng(tipo){
  const item=arquivos[tipo];if(!item)throw Error('Orientação não encontrada.');
  const resposta=await fetch(item.url,{cache:'force-cache'});
  if(!resposta.ok)throw Error('Não foi possível abrir a imagem de orientação.');
  const svg=await resposta.text(),url=window.URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),img=new Image();
  try{
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Erro ao converter a imagem.'));img.src=url;});
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   canvas.getContext('2d').drawImage(img,0,0);
   return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Conversão PNG falhou.')),'image/png'));
  }finally{window.URL.revokeObjectURL(url)}
 }
 function baixar(blob,nome){
  const url=window.URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nome;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>window.URL.revokeObjectURL(url),20000);
 }
 async function acao(tipo,metodo,status){
  try{
   status.textContent='Preparando imagem em alta resolução...';
   const blob=await imagePng(tipo);
   if(metodo==='copiar'){
    if(!navigator.clipboard?.write||!window.ClipboardItem)throw Error('Este navegador não permite copiar imagens. Use Baixar PNG.');
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    status.textContent='Imagem copiada! No WhatsApp Web, clique no campo de mensagem e pressione Ctrl + V; confirme o envio.';
   }else if(metodo==='compartilhar'){
    const file=new File([blob],arquivos[tipo].arquivo,{type:'image/png'});
    if(navigator.canShare?.({files:[file]})&&navigator.share){
      await navigator.share({files:[file],title:arquivos[tipo].nome});
      status.textContent='Compartilhamento solicitado. Confira a conversa do paciente.';
    }else{
      baixar(blob,arquivos[tipo].arquivo);
      status.textContent='Este dispositivo não oferece compartilhamento direto. PNG baixado; anexe-o manualmente no WhatsApp.';
    }
   }else{baixar(blob,arquivos[tipo].arquivo);status.textContent='PNG baixado. Anexe no WhatsApp do paciente.'}
  }catch(e){if(e.name!=='AbortError')status.textContent='Não foi possível completar: '+e.message;}
 }
 function fechar(){document.getElementById('hsj-lembrete-imagens-modal')?.remove()}
 async function abrir(id){
  const paciente=S.rows.find(r=>String(r.id)===String(id));
  if(!paciente)return alert('Paciente não localizado. Atualize os cadastros.');
  const telefone=numero(paciente.phone);
  if(!telefone)return alert('O telefone do paciente está ausente ou inválido. Corrija o cadastro antes de enviar.');
  let data;
  try{
   const rows=await api('/rest/v1/surgery_appointment_details?surgery_id=eq.'+encodeURIComponent(id)+'&select=scheduled_date,scheduled_time,arrival_time,location,instructions,scheduled_by_name');
   data=rows?.[0];
  }catch(e){return alert('Não foi possível consultar o agendamento: '+e.message)}
  if(!data?.scheduled_date||!data?.scheduled_time)return alert('Agendamento sem data ou horário confirmado. Corrija antes do envio.');
  const urologia=limparEspecialidade(paciente.specialty).includes('UROLOG');
  const hora=String(data.scheduled_time).slice(0,5);
  if(urologia&&!/^\d\d:\d\d$/.test(hora))return alert('É necessário informar o horário da cirurgia de Urologia.');
  const selecionados=['acompanhantes',...(urologia?[Number(hora.slice(0,2))<12?'manha':'tarde']:[])];
  const mensagem=[
   'Olá, '+paciente.patient_name+'!',
   'Aqui é do Setor de Marcação de Cirurgia do Hospital São José.',
   '',
   'Confirmamos seu agendamento cirúrgico:',
   'Procedimento: '+(paciente.procedure_name||'Conforme orientação médica'),
   'Data: '+fmt(data.scheduled_date),
   'Horário da cirurgia: '+hora,
   'Chegada: '+(data.arrival_time?String(data.arrival_time).slice(0,5):'Conforme orientação da equipe'),
   'Local: '+(data.location||'Hospital São José'),
   '',
   'Orientações: '+(data.instructions||'Conforme orientações da equipe assistencial'),
   '',
   'Responsável pelo agendamento: '+(data.scheduled_by_name||'Equipe de agendamento'),
   'Por favor, confirme o recebimento. As imagens de orientações serão encaminhadas nesta conversa.'
  ].join('\n');
  fechar();
  const overlay=document.createElement('div');
  overlay.id='hsj-lembrete-imagens-modal';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483645;background:#0b1930bb;display:flex;align-items:center;justify-content:center;padding:16px';
  const rows=selecionados.map(t=>{
   const f=arquivos[t];
   return '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;border:1px solid #cbd5e1;padding:12px;border-radius:9px;margin:8px 0">'+
   '<img src="'+f.url+'" alt="'+escape(f.nome)+'" style="width:70px;height:95px;object-fit:contain;background:#fff;border:1px solid #ddd">'+
   '<div style="flex:1;min-width:155px"><strong>'+escape(f.nome)+'</strong><div style="font-size:12px;color:#475569">Imagem em alta resolução para o paciente</div></div>'+
   '<div style="display:flex;gap:5px;flex-wrap:wrap"><button type="button" class="btn small" data-copy="'+t+'">Copiar imagem</button><button type="button" class="btn small" data-download="'+t+'">Baixar PNG</button><button type="button" class="btn small" data-share="'+t+'">Compartilhar</button></div></div>';
  }).join('');
  overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Lembrete de cirurgia e imagens" style="background:white;color:#152238;width:min(800px,100%);max-height:94vh;overflow:auto;border-radius:13px;padding:22px;box-shadow:0 8px 40px #0005">'+
    '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h2 style="margin:0">WhatsApp — lembrete + imagens</h2><button type="button" class="btn" id="hsj-fechar-lembrete">Fechar</button></div>'+
    '<p><b>Paciente:</b> '+escape(paciente.patient_name)+'<br><b>Especialidade:</b> '+escape(paciente.specialty||'Não informada')+'<br><b>Horário:</b> '+escape(hora)+'</p>'+
    '<p><b>Passo 1.</b> Abra a conversa já com o lembrete preparado e clique em Enviar no WhatsApp.</p>'+
    '<button type="button" class="btn green" id="hsj-abrir-whatsapp">1 — Abrir WhatsApp com lembrete</button>'+
    '<p><b>Passo 2.</b> Copie cada imagem abaixo e cole na conversa com <b>Ctrl + V</b>, ou baixe e anexe pelo clipe do WhatsApp.</p>'+
    rows+
    '<p id="hsj-status-orientacoes" role="status" style="background:#eff6ff;color:#1e3a8a;padding:10px;border-radius:6px">Nenhuma imagem foi enviada automaticamente. Confirme cada anexo na conversa correta.</p>'+
    '<p style="font-size:12px;color:#9a3412">As orientações sobre medicamentos precisam de validação da equipe assistencial antes do envio. Não utilize esta função para encaminhar instruções ainda não aprovadas.</p>'+
    '</section>';
  document.body.appendChild(overlay);
  overlay.querySelector('#hsj-fechar-lembrete').onclick=fechar;
  overlay.querySelector('#hsj-abrir-whatsapp').onclick=()=>{
   window.open('https://wa.me/'+telefone+'?text='+encodeURIComponent(mensagem),'_blank','noopener,noreferrer');
   overlay.querySelector('#hsj-status-orientacoes').textContent='Solicitada a abertura do WhatsApp. Se não abrir, permita pop-ups. Envie a mensagem e depois anexe as imagens; o aplicativo não confirma o envio.';
  };
  const status=overlay.querySelector('#hsj-status-orientacoes');
  overlay.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>acao(b.dataset.copy,'copiar',status));
  overlay.querySelectorAll('[data-download]').forEach(b=>b.onclick=()=>acao(b.dataset.download,'baixar',status));
  overlay.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>acao(b.dataset.share,'compartilhar',status));
 }
 window.hsjAbrirLembreteImagensManual=abrir;
 // Replace the action behind the existing green reminder button, including history rows.
 window.hsjMapReminderV12=function(id){return abrir(id)};
 const anterior=window.renderMap;
 if(typeof anterior==='function'){
  window.renderMap=function(){
   const r=anterior.apply(this,arguments);
   document.querySelectorAll('button[data-hsj-map-reminder]').forEach(b=>b.textContent='WhatsApp — lembrete + imagens');
   return r;
  };
 }
 document.querySelectorAll('button[data-hsj-map-reminder]').forEach(b=>b.textContent='WhatsApp — lembrete + imagens');
})();