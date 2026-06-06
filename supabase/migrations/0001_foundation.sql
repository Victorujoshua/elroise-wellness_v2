-- Extensions
create extension if not exists citext;
create extension if not exists "uuid-ossp";

-- Users (Team) — augments auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('owner', 'staff', 'practitioner')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clients
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email citext not null unique,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Service Types (appointment types with tiered pricing)
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  category text not null check (category in ('pilates', 'laser', 'other')),
  description text,
  duration_minutes int not null,
  single_price_naira int not null,
  package_price_naira int,
  package_session_count int,
  color_hex text default '#C5A059',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint package_consistency check (
    (package_price_naira is null and package_session_count is null)
    or (package_price_naira is not null and package_session_count > 0)
  )
);

-- Which practitioners can perform which services
create table public.practitioner_services (
  practitioner_id uuid not null references public.users(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (practitioner_id, service_id)
);

-- updated_at triggers
create or replace function update_timestamp() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger users_updated before update on public.users
  for each row execute function update_timestamp();
create trigger clients_updated before update on public.clients
  for each row execute function update_timestamp();
create trigger services_updated before update on public.services
  for each row execute function update_timestamp();
