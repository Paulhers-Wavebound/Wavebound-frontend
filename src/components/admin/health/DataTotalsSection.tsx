import { Database } from "lucide-react";
import type { AccumulationData } from "./types";
import { TOTAL_LABELS, DAILY_TARGETS, ACCUMULATION_KEY_MAP } from "./constants";
import {
  formatNumber,
  formatCompact,
  getPacePercent,
  getPaceColor,
} from "./helpers";
import { SectionHeader, ProgressBar, DeltaArrow } from "./shared";

interface DataTotalsSectionProps {
  totals: Record<string, number>;
  accumulation: AccumulationData | null;
}

export default function DataTotalsSection({
  totals,
  accumulation,
}: DataTotalsSectionProps) {
  return (
    <div>
      <SectionHeader icon={Database} label="Data totals" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
        }}
      >
        {Object.entries(TOTAL_LABELS).map(([key, label]) => {
          const value = totals[key];
          if (value == null) return null;

          const dailyTarget = DAILY_TARGETS[key];
          const accMap = ACCUMULATION_KEY_MAP[key];
          const todayActual =
            accumulation && accMap
              ? ((accumulation as Record<string, number>)[accMap.today] ?? null)
              : null;

          const yesterdayActual =
            accumulation && accMap
              ? ((accumulation as Record<string, number>)[accMap.yesterday] ??
                null)
              : null;
          const deltaPct =
            accumulation && accMap?.delta
              ? ((accumulation as Record<string, number>)[accMap.delta] ?? null)
              : null;

          const pacePercent =
            todayActual != null && dailyTarget
              ? getPacePercent(todayActual, dailyTarget)
              : null;

          const hasAccData = todayActual != null;

          return (
            <div
              key={key}
              style={{
                background: "var(--surface)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                padding: 16,
              }}
            >
              {/* Label */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 4,
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {label}
              </div>

              {/* Total */}
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--ink)",
                  fontFamily: '"DM Sans", sans-serif',
                  marginBottom: hasAccData ? 12 : 0,
                }}
              >
                {formatNumber(value)}
              </div>

              {/* Projection bar + pace */}
              {pacePercent != null && dailyTarget && todayActual != null && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <ProgressBar
                        pct={Math.min(100, pacePercent)}
                        color={getPaceColor(pacePercent)}
                        height={6}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: getPaceColor(pacePercent),
                        minWidth: 36,
                        textAlign: "right",
                      }}
                    >
                      {pacePercent}%
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    Today {formatNumber(todayActual)} /{" "}
                    {formatCompact(dailyTarget)} target
                  </div>
                </>
              )}

              {/* Yesterday + delta */}
              {hasAccData && yesterdayActual != null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    Yest. {formatNumber(yesterdayActual)}
                  </span>
                  {deltaPct != null && <DeltaArrow value={deltaPct} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
