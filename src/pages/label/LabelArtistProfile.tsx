import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import IntelligenceTab from "@/components/label/intelligence/IntelligenceTab";
import { useArtistBriefing } from "@/hooks/useArtistBriefing";
import BriefingHero from "@/components/label/briefing/BriefingHero";
import SignalMap from "@/components/label/briefing/SignalMap";
import OpportunityEngine from "@/components/label/briefing/OpportunityEngine";
import CompetitiveLens from "@/components/label/briefing/CompetitiveLens";
import Outlook from "@/components/label/briefing/Outlook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Calendar,
  BarChart3,
  BadgeCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ArtistDeepSections,
  type DeepResearchData,
} from "@/components/label/ArtistDeepSections";
import ArtistActivityFeed from "@/components/label/ArtistActivityFeed";
import RemoveArtistDialog from "@/components/label/RemoveArtistDialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useLabelPermissions } from "@/hooks/useLabelPermissions";
import RoleSelector from "@/components/label/RoleSelector";
import { useDashboardRole } from "@/contexts/DashboardRoleContext";
import ContentIntelligenceView from "@/components/label/intelligence/ContentIntelligenceView";
import ProfileHeader from "@/components/label/profile/ProfileHeader";
import PerformanceChart from "@/components/label/profile/PerformanceChart";
import ProfileSidebar from "@/components/label/profile/ProfileSidebar";
import { format } from "date-fns";

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LabelArtistProfile() {
  const { artistHandle } = useParams<{ artistHandle: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromPortal = searchParams.get("from");
  const activeTab =
    searchParams.get("tab") === "profile" ? "profile" : "intelligence";
  const isUniversal = fromPortal === "universal";
  const isAdmin = fromPortal === "admin";
  const backPath = isAdmin
    ? "/admin/artists"
    : isUniversal
      ? "/label/universal"
      : "/label";
  const [artist, setArtist] = useState<ArtistMetrics | null>(null);
  useSetPageTitle(artist?.artist_name ?? null);
  const [timeline, setTimeline] = useState<TimelinePointRaw[]>([]);
  const [organicOnly, setOrganicOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [deepData, setDeepData] = useState<DeepResearchData>({
    contentAnalysis: null,
    brandDocument: null,
    crossPlatform: null,
    commentData: null,
    spotifyData: null,
  });
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const { labelId } = useUserProfile();
  const { canManage: canManageLabel } = useLabelPermissions();

  const { role } = useDashboardRole();

  // V2 Intelligence Briefing data
  const {
    entityId,
    briefing,
    rosterScores,
    isLoading: briefingLoading,
    noEntity,
  } = useArtistBriefing(artist?.artist_name ?? null, labelId);
  const [briefingView, setBriefingView] = useState<"v2" | "classic">("v2");

  useEffect(() => {
    if (!artistHandle) return;
    setLoading(true);

    const safeParse = (val: any) => {
      if (val == null) return null;
      if (typeof val === "object") return val;
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    };

    const normalizedHandle = artistHandle
      .replace(/^@/, "")
      .toLowerCase()
      .trim();

    const fetchAll = async () => {
      if (!labelId) return;
      const [metricsRes, timelineRes, drjRes, intelRes] = await Promise.all([
        supabase
          .from("roster_dashboard_metrics")
          .select("*")
          .eq("artist_handle", artistHandle)
          .eq("label_id", labelId)
          .maybeSingle(),
        supabase
          .from("artist_videos_tiktok")
          .select(
            "date_posted, video_views, video_likes, video_comments, video_shares, video_saves, video_url, caption, is_ad, is_likely_promoted",
          )
          .eq("artist_handle", artistHandle)
          .order("date_posted", { ascending: false })
          .limit(30),
        supabase
          .from("deep_research_jobs")
          .select(
            "content_analysis_data, brand_document, cross_platform_data, comment_data, spotify_data",
          )
          .eq("artist_handle", artistHandle)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("artist_intelligence")
          .select(
            "content_plan_html, intelligence_report_html, content_plan_30d_html, thirty_day_plan_html, artist_brief_html, invite_code",
          )
          .eq("label_id", labelId)
          .or(
            `artist_handle.eq.${normalizedHandle},artist_handle.eq.@${normalizedHandle}`,
          )
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (metricsRes.data) {
        const m = metricsRes.data as any;
        const ai = intelRes.data as any;
        const plan30 = ai?.content_plan_30d_html || ai?.thirty_day_plan_html;
        setArtist({
          ...m,
          has_content_plan: m.has_content_plan || !!ai?.content_plan_html,
          has_intelligence_report:
            m.has_intelligence_report || !!ai?.intelligence_report_html,
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
          momentum_tier: "stable",
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
          has_30day_plan: !!(
            ai.content_plan_30d_html || ai.thirty_day_plan_html
          ),
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
  }, [artistHandle, labelId]);

  const chartData = useMemo(() => {
    const filtered = organicOnly
      ? timeline.filter(
          (pt) => pt.is_ad !== true && pt.is_likely_promoted !== true,
        )
      : timeline;

    // Compute median baseline: prefer artist-level value, else calculate from data
    const medianBaseline =
      (artist as any)?.median_views_baseline ??
      (() => {
        const views = filtered
          .map((p) => p.video_views)
          .filter(Boolean)
          .sort((a, b) => a - b);
        return views.length ? views[Math.floor(views.length / 2)] : 1;
      })();

    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(a.date_posted).getTime() - new Date(b.date_posted).getTime(),
    );
    return sorted.map((pt) => {
      const pr = medianBaseline > 0 ? pt.video_views / medianBaseline : 0;
      const tier =
        pr >= 10
          ? "viral"
          : pr >= 4
            ? "breakout"
            : pr >= 1.5
              ? "momentum"
              : pr >= 0.5
                ? "stable"
                : "stalled";
      return {
        ...pt,
        views: pt.video_views,
        performance_ratio: Math.round(pr * 100) / 100,
        momentum_tier: tier,
        timestamp: new Date(pt.date_posted).getTime(),
        dateLabel: format(new Date(pt.date_posted), "MMM d"),
        monthLabel: format(new Date(pt.date_posted), "MMM"),
      };
    });
  }, [timeline, organicOnly, artist]);

  const filteredStats = useMemo(() => {
    if (chartData.length === 0)
      return { current: null, avg7: null, avg30: null };
    const current = chartData[chartData.length - 1]?.performance_ratio ?? null;
    const last7 = chartData.slice(-7);
    const last30 = chartData.slice(-30);
    const avg = (arr: typeof chartData) => {
      const vals = arr.map((p) => p.performance_ratio).filter((v) => v != null);
      return vals.length > 0
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : null;
    };
    return { current, avg7: avg(last7), avg30: avg(last30) };
  }, [chartData]);

  const factors = (artist?.release_readiness_factors ?? {}) as Record<
    string,
    boolean
  >;
  const risks = artist?.risk_flags ?? [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
          <Skeleton className="h-96" />
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(backPath)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <p className="text-muted-foreground">Artist not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Back + Role selector */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(backPath)}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <RoleSelector />
      </div>

      {/* Tab bar */}
      <div className="flex gap-7 border-b border-white/[0.06]">
        {[
          { key: "intelligence" as const, label: "Intelligence" },
          { key: "profile" as const, label: "Profile" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              if (tab.key === "intelligence") {
                next.delete("tab");
              } else {
                next.set("tab", tab.key);
              }
              setSearchParams(next, { replace: true });
            }}
            className={`pb-3.5 text-[15px] font-[family-name:'DM_Sans',sans-serif] border-b-[2.5px] rounded-t-sm cursor-pointer transition-[color,border-color] duration-150 ${
              activeTab === tab.key
                ? "font-semibold text-white/87 border-[#e8430a]"
                : "font-medium text-white/30 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "intelligence" ? (
        <>
          {/* Content role: ContentIntelligenceView */}
          {role === "content" ? (
            <ContentIntelligenceView
              entityId={entityId ?? null}
              artistHandle={artist.artist_handle}
            />
          ) : (
            <>
              {/* Marketing role: V2/Classic toggle */}
              <div className="flex justify-end mb-4">
                <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
                  {(["v2", "classic"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setBriefingView(v)}
                      className={`font-[family-name:'DM_Sans',sans-serif] text-[12px] border-none rounded-md px-3.5 py-1.5 cursor-pointer transition-all duration-150 ${
                        briefingView === v
                          ? "font-semibold text-white/87 bg-white/[0.08]"
                          : "font-normal text-white/35 bg-transparent"
                      }`}
                    >
                      {v === "v2" ? "Intelligence Briefing" : "Classic View"}
                    </button>
                  ))}
                </div>
              </div>

              {briefingView === "classic" ? (
                <IntelligenceTab artistName={artist.artist_name} />
              ) : briefingLoading ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-[2.5px] border-white/[0.06] border-t-[#e8430a]"
                    style={{ animation: "labelSpin 0.8s linear infinite" }}
                  />
                  <div className="font-[family-name:'DM_Sans',sans-serif] text-[13px] text-white/35">
                    Assembling intelligence briefing...
                  </div>
                </div>
              ) : noEntity ? (
                <IntelligenceTab artistName={artist.artist_name} />
              ) : briefing ? (
                <div className="flex flex-col gap-5">
                  <BriefingHero data={briefing} />
                  <SignalMap data={briefing} />
                  <OpportunityEngine data={briefing} />
                  <CompetitiveLens
                    card={briefing.artistCard}
                    rosterScores={rosterScores}
                  />
                  <Outlook data={briefing} />
                </div>
              ) : (
                <IntelligenceTab artistName={artist.artist_name} />
              )}
            </>
          )}
        </>
      ) : (
        <>
          {/* 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
            {/* ─── LEFT COLUMN ─── */}
            <div className="space-y-6">
              <ProfileHeader
                artistName={artist.artist_name}
                artistHandle={artist.artist_handle}
                avatarUrl={artist.avatar_url}
                momentumTier={artist.momentum_tier}
                daysSinceLastPost={artist.days_since_last_post}
                tiktokFollowers={artist.tiktok_followers}
                instagramFollowers={artist.instagram_followers}
                monthlyListeners={artist.monthly_listeners}
                inviteCode={artist.invite_code}
              />

              <PerformanceChart
                chartData={chartData}
                organicOnly={organicOnly}
                onOrganicToggle={setOrganicOnly}
                currentPR={filteredStats.current}
                avg7PR={filteredStats.avg7}
                avg30PR={filteredStats.avg30}
                medianBaseline={artist.median_views_baseline}
              />
            </div>

            {/* ─── RIGHT COLUMN ─── */}
            <ProfileSidebar
              showImpactDelta={!isUniversal}
              hasBaseline={artist.has_baseline}
              deltaAvgViews={artist.delta_avg_views_pct}
              deltaEngagement={artist.delta_engagement_pct}
              deltaPostingFreq={artist.delta_posting_freq_pct}
              deltaFollowers={artist.delta_followers_pct}
              baselineDate={artist.baseline_date}
              releaseReadinessScore={artist.release_readiness_score}
              latestReleaseName={artist.latest_release_name}
              latestReleaseDaysAgo={artist.latest_release_days_ago}
              readinessFactors={factors}
            />
          </div>

          {/* ─── DEEP RESEARCH SECTIONS ─── */}
          <ArtistDeepSections data={deepData} />

          {/* ─── FULL WIDTH BOTTOM ─── */}

          {/* Section 5: Risk Alerts */}
          <Card className="p-6 bg-card border-border">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Active Risk Alerts
            </h2>
            {risks.length > 0 ? (
              <div className="space-y-2">
                {risks.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {r.severity === "high" ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
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
              {
                label: "7-Day Content Plan",
                available: artist.has_content_plan,
                column: "content_plan_html",
                icon: Calendar,
              },
              {
                label: "30-Day Plan",
                available: artist.has_30day_plan,
                column: "content_plan_30d_html",
                fallbackColumn: "thirty_day_plan_html",
                icon: BarChart3,
              },
              {
                label: "Artist Brief",
                available: artist.has_artist_brief,
                column: "artist_brief_html",
                icon: BadgeCheck,
              },
            ].map((d) => (
              <Card
                key={d.column}
                className={`p-4 border-border flex items-center gap-3 transition-colors ${
                  d.available
                    ? "bg-card hover:bg-accent/50 cursor-pointer"
                    : "bg-muted/30 opacity-50 cursor-pointer"
                }`}
                onClick={async () => {
                  const nh = artistHandle!
                    .replace(/^@/, "")
                    .toLowerCase()
                    .trim();
                  const { data } = await (supabase as any)
                    .from("artist_intelligence")
                    .select(
                      "content_plan_html, intelligence_report_html, content_plan_30d_html, thirty_day_plan_html, artist_brief_html",
                    )
                    .or(`artist_handle.eq.${nh},artist_handle.eq.@${nh}`)
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  const row = data as any;
                  const html =
                    row?.[d.column] ||
                    (d.fallbackColumn ? row?.[d.fallbackColumn] : null);
                  if (!html) {
                    toast({ title: "Not generated yet" });
                    return;
                  }
                  const newTab = window.open("", "_blank");
                  if (newTab) {
                    newTab.document.write(html);
                    newTab.document.close();
                  } else {
                    toast({ title: "Please allow popups to view the report" });
                  }
                }}
              >
                <d.icon
                  className={`w-5 h-5 shrink-0 ${d.available ? "text-foreground" : "text-muted-foreground"}`}
                />
                <div>
                  <span
                    className={`text-sm font-medium ${d.available ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {d.label}
                  </span>
                  {!d.available && (
                    <p className="text-xs text-muted-foreground">
                      Not generated
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Activity Feed */}
          <ArtistActivityFeed artistHandle={artistHandle!} />

          {/* Danger Zone — only label admins */}
          {labelId && !isAdmin && canManageLabel && (
            <Collapsible className="mt-8">
              <Card className="border-destructive/40 border-dashed bg-transparent">
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between p-4 text-left">
                    <span className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Danger Zone
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Click to expand
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Permanently remove this artist and all associated data from
                    your roster. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRemoveDialogOpen(true)}
                  >
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
              onRemoved={() => navigate("/label")}
            />
          )}
        </>
      )}
    </div>
  );
}
