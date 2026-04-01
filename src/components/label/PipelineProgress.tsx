import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PHASES = [
  { key: "tiktok_status", abbr: "TT", label: "TikTok Scrape" },
  { key: "spotify_status", abbr: "SP", label: "Spotify Lookup" },
  { key: "instagram_status", abbr: "IG", label: "Instagram Scrape" },
  { key: "deep_research_status", abbr: "DR", label: "Deep Research" },
  { key: "content_analysis_status", abbr: "AN", label: "Content Analysis" },
  { key: "comments_status", abbr: "CM", label: "Comments Analysis" },
  { key: "synthesis_status", abbr: "SY", label: "Opus Synthesis" },
  { key: "deliverable_status", abbr: "CP", label: "Content Plan" },
] as const;

type PhaseStatus = "pending" | "running" | "completed" | "failed";

interface PipelineProgressProps {
  artistHandle: string;
  onComplete?: (metrics: {
    tiktok_followers?: number | null;
    avg_views?: number | null;
    median_views?: number | null;
    avg_engagement?: number | null;
    avg_saves?: number | null;
  }) => void;
}

const DOT_SIZE = 14;
const GAP = 4;

export default function PipelineProgress({
  artistHandle,
  onComplete,
}: PipelineProgressProps) {
  const [statuses, setStatuses] = useState<Record<string, PhaseStatus> | null>(
    null,
  );
  const [notFound, setNotFound] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;

    const poll = async () => {
      if (completedRef.current) return;

      const { data, error } = await supabase
        .from("deep_research_jobs" as any)
        .select(PHASES.map((p) => p.key).join(", "))
        .eq("artist_handle", artistHandle)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setNotFound(false);
      const row = data as unknown as Record<string, string>;
      const map: Record<string, PhaseStatus> = {};
      for (const p of PHASES) {
        map[p.key] = (row[p.key] as PhaseStatus) || "pending";
      }
      setStatuses(map);

      const allDone = PHASES.every((p) => map[p.key] === "completed");
      if (allDone || map["synthesis_status"] === "completed") {
        completedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);

        const { data: profile } = await supabase
          .from("profile_tiktok" as any)
          .select("avg_views, median_views, avg_engagement, avg_saves")
          .eq("handle", artistHandle)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const p = profile as any;
        onComplete?.({
          avg_views: p?.avg_views ?? null,
          median_views: p?.median_views ?? null,
          avg_engagement: p?.avg_engagement ?? null,
          avg_saves: p?.avg_saves ?? null,
        });
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 15_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [artistHandle, onComplete]);

  if (notFound && !statuses) {
    return (
      <span
        className="font-['DM_Sans'] text-xs font-medium animate-pulse"
        style={{ color: "var(--accent)" }}
      >
        Starting…
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-start gap-0" style={{ minWidth: 200 }}>
        {PHASES.map((phase, i) => {
          const status = statuses?.[phase.key] || "pending";
          const isLast = i === PHASES.length - 1;

          const dotColor =
            status === "completed"
              ? "var(--green)"
              : status === "running"
                ? "var(--accent)"
                : status === "failed"
                  ? "var(--red)"
                  : "var(--ink-faint)";

          return (
            <div key={phase.key} className="flex items-start">
              {/* Step: circle + label */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex flex-col items-center"
                    style={{ width: 22 }}
                  >
                    <div
                      className={`rounded-full flex-shrink-0 ${status === "running" ? "animate-pulse" : ""}`}
                      style={{
                        width: DOT_SIZE,
                        height: DOT_SIZE,
                        background: dotColor,
                        opacity: status === "pending" ? 0.35 : 1,
                        transition: "background 0.3s, opacity 0.3s",
                      }}
                    />
                    <span
                      className="font-['JetBrains_Mono'] leading-none mt-1"
                      style={{
                        fontSize: 8,
                        color:
                          status === "pending" ? "var(--ink-faint)" : dotColor,
                        fontWeight: status === "running" ? 700 : 500,
                        opacity: status === "pending" ? 0.5 : 1,
                      }}
                    >
                      {phase.abbr}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {phase.label} — {status}
                </TooltipContent>
              </Tooltip>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex items-center" style={{ height: DOT_SIZE }}>
                  <div
                    style={{
                      width: GAP + 2,
                      height: 2,
                      background:
                        status === "completed"
                          ? "var(--green)"
                          : "var(--ink-faint)",
                      opacity: status === "completed" ? 0.6 : 0.2,
                      borderRadius: 1,
                      transition: "background 0.3s, opacity 0.3s",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
