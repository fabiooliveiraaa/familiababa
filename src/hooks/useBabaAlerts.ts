import { useEffect } from 'react';
import { Baba } from '@/hooks/useBabas';
import { isRegistrationLive, useNow } from '@/lib/registrationSchedule';
import {
  BabaPhase,
  getPhase,
  isSubscribed,
  pushNotification,
  setPhase,
} from '@/lib/babaNotifications';
import { toast } from '@/hooks/use-toast';

function phaseOf(baba: Baba, now: Date): BabaPhase {
  if (!baba.is_open) return 'closed';
  return isRegistrationLive(baba, now) ? 'open' : 'soon';
}

/** Watches subscribed babas and alerts when registrations open or close. */
export function useBabaAlerts(babas: Baba[]) {
  const now = useNow(5000);

  useEffect(() => {
    babas.forEach((baba) => {
      const current = phaseOf(baba, now);
      const previous = getPhase(baba.id);

      if (previous === current) return;
      setPhase(baba.id, current);

      if (!previous || !isSubscribed(baba.id)) return;

      if (previous === 'soon' && current === 'open') {
        pushNotification('Inscrições abertas! ⚽', `${baba.title} — corre pra garantir sua vaga.`);
        toast({ title: '⚽ Inscrições abertas!', description: baba.title });
      }

      if (previous === 'open' && current === 'closed') {
        pushNotification('Inscrições encerradas 🔒', `${baba.title} — a lista foi fechada.`);
        toast({ title: '🔒 Inscrições encerradas', description: baba.title });
      }
    });
  }, [babas, now]);
}
