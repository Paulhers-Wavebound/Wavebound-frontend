import { LifecycleInfo } from '@/types/soundIntelligence';
import { Check, ArrowRight } from 'lucide-react';

interface Props {
  lifecycle: LifecycleInfo;
}

const PHASES = ['Ignition', 'Breakout', 'Sustain / Decay'];

function getPhaseIndex(phase: string): number {
  const lower = phase.toLowerCase();
  if (lower.includes('ignit')) return 0;
  if (lower.includes('break')) return 1;
  return 2;
}

export default function LifecycleCard({ lifecycle }: Props) {
  const activeIndex = getPhaseIndex(lifecycle.current_phase);

  return (
    <div>
      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
        Lifecycle Status
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
        {/* Phase Track */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
          {PHASES.map((phase, i) => {
            const isComplete = i < activeIndex;
            const isActive = i === activeIndex;

            return (
              <div key={phase} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', borderRadius: 10, flex: 1,
                  background: isActive ? 'rgba(232,67,10,0.1)' : isComplete ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? '1px solid rgba(232,67,10,0.3)' : '1px solid transparent',
                }}>
                  {isComplete ? (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#30D158', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#fff" />
                    </div>
                  ) : isActive ? (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e8430a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowRight size={13} color="#fff" />
                    </div>
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#e8430a' : isComplete ? '#30D158' : 'var(--ink-tertiary)',
                  }}>
                    {phase}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <div style={{ width: 24, height: 2, background: isComplete ? '#30D158' : 'var(--border)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{lifecycle.days_since_peak}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>Days since peak</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{lifecycle.current_velocity}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>Current velocity</div>
          </div>
        </div>

        {/* Insight */}
        <div style={{
          borderLeft: '3px solid #e8430a',
          padding: '12px 16px',
          background: 'rgba(232,67,10,0.06)',
          borderRadius: '0 8px 8px 0',
        }}>
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
            {lifecycle.insight}
          </div>
        </div>
      </div>
    </div>
  );
}
