-- Enable RLS on all new tables
alter table public.shifts          enable row level security;
alter table public.shift_overrides enable row level security;
alter table public.time_off        enable row level security;
alter table public.appointments    enable row level security;
alter table public.client_credits  enable row level security;
alter table public.payments        enable row level security;
alter table public.shop_orders     enable row level security;
alter table public.audit_log       enable row level security;

-- Grants (auto_expose_new_tables = false since 2026-05-30)
-- anon: read-only access to availability tables only
grant select on public.shifts          to anon, authenticated;
grant select on public.shift_overrides to anon, authenticated;
grant select on public.time_off        to anon, authenticated;
-- authenticated: admin dashboard reads
grant select on public.appointments    to authenticated;
grant select on public.client_credits  to authenticated;
grant select on public.payments        to authenticated;
grant select on public.shop_orders     to authenticated;
grant select on public.audit_log       to authenticated;

-- anon: availability data (shifts, overrides, time_off for slot calculation)
create policy "anon_read_active_shifts"
  on public.shifts for select to anon
  using (is_active = true);

create policy "anon_read_shift_overrides"
  on public.shift_overrides for select to anon
  using (true);

create policy "anon_read_time_off"
  on public.time_off for select to anon
  using (true);

-- authenticated: full read on all scheduling tables (admin dashboard)
create policy "auth_read_shifts"
  on public.shifts for select to authenticated using (true);

create policy "auth_read_shift_overrides"
  on public.shift_overrides for select to authenticated using (true);

create policy "auth_read_time_off"
  on public.time_off for select to authenticated using (true);

create policy "auth_read_appointments"
  on public.appointments for select to authenticated using (true);

create policy "auth_read_client_credits"
  on public.client_credits for select to authenticated using (true);

create policy "auth_read_payments"
  on public.payments for select to authenticated using (true);

create policy "auth_read_shop_orders"
  on public.shop_orders for select to authenticated using (true);

create policy "auth_read_audit_log"
  on public.audit_log for select to authenticated using (true);

-- No INSERT/UPDATE/DELETE policies for any role.
-- All writes go through server actions or Edge Functions using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely.
