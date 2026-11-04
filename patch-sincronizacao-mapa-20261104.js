(()=>{
'use strict';
if(window.__hsjMapaRefresh20261104)return;
window.__hsjMapaRefresh20261104=true;
let busy=false,lastRefresh=0,lastView='';
async function syncMap(){
 if(busy||S.view!=='mapa_cirurgico')return;
 busy=true;
 const el=document.getElementById('hsj-map-sync-status');
 if(el)el.textContent='Conferindo agendamentos no banco...';
 try{
  const rows=[];
  for(let offset=0;offset<30000;offset+=500){
   const page=await api('/rest/v1/surgeries?select=*&active=eq.true&stage=eq.mapa_cirurgico&order=surgery_date.asc,id.asc&limit=500&offset='+offset);
   if(!Array.isArray(page))throw Error('Resposta inválida na consulta do mapa.');
   rows.push(...page);
   if(page.length<500)break;
  }
  const mapIds=new Set(rows.map(x=>x.id));
  const merged=(S.rows||[]).filter(x=>x.stage!=='mapa_cirurgico'||mapIds.has(x.id));
  const byId=new Map(merged.map(x=>[x.id,x]));
  for(const patient of rows)byId.set(patient.id,patient);
  S.rows=[...byId.values()];
  lastRefresh=Date.now();
  if(S.view==='mapa_cirurgico')window.renderMap();
  const label=document.getElementById('hsj-map-sync-status');
  if(label){
   const filterDate=document.getElementById('gfDate')?.value||'';
   const dayCount=filterDate?rows.filter(x=>x.surgery_date===filterDate).length:null;
   label.textContent='Mapa sincronizado: '+rows.length+' pacientes ativos no mapa'+(dayCount===null?'':' • '+dayCount+' agendado(s) para '+filterDate.split('-').reverse().join('/'))+'.';
  }
 }catch(error){
  const label=document.getElementById('hsj-map-sync-status');
  if(label)label.textContent='Não foi possível atualizar o mapa: '+error.message;
  console.error('Falha de sincronização do mapa',error);
 }finally{busy=false}
}
window.hsjSyncMapaAgora=syncMap;
const oldRender=window.renderMap;
window.renderMap=function(){
 const output=oldRender.apply(this,arguments);
 if(S.view!=='mapa_cirurgico')return output;
 const section=document.querySelector('#content .map-print-v11');
 if(!section)return output;
 let bar=section.querySelector('#hsj-map-sync-bar');
 if(!bar){
  bar=document.createElement('div');bar.id='hsj-map-sync-bar';
  bar.style.cssText='display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0;padding:9px;border-radius:8px;background:#eef7fb;border:1px solid #c3dbe7';
  bar.innerHTML='<button type="button" class="btn small primary" id="hsj-map-sync-btn">↻ Atualizar agendamentos</button><span id="hsj-map-sync-status" style="font-size:12px">Agendamentos sincronizados diretamente com o banco.</span>';
  section.querySelector('.section-head')?.after(bar);
  bar.querySelector('button').onclick=syncMap;
 }
 if(lastRefresh&&Date.now()-lastRefresh>15000)bar.querySelector('#hsj-map-sync-status').textContent='Para conferir as últimas alterações, clique em Atualizar agendamentos.';
 return output;
};
const previousCurrent=window.renderCurrent;
window.renderCurrent=function(){
 const view=S.view;
 const result=previousCurrent.apply(this,arguments);
 if(view==='mapa_cirurgico'&&lastView!=='mapa_cirurgico')setTimeout(syncMap,0);
 lastView=view;
 return result;
};
if(S.view==='mapa_cirurgico'){window.renderMap();setTimeout(syncMap,0)}
})();