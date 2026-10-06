(()=>{
function uniqVals(arr){return [...new Set(arr.map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function optionsHtml(items,current=''){return items.map(v=>`<option value="${esc(v)}" ${String(v)===String(current||'')?'selected':''}>${esc(v)}</option>`).join('')}

previousStage=async function(id){
 const x=S.rows.find(r=>r.id===id); if(!x)return;
 if(x.consultation_only){return alert('Este paciente foi criado como “Paciente sem cadastro em fila”. Para voltar ao início do fluxo, use “Cadastrar em fila”.')}
 const i=stageOrder.indexOf(x.stage);
 if(i<=0)return alert('Este paciente já está na primeira etapa do fluxo.');
 const to=stageOrder[i-1];
 if(!confirm2(`Deseja retroceder ${x.patient_name} para a etapa anterior?`,`Confirma o retorno para “${labels[to]||to}”?`))return;
 await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({stage:to,updated_by:uid})});
 await load();renderCurrent();
};

registerInQueue=async function(id){
 const x=S.rows.find(r=>r.id===id); if(!x)return;
 if(!confirm2(`Deseja cadastrar ${x.patient_name} na Fila de Cirurgia?`,'Confirma o cadastro deste paciente na fila? Ele será direcionado para a primeira etapa do fluxo.'))return;
 await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({consultation_only:false,stage:'fila',updated_by:uid})});
 await load();fillFilters();renderCurrent();
 alert('Paciente cadastrado na Fila de Cirurgia com sucesso.');
};

actionButtons=function(x){
 return `<div class="acts"><button class="btn small" onclick="editPatient('${x.id}')">✏ Editar</button><button class="btn small" onclick="previousStage('${x.id}')">⬅ Retroceder</button><button class="btn green small" onclick="nextStage('${x.id}')">➡ Próxima etapa</button>${x.consultation_only?`<button class="btn primary small" onclick="registerInQueue('${x.id}')">📋 Cadastrar em fila</button>`:''}<button class="btn orange small" onclick="suspendPatient('${x.id}')">⚠ Suspensa</button><button class="btn red small" onclick="deletePatient('${x.id}')">🗑 Excluir</button></div>`;
};

S.consultFilters=S.consultFilters||{search:'',doctor:'',specialty:'',status:''};
setConsultFilter=function(k,v){S.consultFilters[k]=v;renderConsult()};
function consultRows(){
 let rows=filtered(S.rows.filter(x=>x.stage==='consulta_preop'));
 const f=S.consultFilters;
 const q=(f.search||'').trim().toLowerCase();
 return rows.filter(x=>(!q||[x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLowerCase().includes(q)))&&(!f.doctor||x.surgeon===f.doctor)&&(!f.specialty||x.specialty===f.specialty)&&(!f.status||x.patient_status===f.status));
}

renderConsult=function(){
 const rows=consultRows(), all=S.rows.filter(x=>x.stage==='consulta_preop');
 const docs=uniqVals(all.map(x=>x.surgeon)), specs=uniqVals(all.map(x=>x.specialty)), stats=uniqVals(all.map(x=>x.patient_status));
 const unqueued=rows.filter(x=>x.consultation_only);
 document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>📅 Agendamento de Consultas Pré-Operatórias</h2><div class="sub">Todas as especialidades reunidas em uma única tela</div></div><button class="btn primary" onclick="newConsultOnlyPatient()">+ Paciente sem cadastro em fila</button></div>
 <div class="consult-filters"><input value="${esc(S.consultFilters.search)}" placeholder="Pesquisar por nome, CPF ou IDS" oninput="setConsultFilter('search',this.value)"><select onchange="setConsultFilter('doctor',this.value)"><option value="">Todos os médicos</option>${optionsHtml(docs,S.consultFilters.doctor)}</select><select onchange="setConsultFilter('specialty',this.value)"><option value="">Todas as especialidades</option>${optionsHtml(specs,S.consultFilters.specialty)}</select><select onchange="setConsultFilter('status',this.value)"><option value="">Todos os status da cirurgia</option>${optionsHtml(stats,S.consultFilters.status)}</select></div>
 <div class="dj-note"><b>Pacientes sem cadastro em fila:</b> ${unqueued.length}. Estes pacientes podem ser agendados normalmente e, quando necessário, cadastrados na Fila de Cirurgia pelo botão <b>“Cadastrar em fila”</b>.</div>
 ${consultTable(rows)}</section>`;
};

consultTable=function(rows){return `<div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>ORIGEM</th><th>DATA AGENDAMENTO</th><th>NOME DO PACIENTE</th><th>CPF</th><th>ESPECIALIDADE</th><th>DATA CONSULTA</th><th>HORÁRIO</th><th>MÉDICO</th><th>STATUS CIRURGIA</th><th>UNIDADE PROVENIENTE</th><th>RESPONSÁVEL</th><th>DUPLO J</th><th>DATA INSTALAÇÃO</th><th>TELEFONE</th><th>OBSERVAÇÕES</th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr><td>${actionButtons(x)} <button class="btn small" onclick="editConsult('${x.id}')">📅 Agenda</button></td><td>${x.consultation_only?'<span class="pill warn">SEM CADASTRO EM FILA</span>':'<span class="pill ok">FILA CIRÚRGICA</span>'}</td><td>${esc(x.appointment_date||'')}</td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.cpf||'')}</td><td>${esc(x.specialty||'')}</td><td>${esc(x.consultation_date||'')}</td><td>${esc(x.consultation_time||'')}</td><td>${esc(x.surgeon||'')}</td><td>${statusPill(x.patient_status)}</td><td>${esc(x.source_unit||'')}</td><td>${esc(x.appointment_responsible||'')}</td><td>${x.double_j?'SIM':'NÃO'}</td><td>${esc(x.double_j_insert_date||'')}</td><td>${esc(x.phone||'')}</td><td>${esc(x.consultation_notes||'')}</td></tr>`).join(''):'<tr><td colspan="16" style="text-align:center;padding:28px">Nenhum paciente nesta etapa.</td></tr>'}</tbody></table></div>`};

newConsultOnlyPatient=function(){
 const docs=uniqVals(S.rows.map(x=>x.surgeon)), specs=uniqVals(S.rows.map(x=>x.specialty)), procs=uniqVals(S.rows.map(x=>x.procedure_name));
 document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>➕ PACIENTE SEM CADASTRO EM FILA</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice"><b>Paciente sem cadastro em fila.</b> Este cadastro será criado diretamente na tela de consultas. Depois, o botão “Cadastrar em fila” poderá inseri-lo na Fila de Cirurgia.</div><div class="grid">
 ${field('NOME COMPLETO *','co_patient_name','')}${field('CPF','co_cpf','')}${field('IDS','co_ids','')}${field('CONTATO / WHATSAPP','co_phone','')}
 <div class="field"><label>ESPECIALIDADE</label><select id="f_co_specialty"><option value=""></option>${optionsHtml(specs)}</select></div>
 <div class="field"><label>MÉDICO</label><select id="f_co_surgeon"><option value=""></option>${optionsHtml(docs)}</select></div>
 <div class="field span2"><label>PROCEDIMENTO</label><input id="f_co_procedure_name" list="co_proc_list" placeholder="Selecione ou digite"><datalist id="co_proc_list">${procs.map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist></div>
 ${field('DATA DO AGENDAMENTO','co_appointment_date','', 'date')}${field('DATA DA CONSULTA','co_consultation_date','', 'date')}${field('HORÁRIO','co_consultation_time','', 'time')}${field('UNIDADE PROVENIENTE','co_source_unit','')}${field('RESPONSÁVEL PELO AGENDAMENTO','co_appointment_responsible','')}
 ${selectField('STATUS DA CIRURGIA','co_patient_status','AGUARDANDO ATENDIMENTO',patientStatuses)}${selectField('DUPLO J','co_double_j','NÃO',['NÃO','SIM'])}${field('DATA DE INSTALAÇÃO DO DUPLO J','co_double_j_insert_date','', 'date')}
 <div class="field span3"><label>OBSERVAÇÕES</label><textarea id="f_co_consultation_notes"></textarea></div></div></div><div class="mf"><button class="btn primary" onclick="saveConsultOnlyPatient()">Salvar paciente sem cadastro em fila</button></div></div></div>`;
};

saveConsultOnlyPatient=async function(){
 const name=document.getElementById('f_co_patient_name').value.trim(); if(!name)return alert('Nome do paciente é obrigatório.');
 const dj=document.getElementById('f_co_double_j').value==='SIM'; const djDate=document.getElementById('f_co_double_j_insert_date').value||null;
 if(dj&&!djDate)return alert('Informe a data de instalação do Duplo J.');
 const d={patient_name:name,cpf:document.getElementById('f_co_cpf').value||null,ids:document.getElementById('f_co_ids').value||null,phone:document.getElementById('f_co_phone').value||null,specialty:document.getElementById('f_co_specialty').value||null,surgeon:document.getElementById('f_co_surgeon').value||null,procedure_name:document.getElementById('f_co_procedure_name').value||null,appointment_date:document.getElementById('f_co_appointment_date').value||null,consultation_date:document.getElementById('f_co_consultation_date').value||null,consultation_time:document.getElementById('f_co_consultation_time').value||null,source_unit:document.getElementById('f_co_source_unit').value||null,appointment_responsible:document.getElementById('f_co_appointment_responsible').value||null,patient_status:document.getElementById('f_co_patient_status').value||null,double_j:dj,double_j_insert_date:dj?djDate:null,consultation_notes:document.getElementById('f_co_consultation_notes').value||null,consultation_only:true,stage:'consulta_preop',created_by:uid,updated_by:uid};
 await api('/rest/v1/surgeries',{method:'POST',body:JSON.stringify(d)});document.getElementById('modal').innerHTML='';await load();fillFilters();renderConsult();
};

const oldSaveConsult=saveConsult;
saveConsult=async function(id){
 const dj=document.getElementById('f_double_j').value==='SIM';const dt=document.getElementById('f_double_j_insert_date').value||null;
 if(dj&&!dt)return alert('Informe a data de instalação do Duplo J.');
 return oldSaveConsult(id);
};

renderCurrent();
})();