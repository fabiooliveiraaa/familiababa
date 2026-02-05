-- Add teams_data column to store published team draw results
ALTER TABLE public.babas 
ADD COLUMN teams_data jsonb DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN public.babas.teams_data IS 'Stores published team draw results: { times: [...], goleirosExcluidos?: [...], publishedAt: timestamp }';