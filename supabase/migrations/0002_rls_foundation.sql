-- Enable RLS on all foundation tables
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.practitioner_services enable row level security;

-- Explicit grants required: auto_expose_new_tables defaulted to false
-- on the Supabase cloud on 2026-05-30. Without these, PostgREST returns
-- 404 for anon/authenticated even with RLS policies in place.
grant usage on schema public to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select on public.users to authenticated;
grant select on public.clients to authenticated;
grant select on public.practitioner_services to authenticated;

-- services: anonymous users may read active services only
create policy "anon_read_active_services"
  on public.services for select
  to anon
  using (is_active = true);

-- authenticated: full read on all four tables
create policy "auth_read_services"
  on public.services for select
  to authenticated
  using (true);

create policy "auth_read_users"
  on public.users for select
  to authenticated
  using (true);

create policy "auth_read_clients"
  on public.clients for select
  to authenticated
  using (true);

create policy "auth_read_practitioner_services"
  on public.practitioner_services for select
  to authenticated
  using (true);

-- No INSERT / UPDATE / DELETE policies are created for any role.
-- All writes go through server actions or Edge Functions using the
-- service role key, which bypasses RLS entirely. Client-side writes
-- are blocked by the absence of permissive policies.
