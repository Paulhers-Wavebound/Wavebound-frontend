import { useEffect, useRef, useState } from "react";
import type { GlobeCounters, GlobeAlert, ArbitrageData } from "@/types/pulse";
import { ALERT_ICONS, ARBITRAGE_COLORS } from "./pulseConstants";
import type { ViewMode } from "./PulseGlobe";

interface LiveCounterProps {
  counters: GlobeCounters;
  alerts: GlobeAlert[];
  viewMode?: ViewMode;
  arbitrageData?: ArbitrageData | null;
}

/** Animated number that counts up from 0 to target on mount */
function AnimatedNumber({
  value,
  duration = 1800,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;

    const step = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export default function LiveCounter({
  counters,
  alerts,
  viewMode = "activity",
  arbitrageData,
}: LiveCounterProps) {
  const [alertIndex, setAlertIndex] = useState(0);

  // Cycle alerts every 4 seconds
  useEffect(() => {
    if (alerts.length <= 1) return;
    const interval = setInterval(() => {
      setAlertIndex((i) => (i + 1) % alerts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  const currentAlert = alerts[alertIndex];
  const isArbitrage = viewMode === "arbitrage" && arbitrageData;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "16px 24px",
        zIndex: 20,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Arbitrage hero insight row */}
      {isArbitrage && arbitrageData?.hero_insight && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <span style={{ fontSize: 14 }}>{""}</span>
          <span style={{ fontWeight: 600, color: ARBITRAGE_COLORS.HIGH }}>
            TOP OPPORTUNITY:
          </span>
          <span>
            {arbitrageData.hero_insight.country_name} —{" "}
            <span style={{ color: ARBITRAGE_COLORS.HIGH, fontWeight: 600 }}>
              {arbitrageData.hero_insight.roi_vs_us}×
            </span>{" "}
            ROI vs US · ${arbitrageData.hero_insight.avg_cpm} CPM ·{" "}
            {arbitrageData.hero_insight.active_songs} songs accelerating
          </span>
        </div>
      )}

      {/* Counters row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Pulsing live dot */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginRight: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#EF4444",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#EF4444",
              textTransform: "uppercase",
            }}
          >
            Live
          </span>
        </span>

        <CounterItem value={counters.total_songs} label="songs" />
        <Dot />
        <CounterItem value={counters.total_countries} label="countries" />

        {isArbitrage && arbitrageData?.opportunity_buckets ? (
          <>
            <Dot />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
              <span
                style={{
                  fontWeight: 600,
                  color: ARBITRAGE_COLORS.HIGH,
                }}
              >
                {arbitrageData.opportunity_buckets.high}
              </span>{" "}
              <span style={{ color: "rgba(255,255,255,0.45)" }}>HIGH</span>
            </span>
            <Dot />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
              <span
                style={{
                  fontWeight: 600,
                  color: ARBITRAGE_COLORS.MEDIUM,
                }}
              >
                {arbitrageData.opportunity_buckets.medium}
              </span>{" "}
              <span style={{ color: "rgba(255,255,255,0.45)" }}>MEDIUM</span>
            </span>
            <Dot />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              markets
            </span>
          </>
        ) : (
          <>
            <Dot />
            <CounterItem value={counters.total_platforms} label="platforms" />
            <Dot />
            <CounterItem
              value={counters.total_observations}
              label="observations today"
            />
            <Dot />
            <CounterItem value={counters.total_artists} label="artists" />
          </>
        )}

        {/* Alert ticker — right-aligned (activity mode only) */}
        {!isArbitrage && currentAlert && (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
              maxWidth: 500,
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>
              {ALERT_ICONS[currentAlert.type] ?? "\u26A1"}
            </span>
            <span
              key={currentAlert.id}
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                animation: "fade-in-alert 400ms ease-out",
              }}
            >
              {currentAlert.message}
            </span>
          </div>
        )}
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
        @keyframes fade-in-alert {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function CounterItem({ value, label }: { value: number; label: string }) {
  return (
    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        <AnimatedNumber value={value} />
      </span>{" "}
      <span style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
    </span>
  );
}

function Dot() {
  return (
    <span
      style={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.2)",
        flexShrink: 0,
      }}
    />
  );
}
