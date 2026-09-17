import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid3x3,
  TicketCheck,
  CalendarClock,
  BarChart3,
  LogIn,
  LogOut,
  Radio,
  SquareParking,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLive } from '../store/live';
import { useAuth } from '../store/auth';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/map', label: 'Live Map', icon: Grid3x3, end: false },
  { to: '/sessions', label: 'Gate & Sessions', icon: TicketCheck, end: false },
  { to: '/reservations', label: 'Reservations', icon: CalendarClock, end: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, end: false },
];

export default function AppLayout() {
  const { connected } = useLive();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-base-800 bg-base-900/60 backdrop-blur">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-base-800">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-brand-500 text-base-950">
            <SquareParking size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-slate-100 leading-tight">SmartPark</div>
            <div className="text-[11px] text-slate-500">IoT Parking Console</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 shadow-glow'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-base-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-base-800 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Radio size={13} className={connected ? 'text-emerald-400' : 'text-slate-600'} />
            <span>{connected ? 'Live feed connected' : 'Reconnecting…'}</span>
          </div>
          <div className="mt-1">v1.0 · Spring Boot · MongoDB</div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-base-800 bg-base-900/40 backdrop-blur flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <SquareParking size={20} className="text-brand-400" />
            <span className="font-bold">SmartPark</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span
              className={`chip ${
                connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? 'bg-emerald-400 animate-pulseSoft' : 'bg-slate-500'
                }`}
              />
              {connected ? 'Sensors online' : 'Offline'}
            </span>
            <span className="chip bg-base-800 text-slate-400 font-mono">
              {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-100">{user?.displayName}</div>
                  <div className="text-[11px] text-slate-500">{user?.role?.replace('ROLE_', '')}</div>
                </div>
                <button className="btn-ghost" onClick={logout}>
                  <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => navigate('/login')}>
                <LogIn size={16} /> Operator sign in
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
