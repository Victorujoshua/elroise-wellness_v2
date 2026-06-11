# Elroisè Wellness — Work in Flight

> Updated after every session. Check this before starting any session.

## STATUS

**COMPLETE — Project live at elroisewellnesscenter.com as of 2026-06-11.**

Legacy Vite project paused on Vercel — **do not delete before 2026-07-25** (emergency rollback window).

Pending manual steps before signing off:
- [ ] Merge open PRs: week4/clients-and-observability → week4/analytics-and-docs → week4/polish → week4/cutover
- [ ] `supabase db push` all pending migrations (0006–0008)
- [ ] Create first admin user (see HANDOVER.md §5)
- [ ] Flip Paystack env vars to `pk_live_...` / `sk_live_...` in Vercel → redeploy
- [ ] Live transaction test + bypass test
- [ ] Domain cutover (screenshot existing DNS first — preserve MX records)
- [ ] Smoke test production domain
- [ ] Mark `booking_payment_completed` + `shop_checkout_completed` as conversions in GA4
- [ ] Pause legacy Vite project in Vercel (not delete)

---

## ROADMAP

Format: `[✓]` done · `[→]` in progress · `[ ]` pending · `[!]` blocked

### Week 1 — Foundation
- [✓] 1.1 Project docs (CLAUDE.md, BUILD.md, branch strategy)
- [✓] 1.2 Supabase project setup — migrations 0001–0003 written, project linked, push run
- [✓] 1.3 Auth — Supabase Auth, admin login, proxy guard, `@supabase/ssr` cookie client
- [✓] 1.4 App scaffold — route groups, layouts, Tailwind tokens, fonts, public components
- [✓] 1.5 Static public pages — Home, About, Refund Policy, Privacy, Terms
- [✓] 1.6 Services page — RSC reads from Supabase `services` table
- [✓] 1.7 Service detail pages — `/services/[slug]` SSG with ISR (revalidate 1h)
- [✓] 1.8 Contact page — form + server action + Loops integration

### Week 2 — Scheduling + Booking
- [✓] 2.1 Scheduling schema — migrations 0004 (9 tables) + 0005 (RLS lockdown)
- [✓] 2.2 Availability engine — `lib/availability.ts` (shift grid → filter conflicts → 30-min slots)
- [✓] 2.3 Public booking flow — `/book` — 5-step form (service → date → practitioner+slot → details → payment stub)
- [✓] 2.4 Shop checkout — `CheckoutModal` + Paystack inline popup + `verifyAndCreateShopOrder` server action
- [✓] 2.5 My Bookings lookup — `/my-bookings` — email lookup, upcoming + past cards, no-auth V1
- [✓] 2.6 Booking server action — `createAppointment` wired: Paystack verify → upsert client → appointment → payment → credits
- [✓] 2.7 Booking confirmation email — Loops transactional fired non-blocking from `createAppointment` (template env var: `LOOPS_BOOKING_CONFIRMATION_TEMPLATE_ID`)
- [✓] 2.8 Admin dashboard shell — `/admin` route group, sidebar, auth guard

### Week 3 — Admin Core
- [✓] 3.1 Services CRUD — admin create / edit / soft-delete services + practitioner assignment
- [✓] 3.2 Practitioners + practitioner_services — invite flow, who offers what
- [✓] 3.3 Shifts + shift_overrides + time_off — availability rules UI
- [✓] 3.4 Admin calendar — day/week view, appointment cards
- [✓] 3.5 Admin ADD booking — on behalf of client, Paystack optional
- [✓] 3.6 Clients CRUD — search, view history, manual notes

### Week 4 — Package Credits, Polish, Launch
- [✓] 4A. Clients section with detail page
        - Migration 0009 client_stats RPC
        - /admin/clients with lifetime stats columns
        - /admin/clients/[id] detail with appointments + credits + orders tabs
        - ClientDrawer disconnected from table (Phase 2: delete if unused after 60 days)

- [✓] 4B. Sentry + observability
        - Sentry client/server/edge configs
        - instrumentation.ts hook
        - Source maps uploaded via withSentryConfig

- [✓] 4C. GA4 analytics
        - Page view tracking
        - Booking conversion events
        - lib/analytics.ts helper

- [✓] 4D. Admin handover guide
        - docs/ADMIN_GUIDE.md
        - HANDOVER.md (11 sections covering stack, env vars, ops)

- [✓] 4.1. Appointments admin
        - /admin/appointments list with filters, search, CSV export
        - /admin/appointments/[id] detail with three columns
        - Status changes via StatusDialog
        - Reschedule via RescheduleDialog (shared availability engine,
          Calendar extracted from Step2Date with maxDays prop)
        - Refunds via RefundDialog (partial refunds supported, Loops
          notification, audit log)
        - Cancel without refund requires reason (CancelDialog)
        - Consolidated updateAppointmentStatus into
          appointments/actions.ts; calendar/actions.ts re-exports

- [✓] 4.5. Pre-cutover audit + remediation
        - docs/PROJECT_AUDIT_PRE_CUTOVER.md
        - M1 fixed (proxy.ts matcher gap — accept-invite excluded)
        - M2 in progress (merging week4/cutover via this PR)
        - M3 NEXT_PUBLIC_APP_URL set in Vercel — VERIFY
        - M4 migrations confirmed applied — VERIFIED
        - M5 first admin user created — VERIFIED
        - M6 Loops template smoke test — PENDING

DEFERRED to Phase 2:
- 4.2 Paystack webhook (async payment confirmation)
- Package credits flow (buy pack, ledger, apply at booking)
- email_send_log table for Loops observability
- Materialize client_stats if client count exceeds ~2000

PENDING (cutover sequence):
- [ ] 4.6 DNS cutover
      - Domain release from previous developer's Vercel account
      - Add elroisewellnesscenter.com to new Vercel project
      - Smoke test on production domain
      - Pause (don't delete) old Vite project in Vercel

---

## SCHEMA

> `[✓]` = migration written + pushed · `[~]` = migration written, push unconfirmed · `[ ]` = design only

### users `[~]` — `0001_foundation.sql`
```sql
id          uuid PK references auth.users(id) on delete cascade
full_name   text not null
phone       text
role        text not null  check ('owner' | 'staff' | 'practitioner')
is_active   boolean not null default true
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
```

### clients `[~]` — `0001_foundation.sql` + `0008_client_notes.sql`
```sql
id          uuid PK default uuid_generate_v4()
full_name   text not null
email       citext not null unique
phone       text not null
notes       text                   -- added 0008
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
```

### services `[~]` — `0001_foundation.sql`
```sql
id                    uuid PK default uuid_generate_v4()
name                  text not null
slug                  text not null unique
category              text not null  check ('pilates' | 'laser' | 'other')
description           text
duration_minutes      int not null
single_price_naira    int not null
package_price_naira   int            -- null = no package
package_session_count int            -- null = no package; must be > 0 if set
color_hex             text default '#C5A059'
is_active             boolean not null default true
sort_order            int not null default 0
created_at / updated_at
```

### practitioner_services `[~]` — `0001_foundation.sql`
```sql
practitioner_id  uuid FK → users  on delete cascade
service_id       uuid FK → services  on delete cascade
PRIMARY KEY (practitioner_id, service_id)
```

### shifts `[~]` — `0004_scheduling.sql`
```sql
id               uuid PK
practitioner_id  uuid FK → users  on delete cascade
day_of_week      int  check (0–6)   -- 0 = Sunday
start_time       time not null
end_time         time not null
effective_from   date not null default current_date
effective_until  date           -- null = indefinite
is_active        boolean not null default true
created_at / updated_at
-- constraint: start_time < end_time
```

### shift_overrides `[~]` — `0004_scheduling.sql`
```sql
id               uuid PK
practitioner_id  uuid FK → users  on delete cascade
override_date    date not null
start_time       time   -- null when is_unavailable = true
end_time         time
is_unavailable   boolean not null default false
reason           text
created_at
-- constraint: is_unavailable OR (start/end both set and start < end)
```

### time_off `[~]` — `0004_scheduling.sql`
```sql
id               uuid PK
practitioner_id  uuid FK → users  on delete cascade
start_date       date not null
end_date         date not null
reason           text
created_at
-- constraint: start_date <= end_date
```

### appointments `[~]` — `0004_scheduling.sql`
```sql
id               uuid PK
client_id        uuid FK → clients
service_id       uuid FK → services
practitioner_id  uuid FK → users
appointment_date date not null
start_time       time not null
end_time         time not null
status           text  check ('pending'|'confirmed'|'completed'|'cancelled'|'no_show')  default 'pending'
notes            text
source           text  check ('web'|'admin'|'phone')  default 'web'
pricing_tier     text  check ('single'|'package')  default 'single'
credit_id        uuid FK → client_credits  -- null for single-session bookings
created_at / updated_at
-- indexes: appointment_date, (practitioner_id, appointment_date)
```

### client_credits `[~]` — `0004_scheduling.sql`
```sql
id                       uuid PK
client_id                uuid FK → clients
service_id               uuid FK → services
sessions_purchased       int  check (> 0)
sessions_used            int  default 0  check (>= 0)
expires_at               date
purchase_appointment_id  uuid FK → appointments  -- circular, added via ALTER TABLE
created_at
-- constraint: sessions_used <= sessions_purchased
```

### payments `[~]` — `0004_scheduling.sql`
```sql
id                  uuid PK
appointment_id      uuid FK → appointments  nullable
shop_order_id       uuid FK → shop_orders   nullable  -- added via ALTER TABLE
paystack_reference  text not null unique
amount_kobo         int not null   -- Paystack unit; 1 naira = 100 kobo
status              text default 'pending'
channel             text
verified_at         timestamptz
raw_response        jsonb
created_at
```

### shop_orders `[~]` — `0004_scheduling.sql`
```sql
id               uuid PK
client_id        uuid FK → clients  nullable
items            jsonb not null   -- CartItem[] snapshot
total_kobo       int not null
shipping_address jsonb            -- ShippingAddress snapshot
status           text default 'pending'
created_at / updated_at
```

### audit_log `[~]` — `0004_scheduling.sql`
```sql
id           uuid PK
actor_id     uuid FK → users  nullable
action       text not null
entity_type  text not null
entity_id    uuid
changes      jsonb
created_at
```

### invitations `[~]` — `0007_invitations.sql`
```sql
id           uuid PK
email        text not null
full_name    text not null
role         text not null  check ('owner' | 'staff' | 'practitioner')
invited_by   uuid FK → users  on delete set null
token        text unique not null default gen_random_uuid()::text
accepted_at  timestamptz
created_at   timestamptz not null default now()
-- RLS: authenticated users can SELECT; all writes via service role
```

---

## KEY FILES

```
lib/availability.ts              Availability engine (service role key, 30-min grid)
lib/paystack.ts                  verifyPaystackPayment(reference) — server-only
lib/loops.ts                     sendTransactional / upsertContact
lib/cart.ts                      Zustand cart store (CartItem type)
lib/database.types.ts            Hand-written types for all 12 tables (0001–0005)
lib/supabase/server.ts           getSupabaseServerClient() — anon key, cached
                                 getSupabaseServiceClient() — service role, cached
                                 createAuthClient() — @supabase/ssr cookie client for auth

app/(public)/book/               5-step booking flow
  page.tsx                       RSC — fetches services, resolves ?service= slug
  BookingFlow.tsx                useReducer orchestrator, sticky progress bar
  actions.ts                     getAvailability + createAppointment server actions
  steps/Step1Service.tsx         Service selector cards
  steps/Step2Date.tsx            Custom calendar (no deps), 90-day window
  steps/Step3Slot.tsx            Practitioner + slot picker
  steps/Step4Details.tsx         react-hook-form + zod, pricing tier toggle
  steps/Step5Payment.tsx         Summary + Paystack popup → createAppointment → ConfirmationPanel

app/(public)/shop/actions.ts     verifyAndCreateShopOrder — full Paystack verify + DB writes
app/(public)/my-bookings/        Email lookup — pure RSC GET form, upcoming/past cards

components/public/CheckoutModal.tsx  Shop checkout — address form + Paystack inline popup
components/public/CartDrawer.tsx     Cart drawer — checkout now wired (was disabled)

lib/analytics.ts                 trackEvent(name, params?) — guards window/gtag; import in client components only

scripts/test-availability.ts     7-case integration test; run: npx tsx scripts/test-availability.ts
supabase/migrations/             0001–0009 written; 0001–0003 seeded 11 services
docs/ADMIN_GUIDE.md              Plain-language staff guide (login → calendar → ADD → status → refunds → shifts → services → team → troubleshooting)

proxy.ts                         Auth proxy (was middleware.ts) — guards /admin/* except /admin/login

app/(admin)/admin/
  login/page.tsx                 Branded login form (Playfair wordmark, gold focus ring)
  login/actions.ts               signIn() server action → redirect /admin/calendar
  (dashboard)/layout.tsx         Checks session + public.users.is_active; renders shell
  (dashboard)/page.tsx           Redirect → /admin/calendar
  (dashboard)/actions.ts         signOut() + getAppointmentDensity(year, month)
  (dashboard)/calendar/
    page.tsx                     RSC: parallel fetch (practitioners + appointments + services) → CalendarView
    actions.ts                   updateAppointmentStatus server action (+ audit log)
    adminBookingActions.ts       createAdminBooking: Paystack verify / cash / POS / none, atomic RPC
  (dashboard)/appointments/      Placeholder
  (dashboard)/shifts/            Placeholder
  (dashboard)/services/          Placeholder
  (dashboard)/clients/
    page.tsx                     RSC: ?q= + ?page= → paginated client list → ClientTable
    actions.ts                   updateClient (name/phone/notes) + getClientHistory (lazy)
  (dashboard)/team/
    page.tsx                     RSC: 4 parallel queries → passes to TeamTable
    actions.ts                   inviteTeamMember / editTeamMember / toggleMemberActive / revokeInvite
  (dashboard)/settings/          Placeholder
  accept-invite/[token]/
    page.tsx                     RSC: validates token, error cards, renders AcceptInviteForm
    AcceptInviteForm.tsx         Client form: name, email (disabled), password → acceptInvite
    actions.ts                   acceptInvite: createUser + public.users insert + compensating delete

components/admin/
  Sidebar.tsx                    Desktop rail + mobile Sheet; nav highlight; sign-out form
  MiniCalendar.tsx               shadcn Calendar + gold density dots; click → ?date= param
  TopBar.tsx                     Page title from pathname + user avatar chip
  services/
    serviceSchema.ts             Zod schema + ServiceFormData type + slugify() — shared server/client
    ServiceTable.tsx             Client table: search, category/status filters, active toggle, edit
    ServiceDialog.tsx            Add/edit dialog: full form, package conditional, practitioner checkboxes
  team/
    TeamTable.tsx                Active members table + pending invitations; role badges; inline toggles
    InviteDialog.tsx             Invite modal: name, email, role → inviteTeamMember
    EditMemberDialog.tsx         Edit modal: name, role, is_active, service checkboxes → editTeamMember
  calendar/
    CalendarView.tsx             Date nav bar + "Add booking" button + DayGrid + AddBookingSheet
    DayGrid.tsx                  07:00–21:00 grid, sticky practitioner headers, slot → AppointmentCard
    AppointmentCard.tsx          Absolute-positioned card + AppointmentDetail Dialog (status update)
    AddBookingSheet.tsx          3-step Sheet: details → slot → payment; exports ServiceOption type
  clients/
    ClientTable.tsx              Search form (router.push), paginated table, opens ClientDrawer
    ClientDrawer.tsx             Sheet: editable details (name/phone/notes) + lazy appointment history
```

---

## RLS MODEL (0002 + 0005)

| Role | Tables | Ops |
|---|---|---|
| anon | services, practitioner_services | SELECT |
| anon | shifts, shift_overrides, time_off | SELECT (availability engine reads) |
| authenticated | all scheduling tables | SELECT |
| any | clients, appointments, payments, shop_orders | NO direct INSERT/UPDATE/DELETE |
| service role | all tables | full bypass — used in all server actions |

All writes go through server actions or Edge Functions using `SUPABASE_SERVICE_ROLE_KEY`.

---

## DECISIONS LOG

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-05 | Rewrite, not migration | Zero prod users; scope grew beyond original site |
| 2026-06-05 | Stack: Next.js 16 + Supabase | Matches Victor's default stack; replaces inherited Vite |
| 2026-06-05 | Single app with route groups | Avoids managing two separate deployments |
| 2026-06-05 | Team + Practitioners unified (Model A) | Roles differentiate; everyone sees everything in V1 |
| 2026-06-05 | Package credits in V1 | Clients buy 5-session packs; credits tracked per service |
| 2026-06-05 | Client picks practitioner on public flow | Business requirement |
| 2026-06-05 | Admin can book on behalf of clients | ADD button; Paystack popup optional |
| 2026-06-05 | Prices stored as integer NGN | Avoids float precision; Paystack amounts stored as kobo separately |
| 2026-06-05 | services.category: pilates / laser / other | Covers both business lines; 'other' as escape hatch |
| 2026-06-05 | Explicit GRANTs in RLS migration | auto_expose_new_tables = false since 2026-05-30 |
| 2026-06-05 | shadcn toast → sonner | toast deprecated by shadcn |
| 2026-06-07 | No shadcn on public site | components/ui/ reserved for admin dashboard only; public uses custom Tailwind |
| 2026-06-07 | No auth on My Bookings V1 | Email-only lookup; cancel/reschedule deferred to Phase 2 |
| 2026-06-07 | Paystack script in public layout | Loaded once via next/script afterInteractive; available for both shop + future booking payment |
| 2026-06-07 | Loops email non-blocking in server actions | Order/booking creation must not fail due to email provider outage |
| 2026-06-07 | Hand-written DB types until push confirmed | supabase gen types typescript --linked blocked until migration list verified |
| 2026-06-07 | middleware.ts → proxy.ts | Next.js 16 deprecates middleware convention in favour of proxy |
| 2026-06-07 | Admin login outside (dashboard) route group | Prevents layout auth guard from blocking the login page itself |
| 2026-06-07 | is_active checked in layout, not proxy | Proxy checks session only (fast); layout does the DB lookup for active status |
| 2026-06-07 | shadcn calendar.tsx: table → month_grid | react-day-picker v10 renamed the table ClassNames key |
| 2026-06-07 | Json type exported from database.types.ts | Needed for audit_log.changes cast in server actions |
| 2026-06-07 | serviceSchema.ts has no 'use server'/'use client' — importable by both | Avoids schema duplication between server action and dialog form |
| 2026-06-08 | Loops booking email fires non-blocking; guarded by LOOPS_BOOKING_CONFIRMED_TEMPLATE_ID | Email provider outage must not fail booking creation |
| 2026-06-08 | payment row insert is non-fatal after appointment is confirmed | Appointment already created; non-fatal prevents double-charge panic |
| 2026-06-08 | Auto-refund only on slot conflict + inactive service; not on amount mismatch | Amount mismatch is likely fraud/tampering — needs manual review, not auto-refund |
| 2026-06-08 | create_appointment_atomic RPC wraps client upsert + appointment + credits | Prevents partial writes if credits insert fails after appointment is created |
| 2026-06-08 | Shop order checks payments table for duplicate reference before inserting | Prevents orphaned orders from double-submit; DB unique constraint is the final backstop |
| 2026-06-11 | GA4 via direct `gtag.js` Script, not `next/third-parties` | `next/third-parties` absent from Next.js 16.2.7 build; `next/script` afterInteractive achieves the same result |
| 2026-06-11 | trackEvent guards `typeof window.gtag !== 'function'` | Safe to import in any client component; no-ops on server, during SSR, or before script loads |
| 2026-06-11 | `booking_payment_completed` fires only after `createAppointment` server action succeeds | Avoids false conversion events for Paystack popups that succeed but whose server verification fails |

---

## CURRENT BRANCHES

| Branch | Purpose | Status |
|---|---|---|
| `master` | All work through Week 3 + base for Week 4 branches | Active base |
| `week4/clients-and-observability` | 4A Clients CRUD + 4B Sentry | PR open — merge first |
| `week4/analytics-and-docs` | 4C GA4 + 4D Admin Guide | PR open — merge second |
| `week4/polish` | WebP images, a11y, metadata | PR open — merge third |
| `week4/cutover` | Handover doc + final BUILD.md | PR open — merge last |

**Merge order:** clients-and-observability → analytics-and-docs → polish → cutover → main

---

## OPEN QUESTIONS

- [ ] Create first admin user — Supabase Dashboard → Auth → Add user, then SQL: `INSERT INTO public.users (id, full_name, role, is_active) VALUES ('<uuid>', 'Victor Joshua', 'owner', true);`
- [ ] Add `NEXT_PUBLIC_GA4_MEASUREMENT_ID` to Vercel env + `.env.local` — format: `G-XXXXXXXXXX`
- [ ] Mark `booking_payment_completed` and `shop_checkout_completed` as conversions in GA4 > Admin > Conversions
- [ ] Confirm `supabase db push` succeeded for 0004–0009 — run these in the SQL editor to verify:
  - `SELECT migration FROM supabase_migrations.schema_migrations ORDER BY migration;`
  - `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
  - `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;` (expect: create_appointment_atomic, get_clients_with_stats, update_timestamp)
- [ ] Regenerate types after confirmed push: `supabase gen types typescript --linked > lib/database.types.ts`
- [✓] All Loops template IDs set in `.env.local` — contact, booking confirmed, shop order, team invitation all wired
- [✓] Step 5 "Pay" button — Paystack popup wired, `createAppointment` server action writes all rows
- [✓] Supported payment methods for admin bookings: cash, POS, Paystack inline popup, "Record later" (none)
- [ ] Confirm slot interval: 30 min assumed throughout availability engine
- [ ] `LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID` defined in .env.local but not wired to any code — staff new-booking notification email never fires; wire or defer to Phase 2

---

## PHASE 2 BACKLOG

- Practitioner self-service login (filtered view — own appointments only)
- Cancel / reschedule from My Bookings (currently contact-us redirect)
- Waitlist
- Paystack webhook (`/api/paystack/webhook`) for async confirmation
- SMS notifications via Termii
- Privacy flag on appointments (hide client name on shared calendar)
- Loyalty / referral system
- Reports beyond basic CSV export

---

## ROLLBACK NOTES

- Migrations 0001–0005 written. If push is unconfirmed, re-run `supabase db push`.
- Once confirmed pushed: rollback individual migration via `supabase migration repair --status reverted <timestamp>` or manual `DROP TABLE` in Supabase dashboard SQL editor.
- No production users — safe to iterate on schema freely until launch.

---

## LAST UPDATED

2026-06-11 — Cutover day. Project complete. New app live at elroisewellnesscenter.com. Legacy Vite project paused (do not delete before 2026-07-25).
