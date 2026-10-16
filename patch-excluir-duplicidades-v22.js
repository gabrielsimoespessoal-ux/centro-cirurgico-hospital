(()=>{
if(window.__hsjRemoverDuplicidadeV22)return;window.__hsjRemoverDuplicidadeV22=true;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const digits=v=>String(v||'').replace(/\D/g,'');
const same=(a,b)=>{
 if(!a||!b||a.id===b.id)return false;
 const cpf=digits(a.cpf),otherCpf=digits(b.cpf);
 if(cpf.length===11&&cpf===otherCpf)return true;
 const ids=norm(a.ids);if(ids&&ids===norm(b.ids))return true;
 return !!norm(a.patient_name)&&norm(a.patient_name)===norm(b.patient_name)&&!!a.birth_date&&a.birth_date===b.birth_date;
};
const available=x=>(S.rows||[]).filter(y=>same(x,y));
const safe=v=>esc(String(v??''));
let busy=false;
window.hsjExcluirDuplicidadeV22=async function(id){
 if(busy)return;
 const x=S.rows.find(r=>r.id===id);if(!x)return alert('Atualize a página para localizar o registro.');
 const peers=available(x);if(!peers.length)return alert('Este cadastro não apresenta outro registro correspondente. A opção de duplicidade não se aplica.');
 const details=y=>'Nome: '+(y.patient_name||'—')+'\nIDS: '+(y.ids||'—')+'\nCPF: '+(y.cpf||'—')+'\nEtapa: '+(labels[y.stage]||y.stage)+'\nProcedimento: '+(y.procedure_name||'—')+'\nCadastro: '+(y.created_at||'—');
 const message='ATENÇÃO — REMOVER REGISTRO DUPLICADO DA LISTA ATIVA\n\nREGISTRO A REMOVER:\n'+details(x)+'\n\nOUTROS REGISTROS QUE PERMANECERÃO:\n'+peers.map(details).join('\n\n')+'\n\nEsta ação apenas arquiva o registro selecionado. Nenhum dado será apagado definitivamente. Verifique primeiro qual cadastro contém as informações corretas, agendamentos e histórico.\n\nDeseja continuar?';
 if(!confirm(message))return;
 if(prompt('Para confirmar a remoção SOMENTE deste registro, digite EXCLUIR:')!=='EXCLUIR')return;
 busy=true;
 try{
  const latest=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,active,updated_at,patient_name,ids,cpf,stage');
  if(!Array.isArray(latest)||latest.length!==1||!latest[0].active)throw Error('Registro não está mais ativo.');
  const remote=latest[0];
  if(remote.updated_at!==x.updated_at)throw Error('Registro alterado em outro computador. Recarregue para verificar antes de excluir.');
  const condition='/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&active=eq.true&updated_at=eq.'+encodeURIComponent(remote.updated_at);
  const changed=await api(condition,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({active:false,updated_by:uid})});
  if(!Array.isArray(changed)||changed.length!==1)throw Error('Não foi possível confirmar a alteração; nenhum registro foi removido desta operação.');
  await load();fillFilters();renderCurrent();
  const query=document.getElementById('hsjBuscaLocal20261015');
  if(query?.value&&typeof window.hsjPesquisarPaciente20261015==='function')window.hsjPesquisarPaciente20261015();
  alert('Registro duplicado arquivado. Os demais registros e dados históricos foram preservados.');
 }catch(e){alert('Não foi possível concluir: '+e.message)}
 finally{busy=false}
};
function buttons(){
 const panel=document.getElementById('hsjBuscaResultados20261015');if(!panel)return;
 panel.querySelectorAll('tbody tr').forEach(tr=>{
  if(tr.querySelector('[data-hsj-dup-delete]'))return;
  const open=[...tr.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('hsjAbrirLocalizacao20261015'));
  const id=(open?.getAttribute('onclick')||'').match(/'([0-9a-f-]{36})'/)?.[1];if(!id)return;
  const x=S.rows.find(r=>r.id===id);if(!x||!available(x).length)return;
  const cell=tr.lastElementChild;if(!cell)return;
  const btn=document.createElement('button');btn.className='btn small';btn.type='button';btn.dataset.hsjDupDelete='1';
  btn.style.cssText='margin-left:5px;color:#9b1c1c;border:1px solid #e0a8a8';
  btn.textContent='🗑 Excluir duplicidade';
  btn.title='Arquiva somente este registro; os demais permanecem';
  btn.onclick=()=>hsjExcluirDuplicidadeV22(id);cell.append(' ',btn);
 });
}
const oldSearch=window.hsjPesquisarPaciente20261015;
window.hsjPesquisarPaciente20261015=function(){const r=oldSearch?.apply(this,arguments);buttons();return r};
const oldCurrent=window.renderCurrent;
window.renderCurrent=function(){const r=oldCurrent.apply(this,arguments);buttons();return r};
buttons();
})();