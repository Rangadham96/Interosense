-- Migration: add subscale_scores column to assessments table
-- Required for MAIA-2 per-subscale profiling (8 dimensions, Mehling et al. 2018)
-- The column is nullable: legacy records or those saved before the subscale profile
-- feature was introduced will have NULL here, triggering the "incomplete" warning UI.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS subscale_scores jsonb;
