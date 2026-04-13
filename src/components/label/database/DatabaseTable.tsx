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

const GROUP_ROW_H = 25; // height of the group header row

const GROUP_COLORS: Record<string, string> = {
  Identity: "rgba(255,255,255,0.06)",
  "Core Scores": "rgba(232,67,10,0.10)",
  "Rank & Tier": "rgba(191,90,242,0.08)",
  "Platform Trends": "rgba(10,132,255,0.08)",
  Catalog: "rgba(48,209,88,0.08)",
  "Coverage & Geo": "rgba(255,159,10,0.08)",
  "TikTok (Score)": "rgba(255,69,58,0.08)",
  Radio: "rgba(255,214,10,0.08)",
  "Apple Music": "rgba(255,69,58,0.06)",
  "Sound Intel": "rgba(100,210,255,0.08)",
  Other: "rgba(142,142,147,0.06)",
  "TikTok Profile": "rgba(255,69,58,0.06)",
};

// Sticky column width
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
        <TableRow key={i} className="border-white/[0.04]">
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
                      background: "#1C1C1E",
                    }
                  : {}),
              }}
            >
              <div
                className="animate-pulse rounded"
                style={{
                  height: 14,
                  width: "70%",
                  background: "rgba(255,255,255,0.06)",
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
        border: "1px solid rgba(255,255,255,0.06)",
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
          <TableRow className="border-white/[0.06]">
            {groupSpans.map((g, i) => (
              <TableHead
                key={`${g.group}-${i}`}
                colSpan={g.span}
                style={{
                  background:
                    i === 0
                      ? "#1C1C1E"
                      : (GROUP_COLORS[g.group] ?? "transparent"),
                  color: "rgba(255,255,255,0.40)",
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  textAlign: "center",
                  padding: "4px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
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
            ))}
          </TableRow>

          {/* ── Column headers (sticky below group row) ── */}
          <TableRow className="border-white/[0.06]">
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
                    color: isActive
                      ? "rgba(255,255,255,0.87)"
                      : "rgba(255,255,255,0.55)",
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: isSortable ? "pointer" : "default",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    textAlign: col.align ?? "left",
                    background: "#1C1C1E",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
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
                  color: "rgba(255,255,255,0.30)",
                }}
              >
                No artists found
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.entity_id}
                className="border-white/[0.04] hover:bg-white/[0.03]"
                style={{ height: 32 }}
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
                            background: "#1C1C1E",
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
                          color: "rgba(255,255,255,0.87)",
                          borderBottom: "1px solid transparent",
                        }}
                        className="hover:text-[#e8430a] hover:border-b hover:border-[#e8430a]"
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
