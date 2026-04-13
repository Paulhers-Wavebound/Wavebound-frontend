/* ─── NodeCloud — InstancedMesh rendering for all genome nodes ── */

import { useRef, useMemo, useEffect } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { GenomeNode, GenomeLayer } from "@/types/cultureGenome";

interface NodeCloudProps {
  nodes: GenomeNode[];
  clusters: { cluster_id: number; color: string }[];
  layer: GenomeLayer;
  transition: number;
  prevLayer: GenomeLayer;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();
const accentColor = new THREE.Color("#f25d24");

/** Nodes with viral_score above this threshold get the pulse effect */
const HOT_THRESHOLD = 0.7;

function getPosition(
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

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function NodeCloud({
  nodes,
  clusters,
  layer,
  transition,
  prevLayer,
  hoveredId,
  selectedId,
  onHover,
  onClick,
}: NodeCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Build cluster color lookup
  const clusterColorMap = useMemo(() => {
    const map = new Map<number, THREE.Color>();
    for (const c of clusters) {
      map.set(c.cluster_id, new THREE.Color(c.color));
    }
    return map;
  }, [clusters]);

  // Node id → index lookup for raycasting
  const idIndexMap = useMemo(() => {
    const map = new Map<number, string>();
    nodes.forEach((n, i) => map.set(i, n.id));
    return map;
  }, [nodes]);

  // Initialize instance matrices on mount
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const pos = getPosition(node, layer);
      const scale = 0.1 + node.size_score * 0.5;

      tempObj.position.set(pos[0], pos[1], pos[2]);
      tempObj.scale.setScalar(scale);
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);

      const clusterKey = `cluster_${layer}` as keyof GenomeNode;
      const clusterId = node[clusterKey] as number;
      const color =
        clusterColorMap.get(clusterId) ?? new THREE.Color(0.5, 0.5, 0.5);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes, layer, clusterColorMap]);

  // Update instance matrices + colors every frame
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = state.clock.elapsedTime;
    const t = easeInOutCubic(transition);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const posA = getPosition(node, prevLayer);
      const posB = getPosition(node, layer);

      const x = posA[0] + (posB[0] - posA[0]) * t;
      const y = posA[1] + (posB[1] - posA[1]) * t;
      const z = posA[2] + (posB[2] - posA[2]) * t;

      const floatY = Math.sin(time * 0.5 + i * 0.1) * 0.15;

      // Size driven by viral score — wider range for visible differentiation
      let scale = 0.1 + node.size_score * 0.5;

      // Hot nodes: subtle breathing pulse
      const isHot = node.size_score > HOT_THRESHOLD;
      if (isHot) {
        const pulse = 1 + Math.sin(time * 2.5 + i * 0.7) * 0.15;
        scale *= pulse;
      }

      if (node.id === hoveredId) scale *= 1.8;
      if (node.id === selectedId) scale *= 1.5;

      tempObj.position.set(x, y + floatY, z);
      tempObj.scale.setScalar(scale);
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);

      // Color
      const clusterKey = `cluster_${layer}` as keyof GenomeNode;
      const clusterId = node[clusterKey] as number;
      const baseColor =
        clusterColorMap.get(clusterId) ?? new THREE.Color(0.5, 0.5, 0.5);

      if (node.id === hoveredId || node.id === selectedId) {
        tempColor.copy(accentColor);
      } else if (isHot) {
        // Hot nodes: lerp toward white for a glow effect
        const glowT = 0.15 + Math.sin(time * 2.5 + i * 0.7) * 0.1;
        tempColor.copy(baseColor).lerp(new THREE.Color(1, 1, 1), glowT);
      } else {
        tempColor.copy(baseColor);
        // Dim smaller nodes slightly for depth
        tempColor.multiplyScalar(0.5 + node.size_score * 0.5);
      }

      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  // Track dragging to suppress hover/click during orbit
  const pointerDown = useRef(false);
  const pointerMoved = useRef(false);

  const handlePointerDown = () => {
    pointerDown.current = true;
    pointerMoved.current = false;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (pointerDown.current) {
      pointerMoved.current = true;
      return;
    }
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      onHover(idIndexMap.get(e.instanceId) ?? null);
    }
  };

  const handlePointerUp = () => {
    pointerDown.current = false;
  };

  const handlePointerOut = () => {
    if (!pointerDown.current) onHover(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (pointerMoved.current) return;
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      const id = idIndexMap.get(e.instanceId);
      if (id) onClick(id);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[0.3, 2]} />
      <meshStandardMaterial
        roughness={0.3}
        metalness={0.5}
        emissive="#262626"
        emissiveIntensity={0.6}
      />
    </instancedMesh>
  );
}
