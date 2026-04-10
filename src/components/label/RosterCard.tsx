import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Calendar,
  BarChart3,
  User,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface RosterMetric {
  artist_handle: string;
  artist_name: string;
  avatar_url: string | null;
  momentum_tier: string | null;
  performance_ratio_current: number | null;
  days_since_last_post: number | null;
  risk_level: string | null;
  release_readiness_score: number | null;
  risk_flags: Array<{ severity: string; message: string }> | null;
  pipeline_status: string | null;
  has_content_plan?: boolean;
  has_intelligence_report?: boolean;
  has_30day_plan?: boolean;
  has_artist_brief?: boolean;
}

const tierConfig: Record<
  string,
  { label: string; bg: string; text: string; cardTint: string }
> = {
  viral: {
    label: "Viral",
    bg: "bg-purple-600",
    text: "text-white",
    cardTint: "bg-purple-500/5",
  },
  breakout: {
    label: "Breakout",
    bg: "bg-green-500",
    text: "text-white",
    cardTint: "bg-green-500/5",
  },
  momentum: {
    label: "Momentum",
    bg: "bg-[#e8430a]",
    text: "text-white",
    cardTint: "bg-orange-500/5",
  },
  stable: {
    label: "Stable",
    bg: "bg-gray-600",
    text: "text-gray-200",
    cardTint: "",
  },
  stalled: {
    label: "Stalled",
    bg: "bg-red-600",
    text: "text-white",
    cardTint: "bg-red-500/5",
  },
};

export function getPostingTier(days: number | null) {
  if (days == null)
    return {
      label: "—",
      badgeBg: "#4b5563",
      badgeText: "#e5e7eb",
      daysColor: undefined,
      showWarning: false,
    };
  if (days <= 2)
    return {
      label: "ACTIVE",
      badgeBg: "#30D158",
      badgeText: "#fff",
      daysColor: "#30D158",
      showWarning: false,
    };
  if (days <= 4)
    return {
      label: "STABLE",
      badgeBg: "#0A84FF",
      badgeText: "#fff",
      daysColor: undefined,
      showWarning: false,
    };
  if (days <= 7)
    return {
      label: "COOLING",
      badgeBg: "#FFD60A",
      badgeText: "#000",
      daysColor: "#FFD60A",
      showWarning: false,
    };
  return {
    label: "INACTIVE",
    badgeBg: "#FF453A",
    badgeText: "#fff",
    daysColor: "#FF453A",
    showWarning: true,
  };
}

function ReadinessCircle({ value }: { value: number }) {
  const size = 32;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color =
    value >= 70
      ? "hsl(142 71% 45%)"
      : value >= 40
        ? "hsl(38 92% 50%)"
        : "hsl(0 72% 51%)";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="hsl(0 0% 80%)"
        fontSize="9"
        fontWeight="600"
      >
        {value}
      </text>
    </svg>
  );
}

export default function RosterCard({
  artist,
  onClick,
  alertDot,
  onOpenDeliverable,
}: {
  artist: RosterMetric;
  onClick: () => void;
  alertDot?: "celebration" | "warning";
  onOpenDeliverable?: (
    handle: string,
    type: "report" | "plan" | "plan30" | "brief",
  ) => void;
}) {
  const tier =
    tierConfig[artist.momentum_tier?.toLowerCase() || "stable"] ||
    tierConfig.stable;
  const days = artist.days_since_last_post;
  const postingTier = getPostingTier(days);
  const daysText = days != null ? `${days}d ago` : "–";
  const risk = artist.risk_level?.toLowerCase();
  const readiness = artist.release_readiness_score ?? 0;

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02, y: -3 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="group relative rounded-xl border border-border hover:border-primary/40 p-4 cursor-pointer"
        style={{ background: "var(--surface, hsl(0 0% 5%))" }}
      >
        {/* Top row: avatar + name + risk dot */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage
              src={artist.avatar_url || ""}
              alt={artist.artist_name}
            />
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {(artist.artist_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
              {artist.artist_name}
              {alertDot && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${alertDot === "celebration" ? "bg-green-400" : "bg-amber-400"}`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${alertDot === "celebration" ? "bg-green-500" : "bg-amber-500"}`}
                  />
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{artist.artist_handle?.replace(/^@+/, "")}
            </p>
          </div>
          {risk === "critical" && (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1" />
          )}
          {risk === "warning" && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1" />
          )}
        </div>

        {/* Tier badge + perf ratio */}
        <div className="flex items-center justify-between mt-3">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
            style={{
              background: postingTier.badgeBg,
              color: postingTier.badgeText,
            }}
          >
            {postingTier.label}
          </span>
          <span className="text-base font-bold text-foreground tabular-nums">
            {artist.performance_ratio_current != null
              ? `${artist.performance_ratio_current.toFixed(1)}x`
              : "–"}
          </span>
        </div>

        {/* Bottom row: days + readiness */}
        <div className="flex items-center justify-between mt-3">
          <span
            className={`flex items-center gap-1 text-xs ${!postingTier.daysColor ? "text-muted-foreground" : ""}`}
            style={
              postingTier.daysColor
                ? { color: postingTier.daysColor }
                : undefined
            }
          >
            {postingTier.showWarning && <AlertTriangle size={12} />}
            {daysText}
          </span>
          <ReadinessCircle value={readiness} />
        </div>
        {/* Deliverable quick-access */}
        {onOpenDeliverable && (
          <div
            className="flex items-center gap-2 mt-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  disabled={!artist.has_content_plan && !artist.has_30day_plan}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30"
                  style={{
                    background: "#2C2C2E",
                    color: "rgba(255,255,255,0.87)",
                  }}
                >
                  Plans
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  disabled={!artist.has_content_plan}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeliverable(artist.artist_handle, "plan");
                  }}
                >
                  <Calendar size={14} className="mr-2" />
                  7-Day Plan
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!artist.has_30day_plan}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeliverable(artist.artist_handle, "plan30");
                  }}
                >
                  <BarChart3 size={14} className="mr-2" />
                  30-Day Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  disabled={!artist.has_artist_brief}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-30"
                  style={{
                    background: "#2C2C2E",
                    color: "rgba(255,255,255,0.87)",
                  }}
                >
                  Briefs
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  disabled={!artist.has_artist_brief}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeliverable(artist.artist_handle, "brief");
                  }}
                >
                  <User size={14} className="mr-2" />
                  Artist Brief
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
