import { TopVideo } from '@/types/soundIntelligence';
import { ExternalLink } from 'lucide-react';

interface Props {
  topVideos: TopVideo[];
}

export default function TopPerformersGrid({ topVideos }: Props) {
  return (
    <div>
      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
        Top Performers
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {topVideos.slice(0, 6).map((v) => (
          <a
            key={v.rank}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              padding: 18,
              borderTop: '0.5px solid rgba(255,255,255,0.04)',
              textDecoration: 'none',
              transition: 'transform 150ms',
              display: 'block',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 700,
                  color: v.rank <= 3 ? '#e8430a' : 'var(--ink-tertiary)',
                }}>
                  #{v.rank}
                </span>
                <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  {v.creator}
                </span>
              </div>
              <ExternalLink size={14} color="var(--ink-tertiary)" />
            </div>

            <span style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 11, padding: '3px 8px', borderRadius: 99,
              background: 'rgba(255,255,255,0.06)', color: 'var(--ink-secondary)', fontWeight: 500,
            }}>
              {v.format}
            </span>

            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-secondary)', lineHeight: 1.5, marginTop: 10 }}>
              {v.why}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{v.views}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>Views</div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{v.share_rate}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>Engagement Rate</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
