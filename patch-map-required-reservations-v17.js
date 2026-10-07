(()=>{
// v17: acesso rápido ao cadastro no Mapa + UTI/Sangue obrigatórios no agendamento.
function parseReservationsV17(raw){
  const s=String(raw||'');
  const uti=(s.match(/RESERVA\s*UTI\s*:\s*(SIM|NÃO|NAO)/i)||[])[1]||'';
  const sangue=(s.match(/RESERVA\s*SANGUE\s*:\s*(SIM|NÃO|NAO)/i)||[])[1]||'';
  const obs=s.replace(/RESERVA\s*UTI\s*:\s*(SIM|NÃO|NAO)\s*[|;]?/ig,'')
             .replace(/RESERVA\s*SANGUE\s*:\s*(SIM|NÃO|NAO)\s*[|;]?/ig,'')
             .replace(/^\s*[|;]\s*|\s*[|;]\s*$/g,'').trim();
  const norm=v=>String(v||'').toUpperCase()==='NAO'?'NÃO':String(v||'').toUpperCase();
  return {uti:norm(uti),sangue:norm(sangue),obs};
}
function composeReservationsV17(uti,sangue,obs){
  const parts=[`RESERVA UTI: ${uti}`,`RESERVA SANGUE: ${sangue}`];
  if(String(obs||'').trim())parts.push(String(obs).trim());
  return parts.join(' | ');
}
function reservationBadgesV17(x){
  const r=parseReservationsV17(x.map_reservations);
  const badge=(label,val)=>val?`<span class="pill ${val==='SIM'?'warn':'ok'}" style="margin-right:4px">${label}: ${esc(val)}</span>`:`<span class="pill bad" style="margin-right:4px">${label}: NÃO INFORMADO</span>`;
  return badge('UTI',r.uti)+badge('SANGUE',r.sangue)+(r.obs?`<div class="sub" style="margin-top:4px">${esc(r.obs)}</div>`:'');
}

window.editMapPatient=function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  const r=parseReservationsV17(x.map_reservations);
  document.getElementById('modal').innerHTML=`<div class="back"><div class="modal" style="max-width:820px">
    <div class="mh"><b>🏥 Agendamento no Mapa: ${esc(x.patient_name)}</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div>
    <div class="mb">
      <div class="notice" style="margin-bottom:12px"><b>Obrigatório:</b> informar se o paciente possui reserva de UTI e reserva de sangue antes de salvar o agendamento.</div>
      <div class="grid">
        ${selectField('Sala *','map_room',x.map_room,['Sala 01','Sala 02','Sala 03','Sala 04'])}
        ${field('Data da cirurgia *','surgery_date',x.surgery_date,'date')}
        ${field('Responsável','map_responsible',x.map_responsible)}
        <div class="field"><label>Reserva de UTI *</label><select id="f_map_uti"><option value="">Selecione...</option><option value="SIM" ${r.uti==='SIM'?'selected':''}>SIM</option><option value="NÃO" ${r.uti==='NÃO'?'selected':''}>NÃO</option></select></div>
        <div class="field"><label>Reserva de Sangue *</label><select id="f_map_sangue"><option value="">Selecione...</option><option value="SIM" ${r.sangue==='SIM'?'selected':''}>SIM</option><option value="NÃO" ${r.sangue==='NÃO'?'selected':''}>NÃO</option></select></div>
        <div class="field span3"><label>Outras reservas / observações</label><textarea id="f_map_obs" rows="4" placeholder="Ex.: material especial, OPME, hemoderivados específicos, pré-internamento...">${esc(r.obs||'')}</textarea></div>
      </div>
    </div>
    <div class="mf"><button class="btn" onclick="editPatient('${id}')">👤 Abrir cadastro do paciente</button><button class="btn primary" onclick="saveMapPatientV17('${id}')">Salvar agendamento</button></div>
  </div></div>`;
};

window.saveMapPatientV17=async function(id){
  const room=document.getElementById('f_map_room')?.value||'';
  const date=document.getElementById('f_surgery_date')?.value||'';
  const resp=document.getElementById('f_map_responsible')?.value||'';
  const uti=document.getElementById('f_map_uti')?.value||'';
  const sangue=document.getElementById('f_map_sangue')?.value||'';
  const obs=document.getElementById('f_map_obs')?.value||'';
  if(!room)return alert('Selecione a sala cirúrgica.');
  if(!date)return alert('Informe a data da cirurgia.');
  if(!uti)return alert('Informe obrigatoriamente se há Reserva de UTI: SIM ou NÃO.');
  if(!sangue)return alert('Informe obrigatoriamente se há Reserva de Sangue: SIM ou NÃO.');
  await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({
    map_room:room,
    surgery_date:date,
    map_responsible:resp||null,
    map_reservations:composeReservationsV17(uti,sangue,obs),
    updated_by:uid
  })});
  document.getElementById('modal').innerHTML='';
  await load();
  renderMap();
};

window.renderMap=function(){
  const f=S.mapFilters||{doctor:'',specialty:'',from:'',to:''};
  const all=filtered(S.rows.filter(x=>x.stage==='mapa_cirurgico'&&x.patient_status!=='REALIZADA'));
  const rows=all.filter(x=>{
    const dt=String(x.surgery_date||'');
    return (!f.doctor||x.surgeon===f.doctor)&&(!f.specialty||x.specialty===f.specialty)&&(!f.from||dt>=f.from)&&(!f.to||dt<=f.to);
  });
  const opts=(key)=>[...new Set(all.map(x=>String(x[key]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const doctors=opts('surgeon'),specs=opts('specialty');
  document.getElementById('content').innerHTML=`<section class="card map-print-v11">
    <div class="section-head"><div><h2>🏥 Mapa Cirúrgico</h2><div class="sub">Agendamento por sala, médico, especialidade e período</div></div><button class="btn" onclick="window.print()">🖨 Imprimir mapa filtrado</button></div>
    <div class="notice"><b>FILTROS DO MAPA / IMPRESSÃO</b><div style="display:grid;grid-template-columns:1.3fr 1.3fr 1fr 1fr auto auto;gap:8px;margin-top:10px;align-items:end">
      <div class="field"><label>Médico</label><select id="mapDoctorV11"><option value="">Todos os médicos</option>${doctors.map(v=>`<option ${f.doctor===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="field"><label>Especialidade</label><select id="mapSpecialtyV11"><option value="">Todas as especialidades</option>${specs.map(v=>`<option ${f.specialty===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="field"><label>De</label><input id="mapFromV11" type="date" value="${esc(f.from||'')}"></div>
      <div class="field"><label>Até</label><input id="mapToV11" type="date" value="${esc(f.to||'')}"></div>
      <button class="btn primary" onclick="applyMapFiltersV11()">🔎 Filtrar</button><button class="btn" onclick="clearMapFiltersV11()">Limpar</button>
    </div></div>
    <div class="cards"><div class="kpi"><div class="label">CIRURGIAS AGENDADAS NO FILTRO</div><div class="value">${rows.length}</div></div><div class="kpi orange"><div class="label">MÉDICOS</div><div class="value">${new Set(rows.map(x=>x.surgeon).filter(Boolean)).size}</div></div><div class="kpi green"><div class="label">ESPECIALIDADES</div><div class="value">${new Set(rows.map(x=>x.specialty).filter(Boolean)).size}</div></div><div class="kpi teal"><div class="label">REALIZADAS</div><div class="value">${filtered(S.rows.filter(x=>x.patient_status==='REALIZADA')).length}</div></div></div>
    <div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>SALA</th><th>PACIENTE</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>DATA</th><th>RESERVAS UTI / SANGUE</th><th>RESPONSÁVEL</th></tr></thead>
    <tbody>${rows.map(x=>`<tr><td><div class="acts"><button class="btn small" onclick="editPatient('${x.id}')">👤 Cadastro</button><button class="btn small" onclick="editMapPatient('${x.id}')">✏ Editar mapa</button><button class="btn green small" onclick="markSurgeryDoneV12('${x.id}')">✅ Cirurgia realizada</button>${x.stage!=='fila'?`<button class="btn small" onclick="returnToQueueV8('${x.id}')">↩ Devolver para a fila</button>`:''}</div></td><td>${esc(x.map_room||'')}</td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.specialty||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.surgery_date||'')}</td><td>${reservationBadgesV17(x)}</td><td>${esc(x.map_responsible||'')}</td></tr>`).join('')||'<tr><td colspan="9" style="text-align:center;padding:28px">Nenhuma cirurgia agendada no filtro.</td></tr>'}</tbody></table></div>
  </section>`;
};

if(S.view==='mapa_cirurgico')renderMap();
})();