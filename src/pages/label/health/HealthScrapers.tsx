import { useState, useCallback } from "react";
import { ChevronsUpDown, Filter } from "lucide-react";
import { useHealthData } from "./HealthLayout";
import ScraperRow from "@/components/admin/health/ScraperRow";
import { GROUP_ORDER } from "@/components/admin/health/constants";

const STATUS_FILTERS = [
  "all",
  "healthy",
  "error",
  "overdue",
  "running",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function HealthScrapers() {
  const { data } = useHealthData();
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const toggleScraper = useCallback((name: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  if (!data) return null;

  const allScraperNames = data.scrapers.map((s) => s.scraper_name);
  const allExpanded =
    allScraperNames.length > 0 &&
    allScraperNames.every((name) => expandedSet.has(name));

  const expandAll = () =>
    setExpandedSet(new Set(data.scrapers.map((s) => s.scraper_name)));
  const collapseAll = () => setExpandedSet(new Set());

  // Get unique groups
  const groups =
    groupFilter === "all"
      ? GROUP_ORDER
      : GROUP_ORDER.filter((g) => g.key === groupFilter);

  const filterBtnStyle = (active: boolean) => ({
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: active ? "rgba(232, 67, 10, 0.1)" : "transparent",
    color: active ? "#e8430a" : "var(--ink-tertiary)",
    cursor: "pointer" as const,
    fontSize: 11,
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: active ? 600 : 500,
    textTransform: "capitalize" as const,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Scrapers
        </h2>
        <button
          onClick={allExpanded ? collapseAll : expandAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--ink-secondary)",
            cursor: "pointer",
            fontSize: 11,
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 500,
          }}
        >
          <ChevronsUpDown size={12} />
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter
            size={12}
            color="var(--ink-faint)"
            style={{ flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Group:
          </span>
          <button
            onClick={() => setGroupFilter("all")}
            style={filterBtnStyle(groupFilter === "all")}
          >
            All
          </button>
          {GROUP_ORDER.map((g) => (
            <button
              key={g.key}
              onClick={() => setGroupFilter(g.key)}
              style={filterBtnStyle(groupFilter === g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Status:
          </span>
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              style={filterBtnStyle(statusFilter === sf)}
            >
              {sf}
            </button>
          ))}
        </div>
      </div>

      {/* Scraper groups */}
      {groups.map((group) => {
        let scrapers = data.scrapers_by_group[group.key];
        if (!scrapers || scrapers.length === 0) return null;

        if (statusFilter !== "all") {
          scrapers = scrapers.filter((s) => s.health === statusFilter);
          if (scrapers.length === 0) return null;
        }

        return (
          <div
            key={group.key}
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                  textTransform: "capitalize",
                }}
              >
                {group.label}
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {group.schedule}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  fontFamily: '"JetBrains Mono", monospace',
                  marginLeft: "auto",
                }}
              >
                {scrapers.length} scraper{scrapers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {scrapers.map((s) => (
              <ScraperRow
                key={s.scraper_name}
                scraper={s}
                expanded={expandedSet.has(s.scraper_name)}
                onToggle={() => toggleScraper(s.scraper_name)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
