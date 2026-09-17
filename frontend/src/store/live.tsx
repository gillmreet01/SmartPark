import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api, API_BASE } from '../api/client';
import type { DashboardStats, ParkingSlot, SensorEvent } from '../api/types';

interface LiveContextValue {
  slots: ParkingSlot[];
  stats: DashboardStats | null;
  events: SensorEvent[];
  connected: boolean;
  refresh: () => Promise<void>;
}

const LiveContext = createContext<LiveContextValue | undefined>(undefined);
const MAX_EVENTS = 60;

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<SensorEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const refresh = useCallback(async () => {
    const [s, d, e] = await Promise.all([api.slots(), api.dashboard(), api.events()]);
    setSlots(s);
    setStats(d);
    setEvents(e.slice(0, MAX_EVENTS));
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe('/topic/slots', (msg) => {
          const slot = JSON.parse(msg.body) as ParkingSlot;
          setSlots((prev) => {
            const idx = prev.findIndex((s) => s.id === slot.id);
            if (idx === -1) return [...prev, slot];
            const next = prev.slice();
            next[idx] = slot;
            return next;
          });
        });
        client.subscribe('/topic/stats', (msg) => {
          setStats(JSON.parse(msg.body) as DashboardStats);
        });
        client.subscribe('/topic/events', (msg) => {
          const event = JSON.parse(msg.body) as SensorEvent;
          setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;
    return () => {
      client.deactivate().catch(() => undefined);
      clientRef.current = null;
    };
  }, [refresh]);

  return (
    <LiveContext.Provider value={{ slots, stats, events, connected, refresh }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLive must be used within LiveDataProvider');
  return ctx;
}
