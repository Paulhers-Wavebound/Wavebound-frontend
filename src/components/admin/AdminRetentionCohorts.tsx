import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStatsSlice } from './AdminStatsProvider';

interface CohortData {
  cohorts: {
    week: string;
    total: number;
    retention: { week: number; pct: number }[];
  }[];
}

function getColor(pct: number): string {
  if (pct >= 40) return 'bg-green-500/20 text-green-400';
  if (pct >= 20) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

export function AdminRetentionCohorts() {
  const { data, loading } = useAdminStatsSlice<CohortData>('retention');

  if (loading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  return (
    <div className="admin-card">
      <div className="p-6 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Retention Cohorts</h3>
      </div>
      <div className="px-6 pb-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Cohort</TableHead>
              <TableHead className="text-xs">Users</TableHead>
              <TableHead className="text-xs text-center">Wk 0</TableHead>
              <TableHead className="text-xs text-center">Wk 1</TableHead>
              <TableHead className="text-xs text-center">Wk 2</TableHead>
              <TableHead className="text-xs text-center">Wk 3</TableHead>
              <TableHead className="text-xs text-center">Wk 4</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.cohorts?.map(cohort => (
              <TableRow key={cohort.week}>
                <TableCell className="text-xs font-medium">{cohort.week}</TableCell>
                <TableCell className="text-xs">{cohort.total}</TableCell>
                {cohort.retention.map(r => (
                  <TableCell key={r.week} className="text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getColor(r.pct)}`}>
                      {r.pct}%
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
