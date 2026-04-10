import { useQuery } from "@tanstack/react-query";
import {
  resolveEntityId,
  getArtistCard,
  getArtistAlerts,
  getMarketMap,
  getTikTokProfile,
  getCatalogTikTok,
} from "@/utils/artistIntelligenceApi";
import ScoreHeroCard from "./ScoreHeroCard";
import AlertsFeed from "./AlertsFeed";
import PlatformSignals from "./PlatformSignals";
import TikTokProfileCard from "./TikTokProfileCard";
import CatalogIntelligence from "./CatalogIntelligence";
import FanSentiment from "./FanSentiment";
import CoverageGaps from "./CoverageGaps";
import GeoMarketMap from "./GeoMarketMap";

const STALE_5M = 5 * 60 * 1000;

interface IntelligenceTabProps {
  artistName: string;
}

export default function IntelligenceTab({ artistName }: IntelligenceTabProps) {
  // Step 1: Resolve entity_id from artist name
  const {
    data: entityId,
    isLoading: resolvingEntity,
    error: resolveError,
  } = useQuery({
    queryKey: ["entity-id", artistName],
    queryFn: () => resolveEntityId(artistName),
    enabled: !!artistName,
    staleTime: STALE_5M,
    retry: 1,
  });

  // Step 2: Fetch all intelligence data in parallel (enabled once entityId resolves)
  const hasEntity = !!entityId;

  const cardQuery = useQuery({
    queryKey: ["artist-card", entityId],
    queryFn: () => getArtistCard(entityId!),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  const alertsQuery = useQuery({
    queryKey: ["artist-alerts", entityId],
    queryFn: () => getArtistAlerts(entityId!, { limit: 20 }),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  const marketQuery = useQuery({
    queryKey: ["market-map", entityId],
    queryFn: () => getMarketMap(entityId!),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  const tiktokQuery = useQuery({
    queryKey: ["tiktok-profile", entityId],
    queryFn: () => getTikTokProfile(entityId!),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  const catalogTTQuery = useQuery({
    queryKey: ["catalog-tiktok", entityId],
    queryFn: () => getCatalogTikTok(entityId!),
    enabled: hasEntity,
    staleTime: STALE_5M,
  });

  // Loading: entity resolution or core card loading
  if (resolvingEntity || (hasEntity && cardQuery.isLoading)) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: "2.5px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "labelSpin 0.8s linear infinite",
          }}
        />
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-tertiary)",
          }}
        >
          {resolvingEntity
            ? "Looking up artist..."
            : "Loading intelligence data..."}
        </div>
      </div>
    );
  }

  // No entity found (resolved but null)
  if (!resolvingEntity && !entityId && !resolveError) {
    return (
      <div
        style={{
          border: "2px dashed var(--border)",
          borderRadius: "var(--radius)",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            color: "var(--ink-tertiary)",
          }}
        >
          Intelligence data not yet available for this artist
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-faint)",
            marginTop: 8,
          }}
        >
          Data appears once the artist is linked in the intelligence pipeline
        </div>
      </div>
    );
  }

  // Error state (resolve error or card fetch error)
  const fatalError = resolveError || cardQuery.error;
  if (fatalError) {
    return (
      <div
        style={{
          border: "2px dashed var(--border)",
          borderRadius: "var(--radius)",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            color: "#FF453A",
          }}
        >
          Failed to load intelligence
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            color: "var(--ink-tertiary)",
            marginTop: 8,
          }}
        >
          {fatalError instanceof Error ? fatalError.message : "Unknown error"}
        </div>
      </div>
    );
  }

  const card = cardQuery.data;
  if (!card) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Section 1: Score Hero */}
      <ScoreHeroCard card={card} />

      {/* Two-column layout for middle sections (stacks on <900px via CSS) */}
      <div className="intel-grid">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section 2: Alerts */}
          <AlertsFeed alerts={alertsQuery.data ?? null} />

          {/* Section 5: Catalog Intelligence */}
          <CatalogIntelligence
            card={card}
            catalogTikTok={catalogTTQuery.data ?? []}
          />
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section 3: Platform Signals */}
          <PlatformSignals card={card} />

          {/* Section 4: TikTok Profile */}
          <TikTokProfileCard profile={tiktokQuery.data ?? null} />

          {/* Section 6: Fan Sentiment */}
          <FanSentiment card={card} />
        </div>
      </div>

      {/* Section 7: Platform Coverage (full width, hides if 90%+) */}
      <CoverageGaps card={card} />

      {/* Section 8: Geographic Markets (full width) */}
      <GeoMarketMap marketMap={marketQuery.data ?? null} />
    </div>
  );
}
