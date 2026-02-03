-- Create settings table for storing app configuration like Instagram post URL
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings
CREATE POLICY "Settings viewable by everyone" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Only admins can update settings" 
ON public.app_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete settings" 
ON public.app_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial Instagram setting
INSERT INTO public.app_settings (key, value) VALUES ('instagram_post_url', null);