/* ─── genomeCompute — Build 3D genome from raw hitl_tiktok rows ─ */

import { UMAP } from "umap-js";
import type {
  GenomeNode,
  GenomeCluster,
  GenomeEdge,
  GenomeLayer,
  CultureGenomeData,
} from "@/types/cultureGenome";

/* ── Types for raw Supabase rows ────────────────────────────── */

export interface HitlRow {
  author_unique_id: string;
  author_nickname: string | null;
  author_avatar_url: string | null;
  author_followers: number | null;
  play_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  collect_count: number | null;
  viral_score: number | null;
  performance_multiplier: string | null;
  language: string | null;
  duration_seconds: number | null;
  content_type: string | null;
  music_author: string | null;
  hashtags: string | null;
  caption: string | null;
  creator_avg_views: number | null;
  creator_avg_engagement: number | null;
  creator_median_views: number | null;
  date_posted: string | null;
}

/* ── Aggregate rows by creator ──────────────────────────────── */

interface CreatorAgg {
  id: string;
  display_name: string;
  avatar_url: string | null;
  video_count: number;
  avg_viral: number;
  total_views: number;
  avg_like_rate: number;
  avg_comment_rate: number;
  avg_share_rate: number;
  avg_collect_rate: number;
  followers: number;
  avg_duration: number;
  top_language: string;
  top_content_type: string;
  top_music_author: string;
  performance_tier: string;
  avg_engagement: number;
}

function aggregateByCreator(rows: HitlRow[]): CreatorAgg[] {
  const groups = new Map<string, HitlRow[]>();
  for (const row of rows) {
    if (!row.author_unique_id) continue;
    const key = row.author_unique_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const creators: CreatorAgg[] = [];

  for (const [authorId, videos] of groups) {
    const n = videos.length;
    if (n === 0) continue;

    // Pick the first non-null for identity fields
    const displayName =
      videos.find((v) => v.author_nickname)?.author_nickname ?? authorId;
    const avatar =
      videos.find((v) => v.author_avatar_url)?.author_avatar_url ?? null;
    const followers =
      videos.find((v) => v.author_followers)?.author_followers ?? 0;

    // Aggregate metrics
    let totalViews = 0;
    let totalViral = 0;
    let totalLikeRate = 0;
    let totalCommentRate = 0;
    let totalShareRate = 0;
    let totalCollectRate = 0;
    let totalDuration = 0;
    let validRates = 0;

    const langCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    const musicCounts = new Map<string, number>();
    const tierCounts = new Map<string, number>();

    for (const v of videos) {
      const views = v.play_count ?? 0;
      totalViews += views;
      totalViral += v.viral_score ?? 0;
      totalDuration += v.duration_seconds ?? 0;

      if (views > 0) {
        totalLikeRate += (v.like_count ?? 0) / views;
        totalCommentRate += (v.comment_count ?? 0) / views;
        totalShareRate += (v.share_count ?? 0) / views;
        totalCollectRate += (v.collect_count ?? 0) / views;
        validRates++;
      }

      if (v.language)
        langCounts.set(v.language, (langCounts.get(v.language) ?? 0) + 1);
      if (v.content_type)
        typeCounts.set(
          v.content_type,
          (typeCounts.get(v.content_type) ?? 0) + 1,
        );
      if (v.music_author)
        musicCounts.set(
          v.music_author,
          (musicCounts.get(v.music_author) ?? 0) + 1,
        );
      if (v.performance_multiplier)
        tierCounts.set(
          v.performance_multiplier,
          (tierCounts.get(v.performance_multiplier) ?? 0) + 1,
        );
    }

    const topOf = (m: Map<string, number>) => {
      let best = "";
      let max = 0;
      for (const [k, v] of m) {
        if (v > max) {
          max = v;
          best = k;
        }
      }
      return best || "unknown";
    };

    creators.push({
      id: authorId,
      display_name: displayName,
      avatar_url: avatar,
      video_count: n,
      avg_viral: totalViral / n,
      total_views: totalViews,
      avg_like_rate: validRates > 0 ? totalLikeRate / validRates : 0,
      avg_comment_rate: validRates > 0 ? totalCommentRate / validRates : 0,
      avg_share_rate: validRates > 0 ? totalShareRate / validRates : 0,
      avg_collect_rate: validRates > 0 ? totalCollectRate / validRates : 0,
      followers,
      avg_duration: totalDuration / n,
      top_language: topOf(langCounts),
      top_content_type: topOf(typeCounts),
      top_music_author: topOf(musicCounts),
      performance_tier: topOf(tierCounts),
      avg_engagement: videos[0]?.creator_avg_engagement ?? 0,
    });
  }

  return creators;
}

/* ── Build feature vectors ──────────────────────────────────── */

// Collect all unique values for one-hot encoding
function collectUniques(
  creators: CreatorAgg[],
  key: keyof CreatorAgg,
  maxCategories: number,
): string[] {
  const counts = new Map<string, number>();
  for (const c of creators) {
    const val = String(c[key]);
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCategories)
    .map(([k]) => k);
}

/** Per-layer feature subsets */
interface LayerVectors {
  blended: number[][];
  musical: number[][];
  visual: number[][];
  viral: number[][];
}

function buildLayerVectors(creators: CreatorAgg[]): LayerVectors {
  const topLangs = collectUniques(creators, "top_language", 8);
  const topMusic = collectUniques(creators, "top_music_author", 10);

  const maxViews = Math.max(1, ...creators.map((c) => c.total_views));
  const maxFollowers = Math.max(1, ...creators.map((c) => c.followers));
  const maxDuration = Math.max(1, ...creators.map((c) => c.avg_duration));
  const maxEngagement = Math.max(1, ...creators.map((c) => c.avg_engagement));

  const blended: number[][] = [];
  const musical: number[][] = [];
  const visual: number[][] = [];
  const viral: number[][] = [];

  for (const c of creators) {
    // Shared sub-vectors
    const engagement = [
      Math.min(1, c.avg_like_rate * 10),
      Math.min(1, c.avg_comment_rate * 100),
      Math.min(1, c.avg_share_rate * 100),
      Math.min(1, c.avg_collect_rate * 100),
      c.avg_viral / 100,
    ];
    const profile = [
      Math.log10(c.total_views + 1) / Math.log10(maxViews + 1),
      Math.log10(c.followers + 1) / Math.log10(maxFollowers + 1),
      c.avg_engagement / maxEngagement,
    ];
    const content = [
      c.avg_duration / maxDuration,
      Math.min(1, c.video_count / 50),
    ];
    const langOneHot = topLangs.map((l) => (c.top_language === l ? 1 : 0));
    const musicOneHot = topMusic.map((m) => (c.top_music_author === m ? 1 : 0));

    // Blended: everything
    blended.push([
      ...engagement,
      ...profile,
      ...content,
      ...langOneHot,
      ...musicOneHot,
    ]);

    // Musical: music author + language + duration (what sound world they're in)
    musical.push([...musicOneHot, ...langOneHot, c.avg_duration / maxDuration]);

    // Visual: creator profile + content volume (who they are as creators)
    visual.push([
      ...profile,
      ...content,
      Math.log10(c.followers + 1) / Math.log10(maxFollowers + 1),
    ]);

    // Viral: pure performance metrics (how they perform)
    viral.push([
      ...engagement,
      c.avg_viral / 100,
      Math.log10(c.total_views + 1) / Math.log10(maxViews + 1),
    ]);
  }

  return { blended, musical, visual, viral };
}

/* ── UMAP projection ────────────────────────────────────────── */

function runUMAP(vectors: number[][]): [number, number, number][] {
  if (vectors.length < 5) {
    // Too few points for UMAP — scatter randomly
    return vectors.map(() => [
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
    ]);
  }

  const nNeighbors = Math.min(15, Math.floor(vectors.length / 2));
  const umap = new UMAP({
    nComponents: 3,
    nNeighbors,
    minDist: 0.1,
    spread: 1.0,
  });

  const embedding = umap.fit(vectors);

  // Scale to a nice viewing range (~30 units)
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  for (const p of embedding) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
    if (p[2] < minZ) minZ = p[2];
    if (p[2] > maxZ) maxZ = p[2];
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const rangeZ = maxZ - minZ || 1;
  const SCALE = 40;

  return embedding.map((p) => [
    ((p[0] - minX) / rangeX - 0.5) * SCALE,
    ((p[1] - minY) / rangeY - 0.5) * SCALE,
    ((p[2] - minZ) / rangeZ - 0.5) * SCALE,
  ]);
}

/* ── Simple k-means clustering ──────────────────────────────── */

function kMeans(
  points: [number, number, number][],
  k: number,
  maxIter = 20,
): number[] {
  const n = points.length;
  if (n <= k) return points.map((_, i) => i);

  // Init centroids: pick k random points
  const centroids: [number, number, number][] = [];
  const used = new Set<number>();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * n);
    if (!used.has(idx)) {
      used.add(idx);
      centroids.push([...points[idx]]);
    }
  }

  const assignments = new Array<number>(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign each point to nearest centroid
    let changed = false;
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const dx = points[i][0] - centroids[c][0];
        const dy = points[i][1] - centroids[c][1];
        const dz = points[i][2] - centroids[c][2];
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    // Update centroids
    for (let c = 0; c < k; c++) {
      let sx = 0,
        sy = 0,
        sz = 0,
        count = 0;
      for (let i = 0; i < n; i++) {
        if (assignments[i] === c) {
          sx += points[i][0];
          sy += points[i][1];
          sz += points[i][2];
          count++;
        }
      }
      if (count > 0) {
        centroids[c] = [sx / count, sy / count, sz / count];
      }
    }
  }

  return assignments;
}

/* ── Cluster color palette ──────────────────────────────────── */

const CLUSTER_PALETTE = [
  "#FF453A",
  "#0A84FF",
  "#30D158",
  "#BF5AF2",
  "#FF6482",
  "#64D2FF",
  "#FFD60A",
  "#FF9F0A",
  "#5AC8FA",
  "#DA70D6",
  "#34C759",
  "#AC8E68",
  "#C9B1FF",
  "#FF8A65",
  "#8E8E93",
  "#FFCA28",
];

/* ── Language code → readable name ───────────────────────────── */

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  ko: "Korean",
  ja: "Japanese",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  zh: "Chinese",
  th: "Thai",
  tr: "Turkish",
  pl: "Polish",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  id: "Indonesian",
  ms: "Malay",
  vi: "Vietnamese",
  tl: "Filipino",
  ro: "Romanian",
  uk: "Ukrainian",
  cs: "Czech",
  el: "Greek",
  he: "Hebrew",
  hu: "Hungarian",
  bg: "Bulgarian",
  hr: "Croatian",
};

/* ── Generate cluster labels from member data ───────────────── */

/** Convert raw performance_multiplier ("4.68x", "LOW", etc.) to a clean tier */
function parseTier(raw: string): string {
  if (!raw || raw === "unknown") return "Unknown";
  const upper = raw.toUpperCase().replace(/[^A-Z0-9.]/g, "");
  if (upper === "MEGAVIRAL" || upper === "MEGA_VIRAL") return "Mega Viral";
  if (upper === "VIRAL") return "Viral";
  if (upper === "HIGH") return "High";
  if (upper === "MEDIUM") return "Medium";
  if (upper === "LOW") return "Low";
  // Numeric multiplier: "4.68x" → parse the number
  const num = parseFloat(raw);
  if (!isNaN(num)) {
    if (num >= 10) return "Mega Viral";
    if (num >= 5) return "Viral";
    if (num >= 2) return "High";
    if (num >= 1) return "Medium";
    return "Low";
  }
  return "Unknown";
}

function generateClusterLabel(members: CreatorAgg[]): {
  label: string;
  genre: string;
  mood: string;
  format: string;
} {
  const langCounts = new Map<string, number>();

  for (const m of members) {
    const lang = m.top_language?.toLowerCase();
    if (
      lang &&
      lang !== "unknown" &&
      lang !== "und" &&
      lang !== "un" &&
      lang.length >= 2 &&
      lang.length <= 3
    ) {
      langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1);
    }
  }

  // Top language (skip unknowns)
  const topLangEntry = [...langCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topLang = topLangEntry?.[0] ?? null;
  const langPct = topLangEntry ? topLangEntry[1] / members.length : 0;
  const langName = topLang
    ? (LANG_NAMES[topLang] ?? topLang.toUpperCase())
    : null;
  // Only show language if it's dominant (>40% of cluster)
  const showLang = langName && langName !== "English" && langPct > 0.4;

  // Engagement profiles
  const avgViral =
    members.reduce((s, m) => s + m.avg_viral, 0) / members.length;
  const avgLikeRate =
    members.reduce((s, m) => s + m.avg_like_rate, 0) / members.length;
  const avgCommentRate =
    members.reduce((s, m) => s + m.avg_comment_rate, 0) / members.length;
  const avgFollowers =
    members.reduce((s, m) => s + m.followers, 0) / members.length;
  const avgViews =
    members.reduce((s, m) => s + m.total_views, 0) / members.length;
  const avgVideos =
    members.reduce((s, m) => s + m.video_count, 0) / members.length;

  // Momentum tier
  const momentumLabel =
    avgViral > 60
      ? "Viral"
      : avgViral > 30
        ? "Rising"
        : avgViral > 15
          ? "Active"
          : "Emerging";

  // Creator profile
  const profileLabel =
    avgFollowers > 500000
      ? "Major Creators"
      : avgFollowers > 100000
        ? "Mid-Tier Creators"
        : avgFollowers > 10000
          ? "Growing Creators"
          : avgVideos > 15
            ? "Prolific Posters"
            : avgViews > 1000000
              ? "High-Reach"
              : "Micro Creators";

  // Engagement style
  const engStyle =
    avgCommentRate > 0.01
      ? "Comment-Heavy"
      : avgLikeRate > 0.1
        ? "High Like-Rate"
        : null;

  // Build label
  const parts: string[] = [];
  if (showLang) parts.push(langName!);
  parts.push(profileLabel);
  if (engStyle) parts.push(engStyle);
  parts.push(momentumLabel);

  return {
    label: parts.join(" · "),
    genre: profileLabel,
    mood: momentumLabel,
    format: engStyle ?? "Mixed",
  };
}

/* ── Main: compute full genome data ─────────────────────────── */

export function computeGenomeData(rows: HitlRow[]): CultureGenomeData {
  const cleanRows = rows.filter(
    (r) => r.author_unique_id && (r.play_count ?? 0) > 0,
  );
  const allCreators = aggregateByCreator(cleanRows);
  const creators = allCreators.filter(
    (c) => c.total_views > 0 && c.video_count > 0,
  );
  if (creators.length === 0) {
    return {
      nodes: [],
      clusters: [],
      edges: [],
      meta: {
        total_nodes: 0,
        total_clusters: 0,
        computed_at: new Date().toISOString(),
        layers_available: ["blended"],
      },
    };
  }

  // Build per-layer feature vectors
  const layerVecs = buildLayerVectors(creators);

  // Run UMAP for each layer
  console.log("[CultureGenome] Running UMAP × 4 layers...");
  const posBlended = runUMAP(layerVecs.blended);
  const posMusical = runUMAP(layerVecs.musical);
  const posVisual = runUMAP(layerVecs.visual);
  const posViral = runUMAP(layerVecs.viral);
  console.log("[CultureGenome] UMAP complete");

  // Cluster each layer separately
  const k = Math.min(
    12,
    Math.max(3, Math.round(Math.sqrt(creators.length / 3))),
  );
  const clBlended = kMeans(posBlended, k);
  const clMusical = kMeans(posMusical, k);
  const clVisual = kMeans(posVisual, k);
  const clViral = kMeans(posViral, k);

  // Build nodes
  const maxViews = Math.max(1, ...creators.map((c) => c.total_views));
  const nodes: GenomeNode[] = creators.map((creator, i) => {
    const sizeScore = Math.min(
      1,
      Math.max(
        0.1,
        Math.log10(creator.total_views + 1) / Math.log10(maxViews + 1),
      ),
    );

    return {
      id: `creator:${creator.id}`,
      node_type: "creator" as const,
      display_name: creator.display_name,
      avatar_url: creator.avatar_url,
      position_blended: posBlended[i],
      position_musical: posMusical[i],
      position_visual: posVisual[i],
      position_viral: posViral[i],
      cluster_blended: clBlended[i],
      cluster_musical: clMusical[i],
      cluster_visual: clVisual[i],
      cluster_viral: clViral[i],
      size_score: sizeScore,
      metadata: {
        viral_score: creator.avg_viral,
        total_views: creator.total_views,
        performance_tier: parseTier(creator.performance_tier),
        dominant_format: creator.top_language
          ? (LANG_NAMES[creator.top_language.toLowerCase()] ??
            creator.top_language)
          : null,
        dominant_mood: null,
        dominant_genre: null,
        engagement_rate: parseFloat((creator.avg_like_rate * 100).toFixed(1)),
        follower_count: creator.followers,
        content_count: creator.video_count,
      },
    };
  });

  // Build clusters per layer with their own positions + assignments
  const layerConfigs: {
    name: GenomeLayer;
    positions: [number, number, number][];
    assignments: number[];
  }[] = [
    { name: "blended", positions: posBlended, assignments: clBlended },
    { name: "musical", positions: posMusical, assignments: clMusical },
    { name: "visual", positions: posVisual, assignments: clVisual },
    { name: "viral", positions: posViral, assignments: clViral },
  ];

  const clusters: GenomeCluster[] = [];
  for (const { name, positions, assignments } of layerConfigs) {
    for (let c = 0; c < k; c++) {
      const memberIndices = assignments
        .map((a, i) => (a === c ? i : -1))
        .filter((i) => i >= 0);

      if (memberIndices.length === 0) continue;

      const members = memberIndices.map((i) => creators[i]);
      const clusterInfo = generateClusterLabel(members);

      const cx =
        memberIndices.reduce((s, i) => s + positions[i][0], 0) /
        memberIndices.length;
      const cy =
        memberIndices.reduce((s, i) => s + positions[i][1], 0) /
        memberIndices.length;
      const cz =
        memberIndices.reduce((s, i) => s + positions[i][2], 0) /
        memberIndices.length;

      clusters.push({
        cluster_id: c,
        layer: name,
        label: clusterInfo.label,
        centroid: [cx, cy, cz],
        member_count: memberIndices.length,
        dominant_genre: clusterInfo.genre,
        dominant_mood: clusterInfo.mood,
        dominant_format: clusterInfo.format,
        avg_viral_score: parseFloat(
          (
            members.reduce((s, m) => s + m.avg_viral, 0) / members.length
          ).toFixed(1),
        ),
        color: CLUSTER_PALETTE[c % CLUSTER_PALETTE.length],
      });
    }
  }

  // Build edges (top-3 nearest neighbors in blended space)
  const edges: GenomeEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const distances: { j: number; dist: number }[] = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = posBlended[i][0] - posBlended[j][0];
      const dy = posBlended[i][1] - posBlended[j][1];
      const dz = posBlended[i][2] - posBlended[j][2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 6) distances.push({ j, dist });
    }
    distances.sort((a, b) => a.dist - b.dist);
    for (let k2 = 0; k2 < Math.min(3, distances.length); k2++) {
      edges.push({
        source_id: nodes[i].id,
        target_id: nodes[distances[k2].j].id,
        similarity: Math.max(0, 1 - distances[k2].dist / 6),
      });
    }
  }

  return {
    nodes,
    clusters,
    edges,
    meta: {
      total_nodes: nodes.length,
      total_clusters: k,
      computed_at: new Date().toISOString(),
      layers_available: ["blended", "musical", "visual", "viral"],
    },
  };
}
