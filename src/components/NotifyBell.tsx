import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  isSubscribed,
  notificationsSupported,
  requestPermission,
  setSubscribed,
} from '@/lib/babaNotifications';

interface NotifyBellProps {
  babaId: string;
  className?: string;
  full?: boolean;
}

export function NotifyBell({ babaId, className, full }: NotifyBellProps) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSubscribed(babaId));
  }, [babaId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (on) {
      setSubscribed(babaId, false);
      setOn(false);
      toast({ title: 'Avisos desativados' });
      return;
    }

    if (!notificationsSupported()) {
      toast({ title: 'Seu navegador não suporta notificações', variant: 'destructive' });
      return;
    }

    const granted = await requestPermission();
    if (!granted) {
      toast({
        title: 'Permissão negada',
        description: 'Libere as notificações do navegador para receber os avisos.',
        variant: 'destructive',
      });
      return;
    }

    setSubscribed(babaId, true);
    setOn(true);
    toast({
      title: '🔔 Avisos ativados',
      description: 'Você será avisado quando as inscrições abrirem e quando fecharem.',
    });
  };

  return (
    <Button
      type="button"
      variant={on ? 'secondary' : 'outline'}
      size={full ? 'default' : 'icon'}
      onClick={toggle}
      aria-label={on ? 'Desativar avisos' : 'Avisar quando abrir'}
      className={`${full ? 'w-full h-11 text-sm font-semibold' : 'h-9 w-9 shrink-0'} ${className ?? ''}`}
    >
      {on ? (
        <BellRing className={`h-4 w-4 ${full ? 'mr-2' : ''} text-primary`} />
      ) : (
        <Bell className={`h-4 w-4 ${full ? 'mr-2' : ''}`} />
      )}
      {full && (on ? 'Avisos ativados' : 'Avise-me quando abrir')}
    </Button>
  );
}
