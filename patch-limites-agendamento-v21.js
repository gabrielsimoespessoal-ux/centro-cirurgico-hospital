(()=>{
if(window.__hsjLimitesConsultaV21)return;window.__hsjLimitesConsultaV21=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const weekday=date=>{const d=new Date(String(date||'')+'T12:00:00');return Number.isNaN(d.getTime())?-1:d.getDay()};
function rules(date,specialty){
 const day=weekday(date),sp=norm(specialty),r=[];
 if(day===2)r.push({type:'geral',label:'Terça-feira — total de consultas',limit:10});
 if(day===3&&sp.includes('ORTOPED'))r.push({type:'ortopedia',label:'Quarta-feira — Ortopedia',limit:7});
 if(day>=1&&day<=5&&sp.includes('UROLOG'))r.push({type:'urologia',label:'Urologia — limite diário',limit:2});
 return r;
}
function eligible(r,rule){
 if(rule.type==='geral')return true;
 if(rule.type==='ortopedia')return norm(r.specialty).includes('ORTOPED');
 return norm(r.specialty).includes('UROLOG');
}
async function counts(id,date,specialty){
 const applied=rules(date,specialty);if(!applied.length)return [];
 const rows=await api('/rest/v1/surgeries?select=id,consultation_date,specialty,active&consultation_date=eq.'+encodeURIComponent(date)+'&active=eq.true&limit=10000');
 if(!Array.isArray(rows))throw Error('Não foi possível consultar a agenda atual.');
 return applied.map(rule=>({...rule,count:rows.filter(r=>r.id!==id&&eligible(r,rule)).length}));
}
function current(){
 return {date:document.getElementById('f_consultation_date')?.value||'',specialty:document.getElementById('f_specialty')?.value||''};
}
window.hsjLimitesPreview=async function(id){
 const el=document.getElementById('hsjLimiteInfoV21');if(!el)return;
 const {date,specialty}=current();if(!date){el.textContent='Informe a data para verificar os limites de consultas.';return}
 const key=date+'|'+specialty;el.dataset.check=key;
 try{
  const results=await counts(id,date,specialty);
  if(!el.isConnected||el.dataset.check!==key)return;
  el.innerHTML=results.length?results.map(r=>'<div style="margin:4px 0"><b>'+esc(r.label)+':</b> '+r.count+' de '+r.limit+' vagas já ocupadas'+(r.count>=r.limit?' <strong style="color:#a33b12">⚠ LIMITE ATINGIDO — confirmação necessária</strong>':'')+'</div>').join(''):'Nenhum limite específico configurado para esta especialidade neste dia.';
 }catch(e){if(el.isConnected)el.textContent='Não foi possível conferir as vagas agora. A checagem será repetida antes de salvar.'}
};
const oldEdit=window.editConsult;
window.editConsult=function(id){
 const res=oldEdit.apply(this,arguments);
 const modal=document.querySelector('#modal .mb');if(!modal)return res;
 const area=document.createElement('div');area.className='notice';area.id='hsjLimiteInfoV21';area.style.margin='10px 0';area.setAttribute('role','status');
 modal.insertBefore(area,modal.firstChild);
 ['f_consultation_date','f_specialty'].forEach(key=>document.getElementById(key)?.addEventListener('change',()=>hsjLimitesPreview(id)));
 hsjLimitesPreview(id);
 return res;
};
let saving=false;
const originalSave=window.saveConsult;
window.saveConsult=async function(id){
 if(saving)return;saving=true;
 const btn=document.querySelector('#modal .mf button.primary');if(btn)btn.disabled=true;
 try{
  const {date,specialty}=current();
  if(!date)throw Error('Informe a data da consulta.');
  const currentRow=S.rows.find(r=>r.id===id);
  if(!currentRow)throw Error('Paciente não encontrado.');
  const results=await counts(id,date,specialty);
  const warnings=results.filter(r=>r.count>=r.limit);
  if(warnings.length){
   const message='⚠ CAPACIDADE DE AGENDAMENTOS ATINGIDA\n\n'+warnings.map(r=>r.label+'\n'+r.count+' agendamentos existentes / limite de '+r.limit+'\nCom este paciente: '+(r.count+1)).join('\n\n')+'\n\nDeseja prosseguir e agendar mesmo assim?';
   if(!confirm(message))return;
  }
  await originalSave.call(this,id);
 }catch(e){alert('Agendamento não concluído: '+e.message)}
 finally{saving=false;if(btn?.isConnected)btn.disabled=false}
};
})();