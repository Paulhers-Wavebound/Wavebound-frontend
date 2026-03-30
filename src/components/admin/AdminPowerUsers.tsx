import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap } from 'lucide-react';
import { useAdminStatsSlice } from './AdminStatsProvider';
import { format, parseISO } from 'date-fns';

interface PowerUser {
  id: string;
  email: string;
  accountType: string;
  creatorRole: string;
  genres: string[];
  actionsThisWeek: number;
  lastActive: string;
}

interface PowerUsersData {
  users: PowerUser[];
}

export function AdminPowerUsers() {
  const { data, loading } = useAdminStatsSlice<PowerUsersData>('power_users');

  if (loading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  const users = data?.users ?? [];

  return (
    <div className="admin-card ring-1 ring-yellow-500/20">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Power Users — 10+ actions in 7 days ({users.length})
        </h3>
      </div>
      <div className="px-6 pb-6 overflow-x-auto">
        {users.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No power users this week</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Genres</TableHead>
                <TableHead className="text-xs">Actions (7d)</TableHead>
                <TableHead className="text-xs">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} className="bg-yellow-500/5">
                  <TableCell className="text-xs font-medium">{user.email}</TableCell>
                  <TableCell className="text-xs">{user.accountType}</TableCell>
                  <TableCell className="text-xs">{user.creatorRole}</TableCell>
                  <TableCell className="text-xs">{user.genres?.slice(0, 2).join(', ') || '-'}</TableCell>
                  <TableCell className="text-xs font-bold text-yellow-500">{user.actionsThisWeek}</TableCell>
                  <TableCell className="text-xs">{format(parseISO(user.lastActive), 'MMM d, h:mm a')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
