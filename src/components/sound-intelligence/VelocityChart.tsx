import { VelocityDay, LifecycleInfo } from '@/types/soundIntelligence';
import { formatNumber } from '@/utils/soundIntelligenceApi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
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

interface VelocityChartProps {
  velocity: VelocityDay[];
  lifecycle: LifecycleInfo;
}

export default function VelocityChart({ velocity, lifecycle }: VelocityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const filteredVelocity = useMemo(() => {
    if (timeRange === 'all') return velocity;

    const monthMap: Record<string, number> = { '3m': 90, '6m': 180, '9m': 270 };
    const days = monthMap[timeRange] ?? (timeRange === '24h' ? 24 : parseInt(timeRange));
    const isMonthly = timeRange in monthMap;
    const now = new Date();

    // Build lookup from existing velocity data
    const dateMap = new Map<string, VelocityDay>();
    velocity.forEach(v => {
      const parsed = new Date(v.date + ' ' + now.getFullYear());
      if (parsed > now) parsed.setFullYear(now.getFullYear() - 1);
      dateMap.set(parsed.toISOString().slice(0, 10), v);
    });

    // Generate complete daily series
    const dailySeries: VelocityDay[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dateMap.get(key);
      dailySeries.push(existing ? { ...existing, date: label } : { date: label, videos: 0, avg_views: 0 });
    }

    if (timeRange !== '3m' && timeRange !== '6m' && timeRange !== '9m') return dailySeries;

    // Aggregate into buckets (3-day for 3m, 7-day for 6m/9m)
    const chunkSize = timeRange === '3m' ? 3 : 7;
    const weekly: VelocityDay[] = [];
    for (let i = 0; i < dailySeries.length; i += chunkSize) {
      const chunk = dailySeries.slice(i, i + 7);
      const totalVideos = chunk.reduce((s, d) => s + d.videos, 0);
      const avgViews = chunk.filter(d => d.avg_views > 0);
      weekly.push({
        date: chunk[0].date,
        videos: totalVideos,
        avg_views: avgViews.length ? Math.round(avgViews.reduce((s, d) => s + d.avg_views, 0) / avgViews.length) : 0,
      });
    }
    return weekly;
  }, [velocity, timeRange]);

  const { peakIndex, currentVelocity, avg7d, peakValue } = useMemo(() => {
    if (filteredVelocity.length === 0) return { peakIndex: 0, currentVelocity: 0, avg7d: 0, peakValue: 0 };
    let pi = 0;
    filteredVelocity.forEach((d, i) => { if (d.videos > filteredVelocity[pi].videos) pi = i; });
    const last7 = filteredVelocity.slice(-7);
    return {
      peakIndex: pi,
      currentVelocity: filteredVelocity[filteredVelocity.length - 1]?.videos ?? 0,
      avg7d: Math.round(last7.reduce((s, d) => s + d.videos, 0) / last7.length),
      peakValue: filteredVelocity[pi]?.videos ?? 0,
    };
  }, [filteredVelocity]);

  const peakDate = filteredVelocity[peakIndex]?.date;

  const xInterval = filteredVelocity.length <= 7 ? 0 : Math.max(0, Math.floor(filteredVelocity.length / 18) - 1);

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 16,
      padding: 20,
      borderTop: '0.5px solid rgba(255,255,255,0.04)',
      flex: '1 1 60%',
    }}>
      {/* Header row with title + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink)',
        }}>
          Sound Velocity
        </div>

        <div style={{
          display: 'flex',
          gap: 4,
          background: '#2C2C2E',
          borderRadius: 8,
          padding: 3,
        }}>
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

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={filteredVelocity} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--ink-tertiary)' }}
            axisLine={false}
            tickLine={false}
            interval={xInterval}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--ink-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              background: '#2C2C2E',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '10px 14px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.87)', fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: 'rgba(255,255,255,0.87)' }}
            formatter={(value: number, _name: string, props: any) => {
              const day = props.payload as VelocityDay;
              const isPeak = day.date === peakDate;
              return [
                `${value} videos · ${formatNumber(day.avg_views)} avg views${isPeak ? ' ★ PEAK' : ''}`,
                '',
              ];
            }}
          />
          <ReferenceLine
            x={peakDate}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="4 4"
            label={{
              value: 'PEAK',
              position: 'top',
              fill: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontWeight: 600,
            }}
          />
          <Bar dataKey="videos" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {filteredVelocity.map((_, i) => (
              <Cell key={i} fill={i <= peakIndex ? '#e8430a' : '#FFD60A'} fillOpacity={i <= peakIndex ? 1 : 0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Mini stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
      }}>
        {[
          { label: 'Current', value: String(currentVelocity), sub: 'videos/day' },
          { label: '7D Average', value: String(avg7d), sub: 'videos/day' },
          { label: 'Peak', value: String(peakValue), sub: peakDate ?? '—' },
          { label: 'Since Peak', value: `${lifecycle.days_since_peak}d`, sub: 'days' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
