-- Migração aditiva: não altera nem apaga cirurgias ou mapa.
create table if not exists public.supervision_referrals (
  id uuid primary key default gen_random_uuid(),
  surgery_id uuid not null references public.surgeries(id),
  origin_stage public.workflow_stage not null,
  destination text not null check (destination in ('supervisao','avaliacao_enfermeiro')),
  reason text not null check (length(btrim(reason)) > 0),
  status text not null default 'aguardando' check(status in ('aguardando','respondido')),
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  resolution text,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  return_stage public.workflow_stage,
  constraint referral_resolution_consistency check (
    (status='aguardando' and resolved_at is null and resolved_by is null)
    or (status='respondido' and resolved_at is not null and resolved_by is not null and nullif(btrim(resolution),'') is not null and return_stage is not null)
  )
);
create index if not exists supervision_referrals_surgery_idx on public.supervision_referrals(surgery_id,created_at desc);
create index if not exists supervision_referrals_pending_idx on public.supervision_referrals(destination,status,created_at);
alter table public.supervision_referrals enable row level security;
create policy "Equipe aprovada visualiza encaminhamentos" on public.supervision_referrals
for select to authenticated using (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.approved=true)
);
create policy "Equipe aprovada registra encaminhamentos" on public.supervision_referrals
for insert to authenticated with check (
 created_by=(select auth.uid()) and status='aguardando' and resolution is null and resolved_at is null
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.approved=true)
);
-- Resolução feita em transação; não libera UPDATE direto dos encaminhamentos.
create or replace function public.resolve_supervision_referral(
 p_referral_id uuid, p_resolution text, p_return_stage public.workflow_stage
) returns void language plpgsql security invoker set search_path=public as $$
declare r public.supervision_referrals%rowtype; v_role public.app_role;
begin
 select role into v_role from public.profiles where id=auth.uid() and approved=true;
 if v_role is null or v_role::text not in ('admin','enfermeiro','gestao') then
   raise exception 'Perfil sem permissão para resolver encaminhamento';
 end if;
 if nullif(btrim(p_resolution),'') is null then raise exception 'Resposta obrigatória'; end if;
 select * into r from public.supervision_referrals where id=p_referral_id and status='aguardando' for update;
 if not found then raise exception 'Encaminhamento indisponível ou já respondido'; end if;
 update public.surgeries set stage=p_return_stage, updated_at=now(), updated_by=auth.uid()
 where id=r.surgery_id;
 if not found then raise exception 'Cirurgia não encontrada'; end if;
 update public.supervision_referrals set status='respondido', resolution=btrim(p_resolution),
 resolved_by=auth.uid(), resolved_at=now(),return_stage=p_return_stage where id=r.id;
end; $$;
-- A função usa privilégios da pessoa autenticada (security invoker), obedecendo RLS.
create policy "Equipe clínica pode concluir encaminhamentos" on public.supervision_referrals
for update to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.approved=true and p.role::text in ('admin','enfermeiro','gestao')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.approved=true and p.role::text in ('admin','enfermeiro','gestao')));
grant select,insert,update on public.supervision_referrals to authenticated;
grant execute on function public.resolve_supervision_referral(uuid,text,public.workflow_stage) to authenticated;
