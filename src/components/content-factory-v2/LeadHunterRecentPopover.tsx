import { useMemo, useState } from "react";
import { History, Loader2, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCartoonLeadHunterRecent } from "@/hooks/useCartoonLeadHunter";
import type { LeadHunterJobSummary } from "@/types/cartoonLeadHunter";

interface LeadHunterRecentPopoverProps {
  labelId: string;
  currentArtistHandle: string | null | undefined;
  onSelect: (
    jobId: string,
    artistHandle: string | null,
    artistName: string | null,
  ) => void;
}

export default function LeadHunterRecentPopover({
  labelId,
  currentArtistHandle,
  onSelect,
}: LeadHunterRecentPopoverProps) {
  const [open, setOpen] = useState(false);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [query, setQuery] = useState("");

  const filterHandle = showAllArtists ? null : (currentArtistHandle ?? null);
  const { data, isLoading, error } = useCartoonLeadHunterRecent(
    labelId,
    filterHandle,
  );

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const name = row.artist_name?.toLowerCase() ?? "";
      const handle = row.artist_handle?.toLowerCase() ?? "";
      const summary = row.lead_hunter_summary?.toLowerCase() ?? "";
      return name.includes(q) || handle.includes(q) || summary.includes(q);
    });
  }, [data, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-10 px-3.5 rounded-[10px] inline-flex items-center gap-2 shrink-0 transition-colors"
          style={{
            background: "transparent",
            color: "var(--ink-secondary)",
            border: "1px solid var(--border-strong)",
            fontFamily: "var(--display-font)",
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-hover)";
            e.currentTarget.style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--ink-secondary)";
          }}
          aria-label="Show recent Lead Hunter runs"
        >
          <History size={14} />
          Recent
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 border-0 shadow-none rounded-[14px] overflow-hidden"
        style={{
          background: "var(--surface-2)",
          color: "var(--ink)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="px-4 pt-4 pb-3 flex items-center justify-between gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            style={{
              fontFamily: "var(--display-font)",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--accent)",
            }}
          >
            Recent story arcs
          </span>
          <div
            className="flex items-center gap-0.5 rounded-[8px] p-0.5"
            style={{ background: "var(--bg-subtle)" }}
          >
            <ToggleChip
              active={!showAllArtists}
              onClick={() => setShowAllArtists(false)}
              disabled={!currentArtistHandle}
              label="This artist"
            />
            <ToggleChip
              active={showAllArtists}
              onClick={() => setShowAllArtists(true)}
              label="All artists"
            />
          </div>
        </div>

        <div className="px-3 pt-2 pb-2">
          <div
            className="flex items-center gap-2 px-2.5 h-8 rounded-[8px]"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            <Search size={12} style={{ color: "var(--ink-tertiary)" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artist or summary…"
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: "var(--ink)" }}
            />
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto pb-2">
          {isLoading && (
            <div
              className="px-3 py-6 flex items-center justify-center gap-2 text-[12px]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              <Loader2 size={12} className="animate-spin" />
              Loading runs…
            </div>
          )}

          {error && !isLoading && (
            <div className="px-3 py-4 text-[12px]" style={{ color: "#fca5a5" }}>
              {error instanceof Error
                ? error.message
                : "Failed to load recent runs"}
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div
              className="px-3 py-6 text-center text-[12px]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {query
                ? "No runs match that search."
                : showAllArtists
                  ? "No Lead Hunter runs yet."
                  : "No prior runs for this artist yet."}
            </div>
          )}

          {!isLoading &&
            !error &&
            filtered.map((row) => (
              <RecentRow
                key={row.id}
                row={row}
                onClick={() => {
                  onSelect(row.id, row.artist_handle, row.artist_name);
                  setOpen(false);
                }}
              />
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RecentRow({
  row,
  onClick,
}: {
  row: LeadHunterJobSummary;
  onClick: () => void;
}) {
  const when = row.completed_at ?? row.created_at;
  const status = row.status;
  const statusColor =
    status === "complete"
      ? "var(--accent)"
      : status === "failed"
        ? "#fca5a5"
        : "var(--ink-tertiary)";
  const statusLabel =
    status === "complete"
      ? "Complete"
      : status === "failed"
        ? "Failed"
        : status === "running"
          ? "Running"
          : "Pending";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 transition-colors"
      style={{
        background: "transparent",
        borderTop: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="truncate"
          style={{
            fontFamily: "var(--display-font)",
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "-0.005em",
            color: "var(--ink)",
          }}
        >
          {row.artist_name ??
            (row.artist_handle ? `@${row.artist_handle}` : "Unknown artist")}
        </span>
        <span
          className="text-[10px] uppercase tracking-wide font-semibold shrink-0"
          style={{ color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>
      <div
        className="text-[10.5px] mt-0.5"
        style={{ color: "var(--ink-tertiary)" }}
      >
        {formatTimeAgo(when)}
      </div>
      {row.lead_hunter_summary && (
        <div
          className="text-[11px] mt-1 leading-snug"
          style={{
            color: "var(--ink-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {row.lead_hunter_summary}
        </div>
      )}
    </button>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-6 px-2 rounded-[6px] text-[10.5px] font-semibold transition-colors disabled:opacity-40"
      style={{
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-tertiary)",
        border: active ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

function formatTimeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}
