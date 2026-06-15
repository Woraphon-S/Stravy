import { TranslationKey } from '../i18n/translations';
import { Units } from './types';

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function formatDistance(meters: number, units: Units): string {
  if (units === 'imperial') {
    const miles = meters / 1609.344;
    return `${miles.toFixed(2)} mi`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatElevation(meters: number, units: Units): string {
  if (units === 'imperial') {
    return `${Math.round(meters * 3.28084)} ft`;
  }
  return `${Math.round(meters)} m`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

export function formatPace(speedMps: number, units: Units): string {
  if (speedMps <= 0) return units === 'imperial' ? '--:-- /mi' : '--:-- /km';
  const unitMeters = units === 'imperial' ? 1609.344 : 1000;
  const secondsPerUnit = unitMeters / speedMps;
  const m = Math.floor(secondsPerUnit / 60);
  const s = Math.round(secondsPerUnit % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${m}:${pad(s)} ${units === 'imperial' ? '/mi' : '/km'}`;
}

export function formatSpeed(speedMps: number, units: Units): string {
  const value = units === 'imperial' ? speedMps * 2.236936 : speedMps * 3.6;
  return `${value.toFixed(1)} ${units === 'imperial' ? 'mph' : 'km/h'}`;
}

export function formatCalories(calories: number): string {
  return `${Math.round(calories)} kcal`;
}

export function formatRelativeTime(iso: string, t: Translate): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('time.days', { count: days });
  return new Date(iso).toLocaleDateString();
}

const PACE_TYPES = new Set(['run', 'walk', 'hike']);

export function isPaceType(type: string): boolean {
  return PACE_TYPES.has(type);
}
