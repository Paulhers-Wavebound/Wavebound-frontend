/* ─── Mock Culture Genome data (500 nodes, 8 clusters) ──────── */

import type {
  GenomeNode,
  GenomeCluster,
  GenomeEdge,
  CultureGenomeData,
  GenomeLayer,
} from "@/types/cultureGenome";

/* ── Seeded random for reproducibility ──────────────────────── */

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function gaussianRand(): number {
  // Box-Muller transform
  const u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

/* ── Cluster definitions ────────────────────────────────────── */

interface ClusterDef {
  label: string;
  center: [number, number, number];
  spread: number;
  genre: string;
  mood: string;
  format: string;
  color: string;
  weight: number; // relative node count
}

const CLUSTER_DEFS: ClusterDef[] = [
  {
    label: "Latin Dance Viral",
    center: [15, 8, -5],
    spread: 4,
    genre: "Latin Pop",
    mood: "Energetic",
    format: "Lip Sync / Dance",
    color: "#FF453A",
    weight: 1.4,
  },
  {
    label: "Indie Mood Pop",
    center: [-12, 3, 10],
    spread: 5,
    genre: "Indie Pop",
    mood: "Melancholic",
    format: "Aesthetic Edit",
    color: "#0A84FF",
    weight: 1.2,
  },
  {
    label: "Afrobeats Rising",
    center: [8, -10, 12],
    spread: 3.5,
    genre: "Afrobeats",
    mood: "Joyful",
    format: "Transition Edit",
    color: "#30D158",
    weight: 1.0,
  },
  {
    label: "Confession Rap",
    center: [-8, -12, -8],
    spread: 4,
    genre: "Hip-Hop",
    mood: "Introspective",
    format: "Talking Head",
    color: "#BF5AF2",
    weight: 1.1,
  },
  {
    label: "K-Pop Choreography",
    center: [20, 15, 8],
    spread: 3,
    genre: "K-Pop",
    mood: "Hype",
    format: "Lip Sync / Dance",
    color: "#FF6482",
    weight: 0.8,
  },
  {
    label: "Lo-Fi Bedroom",
    center: [-18, 10, -12],
    spread: 4.5,
    genre: "Lo-Fi",
    mood: "Chill",
    format: "Lyric Overlay",
    color: "#64D2FF",
    weight: 0.9,
  },
  {
    label: "Country Storytelling",
    center: [5, 18, -15],
    spread: 3.5,
    genre: "Country",
    mood: "Nostalgic",
    format: "Text Story",
    color: "#FFD60A",
    weight: 0.7,
  },
  {
    label: "EDM Festival",
    center: [-5, -5, 20],
    spread: 4,
    genre: "EDM",
    mood: "Euphoric",
    format: "Concert",
    color: "#FF9F0A",
    weight: 0.9,
  },
];

const PERFORMANCE_TIERS = ["LOW", "MEDIUM", "HIGH", "VIRAL", "MEGA_VIRAL"];

const CREATOR_NAMES = [
  "luna.voss",
  "zayden.beats",
  "mira.sol",
  "kai.rhythm",
  "nova.waves",
  "echo.drift",
  "aria.flame",
  "jett.flow",
  "skye.melody",
  "rune.bass",
  "cleo.vibes",
  "axel.sync",
  "iris.tune",
  "blaze.drop",
  "sage.note",
  "vex.chord",
  "nyx.pulse",
  "dex.riff",
  "zara.hum",
  "finn.groove",
  "pearl.loop",
  "dash.tone",
  "lux.beat",
  "hex.mix",
  "vale.sound",
  "cruz.wave",
  "jade.amp",
  "tao.pitch",
  "ren.echo",
  "sol.fade",
];

/* ── Generate nodes ─────────────────────────────────────────── */

function generateNodes(): GenomeNode[] {
  const totalWeight = CLUSTER_DEFS.reduce((s, c) => s + c.weight, 0);
  const TARGET = 500;
  const nodes: GenomeNode[] = [];

  for (let ci = 0; ci < CLUSTER_DEFS.length; ci++) {
    const cluster = CLUSTER_DEFS[ci];
    const count = Math.round((cluster.weight / totalWeight) * TARGET);

    for (let i = 0; i < count; i++) {
      const id = `creator:mock_${nodes.length}`;
      const baseName = pick(CREATOR_NAMES);
      const display_name = `${baseName}${nodes.length}`;

      // Blended position = cluster center + Gaussian noise
      const pos_b: [number, number, number] = [
        cluster.center[0] + gaussianRand() * cluster.spread,
        cluster.center[1] + gaussianRand() * cluster.spread,
        cluster.center[2] + gaussianRand() * cluster.spread,
      ];

      // Other layers = shifted versions (simulating different UMAP projections)
      const pos_m: [number, number, number] = [
        pos_b[0] + gaussianRand() * 3,
        pos_b[1] + gaussianRand() * 3,
        pos_b[2] + gaussianRand() * 3,
      ];
      const pos_v: [number, number, number] = [
        pos_b[0] + gaussianRand() * 4,
        pos_b[1] + gaussianRand() * 2,
        pos_b[2] + gaussianRand() * 4,
      ];
      const pos_vr: [number, number, number] = [
        pos_b[0] + gaussianRand() * 2,
        pos_b[1] + gaussianRand() * 5,
        pos_b[2] + gaussianRand() * 2,
      ];

      const viral_score = Math.max(0, Math.min(100, 30 + gaussianRand() * 25));
      const total_views = Math.round(
        Math.pow(10, 3 + rand() * 4), // 1K to 10M
      );
      const tier_idx = Math.min(4, Math.max(0, Math.floor(viral_score / 20)));

      nodes.push({
        id,
        node_type: "creator",
        display_name,
        avatar_url: null,
        position_blended: pos_b,
        position_musical: pos_m,
        position_visual: pos_v,
        position_viral: pos_vr,
        cluster_blended: ci,
        cluster_musical: ci, // same cluster in mock — real data would differ
        cluster_visual: ci,
        cluster_viral: ci,
        size_score: Math.max(0.1, Math.min(1, viral_score / 80)),
        metadata: {
          viral_score,
          total_views,
          performance_tier: PERFORMANCE_TIERS[tier_idx],
          dominant_format: cluster.format,
          dominant_mood: cluster.mood,
          dominant_genre: cluster.genre,
          engagement_rate: parseFloat((rand() * 15 + 1).toFixed(1)),
          follower_count: Math.round(Math.pow(10, 2 + rand() * 5)),
          content_count: Math.round(rand() * 50 + 5),
        },
      });
    }
  }

  return nodes;
}

/* ── Generate clusters ──────────────────────────────────────── */

function generateClusters(nodes: GenomeNode[]): GenomeCluster[] {
  const layers: GenomeLayer[] = ["blended", "musical", "visual", "viral"];
  const clusters: GenomeCluster[] = [];

  for (const layer of layers) {
    for (let ci = 0; ci < CLUSTER_DEFS.length; ci++) {
      const def = CLUSTER_DEFS[ci];
      const members = nodes.filter((n) => {
        const key = `cluster_${layer}` as keyof GenomeNode;
        return n[key] === ci;
      });

      clusters.push({
        cluster_id: ci,
        layer,
        label: def.label,
        centroid: def.center,
        member_count: members.length,
        dominant_genre: def.genre,
        dominant_mood: def.mood,
        dominant_format: def.format,
        avg_viral_score: parseFloat(
          (
            members.reduce((s, n) => s + n.metadata.viral_score, 0) /
            (members.length || 1)
          ).toFixed(1),
        ),
        color: def.color,
      });
    }
  }

  return clusters;
}

/* ── Generate edges (top-3 nearest neighbors) ───────────────── */

function generateEdges(nodes: GenomeNode[]): GenomeEdge[] {
  const edges: GenomeEdge[] = [];
  const MAX_EDGES_PER_NODE = 3;

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const distances: { j: number; dist: number }[] = [];

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const b = nodes[j];
      const dx = a.position_blended[0] - b.position_blended[0];
      const dy = a.position_blended[1] - b.position_blended[1];
      const dz = a.position_blended[2] - b.position_blended[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 6) {
        distances.push({ j, dist });
      }
    }

    distances.sort((a, b) => a.dist - b.dist);

    for (let k = 0; k < Math.min(MAX_EDGES_PER_NODE, distances.length); k++) {
      const { j, dist } = distances[k];
      // Avoid duplicate edges
      if (i < j) {
        edges.push({
          source_id: a.id,
          target_id: nodes[j].id,
          similarity: Math.max(0, 1 - dist / 6),
        });
      }
    }
  }

  return edges;
}

/* ── Build & export ─────────────────────────────────────────── */

const nodes = generateNodes();
const clusters = generateClusters(nodes);
const edges = generateEdges(nodes);

export const MOCK_GENOME_DATA: CultureGenomeData = {
  nodes,
  clusters,
  edges,
  meta: {
    total_nodes: nodes.length,
    total_clusters: CLUSTER_DEFS.length,
    computed_at: new Date().toISOString(),
    layers_available: ["blended", "musical", "visual", "viral"],
  },
};

export { CLUSTER_DEFS };
