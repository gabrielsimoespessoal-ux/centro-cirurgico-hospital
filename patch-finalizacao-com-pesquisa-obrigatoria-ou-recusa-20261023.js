(()=>{if(window.__hsjFinishIntercept20261023)return;window.__hsjFinishIntercept20261023=true;
function endView(id){const x=S.rows.find(r=>r.id===id);if(!x)return alert('Cadastro não encontrado');if(x.stage==='concluida')return alert('Esta jornada já está concluída');const m=document.getElementById('modal');if(!m)return alert('Formulário indisponível');window.hsjShowSatisfaction(id);}
const oldShow=window.hsjShowSatisfaction;
window.hsjShowSatisfaction=function(id){const x=S.rows.find(r=>r.id===id);if(!x||x.stage==='concluida')return alert('Atendimento indisponível ou concluído');const prior=x.stage;try{if(prior!=='pos_operatorio')x.stage='pos_operatorio';return oldShow(id)}finally{x.stage=prior}};
const oldConfirm=window.hsjConfirmarEtapaV26;
window.hsjConfirmarEtapaV26=function(id){const value=document.getElementById('hsjStageV26')?.value;if(value==='concluida'||value==='satisfacao_indicadores'){return endView(id)}return oldConfirm.apply(this,arguments)};
const oldNext=window.nextStage;
window.nextStage=function(id){const x=S.rows.find(r=>r.id===id);if(x?.stage==='pos_operatorio')return endView(id);return oldNext.apply(this,arguments)};
const oldRender=window.renderCurrent;
window.renderCurrent=function(){const r=oldRender.apply(this,arguments);return r};
})();