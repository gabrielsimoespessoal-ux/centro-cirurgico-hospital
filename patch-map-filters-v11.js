(()=>{
S.mapFilters=S.mapFilters||{doctor:'',specialty:'',from:'',to:''};

function mapFilterOptionsV11(rows,key){
  return [...new Set(rows.map(x=>String(x[key]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function mapFilteredRowsV11(){
  const all=stageRows('mapa_cirurgico');
  const f=S.mapFilters||{};
  return all.filter(x=>{
    const dt=String(x.surgery_date||'');
    return (!f.doctor||x.surgeon===f.doctor)
      &&(!f.specialty||x.specialty===f.specialty)
      &&(!f.from||dt>=f.from)
      &&(!f.to||dt<=f.to);
  });
}
window.applyMapFiltersV11=function(){
  S.mapFilters={
    doctor:document.getElementById('mapDoctorV11')?.value||'',
    specialty:document.getElementById('mapSpecialtyV11')?.value||'',
    from:document.getElementById('mapFromV11')?.value||'',
    to:document.getElementById('mapToV11')?.value||''
  };
  renderMap();
};
window.clearMapFiltersV11=function(){S.mapFilters={doctor:'',specialty:'',from:'',to:''};renderMap();};
window.printMapV11=function(){window.print();};

function roomCardV11(n,rows){
  let rr=rows.filter(x=>String(x.map_room||'').replace(/\D/g,'')==String(n));
  return `<div class="room"><h3>🚪 Sala 0${n}</h3><div class="body">${rr.length?rr.slice(0,8).map(x=>`<div style="margin-bottom:7px"><b>${esc(x.patient_name)}</b><br><span class="sub">${esc(x.surgeon||'')} • ${esc(x.specialty||'')} • ${esc(x.surgery_date||'')}</span></div>`).join(''):'Nenhum agendamento com os filtros selecionados'}</div></div>`;
}
function roomTableV11(n,rows){
  let rr=rows.filter(x=>String(x.map_room||'').replace(/\D/g,'')==String(n));
  return `<div class="section-head" style="margin:12px 0"><h2>Escala — Sala 0${n}</h2></div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>NOME</th><th>IDS</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>DATA CIRURGIA</th><th>RESERVAS ESPECIAIS</th><th>RESPONSÁVEL</th></tr></thead><tbody>${rr.map(x=>`<tr><td>${actionButtons(x)} <button class="btn small" onclick="editMapPatient('${x.id}')">🏥 Mapa</button></td><td>${esc(x.patient_name)}</td><td>${esc(x.ids||'')}</td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.specialty||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.surgery_date||'')}</td><td>${esc(x.map_reservations||'')}</td><td>${esc(x.map_responsible||'')}</td></tr>`).join('')||'<tr><td colspan="9" style="text-align:center;padding:28px">Nenhum paciente encontrado com os filtros selecionados.</td></tr>'}</tbody></table></div>`;
}

window.renderMap=function(){
  const all=stageRows('mapa_cirurgico');
  const rows=mapFilteredRowsV11();
  const doctors=mapFilterOptionsV11(all,'surgeon');
  const specialties=mapFilterOptionsV11(all,'specialty');
  const f=S.mapFilters||{};
  const today=new Date().toISOString().slice(0,10);
  document.getElementById('content').innerHTML=`<section class="card map-print-v11"><div class="section-head"><div><h2>🏥 Mapa Cirúrgico</h2><div class="sub">Salas e leitos — filtros por médico, especialidade e período</div></div><button class="btn" onclick="printMapV11()">🖨 Imprimir mapa filtrado</button></div>
  <div class="map-modes" style="margin-top:14px"><button class="btn ${S.mapMode==='daily'?'primary':''}" onclick="S.mapMode='daily';renderMap()">🗓 Visão Diária</button><button class="btn ${S.mapMode==='monthly'?'primary':''}" onclick="S.mapMode='monthly';renderMap()">📊 Escala Mensal Acumulada</button></div>
  <div class="notice" style="margin-top:14px"><b>FILTROS DO MAPA / IMPRESSÃO</b><div style="display:grid;grid-template-columns:1.3fr 1.3fr 1fr 1fr auto auto;gap:8px;margin-top:10px;align-items:end">
    <div class="field"><label>Médico cirurgião</label><select id="mapDoctorV11"><option value="">Todos os médicos</option>${doctors.map(v=>`<option ${f.doctor===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
    <div class="field"><label>Especialidade</label><select id="mapSpecialtyV11"><option value="">Todas as especialidades</option>${specialties.map(v=>`<option ${f.specialty===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
    <div class="field"><label>De</label><input id="mapFromV11" type="date" value="${esc(f.from||'')}"></div>
    <div class="field"><label>Até</label><input id="mapToV11" type="date" value="${esc(f.to||'')}"></div>
    <button class="btn primary" onclick="applyMapFiltersV11()">🔎 Filtrar</button><button class="btn" onclick="clearMapFiltersV11()">Limpar</button>
  </div></div>
  <div class="sub" style="margin:8px 0 12px"><b>${rows.length}</b> procedimento(s) no filtro atual${f.doctor?' • Médico: '+esc(f.doctor):''}${f.specialty?' • Especialidade: '+esc(f.specialty):''}${f.from?' • De: '+esc(f.from):''}${f.to?' • Até: '+esc(f.to):''}</div>
  <div class="cards"><div class="kpi"><div class="label">CIRURGIAS NO FILTRO</div><div class="value">${rows.length}</div></div><div class="kpi orange"><div class="label">MÉDICOS NO FILTRO</div><div class="value">${new Set(rows.map(x=>x.surgeon).filter(Boolean)).size}</div></div><div class="kpi green"><div class="label">ESPECIALIDADES</div><div class="value">${new Set(rows.map(x=>x.specialty).filter(Boolean)).size}</div></div><div class="kpi teal"><div class="label">PERÍODO</div><div class="value" style="font-size:14px">${esc(f.from||'início')} → ${esc(f.to||'fim')}</div></div></div>
  <div class="mini-tabs"><button class="mini-tab ${S.room==='all'?'on':''}" onclick="S.room='all';renderMap()">Visão Geral Simultânea</button>${[1,2,3,4].map(n=>`<button class="mini-tab ${S.room==String(n)?'on':''}" onclick="S.room='${n}';renderMap()">Sala 0${n}</button>`).join('')}</div>
  ${S.room==='all'?`<div class="rooms">${[1,2,3,4].map(n=>roomCardV11(n,rows)).join('')}</div><div class="tablewrap" style="margin-top:16px"><table class="table"><thead><tr><th>SALA</th><th>PACIENTE</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>DATA CIRURGIA</th><th>RESERVAS ESPECIAIS</th><th>RESPONSÁVEL</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.map_room||'')}</td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.specialty||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.surgery_date||'')}</td><td>${esc(x.map_reservations||'')}</td><td>${esc(x.map_responsible||'')}</td></tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:28px">Nenhum procedimento encontrado no período/filtro.</td></tr>'}</tbody></table></div>`:roomTableV11(S.room,rows)}
  </section>`;
};

if(!document.getElementById('mapPrintStyleV11')){
 const st=document.createElement('style');st.id='mapPrintStyleV11';st.textContent=`@media print{.topbar,.filterbar,.tabs{display:none!important}.wrap{max-width:none!important;padding:0!important}.map-print-v11{border:0!important;box-shadow:none!important}.map-print-v11 .btn,.map-print-v11 .map-modes,.map-print-v11 .notice{display:none!important}.tablewrap{overflow:visible!important}.table{min-width:0!important;font-size:9px}.acts{display:none!important}body{background:#fff!important}}`;document.head.appendChild(st);
}
if(S.view==='mapa_cirurgico')renderMap();
})();