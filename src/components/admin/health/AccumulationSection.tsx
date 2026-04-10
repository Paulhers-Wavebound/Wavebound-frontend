import { BarChart3 } from "lucide-react";
import type { AccumulationData } from "./types";
import { formatNumber } from "./helpers";
import { SectionHeader, DeltaArrow } from "./shared";

export default function AccumulationSection({
  acc,
}: {
  acc: AccumulationData;
}) {
  return (
    <div>
      <SectionHeader icon={BarChart3} label="Daily accumulation" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {/* Observations */}
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
            Observations
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-tertiary)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Today
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--ink)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {formatNumber(acc.observations_today)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Yesterday
            </span>
            <span
              style={{
                fontSize: 14,
                color: "var(--ink-tertiary)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {formatNumber(acc.observations_yesterday)}
            </span>
          </div>
          <DeltaArrow value={acc.observations_delta_pct} />
        </div>

        {/* Geo Observations */}
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
            Geo observations
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-tertiary)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Today
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--ink)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {formatNumber(acc.geo_today)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Yesterday
            </span>
            <span
              style={{
                fontSize: 14,
                color: "var(--ink-tertiary)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {formatNumber(acc.geo_yesterday)}
            </span>
          </div>
          <DeltaArrow value={acc.geo_delta_pct} />
        </div>

        {/* Entities Created */}
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
            Entities created
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-tertiary)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Today
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--ink)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {formatNumber(acc.entities_created_today)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Yesterday
            </span>
            <span
              style={{
                fontSize: 14,
                color: "var(--ink-tertiary)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {formatNumber(acc.entities_created_yesterday)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
