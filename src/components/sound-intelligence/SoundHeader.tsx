import { SoundAnalysis } from '@/types/soundIntelligence';
import { Calendar, BarChart3, Clock } from 'lucide-react';

interface SoundHeaderProps {
  analysis: SoundAnalysis;
}

const statusConfig = {
  accelerating: { label: 'Accelerating', bg: 'rgba(48,209,88,0.12)', color: '#30D158' },
  active: { label: 'Active', bg: 'rgba(255,214,10,0.12)', color: '#FFD60A' },
  declining: { label: 'Declining', bg: 'rgba(255,69,58,0.12)', color: '#FF453A' },
};

export default function SoundHeader({ analysis }: SoundHeaderProps) {
  const status = statusConfig[analysis.status];

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 16,
      padding: '24px 28px',
      borderTop: '0.5px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {analysis.track_name}
          </h1>
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 17,
            color: 'var(--ink-secondary)',
            margin: '6px 0 0',
          }}>
            {analysis.artist_name} · {analysis.album_name}
          </p>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.8px',
          background: status.bg,
          color: status.color,
        }}>
          {status.label}
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: 20,
        marginTop: 16,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 13,
        color: 'var(--ink-tertiary)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={13} /> Created {analysis.created_at}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <BarChart3 size={13} /> {analysis.videos_analyzed.toLocaleString()} videos analyzed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={13} /> Last scan {analysis.last_scan}
        </span>
      </div>
    </div>
  );
}
