(()=>{
'use strict';
if(window.__hsjMapaAtalhoAgendamentoObrigatorio20261116)return;
window.__hsjMapaAtalhoAgendamentoObrigatorio20261116=true;
let saving=false;
const val=id=>String(document.getElementById(id)?.value||'').trim();
const validUuid=id=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(id));
const dateValid=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(new Date(x+'T12:00:00Z').getTime());
const timeValid=x=>/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
const extra=(base,pre,notes)=>{
 if(!pre&&!notes)return base;
 const json=JSON.stringify({pre,notes});
 return base+'\n[[HSJ_EXTRA_V2:'+btoa(unescape(encodeURIComponent(json)))+']]';
};
window.hsjMapaDireto=function(id){
 if(saving)return;
 if(!validUuid(id))return alert('Identificador de paciente inválido.');
 const x=(S.rows||[]).find(r=>r.id===id);
 if(!x)return alert('Paciente não localizado. Atualize a Fila e tente novamente.');
 if(x.active===false||x.stage==='concluida')return alert('Este cadastro não permite novo agendamento no Mapa.');
 if(x.stage==='mapa_cirurgico')return alert('Paciente já está no Mapa Cirúrgico. Utilize Editar mapa.');
 if(typeof window.editMapPatient!=='function')return alert('Formulário de agendamento indisponível. Atualize a página.');
 // Não altera etapa: abre o MESMO formulário usado para agendar no Mapa.
 window.editMapPatient(id);
 const root=document.querySelector('#modal .back'),body=root?.querySelector('.mb'),button=root?.querySelector('.mf button.primary');
 if(!root||!body||!button||!document.getElementById('f_map_uti')||!document.getElementById('f_map_surgery_time')){
   alert('O formulário completo não carregou. Nenhuma etapa foi alterada.');
   if(root)document.getElementById('modal').innerHTML='';
   return;
 }
 const note=document.createElement('div');
 note.className='notice';
 note.style.cssText='border-left:4px solid #096b5a;background:#ecfdf5;margin:10px 0';
 note.innerHTML='<b>Agendamento obrigatório antes do encaminhamento</b><div>O paciente permanecerá na etapa atual até o servidor confirmar sala, data, horário, responsável e reservas de UTI e sangue.</div>';
 body.prepend(note);
 button.removeAttribute('onclick');
 button.onclick=()=>window.hsjSalvarMapaAntesDeEncaminhar(id);
 button.type='button';
 button.textContent='Salvar agendamento e encaminhar ao Mapa';
};
window.hsjSalvarMapaAntesDeEncaminhar=async function(id){
 if(saving||!validUuid(id))return;
 const original=(S.rows||[]).find(r=>r.id===id);
 if(!original||original.stage==='mapa_cirurgico')return alert('Atualize o cadastro antes de agendar.');
 const values={
  room:val('f_map_room'),date:val('f_surgery_date'),time:val('f_map_surgery_time'),
  responsible:val('f_map_responsible'),uti:val('f_map_uti'),blood:val('f_map_sangue'),
  obs:val('f_map_obs'),pre:val('hsj_pre'),notes:val('hsj_notes')
 };
 const required=[
  ['room', 'Selecione a sala cirúrgica.', 'f_map_room'],
  ['date','Informe a data da cirurgia.','f_surgery_date'],
  ['time','Informe o horário do procedimento.','f_map_surgery_time'],
  ['responsible','Informe o nome do responsável pelo agendamento.','f_map_responsible'],
  ['uti','Informe a reserva de UTI: SIM ou NÃO.','f_map_uti'],
  ['blood','Informe a reserva de sangue: SIM ou NÃO.','f_map_sangue']
 ];
 for(const [key,message,element] of required){
  if(!values[key]){alert(message);document.getElementById(element)?.focus();return}
 }
 if(!dateValid(values.date)){alert('Data inválida.');return}
 if(!timeValid(values.time)){alert('Horário inválido.');return}
 if(values.responsible.length<2){alert('Informe o nome completo ou identificável de quem agendou.');return}
 if(!['SIM','NÃO'].includes(values.uti)||!['SIM','NÃO'].includes(values.blood)){alert('Escolha SIM ou NÃO para UTI e sangue.');return}
 if(!original.updated_at){alert('Versão do cadastro indisponível. Atualize a Fila.');return}
 const button=document.querySelector('#modal .mf button.primary');
 if(button?.dataset.hsjTimeLoading){alert('Aguarde a consulta do horário anterior terminar.');return}
 const previousText=button?.textContent;
 saving=true;
 if(button){button.disabled=true;button.textContent='Gravando agendamento no servidor...'}
 try{
  // Preserva a regra vigente para feriados e fins de semana: exceção justificada.
  const classification=window.hsjClassificarDataCirurgica?.(values.date);
  if(classification?.requiresAuthorization&&String(original.surgery_date||'').slice(0,10)!==values.date){
    if(!confirm('ATENÇÃO: '+classification.name+'. Não operamos rotineiramente em feriados ou finais de semana. Solicitar exceção?'))return;
    const reason=String(prompt('Informe a autorização e justificativa para a cirurgia atípica (mínimo de 10 caracteres):','')||'').trim();
    if(reason.length<10){alert('Autorização não registrada. Nenhum agendamento realizado.');return}
    const approval=await api('/rest/v1/surgery_calendar_exceptions',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({surgery_id:id,scheduled_date:values.date,justification:reason,source:'Atalho da Fila — agendamento obrigatório do Mapa'})});
    if(!Array.isArray(approval)||approval.length!==1)throw Error('Exceção de calendário não confirmada.');
  }
  const reservations=extra('RESERVA UTI: '+values.uti+' | RESERVA SANGUE: '+values.blood+(values.obs?' | '+values.obs:''),values.pre,values.notes);
  // Uma transação no Supabase salva agendamento e faz a mudança de etapa juntas,
  // usando versão e etapa esperadas para impedir sobrescritas entre computadores.
  const response=await api('/rest/v1/rpc/hsj_agendar_mapa_direto_20261116',{
   method:'POST',body:JSON.stringify({
    p_surgery_id:id,p_expected_stage:original.stage,p_expected_updated_at:original.updated_at,
    p_map_room:values.room,p_surgery_date:values.date,p_surgery_time:values.time,
    p_responsible:values.responsible,p_uti:values.uti,p_sangue:values.blood,
    p_map_reservations:reservations
   })
  });
  if(String(response).replaceAll('"','')!==id)throw Error('O servidor não confirmou o identificador do agendamento. Confira o Mapa antes de repetir.');
  const verified=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,stage,surgery_date,map_room');
  if(!Array.isArray(verified)||verified.length!==1||verified[0].stage!=='mapa_cirurgico'||verified[0].map_room!==values.room||verified[0].surgery_date!==values.date)
    throw Error('Agendamento gravado, mas a conferência não foi concluída. Atualize o Mapa antes de tentar novamente.');
  document.getElementById('modal').innerHTML='';
  try{
   await load();
   S.mapFilters={doctor:'',specialty:'',from:values.date,to:values.date};
   S.view='mapa_cirurgico';window.renderTabs();window.renderCurrent();
   alert('Agendamento confirmado no banco. O paciente agora está no Mapa Cirúrgico.');
  }catch(error){
   alert('Agendamento confirmado no banco, mas a tela não atualizou: '+error.message+'. Recarregue o Mapa.');
  }
 }catch(error){
  alert('O encaminhamento não foi confirmado: '+(error?.message||error)+'\nSe tiver ocorrido uma falha de conexão, confira o registro no Mapa antes de repetir.');
 }finally{saving=false;if(button?.isConnected){button.disabled=false;button.textContent=previousText||'Salvar agendamento e encaminhar ao Mapa'}}
};
// Outros atalhos de etapa não devem contornar a tela de agendamento.
const oldConfirm=window.hsjConfirmarEtapaV26;
if(typeof oldConfirm==='function'){
 window.hsjConfirmarEtapaV26=function(id){
  if(val('hsjStageV26')==='mapa_cirurgico')return window.hsjMapaDireto(id);
  return oldConfirm.apply(this,arguments);
 };
}
const oldMove=window.movePatientV8;
if(typeof oldMove==='function'){
 window.movePatientV8=function(id,stage){
  if(stage==='mapa_cirurgico')return window.hsjMapaDireto(id);
  return oldMove.apply(this,arguments);
 };
}
const oldAdmin=window.hsjConcluirAdminV26;
if(typeof oldAdmin==='function'){
 window.hsjConcluirAdminV26=function(id){
  if(val('hsjAdminReturnV26')==='mapa_cirurgico'){
   alert('Para encaminhar ao Mapa, abra o agendamento completo pelo atalho Mapa Cirúrgico antes de concluir a tratativa.');
   return;
  }
  return oldAdmin.apply(this,arguments);
 };
}
})();
