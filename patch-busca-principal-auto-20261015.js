(()=>{
if(window.__hsjBuscaPrincipalV1)return;window.__hsjBuscaPrincipalV1=true;
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
const find=q=>(S.rows||[]).filter(x=>[x.patient_name,x.ids,x.cpf].some(v=>normalize(v).includes(q)));
function navigate(x){
 const dest=x.stage==='pendencias'?'fila':x.stage;
 if(typeof window.clearGlobalFiltersV16==='function')window.clearGlobalFiltersV16();
 const tab=[...document.querySelectorAll('#tabs button')].find(b=>(b.getAttribute('onclick')||'').includes("'"+dest+"'"));
 if(tab&&typeof window.setView==='function')window.setView(dest,tab);
 else{S.view=dest;renderTabs();renderCurrent();}
 const el=document.getElementById('gfName');if(el)el.value=x.patient_name||'';
 // Aplicar filtro à aba que acabou de ser aberta, depois da navegação.
 S.appliedGlobalFilters={q:normalize(x.patient_name),doctor:'',procedure:'',from:'',to:'',specialty:'',status:''};
 renderCurrent();
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',(b.getAttribute('onclick')||'').includes("'"+dest+"'")));
 const rows=[...document.querySelectorAll('#content tbody tr')];
 const matching=rows.find(tr=>[...tr.querySelectorAll('td')].some(td=>normalize(td.textContent)===normalize(x.patient_name)));
 if(matching){matching.style.outline='3px solid #2563eb';matching.style.outlineOffset='-3px';matching.scrollIntoView({behavior:'smooth',block:'center'});}
 else document.getElementById('content')?.scrollIntoView({behavior:'smooth',block:'start'});
}
const prior=window.applyGlobalFiltersV16;
window.applyGlobalFiltersV16=function(){
 const q=normalize(document.getElementById('gfName')?.value);
 if(q){
  const results=find(q),exact=results.filter(x=>[x.patient_name,x.ids,x.cpf].some(v=>normalize(v)===q));
  const chosen=exact.length===1?exact[0]:results.length===1?results[0]:null;
  if(chosen){navigate(chosen);return;}
  if(results.length>1){
   alert('Foram encontrados '+results.length+' registros correspondentes. Informe o nome completo, CPF ou IDS para identificar o paciente sem ambiguidade.');return;
  }
 }
 return prior?.apply(this,arguments);
};
// Reassociar eventos: o patch antigo atribuiu onclick à função anterior, e a troca da função global não muda essa referência.
function bindMainSearch(){
 const button=document.getElementById('gfSearchBtnV16');
 if(button){button.onclick=()=>window.applyGlobalFiltersV16();button.setAttribute('data-auto-nav','1');}
 const input=document.getElementById('gfName');
 if(input&&!input.dataset.hsjEnterNavigation){
  input.dataset.hsjEnterNavigation='1';
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();window.applyGlobalFiltersV16();}},true);
 }
}
bindMainSearch();setTimeout(bindMainSearch,300);setTimeout(bindMainSearch,1200);
// As demais opções de filtro mantêm o comportamento original quando não há identificação única.
})();