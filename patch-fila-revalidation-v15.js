(()=>{
  S.filaRevalidationFilter=S.filaRevalidationFilter||'';

  window.setFilaRevalidationV15=function(v){
    S.filaRevalidationFilter=v||'';
    renderFilaRevalidationV15();
  };

  window.renderFilaRevalidationV15=function(){
    const all=stageRows('fila');
    const f=S.filaRevalidationFilter||'';
    const rows=all.filter(x=>!f||String(x.revalidation_status||'').toUpperCase()===f);
    const solicitar=all.filter(x=>String(x.revalidation_status||'').toUpperCase()==='SOLICITAR').length;
    const solicitado=all.filter(x=>String(x.revalidation_status||'').toUpperCase()==='SOLICITADO').length;
    const c=document.getElementById('content');
    if(!c)return;
    c.innerHTML=`<section class="card">
      <div class="section-head"><div><h2>📋 Fila de Cirurgia (${rows.length} pacientes)</h2><div class="sub">Fluxo compartilhado entre as máquinas</div></div><button class="btn primary" onclick="editPatient()">+ Novo Paciente</button></div>
      <div class="notice">Use “Próxima etapa” para avançar o paciente. Ações críticas possuem dupla confirmação.</div>
      <div style="display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin:12px 0;padding:12px;background:#f7f9fc;border:1px solid var(--line);border-radius:9px">
        <div class="field" style="min-width:260px"><label>SOLICITAR REVALIDAÇÃO</label><select id="filaRevalidationV15" onchange="setFilaRevalidationV15(this.value)">
          <option value="" ${f===''?'selected':''}>Todas as situações</option>
          <option value="SOLICITAR" ${f==='SOLICITAR'?'selected':''}>SOLICITAR</option>
          <option value="SOLICITADO" ${f==='SOLICITADO'?'selected':''}>SOLICITADO</option>
        </select></div>
        <div class="pill warn" style="padding:7px 12px">SOLICITAR: <b>${solicitar}</b></div>
        <div class="pill ok" style="padding:7px 12px">SOLICITADO: <b>${solicitado}</b></div>
        ${f?`<button class="btn" onclick="setFilaRevalidationV15('')">Limpar filtro</button>`:''}
      </div>
      ${baseTable(rows)}
    </section>`;
  };

  const oldRenderCurrentV15=renderCurrent;
  renderCurrent=function(){
    if(S.view==='fila')return renderFilaRevalidationV15();
    return oldRenderCurrentV15();
  };

  if(S.view==='fila')renderFilaRevalidationV15();
})();