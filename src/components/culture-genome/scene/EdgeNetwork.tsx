/* ─── EdgeNetwork — Similarity edges between nodes ─────────── */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type {
  GenomeNode,
  GenomeEdge,
  GenomeLayer,
} from "@/types/cultureGenome";

interface EdgeNetworkProps {
  nodes: GenomeNode[];
  edges: GenomeEdge[];
  layer: GenomeLayer;
  transition: number;
  prevLayer: GenomeLayer;
}

const MAX_VISIBLE_DIST = 40;

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

export default function EdgeNetwork({
  nodes,
  edges,
  layer,
  transition,
  prevLayer,
}: EdgeNetworkProps) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  const nodeMap = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((n, i) => map.set(n.id, i));
    return map;
  }, [nodes]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(edges.length * 6);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [edges.length]);

  useFrame((state) => {
    const line = lineRef.current;
    const mat = materialRef.current;
    if (!line || !mat) return;

    const camDist = state.camera.position.length();
    const opacity =
      camDist < MAX_VISIBLE_DIST
        ? Math.max(0, 0.12 * (1 - camDist / MAX_VISIBLE_DIST))
        : 0;
    mat.opacity = opacity;

    if (opacity === 0) return;

    const t = easeInOutCubic(transition);
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const srcIdx = nodeMap.get(edge.source_id);
      const tgtIdx = nodeMap.get(edge.target_id);
      if (srcIdx === undefined || tgtIdx === undefined) continue;

      const srcNode = nodes[srcIdx];
      const tgtNode = nodes[tgtIdx];

      const srcA = getPosition(srcNode, prevLayer);
      const srcB = getPosition(srcNode, layer);
      const tgtA = getPosition(tgtNode, prevLayer);
      const tgtB = getPosition(tgtNode, layer);

      const offset = i * 6;
      arr[offset] = srcA[0] + (srcB[0] - srcA[0]) * t;
      arr[offset + 1] = srcA[1] + (srcB[1] - srcA[1]) * t;
      arr[offset + 2] = srcA[2] + (srcB[2] - srcA[2]) * t;
      arr[offset + 3] = tgtA[0] + (tgtB[0] - tgtA[0]) * t;
      arr[offset + 4] = tgtA[1] + (tgtB[1] - tgtA[1]) * t;
      arr[offset + 5] = tgtA[2] + (tgtB[2] - tgtA[2]) * t;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={0.1}
        depthWrite={false}
      />
    </lineSegments>
  );
}
