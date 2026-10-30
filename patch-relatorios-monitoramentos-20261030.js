(()=>{
if(window.__hsjPrintableMonitoring20261030)return;
window.__hsjPrintableMonitoring20261030=true;
const configs={
 avaliacao_enfermeiro:{name:'Monitoramento do Enfermeiro',types:['avaliacao_enfermeiro','enfermeiro']},
 supervisao:{name:'Monitoramento da Supervisão',types:['supervisao']},
 monitoramento_administrativo:{name:'Monitoramento Administrativo',types:['administrativo','monitoramento_administrativo']}
};
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.valueOf())?'—':d.toLocaleString('pt-BR',{timeZone:'America/Maceio',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})};
const stage=v=>window.labels?.[v]||v||'—';
async function all(table,filter=''){
 const list=[];
 for(let offset=0;offset<100000;offset+=500){
  const part=await api('/rest/v1/'+table+'?select=*'+filter+'&order=id.asc&limit=500&offset='+offset);
  if(!Array.isArray(part))throw Error('Retorno inesperado de '+table);
  list.push(...part);
  if(part.length<500)return list;
 }
 throw Error('O relatório ultrapassou o limite de segurança de registros de '+table);
}
function addButton(){
 const cfg=configs[S.view];if(!cfg)return;
 const root=document.getElementById('content');if(!root)return;
 if(root.querySelector('[data-hsj-print-monitor]'))return;
 const section=root.querySelector('.card')||root.querySelector('section');
 if(!section)return;
 const head=section.querySelector('.section-head');
 const btn=document.createElement('button');btn.type='button';btn.className='btn primary';
 btn.dataset.hsjPrintMonitor='1';btn.textContent='🖨 Relatório para impressão';
 btn.title='Histórico completo: pacientes, justificativas, respostas e tratativas';
 btn.style.margin='5px';
 btn.onclick=()=>window.hsjImprimirMonitor20261030(S.view);
 if(head)head.appendChild(btn);else section.prepend(btn);
}
window.hsjImprimirMonitor20261030=async function(view){
 const cfg=configs[view];if(!cfg)return;
 const win=window.open('','_blank');
 if(!win){alert('Permita a abertura de janelas deste aplicativo para imprimir o relatório.');return}
 win.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Preparando relatório</title></head><body><p>Carregando histórico do monitoramento...</p></body></html>');win.document.close();
 try{
  const [sup,adm,claims,nurse,patients]=await Promise.all([
   all('supervision_referrals'),all('administrative_referrals'),all('monitoring_claims_hsj'),all('nurse_reviews'),all('surgeries')
  ]);
  const allRows=[
   ...sup.filter(r=>r.destination===view).map(r=>({id:r.id,patientId:r.surgery_id,received:r.created_at,origin:r.origin_stage,reason:r.reason,response:r.resolution,responded:r.resolved_at,destination:r.return_stage,status:r.status,source:'Encaminhamento'})),
   ...(view==='monitoramento_administrativo'?adm.map(r=>({id:r.id,patientId:r.surgery_id,received:r.created_at,origin:r.origin_stage,reason:r.reason,response:r.resolution,responded:r.resolved_at,destination:r.return_stage,status:r.status,source:'Encaminhamento'})):[]),
   ...claims.filter(r=>cfg.types.includes(r.monitor_type)).map(r=>({id:r.id,patientId:r.surgery_id,received:r.created_at,origin:'Puxado pela equipe',reason:r.reason,response:r.response,responded:r.resolved_at,destination:r.destination,status:r.status,source:'Monitoramento puxado'})),
   ...(view==='avaliacao_enfermeiro'?nurse.map(r=>({id:r.id,patientId:r.surgery_id,received:r.reviewed_at,origin:'Avaliação de enfermagem',reason:r.reason,response:[r.assessment,r.notes].filter(Boolean).join(' — '),responded:r.reviewed_at,destination:r.decision,status:'respondido',source:'Avaliação'})):[])
  ].sort((a,b)=>new Date(a.received)-new Date(b.received)||String(a.id).localeCompare(String(b.id)));
  const map=new Map(patients.map(p=>[String(p.id),p]));
  const total=allRows.length,responded=allRows.filter(r=>r.status==='respondido').length;
  const pending=total-responded,unique=new Set(allRows.map(r=>r.patientId)).size;
  const first=allRows[0]?.received,last=allRows[total-1]?.received;
  const htmlRows=allRows.map((r,i)=>{
   const p=map.get(String(r.patientId));
   const name=p?.patient_name||'Cadastro não localizado';
   const description=r.response||'Sem tratativa registrada até a emissão';
   return '<tr><td class="num">'+(i+1)+'</td><td><b>'+escapeHTML(name)+'</b><div class="muted">'+escapeHTML(r.source)+'</div></td><td>'+escapeHTML(date(r.received))+'</td><td>'+escapeHTML(stage(r.origin))+'</td><td>'+escapeHTML(r.reason||'—')+'</td><td>'+escapeHTML(description)+'</td><td>'+escapeHTML(date(r.responded))+'</td><td>'+escapeHTML(stage(r.destination))+'</td><td>'+escapeHTML(r.status==='respondido'?'Respondido':'Aguardando')+'</td></tr>';
  }).join('');
  const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório - '+escapeHTML(cfg.name)+'</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#18283e;margin:20px;font-size:10px}.top{border-bottom:3px solid #1d468d;margin-bottom:12px;padding-bottom:8px}h1{font-size:20px;margin:4px 0;color:#143b80}h2{font-size:13px;margin:0}.sub{font-size:11px;color:#64748b}.stats{display:flex;gap:12px;margin:14px 0}.stat{border:1px solid #cad7eb;border-radius:6px;flex:1;padding:10px}.stat b{display:block;font-size:19px;color:#1b4489}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th{background:#245098;color:white;text-align:left;padding:7px 5px}td{vertical-align:top;border-bottom:1px solid #dae2ed;padding:7px 5px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}tr{break-inside:avoid;page-break-inside:avoid}tbody tr:nth-child(even){background:#f3f7fc}.num{width:3%}.muted{color:#66768d;font-size:9px}th:nth-child(2){width:14%}th:nth-child(3){width:10%}th:nth-child(4){width:9%}th:nth-child(5){width:24%}th:nth-child(6){width:23%}th:nth-child(7){width:8%}th:nth-child(8){width:6%}th:nth-child(9){width:8%}.toolbar{margin:10px 0 18px}.toolbar button{background:#19478e;color:#fff;border:0;border-radius:6px;padding:10px 16px;cursor:pointer;font-weight:bold}.footer{margin-top:15px;color:#66768d} @media print{body{margin:0}.toolbar{display:none}.stat{break-inside:avoid}}</style></head><body><div class="top"><h2>HOSPITAL SÃO JOSÉ</h2><h1>Relatório de respostas e tratativas — '+escapeHTML(cfg.name)+'</h1><div class="sub">Jornada Cirúrgica • Período histórico: '+escapeHTML(date(first))+' a '+escapeHTML(date(last))+' • Emitido em '+escapeHTML(date(new Date()))+'</div></div><div class="toolbar"><button onclick="window.print()">🖨 Imprimir / Salvar como PDF</button></div><div class="stats"><div class="stat">Pacientes únicos<b>'+unique+'</b></div><div class="stat">Encaminhamentos e avaliações<b>'+total+'</b></div><div class="stat">Respondidos<b>'+responded+'</b></div><div class="stat">Pendentes<b>'+pending+'</b></div></div><table><thead><tr><th>Nº</th><th>Paciente</th><th>Recebido em</th><th>Origem</th><th>Justificativa / motivo</th><th>Resposta / tratativa</th><th>Respondido em</th><th>Destino</th><th>Situação</th></tr></thead><tbody>'+htmlRows+'</tbody></table><div class="footer">Fonte: registros de monitoramento do sistema Jornada Cirúrgica. Cada passagem é apresentada individualmente, mesmo quando o paciente possui múltiplos encaminhamentos. Documentação destinada ao uso interno autorizado.</div></body></html>';
  win.document.open();win.document.write(html);win.document.close();
 }catch(e){win.document.body.textContent='Não foi possível gerar o relatório: '+e.message;console.error(e)}
};
const prev=window.renderCurrent;
window.renderCurrent=function(){const result=prev.apply(this,arguments);addButton();return result};
addButton();
})();
