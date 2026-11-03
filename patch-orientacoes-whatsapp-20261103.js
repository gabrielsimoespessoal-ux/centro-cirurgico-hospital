(()=>{
if(window.__hsjOrientacoesWhatsApp20261103)return;
window.__hsjOrientacoesWhatsApp20261103=true;
const ASSETS={
 acompanhantes:{url:'/orientacoes/acompanhantes.svg',name:'HSJ_ORIENTACOES_ACOMPANHANTES.png',label:'Orientações para acompanhantes'},
 manha:{url:'/orientacoes/urologia-manha.svg',name:'HSJ_UROLOGIA_MANHA.png',label:'Urologia — manhã'},
 tarde:{url:'/orientacoes/urologia-tarde.svg',name:'HSJ_UROLOGIA_TARDE.png',label:'Urologia — tarde'}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function selected(id){
 const x=S.rows.find(r=>String(r.id)===String(id));
 if(!x)return [];
 const files=['acompanhantes'];
 if(normal(x.specialty).includes('UROLOG')){
   const time=document.getElementById('ac_time')?.value||'';
   if(/^\d{2}:\d{2}$/.test(time))files.push(Number(time.slice(0,2))<12?'manha':'tarde');
 }
 return files;
}
async function pngBlob(which){
 const asset=ASSETS[which];if(!asset)throw Error('Orientação não encontrada.');
 const response=await fetch(asset.url,{cache:'no-store'});
 if(!response.ok)throw Error('Arquivo de orientação indisponível: '+response.status);
 const svg=await response.text();
 const image=new Image();
 const src=window.URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
 try{
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Falha ao renderizar imagem.'));image.src=src;});
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  canvas.getContext('2d').drawImage(image,0,0);
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível gerar PNG.')),'image/png'));
 }finally{window.URL.revokeObjectURL(src);}
}
function download(blob,name){
 const url=window.URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>window.URL.revokeObjectURL(url),10000);
}
window.hsjBaixarOrientacaoWhatsApp=async which=>{
 try{download(await pngBlob(which),ASSETS[which].name)}
 catch(err){alert('Não foi possível baixar a imagem: '+err.message);}
};
window.hsjCompartilharOrientacaoWhatsApp=async which=>{
 try{
  const asset=ASSETS[which],blob=await pngBlob(which);
  const file=new File([blob],asset.name,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
    await navigator.share({files:[file],title:asset.label});
  }else{
    download(blob,asset.name);
    alert('A imagem PNG foi baixada. Abra a conversa do paciente pelo botão WhatsApp e anexe o arquivo manualmente.');
  }
 }catch(err){if(err.name!=='AbortError')alert('Não foi possível compartilhar: '+err.message);}
};
function renderGuide(id){
 const modal=document.getElementById('modal');
 const mb=modal?.querySelector('.modal .mb');if(!mb)return;
 let area=modal.querySelector('#hsj-orientacoes-anexos');
 if(!area){area=document.createElement('section');area.id='hsj-orientacoes-anexos';area.style.cssText='margin-top:16px;padding:15px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc';mb.appendChild(area);}
 const x=S.rows.find(r=>String(r.id)===String(id));
 const isUro=normal(x?.specialty).includes('UROLOG');
 const time=document.getElementById('ac_time')?.value||'';
 const files=selected(id);
 const intro='<h3 style="margin:0 0 8px">🖼️ Orientações em imagens para WhatsApp</h3><p style="margin:0 0 10px">Todas as especialidades recebem a orientação de acompanhantes. Urologia recebe também a orientação do período da cirurgia.</p>';
 const warning=isUro&&!/^\d{2}:\d{2}$/.test(time)?'<p style="color:#9a3412"><b>Informe o horário da cirurgia</b> para escolher Urologia manhã ou tarde.</p>':'';
 const items=files.map(k=>'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:9px 0"><strong style="min-width:180px">'+esc(ASSETS[k].label)+'</strong><button type="button" class="btn small" onclick="hsjBaixarOrientacaoWhatsApp(\''+k+'\')">⬇ Baixar PNG</button><button type="button" class="btn small" onclick="hsjCompartilharOrientacaoWhatsApp(\''+k+'\')">Compartilhar imagem</button></div>').join('');
 area.innerHTML=intro+warning+items+'<p style="font-size:12px;margin-top:10px"><b>Importante:</b> no WhatsApp Web, anexe manualmente os PNGs baixados na conversa do paciente. Compartilhamento direto depende das funções do dispositivo ou de uma integração oficial de WhatsApp Business API. Não marque como enviado sem confirmar na conversa.</p><p style="font-size:12px;color:#a33">As orientações de suspensão de medicamentos reproduzem o material fornecido pelo hospital; valide-as com a equipe médica antes de encaminhar.</p>';
}
const previous=window.hsjAgendaSurgery;
if(typeof previous!=='function')return;
window.hsjAgendaSurgery=async function(id){
 const response=await previous.apply(this,arguments);
 renderGuide(id);
 const time=document.getElementById('ac_time');
 if(time)time.addEventListener('change',()=>renderGuide(id));
 return response;
};
})();