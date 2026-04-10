export interface ArtistTopSignal {
  platform: string;
  country: string;
  country_name: string;
  position: number;
  change: number | "NEW";
}

export interface ArtistOpportunity {
  country: string;
  country_name: string;
  roi_vs_us: number;
  cpm: number;
  projected_reach: number | null;
  suggested_budget: number;
  platform: string;
  cities: string[];
  window_days: number | null;
  spillover_markets?: string[];
}

export type PriorityType =
  | "breakout"
  | "reallocate"
  | "spillover_test"
  | "window_closing"
  | null;

export type MomentumTrend = "accelerating" | "steady" | "declining";

export interface MarketingArtist {
  entity_id: string;
  artist_name: string;
  genre: string;
  avatar_url?: string;
  momentum: number;
  momentum_trend: MomentumTrend;
  markets_active: number;
  new_markets_7d: number;
  platform_count: number;
  top_signal: ArtistTopSignal;
  current_monthly_spend: number;
  suggested_monthly_spend: number;
  top_opportunity: ArtistOpportunity | null;
  priority_type: PriorityType;
}

export const MOCK_MARKETING_ARTISTS: MarketingArtist[] = [
  {
    entity_id: "0306754e-6be6-4d06-bfc0-3c2eeb6e8aea",
    artist_name: "Meg Moroney",
    genre: "Country",
    momentum: 78,
    momentum_trend: "accelerating",
    markets_active: 23,
    new_markets_7d: 5,
    platform_count: 6,
    top_signal: {
      platform: "tiktok",
      country: "NG",
      country_name: "Nigeria",
      position: 5,
      change: 12,
    },
    current_monthly_spend: 0,
    suggested_monthly_spend: 2500,
    top_opportunity: {
      country: "NG",
      country_name: "Nigeria",
      roi_vs_us: 7.1,
      cpm: 1.8,
      projected_reach: 278000,
      suggested_budget: 2500,
      platform: "TikTok Spark Ads",
      cities: ["Lagos", "Abuja", "Port Harcourt"],
      window_days: 10,
      spillover_markets: ["Ghana", "Kenya"],
    },
    priority_type: "breakout",
  },
  {
    entity_id: "6c88b84d-5a41-4ab4-917d-ebd00568cafd",
    artist_name: "Harry Styles",
    genre: "Pop/Rock",
    momentum: 92,
    momentum_trend: "steady",
    markets_active: 41,
    new_markets_7d: 0,
    platform_count: 7,
    top_signal: {
      platform: "spotify",
      country: "US",
      country_name: "United States",
      position: 145,
      change: 8,
    },
    current_monthly_spend: 95000,
    suggested_monthly_spend: 70000,
    top_opportunity: {
      country: "US",
      country_name: "United States",
      roi_vs_us: 0.9,
      cpm: 12.5,
      projected_reach: null,
      suggested_budget: -25000,
      platform: "Multiple",
      cities: [],
      window_days: null,
    },
    priority_type: "reallocate",
  },
  {
    entity_id: "8788f55d-8205-4512-b903-e0fa586d152c",
    artist_name: "Addison Rae",
    genre: "Pop",
    momentum: 65,
    momentum_trend: "accelerating",
    markets_active: 18,
    new_markets_7d: 2,
    platform_count: 5,
    top_signal: {
      platform: "shazam",
      country: "BR",
      country_name: "Brazil",
      position: 34,
      change: "NEW",
    },
    current_monthly_spend: 800,
    suggested_monthly_spend: 3200,
    top_opportunity: {
      country: "BR",
      country_name: "Brazil",
      roi_vs_us: 2.8,
      cpm: 2.9,
      projected_reach: 172000,
      suggested_budget: 2400,
      platform: "TikTok",
      cities: ["Sao Paulo", "Rio de Janeiro"],
      window_days: 14,
    },
    priority_type: "spillover_test",
  },
  {
    entity_id: "beyonce-id",
    artist_name: "Beyonce",
    genre: "R&B/Pop",
    momentum: 92,
    momentum_trend: "steady",
    markets_active: 41,
    new_markets_7d: 0,
    platform_count: 7,
    top_signal: {
      platform: "spotify",
      country: "US",
      country_name: "United States",
      position: 3,
      change: 0,
    },
    current_monthly_spend: 120000,
    suggested_monthly_spend: 120000,
    top_opportunity: null,
    priority_type: null,
  },
  {
    entity_id: "tyler-hubbard-id",
    artist_name: "Tyler Hubbard",
    genre: "Country",
    momentum: 61,
    momentum_trend: "accelerating",
    markets_active: 12,
    new_markets_7d: 1,
    platform_count: 4,
    top_signal: {
      platform: "tiktok",
      country: "BR",
      country_name: "Brazil",
      position: 45,
      change: "NEW",
    },
    current_monthly_spend: 2000,
    suggested_monthly_spend: 5500,
    top_opportunity: {
      country: "BR",
      country_name: "Brazil",
      roi_vs_us: 2.1,
      cpm: 2.9,
      projected_reach: 103000,
      suggested_budget: 3500,
      platform: "TikTok + Meta",
      cities: ["Sao Paulo"],
      window_days: 16,
    },
    priority_type: "spillover_test",
  },
  {
    entity_id: "lil-nas-x-id",
    artist_name: "Lil Nas X",
    genre: "Hip-Hop/Pop",
    momentum: 71,
    momentum_trend: "accelerating",
    markets_active: 29,
    new_markets_7d: 3,
    platform_count: 6,
    top_signal: {
      platform: "tiktok",
      country: "PH",
      country_name: "Philippines",
      position: 8,
      change: "NEW",
    },
    current_monthly_spend: 0,
    suggested_monthly_spend: 3000,
    top_opportunity: {
      country: "PH",
      country_name: "Philippines",
      roi_vs_us: 5.4,
      cpm: 1.2,
      projected_reach: 340000,
      suggested_budget: 3000,
      platform: "TikTok Spark Ads",
      cities: ["Manila", "Cebu"],
      window_days: 8,
    },
    priority_type: "breakout",
  },
  {
    entity_id: "doechii-id",
    artist_name: "Doechii",
    genre: "Hip-Hop",
    momentum: 82,
    momentum_trend: "accelerating",
    markets_active: 16,
    new_markets_7d: 4,
    platform_count: 5,
    top_signal: {
      platform: "tiktok",
      country: "ZA",
      country_name: "South Africa",
      position: 3,
      change: 18,
    },
    current_monthly_spend: 1500,
    suggested_monthly_spend: 6000,
    top_opportunity: {
      country: "ZA",
      country_name: "South Africa",
      roi_vs_us: 4.2,
      cpm: 1.5,
      projected_reach: 245000,
      suggested_budget: 4500,
      platform: "TikTok + YouTube",
      cities: ["Johannesburg", "Cape Town", "Durban"],
      window_days: 12,
    },
    priority_type: "breakout",
  },
  {
    entity_id: "doja-cat-id",
    artist_name: "Doja Cat",
    genre: "Pop/Hip-Hop",
    momentum: 88,
    momentum_trend: "steady",
    markets_active: 38,
    new_markets_7d: 0,
    platform_count: 7,
    top_signal: {
      platform: "spotify",
      country: "US",
      country_name: "United States",
      position: 12,
      change: -3,
    },
    current_monthly_spend: 85000,
    suggested_monthly_spend: 65000,
    top_opportunity: {
      country: "US",
      country_name: "United States",
      roi_vs_us: 1.0,
      cpm: 11.8,
      projected_reach: null,
      suggested_budget: -20000,
      platform: "Multiple",
      cities: [],
      window_days: null,
    },
    priority_type: "reallocate",
  },
  {
    entity_id: "luke-combs-id",
    artist_name: "Luke Combs",
    genre: "Country",
    momentum: 74,
    momentum_trend: "steady",
    markets_active: 14,
    new_markets_7d: 0,
    platform_count: 5,
    top_signal: {
      platform: "spotify",
      country: "AU",
      country_name: "Australia",
      position: 28,
      change: 5,
    },
    current_monthly_spend: 42000,
    suggested_monthly_spend: 42000,
    top_opportunity: null,
    priority_type: null,
  },
  {
    entity_id: "rosalia-id",
    artist_name: "Rosalia",
    genre: "Latin Pop",
    momentum: 69,
    momentum_trend: "accelerating",
    markets_active: 22,
    new_markets_7d: 2,
    platform_count: 6,
    top_signal: {
      platform: "shazam",
      country: "TR",
      country_name: "Turkey",
      position: 19,
      change: "NEW",
    },
    current_monthly_spend: 4500,
    suggested_monthly_spend: 8000,
    top_opportunity: {
      country: "TR",
      country_name: "Turkey",
      roi_vs_us: 3.1,
      cpm: 2.2,
      projected_reach: 195000,
      suggested_budget: 3500,
      platform: "TikTok + Instagram",
      cities: ["Istanbul", "Ankara"],
      window_days: 18,
    },
    priority_type: "spillover_test",
  },
  {
    entity_id: "pharrell-id",
    artist_name: "Pharrell Williams",
    genre: "Pop/R&B",
    momentum: 55,
    momentum_trend: "steady",
    markets_active: 31,
    new_markets_7d: 0,
    platform_count: 6,
    top_signal: {
      platform: "spotify",
      country: "US",
      country_name: "United States",
      position: 210,
      change: -12,
    },
    current_monthly_spend: 28000,
    suggested_monthly_spend: 28000,
    top_opportunity: null,
    priority_type: null,
  },
  {
    entity_id: "ice-spice-id",
    artist_name: "Ice Spice",
    genre: "Hip-Hop",
    momentum: 35,
    momentum_trend: "declining",
    markets_active: 9,
    new_markets_7d: 0,
    platform_count: 4,
    top_signal: {
      platform: "tiktok",
      country: "US",
      country_name: "United States",
      position: 88,
      change: -24,
    },
    current_monthly_spend: 35000,
    suggested_monthly_spend: 15000,
    top_opportunity: {
      country: "US",
      country_name: "United States",
      roi_vs_us: 0.6,
      cpm: 13.2,
      projected_reach: null,
      suggested_budget: -20000,
      platform: "Multiple",
      cities: [],
      window_days: null,
    },
    priority_type: "reallocate",
  },
  {
    entity_id: "morgan-wallen-id",
    artist_name: "Morgan Wallen",
    genre: "Country",
    momentum: 38,
    momentum_trend: "declining",
    markets_active: 8,
    new_markets_7d: 0,
    platform_count: 4,
    top_signal: {
      platform: "spotify",
      country: "US",
      country_name: "United States",
      position: 45,
      change: -8,
    },
    current_monthly_spend: 52000,
    suggested_monthly_spend: 30000,
    top_opportunity: null,
    priority_type: null,
  },
  {
    entity_id: "jorja-smith-id",
    artist_name: "Jorja Smith",
    genre: "R&B/Soul",
    momentum: 44,
    momentum_trend: "steady",
    markets_active: 11,
    new_markets_7d: 0,
    platform_count: 4,
    top_signal: {
      platform: "spotify",
      country: "GB",
      country_name: "United Kingdom",
      position: 67,
      change: 2,
    },
    current_monthly_spend: 8000,
    suggested_monthly_spend: 8000,
    top_opportunity: null,
    priority_type: null,
  },
  {
    entity_id: "tyla-id",
    artist_name: "Tyla",
    genre: "Afrobeats/Pop",
    momentum: 76,
    momentum_trend: "accelerating",
    markets_active: 25,
    new_markets_7d: 2,
    platform_count: 6,
    top_signal: {
      platform: "tiktok",
      country: "IN",
      country_name: "India",
      position: 11,
      change: "NEW",
    },
    current_monthly_spend: 3200,
    suggested_monthly_spend: 7500,
    top_opportunity: {
      country: "IN",
      country_name: "India",
      roi_vs_us: 4.8,
      cpm: 0.9,
      projected_reach: 520000,
      suggested_budget: 4300,
      platform: "TikTok + YouTube",
      cities: ["Mumbai", "Delhi", "Bangalore"],
      window_days: 9,
    },
    priority_type: "window_closing",
  },
  {
    entity_id: "central-cee-id",
    artist_name: "Central Cee",
    genre: "UK Rap",
    momentum: 81,
    momentum_trend: "steady",
    markets_active: 20,
    new_markets_7d: 0,
    platform_count: 5,
    top_signal: {
      platform: "spotify",
      country: "FR",
      country_name: "France",
      position: 15,
      change: 4,
    },
    current_monthly_spend: 22000,
    suggested_monthly_spend: 22000,
    top_opportunity: null,
    priority_type: null,
  },
];

/* ─── Computed helpers ───────────────────────────────────────── */

export function getBreakoutCount(artists: MarketingArtist[]): number {
  return artists.filter(
    (a) =>
      a.momentum_trend === "accelerating" &&
      a.new_markets_7d > 2 &&
      a.current_monthly_spend === 0,
  ).length;
}

export function getHighRoiOppCount(artists: MarketingArtist[]): number {
  return artists.filter(
    (a) =>
      a.top_opportunity &&
      a.top_opportunity.roi_vs_us > 2 &&
      a.current_monthly_spend === 0,
  ).length;
}

export function getUnderAllocatedCount(artists: MarketingArtist[]): number {
  return artists.filter(
    (a) =>
      a.top_opportunity &&
      a.top_opportunity.roi_vs_us > 1.5 &&
      a.current_monthly_spend === 0,
  ).length;
}

export function getWastedSpend(artists: MarketingArtist[]): {
  total: number;
  pctInUs: number;
  zeroSpendHighRoi: number;
} {
  const totalSpend = artists.reduce(
    (sum, a) => sum + a.current_monthly_spend,
    0,
  );
  // Simplified: artists with declining or steady + high spend + low ROI
  const wastedArtists = artists.filter(
    (a) =>
      a.top_opportunity &&
      a.top_opportunity.roi_vs_us < 1 &&
      a.current_monthly_spend > 10000,
  );
  const wasted = wastedArtists.reduce(
    (sum, a) =>
      sum +
      (a.current_monthly_spend - (a.top_opportunity?.suggested_budget ?? 0)),
    0,
  );
  const usSpend = artists
    .filter((a) => a.top_signal.country === "US")
    .reduce((sum, a) => sum + a.current_monthly_spend, 0);
  const pctInUs = totalSpend > 0 ? Math.round((usSpend / totalSpend) * 100) : 0;
  const zeroSpendHighRoi = artists.filter(
    (a) =>
      a.top_opportunity &&
      a.top_opportunity.roi_vs_us > 2 &&
      a.current_monthly_spend === 0,
  ).length;

  return { total: wasted, pctInUs, zeroSpendHighRoi };
}

export type MarketingFilter =
  | "all"
  | "breakout"
  | "high_roi"
  | "under_spent"
  | "reallocation"
  | "stalled";

export function filterArtists(
  artists: MarketingArtist[],
  filter: MarketingFilter,
): MarketingArtist[] {
  switch (filter) {
    case "breakout":
      return artists.filter(
        (a) => a.momentum_trend === "accelerating" && a.new_markets_7d > 0,
      );
    case "high_roi":
      return artists.filter(
        (a) => a.top_opportunity && a.top_opportunity.roi_vs_us > 2,
      );
    case "under_spent":
      return artists.filter(
        (a) => a.suggested_monthly_spend > a.current_monthly_spend * 1.5,
      );
    case "reallocation":
      return artists.filter(
        (a) =>
          a.current_monthly_spend > 10000 &&
          a.top_opportunity &&
          a.top_opportunity.roi_vs_us < 1.2,
      );
    case "stalled":
      return artists.filter(
        (a) =>
          a.momentum < 40 ||
          (a.new_markets_7d === 0 &&
            a.momentum_trend === "steady" &&
            a.momentum < 60),
      );
    default:
      return artists;
  }
}

export function sortByOpportunityScore(
  artists: MarketingArtist[],
): MarketingArtist[] {
  return [...artists].sort((a, b) => {
    const scoreA = computeOpportunityScore(a);
    const scoreB = computeOpportunityScore(b);
    return scoreB - scoreA;
  });
}

function computeOpportunityScore(a: MarketingArtist): number {
  const momentumFactor = a.momentum / 100;
  const spendGap =
    a.suggested_monthly_spend > 0
      ? Math.abs(a.suggested_monthly_spend - a.current_monthly_spend) /
        Math.max(a.suggested_monthly_spend, a.current_monthly_spend)
      : 0;
  const roiFactor = a.top_opportunity
    ? Math.min(a.top_opportunity.roi_vs_us / 10, 1)
    : 0;
  const marketsFactor = Math.min(a.new_markets_7d / 5, 1);
  return (
    momentumFactor * 0.3 +
    spendGap * 0.3 +
    roiFactor * 0.25 +
    marketsFactor * 0.15
  );
}

export function getPriorityArtists(
  artists: MarketingArtist[],
): MarketingArtist[] {
  return artists
    .filter((a) => a.priority_type !== null)
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        window_closing: 0,
        breakout: 1,
        reallocate: 2,
        spillover_test: 3,
      };
      const pa = priorityOrder[a.priority_type!] ?? 99;
      const pb = priorityOrder[b.priority_type!] ?? 99;
      if (pa !== pb) return pa - pb;
      return computeOpportunityScore(b) - computeOpportunityScore(a);
    })
    .slice(0, 5);
}

export function generateRosterInsight(artists: MarketingArtist[]): string {
  const breakoutArtists = artists.filter(
    (a) => a.momentum_trend === "accelerating" && a.new_markets_7d > 0,
  );
  const breakoutCount = breakoutArtists.length;
  const fastestGrowing = breakoutArtists.sort(
    (a, b) => b.new_markets_7d - a.new_markets_7d,
  )[0];

  if (!fastestGrowing) {
    return `None of your ${artists.length} artists are in active breakout windows this week. Consider reviewing stalled campaigns for reallocation opportunities.`;
  }

  const spendRank =
    [...artists]
      .sort((a, b) => b.current_monthly_spend - a.current_monthly_spend)
      .findIndex((a) => a.entity_id === fastestGrowing.entity_id) + 1;

  const isUnderspent = fastestGrowing.current_monthly_spend === 0;

  return `${breakoutCount} of your ${artists.length} artists are in active breakout windows this week. ${fastestGrowing.artist_name} is your fastest-growing artist${isUnderspent ? " but has $0 international ad spend" : ` but ranks #${spendRank} in spend allocation`}. See opportunities`;
}
