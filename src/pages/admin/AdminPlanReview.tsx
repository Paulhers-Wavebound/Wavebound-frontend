import { useEffect, useState, useMemo } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, SkipForward, FileText, Calendar, BarChart3, User, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ArtistPlan {
  artist_handle: string;
  artist_name: string;
  avatar_url: string | null;
  label_id: string;
  label_name: string;
  updated_at: string;
  plan_review_status: string | null;
  content_plan_html: string | null;
  intelligence_report_html: string | null;
  content_plan_30d_html: string | null;
  artist_brief_html: string | null;
  status: string;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'needs_edit';
type Deliverable = 'content_plan' | 'intelligence_report' | '30day_plan' | 'artist_brief';

const statusBadge = (status: string | null) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
    case 'needs_edit':
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Needs Edit</Badge>;
    default:
      return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
  }
};

export default function AdminPlanReview() {
  const { invoke, loading } = useAdminData();
  const [artists, setArtists] = useState<ArtistPlan[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable>('content_plan');
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    const data = await invoke('plan_review');
    if (data?.artists) setArtists(data.artists);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return artists;
    if (filter === 'pending') return artists.filter(a => !a.plan_review_status);
    return artists.filter(a => a.plan_review_status === filter);
  }, [artists, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, ArtistPlan[]> = {};
    filtered.forEach(a => {
      const key = a.label_name || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const selectedArtist = artists.find(a => a.artist_handle === selected);

  const reviewedCount = artists.filter(a => a.plan_review_status === 'approved' || a.plan_review_status === 'needs_edit').length;
  const progressPct = artists.length > 0 ? Math.round((reviewedCount / artists.length) * 100) : 0;

  const setStatus = async (handle: string, status: string) => {
    setUpdating(true);
    try {
      await invoke('set_plan_status', { artist_handle: handle, status });
      setArtists(prev => prev.map(a => a.artist_handle === handle ? { ...a, plan_review_status: status } : a));
      toast.success(`Marked as ${status === 'approved' ? 'Approved' : status === 'needs_edit' ? 'Needs Edit' : 'Skipped'}`);
    } catch {
      toast.error('Failed to update status');
    }
    setUpdating(false);
  };

  const getHtml = (artist: ArtistPlan) => {
    switch (deliverable) {
      case 'content_plan': return artist.content_plan_html;
      case 'intelligence_report': return artist.intelligence_report_html;
      case '30day_plan': return artist.content_plan_30d_html;
      case 'artist_brief': return artist.artist_brief_html;
    }
  };

  if (loading && artists.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {reviewedCount} of {artists.length} plans reviewed
          </span>
          <span className="text-sm font-medium text-foreground">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'needs_edit'] as FilterTab[]).map(tab => (
          <Button
            key={tab}
            variant={filter === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(tab)}
            className="capitalize"
          >
            {tab === 'needs_edit' ? 'Needs Edit' : tab}
            {tab !== 'all' && (
              <span className="ml-1 text-xs opacity-70">
                ({tab === 'pending'
                  ? artists.filter(a => !a.plan_review_status).length
                  : artists.filter(a => a.plan_review_status === tab).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Left: artist list */}
        <div className="w-80 shrink-0 space-y-4 overflow-y-auto max-h-[calc(100vh-240px)]">
          {grouped.map(([label, items]) => (
            <div key={label}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</h3>
              <div className="space-y-1">
                {items.map(a => (
                  <button
                    key={a.artist_handle}
                    onClick={() => { setSelected(a.artist_handle); setDeliverable('content_plan'); }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selected === a.artist_handle
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={a.avatar_url || ''} />
                        <AvatarFallback className="text-xs">{(a.artist_name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{a.artist_name || a.artist_handle}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.updated_at ? format(new Date(a.updated_at), 'MMM d') : '—'}
                        </div>
                      </div>
                      {statusBadge(a.plan_review_status)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No plans match this filter.</p>
          )}
        </div>

        {/* Right: preview */}
        <div className="flex-1 min-w-0">
          {selectedArtist ? (
            <Card className="bg-card border-border h-full flex flex-col">
              {/* Deliverable toggle */}
              <div className="p-3 border-b border-border flex items-center gap-2 flex-wrap">
                {([
                  { key: 'content_plan' as Deliverable, label: 'Content Plan', icon: Calendar, html: selectedArtist.content_plan_html },
                  { key: 'intelligence_report' as Deliverable, label: 'Intel Report', icon: BarChart3, html: selectedArtist.intelligence_report_html },
                  { key: '30day_plan' as Deliverable, label: '30-Day Plan', icon: FileText, html: selectedArtist.content_plan_30d_html },
                  { key: 'artist_brief' as Deliverable, label: 'Artist Brief', icon: User, html: selectedArtist.artist_brief_html },
                ]).map(d => (
                  <Button
                    key={d.key}
                    variant={deliverable === d.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeliverable(d.key)}
                    disabled={!d.html}
                    className="gap-1.5"
                  >
                    <d.icon className="h-3.5 w-3.5" />
                    {d.label}
                  </Button>
                ))}
                {getHtml(selectedArtist) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 ml-auto"
                    onClick={() => {
                      const html = getHtml(selectedArtist);
                      if (!html) return;
                      const blob = new Blob([html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedArtist.artist_handle}_${deliverable}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                )}
              </div>

              {/* HTML preview */}
              <div className="flex-1 overflow-hidden">
                {getHtml(selectedArtist) ? (
                  <iframe
                    srcDoc={
                      getHtml(selectedArtist)!.trim().startsWith('<!DOCTYPE') || getHtml(selectedArtist)!.trim().startsWith('<html')
                        ? getHtml(selectedArtist)!
                        : `<!DOCTYPE html>
                      <html><head>
                        <style>
                          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; background: #0a0a0a; color: #e5e5e5; line-height: 1.6; }
                          h1,h2,h3 { color: #fff; }
                          a { color: #60a5fa; }
                          table { border-collapse: collapse; width: 100%; }
                          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                          th { background: #1a1a1a; }
                        </style>
                      </head><body>${getHtml(selectedArtist)}</body></html>`
                    }
                    className="w-full h-full border-0"
                    title="Plan preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No content available for this deliverable.
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="p-3 border-t border-border flex gap-2">
                <Button
                  onClick={() => setStatus(selectedArtist.artist_handle, 'approved')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  onClick={() => setStatus(selectedArtist.artist_handle, 'needs_edit')}
                  disabled={updating}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  <AlertCircle className="h-4 w-4 mr-1" /> Needs Edit
                </Button>
                <Button
                  onClick={() => setStatus(selectedArtist.artist_handle, 'skipped')}
                  disabled={updating}
                  variant="ghost"
                  size="sm"
                >
                  <SkipForward className="h-4 w-4 mr-1" /> Skip
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select an artist to preview their plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
