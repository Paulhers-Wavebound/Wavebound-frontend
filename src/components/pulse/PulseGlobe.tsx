import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Globe from "react-globe.gl";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { GlobeCountry, FlowArc } from "@/types/pulse";
import {
  genreColor,
  NUMERIC_TO_ISO2,
  ARBITRAGE_COLORS,
} from "./pulseConstants";
import { getCountryCoords } from "./mockPulseData";
import { getArbitrageScore } from "./mockArbitrageData";
import worldAtlas from "./countries-110m.json";
import earthNightUrl from "./earth-night.jpg";

export type ViewMode = "activity" | "arbitrage" | "genre_waves";

interface PulseGlobeProps {
  countries: GlobeCountry[];
  flows: FlowArc[];
  onCountryClick: (countryCode: string) => void;
  width: number;
  height: number;
  viewMode?: ViewMode;
}

interface EnrichedFeature {
  geometry: Geometry;
  properties: {
    iso2: string;
    name: string;
  };
  pulseData?: GlobeCountry;
}

interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  label: string;
  stroke: number;
  dashGap: number;
  animateTime: number;
}

export default function PulseGlobe({
  countries,
  flows,
  onCountryClick,
  width,
  height,
  viewMode = "activity",
}: PulseGlobeProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [geoFeatures, setGeoFeatures] = useState<EnrichedFeature[]>([]);
  // Use ref for hover to avoid recreating hex accessors on every hover
  const hoveredRef = useRef<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Build lookup from country_code → GlobeCountry
  const countryMap = useMemo(() => {
    const map = new Map<string, GlobeCountry>();
    for (const c of countries) map.set(c.country_code, c);
    return map;
  }, [countries]);

  // Cache raw atlas features — fetch once, reuse across data updates
  const [rawAtlasFeatures, setRawAtlasFeatures] = useState<
    { geometry: Geometry; numericId: string; name: string; iso2: string }[]
  >([]);

  // Parse bundled world atlas data
  const parseAtlas = useCallback(() => {
    const topo = worldAtlas as unknown as Topology<{
      countries: GeometryCollection;
    }>;
    const geo = feature(
      topo,
      topo.objects.countries,
    ) as unknown as FeatureCollection;

    const raw = geo.features
      .map((f: Feature) => {
        const numericId = String(f.id ?? "");
        const iso2 = NUMERIC_TO_ISO2[numericId] ?? "";
        return {
          geometry: f.geometry,
          numericId,
          name: (f.properties?.name as string) ?? iso2,
          iso2,
        };
      })
      .filter((f) => f.iso2);

    setRawAtlasFeatures(raw);
  }, []);

  useEffect(() => {
    parseAtlas();
  }, [parseAtlas]);

  // Merge atlas geometry with pulse country data (recomputes when either changes)
  useEffect(() => {
    if (rawAtlasFeatures.length === 0) return;
    const enriched: EnrichedFeature[] = rawAtlasFeatures.map((f) => ({
      geometry: f.geometry,
      properties: { iso2: f.iso2, name: f.name },
      pulseData: countryMap.get(f.iso2),
    }));
    setGeoFeatures(enriched);
  }, [rawAtlasFeatures, countryMap]);

  // Setup globe controls after mount
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.minDistance = 180;
      controls.maxDistance = 500;
    }

    // Initial camera position — Atlantic-centered view
    globe.pointOfView({ lat: 20, lng: -20, altitude: 2.2 }, 0);
  }, [geoFeatures]);

  // Keep rotating always — never pause on hover

  // ── Build arc data from flows (hidden in Activity view — too noisy) ──
  const arcsData = useMemo<ArcDatum[]>(() => {
    if (viewMode === "activity") return [];
    const arcs: ArcDatum[] = [];
    const topFlows = flows.slice(0, 8);
    for (const flow of topFlows) {
      for (let i = 0; i < flow.path.length - 1; i++) {
        const from = getCountryCoords(flow.path[i].country_code);
        const to = getCountryCoords(flow.path[i + 1].country_code);
        arcs.push({
          startLat: from.lat,
          startLng: from.lng,
          endLat: to.lat,
          endLng: to.lng,
          color: hexToRgba(genreColor(flow.genre), 0.35),
          label: escHtml(`${flow.song_name} — ${flow.artist_name}`),
          stroke: 0.15,
          dashGap: 0.6,
          animateTime: 3000 + Math.random() * 2000,
        });
      }
    }
    return arcs;
  }, [flows, viewMode]);

  // ── Hex polygon accessors ──
  const hexGeoJson = useCallback(
    (d: object) => (d as EnrichedFeature).geometry,
    [],
  );

  const hexColor = useCallback(
    (d: object) => {
      const feat = d as EnrichedFeature;
      const iso = feat.properties.iso2;
      const data = feat.pulseData;

      if (!data) return "rgba(255,255,255,0.02)";

      if (viewMode === "arbitrage") {
        const arb = getArbitrageScore(iso);
        if (!arb) return "rgba(107,114,128,0.12)";
        const baseColor = ARBITRAGE_COLORS[arb.label];
        const alpha =
          arb.label === "HIGH" ? 0.7 : arb.label === "MEDIUM" ? 0.45 : 0.2;
        return hexToRgba(baseColor, alpha);
      }

      const baseColor = genreColor(data.dominant_genre);
      const alpha = 0.25 + data.activity_score * 0.5;

      return hexToRgba(baseColor, alpha);
    },
    [viewMode],
  );

  const hexAltitude = useCallback(
    (d: object) => {
      const feat = d as EnrichedFeature;
      if (!feat.pulseData) return 0.001;
      const iso = feat.properties.iso2;

      if (viewMode === "arbitrage") {
        const arb = getArbitrageScore(iso);
        if (!arb) return 0.001;
        return (arb.score / 100) * 0.06;
      }

      return 0.005 + feat.pulseData.activity_score * 0.02;
    },
    [viewMode],
  );

  const hexLabel = useCallback(
    (d: object) => {
      const feat = d as EnrichedFeature;
      const data = feat.pulseData;
      if (!data) return "";
      const name = escHtml(data.country_name);
      const genre = escHtml(capitalize(data.dominant_genre));

      if (viewMode === "arbitrage") {
        const arb = getArbitrageScore(feat.properties.iso2);
        if (!arb) return "";
        const color = ARBITRAGE_COLORS[arb.label];
        return `
          <div style="
            background: rgba(10,10,15,0.92);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 10px;
            padding: 10px 14px;
            font-family: 'DM Sans', system-ui, sans-serif;
            min-width: 220px;
            backdrop-filter: blur(12px);
          ">
            <div style="font-size:14px; font-weight:600; color:#e2e8f0; margin-bottom:6px;">
              ${name}
            </div>
            <div style="font-size:12px; color:rgba(255,255,255,0.55); line-height:1.6;">
              Arbitrage Score: <span style="color:${color}; font-weight:600;">${arb.score}</span><br/>
              ${data.song_count.toLocaleString()} songs &middot; ${data.platform_count} platforms
            </div>
          </div>
        `;
      }

      return `
        <div style="
          background: rgba(10,10,15,0.92);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 10px 14px;
          font-family: 'DM Sans', system-ui, sans-serif;
          min-width: 200px;
          backdrop-filter: blur(12px);
        ">
          <div style="font-size:14px; font-weight:600; color:#e2e8f0; margin-bottom:6px;">
            ${name}
          </div>
          <div style="font-size:12px; color:rgba(255,255,255,0.55); line-height:1.6;">
            ${data.song_count.toLocaleString()} songs &middot; ${data.platform_count} platforms<br/>
            Dominant: <span style="color:${genreColor(data.dominant_genre)}; font-weight:500;">${genre}</span><br/>
            ${data.new_entries} new entries today
          </div>
        </div>
      `;
    },
    [viewMode],
  );

  const handleHexHover = useCallback((poly: object | null) => {
    const feat = poly as EnrichedFeature | null;
    const iso = feat?.properties?.iso2 ?? null;
    hoveredRef.current = iso;
    setHoveredCountry(iso);
  }, []);

  const handleHexClick = useCallback(
    (poly: object) => {
      const feat = poly as EnrichedFeature;
      const iso = feat.properties?.iso2;
      if (iso) onCountryClick(iso);
    },
    [onCountryClick],
  );

  // ── Arc accessors ──
  const arcLabel = useCallback((d: object) => {
    const arc = d as ArcDatum;
    return `<div style="
        background:rgba(10,10,15,0.88);
        border:1px solid rgba(255,255,255,0.1);
        border-radius:8px;
        padding:6px 10px;
        font-family:'DM Sans',system-ui,sans-serif;
        font-size:12px;
        color:#e2e8f0;
      ">${arc.label}</div>`;
  }, []);

  // ── Loading state ──
  if (!geoFeatures.length) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 14,
          }}
        >
          Loading globe data...
        </div>
      </div>
    );
  }

  return (
    <Globe
      ref={globeRef}
      width={width}
      height={height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={earthNightUrl}
      showAtmosphere={true}
      atmosphereColor="#1a5fb4"
      atmosphereAltitude={0.18}
      // Hex polygons — countries with genre-colored hexagonal overlay
      hexPolygonsData={geoFeatures}
      hexPolygonGeoJsonGeometry={hexGeoJson}
      hexPolygonColor={hexColor}
      hexPolygonAltitude={hexAltitude}
      hexPolygonResolution={3}
      hexPolygonMargin={0.35}
      hexPolygonCurvatureResolution={1}
      hexPolygonsTransitionDuration={0}
      hexPolygonLabel={hexLabel}
      onHexPolygonHover={handleHexHover}
      onHexPolygonClick={handleHexClick}
      // Flow arcs
      arcsData={arcsData}
      arcStartLat="startLat"
      arcStartLng="startLng"
      arcEndLat="endLat"
      arcEndLng="endLng"
      arcColor="color"
      arcStroke={0.15}
      arcAltitudeAutoScale={0.3}
      arcDashLength={0.4}
      arcDashGap={0.6}
      arcDashAnimateTime="animateTime"
      arcLabel={arcLabel}
      arcsTransitionDuration={500}
    />
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Escape HTML special chars to prevent XSS in tooltip strings */
function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
