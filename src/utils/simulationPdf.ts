/**
 * Simulation Lab — PDF Greenlight Proposal Generator
 *
 * Uses jsPDF to produce a professional deal proposal document
 * from computed simulation results.
 */
import { jsPDF } from "jspdf";
import type {
  SimulationState,
  DealPreset,
  EnhancedSimulationResult,
} from "@/types/arTypes";

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

export function generateGreenlightPdf(
  state: SimulationState,
  preset: DealPreset,
  result: EnhancedSimulationResult,
  artistName: string,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ── Header ──
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("CONFIDENTIAL — INTERNAL USE ONLY", pageWidth / 2, y, {
    align: "center",
  });
  y += 10;

  doc.setFontSize(20);
  doc.setTextColor(30);
  doc.text("Greenlight Proposal", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(14);
  doc.setTextColor(60);
  doc.text(artistName, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `${preset.label} — ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 12;

  // ── Divider ──
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // ── Deal Terms Section ──
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text("Deal Terms", 20, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(60);
  const terms = [
    ["Deal Type", preset.label],
    ["Advance", fmtCurrency(state.advanceAmount)],
    ["Artist Royalty", `${state.artistRoyaltyPct}%`],
    ["Term Length", `${state.termLengthYears} years`],
    [
      "Recoupment Model",
      state.recoupmentModel === "at_royalty" ? "At Royalty" : "Net Profit",
    ],
    ["Firm Albums", `${state.firmAlbums}`],
    ["Option Albums", `${state.optionAlbums}`],
  ];

  if (state.livePct > 0 || state.merchPct > 0 || state.endorsementPct > 0) {
    terms.push([
      "360 Clauses",
      `Live ${state.livePct}% / Merch ${state.merchPct}% / Endorse ${state.endorsementPct}%`,
    ]);
  }

  for (const [label, value] of terms) {
    doc.setTextColor(100);
    doc.text(label, 25, y);
    doc.setTextColor(40);
    doc.text(value, 90, y);
    y += 5.5;
  }
  y += 8;

  // ── Financial Projections ──
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text("Financial Projections (Monte Carlo, 1,000 iterations)", 20, y);
  y += 7;

  doc.setFontSize(10);
  const projections = [
    ["Label IRR", `${result.labelIRR.toFixed(1)}%`],
    ["Artist IRR", `${result.artistIRR.toFixed(1)}%`],
    ["Label ROI", `${result.labelROI.toFixed(2)}x`],
    ["Artist ROI", `${result.artistROI.toFixed(2)}x`],
    [
      "Break-even",
      result.breakevenMonths === -1
        ? "Not projected within term"
        : `${result.breakevenMonths} months`,
    ],
    ["Recoupment Probability", `${result.probabilityOfRecoupment.toFixed(0)}%`],
  ];

  for (const [label, value] of projections) {
    doc.setTextColor(100);
    doc.text(label, 25, y);
    doc.setTextColor(40);
    doc.text(value, 90, y);
    y += 5.5;
  }
  y += 5;

  // Revenue distribution
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("Revenue Distribution:", 25, y);
  y += 5;
  for (const p of result.monteCarloDistribution) {
    doc.text(
      `  P${p.percentile}: ${fmtCurrency(p.revenue)} total / ${fmtCurrency(p.labelNet)} label / ${fmtCurrency(p.artistNet)} artist`,
      25,
      y,
    );
    y += 4.5;
  }
  y += 8;

  // ── Risk Assessment ──
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text("Risk Assessment", 20, y);
  y += 7;

  if (result.riskBreakdown.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("No significant risk factors identified.", 25, y);
    y += 7;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(
      `Aggregate Risk Multiplier: ${result.aggregateRiskMultiplier.toFixed(2)}x`,
      25,
      y,
    );
    y += 6;
    for (const risk of result.riskBreakdown) {
      doc.setTextColor(80);
      doc.text(`• ${risk.label}: ${risk.description}`, 25, y, {
        maxWidth: pageWidth - 50,
      });
      y += 5;
    }
    y += 5;
  }

  // ── Key Insights ──
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text("Key Insights", 20, y);
  y += 7;

  doc.setFontSize(9);
  for (const insight of result.insights) {
    const prefix =
      insight.type === "critical"
        ? "⚠️"
        : insight.type === "warning"
          ? "⚡"
          : "✓";
    doc.setTextColor(
      insight.type === "critical" ? 180 : insight.type === "warning" ? 140 : 60,
    );
    doc.text(`${prefix} ${insight.title}`, 25, y);
    y += 4.5;
    doc.setTextColor(100);
    const lines = doc.splitTextToSize(insight.detail, pageWidth - 55);
    for (const line of lines) {
      doc.text(line, 30, y);
      y += 4;
    }
    y += 3;
  }

  // ── Approval Chain ──
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  y += 5;
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text("Approval Chain", 20, y);
  y += 7;

  doc.setFontSize(10);
  for (const step of result.signOffChain) {
    const statusIcon =
      step.status === "approved" ? "✓" : step.status === "pending" ? "○" : "—";
    doc.setTextColor(step.status === "approved" ? 40 : 120);
    doc.text(`${statusIcon}  ${step.role}`, 25, y);
    doc.setTextColor(150);
    doc.text(step.status.replace("_", " ").toUpperCase(), 130, y);
    y += 5.5;
  }

  // ── Footer ──
  y += 10;
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generated by Wavebound Simulation Lab — ${result.iterationsRun.toLocaleString()} Monte Carlo iterations in ${result.computeTimeMs.toFixed(0)}ms`,
    pageWidth / 2,
    y,
    { align: "center" },
  );

  // Save
  const filename = `Greenlight_${artistName.replace(/\s+/g, "_")}_${preset.shortLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
