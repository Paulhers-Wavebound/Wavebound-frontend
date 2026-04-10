import type { ArtistCard } from "@/types/artistIntelligence";
import InfoTooltip from "./InfoTooltip";

const PLATFORM_LABELS: Record<string, string> = {
  spotify: "Spotify",
  apple_music: "Apple Music",
  tiktok: "TikTok",
  youtube: "YouTube",
  shazam: "Shazam",
  ticketmaster: "Ticketmaster",
  bandsintown: "Bandsintown",
  soundcloud: "SoundCloud",
  deezer: "Deezer",
  tidal: "Tidal",
  amazon_music: "Amazon Music",
  instagram: "Instagram",
};

export default function CoverageGaps({ card }: { card: ArtistCard }) {
  const coverage = card.coverage;
  if (!coverage) return null;
  const { score, missing = [] } = coverage;

  if (missing.length === 0 && score >= 90) return null;

  const barColor =
    score >= 80 ? "#30D158" : score >= 50 ? "#FFD60A" : "#FF453A";

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
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
          Platform Coverage{" "}
          <InfoTooltip text="How many major platforms have this artist's identity linked. Missing platforms = missed discovery and attribution. Score reflects breadth of presence across streaming, social, live, and discovery platforms." />
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 48,
              height: 6,
              borderRadius: 3,
              background: "var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${score}%`,
                borderRadius: 3,
                background: barColor,
                transition: "width 500ms ease-out",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13,
              fontWeight: 600,
              color: barColor,
            }}
          >
            {score}%
          </span>
        </div>
      </div>

      {missing.length > 0 && (
        <>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Not linked
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {missing.map((platform) => (
              <span
                key={platform}
                style={{
                  display: "inline-flex",
                  padding: "4px 10px",
                  borderRadius: 16,
                  background: "rgba(255,69,58,0.08)",
                  border: "1px solid rgba(255,69,58,0.2)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "#FF453A",
                }}
              >
                {PLATFORM_LABELS[platform] ?? platform.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
