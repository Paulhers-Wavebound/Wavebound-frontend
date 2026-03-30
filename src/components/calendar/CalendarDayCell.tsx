import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Play, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useDroppable } from "@dnd-kit/core";

interface CalendarItem {
  id: string;
  date: string;
  title: string;
  type: "video" | "photo" | "idea";
  description?: string;
  time?: string;
  sourceId?: number;
  thumbnailUrl?: string;
  projectColor?: string;
}

interface CalendarDayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isTodayDate: boolean;
  dayItems: CalendarItem[];
  isWeekView?: boolean;
  onClick: () => void;
  onQuickAdd: () => void;
}

const CalendarDayCell = ({
  day,
  isCurrentMonth,
  isSelected,
  isTodayDate,
  dayItems,
  isWeekView = false,
  onClick,
  onQuickAdd,
}: CalendarDayCellProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(day, "yyyy-MM-dd"),
    data: { date: day },
  });

  const cellHeight = isWeekView ? "min-h-[200px]" : "min-h-[110px]";

  return (
    <motion.div
      ref={setNodeRef}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`
        ${cellHeight} p-2 sm:p-3 rounded-xl cursor-pointer transition-all duration-200 group relative
        glass-card border border-border/30
        ${!isCurrentMonth ? "opacity-40" : ""}
        ${isSelected ? "ring-2 ring-slate-400 dark:ring-slate-500 bg-slate-100 dark:bg-slate-800/50" : "hover:bg-muted/30"}
        ${isTodayDate ? "bg-slate-50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-600" : ""}
        ${isOver ? "ring-2 ring-slate-500 bg-slate-100 dark:bg-slate-800/50 scale-[1.02]" : ""}
      `}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`
            text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors
            ${isTodayDate ? "bg-slate-800 dark:bg-slate-600 text-white" : "text-foreground"}
          `}
        >
          {format(day, "d")}
        </span>
        
        <div className="flex items-center gap-1.5">
          {dayItems.length > 0 && (
            <Badge 
              variant="secondary" 
              className="text-xs px-1.5 py-0 h-5 bg-muted/80"
            >
              {dayItems.length}
            </Badge>
          )}
          
          {/* Quick Add Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {dayItems.slice(0, isWeekView ? 5 : 2).map((item) => (
          <div
            key={item.id}
            className={`
              text-xs p-1.5 rounded-lg truncate flex items-center gap-1.5 transition-colors
              ${item.projectColor ? "" : 
                item.type === "video" ? "bg-slate-500/15 text-slate-600 dark:text-slate-400" :
                item.type === "photo" ? "bg-violet-500/15 text-violet-600 dark:text-violet-400" :
                "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }
            `}
            style={item.projectColor ? {
              backgroundColor: `${item.projectColor}20`,
              color: item.projectColor,
            } : undefined}
          >
            {item.type === "video" && <Play className="w-3 h-3 flex-shrink-0" />}
            {item.type === "photo" && <ImageIcon className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate font-medium">{item.title}</span>
          </div>
        ))}
        {dayItems.length > (isWeekView ? 5 : 2) && (
          <div className="text-xs text-muted-foreground font-medium pl-1">
            +{dayItems.length - (isWeekView ? 5 : 2)} more
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CalendarDayCell;
