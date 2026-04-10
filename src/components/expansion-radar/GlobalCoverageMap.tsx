import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  geoNaturalEarth1,
  geoPath,
  geoGraticule10,
  type GeoPermissibleObjects,
} from "d3-geo";
import {
  countryFlag,
  formatNumber,
  velocityArrow,
  velocityColor,
  discoveryDotColor,
} from "./utils";
import type { ExpansionRadarResponse } from "./types";
import type { EnrichedMarketIntel } from "./useMarketIntelligence";
import landRings from "./land110m.json";

interface GlobalCoverageMapProps {
  activeMarkets: ExpansionRadarResponse["active_markets"];
  opportunities: ExpansionRadarResponse["expansion_opportunities"];
  marketHeat: ExpansionRadarResponse["market_heat"];
  discoveryRadar: ExpansionRadarResponse["discovery_radar"];
  marketIntel?: Map<string, EnrichedMarketIntel>;
}

// Country centroids [lat, lng]
const CENTROIDS: Record<string, [number, number]> = {
  US: [39.8, -98.5],
  CA: [56.1, -106.3],
  MX: [23.6, -102.6],
  BR: [-14.2, -51.9],
  AR: [-34.6, -58.4],
  CL: [-35.7, -71.5],
  CO: [4.6, -74.1],
  PE: [-9.2, -75.0],
  VE: [6.4, -66.6],
  EC: [-1.8, -78.2],
  BO: [-16.3, -63.6],
  PY: [-23.4, -58.4],
  UY: [-32.5, -55.8],
  CR: [10.0, -84.1],
  PA: [8.5, -80.8],
  GT: [15.8, -90.2],
  HN: [15.2, -86.2],
  SV: [13.8, -88.9],
  NI: [12.9, -85.2],
  DO: [18.7, -70.2],
  JM: [18.1, -77.3],
  TT: [10.7, -61.2],
  GB: [54.0, -2.0],
  DE: [51.2, 10.4],
  FR: [46.6, 2.2],
  ES: [40.5, -3.7],
  IT: [41.9, 12.6],
  PT: [39.4, -8.2],
  NL: [52.1, 5.3],
  BE: [50.8, 4.0],
  CH: [46.8, 8.2],
  AT: [47.3, 13.3],
  SE: [60.1, 18.6],
  NO: [60.5, 8.5],
  DK: [56.3, 9.5],
  FI: [61.9, 25.7],
  IE: [53.1, -8.2],
  PL: [51.9, 19.1],
  CZ: [49.8, 15.5],
  HU: [47.2, 19.5],
  RO: [45.9, 25.0],
  BG: [42.7, 25.5],
  GR: [39.1, 21.8],
  HR: [45.1, 15.2],
  SK: [48.7, 19.7],
  SI: [46.2, 14.8],
  RS: [44.0, 21.0],
  EE: [58.6, 25.0],
  LV: [56.9, 24.1],
  LT: [55.2, 23.9],
  IS: [65.0, -19.0],
  LU: [49.8, 6.1],
  MT: [35.9, 14.4],
  CY: [35.1, 33.4],
  AL: [41.3, 20.2],
  MK: [41.5, 21.7],
  BY: [53.7, 27.9],
  UA: [48.4, 31.2],
  RU: [55.8, 37.6],
  TR: [39.0, 35.2],
  IL: [31.0, 34.9],
  SA: [23.9, 45.1],
  AE: [24.0, 54.0],
  QA: [25.3, 51.2],
  KW: [29.3, 47.5],
  JO: [30.6, 36.2],
  LB: [33.9, 35.9],
  OM: [21.5, 55.9],
  EG: [26.8, 30.8],
  MA: [31.8, -7.1],
  DZ: [28.0, 1.7],
  TN: [34.0, 9.5],
  NG: [9.1, 7.5],
  GH: [7.9, -1.0],
  KE: [-0.0, 37.9],
  ZA: [-29.0, 24.0],
  UG: [1.4, 32.3],
  TZ: [-6.4, 34.9],
  SN: [14.5, -14.4],
  IN: [20.6, 78.9],
  PK: [30.4, 69.3],
  KZ: [48.0, 67.0],
  CN: [35.9, 104.2],
  JP: [36.2, 138.3],
  KR: [36.0, 128.0],
  TW: [23.7, 121.0],
  HK: [22.3, 114.2],
  SG: [1.4, 103.8],
  MY: [4.2, 101.9],
  TH: [15.9, 100.5],
  VN: [14.1, 108.3],
  PH: [12.9, 121.8],
  ID: [-0.8, 113.9],
  AU: [-25.3, 133.8],
  NZ: [-40.9, 174.9],
  AD: [42.5, 1.5],
  BA: [43.9, 17.7],
  ME: [42.7, 19.4],
  BH: [26.0, 50.5],
};

const MAP_W = 960;
const MAP_H = 500;

function buildLandGeoJSON(): GeoPermissibleObjects {
  const rings = landRings as [number, number][][];
  const filtered = rings.filter((ring) => !ring.every(([lat]) => lat < -60));
  const polygons = filtered.map((ring) => [
    ring.map(([lat, lng]) => [lng, lat] as [number, number]),
  ]);
  return {
    type: "MultiPolygon",
    coordinates: polygons,
  } as GeoPermissibleObjects;
}

type VelocityType = "surging" | "rising" | "stable" | "declining" | "exiting";

export default function GlobalCoverageMap({
  activeMarkets,
  opportunities,
  marketHeat,
  discoveryRadar,
  marketIntel,
}: GlobalCoverageMapProps) {
  const [hovered, setHovered] = useState<{
    code: string;
    name: string;
    type: "active" | "opportunity" | "tracked" | "pre_breakout";
    detail: string;
    svgX: number;
    svgY: number;
  } | null>(null);

  const projection = useMemo(() => {
    return geoNaturalEarth1()
      .scale(210)
      .translate([MAP_W / 2, MAP_H / 2 + 20])
      .precision(0.1);
  }, []);

  const { landPath, graticulePath } = useMemo(() => {
    const pathGen = geoPath(projection);
    const land = buildLandGeoJSON();
    const graticule = geoGraticule10();
    return {
      landPath: pathGen(land) || "",
      graticulePath: pathGen(graticule) || "",
    };
  }, [projection]);

  // Build lookup maps
  const activeMap = new Map(activeMarkets.map((m) => [m.country_code, m]));
  const oppMap = new Map(opportunities.map((o) => [o.country_code, o]));
  const discoveryMap = new Map(discoveryRadar.map((d) => [d.country_code, d]));
  const allTracked = new Set([
    ...activeMarkets.map((m) => m.country_code),
    ...opportunities.map((o) => o.country_code),
    ...marketHeat.map((h) => h.country_code),
  ]);

  const maxStreams = Math.max(
    ...activeMarkets.map(
      (m) => m.estimated_monthly_streams || m.chart_streams || 0,
    ),
    1,
  );
  const maxScore = Math.max(
    ...opportunities.map((o) => o.opportunity_score ?? 0),
    1,
  );

  type DotData = {
    code: string;
    name: string;
    cx: number;
    cy: number;
    r: number;
    type: "active" | "opportunity" | "tracked" | "pre_breakout";
    color: string;
    velocity: VelocityType | null;
    detail: string;
    arbRoi: number | null;
  };

  const dots: DotData[] = [];

  allTracked.forEach((code) => {
    const centroid = CENTROIDS[code];
    if (!centroid) return;

    const projected = projection([centroid[1], centroid[0]]);
    if (!projected) return;
    const [cx, cy] = projected;

    const active = activeMap.get(code);
    const opp = oppMap.get(code);
    const disc = discoveryMap.get(code);
    const isPreBreakout =
      disc &&
      (disc.signal_type === "pre_breakout" ||
        disc.signal_type === "early_demand");

    const intel = marketIntel?.get(code);
    const arbRoi = intel?.roi_vs_us ?? null;
    const roiTag =
      arbRoi && arbRoi > 1.5 ? ` \u00b7 ${arbRoi.toFixed(1)}\u00d7 ROI` : "";

    if (active) {
      const streams =
        active.estimated_monthly_streams || active.chart_streams || 0;
      const r = 2 + (streams / maxStreams) * 4;
      const color = isPreBreakout
        ? "#0A84FF"
        : discoveryDotColor(active.discovery_signal_type ?? "", true);
      const vel = active.velocity ?? "stable";
      const streamsPart =
        streams > 0 ? ` \u00b7 ${formatNumber(streams)} streams` : "";
      dots.push({
        code,
        name: active.country_name,
        cx,
        cy,
        r: Math.min(r, 6),
        type: isPreBreakout ? "pre_breakout" : "active",
        color,
        velocity: vel as VelocityType,
        detail: `${active.market_strength ?? "active"} \u00b7 ${velocityArrow(vel as VelocityType)} ${vel}${streamsPart}${roiTag}`,
        arbRoi,
      });
    } else if (opp) {
      const score = opp.opportunity_score ?? 0;
      const r = 2 + (score / maxScore) * 3;
      const color = isPreBreakout
        ? "#0A84FF"
        : discoveryDotColor(opp.discovery_signal_type ?? "", false);
      const vel = opp.velocity ?? "stable";
      dots.push({
        code,
        name: opp.country_name,
        cx,
        cy,
        r: Math.min(r, 5),
        type: isPreBreakout ? "pre_breakout" : "opportunity",
        color,
        velocity: vel as VelocityType,
        detail: `Score ${score.toFixed(0)} \u00b7 ${velocityArrow(vel as VelocityType)} ${vel}${roiTag}${opp.entry_song ? ` \u00b7 Push "${opp.entry_song.name}"` : ""}`,
        arbRoi,
      });
    } else {
      const heat = marketHeat.find((h) => h.country_code === code);
      dots.push({
        code,
        name: heat?.country_name ?? code,
        cx,
        cy,
        r: 1.5,
        type: "tracked",
        color: "rgba(255,255,255,0.2)",
        velocity: null,
        detail: "Tracked, no signal",
        arbRoi,
      });
    }
  });

  dots.sort((a, b) => {
    const order = { tracked: 0, active: 1, opportunity: 2, pre_breakout: 3 };
    return order[a.type] - order[b.type];
  });

  const activeCount = dots.filter((d) => d.type === "active").length;
  const oppCount = dots.filter((d) => d.type === "opportunity").length;
  const trackedCount = dots.filter((d) => d.type === "tracked").length;
  const preBreakoutCount = dots.filter((d) => d.type === "pre_breakout").length;

  // Arcs from strongest active market to top opportunity markets
  const arcs = useMemo(() => {
    const activeDots = dots.filter(
      (d) => d.type === "active" || d.type === "pre_breakout",
    );
    const oppDots = dots.filter((d) => d.type === "opportunity");
    if (!activeDots.length || !oppDots.length) return [];
    const origin = activeDots.reduce((a, b) => (a.r > b.r ? a : b));
    return oppDots.slice(0, 6).map((target) => {
      const mx = (origin.cx + target.cx) / 2;
      const my = (origin.cy + target.cy) / 2 - 30;
      return `M${origin.cx},${origin.cy} Q${mx},${my} ${target.cx},${target.cy}`;
    });
  }, [dots]);

  // Tooltip positioning with edge clamping
  const tooltipStyle = useMemo(() => {
    if (!hovered) return {};
    const xPct = (hovered.svgX / MAP_W) * 100;
    const yPct = (hovered.svgY / MAP_H) * 100;
    const flipBelow = hovered.svgY < 80;
    const clampedX = Math.max(12, Math.min(88, xPct));
    return {
      position: "absolute" as const,
      left: `${clampedX}%`,
      top: `${yPct}%`,
      transform: flipBelow
        ? "translate(-50%, 16px)"
        : "translate(-50%, -100%) translateY(-14px)",
      background: "rgba(20, 20, 24, 0.95)",
      backdropFilter: "blur(12px)",
      border: `1px solid ${
        hovered.type === "active"
          ? "rgba(52,211,153,0.2)"
          : hovered.type === "pre_breakout"
            ? "rgba(10,132,255,0.3)"
            : hovered.type === "opportunity"
              ? "rgba(232,67,10,0.2)"
              : "rgba(255,255,255,0.08)"
      }`,
      borderRadius: 10,
      padding: "8px 14px",
      pointerEvents: "none" as const,
      zIndex: 10,
      whiteSpace: "nowrap" as const,
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    };
  }, [hovered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
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
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.10em",
          }}
        >
          Global Coverage
        </span>
      </div>

      <div
        style={{
          position: "relative",
          background:
            "linear-gradient(180deg, #080c14 0%, #0a0e18 50%, #060a10 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Radial glow behind map */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            background:
              "radial-gradient(ellipse, rgba(232,67,10,0.04) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Scan lines overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* SVG map */}
        <div style={{ position: "relative", padding: "16px 24px 12px" }}>
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            style={{ width: "100%", display: "block" }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter
                id="gcm-dotGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="gcm-oppGlow"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="gcm-preBreakoutGlow"
                x="-150%"
                y="-150%"
                width="400%"
                height="400%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient
                id="gcm-landFill"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
              </linearGradient>
            </defs>

            {/* Graticule grid */}
            <path
              d={graticulePath}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="0.5"
            />

            {/* Land masses */}
            <path
              d={landPath}
              fill="url(#gcm-landFill)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.7"
              strokeLinejoin="round"
            />
            <path
              d={landPath}
              fill="none"
              stroke="rgba(232,67,10,0.04)"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Arcs from strongest market to opportunities */}
            {arcs.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#e8430a"
                strokeWidth="1"
                strokeDasharray="6,4"
                opacity={0.3}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-20"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            ))}

            {/* Dots */}
            {dots.map((dot) => {
              const isPreBreakout = dot.type === "pre_breakout";
              const isOpp = dot.type === "opportunity";
              const isActive = dot.type === "active";
              const isHovered = hovered?.code === dot.code;

              return (
                <g
                  key={dot.code}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() =>
                    setHovered({
                      code: dot.code,
                      name: dot.name,
                      type: dot.type,
                      detail: dot.detail,
                      svgX: dot.cx,
                      svgY: dot.cy,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Pre-breakout radar ping */}
                  {isPreBreakout && (
                    <>
                      <circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r={dot.r * 4}
                        fill="none"
                        stroke="#0A84FF"
                        strokeWidth="0.5"
                        opacity="0"
                      >
                        <animate
                          attributeName="r"
                          values={`${dot.r};${dot.r * 5}`}
                          dur="2.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;0"
                          dur="2.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r={dot.r * 3}
                        fill="none"
                        stroke="#0A84FF"
                        strokeWidth="0.5"
                        opacity="0"
                      >
                        <animate
                          attributeName="r"
                          values={`${dot.r};${dot.r * 4}`}
                          dur="2.5s"
                          begin="0.8s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.4;0"
                          dur="2.5s"
                          begin="0.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}

                  {/* Pulse ring for opportunities */}
                  {isOpp && !isPreBreakout && (
                    <circle
                      cx={dot.cx}
                      cy={dot.cy}
                      r={dot.r * 2.5}
                      fill="none"
                      stroke={dot.color}
                      strokeWidth="0.6"
                      opacity="0.3"
                    >
                      <animate
                        attributeName="r"
                        values={`${dot.r * 1.2};${dot.r * 2.5};${dot.r * 1.2}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0.1;0.4"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Glow halo */}
                  <circle
                    cx={dot.cx}
                    cy={dot.cy}
                    r={dot.r * (isPreBreakout ? 3 : 2)}
                    fill={dot.color}
                    opacity={isHovered ? 0.3 : isPreBreakout ? 0.2 : 0.1}
                    filter={
                      isPreBreakout
                        ? "url(#gcm-preBreakoutGlow)"
                        : isOpp
                          ? "url(#gcm-oppGlow)"
                          : isActive
                            ? "url(#gcm-dotGlow)"
                            : undefined
                    }
                  />

                  {/* Arbitrage ring — green ring for high-ROI markets */}
                  {dot.arbRoi !== null &&
                    dot.arbRoi >= 2 &&
                    dot.type !== "tracked" && (
                      <circle
                        cx={dot.cx}
                        cy={dot.cy}
                        r={dot.r * 1.8}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="0.7"
                        opacity={isHovered ? 0.8 : 0.5}
                        strokeDasharray={dot.arbRoi >= 3 ? "none" : "2,2"}
                      />
                    )}

                  {/* Main dot */}
                  <circle
                    cx={dot.cx}
                    cy={dot.cy}
                    r={isHovered ? dot.r * 1.3 : dot.r}
                    fill={dot.color}
                    opacity={dot.type === "tracked" ? 0.4 : 1}
                    style={{ transition: "r 200ms" }}
                  />

                  {/* Highlight spec */}
                  {dot.type !== "tracked" && (
                    <circle
                      cx={dot.cx - dot.r * 0.25}
                      cy={dot.cy - dot.r * 0.25}
                      r={dot.r * 0.25}
                      fill="rgba(255,255,255,0.35)"
                    />
                  )}

                  {/* Velocity arrow */}
                  {dot.velocity &&
                    dot.velocity !== "stable" &&
                    dot.type !== "tracked" && (
                      <text
                        x={dot.cx + dot.r + 2}
                        y={dot.cy + 1}
                        fill={velocityColor(dot.velocity)}
                        fontSize={dot.velocity === "surging" ? 8 : 7}
                        fontFamily="sans-serif"
                        fontWeight="700"
                        textAnchor="start"
                        dominantBaseline="middle"
                      >
                        {velocityArrow(dot.velocity)}
                      </text>
                    )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip overlay */}
          {hovered && (
            <div style={tooltipStyle}>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      hovered.type === "active"
                        ? "#34d399"
                        : hovered.type === "pre_breakout"
                          ? "#0A84FF"
                          : hovered.type === "opportunity"
                            ? "#e8430a"
                            : "rgba(255,255,255,0.3)",
                    boxShadow: `0 0 6px ${
                      hovered.type === "active"
                        ? "#34d399"
                        : hovered.type === "pre_breakout"
                          ? "#0A84FF"
                          : hovered.type === "opportunity"
                            ? "#e8430a"
                            : "transparent"
                    }`,
                  }}
                />
                {countryFlag(hovered.code)} {hovered.name}
                {hovered.type === "pre_breakout" && (
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 8,
                      fontWeight: 700,
                      color: "#0A84FF",
                      background: "rgba(10,132,255,0.15)",
                      padding: "1px 5px",
                      borderRadius: 3,
                      letterSpacing: "0.06em",
                      animation: "preBreakoutPulse 2s ease-in-out infinite",
                    }}
                  >
                    PRE-BREAKOUT
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color:
                    hovered.type === "active"
                      ? "#34d399"
                      : hovered.type === "pre_breakout"
                        ? "#0A84FF"
                        : hovered.type === "opportunity"
                          ? "#e8430a"
                          : "var(--ink-tertiary)",
                  marginTop: 2,
                }}
              >
                {hovered.detail}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px 20px",
            padding: "12px 24px 16px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px 20px",
            }}
          >
            {[
              { color: "#34d399", label: `Active markets (${activeCount})` },
              {
                color: "#e8430a",
                label: `Expansion opportunities (${oppCount})`,
              },
              ...(preBreakoutCount > 0
                ? [
                    {
                      color: "#0A84FF",
                      label: `Pre-breakout signals (${preBreakoutCount})`,
                    },
                  ]
                : []),
              {
                color: "rgba(255,255,255,0.2)",
                label: `Tracked, no signal (${trackedCount})`,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: item.color,
                    boxShadow:
                      item.color !== "rgba(255,255,255,0.2)"
                        ? `0 0 6px ${item.color}60`
                        : undefined,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}

            {/* Arbitrage ring legend */}
            {marketIntel && marketIntel.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "transparent",
                    border: "1.5px solid #34d399",
                  }}
                />
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  High arbitrage (2×+ ROI)
                </span>
              </div>
            )}
          </div>

          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(255,255,255,0.10)",
            }}
          >
            110m Natural Earth
          </span>
        </div>
      </div>

      <style>{`
        @keyframes preBreakoutPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </motion.div>
  );
}
