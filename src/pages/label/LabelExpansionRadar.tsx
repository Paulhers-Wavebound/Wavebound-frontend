import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowRight, ChevronDown } from "lucide-react";
import LabelLayout from "./LabelLayout";
import ExpansionStats from "@/components/label/expansion/ExpansionStats";
import GeoMap from "@/components/label/expansion/GeoMap";
import OpportunityCard from "@/components/label/expansion/OpportunityCard";
import LanguageSignal from "@/components/label/expansion/LanguageSignal";
import NicheProof from "@/components/label/expansion/NicheProof";
import RevenueEstimate from "@/components/label/expansion/RevenueEstimate";
import { mockArtistRoster } from "@/components/label/expansion/mockData";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 3,
          height: 14,
          borderRadius: 1,
          background:
            "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
        }}
      />
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
          textTransform: "uppercase",
          letterSpacing: "0.10em",
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default function LabelExpansionRadar() {
  const [artistIndex, setArtistIndex] = useState(0);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const [highlightedMarket, setHighlightedMarket] = useState<string | null>(
    null,
  );
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const data = mockArtistRoster[artistIndex];
  const { artist, cities, opportunities, languages, nicheProof, revenue } =
    data;

  // Close selector on outside click
  useEffect(() => {
    if (!selectorOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node)
      )
        setSelectorOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectorOpen]);

  const handleSelectMarket = useCallback((market: string | null) => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    if (!market) {
      setHighlightedMarket(null);
      return;
    }
    const slug = market.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const el = document.getElementById(`opportunity-${slug}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMarket(market);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMarket(null);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  return (
    <LabelLayout>
      <div
        style={{
          padding: "40px 44px 72px",
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 56,
        }}
      >
        {/* ── 1. Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-faint, rgba(255,255,255,0.4))",
              }}
            >
              {artist.label}
            </span>
            <ChevronRight
              size={14}
              color="var(--ink-faint, rgba(255,255,255,0.25))"
              strokeWidth={1.5}
            />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-secondary, rgba(255,255,255,0.6))",
                fontWeight: 500,
              }}
            >
              {artist.name}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 8,
                }}
              >
                <h1
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 38,
                    fontWeight: 800,
                    color: "var(--ink, rgba(255,255,255,0.92))",
                    letterSpacing: "-0.03em",
                    margin: 0,
                  }}
                >
                  Expansion Radar
                </h1>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--green, #30D158)",
                    background: "rgba(48, 209, 88, 0.1)",
                    border: "1px solid rgba(48, 209, 88, 0.2)",
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--green, #30D158)",
                      animation: "livePulse 2s ease-in-out infinite",
                    }}
                  />
                  Live
                </span>
              </div>
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                  margin: 0,
                  maxWidth: 640,
                  lineHeight: 1.5,
                }}
              >
                Untapped audiences your artist could reach — based on
                intelligence from 12,400+ niche videos and 840 comparable
                artists.
              </p>
            </div>

            {/* Artist selector — functional dropdown */}
            <div
              ref={selectorRef}
              style={{ position: "relative", flexShrink: 0 }}
            >
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--border-subtle, rgba(255,255,255,0.06))";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--surface, #1C1C1E)",
                  border:
                    "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
                  borderRadius: 12,
                  padding: "10px 16px",
                  cursor: "pointer",
                  transition: "border-color 150ms",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, var(--accent, #e8430a) 0%, #ff6b3d 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {artist.name[0]}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink, rgba(255,255,255,0.87))",
                    }}
                  >
                    {artist.name}
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-faint, rgba(255,255,255,0.35))",
                    }}
                  >
                    @{artist.handle}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  color="var(--ink-tertiary, rgba(255,255,255,0.35))"
                  strokeWidth={2}
                  style={{ marginLeft: 4 }}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {selectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      background: "var(--surface-hover, #2C2C2E)",
                      border:
                        "1px solid var(--border-hover, rgba(255,255,255,0.08))",
                      borderRadius: 12,
                      padding: 4,
                      zIndex: 50,
                      minWidth: 200,
                      boxShadow: "var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.4))",
                    }}
                  >
                    {mockArtistRoster.map((entry, i) => (
                      <button
                        key={entry.artist.handle}
                        onClick={() => {
                          setArtistIndex(i);
                          setSelectorOpen(false);
                          setHighlightedMarket(null);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          background:
                            i === artistIndex
                              ? "var(--overlay-active, rgba(255,255,255,0.06))"
                              : "transparent",
                          textAlign: "left",
                          transition: "background 150ms",
                        }}
                        onMouseEnter={(e) => {
                          if (i !== artistIndex)
                            e.currentTarget.style.background =
                              "var(--overlay-hover, rgba(255,255,255,0.04))";
                        }}
                        onMouseLeave={(e) => {
                          if (i !== artistIndex)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--accent, #e8430a) 0%, #ff6b3d 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {entry.artist.name[0]}
                        </div>
                        <div>
                          <div
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 13,
                              fontWeight: i === artistIndex ? 600 : 400,
                              color:
                                i === artistIndex
                                  ? "var(--ink, rgba(255,255,255,0.87))"
                                  : "var(--ink-secondary, rgba(255,255,255,0.6))",
                            }}
                          >
                            {entry.artist.name}
                          </div>
                          <div
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 10,
                              color: "var(--ink-faint, rgba(255,255,255,0.3))",
                            }}
                          >
                            @{entry.artist.handle}
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── 2. Stats Row ── */}
        <motion.div
          key={`stats-${artist.handle}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SectionLabel>Overview</SectionLabel>
          <div style={{ marginTop: 14 }}>
            <ExpansionStats artist={artist} />
          </div>
        </motion.div>

        {/* ── 3. Geographic Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <SectionLabel>Geographic Distribution</SectionLabel>
          <div style={{ marginTop: 14 }}>
            <GeoMap cities={cities} onSelectMarket={handleSelectMarket} />
          </div>
        </motion.div>

        {/* ── 4. Expansion Opportunities ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <SectionLabel>Expansion Opportunities</SectionLabel>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: "var(--ink-faint, rgba(255,255,255,0.22))",
                letterSpacing: "0.05em",
              }}
            >
              CLICK HEADERS TO EXPAND / COLLAPSE
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {opportunities.map((opp, i) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                index={i}
                highlighted={highlightedMarket === opp.market_name}
                defaultExpanded={i < 2}
              />
            ))}
          </div>
        </motion.div>

        {/* ── 5. Revenue Left on Table ── */}
        <motion.div
          key={`revenue-${artist.handle}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <SectionLabel>Revenue Left on Table</SectionLabel>
          <div style={{ marginTop: 14 }}>
            <RevenueEstimate items={revenue} />
          </div>
        </motion.div>

        {/* ── 6. Audience Language Signal ── */}
        <motion.div
          key={`lang-${artist.handle}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SectionLabel>Audience Language Signal</SectionLabel>
          <div style={{ marginTop: 14 }}>
            <LanguageSignal languages={languages} />
          </div>
        </motion.div>

        {/* ── 7. Niche Evidence ── */}
        <motion.div
          key={`proof-${artist.handle}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <SectionLabel>Niche Evidence — What Works</SectionLabel>
          <div style={{ marginTop: 14 }}>
            <NicheProof items={nicheProof} />
          </div>
        </motion.div>

        {/* ── 8. CTA Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            background:
              "linear-gradient(135deg, rgba(232,67,10,0.12) 0%, rgba(232,67,10,0.04) 100%)",
            border: "1px solid rgba(232,67,10,0.2)",
            borderRadius: 20,
            padding: "32px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 22,
                fontWeight: 700,
                color: "var(--ink, rgba(255,255,255,0.87))",
                margin: "0 0 6px",
              }}
            >
              Ready to expand {artist.name}'s reach?
            </h3>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                color: "var(--ink-tertiary, rgba(255,255,255,0.5))",
                margin: 0,
              }}
            >
              Generate a market-specific content plan with posting schedules,
              creator targets, and format recommendations.
            </p>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--accent, #e8430a)",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              cursor: "pointer",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              whiteSpace: "nowrap",
              transition: "transform 150ms, box-shadow 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(232,67,10,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Generate Expansion Plan
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </motion.div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes expansionPulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
        }
        div:hover > .geo-dot-label {
          opacity: 1 !important;
        }
      `}</style>
    </LabelLayout>
  );
}
