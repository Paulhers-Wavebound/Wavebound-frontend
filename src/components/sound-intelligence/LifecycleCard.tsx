import { LifecycleInfo } from "@/types/soundIntelligence";
import { Check, ArrowRight } from "lucide-react";
import InfoPopover from "./InfoPopover";

interface Props {
  lifecycle: LifecycleInfo;
}

const PHASES = ["Ignition", "Breakout", "Sustain / Decay"];

function getPhaseIndex(phase: string): number {
  const lower = phase.toLowerCase();
  if (lower.includes("ignit")) return 0;
  if (lower.includes("break")) return 1;
  return 2;
}

export default function LifecycleCard({ lifecycle }: Props) {
  const activeIndex = getPhaseIndex(lifecycle.current_phase);

  return (
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
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
          }}
        >
          Lifecycle Status
        </span>
        <InfoPopover text="Where your sound is in its lifespan. Ignition = just starting to catch on. Breakout = blowing up right now. Sustain/Decay = past its peak and slowing down." />
      </div>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 24,
          borderTop: "0.5px solid var(--card-edge)",
        }}
      >
        {/* Phase Track */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginBottom: 24,
          }}
        >
          {PHASES.map((phase, i) => {
            const isComplete = i < activeIndex;
            const isActive = i === activeIndex;

            return (
              <div
                key={phase}
                style={{ display: "flex", alignItems: "center", flex: 1 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: 10,
                    flex: 1,
                    background: isActive
                      ? "rgba(232,67,10,0.1)"
                      : isComplete
                        ? "rgba(48,209,88,0.08)"
                        : "var(--overlay-hover)",
                    border: isActive
                      ? "1px solid rgba(232,67,10,0.3)"
                      : "1px solid transparent",
                  }}
                >
                  {isComplete ? (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#30D158",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={13} color="#fff" />
                    </div>
                  ) : isActive ? (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ArrowRight size={13} color="#fff" />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--chart-tooltip-border)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive
                        ? "var(--accent)"
                        : isComplete
                          ? "#30D158"
                          : "var(--ink-tertiary)",
                    }}
                  >
                    {phase}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <div
                    style={{
                      width: 24,
                      height: 2,
                      background: isComplete ? "#30D158" : "var(--border)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
          <div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              {lifecycle.days_since_peak === 0
                ? "Today"
                : lifecycle.days_since_peak}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                letterSpacing: "0.10em",
                color: "var(--ink-tertiary)",
              }}
            >
              {lifecycle.days_since_peak === 0
                ? "At peak now"
                : "Days since peak"}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              {lifecycle.current_velocity}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                letterSpacing: "0.10em",
                color: "var(--ink-tertiary)",
              }}
            >
              Current velocity
            </div>
          </div>
        </div>

        {/* Insight */}
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
            {lifecycle.insight}
          </div>
        </div>
      </div>
    </div>
  );
}
