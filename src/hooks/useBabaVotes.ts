import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BabaVote {
  id: string;
  baba_id: string;
  voter_id: string;
  voted_for_id: string;
  created_at: string;
}

export interface VoteRanking {
  user_id: string;
  vote_count: number;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export function useBabaVotes(babaId: string) {
  const [votes, setVotes] = useState<BabaVote[]>([]);
  const [ranking, setRanking] = useState<VoteRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    const { data, error } = await supabase
      .from('baba_votes')
      .select('*')
      .eq('baba_id', babaId);

    if (error) {
      console.error('Error fetching votes:', error);
      return;
    }

    setVotes(data || []);
    await calculateRanking(data || []);
    setLoading(false);
  };

  const calculateRanking = async (votesData: BabaVote[]) => {
    // Count votes per player
    const voteCount: Record<string, number> = {};
    votesData.forEach(vote => {
      voteCount[vote.voted_for_id] = (voteCount[vote.voted_for_id] || 0) + 1;
    });

    // Get user IDs with votes
    const userIds = Object.keys(voteCount);
    if (userIds.length === 0) {
      setRanking([]);
      return;
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Create ranking sorted by vote count
    const rankingData: VoteRanking[] = userIds
      .map(userId => ({
        user_id: userId,
        vote_count: voteCount[userId],
        profile: profilesMap.get(userId)
      }))
      .sort((a, b) => b.vote_count - a.vote_count);

    setRanking(rankingData);
  };

  useEffect(() => {
    if (babaId) {
      fetchVotes();

      // Real-time subscription
      const channel = supabase
        .channel(`baba-votes-${babaId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'baba_votes',
          filter: `baba_id=eq.${babaId}`
        }, () => {
          console.log('Vote changed, refetching...');
          fetchVotes();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [babaId]);

  const vote = async (voterId: string, votedForId: string) => {
    const { error } = await supabase
      .from('baba_votes')
      .upsert({
        baba_id: babaId,
        voter_id: voterId,
        voted_for_id: votedForId,
      }, { onConflict: 'baba_id,voter_id' });

    if (error) {
      console.error('Error voting:', error);
      toast({ title: 'Erro ao votar', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Voto registrado!' });
    return true;
  };

  const getUserVote = (voterId: string) => {
    return votes.find(v => v.voter_id === voterId);
  };

  return { votes, ranking, loading, vote, getUserVote, refetch: fetchVotes };
}