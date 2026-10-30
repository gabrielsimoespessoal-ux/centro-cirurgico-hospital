(()=>{
if(window.__hsjRealizadasEtapa20261030)return;window.__hsjRealizadasEtapa20261030=true;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[c]));
const forbidden=new Set(['exames','pos_operatorio']);
const validStages=['fila','consulta_preop','recebimento_nir','programacao','entrevista_tecnico','mapa_cirurgico','realizadas','concluida'];
labels.realizadas='Cirurgias Realizadas';
const originalTabs=window.renderTabs;
window.renderTabs=function(){
 const result=originalTabs.apply(this,arguments);
 const tabs=document.getElementById('tabs');
 if(!tabs)return result;
 for(const tab of [...tabs.querySelectorAll('button')]){
  const onclick=tab.getAttribute('onclick')||'';
  if(/setView\('(exames|pos_operatorio)'/.test(onclick)||/^(exames \(nir\)|p[oó]s.operat[oó]rio)$/i.test(tab.textContent.trim()))tab.remove();
 }
 return result;
};
const originalSetView=window.setView;
window.setView=function(view,button){
 if(forbidden.has(view)){alert('Esta etapa foi desativada. Utilize a Fila de Cirurgia.');view='fila';button=null;}
 return originalSetView.apply(this,[view,button]);
};
window.hsjRenderRealizadasEtapa20261030=function(){
 const rows=(S.rows||[]).filter(x=>x.active!==false&&x.stage==='realizadas');
 const root=document.getElementById('content');if(!root)return;
 root.innerHTML='<section class="card"><div class="section-head"><div><h2>✅ Cirurgias Realizadas / Encerradas por Data ('+rows.length+')</h2><div class="sub">Pacientes encaminhados automaticamente ao fim do dia cirúrgico. O encaminhamento não confirma a execução da cirurgia.</div></div><button class="btn" onclick="window.print()">🖨 Imprimir</button></div><div class="notice">A situação real do procedimento permanece conforme o cadastro. Registros de suspensão e cancelamento não são encaminhados automaticamente para esta etapa.</div><div class="tablewrap"><table class="table"><thead><tr><th>AÇÕES</th><th>PACIENTE</th><th>DATA</th><th>SALA</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>SITUAÇÃO REGISTRADA</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><button class="btn small" onclick="editPatient(\''+x.id+'\')">✏ Cadastro</button> <button class="btn small" onclick="hsjAbrirRetornoRealizadas20261030(\''+x.id+'\')">↩ Encaminhar para etapa</button></td><td><b>'+safe(x.patient_name)+'</b></td><td>'+safe(x.surgery_date||'—')+'</td><td>'+safe(x.map_room||'—')+'</td><td>'+safe(x.procedure_name||'—')+'</td><td>'+safe(x.specialty||'—')+'</td><td>'+safe(x.surgeon||'—')+'</td><td>'+safe(x.patient_status||'Não informada')+'</td></tr>').join('')+'</tbody></table></div></section>';
};
window.hsjAbrirRetornoRealizadas20261030=function(id){
 const x=S.rows.find(y=>y.id===id&&y.stage==='realizadas');if(!x)return;
 const options=validStages.filter(v=>v!=='realizadas').map(v=>'<option value="'+v+'">'+safe(labels[v]||v)+'</option>').join('');
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal"><div class="mh"><b>Encaminhar paciente — '+safe(x.patient_name)+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><div class="field"><label>Etapa de destino</label><select id="hsjRealizadasDestino">'+options+'</select></div><div class="notice">A situação da cirurgia não será alterada automaticamente. Confira o cadastro se precisar corrigir o status.</div></div><div class="mf"><button class="btn primary" onclick="hsjSalvarRetornoRealizadas20261030(\''+id+'\')">Confirmar</button></div></div></div>';
};
window.hsjSalvarRetornoRealizadas20261030=async function(id){
 const to=document.getElementById('hsjRealizadasDestino')?.value;
 if(!validStages.includes(to)||to==='realizadas')return alert('Destino inválido.');
 if(!confirm('Confirmar encaminhamento para '+(labels[to]||to)+'?'))return;
 try{
  const out=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&stage=eq.realizadas',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({stage:to,updated_by:uid})});
  if(!Array.isArray(out)||out.length!==1)throw Error('Etapa já alterada ou atualização não confirmada.');
  document.getElementById('modal').innerHTML='';await load();renderCurrent();
 }catch(e){alert('Falha no encaminhamento: '+e.message)}
};
const originalRender=window.renderCurrent;
window.renderCurrent=function(){
 if(forbidden.has(S.view)){S.view='fila';renderTabs();}
 if(S.view==='realizadas')return window.hsjRenderRealizadasEtapa20261030();
 return originalRender.apply(this,arguments);
};
const prevRealized=window.renderRealizedV12;
window.renderRealizedV12=function(){return window.hsjRenderRealizadasEtapa20261030()};
renderTabs();
if(S.view==='realizadas')renderCurrent();
})();