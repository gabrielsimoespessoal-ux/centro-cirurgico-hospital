(()=>{
if(window.__hsjImpressaoConsultasV25)return;window.__hsjImpressaoConsultasV25=true;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const br=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.substring(8,10)+'/'+d.substring(5,7)+'/'+d.substring(0,4):String(d||'—');
const clean=v=>esc(v==null||v===''?'—':String(v));
function printConsultas(){
 const from=document.getElementById('gfDateFrom')?.value||'';
 const to=document.getElementById('gfDateTo')?.value||'';
 if(from&&to&&from>to)return alert('A data inicial não pode ser posterior à data final.');
 const hasPeriod=!!(from||to),day=today(),low=hasPeriod?from:day,high=hasPeriod?to:day;
 const cf=S.consultFilters||{};
 const generalName=norm(document.getElementById('gfName')?.value), generalDoctor=document.getElementById('gfDoctor')?.value||'';
 const generalSpec=document.getElementById('gfSpecialty')?.value||'', generalStatus=document.getElementById('gfStatus')?.value||'';
 const generalProc=norm(document.getElementById('gfProcedure')?.value);
 const rows=(S.rows||[]).filter(x=>{
  if(x.active===false||!x.consultation_date)return false;
  if(!(x.stage==='consulta_preop'||x.consultation_only||x.appointment_date||x.consultation_date))return false;
  if(low&&x.consultation_date<low||high&&x.consultation_date>high)return false;
  if(cf.search&&! [x.patient_name,x.cpf,x.ids].some(v=>norm(v).includes(norm(cf.search))))return false;
  if(cf.doctor&&x.surgeon!==cf.doctor||cf.specialty&&x.specialty!==cf.specialty||cf.status&&x.patient_status!==cf.status)return false;
  if(generalName&&! [x.patient_name,x.cpf,x.ids].some(v=>norm(v).includes(generalName)))return false;
  if(generalDoctor&&x.surgeon!==generalDoctor||generalSpec&&x.specialty!==generalSpec||generalStatus&&x.patient_status!==generalStatus)return false;
  if(generalProc&&!norm(x.procedure_name).includes(generalProc))return false;
  return true;
 }).sort((a,b)=>(a.consultation_date||'').localeCompare(b.consultation_date||'')||(a.consultation_time||'').localeCompare(b.consultation_time||'')||(a.patient_name||'').localeCompare(b.patient_name||''));
 const bySpec={};rows.forEach(x=>{const s=x.specialty||'Não informada';bySpec[s]=(bySpec[s]||0)+1});
 const period=hasPeriod?(from?br(from):'Início')+' a '+(to?br(to):'Sem data final'):br(day);
 const columns=['#','Data','Horário','Paciente','Especialidade','Médico(a)','Unidade proveniente','Responsável pelo agendamento'];
 const header=columns.map(t=>'<th>'+clean(t)+'</th>').join('');
 const cells=rows.map((x,i)=>'<tr>'+[i+1,br(x.consultation_date),String(x.consultation_time||'').slice(0,5),x.patient_name,x.specialty,x.surgeon,x.source_unit,x.appointment_responsible].map(v=>'<td>'+clean(v)+'</td>').join('')+'</tr>').join('');
 const specialties=Object.entries(bySpec).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR')).map(([s,n])=>'<span class="spec">'+clean(s)+': <b>'+n+'</b></span>').join('')||'Nenhuma consulta no filtro';
 const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Consultas pré-operatórias — '+clean(period)+'</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#17243a;margin:0;font-size:10px}h1{font-size:19px;margin:0 0 6px;color:#153f7a}h2{font-size:13px;margin:16px 0 6px}.sub{color:#53647b}.stats{display:flex;gap:18px;margin:12px 0;padding:10px;background:#eef4fa}.spec{display:inline-block;border:1px solid #cdd9e8;border-radius:5px;padding:5px 8px;margin:3px}table{border-collapse:collapse;width:100%;table-layout:fixed}th{background:#284b7d;color:#fff}th,td{padding:6px 5px;border:1px solid #bcc8d8;text-align:left;overflow-wrap:anywhere;vertical-align:top}thead{display:table-header-group}tr{break-inside:avoid}th:nth-child(1){width:3%}th:nth-child(2){width:9%}th:nth-child(3){width:7%}th:nth-child(4){width:20%}th:nth-child(5){width:13%}th:nth-child(6){width:16%}th:nth-child(7){width:16%}th:nth-child(8){width:16%}@media screen{body{padding:22px;max-width:1200px;margin:auto}.actions{margin:12px 0}}@media print{.actions{display:none}}</style></head><body><h1>Hospital São José — Consultas Pré-Operatórias</h1><div class="sub">Data / período consultado: <b>'+clean(period)+'</b> · Relatório gerado em '+clean(new Date().toLocaleString('pt-BR'))+'</div><div class="stats"><div><b>Consultas agendadas:</b> '+rows.length+'</div><div><b>Especialidades:</b> '+Object.keys(bySpec).length+'</div></div><h2>Consultas por especialidade</h2><div>'+specialties+'</div><h2>Relação de consultas</h2><table><thead><tr>'+header+'</tr></thead><tbody>'+(cells||'<tr><td colspan="8">Nenhuma consulta encontrada para o filtro selecionado.</td></tr>')+'</tbody></table><div class="actions"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div></body></html>';
 const win=window.open('','_blank');
 if(!win){alert('O navegador bloqueou a janela de impressão. Autorize pop-ups para este aplicativo.');return}
 win.document.open();win.document.write(html);win.document.close();
 win.focus();setTimeout(()=>win.print(),350);
}
window.hsjImprimirConsultasV25=printConsultas;
const old=window.renderConsult;
window.renderConsult=function(){
 const result=old.apply(this,arguments);
 const head=document.querySelector('#content .section-head');if(!head)return result;
 if(!head.querySelector('[data-print-consultas-v25]')){
  const b=document.createElement('button');b.type='button';b.className='btn';b.dataset.printConsultasV25='1';
  b.textContent='🖨 Imprimir consultas do dia / período';b.onclick=printConsultas;
  const right=head.querySelector('button')?.parentElement;
  if(right&&right!==head&&right.classList.contains('acts'))right.prepend(b);
  else head.appendChild(b);
 }
 return result;
};
if(S.view==='consulta_preop')renderConsult();
})();