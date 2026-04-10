import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MOCK_MARKETING_ARTISTS,
  generateRosterInsight,
} from "@/data/mockMarketingData";
import MarketingPriorityCards from "./MarketingPriorityCards";
import MarketingRosterTable from "./MarketingRosterTable";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function MarketingDashboard() {
  const artists = MOCK_MARKETING_ARTISTS;

  const navigate = useNavigate();
  const insight = useMemo(() => generateRosterInsight(artists), [artists]);
  const greeting = getGreeting();
  const [briefingDismissed, setBriefingDismissed] = useState(false);

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold text-white/87">
          Columbia Records US
        </h1>
        <span className="text-sm text-white/40">{artists.length} Artists</span>
      </div>

      {/* Executive Briefing */}
      <AnimatePresence>
        {!briefingDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              height: 0,
              marginBottom: 0,
              overflow: "hidden",
            }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-white/[0.06] px-7 py-6"
            style={{ background: "#1C1C1E" }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h2
                className="text-[13px] font-medium tracking-wide"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "rgba(255,255,255,0.50)",
                  letterSpacing: "0.04em",
                }}
              >
                Digital Marketing Briefing
              </h2>
              <span
                className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Updated 7 min ago
              </span>
            </div>

            <h3
              className="text-[22px] font-normal mb-5"
              style={{
                fontFamily: '"Tiempos Text", Georgia, serif',
                color: "rgba(255,255,255,0.87)",
              }}
            >
              {greeting}, Manos.
            </h3>

            <div
              style={{ fontFamily: '"Tiempos Text", Georgia, serif' }}
              className="space-y-4"
            >
              <p
                className="text-[15px] leading-[1.85]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Three artists are in active breakout windows across emerging
                markets. Megan Maroney is surging in Nigeria&mdash;TikTok #5, up
                12 positions&mdash;with spillover into Ghana and Kenya. Lil Nas
                X appeared in the Philippines at TikTok #8. Doechii is
                accelerating across South Africa, TikTok #3, up 18. Tyla has a
                closing window in India with roughly 9 days left.
              </p>

              <p
                className="text-[15px] leading-[1.85]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Meanwhile,{" "}
                <span style={{ color: "rgba(255,255,255,0.85)" }}>
                  $175K per month sits in saturated US placements
                </span>{" "}
                for Harry Styles, Doja Cat, and Ice Spice at $11&ndash;13 CPM
                with declining or flat returns.
              </p>

              <div>
                <p
                  className="text-[13px] font-medium mb-2"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Today&rsquo;s recommended actions:
                </p>
                <ul
                  className="list-disc list-inside space-y-1 text-[15px] leading-[1.85]"
                  style={{ color: "#e8430a" }}
                >
                  <li>
                    Greenlight $2.5K TikTok Spark Ads in Lagos for Megan Maroney
                    (7.1&times; ROI vs US).
                  </li>
                  <li>
                    Allocate $2K to Philippines TikTok for Lil Nas X
                    (6.3&times;).
                  </li>
                  <li>
                    Begin reallocation of $25K from Harry Styles US to three
                    emerging markets.
                  </li>
                </ul>
              </div>

              <p
                className="text-[13px] leading-[1.7]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Net impact: +1.3M projected impressions at 80% lower CPM. No new
                budget required.
              </p>
            </div>

            {/* Briefing actions */}
            <div className="flex items-center justify-end gap-3 mt-3 pt-2.5 border-t border-white/[0.06]">
              <button
                onClick={() => setBriefingDismissed(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
              >
                <Check size={13} />
                Got it
              </button>
              <button
                onClick={() =>
                  navigate("/label/assistant", {
                    state: {
                      prefill: [
                        `Here's my morning briefing for Columbia Records US:`,
                        ``,
                        `Three artists are in active breakout windows — Megan Maroney surging in Nigeria (TikTok #5, +12), Lil Nas X appeared in Philippines (TikTok #8), Doechii accelerating in South Africa (TikTok #3, +18). Tyla has a closing window in India (~9 days).`,
                        ``,
                        `$175K/month sits in saturated US placements for Harry Styles, Doja Cat, and Ice Spice at $11-13 CPM with declining returns.`,
                        ``,
                        `Recommended actions:`,
                        `1. Greenlight $2.5K TikTok Spark Ads in Lagos for Megan Maroney (7.1x ROI vs US)`,
                        `2. Allocate $2K to Philippines TikTok for Lil Nas X (6.3x)`,
                        `3. Begin reallocation of $25K from Harry Styles US to 3 emerging markets`,
                        ``,
                        `Let's discuss this — what should I prioritize first?`,
                      ].join("\n"),
                    },
                  })
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-[#e8430a] hover:bg-[#e8430a]/10 transition-colors"
              >
                <MessageCircle size={13} />
                Chat about this
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Priority Cards */}
      <MarketingPriorityCards artists={artists} />

      {/* Roster Table */}
      <MarketingRosterTable artists={artists} />

      {/* Insight Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-white/[0.06] px-5 py-4 flex items-start gap-3"
        style={{ background: "#1C1C1E" }}
      >
        <span className="text-base mt-0.5 shrink-0">&#x1F4A1;</span>
        <p className="text-sm text-white/55 leading-relaxed">
          &ldquo;{insight}&rdquo;
        </p>
      </motion.div>
    </div>
  );
}
