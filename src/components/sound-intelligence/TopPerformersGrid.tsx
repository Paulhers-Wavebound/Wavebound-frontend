import { useState } from "react";
import {
  TopVideo,
  VIBE_COLORS,
  INTENT_COLORS,
} from "@/types/soundIntelligence";
import { ExternalLink, ChevronDown, X } from "lucide-react";
import InfoPopover from "./InfoPopover";

const INTENT_ICONS: Record<string, string> = {
  organic: "\u{1F7E2}",
  artist_official: "\u{1F3F7}\uFE0F",
  paid: "\u{1F4B0}",
  fan_account: "\u{1F49C}",
};

const INITIAL_COUNT = 6;

interface Props {
  topVideos: TopVideo[];
  nicheFilter?: string | null;
  onClearNicheFilter?: () => void;
}

export default function TopPerformersGrid({
  topVideos,
  nicheFilter,
  onClearNicheFilter,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const filtered = nicheFilter
    ? topVideos.filter((v) => v.niche === nicheFilter)
    : topVideos;
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = filtered.length > INITIAL_COUNT;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Top Performers
        </span>
        <InfoPopover text="The individual videos getting the best results with your sound. Study what they have in common — format, hook style, duration — and replicate it." />
        {nicheFilter && (
          <button
            onClick={onClearNicheFilter}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px 2px 10px",
              borderRadius: 99,
              border: "none",
              background: "rgba(232,67,10,0.12)",
              color: "var(--accent)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              transition: "opacity 150ms",
            }}
          >
            {nicheFilter}
            <X size={12} />
          </button>
        )}
        {nicheFilter && (
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: "var(--ink-faint)",
            }}
          >
            {filtered.length} of {topVideos.length}
          </span>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 12,
        }}
      >
        {visible.map((v) => {
          const Wrapper = v.url ? "a" : "div";
          const linkProps = v.url
            ? {
                href: v.url,
                target: "_blank" as const,
                rel: "noopener noreferrer",
              }
            : {};
          return (
            <Wrapper
              key={v.rank}
              {...linkProps}
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                padding: 18,
                borderTop: "0.5px solid var(--card-edge)",
                textDecoration: "none",
                transition: "transform 150ms",
                display: "block",
                cursor: v.url ? "pointer" : "default",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) =>
                v.url && (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) =>
                v.url && (e.currentTarget.style.transform = "none")
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        v.rank <= 3 ? "var(--accent)" : "var(--ink-tertiary)",
                    }}
                  >
                    #{v.rank}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {v.creator}
                  </span>
                </div>
                {v.url && (
                  <span data-pdf-hide>
                    <ExternalLink size={14} color="var(--ink-tertiary)" />
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 99,
                    background: "var(--border-subtle)",
                    color: "var(--ink-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {v.format}
                </span>
                {v.niche && (
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: "rgba(232,67,10,0.12)",
                      color: "var(--accent)",
                      fontWeight: 500,
                    }}
                  >
                    {v.niche}
                  </span>
                )}
                {v.vibe && (
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: `${VIBE_COLORS[v.vibe] ?? "#636366"}1A`,
                      color: VIBE_COLORS[v.vibe] ?? "#636366",
                      fontWeight: 500,
                    }}
                  >
                    {v.vibe}
                  </span>
                )}
                {v.intent && (
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: `${INTENT_COLORS[v.intent] ?? "#636366"}1A`,
                      color: INTENT_COLORS[v.intent] ?? "#636366",
                      fontWeight: 500,
                    }}
                  >
                    {INTENT_ICONS[v.intent] ?? ""}{" "}
                    {v.intent === "artist_official"
                      ? "Official"
                      : v.intent.charAt(0).toUpperCase() + v.intent.slice(1)}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-secondary)",
                  lineHeight: 1.5,
                  marginTop: 10,
                }}
              >
                {v.why}
              </div>

              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {v.views}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-tertiary)" }}>
                    Views
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {v.share_rate}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-tertiary)" }}>
                    Engagement Rate
                  </div>
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            width: "100%",
            marginTop: 8,
            padding: "8px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--ink-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--ink-tertiary)")
          }
        >
          <ChevronDown
            size={14}
            style={{
              transform: showAll ? "rotate(180deg)" : "none",
              transition: "transform 200ms",
            }}
          />
          {showAll
            ? "Show less"
            : `Show ${filtered.length - INITIAL_COUNT} more`}
        </button>
      )}
    </div>
  );
}
