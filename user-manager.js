/* Gerenciador de usuários — disponível somente para administradores autenticados. */
(function(){
'use strict';
const ROLES={visualizador:'Visualizador',nir:'Operador / NIR',tecnico_enfermagem:'Técnico de enfermagem',enfermeiro:'Enfermeiro',medico:'Médico',gestao:'Gestão',admin:'Administrador'};
const isAdmin=()=>S.profile?.approved===true&&S.profile?.role==='admin';
const safe=v=>esc(v??'');
const oldTabs=renderTabs;
renderTabs=function(){oldTabs();if(isAdmin()){const tabs=document.getElementById('tabs');if(tabs&&!document.getElementById('adminUsersTab'))tabs.insertAdjacentHTML('beforeend','<button id="adminUsersTab" class="tab" onclick="openUserManager()">🔐 Gerenciador de Usuários</button>')}};
window.openUserManager=async function(){
if(!isAdmin())return alert('Acesso restrito ao administrador.');
S.view='gerenciador_usuarios';
document.querySelectorAll('.tab').forEach(e=>e.classList.remove('on'));
document.getElementById('adminUsersTab')?.classList.add('on');
document.getElementById('content').innerHTML='<section class="card"><h2>🔐 Gerenciador de Usuários</h2><p>Carregando contas...</p></section>';
await refreshUserManager();
};
const originalCurrent=renderCurrent;
renderCurrent=function(){if(S.view==='gerenciador_usuarios')return refreshUserManager();return originalCurrent()};
window.refreshUserManager=async function(){
if(!isAdmin())return;
const area=document.getElementById('content');
try{
const users=await api('/rest/v1/profiles?select=id,full_name,role,approved,created_at&order=created_at.desc');
area.innerHTML='<section class="card"><div class="section-head"><div><h2>🔐 Gerenciador de Usuários</h2><p class="sub">Apenas administradores podem aprovar e alterar perfis. As mudanças não afetam a fila cirúrgica.</p></div><button class="btn" onclick="refreshUserManager()">↻ Atualizar</button></div><div class="notice">Para criar uma nova conta, a pessoa deve clicar em <b>Criar acesso</b> na tela inicial do aplicativo e preencher seu próprio e-mail e senha. Depois, aprove o cadastro aqui. Nunca compartilhe senhas.</div><div class="tablewrap"><table class="table" style="min-width:760px"><thead><tr><th>USUÁRIO</th><th>PERFIL</th><th>ACESSO</th><th>AÇÕES</th></tr></thead><tbody>'+users.map(u=>'<tr><td><b>'+safe(u.full_name||'Nome não informado')+'</b><div class="sub">'+safe(u.id)+'</div></td><td><select id="role_'+u.id+'" '+(u.id===uid?'disabled title="Seu próprio perfil não pode ser alterado aqui"':'')+'>'+Object.entries(ROLES).map(([k,v])=>'<option value="'+k+'" '+(u.role===k?'selected':'')+'>'+v+'</option>').join('')+'</select></td><td><span class="pill '+(u.approved?'ok':'warn')+'">'+(u.approved?'Aprovado':'Aguardando')+'</span></td><td><div class="acts">'+(u.id===uid?'<span class="sub">Conta administradora atual</span>':'<button class="btn small" onclick="saveUserAccess(\''+u.id+'\','+(u.approved?'true':'false')+')">Salvar perfil</button><button class="btn '+(u.approved?'orange':'green')+' small" onclick="changeUserApproval(\''+u.id+'\','+(!u.approved)+')">'+(u.approved?'Desativar acesso':'Aprovar acesso')+'</button>')+'</div></td></tr>').join('')+'</tbody></table></div><p class="sub">A alteração de perfil pode exigir que o usuário saia e entre novamente.</p></section>';
}catch(e){area.innerHTML='<section class="card"><h2>Gerenciador de Usuários</h2><p class="err">'+safe(e.message)+'</p><button class="btn" onclick="refreshUserManager()">Tentar novamente</button></section>';}
};
window.saveUserAccess=async function(id,approved){
if(!isAdmin()||id===uid)return alert('Operação não permitida.');
const role=document.getElementById('role_'+id)?.value;
if(!ROLES[role])return;
if(role==='admin'&&!confirm('Conceder acesso ADMINISTRADOR? Este perfil pode gerenciar outros usuários e todas as permissões.'))return;
try{await api('/rest/v1/profiles?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({role})});await refreshUserManager();alert('Perfil atualizado com sucesso.')}catch(e){alert('Não foi possível atualizar: '+e.message);}
};
window.changeUserApproval=async function(id,approved){
if(!isAdmin()||id===uid)return alert('Operação não permitida.');
if(!confirm(approved?'Aprovar o acesso deste usuário?':'Desativar o acesso deste usuário?'))return;
try{await api('/rest/v1/profiles?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({approved})});await refreshUserManager();alert(approved?'Acesso aprovado.':'Acesso desativado.')}catch(e){alert('Não foi possível alterar o acesso: '+e.message);}
};
if(isAdmin() && S.view !== 'gerenciador_usuarios') renderTabs();
})();