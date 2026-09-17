import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, XCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../store/auth';
import { useLive } from '../store/live';
import { clockTime } from '../lib/format';
import type { Reservation } from '../api/types';

function defaultRange() {
  const from = new Date(Date.now() + 30 * 60000);
  const to = new Date(Date.now() + 2 * 60 * 60000);
  const fmt = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { from: fmt(from), to: fmt(to) };
}

const STATUS_STYLES: Record<Reservation['status'], string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-300',
  PENDING: 'bg-amber-500/15 text-amber-300',
  FULFILLED: 'bg-brand-500/15 text-brand-300',
  CANCELLED: 'bg-slate-500/15 text-slate-400',
  EXPIRED: 'bg-rose-500/15 text-rose-300',
};

export default function Reservations() {
  const { isAuthenticated } = useAuth();
  const { slots, refresh: refreshLive } = useLive();
  const [list, setList] = useState<Reservation[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const range = useMemo(defaultRange, []);
  const [form, setForm] = useState({
    slotId: '',
    plate: '',
    customerName: '',
    fromTime: range.from,
    toTime: range.to,
  });

  const bookable = useMemo(() => slots.filter((s) => s.status === 'FREE' || s.status === 'RESERVED'), [slots]);

  const load = useCallback(async () => {
    setList(await api.reservations());
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const create = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api.createReservation({
        slotId: form.slotId,
        plate: form.plate.trim(),
        customerName: form.customerName.trim() || undefined,
        fromTime: new Date(form.fromTime).toISOString(),
        toTime: new Date(form.toTime).toISOString(),
      });
      setMsg({ kind: 'ok', text: 'Reservation created.' });
      setForm((f) => ({ ...f, plate: '', customerName: '' }));
      await Promise.all([load(), refreshLive()]);
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Could not create reservation' });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    setBusy(true);
    try {
      await api.cancelReservation(id);
      await Promise.all([load(), refreshLive()]);
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Cancel failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">Reservations</h1>
        <p className="text-sm text-slate-500">Pre-book a specific bay for a time window; the bay is held automatically.</p>
      </div>

      {msg && (
        <div
          className={`text-sm rounded-xl px-4 py-2.5 border ${
            msg.kind === 'ok'
              ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
              : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <CalendarPlus size={17} className="text-brand-400" /> New reservation
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label">Bay</label>
              <select
                className="input"
                value={form.slotId}
                onChange={(e) => setForm({ ...form, slotId: e.target.value })}
                disabled={!isAuthenticated}
              >
                <option value="">Select a bay…</option>
                {bookable.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.type} · L{s.floor}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Plate</label>
              <input
                className="input font-mono"
                placeholder="DL04CX1234"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <label className="label">Customer name (optional)</label>
              <input
                className="input"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                disabled={!isAuthenticated}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">From</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.fromTime}
                  onChange={(e) => setForm({ ...form, fromTime: e.target.value })}
                  disabled={!isAuthenticated}
                />
              </div>
              <div>
                <label className="label">To</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.toTime}
                  onChange={(e) => setForm({ ...form, toTime: e.target.value })}
                  disabled={!isAuthenticated}
                />
              </div>
            </div>
            <button
              className="btn-primary w-full"
              disabled={!isAuthenticated || busy || !form.slotId || form.plate.trim().length < 3}
              onClick={create}
            >
              <CalendarPlus size={16} /> Create reservation
            </button>
            {!isAuthenticated && (
              <p className="text-[11px] text-amber-300/80">Operator sign-in required to book.</p>
            )}
          </div>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-base-800">
            <h3 className="font-semibold text-slate-100">All reservations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-base-800">
                  <th className="px-5 py-2.5 font-medium">Bay</th>
                  <th className="px-5 py-2.5 font-medium">Plate</th>
                  <th className="px-5 py-2.5 font-medium">Customer</th>
                  <th className="px-5 py-2.5 font-medium">Window</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No reservations yet.</td>
                  </tr>
                )}
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-base-800/60 hover:bg-base-800/40">
                    <td className="px-5 py-3 font-mono text-slate-200">{r.slotCode}</td>
                    <td className="px-5 py-3 font-mono text-slate-300">{r.plate}</td>
                    <td className="px-5 py-3 text-slate-400">{r.customerName || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {clockTime(r.fromTime)} → {clockTime(r.toTime)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`chip ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(r.status === 'ACTIVE' || r.status === 'PENDING') && isAuthenticated ? (
                        <button
                          className="btn-ghost py-1 px-3 text-xs"
                          disabled={busy}
                          onClick={() => cancel(r.id)}
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
