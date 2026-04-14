import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useContentDashboardData } from "@/hooks/useContentDashboardData";
import { useIntelligenceBriefs } from "@/hooks/useIntelligenceBriefs";
import { usePresidentBrief } from "@/hooks/usePresidentBrief";
import {
  generateContentBriefing,
  generateContentInsight,
  generateSignalReport,
} from "@/data/contentDashboardHelpers";
import type {
  SignalReport,
  DecisionCategory,
  DecisionPoint,
} from "@/data/contentDashboardHelpers";
import type { AISignalReport } from "@/hooks/usePresidentBrief";
import PresidentBriefCard from "@/components/label/PresidentBriefCard";
import SignalReportCard from "./SignalReportCard";
import ContentBriefingCard from "./ContentBriefingCard";
import ContentRosterTable from "./ContentRosterTable";
import SoundPerformanceSection from "./SoundPerformanceSection";
import ContentInsightBanner from "./ContentInsightBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import WelcomeGreeting from "@/components/label/WelcomeGreeting";

function useUserFirstName(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email) {
        const local = email.split("@")[0];
        setName(local.charAt(0).toUpperCase() + local.slice(1));
      }
    });
  }, []);
  return name;
}

export default function ContentSocialDashboard() {
  const { labelName } = useUserProfile();
  const userName = useUserFirstName();
  const { artists, anomalies, songUGC, loading, error } =
    useContentDashboardData();
  const aiBriefs = useIntelligenceBriefs();
  const presidentBrief = usePresidentBrief("content");

  const briefing = useMemo(() => {
    const base = generateContentBriefing(
      artists,
      anomalies,
      labelName || "Your Label",
    );
    // When AI briefs exist, replace client-side actions with AI-extracted ones
    if (aiBriefs.hasAiBriefs && aiBriefs.actionItems.length > 0) {
      const items = aiBriefs.actionItems.slice(0, 4);
      const uniqueArtists = new Set(items.map((a) => a.artistName));
      const singleArtist = uniqueArtists.size === 1;
      return {
        ...base,
        actions: items.map((a) =>
          singleArtist ? a.text : `${a.artistName}: ${a.text}`,
        ),
        actionsArtist: singleArtist ? items[0].artistName : null,
      };
    }
    return base;
  }, [artists, anomalies, labelName, aiBriefs]);

  const insight = useMemo(
    () => generateContentInsight(artists, anomalies),
    [artists, anomalies],
  );

  // Signal Report — prefer AI-generated (from generate-signal-report edge function)
  // Falls back to client-side generation if no AI report exists
  const signalReport = useMemo((): SignalReport | null => {
    if (artists.length === 0) return null;

    const aiReport = presidentBrief.aiReport;

    // If we have an AI-generated Signal Report, map it to our SignalReport type
    if (aiReport && aiReport.decision_points?.length > 0) {
      const VALID_CATEGORIES = new Set([
        "MOMENTUM_CAPTURE",
        "BUDGET_REALLOCATION",
        "FORMAT_PIVOT",
        "CATALOG_ACTIVATION",
        "CONTENT_PIPELINE",
        "CRISIS_RESPONSE",
        "CONVERSION_ALERT",
      ]);

      // Map artist names to their data for avatars and handles
      const artistMap = new Map(
        artists.map((a) => [a.artist_name.toLowerCase(), a]),
      );

      const dateStr = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

      // Compute roster-level metrics from live data (always fresh)
      const withViewDelta = artists.filter((a) => a.velocity_views_pct != null);
      const avgVelocityDelta =
        withViewDelta.length > 0
          ? withViewDelta.reduce((s, a) => s + (a.velocity_views_pct ?? 0), 0) /
            withViewDelta.length
          : 0;
      const withSaveRate = artists.filter((a) => a.save_to_reach_pct != null);
      const avgSaveRate =
        withSaveRate.length > 0
          ? withSaveRate.reduce((s, a) => s + (a.save_to_reach_pct ?? 0), 0) /
            withSaveRate.length
          : null;
      const breakoutCount = artists.filter(
        (a) => a.momentum_tier === "breakout" || a.momentum_tier === "viral",
      ).length;
      const atRiskCount = artists.filter(
        (a) =>
          a.risk_flags &&
          a.risk_flags.some(
            (f: { severity: string }) => f.severity === "critical",
          ),
      ).length;

      const decisionPoints: DecisionPoint[] = aiReport.decision_points.map(
        (dp) => {
          // Resolve ALL matching artists for avatar/handle
          const allArtists = (dp.artist_names || []).map((name: string) => {
            const matched = artistMap.get(name.toLowerCase()) || null;
            return {
              name,
              handle: matched?.artist_handle || "",
              avatar_url: matched?.avatar_url || null,
            };
          });
          const firstArtist = allArtists[0] || null;
          const displayName =
            dp.artist_names?.length > 1
              ? dp.artist_names.join(", ")
              : dp.artist_names?.[0] || "Roster";

          const category = VALID_CATEGORIES.has(dp.category)
            ? (dp.category as DecisionCategory)
            : "MOMENTUM_CAPTURE";

          return {
            id: dp.id,
            category,
            artist_name: displayName,
            artist_handle: firstArtist?.handle || "",
            avatar_url: firstArtist?.avatar_url || null,
            all_artists: allArtists,
            signal: dp.signal,
            decision: dp.decision,
            urgency: dp.urgency,
            evidence: (dp.evidence || []).map((e) => {
              // AI returns flat strings like "Billboard #65" — show as single chip
              if (typeof e === "string") {
                return { label: e, value: "" };
              }
              return e as { label: string; value: string; color?: string };
            }),
          };
        },
      );

      // Extract risk alerts from live data (not from AI — always current)
      const riskAlerts = artists
        .flatMap((a) =>
          (a.risk_flags || [])
            .filter(
              (f: { severity: string }) =>
                f.severity === "critical" || f.severity === "warning",
            )
            .map((f: { severity: string; message: string }) => ({
              artist_name: a.artist_name,
              avatar_url: a.avatar_url || null,
              message: f.message,
              severity: f.severity,
            })),
        )
        .sort(
          (a, b) =>
            (a.severity === "critical" ? -1 : 1) -
            (b.severity === "critical" ? -1 : 1),
        )
        .slice(0, 5);

      return {
        date: dateStr,
        rosterPulse: aiReport.roster_pulse || aiReport.headline,
        decisionPoints,
        riskAlerts,
        todos: [], // AI report doesn't generate checkable todos — decisions ARE the actions
        metrics: {
          activeArtists: artists.filter(
            (a) =>
              a.days_since_last_post != null && a.days_since_last_post < 14,
          ).length,
          totalArtists: artists.length,
          avgVelocityDelta,
          avgSaveRate,
          breakoutCount,
          atRiskCount,
        },
      };
    }

    // Fallback: client-side generation
    return generateSignalReport(
      artists,
      anomalies,
      songUGC,
      labelName || "Your Label",
    );
  }, [artists, anomalies, songUGC, labelName, presidentBrief.aiReport]);

  // Welcome greeting — resets each calendar day, persists within a session
  const [revealed, setRevealed] = useState(() => {
    try {
      const stored = sessionStorage.getItem("wb-dashboard-revealed");
      if (!stored) return false;
      const storedDate = new Date(Number(stored)).toDateString();
      return storedDate === new Date().toDateString();
    } catch {
      return false;
    }
  });

  const handleReveal = useCallback(() => {
    setRevealed(true);
    try {
      sessionStorage.setItem("wb-dashboard-revealed", String(Date.now()));
    } catch {
      // sessionStorage unavailable — no-op
    }
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10 space-y-6">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-base font-medium text-foreground">
          Something went wrong
        </p>
        <p className="text-sm text-muted-foreground">
          Could not load your content dashboard. Try refreshing.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-lg font-semibold text-foreground">
          Your roster is empty
        </p>
        <p className="text-sm text-muted-foreground">
          Add your first artist to get started
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      {/* Header — always visible */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold text-white/87">
          {labelName || "Your Label"}
        </h1>
        <span className="text-sm text-white/40">{artists.length} Artists</span>
      </div>

      {/* Signal Report — guarded behind welcome greeting */}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="welcome"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <WelcomeGreeting
              userName={userName}
              totalArtists={artists.length}
              signalReport={signalReport}
              onReveal={handleReveal}
            />
          </motion.div>
        ) : (
          <motion.div
            key="brief"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {signalReport ? (
              <SignalReportCard
                report={signalReport}
                userName={userName}
                aiBriefText={
                  presidentBrief.aiReport?.headline || presidentBrief.text
                }
                aiBriefGeneratedAt={presidentBrief.generatedAt}
                briefDate={
                  presidentBrief.briefDate ??
                  new Date().toISOString().slice(0, 10)
                }
              />
            ) : (
              <ContentBriefingCard
                briefing={briefing}
                userName={userName}
                aiGeneratedAt={aiBriefs.latestGeneratedAt}
                aiBriefSections={aiBriefs.sections}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roster Table — always visible */}
      <ContentRosterTable artists={artists} />

      {/* Sound Performance / UGC — always visible */}
      <SoundPerformanceSection songs={songUGC} />

      {/* Insight Banner — always visible */}
      <ContentInsightBanner insight={insight} />
    </div>
  );
}
