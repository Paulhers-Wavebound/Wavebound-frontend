/* ─── CultureGenomeControls — Layer toggles + search ─────── */

import { useState } from "react";
import { Search, Music, Eye, TrendingUp, Layers } from "lucide-react";
import type { GenomeLayer } from "@/types/cultureGenome";

interface CultureGenomeControlsProps {
  layer: GenomeLayer;
  onLayerChange: (layer: GenomeLayer) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  nodeCount: number;
  clusterCount: number;
}

const LAYER_OPTIONS: {
  value: GenomeLayer;
  label: string;
  icon: typeof Layers;
}[] = [
  { value: "blended", label: "Blended", icon: Layers },
  { value: "musical", label: "Musical", icon: Music },
  { value: "visual", label: "Visual", icon: Eye },
  { value: "viral", label: "Viral", icon: TrendingUp },
];

export default function CultureGenomeControls({
  layer,
  onLayerChange,
  searchQuery,
  onSearchChange,
  nodeCount,
  clusterCount,
}: CultureGenomeControlsProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {/* Layer selector */}
      <div
        style={{
          display: "flex",
          gap: 2,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          borderRadius: 10,
          padding: 3,
          border: "1px solid rgba(255,255,255,0.06)",
          pointerEvents: "auto",
        }}
      >
        {LAYER_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = layer === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onLayerChange(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 150ms",
                background: active ? "rgba(242,93,36,0.15)" : "transparent",
                color: active ? "#f25d24" : "rgba(255,255,255,0.45)",
              }}
            >
              <Icon size={14} strokeWidth={1.8} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Node/cluster counter */}
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {nodeCount.toLocaleString()} nodes · {clusterCount} clusters
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          pointerEvents: "auto",
          transition: "width 200ms",
          width: searchOpen ? 240 : 36,
        }}
      >
        <button
          onClick={() => setSearchOpen((o) => !o)}
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.45)",
            flexShrink: 0,
          }}
        >
          <Search size={14} strokeWidth={1.8} />
        </button>
        {searchOpen && (
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search artists..."
            style={{
              flex: 1,
              height: 36,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.87)",
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              paddingRight: 12,
            }}
          />
        )}
      </div>
    </div>
  );
}
