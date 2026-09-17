import { Activity, ArrowDownCircle, ArrowUpCircle, HeartPulse, TriangleAlert } from 'lucide-react';
import { useLive } from '../store/live';
import { clockTime } from '../lib/format';
import type { SensorEvent } from '../api/types';

const EVENT_META: Record<
  SensorEvent['type'],
  { icon: typeof Activity; text: string; verb: string }
> = {
  OCCUPIED: { icon: ArrowDownCircle, text: 'text-rose-400', verb: 'Vehicle parked at' },
  VACATED: { icon: ArrowUpCircle, text: 'text-emerald-400', verb: 'Bay freed at' },
  HEARTBEAT: { icon: HeartPulse, text: 'text-slate-500', verb: 'Heartbeat from' },
  FAULT: { icon: TriangleAlert, text: 'text-amber-400', verb: 'Fault reported at' },
};

export default function LiveFeed({ limit = 12 }: { limit?: number }) {
  const { events } = useLive();
  const shown = events.slice(0, limit);

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <Activity size={17} className="text-brand-400" /> Live sensor feed
        </h3>
        <span className="text-[11px] text-slate-500">real-time · MQTT-style</span>
      </div>
      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1.5">
        {shown.length === 0 && (
          <p className="text-sm text-slate-500 py-6 text-center">Waiting for sensor events…</p>
        )}
        {shown.map((e) => {
          const meta = EVENT_META[e.type];
          const Icon = meta.icon;
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-base-800/60 animate-slideIn"
            >
              <Icon size={16} className={meta.text} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-300 truncate">
                  {meta.verb} <span className="font-mono text-slate-100">{e.slotCode}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {e.sensorId} · {(e.confidence * 100).toFixed(0)}% conf.
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-mono shrink-0">
                {clockTime(e.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
