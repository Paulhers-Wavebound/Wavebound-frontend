import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProgressBar } from "@/components/admin/health/shared";
import { formatCompact } from "@/components/admin/health/helpers";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "@/components/admin/health/constants";

interface PlatformCoverage {
  platform: string;
  id_type: string;
  artists_with: number;
  coverage_pct: number;
}

interface PlatformSummary {
  platform: string;
  artists_with: number;
  coverage_pct: number;
}

interface Distribution {
  zero_ids: number;
  one_id: number;
  two_to_four: number;
  five_plus: number;
}

interface IdentityCoverageData {
  total_artists: number;
  platforms: PlatformCoverage[];
  by_platform_summary: PlatformSummary[];
  distribution: Distribution;
}

async function fetchIdentityCoverage(): Promise<IdentityCoverageData> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("get_identity_coverage");
  if (error) throw error;
  return data as IdentityCoverageData;
}

// Platform display config — ordered by priority for Paul's workflow
const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; category: string }
> = {
  spotify: { label: "Spotify", color: "#1DB954", category: "Streaming" },
  apple_music: {
    label: "Apple Music",
    color: "#FC3C44",
    category: "Streaming",
  },
  deezer: { label: "Deezer", color: "#A238FF", category: "Streaming" },
  youtube: { label: "YouTube", color: "#FF4444", category: "Video" },
  youtube_api: {
    label: "YouTube API (channel)",
    color: "#FF6666",
    category: "Video",
  },
  tiktok: { label: "TikTok", color: "#69C9D0", category: "Social" },
  instagram: { label: "Instagram", color: "#E4405F", category: "Social" },
  facebook: { label: "Facebook", color: "#1877F2", category: "Social" },
  twitter: { label: "Twitter/X", color: "#9CA3AF", category: "Social" },
  soundcloud: { label: "SoundCloud", color: "#FF5500", category: "Social" },
  musicbrainz: {
    label: "MusicBrainz (MBID)",
    color: "#BA478F",
    category: "Identity",
  },
  isrc: { label: "ISRC", color: "#6366F1", category: "Identity" },
  isni: { label: "ISNI", color: "#8B5CF6", category: "Identity" },
  ipi: { label: "IPI", color: "#A78BFA", category: "Identity" },
  wikidata: { label: "Wikidata (QID)", color: "#339966", category: "Identity" },
  discogs: { label: "Discogs", color: "#333333", category: "Identity" },
  ticketmaster: {
    label: "Ticketmaster",
    color: "#009CDE",
    category: "Touring",
  },
  bandcamp: { label: "Bandcamp", color: "#629AA9", category: "Other" },
  genius: { label: "Genius", color: "#FFFF64", category: "Other" },
  lastfm: { label: "Last.fm", color: "#D51007", category: "Other" },
  wikipedia: { label: "Wikipedia", color: "#9CA3AF", category: "Other" },
  homepage: { label: "Homepage", color: "#6B7280", category: "Other" },
  kworb: { label: "Kworb", color: "#22c55e", category: "Other" },
};

function getCoverageColor(pct: number): string {
  if (pct >= 75) return "#34d399";
  if (pct >= 40) return "#f59e0b";
  if (pct >= 10) return "#e8430a";
  return "#ef4444";
}

const CATEGORIES = [
  "Streaming",
  "Social",
  "Video",
  "Identity",
  "Touring",
  "Other",
];

export default function HealthIdentity() {
  const { data, isLoading } = useQuery<IdentityCoverageData>({
    queryKey: ["identity-coverage"],
    queryFn: fetchIdentityCoverage,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          color: "var(--ink-tertiary)",
          fontSize: 14,
          padding: 24,
        }}
      >
        Loading identity coverage...
      </div>
    );
  }

  // Group platforms by category
  const grouped: Record<string, PlatformSummary[]> = {};
  for (const cat of CATEGORIES) grouped[cat] = [];

  for (const p of data.by_platform_summary) {
    const cfg = PLATFORM_CONFIG[p.platform];
    const cat = cfg?.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  const d = data.distribution;
  const total = data.total_artists;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        Identity Coverage
      </h2>

      {/* Summary row */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          {
            label: "Total Artists",
            value: formatCompact(total),
            color: "var(--ink)",
          },
          {
            label: "No IDs",
            value: formatCompact(d.zero_ids),
            color: d.zero_ids > 0 ? "#ef4444" : "#34d399",
          },
          {
            label: "1 platform",
            value: formatCompact(d.one_id),
            color: "#f59e0b",
          },
          {
            label: "2-4 platforms",
            value: formatCompact(d.two_to_four),
            color: "#e8430a",
          },
          {
            label: "5+ platforms",
            value: formatCompact(d.five_plus),
            color: "#34d399",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              minWidth: 120,
              background: "var(--surface)",
              borderRadius: 12,
              border: "1px solid var(--border)",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                fontWeight: 600,
                color: "var(--ink-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 22,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Platform coverage by category */}
      {CATEGORIES.map((cat) => {
        const platforms = grouped[cat];
        if (!platforms || platforms.length === 0) return null;

        return (
          <div
            key={cat}
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {cat}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {platforms.map((p) => {
                const cfg = PLATFORM_CONFIG[p.platform] || {
                  label: p.platform,
                  color: "#9CA3AF",
                };
                const pct = p.coverage_pct;
                const barColor = getCoverageColor(pct);

                return (
                  <div
                    key={p.platform}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {/* Platform dot + name */}
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: cfg.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink)",
                        width: 180,
                        flexShrink: 0,
                      }}
                    >
                      {cfg.label}
                    </span>

                    {/* Progress bar */}
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <ProgressBar pct={pct} color={barColor} height={6} />
                    </div>

                    {/* Count */}
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 13,
                        fontWeight: 600,
                        color: barColor,
                        width: 100,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {formatCompact(p.artists_with)}/{formatCompact(total)}
                    </span>

                    {/* Percentage */}
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        color: "var(--ink-faint)",
                        width: 50,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Detailed breakdown by id_type */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Detailed Breakdown (by ID type)
          </span>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              {["Platform", "ID Type", "Artists", "Coverage"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.platforms.map((p, i) => {
              const cfg = PLATFORM_CONFIG[p.platform];
              return (
                <tr key={`${p.platform}-${p.id_type}-${i}`}>
                  <td
                    style={{
                      padding: "6px 16px",
                      color: "var(--ink)",
                      fontWeight: 500,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: cfg?.color || "#9CA3AF",
                        }}
                      />
                      {cfg?.label || p.platform}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "6px 16px",
                      color: "var(--ink-secondary)",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {p.id_type}
                  </td>
                  <td
                    style={{
                      padding: "6px 16px",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      fontWeight: 600,
                      color: getCoverageColor(p.coverage_pct),
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {formatCompact(p.artists_with)}
                  </td>
                  <td
                    style={{
                      padding: "6px 16px",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {p.coverage_pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
