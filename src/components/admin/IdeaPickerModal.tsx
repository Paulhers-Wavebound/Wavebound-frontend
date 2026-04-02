import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import type {
  ContentPoolIdea,
  ContentPoolResponse,
} from "@/utils/planVariantsApi";

interface IdeaPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSlot: string;
  targetLabel: string;
  contentPool: ContentPoolResponse | null;
  contentPoolLoading: boolean;
  onSelect: (ideaKey: string) => void;
  mutating: boolean;
}

const EFFORT_COLORS: Record<string, string> = {
  "15 min": "bg-green-500/20 text-green-400 border-green-500/30",
  "1 hour": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Half-day": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function IdeaPickerModal({
  open,
  onOpenChange,
  targetSlot,
  targetLabel,
  contentPool,
  contentPoolLoading,
  onSelect,
  mutating,
}: IdeaPickerModalProps) {
  // Group ideas by day
  const groupedByDay: Record<string, { key: string; idea: ContentPoolIdea }[]> =
    {};
  if (contentPool?.seven_day_ideas) {
    for (const [key, idea] of Object.entries(contentPool.seven_day_ideas)) {
      const day = idea.day || "Unknown";
      if (!groupedByDay[day]) groupedByDay[day] = [];
      groupedByDay[day].push({ key, idea });
    }
  }

  const sortedDays = Object.keys(groupedByDay).sort(
    (a, b) => (DAY_ORDER.indexOf(a) ?? 99) - (DAY_ORDER.indexOf(b) ?? 99),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-[#2A2A2E] text-[#ede8dc] max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#ede8dc]">
            Replace Play — {targetLabel}
          </DialogTitle>
          <DialogDescription className="text-[#a8a29e] text-xs">
            Choose a 7-day idea to replace this 30-day play
          </DialogDescription>
        </DialogHeader>

        {contentPoolLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500 mr-2" />
            <span className="text-sm text-[#a8a29e]">
              Loading content pool…
            </span>
          </div>
        ) : !contentPool || sortedDays.length === 0 ? (
          <div className="text-center py-16 text-[#a8a29e] text-sm">
            No 7-day ideas available
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 max-h-[60vh]">
            <div className="space-y-4 pr-3">
              {sortedDays.map((day) => (
                <div key={day}>
                  <h4 className="text-[10px] text-white/55 uppercase tracking-wider font-medium mb-2 sticky top-0 bg-[#0a0a0a] py-1 z-10">
                    {day}
                  </h4>
                  <div className="space-y-2">
                    {groupedByDay[day].map(({ key, idea }) => {
                      const effortCls =
                        EFFORT_COLORS[idea.effort] ||
                        "bg-white/5 text-white/40 border-white/10";
                      return (
                        <div
                          key={key}
                          className="bg-[#1A1A1C] rounded-lg border border-[#2A2A2E] p-3 flex items-start gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#ede8dc] mb-1 leading-snug">
                              {idea.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {idea.format && (
                                <span className="text-[10px] text-white/50">
                                  {idea.format}
                                </span>
                              )}
                              <Badge
                                className={`${effortCls} text-[8px] py-0 px-1`}
                              >
                                {idea.effort}
                              </Badge>
                              {idea.source && (
                                <span className="text-[9px] text-white/30 font-mono truncate max-w-[120px]">
                                  {idea.source}
                                </span>
                              )}
                            </div>
                            {idea.pitch && (
                              <p className="text-[10px] text-white/40 mt-1 line-clamp-1">
                                {idea.pitch}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => onSelect(key)}
                            disabled={mutating}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] flex-shrink-0"
                          >
                            Use
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {mutating && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
            <div className="flex items-center gap-2 text-white text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Replacing play…
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
