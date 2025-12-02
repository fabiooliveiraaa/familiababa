-- Add manual_name field for mensalistas without accounts
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS manual_name text;

-- Make user_id nullable for manual registrations
ALTER TABLE public.registrations ALTER COLUMN user_id DROP NOT NULL;