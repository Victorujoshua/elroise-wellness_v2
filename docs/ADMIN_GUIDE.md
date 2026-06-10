# Elroisè Wellness Center — Admin Guide

> For the team. Plain language, no jargon.

---

## Table of Contents

1. [Logging In](#1-logging-in)
2. [Reading the Calendar](#2-reading-the-calendar)
3. [Creating an Appointment (ADD)](#3-creating-an-appointment-add)
4. [Changing Appointment Status](#4-changing-appointment-status)
5. [Issuing a Refund](#5-issuing-a-refund)
6. [Managing Shifts](#6-managing-shifts)
7. [Adding a New Service Type](#7-adding-a-new-service-type)
8. [Inviting a Team Member](#8-inviting-a-team-member)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Logging In

**URL:** `https://elroisewellnesscenter.com/admin/login`

Enter your email address and password, then click **Sign In**. You will land on the Calendar.

**Roles and access:**
- **Owner** — full access to everything
- **Staff** — can manage appointments, clients, and the calendar; cannot manage billing or delete services
- **Practitioner** — calendar and own appointments only

**If you are locked out:**
Contact the studio owner. They can trigger a password reset from the Supabase dashboard. You will receive an email with a reset link.

---

## 2. Reading the Calendar

The Calendar is the home screen of the admin dashboard.

**Layout:**
- Each practitioner who has a shift on the selected day appears as a column.
- Time slots run from 07:00 to 21:00 down the left side.
- Appointment cards are positioned in the grid at the correct time and column.

**Navigating dates:**
- Use the **← →** arrows at the top to move one day at a time.
- Click **Today** to jump back to the current date.
- Click the date itself to open a date picker and jump to any day.

**Reading appointment cards:**
Each card shows the client's name, service name, and the time window. The card colour indicates status:

| Colour | Status | Meaning |
|--------|--------|---------|
| Gold/amber | Pending | Booked and paid, not yet confirmed by staff |
| Green | Confirmed | Appointment confirmed |
| Grey | Completed | Session is done |
| Red | Cancelled | Appointment was cancelled |
| Orange | No-show | Client did not attend |

**Opening appointment details:**
Click any card to open the detail panel. From there you can change the status, add notes, reschedule, or process a refund.

---

## 3. Creating an Appointment (ADD)

Use this when a client calls, walks in, or you need to book on their behalf.

1. Click the **+ Add Booking** button at the top right of the Calendar.
2. A panel opens on the right. Fill in:
   - **Service** — choose from the dropdown
   - **Client name, email, and phone** — type an email first; if the client exists in the system, their details auto-fill
   - **Date and time slot** — pick from the available slots for the selected practitioner
   - **Practitioner** — select who will deliver the session
   - **Notes** — optional internal note
3. Choose a **payment method:**
   - **Paystack** — opens the Paystack popup so the client can pay by card over the phone
   - **Cash** — records the booking as a cash payment (no Paystack transaction)
   - **POS** — records the booking as a POS terminal payment
   - **Record later** — creates the appointment without a payment record; useful for walk-ins or when payment is settled separately
4. Click **Create Appointment**. The appointment appears on the calendar immediately.

---

## 4. Changing Appointment Status

You can update a status from two places:

**From the Calendar:** Click the appointment card, then click the current status badge or the **Change Status** button in the detail panel.

**From the Appointments list** (`/admin/appointments`): Click any row to open the detail page, then use the **Change Status** button in the top-right actions bar.

**Status options:**

| Status | When to use |
|--------|-------------|
| Pending | Default after booking. The appointment is paid but not yet acknowledged by staff. |
| Confirmed | Staff has confirmed the appointment with the client. |
| Completed | The session has taken place. |
| Cancelled | The appointment was cancelled. Mark this before issuing a refund if applicable. |
| No-show | The client did not attend and did not cancel in advance. |

> Tip: Set appointments to **Completed** at the end of each day. This keeps your history accurate and ensures package credits are counted correctly.

---

## 5. Issuing a Refund

Refunds are processed through Paystack. The money is returned to the client's original payment card.

**When a refund is available:**
The Refund button appears on the appointment detail page only when:
- The appointment has a Paystack payment on record, and
- The status is **Confirmed** or **No-show** (not already cancelled or completed without pay)

**Steps:**

1. Open the appointment from the Calendar or the Appointments list.
2. In the **Payment** panel on the right, click **Process Refund**.
3. A dialog opens showing the original payment amount.
   - Leave the amount as-is for a **full refund**.
   - Type a smaller amount for a **partial refund** (e.g., charge a cancellation fee and refund the rest).
4. Click **Confirm Refund**. The refund is sent to Paystack immediately.

**What happens next:**
- The payment record updates to "refunded".
- Paystack processes the refund within 5–10 business days depending on the client's bank.
- The appointment status does not change automatically — update it to Cancelled if appropriate.

> Partial refunds: If the client paid for a package session and you want to refund only a portion, enter the exact amount in naira (not kobo). For example, to refund ₦15,000 of a ₦20,000 payment, type `15000`.

---

## 6. Managing Shifts

Shifts define when each practitioner is available to take bookings. The online booking form only shows slots that fall within an active shift.

Go to **Shifts** in the left sidebar.

### Adding a recurring weekly shift

This covers the practitioner's regular schedule.

1. Click **Add Shift**.
2. Select the **practitioner**.
3. Choose the **day of the week** (e.g., Monday).
4. Set the **start and end time** (e.g., 09:00 – 18:00).
5. Set an **effective from** date (usually today).
6. Leave **effective until** blank if the shift is indefinite, or set an end date if it has a known finish.
7. Click **Save**.

### Adding a one-off override

Use this when a practitioner works different hours on a specific date — for example, they start at 11:00 instead of 09:00 one day.

1. Click **Add Override**.
2. Select the practitioner and the specific date.
3. Set the modified start and end times.
4. Optionally add a reason (internal note only).
5. Click **Save**.

### Marking time off

Use this when a practitioner is fully unavailable for a stretch of days — holiday, sick leave, training.

1. Click **Add Time Off**.
2. Select the practitioner.
3. Set the **start date** and **end date** of the absence.
4. Add a reason (optional).
5. Click **Save**.

No booking slots will be shown for that practitioner during the time-off period.

---

## 7. Adding a New Service Type

Go to **Services** in the left sidebar.

1. Click **+ Add Service**.
2. Fill in:
   - **Name** — what clients see on the booking form (e.g., "Full-Body Laser Session")
   - **Category** — Pilates, Laser, or Other
   - **Duration** — in minutes (e.g., 60)
   - **Single session price** — in naira (e.g., 45000)
3. To offer a package deal, toggle on **Package pricing** and enter:
   - **Package price** — total price for the pack
   - **Sessions in package** — number of sessions included (e.g., 5)
4. Under **Practitioners**, tick all the practitioners who can deliver this service. Only ticked practitioners will appear as options when a client books this service.
5. Click **Save**. The service is live immediately on the booking form.

**Editing a service:** Click the service row to open it in edit mode. All fields except the slug can be changed.

**Deactivating a service:** Toggle the **Active** switch off. The service disappears from the booking form but its appointment history is preserved.

---

## 8. Inviting a Team Member

Go to **Team** in the left sidebar.

1. Click **Invite Member**.
2. Enter the person's **full name**, **email address**, and **role:**
   - **Owner** — full admin access
   - **Staff** — can manage appointments and clients; cannot change services or billing
   - **Practitioner** — calendar access; appears as a bookable practitioner
3. Click **Send Invite**.

The invitee receives an email with a private link. When they click it, they are taken to an account setup page where they choose a password. After that they can log in at `/admin/login`.

**If the invite expires:** Invites are single-use and expire after 7 days. If the person did not accept in time, you can revoke the old invite and send a new one from the Team page.

**Editing a team member:** Click the member's row to open an edit panel. You can update their name, role, and whether they are active. Deactivating a member immediately blocks their login without deleting their history.

---

## 9. Troubleshooting

### Can't log in

- Double-check the email address and password. Passwords are case-sensitive.
- Try the "Forgot password" link if available, or ask the studio owner to issue a password reset from the Supabase dashboard.
- If you see "Account inactive", a studio owner needs to re-enable your account from the Team page.

### A time slot is not showing on the booking form

The booking form only shows slots when all three conditions are met:
1. The practitioner has an **active shift** covering that time on that day.
2. There is no **shift override** marking them unavailable, and no **time off** on that date.
3. The slot is not already **taken by another confirmed or pending appointment**.

Check the Shifts page for the practitioner in question and confirm their schedule is set up correctly for the date.

### An appointment isn't showing on the Calendar

- Make sure you are looking at the correct date (check the date displayed at the top of the grid).
- The appointment column only appears if the practitioner has a shift on that day. If a booking was made without a shift set up, navigate to the Appointments list (`/admin/appointments`) where all appointments are listed regardless of shifts.
- Use the search bar in the Appointments list to find it by client name or email.

### A payment shows "Pending"

This usually means one of two things:
1. **The client's Paystack popup was closed before the payment completed.** The booking was not created in this case — there is nothing to worry about.
2. **The Paystack verification call failed server-side.** This is rare. Check the appointment's detail page — if it exists and shows a payment reference, the Paystack dashboard at [dashboard.paystack.com](https://dashboard.paystack.com) is the ground truth for whether money was actually charged. Contact the developer if there is a discrepancy.

### A package credit isn't being applied

Credits are applied automatically when the client selects "Package" pricing during the booking flow. If the credit balance shows as 0 in the client's record, either:
- The package was never purchased (the client selected "Single" each time), or
- All sessions have been used.

Check the **Credits** tab on the client's detail page (`/admin/clients/[client-id]`) for a full credit history.

---

*Last updated: June 2026*
