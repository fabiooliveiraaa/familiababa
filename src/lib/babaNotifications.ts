const SUB_KEY = 'baba_notify_subs';
const PHASE_KEY = 'baba_notify_phases';

export type BabaPhase = 'soon' | 'open' | 'closed';

function readMap(key: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function writeMap(key: string, value: Record<string, string>) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSubscriptions(): string[] {
  return Object.keys(readMap(SUB_KEY));
}

export function isSubscribed(babaId: string) {
  return babaId in readMap(SUB_KEY);
}

export function setSubscribed(babaId: string, on: boolean) {
  const map = readMap(SUB_KEY);
  if (on) map[babaId] = '1';
  else delete map[babaId];
  writeMap(SUB_KEY, map);
}

export function getPhase(babaId: string): BabaPhase | null {
  return (readMap(PHASE_KEY)[babaId] as BabaPhase) ?? null;
}

export function setPhase(babaId: string, phase: BabaPhase) {
  const map = readMap(PHASE_KEY);
  map[babaId] = phase;
  writeMap(PHASE_KEY, map);
}

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionStatus(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function pushNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico', tag: title + body });
  } catch {
    /* ignore */
  }
}
