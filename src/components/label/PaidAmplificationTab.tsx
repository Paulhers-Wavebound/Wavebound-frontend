import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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
  Zap,
  Target,
  BarChart3,
} from "lucide-react";

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
      label: "BOOST READY",
      bg: "rgba(48, 209, 88, 0.15)",
      fg: "var(--green, #30D158)",
      action: "Run as Spark Ad now",
    };
  if (er >= 5)
    return {
      label: "HIGH POTENTIAL",
      bg: "rgba(255, 159, 10, 0.12)",
      fg: "#FF9F0A",
      action: "Monitor 48hrs, then boost",
    };
  return null;
}

function erColor(er: number): string {
  if (er >= 8) return "var(--green, #30D158)";
  if (er >= 5) return "#FF9F0A";
  return "var(--ink, rgba(255,255,255,0.87))";
}

/* ────────── shared sub-components ────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 3,
          height: 14,
          borderRadius: 1,
          background:
            "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
        }}
      />
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
          textTransform: "uppercase",
          letterSpacing: "0.10em",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: accent
          ? "linear-gradient(180deg, rgba(232,67,10,0.10) 0%, rgba(232,67,10,0.04) 100%)"
          : "var(--surface, #1C1C1E)",
        border: accent
          ? "1px solid rgba(232,67,10,0.25)"
          : "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        borderRadius: 16,
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent
            ? "linear-gradient(90deg, #e8430a 0%, rgba(232,67,10,0.2) 100%)"
            : "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      />
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          color: accent
            ? "rgba(232,67,10,0.7)"
            : "var(--ink-tertiary, rgba(255,255,255,0.45))",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 36,
          fontWeight: 700,
          color: accent
            ? "var(--accent, #e8430a)"
            : "var(--ink, rgba(255,255,255,0.87))",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            fontWeight: 500,
            color: "var(--green, #30D158)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {sub}
        </span>
      )}
    </motion.div>
  );
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
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontWeight: 700,
        background: "var(--overlay-active, rgba(255,255,255,0.06))",
        color: "var(--ink, rgba(255,255,255,0.87))",
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
    } catch {
      // Error handled by empty state UI
    } finally {
      setLoading(false);
    }
  }

  const top12 = useMemo(
    () => allVideos.filter((v) => v.er >= 5).slice(0, 12),
    [allVideos],
  );

  const videos5 = useMemo(
    () => allVideos.filter((v) => v.er >= 5),
    [allVideos],
  );

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

  // Summary stats
  const boostReady = useMemo(
    () => allVideos.filter((v) => v.er >= 8).length,
    [allVideos],
  );
  const highPotential = useMemo(
    () => allVideos.filter((v) => v.er >= 5 && v.er < 8).length,
    [allVideos],
  );
  const avgER = useMemo(() => {
    if (allVideos.length === 0) return 0;
    return allVideos.reduce((s, v) => s + v.er, 0) / allVideos.length;
  }, [allVideos]);
  const topER = useMemo(
    () => (allVideos.length > 0 ? allVideos[0].er : 0),
    [allVideos],
  );

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Skeleton
            style={{
              height: 44,
              width: 320,
              background: "var(--surface, #1C1C1E)",
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
          <Skeleton
            style={{
              height: 18,
              width: 480,
              background: "var(--surface, #1C1C1E)",
              borderRadius: 6,
            }}
          />
        </motion.div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
            >
              <Skeleton
                style={{
                  height: 120,
                  borderRadius: 16,
                  background: "var(--surface, #1C1C1E)",
                }}
              />
            </motion.div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.06 }}
            >
              <Skeleton
                style={{
                  height: 160,
                  borderRadius: 16,
                  background: "var(--surface, #1C1C1E)",
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {/* ── 1. Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 38,
              fontWeight: 800,
              color: "var(--ink, rgba(255,255,255,0.92))",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Paid Amplification
          </h1>
        </div>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
            margin: 0,
            maxWidth: 640,
            lineHeight: 1.5,
          }}
        >
          Identify high-engagement content ready to boost — sorted by engagement
          rate across your entire roster.
        </p>
      </motion.div>

      {/* ── 2. Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SectionLabel>Overview</SectionLabel>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 500,
              color: "var(--ink-faint, rgba(255,255,255,0.25))",
              letterSpacing: "0.04em",
              padding: "3px 8px",
              borderRadius: 4,
              background: "var(--overlay-hover, rgba(255,255,255,0.03))",
            }}
          >
            LAST 12 MONTHS
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginTop: 14,
          }}
        >
          <StatCard
            label="Boost Ready"
            value={String(boostReady)}
            sub={`ER \u2265 8%`}
            accent
            delay={0.15}
          />
          <StatCard
            label="High Potential"
            value={String(highPotential)}
            sub={`ER \u2265 5%`}
            delay={0.2}
          />
          <StatCard
            label="Avg Engagement"
            value={`${avgER.toFixed(1)}%`}
            delay={0.25}
          />
          <StatCard label="Top ER" value={`${topER.toFixed(1)}%`} delay={0.3} />
        </div>
      </motion.div>

      {/* ── 3. Ready to Boost ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <SectionLabel>Ready to Boost</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {(
              [
                { key: "grid" as const, icon: LayoutGrid, label: "Grid" },
                { key: "table" as const, icon: List, label: "Table" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background:
                    viewMode === tab.key
                      ? "var(--overlay-active, rgba(255,255,255,0.06))"
                      : "transparent",
                  color:
                    viewMode === tab.key
                      ? "var(--ink, rgba(255,255,255,0.87))"
                      : "var(--ink-faint, rgba(255,255,255,0.3))",
                  transition: "all 150ms",
                }}
                title={`${tab.label} view`}
              >
                <tab.icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {viewMode === "grid" ? (
          <GridView videos={top12} avatarMap={avatarMap} />
        ) : (
          <TableView
            videos={tableVideos}
            avatarMap={avatarMap}
            sortKey={sortKey}
            sortDir={sortDir}
            toggleSort={toggleSort}
          />
        )}
      </motion.div>

      {/* ── 4. Artist Ad Readiness ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <SectionLabel>Artist Ad Readiness</SectionLabel>
        <div style={{ marginTop: 14 }}>
          {artistPulse.length === 0 ? (
            <div
              style={{
                background: "var(--surface, #1C1C1E)",
                borderRadius: 16,
                border:
                  "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                padding: "32px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-faint, rgba(255,255,255,0.35))",
                  margin: 0,
                }}
              >
                No artists with qualifying videos yet.
              </p>
            </div>
          ) : (
            <ScrollCarouselWrapper>
              {artistPulse.map((a) => {
                const isReady = a.readiness === "ready";
                return (
                  <div
                    key={a.handle}
                    style={{
                      flexShrink: 0,
                      width: 164,
                      background: "var(--surface, #1C1C1E)",
                      border:
                        "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                      borderRadius: 16,
                      padding: "20px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      scrollSnapAlign: "start",
                      transition: "border-color 200ms, transform 200ms",
                      cursor: "default",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.12)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-subtle, rgba(255,255,255,0.06))";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: isReady
                          ? "linear-gradient(90deg, rgba(48,209,88,0.4) 0%, rgba(48,209,88,0.05) 100%)"
                          : "linear-gradient(90deg, rgba(255,159,10,0.4) 0%, rgba(255,159,10,0.05) 100%)",
                      }}
                    />
                    <AvatarCircle url={a.avatarUrl} name={a.name} size={48} />
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--ink, rgba(255,255,255,0.87))",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        width: "100%",
                        textAlign: "center",
                      }}
                    >
                      @{a.handle?.replace(/^@+/, "")}
                    </span>
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: isReady
                          ? "rgba(48,209,88,0.12)"
                          : "rgba(255,159,10,0.12)",
                        color: isReady ? "var(--green, #30D158)" : "#FF9F0A",
                      }}
                    >
                      {isReady ? "READY" : "BUILDING"}
                    </span>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: "var(--ink-faint, rgba(255,255,255,0.35))",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          marginBottom: 4,
                        }}
                      >
                        Best ER
                      </div>
                      <div
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 18,
                          fontWeight: 700,
                          color: "var(--ink, rgba(255,255,255,0.87))",
                        }}
                      >
                        {a.bestER.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </ScrollCarouselWrapper>
          )}
        </div>
      </motion.div>

      {/* ── 5. Ad Impact Attribution ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <SectionLabel>Ad Impact Attribution</SectionLabel>
        <div style={{ marginTop: 14 }}>
          <AdImpactSection avatarMap={avatarMap} />
        </div>
      </motion.div>

      {/* ── 6. Quick Reference ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <SectionLabel>Quick Reference</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 14,
          }}
        >
          {[
            {
              icon: Zap,
              label: "Format",
              value: "15\u201330s Spark Ads",
              desc: "Native-looking promoted posts",
            },
            {
              icon: Target,
              label: "Test Budget",
              value: "$200\u2013500",
              desc: "Per video test spend",
            },
            {
              icon: BarChart3,
              label: "Scale Budget",
              value: "$1\u20133K",
              desc: "Per video at scale",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--surface, #1C1C1E)",
                border:
                  "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <item.icon
                size={16}
                color="var(--ink-tertiary, rgba(255,255,255,0.45))"
                strokeWidth={1.5}
              />
              <div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 6,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--ink, rgba(255,255,255,0.87))",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.value}
                </div>
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-faint, rgba(255,255,255,0.35))",
                  lineHeight: 1.4,
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 7. AI Ad Brief CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 20,
          padding: "32px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            flex: 1,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "rgba(139,92,246,0.12)",
            }}
          >
            <Lock size={18} color="#A78BFA" />
          </div>
          <div>
            <h3
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ink, rgba(255,255,255,0.87))",
                margin: "0 0 6px",
              }}
            >
              AI Ad Brief Generator
            </h3>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-tertiary, rgba(255,255,255,0.5))",
                margin: "0 0 4px",
                lineHeight: 1.5,
                maxWidth: 480,
              }}
            >
              Automatically generate ad briefs, targeting recommendations, and
              creative scripts tailored to each artist's highest-performing
              content.
            </p>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-faint, rgba(255,255,255,0.25))",
                margin: 0,
              }}
            >
              Available in Pro tier — currently in beta with select labels
            </p>
          </div>
        </div>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(139,92,246,0.12)",
            color: "#A78BFA",
            flexShrink: 0,
          }}
        >
          COMING SOON
        </span>
      </motion.div>
    </div>
  );
}

/* ────────── Grid View ────────── */

function GridView({
  videos,
  avatarMap,
}: {
  videos: VideoWithER[];
  avatarMap: Map<string, string | null>;
}) {
  if (videos.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface, #1C1C1E)",
          borderRadius: 16,
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-faint, rgba(255,255,255,0.35))",
            margin: 0,
          }}
        >
          No recent high-engagement content — check back after new posts.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
      }}
    >
      {videos.map((v, i) => {
        const badge = erBadge(v.er);
        if (!badge) return null;
        const tiktokUrl = v.video_url || v.video_embedded_url;
        const avatar = avatarMap.get(v.artist_handle) || null;

        return (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i }}
            style={{
              background: "var(--surface, #1C1C1E)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
              borderRadius: 16,
              display: "flex",
              overflow: "hidden",
              transition: "border-color 200ms, transform 200ms",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                "var(--border-subtle, rgba(255,255,255,0.06))";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Thumbnail */}
            <a
              href={tiktokUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flexShrink: 0,
                width: 110,
                overflow: "hidden",
                display: "block",
              }}
            >
              <TikTokThumbnail
                videoId={v.id}
                tiktokUrl={tiktokUrl || ""}
                className="w-full h-full"
              />
            </a>

            {/* Content */}
            <div
              style={{
                flex: 1,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 0,
                position: "relative",
              }}
            >
              {/* Badge */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: badge.bg,
                    color: badge.fg,
                  }}
                >
                  {badge.label}
                </span>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    color: "var(--ink-faint, rgba(255,255,255,0.3))",
                  }}
                >
                  {badge.action}
                </span>
              </div>

              {/* Artist */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingRight: 120,
                }}
              >
                <AvatarCircle url={avatar} name={v.artist_name} size={28} />
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ink, rgba(255,255,255,0.87))",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  @{v.artist_handle?.replace(/^@+/, "")}
                </span>
              </div>

              {/* Caption */}
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                  margin: 0,
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: 120,
                }}
              >
                {v.caption || "No caption"}
              </p>

              {/* Date */}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "var(--ink-faint, rgba(255,255,255,0.25))",
                }}
              >
                {relativeDate(v.date_posted)}
              </span>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginTop: "auto",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-faint, rgba(255,255,255,0.4))",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Eye size={11} /> {fmt(v.video_views)}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontWeight: 700,
                    color: erColor(v.er),
                  }}
                >
                  <TrendingUp size={11} /> {v.er.toFixed(1)}%
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Heart size={11} /> {fmt(v.video_likes)}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Share2 size={11} /> {fmt(v.video_shares)}
                </span>
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginLeft: "auto",
                      color: "var(--ink-faint, rgba(255,255,255,0.3))",
                      transition: "color 150ms",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color =
                        "var(--ink-secondary, rgba(255,255,255,0.55))")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "var(--ink-faint, rgba(255,255,255,0.3))")
                    }
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ────────── Table View ────────── */

function TableView({
  videos,
  avatarMap,
  sortKey,
  sortDir,
  toggleSort,
}: {
  videos: VideoWithER[];
  avatarMap: Map<string, string | null>;
  sortKey: SortKey;
  sortDir: SortDir;
  toggleSort: (key: SortKey) => void;
}) {
  if (videos.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface, #1C1C1E)",
          borderRadius: 16,
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-faint, rgba(255,255,255,0.35))",
            margin: 0,
          }}
        >
          No recent high-engagement content — check back after new posts.
        </p>
      </div>
    );
  }

  const thStyle = (
    colKey: SortKey | null,
    align: "left" | "right" = "left",
  ): React.CSSProperties => ({
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color:
      colKey && sortKey === colKey
        ? "var(--ink, rgba(255,255,255,0.87))"
        : "var(--ink-faint, rgba(255,255,255,0.35))",
    textAlign: align,
    padding: "12px 14px",
    background: "var(--surface, #1C1C1E)",
    cursor: colKey ? "pointer" : "default",
    userSelect: "none",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
  });

  const SortIndicator = ({ colKey }: { colKey: SortKey }) =>
    sortKey === colKey ? (
      sortDir === "asc" ? (
        <ArrowUp size={9} style={{ marginLeft: 3 }} />
      ) : (
        <ArrowDown size={9} style={{ marginLeft: 3 }} />
      )
    ) : null;

  return (
    <div
      style={{
        background: "var(--surface, #1C1C1E)",
        borderRadius: 16,
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto", maxHeight: 600 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          <thead>
            <tr>
              <th style={thStyle(null)}>Thumb</th>
              <th
                style={thStyle("artist_handle")}
                onClick={() => toggleSort("artist_handle")}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Artist
                  <SortIndicator colKey="artist_handle" />
                </span>
              </th>
              <th style={thStyle(null)}>Caption</th>
              <th
                style={thStyle("video_views", "right")}
                onClick={() => toggleSort("video_views")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  Views
                  <SortIndicator colKey="video_views" />
                </span>
              </th>
              <th
                style={thStyle("video_likes", "right")}
                onClick={() => toggleSort("video_likes")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  Likes
                  <SortIndicator colKey="video_likes" />
                </span>
              </th>
              <th
                style={thStyle("video_shares", "right")}
                onClick={() => toggleSort("video_shares")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  Shares
                  <SortIndicator colKey="video_shares" />
                </span>
              </th>
              <th
                style={thStyle("video_saves", "right")}
                onClick={() => toggleSort("video_saves")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  Saves
                  <SortIndicator colKey="video_saves" />
                </span>
              </th>
              <th
                style={thStyle("video_comments", "right")}
                onClick={() => toggleSort("video_comments")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  Comments
                  <SortIndicator colKey="video_comments" />
                </span>
              </th>
              <th
                style={thStyle("er", "right")}
                onClick={() => toggleSort("er")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  ER%
                  <SortIndicator colKey="er" />
                </span>
              </th>
              <th style={thStyle(null)}>Status</th>
              <th
                style={thStyle("date_posted", "right")}
                onClick={() => toggleSort("date_posted")}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  Posted
                  <SortIndicator colKey="date_posted" />
                </span>
              </th>
              <th style={{ ...thStyle(null, "right"), width: 44 }}></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => {
              const badge = erBadge(v.er);
              const tiktokUrl = v.video_url || v.video_embedded_url;
              const avatar = avatarMap.get(v.artist_handle) || null;

              const cellStyle: React.CSSProperties = {
                padding: "10px 14px",
                borderBottom:
                  "1px solid var(--border-subtle, rgba(255,255,255,0.04))",
                verticalAlign: "middle",
              };

              return (
                <tr
                  key={v.id}
                  style={{ transition: "background 150ms" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--overlay-hover, rgba(255,255,255,0.03))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td style={cellStyle}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <TikTokThumbnail
                        videoId={v.id}
                        tiktokUrl={tiktokUrl || ""}
                        className="w-11 h-11"
                      />
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <AvatarCircle
                        url={avatar}
                        name={v.artist_name}
                        size={24}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--ink, rgba(255,255,255,0.87))",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 100,
                        }}
                      >
                        @{v.artist_handle?.replace(/^@+/, "")}
                      </span>
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                        maxWidth: 160,
                      }}
                    >
                      {(v.caption || "No caption").slice(0, 40)}
                      {(v.caption?.length || 0) > 40 ? "\u2026" : ""}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        color: "var(--ink, rgba(255,255,255,0.87))",
                      }}
                    >
                      {fmt(v.video_views)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                      }}
                    >
                      {fmt(v.video_likes)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                      }}
                    >
                      {fmt(v.video_shares)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                      }}
                    >
                      {fmt(v.video_saves)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                      }}
                    >
                      {fmt(v.video_comments)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        fontWeight: 700,
                        color: erColor(v.er),
                      }}
                    >
                      {v.er.toFixed(1)}%
                    </span>
                  </td>
                  <td style={cellStyle}>
                    {badge && (
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: badge.bg,
                          color: badge.fg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {badge.label}
                      </span>
                    )}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: "var(--ink-faint, rgba(255,255,255,0.3))",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {relativeDate(v.date_posted)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    {tiktokUrl && (
                      <a
                        href={tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--ink-faint, rgba(255,255,255,0.3))",
                          transition: "color 150ms",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color =
                            "var(--ink-secondary, rgba(255,255,255,0.55))")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            "var(--ink-faint, rgba(255,255,255,0.3))")
                        }
                        title="View on TikTok"
                      >
                        <ExternalLink size={13} />
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
  );
}
