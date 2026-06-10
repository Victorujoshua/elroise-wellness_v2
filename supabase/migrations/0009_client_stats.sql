-- 0009_client_stats.sql
-- RPC function that returns paginated clients with computed lifetime stats.
-- Sort column is validated against a whitelist; parameterised values prevent injection.

CREATE OR REPLACE FUNCTION get_clients_with_stats(
  p_q      text  DEFAULT '',
  p_sort   text  DEFAULT 'created_at',
  p_dir    text  DEFAULT 'desc',
  p_limit  int   DEFAULT 50,
  p_offset int   DEFAULT 0
)
RETURNS TABLE (
  id                  uuid,
  full_name           text,
  email               text,
  phone               text,
  notes               text,
  created_at          timestamptz,
  lifetime_bookings   bigint,
  lifetime_spend_kobo bigint,
  last_booking        date,
  row_count           bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sql     text;
  _sort    text;
  _dir     text;
  _allowed text[] := ARRAY[
    'full_name', 'email', 'phone', 'created_at',
    'last_booking', 'lifetime_bookings', 'lifetime_spend_kobo'
  ];
BEGIN
  _sort := CASE WHEN p_sort = ANY(_allowed) THEN p_sort ELSE 'created_at' END;
  _dir  := CASE WHEN lower(p_dir) IN ('asc', 'desc') THEN lower(p_dir) ELSE 'desc' END;

  _sql := format($q$
    WITH stats AS (
      SELECT
        a.client_id,
        COUNT(a.id) FILTER (WHERE a.status NOT IN ('cancelled'))        AS lifetime_bookings,
        COALESCE(
          SUM(p.amount_kobo) FILTER (WHERE p.status = 'success'), 0
        )                                                                AS lifetime_spend_kobo,
        MAX(a.appointment_date)::date                                    AS last_booking
      FROM appointments a
      LEFT JOIN payments p ON p.appointment_id = a.id
      GROUP BY a.client_id
    ),
    filtered AS (
      SELECT
        c.id,
        c.full_name,
        c.email,
        c.phone,
        c.notes,
        c.created_at,
        COALESCE(s.lifetime_bookings,   0)::bigint AS lifetime_bookings,
        COALESCE(s.lifetime_spend_kobo, 0)::bigint AS lifetime_spend_kobo,
        s.last_booking
      FROM clients c
      LEFT JOIN stats s ON s.client_id = c.id
      WHERE $1 = '' OR (
        c.full_name ILIKE '%%' || $1 || '%%' OR
        c.email     ILIKE '%%' || $1 || '%%' OR
        c.phone     ILIKE '%%' || $1 || '%%'
      )
    )
    SELECT
      id, full_name, email, phone, notes, created_at,
      lifetime_bookings, lifetime_spend_kobo, last_booking,
      COUNT(*) OVER ()::bigint AS row_count
    FROM filtered
    ORDER BY %I %s, created_at DESC
    LIMIT  $2
    OFFSET $3
  $q$, _sort, _dir);

  RETURN QUERY EXECUTE _sql USING p_q, p_limit, p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_clients_with_stats(text, text, text, int, int) TO service_role;
