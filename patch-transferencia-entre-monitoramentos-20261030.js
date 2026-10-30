(()=>{
if(window.__hsjTransferMonitor20261030)return;window.__hsjTransferMonitor20261030=true;
const destinations=[['supervisao','Monitoramento Supervisão'],['avaliacao_enfermeiro','Monitoramento Enfermeiro'],['monitoramento_administrativo','Monitoramento Administrativo']];
const srcs=['supervision_referrals','administrative_referrals','monitoring_claims_hsj'];
const addOptions=(id)=>{
 const el=document.getElementById(id);if(!el)return;
 const current=el.value;
 for(const [value,label] of destinations)if(![...el.options].some(o=>o.value===value)){const o=document.createElement('option');o.value=value;o.textContent=label;el.add(o)}
 if([...el.options].some(o=>o.value===current))el.value=current;
};
const monitor=v=>destinations.some(([id])=>id===v)||v==='administrativo';
const standard=v=>v==='administrativo'?'monitoramento_administrativo':v;
const names=v=>destinations.find(([id])=>id===standard(v))?.[1]||v;
let running=false;
async function transfer(table,id,value,field){
 const destination=standard(value),reason=document.getElementById(field)?.value?.trim();
 if(!reason)return alert('A resposta e justificativa são obrigatórias.');
 if(running)return;
 if(!confirm('Encaminhar ao '+names(destination)+'? A pendência da equipe de origem será concluída, o histórico será preservado e não haverá duplicidade.'))return;
 running=true;
 try{
  await api('/rest/v1/rpc/hsj_transferir_monitoramento_entre_equipes',{method:'POST',body:JSON.stringify({p_origem:table,p_id:id,p_destino:destination,p_resposta:reason,p_usuario:uid})});
  document.getElementById('modal').innerHTML='';
  await load();renderTabs();renderCurrent();
  alert('Encaminhamento concluído. O paciente passou para '+names(destination)+'.');
 }catch(e){alert('Não foi possível transferir. Nenhum novo encaminhamento deve ser criado manualmente até conferir a pendência: '+e.message)}
 finally{running=false}
}
const openSup=window.openResolveV18;
window.openResolveV18=function(){const r=openSup?.apply(this,arguments);addOptions('refReturnV18');return r};
const doneSup=window.resolveReferralV18;
window.resolveReferralV18=async function(id){
 const dest=document.getElementById('refReturnV18')?.value;
 if(monitor(dest))return transfer(srcs[0],id,dest,'refResolutionV18');
 return doneSup.apply(this,arguments);
};
const openAdmin=window.hsjResponderAdminV26;
window.hsjResponderAdminV26=function(){const r=openAdmin?.apply(this,arguments);addOptions('hsjAdminReturnV26');return r};
const doneAdmin=window.hsjConcluirAdminV26;
window.hsjConcluirAdminV26=async function(id){
 const dest=document.getElementById('hsjAdminReturnV26')?.value;
 if(monitor(dest))return transfer(srcs[1],id,dest,'hsjAdminResolutionV26');
 return doneAdmin.apply(this,arguments);
};
const openClaim=window.hsjRespondClaim;
window.hsjRespondClaim=function(){const r=openClaim?.apply(this,arguments);addOptions('hsjClaimTarget');return r};
const doneClaim=window.hsjFinishClaim;
window.hsjFinishClaim=async function(id){
 const dest=document.getElementById('hsjClaimTarget')?.value;
 if(monitor(dest))return transfer(srcs[2],id,dest,'hsjClaimResponse');
 return doneClaim.apply(this,arguments);
};
})();