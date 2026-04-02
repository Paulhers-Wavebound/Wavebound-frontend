import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { callAdminOnboarding } from "@/utils/adminOnboarding";
import BrandDocumentEditor from "@/components/admin/BrandDocumentEditor";
import IntelReportEditor from "@/components/admin/IntelReportEditor";
import ThirtyDayPlanEditor from "@/components/admin/ThirtyDayPlanEditor";
import GifStrip from "@/components/admin/GifStrip";
import GifPickerModal from "@/components/admin/GifPickerModal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchPlanVariants,
  fetchContentPool,
  removeGif,
  restoreGif,
  swapSource,
} from "@/utils/planVariantsApi";
import type {
  PlanVariantsResponse,
  ContentPoolResponse,
  PlanType,
} from "@/utils/planVariantsApi";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Edit3,
  RefreshCw,
  ChevronDown,
  X,
  Plus,
  FileText,
  AlertTriangle,
  Check,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

/* ── Types ── */
interface ArtistJob {
  artist_handle: string;
  artist_name: string | null;
  label_id: string | null;
  status: string;
}

interface Idea {
  title: string;
  pitch: string;
  format: string;
  source_type: string;
  effort: string;
  why_this_week: string;
  script: string;
  hooks: string[];
  cta: string;
  caption: string;
  shot_list: string[];
  fallback_15min: string;
  evidence: string;
  [key: string]: any;
}

interface CalendarDay {
  day: string;
  selected_idea: string;
  post_time: string;
  title?: string;
  effort?: string;
  [key: string]: any;
}

interface ContentPlan {
  header: {
    objective: string;
    week_of: string;
    artist_name: string;
    label_name: string;
    [k: string]: any;
  };
  calendar: CalendarDay[];
  ideas_all: Record<string, Idea>;
  ideas?: Idea[];
  do_not_post: { directive: string; reason: string }[];
  brand_guardrails: { is: string[]; isnt: string[] };
  comment_strategy: {
    trigger: string;
    reply: string;
    example_reply?: string;
  }[];
  taste_pick: { title: string; description: string };
  [k: string]: any;
}

type EditStatus = "untouched" | "unsaved" | "saved";
type SubTab = "7day" | "intel" | "30day" | "brief";

const SOURCE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  proven: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  adapted: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  trending: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  original: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
};

const EFFORT_COLORS: Record<string, string> = {
  "15 min": "bg-green-400",
  "1 hour": "bg-yellow-400",
  "Half-day": "bg-orange-400",
};

function dayGroupLabel(key: string): string {
  const prefix = key.slice(0, 3);
  const suffix = key.slice(4);
  const dayMap: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };
  const optMap: Record<string, string> = {
    a: "Option A",
    b: "Option B",
    c: "Option C",
  };
  return `${dayMap[prefix] || prefix} — ${optMap[suffix] || suffix}`;
}

async function buildGifMap(handle: string): Promise<Record<number, string>> {
  const { data } = await supabase.storage
    .from("gifs")
    .list(handle + "/", { limit: 200 });
  if (!data) return {};
  const map: Record<number, string> = {};
  const tsMap: Record<number, number> = {};
  for (const file of data) {
    const match = file.name.match(/^v(\d+)_(\d+)\.gif$/);
    if (!match) continue;
    const idx = parseInt(match[1]);
    const ts = parseInt(match[2]);
    if (!tsMap[idx] || ts > tsMap[idx]) {
      tsMap[idx] = ts;
      map[idx] =
        `https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/gifs/${handle}/${file.name}`;
    }
  }
  return map;
}

/** Build a map of video index → original TikTok URL from DB data */
function buildVideoUrlMap(
  rawVideos: { video_url?: string }[] | null,
  ragInspiration: { video_url?: string }[] | null,
): Record<number, string> {
  const map: Record<number, string> = {};
  if (rawVideos) {
    rawVideos.forEach((v, i) => {
      if (v.video_url) map[i] = v.video_url;
    });
  }
  if (ragInspiration) {
    ragInspiration.forEach((v, i) => {
      if (v.video_url) map[1000 + i + 1] = v.video_url;
    });
  }
  return map;
}

interface GifWithUrl {
  gif: string;
  videoUrl: string | null;
}

function getIdeaGifs(
  source: string,
  gifMap: Record<number, string>,
  videoUrlMap: Record<number, string>,
): GifWithUrl[] {
  const results: GifWithUrl[] = [];
  for (const m of source.matchAll(/Ref\s*#(\d+)/gi)) {
    const idx = parseInt(m[1]) - 1;
    const gif = gifMap[idx];
    if (gif) results.push({ gif, videoUrl: videoUrlMap[idx] || null });
  }
  for (const m of source.matchAll(/Niche\s*#(\d+)/gi)) {
    const idx = 1000 + parseInt(m[1]);
    const gif = gifMap[idx];
    if (gif) results.push({ gif, videoUrl: videoUrlMap[idx] || null });
  }
  return results;
}

function SourceBadge({ source }: { source: string }) {
  const c = SOURCE_COLORS[source] || SOURCE_COLORS.original;
  return (
    <Badge className={`${c.bg} ${c.text} ${c.border} text-[10px] px-1.5 py-0`}>
      {source}
    </Badge>
  );
}

function SwapCard({
  ideaKey,
  idea,
  onSwap,
  gifMap,
  videoUrlMap,
}: {
  ideaKey: string;
  idea: Idea;
  onSwap: () => void;
  gifMap: Record<number, string>;
  videoUrlMap: Record<number, string>;
}) {
  const [showShots, setShowShots] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [showMoreHooks, setShowMoreHooks] = useState(false);
  const gifs = getIdeaGifs(idea.source || "", gifMap, videoUrlMap);
  const hooks = Array.isArray(idea.hooks) ? idea.hooks : [];
  const shotList = Array.isArray(idea.shot_list) ? idea.shot_list : [];

  // Parse multiplier/handle from source refs for overlay captions
  function parseRefCaptions(source: string): { label: string; stat: string }[] {
    const captions: { label: string; stat: string }[] = [];
    const refPattern = /Ref\s*#(\d+)\s*\(([^)]*)\)/gi;
    const nichePattern = /Niche\s*#(\d+)\s*\(([^)]*)\)/gi;
    for (const m of source.matchAll(refPattern)) {
      const parts = m[2].split(",").map((s) => s.trim());
      captions.push({
        label: parts[0] || `Ref #${m[1]}`,
        stat: parts[1] || "",
      });
    }
    for (const m of source.matchAll(nichePattern)) {
      const parts = m[2].split(",").map((s) => s.trim());
      captions.push({
        label: parts[0] || `Niche #${m[1]}`,
        stat: parts[1] || "",
      });
    }
    return captions;
  }
  const refCaptions = parseRefCaptions(idea.source || "");

  const pillBtn = (label: string, active: boolean, toggle: () => void) => (
    <button
      onClick={toggle}
      className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-colors ${active ? "bg-[#2A2A2E] text-amber-400" : "bg-[#2A2A2E] text-[#a8a29e] hover:text-[#ede8dc]"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-[#1A1A1C] rounded-xl p-5 border border-[#2A2A2E] space-y-4">
      {/* 1. GIF Reference Row — clickable to source video */}
      {gifs.length > 0 && (
        <div className="flex gap-2">
          {gifs.map((item, i) => {
            const inner = (
              <div
                className="relative rounded-[10px] overflow-hidden"
                style={{ maxWidth: gifs.length === 1 ? "60%" : "50%" }}
              >
                <img
                  src={item.gif}
                  alt=""
                  className="h-[160px] w-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 flex items-end justify-between">
                  <span className="text-[10px] text-[#ede8dc]/80 truncate max-w-[60%]">
                    {refCaptions[i]?.label || ""}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-400">
                    {refCaptions[i]?.stat || ""}
                  </span>
                </div>
              </div>
            );
            return item.videoUrl ? (
              <a
                key={i}
                href={item.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {inner}
              </a>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      )}

      {/* 2. Title + Select */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-bold text-lg text-[#ede8dc] leading-snug">
          {idea.title}
        </h4>
        <Button
          onClick={onSwap}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex-shrink-0 mt-0.5"
        >
          Select
        </Button>
      </div>

      {/* 3. Metadata Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-[#a8a29e]">{idea.format}</span>
        <SourceBadge source={idea.source_type || "original"} />
        <EffortDot effort={idea.effort || "—"} />
        <span className="text-[10px] text-[#a8a29e]/60 ml-auto">
          {dayGroupLabel(ideaKey)}
        </span>
      </div>

      {/* 4. Pitch */}
      {idea.pitch && (
        <p className="text-sm text-[#a8a29e] italic">{idea.pitch}</p>
      )}

      {/* 5. Script Preview */}
      {idea.script && (
        <div className="bg-[#141414] rounded-lg p-3 text-xs text-[#ede8dc]/90 whitespace-pre-wrap leading-relaxed">
          {idea.script}
        </div>
      )}

      {/* 6. Hook Section */}
      {hooks.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest text-[#888] font-medium">
            Pick your hook:
          </span>
          <div className="bg-[#1E1E1E] rounded-lg p-2.5 text-xs text-[#ede8dc]/90">
            {hooks[0]}
          </div>
          {hooks.length > 1 && (
            <>
              <button
                onClick={() => setShowMoreHooks(!showMoreHooks)}
                className="text-[11px] text-amber-500/70 hover:text-amber-400 flex items-center gap-1"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showMoreHooks ? "rotate-180" : ""}`}
                />
                {showMoreHooks
                  ? "Hide"
                  : `${hooks.length - 1} more hook${hooks.length > 2 ? "s" : ""}`}
              </button>
              {showMoreHooks &&
                hooks.slice(1).map((h, i) => (
                  <div
                    key={i}
                    className="bg-[#1E1E1E] rounded-lg p-2.5 text-xs text-[#ede8dc]/90"
                  >
                    {h}
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {/* 7. Action Pills */}
      <div className="flex gap-2 flex-wrap">
        {shotList.length > 0 &&
          pillBtn("Shot List", showShots, () => setShowShots(!showShots))}
        {idea.caption &&
          pillBtn("Caption", showCaption, () => setShowCaption(!showCaption))}
        {idea.why_this_week &&
          pillBtn("Why This Works", showWhy, () => setShowWhy(!showWhy))}
        {pillBtn("Full Brief", showFull, () => setShowFull(!showFull))}
      </div>

      {/* Expandable sections */}
      {showShots && shotList.length > 0 && (
        <div className="bg-[#141414] rounded-lg p-3 text-xs text-[#ede8dc]/80 space-y-1">
          {shotList.map((s, i) => (
            <div key={i}>
              <span className="text-amber-500/70 mr-1.5">{i + 1}.</span>
              {s}
            </div>
          ))}
        </div>
      )}
      {showCaption && idea.caption && (
        <div className="bg-[#141414] rounded-lg p-3 text-xs text-[#ede8dc]/80 whitespace-pre-wrap">
          {idea.caption}
        </div>
      )}
      {showWhy && idea.why_this_week && (
        <div className="bg-[#141414] rounded-lg p-3 text-xs text-[#ede8dc]/80">
          {idea.why_this_week}
        </div>
      )}
      {showFull && (
        <div className="bg-[#141414] rounded-lg p-3 text-xs text-[#ede8dc]/80 space-y-2">
          {idea.cta && (
            <div>
              <span className="text-[#888] uppercase text-[10px] tracking-wider">
                CTA:
              </span>{" "}
              {idea.cta}
            </div>
          )}
          {idea.fallback_15min && (
            <div>
              <span className="text-[#888] uppercase text-[10px] tracking-wider">
                15-min fallback:
              </span>{" "}
              {idea.fallback_15min}
            </div>
          )}
          {idea.platform_adaptations && (
            <div>
              <span className="text-[#888] uppercase text-[10px] tracking-wider">
                Platform:
              </span>{" "}
              {typeof idea.platform_adaptations === "string"
                ? idea.platform_adaptations
                : JSON.stringify(idea.platform_adaptations)}
            </div>
          )}
          {idea.evidence && (
            <div>
              <span className="text-[#888] uppercase text-[10px] tracking-wider">
                Evidence:
              </span>{" "}
              {idea.evidence}
            </div>
          )}
        </div>
      )}

      {/* 8. Source & Evidence Footer */}
      <div className="space-y-1 pt-1 border-t border-[#2A2A2E]/50">
        {idea.source && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#888]">
              Source{" "}
            </span>
            <span className="text-[10px] font-mono text-[#a8a29e]/70">
              {idea.source}
            </span>
          </div>
        )}
        {idea.evidence && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#888]">
              Evidence{" "}
            </span>
            <span className="text-[10px] font-mono text-[#a8a29e]/70">
              {idea.evidence}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
function EffortDot({ effort }: { effort: string }) {
  const color = EFFORT_COLORS[effort] || "bg-gray-400";
  return (
    <span className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {effort}
    </span>
  );
}

/* ── Pill / Chip Editor ── */
function PillEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map((it, i) => (
        <span
          key={i}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2A2A2E] text-[#ede8dc] text-xs"
        >
          {it}
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="hover:text-red-400"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && input.trim()) {
            e.preventDefault();
            onChange([...items, input.trim()]);
            setInput("");
          }
        }}
        placeholder={placeholder}
        className="w-32 h-6 text-xs bg-transparent border-[#2A2A2E] text-[#ede8dc] placeholder:text-[#a8a29e]/60"
      />
    </div>
  );
}

/* ── Inline Idea Editor ── */
function IdeaEditor({
  idea,
  original,
  onChange,
}: {
  idea: Idea;
  original: Idea;
  onChange: (updated: Idea) => void;
}) {
  const modified = (field: string) =>
    JSON.stringify((idea as any)[field]) !==
    JSON.stringify((original as any)[field]);
  const borderClass = (field: string) =>
    modified(field) ? "border-l-[3px] border-l-amber-500 pl-2" : "";

  const update = (field: string, value: any) =>
    onChange({ ...idea, [field]: value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-[#1C1C1E] rounded-b-lg border border-t-0 border-[#2A2A2E]">
      <div className={borderClass("title")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Title
        </label>
        <Input
          defaultValue={idea.title}
          onBlur={(e) => update("title", e.target.value)}
          className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={borderClass("pitch")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Pitch
        </label>
        <Input
          defaultValue={idea.pitch}
          onBlur={(e) => update("pitch", e.target.value)}
          className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={borderClass("format")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Format
        </label>
        <Input
          defaultValue={idea.format}
          onBlur={(e) => update("format", e.target.value)}
          className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={borderClass("source_type")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Source Type
        </label>
        <Select
          value={idea.source_type}
          onValueChange={(v) => update("source_type", v)}
        >
          <SelectTrigger className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
            {["proven", "adapted", "trending", "original"].map((s) => (
              <SelectItem key={s} value={s} className="text-[#ede8dc] text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={borderClass("effort")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Effort
        </label>
        <Select value={idea.effort} onValueChange={(v) => update("effort", v)}>
          <SelectTrigger className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
            {["15 min", "1 hour", "Half-day"].map((s) => (
              <SelectItem key={s} value={s} className="text-[#ede8dc] text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={`col-span-full ${borderClass("why_this_week")}`}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Why This Works
        </label>
        <Textarea
          defaultValue={idea.why_this_week}
          onBlur={(e) => update("why_this_week", e.target.value)}
          className="min-h-[60px] text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={`col-span-full ${borderClass("script")}`}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Script
        </label>
        <Textarea
          defaultValue={idea.script}
          onBlur={(e) => update("script", e.target.value)}
          className="min-h-[100px] text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={`col-span-full ${borderClass("hooks")}`}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Hooks
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["Safe", "Bold", "Weird"].map((label, i) => (
            <div key={label}>
              <span className="text-[10px] text-[#a8a29e]">{label}</span>
              <Input
                defaultValue={idea.hooks?.[i] || ""}
                onBlur={(e) => {
                  const h = [...(idea.hooks || ["", "", ""])];
                  h[i] = e.target.value;
                  update("hooks", h);
                }}
                className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
              />
            </div>
          ))}
        </div>
      </div>
      <div className={borderClass("cta")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          CTA
        </label>
        <Input
          defaultValue={idea.cta}
          onBlur={(e) => update("cta", e.target.value)}
          className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={borderClass("evidence")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Evidence
        </label>
        <Input
          defaultValue={idea.evidence}
          onBlur={(e) => update("evidence", e.target.value)}
          className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={`col-span-full ${borderClass("caption")}`}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Caption
        </label>
        <Textarea
          defaultValue={idea.caption}
          onBlur={(e) => update("caption", e.target.value)}
          className="min-h-[60px] text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={borderClass("fallback_15min")}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Fallback (15 min)
        </label>
        <Input
          defaultValue={idea.fallback_15min}
          onBlur={(e) => update("fallback_15min", e.target.value)}
          className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
        />
      </div>
      <div className={`col-span-full ${borderClass("shot_list")}`}>
        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
          Shot List
        </label>
        <div className="space-y-1">
          {(idea.shot_list || []).map((shot, i) => (
            <div key={i} className="flex gap-1">
              <Input
                defaultValue={shot}
                onBlur={(e) => {
                  const sl = [...(idea.shot_list || [])];
                  sl[i] = e.target.value;
                  update("shot_list", sl);
                }}
                className="h-7 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] flex-1"
              />
              <button
                onClick={() =>
                  update(
                    "shot_list",
                    (idea.shot_list || []).filter((_, idx) => idx !== i),
                  )
                }
                className="text-[#a8a29e] hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => update("shot_list", [...(idea.shot_list || []), ""])}
            className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add shot
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── HTML Editor Sub-Tab ── */
function HtmlEditorTab({
  html,
  columnKey,
  artistHandle,
}: {
  html: string | null;
  columnKey: string;
  artistHandle: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(html || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(html || "");
    setEditing(false);
  }, [html, artistHandle]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("artist_intelligence")
        .update({ [columnKey]: draft })
        .eq("artist_handle", artistHandle);
      if (error) throw error;
      toast.success("Saved — changes are now live");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!html)
    return (
      <div className="flex items-center justify-center h-64 text-[#a8a29e] text-sm">
        Not generated yet
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 min-h-0 rounded-lg border border-[#2A2A2E] overflow-hidden"
        style={{ height: editing ? "50%" : "100%" }}
      >
        <iframe
          srcDoc={draft || html}
          className="w-full h-full bg-white"
          style={{ minHeight: editing ? "300px" : "calc(100vh - 280px)" }}
          title={columnKey}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      {!editing ? (
        <Button
          onClick={() => setEditing(true)}
          variant="outline"
          className="mt-3 self-start border-[#2A2A2E] text-[#ede8dc] bg-[#1C1C1E] hover:bg-[#2A2A2E]"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit HTML
        </Button>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-amber-500">
              Changes go live immediately when saved.
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-[300px] bg-[#0a0a0a] border border-[#2A2A2E] rounded-lg p-3 text-xs text-[#ede8dc] font-mono resize-y focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          <div className="flex gap-2">
            <Button
              onClick={save}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              onClick={() => {
                setDraft(html);
                setEditing(false);
              }}
              variant="ghost"
              className="text-[#a8a29e] text-xs hover:text-[#ede8dc]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function AdminEditTab() {
  const [artists, setArtists] = useState<ArtistJob[]>([]);
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("7day");
  const [editStatuses, setEditStatuses] = useState<Record<string, EditStatus>>(
    {},
  );

  // 7-day plan state
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const originalPlan = useRef<ContentPlan | null>(null);
  const [thirtyDayPlan, setThirtyDayPlan] = useState<any>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // HTML deliverables
  const [htmlDocs, setHtmlDocs] = useState<Record<string, string | null>>({});
  const [htmlLoading, setHtmlLoading] = useState(false);

  // UI state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [swapDayIndex, setSwapDayIndex] = useState<number | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [pendingHandle, setPendingHandle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewRefreshing, setPreviewRefreshing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [briefDirty, setBriefDirty] = useState(false);
  const [gifMap, setGifMap] = useState<Record<number, string>>({});
  const [videoUrlMap, setVideoUrlMap] = useState<Record<number, string>>({});

  // Plan variants & content pool state (new GIF management)
  const gifPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [planVariants, setPlanVariants] = useState<PlanVariantsResponse | null>(
    null,
  );
  const [contentPoolEnabled, setContentPoolEnabled] = useState(false);
  const { data: contentPool, isLoading: contentPoolLoading } = useQuery({
    queryKey: ["content-pool", selectedHandle],
    queryFn: () => fetchContentPool(selectedHandle!),
    enabled: contentPoolEnabled && !!selectedHandle,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const [gifMutating, setGifMutating] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [gifPickerSlot, setGifPickerSlot] = useState<{
    key: string;
    label: string;
    planType: PlanType;
  } | null>(null);

  // Load artists
  useEffect(() => {
    Promise.all([
      callAdminOnboarding("pipeline_status"),
      callAdminOnboarding("list_labels"),
    ])
      .then(([jobsData, labelsData]) => {
        const completed = (jobsData?.jobs || []).filter(
          (j: ArtistJob) => j.status === "completed",
        );
        setArtists(completed);
        const map: Record<string, string> = {};
        (labelsData?.labels || []).forEach((l: any) => {
          map[l.id] = l.name;
        });
        setLabelMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load data for selected artist
  useEffect(() => {
    if (!selectedHandle) {
      setPlan(null);
      setJobId(null);
      setHtmlDocs({});
      setGifMap({});
      setVideoUrlMap({});
      setPlanVariants(null);
      setContentPoolEnabled(false);
      if (gifPollRef.current) {
        clearInterval(gifPollRef.current);
        gifPollRef.current = null;
      }
      return;
    }
    // Stop any in-flight poll from a previous artist
    if (gifPollRef.current) {
      clearInterval(gifPollRef.current);
      gifPollRef.current = null;
    }
    setPlanLoading(true);
    setHtmlLoading(true);
    setExpandedRow(null);
    setLastSaved(null);
    setPreviewRefreshing(false);

    buildGifMap(selectedHandle)
      .then(setGifMap)
      .catch(() => setGifMap({}));

    // Fetch plan variants (includes GIF metadata, overrides, removed lists)
    fetchPlanVariants(selectedHandle)
      .then(setPlanVariants)
      .catch(() => setPlanVariants(null));

    supabase
      .from("deep_research_jobs")
      .select("content_plan, thirty_day_plan, id, tiktok_data")
      .eq("artist_handle", selectedHandle)
      .not("content_plan", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        if (data?.[0]) {
          const cp =
            typeof data[0].content_plan === "string"
              ? JSON.parse(data[0].content_plan)
              : data[0].content_plan;
          setPlan(JSON.parse(JSON.stringify(cp)));
          originalPlan.current = JSON.parse(JSON.stringify(cp));
          setJobId(data[0].id);
          setActiveJobId(data[0].id);
          const tdp = data[0].thirty_day_plan;
          setThirtyDayPlan(
            tdp ? (typeof tdp === "string" ? JSON.parse(tdp) : tdp) : null,
          );
          // Extract video URLs for Ref links (own TikTok videos)
          const rawVideos = data[0].tiktok_data?.raw_videos || [];
          setVideoUrlMap((prev) => {
            const merged = { ...prev };
            rawVideos.forEach((v: any, i: number) => {
              if (v.video_url) merged[i] = v.video_url;
            });
            return merged;
          });
        } else {
          setPlan(null);
          originalPlan.current = null;
          setJobId(null);
          setActiveJobId(null);
          setThirtyDayPlan(null);
        }
        setPlanLoading(false);
      })
      .catch(() => {
        setPlan(null);
        setPlanLoading(false);
      });

    supabase
      .from("artist_intelligence")
      .select(
        "intelligence_report_html, thirty_day_plan_html, artist_brief_html, content_plan_html, brand_document, rag_inspiration",
      )
      .eq("artist_handle", selectedHandle)
      .single()
      .then(({ data }: any) => {
        console.log(
          "content_plan_html length:",
          data?.content_plan_html?.length,
        );
        setHtmlDocs(data || {});
        setHtmlLoading(false);
        // Extract video URLs for Niche links (RAG inspiration)
        const rag = data?.rag_inspiration;
        if (Array.isArray(rag)) {
          setVideoUrlMap((prev) => {
            const merged = { ...prev };
            rag.forEach((v: any, i: number) => {
              if (v.video_url) merged[1000 + i + 1] = v.video_url;
            });
            return merged;
          });
        }
      })
      .catch(() => {
        setHtmlDocs({});
        setHtmlLoading(false);
      });
  }, [selectedHandle]);

  const hasUnsavedChanges = useMemo(() => {
    if (!plan || !originalPlan.current) return false;
    return JSON.stringify(plan) !== JSON.stringify(originalPlan.current);
  }, [plan]);

  useEffect(() => {
    if (!selectedHandle) return;
    if (hasUnsavedChanges) {
      setEditStatuses((prev) => ({ ...prev, [selectedHandle]: "unsaved" }));
    }
  }, [hasUnsavedChanges, selectedHandle]);

  const filtered = useMemo(() => {
    if (!search.trim()) return artists;
    const q = search.toLowerCase();
    return artists.filter(
      (j) =>
        (j.artist_name || "").toLowerCase().includes(q) ||
        j.artist_handle.toLowerCase().includes(q) ||
        (j.label_id && (labelMap[j.label_id] || "").toLowerCase().includes(q)),
    );
  }, [artists, search, labelMap]);

  const trySelectArtist = useCallback(
    (handle: string) => {
      if (handle === selectedHandle) return;
      if (hasUnsavedChanges) {
        setPendingHandle(handle);
        setDiscardDialogOpen(true);
      } else {
        setSelectedHandle(handle);
        setSubTab("7day");
      }
    },
    [selectedHandle, hasUnsavedChanges],
  );

  const confirmDiscard = () => {
    setDiscardDialogOpen(false);
    if (pendingHandle) {
      setSelectedHandle(pendingHandle);
      setSubTab("7day");
      setPendingHandle(null);
    }
  };

  // Resolved ideas for the schedule
  const scheduleRows = useMemo(() => {
    if (!plan?.calendar || !plan?.ideas_all) return [];
    return plan.calendar.map((day, i) => {
      const idea = plan.ideas_all[day.selected_idea] || ({} as Idea);
      return { day, idea, index: i, ideaKey: day.selected_idea };
    });
  }, [plan]);

  // Swap pool: ideas not currently selected
  const swapPool = useMemo(() => {
    if (!plan?.calendar || !plan?.ideas_all) return [];
    const selectedKeys = new Set(plan.calendar.map((d) => d.selected_idea));
    return Object.entries(plan.ideas_all)
      .filter(([key]) => !selectedKeys.has(key))
      .map(([key, idea]) => ({ key, idea: idea as Idea }));
  }, [plan]);

  const handleSwap = (dayIndex: number, newKey: string) => {
    if (!plan) return;
    const updated = JSON.parse(JSON.stringify(plan)) as ContentPlan;
    const newIdea = updated.ideas_all[newKey];
    updated.calendar[dayIndex].selected_idea = newKey;
    updated.calendar[dayIndex].title = newIdea?.title;
    updated.calendar[dayIndex].effort = newIdea?.effort;
    // Rebuild ideas array
    updated.ideas = updated.calendar.map((d, i) => ({
      ...updated.ideas_all[d.selected_idea],
      number: i + 1,
    }));
    setPlan(updated);
    setSwapDayIndex(null);
  };

  const handleIdeaEdit = (dayIndex: number, updatedIdea: Idea) => {
    if (!plan) return;
    const key = plan.calendar[dayIndex].selected_idea;
    const updated = { ...plan };
    updated.ideas_all = { ...updated.ideas_all, [key]: updatedIdea };
    // Also update calendar title/effort if changed
    updated.calendar = [...updated.calendar];
    updated.calendar[dayIndex] = {
      ...updated.calendar[dayIndex],
      title: updatedIdea.title,
      effort: updatedIdea.effort,
    };
    // Rebuild ideas array
    updated.ideas = updated.calendar.map((d, i) => ({
      ...updated.ideas_all[d.selected_idea],
      number: i + 1,
    }));
    setPlan(updated);
  };

  const handlePlanFieldUpdate = (path: string, value: any) => {
    if (!plan) return;
    const updated = JSON.parse(JSON.stringify(plan)) as ContentPlan;
    const parts = path.split(".");
    let obj: any = updated;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
    setPlan(updated);
  };

  const saveDraft = async () => {
    if (!plan || !jobId || !selectedHandle) return;
    setSaving(true);
    try {
      // Rebuild ideas array from calendar
      const finalPlan = JSON.parse(JSON.stringify(plan)) as ContentPlan;
      finalPlan.ideas = finalPlan.calendar.map((d, i) => ({
        ...finalPlan.ideas_all[d.selected_idea],
        number: i + 1,
      }));

      const { error } = await supabase
        .from("deep_research_jobs")
        .update({ content_plan: finalPlan })
        .eq("id", jobId);
      if (error) throw error;

      originalPlan.current = JSON.parse(JSON.stringify(finalPlan));
      setPlan(finalPlan);
      setLastSaved(new Date());
      setEditStatuses((prev) => ({ ...prev, [selectedHandle]: "saved" }));
      toast.success("Draft saved");
    } catch (err: any) {
      toast.error("Save failed: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const saveAndRerender = async () => {
    await saveDraft();
    if (!jobId || !selectedHandle) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/trigger-webhook",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + session?.access_token,
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY",
          },
          body: JSON.stringify({
            webhook: "wf11-render-plan",
            payload: { job_id: jobId, artist_handle: selectedHandle },
          }),
        },
      );
      if (!res.ok) throw new Error("Non-2xx");
      toast.success(
        "Saved & re-rendering plan… HTML will update in ~30 seconds",
      );
      // Poll for updated HTML every 10s, up to ~90s
      setPreviewRefreshing(true);
      const currentHtml = htmlDocs.content_plan_html;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const { data } = await supabase
            .from("artist_intelligence")
            .select("content_plan_html")
            .eq("artist_handle", selectedHandle)
            .single();
          if (
            data?.content_plan_html &&
            data.content_plan_html !== currentHtml
          ) {
            clearInterval(poll);
            setHtmlDocs((prev) => ({
              ...prev,
              content_plan_html: data.content_plan_html,
            }));
            setPreviewKey((k) => k + 1);
            setPreviewRefreshing(false);
            toast.success("Preview updated");
          } else if (attempts >= 9) {
            clearInterval(poll);
            setPreviewRefreshing(false);
            toast.info(
              "Render may still be in progress — refresh manually if needed",
            );
          }
        } catch {
          clearInterval(poll);
          setPreviewRefreshing(false);
        }
      }, 10000);
    } catch {
      toast.error(
        "Plan saved but re-render failed. Try again or contact engineering.",
      );
    }
  };

  const discardChanges = () => {
    if (!originalPlan.current || !selectedHandle) return;
    setPlan(JSON.parse(JSON.stringify(originalPlan.current)));
    setEditStatuses((prev) => ({
      ...prev,
      [selectedHandle]:
        prev[selectedHandle] === "saved" ? "saved" : "untouched",
    }));
  };

  /* ── GIF management handlers ── */

  const loadContentPool = useCallback(() => {
    setContentPoolEnabled(true);
  }, []);

  /** Poll for updated HTML after a mutation triggers a server-side re-render */
  const pollForHtmlUpdate = useCallback(
    (htmlKey: "content_plan_html" | "thirty_day_plan_html") => {
      if (!selectedHandle) return;
      // Clean up any existing poll before starting a new one
      if (gifPollRef.current) clearInterval(gifPollRef.current);
      setPreviewRefreshing(true);
      const baseline = htmlDocs[htmlKey];
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const { data } = await supabase
            .from("artist_intelligence")
            .select(htmlKey)
            .eq("artist_handle", selectedHandle)
            .single();
          const newHtml = data?.[htmlKey];
          if (newHtml && newHtml !== baseline) {
            clearInterval(poll);
            gifPollRef.current = null;
            setHtmlDocs((prev) => ({ ...prev, [htmlKey]: newHtml }));
            setPreviewKey((k) => k + 1);
            setPreviewRefreshing(false);
            toast.success("Preview updated");
          } else if (attempts >= 9) {
            clearInterval(poll);
            gifPollRef.current = null;
            setPreviewRefreshing(false);
            toast.info(
              "Render may still be in progress — refresh manually if needed",
            );
          }
        } catch {
          clearInterval(poll);
          gifPollRef.current = null;
          setPreviewRefreshing(false);
        }
      }, 5000);
      gifPollRef.current = poll;
    },
    [selectedHandle, htmlDocs],
  );

  const refreshAfterMutation = useCallback(
    (planType: PlanType) => {
      if (!selectedHandle) return;
      // Immediately refetch plan variants (gifs, overrides, removed)
      fetchPlanVariants(selectedHandle)
        .then(setPlanVariants)
        .catch(() => {});
      // Poll for HTML update (server re-renders in ~2-5s)
      const htmlKey =
        planType === "seven_day" ? "content_plan_html" : "thirty_day_plan_html";
      pollForHtmlUpdate(htmlKey);
    },
    [selectedHandle, pollForHtmlUpdate],
  );

  /** Optimistically update the local planVariants removed list */
  const optimisticRemove = useCallback(
    (gifKey: string, planType: PlanType): PlanVariantsResponse | null => {
      if (!planVariants) return null;
      const snapshot = JSON.parse(
        JSON.stringify(planVariants),
      ) as PlanVariantsResponse;
      setPlanVariants((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as PlanVariantsResponse;
        const list = next.gifs.removed[planType] || [];
        if (!list.includes(gifKey)) list.push(gifKey);
        next.gifs.removed[planType] = list;
        return next;
      });
      return snapshot;
    },
    [planVariants],
  );

  const optimisticRestore = useCallback(
    (gifKey: string, planType: PlanType): PlanVariantsResponse | null => {
      if (!planVariants) return null;
      const snapshot = JSON.parse(
        JSON.stringify(planVariants),
      ) as PlanVariantsResponse;
      setPlanVariants((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as PlanVariantsResponse;
        next.gifs.removed[planType] = (
          next.gifs.removed[planType] || []
        ).filter((k) => k !== gifKey);
        return next;
      });
      return snapshot;
    },
    [planVariants],
  );

  const handleGifRemove = useCallback(
    async (gifKey: string, planType: PlanType) => {
      if (!planVariants?.job_id || !selectedHandle) return;
      const snapshot = optimisticRemove(gifKey, planType);
      setGifMutating(true);
      try {
        await removeGif({
          job_id: planVariants.job_id,
          artist_handle: selectedHandle,
          plan_type: planType,
          gif_key: gifKey,
        });
        toast.success("GIF removed — re-rendering plan");
        refreshAfterMutation(planType);
      } catch (err: any) {
        // Roll back optimistic update
        if (snapshot) setPlanVariants(snapshot);
        toast.error("Remove failed: " + (err.message || "Unknown error"));
      } finally {
        setGifMutating(false);
      }
    },
    [planVariants, selectedHandle, refreshAfterMutation, optimisticRemove],
  );

  const handleGifRestore = useCallback(
    async (gifKey: string, planType: PlanType) => {
      if (!planVariants?.job_id || !selectedHandle) return;
      const snapshot = optimisticRestore(gifKey, planType);
      setGifMutating(true);
      try {
        await restoreGif({
          job_id: planVariants.job_id,
          artist_handle: selectedHandle,
          plan_type: planType,
          gif_key: gifKey,
        });
        toast.success("GIF restored — re-rendering plan");
        refreshAfterMutation(planType);
      } catch (err: any) {
        // Roll back optimistic update
        if (snapshot) setPlanVariants(snapshot);
        toast.error("Restore failed: " + (err.message || "Unknown error"));
      } finally {
        setGifMutating(false);
      }
    },
    [planVariants, selectedHandle, refreshAfterMutation, optimisticRestore],
  );

  const handleGifSwap = useCallback(
    async (gifRefs: string[]) => {
      if (!planVariants?.job_id || !selectedHandle || !gifPickerSlot) return;
      // Optimistically update overrides
      const snapshot = JSON.parse(
        JSON.stringify(planVariants),
      ) as PlanVariantsResponse;
      setPlanVariants((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as PlanVariantsResponse;
        if (!next.gif_overrides[gifPickerSlot.planType]) {
          next.gif_overrides[gifPickerSlot.planType] = {};
        }
        next.gif_overrides[gifPickerSlot.planType][gifPickerSlot.key] = gifRefs;
        return next;
      });
      setGifMutating(true);
      try {
        await swapSource({
          job_id: planVariants.job_id,
          artist_handle: selectedHandle,
          plan_type: gifPickerSlot.planType,
          slot_key: gifPickerSlot.key,
          gif_refs: gifRefs,
        });
        toast.success("GIF swapped — re-rendering plan");
        setGifPickerOpen(false);
        refreshAfterMutation(gifPickerSlot.planType);
      } catch (err: any) {
        setPlanVariants(snapshot);
        toast.error("Swap failed: " + (err.message || "Unknown error"));
      } finally {
        setGifMutating(false);
      }
    },
    [planVariants, selectedHandle, gifPickerSlot, refreshAfterMutation],
  );

  const handleGifSwapReset = useCallback(async () => {
    if (!planVariants?.job_id || !selectedHandle || !gifPickerSlot) return;
    // Optimistically clear the override
    const snapshot = JSON.parse(
      JSON.stringify(planVariants),
    ) as PlanVariantsResponse;
    setPlanVariants((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as PlanVariantsResponse;
      delete next.gif_overrides[gifPickerSlot.planType]?.[gifPickerSlot.key];
      return next;
    });
    setGifMutating(true);
    try {
      await swapSource({
        job_id: planVariants.job_id,
        artist_handle: selectedHandle,
        plan_type: gifPickerSlot.planType,
        slot_key: gifPickerSlot.key,
        gif_refs: [],
      });
      toast.success("GIF reset to original — re-rendering plan");
      setGifPickerOpen(false);
      refreshAfterMutation(gifPickerSlot.planType);
    } catch (err: any) {
      setPlanVariants(snapshot);
      toast.error("Reset failed: " + (err.message || "Unknown error"));
    } finally {
      setGifMutating(false);
    }
  }, [planVariants, selectedHandle, gifPickerSlot, refreshAfterMutation]);

  const openGifPicker = useCallback(
    (slotKey: string, slotLabel: string, planType: PlanType) => {
      setGifPickerSlot({ key: slotKey, label: slotLabel, planType });
      setGifPickerOpen(true);
      loadContentPool();
    },
    [loadContentPool],
  );

  const handleBulkRemoveNiche = useCallback(
    async (planType: PlanType) => {
      if (!planVariants?.job_id || !selectedHandle) return;
      const nicheKeys = (planVariants.gifs?.available || [])
        .filter((g) => g.type === "niche")
        .map((g) => g.key)
        .filter(
          (k) => !(planVariants.gifs?.removed?.[planType] || []).includes(k),
        );
      if (nicheKeys.length === 0) return;
      setGifMutating(true);
      try {
        for (const key of nicheKeys) {
          await removeGif({
            job_id: planVariants.job_id,
            artist_handle: selectedHandle,
            plan_type: planType,
            gif_key: key,
            re_render: key === nicheKeys[nicheKeys.length - 1], // only re-render on last one
          });
        }
        toast.success(`${nicheKeys.length} niche GIFs removed — re-rendering`);
        refreshAfterMutation(planType);
      } catch (err: any) {
        toast.error("Bulk remove failed: " + (err.message || "Unknown error"));
      } finally {
        setGifMutating(false);
      }
    },
    [planVariants, selectedHandle, refreshAfterMutation],
  );

  const handleBulkRestoreAll = useCallback(
    async (planType: PlanType) => {
      if (!planVariants?.job_id || !selectedHandle) return;
      const removedKeys = planVariants.gifs?.removed?.[planType] || [];
      if (removedKeys.length === 0) return;
      setGifMutating(true);
      try {
        for (const key of removedKeys) {
          await restoreGif({
            job_id: planVariants.job_id,
            artist_handle: selectedHandle,
            plan_type: planType,
            gif_key: key,
            re_render: key === removedKeys[removedKeys.length - 1],
          });
        }
        toast.success(`${removedKeys.length} GIFs restored — re-rendering`);
        refreshAfterMutation(planType);
      } catch (err: any) {
        toast.error("Bulk restore failed: " + (err.message || "Unknown error"));
      } finally {
        setGifMutating(false);
      }
    },
    [planVariants, selectedHandle, refreshAfterMutation],
  );

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "7day", label: "7-Day Plan" },
    { key: "intel", label: "Intel Report" },
    { key: "30day", label: "30-Day Plan" },
    { key: "brief", label: "Artist Brief" },
  ];

  const HTML_COL_MAP: Record<SubTab, string> = {
    intel: "intelligence_report_html",
    "30day": "thirty_day_plan_html",
    brief: "artist_brief_html",
    "7day": "",
  };

  if (loading) return <p className="text-[#a8a29e] text-sm">Loading…</p>;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-0 h-[calc(100vh-100px)]">
        {/* Left panel — artist list */}
        <div className="flex flex-col min-h-0">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#a8a29e]" />
            <Input
              placeholder="Search artists…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-[#1C1C1E] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/60"
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
              {filtered.length === 0 && (
                <p className="text-[#a8a29e] text-sm p-2">No artists found</p>
              )}
              {filtered.map((j) => {
                const status = editStatuses[j.artist_handle] || "untouched";
                return (
                  <div
                    key={j.artist_handle}
                    onClick={() => trySelectArtist(j.artist_handle)}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedHandle === j.artist_handle
                        ? "border-amber-500 bg-amber-500/5"
                        : "border-[#1C1C1E] hover:border-[#a8a29e]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-[#ede8dc] text-sm truncate">
                          {j.artist_name || j.artist_handle}
                        </div>
                        <div className="text-xs text-[#a8a29e]">
                          @{j.artist_handle}
                        </div>
                      </div>
                      {status === "unsaved" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                      )}
                      {status === "saved" && (
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    {j.label_id && (
                      <div className="text-[10px] text-[#a8a29e] mt-0.5">
                        {labelMap[j.label_id] || ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right panel — editing workspace */}
        <div
          className="flex flex-col min-h-0"
          style={{ minWidth: 0, overflow: "hidden" }}
        >
          {!selectedHandle ? (
            <div className="flex items-center justify-center h-full text-[#a8a29e]">
              <FileText className="w-5 h-5 mr-2" /> Select an artist to edit
              their deliverables
            </div>
          ) : (
            <>
              {/* Sub-tab bar */}
              <div className="flex gap-1 mb-3 flex-wrap">
                {SUB_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSubTab(t.key)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      subTab === t.key
                        ? "bg-[#1C1C1E] text-[#ede8dc]"
                        : "text-[#a8a29e] hover:text-[#ede8dc]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div
                className={`flex-1 min-h-0 relative ${subTab === "7day" || subTab === "30day" ? "overflow-hidden" : "overflow-y-auto pb-16"}`}
                style={{ minWidth: 0 }}
              >
                {subTab === "7day" ? (
                  planLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 bg-[#1C1C1E]" />
                      <Skeleton className="h-40 bg-[#1C1C1E]" />
                    </div>
                  ) : !plan ? (
                    <div className="flex items-center justify-center h-64 text-[#a8a29e] text-sm">
                      No content plan generated yet for this artist
                    </div>
                  ) : (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full min-h-0"
                      style={{ overflow: "hidden" }}
                    >
                      {/* Left: Preview */}
                      <ResizablePanel
                        defaultSize={50}
                        minSize={15}
                        collapsible
                        className="overflow-hidden relative"
                      >
                        {!htmlDocs.content_plan_html ? (
                          <div className="flex items-center justify-center h-full text-[#a8a29e] text-sm bg-[#1C1C1E]">
                            No rendered plan yet
                          </div>
                        ) : (
                          <>
                            {hasUnsavedChanges && (
                              <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <span className="text-[11px] text-amber-500">
                                  Preview may be outdated
                                </span>
                              </div>
                            )}
                            <iframe
                              key={previewKey}
                              srcDoc={htmlDocs.content_plan_html}
                              className="w-full h-full border-0"
                              style={{ background: "white" }}
                              sandbox="allow-scripts allow-same-origin"
                              title="Plan Preview"
                            />
                            {previewRefreshing && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-white text-sm">
                                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                  Re-rendering…
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </ResizablePanel>

                      <ResizableHandle
                        withHandle
                        className="bg-[#2A2A2E] hover:bg-[#3A3A3E] transition-colors"
                      />

                      {/* Right: Editor */}
                      <ResizablePanel
                        defaultSize={50}
                        minSize={25}
                        className="relative"
                        style={{ overflow: "auto", minWidth: 0 }}
                      >
                        <div
                          className="space-y-4 p-3 pb-20"
                          style={{ minWidth: 0, maxWidth: "100%" }}
                        >
                          {/* Plan Header */}
                          <div className="bg-[#1C1C1E] rounded-lg p-3 space-y-3">
                            <div>
                              <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                Objective
                              </label>
                              <Textarea
                                defaultValue={plan.header?.objective || ""}
                                onBlur={(e) =>
                                  handlePlanFieldUpdate(
                                    "header.objective",
                                    e.target.value,
                                  )
                                }
                                className="min-h-[80px] text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                              />
                            </div>
                            <div className="flex gap-3 text-xs text-[#a8a29e]">
                              <span>Week: {plan.header?.week_label}</span>
                              <span>Artist: {plan.header?.artist_name}</span>
                              <span>Label: {plan.header?.label}</span>
                            </div>
                          </div>

                          {/* GIF Strip */}
                          {planVariants?.gifs?.available &&
                            planVariants.gifs.available.length > 0 && (
                              <GifStrip
                                gifs={planVariants.gifs.available}
                                removedKeys={
                                  planVariants.gifs.removed?.seven_day || []
                                }
                                overrides={
                                  planVariants.gif_overrides?.seven_day || {}
                                }
                                planType="seven_day"
                                mutating={gifMutating}
                                onRemove={(key) =>
                                  handleGifRemove(key, "seven_day")
                                }
                                onRestore={(key) =>
                                  handleGifRestore(key, "seven_day")
                                }
                                onBulkRemoveNiche={() =>
                                  handleBulkRemoveNiche("seven_day")
                                }
                                onBulkRestoreAll={() =>
                                  handleBulkRestoreAll("seven_day")
                                }
                              />
                            )}

                          {/* Schedule Table */}
                          <div className="bg-[#1C1C1E] rounded-lg overflow-hidden">
                            <div className="px-4 py-2 border-b border-[#2A2A2E] flex items-center gap-2">
                              <span className="text-sm font-medium text-[#ede8dc]">
                                Schedule
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-[#2A2A2E] text-[#a8a29e]">
                                    <th className="text-left px-3 py-2 w-[72px]">
                                      GIF
                                    </th>
                                    <th className="text-left px-3 py-2 w-[48px]">
                                      Day
                                    </th>
                                    <th className="text-left px-3 py-2">
                                      Title
                                    </th>
                                    <th className="text-left px-3 py-2 w-[140px]">
                                      Format
                                    </th>
                                    <th className="text-left px-3 py-2 w-[60px]">
                                      Time
                                    </th>
                                    <th className="text-left px-3 py-2 w-[64px]">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scheduleRows.map(
                                    ({ day, idea, index, ideaKey }) => {
                                      const gifs = getIdeaGifs(
                                        idea.source || "",
                                        gifMap,
                                        videoUrlMap,
                                      );
                                      const slotKey7 = String(index + 1);
                                      const hasOverride =
                                        !!planVariants?.gif_overrides
                                          ?.seven_day?.[slotKey7]?.length;
                                      return (
                                        <tr
                                          key={index}
                                          className="border-b border-[#2A2A2E]/50 hover:bg-[#2A2A2E]/30"
                                        >
                                          <td className="px-3 py-2">
                                            {gifs[0] && (
                                              <div className="relative inline-block">
                                                {gifs[0].videoUrl ? (
                                                  <a
                                                    href={gifs[0].videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    <img
                                                      src={gifs[0].gif}
                                                      alt=""
                                                      className="h-[72px] rounded-lg object-cover hover:scale-105 transition-transform cursor-pointer"
                                                    />
                                                  </a>
                                                ) : (
                                                  <img
                                                    src={gifs[0].gif}
                                                    alt=""
                                                    className="h-[72px] rounded-lg object-cover hover:scale-105 transition-transform"
                                                  />
                                                )}
                                                {hasOverride && (
                                                  <span
                                                    className="absolute top-1 right-1 bg-blue-500/80 rounded-full p-0.5"
                                                    title="GIF overridden"
                                                  >
                                                    <Shuffle className="w-2.5 h-2.5 text-white" />
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-[#a8a29e]">
                                            {day.day}
                                          </td>
                                          <td className="px-3 py-2 text-[#ede8dc] font-medium truncate">
                                            {idea.title}
                                          </td>
                                          <td className="px-3 py-2 text-[#a8a29e]">
                                            {idea.format}
                                          </td>
                                          <td className="px-3 py-2 text-[#a8a29e]">
                                            {day.post_time || "—"}
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-amber-500 hover:bg-amber-500/10"
                                                onClick={() =>
                                                  setExpandedRow(
                                                    expandedRow === index
                                                      ? null
                                                      : index,
                                                  )
                                                }
                                              >
                                                <Edit3 className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-[#a8a29e] hover:bg-[#2A2A2E]"
                                                onClick={() =>
                                                  setSwapDayIndex(index)
                                                }
                                              >
                                                <RefreshCw className="w-3 h-3" />
                                              </Button>
                                              {gifs.length > 0 && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 px-2 text-[10px] text-blue-400 hover:bg-blue-500/10"
                                                  onClick={() =>
                                                    openGifPicker(
                                                      String(index + 1),
                                                      `${day.day} — ${idea.title}`,
                                                      "seven_day",
                                                    )
                                                  }
                                                  title="Swap GIF"
                                                >
                                                  <Shuffle className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    },
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Inline Day Editor */}
                          {expandedRow !== null &&
                            scheduleRows[expandedRow] &&
                            (() => {
                              const { day, idea, index } =
                                scheduleRows[expandedRow];
                              return (
                                <div
                                  key={expandedRow}
                                  className="bg-[#1C1C1E] rounded-lg p-4 space-y-3 border border-amber-500/20"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-amber-500">
                                      Editing: {day.day} — {idea.title}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setExpandedRow(null)}
                                      className="text-[#a8a29e] hover:text-[#ede8dc]"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  {/* Title */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Title
                                    </label>
                                    <Input
                                      defaultValue={idea.title || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          title: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                    />
                                  </div>
                                  {/* Format */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Format
                                    </label>
                                    <Input
                                      defaultValue={idea.format || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          format: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                    />
                                  </div>
                                  {/* Source Type */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Source Type
                                    </label>
                                    <Select
                                      defaultValue={idea.source_type || ""}
                                      onValueChange={(val) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          source_type: val,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]">
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          "proven",
                                          "adapted",
                                          "trending",
                                          "original",
                                        ].map((opt) => (
                                          <SelectItem key={opt} value={opt}>
                                            {opt}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {/* Effort */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Effort
                                    </label>
                                    <Select
                                      defaultValue={idea.effort || ""}
                                      onValueChange={(val) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          effort: val,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]">
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {["15 min", "1 hour", "Half-day"].map(
                                          (opt) => (
                                            <SelectItem key={opt} value={opt}>
                                              {opt}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {/* Pitch */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Pitch
                                    </label>
                                    <Textarea
                                      rows={2}
                                      defaultValue={idea.pitch || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          pitch: e.target.value,
                                        })
                                      }
                                      className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] min-h-0"
                                    />
                                  </div>
                                  {/* Script */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Script
                                    </label>
                                    <Textarea
                                      rows={4}
                                      defaultValue={idea.script || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          script: e.target.value,
                                        })
                                      }
                                      className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] min-h-0"
                                    />
                                  </div>
                                  {/* Why This Works */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Why This Works
                                    </label>
                                    <Textarea
                                      rows={3}
                                      defaultValue={idea.why_this_week || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          why_this_week: e.target.value,
                                        })
                                      }
                                      className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] min-h-0"
                                    />
                                  </div>

                                  {/* Hooks */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Hooks
                                    </label>
                                    <div className="space-y-1.5 mt-1">
                                      {[
                                        {
                                          label: "SAFE",
                                          cls: "bg-green-500/15 text-green-400",
                                        },
                                        {
                                          label: "BOLD",
                                          cls: "bg-amber-500/15 text-amber-400",
                                        },
                                        {
                                          label: "WEIRD",
                                          cls: "bg-rose-500/15 text-rose-400",
                                        },
                                      ].map((hook, hi) => (
                                        <div
                                          key={hook.label}
                                          className="flex items-center gap-2"
                                        >
                                          <span
                                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${hook.cls} shrink-0 w-12 text-center`}
                                          >
                                            {hook.label}
                                          </span>
                                          <Input
                                            defaultValue={
                                              Array.isArray(idea.hooks)
                                                ? idea.hooks[hi] || ""
                                                : ""
                                            }
                                            onBlur={(e) => {
                                              const hooks = Array.isArray(
                                                idea.hooks,
                                              )
                                                ? [...idea.hooks]
                                                : ["", "", ""];
                                              hooks[hi] = e.target.value;
                                              handleIdeaEdit(index, {
                                                ...idea,
                                                hooks,
                                              });
                                            }}
                                            className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* CTA */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      CTA
                                    </label>
                                    <Input
                                      defaultValue={idea.cta || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          cta: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                    />
                                  </div>
                                  {/* Caption */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Caption
                                    </label>
                                    <Textarea
                                      rows={2}
                                      defaultValue={idea.caption || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          caption: e.target.value,
                                        })
                                      }
                                      className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] min-h-0"
                                    />
                                  </div>

                                  {/* Shot List */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Shot List
                                    </label>
                                    <div className="space-y-1.5 mt-1">
                                      {(Array.isArray(idea.shot_list)
                                        ? idea.shot_list
                                        : []
                                      ).map((shot: string, si: number) => (
                                        <div
                                          key={si}
                                          className="flex items-center gap-1.5"
                                        >
                                          <Input
                                            defaultValue={shot}
                                            onBlur={(e) => {
                                              const list = [
                                                ...(idea.shot_list || []),
                                              ];
                                              list[si] = e.target.value;
                                              handleIdeaEdit(index, {
                                                ...idea,
                                                shot_list: list,
                                              });
                                            }}
                                            className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                          />
                                          <button
                                            onClick={() => {
                                              const list = [
                                                ...(idea.shot_list || []),
                                              ];
                                              list.splice(si, 1);
                                              handleIdeaEdit(index, {
                                                ...idea,
                                                shot_list: list,
                                              });
                                            }}
                                            className="text-[#a8a29e] hover:text-rose-400 shrink-0"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-amber-500 hover:text-amber-400 h-7 px-2"
                                        onClick={() => {
                                          const list = [
                                            ...(idea.shot_list || []),
                                            "",
                                          ];
                                          handleIdeaEdit(index, {
                                            ...idea,
                                            shot_list: list,
                                          });
                                        }}
                                      >
                                        + Add shot
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Fallback (15 min) */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Fallback (15 min)
                                    </label>
                                    <Input
                                      defaultValue={idea.fallback_15min || ""}
                                      onBlur={(e) =>
                                        handleIdeaEdit(index, {
                                          ...idea,
                                          fallback_15min: e.target.value,
                                        })
                                      }
                                      className="h-8 text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                    />
                                  </div>
                                  {/* Source */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Source
                                    </label>
                                    <div className="text-xs font-mono text-[#a8a29e] p-2 bg-white/5 rounded-md min-h-[32px]">
                                      {idea.source || "—"}
                                    </div>
                                    <span className="text-[10px] text-[#a8a29e]/50 mt-1 block">
                                      🔒 Auto-generated — do not edit
                                    </span>
                                  </div>
                                  {/* Evidence */}
                                  <div>
                                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                      Evidence
                                    </label>
                                    <div className="text-xs font-mono text-[#a8a29e] p-2 bg-white/5 rounded-md min-h-[32px]">
                                      {idea.evidence || "—"}
                                    </div>
                                    <span className="text-[10px] text-[#a8a29e]/50 mt-1 block">
                                      🔒 Auto-generated — do not edit
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}

                          {/* Collapsible plan-level sections */}
                          <div className="space-y-2">
                            {/* Do Not Post */}
                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-[#1C1C1E] text-sm text-[#ede8dc] hover:bg-[#2A2A2E] transition-colors">
                                <ChevronDown className="w-4 h-4 text-[#a8a29e]" />
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                Do Not Post This Week —{" "}
                                {Array.isArray(plan.do_not_post)
                                  ? plan.do_not_post.length
                                  : 0}{" "}
                                items
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-3 bg-[#1C1C1E] rounded-b-lg border-t border-[#2A2A2E] space-y-2">
                                {(Array.isArray(plan.do_not_post)
                                  ? plan.do_not_post
                                  : []
                                ).map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="relative bg-[#1A1A1C] rounded-lg border-l-[3px] border-rose-500 p-3 space-y-1.5"
                                  >
                                    <button
                                      onClick={() => {
                                        const updated = [...plan.do_not_post];
                                        updated.splice(idx, 1);
                                        handlePlanFieldUpdate(
                                          "do_not_post",
                                          updated,
                                        );
                                      }}
                                      className="absolute top-2 right-2 text-[#a8a29e] hover:text-rose-400"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                    <div>
                                      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                        Directive
                                      </label>
                                      <Input
                                        defaultValue={item?.directive || ""}
                                        onBlur={(e) => {
                                          const updated = [...plan.do_not_post];
                                          updated[idx] = {
                                            ...updated[idx],
                                            directive: e.target.value,
                                          };
                                          handlePlanFieldUpdate(
                                            "do_not_post",
                                            updated,
                                          );
                                        }}
                                        className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] h-8"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                        Reason
                                      </label>
                                      <Input
                                        defaultValue={item?.reason || ""}
                                        onBlur={(e) => {
                                          const updated = [...plan.do_not_post];
                                          updated[idx] = {
                                            ...updated[idx],
                                            reason: e.target.value,
                                          };
                                          handlePlanFieldUpdate(
                                            "do_not_post",
                                            updated,
                                          );
                                        }}
                                        className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] h-8"
                                      />
                                    </div>
                                  </div>
                                ))}
                                <button
                                  onClick={() =>
                                    handlePlanFieldUpdate("do_not_post", [
                                      ...(plan.do_not_post || []),
                                      { directive: "", reason: "" },
                                    ])
                                  }
                                  className="flex items-center gap-1 text-xs text-[#a8a29e] hover:text-[#ede8dc] mt-1"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Brand Guardrails */}
                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-[#1C1C1E] text-sm text-[#ede8dc] hover:bg-[#2A2A2E] transition-colors">
                                <ChevronDown className="w-4 h-4 text-[#a8a29e]" />{" "}
                                Brand Guardrails
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-3 bg-[#1C1C1E] rounded-b-lg border-t border-[#2A2A2E]">
                                <Textarea
                                  defaultValue={
                                    typeof plan.brand_guardrails === "string"
                                      ? plan.brand_guardrails
                                      : JSON.stringify(
                                          plan.brand_guardrails || "",
                                        )
                                  }
                                  onBlur={(e) =>
                                    handlePlanFieldUpdate(
                                      "brand_guardrails",
                                      e.target.value,
                                    )
                                  }
                                  className="min-h-[80px] text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                />
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Comment Strategy */}
                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-[#1C1C1E] text-sm text-[#ede8dc] hover:bg-[#2A2A2E] transition-colors">
                                <ChevronDown className="w-4 h-4 text-[#a8a29e]" />
                                Comment Strategy —{" "}
                                {Array.isArray(plan.comment_strategy)
                                  ? plan.comment_strategy.length
                                  : 0}{" "}
                                items
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-3 bg-[#1C1C1E] rounded-b-lg border-t border-[#2A2A2E]">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[#a8a29e] text-[10px] uppercase tracking-wider">
                                      <th className="text-left pb-1.5 pr-2">
                                        When this happens…
                                      </th>
                                      <th className="text-left pb-1.5 pr-2">
                                        Respond with…
                                      </th>
                                      <th className="w-6"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(Array.isArray(plan.comment_strategy)
                                      ? plan.comment_strategy
                                      : []
                                    ).map((item: any, idx: number) => (
                                      <tr
                                        key={idx}
                                        className="align-top border-t border-[#2A2A2E]"
                                      >
                                        <td className="py-1.5 pr-2">
                                          <Input
                                            defaultValue={item?.trigger || ""}
                                            onBlur={(e) => {
                                              const updated = [
                                                ...plan.comment_strategy,
                                              ];
                                              updated[idx] = {
                                                ...updated[idx],
                                                trigger: e.target.value,
                                              };
                                              handlePlanFieldUpdate(
                                                "comment_strategy",
                                                updated,
                                              );
                                            }}
                                            className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] h-7"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2 space-y-1">
                                          <Input
                                            defaultValue={item?.reply || ""}
                                            onBlur={(e) => {
                                              const updated = [
                                                ...plan.comment_strategy,
                                              ];
                                              updated[idx] = {
                                                ...updated[idx],
                                                reply: e.target.value,
                                              };
                                              handlePlanFieldUpdate(
                                                "comment_strategy",
                                                updated,
                                              );
                                            }}
                                            className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] h-7"
                                          />
                                          <div>
                                            <span className="text-[9px] text-[#a8a29e]">
                                              Example (in artist's voice):
                                            </span>
                                            <Input
                                              defaultValue={
                                                item?.example_reply || ""
                                              }
                                              onBlur={(e) => {
                                                const updated = [
                                                  ...plan.comment_strategy,
                                                ];
                                                updated[idx] = {
                                                  ...updated[idx],
                                                  example_reply: e.target.value,
                                                };
                                                handlePlanFieldUpdate(
                                                  "comment_strategy",
                                                  updated,
                                                );
                                              }}
                                              className="text-[11px] bg-[#0a0a0a] border-[#2A2A2E] text-[#a8a29e] italic h-7"
                                            />
                                          </div>
                                        </td>
                                        <td className="py-1.5">
                                          <button
                                            onClick={() => {
                                              const updated = [
                                                ...plan.comment_strategy,
                                              ];
                                              updated.splice(idx, 1);
                                              handlePlanFieldUpdate(
                                                "comment_strategy",
                                                updated,
                                              );
                                            }}
                                            className="text-[#a8a29e] hover:text-rose-400"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <button
                                  onClick={() =>
                                    handlePlanFieldUpdate("comment_strategy", [
                                      ...(plan.comment_strategy || []),
                                      {
                                        trigger: "",
                                        reply: "",
                                        example_reply: "",
                                      },
                                    ])
                                  }
                                  className="flex items-center gap-1 text-xs text-[#a8a29e] hover:text-[#ede8dc] mt-2"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Taste Pick */}
                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-[#1C1C1E] text-sm text-[#ede8dc] hover:bg-[#2A2A2E] transition-colors">
                                <ChevronDown className="w-4 h-4 text-[#a8a29e]" />{" "}
                                Taste Pick
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-3 bg-[#1C1C1E] rounded-b-lg border-t border-[#2A2A2E] space-y-2">
                                <p
                                  className="text-[11px] text-[#a8a29e] uppercase"
                                  style={{ letterSpacing: "1px" }}
                                >
                                  TASTE PICK — FROM INSTINCT, NOT DATA
                                </p>
                                <div>
                                  <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                    Title
                                  </label>
                                  <Input
                                    defaultValue={plan.taste_pick?.title || ""}
                                    onBlur={(e) =>
                                      handlePlanFieldUpdate(
                                        "taste_pick.title",
                                        e.target.value,
                                      )
                                    }
                                    className="text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider">
                                    Description
                                  </label>
                                  <Textarea
                                    defaultValue={
                                      plan.taste_pick?.description || ""
                                    }
                                    onBlur={(e) =>
                                      handlePlanFieldUpdate(
                                        "taste_pick.description",
                                        e.target.value,
                                      )
                                    }
                                    className="min-h-[60px] text-xs bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc]"
                                  />
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </div>

                        {/* Sticky save bar */}
                        <div className="sticky bottom-0 left-0 right-0 bg-[#1C1C1E]/95 backdrop-blur border-t border-[#2A2A2E] px-4 py-3 flex items-center gap-3 rounded-b-lg">
                          <Button
                            onClick={discardChanges}
                            variant="ghost"
                            className="text-[#a8a29e] text-xs hover:text-[#ede8dc]"
                            disabled={!hasUnsavedChanges}
                          >
                            Discard Changes
                          </Button>
                          <div className="flex-1 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-[#a8a29e]" />
                            <span className="text-[10px] text-[#a8a29e]">
                              {lastSaved
                                ? `Last saved: ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
                                : "Never saved"}
                            </span>
                          </div>
                          <Button
                            onClick={saveDraft}
                            variant="outline"
                            className="text-xs border-[#2A2A2E] text-[#ede8dc] bg-[#1C1C1E] hover:bg-[#2A2A2E]"
                            disabled={saving || !hasUnsavedChanges}
                          >
                            {saving ? "Saving…" : "Save Draft"}
                          </Button>
                          <Button
                            onClick={saveAndRerender}
                            className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={saving}
                          >
                            Save & Re-render HTML
                          </Button>
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )
                ) : subTab === "brief" ? (
                  htmlLoading ? (
                    <Skeleton className="h-64 bg-[#1C1C1E]" />
                  ) : (
                    <BrandDocumentEditor
                      brandDocument={htmlDocs.brand_document}
                      artistBriefHtml={htmlDocs.artist_brief_html || null}
                      artistHandle={selectedHandle}
                      onSaved={() => {
                        supabase
                          .from("artist_intelligence")
                          .select(
                            "intelligence_report_html, thirty_day_plan_html, artist_brief_html, content_plan_html, brand_document",
                          )
                          .eq("artist_handle", selectedHandle)
                          .single()
                          .then(({ data }: any) => {
                            if (data) setHtmlDocs(data);
                          });
                      }}
                      onDirtyChange={setBriefDirty}
                    />
                  )
                ) : subTab === "intel" ? (
                  htmlLoading ? (
                    <Skeleton className="h-64 bg-[#1C1C1E]" />
                  ) : (
                    <IntelReportEditor
                      html={htmlDocs.intelligence_report_html || null}
                      artistHandle={selectedHandle}
                      onSaved={() => {
                        supabase
                          .from("artist_intelligence")
                          .select(
                            "intelligence_report_html, thirty_day_plan_html, artist_brief_html, content_plan_html, brand_document",
                          )
                          .eq("artist_handle", selectedHandle)
                          .single()
                          .then(({ data }: any) => {
                            if (data) setHtmlDocs(data);
                          });
                      }}
                    />
                  )
                ) : subTab === "30day" ? (
                  htmlLoading || planLoading ? (
                    <Skeleton className="h-64 bg-[#1C1C1E]" />
                  ) : (
                    <ThirtyDayPlanEditor
                      thirtyDayPlan={thirtyDayPlan}
                      thirtyDayPlanHtml={htmlDocs.thirty_day_plan_html || null}
                      artistHandle={selectedHandle}
                      jobId={activeJobId}
                      planVariants={planVariants}
                      contentPool={contentPool ?? null}
                      contentPoolLoading={contentPoolLoading}
                      gifMutating={gifMutating}
                      gifMap={gifMap}
                      onGifRemove={(key) => handleGifRemove(key, "thirty_day")}
                      onGifRestore={(key) =>
                        handleGifRestore(key, "thirty_day")
                      }
                      onOpenGifPicker={openGifPicker}
                      onLoadContentPool={loadContentPool}
                      onBulkRemoveNiche={() =>
                        handleBulkRemoveNiche("thirty_day")
                      }
                      onBulkRestoreAll={() =>
                        handleBulkRestoreAll("thirty_day")
                      }
                      onSaved={() => {
                        supabase
                          .from("artist_intelligence")
                          .select(
                            "intelligence_report_html, thirty_day_plan_html, artist_brief_html, content_plan_html, brand_document",
                          )
                          .eq("artist_handle", selectedHandle)
                          .single()
                          .then(({ data }: any) => {
                            if (data) setHtmlDocs(data);
                          });
                      }}
                    />
                  )
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Swap Drawer */}
      <Sheet
        open={swapDayIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSwapDayIndex(null);
        }}
      >
        <SheetContent className="bg-[#0a0a0a] border-l border-[#2A2A2E] w-[520px] sm:max-w-[520px] min-w-[40vw] p-0">
          {swapDayIndex !== null && plan && (
            <>
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-[#2A2A2E]">
                <SheetTitle className="text-[#ede8dc]">
                  Swap {plan.calendar[swapDayIndex]?.day}'s idea
                </SheetTitle>
                <SheetDescription className="text-[#a8a29e] text-xs">
                  Currently:{" "}
                  {plan.ideas_all[plan.calendar[swapDayIndex]?.selected_idea]
                    ?.title || "—"}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-140px)] px-4 py-3">
                <div className="space-y-3">
                  {swapPool.map(({ key, idea }) => (
                    <SwapCard
                      key={key}
                      ideaKey={key}
                      idea={idea}
                      onSwap={() => handleSwap(swapDayIndex, key)}
                      gifMap={gifMap}
                      videoUrlMap={videoUrlMap}
                    />
                  ))}
                  {swapPool.length === 0 && (
                    <p className="text-[#a8a29e] text-sm text-center py-8">
                      No alternative ideas available
                    </p>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Discard confirmation */}
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent className="bg-[#1C1C1E] border-[#2A2A2E] text-[#ede8dc]">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a8a29e]">
              You have unsaved changes. Discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2A2A2E] border-[#2A2A2E] text-[#ede8dc] hover:bg-[#333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GIF Picker Modal */}
      <GifPickerModal
        open={gifPickerOpen}
        onOpenChange={setGifPickerOpen}
        slotKey={gifPickerSlot?.key || ""}
        slotLabel={gifPickerSlot?.label || ""}
        contentPool={contentPool ?? null}
        contentPoolLoading={contentPoolLoading}
        currentOverrideKeys={
          gifPickerSlot
            ? planVariants?.gif_overrides?.[gifPickerSlot.planType]?.[
                gifPickerSlot.key
              ] || []
            : []
        }
        onSwap={handleGifSwap}
        onReset={handleGifSwapReset}
        mutating={gifMutating}
      />
    </>
  );
}
