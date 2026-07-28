import { useEffect, useState } from 'react';

export interface SchedulableBaba {
  is_open: boolean;
  registration_opens_at?: string | null;
}

/** Registrations are live only when the baba is open AND the scheduled moment has passed. */
export function isRegistrationLive(baba: SchedulableBaba, now: Date = new Date()) {
  if (!baba.is_open) return false;
  if (!baba.registration_opens_at) return true;
  return new Date(baba.registration_opens_at).getTime() <= now.getTime();
}

export function isScheduledSoon(baba: SchedulableBaba, now: Date = new Date()) {
  return baba.is_open && !!baba.registration_opens_at && !isRegistrationLive(baba, now);
}

export function formatCountdown(target: string, now: Date = new Date()) {
  const diff = new Date(target).getTime() - now.getTime();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

/** Ticks every second so the UI flips to "open" automatically. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
