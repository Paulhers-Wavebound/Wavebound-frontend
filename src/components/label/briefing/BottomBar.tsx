import { useMemo } from "react";
import type { BriefingData } from "@/types/artistBriefing";
import { generateBottomLine } from "@/utils/briefingGenerator";

// ─── Helpers ─────────────────────────────────────────────────────

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

// ─── Predicted Entries (compact) ─────────────────────────────────

interface PredictedEntry {
  countryCode: string;
  probability: number;
}

function buildPredictions(data: BriefingData): PredictedEntry[] {
  const safeMarkets = data.marketsV2 ?? [];
  const safeSpillovers = data.spillovers ?? [];

  const notPresent = safeMarkets.filter(
    (m) =>
      !m.is_present &&
      m.spillover_probability != null &&
      m.spillover_probability >= 30,
  );

  const activeCountries = new Set(
    safeMarkets.filter((m) => m.is_present).map((m) => m.country_code),
  );

  const spilloverPredictions = safeSpillovers
    .filter(
      (s) =>
        activeCountries.has(s.from_country) &&
        !activeCountries.has(s.to_country) &&
        s.confidence_pct >= 30,
    )
    .sort((a, b) => b.confidence_pct - a.confidence_pct)
    .slice(0, 5);

  const seen = new Set<string>();
  const predictions: PredictedEntry[] = [];

  for (const m of notPresent) {
    if (seen.has(m.country_code)) continue;
    seen.add(m.country_code);
    predictions.push({
      countryCode: m.country_code,
      probability: m.spillover_probability!,
    });
  }

  for (const sp of spilloverPredictions) {
    if (seen.has(sp.to_country)) continue;
    seen.add(sp.to_country);
    predictions.push({
      countryCode: sp.to_country,
      probability: sp.confidence_pct,
    });
  }

  return predictions.sort((a, b) => b.probability - a.probability).slice(0, 4);
}

// ─── Main Component ──────────────────────────────────────────────

interface BottomBarProps {
  data: BriefingData;
}

export default function BottomBar({ data }: BottomBarProps) {
  const bottomLine = useMemo(() => generateBottomLine(data), [data]);
  const predictions = useMemo(() => buildPredictions(data), [data]);

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 16,
        borderTop: "0.5px solid rgba(232,67,10,0.12)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          background: "linear-gradient(180deg, rgba(232,67,10,0.03) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom line */}
      <div style={{ padding: "24px 28px", position: "relative" }}>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: 600,
            color: "#e8430a",
            letterSpacing: "1.5px",
            marginBottom: 12,
          }}
        >
          BOTTOM LINE
        </div>
        <p
          style={{
            fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
            fontSize: 15,
            lineHeight: 1.75,
            letterSpacing: "0.005em",
            color: "rgba(255,255,255,0.80)",
            margin: 0,
            fontStyle: "italic",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          "{bottomLine}"
        </p>
      </div>

      {/* Predicted entries */}
      {predictions.length > 0 && (
        <div
          style={{
            padding: "12px 24px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.30)",
              letterSpacing: "0.8px",
              flexShrink: 0,
            }}
          >
            LIKELY NEXT:
          </span>
          {predictions.map((p) => (
            <span
              key={p.countryCode}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ fontSize: 12 }}>{countryFlag(p.countryCode)}</span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {countryName(p.countryCode)}
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: 600,
                  color:
                    p.probability >= 60
                      ? "#30D158"
                      : p.probability >= 40
                        ? "#FFD60A"
                        : "rgba(255,255,255,0.45)",
                }}
              >
                {p.probability}%
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
