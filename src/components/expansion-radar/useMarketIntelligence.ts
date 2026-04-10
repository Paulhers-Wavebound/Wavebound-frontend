import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MarketIntelligence, ArbitrageAction } from "./types";

/** Enriched market intelligence with computed ROI */
export interface EnrichedMarketIntel extends MarketIntelligence {
  roi_vs_us: number;
}

/** Derive action label from signal strength + arbitrage score */
export function deriveAction(
  signalScore: number,
  arbitrageScore: number,
  countryCode: string,
): ArbitrageAction {
  if (countryCode === "US") return "baseline";
  if (signalScore > 50 && arbitrageScore > 2) return "go_now";
  if (signalScore <= 50 && arbitrageScore > 2) return "test";
  if (signalScore > 50 && arbitrageScore < 1.5) return "optimize";
  return "monitor";
}

export const ACTION_CONFIG: Record<
  ArbitrageAction,
  { label: string; color: string; bg: string }
> = {
  go_now: { label: "GO NOW", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  test: { label: "TEST", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  optimize: {
    label: "OPTIMIZE",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
  },
  baseline: {
    label: "BASELINE",
    color: "rgba(255,255,255,0.5)",
    bg: "rgba(255,255,255,0.06)",
  },
  monitor: {
    label: "MONITOR",
    color: "rgba(255,255,255,0.35)",
    bg: "rgba(255,255,255,0.04)",
  },
};

export function useMarketIntelligence() {
  const [raw, setRaw] = useState<MarketIntelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("market_intelligence")
        .select("*")
        .order("arbitrage_score", { ascending: false });

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setRaw(
        (data ?? []).map((d) => ({
          country_code: d.country_code as string,
          country_name: d.country_name as string,
          avg_cpm_blended: Number(d.avg_cpm_blended),
          fan_value_index: Number(d.fan_value_index),
          arbitrage_score: Number(d.arbitrage_score),
          avg_ticket_price_usd: Number(d.avg_ticket_price_usd),
          merch_enthusiasm_index: Number(d.merch_enthusiasm_index),
          live_attendance_index: Number(d.live_attendance_index),
          yoy_streaming_growth: Number(d.yoy_streaming_growth),
          population_millions: Number(d.population_millions),
          internet_penetration: Number(d.internet_penetration),
          music_revenue_per_capita: Number(d.music_revenue_per_capita),
          top_platform: d.top_platform as string,
        })),
      );
      setLoading(false);
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute ROI vs US for each market
  const enriched = useMemo(() => {
    const us = raw.find((m) => m.country_code === "US");
    if (!us) return raw.map((m) => ({ ...m, roi_vs_us: m.arbitrage_score }));

    const usRatio = us.fan_value_index / (us.avg_cpm_blended + 1);
    return raw.map((m) => {
      const mRatio = m.fan_value_index / (m.avg_cpm_blended + 1);
      const roi = usRatio > 0 ? Math.round((mRatio / usRatio) * 10) / 10 : 1;
      return { ...m, roi_vs_us: roi };
    });
  }, [raw]);

  const byCountry = useMemo(
    () => new Map(enriched.map((m) => [m.country_code, m])),
    [enriched],
  );

  return { data: enriched, byCountry, loading, error };
}
