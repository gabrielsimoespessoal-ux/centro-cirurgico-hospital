(()=>{
// TRIAGEM: resultado pesquisado com ação visível logo na primeira coluna e linha clicável.
window.renderTriageIncludeV8=function(){
  const box=document.getElementById('triageIncludeResults'); if(!box)return;
  const q=(document.getElementById('triageIncludeSearch')?.value||'').trim();
  if(q.length<2){box.innerHTML='<div class="sub">Digite pelo menos 2 caracteres para pesquisar.</div>';return}
  const qq=q.toLowerCase();
  const rows=S.rows.filter(x=>x.active!==false&&x.stage==='fila'&&[x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLowerCase().includes(qq))).slice(0,50);
  box.innerHTML=rows.length?`<div class="tablewrap"><table class="table" style="min-width:950px"><thead><tr><th style="width:110px">AÇÃO</th><th>PACIENTE</th><th>CPF</th><th>IDS</th><th>MÉDICO</th><th>PROCEDIMENTO</th></tr></thead><tbody>${rows.map(x=>`<tr style="cursor:pointer" onclick="includePatientInTriageV8('${x.id}')" title="Clique para incluir este paciente"><td><button class="btn primary small" onclick="event.stopPropagation();includePatientInTriageV8('${x.id}')">➕ Incluir</button></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.cpf||'')}</td><td>${esc(x.ids||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="sub">Nenhum paciente da Fila de Cirurgia encontrado.</div>';
};

// ENFERMEIRO: toda alteração encaminhada pela triagem chega aqui com o motivo visível
// e um campo aberto específico para evolução, conduta e resolução.
window.renderNurse=function(){
  const rows=stageRows('avaliacao_enfermeiro');
  document.getElementById('content').innerHTML=`<section class="card"><div class="section-head"><div><h2>🩺 Avaliação do Enfermeiro</h2><div class="sub">Pacientes encaminhados pela Triagem de Enfermagem para avaliação e resolução</div></div></div><div class="notice"><b>Fluxo automático:</b> quando a Triagem registra alteração nos tópicos 1 ou 2, o paciente é encaminhado diretamente para esta tela. A justificativa da triagem permanece vinculada ao paciente.</div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE</th><th>MÉDICO</th><th>PROCEDIMENTO</th><th>MOTIVO / ALTERAÇÃO DA TRIAGEM</th><th>ÚLTIMA AVALIAÇÃO</th><th>CONDUTA / RESOLUÇÃO</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${actionButtons(x)} <button class="btn small primary" onclick="editNurseV9('${x.id}')">🩺 Avaliar</button></td><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td><td>${esc(x.nurse_referral_reason||x.triage_notes||'—')}</td><td>${x.nurse_at?esc(new Date(x.nurse_at).toLocaleString('pt-BR')):''}</td><td>${esc(x.nurse_observations||'')}</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center;padding:28px">Nenhum paciente aguardando avaliação do enfermeiro.</td></tr>'}</tbody></table></div></section>`;
};

window.editNurseV9=function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  const ck=x.nurse_checklist||{};
  document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>🩺 Avaliação do Enfermeiro: ${esc(x.patient_name)}</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice" style="border-left-color:#d97706;background:#fff7ed"><b>Alteração / justificativa recebida da Triagem:</b><br>${esc(x.nurse_referral_reason||x.triage_notes||'Não informada')}</div><div class="checkgrid">${nurseItems.map((e,i)=>`<label class="check"><input id="nv9_${i}" type="checkbox" ${ck[e]?'checked':''}> ${esc(e)}</label>`).join('')}</div><div class="field" style="margin-top:16px"><label>Conduta e resolução do enfermeiro *</label><textarea id="nv9_resolution" rows="7" placeholder="Descreva avaliação, conduta adotada, orientações, encaminhamentos e resolução...">${esc(x.nurse_observations||'')}</textarea></div><div class="notice" style="margin-top:12px"><b>Profissional:</b> ${esc(S.profile?.full_name||S.profile?.email||'usuário logado')}<br><b>Data/hora:</b> será registrada automaticamente ao salvar.</div></div><div class="mf"><button class="btn primary" onclick="saveNurseV9('${id}')">Salvar avaliação</button></div></div></div>`;
};

window.saveNurseV9=async function(id){
  const resolution=(document.getElementById('nv9_resolution')?.value||'').trim();
  if(!resolution)return alert('Preencha a conduta e resolução do enfermeiro.');
  const ck={}; nurseItems.forEach((e,i)=>ck[e]=!!document.getElementById('nv9_'+i)?.checked);
  await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({nurse_checklist:ck,nurse_observations:resolution,nurse_by:uid,nurse_at:new Date().toISOString(),updated_by:uid})});
  document.getElementById('modal').innerHTML='';
  await load(); renderNurse();
  alert('Avaliação, conduta e resolução salvas para o paciente.');
};

// compatibilidade com botões antigos
window.editNurse=window.editNurseV9;
window.saveNurse=window.saveNurseV9;
if(S.view==='entrevista_tecnico')renderTriage();
if(S.view==='avaliacao_enfermeiro')renderNurse();
})();