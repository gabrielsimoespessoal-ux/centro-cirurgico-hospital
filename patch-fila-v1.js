(()=>{
const reqTypes=['AIH','APAC','BPA'];
const specialties=['CIRURGIA GERAL','UROLOGIA','ORTOPEDIA','PLÁSTICA','CABEÇA E PESCOÇO','GINECOLOGISTA','PÉ TORTO','VASCULAR'];
const months=['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const revalid=['(Nenhum)','SOLICITAR','SOLICITADO'];
const requestStatuses=['ATIVO','INATIVO','EM PREPARAÇÃO','PROCESSO FINALIZADO','SUSPENSO'];
const seededProcedures=['COLECISTECTOMIA','HERNIOPLASTIA INGUINAL','HERNIOPLASTIA INGUINAL (BILATERAL)','HERNIOPLASTIA UMBILICAL','HISTERECTOMIA C/ ANEXECTOMIA','HISTERECTOMIA TOTAL','NEFROLITOTRIPSIA PERCUTÂNEA','PAROTIDECTOMIA PARCIAL OU SUBTOTAL','POSTECTOMIA','RESSECÇÃO ENDOSCÓPICA DE PRÓSTATA','RETIRADA DE FIO OU PINO INTRA-ÓSSEO','TRATAMENTO CIRÚRGICO DE FRATURA DA CLAVÍCULA','TRATAMENTO CIRÚRGICO DE FRATURA DIAFISÁRIA ÚNICA DO RÁDIO','TRATAMENTO CIRÚRGICO DE PÉ TORTO CONGÊNITO','URETERORRENOLITOTRIPSIA FLEXÍVEL A LASER','VASECTOMIA'];
const seededDoctors=['KATARINE CAETANO','WESLLEY SANTIAGO','LUCAS MEIRA','JOÃO MUSSY','ANDRÉ MELO','CARLOS KAKUDA'];
function uniq(arr){return [...new Set(arr.map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function smartValues(key,seed){return uniq([...(seed||[]),...S.rows.map(r=>r[key])])}
function opt(v,current){return `<option value="${esc(v)}" ${String(v)===String(current||'')?'selected':''}>${esc(v)}</option>`}
function selectHtml(label,id,current,items,cls=''){return `<div class="field ${cls}"><label>${label}</label><select id="f_${id}"><option value=""></option>${items.map(v=>opt(v,current)).join('')}</select></div>`}
function smartHtml(label,id,current,items,cls=''){
 const list='list_'+id;
 return `<div class="field ${cls}"><label>${label}</label><input id="f_${id}" type="text" list="${list}" value="${esc(current||'')}" autocomplete="off" placeholder="Selecione ou digite um novo"><datalist id="${list}">${items.map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist><div class="sub">▼ Selecione um existente ou digite um novo. O novo valor será aprendido após salvar.</div></div>`;
}
editPatient=function(id=''){
 const x=id?S.rows.find(r=>r.id===id):{};
 const procedures=smartValues('procedure_name',seededProcedures), doctors=smartValues('surgeon',seededDoctors);
 document.getElementById('modal').innerHTML=`<div class="back"><div class="modal"><div class="mh"><b>✏ ${id?'Editar Paciente: '+esc(x.patient_name):'Novo Paciente'}</b><button class="btn" onclick="document.getElementById('modal').innerHTML=''">Fechar</button></div><div class="mb"><div class="grid">
 ${field('NOME COMPLETO *','patient_name',x.patient_name)}${field('IDS','ids',x.ids)}${field('CPF','cpf',x.cpf)}
 ${field('CONTATO / WHATSAPP','phone',x.phone)}${field('DATA DE SOLICITAÇÃO DO AIH','aih_request_date',x.aih_request_date,'date')}${field('DATA CADASTRO IDS','ids_register_date',x.ids_register_date,'date')}
 ${smartHtml('PROCEDIMENTO CIRÚRGICO *','procedure_name',x.procedure_name,procedures,'span2')}${field('CÓDIGO DO PROCEDIMENTO','sigtap_code',x.sigtap_code)}
 ${selectHtml('TIPO DE SOLICITAÇÃO','request_type',x.request_type,reqTypes)}${selectHtml('ESPECIALIDADE','specialty',x.specialty,specialties)}${smartHtml('MÉDICO CIRURGIÃO','surgeon',x.surgeon,doctors)}
 ${field('DATA DE NASCIMENTO (DN)','birth_date',x.birth_date,'date')}${field('DATA DA AUTORIZAÇÃO','authorization_date',x.authorization_date,'date')}${selectHtml('MÊS DA AUTORIZAÇÃO','authorization_month',x.authorization_month,months)}
 ${field('DATA DA PROGRAMAÇÃO','programming_date',x.programming_date,'date')}${selectHtml('SOLICITAR REVALIDAÇÃO','revalidation_status',x.revalidation_status||'',revalid)}${selectField('SITUAÇÃO DO PACIENTE','patient_status',x.patient_status,patientStatuses)}
 ${selectHtml('SITUAÇÃO DA SOLICITAÇÃO','request_status',x.request_status,requestStatuses)}${field('DATA DA REMARCAÇÃO','reschedule_date',x.reschedule_date,'date')}${field('DATA DA CIRURGIA','surgery_date',x.surgery_date,'date')}
 <div class="field span3"><label>SUSPENSÃO / OBSERVAÇÕES</label><textarea id="f_suspension_notes">${esc(x.suspension_notes||'')}</textarea></div>
 </div></div><div class="mf"><button class="btn primary" onclick="savePatient('${id}')">Gravar Alterações</button></div></div></div>`;
};
savePatient=async function(id){
 const keys=['patient_name','ids','cpf','phone','aih_request_date','ids_register_date','procedure_name','sigtap_code','request_type','specialty','surgeon','birth_date','authorization_date','authorization_month','programming_date','revalidation_status','patient_status','request_status','reschedule_date','surgery_date','suspension_notes'];
 let d={updated_by:uid};keys.forEach(k=>d[k]=document.getElementById('f_'+k)?.value||null);
 if(d.revalidation_status==='(Nenhum)')d.revalidation_status=null;
 if(!d.patient_name||!d.procedure_name)return alert('Nome e procedimento são obrigatórios.');
 if(id)await api('/rest/v1/surgeries?id=eq.'+id,{method:'PATCH',body:JSON.stringify(d)});else await api('/rest/v1/surgeries',{method:'POST',body:JSON.stringify({...d,stage:'fila',created_by:uid})});
 document.getElementById('modal').innerHTML='';await load();fillFilters();renderCurrent();
};
const originalFill=fillFilters;
fillFilters=function(){originalFill();const gp=document.getElementById('gfProcedure');if(gp){gp.setAttribute('list','globalProcedureList');let dl=document.getElementById('globalProcedureList');if(!dl){dl=document.createElement('datalist');dl.id='globalProcedureList';gp.after(dl)}dl.innerHTML=smartValues('procedure_name',seededProcedures).map(v=>`<option value="${esc(v)}"></option>`).join('')}};
fillFilters();
})();