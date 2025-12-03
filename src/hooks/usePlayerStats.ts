import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerStats {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_matches: number;
  matches_as_linha: number;
  matches_as_goleiro: number;
  avg_rating: number;
  total_ratings: number;
  craque_titles: number;
  total_votes_received: number;
  ranking_score: number;
}

export interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const ACHIEVEMENTS: Record<string, Omit<Achievement, 'id' | 'type'>> = {
  first_match: {
    name: 'Estreante',
    description: 'Participou do primeiro baba',
    icon: '⚽',
    color: 'bg-green-500'
  },
  veteran_10: {
    name: 'Veterano',
    description: 'Participou de 10 babas',
    icon: '🏅',
    color: 'bg-blue-500'
  },
  veteran_25: {
    name: 'Lenda',
    description: 'Participou de 25 babas',
    icon: '🏆',
    color: 'bg-purple-500'
  },
  craque_1: {
    name: 'Craque',
    description: 'Eleito melhor do baba',
    icon: '⭐',
    color: 'bg-yellow-500'
  },
  craque_5: {
    name: 'Artilheiro',
    description: '5x melhor do baba',
    icon: '👑',
    color: 'bg-orange-500'
  },
  top_rated: {
    name: 'Talentoso',
    description: 'Avaliação média acima de 4 estrelas',
    icon: '💎',
    color: 'bg-cyan-500'
  },
  goleiro_5: {
    name: 'Paredão',
    description: '5 babas como goleiro',
    icon: '🧤',
    color: 'bg-red-500'
  }
};

export function usePlayerStats(userId?: string) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      // Fetch from view
      const { data, error } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setStats(data as PlayerStats);
        calculateAchievements(data as PlayerStats);
      }
      setLoading(false);
    };

    fetchStats();
  }, [userId]);

  const calculateAchievements = (playerStats: PlayerStats) => {
    const earned: Achievement[] = [];

    if (playerStats.total_matches >= 1) {
      earned.push({ id: '1', type: 'first_match', ...ACHIEVEMENTS.first_match });
    }
    if (playerStats.total_matches >= 10) {
      earned.push({ id: '2', type: 'veteran_10', ...ACHIEVEMENTS.veteran_10 });
    }
    if (playerStats.total_matches >= 25) {
      earned.push({ id: '3', type: 'veteran_25', ...ACHIEVEMENTS.veteran_25 });
    }
    if (playerStats.craque_titles >= 1) {
      earned.push({ id: '4', type: 'craque_1', ...ACHIEVEMENTS.craque_1 });
    }
    if (playerStats.craque_titles >= 5) {
      earned.push({ id: '5', type: 'craque_5', ...ACHIEVEMENTS.craque_5 });
    }
    if (playerStats.avg_rating >= 4) {
      earned.push({ id: '6', type: 'top_rated', ...ACHIEVEMENTS.top_rated });
    }
    if (playerStats.matches_as_goleiro >= 5) {
      earned.push({ id: '7', type: 'goleiro_5', ...ACHIEVEMENTS.goleiro_5 });
    }

    setAchievements(earned);
  };

  return { stats, achievements, loading };
}

export function useRanking(limit: number = 10) {
  const [ranking, setRanking] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data, error } = await supabase
        .from('player_statistics')
        .select('*')
        .gt('total_matches', 0)
        .order('ranking_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching ranking:', error);
        setLoading(false);
        return;
      }

      setRanking((data as PlayerStats[]) || []);
      setLoading(false);
    };

    fetchRanking();
  }, [limit]);

  return { ranking, loading };
}
