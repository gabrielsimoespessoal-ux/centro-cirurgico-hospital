(()=>{
if(window.__hsjAntiDupSexoV19)return;window.__hsjAntiDupSexoV19=true;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const digits=v=>String(v||'').replace(/\D/g,'');
function matches(a,b){
 const p=norm(a.procedure_name),q=norm(b.procedure_name);
 if(!p||!q||p!==q)return false;
 if(digits(a.cpf).length===11&&digits(b.cpf)===digits(a.cpf))return true;
 if(String(a.ids||'').trim()&&norm(a.ids)===norm(b.ids))return true;
 return norm(a.patient_name)!==''&&norm(a.patient_name)===norm(b.patient_name)&&(!a.birth_date||!b.birth_date||a.birth_date===b.birth_date);
}
let busy=false,checking=0;
const currentDraft=()=>Object.fromEntries(['patient_name','cpf','ids','procedure_name','birth_date'].map(k=>[k,document.getElementById('f_'+k)?.value||'']));
const oldEdit=window.editPatient;
window.editPatient=function(id=''){
 oldEdit.apply(this,arguments);
 const grid=document.querySelector('#modal .mb .grid');if(!grid)return;
 const x=id?S.rows.find(r=>r.id===id):null;
 const box=document.createElement('div');box.className='field';box.innerHTML='<label>SEXO</label><select id="f_sex"><option value="">Não informado</option><option value="Feminino">Feminino</option><option value="Masculino">Masculino</option><option value="Outro">Outro</option></select>';grid.appendChild(box);
 box.querySelector('select').value=x?.sex||'';
 if(!id){
   const warning=document.createElement('div');warning.id='hsjDupWarning';warning.className='notice';warning.style.margin='12px 0';warning.style.display='none';grid.parentElement.prepend(warning);
   ['patient_name','cpf','ids','procedure_name','birth_date'].forEach(k=>{
     const el=document.getElementById('f_'+k);
     if(el)el.addEventListener('input',()=>{clearTimeout(window.__hsjDupTimer);window.__hsjDupTimer=setTimeout(()=>window.hsjCheckDuplicateV19(),350)});
   });
 }
};
window.hsjCheckDuplicateV19=async function(){
 const target=document.getElementById('hsjDupWarning');if(!target)return [];
 const draft=currentDraft();const seq=++checking;
 if(!draft.patient_name&&!draft.cpf&&!draft.ids){target.style.display='none';return []}
 let rows=S.rows;
 try{const remote=await api('/rest/v1/surgeries?select=id,patient_name,cpf,ids,procedure_name,birth_date,stage&active=eq.true&limit=10000');if(Array.isArray(remote))rows=remote}catch(e){console.warn('Verificação remota de duplicidade:',e)}
 if(seq!==checking||!document.getElementById('hsjDupWarning'))return [];
 const found=rows.filter(x=>matches(draft,x));
 if(found.length){
 target.style.display='block';target.style.background='#fff2e7';target.style.border='1px solid #dc8a3a';
 target.innerHTML='<b>⚠ PACIENTE JÁ CADASTRADO — NÃO CRIAR NOVO REGISTRO</b><p>Existe cadastro deste paciente para o mesmo procedimento. Utilize a busca e edite o registro existente.</p>'+found.slice(0,5).map(x=>'<div><b>'+esc(x.patient_name)+'</b> · '+esc(x.procedure_name)+' · Etapa: '+esc(labels[x.stage]||x.stage)+' <button type="button" class="btn small" onclick="editPatient(\''+x.id+'\')">Abrir cadastro existente</button></div>').join('');
 }else{target.style.display='none';target.textContent=''}
 return found;
};
const keys=['patient_name','ids','cpf','phone','aih_request_date','ids_register_date','procedure_name','sigtap_code','request_type','specialty','surgeon','birth_date','authorization_date','authorization_month','programming_date','revalidation_status','patient_status','request_status','reschedule_date','surgery_date','suspension_notes','sex'];
window.savePatient=async function(id){
 if(busy)return;busy=true;
 const btn=document.querySelector('#modal .mf .primary');if(btn)btn.disabled=true;
 try{
 const d={updated_by:uid};keys.forEach(k=>d[k]=document.getElementById('f_'+k)?.value||null);
 if(d.revalidation_status==='(Nenhum)')d.revalidation_status=null;
 if(!d.patient_name||!d.procedure_name)throw Error('Nome e procedimento são obrigatórios.');
 if(!id){
  const found=await window.hsjCheckDuplicateV19();
  if(found.length)throw Error('Cadastro bloqueado: paciente e procedimento já registrados. Abra o cadastro existente.');
  const fresh=await api('/rest/v1/surgeries?select=id,patient_name,cpf,ids,procedure_name,birth_date&active=eq.true&limit=10000');
  if(fresh.some(x=>matches(d,x)))throw Error('Cadastro duplicado detectado no servidor. Operação cancelada.');
  await api('/rest/v1/surgeries',{method:'POST',body:JSON.stringify({...d,stage:'fila',created_by:uid})});
 }else await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(d)});
 document.getElementById('modal').innerHTML='';await load();fillFilters();renderCurrent();
 }catch(e){alert(/CADASTRO_DUPLICADO|23505/.test(e.message)?'Já existe cadastro deste paciente para o procedimento. Nenhum registro novo foi criado.':e.message)}
 finally{busy=false;if(btn)btn.disabled=false}
};
function age(birth,date){
 if(!birth)return 'Não informada';
 const b=new Date(birth+'T12:00:00'),d=new Date((date||new Date().toISOString().slice(0,10))+'T12:00:00');
 if(!isFinite(b.getTime())||b>d)return 'Não informada';
 let n=d.getFullYear()-b.getFullYear();if(d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate()))n--;
 return n>=0&&n<125?n+' anos':'Não informada';
}
const oldMap=window.renderMap;
window.renderMap=function(){
 const result=oldMap.apply(this,arguments);
 const table=document.querySelector('#content .tablewrap table');
 if(!table)return result;
 const heading=[...table.querySelectorAll('thead th')].find(x=>x.textContent.trim()==='PACIENTE');
 if(!heading||table.querySelector('[data-hsj-sexo]'))return result;
 heading.insertAdjacentHTML('afterend','<th data-hsj-sexo>SEXO</th><th>IDADE</th>');
 table.querySelectorAll('tbody tr').forEach(tr=>{
   const action=tr.querySelector('button[onclick^="editPatient("]');
   if(!action){const cell=tr.querySelector('td[colspan]');if(cell)cell.colSpan=Number(cell.colSpan)+2;return}
   const id=(action.getAttribute('onclick')||'').match(/'([^']+)'/)?.[1];
   const x=S.rows.find(r=>r.id===id);
   const patientCell=tr.children[2];if(!patientCell)return;
   patientCell.insertAdjacentHTML('afterend','<td>'+esc(x?.sex||'Não informado')+'</td><td>'+esc(age(x?.birth_date,x?.surgery_date))+'</td>');
 });
 return result;
};
if(S.view==='mapa_cirurgico')renderMap();
})();