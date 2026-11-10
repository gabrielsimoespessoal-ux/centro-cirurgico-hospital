(()=>{
'use strict';
// Indicador autônomo: operações somente na tabela cirurgias_remarcadas_indicadores.
// Não altera nenhuma linha de surgeries, etapa, mapa ou contadores da jornada.
const VIEW='remarcadas_indicadores';
const MOTIVOS=['Cirurgia previamente agendada que precisou ser remarcada','Paciente não sabia a data e precisou de ajuste','Falta de anestesista','Indisponibilidade de médico cirurgião','Falta de OPME','Tempo cirúrgico','Outro motivo'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let entries=[],loading=false,lastError='',filterStart='',filterEnd='',filterReason='',filterName='';
const content=()=>document.getElementById('content');
function field(id,label,type='text',extra=''){return '<label class="field"><span>'+esc(label)+'</span><input id="rm-'+id+'" type="'+type+'" '+extra+'></label>'}
function selectOptions(values,placeholder='Selecione...'){return '<option value="">'+esc(placeholder)+'</option>'+values.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')}
function currentToken(){return window.token||localStorage.getItem('sb_access_token')||''}
async function request(path,options={}){
 let r=await fetch('https://uulsxmdycbihwkbftcdv.supabase.co'+path,{
 ...options,headers:{apikey:window.KEY||'sb_publishable_odmXzemIQZwx1BxrJiUYnQ_iZfPVHlV',Authorization:'Bearer '+currentToken(),'Content-Type':'application/json',...(options.headers||{})}
 });
 if(!r.ok){let x='';try{const z=await r.json();x=z.message||z.error||z.details||JSON.stringify(z)}catch{}throw Error(x||'Erro '+r.status)}
 if(r.status===204)return [];
 const raw=await r.text();
 if(!raw.trim())return [];
 try{return JSON.parse(raw)}catch{throw Error('Resposta inválida do servidor')}
}
async function read(){
 if(loading)return;loading=true;lastError='';
 try{
  let all=[];
  for(let off=0;off<100000;off+=500){
   let page=await request('/rest/v1/cirurgias_remarcadas_indicadores?select=*&order=registrado_em.desc&limit=500&offset='+off);
   if(!Array.isArray(page))throw Error('Resposta inesperada do banco');
   all.push(...page);
   if(page.length<500)break;
   if(off+500>=100000)throw Error('Limite de paginação atingido');
  }
  entries=all;
 }catch(e){lastError=e.message||String(e);console.error('Cirurgias remarcadas',e)}
 finally{loading=false;if(S?.view===VIEW)draw()}
}
function matches(x){return (!filterStart||x.data_original>=filterStart)&&(!filterEnd||x.data_original<=filterEnd)&&(!filterReason||x.motivo===filterReason)&&(!filterName||[x.paciente_nome,x.paciente_ids,x.procedimento,x.medico_cirurgiao].join(' ').toLowerCase().includes(filterName))}
const visible=()=>entries.filter(matches);
function fmtDate(v){if(!v)return 'Não informada';const p=String(v).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:v}
function daysBetween(a,b){if(!a||!b)return null;return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)}
function draw(){
 if(S?.view!==VIEW)return;
 const e=content();if(!e)return;
 const list=visible();
 const related=list.filter(x=>['Falta de anestesista','Tempo cirúrgico'].includes(x.motivo)).length;
 const stats=[['REAGENDAMENTOS',list.length],['FALTA DE ANESTESISTA',list.filter(x=>x.motivo==='Falta de anestesista').length],['TEMPO CIRÚRGICO',list.filter(x=>x.motivo==='Tempo cirúrgico').length],['OUTROS MOTIVOS',list.length-related]];
 e.innerHTML='<section class="card" id="remarcadas-relatorio"><div class="section-head"><div><h2>↻ Cirurgias Remarcadas</h2><div class="sub">Registro independente para indicadores. Não integra a Jornada Cirúrgica, Fila ou Mapa.</div></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn primary" id="rm-new">+ Registrar reagendamento</button><button class="btn" id="rm-export">⬇ Excel (CSV)</button><button class="btn" id="rm-print">🖨 Imprimir</button><button class="btn" id="rm-refresh">↻ Atualizar</button></div></div><div class="cards">'+stats.map(([k,v])=>'<div class="kpi"><div class="label">'+k+'</div><div class="value">'+v+'</div></div>').join('')+'</div><div class="notice">Este painel contabiliza <b>ocorrências de remarcação</b>, não cirurgias realizadas ou suspensas. Um mesmo paciente pode ter mais de um registro de reagendamento. Motivos não são presumidos.</div><div class="consult-filters" style="grid-template-columns:repeat(4,minmax(0,1fr))"><label class="field"><span>Data original — de</span><input id="rm-from" type="date" value="'+esc(filterStart)+'"></label><label class="field"><span>Data original — até</span><input id="rm-to" type="date" value="'+esc(filterEnd)+'"></label><label class="field"><span>Motivo</span><select id="rm-filter-reason">'+selectOptions(MOTIVOS,'Todos os motivos')+'</select></label><label class="field"><span>Buscar paciente / IDS / médico</span><input id="rm-filter-name" value="'+esc(filterName)+'" placeholder="Nome, IDS ou procedimento"></label></div><div class="tablewrap"><table class="table" style="min-width:1060px"><thead><tr><th>Data inicial / nova</th><th>Paciente / IDS</th><th>Procedimento / especialidade</th><th>Cirurgião</th><th>Motivo</th><th>Registro</th></tr></thead><tbody>'+ (list.length?list.map(x=>'<tr><td><b>'+fmtDate(x.data_original)+'</b><div class="sub">Nova: '+fmtDate(x.data_remarcada)+'</div></td><td><b>'+esc(x.paciente_nome)+'</b><div class="sub">'+esc(x.paciente_ids||'Sem IDS')+'</div></td><td>'+esc(x.procedimento)+'<div class="sub">'+esc(x.especialidade)+'</div></td><td>'+esc(x.medico_cirurgiao)+'</td><td><b>'+esc(x.motivo)+'</b>'+(x.motivo_outro?'<div class="sub">'+esc(x.motivo_outro)+'</div>':'')+(x.observacoes?'<div class="sub">'+esc(x.observacoes)+'</div>':'')+'</td><td>'+new Date(x.registrado_em).toLocaleString('pt-BR')+'<div class="sub">Registro imutável</div></td></tr>').join(''):'<tr><td colspan="6" style="padding:30px;text-align:center">Nenhum registro para os filtros.</td></tr>')+'</tbody></table></div>'+(lastError?'<div class="notice" style="background:#fff0ed;color:#ad3025">Falha ao carregar dados: '+esc(lastError)+'</div>':'')+'</section>';
 document.getElementById('rm-filter-reason').value=filterReason;
 const f=()=>{filterStart=document.getElementById('rm-from').value;filterEnd=document.getElementById('rm-to').value;filterReason=document.getElementById('rm-filter-reason').value;filterName=document.getElementById('rm-filter-name').value.toLowerCase();draw()};
 for(const id of ['rm-from','rm-to','rm-filter-reason'])document.getElementById(id).addEventListener('change',f);
 document.getElementById('rm-filter-name').addEventListener('change',f);
 document.getElementById('rm-new').onclick=newRecord;
 document.getElementById('rm-refresh').onclick=read;
 document.getElementById('rm-export').onclick=exportCsv;
 document.getElementById('rm-print').onclick=()=>window.print();
}
function exportCsv(){
 const rows=[['Data original','Nova data','Paciente','IDS','CPF','Procedimento','Especialidade','Cirurgião','Motivo','Outro motivo','Observações','Data do registro','Responsável UID']];
 for(const x of visible())rows.push([x.data_original,x.data_remarcada,x.paciente_nome,x.paciente_ids,x.paciente_cpf,x.procedimento,x.especialidade,x.medico_cirurgiao,x.motivo,x.motivo_outro,x.observacoes,x.registrado_em,x.registrado_por]);
 if(typeof window.downloadCsv==='function'){window.downloadCsv('indicadores_cirurgias_remarcadas.csv',rows);return}
 const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const a=document.createElement('a');a.href=window.URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='cirurgias_remarcadas.csv';a.click();window.URL.revokeObjectURL(a.href);
}
function newRecord(){
 const m=document.getElementById('modal');if(!m)return;
 const patients=(S?.rows||[]).filter(x=>x.active!==false);
 m.innerHTML='<div class="back" id="rm-overlay"><div class="modal"><div class="mh"><div><h2 style="margin:0">Registrar cirurgia remarcada</h2><span class="sub">Indicador independente: não modifica Fila, Mapa ou Jornada Cirúrgica</span></div><button class="btn" id="rm-close">Fechar</button></div><form id="rm-form"><div class="mb"><div class="grid"><label class="field span3"><span>Buscar paciente já cadastrado (opcional)</span><input id="rm-lookup" autocomplete="off" placeholder="Nome / IDS / CPF"><select id="rm-pick" size="4" style="display:none;margin-top:6px;width:100%"></select></label>'+field('name','Nome completo do paciente *','text','required minlength="3" maxlength="200"')+field('ids','IDS / Prontuário','text')+field('cpf','CPF','text')+field('procedure','Procedimento cirúrgico *','text','required minlength="3"')+field('specialty','Especialidade','text')+field('surgeon','Médico cirurgião','text')+field('original','Data da cirurgia originalmente prevista *','date','required')+field('newdate','Nova data prevista (se definida)','date')+'<label class="field span2"><span>Motivo do reagendamento *</span><select id="rm-reason" required>'+selectOptions(MOTIVOS)+'</select></label><label class="field span3" id="rm-other-wrap" style="display:none"><span>Especifique o novo motivo *</span><input id="rm-other" maxlength="500"></label><label class="field span3"><span>Descrição / justificativa complementar</span><textarea id="rm-notes" rows="3" maxlength="2000" placeholder="Detalhes da ocorrência, contexto e providências..."></textarea></label></div><div class="notice">O cadastro registra uma ocorrência estatística. Não altera a data nem o status cirúrgico do paciente no Mapa.</div><div id="rm-message" class="sub"></div></div><div class="mf"><button type="button" class="btn" id="rm-cancel">Cancelar</button><button type="submit" class="btn primary" id="rm-save">Salvar registro do indicador</button></div></form></div></div>';
 let surgeryId=null;
 const dom=id=>document.getElementById('rm-'+id);
 const close=()=>m.innerHTML='';
 dom('close').onclick=close;dom('cancel').onclick=close;
 dom('reason').onchange=()=>{dom('other-wrap').style.display=dom('reason').value==='Outro motivo'?'flex':'none';dom('other').required=dom('reason').value==='Outro motivo'};
 dom('lookup').oninput=()=>{
  const q=dom('lookup').value.trim().toLowerCase(),select=dom('pick');
  surgeryId=null;
  if(q.length<3){select.style.display='none';return}
  const list=patients.filter(x=>[x.patient_name,x.ids,x.cpf].join(' ').toLowerCase().includes(q)).slice(0,60);
  select.innerHTML=list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.patient_name)+' · '+esc(x.ids||'sem IDS')+' · '+esc(x.procedure_name||'')+'</option>').join('');
  select.style.display=list.length?'block':'none';
 };
 dom('pick').onchange=()=>{
  const p=patients.find(x=>x.id===dom('pick').value);if(!p)return;
  surgeryId=p.id;dom('name').value=p.patient_name||'';dom('ids').value=p.ids||'';dom('cpf').value=p.cpf||'';dom('procedure').value=p.procedure_name||'';dom('specialty').value=p.specialty||'';dom('surgeon').value=p.surgeon||'';dom('original').value=p.surgery_date||p.programming_date||'';dom('pick').style.display='none';dom('lookup').value=p.patient_name||'';
 };
 dom('form').onsubmit=async e=>{
  e.preventDefault();const r=dom('reason').value,other=dom('other').value.trim();
  if(!r||r==='Outro motivo'&&other.length<4){dom('message').textContent='Informe o motivo do reagendamento';return}
  const payload={
   surgery_id:surgeryId,paciente_nome:dom('name').value.trim(),paciente_ids:dom('ids').value.trim()||null,
   paciente_cpf:dom('cpf').value.trim()||null,procedimento:dom('procedure').value.trim(),
   especialidade:dom('specialty').value.trim()||null,medico_cirurgiao:dom('surgeon').value.trim()||null,
   data_original:dom('original').value,data_remarcada:dom('newdate').value||null,motivo:r,
   motivo_outro:r==='Outro motivo'?other:null,observacoes:dom('notes').value.trim()||null
  };
  if(payload.data_remarcada&&payload.data_original===payload.data_remarcada){dom('message').textContent='Nova data deve ser diferente da data original';return}
  const btn=dom('save');btn.disabled=true;dom('message').textContent='Salvando no banco...';
  try{await request('/rest/v1/cirurgias_remarcadas_indicadores',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});close();await read();alert('Reagendamento registrado apenas nos indicadores. Jornada Cirúrgica preservada.')}
  catch(err){dom('message').textContent='Não foi possível salvar: '+(err.message||err);btn.disabled=false}
 };
}
function install(){
 if(!S||!document.getElementById('tabs')||typeof window.renderCurrent!=='function')return false;
 if(window.__rmInstalled)return true;window.__rmInstalled=true;
 const old=window.renderCurrent;
 window.renderCurrent=function(){if(S.view===VIEW){draw();return}return old.apply(this,arguments)};
 const nav=document.getElementById('tabs');
 const ensure=()=>{if(!nav.querySelector('[data-rm-nav]')){const b=document.createElement('button');b.type='button';b.className='tab';b.dataset.rmNav='1';b.textContent='↻ Cirurgias Remarcadas';b.onclick=()=>{S.view=VIEW;nav.querySelectorAll('.tab').forEach(el=>el.classList.remove('on'));b.classList.add('on');draw();read()};let before=[...nav.querySelectorAll('.tab')].find(x=>/Cirurgias Suspensas|Indicadores/.test(x.textContent));if(before)before.before(b);else nav.appendChild(b)}if(S.view===VIEW)nav.querySelector('[data-rm-nav]')?.classList.add('on')};
 new MutationObserver(ensure).observe(nav,{childList:true});ensure();
 return true;
}
let tries=0;const t=setInterval(()=>{if(install()||++tries>120)clearInterval(t)},200);install();
})();