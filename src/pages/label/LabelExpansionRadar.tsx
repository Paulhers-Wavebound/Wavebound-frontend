import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import ArtistSelector from "@/components/expansion-radar/ArtistSelector";
import MethodologyExplainer from "@/components/expansion-radar/MethodologyExplainer";
import GlobalCoverageMap from "@/components/expansion-radar/GlobalCoverageMap";
import StreamingVsSocial from "@/components/expansion-radar/StreamingVsSocial";
import SummaryInsight from "@/components/expansion-radar/SummaryInsight";
import EntrySongs from "@/components/expansion-radar/EntrySongs";
import SpilloverTimeline from "@/components/expansion-radar/SpilloverTimeline";
import ComparableOverlay from "@/components/expansion-radar/ComparableOverlay";
import MarketHeatGrid from "@/components/expansion-radar/MarketHeatGrid";
import TopExpansionBanner from "@/components/expansion-radar/TopExpansionBanner";
import ExpansionOpportunityCards from "@/components/expansion-radar/ExpansionOpportunityCards";
import RevenueSizing from "@/components/expansion-radar/RevenueSizing";
import SignalFeed from "@/components/expansion-radar/SignalFeed";
import RosterBadge from "@/components/expansion-radar/RosterBadge";
import MarketIntelligenceCards from "@/components/expansion-radar/MarketIntelligenceCards";
import BudgetAllocationChart from "@/components/expansion-radar/BudgetAllocationChart";
import { useExpansionRadar } from "@/components/expansion-radar/useExpansionRadar";
import { useMarketIntelligence } from "@/components/expansion-radar/useMarketIntelligence";

function SkeletonBlock({ height, width }: { height: number; width?: string }) {
  return (
    <div
      style={{
        height,
        width: width ?? "100%",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        animation: "skeletonPulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function SkeletonLoader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SkeletonBlock height={52} />
      <SkeletonBlock height={340} />
      <div
        className="er-two-col"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
      >
        <SkeletonBlock height={420} />
        <SkeletonBlock height={420} />
      </div>
      <SkeletonBlock height={72} />
      <SkeletonBlock height={200} />
      <SkeletonBlock height={160} />
      <SkeletonBlock height={320} />
      <div
        className="er-two-col"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
      >
        <SkeletonBlock height={320} />
        <SkeletonBlock height={320} />
        <SkeletonBlock height={320} />
        <SkeletonBlock height={320} />
      </div>
      <SkeletonBlock height={180} />
      <SkeletonBlock height={300} />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(220,38,38,0.2)",
        borderRadius: 12,
        padding: 32,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 8,
        }}
      >
        Failed to load expansion data
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          color: "var(--ink-tertiary)",
        }}
      >
        {message}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 64,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 18,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 8,
        }}
      >
        Select an artist to view expansion intelligence
      </div>
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 14,
          color: "var(--ink-tertiary)",
          margin: 0,
          maxWidth: 400,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.5,
        }}
      >
        Search any of 25K+ artists to analyze their cross-platform market
        presence, discovery signals, and untapped expansion opportunities.
      </p>
    </motion.div>
  );
}

export default function LabelExpansionRadar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEntityId = searchParams.get("artist") || null;

  const setSelectedEntityId = useCallback(
    (id: string) => {
      setSearchParams({ artist: id }, { replace: true });
    },
    [setSearchParams],
  );

  const { data, loading, error } = useExpansionRadar(selectedEntityId);
  const { byCountry: marketIntel } = useMarketIntelligence();

  const activeMarketCodes = useMemo(
    () => new Set(data?.active_markets.map((m) => m.country_code) ?? []),
    [data?.active_markets],
  );

  const isRoster = data?._meta?.is_roster === true;

  // Debug: check roster data presence
  if (data && isRoster) {
    console.log("[Roster Intelligence]", {
      is_roster: data._meta?.is_roster,
      enriched_count: data.enriched_opportunities?.length ?? 0,
      budget_count: data.budget_allocation?.length ?? 0,
      top_enriched: data.enriched_opportunities?.[0],
    });
  }

  return (
    <>
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "40px 44px 72px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <ArtistSelector
          selectedId={selectedEntityId}
          artistName={data?.artist.name}
          monthlyListeners={data?.artist.monthly_listeners}
          globalRank={data?.artist.global_rank}
          marketsReached={data?.artist.markets_reached}
          totalMarkets={data?.artist.total_markets_tracked}
          artistScore={data?.artist.artist_score}
          tier={data?.artist.tier}
          trend={data?.artist.trend}
          momentumScore={data?.artist.momentum_score}
          crossPlatformSignal={data?.artist.cross_platform_signal}
          platformsGrowing={data?.artist.platforms_growing}
          onSelect={setSelectedEntityId}
        />

        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <ErrorState message={error} />
        ) : data ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <MethodologyExplainer
                artistName={data.artist.name}
                totalMarkets={data.artist.total_markets_tracked}
                comparables={data.comparable_artists}
              />
              {isRoster && <RosterBadge />}
            </div>

            <GlobalCoverageMap
              activeMarkets={data.active_markets}
              opportunities={data.expansion_opportunities}
              marketHeat={data.market_heat}
              discoveryRadar={data.discovery_radar}
              marketIntel={marketIntel}
            />

            <StreamingVsSocial
              activeMarkets={data.active_markets}
              discoveryRadar={data.discovery_radar}
              artistName={data.artist.name}
            />

            <SummaryInsight
              artist={data.artist}
              opportunities={data.expansion_opportunities}
              revenueSizing={data.revenue_sizing}
              discoveryRadar={data.discovery_radar}
            />

            <EntrySongs
              entrySongs={data.entry_songs}
              artistName={data.artist.name}
            />

            <SpilloverTimeline
              predictions={data.spillover_predictions}
              activeMarketCodes={activeMarketCodes}
            />

            <TopExpansionBanner
              heatData={data.market_heat}
              activeMarkets={data.active_markets}
              artistName={data.artist.name}
              marketIntel={marketIntel}
            />

            <MarketHeatGrid
              heatData={data.market_heat}
              opportunities={data.expansion_opportunities}
              activeMarkets={data.active_markets}
              artistName={data.artist.name}
              marketIntel={marketIntel}
            />

            {isRoster && data.enriched_opportunities ? (
              <>
                <MarketIntelligenceCards
                  opportunities={data.enriched_opportunities}
                  artistName={data.artist.name}
                  marketIntel={marketIntel}
                  marketEvidence={data.market_evidence}
                />
                <BudgetAllocationChart
                  allocations={data.budget_allocation || []}
                />
              </>
            ) : (
              <ExpansionOpportunityCards
                opportunities={data.expansion_opportunities}
                artistName={data.artist.name}
                marketIntel={marketIntel}
              />
            )}

            <ComparableOverlay
              artist={data.artist}
              comparables={data.comparable_artists}
            />

            <RevenueSizing revenueSizing={data.revenue_sizing} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      <SignalFeed data={data} />

      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 1024px) {
          /* Hide Status (2nd) and Health (5th) columns on narrow screens */
          .er-heat-grid th:nth-child(2),
          .er-heat-grid td:nth-child(2),
          .er-heat-grid th:nth-child(5),
          .er-heat-grid td:nth-child(5) {
            display: none !important;
          }
          /* Stack the expansion banner */
          .er-banner-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .er-banner-row button {
            align-self: flex-start !important;
          }
          /* Stack Why This Market grid */
          .er-why-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 900px) {
          .er-two-col { grid-template-columns: 1fr !important; }
          .er-three-col { grid-template-columns: 1fr !important; }
          .er-artist-bar { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .er-artist-stats { flex-wrap: wrap !important; gap: 12px !important; }
          .er-spillover-flow { flex-wrap: wrap !important; }
        }
      `}</style>
    </>
  );
}
