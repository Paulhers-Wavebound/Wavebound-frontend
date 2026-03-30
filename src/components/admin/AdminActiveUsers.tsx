import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAdminStatsSlice, useAdminStatsRefresh } from './AdminStatsProvider';
import { formatDistanceToNow } from 'date-fns';

interface ActiveUser {
  id: string;
  email: string;
  accountType: string;
  creatorRole: string;
  lastAction: string;
  lastActionTime: string;
}

interface RecentEvent {
  timestamp: string;
  userId: string;
  email: string;
  action: string;
  metadata: any;
}

interface ActiveNowData {
  activeCount: number;
  users: ActiveUser[];
  recentEvents: RecentEvent[];
}

export function AdminActiveUsers() {
  const { data, loading, error } = useAdminStatsSlice<ActiveNowData>('active_now');
  const { refreshAction } = useAdminStatsRefresh();

  // Auto-refresh just this action every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAction('active_now').catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshAction]);

  const formatAction = (action: string) =>
    action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading && !data) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-destructive text-sm">Failed to load active users</CardTitle></CardHeader>
      </Card>
    );
  }

  const activeCount = data?.activeCount ?? 0;
  const users = data?.users ?? [];
  const events = data?.recentEvents ?? [];

  return (
    <div className="admin-card">
      <div className="p-6 pb-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {activeCount} Active Now
          </h3>
          <Badge variant="secondary" className="text-xs font-normal">Last 60 min · auto-refreshes</Badge>
        </div>
      </div>
      <div className="px-6 pb-6 space-y-4">
        {users.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last Action</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{u.accountType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatAction(u.lastAction)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(u.lastActionTime), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active users in the last hour.</p>
        )}

        {events.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Activity Log (Last Hour)</h4>
            <ScrollArea className="h-48 rounded-md border p-3">
              <div className="space-y-1.5">
                {events.map((e, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-xs">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                    </span>
                    <span className="font-medium truncate">{e.email}</span>
                    <span className="text-muted-foreground">{formatAction(e.action)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
