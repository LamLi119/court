-- Fix: "canceling statement due to statement timeout" (57014) on venues list.
-- The app queries: ORDER BY sort_order ASC NULLS LAST, name ASC.
-- Without an index, Postgres does a full table scan + sort and can exceed the anon timeout (3s).

CREATE INDEX IF NOT EXISTS idx_venues_sort_order_name
  ON public.venues (sort_order NULLS LAST, name ASC);
