(()=>{
if(window.__hsjResponsavelEncaminhamento20261028)return;
window.__hsjResponsavelEncaminhamento20261028=true;
const oldOpen=window.openReferralV18;
const oldSave=window.saveReferralV18;
if(typeof oldOpen!=='function'||typeof oldSave!=='function')return;
function ensureField(){
 const modal=document.querySelector('#modal .modal');
 const reason=modal?.querySelector('#refReasonV18');
 if(!reason)return;
 let input=modal.querySelector('#hsjReferralProfessional');
 if(input)return;
 const holder=document.createElement('div');
 holder.className='field';
 holder.dataset.hsjResponsibleReferral='1';
 const label=document.createElement('label');
 label.htmlFor='hsjReferralProfessional';
 label.textContent='Nome do profissional que está encaminhando *';
 input=document.createElement('input');
 input.type='text';input.id='hsjReferralProfessional';input.required=true;
 input.maxLength=150;input.autocomplete='name';
 input.placeholder='Digite o nome completo do responsável';
 holder.append(label,input);
 reason.closest('.field').before(holder);
}
window.openReferralV18=function(...args){
 const result=oldOpen.apply(this,args);
 ensureField();
 return result;
};
window.saveReferralV18=async function(...args){
 ensureField();
 const input=document.getElementById('hsjReferralProfessional');
 const professional=(input?.value||'').trim().replace(/\s+/g,' ');
 if(!professional){alert('O nome de quem está encaminhando o monitoramento é obrigatório.');input?.focus();return}
 if(professional.length<3){alert('Informe o nome completo do profissional responsável pelo encaminhamento.');input?.focus();return}
 const reason=document.getElementById('refReasonV18');
 if(!reason?.value.trim()){alert('A justificativa escrita é obrigatória.');reason?.focus();return}
 // Persist alongside the existing mandatory reason, which is already
 // retained and displayed in the supervision history; no database migration.
 const original=reason.value;
 reason.value='Encaminhado por: '+professional+'\nJustificativa: '+original.trim();
 try{return await oldSave.apply(this,args)}
 finally{if(reason.isConnected)reason.value=original}
};
})();