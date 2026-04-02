import { useState } from "react";
import type { SoundAnalysis } from "@/types/soundIntelligence";
import SoundHeader from "@/components/sound-intelligence/SoundHeader";
import SoundHealthStrip from "@/components/sound-intelligence/SoundHealthStrip";
import HeroStatsRow from "@/components/sound-intelligence/HeroStatsRow";
import VelocityChart from "@/components/sound-intelligence/VelocityChart";
import WinnerCard from "@/components/sound-intelligence/WinnerCard";
import FormatTrendsChart from "@/components/sound-intelligence/FormatTrendsChart";
import FormatBreakdownTable from "@/components/sound-intelligence/FormatBreakdownTable";
import HookDurationSection from "@/components/sound-intelligence/HookDurationSection";
import TopPerformersGrid from "@/components/sound-intelligence/TopPerformersGrid";
import CreatorTiersSection from "@/components/sound-intelligence/CreatorTiersSection";
import GeoSpreadSection from "@/components/sound-intelligence/GeoSpreadSection";
import LifecycleCard from "@/components/sound-intelligence/LifecycleCard";
import AxisBrowser from "@/components/sound-intelligence/AxisBrowser";
import PostingHoursChart from "@/components/sound-intelligence/PostingHoursChart";

/* ─── Generate 14-day velocity with realistic curve ─── */
function makeVelocity() {
  const days: { date: string; videos: number; avg_views: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(2026, 2, 18 + i);
    days.push({
      date: d.toISOString().slice(0, 10),
      videos: Math.round(3200 + Math.sin(i * 0.7) * 1800 + i * 420),
      avg_views: Math.round(14000 + Math.sin(i * 0.5) * 6000 + i * 1200),
    });
  }
  return days;
}

function makeDailySparkline(count: number, base: number, wave: number) {
  return Array.from({ length: count }, (_, i) =>
    Math.round(base + Math.sin(i * 0.6) * wave + i * (base * 0.02)),
  );
}

/* ─── Mock SoundAnalysis ─── */
const MOCK_ANALYSIS: SoundAnalysis = {
  sound_url: "https://www.tiktok.com/music/American-Girls-7598271658722576401",
  cover_url: "/mock-cover-american-girls.png",
  track_name: "American Girls",
  artist_name: "Harry Styles",
  album_name: "Kiss All The Disco Occasionally Time",
  status: "accelerating",
  created_at: "2026-03-18T10:00:00Z",
  last_scan: "2026-04-01T14:30:00Z",
  last_refresh_at: "2026-04-01T14:30:00Z",
  refresh_count: 4,
  videos_analyzed: 110000,
  total_videos_on_sound: 110000,
  total_views: 1_840_000_000,
  avg_share_rate: 0.034,
  actual_share_rate: 0.028,
  avg_duration_seconds: 20,
  peak_day: "2026-03-28",
  peak_day_count: 8420,
  weekly_delta_videos: 8200,
  weekly_delta_views_pct: 18.4,
  posting_hours: [
    12, 8, 5, 3, 2, 2, 4, 8, 14, 22, 34, 48, 62, 71, 78, 82, 76, 68, 58, 52, 44,
    36, 28, 18,
  ],

  velocity: makeVelocity(),

  formats: [
    {
      name: "Lip Sync / Dance",
      video_count: 51700,
      pct_of_total: 47,
      avg_views: 18400,
      share_rate: 3.4,
      actual_share_rate: 2.8,
      verdict: "SCALE",
      daily: makeDailySparkline(14, 3700, 800),
      posting_hours: [
        8, 6, 3, 2, 1, 1, 3, 6, 10, 18, 28, 38, 50, 58, 64, 68, 62, 55, 46, 42,
        36, 28, 22, 14,
      ],
      songBars: [62, 8, 12, 6, 4, 3, 2, 3],
      hooks: {
        face_pct: 82,
        snippet: "0:00–0:08",
        snippet_pct: 65,
        top_hooks: ["Intro hook + face", "Chorus drop sync"],
      },
      topVideos: [
        {
          handle: "sarahkayemm",
          why: "this song gets me every time",
          views: "2.4M",
          share: "14.2%",
          video_url: "https://www.tiktok.com/@sarahkayemm",
        },
        {
          handle: "dancewithlena",
          why: "choreography vid",
          views: "740K",
          share: "12.3%",
          video_url: "https://www.tiktok.com/@dancewithlena",
        },
        {
          handle: "marcusblvck",
          why: "#fyp #harrystyles",
          views: "1.2M",
          share: "9.4%",
          video_url: "https://www.tiktok.com/@marcusblvck",
        },
      ],
      insight:
        "Lip Sync / Dance dominates with 47% share. Engagement 11.2% is above platform avg. Strong hook at 0:00–0:08 drives 65% of top performers.",
      top_niches: [
        { name: "Casual / Social", count: 19800 },
        { name: "Fashion / Style", count: 7300 },
      ],
      top_intents: [
        { name: "organic", count: 36900 },
        { name: "paid", count: 7300 },
      ],
      dominant_vibe: "Chill / Aesthetic",
    },
    {
      name: "Aesthetic Edit",
      video_count: 18700,
      pct_of_total: 17,
      avg_views: 8200,
      share_rate: 4.2,
      actual_share_rate: 3.6,
      verdict: "SCALE",
      daily: makeDailySparkline(14, 1350, 400),
      posting_hours: [
        10, 7, 4, 2, 1, 1, 2, 5, 8, 14, 22, 32, 42, 48, 52, 56, 50, 44, 38, 34,
        28, 22, 16, 12,
      ],
      songBars: [28, 42, 10, 8, 4, 4, 2, 2],
      hooks: {
        face_pct: 34,
        snippet: "0:47–0:55",
        snippet_pct: 48,
        top_hooks: ["Chorus hit + aesthetic transition"],
      },
      topVideos: [
        {
          handle: "emilyrosetravel",
          why: "London sunsets hit different",
          views: "890K",
          share: "16.1%",
        },
        {
          handle: "theclosetfiles",
          why: "outfit change transition",
          views: "380K",
          share: "15.2%",
        },
      ],
      insight:
        "Aesthetic Edit is the fastest-growing format (+62% WoW). Higher engagement than Lip Sync despite lower volume.",
      top_niches: [
        { name: "Travel / Adventure", count: 4500 },
        { name: "Fashion / Style", count: 3800 },
      ],
      dominant_vibe: "Chill / Aesthetic",
    },
    {
      name: "Slideshow",
      video_count: 14300,
      pct_of_total: 13,
      avg_views: 6100,
      share_rate: 2.2,
      actual_share_rate: 1.8,
      verdict: "SCALE",
      daily: makeDailySparkline(14, 1000, 300),
      songBars: [18, 14, 22, 16, 12, 8, 6, 4],
      hooks: {
        face_pct: 22,
        snippet: "0:00–0:08",
        snippet_pct: 38,
        top_hooks: ["Text + photo montage"],
      },
      topVideos: [
        {
          handle: "olivia.styles.fan",
          why: "lyric overlay edit",
          views: "520K",
          share: "8.9%",
        },
      ],
      insight:
        "Slideshow format is steady. Lower engagement but high volume — easy to produce.",
    },
    {
      name: "Montage",
      video_count: 7700,
      pct_of_total: 7,
      avg_views: 4900,
      share_rate: 2.8,
      verdict: "EMERGING",
      daily: makeDailySparkline(14, 570, 180),
      songBars: [14, 10, 18, 22, 16, 8, 6, 6],
      hooks: {
        face_pct: 44,
        snippet: "0:00–0:08",
        snippet_pct: 42,
        top_hooks: ["Quick cuts + beat sync"],
      },
      topVideos: [
        {
          handle: "fitwithjess",
          why: "gym transition edit",
          views: "410K",
          share: "13.4%",
        },
      ],
      insight:
        "Montage growing fast in Fitness niche. 9.1% engagement, well above platform average.",
      top_niches: [{ name: "Fitness / Gym", count: 2800 }],
    },
    {
      name: "Comedy",
      video_count: 5500,
      pct_of_total: 5,
      avg_views: 22100,
      share_rate: 2.6,
      verdict: "EMERGING",
      daily: makeDailySparkline(14, 430, 140),
      songBars: [8, 6, 12, 18, 24, 14, 10, 8],
      hooks: {
        face_pct: 88,
        snippet: "0:00–0:08",
        snippet_pct: 72,
        top_hooks: ["POV setup + punchline"],
      },
      topVideos: [
        {
          handle: "itsjojosiwa_fan",
          why: "POV: you hear this at target",
          views: "1.8M",
          share: "11.8%",
        },
      ],
      insight:
        "Comedy has the HIGHEST avg views (22.1K) of any format. Small volume but viral potential is massive.",
    },
    {
      name: "Concert",
      video_count: 4400,
      pct_of_total: 4,
      avg_views: 3200,
      share_rate: 1.9,
      verdict: "EMERGING",
      daily: makeDailySparkline(14, 285, 100),
      songBars: [6, 8, 14, 18, 22, 16, 10, 6],
      hooks: {
        face_pct: 12,
        snippet: "0:47–0:55",
        snippet_pct: 34,
        top_hooks: ["Crowd reaction at chorus"],
      },
      topVideos: [
        {
          handle: "harry.daily.updates",
          why: "concert fancam compilation",
          views: "340K",
          share: "7.6%",
        },
      ],
      insight:
        "Concert content grows around tour dates. Low engagement but high emotional resonance.",
    },
    {
      name: "Tutorial",
      video_count: 3300,
      pct_of_total: 3,
      avg_views: 5800,
      share_rate: 3.6,
      verdict: "EMERGING",
      daily: makeDailySparkline(14, 215, 70),
      songBars: [10, 8, 14, 18, 20, 14, 10, 6],
      hooks: {
        face_pct: 68,
        snippet: "0:00–0:08",
        snippet_pct: 56,
        top_hooks: ["Step-by-step intro hook"],
      },
      topVideos: [
        {
          handle: "nickfromtexas",
          why: "car cruising aesthetic",
          views: "680K",
          share: "18.7%",
        },
      ],
      insight:
        "Tutorial has the second-highest engagement rate (12.1%). Niche but sticky.",
    },
  ],

  winner: {
    format: "Lip Sync / Dance",
    multiplier: 2.4,
    video_count: 51700,
    avg_views: 18400,
    share_rate: 3.4,
    actual_share_rate: 2.8,
    recommendation:
      "Lip Sync / Dance is your strongest format with 2.4x the engagement of the average. Lean into the 0:00–0:08 hook window with face-forward content.",
  },

  hook_analysis: {
    face_pct: 78,
    face_multiplier: 1.8,
    text_hook_pct: 64,
    top_hooks: [
      "Intro lip sync with face at 0:00",
      "Chorus hit at 0:47",
      "Text overlay + aesthetic transition",
    ],
    optimal_snippet: "0:00–0:08",
    snippet_appearance_pct: 62,
  },

  duration: {
    top10_avg: 16,
    bottom10_avg: 38,
    insight:
      "Top performers average 16 seconds — short, punchy clips using the intro hook. Longer videos (35s+) underperform by 3.2x.",
  },

  top_videos: [
    {
      rank: 1,
      creator: "sarahkayemm",
      format: "Lip Sync / Dance",
      why: "this song gets me every time",
      views: "2.4M",
      share_rate: "14.2%",
      url: "https://www.tiktok.com/@sarahkayemm",
      niche: "Casual / Social",
      intent: "organic",
      vibe: "Emotional",
    },
    {
      rank: 2,
      creator: "itsjojosiwa_fan",
      format: "Comedy",
      why: "POV: you hear this at target",
      views: "1.8M",
      share_rate: "11.8%",
      url: "https://www.tiktok.com/@itsjojosiwa_fan",
      niche: "Casual / Social",
      intent: "organic",
      vibe: "Playful",
    },
    {
      rank: 3,
      creator: "marcusblvck",
      format: "Lip Sync / Dance",
      why: "#fyp #harrystyles",
      views: "1.2M",
      share_rate: "9.4%",
      url: "https://www.tiktok.com/@marcusblvck",
      niche: "Fashion / Style",
      intent: "organic",
      vibe: "Confident",
    },
    {
      rank: 4,
      creator: "emilyrosetravel",
      format: "Aesthetic Edit",
      why: "London sunsets hit different",
      views: "890K",
      share_rate: "16.1%",
      url: "https://www.tiktok.com/@emilyrosetravel",
      niche: "Travel / Adventure",
      intent: "organic",
      vibe: "Chill",
    },
    {
      rank: 5,
      creator: "dancewithlena",
      format: "Lip Sync / Dance",
      why: "choreography vid",
      views: "740K",
      share_rate: "12.3%",
      url: "https://www.tiktok.com/@dancewithlena",
      niche: "Casual / Social",
      intent: "paid",
      vibe: "Hype",
    },
    {
      rank: 6,
      creator: "nickfromtexas",
      format: "Tutorial",
      why: "car cruising aesthetic",
      views: "680K",
      share_rate: "18.7%",
      url: "https://www.tiktok.com/@nickfromtexas",
      niche: "Car Culture",
      intent: "organic",
      vibe: "Chill",
    },
    {
      rank: 7,
      creator: "olivia.styles.fan",
      format: "Slideshow",
      why: "lyric overlay edit",
      views: "520K",
      share_rate: "8.9%",
      url: "https://www.tiktok.com/@olivia.styles.fan",
      niche: "Music / Song",
      intent: "fan_account",
      vibe: "Emotional",
    },
    {
      rank: 8,
      creator: "fitwithjess",
      format: "Montage",
      why: "gym transition edit",
      views: "410K",
      share_rate: "13.4%",
      url: "https://www.tiktok.com/@fitwithjess",
      niche: "Fitness / Gym",
      intent: "organic",
      vibe: "Confident",
    },
    {
      rank: 9,
      creator: "theclosetfiles",
      format: "Aesthetic Edit",
      why: "outfit change transition",
      views: "380K",
      share_rate: "15.2%",
      url: "https://www.tiktok.com/@theclosetfiles",
      niche: "Fashion / Style",
      intent: "organic",
      vibe: "Chill",
    },
    {
      rank: 10,
      creator: "harry.daily.updates",
      format: "Concert",
      why: "concert fancam compilation",
      views: "340K",
      share_rate: "7.6%",
      url: "https://www.tiktok.com/@harry.daily.updates",
      niche: "Music / Song",
      intent: "fan_account",
      vibe: "Hype",
    },
  ],

  creator_tiers: [
    {
      tier: "Nano",
      range: "1K–10K",
      count: 680,
      pct: 54,
      avg_views: 4200,
      avg_share_rate: 0.042,
      daily: makeDailySparkline(14, 48, 16),
      firstPostDay: "2026-03-18",
      peakDay: "2026-03-28",
      daysActive: 14,
      topFormats: [
        { name: "Lip Sync / Dance", pct: 52 },
        { name: "Slideshow", pct: 18 },
      ],
      topCreators: [
        {
          handle: "olivia.styles.fan",
          followers: "8.2K",
          views: "520K",
          share: "8.9%",
        },
      ],
      insight:
        "Nano creators drive the most organic content — high authenticity signal.",
    },
    {
      tier: "Micro",
      range: "10K–50K",
      count: 320,
      pct: 26,
      avg_views: 12800,
      avg_share_rate: 0.036,
      daily: makeDailySparkline(14, 22, 8),
      firstPostDay: "2026-03-19",
      peakDay: "2026-03-27",
      daysActive: 13,
      topFormats: [
        { name: "Lip Sync / Dance", pct: 44 },
        { name: "Aesthetic Edit", pct: 22 },
      ],
      topCreators: [
        {
          handle: "theclosetfiles",
          followers: "34K",
          views: "380K",
          share: "15.2%",
        },
      ],
      insight:
        "Micro tier is the sweet spot — highest ROI for seeding campaigns.",
    },
    {
      tier: "Mid",
      range: "50K–500K",
      count: 180,
      pct: 14,
      avg_views: 28400,
      avg_share_rate: 0.031,
      daily: makeDailySparkline(14, 12, 5),
      firstPostDay: "2026-03-20",
      peakDay: "2026-03-26",
      daysActive: 12,
      topFormats: [
        { name: "Lip Sync / Dance", pct: 38 },
        { name: "Comedy", pct: 16 },
      ],
      topCreators: [
        {
          handle: "dancewithlena",
          followers: "280K",
          views: "740K",
          share: "12.3%",
        },
      ],
      insight:
        "Mid-tier adoption up 41% this week. Signal of mainstream breakout.",
    },
    {
      tier: "Macro",
      range: "500K–1M",
      count: 52,
      pct: 4,
      avg_views: 86000,
      avg_share_rate: 0.024,
      daily: makeDailySparkline(14, 3, 2),
      firstPostDay: "2026-03-22",
      peakDay: "2026-03-28",
      daysActive: 10,
      topFormats: [
        { name: "Comedy", pct: 32 },
        { name: "Lip Sync / Dance", pct: 28 },
      ],
      topCreators: [
        {
          handle: "sarahkayemm",
          followers: "720K",
          views: "2.4M",
          share: "14.2%",
        },
      ],
      insight:
        "Macro creators brought the viral moments. sarahkayemm's video hit 2.4M.",
    },
    {
      tier: "Mega",
      range: "1M+",
      count: 15,
      pct: 2,
      avg_views: 340000,
      avg_share_rate: 0.018,
      daily: makeDailySparkline(14, 1, 1),
      firstPostDay: "2026-03-24",
      peakDay: "2026-03-29",
      daysActive: 8,
      topFormats: [
        { name: "Lip Sync / Dance", pct: 46 },
        { name: "Comedy", pct: 20 },
      ],
      topCreators: [
        {
          handle: "itsjojosiwa_fan",
          followers: "4.2M",
          views: "1.8M",
          share: "11.8%",
        },
      ],
      insight: "Mega creators joined late but drove massive view spikes.",
    },
  ],

  geography: [
    {
      country: "United States",
      flag: "🇺🇸",
      pct: 38,
      daily: makeDailySparkline(14, 120, 40),
      firstPostDay: "2026-03-18",
      peakDay: "2026-03-28",
      daysActive: 14,
      topFormats: [
        { name: "Lip Sync / Dance", pct: 52 },
        { name: "Comedy", pct: 14 },
      ],
      avgViews: "18.4K",
      avgShare: "11.2%",
      insight: "US leads with 38% of total creations.",
    },
    {
      country: "United Kingdom",
      flag: "🇬🇧",
      pct: 18,
      daily: makeDailySparkline(14, 58, 20),
      firstPostDay: "2026-03-18",
      peakDay: "2026-03-27",
      daysActive: 14,
      topFormats: [
        { name: "Aesthetic Edit", pct: 28 },
        { name: "Lip Sync / Dance", pct: 24 },
      ],
      avgViews: "14.2K",
      avgShare: "13.8%",
      insight: "UK over-indexes on Aesthetic Edit content.",
    },
    {
      country: "Brazil",
      flag: "🇧🇷",
      pct: 12,
      daily: makeDailySparkline(14, 38, 18),
      firstPostDay: "2026-03-20",
      peakDay: "2026-03-29",
      daysActive: 12,
      topFormats: [
        { name: "Lip Sync / Dance", pct: 62 },
        { name: "Concert", pct: 12 },
      ],
      avgViews: "8.6K",
      avgShare: "9.4%",
      insight: "Brazil surging +180% WoW. Fastest-growing market.",
    },
    {
      country: "Indonesia",
      flag: "🇮🇩",
      pct: 8,
      daily: makeDailySparkline(14, 26, 12),
      firstPostDay: "2026-03-22",
      peakDay: "2026-03-30",
      daysActive: 10,
      topFormats: [
        { name: "Lip Sync / Dance", pct: 58 },
        { name: "Slideshow", pct: 18 },
      ],
      avgViews: "6.2K",
      avgShare: "7.8%",
      insight: "Indonesia up +95% WoW. Young audience, mobile-first.",
    },
    {
      country: "Turkey",
      flag: "🇹🇷",
      pct: 6,
      daily: makeDailySparkline(14, 18, 8),
      firstPostDay: "2026-03-23",
      peakDay: "2026-03-30",
      daysActive: 9,
      topFormats: [
        { name: "Aesthetic Edit", pct: 34 },
        { name: "Slideshow", pct: 22 },
      ],
      avgViews: "5.1K",
      avgShare: "8.2%",
      insight: "Turkey up +67% WoW. Aesthetic Edit dominant.",
    },
  ],

  lifecycle: {
    current_phase: "Growth",
    days_since_peak: 3,
    current_velocity: 7800,
    insight:
      "As It Was is in active Growth phase — 3 days past peak but velocity remains strong at 7,800 new videos/day. Recommend scaling paid amplification now while organic momentum is high.",
  },

  // v2 classification axes
  niche_distribution: [
    {
      niche: "Casual / Social",
      video_count: 47300,
      pct: 38,
      avg_views: 16200,
      engagement: 11.4,
    },
    {
      niche: "Fashion / Style",
      video_count: 17400,
      pct: 14,
      avg_views: 12800,
      engagement: 14.2,
    },
    {
      niche: "Relationships / Dating",
      video_count: 13700,
      pct: 11,
      avg_views: 14600,
      engagement: 12.8,
    },
    {
      niche: "Travel / Adventure",
      video_count: 9900,
      pct: 8,
      avg_views: 9400,
      engagement: 15.6,
    },
    {
      niche: "Fitness / Gym",
      video_count: 7500,
      pct: 6,
      avg_views: 7200,
      engagement: 13.1,
    },
    {
      niche: "Parenthood / Family",
      video_count: 6200,
      pct: 5,
      avg_views: 8800,
      engagement: 10.2,
    },
    {
      niche: "Music / Song",
      video_count: 5000,
      pct: 4,
      avg_views: 6400,
      engagement: 8.6,
    },
    {
      niche: "Car Culture",
      video_count: 3700,
      pct: 3,
      avg_views: 11200,
      engagement: 16.8,
    },
  ],
  intent_breakdown: [
    {
      intent: "organic",
      video_count: 88400,
      pct: 71,
      avg_views: 14800,
      engagement: 11.2,
    },
    {
      intent: "paid",
      video_count: 17400,
      pct: 14,
      avg_views: 8600,
      engagement: 8.1,
    },
    {
      intent: "fan_account",
      video_count: 11200,
      pct: 9,
      avg_views: 5200,
      engagement: 7.4,
    },
    {
      intent: "artist_official",
      video_count: 7500,
      pct: 6,
      avg_views: 42000,
      engagement: 6.8,
    },
  ],
  song_role_distribution: [
    {
      role: "primary",
      video_count: 78400,
      pct: 63,
      avg_views: 16800,
      engagement: 11.8,
    },
    {
      role: "background",
      video_count: 38600,
      pct: 31,
      avg_views: 8200,
      engagement: 7.4,
    },
    {
      role: "sound_bite",
      video_count: 7500,
      pct: 6,
      avg_views: 22400,
      engagement: 14.2,
    },
  ],
  vibe_distribution: [
    {
      vibe: "Chill",
      video_count: 42300,
      pct: 34,
      avg_views: 12400,
      engagement: 13.6,
    },
    {
      vibe: "Wholesome",
      video_count: 27400,
      pct: 22,
      avg_views: 14200,
      engagement: 11.8,
    },
    {
      vibe: "Confident",
      video_count: 19900,
      pct: 16,
      avg_views: 18600,
      engagement: 10.4,
    },
    {
      vibe: "Emotional",
      video_count: 14900,
      pct: 12,
      avg_views: 16800,
      engagement: 12.2,
    },
    {
      vibe: "Hype",
      video_count: 11200,
      pct: 9,
      avg_views: 21400,
      engagement: 9.8,
    },
    {
      vibe: "Playful",
      video_count: 6200,
      pct: 5,
      avg_views: 22100,
      engagement: 8.7,
    },
    {
      vibe: "Edgy",
      video_count: 2500,
      pct: 2,
      avg_views: 4800,
      engagement: 6.2,
    },
  ],
  creator_demographics: {
    profiles: [
      {
        profile: "Young Adult Female",
        video_count: 67100,
        pct: 54,
        avg_views: 15200,
      },
      { profile: "Teen Female", video_count: 22400, pct: 18, avg_views: 12800 },
      {
        profile: "Young Adult Male",
        video_count: 14900,
        pct: 12,
        avg_views: 18400,
      },
      { profile: "Teen Male", video_count: 7500, pct: 6, avg_views: 9600 },
      { profile: "Adult Female", video_count: 6200, pct: 5, avg_views: 8200 },
      { profile: "Mixed Group", video_count: 3700, pct: 3, avg_views: 24600 },
      { profile: "Adult Male", video_count: 2500, pct: 2, avg_views: 6800 },
    ],
    age_breakdown: [
      { age: "13-17", count: 29900, pct: 24 },
      { age: "18-24", count: 57200, pct: 46 },
      { age: "25-34", count: 24900, pct: 20 },
      { age: "35+", count: 12400, pct: 10 },
    ],
    gender_breakdown: [
      { gender: "Female", count: 95700, pct: 77 },
      { gender: "Male", count: 24900, pct: 20 },
      { gender: "Other / Group", count: 3700, pct: 3 },
    ],
  },
};

/* ─── Render using the REAL components ─── */

export default function SoundIntelligenceMock() {
  const [expandedFormat, setExpandedFormat] = useState<number | null>(null);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);
  const [expandedGeo, setExpandedGeo] = useState<number | null>(null);
  const [disabledTrendLines, setDisabledTrendLines] = useState<Set<string>>(
    new Set(),
  );
  const [nicheFilter, setNicheFilter] = useState<string | null>(null);

  const analysis = MOCK_ANALYSIS;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <SoundHeader analysis={analysis} />
      <SoundHealthStrip analysis={analysis} userCount={110000} />
      <HeroStatsRow analysis={analysis} userCount={110000} />

      <div style={{ display: "flex", gap: 16 }}>
        <VelocityChart
          velocity={analysis.velocity}
          lifecycle={analysis.lifecycle}
        />
        <WinnerCard winner={analysis.winner} />
      </div>

      <AxisBrowser
        formats={analysis.formats}
        nicheDistribution={analysis.niche_distribution}
        vibeDistribution={analysis.vibe_distribution}
        intentBreakdown={analysis.intent_breakdown}
        creatorDemographics={analysis.creator_demographics}
        songRoleDistribution={analysis.song_role_distribution}
        activeNiche={nicheFilter}
        onNicheClick={setNicheFilter}
      />

      <PostingHoursChart postingHours={analysis.posting_hours!} />

      <FormatTrendsChart
        formats={analysis.formats}
        velocity={analysis.velocity}
        disabledLines={disabledTrendLines}
        onToggleLine={(name) =>
          setDisabledTrendLines((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
          })
        }
        onSoloLine={(name) =>
          setDisabledTrendLines((prev) => {
            const allOthers = new Set(
              analysis.formats.map((f) => f.name).filter((n) => n !== name),
            );
            if (
              prev.size === allOthers.size &&
              [...allOthers].every((n) => prev.has(n))
            ) {
              return new Set();
            }
            return allOthers;
          })
        }
      />

      <FormatBreakdownTable
        formats={analysis.formats}
        expandedFormat={expandedFormat}
        onToggle={(i) => setExpandedFormat((prev) => (prev === i ? null : i))}
        songDuration={analysis.avg_duration_seconds}
      />

      <HookDurationSection
        hookAnalysis={analysis.hook_analysis}
        duration={analysis.duration}
      />

      <TopPerformersGrid
        topVideos={analysis.top_videos}
        nicheFilter={nicheFilter}
        onClearNicheFilter={() => setNicheFilter(null)}
      />

      <CreatorTiersSection
        tiers={analysis.creator_tiers}
        expandedTier={expandedTier}
        onToggle={(i) => setExpandedTier((prev) => (prev === i ? null : i))}
      />

      <GeoSpreadSection
        geography={analysis.geography}
        expandedGeo={expandedGeo}
        onToggle={(i) => setExpandedGeo((prev) => (prev === i ? null : i))}
      />

      <LifecycleCard lifecycle={analysis.lifecycle} />
    </div>
  );
}
