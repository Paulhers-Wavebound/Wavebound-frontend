import { supabase } from "@/integrations/supabase/client";
import type {
  ArtistCard,
  AlertsResponse,
  MarketMapResponse,
  TikTokProfile,
  CatalogTikTokEntry,
} from "@/types/artistIntelligence";

const BASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1";

async function getAuthHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession();
  const token = session?.access_token;
  if (!token || error) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Resolve entity_id from artist_name via wb_entities.
 * The artist_intelligence.id !== wb_entities.id, so we need this lookup.
 */
export async function resolveEntityId(
  artistName: string,
): Promise<string | null> {
  // Fetch all matching entities — some artists have duplicates.
  // We pick the one most likely to have intelligence data.
  const { data } = await supabase
    .from("wb_entities")
    .select("id")
    .ilike("canonical_name", artistName)
    .eq("entity_type", "artist")
    .limit(10);

  if (!data || data.length === 0) return null;
  if (data.length === 1) return data[0].id;

  // Multiple matches — check which has artist_score data
  for (const entity of data) {
    const { data: score } = await supabase
      .from("artist_score")
      .select("entity_id")
      .eq("entity_id", entity.id)
      .limit(1)
      .maybeSingle();
    if (score) return entity.id;
  }

  // Fallback: return first match
  return data[0].id;
}

/** GET /functions/v1/get-artist-card?entity_id=<uuid> */
export async function getArtistCard(
  entityId: string,
): Promise<ArtistCard | null> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/get-artist-card?entity_id=${entityId}`, {
    headers,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to fetch artist card");
  }
  return res.json();
}

/** GET /functions/v1/get-artist-alerts?entity_id=<uuid> */
export async function getArtistAlerts(
  entityId: string,
  options?: { severity?: string; limit?: number },
): Promise<AlertsResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ entity_id: entityId });
  if (options?.severity) params.set("severity", options.severity);
  if (options?.limit) params.set("limit", String(options.limit));
  const res = await fetch(`${BASE_URL}/get-artist-alerts?${params}`, {
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to fetch alerts");
  }
  return res.json();
}

/** GET /functions/v1/get-market-map?entity_id=<uuid> */
export async function getMarketMap(
  entityId: string,
  options?: { tier?: string; action?: string; limit?: number },
): Promise<MarketMapResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ entity_id: entityId });
  if (options?.tier) params.set("tier", options.tier);
  if (options?.action) params.set("action", options.action);
  if (options?.limit) params.set("limit", String(options.limit));
  const res = await fetch(`${BASE_URL}/get-market-map?${params}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to fetch market map");
  }
  return res.json();
}

/** Direct DB: artist_tiktok_profile */
export async function getTikTokProfile(
  entityId: string,
): Promise<TikTokProfile | null> {
  const { data } = await supabase
    .from("artist_tiktok_profile")
    .select("*")
    .eq("entity_id", entityId)
    .maybeSingle();
  return data as TikTokProfile | null;
}

/** Direct DB: catalog_tiktok_performance */
export async function getCatalogTikTok(
  entityId: string,
): Promise<CatalogTikTokEntry[]> {
  const { data } = await supabase
    .from("catalog_tiktok_performance")
    .select("*")
    .eq("artist_entity_id", entityId)
    .order("total_tiktok_plays", { ascending: false });
  return (data as CatalogTikTokEntry[]) ?? [];
}
