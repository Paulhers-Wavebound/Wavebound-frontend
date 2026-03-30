import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAdminStatsSlice } from './AdminStatsProvider';

const COLORS = [
  'hsl(220, 90%, 56%)', 'hsl(350, 80%, 60%)', 'hsl(150, 60%, 45%)',
  'hsl(38, 92%, 50%)', 'hsl(270, 70%, 60%)', 'hsl(190, 85%, 55%)',
  'hsl(25, 90%, 55%)', 'hsl(0, 84%, 60%)',
];

interface BreakdownData {
  typeDistribution: { name: string; value: number }[];
  genreDistribution: { name: string; value: number }[];
  roleDistribution: { name: string; value: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full" style={{ background: payload[0].payload?.fill || payload[0].color }} />
        <span className="text-foreground font-medium">{payload[0].name}:</span>
        <span className="font-bold text-foreground">{payload[0].value}</span>
      </div>
    </div>
  );
};

const renderCustomLabel = ({ name, percent, cx, x }: any) => {
  const label = `${name} ${(percent * 100).toFixed(0)}%`;
  return (
    <text x={x} y={undefined} fill="hsl(0, 0%, 60%)" fontSize={11} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {label}
    </text>
  );
};

export function AdminUserBreakdown() {
  const { data, loading } = useAdminStatsSlice<BreakdownData>('user_breakdown');

  if (loading) {
    return <div className="admin-card p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="admin-card">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">User Breakdown</h3>
      </div>
      <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Account Type Pie */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 text-center">Account Types</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data?.typeDistribution ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} paddingAngle={3} label={renderCustomLabel} labelLine={{ stroke: 'hsl(0, 0%, 50%, 0.3)', strokeWidth: 1 }} fontSize={10} strokeWidth={0}>
                {data?.typeDistribution?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Creator Role Pie */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 text-center">Creator Roles</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data?.roleDistribution ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} paddingAngle={3} label={renderCustomLabel} labelLine={{ stroke: 'hsl(0, 0%, 50%, 0.3)', strokeWidth: 1 }} fontSize={10} strokeWidth={0}>
                {data?.roleDistribution?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Genre Bar Chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-1 text-center">Genres</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.genreDistribution ?? []} layout="vertical" margin={{ left: 50 }}>
              <defs>
                <linearGradient id="genreBarGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(220, 90%, 56%)" />
                  <stop offset="100%" stopColor="hsl(220, 90%, 72%)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.08)" horizontal={false} />
              <XAxis type="number" fontSize={9} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" fontSize={9} width={45} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(0, 0%, 50%, 0.06)' }} />
              <Bar dataKey="value" fill="url(#genreBarGrad)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
