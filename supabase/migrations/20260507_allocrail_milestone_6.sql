create table if not exists public.founder_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  owner_user_id uuid references public.founder_profiles(user_id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_memberships (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.founder_profiles(user_id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

alter table public.allocation_rules
  add column if not exists created_by_user_id uuid references public.founder_profiles(user_id) on delete set null,
  add column if not exists updated_by_user_id uuid references public.founder_profiles(user_id) on delete set null;

alter table public.payout_intents
  add column if not exists approved_by_user_id uuid references public.founder_profiles(user_id) on delete set null,
  add column if not exists approved_by_name text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by_user_id uuid references public.founder_profiles(user_id) on delete set null,
  add column if not exists rejected_by_name text,
  add column if not exists rejected_at timestamptz;

create or replace function public.handle_founder_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  derived_full_name text;
begin
  derived_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if derived_full_name is null then
    derived_full_name := regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[._-]+', ' ', 'g');
  end if;
  if derived_full_name is null or derived_full_name = '' then
    derived_full_name := 'Founder';
  end if;

  insert into public.founder_profiles (user_id, email, full_name)
  values (new.id, coalesce(new.email, ''), derived_full_name)
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists auth_users_founder_profile_sync on auth.users;
create trigger auth_users_founder_profile_sync
after insert or update on auth.users
for each row execute function public.handle_founder_profile_sync();

drop trigger if exists founder_profiles_set_updated_at on public.founder_profiles;
create trigger founder_profiles_set_updated_at
before update on public.founder_profiles
for each row execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

insert into public.founder_profiles (user_id, email, full_name)
select
  id,
  coalesce(email, ''),
  coalesce(
    nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(regexp_replace(split_part(coalesce(email, ''), '@', 1), '[._-]+', ' ', 'g'), ''),
    'Founder'
  )
from auth.users
on conflict (user_id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = timezone('utc', now());

insert into public.workspaces (id, name, owner_user_id)
select
  'wrk_allocrail_demo',
  'AllocRail Demo Workspace',
  fp.user_id
from public.founder_profiles fp
order by fp.created_at asc
limit 1
on conflict (id) do nothing;

insert into public.workspace_memberships (workspace_id, user_id, role)
select 'wrk_allocrail_demo', fp.user_id, 'owner'
from public.founder_profiles fp
on conflict (workspace_id, user_id) do nothing;

update public.allocation_rules
set
  created_by_user_id = coalesce(created_by_user_id, owner_user_id),
  updated_by_user_id = coalesce(updated_by_user_id, owner_user_id)
from (
  select owner_user_id from public.workspaces where id = 'wrk_allocrail_demo'
) workspace_owner
where allocation_rules.workspace_id = 'wrk_allocrail_demo';
