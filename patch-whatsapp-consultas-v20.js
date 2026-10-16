(()=>{
if(window.__hsjWhatsappConsultV20)return;window.__hsjWhatsappConsultV20=true;
function numberBR(raw){
 let n=String(raw||'').replace(/\D/g,'');
 if((n.length===12||n.length===13)&&n.startsWith('55'))n=n.slice(2);
 if(n.length!==10&&n.length!==11)return null;
 if(n.slice(0,2)==='00')return null;
 return '55'+n;
}
function dateBR(value){
 const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
 return m?m[3]+'/'+m[2]+'/'+m[1]:String(value||'');
}
window.hsjEnviarConsultaWhatsapp=function(id){
 const x=S.rows.find(r=>r.id===id);
 if(!x)return alert('Cadastro não encontrado. Atualize a página.');
 if(!x.consultation_date||!x.consultation_time)return alert('Salve a data e o horário da consulta antes de abrir o WhatsApp.');
 const phone=numberBR(x.phone);
 if(!phone)return alert('Telefone do paciente não informado ou inválido. Informe o WhatsApp com DDD no cadastro do paciente antes do envio.');
 const parts=[
 '🏥 *HOSPITAL SÃO JOSÉ*',
 '*Confirmação de agendamento de consulta*',
 '',
 'Olá! Sua consulta foi agendada com as seguintes informações:',
 '📅 *Data:* '+dateBR(x.consultation_date),
 '🕒 *Horário:* '+String(x.consultation_time).slice(0,5),
 x.specialty?'*Especialidade:* '+x.specialty:null,
 x.surgeon?'*Médico(a):* '+x.surgeon:null,
 '*Local:* Hospital São José',
 '',
 'Em caso de dúvidas, entre em contato com nossa equipe.'
 ].filter(v=>v!==null);
 const link='https://wa.me/'+phone+'?text='+encodeURIComponent(parts.join('\n'));
 const opened=window.open(link,'_blank','noopener,noreferrer');
 if(!opened)alert('O navegador pode ter bloqueado a abertura do WhatsApp. Permita pop-ups para este aplicativo e clique novamente.');
};
function addTableButtons(){
 const root=document.getElementById('consultTableBox');if(!root)return;
 root.querySelectorAll('tbody tr').forEach(tr=>{
  if(tr.querySelector('[data-hsj-whatsapp]'))return;
  const edit=tr.querySelector('button[onclick^="editConsult("]');
  const id=(edit?.getAttribute('onclick')||'').match(/'([^']+)'/)?.[1];
  if(!id)return;
  const x=S.rows.find(r=>r.id===id);if(!x)return;
  const btn=document.createElement('button');btn.type='button';btn.className='btn small';
  btn.dataset.hsjWhatsapp='1';btn.style.margin='4px 0';btn.style.whiteSpace='nowrap';
  btn.textContent='📲 WhatsApp';
  btn.onclick=()=>hsjEnviarConsultaWhatsapp(id);
  edit.insertAdjacentElement('afterend',btn);
 });
}
const prevTable=window.renderConsultTableOnly;
window.renderConsultTableOnly=function(){
 const result=prevTable.apply(this,arguments);addTableButtons();return result;
};
const prevEdit=window.editConsult;
window.editConsult=function(id){
 const result=prevEdit.apply(this,arguments);
 const foot=document.querySelector('#modal .mf');
 if(!foot||foot.querySelector('[data-hsj-whatsapp]'))return result;
 const x=S.rows.find(r=>r.id===id);
 if(!x)return result;
 const btn=document.createElement('button');btn.type='button';btn.className='btn';
 btn.dataset.hsjWhatsapp='1';btn.textContent='📲 Enviar agendamento pelo WhatsApp';
 btn.onclick=()=>{
 const date=document.getElementById('f_consultation_date')?.value;
 const time=document.getElementById('f_consultation_time')?.value;
 if(!date||!time)return alert('Informe e salve a data e o horário da consulta para enviar pelo WhatsApp.');
 if(date!==String(x.consultation_date||'').slice(0,10)||time.slice(0,5)!==String(x.consultation_time||'').slice(0,5)){
  return alert('Existem mudanças na data ou horário. Salve o agendamento antes de compartilhar.');
 }
 hsjEnviarConsultaWhatsapp(id);
 };
 foot.insertBefore(btn,foot.firstChild);
 return result;
};
if(S.view==='consulta_preop')addTableButtons();
})();