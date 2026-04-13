import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

// ── Helpers ──────────────────────────────────────────────────────────────

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Math.round(n)}%`;
}

function readinessRingColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

const factorLabels: Record<string, string> = {
  posting_active: "Active posting (last 3 days)",
  posting_consistent: "Consistent schedule",
  audience_warm: "Audience above baseline",
  engagement_healthy: "Healthy engagement rate",
  momentum_positive: "Positive momentum",
  not_stalled: "Not stalled",
};

// ── Sub-components ───────────────────────────────────────────────────────

function DeltaCard({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  const isNull = value == null;
  const isPositive = !isNull && value! > 0;
  const isNegative = !isNull && value! < 0;

  const colorClass = isPositive
    ? "text-green-400"
    : isNegative
      ? "text-red-400"
      : "text-muted-foreground";

  return (
    <Card className="p-3 bg-card border-border flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-lg font-bold flex items-center gap-1 ${colorClass}`}
      >
        {isPositive && <ArrowUp className="w-3.5 h-3.5" />}
        {isNegative && <ArrowDown className="w-3.5 h-3.5" />}
        {isNull ? "—" : fmtPct(value)}
      </span>
    </Card>
  );
}

function ReadinessGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = readinessRingColor(score);

  return (
    <div className="flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-2xl font-bold"
          fontSize="28"
        >
          {score}
        </text>
      </svg>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

interface ProfileSidebarProps {
  /** Hide impact delta on universal portal */
  showImpactDelta: boolean;
  hasBaseline: boolean;
  deltaAvgViews: number | null;
  deltaEngagement: number | null;
  deltaPostingFreq: number | null;
  deltaFollowers: number | null;
  baselineDate: string | null;
  releaseReadinessScore: number | null;
  latestReleaseName: string | null;
  latestReleaseDaysAgo: number | null;
  readinessFactors: Record<string, boolean>;
}

export default function ProfileSidebar({
  showImpactDelta,
  hasBaseline,
  deltaAvgViews,
  deltaEngagement,
  deltaPostingFreq,
  deltaFollowers,
  baselineDate,
  releaseReadinessScore,
  latestReleaseName,
  latestReleaseDaysAgo,
  readinessFactors,
}: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Impact Delta */}
      {showImpactDelta && hasBaseline && (
        <Card className="p-6 bg-card border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Wavebound Impact Delta
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <DeltaCard label="Avg Views" value={deltaAvgViews} />
            <DeltaCard label="Engagement" value={deltaEngagement} />
            <DeltaCard label="Post Frequency" value={deltaPostingFreq} />
            <DeltaCard label="Followers" value={deltaFollowers} />
          </div>
          {(() => {
            const allNull = [
              deltaAvgViews,
              deltaEngagement,
              deltaPostingFreq,
              deltaFollowers,
            ].every((v) => v == null);
            if (allNull) {
              return (
                <p className="text-xs text-muted-foreground mt-3 text-center italic">
                  Impact tracking begins after next data refresh
                </p>
              );
            }
            if (baselineDate) {
              return (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Compared to onboarding baseline on{" "}
                  {format(new Date(baselineDate), "MMM d, yyyy")}
                </p>
              );
            }
            return null;
          })()}
        </Card>
      )}

      {/* Release Readiness */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Release Readiness
        </h2>
        <ReadinessGauge score={releaseReadinessScore ?? 0} />

        {latestReleaseName && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {latestReleaseName}
            {latestReleaseDaysAgo != null &&
              ` · released ${latestReleaseDaysAgo}d ago`}
          </p>
        )}

        {/* Factor checklist */}
        <div className="mt-4 space-y-2">
          {Object.entries(factorLabels).map(([key, label]) => {
            const passed = readinessFactors[key] ?? false;
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                {passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span
                  className={
                    passed ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
