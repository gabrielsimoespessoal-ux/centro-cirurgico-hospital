(()=>{
  const orderedViews=['fila','pendencias','consulta_preop','exames','entrevista_tecnico','avaliacao_enfermeiro','mapa_cirurgico','suspensas','duploj','pos_operatorio','indicadores'];
  renderTabs=function(){
    document.getElementById('tabs').innerHTML=orderedViews.map(v=>`<button class="tab ${v===S.view?'on':''}" onclick="setView('${v}',this)">${labels[v]}</button>`).join('');
  };
  renderTabs();
})();
