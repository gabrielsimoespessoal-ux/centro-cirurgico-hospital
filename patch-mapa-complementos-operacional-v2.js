(()=>{
if(window.__hsjMapaExtraV2)return;window.__hsjMapaExtraV2=true;
const marker=/\s*\[\[HSJ_EXTRA_V2:([A-Za-z0-9+/=]+)\]\]\s*$/;
function decode(raw){const s=String(raw||''),m=s.match(marker);if(!m)return {base:s,pre:'',notes:''};try{const info=JSON.parse(decodeURIComponent(escape(atob(m[1]))));return {base:s.replace(marker,''),pre:info.pre||'',notes:info.notes||''}}catch{return {base:s,pre:'',notes:''}}}
function encode(base,pre,notes){const pure=decode(base).base.trim();return (!pre&&!notes)?pure:pure+'\n[[HSJ_EXTRA_V2:'+btoa(unescape(encodeURIComponent(JSON.stringify({pre,notes}))))+']]'}
function birth(x){let v=String(x.birth_date||'').slice(0,10);const m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:'Não informada'}
const oldEdit=window.editMapPatient,oldRender=window.renderMap;
window.editMapPatient=function(id){
 oldEdit.apply(this,arguments);
 const x=S.rows.find(r=>r.id===id),form=document.querySelector('#modal .mb .grid');if(!x||!form)return;
 const v=decode(x.map_reservations);
 const info=document.createElement('div');info.className='notice';info.style.gridColumn='1/-1';info.innerHTML='<b>Data de nascimento:</b> '+esc(birth(x));
 form.prepend(info);
 const block=document.createElement('div');block.className='field span3';block.innerHTML='<label>Internação antecipada</label><select id="hsj_pre"><option value="">Não informado</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select><label style="margin-top:10px">Observações individuais do paciente</label><textarea id="hsj_notes" rows="4" placeholder="Observações para este paciente"></textarea>';
 form.appendChild(block);block.querySelector('select').value=v.pre;block.querySelector('textarea').value=v.notes;
 const save=document.querySelector('#modal .mf button[onclick^="saveMapPatientV17"]');
 if(save)save.setAttribute('onclick',"hsjSaveMapExtraV2('"+id+"')");
};
window.hsjSaveMapExtraV2=async function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return alert('Paciente não encontrado');
 const room=document.getElementById('f_map_room')?.value||'',date=document.getElementById('f_surgery_date')?.value||'';
 const uti=document.getElementById('f_map_uti')?.value||'',blood=document.getElementById('f_map_sangue')?.value||'';
 if(!room||!date||!uti||!blood)return alert('Preencha sala, data, reserva de UTI e reserva de sangue.');
 const btn=document.querySelector('#modal .mf .primary');if(btn)btn.disabled=true;
 try{
 const fresh=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,updated_at');
 if(!Array.isArray(fresh)||fresh.length!==1||String(fresh[0].updated_at||'')!==String(x.updated_at||''))throw Error('Cadastro modificado em outro computador. Reabra o paciente.');
 const reservations='RESERVA UTI: '+uti+' | RESERVA SANGUE: '+blood+(document.getElementById('f_map_obs')?.value?.trim()?' | '+document.getElementById('f_map_obs').value.trim():'');
 const payload={map_room:room,surgery_date:date,map_responsible:document.getElementById('f_map_responsible')?.value||null,map_reservations:encode(reservations,document.getElementById('hsj_pre')?.value||'',document.getElementById('hsj_notes')?.value||''),updated_by:uid};
 const result=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&updated_at=eq.'+encodeURIComponent(x.updated_at),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
 if(!Array.isArray(result)||result.length!==1)throw Error('Alteração simultânea. Nenhum dado foi sobrescrito.');
 document.getElementById('modal').innerHTML='';await load();renderMap();
 }catch(e){alert('Agendamento não salvo: '+e.message)}finally{if(btn)btn.disabled=false}
};
window.renderMap=function(){
 const r=oldRender.apply(this,arguments),table=document.querySelector('#content .map-print-v11 .tablewrap table');if(!table)return r;
 const headings=[...table.querySelectorAll('thead th')];const ageHead=headings.find(h=>h.textContent.trim()==='IDADE');
 if(ageHead&&!table.querySelector('[data-hsj-birth]')){ageHead.insertAdjacentHTML('afterend','<th data-hsj-birth>NASCIMENTO</th>');}
 const reserveHead=[...table.querySelectorAll('thead th')].find(h=>h.textContent.includes('RESERVAS UTI'));if(reserveHead)reserveHead.textContent='RESERVAS UTI / SANGUE / INTERNAÇÃO ANTECIPADA';
 table.querySelectorAll('tbody tr').forEach(tr=>{
 const b=tr.querySelector('button[onclick^="editPatient("]');if(!b)return;
 const id=(b.getAttribute('onclick')||'').match(/'([^']+)'/)?.[1],x=S.rows.find(z=>z.id===id);if(!x)return;
 const cells=[...tr.children];const ageIndex=[...table.querySelectorAll('thead th')].findIndex(h=>h.textContent.trim()==='IDADE');
 if(ageIndex>=0&&cells[ageIndex])cells[ageIndex].insertAdjacentHTML('afterend','<td>'+esc(birth(x))+'</td>');
 const reserveIdx=[...table.querySelectorAll('thead th')].findIndex(h=>h.textContent.includes('RESERVAS UTI'));
 const td=tr.children[reserveIdx];if(td){const p=decode(x.map_reservations);const txt=p.base;td.innerHTML=td.innerHTML.replace(/\[\[HSJ_EXTRA_V2:[A-Za-z0-9+/=]+\]\]/g,'');td.insertAdjacentHTML('beforeend','<div style="margin-top:5px"><b>Internação antecipada:</b> '+esc(p.pre||'Não informado')+'</div><div><b>Observações:</b> '+esc(p.notes||'—')+'</div>');}
 });
 return r;
};
if(S.view==='mapa_cirurgico')renderMap();
})();