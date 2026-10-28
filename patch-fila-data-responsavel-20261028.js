(()=>{
if(window.__hsjDataResponsavelFila20261028)return;
window.__hsjDataResponsavelFila20261028=true;
const dateBR=value=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Araguaina',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)};
const dateKey=value=>{if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return '';const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Araguaina',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value||'').join('-')};
let start='',end='';
const originalGeneric=window.renderGeneric;
window.renderGeneric=function(rows,title){
 const fila=(typeof S!=='undefined'&&S.view==='fila');
 const original=Array.isArray(rows)?rows:[];
 const chosen=fila?original.filter(x=>(!start||dateKey(x.created_at)>=start)&&(!end||dateKey(x.created_at)<=end)):original;
 const result=originalGeneric.call(this,chosen,title);
 if(!fila)return result;
 const card=document.querySelector('#content .card');
 if(!card)return result;
 const head=card.querySelector('.section-head');
 if(head){
  const filters=document.createElement('div');filters.id='hsj-filtro-inclusao';filters.style.cssText='display:flex;gap:9px;align-items:flex-end;flex-wrap:wrap;padding:12px;background:#f1f6fd;border:1px solid #d7e0ea;border-radius:8px;margin:12px 0';
  filters.innerHTML='<label style="font-size:12px;font-weight:700">Inclusão de <input id="hsj-data-inicio" type="date" style="display:block;padding:7px"></label><label style="font-size:12px;font-weight:700">Até <input id="hsj-data-fim" type="date" style="display:block;padding:7px"></label><button type="button" id="hsj-limpar-data" class="btn small">Limpar datas</button><span style="font-size:12px;color:#64748b">Data original de entrada no aplicativo</span>';
  head.insertAdjacentElement('afterend',filters);
  const a=filters.querySelector('#hsj-data-inicio'),b=filters.querySelector('#hsj-data-fim');a.value=start;b.value=end;
  a.onchange=()=>{start=a.value;window.renderCurrent()};
  b.onchange=()=>{end=b.value;window.renderCurrent()};
  filters.querySelector('#hsj-limpar-data').onclick=()=>{start='';end='';window.renderCurrent()};
 }
 const table=card.querySelector('table');
 if(table){const tr=table.querySelector('thead tr');if(tr){const th=document.createElement('th');th.textContent='DATA DE INCLUSÃO';tr.appendChild(th)}
  const body=table.tBodies[0];if(body)Array.from(body.rows).forEach((row,i)=>{const td=document.createElement('td');td.textContent=chosen[i]?dateBR(chosen[i].created_at):'';row.appendChild(td)});
 }
 return result;
};
const originalEdit=window.editPatient;
window.editPatient=function(...args){
 const result=originalEdit.apply(this,args);
 const id=args[0]||'';
 const fill=()=>{const modal=document.querySelector('#modal .modal');if(!modal)return;
  const grid=modal.querySelector('.mb .grid');if(!grid)return;
  let input=grid.querySelector('#f_registration_professional');
  if(!input){const box=document.createElement('div');box.className='field span2';box.innerHTML='<label for="f_registration_professional">PROFISSIONAL RESPONSÁVEL PELO CADASTRO *</label><input id="f_registration_professional" type="text" autocomplete="name" placeholder="Nome completo de quem está cadastrando">';grid.appendChild(box);input=box.querySelector('input')}
  const patient=id?(S.rows||[]).find(x=>String(x.id)===String(id)):null;
  if(patient&&!input.value)input.value=patient.registration_professional||'';
  input.required=!id;
  let stamp=modal.querySelector('#hsj-data-cadastro-original');
  if(!stamp){stamp=document.createElement('div');stamp.id='hsj-data-cadastro-original';stamp.className='notice';grid.before(stamp)}
  stamp.textContent='Data de inclusão no aplicativo: '+(patient?dateBR(patient.created_at):'registrada automaticamente ao salvar');
 };
 fill();return result;
};
const originalSave=window.savePatient;
window.savePatient=async function(id){
 const field=document.getElementById('f_registration_professional');
 const responsible=(field?.value||'').trim().replace(/\s+/g,' ');
 if(!id&&!responsible){alert('Informe obrigatoriamente o nome de quem está cadastrando o paciente.');field?.focus();return}
 if(responsible.length>160){alert('O nome do responsável deve ter no máximo 160 caracteres.');field?.focus();return}
 const originalApi=window.api;
 if(typeof originalApi!=='function')return originalSave.apply(this,arguments);
 window.api=async function(path,options={}){
  if(responsible&&/\/rest\/v1\/surgeries(?:\?|$)/.test(path)&&/^(POST|PATCH)$/i.test(options.method||'')){
   let payload;try{payload=JSON.parse(options.body||'{}')}catch{return originalApi(path,options)}
   // Preserve immutable creation timestamps; modify only the professional field.
   payload.registration_professional=responsible;
   return originalApi(path,{...options,body:JSON.stringify(payload)});
  }
  return originalApi(path,options);
 };
 try{return await originalSave.apply(this,arguments)}
 catch(error){console.error('Erro ao salvar cadastro',error);alert('Não foi possível salvar: '+(error?.message||error));}
 finally{window.api=originalApi}
};
})();