(()=>{
if(window.__hsjConsultaCadastroV24)return;window.__hsjConsultaCadastroV24=true;
window.hsjConsultarCadastroV24=function(id){
 const x=S.rows.find(r=>r.id===id);
 if(!x)return alert('Cadastro não encontrado na lista atual. Atualize os dados e tente novamente.');
 const campos=[
 ['Nome completo',x.patient_name],['IDS',x.ids],['CPF',x.cpf],['Contato / WhatsApp',x.phone],
 ['Sexo',x.sex],['Nascimento',x.birth_date],['Especialidade',x.specialty],['Médico cirurgião',x.surgeon],
 ['Procedimento',x.procedure_name],['Situação do paciente',x.patient_status],['Etapa atual',labels[x.stage]||x.stage],
 ['Data de solicitação da AIH',x.aih_request_date],['Data do agendamento',x.appointment_date],
 ['Data da consulta',x.consultation_date],['Horário da consulta',x.consultation_time],
 ['Data da cirurgia',x.surgery_date],['Profissional que cadastrou',x.registration_professional],
 ['Observações',x.suspension_notes],['Observações de consulta',x.consultation_notes],
 ['Motivo da triagem',x.nurse_referral_reason],['Última avaliação do enfermeiro',x.nurse_observations]
 ];
 const row=([k,v])=>'<div style="padding:9px;border:1px solid #e2e8f0;border-radius:7px;overflow-wrap:anywhere"><div style="font-size:11px;color:#64748b;font-weight:bold">'+esc(k)+'</div><div style="margin-top:3px">'+esc(v??'Não informado')+'</div></div>';
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal" style="max-width:900px"><div class="mh"><b>👤 Consulta do cadastro — '+esc(x.patient_name||'Paciente')+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><div class="notice">Consulta somente para leitura. Nenhum dado será alterado nesta janela.</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px">'+campos.map(row).join('')+'</div></div><div class="mf"><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button><button class="btn primary" onclick="editPatient(\''+id+'\')">✏ Editar cadastro</button></div></div></div>';
};
const oldNurse=window.renderNurse;
window.renderNurse=function(){
 const result=oldNurse.apply(this,arguments);
 document.querySelectorAll('#content button[onclick^="editNurseV10("]').forEach(b=>{
  const id=(b.getAttribute('onclick')||'').match(/'([0-9a-f-]{36})'/)?.[1];
  if(!id||b.parentElement.querySelector('[data-consultar-v24]'))return;
  const btn=document.createElement('button');btn.className='btn small';btn.type='button';btn.dataset.consultarV24='1';
  btn.textContent='👤 Consultar cadastro';btn.style.marginLeft='5px';btn.onclick=()=>hsjConsultarCadastroV24(id);b.after(btn);
 });
 return result;
};
if(S.view==='avaliacao_enfermeiro')renderNurse();
})();