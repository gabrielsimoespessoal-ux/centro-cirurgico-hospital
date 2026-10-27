(()=>{
if(window.__hsjCampoResponsavel20261027)return;
window.__hsjCampoResponsavel20261027=true;
function ensure(){
 const modal=document.querySelector('#modal .modal');
 if(!modal)return;
 const grid=modal.querySelector('.mb .grid');
 if(!grid)return;
 const existing=modal.querySelector('#f_registration_professional');
 if(existing)return;
 const title=modal.querySelector('.mh')?.textContent||'';
 const isNew=/Novo Paciente/i.test(title);
 const box=document.createElement('div');box.className='field span2';box.dataset.responsavelCadastro='1';
 const label=document.createElement('label');label.htmlFor='f_registration_professional';label.textContent='PROFISSIONAL RESPONSÁVEL PELO CADASTRO'+(isNew?' *':'');
 const input=document.createElement('input');input.id='f_registration_professional';input.name='registration_professional';input.type='text';input.autocomplete='name';input.placeholder='Digite o nome completo do profissional';
 input.style.width='100%';
 const save=modal.querySelector('.mf button[onclick*="savePatient"]');
 const id=(save?.getAttribute('onclick')||'').match(/savePatient\\(['\"]([^'\"]+)['\"]\\)/)?.[1];
 if(id&&typeof S!=='undefined')input.value=(S.rows||[]).find(row=>String(row.id)===String(id))?.registration_professional||'';
 box.append(label,input);
 const anchor=grid.querySelector('#f_specialty')?.closest('.field');
 if(anchor)anchor.insertAdjacentElement('afterend',box);else grid.appendChild(box);
}
const root=document.getElementById('modal');
if(root){
 const observer=new MutationObserver(()=>ensure());
 observer.observe(root,{subtree:true,childList:true});
}
ensure();
document.addEventListener('click',e=>{
 const button=e.target.closest('button');
 if(!button||!document.querySelector('#modal .modal'))return;
 if(/Gravar Alterações|Salvar/i.test(button.textContent||''))ensure();
},true);
})();