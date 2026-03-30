import { WinnerFormat } from '@/types/soundIntelligence';
import { formatNumber } from '@/utils/soundIntelligenceApi';
import { Trophy } from 'lucide-react';

interface WinnerCardProps {
  winner: WinnerFormat;
}

export default function WinnerCard({ winner }: WinnerCardProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(232,67,10,0.06) 0%, var(--surface) 100%)',
      borderRadius: 16,
      padding: 24,
      border: '1px solid rgba(232,67,10,0.15)',
      position: 'relative',
      overflow: 'hidden',
      flex: '1 1 40%',
    }}>
      {/* Top edge glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(232,67,10,0.3), transparent)',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
      }}>
        <Trophy size={14} color="#e8430a" />
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.8px',
          color: '#e8430a',
        }}>
          Winning Format
        </span>
      </div>

      <div style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 28,
        fontWeight: 700,
        color: 'var(--ink)',
        lineHeight: 1.2,
      }}>
        {winner.format}
      </div>

      <p style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 14,
        color: 'var(--ink-secondary)',
        margin: '8px 0 20px',
      }}>
        Outperforming all other formats by {winner.multiplier}x
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          { label: 'Videos', value: formatNumber(winner.video_count) },
          { label: 'Avg Views', value: formatNumber(winner.avg_views) },
          { label: 'Engagement Rate', value: `${winner.share_rate}%` },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(232,67,10,0.08)',
        borderRadius: 10,
        padding: '12px 16px',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 13,
        color: 'var(--ink-secondary)',
        lineHeight: 1.6,
      }}>
        {winner.recommendation}
      </div>
    </div>
  );
}
