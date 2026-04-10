import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { SongUGC } from "@/data/contentDashboardHelpers";
import { fmtViews } from "@/data/contentDashboardHelpers";
import InfoPopover from "@/components/sound-intelligence/InfoPopover";
import { supabase } from "@/integrations/supabase/client";

const STATUS_STYLE: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  viral: { label: "VIRAL", color: "#FF453A", bg: "rgba(255,69,58,0.10)" },
  trending: {
    label: "TRENDING",
    color: "#FF9F0A",
    bg: "rgba(255,159,10,0.10)",
  },
  active: { label: "ACTIVE", color: "#30D158", bg: "rgba(48,209,88,0.10)" },
  established: {
    label: "ESTABLISHED",
    color: "#0A84FF",
    bg: "rgba(10,132,255,0.10)",
  },
  emerging: {
    label: "EMERGING",
    color: "#BF5AF2",
    bg: "rgba(191,90,242,0.10)",
  },
};

const GAP_LABELS: Record<string, { label: string; color: string }> = {
  tiktok_hot_spotify_cold: {
    label: "TikTok hot, Spotify cold",
    color: "#FF9F0A",
  },
  spotify_hot_tiktok_cold: {
    label: "Spotify hot, TikTok cold",
    color: "#0A84FF",
  },
  both_hot: { label: "Both platforms hot", color: "#30D158" },
};

export default function SoundPerformanceSection({
  songs,
}: {
  songs: SongUGC[];
}) {
  const navigate = useNavigate();
  const [navigatingIdx, setNavigatingIdx] = useState<number | null>(null);

  const handleRowClick = useCallback(
    async (song: SongUGC, idx: number) => {
      if (!song.tiktok_music_id) {
        // No music ID — go to sound intelligence overview
        navigate("/label/sound-intelligence");
        return;
      }

      setNavigatingIdx(idx);
      try {
        // Look up a completed sound_intelligence_jobs entry by sound_id
        const { data } = await supabase
          .from("sound_intelligence_jobs")
          .select("id")
          .eq("sound_id", song.tiktok_music_id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.id) {
          navigate(`/label/sound-intelligence/${data.id}`);
        } else {
          // No analysis exists yet — go to overview
          navigate("/label/sound-intelligence");
        }
      } catch {
        navigate("/label/sound-intelligence");
      } finally {
        setNavigatingIdx(null);
      }
    },
    [navigate],
  );

  if (songs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <h2
          className="text-[10px] font-semibold tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          Sound Performance on TikTok
        </h2>
        <InfoPopover
          text="How your catalog sounds perform on TikTok. Viral = explosive growth. Trending = strong upward momentum. Active = steady usage. Established = consistent baseline. Emerging = early traction. Cross-platform gaps show where TikTok buzz hasn't converted to Spotify streams (or vice versa)."
          width={340}
        />
      </div>

      <div
        className="rounded-xl border border-white/[0.06] overflow-hidden"
        style={{ background: "#1C1C1E" }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className="text-left pl-4 pr-2 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-white/30">
                Song
              </th>
              <th className="px-2 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase text-white/30">
                Status
              </th>
              <th className="px-2 py-2.5 text-right text-[10px] font-semibold tracking-wider uppercase text-white/30 hidden md:table-cell">
                Videos
              </th>
              <th className="px-2 py-2.5 text-right text-[10px] font-semibold tracking-wider uppercase text-white/30 hidden lg:table-cell">
                Creators
              </th>
              <th className="pl-2 pr-4 py-2.5 text-right text-[10px] font-semibold tracking-wider uppercase text-white/30">
                Plays
              </th>
            </tr>
          </thead>
          <tbody>
            {songs.slice(0, 10).map((song, i) => {
              const status =
                STATUS_STYLE[song.tiktok_status || ""] || STATUS_STYLE.active;
              const gap = song.cross_platform_gap
                ? GAP_LABELS[song.cross_platform_gap]
                : null;
              const isNavigating = navigatingIdx === i;

              return (
                <tr
                  key={`${song.song_name}-${i}`}
                  className="transition-colors hover:bg-white/[0.04] cursor-pointer group"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  onClick={() => handleRowClick(song, i)}
                >
                  {/* Song name */}
                  <td className="pl-4 pr-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium text-white/87 leading-tight truncate max-w-[240px] group-hover:text-[#e8430a] transition-colors">
                        {song.song_name}
                      </p>
                      <ExternalLink
                        size={11}
                        className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity"
                      />
                      {isNavigating && (
                        <span className="shrink-0 w-3 h-3 rounded-full border-2 border-white/30 border-t-[#e8430a] animate-spin" />
                      )}
                    </div>
                    {gap && (
                      <p
                        className="text-[10px] leading-tight mt-0.5"
                        style={{ color: gap.color }}
                      >
                        {gap.label}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-2 py-2.5">
                    <span
                      className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.label}
                    </span>
                  </td>

                  {/* Videos */}
                  <td className="px-2 py-2.5 text-right hidden md:table-cell">
                    <span className="text-[12px] text-white/70 tabular-nums">
                      {song.tiktok_video_count.toLocaleString()}
                    </span>
                    {song.videos_last_7d != null && song.videos_last_7d > 0 && (
                      <span className="text-[10px] text-green-400 ml-1 tabular-nums">
                        +{song.videos_last_7d}/wk
                      </span>
                    )}
                  </td>

                  {/* Creators */}
                  <td className="px-2 py-2.5 text-right hidden lg:table-cell">
                    <span className="text-[12px] text-white/60 tabular-nums">
                      {song.unique_creators.toLocaleString()}
                    </span>
                  </td>

                  {/* Total plays */}
                  <td className="pl-2 pr-4 py-2.5 text-right">
                    <span className="text-[13px] font-medium text-white/87 tabular-nums">
                      {fmtViews(song.total_tiktok_plays)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {songs.length === 0 && (
          <div className="py-8 text-center text-[13px] text-white/30">
            No sound data available yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}
