/**
 * Simulation Controls — Left column of the Simulation Lab.
 * Preset-driven deal configuration with real 2026 market data.
 */
import type {
  DealType,
  DealPreset,
  SimulationState,
  RiskFactorId,
} from "@/types/arTypes";
import { DEAL_PRESETS, RISK_FACTOR_DEFINITIONS } from "@/data/dealPresets";
import { MOCK_AR_PROSPECTS } from "@/data/mockARData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

/* ─── Formatters ──────────────────────────────────────────── */

function fmtCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

/* ─── Risk Factor IDs (ordered by severity) ──────────────── */

const RISK_FACTOR_IDS: RiskFactorId[] = [
  "cross_collateralization",
  "fuzzy_recoupment",
  "navil_perpetuity",
  "ai_walled_garden",
  "audit_barriers",
];

/* ─── Props ───────────────────────────────────────────────── */

interface Props {
  state: SimulationState;
  activePreset: DealPreset;
  activePresetId: DealType | "custom";
  onChange: (partial: Partial<SimulationState>) => void;
  onPresetSelect: (presetId: DealType) => void;
  onRun: () => void;
}

/* ─── Component ───────────────────────────────────────────── */

export default function SimulationControls({
  state,
  activePreset,
  activePresetId,
  onChange,
  onPresetSelect,
  onRun,
}: Props) {
  const toggleRisk = (factor: RiskFactorId) => {
    const next = state.riskFactors.includes(factor)
      ? state.riskFactors.filter((f) => f !== factor)
      : [...state.riskFactors, factor];
    onChange({ riskFactors: next });
  };

  const advanceStep =
    activePreset.advanceRange.max <= 100000
      ? 1000
      : activePreset.advanceRange.max <= 300000
        ? 5000
        : activePreset.advanceRange.max <= 1000000
          ? 25000
          : 50000;

  return (
    <div className="space-y-5">
      {/* ── Preset Selector ─────────────────────────────── */}
      <div>
        <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 block mb-2">
          Deal Preset
        </label>
        <select
          value={activePresetId}
          onChange={(e) => {
            if (e.target.value !== "custom") {
              onPresetSelect(e.target.value as DealType);
            }
          }}
          className="w-full text-[13px] bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-white/70 outline-none"
        >
          {DEAL_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — {fmtCurrency(p.advanceRange.min)}–
              {fmtCurrency(p.advanceRange.max)}
            </option>
          ))}
          {activePresetId === "custom" && (
            <option value="custom">Custom Configuration</option>
          )}
        </select>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 border-white/[0.06]"
            style={{
              color:
                activePresetId === "custom"
                  ? "rgba(255,255,255,0.35)"
                  : activePreset.color,
            }}
          >
            {activePresetId === "custom" ? "Custom" : activePreset.shortLabel}
          </Badge>
          {activePreset.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25"
            >
              {tag}
            </span>
          ))}
        </div>
        {activePresetId !== "custom" && (
          <p className="text-[10px] text-white/20 mt-1.5 leading-relaxed">
            {activePreset.description}
          </p>
        )}
      </div>

      {/* ── Artist Selector ─────────────────────────────── */}
      <div>
        <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 block mb-2">
          Artist
        </label>
        <select
          value={state.artistId}
          onChange={(e) => onChange({ artistId: e.target.value })}
          className="w-full text-[13px] bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/70 outline-none"
        >
          {MOCK_AR_PROSPECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.artist_name} — Rise {p.rise_probability.toFixed(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Deal Parameters ─────────────────────────────── */}
      <div className="rounded-lg border border-white/[0.04] p-4 space-y-4">
        <h4 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 -mt-1">
          Deal Parameters
        </h4>

        {/* Advance */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 flex items-center justify-between mb-1.5">
            <span>Advance</span>
            <span
              className="text-[13px] font-bold tabular-nums normal-case"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: activePreset.color,
              }}
            >
              {fmtCurrency(state.advanceAmount)}
            </span>
          </label>
          <input
            type="range"
            min={activePreset.advanceRange.min}
            max={activePreset.advanceRange.max}
            step={advanceStep}
            value={state.advanceAmount}
            onChange={(e) =>
              onChange({ advanceAmount: Number(e.target.value) })
            }
            className="w-full accent-[#e8430a]"
          />
          <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
            <span>{fmtCurrency(activePreset.advanceRange.min)}</span>
            <span className="text-white/10">
              med: {fmtCurrency(activePreset.advanceRange.median)}
            </span>
            <span>{fmtCurrency(activePreset.advanceRange.max)}</span>
          </div>
        </div>

        {/* Artist Royalty % */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 flex items-center justify-between mb-1.5">
            <span>Artist Royalty</span>
            <span
              className="text-[13px] font-bold tabular-nums normal-case"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(255,255,255,0.70)",
              }}
            >
              {state.artistRoyaltyPct}%
            </span>
          </label>
          <input
            type="range"
            min={activePreset.royaltyRange.min}
            max={activePreset.royaltyRange.max}
            step={1}
            value={state.artistRoyaltyPct}
            onChange={(e) =>
              onChange({ artistRoyaltyPct: Number(e.target.value) })
            }
            className="w-full accent-[#e8430a]"
          />
          <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
            <span>{activePreset.royaltyRange.min}%</span>
            <span>{activePreset.royaltyRange.max}%</span>
          </div>
        </div>

        {/* Term Length */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 flex items-center justify-between mb-1.5">
            <span>Term Length</span>
            <span
              className="text-[13px] font-bold tabular-nums normal-case"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(255,255,255,0.70)",
              }}
            >
              {state.termLengthYears}yr
            </span>
          </label>
          <input
            type="range"
            min={activePreset.termRange.min}
            max={activePreset.termRange.max}
            step={1}
            value={state.termLengthYears}
            onChange={(e) =>
              onChange({ termLengthYears: Number(e.target.value) })
            }
            className="w-full accent-[#e8430a]"
          />
          <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
            <span>{activePreset.termRange.min}yr</span>
            <span>{activePreset.termRange.max}yr</span>
          </div>
        </div>

        {/* Recoupment Model */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 block mb-2">
            Recoupment Model
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["at_royalty", "net_profit"] as const).map((model) => {
              const active = state.recoupmentModel === model;
              const label =
                model === "at_royalty" ? "At Royalty" : "Net Profit";
              const sub =
                model === "at_royalty"
                  ? "Recoups from artist share"
                  : "Recoups from total";
              return (
                <button
                  key={model}
                  onClick={() => onChange({ recoupmentModel: model })}
                  className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    active
                      ? "border-white/[0.12] bg-white/[0.04]"
                      : "border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]"
                  }`}
                >
                  <span
                    className="text-[11px] font-semibold block"
                    style={{
                      color: active ? "#e8430a" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {label}
                  </span>
                  <span className="text-[9px] text-white/20 block">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Term Structure ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 block mb-2">
            Firm Albums
          </label>
          <select
            value={state.firmAlbums}
            onChange={(e) => onChange({ firmAlbums: Number(e.target.value) })}
            className="w-full text-[12px] bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/60 outline-none"
          >
            {[0, 1, 2].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 block mb-2">
            Option Albums
          </label>
          <select
            value={state.optionAlbums}
            onChange={(e) => onChange({ optionAlbums: Number(e.target.value) })}
            className="w-full text-[12px] bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/60 outline-none"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 360 Clauses ─────────────────────────────────── */}
      <div
        className={
          !activePreset.has360 &&
          state.livePct === 0 &&
          state.merchPct === 0 &&
          state.endorsementPct === 0
            ? "opacity-30 pointer-events-none"
            : ""
        }
      >
        <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 flex items-center gap-2 mb-2">
          360 Clauses
          {!activePreset.has360 && (
            <span className="text-[8px] text-white/15 normal-case tracking-normal">
              Not applicable for this deal type
            </span>
          )}
        </label>
        <div className="space-y-3">
          {[
            { label: "Live Touring", key: "livePct" as const, min: 0, max: 35 },
            { label: "Merch", key: "merchPct" as const, min: 0, max: 45 },
            {
              label: "Endorsements",
              key: "endorsementPct" as const,
              min: 0,
              max: 40,
            },
          ].map((clause) => (
            <div key={clause.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white/50">
                  {clause.label}
                </span>
                <span
                  className="text-[11px] tabular-nums text-white/55"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {state[clause.key]}%
                </span>
              </div>
              <input
                type="range"
                min={clause.min}
                max={clause.max}
                value={state[clause.key]}
                onChange={(e) =>
                  onChange({ [clause.key]: Number(e.target.value) })
                }
                className="w-full accent-[#e8430a]"
              />
              <div className="flex justify-between text-[9px] text-white/15 mt-0.5">
                <span>{clause.min}%</span>
                <span>{clause.max}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Risk Factors ────────────────────────────────── */}
      <div>
        <label className="text-[10px] font-semibold tracking-wider uppercase text-white/30 block mb-2">
          Risk Factors
        </label>
        <TooltipProvider delayDuration={200}>
          <div className="space-y-1">
            {RISK_FACTOR_IDS.map((riskId) => {
              const def = RISK_FACTOR_DEFINITIONS[riskId];
              const checked = state.riskFactors.includes(riskId);
              return (
                <div
                  key={riskId}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRisk(riskId)}
                      className="accent-[#FF453A]"
                    />
                    <span
                      className={`text-[11px] ${checked ? "text-white/60" : "text-white/35"}`}
                    >
                      {def.label}
                    </span>
                  </label>
                  <span
                    className="text-[9px] tabular-nums font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      color: def.color,
                      background: `${def.color}15`,
                    }}
                  >
                    {def.impactDescription.split(" ")[0]}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-white/15 hover:text-white/35 transition-colors">
                        <Info size={12} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="max-w-[240px] text-[11px]"
                      style={{
                        background: "#2C2C2E",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p
                        className="font-semibold mb-1"
                        style={{ color: def.color }}
                      >
                        {def.impactDescription}
                      </p>
                      <p className="text-white/50 leading-relaxed">
                        {def.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* ── Run Button ──────────────────────────────────── */}
      <button
        onClick={onRun}
        className="w-full py-3 rounded-lg text-[13px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: "#e8430a" }}
      >
        Run Simulation
      </button>
    </div>
  );
}
