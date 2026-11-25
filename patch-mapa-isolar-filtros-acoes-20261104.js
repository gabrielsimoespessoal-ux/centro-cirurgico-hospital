(()=>{
'use strict';
if(window.__hsjMapFilterRepairNov2026)return;
window.__hsjMapFilterRepairNov2026=true;
const original=window.renderMap;
if(typeof original!=='function')return;
function escHtml(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
const normalized=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const isSuspended=x=>/SUSPENS|CANCEL|NEGAD/.test(normalized(x.patient_status));
function selectedRows(){
 const f=S.mapFilters||{};
 return (S.rows||[]).filter(x=>{
  if(x.active===false||x.stage!=='mapa_cirurgico'||x.patient_status==='REALIZADA')return false;
  const date=String(x.surgery_date||'').slice(0,10);
  return (!f.doctor||normalized(x.surgeon)===normalized(f.doctor))&&(!f.specialty||normalized(x.specialty)===normalized(f.specialty))
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
 const agendadas=rows.filter(x=>!isSuspended(x));
 const suspensas=rows.filter(isSuspended);
 const controls=document.createElement('section');
 controls.id='hsj-map-actions-repair';
 controls.style.cssText='margin:12px 0;padding:12px;background:#f4f9ff;border:1px solid #bfd5eb;border-radius:9px';
 const header=document.createElement('div');
 header.style.cssText='display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px';
 const title=document.createElement('strong');title.textContent=agendadas.length+' cirurgia(s) agendada(s) · '+suspensas.length+' suspensa(s)/cancelada(s) · '+rows.length+' registro(s) no período';
 const refresh=document.createElement('button');refresh.type='button';refresh.className='btn small';
 refresh.textContent='↻ Conferir pacientes no banco';
 refresh.onclick=()=>window.hsjSyncMapaAgora?.();
 header.append(title,refresh);controls.appendChild(header);
 const list=document.createElement('div');
 if(!rows.length){
  list.textContent='Nenhuma cirurgia agendada ou suspensa corresponde aos filtros selecionados.';
  list.style.fontSize='12px';
 }else{
  list.style.cssText='display:grid;gap:8px';
  const organized=agendadas.concat(suspensas);
  for(const [index,patient] of organized.slice(0,100).entries()){
   if(index===0&&agendadas.length){
    const group=document.createElement('strong');group.textContent='Cirurgias agendadas ('+agendadas.length+')';
    group.style.cssText='color:#07558a;font-size:12px;margin:5px 0 0';list.appendChild(group);
   }
   if(index===agendadas.length&&suspensas.length){
    const group=document.createElement('div');
    group.textContent='Histórico de suspensões / cancelamentos ('+suspensas.length+') — NÃO integram o mapa nem a contagem de cirurgias agendadas';
    group.style.cssText='font-weight:800;font-size:12px;color:#9b3434;margin:9px 0 0;padding:7px;background:#fff1f1;border:1px solid #f0c4c4;border-radius:5px';
    list.appendChild(group);
   }
   const line=document.createElement('div');
   line.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:'+(isSuspended(patient)?'#fff6f6':'#fff')+';border:1px solid '+(isSuspended(patient)?'#edc0c0':'#dce8f3')+';border-radius:7px;padding:8px';
   const description=document.createElement('div');description.style.cssText='flex:1;min-width:230px;font-size:12px';
   const d=String(patient.surgery_date||'').split('-').reverse().join('/');
   description.innerHTML='<b>'+escHtml(patient.patient_name)+'</b> '+(isSuspended(patient)?'<strong style="color:#a52c35">'+escHtml(normalized(patient.patient_status)||'CIRURGIA SUSPENSA')+' · REGISTRO HISTÓRICO</strong>':'')+'<div>'+escHtml(d)+' · '+escHtml(patient.map_room||'Sem sala')+' · '+escHtml(patient.surgeon||'Médico não informado')+' · '+escHtml(patient.specialty||'Especialidade não informada')+'</div>';
   const edit=document.createElement('button');edit.type='button';edit.className='btn small';
   edit.textContent='Editar mapa';edit.onclick=()=>window.editMapPatient?.(patient.id);
   const reminder=document.createElement('button');reminder.type='button';reminder.className='btn green small';
   reminder.textContent=isSuspended(patient)?'Lembrete indisponível — cirurgia suspensa':'WhatsApp — lembrete + imagens';
   if(isSuspended(patient))reminder.disabled=true;
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