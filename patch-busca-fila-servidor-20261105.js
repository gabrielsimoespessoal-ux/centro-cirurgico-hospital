(()=>{
'use strict';
if(window.__hsjBuscaFilaServidor20261105)return;
window.__hsjBuscaFilaServidor20261105=true;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let searching=false;
const oldSearch=window.hsjPesquisarPaciente20261015;
const searchInput=()=>document.getElementById('hsjBuscaLocal20261015');
const output=()=>document.getElementById('hsjBuscaResultados20261015');
function localMatch(q){return (S.rows||[]).filter(x=>x.active!==false&&[x.patient_name,x.ids,x.cpf].some(v=>norm(v).includes(q)))}

function focusMapPatient(x){
 const date=String(x.surgery_date||'').slice(0,10);
 const filters={doctor:'',specialty:'',from:date||'',to:date||''};
 S.mapFilters=filters;
 S.room='all';
 S.mapMode='daily';
 const bar=document.createElement('div');
 bar.id='hsjPacienteFocoMapa';
 bar.style.cssText='padding:12px;margin:12px 0;border:2px solid #1c69b5;border-radius:9px;background:#edf6ff;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
 const data=document.createElement('div');data.style.flex='1';data.style.minWidth='220px';
 const title=document.createElement('strong');title.textContent='Paciente localizado no Mapa Cirúrgico: '+(x.patient_name||'');
 const sub=document.createElement('div');sub.textContent='IDS: '+(x.ids||'—')+' · Cirurgia: '+(date?date.split('-').reverse().join('/'):'sem data')+' · '+(x.map_room||'Sala não informada')+' · '+(x.patient_status||'');
 data.append(title,sub);
 const open=document.createElement('button');open.type='button';open.className='btn primary';
 open.textContent='Abrir agendamento / editar mapa';open.onclick=()=>window.editMapPatient?.(x.id);
 bar.append(data,open);
 const root=document.querySelector('#content .map-print-v11');
 if(!root)return;
 const old=root.querySelector('#hsjPacienteFocoMapa');if(old)old.remove();
 const head=root.querySelector('.section-head');
 if(head)head.after(bar);else root.prepend(bar);
 const rows=[...root.querySelectorAll('tbody tr')];
 const match=rows.find(tr=>[...tr.querySelectorAll('td')].some(td=>norm(td.textContent).includes(norm(x.patient_name))));
 if(match){match.style.outline='3px solid #1967be';match.style.outlineOffset='-3px'}
 bar.scrollIntoView({behavior:'smooth',block:'center'});
}

function renderResults(matches,q){
 const target=output();if(!target)return;
 target.replaceChildren();
 if(!matches.length){target.textContent='Nenhum paciente encontrado no cadastro ativo do servidor.';return}
 const msg=document.createElement('div');msg.className='notice';
 msg.textContent=matches.length+' registro(s) localizado(s) no banco. Selecione o cadastro original, sem criar duplicidade.';
 target.appendChild(msg);
 const frame=document.createElement('div');frame.style.cssText='max-height:360px;overflow:auto';
 const table=document.createElement('table');table.className='table';table.style.minWidth='650px';
 const thead=document.createElement('thead'),head=document.createElement('tr');
 for(const value of ['Paciente','IDS','Etapa','Situação','Ações']){const th=document.createElement('th');th.textContent=value;head.appendChild(th)}
 thead.appendChild(head);table.appendChild(thead);const tbody=document.createElement('tbody');
 for(const x of matches){
  const tr=document.createElement('tr');
  for(const value of [x.patient_name||'',x.ids||'',labels[x.stage]||x.stage||'',x.patient_status||'']){
   const td=document.createElement('td');td.textContent=value;tr.appendChild(td)
  }
  const cell=document.createElement('td'),go=document.createElement('button');
  go.type='button';go.className='btn primary small';go.textContent='Abrir na etapa';
  go.onclick=async()=>{
   try{
    if(typeof window.clearGlobalFiltersV16==='function')window.clearGlobalFiltersV16();
    const destination=x.stage==='pendencias'?'fila':x.stage;
    if(destination==='mapa_cirurgico'){
      const scheduled=String(x.surgery_date||'').slice(0,10);
      S.mapFilters={doctor:'',specialty:'',from:scheduled||'',to:scheduled||''};
      S.room='all';
      S.mapMode='daily';
    }
    const tab=[...document.querySelectorAll('#tabs .tab')].find(el=>(el.getAttribute('onclick')||'').includes("setView('"+destination+"'"));
    if(tab&&typeof window.setView==='function')window.setView(destination,tab);
    else{S.view=destination;renderTabs();renderCurrent()}
    document.querySelectorAll('#tabs .tab').forEach(el=>el.classList.toggle('on',(el.getAttribute('onclick')||'').includes("setView('"+destination+"'")));
    if(destination==='mapa_cirurgico'){
      // Se o paciente estiver agendado em outra data, abrir o mapa nessa data
      // e oferecer imediatamente a edição do cadastro original.
      focusMapPatient(x);
      if(typeof window.editMapPatient==='function')window.editMapPatient(x.id);
      return;
    }
    if(S.view==='fila'&&typeof window.setFilaRevalidationV15==='function')window.setFilaRevalidationV15('');
    if(S.view==='fila'){
      if(typeof window.clearGlobalFiltersV16==='function')window.clearGlobalFiltersV16();
      const f=document.getElementById('gfName');if(f)f.value='';
      renderCurrent();
    }
    const results=[...document.querySelectorAll('#content tbody tr')];
    const row=results.find(r=>[...r.querySelectorAll('td')].some(td=>norm(td.textContent).includes(norm(x.patient_name))));
    if(row){row.style.outline='3px solid #2563eb';row.scrollIntoView({block:'center',behavior:'smooth'})}
    else{
     const notice=document.createElement('div');notice.className='notice';
     notice.textContent='Cadastro ativo localizado em '+(labels[x.stage]||x.stage)+'. Se o paciente ainda não aparecer na lista, confira os demais filtros da aba.';
     document.getElementById('content')?.prepend(notice)
    }
   }catch(error){alert('Não foi possível abrir a etapa: '+error.message)}
  };
  const edit=document.createElement('button');edit.type='button';edit.className='btn small';edit.textContent='Consultar cadastro';edit.onclick=()=>window.editPatient?.(x.id);
  cell.append(go,' ',edit);tr.appendChild(cell);tbody.appendChild(tr);
 }
 table.appendChild(tbody);frame.appendChild(table);target.appendChild(frame);
}
async function reliableSearch(){
 const raw=searchInput()?.value.trim()||'';
 const q=norm(raw);
 if(!q){return oldSearch?.()}
 if(searching)return;
 searching=true;
 const target=output();if(target)target.textContent='Conferindo cadastro atualizado no banco...';
 try{
  await load();
  let matches=localMatch(q);
  if(!matches.length){
    // A query is a fallback only. Never add stale/inactive/unknown records to the current session.
    const tokens=raw.trim().split(/\s+/).filter(Boolean);
    const textSearch=tokens.length>1?tokens.join('%'):raw;
    const query='/rest/v1/surgeries?select=*&active=eq.true&or=('+['patient_name','ids','cpf'].map(k=>k+'.ilike.*'+encodeURIComponent(textSearch)+'*').join(',')+')&limit=100';
    const remote=await api(query);
    matches=(remote||[]).filter(x=>x.active!==false&&[x.patient_name,x.ids,x.cpf].some(v=>norm(v).includes(q)));
    if(matches.length){
      const byId=new Map((S.rows||[]).map(x=>[x.id,x]));
      for(const x of matches)byId.set(x.id,x);
      S.rows=[...byId.values()];
    }
  }
  renderResults(matches,q);
  if(S.view==='fila')renderCurrent();
 }catch(e){
  if(target)target.textContent='Não foi possível concluir a busca no banco: '+e.message;
 }finally{searching=false}
}
window.hsjPesquisarPaciente20261015=reliableSearch;
const searchBar=document.getElementById('hsjBuscaPainel20261015');
if(searchBar){
 const input=searchBar.querySelector('#hsjBuscaLocal20261015');
 if(input){
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();reliableSearch()}},true);
 }
}
window.hsjPesquisarFilaServidor20261105=reliableSearch;
})();