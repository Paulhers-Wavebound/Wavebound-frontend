import { useState } from "react";
import {
  X,
  Undo2,
  Shuffle,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { GifItem, PlanType } from "@/utils/planVariantsApi";

interface GifStripProps {
  gifs: GifItem[];
  removedKeys: string[];
  overrides: Record<string, string[]>;
  planType: PlanType;
  mutating: boolean;
  onRemove: (gifKey: string) => void;
  onRestore: (gifKey: string) => void;
  onBulkRemoveNiche?: () => void;
  onBulkRestoreAll?: () => void;
}

export default function GifStrip({
  gifs,
  removedKeys,
  overrides,
  planType,
  mutating,
  onRemove,
  onRestore,
  onBulkRemoveNiche,
  onBulkRestoreAll,
}: GifStripProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Build set of GIF keys that appear as values in overrides
  const overriddenKeys = new Set<string>();
  for (const refs of Object.values(overrides)) {
    for (const k of refs) overriddenKeys.add(k);
  }

  const removedSet = new Set(removedKeys);
  const nicheGifs = gifs.filter((g) => g.type === "niche");
  const activeNicheCount = nicheGifs.filter(
    (g) => !removedSet.has(g.key),
  ).length;
  const hasRemovedGifs = removedSet.size > 0;

  if (gifs.length === 0) return null;

  return (
    <div className="bg-[#1C1C1E] rounded-lg border border-white/[0.06] mb-3">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs text-white/55 uppercase tracking-wider font-medium hover:text-white/70 transition-colors"
        >
          {collapsed ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          GIF Library — {gifs.length} clips
          {removedSet.size > 0 && (
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] py-0 px-1.5">
              {removedSet.size} removed
            </Badge>
          )}
        </button>
        <div className="flex items-center gap-1.5">
          {mutating && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
          )}
          {!collapsed && (
            <>
              {activeNicheCount > 0 && onBulkRemoveNiche && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-rose-400 hover:bg-rose-500/10"
                  disabled={mutating}
                  onClick={onBulkRemoveNiche}
                  title="Remove all niche GIFs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Niche ({activeNicheCount})
                </Button>
              )}
              {hasRemovedGifs && onBulkRestoreAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-green-400 hover:bg-green-500/10"
                  disabled={mutating}
                  onClick={onBulkRestoreAll}
                  title="Restore all removed GIFs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restore all
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {!collapsed && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-3 pb-3">
            {gifs.map((gif) => {
              const isRemoved = removedSet.has(gif.key);
              const isOverridden = overriddenKeys.has(gif.key);

              return (
                <div
                  key={gif.key}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden group transition-opacity ${
                    isRemoved ? "opacity-30 grayscale" : ""
                  }`}
                  style={{ width: 100 }}
                >
                  <img
                    src={gif.url}
                    alt=""
                    className="h-[72px] w-full object-cover"
                    loading="lazy"
                  />

                  {/* Multiplier + views overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 flex items-end justify-between">
                    <span className="text-[9px] text-white/70 truncate">
                      {gif.views >= 1000
                        ? `${(gif.views / 1000).toFixed(0)}k`
                        : gif.views}
                    </span>
                    <span className="text-[9px] font-semibold text-amber-400">
                      {gif.multiplier}
                    </span>
                  </div>

                  {/* Type badge */}
                  {gif.type === "niche" && (
                    <div className="absolute top-1 left-1">
                      <Badge className="bg-blue-500/30 text-blue-300 border-blue-500/30 text-[8px] py-0 px-1 leading-tight">
                        niche
                      </Badge>
                    </div>
                  )}

                  {/* Swapped indicator */}
                  {isOverridden && !isRemoved && (
                    <div className="absolute top-1 right-1">
                      <Shuffle className="w-3 h-3 text-amber-400 drop-shadow-md" />
                    </div>
                  )}

                  {/* Action button */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isRemoved ? (
                      <button
                        onClick={() => onRestore(gif.key)}
                        disabled={mutating}
                        className="p-1 rounded-full bg-green-600/80 hover:bg-green-600 text-white shadow-md"
                        title="Restore GIF"
                      >
                        <Undo2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onRemove(gif.key)}
                        disabled={mutating}
                        className="p-1 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white shadow-md"
                        title="Remove GIF"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
