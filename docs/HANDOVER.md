# Elroisè Wellness — Technical Handover

> Written at launch, June 2026. Keep this document next to the codebase.
> For ongoing admin tasks, see `docs/ADMIN_GUIDE.md`.

---

## 1. System Overview

Elroisè Wellness Center (Lagos) runs a scheduling platform built in 2026 to replace an inherited Vite marketing site. It serves two business lines: **Pilates** and **Laser Hair Removal**.

The system has two parts:
- **Public site** (`elroisewellnesscenter.com`) — marketing pages, service catalogue, online booking, grip-sock shop, contact form
- **Admin dashboard** (`elroisewellnesscenter.com/admin`) — appointment calendar, client directory, team management, service management, shift scheduling

All booking payments are processed through Paystack (NGN). Email notifications are sent through Loops. Errors are tracked with Sentry. Usage analytics are in GA4.

---

## 2. Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, React Server Components) | 16.2.7 |
| Language | TypeScript — strict mode | 5.x |
| Styling | Tailwind CSS v4 + shadcn/ui (admin only) | 4.x |
| Database + Auth | Supabase (Postgres, Supabase Auth, Row-Level Security) | JS SDK 2.x |
| Payments | Paystack — inline popup + server-side verification | REST API |
| Email | Loops — transactional email + audience | REST API |
| Error monitoring | Sentry | @sentry/nextjs v10 |
| Analytics | Google Analytics 4 | gtag.js |
| Hosting | Vercel (auto-deploy on push to `main`) | — |
| Image optimisation | Next.js Image + sharp (pre-converted WebP assets) | — |

---

## 3. Hosting

**Platform:** Vercel  
**Project name:** elroise (confirm in Vercel dashboard)  
**Production domain:** elroisewellnesscenter.com  
**Preview deployments:** every pull request gets its own URL automatically

### Vercel access
- Dashboard: https://vercel.com/dashboard
- Add team members: Vercel project → Settings → Members
- View deploy logs: Vercel project → Deployments

### Deploy process
Push to `main` → Vercel auto-builds and deploys within ~90 seconds. No manual deploy step needed. If a build fails, Vercel keeps the previous deployment live.

---

## 4. Environment Variables

All secrets are set in **Vercel → Project → Settings → Environment Variables**. Never hardcode these. Never commit `.env.local`.

### Public (browser-safe — `NEXT_PUBLIC_` prefix)

| Variable | Where | What it does |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Supabase anon key (public read RLS) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Vercel + `.env.local` | Paystack publishable key — use `pk_live_...` in production |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Vercel + `.env.local` | GA4 measurement ID (format: `G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel + `.env.local` | Sentry DSN for client-side error capture |

### Server-only (never sent to browser — no `NEXT_PUBLIC_` prefix)

| Variable | Where | What it does |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only | Supabase service role — bypasses RLS; all admin writes use this |
| `PAYSTACK_SECRET_KEY` | Vercel only | Paystack secret key — used for server-side payment verification |
| `LOOPS_API_KEY` | Vercel only | Loops API key for transactional email |
| `LOOPS_CONTACT_TEMPLATE_ID` | Vercel only | Loops template: contact form acknowledgement |
| `LOOPS_BOOKING_CONFIRMED_TEMPLATE_ID` | Vercel only | Loops template: booking confirmation to client |
| `LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID` | Vercel only | Loops template: new booking notification to staff (currently wired but not sent — Phase 2) |
| `LOOPS_SHOP_ORDER_TEMPLATE_ID` | Vercel only | Loops template: shop order confirmation |
| `LOOPS_TEAM_INVITATION_TEMPLATE_ID` | Vercel only | Loops template: team invite email |
| `LOOPS_BOOKING_RESCHEDULED_TEMPLATE_ID` | Vercel only | Loops template: reschedule notification (Phase 2) |
| `LOOPS_REFUND_PROCESSED_TEMPLATE_ID` | Vercel only | Loops template: refund notification (Phase 2) |
| `STAFF_NOTIFICATION_EMAIL` | Vercel only | Email address that receives staff new-booking notifications |
| `SENTRY_AUTH_TOKEN` | Vercel only | Sentry auth token for source map upload at build time |
| `SENTRY_ORG` | Vercel only | Sentry organisation slug |
| `SENTRY_PROJECT` | Vercel only | Sentry project slug |

### Switching Paystack from test to live

1. Log in to https://dashboard.paystack.com
2. Switch to **Live** mode
3. Copy `pk_live_...` and `sk_live_...`
4. In Vercel: Settings → Environment Variables → update both Paystack vars
5. Trigger a redeploy (push any commit, or Vercel → Deployments → Redeploy)

---

## 5. Database

**Provider:** Supabase  
**URL:** set in `NEXT_PUBLIC_SUPABASE_URL`

### Access
- Dashboard: https://supabase.com/dashboard
- Add team members: Supabase project → Settings → Team

### Tables (12 total)

| Table | Purpose |
|---|---|
| `users` | Admin/staff accounts (owner, staff, practitioner) |
| `clients` | Public booking clients (name, email, phone, notes) |
| `services` | Service catalogue (Pilates classes, laser treatments) |
| `practitioner_services` | Which practitioner offers which service |
| `shifts` | Weekly recurring availability per practitioner |
| `shift_overrides` | One-off availability changes |
| `time_off` | Date-range blocks (holidays, leave) |
| `appointments` | All bookings — status, timing, pricing tier, credit link |
| `client_credits` | Package credit ledger (sessions purchased vs used) |
| `payments` | Paystack transactions linked to appointments or shop orders |
| `shop_orders` | Grip-sock orders with shipping address |
| `audit_log` | Admin action history |
| `invitations` | Pending team invites |

### Migrations
All migrations are in `supabase/migrations/`. Applied in order:

| File | Contents |
|---|---|
| `0001_foundation.sql` | users, clients, services, practitioner_services + GRANTs |
| `0002_rls_foundation.sql` | RLS policies for foundation tables |
| `0003_seed_services.sql` | 11 seeded services (Pilates + Laser) |
| `0004_scheduling.sql` | All scheduling tables + `create_appointment_atomic` RPC |
| `0005_rls_scheduling.sql` | RLS policies for scheduling tables |
| `0006_booking_constraints.sql` | Additional constraints on appointments |
| `0007_invitations.sql` | Invitations table |
| `0008_client_notes.sql` | Adds `notes` column to `clients` |

To apply migrations: `supabase db push` (requires Supabase CLI, project linked).

### Adding a new admin user

1. Supabase Dashboard → Authentication → Users → **Add user** (set email + password)
2. Copy the new user's UUID
3. Supabase Dashboard → Table Editor → `users` → Insert row:
   ```
   id:        <uuid from step 2>
   full_name: First Last
   role:      owner   (or staff / practitioner)
   is_active: true
   ```

---

## 6. Deployment

### Normal flow
```
git push origin main
```
Vercel picks up the push and deploys automatically. Build takes ~60–90 seconds. Preview URL is shown in the Vercel dashboard.

### Rollback
Vercel → Deployments → find the previous good deployment → **Promote to Production**.

### Emergency rollback to legacy Vite project
The old Vite project is **paused** on Vercel (do not delete before 2026-07-25). To restore:
1. Vercel → legacy project → Settings → Resume Deployments
2. Vercel → legacy project → Domains → add elroisewellnesscenter.com
3. Remove the domain from the new project

---

## 7. Common Operations

### Invite a team member
Admin dashboard → Team → **Invite** button. Fill name, email, role. They receive a Loops email with a setup link valid 48 hours. They land on `/admin/accept-invite/[token]` to set their password.

### Add or edit a service type
Admin dashboard → Services → **Add Service** (or click a row to edit). Fields: name, category (Pilates / Laser / Other), duration, single price, optional package price + session count, sort order. Toggle **Active** to show/hide on the public booking page.

### Update prices
Admin dashboard → Services → click the service → edit `single_price_naira` (and `package_price_naira` if applicable). Changes take effect immediately — existing appointments are not retroactively updated.

### Manage practitioner shifts
Admin dashboard → Team → click a practitioner → edit their shifts. Shifts are recurring weekly schedules. Use **Shift Overrides** for one-off changes. Use **Time Off** for multi-day blocks.

### Issue a refund
Paystack dashboard (https://dashboard.paystack.com) → Transactions → find the transaction → **Initiate Refund**. Then update the appointment status to `cancelled` in the admin calendar. Loops refund email (`LOOPS_REFUND_PROCESSED_TEMPLATE_ID`) is ready to wire — currently Phase 2.

### Export bookings to CSV
Admin dashboard → Calendar → use the export button (if implemented). Alternatively: Supabase Dashboard → Table Editor → `appointments` → Export as CSV. Join with `clients` and `services` tables as needed.

### Reschedule an appointment
Admin dashboard → Calendar → click the appointment → **Edit**. Change the date/time and save. The client is not automatically notified (Phase 2 — `LOOPS_BOOKING_RESCHEDULED_TEMPLATE_ID` is ready to wire).

---

## 8. Monitoring

### Sentry (errors)
- Dashboard: https://sentry.io
- Organisation: set in `SENTRY_ORG` env var
- Project: set in `SENTRY_PROJECT` env var
- Alerts fire on new issues. Set up a Slack or email alert rule in the Sentry dashboard.
- Client errors, server errors, and edge runtime errors are all captured.

### Google Analytics 4 (usage)
- Dashboard: https://analytics.google.com
- Measurement ID: `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- Custom events tracked: `service_view`, `booking_form_started`, `booking_payment_initiated`, `booking_payment_completed` (**conversion**), `shop_add_to_cart`, `shop_checkout_completed` (**conversion**), `contact_form_submitted`
- GA4 only loads in production (`NODE_ENV === 'production'`)

### Uptime
No dedicated uptime monitor is configured. Recommended: add a Vercel integration for Better Uptime or UptimeRobot pointing at `https://elroisewellnesscenter.com/api/health`.

---

## 9. Known Issues and Phase 2 Backlog

### Known gaps at launch
- Staff new-booking notification email (`LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID`) is defined but not wired — staff must check the calendar manually for new bookings.
- Reschedule and refund Loops emails are defined (`LOOPS_BOOKING_RESCHEDULED_TEMPLATE_ID`, `LOOPS_REFUND_PROCESSED_TEMPLATE_ID`) but not wired — these operations require manual emails.
- No Paystack webhook (`/api/paystack/webhook`) — payment status is confirmed inline only; async failures require manual Paystack dashboard check.
- Package credits UI is admin-only in V1 — clients cannot purchase a pack from the public site.
- Cancel / reschedule from My Bookings is a "contact us" redirect — no self-service yet.

### Phase 2 backlog
- Paystack webhook for async payment confirmation
- Client self-service cancel / reschedule from `/my-bookings`
- Practitioner self-service portal (own appointments only)
- Staff new-booking notification email
- Reschedule + refund confirmation emails
- SMS notifications via Termii
- Package purchase from public booking flow
- Waitlist for fully-booked slots
- Loyalty / referral system
- Enhanced admin reports and CSV export
- Privacy flag on appointments (hide client name on shared calendar)

---

## 10. Third-Party Contacts

| Service | Purpose | URL |
|---|---|---|
| Supabase | Database + Auth | https://supabase.com/dashboard |
| Vercel | Hosting + CI/CD | https://vercel.com/dashboard |
| Paystack | Payment processing | https://dashboard.paystack.com |
| Loops | Transactional email | https://app.loops.so |
| Sentry | Error monitoring | https://sentry.io |
| Google Analytics | Usage analytics | https://analytics.google.com |
| Domain registrar | DNS management | _(update with actual registrar URL)_ |

For Paystack disputes or refund escalations: support@paystack.com  
For Supabase billing or limits: https://supabase.com/dashboard → project → Settings → Billing

---

## 11. Repository

**GitHub:** https://github.com/Victorujoshua/elroise-wellness_v2  
**Main branch:** `main` (protected — all work via PRs)  
**Working branch:** `master` (development base; merge to `main` at launch)

### Key files
```
CLAUDE.md                  Developer instructions for AI-assisted work
BUILD.md                   Project history, schema reference, decisions log
docs/ADMIN_GUIDE.md        Plain-language staff operations guide
docs/HANDOVER.md           This document

app/(public)/              Public-facing routes (home, services, book, shop, etc.)
app/(admin)/admin/         Admin dashboard routes (calendar, clients, team, etc.)
components/public/         Public UI components
components/admin/          Admin UI components
components/ui/             shadcn primitives (admin only)
lib/                       Shared utilities (Supabase clients, Paystack, Loops, availability engine)
supabase/migrations/       Database migrations (0001–0008)
```

---

*Handover document prepared 2026-06-11. Contact victorujoshua@gmail.com for questions.*
