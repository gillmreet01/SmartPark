import { useMemo, useState } from 'react';
import { LogIn, LogOut, Ban, RotateCcw, X } from 'lucide-react';
import { useLive } from '../store/live';
import { useAuth } from '../store/auth';
import { api } from '../api/client';
import { STATUS_META, TYPE_META, durationSince } from '../lib/format';
import StatusBadge from '../components/StatusBadge';
import type { ParkingSlot } from '../api/types';

export default function ParkingMap() {
  const { slots, refresh } = useLive();
  const { isAuthenticated } = useAuth();
  const [floor, setFloor] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const floors = useMemo(
    () => Array.from(new Set(slots.map((s) => s.floor))).sort((a, b) => a - b),
    [slots],
  );
  const floorSlots = useMemo(() => slots.filter((s) => s.floor === floor), [slots, floor]);
  const cols = Math.max(1, ...floorSlots.map((s) => s.x + 1));
  const rows = Math.max(1, ...floorSlots.map((s) => s.y + 1));
  const selected = slots.find((s) => s.id === selectedId) ?? null;

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100">Live Parking Map</h1>
          <p className="text-sm text-slate-500">Each cell is a sensor-monitored bay. Click one to inspect or manage it.</p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-base-850 border border-base-800">
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                f === floor ? 'bg-brand-500 text-base-950' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Level {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5 overflow-x-auto">
          <div className="flex items-center gap-4 mb-4 text-xs">
            {(['FREE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-slate-400">
                <span className={`w-2.5 h-2.5 rounded ${STATUS_META[s].dot}`} /> {STATUS_META[s].label}
              </span>
            ))}
          </div>

          <div
            className="grid gap-2 min-w-[520px]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, auto)` }}
          >
            {floorSlots.map((slot) => (
              <SlotCell
                key={slot.id}
                slot={slot}
                active={slot.id === selectedId}
                onClick={() => {
                  setSelectedId(slot.id);
                  setError(null);
                  setPlate('');
                }}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="card p-5">
          {!selected ? (
            <div className="text-center text-slate-500 py-16">
              <p className="text-sm">Select a bay to see live details.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-slate-100 font-mono">{selected.code}</div>
                  <div className="text-xs text-slate-500">
                    {TYPE_META[selected.type].glyph} {TYPE_META[selected.type].label} · Zone {selected.zone} · Level{' '}
                    {selected.floor}
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-300">
                  <X size={18} />
                </button>
              </div>

              <StatusBadge status={selected.status} />

              <dl className="text-sm space-y-2 pt-1">
                <Row label="Sensor ID" value={<span className="font-mono text-slate-300">{selected.sensorId}</span>} />
                <Row
                  label="Vehicle"
                  value={selected.currentPlate ? <span className="font-mono text-slate-100">{selected.currentPlate}</span> : '—'}
                />
                <Row label="Since" value={durationSince(selected.lastChangedAt)} />
              </dl>

              {error && (
                <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              {isAuthenticated ? (
                <div className="pt-2 space-y-2 border-t border-base-800">
                  {selected.status === 'OCCUPIED' ? (
                    <button
                      className="btn-primary w-full"
                      disabled={busy}
                      onClick={() => act(() => api.checkOut(selected.currentPlate!))}
                    >
                      <LogOut size={16} /> Check out {selected.currentPlate}
                    </button>
                  ) : selected.status === 'OUT_OF_SERVICE' ? (
                    <button
                      className="btn-ghost w-full"
                      disabled={busy}
                      onClick={() => act(() => api.updateSlotStatus(selected.id, 'FREE'))}
                    >
                      <RotateCcw size={16} /> Return to service
                    </button>
                  ) : (
                    <>
                      <input
                        className="input font-mono"
                        placeholder="Plate e.g. DL04CX1234"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                      />
                      <button
                        className="btn-primary w-full"
                        disabled={busy || plate.trim().length < 3}
                        onClick={() => act(() => api.checkIn(plate.trim(), selected.id))}
                      >
                        <LogIn size={16} /> Check in vehicle
                      </button>
                      <button
                        className="btn-ghost w-full"
                        disabled={busy}
                        onClick={() => act(() => api.updateSlotStatus(selected.id, 'OUT_OF_SERVICE'))}
                      >
                        <Ban size={16} /> Mark out of service
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 pt-2 border-t border-base-800">
                  Sign in as an operator to manage this bay.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotCell({ slot, active, onClick }: { slot: ParkingSlot; active: boolean; onClick: () => void }) {
  const meta = STATUS_META[slot.status];
  return (
    <button
      onClick={onClick}
      title={`${slot.code} · ${meta.label}`}
      style={{ gridColumnStart: slot.x + 1, gridRowStart: slot.y + 1 }}
      className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 p-1 transition-all
        ${meta.bg} ${active ? 'ring-2 ring-brand-400 border-brand-400' : 'border-base-700/60 hover:border-base-600'}`}
    >
      <span className="text-[13px] leading-none">{TYPE_META[slot.type].glyph}</span>
      <span className="text-[9px] font-mono text-slate-400 leading-none truncate max-w-full">{slot.code}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${slot.status === 'OCCUPIED' ? 'animate-pulseSoft' : ''}`} />
    </button>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-300 text-right">{value}</dd>
    </div>
  );
}
