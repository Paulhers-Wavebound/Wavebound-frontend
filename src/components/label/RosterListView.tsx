import { useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Calendar,
  BarChart3,
  User,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { type RosterMetric, getPostingTier } from "./RosterCard";

type SortCol = "artist" | "status" | "lastPost" | "performance" | "plan";
type SortDir = "asc" | "desc";

const TIER_ORDER: Record<string, number> = {
  ACTIVE: 0,
  STABLE: 1,
  COOLING: 2,
  INACTIVE: 3,
  "—": 4,
};

const columns: { key: SortCol; label: string }[] = [
  { key: "artist", label: "Artist" },
  { key: "status", label: "Status" },
  { key: "lastPost", label: "Last Post" },
  { key: "performance", label: "Performance" },
  { key: "plan", label: "Plan Status" },
];

function getSortValue(artist: RosterMetric, col: SortCol): string | number {
  const tier = getPostingTier(artist.days_since_last_post);
  switch (col) {
    case "artist":
      return (artist.artist_name || "").toLowerCase();
    case "status":
      return TIER_ORDER[tier.label] ?? 4;
    case "lastPost":
      return artist.days_since_last_post ?? 999;
    case "performance":
      return artist.performance_ratio_current ?? 0;
    case "plan":
      return (artist as any).has_content_plan ? 0 : 1;
    default:
      return 0;
  }
}

export default function RosterListView({
  artists,
  onArtistClick,
  onOpenDeliverable,
}: {
  artists: RosterMetric[];
  onArtistClick: (handle: string) => void;
  onOpenDeliverable?: (
    handle: string,
    type: "report" | "plan" | "plan30" | "brief",
  ) => void;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("artist");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    return [...artists].sort((a, b) => {
      const aVal = getSortValue(a, sortCol);
      const bVal = getSortValue(b, sortCol);
      const cmp =
        typeof aVal === "string"
          ? aVal.localeCompare(bVal as string)
          : (aVal as number) - (bVal as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [artists, sortCol, sortDir]);

  const headerStyle: React.CSSProperties = {
    background: "#1C1C1E",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table
        className="w-full min-w-[700px]"
        style={{ borderCollapse: "separate", borderSpacing: 0 }}
      >
        <thead>
          <tr style={headerStyle}>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="cursor-pointer select-none px-4 text-left"
                style={{ height: 44 }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortCol === col.key &&
                    (sortDir === "asc" ? (
                      <ArrowUp size={10} />
                    ) : (
                      <ArrowDown size={10} />
                    ))}
                </span>
              </th>
            ))}
            <th className="px-4 text-right" style={{ height: 44 }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((artist, i) => {
            const tier = getPostingTier(artist.days_since_last_post);
            const days = artist.days_since_last_post;
            const daysText = days != null ? `${days}d ago` : "–";
            const hasPlan = (artist as any).has_content_plan;

            return (
              <tr
                key={artist.artist_handle}
                onClick={() => onArtistClick(artist.artist_handle)}
                style={{
                  height: 56,
                  background: i % 2 === 0 ? "#111111" : "#0a0a0a",
                  borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }}
                className="hover:bg-[hsl(0_0%_12%)] transition-colors"
              >
                {/* Artist */}
                <td className="px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={artist.avatar_url || ""}
                        alt={artist.artist_name}
                      />
                      <AvatarFallback className="bg-muted text-[10px] font-semibold">
                        {(artist.artist_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {artist.artist_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        @{artist.artist_handle?.replace(/^@+/, "")}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: tier.badgeBg, color: tier.badgeText }}
                  >
                    {tier.label}
                  </span>
                </td>

                {/* Last Post */}
                <td className="px-4">
                  <span
                    className={`flex items-center gap-1 text-xs ${!tier.daysColor ? "text-muted-foreground" : ""}`}
                    style={
                      tier.daysColor ? { color: tier.daysColor } : undefined
                    }
                  >
                    {tier.showWarning && <AlertTriangle size={12} />}
                    {daysText}
                  </span>
                </td>

                {/* Performance */}
                <td className="px-4">
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {artist.performance_ratio_current != null
                      ? `${artist.performance_ratio_current.toFixed(1)}x`
                      : "–"}
                  </span>
                </td>

                {/* Plan Status */}
                <td className="px-4">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: hasPlan ? "#30D158" : "#4b5563" }}
                    />
                    <span
                      className={
                        hasPlan ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {hasPlan ? "Ready" : "—"}
                    </span>
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onOpenDeliverable && (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              disabled={
                                !(artist as any).has_content_plan &&
                                !(artist as any).has_30day_plan
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:opacity-80 disabled:opacity-30"
                              style={{ background: "#2C2C2E", borderRadius: 8 }}
                            >
                              Plans
                              <ChevronDown
                                size={12}
                                className="text-muted-foreground"
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              disabled={!(artist as any).has_content_plan}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDeliverable(artist.artist_handle, "plan");
                              }}
                            >
                              <Calendar size={14} className="mr-2" />
                              7-Day Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!(artist as any).has_30day_plan}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDeliverable(
                                  artist.artist_handle,
                                  "plan30",
                                );
                              }}
                            >
                              <BarChart3 size={14} className="mr-2" />
                              30-Day Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              disabled={!(artist as any).has_artist_brief}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:opacity-80 disabled:opacity-30"
                              style={{ background: "#2C2C2E", borderRadius: 8 }}
                            >
                              Briefs
                              <ChevronDown
                                size={12}
                                className="text-muted-foreground"
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              disabled={!(artist as any).has_artist_brief}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDeliverable(
                                  artist.artist_handle,
                                  "brief",
                                );
                              }}
                            >
                              <User size={14} className="mr-2" />
                              Artist Brief
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArtistClick(artist.artist_handle);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:opacity-80"
                      style={{ background: "#2C2C2E", borderRadius: 8 }}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
