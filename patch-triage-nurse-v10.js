(()=>{
window.scheduleFromTriageV10=async function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  if(!confirm(`Agendar cirurgia de ${x.patient_name} e encaminhar para o Mapa Cirúrgico?`))return;
  if(!confirm('Confirma o encaminhamento deste paciente para o Mapa Cirúrgico (Agendamento)?'))return;
  await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({stage:'mapa_cirurgico',updated_by:uid})});
  await load(); renderTriage();
  alert('Paciente encaminhado para o Mapa Cirúrgico (Agendamento).');
};

window.renderTriage=function(){
  const rows=stageRows('entrevista_tecnico');
  document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>☎ Triagem de Enfermagem</h2><div class="sub">A triagem é individual e sempre vinculada a um paciente desta etapa.</div></div></div><div class="notice">Clique em <b>☎ Entrevista</b> no paciente para abrir o checklist. Quando o enfermeiro devolver um caso para a Triagem, a resolução ficará visível nesta tela.</div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE</th><th>MÉDICO</th><th>PROCEDIMENTO</th><th>ENTREVISTADOR</th><th>DATA/HORA</th><th>JUSTIFICATIVA AO ENFERMEIRO</th><th>RETORNO / RESOLUÇÃO DO ENFERMEIRO</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${actionButtons(x)} <button class="btn small" onclick="editTriage('${x.id}')">☎ Entrevista</button> <button class="btn green small" onclick="scheduleFromTriageV10('${x.id}')">🏥 Agendar cirurgia</button></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.triage_by?'Registrado':'')}</td><td>${x.triage_at?esc(new Date(x.triage_at).toLocaleString('pt-BR')):''}</td><td>${esc(x.nurse_referral_reason||'')}</td><td>${x.nurse_observations?`<b>${esc(x.nurse_observations)}</b>${x.nurse_at?`<br><span class="sub">Respondido em ${esc(new Date(x.nurse_at).toLocaleString('pt-BR'))}</span>`:''}`:'—'}</td></tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:28px">Nenhum paciente nesta etapa.</td></tr>'}</tbody></table></div></section>`;
  const head=document.querySelector('#content .section-head');
  if(head&&!document.getElementById('btnIncludeTriageV8')){
    const b=document.createElement('button');b.id='btnIncludeTriageV8';b.className='btn primary';b.textContent='➕ Incluir';b.onclick=openTriageIncludeV8;head.appendChild(b);
  }
};

window.editNurseV10=function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  const ck=x.nurse_checklist||{};
  document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>🩺 Avaliação do Enfermeiro: ${esc(x.patient_name)}</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice" style="border-left-color:#d97706;background:#fff7ed"><b>Alteração / justificativa recebida da Triagem:</b><br>${esc(x.nurse_referral_reason||x.triage_notes||'Não informada')}</div><div class="checkgrid">${nurseItems.map((e,i)=>`<label class="check"><input id="nv10_${i}" type="checkbox" ${ck[e]?'checked':''}> ${esc(e)}</label>`).join('')}</div><div class="field" style="margin-top:16px"><label>Conduta, resolução e observação do enfermeiro *</label><textarea id="nv10_resolution" rows="7" placeholder="Descreva avaliação, conduta adotada, orientação, resolução e observações para a equipe de triagem...">${esc(x.nurse_observations||'')}</textarea></div><div class="notice" style="margin-top:12px"><b>Profissional:</b> ${esc(S.profile?.full_name||S.profile?.email||'usuário logado')}<br><b>Data/hora:</b> será registrada automaticamente ao salvar ou devolver para a Triagem.</div></div><div class="mf" style="gap:10px"><button class="btn primary" onclick="saveNurseV10('${id}',false)">Salvar avaliação</button><button class="btn green" onclick="saveNurseV10('${id}',true)">↩ Devolver para Triagem</button></div></div></div>`;
};

window.saveNurseV10=async function(id,returnTriage){
  const resolution=(document.getElementById('nv10_resolution')?.value||'').trim();
  if(!resolution)return alert('Preencha a conduta, resolução e observação do enfermeiro.');
  if(returnTriage){
    if(!confirm('Devolver este paciente para a Triagem de Enfermagem com a resolução registrada?'))return;
    if(!confirm('Confirma o retorno para a Triagem? A resolução ficará visível para a equipe.'))return;
  }
  const ck={}; nurseItems.forEach((e,i)=>ck[e]=!!document.getElementById('nv10_'+i)?.checked);
  const d={nurse_checklist:ck,nurse_observations:resolution,nurse_by:uid,nurse_at:new Date().toISOString(),updated_by:uid};
  if(returnTriage)d.stage='entrevista_tecnico';
  await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify(d)});
  document.getElementById('modal').innerHTML='';
  await load();
  if(returnTriage){renderNurse();alert('Paciente devolvido para a Triagem com a resolução do enfermeiro.');}
  else {renderNurse();alert('Avaliação do enfermeiro salva.');}
};

window.renderNurse=function(){
  const rows=stageRows('avaliacao_enfermeiro');
  document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>🩺 Avaliação do Enfermeiro</h2><div class="sub">Pacientes encaminhados pela Triagem para avaliação, conduta e resolução</div></div></div><div class="notice">Após registrar a conduta, o enfermeiro pode <b>devolver o paciente para a Triagem</b>. A resolução e observações permanecerão vinculadas ao paciente e serão exibidas para a equipe de triagem.</div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE</th><th>MÉDICO</th><th>PROCEDIMENTO</th><th>MOTIVO / ALTERAÇÃO DA TRIAGEM</th><th>ÚLTIMA AVALIAÇÃO</th><th>CONDUTA / RESOLUÇÃO</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${actionButtons(x)} <button class="btn small primary" onclick="editNurseV10('${x.id}')">🩺 Avaliar / Resolver</button></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.nurse_referral_reason||x.triage_notes||'—')}</td><td>${x.nurse_at?esc(new Date(x.nurse_at).toLocaleString('pt-BR')):''}</td><td>${esc(x.nurse_observations||'')}</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:28px">Nenhum paciente aguardando avaliação do enfermeiro.</td></tr>'}</tbody></table></div></section>`;
};

window.editNurse=window.editNurseV10;
window.saveNurse=window.saveNurseV10;
if(S.view==='entrevista_tecnico')renderTriage();
if(S.view==='avaliacao_enfermeiro')renderNurse();
})();