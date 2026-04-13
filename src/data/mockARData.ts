/**
 * A&R Command Center — Mock Data
 *
 * 15 prospects across all 5 pipeline stages, aligned to Bible_A&R.md.
 * Each prospect demonstrates a specific facet of the scouting system.
 */

import type {
  ARProspect,
  ARDecisionPoint,
  RosterOption,
} from "@/types/arTypes";

/** Deterministic avatar URL from artist name */
function avatar(name: string): string {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=1C1C1E`;
}

/* ─── Roster Options ──────────────────────────────────────── */

export const MOCK_ROSTER_OPTIONS: RosterOption[] = [
  { id: "columbia-us", label: "Columbia US", artist_count: 1247 },
  { id: "rca", label: "RCA", artist_count: 983 },
  { id: "epic", label: "Epic", artist_count: 741 },
  { id: "latin", label: "Latin", artist_count: 622 },
  { id: "global", label: "Global", artist_count: 3593 },
];

/* ─── 15 Prospects ────────────────────────────────────────── */

export const MOCK_AR_PROSPECTS: ARProspect[] = [
  // ── 1. Luna Voss — Star prospect ──────────────────────────
  {
    id: "ar-001",
    artist_name: "Luna Voss",
    avatar_url: avatar("Luna Voss"),
    genre: "Afro-Pop / R&B",
    origin_country: "NG",
    pipeline_stage: "assessment",
    rise_probability: 9.7,
    threshold_status: "above",
    flagged_date: "2026-03-14",
    assigned_to: "Imran Majid",
    ghost_curve_match: { artist_name: "Tyla", match_pct: 91, week_offset: 4 },
    growth_velocity: { value: 34, acceleration: 2.8, trend: "accelerating" },
    metrics: {
      spotify_monthly_listeners: 187000,
      spotify_monthly_listeners_delta_pct: 34,
      spotify_follower_growth_mom: 28,
      spotify_save_rate: 14.2,
      tiktok_followers: 45000,
      instagram_followers: 62000,
      social_engagement_rate: 8.1,
      track_completion_rate_30s: 72,
      live_ticket_capacity: 300,
      live_sellout_pct: 88,
      conversion_alpha: 4.2,
      seven_day_velocity: 18.4,
    },
    trigger_markets: [
      {
        country_code: "NG",
        country_name: "Nigeria",
        region: "Africa",
        platform: "TikTok",
        position: 3,
        velocity_score: 92,
        is_early_adopter: true,
      },
      {
        country_code: "GH",
        country_name: "Ghana",
        region: "Africa",
        platform: "TikTok",
        position: 7,
        velocity_score: 84,
        is_early_adopter: true,
      },
      {
        country_code: "GB",
        country_name: "United Kingdom",
        region: "UK",
        platform: "Spotify",
        position: 42,
        velocity_score: 61,
        is_early_adopter: false,
      },
      {
        country_code: "ZA",
        country_name: "South Africa",
        region: "Africa",
        platform: "Spotify",
        position: 18,
        velocity_score: 74,
        is_early_adopter: true,
      },
    ],
    format_alpha: {
      best_format: "Sped Up",
      best_format_engagement_lift: 38,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 6.2,
          save_rate: 12.1,
          completion_rate: 68,
        },
        {
          format: "Sped Up",
          engagement_rate: 8.6,
          save_rate: 14.2,
          completion_rate: 72,
        },
        {
          format: "Slowed",
          engagement_rate: 5.8,
          save_rate: 11.4,
          completion_rate: 65,
        },
        {
          format: "Acoustic",
          engagement_rate: 7.1,
          save_rate: 13.8,
          completion_rate: 70,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 4280,
      distribution: {
        emoji_only: 32,
        casual_praise: 18,
        artist_recognition: 20,
        event_intent: 22,
        purchase_intent: 5,
        collab_request: 3,
      },
      intent_score: 78,
      top_signals: [
        "when are you coming to London? 🇬🇧",
        "this sound is everywhere in Lagos rn",
        "need this on vinyl ASAP",
        "she's giving Tyla but with her own thing",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 4.2,
      spotify_to_ig_follow: 2.8,
      ig_to_merch: 0.6,
      funnel_health: "strong",
      migration_trend: "accelerating",
    },
    signability: {
      overall: 88,
      creative: {
        score: 92,
        factors: [
          "Strong melodic hooks",
          "Consistent output quality",
          "3 unreleased tracks scored >70% completion",
        ],
      },
      commercial: {
        score: 88,
        factors: [
          "187K Spotify ML growing 34%/mo",
          "Cross-platform migration 4.2%",
          "Trigger market alpha in Africa + UK crossover",
        ],
      },
      legal_pulse: {
        score: 85,
        factors: [
          "Publishing clean",
          "No prior deals",
          "Manager: independent, well-regarded",
        ],
      },
      three_sixty_upside: {
        score: 78,
        live_pct: 18,
        merch_pct: 22,
        endorsement_pct: 15,
      },
    },
    deal_status: null,
    sparkline_data: [42, 48, 55, 61, 68, 74, 82, 88, 91, 95, 97, 100, 104, 108],
    risk_flags: [],
    ai_narrative:
      "Luna Voss is a Lagos-based Afro-Pop/R&B artist showing textbook trigger market migration. Her sound velocity in Nigeria and Ghana mirrors Tyla's early West African trajectory before the UK crossover. Growth Velocity Vg has been positive for 3 consecutive weeks with increasing acceleration. Comment intent analysis reveals unusually high event-intent signals from London, suggesting organic demand ahead of any push. The sped-up format version is outperforming the original by 38% on engagement — a strong signal for UGC-driven virality. All scouting thresholds exceeded. Unreleased material quality is consistent.",
    unreleased_test: { score: 82, label: "Passed" },
    source_platform: "tiktok",
    source_handle: "lunavossmusic",
    tiktok_handle: "lunavossmusic",
    instagram_handle: "lunavoss",
    spotify_url: "https://open.spotify.com/artist/4xRYI6VqpkE3UwrDrAZL8L",
  },

  // ── 2. Kai Renshaw ────────────────────────────────────────
  {
    id: "ar-002",
    artist_name: "Kai Renshaw",
    avatar_url: avatar("Kai Renshaw"),
    genre: "Indie Pop / Electronic",
    origin_country: "AU",
    pipeline_stage: "validation",
    rise_probability: 8.4,
    threshold_status: "above",
    flagged_date: "2026-02-28",
    assigned_to: "Justin Eshak",
    ghost_curve_match: {
      artist_name: "Troye Sivan",
      match_pct: 78,
      week_offset: 6,
    },
    growth_velocity: { value: 22, acceleration: 1.4, trend: "accelerating" },
    metrics: {
      spotify_monthly_listeners: 142000,
      spotify_monthly_listeners_delta_pct: 22,
      spotify_follower_growth_mom: 19,
      spotify_save_rate: 12.8,
      tiktok_followers: 38000,
      instagram_followers: 51000,
      social_engagement_rate: 7.2,
      track_completion_rate_30s: 69,
      live_ticket_capacity: 250,
      live_sellout_pct: 92,
      conversion_alpha: 3.6,
      seven_day_velocity: 14.2,
    },
    trigger_markets: [
      {
        country_code: "AU",
        country_name: "Australia",
        region: "SEA",
        platform: "Spotify",
        position: 2,
        velocity_score: 88,
        is_early_adopter: true,
      },
      {
        country_code: "NZ",
        country_name: "New Zealand",
        region: "SEA",
        platform: "Spotify",
        position: 8,
        velocity_score: 76,
        is_early_adopter: true,
      },
      {
        country_code: "GB",
        country_name: "United Kingdom",
        region: "UK",
        platform: "TikTok",
        position: 31,
        velocity_score: 58,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Acoustic",
      best_format_engagement_lift: 25,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 5.8,
          save_rate: 11.2,
          completion_rate: 66,
        },
        {
          format: "Acoustic",
          engagement_rate: 7.2,
          save_rate: 12.8,
          completion_rate: 69,
        },
        {
          format: "Sped Up",
          engagement_rate: 4.9,
          save_rate: 9.1,
          completion_rate: 58,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 2840,
      distribution: {
        emoji_only: 28,
        casual_praise: 22,
        artist_recognition: 24,
        event_intent: 16,
        purchase_intent: 6,
        collab_request: 4,
      },
      intent_score: 72,
      top_signals: [
        "his live sets are insane",
        "acoustic version hits different",
        "giving early Troye vibes",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 3.6,
      spotify_to_ig_follow: 2.4,
      ig_to_merch: 0.8,
      funnel_health: "strong",
      migration_trend: "steady",
    },
    signability: {
      overall: 82,
      creative: {
        score: 85,
        factors: [
          "Distinctive vocal tone",
          "Strong live performer",
          "Self-produced",
        ],
      },
      commercial: {
        score: 80,
        factors: [
          "142K ML, steady growth",
          "Strong AU/NZ base",
          "UK crossover potential",
        ],
      },
      legal_pulse: {
        score: 88,
        factors: [
          "No prior deals",
          "Publishing clean",
          "Manager: CAA-affiliated",
        ],
      },
      three_sixty_upside: {
        score: 76,
        live_pct: 22,
        merch_pct: 18,
        endorsement_pct: 12,
      },
    },
    deal_status: null,
    sparkline_data: [38, 42, 45, 49, 54, 58, 62, 66, 70, 73, 76, 80, 83, 86],
    risk_flags: [],
    ai_narrative:
      "Kai Renshaw is a Melbourne-based indie pop artist with a strong live performance reputation and self-production capability. His acoustic format consistently outperforms, suggesting a fanbase that values authenticity over virality. The Troye Sivan trajectory match at 78% is encouraging for Western crossover from an AU base. Ear test scheduled with Justin Eshak.",
    unreleased_test: { score: 74, label: "Passed" },
    source_platform: "tiktok",
    source_handle: "kairenshaw",
    tiktok_handle: "kairenshaw",
    instagram_handle: "kairenshaw",
    spotify_url: "https://open.spotify.com/artist/5K4W6rqBFWDnAN6FQUkS6x",
  },

  // ── 3. Mira Sol ───────────────────────────────────────────
  {
    id: "ar-003",
    artist_name: "Mira Sol",
    avatar_url: avatar("Mira Sol"),
    genre: "Latin Pop / Reggaeton",
    origin_country: "CO",
    pipeline_stage: "deep_dive",
    rise_probability: 7.1,
    threshold_status: "borderline",
    flagged_date: "2026-03-22",
    assigned_to: null,
    ghost_curve_match: {
      artist_name: "Rosalía",
      match_pct: 65,
      week_offset: 8,
    },
    growth_velocity: { value: 19, acceleration: 0.8, trend: "steady" },
    metrics: {
      spotify_monthly_listeners: 98000,
      spotify_monthly_listeners_delta_pct: 19,
      spotify_follower_growth_mom: 16,
      spotify_save_rate: 11.4,
      tiktok_followers: 28000,
      instagram_followers: 44000,
      social_engagement_rate: 6.8,
      track_completion_rate_30s: 64,
      live_ticket_capacity: 150,
      live_sellout_pct: 78,
      conversion_alpha: 2.1,
      seven_day_velocity: 11.6,
    },
    trigger_markets: [
      {
        country_code: "CO",
        country_name: "Colombia",
        region: "LatAm",
        platform: "Spotify",
        position: 4,
        velocity_score: 82,
        is_early_adopter: true,
      },
      {
        country_code: "MX",
        country_name: "Mexico",
        region: "LatAm",
        platform: "TikTok",
        position: 18,
        velocity_score: 68,
        is_early_adopter: true,
      },
      {
        country_code: "US",
        country_name: "United States",
        region: "US",
        platform: "Spotify",
        position: 52,
        velocity_score: 44,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Slowed",
      best_format_engagement_lift: 31,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 5.2,
          save_rate: 9.8,
          completion_rate: 61,
        },
        {
          format: "Slowed",
          engagement_rate: 6.8,
          save_rate: 11.4,
          completion_rate: 64,
        },
        {
          format: "Sped Up",
          engagement_rate: 5.0,
          save_rate: 8.6,
          completion_rate: 56,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 1920,
      distribution: {
        emoji_only: 38,
        casual_praise: 24,
        artist_recognition: 18,
        event_intent: 12,
        purchase_intent: 4,
        collab_request: 4,
      },
      intent_score: 58,
      top_signals: ["la versión lenta es todo 🔥", "need her at Coachella"],
    },
    cross_platform: {
      tiktok_to_spotify: 2.1,
      spotify_to_ig_follow: 1.8,
      ig_to_merch: null,
      funnel_health: "moderate",
      migration_trend: "steady",
    },
    signability: {
      overall: 71,
      creative: {
        score: 74,
        factors: ["Strong vocal range", "Bilingual appeal"],
      },
      commercial: {
        score: 68,
        factors: [
          "98K ML — just under 100K threshold",
          "LatAm base with US potential",
        ],
      },
      legal_pulse: {
        score: 78,
        factors: ["Publishing clean", "No prior deals"],
      },
      three_sixty_upside: {
        score: 64,
        live_pct: 15,
        merch_pct: 16,
        endorsement_pct: 10,
      },
    },
    deal_status: null,
    sparkline_data: [28, 32, 35, 38, 42, 46, 50, 54, 57, 60, 63, 66, 68, 70],
    risk_flags: [],
    ai_narrative:
      "Mira Sol is a Medellín-based Latin Pop artist with bilingual appeal. Currently borderline on the 100K Spotify ML threshold but showing steady growth from Colombia and Mexico. The slowed version of her lead single is outperforming by 31%, indicating a more mature audience segment. Needs persona mapping and deeper competitive analysis before moving to assessment.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "mirasol.official",
    tiktok_handle: "mirasol.official",
    instagram_handle: "mirasol",
    spotify_url: "https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4",
  },

  // ── 4. Jude Okafor ────────────────────────────────────────
  {
    id: "ar-004",
    artist_name: "Jude Okafor",
    avatar_url: avatar("Jude Okafor"),
    genre: "Afrobeats",
    origin_country: "NG",
    pipeline_stage: "flagging",
    rise_probability: 5.8,
    threshold_status: "borderline",
    flagged_date: "2026-04-02",
    assigned_to: null,
    ghost_curve_match: { artist_name: "Rema", match_pct: 54, week_offset: 2 },
    growth_velocity: { value: 41, acceleration: 3.2, trend: "accelerating" },
    metrics: {
      spotify_monthly_listeners: 52000,
      spotify_monthly_listeners_delta_pct: 41,
      spotify_follower_growth_mom: 38,
      spotify_save_rate: 9.2,
      tiktok_followers: 18000,
      instagram_followers: 12000,
      social_engagement_rate: 5.4,
      track_completion_rate_30s: 58,
      live_ticket_capacity: null,
      live_sellout_pct: null,
      conversion_alpha: 1.4,
      seven_day_velocity: 22.8,
    },
    trigger_markets: [
      {
        country_code: "NG",
        country_name: "Nigeria",
        region: "Africa",
        platform: "TikTok",
        position: 12,
        velocity_score: 78,
        is_early_adopter: true,
      },
      {
        country_code: "KE",
        country_name: "Kenya",
        region: "Africa",
        platform: "Spotify",
        position: 28,
        velocity_score: 62,
        is_early_adopter: true,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 0,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 5.4,
          save_rate: 9.2,
          completion_rate: 58,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 860,
      distribution: {
        emoji_only: 58,
        casual_praise: 22,
        artist_recognition: 10,
        event_intent: 6,
        purchase_intent: 2,
        collab_request: 2,
      },
      intent_score: 32,
      top_signals: ["🔥🔥🔥", "this slaps"],
    },
    cross_platform: {
      tiktok_to_spotify: 1.4,
      spotify_to_ig_follow: 0.8,
      ig_to_merch: null,
      funnel_health: "weak",
      migration_trend: "steady",
    },
    signability: {
      overall: 52,
      creative: {
        score: 58,
        factors: ["Raw talent, needs development", "Only 1 format tested"],
      },
      commercial: {
        score: 48,
        factors: ["52K ML — below threshold", "High velocity but low base"],
      },
      legal_pulse: {
        score: 62,
        factors: ["Publishing clean", "No management"],
      },
      three_sixty_upside: {
        score: 42,
        live_pct: 10,
        merch_pct: 12,
        endorsement_pct: 8,
      },
    },
    deal_status: null,
    sparkline_data: [12, 15, 18, 22, 28, 34, 42, 51, 58, 64, 70, 76, 82, 88],
    risk_flags: [],
    ai_narrative:
      "Jude Okafor is an Abuja-based Afrobeats artist showing explosive early velocity (+41% MoM) but from a low base. Comment intent is predominantly low-value emoji reactions. Only 1 format tested. Needs velocity monitoring for 2-3 more weeks before committing to deep dive. Watch for cross-platform migration signal.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "judeokafor",
    tiktok_handle: "judeokafor",
    instagram_handle: "judeokafor",
    spotify_url: "https://open.spotify.com/artist/5cj0lLjcoR7YOSnhnX0Po5",
  },

  // ── 5. Eloise Park — Greenlight-ready ─────────────────────
  {
    id: "ar-005",
    artist_name: "Eloise Park",
    avatar_url: avatar("Eloise Park"),
    genre: "K-Pop Fusion / Alt-R&B",
    origin_country: "KR",
    pipeline_stage: "execution",
    rise_probability: 9.2,
    threshold_status: "above",
    flagged_date: "2026-01-15",
    assigned_to: "Imran Majid",
    ghost_curve_match: { artist_name: "BIBI", match_pct: 82, week_offset: 12 },
    growth_velocity: { value: 15, acceleration: 0.4, trend: "steady" },
    metrics: {
      spotify_monthly_listeners: 312000,
      spotify_monthly_listeners_delta_pct: 15,
      spotify_follower_growth_mom: 18,
      spotify_save_rate: 16.4,
      tiktok_followers: 128000,
      instagram_followers: 94000,
      social_engagement_rate: 9.2,
      track_completion_rate_30s: 78,
      live_ticket_capacity: 500,
      live_sellout_pct: 96,
      conversion_alpha: 5.8,
      seven_day_velocity: 8.2,
    },
    trigger_markets: [
      {
        country_code: "KR",
        country_name: "South Korea",
        region: "SEA",
        platform: "Spotify",
        position: 1,
        velocity_score: 94,
        is_early_adopter: true,
      },
      {
        country_code: "JP",
        country_name: "Japan",
        region: "SEA",
        platform: "Spotify",
        position: 6,
        velocity_score: 82,
        is_early_adopter: true,
      },
      {
        country_code: "US",
        country_name: "United States",
        region: "US",
        platform: "TikTok",
        position: 22,
        velocity_score: 68,
        is_early_adopter: false,
      },
      {
        country_code: "GB",
        country_name: "United Kingdom",
        region: "UK",
        platform: "Spotify",
        position: 34,
        velocity_score: 56,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 12,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 9.2,
          save_rate: 16.4,
          completion_rate: 78,
        },
        {
          format: "Sped Up",
          engagement_rate: 7.8,
          save_rate: 12.1,
          completion_rate: 68,
        },
        {
          format: "Acoustic",
          engagement_rate: 8.4,
          save_rate: 14.8,
          completion_rate: 74,
        },
        {
          format: "Live",
          engagement_rate: 8.8,
          save_rate: 15.2,
          completion_rate: 76,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 8420,
      distribution: {
        emoji_only: 22,
        casual_praise: 18,
        artist_recognition: 28,
        event_intent: 18,
        purchase_intent: 8,
        collab_request: 6,
      },
      intent_score: 86,
      top_signals: [
        "need her at Glastonbury",
        "take my money 💸",
        "the vocals on the live version omg",
        "collab with Joji when??",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 5.8,
      spotify_to_ig_follow: 3.4,
      ig_to_merch: 1.2,
      funnel_health: "strong",
      migration_trend: "steady",
    },
    signability: {
      overall: 91,
      creative: {
        score: 94,
        factors: [
          "Exceptional vocal range",
          "Self-writes",
          "4 unreleased tracks all >75% completion",
        ],
      },
      commercial: {
        score: 92,
        factors: ["312K ML, cross-platform 5.8%", "Global appeal: KR→JP→US→UK"],
      },
      legal_pulse: {
        score: 88,
        factors: [
          "Publishing clean",
          "Manager: well-connected Seoul agency",
          "No prior label deals",
        ],
      },
      three_sixty_upside: {
        score: 86,
        live_pct: 20,
        merch_pct: 25,
        endorsement_pct: 22,
      },
    },
    deal_status: {
      tier: "viral_breakout",
      advance_range: [350000, 500000],
      terms: "1 Firm + 2 Options",
      three_sixty_clauses: { live: 15, merch: 20, endorsements: 20 },
      projected_irr: 12.8,
      sign_off_chain: [
        { role: "A&R Council", status: "approved" },
        { role: "Business Affairs / Legal", status: "pending" },
        { role: "SVP Finance", status: "not_started" },
        { role: "Label Chairman (Ron Perry)", status: "not_started" },
      ],
    },
    sparkline_data: [64, 68, 72, 74, 76, 78, 80, 82, 84, 86, 87, 88, 89, 90],
    risk_flags: [],
    ai_narrative:
      "Eloise Park is a Seoul-based K-Pop Fusion / Alt-R&B artist with the strongest signability profile in the pipeline. All scouting thresholds exceeded by wide margins. Shadow P&L projects 12.8% IRR on a $425K viral breakout advance. Dossier is complete and metadata pre-cleared. Ready for A&R Council vote on Monday.",
    unreleased_test: { score: 88, label: "Passed — Exceptional" },
    source_platform: "tiktok",
    source_handle: "eloiseparkmusic",
    tiktok_handle: "eloiseparkmusic",
    instagram_handle: "eloisepark",
    spotify_url: "https://open.spotify.com/artist/7n2wHs1TKAczGzO7Dd2rGr",
  },

  // ── 6. Tommy Vega ─────────────────────────────────────────
  {
    id: "ar-006",
    artist_name: "Tommy Vega",
    avatar_url: avatar("Tommy Vega"),
    genre: "Country / Americana",
    origin_country: "US",
    pipeline_stage: "assessment",
    rise_probability: 6.3,
    threshold_status: "borderline",
    flagged_date: "2026-03-08",
    assigned_to: null,
    ghost_curve_match: {
      artist_name: "Zach Bryan",
      match_pct: 58,
      week_offset: 10,
    },
    growth_velocity: { value: 12, acceleration: 0.2, trend: "steady" },
    metrics: {
      spotify_monthly_listeners: 78000,
      spotify_monthly_listeners_delta_pct: 12,
      spotify_follower_growth_mom: 12,
      spotify_save_rate: 13.6,
      tiktok_followers: 14000,
      instagram_followers: 22000,
      social_engagement_rate: 4.8,
      track_completion_rate_30s: 71,
      live_ticket_capacity: 200,
      live_sellout_pct: 100,
      conversion_alpha: 3.8,
      seven_day_velocity: 6.4,
    },
    trigger_markets: [
      {
        country_code: "US",
        country_name: "United States",
        region: "US",
        platform: "Spotify",
        position: 14,
        velocity_score: 72,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Live",
      best_format_engagement_lift: 42,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 4.8,
          save_rate: 13.6,
          completion_rate: 71,
        },
        {
          format: "Live",
          engagement_rate: 6.8,
          save_rate: 18.2,
          completion_rate: 82,
        },
        {
          format: "Acoustic",
          engagement_rate: 5.6,
          save_rate: 14.8,
          completion_rate: 74,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 1440,
      distribution: {
        emoji_only: 24,
        casual_praise: 28,
        artist_recognition: 22,
        event_intent: 18,
        purchase_intent: 4,
        collab_request: 4,
      },
      intent_score: 66,
      top_signals: [
        "saw him in Nashville last week, unreal",
        "this guy is the next Zach Bryan",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 3.8,
      spotify_to_ig_follow: 2.2,
      ig_to_merch: 1.4,
      funnel_health: "moderate",
      migration_trend: "steady",
    },
    signability: {
      overall: 68,
      creative: {
        score: 78,
        factors: [
          "Exceptional live performer",
          "Strong songwriter",
          "200-cap sell-outs consistently",
        ],
      },
      commercial: {
        score: 62,
        factors: [
          "78K ML, growth 12% (under 15%)",
          "US-only so far",
          "High save rate suggests deep fans",
        ],
      },
      legal_pulse: {
        score: 72,
        factors: ["Publishing clean", "Small indie manager"],
      },
      three_sixty_upside: {
        score: 82,
        live_pct: 22,
        merch_pct: 18,
        endorsement_pct: 14,
      },
    },
    deal_status: null,
    sparkline_data: [44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 63, 64, 65, 66],
    risk_flags: [],
    ai_narrative:
      "Tommy Vega is a Nashville-based country/Americana artist whose live format outperforms by 42% — the highest format alpha in the pipeline. Consistently selling out 200-cap venues. Follower growth at 12% is below the 15% threshold, but his save rate (13.6%) and conversion alpha (3.8) suggest deep fan engagement over broad discovery. A development deal candidate if live trajectory continues.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "tommyvega",
    tiktok_handle: "tommyvega",
    instagram_handle: "tommyvegamusic",
    spotify_url: "https://open.spotify.com/artist/40ZNYROS4Ofv1HF2YpMRBr",
  },

  // ── 7. Zara Ndiaye ────────────────────────────────────────
  {
    id: "ar-007",
    artist_name: "Zara Ndiaye",
    avatar_url: avatar("Zara Ndiaye"),
    genre: "Afro-Pop / Dancehall",
    origin_country: "SN",
    pipeline_stage: "validation",
    rise_probability: 8.8,
    threshold_status: "above",
    flagged_date: "2026-02-18",
    assigned_to: "Justin Eshak",
    ghost_curve_match: { artist_name: "Tyla", match_pct: 74, week_offset: 6 },
    growth_velocity: { value: 26, acceleration: 1.8, trend: "accelerating" },
    metrics: {
      spotify_monthly_listeners: 165000,
      spotify_monthly_listeners_delta_pct: 26,
      spotify_follower_growth_mom: 24,
      spotify_save_rate: 13.1,
      tiktok_followers: 52000,
      instagram_followers: 71000,
      social_engagement_rate: 7.8,
      track_completion_rate_30s: 70,
      live_ticket_capacity: 350,
      live_sellout_pct: 82,
      conversion_alpha: 3.9,
      seven_day_velocity: 16.8,
    },
    trigger_markets: [
      {
        country_code: "SN",
        country_name: "Senegal",
        region: "Africa",
        platform: "TikTok",
        position: 1,
        velocity_score: 96,
        is_early_adopter: true,
      },
      {
        country_code: "CI",
        country_name: "Côte d'Ivoire",
        region: "Africa",
        platform: "TikTok",
        position: 5,
        velocity_score: 88,
        is_early_adopter: true,
      },
      {
        country_code: "FR",
        country_name: "France",
        region: "DACH",
        platform: "Spotify",
        position: 31,
        velocity_score: 64,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 8,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 7.8,
          save_rate: 13.1,
          completion_rate: 70,
        },
        {
          format: "Sped Up",
          engagement_rate: 7.2,
          save_rate: 11.8,
          completion_rate: 66,
        },
        {
          format: "Slowed",
          engagement_rate: 6.4,
          save_rate: 10.2,
          completion_rate: 62,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 3640,
      distribution: {
        emoji_only: 24,
        casual_praise: 16,
        artist_recognition: 18,
        event_intent: 18,
        purchase_intent: 12,
        collab_request: 12,
      },
      intent_score: 82,
      top_signals: [
        "where can I buy the vinyl??",
        "need her at Afro Nation",
        "someone get Wizkid on the phone",
        "tu viens quand à Paris?",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 3.9,
      spotify_to_ig_follow: 2.6,
      ig_to_merch: 0.9,
      funnel_health: "strong",
      migration_trend: "accelerating",
    },
    signability: {
      overall: 84,
      creative: {
        score: 86,
        factors: [
          "Unique Francophone-Dancehall fusion",
          "Strong visual identity",
          "Bilingual French/English",
        ],
      },
      commercial: {
        score: 84,
        factors: [
          "165K ML growing 26%/mo",
          "Francophone corridor: Dakar→Abidjan→Paris",
        ],
      },
      legal_pulse: {
        score: 82,
        factors: [
          "Publishing clean",
          "Manager: Paris-based, Sony relationship",
        ],
      },
      three_sixty_upside: {
        score: 80,
        live_pct: 18,
        merch_pct: 22,
        endorsement_pct: 18,
      },
    },
    deal_status: null,
    sparkline_data: [34, 40, 46, 52, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94],
    risk_flags: [],
    ai_narrative:
      "Zara Ndiaye is a Dakar-based Afro-Pop/Dancehall artist with the highest purchase intent (12%) in the pipeline. Her Francophone corridor (Senegal→Côte d'Ivoire→France) represents a clear path to the 88M French-speaking market. Ear test with Justin Eshak in progress.",
    unreleased_test: { score: 76, label: "Passed" },
    source_platform: "tiktok",
    source_handle: "zarandi",
    tiktok_handle: "zarandi",
    instagram_handle: "zarandi",
    spotify_url: "https://open.spotify.com/artist/6eUKZXaKkcviH0Ku9w2n3V",
  },

  // ── 8. Felix Adler — BOT FLAG ─────────────────────────────
  {
    id: "ar-008",
    artist_name: "Felix Adler",
    avatar_url: avatar("Felix Adler"),
    genre: "Hyperpop / Electronic",
    origin_country: "DE",
    pipeline_stage: "deep_dive",
    rise_probability: 4.2,
    threshold_status: "below",
    flagged_date: "2026-03-18",
    assigned_to: null,
    ghost_curve_match: null,
    growth_velocity: { value: 17, acceleration: -0.6, trend: "decelerating" },
    metrics: {
      spotify_monthly_listeners: 67000,
      spotify_monthly_listeners_delta_pct: 17,
      spotify_follower_growth_mom: 14,
      spotify_save_rate: 6.8,
      tiktok_followers: 32000,
      instagram_followers: 18000,
      social_engagement_rate: 3.8,
      track_completion_rate_30s: 52,
      live_ticket_capacity: 120,
      live_sellout_pct: 65,
      conversion_alpha: 0.9,
      seven_day_velocity: 8.4,
    },
    trigger_markets: [
      {
        country_code: "DE",
        country_name: "Germany",
        region: "DACH",
        platform: "TikTok",
        position: 8,
        velocity_score: 72,
        is_early_adopter: true,
      },
      {
        country_code: "SE",
        country_name: "Sweden",
        region: "Nordics",
        platform: "Spotify",
        position: 22,
        velocity_score: 54,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Sped Up",
      best_format_engagement_lift: 18,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 3.2,
          save_rate: 5.8,
          completion_rate: 48,
        },
        {
          format: "Sped Up",
          engagement_rate: 3.8,
          save_rate: 6.8,
          completion_rate: 52,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 1240,
      distribution: {
        emoji_only: 62,
        casual_praise: 18,
        artist_recognition: 8,
        event_intent: 6,
        purchase_intent: 2,
        collab_request: 4,
      },
      intent_score: 28,
      top_signals: ["🔥", "hard"],
    },
    cross_platform: {
      tiktok_to_spotify: 0.9,
      spotify_to_ig_follow: 0.4,
      ig_to_merch: null,
      funnel_health: "broken",
      migration_trend: "declining",
    },
    signability: {
      overall: 38,
      creative: {
        score: 44,
        factors: ["Interesting sound but niche", "Low completion rate (52%)"],
      },
      commercial: {
        score: 32,
        factors: [
          "67K ML, below threshold",
          "3.8% engagement below 5% threshold",
        ],
      },
      legal_pulse: {
        score: 48,
        factors: ["Publishing clean", "No management — risk factor"],
      },
      three_sixty_upside: {
        score: 28,
        live_pct: 10,
        merch_pct: 12,
        endorsement_pct: 8,
      },
    },
    deal_status: null,
    sparkline_data: [22, 28, 34, 40, 46, 50, 52, 54, 54, 52, 50, 48, 46, 44],
    risk_flags: [
      "BOT: 22% suspicious IP clusters from Frankfurt",
      "Engagement below 5% threshold",
      "No cross-platform migration",
    ],
    ai_narrative:
      "Felix Adler is a Berlin-based Hyperpop artist flagged for bot contamination — 22% of Spotify listeners originate from suspicious IP clusters in Frankfurt. Real engagement rate (3.8%) falls below the 5% threshold. No Ghost Curve match above 50%. Cross-platform funnel is broken. Recommend quarantining metrics pending bot scrub before any further investment.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "felixadler",
    tiktok_handle: "felixadler",
    instagram_handle: "felixadlermusic",
    spotify_url: "https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ",
  },

  // ── 9. Priya Sharma ───────────────────────────────────────
  {
    id: "ar-009",
    artist_name: "Priya Sharma",
    avatar_url: avatar("Priya Sharma"),
    genre: "Bollywood Pop / Global",
    origin_country: "IN",
    pipeline_stage: "flagging",
    rise_probability: 6.9,
    threshold_status: "above",
    flagged_date: "2026-04-05",
    assigned_to: null,
    ghost_curve_match: {
      artist_name: "AP Dhillon",
      match_pct: 61,
      week_offset: 3,
    },
    growth_velocity: { value: 31, acceleration: 2.1, trend: "accelerating" },
    metrics: {
      spotify_monthly_listeners: 112000,
      spotify_monthly_listeners_delta_pct: 31,
      spotify_follower_growth_mom: 22,
      spotify_save_rate: 10.8,
      tiktok_followers: 34000,
      instagram_followers: 48000,
      social_engagement_rate: 6.2,
      track_completion_rate_30s: 66,
      live_ticket_capacity: null,
      live_sellout_pct: null,
      conversion_alpha: 2.4,
      seven_day_velocity: 18.2,
    },
    trigger_markets: [
      {
        country_code: "IN",
        country_name: "India",
        region: "SEA",
        platform: "Spotify",
        position: 2,
        velocity_score: 90,
        is_early_adopter: true,
      },
      {
        country_code: "AE",
        country_name: "UAE",
        region: "MENA",
        platform: "TikTok",
        position: 15,
        velocity_score: 72,
        is_early_adopter: true,
      },
      {
        country_code: "GB",
        country_name: "United Kingdom",
        region: "UK",
        platform: "Spotify",
        position: 38,
        velocity_score: 52,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 0,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 6.2,
          save_rate: 10.8,
          completion_rate: 66,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 2180,
      distribution: {
        emoji_only: 34,
        casual_praise: 22,
        artist_recognition: 18,
        event_intent: 14,
        purchase_intent: 6,
        collab_request: 6,
      },
      intent_score: 62,
      top_signals: [
        "Birmingham show when??",
        "this is what Bollywood Pop should sound like",
        "the diaspora is ready",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 2.4,
      spotify_to_ig_follow: 1.8,
      ig_to_merch: null,
      funnel_health: "moderate",
      migration_trend: "accelerating",
    },
    signability: {
      overall: 64,
      creative: {
        score: 68,
        factors: [
          "Fresh Bollywood-global fusion",
          "Only 1 format tested so far",
        ],
      },
      commercial: {
        score: 66,
        factors: ["112K ML growing 31%/mo", "India→UAE→UK diaspora corridor"],
      },
      legal_pulse: {
        score: 62,
        factors: [
          "Publishing needs audit",
          "Manager: Mumbai-based, unknown track record",
        ],
      },
      three_sixty_upside: {
        score: 58,
        live_pct: 14,
        merch_pct: 16,
        endorsement_pct: 12,
      },
    },
    deal_status: null,
    sparkline_data: [18, 24, 30, 38, 46, 54, 60, 66, 72, 78, 84, 90, 96, 100],
    risk_flags: [],
    ai_narrative:
      "Priya Sharma is a Mumbai-based Bollywood Pop artist with strong trigger market migration: India→UAE→UK (diaspora corridor). Growth Velocity Vg is accelerating with +31% MoM. Comment intent shows genuine event demand from UK diaspora communities. Needs format testing and manager background check before deep dive.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "priyasharma.music",
    tiktok_handle: "priyasharma.music",
    instagram_handle: "priyasharma",
    spotify_url: "https://open.spotify.com/artist/4YRxDV8wJFPHPTeXepOstw",
  },

  // ── 10. Marcus Chen ───────────────────────────────────────
  {
    id: "ar-010",
    artist_name: "Marcus Chen",
    avatar_url: avatar("Marcus Chen"),
    genre: "Hip-Hop / R&B",
    origin_country: "CA",
    pipeline_stage: "assessment",
    rise_probability: 7.5,
    threshold_status: "above",
    flagged_date: "2026-03-01",
    assigned_to: null,
    ghost_curve_match: {
      artist_name: "The Weeknd",
      match_pct: 67,
      week_offset: 8,
    },
    growth_velocity: { value: 18, acceleration: 1.0, trend: "accelerating" },
    metrics: {
      spotify_monthly_listeners: 134000,
      spotify_monthly_listeners_delta_pct: 18,
      spotify_follower_growth_mom: 16,
      spotify_save_rate: 12.4,
      tiktok_followers: 42000,
      instagram_followers: 56000,
      social_engagement_rate: 6.8,
      track_completion_rate_30s: 68,
      live_ticket_capacity: 300,
      live_sellout_pct: 86,
      conversion_alpha: 3.2,
      seven_day_velocity: 12.6,
    },
    trigger_markets: [
      {
        country_code: "CA",
        country_name: "Canada",
        region: "US",
        platform: "Spotify",
        position: 4,
        velocity_score: 84,
        is_early_adopter: true,
      },
      {
        country_code: "US",
        country_name: "United States",
        region: "US",
        platform: "TikTok",
        position: 29,
        velocity_score: 62,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Slowed",
      best_format_engagement_lift: 22,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 5.6,
          save_rate: 10.8,
          completion_rate: 64,
        },
        {
          format: "Slowed",
          engagement_rate: 6.8,
          save_rate: 12.4,
          completion_rate: 68,
        },
        {
          format: "Sped Up",
          engagement_rate: 4.2,
          save_rate: 8.6,
          completion_rate: 56,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 2660,
      distribution: {
        emoji_only: 26,
        casual_praise: 20,
        artist_recognition: 18,
        event_intent: 14,
        purchase_intent: 6,
        collab_request: 16,
      },
      intent_score: 70,
      top_signals: [
        "producers DM me if you wanna work",
        "Toronto x LA vibes",
        "the slowed version is chef's kiss",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 3.2,
      spotify_to_ig_follow: 2.0,
      ig_to_merch: 0.6,
      funnel_health: "moderate",
      migration_trend: "accelerating",
    },
    signability: {
      overall: 74,
      creative: {
        score: 78,
        factors: [
          "Strong producer relationships",
          "Self-writes and co-produces",
          "Slowed format resonates",
        ],
      },
      commercial: {
        score: 72,
        factors: ["134K ML, 18% growth", "Canada→US crossover path clear"],
      },
      legal_pulse: {
        score: 76,
        factors: ["Publishing clean", "Manager: Toronto-based, Drake adjacent"],
      },
      three_sixty_upside: {
        score: 70,
        live_pct: 16,
        merch_pct: 20,
        endorsement_pct: 15,
      },
    },
    deal_status: null,
    sparkline_data: [36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 75, 78, 80, 82],
    risk_flags: [],
    ai_narrative:
      "Marcus Chen is a Toronto-based Hip-Hop/R&B artist with high collab_request comment intent (16%) — producers are reaching out organically. The Weeknd Ghost Curve match at 67% tracks the Toronto→US crossover pattern. Strong candidate for producer matching session via Sodatone Jump Scores.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "marcuschen",
    tiktok_handle: "marcuschen",
    instagram_handle: "marcuschenmusic",
    spotify_url: "https://open.spotify.com/artist/1uNFoZAHBGtllmzznpCI3s",
  },

  // ── 11. Astrid Lund ───────────────────────────────────────
  {
    id: "ar-011",
    artist_name: "Astrid Lund",
    avatar_url: avatar("Astrid Lund"),
    genre: "Nordic Pop / Dark Pop",
    origin_country: "DK",
    pipeline_stage: "deep_dive",
    rise_probability: 5.5,
    threshold_status: "borderline",
    flagged_date: "2026-03-20",
    assigned_to: null,
    ghost_curve_match: { artist_name: "Sigrid", match_pct: 72, week_offset: 6 },
    growth_velocity: { value: 14, acceleration: 0.1, trend: "steady" },
    metrics: {
      spotify_monthly_listeners: 89000,
      spotify_monthly_listeners_delta_pct: 14,
      spotify_follower_growth_mom: 14,
      spotify_save_rate: 11.2,
      tiktok_followers: 22000,
      instagram_followers: 34000,
      social_engagement_rate: 5.6,
      track_completion_rate_30s: 66,
      live_ticket_capacity: 180,
      live_sellout_pct: 88,
      conversion_alpha: 2.6,
      seven_day_velocity: 8.8,
    },
    trigger_markets: [
      {
        country_code: "DK",
        country_name: "Denmark",
        region: "Nordics",
        platform: "Spotify",
        position: 3,
        velocity_score: 82,
        is_early_adopter: true,
      },
      {
        country_code: "SE",
        country_name: "Sweden",
        region: "Nordics",
        platform: "Spotify",
        position: 9,
        velocity_score: 74,
        is_early_adopter: true,
      },
      {
        country_code: "NO",
        country_name: "Norway",
        region: "Nordics",
        platform: "TikTok",
        position: 12,
        velocity_score: 68,
        is_early_adopter: true,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 5,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 5.6,
          save_rate: 11.2,
          completion_rate: 66,
        },
        {
          format: "Acoustic",
          engagement_rate: 5.2,
          save_rate: 10.4,
          completion_rate: 64,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 1680,
      distribution: {
        emoji_only: 32,
        casual_praise: 26,
        artist_recognition: 20,
        event_intent: 12,
        purchase_intent: 4,
        collab_request: 6,
      },
      intent_score: 56,
      top_signals: [
        "Nordic pop queen",
        "Sigrid vibes but darker",
        "Copenhagen show was incredible",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 2.6,
      spotify_to_ig_follow: 1.6,
      ig_to_merch: 0.4,
      funnel_health: "moderate",
      migration_trend: "steady",
    },
    signability: {
      overall: 62,
      creative: {
        score: 68,
        factors: ["Distinctive dark pop aesthetic", "Strong Nordic fanbase"],
      },
      commercial: {
        score: 58,
        factors: ["89K ML, borderline", "Follower growth 14% (just under 15%)"],
      },
      legal_pulse: {
        score: 66,
        factors: ["Publishing clean", "Small indie manager"],
      },
      three_sixty_upside: {
        score: 56,
        live_pct: 16,
        merch_pct: 14,
        endorsement_pct: 10,
      },
    },
    deal_status: null,
    sparkline_data: [32, 35, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
    risk_flags: [],
    ai_narrative:
      "Astrid Lund is a Copenhagen-based Nordic Pop artist with strong regional presence across Denmark, Sweden, and Norway. Borderline on follower growth (14%, just under 15% threshold). Sigrid trajectory match at 72% is promising but she needs to break outside the Nordic bubble. Deep dive should focus on identifying a UK/US crossover catalyst.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "astridlund",
    tiktok_handle: "astridlund",
    instagram_handle: "astridlund",
    spotify_url: "https://open.spotify.com/artist/3WrFJ7ztbogyGnTHbHJFl2",
  },

  // ── 12. Rio Tanaka ────────────────────────────────────────
  {
    id: "ar-012",
    artist_name: "Rio Tanaka",
    avatar_url: avatar("Rio Tanaka"),
    genre: "J-Pop / City Pop Revival",
    origin_country: "JP",
    pipeline_stage: "flagging",
    rise_probability: 4.8,
    threshold_status: "below",
    flagged_date: "2026-04-08",
    assigned_to: null,
    ghost_curve_match: {
      artist_name: "Fujii Kaze",
      match_pct: 48,
      week_offset: 1,
    },
    growth_velocity: { value: 52, acceleration: 4.8, trend: "accelerating" },
    metrics: {
      spotify_monthly_listeners: 43000,
      spotify_monthly_listeners_delta_pct: 52,
      spotify_follower_growth_mom: 44,
      spotify_save_rate: 8.4,
      tiktok_followers: 28000,
      instagram_followers: 16000,
      social_engagement_rate: 5.2,
      track_completion_rate_30s: 62,
      live_ticket_capacity: null,
      live_sellout_pct: null,
      conversion_alpha: 1.2,
      seven_day_velocity: 28.4,
    },
    trigger_markets: [
      {
        country_code: "JP",
        country_name: "Japan",
        region: "SEA",
        platform: "TikTok",
        position: 6,
        velocity_score: 86,
        is_early_adopter: true,
      },
      {
        country_code: "JP",
        country_name: "Japan",
        region: "SEA",
        platform: "Spotify",
        position: 14,
        velocity_score: 78,
        is_early_adopter: true,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 0,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 5.2,
          save_rate: 8.4,
          completion_rate: 62,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 680,
      distribution: {
        emoji_only: 48,
        casual_praise: 28,
        artist_recognition: 14,
        event_intent: 6,
        purchase_intent: 2,
        collab_request: 2,
      },
      intent_score: 34,
      top_signals: ["シティポップ最高 🎵", "the city pop revival is real"],
    },
    cross_platform: {
      tiktok_to_spotify: 1.2,
      spotify_to_ig_follow: 0.6,
      ig_to_merch: null,
      funnel_health: "weak",
      migration_trend: "steady",
    },
    signability: {
      overall: 44,
      creative: {
        score: 52,
        factors: ["City Pop Revival niche", "Japanese-language only currently"],
      },
      commercial: {
        score: 38,
        factors: [
          "43K ML, well below threshold",
          "Japan-only — no cross-platform migration outside JP",
        ],
      },
      legal_pulse: {
        score: 54,
        factors: ["Publishing status unknown", "Japanese label system complex"],
      },
      three_sixty_upside: {
        score: 34,
        live_pct: 12,
        merch_pct: 14,
        endorsement_pct: 8,
      },
    },
    deal_status: null,
    sparkline_data: [8, 12, 16, 22, 30, 40, 52, 62, 70, 78, 86, 92, 96, 100],
    risk_flags: ["Regional-only: no cross-platform migration outside Japan"],
    ai_narrative:
      "Rio Tanaka is a Tokyo-based J-Pop/City Pop Revival artist with massive velocity (+52% MoM) but from a very low base (43K ML). The City Pop Revival trend is hot on Japanese TikTok but has not migrated internationally. No cross-platform funnel outside Japan. Ghost Curve match below 50%. Monitor velocity for 4-6 more weeks — if international migration appears, escalate to deep dive.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "riotanaka",
    tiktok_handle: "riotanaka",
    instagram_handle: "riotanaka",
    spotify_url: "https://open.spotify.com/artist/6KImCVD70vtIoJWnq6nGn3",
  },

  // ── 13. Camille Duval ─────────────────────────────────────
  {
    id: "ar-013",
    artist_name: "Camille Duval",
    avatar_url: avatar("Camille Duval"),
    genre: "French Pop / Chanson",
    origin_country: "FR",
    pipeline_stage: "validation",
    rise_probability: 8.1,
    threshold_status: "above",
    flagged_date: "2026-02-10",
    assigned_to: "Manos",
    ghost_curve_match: { artist_name: "Angèle", match_pct: 81, week_offset: 8 },
    growth_velocity: { value: 16, acceleration: 0.6, trend: "steady" },
    metrics: {
      spotify_monthly_listeners: 201000,
      spotify_monthly_listeners_delta_pct: 16,
      spotify_follower_growth_mom: 17,
      spotify_save_rate: 15.2,
      tiktok_followers: 68000,
      instagram_followers: 82000,
      social_engagement_rate: 7.4,
      track_completion_rate_30s: 74,
      live_ticket_capacity: 400,
      live_sellout_pct: 90,
      conversion_alpha: 4.6,
      seven_day_velocity: 10.4,
    },
    trigger_markets: [
      {
        country_code: "FR",
        country_name: "France",
        region: "DACH",
        platform: "Spotify",
        position: 2,
        velocity_score: 90,
        is_early_adopter: true,
      },
      {
        country_code: "BE",
        country_name: "Belgium",
        region: "DACH",
        platform: "Spotify",
        position: 7,
        velocity_score: 80,
        is_early_adopter: true,
      },
      {
        country_code: "CA",
        country_name: "Canada",
        region: "US",
        platform: "Spotify",
        position: 18,
        velocity_score: 66,
        is_early_adopter: false,
      },
      {
        country_code: "CH",
        country_name: "Switzerland",
        region: "DACH",
        platform: "TikTok",
        position: 22,
        velocity_score: 58,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Acoustic",
      best_format_engagement_lift: 24,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 6.0,
          save_rate: 12.8,
          completion_rate: 70,
        },
        {
          format: "Acoustic",
          engagement_rate: 7.4,
          save_rate: 15.2,
          completion_rate: 74,
        },
        {
          format: "Live",
          engagement_rate: 6.8,
          save_rate: 13.6,
          completion_rate: 72,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 4120,
      distribution: {
        emoji_only: 20,
        casual_praise: 22,
        artist_recognition: 26,
        event_intent: 16,
        purchase_intent: 8,
        collab_request: 8,
      },
      intent_score: 76,
      top_signals: [
        "la nouvelle Angèle 🇫🇷",
        "need the acoustic album",
        "Montreal show sold out??",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 4.6,
      spotify_to_ig_follow: 2.8,
      ig_to_merch: 0.8,
      funnel_health: "strong",
      migration_trend: "steady",
    },
    signability: {
      overall: 82,
      creative: {
        score: 86,
        factors: [
          "Exceptional songwriter",
          "Unreleased test: 68% chorus completion",
          "Bilingual French/English potential",
        ],
      },
      commercial: {
        score: 80,
        factors: ["201K ML", "Francophone corridor: FR→BE→CA→CH"],
      },
      legal_pulse: {
        score: 84,
        factors: [
          "Publishing clean",
          "Manager: Paris agency with Sony history",
        ],
      },
      three_sixty_upside: {
        score: 76,
        live_pct: 18,
        merch_pct: 20,
        endorsement_pct: 16,
      },
    },
    deal_status: null,
    sparkline_data: [52, 56, 60, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84],
    risk_flags: [],
    ai_narrative:
      "Camille Duval is a Paris-based French Pop artist with the strongest unreleased test results after Eloise Park — 68% chorus completion rate on snippet A/B test. Her Angèle trajectory match at 81% maps the Francophone corridor precisely. Studio session window opening next week in Paris. Producer matching in progress. Ear test with Manos (EVP Columbia) underway.",
    unreleased_test: { score: 68, label: "Passed" },
    source_platform: "tiktok",
    source_handle: "camilleduval",
    tiktok_handle: "camilleduval",
    instagram_handle: "camilleduval",
    spotify_url: "https://open.spotify.com/artist/3IW7ScrzXmPvZhB27hmfgy",
  },

  // ── 14. Dex Monroe — Legal risk ───────────────────────────
  {
    id: "ar-014",
    artist_name: "Dex Monroe",
    avatar_url: avatar("Dex Monroe"),
    genre: "UK Drill / Rap",
    origin_country: "GB",
    pipeline_stage: "execution",
    rise_probability: 7.8,
    threshold_status: "above",
    flagged_date: "2026-01-22",
    assigned_to: "Justin Eshak",
    ghost_curve_match: {
      artist_name: "Central Cee",
      match_pct: 69,
      week_offset: 10,
    },
    growth_velocity: { value: 11, acceleration: 0.2, trend: "steady" },
    metrics: {
      spotify_monthly_listeners: 256000,
      spotify_monthly_listeners_delta_pct: 11,
      spotify_follower_growth_mom: 14,
      spotify_save_rate: 11.8,
      tiktok_followers: 86000,
      instagram_followers: 112000,
      social_engagement_rate: 6.4,
      track_completion_rate_30s: 66,
      live_ticket_capacity: 600,
      live_sellout_pct: 78,
      conversion_alpha: 3.4,
      seven_day_velocity: 7.2,
    },
    trigger_markets: [
      {
        country_code: "GB",
        country_name: "United Kingdom",
        region: "UK",
        platform: "Spotify",
        position: 6,
        velocity_score: 86,
        is_early_adopter: true,
      },
      {
        country_code: "IE",
        country_name: "Ireland",
        region: "UK",
        platform: "TikTok",
        position: 12,
        velocity_score: 72,
        is_early_adopter: true,
      },
      {
        country_code: "NL",
        country_name: "Netherlands",
        region: "DACH",
        platform: "Spotify",
        position: 28,
        velocity_score: 56,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 10,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 6.4,
          save_rate: 11.8,
          completion_rate: 66,
        },
        {
          format: "Sped Up",
          engagement_rate: 5.8,
          save_rate: 10.2,
          completion_rate: 60,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 5280,
      distribution: {
        emoji_only: 30,
        casual_praise: 22,
        artist_recognition: 20,
        event_intent: 16,
        purchase_intent: 6,
        collab_request: 6,
      },
      intent_score: 68,
      top_signals: [
        "hardest in the UK rn",
        "need him at Wireless",
        "Central Cee collab would break the internet",
      ],
    },
    cross_platform: {
      tiktok_to_spotify: 3.4,
      spotify_to_ig_follow: 2.2,
      ig_to_merch: 0.8,
      funnel_health: "moderate",
      migration_trend: "steady",
    },
    signability: {
      overall: 72,
      creative: {
        score: 76,
        factors: [
          "Strong bars",
          "Consistent output",
          "UK drill audience loyal",
        ],
      },
      commercial: {
        score: 78,
        factors: [
          "256K ML",
          "UK #6 Spotify",
          "Ireland + Netherlands expansion",
        ],
      },
      legal_pulse: {
        score: 52,
        factors: [
          "RISK: Prior publishing deal with indie label",
          "Clearance estimated 6-8 weeks",
          "Sample in lead single needs audit",
        ],
      },
      three_sixty_upside: {
        score: 74,
        live_pct: 20,
        merch_pct: 22,
        endorsement_pct: 16,
      },
    },
    deal_status: {
      tier: "development",
      advance_range: [75000, 125000],
      terms: "1 Firm + 3 Options",
      three_sixty_clauses: { live: 12, merch: 18, endorsements: 15 },
      projected_irr: 11.2,
      sign_off_chain: [
        { role: "A&R Council", status: "approved" },
        { role: "Business Affairs / Legal", status: "approved" },
        { role: "SVP Finance", status: "pending" },
        { role: "Label Chairman (Ron Perry)", status: "not_started" },
      ],
    },
    sparkline_data: [58, 62, 64, 66, 68, 70, 72, 74, 74, 76, 76, 78, 78, 80],
    risk_flags: [
      "Prior publishing deal with indie label — clearance 6-8 weeks",
      "Sample in lead single needs audit",
    ],
    ai_narrative:
      "Dex Monroe is a London-based UK Drill artist in execution stage with a development deal at $75K-$125K. A&R Council and Business Affairs have approved, pending SVP Finance sign-off. PRIMARY RISK: Prior publishing deal with an indie label creates 6-8 week clearance latency. Business Affairs is negotiating accelerated clearance. Secondary risk: sample in lead single needs clearance audit.",
    unreleased_test: { score: 64, label: "Passed" },
    source_platform: "tiktok",
    source_handle: "dexmonroe",
    tiktok_handle: "dexmonroe",
    instagram_handle: "dexmonroe",
    spotify_url: "https://open.spotify.com/artist/2CIMQHirSU0MQqyYHq0eOx",
  },

  // ── 15. Noa Reyes — Stalling ──────────────────────────────
  {
    id: "ar-015",
    artist_name: "Noa Reyes",
    avatar_url: avatar("Noa Reyes"),
    genre: "Reggaeton",
    origin_country: "PR",
    pipeline_stage: "assessment",
    rise_probability: 2.3,
    threshold_status: "below",
    flagged_date: "2026-02-25",
    assigned_to: null,
    ghost_curve_match: null,
    growth_velocity: { value: 8, acceleration: -1.4, trend: "decelerating" },
    metrics: {
      spotify_monthly_listeners: 55000,
      spotify_monthly_listeners_delta_pct: 8,
      spotify_follower_growth_mom: 6,
      spotify_save_rate: 5.4,
      tiktok_followers: 16000,
      instagram_followers: 24000,
      social_engagement_rate: 3.2,
      track_completion_rate_30s: 48,
      live_ticket_capacity: 100,
      live_sellout_pct: 45,
      conversion_alpha: 0.4,
      seven_day_velocity: 2.8,
    },
    trigger_markets: [
      {
        country_code: "PR",
        country_name: "Puerto Rico",
        region: "LatAm",
        platform: "Spotify",
        position: 22,
        velocity_score: 38,
        is_early_adopter: false,
      },
    ],
    format_alpha: {
      best_format: "Original",
      best_format_engagement_lift: 0,
      formats_tested: [
        {
          format: "Original",
          engagement_rate: 3.2,
          save_rate: 5.4,
          completion_rate: 48,
        },
        {
          format: "Sped Up",
          engagement_rate: 2.8,
          save_rate: 4.2,
          completion_rate: 42,
        },
      ],
    },
    comment_intent: {
      total_analyzed: 420,
      distribution: {
        emoji_only: 68,
        casual_praise: 18,
        artist_recognition: 8,
        event_intent: 4,
        purchase_intent: 1,
        collab_request: 1,
      },
      intent_score: 18,
      top_signals: ["🔥"],
    },
    cross_platform: {
      tiktok_to_spotify: 0.4,
      spotify_to_ig_follow: 0.2,
      ig_to_merch: null,
      funnel_health: "broken",
      migration_trend: "declining",
    },
    signability: {
      overall: 26,
      creative: {
        score: 32,
        factors: [
          "Generic sound, no differentiator",
          "48% completion — below 60% threshold",
        ],
      },
      commercial: {
        score: 22,
        factors: [
          "55K ML, stalling growth",
          "3.2% engagement well below threshold",
          "No cross-platform migration",
        ],
      },
      legal_pulse: {
        score: 34,
        factors: ["Publishing status unclear", "No professional management"],
      },
      three_sixty_upside: {
        score: 18,
        live_pct: 10,
        merch_pct: 10,
        endorsement_pct: 8,
      },
    },
    deal_status: null,
    sparkline_data: [48, 50, 52, 52, 50, 48, 44, 40, 36, 32, 30, 28, 26, 24],
    risk_flags: [
      "Growth stalling — Vg negative for 4 weeks",
      "Conversion alpha 0.4% — bottom of pipeline",
    ],
    ai_narrative:
      "Noa Reyes is a San Juan-based Reggaeton artist whose metrics have deteriorated over the past 4 weeks. Growth Velocity Vg turned negative. Conversion Alpha at 0.4% is the lowest in the pipeline. Comment intent is 68% emoji-only — no meaningful engagement signals. Track completion at 48% is below the 60% threshold. Recommend removing from active pipeline and returning to passive monitoring.",
    unreleased_test: null,
    source_platform: "tiktok",
    source_handle: "noareyespr",
    tiktok_handle: "noareyespr",
    instagram_handle: "noareyespr",
    spotify_url: "https://open.spotify.com/artist/0Y5tJX1MQlPlqiwlOH1tJY",
  },
];

/* ─── Decision Points ─────────────────────────────────────── */

export const MOCK_AR_DECISION_POINTS: ARDecisionPoint[] = [
  {
    category: "SCALE_NOW",
    artist_name: "Luna Voss",
    avatar_url: null,
    signal:
      "Ghost Curve tracking Tyla wk-4 at 91%. Growth Velocity Vg accelerating 3 consecutive weeks. Trigger Market Alpha firing Lagos + Accra, London crossover emerging.",
    decision:
      "Fast-track to A&R Director ear test. If validated, prepare Development offer dossier by Friday Council meeting.",
    urgency: "now",
    evidence: [
      { label: "Rise Probability", value: "9.7", color: "#30D158" },
      { label: "Save Rate", value: "14.2%", color: "#30D158" },
      { label: "Completion", value: "72%", color: "#30D158" },
      { label: "Migration", value: "4.2%", color: "#0A84FF" },
    ],
  },
  {
    category: "REALLOCATE",
    artist_name: null,
    avatar_url: null,
    signal:
      "3 scouts allocated to DACH region have flagged 0 prospects above threshold in 8 weeks. SEA trigger markets (Manila, Jakarta) showing 4x the early-adopter signal density.",
    decision:
      "Move 2 scouts from DACH to SEA coverage. Maintain 1 scout for Berlin hyperpop monitoring (Felix Adler watchlist).",
    urgency: "today",
    evidence: [
      { label: "DACH Hit Rate", value: "0%", color: "#FF453A" },
      { label: "SEA Signal Density", value: "4.2x", color: "#30D158" },
      { label: "Scout Utilization", value: "Imbalanced", color: "#FFD60A" },
    ],
  },
  {
    category: "PIPELINE",
    artist_name: "Camille Duval",
    avatar_url: null,
    signal:
      "Unreleased snippet A/B test returned 68% completion rate on chorus hook. Studio session window opens next week in Paris. Producer matching in progress.",
    decision:
      "Lock studio dates May 5-7. Run bot-scrubbed listening party at 500 seeds. Prepare format test matrix.",
    urgency: "this_week",
    evidence: [
      { label: "Completion Rate", value: "68%", color: "#30D158" },
      { label: "Format Alpha", value: "Acoustic +24%", color: "#0A84FF" },
      { label: "Producer Match", value: "Available May 2-9", color: "#BF5AF2" },
    ],
  },
  {
    category: "GREENLIGHT_READY",
    artist_name: "Eloise Park",
    avatar_url: null,
    signal:
      "Shadow P&L projects 12.8% IRR over 5 years on $425K viral breakout advance. Metadata pre-cleared. Publishing clean. Dossier complete.",
    decision:
      "Route to A&R Council for Monday vote. If approved, Business Affairs and SVP Finance sign-off before Chairman review.",
    urgency: "today",
    evidence: [
      { label: "Shadow P&L IRR", value: "12.8%", color: "#30D158" },
      { label: "Advance", value: "$425K", color: "#BF5AF2" },
      { label: "Terms", value: "1F + 2O", color: "#0A84FF" },
      { label: "Publishing", value: "Clean", color: "#30D158" },
    ],
  },
  {
    category: "RISK",
    artist_name: "Felix Adler",
    avatar_url: null,
    signal:
      "22% listener anomaly from suspicious IP clusters in Frankfurt. Bot detection confidence: HIGH. Additionally, Dex Monroe prior publishing deal creates 6-8 week clearance latency.",
    decision:
      "Quarantine Felix Adler metrics pending scrub. For Dex Monroe, escalate to Business Affairs for accelerated clearance negotiation.",
    urgency: "now",
    evidence: [
      { label: "Bot Flag", value: "22%", color: "#FF453A" },
      { label: "IP Cluster", value: "Frankfurt", color: "#FF453A" },
      { label: "Clearance", value: "6-8 weeks", color: "#FFD60A" },
    ],
  },
];

/* ─── Council Briefing Text ───────────────────────────────── */

export function generateCouncilBriefing(): {
  greeting: string;
  pulse: string;
  detail: string;
} {
  const positiveVg = MOCK_AR_PROSPECTS.filter(
    (p) => p.growth_velocity.trend !== "decelerating",
  ).length;
  const total = MOCK_AR_PROSPECTS.length;
  const greenlightReady = MOCK_AR_PROSPECTS.filter(
    (p) => p.deal_status !== null,
  ).length;
  const botFlags = MOCK_AR_PROSPECTS.filter((p) =>
    p.risk_flags.some((f) => f.toLowerCase().includes("bot")),
  ).length;

  return {
    greeting: "Good morning, Council.",
    pulse: `Your pipeline holds ${total} active prospects across 5 stages. Growth Velocity is positive across ${positiveVg} of ${total} — the strongest week since Q1. Luna Voss is your headline: Rise Probability 9.7, Ghost Curve tracking Tyla at week-4 with 91% match. Trigger Market Alpha firing from Lagos and Accra with London crossover emerging.`,
    detail: `${greenlightReady} prospects are greenlight-ready with complete dossiers. ${botFlags} bot anomaly requires quarantine. 3 deals in sign-off chain. 5 decisions need your call today, including 2 that should not wait past this meeting.`,
  };
}

/* ─── Pipeline Stage Distribution ─────────────────────────── */

export function getPipelineDistribution(): Record<string, number> {
  const dist: Record<string, number> = {
    flagging: 0,
    deep_dive: 0,
    assessment: 0,
    validation: 0,
    execution: 0,
  };
  for (const p of MOCK_AR_PROSPECTS) {
    dist[p.pipeline_stage]++;
  }
  return dist;
}

/* ─── Helpers ─────────────────────────────────────────────── */

export function getProspectById(id: string): ARProspect | undefined {
  return MOCK_AR_PROSPECTS.find((p) => p.id === id);
}

export function filterByStage(stage: string): ARProspect[] {
  if (stage === "all") return MOCK_AR_PROSPECTS;
  if (stage === "risk")
    return MOCK_AR_PROSPECTS.filter((p) => p.risk_flags.length > 0);
  return MOCK_AR_PROSPECTS.filter((p) => p.pipeline_stage === stage);
}

export function sortProspects(
  prospects: ARProspect[],
  key:
    | "rise_probability"
    | "seven_day_velocity"
    | "signability"
    | "ghost_curve"
    | "stage",
  desc = true,
): ARProspect[] {
  const sorted = [...prospects].sort((a, b) => {
    switch (key) {
      case "rise_probability":
        return a.rise_probability - b.rise_probability;
      case "seven_day_velocity":
        return a.metrics.seven_day_velocity - b.metrics.seven_day_velocity;
      case "signability":
        return a.signability.overall - b.signability.overall;
      case "ghost_curve":
        return (
          (a.ghost_curve_match?.match_pct ?? 0) -
          (b.ghost_curve_match?.match_pct ?? 0)
        );
      case "stage": {
        const order = {
          flagging: 0,
          deep_dive: 1,
          assessment: 2,
          validation: 3,
          execution: 4,
        };
        return (order[a.pipeline_stage] ?? 0) - (order[b.pipeline_stage] ?? 0);
      }
      default:
        return 0;
    }
  });
  return desc ? sorted.reverse() : sorted;
}
