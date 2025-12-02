-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create player ratings table
CREATE TABLE public.player_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_rating INTEGER NOT NULL CHECK (skill_rating >= 1 AND skill_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rater_id, rated_id)
);

-- Enable RLS on ratings
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ratings
CREATE POLICY "Ratings are viewable by everyone"
ON public.player_ratings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can rate others"
ON public.player_ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = rater_id AND auth.uid() != rated_id);

CREATE POLICY "Users can update their own ratings"
ON public.player_ratings FOR UPDATE
TO authenticated
USING (auth.uid() = rater_id);

CREATE POLICY "Users can delete their own ratings"
ON public.player_ratings FOR DELETE
TO authenticated
USING (auth.uid() = rater_id);

-- Trigger for updated_at
CREATE TRIGGER update_player_ratings_updated_at
BEFORE UPDATE ON public.player_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();