import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Columns3,
  Check,
  X,
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
import { TIER_CONFIG } from "@/types/artistIntelligence";

const PAGE_SIZES = [50, 100, 250, 500] as const;
type PageSize = (typeof PAGE_SIZES)[number];
const DEFAULT_PAGE_SIZE: PageSize = 100;
const DEFAULT_SORT_COLUMN = "artist_score";

// Tier display order (high to low)
const TIER_ORDER = ["elite", "strong", "developing", "emerging", "new"];

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
  const [params, setParams] = useSearchParams();

  // ── URL-backed state ──
  const page = Math.max(0, Number(params.get("page") ?? "0") || 0);
  const pageSizeRaw = Number(params.get("size") ?? DEFAULT_PAGE_SIZE);
  const pageSize = (
    PAGE_SIZES.includes(pageSizeRaw as PageSize)
      ? pageSizeRaw
      : DEFAULT_PAGE_SIZE
  ) as PageSize;
  const sortColumn = params.get("sort") ?? DEFAULT_SORT_COLUMN;
  const sortAsc = params.get("dir") === "asc";
  const search = params.get("q") ?? "";
  const tiers = useMemo(() => {
    const raw = params.get("tiers");
    if (!raw) return [] as string[];
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => TIER_ORDER.includes(t));
  }, [params]);
  const minScoreRaw = Number(params.get("minScore") ?? 0);
  const minScore =
    Number.isFinite(minScoreRaw) && minScoreRaw > 0
      ? Math.min(100, Math.max(0, minScoreRaw))
      : null;

  // Local search input (debounced into URL, kept in sync on external URL changes)
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Local min-score input — debounced → URL to avoid a query per keystroke
  const [minScoreInput, setMinScoreInput] = useState<string>(
    minScore != null ? String(minScore) : "",
  );
  useEffect(() => {
    setMinScoreInput(minScore != null ? String(minScore) : "");
  }, [minScore]);

  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

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
    search,
    tiers,
    minScore,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalCount);

  const visibleColumns = useMemo(
    () => filterColumns(hiddenGroups),
    [hiddenGroups],
  );

  const updateParams = useCallback(
    (
      updates: Record<string, string | null>,
      opts: { resetPage?: boolean } = {},
    ) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(updates)) {
            if (v === null) next.delete(k);
            else next.set(k, v);
          }
          if (opts.resetPage) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Debounce search input → URL
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => {
      updateParams({ q: searchInput || null }, { resetPage: true });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search, updateParams]);

  // Debounce min-score input → URL
  useEffect(() => {
    const parsed = Number(minScoreInput);
    const nextVal =
      minScoreInput === "" || !Number.isFinite(parsed) || parsed <= 0
        ? null
        : Math.min(100, Math.max(0, parsed));
    if (nextVal === minScore) return;
    const t = setTimeout(() => {
      updateParams(
        { minScore: nextVal == null ? null : String(nextVal) },
        { resetPage: true },
      );
    }, 400);
    return () => clearTimeout(t);
  }, [minScoreInput, minScore, updateParams]);

  const toggleTier = useCallback(
    (tier: string) => {
      const active = tiers.includes(tier);
      const nextTiers = active
        ? tiers.filter((t) => t !== tier)
        : [...tiers, tier];
      updateParams(
        { tiers: nextTiers.length === 0 ? null : nextTiers.join(",") },
        { resetPage: true },
      );
    },
    [tiers, updateParams],
  );

  const hasActiveFilters =
    tiers.length > 0 || minScore != null || search !== "";

  const clearFilters = useCallback(() => {
    updateParams({ tiers: null, minScore: null, q: null }, { resetPage: true });
    setSearchInput("");
    setMinScoreInput("");
  }, [updateParams]);

  const handleSort = (col: string) => {
    if (col === sortColumn) {
      updateParams({ dir: sortAsc ? null : "asc" }, { resetPage: true });
    } else {
      updateParams(
        { sort: col === DEFAULT_SORT_COLUMN ? null : col, dir: null },
        { resetPage: true },
      );
    }
  };

  const handlePageSizeChange = (size: PageSize) => {
    updateParams(
      { size: size === DEFAULT_PAGE_SIZE ? null : String(size) },
      { resetPage: true },
    );
  };

  const goToPage = useCallback(
    (p: number) => {
      const bounded = Math.max(0, Math.min(totalPages - 1, p));
      if (bounded === page) return;
      updateParams({ page: bounded === 0 ? null : String(bounded) });
    },
    [page, totalPages, updateParams],
  );

  // If filters narrow the result set so that the current page is out of
  // range, snap back to the last valid page. Only runs once counts settle
  // to avoid thrashing while counts are loading.
  useEffect(() => {
    if (isCountLoading || isLoading) return;
    if (page > 0 && page >= totalPages) {
      updateParams({
        page: totalPages - 1 === 0 ? null : String(totalPages - 1),
      });
    }
  }, [isCountLoading, isLoading, page, totalPages, updateParams]);

  // Keyboard navigation (← / →) — skip when typing in inputs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPage(page - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToPage(page + 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [page, goToPage]);

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
              color: "var(--ink)",
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
                color: "var(--accent)",
                letterSpacing: "-0.02em",
              }}
            >
              {formattedCount}
            </span>
          )}
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-tertiary)",
              fontWeight: 500,
            }}
          >
            artists tracked
          </span>
          {snapshotDate && (
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
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
                color: "var(--ink-tertiary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search artists…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: "100%",
                height: 32,
                paddingLeft: 32,
                paddingRight: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
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
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink-secondary)",
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
                      background: "var(--accent)",
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
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--ink-tertiary)",
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--overlay-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: "transparent",
                      color: visible ? "var(--ink)" : "var(--ink-tertiary)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: visible
                          ? "none"
                          : "1px solid var(--border-hover)",
                        background: visible ? "var(--accent)" : "transparent",
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
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color:
                rows.length === 0 ? "var(--ink-faint)" : "var(--ink-secondary)",
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
              color: "var(--ink-tertiary)",
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
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
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
                color: "var(--ink-tertiary)",
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
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              title="Previous page (←)"
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: page === 0 ? "transparent" : "var(--surface)",
                color: page === 0 ? "var(--ink-faint)" : "var(--ink-secondary)",
                cursor: page === 0 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages - 1}
              title="Next page (→)"
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background:
                  page >= totalPages - 1 ? "transparent" : "var(--surface)",
                color:
                  page >= totalPages - 1
                    ? "var(--ink-faint)"
                    : "var(--ink-secondary)",
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
                background: "var(--accent)",
                animation: "pulse 1s infinite",
              }}
            />
          )}
        </div>

        {/* ── Filter row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 0 12px",
            flexWrap: "wrap",
          }}
        >
          {/* Tier chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Tier
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TIER_ORDER.map((tier) => {
              const cfg = TIER_CONFIG[tier];
              const active = tiers.includes(tier);
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    border: `1px solid ${active ? cfg.color : "var(--border)"}`,
                    background: active ? cfg.bg : "transparent",
                    color: active ? cfg.color : "var(--ink-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 120ms, color 120ms",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div
            style={{
              width: 1,
              height: 20,
              background: "var(--border)",
              margin: "0 4px",
            }}
          />

          {/* Min score */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "var(--ink-tertiary)",
            }}
          >
            <label
              htmlFor="vault-min-score"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Min Score
            </label>
            <input
              id="vault-min-score"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              placeholder="0"
              value={minScoreInput}
              onChange={(e) => setMinScoreInput(e.target.value)}
              style={{
                width: 64,
                height: 28,
                padding: "0 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: 12,
                outline: "none",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                height: 28,
                padding: "0 10px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--ink-secondary)",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: "0 24px 16px",
        }}
      >
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
