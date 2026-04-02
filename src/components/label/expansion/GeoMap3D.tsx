import { useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import type { CityData } from "./mockData";
import { CONTINENT_OUTLINES } from "./continentOutlines";

// ── Lat/Lng data for all cities ──
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Oslo: { lat: 59.91, lng: 10.75 },
  Stockholm: { lat: 59.33, lng: 18.07 },
  London: { lat: 51.51, lng: -0.13 },
  Berlin: { lat: 52.52, lng: 13.4 },
  "New York": { lat: 40.71, lng: -74.01 },
  "Los Angeles": { lat: 34.05, lng: -118.24 },
  Copenhagen: { lat: 55.68, lng: 12.57 },
  "S\u00e3o Paulo": { lat: -23.55, lng: -46.63 },
  "Rio de Janeiro": { lat: -22.91, lng: -43.17 },
  Manila: { lat: 14.6, lng: 120.98 },
  Jakarta: { lat: -6.21, lng: 106.85 },
  Bangkok: { lat: 13.76, lng: 100.5 },
  "Mexico City": { lat: 19.43, lng: -99.13 },
  "Bogot\u00e1": { lat: 4.71, lng: -74.07 },
  Chicago: { lat: 41.88, lng: -87.63 },
  Austin: { lat: 30.27, lng: -97.74 },
  Atlanta: { lat: 33.75, lng: -84.39 },
  Portland: { lat: 45.51, lng: -122.68 },
};

// City → market name mapping for scroll-to-card
const CITY_TO_MARKET: Record<string, string> = {
  "S\u00e3o Paulo": "Brazil",
  "Rio de Janeiro": "Brazil",
  Manila: "Southeast Asia",
  Jakarta: "Southeast Asia",
  Bangkok: "Southeast Asia",
  "Mexico City": "Mexico & LATAM",
  "Bogot\u00e1": "Mexico & LATAM",
  Chicago: "US \u2014 Scale Up",
  Austin: "US \u2014 Scale Up",
  Atlanta: "US \u2014 Scale Up",
  Portland: "US \u2014 Scale Up",
};

const OPPORTUNITY_CITIES = Object.keys(CITY_TO_MARKET);

const STATUS_COLORS: Record<string, string> = {
  strong: "#30D158",
  growing: "#FFD60A",
  untapped: "#e8430a",
};

function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

// ── Custom atmosphere shader ──
const AtmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AtmosphereFragmentShader = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(0.91, 0.26, 0.04, 1.0) * intensity * 0.35;
  }
`;

// ── FPS monitor — drops to flat only if truly unusable ──
// Skips the first 120 frames (warm-up / shader compilation), then checks.
function FPSMonitor({ onLowFPS }: { onLowFPS: () => void }) {
  const frameTimesRef = useRef<number[]>([]);
  const lowCountRef = useRef(0);
  const totalFramesRef = useRef(0);

  useFrame(() => {
    totalFramesRef.current++;
    // Skip first 120 frames — shader compilation causes jank
    if (totalFramesRef.current < 120) return;

    const now = performance.now();
    frameTimesRef.current.push(now);

    if (frameTimesRef.current.length > 90) {
      frameTimesRef.current.shift();
    }

    // Check every 90 frames (~1.5s at 60fps)
    if (frameTimesRef.current.length === 90) {
      const elapsed = frameTimesRef.current[89] - frameTimesRef.current[0];
      const fps = (89 / elapsed) * 1000;

      if (fps < 12) {
        lowCountRef.current++;
        // Need 5 consecutive bad windows (~7.5s of <12fps) before fallback
        if (lowCountRef.current >= 5) {
          onLowFPS();
        }
      } else {
        lowCountRef.current = 0;
      }
    }
  });

  return null;
}

// ── Continent outline lines on the globe ──
function ContinentLines({ radius }: { radius: number }) {
  const geometries = useMemo(() => {
    return CONTINENT_OUTLINES.map((continent) => {
      const points = continent.points.map(([lat, lng]) =>
        latLngToVector3(lat, lng, radius + 0.006),
      );
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, [radius]);

  return (
    <group renderOrder={1}>
      {geometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.08}
            depthTest={false}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
}

// ── Globe wireframe grid ──
function GlobeGrid({ radius }: { radius: number }) {
  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];

    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 3) {
        points.push(latLngToVector3(lat, lng - 180, radius + 0.005));
      }
      lines.push(points);
    }

    for (let lng = -180; lng < 180; lng += 30) {
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        points.push(latLngToVector3(lat, lng, radius + 0.005));
      }
      lines.push(points);
    }

    return lines;
  }, [radius]);

  return (
    <group>
      {gridLines.map((points, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.03}
              depthTest={false}
              depthWrite={false}
            />
          </line>
        );
      })}
    </group>
  );
}

// ── City dot mesh ──
interface CityDotProps {
  city: string;
  position: THREE.Vector3;
  color: string;
  status: string;
  listeners: number;
  isSelected: boolean;
  onSelect: (city: string | null) => void;
}

function CityDot({
  city,
  position,
  color,
  status,
  listeners,
  isSelected,
  onSelect,
}: CityDotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isUntapped = status === "untapped";
  const dotScale =
    status === "strong" ? 0.025 : status === "growing" ? 0.02 : 0.018;

  useFrame(() => {
    if (glowRef.current) {
      const targetOpacity =
        hovered || isSelected ? 0.4 : isUntapped ? 0.18 : 0.1;
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity += (targetOpacity - mat.opacity) * 0.08;
    }
  });

  return (
    <group position={position}>
      {/* Static outer ring for untapped — no animation, no blinking */}
      {isUntapped && (
        <mesh>
          <ringGeometry args={[dotScale * 2, dotScale * 2.3, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Glow halo */}
      <mesh ref={glowRef} scale={[2.5, 2.5, 2.5]}>
        <sphereGeometry args={[dotScale, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : city);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        scale={hovered || isSelected ? 1.5 : 1}
      >
        <sphereGeometry args={[dotScale, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {(hovered || isSelected) && (
        <Html
          distanceFactor={3}
          style={{ pointerEvents: "none", transform: "translate(-50%, -120%)" }}
        >
          <div
            style={{
              background: "rgba(28, 28, 30, 0.95)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${color}40`,
              borderRadius: 10,
              padding: "8px 14px",
              whiteSpace: "nowrap",
              minWidth: 100,
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
                  background: color,
                  display: "inline-block",
                }}
              />
              {city}
            </div>
            {listeners > 0 ? (
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: 2,
                }}
              >
                {formatNumber(listeners)} listeners
              </div>
            ) : (
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "#e8430a",
                  marginTop: 2,
                }}
              >
                Untapped opportunity
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Arc between two cities ──
function CityArc({
  from,
  to,
  color,
  radius,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  radius: number;
}) {
  const curve = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const distance = from.distanceTo(to);
    mid.normalize().multiplyScalar(radius + distance * 0.25);
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to, radius]);

  const geometry = useMemo(() => {
    const points = curve.getPoints(50);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curve]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        depthTest={false}
        depthWrite={false}
      />
    </line>
  );
}

// ── Starfield background ──
function Stars() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const r = 8 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.015}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ── Main scene ──
interface GlobeSceneProps {
  cities: CityData[];
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
  onLowFPS: () => void;
}

function GlobeScene({
  cities,
  selectedCity,
  onSelectCity,
  onLowFPS,
}: GlobeSceneProps) {
  const globeRef = useRef<THREE.Group>(null);
  const RADIUS = 1.5;

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.03;
    }
  });

  const allDots = useMemo(() => {
    const dots: {
      city: string;
      status: string;
      listeners: number;
      position: THREE.Vector3;
      color: string;
    }[] = [];

    for (const c of cities) {
      const coords = CITY_COORDS[c.city];
      if (!coords) continue;
      dots.push({
        city: c.city,
        status: c.status,
        listeners: c.listeners,
        position: latLngToVector3(coords.lat, coords.lng, RADIUS + 0.01),
        color: STATUS_COLORS[c.status] || "#30D158",
      });
    }

    for (const cityName of OPPORTUNITY_CITIES) {
      if (cities.some((c) => c.city === cityName)) continue;
      const coords = CITY_COORDS[cityName];
      if (!coords) continue;
      dots.push({
        city: cityName,
        status: "untapped",
        listeners: 0,
        position: latLngToVector3(coords.lat, coords.lng, RADIUS + 0.01),
        color: "#e8430a",
      });
    }

    return dots;
  }, [cities]);

  const arcs = useMemo(() => {
    const strongCities = allDots.filter((d) => d.status === "strong");
    const untapped = allDots.filter((d) => d.status === "untapped");
    const result: { from: THREE.Vector3; to: THREE.Vector3; color: string }[] =
      [];

    const oslo = strongCities[0];
    if (oslo) {
      for (const u of untapped.slice(0, 5)) {
        result.push({ from: oslo.position, to: u.position, color: "#e8430a" });
      }
    }

    return result;
  }, [allDots]);

  return (
    <>
      <FPSMonitor onLowFPS={onLowFPS} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.5} color="#c8d4e8" />
      <pointLight position={[-4, 2, -3]} intensity={0.15} color="#e8430a" />

      <Stars />

      <group ref={globeRef}>
        {/* Globe sphere — fully opaque to prevent z-fighting with lines */}
        <mesh>
          <sphereGeometry args={[RADIUS, 64, 64]} />
          <meshPhongMaterial
            color="#080d18"
            emissive="#040810"
            emissiveIntensity={0.5}
            shininess={8}
          />
        </mesh>

        {/* Continent outlines */}
        <ContinentLines radius={RADIUS} />

        {/* Grid lines */}
        <GlobeGrid radius={RADIUS} />

        {/* Atmosphere glow */}
        <mesh scale={[1.15, 1.15, 1.15]}>
          <sphereGeometry args={[RADIUS, 64, 64]} />
          <shaderMaterial
            vertexShader={AtmosphereVertexShader}
            fragmentShader={AtmosphereFragmentShader}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Inner atmosphere — blue tint for depth */}
        <mesh scale={[1.03, 1.03, 1.03]}>
          <sphereGeometry args={[RADIUS, 64, 64]} />
          <shaderMaterial
            vertexShader={AtmosphereVertexShader}
            fragmentShader={`
              varying vec3 vNormal;
              void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                gl_FragColor = vec4(0.15, 0.3, 0.6, 1.0) * intensity * 0.2;
              }
            `}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Arcs */}
        {arcs.map((arc, i) => (
          <CityArc
            key={i}
            from={arc.from}
            to={arc.to}
            color={arc.color}
            radius={RADIUS}
          />
        ))}

        {/* City dots */}
        {allDots.map((dot) => (
          <CityDot
            key={dot.city}
            city={dot.city}
            position={dot.position}
            color={dot.color}
            status={dot.status}
            listeners={dot.listeners}
            isSelected={selectedCity === dot.city}
            onSelect={onSelectCity}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2.5}
        maxDistance={6}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
        zoomSpeed={0.5}
      />
    </>
  );
}

// ── Rankings sidebar ──
function CityRankings({ cities }: { cities: CityData[] }) {
  const maxListeners = cities[0]?.listeners || 1;

  return (
    <div
      style={{
        background: "#1C1C1E",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(255,255,255,0.55)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        Top Cities by Listeners
      </span>

      {cities.map((city, i) => {
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
                i < cities.length - 1
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
            <span style={{ fontSize: 16 }}>{city.flag}</span>
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
                    color: "rgba(255,255,255,0.87)",
                  }}
                >
                  {city.city}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
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
                    background: color,
                    borderRadius: 2,
                    transition: "width 600ms ease",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Legend ──
function GlobeLegend() {
  return (
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
  );
}

// ── Main export ──
interface GeoMapProps {
  cities: CityData[];
  onSelectMarket?: (market: string | null) => void;
}

export default function GeoMap3D({ cities, onSelectMarket }: GeoMapProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handleSelectCity = useCallback(
    (city: string | null) => {
      setSelectedCity(city);
      if (city && onSelectMarket) {
        const market = CITY_TO_MARKET[city] || null;
        onSelectMarket(market);
      } else if (!city && onSelectMarket) {
        onSelectMarket(null);
      }
    },
    [onSelectMarket],
  );

  const [lowFPS, setLowFPS] = useState(false);

  if (lowFPS) {
    // FPS too low — parent wrapper will catch this via lazy boundary,
    // but just in case, render nothing to trigger fallback
    throw new Error("WebGL performance too low for 3D globe");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}
    >
      {/* 3D Globe */}
      <div
        style={{
          background: "#0a0a0c",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
          minHeight: 480,
        }}
      >
        <Canvas
          camera={{ position: [0, 0.3, 4], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <GlobeScene
            cities={cities}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            onLowFPS={() => setLowFPS(true)}
          />
        </Canvas>
        <GlobeLegend />

        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
            }}
          >
            ?
          </span>
          Drag to rotate / Click dots
        </div>
      </div>

      {/* Rankings sidebar */}
      <CityRankings cities={cities} />
    </motion.div>
  );
}
