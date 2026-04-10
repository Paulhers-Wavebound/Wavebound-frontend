import { useMemo, useState } from "react";
import { SoundAnalysis, SoundMonitoring } from "@/types/soundIntelligence";
import { ChevronDown, Instagram } from "lucide-react";
import GeoSpreadSection from "./GeoSpreadSection";
import CreatorTiersSection from "./CreatorTiersSection";
import FormatTrendsChart from "./FormatTrendsChart";

interface Props {
  analysis: SoundAnalysis;
  monitoring?: SoundMonitoring | null;
}

export default function DeepDiveSection({ analysis, monitoring }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGeo, setExpandedGeo] = useState<number | null>(null);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);
  const [disabledTrendLines, setDisabledTrendLines] = useState<Set<string>>(
    new Set(),
  );
  const [showAllFormats, setShowAllFormats] = useState(false);

  const reelsCount = analysis.reels_count ?? 0;

  // Limit format trends to top 3 by video count (default view)
  const otherFormats = useMemo(() => {
    const top3Names = new Set(
      [...analysis.formats]
        .sort((a, b) => b.video_count - a.video_count)
        .slice(0, 3)
        .map((f) => f.name),
    );
    return new Set(
      analysis.formats.filter((f) => !top3Names.has(f.name)).map((f) => f.name),
    );
  }, [analysis.formats]);

  // Auto-disable all but top 3 in trend chart, unless user clicked "Show All"
  const effectiveDisabled = useMemo(
    () =>
      showAllFormats
        ? disabledTrendLines
        : new Set([...disabledTrendLines, ...otherFormats]),
    [showAllFormats, disabledTrendLines, otherFormats],
  );

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        borderTop: "0.5px solid var(--card-edge)",
        overflow: "hidden",
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "16px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 14,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              color: "var(--ink-tertiary)",
            }}
          >
            Deep Dive
          </span>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: "var(--ink-faint)",
            }}
          >
            Geography · Format Trends · Creator Tiers · Cross-Platform
          </span>
        </div>
        <ChevronDown
          size={16}
          color="var(--ink-tertiary)"
          style={{
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 200ms",
          }}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div
          style={{
            padding: "0 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            animation: "fadeInUp 0.25s ease both",
          }}
        >
          {/* Geographic Spread — compact */}
          <GeoSpreadSection
            geography={analysis.geography}
            expandedGeo={expandedGeo}
            onToggle={(i) => setExpandedGeo((prev) => (prev === i ? null : i))}
          />

          {/* Format Trends — top 3 default, expandable via Show All */}
          <FormatTrendsChart
            formats={analysis.formats}
            velocity={analysis.velocity}
            disabledLines={effectiveDisabled}
            onToggleLine={(name) => {
              if (!showAllFormats && otherFormats.has(name)) {
                // User clicked a non-top-3 format to enable it — switch to manual mode
                // and transfer all other auto-disabled formats into disabledTrendLines
                setShowAllFormats(true);
                setDisabledTrendLines((prev) => {
                  const next = new Set([...prev, ...otherFormats]);
                  next.delete(name);
                  return next;
                });
              } else {
                setDisabledTrendLines((prev) => {
                  const next = new Set(prev);
                  next.has(name) ? next.delete(name) : next.add(name);
                  return next;
                });
              }
            }}
            onSoloLine={(name) => {
              setShowAllFormats(true);
              setDisabledTrendLines((prev) => {
                const allOthers = new Set(
                  analysis.formats.map((f) => f.name).filter((n) => n !== name),
                );
                if (
                  prev.size === allOthers.size &&
                  [...allOthers].every((n) => prev.has(n))
                ) {
                  return new Set();
                }
                return allOthers;
              });
            }}
            onShowAll={() => {
              setShowAllFormats(true);
              setDisabledTrendLines(new Set());
            }}
          />

          {/* Creator Tiers */}
          <CreatorTiersSection
            tiers={analysis.creator_tiers}
            expandedTier={expandedTier}
            onToggle={(i) => setExpandedTier((prev) => (prev === i ? null : i))}
          />

          {/* Cross-Platform: Instagram Reels */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              background: "var(--overlay-subtle)",
              border:
                reelsCount > 0
                  ? "1px solid var(--border)"
                  : "1px dashed var(--border)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  reelsCount > 0
                    ? "rgba(225,48,108,0.10)"
                    : "var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Instagram
                size={16}
                color={reelsCount > 0 ? "#E1306C" : "var(--ink-tertiary)"}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink-secondary)",
                }}
              >
                Instagram Reels
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                }}
              >
                {reelsCount > 0
                  ? `${reelsCount} Reel${reelsCount !== 1 ? "s" : ""} detected using this sound`
                  : "No Reels detected yet"}
              </div>
            </div>
            {reelsCount > 0 ? (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#E1306C",
                }}
              >
                {reelsCount}
              </span>
            ) : (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "3px 8px",
                  borderRadius: 99,
                  background: "var(--border-subtle)",
                  color: "var(--ink-faint)",
                }}
              >
                Monitoring
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
