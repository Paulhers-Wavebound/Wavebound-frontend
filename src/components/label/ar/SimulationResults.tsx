/**
 * Simulation Results — Right column of the Simulation Lab.
 * Tabbed display: Projection, Risk Analysis, Signal Report, Sign-Off.
 * Grounded in 2026 deal data with dual IRR, fan charts, and insights.
 */
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EnhancedSimulationResult } from "@/types/arTypes";
import type { SensitivityPoint } from "@/utils/simulationEngine";

/* ─── Formatters ──────────────────────────────────────────── */

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/* ─── Color helpers ───────────────────────────────────────── */

function irrColor(irr: number): string {
  if (irr >= 10) return "#30D158";
  if (irr >= 5) return "#FFD60A";
  return "#FF453A";
}

function breakevenColor(months: number): string {
  if (months === -1) return "#FF453A";
  if (months <= 24) return "#30D158";
  if (months <= 48) return "#FFD60A";
  return "#FF453A";
}

function recoupProbColor(pct: number): string {
  if (pct >= 70) return "#30D158";
  if (pct >= 40) return "#FFD60A";
  return "#FF453A";
}

/* ─── Sign-off step icon ──────────────────────────────────── */

function StepIcon({ status }: { status: string }) {
  if (status === "approved")
    return <CheckCircle2 size={16} style={{ color: "#30D158" }} />;
  if (status === "pending")
    return <Clock size={16} style={{ color: "#FFD60A" }} />;
  if (status === "rejected")
    return <Circle size={16} style={{ color: "#FF453A" }} />;
  return <Circle size={16} style={{ color: "rgba(255,255,255,0.15)" }} />;
}

/* ─── Insight icon ────────────────────────────────────────── */

function InsightIcon({ type }: { type: "positive" | "warning" | "critical" }) {
  if (type === "positive")
    return <TrendingUp size={14} style={{ color: "#30D158" }} />;
  if (type === "warning")
    return <AlertTriangle size={14} style={{ color: "#FFD60A" }} />;
  return <ShieldAlert size={14} style={{ color: "#FF453A" }} />;
}

const insightBorderColor = {
  positive: "#30D158",
  warning: "#FFD60A",
  critical: "#FF453A",
};

/* ─── Custom Recharts Tooltip ─────────────────────────────── */

const chartTooltipStyle = {
  background: "#1C1C1E",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8,
  fontSize: 11,
};

/* ─── Component ───────────────────────────────────────────── */

export default function SimulationResults({
  result,
  sensitivityData,
}: {
  result: EnhancedSimulationResult;
  sensitivityData?: SensitivityPoint[] | null;
}) {
  return (
    <div className="space-y-5">
      {/* ── Hero Stats ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Label IRR */}
        <div className="px-3 py-3 rounded-lg border border-white/[0.04]">
          <span className="text-[9px] text-white/30 uppercase tracking-wider block">
            Label IRR
          </span>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: irrColor(result.labelIRR),
            }}
          >
            {fmtPct(result.labelIRR)}
          </span>
          <span className="text-[9px] text-white/20 block">Target: 10-15%</span>
        </div>

        {/* Artist IRR */}
        <div className="px-3 py-3 rounded-lg border border-white/[0.04]">
          <span className="text-[9px] text-white/30 uppercase tracking-wider block">
            Artist IRR
          </span>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: irrColor(result.artistIRR),
            }}
          >
            {fmtPct(result.artistIRR)}
          </span>
        </div>

        {/* Breakeven */}
        <div className="px-3 py-3 rounded-lg border border-white/[0.04]">
          <span className="text-[9px] text-white/30 uppercase tracking-wider block">
            Break-even
          </span>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: breakevenColor(result.breakevenMonths),
            }}
          >
            {result.breakevenMonths === -1 ? "Never" : result.breakevenMonths}
          </span>
          {result.breakevenMonths !== -1 && (
            <span className="text-[9px] text-white/20 block">months</span>
          )}
        </div>

        {/* Recoupment Probability */}
        <div className="px-3 py-3 rounded-lg border border-white/[0.04]">
          <span className="text-[9px] text-white/30 uppercase tracking-wider block">
            Recoup Prob.
          </span>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: recoupProbColor(result.probabilityOfRecoupment),
            }}
          >
            {result.probabilityOfRecoupment.toFixed(0)}%
          </span>
          <div className="w-full h-1 rounded-full bg-white/[0.04] mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${result.probabilityOfRecoupment}%`,
                background: recoupProbColor(result.probabilityOfRecoupment),
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Compute metadata ──────────────────────────── */}
      <div className="flex items-center gap-3 text-[9px] text-white/15">
        <span className="flex items-center gap-1">
          <Zap size={10} />
          {result.iterationsRun.toLocaleString()} iterations
        </span>
        <span>{result.computeTimeMs.toFixed(0)}ms</span>
        <span>
          ROI: Label {result.labelROI.toFixed(2)}x / Artist{" "}
          {result.artistROI.toFixed(2)}x
        </span>
      </div>

      {/* ── Tabbed Results ────────────────────────────── */}
      <Tabs defaultValue="projection" className="w-full">
        <TabsList
          className="w-full justify-start gap-0 h-auto p-0 rounded-none border-b border-white/[0.06]"
          style={{ background: "transparent" }}
        >
          {[
            { value: "projection", label: "Projection" },
            { value: "sensitivity", label: "Sensitivity" },
            { value: "risk", label: "Risk" },
            { value: "signals", label: "Signals" },
            { value: "signoff", label: "Sign-Off" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[11px] font-medium rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-[#e8430a] data-[state=active]:text-white/80 text-white/35 hover:text-white/50 transition-colors"
              style={{ background: "transparent" }}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab: Projection ──────────────────────────── */}
        <TabsContent value="projection" className="mt-4 space-y-5">
          {/* Monte Carlo Fan Chart */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
              Revenue Projection (Monte Carlo Fan)
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={result.projectionTimeline}>
                <defs>
                  <linearGradient id="sim-p90-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BF5AF2" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#BF5AF2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sim-p75-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BF5AF2" stopOpacity={0.15} />
                    <stop
                      offset="100%"
                      stopColor="#BF5AF2"
                      stopOpacity={0.03}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `M${v}`}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.20)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtCurrency(v)}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number, name: string) => [
                    fmtCurrency(value),
                    name === "p50" ? "Median" : name.toUpperCase(),
                  ]}
                  labelFormatter={(v) => `Month ${v}`}
                />
                {/* P10-P90 outer band */}
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="none"
                  fill="url(#sim-p90-grad)"
                  fillOpacity={1}
                />
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="none"
                  fill="#1C1C1E"
                  fillOpacity={1}
                />
                {/* P25-P75 inner band */}
                <Area
                  type="monotone"
                  dataKey="p75"
                  stroke="none"
                  fill="url(#sim-p75-grad)"
                  fillOpacity={1}
                />
                <Area
                  type="monotone"
                  dataKey="p25"
                  stroke="none"
                  fill="#1C1C1E"
                  fillOpacity={1}
                />
                {/* P50 median line */}
                <Area
                  type="monotone"
                  dataKey="p50"
                  stroke="#BF5AF2"
                  strokeWidth={2}
                  fill="none"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[9px] text-white/25">
                <span
                  className="w-3 h-1.5 rounded-sm"
                  style={{ background: "rgba(191,90,242,0.15)" }}
                />
                P25–P75
              </span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/25">
                <span
                  className="w-3 h-1.5 rounded-sm"
                  style={{ background: "rgba(191,90,242,0.08)" }}
                />
                P10–P90
              </span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/25">
                <span
                  className="w-5 h-0.5 rounded-sm"
                  style={{ background: "#BF5AF2" }}
                />
                Median
              </span>
            </div>
          </div>

          {/* Recoupment Timeline */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
              Recoupment Timeline (Avg. Cumulative)
            </h4>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={result.recoupmentTimeline}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `M${v}`}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.20)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtCurrency(v)}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number, name: string) => [
                    fmtCurrency(value),
                    name === "cumulativeLabel" ? "Label" : "Artist",
                  ]}
                  labelFormatter={(v) => `Month ${v}`}
                />
                <ReferenceLine
                  y={0}
                  stroke="rgba(255,255,255,0.10)"
                  strokeDasharray="4 3"
                  label={{
                    value: "Break-even",
                    fill: "rgba(255,255,255,0.20)",
                    fontSize: 10,
                    position: "right",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeLabel"
                  stroke="#30D158"
                  strokeWidth={2}
                  dot={false}
                  name="cumulativeLabel"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeArtist"
                  stroke="#0A84FF"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="6 3"
                  name="cumulativeArtist"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[9px] text-white/25">
                <span
                  className="w-5 h-0.5 rounded-sm"
                  style={{ background: "#30D158" }}
                />
                Label Cumulative
              </span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/25">
                <span
                  className="w-5 h-0.5 rounded-sm"
                  style={{
                    background: "#0A84FF",
                    backgroundImage:
                      "repeating-linear-gradient(90deg, #0A84FF 0 4px, transparent 4px 7px)",
                  }}
                />
                Artist Cumulative
              </span>
            </div>
          </div>

          {/* Distribution Table */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
              Outcome Distribution
            </h4>
            <div className="grid grid-cols-7 gap-1">
              {result.monteCarloDistribution.map((p) => (
                <div key={p.percentile} className="text-center">
                  <span className="text-[9px] text-white/20 block">
                    P{p.percentile}
                  </span>
                  <span
                    className="text-[11px] font-semibold tabular-nums block"
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {fmtCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Sensitivity Analysis ──────────────── */}
        <TabsContent value="sensitivity" className="mt-4 space-y-5">
          {sensitivityData && sensitivityData.length > 0 ? (
            <>
              <div>
                <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
                  IRR vs Advance Size
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={sensitivityData}>
                    <XAxis
                      dataKey="advance"
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmtCurrency(v)}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.20)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}%`,
                        name === "labelIRR" ? "Label IRR" : "Artist IRR",
                      ]}
                      labelFormatter={(v) =>
                        `Advance: ${fmtCurrency(v as number)}`
                      }
                    />
                    <ReferenceLine
                      y={10}
                      stroke="rgba(48,209,88,0.3)"
                      strokeDasharray="4 3"
                      label={{
                        value: "10% target",
                        fill: "rgba(255,255,255,0.15)",
                        fontSize: 9,
                        position: "right",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="labelIRR"
                      stroke="#30D158"
                      strokeWidth={2}
                      dot={{ fill: "#30D158", r: 3 }}
                      name="labelIRR"
                    />
                    <Line
                      type="monotone"
                      dataKey="artistIRR"
                      stroke="#0A84FF"
                      strokeWidth={2}
                      dot={{ fill: "#0A84FF", r: 3 }}
                      name="artistIRR"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] text-white/25">
                    <span
                      className="w-5 h-0.5 rounded-sm"
                      style={{ background: "#30D158" }}
                    />
                    Label IRR
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] text-white/25">
                    <span
                      className="w-5 h-0.5 rounded-sm"
                      style={{ background: "#0A84FF" }}
                    />
                    Artist IRR
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
                  Recoupment Probability vs Advance Size
                </h4>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={sensitivityData}>
                    <defs>
                      <linearGradient
                        id="sim-recoup-grad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#FF9F0A"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#FF9F0A"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="advance"
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmtCurrency(v)}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.20)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number) => [
                        `${value.toFixed(0)}%`,
                        "Recoup Probability",
                      ]}
                      labelFormatter={(v) =>
                        `Advance: ${fmtCurrency(v as number)}`
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="recoupProbability"
                      stroke="#FF9F0A"
                      fill="url(#sim-recoup-grad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Data table */}
              <div>
                <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
                  Advance Sensitivity Table
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-white/25 border-b border-white/[0.04]">
                        <th className="text-left py-1.5 pr-3 font-semibold">
                          Advance
                        </th>
                        <th className="text-right py-1.5 px-2 font-semibold">
                          Label IRR
                        </th>
                        <th className="text-right py-1.5 px-2 font-semibold">
                          Artist IRR
                        </th>
                        <th className="text-right py-1.5 px-2 font-semibold">
                          Break-even
                        </th>
                        <th className="text-right py-1.5 pl-2 font-semibold">
                          Recoup %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivityData.map((row) => (
                        <tr
                          key={row.advance}
                          className="border-b border-white/[0.02]"
                        >
                          <td
                            className="py-1.5 pr-3 tabular-nums text-white/50"
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                            }}
                          >
                            {fmtCurrency(row.advance)}
                          </td>
                          <td
                            className="text-right py-1.5 px-2 tabular-nums"
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              color: irrColor(row.labelIRR),
                            }}
                          >
                            {row.labelIRR.toFixed(1)}%
                          </td>
                          <td
                            className="text-right py-1.5 px-2 tabular-nums"
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              color: irrColor(row.artistIRR),
                            }}
                          >
                            {row.artistIRR.toFixed(1)}%
                          </td>
                          <td
                            className="text-right py-1.5 px-2 tabular-nums"
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              color: breakevenColor(row.breakevenMonths),
                            }}
                          >
                            {row.breakevenMonths === -1
                              ? "Never"
                              : `${row.breakevenMonths}mo`}
                          </td>
                          <td
                            className="text-right py-1.5 pl-2 tabular-nums"
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              color: recoupProbColor(row.recoupProbability),
                            }}
                          >
                            {row.recoupProbability.toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-[13px] text-white/30">
                No sensitivity data available.
              </p>
              <p className="text-[11px] text-white/15 mt-1">
                Run a simulation to see how outcomes change across advance
                sizes.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Risk Analysis ───────────────────────── */}
        <TabsContent value="risk" className="mt-4 space-y-5">
          {result.riskBreakdown.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-white/30">
                No risk factors selected.
              </p>
              <p className="text-[11px] text-white/15 mt-1">
                Toggle risk factors in the controls to see their impact.
              </p>
            </div>
          ) : (
            <>
              {/* Aggregate multiplier */}
              <div className="px-4 py-3 rounded-lg border border-white/[0.04]">
                <span className="text-[10px] text-white/30 uppercase tracking-wider block">
                  Aggregate Risk Multiplier
                </span>
                <span
                  className="text-[28px] font-bold tabular-nums"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color:
                      result.aggregateRiskMultiplier >= 0.8
                        ? "#FFD60A"
                        : "#FF453A",
                  }}
                >
                  {result.aggregateRiskMultiplier.toFixed(2)}x
                </span>
                <span className="text-[9px] text-white/20 block">
                  Effective return reduced by{" "}
                  {((1 - result.aggregateRiskMultiplier) * 100).toFixed(0)}%
                </span>
              </div>

              {/* Individual risk factors */}
              <div className="space-y-3">
                {result.riskBreakdown.map((risk) => (
                  <div
                    key={risk.id}
                    className="px-4 py-3 rounded-lg border border-white/[0.04]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-medium text-white/60">
                        {risk.label}
                      </span>
                      <span
                        className="text-[11px] font-bold tabular-nums"
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: risk.color,
                        }}
                      >
                        {risk.appliedMultiplier < 1
                          ? `${((1 - risk.appliedMultiplier) * 100).toFixed(0)}% reduction`
                          : `+${((risk.appliedMultiplier - 1) * 100).toFixed(0)}% penalty`}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed">
                      {risk.description}
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.04] mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(Math.abs(risk.impactPct), 100)}%`,
                          background: risk.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Tab: Signal Report ────────────────────────── */}
        <TabsContent value="signals" className="mt-4 space-y-3">
          <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-2">
            Key Insights & Recommendations
          </h4>
          {result.insights.length === 0 ? (
            <p className="text-[13px] text-white/25 text-center py-8">
              No notable signals for this configuration.
            </p>
          ) : (
            result.insights.map((insight, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-lg border border-white/[0.04]"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: insightBorderColor[insight.type],
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <InsightIcon type={insight.type} />
                  <span className="text-[12px] font-semibold text-white/70">
                    {insight.title}
                  </span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed pl-[22px]">
                  {insight.detail}
                </p>
              </div>
            ))
          )}
        </TabsContent>

        {/* ── Tab: Sign-Off ────────────────────────────── */}
        <TabsContent value="signoff" className="mt-4 space-y-4">
          {/* Approval probability */}
          <div className="px-4 py-3 rounded-lg border border-white/[0.04]">
            <span className="text-[10px] text-white/30 uppercase tracking-wider block">
              Approval Probability
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-[24px] font-bold tabular-nums"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  color: recoupProbColor(result.approvalProbability),
                }}
              >
                {result.approvalProbability.toFixed(0)}%
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${result.approvalProbability}%`,
                    background: recoupProbColor(result.approvalProbability),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sign-off chain */}
          <div>
            <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-3">
              Approval Chain
            </h4>
            <div className="space-y-0">
              {result.signOffChain.map((step, i) => {
                const isLast = i === result.signOffChain.length - 1;
                return (
                  <div key={step.role}>
                    {i > 0 && (
                      <div className="pl-[7px] py-0">
                        <div className="w-px h-3 bg-white/[0.08]" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 py-1.5">
                      <StepIcon status={step.status} />
                      <span
                        className={`text-[12px] flex-1 ${
                          step.status === "approved"
                            ? "text-white/60"
                            : step.status === "pending"
                              ? "text-white/70 font-medium"
                              : "text-white/30"
                        }`}
                      >
                        {step.role}
                      </span>
                      <span
                        className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                        style={{
                          color:
                            step.status === "approved"
                              ? "#30D158"
                              : step.status === "pending"
                                ? "#FFD60A"
                                : "rgba(255,255,255,0.25)",
                          background:
                            step.status === "approved"
                              ? "rgba(48,209,88,0.12)"
                              : step.status === "pending"
                                ? "rgba(255,214,10,0.12)"
                                : "rgba(255,255,255,0.04)",
                        }}
                      >
                        {step.status.replace("_", " ")}
                      </span>
                      {isLast && step.role.includes("SMG") && (
                        <span className="text-[9px] text-white/20 ml-1">
                          (&gt;$2M only)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
