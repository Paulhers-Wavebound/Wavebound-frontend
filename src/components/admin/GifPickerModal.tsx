import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Undo2, ImageOff, Search } from "lucide-react";
import type {
  ContentPoolResponse,
  ContentPoolOwnVideo,
  ContentPoolNicheVideo,
} from "@/utils/planVariantsApi";

interface GifPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotKey: string;
  slotLabel: string;
  contentPool: ContentPoolResponse | null;
  contentPoolLoading: boolean;
  currentOverrideKeys: string[];
  onSwap: (gifRefs: string[]) => void;
  onReset: () => void;
  mutating: boolean;
}

function formatViews(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

function OwnVideoCard({
  video,
  onSelect,
  disabled,
}: {
  video: ContentPoolOwnVideo;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <div className="bg-[#1A1A1C] rounded-lg border border-[#2A2A2E] overflow-hidden flex gap-3 p-3">
      <div className="w-[100px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-[#111]">
        {video.has_gif && video.gif_url ? (
          <img
            src={video.gif_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ImageOff className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-amber-400">
              {video.multiplier}
            </span>
            <span className="text-[10px] text-white/50">
              {formatViews(video.views)} views
            </span>
            {!video.has_gif && (
              <Badge className="bg-white/5 text-white/30 border-white/10 text-[8px] py-0 px-1">
                no preview
              </Badge>
            )}
          </div>
          <p className="text-xs text-white/70 line-clamp-2 leading-snug">
            {video.description || video.hook || "—"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {video.categories?.slice(0, 3).map((c) => (
            <Badge
              key={c}
              className="bg-white/5 text-white/40 border-white/10 text-[8px] py-0 px-1"
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>
      <Button
        onClick={onSelect}
        disabled={disabled}
        size="sm"
        className="self-center bg-amber-600 hover:bg-amber-700 text-white text-[11px] flex-shrink-0"
      >
        Use
      </Button>
    </div>
  );
}

function NicheVideoCard({
  video,
  onSelect,
  disabled,
}: {
  video: ContentPoolNicheVideo;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <div className="bg-[#1A1A1C] rounded-lg border border-[#2A2A2E] overflow-hidden flex gap-3 p-3">
      <div className="w-[100px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-[#111]">
        {video.has_gif && video.gif_url ? (
          <img
            src={video.gif_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ImageOff className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-amber-400">
              {video.multiplier}
            </span>
            <span className="text-[10px] text-white/50">
              {formatViews(video.views)} views
            </span>
            <span className="text-[10px] text-blue-400">{video.creator}</span>
          </div>
          <p className="text-xs text-white/70 line-clamp-2 leading-snug">
            {video.why_relevant || "—"}
          </p>
        </div>
        {video.format && (
          <Badge className="bg-white/5 text-white/40 border-white/10 text-[8px] py-0 px-1 self-start mt-1">
            {video.format}
          </Badge>
        )}
      </div>
      <Button
        onClick={onSelect}
        disabled={disabled}
        size="sm"
        className="self-center bg-amber-600 hover:bg-amber-700 text-white text-[11px] flex-shrink-0"
      >
        Use
      </Button>
    </div>
  );
}

export default function GifPickerModal({
  open,
  onOpenChange,
  slotKey,
  slotLabel,
  contentPool,
  contentPoolLoading,
  currentOverrideKeys,
  onSwap,
  onReset,
  mutating,
}: GifPickerModalProps) {
  const hasOverride = currentOverrideKeys.length > 0;
  const [search, setSearch] = useState("");

  // Reset search when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) setSearch("");
    onOpenChange(open);
  };

  const q = search.toLowerCase().trim();

  const filteredOwn = useMemo(() => {
    if (!contentPool || !q) return contentPool?.own_videos || [];
    return contentPool.own_videos.filter(
      (v) =>
        (v.description || "").toLowerCase().includes(q) ||
        (v.hook || "").toLowerCase().includes(q) ||
        (v.categories || []).some((c) => c.toLowerCase().includes(q)),
    );
  }, [contentPool, q]);

  const filteredNiche = useMemo(() => {
    if (!contentPool || !q) return contentPool?.niche_videos || [];
    return contentPool.niche_videos.filter(
      (v) =>
        (v.creator || "").toLowerCase().includes(q) ||
        (v.why_relevant || "").toLowerCase().includes(q) ||
        (v.format || "").toLowerCase().includes(q),
    );
  }, [contentPool, q]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#ede8dc]">
            Swap GIF — {slotLabel}
          </DialogTitle>
          <DialogDescription className="text-[#a8a29e] text-xs">
            Choose a video to use as the GIF reference for this slot
            {hasOverride && (
              <span className="ml-2 text-amber-500">
                (currently overridden)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {contentPoolLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500 mr-2" />
            <span className="text-sm text-[#a8a29e]">
              Loading content pool…
            </span>
          </div>
        ) : !contentPool ? (
          <div className="text-center py-16 text-[#a8a29e] text-sm">
            Failed to load content pool
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {hasOverride && (
                <Button
                  onClick={onReset}
                  disabled={mutating}
                  variant="outline"
                  className="border-[#2A2A2E] text-[#a8a29e] hover:text-[#ede8dc] bg-transparent text-xs"
                >
                  <Undo2 className="w-3 h-3 mr-1.5" />
                  Reset
                </Button>
              )}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#a8a29e]" />
                <Input
                  placeholder="Search videos…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-[#1C1C1E] border-[#2A2A2E] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
                />
              </div>
            </div>

            <Tabs defaultValue="own" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="bg-[#1C1C1E] border border-[#2A2A2E] self-start">
                <TabsTrigger
                  value="own"
                  className="text-xs data-[state=active]:bg-[#2A2A2E] data-[state=active]:text-[#ede8dc] text-[#a8a29e]"
                >
                  Own ({filteredOwn.length}
                  {q ? `/${contentPool.own_videos.length}` : ""})
                </TabsTrigger>
                <TabsTrigger
                  value="niche"
                  className="text-xs data-[state=active]:bg-[#2A2A2E] data-[state=active]:text-[#ede8dc] text-[#a8a29e]"
                >
                  Niche ({filteredNiche.length}
                  {q ? `/${contentPool.niche_videos.length}` : ""})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="own" className="flex-1 min-h-0 mt-2">
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-2 pr-3">
                    {filteredOwn.map((v) => (
                      <OwnVideoCard
                        key={v.key}
                        video={v}
                        onSelect={() => onSwap([v.key])}
                        disabled={mutating}
                      />
                    ))}
                    {filteredOwn.length === 0 && (
                      <p className="text-center py-8 text-[#a8a29e] text-sm">
                        {q ? "No matches" : "No own videos available"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="niche" className="flex-1 min-h-0 mt-2">
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-2 pr-3">
                    {filteredNiche.map((v) => (
                      <NicheVideoCard
                        key={v.key}
                        video={v}
                        onSelect={() => onSwap([v.key])}
                        disabled={mutating}
                      />
                    ))}
                    {filteredNiche.length === 0 && (
                      <p className="text-center py-8 text-[#a8a29e] text-sm">
                        {q ? "No matches" : "No niche videos available"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}

        {mutating && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
            <div className="flex items-center gap-2 text-white text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Swapping…
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
