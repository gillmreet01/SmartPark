// Minimal fetch wrapper with JWT injection and typed helpers.
import type {
  Analytics,
  DashboardStats,
  LoginResponse,
  ParkingSession,
  ParkingSlot,
  Reservation,
  SensorEvent,
  SlotStatus,
} from './types';

const TOKEN_KEY = 'smartpark.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) — auth simply won't persist */
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  slots: () => request<ParkingSlot[]>('/api/slots'),
  updateSlotStatus: (id: string, status: SlotStatus) =>
    request<ParkingSlot>(`/api/slots/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  dashboard: () => request<DashboardStats>('/api/stats/dashboard'),
  analytics: () => request<Analytics>('/api/stats/analytics'),

  activeSessions: () => request<ParkingSession[]>('/api/sessions/active'),
  recentSessions: () => request<ParkingSession[]>('/api/sessions/recent'),
  checkIn: (plate: string, slotId?: string) =>
    request<ParkingSession>('/api/sessions/checkin', {
      method: 'POST',
      body: JSON.stringify({ plate, slotId: slotId ?? null }),
    }),
  checkOut: (plate: string) =>
    request<ParkingSession>('/api/sessions/checkout', {
      method: 'POST',
      body: JSON.stringify({ plate }),
    }),

  reservations: () => request<Reservation[]>('/api/reservations'),
  createReservation: (payload: {
    slotId: string;
    plate: string;
    customerName?: string;
    fromTime: string;
    toTime: string;
  }) =>
    request<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelReservation: (id: string) =>
    request<Reservation>(`/api/reservations/${id}/cancel`, { method: 'POST' }),

  events: () => request<SensorEvent[]>('/api/events/recent'),
};
