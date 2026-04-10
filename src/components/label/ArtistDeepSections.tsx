import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Play, TrendingUp, TrendingDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DeepResearchData {
  contentAnalysis: any | null;
  brandDocument: any | null;
  crossPlatform: any | null;
  commentData: any | null;
  spotifyData: any | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function parseVerdict(verdict: string): { label: string; description: string } {
  if (!verdict) return { label: "", description: "" };
  // Try splitting on " — " first
  const parts = verdict.split(" — ");
  if (parts.length > 1) {
    const label = (parts[0] || "").trim().toUpperCase();
    const description = parts.slice(1).join(" — ").trim();
    return { label, description };
  }
  // No delimiter — check if it starts with a known keyword
  const upper = verdict.trim().toUpperCase();
  const keywords = [
    "SCALE",
    "STOP / FIX",
    "STOP",
    "MAINTAIN AT REDUCED VOLUME",
    "MAINTAIN",
    "REDUCE",
    "TEST MORE",
    "TEST",
    "FIX",
  ];
  for (const kw of keywords) {
    if (upper.startsWith(kw)) {
      const rest = verdict
        .trim()
        .slice(kw.length)
        .replace(/^[\s.,:;-]+/, "")
        .trim();
      const finalLabel = kw === "STOP" ? "STOP / FIX" : kw;
      return { label: finalLabel, description: rest };
    }
  }
  // Fallback: first sentence as label, rest as description
  const sentenceEnd = verdict.search(/[.!]\s/);
  if (sentenceEnd > 0 && sentenceEnd < 30) {
    return {
      label: verdict.slice(0, sentenceEnd).trim().toUpperCase(),
      description: verdict.slice(sentenceEnd + 1).trim(),
    };
  }
  return { label: "", description: verdict.trim() };
}

function verdictBadgeClass(label: string): string {
  const upper = label.toUpperCase();
  if (upper === "SCALE")
    return "bg-green-500/15 text-green-500 border-green-500/30";
  if (upper === "STOP" || upper === "STOP / FIX" || upper === "FIX")
    return "bg-red-500/15 text-red-500 border-red-500/30";
  if (
    upper === "REDUCE" ||
    upper.startsWith("MAINTAIN") ||
    upper.startsWith("TEST")
  )
    return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function safeNum(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function prColor(ratio: number): string {
  if (ratio >= 2) return "text-green-500";
  if (ratio >= 1) return "text-foreground";
  return "text-red-500";
}

// ── Collapsible Section Wrapper ────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);

  return (
    <Card className="border-border/50 bg-card overflow-hidden rounded-xl">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors cursor-pointer"
          >
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up px-4 pb-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ── 1. Content X-Ray ───────────────────────────────────────────────────────────

function ContentXRay({
  brandDocument,
  contentAnalysis,
}: {
  brandDocument: any;
  contentAnalysis: any;
}) {
  const formats = brandDocument?.content_dna?.performance_by_format;
  const summary = contentAnalysis?.summary;

  if (!formats?.length && !summary) return null;

  const sorted = formats?.length
    ? [...formats].sort(
        (a: any, b: any) =>
          (safeNum(b.avg_performance_ratio ?? b.avg_view_multiplier) ?? 0) -
          (safeNum(a.avg_performance_ratio ?? a.avg_view_multiplier) ?? 0),
      )
    : [];

  return (
    <Section title="Content X-Ray">
      {sorted.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Format</th>
                <th className="pb-2 pr-4 font-medium text-right">Videos</th>
                <th className="pb-2 pr-4 font-medium text-right">Avg Perf</th>
                <th className="pb-2 pr-4 font-medium text-center">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f: any, i: number) => {
                const { label, description } = parseVerdict(f.verdict ?? "");
                const perf = safeNum(
                  f.avg_performance_ratio ?? f.avg_view_multiplier,
                );
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-border/30 last:border-0",
                      i % 2 === 1 && "bg-muted/20",
                    )}
                  >
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {f.format_name ?? f.format ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground tabular-nums">
                      {f.video_count ?? f.count ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 pr-4 text-right tabular-nums font-semibold",
                        perf != null ? prColor(perf) : "text-muted-foreground",
                      )}
                    >
                      {perf != null ? `${perf.toFixed(1)}x` : "—"}
                    </td>
                    <td
                      className="py-2.5 pr-4 text-center max-w-[180px]"
                      title={
                        description ? `${label}: ${description}` : undefined
                      }
                    >
                      {label && (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide leading-none whitespace-nowrap max-w-full overflow-hidden text-ellipsis",
                            verdictBadgeClass(label),
                          )}
                        >
                          {label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {summary && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
          {summary.videos_analyzed != null && (
            <span>{summary.videos_analyzed} videos analyzed</span>
          )}
          {summary.avg_hook_score != null && (
            <span>
              Avg hook score:{" "}
              <b className="text-foreground">{summary.avg_hook_score}/10</b>
            </span>
          )}
          {summary.median_views != null && (
            <span>
              Median views:{" "}
              <b className="text-foreground">{fmtNum(summary.median_views)}</b>
            </span>
          )}
        </div>
      )}
    </Section>
  );
}

function FormatCard({
  name,
  verdictLabel,
  verdictDesc,
  count,
  perf,
}: {
  name: string;
  verdictLabel: string;
  verdictDesc: string;
  count: number | null;
  perf: number | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-muted/30 border border-border/40 p-3.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-snug">
          {name || "—"}
        </p>
        {verdictLabel && (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0",
              verdictBadgeClass(verdictLabel),
            )}
          >
            {verdictLabel}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {count != null ? `${count} videos` : "—"} ·{" "}
        {perf != null ? `Avg ${perf.toFixed(1)}x` : "—"}
      </p>
      {verdictDesc && (
        <>
          <p
            className={cn(
              "text-xs text-muted-foreground/80 leading-relaxed cursor-pointer",
              !expanded && "line-clamp-1",
            )}
            onClick={() => setExpanded(!expanded)}
          >
            {verdictDesc}
          </p>
        </>
      )}
    </div>
  );
}

// ── 2. Best & Worst Performers ─────────────────────────────────────────────────

function BestWorstPerformers({ contentAnalysis }: { contentAnalysis: any }) {
  const videos = contentAnalysis?.videos;
  if (!videos?.length) return null;

  const sorted = [...videos].sort(
    (a: any, b: any) =>
      (b.performance_ratio ?? b.view_multiplier ?? 0) -
      (a.performance_ratio ?? a.view_multiplier ?? 0),
  );

  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.length > 3 ? sorted.slice(-3).reverse() : [];

  return (
    <Section title="Best & Worst Performers">
      {top3.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span>Top performers</span>
          </div>
          {top3.map((v: any, i: number) => (
            <VideoRow key={`top-${i}`} video={v} type="top" />
          ))}
        </div>
      )}
      {bottom3.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            <span>Bottom performers</span>
          </div>
          {bottom3.map((v: any, i: number) => (
            <VideoRow key={`bot-${i}`} video={v} type="bottom" />
          ))}
        </div>
      )}
    </Section>
  );
}

function VideoRow({ video, type }: { video: any; type: "top" | "bottom" }) {
  const pr = safeNum(video.performance_ratio ?? video.view_multiplier);
  const borderClass =
    type === "top" ? "border-l-green-500" : "border-l-red-500";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg border-l-2 bg-muted/30",
        borderClass,
      )}
    >
      <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <Play className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate">
          {video.caption
            ? video.caption.length > 50
              ? video.caption.slice(0, 50) + "…"
              : video.caption
            : "No caption"}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
          <span>{fmtNum(video.views)} views</span>
          {video.date_posted && <span>· {fmtDate(video.date_posted)}</span>}
        </div>
      </div>
      {pr != null && (
        <span
          className={cn("text-xs font-bold shrink-0 tabular-nums", prColor(pr))}
        >
          {pr.toFixed(1)}x
        </span>
      )}
    </div>
  );
}

// ── 3. Platform Comparison ─────────────────────────────────────────────────────

function PlatformComparison({ crossPlatform }: { crossPlatform: any }) {
  if (!crossPlatform) return null;

  const posts: any[] = crossPlatform.matched_posts ?? [];
  if (posts.length === 0) return null;

  // Calculate avg views per platform
  const calcAvgViews = (platform: "tiktok" | "instagram") => {
    const vals = posts
      .map((p: any) => {
        const obj = p?.[platform];
        if (!obj) return null;
        return platform === "instagram"
          ? (obj.plays ?? obj.video_views ?? null)
          : (obj.views ?? obj.video_views ?? null);
      })
      .filter((v: any) => v != null && v > 0) as number[];
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  // Calculate avg engagement: (likes + comments*2) / views * 100
  const calcAvgEngagement = (platform: "tiktok" | "instagram") => {
    const engagements: number[] = [];
    posts.forEach((p: any) => {
      const obj = p?.[platform];
      if (!obj) return;
      if (platform === "instagram") {
        const rate = obj.engagement_rate;
        if (rate != null) engagements.push(rate);
      } else {
        const views = obj.views ?? 0;
        const likes = obj.likes ?? 0;
        const comments = obj.comments ?? 0;
        if (views > 0) {
          engagements.push(((likes + comments * 2) / views) * 100);
        }
      }
    });
    if (engagements.length === 0) return null;
    return engagements.reduce((a, b) => a + b, 0) / engagements.length;
  };

  // Calculate posting frequency (days between posts)
  const calcFrequency = (platform: "tiktok" | "instagram") => {
    const dates = posts
      .map((p: any) => {
        const obj = p?.[platform];
        const dateStr = obj?.date_posted ?? obj?.posted_at ?? obj?.created_at;
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d.getTime();
      })
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    if (dates.length < 2) return null;
    const span = dates[dates.length - 1] - dates[0];
    return span / ((dates.length - 1) * 86400000);
  };

  const tiktokViews = calcAvgViews("tiktok");
  const igViews = calcAvgViews("instagram");
  const tiktokEng = calcAvgEngagement("tiktok");
  const igEng = calcAvgEngagement("instagram");
  const tiktokFreq = calcFrequency("tiktok");
  const igFreq = calcFrequency("instagram");

  type Row = {
    metric: string;
    tk: string;
    ig: string;
    tkWin: boolean;
    igWin: boolean;
  };
  const rows: Row[] = [];

  if (tiktokViews != null || igViews != null) {
    rows.push({
      metric: "Avg Views",
      tk: fmtNum(tiktokViews),
      ig: fmtNum(igViews),
      tkWin: (tiktokViews ?? 0) > (igViews ?? 0),
      igWin: (igViews ?? 0) > (tiktokViews ?? 0),
    });
  }
  if (tiktokEng != null || igEng != null) {
    rows.push({
      metric: "Avg Engagement",
      tk: tiktokEng != null ? `${tiktokEng.toFixed(1)}%` : "—",
      ig: igEng != null ? `${igEng.toFixed(1)}%` : "—",
      tkWin: (tiktokEng ?? 0) > (igEng ?? 0),
      igWin: (igEng ?? 0) > (tiktokEng ?? 0),
    });
  }
  if (tiktokFreq != null || igFreq != null) {
    rows.push({
      metric: "Posting Frequency",
      tk: tiktokFreq != null ? `Every ${Math.round(tiktokFreq)}d` : "—",
      ig: igFreq != null ? `Every ${Math.round(igFreq)}d` : "—",
      // Lower frequency = more frequent = better
      tkWin: tiktokFreq != null && igFreq != null && tiktokFreq < igFreq,
      igWin: igFreq != null && tiktokFreq != null && igFreq < tiktokFreq,
    });
  }

  if (rows.length === 0) return null;

  const tkWins = rows.filter((r) => r.tkWin).length;
  const igWins = rows.filter((r) => r.igWin).length;
  const winner =
    tkWins > igWins ? "TikTok" : igWins > tkWins ? "Instagram" : null;

  return (
    <Section title="TikTok vs Instagram">
      {winner && (
        <p className="text-xs text-muted-foreground mb-3">
          <span className="font-medium text-foreground">{winner}</span>{" "}
          outperforms on {Math.max(tkWins, igWins)} of {rows.length} metrics
        </p>
      )}

      <div className="rounded-lg bg-muted/30 border border-border/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                Metric
              </th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">
                📱 TikTok
              </th>
              <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground">
                📷 Instagram
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.metric}
                className="border-b border-border/30 last:border-0"
              >
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {r.metric}
                </td>
                <td
                  className={cn(
                    "py-2.5 px-3 text-center text-xs",
                    r.tkWin
                      ? "text-green-500 font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {r.tk}
                </td>
                <td
                  className={cn(
                    "py-2.5 px-3 text-center text-xs",
                    r.igWin
                      ? "text-green-500 font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {r.ig}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground/60 mt-2">
        Based on {posts.length} matched cross-posts
      </p>
    </Section>
  );
}

// ── Main Wrapper ───────────────────────────────────────────────────────────────

export function ArtistDeepSections({ data }: { data: DeepResearchData }) {
  const { contentAnalysis, brandDocument, crossPlatform } = data;

  const hasAny = contentAnalysis || brandDocument || crossPlatform;
  if (!hasAny) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ContentXRay
        brandDocument={brandDocument}
        contentAnalysis={contentAnalysis}
      />
      <BestWorstPerformers contentAnalysis={contentAnalysis} />
      <PlatformComparison crossPlatform={crossPlatform} />
    </div>
  );
}
