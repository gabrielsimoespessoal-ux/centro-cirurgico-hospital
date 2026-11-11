(()=>{
'use strict';
if(window.__hsjSexoObrigatorioFila20261111)return;
window.__hsjSexoObrigatorioFila20261111=true;
const sexoValido=new Set(['Feminino','Masculino','Outro']);
const previousEdit=window.editPatient;
const previousSave=window.savePatient;
if(typeof previousEdit!=='function'||typeof previousSave!=='function'){console.warn('Obrigatoriedade do sexo não instalada: cadastro indisponível.');return;}
window.editPatient=function(id=''){
 const result=previousEdit.apply(this,arguments);
 const current=id?((window.S?.rows||[]).find(x=>String(x.id)===String(id))):null;
 const gender=document.getElementById('f_sex');
 if(gender){
  gender.required=!id;
  gender.setAttribute('aria-required',String(!id));
  gender.setAttribute('autocomplete','sex');
  const field=gender.closest('.field');
  const label=field?.querySelector('label');
  if(label)label.textContent='SEXO'+(!id?' *':'');
  const first=gender.querySelector('option[value=""]');
  if(first)first.textContent=id?'Não informado':'Selecione obrigatoriamente';
  if(!id)gender.value='';
  if(id&&current?.sex&&sexoValido.has(current.sex))gender.value=current.sex;
 }
 return result;
};
window.savePatient=async function(id){
 if(!id){
  const field=document.getElementById('f_sex');
  if(!field||!sexoValido.has(String(field.value||'').trim())){
   alert('Selecione obrigatoriamente o sexo do paciente antes de salvar o cadastro na Fila de Cirurgia.');
   field?.focus();return;
  }
 }
 return previousSave.apply(this,arguments);
};
})();