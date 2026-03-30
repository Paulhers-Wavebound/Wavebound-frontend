import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminStatsSlice } from './AdminStatsProvider';
import { format, parseISO } from 'date-fns';

interface FeedItem {
  id: string;
  timestamp: string;
  email: string;
  accountType: string;
  creatorRole: string;
  genres: string[];
  action: string;
  metadata: Record<string, any>;
}

interface FeedData {
  feed: FeedItem[];
}

const ACTION_LABELS: Record<string, string> = {
  filter_applied: '🔍 applied filters',
  video_viewed: '🎬 viewed a video',
  ai_chat_started: '💬 started AI chat',
  message_sent: '✉️ sent a message',
  content_plan_generated: '📋 generated content plan',
  onboarding_completed: '✅ completed onboarding',
};

export function AdminActivityFeed() {
  const { data, loading } = useAdminStatsSlice<FeedData>('activity_feed');

  if (loading) {
    return (
      <Card><CardContent className="p-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
    );
  }

  return (
    <div className="admin-card">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Activity Feed (Last 100)</h3>
      </div>
      <div className="px-6 pb-6">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1.5">
            {data?.feed?.map(item => (
              <div key={item.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground whitespace-nowrap shrink-0">
                  {format(parseISO(item.timestamp), 'HH:mm')}
                </span>
                <span className="font-medium text-foreground truncate max-w-[140px]">{item.email}</span>
                <span className="text-muted-foreground shrink-0">
                  ({item.accountType}{item.creatorRole ? ` · ${item.creatorRole}` : ''})
                </span>
                <span className="text-foreground">
                  {ACTION_LABELS[item.action] ?? item.action}
                </span>
              </div>
            ))}
            {(!data?.feed || data.feed.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
