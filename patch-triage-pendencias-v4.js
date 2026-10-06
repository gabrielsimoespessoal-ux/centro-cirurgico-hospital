(()=>{
const orderedViewsV4=['fila','pendencias','consulta_preop','exames','entrevista_tecnico','avaliacao_enfermeiro','mapa_cirurgico','suspensas','duploj','pos_operatorio','indicadores'];
function forceTabsV4(){
  const tabs=document.getElementById('tabs'); if(!tabs)return;
  tabs.innerHTML=orderedViewsV4.map(v=>`<button class="tab ${v===S.view?'on':''}" onclick="setView('${v}',this)">${labels[v]}</button>`).join('');
}
renderTabs=function(){forceTabsV4()};
setTimeout(forceTabsV4,50);setTimeout(forceTabsV4,500);

function hasOperationalPendency(x){
  const ps=String(x.patient_status||'').toUpperCase();
  const rs=String(x.request_status||'').toUpperCase();
  const rv=String(x.revalidation_status||'').toUpperCase();
  if(['PENDENTE','SOLICITADO','AGUARDANDO PERÍCIA','DEVOLVIDO','PENDENTE PRE OP','SOLICITADO REVALIDAÇÃO'].includes(ps))return true;
  if(['SOLICITAR','SOLICITADO'].includes(rv))return true;
  if(rs==='EM PREPARAÇÃO')return true;
  if(x.exam_pending)return true;
  return false;
}
async function routePendingRowsV4(){
  const candidates=S.rows.filter(x=>x.active!==false && !x.consultation_only && x.patient_status!=='SUSPENSA' && x.stage!=='pendencias' && hasOperationalPendency(x));
  if(!candidates.length)return false;
  for(let i=0;i<candidates.length;i+=40){
    const batch=candidates.slice(i,i+40);
    const ids=batch.map(x=>x.id).join(',');
    await api('/rest/v1/surgeries?id=in.('+ids+')',{method:'PATCH',body:JSON.stringify({stage:'pendencias',updated_by:uid})});
    batch.forEach(x=>x.stage='pendencias');
  }
  return true;
}
const oldLoadV4=load;
load=async function(){await oldLoadV4();try{await routePendingRowsV4()}catch(e){console.warn('Falha ao rotear pendências',e)}};

const oldNextV4=nextStage;
nextStage=async function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  if(x.patient_status==='SUSPENSA')return alert('Paciente suspenso. Retire a suspensão antes de avançar o fluxo.');
  if(hasOperationalPendency(x)){
    if(x.stage==='pendencias')return alert('Este paciente ainda possui pendências. Resolva revalidação, autorização, exames ou demais pendências antes de avançar.');
    if(!confirm2(`Foram identificadas pendências para ${x.patient_name}. Deseja encaminhar para Pendências?`,'Confirma o encaminhamento automático para a aba Pendências?'))return;
    await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({stage:'pendencias',updated_by:uid})});
    await load();renderCurrent();return;
  }
  return oldNextV4(id);
};

renderPendencias=function(){
 const rows=stageRows('pendencias');
 document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>⚠ Pendências (${rows.length} pacientes)</h2><div class="sub">Pacientes com revalidação, autorização, exames ou outras pendências são direcionados automaticamente para cá.</div></div></div><div class="notice"><b>Não é possível cadastrar paciente diretamente nesta tela.</b> O paciente chega aqui automaticamente quando uma pendência é identificada. O botão “Próxima etapa” só funciona depois que as pendências forem resolvidas.</div>${baseTable(rows)}</section>`;
};

const triageGroupsV4=[
 {title:'1. Investigação de Estado de Saúde Atual (Triagem de Sintomas)',alterKey:'alteracao_topico1',qs:[
  ['sintomas','Nas últimas duas semanas, o(a) senhor(a) apresentou febre, tosse, dor de garganta, coriza ou falta de ar?','select'],
  ['gi_urina','Apresentou algum quadro de diarreia, vômito ou infecção urinária recentemente?','select'],
  ['pa_glicemia','Houve alguma alteração na sua pressão arterial ou glicemia nos últimos dias?','select'],
  ['problema_saude','O(a) senhor(a) tem algum problema de saúde?','select']
 ]},
 {title:'2. Checagem de Medicamentos',alterKey:'alteracao_topico2',qs:[
  ['medicamentos','Quais medicamentos o(a) senhor(a) toma diariamente?','text'],
  ['suspensao_meds','O médico orientou suspender algum remédio (como aspirina, anticoagulantes ou para diabetes)? O(a) senhor(a) seguiu essa orientação?','text']
 ]},
 {title:'3. Alergias e Histórico',qs:[
  ['alergias','Possui alguma alergia conhecida a medicamentos (ex: dipirona, penicilina), látex ou alimentos?','text'],
  ['cirurgias_previas','Já realizou cirurgias antes?','text']
 ]},
 {title:'4. Orientação sobre Jejum e Logística',qs:[
  ['jejum','Orientações a respeito do jejum de sólidos e líquidos foram reforçadas?','check'],
  ['acompanhante','Presença do acompanhante obrigatório foi confirmada?','check'],
  ['documentos','Paciente orientado a trazer exames impressos, documentos de identificação e itens de uso pessoal?','check']
 ]}
];
function triageControlV4(k,type,val){
 if(type==='select')return `<select id="t_${k}"><option value=""></option><option value="SIM" ${val==='SIM'?'selected':''}>SIM</option><option value="NÃO" ${val==='NÃO'?'selected':''}>NÃO</option></select>`;
 if(type==='check')return `<label class="check"><input id="t_${k}" type="checkbox" ${val===true||val==='SIM'?'checked':''}> Confirmado</label>`;
 return `<textarea id="t_${k}">${esc(val||'')}</textarea>`;
}
renderTriage=function(){
 const rows=stageRows('entrevista_tecnico');
 document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>☎ Triagem de Enfermagem</h2><div class="sub">A triagem é individual e sempre vinculada a um paciente desta etapa.</div></div></div><div class="notice">Clique em <b>☎ Entrevista</b> no paciente para abrir e preencher o checklist de triagem.</div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE</th><th>MÉDICO</th><th>PROCEDIMENTO</th><th>ENTREVISTADOR</th><th>DATA/HORA</th><th>JUSTIFICATIVA AO ENFERMEIRO</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${actionButtons(x)} <button class="btn small" onclick="editTriage('${x.id}')">☎ Entrevista</button></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.triage_by?'Registrado':'')}</td><td>${esc(x.triage_at||'')}</td><td>${esc(x.nurse_referral_reason||'')}</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:28px">Nenhum paciente nesta etapa.</td></tr>'}</tbody></table></div></section>`;
};
editTriage=function(id){
 let x=S.rows.find(r=>r.id===id),a=x.triage_answers||{};
 document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>☎ Triagem de Enfermagem: ${esc(x.patient_name)}</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice"><b>Paciente:</b> ${esc(x.patient_name)} &nbsp; <b>CPF:</b> ${esc(x.cpf||'—')} &nbsp; <b>IDS:</b> ${esc(x.ids||'—')}<br><b>Regra automática:</b> se houver alteração no tópico 1 ou 2, o paciente será encaminhado diretamente para Avaliação do Enfermeiro.</div>${triageGroupsV4.map(g=>`<div style="border:1px solid #d7e0ea;border-radius:10px;padding:14px;margin-bottom:14px"><h3 style="margin:0 0 12px;color:#1f3f8f">${g.title}</h3>${g.qs.map(([k,q,t])=>`<div class="field" style="margin-bottom:10px"><label>${q}</label>${triageControlV4(k,t,a[k])}</div>`).join('')}${g.alterKey?`<div class="field" style="margin-top:10px"><label style="color:#b45309">⚠ Alteração identificada neste tópico?</label><select id="t_${g.alterKey}"><option value="NÃO" ${a[g.alterKey]!=='SIM'?'selected':''}>NÃO</option><option value="SIM" ${a[g.alterKey]==='SIM'?'selected':''}>SIM</option></select></div>`:''}</div>`).join('')}<div class="field"><label>Observações da triagem</label><textarea id="t_notes">${esc(x.triage_notes||'')}</textarea></div><div class="field" style="margin-top:12px"><label>Justificativa para encaminhar ao enfermeiro</label><textarea id="t_reason">${esc(x.nurse_referral_reason||'')}</textarea></div></div><div class="mf"><button class="btn" onclick="saveTriageV4('${id}',false)">Salvar triagem</button><button class="btn green" onclick="saveTriageV4('${id}',true)">Encaminhar para o Enfermeiro</button></div></div></div>`;
};
saveTriageV4=async function(id,manualForward){
 let answers={};
 triageGroupsV4.forEach(g=>{g.qs.forEach(([k,q,t])=>{const el=document.getElementById('t_'+k);answers[k]=t==='check'?(el.checked?'SIM':'NÃO'):(el.value||'')});if(g.alterKey)answers[g.alterKey]=document.getElementById('t_'+g.alterKey).value||'NÃO'});
 const autoForward=answers.alteracao_topico1==='SIM'||answers.alteracao_topico2==='SIM';
 let reason=(document.getElementById('t_reason').value||'').trim();
 if(autoForward&&!reason)reason='Encaminhamento automático: alteração identificada no tópico '+(answers.alteracao_topico1==='SIM'&&answers.alteracao_topico2==='SIM'?'1 e 2':answers.alteracao_topico1==='SIM'?'1':'2')+' da triagem.';
 if(manualForward&&!reason)return alert('A justificativa é obrigatória para encaminhar manualmente ao enfermeiro.');
 let d={triage_answers:answers,triage_notes:document.getElementById('t_notes').value||null,triage_by:uid,triage_at:new Date().toISOString(),nurse_referral_reason:reason||null,updated_by:uid};
 if(autoForward||manualForward)d.stage='avaliacao_enfermeiro';
 await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify(d)});
 document.getElementById('modal').innerHTML='';await load();renderCurrent();
 if(autoForward)alert('Alteração identificada no tópico 1 ou 2. Paciente encaminhado automaticamente para Avaliação do Enfermeiro.');
};
saveTriage=saveTriageV4;

const examListV5=[
 'Tomografia de Abdômen','Tomografia de Tórax','Tomografia de Pelve','Tomografia de Crânio',
 'Raio X de Tórax','Raio X de Membros','Raio X de Abdômen',
 'Hemograma','Coagulograma','Glicemia em Jejum','Creatinina','Ureia','ECG','ECOTT','Holter','Outros'
];
function normalizeExamV5(raw){
 if(raw && typeof raw==='object' && ('status' in raw || 'alteracao' in raw))return {status:raw.status||'',alteracao:raw.alteracao||''};
 if(raw===true)return {status:'REALIZADO',alteracao:'NÃO'};
 return {status:'',alteracao:''};
}
function examRowV5(name,i,data){
 const v=normalizeExamV5(data);
 const safeId='ev5_'+i;
 return `<tr><td><b>${esc(name)}</b>${name==='Outros'?`<div style="margin-top:6px"><input id="ex_other_name" placeholder="Digite o outro exame" value="${esc((data&&data.nome)||'')}" style="width:100%;padding:7px;border:1px solid #c9d6e6;border-radius:6px"></div>`:''}</td><td><select id="${safeId}_status" onchange="toggleExamAlterV5(${i})"><option value=""></option><option value="REALIZADO" ${v.status==='REALIZADO'?'selected':''}>REALIZADO</option><option value="NÃO REALIZADO" ${v.status==='NÃO REALIZADO'?'selected':''}>NÃO REALIZADO</option><option value="PENDENTE" ${v.status==='PENDENTE'?'selected':''}>PENDENTE</option></select></td><td><select id="${safeId}_alter" ${v.status==='REALIZADO'?'':'disabled'}><option value=""></option><option value="NÃO" ${v.alteracao==='NÃO'?'selected':''}>SEM ALTERAÇÃO</option><option value="SIM" ${v.alteracao==='SIM'?'selected':''}>COM ALTERAÇÃO</option></select></td></tr>`;
}
toggleExamAlterV5=function(i){const st=document.getElementById('ev5_'+i+'_status'),al=document.getElementById('ev5_'+i+'_alter');if(!st||!al)return;al.disabled=st.value!=='REALIZADO';if(al.disabled)al.value='';};
renderExams=function(){
 const rows=stageRows('exames');
 document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>🧪 Exames (NIR)</h2><div class="sub">Checklist individual de exames por paciente</div></div></div><div class="notice">Clique em <b>🧪 Exames</b> no paciente. Cada exame pode ser marcado como Realizado, Não realizado ou Pendente. Se realizado, é possível informar se houve alteração.</div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE</th><th>MÉDICO</th><th>PROCEDIMENTO</th><th>PENDÊNCIA</th><th>ÚLTIMO REGISTRO</th><th>OBSERVAÇÕES</th></tr></thead><tbody>${rows.map(x=>{const ck=x.exam_checklist||{},meta=ck.__meta||{};return `<tr><td>${actionButtons(x)} <button class="btn small" onclick="editExams('${x.id}')">🧪 Exames</button></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td><td>${x.exam_pending?'<span class="pill bad">SIM</span>':'<span class="pill ok">NÃO</span>'}</td><td>${esc(meta.registered_by||'')} ${meta.registered_at?'<br><span class="sub">'+esc(new Date(meta.registered_at).toLocaleString('pt-BR'))+'</span>':''}</td><td>${esc(x.exam_observations||'')}</td></tr>`}).join('')||'<tr><td colspan="7" style="text-align:center;padding:28px">Nenhum paciente nesta etapa.</td></tr>'}</tbody></table></div></section>`;
};
editExams=function(id){
 const x=S.rows.find(r=>r.id===id),ck=x.exam_checklist||{},meta=ck.__meta||{};
 const loginAtual=S.profile?.full_name||jwt().email||'Usuário logado';
 document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>🧪 Exames: ${esc(x.patient_name)}</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice"><b>Paciente:</b> ${esc(x.patient_name)} &nbsp; <b>CPF:</b> ${esc(x.cpf||'—')} &nbsp; <b>IDS:</b> ${esc(x.ids||'—')}</div><div class="tablewrap"><table class="table" style="min-width:760px"><thead><tr><th>EXAME</th><th>STATUS</th><th>SE REALIZADO</th></tr></thead><tbody>${examListV5.map((e,i)=>examRowV5(e,i,ck[e])).join('')}</tbody></table></div><div class="field" style="margin-top:14px"><label>Observações</label><textarea id="f_exam_observations" rows="5">${esc(x.exam_observations||'')}</textarea></div><div class="dj-note" style="margin-top:10px"><b>Registro:</b> ${esc(meta.registered_by||loginAtual)}${meta.registered_at?' — '+esc(new Date(meta.registered_at).toLocaleString('pt-BR')):''}<br><span class="sub">Ao salvar, o login e a data/hora do profissional que realizou este registro serão atualizados automaticamente.</span></div></div><div class="mf"><button class="btn primary" onclick="saveExamsV5('${id}')">Salvar exames</button></div></div></div>`;
};
saveExamsV5=async function(id){
 const ck={}; let pending=false;
 examListV5.forEach((e,i)=>{const st=document.getElementById('ev5_'+i+'_status').value||'',al=document.getElementById('ev5_'+i+'_alter').value||'';if(st==='PENDENTE')pending=true;ck[e]={status:st,alteracao:st==='REALIZADO'?al:''};if(e==='Outros')ck[e].nome=(document.getElementById('ex_other_name')?.value||'').trim()});
 const login=S.profile?.full_name||jwt().email||uid||'Usuário logado';
 ck.__meta={registered_by:login,registered_by_id:uid,registered_at:new Date().toISOString()};
 const d={exam_checklist:ck,exam_other:ck['Outros']?.nome||null,exam_pending:pending,exam_observations:document.getElementById('f_exam_observations').value||null,updated_by:uid};
 await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify(d)});
 document.getElementById('modal').innerHTML='';await load();renderExams();
};
saveExams=saveExamsV5;

const oldRenderCurrentV4=renderCurrent;
renderCurrent=function(){if(S.view==='pendencias')return renderPendencias();if(S.view==='entrevista_tecnico')return renderTriage();if(S.view==='exames')return renderExams();return oldRenderCurrentV4()};
forceTabsV4();renderCurrent();
})();