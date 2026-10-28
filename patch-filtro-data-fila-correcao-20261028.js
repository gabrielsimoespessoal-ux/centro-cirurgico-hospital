(()=>{
if(window.__hsjFiltroDataFilaCorrecao20261028)return;
window.__hsjFiltroDataFilaCorrecao20261028=true;
let de='',ate='';
const key=v=>{
 if(!v)return '';
 const d=new Date(v);if(!Number.isFinite(d.getTime()))return '';
 return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Araguaina',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
};
const fmt=v=>{if(!v)return '—';let d=new Date(v);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Araguaina',day:'2-digit',month:'2-digit',year:'numeric'}).format(d):'—'};
const previous=window.renderFilaRevalidationV15;
if(typeof previous!=='function')return;
window.renderFilaRevalidationV15=function(){
 const oldTable=window.baseTable;
 window.baseTable=function(rows){
  const selected=rows.filter(x=>(!de||key(x.created_at)>=de)&&(!ate||key(x.created_at)<=ate));
  const source=oldTable.call(this,selected);
  const holder=document.createElement('div');holder.innerHTML=source;
  const header=holder.querySelector('thead tr');
  if(header){const th=document.createElement('th');th.textContent='DATA DE INCLUSÃO';header.appendChild(th)}
  const body=holder.querySelector('tbody');
  if(body)Array.from(body.rows).forEach((row,i)=>{const td=document.createElement('td');td.textContent=selected[i]?fmt(selected[i].created_at):'';row.appendChild(td)});
  return holder.innerHTML;
 };
 try{return previous.apply(this,arguments)}
 finally{
  window.baseTable=oldTable;
  const card=document.querySelector('#content .card');
  if(!card)return;
  const table=card.querySelector('table');
  if(!table)return;
  const controls=document.createElement('div');controls.id='hsjFiltroDataInclusao20261028';
  controls.style.cssText='display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin:12px 0;padding:12px;background:#eef4fc;border:1px solid #b9cde9;border-radius:9px';
  controls.innerHTML='<label style="font-size:12px;font-weight:700">Data de inclusão — de<input type="date" id="hsjFiltroDataDe" style="display:block;padding:8px"></label><label style="font-size:12px;font-weight:700">Até<input type="date" id="hsjFiltroDataAte" style="display:block;padding:8px"></label><button class="btn small" type="button" id="hsjLimparDatasFila">Limpar datas</button><small>Filtro pela data original de cadastro no aplicativo</small>';
  table.closest('.tablewrap')?.before(controls);
  const a=controls.querySelector('#hsjFiltroDataDe'),b=controls.querySelector('#hsjFiltroDataAte');a.value=de;b.value=ate;
  a.onchange=()=>{de=a.value;window.renderFilaRevalidationV15()};
  b.onchange=()=>{ate=b.value;window.renderFilaRevalidationV15()};
  controls.querySelector('#hsjLimparDatasFila').onclick=()=>{de='';ate='';window.renderFilaRevalidationV15()};
  const total=table.tBodies[0]?.rows.length||0;
  if(de||ate){const hint=document.createElement('small');hint.style.cssText='display:block;margin-bottom:8px;color:#1f3f8f;font-weight:700';hint.textContent=total+' registro(s) neste período';controls.after(hint)}
 }
};
if(S.view==='fila')window.renderFilaRevalidationV15();
})();