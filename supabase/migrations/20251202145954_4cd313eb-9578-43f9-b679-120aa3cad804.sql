-- Drop old DELETE policy and create new one that allows admins to delete any registration
DROP POLICY IF EXISTS "Users can delete own registration" ON public.registrations;

CREATE POLICY "Users can delete own registration or admins can delete any"
ON public.registrations
FOR DELETE
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);