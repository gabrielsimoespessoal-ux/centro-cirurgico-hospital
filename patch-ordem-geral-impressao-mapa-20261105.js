(()=>{
'use strict';
if(window.__hsjOrdemGeralMapa20261105)return;
window.__hsjOrdemGeralMapa20261105=true;
const normalized=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const safe=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const state={positions:new Map(),busy:new Set(),fetchVersion:0};
function mapPatients(){return (S.rows||[]).filter(p=>p.active!==false&&p.stage==='mapa_cirurgico');}
function groupKey(p){return String(p.surgery_date||'').slice(0,10)+'|'+normalized(p.specialty||'Não informada');}
function orderFor(p){return state.positions.get(p.id);}
function fallbackOrder(){
 const grouped=new Map(),output=new Map();
 for(const p of mapPatients()){
  const key=groupKey(p);if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push(p);
 }
 for(const members of grouped.values()){
  members.sort((a,b)=>{
   const x=orderFor(a),y=orderFor(b);
   return (x??999999)-(y??999999)
   ||String(a.map_room||'').localeCompare(String(b.map_room||''),'pt-BR',{numeric:true})
   ||String(a.patient_name||'').localeCompare(String(b.patient_name||''),'pt-BR')
   ||String(a.id).localeCompare(String(b.id));
  });
  members.forEach((p,i)=>output.set(p.id,i+1));
 }
 return output;
}
function identify(row,table,patients){
 const actions=[...row.querySelectorAll('[onclick]')].map(el=>el.getAttribute('onclick')||'').join(' ');
 const uuid=actions.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
 if(uuid){return patients.find(p=>p.id===uuid)||null}
 const heads=[...table.querySelectorAll('thead th')].map(th=>normalized(th.textContent));
 const iName=heads.findIndex(h=>h==='paciente'||h==='nome'||h.includes('paciente /'));
 const iProc=heads.findIndex(h=>h==='procedimento');
 const iRoom=heads.findIndex(h=>h==='sala');
 const iDate=heads.findIndex(h=>h==='data cirurgia'||h==='data da cirurgia');
 const name=normalized(iName>=0?row.cells[iName]?.textContent:'');
 if(!name)return null;
 let candidates=patients.filter(p=>normalized(p.patient_name)===name||name.startsWith(normalized(p.patient_name)));
 if(iProc>=0)candidates=candidates.filter(p=>normalized(row.cells[iProc]?.textContent).includes(normalized(p.procedure_name)));
 if(iRoom>=0)candidates=candidates.filter(p=>normalized(row.cells[iRoom]?.textContent)===normalized(p.map_room));
 if(iDate>=0)candidates=candidates.filter(p=>{
  const dt=String(p.surgery_date||'').slice(0,10);
  const cell=normalized(row.cells[iDate]?.textContent);
  return !dt||cell.includes(dt)||cell.includes(dt.split('-').reverse().join('/'));
 });
 return candidates.length===1?candidates[0]:null;
}
function addOrderToTable(table,patients,displayOrder){
 if(table.closest('#hsjHistoricoMapaSection,#hsjMapaDiaHistorico,#hsjOrdemMapaSection'))return;
 const head=table.querySelector('thead tr'),body=table.querySelector('tbody');
 if(!head||!body)return;
 const originalHeads=[...head.children].map(c=>normalized(c.textContent));
 if(!originalHeads.some(x=>x==='procedimento')||!originalHeads.some(x=>x==='paciente'||x==='nome'))return;
 const rows=[...body.querySelectorAll(':scope > tr')];
 const assignments=rows.map(tr=>({tr,patient:identify(tr,table,patients)}));
 // A row with an ambiguous identity must never receive someone else's surgical order.
 let roomIndex=originalHeads.findIndex(x=>x==='sala');
 if(roomIndex<0){
  const actionIndex=originalHeads.findIndex(x=>x==='ações'||x==='acoes'||x==='ações rápidas');
  roomIndex=actionIndex>=0?actionIndex+1:0;
  const th=document.createElement('th');th.textContent='SALA';th.dataset.hsjOrderRoom='1';
  head.insertBefore(th,head.children[roomIndex]||null);
  for(const {tr,patient} of assignments){
   const td=document.createElement('td');td.textContent=patient?.map_room||'—';
   tr.insertBefore(td,tr.children[roomIndex]||null);
  }
 }
 const th=document.createElement('th');th.textContent='ORDEM';th.className='hsj-ordem-col';
 head.insertBefore(th,head.children[roomIndex+1]||null);
 const valid=[];
 for(const {tr,patient} of assignments){
  const td=document.createElement('td');td.className='hsj-ordem-col';
  if(patient){
   tr.dataset.hsjOrderPatient=patient.id;
   const rank=displayOrder.get(patient.id)||'';
   const input=document.createElement('input');
   input.type='number';input.min='1';input.max='9999';input.step='1';
   input.value=String(rank);input.className='hsj-order-input';
   input.dataset.patientId=patient.id;input.setAttribute('aria-label','Ordem da cirurgia de '+patient.patient_name+' na especialidade '+(patient.specialty||'não informada'));
   input.title='Ordem dentro da especialidade; salva automaticamente ao alterar';
   input.disabled=state.busy.has(patient.id)||!patient.surgery_date||!String(patient.specialty||'').trim();
   input.onchange=()=>saveNumber(patient,input);
   input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}};
   const printValue=document.createElement('span');printValue.className='hsj-order-print';
   printValue.textContent=String(rank);
   td.append(input,printValue);valid.push({tr,patient});
  }else{
   td.textContent='—';td.title='Registro ambíguo; confira o cadastro antes de definir ordem';
  }
  tr.insertBefore(td,tr.children[roomIndex+1]||null);
 }
 valid.sort((a,b)=>normalized(a.patient.specialty||'Não informada').localeCompare(normalized(b.patient.specialty||'Não informada'),'pt-BR')||
 String(a.patient.surgery_date||'').localeCompare(String(b.patient.surgery_date||''))||
 (displayOrder.get(a.patient.id)||99999)-(displayOrder.get(b.patient.id)||99999)||
 String(a.patient.patient_name||'').localeCompare(String(b.patient.patient_name||''),'pt-BR'));
 valid.forEach(x=>body.appendChild(x.tr));
}
function applyNumbers(){
 if(S.view!=='mapa_cirurgico')return;
 const card=document.querySelector('#content .map-print-v11');
 if(!card)return;
 const obsolete=card.querySelector('#hsjOrdemMapaSection');
 if(obsolete)obsolete.remove();
 const patients=mapPatients();
 const ranks=fallbackOrder();
 for(const table of card.querySelectorAll('table')){
  if(table.querySelector('th.hsj-ordem-col'))continue;
  addOrderToTable(table,patients,ranks);
 }
}
async function refresh(){
 const version=++state.fetchVersion;
 try{
  const records=await api('/rest/v1/hsj_mapa_ordem_impressao?select=surgery_id,surgery_date,position&order=surgery_date.asc,position.asc&limit=10000');
  if(version!==state.fetchVersion)return;
  const patients=new Map(mapPatients().map(p=>[p.id,p]));
  state.positions=new Map((records||[]).filter(r=>{
   const p=patients.get(r.surgery_id);
   return p&&String(r.surgery_date).slice(0,10)===String(p.surgery_date).slice(0,10);
  }).map(r=>[r.surgery_id,Number(r.position)]));
  if(S.view==='mapa_cirurgico')applyNumbers();
 }catch(e){console.warn('Não foi possível carregar a ordem por especialidade:',e);if(S.view==='mapa_cirurgico')applyNumbers()}
}
async function saveNumber(patient,input){
 const n=Number(input.value);
 if(!Number.isInteger(n)||n<1||n>9999){alert('Informe uma ordem numérica válida a partir de 1.');input.value=String(fallbackOrder().get(patient.id)||'');return}
 if(state.busy.has(patient.id))return;
 state.busy.add(patient.id);input.disabled=true;
 try{
  await api('/rest/v1/rpc/hsj_definir_ordem_especialidade_mapa',{method:'POST',body:JSON.stringify({p_surgery_id:patient.id,p_position:n,p_expected_updated_at:patient.updated_at})});
  await refresh();
  const visible=document.querySelector('#content .map-print-v11');
  if(visible){visible.querySelectorAll('th.hsj-ordem-col').forEach(th=>th.remove());
   for(const table of visible.querySelectorAll('table')){
    const hdr=[...table.querySelectorAll('thead th')].map(x=>normalized(x.textContent));
    const at=hdr.indexOf('ordem');
    if(at>=0)for(const tr of table.querySelectorAll('tbody tr'))tr.children[at]?.remove();
   }
  }
  applyNumbers();
 }catch(e){
  alert('Não foi possível salvar a ordem: '+e.message);
  input.value=String(fallbackOrder().get(patient.id)||'');
 }finally{state.busy.delete(patient.id);input.disabled=false}
}
const style=document.createElement('style');style.id='hsjOrdemEspecialidadeStyle';
style.textContent='.map-print-v11 th.hsj-ordem-col,.map-print-v11 td.hsj-ordem-col{text-align:center;min-width:70px!important;width:78px!important}.map-print-v11 .hsj-order-input{width:60px;max-width:100%;text-align:center;border:1px solid #adc2de;border-radius:5px;padding:5px 2px;background:white;font-weight:700;color:#193d66}.map-print-v11 .hsj-order-print{display:none}@media print{.map-print-v11 .hsj-order-input{display:none!important}.map-print-v11 .hsj-order-print{display:inline!important;font-weight:700}.map-print-v11 .rooms{display:none!important}.map-print-v11 .hsj-ordem-col{min-width:0!important;width:auto!important}}';
document.head.appendChild(style);
const previousRender=window.renderMap;
window.renderMap=function(){
 const result=previousRender.apply(this,arguments);
 if(S.view==='mapa_cirurgico'){applyNumbers();refresh()}
 return result;
};
window.hsjAtualizarOrdemEspecialidade20261105=refresh;
if(S.view==='mapa_cirurgico'){applyNumbers();refresh()}
})();