(()=>{
'use strict';
if(window.__hsjOrdemGeralMapa20261105)return;
window.__hsjOrdemGeralMapa20261105=true;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||''))?String(d).split('-').reverse().join('/'):'—';
const state={date:'',rows:[],dirty:false,loading:false,loaded:false,revision:0};
const currentMap=()=>Array.isArray(S.rows)?S.rows.filter(x=>x.active!==false&&x.stage==='mapa_cirurgico'&&x.surgery_date):[];
function dateDefault(){
 const dates=[...new Set(currentMap().map(x=>String(x.surgery_date).slice(0,10)))].sort();
 const now=new Date(),localToday=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 return dates.find(d=>d>=localToday)||dates[dates.length-1]||localToday;
}
const regular=(a,b)=>String(a.map_room||'').localeCompare(String(b.map_room||''),'pt-BR',{numeric:true})||String(a.patient_name||'').localeCompare(String(b.patient_name||''),'pt-BR');
function statusBox(text,error=false){
 const el=document.getElementById('hsjOrdemMsg');if(el){el.textContent=text;el.style.color=error?'#a32727':'#39536d'}
}
async function loadOrder(){
 const date=state.date;
 if(!date)return;
 const revision=++state.revision;state.loading=true;statusBox('Carregando a ordem salva...');
 try{
  const data=await api('/rest/v1/hsj_mapa_ordem_impressao?select=surgery_id,surgery_date,position&order=position.asc&surgery_date=eq.'+encodeURIComponent(date)+'&limit=5000');
  if(revision!==state.revision)return;
  const position=new Map((data||[]).map(r=>[r.surgery_id,Number(r.position)]));
  state.rows=currentMap().filter(x=>String(x.surgery_date).slice(0,10)===date)
   .sort((a,b)=>(position.get(a.id)??1e9)-(position.get(b.id)??1e9)||regular(a,b))
   .map(x=>x.id);
  state.dirty=false;state.loaded=true;drawRows();
  statusBox(state.rows.length?'Ordem compartilhada carregada. Ajuste e clique em Salvar ordem.':'Nenhuma cirurgia ativa programada nessa data.');
 }catch(e){state.loaded=false;state.rows=[];drawRows();statusBox('Falha ao carregar a ordem: '+e.message,true)}
 finally{if(revision===state.revision)state.loading=false}
}
function drawRows(){
 const root=document.getElementById('hsjOrdemTable');if(!root)return;
 const ids=new Set(state.rows),registry=new Map(currentMap().map(p=>[p.id,p]));
 if(!state.rows.length){root.innerHTML='<div class="sub" style="padding:12px">Nenhuma cirurgia encontrada para a data selecionada.</div>';return}
 root.innerHTML='<div style="overflow-x:auto"><table class="table" style="min-width:700px"><thead><tr><th>ORDEM</th><th>PACIENTE</th><th>SALA ORIGINAL</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>POSIÇÃO</th></tr></thead><tbody>'+
 state.rows.map((id,i)=>{
 const p=registry.get(id)||{};
 return '<tr><td><b>'+String(i+1)+'º</b></td><td>'+safe(p.patient_name||'Cadastro não encontrado')+'</td><td>'+safe(p.map_room||'Sem sala')+'</td><td>'+safe(p.specialty||'—')+'</td><td>'+safe(p.surgeon||'—')+'</td><td>'+
 '<button type="button" class="btn small" data-move="'+i+':-1" '+(i===0?'disabled':'')+' aria-label="Subir posição">↑</button> '+
 '<button type="button" class="btn small" data-move="'+i+':1" '+(i===state.rows.length-1?'disabled':'')+' aria-label="Descer posição">↓</button></td></tr>'
 }).join('')+'</tbody></table></div>';
 for(const btn of root.querySelectorAll('[data-move]')){
  btn.onclick=()=>{const [index,step]=btn.dataset.move.split(':').map(Number),dest=index+step;
   if(dest<0||dest>=state.rows.length)return;
   [state.rows[index],state.rows[dest]]=[state.rows[dest],state.rows[index]];
   state.dirty=true;drawRows();statusBox('Ordem alterada nesta tela. Clique em Salvar ordem para compartilhar e imprimir.');
  };
 }
}
async function saveOrder(){
 if(state.loading||!state.loaded)return alert('Carregue a lista antes de salvar.');
 if(!state.rows.length)return alert('Não há cirurgias nessa data.');
 const btn=document.getElementById('hsjOrdemSave');if(btn)btn.disabled=true;
 try{
  await api('/rest/v1/rpc/hsj_salvar_ordem_mapa_impressao',{method:'POST',body:JSON.stringify({p_date:state.date,p_ids:state.rows})});
  state.dirty=false;statusBox('Ordem salva e disponível para todos os computadores.');
 }catch(e){statusBox('Não foi possível salvar: '+e.message,true);alert('A ordem não foi salva: '+e.message);}
 finally{if(btn)btn.disabled=false}
}
function printOrdered(){
 if(!state.loaded||!state.rows.length)return alert('Escolha uma data com cirurgias e carregue a lista.');
 if(state.dirty)return alert('Salve a ordem antes de imprimir, para garantir a mesma sequência em todos os computadores.');
 const registry=new Map(currentMap().map(p=>[p.id,p]));
 const entries=state.rows.map((id,i)=>({p:registry.get(id),n:i+1})).filter(x=>x.p);
 if(entries.length!==state.rows.length)return alert('O mapa foi atualizado. Recarregue a ordem antes de imprimir.');
 const tab=window.open('','_blank');
 if(!tab)return alert('Habilite a abertura de janelas para imprimir o mapa.');
 const rows=entries.map(({p,n})=>'<tr><td style="text-align:center"><strong>'+n+'º</strong></td><td>'+safe(p.map_room||'—')+'</td><td><b>'+safe(p.patient_name)+'</b><div class="muted">IDS: '+safe(p.ids||'—')+'</div></td><td>'+safe(p.procedure_name||'—')+'</td><td>'+safe(p.specialty||'—')+'</td><td>'+safe(p.surgeon||'—')+'</td><td>'+safe(p.map_reservations||'—')+'</td><td>'+safe(p.map_responsible||'—')+'</td></tr>').join('');
 const content='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Mapa Cirúrgico — Ordem Geral — '+safe(formatDate(state.date))+'</title><style>'+
 '@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#172a40;margin:14px}h1{font-size:20px;margin:0 0 5px}p{font-size:11px;margin:0 0 14px}.muted{font-size:9px;color:#606f80;margin-top:3px}table{border-collapse:collapse;width:100%;font-size:10px;table-layout:fixed}th,td{border:1px solid #b6c4d2;padding:7px 5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#e8eef5;font-size:9px}tr{break-inside:avoid}th:nth-child(1){width:6%}th:nth-child(2){width:8%}th:nth-child(3){width:18%}th:nth-child(4){width:18%}th:nth-child(5){width:12%}th:nth-child(6){width:12%}th:nth-child(7){width:17%}th:nth-child(8){width:9%}@media print{body{margin:0}}'+
 '</style></head><body><h1>Hospital São José — Mapa Cirúrgico</h1><p><b>Data:</b> '+safe(formatDate(state.date))+' &nbsp; <b>Sequência geral:</b> '+entries.length+' cirurgia(s) · Ordem independente de sala</p>'+
 '<table><thead><tr><th>ORDEM</th><th>SALA</th><th>PACIENTE / IDS</th><th>PROCEDIMENTO</th><th>ESPECIALIDADE</th><th>MÉDICO</th><th>RESERVAS / OBS.</th><th>RESPONSÁVEL</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>';
 tab.document.open();tab.document.write(content);tab.document.close();tab.focus();tab.print();
}
function renderControls(){
 if(S.view!=='mapa_cirurgico')return;
 const root=document.querySelector('#content .map-print-v11');if(!root)return;
 let box=root.querySelector('#hsjOrdemMapaSection');
 if(box)return;
 box=document.createElement('section');box.id='hsjOrdemMapaSection';box.className='notice';
 box.style.cssText='margin:12px 0;padding:13px;border:1px solid #b5c9e1;background:#f6faff;border-radius:9px';
 box.innerHTML='<div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><div><h3 style="margin:0 0 4px">↕ Ordem cirúrgica geral para impressão</h3><div class="sub">Defina a sequência de procedimentos independentemente da sala, sem alterar os agendamentos ou salas. Ordem salva por data.</div></div>'+
 '<div style="display:flex;flex-wrap:wrap;align-items:end;gap:6px"><label style="font-size:12px;font-weight:bold">Data do mapa<br><input type="date" id="hsjOrdemDate" style="padding:7px" value="'+safe(state.date)+'"></label>'+
 '<button type="button" class="btn" id="hsjOrdemRefresh">↻ Atualizar</button><button type="button" class="btn primary" id="hsjOrdemSave">Salvar ordem</button>'+
 '<button type="button" class="btn" id="hsjOrdemPrint">🖨 Imprimir por ordem</button></div></div>'+
 '<div id="hsjOrdemMsg" class="sub" role="status" style="margin-top:8px"></div><div id="hsjOrdemTable" style="margin-top:10px"></div>';
 const header=root.querySelector('.section-head');
 if(header)header.after(box);else root.prepend(box);
 box.querySelector('#hsjOrdemDate').onchange=e=>{
  if(state.dirty&&!confirm('Existem mudanças não salvas. Deseja trocar a data e descartá-las?')){e.target.value=state.date;return}
  state.date=e.target.value;state.loaded=false;state.rows=[];loadOrder();
 };
 box.querySelector('#hsjOrdemRefresh').onclick=()=>{
  if(state.dirty&&!confirm('Descartar alterações não salvas e atualizar a lista?'))return;
  loadOrder();
 };
 box.querySelector('#hsjOrdemSave').onclick=saveOrder;
 box.querySelector('#hsjOrdemPrint').onclick=printOrdered;
 if(state.loaded)drawRows();else loadOrder();
}
if(!state.date)state.date=dateDefault();
const prevRender=window.renderMap;
window.renderMap=function(){
 const result=prevRender.apply(this,arguments);
 if(S.view==='mapa_cirurgico')renderControls();
 return result;
};
window.hsjAbrirOrdemMapa20261105=renderControls;
if(S.view==='mapa_cirurgico')renderControls();
})();