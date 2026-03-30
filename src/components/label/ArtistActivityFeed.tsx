import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  video_url: string | null;
  created_at: string;
}

const severityDot: Record<string, string> = {
  celebration: 'bg-green-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export default function ArtistActivityFeed({ artistHandle }: { artistHandle: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!artistHandle) return;
    (async () => {
      const { data } = await supabase
        .from('artist_alerts' as any)
        .select('id, title, message, severity, video_url, created_at')
        .eq('artist_handle', artistHandle)
        .order('created_at', { ascending: false })
        .limit(20);
      setAlerts((data as any) || []);
      setLoading(false);
    })();
  }, [artistHandle]);

  if (loading) return null;

  const hasRecent = alerts.some(
    a => Date.now() - new Date(a.created_at).getTime() < 24 * 60 * 60 * 1000
  );

  const visible = expanded ? alerts : alerts.slice(0, 10);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        {hasRecent && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity</p>
      ) : (
        <div className="space-y-2">
          {visible.map(alert => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ background: '#1C1C1E' }}
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${severityDot[alert.severity] || 'bg-muted-foreground'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{alert.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </p>
              </div>
              {alert.video_url && (
                <a
                  href={alert.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 mt-1"
                >
                  View <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))}

          {alerts.length > 10 && !expanded && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setExpanded(true)}
            >
              Show more ({alerts.length - 10} remaining)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
