import { SoundAnalysis } from '@/types/soundIntelligence';
import { formatNumber } from '@/utils/soundIntelligenceApi';

interface HeroStatsRowProps {
  analysis: SoundAnalysis;
}

interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
}

export default function HeroStatsRow({ analysis }: HeroStatsRowProps) {
  const cards: StatCard[] = [
    {
      label: 'VIDEOS ANALYZED',
      value: formatNumber(analysis.videos_analyzed),
      delta: `↑ ${analysis.weekly_delta_videos} this week`,
      deltaColor: '#30D158',
    },
    {
      label: 'COMBINED VIEWS',
      value: formatNumber(analysis.total_views),
      delta: `↑ ${analysis.weekly_delta_views_pct}% vs last week`,
      deltaColor: '#30D158',
    },
    {
      label: 'AVG ENGAGEMENT RATE',
      value: `${analysis.avg_share_rate}%`,
      delta: 'Above 1% platform avg',
      deltaColor: '#30D158',
    },
    {
      label: 'AVG DURATION',
      value: `${analysis.avg_duration_seconds}s`,
      delta: 'Sweet spot: 15–22s',
      deltaColor: 'var(--ink-tertiary)',
    },
    {
      label: 'PEAK DAY',
      value: analysis.peak_day,
      delta: `${analysis.peak_day_count} videos posted`,
      deltaColor: '#30D158',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 12,
    }}>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: 20,
          borderTop: '0.5px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.8px',
            color: 'var(--ink-tertiary)',
            marginBottom: 8,
          }}>
            {card.label}
          </div>
          <div style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1.2,
          }}>
            {card.value}
          </div>
          <div style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: card.deltaColor,
            marginTop: 6,
          }}>
            {card.delta}
          </div>
        </div>
      ))}
    </div>
  );
}
