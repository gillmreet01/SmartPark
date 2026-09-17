import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, Receipt } from 'lucide-react';
import { api } from '../api/client';
import { money, TYPE_META } from '../lib/format';
import type { Analytics as AnalyticsData, SlotType } from '../api/types';

const PIE_COLORS = ['#22d3ee', '#3b82f6', '#a78bfa', '#f59e0b', '#f43f5e'];

const tooltipStyle = {
  background: '#0e131b',
  border: '1px solid #2a3547',
  borderRadius: 12,
  fontSize: 12,
  color: '#e2e8f0',
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const load = () => api.analytics().then(setData).catch(() => undefined);
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return <div className="text-slate-500 py-20 text-center">Loading analytics…</div>;
  }

  const pieData = Object.entries(data.occupancyByType).map(([name, value]) => ({
    name: TYPE_META[name as SlotType]?.label ?? name,
    value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-100">Analytics</h1>
        <p className="text-sm text-slate-500">Traffic, revenue and utilisation trends across the facility.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatTile icon={<Clock size={18} />} label="Avg. stay" value={`${data.avgDurationMinutes.toFixed(0)} min`} />
        <StatTile icon={<Receipt size={18} />} label="Avg. ticket" value={money(data.avgTicket, data.currency)} />
        <StatTile
          icon={<Receipt size={18} />}
          label="7-day revenue"
          value={money(data.revenueByDay.reduce((a, b) => a + b.value, 0), data.currency)}
        />
        <StatTile
          icon={<Clock size={18} />}
          label="7-day vehicles"
          value={`${data.vehiclesByDay.reduce((a, b) => a + b.value, 0)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Hourly traffic" subtitle="Vehicle entries over the last 24 hours">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.occupancyByHour} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3a" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} interval={2} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" name="Entries" stroke="#22d3ee" strokeWidth={2} fill="url(#trafficFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by day" subtitle="Completed sessions, last 7 days">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.revenueByDay} margin={{ left: -12, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3a" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v, data.currency)} cursor={{ fill: '#18212e' }} />
              <Bar dataKey="value" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vehicles by day" subtitle="Entries per day, last 7 days">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.vehiclesByDay} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3a" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="Vehicles" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Current occupancy mix" subtitle="Occupied bays by vehicle type">
          {pieData.length === 0 ? (
            <div className="h-[260px] grid place-items-center text-slate-500 text-sm">No bays occupied right now.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0e131b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <span className="text-brand-400">{icon}</span>
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
