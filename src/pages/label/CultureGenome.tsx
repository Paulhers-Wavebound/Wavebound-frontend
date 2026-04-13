/* ─── CultureGenome — 3D Semantic Knowledge Graph page ─────── */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import CultureGenomeScene from "@/components/culture-genome/CultureGenomeScene";
import CultureGenomeControls from "@/components/culture-genome/CultureGenomeControls";
import CultureGenomeHUD from "@/components/culture-genome/CultureGenomeHUD";
import CultureGenomeDetailPanel from "@/components/culture-genome/CultureGenomeDetailPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useCultureGenomeData } from "@/hooks/useCultureGenomeData";
import { MOCK_GENOME_DATA } from "@/data/mockGenomeData";
import type { GenomeLayer, GenomeNode } from "@/types/cultureGenome";
import type * as THREE from "three";

const TRANSITION_FRAMES = 60;

function getNodePosition(
  node: GenomeNode,
  layer: GenomeLayer,
): [number, number, number] {
  switch (layer) {
    case "musical":
      return node.position_musical;
    case "visual":
      return node.position_visual;
    case "viral":
      return node.position_viral;
    default:
      return node.position_blended;
  }
}

/* ─── WebGL error fallback ──────────────────────────────────── */

function GenomeFallback({
  resetError,
}: {
  error?: Error;
  resetError: () => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#111110",
        color: "rgba(255,255,255,0.55)",
        fontFamily: "'DM Sans', sans-serif",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.3 }}>&#x1F30C;</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>
        WebGL context unavailable
      </div>
      <div
        style={{
          fontSize: 12,
          opacity: 0.5,
          maxWidth: 380,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Chrome's GPU process may have crashed. Try: quit and reopen Chrome, or
        check chrome://settings/system and enable "Use hardware acceleration
        when available".
      </div>
      <button
        onClick={resetError}
        style={{
          marginTop: 8,
          padding: "8px 20px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Try again
      </button>
    </div>
  );
}

export default function CultureGenome() {
  useSetPageTitle("Culture Genome");

  const { data: liveData, isLoading, error } = useCultureGenomeData();
  const data =
    liveData && liveData.nodes.length > 0 ? liveData : MOCK_GENOME_DATA;
  const isLive = liveData !== undefined && liveData.nodes.length > 0;

  // Camera ref for fly-to
  const cameraRef = useRef<THREE.Camera | null>(null);
  const controlsRef = useRef<{ target: THREE.Vector3 } | null>(null);

  // Layer state
  const [layer, setLayer] = useState<GenomeLayer>("blended");
  const [prevLayer, setPrevLayer] = useState<GenomeLayer>("blended");
  const [transition, setTransition] = useState(1);
  const transitionRef = useRef({ frame: 0, total: TRANSITION_FRAMES });

  // Interaction state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Hovered node data for HUD
  const hoveredNode = useMemo(
    () =>
      hoveredId ? (data.nodes.find((n) => n.id === hoveredId) ?? null) : null,
    [hoveredId, data.nodes],
  );

  // Direct cluster selection (from clicking a blob)
  const [selectedClusterDirect, setSelectedClusterDirect] = useState<
    number | null
  >(null);

  // Selected cluster: from direct blob click or from selected node's cluster
  const selectedClusterId = useMemo(() => {
    if (selectedClusterDirect !== null) return selectedClusterDirect;
    if (!selectedId) return null;
    const node = data.nodes.find((n) => n.id === selectedId);
    if (!node) return null;
    switch (layer) {
      case "musical":
        return node.cluster_musical;
      case "visual":
        return node.cluster_visual;
      case "viral":
        return node.cluster_viral;
      default:
        return node.cluster_blended;
    }
  }, [selectedId, selectedClusterDirect, data.nodes, layer]);

  // Layer change triggers animation
  const handleLayerChange = useCallback(
    (newLayer: GenomeLayer) => {
      if (newLayer === layer) return;
      setPrevLayer(layer);
      setLayer(newLayer);
      transitionRef.current.frame = 0;
      setTransition(0);
    },
    [layer],
  );

  // Animate transition
  useEffect(() => {
    if (transition >= 1) return;

    let raf: number;
    const animate = () => {
      transitionRef.current.frame++;
      const progress = Math.min(
        transitionRef.current.frame / transitionRef.current.total,
        1,
      );
      setTransition(progress);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [transition < 1]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setSelectedClusterDirect(null);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setSelectedClusterDirect(null);
  }, []);

  const handleClusterClick = useCallback((clusterId: number) => {
    setSelectedClusterDirect((prev) => (prev === clusterId ? null : clusterId));
    setSelectedId(null);
  }, []);

  // Search → fly camera to first matching node
  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (!q.trim()) return;

      const query = q.toLowerCase();
      const match = data.nodes.find((n) =>
        n.display_name.toLowerCase().includes(query),
      );
      if (!match) return;

      // Highlight the match
      setSelectedId(match.id);

      // Fly camera to match position
      const pos = getNodePosition(match, layer);
      const cam = cameraRef.current;
      const controls = controlsRef.current;
      if (!cam || !controls) return;

      // Animate camera over 40 frames
      const startPos = {
        x: cam.position.x,
        y: cam.position.y,
        z: cam.position.z,
      };
      const startTarget = {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z,
      };
      const endTarget = { x: pos[0], y: pos[1], z: pos[2] };
      // Position camera 15 units away from the target
      const endPos = { x: pos[0] + 8, y: pos[1] + 6, z: pos[2] + 12 };
      let frame = 0;
      const totalFrames = 40;

      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      const flyAnimate = () => {
        frame++;
        const t = easeOut(Math.min(frame / totalFrames, 1));
        cam.position.set(
          startPos.x + (endPos.x - startPos.x) * t,
          startPos.y + (endPos.y - startPos.y) * t,
          startPos.z + (endPos.z - startPos.z) * t,
        );
        controls.target.set(
          startTarget.x + (endTarget.x - startTarget.x) * t,
          startTarget.y + (endTarget.y - startTarget.y) * t,
          startTarget.z + (endTarget.z - startTarget.z) * t,
        );
        if (frame < totalFrames) {
          requestAnimationFrame(flyAnimate);
        }
      };
      requestAnimationFrame(flyAnimate);
    },
    [data.nodes, layer],
  );

  // Filter clusters for current layer
  const layerClusters = useMemo(
    () => data.clusters.filter((c) => c.layer === layer),
    [data.clusters, layer],
  );

  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111110",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.08)",
            borderTopColor: "#f25d24",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Computing genome from {">"}5,000 creators...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#111110",
      }}
    >
      {/* Live / Demo badge */}
      {!isLive && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          Demo Data
        </div>
      )}

      <CultureGenomeControls
        layer={layer}
        onLayerChange={handleLayerChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        nodeCount={data.meta.total_nodes}
        clusterCount={layerClusters.length}
      />

      <ErrorBoundary fallback={GenomeFallback}>
        <CultureGenomeScene
          data={data}
          layer={layer}
          prevLayer={prevLayer}
          transition={transition}
          hoveredId={hoveredId}
          selectedId={selectedId}
          selectedClusterId={selectedClusterId}
          onHover={setHoveredId}
          onClick={handleClick}
          onClusterClick={handleClusterClick}
          onClusterHover={setHoveredClusterId}
          onCameraReady={(cam, controls) => {
            cameraRef.current = cam;
            controlsRef.current = controls;
          }}
        />
      </ErrorBoundary>

      <CultureGenomeHUD
        clusters={data.clusters}
        layer={layer}
        hoveredNode={hoveredNode}
        hoveredClusterId={hoveredClusterId}
      />

      <CultureGenomeDetailPanel
        nodes={data.nodes}
        clusters={data.clusters}
        layer={layer}
        selectedNodeId={selectedId}
        selectedClusterId={selectedClusterId}
        onClose={handleClose}
      />
    </div>
  );
}
