import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircleAlert,
  TriangleAlert,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useScrollFade } from "@/hooks/useScrollFade";
import type { RosterMetric } from "./RosterCard";

interface FlatAlert {
  severity: string;
  message: string;
  artist_handle: string;
  artist_name: string;
}

const severityOrder: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const severityConfig: Record<
  string,
  { icon: typeof CircleAlert; border: string; iconClass: string }
> = {
  critical: {
    icon: CircleAlert,
    border: "border-l-red-500",
    iconClass: "text-red-500",
  },
  warning: {
    icon: TriangleAlert,
    border: "border-l-amber-500",
    iconClass: "text-amber-500",
  },
  info: { icon: Info, border: "border-l-blue-500", iconClass: "text-blue-500" },
};

export default function RiskAlertsPanel({
  metrics,
}: {
  metrics: RosterMetric[];
}) {
  const navigate = useNavigate();

  const alerts = useMemo<FlatAlert[]>(() => {
    const flat: FlatAlert[] = [];
    for (const m of metrics) {
      if (!m.risk_flags || !Array.isArray(m.risk_flags)) continue;
      for (const flag of m.risk_flags) {
        flat.push({
          severity: flag.severity || "info",
          message: flag.message || "",
          artist_handle: m.artist_handle,
          artist_name: m.artist_name,
        });
      }
    }
    flat.sort(
      (a, b) =>
        (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9),
    );
    return flat;
  }, [metrics]);

  const hasAlerts = alerts.length > 0;
  const [open, setOpen] = useState(hasAlerts);
  const { scrollRef, showLeftFade, showRightFade, scrollBy } = useScrollFade();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
          <ChevronDown
            size={14}
            className={`transition-transform ${open ? "" : "-rotate-90"}`}
          />
          Risk Alerts ({alerts.length})
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="relative">
          {/* Fade edges */}
          {showLeftFade && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <button
                onClick={() => scrollBy("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}
          {showRightFade && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              <button
                onClick={() => scrollBy("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          >
            {!hasAlerts ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 h-[60px] text-sm text-green-400 whitespace-nowrap">
                <CheckCircle size={16} />
                All clear — no issues across your roster ✓
              </div>
            ) : (
              alerts.map((alert, i) => {
                const cfg =
                  severityConfig[alert.severity] || severityConfig.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={`${alert.artist_handle}-${i}`}
                    className={`flex items-center gap-3 rounded-lg border border-border ${cfg.border} border-l-2 bg-card px-4 h-[60px] shrink-0 min-w-[280px] max-w-[380px]`}
                  >
                    <Icon size={18} className={`shrink-0 ${cfg.iconClass}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        @{alert.artist_handle?.replace(/^@+/, "")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs h-7 px-2"
                      onClick={() =>
                        navigate(`/label/artists/${alert.artist_handle}`)
                      }
                    >
                      View
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
