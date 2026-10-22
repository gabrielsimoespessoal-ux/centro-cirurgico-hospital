(()=>{
if(window.__hsjMapaComplementos20261022)return;
window.__hsjMapaComplementos20261022=true;
const tag=/\\n?\\[\\[HSJ_MAPA_V1:([A-Za-z0-9+/=]+)\\]\\]\\s*$/;
const original={roomTable:window.roomTable,roomCard:window.roomCard,editMapPatient:window.editMapPatient,saveMapPatient:window.saveMapPatient};
function parse(s){
 s=String(s||'');const m=s.match(tag);
 if(!m)return {reserva:s,antecipada:'',observacao:''};
 try{const data=JSON.parse(decodeURIComponent(Array.from(atob(m[1]),c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')));return {reserva:s.replace(tag,'').trimEnd(),antecipada:data.antecipada||'',observacao:data.observacao||''};}
 catch(e){return {reserva:s,antecipada:'',observacao:''};}
}
function pack(reserva,antecipada,observacao){
 const clean=String(reserva||'').replace(tag,'').trimEnd();
 if(!antecipada&&!observacao)return clean;
 const json=JSON.stringify({antecipada,observacao});
 const binary=unescape(encodeURIComponent(json));
 return clean+'\\n[[HSJ_MAPA_V1:'+btoa(binary)+']]';
}
function born(x){if(!x.birth_date)return 'Não informada';const s=String(x.birth_date).slice(0,10);const m=s.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:s}
function age(x){if(!x.birth_date)return '—';const d=new Date(String(x.birth_date).slice(0,10)+'T12:00:00');if(!Number.isFinite(d.getTime()))return '—';const now=new Date();let a=now.getFullYear()-d.getFullYear();if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate()))a--;return a>=0?a+' anos':'—'}
const safe=v=>window.esc(String(v??''));
function additional(x){const p=parse(x.map_reservations);return '<div style="font-size:12px;line-height:1.55;margin-top:4px"><div><b>Idade:</b> '+age(x)+' &nbsp; <b>Sexo:</b> '+safe(x.sex||x.gender||x.patient_sex||'—')+'</div><div><b>Data de nascimento:</b> '+safe(born(x))+'</div><div><b>Internação antecipada:</b> '+safe(p.antecipada||'Não informado')+'</div><div><b>Observações:</b> '+safe(p.observacao||'—')+'</div></div>'}
window.roomCard=function(n,rows){let rr=rows.filter(x=>String(x.map_room||'').replace(/\\D/g,'')===String(n));return '<div class="room"><h3>🚪 Sala 0'+n+'</h3><div class="body">'+(rr.length?rr.slice(0,4).map(x=>'<div style="margin-bottom:12px"><b>'+safe(x.patient_name)+'</b> — '+safe(x.surgeon||'')+additional(x)+'</div>').join(''):'Nenhum agendamento')+'</div></div>'};
window.roomTable=function(n,rows){let rr=rows.filter(x=>String(x.map_room||'').replace(/\\D/g,'')===String(n));return '<div class="section-head" style="margin:12px 0"><h2>Escala — Sala 0'+n+'</h2></div><div class="tablewrap"><table class="table"><thead><tr><th class="actions">AÇÕES</th><th>PACIENTE / DADOS</th><th>IDS</th><th>PROCEDIMENTO</th><th>MÉDICO</th><th>DATA CIRURGIA</th><th>RESERVAS ESPECIAIS</th><th>RESPONSÁVEL</th></tr></thead><tbody>'+(rr.map(x=>'<tr><td>'+actionButtons(x)+' <button class="btn small" onclick="editMapPatient(\''+x.id+'\')">🏥 Mapa</button></td><td><b>'+safe(x.patient_name)+'</b>'+additional(x)+'</td><td>'+safe(x.ids||'')+'</td><td>'+safe(x.procedure_name||'')+'</td><td>'+safe(x.surgeon||'')+'</td><td>'+safe(x.surgery_date||'')+'</td><td>'+safe(parse(x.map_reservations).reserva)+'</td><td>'+safe(x.map_responsible||'')+'</td></tr>').join('')||'<tr><td colspan="8" style="text-align:center;padding:28px">Nenhum paciente alocado nesta sala.</td></tr>')+'</tbody></table></div>'};
window.editMapPatient=function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return alert('Paciente não localizado.');
 const p=parse(x.map_reservations);
 document.getElementById('modal').innerHTML='<div class="back"><div class="modal"><div class="mh"><b>🏥 Mapa: '+safe(x.patient_name)+'</b><button class="btn" onclick="document.getElementById(\'modal\').innerHTML=\'\'">Fechar</button></div><div class="mb"><div class="notice"><b>Idade:</b> '+age(x)+' | <b>Data de nascimento:</b> '+safe(born(x))+' | <b>Sexo:</b> '+safe(x.sex||x.gender||x.patient_sex||'—')+'</div><div class="grid">'+selectField('Sala','map_room',x.map_room,['Sala 01','Sala 02','Sala 03','Sala 04'])+field('Data da cirurgia','surgery_date',x.surgery_date,'date')+field('Responsável','map_responsible',x.map_responsible)+'<div class="field span3"><label>Reservas de UTI e sangue / reservas especiais</label><textarea id="f_map_reservations">'+safe(p.reserva)+'</textarea></div><div class="field span3"><label>Internação antecipada</label><select id="hsj_antecipada"><option value="">Não informado</option><option value="SIM" '+(p.antecipada==='SIM'?'selected':'')+'>SIM</option><option value="NÃO" '+(p.antecipada==='NÃO'?'selected':'')+'>NÃO</option></select></div><div class="field span3"><label>Observações individuais do paciente</label><textarea id="hsj_observacao" rows="5" placeholder="Registre observações específicas do mapa cirúrgico">'+safe(p.observacao)+'</textarea></div></div></div><div class="mf"><button class="btn primary" onclick="saveMapPatient(\''+id+'\')">Salvar</button></div></div></div>';
};
window.saveMapPatient=async function(id){
 const x=S.rows.find(r=>r.id===id);if(!x)return alert('Paciente não localizado.');
 const b=document.querySelector('#modal .mf .primary');if(b)b.disabled=true;
 try{
 const current=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,map_reservations,updated_at');
 if(!Array.isArray(current)||current.length!==1)throw Error('Paciente não encontrado no servidor.');
 if(String(current[0].updated_at||'')!==String(x.updated_at||''))throw Error('O paciente foi atualizado em outro computador. Feche, atualize e reabra o formulário para evitar sobrescrita.');
 const d={map_room:document.getElementById('f_map_room').value||null,surgery_date:document.getElementById('f_surgery_date').value||null,map_responsible:document.getElementById('f_map_responsible').value||null,map_reservations:pack(document.getElementById('f_map_reservations').value,document.getElementById('hsj_antecipada').value,document.getElementById('hsj_observacao').value),updated_by:uid};
 const result=await api('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&updated_at=eq.'+encodeURIComponent(x.updated_at),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(d)});
 if(!Array.isArray(result)||result.length!==1)throw Error('Alteração simultânea detectada: nada foi sobrescrito.');
 document.getElementById('modal').innerHTML='';await load();renderMap();
 }catch(e){alert('Não foi possível salvar: '+e.message);}finally{if(b)b.disabled=false;}
};
})();