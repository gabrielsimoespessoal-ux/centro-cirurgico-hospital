(()=>{
if(window.__hsjResumoConsultasV23)return;window.__hsjResumoConsultasV23=true;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const localToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dateBR=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s;
const status=(x,today)=>!x.consultation_date?'sem_data':x.consultation_date<today?'expirada':'pendente';
const allConsults=()=>S.rows.filter(x=>x.active!==false&&(x.stage==='consulta_preop'||x.consultation_only||x.consultation_date));
const matchesFilters=x=>{
 const local=S.consultFilters||{};
 const q=norm(local.search),gd=document.getElementById('gfDoctor')?.value||'',gs=document.getElementById('gfSpecialty')?.value||'',gt=document.getElementById('gfStatus')?.value||'',gp=norm(document.getElementById('gfProcedure')?.value);
 const gname=norm(document.getElementById('gfName')?.value);
 return (!q||[x.patient_name,x.cpf,x.ids].some(y=>norm(y).includes(q)))
 &&(!local.doctor||x.surgeon===local.doctor)&&(!local.specialty||x.specialty===local.specialty)&&(!local.status||x.patient_status===local.status)
 &&(!gd||x.surgeon===gd)&&(!gs||x.specialty===gs)&&(!gt||x.patient_status===gt)
 &&(!gp||norm(x.procedure_name).includes(gp))
 &&(!gname||[x.patient_name,x.cpf,x.ids].some(y=>norm(y).includes(gname)));
};
function draw(){
 if(S.view!=='consulta_preop')return;
 const card=document.querySelector('#content section.card');if(!card)return;
 const old=card.querySelector('.dj-note');
 const today=localToday();
 const from=document.getElementById('gfDateFrom')?.value||'',to=document.getElementById('gfDateTo')?.value||'';
 const hasPeriod=!!(from||to);
 const low=from||(!hasPeriod?today:'');const high=to||(!hasPeriod?today:'');
 const candidates=allConsults().filter(matchesFilters);
 const inside=x=>!!x.consultation_date&&(!low||x.consultation_date>=low)&&(!high||x.consultation_date<=high);
 const scheduled=candidates.filter(inside);
 const specialty=new Map();
 for(const x of scheduled){const name=x.specialty?.trim()||'Não informada';specialty.set(name,(specialty.get(name)||0)+1)}
 const bySpec=[...specialty].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'));
 const badge=(name,n,style='')=>'<div style="border:1px solid #d9e1ec;border-radius:9px;padding:12px;background:#f8fbff;'+style+'"><div style="font-size:12px;font-weight:650;color:#42526c">'+name+'</div><div style="font-size:27px;font-weight:750;margin-top:5px">'+n+'</div></div>';
 const title=hasPeriod?'Período da consulta: '+(from?dateBR(from):'início')+' até '+(to?dateBR(to):'sem limite'):'Consultas do dia: '+dateBR(today);
 const block=document.createElement('div');block.id='hsjResumoConsultasV23';
 block.style.cssText='margin:12px 0 16px';
 block.innerHTML='<div style="font-size:15px;font-weight:750;margin:0 0 10px;color:#123664">📊 Resumo de agendamentos — '+esc(title)+'</div>'
 +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px">'
 +badge('Consultas agendadas',scheduled.length)
 +badge('Especialidades',specialty.size)
 +badge('Pendentes no período',scheduled.filter(x=>status(x,today)==='pendente').length)
 +badge('Expiradas no período',scheduled.filter(x=>status(x,today)==='expirada').length)
 +'</div>'
 +'<div style="margin-top:11px;padding:11px;border:1px solid #d9e1ec;border-radius:8px"><b>Agendamentos por especialidade</b><div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:9px">'
 +(bySpec.length?bySpec.map(([name,n])=>'<span style="border-radius:18px;padding:6px 11px;background:#edf3fa;color:#203c65;font-size:12px"><b>'+esc(name)+':</b> '+n+'</span>').join(''):'<span style="font-size:12px;color:#64748b">Nenhuma consulta marcada no dia/período selecionado.</span>')
 +'</div></div>';
 const anchor=card.querySelector('.consult-filters');if(anchor)anchor.insertAdjacentElement('afterend',block);else card.prepend(block);
 const unqueued=candidates.filter(x=>x.consultation_only);
 const pend=unqueued.filter(x=>status(x,today)==='pendente').length;
 const expired=unqueued.filter(x=>status(x,today)==='expirada').length;
 const noDate=unqueued.filter(x=>status(x,today)==='sem_data').length;
 const note=document.createElement('div');note.className='dj-note';
 note.innerHTML='<b>Pacientes sem cadastro na fila — situação das consultas</b>'
 +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px">'
 +'<span style="padding:7px 10px;border-radius:7px;background:#e6f6ec;color:#185735"><b>Consultas pendentes:</b> '+pend+'</span>'
 +'<span style="padding:7px 10px;border-radius:7px;background:#fff0ed;color:#9b3430"><b>Consultas expiradas:</b> '+expired+'</span>'
 +'<span style="padding:7px 10px;border-radius:7px;background:#f1f3f7;color:#465469"><b>Sem data marcada:</b> '+noDate+'</span></div>'
 +'<div style="font-size:11px;margin-top:8px">Expirada = consulta com data anterior a hoje (00h, horário local). A classificação é automática e não exclui nem altera o cadastro. O botão “Cadastrar em fila” permanece disponível.</div>';
 if(old)old.replaceWith(note);else block.after(note);
}
const original=window.renderConsult;
window.renderConsult=function(){
 const result=original.apply(this,arguments);
 document.getElementById('hsjResumoConsultasV23')?.remove();
 draw();
 return result;
};
let lastDay=localToday();
setInterval(()=>{
 const today=localToday();
 if(today!==lastDay){lastDay=today;if(S.view==='consulta_preop'&&!document.querySelector('#modal .back'))renderConsult()}
},30000);
if(S.view==='consulta_preop')renderConsult();
})();