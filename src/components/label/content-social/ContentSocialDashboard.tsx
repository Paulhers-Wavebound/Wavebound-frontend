import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useContentDashboardData } from "@/hooks/useContentDashboardData";
import { useIntelligenceBriefs } from "@/hooks/useIntelligenceBriefs";
import { usePresidentBrief } from "@/hooks/usePresidentBrief";
import {
  buildPriorityItems,
  generateContentBriefing,
  generateContentInsight,
} from "@/data/contentDashboardHelpers";
import PresidentBriefCard from "@/components/label/PresidentBriefCard";
import ContentBriefingCard from "./ContentBriefingCard";
import ContentPriorityCards from "./ContentPriorityCards";
import ContentRosterTable from "./ContentRosterTable";
import SoundPerformanceSection from "./SoundPerformanceSection";
import ContentInsightBanner from "./ContentInsightBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
      // Group by artist — if all same artist, omit prefix from each line
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

  const priorityItems = useMemo(
    () => buildPriorityItems(artists, anomalies, songUGC),
    [artists, anomalies, songUGC],
  );

  const insight = useMemo(
    () => generateContentInsight(artists, anomalies),
    [artists, anomalies],
  );

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
      {/* Header */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold text-white/87">
          {labelName || "Your Label"}
        </h1>
        <span className="text-sm text-white/40">{artists.length} Artists</span>
      </div>

      {/* Executive Briefing — President Brief when available, fallback to legacy */}
      {presidentBrief.text ? (
        <PresidentBriefCard
          text={presidentBrief.text}
          generatedAt={presidentBrief.generatedAt}
          userName={userName}
        />
      ) : (
        <ContentBriefingCard
          briefing={briefing}
          userName={userName}
          aiGeneratedAt={aiBriefs.latestGeneratedAt}
          aiBriefSections={aiBriefs.sections}
        />
      )}

      {/* Priority Cards */}
      <ContentPriorityCards items={priorityItems} />

      {/* Roster Table */}
      <ContentRosterTable artists={artists} />

      {/* Sound Performance / UGC */}
      <SoundPerformanceSection songs={songUGC} />

      {/* Insight Banner */}
      <ContentInsightBanner insight={insight} />
    </div>
  );
}
