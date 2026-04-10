import { supabase } from "@/integrations/supabase/client";
import type {
  SongVelocityEntry,
  MarketOpportunityV2,
  MarketIntelligence,
  MarketSpillover,
} from "@/types/artistBriefing";

// ─── Song Velocity (artist's catalog with velocity classification) ─

export async function getArtistSongVelocity(
  artistEntityId: string,
): Promise<SongVelocityEntry[]> {
  const { data, error } = await supabase
    .from("song_velocity")
    .select("*")
    .eq("artist_entity_id", artistEntityId)
    .order("daily_streams", { ascending: false });

  if (error) {
    console.warn(
      "song_velocity query failed (may need RLS/table):",
      error.message,
    );
    return [];
  }
  return (data as SongVelocityEntry[]) ?? [];
}

// ─── Enhanced Market Opportunities (v2 with spillover + cascade) ───

export async function getMarketOpportunitiesV2(
  entityId: string,
): Promise<MarketOpportunityV2[]> {
  const { data, error } = await supabase
    .from("market_opportunity_v2")
    .select("*")
    .eq("entity_id", entityId)
    .order("opportunity_score", { ascending: false });

  if (error) {
    console.warn(
      "market_opportunity_v2 query failed (may need RLS/table):",
      error.message,
    );
    return [];
  }
  return (data as MarketOpportunityV2[]) ?? [];
}

// ─── Market Intelligence (CPM data for opportunity scoring) ────────

export async function getMarketIntelligence(): Promise<MarketIntelligence[]> {
  const { data, error } = await supabase
    .from("market_intelligence")
    .select("*")
    .order("country_name", { ascending: true });

  if (error) {
    console.warn(
      "market_intelligence query failed (may need RLS/table):",
      error.message,
    );
    return [];
  }
  return (data as MarketIntelligence[]) ?? [];
}

// ─── Market Spillover (cascade probabilities between countries) ────

export async function getMarketSpillovers(
  fromCountries: string[],
): Promise<MarketSpillover[]> {
  if (fromCountries.length === 0) return [];

  const { data, error } = await supabase
    .from("market_spillover")
    .select("*")
    .in("from_country", fromCountries)
    .gte("confidence_pct", 15)
    .order("confidence_pct", { ascending: false })
    .limit(100);

  if (error) {
    console.warn(
      "market_spillover query failed (may need RLS/table):",
      error.message,
    );
    return [];
  }
  return (data as MarketSpillover[]) ?? [];
}

// ─── Roster Scores (for competitive lens — all artists in the label) ─

export interface RosterScoreEntry {
  entity_id: string;
  canonical_name: string;
  artist_score: number;
  tier: string;
  trend: string;
  momentum_score: number;
  health_score: number;
  discovery_score: number;
  catalog_score: number;
  total_markets: number | null;
  platforms_growing: number | null;
  platforms_declining: number | null;
}

export async function getRosterScores(
  labelId: string,
): Promise<RosterScoreEntry[]> {
  // Get all artists from the roster via artist_intelligence, then join with artist_score
  const { data: roster, error: rosterError } = await supabase
    .from("artist_intelligence")
    .select("artist_name")
    .eq("label_id", labelId);

  if (rosterError || !roster || roster.length === 0) {
    console.warn("roster fetch failed:", rosterError?.message);
    return [];
  }

  const artistNames = roster.map((r) => r.artist_name);

  // Fetch artist_score for all roster artists
  const { data, error } = await supabase
    .from("artist_score")
    .select(
      "entity_id, canonical_name, artist_score, tier, trend, momentum_score, health_score, discovery_score, catalog_score, total_markets, platforms_growing, platforms_declining",
    )
    .in("canonical_name", artistNames)
    .order("artist_score", { ascending: false });

  if (error) {
    console.warn("artist_score roster query failed:", error.message);
    return [];
  }

  // Deduplicate — keep highest score per artist name
  const seen = new Set<string>();
  const deduped: RosterScoreEntry[] = [];
  for (const row of (data ?? []) as RosterScoreEntry[]) {
    const key = row.canonical_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

// ─── US reference CPM (for ROI comparison) ─────────────────────────

const US_CPM_TIKTOK = 12.5; // benchmark US TikTok CPM

export function computeRoiVsUs(localCpm: number | null): number | null {
  if (!localCpm || localCpm <= 0) return null;
  return Math.round((US_CPM_TIKTOK / localCpm) * 10) / 10;
}

export function computeProjectedReach(budgetUsd: number, cpm: number): number {
  if (cpm <= 0) return 0;
  return Math.round((budgetUsd / cpm) * 1000);
}
