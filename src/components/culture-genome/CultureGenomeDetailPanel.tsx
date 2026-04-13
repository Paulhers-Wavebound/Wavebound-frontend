/* ─── CultureGenomeDetailPanel — Bottom slide-up on click ── */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Users, Zap } from "lucide-react";
import type {
  GenomeNode,
  GenomeCluster,
  GenomeLayer,
} from "@/types/cultureGenome";

interface CultureGenomeDetailPanelProps {
  nodes: GenomeNode[];
  clusters: GenomeCluster[];
  layer: GenomeLayer;
  selectedNodeId: string | null;
  selectedClusterId: number | null;
  onClose: () => void;
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

export default function CultureGenomeDetailPanel({
  nodes,
  clusters,
  layer,
  selectedNodeId,
  selectedClusterId,
  onClose,
}: CultureGenomeDetailPanelProps) {
  const isOpen = selectedNodeId !== null || selectedClusterId !== null;

  // Resolve which cluster to show
  const activeClusterId = useMemo(() => {
    if (selectedClusterId !== null) return selectedClusterId;
    if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node) return getClusterId(node, layer);
    }
    return null;
  }, [selectedNodeId, selectedClusterId, nodes, layer]);

  const activeCluster = useMemo(
    () =>
      clusters.find(
        (c) => c.cluster_id === activeClusterId && c.layer === layer,
      ) ?? null,
    [clusters, activeClusterId, layer],
  );

  // Cluster members sorted by viral_score descending
  const members = useMemo(() => {
    if (activeClusterId === null) return [];
    return nodes
      .filter((n) => getClusterId(n, layer) === activeClusterId)
      .sort((a, b) => b.metadata.viral_score - a.metadata.viral_score);
  }, [nodes, activeClusterId, layer]);

  const selectedNode = selectedNodeId
    ? (nodes.find((n) => n.id === selectedNodeId) ?? null)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "45vh",
            background: "rgba(17,17,16,0.92)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px 16px 0 0",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activeCluster && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: activeCluster.color,
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.87)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activeCluster?.label ?? "Unknown Cluster"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "'DM Sans', sans-serif",
                    marginTop: 2,
                  }}
                >
                  {activeCluster?.dominant_genre} ·{" "}
                  {activeCluster?.dominant_mood} · {members.length} creators
                </div>
              </div>
            </div>

            {/* Cluster stats */}
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              {activeCluster && (
                <>
                  <ClusterStat
                    icon={TrendingUp}
                    label="Avg Viral"
                    value={activeCluster.avg_viral_score.toFixed(1)}
                  />
                  <ClusterStat
                    icon={Users}
                    label="Members"
                    value={String(activeCluster.member_count)}
                  />
                  <ClusterStat
                    icon={Zap}
                    label="Format"
                    value={activeCluster.dominant_format}
                  />
                </>
              )}
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Member list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 20px 16px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "Creator",
                    "Viral",
                    "Views",
                    "Tier",
                    "Format",
                    "Engagement",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.30)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontFamily: "'DM Sans', sans-serif",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.slice(0, 50).map((node) => {
                  const isHighlighted = node.id === selectedNodeId;
                  return (
                    <tr
                      key={node.id}
                      style={{
                        background: isHighlighted
                          ? "rgba(242,93,36,0.08)"
                          : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={cellStyle}>
                        <span
                          style={{
                            color: isHighlighted
                              ? "#f25d24"
                              : "rgba(255,255,255,0.75)",
                            fontWeight: isHighlighted ? 600 : 400,
                          }}
                        >
                          {node.display_name}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, ...monoStyle }}>
                        {node.metadata.viral_score.toFixed(1)}
                      </td>
                      <td style={{ ...cellStyle, ...monoStyle }}>
                        {formatCompact(node.metadata.total_views)}
                      </td>
                      <td style={cellStyle}>
                        <TierBadge tier={node.metadata.performance_tier} />
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        {node.metadata.dominant_format ?? "—"}
                      </td>
                      <td style={{ ...cellStyle, ...monoStyle }}>
                        {node.metadata.engagement_rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Subcomponents ──────────────────────────────────────────── */

function ClusterStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Icon
          size={11}
          strokeWidth={1.6}
          style={{ color: "rgba(255,255,255,0.30)" }}
        />
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.30)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(255,255,255,0.75)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  MEGA_VIRAL: "#FF453A",
  VIRAL: "#FF9F0A",
  HIGH: "#FFD60A",
  MEDIUM: "#30D158",
  LOW: "rgba(255,255,255,0.25)",
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: 4,
        background: `${TIER_COLORS[tier] ?? "rgba(255,255,255,0.1)"}15`,
        color: TIER_COLORS[tier] ?? "rgba(255,255,255,0.45)",
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {tier.replace("_", " ")}
    </span>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "7px 8px",
  fontSize: 11,
  color: "rgba(255,255,255,0.55)",
  fontFamily: "'DM Sans', sans-serif",
  borderBottom: "1px solid rgba(255,255,255,0.03)",
};

const monoStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
