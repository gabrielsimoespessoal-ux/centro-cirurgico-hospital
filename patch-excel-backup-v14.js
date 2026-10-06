(()=>{
const V14={
 labels:{fila:'Fila de Cirurgia',pendencias:'Pendencias',consulta_preop:'Consulta Pre-Op',exames:'Exames NIR',entrevista_tecnico:'Triagem Enfermagem',avaliacao_enfermeiro:'Avaliacao Enfermeiro',mapa_cirurgico:'Mapa Cirurgico',realizadas:'Cirurgias Realizadas',suspensas:'Suspensas',duploj:'Duplo J',pos_operatorio:'Pos-Operatorio',indicadores:'Indicadores'},
 cols:[
  ['Paciente','patient_name'],['CPF','cpf'],['IDS','ids'],['Telefone','phone'],['Data Nascimento','birth_date'],['Especialidade','specialty'],['Medico Cirurgiao','surgeon'],['Procedimento','procedure_name'],['Codigo SIGTAP','sigtap_code'],['Tipo Solicitacao','request_type'],['Data Solicitacao AIH','aih_request_date'],['Data Cadastro IDS','ids_register_date'],['Data Autorizacao','authorization_date'],['Mes Autorizacao','authorization_month'],['Data Programacao','programming_date'],['Data Cirurgia','surgery_date'],['Situacao Paciente','patient_status'],['Situacao Solicitacao','request_status'],['Revalidacao','revalidation_status'],['Etapa Atual','stage'],['Prioridade','priority'],['Observacoes / Suspensao','suspension_notes']
 ]
};
function txt(v){if(v==null)return ''; if(typeof v==='object')return JSON.stringify(v); return String(v)}
function ymd(v){return /^\d{4}-\d{2}-\d{2}/.test(String(v||''))?String(v).slice(0,10):String(v||'')}
function excelDate(v){const s=ymd(v); if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return s||''; const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d)}
function activeRows(){return (S.rows||[]).filter(x=>x.active!==false)}
function viewRows(view){const all=activeRows();
 switch(view){
  case 'suspensas': return all.filter(x=>x.patient_status==='SUSPENSA'||x.request_status==='SUSPENSO');
  case 'duploj': return all.filter(x=>x.double_j===true);
  case 'realizadas': return all.filter(x=>x.surgery_completed===true||x.patient_status==='REALIZADA');
  case 'indicadores': return all;
  case 'consulta_preop': return all.filter(x=>x.stage==='consulta_preop'||x.consultation_only===true||x.consultation_date||x.appointment_date);
  default: return all.filter(x=>x.stage===view);
 }
}
function applyGeneralFilters(rows){
 const q=(document.getElementById('gfName')?.value||'').trim().toLowerCase();
 const doctor=document.getElementById('gfDoctor')?.value||'';
 const proc=(document.getElementById('gfProcedure')?.value||'').trim().toLowerCase();
 const spec=document.getElementById('gfSpecialty')?.value||'';
 const stat=document.getElementById('gfStatus')?.value||'';
 const one=document.getElementById('gfDate')?.value||'';
 const from=document.getElementById('gfDateFromV12')?.value||document.getElementById('gfDateFrom')?.value||'';
 const to=document.getElementById('gfDateToV12')?.value||document.getElementById('gfDateTo')?.value||'';
 return rows.filter(x=>{
  const hay=[x.patient_name,x.cpf,x.ids].map(v=>txt(v).toLowerCase()).join(' ');
  const p=txt(x.procedure_name).toLowerCase();
  const dt=ymd(x.surgery_date||x.programming_date||x.consultation_date||x.appointment_date||x.authorization_date||x.aih_request_date||x.created_at);
  return (!q||hay.includes(q))&&(!doctor||x.surgeon===doctor)&&(!proc||p.includes(proc))&&(!spec||x.specialty===spec)&&(!stat||x.patient_status===stat||x.request_status===stat)&&(!one||dt===one)&&(!from||dt>=from)&&(!to||dt<=to);
 });
}
function stageExtra(view){
 const common=[];
 if(view==='consulta_preop')return [['Data Agendamento','appointment_date'],['Data Consulta','consultation_date'],['Horario','consultation_time'],['Unidade Proveniente','source_unit'],['Responsavel Agendamento','appointment_responsible'],['Observacoes Consulta','consultation_notes'],['Duplo J','double_j'],['Data Instalacao Duplo J','double_j_insert_date']];
 if(view==='exames')return [['Checklist Exames','exam_checklist'],['Outros Exames','exam_other'],['Observacoes Exames','exam_observations'],['Exame Pendente','exam_pending']];
 if(view==='entrevista_tecnico')return [['Respostas Triagem','triage_answers'],['Observacoes Triagem','triage_notes'],['Motivo Encaminhamento Enfermeiro','nurse_referral_reason'],['Data/Hora Triagem','triage_at']];
 if(view==='avaliacao_enfermeiro')return [['Checklist Enfermeiro','nurse_checklist'],['Conduta / Resolucao','nurse_observations'],['Data/Hora Avaliacao','nurse_at']];
 if(view==='mapa_cirurgico'||view==='realizadas')return [['Sala','map_room'],['Reservas Especiais','map_reservations'],['Responsavel Mapa','map_responsible'],['Dados Mapa','map_data'],['Cirurgia Realizada','surgery_completed'],['Data/Hora Marcacao Realizada','surgery_completed_at']];
 if(view==='duploj')return [['Duplo J','double_j'],['Data Instalacao Duplo J','double_j_insert_date']];
 if(view==='pos_operatorio')return [['Situacoes Importantes / Observacoes','postop_notes'],['Registrado Em','postop_at']];
 return common;
}
function columnsFor(view){return [...V14.cols,...stageExtra(view)]}
async function ensureExcelJS(){
 if(window.ExcelJS)return;
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('Nao foi possivel carregar o gerador de Excel.'));document.head.appendChild(s)});
}
function safeSheetName(s){return String(s||'Dados').replace(/[\\/*?:\[\]]/g,' ').slice(0,31)}
function styleSheet(ws,cols,rows,title){
 ws.views=[{state:'frozen',ySplit:3}];
 ws.mergeCells(1,1,1,Math.max(cols.length,1));
 const c=ws.getCell(1,1);c.value='Hospital Sao Jose - '+title;c.font={bold:true,size:16,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1F3F8F'}};c.alignment={vertical:'middle'};ws.getRow(1).height=28;
 ws.mergeCells(2,1,2,Math.max(cols.length,1));ws.getCell(2,1).value='Backup gerado em '+new Date().toLocaleString('pt-BR')+' | Registros: '+rows.length;ws.getCell(2,1).font={italic:true,color:{argb:'FF475569'}};
 const hr=ws.getRow(3);cols.forEach((h,i)=>{const cc=hr.getCell(i+1);cc.value=h;cc.font={bold:true,color:{argb:'FFFFFFFF'}};cc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF6F9FE6'}};cc.alignment={vertical:'middle',wrapText:true}});hr.height=30;
 ws.autoFilter={from:{row:3,column:1},to:{row:Math.max(3,rows.length+3),column:cols.length}};
 for(let r=4;r<=rows.length+3;r++){const row=ws.getRow(r);row.alignment={vertical:'top',wrapText:true}; if(r%2===0)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF7FAFD'}}; row.eachCell(cell=>{cell.border={bottom:{style:'thin',color:{argb:'FFE2E8F0'}}}})}
 for(let i=1;i<=cols.length;i++){const h=String(cols[i-1]);let width=Math.min(45,Math.max(12,h.length+3));if(/Paciente|Procedimento|Observa|Conduta|Checklist|Dados/.test(h))width=30;if(/Data|Horario/.test(h))width=16;ws.getColumn(i).width=width;}
}
function appendSheet(wb,name,view,rows){
 const defs=columnsFor(view),headers=defs.map(d=>d[0]); const ws=wb.addWorksheet(safeSheetName(name));
 const vals=rows.map(x=>defs.map(([h,k])=>/Data|Registrado|Hora/.test(h)?excelDate(x[k]):txt(x[k])));
 vals.forEach((arr,idx)=>{const row=ws.getRow(idx+4);arr.forEach((v,i)=>{row.getCell(i+1).value=v})});
 styleSheet(ws,headers,rows,name);
 headers.forEach((h,i)=>{if(/Data|Registrado|Hora/.test(h))ws.getColumn(i+1).numFmt='dd/mm/yyyy'});
 return ws;
}
async function saveWorkbook(wb,filename){const buf=await wb.xlsx.writeBuffer();const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
window.exportCurrentExcelV14=async function(){
 try{await ensureExcelJS();const view=S.view||'fila';const rows=applyGeneralFilters(viewRows(view));const wb=new ExcelJS.Workbook();wb.creator='Hospital Sao Jose';wb.created=new Date();appendSheet(wb,V14.labels[view]||view,view,rows);await saveWorkbook(wb,'Hospital_Sao_Jose_'+(V14.labels[view]||view).replace(/[^A-Za-z0-9]+/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.xlsx')}catch(e){alert(e.message)}
};
window.exportFullExcelV14=async function(){
 try{await ensureExcelJS();const wb=new ExcelJS.Workbook();wb.creator='Hospital Sao Jose';wb.created=new Date();
 const summary=wb.addWorksheet('Resumo');summary.addRow(['HOSPITAL SAO JOSE - BACKUP COMPLETO']);summary.addRow(['Gerado em',new Date().toLocaleString('pt-BR')]);summary.addRow(['Total de registros ativos',activeRows().length]);summary.getCell('A1').font={bold:true,size:16,color:{argb:'FFFFFFFF'}};summary.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1F3F8F'}};summary.mergeCells('A1:D1');summary.getColumn(1).width=32;summary.getColumn(2).width=25;
 const order=['fila','pendencias','consulta_preop','exames','entrevista_tecnico','avaliacao_enfermeiro','mapa_cirurgico','realizadas','suspensas','duploj','pos_operatorio'];
 order.forEach(v=>appendSheet(wb,V14.labels[v]||v,v,viewRows(v)));
 appendSheet(wb,'Base Completa','indicadores',activeRows());
 await saveWorkbook(wb,'Hospital_Sao_Jose_Backup_Completo_'+new Date().toISOString().slice(0,10)+'.xlsx')
 }catch(e){alert(e.message)}
};
function installButtons(){const top=document.querySelector('.top-actions');if(!top||document.getElementById('excelCurrentV14'))return;const a=document.createElement('button');a.id='excelCurrentV14';a.className='btn';a.innerHTML='📗 Excel desta tela';a.onclick=exportCurrentExcelV14;const b=document.createElement('button');b.id='excelFullV14';b.className='btn';b.innerHTML='🗂 Backup Excel completo';b.onclick=exportFullExcelV14;top.insertBefore(a,top.firstChild);top.insertBefore(b,a.nextSibling)}
installButtons();setTimeout(installButtons,600);setTimeout(installButtons,1800);
})();