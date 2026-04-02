/**
 * GeoMap wrapper — attempts 3D globe, falls back to flat SVG map on error.
 *
 * The Three.js stack (fiber + drei + three) is loaded lazily so that
 * any version-mismatch crash is caught by the local ErrorBoundary
 * instead of white-screening the whole page.
 */
import React, { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import type { CityData } from "./mockData";
import GeoMapFlat from "./GeoMapFlat";

// ── Lazy 3D globe — only loaded when this component mounts ──
const GeoMap3D = lazy(() => import("./GeoMap3D"));

// ── Inline error boundary (no external dep) ──
interface EBState {
  hasError: boolean;
}

class GlobeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  EBState
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(
      "[GeoMap] 3D globe failed to load, using flat map:",
      error.message,
    );
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ── Loading skeleton ──
function GlobeLoadingSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
      <div
        style={{
          background: "#0a0a0c",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          minHeight: 480,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(232,67,10,0.3)",
            borderTopColor: "#e8430a",
            animation: "globeSpin 1s linear infinite",
          }}
        />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Loading globe...
        </span>
        <style>{`@keyframes globeSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div
        style={{
          background: "#1C1C1E",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 20,
        }}
      />
    </div>
  );
}

// ── Main export ──
interface GeoMapProps {
  cities: CityData[];
  onSelectMarket?: (market: string | null) => void;
}

export default function GeoMap({ cities, onSelectMarket }: GeoMapProps) {
  const flatFallback = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <GeoMapFlat cities={cities} onSelectCity={(m) => onSelectMarket?.(m)} />
    </motion.div>
  );

  return (
    <GlobeErrorBoundary fallback={flatFallback}>
      <Suspense fallback={<GlobeLoadingSkeleton />}>
        <GeoMap3D cities={cities} onSelectMarket={onSelectMarket} />
      </Suspense>
    </GlobeErrorBoundary>
  );
}
