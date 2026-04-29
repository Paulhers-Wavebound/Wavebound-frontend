import type { TikTokProfile } from "@/types/artistIntelligence";
import { TIKTOK_GRADE_CONFIG } from "@/types/artistIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import InfoTooltip from "./InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

const CONSISTENCY_CONFIG: Record<string, { label: string; color: string }> = {
  daily: { label: "Daily", color: "#30D158" },
  regular: { label: "Regular", color: "#0A84FF" },
  sporadic: { label: "Sporadic", color: "#FFD60A" },
  inactive: { label: "Inactive", color: "#FF9F0A" },
  dormant: { label: "Dormant", color: "#FF453A" },
};

function StatCell({
  label,
  value,
  sub,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  tooltip?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 100 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "var(--ink-faint)",
          marginBottom: 4,
        }}
      >
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 18,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-tertiary)",
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export default function TikTokProfileCard({
  profile,
}: {
  profile: TikTokProfile | null;
}) {
  if (!profile) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-sm)",
          padding: "40px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
          }}
        >
          TikTok profile data not yet available
        </div>
      </div>
    );
  }

  const grade =
    TIKTOK_GRADE_CONFIG[profile.tiktok_grade] ?? TIKTOK_GRADE_CONFIG.F;
  const consistency =
    CONSISTENCY_CONFIG[profile.posting_consistency] ??
    CONSISTENCY_CONFIG.dormant;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 24,
      }}
    >
      {/* Header with grade + consistency */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          TikTok Profile{" "}
          <InfoTooltip text={STAT_TOOLTIPS.intel.tiktokProfile} />
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Grade badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: grade.bg,
              color: grade.color,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {profile.tiktok_grade}
          </span>
          {/* Consistency badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.04)",
              color: consistency.color,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {consistency.label}
          </span>
        </div>
      </div>

      {/* Key metrics grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <StatCell
          label="Avg Plays"
          value={formatNumber(profile.avg_plays)}
          sub={
            profile.plays_trend_pct != null
              ? `${profile.plays_trend_pct > 0 ? "+" : ""}${profile.plays_trend_pct.toFixed(0)}% trend`
              : undefined
          }
          tooltip={STAT_TOOLTIPS.intel.tiktokAvgPlays}
        />
        <StatCell
          label="Engagement"
          value={`${profile.avg_engagement_rate.toFixed(1)}%`}
          tooltip={STAT_TOOLTIPS.intel.tiktokEngagement}
        />
        <StatCell
          label="Original Sound"
          value={`${profile.original_sound_pct.toFixed(0)}%`}
          tooltip={STAT_TOOLTIPS.intel.tiktokOriginalSound}
        />
        <StatCell
          label="Posts / Week"
          value={profile.avg_posts_per_week.toFixed(1)}
          sub={`${profile.days_since_last_post}d since last`}
          tooltip={STAT_TOOLTIPS.intel.tiktokPostsPerWeek}
        />
      </div>

      {/* Bottom stats */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: "var(--ink-tertiary)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {profile.total_videos} total videos
          <InfoTooltip text={STAT_TOOLTIPS.intel.tiktokTotalVideos} />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {profile.videos_30d} in last 30d
          <InfoTooltip text={STAT_TOOLTIPS.intel.tiktokVideos30d} />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          Best: {formatNumber(profile.best_video_plays)} plays
          <InfoTooltip text={STAT_TOOLTIPS.intel.tiktokBestVideoPlays} />
        </span>
      </div>
    </div>
  );
}
