import { SoundAnalysis } from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import InfoPopover from "./InfoPopover";

interface HeroStatsRowProps {
  analysis: SoundAnalysis;
  userCount?: number | null;
}

interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
}

export default function HeroStatsRow({
  analysis,
  userCount,
}: HeroStatsRowProps) {
  const totalOnSound = userCount ?? analysis.total_videos_on_sound;
  const hasShareRate = analysis.actual_share_rate != null;
  const cards: StatCard[] = [
    {
      label: "VIDEOS ANALYZED",
      value: formatNumber(analysis.videos_analyzed),
      delta: totalOnSound
        ? `of ${formatNumber(totalOnSound)} on this sound`
        : `↑ ${analysis.weekly_delta_videos} this week`,
      deltaColor: totalOnSound ? "var(--ink-tertiary)" : "#30D158",
    },
    {
      label: "COMBINED VIEWS",
      value: formatNumber(analysis.total_views),
      delta: `↑ ${analysis.weekly_delta_views_pct}% vs last week`,
      deltaColor: "#30D158",
    },
    {
      label: "AVG ENGAGEMENT RATE",
      value: `${analysis.avg_share_rate}%`,
      delta: "Likes / views",
      deltaColor: "var(--ink-tertiary)",
    },
    ...(hasShareRate
      ? [
          {
            label: "AVG SHARE RATE",
            value: `${analysis.actual_share_rate}%`,
            delta:
              analysis.actual_share_rate! >= 1.0
                ? "Strong virality signal"
                : "Shares / views",
            deltaColor:
              analysis.actual_share_rate! >= 1.0
                ? "#30D158"
                : "var(--ink-tertiary)",
          },
        ]
      : []),
    {
      label: "AVG DURATION",
      value: `${analysis.avg_duration_seconds}s`,
      delta: "Sweet spot: 15–22s",
      deltaColor: "var(--ink-tertiary)",
    },
    {
      label: "PEAK DAY",
      value: analysis.peak_day,
      delta: `${analysis.peak_day_count} videos posted`,
      deltaColor: "#30D158",
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
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
            color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
          }}
        >
          Key Metrics
        </span>
        <InfoPopover text="Your sound's vital signs at a glance. Videos analyzed, total views, engagement rate, share rate, average video length, and the busiest posting day." />
      </div>
      <div
        data-pdf-cols="3"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
          gap: 12,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              padding: 20,
              borderTop: "0.5px solid var(--card-edge)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent gradient line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
              }}
            />
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.10em",
                color: "var(--ink-tertiary)",
                marginBottom: 8,
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: "var(--ink)",
                lineHeight: 1.2,
                letterSpacing: "-0.03em",
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: card.deltaColor,
                marginTop: 6,
              }}
            >
              {card.delta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
