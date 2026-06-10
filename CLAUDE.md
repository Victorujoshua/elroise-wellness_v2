# Elroisè Wellness — Project Context

> Standing context, read every session. For work in flight, see `BUILD.md`.

## 1. PROJECT

Elroisè Wellness Center (Lagos). Premium Pilates studio + Laser Hair Removal clinic.
Fresh-build scheduling platform replacing an inherited Vite project (zero production users).
**Goal:** client-facing booking site + admin dashboard — shifts, appointments,
practitioners, clients, services, package pricing.

## 2. STACK

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 (App Router, RSC, server actions) ¹ |
| Language | TypeScript — strict mode |
| Styling | Tailwind CSS v4 + shadcn/ui (admin) |
| Database / Auth | Supabase — Postgres, Auth, Edge Functions, Storage |
| Payments | Paystack — client popup + server-side verify |
| Email | Loops — transactional + audience |
| Observability | Sentry + GA4 (Week 4) |
| Hosting | Vercel |

¹ Scaffolded at v16 / React 19 (original plan said v14 — App Router APIs are
forward-compatible). ⚠ Next.js 16 has breaking changes vs training data.
Before writing any code, check `node_modules/next/dist/docs/` and heed
deprecation notices.

## 3. ARCHITECTURE

- Single app, two route groups: `(public)` and `(admin)`
- Admin operations: server actions or Edge Functions using the Supabase **service role**
- Public reads of services/availability: server components (cached) or server actions
- Public reads of bookings: forbidden — RLS enforces this
- Edge Functions: only for things server actions can't handle (cron, webhooks)

## 4. WORKING STYLE (non-negotiable)

1. **Read first.** Always check relevant files before proposing anything.
2. **Propose a plan** listing every file to create or modify. Wait for approval.
3. **Feature branch per step** — never commit directly to `main`.
4. **PR for every change** — Vercel preview deploys give per-PR QA.
5. **Run `npm run build`** after every change to catch type errors early.
6. **Surgical edits** — do not refactor unrelated code.
7. **Flag new dependencies** before adding them.
8. **When in doubt, ask.** A question costs nothing; a wrong guess is expensive.

## 5. BRAND & STYLE

**Public site** — matches inherited Vite app:
- Gold `#C5A059` · Charcoal `#2D2926` · Sand `#F3EFEA` · BG `#F9F6F2`
- Playfair Display (display) + Montserrat (body)

**Admin dashboard** — internal-tool aesthetic:
- Same gold `#C5A059` as primary accent; Inter or system-ui body
- shadcn/ui defaults; high contrast, dense, scan-friendly

## 6. CRITICAL CONSTRAINTS

- Env vars only — never hardcode credentials
- `NEXT_PUBLIC_*` for browser-safe values; no prefix for server-only secrets
- Always verify Paystack payments server-side — never trust client-side success
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Never use `mode: 'no-cors'` for POSTs whose result matters
- All admin writes via server actions or Edge Functions — no direct anon-key writes
- TypeScript strict mode stays on — no `any` without justification

## 7. DOMAIN MODEL (V1)

Live schema in `BUILD.md`. Tables:

`users` · `services` · `practitioner_services` · `shifts` · `shift_overrides` ·
`time_off` · `clients` · `appointments` · `client_credits` · `payments` ·
`shop_orders` · `audit_log` · `invitations`

## 8. KEY FILES & FOLDERS

```
app/(public)/          Marketing + booking flows
app/(admin)/admin/     Admin dashboard
components/ui/         shadcn primitives
components/public/     Hero, service card, etc.
components/admin/      Admin-only components
lib/supabase/          Client and server Supabase factories
lib/availability.ts    Practitioner availability calculation
lib/paystack.ts        Paystack server-side helpers
lib/loops.ts           Loops API helpers
db/schema.sql          Schema reference (source of truth)
supabase/migrations/   Migration files
supabase/functions/    Edge Functions
BUILD.md               Work in flight — check here first
docs/                  Audits and reference docs
```

## 9. COMMANDS

```bash
npm run dev
npm run build
npm run lint
supabase db push
supabase functions deploy <name>
```

## 10. ENV VARS (keys only — values in `.env.local`, never committed)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY
LOOPS_API_KEY
LOOPS_CONTACT_TEMPLATE_ID
LOOPS_BOOKING_CONFIRMED_TEMPLATE_ID
LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID
LOOPS_SHOP_ORDER_TEMPLATE_ID
LOOPS_TEAM_INVITATION_TEMPLATE_ID
LOOPS_BOOKING_RESCHEDULED_TEMPLATE_ID
LOOPS_REFUND_PROCESSED_TEMPLATE_ID
STAFF_NOTIFICATION_EMAIL
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
NEXT_PUBLIC_GA4_MEASUREMENT_ID
```
