import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Baba {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  price: number;
  max_linha_players: number;
  max_goleiros: number;
  is_open: boolean;
  created_by: string;
  created_at: string;
  pix_key: string | null;
}

export interface Registration {
  id: string;
  baba_id: string;
  user_id: string | null;
  position: 'linha' | 'goleiro';
  status: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera';
  registered_at: string;
  payment_proof_url: string | null;
  is_mensalista: boolean;
  waiting_position: number | null;
  manual_name: string | null;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export function useBabas() {
  const [babas, setBabas] = useState<Baba[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBabas = async () => {
    const { data, error } = await supabase
      .from('babas')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching babas:', error);
      toast({ title: 'Erro ao carregar babas', variant: 'destructive' });
    } else {
      setBabas(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBabas();

    const channel = supabase
      .channel('babas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'babas' }, () => {
        fetchBabas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createBaba = async (babaData: Omit<Baba, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('babas')
      .insert(babaData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating baba:', error);
      toast({ title: 'Erro ao criar baba', description: error.message, variant: 'destructive' });
      return null;
    }
    
    toast({ title: 'Baba criado com sucesso!' });
    return data;
  };

  const toggleBabaOpen = async (babaId: string, isOpen: boolean) => {
    const { error } = await supabase
      .from('babas')
      .update({ is_open: !isOpen })
      .eq('id', babaId);
    
    if (error) {
      console.error('Error toggling baba:', error);
      toast({ title: 'Erro ao atualizar baba', variant: 'destructive' });
    }
  };

  const deleteBaba = async (babaId: string) => {
    const { error } = await supabase
      .from('babas')
      .delete()
      .eq('id', babaId);
    
    if (error) {
      console.error('Error deleting baba:', error);
      toast({ title: 'Erro ao excluir baba', variant: 'destructive' });
      return false;
    }
    
    toast({ title: 'Baba excluído com sucesso!' });
    return true;
  };

  return { babas, loading, createBaba, toggleBabaOpen, deleteBaba, refetch: fetchBabas };
}

export function useBabaRegistrations(babaId: string) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    // Fetch registrations
    const { data: regsData, error: regsError } = await supabase
      .from('registrations')
      .select('*')
      .eq('baba_id', babaId)
      .order('registered_at', { ascending: true });
    
    if (regsError) {
      console.error('Error fetching registrations:', regsError);
      setLoading(false);
      return;
    }

    if (!regsData || regsData.length === 0) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for all users
    const userIds = regsData.map(r => r.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds);

    // Merge profiles with registrations
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    const merged = regsData.map(reg => ({
      ...reg,
      profiles: profilesMap.get(reg.user_id) || undefined
    })) as Registration[];

    setRegistrations(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (babaId) {
      fetchRegistrations();

      const channel = supabase
        .channel(`registrations-${babaId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'registrations',
          filter: `baba_id=eq.${babaId}`
        }, () => {
          fetchRegistrations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [babaId]);

  const register = async (userId: string, position: 'linha' | 'goleiro', paymentProofUrl?: string, isWaitingList = false) => {
    // Goleiros go directly to confirmed status
    let status: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera' = position === 'goleiro' ? 'confirmado' : 'inscrito';
    let waitingPosition: number | null = null;
    
    if (isWaitingList) {
      status = 'lista_espera';
      // Get next waiting position
      const { data: waitingData } = await supabase
        .from('registrations')
        .select('waiting_position')
        .eq('baba_id', babaId)
        .eq('status', 'lista_espera')
        .order('waiting_position', { ascending: false })
        .limit(1);
      
      waitingPosition = (waitingData?.[0]?.waiting_position || 0) + 1;
    }
    
    const { error } = await supabase
      .from('registrations')
      .insert({
        baba_id: babaId,
        user_id: userId,
        position,
        status,
        payment_proof_url: paymentProofUrl || null,
        waiting_position: waitingPosition,
      });
    
    if (error) {
      console.error('Error registering:', error);
      if (error.code === '23505') {
        toast({ title: 'Você já está inscrito neste baba', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao se inscrever', description: error.message, variant: 'destructive' });
      }
      return false;
    }
    
    toast({ title: isWaitingList ? 'Adicionado à lista de espera!' : 'Inscrição realizada!' });
    return true;
  };

  const registerMensalista = async (manualName: string) => {
    if (!manualName.trim()) {
      toast({ title: 'Digite o nome do mensalista', variant: 'destructive' });
      return false;
    }
    
    const { error } = await supabase
      .from('registrations')
      .insert({
        baba_id: babaId,
        position: 'linha',
        status: 'confirmado',
        is_mensalista: true,
        manual_name: manualName.trim(),
      });
    
    if (error) {
      console.error('Error registering mensalista:', error);
      toast({ title: 'Erro ao adicionar mensalista', description: error.message, variant: 'destructive' });
      return false;
    }
    
    toast({ title: 'Mensalista adicionado!' });
    return true;
  };

  const promoteFromWaitingList = async (userId: string) => {
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'confirmado', waiting_position: null })
      .eq('baba_id', babaId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error promoting from waiting list:', error);
      toast({ title: 'Erro ao promover jogador', variant: 'destructive' });
      return false;
    }
    
    toast({ title: 'Jogador promovido para lista principal!' });
    return true;
  };

  const updateStatus = async (userId: string, status: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera') => {
    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('baba_id', babaId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const removeRegistration = async (registrationId: string) => {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registrationId);
    
    if (error) {
      console.error('Error removing registration:', error);
      toast({ title: 'Erro ao remover jogador', variant: 'destructive' });
      return false;
    }
    
    toast({ title: 'Jogador removido da lista!' });
    return true;
  };

  return { registrations, loading, register, registerMensalista, promoteFromWaitingList, updateStatus, removeRegistration, refetch: fetchRegistrations };
}
