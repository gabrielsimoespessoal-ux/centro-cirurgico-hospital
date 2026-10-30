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
 // Acesso direto ao cadastro para pacientes que não aparecem nas salas.
 const direct=document.createElement('div');direct.style.cssText='margin-top:10px;padding:9px;border:1px solid #c7d7ef;border-radius:7px;background:#fff';
 const title=document.createElement('div');title.style.cssText='font-size:12px;font-weight:700;margin-bottom:6px';title.textContent='🔎 Localizar e editar paciente do Mapa Cirúrgico';direct.appendChild(title);
 const input=document.createElement('input');input.type='search';input.placeholder='Digite nome, CPF ou IDS do paciente';input.style.cssText='width:min(520px,100%);padding:8px;border:1px solid #bed0e6;border-radius:6px';
 input.value=window.__hsjMapaConsultaDireta||document.getElementById('hsjBuscaLocal20261015')?.value||'';
 const results=document.createElement('div');results.style.marginTop='7px';
 let searchGeneration=0;
 async function populate(){
  const q=input.value.trim();window.__hsjMapaConsultaDireta=q;results.replaceChildren();
  const generation=++searchGeneration;
  if(q.length<3)return;
  results.textContent='Consultando cadastro diretamente no banco...';
  try{
   const clean=q.replace(/[%,.*()]/g,' ').trim();
   const condition='or=(patient_name.ilike.*'+encodeURIComponent(clean.replace(/\s+/g,'*'))+'*,ids.ilike.*'+encodeURIComponent(clean.replace(/\s+/g,'*'))+'*,cpf.ilike.*'+encodeURIComponent(clean.replace(/\s+/g,'*'))+'*)';
   const found=await api('/rest/v1/surgeries?select=*&stage=eq.mapa_cirurgico&active=eq.true&'+condition+'&limit=30');
   if(generation!==searchGeneration||!results.isConnected)return;
   results.replaceChildren();
   if(!Array.isArray(found)||!found.length){results.textContent='Nenhum cadastro encontrado no banco para essa pesquisa.';return}
   const idx=new Map((S.rows||[]).map((r,i)=>[String(r.id),i]));
   for(const row of found){
    const pos=idx.get(String(row.id));
    if(pos===undefined){S.rows.push(row);idx.set(String(row.id),S.rows.length-1)}
    else S.rows[pos]=row;
    const item=document.createElement('div');item.style.cssText='padding:7px 0;border-top:1px solid #edf1f7;display:flex;align-items:center;gap:8px;flex-wrap:wrap';
    const name=document.createElement('strong');name.style.fontSize='12px';name.textContent=row.patient_name+' — '+(row.surgery_date||'Sem data')+(row.map_room?' — '+row.map_room:' — Sem sala definida');item.appendChild(name);
    for(const [label,action] of [['✏ Editar cadastro',()=>window.editPatient?.(row.id)],['🏥 Editar dados do mapa',()=>window.editMapPatient?.(row.id)]]){
     const b=document.createElement('button');b.type='button';b.className='btn small';b.textContent=label;b.onclick=action;item.appendChild(b);
    }
    results.appendChild(item);
   }
  }catch(e){if(generation===searchGeneration)results.textContent='Falha na consulta: '+(e?.message||e)}
 }
 input.addEventListener('input',populate);direct.appendChild(input);direct.appendChild(results);panel.appendChild(direct);populate();
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
