-- Rename time to start_time
ALTER TABLE public.babas RENAME COLUMN time TO start_time;

-- Add end_time column
ALTER TABLE public.babas ADD COLUMN end_time text NOT NULL DEFAULT '22:00';