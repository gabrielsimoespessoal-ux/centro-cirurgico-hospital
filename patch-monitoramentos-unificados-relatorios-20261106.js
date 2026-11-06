(()=>{
'use strict';
if(window.__hsjMonitoramentoUnificado20261106)return;
window.__hsjMonitoramentoUnificado20261106=true;
const TYPES={
 avaliacao_enfermeiro:{title:'Monitoramento Enfermeiro',claim:'enfermeiro'},
 supervisao:{title:'Monitoramento Supervisão',claim:'supervisao'},
 monitoramento_administrativo:{title:'Monitoramento Administrativo',claim:'administrativo'}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.valueOf())?'—':d.toLocaleString('pt-BR',{timeZone:'America/Maceio',dateStyle:'short',timeStyle:'short'})};
const dateOnly=v=>{if(!v)return '';const d=new Date(v);if(Number.isNaN(d.valueOf()))return '';const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Maceio',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const a={};for(const part of parts)a[part.type]=part.value;return a.year+'-'+a.month+'-'+a.day};
const viewState={};
let cache=null,inFlight=null,seq=0;
let monitoringNotes=[];
let savingNote=false;
const patientCache=new Map();
function state(){return viewState[S.view]||(viewState[S.view]={tab:'pending',from:'',to:'',search:''})}
function patient(id){return (S.rows||[]).find(x=>String(x.id)===String(id))||patientCache.get(String(id))}
function normalizeRecords([sup,adm,claims,nurse]){
 const all=[
 ...(sup||[]).map(r=>({key:'sup:'+r.id,id:r.id,kind:r.destination==='avaliacao_enfermeiro'?'enfermeiro':r.destination==='monitoramento_administrativo'?'administrativo':'supervisao',patientId:r.surgery_id,created:r.created_at,completed:r.resolved_at,reason:r.reason,response:r.resolution,destination:r.return_stage,origin:r.origin_stage,status:r.status,source:'Encaminhamento Supervisão'})),
 ...(adm||[]).map(r=>({key:'adm:'+r.id,id:r.id,kind:'administrativo',patientId:r.surgery_id,created:r.created_at,completed:r.resolved_at,reason:r.reason,response:r.resolution,destination:r.return_stage,origin:r.origin_stage,status:r.status,source:'Encaminhamento Administrativo'})),
 ...(claims||[]).map(r=>({key:'claim:'+r.id,id:r.id,kind:r.monitor_type==='monitoramento_administrativo'?'administrativo':r.monitor_type,patientId:r.surgery_id,created:r.created_at,completed:r.resolved_at,reason:r.reason,response:r.response,destination:r.destination,origin:'Solicitação direta',status:r.status,source:'Monitoramento direto'})),
 ...(nurse||[]).map(r=>({key:'nurse:'+r.id,id:r.id,kind:'enfermeiro',patientId:r.surgery_id,created:r.reviewed_at,completed:r.reviewed_at,reason:r.reason,response:[r.assessment,r.notes].filter(Boolean).join(' — '),destination:r.decision,origin:'Avaliação clínica',status:'respondido',source:'Avaliação de enfermagem',historicalOnly:true}))
 ];
 return all;
}
async function paged(table){
 const out=[];
 for(let offset=0;offset<50000;offset+=500){
  const part=await api('/rest/v1/'+table+'?select=*&order=created_at.desc&limit=500&offset='+offset);
  if(!Array.isArray(part))throw Error('Resposta inválida: '+table);
  out.push(...part);if(part.length<500)return out;
 }
 throw Error('Histórico extenso demais; refine o período antes de consultar.');
}
async function loadData(force=false){
 if(inFlight)return inFlight;
 if(cache&&!force&&Date.now()-cache.ts<30000)return cache.rows;
 inFlight=(async()=>{
  const [sup,adm,claims,nurse,notes]=await Promise.all([
    paged('supervision_referrals'),
    paged('administrative_referrals'),
    paged('monitoring_claims_hsj'),
    api('/rest/v1/nurse_reviews?select=*&order=reviewed_at.desc&limit=5000'),
    api('/rest/v1/monitoring_notes_hsj?select=*&order=created_at.desc&limit=10000')
  ]);
  monitoringNotes=Array.isArray(notes)?notes:[];
  const rows=normalizeRecords([sup,adm,claims,nurse]);
  // Consultar também os cadastros históricos, inclusive inativos, sem inseri-los
  // na lista operacional S.rows (que não deve ressuscitar pacientes encerrados).
  const missing=[...new Set(rows.filter(r=>r.patientId&&!patient(r.patientId)).map(r=>String(r.patientId)))];
  for(let offset=0;offset<missing.length;offset+=50){
   try{
    const ids=missing.slice(offset,offset+50);
    const found=await api('/rest/v1/surgeries?select=id,patient_name,ids,cpf,specialty,surgeon,active&'+'id=in.('+ids.map(encodeURIComponent).join(',')+')');
    for(const p of found||[])if(p.id)patientCache.set(String(p.id),p);
   }catch(error){console.warn('Identificação histórica de monitoramento não disponível:',error)}
  }
  cache={rows,ts:Date.now()};return rows;
 })();
 try{return await inFlight}finally{inFlight=null}
}
function subset(view,all){return all.filter(x=>x.kind===TYPES[view].claim)}
function filtered(rows,s,treated){
 return rows.filter(r=>{
  if(treated&&r.status!=='respondido')return false;
  if(!treated&&r.status!=='aguardando')return false;
  const dt=dateOnly(treated?(r.completed||r.created):r.created);
  if(s.from&&dt<s.from)return false;
  if(s.to&&dt>s.to)return false;
  const p=patient(r.patientId),q=s.search.trim().toLocaleLowerCase('pt-BR');
  return !q||[p?.patient_name,p?.ids,p?.cpf,r.reason,r.response,r.source].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q));
 }).sort((a,b)=>String(treated?(b.completed||b.created):a.created).localeCompare(String(treated?(a.completed||a.created):b.created)));
}
function action(r){
 if(r.historicalOnly)return '';
 if(r.key.startsWith('claim:'))return "hsjRespondClaim('"+r.id+"')";
 if(r.key.startsWith('sup:'))return "openResolveV18('"+r.id+"')";
 if(r.key.startsWith('adm:'))return "hsjResponderAdminV26('"+r.id+"')";
 return '';
}

const NOTE_TYPES={sem_contato:'Contato sem sucesso',em_acompanhamento:'Em acompanhamento',orientacao:'Orientação realizada',tratativa:'Tratativa registrada',outro:'Outro registro'};
function notesOf(r){
 const source=r.key?.split(':')[0];
 return monitoringNotes.filter(n=>n.referral_source===source&&String(n.referral_id)===String(r.id)).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
}
function noteHistory(r){
 const notes=notesOf(r);
 if(!notes.length)return '';
 return '<details style="margin-top:6px"><summary style="font-size:11px;cursor:pointer">Histórico de respostas ('+notes.length+')</summary>'+
 notes.map(n=>'<div style="border-bottom:1px solid #e0e6ee;padding:5px 0;font-size:11px"><strong>'+esc(NOTE_TYPES[n.outcome]||n.outcome)+'</strong> — '+esc(date(n.created_at))+
 (n.completed_without_transfer?' · Concluído sem encaminhamento':' · Mantido em acompanhamento')+'<div style="white-space:pre-wrap">'+esc(n.note)+'</div></div>').join('')+'</details>';
}
function openNote(r){
 if(!r||r.status!=='aguardando'||r.historicalOnly)return;
 const p=patient(r.patientId),modal=document.getElementById('modal');if(!modal)return;
 modal.innerHTML='<div class="back"><div class="modal" style="max-width:700px"><div class="mh"><b>Registrar resposta — '+esc(p?.patient_name||'Monitoramento')+'</b><button type="button" class="btn" id="hsjNoteClose">Fechar</button></div>'+
 '<div class="mb"><div class="notice">Esta função não encaminha o paciente para outra etapa. Você pode registrar uma tentativa e manter a pendência aberta ou concluir a tratativa sem encaminhar.</div>'+
 '<div class="field"><label>Resultado do contato / atendimento *</label><select id="hsjNoteOutcome">'+Object.entries(NOTE_TYPES).map(([v,l])=>'<option value="'+v+'">'+esc(l)+'</option>').join('')+'</select></div>'+
 '<div class="field"><label>Descrição da resposta ou tentativa *</label><textarea id="hsjNoteText" rows="5" maxlength="5000" placeholder="Ex.: tentei contato telefônico, sem sucesso. Nova tentativa programada."></textarea></div>'+
 '<div class="field"><label>Após registrar *</label><select id="hsjNoteFinish"><option value="pending">Registrar e manter pendente</option><option value="complete">Concluir monitoramento sem encaminhar</option></select></div>'+
 '<div class="sub">Se o contato não foi realizado, a solicitação continuará pendente. Todas as tentativas ficarão identificadas no histórico.</div>'+
 noteHistory(r)+'</div><div class="mf"><button type="button" class="btn primary" id="hsjNoteSave">Salvar resposta</button></div></div></div>';
 modal.querySelector('#hsjNoteClose').onclick=()=>modal.innerHTML='';
 const outcome=modal.querySelector('#hsjNoteOutcome'),finish=modal.querySelector('#hsjNoteFinish');
 outcome.onchange=()=>{if(outcome.value==='sem_contato'){finish.value='pending';finish.querySelector('[value="complete"]').disabled=true}else finish.querySelector('[value="complete"]').disabled=false};
 outcome.dispatchEvent(new Event('change'));
 modal.querySelector('#hsjNoteSave').onclick=async()=>{
  if(savingNote)return;
  const note=modal.querySelector('#hsjNoteText')?.value.trim()||'',result=outcome.value,complete=finish.value==='complete';
  if(note.length<3)return alert('Descreva a tentativa ou resposta com pelo menos 3 caracteres.');
  if(complete&&result==='sem_contato')return alert('Sem contato: mantenha a solicitação pendente.');
  if(complete&&!confirm('Concluir a tratativa sem encaminhar o paciente? O registro sairá da lista de pendentes, mas permanecerá no relatório e histórico.'))return;
  savingNote=true;const btn=modal.querySelector('#hsjNoteSave');btn.disabled=true;
  try{
   const [source]=r.key.split(':');
   const id=await api('/rest/v1/rpc/hsj_registrar_resposta_monitoramento',{method:'POST',body:JSON.stringify({p_source:source,p_referral_id:r.id,p_outcome:result,p_note:note,p_complete:complete})});
   if(!id)throw Error('Servidor não confirmou a gravação.');
   modal.innerHTML='';
   cache=null;
   await refreshView(true);
   alert(complete?'Tratativa concluída sem encaminhamento. Registro preservado no relatório.':'Resposta registrada no histórico. Monitoramento permanece pendente.');
  }catch(e){alert('Não foi possível salvar: '+e.message)}
  finally{savingNote=false;if(btn?.isConnected)btn.disabled=false}
 };
}
function drawTable(rows,treated){
 const head='<div class="tablewrap"><table class="table" style="min-width:850px"><thead><tr><th>Paciente</th><th>Especialidade / médico</th><th>Origem</th><th>Motivo</th><th>'+(treated?'Resposta / tratativa':'Recebido')+'</th><th>'+(treated?'Tratado em / destino':'Ação')+'</th></tr></thead><tbody>';
 const body=rows.map(r=>{
  const p=patient(r.patientId);const name=p?.patient_name||'Cadastro não carregado';
  return '<tr><td><b>'+esc(name)+'</b><div class="sub">IDS: '+esc(p?.ids||'—')+'</div></td><td>'+esc(p?.specialty||'—')+'<div class="sub">'+esc(p?.surgeon||'—')+'</div></td><td>'+esc(r.source)+'</td><td style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.reason||'—')+'</td><td style="white-space:pre-wrap;overflow-wrap:anywhere">'+(treated?esc(r.response||'Sem resposta documentada'):esc(date(r.created))+noteHistory(r))+'</td><td>'+(treated?esc(date(r.completed||r.created))+'<div class="sub">'+esc(labels[r.destination]||r.destination||'—')+'</div>' :'<button type="button" class="btn small" data-hsj-note="'+esc(r.key)+'">Só responder</button> <button type="button" class="btn primary small" data-hsj-answer="'+esc(r.key)+'">Responder / encaminhar</button>')+(p?'<div><button type="button" class="btn small" data-hsj-consult="'+esc(p.id)+'">Consultar cadastro</button></div>':'<div class="sub">Registro vinculado ao banco; atualize para localizar o cadastro</div>')+'</td></tr>';
 }).join('');
 return head+(body||'<tr><td colspan="6" style="text-align:center;padding:24px">Nenhum '+(treated?'atendimento concluído':'monitoramento pendente')+' no filtro.</td></tr>')+'</tbody></table></div>';
}
function stats(all){
 const pending=all.filter(x=>x.status==='aguardando'),treated=all.filter(x=>x.status==='respondido');
 return {pending:pending.length,treated:treated.length,unique:new Set(pending.map(x=>x.patientId)).size};
}
function renderUI(rows){
 const view=S.view;if(!TYPES[view])return;
 const s=state(),all=subset(view,rows),st=stats(all),treated=s.tab==='treated',listed=filtered(all,s,treated),root=document.getElementById('content');
 if(!root)return;
 root.innerHTML='<section class="card" id="hsjMonitorSimplificado"><div class="section-head"><div><h2>📋 '+esc(TYPES[view].title)+'</h2><div class="sub">Uma única área para acompanhamento; relatórios de tratativas disponíveis nesta mesma tela.</div></div><div style="display:flex;gap:6px;flex-wrap:wrap">'+
 '<button type="button" class="btn" id="hsjMonRefresh">↻ Atualizar</button>'+
 '<button type="button" class="btn" id="hsjMonPull">↩ Puxar monitoramento</button></div></div>'+
 '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button type="button" class="btn '+(treated?'':'primary')+'" id="hsjMonPending">Pendentes ('+st.pending+')</button><button type="button" class="btn '+(treated?'primary':'')+'" id="hsjMonTreated">📊 Relatórios de pacientes tratados ('+st.treated+')</button></div>'+
 '<div class="notice">Pendências: <b>'+st.pending+'</b> · Pacientes únicos pendentes: <b>'+st.unique+'</b> · Tratativas concluídas: <b>'+st.treated+'</b>. Um paciente pode ter mais de um encaminhamento em datas diferentes.</div>'+
 '<div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:12px 0">'+
 '<label>De <input type="date" id="hsjMonFrom" value="'+esc(s.from)+'"></label><label>Até <input type="date" id="hsjMonTo" value="'+esc(s.to)+'"></label>'+
 '<label style="flex:1;min-width:200px">Buscar paciente / IDS / motivo <input type="search" id="hsjMonSearch" value="'+esc(s.search)+'" placeholder="Pesquisar monitoramentos" style="width:100%"></label>'+
 '<button type="button" class="btn" id="hsjMonClear">Limpar filtros</button>'+
 (treated?'<button type="button" class="btn" id="hsjMonCsv">⬇ Excel (CSV)</button><button type="button" class="btn primary" id="hsjMonPrint">🖨 Imprimir relatório</button>':'')+'</div>'+
 '<div class="sub" style="margin-bottom:8px"><b>'+listed.length+'</b> '+(treated?'tratativas concluídas':'encaminhamentos pendentes')+' no filtro.</div>'+
 drawTable(listed,treated)+'</section>';
 root.querySelector('#hsjMonPending').onclick=()=>{s.tab='pending';renderUI(rows)};
 root.querySelector('#hsjMonTreated').onclick=()=>{s.tab='treated';renderUI(rows)};
 root.querySelector('#hsjMonRefresh').onclick=()=>refreshView(true);
 root.querySelector('#hsjMonPull').onclick=()=>window.hsjPullMonitor?.(TYPES[view].claim);
 for(const [field,id] of [['from','hsjMonFrom'],['to','hsjMonTo'],['search','hsjMonSearch']])root.querySelector('#'+id).addEventListener('change',e=>{s[field]=e.target.value;renderUI(rows)});
 root.querySelector('#hsjMonSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){s.search=e.target.value;renderUI(rows)}});
 root.querySelector('#hsjMonClear').onclick=()=>{s.from='';s.to='';s.search='';renderUI(rows)};
 for(const b of root.querySelectorAll('[data-hsj-note]'))b.onclick=()=>openNote(listed.find(x=>x.key===b.dataset.hsjNote));
 for(const b of root.querySelectorAll('[data-hsj-answer]')){
  b.onclick=()=>{const r=listed.find(x=>x.key===b.dataset.hsjAnswer),fn=action(r||{});if(!fn)return;const id=r.id;
   if(r.key.startsWith('claim:'))window.hsjRespondClaim?.(id);
   else if(r.key.startsWith('sup:'))window.openResolveV18?.(id);
   else if(r.key.startsWith('adm:'))window.hsjResponderAdminV26?.(id);
  };
 }
 for(const b of root.querySelectorAll('[data-hsj-consult]'))b.onclick=()=>window.hsjConsultarCadastroV24?.(b.dataset.hsjConsult);
 if(treated){root.querySelector('#hsjMonCsv').onclick=()=>exportCsv(listed,view);root.querySelector('#hsjMonPrint').onclick=()=>printReport(listed,view)}
}
function csvCell(v){const t=String(v??'').replace(/"/g,'""');return '"'+t+'"'}
function reportValues(list){
 return list.map(r=>{const p=patient(r.patientId);return [p?.patient_name||'Cadastro não carregado',p?.ids||'',p?.specialty||'',p?.surgeon||'',r.source,r.reason,r.response,r.created,r.completed,r.destination]});
}
function exportCsv(list,view){
 const headers=['Paciente','IDS','Especialidade','Médico','Origem','Motivo','Resposta / tratativa','Recebido em','Tratado em','Destino','Histórico de respostas e tentativas'];
 const csv='\uFEFF'+[headers,...reportValues(list)].map(row=>row.map(csvCell).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
 const a=document.createElement('a');a.href=url;a.download='SIGMA_tratativas_'+view+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function printReport(list,view){
 const w=window.open('','_blank');if(!w)return alert('Habilite janelas para imprimir.');
 const s=state(),unique=new Set(list.map(r=>r.patientId)).size;
 const line=list.map(r=>{const p=patient(r.patientId);return '<tr><td>'+esc(p?.patient_name||'Cadastro não carregado')+'<div>'+esc(p?.ids||'')+'</div></td><td>'+esc(p?.specialty||'—')+'</td><td>'+esc(r.source)+'</td><td>'+esc(r.reason||'—')+'</td><td>'+esc(r.response||'Sem resposta documentada')+noteHistory(r)+'</td><td>'+esc(date(r.completed||r.created))+'</td><td>'+esc(labels[r.destination]||r.destination||'—')+'</td></tr>'}).join('');
 const css='@page{size:A4 landscape;margin:10mm}body{font:11px Arial;color:#1b2b42}h1{font-size:19px}p{color:#41556e}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #b9c9d8;padding:7px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#e8eef7;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}@media print{button{display:none}}';
 w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatórios de pacientes tratados — '+esc(TYPES[view].title)+'</title><style>'+css+'</style></head><body><h1>Hospital São José — '+esc(TYPES[view].title)+'</h1><h2>Relatório de respostas e tratativas concluídas</h2><p>Filtro: '+esc(s.from||'Início')+' a '+esc(s.to||'atual')+' · Tratativas concluídas: <b>'+list.length+'</b> · Pacientes únicos: <b>'+unique+'</b></p><button onclick="window.print()">Imprimir / PDF</button><table><thead><tr><th>Paciente / IDS</th><th>Especialidade</th><th>Origem</th><th>Motivo</th><th>Resposta / tratativa</th><th>Data da resposta</th><th>Destino</th></tr></thead><tbody>'+line+'</tbody></table></body></html>');w.document.close();w.focus();w.print();
}
async function refreshView(force){
 const view=S.view;if(!TYPES[view])return;
 const ticket=++seq;
 const target=document.getElementById('content');if(target)target.innerHTML='<section class="card"><h2>Carregando monitoramentos...</h2></section>';
 try{const rows=await loadData(force);if(ticket===seq&&S.view===view)renderUI(rows)}
 catch(e){if(ticket===seq&&S.view===view){target.innerHTML='<section class="card"><h2>Não foi possível carregar monitoramentos</h2><p>'+esc(e.message)+'</p><button class="btn" id="hsjMonRetry">Tentar novamente</button></section>';target.querySelector('#hsjMonRetry').onclick=()=>refreshView(true)}}
}
const priorLoad=window.load;
window.load=async function(){const result=await priorLoad.apply(this,arguments);cache=null;return result};
const previous=window.renderCurrent;
window.renderCurrent=function(){if(!TYPES[S.view])return previous.apply(this,arguments);return refreshView(false)};
if(TYPES[S.view])refreshView(false);
})();