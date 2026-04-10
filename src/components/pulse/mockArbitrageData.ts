import type {
  ArbitrageData,
  ArbitrageMarket,
  CountryArbitrage,
} from "@/types/pulse";

/* ─── Mock arbitrage leaderboard (20 markets) ─────────────────── */

const leaderboard: ArbitrageMarket[] = [
  {
    country_code: "NG",
    country_name: "Nigeria",
    arbitrage_score: 82,
    arbitrage_label: "HIGH",
    roi_vs_us: 3.2,
    avg_cpm_blended: 1.8,
    total_songs: 372,
    active_songs: 168,
    dominant_genre: "Afrobeats",
    dominant_genre_pct: 45,
  },
  {
    country_code: "KE",
    country_name: "Kenya",
    arbitrage_score: 78,
    arbitrage_label: "HIGH",
    roi_vs_us: 3.4,
    avg_cpm_blended: 1.5,
    total_songs: 180,
    active_songs: 89,
    dominant_genre: "Afrobeats",
    dominant_genre_pct: 52,
  },
  {
    country_code: "BR",
    country_name: "Brazil",
    arbitrage_score: 76,
    arbitrage_label: "HIGH",
    roi_vs_us: 2.8,
    avg_cpm_blended: 2.9,
    total_songs: 1580,
    active_songs: 445,
    dominant_genre: "Latin",
    dominant_genre_pct: 38,
  },
  {
    country_code: "PH",
    country_name: "Philippines",
    arbitrage_score: 74,
    arbitrage_label: "HIGH",
    roi_vs_us: 3.6,
    avg_cpm_blended: 1.0,
    total_songs: 380,
    active_songs: 67,
    dominant_genre: "Pop",
    dominant_genre_pct: 30,
  },
  {
    country_code: "GH",
    country_name: "Ghana",
    arbitrage_score: 72,
    arbitrage_label: "HIGH",
    roi_vs_us: 3.1,
    avg_cpm_blended: 1.6,
    total_songs: 210,
    active_songs: 95,
    dominant_genre: "Afrobeats",
    dominant_genre_pct: 58,
  },
  {
    country_code: "ID",
    country_name: "Indonesia",
    arbitrage_score: 70,
    arbitrage_label: "HIGH",
    roi_vs_us: 3.0,
    avg_cpm_blended: 1.2,
    total_songs: 340,
    active_songs: 112,
    dominant_genre: "Pop",
    dominant_genre_pct: 35,
  },
  {
    country_code: "MX",
    country_name: "Mexico",
    arbitrage_score: 62,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.1,
    avg_cpm_blended: 3.5,
    total_songs: 1120,
    active_songs: 312,
    dominant_genre: "Latin",
    dominant_genre_pct: 55,
  },
  {
    country_code: "CO",
    country_name: "Colombia",
    arbitrage_score: 60,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.3,
    avg_cpm_blended: 2.8,
    total_songs: 880,
    active_songs: 245,
    dominant_genre: "Latin",
    dominant_genre_pct: 48,
  },
  {
    country_code: "IN",
    country_name: "India",
    arbitrage_score: 58,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.2,
    avg_cpm_blended: 0.9,
    total_songs: 720,
    active_songs: 198,
    dominant_genre: "Pop",
    dominant_genre_pct: 32,
  },
  {
    country_code: "ZA",
    country_name: "South Africa",
    arbitrage_score: 56,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.5,
    avg_cpm_blended: 2.2,
    total_songs: 310,
    active_songs: 88,
    dominant_genre: "Afrobeats",
    dominant_genre_pct: 40,
  },
  {
    country_code: "TH",
    country_name: "Thailand",
    arbitrage_score: 54,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.4,
    avg_cpm_blended: 1.3,
    total_songs: 260,
    active_songs: 72,
    dominant_genre: "K-Pop",
    dominant_genre_pct: 42,
  },
  {
    country_code: "TR",
    country_name: "Turkey",
    arbitrage_score: 52,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.0,
    avg_cpm_blended: 2.4,
    total_songs: 360,
    active_songs: 95,
    dominant_genre: "Pop",
    dominant_genre_pct: 38,
  },
  {
    country_code: "EG",
    country_name: "Egypt",
    arbitrage_score: 50,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.6,
    avg_cpm_blended: 1.1,
    total_songs: 150,
    active_songs: 42,
    dominant_genre: "Pop",
    dominant_genre_pct: 35,
  },
  {
    country_code: "AR",
    country_name: "Argentina",
    arbitrage_score: 48,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 1.9,
    avg_cpm_blended: 3.2,
    total_songs: 620,
    active_songs: 165,
    dominant_genre: "Latin",
    dominant_genre_pct: 50,
  },
  {
    country_code: "VN",
    country_name: "Vietnam",
    arbitrage_score: 46,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 2.8,
    avg_cpm_blended: 0.8,
    total_songs: 140,
    active_songs: 38,
    dominant_genre: "Pop",
    dominant_genre_pct: 40,
  },
  {
    country_code: "PE",
    country_name: "Peru",
    arbitrage_score: 44,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 1.8,
    avg_cpm_blended: 2.6,
    total_songs: 280,
    active_songs: 72,
    dominant_genre: "Latin",
    dominant_genre_pct: 48,
  },
  {
    country_code: "CL",
    country_name: "Chile",
    arbitrage_score: 42,
    arbitrage_label: "MEDIUM",
    roi_vs_us: 1.7,
    avg_cpm_blended: 3.0,
    total_songs: 350,
    active_songs: 85,
    dominant_genre: "Latin",
    dominant_genre_pct: 44,
  },
  {
    country_code: "MA",
    country_name: "Morocco",
    arbitrage_score: 38,
    arbitrage_label: "LOW",
    roi_vs_us: 1.5,
    avg_cpm_blended: 1.8,
    total_songs: 120,
    active_songs: 28,
    dominant_genre: "Hip Hop",
    dominant_genre_pct: 35,
  },
  {
    country_code: "SA",
    country_name: "Saudi Arabia",
    arbitrage_score: 35,
    arbitrage_label: "LOW",
    roi_vs_us: 1.2,
    avg_cpm_blended: 5.5,
    total_songs: 190,
    active_songs: 45,
    dominant_genre: "Pop",
    dominant_genre_pct: 38,
  },
  {
    country_code: "RO",
    country_name: "Romania",
    arbitrage_score: 32,
    arbitrage_label: "LOW",
    roi_vs_us: 1.3,
    avg_cpm_blended: 3.8,
    total_songs: 110,
    active_songs: 22,
    dominant_genre: "Electronic",
    dominant_genre_pct: 30,
  },
];

/* ─── Mock country arbitrage details ─────────────────────────── */

const COUNTRY_ARBITRAGE: Record<string, CountryArbitrage> = {
  NG: {
    score: 82,
    label: "HIGH",
    roi_vs_us: 3.2,
    recommendation:
      "Prime arbitrage — allocate budget immediately. Afrobeats momentum + low CPM = exceptional ROI window.",
    ad_costs: { tiktok_cpm: 1.8, meta_cpm: 2.0, youtube_cpm: 1.5 },
    fan_value: {
      merch_enthusiasm: 78,
      live_attendance: 82,
      streaming_payout: 22,
      avg_ticket_price: 30,
    },
    market_growth: {
      streaming_yoy: 45,
      social_penetration: 42,
      tier: "Emerging",
    },
  },
  KE: {
    score: 78,
    label: "HIGH",
    roi_vs_us: 3.4,
    recommendation:
      "Fastest-growing East African market. Early mover advantage — competitors haven't arrived yet.",
    ad_costs: { tiktok_cpm: 1.5, meta_cpm: 1.8, youtube_cpm: 1.2 },
    fan_value: {
      merch_enthusiasm: 65,
      live_attendance: 70,
      streaming_payout: 18,
      avg_ticket_price: 22,
    },
    market_growth: {
      streaming_yoy: 62,
      social_penetration: 38,
      tier: "Emerging",
    },
  },
  BR: {
    score: 76,
    label: "HIGH",
    roi_vs_us: 2.8,
    recommendation:
      "Massive volume market. Latin crossover potential is real — CPM still 77% below US.",
    ad_costs: { tiktok_cpm: 2.9, meta_cpm: 3.2, youtube_cpm: 2.5 },
    fan_value: {
      merch_enthusiasm: 72,
      live_attendance: 88,
      streaming_payout: 35,
      avg_ticket_price: 45,
    },
    market_growth: {
      streaming_yoy: 28,
      social_penetration: 65,
      tier: "Growth",
    },
  },
  PH: {
    score: 74,
    label: "HIGH",
    roi_vs_us: 3.6,
    recommendation:
      "Cheapest CPM in top-20 markets. K-Pop and Pop crossover audiences highly engaged.",
    ad_costs: { tiktok_cpm: 1.0, meta_cpm: 1.2, youtube_cpm: 0.8 },
    fan_value: {
      merch_enthusiasm: 60,
      live_attendance: 55,
      streaming_payout: 15,
      avg_ticket_price: 18,
    },
    market_growth: {
      streaming_yoy: 52,
      social_penetration: 55,
      tier: "Growth",
    },
  },
  GH: {
    score: 72,
    label: "HIGH",
    roi_vs_us: 3.1,
    recommendation:
      "Afrobeats epicenter #2. Strong pipeline from Nigeria crossover — bundle both markets.",
    ad_costs: { tiktok_cpm: 1.6, meta_cpm: 1.9, youtube_cpm: 1.3 },
    fan_value: {
      merch_enthusiasm: 68,
      live_attendance: 72,
      streaming_payout: 20,
      avg_ticket_price: 25,
    },
    market_growth: {
      streaming_yoy: 40,
      social_penetration: 35,
      tier: "Emerging",
    },
  },
  ID: {
    score: 70,
    label: "HIGH",
    roi_vs_us: 3.0,
    recommendation:
      "4th largest population. Untapped Pop/K-Pop audience with lowest CPM floor in Southeast Asia.",
    ad_costs: { tiktok_cpm: 1.2, meta_cpm: 1.5, youtube_cpm: 1.0 },
    fan_value: {
      merch_enthusiasm: 55,
      live_attendance: 60,
      streaming_payout: 12,
      avg_ticket_price: 15,
    },
    market_growth: {
      streaming_yoy: 48,
      social_penetration: 50,
      tier: "Growth",
    },
  },
  MX: {
    score: 62,
    label: "MEDIUM",
    roi_vs_us: 2.1,
    recommendation:
      "Strong but competitive. CPM rising — act within 6 months before window closes.",
    ad_costs: { tiktok_cpm: 3.5, meta_cpm: 4.0, youtube_cpm: 3.0 },
    fan_value: {
      merch_enthusiasm: 75,
      live_attendance: 85,
      streaming_payout: 40,
      avg_ticket_price: 55,
    },
    market_growth: {
      streaming_yoy: 22,
      social_penetration: 60,
      tier: "Growth",
    },
  },
  CO: {
    score: 60,
    label: "MEDIUM",
    roi_vs_us: 2.3,
    recommendation:
      "Latin music gateway. Réggeaton-heavy but diversifying — good entry point for Hip Hop crossover.",
    ad_costs: { tiktok_cpm: 2.8, meta_cpm: 3.2, youtube_cpm: 2.5 },
    fan_value: {
      merch_enthusiasm: 70,
      live_attendance: 78,
      streaming_payout: 32,
      avg_ticket_price: 40,
    },
    market_growth: {
      streaming_yoy: 30,
      social_penetration: 55,
      tier: "Growth",
    },
  },
  IN: {
    score: 58,
    label: "MEDIUM",
    roi_vs_us: 2.2,
    recommendation:
      "Volume play — massive audience but low per-user revenue. Best for brand awareness campaigns.",
    ad_costs: { tiktok_cpm: 0.9, meta_cpm: 1.1, youtube_cpm: 0.7 },
    fan_value: {
      merch_enthusiasm: 45,
      live_attendance: 50,
      streaming_payout: 8,
      avg_ticket_price: 12,
    },
    market_growth: {
      streaming_yoy: 35,
      social_penetration: 45,
      tier: "Growth",
    },
  },
  ZA: {
    score: 56,
    label: "MEDIUM",
    roi_vs_us: 2.5,
    recommendation:
      "Southern Africa anchor. Amapiano crossover creates unique engagement opportunities.",
    ad_costs: { tiktok_cpm: 2.2, meta_cpm: 2.5, youtube_cpm: 1.8 },
    fan_value: {
      merch_enthusiasm: 62,
      live_attendance: 68,
      streaming_payout: 25,
      avg_ticket_price: 35,
    },
    market_growth: {
      streaming_yoy: 32,
      social_penetration: 48,
      tier: "Growth",
    },
  },
};

/** Get arbitrage detail for a country. Returns mock or generates stub. */
export function getMockCountryArbitrage(
  countryCode: string,
): CountryArbitrage | undefined {
  if (COUNTRY_ARBITRAGE[countryCode]) return COUNTRY_ARBITRAGE[countryCode];

  const market = leaderboard.find((m) => m.country_code === countryCode);
  if (!market) return undefined;

  return {
    score: market.arbitrage_score,
    label: market.arbitrage_label,
    roi_vs_us: market.roi_vs_us,
    recommendation:
      market.arbitrage_label === "HIGH"
        ? "Strong opportunity — consider increasing budget allocation."
        : market.arbitrage_label === "MEDIUM"
          ? "Moderate opportunity — test with small campaigns first."
          : "Low priority — monitor for changes.",
    ad_costs: {
      tiktok_cpm: market.avg_cpm_blended,
      meta_cpm: market.avg_cpm_blended * 1.15,
      youtube_cpm: market.avg_cpm_blended * 0.85,
    },
    fan_value: {
      merch_enthusiasm: 40 + market.arbitrage_score * 0.4,
      live_attendance: 45 + market.arbitrage_score * 0.35,
      streaming_payout: 10 + market.arbitrage_score * 0.2,
      avg_ticket_price: 10 + market.roi_vs_us * 8,
    },
    market_growth: {
      streaming_yoy: 15 + market.arbitrage_score * 0.4,
      social_penetration: 25 + market.arbitrage_score * 0.3,
      tier: market.arbitrage_score > 65 ? "Emerging" : "Growth",
    },
  };
}

/* ─── Assembled mock arbitrage data ──────────────────────────── */

export const MOCK_ARBITRAGE_DATA: ArbitrageData = {
  leaderboard,
  hero_insight: {
    country_name: "Nigeria",
    country_code: "NG",
    roi_vs_us: 3.2,
    avg_cpm: 1.8,
    active_songs: 372,
    headline: "Fans spend 43× more on merch per ad dollar than US audiences",
  },
  opportunity_buckets: {
    high: 6,
    medium: 11,
    low: 3,
  },
  us_baseline_cpm: 12.5,
};

/** Lookup arbitrage score for a country code (for globe coloring). */
export function getArbitrageScore(countryCode: string): {
  score: number;
  label: "HIGH" | "MEDIUM" | "LOW";
} | null {
  const market = leaderboard.find((m) => m.country_code === countryCode);
  if (!market) return null;
  return { score: market.arbitrage_score, label: market.arbitrage_label };
}
