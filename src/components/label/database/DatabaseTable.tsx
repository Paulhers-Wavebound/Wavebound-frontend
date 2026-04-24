import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { ColumnDef } from "./columns";
import { getGroupSpans } from "./columns";
import { formatCell } from "./cellFormatters";
import type { MergedArtistRow } from "@/hooks/useArtistDatabase";
import { useMemo } from "react";

interface DatabaseTableProps {
  rows: MergedArtistRow[];
  columns: ColumnDef[];
  isLoading: boolean;
  sortColumn: string;
  sortAsc: boolean;
  onSort: (column: string) => void;
  pageSize: number;
}

const GROUP_ROW_H = 25;

// Tint map for the top group-header row. Values are channel-equivalent
// accent hues at low alpha; they render over either surface color
// without clashing because the alpha is low.
const GROUP_COLORS: Record<string, string> = {
  Identity: "transparent",
  "Core Scores": "rgba(242,93,36,0.10)",
  "Rank & Tier": "rgba(191,90,242,0.08)",
  "Platform Trends": "rgba(10,132,255,0.08)",
  Catalog: "rgba(48,209,88,0.08)",
  "Coverage & Geo": "rgba(255,159,10,0.08)",
  "TikTok (Score)": "rgba(255,69,58,0.08)",
  Radio: "rgba(255,214,10,0.08)",
  "Apple Music": "rgba(255,69,58,0.06)",
  "Sound Intel": "rgba(100,210,255,0.08)",
  Other: "rgba(142,142,147,0.10)",
  "TikTok Profile": "rgba(255,69,58,0.06)",
};

const STICKY_W = 200;

function SkeletonRows({
  count,
  columns,
}: {
  count: number;
  columns: ColumnDef[];
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} style={{ borderBottom: "1px solid var(--border)" }}>
          {columns.map((col, j) => (
            <TableCell
              key={col.key}
              style={{
                width: col.width,
                minWidth: col.width,
                padding: "6px 8px",
                ...(j === 0
                  ? {
                      position: "sticky" as const,
                      left: 0,
                      zIndex: 1,
                      background: "var(--surface)",
                    }
                  : {}),
              }}
            >
              <div
                className="animate-pulse rounded"
                style={{
                  height: 14,
                  width: "70%",
                  background: "var(--overlay-active)",
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function DatabaseTable({
  rows,
  columns,
  isLoading,
  sortColumn,
  sortAsc,
  onSort,
  pageSize,
}: DatabaseTableProps) {
  const navigate = useNavigate();
  const groupSpans = useMemo(() => getGroupSpans(columns), [columns]);

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        willChange: "scroll-position",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        position: "relative",
      }}
    >
      <table
        style={{
          width: "max-content",
          minWidth: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
        }}
      >
        {/* ── Column group headers (sticky on vertical scroll) ── */}
        <TableHeader>
          <TableRow style={{ borderBottom: "1px solid var(--border)" }}>
            {groupSpans.map((g, i) => {
              const tint = i === 0 ? null : GROUP_COLORS[g.group];
              return (
                <TableHead
                  key={`${g.group}-${i}`}
                  colSpan={g.span}
                  style={{
                    // Solid surface fill PLUS the tint stacked on top — using
                    // background-color + background-image keeps the sticky
                    // header opaque so scrolling rows can't bleed through
                    // the low-alpha group tints.
                    backgroundColor: "var(--surface)",
                    backgroundImage:
                      tint && tint !== "transparent"
                        ? `linear-gradient(${tint}, ${tint})`
                        : "none",
                    color: "var(--ink-secondary)",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    textAlign: "center",
                    padding: "4px 8px",
                    borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                    height: GROUP_ROW_H,
                    position: "sticky",
                    top: 0,
                    zIndex: i === 0 ? 5 : 4,
                    ...(i === 0
                      ? {
                          left: 0,
                          minWidth: STICKY_W,
                        }
                      : {}),
                  }}
                >
                  {g.group}
                </TableHead>
              );
            })}
          </TableRow>

          {/* ── Column headers (sticky below group row) ── */}
          <TableRow style={{ borderBottom: "1px solid var(--border)" }}>
            {columns.map((col, i) => {
              const isSortable = !!col.sortKey;
              const isActive = col.sortKey === sortColumn;
              return (
                <TableHead
                  key={col.key}
                  onClick={isSortable ? () => onSort(col.sortKey!) : undefined}
                  style={{
                    width: col.width,
                    minWidth: col.width,
                    padding: "6px 8px",
                    color: isActive ? "var(--ink)" : "var(--ink-secondary)",
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: isSortable ? "pointer" : "default",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    textAlign: col.align ?? "left",
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: GROUP_ROW_H,
                    zIndex: i === 0 ? 5 : 4,
                    left: i === 0 ? 0 : undefined,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {col.label}
                    {isSortable && isActive && (
                      <span style={{ opacity: 0.8 }}>
                        {sortAsc ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                      </span>
                    )}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && rows.length === 0 ? (
            <SkeletonRows count={pageSize} columns={columns} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "var(--ink-tertiary)",
                }}
              >
                No artists found
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.entity_id}
                style={{
                  height: 32,
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--overlay-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {columns.map((col, i) => (
                  <TableCell
                    key={col.key}
                    style={{
                      width: col.width,
                      minWidth: col.width,
                      maxWidth: col.width,
                      padding: "4px 8px",
                      textAlign: col.align ?? "left",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      ...(i === 0
                        ? {
                            position: "sticky" as const,
                            left: 0,
                            zIndex: 1,
                            background: "var(--surface)",
                            fontWeight: 500,
                            cursor: "pointer",
                          }
                        : {}),
                    }}
                    onClick={
                      i === 0
                        ? () => navigate(`/label/artist/${row.entity_id}`)
                        : undefined
                    }
                  >
                    {i === 0 ? (
                      <span
                        style={{
                          color: "var(--ink)",
                          borderBottom: "1px solid transparent",
                          transition: "color 120ms, border-color 120ms",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--accent)";
                          e.currentTarget.style.borderBottomColor =
                            "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--ink)";
                          e.currentTarget.style.borderBottomColor =
                            "transparent";
                        }}
                      >
                        {row.canonical_name ?? "—"}
                      </span>
                    ) : (
                      formatCell(
                        col.formatter,
                        (row as Record<string, unknown>)[col.key],
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </table>
    </div>
  );
}
