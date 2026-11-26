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
 const block=document.createElement('div');block.className='field span3';block.innerHTML='<label for="hsj_pre">Internação antecipada *</label><select id="hsj_pre" required aria-required="true"><option value="">Selecione SIM ou NÃO</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select><label style="margin-top:10px">Observações individuais do paciente</label><textarea id="hsj_notes" rows="4" placeholder="Observações para este paciente"></textarea>';
 const normPre=String(v.pre||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 form.appendChild(block);block.querySelector('select').value=normPre==='NAO'?'NÃO':normPre==='SIM'?'SIM':'';block.querySelector('textarea').value=v.notes;
 const save=document.querySelector('#modal .mf button[onclick^="saveMapPatientV17"]');
 if(save)save.setAttribute('onclick',"hsjSaveMapExtraV2('"+id+"')");
};
window.hsjSaveMapExtraV2=async function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return alert('Paciente não encontrado');
 const room=document.getElementById('f_map_room')?.value||'',date=document.getElementById('f_surgery_date')?.value||'';
 const uti=document.getElementById('f_map_uti')?.value||'',blood=document.getElementById('f_map_sangue')?.value||'',pre=document.getElementById('hsj_pre')?.value||'';
 const validChoices=['SIM','NÃO'];
 if(!room||!date)return alert('Preencha sala e data da cirurgia.');
 if(!validChoices.includes(uti)){alert('Informe obrigatoriamente a reserva de UTI: SIM ou NÃO.');document.getElementById('f_map_uti')?.focus();return}
 if(!validChoices.includes(blood)){alert('Informe obrigatoriamente a reserva de sangue: SIM ou NÃO.');document.getElementById('f_map_sangue')?.focus();return}
 if(!validChoices.includes(pre)){alert('Informe obrigatoriamente a internação antecipada: SIM ou NÃO.');document.getElementById('hsj_pre')?.focus();return}
 const btn=document.querySelector('#modal .mf .primary');if(btn)btn.disabled=true;
 try{
 const fresh=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,updated_at');
 if(!Array.isArray(fresh)||fresh.length!==1||String(fresh[0].updated_at||'')!==String(x.updated_at||''))throw Error('Cadastro modificado em outro computador. Reabra o paciente.');
 const reservations='RESERVA UTI: '+uti+' | RESERVA SANGUE: '+blood+(document.getElementById('f_map_obs')?.value?.trim()?' | '+document.getElementById('f_map_obs').value.trim():'');
 const payload={map_room:room,surgery_date:date,map_responsible:document.getElementById('f_map_responsible')?.value||null,map_reservations:encode(reservations,pre,document.getElementById('hsj_notes')?.value||''),updated_by:uid};
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
 const td=tr.children[reserveIdx];if(td){
   const p=decode(x.map_reservations);
   const value=String(p.pre||'').trim().toUpperCase();
   const formatted=value==='NAO'?'NÃO':value;
   const badgeClass=formatted==='SIM'?'warn':formatted==='NÃO'?'ok':'bad';
   const badgeText=formatted==='SIM'||formatted==='NÃO'?formatted:'NÃO INFORMADO';
   td.innerHTML=td.innerHTML.replace(/\[\[HSJ_EXTRA_V2:[A-Za-z0-9+/=]+\]\]/g,'');
   // A mesma marcação visual e as mesmas cores dos selos UTI / SANGUE.
   td.insertAdjacentHTML('beforeend',
     '<div style="margin-top:5px"><span class="pill '+badgeClass+'" style="margin-right:4px">Internação antecipada: '+esc(badgeText)+'</span></div>'+
     '<div style="margin-top:3px"><b>Observações:</b> '+esc(p.notes||'—')+'</div>');
  }
 });
 return r;
};
if(S.view==='mapa_cirurgico')renderMap();
})();