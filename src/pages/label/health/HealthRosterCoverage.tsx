import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Check, X, AlertTriangle, RefreshCw } from "lucide-react";
import { normalizeHandle } from "@/data/contentDashboardHelpers";

/* ─── Types ─────────────────────────────────────────────────── */

interface RosterRow {
  artist_name: string | null;
  artist_handle: string | null;
  // roster_dashboard_metrics
  total_videos: number | null;
  days_since_last_post: number | null;
  avg_views_7d: number | null;
  avg_views_30d: number | null;
  delta_avg_views_pct: number | null;
  avg_engagement_30d: number | null;
  delta_engagement_pct: number | null;
  tiktok_followers: number | null;
  instagram_followers: number | null;
  delta_followers_pct: number | null;
  momentum_tier: string | null;
  risk_level: string | null;
  // artist_content_dna
  videos_analyzed: number | null;
  avg_hook_score: number | null;
  avg_viral_score: number | null;
  best_format: string | null;
  primary_genre: string | null;
  // artist_content_evolution
  performance_trend: string | null;
  views_change_pct: number | null;
  strategy_label: string | null;
}

interface FieldDef {
  key: keyof RosterRow;
  label: string;
  group: string;
  format?: (v: number) => string;
  /** Fields where literal 0 is a legitimate value (not a "suspect placeholder zero") */
  zeroIsValid?: boolean;
}

/* ─── Field catalog ─────────────────────────────────────────── */

const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toString();
};

const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const FIELDS: FieldDef[] = [
  {
    key: "total_videos",
    label: "Videos",
    group: "Core",
    format: fmtCompact,
  },
  {
    key: "days_since_last_post",
    label: "Days Since Post",
    group: "Core",
    format: (v) => `${v}d`,
    zeroIsValid: true,
  },
  {
    key: "avg_views_7d",
    label: "Views 7d",
    group: "Velocity",
    format: fmtCompact,
  },
  {
    key: "avg_views_30d",
    label: "Views 30d",
    group: "Velocity",
    format: fmtCompact,
  },
  {
    key: "delta_avg_views_pct",
    label: "Δ Views %",
    group: "Velocity",
    format: fmtPct,
  },
  {
    key: "avg_engagement_30d",
    label: "Eng 30d",
    group: "Velocity",
    format: (v) => v.toFixed(2),
  },
  {
    key: "delta_engagement_pct",
    label: "Δ Eng %",
    group: "Velocity",
    format: fmtPct,
  },
  {
    key: "tiktok_followers",
    label: "TT Followers",
    group: "Reach",
    format: fmtCompact,
  },
  {
    key: "instagram_followers",
    label: "IG Followers",
    group: "Reach",
    format: fmtCompact,
  },
  {
    key: "delta_followers_pct",
    label: "Δ Foll %",
    group: "Reach",
    format: fmtPct,
  },
  {
    key: "momentum_tier",
    label: "Momentum",
    group: "Quality",
  },
  // ── artist_content_dna ────────────────────────────────
  {
    key: "videos_analyzed",
    label: "Analyzed",
    group: "Signature",
    format: fmtCompact,
  },
  {
    key: "avg_hook_score",
    label: "Hook Score",
    group: "Signature",
    format: (v) => v.toFixed(1),
  },
  {
    key: "avg_viral_score",
    label: "Viral Score",
    group: "Signature",
    format: (v) => v.toFixed(1),
  },
  {
    key: "best_format",
    label: "Best Format",
    group: "Signature",
  },
  {
    key: "primary_genre",
    label: "Genre",
    group: "Signature",
  },
  // ── artist_content_evolution ──────────────────────────
  {
    key: "performance_trend",
    label: "Trend",
    group: "Trajectory",
  },
  {
    key: "views_change_pct",
    label: "Δ Views (WoW)",
    group: "Trajectory",
    format: fmtPct,
  },
  {
    key: "strategy_label",
    label: "Strategy",
    group: "Trajectory",
  },
];

type CellStatus = "ok" | "missing" | "suspect";

function cellStatus(field: FieldDef, value: unknown): CellStatus {
  if (value == null) return "missing";
  if (typeof value === "number") {
    if (value === 0 && !field.zeroIsValid) return "suspect";
  }
  return "ok";
}

/* ─── Data fetching ─────────────────────────────────────────── */

interface RosterRaw {
  artist_name: string | null;
  artist_handle: string | null;
  total_videos: number | null;
  days_since_last_post: number | null;
  avg_views_7d: number | null;
  avg_views_30d: number | null;
  delta_avg_views_pct: number | null;
  avg_engagement_30d: number | null;
  delta_engagement_pct: number | null;
  tiktok_followers: number | null;
  instagram_followers: number | null;
  delta_followers_pct: number | null;
  momentum_tier: string | null;
  risk_level: string | null;
}

interface DnaRaw {
  artist_handle: string | null;
  videos_analyzed: number | null;
  avg_hook_score: number | null;
  avg_viral_score: number | null;
  best_format: string | null;
  primary_genre: string | null;
}

interface EvolutionRaw {
  artist_handle: string | null;
  performance_trend: string | null;
  views_change_pct: number | null;
  strategy_label: string | null;
}

async function fetchRosterCoverage(labelId: string): Promise<RosterRow[]> {
  // Phase 1: pull the roster scoped to this label
  const rosterRes = await supabase
    .from("roster_dashboard_metrics")
    .select(
      "artist_name,artist_handle,total_videos,days_since_last_post,avg_views_7d,avg_views_30d,delta_avg_views_pct,avg_engagement_30d,delta_engagement_pct,tiktok_followers,instagram_followers,delta_followers_pct,momentum_tier,risk_level",
    )
    .eq("label_id", labelId)
    .order("artist_name", { ascending: true });

  if (rosterRes.error) throw rosterRes.error;
  const roster = (rosterRes.data ?? []) as RosterRaw[];

  if (roster.length === 0) return [];

  // Phase 2: fan out to DNA + Evolution using the normalized handles we just got
  const handles = roster
    .map((r) => normalizeHandle(r.artist_handle ?? ""))
    .filter(Boolean);

  const [dnaRes, evoRes] = await Promise.all([
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("artist_content_dna" as any)
      .select(
        "artist_handle,videos_analyzed,avg_hook_score,avg_viral_score,best_format,primary_genre",
      )
      .in("artist_handle", handles),
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("artist_content_evolution" as any)
      .select("artist_handle,performance_trend,views_change_pct,strategy_label")
      .in("artist_handle", handles),
  ]);

  // Soft-fail: if DNA or Evolution queries error, the cells will render as
  // NULL and surface the upstream pipeline gap — which is exactly the point
  // of this page. We don't want one broken table to blank out the others.
  const dnaRows = (dnaRes.data ?? []) as DnaRaw[];
  const evoRows = (evoRes.data ?? []) as EvolutionRaw[];

  const dnaMap = new Map<string, DnaRaw>();
  dnaRows.forEach((d) => {
    if (d.artist_handle) dnaMap.set(normalizeHandle(d.artist_handle), d);
  });
  const evoMap = new Map<string, EvolutionRaw>();
  evoRows.forEach((e) => {
    if (e.artist_handle) evoMap.set(normalizeHandle(e.artist_handle), e);
  });

  return roster.map<RosterRow>((r) => {
    const key = normalizeHandle(r.artist_handle ?? "");
    const dna = dnaMap.get(key);
    const evo = evoMap.get(key);
    return {
      ...r,
      videos_analyzed: dna?.videos_analyzed ?? null,
      avg_hook_score: dna?.avg_hook_score ?? null,
      avg_viral_score: dna?.avg_viral_score ?? null,
      best_format: dna?.best_format ?? null,
      primary_genre: dna?.primary_genre ?? null,
      performance_trend: evo?.performance_trend ?? null,
      views_change_pct: evo?.views_change_pct ?? null,
      strategy_label: evo?.strategy_label ?? null,
    };
  });
}

/* ─── Component ─────────────────────────────────────────────── */

export default function HealthRosterCoverage() {
  const { labelId } = useUserProfile();

  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["roster-coverage", labelId],
    queryFn: () => fetchRosterCoverage(labelId!),
    enabled: !!labelId,
    staleTime: 60_000,
  });

  /* ── Aggregates ────────────────────────────────────────── */

  const stats = useMemo(() => {
    if (rows.length === 0) {
      return {
        artistCount: 0,
        totalCells: 0,
        okCount: 0,
        missingCount: 0,
        suspectCount: 0,
        overallPct: 0,
        worstField: null as { label: string; pct: number } | null,
        worstArtist: null as { name: string; pct: number } | null,
      };
    }
    let ok = 0;
    let missing = 0;
    let suspect = 0;
    const fieldCounts = new Map<string, { ok: number; total: number }>();
    const artistCounts = new Map<string, { ok: number; total: number }>();

    rows.forEach((row) => {
      const aKey = row.artist_name ?? "—";
      if (!artistCounts.has(aKey)) artistCounts.set(aKey, { ok: 0, total: 0 });
      FIELDS.forEach((field) => {
        const value = row[field.key];
        const status = cellStatus(field, value);
        if (!fieldCounts.has(field.label))
          fieldCounts.set(field.label, { ok: 0, total: 0 });
        const fc = fieldCounts.get(field.label)!;
        const ac = artistCounts.get(aKey)!;
        fc.total += 1;
        ac.total += 1;
        if (status === "ok") {
          ok += 1;
          fc.ok += 1;
          ac.ok += 1;
        } else if (status === "missing") missing += 1;
        else suspect += 1;
      });
    });

    let worstField: { label: string; pct: number } | null = null;
    fieldCounts.forEach((v, label) => {
      const pct = (v.ok / v.total) * 100;
      if (!worstField || pct < worstField.pct) worstField = { label, pct };
    });

    let worstArtist: { name: string; pct: number } | null = null;
    artistCounts.forEach((v, name) => {
      const pct = (v.ok / v.total) * 100;
      if (!worstArtist || pct < worstArtist.pct) worstArtist = { name, pct };
    });

    const total = ok + missing + suspect;
    return {
      artistCount: rows.length,
      totalCells: total,
      okCount: ok,
      missingCount: missing,
      suspectCount: suspect,
      overallPct: total === 0 ? 0 : (ok / total) * 100,
      worstField,
      worstArtist,
    };
  }, [rows]);

  /* ── Per-field coverage for footer row ─────────────────── */

  const fieldCoverage = useMemo(() => {
    const map = new Map<string, { ok: number; total: number }>();
    FIELDS.forEach((f) => map.set(f.label, { ok: 0, total: 0 }));
    rows.forEach((row) => {
      FIELDS.forEach((field) => {
        const status = cellStatus(field, row[field.key]);
        const m = map.get(field.label)!;
        m.total += 1;
        if (status === "ok") m.ok += 1;
      });
    });
    return map;
  }, [rows]);

  /* ── Loading / error states ─────────────────────────────── */

  if (!labelId) {
    return (
      <EmptyState message="No label selected — switch to a label to see roster coverage." />
    );
  }

  if (isLoading) {
    return <EmptyState message="Loading roster coverage…" />;
  }

  if (error) {
    return (
      <EmptyState
        message={`Failed to load: ${(error as Error).message}`}
        tone="error"
      />
    );
  }

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 20,
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Roster Coverage
          </h2>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-faint)",
              margin: "4px 0 0",
            }}
          >
            Per-artist data quality across <code>roster_dashboard_metrics</code>{" "}
            — find upstream pipeline gaps before they reach a tile.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--ink-tertiary)",
            cursor: isFetching ? "default" : "pointer",
            fontSize: 12,
            fontFamily: '"DM Sans", sans-serif',
            opacity: isFetching ? 0.5 : 1,
          }}
        >
          <RefreshCw
            size={12}
            style={{
              animation: isFetching ? "spin 1s linear infinite" : undefined,
            }}
          />
          Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <KpiCard
          label="Overall coverage"
          value={`${stats.overallPct.toFixed(0)}%`}
          sub={`${stats.okCount} / ${stats.totalCells} cells`}
          tone={
            stats.overallPct >= 80
              ? "ok"
              : stats.overallPct >= 50
                ? "warn"
                : "bad"
          }
        />
        <KpiCard
          label="Missing"
          value={stats.missingCount.toString()}
          sub="NULL fields"
          tone={stats.missingCount > 0 ? "bad" : "muted"}
        />
        <KpiCard
          label="Suspect zeros"
          value={stats.suspectCount.toString()}
          sub="0 in non-zero field"
          tone={stats.suspectCount > 0 ? "warn" : "muted"}
        />
        <KpiCard
          label="Weakest field"
          value={stats.worstField?.label ?? "—"}
          sub={
            stats.worstField
              ? `${stats.worstField.pct.toFixed(0)}% populated`
              : ""
          }
          tone="muted"
        />
        <KpiCard
          label="Weakest artist"
          value={stats.worstArtist?.name ?? "—"}
          sub={
            stats.worstArtist
              ? `${stats.worstArtist.pct.toFixed(0)}% populated`
              : ""
          }
          tone="muted"
        />
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          padding: "8px 12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          color: "var(--ink-tertiary)",
          alignItems: "center",
        }}
      >
        <LegendDot
          color="#34d399"
          icon={<Check size={11} />}
          label="Populated"
        />
        <LegendDot
          color="#f59e0b"
          icon={<AlertTriangle size={11} />}
          label="Suspect zero"
        />
        <LegendDot
          color="#ef4444"
          icon={<X size={11} />}
          label="NULL / missing"
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th
                style={{
                  ...thStyle,
                  position: "sticky",
                  left: 0,
                  background: "var(--surface)",
                  zIndex: 1,
                  textAlign: "left",
                  minWidth: 160,
                }}
              >
                Artist
              </th>
              {FIELDS.map((f) => (
                <th key={f.key} style={thStyle}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{f.label}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 500,
                        color: "var(--ink-faint)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginTop: 2,
                      }}
                    >
                      {f.group}
                    </span>
                  </div>
                </th>
              ))}
              <th style={{ ...thStyle, minWidth: 80 }}>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              let okCount = 0;
              FIELDS.forEach((f) => {
                if (cellStatus(f, row[f.key]) === "ok") okCount += 1;
              });
              const pct = (okCount / FIELDS.length) * 100;
              return (
                <tr
                  key={row.artist_handle ?? row.artist_name ?? Math.random()}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td
                    style={{
                      ...tdStyle,
                      position: "sticky",
                      left: 0,
                      background: "var(--surface)",
                      zIndex: 1,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {row.artist_name ?? "—"}
                    {row.artist_handle && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 400,
                          color: "var(--ink-faint)",
                          fontFamily: '"JetBrains Mono", monospace',
                          marginTop: 2,
                        }}
                      >
                        @{row.artist_handle}
                      </div>
                    )}
                  </td>
                  {FIELDS.map((field) => (
                    <td key={field.key} style={tdStyle}>
                      <Cell field={field} value={row[field.key]} />
                    </td>
                  ))}
                  <td style={tdStyle}>
                    <CoverageBar pct={pct} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr
              style={{
                background: "rgba(255,255,255,0.02)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <td
                style={{
                  ...tdStyle,
                  position: "sticky",
                  left: 0,
                  background: "var(--surface)",
                  fontWeight: 600,
                  fontSize: 10,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Field coverage
              </td>
              {FIELDS.map((f) => {
                const c = fieldCoverage.get(f.label)!;
                const pct = c.total === 0 ? 0 : (c.ok / c.total) * 100;
                return (
                  <td
                    key={f.key}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color:
                        pct >= 80
                          ? "#34d399"
                          : pct >= 50
                            ? "#f59e0b"
                            : "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {c.ok}/{c.total}
                  </td>
                );
              })}
              <td style={tdStyle} />
            </tr>
          </tfoot>
        </table>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────── */

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "center",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--ink-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "center",
  verticalAlign: "middle",
};

function Cell({ field, value }: { field: FieldDef; value: unknown }) {
  const status = cellStatus(field, value);

  if (status === "missing") {
    return (
      <span
        title="NULL — upstream pipeline never wrote this field"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: 6,
          background: "rgba(239, 68, 68, 0.08)",
          color: "#ef4444",
        }}
      >
        <X size={12} strokeWidth={2.5} />
      </span>
    );
  }

  if (status === "suspect") {
    return (
      <span
        title="Literal 0 — likely a placeholder zero, not a real value"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 6px",
          borderRadius: 6,
          background: "rgba(245, 158, 11, 0.08)",
          color: "#f59e0b",
          fontSize: 11,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 600,
        }}
      >
        <AlertTriangle size={11} />0
      </span>
    );
  }

  // ok
  const display =
    typeof value === "number" && field.format
      ? field.format(value)
      : String(value);
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        color: "var(--ink)",
        fontWeight: 500,
      }}
    >
      {display}
    </span>
  );
}

function CoverageBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#34d399" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 600,
          color,
        }}
      >
        {pct.toFixed(0)}%
      </div>
      <div
        style={{
          width: 50,
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "ok" | "warn" | "bad" | "muted";
}) {
  const valueColor =
    tone === "ok"
      ? "#34d399"
      : tone === "warn"
        ? "#f59e0b"
        : tone === "bad"
          ? "#ef4444"
          : "var(--ink)";
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 140,
        flex: "1 1 auto",
      }}
    >
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 10,
          fontWeight: 600,
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1.1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "var(--ink-faint)",
            marginTop: 3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function LegendDot({
  color,
  icon,
  label,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 5,
          background: `${color}14`,
          color,
        }}
      >
        {icon}
      </span>
      {label}
    </span>
  );
}

function EmptyState({
  message,
  tone = "muted",
}: {
  message: string;
  tone?: "muted" | "error";
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: 32,
        textAlign: "center",
        color: tone === "error" ? "#ef4444" : "var(--ink-faint)",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}
