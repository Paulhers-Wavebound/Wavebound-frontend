/* ─── CultureGenomeHUD — 2D overlay: legend + hovered info ── */

import { useMemo } from "react";
import type {
  GenomeNode,
  GenomeCluster,
  GenomeLayer,
} from "@/types/cultureGenome";

interface CultureGenomeHUDProps {
  clusters: GenomeCluster[];
  layer: GenomeLayer;
  hoveredNode: GenomeNode | null;
  hoveredClusterId?: number | null;
}

export default function CultureGenomeHUD({
  clusters,
  layer,
  hoveredNode,
  hoveredClusterId,
}: CultureGenomeHUDProps) {
  const layerClusters = useMemo(
    () => clusters.filter((c) => c.layer === layer),
    [clusters, layer],
  );

  const hoveredCluster = useMemo(
    () =>
      hoveredClusterId !== null && hoveredClusterId !== undefined
        ? (layerClusters.find((c) => c.cluster_id === hoveredClusterId) ?? null)
        : null,
    [hoveredClusterId, layerClusters],
  );

  return (
    <>
      {/* Cluster legend — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          borderRadius: 10,
          padding: "10px 14px",
          border: "1px solid rgba(255,255,255,0.06)",
          zIndex: 10,
          maxHeight: 240,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Clusters
        </div>
        {layerClusters.map((c) => (
          <div
            key={c.cluster_id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color:
                hoveredClusterId === c.cluster_id
                  ? "rgba(255,255,255,0.87)"
                  : "rgba(255,255,255,0.55)",
              fontFamily: "'DM Sans', sans-serif",
              transition: "color 150ms",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: c.color,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>{c.label}</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "rgba(255,255,255,0.30)",
              }}
            >
              {c.member_count}
            </span>
          </div>
        ))}
      </div>

      {/* Hovered cluster tooltip — center-top area */}
      {hoveredCluster && !hoveredNode && (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
            borderRadius: 10,
            padding: "10px 16px",
            border: `1px solid ${hoveredCluster.color}30`,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: hoveredCluster.color,
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.87)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {hoveredCluster.label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.40)",
                fontFamily: "'DM Sans', sans-serif",
                marginTop: 1,
              }}
            >
              {hoveredCluster.member_count.toLocaleString()} creators
              {hoveredCluster.avg_viral_score > 0 &&
                ` · avg viral ${hoveredCluster.avg_viral_score.toFixed(1)}`}
            </div>
          </div>
        </div>
      )}

      {/* Hovered node tooltip — top-right */}
      {hoveredNode && (
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 16,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
            borderRadius: 10,
            padding: "12px 16px",
            border: "1px solid rgba(255,255,255,0.08)",
            zIndex: 10,
            minWidth: 200,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.87)",
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 8,
            }}
          >
            {hoveredNode.display_name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <HudStat
              label="Viral Score"
              value={hoveredNode.metadata.viral_score.toFixed(1)}
            />
            <HudStat
              label="Views"
              value={formatViews(hoveredNode.metadata.total_views)}
            />
            <HudStat
              label="Tier"
              value={hoveredNode.metadata.performance_tier}
            />
            {hoveredNode.metadata.dominant_format && (
              <HudStat
                label="Language"
                value={hoveredNode.metadata.dominant_format}
              />
            )}
            {hoveredNode.metadata.follower_count != null &&
              hoveredNode.metadata.follower_count > 0 && (
                <HudStat
                  label="Followers"
                  value={formatViews(hoveredNode.metadata.follower_count)}
                />
              )}
            <HudStat
              label="Eng. Rate"
              value={`${hoveredNode.metadata.engagement_rate}%`}
            />
            <HudStat
              label="Videos"
              value={String(hoveredNode.metadata.content_count)}
            />
          </div>
        </div>
      )}
    </>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
