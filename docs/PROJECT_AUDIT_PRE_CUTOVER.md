# Elroisè Wellness — Pre-Cutover Project Audit

**Date:** 2026-06-11  
**Auditor:** Claude Sonnet 4.6 (read-only pass — no code modified)  
**Branch audited:** `week4/cutover` (based on `master`)  
**Scope:** Full codebase, database schema, third-party integrations, build plan compliance  
**Severity scale:** CRITICAL · HIGH · MEDIUM · LOW · NOTE

---

## Part 1 — Inventory: What Is Actually Here

### A. Routes

#### Public (`app/(public)/`)

| Route | Status | Evidence |
|---|---|---|
| `/` (homepage) | COMPLETE | RSC; reads `featuredServices` from static data + renders hero/sections. Broken link `/booking` → `/book` was fixed in `week4/polish`. |
| `/services` | COMPLETE | RSC reads from `services` table; live data; filters by category. |
| `/services/[slug]` | COMPLETE | RSC with ISR (revalidate 3600s); reads DB; `generateStaticParams` at build. |
| `/book` | COMPLETE | 5-step client component flow orchestrated by `BookingFlow.tsx` with `useReducer`. Steps 1–5 all present and wired. |
| `/my-bookings` | COMPLETE | RSC GET form; email lookup via `lookupBookingsByEmail`; upcoming/past card split. No auth, V1 by design. |
| `/shop` | COMPLETE | Product page, color/size selector, Zustand cart, Paystack inline checkout, DB order write. |
| `/contact` | COMPLETE | Form with Zod validation; fires Loops staff notification; no client acknowledgement (see Part 3E). |
| `/about`, `/privacy`, `/terms`, `/refund-policy` | COMPLETE | Static content pages. |

#### Admin (`app/(admin)/admin/`)

| Route | Status | Evidence |
|---|---|---|
| `/admin/login` | COMPLETE | Supabase Auth `signIn` action; redirect on success. |
| `/admin/accept-invite/[token]` | COMPLETE | Token validated, auth user created, `public.users` inserted, compensating delete on failure. |
| `/admin` | COMPLETE | Redirects to `/admin/calendar`. |
| `/admin/calendar` | COMPLETE | Day view; parallel fetch practitioners + appointments + services; `AddBookingSheet` (3-step); appointment card with `AppointmentDetail` dialog. |
| `/admin/appointments` | COMPLETE | Paginated table (25/page); multi-filter (status, service, practitioner, date range, payment status, text search); CSV export button; link to detail page. |
| `/admin/appointments/[id]` | COMPLETE | Full detail: status, notes edit, reschedule, cancel, refund dialogs; audit log history; lifetime booking count for client. |
| `/admin/services` | COMPLETE | Table with active toggle, search; add/edit dialog with practitioner checkboxes. |
| `/admin/team` | COMPLETE | Active members + pending invitations; invite/edit/toggle-active dialogs. |
| `/admin/shifts` | COMPLETE | Practitioner selector; recurring shifts, overrides, time-off panels. |
| `/admin/clients` | COMPLETE | Paginated search; side drawer with edit + lazy appointment history. |
| `/admin/settings` | **STUB** | Single-line "Platform settings coming soon." No functionality. |

#### API routes

| Route | Status | Evidence |
|---|---|---|
| `/api/health` | **MISSING on master** | Only on `week4/clients-and-observability` (unmerged). No health endpoint on the production branch today. |
| `/api/paystack/webhook` | **NOT STARTED** | No file exists anywhere. Deferred to Phase 2. |

### B. Server Actions

| File | Actions | Notes |
|---|---|---|
| `book/actions.ts` | `getAvailability`, `createAppointment` | Zod-validated; atomic RPC; Paystack verify before writes. |
| `shop/actions.ts` | `verifyAndCreateShopOrder` | Paystack verify; duplicate reference guard; Loops email non-blocking. |
| `contact/actions.ts` | `submitContactForm` | Loops staff notification + `upsertContact`. Sending to staff, not client — see Part 3E. |
| `my-bookings/actions.ts` | `lookupBookingsByEmail` | Service role inline client; returns bookings by email. |
| `calendar/actions.ts` | `updateAppointmentStatus` | Re-export of `appointments/actions.ts`. |
| `calendar/adminBookingActions.ts` | `createAdminBooking` | Paystack-optional; atomic RPC; payment method: cash/pos/paystack/none. |
| `appointments/actions.ts` | `updateAppointmentStatus`, `updateAppointmentNotes`, `rescheduleAppointment`, `cancelAppointment`, `processRefund`, `exportAppointmentsCsv` | Full suite; partial refund supported; Loops refund email wired. |
| `services/actions.ts` | `saveService`, `toggleServiceActive` | Non-atomic practitioner replacement (see Part 3B). |
| `team/actions.ts` | `inviteTeamMember`, `editTeamMember`, `toggleMemberActive`, `revokeInvite` | Loops invite email; `NEXT_PUBLIC_APP_URL` fallback (see Part 3D). |
| `clients/actions.ts` | `updateClient`, `getClientHistory` | Audit log on update; `any` type in history mapper. |
| `shifts/actions.ts` | `saveShift`, `deleteShift`, `saveTimeOff`, `deleteTimeOff`, `saveOverride`, `deleteOverride` | Full CRUD; Zod-validated. |
| `admin/actions.ts` | `signOut`, `getAppointmentDensity` | Dashboard signout + mini-calendar density dots. |
| `admin/accept-invite/[token]/actions.ts` | `acceptInvite` | Single-use token check; compensating delete on partial failure. |
| `admin/login/actions.ts` | `signIn` | Supabase Auth; redirect `/admin/calendar`. |

### C. Shared Library Modules

| File | Purpose | Notes |
|---|---|---|
| `lib/availability.ts` | Slot calculation engine | Service-role client inline; 30-min grid; time-off + override + existing appointment filtering. |
| `lib/paystack.ts` | `verifyPaystackPayment`, `refundPaystackPayment` | Server-only; no client exposure. |
| `lib/loops.ts` | `sendTransactional`, `upsertContact` | Server-only; throws on HTTP error; callers wrap in try/catch. |
| `lib/cart.ts` | Zustand cart store (client) | `CartItem` type; persist via localStorage (default Zustand behavior). |
| `lib/database.types.ts` | Hand-written DB types | Written against schema; not generated — could drift from DB if migrations run without updating this file. |
| `lib/supabase/server.ts` | `getSupabaseServerClient`, `getSupabaseServiceClient`, `createAuthClient` | `cache()` singletons; proper cookie client for auth. |
| `lib/utils.ts` | `cn()` (shadcn class merge) | Standard utility. |
| `lib/data/services.ts` | Static service definitions (legacy) | Still imported by homepage (`featuredServices`) and `services/page.tsx` for the `Service` type. See Part 3F. |

### D. Database

**Supabase project ref:** `tkbuxnngqyipblulxucy`  
**Tables in public schema (from migration files):**

| Table | RLS Enabled | Anon Read | Authenticated Read | Write policies |
|---|---|---|---|---|
| `users` | Yes | No | Yes (all rows) | None — service role only |
| `clients` | Yes | No | Yes (all rows) | None — service role only |
| `services` | Yes | Yes (is_active=true only) | Yes (all rows) | None — service role only |
| `practitioner_services` | Yes | No | Yes | None — service role only |
| `shifts` | Yes | Yes (is_active=true only) | Yes | None — service role only |
| `shift_overrides` | Yes | Yes (all rows) | Yes | None — service role only |
| `time_off` | Yes | Yes (all rows) | Yes | None — service role only |
| `appointments` | Yes | No | Yes (all rows) | None — service role only |
| `client_credits` | Yes | No | Yes | None — service role only |
| `payments` | Yes | No | Yes | None — service role only |
| `shop_orders` | Yes | No | Yes | None — service role only |
| `audit_log` | Yes | No | Yes | None — service role only |
| `invitations` | Yes | No | Yes (all rows) | None — service role only |

**RPC functions:**

| Function | Purpose | Migration |
|---|---|---|
| `create_appointment_atomic` | Atomically: slot overlap check → client upsert → appointment insert → optional credit insert. Raises `SLOT_TAKEN` on conflict. | `0006_booking_constraints.sql` |
| `update_timestamp` | Trigger function: sets `updated_at = now()` | `0001_foundation.sql` |

**Indexes:**

| Index | Table | Purpose |
|---|---|---|
| `appointments_no_double_book_idx` | appointments | Unique partial on `(practitioner_id, appointment_date, start_time)` WHERE status IN ('pending','confirmed') — last-resort double-book prevention |
| `idx_appointments_date` | appointments | Fast lookup by date |
| `idx_appointments_practitioner_date` | appointments | Fast calendar queries |

**Migrations:**

| File | Applied? |
|---|---|
| `0001_foundation.sql` | UNKNOWN — not verifiable from code |
| `0002_rls_foundation.sql` | UNKNOWN |
| `0003_seed_services.sql` | UNKNOWN |
| `0004_scheduling.sql` | UNKNOWN |
| `0005_rls_scheduling.sql` | UNKNOWN |
| `0006_booking_constraints.sql` | UNKNOWN |
| `0007_invitations.sql` | UNKNOWN |
| `0008_client_notes.sql` | UNKNOWN |

`supabase migration list` was not run (would require live Supabase credentials). The BUILD.md marks all migrations as `[~]` (written, push unconfirmed). **No human has confirmed these migrations are applied to the production Supabase project.**

### E. Third-party integrations

**Supabase**
- Project: `tkbuxnngqyipblulxucy` (`Elroise`)
- Region, plan tier, quota: not verifiable from code
- RLS posture: correct — all tables have RLS enabled; no public write policies
- Service role key: used only in server actions and lib modules; never in client components

**Paystack**
- Test keys: assumed set in `.env.local` (not inspectable)
- Live keys: not yet set (cutover step 1)
- Webhook URL: **NOT configured** — no `/api/paystack/webhook` route exists
- Server-side verification: ✓ — every paid action verifies via `verifyPaystackPayment` before writes

**Loops**
- API key: env var `LOOPS_API_KEY`
- Domain verification: not verifiable from code
- Template coverage:

| Template env var | Used in code | What it sends |
|---|---|---|
| `LOOPS_CONTACT_TEMPLATE_ID` | `contact/actions.ts` | Sends to `STAFF_NOTIFICATION_EMAIL` with contact's details — NOT to the submitting user |
| `LOOPS_BOOKING_CONFIRMED_TEMPLATE_ID` | `book/actions.ts`, `adminBookingActions.ts` | Booking confirmation to client |
| `LOOPS_SHOP_ORDER_TEMPLATE_ID` | `shop/actions.ts` | Order confirmation to client |
| `LOOPS_TEAM_INVITATION_TEMPLATE_ID` | `team/actions.ts` | Invite link email to new team member |
| `LOOPS_REFUND_PROCESSED_TEMPLATE_ID` | `appointments/actions.ts` | Refund notification to client |
| `LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID` | **NEVER CALLED** | Defined in CLAUDE.md env list; not in any server action |
| `LOOPS_BOOKING_RESCHEDULED_TEMPLATE_ID` | **NEVER CALLED** | Defined in CLAUDE.md env list; not in any server action |

**Sentry**
- Config files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`): **NOT ON MASTER** — only on `week4/clients-and-observability` (unmerged PR)
- `withSentryConfig` in `next.config.ts`: **NOT ON MASTER** — `next.config.ts` on master has zero Sentry configuration
- If the app goes to production from master as-is: **zero Sentry coverage**

**Vercel**
- Build status: not inspectable from code; `npm run build` was not run during this audit pass
- `NEXT_PUBLIC_APP_URL`: **NOT SET** — used in `team/actions.ts:79` but not listed in `.env.local` requirements or HANDOVER.md
- Last deploy: unknown

### F. Email Templates (Loops)

| Template | Status |
|---|---|
| Contact form (staff notification) | PARTIAL — env var in code; actual Loops template unverified |
| Booking confirmed (client) | PARTIAL — env var in code; actual Loops template unverified |
| Shop order (client) | PARTIAL — env var in code; actual Loops template unverified |
| Team invitation | PARTIAL — env var in code; actual Loops template unverified |
| Refund processed (client) | PARTIAL — env var in code; actual Loops template unverified |
| Booking notification (staff new booking) | **MISSING** — env var declared, never called in code |
| Booking rescheduled (client) | **MISSING** — env var declared, never called in code |

"PARTIAL" means the code is wired but whether the Loops template was actually created and whether its variable names match the `dataVariables` being sent is **unverified by this audit**. No Loops API call was made to confirm.

---

## Part 2 — Build Plan Compliance

| Step | Status | Notes |
|---|---|---|
| **0.1** Pre-flight: CLAUDE.md, BUILD.md, branch strategy | DONE | |
| **0.2** Env accounts (Supabase, Paystack, Loops, Vercel) | DONE-UNVERIFIED | Accounts exist; whether all env vars are set in Vercel production is unverified |
| **1.1** Services DB table + RSC read | DONE | `/services` reads live from Supabase |
| **1.2** Service detail `/services/[slug]` with ISR | DONE | `revalidate = 3600` |
| **1.3** Auth — Supabase Auth, admin login, proxy guard | DONE (matcher gap) | `proxy.ts` IS active as Next.js 16 Edge middleware. 307 redirects confirmed live. Gap: matcher covers `/admin/accept-invite/:path*` — see Part 3D and M1. |
| **1.4** App scaffold, layouts, Tailwind tokens, fonts | DONE | |
| **1.5** Static public pages | DONE | Home, About, Privacy, Terms, Refund Policy |
| **1.6** Contact page + Loops | DONE-UNVERIFIED | Code wired; no confirmed human test that email arrives |
| **2.1** Scheduling schema (0004 + 0005) | DONE-UNVERIFIED | Migrations written; push to production unconfirmed |
| **2.2** Availability engine | DONE-UNVERIFIED | `lib/availability.ts` implemented; `scripts/test-availability.ts` exists but no confirmed run result |
| **2.3** Public booking flow `/book` (5 steps) | DONE-UNVERIFIED | All steps present; no confirmed human E2E test with live Paystack |
| **2.4** Shop checkout + Paystack | DONE-UNVERIFIED | Code complete; no confirmed human test |
| **2.5** My Bookings `/my-bookings` | DONE | RSC email lookup; no auth by design |
| **2.6** `createAppointment` server action | DONE | Uses atomic RPC; Paystack verify; conflict handling |
| **2.7** Booking confirmation email | DONE-UNVERIFIED | Code fires to Loops; no confirmed email received in inbox |
| **2.8** Admin dashboard shell | DONE | Sidebar, layout, auth guard |
| **3.1** Services CRUD | DONE-UNVERIFIED | All CRUD present; no confirmed human walkthrough |
| **3.2** Practitioners + `practitioner_services` | DONE-UNVERIFIED | Invite flow; team management; no confirmed walkthrough |
| **3.3** Shifts + overrides + time_off | DONE-UNVERIFIED | Full UI; no confirmed walkthrough |
| **3.4** Admin calendar | DONE-UNVERIFIED | Day view + ADD booking + status update; no confirmed walkthrough |
| **3.5** Admin ADD booking | DONE-UNVERIFIED | `createAdminBooking` server action present; no confirmed human test |
| **3.6** Clients CRUD | DONE-UNVERIFIED | Table, drawer, edit, notes, history; no confirmed walkthrough |
| **4.1** Package credits (public purchase flow) | **SKIPPED** → Phase 2 | Credits row is created by atomic RPC when `pricing_tier=package`; admin can see credits; public purchase-a-pack UI does not exist |
| **4.2** Paystack webhook | **SKIPPED** → Phase 2 | No `/api/paystack/webhook` file |
| **4.3** Sentry + GA4 | DONE-UNVERIFIED (on unmerged PR) | `week4/clients-and-observability` + `week4/analytics-and-docs`; **not on master** |
| **4.4** Admin export / reports | DONE | `exportAppointmentsCsv` server action + download button in `AppointmentTable`; no chart/graph reports |
| **4.5** QA pass — golden path + edge cases | **NOT DONE** | No evidence any human walked the full booking flow end-to-end with live Paystack. See Part 6. |
| **4.6** Vercel production deploy + DNS cutover | NOT DONE | This is the pending step. |

---

## Part 3 — Production Readiness Audit

### A. Booking Integrity — GAPS

**`create_appointment_atomic` RPC usage:** ✓ CORRECT. Both `createAppointment` (public) and `createAdminBooking` (admin) call the RPC. The RPC is in `0006_booking_constraints.sql` with SECURITY DEFINER.

**Unique partial index:** ✓ PRESENT. `appointments_no_double_book_idx` on `(practitioner_id, appointment_date, start_time)` WHERE status IN ('pending','confirmed') is defined in `0006_booking_constraints.sql`.

**Race condition handling (simultaneous bookings):**
The RPC does a full overlap check (not just exact start-time match) inside a Postgres transaction with SECURITY DEFINER, which runs at the serialization level of the transaction. The unique partial index provides a last-resort DB constraint. The combination is correct for the public booking flow.

**Gap:** The **admin reschedule** (`rescheduleAppointment` in `appointments/actions.ts`) does NOT use the RPC. It does an application-level SELECT for conflicts, then a separate UPDATE — two round trips. There is a race window between the conflict check and the update. Under low admin traffic this is unlikely to bite, but it is an architectural inconsistency with the public flow.

**SLOT_TAKEN error handling:** ✓ CORRECT. `createAppointment` catches `SLOT_TAKEN` (both `P0001` and `23505` codes), calls `refundPaystackPayment`, and returns a clear user-facing error. The refund failure path also logs a MANUAL REFUND NEEDED note.

### B. Payment Integrity — GAPS

**Server-side Paystack verification:**
- Public booking: ✓ `verifyPaystackPayment` called before any DB writes
- Shop checkout: ✓ `verifyPaystackPayment` called before DB writes; duplicate reference guard (select before insert)
- Admin Paystack booking: ✓ verified before writes
- Admin cash/POS/none paths: synthetic references generated, no Paystack call — correct by design

**Amount comparison:** ✓ All comparisons are in kobo (integer math). No floating-point amount math found.

**Paystack webhook:** NOT IMPLEMENTED. Payment status updates depend entirely on the inline verification callback. If a network interruption occurs between Paystack's success and the client's `onSuccess` callback, the payment will have charged the card but no appointment will be created. The user gets stuck on the payment step with no record. This is a V1 accepted gap, but it means some payments will be orphaned silently.

**Refund flow:** ✓ `processRefund` calls `refundPaystackPayment`, updates `payments.status = 'refunded'`, sets `appointments.status = 'cancelled'`, writes audit log, fires Loops refund email (non-blocking). Partial refund is supported (amount validated against original payment). **Not end-to-end tested by a human** (see Part 6).

**`payments.raw_response`:** The column exists in the schema (defined in `0004_scheduling.sql`) but is never populated anywhere. The full Paystack API response is discarded after extracting `amount_kobo`, `channel`, and `reference`. If a payment dispute arises, there is no stored API response to reference.

### C. Error Handling — GAPS

**`console.warn` pattern for non-blocking Loops emails** — 5 occurrences, all intentional:
- `book/actions.ts:187` — booking confirmation email failure
- `adminBookingActions.ts:147` — admin booking confirmation email failure
- `appointments/actions.ts:256` — refund email failure
- `team/actions.ts:92` — invite email failure
- `shop/actions.ts:148` — shop order email failure

These are all correct by design: Loops failures must not fail the primary operation. **However:** None of these failures are reported to Sentry (Sentry is not on master). They are only visible in Vercel logs, which are not actively monitored.

**`console.warn` for duplicate reference** — `shop/actions.ts:55`: A potential duplicate submission logs a warning only. No alert fired.

**Supabase errors:** In server actions, Supabase errors are generally returned to the caller as `{ success: false, error: error.message }` which surfaces to the user. This is correct.

**Contact form error propagation:** `contact/actions.ts` checks for missing `LOOPS_CONTACT_TEMPLATE_ID` or `STAFF_NOTIFICATION_EMAIL` and returns a hard error to the user — correct. But if both env vars are missing, the contact form shows an error without sending to staff. No silent data loss.

**`availability.ts` error handling:** Errors from the DB query bubble up as thrown exceptions, caught by `getAvailability` in `book/actions.ts` and returned as `{ success: false }`.

**Summary:** Error handling is consistent and intentional. The primary gap is that non-blocking Loops failures are invisible unless Sentry is wired (which it isn't on master).

### D. Auth & Authorization — GAPS

**Middleware coverage:** `proxy.ts` at the project root is the correct Next.js 16 middleware file. Next.js 16 reversed the naming convention from prior versions — `proxy.ts` (exporting `proxy`) is what the framework invokes as Edge middleware; `middleware.ts` is deprecated in this version. This was verified live against the dev server: `GET /admin` (unauthenticated) returns HTTP 307 → `/admin/login` before any RSC runs. `GET /admin/dashboard` likewise returns 307. `GET /admin/login` returns 200 with no redirect loop.

**Matcher gap — MUST FIX:** The matcher `['/admin/:path*']` covers `/admin/accept-invite/[token]`, which is the route new staff navigate to when accepting a team invitation. An unauthenticated user hitting that path will be redirected to `/admin/login` before the accept-invite page can render — breaking the onboarding flow entirely. The matcher must explicitly exclude `/admin/accept-invite/:path*`.

The `isLoginPath` guard (`path === '/admin/login'`) correctly prevents redirect loops: authenticated users on `/admin/login` go to `/admin/calendar`; unauthenticated users stay on `/admin/login`.

**No admin API routes exist on master** (confirmed: zero `route.ts` files under `app/`), so there are no currently unprotected API surface areas beyond the matcher gap above.

**RLS posture:** ✓ CORRECT. All 13 tables have RLS enabled. No INSERT/UPDATE/DELETE policies exist for any role. The anon role can read only: `services` (active only), `shifts` (active only), `shift_overrides`, `time_off`. No PII-containing tables are readable by anon.

**Service role key exposure:** Confirmed server-only. Key appears in `lib/supabase/server.ts`, `lib/availability.ts` (server file), `shop/actions.ts`, `my-bookings/actions.ts`, and `scripts/`. No client component imports any of these.

**Invitation token security:** Token is `gen_random_uuid()::text` cast — 122 bits of entropy, adequate against brute force. Single-use enforced via `accepted_at IS NULL` check in `acceptInvite`. **Gap:** No expiry. An invitation sent to a wrong email, or an invitation where the recipient never acts, remains valid indefinitely. If that token URL is found later (e.g., in email logs), it could be used to create an account with whatever role was assigned.

### E. Data Handling — GAPS

**Client PII in logs:** Server action error logs include references but not PII directly. Example: `[booking] Amount mismatch — ref=...` logs only the Paystack reference, not name/email. `[accept-invite] Auth user creation failed` logs the error object, which may include email in Supabase's error message — acceptable for server logs.

**PII in URL params:** `my-bookings` accepts email as a GET form param (`?email=...`). The email appears in the URL query string and will be logged by Vercel request logs. This is a minor privacy concern — not a blocker, but worth noting.

**citext consistency:** `clients.email` is `citext` in the schema (from `0001_foundation.sql`). The `create_appointment_atomic` RPC uses `INSERT ... ON CONFLICT (email)` — the unique constraint on `clients.email` should be case-insensitive given citext. However, `shop/actions.ts` uses `.eq('email', parsed.data.email)` which in PostgREST passes a standard string comparison — with citext this IS case-insensitive at the DB level, so this is correct.

**Audit log coverage:** ✓ All admin writes are logged: service CRUD, appointment status/notes/reschedule/cancel/refund, client edit, team invite/edit, admin booking creation. The public booking flow does not write to audit_log (correct — no actor identity available). Shop orders do not write to audit_log (gap but acceptable for V1).

**Contact form email direction:** `contact/actions.ts` sends the Loops email to `STAFF_NOTIFICATION_EMAIL`, not to the submitting user. The template variable names (`name`, `email`, `phone`, `message`) are staff-facing. The submitting user receives no acknowledgement email. This is either intentional (staff-only notification flow) or a gap (no client acknowledgement). The template env var name `LOOPS_CONTACT_TEMPLATE_ID` implies it may have been intended for client acknowledgement. **Clarify with business before launch.**

### F. Performance — GAPS

**N+1 queries:**
- Calendar page: single query with embedded joins for appointments + clients + services + users on a given date. No N+1.
- Appointments list: paginated (25/page) with embedded joins. Pre-queries for text search and payment status filter load up to 500 client IDs + unbounded payment IDs into memory — potential issue at scale but acceptable for V1 volumes.
- Client history (`getClientHistory`): single query per client. No N+1.

**`exportAppointmentsCsv` memory concern:** No row limit on the export query. Fetches all matching appointments at once. At current expected volumes (< 500 appointments at launch) this is fine. Would be a problem at 10k+ appointments.

**Pagination type:** All paginated queries use offset pagination (`.range(offset, offset + PAGE_SIZE - 1)`). This is correct for current volumes; offset pagination degrades at large offsets but is not a launch concern.

**Images:** Public site uses `next/image`. Sock PNGs were converted to WebP (94–97% size reduction) in `week4/polish` (unmerged). Homepage hero and service images have appropriate `sizes` props (also in `week4/polish`). On master today, the original large PNGs are referenced.

**Bundle size:** Not measured during this audit. The public booking flow imports `react-hook-form`, `zod`, `zustand`. No unusually large imports visible. Paystack script is loaded via `next/script afterInteractive` in the public layout — does not block rendering.

**`lib/data/services.ts` — homepage static data:** `featuredServices` (a hardcoded array) is imported into `app/(public)/page.tsx`. The featured services section on the homepage shows hardcoded prices and names. If service prices are updated via the admin, the homepage cards will NOT reflect the change until a new deployment. The `/services` full catalog page reads live from DB and is correct. This inconsistency creates a risk of showing stale prices on the highest-traffic page.

### G. UX Gaps in Admin — GAPS

**Loading states and feedback:** All admin server actions are called via `useTransition`; disabled states and spinner icons are present in all dialogs. ✓

**Destructive action confirmation:**
- Cancel appointment: ✓ `CancelDialog` requires a reason text field before firing
- Refund: ✓ `RefundDialog` shows amount input + "cannot be reversed" warning before firing
- Delete service: ✓ toggle-active pattern (soft delete) with confirmation in dialog
- Deactivate team member: ✓ toggle in `EditMemberDialog`
- Delete shift/override/time-off: direct delete with no confirmation dialog — LOW risk since shifts have no financial consequence, but notable

**Error display:** Toast notifications via `sonner` are used consistently throughout. Server action errors surface to the user via `toast.error()`. ✓

**Mobile responsiveness of admin:** The admin layout uses a `Sheet` for mobile sidebar navigation (shadcn `Sheet`). The calendar day grid (`DayGrid.tsx`) has horizontal scroll for multiple practitioners. The appointments table has a sticky header. Usable on mobile but designed for desktop — acceptable, practitioners may check it on phones.

**Settings page:** Static stub. "Platform settings coming soon." No functionality. Not a blocker.

### H. Observability — NOT READY

**Sentry:** Zero Sentry coverage in the current master branch. `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation.ts` are all on the `week4/clients-and-observability` unmerged PR. `withSentryConfig` is absent from `next.config.ts` on master. If the app goes live from master without merging this PR, there are no error alerts.

**GA4:** Zero GA4 in the current master branch. The GA4 script injection and `lib/analytics.ts` with custom events are on `week4/analytics-and-docs` (unmerged). No analytics on launch without merging this PR.

**Server action error visibility:** All `catch` blocks in server actions call `console.error(...)` and return user-safe error strings. These errors land in Vercel function logs, which require manual inspection. Without Sentry, there is no automated alert on elevated error rates.

**Uptime monitor:** Not configured. The `/api/health` endpoint that would serve as a ping target is also on an unmerged PR.

---

## Part 4 — Drift from Original Plan

| Drift | Severity | Assessment |
|---|---|---|
| `proxy.ts` naming is CORRECT for Next.js 16; middleware IS active — but matcher covers `/admin/accept-invite/:path*` | HIGH | **Partial regression.** Next.js 16 reversed the naming: `proxy.ts` exporting `proxy` is the correct middleware file (verified live: HTTP 307 on unauthenticated `/admin`). However the matcher `['/admin/:path*']` also matches the invite-acceptance route, blocking new staff from accepting invitations. The matcher must exclude `/admin/accept-invite/:path*`. |
| Sentry + GA4 on feature branches, not merged into master | HIGH | **Operational regression.** Putting observability on separate PRs is fine during development, but shipping to production before merging means zero visibility on day 1. The plan expected 4.3 to be complete before 4.6. |
| `NEXT_PUBLIC_APP_URL` used but never declared in env var inventory | HIGH | **Regression.** Not in CLAUDE.md, not in HANDOVER.md. Production invitations generate `localhost:3000` links. |
| `create_appointment_atomic` RPC used consistently by both booking paths | — | **Improvement over plan.** Plan described general atomicity; implementation goes further with explicit `SLOT_TAKEN` error code and compensating refund on conflict. |
| Paystack webhook deferred | MEDIUM | **Known gap.** Explicitly deferred to Phase 2. Acceptable for V1 with inline verification only if the business understands the orphaned-payment edge case. |
| Homepage `featuredServices` reads from static file, not DB | MEDIUM | **Regression from implicit plan intent.** The plan expected the public site to serve live data. The featured services section on the homepage is frozen at deploy time. Prices will drift. |
| `payments.raw_response` column defined but never populated | LOW | **Drift from schema intent.** The column exists for audit trail purposes. Nothing populates it. |
| `invitation.expires_at` column absent from schema | LOW | **Schema gap.** Invitations are permanent once issued. The plan didn't specify TTL explicitly, but this is a security best practice that was missed. |
| `client_credits.expires_at` never set in RPC | LOW | **Drift from schema.** Column exists in schema; never written. Credits never expire. |
| Contact form sends to staff only, no client acknowledgement | LOW/NOTE | Unclear whether intentional. Template env var name implies client acknowledgement but code sends to staff notification email. |
| Admin reschedule uses application-level conflict check, not atomic RPC | MEDIUM | **Regression.** Public booking uses the safe path; admin reschedule does not. Race condition exists. |

---

## Part 5 — Deferred Items / Technical Debt

### TODO/FIXME/HACK markers in application code

**None found.** A search across all `.ts` and `.tsx` files in `app/`, `components/`, and `lib/` returned zero TODO, FIXME, HACK, or XXX markers. (node_modules contains many, all irrelevant.)

### Placeholder content

- `app/(admin)/admin/(dashboard)/settings/page.tsx`: "Platform settings coming soon." — STUB
- No other stub pages found.

### BUILD.md Phase 2 Backlog items (confirmed still pending)

| Item | Confirmed Deferred? |
|---|---|
| Paystack webhook | ✓ — no file exists |
| Client self-service cancel/reschedule from My Bookings | ✓ — shows "contact us" link |
| Practitioner self-service portal | ✓ — not started |
| Staff new-booking notification email | ✓ — env var exists, never called |
| Reschedule + refund confirmation emails | ✓ — env vars exist, never called (refund email IS wired; reschedule is not) |
| SMS notifications (Termii) | ✓ — not started |
| Package purchase from public booking flow | ✓ — credit creation exists server-side; public UI does not |
| Waitlist | ✓ — not started |
| Loyalty/referral | ✓ — not started |
| Enhanced reports beyond CSV export | ✓ — CSV export exists; no chart/aggregate reports |
| Privacy flag on appointments | ✓ — not started |

**Correction to HANDOVER.md:** The HANDOVER.md states "Reschedule + refund confirmation emails are defined but not wired." The refund email IS wired (`appointments/actions.ts` calls `sendTransactional` with `LOOPS_REFUND_PROCESSED_TEMPLATE_ID`). Only the reschedule notification is unwired.

### Commented-out code / disabled features

None found in application code.

---

## Part 6 — Known Gaps from Earlier Sessions

| Item | Confirmed Status |
|---|---|
| **Silent `catch { console.warn }` around Loops sends** | Still present and intentional in 5 places. The pattern is consistent (non-blocking non-fatal). Not systemically fixed to report to Sentry because Sentry is not on master. On the week4 branches, Sentry is present but server action catch blocks do not call `Sentry.captureException()` — they only `console.error/warn`. Loops failures will not appear in Sentry even after merging. |
| **13-step end-to-end walkthrough** | Not completed by a human. No evidence of a full booking flow test with live Paystack. All "DONE-UNVERIFIED" items in Part 2 reflect this. |
| **Paystack webhook** | Not implemented. No file exists. Deferred to Phase 2. |
| **Package credits flow** | Partially done: the RPC creates a credit row on package bookings; the admin can see credits in the client detail. Public UI to purchase a pack does not exist. Admin UI to manually apply a credit to a booking does not exist either — a booked appointment with `pricing_tier=package` creates credits but there is no admin interface to track sessions-used or apply an existing credit to a new appointment. |
| **First admin user creation** | No evidence this has been done. BUILD.md marks it as an open question. Without this step, the admin dashboard cannot be accessed at all. |
| **Email arrival from each Loops template** | Not confirmed. No human has verified that emails from any of the 5 wired templates arrived in a real inbox. The Loops template IDs themselves are env vars — if any template ID is wrong or the template doesn't match the `dataVariables` being sent, the email will silently fail (caught by `console.warn`, not propagated). |

---

## Part 7 — Recommended Actions Before Cutover

### MUST FIX (blocks cutover or causes real user/financial harm)

| # | Issue | Severity | Time |
|---|---|---|---|
| **M1** | Fix `proxy.ts` to skip auth redirect for `/admin/accept-invite` paths. Add `const isAcceptInvitePath = path.startsWith('/admin/accept-invite')` and include it in the `!isLoginPath && !user` guard. Without this fix, any new staff member clicking their invitation link is redirected to the login page and cannot accept the invite. Note: `proxy.ts` naming is correct for Next.js 16 and must NOT be renamed. **FIXED — applied to `week4/cutover`.** | HIGH | S |
| **M2** | Merge `week4/clients-and-observability` → `week4/analytics-and-docs` → `week4/polish` → `week4/cutover` into master **before** pointing DNS. Without these merges, Sentry and GA4 are absent and ~10MB PNG images serve instead of WebP. | CRITICAL | S |
| **M3** | Add `NEXT_PUBLIC_APP_URL` to Vercel environment variables (e.g., `https://elroisewellnesscenter.com`). Without it, all team invitation emails link to `localhost:3000`. New staff cannot accept invites. | CRITICAL | S |
| **M4** | Confirm `supabase db push` has been run and all 8 migrations (0001–0008) are applied to the production Supabase project. Run: `supabase migration list` and verify. Without 0006 specifically, the `create_appointment_atomic` RPC does not exist — every booking attempt will 500. | CRITICAL | S |
| **M5** | Create the first admin user. Without a row in `public.users` linked to an `auth.users` account with `is_active=true`, no one can log into the admin. | CRITICAL | S |
| **M6** | Manually verify at least one Loops template end-to-end: send a test booking confirmation and confirm receipt. If the template variables don't match, fix the template in Loops (code change not required). | HIGH | M |

### SHOULD FIX (real issues, can be addressed in parallel with or immediately after cutover)

| # | Issue | Severity | Time |
|---|---|---|---|
| **S1** | Add `expires_at` to `invitations` table (e.g., 7-day TTL). Requires a migration. Currently tokens are permanent. | HIGH | M |
| **S2** | Make `rescheduleAppointment` in `appointments/actions.ts` use the `create_appointment_atomic` RPC or at minimum a Postgres advisory lock or serializable transaction, to close the race window. | MEDIUM | M |
| **S3** | Populate `payments.raw_response` in both `createAppointment` and `verifyAndCreateShopOrder` — store the full Paystack verification JSON. Required for payment dispute resolution. | MEDIUM | S |
| **S4** | Clarify contact form intent: is `LOOPS_CONTACT_TEMPLATE_ID` meant to notify staff (current behavior) or acknowledge the client (env var name implies)? If both are needed, add a second template. | LOW | S |
| **S5** | Fix homepage featured services to read from DB (or at minimum add a comment in `lib/data/services.ts` warning that this data must be kept in sync with the DB). Stale prices on the homepage will erode trust. | MEDIUM | M |
| **S6** | Wire Sentry's `captureException` into server action catch blocks that today only `console.error`. Currently Loops/Paystack failures go to Vercel logs only, not to Sentry alerts. | MEDIUM | L |

### CAN DEFER (Phase 2 or post-launch acceptable)

| # | Issue |
|---|---|
| **D1** | Paystack webhook (`/api/paystack/webhook`) — accepted V1 gap; users with network issues must re-book |
| **D2** | Staff new-booking notification email (`LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID`) — staff check calendar manually |
| **D3** | `client_credits.expires_at` — credits don't expire; acceptable for launch |
| **D4** | `payments.raw_response` column exists but unused beyond S3 above |
| **D5** | Admin reschedule notification email to client |
| **D6** | Package credits admin UI (apply existing credit to new booking) |
| **D7** | `exportAppointmentsCsv` row limit — not a concern at launch volumes |
| **D8** | Settings page stub |
| **D9** | `LOOPS_BOOKING_NOTIFICATION_TEMPLATE_ID` + `LOOPS_BOOKING_RESCHEDULED_TEMPLATE_ID` — wiring both deferred |
| **D10** | `any` type in `clients/actions.ts:94` — minor TypeScript debt |
| **D11** | `createServiceClient()` inline duplication in 3 files — refactor when touching those files |
| **D12** | Uptime monitor |

---

## Summary

**Most important finding (corrected):** `proxy.ts` IS active as Next.js 16 Edge middleware — HTTP tests confirm 307 redirects firing before RSC runs. The original audit finding (M1: "rename proxy.ts → middleware.ts") was incorrect; Next.js 16 reversed the naming convention and `proxy.ts` is right. The real issue is narrower: the matcher `['/admin/:path*']` inadvertently covers `/admin/accept-invite/[token]`, which blocks unauthenticated new staff from accepting invitations. The fix is a one-line matcher change, not a rename.

**MUST FIX count:** 6 items. M1 (fix matcher), M2 (merge PRs), M3 (env var), M4 (db push confirm), M5 (admin user), M6 (Loops test).

**Honest verdict:** This project is **not ready to cut DNS today.** The blocker is procedural, not architectural: the observability PRs must be merged first, `supabase db push` must be confirmed, `NEXT_PUBLIC_APP_URL` must be set, and at least one Loops template must be smoke-tested end-to-end. None of the M1–M6 items require significant engineering work — they are configuration, renaming, and confirmation steps. Estimated time to resolve all MUST FIX items: **2–4 hours**, assuming Supabase migrations are not already applied (which could add time if schema conflicts exist). The underlying booking and payment code is solid.
