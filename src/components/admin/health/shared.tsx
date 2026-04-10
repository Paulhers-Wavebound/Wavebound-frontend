import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { formatPct } from "./helpers";

/* ── Section header ─────────────────────────────────── */

export function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <Icon size={15} color="var(--ink-tertiary)" />
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: "var(--ink-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Delta arrow ────────────────────────────────────── */

export function DeltaArrow({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          color: "#34d399",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        <TrendingUp size={12} />+{formatPct(value)}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          color: "#ef4444",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        <TrendingDown size={12} />
        {formatPct(value)}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: 500,
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <Minus size={12} />
      0%
    </span>
  );
}

/* ── Progress bar ───────────────────────────────────── */

export function ProgressBar({
  pct,
  color = "#22c55e",
  height = 8,
}: {
  pct: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: height / 2,
        background: "var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: "100%",
          borderRadius: height / 2,
          background: color,
          transition: "width 500ms ease",
        }}
      />
    </div>
  );
}

/* ── Collapsible section ────────────────────────────── */

export function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: open ? 12 : 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {open ? (
          <ChevronDown size={14} color="var(--ink-tertiary)" />
        ) : (
          <ChevronRight size={14} color="var(--ink-faint)" />
        )}
        <Icon size={15} color="var(--ink-tertiary)" />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </span>
      </button>
      {open && children}
    </div>
  );
}

/* ── Status dot ─────────────────────────────────────── */

export function StatusDot({ health }: { health: string }) {
  if (health === "overdue") {
    return (
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#9ca3af",
          display: "inline-block",
          flexShrink: 0,
          animation: "pulse-dot 2s ease-in-out infinite",
        }}
      />
    );
  }
  const color =
    health === "healthy"
      ? "#34d399"
      : health === "error"
        ? "#ef4444"
        : health === "running"
          ? "#f59e0b"
          : "#9ca3af";
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}
