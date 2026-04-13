/**
 * A&R Pipeline Tabs — bottom section tabs.
 * Scout Radar | Shortlist | Development Roster | Simulation Lab
 *
 * Scout Radar renders inline (Phase 3), others show filtered views or link out.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { ARProspect } from "@/types/arTypes";
import ARPipelineRow, { GRID_COLS } from "./ARPipelineRow";
import ScoutDossierPanel from "./ScoutDossierPanel";

const TABS = [
  { value: "shortlist", label: "Shortlist" },
  { value: "development", label: "Development Roster" },
  { value: "simulation", label: "Simulation Lab" },
  { value: "genome", label: "Culture Genome" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

/* ─── Column headers (reused from ARPipelineTable) ────────── */

const COLUMNS = [
  "Artist",
  "Rise Prob",
  "Stage",
  "7d Velocity",
  "Format Alpha",
  "Top Signal",
  "Signability",
  "Ghost Curve",
];

function MiniTableHeader() {
  return (
    <div
      className="grid items-center gap-3 px-5 py-2 border-b border-white/[0.06]"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {COLUMNS.map((col) => (
        <span
          key={col}
          className="text-[10px] font-semibold tracking-wider uppercase text-white/25"
          style={
            col !== "Artist" && col !== "Top Signal"
              ? { textAlign: "center" }
              : undefined
          }
        >
          {col}
        </span>
      ))}
    </div>
  );
}

export default function ARPipelineTabs({
  prospects,
}: {
  prospects: ARProspect[];
}) {
  const [activeTab, setActiveTab] = useState<TabValue>("shortlist");
  const [dossierProspect, setDossierProspect] = useState<ARProspect | null>(
    null,
  );
  const navigate = useNavigate();

  const shortlist = useMemo(
    () =>
      prospects
        .filter(
          (p) =>
            p.pipeline_stage === "validation" ||
            p.pipeline_stage === "execution",
        )
        .sort((a, b) => b.rise_probability - a.rise_probability),
    [prospects],
  );

  const devRoster = useMemo(
    () =>
      prospects
        .filter((p) => p.deal_status !== null)
        .sort((a, b) => b.rise_probability - a.rise_probability),
    [prospects],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="rounded-xl border border-white/[0.06]"
      style={{ background: "#1C1C1E" }}
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-3 border-b border-white/[0.06] overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                if (tab.value === "simulation") {
                  navigate("/label/ar/simulation");
                } else if (tab.value === "genome") {
                  navigate("/label/culture-genome");
                } else {
                  setActiveTab(tab.value);
                }
              }}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                active
                  ? "bg-white/[0.08] text-white/87"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
              }`}
            >
              {tab.label}
              {(tab.value === "simulation" || tab.value === "genome") && (
                <ExternalLink
                  size={10}
                  className="inline ml-1 -mt-0.5 text-white/25"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-w-[1100px]">
        {activeTab === "shortlist" && (
          <>
            <div className="px-5 py-3">
              <div className="flex items-center gap-2">
                <h3
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Shortlist
                </h3>
                <span className="text-[10px] text-white/25 tabular-nums">
                  {shortlist.length} prospects in validation + execution
                </span>
              </div>
            </div>
            <MiniTableHeader />
            {shortlist.length > 0 ? (
              shortlist.map((p, i) => (
                <ARPipelineRow key={p.id} prospect={p} index={i} />
              ))
            ) : (
              <div className="py-12 text-center text-[13px] text-white/30">
                No prospects in shortlist yet.
              </div>
            )}
          </>
        )}

        {activeTab === "development" && (
          <>
            <div className="px-5 py-3">
              <div className="flex items-center gap-2">
                <h3
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Development Roster
                </h3>
                <span className="text-[10px] text-white/25 tabular-nums">
                  {devRoster.length} prospects with active deals
                </span>
              </div>
            </div>
            <MiniTableHeader />
            {devRoster.length > 0 ? (
              devRoster.map((p, i) => (
                <ARPipelineRow key={p.id} prospect={p} index={i} />
              ))
            ) : (
              <div className="py-12 text-center text-[13px] text-white/30">
                No active development deals.
              </div>
            )}
          </>
        )}
      </div>

      {/* Dossier slide-in panel (scout tab) */}
      <ScoutDossierPanel
        prospect={dossierProspect}
        onClose={() => setDossierProspect(null)}
      />
    </motion.div>
  );
}
