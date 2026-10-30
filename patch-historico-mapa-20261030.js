(()=>{
if(window.__hsjHistoricoMapa20261030)return;window.__hsjHistoricoMapa20261030=true;
const escH=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c]));
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'America/Maceio'});
const state={from:today(),to:today(),doctor:'',specialty:'',status:'',rows:[],loaded:false};
async function fetchAll(){
 const result=[];
 for(let offset=0;offset<30000;offset+=500){
  const part=await api('/rest/v1/surgeries?select=id,patient_name,ids,surgery_date,map_room,surgeon,specialty,procedure_name,patient_status,stage,map_responsible,active&order=surgery_date.desc.nullslast,id.asc&limit=500&offset='+offset);
  if(!Array.isArray(part))throw Error('Falha ao consultar o histórico.');
  result.push(...part);
  if(part.length<500)return result;
 }
 throw Error('Limite de registros excedido');
}
const valid=x=>Boolean(x.surgery_date&&(x.map_room||['mapa_cirurgico','concluida','pos_operatorio'].includes(x.stage)||x.patient_status==='REALIZADA'));
const matches=x=>valid(x)&&(!state.from||x.surgery_date>=state.from)&&(!state.to||x.surgery_date<=state.to)&&(!state.doctor||x.surgeon===state.doctor)&&(!state.specialty||x.specialty===state.specialty)&&(!state.status||String(x.patient_status||'NÃO INFORMADA')===state.status);
const choices=(vals,v,all)=>'<option value="">'+all+'</option>'+[...new Set(vals.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')).map(x=>'<option value="'+escH(x)+'" '+(x===v?'selected':'')+'>'+escH(x)+'</option>').join('');
function render(){
 const root=document.getElementById('content');
 if(!root||S.view!=='historico_mapa_hsj')return;
 const all=state.rows.filter(valid),rows=all.filter(matches);
 const medicos=all.filter(x=>(!state.from||x.surgery_date>=state.from)&&(!state.to||x.surgery_date<=state.to)).map(x=>x.surgeon);
 const statuses=all.filter(x=>(!state.from||x.surgery_date>=state.from)&&(!state.to||x.surgery_date<=state.to)).map(x=>x.patient_status||'NÃO INFORMADA');
 root.innerHTML='<section class="card" id="hsjHistoricoMapaSection"><div class="section-head"><div><h2>📚 Histórico do Mapa Cirúrgico</h2><div class="sub">Consulta retrospectiva por data cirúrgica. Não depende da aba atual do paciente.</div></div><div><button class="btn" onclick="hsjPrintHistoricalMap()">🖨 Imprimir</button> <button class="btn" onclick="hsjCsvHistoricalMap()">⬇ Excel (CSV)</button></div></div><div class="notice">Histórico reconstruído a partir dos dados cirúrgicos atualmente registrados. Alterações posteriores da data, sala ou situação podem modificar a visão retrospectiva; não representa um retrato imutável de cada dia.</div><div class="consult-filters" style="grid-template-columns:repeat(5,minmax(130px,1fr))"><div class="field"><label>De</label><input type="date" id="hsjHMFrom" value="'+escH(state.from)+'"></div><div class="field"><label>Até</label><input type="date" id="hsjHMTo" value="'+escH(state.to)+'"></div><div class="field"><label>Médico</label><select id="hsjHMDoctor">'+choices(medicos,state.doctor,'Todos os médicos')+'</select></div><div class="field"><label>Especialidade</label><select id="hsjHMSpecialty">'+choices(all.map(x=>x.specialty),state.specialty,'Todas')+'</select></div><div class="field"><label>Situação</label><select id="hsjHMStatus">'+choices(statuses,state.status,'Todas')+'</select></div></div><div style="display:flex;gap:8px;margin-bottom:14px"><button class="btn primary" onclick="hsjHMFilter()">🔎 Filtrar</button><button class="btn" onclick="hsjHMClear()">Limpar</button><button class="btn" onclick="hsjHMLoad()">Atualizar banco</button></div><div class="cards"><div class="kpi"><div class="label">PROCEDIMENTOS NO PERÍODO</div><div class="value">'+rows.length+'</div></div><div class="kpi orange"><div class="label">MÉDICOS</div><div class="value">'+new Set(rows.map(x=>x.surgeon).filter(Boolean)).size+'</div></div><div class="kpi green"><div class="label">REALIZADAS (REGISTRADAS)</div><div class="value">'+rows.filter(x=>x.patient_status==='REALIZADA').length+'</div></div><div class="kpi teal"><div class="label">SUSPENSAS / CANCELADAS</div><div class="value">'+rows.filter(x=>/SUSPENS|CANCEL/i.test(x.patient_status||'')).length+'</div></div></div><div class="tablewrap"><table class="table"><thead><tr><th>DATA</th><th>SALA</th><th>PACIENTE</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>SITUAÇÃO</th><th>ETAPA ATUAL</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+escH(x.surgery_date)+'</td><td>'+escH(x.map_room||'Não informada')+'</td><td><b>'+escH(x.patient_name)+'</b></td><td>'+escH(x.procedure_name||'')+'</td><td>'+escH(x.specialty||'')+'</td><td>'+escH(x.surgeon||'')+'</td><td>'+escH(x.patient_status||'Não informada')+'</td><td>'+escH(window.labels?.[x.stage]||x.stage)+'</td></tr>').join('')+'</tbody></table></div></section>';
}
window.hsjHMFilter=()=>{state.from=document.getElementById('hsjHMFrom')?.value||'';state.to=document.getElementById('hsjHMTo')?.value||'';state.doctor=document.getElementById('hsjHMDoctor')?.value||'';state.specialty=document.getElementById('hsjHMSpecialty')?.value||'';state.status=document.getElementById('hsjHMStatus')?.value||'';render()};
window.hsjHMClear=()=>{Object.assign(state,{from:'',to:'',doctor:'',specialty:'',status:''});render()};
window.hsjHMLoad=async()=>{try{state.rows=await fetchAll();state.loaded=true;render()}catch(e){alert(e.message)}};
window.hsjCsvHistoricalMap=()=>{const rows=state.rows.filter(matches);window.downloadCsv?.('historico_mapa_cirurgico.csv',[['Data','Sala','Paciente','IDS','Procedimento','Especialidade','Médico','Situação','Etapa atual'],...rows.map(x=>[x.surgery_date,x.map_room,x.patient_name,x.ids,x.procedure_name,x.specialty,x.surgeon,x.patient_status,x.stage])])};
window.hsjPrintHistoricalMap=()=>window.print();
const oldRender=window.renderCurrent;
window.renderCurrent=function(){if(S.view==='historico_mapa_hsj'){render();if(!state.loaded)window.hsjHMLoad();return}return oldRender.apply(this,arguments)};
const oldTabs=window.renderTabs;
window.renderTabs=function(){oldTabs.apply(this,arguments);const t=document.getElementById('tabs');if(!t)return;let b=t.querySelector('[data-hsj-history-map]');if(!b){b=document.createElement('button');b.className='tab';b.dataset.hsjHistoryMap='1';b.onclick=()=>{S.view='historico_mapa_hsj';renderTabs();renderCurrent()};t.appendChild(b)}b.textContent='📚 Histórico do Mapa Cirúrgico';b.classList.toggle('on',S.view==='historico_mapa_hsj')};
renderTabs();
})();