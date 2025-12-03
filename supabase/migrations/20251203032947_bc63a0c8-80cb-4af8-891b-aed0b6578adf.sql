-- Add result fields to babas table
ALTER TABLE public.babas 
ADD COLUMN IF NOT EXISTS champion_team text,
ADD COLUMN IF NOT EXISTS best_player_id uuid,
ADD COLUMN IF NOT EXISTS best_goalkeeper_id uuid,
ADD COLUMN IF NOT EXISTS worst_player_id uuid;

-- Drop and recreate the player_statistics view with new scoring formula
DROP VIEW IF EXISTS public.player_statistics;

CREATE VIEW public.player_statistics AS
SELECT 
  p.id as user_id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  -- Total matches participated (confirmado status)
  COALESCE((
    SELECT COUNT(DISTINCT r.baba_id)
    FROM registrations r
    WHERE r.user_id = p.id AND r.status = 'confirmado'
  ), 0) as total_matches,
  -- Matches as linha
  COALESCE((
    SELECT COUNT(DISTINCT r.baba_id)
    FROM registrations r
    WHERE r.user_id = p.id AND r.status = 'confirmado' AND r.position = 'linha'
  ), 0) as matches_as_linha,
  -- Matches as goleiro
  COALESCE((
    SELECT COUNT(DISTINCT r.baba_id)
    FROM registrations r
    WHERE r.user_id = p.id AND r.status = 'confirmado' AND r.position = 'goleiro'
  ), 0) as matches_as_goleiro,
  -- Average rating from player_ratings
  COALESCE((
    SELECT ROUND(AVG(pr.skill_rating)::numeric, 1)
    FROM player_ratings pr
    WHERE pr.rated_id = p.id
  ), 0) as avg_rating,
  -- Total ratings received
  COALESCE((
    SELECT COUNT(*)
    FROM player_ratings pr
    WHERE pr.rated_id = p.id
  ), 0) as total_ratings,
  -- Best player titles (melhor do baba)
  COALESCE((
    SELECT COUNT(*)
    FROM babas b
    WHERE b.best_player_id = p.id
  ), 0) as craque_titles,
  -- Best goalkeeper titles
  COALESCE((
    SELECT COUNT(*)
    FROM babas b
    WHERE b.best_goalkeeper_id = p.id
  ), 0) as best_goalkeeper_titles,
  -- Worst player count
  COALESCE((
    SELECT COUNT(*)
    FROM babas b
    WHERE b.worst_player_id = p.id
  ), 0) as worst_player_count,
  -- Champion team wins
  COALESCE((
    SELECT COUNT(DISTINCT b.id)
    FROM babas b
    JOIN registrations r ON r.baba_id = b.id
    WHERE r.user_id = p.id 
      AND r.status = 'confirmado'
      AND b.champion_team IS NOT NULL
      AND b.champion_team != ''
      -- We'll need team assignment later, for now track from drawn_teams
  ), 0) as champion_wins,
  -- Total votes received in baba_votes
  COALESCE((
    SELECT COUNT(*)
    FROM baba_votes bv
    WHERE bv.voted_for_id = p.id
  ), 0) as total_votes_received,
  -- NEW SCORING: babas 10pt + champion 5pt + best_player 2pt + best_goalkeeper 2pt + worst -1pt
  (
    COALESCE((SELECT COUNT(DISTINCT r.baba_id) FROM registrations r WHERE r.user_id = p.id AND r.status = 'confirmado'), 0) * 10
    + COALESCE((SELECT COUNT(*) FROM babas b WHERE b.best_player_id = p.id), 0) * 2
    + COALESCE((SELECT COUNT(*) FROM babas b WHERE b.best_goalkeeper_id = p.id), 0) * 2
    - COALESCE((SELECT COUNT(*) FROM babas b WHERE b.worst_player_id = p.id), 0) * 1
  )::integer as ranking_score
FROM profiles p;