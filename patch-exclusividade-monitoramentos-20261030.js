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
 root.querySelectorAll('button[onclick*="openResolveV18("],button[onclick*="hsjResponderAdminV26("],button[onclick*="hsjRespondClaim("]').forEach(btn=>{
  const raw=btn.getAttribute('onclick')||'';
  const id=raw.match(/'([0-9a-f-]{36})'/i)?.[1];
  const r=pending.find(v=>v.id===id);
  if(!r)return;
  const tr=btn.closest('tr');
  if(!tr)return;
  const items=activeFor(r.surgery_id);
  if(items.length>1&&!tr.querySelector('[data-hsj-resolve-duplicate]')){
   const label=document.createElement('div');label.className='sub';label.style.color='#a05200';
   label.textContent='⚠ DUPLICIDADE: '+items.length+' encaminhamentos ativos para o mesmo paciente.';
   const choose=document.createElement('button');choose.type='button';choose.className='btn small';
   choose.dataset.hsjResolveDuplicate='1';choose.textContent='Escolher onde permanecer';
   choose.style.margin='4px';
   choose.onclick=()=>window.hsjEscolherMonitorUnico20261030(r.surgery_id);
   btn.parentElement.append(label,choose);
  }
 });
}
window.hsjEscolherMonitorUnico20261030=function(patientId){
 const items=activeFor(patientId);
 const patient=S.rows.find(x=>String(x.id)===String(patientId));
 if(items.length<2)return alert('Não há mais encaminhamentos simultâneos para este paciente.');
 const safe=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
 const names={avaliacao_enfermeiro:'Monitoramento Enfermeiro',supervisao:'Monitoramento Supervisão',monitoramento_administrativo:'Monitoramento Administrativo'};
 const choices=items.map(r=>'<label style="display:block;border:1px solid #d6dfed;border-radius:7px;padding:12px;margin:8px 0"><input type="radio" name="hsjChooseMonitor" value="'+safe(r.id)+'"> <b>'+safe(names[r.__dest]||r.__dest)+'</b><div class="sub">'+safe(r.reason||'')+'</div></label>').join('');
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal"><div class="mh"><b>⚠ Encaminhamentos duplicados — '+safe(patient?.patient_name||patientId)+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><p>Escolha o único monitoramento que deverá permanecer ativo. Os demais serão encerrados administrativamente por duplicidade, com justificativa e histórico preservados. Isso não equivale a uma resposta clínica.</p>'+choices+'</div><div class="mf"><button class="btn primary" onclick="hsjConfirmarMonitorUnico20261030(\''+safe(patientId)+'\')">Confirmar permanência</button></div></div></div>';
};
window.hsjConfirmarMonitorUnico20261030=async function(patientId){
 const selected=document.querySelector('input[name="hsjChooseMonitor"]:checked')?.value;
 if(!selected)return alert('Selecione o monitoramento que deverá permanecer.');
 const items=activeFor(patientId),remaining=items.filter(x=>x.id!==selected);
 if(!items.some(x=>x.id===selected)||!remaining.length)return alert('Atualize e revise os encaminhamentos.');
 if(remaining.some(x=>x.__table!=='supervision_referrals'))return alert('Há encaminhamentos em outros tipos de monitoramento. Para evitar encerramento parcial, essa combinação requer validação adicional no banco.');
 if(!confirm('Manter apenas a etapa selecionada? Os outros '+remaining.length+' encaminhamento(s) serão encerrados administrativamente, sem apagar o histórico.'))return;
 try{
  for(const r of remaining){
   const patient=S.rows.find(x=>String(x.id)===String(patientId));
   const update={status:'respondido',resolution:'Encerrado administrativamente por duplicidade de encaminhamento, a pedido do operador. Sem tratativa clínica. Mantido encaminhamento '+selected+'.',return_stage:patient?.stage||r.origin_stage||'fila',resolved_at:new Date().toISOString(),resolved_by:uid};
   const rows=await api('/rest/v1/supervision_referrals?id=eq.'+encodeURIComponent(r.id)+'&status=eq.aguardando',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(update)});
   if(!Array.isArray(rows)||rows.length!==1)throw Error('Não foi possível confirmar o encerramento do encaminhamento '+r.id);
  }
  document.getElementById('modal').innerHTML='';
  await load();renderCurrent();alert('Duplicidade regularizada. Apenas o monitoramento escolhido permanece pendente.');
 }catch(e){await load();renderCurrent();alert('Falha ao regularizar: '+e.message+'. Confira o resultado antes de repetir.')}
};
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
   }
   if(tr.querySelector('[data-hsj-apagar-orphan]'))return;
   const btn=document.createElement('button');btn.type='button';btn.className='btn small red';
   btn.textContent='🗑 Apagar';btn.dataset.hsjApagarOrphan='1';btn.style.margin='5px';
   btn.onclick=()=>window.hsjApagarOrfao20261030(id);
   tr.lastElementChild?.append(btn);
  }).catch(e=>{delete tr.dataset.hsjCheckingOrphan;console.warn('Verificação do cadastro falhou',e)});
 });
}
window.hsjApagarOrfao20261030=async function(id){
 const r=pending.find(x=>x.id===id);
 if(!r||!UUID.test(id))return alert('Encaminhamento não localizado.');
 if(!confirm('Retirar somente este encaminhamento da lista de pendentes? O cadastro do paciente NÃO será excluído. O histórico será preservado com registro de cancelamento administrativo.'))return;
 try{
  if(r.__table!=='supervision_referrals')return alert('Este tipo de registro requer verificação específica antes da remoção.');
  const patient=S.rows.find(x=>String(x.id)===String(r.surgery_id));
  const update={status:'respondido',resolution:'Cancelado administrativamente por registro apresentado como Paciente não encontrado. Não houve tratativa clínica. Cadastro do paciente preservado.',return_stage:patient?.stage||r.origin_stage||'fila',resolved_at:new Date().toISOString(),resolved_by:uid};
  const result=await api('/rest/v1/supervision_referrals?id=eq.'+encodeURIComponent(r.id)+'&status=eq.aguardando',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(update)});
  if(!Array.isArray(result)||result.length!==1)throw Error('O banco não confirmou o cancelamento.');
  await load();renderCurrent();alert('Encaminhamento retirado dos pendentes. Cadastro preservado.');
 }catch(e){alert('Não foi possível retirar o encaminhamento: '+e.message)}
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
