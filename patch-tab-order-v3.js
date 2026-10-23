(()=>{
  const orderedViews=['fila','pendencias','consulta_preop','exames','avaliacao_enfermeiro','mapa_cirurgico','suspensas','duploj','pos_operatorio','concluida','satisfacao_indicadores','indicadores'];
  labels.concluida='🎉 Fim da Jornada Cirúrgica';
  labels.satisfacao_indicadores='📊 Indicadores de Satisfação';
  renderTabs=function(){
    document.getElementById('tabs').innerHTML=orderedViews.map(v=>`<button class="tab ${v===S.view?'on':''}" onclick="setView('${v}',this)">${labels[v]}</button>`).join('');
  };
  renderTabs();
})();
