import type { SlotStatus, SlotType } from '../api/types';

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export function money(amount: number | null | undefined, currency = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const value = (amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${value}`;
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clockTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function durationSince(iso?: string | null): string {
  if (!iso) return '—';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const STATUS_META: Record<SlotStatus, { label: string; text: string; bg: string; dot: string }> = {
  FREE: { label: 'Free', text: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
  OCCUPIED: { label: 'Occupied', text: 'text-rose-300', bg: 'bg-rose-500/15', dot: 'bg-rose-400' },
  RESERVED: { label: 'Reserved', text: 'text-amber-300', bg: 'bg-amber-500/15', dot: 'bg-amber-400' },
  OUT_OF_SERVICE: { label: 'Offline', text: 'text-slate-400', bg: 'bg-slate-500/15', dot: 'bg-slate-500' },
};

export const TYPE_META: Record<SlotType, { label: string; glyph: string }> = {
  CAR: { label: 'Car', glyph: '🚗' },
  BIKE: { label: 'Bike', glyph: '🏍️' },
  EV: { label: 'EV', glyph: '⚡' },
  HANDICAP: { label: 'Accessible', glyph: '♿' },
  TRUCK: { label: 'Truck', glyph: '🚚' },
};
