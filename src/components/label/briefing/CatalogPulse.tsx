import { useMemo, useState } from "react";
import type { SongVelocityEntry, VelocityClass } from "@/types/artistBriefing";
import { VELOCITY_CONFIG } from "@/types/artistBriefing";

// ─── Helpers ─────────────────────────────────────────────────────

function formatStreams(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

// ─── Song Row ────────────────────────────────────────────────────

function SongRow({ song }: { song: SongVelocityEntry }) {
  const vel = VELOCITY_CONFIG[song.velocity_class] ?? VELOCITY_CONFIG.steady;
  const pct = song.pct_change_7d;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 0",
      }}
    >
      {/* Velocity badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {vel.icon}
      </span>

      {/* Song name */}
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.87)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {song.song_name}
      </span>

      {/* Velocity label */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 600,
          color: vel.color,
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {vel.label}
      </span>

      {/* Daily streams */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          color: "rgba(255,255,255,0.55)",
          width: 60,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {formatStreams(song.daily_streams)}/d
      </span>

      {/* 7d change */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 600,
          color:
            pct > 0 ? "#30D158" : pct < 0 ? "#FF453A" : "rgba(255,255,255,0.25)",
          width: 50,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {pct > 0 ? "+" : ""}
        {pct !== 0 ? `${pct.toFixed(0)}%` : "\u2014"}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

interface CatalogPulseProps {
  songs: SongVelocityEntry[];
}

export default function CatalogPulse({ songs }: CatalogPulseProps) {
  const [expanded, setExpanded] = useState(false);

  // Sort: hot velocity first, then by streams
  const sorted = useMemo(() => {
    const priority: Record<VelocityClass, number> = {
      viral: 0,
      accelerating: 1,
      growing: 2,
      new: 3,
      steady: 4,
      decelerating: 5,
      declining: 6,
    };
    return [...songs].sort(
      (a, b) =>
        (priority[a.velocity_class] ?? 4) - (priority[b.velocity_class] ?? 4) ||
        b.daily_streams - a.daily_streams,
    );
  }, [songs]);

  const visible = expanded ? sorted : sorted.slice(0, 5);
  const hiddenCount = sorted.length - 5;

  // Summary counts
  const hotCount = songs.filter(
    (s) => s.velocity_class === "viral" || s.velocity_class === "accelerating",
  ).length;
  const growingCount = songs.filter(
    (s) => s.velocity_class === "growing",
  ).length;
  const decliningCount = songs.filter(
    (s) =>
      s.velocity_class === "declining" || s.velocity_class === "decelerating",
  ).length;

  if (songs.length === 0) {
    return (
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 20px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.30)",
          }}
        >
          Song velocity data loading...
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "1px",
          }}
        >
          CATALOG PULSE
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          {hotCount > 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: "#FF453A",
              }}
            >
              {hotCount} hot
            </span>
          )}
          {growingCount > 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: "#30D158",
              }}
            >
              {growingCount} growing
            </span>
          )}
          {decliningCount > 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: "#FF453A",
              }}
            >
              {decliningCount} declining
            </span>
          )}
        </div>
      </div>

      {/* Song rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {visible.map((song) => (
          <SongRow key={song.entity_id} song={song} />
        ))}
      </div>

      {/* Expand */}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "8px 0",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "rgba(255,255,255,0.40)",
            cursor: "pointer",
          }}
        >
          + {hiddenCount} more songs
        </button>
      )}
    </div>
  );
}
