(()=>{
// v16: filtros gerais só são aplicados após clicar em Pesquisar.
S.appliedGlobalFilters=S.appliedGlobalFilters||{q:'',doctor:'',procedure:'',from:'',to:'',specialty:'',status:''};

const dateFieldsV16=['surgery_date','consultation_date','appointment_date','programming_date','authorization_date','aih_request_date','ids_register_date','reschedule_date','double_j_insert_date'];

function readGlobalFiltersV16(){
  return {
    q:(document.getElementById('gfName')?.value||'').trim().toLowerCase(),
    doctor:document.getElementById('gfDoctor')?.value||'',
    procedure:(document.getElementById('gfProcedure')?.value||'').trim().toLowerCase(),
    from:document.getElementById('gfDateFrom')?.value||'',
    to:document.getElementById('gfDateTo')?.value||'',
    specialty:document.getElementById('gfSpecialty')?.value||'',
    status:document.getElementById('gfStatus')?.value||''
  };
}

window.applyGlobalFiltersV16=function(){
  S.appliedGlobalFilters=readGlobalFiltersV16();
  renderCurrent();
};
window.clearGlobalFiltersV16=function(){
  ['gfName','gfDoctor','gfProcedure','gfDateFrom','gfDateTo','gfSpecialty','gfStatus'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  S.appliedGlobalFilters={q:'',doctor:'',procedure:'',from:'',to:'',specialty:'',status:''};
  renderCurrent();
};

window.filtered=function(rows){
  const f=S.appliedGlobalFilters||{};
  return rows.filter(x=>{
    const dates=dateFieldsV16.map(k=>String(x[k]||'').slice(0,10)).filter(Boolean);
    const dateOk=(!f.from&&!f.to)||dates.some(dt=>(!f.from||dt>=f.from)&&(!f.to||dt<=f.to));
    return (!f.q||[x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLowerCase().includes(f.q)))
      &&(!f.doctor||x.surgeon===f.doctor)
      &&(!f.procedure||String(x.procedure_name||'').toLowerCase().includes(f.procedure))
      &&(!f.specialty||x.specialty===f.specialty)
      &&(!f.status||x.patient_status===f.status)
      &&dateOk;
  });
};

function setupGlobalSearchV16(){
  const box=document.querySelector('.filterbar .filters');if(!box)return;
  const ids=['gfName','gfDoctor','gfProcedure','gfDateFrom','gfDateTo','gfSpecialty','gfStatus'];
  ids.forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    el.removeAttribute('oninput');el.removeAttribute('onchange');
    el.oninput=null;el.onchange=null;
    el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyGlobalFiltersV16();}});
  });
  if(!document.getElementById('gfSearchBtnV16')){
    const btn=document.createElement('button');btn.id='gfSearchBtnV16';btn.className='btn primary';btn.type='button';btn.innerHTML='🔎 Pesquisar';btn.onclick=applyGlobalFiltersV16;box.appendChild(btn);
    const clear=document.createElement('button');clear.id='gfClearBtnV16';clear.className='btn';clear.type='button';clear.textContent='Limpar';clear.onclick=clearGlobalFiltersV16;box.appendChild(clear);
    box.style.gridTemplateColumns='2fr 1.4fr 1.4fr 1fr 1fr 1fr 1fr auto auto';
  }
}

// O patch de período pode criar os campos depois do boot; configuramos agora e também após pequenas renderizações.
setupGlobalSearchV16();
setTimeout(setupGlobalSearchV16,250);
setTimeout(setupGlobalSearchV16,900);
})();
