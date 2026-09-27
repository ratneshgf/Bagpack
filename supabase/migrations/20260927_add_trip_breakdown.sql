-- Run this once in Supabase Dashboard > SQL Editor.
-- It stores the exact figures entered on the Compare page for each saved trip.
alter table public.trips
  add column if not exists trip_breakdown jsonb;
