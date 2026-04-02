import { Sparkles } from "lucide-react";
import BriefCard from "@/components/fan-briefs/BriefCard";
import type { FanBrief } from "@/types/fanBriefs";

const WARNER_LABEL_ID = "644cb655-3fa3-4f29-b716-d4f1fce3243c";

const MOCK_BRIEFS: FanBrief[] = [
  {
    id: "mock-1",
    artist_handle: "harrystyles",
    artist_id: "mock-artist-1",
    label_id: WARNER_LABEL_ID,
    segment_id: null,
    hook_text:
      "Harry discussed his songwriting process for American Girls on Zane Lowe — 4 key moments extracted. Best clip: 2:14–2:42 where he describes writing the chorus melody in the shower.",
    caption:
      '"I was in the shower and the melody just came to me" — Harry on writing the chorus that defined the album',
    format_recommendation: "Talking Head",
    platform_recommendation: ["TikTok", "Instagram Reels"],
    sound_pairing: "American Girls — Harry Styles",
    why_now:
      "Interview clips with authentic behind-the-scenes moments are 3.2x above avg engagement right now. Nostalgia + vulnerability = highest-performing emotional triggers in comments this week.",
    confidence_score: 94,
    source_url: "https://www.youtube.com/watch?v=H5v3kku4y6Q",
    source_title: "Harry Styles — As It Was (Official Video)",
    timestamp_start: 134,
    timestamp_end: 162,
    youtube_timestamp_url: "https://www.youtube.com/watch?v=H5v3kku4y6Q&t=134",
    clip_storage_url: null,
    clip_duration_seconds: 28,
    rendered_clip_url: null,
    status: "pending",
    approved_by: null,
    approved_at: null,
    modified_hook: null,
    created_at: "2026-04-01T08:00:00Z",
  },
  {
    id: "mock-2",
    artist_handle: "harrystyles",
    artist_id: "mock-artist-1",
    label_id: WARNER_LABEL_ID,
    segment_id: null,
    hook_text:
      'Fan sentiment analysis: "nostalgia" and "summer" are the top emotional triggers in comments this week. 78% of high-engagement videos use warm color grading.',
    caption:
      "Recommended tone: wistful, golden hour aesthetic — this combo is driving 3.2x above avg engagement",
    format_recommendation: "Lyric Overlay",
    platform_recommendation: ["TikTok"],
    sound_pairing: "American Girls — Harry Styles",
    why_now:
      "Lyric Overlay + sunset aesthetic combo is 3.2x above avg engagement. Best when posted between 6-8pm local time. Include text overlay with song lyrics at chorus drop.",
    confidence_score: 91,
    source_url: null,
    source_title: null,
    timestamp_start: null,
    timestamp_end: null,
    youtube_timestamp_url: null,
    clip_storage_url: null,
    clip_duration_seconds: null,
    rendered_clip_url: null,
    status: "pending",
    approved_by: null,
    approved_at: null,
    modified_hook: null,
    created_at: "2026-04-01T08:15:00Z",
  },
  {
    id: "mock-3",
    artist_handle: "harrystyles",
    artist_id: "mock-artist-1",
    label_id: WARNER_LABEL_ID,
    segment_id: null,
    hook_text:
      "O2 Arena concert — 340 fan videos scanned. 12 high-engagement clips identified. Top moment: crowd singing the chorus back, 2.8x avg share rate.",
    caption:
      "The moment 20,000 people sang American Girls back to Harry — pure magic",
    format_recommendation: "Concert",
    platform_recommendation: ["TikTok", "YouTube Shorts"],
    sound_pairing: "American Girls — Harry Styles",
    why_now:
      "Concert fancam content peaks 48-72hrs after live events. This window is optimal — post now before the moment fades.",
    confidence_score: 89,
    source_url: "https://www.youtube.com/watch?v=E07s5ZYadZg",
    source_title: "Harry Styles — Watermelon Sugar (Official Video)",
    timestamp_start: 204,
    timestamp_end: 219,
    youtube_timestamp_url: "https://www.youtube.com/watch?v=E07s5ZYadZg&t=204",
    clip_storage_url: null,
    clip_duration_seconds: 15,
    rendered_clip_url: null,
    status: "pending",
    approved_by: null,
    approved_at: null,
    modified_hook: null,
    created_at: "2026-04-01T09:30:00Z",
  },
  {
    id: "mock-4",
    artist_handle: "harrystyles",
    artist_id: "mock-artist-1",
    label_id: WARNER_LABEL_ID,
    segment_id: null,
    hook_text:
      "Studio session B-roll from the Kiss All The Disco Occasionally Time sessions. Candid moment of Harry at the piano — raw, unpolished, authentic. This type of BTS content drives 2.1x engagement vs produced clips.",
    caption:
      "Behind the scenes of Kiss All The Disco Occasionally Time — the moment before the magic",
    format_recommendation: "BTS",
    platform_recommendation: ["TikTok", "Instagram Reels"],
    sound_pairing: "American Girls — Harry Styles",
    why_now:
      "BTS content is trending in the Music / Song niche this week (+34% WoW). Authenticity is the #1 driver — fans want to see the real process.",
    confidence_score: 86,
    source_url: null,
    source_title: null,
    timestamp_start: null,
    timestamp_end: null,
    youtube_timestamp_url: null,
    clip_storage_url: null,
    clip_duration_seconds: 42,
    rendered_clip_url: null,
    status: "pending",
    approved_by: null,
    approved_at: null,
    modified_hook: null,
    created_at: "2026-04-01T10:00:00Z",
  },
  {
    id: "mock-5",
    artist_handle: "harrystyles",
    artist_id: "mock-artist-1",
    label_id: WARNER_LABEL_ID,
    segment_id: null,
    hook_text:
      "Fan reaction compilation — curated from 890K-view original. The genuine surprise reactions when hearing American Girls for the first time are gold for engagement.",
    caption:
      "First time hearing American Girls — these reactions say everything",
    format_recommendation: "Reaction",
    platform_recommendation: ["TikTok"],
    sound_pairing: "American Girls — Harry Styles",
    why_now:
      "Reaction content has 1.8x the save rate of other formats. Saves = algorithmic boost = more reach. This is a distribution play.",
    confidence_score: 82,
    source_url: "https://www.youtube.com/watch?v=VuNIsY6JdUw",
    source_title: "Harry Styles — Adore You (Official Video)",
    timestamp_start: 42,
    timestamp_end: 104,
    youtube_timestamp_url: "https://www.youtube.com/watch?v=VuNIsY6JdUw&t=42",
    clip_storage_url: null,
    clip_duration_seconds: 62,
    rendered_clip_url: null,
    status: "pending",
    approved_by: null,
    approved_at: null,
    modified_hook: null,
    created_at: "2026-04-01T10:30:00Z",
  },
];

// no-ops for the preview — buttons are behind the overlay anyway
const noop = () => {};
const noopStr = (_id: string) => {};
const noopStrStr = (_id: string, _s: string) => {};

export default function FanBriefsMock() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header — matches real page */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <Sparkles size={24} color="var(--accent)" style={{ flexShrink: 0 }} />
          <h1
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 28,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            Fan Briefs
          </h1>
        </div>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            color: "var(--ink-tertiary)",
            lineHeight: 1.5,
          }}
        >
          AI-generated content briefs, clip extraction, and sentiment
          intelligence.
        </p>
      </div>

      {/* Tabs — matches real page */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 28,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          style={{
            padding: "12px 24px",
            border: "none",
            borderBottom: "2px solid var(--accent)",
            background: "none",
            color: "var(--ink)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            cursor: "default",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Content
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 20,
              background: "rgba(255,159,10,0.12)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 600,
              color: "#FF9F0A",
            }}
          >
            {MOCK_BRIEFS.length}
          </span>
        </button>
        <button
          style={{
            padding: "12px 24px",
            border: "none",
            borderBottom: "2px solid transparent",
            background: "none",
            color: "var(--ink-tertiary)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 500,
            cursor: "default",
          }}
        >
          Clips
        </button>
      </div>

      {/* Real BriefCard components with mock data */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {MOCK_BRIEFS.map((brief) => (
          <BriefCard
            key={brief.id}
            brief={brief}
            mode="content"
            onApprove={noopStr}
            onSkip={noopStr}
            onModifyHook={noopStrStr}
            staticPreview
          />
        ))}
      </div>
    </div>
  );
}
