-- SQL Optimizations for Export Participants Endpoint
-- Run these in your Supabase SQL editor to create the optimal functions

-- Function to get participants with day plays count (optimized aggregation)
CREATE OR REPLACE FUNCTION get_participants_with_day_plays(
  start_date timestamp with time zone,
  end_date timestamp with time zone
)
RETURNS TABLE (
  nombre text,
  apellido text,
  email text,
  plays_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.nombre,
    p.apellido,
    p.email,
    COUNT(pl.id) as plays_count
  FROM participants p
  INNER JOIN plays pl ON p.id = pl.participant_id
  WHERE pl.created_at >= start_date 
    AND pl.created_at <= end_date
  GROUP BY p.id, p.nombre, p.apellido, p.email
  HAVING COUNT(pl.id) > 0
  ORDER BY plays_count DESC, p.nombre ASC;
$$;

-- Function to get participants with total plays count (optimized aggregation)
CREATE OR REPLACE FUNCTION get_participants_with_total_plays()
RETURNS TABLE (
  nombre text,
  apellido text,
  email text,
  created_at timestamp with time zone,
  plays_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.nombre,
    p.apellido,
    p.email,
    p.created_at,
    COUNT(pl.id) as plays_count
  FROM participants p
  LEFT JOIN plays pl ON p.id = pl.participant_id
  GROUP BY p.id, p.nombre, p.apellido, p.email, p.created_at
  ORDER BY p.created_at ASC;
$$;

-- Indexes for better performance (if not already exist)
CREATE INDEX IF NOT EXISTS idx_plays_participant_created 
ON plays(participant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_participants_created 
ON participants(created_at);

-- Function to get participant statistics (optimized aggregation)
CREATE OR REPLACE FUNCTION get_participant_stats(participant_id_param text)
RETURNS TABLE (
  total_plays bigint,
  correct_answers bigint,
  incorrect_answers bigint,
  has_prize boolean,
  first_prize_name text,
  first_prize_date timestamp with time zone,
  success_rate numeric(5,2)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH stats AS (
    SELECT 
      COUNT(*) as total_plays,
      COUNT(*) FILTER (WHERE answeredcorrectly = true) as correct_answers,
      COUNT(*) FILTER (WHERE answeredcorrectly = false) as incorrect_answers,
      COUNT(*) FILTER (WHERE premio_ganado IS NOT NULL AND premio_ganado != '') > 0 as has_prize,
      (SELECT premio_ganado FROM plays p2 
       WHERE p2.participant_id = participant_id_param 
       AND p2.premio_ganado IS NOT NULL 
       AND p2.premio_ganado != '' 
       ORDER BY p2.created_at ASC 
       LIMIT 1) as first_prize_name,
      (SELECT created_at FROM plays p2 
       WHERE p2.participant_id = participant_id_param 
       AND p2.premio_ganado IS NOT NULL 
       AND p2.premio_ganado != '' 
       ORDER BY p2.created_at ASC 
       LIMIT 1) as first_prize_date
    FROM plays 
    WHERE participant_id = participant_id_param
  )
  SELECT 
    s.total_plays,
    s.correct_answers,
    s.incorrect_answers,
    s.has_prize,
    s.first_prize_name,
    s.first_prize_date,
    CASE 
      WHEN s.total_plays > 0 THEN ROUND((s.correct_answers::numeric / s.total_plays::numeric) * 100, 2)
      ELSE 0
    END as success_rate
  FROM stats s;
$$;

-- Function to check if participant has won a prize (optimized)
CREATE OR REPLACE FUNCTION has_participant_won_prize(participant_id_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM plays 
    WHERE participant_id = participant_id_param 
    AND premio_ganado IS NOT NULL 
    AND premio_ganado != ''
  );
$$;

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_plays_participant_prize 
ON plays(participant_id, premio_ganado) 
WHERE premio_ganado IS NOT NULL AND premio_ganado != '';

CREATE INDEX IF NOT EXISTS idx_plays_participant_answered 
ON plays(participant_id, answeredcorrectly);

-- Comments explaining the optimizations:
COMMENT ON FUNCTION get_participants_with_day_plays IS 
'Optimized function that uses SQL aggregation (COUNT) instead of JavaScript loops to count plays per participant for a specific date range. Eliminates memory-intensive operations and reduces data transfer.';

COMMENT ON FUNCTION get_participants_with_total_plays IS 
'Optimized function that uses SQL aggregation to count total plays per participant. Replaces multiple database queries and JavaScript processing with a single efficient SQL query.';

COMMENT ON FUNCTION get_participant_stats IS 
'Highly optimized function that replaces JavaScript loops and filtering with SQL aggregations. Uses COUNT FILTER for conditional counts and subqueries for first prize data. Eliminates the need to transfer all play records to Node.js for processing.';

COMMENT ON FUNCTION has_participant_won_prize IS 
'Optimized function that uses SQL EXISTS instead of fetching and filtering records in JavaScript. Much faster for checking prize status.';