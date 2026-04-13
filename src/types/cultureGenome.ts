/* ─── Culture Genome — TypeScript interfaces ───────────────── */

export type GenomeLayer = "blended" | "musical" | "visual" | "viral";

export interface GenomeNode {
  id: string;
  node_type: "artist" | "creator" | "sound";
  display_name: string;
  avatar_url: string | null;

  /** Pre-computed 3D positions per layer (from UMAP projection) */
  position_blended: [number, number, number];
  position_musical: [number, number, number];
  position_visual: [number, number, number];
  position_viral: [number, number, number];

  /** Cluster assignment per layer (-1 = noise/unassigned) */
  cluster_blended: number;
  cluster_musical: number;
  cluster_visual: number;
  cluster_viral: number;

  /** 0-1 normalized — drives node radius */
  size_score: number;

  metadata: {
    viral_score: number;
    total_views: number;
    performance_tier: string;
    dominant_format: string | null;
    dominant_mood: string | null;
    dominant_genre: string | null;
    engagement_rate: number;
    follower_count: number | null;
    content_count: number;
  };
}

export interface GenomeCluster {
  cluster_id: number;
  layer: GenomeLayer;
  label: string;
  centroid: [number, number, number];
  member_count: number;
  dominant_genre: string;
  dominant_mood: string;
  dominant_format: string;
  avg_viral_score: number;
  color: string;
}

export interface GenomeEdge {
  source_id: string;
  target_id: string;
  similarity: number;
}

export interface CultureGenomeData {
  nodes: GenomeNode[];
  clusters: GenomeCluster[];
  edges: GenomeEdge[];
  meta: {
    total_nodes: number;
    total_clusters: number;
    computed_at: string;
    layers_available: GenomeLayer[];
  };
}
