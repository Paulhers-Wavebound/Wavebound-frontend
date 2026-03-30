import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminStatsSlice, useAdminStatsRefresh } from './AdminStatsProvider';
import { format, parseISO } from 'date-fns';

interface DayData {
  date: string;
  dau: number;
  chats: number;
  plans: number;
  avgMsgsPerChat: number;
}

interface DailyData {
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
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function AdminDailyUsage() {
  const [userType, setUserType] = useState('all');
  const { data: batchData, loading: batchLoading } = useAdminStatsSlice<DailyData>('daily_usage');
  const { refreshAction } = useAdminStatsRefresh();
  const [filteredData, setFilteredData] = useState<DailyData | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    if (userType === 'all') {
      setFilteredData(null);
      return;
    }
    setFilterLoading(true);
    refreshAction('daily_usage', { userType }).then(result => {
      setFilteredData(result as DailyData);
      setFilterLoading(false);
    }).catch(() => setFilterLoading(false));
  }, [userType, refreshAction]);

  const data = userType === 'all' ? batchData : filteredData;
  const loading = userType === 'all' ? batchLoading : filterLoading;

  if (loading && !data) {
    return <div className="admin-card p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  const chartData = data?.days?.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  })) ?? [];

  return (
    <div className="admin-card">
      <div className="p-6 pb-2 flex flex-row items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Daily Usage (30d)</h3>
        <Select value={userType} onValueChange={setUserType}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="artist">Artists</SelectItem>
            <SelectItem value="manager">Managers</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="px-6 pb-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(220, 90%, 56%)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(220, 90%, 56%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="chatsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="plansGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="msgsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(270, 70%, 55%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(270, 70%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 50%, 0.08)" vertical={false} />
            <XAxis dataKey="label" fontSize={10} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
            <YAxis fontSize={10} stroke="hsl(0, 0%, 50%, 0.4)" tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend fontSize={11} />
            <Area type="monotone" dataKey="dau" stroke="hsl(220, 90%, 56%)" strokeWidth={2.5} fill="url(#dauGrad)" name="DAU" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
            <Area type="monotone" dataKey="chats" stroke="hsl(150, 60%, 45%)" strokeWidth={2} fill="url(#chatsGrad)" name="Chats" dot={false} />
            <Area type="monotone" dataKey="plans" stroke="hsl(38, 92%, 50%)" strokeWidth={2} fill="url(#plansGrad)" name="Plans" dot={false} />
            <Area type="monotone" dataKey="avgMsgsPerChat" stroke="hsl(270, 70%, 55%)" strokeWidth={2} fill="url(#msgsGrad)" name="Avg Msgs/Chat" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
