/* ─── CultureGenomeScene — R3F Canvas + scene orchestration ── */

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import NodeCloud from "./scene/NodeCloud";
import StarField from "./scene/StarField";
import EdgeNetwork from "./scene/EdgeNetwork";
import ClusterBlobs from "./scene/ClusterBlobs";
import type { CultureGenomeData, GenomeLayer } from "@/types/cultureGenome";
import type * as THREE from "three";

interface CultureGenomeSceneProps {
  data: CultureGenomeData;
  layer: GenomeLayer;
  prevLayer: GenomeLayer;
  transition: number;
  hoveredId: string | null;
  selectedId: string | null;
  selectedClusterId: number | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  onClusterClick?: (clusterId: number) => void;
  onClusterHover?: (clusterId: number | null) => void;
  onCameraReady?: (
    camera: THREE.Camera,
    controls: { target: THREE.Vector3 },
  ) => void;
}

export default function CultureGenomeScene({
  data,
  layer,
  prevLayer,
  transition,
  hoveredId,
  selectedId,
  selectedClusterId,
  onHover,
  onClick,
  onClusterClick,
  onClusterHover,
  onCameraReady,
}: CultureGenomeSceneProps) {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  return (
    <Canvas
      camera={{ position: [0, 0, 60], fov: 55, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: "#111110" }}
      onPointerMissed={() => {
        onHover(null);
      }}
      onCreated={({ camera }) => {
        // Expose camera + controls ref to parent once canvas is ready
        if (onCameraReady) {
          // Small delay to let OrbitControls mount
          setTimeout(() => {
            const controls = controlsRef.current;
            if (controls) {
              onCameraReady(
                camera,
                controls as unknown as { target: THREE.Vector3 },
              );
            }
          }, 150);
        }
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[20, 30, 10]} intensity={0.6} />
      <pointLight position={[-15, -10, 20]} intensity={0.3} color="#f25d24" />

      <StarField />

      <ClusterBlobs
        nodes={data.nodes}
        clusters={data.clusters}
        layer={layer}
        selectedClusterId={selectedClusterId}
        onClusterClick={onClusterClick}
        onClusterHover={onClusterHover}
      />

      <EdgeNetwork
        nodes={data.nodes}
        edges={data.edges}
        layer={layer}
        transition={transition}
        prevLayer={prevLayer}
      />

      <NodeCloud
        nodes={data.nodes}
        clusters={data.clusters}
        layer={layer}
        transition={transition}
        prevLayer={prevLayer}
        hoveredId={hoveredId}
        selectedId={selectedId}
        onHover={onHover}
        onClick={onClick}
      />

      <OrbitControls
        ref={controlsRef}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={150}
        enablePan
      />
    </Canvas>
  );
}
