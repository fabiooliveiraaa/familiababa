-- Allow guest (no account) self-registration
GRANT SELECT, INSERT ON public.registrations TO anon;
GRANT SELECT ON public.babas TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.registrations TO service_role;

CREATE POLICY "Guests can self register with a name"
ON public.registrations
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND manual_name IS NOT NULL
  AND length(btrim(manual_name)) BETWEEN 2 AND 60
  AND is_mensalista = false
  AND is_champion = false
  AND status IN ('inscrito'::registration_status, 'lista_espera'::registration_status)
  AND EXISTS (
    SELECT 1 FROM public.babas b
    WHERE b.id = registrations.baba_id
      AND b.is_open = true
      AND (b.registration_opens_at IS NULL OR b.registration_opens_at <= now())
  )
);

-- Allow guests to upload payment proofs to the public payment-proofs bucket
CREATE POLICY "Guests can upload payment proofs"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = 'guests');