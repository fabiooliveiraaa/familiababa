-- Create baba votes table
CREATE TABLE public.baba_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  baba_id UUID NOT NULL REFERENCES public.babas(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_for_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(baba_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.baba_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Votes are viewable by everyone"
ON public.baba_votes FOR SELECT
USING (true);

CREATE POLICY "Participants can vote"
ON public.baba_votes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = voter_id 
  AND auth.uid() != voted_for_id
  AND EXISTS (
    SELECT 1 FROM public.registrations 
    WHERE baba_id = baba_votes.baba_id 
    AND user_id = auth.uid() 
    AND status = 'confirmado'
  )
);

CREATE POLICY "Users can update their vote"
ON public.baba_votes FOR UPDATE
TO authenticated
USING (auth.uid() = voter_id);

CREATE POLICY "Users can delete their vote"
ON public.baba_votes FOR DELETE
TO authenticated
USING (auth.uid() = voter_id);

-- Enable realtime for votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.baba_votes;