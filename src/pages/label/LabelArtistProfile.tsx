import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  supabase,
  SUPABASE_ANON_KEY,
  SUPABASE_URL_RAW,
} from "@/integrations/supabase/client";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import { useArtistBriefing } from "@/hooks/useArtistBriefing";
import { useContentIntelligence } from "@/hooks/useContentIntelligence";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RemoveArtistDialog from "@/components/label/RemoveArtistDialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useLabelPermissions } from "@/hooks/useLabelPermissions";
import { useDashboardRole } from "@/contexts/DashboardRoleContext";
import { format } from "date-fns";

// New tab components
import OverviewTab, {
  type ManualReleasePayload,
} from "@/components/label/artist-tabs/OverviewTab";
import ContentTab from "@/components/label/artist-tabs/ContentTab";
import SoundsTab from "@/components/label/artist-tabs/SoundsTab";
import GrowthTab from "@/components/label/artist-tabs/GrowthTab";
import DeliverableLinks from "@/components/label/artist-tabs/DeliverableLinks";

// Legacy fallback for marketing role
import IntelligenceTab from "@/components/label/intelligence/IntelligenceTab";
import BriefingHero from "@/components/label/briefing/BriefingHero";
import SignalMap from "@/components/label/briefing/SignalMap";
import OpportunityEngine from "@/components/label/briefing/OpportunityEngine";
import CompetitiveLens from "@/components/label/briefing/CompetitiveLens";
import Outlook from "@/components/label/briefing/Outlook";

import type { WeeklyPulse } from "@/components/label/briefing/AIFocus";
import type {
  NextReleaseIntel,
  ReleaseConfidence,
  ReleaseSourceType,
} from "@/data/contentDashboardHelpers";

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
  // Weekly pulse (fetched from artist_intelligence)
  weekly_pulse: WeeklyPulse | null;
  weekly_pulse_generated_at: string | null;
}

interface TimelinePointRaw {
  date_posted: string;
  video_views: number;
  video_likes: number;
  video_comments: number;
  video_shares: number;
  video_saves: number;
  video_url: string | null;
  video_id: string | null;
  video_embedded_url: string | null;
  caption: string | null;
  is_ad?: boolean;
  is_likely_promoted?: boolean;
}

interface ArtistIntelligenceProfileRow {
  content_plan_html: string | null;
  intelligence_report_html: string | null;
  content_plan_30d_html: string | null;
  thirty_day_plan_html: string | null;
  artist_brief_html: string | null;
  invite_code: string | null;
  weekly_pulse: WeeklyPulse | null;
  weekly_pulse_generated_at: string | null;
  artist_name?: string | null;
  avatar_url?: string | null;
  tiktok_followers?: number | null;
}

interface ReleaseCalendarRow {
  artist_handle: string;
  release_date: string;
  title: string | null;
  source_url: string | null;
  source_type: ReleaseSourceType | null;
  evidence: string | null;
  confidence: ReleaseConfidence;
  status: "ai_detected" | "confirmed" | "dismissed" | "manual";
  last_seen_at: string;
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabKey = "overview" | "content" | "sounds" | "growth";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "content", label: "Content" },
  { key: "sounds", label: "Sounds" },
  { key: "growth", label: "Growth" },
];

function normalizeArtistHandle(handle: string): string {
  return handle.replace(/^@/, "").toLowerCase().trim();
}

function releaseCalendarRowToNextRelease(
  row: ReleaseCalendarRow,
): NextReleaseIntel {
  return {
    date: row.release_date,
    title: row.title,
    source_url: row.source_url,
    source_type: row.source_type,
    evidence: row.evidence,
    confidence: row.confidence,
    checked_at: row.last_seen_at,
  };
}

function mergeReleaseCalendarIntoPulse(
  pulse: WeeklyPulse | null,
  row: ReleaseCalendarRow | null,
): WeeklyPulse | null {
  if (!row) return pulse;

  const nextRelease = releaseCalendarRowToNextRelease(row);
  return {
    ...(pulse ?? {}),
    next_release: nextRelease,
    next_release_date: nextRelease.date,
    next_release_title: nextRelease.title,
    next_release_source_url: nextRelease.source_url,
    next_release_source_type: nextRelease.source_type,
    next_release_evidence: nextRelease.evidence,
    next_release_confidence: nextRelease.confidence,
  };
}

async function fetchReleaseCalendarRow(
  labelId: string,
  artistHandle: string,
  accessToken: string | null,
): Promise<ReleaseCalendarRow | null> {
  const today = new Date().toISOString().slice(0, 10);
  const url = new URL(`${SUPABASE_URL_RAW}/rest/v1/artist_release_calendar`);
  url.searchParams.set(
    "select",
    [
      "artist_handle",
      "release_date",
      "title",
      "source_url",
      "source_type",
      "evidence",
      "confidence",
      "status",
      "last_seen_at",
    ].join(","),
  );
  url.searchParams.set("label_id", `eq.${labelId}`);
  url.searchParams.set("artist_handle", `eq.${artistHandle}`);
  url.searchParams.set("release_date", `gte.${today}`);
  url.searchParams.set("status", "in.(ai_detected,confirmed,manual)");
  url.searchParams.set("order", "release_date.asc");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken ?? SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    console.warn("Release calendar fetch failed", await res.text());
    return null;
  }

  const rows = (await res.json()) as ReleaseCalendarRow[];
  return rows[0] ?? null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LabelArtistProfile() {
  const { artistHandle } = useParams<{ artistHandle: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromPortal = searchParams.get("from");
  const isAdmin = fromPortal === "admin";
  const backPath = isAdmin
    ? "/admin/artists"
    : fromPortal === "universal"
      ? "/label/universal"
      : "/label";

  // Tab state from URL
  const rawTab = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = TABS.some((t) => t.key === rawTab)
    ? rawTab!
    : "overview";

  const [artist, setArtist] = useState<ArtistMetrics | null>(null);
  useSetPageTitle(artist?.artist_name ?? null);
  const [timeline, setTimeline] = useState<TimelinePointRaw[]>([]);
  const [organicOnly, setOrganicOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [confirmingRelease, setConfirmingRelease] = useState(false);
  const { labelId } = useUserProfile();
  const { canManage: canManageLabel } = useLabelPermissions();
  const { role } = useDashboardRole();

  // V2 Intelligence Briefing data (for marketing role + roster rank)
  const {
    entityId,
    briefing,
    rosterScores,
    isLoading: briefingLoading,
    noEntity,
  } = useArtistBriefing(artist?.artist_name ?? null, labelId);

  // Content intelligence data (for content role tabs)
  const { data: contentIntelData, loading: contentIntelLoading } =
    useContentIntelligence(entityId ?? null, artist?.artist_handle ?? null);

  // Marketing view toggle (only visible in marketing role)
  const [briefingView, setBriefingView] = useState<"v2" | "classic">("v2");

  useEffect(() => {
    if (!artistHandle) return;
    setLoading(true);

    const normalizedHandle = normalizeArtistHandle(artistHandle);

    const fetchAll = async () => {
      if (!labelId) return;
      const session = (await supabase.auth.getSession()).data.session;
      const [metricsRes, timelineRes, intelRes, releaseCalendarRow] =
        await Promise.all([
          supabase
            .from("roster_dashboard_metrics")
            .select("*")
            .eq("artist_handle", artistHandle)
            .eq("label_id", labelId)
            .maybeSingle(),
          supabase
            .from("artist_videos_tiktok")
            .select(
              "date_posted, video_views, video_likes, video_comments, video_shares, video_saves, video_url, video_id, video_embedded_url, caption, is_ad, is_likely_promoted",
            )
            .eq("artist_handle", artistHandle)
            .order("date_posted", { ascending: false })
            .limit(30),
          supabase
            .from("artist_intelligence")
            .select(
              "content_plan_html, intelligence_report_html, content_plan_30d_html, thirty_day_plan_html, artist_brief_html, invite_code, weekly_pulse, weekly_pulse_generated_at",
            )
            .eq("label_id", labelId)
            .or(
              `artist_handle.eq.${normalizedHandle},artist_handle.eq.@${normalizedHandle}`,
            )
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          fetchReleaseCalendarRow(
            labelId,
            normalizedHandle,
            session?.access_token ?? null,
          )
        ]);

      if (metricsRes.data) {
        const m = metricsRes.data as unknown as ArtistMetrics;
        const ai = intelRes.data as ArtistIntelligenceProfileRow | null;
        const plan30 = ai?.content_plan_30d_html || ai?.thirty_day_plan_html;
        setArtist({
          ...m,
          has_content_plan: m.has_content_plan || !!ai?.content_plan_html,
          has_intelligence_report:
            m.has_intelligence_report || !!ai?.intelligence_report_html,
          has_30day_plan: m.has_30day_plan || !!plan30,
          has_artist_brief: !!ai?.artist_brief_html,
          invite_code: ai?.invite_code ?? null,
          weekly_pulse: mergeReleaseCalendarIntoPulse(
            ai?.weekly_pulse ?? null,
            releaseCalendarRow,
          ),
          weekly_pulse_generated_at: ai?.weekly_pulse_generated_at ?? null,
        });
      } else if (isAdmin && intelRes.data) {
        const ai = intelRes.data as ArtistIntelligenceProfileRow;
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
          weekly_pulse: mergeReleaseCalendarIntoPulse(
            ai?.weekly_pulse ?? null,
            releaseCalendarRow,
          ),
          weekly_pulse_generated_at: ai?.weekly_pulse_generated_at ?? null,
        });
      }

      if (timelineRes.data) {
        setTimeline((timelineRes.data as TimelinePointRaw[]) ?? []);
      }
      setLoading(false);
    };

    fetchAll();
  }, [artistHandle, labelId, isAdmin]);

  // ── Chart data (RMM Performance) ──
  const chartData = useMemo(() => {
    const filtered = organicOnly
      ? timeline.filter(
          (pt) => pt.is_ad !== true && pt.is_likely_promoted !== true,
        )
      : timeline;

    const medianBaseline =
      artist?.median_views_baseline ??
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
    const cleanHandle = (artistHandle ?? "").replace(/^@/, "");
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
      const derivedUrl =
        pt.video_url ||
        (pt.video_id && cleanHandle
          ? `https://www.tiktok.com/@${cleanHandle}/video/${pt.video_id}`
          : null) ||
        (pt.video_embedded_url ? pt.video_embedded_url.split("?")[0] : null);
      return {
        ...pt,
        video_url: derivedUrl,
        views: pt.video_views,
        performance_ratio: Math.round(pr * 100) / 100,
        momentum_tier: tier,
        timestamp: new Date(pt.date_posted).getTime(),
        dateLabel: format(new Date(pt.date_posted), "MMM d"),
        monthLabel: format(new Date(pt.date_posted), "MMM"),
      };
    });
  }, [timeline, organicOnly, artist, artistHandle]);

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

  const handleManualReleaseConfirm = async (payload: ManualReleasePayload) => {
    if (!labelId || !artistHandle) return;

    const sourceUrl = payload.sourceUrl.trim();
    const releaseDate = payload.releaseDate.trim();
    const title = payload.title.trim() || null;

    if (!releaseDate || !sourceUrl) {
      toast({
        title: "Missing release details",
        description: "Add a release date and public source URL.",
        variant: "destructive",
      });
      return;
    }

    setConfirmingRelease(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        throw new Error("No active session");
      }

      const now = new Date().toISOString();
      const normalizedHandle = normalizeArtistHandle(artistHandle);
      const url = new URL(`${SUPABASE_URL_RAW}/rest/v1/artist_release_calendar`);
      url.searchParams.set("on_conflict", "label_id,artist_handle,release_date");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          label_id: labelId,
          artist_handle: normalizedHandle,
          release_date: releaseDate,
          title,
          source_url: sourceUrl,
          source_type: "manual",
          evidence: title
            ? `Label user confirmed "${title}" from ${sourceUrl}.`
            : `Label user confirmed an upcoming release from ${sourceUrl}.`,
          confidence: "high",
          status: "confirmed",
          detected_by: "label_user",
          last_seen_at: now,
          evidence_payload: {
            source_url: sourceUrl,
            entered_by: "label_user",
            checked_at: now,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const rows = (await res.json()) as ReleaseCalendarRow[];
      const row = rows[0];
      if (row) {
        setArtist((prev) =>
          prev
            ? {
                ...prev,
                weekly_pulse: mergeReleaseCalendarIntoPulse(
                  prev.weekly_pulse,
                  row,
                ),
              }
            : prev,
        );
      }

      toast({
        title: "Release confirmed",
        description: "The posting window will now use this release date.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Could not save release",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setConfirmingRelease(false);
    }
  };

  // ── Tab navigation ──
  const setTab = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setSearchParams(next, { replace: true });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
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

  // ── Marketing role: keep existing briefing view ──
  if (role === "marketing") {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backPath)}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

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
              Assembling briefing...
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
      </div>
    );
  }

  // ── Content & Social role: 4-tab layout ──
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(backPath)}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-7 border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`pb-3.5 text-[15px] font-[family-name:'DM_Sans',sans-serif] border-b-[2.5px] rounded-t-sm cursor-pointer transition-[color,border-color] duration-150 whitespace-nowrap ${
              activeTab === tab.key
                ? "font-semibold text-white/87 border-[#e8430a]"
                : "font-medium text-white/30 border-transparent hover:text-white/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <>
          {/* Overview shows profile + AI focus immediately (from page-level fetch),
              then intelligence data sections progressively */}
          <OverviewTab
            data={contentIntelData ?? null}
            artistName={artist.artist_name}
            artistHandle={artist.artist_handle}
            avatarUrl={artist.avatar_url}
            momentumTier={artist.momentum_tier}
            daysSinceLastPost={artist.days_since_last_post}
            tiktokFollowers={artist.tiktok_followers}
            instagramFollowers={artist.instagram_followers}
            monthlyListeners={artist.monthly_listeners}
            inviteCode={artist.invite_code}
            weeklyPulse={artist.weekly_pulse}
            weeklyPulseGeneratedAt={artist.weekly_pulse_generated_at}
            onManualReleaseConfirm={handleManualReleaseConfirm}
            manualReleasePending={confirmingRelease}
            chartData={chartData}
            organicOnly={organicOnly}
            onOrganicToggle={setOrganicOnly}
            currentPR={filteredStats.current}
            avg7PR={filteredStats.avg7}
            avg30PR={filteredStats.avg30}
            medianBaseline={artist.median_views_baseline}
            releaseReadinessScore={artist.release_readiness_score}
            riskFlags={artist.risk_flags}
            isLoading={contentIntelLoading}
          />
        </>
      )}
      {activeTab === "content" &&
        (contentIntelLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-60 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
            <Skeleton className="h-60 rounded-xl" />
          </div>
        ) : contentIntelData ? (
          <ContentTab data={contentIntelData} />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-white/[0.06] p-16 text-center">
            <p className="text-[15px] text-white/45">
              Content data not yet available
            </p>
          </div>
        ))}
      {activeTab === "sounds" &&
        (contentIntelLoading ? (
          <div className="space-y-4">
            {/* Sound Pulse Hero skeleton */}
            <div className="rounded-2xl p-6" style={{ background: "#1C1C1E" }}>
              <Skeleton className="h-3 w-24 rounded mb-5" />
              <div className="flex items-center gap-6">
                <Skeleton className="h-[68px] w-[68px] rounded-full shrink-0" />
                <div className="flex gap-6 flex-1">
                  <div>
                    <Skeleton className="h-2 w-16 rounded mb-2" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                  <div>
                    <Skeleton className="h-2 w-16 rounded mb-2" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                  <div>
                    <Skeleton className="h-2 w-20 rounded mb-2" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-8 w-[160px] rounded shrink-0" />
              </div>
            </div>
            {/* Catalog Velocity + TikTok skeletons */}
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
            {/* Streaming Intelligence skeleton */}
            <div className="rounded-2xl p-6" style={{ background: "#1C1C1E" }}>
              <Skeleton className="h-3 w-36 rounded mb-5" />
              <Skeleton className="h-[72px] w-full rounded mb-4" />
              <div className="grid grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n}>
                    <Skeleton className="h-2 w-20 rounded mb-2" />
                    <Skeleton className="h-5 w-14 rounded" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : contentIntelData ? (
          <SoundsTab data={contentIntelData} />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-white/[0.06] p-16 text-center">
            <p className="text-[15px] text-white/45">
              Sound data not yet available
            </p>
          </div>
        ))}
      {activeTab === "growth" &&
        (contentIntelLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
            <Skeleton className="h-60 rounded-xl" />
          </div>
        ) : contentIntelData ? (
          <GrowthTab
            data={contentIntelData}
            rosterScores={rosterScores}
            artistName={artist.artist_name}
            artistScore={contentIntelData.artistScore}
            entityId={entityId ?? null}
          />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-white/[0.06] p-16 text-center">
            <p className="text-[15px] text-white/45">
              Growth data not yet available
            </p>
          </div>
        ))}

      {/* Deliverable Links — always visible */}
      <DeliverableLinks
        artistHandle={artist.artist_handle}
        hasContentPlan={artist.has_content_plan}
        has30dayPlan={artist.has_30day_plan}
        hasArtistBrief={artist.has_artist_brief}
      />

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
                Permanently remove this artist and all associated data from your
                roster.
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
    </div>
  );
}
