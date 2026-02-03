import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AppSetting {
  key: string;
  value: string | null;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');
    
    if (error) {
      console.error('Error fetching settings:', error);
    } else {
      const settingsMap = new Map<string, string | null>();
      data?.forEach(s => settingsMap.set(s.key, s.value));
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('app-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSetting = async (key: string, value: string | null) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    
    if (error) {
      console.error('Error updating setting:', error);
      toast({ title: 'Erro ao salvar configuração', variant: 'destructive' });
      return false;
    }
    
    toast({ title: 'Configuração salva!' });
    return true;
  };

  const getSetting = (key: string): string | null => {
    return settings.get(key) ?? null;
  };

  return { settings, loading, getSetting, updateSetting, refetch: fetchSettings };
}
