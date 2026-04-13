/**
 * Deal Presets & Risk Factor Definitions — 2026 Market Data
 *
 * Based on comprehensive research of current record label deal structures.
 * All ranges, splits, and multipliers reflect real 2026 industry benchmarks.
 */

import type {
  DealPreset,
  RiskFactorDefinition,
  RiskFactorId,
} from "@/types/arTypes";

/* ─── 8 Deal Presets ─────────────────────────────────────── */

export const DEAL_PRESETS: DealPreset[] = [
  {
    id: "development_360",
    label: "Development 360 Deal",
    shortLabel: "Dev 360",
    description:
      "Major label development deal with multi-rights participation. High advance, low royalty, long term.",
    color: "#0A84FF",
    defaults: {
      dealType: "development_360",
      advanceAmount: 150000,
      firmAlbums: 1,
      optionAlbums: 3,
      artistRoyaltyPct: 18,
      termLengthYears: 7,
      recoupmentModel: "at_royalty",
      livePct: 25,
      merchPct: 30,
      endorsementPct: 20,
      riskFactors: ["cross_collateralization"],
    },
    advanceRange: { min: 50000, median: 150000, max: 300000 },
    royaltyRange: { min: 15, max: 25 },
    termRange: { min: 5, max: 8 },
    has360: true,
    tags: ["360", "Options", "Cross-Collat", "Label Owns Masters"],
  },
  {
    id: "viral_distribution",
    label: "Viral Breakout Distribution",
    shortLabel: "Viral Distro",
    description:
      "DIY-plus distribution for trending artists. Low/no advance, high artist retention, short term.",
    color: "#BF5AF2",
    defaults: {
      dealType: "viral_distribution",
      advanceAmount: 25000,
      firmAlbums: 1,
      optionAlbums: 0,
      artistRoyaltyPct: 85,
      termLengthYears: 1,
      recoupmentModel: "net_profit",
      livePct: 0,
      merchPct: 0,
      endorsementPct: 0,
      riskFactors: [],
    },
    advanceRange: { min: 0, median: 25000, max: 100000 },
    royaltyRange: { min: 80, max: 95 },
    termRange: { min: 1, max: 2 },
    has360: false,
    tags: ["Artist Owns Masters", "No Options", "High Decay Risk"],
  },
  {
    id: "established_licensing",
    label: "Established Artist Licensing",
    shortLabel: "Licensing",
    description:
      "Proven artist licenses masters to label for a fixed term. High royalty, reversion trigger, no 360.",
    color: "#30D158",
    defaults: {
      dealType: "established_licensing",
      advanceAmount: 1500000,
      firmAlbums: 1,
      optionAlbums: 0,
      artistRoyaltyPct: 65,
      termLengthYears: 7,
      recoupmentModel: "net_profit",
      livePct: 0,
      merchPct: 0,
      endorsementPct: 0,
      riskFactors: [],
    },
    advanceRange: { min: 500000, median: 1500000, max: 10000000 },
    royaltyRange: { min: 50, max: 75 },
    termRange: { min: 5, max: 10 },
    has360: false,
    tags: ["Artist Owns Masters", "Reversion Trigger", "Audit Rights"],
  },
  {
    id: "indie_profit_split",
    label: "Indie Profit-Split (JV)",
    shortLabel: "Profit Split",
    description:
      "50/50 joint venture with boutique label. Net profit recoupment — breaks even 5× faster than at-royalty.",
    color: "#FF9F0A",
    defaults: {
      dealType: "indie_profit_split",
      advanceAmount: 50000,
      firmAlbums: 1,
      optionAlbums: 1,
      artistRoyaltyPct: 50,
      termLengthYears: 5,
      recoupmentModel: "net_profit",
      livePct: 0,
      merchPct: 15,
      endorsementPct: 0,
      riskFactors: [],
    },
    advanceRange: { min: 10000, median: 50000, max: 250000 },
    royaltyRange: { min: 45, max: 55 },
    termRange: { min: 3, max: 7 },
    has360: true,
    tags: ["Net Profit", "7yr Reversion", "Partial 360"],
  },
  {
    id: "upstream_subsidiary",
    label: "Upstream Subsidiary Deal",
    shortLabel: "Upstream",
    description:
      "Tiered deal — starts as distribution, auto-converts to full major deal at performance trigger.",
    color: "#5AC8FA",
    defaults: {
      dealType: "upstream_subsidiary",
      advanceAmount: 75000,
      firmAlbums: 1,
      optionAlbums: 2,
      artistRoyaltyPct: 20,
      termLengthYears: 5,
      recoupmentModel: "at_royalty",
      livePct: 10,
      merchPct: 15,
      endorsementPct: 10,
      riskFactors: [],
    },
    advanceRange: { min: 10000, median: 75000, max: 250000 },
    royaltyRange: { min: 20, max: 80 },
    termRange: { min: 3, max: 7 },
    has360: true,
    tags: ["Ladder Model", "Auto-Conversion", "Trigger Clause"],
  },
  {
    id: "ai_synthetic_hybrid",
    label: "AI-Synthetic Hybrid Deal",
    shortLabel: "AI Hybrid",
    description:
      "Artist licenses digital twin for AI remixing. Flat creation fee + synthetic platform revenue pool share.",
    color: "#DA70D6",
    defaults: {
      dealType: "ai_synthetic_hybrid",
      advanceAmount: 5000,
      firmAlbums: 0,
      optionAlbums: 0,
      artistRoyaltyPct: 50,
      termLengthYears: 3,
      recoupmentModel: "net_profit",
      livePct: 0,
      merchPct: 0,
      endorsementPct: 0,
      riskFactors: ["ai_walled_garden"],
    },
    advanceRange: { min: 2000, median: 5000, max: 25000 },
    royaltyRange: { min: 40, max: 60 },
    termRange: { min: 2, max: 5 },
    has360: false,
    tags: ["Synthetic License", "Revocable", "Ethical AI Clause"],
  },
  {
    id: "major_traditional",
    label: "Major Label Traditional",
    shortLabel: "Major Trad",
    description:
      "Classic exclusive recording deal. Label owns masters, high advance, low royalty, long binding period.",
    color: "#FF453A",
    defaults: {
      dealType: "major_traditional",
      advanceAmount: 750000,
      firmAlbums: 1,
      optionAlbums: 3,
      artistRoyaltyPct: 18,
      termLengthYears: 10,
      recoupmentModel: "at_royalty",
      livePct: 25,
      merchPct: 30,
      endorsementPct: 20,
      riskFactors: ["cross_collateralization"],
    },
    advanceRange: { min: 250000, median: 750000, max: 5000000 },
    royaltyRange: { min: 15, max: 22 },
    termRange: { min: 7, max: 15 },
    has360: true,
    tags: ["Label Owns Masters", "Full 360", "High Advance"],
  },
  {
    id: "track_level_single",
    label: "Track-Level / Single Deal",
    shortLabel: "Single Deal",
    description:
      "Rapid-response single deal for viral traction. Mini-advance, short term, option for full album.",
    color: "#FFD60A",
    defaults: {
      dealType: "track_level_single",
      advanceAmount: 40000,
      firmAlbums: 1,
      optionAlbums: 1,
      artistRoyaltyPct: 30,
      termLengthYears: 2,
      recoupmentModel: "at_royalty",
      livePct: 0,
      merchPct: 0,
      endorsementPct: 0,
      riskFactors: [],
    },
    advanceRange: { min: 20000, median: 40000, max: 75000 },
    royaltyRange: { min: 25, max: 40 },
    termRange: { min: 1, max: 3 },
    has360: false,
    tags: ["Mini-Advance", "Short Term", "High Decay Risk"],
  },
];

/* ─── Risk Factor Definitions ────────────────────────────── */

export const RISK_FACTOR_DEFINITIONS: Record<
  RiskFactorId,
  RiskFactorDefinition
> = {
  cross_collateralization: {
    id: "cross_collateralization",
    label: "Cross-Collateralization",
    description:
      "Unrecouped balances from prior releases carry forward. In 360 deals, may extend across revenue streams.",
    impactDescription: "-65% recoupment probability in first 3 cycles",
    impactMultiplier: 0.35,
    impactTarget: "recoupment_probability",
    color: "#FF453A",
  },
  fuzzy_recoupment: {
    id: "fuzzy_recoupment",
    label: "Fuzzy Recoupment Language",
    description:
      'Contract allows recoupment of "general label costs" or unspecified overhead beyond standard items.',
    impactDescription: "+20% effective advance (hidden costs)",
    impactMultiplier: 1.2,
    impactTarget: "effective_advance",
    color: "#FF9F0A",
  },
  navil_perpetuity: {
    id: "navil_perpetuity",
    label: "NAVIL Rights (Perpetuity)",
    description:
      "Label owns Name, Artist Voice, Image, and Likeness in perpetuity — reduces artist enterprise value for exit/buyout.",
    impactDescription: "-40% artist enterprise value",
    impactMultiplier: 0.6,
    impactTarget: "artist_enterprise_value",
    color: "#FF453A",
  },
  ai_walled_garden: {
    id: "ai_walled_garden",
    label: "AI Walled Garden (No Revocation)",
    description:
      "No voice model revocation or human-first tagging clause. Market flooding with synthetic versions.",
    impactDescription: "+15% catalog decay rate",
    impactMultiplier: 1.15,
    impactTarget: "catalog_decay",
    color: "#BF5AF2",
  },
  audit_barriers: {
    id: "audit_barriers",
    label: "Audit Barriers",
    description:
      "Artist pays for audit even if >10% underpayment found. Restricted audit windows (once per 2yr, 90-day max).",
    impactDescription: "~3.5% revenue leakage",
    impactMultiplier: 0.965,
    impactTarget: "revenue_leakage",
    color: "#FFD60A",
  },
};

/* ─── Helpers ────────────────────────────────────────────── */

export function getPresetById(id: string): DealPreset | undefined {
  return DEAL_PRESETS.find((p) => p.id === id);
}
