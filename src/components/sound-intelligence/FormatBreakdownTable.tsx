import { FormatBreakdown, getFormatColor } from '@/types/soundIntelligence';
import { formatNumber } from '@/utils/soundIntelligenceApi';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown, ExternalLink } from 'lucide-react';
import SongTimestampHeatmap from './SongTimestampHeatmap';

interface Props {
  formats: FormatBreakdown[];
  expandedFormat: number | null;
  onToggle: (i: number) => void;
}

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  SCALE: { bg: 'rgba(48,209,88,0.15)', text: '#30D158' },
  SATURATED: { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A' },
  EMERGING: { bg: 'rgba(10,132,255,0.15)', text: '#0A84FF' },
  DECLINING: { bg: 'rgba(255,69,58,0.15)', text: '#FF453A' },
};

export default function FormatBreakdownTable({ formats, expandedFormat, onToggle }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 16,
      padding: 20,
      borderTop: '0.5px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>
        Format Breakdown
      </div>

      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.8fr 1fr 0.7fr 36px',
        gap: 8,
        padding: '0 8px 10px',
        borderBottom: '1px solid var(--border)',
      }}>
        {['Format', 'Videos', '% Total', 'Avg Views', 'Engagement Rate', 'Verdict', ''].map(h => (
          <div key={h} style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--ink-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {h}
          </div>
        ))}
      </div>

      {formats.map((f, i) => {
        const isOpen = expandedFormat === i;
        const color = getFormatColor(f.name, i);
        const vc = VERDICT_COLORS[f.verdict] || VERDICT_COLORS.SCALE;

        return (
          <div key={f.name}>
            {/* Row */}
            <button
              onClick={() => onToggle(i)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.8fr 1fr 0.7fr 36px',
                gap: 8,
                width: '100%',
                padding: '12px 8px',
                background: isOpen ? 'rgba(255,255,255,0.02)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                alignItems: 'center',
                textAlign: 'left',
                transition: 'background 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{f.name}</span>
              </div>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink)' }}>{f.video_count}</span>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink)' }}>{f.pct_of_total}%</span>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink)' }}>{formatNumber(f.avg_views)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${Math.min(f.share_rate * 10, 100)}%`, height: '100%', borderRadius: 3, background: color }} />
                </div>
                <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-secondary)', minWidth: 36 }}>{f.share_rate}%</span>
              </div>
              <span style={{
                fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 99, background: vc.bg, color: vc.text, letterSpacing: '0.3px',
              }}>
                {f.verdict}
              </span>
              <ChevronDown size={16} color="var(--ink-tertiary)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
            </button>

            {/* Drilldown */}
            {isOpen && (
              <div style={{
                padding: 16,
                background: 'rgba(255,255,255,0.015)',
                borderBottom: '1px solid var(--border)',
                animation: 'fadeInUp 0.25s ease both',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  {/* Song Timestamp Heatmap */}
                  <SongTimestampHeatmap songBars={f.songBars} hooks={f.hooks} videoCount={f.video_count} color={color} />

                  {/* Hook Patterns */}
                  <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--ink-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Hook Patterns
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{f.hooks.face_pct}%</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>Face in 2s</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{f.hooks.snippet_pct}%</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>Snippet</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {f.hooks.top_hooks.map(h => (
                        <span key={h} style={{
                          fontFamily: '"DM Sans", sans-serif', fontSize: 11, padding: '3px 8px', borderRadius: 99,
                          background: 'rgba(255,255,255,0.06)', color: 'var(--ink-secondary)',
                        }}>{h}</span>
                      ))}
                    </div>
                  </div>

                  {/* Daily Velocity */}
                  <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--ink-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Daily Velocity
                    </div>
                    <ResponsiveContainer width="100%" height={56}>
                      <BarChart data={f.daily.map((v, di) => ({ v, i: di }))}>
                        <Bar dataKey="v" radius={[2, 2, 0, 0]} maxBarSize={12}>
                          {f.daily.map((_, di) => <Cell key={di} fill={color} fillOpacity={0.7} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insight + Quick Stats */}
                  <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--ink-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Insight
                    </div>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                      {f.insight}
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {[
                        { label: 'Videos', value: String(f.video_count) },
                        { label: 'Avg Views', value: formatNumber(f.avg_views) },
                        { label: 'Share', value: `${f.share_rate}%` },
                      ].map(s => (
                        <div key={s.label}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Videos */}
                {f.topVideos.length > 0 && (
                  <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--ink-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Top Videos
                    </div>
                    {f.topVideos.map((tv, ti) => {
                      const handle = tv.handle.startsWith('@') ? tv.handle : `@${tv.handle}`;
                      const profileUrl = `https://www.tiktok.com/${handle}`;
                      return (
                        <a
                          key={ti}
                          href={tv.video_url || profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                          style={{
                            display: 'flex', gap: 12, alignItems: 'center', padding: '8px 4px',
                            borderBottom: ti < f.topVideos.length - 1 ? '1px solid var(--border)' : 'none',
                            textDecoration: 'none', borderRadius: 6, cursor: 'pointer',
                            transition: 'background 150ms',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <span className="group-hover:underline" style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--ink-tertiary)', minWidth: 24, transition: 'color 150ms' }}>
                            {tv.handle}
                          </span>
                          <span style={{ flex: 1, fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-secondary)' }}>{tv.why}</span>
                          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink)' }}>{tv.views}</span>
                          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-tertiary)' }}>{tv.share}</span>
                          <ExternalLink size={14} color="var(--ink-tertiary)" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ flexShrink: 0 }} />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
