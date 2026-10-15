(()=>{
 if(window.__hsjBuscaAuto20261015)return;
 window.__hsjBuscaAuto20261015=true;
 const oldSearch=window.hsjPesquisarPaciente20261015;
 const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
 const stage=x=>x.stage==='pendencias'?'fila':x.stage;
 function navigate(x){
  const target=stage(x);
  if(typeof window.clearGlobalFiltersV16==='function')window.clearGlobalFiltersV16();
  const control=[...document.querySelectorAll('#tabs button')].find(b=>(b.getAttribute('onclick')||'').includes("'"+target+"'"));
  if(control&&typeof window.setView==='function')window.setView(target,control);
  else{S.view=target;renderTabs();renderCurrent();}
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',(b.getAttribute('onclick')||'').includes("'"+target+"'")));
  const result=document.getElementById('hsjBuscaResultados20261015');
  if(result)result.innerHTML='<div class="notice"><b>Paciente localizado:</b> '+esc(x.patient_name)+' — '+esc(labels[target]||target)+'. A aba correspondente foi aberta automaticamente.</div>';
  const table=document.getElementById('content');
  if(table){
   const targetName=normal(x.patient_name);
   const rows=[...table.querySelectorAll('tbody tr')];
   const row=rows.find(tr=>[...tr.querySelectorAll('td')].some(td=>normal(td.textContent)===targetName));
   if(row){row.style.outline='3px solid #2563eb';row.style.outlineOffset='-3px';row.scrollIntoView({behavior:'smooth',block:'center'});}
   else table.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
 window.hsjPesquisarPaciente20261015=function(){
  const input=document.getElementById('hsjBuscaLocal20261015');
  const q=normal(input?.value);
  if(!q){oldSearch?.();return;}
  const records=(S.rows||[]).filter(x=>[x.patient_name,x.cpf,x.ids].some(v=>normal(v).includes(q)));
  if(records.length===1){navigate(records[0]);return;}
  const exact=records.filter(x=>[x.patient_name,x.cpf,x.ids].some(v=>normal(v)===q));
  if(exact.length===1){navigate(exact[0]);return;}
  oldSearch?.();
  if(records.length>1){
   const target=document.getElementById('hsjBuscaResultados20261015');
   if(target)target.insertAdjacentHTML('afterbegin','<div class="notice"><b>'+records.length+' registros encontrados.</b> Selecione o paciente correto para evitar abrir um homônimo.</div>');
  }
 };
 const input=document.getElementById('hsjBuscaLocal20261015');
 if(input){input.placeholder='Nome, CPF ou IDS — pesquisar abre a aba automaticamente';}
})();