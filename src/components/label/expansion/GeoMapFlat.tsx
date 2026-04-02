/**
 * High-fidelity world map using d3-geo Natural Earth projection.
 * Click any dot to zoom into that country and see city-level breakdown.
 * Palantir-style dark theme with scan lines and tactical overlays.
 */
import { useState, useMemo, useRef, useCallback } from "react";
import {
  geoNaturalEarth1,
  geoPath,
  geoGraticule10,
  type GeoPermissibleObjects,
} from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";
import type { CityData } from "./mockData";
import landRings from "./land110m.json";

// ── City coordinates (lat, lng) ──
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Oslo: { lat: 59.91, lng: 10.75 },
  Stockholm: { lat: 59.33, lng: 18.07 },
  London: { lat: 51.51, lng: -0.13 },
  Berlin: { lat: 52.52, lng: 13.4 },
  "New York": { lat: 40.71, lng: -74.01 },
  "Los Angeles": { lat: 34.05, lng: -118.24 },
  Copenhagen: { lat: 55.68, lng: 12.57 },
  "São Paulo": { lat: -23.55, lng: -46.63 },
  "Rio de Janeiro": { lat: -22.91, lng: -43.17 },
  Manila: { lat: 14.6, lng: 120.98 },
  Jakarta: { lat: -6.21, lng: 106.85 },
  Bangkok: { lat: 13.76, lng: 100.5 },
  "Mexico City": { lat: 19.43, lng: -99.13 },
  Bogotá: { lat: 4.71, lng: -74.07 },
  Chicago: { lat: 41.88, lng: -87.63 },
  Austin: { lat: 30.27, lng: -97.74 },
  Atlanta: { lat: 33.75, lng: -84.39 },
  Portland: { lat: 45.51, lng: -122.68 },
  Paris: { lat: 48.86, lng: 2.35 },
  Amsterdam: { lat: 52.37, lng: 4.9 },
  Brussels: { lat: 50.85, lng: 4.35 },
  Munich: { lat: 48.14, lng: 11.58 },
  Vienna: { lat: 48.21, lng: 16.37 },
  Milan: { lat: 45.46, lng: 9.19 },
  Tokyo: { lat: 35.68, lng: 139.69 },
  Seoul: { lat: 37.57, lng: 126.98 },
  Mumbai: { lat: 19.08, lng: 72.88 },
  Delhi: { lat: 28.61, lng: 77.21 },
};

// ── Map each city → its country for drill-down ──
const CITY_TO_COUNTRY: Record<string, string> = {
  Oslo: "Norway",
  Stockholm: "Sweden",
  Copenhagen: "Denmark",
  London: "United Kingdom",
  Berlin: "Germany",
  Munich: "Germany",
  Paris: "France",
  Amsterdam: "Netherlands",
  Brussels: "Belgium",
  Vienna: "Austria",
  Milan: "Italy",
  "New York": "United States",
  "Los Angeles": "United States",
  Chicago: "United States",
  Austin: "United States",
  Atlanta: "United States",
  Portland: "United States",
  "São Paulo": "Brazil",
  "Rio de Janeiro": "Brazil",
  "Mexico City": "Mexico",
  Bogotá: "Colombia",
  Manila: "Philippines",
  Jakarta: "Indonesia",
  Bangkok: "Thailand",
  Tokyo: "Japan",
  Seoul: "South Korea",
  Mumbai: "India",
  Delhi: "India",
};

const CITY_TO_MARKET: Record<string, string> = {
  "São Paulo": "Brazil",
  "Rio de Janeiro": "Brazil",
  Manila: "Southeast Asia",
  Jakarta: "Southeast Asia",
  Bangkok: "Southeast Asia",
  "Mexico City": "Mexico & LATAM",
  Bogotá: "Mexico & LATAM",
  Chicago: "US — Scale Up",
  Austin: "US — Scale Up",
  Atlanta: "US — Scale Up",
  Portland: "US — Scale Up",
  Tokyo: "Japan",
  Seoul: "South Korea",
  Mumbai: "India",
  Delhi: "India",
};

// ── Sub-city data per country — shown when zoomed ──
interface SubCity {
  city: string;
  lat: number;
  lng: number;
  listeners: number;
  status: "strong" | "growing" | "untapped";
}

const COUNTRY_SUBCITIES: Record<string, SubCity[]> = {
  Norway: [
    {
      city: "Oslo",
      lat: 59.91,
      lng: 10.75,
      listeners: 124200,
      status: "strong",
    },
    {
      city: "Bergen",
      lat: 60.39,
      lng: 5.32,
      listeners: 31400,
      status: "strong",
    },
    {
      city: "Trondheim",
      lat: 63.43,
      lng: 10.39,
      listeners: 18700,
      status: "growing",
    },
    {
      city: "Stavanger",
      lat: 58.97,
      lng: 5.73,
      listeners: 12100,
      status: "growing",
    },
    {
      city: "Tromsø",
      lat: 69.65,
      lng: 18.96,
      listeners: 4800,
      status: "growing",
    },
    {
      city: "Kristiansand",
      lat: 58.15,
      lng: 8.0,
      listeners: 3200,
      status: "growing",
    },
  ],
  Sweden: [
    {
      city: "Stockholm",
      lat: 59.33,
      lng: 18.07,
      listeners: 89100,
      status: "strong",
    },
    {
      city: "Gothenburg",
      lat: 57.71,
      lng: 11.97,
      listeners: 42300,
      status: "strong",
    },
    {
      city: "Malmö",
      lat: 55.6,
      lng: 13.0,
      listeners: 21800,
      status: "growing",
    },
    {
      city: "Uppsala",
      lat: 59.86,
      lng: 17.64,
      listeners: 8900,
      status: "growing",
    },
    {
      city: "Linköping",
      lat: 58.41,
      lng: 15.63,
      listeners: 5100,
      status: "growing",
    },
  ],
  "United Kingdom": [
    {
      city: "London",
      lat: 51.51,
      lng: -0.13,
      listeners: 67400,
      status: "strong",
    },
    {
      city: "Manchester",
      lat: 53.48,
      lng: -2.24,
      listeners: 28900,
      status: "strong",
    },
    {
      city: "Birmingham",
      lat: 52.49,
      lng: -1.9,
      listeners: 15200,
      status: "growing",
    },
    {
      city: "Edinburgh",
      lat: 55.95,
      lng: -3.19,
      listeners: 11800,
      status: "growing",
    },
    {
      city: "Bristol",
      lat: 51.45,
      lng: -2.59,
      listeners: 9300,
      status: "growing",
    },
    {
      city: "Glasgow",
      lat: 55.86,
      lng: -4.25,
      listeners: 7600,
      status: "growing",
    },
    {
      city: "Leeds",
      lat: 53.8,
      lng: -1.55,
      listeners: 6100,
      status: "growing",
    },
  ],
  Germany: [
    {
      city: "Berlin",
      lat: 52.52,
      lng: 13.4,
      listeners: 42800,
      status: "strong",
    },
    {
      city: "Munich",
      lat: 48.14,
      lng: 11.58,
      listeners: 24500,
      status: "growing",
    },
    {
      city: "Hamburg",
      lat: 53.55,
      lng: 9.99,
      listeners: 18200,
      status: "growing",
    },
    {
      city: "Cologne",
      lat: 50.94,
      lng: 6.96,
      listeners: 11300,
      status: "growing",
    },
    {
      city: "Frankfurt",
      lat: 50.11,
      lng: 8.68,
      listeners: 8700,
      status: "growing",
    },
    {
      city: "Stuttgart",
      lat: 48.78,
      lng: 9.18,
      listeners: 5400,
      status: "growing",
    },
  ],
  "United States": [
    {
      city: "New York",
      lat: 40.71,
      lng: -74.01,
      listeners: 18200,
      status: "growing",
    },
    {
      city: "Los Angeles",
      lat: 34.05,
      lng: -118.24,
      listeners: 11600,
      status: "growing",
    },
    {
      city: "Chicago",
      lat: 41.88,
      lng: -87.63,
      listeners: 4200,
      status: "untapped",
    },
    {
      city: "Austin",
      lat: 30.27,
      lng: -97.74,
      listeners: 3800,
      status: "untapped",
    },
    {
      city: "Atlanta",
      lat: 33.75,
      lng: -84.39,
      listeners: 2900,
      status: "untapped",
    },
    {
      city: "Portland",
      lat: 45.51,
      lng: -122.68,
      listeners: 2100,
      status: "untapped",
    },
    {
      city: "Seattle",
      lat: 47.61,
      lng: -122.33,
      listeners: 1800,
      status: "untapped",
    },
    {
      city: "Denver",
      lat: 39.74,
      lng: -104.99,
      listeners: 1200,
      status: "untapped",
    },
    {
      city: "Nashville",
      lat: 36.16,
      lng: -86.78,
      listeners: 900,
      status: "untapped",
    },
    {
      city: "Miami",
      lat: 25.76,
      lng: -80.19,
      listeners: 700,
      status: "untapped",
    },
  ],
  Brazil: [
    {
      city: "São Paulo",
      lat: -23.55,
      lng: -46.63,
      listeners: 1200,
      status: "untapped",
    },
    {
      city: "Rio de Janeiro",
      lat: -22.91,
      lng: -43.17,
      listeners: 800,
      status: "untapped",
    },
    {
      city: "Belo Horizonte",
      lat: -19.92,
      lng: -43.94,
      listeners: 400,
      status: "untapped",
    },
    {
      city: "Brasília",
      lat: -15.79,
      lng: -47.88,
      listeners: 300,
      status: "untapped",
    },
    {
      city: "Curitiba",
      lat: -25.43,
      lng: -49.27,
      listeners: 200,
      status: "untapped",
    },
    {
      city: "Salvador",
      lat: -12.97,
      lng: -38.51,
      listeners: 150,
      status: "untapped",
    },
    {
      city: "Recife",
      lat: -8.05,
      lng: -34.87,
      listeners: 120,
      status: "untapped",
    },
    {
      city: "Fortaleza",
      lat: -3.72,
      lng: -38.53,
      listeners: 90,
      status: "untapped",
    },
  ],
  Philippines: [
    {
      city: "Manila",
      lat: 14.6,
      lng: 120.98,
      listeners: 500,
      status: "untapped",
    },
    {
      city: "Cebu",
      lat: 10.31,
      lng: 123.89,
      listeners: 280,
      status: "untapped",
    },
    {
      city: "Davao",
      lat: 7.19,
      lng: 125.46,
      listeners: 150,
      status: "untapped",
    },
    {
      city: "Quezon City",
      lat: 14.68,
      lng: 121.04,
      listeners: 420,
      status: "untapped",
    },
  ],
  Indonesia: [
    {
      city: "Jakarta",
      lat: -6.21,
      lng: 106.85,
      listeners: 350,
      status: "untapped",
    },
    {
      city: "Surabaya",
      lat: -7.25,
      lng: 112.75,
      listeners: 180,
      status: "untapped",
    },
    {
      city: "Bandung",
      lat: -6.91,
      lng: 107.61,
      listeners: 120,
      status: "untapped",
    },
    {
      city: "Yogyakarta",
      lat: -7.8,
      lng: 110.36,
      listeners: 90,
      status: "untapped",
    },
    {
      city: "Bali",
      lat: -8.41,
      lng: 115.19,
      listeners: 210,
      status: "untapped",
    },
  ],
  Thailand: [
    {
      city: "Bangkok",
      lat: 13.76,
      lng: 100.5,
      listeners: 420,
      status: "untapped",
    },
    {
      city: "Chiang Mai",
      lat: 18.79,
      lng: 98.98,
      listeners: 180,
      status: "untapped",
    },
    {
      city: "Phuket",
      lat: 7.88,
      lng: 98.39,
      listeners: 90,
      status: "untapped",
    },
  ],
  Mexico: [
    {
      city: "Mexico City",
      lat: 19.43,
      lng: -99.13,
      listeners: 600,
      status: "untapped",
    },
    {
      city: "Guadalajara",
      lat: 20.67,
      lng: -103.35,
      listeners: 280,
      status: "untapped",
    },
    {
      city: "Monterrey",
      lat: 25.69,
      lng: -100.32,
      listeners: 210,
      status: "untapped",
    },
    {
      city: "Puebla",
      lat: 19.04,
      lng: -98.21,
      listeners: 120,
      status: "untapped",
    },
    {
      city: "Tijuana",
      lat: 32.51,
      lng: -117.04,
      listeners: 90,
      status: "untapped",
    },
  ],
  Colombia: [
    {
      city: "Bogotá",
      lat: 4.71,
      lng: -74.07,
      listeners: 380,
      status: "untapped",
    },
    {
      city: "Medellín",
      lat: 6.25,
      lng: -75.56,
      listeners: 220,
      status: "untapped",
    },
    {
      city: "Cali",
      lat: 3.45,
      lng: -76.53,
      listeners: 130,
      status: "untapped",
    },
    {
      city: "Barranquilla",
      lat: 10.96,
      lng: -74.78,
      listeners: 80,
      status: "untapped",
    },
  ],
  Denmark: [
    {
      city: "Copenhagen",
      lat: 55.68,
      lng: 12.57,
      listeners: 9800,
      status: "growing",
    },
    {
      city: "Aarhus",
      lat: 56.16,
      lng: 10.2,
      listeners: 4200,
      status: "growing",
    },
    {
      city: "Odense",
      lat: 55.4,
      lng: 10.39,
      listeners: 2100,
      status: "growing",
    },
  ],
  France: [
    {
      city: "Paris",
      lat: 48.86,
      lng: 2.35,
      listeners: 15200,
      status: "growing",
    },
    { city: "Lyon", lat: 45.76, lng: 4.84, listeners: 6800, status: "growing" },
    {
      city: "Marseille",
      lat: 43.3,
      lng: 5.37,
      listeners: 4500,
      status: "growing",
    },
    {
      city: "Toulouse",
      lat: 43.6,
      lng: 1.44,
      listeners: 2800,
      status: "growing",
    },
    {
      city: "Bordeaux",
      lat: 44.84,
      lng: -0.58,
      listeners: 2100,
      status: "growing",
    },
    {
      city: "Lille",
      lat: 50.63,
      lng: 3.06,
      listeners: 1900,
      status: "growing",
    },
  ],
  Japan: [
    {
      city: "Tokyo",
      lat: 35.68,
      lng: 139.69,
      listeners: 800,
      status: "untapped",
    },
    {
      city: "Osaka",
      lat: 34.69,
      lng: 135.5,
      listeners: 450,
      status: "untapped",
    },
    {
      city: "Nagoya",
      lat: 35.18,
      lng: 136.91,
      listeners: 200,
      status: "untapped",
    },
    {
      city: "Fukuoka",
      lat: 33.59,
      lng: 130.4,
      listeners: 120,
      status: "untapped",
    },
    {
      city: "Sapporo",
      lat: 43.06,
      lng: 141.35,
      listeners: 80,
      status: "untapped",
    },
  ],
  "South Korea": [
    {
      city: "Seoul",
      lat: 37.57,
      lng: 126.98,
      listeners: 600,
      status: "untapped",
    },
    {
      city: "Busan",
      lat: 35.18,
      lng: 129.08,
      listeners: 280,
      status: "untapped",
    },
    {
      city: "Incheon",
      lat: 37.46,
      lng: 126.71,
      listeners: 180,
      status: "untapped",
    },
    {
      city: "Daegu",
      lat: 35.87,
      lng: 128.6,
      listeners: 90,
      status: "untapped",
    },
  ],
  India: [
    {
      city: "Mumbai",
      lat: 19.08,
      lng: 72.88,
      listeners: 500,
      status: "untapped",
    },
    {
      city: "Delhi",
      lat: 28.61,
      lng: 77.21,
      listeners: 380,
      status: "untapped",
    },
    {
      city: "Bangalore",
      lat: 12.97,
      lng: 77.59,
      listeners: 290,
      status: "untapped",
    },
    {
      city: "Hyderabad",
      lat: 17.39,
      lng: 78.49,
      listeners: 180,
      status: "untapped",
    },
    {
      city: "Chennai",
      lat: 13.08,
      lng: 80.27,
      listeners: 140,
      status: "untapped",
    },
    {
      city: "Pune",
      lat: 18.52,
      lng: 73.86,
      listeners: 120,
      status: "untapped",
    },
    {
      city: "Kolkata",
      lat: 22.57,
      lng: 88.36,
      listeners: 90,
      status: "untapped",
    },
  ],
};

// ── Country center + zoom level for drill-down ──
const COUNTRY_ZOOM: Record<
  string,
  { lat: number; lng: number; scale: number }
> = {
  Norway: { lat: 64, lng: 12, scale: 800 },
  Sweden: { lat: 62, lng: 16, scale: 700 },
  Denmark: { lat: 56, lng: 10, scale: 2200 },
  "United Kingdom": { lat: 54, lng: -2, scale: 1200 },
  Germany: { lat: 51, lng: 10, scale: 1200 },
  France: { lat: 46.5, lng: 2.5, scale: 1000 },
  "United States": { lat: 38, lng: -97, scale: 400 },
  Brazil: { lat: -14, lng: -51, scale: 350 },
  Mexico: { lat: 23, lng: -102, scale: 600 },
  Colombia: { lat: 4, lng: -73, scale: 900 },
  Philippines: { lat: 12, lng: 122, scale: 1000 },
  Indonesia: { lat: -2, lng: 118, scale: 500 },
  Thailand: { lat: 13, lng: 101, scale: 900 },
  Japan: { lat: 37, lng: 138, scale: 600 },
  "South Korea": { lat: 36, lng: 128, scale: 2000 },
  India: { lat: 22, lng: 80, scale: 500 },
  Netherlands: { lat: 52.3, lng: 5, scale: 3000 },
  Belgium: { lat: 50.8, lng: 4.5, scale: 3000 },
  Austria: { lat: 47.5, lng: 14, scale: 1800 },
  Italy: { lat: 42, lng: 12, scale: 700 },
};

const STATUS_COLORS: Record<string, string> = {
  strong: "#30D158",
  growing: "#FFD60A",
  untapped: "#e8430a",
};

const OPPORTUNITY_CITIES = Object.keys(CITY_TO_MARKET);

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

// ── Convert land110m [lat, lng] rings → GeoJSON MultiPolygon [lng, lat] ──
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

const MAP_W = 960;
const MAP_H = 500;

interface GeoMapFlatProps {
  cities: CityData[];
  onSelectCity?: (market: string | null) => void;
}

export default function GeoMapFlat({ cities, onSelectCity }: GeoMapFlatProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Zoom state ──
  const [zoomedCountry, setZoomedCountry] = useState<string | null>(null);

  // ── World-level projection (static) ──
  const worldProjection = useMemo(() => {
    return geoNaturalEarth1()
      .scale(160)
      .translate([MAP_W / 2, MAP_H / 2])
      .precision(0.1);
  }, []);

  // ── Zoomed projection (changes with zoomedCountry) ──
  const zoomedProjection = useMemo(() => {
    if (!zoomedCountry) return null;
    const zc = COUNTRY_ZOOM[zoomedCountry];
    if (!zc) return null;
    return geoNaturalEarth1()
      .scale(zc.scale)
      .center([zc.lng, zc.lat])
      .translate([MAP_W / 2, MAP_H / 2])
      .precision(0.1);
  }, [zoomedCountry]);

  const activeProjection = zoomedProjection || worldProjection;

  // ── Paths rebuilt whenever projection changes ──
  const { landPath, graticulePath } = useMemo(() => {
    const pathGen = geoPath(activeProjection);
    const land = buildLandGeoJSON();
    const graticule = geoGraticule10();
    return {
      landPath: pathGen(land) || "",
      graticulePath: pathGen(graticule) || "",
    };
  }, [activeProjection]);

  // ── World-level dots ──
  const allDots = useMemo(() => {
    const dots: {
      city: string;
      country: string;
      status: string;
      listeners: number;
      x: number;
      y: number;
    }[] = [];

    for (const c of cities) {
      const coords = CITY_COORDS[c.city];
      if (!coords) continue;
      const projected = activeProjection([coords.lng, coords.lat]);
      if (!projected) continue;
      dots.push({
        city: c.city,
        country: CITY_TO_COUNTRY[c.city] || c.country,
        status: c.status,
        listeners: c.listeners,
        x: projected[0],
        y: projected[1],
      });
    }

    // Add untapped cities not in the list
    for (const cityName of OPPORTUNITY_CITIES) {
      if (cities.some((c) => c.city === cityName)) continue;
      const coords = CITY_COORDS[cityName];
      if (!coords) continue;
      const projected = activeProjection([coords.lng, coords.lat]);
      if (!projected) continue;
      dots.push({
        city: cityName,
        country: CITY_TO_COUNTRY[cityName] || "",
        status: "untapped",
        listeners: 0,
        x: projected[0],
        y: projected[1],
      });
    }

    return dots;
  }, [cities, activeProjection]);

  // ── Sub-city dots when zoomed ──
  const subCityDots = useMemo(() => {
    if (!zoomedCountry || !zoomedProjection) return [];
    const subs = COUNTRY_SUBCITIES[zoomedCountry];
    if (!subs) return [];

    return subs
      .map((sc) => {
        const projected = zoomedProjection([sc.lng, sc.lat]);
        return {
          city: sc.city,
          status: sc.status,
          listeners: sc.listeners,
          x: projected ? projected[0] : 0,
          y: projected ? projected[1] : 0,
          visible: projected !== null,
        };
      })
      .filter(
        (d) => d.visible && d.x > 0 && d.x < MAP_W && d.y > 0 && d.y < MAP_H,
      );
  }, [zoomedCountry, zoomedProjection]);

  // ── Arcs (world view only) ──
  const arcs = useMemo(() => {
    if (zoomedCountry) return [];
    const strong = allDots.filter((d) => d.status === "strong");
    const untapped = allDots.filter((d) => d.status === "untapped");
    if (!strong.length) return [];
    const origin = strong[0];
    return untapped.slice(0, 6).map((target) => {
      const mx = (origin.x + target.x) / 2;
      const my = (origin.y + target.y) / 2 - 30;
      return `M${origin.x},${origin.y} Q${mx},${my} ${target.x},${target.y}`;
    });
  }, [allDots, zoomedCountry]);

  const handleDotClick = useCallback(
    (city: string, country: string) => {
      if (zoomedCountry) {
        // Already zoomed — clicking sub-city triggers market scroll
        if (onSelectCity) {
          onSelectCity(CITY_TO_MARKET[city] || null);
        }
        return;
      }
      // Zoom into this country
      const targetCountry = country;
      if (COUNTRY_ZOOM[targetCountry]) {
        setZoomedCountry(targetCountry);
        setHoveredCity(null);
      } else if (onSelectCity) {
        onSelectCity(CITY_TO_MARKET[city] || null);
      }
    },
    [zoomedCountry, onSelectCity],
  );

  const handleZoomOut = useCallback(() => {
    setZoomedCountry(null);
    setHoveredCity(null);
  }, []);

  const hoveredDot = hoveredCity
    ? (zoomedCountry ? subCityDots : allDots).find(
        (d) => d.city === hoveredCity,
      )
    : null;

  const handleDotHover = (city: string, e: React.MouseEvent) => {
    setHoveredCity(city);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  // ── Sidebar data — zoomed shows sub-cities, world shows top cities ──
  const sidebarCities = useMemo(() => {
    if (zoomedCountry && subCityDots.length > 0) {
      return [...subCityDots]
        .sort((a, b) => b.listeners - a.listeners)
        .map((sc) => ({
          city: sc.city,
          listeners: sc.listeners,
          status: sc.status,
        }));
    }
    return cities.map((c) => ({
      city: c.city,
      listeners: c.listeners,
      status: c.status,
      flag: c.flag,
    }));
  }, [zoomedCountry, subCityDots, cities]);

  const activeDots = zoomedCountry ? subCityDots : allDots;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
      {/* Map */}
      <div
        ref={containerRef}
        style={{
          background:
            "linear-gradient(180deg, #080c14 0%, #0a0e18 50%, #060a10 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          minHeight: 440,
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            background:
              "radial-gradient(ellipse, rgba(232,67,10,0.05) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Scan lines */}
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

        {/* Back button when zoomed */}
        <AnimatePresence>
          {zoomedCountry && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onClick={handleZoomOut}
              whileHover={{
                backgroundColor: "rgba(40, 40, 48, 0.95)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
              style={{
                position: "absolute",
                top: 14,
                left: 16,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(20, 20, 24, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.03em",
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
              <span>WORLD</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#e8430a", fontWeight: 600 }}>
                {zoomedCountry.toUpperCase()}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          style={{ width: "100%", height: "100%", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="untappedGlow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="landFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
            </linearGradient>
          </defs>

          {/* Graticule */}
          <path
            d={graticulePath}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="0.5"
          />

          {/* Land */}
          <path
            d={landPath}
            fill="url(#landFill)"
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

          {/* Arcs (world only) */}
          {arcs.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#e8430a"
              strokeWidth="1"
              strokeDasharray="6,4"
              opacity={0.35}
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
          {activeDots.map((dot) => {
            const color = STATUS_COLORS[dot.status] || "#30D158";
            const isUntapped = dot.status === "untapped";
            const isHovered = hoveredCity === dot.city;
            const r =
              dot.status === "strong" ? 5 : dot.status === "growing" ? 4 : 3.5;

            return (
              <g
                key={dot.city}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => handleDotHover(dot.city, e)}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={() =>
                  handleDotClick(
                    dot.city,
                    "country" in dot
                      ? (dot as any).country
                      : CITY_TO_COUNTRY[dot.city] || "",
                  )
                }
              >
                {/* Pulse ring */}
                {isUntapped && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={r * 3}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.8"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      values={`${r * 1.5};${r * 3};${r * 1.5}`}
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

                {/* Glow */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={r * 2.5}
                  fill={color}
                  opacity={isHovered ? 0.3 : 0.12}
                  filter={isUntapped ? "url(#untappedGlow)" : "url(#dotGlow)"}
                />

                {/* Main dot */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isHovered ? r * 1.4 : r}
                  fill={color}
                />

                {/* Highlight */}
                <circle
                  cx={dot.x - r * 0.25}
                  cy={dot.y - r * 0.25}
                  r={r * 0.3}
                  fill="rgba(255,255,255,0.4)"
                />

                {/* City label when zoomed */}
                {zoomedCountry && (
                  <text
                    x={dot.x}
                    y={dot.y + r + 12}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.5)"
                    fontSize="9"
                    fontFamily="'JetBrains Mono', monospace"
                    letterSpacing="0.04em"
                  >
                    {dot.city}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredDot && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: "absolute",
                left: tooltipPos.x,
                top: tooltipPos.y - 12,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  background: "rgba(20, 20, 24, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${STATUS_COLORS[hoveredDot.status]}30`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  whiteSpace: "nowrap",
                  boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 15px ${STATUS_COLORS[hoveredDot.status]}15`,
                }}
              >
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
                      background: STATUS_COLORS[hoveredDot.status],
                      boxShadow: `0 0 6px ${STATUS_COLORS[hoveredDot.status]}`,
                    }}
                  />
                  {hoveredDot.city}
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color:
                      hoveredDot.listeners > 0
                        ? "rgba(255,255,255,0.55)"
                        : "#e8430a",
                    marginTop: 2,
                  }}
                >
                  {hoveredDot.listeners > 0
                    ? `${formatNumber(hoveredDot.listeners)} listeners`
                    : "Untapped opportunity"}
                </div>
                {!zoomedCountry && (
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      color: "rgba(255,255,255,0.25)",
                      marginTop: 4,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      paddingTop: 4,
                    }}
                  >
                    CLICK TO DRILL DOWN
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            display: "flex",
            gap: 16,
            zIndex: 5,
          }}
        >
          {[
            { label: "Strong (10K+)", color: "#30D158" },
            { label: "Growing", color: "#FFD60A" },
            { label: "Untapped", color: "#e8430a" },
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
                  boxShadow: `0 0 6px ${item.color}60`,
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
        </div>

        {/* Hints */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "0.05em",
            zIndex: 2,
          }}
        >
          {zoomedCountry ? "CITY-LEVEL BREAKDOWN" : "CLICK DOTS TO DRILL DOWN"}
        </div>

        {/* Corner metadata */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            right: 16,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9,
            color: "rgba(255,255,255,0.10)",
            lineHeight: 1.6,
            textAlign: "right",
            zIndex: 2,
          }}
        >
          {zoomedCountry
            ? `${zoomedCountry} · ${subCityDots.length} cities`
            : "110m Natural Earth"}
          <br />
          {activeDots.length} markers active
        </div>
      </div>

      {/* Rankings sidebar */}
      <div
        style={{
          background: "var(--surface, #1C1C1E)",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 3,
              height: 12,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.5) 0%, rgba(232,67,10,0.1) 100%)",
            }}
          />
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 500,
              color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
            }}
          >
            {zoomedCountry
              ? `${zoomedCountry} — Cities`
              : "Top Cities by Listeners"}
          </span>
        </div>

        {sidebarCities.map((city, i) => {
          const maxListeners = sidebarCities[0]?.listeners || 1;
          const barWidth = (city.listeners / maxListeners) * 100;
          const color = STATUS_COLORS[city.status] || "#30D158";

          return (
            <div
              key={city.city}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom:
                  i < sidebarCities.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
              }}
            >
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  width: 18,
                  textAlign: "right",
                }}
              >
                {i + 1}
              </span>
              {"flag" in city && (
                <span style={{ fontSize: 16 }}>{(city as any).flag}</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink, rgba(255,255,255,0.87))",
                    }}
                  >
                    {city.city}
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                    }}
                  >
                    {formatNumber(city.listeners)}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      borderRadius: 2,
                      boxShadow: `0 0 8px ${color}30`,
                      transition: "width 600ms ease",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
