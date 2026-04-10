import { useQuery } from "@tanstack/react-query";
import {
  resolveEntityId,
  getArtistCard,
  getArtistAlerts,
} from "@/utils/artistIntelligenceApi";
import {
  getArtistSongVelocity,
  getMarketOpportunitiesV2,
  getMarketIntelligence,
  getMarketSpillovers,
  getRosterScores,
} from "@/utils/artistBriefingApi";
import type { RosterScoreEntry } from "@/utils/artistBriefingApi";
import type { BriefingData } from "@/types/artistBriefing";

const STALE_5M = 5 * 60 * 1000;

export function useArtistBriefing(
  artistName: string | null,
  labelId?: string | null,
) {
  // Step 1: Resolve entity_id
  const entityQuery = useQuery({
    queryKey: ["entity-id", artistName],
    queryFn: () => resolveEntityId(artistName!),
    enabled: !!artistName,
    staleTime: STALE_5M,
    retry: 1,
  });

  const entityId = entityQuery.data;
  const hasEntity = !!entityId;

  // Step 2: Fetch core intelligence (existing APIs)
  const cardQuery = useQuery({
    queryKey: ["artist-card", entityId],
    queryFn: () => getArtistCard(entityId!),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  const alertsQuery = useQuery({
    queryKey: ["artist-alerts", entityId],
    queryFn: () => getArtistAlerts(entityId!, { limit: 30 }),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  // Step 3: Fetch V2 data (direct Supabase queries)
  const songsQuery = useQuery({
    queryKey: ["song-velocity", entityId],
    queryFn: () => getArtistSongVelocity(entityId!),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  const marketsV2Query = useQuery({
    queryKey: ["markets-v2", entityId],
    queryFn: () => getMarketOpportunitiesV2(entityId!),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  const marketIntelQuery = useQuery({
    queryKey: ["market-intelligence"],
    queryFn: () => getMarketIntelligence(),
    staleTime: STALE_5M,
  });

  // Step 4: Roster scores for competitive lens
  const rosterQuery = useQuery({
    queryKey: ["roster-scores", labelId],
    queryFn: () => getRosterScores(labelId!),
    enabled: !!labelId,
    staleTime: STALE_5M,
  });

  // Step 5: Spillover predictions based on artist's active markets
  const activeCountries =
    marketsV2Query.data
      ?.filter((m) => m.is_present && m.velocity !== "declining")
      .map((m) => m.country_code)
      .slice(0, 20) ?? [];

  const spilloverQuery = useQuery({
    queryKey: ["spillovers", activeCountries.sort().join(",")],
    queryFn: () => getMarketSpillovers(activeCountries),
    enabled: activeCountries.length > 0,
    staleTime: STALE_5M,
  });

  // Assemble
  const isLoading =
    entityQuery.isLoading ||
    (hasEntity && cardQuery.isLoading) ||
    (hasEntity && alertsQuery.isLoading);

  const error = entityQuery.error || cardQuery.error || alertsQuery.error;

  const noEntity = !entityQuery.isLoading && !entityId && !entityQuery.error;

  const briefing: BriefingData | null =
    cardQuery.data && alertsQuery.data
      ? {
          artistCard: cardQuery.data,
          alerts: alertsQuery.data,
          marketsV2: marketsV2Query.data ?? [],
          songs: songsQuery.data ?? [],
          marketIntel: marketIntelQuery.data ?? [],
          spillovers: spilloverQuery.data ?? [],
        }
      : null;

  return {
    entityId,
    briefing,
    rosterScores: (rosterQuery.data ?? []) as RosterScoreEntry[],
    isLoading,
    error,
    noEntity,
    // Expose individual loading states for progressive rendering
    songsLoading: songsQuery.isLoading,
    marketsLoading: marketsV2Query.isLoading,
    marketIntelLoading: marketIntelQuery.isLoading,
    spilloversLoading: spilloverQuery.isLoading,
    rosterLoading: rosterQuery.isLoading,
  };
}
