-- Add buffer_minutes column
ALTER TABLE services
ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 0
CHECK (buffer_minutes >= 0 AND buffer_minutes <= 120);

COMMENT ON COLUMN services.buffer_minutes IS
'Turnover time in minutes added after each booking of this service.
Practitioner is unavailable for this many minutes after the session ends.';

-- Update create_appointment_atomic to check buffer time on the existing
-- appointment's service. Signature is UNCHANGED from 0011 (same param
-- names/order/types) — this is a body-only update via CREATE OR REPLACE.
-- Only the slot-overlap check changes; client upsert, redemption, and
-- appointment/credit insert logic are copied verbatim from 0011.
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
BEGIN
  -- Re-check slot availability atomically, now buffer-aware. Buffer comes
  -- from the EXISTING appointment's service (turnover time it needs before
  -- the practitioner is free again), not the service being newly booked.
  -- Compared as timestamps (date + time), not bare ::time, so a buffer that
  -- pushes past midnight rolls into the next day instead of wrapping back
  -- to 00:xx and silently under-blocking a late-night slot.
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

  -- Upsert client by email (unchanged from 0006).
  INSERT INTO clients (full_name, email, phone)
  VALUES (p_full_name, p_email, p_phone)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_client_id;

  -- REDEMPTION path: validate, lock, and decrement an existing credit.
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

  -- Insert appointment. Notes stay on the appointment row, same as 0006 —
  -- NOT moved to clients.notes (that's a separate, persistent per-client
  -- field edited elsewhere; overwriting it on every booking would be a
  -- behavior change outside this migration's scope).
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

  -- PURCHASE path: new package sale creates a fresh credit balance —
  -- only when this booking is NOT itself a redemption.
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
