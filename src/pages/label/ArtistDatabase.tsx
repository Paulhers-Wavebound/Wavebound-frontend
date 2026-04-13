import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Columns3,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useArtistDatabase } from "@/hooks/useArtistDatabase";
import DatabaseTable from "@/components/label/database/DatabaseTable";
import {
  COLUMN_GROUPS,
  COLUMNS,
  filterColumns,
} from "@/components/label/database/columns";

const PAGE_SIZES = [50, 100, 250, 500] as const;
type PageSize = (typeof PAGE_SIZES)[number];

// ── CSV export helper ──
function exportCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string; group: string }[],
) {
  const header = columns.map((c) => `"${c.group} — ${c.label}"`).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const v = row[c.key];
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
      .join(","),
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wavebound-vault-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ArtistDatabase() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("artist_score");
  const [sortAsc, setSortAsc] = useState(false);
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const {
    rows,
    totalCount,
    snapshotDate,
    isLoading,
    isFetching,
    isCountLoading,
  } = useArtistDatabase({
    page,
    pageSize,
    sortColumn,
    sortAsc,
    search: debouncedSearch,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalCount);

  const visibleColumns = useMemo(
    () => filterColumns(hiddenGroups),
    [hiddenGroups],
  );

  const handleSort = (col: string) => {
    if (col === sortColumn) {
      setSortAsc((prev) => !prev);
    } else {
      setSortColumn(col);
      setSortAsc(false);
    }
    setPage(0);
  };

  const handlePageSizeChange = (size: PageSize) => {
    setPageSize(size);
    setPage(0);
  };

  const toggleGroup = useCallback((group: string) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    exportCsv(rows as unknown as Record<string, unknown>[], visibleColumns);
  }, [rows, visibleColumns]);

  const formattedCount = useMemo(
    () => new Intl.NumberFormat("en-US").format(totalCount),
    [totalCount],
  );

  // Toggleable groups (everything except Identity which is always shown)
  const toggleableGroups = COLUMN_GROUPS.filter((g) => g !== "Identity");

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "20px 24px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 4,
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "rgba(255,255,255,0.87)",
              margin: 0,
            }}
          >
            The Vault
          </h1>
          {!isCountLoading && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#e8430a",
                letterSpacing: "-0.02em",
              }}
            >
              {formattedCount}
            </span>
          )}
          <span
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.40)",
              fontWeight: 500,
            }}
          >
            artists tracked
          </span>
          {snapshotDate && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.25)",
                fontFamily: "'JetBrains Mono', monospace",
                marginLeft: "auto",
              }}
            >
              data as of {snapshotDate}
            </span>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 0",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "0 0 260px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.30)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search artists…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 32,
                paddingLeft: 32,
                paddingRight: 12,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#2C2C2E",
                color: "rgba(255,255,255,0.87)",
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>

          {/* Column visibility toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                style={{
                  height: 32,
                  padding: "0 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#2C2C2E",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Columns3 size={13} />
                Columns
                {hiddenGroups.size > 0 && (
                  <span
                    style={{
                      background: "#e8430a",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "0 5px",
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: "16px",
                    }}
                  >
                    {COLUMNS.length - visibleColumns.length} hidden
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-56 p-2"
              style={{
                background: "#2C2C2E",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "4px 8px 6px",
                }}
              >
                Column Groups
              </div>
              {toggleableGroups.map((group) => {
                const visible = !hiddenGroups.has(group);
                return (
                  <button
                    key={group}
                    onClick={() => toggleGroup(group)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: "transparent",
                      color: visible
                        ? "rgba(255,255,255,0.87)"
                        : "rgba(255,255,255,0.30)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    className="hover:bg-white/[0.06]"
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: visible
                          ? "none"
                          : "1px solid rgba(255,255,255,0.15)",
                        background: visible ? "#e8430a" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {visible && <Check size={11} color="#fff" />}
                    </div>
                    {group}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            style={{
              height: 32,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#2C2C2E",
              color:
                rows.length === 0
                  ? "rgba(255,255,255,0.20)"
                  : "rgba(255,255,255,0.55)",
              fontSize: 12,
              cursor: rows.length === 0 ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Download size={13} />
            Export CSV
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Page size */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "rgba(255,255,255,0.40)",
            }}
          >
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) =>
                handlePageSizeChange(Number(e.target.value) as PageSize)
              }
              style={{
                height: 28,
                padding: "0 8px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#2C2C2E",
                color: "rgba(255,255,255,0.87)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Range info */}
          {totalCount > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.40)",
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: "nowrap",
              }}
            >
              {rangeStart}–{rangeEnd} of {formattedCount}
            </span>
          )}

          {/* Pagination arrows */}
          <div style={{ display: "flex", gap: 2 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.08)",
                background: page === 0 ? "transparent" : "#2C2C2E",
                color:
                  page === 0
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.55)",
                cursor: page === 0 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.08)",
                background: page >= totalPages - 1 ? "transparent" : "#2C2C2E",
                color:
                  page >= totalPages - 1
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.55)",
                cursor: page >= totalPages - 1 ? "default" : "pointer",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Fetch indicator */}
          {isFetching && (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#e8430a",
                animation: "pulse 1s infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflow: "hidden", padding: "0 24px 16px" }}>
        <DatabaseTable
          rows={rows}
          columns={visibleColumns}
          isLoading={isLoading}
          sortColumn={sortColumn}
          sortAsc={sortAsc}
          onSort={handleSort}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
