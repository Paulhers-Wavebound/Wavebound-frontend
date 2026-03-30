import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useAdminStatsSlice } from './AdminStatsProvider';
import { format, parseISO } from 'date-fns';

interface DayData {
  date: string;
  signups: number;
  cumulative: number;
}

interface SignupGrowthData {
  days: DayData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function AdminSignupGrowth() {
  const { data, loading } = useAdminStatsSlice<SignupGrowthData>('signup_growth');

  if (loading) {
    return <div className="admin-card p-6"><Skeleton className="h-72 w-full" /></div>;
  }

  const chartData = data?.days?.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  })) ?? [];

  return (
    <div className="admin-card">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Signup Growth (30d)</h3>
      </div>
      <div className="px-6 pb-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(220, 90%, 56%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(220, 90%, 56%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 0%, 60%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(0, 0%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.08)" vertical={false} />
            <XAxis dataKey="label" fontSize={10} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" fontSize={10} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" fontSize={10} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend fontSize={11} />
            <Area yAxisId="left" type="monotone" dataKey="signups" stroke="hsl(220, 90%, 56%)" strokeWidth={2.5} fill="url(#signupGrad)" name="New Signups" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(220, 90%, 56%)' }} />
            <Area yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(0, 0%, 60%)" strokeWidth={2} fill="url(#cumulativeGrad)" name="Total Users" strokeDasharray="4 2" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
