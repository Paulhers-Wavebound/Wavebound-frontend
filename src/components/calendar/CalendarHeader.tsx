import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Rows3 } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  currentMonth: Date;
  viewMode: "month" | "week";
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onViewModeChange: (mode: "month" | "week") => void;
  onToday: () => void;
}

const CalendarHeader = ({
  currentMonth,
  viewMode,
  onPrevMonth,
  onNextMonth,
  onViewModeChange,
  onToday,
}: CalendarHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Left - Title */}
      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Content <span className="text-primary">Calendar</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Plan and schedule your content strategy
        </p>
      </div>

      {/* Center - Month Navigation */}
      <div className="flex items-center justify-center gap-1 bg-slate-800 dark:bg-slate-700 rounded-xl p-1 shadow-md">
        <Button variant="ghost" size="icon" onClick={onPrevMonth} className="h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-white min-w-[130px] text-center text-sm">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <Button variant="ghost" size="icon" onClick={onNextMonth} className="h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right - View Toggle & Today */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("month")}
            className={`gap-1.5 rounded-lg ${viewMode === "month" ? "bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700" : ""}`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Month</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("week")}
            className={`gap-1.5 rounded-lg ${viewMode === "week" ? "bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700" : ""}`}
          >
            <Rows3 className="w-4 h-4" />
            <span className="hidden sm:inline">Week</span>
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={onToday} className="rounded-xl">
          Today
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
