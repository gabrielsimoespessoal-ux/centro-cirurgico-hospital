(()=>{
function hasPendencyV8(x){
  const ps=String(x.patient_status||'').toUpperCase();
  const rs=String(x.request_status||'').toUpperCase();
  const rv=String(x.revalidation_status||'').toUpperCase();
  const reasons=[];
  if(['PENDENTE','SOLICITADO','AGUARDANDO PERÍCIA','DEVOLVIDO','PENDENTE PRE OP','SOLICITADO REVALIDAÇÃO'].includes(ps)) reasons.push('Situação do paciente: '+ps);
  if(['SOLICITAR','SOLICITADO'].includes(rv)) reasons.push('Revalidação pendente');
  if(rs==='EM PREPARAÇÃO') reasons.push('Solicitação em preparação');
  if(x.exam_pending) reasons.push('Exames pendentes');
  return reasons;
}

window.movePatientV8=async function(id,stage,msg){
  await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({stage,updated_by:uid})});
  const x=S.rows.find(r=>r.id===id); if(x)x.stage=stage;
  document.getElementById('modal').innerHTML='';
  renderCurrent();
  if(msg)alert(msg);
};

window.returnToQueueV8=function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  const reasons=hasPendencyV8(x);
  if(reasons.length){
    document.getElementById('modal').innerHTML=`<div class="back"><div class="modal" style="max-width:620px"><div class="mh"><b>⚠ Pendência identificada</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice" style="border-left-color:#d97706;background:#fff7ed"><b>${esc(x.patient_name)}</b> possui informação de pendência no cadastro.</div><div style="padding:12px 0"><b>Pendências encontradas:</b><ul>${reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div><div class="notice">Escolha para onde deseja direcionar o paciente:</div></div><div class="mf" style="gap:10px"><button class="btn" onclick="movePatientV8('${id}','fila','Paciente devolvido para a Fila de Cirurgia.')">↩ Fila de Cirurgia</button><button class="btn orange" onclick="movePatientV8('${id}','pendencias','Paciente direcionado para Pendências.')">⚠ Pendências</button></div></div></div>`;
    return;
  }
  if(!confirm(`Devolver ${x.patient_name} para a Fila de Cirurgia?`))return;
  if(!confirm('Confirma o retorno deste paciente para a Fila de Cirurgia?'))return;
  movePatientV8(id,'fila','Paciente devolvido para a Fila de Cirurgia.');
};

const oldActionButtonsV8=window.actionButtons;
window.actionButtons=function(x){
  let html=oldActionButtonsV8(x);
  if(x.stage!=='fila')html+=` <button class="btn small" style="border-color:#64748b;color:#334155" onclick="returnToQueueV8('${x.id}')">↩ Devolver para a fila</button>`;
  return html;
};

function filaTriageCandidatesV8(){
  const q=(document.getElementById('triageIncludeSearch')?.value||'').trim().toLowerCase();
  if(q.length<2)return [];
  return S.rows.filter(x=>x.active!==false&&x.stage==='fila'&&[x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,50);
}
window.openTriageIncludeV8=function(){
  document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>➕ Incluir paciente na Triagem de Enfermagem</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice">Pesquise um paciente que esteja atualmente na <b>Fila de Cirurgia</b>. Ao incluir, ele sairá da fila e será direcionado diretamente para <b>Triagem de Enfermagem</b>.</div><div class="field"><label>Pesquisar por nome, CPF ou IDS</label><input id="triageIncludeSearch" placeholder="Digite pelo menos 2 caracteres" oninput="renderTriageIncludeV8()"></div><div id="triageIncludeResults" style="margin-top:12px"><div class="sub">Digite pelo menos 2 caracteres para pesquisar.</div></div></div></div></div>`;
};
window.renderTriageIncludeV8=function(){
  const box=document.getElementById('triageIncludeResults'); if(!box)return;
  const q=(document.getElementById('triageIncludeSearch')?.value||'').trim();
  if(q.length<2){box.innerHTML='<div class="sub">Digite pelo menos 2 caracteres para pesquisar.</div>';return}
  const rows=filaTriageCandidatesV8();
  box.innerHTML=rows.length?`<div class="tablewrap"><table class="table"><thead><tr><th>PACIENTE</th><th>CPF</th><th>IDS</th><th>MÉDICO</th><th>PROCEDIMENTO</th><th>AÇÃO</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.cpf||'')}</td><td>${esc(x.ids||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td><td><button class="btn primary small" onclick="includePatientInTriageV8('${x.id}')">➕ Incluir</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="sub">Nenhum paciente da Fila de Cirurgia encontrado.</div>';
};
window.includePatientInTriageV8=async function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  const reasons=hasPendencyV8(x);
  if(reasons.length){
    document.getElementById('modal').innerHTML=`<div class="back"><div class="modal" style="max-width:620px"><div class="mh"><b>⚠ Pendência identificada</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><p><b>${esc(x.patient_name)}</b> possui pendência no cadastro:</p><ul>${reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><div class="notice">Antes de seguir para a Triagem, escolha o destino.</div></div><div class="mf"><button class="btn" onclick="movePatientV8('${id}','fila','Paciente mantido na Fila de Cirurgia.')">↩ Manter na Fila</button><button class="btn orange" onclick="movePatientV8('${id}','pendencias','Paciente direcionado para Pendências.')">⚠ Ir para Pendências</button></div></div></div>`;
    return;
  }
  if(!confirm(`Incluir ${x.patient_name} diretamente na Triagem de Enfermagem?`))return;
  await movePatientV8(id,'entrevista_tecnico','Paciente incluído na Triagem de Enfermagem.');
  renderTriage();
};

const oldRenderTriageV8=window.renderTriage;
window.renderTriage=function(){
  oldRenderTriageV8();
  const head=document.querySelector('#content .section-head');
  if(head&&!document.getElementById('btnIncludeTriageV8')){
    const b=document.createElement('button');b.id='btnIncludeTriageV8';b.className='btn primary';b.textContent='➕ Incluir';b.onclick=openTriageIncludeV8;head.appendChild(b);
  }
};

const oldIncludeExamV8=window.includePatientInExamsV7;
if(oldIncludeExamV8){
  window.includePatientInExamsV7=async function(id){
    const x=S.rows.find(r=>r.id===id); if(!x)return;
    const reasons=hasPendencyV8(x);
    if(reasons.length){
      document.getElementById('modal').innerHTML=`<div class="back"><div class="modal" style="max-width:620px"><div class="mh"><b>⚠ Pendência identificada</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><p><b>${esc(x.patient_name)}</b> possui pendência no cadastro:</p><ul>${reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><div class="notice">Antes de seguir para Exames, escolha o destino.</div></div><div class="mf"><button class="btn" onclick="movePatientV8('${id}','fila','Paciente mantido na Fila de Cirurgia.')">↩ Manter na Fila</button><button class="btn orange" onclick="movePatientV8('${id}','pendencias','Paciente direcionado para Pendências.')">⚠ Ir para Pendências</button></div></div></div>`;
      return;
    }
    return oldIncludeExamV8(id);
  };
}

if(S.view==='entrevista_tecnico')renderTriage();
else renderCurrent();
})();