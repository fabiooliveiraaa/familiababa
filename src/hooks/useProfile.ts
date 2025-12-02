import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface PlayerRating {
  id: string;
  rater_id: string;
  rated_id: string;
  skill_rating: number;
  comment: string | null;
  created_at: string;
  rater?: Profile;
}

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };

  const fetchRatings = async () => {
    if (!userId) return;

    const { data: ratingsData, error: ratingsError } = await supabase
      .from('player_ratings')
      .select('*')
      .eq('rated_id', userId)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      setLoading(false);
      return;
    }

    if (!ratingsData || ratingsData.length === 0) {
      setRatings([]);
      setAverageRating(0);
      setLoading(false);
      return;
    }

    // Fetch rater profiles
    const raterIds = ratingsData.map(r => r.rater_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', raterIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const ratingsWithProfiles = ratingsData.map(r => ({
      ...r,
      rater: profilesMap.get(r.rater_id)
    })) as PlayerRating[];

    setRatings(ratingsWithProfiles);
    
    const avg = ratingsData.reduce((sum, r) => sum + r.skill_rating, 0) / ratingsData.length;
    setAverageRating(Math.round(avg * 10) / 10);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      Promise.all([fetchProfile(), fetchRatings()]).then(() => setLoading(false));
    }
  }, [userId]);

  const updateProfile = async (updates: Partial<Profile>) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Perfil atualizado!' });
    fetchProfile();
    return true;
  };

  const uploadAvatar = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    // Delete old avatar if exists
    await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Erro ao enviar foto', description: uploadError.message, variant: 'destructive' });
      return false;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    
    await updateProfile({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` });
    return true;
  };

  const ratePlayer = async (raterId: string, skillRating: number, comment?: string) => {
    const { error } = await supabase
      .from('player_ratings')
      .upsert({
        rater_id: raterId,
        rated_id: userId,
        skill_rating: skillRating,
        comment: comment || null,
      }, { onConflict: 'rater_id,rated_id' });

    if (error) {
      console.error('Error rating player:', error);
      toast({ title: 'Erro ao avaliar jogador', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Avaliação enviada!' });
    fetchRatings();
    return true;
  };

  const getUserRating = (raterId: string) => {
    return ratings.find(r => r.rater_id === raterId);
  };

  return { profile, ratings, averageRating, loading, updateProfile, uploadAvatar, ratePlayer, getUserRating, refetch: () => { fetchProfile(); fetchRatings(); } };
}