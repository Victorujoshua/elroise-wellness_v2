-- Drop unique index that prevented concurrent bookings
-- Made sense for 1-on-1 services only. Now handled by application
-- logic (SLOT_FULL check + DUPLICATE_BOOKING check in RPC), backed by
-- an advisory lock below to close the race window this index used to
-- guard (see comment inside create_appointment_atomic).
DROP INDEX IF EXISTS public.appointments_no_double_book_idx;

-- Add max_concurrent column
ALTER TABLE services
ADD COLUMN IF NOT EXISTS max_concurrent INTEGER NOT NULL DEFAULT 1
CHECK (max_concurrent >= 1 AND max_concurrent <= 20);

COMMENT ON COLUMN services.max_concurrent IS
'Maximum number of clients that can book the same slot with the same
practitioner. Default 1 for 1-on-1 services. Group classes use higher
values.';

-- Update create_appointment_atomic to handle concurrent (group) bookings.
-- Signature is UNCHANGED from 0011/0012 (same param names/order/types) —
-- body-only update via CREATE OR REPLACE. Client upsert, redemption, and
-- appointment/credit insert logic are copied verbatim from 0012; only the
-- slot-conflict section is restructured to branch on max_concurrent, plus
-- a new same-client duplicate-booking check.
CREATE OR REPLACE FUNCTION public.create_appointment_atomic(
  p_full_name              text,
  p_email                  text,
  p_phone                  text,
  p_notes                  text,
  p_service_id             uuid,
  p_practitioner_id        uuid,
  p_appointment_date       date,
  p_start_time             time,
  p_end_time               time,
  p_pricing_tier           text,
  p_package_session_count  int  DEFAULT NULL,
  p_source                 text DEFAULT 'web',
  p_credit_id              uuid DEFAULT NULL
)
RETURNS TABLE (
  appointment_id uuid,
  client_id      uuid,
  credit_id      uuid,
  new_credit_id  uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id        uuid;
  v_appointment_id   uuid;
  v_new_credit_id    uuid;
  v_credit_remaining int;
  v_max_concurrent   int;
  v_existing_count   int;
BEGIN
  SELECT max_concurrent INTO v_max_concurrent
  FROM services
  WHERE id = p_service_id;

  IF v_max_concurrent IS NULL THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND';
  END IF;

  -- Serialize concurrent booking attempts for this exact
  -- practitioner/date/start_time. appointments_no_double_book_idx used
  -- to make this race impossible at the DB level (any two INSERTs for
  -- the same tuple would conflict), but that same guarantee is what
  -- blocked legitimate group bookings, so it's dropped above. Without
  -- some replacement, two concurrent requests could both pass the
  -- SLOT_FULL / SLOT_TAKEN checks below before either commits (classic
  -- check-then-insert race under READ COMMITTED) — for max_concurrent=1
  -- that's a double-booked practitioner; for group classes it's
  -- overselling the last spot. Transaction-scoped advisory lock keyed
  -- on the same tuple the old index covered forces concurrent callers
  -- for this slot to run one at a time; it auto-releases on commit or
  -- rollback, so it never outlives this transaction.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_practitioner_id::text || p_appointment_date::text || p_start_time::text, 0)
  );

  -- Upsert client by email (unchanged from 0006/0011/0012).
  INSERT INTO clients (full_name, email, phone)
  VALUES (p_full_name, p_email, p_phone)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_client_id;

  -- CHECK 1: block the same client double-booking themselves on an
  -- overlapping slot, regardless of service. Not buffer-aware — this is
  -- about the client's own calendar, not practitioner turnover.
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.client_id        = v_client_id
      AND a.appointment_date = p_appointment_date
      AND a.status           IN ('pending', 'confirmed')
      AND a.start_time       < p_end_time
      AND a.end_time         > p_start_time
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING'
      USING HINT = 'This client already has a booking that overlaps this time.';
  END IF;

  IF v_max_concurrent > 1 THEN
    -- Group service: multiple clients can share the exact same
    -- service/practitioner/date/start/end slot, up to capacity.
    SELECT COUNT(*) INTO v_existing_count
    FROM appointments a
    WHERE a.practitioner_id  = p_practitioner_id
      AND a.service_id       = p_service_id
      AND a.appointment_date = p_appointment_date
      AND a.start_time       = p_start_time
      AND a.end_time         = p_end_time
      AND a.status           IN ('pending', 'confirmed');

    IF v_existing_count >= v_max_concurrent THEN
      RAISE EXCEPTION 'SLOT_FULL'
        USING HINT = 'This class is fully booked.';
    END IF;

    -- Practitioner still can't double-book a DIFFERENT service that
    -- overlaps this time (buffer-aware, timestamp-safe — see 0012).
    -- NB: only guards against a different service_id — this session
    -- does not enforce that group bookings for the SAME service align
    -- to one canonical start/end; that's left to the booking UI (a
    -- later session), not this RPC.
    IF EXISTS (
      SELECT 1 FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.practitioner_id  = p_practitioner_id
        AND a.appointment_date = p_appointment_date
        AND a.status           IN ('pending', 'confirmed')
        AND a.service_id      != p_service_id
        AND a.start_time       < p_end_time
        AND (a.appointment_date + a.end_time + (s.buffer_minutes || ' minutes')::interval)
              > (p_appointment_date + p_start_time)
    ) THEN
      RAISE EXCEPTION 'PRACTITIONER_BUSY'
        USING HINT = 'The practitioner has a conflicting booking at this time.';
    END IF;

  ELSE
    -- 1-on-1 service (max_concurrent = 1): any overlap on this
    -- practitioner blocks — buffer-aware, timestamp-safe, unchanged
    -- from 0012.
    IF EXISTS (
      SELECT 1 FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.practitioner_id  = p_practitioner_id
        AND a.appointment_date = p_appointment_date
        AND a.status           IN ('pending', 'confirmed')
        AND a.start_time       < p_end_time
        AND (a.appointment_date + a.end_time + (s.buffer_minutes || ' minutes')::interval)
              > (p_appointment_date + p_start_time)
    ) THEN
      RAISE EXCEPTION 'SLOT_TAKEN'
        USING HINT = 'This time slot is no longer available. Please select another.';
    END IF;
  END IF;

  -- REDEMPTION path (unchanged from 0011/0012).
  IF p_credit_id IS NOT NULL THEN
    SELECT (sessions_purchased - sessions_used) INTO v_credit_remaining
    FROM client_credits
    WHERE id = p_credit_id
      AND client_id = v_client_id
      AND service_id = p_service_id
      AND (expires_at IS NULL OR expires_at >= p_appointment_date)
    FOR UPDATE;

    IF v_credit_remaining IS NULL THEN
      RAISE EXCEPTION 'CREDIT_NOT_FOUND';
    END IF;

    IF v_credit_remaining < 1 THEN
      RAISE EXCEPTION 'CREDIT_EXHAUSTED';
    END IF;

    UPDATE client_credits
    SET sessions_used = sessions_used + 1
    WHERE id = p_credit_id;
  END IF;

  -- Insert appointment (unchanged from 0011/0012 — notes stay on the
  -- appointment row, not moved to clients.notes).
  INSERT INTO appointments (
    client_id, service_id, practitioner_id,
    appointment_date, start_time, end_time,
    status, source, pricing_tier, notes, credit_id
  )
  VALUES (
    v_client_id, p_service_id, p_practitioner_id,
    p_appointment_date, p_start_time, p_end_time,
    'confirmed', p_source, p_pricing_tier, p_notes, p_credit_id
  )
  RETURNING id INTO v_appointment_id;

  -- PURCHASE path (unchanged from 0011/0012).
  IF p_pricing_tier = 'package' AND p_credit_id IS NULL AND p_package_session_count IS NOT NULL THEN
    INSERT INTO client_credits (
      client_id, service_id, sessions_purchased, sessions_used, purchase_appointment_id
    )
    VALUES (
      v_client_id, p_service_id, p_package_session_count, 0, v_appointment_id
    )
    RETURNING id INTO v_new_credit_id;
  END IF;

  RETURN QUERY SELECT v_appointment_id, v_client_id, p_credit_id, v_new_credit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_appointment_atomic(
  text, text, text, text, uuid, uuid, date, time, time, text, int, text, uuid
) TO service_role;
