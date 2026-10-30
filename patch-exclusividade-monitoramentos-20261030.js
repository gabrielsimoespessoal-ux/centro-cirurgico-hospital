(()=>{
if(window.__hsjExclusiveStage20261030)return;
window.__hsjExclusiveStage20261030=true;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const monitors=new Set(['supervisao','avaliacao_enfermeiro','monitoramento_administrativo']);
let pending=[],loaded=false;
const info=()=>pending.filter(r=>r.status==='aguardando');
const activeFor=id=>info().filter(r=>String(r.surgery_id)===String(id));
const firstFor=id=>activeFor(id).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at))||String(a.id).localeCompare(String(b.id)))[0];
async function fetchPending(){
 const [sup,adm,claims]=await Promise.allSettled([
  api('/rest/v1/supervision_referrals?select=*&status=eq.aguardando&limit=5000'),
  api('/rest/v1/administrative_referrals?select=*&status=eq.aguardando&limit=5000'),
  api('/rest/v1/monitoring_claims_hsj?select=*&status=eq.aguardando&limit=5000')
 ]);
 const results=[sup,adm,claims],tables=['supervision_referrals','administrative_referrals','monitoring_claims_hsj'];
 if(results.some(x=>x.status!=='fulfilled')){loaded=false;console.warn('Não foi possível auditar todos os monitoramentos; movimentação bloqueada até sincronizar.',results);return}
 pending=results.flatMap((x,i)=>(Array.isArray(x.value)?x.value:[]).map(r=>({...r,__table:tables[i],__dest:i===2?(r.monitor_type==='enfermeiro'?'avaliacao_enfermeiro':r.monitor_type==='administrativo'?'monitoramento_administrativo':r.monitor_type):i===1?'monitoramento_administrativo':r.destination})));
 loaded=true;
}
const prevLoad=window.load;
window.load=async function(){const result=await prevLoad.apply(this,arguments);await fetchPending();return result};
const oldFiltered=window.filtered;
window.filtered=function(rows){
 const out=oldFiltered.apply(this,arguments);
 if(!Array.isArray(out)||monitors.has(S.view)||['indicadores','satisfacao_indicadores','gerenciador_usuarios'].includes(S.view))return out;
 return out.filter(x=>!firstFor(x.id));
};
function cleanInbox(){
 if(!monitors.has(S.view))return;
 const root=document.getElementById('content');if(!root)return;
 let collisions=0;
 root.querySelectorAll('button[onclick*="openResolveV18("],button[onclick*="hsjResponderAdminV26("],button[onclick*="hsjRespondClaim("]').forEach(btn=>{
  const raw=btn.getAttribute('onclick')||'';
  const id=raw.match(/'([0-9a-f-]{36})'/i)?.[1];
  const r=pending.find(v=>v.id===id);
  if(!r)return;
  const first=firstFor(r.surgery_id);
  const tr=btn.closest('tr');
  if(!tr)return;
  if(first && first.id!==r.id){tr.remove();collisions++;return}
  if(activeFor(r.surgery_id).length>1&&!tr.querySelector('[data-hsj-other-pending]')){
   const label=document.createElement('div');label.dataset.hsjOtherPending='1';label.className='sub';
   label.textContent='⚠ Há outro encaminhamento pendente, preservado no histórico. Ele ficará disponível após esta tratativa.';
   btn.parentElement.appendChild(label);
  }
 });
 if(collisions){const e=document.createElement('div');e.className='notice';e.style.margin='8px 0';e.textContent='⚠ '+collisions+' encaminhamento(s) simultâneo(s) aguardando a conclusão do atendimento prioritário. Nenhum registro foi excluído.';root.prepend(e)}
}
function orphanButtons(){
 if(!monitors.has(S.view))return;
 document.querySelectorAll('#content tr').forEach(tr=>{
  const txt=tr.textContent||'';
  if(!/Paciente não encontrado|Atendimento não localizado|Não encontrado/i.test(txt)||tr.dataset.hsjCheckingOrphan)return;
  const on=[...tr.querySelectorAll('[onclick]')].map(x=>x.getAttribute('onclick')||'').join(' ');
  const id=on.match(/(?:openResolveV18|hsjResponderAdminV26|hsjRespondClaim)\('([0-9a-f-]{36})'\)/)?.[1];
  const r=pending.find(x=>x.id===id);
  if(!r)return;
  tr.dataset.hsjCheckingOrphan='1';
  api('/rest/v1/surgeries?select=id,patient_name,active&id=eq.'+encodeURIComponent(r.surgery_id)+'&limit=1').then(found=>{
   if(!tr.isConnected)return;
   if(found?.length){
    const name=tr.querySelector('td:first-child b');
    if(name)name.textContent=found[0].patient_name||'Paciente cadastrado';
    if(!tr.querySelector('[data-hsj-go-patient]')){
     const btn=document.createElement('button');btn.type='button';btn.className='btn small';
     btn.textContent='👤 Consultar cadastro';btn.dataset.hsjGoPatient='1';
     btn.onclick=()=>window.hsjConsultarCadastroV24?.(found[0].id);
     tr.lastElementChild?.append(btn);
    }
    return;
   }
   if(tr.querySelector('[data-hsj-apagar-orphan]'))return;
   const btn=document.createElement('button');btn.type='button';btn.className='btn small red';
   btn.textContent='🗑 Apagar';btn.dataset.hsjApagarOrphan='1';btn.style.margin='5px';
   btn.onclick=()=>window.hsjApagarOrfao20261030(id);
   tr.lastElementChild?.append(btn);
  }).catch(e=>{delete tr.dataset.hsjCheckingOrphan;console.warn('Verificação do cadastro falhou',e)});
 });
}
window.hsjApagarOrfao20261030(id);
  tr.lastElementChild?.append(b);
 });
}
window.hsjApagarOrfao20261030=async function(id){
 const r=pending.find(x=>x.id===id);
 if(!r||!UUID.test(id))return alert('Encaminhamento não localizado.');
 try{
  const patient=await api('/rest/v1/surgeries?select=id,patient_name,active&id=eq.'+encodeURIComponent(r.surgery_id)+'&limit=1');
  if(patient.length)return alert('Este encaminhamento possui um cadastro no banco ('+patient[0].patient_name+'). Não pode ser apagado como órfão. Atualize a tela para localizar o paciente.');
  if(!confirm('Apagar SOMENTE o encaminhamento sem cadastro? Esta ação é irreversível. Nenhum outro paciente será alterado.'))return;
  const deleted=await api('/rest/v1/'+r.__table+'?id=eq.'+encodeURIComponent(r.id)+'&status=eq.aguardando',{method:'DELETE',headers:{Prefer:'return=representation'}});
  if(!Array.isArray(deleted)||deleted.length!==1)throw Error('O banco não confirmou a exclusão. Verifique as permissões ou se o registro já foi alterado.');
  await load();renderCurrent();alert('Encaminhamento órfão apagado.');
 }catch(e){alert('Não foi possível apagar: '+e.message)}
};
async function guard(id){
 if(!loaded){await fetchPending();if(!loaded){alert('Não foi possível verificar a exclusividade entre as etapas. Tente novamente após sincronizar.');return false}}
 const other=activeFor(id);
 if(other.length){alert('Este paciente já possui '+other.length+' monitoramento(s) pendente(s). Conclua a tratativa antes de abrir outro; os registros anteriores foram preservados.');return false}
 return true;
}
const saveRef=window.saveReferralV18;
if(typeof saveRef==='function')window.saveReferralV18=async function(id){if(!(await guard(id)))return;const r=await saveRef.apply(this,arguments);await fetchPending();renderCurrent();return r};
const saveAdm=window.hsjSalvarAdminV26;
if(typeof saveAdm==='function')window.hsjSalvarAdminV26=async function(id){if(!(await guard(id)))return;const r=await saveAdm.apply(this,arguments);await fetchPending();renderCurrent();return r};
const create=window.hsjCreateClaim;
if(typeof create==='function')window.hsjCreateClaim=async function(){const id=document.getElementById('hsjClaimId')?.value;if(id&&!(await guard(id)))return;const r=await create.apply(this,arguments);await fetchPending();renderCurrent();return r};
const prevRender=window.renderCurrent;
window.renderCurrent=function(){const r=prevRender.apply(this,arguments);cleanInbox();orphanButtons();return r};
fetchPending().then(()=>{if(S?.view)renderCurrent()}).catch(console.warn);
})();
