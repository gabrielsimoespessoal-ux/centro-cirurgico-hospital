(()=>{
if(window.__hsjMaxDuasEtapas20261028)return;
window.__hsjMaxDuasEtapas20261028=true;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
const digits=v=>String(v||'').replace(/\D/g,'');
const identity=(a,b)=>{
 const ac=digits(a.cpf),bc=digits(b.cpf);
 if(ac.length===11&&bc===ac)return true;
 const ai=norm(a.ids),bi=norm(b.ids);
 if(ai&&bi&&ai===bi)return true;
 // Name alone is not enough to safely associate distinct patients.
 return false;
};
const canonicalStage=x=>x.stage==='pendencias'?'fila':String(x.stage||'fila');
const normalView=x=>!['indicadores','satisfacao_indicadores','gerenciador_usuarios'].includes(x);
function occupiedStages(person){
 const found=(S.rows||[]).filter(x=>x.active!==false&&(String(x.id)===String(person.id)||identity(x,person)));
 return [...new Set(found.map(canonicalStage))];
}
// Prevent creation of a third distinct stage for the same CPF or IDS;
// never remove patient records or change historical entries automatically.
const originalSave=window.savePatient;
window.savePatient=async function(id){
 if(!id){
  const person={cpf:document.getElementById('f_cpf')?.value,ids:document.getElementById('f_ids')?.value};
  const matching=(S.rows||[]).filter(x=>x.active!==false&&identity(x,person));
  if(matching.length){
   const stages=[...new Set(matching.map(canonicalStage))];
   alert('Já existe cadastro com o mesmo CPF ou IDS ('+matching.length+' registro(s); etapa(s): '+stages.map(x=>labels[x]||x).join(', ')+'). Utilize o cadastro existente para encaminhar o paciente. Nenhum novo registro foi criado.');
   return;
  }
 }
 return originalSave.apply(this,arguments);
};
// A prior pre-op appointment is historical information, not an open
// operational queue entry. Only show a consultation as an additional
// active view when it does not exceed the two-stage limit.
const oldConsult=window.consultRows;
if(typeof oldConsult==='function')window.consultRows=function(){
 const rows=oldConsult.apply(this,arguments);
 return rows.filter(x=>{
  if(!normalView(S.view))return true;
  if(canonicalStage(x)==='consulta_preop')return true;
  const active=occupiedStages(x);
  // Existing duplicates are not silently edited. Do not add a third
  // appearance through the consultation history shortcut.
  return active.length<=1;
 });
};
// When a record has multiple legacy registrations, only its actual stage
// is used for routing. No automatic merge/deletion.
window.hsjConferirEtapasPaciente20261028=function(id){
 const p=(S.rows||[]).find(x=>String(x.id)===String(id));
 return p?occupiedStages(p):[];
};
})();