import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useAdminStatsSlice } from './AdminStatsProvider';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  accountType: string;
  creatorRole: string;
  genres: string[];
  signupDate: string;
  lastActive: string | null;
  totalSessions: number;
  totalChats: number;
  totalPlans: number;
  totalVideos: number;
  totalActions: number;
}

interface TopUsersData {
  users: UserData[];
}

interface TimelineEntry {
  timestamp: string;
  action: string;
  metadata: any;
}

type SortKey = 'totalActions' | 'totalSessions' | 'totalChats' | 'totalPlans' | 'totalVideos' | 'signupDate';

function formatAction(action: string, metadata: any): string {
  const meta = metadata || {};
  switch (action) {
    case 'video_viewed': {
      const genres = meta.genres?.join(' · ') || meta.genre || '';
      return `viewed a video${genres ? ` (${genres})` : ''}`;
    }
    case 'ai_chat_started': return 'started AI chat';
    case 'message_sent': return `sent a message${meta.message ? ` ("${String(meta.message).slice(0, 60)}")` : ''}`;
    case 'content_plan_generated': return 'generated a content plan';
    case 'filter_applied': return `applied filter${meta.filter ? ` (${meta.filter})` : ''}`;
    case 'onboarding_completed': return `completed onboarding (${meta.accountType || ''} · ${meta.role || ''})`;
    case 'video_favorited': return 'favorited a video';
    default: return action.replace(/_/g, ' ');
  }
}

function UserTimeline({ userId }: { userId: string }) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.functions.invoke('admin-stats', {
        body: { action: 'user_timeline', filters: { userId } },
      });
      setTimeline(data?.timeline ?? []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) return <Skeleton className="h-24 w-full" />;
  if (timeline.length === 0) return <p className="text-xs text-muted-foreground">No activity recorded</p>;

  return (
    <div className="max-h-64 overflow-y-auto space-y-1.5">
      {timeline.map((entry, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <Clock className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground whitespace-nowrap">
            {format(parseISO(entry.timestamp), 'MMM d, h:mm a')}
          </span>
          <span className="text-foreground">— {formatAction(entry.action, entry.metadata)}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminTopUsers() {
  const { data, loading } = useAdminStatsSlice<TopUsersData>('top_users');
  const [sortKey, setSortKey] = useState<SortKey>('totalActions');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...(data?.users ?? [])].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
    return sortAsc ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  if (loading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;
  }

  return (
    <div className="admin-card">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Top 50 Users</h3>
      </div>
      <div className="px-6 pb-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs cursor-pointer" onClick={() => handleSort('signupDate')}>
                Signed Up <SortIcon col="signupDate" />
              </TableHead>
              <TableHead className="text-xs cursor-pointer" onClick={() => handleSort('totalActions')}>
                Actions <SortIcon col="totalActions" />
              </TableHead>
              <TableHead className="text-xs cursor-pointer" onClick={() => handleSort('totalSessions')}>
                Sessions <SortIcon col="totalSessions" />
              </TableHead>
              <TableHead className="text-xs cursor-pointer" onClick={() => handleSort('totalChats')}>
                Chats <SortIcon col="totalChats" />
              </TableHead>
              <TableHead className="text-xs cursor-pointer" onClick={() => handleSort('totalVideos')}>
                Videos <SortIcon col="totalVideos" />
              </TableHead>
              <TableHead className="text-xs cursor-pointer" onClick={() => handleSort('totalPlans')}>
                Plans <SortIcon col="totalPlans" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(user => (
              <React.Fragment key={user.id}>
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                >
                  <TableCell className="text-xs font-medium">{user.email}</TableCell>
                  <TableCell className="text-xs">{user.accountType}</TableCell>
                  <TableCell className="text-xs">{user.creatorRole}</TableCell>
                  <TableCell className="text-xs">{user.signupDate ? format(parseISO(user.signupDate), 'MMM d') : '-'}</TableCell>
                  <TableCell className="text-xs font-medium">{user.totalActions}</TableCell>
                  <TableCell className="text-xs">{user.totalSessions}</TableCell>
                  <TableCell className="text-xs">{user.totalChats}</TableCell>
                  <TableCell className="text-xs">{user.totalVideos}</TableCell>
                  <TableCell className="text-xs">{user.totalPlans}</TableCell>
                </TableRow>
                {expandedId === user.id && (
                  <TableRow key={`${user.id}-detail`}>
                    <TableCell colSpan={9} className="bg-muted/30 p-4">
                      <div className="mb-2 text-xs space-y-0.5">
                        <p><strong>Genres:</strong> {user.genres?.join(', ') || 'None'}</p>
                        <p><strong>Last Active:</strong> {user.lastActive ? format(parseISO(user.lastActive), 'PPp') : 'Never'}</p>
                      </div>
                      <div className="border-t border-border pt-2 mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Activity Timeline</p>
                        <UserTimeline userId={user.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
