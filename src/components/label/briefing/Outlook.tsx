import { useMemo } from "react";
import type { BriefingData, MarketOpportunityV2 } from "@/types/artistBriefing";
import { generateBottomLine } from "@/utils/briefingGenerator";

// ─── Helpers ───────────────────────────────────────────────────────

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

// ─── Predicted Market Entries ──────────────────────────────────────

interface PredictedEntry {
  countryCode: string;
  probability: number;
  source: string;
  estimatedDays: number;
}

function buildPredictions(data: BriefingData): PredictedEntry[] {
  const safeMarkets = data.marketsV2 ?? [];
  const safeSpillovers = data.spillovers ?? [];

  // Find markets the artist isn't in yet but has spillover probability
  const notPresent = safeMarkets.filter(
    (m) =>
      !m.is_present &&
      m.spillover_probability != null &&
      m.spillover_probability >= 20,
  );

  // Also check spillover table for predictions from active markets
  const activeCountries = new Set(
    safeMarkets.filter((m) => m.is_present).map((m) => m.country_code),
  );

  const spilloverPredictions = safeSpillovers
    .filter(
      (s) =>
        activeCountries.has(s.from_country) &&
        !activeCountries.has(s.to_country) &&
        s.confidence_pct >= 20,
    )
    .sort((a, b) => b.confidence_pct - a.confidence_pct)
    .slice(0, 8);

  // Merge: prefer market_opportunity_v2 data, supplement with spillover table
  const seen = new Set<string>();
  const predictions: PredictedEntry[] = [];

  for (const m of notPresent) {
    if (seen.has(m.country_code)) continue;
    seen.add(m.country_code);
    predictions.push({
      countryCode: m.country_code,
      probability: m.spillover_probability!,
      source: m.spillover_source_market
        ? `${countryName(m.spillover_source_market)} spillover`
        : "Opportunity signals",
      estimatedDays:
        m.estimated_activation_days ?? m.spillover_median_lag ?? 14,
    });
  }

  for (const sp of spilloverPredictions) {
    if (seen.has(sp.to_country)) continue;
    seen.add(sp.to_country);
    predictions.push({
      countryCode: sp.to_country,
      probability: sp.confidence_pct,
      source: `${countryName(sp.from_country)} spillover`,
      estimatedDays: sp.median_lag_days,
    });
  }

  return predictions.sort((a, b) => b.probability - a.probability).slice(0, 6);
}

// ─── Risk Detection ────────────────────────────────────────────────

interface Risk {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

function detectRisks(data: BriefingData): Risk[] {
  const { artistCard: card, marketsV2, songs } = data;
  const risks: Risk[] = [];

  const safeMarkets = marketsV2 ?? [];
  const safeSongs = songs ?? [];
  const missingPlatforms = card?.coverage?.missing ?? [];

  // Declining markets
  const decliningMarkets = safeMarkets.filter(
    (m) =>
      m.is_present && (m.velocity === "declining" || m.velocity === "exiting"),
  );
  if (decliningMarkets.length > 0) {
    const names = decliningMarkets
      .slice(0, 3)
      .map((m) => countryName(m.country_code))
      .join(", ");
    risks.push({
      title: `Declining in ${decliningMarkets.length} market${decliningMarkets.length > 1 ? "s" : ""}`,
      detail: `${names}${decliningMarkets.length > 3 ? ` + ${decliningMarkets.length - 3} more` : ""}. Chart positions dropping — risk of losing these markets without intervention.`,
      severity: decliningMarkets.length >= 3 ? "high" : "medium",
    });
  }

  // Declining songs
  const decliningSongs = safeSongs.filter(
    (s) =>
      s.velocity_class === "declining" || s.velocity_class === "decelerating",
  );
  if (
    decliningSongs.length > 0 &&
    safeSongs.length > 0 &&
    decliningSongs.length >= safeSongs.length * 0.4
  ) {
    risks.push({
      title: `${decliningSongs.length} of ${safeSongs.length} songs losing momentum`,
      detail: `Catalog is cooling. Consider new content or playlist refresh to stabilize streaming.`,
      severity:
        decliningSongs.length >= safeSongs.length * 0.6 ? "high" : "medium",
    });
  }

  // Low platform coverage
  if (missingPlatforms.length >= 3) {
    risks.push({
      title: `Missing from ${missingPlatforms.length} platforms`,
      detail: `Not present on ${missingPlatforms.slice(0, 3).join(", ")}. Limits discovery in markets where these platforms are dominant.`,
      severity: missingPlatforms.length >= 5 ? "high" : "low",
    });
  }

  // Momentum negative zone
  if (card.momentum?.zone === "negative") {
    risks.push({
      title: "Momentum in negative zone",
      detail: `Overall trajectory is below baseline. Without intervention, further decline is likely.`,
      severity: "medium",
    });
  }

  return risks.slice(0, 4);
}

// ─── Probability Bar ───────────────────────────────────────────────

function ProbabilityBar({ pct }: { pct: number }) {
  const color =
    pct >= 70
      ? "#30D158"
      : pct >= 50
        ? "#FFD60A"
        : pct >= 30
          ? "#FF9F0A"
          : "#8E8E93";
  return (
    <div
      style={{
        width: 60,
        height: 6,
        borderRadius: 3,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 3,
          background: color,
        }}
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export default function Outlook({ data }: { data: BriefingData }) {
  const predictions = useMemo(() => buildPredictions(data), [data]);
  const risks = useMemo(() => detectRisks(data), [data]);
  const bottomLine = useMemo(() => generateBottomLine(data), [data]);
  const currentMarkets = data.artistCard.geo.total_markets;
  const predictedGain = predictions.filter((p) => p.probability >= 50).length;

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 28,
      }}
    >
      {/* Header */}
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 17,
          fontWeight: 600,
          color: "rgba(255,255,255,0.87)",
          margin: "0 0 20px",
        }}
      >
        OUTLOOK — Next 30 Days
      </h2>

      {/* ─── Predicted Market Entries ─── */}
      {predictions.length > 0 && (
        <div
          style={{
            background: "#2C2C2E",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "1px",
              marginBottom: 14,
            }}
          >
            PREDICTED MARKET ENTRIES
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {predictions.map((p) => (
              <div
                key={p.countryCode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 14, width: 22, flexShrink: 0 }}>
                  {countryFlag(p.countryCode)}
                </span>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.87)",
                    width: 110,
                    flexShrink: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {countryName(p.countryCode)}
                </span>
                <ProbabilityBar pct={p.probability} />
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      p.probability >= 70
                        ? "#30D158"
                        : p.probability >= 50
                          ? "#FFD60A"
                          : "rgba(255,255,255,0.55)",
                    width: 45,
                    flexShrink: 0,
                  }}
                >
                  {p.probability}%
                </span>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  ({p.source}, {p.estimatedDays}d)
                </span>
              </div>
            ))}
          </div>

          {predictedGain > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              If likely entries materialize: {currentMarkets} markets {"\u2192"}{" "}
              {currentMarkets + predictedGain} markets (+
              {Math.round((predictedGain / currentMarkets) * 100)}%)
            </div>
          )}
        </div>
      )}

      {/* ─── Risks ─── */}
      {risks.length > 0 && (
        <div
          style={{
            background: "#2C2C2E",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "1px",
              marginBottom: 14,
            }}
          >
            RISKS
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {risks.map((risk, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {risk.severity === "high"
                    ? "\uD83D\uDED1"
                    : risk.severity === "medium"
                      ? "\u26A0\uFE0F"
                      : "\u2139\uFE0F"}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.87)",
                    }}
                  >
                    {risk.title}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      color: "rgba(255,255,255,0.45)",
                      marginTop: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    {risk.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── BOTTOM LINE ─── */}
      <div
        style={{
          background: "rgba(232,67,10,0.04)",
          borderRadius: 12,
          border: "1px solid rgba(232,67,10,0.15)",
          padding: 24,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "1px",
            marginBottom: 10,
          }}
        >
          BOTTOM LINE
        </div>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.87)",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          "{bottomLine}"
        </p>
      </div>
    </div>
  );
}
