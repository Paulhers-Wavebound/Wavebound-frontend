import { useQuery } from "@tanstack/react-query";
import { supabase, SUPABASE_ANON_KEY } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { getCountryCoords } from "@/components/pulse/mockPulseData";
import {
  MOCK_GLOBE_DATA,
  getMockCountryDetail,
} from "@/components/pulse/mockPulseData";
import {
  MOCK_ARBITRAGE_DATA,
  getMockCountryArbitrage,
} from "@/components/pulse/mockArbitrageData";
import type {
  RawGlobeData,
  RawGlobeCountry,
  RawFlowArc,
  RawGlobeAlert,
  RawCountryDetailData,
  RawCountryDetailSong,
  GlobeData,
  GlobeCountry,
  FlowArc,
  GlobeAlert,
  GlobeCounters,
  CountryDetailData,
  CountryDetailSong,
  ArbitrageData,
  CountryArbitrage,
} from "@/types/pulse";

const SUPABASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co";
const STALE_5M = 5 * 60 * 1000;

/* ─── Country name resolver ───────────────────────────────────── */

function resolveCountryName(code: string): string {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

/* ─── Transform: Raw backend → View models ────────────────────── */

function transformGlobeData(raw: RawGlobeData): GlobeData {
  // Normalize activity_score to 0–1
  const maxActivity = Math.max(
    1,
    ...raw.countries.map((c) => c.activity_score),
  );

  const countries: GlobeCountry[] = raw.countries.map((rc: RawGlobeCountry) => {
    const coords = getCountryCoords(rc.country_code);
    const platformCount = Object.keys(rc.platforms).length;
    return {
      country_code: rc.country_code,
      country_name: resolveCountryName(rc.country_code),
      activity_score: rc.activity_score / maxActivity,
      raw_activity: rc.activity_score,
      song_count: rc.activity_score, // activity_score IS the song count
      platform_count: platformCount,
      dominant_genre: rc.dominant_genre || "unknown",
      new_entries: rc.new_entries,
      label_songs: rc.label_songs,
      lat: coords.lat,
      lng: coords.lng,
    };
  });

  const flows: FlowArc[] = raw.flows.map((rf: RawFlowArc, i: number) => {
    const dates = rf.path.map((p) => new Date(p.date).getTime());
    const daySpan =
      dates.length > 1
        ? (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
        : 1;
    const velocity = Math.min(1, rf.path.length / Math.max(daySpan, 1));

    return {
      id: rf.entity_id || `flow-${i}`,
      song_name: rf.song_name,
      artist_name: rf.artist_name,
      genre: rf.genre,
      path: rf.path.map((p) => ({
        country_code: p.country_code,
        date: p.date,
      })),
      velocity,
    };
  });

  const counters: GlobeCounters = {
    total_songs: raw.counters.songs_tracked,
    total_countries: raw.counters.countries_active,
    total_platforms: raw.counters.platforms,
    total_observations: raw.counters.observations_today,
    total_artists: raw.counters.artists_tracked,
  };

  const ALERT_TYPE_LABELS: Record<string, string> = {
    cross_platform_breakout: "surge",
    geographic: "domination",
    song_momentum: "breakout",
    metric_spike: "surge",
  };

  const alerts: GlobeAlert[] = raw.alerts.map(
    (ra: RawGlobeAlert, i: number) => ({
      id: `alert-${i}`,
      type: ALERT_TYPE_LABELS[ra.type] ?? ra.type,
      message: ra.artist
        ? `${ra.artist}${ra.title ? ` — ${ra.title}` : ""}: ${ra.detail}`
        : ra.detail,
      artist: ra.artist,
      song: ra.title,
    }),
  );

  return { countries, flows, counters, alerts };
}

function transformCountryDetail(raw: RawCountryDetailData): CountryDetailData {
  // Step 1: Build per-song entries, dedup platforms by platform+metric
  const rawSongEntries = raw.songs.map((rs: RawCountryDetailSong) => {
    // Deduplicate platforms by platform+metric, keep first (most recent from backend)
    const platMap = new Map<string, CountryDetailSong["platforms"][number]>();
    for (const p of rs.platforms) {
      const key = `${p.platform.toLowerCase()}-${p.metric}`;
      if (!platMap.has(key)) {
        platMap.set(key, {
          platform: p.platform,
          metric: p.metric,
          rank: typeof p.value === "number" ? p.value : null,
          rank_change: p.change,
          is_new: p.change === "NEW",
        });
      }
    }
    return {
      entity_id: rs.entity_id,
      song_name: rs.song_name,
      artist_name: rs.artist_name,
      is_label_roster: rs.is_label_song,
      velocity_class: rs.velocity_class ?? "steady",
      platforms: [...platMap.values()],
      also_in: rs.other_countries,
    };
  });

  // Step 2: Deduplicate songs by entity_id, merge platforms + also_in
  const songMap = new Map<string, CountryDetailSong>();
  for (const song of rawSongEntries) {
    const existing = songMap.get(song.entity_id);
    if (existing) {
      // Merge platforms (dedup again by platform+metric)
      const platKeys = new Set(
        existing.platforms.map(
          (p) => `${p.platform.toLowerCase()}-${p.metric}`,
        ),
      );
      for (const p of song.platforms) {
        const key = `${p.platform.toLowerCase()}-${p.metric}`;
        if (!platKeys.has(key)) {
          existing.platforms.push(p);
          platKeys.add(key);
        }
      }
      // Merge also_in
      const alsoSet = new Set(existing.also_in);
      for (const c of song.also_in) alsoSet.add(c);
      existing.also_in = [...alsoSet];
      // Prefer label roster flag
      if (song.is_label_roster) existing.is_label_roster = true;
    } else {
      songMap.set(song.entity_id, { ...song });
    }
  }
  const songs = [...songMap.values()];

  // Step 3: Genre breakdown (case-insensitive dedup)
  const genreMap = new Map<string, number>();
  for (const [genre, count] of Object.entries(raw.genre_breakdown)) {
    const key = genre.toLowerCase();
    genreMap.set(key, (genreMap.get(key) ?? 0) + count);
  }
  const genreBreakdown = [...genreMap.entries()]
    .map(([genre, count]) => ({ genre: capitalize(genre), count }))
    .sort((a, b) => b.count - a.count);

  // Step 4: Platform breakdown (case-insensitive dedup)
  const platformMap = new Map<string, number>();
  for (const [platform, count] of Object.entries(raw.platform_breakdown)) {
    const key = platform.toLowerCase();
    platformMap.set(key, (platformMap.get(key) ?? 0) + count);
  }
  const platformBreakdown = [...platformMap.entries()]
    .map(([platform, count]) => ({ platform: capitalize(platform), count }))
    .sort((a, b) => b.count - a.count);

  // Step 5: Derive counts from deduped data for consistency
  const songCount = songs.length;
  const uniquePlatforms = new Set<string>();
  for (const s of songs) {
    for (const p of s.platforms) uniquePlatforms.add(p.platform.toLowerCase());
  }
  const platformCount = uniquePlatforms.size;

  return {
    country_code: raw.country_code,
    country_name: raw.country_name ?? resolveCountryName(raw.country_code),
    song_count: songCount,
    platform_count: platformCount,
    trending_up: raw.trending_up,
    new_entries: raw.new_entries,
    songs,
    genre_breakdown: genreBreakdown,
    platform_breakdown: platformBreakdown,
  };
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Fetch helpers ───────────────────────────────────────────── */

async function fetchGlobeData(labelId: string): Promise<GlobeData> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");

  const params = new URLSearchParams({ label_id: labelId });

  const url = `${SUPABASE_URL}/functions/v1/globe-data?${params}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Globe data fetch failed (${res.status}): ${body}`);
  }

  clearTimeout(timeout);
  const raw: RawGlobeData = await res.json();
  return transformGlobeData(raw);
}

async function fetchCountryDetail(
  countryCode: string,
  labelId: string,
): Promise<CountryDetailData> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");

  const params = new URLSearchParams({
    country: countryCode,
    label_id: labelId,
  });

  const res = await fetch(`${SUPABASE_URL}/functions/v1/globe-data?${params}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Country detail failed (${res.status}): ${body}`);
  }

  const raw: RawCountryDetailData = await res.json();
  return transformCountryDetail(raw);
}

/* ─── React Query hooks ───────────────────────────────────────── */

export function usePulseGlobeData() {
  const { labelId } = useUserProfile();

  return useQuery<GlobeData>({
    queryKey: ["pulse-globe", labelId],
    queryFn: async () => {
      try {
        return await fetchGlobeData(labelId!);
      } catch (err) {
        console.warn("Globe data fetch failed, falling back to mock:", err);
        return MOCK_GLOBE_DATA;
      }
    },
    enabled: !!labelId,
    staleTime: STALE_5M,
    retry: 1,
    // Show mock globe instantly while real data loads in background
    placeholderData: MOCK_GLOBE_DATA,
  });
}

export function usePulseCountryDetail(countryCode: string | null) {
  const { labelId } = useUserProfile();

  return useQuery<CountryDetailData>({
    queryKey: ["pulse-country", countryCode, labelId],
    queryFn: async () => {
      if (!countryCode) throw new Error("No country code");
      try {
        return await fetchCountryDetail(countryCode, labelId!);
      } catch (err) {
        console.warn("Country detail fetch failed, falling back to mock:", err);
        return getMockCountryDetail(countryCode);
      }
    },
    enabled: !!countryCode && !!labelId,
    staleTime: STALE_5M,
    retry: 1,
  });
}

/* ─── Arbitrage / Radar hooks ────────────────────────────────── */

/** Derive opportunity_buckets from leaderboard entries when missing or zeroed */
function ensureOpportunityBuckets(data: ArbitrageData): ArbitrageData {
  const buckets = data.opportunity_buckets;
  const hasValidBuckets =
    buckets &&
    typeof buckets.high === "number" &&
    typeof buckets.medium === "number" &&
    typeof buckets.low === "number" &&
    buckets.high + buckets.medium + buckets.low > 0;

  if (hasValidBuckets) return data;

  // Compute from leaderboard entries
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const m of data.leaderboard) {
    if (m.arbitrage_label === "HIGH") high++;
    else if (m.arbitrage_label === "MEDIUM") medium++;
    else low++;
  }

  return {
    ...data,
    opportunity_buckets: { high, medium, low },
  };
}

export function usePulseArbitrageData(enabled: boolean) {
  const { labelId } = useUserProfile();

  return useQuery<ArbitrageData>({
    queryKey: ["pulse-arbitrage", labelId],
    queryFn: async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) throw new Error("Not authenticated");

        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/globe-data?mode=arbitrage&label_id=${labelId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: SUPABASE_ANON_KEY,
            },
          },
        );

        if (!res.ok) throw new Error(`Arbitrage fetch failed (${res.status})`);
        const json = await res.json();
        // Validate response has arbitrage shape — the edge function may return
        // globe data (wrong shape) if it doesn't handle mode=arbitrage yet
        if (
          !json.leaderboard ||
          !Array.isArray(json.leaderboard) ||
          json.leaderboard.length === 0
        ) {
          console.warn("Arbitrage response empty or missing, using mock");
          return MOCK_ARBITRAGE_DATA;
        }
        return ensureOpportunityBuckets(json);
      } catch (err) {
        console.warn("Arbitrage data fetch failed, falling back to mock:", err);
        return MOCK_ARBITRAGE_DATA;
      }
    },
    enabled: enabled && !!labelId,
    staleTime: STALE_5M,
    retry: 1,
    placeholderData: MOCK_ARBITRAGE_DATA,
  });
}

export function getCountryArbitrage(
  countryCode: string,
): CountryArbitrage | undefined {
  return getMockCountryArbitrage(countryCode);
}
