# Elroisè Wellness — Work in Flight

> Updated daily. Check this before starting any session.

## STATUS

Week 1, Day 2 — static public pages complete; Services page written (Supabase-backed RSC); seed migration ready; all 3 migrations blocked on `supabase login` + `supabase link`

---

## ROADMAP

Format: `[✓]` done · `[→]` in progress · `[ ]` pending · `[!]` blocked

### Week 1 — Foundation
- [✓] 1.1 Project docs (CLAUDE.md, BUILD.md, branch strategy)
- [!] 1.2 Supabase project setup + initial schema migration — 3 migrations written (0001 foundation, 0002 RLS, 0003 seed), push blocked on `supabase login` + `supabase link`
- [ ] 1.3 Auth — Supabase Auth, admin login, email invitations (magic links)
- [✓] 1.4 App scaffold — route groups, layouts, Tailwind tokens, fonts, public components
- [✓] 1.5 Static public pages — Home, About, Refund Policy, Privacy, Terms (build clean)
- [✓] 1.6 Services page — RSC reads from Supabase `services` table; build clean
- [✓] 1.7 Service detail pages — `/services/[slug]` SSG with ISR (revalidate 1h); practitioners section wired up but hidden until migration 0004 adds anon-read policy on `users`
- [✓] 1.8 Contact page — form + server action + Loops integration; build clean

### Week 2 — Admin Core
- [ ] 2.1 Services CRUD (name, duration, single price, package price, color)
- [ ] 2.2 Practitioners + practitioner_services (who offers what)
- [ ] 2.3 Shifts + shift_overrides + time_off (availability rules)
- [ ] 2.4 Availability engine (`lib/availability.ts`)
- [ ] 2.5 Clients CRUD
- [ ] 2.6 Admin calendar + ADD booking (Paystack popup optional)

### Week 3 — Public Booking Flow
- [ ] 3.1 Public site shell (brand, fonts, global layout)
- [ ] 3.2 Services listing
- [ ] 3.3 Booking flow — service → practitioner → slot → client details
- [ ] 3.4 Paystack popup + server-side verify + payment record
- [ ] 3.5 Booking confirmation + Loops transactional email

### Week 4 — Package Credits, Polish, Launch
- [ ] 4.1 Package credits — buy pack, credit ledger, apply at booking
- [ ] 4.2 Sentry + GA4 instrumentation
- [ ] 4.3 Admin export / basic reports
- [ ] 4.4 QA pass — golden path + edge cases
- [ ] 4.5 Vercel production deploy + DNS cutover

> ⚠ Roadmap is a working skeleton. Update steps when Rev 3 plan is confirmed.

---

## SCHEMA

> ✓ = migration written (pending push) · ○ = design target only, not yet in a migration

### users ✓ — `0001_foundation.sql`
```sql
id          uuid PK references auth.users(id) on delete cascade
full_name   text not null
phone       text
role        text not null  check ('owner' | 'staff' | 'practitioner')
is_active   boolean not null default true
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
-- email lives in auth.users, not duplicated here
```

### clients ✓ — `0001_foundation.sql`
```sql
id          uuid PK default uuid_generate_v4()
full_name   text not null
email       citext not null unique
phone       text not null
created_at  timestamptz not null default now()
updated_at  timestamptz not null default now()
```

### services ✓ — `0001_foundation.sql`
```sql
id                    uuid PK default uuid_generate_v4()
name                  text not null
slug                  text not null unique
category              text not null  check ('pilates' | 'laser' | 'other')
description           text
duration_minutes      int not null
single_price_naira    int not null   -- stored as kobo-free integer NGN
package_price_naira   int            -- null = no package
package_session_count int            -- null = no package; must be > 0 if set
color_hex             text default '#C5A059'
is_active             boolean not null default true
sort_order            int not null default 0
created_at            timestamptz not null default now()
updated_at            timestamptz not null default now()
-- constraint: package_price_naira and package_session_count must both be null or both be set
```

### practitioner_services ✓ — `0001_foundation.sql`
```sql
practitioner_id  uuid FK → users  on delete cascade
service_id       uuid FK → services  on delete cascade
PRIMARY KEY (practitioner_id, service_id)
```

### shifts ○ — pending migration
```sql
id               uuid PK
practitioner_id  uuid FK → users
day_of_week      int not null  -- 0 = Sunday
start_time       time not null
end_time         time not null
```

### shift_overrides ○ — pending migration
```sql
id               uuid PK
practitioner_id  uuid FK → users
date             date not null
start_time       time   -- null = full day off
end_time         time
is_off           boolean not null default false
```

### time_off ○ — pending migration
```sql
id               uuid PK
practitioner_id  uuid FK → users
start_date       date not null
end_date         date not null
note             text
```

### appointments ○ — pending migration
```sql
id               uuid PK
client_id        uuid FK → clients
practitioner_id  uuid FK → users
service_id       uuid FK → services
starts_at        timestamptz not null
ends_at          timestamptz not null
status           text  -- 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
paid_via         text  -- 'paystack' | 'credits' | 'cash' | 'pos'
payment_id       uuid FK → payments nullable
notes            text
created_by       uuid FK → users nullable  -- set for admin-created bookings
created_at       timestamptz not null default now()
```

### client_credits ○ — pending migration
```sql
id          uuid PK
client_id   uuid FK → clients
service_id  uuid FK → services
remaining   int not null default 0
updated_at  timestamptz not null default now()
```

### payments ○ — pending migration
```sql
id          uuid PK
client_id   uuid FK → clients
amount      int not null    -- NGN, integer (consistent with services pricing)
currency    text default 'NGN'
provider    text default 'paystack'
reference   text unique not null
status      text  -- 'pending' | 'verified' | 'failed'
metadata    jsonb
created_at  timestamptz not null default now()
```

### shop_orders ○ — pending migration
```sql
id          uuid PK
client_id   uuid FK → clients
items       jsonb not null
total       int not null    -- NGN, integer
status      text
payment_id  uuid FK → payments nullable
created_at  timestamptz not null default now()
```

### audit_log ○ — pending migration
```sql
id          uuid PK
actor_id    uuid FK → users
action      text not null
table_name  text not null
record_id   uuid
old_data    jsonb
new_data    jsonb
created_at  timestamptz not null default now()
```

### invitations ○ — pending migration
```sql
id           uuid PK
email        text not null
role         text not null
invited_by   uuid FK → users
token        text unique not null
accepted_at  timestamptz
created_at   timestamptz not null default now()
```

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
| 2026-06-05 | Calendar block colors per service type | Admin assigns color when creating service |
| 2026-06-05 | Team invitations via magic links | Supabase Auth handles the flow |
| 2026-06-05 | Practitioner self-service login → Phase 2 | Out of V1 scope |
| 2026-06-05 | Waitlist → Phase 2 | Out of V1 scope |
| 2026-06-05 | Prices stored as integer NGN (not decimal) | Avoids float precision issues; no sub-naira amounts needed |
| 2026-06-05 | services.category enum: pilates / laser / other | Covers both business lines; 'other' as escape hatch |
| 2026-06-05 | Explicit GRANTs in RLS migration | Supabase auto_expose_new_tables defaulted to false 2026-05-30; grants required for PostgREST access |
| 2026-06-05 | shadcn toast → sonner | toast deprecated by shadcn; sonner is the current replacement |

---

## CURRENT BRANCHES

| Branch | Purpose | PR | Status |
|---|---|---|---|
| `setup/docs` | CLAUDE.md + BUILD.md | — | complete, uncommitted |
| `week1/schema-foundation` | Foundation migrations (0001, 0002) | — | blocked — needs `supabase login` + `supabase link` |
| `week1/public-static-pages` | Home, About, Refund Policy, Privacy, Terms | — | build clean, uncommitted |
| `week1/services-page` | Services RSC + seed migration (0003) + DB types + Supabase server client | — | build clean; blocked on DB push |
| `week1/service-detail` | `/services/[slug]` — SSG detail page, pricing card, practitioners section | — | build clean; blocked on DB push |
| `week1/contact-page` | Contact page, form, server action, `lib/loops.ts`, Toaster | — | build clean; needs LOOPS_API_KEY + LOOPS_CONTACT_TEMPLATE_ID + STAFF_NOTIFICATION_EMAIL in .env.local |

---

## OPEN QUESTIONS

- [ ] Rev 3 build plan not yet shared — roadmap steps need validation
- [ ] What products go in `shop_orders`? (laser aftercare, retail items?)
- [ ] Confirm appointment slot granularity (15 min? 30 min?)
- [ ] Confirm supported payment methods for admin-created bookings (cash, POS, Paystack?)
- [ ] `.env.local` must be created with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` before Services page renders live data
- [ ] `.env.local` also needs `LOOPS_API_KEY`, `LOOPS_CONTACT_TEMPLATE_ID`, `STAFF_NOTIFICATION_EMAIL` for contact form to submit

---

## PHASE 2 BACKLOG

- Practitioner self-service login (filtered view — own appointments only)
- Waitlist
- Privacy flag on appointments (hide client name on shared calendar view)
- SMS notifications via Termii
- Loyalty / referral system
- Reports beyond basic CSV export

---

## ROLLBACK NOTES

- Migrations 0001, 0002, 0003 written but not yet pushed to remote — no rollback needed yet.
- Once pushed: rollback via `supabase migration repair` or manual `drop table` / `delete from` in the Supabase dashboard.

---

## LAST UPDATED

2026-06-06
