-- 0007_invitations.sql
-- Team invite flow: admin sends invite → token emailed → recipient sets password.

create table public.invitations (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  full_name   text not null,
  role        text not null check (role in ('owner', 'staff', 'practitioner')),
  invited_by  uuid references public.users(id) on delete set null,
  token       text not null unique default gen_random_uuid()::text,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.invitations enable row level security;

grant select on public.invitations to authenticated;

create policy "auth_read_invitations"
  on public.invitations for select to authenticated
  using (true);
