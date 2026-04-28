/**
 * A&R Pipeline Table — sortable/filterable roster with server-side pagination.
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ARProspect } from "@/types/arTypes";
import { filterByStage, sortProspects } from "@/hooks/useARData";
import ARPipelineRow, { GRID_COLS } from "./ARPipelineRow";

/* ─── Filter Tabs ─────────────────────────────────────────── */

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "flagging", label: "Flagging" },
  { value: "deep_dive", label: "Deep Dive" },
  { value: "assessment", label: "Assessment" },
  { value: "validation", label: "Validation" },
  { value: "execution", label: "Execution" },
  { value: "risk", label: "Risk Flags" },
];

/* ─── Sort Options ────────────────────────────────────────── */

type SortKey =
  | "rise_probability"
  | "seven_day_velocity"
  | "signability"
  | "ghost_curve"
  | "stage"
  | "format_alpha";

const PAGE_SIZES = [20, 50, 100, 200] as const;

/* ─── Metric Filters ─────────────────────────────────────── */

interface MetricFilterDef {
  key: string;
  label: string;
  shortLabel: string;
  getValue: (p: ARProspect) => number | null;
  options: { label: string; value: number }[];
}

const METRIC_FILTERS: MetricFilterDef[] = [
  {
    key: "spotify_ml",
    label: "Spotify Monthly Listeners",
    shortLabel: "Spotify ML",
    getValue: (p) => p.metrics?.spotify_monthly_listeners ?? null,
    options: [
      { label: "1K+", value: 1000 },
      { label: "10K+", value: 10000 },
      { label: "50K+", value: 50000 },
      { label: "100K+", value: 100000 },
      { label: "500K+", value: 500000 },
    ],
  },
  {
    key: "engagement",
    label: "Engagement Rate",
    shortLabel: "Engagement",
    getValue: (p) => p.metrics?.social_engagement_rate ?? null,
    options: [
      { label: "1%+", value: 1 },
      { label: "3%+", value: 3 },
      { label: "5%+", value: 5 },
      { label: "10%+", value: 10 },
    ],
  },
  {
    key: "save_rate",
    label: "Spotify Save Rate",
    shortLabel: "Save Rate",
    getValue: (p) => p.metrics?.spotify_save_rate ?? null,
    options: [
      { label: "3%+", value: 3 },
      { label: "5%+", value: 5 },
      { label: "10%+", value: 10 },
      { label: "15%+", value: 15 },
    ],
  },
  {
    key: "completion",
    label: "30s Completion Rate",
    shortLabel: "30s Comp",
    getValue: (p) => p.metrics?.track_completion_rate_30s ?? null,
    options: [
      { label: "30%+", value: 30 },
      { label: "50%+", value: 50 },
      { label: "60%+", value: 60 },
      { label: "75%+", value: 75 },
    ],
  },
  {
    key: "social_reach",
    label: "Social Reach (TikTok + IG)",
    shortLabel: "Social Reach",
    getValue: (p) =>
      (p.metrics?.tiktok_followers ?? 0) +
        (p.metrics?.instagram_followers ?? 0) || null,
    options: [
      { label: "1K+", value: 1000 },
      { label: "10K+", value: 10000 },
      { label: "50K+", value: 50000 },
      { label: "100K+", value: 100000 },
    ],
  },
  {
    key: "follower_growth",
    label: "Follower Growth MoM",
    shortLabel: "Growth MoM",
    getValue: (p) => p.metrics?.spotify_follower_growth_mom ?? null,
    options: [
      { label: "5%+", value: 5 },
      { label: "10%+", value: 10 },
      { label: "15%+", value: 15 },
      { label: "25%+", value: 25 },
    ],
  },
];

/* ─── Region Filter ───────────────────────────────────────── */

type Region =
  | "US"
  | "UK"
  | "DACH"
  | "Nordics"
  | "Europe"
  | "LatAm"
  | "SEA"
  | "Asia"
  | "Oceania"
  | "Africa"
  | "MENA"
  | "Other";

const COUNTRY_TO_REGION: Record<string, Region> = {
  US: "US",
  CA: "US",
  GB: "UK",
  IE: "UK",
  DE: "DACH",
  AT: "DACH",
  CH: "DACH",
  SE: "Nordics",
  NO: "Nordics",
  DK: "Nordics",
  FI: "Nordics",
  IS: "Nordics",
  FR: "Europe",
  IT: "Europe",
  ES: "Europe",
  NL: "Europe",
  BE: "Europe",
  PT: "Europe",
  PL: "Europe",
  CZ: "Europe",
  GR: "Europe",
  HU: "Europe",
  RO: "Europe",
  LU: "Europe",
  RU: "Europe",
  UA: "Europe",
  AU: "Oceania",
  NZ: "Oceania",
  MX: "LatAm",
  BR: "LatAm",
  AR: "LatAm",
  CO: "LatAm",
  CL: "LatAm",
  PE: "LatAm",
  VE: "LatAm",
  PR: "LatAm",
  DO: "LatAm",
  UY: "LatAm",
  ID: "SEA",
  TH: "SEA",
  VN: "SEA",
  PH: "SEA",
  MY: "SEA",
  SG: "SEA",
  KH: "SEA",
  LA: "SEA",
  MM: "SEA",
  BN: "SEA",
  JP: "Asia",
  KR: "Asia",
  IN: "Asia",
  CN: "Asia",
  TW: "Asia",
  HK: "Asia",
  NG: "Africa",
  ZA: "Africa",
  KE: "Africa",
  GH: "Africa",
  SN: "Africa",
  ET: "Africa",
  TZ: "Africa",
  UG: "Africa",
  CI: "Africa",
  CM: "Africa",
  BJ: "Africa",
  ML: "Africa",
  BF: "Africa",
  RW: "Africa",
  SA: "MENA",
  AE: "MENA",
  EG: "MENA",
  MA: "MENA",
  TR: "MENA",
  IL: "MENA",
  JO: "MENA",
  LB: "MENA",
  QA: "MENA",
  KW: "MENA",
};

const REGION_OPTIONS: { value: Region | "all"; label: string }[] = [
  { value: "all", label: "All regions" },
  { value: "US", label: "US / Canada" },
  { value: "UK", label: "UK / Ireland" },
  { value: "DACH", label: "DACH" },
  { value: "Nordics", label: "Nordics" },
  { value: "Europe", label: "Europe (rest)" },
  { value: "LatAm", label: "LatAm" },
  { value: "SEA", label: "SEA" },
  { value: "Asia", label: "Asia (JP/KR/IN)" },
  { value: "Oceania", label: "Oceania (AU/NZ)" },
  { value: "Africa", label: "Africa" },
  { value: "MENA", label: "MENA" },
  { value: "Other", label: "Other" },
];

/* ─── Column Header ───────────────────────────────────────── */

const COLUMNS: {
  label: string;
  align: "left" | "center";
  sortKey?: SortKey;
}[] = [
  { label: "Artist", align: "left" },
  { label: "Rise Prob", align: "center", sortKey: "rise_probability" },
  { label: "Stage", align: "center", sortKey: "stage" },
  { label: "7d Velocity", align: "center", sortKey: "seven_day_velocity" },
  { label: "Format Alpha", align: "center", sortKey: "format_alpha" },
  { label: "Top Signal", align: "left" },
  { label: "Signability", align: "center", sortKey: "signability" },
  { label: "Ghost Curve", align: "center", sortKey: "ghost_curve" },
];

/* ─── Component ───────────────────────────────────────────── */

interface ARPipelineTableProps {
  prospects: ARProspect[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function ARPipelineTable({
  prospects,
  total,
  page,
  pageSize,
  totalPages,
  isFetching,
  onPageChange,
  onPageSizeChange,
}: ARPipelineTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(
    () => searchParams.get("stage") || "all",
  );
  const [regionFilter, setRegionFilter] = useState<Region | "all">(
    () => (searchParams.get("region") as Region | "all") || "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>(
    () => (searchParams.get("sort") as SortKey) || "rise_probability",
  );
  const [sortDesc, setSortDesc] = useState(
    () => searchParams.get("order") !== "asc",
  );
  const [metricFilters, setMetricFilters] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      for (const [k, v] of searchParams.entries()) {
        if (k.startsWith("mf_")) {
          const num = Number(v);
          if (!Number.isNaN(num)) init[k.slice(3)] = num;
        }
      }
      return init;
    },
  );
  const [showFilters, setShowFilters] = useState(
    () =>
      Object.keys(
        Array.from(searchParams.entries()).filter(([k]) => k.startsWith("mf_")),
      ).length > 0,
  );

  // Sync filter state → URL (replace, no history spam)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (filter === "all") next.delete("stage");
    else next.set("stage", filter);
    if (regionFilter === "all") next.delete("region");
    else next.set("region", regionFilter);
    if (sortKey === "rise_probability") next.delete("sort");
    else next.set("sort", sortKey);
    if (sortDesc) next.delete("order");
    else next.set("order", "asc");
    for (const key of Array.from(next.keys())) {
      if (key.startsWith("mf_")) next.delete(key);
    }
    for (const [k, v] of Object.entries(metricFilters)) {
      next.set(`mf_${k}`, String(v));
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    filter,
    regionFilter,
    sortKey,
    sortDesc,
    metricFilters,
    searchParams,
    setSearchParams,
  ]);

  const activeFilterCount = Object.keys(metricFilters).length;

  const setMetricFilter = useCallback((key: string, value: number | null) => {
    setMetricFilters((prev) => {
      if (value == null) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearAllFilters = useCallback(() => setMetricFilters({}), []);

  const filtered = useMemo(() => {
    let result = filterByStage(prospects, filter);
    if (regionFilter !== "all") {
      result = result.filter((p) => {
        const code = p.origin_country?.toUpperCase() ?? "";
        const mapped = COUNTRY_TO_REGION[code] ?? "Other";
        return mapped === regionFilter;
      });
    }
    for (const [key, minVal] of Object.entries(metricFilters)) {
      const def = METRIC_FILTERS.find((f) => f.key === key);
      if (!def) continue;
      result = result.filter((p) => {
        const val = def.getValue(p);
        return val != null && val >= minVal;
      });
    }
    return result;
  }, [prospects, filter, regionFilter, metricFilters]);

  const sorted = useMemo(
    () => sortProspects(filtered, sortKey, sortDesc),
    [filtered, sortKey, sortDesc],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: prospects.length,
      risk: 0,
    };
    for (const p of prospects) {
      counts[p.pipeline_stage] = (counts[p.pipeline_stage] || 0) + 1;
      if (p.risk_flags.length > 0) counts.risk++;
    }
    return counts;
  }, [prospects]);

  const rangeStart = page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="rounded-xl border border-white/[0.06]"
      style={{ background: "#1C1C1E" }}
    >
      {/* Filter tabs + sort */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.value;
            const count = filterCounts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                  active
                    ? "bg-white/[0.08] text-white/87"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                }`}
              >
                {tab.label}
                <span className="ml-1 tabular-nums text-[10px] text-white/25">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters toggle + Region */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-[#e8430a]/10 text-[#e8430a]"
                : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
            }`}
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="text-[9px] font-bold tabular-nums w-4 h-4 rounded-full flex items-center justify-center"
                style={{
                  background: "#e8430a",
                  color: "white",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">
              Region
            </span>
            <select
              value={regionFilter}
              onChange={(e) =>
                setRegionFilter(e.target.value as Region | "all")
              }
              className={`text-[11px] rounded px-2 py-1 outline-none border transition-colors ${
                regionFilter !== "all"
                  ? "bg-[#e8430a]/10 border-[#e8430a]/20 text-[#e8430a]"
                  : "bg-white/[0.04] border-white/[0.06] text-white/60"
              }`}
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metric filter bar */}
      {showFilters && (
        <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
          {METRIC_FILTERS.map((mf) => {
            const active = metricFilters[mf.key];
            return (
              <div key={mf.key} className="flex items-center gap-0">
                <select
                  value={active ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMetricFilter(mf.key, val === "" ? null : Number(val));
                  }}
                  className={`text-[10px] rounded-md px-2 py-1 outline-none border transition-colors ${
                    active != null
                      ? "bg-[#e8430a]/10 border-[#e8430a]/20 text-[#e8430a]"
                      : "bg-white/[0.04] border-white/[0.06] text-white/45"
                  }`}
                  title={mf.label}
                >
                  <option value="">{mf.shortLabel}</option>
                  {mf.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {mf.shortLabel} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors ml-1"
            >
              <X size={10} />
              Clear all
            </button>
          )}
          <span
            className="text-[10px] tabular-nums ml-auto"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {sorted.length} matching
          </span>
        </div>
      )}

      {/* Column headers */}
      <div
        className="grid items-center gap-3 px-5 py-2 border-b border-white/[0.06] min-w-[1100px]"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {COLUMNS.map((col) => {
          const isActive = col.sortKey != null && sortKey === col.sortKey;
          const justify =
            col.align === "center" ? "justify-center" : "justify-start";
          const baseCls = "text-[10px] font-semibold tracking-wider uppercase";

          if (!col.sortKey) {
            return (
              <span
                key={col.label}
                className={`block text-white/25 ${baseCls} ${
                  col.align === "center" ? "text-center" : "text-left"
                }`}
              >
                {col.label}
              </span>
            );
          }

          return (
            <button
              key={col.label}
              type="button"
              onClick={() => handleSort(col.sortKey!)}
              aria-sort={
                isActive ? (sortDesc ? "descending" : "ascending") : "none"
              }
              className={`flex items-center gap-1 ${justify} ${baseCls} transition-colors ${
                isActive ? "text-white/70" : "text-white/25 hover:text-white/55"
              }`}
            >
              <span>{col.label}</span>
              {isActive ? (
                sortDesc ? (
                  <ChevronDown size={11} strokeWidth={2.5} />
                ) : (
                  <ChevronUp size={11} strokeWidth={2.5} />
                )
              ) : (
                <ChevronDown
                  size={11}
                  strokeWidth={2.5}
                  className="opacity-0"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div className="min-w-[1100px] relative">
        {isFetching && (
          <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
            <Loader2
              size={18}
              className="animate-spin"
              style={{ color: "rgba(255,255,255,0.30)" }}
            />
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {sorted.map((prospect, i) => (
            <ARPipelineRow key={prospect.id} prospect={prospect} index={i} />
          ))}
        </AnimatePresence>

        {sorted.length === 0 && !isFetching && (
          <div className="py-12 text-center text-[13px] text-white/30">
            No prospects match this filter.
          </div>
        )}
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            Show
          </span>
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onPageSizeChange(size)}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                pageSize === size
                  ? "bg-white/[0.08] text-white/80"
                  : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Range info */}
        <span
          className="text-[11px] tabular-nums"
          style={{
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {rangeStart}–{rangeEnd} of {total}
        </span>

        {/* Page controls */}
        <div className="flex items-center gap-1">
          <PagBtn
            disabled={page === 0}
            onClick={() => onPageChange(0)}
            label="First page"
          >
            <ChevronsLeft size={14} />
          </PagBtn>
          <PagBtn
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            label="Previous page"
          >
            <ChevronLeft size={14} />
          </PagBtn>
          <span
            className="text-[11px] px-2 tabular-nums"
            style={{
              color: "rgba(255,255,255,0.50)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {page + 1} / {totalPages}
          </span>
          <PagBtn
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            label="Next page"
          >
            <ChevronRight size={14} />
          </PagBtn>
          <PagBtn
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(totalPages - 1)}
            label="Last page"
          >
            <ChevronsRight size={14} />
          </PagBtn>
        </div>
      </div>
    </motion.div>
  );
}

function PagBtn({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
      style={{
        color: disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.50)",
        cursor: disabled ? "default" : "pointer",
        background: disabled ? "transparent" : "rgba(255,255,255,0.03)",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = disabled
          ? "transparent"
          : "rgba(255,255,255,0.03)";
      }}
    >
      {children}
    </button>
  );
}
