import { CarFront, CircleParking, CircleDollarSign, Car, CalendarClock, Gauge } from 'lucide-react';
import { useLive } from '../store/live';
import KpiCard from '../components/KpiCard';
import LiveFeed from '../components/LiveFeed';
import { money, TYPE_META } from '../lib/format';
import type { SlotType } from '../api/types';

function OccupancyRing({ rate }: { rate: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (rate / 100) * c;
  return (
    <div className="relative grid place-items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1f2a3a" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="url(#grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-slate-100">{rate.toFixed(0)}%</div>
        <div className="text-[11px] text-slate-500">occupied</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats } = useLive();

  if (!stats) {
    return <div className="text-slate-500 py-20 text-center">Loading live metrics…</div>;
  }

  const maxType = Math.max(1, ...Object.values(stats.byType));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">Operations Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time occupancy across all floors, updated live from IoT sensors.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 md:gap-4">
        <KpiCard label="Occupancy" value={`${stats.occupancyRate.toFixed(0)}%`} icon={Gauge} accent="brand" sub={`${stats.totalSlots} total bays`} />
        <KpiCard label="Free bays" value={`${stats.free}`} icon={CircleParking} accent="emerald" />
        <KpiCard label="Occupied" value={`${stats.occupied}`} icon={CarFront} accent="rose" />
        <KpiCard label="Reserved" value={`${stats.reserved}`} icon={CalendarClock} accent="amber" />
        <KpiCard label="Vehicles today" value={`${stats.vehiclesToday}`} icon={Car} accent="violet" />
        <KpiCard label="Revenue today" value={money(stats.revenueToday, stats.currency)} icon={CircleDollarSign} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold text-slate-100 mb-4">Capacity overview</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <OccupancyRing rate={stats.occupancyRate} />

            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Free" value={stats.free} tone="text-emerald-300" />
                <MiniStat label="Occupied" value={stats.occupied} tone="text-rose-300" />
                <MiniStat label="Offline" value={stats.outOfService} tone="text-slate-400" />
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-2">Occupancy by floor</div>
                <div className="space-y-2">
                  {stats.floors.map((f) => (
                    <div key={f.floor} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-14 shrink-0">Level {f.floor}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-base-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-blue-500"
                          style={{ width: `${f.occupancyRate}%`, transition: 'width 0.6s ease' }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-right">{f.occupancyRate.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-base-800">
            <div className="text-xs text-slate-500 mb-3">Bays by vehicle type</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-lg">{TYPE_META[type as SlotType]?.glyph ?? '🚗'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{TYPE_META[type as SlotType]?.label ?? type}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-base-800 overflow-hidden">
                      <div className="h-full bg-brand-500/70" style={{ width: `${(count / maxType) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 min-h-[420px]">
          <LiveFeed limit={14} />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl bg-base-850 border border-base-800 px-3 py-2.5 text-center">
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
