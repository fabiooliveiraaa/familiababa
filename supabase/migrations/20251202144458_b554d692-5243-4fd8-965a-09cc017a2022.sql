-- Drop old INSERT policy and create new one that allows admins to register anyone
DROP POLICY IF EXISTS "Authenticated users can register themselves" ON public.registrations;

CREATE POLICY "Users can register themselves or admins can register anyone"
ON public.registrations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add column to identify mensalistas (manually added by admin)
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_mensalista boolean NOT NULL DEFAULT false;

-- Add waiting list status to enum
ALTER TYPE registration_status ADD VALUE IF NOT EXISTS 'lista_espera';

-- Add waiting list position column
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS waiting_position integer;