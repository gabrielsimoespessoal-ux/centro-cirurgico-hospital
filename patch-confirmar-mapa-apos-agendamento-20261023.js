(()=>{if(window.__hsjMapAfterSaveFix)return;window.__hsjMapAfterSaveFix=true;
const originalOpen=window.hsjAgendaSurgery;
const originalSave=window.hsjSaveSurgery;
const get=id=>document.getElementById(id)?.value?.trim()||'';
function showError(message){const error=document.getElementById('ac_err');if(error){error.textContent=message;error.style.color='#b42318';error.scrollIntoView({behavior:'smooth',block:'center'});}alert(message)}
function phone(x){let n=String(x?.phone||'').replace(/\D/g,'');if(n.startsWith('55')&&[12,13].includes(n.length))n=n.slice(2);return [10,11].includes(n.length)?'55'+n:null}
function textWA(x){const d=get('ac_date').split('-').reverse().join('/');return 'Olá, '+x.patient_name+'!\nAqui é do Setor de Marcação de Cirurgia do Hospital São José.\n\nSeu agendamento cirúrgico:\nProcedimento: '+(x.procedure_name||'')+'\nData: '+d+'\nHorário da cirurgia: '+get('ac_time')+'\nChegada: '+(get('ac_arrival')||'Conforme orientação da equipe')+'\nLocal: '+get('ac_location')+'\n\nOrientações: '+get('ac_instructions')+'\n\nResponsável pelo agendamento: '+get('ac_by')+'\nPor favor, confirme o recebimento.';}
let busy=false;
window.hsjConcluirTriagemMapa=async function(id){
 if(busy)return;const x=S.rows.find(r=>r.id===id);if(!x)return showError('Paciente não localizado. Atualize e tente novamente.');
 busy=true;const buttons=[...document.querySelectorAll('#modal .mf button')];buttons.forEach(b=>b.disabled=true);
 const n=phone(x),msg=textWA(x);
 const popup=n?window.open('about:blank','_blank'):null;
 try{
 const success=await originalSave(id);
 if(!success){if(popup)popup.close();showError(document.getElementById('ac_err')?.textContent||'Não foi possível salvar. Verifique os campos obrigatórios.');return;}
 const server=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,stage,surgery_date');
 if(!Array.isArray(server)||server.length!==1||server[0].stage!=='mapa_cirurgico')throw Error('O servidor não confirmou a transferência para o Mapa Cirúrgico.');
 await load();
 const updated=S.rows.find(r=>r.id===id);
 if(!updated||updated.stage!=='mapa_cirurgico')throw Error('O cadastro atualizado não foi localizado no mapa.');
 S.mapFilters={doctor:'',specialty:'',from:'',to:''};
 for(const key of ['gfName','gfDoctor','gfProcedure','gfDate','gfSpecialty','gfStatus']){const el=document.getElementById(key);if(el)el.value=''}
 S.room='all';S.mapMode='daily';S.view='mapa_cirurgico';
 document.getElementById('modal').innerHTML='';
 renderTabs();renderCurrent();
 const tabs=document.getElementById('tabs');const tab=[...tabs.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("mapa_cirurgico"));tab?.scrollIntoView({block:'nearest',inline:'center'});
 if(popup){popup.location.href='https://wa.me/'+n+'?text='+encodeURIComponent(msg)}
 else alert('Triagem e agendamento salvos. Paciente no Mapa Cirúrgico. Não foi possível abrir o WhatsApp porque o telefone cadastrado é inválido ou está ausente.');
 const content=document.getElementById('content');const banner=document.createElement('div');banner.className='notice';banner.style.cssText='border-left-color:#0f8a4b;font-weight:bold';banner.textContent='✅ Agendamento confirmado. '+updated.patient_name+' foi encaminhado ao Mapa Cirúrgico para '+(updated.surgery_date||'a data cadastrada')+'.';content?.prepend(banner);
 }catch(e){if(popup)popup.close();showError('O agendamento não pôde ser confirmado no Mapa Cirúrgico: '+e.message+'. Não tente duplicar o cadastro.');}finally{busy=false;buttons.forEach(b=>{if(b.isConnected)b.disabled=false})}
};
window.hsjFinishSurgeryWithWhatsApp=window.hsjConcluirTriagemMapa;
window.hsjConfirmSurgeryAndMap=window.hsjConcluirTriagemMapa;
window.hsjAgendaSurgery=async function(id){await originalOpen(id);document.querySelectorAll('#modal .mf button').forEach(b=>{if(/Salvar triagem e agendar|contato efetivo/i.test(b.textContent)){b.onclick=()=>window.hsjConcluirTriagemMapa(id)}})};
})();