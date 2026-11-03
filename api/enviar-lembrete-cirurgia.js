// WhatsApp Business Cloud API - server only. Never expose the access token to the browser.
const SUPABASE_URL='https://uulsxmdycbihwkbftcdv.supabase.co';
const SUPABASE_ANON='sb_publishable_odmXzemIQZwx1BxrJiUYnQ_iZfPVHlV';
const required=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_MEDIA_ACOMPANHANTES','WHATSAPP_MEDIA_UROLOGIA_MANHA','WHATSAPP_MEDIA_UROLOGIA_TARDE'];
const ready=()=>required.every(k=>!!process.env[k]);
function json(res,status,body){res.status(status).setHeader('Cache-Control','no-store').json(body)}
function brPhone(s){let d=String(s||'').replace(/\D/g,'');if(d.startsWith('55')&&[12,13].includes(d.length))d=d.slice(2);return [10,11].includes(d.length)?'55'+d:null}
function isoDate(s){let m=String(s||'').slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:'Não informada'}
async function db(path,token){const r=await fetch(SUPABASE_URL+path,{headers:{apikey:SUPABASE_ANON,Authorization:'Bearer '+token}});if(!r.ok)throw Object.assign(new Error('Consulta autorizada ao cadastro falhou.'),{status:403});return r.json()}
async function send(to,payload){
 const r=await fetch('https://graph.facebook.com/v22.0/'+encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID)+'/messages',{
  method:'POST',headers:{Authorization:'Bearer '+process.env.WHATSAPP_ACCESS_TOKEN,'Content-Type':'application/json'},
  body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to,...payload})
 });
 const x=await r.json().catch(()=>({}));
 if(!r.ok||!x.messages?.[0]?.id)throw new Error('API WhatsApp recusou uma mensagem ('+r.status+').');
 return x.messages[0].id;
}
export default async function handler(req,res){
 if(req.method==='GET')return json(res,200,{configured:ready()});
 if(req.method!=='POST')return json(res,405,{error:'Método não permitido'});
 if(!ready())return json(res,503,{error:'Integração automática ainda não configurada no servidor. Nenhuma mensagem enviada.'});
 const bearer=String(req.headers.authorization||'').match(/^Bearer (.+)$/i)?.[1];
 if(!bearer)return json(res,401,{error:'Sessão obrigatória'});
 try{
  const auth=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_ANON,Authorization:'Bearer '+bearer}});
  if(!auth.ok)return json(res,401,{error:'Sessão inválida ou expirada'});
  const user=await auth.json();if(!user?.id)return json(res,401,{error:'Usuário não identificado'});
  const id=String(req.body?.surgeryId||'');
  if(!/^[0-9a-f-]{36}$/i.test(id))return json(res,400,{error:'Identificador de cirurgia inválido'});
  const [patients,appointments]=await Promise.all([
   db('/rest/v1/surgeries?id=eq.'+encodeURIComponent(id)+'&select=id,patient_name,phone,specialty,procedure_name,stage',bearer),
   db('/rest/v1/surgery_appointment_details?surgery_id=eq.'+encodeURIComponent(id)+'&select=scheduled_date,scheduled_time,arrival_time,location,instructions,scheduled_by_name',bearer)
  ]);
  const p=patients?.[0],a=appointments?.[0];
  if(!p||!a||!a.scheduled_date||!a.scheduled_time)return json(res,409,{error:'Agendamento confirmado não encontrado; não foi enviado.'});
  const to=brPhone(p.phone);if(!to)return json(res,400,{error:'WhatsApp do paciente inválido'});
  const time=String(a.scheduled_time).slice(0,5),uro=String(p.specialty||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().includes('UROLOG');
  if(uro&&!/^\d{2}:\d{2}$/.test(time))return json(res,409,{error:'Horário da Urologia ausente; não foi enviado.'});
  const selected=[['WHATSAPP_MEDIA_ACOMPANHANTES','Orientações para acompanhantes']];
  if(uro)selected.push(Number(time.slice(0,2))<12?['WHATSAPP_MEDIA_UROLOGIA_MANHA','Urologia - manhã']:['WHATSAPP_MEDIA_UROLOGIA_TARDE','Urologia - tarde']);
  const body='Olá, '+String(p.patient_name||'')+'!\nAqui é do Setor de Marcação de Cirurgia do Hospital São José.\n\nConfirmamos seu agendamento cirúrgico:\nProcedimento: '+String(p.procedure_name||'Conforme orientação médica')+'\nData: '+isoDate(a.scheduled_date)+'\nHorário: '+time+'\nChegada: '+String(a.arrival_time||'Conforme orientação da equipe')+'\nLocal: '+String(a.location||'Hospital São José')+'\n\nOrientações: '+String(a.instructions||'Conforme equipe assistencial')+'\nResponsável: '+String(a.scheduled_by_name||'Equipe de agendamento')+'\nPor favor, confirme o recebimento. As imagens de orientação seguem nesta conversa.';
  // Each WhatsApp media message has its own API response; no atomic multi-message transaction exists.
  const sent=[];
  try{
   sent.push(await send(to,{type:'text',text:{body}}));
   for(const [env,label] of selected)sent.push(await send(to,{type:'image',image:{id:process.env[env],caption:label}}));
   return json(res,200,{sent:true,count:sent.length,messageIds:sent});
  }catch(e){return json(res,502,{sent:false,partial:sent.length>0,acceptedMessages:sent.length,error:'O envio foi interrompido. Confira a conversa antes de tentar novamente; uma parte pode ter sido enviada.'})}
 }catch(e){return json(res,e.status||500,{error:e.status===403?'Acesso negado ao cadastro; nenhuma mensagem enviada.':'Falha ao processar a solicitação. Verifique as configurações.'})}
}
