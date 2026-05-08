alter table public.founder_profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;

drop policy if exists founder_profiles_select_own on public.founder_profiles;
create policy founder_profiles_select_own
on public.founder_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists founder_profiles_update_own on public.founder_profiles;
create policy founder_profiles_update_own
on public.founder_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists workspace_memberships_select_own on public.workspace_memberships;
create policy workspace_memberships_select_own
on public.workspace_memberships
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member
on public.workspaces
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.workspace_memberships memberships
    where memberships.workspace_id = workspaces.id
      and memberships.user_id = auth.uid()
  )
);
