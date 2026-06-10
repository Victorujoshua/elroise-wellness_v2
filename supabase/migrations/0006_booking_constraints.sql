-- 0006_booking_constraints.sql
-- Production hardening: prevent double-booking and make appointment creation atomic.

-- PH-3: Unique partial index — a practitioner cannot have two active appointments
-- with the same start time on the same date. Combined with the overlap check in
-- create_appointment_atomic, this is the last-resort DB-level guard.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_double_book_idx
  ON appointments (practitioner_id, appointment_date, start_time)
  WHERE status IN ('pending', 'confirmed');

-- PH-2 + PH-5: Atomic booking function.
-- Runs inside a single Postgres transaction: slot overlap check → client upsert
-- → appointment insert → client_credits insert. If the slot is gone the function
-- raises SLOT_TAKEN and the whole transaction rolls back before any row is written.
CREATE OR REPLACE FUNCTION create_appointment_atomic(
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
  p_package_session_count  int DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id      uuid;
  v_appointment_id uuid;
BEGIN
  -- PH-2: Re-check slot availability atomically (full overlap, not just exact start time).
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE practitioner_id  = p_practitioner_id
      AND appointment_date = p_appointment_date
      AND status           IN ('pending', 'confirmed')
      AND start_time       < p_end_time
      AND end_time         > p_start_time
  ) THEN
    RAISE EXCEPTION 'SLOT_TAKEN'
      USING HINT = 'This time slot is no longer available. Please select another.';
  END IF;

  -- Upsert client by email. DO UPDATE ensures RETURNING id is always populated.
  INSERT INTO clients (full_name, email, phone)
  VALUES (p_full_name, p_email, p_phone)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_client_id;

  -- Insert appointment.
  INSERT INTO appointments (
    client_id, service_id, practitioner_id,
    appointment_date, start_time, end_time,
    status, source, pricing_tier, notes
  )
  VALUES (
    v_client_id, p_service_id, p_practitioner_id,
    p_appointment_date, p_start_time, p_end_time,
    'confirmed', 'web', p_pricing_tier, p_notes
  )
  RETURNING id INTO v_appointment_id;

  -- Package credits — only when pricing_tier = 'package'.
  IF p_pricing_tier = 'package' AND p_package_session_count IS NOT NULL THEN
    INSERT INTO client_credits (
      client_id, service_id, sessions_purchased, sessions_used
    )
    VALUES (v_client_id, p_service_id, p_package_session_count, 0);
  END IF;

  RETURN v_appointment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_appointment_atomic(
  text, text, text, text, uuid, uuid, date, time, time, text, int
) TO service_role;
