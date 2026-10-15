(()=>{
// Atualização exclusivamente visual/operacional. Nunca altera dados automaticamente.
if(window.__hsjFluxoUnificado20261015)return;
window.__hsjFluxoUnificado20261015=true;
const forbidden='pendencias';
const safe=s=>esc(String(s??''));
const locate=x=>x.stage===forbidden?'fila':x.stage;
const originalTabs=window.renderTabs;
window.renderTabs=function(){
 originalTabs.apply(this,arguments);
 const tabs=document.getElementById('tabs');
 if(!tabs)return;
 tabs.querySelectorAll('button').forEach(b=>{
   const handler=b.getAttribute('onclick')||'';
   if(handler.includes("'pendencias'")||/^\s*(⚠\s*)?pendências/i.test(b.textContent||''))b.remove();
 });
};
const oldSetView=window.setView;
window.setView=function(view,...args){return oldSetView.call(this,view===forbidden?'fila':view,...args)};
if(S.view===forbidden)S.view='fila';
// Proteção para qualquer registro antigo ainda em Pendências na sessão.
const oldStageRows=window.stageRows;
window.stageRows=function(stage){
 if(stage==='fila')return filtered(S.rows.filter(x=>x.stage==='fila'||x.stage===forbidden));
 if(stage===forbidden)return [];
 return oldStageRows(stage);
};
// Pular a antiga etapa no fluxo de avanço de Fila.
const oldNextStage=window.nextStage;
window.nextStage=async function(id){
 const x=S.rows.find(r=>r.id===id);
 if(!x||!['fila',forbidden].includes(x.stage))return oldNextStage(id);
 if(x.patient_status==='SUSPENSA')return alert('Paciente suspenso. Regularize a situação antes de avançar.');
 const destination='consulta_preop';
 if(!confirm2('Avançar '+x.patient_name+' para '+(labels[destination]||destination)+'?','A Fila contém pendências registradas. Verifique-as antes de confirmar a movimentação.'))return;
 try{await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({stage:destination,updated_by:uid})});await load();renderCurrent()}
 catch(e){alert('Movimentação não confirmada: '+e.message)}
};
// Pesquisa independente dos filtros da aba atual.
function resultSearch(){
 const field=document.getElementById('hsjBuscaLocal20261015');
 const q=(field?.value||'').trim().toLocaleLowerCase('pt-BR');
 const output=document.getElementById('hsjBuscaResultados20261015');
 if(!output)return;
 if(!q){output.innerHTML='<span class="sub">Pesquise por nome, CPF ou IDS para localizar a etapa de qualquer paciente.</span>';return}
 const matches=S.rows.filter(x=>[x.patient_name,x.cpf,x.ids].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q))).slice(0,100);
 output.innerHTML=matches.length?'<div style="overflow:auto;max-height:310px"><table class="table"><thead><tr><th>Paciente</th><th>IDS</th><th>Localização</th><th>Ações</th></tr></thead><tbody>'+
 matches.map(x=>'<tr><td><b>'+safe(x.patient_name)+'</b></td><td>'+safe(x.ids||'—')+'</td><td><span class="pill ok">'+safe(labels[locate(x)]||locate(x))+'</span></td><td><button class="btn small" onclick="hsjAbrirLocalizacao20261015(\''+x.id+'\')">Ir à aba</button> <button class="btn small" onclick="editPatient(\''+x.id+'\')">✏ Editar</button> <button class="btn small" onclick="openReferralV18(\''+x.id+'\',\'supervisao\')">Supervisão</button> <button class="btn small" onclick="openReferralV18(\''+x.id+'\',\'avaliacao_enfermeiro\')">Enfermeiro</button></td></tr>').join('')+'</tbody></table></div>':'<div class="notice">Nenhum paciente encontrado.</div>';
}
window.hsjPesquisarPaciente20261015=resultSearch;
window.hsjAbrirLocalizacao20261015=function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return;
 window.setView(locate(x),document.querySelector('#tabs .tab')||null);
 document.querySelectorAll('#tabs .tab').forEach(b=>b.classList.toggle('on',(b.getAttribute('onclick')||'').includes("'"+locate(x)+"'")));
 const input=document.getElementById('gfName');if(input)input.value='';
 if(typeof window.clearGlobalFiltersV16==='function')window.clearGlobalFiltersV16();
 renderCurrent();
 document.getElementById('content')?.scrollIntoView({behavior:'smooth',block:'start'});
};
function addSearch(){
 let bar=document.getElementById('hsjBuscaPainel20261015');
 if(!bar){
  bar=document.createElement('section');bar.className='card';bar.id='hsjBuscaPainel20261015';
  bar.style.cssText='padding:14px;margin:12px 0';
  bar.innerHTML='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>🔎 Localizar paciente em todas as abas</b><input id="hsjBuscaLocal20261015" style="min-width:260px;flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:7px" placeholder="Nome, CPF ou IDS"><button class="btn primary" onclick="hsjPesquisarPaciente20261015()">Pesquisar</button><button class="btn" onclick="document.getElementById(\'hsjBuscaLocal20261015\').value=\'\';hsjPesquisarPaciente20261015()">Limpar</button></div><div id="hsjBuscaResultados20261015" style="margin-top:10px" class="sub">Pesquise para identificar em qual aba o paciente está.</div>';
  const tabs=document.getElementById('tabs');
  if(tabs)tabs.insertAdjacentElement('afterend',bar);else document.getElementById('content')?.parentElement?.prepend(bar);
  bar.querySelector('input').addEventListener('keydown',e=>{if(e.key==='Enter')resultSearch()});
 }
}
const oldCurrent=window.renderCurrent;
window.renderCurrent=function(){
 if(S.view===forbidden)S.view='fila';
 const r=oldCurrent.apply(this,arguments);
 addSearch();
 // Em ambas as caixas, acesso à edição completa sem sair da própria aba.
 if(['supervisao','avaliacao_enfermeiro'].includes(S.view)){
  const content=document.getElementById('content');
  content?.querySelectorAll('tbody tr').forEach(tr=>{
   if(tr.querySelector('[data-hsj-edit]'))return;
   const id=(tr.innerHTML.match(/(?:openResolveV18|editNurseV10|editPatient)\('([0-9a-f-]{36})'/)||[])[1];
   if(!id||!S.rows.some(x=>x.id===id))return;
   const cell=tr.lastElementChild;if(!cell)return;
   const b=document.createElement('button');b.className='btn small';b.dataset.hsjEdit='1';b.textContent='✏ Editar cadastro';b.onclick=()=>editPatient(id);
   cell.append(' ',b);
  });
 }
 return r;
};
const oldSup=window.renderSupervisionV18;
if(typeof oldSup==='function')window.renderSupervisionV18=function(){
 const r=oldSup.apply(this,arguments);
 const tbody=document.querySelector('#content tbody');
 if(tbody){
  const map=(S.rows||[]);
  tbody.querySelectorAll('tr').forEach(tr=>{
   const name=tr.querySelector('td b')?.textContent;
   if(!name)return;
   const patients=map.filter(x=>x.patient_name===name);
   if(patients.length!==1)return;
   const cell=tr.lastElementChild;
   if(cell&&!cell.querySelector('[data-hsj-edit]')){
    const b=document.createElement('button');b.className='btn small';b.dataset.hsjEdit='1';b.textContent='✏ Editar cadastro';b.onclick=()=>editPatient(patients[0].id);cell.append(' ',b);
   }
  });
 }
 return r;
};
renderTabs();renderCurrent();addSearch();
})();