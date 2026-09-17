import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet';
}

const ACCENTS: Record<NonNullable<KpiCardProps['accent']>, string> = {
  brand: 'text-brand-300 bg-brand-500/15',
  emerald: 'text-emerald-300 bg-emerald-500/15',
  amber: 'text-amber-300 bg-amber-500/15',
  rose: 'text-rose-300 bg-rose-500/15',
  violet: 'text-violet-300 bg-violet-500/15',
};

export default function KpiCard({ label, value, sub, icon: Icon, accent = 'brand' }: KpiCardProps) {
  return (
    <div className="card p-4 md:p-5 flex items-center gap-4">
      <div className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 ${ACCENTS[accent]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 truncate">{label}</div>
        <div className="text-2xl font-bold text-slate-100 leading-tight">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
