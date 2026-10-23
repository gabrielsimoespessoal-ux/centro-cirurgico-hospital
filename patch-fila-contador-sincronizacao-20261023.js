(()=>{
 if(window.__hsjFilaCounterSync20261023)return;window.__hsjFilaCounterSync20261023=true;
 let busy=false,last=0;
 async function sync(){
  if(busy||!document.getElementById('shell')||document.getElementById('shell').classList.contains('hide'))return;
  if(document.getElementById('modal')?.children.length)return;
  if(document.hidden)return;
  if(document.activeElement?.closest?.('#content input,#content textarea,#content select'))return;
  busy=true;try{
   const before=(S.rows||[]).filter(x=>x.active!==false&&x.stage==='fila').length;
   await load();
   const now=(S.rows||[]).filter(x=>x.active!==false&&x.stage==='fila').length;
   const current=document.querySelector('#content .section-head h2');
   if(S.view==='fila'&&(before!==now||!current?.textContent.includes('('+now+' pacientes)'))renderCurrent();
   last=Date.now();
  }catch(e){console.warn('Falha ao sincronizar contador da fila:',e)}finally{busy=false}
 }
 setInterval(sync,15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
 window.addEventListener('focus',sync);
 window.hsjAtualizarFilaAgora=sync;
})();