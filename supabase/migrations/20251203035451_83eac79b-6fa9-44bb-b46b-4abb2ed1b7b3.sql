-- Add is_champion column to registrations table
ALTER TABLE public.registrations ADD COLUMN is_champion boolean NOT NULL DEFAULT false;

-- Update the player_statistics view to properly count champion wins
DROP VIEW IF EXISTS public.player_statistics;

CREATE VIEW public.player_statistics AS
SELECT 
  p.id as user_id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  COALESCE(match_stats.total_matches, 0) as total_matches,
  COALESCE(match_stats.matches_as_linha, 0) as matches_as_linha,
  COALESCE(match_stats.matches_as_goleiro, 0) as matches_as_goleiro,
  COALESCE(ROUND(rating_stats.avg_rating, 2), 0) as avg_rating,
  COALESCE(rating_stats.total_ratings, 0) as total_ratings,
  COALESCE(title_stats.craque_titles, 0) as craque_titles,
  COALESCE(title_stats.best_goalkeeper_titles, 0) as best_goalkeeper_titles,
  COALESCE(title_stats.worst_player_count, 0) as worst_player_count,
  COALESCE(champion_stats.champion_wins, 0) as champion_wins,
  COALESCE(vote_stats.total_votes_received, 0) as total_votes_received,
  (
    COALESCE(match_stats.total_matches, 0) * 10 +
    COALESCE(title_stats.craque_titles, 0) * 2 +
    COALESCE(title_stats.best_goalkeeper_titles, 0) * 2 +
    COALESCE(champion_stats.champion_wins, 0) * 5 -
    COALESCE(title_stats.worst_player_count, 0) * 1
  )::integer as ranking_score
FROM profiles p
LEFT JOIN (
  SELECT 
    r.user_id,
    COUNT(DISTINCT r.baba_id) as total_matches,
    COUNT(DISTINCT CASE WHEN r.position = 'linha' THEN r.baba_id END) as matches_as_linha,
    COUNT(DISTINCT CASE WHEN r.position = 'goleiro' THEN r.baba_id END) as matches_as_goleiro
  FROM registrations r
  WHERE r.status = 'confirmado' AND r.user_id IS NOT NULL
  GROUP BY r.user_id
) match_stats ON p.id = match_stats.user_id
LEFT JOIN (
  SELECT 
    rated_id,
    AVG(skill_rating) as avg_rating,
    COUNT(*) as total_ratings
  FROM player_ratings
  GROUP BY rated_id
) rating_stats ON p.id = rating_stats.rated_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as champion_wins
  FROM registrations
  WHERE is_champion = true AND user_id IS NOT NULL
  GROUP BY user_id
) champion_stats ON p.id = champion_stats.user_id
LEFT JOIN (
  SELECT 
    p.id as user_id,
    COUNT(DISTINCT CASE WHEN b.best_player_id = p.id THEN b.id END) as craque_titles,
    COUNT(DISTINCT CASE WHEN b.best_goalkeeper_id = p.id THEN b.id END) as best_goalkeeper_titles,
    COUNT(DISTINCT CASE WHEN b.worst_player_id = p.id THEN b.id END) as worst_player_count
  FROM profiles p
  LEFT JOIN babas b ON b.best_player_id = p.id OR b.best_goalkeeper_id = p.id OR b.worst_player_id = p.id
  GROUP BY p.id
) title_stats ON p.id = title_stats.user_id
LEFT JOIN (
  SELECT 
    voted_for_id,
    COUNT(*) as total_votes_received
  FROM baba_votes
  GROUP BY voted_for_id
) vote_stats ON p.id = vote_stats.voted_for_id;