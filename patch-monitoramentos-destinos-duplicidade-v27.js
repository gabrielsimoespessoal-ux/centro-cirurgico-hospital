(()=>{
if(window.__hsjMonitorRoutesV27)return;window.__hsjMonitorRoutesV27=true;
const onlyTabs=()=>[...document.querySelectorAll('#tabs .tab')].map(b=>({name:b.textContent.trim(),value:(b.getAttribute('onclick')||'').match(/setView\('([^']+)'/)?.[1]|| (b.dataset.supervisao!==undefined?'supervisao':b.dataset.adminMonitor!==undefined?'administrativo':null)})).filter(x=>x.value&&x.value!=='indicadores'&&x.value!=='gerenciador_usuarios');
const dup=a=>(S.rows||[]).filter(b=>b.id!==a.id&&(a.cpf&&String(a.cpf).replace(/\D/g,'').length===11&&String(a.cpf).replace(/\D/g,'')===String(b.cpf||'').replace(/\D/g,'')||a.ids&&String(a.ids).trim()===String(b.ids||'').trim()||a.patient_name&&b.patient_name&&a.patient_name.trim().toLocaleLowerCase('pt-BR')===b.patient_name.trim().toLocaleLowerCase('pt-BR')&&a.birth_date&&a.birth_date===b.birth_date));
function duplicates(){
 const tb=document.querySelector('#hsjBuscaResultados20261015 tbody');if(!tb)return;
 tb.querySelectorAll('tr').forEach(tr=>{
  if(tr.querySelector('[data-v27-dup]')||tr.querySelector('[data-hsj-dup-delete]'))return;
  const markup=tr.innerHTML;
  const id=markup.match(/hsjAbrirLocalizacao20261015\('([0-9a-f-]{36})'\)/)?.[1];
  const x=S.rows.find(y=>y.id===id);if(!x||!dup(x).length)return;
  const td=tr.lastElementChild;if(!td)return;
  const button=document.createElement('button');button.className='btn small';button.type='button';button.dataset.v27Dup='1';button.textContent='🗑 Excluir duplicidade';button.style.cssText='margin:3px;color:#a32727;border:1px solid #efaaaa';
  button.onclick=()=>window.hsjExcluirDuplicidadeV22(id);td.append(' ',button);
 });
}
function monitoring(){
 if(!['supervisao','avaliacao_enfermeiro','monitoramento_administrativo'].includes(S.view))return;
 const root=document.getElementById('content');if(!root)return;
 root.querySelectorAll('tbody tr').forEach(tr=>{
  const td=tr.lastElementChild;if(!td||td.querySelector('[data-v27-route]'))return;
  const onclicks=[...tr.querySelectorAll('[onclick]')].map(e=>e.getAttribute('onclick')||'').join(' ');
  let id=onclicks.match(/hsjConsultarCadastroV24\('([0-9a-f-]{36})'\)/)?.[1]||onclicks.match(/(?:editNurseV10|editNurse|editPatient)\('([0-9a-f-]{36})'\)/)?.[1];
  if(!id){
   const name=tr.querySelector('td b')?.textContent?.trim();
   const matches=(S.rows||[]).filter(x=>x.patient_name?.trim()===name);
   if(matches.length===1)id=matches[0].id;
  }
  if(!id||!S.rows.some(x=>x.id===id))return;
  const btn=document.createElement('button');btn.type='button';btn.className='btn small';btn.dataset.v27Route='1';btn.textContent='↪ Encaminhar para aba';btn.style.margin='4px';
  btn.onclick=()=>hsjEscolherEtapaV26(id);td.append(' ',btn);
 });
}
const prevSearch=window.hsjPesquisarPaciente20261015;
window.hsjPesquisarPaciente20261015=function(){const r=prevSearch?.apply(this,arguments);duplicates();return r};
const prevRender=window.renderCurrent;
window.renderCurrent=function(){const r=prevRender.apply(this,arguments);monitoring();duplicates();return r};
const prevResolve=window.openResolveV18;
window.openResolveV18=function(id){
 const result=prevResolve?.apply(this,arguments);
 const select=document.getElementById('refReturnV18');
 if(select){
  const before=select.value;const available=onlyTabs().filter(x=>x.value!=='avaliacao_enfermeiro');
  select.replaceChildren(...available.map(x=>{const o=document.createElement('option');o.value=x.value;o.textContent=x.name;return o}));
  if(available.some(x=>x.value===before))select.value=before;
  select.dataset.monitorRouteV28='1';
 }
 return result;
};
const previousResolveReferral=window.resolveReferralV18;
window.resolveReferralV18=async function(id){
 const destination=document.getElementById('refReturnV18')?.value;
 if(destination!=='supervisao'&&destination!=='administrativo')return previousResolveReferral.apply(this,arguments);
 const response=document.getElementById('refResolutionV18')?.value?.trim();
 if(!response)return alert('Preencha a tratativa / resposta antes de encaminhar.');
 if(!confirm('Responder e encaminhar ao '+(destination==='supervisao'?'Monitoramento Supervisão':'Monitoramento Administrativo')+'? O paciente permanecerá na etapa atual.'))return;
 try{
  await api('/rest/v1/rpc/forward_supervision_monitoring',{method:'POST',body:JSON.stringify({p_referral_id:id,p_resolution:response,p_destination:destination})});
  document.getElementById('modal').innerHTML='';
  await load();renderTabs();renderCurrent();
  alert('Resposta e novo encaminhamento registrados.');
 }catch(e){alert('Encaminhamento não confirmado: '+e.message)}
};
duplicates();monitoring();
})();