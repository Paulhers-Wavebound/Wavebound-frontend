// ── Expansion Radar — Mock Data ──
// All data consumed by the Expansion Radar page. Zero Supabase calls.

export interface ExpansionArtist {
  handle: string;
  name: string;
  label: string;
  monthly_listeners: number;
  monthly_listeners_change_pct: number;
  markets_reached: number;
  new_markets_this_month: number;
  untapped_markets: number;
  estimated_missed_reach: number;
}

export interface CityData {
  city: string;
  country: string;
  country_code: string;
  flag: string;
  listeners: number;
  pct_of_total: number;
  status: "strong" | "growing" | "untapped";
}

export interface ExpansionOpportunity {
  id: string;
  flag: string;
  market_name: string;
  region: string;
  cities: string[];
  priority: "high" | "medium" | "new";
  comparable_avg_listeners: number;
  artist_current_listeners: number;
  comment_signal_pct: number;
  confidence_pct: number;
  gos_score: number;
  projected_monthly_revenue: number;
  evidence: string[];
  strategy: string;
}

export interface LanguageData {
  language: string;
  flag: string;
  pct: number;
  color: string;
}

export interface NicheProofItem {
  artist: string;
  description: string;
  views: string;
  market_badge: string;
  format: string;
}

// ── MOCK: Artist ──
export const mockArtist: ExpansionArtist = {
  handle: "kilumusic",
  name: "Kilu",
  label: "Columbia Records",
  monthly_listeners: 847000,
  monthly_listeners_change_pct: 12,
  markets_reached: 14,
  new_markets_this_month: 2,
  untapped_markets: 6,
  estimated_missed_reach: 340000,
};

// ── MOCK: Top Cities (Spotify) ──
export const mockCities: CityData[] = [
  {
    city: "Oslo",
    country: "Norway",
    country_code: "NO",
    flag: "\u{1F1F3}\u{1F1F4}",
    listeners: 124200,
    pct_of_total: 14.7,
    status: "strong",
  },
  {
    city: "Stockholm",
    country: "Sweden",
    country_code: "SE",
    flag: "\u{1F1F8}\u{1F1EA}",
    listeners: 89100,
    pct_of_total: 10.5,
    status: "strong",
  },
  {
    city: "London",
    country: "UK",
    country_code: "GB",
    flag: "\u{1F1EC}\u{1F1E7}",
    listeners: 67400,
    pct_of_total: 8.0,
    status: "strong",
  },
  {
    city: "Berlin",
    country: "Germany",
    country_code: "DE",
    flag: "\u{1F1E9}\u{1F1EA}",
    listeners: 42800,
    pct_of_total: 5.1,
    status: "strong",
  },
  {
    city: "New York",
    country: "US",
    country_code: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    listeners: 18200,
    pct_of_total: 2.1,
    status: "growing",
  },
  {
    city: "Los Angeles",
    country: "US",
    country_code: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    listeners: 11600,
    pct_of_total: 1.4,
    status: "growing",
  },
  {
    city: "Copenhagen",
    country: "Denmark",
    country_code: "DK",
    flag: "\u{1F1E9}\u{1F1F0}",
    listeners: 9800,
    pct_of_total: 1.2,
    status: "growing",
  },
];

// ── MOCK: Expansion Opportunities ──
export const mockOpportunities: ExpansionOpportunity[] = [
  {
    id: "1",
    flag: "\u{1F1E7}\u{1F1F7}",
    market_name: "Brazil",
    region: "S\u00e3o Paulo \u00b7 Rio \u00b7 Belo Horizonte",
    cities: ["S\u00e3o Paulo", "Rio de Janeiro", "Belo Horizonte"],
    priority: "high",
    comparable_avg_listeners: 84000,
    artist_current_listeners: 0,
    comment_signal_pct: 18,
    confidence_pct: 92,
    gos_score: 87,
    projected_monthly_revenue: 4200,
    evidence: [
      "18% of TikTok comments are in Portuguese",
      "3 comparable artists avg 84K listeners in S\u00e3o Paulo alone",
      'Brazilian fan accounts already reposting "how did they know" videos',
      "Genre is trending +34% in Brazil this quarter",
    ],
    strategy:
      'Post 2x bilingual hook videos (English \u2192 Portuguese subtitle overlay). Leverage "how did they know" format \u2014 already resonating with Brazilian commenters. Collab with @luizamusic (12K followers, same niche, S\u00e3o Paulo based). Post at 6pm BRT for maximum reach window.',
  },
  {
    id: "2",
    flag: "\u{1F1F5}\u{1F1ED}",
    market_name: "Southeast Asia",
    region: "Manila \u00b7 Jakarta \u00b7 Bangkok",
    cities: ["Manila", "Jakarta", "Bangkok"],
    priority: "high",
    comparable_avg_listeners: 126000,
    artist_current_listeners: 0,
    comment_signal_pct: 12,
    confidence_pct: 87,
    gos_score: 91,
    projected_monthly_revenue: 6300,
    evidence: [
      "12% of TikTok comments contain Filipino/Tagalog + Indonesian",
      "SEA is the fastest-growing market for this niche (+41% QoQ)",
      'Comparable artist "novuh" grew from 0 \u2192 126K Manila listeners in 4 months',
      "Emotional indie + soft vocals = top-performing genre in Philippines TikTok",
    ],
    strategy:
      'SEA audiences discover via TikTok sound-first. Push "how did they know" and "night drive" as TikTok sounds with Filipino creator seeding. 3 micro-creators in Manila (2K\u20138K followers) already use similar sounds. Post 7\u20139pm PHT.',
  },
  {
    id: "3",
    flag: "\u{1F1F2}\u{1F1FD}",
    market_name: "Mexico & LATAM",
    region: "CDMX \u00b7 Guadalajara \u00b7 Bogot\u00e1",
    cities: ["Mexico City", "Guadalajara", "Bogot\u00e1"],
    priority: "medium",
    comparable_avg_listeners: 52000,
    artist_current_listeners: 0,
    comment_signal_pct: 8,
    confidence_pct: 74,
    gos_score: 62,
    projected_monthly_revenue: 2800,
    evidence: [
      "8% Spanish-language comments on TikTok (growing month over month)",
      "LATAM indie scene growing \u2014 discovery-driven, English-friendly",
      '2 comparable artists broke CDMX via "lyric reaction" format',
    ],
    strategy:
      '"Lyric reaction" format works \u2014 Spanish-speaking fans reacting to English lyrics they connect with. Test 1x per week with Spanish caption overlay. Lower confidence than Brazil \u2014 monitor for 2 weeks before scaling.',
  },
  {
    id: "4",
    flag: "\u{1F1FA}\u{1F1F8}",
    market_name: "US \u2014 Scale Up",
    region: "Chicago \u00b7 Austin \u00b7 Atlanta \u00b7 Portland",
    cities: ["Chicago", "Austin", "Atlanta", "Portland"],
    priority: "new",
    comparable_avg_listeners: 210000,
    artist_current_listeners: 30000,
    comment_signal_pct: 52,
    confidence_pct: 96,
    gos_score: 94,
    projected_monthly_revenue: 14800,
    evidence: [
      "Kilu already has 30K US listeners but concentrated in NYC + LA only",
      "Comparable artists have 7x more US listeners with similar Spotify profiles",
      "Missing mid-tier US cities entirely \u2014 zero presence in Chicago, Austin, Atlanta",
    ],
    strategy:
      'Double posting frequency during US peak hours (6\u201310pm EST). "How did they know" series is already working \u2014 US audience needs volume + consistency. Target Spotify editorial pitching for "Indie Chill" and "Bedroom Pop" playlists (US-curated).',
  },
];

// ── MOCK: Comment Language Distribution ──
export const mockLanguages: LanguageData[] = [
  {
    language: "English",
    flag: "\u{1F1EC}\u{1F1E7}",
    pct: 52,
    color: "#30D158",
  },
  {
    language: "Norwegian",
    flag: "\u{1F1F3}\u{1F1F4}",
    pct: 18,
    color: "#30D158",
  },
  {
    language: "Portuguese",
    flag: "\u{1F1E7}\u{1F1F7}",
    pct: 14,
    color: "#e8430a",
  },
  {
    language: "Filipino",
    flag: "\u{1F1F5}\u{1F1ED}",
    pct: 8,
    color: "#e8430a",
  },
  { language: "Spanish", flag: "\u{1F1EA}\u{1F1F8}", pct: 5, color: "#FFD60A" },
  {
    language: "Indonesian",
    flag: "\u{1F1EE}\u{1F1E9}",
    pct: 3,
    color: "#FFD60A",
  },
];

// ── MOCK: Niche Proof ──
export const mockNicheProof: NicheProofItem[] = [
  {
    artist: "novuh",
    description:
      'Bilingual hook (EN\u2192PT) \u2014 "you said you\'d stay" with Portuguese subtitle overlay. 68% of views from Brazil.',
    views: "2.4M views",
    market_badge: "\u{1F1E7}\u{1F1F7} Brazil Breakout",
    format: "Bilingual Hook",
  },
  {
    artist: "d4vd",
    description:
      "Night drive aesthetic + soft vocal snippet. Used as TikTok sound by 4,200 Filipino creators in one week.",
    views: "1.8M views",
    market_badge: "\u{1F1F5}\u{1F1ED} SEA Viral",
    format: "Sound-First Discovery",
  },
  {
    artist: "jude ari",
    description:
      "Spanish-speaking fans reacting to English lyrics. Comment section exploded with translation threads.",
    views: "3.1M views",
    market_badge: "\u{1F1F2}\u{1F1FD} LATAM Hit",
    format: "Lyric Reaction",
  },
];

// ── MOCK: Revenue Estimates ──
export const mockRevenue = [
  {
    market: "\u{1F1E7}\u{1F1F7}",
    label: "Brazil Potential",
    value: 4200,
    subtext: "/month in additional streams",
  },
  {
    market: "\u{1F1F5}\u{1F1ED}\u{1F1EE}\u{1F1E9}\u{1F1F9}\u{1F1ED}",
    label: "SEA Potential",
    value: 6300,
    subtext: "/month in additional streams",
  },
  {
    market: "\u{1F1FA}\u{1F1F8}",
    label: "US Scale-Up",
    value: 14800,
    subtext: "/month in additional streams",
  },
];

// ═══════════════════════════════════════════════════════════
// ── MOCK: Artist 2 — Veira ──
// ═══════════════════════════════════════════════════════════

export const mockArtist2: ExpansionArtist = {
  handle: "veiramusic",
  name: "Veira",
  label: "Columbia Records",
  monthly_listeners: 1200000,
  monthly_listeners_change_pct: 8,
  markets_reached: 22,
  new_markets_this_month: 3,
  untapped_markets: 4,
  estimated_missed_reach: 180000,
};

// ── MOCK: Top Cities 2 (Veira) ──
export const mockCities2: CityData[] = [
  {
    city: "London",
    country: "UK",
    country_code: "GB",
    flag: "\u{1F1EC}\u{1F1E7}",
    listeners: 180000,
    pct_of_total: 16,
    status: "strong",
  },
  {
    city: "Paris",
    country: "France",
    country_code: "FR",
    flag: "\u{1F1EB}\u{1F1F7}",
    listeners: 95000,
    pct_of_total: 8,
    status: "strong",
  },
  {
    city: "Berlin",
    country: "Germany",
    country_code: "DE",
    flag: "\u{1F1E9}\u{1F1EA}",
    listeners: 72000,
    pct_of_total: 6,
    status: "strong",
  },
  {
    city: "Amsterdam",
    country: "Netherlands",
    country_code: "NL",
    flag: "\u{1F1F3}\u{1F1F1}",
    listeners: 48000,
    pct_of_total: 4,
    status: "strong",
  },
  {
    city: "Tokyo",
    country: "Japan",
    country_code: "JP",
    flag: "\u{1F1EF}\u{1F1F5}",
    listeners: 22000,
    pct_of_total: 1.8,
    status: "growing",
  },
  {
    city: "Seoul",
    country: "South Korea",
    country_code: "KR",
    flag: "\u{1F1F0}\u{1F1F7}",
    listeners: 15000,
    pct_of_total: 1.2,
    status: "growing",
  },
  {
    city: "Toronto",
    country: "Canada",
    country_code: "CA",
    flag: "\u{1F1E8}\u{1F1E6}",
    listeners: 12000,
    pct_of_total: 1,
    status: "growing",
  },
];

// ── MOCK: Expansion Opportunities 2 (Veira) ──
export const mockOpportunities2: ExpansionOpportunity[] = [
  {
    id: "v1",
    flag: "\u{1F1EF}\u{1F1F5}",
    market_name: "Japan",
    region: "Tokyo \u00b7 Osaka \u00b7 Nagoya",
    cities: ["Tokyo", "Osaka", "Nagoya"],
    priority: "high",
    comparable_avg_listeners: 145000,
    artist_current_listeners: 22000,
    comment_signal_pct: 22,
    confidence_pct: 89,
    gos_score: 85,
    projected_monthly_revenue: 8400,
    evidence: [
      "Anime soundtrack fan overlap \u2014 Veira\u2019s sound matches popular anime OST aesthetics",
      "J-pop crossover potential with soft vocal + electronic production style",
      "22% of TikTok comments are in Japanese, growing month over month",
    ],
    strategy:
      "Collab with Japanese vocalists for bilingual hook edits. Target anime edit format \u2014 pair tracks with popular anime clips. Post at 8pm JST for peak engagement. Pitch to Spotify Japan\u2019s \u201cIndie Pop\u201d and \u201cAnime Chill\u201d editorial playlists.",
  },
  {
    id: "v2",
    flag: "\u{1F1F0}\u{1F1F7}",
    market_name: "South Korea",
    region: "Seoul \u00b7 Busan",
    cities: ["Seoul", "Busan"],
    priority: "high",
    comparable_avg_listeners: 98000,
    artist_current_listeners: 15000,
    comment_signal_pct: 15,
    confidence_pct: 82,
    gos_score: 78,
    projected_monthly_revenue: 5100,
    evidence: [
      "K-indie crossover audience \u2014 similar BPM and vocal style to trending Korean indie acts",
      "15% of TikTok comments are in Korean, with fan-translated lyric threads",
      "Korean fan edits of Veira tracks already going viral (3 edits with 200K+ views each)",
    ],
    strategy:
      "Leverage existing Korean fan edits by duetting/stitching them. Seed with 3\u20135 Korean micro-creators (5K\u201315K followers) in the indie music niche. Post at 7\u20139pm KST. Target Melon and Spotify Korea editorial playlists.",
  },
  {
    id: "v3",
    flag: "\u{1F1EE}\u{1F1F3}",
    market_name: "India",
    region: "Mumbai \u00b7 Delhi \u00b7 Bangalore",
    cities: ["Mumbai", "Delhi", "Bangalore"],
    priority: "medium",
    comparable_avg_listeners: 210000,
    artist_current_listeners: 0,
    comment_signal_pct: 6,
    confidence_pct: 68,
    gos_score: 55,
    projected_monthly_revenue: 3200,
    evidence: [
      "Bollywood crossover potential \u2014 melodic vocal style resonates with Indian pop listeners",
      "6% of TikTok comments are in Hindi, small but steadily increasing",
      "India is the fastest-growing Spotify market globally (+62% YoY)",
    ],
    strategy:
      "Test 1x weekly with Hindi subtitle overlays on emotional tracks. Bollywood-style mood edits (rain, city lights) perform well in India. Lower confidence \u2014 monitor comment sentiment and save-to-listen ratio for 3 weeks before scaling. Post at 8\u201310pm IST.",
  },
];

// ── MOCK: Comment Language Distribution 2 (Veira) ──
export const mockLanguages2: LanguageData[] = [
  {
    language: "English",
    flag: "\u{1F1EC}\u{1F1E7}",
    pct: 60,
    color: "#30D158",
  },
  {
    language: "French",
    flag: "\u{1F1EB}\u{1F1F7}",
    pct: 15,
    color: "#30D158",
  },
  {
    language: "Japanese",
    flag: "\u{1F1EF}\u{1F1F5}",
    pct: 10,
    color: "#e8430a",
  },
  {
    language: "Korean",
    flag: "\u{1F1F0}\u{1F1F7}",
    pct: 8,
    color: "#e8430a",
  },
  {
    language: "Hindi",
    flag: "\u{1F1EE}\u{1F1F3}",
    pct: 4,
    color: "#FFD60A",
  },
  {
    language: "German",
    flag: "\u{1F1E9}\u{1F1EA}",
    pct: 3,
    color: "#FFD60A",
  },
];

// ── MOCK: Niche Proof 2 (Veira) ──
export const mockNicheProof2: NicheProofItem[] = [
  {
    artist: "yoasobi",
    description:
      "Anime OP edit with English indie vocal layered over fight scene. Blew up on Japanese TikTok \u2014 74% of views from Japan.",
    views: "4.1M views",
    market_badge: "\u{1F1EF}\u{1F1F5} Japan Breakout",
    format: "Anime Edit",
  },
  {
    artist: "wave to earth",
    description:
      "Korean fan-translated lyric video with soft city night aesthetic. Comment section became a bilingual community.",
    views: "2.7M views",
    market_badge: "\u{1F1F0}\u{1F1F7} Korea Viral",
    format: "Fan-Translated Lyrics",
  },
  {
    artist: "prateek kuhad",
    description:
      "Hindi subtitle overlay on emotional ballad. Indian creators started using it as a heartbreak sound \u2014 1,800 user-generated videos in 2 weeks.",
    views: "1.9M views",
    market_badge: "\u{1F1EE}\u{1F1F3} India Discovery",
    format: "Subtitle Overlay",
  },
];

// ── MOCK: Revenue Estimates 2 (Veira) ──
export const mockRevenue2 = [
  {
    market: "\u{1F1EF}\u{1F1F5}",
    label: "Japan Potential",
    value: 8400,
    subtext: "/month in additional streams",
  },
  {
    market: "\u{1F1F0}\u{1F1F7}",
    label: "South Korea Potential",
    value: 5100,
    subtext: "/month in additional streams",
  },
  {
    market: "\u{1F1EE}\u{1F1F3}",
    label: "India Potential",
    value: 3200,
    subtext: "/month in additional streams",
  },
];

// ── MOCK: Artist Roster (combined data for multi-artist views) ──
export const mockArtistRoster: {
  artist: ExpansionArtist;
  cities: CityData[];
  opportunities: ExpansionOpportunity[];
  languages: LanguageData[];
  nicheProof: NicheProofItem[];
  revenue: typeof mockRevenue;
}[] = [
  {
    artist: mockArtist,
    cities: mockCities,
    opportunities: mockOpportunities,
    languages: mockLanguages,
    nicheProof: mockNicheProof,
    revenue: mockRevenue,
  },
  {
    artist: mockArtist2,
    cities: mockCities2,
    opportunities: mockOpportunities2,
    languages: mockLanguages2,
    nicheProof: mockNicheProof2,
    revenue: mockRevenue2,
  },
];
