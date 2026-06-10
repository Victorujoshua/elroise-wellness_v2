-- Shifts (recurring weekly schedule template per practitioner)
create table public.shifts (
  id               uuid primary key default uuid_generate_v4(),
  practitioner_id  uuid not null references public.users(id) on delete cascade,
  day_of_week      int  not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  start_time       time not null,
  end_time         time not null,
  effective_from   date not null default current_date,
  effective_until  date,                                                 -- null = indefinite
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint shift_time_order check (start_time < end_time)
);

-- Shift overrides (one-off changes to a recurring shift)
create table public.shift_overrides (
  id               uuid primary key default uuid_generate_v4(),
  practitioner_id  uuid not null references public.users(id) on delete cascade,
  override_date    date not null,
  start_time       time,
  end_time         time,
  is_unavailable   boolean not null default false,
  reason           text,
  created_at       timestamptz not null default now(),
  constraint override_consistency check (
    is_unavailable = true
    or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

-- Time off (vacation, sick leave, multi-day blocks)
create table public.time_off (
  id               uuid primary key default uuid_generate_v4(),
  practitioner_id  uuid not null references public.users(id) on delete cascade,
  start_date       date not null,
  end_date         date not null,
  reason           text,
  created_at       timestamptz not null default now(),
  constraint time_off_date_order check (start_date <= end_date)
);

-- Appointments (credit_id FK added via alter below — circular with client_credits)
create table public.appointments (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.clients(id),
  service_id       uuid not null references public.services(id),
  practitioner_id  uuid not null references public.users(id),
  appointment_date date not null,
  start_time       time not null,
  end_time         time not null,
  status           text not null default 'pending'
                     check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes            text,
  source           text not null default 'web' check (source in ('web', 'admin', 'phone')),
  pricing_tier     text not null default 'single' check (pricing_tier in ('single', 'package')),
  credit_id        uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint appointment_time_order check (start_time < end_time)
);
create index idx_appointments_date              on public.appointments(appointment_date);
create index idx_appointments_practitioner_date on public.appointments(practitioner_id, appointment_date);

-- Client credits (purchase_appointment_id FK added via alter below — circular with appointments)
create table public.client_credits (
  id                       uuid primary key default uuid_generate_v4(),
  client_id                uuid not null references public.clients(id),
  service_id               uuid not null references public.services(id),
  sessions_purchased       int  not null check (sessions_purchased > 0),
  sessions_used            int  not null default 0 check (sessions_used >= 0),
  expires_at               date,
  purchase_appointment_id  uuid,
  created_at               timestamptz not null default now(),
  constraint credits_balance check (sessions_used <= sessions_purchased)
);

-- Resolve circular FK: appointments.credit_id → client_credits
alter table public.appointments
  add constraint appointments_credit_fkey
  foreign key (credit_id) references public.client_credits(id);

-- Resolve circular FK: client_credits.purchase_appointment_id → appointments
alter table public.client_credits
  add constraint credits_purchase_appointment_fkey
  foreign key (purchase_appointment_id) references public.appointments(id);

-- Payments (amount in kobo to match Paystack API; shop_order_id FK added via alter below)
create table public.payments (
  id                  uuid primary key default uuid_generate_v4(),
  appointment_id      uuid references public.appointments(id),
  shop_order_id       uuid,
  paystack_reference  text not null unique,
  amount_kobo         int  not null,
  status              text not null default 'pending',
  channel             text,
  verified_at         timestamptz,
  raw_response        jsonb,
  created_at          timestamptz not null default now()
);

-- Shop orders (total in kobo to match Paystack API)
create table public.shop_orders (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid references public.clients(id),
  items            jsonb not null,
  total_kobo       int  not null,
  shipping_address jsonb,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Resolve forward FK: payments.shop_order_id → shop_orders
alter table public.payments
  add constraint payments_shop_order_fkey
  foreign key (shop_order_id) references public.shop_orders(id);

-- Audit log
create table public.audit_log (
  id           uuid primary key default uuid_generate_v4(),
  actor_id     uuid references public.users(id),
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  changes      jsonb,
  created_at   timestamptz not null default now()
);

-- updated_at triggers (reuses update_timestamp() from 0001_foundation.sql)
create trigger shifts_updated before update on public.shifts
  for each row execute function update_timestamp();
create trigger appointments_updated before update on public.appointments
  for each row execute function update_timestamp();
create trigger shop_orders_updated before update on public.shop_orders
  for each row execute function update_timestamp();
