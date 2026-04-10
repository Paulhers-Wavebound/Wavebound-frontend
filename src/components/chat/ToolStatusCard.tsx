import React from "react";
import { Check, Search } from "lucide-react";

export interface ToolStatus {
  tool: string;
  status: "searching" | "processing" | "done";
  timestamp: number;
}

interface ToolStatusCardProps {
  toolStatus: ToolStatus;
}

interface ToolMeta {
  searching: string;
  processing: string;
  done: string;
}

const TOOL_META: Record<string, ToolMeta> = {
  search_roster: {
    searching: "Searching roster metrics…",
    processing: "Analyzing roster data…",
    done: "Roster metrics loaded",
  },
  search_artist: {
    searching: "Searching artist knowledge base…",
    processing: "Analyzing artist data…",
    done: "Artist data loaded",
  },
  search_all_artists: {
    searching: "Searching across all artists…",
    processing: "Cross-referencing roster data…",
    done: "Cross-roster search complete",
  },
  search_videos: {
    searching: "Searching viral video trends…",
    processing: "Ranking top results…",
    done: "Found viral matches",
  },
  search_sounds: {
    searching: "Searching sound intelligence…",
    processing: "Analyzing sound data…",
    done: "Sound data loaded",
  },
  get_alerts: {
    searching: "Checking recent alerts…",
    processing: "Processing alert data…",
    done: "Alerts loaded",
  },
  web_search: {
    searching: "Searching the web…",
    processing: "Processing web results…",
    done: "Web search complete",
  },
  search_artist_data: {
    searching: "Searching your content data…",
    processing: "Analyzing content patterns…",
    done: "Analyzed content patterns",
  },
  scrape_tiktok_profile: {
    searching: "Analysing TikTok profile…",
    processing: "Processing profile data…",
    done: "TikTok profile loaded",
  },
  scrape_tiktok_videos: {
    searching: "Analysing TikTok videos…",
    processing: "Processing video metrics…",
    done: "TikTok videos loaded",
  },
  scrape_instagram_profile: {
    searching: "Analysing Instagram profile…",
    processing: "Processing profile data…",
    done: "Instagram profile loaded",
  },
  analyze_videos: {
    searching: "Analyzing video content…",
    processing: "Running AI content analysis…",
    done: "Video analysis complete",
  },
  scrape_spotify_artist: {
    searching: "Pulling Spotify data…",
    processing: "Processing Spotify profile…",
    done: "Spotify data loaded",
  },
  search_tiktok: {
    searching: "Scouting TikTok creators…",
    processing: "Running AI quality filters…",
    done: "Creator search complete",
  },
};

export const SOURCE_LABELS: Record<string, string> = {
  search_roster: "Roster Data",
  search_artist: "Artist KB",
  search_all_artists: "Artist KB",
  search_videos: "Viral DB",
  search_sounds: "Sound Intel",
  get_alerts: "Alerts",
  web_search: "Web",
  scrape_tiktok_profile: "Live TikTok",
  scrape_tiktok_videos: "Live TikTok",
  scrape_instagram_profile: "Live Instagram",
  analyze_videos: "AI Analysis",
  scrape_spotify_artist: "Live Spotify",
  search_tiktok: "TikTok Scout",
};

const getToolLabel = (tool: string, status: string): string => {
  const meta = TOOL_META[tool];
  if (meta) return meta[status as keyof ToolMeta] || meta.searching;
  return `${status.charAt(0).toUpperCase() + status.slice(1)} ${tool.replace(/_/g, " ")}…`;
};

const ToolStatusCard: React.FC<ToolStatusCardProps> = ({ toolStatus }) => {
  const { tool, status } = toolStatus;
  const label = getToolLabel(tool, status);
  const isDone = status === "done";

  return (
    <div
      className="flex items-center gap-2 py-0.5 font-mono text-[13px] leading-6"
      style={{
        color: isDone ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.4)",
      }}
    >
      {isDone ? (
        <Check
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: "rgba(52,211,153,0.6)" }}
        />
      ) : (
        <Search className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="flex-1 truncate">{label}</span>
      {!isDone && (
        <div
          className="w-3.5 h-3.5 shrink-0 border-2 border-white/10 border-t-white/40 rounded-full animate-spin"
          style={{ animationDuration: "0.8s" }}
        />
      )}
    </div>
  );
};

export default ToolStatusCard;
