import { HeartPulse } from "lucide-react";
import type { DbtHealth, DbtModelStat, ScoreDistribution } from "./types";
import { formatNumber } from "./helpers";
import { SectionHeader } from "./shared";

function DistributionBar({ dist }: { dist: ScoreDistribution }) {
  const total =
    dist.below_30 + dist.between_30_50 + dist.between_50_70 + dist.above_70;
  if (total === 0) return null;

  const segments = [
    { count: dist.below_30, color: "#ef4444", label: "<30" },
    { count: dist.between_30_50, color: "#f59e0b", label: "30-50" },
    { count: dist.between_50_70, color: "#3b82f6", label: "50-70" },
    { count: dist.above_70, color: "#22c55e", label: "70+" },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 12,
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: 6,
        }}
      >
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.label}
              title={`${seg.label}: ${seg.count}`}
              style={{
                width: `${(seg.count / total) * 100}%`,
                background: seg.color,
                minWidth: seg.count > 0 ? 4 : 0,
              }}
            />
          ) : null,
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          fontSize: 10,
          color: "var(--ink-faint)",
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {segments.map((seg) => (
          <span
            key={seg.label}
            style={{ display: "flex", alignItems: "center", gap: 3 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: seg.color,
                display: "inline-block",
              }}
            />
            {seg.label}: {seg.count}
          </span>
        ))}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: 12,
  border: "1px solid var(--border)",
  padding: 16,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 10,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink)",
  fontFamily: '"DM Sans", sans-serif',
};

const rowCountStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ink-tertiary)",
  fontFamily: '"JetBrains Mono", monospace',
};

function ModelList({ models }: { models: DbtModelStat[] }) {
  const totalRows = models.reduce((sum, m) => sum + m.rows, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        fontSize: 11,
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      {models.map((m) => (
        <div
          key={m.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "var(--ink-tertiary)",
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: m.rows > 0 ? "var(--ink-secondary)" : "var(--ink-faint)",
            }}
          >
            {m.name}
          </span>
          <strong
            style={{
              color: m.rows > 0 ? "var(--ink-secondary)" : "var(--ink-faint)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
            }}
          >
            {formatNumber(m.rows)}
          </strong>
        </div>
      ))}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 4,
          marginTop: 2,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        <span>Total</span>
        <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {formatNumber(totalRows)}
        </span>
      </div>
    </div>
  );
}

export default function DbtHealthSection({ dbt }: { dbt: DbtHealth }) {
  return (
    <div>
      <SectionHeader icon={HeartPulse} label="dbt model health" />

      {/* Summary strip */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: "Total models",
            value: dbt.total_models || 34,
            color: "var(--ink)",
          },
          {
            label: "Compression",
            value: dbt.compression_models?.length || 0,
            color: "#3b82f6",
          },
          {
            label: "Health",
            value: dbt.health_models?.length || 0,
            color: "#22c55e",
          },
          {
            label: "Intelligence",
            value: dbt.intelligence_models?.length || 0,
            color: "#a855f7",
          },
          {
            label: "Anomalies",
            value: dbt.anomalies_rows ?? 0,
            color: "#f59e0b",
            isRows: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--surface)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              padding: "8px 12px",
              minWidth: 80,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "var(--ink-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontFamily: '"DM Sans", sans-serif',
                marginBottom: 2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 16,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {"isRows" in s && s.isRows
                ? formatNumber(s.value)
                : `${s.value} models`}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {/* Entity Health */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Entity Health</span>
            <span style={rowCountStyle}>
              {formatNumber(dbt.entity_health_rows)} rows
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-tertiary)",
              marginBottom: 10,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Avg score:{" "}
            <strong style={{ color: "var(--ink)" }}>
              {dbt.entity_health_avg_score}
            </strong>
          </div>

          <DistributionBar dist={dbt.entity_health_score_distribution} />

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              fontSize: 11,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            <span style={{ color: "var(--ink-tertiary)" }}>
              Discovery:{" "}
              <strong style={{ color: "var(--ink-secondary)" }}>
                {formatNumber(dbt.discovery_momentum_active)}
              </strong>
            </span>
            <span style={{ color: "var(--ink-tertiary)" }}>
              Streaming:{" "}
              <strong style={{ color: "var(--ink-secondary)" }}>
                {formatNumber(dbt.streaming_momentum_active)}
              </strong>
            </span>
            <span style={{ color: "var(--ink-tertiary)" }}>
              Social:{" "}
              <strong style={{ color: "var(--ink-secondary)" }}>
                {formatNumber(dbt.social_momentum_active)}
              </strong>
            </span>
            <span style={{ color: "var(--ink-tertiary)" }}>
              Geographic:{" "}
              <strong style={{ color: "var(--ink-secondary)" }}>
                {formatNumber(dbt.geographic_momentum_active)}
              </strong>
            </span>
          </div>
        </div>

        {/* Song Health */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Song Health</span>
            <span style={rowCountStyle}>
              {formatNumber(dbt.song_health_rows)} rows
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-tertiary)",
              marginBottom: 12,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Avg score:{" "}
            <strong style={{ color: "var(--ink)" }}>
              {dbt.song_health_avg_score}
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--ink-tertiary)",
              }}
            >
              <span>Radio data</span>
              <strong style={{ color: "var(--ink-secondary)" }}>
                {formatNumber(dbt.song_health_has_radio)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--ink-tertiary)",
              }}
            >
              <span>Apple Music</span>
              <strong style={{ color: "var(--ink-secondary)" }}>
                {formatNumber(dbt.song_health_has_apple)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--ink-tertiary)",
              }}
            >
              <span>YouTube</span>
              <strong style={{ color: "var(--ink-secondary)" }}>
                {formatNumber(dbt.song_health_has_youtube)}
              </strong>
            </div>
          </div>
        </div>

        {/* Market Health */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Market Health</span>
            <span style={rowCountStyle}>
              {formatNumber(dbt.market_health_rows)} rows
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-tertiary)",
              marginBottom: 12,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Avg score:{" "}
            <strong style={{ color: "var(--ink)" }}>
              {dbt.market_health_avg_score}
            </strong>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 10,
              marginTop: 10,
              fontSize: 11,
              color: "var(--ink-tertiary)",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Daily Summaries
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Rows</span>
                <strong style={{ color: "var(--ink-secondary)" }}>
                  {formatNumber(dbt.daily_summaries_rows)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Dates</span>
                <strong style={{ color: "var(--ink-secondary)" }}>
                  {formatNumber(dbt.daily_summaries_distinct_dates)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Metric combos</span>
                <strong style={{ color: "var(--ink-secondary)" }}>
                  {formatNumber(dbt.daily_summaries_metric_combos)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 1 — Compression */}
        {dbt.compression_models && dbt.compression_models.length > 0 && (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardTitleStyle}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: "#3b82f6",
                    marginRight: 6,
                  }}
                />
                Compression
              </span>
              <span style={rowCountStyle}>
                {dbt.compression_models.length} models
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                marginBottom: 8,
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Incremental — daily_summaries, song_velocity, etc.
            </div>
            <ModelList models={dbt.compression_models} />
          </div>
        )}

        {/* Layer 1 — Health */}
        {dbt.health_models && dbt.health_models.length > 0 && (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardTitleStyle}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: "#22c55e",
                    marginRight: 6,
                  }}
                />
                Health Models
              </span>
              <span style={rowCountStyle}>
                {dbt.health_models.length} models
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                marginBottom: 8,
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Full rebuild — entity, song, market, platform scores
            </div>
            <ModelList models={dbt.health_models} />
          </div>
        )}

        {/* Layer 2 — Intelligence */}
        {dbt.intelligence_models && dbt.intelligence_models.length > 0 && (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={cardTitleStyle}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: "#a855f7",
                    marginRight: 6,
                  }}
                />
                Intelligence
              </span>
              <span style={rowCountStyle}>
                {dbt.intelligence_models.length} models
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                marginBottom: 8,
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Full rebuild — scores, momentum, opportunities, catalog
            </div>
            <ModelList models={dbt.intelligence_models} />
          </div>
        )}
      </div>
    </div>
  );
}
