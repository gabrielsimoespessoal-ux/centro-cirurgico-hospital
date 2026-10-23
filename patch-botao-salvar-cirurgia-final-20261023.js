(()=>{if(window.__hsjSaveButtonFinal20261023)return;window.__hsjSaveButtonFinal20261023=true;
let working=false;
const oldOpen=window.hsjAgendaSurgery;
window.hsjAgendaSurgery=async function(id){await oldOpen(id);const foot=document.querySelector('#modal .mf');if(!foot)return;const btn=[...foot.querySelectorAll('button')].find(b=>/Salvar triagem e encaminhar|Salvar triagem e agendar/i.test(b.textContent));if(!btn)return;
btn.removeAttribute('onclick');btn.onclick=null;const fresh=btn.cloneNode(true);btn.replaceWith(fresh);fresh.type='button';fresh.onclick=()=>window.hsjSaveAndMoveFinal(id);};
window.hsjSaveAndMoveFinal=async function(id){if(working)return;working=true;const b=[...document.querySelectorAll('#modal .mf button')].find(b=>/Salvar triagem/i.test(b.textContent));const original=b?.textContent;if(b){b.disabled=true;b.textContent='Salvando e verificando...'}try{
const success=await window.hsjSaveSurgery(id);
if(!success){const msg=document.getElementById('ac_err')?.textContent||'Confira os campos obrigatórios da triagem e agendamento.';alert('Agendamento NÃO concluído: '+msg);return;}
const confirmation=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,stage');
if(!Array.isArray(confirmation)||confirmation.length!==1||confirmation[0].stage!=='mapa_cirurgico')throw Error('Não foi confirmada a movimentação pelo servidor.');
await load();S.mapFilters={doctor:'',specialty:'',from:'',to:''};for(const k of ['gfName','gfDoctor','gfProcedure','gfDate','gfSpecialty','gfStatus']){const input=document.getElementById(k);if(input)input.value=''}
S.view='mapa_cirurgico';document.getElementById('modal').innerHTML='';renderTabs();renderCurrent();alert('Agendamento salvo com sucesso. Paciente encaminhado ao Mapa Cirúrgico.');
}catch(e){alert('Erro no salvamento ou no encaminhamento: '+e.message)}finally{working=false;if(b?.isConnected){b.disabled=false;b.textContent=original}}};
})();