(()=>{
// v12: filtros gerais por período, Cirurgias Realizadas e inclusão/observações no Pós-Operatório.
labels.realizadas='Cirurgias Realizadas';
const orderedViewsV12=['fila','pendencias','consulta_preop','exames','entrevista_tecnico','avaliacao_enfermeiro','mapa_cirurgico','realizadas','suspensas','duploj','pos_operatorio','indicadores'];
window.renderTabs=function(){const tabs=document.getElementById('tabs');if(!tabs)return;tabs.innerHTML=orderedViewsV12.map(v=>`<button class="tab ${v===S.view?'on':''}" onclick="setView('${v}',this)">${labels[v]}</button>`).join('')};

function initPeriodFiltersV12(){
  const old=document.getElementById('gfDate');
  if(old&&!document.getElementById('gfDateFrom')){
    const a=document.createElement('input');a.id='gfDateFrom';a.type='date';a.title='Data inicial';a.onchange=()=>renderCurrent();
    const b=document.createElement('input');b.id='gfDateTo';b.type='date';b.title='Data final';b.onchange=()=>renderCurrent();
    old.replaceWith(a,b);
    const box=document.querySelector('.filters');if(box)box.style.gridTemplateColumns='2fr 1.4fr 1.4fr 1fr 1fr 1fr 1fr';
  }
}
const dateFieldsV12=['surgery_date','consultation_date','appointment_date','programming_date','authorization_date','aih_request_date','ids_register_date','reschedule_date','double_j_insert_date'];
window.filtered=function(rows){
  const q=(document.getElementById('gfName')?.value||'').trim().toLowerCase();
  const d=document.getElementById('gfDoctor')?.value||'';
  const p=(document.getElementById('gfProcedure')?.value||'').trim().toLowerCase();
  const sp=document.getElementById('gfSpecialty')?.value||'';
  const st=document.getElementById('gfStatus')?.value||'';
  const from=document.getElementById('gfDateFrom')?.value||'';
  const to=document.getElementById('gfDateTo')?.value||'';
  return rows.filter(x=>{
    const dates=dateFieldsV12.map(k=>String(x[k]||'').slice(0,10)).filter(Boolean);
    const dateOk=(!from&&!to)||dates.some(dt=>(!from||dt>=from)&&(!to||dt<=to));
    return (!q||[x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLowerCase().includes(q)))&&(!d||x.surgeon===d)&&(!p||String(x.procedure_name||'').toLowerCase().includes(p))&&(!sp||x.specialty===sp)&&(!st||x.patient_status===st)&&dateOk;
  });
};

function currentMapFiltersV12(){return S.mapFilters||{doctor:'',specialty:'',from:'',to:''}}
function mapOptionsV12(rows,key){return [...new Set(rows.map(x=>String(x[key]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function mapRowsV12(){
  const f=currentMapFiltersV12();
  return filtered(S.rows.filter(x=>x.stage==='mapa_cirurgico'&&x.patient_status!=='REALIZADA')).filter(x=>{const dt=String(x.surgery_date||'');return (!f.doctor||x.surgeon===f.doctor)&&(!f.specialty||x.specialty===f.specialty)&&(!f.from||dt>=f.from)&&(!f.to||dt<=f.to)});
}
window.markSurgeryDoneV12=async function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return;
 if(!confirm(`Marcar a cirurgia de ${x.patient_name} como REALIZADA?`))return;
 if(!confirm('Confirma? O paciente sairá do Mapa Cirúrgico e aparecerá em Cirurgias Realizadas.'))return;
 await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({patient_status:'REALIZADA',surgery_date:x.surgery_date||new Date().toISOString().slice(0,10),updated_by:uid})});
 await load();renderMap();
};
window.renderMap=function(){
  initPeriodFiltersV12();
  const all=filtered(S.rows.filter(x=>x.stage==='mapa_cirurgico'&&x.patient_status!=='REALIZADA'));
  const rows=mapRowsV12(),f=currentMapFiltersV12();
  const doctors=mapOptionsV12(all,'surgeon'),specs=mapOptionsV12(all,'specialty');
  document.getElementById('content').innerHTML=`<section class="card map-print-v11"><div class="section-head"><div><h2>🏥 Mapa Cirúrgico</h2><div class="sub">Agendamento por sala, médico, especialidade e período</div></div><button class="btn" onclick="window.print()">🖨 Imprimir mapa filtrado</button></div>
  <div class="notice"><b>FILTROS DO MAPA / IMPRESSÃO</b><div style="display:grid;grid-template-columns:1.3fr 1.3fr 1fr 1fr auto auto;gap:8px;margin-top:10px;align-items:end"><div class="field"><label>Médico</label><select id="mapDoctorV11"><option value="">Todos os médicos</option>${doctors.map(v=>`<option ${f.doctor===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div class="field"><label>Especialidade</label><select id="mapSpecialtyV11"><option value="">Todas as especialidades</option>${specs.map(v=>`<option ${f.specialty===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div class="field"><label>De</label><input id="mapFromV11" type="date" value="${esc(f.from||'')}"></div><div class="field"><label>Até</label><input id="mapToV11" type="date" value="${esc(f.to||'')}"></div><button class="btn primary" onclick="applyMapFiltersV11()">🔎 Filtrar</button><button class="btn" onclick="clearMapFiltersV11()">Limpar</button></div></div>
  <div class="cards"><div class="kpi"><div class="label">CIRURGIAS AGENDADAS NO FILTRO</div><div class="value">${rows.length}</div></div><div class="kpi orange"><div class="label">MÉDICOS</div><div class="value">${new Set(rows.map(x=>x.surgeon).filter(Boolean)).size}</div></div><div class="kpi green"><div class="label">ESPECIALIDADES</div><div class="value">${new Set(rows.map(x=>x.specialty).filter(Boolean)).size}</div></div><div class="kpi teal"><div class="label">REALIZADAS</div><div class="value">${filtered(S.rows.filter(x=>x.patient_status==='REALIZADA')).length}</div></div></div>
  <div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>SALA</th><th>PACIENTE</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>DATA</th><th>RESERVAS</th><th>RESPONSÁVEL</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="acts"><button class="btn small" onclick="editMapPatient('${x.id}')">✏ Editar mapa</button><button class="btn green small" onclick="markSurgeryDoneV12('${x.id}')">✅ Cirurgia realizada</button>${x.stage!=='fila'?`<button class="btn small" onclick="returnToQueueV8('${x.id}')">↩ Devolver para a fila</button>`:''}</div></td><td>${esc(x.map_room||'')}</td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.specialty||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.surgery_date||'')}</td><td>${esc(x.map_reservations||'')}</td><td>${esc(x.map_responsible||'')}</td></tr>`).join('')||'<tr><td colspan="9" style="text-align:center;padding:28px">Nenhuma cirurgia agendada no filtro.</td></tr>'}</tbody></table></div></section>`;
};

window.sendRealizedToDoubleJV12=function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return;
 document.getElementById('modal').innerHTML=`<div class="back"><div class="modal" style="max-width:600px"><div class="mh"><b>🔗 Encaminhar para Acompanhamento de Duplo J</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice"><b>${esc(x.patient_name)}</b><br>${esc(x.procedure_name||'')}</div><div class="field"><label>Data de instalação do Duplo J *</label><input id="djDateV12" type="date" value="${esc(x.double_j_insert_date||'')}"></div></div><div class="mf"><button class="btn primary" onclick="confirmRealizedToDoubleJV12('${id}')">Encaminhar</button></div></div></div>`;
};
window.confirmRealizedToDoubleJV12=async function(id){const dt=document.getElementById('djDateV12')?.value||'';if(!dt)return alert('Informe a data de instalação do Duplo J.');await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({double_j:true,double_j_insert_date:dt,updated_by:uid})});document.getElementById('modal').innerHTML='';await load();renderRealizedV12();alert('Paciente incluído no Acompanhamento de Duplo J.');};
window.renderRealizedV12=function(){
 const rows=filtered(S.rows.filter(x=>x.patient_status==='REALIZADA'));
 document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>✅ Cirurgias Realizadas (${rows.length})</h2><div class="sub">Pacientes marcados como realizados no Mapa Cirúrgico</div></div></div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>DATA CIRURGIA</th><th>DUPLO J</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="acts"><button class="btn small" onclick="editPatient('${x.id}')">✏ Editar</button><button class="btn primary small" onclick="sendRealizedToDoubleJV12('${x.id}')">🔗 Acompanhamento Duplo J</button><button class="btn green small" onclick="movePatientV8('${x.id}','pos_operatorio','Paciente encaminhado para Pós-Operatório.')">➡ Pós-Operatório</button></div></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.specialty||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.surgery_date||'')}</td><td>${x.double_j?`<span class="pill ok">SIM • ${esc(x.double_j_insert_date||'')}</span>`:'<span class="pill">NÃO</span>'}</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:28px">Nenhuma cirurgia realizada.</td></tr>'}</tbody></table></div></section>`;
};

function postOpCandidatesV12(){const q=(document.getElementById('postOpSearchV12')?.value||'').trim().toLowerCase();if(q.length<2)return [];return S.rows.filter(x=>x.active!==false&&x.stage!=='pos_operatorio'&&[x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,50)}
window.openPostOpIncludeV12=function(){document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>➕ Incluir paciente no Pós-Operatório</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="field"><label>Pesquisar por nome, CPF ou IDS</label><input id="postOpSearchV12" oninput="renderPostOpSearchV12()" placeholder="Digite pelo menos 2 caracteres"></div><div id="postOpResultsV12" style="margin-top:12px"></div></div></div></div>`};
window.renderPostOpSearchV12=function(){const box=document.getElementById('postOpResultsV12');if(!box)return;const rows=postOpCandidatesV12();box.innerHTML=rows.length?`<div class="tablewrap"><table class="table"><thead><tr><th>AÇÃO</th><th>PACIENTE</th><th>CPF</th><th>IDS</th><th>PROCEDIMENTO</th><th>ETAPA ATUAL</th></tr></thead><tbody>${rows.map(x=>`<tr><td><button class="btn primary small" onclick="includePostOpV12('${x.id}')">➕ Incluir</button></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.cpf||'')}</td><td>${esc(x.ids||'')}</td><td>${esc(x.procedure_name||'')}</td><td>${esc(labels[x.stage]||x.stage||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="sub">Nenhum paciente encontrado.</div>'};
window.includePostOpV12=async function(id){const x=S.rows.find(r=>r.id===id);if(!x)return;if(!confirm(`Incluir ${x.patient_name} no Pós-Operatório?`))return;await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({stage:'pos_operatorio',updated_by:uid})});document.getElementById('modal').innerHTML='';await load();renderPostOpV12();};
window.editPostOpV12=function(id){const x=S.rows.find(r=>r.id===id);if(!x)return;document.getElementById('modal').innerHTML=`<div class="back"><div class="modal" style="max-width:760px"><div class="mh"><b>📝 Pós-Operatório: ${esc(x.patient_name)}</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="field"><label>Situações importantes / observações</label><textarea id="postOpNotesV12" rows="9" placeholder="Registre intercorrências, orientações, retornos, sinais de alerta e demais situações importantes...">${esc(x.postoperative_notes||'')}</textarea></div><div class="notice" style="margin-top:12px">O login do usuário e a data/hora serão registrados automaticamente.</div></div><div class="mf"><button class="btn primary" onclick="savePostOpV12('${id}')">Salvar registro</button></div></div></div>`};
window.savePostOpV12=async function(id){await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({postoperative_notes:document.getElementById('postOpNotesV12')?.value||null,postoperative_by:uid,postoperative_at:new Date().toISOString(),updated_by:uid})});document.getElementById('modal').innerHTML='';await load();renderPostOpV12();};
window.renderPostOpV12=function(){const rows=stageRows('pos_operatorio');document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>🩹 Pós-Operatório (${rows.length})</h2><div class="sub">Acompanhamento e registro de situações importantes</div></div><button class="btn primary" onclick="openPostOpIncludeV12()">➕ Incluir</button></div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE</th><th>PROCEDIMENTO</th><th>MÉDICO</th><th>DATA CIRURGIA</th><th>SITUAÇÕES IMPORTANTES</th><th>ÚLTIMO REGISTRO</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="acts"><button class="btn primary small" onclick="editPostOpV12('${x.id}')">📝 Registrar</button><button class="btn small" onclick="returnToQueueV8('${x.id}')">↩ Devolver para a fila</button></div></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.surgery_date||'')}</td><td>${esc(x.postoperative_notes||'')}</td><td>${x.postoperative_at?esc(new Date(x.postoperative_at).toLocaleString('pt-BR')):''}</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:28px">Nenhum paciente no Pós-Operatório.</td></tr>'}</tbody></table></div></section>`};

const oldRenderCurrentV12=window.renderCurrent;
window.renderCurrent=function(){initPeriodFiltersV12();if(S.view==='realizadas')return renderRealizedV12();if(S.view==='pos_operatorio')return renderPostOpV12();return oldRenderCurrentV12()};
initPeriodFiltersV12();renderTabs();renderCurrent();
})();