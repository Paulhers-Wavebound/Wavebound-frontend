import { HookAnalysis, DurationAnalysis } from "@/types/soundIntelligence";
import InfoPopover from "./InfoPopover";

interface Props {
  hookAnalysis: HookAnalysis;
  duration: DurationAnalysis;
}

export default function HookDurationSection({ hookAnalysis, duration }: Props) {
  if (!hookAnalysis || !duration) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Hook Analysis */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 14,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
            }}
          />
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
            }}
          >
            Hook Analysis
          </div>
          <InfoPopover text="What grabs viewers in the first few seconds. Shows how often creators show a face immediately, use text overlays to hook attention, and which song clip gets used the most." />
        </div>

        {/* Face in First 2s */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            padding: 20,
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              marginBottom: 8,
            }}
          >
            Face in First 2 Seconds
          </div>
          {hookAnalysis.face_pct > 0 ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "var(--ink)",
                  fontFamily: '"DM Sans", sans-serif',
                  letterSpacing: "-0.03em",
                }}
              >
                {hookAnalysis.face_pct}%
              </span>
              <span style={{ fontSize: 13, color: "#30D158", fontWeight: 600 }}>
                {hookAnalysis.face_multiplier}x multiplier
              </span>
            </div>
          ) : (
            <div
              style={{
                fontSize: 14,
                color: "var(--ink-tertiary)",
                fontStyle: "italic",
              }}
            >
              No face hooks detected in analyzed videos
            </div>
          )}
        </div>

        {/* Text Overlay Hook */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            padding: 20,
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              marginBottom: 8,
            }}
          >
            Text Overlay Hook
          </div>
          {hookAnalysis.text_hook_pct > 0 ? (
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "var(--ink)",
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: "-0.03em",
                marginBottom: 10,
              }}
            >
              {hookAnalysis.text_hook_pct}%
            </div>
          ) : (
            <div
              style={{
                fontSize: 14,
                color: "var(--ink-tertiary)",
                fontStyle: "italic",
                marginBottom: 10,
              }}
            >
              No text hooks detected
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {hookAnalysis.top_hooks.map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: "var(--border-subtle)",
                  color: "var(--ink-secondary)",
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Optimal Snippet */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            padding: 20,
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              marginBottom: 8,
            }}
          >
            Optimal Snippet
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            "{hookAnalysis.optimal_snippet}"
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-tertiary)",
            }}
          >
            Used in {hookAnalysis.snippet_appearance_pct}% of top videos
          </div>
        </div>
      </div>

      {/* Duration Comparison */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 3,
              height: 14,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
            }}
          />
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
            }}
          >
            Duration Comparison
          </div>
          <InfoPopover text="Compares video length between top performers and low performers. The difference tells you the ideal video duration for this sound." />
        </div>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            padding: 24,
            borderTop: "0.5px solid var(--card-edge)",
            height: "calc(100% - 32px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 32,
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#30D158",
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  marginBottom: 8,
                }}
              >
                Top 10 Avg
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: "var(--ink)",
                  fontFamily: '"DM Sans", sans-serif',
                  letterSpacing: "-0.03em",
                }}
              >
                {duration.top10_avg}s
              </div>
            </div>
            <div
              style={{
                width: 1,
                background: "var(--border)",
                alignSelf: "stretch",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#FF453A",
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  marginBottom: 8,
                }}
              >
                Bottom 10 Avg
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: "var(--ink)",
                  fontFamily: '"DM Sans", sans-serif',
                  letterSpacing: "-0.03em",
                }}
              >
                {duration.bottom10_avg}s
              </div>
            </div>
          </div>

          <div
            style={{
              borderLeft: "3px solid var(--accent)",
              padding: "12px 16px",
              background: "rgba(232,67,10,0.06)",
              borderRadius: "0 8px 8px 0",
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-secondary)",
                lineHeight: 1.5,
              }}
            >
              {duration.insight}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
