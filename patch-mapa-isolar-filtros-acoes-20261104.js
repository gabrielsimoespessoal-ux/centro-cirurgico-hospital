(()=>{
'use strict';
if(window.__hsjMapFilterRepairNov2026)return;
window.__hsjMapFilterRepairNov2026=true;
const original=window.renderMap;
if(typeof original!=='function')return;
function escHtml(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function selectedRows(){
 const f=S.mapFilters||{};
 return (S.rows||[]).filter(x=>{
  if(x.active===false||x.stage!=='mapa_cirurgico'||x.patient_status==='REALIZADA')return false;
  const date=String(x.surgery_date||'').slice(0,10);
  return (!f.doctor||x.surgeon===f.doctor)&&(!f.specialty||x.specialty===f.specialty)
    &&(!f.from||date>=f.from)&&(!f.to||date<=f.to);
 });
}
window.renderMap=function(){
 // The Map's own date/doctor/specialty filters are authoritative.
 // Do not let the unrelated global search hide valid map patients.
 const previousFiltered=window.filtered;
 if(typeof previousFiltered==='function')window.filtered=function(rows){return rows};
 let result;
 try{result=original.apply(this,arguments)}
 finally{if(typeof previousFiltered==='function')window.filtered=previousFiltered}
 if(S.view!=='mapa_cirurgico')return result;
 const card=document.querySelector('#content .map-print-v11');
 if(!card)return result;
 const rows=selectedRows();
 const controls=document.createElement('section');
 controls.id='hsj-map-actions-repair';
 controls.style.cssText='margin:12px 0;padding:12px;background:#f4f9ff;border:1px solid #bfd5eb;border-radius:9px';
 const header=document.createElement('div');
 header.style.cssText='display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px';
 const title=document.createElement('strong');title.textContent='Agendamentos localizados no período: '+rows.length;
 const refresh=document.createElement('button');refresh.type='button';refresh.className='btn small';
 refresh.textContent='↻ Conferir pacientes no banco';
 refresh.onclick=()=>window.hsjSyncMapaAgora?.();
 header.append(title,refresh);controls.appendChild(header);
 const list=document.createElement('div');
 if(!rows.length){
  list.textContent='Nenhum agendamento ativo corresponde apenas aos filtros do Mapa. Confira as datas e atualize.';
  list.style.fontSize='12px';
 }else{
  list.style.cssText='display:grid;gap:8px';
  for(const patient of rows.slice(0,100)){
   const line=document.createElement('div');
   line.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#fff;border:1px solid #dce8f3;border-radius:7px;padding:8px';
   const description=document.createElement('div');description.style.cssText='flex:1;min-width:230px;font-size:12px';
   const d=String(patient.surgery_date||'').split('-').reverse().join('/');
   description.innerHTML='<b>'+escHtml(patient.patient_name)+'</b><div>'+escHtml(d)+' · '+escHtml(patient.map_room||'Sem sala')+' · '+escHtml(patient.surgeon||'Médico não informado')+'</div>';
   const edit=document.createElement('button');edit.type='button';edit.className='btn small';
   edit.textContent='Editar mapa';edit.onclick=()=>window.editMapPatient?.(patient.id);
   const reminder=document.createElement('button');reminder.type='button';reminder.className='btn green small';
   reminder.textContent='WhatsApp — lembrete + imagens';
   reminder.onclick=()=>window.hsjMapReminderV12?.(patient.id);
   line.append(description,edit,reminder);list.appendChild(line);
  }
  if(rows.length>100){const more=document.createElement('p');more.textContent='Exibindo os 100 primeiros agendamentos; refine o período para ver os demais.';list.appendChild(more)}
 }
 controls.appendChild(list);
 const filter=document.querySelector('#content .map-print-v11 .notice');
 if(filter)filter.after(controls);else card.prepend(controls);
 return result;
};
if(S.view==='mapa_cirurgico')window.renderMap();
})();