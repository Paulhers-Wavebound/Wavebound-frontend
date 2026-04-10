import { useState, useCallback, useEffect, useRef, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Globe, RefreshCw } from "lucide-react";
import PulseGlobe from "@/components/pulse/PulseGlobe";
import type { ViewMode } from "@/components/pulse/PulseGlobe";
import LiveCounter from "@/components/pulse/LiveCounter";
import CountrySidebar from "@/components/pulse/CountrySidebar";
import ArbitrageLeaderboard from "@/components/pulse/ArbitrageLeaderboard";
import {
  usePulseGlobeData,
  usePulseArbitrageData,
  getCountryArbitrage,
} from "@/hooks/use-pulse-data";

/* ─── Error boundary for WebGL globe ──────────────────────────── */

interface EBProps {
  children: ReactNode;
  onReset?: () => void;
}
interface EBState {
  error: Error | null;
}

class GlobeErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Globe rendering error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 16,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          <Globe size={48} style={{ color: "rgba(255,255,255,0.15)" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Globe failed to render
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 12,
              maxWidth: 400,
              textAlign: "center",
            }}
          >
            {this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "8px 16px",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── View mode toggle buttons ───────────────────────────────── */

const VIEW_MODES: { key: ViewMode; icon: string; label: string }[] = [
  { key: "activity", icon: "", label: "Activity" },
  { key: "arbitrage", icon: "", label: "Arbitrage" },
];

function ViewModeToggle({
  active,
  onChange,
}: {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 8,
        padding: 2,
      }}
    >
      {VIEW_MODES.map((mode) => {
        const isActive = active === mode.key;
        return (
          <button
            key={mode.key}
            onClick={() => onChange(mode.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
              color: isActive ? "#e2e8f0" : "rgba(255,255,255,0.45)",
              transition: "all 150ms",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 13 }}>{mode.icon}</span>
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */

export default function ThePulse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [globeKey, setGlobeKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("activity");
  const [leaderboardHover, setLeaderboardHover] = useState<string | null>(null);

  // Deep-link from Expansion Radar: ?mode=arbitrage&country=NG
  useEffect(() => {
    const mode = searchParams.get("mode");
    const country = searchParams.get("country");
    if (mode === "arbitrage") setViewMode("arbitrage");
    if (country) setSelectedCountry(country.toUpperCase());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: globeData, isLoading, error } = usePulseGlobeData();
  const { data: arbitrageData } = usePulseArbitrageData(
    viewMode === "arbitrage",
  );

  // Track container size for responsive globe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCountryClick = useCallback((code: string) => {
    setSelectedCountry(code);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedCountry(null);
  }, []);

  const handleGlobeReset = useCallback(() => {
    setGlobeKey((k) => k + 1);
  }, []);

  // Get arbitrage detail for selected country
  const selectedArbitrage = selectedCountry
    ? (getCountryArbitrage(selectedCountry) ?? null)
    : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          zIndex: 10,
          flexShrink: 0,
          background: "rgba(10, 10, 15, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => navigate("/label")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 6,
            marginRight: 16,
            transition: "color 150ms, background 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            e.currentTarget.style.background = "none";
          }}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Globe size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
          <h1
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#e2e8f0",
              margin: 0,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            The Pulse
          </h1>
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            Live Music Intelligence
          </span>
        </div>

        {/* View mode toggle — right side of header */}
        <div style={{ marginLeft: "auto" }}>
          <ViewModeToggle active={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Globe viewport */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Loading intelligence data...
            </div>
          </div>
        )}

        {error && !globeData && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              zIndex: 5,
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              Failed to load globe data
            </p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
              {(error as Error).message}
            </p>
          </div>
        )}

        {globeData && dimensions.width > 0 && dimensions.height > 0 && (
          <GlobeErrorBoundary onReset={handleGlobeReset}>
            <PulseGlobe
              key={globeKey}
              countries={globeData.countries}
              flows={globeData.flows}
              onCountryClick={handleCountryClick}
              width={dimensions.width}
              height={dimensions.height}
              viewMode={viewMode}
            />
          </GlobeErrorBoundary>
        )}

        {/* Arbitrage leaderboard — left panel */}
        {viewMode === "arbitrage" && arbitrageData && (
          <ArbitrageLeaderboard
            data={arbitrageData}
            onCountrySelect={handleCountryClick}
            hoveredCountry={leaderboardHover}
            onCountryHover={setLeaderboardHover}
          />
        )}

        {/* Country detail sidebar */}
        <CountrySidebar
          countryCode={selectedCountry}
          onClose={handleCloseSidebar}
          arbitrage={viewMode === "arbitrage" ? selectedArbitrage : undefined}
        />

        {/* Live counter bar */}
        {globeData && (
          <LiveCounter
            counters={globeData.counters}
            alerts={globeData.alerts}
            viewMode={viewMode}
            arbitrageData={viewMode === "arbitrage" ? arbitrageData : undefined}
          />
        )}
      </div>
    </div>
  );
}
