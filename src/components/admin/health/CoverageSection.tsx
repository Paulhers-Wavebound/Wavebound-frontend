import { Globe } from "lucide-react";
import type { CoverageData } from "./types";
import { formatNumber, formatPct } from "./helpers";
import { SectionHeader, ProgressBar } from "./shared";

export default function CoverageSection({ cov }: { cov: CoverageData }) {
  return (
    <div>
      <SectionHeader icon={Globe} label="Coverage analysis" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {/* Geo Coverage */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Geo coverage
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: 6,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {formatNumber(cov.artists_with_geo)}{" "}
            <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>
              of {formatNumber(cov.artists_total)}
            </span>
          </div>
          <ProgressBar pct={cov.artists_with_geo_pct} />
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              marginTop: 4,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {formatPct(cov.artists_with_geo_pct)}
          </div>
        </div>

        {/* Multi-Platform */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Multi-platform (3+)
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: 6,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {formatNumber(cov.artists_with_multi_platform)}
          </div>
          <ProgressBar pct={cov.artists_with_multi_platform_pct} />
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              marginTop: 4,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {formatPct(cov.artists_with_multi_platform_pct)}
          </div>
        </div>

        {/* Song Coverage */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Song coverage
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: 6,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {formatNumber(cov.songs_with_observations)}{" "}
            <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>
              of {formatNumber(cov.songs_total)}
            </span>
          </div>
          <ProgressBar pct={cov.songs_with_observations_pct} />
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              marginTop: 4,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {formatPct(cov.songs_with_observations_pct)}
          </div>
        </div>

        {/* Avg Platforms */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Avg platforms / artist
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "var(--ink)",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {cov.avg_platforms_per_artist}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              marginTop: 4,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {formatNumber(cov.markets_total)} markets tracked
          </div>
        </div>
      </div>
    </div>
  );
}
