/* ─── ClusterBlobs — Transparent galaxy boundary meshes ─────── */

import { useMemo, useRef } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type {
  GenomeNode,
  GenomeCluster,
  GenomeLayer,
} from "@/types/cultureGenome";

interface ClusterBlobsProps {
  nodes: GenomeNode[];
  clusters: GenomeCluster[];
  layer: GenomeLayer;
  selectedClusterId: number | null;
  onClusterClick?: (clusterId: number) => void;
  onClusterHover?: (clusterId: number | null) => void;
}

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

function getClusterId(node: GenomeNode, layer: GenomeLayer): number {
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
}

function computeClusterBounds(
  nodes: GenomeNode[],
  clusterId: number,
  layer: GenomeLayer,
) {
  const members = nodes.filter((n) => getClusterId(n, layer) === clusterId);
  if (members.length < 3) return null;

  const center = [0, 0, 0];
  for (const m of members) {
    const p = getPosition(m, layer);
    center[0] += p[0];
    center[1] += p[1];
    center[2] += p[2];
  }
  center[0] /= members.length;
  center[1] /= members.length;
  center[2] /= members.length;

  let maxDist = 0;
  for (const m of members) {
    const p = getPosition(m, layer);
    const d = Math.sqrt(
      (p[0] - center[0]) ** 2 +
        (p[1] - center[1]) ** 2 +
        (p[2] - center[2]) ** 2,
    );
    if (d > maxDist) maxDist = d;
  }

  return {
    center: center as [number, number, number],
    radius: maxDist * 1.2 + 1,
    memberCount: members.length,
  };
}

export default function ClusterBlobs({
  nodes,
  clusters,
  layer,
  selectedClusterId,
  onClusterClick,
  onClusterHover,
}: ClusterBlobsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointerDown = useRef(false);
  const pointerMoved = useRef(false);

  const blobs = useMemo(() => {
    const layerClusters = clusters.filter((c) => c.layer === layer);
    return layerClusters
      .map((cluster) => {
        const bounds = computeClusterBounds(nodes, cluster.cluster_id, layer);
        if (!bounds) return null;
        return { ...bounds, cluster };
      })
      .filter(Boolean) as {
      center: [number, number, number];
      radius: number;
      memberCount: number;
      cluster: GenomeCluster;
    }[];
  }, [nodes, clusters, layer]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const pulse = 1 + Math.sin(time * 0.3 + i * 1.5) * 0.03;
        child.scale.setScalar(pulse);
      }
    });
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={() => {
        pointerDown.current = true;
        pointerMoved.current = false;
      }}
      onPointerUp={() => {
        pointerDown.current = false;
      }}
    >
      {blobs.map((blob) => {
        const isSelected = blob.cluster.cluster_id === selectedClusterId;
        return (
          <mesh
            key={`${blob.cluster.layer}-${blob.cluster.cluster_id}`}
            position={blob.center}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (pointerMoved.current) return;
              e.stopPropagation();
              onClusterClick?.(blob.cluster.cluster_id);
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              if (pointerDown.current) {
                pointerMoved.current = true;
                return;
              }
              e.stopPropagation();
              onClusterHover?.(blob.cluster.cluster_id);
            }}
            onPointerOut={() => {
              if (!pointerDown.current) onClusterHover?.(null);
            }}
            onPointerMove={() => {
              if (pointerDown.current) pointerMoved.current = true;
            }}
          >
            <icosahedronGeometry args={[blob.radius, 3]} />
            <meshStandardMaterial
              color={blob.cluster.color}
              transparent
              opacity={isSelected ? 0.12 : 0.04}
              side={THREE.BackSide}
              depthWrite={false}
              wireframe={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
