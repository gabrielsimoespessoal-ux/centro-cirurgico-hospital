(()=>{
if(window.__hsjMapReconcile20261028)return;
window.__hsjMapReconcile20261028=true;
let running=false,last=0,checked=0,missing=0,error='',undated=0;
const originalRender=window.renderMap;
function notice(){
 const target=document.querySelector('#content .map-print-v11, #content .card');
 if(!target||S.view!=='mapa_cirurgico')return;
 let panel=document.getElementById('hsjMapAuditStatus');
 if(!panel){panel=document.createElement('div');panel.id='hsjMapAuditStatus';panel.className='notice';panel.style.cssText='margin:10px 0;padding:10px;border-left:4px solid #2563eb';target.insertBefore(panel,target.children[1]||null)}
 panel.replaceChildren();
 const msg=document.createElement('span');
 msg.textContent=running?'Conferindo registros do Mapa Cirúrgico diretamente no banco...':error?'A conferência do Mapa Cirúrgico falhou: '+error:!last?'Mapa ainda não conferido com o banco.':'Mapa conferido no banco: '+checked+' cadastros ativos na etapa; '+missing+' registro(s) recuperado(s) nesta conferência; '+undated+' sem data de cirurgia.';
 panel.appendChild(msg);
 const button=document.createElement('button');button.className='btn small';button.style.marginLeft='12px';button.textContent='Conferir mapa agora';button.disabled=running;button.onclick=()=>window.hsjConferirMapa(true);
 panel.appendChild(button);
 if(!running&&!error&&undated){const warn=document.createElement('div');warn.style.marginTop='6px';warn.textContent='Atenção: cadastros sem data de cirurgia podem não aparecer quando há filtro por data. Corrija a data no cadastro original.';panel.appendChild(warn)}
}
window.renderMap=function(){const result=originalRender.apply(this,arguments);notice();if(Date.now()-last>60000&&!running)queueMicrotask(()=>window.hsjConferirMapa(false));return result};
window.hsjConferirMapa=async function(force){
 if(running||(!force&&Date.now()-last<60000))return;
 if(!Array.isArray(S.rows))return;
 running=true;error='';notice();
 try{
  const remote=[],seen=new Set(),pageSize=400;
  for(let offset=0;offset<100000;offset+=pageSize){
   const page=await api('/rest/v1/surgeries?select=*&stage=eq.mapa_cirurgico&active=eq.true&order=created_at.desc,id.desc&limit='+pageSize+'&offset='+offset);
   if(!Array.isArray(page))throw Error('Resposta inválida do banco');
   for(const row of page)if(!seen.has(String(row.id))){seen.add(String(row.id));remote.push(row)}
   if(page.length<pageSize)break;
   if(offset+pageSize>=100000)throw Error('Limite de paginação atingido');
  }
  const idx=new Map(S.rows.map((row,i)=>[String(row.id),i]));
  let recovered=0;
  for(const row of remote){
   const i=idx.get(String(row.id));
   if(i===undefined){S.rows.push(row);idx.set(String(row.id),S.rows.length-1);recovered++}
   else if(S.rows[i].stage!=='mapa_cirurgico'||S.rows[i].active===false||String(S.rows[i].updated_at||'')<String(row.updated_at||''))S.rows[i]=row;
  }
  checked=remote.length;missing=recovered;undated=remote.filter(x=>!String(x.surgery_date||'').slice(0,10)).length;last=Date.now();
  if(S.view==='mapa_cirurgico'){originalRender();notice()}
 }catch(e){error=e?.message||String(e);console.error('Conferência do mapa:',e)}
 finally{running=false;notice()}
};
if(S.view==='mapa_cirurgico')window.renderMap();
})();
