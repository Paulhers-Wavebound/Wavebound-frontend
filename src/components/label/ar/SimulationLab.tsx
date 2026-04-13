/**
 * Simulation Lab — Two-column deal scenario builder + results.
 * Wires preset system, Monte Carlo engine, sensitivity analysis,
 * PDF export, and rich result display.
 * Grounded in 2026 record label deal data.
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Send,
  Bookmark,
  Save,
  Check,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MOCK_AR_PROSPECTS } from "@/data/mockARData";
import { DEAL_PRESETS } from "@/data/dealPresets";
import {
  runSimulation,
  runSensitivityAnalysis,
  type SensitivityPoint,
} from "@/utils/simulationEngine";
import { generateGreenlightPdf } from "@/utils/simulationPdf";
import type {
  DealType,
  DealPreset,
  SimulationState,
  EnhancedSimulationResult,
} from "@/types/arTypes";
import SimulationControls from "./SimulationControls";
import SimulationResults from "./SimulationResults";
import ArtistStatsPanel from "./ArtistStatsPanel";

/* ─── Send recipients (Bible §5 sign-off chain) ─────────── */

const SEND_RECIPIENTS = [
  { id: "council", label: "A&R Council", role: "Full council review" },
  { id: "ron_perry", label: "Ron Perry", role: "Chairman, Columbia" },
  { id: "justin_eshak", label: "Justin Eshak", role: "Co-Head of A&R" },
  { id: "imran_majid", label: "Imran Majid", role: "Co-Head of A&R" },
  { id: "manos", label: "Manos", role: "EVP, Columbia" },
  { id: "julie_swidler", label: "Julie Swidler", role: "EVP Business & Legal" },
  { id: "business_affairs", label: "Business Affairs", role: "Legal review" },
  { id: "finance", label: "SVP Finance", role: "Budget & ROI sign-off" },
];

function SendButton({ onSend }: { onSend: (action: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.06] text-[12px] text-white/50 hover:text-white/70 hover:border-white/[0.12] transition-colors">
          <Send size={14} />
          Send
          <ChevronDown size={10} className="ml-0.5 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[240px] p-1"
        style={{
          background: "#1C1C1E",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {SEND_RECIPIENTS.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              onSend(`Send to ${r.label}`);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-white/[0.04] transition-colors"
          >
            <div
              className="text-[12px] font-medium"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {r.label}
            </div>
            <div className="text-[10px] text-white/30">{r.role}</div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Preset Comparison ──────────────────────────────────── */

function fmtCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

interface PresetComparison {
  from: DealPreset;
  to: DealPreset;
}

function PresetComparisonBanner({
  comparison,
}: {
  comparison: PresetComparison;
}) {
  const { from, to } = comparison;
  const deltas = [
    {
      label: "Advance",
      from: fmtCurrency(from.defaults.advanceAmount),
      to: fmtCurrency(to.defaults.advanceAmount),
    },
    {
      label: "Royalty",
      from: `${from.defaults.artistRoyaltyPct}%`,
      to: `${to.defaults.artistRoyaltyPct}%`,
    },
    {
      label: "Term",
      from: `${from.defaults.termLengthYears}yr`,
      to: `${to.defaults.termLengthYears}yr`,
    },
    {
      label: "Recoup",
      from:
        from.defaults.recoupmentModel === "at_royalty"
          ? "At Royalty"
          : "Net Profit",
      to:
        to.defaults.recoupmentModel === "at_royalty"
          ? "At Royalty"
          : "Net Profit",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-white/[0.06] px-4 py-3 mb-4 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/25">
          Preset Change
        </span>
        <span className="text-[10px] text-white/35">{from.shortLabel}</span>
        <ArrowRight size={10} className="text-white/20" />
        <span className="text-[10px] font-medium" style={{ color: to.color }}>
          {to.shortLabel}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {deltas.map((d) => (
          <div key={d.label}>
            <span className="text-[8px] text-white/20 block">{d.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/30 line-through">
                {d.from}
              </span>
              <span className="text-[10px] text-white/60">{d.to}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Default state from first preset ────────────────────── */

const DEFAULT_PRESET = DEAL_PRESETS[0];

const DEFAULT_STATE: SimulationState = {
  artistId: MOCK_AR_PROSPECTS[0].id,
  ...DEFAULT_PRESET.defaults,
};

/* ─── Component ───────────────────────────────────────────── */

export default function SimulationLab() {
  const [state, setState] = useState<SimulationState>(DEFAULT_STATE);
  const [activePresetId, setActivePresetId] = useState<DealType | "custom">(
    DEFAULT_PRESET.id,
  );
  const [result, setResult] = useState<EnhancedSimulationResult | null>(null);
  const [sensitivityData, setSensitivityData] = useState<
    SensitivityPoint[] | null
  >(null);
  const [hasRun, setHasRun] = useState(false);
  const [saved, setSaved] = useState(false);
  const [presetComparison, setPresetComparison] =
    useState<PresetComparison | null>(null);
  const { toast } = useToast();

  const activePreset: DealPreset =
    DEAL_PRESETS.find((p) => p.id === activePresetId) ?? DEFAULT_PRESET;

  // Get the selected artist's real streaming data
  const selectedArtist = useMemo(
    () => MOCK_AR_PROSPECTS.find((p) => p.id === state.artistId),
    [state.artistId],
  );

  const handleChange = useCallback(
    (partial: Partial<SimulationState>) => {
      setState((prev) => {
        const next = { ...prev, ...partial };
        // Check if state still matches active preset
        if (activePresetId !== "custom") {
          const preset = DEAL_PRESETS.find((p) => p.id === activePresetId);
          if (preset) {
            const defaults = preset.defaults;
            const isCustom = Object.keys(partial).some((key) => {
              if (key === "artistId") return false;
              return (
                next[key as keyof SimulationState] !==
                defaults[key as keyof typeof defaults]
              );
            });
            if (isCustom) {
              setActivePresetId("custom");
            }
          }
        }
        return next;
      });
      if (partial.artistId) {
        setSaved(false);
        setHasRun(false);
        setResult(null);
        setSensitivityData(null);
      }
    },
    [activePresetId],
  );

  const handlePresetSelect = useCallback(
    (presetId: DealType) => {
      const preset = DEAL_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      // Show comparison banner
      const previousPreset =
        DEAL_PRESETS.find((p) => p.id === activePresetId) ?? DEFAULT_PRESET;
      if (previousPreset.id !== preset.id) {
        setPresetComparison({ from: previousPreset, to: preset });
        // Auto-dismiss after 4 seconds
        setTimeout(() => setPresetComparison(null), 4000);
      }

      setActivePresetId(presetId);
      setState((prev) => ({
        artistId: prev.artistId,
        ...preset.defaults,
      }));
      setSaved(false);
    },
    [activePresetId],
  );

  const handleRun = useCallback(() => {
    const options = {
      artistMonthlyListeners: selectedArtist?.metrics.spotify_monthly_listeners,
    };
    const simResult = runSimulation(state, activePreset, options);
    setResult(simResult);

    // Run sensitivity analysis in parallel
    const sensitivity = runSensitivityAnalysis(state, activePreset, options);
    setSensitivityData(sensitivity);

    setHasRun(true);
    setSaved(false);
  }, [state, activePreset, selectedArtist]);

  const handlePdfExport = useCallback(() => {
    if (!result) return;
    const artistName = selectedArtist?.artist_name ?? "Unknown Artist";
    generateGreenlightPdf(state, activePreset, result, artistName);
    toast({
      title: "PDF Generated",
      description: `Greenlight proposal for ${artistName} downloaded.`,
    });
  }, [result, state, activePreset, selectedArtist, toast]);

  const handleExport = (action: string) => {
    toast({
      title: action,
      description: "Coming soon — backend not connected yet.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1
          className="text-[18px] md:text-[20px] font-semibold mb-1"
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "rgba(255,255,255,0.87)",
          }}
        >
          Simulation Lab
        </h1>
        <p className="text-[13px] text-white/40">
          Model any deal scenario in real time. 8 preset deal structures, Monte
          Carlo projections, dual IRR analysis.
        </p>
      </motion.div>

      {/* Preset comparison banner */}
      <AnimatePresence>
        {presetComparison && (
          <PresetComparisonBanner comparison={presetComparison} />
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-white/[0.06] p-5"
          style={{ background: "#1C1C1E" }}
        >
          <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-4">
            Scenario Builder
          </h3>
          <SimulationControls
            state={state}
            activePreset={activePreset}
            activePresetId={activePresetId}
            onChange={handleChange}
            onPresetSelect={handlePresetSelect}
            onRun={handleRun}
          />
        </motion.div>

        {/* Right: Results */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-xl border border-white/[0.06] p-5"
          style={{ background: "#1C1C1E" }}
        >
          {!hasRun || !result ? (
            <div className="min-h-[400px]">
              <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-4">
                Artist Profile
              </h3>
              {selectedArtist ? (
                <ArtistStatsPanel prospect={selectedArtist} />
              ) : (
                <p className="text-[13px] text-white/25 text-center pt-16">
                  Select an artist to view their profile.
                </p>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-4">
                Simulation Results
              </h3>
              <SimulationResults
                result={result}
                sensitivityData={sensitivityData}
              />
            </>
          )}
        </motion.div>
      </div>

      {/* Actions bar */}
      {hasRun && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 justify-between flex-wrap"
        >
          {/* Primary: Save to prospect */}
          <button
            onClick={() => {
              setSaved(true);
              toast({
                title: "Simulation saved",
                description: `Results attached to ${selectedArtist?.artist_name ?? "prospect"}'s dossier.`,
              });
            }}
            disabled={saved}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
            style={{
              background: saved
                ? "rgba(48,209,88,0.10)"
                : "rgba(232,67,10,0.12)",
              color: saved ? "#30D158" : "#e8430a",
              border: `1px solid ${saved ? "rgba(48,209,88,0.15)" : "rgba(232,67,10,0.15)"}`,
              cursor: saved ? "default" : "pointer",
            }}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved to Prospect" : "Save to Prospect"}
          </button>

          {/* Secondary actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] text-[12px] text-white/50 hover:text-white/70 hover:border-white/[0.12] transition-colors"
            >
              <FileText size={14} />
              PDF Proposal
            </button>
            <SendButton onSend={handleExport} />
            <button
              onClick={() => handleExport("Save to Shortlist")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] text-[12px] text-white/50 hover:text-white/70 hover:border-white/[0.12] transition-colors"
            >
              <Bookmark size={14} />
              Shortlist
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
