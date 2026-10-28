(()=>{
if(window.__hsjResponsavelConsultaFix20261028)return;
window.__hsjResponsavelConsultaFix20261028=true;
const previousSave=window.saveConsult;
let saving=false;
window.saveConsult=async function(id){
 if(saving)return;
 const field=document.getElementById('f_registration_professional');
 const responsible=field?.value?.trim()||'';
 const original=(S.rows||[]).find(r=>String(r.id)===String(id));
 if(!original)return alert('Cadastro não localizado. Atualize a página e tente novamente.');
 if(!responsible)return alert('Preencha o nome completo do profissional responsável pelo cadastro antes de salvar.');
 saving=true;
 try{
  // Grava o campo que é exibido no agendamento mas era omitido pelo salvamento original.
  await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id),{
   method:'PATCH',headers:{Prefer:'return=representation'},
   body:JSON.stringify({registration_professional:responsible,updated_by:uid})
  });
  // O salvamento original preserva data, horário, especialidade e demais campos da consulta.
  await previousSave.call(this,id);
 }catch(e){
  console.error('Erro ao salvar profissional da consulta',e);
  alert('Não foi possível salvar o profissional responsável: '+(e?.message||e));
 }finally{saving=false}
};
const previousSend=window.hsjEnviarConsultaWhatsapp;
window.hsjEnviarConsultaWhatsapp=function(id,draft={}){
 const x=(S.rows||[]).find(r=>String(r.id)===String(id));
 if(!x)return previousSend.call(this,id,draft);
 const professional=String(
  document.getElementById('f_registration_professional')?.value||
  x.registration_professional||x.appointment_responsible||''
 ).trim();
 // Usa a mesma composição do lembrete original, acrescentando somente o profissional.
 // O profissional é adicionado ao campo que a mensagem já possui como responsável
 // pela consulta, sem mexer nos dados persistidos.
 const actual={...draft};
 const originalOpen=window.open;
 let restored=false;
 try{
  window.open=function(url,target,features){
   if(!professional||typeof url!=='string'||!url.includes('wa.me/'))return originalOpen.call(window,url,target,features);
   try{
    const link=new URL(url);
    const message=link.searchParams.get('text')||'';
    if(!message.includes('Profissional responsável pelo agendamento:')){
     const marker='Em caso de dúvidas, entre em contato com nossa equipe.';
     const line='*Profissional responsável pelo agendamento:* '+professional;
     link.searchParams.set('text',message.includes(marker)?message.replace(marker,line+'\\n\\n'+marker):message+'\\n'+line);
    }
    return originalOpen.call(window,link.toString(),target,features);
   }catch(e){return originalOpen.call(window,url,target,features)}
  };
  return previousSend.call(this,id,actual);
 }finally{window.open=originalOpen;restored=true}
};
})();
