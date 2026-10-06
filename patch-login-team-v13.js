(()=>{
  const box=document.querySelector('.loginbox');
  if(!box || document.getElementById('teamSignupBtn')) return;

  const emailField=document.getElementById('loginEmail')?.closest('.field');
  if(emailField && !document.getElementById('teamFullName')){
    const f=document.createElement('div');
    f.className='field';
    f.innerHTML='<label>Nome completo</label><input id="teamFullName" type="text" placeholder="Nome do profissional">';
    box.insertBefore(f,emailField);
  }

  const loginBtn=[...box.querySelectorAll('button')].find(b=>b.textContent.trim()==='Entrar');
  if(loginBtn){
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
    loginBtn.parentNode.insertBefore(wrap,loginBtn);
    wrap.appendChild(loginBtn);
    const signup=document.createElement('button');
    signup.id='teamSignupBtn';
    signup.className='btn';
    signup.textContent='Criar acesso';
    signup.onclick=window.signupTeamV13;
    wrap.appendChild(signup);
  }

  const msg=document.getElementById('loginMsg');
  if(msg && !msg.textContent.trim()) msg.textContent='Novos membros da equipe podem criar o acesso aqui. Após o cadastro, o administrador deve aprovar o usuário.';
})();

window.signupTeamV13=async function(){
  const name=(document.getElementById('teamFullName')?.value||'').trim();
  const email=(document.getElementById('loginEmail')?.value||'').trim();
  const password=document.getElementById('loginPass')?.value||'';
  const msg=document.getElementById('loginMsg');
  if(!name||!email||!password){if(msg)msg.textContent='Preencha nome completo, e-mail e senha.';return;}
  if(password.length<6){if(msg)msg.textContent='A senha precisa ter pelo menos 6 caracteres.';return;}
  if(msg)msg.textContent='Criando acesso...';
  try{
    const r=await fetch(URL+'/auth/v1/signup',{
      method:'POST',
      headers:{apikey:KEY,'Content-Type':'application/json'},
      body:JSON.stringify({email,password,data:{full_name:name}})
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error_description||j.msg||j.message||j.error||('Erro HTTP '+r.status));
    if(msg)msg.textContent='Cadastro criado. Este usuário ficará aguardando aprovação do administrador antes de acessar o sistema.';
    document.getElementById('loginPass').value='';
  }catch(e){if(msg)msg.textContent=e.message||'Não foi possível criar o acesso.';}
};
