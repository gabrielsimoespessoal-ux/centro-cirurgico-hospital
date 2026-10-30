(()=>{
if(window.__hsjMapaDiaHistorico20261030)return;window.__hsjMapaDiaHistorico20261030=true;
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c]));
let lastDate='',lastRows=[];
window.hsjConsultarMapaHistoricoDia=async function(){
 const date=document.getElementById('mapFromV11')?.value||document.getElementById('mapToV11')?.value;
 if(!date)return alert('Selecione a data no filtro De para consultar o mapa daquele dia.');
 const frame=document.getElementById('hsjMapaDiaHistorico');
 if(!frame)return;
 frame.innerHTML='<p>Consultando o histórico cirúrgico de '+safe(date)+' diretamente no banco...</p>';
 try{
  const list=[];
  for(let offset=0;offset<30000;offset+=500){
   const rows=await api('/rest/v1/surgeries?select=id,patient_name,surgery_date,map_room,procedure_name,specialty,surgeon,patient_status,stage,map_responsible,ids&active=eq.true&surgery_date=eq.'+encodeURIComponent(date)+'&order=map_room.asc,patient_name.asc&limit=500&offset='+offset);
   if(!Array.isArray(rows))throw Error('Retorno inválido do banco');
   list.push(...rows);if(rows.length<500)break;
  }
  lastDate=date;lastRows=list;
  const counts=new Map();
  list.forEach(r=>{const key=r.map_room||'Sala não informada';counts.set(key,(counts.get(key)||0)+1)});
  const titles=[...counts].map(([k,v])=>safe(k)+': '+v).join(' | ');
  frame.innerHTML='<div class="section-head"><div><h3>📅 Mapa cirúrgico de '+safe(date.split('-').reverse().join('/'))+'</h3><div class="sub">'+list.length+' pacientes com essa data cirúrgica cadastrada • '+titles+'</div></div><div><button class="btn" onclick="hsjImprimirMapaDia()">🖨 Imprimir histórico</button> <button class="btn" onclick="hsjExportarMapaDia()">⬇ Excel CSV</button></div></div><div class="notice">Consulta histórica baseada nos dados atualmente salvos. Os registros permanecem aqui mesmo após a transferência para Fim da Jornada. Uma alteração posterior no cadastro poderá modificar o histórico reconstruído.</div><div class="tablewrap"><table class="table"><thead><tr><th>SALA</th><th>PACIENTE</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>SITUAÇÃO</th><th>ETAPA ATUAL</th></tr></thead><tbody>'+list.map(x=>'<tr><td>'+safe(x.map_room||'Sem sala')+'</td><td><b>'+safe(x.patient_name)+'</b></td><td>'+safe(x.procedure_name||'')+'</td><td>'+safe(x.specialty||'')+'</td><td>'+safe(x.surgeon||'')+'</td><td>'+safe(x.patient_status||'Não informada')+'</td><td>'+safe(window.labels?.[x.stage]||x.stage)+'</td></tr>').join('')+'</tbody></table></div>';
 }catch(e){frame.textContent='Falha ao consultar o mapa: '+(e?.message||e)}
};
window.hsjExportarMapaDia=function(){if(!lastRows.length)return alert('Nenhum registro para exportar.');window.downloadCsv?.('mapa_cirurgico_'+lastDate+'.csv',[['Sala','Paciente','IDS','Data','Procedimento','Especialidade','Médico','Situação','Etapa atual'],...lastRows.map(x=>[x.map_room,x.patient_name,x.ids,x.surgery_date,x.procedure_name,x.specialty,x.surgeon,x.patient_status,x.stage])])};
window.hsjImprimirMapaDia=function(){const el=document.getElementById('hsjMapaDiaHistorico');if(!el)return;const w=window.open('','_blank');if(!w)return alert('Permita pop-ups para imprimir.');w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Mapa '+safe(lastDate)+'</title><style>body{font-family:Arial;font-size:12px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:6px;text-align:left}@media print{button{display:none}}</style></head><body>'+el.innerHTML+'</body></html>');w.document.close();w.print()};
const previous=window.renderMap;
window.renderMap=function(){
 const result=previous.apply(this,arguments);
 if(S.view!=='mapa_cirurgico')return result;
 const root=document.querySelector('#content .map-print-v11');if(!root)return result;
 if(root.querySelector('#hsjMapaDiaHistorico'))return result;
 const section=document.createElement('section');section.style.cssText='border:2px solid #b4c9e8;border-radius:9px;padding:12px;margin-top:14px;background:white';
 section.innerHTML='<div class="section-head"><div><h3>📚 Histórico do mapa por dia</h3><div class="sub">Selecione a data no campo De acima e consulte todos os pacientes daquele dia, inclusive os já transferidos para Fim da Jornada.</div></div><button type="button" class="btn primary" onclick="hsjConsultarMapaHistoricoDia()">🔎 Consultar mapa do dia</button></div><div id="hsjMapaDiaHistorico" style="margin-top:12px"></div>';
 const audit=root.querySelector('#hsjMapAuditStatus');
 const filters=root.querySelector('.notice');
 if(audit?.nextSibling)root.insertBefore(section,audit.nextSibling);else if(filters?.nextSibling)root.insertBefore(section,filters.nextSibling);else root.appendChild(section);
 return result;
};
if(S.view==='mapa_cirurgico')renderMap();
})();