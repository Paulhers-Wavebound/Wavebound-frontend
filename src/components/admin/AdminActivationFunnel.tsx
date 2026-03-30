import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid } from 'recharts';
import { useAdminStatsSlice } from './AdminStatsProvider';

interface FunnelData {
  steps: { name: string; count: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground">{d.name}</p>
      <p className="text-sm font-bold text-foreground">{d.count.toLocaleString()} users ({d.pct}%)</p>
      {d.dropoff && <p className="text-xs text-destructive mt-0.5">{d.dropoff} drop-off</p>}
    </div>
  );
};

const GRADIENT_COLORS = [
  { start: 'hsl(220, 90%, 56%)', end: 'hsl(220, 90%, 70%)' },
  { start: 'hsl(220, 80%, 60%)', end: 'hsl(220, 80%, 74%)' },
  { start: 'hsl(220, 70%, 64%)', end: 'hsl(220, 70%, 78%)' },
  { start: 'hsl(220, 60%, 68%)', end: 'hsl(220, 60%, 80%)' },
  { start: 'hsl(38, 92%, 50%)', end: 'hsl(38, 92%, 65%)' },
  { start: 'hsl(25, 90%, 55%)', end: 'hsl(25, 90%, 70%)' },
  { start: 'hsl(0, 84%, 60%)', end: 'hsl(0, 84%, 74%)' },
];

export function AdminActivationFunnel() {
  const { data, loading } = useAdminStatsSlice<FunnelData>('funnel');

  if (loading) {
    return <div className="admin-card p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  const steps = data?.steps ?? [];
  const maxCount = steps[0]?.count ?? 1;

  const chartData = steps.map((step, i) => ({
    ...step,
    pct: maxCount > 0 ? Math.round((step.count / maxCount) * 100) : 0,
    dropoff: i > 0 && steps[i - 1].count > 0
      ? `-${Math.round(((steps[i - 1].count - step.count) / steps[i - 1].count) * 100)}%`
      : '',
  }));

  return (
    <div className="admin-card">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Activation Funnel</h3>
      </div>
      <div className="px-6 pb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 80 }}>
            <defs>
              {GRADIENT_COLORS.map((c, i) => (
                <linearGradient key={i} id={`funnelGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={c.start} />
                  <stop offset="100%" stopColor={c.end} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.08)" horizontal={false} />
            <XAxis type="number" fontSize={10} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" fontSize={11} width={110} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(0, 0%, 50%, 0.06)' }} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={`url(#funnelGrad${i % GRADIENT_COLORS.length})`} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                fontSize={11}
                fill="hsl(0, 0%, 60%)"
                formatter={(v: number) => {
                  const item = chartData.find(d => d.count === v);
                  return `${v} (${item?.pct}%)`;
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
