import { useState } from "react";
import InfoPopover from "./InfoPopover";
import {
  FormatBreakdown,
  NicheEntry,
  VibeEntry,
  IntentEntry,
  CreatorDemographics,
  SongRoleEntry,
  FORMAT_COLORS,
  VIBE_COLORS,
  INTENT_COLORS,
  getFormatColor,
} from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";

type AxisTab = "format" | "niche" | "vibe" | "intent" | "creators";

interface Props {
  formats: FormatBreakdown[];
  nicheDistribution?: NicheEntry[];
  vibeDistribution?: VibeEntry[];
  intentBreakdown?: IntentEntry[];
  creatorDemographics?: CreatorDemographics;
  songRoleDistribution?: SongRoleEntry[];
  activeNiche?: string | null;
  onNicheClick?: (niche: string | null) => void;
}

const INTENT_LABELS: Record<string, string> = {
  organic: "Organic",
  artist_official: "Official",
  paid: "Paid",
  fan_account: "Fan Account",
};

const ROLE_LABELS: Record<string, string> = {
  primary: "Primary",
  background: "Background",
  sound_bite: "Sound Bite",
};

const ROLE_COLORS: Record<string, string> = {
  primary: "#0A84FF",
  background: "rgba(255,255,255,0.20)",
  sound_bite: "#8E8E93",
};

export default function AxisBrowser({
  formats,
  nicheDistribution,
  vibeDistribution,
  intentBreakdown,
  creatorDemographics,
  songRoleDistribution,
  activeNiche,
  onNicheClick,
}: Props) {
  const hasNiche = nicheDistribution && nicheDistribution.length > 0;
  const hasVibe = vibeDistribution && vibeDistribution.length > 0;
  const hasIntent = intentBreakdown && intentBreakdown.length > 0;
  const hasDemographics =
    creatorDemographics &&
    (creatorDemographics.age_breakdown?.length > 0 ||
      creatorDemographics.gender_breakdown?.length > 0);
  const hasRole = songRoleDistribution && songRoleDistribution.length > 0;

  const tabs: { key: AxisTab; label: string }[] = [
    { key: "format", label: "Format" },
    ...(hasNiche ? [{ key: "niche" as AxisTab, label: "Niche" }] : []),
    ...(hasVibe ? [{ key: "vibe" as AxisTab, label: "Vibe" }] : []),
    ...(hasIntent ? [{ key: "intent" as AxisTab, label: "Intent" }] : []),
    ...(hasDemographics
      ? [{ key: "creators" as AxisTab, label: "Creators" }]
      : []),
  ];

  const [activeTab, setActiveTab] = useState<AxisTab>("format");

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 20,
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      {/* Song Role stat bar */}
      {hasRole && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
            padding: "8px 12px",
            borderRadius: 8,
            background: "var(--overlay-subtle)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-secondary)",
          }}
        >
          <span style={{ fontSize: 14 }}>♪</span>
          {songRoleDistribution!.map((entry, i) => (
            <span
              key={entry.role}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {i > 0 && (
                <span style={{ color: "var(--ink-faint)", margin: "0 2px" }}>
                  ·
                </span>
              )}
              <span
                style={{
                  color: ROLE_COLORS[entry.role] ?? "var(--ink-secondary)",
                  fontWeight: 600,
                }}
              >
                {ROLE_LABELS[entry.role] ?? entry.role} {entry.pct}%
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Section header + tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
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
            Classification Axes
          </span>
          <InfoPopover text="Six independent axes that classify how your sound is being used. Format = video type, Niche = community, Vibe = mood, Intent = organic vs paid, Creators = demographics." />
        </div>

        {/* Tab bar — hidden in PDF */}
        <div
          data-pdf-hide
          style={{
            display: "flex",
            gap: 2,
            padding: 2,
            background: "var(--overlay-subtle)",
            borderRadius: 8,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 600,
                padding: "5px 14px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background:
                  activeTab === tab.key ? "var(--surface)" : "transparent",
                color:
                  activeTab === tab.key ? "var(--ink)" : "var(--ink-tertiary)",
                transition: "all 150ms",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ animation: "fadeInUp 0.2s ease both" }} key={activeTab}>
        {activeTab === "format" && <FormatAxisContent formats={formats} />}
        {activeTab === "niche" && hasNiche && (
          <NicheAxisContent
            niches={nicheDistribution!}
            activeNiche={activeNiche}
            onNicheClick={onNicheClick}
          />
        )}
        {activeTab === "vibe" && hasVibe && (
          <VibeAxisContent vibes={vibeDistribution!} />
        )}
        {activeTab === "intent" && hasIntent && (
          <IntentAxisContent intents={intentBreakdown!} />
        )}
        {activeTab === "creators" && hasDemographics && (
          <CreatorsAxisContent demographics={creatorDemographics!} />
        )}
      </div>
    </div>
  );
}

/* ─── Format Tab ─── */
function FormatAxisContent({ formats }: { formats: FormatBreakdown[] }) {
  const sorted = [...formats].sort((a, b) => b.video_count - a.video_count);
  const maxCount = Math.max(...sorted.map((f) => f.video_count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sorted.map((f, i) => {
        const color = getFormatColor(f.name, i);
        const barWidth = Math.max((f.video_count / maxCount) * 100, 2);
        return (
          <div
            key={f.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "2px 4px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 160,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                {f.name}
              </span>
            </div>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: color,
                  opacity: 0.7,
                  transition: "width 300ms ease",
                }}
              />
            </div>
            <span style={statValue}>{f.pct_of_total}%</span>
            <span style={statSecondary}>{f.video_count} videos</span>
            <span style={statSecondary}>{formatNumber(f.avg_views)} avg</span>
            <span style={engagementBadge(f.share_rate)}>{f.share_rate}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Niche Tab ─── */
function NicheAxisContent({
  niches,
  activeNiche,
  onNicheClick,
}: {
  niches: NicheEntry[];
  activeNiche?: string | null;
  onNicheClick?: (niche: string | null) => void;
}) {
  const sorted = [...niches].sort((a, b) => b.pct - a.pct);
  const maxCount = Math.max(...sorted.map((n) => n.video_count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sorted.map((entry) => {
        const isActive = activeNiche === entry.niche;
        const barWidth = Math.max((entry.video_count / maxCount) * 100, 2);
        return (
          <div
            key={entry.niche}
            onClick={
              onNicheClick
                ? () => onNicheClick(isActive ? null : entry.niche)
                : undefined
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "2px 4px",
              borderRadius: 6,
              background: isActive ? "rgba(232,67,10,0.08)" : "transparent",
              borderLeft: isActive
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              cursor: onNicheClick ? "pointer" : "default",
              transition: "all 150ms",
            }}
          >
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--accent)" : "var(--ink)",
                minWidth: 140,
                flexShrink: 0,
              }}
            >
              {entry.niche}
            </span>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: isActive
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.25)",
                  transition: "width 300ms ease",
                }}
              />
            </div>
            <span style={statValue}>{entry.pct}%</span>
            <span style={statSecondary}>{entry.video_count} videos</span>
            <span style={statSecondary}>
              {formatNumber(entry.avg_views)} avg
            </span>
            <span style={engagementBadge(entry.engagement)}>
              {entry.engagement}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Vibe Tab ─── */
function VibeAxisContent({ vibes }: { vibes: VibeEntry[] }) {
  const sorted = [...vibes].sort((a, b) => b.pct - a.pct);
  const maxCount = Math.max(...sorted.map((v) => v.video_count), 1);

  return (
    <div>
      {/* Spectrum bar */}
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {sorted.map((entry, i) => (
          <div
            key={entry.vibe}
            style={{
              width: `${entry.pct}%`,
              background: VIBE_COLORS[entry.vibe] ?? "#636366",
              borderRight:
                i < sorted.length - 1 ? "1px solid rgba(0,0,0,0.3)" : "none",
            }}
          />
        ))}
      </div>
      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((entry) => {
          const color = VIBE_COLORS[entry.vibe] ?? "#636366";
          const barWidth = Math.max((entry.video_count / maxCount) * 100, 2);
          return (
            <div
              key={entry.vibe}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "2px 4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 120,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  {entry.vibe}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: color,
                    opacity: 0.7,
                    transition: "width 300ms ease",
                  }}
                />
              </div>
              <span style={statValue}>{entry.pct}%</span>
              <span style={statSecondary}>{entry.video_count} videos</span>
              <span style={statSecondary}>
                {formatNumber(entry.avg_views)} avg
              </span>
              <span style={engagementBadge(entry.engagement)}>
                {entry.engagement}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Intent Tab ─── */
function IntentAxisContent({ intents }: { intents: IntentEntry[] }) {
  const sorted = [...intents].sort((a, b) => b.pct - a.pct);

  return (
    <div>
      {/* Stacked bar */}
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {sorted.map((entry) => (
          <div
            key={entry.intent}
            style={{
              width: `${entry.pct}%`,
              background: INTENT_COLORS[entry.intent] ?? "#636366",
            }}
          />
        ))}
      </div>
      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((entry) => {
          const color = INTENT_COLORS[entry.intent] ?? "#636366";
          return (
            <div
              key={entry.intent}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "4px 8px",
                borderRadius: 8,
                background: "var(--overlay-subtle)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ink)",
                  minWidth: 40,
                }}
              >
                {entry.pct}%
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink)",
                  flex: 1,
                }}
              >
                {INTENT_LABELS[entry.intent] ?? entry.intent}
              </span>
              <span style={statSecondary}>{entry.video_count} videos</span>
              <span style={statSecondary}>
                {formatNumber(entry.avg_views)} avg views
              </span>
              <span style={engagementBadge(entry.engagement)}>
                {entry.engagement}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Creators Tab ─── */
function CreatorsAxisContent({
  demographics,
}: {
  demographics: CreatorDemographics;
}) {
  const genderEntries =
    demographics.gender_breakdown?.filter(
      (g) => g.gender !== "Visible" && g.gender !== "Not Visible",
    ) ?? [];
  const ageEntries =
    demographics.age_breakdown?.filter(
      (a) => a.age !== "Not" && a.age !== "Not Visible",
    ) ?? [];
  const notVisiblePct =
    demographics.profiles
      ?.filter((p) => p.profile === "Not Visible")
      ?.reduce((sum, p) => sum + p.pct, 0) ?? 0;

  const GENDER_COLORS: Record<string, string> = {
    Female: "#FF6482",
    Male: "#0A84FF",
    "Mixed Group": "#BF5AF2",
  };

  const AGE_COLORS: Record<string, string> = {
    Teen: "#FFD60A",
    "Young Adult": "#30D158",
    Adult: "#0A84FF",
    "Older Adult": "#BF5AF2",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      {/* Gender */}
      <div>
        <div style={sectionLabel}>Gender</div>
        {/* Bar */}
        {genderEntries.length > 0 && (
          <div
            style={{
              display: "flex",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {genderEntries.map((g) => (
              <div
                key={g.gender}
                style={{
                  width: `${g.pct}%`,
                  background: GENDER_COLORS[g.gender] ?? "#636366",
                }}
              />
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {genderEntries.map((g) => (
            <div
              key={g.gender}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: GENDER_COLORS[g.gender] ?? "#636366",
                  flexShrink: 0,
                }}
              />
              <span style={statValue}>{g.pct}%</span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-secondary)",
                }}
              >
                {g.gender}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  marginLeft: "auto",
                }}
              >
                {g.count} creators
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <div style={sectionLabel}>Age Group</div>
        {/* Bar */}
        {ageEntries.length > 0 && (
          <div
            style={{
              display: "flex",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {ageEntries.map((a) => (
              <div
                key={a.age}
                style={{
                  width: `${a.pct}%`,
                  background: AGE_COLORS[a.age] ?? "#636366",
                }}
              />
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ageEntries.map((a) => (
            <div
              key={a.age}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: AGE_COLORS[a.age] ?? "#636366",
                  flexShrink: 0,
                }}
              />
              <span style={statValue}>{a.pct}%</span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-secondary)",
                }}
              >
                {a.age}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  marginLeft: "auto",
                }}
              >
                {a.count} creators
              </span>
            </div>
          ))}
        </div>
      </div>

      {notVisiblePct > 0 && (
        <div
          style={{
            gridColumn: "1 / -1",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-faint)",
          }}
        >
          {notVisiblePct}% of videos had no visible creator (carousel/montage)
        </div>
      )}
    </div>
  );
}

/* ─── Shared styles ─── */
const sectionLabel: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 11,
  fontWeight: 500,
  color: "var(--ink-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.10em",
  marginBottom: 10,
};

const statValue: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 12,
  fontWeight: 600,
  color: "var(--ink)",
  minWidth: 32,
  textAlign: "right",
};

const statSecondary: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 12,
  color: "var(--ink-tertiary)",
};

function engagementBadge(value: number): React.CSSProperties {
  return {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 11,
    fontWeight: 600,
    padding: "1px 6px",
    borderRadius: 99,
    background: value >= 10 ? "rgba(48,209,88,0.15)" : "var(--border-subtle)",
    color: value >= 10 ? "#30D158" : "var(--ink-secondary)",
  };
}
