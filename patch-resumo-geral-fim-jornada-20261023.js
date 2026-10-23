(()=>{if(window.__hsjDashboardSummaryV16)return;window.__hsjDashboardSummaryV16=true;
const names=[['fila','Fila de Cirurgia'],['consulta_preop','Consulta Pré-Op'],['mapa_cirurgico','Mapa Cirúrgico'],['concluida','Fim da Jornada']];
let verifiedCounts=null, countBusy=false, lastError='';
async function countFromDatabase(stage){
 const params=new URLSearchParams({select:'id',active:'eq.true',limit:'1'});
 if(stage)params.set('stage','eq.'+stage);
 const response=await fetch(URL+'/rest/v1/surgeries?'+params.toString(),{
  method:'GET',cache:'no-store',
  headers:{apikey:KEY,Authorization:'Bearer '+token,Prefer:'count=exact',Range:'0-0','Cache-Control':'no-cache'}
 });
 if(!response.ok)throw new Error('Falha na contagem ('+response.status+')');
 const range=response.headers.get('content-range')||'';
 const rawCount=range.split('/').pop();
 if(!rawCount||rawCount==='*'||!Number.isSafeInteger(Number(rawCount)))throw new Error('Banco não informou a contagem completa.');
 return Number(rawCount);
}
async function refreshCounts(){
 if(countBusy||document.hidden||document.getElementById('shell')?.classList.contains('hide'))return;
 countBusy=true;
 try{
  const result=await Promise.all([countFromDatabase(null),...names.map(([stage])=>countFromDatabase(stage))]);
  const [total,...stageCounts]=result;
  if(!result.every(Number.isSafeInteger)||total<0||stageCounts.some(v=>v<0)||stageCounts.reduce((a,b)=>a+b,0)>total)throw new Error('Contagens inconsistentes; mantendo última leitura válida.');
  verifiedCounts={total,stageCounts,at:new Date()};
  lastError='';
 }catch(error){lastError=error.message;console.warn('Resumo geral: falha na conferência da contagem:',error)}
 finally{countBusy=false;summary()}
}
function summary(){
 const shell=document.getElementById('shell');if(!shell||shell.classList.contains('hide'))return;
 let el=document.getElementById('hsjGlobalCountsV16');
 if(!el){el=document.createElement('section');el.id='hsjGlobalCountsV16';el.className='card';el.style.cssText='margin:12px 16px;padding:12px 16px;';
 const tabs=document.getElementById('tabs');if(tabs?.parentNode)tabs.parentNode.insertBefore(el,tabs);else document.getElementById('content')?.parentNode?.insertBefore(el,document.getElementById('content'));}
 const items=verifiedCounts?
 [['TOTAL DE PACIENTES',verifiedCounts.total],...names.map(([stage,label],i)=>[label,verifiedCounts.stageCounts[i]]),['Outras etapas',verifiedCounts.total-verifiedCounts.stageCounts.reduce((a,b)=>a+b,0)]]:
 [['TOTAL DE PACIENTES','—'],...names.map(([stage,label])=>[label,'—']),['Outras etapas','—']];
 const caption=verifiedCounts?'Contagem conferida no banco: '+verifiedCounts.at.toLocaleTimeString('pt-BR'):(lastError?'Aguardando conferência do banco':'Consultando contagem completa…');
 el.innerHTML='<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center"><b>📊 Resumo geral da Jornada Cirúrgica</b><small>'+caption+'</small></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:9px">'+items.map(([n,v])=>'<div style="background:#edf3fb;border:1px solid #dae4f2;border-radius:8px;padding:9px"><div style="font-size:11px;font-weight:700;color:#445874">'+n+'</div><div style="font-size:23px;font-weight:800;color:#173d7c">'+(typeof v==='number'?v.toLocaleString('pt-BR'):v)+'</div></div>').join('')+'</div>'+(lastError?'<small style="color:#a05220">Contagem não verificada nesta atualização. Último resultado válido preservado.</small>':'');
}
function completed(){if(S.view!=='concluida')return;const root=document.getElementById('content');if(!root)return;root.querySelectorAll('tbody tr').forEach(tr=>{if(tr.querySelector('[data-hsj-done]'))return;const cell=tr.querySelector('td:last-child');if(!cell||/Nenhum paciente/.test(tr.textContent))return;const tag=document.createElement('strong');tag.dataset.hsjDone='1';tag.style.cssText='display:inline-block;background:#e0f5e8;color:#166436;border-radius:6px;padding:5px;margin:5px';tag.textContent='✅ JORNADA FINALIZADA';cell.appendChild(tag)});}
const oldRender=window.renderCurrent;window.renderCurrent=function(){const result=oldRender.apply(this,arguments);summary();completed();return result};
const oldLoad=window.load;window.load=async function(){const result=await oldLoad.apply(this,arguments);summary();return result};
const oldSurvey=window.hsjSubmitSatisfaction;window.hsjSubmitSatisfaction=async function(id){await oldSurvey(id);summary()};
const oldDecline=window.hsjDeclineSurvey;window.hsjDeclineSurvey=async function(id){await oldDecline(id);summary()};
setInterval(()=>{refreshCounts();if(S.view==='concluida')completed()},15000);
summary();refreshCounts();
})();