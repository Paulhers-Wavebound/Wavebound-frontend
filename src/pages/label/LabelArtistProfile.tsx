import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LabelLayout from '@/pages/label/LabelLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowUp, ArrowDown, CheckCircle2, XCircle, AlertTriangle, AlertCircle, FileText, Calendar, BarChart3, BadgeCheck, X, HelpCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArtistDeepSections, type DeepResearchData } from '@/components/label/ArtistDeepSections';
import ArtistActivityFeed from '@/components/label/ArtistActivityFeed';
import RemoveArtistDialog from '@/components/label/RemoveArtistDialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip as RechartsTooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ArtistMetrics {
  artist_name: string;
  artist_handle: string;
  avatar_url: string | null;
  momentum_tier: string;
  days_since_last_post: number | null;
  last_post_date: string | null;
  tiktok_followers: number | null;
  monthly_listeners: number | null;
  instagram_followers: number | null;
  performance_ratio_current: number | null;
  performance_ratio_7d: number | null;
  performance_ratio_30d: number | null;
  median_views_baseline: number | null;
  has_baseline: boolean;
  delta_avg_views_pct: number | null;
  delta_engagement_pct: number | null;
  delta_posting_freq_pct: number | null;
  delta_followers_pct: number | null;
  release_readiness_score: number | null;
  release_readiness_factors: Record<string, boolean> | null;
  latest_release_name: string | null;
  latest_release_days_ago: number | null;
  risk_flags: Array<{ flag: string; severity: string }> | null;
  has_content_plan: boolean;
  has_intelligence_report: boolean;
  has_30day_plan: boolean;
  has_artist_brief: boolean;
  invite_code: string | null;
  baseline_date: string | null;
  artist_id: string | null;
}

interface TimelinePointRaw {
  date_posted: string;
  video_views: number;
  video_likes: number;
  video_comments: number;
  video_shares: number;
  video_saves: number;
  video_url: string | null;
  caption: string | null;
  is_ad?: boolean;
  is_likely_promoted?: boolean;
}

interface TimelinePoint extends TimelinePointRaw {
  views: number;
  performance_ratio: number;
  momentum_tier: string;
}

// ── Tier config ────────────────────────────────────────────────────────────────

const tierConfig: Record<string, { label: string; color: string; dot: string }> = {
  viral:     { label: 'Viral',     color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', dot: '#a855f7' },
  breakout:  { label: 'Breakout',  color: 'bg-green-500/20 text-green-400 border-green-500/30',   dot: '#22c55e' },
  momentum:  { label: 'Momentum',  color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: '#f97316' },
  stable:    { label: 'Stable',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',       dot: '#9ca3af' },
  stalled:   { label: 'Stalled',   color: 'bg-red-500/20 text-red-400 border-red-500/30',         dot: '#ef4444' },
};

const factorLabels: Record<string, string> = {
  posting_active: 'Active posting (last 3 days)',
  posting_consistent: 'Consistent schedule',
  audience_warm: 'Audience above baseline',
  engagement_healthy: 'Healthy engagement rate',
  momentum_positive: 'Positive momentum',
  not_stalled: 'Not stalled',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${Math.round(n)}%`;
}

function postAgeColor(days: number | null): string {
  if (days == null) return 'text-muted-foreground';
  if (days <= 3) return 'text-green-400';
  if (days <= 7) return 'text-amber-400';
  return 'text-red-400';
}

function readinessRingColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

// ── Custom dot renderer (only breakout & viral) ───────────────────────────────

function RmmDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const pr = payload?.performance_ratio ?? 0;

  if (pr >= 10) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="#FFD60A" opacity={0.25} />
        <circle cx={cx} cy={cy} r={5} fill="#FFD60A" />
      </g>
    );
  }
  if (pr >= 4) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#30D158" opacity={0.2} />
        <circle cx={cx} cy={cy} r={4} fill="#30D158" />
      </g>
    );
  }
  return null;
}

// ── Premium tooltip ───────────────────────────────────────────────────────────

function PremiumChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const dateStr = d.date_posted ? format(new Date(d.date_posted), 'MMM d, yyyy') : '';
  const caption = d.caption ? (d.caption.length > 60 ? d.caption.slice(0, 60) + '…' : d.caption) : null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#1E1E1E] px-3.5 py-2.5 text-xs shadow-xl min-w-[180px]">
      <p className="text-[#6B7280] mb-1">{dateStr}</p>
      <p className="text-white text-sm font-semibold">{d.performance_ratio?.toFixed(1)}x performance</p>
      <p className="text-[#6B7280] mt-1">Views: {fmtNum(d.views)}</p>
      {caption && <p className="text-[#6B7280] mt-1 italic">{caption}</p>}
    </div>
  );
}

// ── Readiness donut ────────────────────────────────────────────────────────────

function ReadinessGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = readinessRingColor(score);

  return (
    <div className="flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
          className="fill-foreground text-2xl font-bold" fontSize="28">
          {score}
        </text>
      </svg>
    </div>
  );
}

// ── Delta card ─────────────────────────────────────────────────────────────────

function DeltaCard({ label, value }: { label: string; value: number | null | undefined }) {
  const isNull = value == null;
  const isZero = !isNull && value === 0;
  const isPositive = !isNull && value! > 0;
  const isNegative = !isNull && value! < 0;

  const colorClass = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-muted-foreground';

  return (
    <Card className="p-3 bg-card border-border flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-bold flex items-center gap-1 ${colorClass}`}>
        {isPositive && <ArrowUp className="w-3.5 h-3.5" />}
        {isNegative && <ArrowDown className="w-3.5 h-3.5" />}
        {isNull ? '—' : fmtPct(value)}
      </span>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LabelArtistProfile() {
  const { artistHandle } = useParams<{ artistHandle: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPortal = searchParams.get('from');
  const isUniversal = fromPortal === 'universal';
  const isAdmin = fromPortal === 'admin';
  const backPath = isAdmin ? '/admin/artists' : isUniversal ? '/label/universal' : '/label';
  const [artist, setArtist] = useState<ArtistMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimelinePointRaw[]>([]);
  const [organicOnly, setOrganicOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [deepData, setDeepData] = useState<DeepResearchData>({ contentAnalysis: null, brandDocument: null, crossPlatform: null, commentData: null, spotifyData: null });
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const { labelId } = useUserProfile();

  useEffect(() => {
    if (!artistHandle) return;
    setLoading(true);

    const safeParse = (val: any) => {
      if (val == null) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch { return null; }
    };

    const normalizedHandle = artistHandle.replace(/^@/, '').toLowerCase().trim();

    const fetchAll = async () => {
      const [metricsRes, timelineRes, drjRes, intelRes] = await Promise.all([
        supabase.from('roster_dashboard_metrics' as any).select('*').eq('artist_handle', artistHandle).maybeSingle(),
        supabase.from('artist_videos_tiktok' as any)
          .select('date_posted, video_views, video_likes, video_comments, video_shares, video_saves, video_url, caption, is_ad, is_likely_promoted')
          .eq('artist_handle', artistHandle)
          .order('date_posted', { ascending: false })
          .limit(30),
        supabase.from('deep_research_jobs' as any)
          .select('content_analysis_data, brand_document, cross_platform_data, comment_data, spotify_data')
          .eq('artist_handle', artistHandle)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('artist_intelligence' as any)
          .select('content_plan_html, intelligence_report_html, content_plan_30d_html, thirty_day_plan_html, artist_brief_html, invite_code')
          .or(`artist_handle.eq.${normalizedHandle},artist_handle.eq.@${normalizedHandle}`)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      console.log('[ArtistProfile] roster_dashboard_metrics raw:', metricsRes.data);
      console.log('[ArtistProfile] deep_research_jobs raw:', drjRes.data);
      console.log('[ArtistProfile] artist_intelligence raw:', intelRes.data, intelRes.error);
      if (metricsRes.data) {
        const m = metricsRes.data as any;
        const ai = intelRes.data as any;
        const plan30 = ai?.content_plan_30d_html || ai?.thirty_day_plan_html;
        setArtist({
          ...m,
          has_content_plan: m.has_content_plan || !!ai?.content_plan_html,
          has_intelligence_report: m.has_intelligence_report || !!ai?.intelligence_report_html,
          has_30day_plan: m.has_30day_plan || !!plan30,
          has_artist_brief: !!ai?.artist_brief_html,
          invite_code: ai?.invite_code ?? null,
        });
      } else if (isAdmin && intelRes.data) {
        const ai = intelRes.data as any;
        setArtist({
          artist_name: ai.artist_name || artistHandle,
          artist_handle: artistHandle,
          avatar_url: ai.avatar_url || null,
          momentum_tier: 'stable',
          days_since_last_post: null,
          last_post_date: null,
          tiktok_followers: ai.tiktok_followers || null,
          monthly_listeners: null,
          instagram_followers: null,
          performance_ratio_current: null,
          performance_ratio_7d: null,
          performance_ratio_30d: null,
          median_views_baseline: null,
          has_baseline: false,
          delta_avg_views_pct: null,
          delta_engagement_pct: null,
          delta_posting_freq_pct: null,
          delta_followers_pct: null,
          release_readiness_score: null,
          release_readiness_factors: null,
          latest_release_name: null,
          latest_release_days_ago: null,
          risk_flags: null,
          has_content_plan: !!ai.content_plan_html,
          has_intelligence_report: !!ai.intelligence_report_html,
          has_30day_plan: !!(ai.content_plan_30d_html || ai.thirty_day_plan_html),
          has_artist_brief: !!ai.artist_brief_html,
          invite_code: ai.invite_code ?? null,
          baseline_date: null,
          artist_id: null,
        });
      }
      if (timelineRes.data) setTimeline((timelineRes.data as any[]) ?? []);
      if (drjRes.data) {
        const d = drjRes.data as any;
        setDeepData({
          contentAnalysis: safeParse(d.content_analysis_data),
          brandDocument: safeParse(d.brand_document),
          crossPlatform: safeParse(d.cross_platform_data),
          commentData: safeParse(d.comment_data),
          spotifyData: safeParse(d.spotify_data),
        });
      }
      setLoading(false);
    };

    fetchAll();
  }, [artistHandle]);

  const isMobile = useIsMobile();

  const chartData = useMemo(() => {
    const filtered = organicOnly
      ? timeline.filter(pt => pt.is_ad !== true && pt.is_likely_promoted !== true)
      : timeline;

    // Compute median baseline: prefer artist-level value, else calculate from data
    const medianBaseline = (artist as any)?.median_views_baseline
      ?? (() => {
        const views = filtered.map(p => p.video_views).filter(Boolean).sort((a, b) => a - b);
        return views.length ? views[Math.floor(views.length / 2)] : 1;
      })();

    const sorted = [...filtered].sort((a, b) => new Date(a.date_posted).getTime() - new Date(b.date_posted).getTime());
    return sorted.map((pt) => {
      const pr = medianBaseline > 0 ? pt.video_views / medianBaseline : 0;
      const tier = pr >= 10 ? 'viral' : pr >= 4 ? 'breakout' : pr >= 1.5 ? 'momentum' : pr >= 0.5 ? 'stable' : 'stalled';
      return {
        ...pt,
        views: pt.video_views,
        performance_ratio: Math.round(pr * 100) / 100,
        momentum_tier: tier,
        timestamp: new Date(pt.date_posted).getTime(),
        dateLabel: format(new Date(pt.date_posted), 'MMM d'),
        monthLabel: format(new Date(pt.date_posted), 'MMM'),
      };
    });
  }, [timeline, organicOnly, artist]);

  const filteredStats = useMemo(() => {
    if (chartData.length === 0) return { current: null, avg7: null, avg30: null };
    const current = chartData[chartData.length - 1]?.performance_ratio ?? null;
    const last7 = chartData.slice(-7);
    const last30 = chartData.slice(-30);
    const avg = (arr: typeof chartData) => {
      const vals = arr.map(p => p.performance_ratio).filter(v => v != null);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return { current, avg7: avg(last7), avg30: avg(last30) };
  }, [chartData]);

  const tickSeenMonths = useMemo(() => new Set<string>(), [chartData]);
  const tier = tierConfig[artist?.momentum_tier ?? 'stable'] ?? tierConfig.stable;
  const factors = (artist?.release_readiness_factors ?? {}) as Record<string, boolean>;
  const risks = artist?.risk_flags ?? [];

  if (loading) {
    return (
      <LabelLayout>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
            <Skeleton className="h-96" />
            <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
          </div>
        </div>
      </LabelLayout>
    );
  }

  if (!artist) {
    return (
      <LabelLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button variant="ghost" onClick={() => navigate(backPath)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <p className="text-muted-foreground">Artist not found.</p>
        </div>
      </LabelLayout>
    );
  }

  return (
    <LabelLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">

          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-6">

            {/* Section 1: Header */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  {artist.avatar_url && <AvatarImage src={artist.avatar_url} />}
                  <AvatarFallback className="text-xl">{artist.artist_name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-foreground">{artist.artist_name}</h1>
                    <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${tier.color}`}>{tier.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">@{artist.artist_handle}</p>

                  {/* Platform stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                    {artist.tiktok_followers != null && <span>TikTok: <b className="text-foreground">{fmtNum(artist.tiktok_followers)}</b></span>}
                    {artist.instagram_followers != null && <span>IG: <b className="text-foreground">{fmtNum(artist.instagram_followers)}</b></span>}
                    {artist.monthly_listeners != null && <span>Spotify: <b className="text-foreground">{fmtNum(artist.monthly_listeners)} listeners</b></span>}
                  </div>

                  {/* Last posted */}
                  <p className={`text-xs mt-2 ${postAgeColor(artist.days_since_last_post)}`}>
                    {artist.days_since_last_post != null
                      ? artist.days_since_last_post === 0
                        ? 'Posted today'
                        : `Posted ${artist.days_since_last_post}d ago`
                      : 'No recent posts'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Artist Invite Code */}
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Artist Invite Code</p>
                  {artist.invite_code ? (
                    <p className="font-mono text-lg font-semibold text-foreground truncate">{artist.invite_code}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No invite code generated</p>
                  )}
                </div>
                {artist.invite_code && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(artist.invite_code!);
                      toast({ title: 'Copied to clipboard' });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this code with the artist to give them access to their Wavebound app.</p>
            </Card>

            {/* Section 2: Performance Chart */}
            <Card className="p-6 bg-card border-border">
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-foreground">RMM Performance Trend</h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="What is RMM Performance Trend?"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" className="max-w-xs text-xs space-y-2">
                    <p className="font-semibold">Rolling Momentum Model (RMM)</p>
                    <p>Each dot = one video. The score is calculated as: Video Views ÷ Your Median Views (last 30 videos).</p>
                    <p>1.0x = your normal. Above = outperforming, below = underperforming.</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      <li>· Stalled: below 0.5x</li>
                      <li>· Stable: 0.5x – 1.5x</li>
                      <li>· Momentum: 1.5x – 4x</li>
                      <li>· Breakout: 4x – 10x</li>
                      <li>· Viral: 10x+</li>
                    </ul>
                  </PopoverContent>
                </Popover>

                <div className="ml-auto flex rounded-md bg-muted p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setOrganicOnly(true)}
                    className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors ${
                      organicOnly
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Organic
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrganicOnly(false)}
                    className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors ${
                      !organicOnly
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All (incl. Promoted)
                  </button>
                </div>
              </div>
              {chartData.length > 0 && chartData.length < 5 && (
                <p className="text-xs text-muted-foreground mb-2">Limited video data available ({chartData.length} video{chartData.length !== 1 ? 's' : ''})</p>
              )}
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, bottom: 10, left: isMobile ? 0 : 10 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(139,92,246,0.2)" />
                        <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      tickLine={false}
                      tickFormatter={(ts) => {
                        const label = format(new Date(ts), 'MMM');
                        if (!(tickSeenMonths as Set<string>).has(label)) {
                          (tickSeenMonths as Set<string>).add(label);
                          return label;
                        }
                        return '';
                      }}
                    />
                    {!isMobile && (
                      <YAxis
                        ticks={[0, 2, 4, 6, 8, 10]}
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 'auto']}
                      />
                    )}

                    <RechartsTooltip
                      content={<PremiumChartTooltip />}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />

                    <ReferenceLine
                      y={1.0}
                      strokeDasharray="6 4"
                      stroke="rgba(255,255,255,0.15)"
                      label={{ value: 'Baseline', position: 'right', fontSize: 10, fill: '#6B7280' }}
                    />

                    <Area
                      type="monotone"
                      dataKey="performance_ratio"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#areaGradient)"
                      dot={<RmmDot />}
                      activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#8B5CF6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-12 text-center">Video performance data not yet available — will populate after next pipeline run</p>
              )}

              {/* Stats pills */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border flex-wrap">
                {(() => {
                  const current = filteredStats.current;
                  const avg7 = filteredStats.avg7;
                  const avg30 = filteredStats.avg30;
                  const baseline = artist.median_views_baseline;

                  const prColor = (v: number | null) => {
                    if (v == null) return 'text-foreground';
                    if (v > 1.5) return 'text-green-400';
                    if (v < 0.5) return 'text-red-400';
                    return 'text-foreground';
                  };

                  const trendArrow = current != null && avg30 != null
                    ? current > avg30
                      ? <ArrowUp className="w-3 h-3 text-green-400 inline" />
                      : current < avg30
                        ? <ArrowDown className="w-3 h-3 text-red-400 inline" />
                        : null
                    : null;

                  const stats = [
                    { label: 'Current PR', value: current != null ? `${current.toFixed(1)}x` : '—', color: prColor(current), arrow: trendArrow },
                    { label: '7d avg', value: avg7 != null ? `${avg7.toFixed(1)}x` : '—', color: prColor(avg7), arrow: null },
                    { label: '30d avg', value: avg30 != null ? `${avg30.toFixed(1)}x` : '—', color: prColor(avg30), arrow: null },
                    { label: 'Median baseline', value: fmtNum(baseline), color: 'text-foreground', arrow: null },
                  ];

                  return stats.map(s => (
                    <div key={s.label} className="flex-1 min-w-[80px] text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className={`text-sm font-bold ${s.color} flex items-center justify-center gap-0.5`}>
                        {s.value} {s.arrow}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </Card>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="space-y-6">

            {/* Section 3: Impact Delta — hidden on Universal portal */}
            {!isUniversal && artist.has_baseline && (
            <Card className="p-6 bg-card border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">Wavebound Impact Delta</h2>
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <DeltaCard label="Avg Views" value={artist.delta_avg_views_pct} />
                    <DeltaCard label="Engagement" value={artist.delta_engagement_pct} />
                    <DeltaCard label="Post Frequency" value={artist.delta_posting_freq_pct} />
                    <DeltaCard label="Followers" value={artist.delta_followers_pct} />
                  </div>
                  {(() => {
                    const allZero = [artist.delta_avg_views_pct, artist.delta_engagement_pct, artist.delta_posting_freq_pct, artist.delta_followers_pct].every(v => v === 0);
                    if (allZero) {
                      return (
                        <p className="text-xs text-muted-foreground mt-3 text-center italic">
                          Impact tracking begins after next data refresh
                        </p>
                      );
                    }
                    if (artist.baseline_date) {
                      return (
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          Compared to onboarding baseline on {format(new Date(artist.baseline_date), 'MMM d, yyyy')}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </>
            </Card>
            )}

            {/* Section 4: Release Readiness */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">Release Readiness</h2>
              <ReadinessGauge score={artist.release_readiness_score ?? 0} />

              {artist.latest_release_name && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {artist.latest_release_name}
                  {artist.latest_release_days_ago != null && ` · released ${artist.latest_release_days_ago}d ago`}
                </p>
              )}

              {/* Factor checklist */}
              <div className="mt-4 space-y-2">
                {Object.entries(factorLabels).map(([key, label]) => {
                  const passed = factors[key] ?? false;
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {passed
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      <span className={passed ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* ─── DEEP RESEARCH SECTIONS ─── */}
        <ArtistDeepSections data={deepData} />

        {/* ─── FULL WIDTH BOTTOM ─── */}

        {/* Section 5: Risk Alerts */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">Active Risk Alerts</h2>
          {risks.length > 0 ? (
            <div className="space-y-2">
              {risks.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.severity === 'high'
                    ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  <span className="text-foreground">{r.flag}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-400">No active risks</p>
          )}
        </Card>

        {/* Section 6: Deliverable Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '7-Day Content Plan', available: artist.has_content_plan, column: 'content_plan_html', icon: Calendar },
            { label: 'Intelligence Report', available: artist.has_intelligence_report, column: 'intelligence_report_html', icon: FileText },
            { label: '30-Day Plan', available: artist.has_30day_plan, column: 'content_plan_30d_html', fallbackColumn: 'thirty_day_plan_html', icon: BarChart3 },
            { label: 'Artist Brief', available: artist.has_artist_brief, column: 'artist_brief_html', icon: BadgeCheck },
          ].map(d => (
            <Card
              key={d.column}
              className={`p-4 border-border flex items-center gap-3 transition-colors ${
                d.available ? 'bg-card hover:bg-accent/50 cursor-pointer' : 'bg-muted/30 opacity-50 cursor-pointer'
              }`}
              onClick={async () => {
                const nh = artistHandle!.replace(/^@/, '').toLowerCase().trim();
                const { data } = await (supabase as any)
                  .from('artist_intelligence')
                  .select('content_plan_html, intelligence_report_html, content_plan_30d_html, thirty_day_plan_html, artist_brief_html')
                  .or(`artist_handle.eq.${nh},artist_handle.eq.@${nh}`)
                  .order('updated_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                const row = data as any;
                const html = row?.[d.column] || (d.fallbackColumn ? row?.[d.fallbackColumn] : null);
                if (!html) {
                  toast({ title: 'Not generated yet' });
                  return;
                }
                const newTab = window.open('', '_blank');
                if (newTab) {
                  newTab.document.write(html);
                  newTab.document.close();
                } else {
                  toast({ title: 'Please allow popups to view the report' });
                }
              }}
            >
              <d.icon className={`w-5 h-5 shrink-0 ${d.available ? 'text-foreground' : 'text-muted-foreground'}`} />
              <div>
                <span className={`text-sm font-medium ${d.available ? 'text-foreground' : 'text-muted-foreground'}`}>{d.label}</span>
                {!d.available && <p className="text-xs text-muted-foreground">Not generated</p>}
              </div>
            </Card>
          ))}
        </div>

        {/* Activity Feed */}
        <ArtistActivityFeed artistHandle={artistHandle!} />

        {/* Danger Zone */}
        {labelId && !isAdmin && (
          <Collapsible className="mt-8">
            <Card className="border-destructive/40 border-dashed bg-transparent">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-4 text-left">
                  <span className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                  </span>
                  <span className="text-xs text-muted-foreground">Click to expand</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Permanently remove this artist and all associated data from your roster. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" onClick={() => setRemoveDialogOpen(true)}>
                  Remove from Roster
                </Button>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {labelId && artist && (
          <RemoveArtistDialog
            artistName={artist.artist_name}
            artistHandle={artist.artist_handle}
            labelId={labelId}
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            onRemoved={() => navigate('/label')}
          />
        )}

      </div>
    </LabelLayout>
  );
}
