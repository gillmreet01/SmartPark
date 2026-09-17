import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquareParking, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../store/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-1.5 mb-6"
        >
          <ArrowLeft size={15} /> Back to live dashboard
        </button>

        <div className="card p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500 text-base-950">
              <SquareParking size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div className="font-extrabold text-lg text-slate-100 leading-tight">SmartPark</div>
              <div className="text-xs text-slate-500">Operator console sign in</div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 mt-5 text-center">
            Demo credentials pre-filled · <span className="font-mono">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
