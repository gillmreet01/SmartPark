import { useCallback, useEffect, useState } from 'react';
import { LogIn, LogOut, Ticket, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../store/auth';
import { clockTime, durationSince, money, TYPE_META } from '../lib/format';
import type { ParkingSession } from '../api/types';

export default function Sessions() {
  const { isAuthenticated } = useAuth();
  const [active, setActive] = useState<ParkingSession[]>([]);
  const [recent, setRecent] = useState<ParkingSession[]>([]);
  const [inPlate, setInPlate] = useState('');
  const [outPlate, setOutPlate] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [a, r] = await Promise.all([api.activeSessions(), api.recentSessions()]);
    setActive(a);
    setRecent(r);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
    const id = setInterval(() => load().catch(() => undefined), 5000);
    return () => clearInterval(id);
  }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ kind: 'ok', text: ok });
      await load();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">Gate & Sessions</h1>
        <p className="text-sm text-slate-500">Admit and release vehicles; billing is computed on exit.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <LogIn size={17} className="text-emerald-400" /> Entry gate
          </h3>
          <label className="label">Vehicle plate</label>
          <input
            className="input font-mono mb-3"
            placeholder="DL04CX1234"
            value={inPlate}
            onChange={(e) => setInPlate(e.target.value)}
            disabled={!isAuthenticated}
          />
          <button
            className="btn-primary w-full"
            disabled={!isAuthenticated || busy || inPlate.trim().length < 3}
            onClick={() => run(() => api.checkIn(inPlate.trim()), `Admitted ${inPlate.toUpperCase()} — nearest free bay assigned`).then(() => setInPlate(''))}
          >
            <LogIn size={16} /> Auto-assign & check in
          </button>
          <p className="text-[11px] text-slate-500 mt-2">Leaves slot blank → nearest free bay is chosen automatically.</p>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <LogOut size={17} className="text-brand-400" /> Exit gate
          </h3>
          <label className="label">Vehicle plate</label>
          <input
            className="input font-mono mb-3"
            placeholder="DL04CX1234"
            value={outPlate}
            onChange={(e) => setOutPlate(e.target.value)}
            disabled={!isAuthenticated}
          />
          <button
            className="btn-ghost w-full"
            disabled={!isAuthenticated || busy || outPlate.trim().length < 3}
            onClick={() =>
              run(async () => {
                const s = await api.checkOut(outPlate.trim());
                setMsg({ kind: 'ok', text: `Released ${s.plate} — fee ${money(s.amount, s.currency)}` });
              }, '').then(() => setOutPlate(''))
            }
          >
            <LogOut size={16} /> Check out & bill
          </button>
          {!isAuthenticated && (
            <p className="text-[11px] text-amber-300/80 mt-2">Operator sign-in required to use the gates.</p>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-800">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <Ticket size={17} className="text-brand-400" /> Active sessions
            <span className="chip bg-base-800 text-slate-400">{active.length}</span>
          </h3>
          <button className="text-slate-500 hover:text-slate-200" onClick={() => load()} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-base-800">
                <th className="px-5 py-2.5 font-medium">Plate</th>
                <th className="px-5 py-2.5 font-medium">Bay</th>
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Entry</th>
                <th className="px-5 py-2.5 font-medium">Duration</th>
                <th className="px-5 py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No active sessions.</td>
                </tr>
              )}
              {active.map((s) => (
                <tr key={s.id} className="border-b border-base-800/60 hover:bg-base-800/40">
                  <td className="px-5 py-3 font-mono text-slate-100">{s.plate}</td>
                  <td className="px-5 py-3 font-mono text-slate-300">{s.slotCode}</td>
                  <td className="px-5 py-3">{TYPE_META[s.vehicleType].glyph} {TYPE_META[s.vehicleType].label}</td>
                  <td className="px-5 py-3 text-slate-400">{clockTime(s.entryTime)}</td>
                  <td className="px-5 py-3 text-slate-300">{durationSince(s.entryTime)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      className="btn-ghost py-1 px-3 text-xs"
                      disabled={!isAuthenticated || busy}
                      onClick={() =>
                        run(async () => {
                          const done = await api.checkOut(s.plate);
                          setMsg({ kind: 'ok', text: `Released ${done.plate} — fee ${money(done.amount, done.currency)}` });
                        }, '')
                      }
                    >
                      Check out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-base-800">
          <h3 className="font-semibold text-slate-100">Recent activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-base-800">
                <th className="px-5 py-2.5 font-medium">Plate</th>
                <th className="px-5 py-2.5 font-medium">Bay</th>
                <th className="px-5 py-2.5 font-medium">Entry</th>
                <th className="px-5 py-2.5 font-medium">Exit</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium text-right">Fee</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="border-b border-base-800/60 hover:bg-base-800/40">
                  <td className="px-5 py-3 font-mono text-slate-200">{s.plate}</td>
                  <td className="px-5 py-3 font-mono text-slate-400">{s.slotCode}</td>
                  <td className="px-5 py-3 text-slate-400">{clockTime(s.entryTime)}</td>
                  <td className="px-5 py-3 text-slate-400">{clockTime(s.exitTime)}</td>
                  <td className="px-5 py-3">
                    <span className={`chip ${s.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-base-800 text-slate-400'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-200">{s.amount != null ? money(s.amount, s.currency) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
