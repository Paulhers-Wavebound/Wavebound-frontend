import { FormatBreakdown, VelocityDay, getFormatColor } from '@/types/soundIntelligence';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';

type TimeRange = '24h' | '7d' | '14d' | '30d' | '3m' | '6m' | '9m' | 'all';
const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '14d', label: '14D' },
  { value: '30d', label: '30D' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '9m', label: '9M' },
  { value: 'all', label: 'ALL' },
];

interface Props {
  formats: FormatBreakdown[];
  velocity: VelocityDay[];
  disabledLines: Set<string>;
  onToggleLine: (name: string) => void;
}

export default function FormatTrendsChart({ formats, velocity, disabledLines, onToggleLine }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const { series, bucketOrigIndices } = useMemo(() => {
    if (timeRange === 'all') {
      const indices = velocity.map((_, i) => [i]);
      return { series: velocity, bucketOrigIndices: indices };
    }

    const monthMap: Record<string, number> = { '3m': 90, '6m': 180, '9m': 270 };
    const days = monthMap[timeRange] ?? (timeRange === '24h' ? 24 : parseInt(timeRange));
    const isMonthly = timeRange in monthMap;
    const now = new Date();

    // Build lookup from existing velocity data
    const dateMap = new Map<string, { vel: VelocityDay; origIndex: number }>();
    velocity.forEach((v, i) => {
      const parsed = new Date(v.date + ' ' + now.getFullYear());
      if (parsed > now) parsed.setFullYear(now.getFullYear() - 1);
      dateMap.set(parsed.toISOString().slice(0, 10), { vel: v, origIndex: i });
    });

    // Build daily series with index tracking
    const dailySeries: { vel: VelocityDay; origIndices: number[] }[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dateMap.get(key);
      if (existing) {
        dailySeries.push({ vel: { ...existing.vel, date: label }, origIndices: [existing.origIndex] });
      } else {
        dailySeries.push({ vel: { date: label, videos: 0, avg_views: 0 }, origIndices: [] });
      }
    }

    if (timeRange !== '3m' && timeRange !== '6m' && timeRange !== '9m') {
      return {
        series: dailySeries.map(d => d.vel),
        bucketOrigIndices: dailySeries.map(d => d.origIndices),
      };
    }

    // Aggregate into buckets (3-day for 3m, 7-day for 6m/9m)
    const chunkSize = timeRange === '3m' ? 3 : 7;
    const s: VelocityDay[] = [];
    const bIndices: number[][] = [];
    for (let i = 0; i < dailySeries.length; i += chunkSize) {
      const chunk = dailySeries.slice(i, i + 7);
      const totalVideos = chunk.reduce((sum, d) => sum + d.vel.videos, 0);
      const avgViews = chunk.filter(d => d.vel.avg_views > 0);
      s.push({
        date: chunk[0].vel.date,
        videos: totalVideos,
        avg_views: avgViews.length ? Math.round(avgViews.reduce((sum, d) => sum + d.vel.avg_views, 0) / avgViews.length) : 0,
      });
      bIndices.push(chunk.flatMap(d => d.origIndices));
    }
    return { series: s, bucketOrigIndices: bIndices };
  }, [velocity, timeRange]);

  const data = useMemo(() => {
    return series.map((v, i) => {
      const point: Record<string, any> = { date: v.date };
      const origIndices = bucketOrigIndices[i] || [];
      formats.forEach(f => {
        point[f.name] = origIndices.reduce((sum, idx) => sum + (f.daily[idx] ?? 0), 0);
      });
      return point;
    });
  }, [formats, series, bucketOrigIndices]);

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 16,
      padding: 20,
      borderTop: '0.5px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          Format Trends
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#2C2C2E', borderRadius: 8, padding: 3 }}>
          {TIME_OPTIONS.map(opt => {
            const active = timeRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: active ? '#e8430a' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-tertiary)' }} axisLine={false} tickLine={false} interval={data.length <= 7 ? 0 : Math.max(0, Math.floor(data.length / 18) - 1)} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--ink-tertiary)' }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              const nonZero = payload.filter(p => Number(p.value) > 0);
              
              return (
                <div style={{ background: '#2C2C2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontFamily: '"DM Sans", sans-serif', fontSize: 12 }}>
                  <div style={{ color: 'rgba(255,255,255,0.87)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  {nonZero.map(p => (
                    <div key={String(p.dataKey)} style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: String(p.color) }} />
                      <span>{p.name}: {p.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          {formats.map((f, i) => (
            <Line
              key={f.name}
              type="monotone"
              dataKey={f.name}
              stroke={getFormatColor(f.name, i)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              hide={disabledLines.has(f.name)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14 }}>
        {formats.map((f, i) => (
          <button
            key={f.name}
            onClick={() => onToggleLine(f.name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              opacity: disabledLines.has(f.name) ? 0.3 : 1,
              transition: 'opacity 150ms',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: getFormatColor(f.name, i), flexShrink: 0 }} />
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'var(--ink-secondary)' }}>{f.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
