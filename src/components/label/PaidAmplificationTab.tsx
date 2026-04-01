import { useEffect, useState, useMemo, useCallback } from "react";
import TikTokThumbnail from "@/components/TikTokThumbnail";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollCarouselWrapper } from "@/components/ScrollCarouselWrapper";
import AdImpactSection from "@/components/label/AdImpactSection";
import {
  Eye,
  TrendingUp,
  Heart,
  Share2,
  Lock,
  ExternalLink,
  LayoutGrid,
  List,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Bookmark,
} from "lucide-react";

const ACCENT_PALETTE = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#A855F7",
  "#F43F5E",
  "#06B6D4",
  "#F97316",
  "#14B8A6",
];

/* ────────── types ────────── */

interface VideoWithER {
  id: number;
  caption: string | null;
  video_views: number;
  video_likes: number;
  video_comments: number;
  video_shares: number;
  video_saves: number;
  video_url: string | null;
  video_embedded_url: string | null;
  date_posted: string | null;
  er: number;
  artist_handle: string;
  artist_name: string;
}

interface ArtistPulse {
  handle: string;
  name: string;
  avatarUrl: string | null;
  bestER: number;
  highERCount: number;
  readiness: "ready" | "building";
}

type SortKey =
  | "er"
  | "video_views"
  | "video_likes"
  | "video_shares"
  | "video_saves"
  | "video_comments"
  | "date_posted"
  | "artist_handle";
type SortDir = "asc" | "desc";

/* ────────── helpers ────────── */

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function erBadge(
  er: number,
): { label: string; bg: string; fg: string; action: string } | null {
  if (er >= 8)
    return {
      label: "Boost Ready",
      bg: "#22C55E",
      fg: "#000",
      action: "Run as Spark Ad now",
    };
  if (er >= 5)
    return {
      label: "High Potential",
      bg: "#F59E0B",
      fg: "#000",
      action: "Monitor 48hrs, then boost",
    };
  return null;
}

function erColor(er: number): string {
  if (er >= 8) return "#22C55E";
  if (er >= 5) return "#F59E0B";
  return "#fff";
}

function artistAccentColor(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = ((hash << 5) - hash + handle.charCodeAt(i)) | 0;
  }
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}

function AvatarCircle({
  url,
  name,
  size = 40,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        background: "#3A3A3C",
        color: "#fff",
        fontSize: size * 0.4,
      }}
    >
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

/* ────────── component ────────── */

export default function PaidAmplificationTab({
  labelId,
}: {
  labelId?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [allVideos, setAllVideos] = useState<VideoWithER[]>([]);
  const [rosterMetrics, setRosterMetrics] = useState<any[]>([]);
  const [avatarMap, setAvatarMap] = useState<Map<string, string | null>>(
    new Map(),
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortKey, setSortKey] = useState<SortKey>("er");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const query = (supabase as any)
        .from("roster_dashboard_metrics")
        .select("artist_handle, artist_name, momentum_tier");

      const { data: roster } = labelId
        ? await query.eq("label_id", labelId)
        : await query;

      const rosterArr: any[] = roster || [];
      setRosterMetrics(rosterArr);

      const handles = rosterArr
        .map((r: any) => (r.artist_handle || "").trim().toLowerCase())
        .filter(Boolean);

      if (handles.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await (supabase as any)
        .from("0.1. Table 1 - Profile - TikTok")
        .select("handle, video_id, avatar_url")
        .in("handle", handles);

      const profileArr: any[] = profiles || [];
      const videoIdToHandle = new Map<number, string>();
      const handleAvatars = new Map<string, string | null>();

      for (const p of profileArr) {
        const h = (p.handle || "").trim().toLowerCase();
        if (p.video_id) videoIdToHandle.set(p.video_id, h);
        if (!handleAvatars.has(h) && p.avatar_url) {
          handleAvatars.set(h, p.avatar_url);
        }
      }
      setAvatarMap(handleAvatars);

      const videoIds = Array.from(videoIdToHandle.keys());
      if (videoIds.length === 0) {
        setLoading(false);
        return;
      }

      const fetchedVideos: any[] = [];
      for (let i = 0; i < videoIds.length; i += 500) {
        const batch = videoIds.slice(i, i + 500);
        const { data: vids } = await (supabase as any)
          .from("0.1. Table 2 - Video - TikTok")
          .select(
            "id, caption, video_views, video_likes, video_comments, video_shares, video_saves, video_url, video_embedded_url, date_posted",
          )
          .in("id", batch);
        if (vids) fetchedVideos.push(...vids);
      }

      const handleToName = new Map<string, string>();
      for (const r of rosterArr) {
        handleToName.set(
          (r.artist_handle || "").trim().toLowerCase(),
          r.artist_name || r.artist_handle,
        );
      }

      const enriched: VideoWithER[] = fetchedVideos
        .filter((v: any) => v.video_views > 0)
        .map((v: any) => {
          const engagement =
            (v.video_likes || 0) +
            (v.video_comments || 0) +
            (v.video_shares || 0) +
            (v.video_saves || 0);
          const er = (engagement / v.video_views) * 100;
          const handle = videoIdToHandle.get(v.id) || "";
          return {
            ...v,
            er,
            artist_handle: handle,
            artist_name: handleToName.get(handle) || handle,
          } as VideoWithER;
        })
        .filter((v: VideoWithER) => v.er >= 3)
        .filter((v: VideoWithER) => {
          if (!v.date_posted) return false;
          const twelveMonthsAgo = new Date();
          twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
          return new Date(v.date_posted) >= twelveMonthsAgo;
        })
        .sort((a: VideoWithER, b: VideoWithER) => b.er - a.er);

      setAllVideos(enriched);
    } catch (err) {
      console.error("Paid amplification data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // Grid view: only ER ≥ 5, top 12
  const top12 = useMemo(
    () => allVideos.filter((v) => v.er >= 5).slice(0, 12),
    [allVideos],
  );

  // For artist pulse, still use ER ≥ 5 subset
  const videos5 = useMemo(
    () => allVideos.filter((v) => v.er >= 5),
    [allVideos],
  );

  // Table view: all ER ≥ 3, sorted
  const tableVideos = useMemo(() => {
    const sorted = [...allVideos];
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortKey) {
        case "er":
          aVal = a.er;
          bVal = b.er;
          break;
        case "video_views":
          aVal = a.video_views;
          bVal = b.video_views;
          break;
        case "video_likes":
          aVal = a.video_likes;
          bVal = b.video_likes;
          break;
        case "video_shares":
          aVal = a.video_shares;
          bVal = b.video_shares;
          break;
        case "video_saves":
          aVal = a.video_saves;
          bVal = b.video_saves;
          break;
        case "video_comments":
          aVal = a.video_comments;
          bVal = b.video_comments;
          break;
        case "date_posted":
          aVal = a.date_posted ? new Date(a.date_posted).getTime() : 0;
          bVal = b.date_posted ? new Date(b.date_posted).getTime() : 0;
          break;
        case "artist_handle":
          aVal = a.artist_handle;
          bVal = b.artist_handle;
          break;
        default:
          aVal = a.er;
          bVal = b.er;
      }
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [allVideos, sortKey, sortDir]);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const artistPulse: ArtistPulse[] = useMemo(() => {
    const handleMap = new Map<
      string,
      { handle: string; name: string; ers: number[] }
    >();
    for (const r of rosterMetrics) {
      const key = (r.artist_handle || "").trim().toLowerCase();
      if (!key) continue;
      handleMap.set(key, {
        handle: key,
        name: r.artist_name || r.artist_handle,
        ers: [],
      });
    }
    for (const v of videos5) {
      const entry = handleMap.get(v.artist_handle);
      if (entry) entry.ers.push(v.er);
    }
    return Array.from(handleMap.values())
      .map((a) => {
        const highERCount = a.ers.filter((e) => e >= 5).length;
        if (highERCount === 0) return null;
        const bestER = Math.max(...a.ers);
        const readiness: "ready" | "building" =
          highERCount >= 3 ? "ready" : "building";
        return {
          handle: a.handle,
          name: a.name,
          avatarUrl: avatarMap.get(a.handle) || null,
          bestER,
          highERCount,
          readiness,
        };
      })
      .filter((a): a is ArtistPulse => a !== null)
      .sort((a, b) => {
        if (a.readiness !== b.readiness)
          return a.readiness === "ready" ? -1 : 1;
        return b.bestER - a.bestER;
      });
  }, [rosterMetrics, videos5, avatarMap]);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-40 rounded-2xl"
              style={{ background: "#1C1C1E" }}
            />
          ))}
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-36 w-36 rounded-2xl flex-shrink-0"
              style={{ background: "#1C1C1E" }}
            />
          ))}
        </div>
      </div>
    );
  }

  const SortHeader = ({
    label,
    colKey,
    align = "left",
  }: {
    label: string;
    colKey: SortKey;
    align?: "left" | "right";
  }) => (
    <th
      onClick={() => toggleSort(colKey)}
      className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-[11px] uppercase tracking-wider font-semibold"
      style={{
        color: sortKey === colKey ? "#fff" : "#8E8E93",
        textAlign: align,
        background: "#1C1C1E",
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === colKey ? (
          sortDir === "asc" ? (
            <ArrowUp size={10} />
          ) : (
            <ArrowDown size={10} />
          )
        ) : null}
      </span>
    </th>
  );

  return (
    <div className="space-y-10">
      {/* ─── Section 1: Ready to Boost ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#fff" }}>
              Ready to Boost
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>
              Last 12 months
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className="p-1.5 rounded-md transition-colors"
              style={{
                color: viewMode === "grid" ? "#fff" : "#8E8E93",
                background: viewMode === "grid" ? "#3A3A3C" : "transparent",
              }}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="p-1.5 rounded-md transition-colors"
              style={{
                color: viewMode === "table" ? "#fff" : "#8E8E93",
                background: viewMode === "table" ? "#3A3A3C" : "transparent",
              }}
              title="Table view"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          /* ─── Grid View ─── */
          top12.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "#888" }}>
              No recent high-engagement content — check back after new posts.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {top12.map((v) => {
                const badge = erBadge(v.er);
                if (!badge) return null;
                const tiktokUrl = v.video_url || v.video_embedded_url;
                const accent = artistAccentColor(v.artist_handle);
                const avatar = avatarMap.get(v.artist_handle) || null;
                return (
                  <div
                    key={v.id}
                    className="rounded-2xl overflow-visible flex border border-white/[0.06] hover:border-white/10 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(255,255,255,0.06)]"
                    style={{
                      background: "#1C1C1E",
                      borderLeft: `3px solid ${accent}`,
                    }}
                  >
                    {/* Thumbnail */}
                    <a
                      href={tiktokUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-[120px] overflow-hidden"
                      style={{ aspectRatio: "9/16", maxHeight: 200 }}
                    >
                      <TikTokThumbnail
                        videoId={v.id}
                        tiktokUrl={tiktokUrl || ""}
                        className="w-full h-full"
                      />
                    </a>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col gap-2 min-w-0 relative">
                      {/* Badge top-right */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-0.5">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: badge.bg, color: badge.fg }}
                        >
                          {badge.label}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: "#8E8E93" }}
                        >
                          {badge.action}
                        </span>
                      </div>

                      {/* Artist row */}
                      <div className="flex items-center gap-2 pr-28">
                        <AvatarCircle
                          url={avatar}
                          name={v.artist_name}
                          size={32}
                        />
                        <span
                          className="text-xs font-medium truncate"
                          style={{ color: "#fff" }}
                        >
                          @{v.artist_handle?.replace(/^@+/, "")}
                        </span>
                      </div>

                      {/* Caption */}
                      <p
                        className="text-xs leading-snug line-clamp-1 pr-28"
                        style={{ color: "#ccc" }}
                      >
                        {v.caption || "No caption"}
                      </p>

                      {/* Date */}
                      <span className="text-[10px]" style={{ color: "#555" }}>
                        {relativeDate(v.date_posted)}
                      </span>

                      {/* Stats row */}
                      <div
                        className="flex items-center gap-4 text-[11px] mt-auto"
                        style={{ color: "#8E8E93" }}
                      >
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {fmt(v.video_views)}
                        </span>
                        <span
                          className="flex items-center gap-1 font-bold"
                          style={{ color: badge.bg }}
                        >
                          <TrendingUp size={11} /> {v.er.toFixed(1)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={11} /> {fmt(v.video_likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 size={11} /> {fmt(v.video_shares)}
                        </span>
                        {tiktokUrl && (
                          <a
                            href={tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 ml-auto hover:underline"
                            style={{ color: "#8E8E93" }}
                          >
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : /* ─── Table View ─── */
        tableVideos.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "#888" }}>
            No recent high-engagement content — check back after new posts.
          </p>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="overflow-auto max-h-[600px]">
              <table
                className="w-full text-left border-collapse"
                style={{ background: "#1C1C1E" }}
              >
                <thead
                  className="sticky top-0 z-10"
                  style={{ background: "#1C1C1E" }}
                >
                  <tr style={{ borderBottom: "1px solid #3A3A3C" }}>
                    <th
                      className="px-3 py-3 text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: "#8E8E93", background: "#1C1C1E" }}
                    >
                      Thumb
                    </th>
                    <SortHeader label="Artist" colKey="artist_handle" />
                    <th
                      className="px-3 py-3 text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: "#8E8E93", background: "#1C1C1E" }}
                    >
                      Caption
                    </th>
                    <SortHeader
                      label="Views"
                      colKey="video_views"
                      align="right"
                    />
                    <SortHeader
                      label="Likes"
                      colKey="video_likes"
                      align="right"
                    />
                    <SortHeader
                      label="Shares"
                      colKey="video_shares"
                      align="right"
                    />
                    <SortHeader
                      label="Saves"
                      colKey="video_saves"
                      align="right"
                    />
                    <SortHeader
                      label="Comments"
                      colKey="video_comments"
                      align="right"
                    />
                    <SortHeader label="ER%" colKey="er" align="right" />
                    <th
                      className="px-3 py-3 text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: "#8E8E93", background: "#1C1C1E" }}
                    >
                      Status
                    </th>
                    <SortHeader
                      label="Posted"
                      colKey="date_posted"
                      align="right"
                    />
                    <th
                      className="px-3 py-3 text-[11px] uppercase tracking-wider font-semibold"
                      style={{ color: "#8E8E93", background: "#1C1C1E" }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableVideos.map((v, idx) => {
                    const badge = erBadge(v.er);
                    const tiktokUrl = v.video_url || v.video_embedded_url;
                    const avatar = avatarMap.get(v.artist_handle) || null;
                    const rowBg = idx % 2 === 0 ? "#1C1C1E" : "#2C2C2E";

                    return (
                      <tr
                        key={v.id}
                        className="transition-colors"
                        style={{
                          background: rowBg,
                          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#3A3A3C")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = rowBg)
                        }
                      >
                        {/* Thumbnail */}
                        <td className="px-3 py-2">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <TikTokThumbnail
                              videoId={v.id}
                              tiktokUrl={tiktokUrl || ""}
                              className="w-12 h-12"
                            />
                          </div>
                        </td>

                        {/* Artist */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <AvatarCircle
                              url={avatar}
                              name={v.artist_name}
                              size={24}
                            />
                            <span
                              className="text-xs font-medium truncate max-w-[100px]"
                              style={{ color: "#fff" }}
                            >
                              @{v.artist_handle?.replace(/^@+/, "")}
                            </span>
                          </div>
                        </td>

                        {/* Caption */}
                        <td className="px-3 py-2">
                          <span
                            className="text-xs truncate block max-w-[160px]"
                            style={{ color: "#ccc" }}
                          >
                            {(v.caption || "No caption").slice(0, 40)}
                            {(v.caption?.length || 0) > 40 ? "…" : ""}
                          </span>
                        </td>

                        {/* Views */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className="text-xs tabular-nums"
                            style={{ color: "#fff" }}
                          >
                            {fmt(v.video_views)}
                          </span>
                        </td>

                        {/* Likes */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className="text-xs tabular-nums"
                            style={{ color: "#8E8E93" }}
                          >
                            {fmt(v.video_likes)}
                          </span>
                        </td>

                        {/* Shares */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className="text-xs tabular-nums"
                            style={{ color: "#8E8E93" }}
                          >
                            {fmt(v.video_shares)}
                          </span>
                        </td>

                        {/* Saves */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className="text-xs tabular-nums"
                            style={{ color: "#8E8E93" }}
                          >
                            {fmt(v.video_saves)}
                          </span>
                        </td>

                        {/* Comments */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className="text-xs tabular-nums"
                            style={{ color: "#8E8E93" }}
                          >
                            {fmt(v.video_comments)}
                          </span>
                        </td>

                        {/* ER% */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color: erColor(v.er) }}
                          >
                            {v.er.toFixed(1)}%
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2">
                          {badge ? (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: badge.bg, color: badge.fg }}
                            >
                              {badge.label}
                            </span>
                          ) : null}
                        </td>

                        {/* Posted */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className="text-[11px] whitespace-nowrap"
                            style={{ color: "#8E8E93" }}
                          >
                            {relativeDate(v.date_posted)}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2 text-center">
                          {tiktokUrl && (
                            <a
                              href={tiktokUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center hover:opacity-80"
                              style={{ color: "#8E8E93" }}
                              title="View on TikTok"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ─── Section 2: Artist Ad Readiness ─── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold" style={{ color: "#fff" }}>
          Artist Ad Readiness
        </h2>

        {artistPulse.length === 0 ? (
          <p className="text-sm py-4" style={{ color: "#888" }}>
            No artists with qualifying videos yet.
          </p>
        ) : (
          <ScrollCarouselWrapper>
            {artistPulse.map((a) => {
              const isReady = a.readiness === "ready";
              return (
                <div
                  key={a.handle}
                  className="flex-shrink-0 w-40 rounded-2xl p-4 flex flex-col items-center gap-3 snap-start transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: "#1C1C1E",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <AvatarCircle url={a.avatarUrl} name={a.name} size={48} />
                  <span
                    className="text-xs font-semibold truncate w-full text-center"
                    style={{ color: "#fff" }}
                  >
                    @{a.handle?.replace(/^@+/, "")}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-md"
                    style={{
                      background: isReady
                        ? "rgba(34,197,94,0.12)"
                        : "rgba(245,158,11,0.12)",
                      color: isReady ? "#22C55E" : "#F59E0B",
                    }}
                  >
                    {isReady ? "Ready" : "Getting there"}
                  </span>
                  <span className="text-[11px]" style={{ color: "#8E8E93" }}>
                    Best ER:{" "}
                    <span className="font-bold" style={{ color: "#fff" }}>
                      {a.bestER.toFixed(1)}%
                    </span>
                  </span>
                </div>
              );
            })}
          </ScrollCarouselWrapper>
        )}
      </section>

      {/* ─── Ad Impact Attribution ─── */}
      <AdImpactSection avatarMap={avatarMap} />

      {/* ─── Section 3: Quick Reference ─── */}
      <section>
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#1C1C1E",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="text-sm font-bold mb-5" style={{ color: "#fff" }}>
            Quick Reference
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Format", value: "15–30s Spark Ads" },
              { label: "Test Budget", value: "$200–500 per video" },
              { label: "Scale Budget", value: "$1–3K per video" },
            ].map((item) => (
              <div key={item.label}>
                <span
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: "#8E8E93" }}
                >
                  {item.label}
                </span>
                <p
                  className="text-sm font-semibold mt-1.5"
                  style={{ color: "rgba(255,255,255,0.87)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 4: AI Ad Brief Generator (teaser) ─── */}
      <section>
        <div
          className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{
            background: "#1C1C1E",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.12)" }}
            >
              <Lock size={16} style={{ color: "#A78BFA" }} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold" style={{ color: "#fff" }}>
                AI Ad Brief Generator
              </h3>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Automatically generate ad briefs, targeting recommendations, and
                creative scripts tailored to each artist's highest-performing
                content.
              </p>
              <p
                className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Available in Pro tier — currently in beta with select labels
              </p>
            </div>
          </div>
          <span
            className="text-[11px] font-semibold px-3 py-1.5 rounded-md flex-shrink-0"
            style={{ background: "rgba(139,92,246,0.12)", color: "#A78BFA" }}
          >
            Coming Soon
          </span>
        </div>
      </section>
    </div>
  );
}
