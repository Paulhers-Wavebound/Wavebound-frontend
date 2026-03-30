import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, Activity, MessageSquare, Video, Timer, TrendingUp, UserPlus, MessagesSquare, Zap, Music, Film, Heart, ClipboardList } from 'lucide-react';
import { useAdminStatsSlice } from './AdminStatsProvider';

const PAYWALL_DATE = new Date('2025-09-01');

interface OverviewData {
  totalUsers: number;
  dau: number;
  wau: number;
  dauWauRatio: number;
  totalChats: number;
  totalVideos: number;
  signups7d: number;
  avgMessagesPerChat: number;
  powerUsers7d: number;
  plansAudio: number;
  plansVideo: number;
  plansFavorite: number;
  plansTotal: number;
}

export function AdminOverviewCards() {
  const { data, loading } = useAdminStatsSlice<OverviewData>('overview');

  const daysUntilPaywall = Math.max(0, Math.ceil((PAYWALL_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const metrics = [
    { label: 'Total Users', value: data?.totalUsers ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Signups (7d)', value: data?.signups7d ?? 0, icon: UserPlus, color: 'text-emerald-500' },
    { label: 'WAU', value: data?.wau ?? 0, icon: UserCheck, color: 'text-green-500' },
    { label: 'DAU', value: data?.dau ?? 0, icon: Activity, color: 'text-purple-500' },
    { label: 'DAU/WAU', value: data?.dauWauRatio ?? 0, icon: TrendingUp, color: data && data.dauWauRatio >= 0.3 ? 'text-green-500' : 'text-orange-500', isRatio: true },
    { label: 'Total Chats', value: data?.totalChats ?? 0, icon: MessageSquare, color: 'text-cyan-500' },
    { label: 'Avg Msgs/Chat', value: data?.avgMessagesPerChat ?? 0, icon: MessagesSquare, color: 'text-indigo-500', isRatio: true },
    { label: 'Videos Browsed', value: data?.totalVideos ?? 0, icon: Video, color: 'text-pink-500' },
    { label: 'Power Users', value: data?.powerUsers7d ?? 0, icon: Zap, color: 'text-yellow-500' },
    { label: 'Days to Paywall', value: daysUntilPaywall, icon: Timer, color: 'text-amber-500' },
  ];

  const planMetrics = [
    { label: 'Total Plans', value: data?.plansTotal ?? 0, icon: ClipboardList, color: 'text-violet-500' },
    { label: 'Audio Plans', value: data?.plansAudio ?? 0, icon: Music, color: 'text-rose-500' },
    { label: 'Video Plans', value: data?.plansVideo ?? 0, icon: Film, color: 'text-sky-500' },
    { label: 'Favorite Plans', value: data?.plansFavorite ?? 0, icon: Heart, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="admin-metric-card p-4">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/60">
                    <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {m.isRatio ? m.value.toFixed(1) : m.value.toLocaleString()}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Plan type breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {planMetrics.map(m => (
          <div key={m.label} className="admin-metric-card p-4">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/60">
                    <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground tracking-tight">
                  {m.value.toLocaleString()}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
