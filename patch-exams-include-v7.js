(()=>{
function filaExamCandidatesV7(){
  const q=(document.getElementById('examIncludeSearch')?.value||'').trim().toLowerCase();
  if(q.length<2)return [];
  return S.rows.filter(x=>x.active!==false && x.stage==='fila' && [x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,50);
}
window.openExamIncludeV7=function(){
  document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>➕ Incluir paciente em Exames</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="notice">Pesquise um paciente que esteja atualmente na <b>Fila de Cirurgia</b>. Ao incluir, ele será direcionado diretamente para <b>Exames (NIR)</b>.</div><div class="field"><label>Pesquisar por nome, CPF ou IDS</label><input id="examIncludeSearch" placeholder="Digite pelo menos 2 caracteres" oninput="renderExamIncludeV7()"></div><div id="examIncludeResults" style="margin-top:12px"><div class="sub">Digite pelo menos 2 caracteres para pesquisar.</div></div></div></div></div>`;
};
window.renderExamIncludeV7=function(){
  const box=document.getElementById('examIncludeResults'); if(!box)return;
  const q=(document.getElementById('examIncludeSearch')?.value||'').trim();
  if(q.length<2){box.innerHTML='<div class="sub">Digite pelo menos 2 caracteres para pesquisar.</div>';return}
  const rows=filaExamCandidatesV7();
  box.innerHTML=rows.length?`<div class="tablewrap"><table class="table"><thead><tr><th>PACIENTE</th><th>CPF</th><th>IDS</th><th>MÉDICO</th><th>PROCEDIMENTO</th><th>AÇÃO</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.patient_name)}</b></td><td>${esc(x.cpf||'')}</td><td>${esc(x.ids||'')}</td><td>${esc(x.surgeon||'')}</td><td>${esc(x.procedure_name||'')}</td><td><button class="btn primary small" onclick="includePatientInExamsV7('${x.id}')">➕ Incluir</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="sub">Nenhum paciente da Fila de Cirurgia encontrado com essa pesquisa.</div>';
};
window.includePatientInExamsV7=async function(id){
  const x=S.rows.find(r=>r.id===id); if(!x)return;
  if(!confirm(`Incluir ${x.patient_name} diretamente em Exames (NIR)?`))return;
  await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify({stage:'exames',updated_by:uid})});
  document.getElementById('modal').innerHTML='';
  await load();
  renderExams();
  alert('Paciente incluído em Exames (NIR).');
};
const oldRenderExamsV7=window.renderExams;
window.renderExams=function(){
  oldRenderExamsV7();
  const head=document.querySelector('#content .section-head');
  if(head && !document.getElementById('btnIncludeExamV7')){
    const b=document.createElement('button');
    b.id='btnIncludeExamV7';
    b.className='btn primary';
    b.textContent='➕ Incluir';
    b.onclick=openExamIncludeV7;
    head.appendChild(b);
  }
};
if(S.view==='exames')renderExams();
})();