(()=>{
if(window.__hsjMonitorFilters20261030)return;window.__hsjMonitorFilters20261030=true;
const views=new Set(['monitoramento_administrativo','supervisao','avaliacao_enfermeiro']);
const states={};const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
let mappings=new Map(),busy=null,version=0;
const normalize=s=>String(s||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
async function refresh(){
 if(busy)return busy;
 busy=(async()=>{
  try{
   const specs=[['supervision_referrals','supervisao'],['administrative_referrals','monitoramento_administrativo'],['monitoring_claims_hsj','claim']];
   const result=await Promise.allSettled(specs.map(([table])=>api('/rest/v1/'+table+'?select=id,surgery_id&order=created_at.desc&limit=5000')));
   const map=new Map();
   result.forEach((res,i)=>{if(res.status==='fulfilled'&&Array.isArray(res.value))res.value.forEach(r=>map.set(String(r.id),String(r.surgery_id)));else console.warn('Filtro médico/especialidade: tabela indisponível',specs[i][0])});
   mappings=map;
  }catch(e){console.warn('Filtro de monitoramentos',e)}
  finally{busy=null}
 })();
 return busy;
}
function patientFor(tr){
 const onclick=[...tr.querySelectorAll('[onclick]')].map(el=>el.getAttribute('onclick')||'').join(' ');
 const match=onclick.match(/(?:hsjResponderAdminV26|openResolveV18|hsjRespondClaim|hsjMonitorHistory)\('([0-9a-f-]{36})'/i);
 if(match){
  const ref=mappings.get(match[1]);
  const id=ref||(onclick.includes('hsjMonitorHistory')?match[1]:null);
  if(id){const p=S.rows.find(x=>String(x.id)===String(id));if(p)return p}
 }
 const raw=tr.querySelector('td:first-child')?.textContent?.trim();
 const candidates=S.rows.filter(p=>normalize(p.patient_name)===normalize(raw));
 return candidates.length===1?candidates[0]:null;
}
function update(){
 if(!views.has(S.view))return;
 const root=document.getElementById('content');if(!root)return;
 const view=S.view,stored=states[view]||(states[view]={specialty:'',surgeon:''});
 const cards=[...root.querySelectorAll('section.card')].filter(card=>card.querySelector('.table thead'));
 if(!cards.length)return;
 const data=[];
 cards.forEach((card,cardIndex)=>{
  const table=card.querySelector('.table'),head=table?.querySelector('thead tr'),rows=[...table.querySelectorAll('tbody tr')];
  if(!head||!rows.length)return;
  if(!head.querySelector('[data-hsj-specialty]')){
   const th1=document.createElement('th'),th2=document.createElement('th');
   th1.textContent='ESPECIALIDADE';th1.dataset.hsjSpecialty='1';
   th2.textContent='MÉDICO RESPONSÁVEL';th2.dataset.hsjDoctor='1';
   const patientHead=[...head.children].find(th=>/paciente/i.test(th.textContent||''))||head.children[0];
   patientHead.after(th2);patientHead.after(th1);
  }
  rows.forEach(tr=>{
   if(!tr.querySelector('td'))return;
   const p=patientFor(tr);
   const spec=String(p?.specialty||'').trim(),doctor=String(p?.surgeon||'').trim();
   let td1=tr.querySelector('td[data-hsj-specialty]'),td2=tr.querySelector('td[data-hsj-doctor]');
   if(!td1){td1=document.createElement('td');td1.dataset.hsjSpecialty='1';td2=document.createElement('td');td2.dataset.hsjDoctor='1';tr.firstElementChild.after(td2);tr.firstElementChild.after(td1)}
   td1.textContent=spec||'Não informado';
   td2.innerHTML=doctor?'<strong style="color:#1f3f8f;font-size:13px">'+safe(doctor)+'</strong>':'<span style="color:#a45b00">Não informado</span>';
   data.push({tr,spec:spec||'Não informado',doctor:doctor||'Não informado',card:cardIndex});
  });
 });
 if(!data.length)return;
 let filter=root.querySelector('[data-hsj-monitor-filters]');
 if(!filter){
  filter=document.createElement('div');filter.dataset.hsjMonitorFilters='1';
  filter.style.cssText='display:flex;gap:12px;align-items:end;flex-wrap:wrap;border:1px solid #cad8eb;background:#f6f9fd;border-radius:9px;padding:12px;margin:10px 0';
  filter.innerHTML='<label style="font-weight:700;font-size:12px;display:grid;gap:5px">Especialidade<select data-hsj-field="specialty" style="min-width:200px;padding:8px;border:1px solid #bacce1;border-radius:6px"></select></label><label style="font-weight:700;font-size:12px;display:grid;gap:5px">Médico responsável<select data-hsj-field="surgeon" style="min-width:200px;padding:8px;border:1px solid #bacce1;border-radius:6px"></select></label><button type="button" class="btn small" data-hsj-clear>Limpar filtros</button><span data-hsj-count style="font-size:12px;color:#48617e"></span>';
  const first=cards[0],head=first.querySelector('.section-head');if(head)head.after(filter);else first.prepend(filter);
  filter.querySelector('[data-hsj-clear]').onclick=()=>{stored.specialty='';stored.surgeon='';applyOptions();apply()};
  filter.querySelectorAll('select').forEach(el=>el.onchange=()=>{stored[el.dataset.hsjField]=el.value;apply()});
 }
 const opts=(values,selected)=>'<option value="">Todos</option>'+[...new Set(values)].sort((a,b)=>a.localeCompare(b,'pt-BR')).map(v=>'<option value="'+safe(v)+'" '+(v===selected?'selected':'')+'>'+safe(v)+'</option>').join('');
 function applyOptions(){
  const specialty=filter.querySelector('[data-hsj-field="specialty"]'),surgeon=filter.querySelector('[data-hsj-field="surgeon"]');
  specialty.innerHTML=opts(data.map(x=>x.spec),stored.specialty);
  surgeon.innerHTML=opts(data.filter(x=>!stored.specialty||x.spec===stored.specialty).map(x=>x.doctor),stored.surgeon);
  if(stored.surgeon&&!data.some(x=>x.doctor===stored.surgeon&&(!stored.specialty||x.spec===stored.specialty))){stored.surgeon='';surgeon.value=''}
 }
 function apply(){
  let shown=0;
  data.forEach(x=>{const yes=(!stored.specialty||x.spec===stored.specialty)&&(!stored.surgeon||x.doctor===stored.surgeon);x.tr.style.display=yes?'':'none';if(yes)shown++});
  filter.querySelector('[data-hsj-count]').textContent=shown+' de '+data.length+' registros exibidos';
  const select=filter.querySelector('[data-hsj-field="surgeon"]');select.innerHTML=opts(data.filter(x=>!stored.specialty||x.spec===stored.specialty).map(x=>x.doctor),stored.surgeon);
  if(stored.surgeon&&!data.some(x=>x.doctor===stored.surgeon&&(!stored.specialty||x.spec===stored.specialty))){stored.surgeon='';select.value='';data.forEach(x=>{const yes=!stored.specialty||x.spec===stored.specialty;x.tr.style.display=yes?'':'none'});filter.querySelector('[data-hsj-count]').textContent=data.filter(x=>!stored.specialty||x.spec===stored.specialty).length+' de '+data.length+' registros exibidos'}
 }
 applyOptions();apply();
}
const oldLoad=window.load;window.load=async function(){const out=await oldLoad.apply(this,arguments);await refresh();return out};
const prevRender=window.renderCurrent;
window.renderCurrent=function(){const out=prevRender.apply(this,arguments);const current=++version;if(views.has(S.view)){update();refresh().then(()=>{if(current===version)update()})}return out};
refresh().then(update);
})();