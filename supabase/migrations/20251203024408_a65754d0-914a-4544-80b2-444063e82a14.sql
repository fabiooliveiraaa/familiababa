-- Create player_achievements table for badges
CREATE TABLE public.player_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Achievements viewable by everyone" 
ON public.player_achievements 
FOR SELECT USING (true);

CREATE POLICY "System can manage achievements" 
ON public.player_achievements 
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create view for player statistics (calculated from existing data)
CREATE OR REPLACE VIEW public.player_statistics AS
SELECT 
  p.id as user_id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  COALESCE(matches.total_matches, 0) as total_matches,
  COALESCE(matches.matches_as_linha, 0) as matches_as_linha,
  COALESCE(matches.matches_as_goleiro, 0) as matches_as_goleiro,
  COALESCE(ratings.avg_rating, 0) as avg_rating,
  COALESCE(ratings.total_ratings, 0) as total_ratings,
  COALESCE(votes.craque_titles, 0) as craque_titles,
  COALESCE(votes.total_votes_received, 0) as total_votes_received,
  -- Score for ranking: matches * 10 + craque_titles * 50 + avg_rating * 5
  (COALESCE(matches.total_matches, 0) * 10 + 
   COALESCE(votes.craque_titles, 0) * 50 + 
   COALESCE(ratings.avg_rating, 0) * 5)::INTEGER as ranking_score
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_matches,
    COUNT(*) FILTER (WHERE position = 'linha') as matches_as_linha,
    COUNT(*) FILTER (WHERE position = 'goleiro') as matches_as_goleiro
  FROM public.registrations 
  WHERE status = 'confirmado' AND user_id IS NOT NULL
  GROUP BY user_id
) matches ON p.id = matches.user_id
LEFT JOIN (
  SELECT 
    rated_id,
    ROUND(AVG(skill_rating)::numeric, 1) as avg_rating,
    COUNT(*) as total_ratings
  FROM public.player_ratings
  GROUP BY rated_id
) ratings ON p.id = ratings.rated_id
LEFT JOIN (
  SELECT 
    voted_for_id,
    COUNT(DISTINCT baba_id) FILTER (WHERE vote_rank = 1) as craque_titles,
    COUNT(*) as total_votes_received
  FROM (
    SELECT 
      voted_for_id,
      baba_id,
      RANK() OVER (PARTITION BY baba_id ORDER BY COUNT(*) DESC) as vote_rank
    FROM public.baba_votes
    GROUP BY voted_for_id, baba_id
  ) ranked_votes
  GROUP BY voted_for_id
) votes ON p.id = votes.voted_for_id;

-- Grant access to the view
GRANT SELECT ON public.player_statistics TO anon, authenticated;