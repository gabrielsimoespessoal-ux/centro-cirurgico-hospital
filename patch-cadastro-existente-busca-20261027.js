(()=>{
if(window.__hsjFixCadastroExistente20261027)return;
window.__hsjFixCadastroExistente20261027=true;
const originalEdit=window.editPatient;
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let opening=false;
window.editPatient=function(id=''){
 if(!id)return originalEdit.apply(this,arguments);
 const known=(S.rows||[]).find(x=>String(x.id)===String(id));
 if(known)return originalEdit.apply(this,arguments);
 if(opening)return;
 opening=true;
 (async()=>{
  try{
   const rows=await api('/rest/v1/surgeries?select=*&id=eq.'+encodeURIComponent(id)+'&limit=1');
   const found=Array.isArray(rows)?rows[0]:null;
   if(!found)throw Error('O cadastro foi identificado na verificação de duplicidade, mas não pôde ser recuperado. Verifique as permissões de leitura do registro.');
   if(!Array.isArray(S.rows))S.rows=[];
   if(!S.rows.some(x=>String(x.id)===String(found.id)))S.rows.push(found);
   originalEdit.call(window,found.id);
  }catch(e){console.error('Falha ao abrir cadastro existente',e);alert('Não foi possível abrir o cadastro original: '+e.message)}
  finally{opening=false}
 })();
};
const oldSearch=window.applyGlobalFiltersV16;
window.applyGlobalFiltersV16=async function(){
 const raw=(document.getElementById('gfName')?.value||'').trim();
 if(!raw)return oldSearch?.apply(this,arguments);
 const local=(S.rows||[]).filter(x=>[x.patient_name,x.cpf,x.ids].some(v=>normalize(v).includes(normalize(raw))));
 if(local.length)return oldSearch?.apply(this,arguments);
 try{
  const term=raw.replace(/[*,().]/g,' ').trim();
  if(!term)return oldSearch?.apply(this,arguments);
  const search='or=('+['patient_name','cpf','ids'].map(k=>k+'.ilike.*'+term+'*').join(',')+')';
  const rows=await api('/rest/v1/surgeries?select=id,patient_name,cpf,ids,procedure_name,stage,active&'+encodeURI(search)+'&limit=25');
  const matches=(Array.isArray(rows)?rows:[]).filter(x=>[x.patient_name,x.cpf,x.ids].some(v=>normalize(v).includes(normalize(raw))));
  document.getElementById('hsjBuscaServidor20261027')?.remove();
  if(!matches.length)return oldSearch?.apply(this,arguments);
  const section=document.createElement('section');section.id='hsjBuscaServidor20261027';section.className='card';
  section.style.cssText='padding:16px;margin:12px 0;border:2px solid #2563eb;';
  const heading=document.createElement('strong');heading.textContent='Cadastros localizados diretamente no banco ('+matches.length+')';
  section.appendChild(heading);
  matches.forEach(x=>{
   const line=document.createElement('div');line.style.cssText='display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:12px';
   const info=document.createElement('span');
   info.textContent=[x.patient_name,x.ids,x.procedure_name,typeof labels!=='undefined'?(labels[x.stage]||x.stage):x.stage,x.active===false?'Inativo':''].filter(Boolean).join(' · ');
   const btn=document.createElement('button');btn.type='button';btn.className='btn primary small';btn.textContent='Abrir cadastro existente';
   btn.onclick=()=>window.editPatient(x.id);
   line.append(info,btn);section.appendChild(line);
  });
  const anchor=document.getElementById('tabs');
  if(anchor)anchor.insertAdjacentElement('afterend',section);
  else document.getElementById('content')?.before(section);
  section.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){console.error('Busca no banco',e);alert('Erro na pesquisa do banco: '+e.message)}
};
const searchButton=document.getElementById('gfSearchBtnV16');
if(searchButton)searchButton.onclick=()=>window.applyGlobalFiltersV16();
})();