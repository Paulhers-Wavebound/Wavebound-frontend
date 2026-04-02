import { SoundAnalysis, CreatorTier } from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";

interface Props {
  analysis: SoundAnalysis;
  userCount?: number | null;
}

function deriveUniqueCreators(tiers?: CreatorTier[]): number | null {
  if (!tiers || tiers.length === 0) return null;
  return tiers.reduce((sum, t) => sum + t.count, 0);
}

const LIFECYCLE_ICONS: Record<string, { arrow: string; color: string }> = {
  accelerating: { arrow: "↗", color: "#30D158" },
  active: { arrow: "→", color: "#FFD60A" },
  declining: { arrow: "↘", color: "#FF453A" },
};

export default function SoundHealthStrip({ analysis, userCount }: Props) {
  const primaryRole = analysis.song_role_distribution?.find(
    (r) => r.role === "primary",
  );
  const organicIntent = analysis.intent_breakdown?.find(
    (i) => i.intent === "organic",
  );
  const lifecycle = LIFECYCLE_ICONS[analysis.status] ?? LIFECYCLE_ICONS.active;

  const totalVideos =
    userCount ?? analysis.total_videos_on_sound ?? analysis.videos_analyzed;
  const uniqueCreators =
    deriveUniqueCreators(analysis.creator_tiers) ?? analysis.videos_analyzed;

  const stats: { label: string; color?: string }[] = [
    { label: `${formatNumber(totalVideos)} videos` },
    { label: `${formatNumber(uniqueCreators)} creators` },
    { label: `${formatNumber(analysis.total_views)} views` },
  ];

  if (primaryRole) {
    stats.push({ label: `${primaryRole.pct}% Primary` });
  }
  if (organicIntent) {
    stats.push({ label: `${organicIntent.pct}% Organic` });
  }
  stats.push({
    label: `${analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)} ${lifecycle.arrow}`,
    color: lifecycle.color,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        background: "var(--overlay-subtle)",
        borderRadius: 10,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 13,
        fontWeight: 500,
        color: "var(--ink-secondary)",
        flexWrap: "wrap",
      }}
    >
      {stats.map((stat, i) => (
        <span
          key={i}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {i > 0 && (
            <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>
              ·
            </span>
          )}
          <span
            style={{
              color: stat.color ?? "var(--ink-secondary)",
              fontWeight: stat.color ? 600 : 500,
            }}
          >
            {stat.label}
          </span>
        </span>
      ))}
    </div>
  );
}
