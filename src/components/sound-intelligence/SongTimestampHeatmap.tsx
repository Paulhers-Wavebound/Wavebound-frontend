import { useState } from 'react';
import { FormatHooks } from '@/types/soundIntelligence';

interface Props {
  songBars: number[];
  hooks: FormatHooks;
  videoCount: number;
  color: string;
}

function parseSnippetRange(snippet: string): { start: number; end: number } | null {
  if (!snippet) return null;
  const match = snippet.match(/(\d+):(\d+)\s*[-–]\s*(\d+):(\d+)/);
  if (!match) return null;
  return {
    start: parseInt(match[1]) * 60 + parseInt(match[2]),
    end: parseInt(match[3]) * 60 + parseInt(match[4]),
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongTimestampHeatmap({ songBars, hooks, videoCount, color }: Props) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const barCount = songBars.length;
  const songDuration = 120; // assume ~2 min
  const segmentDuration = songDuration / barCount;
  const maxBar = Math.max(...songBars, 1);

  const snippetRange = parseSnippetRange(hooks.snippet);
  const snippetStartIdx = snippetRange ? Math.floor(snippetRange.start / segmentDuration) : -1;
  const snippetEndIdx = snippetRange ? Math.ceil(snippetRange.end / segmentDuration) : -1;

  const isInSnippet = (i: number) => i >= snippetStartIdx && i <= snippetEndIdx;

  // Calculate label position for "Most used clip"
  const labelLeft = snippetRange ? `${(snippetStartIdx / barCount) * 100}%` : '0%';
  const labelWidth = snippetRange ? `${((snippetEndIdx - snippetStartIdx + 1) / barCount) * 100}%` : '0%';

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--ink-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Song Timestamp Heatmap
      </div>

      {/* Most used clip label */}
      {snippetRange && (
        <div style={{ position: 'relative', height: 18, marginBottom: 4 }}>
          <div style={{
            position: 'absolute', left: labelLeft, width: labelWidth,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>
            <span style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 10, fontWeight: 600, color, letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
            }}>
              Most used clip: {hooks.snippet}
            </span>
          </div>
        </div>
      )}

      {/* Bars */}
      <div style={{ position: 'relative', display: 'flex', gap: 2, alignItems: 'flex-end', height: 64 }}>
        {/* Hot zone background band */}
        {snippetRange && (
          <div style={{
            position: 'absolute',
            left: labelLeft, width: labelWidth,
            top: 0, bottom: 0,
            background: `${color}11`,
            borderRadius: 4,
            borderLeft: `1px solid ${color}33`,
            borderRight: `1px solid ${color}33`,
            pointerEvents: 'none',
          }} />
        )}

        {songBars.map((v, bi) => {
          const inSnippet = isInSnippet(bi);
          const barStart = bi * segmentDuration;
          const barEnd = barStart + segmentDuration;
          const relPct = Math.round((v / maxBar) * 100);
          const estVideos = Math.round((v / maxBar) * videoCount);
          const isPeak = v === maxBar && v > 0;

          return (
            <div
              key={bi}
              style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', height: '100%' }}
              onMouseEnter={() => setHoveredBar(bi)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div style={{
                width: '100%', height: `${Math.max(v, 5)}%`, borderRadius: 2,
                background: inSnippet
                  ? isPeak ? color : `${color}B3`
                  : 'rgba(255,255,255,0.08)',
                transition: 'height 300ms, background 200ms',
                transform: hoveredBar === bi ? 'scaleY(1.1)' : 'none',
                transformOrigin: 'bottom',
              }} />

              {/* Tooltip */}
              {hoveredBar === bi && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                  marginBottom: 6, padding: '6px 10px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
                  whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                    {formatTime(barStart)} – {formatTime(barEnd)}
                  </div>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {relPct}% of videos · {estVideos} of {videoCount}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time axis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>0:00</span>
        <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>0:30</span>
        <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>1:00</span>
        <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>1:30</span>
        <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>2:00</span>
      </div>

      {/* Insight line */}
      {snippetRange && (
        <div style={{
          fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-secondary)',
          marginTop: 10, lineHeight: 1.4,
        }}>
          Most creators clip <span style={{ fontWeight: 600, color }}>{hooks.snippet}</span> — {hooks.snippet_pct}% of top performers use this window
        </div>
      )}
    </div>
  );
}
