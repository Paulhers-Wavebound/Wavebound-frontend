import { HookAnalysis, DurationAnalysis } from '@/types/soundIntelligence';

interface Props {
  hookAnalysis: HookAnalysis;
  duration: DurationAnalysis;
}

export default function HookDurationSection({ hookAnalysis, duration }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Hook Analysis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          Hook Analysis
        </div>

        {/* Face in First 2s */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Face in First 2 Seconds
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif' }}>{hookAnalysis.face_pct}%</span>
            <span style={{ fontSize: 13, color: '#30D158', fontWeight: 600 }}>{hookAnalysis.face_multiplier}x multiplier</span>
          </div>
        </div>

        {/* Text Overlay Hook */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Text Overlay Hook
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif', marginBottom: 10 }}>
            {hookAnalysis.text_hook_pct}%
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {hookAnalysis.top_hooks.map(h => (
              <span key={h} style={{
                fontFamily: '"DM Sans", sans-serif', fontSize: 11, padding: '4px 10px', borderRadius: 99,
                background: 'rgba(255,255,255,0.06)', color: 'var(--ink-secondary)',
              }}>{h}</span>
            ))}
          </div>
        </div>

        {/* Optimal Snippet */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Optimal Snippet
          </div>
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
            "{hookAnalysis.optimal_snippet}"
          </div>
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-tertiary)' }}>
            Used in {hookAnalysis.snippet_appearance_pct}% of top videos
          </div>
        </div>
      </div>

      {/* Duration Comparison */}
      <div>
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
          Duration Comparison
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, borderTop: '0.5px solid rgba(255,255,255,0.04)', height: 'calc(100% - 32px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#30D158', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Top 10 Avg
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif' }}>
                {duration.top10_avg}s
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#FF453A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Bottom 10 Avg
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink)', fontFamily: '"DM Sans", sans-serif' }}>
                {duration.bottom10_avg}s
              </div>
            </div>
          </div>

          <div style={{
            borderLeft: '3px solid #e8430a',
            padding: '12px 16px',
            background: 'rgba(232,67,10,0.06)',
            borderRadius: '0 8px 8px 0',
          }}>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
              {duration.insight}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
