/* Hospital São José — Fim da Jornada e satisfação. Sem alteração automática de registros existentes. */
(()=>{
if(window.__hsjSatisfaction20261023)return;window.__hsjSatisfaction20261023=true;
const qs=[
['Como você avalia as orientações recebidas antes da cirurgia?',['Muito bom','Bom','Regular','Ruim','Muito ruim']],
['Como você avalia o tempo de espera entre a solicitação e a realização da cirurgia?',['Muito rápido','Adequado','Demorado','Muito demorado','Ainda estou aguardando']],
['Durante a espera, você recebeu informações claras sobre o andamento da sua cirurgia?',['Sim, sempre','Sim, algumas vezes','Não','Não precisei de informações']],
['Você foi informado(a) de que o agendamento pode depender de autorizações da Prefeitura e do SUS?',['Sim','Não','Não me recordo']],
['Como você avalia o atendimento e a atenção dos profissionais do hospital?',['Muito bom','Bom','Regular','Ruim','Muito ruim']],
['De modo geral, qual seu nível de satisfação com o processo da cirurgia?',['Muito satisfeito(a)','Satisfeito(a)','Regular','Insatisfeito(a)','Muito insatisfeito(a)']]
];
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
labels.concluida='Fim da Jornada!';labels.satisfacao_indicadores='Indicadores de Satisfação';
if(!views.includes('concluida'))views.push('concluida');
if(!views.includes('satisfacao_indicadores'))views.push('satisfacao_indicadores');
const oldRender=window.renderCurrent,oldNext=window.nextStage,oldBoot=window.renderTabs;
window.renderCurrent=function(){if(S.view==='concluida')return renderFinalList();if(S.view==='satisfacao_indicadores')return renderSatisfactionIndicators();return oldRender()};
window.nextStage=async function(id){const x=S.rows.find(r=>r.id===id);if(!x)return alert('Paciente não encontrado.');if(x.stage==='pos_operatorio')return window.hsjShowSatisfaction(id);return oldNext(id)};
function renderFinalList(){const r=stageRows('concluida');document.getElementById('content').innerHTML='<section class="card"><div class="section-head"><div><h2>🎉 Fim da Jornada! ('+r.length+')</h2><div class="sub">Pacientes com jornada encerrada. Histórico preservado.</div></div><button class="btn" onclick="window.print()">🖨 Imprimir</button></div>'+baseTable(r)+'</section>'}
window.hsjShowSatisfaction=function(id){
const x=S.rows.find(r=>r.id===id);if(!x)return alert('Cadastro não encontrado.');
if(x.stage!=='pos_operatorio')return alert('A pesquisa de conclusão é disponibilizada ao sair do Pós-Operatório.');
document.getElementById('modal').innerHTML='<div class="back"><div class="modal"><div class="mh"><b>🎉 Fim da Jornada! — '+h(x.patient_name)+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><p class="notice">A pesquisa é voluntária. Caso não deseje responder, registre a opção de não participação para concluir a jornada.</p>'+qs.map(([q,op],i)=>'<div class="field" style="margin-bottom:17px"><label style="font-size:13px">'+(i+1)+'. '+h(q)+' *</label><select id="hsjQ'+(i+1)+'"><option value="">Selecione uma resposta</option>'+op.map(o=>'<option value="'+h(o)+'">'+h(o)+'</option>').join('')+'</select></div>').join('')+'<div class="field"><label>7. O que podemos melhorar neste processo? (Opcional)</label><textarea id="hsjQ7" rows="4" maxlength="2000" placeholder="Sua sugestão"></textarea></div><p id="hsjSurveyError" class="err" role="alert"></p></div><div class="mf"><button class="btn primary" id="hsjSurveySubmit" onclick="hsjSubmitSatisfaction(\''+id+'\')">Enviar pesquisa de satisfação e finalizar jornada cirúrgica</button><button class="btn orange" id="hsjSurveyDecline" onclick="hsjDeclineSurvey(\''+id+'\')">Paciente optou em não realizar a pesquisa</button></div></div></div>';
};
window.hsjSubmitSatisfaction=async function(id){
const ans=qs.map((_,i)=>document.getElementById('hsjQ'+(i+1))?.value||'');
const err=document.getElementById('hsjSurveyError');if(ans.some(v=>!v)){err.textContent='Responda às seis perguntas obrigatórias para finalizar.';return;}
const b=document.getElementById('hsjSurveySubmit');if(b.disabled)return;b.disabled=true;b.textContent='Salvando e finalizando...';err.textContent='';
try{
const payload={p_surgery_id:id,p_q1:ans[0],p_q2:ans[1],p_q3:ans[2],p_q4:ans[3],p_q5:ans[4],p_q6:ans[5],p_q7:document.getElementById('hsjQ7')?.value||null};
await api('/rest/v1/rpc/finalizar_jornada_pesquisa',{method:'POST',body:JSON.stringify(payload)});
await load();fillFilters();window.hsjCelebration();renderCurrent();
}catch(e){err.textContent='Não foi possível finalizar: '+e.message+' — verifique antes de tentar novamente.';b.disabled=false;b.textContent='Enviar pesquisa de satisfação e finalizar jornada cirúrgica';}
};
window.hsjDeclineSurvey=async function(id){
 if(!confirm('Confirma que o paciente optou por não responder à pesquisa? A jornada será finalizada e a recusa será contabilizada.'))return;
 const btn=document.getElementById('hsjSurveyDecline'),send=document.getElementById('hsjSurveySubmit');
 if(!btn||btn.disabled||send?.disabled)return;btn.disabled=true;if(send)send.disabled=true;
 const err=document.getElementById('hsjSurveyError');btn.textContent='Finalizando jornada...';
 try{await api('/rest/v1/rpc/finalizar_jornada_sem_pesquisa',{method:'POST',body:JSON.stringify({p_surgery_id:id})});
 await load();fillFilters();window.hsjCelebration();renderCurrent();
 }catch(e){if(err)err.textContent='Não foi possível concluir: '+e.message;btn.disabled=false;if(send)send.disabled=false;btn.textContent='Paciente optou em não realizar a pesquisa';}
};
window.hsjCelebration=function(){
const el=document.createElement('div');el.className='hsj-celebrate';el.innerHTML='<div class="hsj-sparks" aria-hidden="true">'+Array.from({length:28},(_,i)=>'<i style="--i:'+i+';--d:'+(i%7)+'"></i>').join('')+'</div><div class="hsj-celebrate-message"><div style="font-size:64px">🎉🎆🎊</div><h2>Parabéns! jornada cirúrgica concluida com sucesso!</h2><button class="btn primary" type="button">Continuar</button></div>';
el.querySelector('button').onclick=()=>el.remove();document.body.appendChild(el);
};
let period={from:'',to:''},lastSurvey=[],lastDeclines=[],loading=false;
window.hsjSurveyPeriod=function(){period.from=document.getElementById('hsjDateFrom')?.value||'';period.to=document.getElementById('hsjDateTo')?.value||'';renderSatisfactionIndicators()};
async function loadDeclines(){let query='/rest/v1/jornada_satisfaction_declines?select=*&order=declined_at.desc&limit=5000';if(period.from)query+='&declined_at=gte.'+encodeURIComponent(period.from+'T00:00:00');if(period.to){const d=new Date(period.to+'T12:00:00');d.setDate(d.getDate()+1);query+='&declined_at=lt.'+encodeURIComponent(d.toISOString().slice(0,10)+'T00:00:00')}return await api(query)}
async function loadSurveys(){let query='/rest/v1/jornada_satisfaction?select=*&order=completed_at.desc&limit=5000';if(period.from)query+='&completed_at=gte.'+encodeURIComponent(period.from+'T00:00:00');if(period.to){const d=new Date(period.to+'T12:00:00');d.setDate(d.getDate()+1);query+='&completed_at=lt.'+encodeURIComponent(d.toISOString().slice(0,10)+'T00:00:00')}return await api(query)}
function chart(i,rows){const values=qs[i][1],counts=values.map(v=>rows.filter(r=>r['q'+(i+1)]===v).length),max=Math.max(1,...counts);return '<div class="chart"><h3>'+(i+1)+'. '+h(qs[i][0])+'</h3>'+values.map((v,j)=>'<div class="barrow" style="grid-template-columns:minmax(160px,260px) 1fr 45px"><span>'+h(v)+'</span><div class="bar"><i style="width:'+(counts[j]/max*100)+'%"></i></div><b>'+counts[j]+'</b></div>').join('')+'</div>'}
async function renderSatisfactionIndicators(){
const c=document.getElementById('content');c.innerHTML='<section class="card"><div class="section-head"><div><h2>📊 Indicadores de Satisfação</h2><div class="sub">Respostas registradas na conclusão da jornada. Atualização automática a cada 20 segundos.</div></div><button class="btn" onclick="window.print()">🖨 Imprimir</button></div><div class="consult-filters" style="grid-template-columns:1fr 1fr auto"><div class="field"><label>De</label><input id="hsjDateFrom" type="date" value="'+h(period.from)+'" onchange="hsjSurveyPeriod()"></div><div class="field"><label>Até</label><input id="hsjDateTo" type="date" value="'+h(period.to)+'" onchange="hsjSurveyPeriod()"></div><button class="btn" onclick="hsjExportSurvey()">⬇ Excel (CSV)</button></div><div id="hsjSurveyResults">Carregando...</div></section>';
if(loading)return;loading=true;try{[lastSurvey,lastDeclines]=await Promise.all([loadSurveys(),loadDeclines()]);if(S.view!=='satisfacao_indicadores')return;const box=document.getElementById('hsjSurveyResults');if(!box)return;
const total=lastSurvey.length,refused=lastDeclines.length,all=total+refused,sat=lastSurvey.filter(r=>r.q6==='Muito satisfeito(a)'||r.q6==='Satisfeito(a)').length;
box.innerHTML='<div class="cards"><div class="kpi"><div class="label">PESQUISAS RESPONDIDAS</div><div class="value">'+total+'</div></div><div class="kpi orange"><div class="label">OPTARAM POR NÃO RESPONDER</div><div class="value">'+refused+'</div></div><div class="kpi teal"><div class="label">TAXA DE PARTICIPAÇÃO</div><div class="value">'+(all?(100*total/all).toFixed(1)+'%':'—')+'</div></div><div class="kpi green"><div class="label">SATISFEITOS OU MUITO SATISFEITOS</div><div class="value">'+(total?(100*sat/total).toFixed(1)+'%':'—')+'</div></div></div>'+qs.map((_,i)=>chart(i,lastSurvey)).join('')+'<div class="chart"><h3>Sugestões (respostas abertas)</h3>'+lastSurvey.filter(r=>r.q7).slice(0,100).map(r=>'<div style="padding:8px;border-bottom:1px solid #ddd">'+h(new Date(r.completed_at).toLocaleDateString('pt-BR'))+' — '+h(r.q7)+'</div>').join('')+'</div>';
}catch(e){const x=document.getElementById('hsjSurveyResults');if(x)x.textContent='Erro ao carregar indicadores: '+e.message}finally{loading=false}
}
window.hsjExportSurvey=function(){const header=['Data','Atendimento',...qs.map((_,i)=>'Pergunta '+(i+1)),'Sugestão'];downloadCsv('pesquisas_satisfacao_jornada.csv',[header,...lastSurvey.map(r=>[r.completed_at,r.surgery_id,...qs.map((_,i)=>r['q'+(i+1)]),r.q7])])};
setInterval(()=>{if(S.view==='satisfacao_indicadores'&&!document.getElementById('modal')?.firstChild)renderSatisfactionIndicators()},20000);
const css=document.createElement('style');css.textContent='.hsj-celebrate{position:fixed;inset:0;z-index:1000;background:rgba(8,22,54,.94);display:grid;place-items:center;color:#fff;text-align:center;padding:20px}.hsj-celebrate-message{position:relative;z-index:3;max-width:650px;animation:hsjPop .6s ease-out}.hsj-celebrate-message h2{font-size:clamp(23px,4vw,42px);line-height:1.35}.hsj-sparks{position:absolute;inset:0;overflow:hidden}.hsj-sparks i{position:absolute;left:calc(10% + (var(--i)*3%));top:45%;width:9px;height:15px;background:hsl(calc(var(--i)*40),95%,65%);transform:rotate(calc(var(--i)*37deg));animation:hsjFire 2.6s ease-out infinite;animation-delay:calc(var(--d)*-.3s)}@keyframes hsjFire{0%{opacity:0;transform:translateY(80px) scale(.3)}20%{opacity:1}100%{opacity:0;transform:translateY(-240px) translateX(130px) rotate(600deg)}}@keyframes hsjPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){.hsj-sparks i,.hsj-celebrate-message{animation:none}}';
document.head.appendChild(css);
window.renderTabs();
})();