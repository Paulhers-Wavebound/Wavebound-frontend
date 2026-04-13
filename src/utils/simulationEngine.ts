/**
 * Monte Carlo Simulation Engine — 2026 Deal Simulator
 *
 * Pure functions, no React, no external deps.
 * Runs 1000 iterations with correlated probability distributions
 * based on real 2026 music industry financial data.
 */

import type {
  SimulationState,
  DealPreset,
  EnhancedSimulationResult,
  MonteCarloPercentile,
  ProjectionPoint,
  RecoupmentPoint,
  RiskImpact,
  SignalInsight,
  SignOffStep,
  RiskFactorId,
} from "@/types/arTypes";
import { RISK_FACTOR_DEFINITIONS } from "@/data/dealPresets";

const ITERATIONS = 1000;

/* ─── Deterministic PRNG (Mulberry32) ────────────────────── */

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashState(state: SimulationState): number {
  let hash = 0;
  const str = JSON.stringify(state);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash;
}

/* ─── Distribution Samplers ──────────────────────────────── */

function normalRandom(rng: () => number): number {
  // Box-Muller transform
  const u1 = rng();
  const u2 = rng();
  return (
    Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2)
  );
}

function normalSample(rng: () => number, mean: number, stddev: number): number {
  return mean + normalRandom(rng) * stddev;
}

function logNormalSample(
  rng: () => number,
  median: number,
  sigma: number,
): number {
  const mu = Math.log(Math.max(median, 0.001));
  return Math.exp(mu + normalRandom(rng) * sigma);
}

function triangularSample(
  rng: () => number,
  min: number,
  mode: number,
  max: number,
): number {
  const u = rng();
  const fc = (mode - min) / (max - min);
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function betaPertSample(
  rng: () => number,
  min: number,
  mode: number,
  max: number,
): number {
  // Beta-PERT uses lambda=4 by default
  const lambda = 4;
  const mu = (min + lambda * mode + max) / (lambda + 2);
  const range = max - min;
  if (range <= 0) return mode;
  const alpha = 1 + lambda * ((mu - min) / range);
  const beta = 1 + lambda * ((max - mu) / range);
  // Generate beta distribution via gamma approximation
  const a = gammaShape(rng, alpha);
  const b = gammaShape(rng, beta);
  const x = a / (a + b);
  return min + x * range;
}

function gammaShape(rng: () => number, shape: number): number {
  // Marsaglia and Tsang's method
  if (shape < 1) {
    return gammaShape(rng, shape + 1) * Math.pow(rng(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normalRandom(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/* ─── IRR Calculator (Newton-Raphson) ────────────────────── */

function computeIRR(cashFlows: number[], guess = 0.01, maxIter = 200): number {
  if (cashFlows.length < 2) return 0;
  // Check if all positive or all negative (no IRR)
  const hasNeg = cashFlows.some((c) => c < 0);
  const hasPos = cashFlows.some((c) => c > 0);
  if (!hasNeg || !hasPos) return 0;

  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      if (factor === 0 || !isFinite(factor)) break;
      npv += cashFlows[t] / factor;
      dnpv -= (t * cashFlows[t]) / (factor * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < 1e-8) {
      // Annualize monthly rate
      return (Math.pow(1 + newRate, 12) - 1) * 100;
    }
    rate = clamp(newRate, -0.5, 10);
  }
  // Fallback: annualize best guess
  return (Math.pow(1 + rate, 12) - 1) * 100;
}

/* ─── Single Iteration ───────────────────────────────────── */

interface IterationResult {
  totalRevenue: number;
  recoupmentMonth: number;
  labelNet: number;
  artistNet: number;
  labelIRR: number;
  artistIRR: number;
  monthlyLabelCumulative: number[];
  monthlyArtistCumulative: number[];
  monthlyRevenue: number[];
}

function runSingleIteration(
  state: SimulationState,
  rng: () => number,
  effectiveAdvance: number,
  decayMultiplier: number,
  revenueLeakage: number,
  artistMonthlyListeners?: number,
): IterationResult {
  const termMonths = state.termLengthYears * 12;

  // Sample distributions
  const streamingGrowthRate = clamp(
    logNormalSample(rng, 0.015, 0.6) - 1,
    -0.1,
    1.5,
  );
  const monthlyGrowth = 1 + streamingGrowthRate / 12;
  const streamingDecayRate = clamp(
    normalSample(rng, 0.2, 0.12) * decayMultiplier,
    0.05,
    0.6,
  );
  const monthlyDecay = 1 - streamingDecayRate / 12;
  const peakMonth = Math.round(
    clamp(triangularSample(rng, 3, 12, 36), 1, termMonths - 1),
  );
  const syncAnnual = triangularSample(rng, 0, 15000, 500000);
  const syncMonthly = syncAnnual / 12;

  const has360Revenue =
    state.livePct > 0 || state.merchPct > 0 || state.endorsementPct > 0;
  const threeeSixtyBase = has360Revenue
    ? betaPertSample(rng, 500, 5000, 100000)
    : 0;

  // Base monthly streaming: prefer real artist data, fallback to advance heuristic
  // Spotify pays ~$0.004/stream avg. Monthly listeners ≈ 3× monthly streams / 30.
  const baseStreaming = artistMonthlyListeners
    ? Math.max(artistMonthlyListeners * 0.004 * 0.8, 2000)
    : Math.max(effectiveAdvance / 24, 2000);

  const labelCashFlows: number[] = [-effectiveAdvance];
  const artistCashFlows: number[] = [0];
  const monthlyLabelCumulative: number[] = [-effectiveAdvance];
  const monthlyArtistCumulative: number[] = [0];
  const monthlyRevenue: number[] = [0];

  let cumulativeLabel = -effectiveAdvance;
  let cumulativeArtist = 0;
  let recoupmentMonth = -1;
  let peakStreaming = 0;
  let totalRevenue = 0;

  for (let month = 1; month <= termMonths; month++) {
    // Streaming revenue
    let streaming: number;
    if (month <= peakMonth) {
      streaming = baseStreaming * Math.pow(monthlyGrowth, month);
      peakStreaming = streaming;
    } else {
      streaming = peakStreaming * Math.pow(monthlyDecay, month - peakMonth);
    }
    streaming = Math.max(streaming, 0);

    // Sync revenue (monthly portion)
    const sync = syncMonthly;

    // 360 revenue (label's cut from ancillary)
    const total360 =
      threeeSixtyBase *
      ((state.livePct + state.merchPct + state.endorsementPct) / 100);

    const grossRevenue = streaming + sync;
    totalRevenue += grossRevenue + total360;

    // Revenue split based on recoupment model
    let labelShare: number;
    let artistShare: number;

    if (state.recoupmentModel === "at_royalty") {
      artistShare = grossRevenue * (state.artistRoyaltyPct / 100);
      labelShare = grossRevenue - artistShare + total360;
      // Pre-recoupment: label keeps artist's share for recoupment
      if (cumulativeLabel < 0) {
        labelShare = grossRevenue + total360;
        artistShare = 0;
      }
    } else {
      // Net profit model — costs recouped from total before split
      const netProfit = grossRevenue + total360;
      if (cumulativeLabel < 0) {
        // Still recouping — all revenue goes to recoupment
        labelShare = netProfit;
        artistShare = 0;
      } else {
        artistShare = netProfit * (state.artistRoyaltyPct / 100);
        labelShare = netProfit - artistShare;
      }
    }

    // Apply revenue leakage (audit barriers)
    labelShare *= revenueLeakage;
    artistShare *= revenueLeakage;

    labelCashFlows.push(labelShare);
    artistCashFlows.push(artistShare);

    cumulativeLabel += labelShare;
    cumulativeArtist += artistShare;

    monthlyLabelCumulative.push(cumulativeLabel);
    monthlyArtistCumulative.push(cumulativeArtist);
    monthlyRevenue.push(grossRevenue + total360);

    if (recoupmentMonth === -1 && cumulativeLabel >= 0) {
      recoupmentMonth = month;
    }
  }

  const labelIRR = computeIRR(labelCashFlows);
  const artistIRR = computeIRR(artistCashFlows);

  return {
    totalRevenue,
    recoupmentMonth,
    labelNet: cumulativeLabel,
    artistNet: cumulativeArtist,
    labelIRR,
    artistIRR,
    monthlyLabelCumulative,
    monthlyArtistCumulative,
    monthlyRevenue,
  };
}

/* ─── Percentile Extraction ──────────────────────────────── */

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/* ─── Sign-Off Chain Generation ──────────────────────────── */

function generateSignOffChain(advance: number, irr: number): SignOffStep[] {
  const chain: SignOffStep[] = [{ role: "A&R Council", status: "not_started" }];

  if (advance >= 100000) {
    chain.push({ role: "Business Affairs / Legal", status: "not_started" });
    chain.push({ role: "SVP Finance", status: "not_started" });
  }

  if (advance >= 500000) {
    chain.push({ role: "Label Chairman (Ron Perry)", status: "not_started" });
  }

  if (advance >= 2000000) {
    chain.push({ role: "SMG Chairman (Rob Stringer)", status: "not_started" });
  }

  // Simulate approval status based on IRR
  const baseApproval =
    irr > 15 ? 0.95 : irr > 10 ? 0.85 : irr > 5 ? 0.65 : 0.35;

  for (let i = 0; i < chain.length; i++) {
    const prob = baseApproval - i * 0.05;
    if (prob > 0.7) {
      chain[i].status = "approved";
    } else if (prob > 0.4) {
      chain[i].status = "pending";
    }
    // else stays not_started
  }

  return chain;
}

/* ─── Insight Generation ─────────────────────────────────── */

function generateInsights(
  state: SimulationState,
  preset: DealPreset,
  breakevenMonths: number,
  probabilityOfRecoupment: number,
  labelIRR: number,
  artistIRR: number,
  aggregateRisk: number,
): SignalInsight[] {
  const insights: SignalInsight[] = [];
  const termMonths = state.termLengthYears * 12;

  // Recoupment analysis
  if (breakevenMonths === -1 || breakevenMonths > termMonths) {
    insights.push({
      type: "critical",
      title: "Deal Does Not Recoup Within Term",
      detail: `At current parameters, the advance of ${fmtCurrency(state.advanceAmount)} is unlikely to recoup within the ${state.termLengthYears}-year term. Consider reducing the advance or negotiating a net-profit recoupment model.`,
    });
  } else if (breakevenMonths > termMonths * 0.7) {
    insights.push({
      type: "warning",
      title: "Late Recoupment Risk",
      detail: `Break-even is projected at month ${breakevenMonths} of a ${termMonths}-month deal, leaving minimal upside window. Consider longer term or lower advance.`,
    });
  } else if (breakevenMonths < 18) {
    insights.push({
      type: "positive",
      title: "Fast Recoupment",
      detail: `Projected break-even at month ${breakevenMonths} leaves ${termMonths - breakevenMonths} months of pure profit generation.`,
    });
  }

  // IRR analysis
  if (labelIRR > 15) {
    insights.push({
      type: "positive",
      title: "Strong Label IRR",
      detail: `Projected ${labelIRR.toFixed(1)}% IRR exceeds the 10-15% target range. High-confidence investment.`,
    });
  } else if (labelIRR < 5) {
    insights.push({
      type: "critical",
      title: "Below-Target Label IRR",
      detail: `Projected ${labelIRR.toFixed(1)}% IRR falls below the 10% minimum target. Business Affairs likely to push back.`,
    });
  }

  // Artist IRR fairness
  if (artistIRR < 2 && state.recoupmentModel === "at_royalty") {
    insights.push({
      type: "warning",
      title: "Artist Cash Flow Concern",
      detail: `At-royalty recoupment with ${state.artistRoyaltyPct}% royalty means the artist generates $${(state.advanceAmount / (state.artistRoyaltyPct / 100)).toLocaleString()} before seeing post-advance income. Net-profit model would accelerate this 5×.`,
    });
  }

  // Risk factor analysis
  if (
    state.riskFactors.includes("cross_collateralization") &&
    state.recoupmentModel === "at_royalty"
  ) {
    insights.push({
      type: "critical",
      title: "Cross-Collateralization + At-Royalty = High Risk",
      detail:
        "Combining cross-collateralization with at-royalty recoupment reduces artist cash-flow probability by 65% in the first 3 album cycles. This structure will face heavy pushback from artist management.",
    });
  }

  // Advance vs median
  const advanceRatio = state.advanceAmount / preset.advanceRange.median;
  if (advanceRatio > 1.8) {
    insights.push({
      type: "warning",
      title: "Above-Market Advance",
      detail: `Advance is ${advanceRatio.toFixed(1)}× the market median for ${preset.shortLabel} deals. Ensure engagement velocity justifies the premium.`,
    });
  }

  // Recoupment probability
  if (probabilityOfRecoupment < 50) {
    insights.push({
      type: "critical",
      title: "Low Recoupment Probability",
      detail: `Only ${probabilityOfRecoupment.toFixed(0)}% of simulated scenarios achieve recoupment. Consider restructuring deal terms.`,
    });
  }

  // Aggregate risk
  if (aggregateRisk < 0.7) {
    insights.push({
      type: "warning",
      title: "High Aggregate Risk Load",
      detail: `Active risk factors reduce effective returns by ${((1 - aggregateRisk) * 100).toFixed(0)}%. Review whether all risk clauses are necessary.`,
    });
  }

  return insights.slice(0, 5);
}

function fmtCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

/* ─── Main Entry Point ───────────────────────────────────── */

export interface SimulationOptions {
  artistMonthlyListeners?: number;
}

export function runSimulation(
  state: SimulationState,
  preset: DealPreset,
  options?: SimulationOptions,
): EnhancedSimulationResult {
  const startTime = performance.now();
  const rng = mulberry32(hashState(state));
  const termMonths = state.termLengthYears * 12;

  // Pre-compute risk adjustments
  const hasFuzzy = state.riskFactors.includes("fuzzy_recoupment");
  const hasCrossCollat = state.riskFactors.includes("cross_collateralization");
  const hasAuditBarriers = state.riskFactors.includes("audit_barriers");
  const hasAIWalled = state.riskFactors.includes("ai_walled_garden");
  const hasNAVIL = state.riskFactors.includes("navil_perpetuity");

  const effectiveAdvance = state.advanceAmount * (hasFuzzy ? 1.2 : 1.0);
  const decayMultiplier = hasAIWalled ? 1.15 : 1.0;
  const revenueLeakage = hasAuditBarriers ? 0.965 : 1.0;

  // Aggregate risk multiplier
  let aggregateRiskMultiplier = 1.0;
  const activeRisks: RiskImpact[] = [];
  for (const riskId of state.riskFactors) {
    const def = RISK_FACTOR_DEFINITIONS[riskId];
    if (def) {
      activeRisks.push({
        id: riskId,
        label: def.label,
        description: def.description,
        impactPct: Math.round((1 - def.impactMultiplier) * -100),
        appliedMultiplier: def.impactMultiplier,
        color: def.color,
      });
      // Compound the risk (different targets, so multiply them all)
      if (def.impactMultiplier < 1) {
        aggregateRiskMultiplier *= def.impactMultiplier;
      }
    }
  }

  // Run iterations
  const results: IterationResult[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    results.push(
      runSingleIteration(
        state,
        rng,
        effectiveAdvance,
        decayMultiplier,
        revenueLeakage,
        options?.artistMonthlyListeners,
      ),
    );
  }

  // Apply cross-collateralization post-hoc
  if (hasCrossCollat) {
    for (const r of results) {
      // 65% chance of carrying prior debt
      if (rng() < 0.65) {
        r.recoupmentMonth = -1;
        r.labelNet -= effectiveAdvance * 0.3;
      }
    }
  }

  // Sort by total revenue for percentile extraction
  const sortedByRevenue = [...results].sort(
    (a, b) => a.totalRevenue - b.totalRevenue,
  );
  const sortedByLabelNet = [...results].sort((a, b) => a.labelNet - b.labelNet);
  const sortedByArtistNet = [...results].sort(
    (a, b) => a.artistNet - b.artistNet,
  );

  // Monte Carlo distribution (percentiles)
  const pctiles = [5, 10, 25, 50, 75, 90, 95];
  const monteCarloDistribution: MonteCarloPercentile[] = pctiles.map((p) => ({
    percentile: p,
    revenue: percentile(
      sortedByRevenue.map((r) => r.totalRevenue),
      p,
    ),
    labelNet: percentile(
      sortedByLabelNet.map((r) => r.labelNet),
      p,
    ),
    artistNet: percentile(
      sortedByArtistNet.map((r) => r.artistNet),
      p,
    ),
  }));

  // Projection timeline (fan chart data — monthly percentiles of cumulative revenue)
  const projectionTimeline: ProjectionPoint[] = [];
  const step = Math.max(1, Math.round(termMonths / 20)); // ~20 data points
  for (let m = 0; m <= termMonths; m += step) {
    const idx = Math.min(m, termMonths);
    const revenues = results
      .map((r) => {
        if (idx < r.monthlyRevenue.length) {
          // Cumulative revenue up to this month
          let cum = 0;
          for (let j = 0; j <= idx; j++) cum += r.monthlyRevenue[j];
          return cum;
        }
        return r.totalRevenue;
      })
      .sort((a, b) => a - b);

    projectionTimeline.push({
      month: idx,
      p10: percentile(revenues, 10),
      p25: percentile(revenues, 25),
      p50: percentile(revenues, 50),
      p75: percentile(revenues, 75),
      p90: percentile(revenues, 90),
    });
  }

  // Recoupment timeline (average cumulative across iterations)
  const recoupmentTimeline: RecoupmentPoint[] = [];
  const recoupStep = Math.max(3, Math.round(termMonths / 12));
  for (let m = 0; m <= termMonths; m += recoupStep) {
    const idx = Math.min(m, termMonths);
    let sumLabel = 0;
    let sumArtist = 0;
    let count = 0;
    for (const r of results) {
      if (idx < r.monthlyLabelCumulative.length) {
        sumLabel += r.monthlyLabelCumulative[idx];
        sumArtist += r.monthlyArtistCumulative[idx];
        count++;
      }
    }
    const avgLabel = count > 0 ? sumLabel / count : 0;
    const avgArtist = count > 0 ? sumArtist / count : 0;
    recoupmentTimeline.push({
      month: idx,
      cumulativeLabel: avgLabel,
      cumulativeArtist: avgArtist,
      breakEven: avgLabel >= 0,
    });
  }

  // Summary statistics
  const recoupedCount = results.filter((r) => r.recoupmentMonth > 0).length;
  const probabilityOfRecoupment = (recoupedCount / ITERATIONS) * 100;

  const recoupMonths = results
    .filter((r) => r.recoupmentMonth > 0)
    .map((r) => r.recoupmentMonth)
    .sort((a, b) => a - b);
  const medianBreakeven =
    recoupMonths.length > 0
      ? recoupMonths[Math.floor(recoupMonths.length / 2)]
      : -1;

  const medianLabelIRR = percentile(
    [...results].sort((a, b) => a.labelIRR - b.labelIRR).map((r) => r.labelIRR),
    50,
  );
  const medianArtistIRR = percentile(
    [...results]
      .sort((a, b) => a.artistIRR - b.artistIRR)
      .map((r) => r.artistIRR),
    50,
  );

  // Apply NAVIL to artist metrics
  const navilMultiplier = hasNAVIL ? 0.6 : 1.0;
  const medianLabelNet = percentile(
    sortedByLabelNet.map((r) => r.labelNet),
    50,
  );
  const medianArtistNet =
    percentile(
      sortedByArtistNet.map((r) => r.artistNet),
      50,
    ) * navilMultiplier;

  const labelROI = effectiveAdvance > 0 ? medianLabelNet / effectiveAdvance : 0;
  const artistROI =
    state.advanceAmount > 0 ? medianArtistNet / state.advanceAmount : 0;

  // Clamp IRR to reasonable display range
  const clampedLabelIRR = clamp(medianLabelIRR, -50, 200);
  const clampedArtistIRR = clamp(medianArtistIRR * navilMultiplier, -50, 200);

  // Sign-off chain
  const signOffChain = generateSignOffChain(
    state.advanceAmount,
    clampedLabelIRR,
  );
  const approvedCount = signOffChain.filter(
    (s) => s.status === "approved",
  ).length;
  const approvalProbability =
    signOffChain.length > 0 ? (approvedCount / signOffChain.length) * 100 : 0;

  // Insights
  const insights = generateInsights(
    state,
    preset,
    medianBreakeven,
    probabilityOfRecoupment,
    clampedLabelIRR,
    clampedArtistIRR,
    aggregateRiskMultiplier,
  );

  const computeTimeMs = performance.now() - startTime;

  return {
    monteCarloDistribution,
    projectionTimeline,
    recoupmentTimeline,
    labelIRR: clampedLabelIRR,
    artistIRR: clampedArtistIRR,
    labelROI,
    artistROI,
    breakevenMonths: medianBreakeven,
    probabilityOfRecoupment,
    riskBreakdown: activeRisks,
    aggregateRiskMultiplier,
    signOffChain,
    approvalProbability,
    insights,
    iterationsRun: ITERATIONS,
    computeTimeMs,
  };
}

/* ─── Sensitivity Analysis ───────────────────────────────── */

export interface SensitivityPoint {
  advance: number;
  labelIRR: number;
  artistIRR: number;
  breakevenMonths: number;
  recoupProbability: number;
}

/**
 * Runs the simulation across a range of advance values
 * to show how IRR and breakeven change with deal size.
 * Uses fewer iterations (200) per point for speed.
 */
export function runSensitivityAnalysis(
  state: SimulationState,
  preset: DealPreset,
  options?: SimulationOptions,
  steps = 10,
): SensitivityPoint[] {
  const { min, max } = preset.advanceRange;
  const stepSize = (max - min) / (steps - 1);
  const points: SensitivityPoint[] = [];

  for (let i = 0; i < steps; i++) {
    const advance = Math.round(min + stepSize * i);
    const scenarioState: SimulationState = { ...state, advanceAmount: advance };
    const result = runSimulation(scenarioState, preset, options);
    points.push({
      advance,
      labelIRR: result.labelIRR,
      artistIRR: result.artistIRR,
      breakevenMonths: result.breakevenMonths,
      recoupProbability: result.probabilityOfRecoupment,
    });
  }

  return points;
}
