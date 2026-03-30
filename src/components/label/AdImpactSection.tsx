import { useMemo, useState } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, LineChart,
} from 'recharts';

/* ────────── Confidence Gauge (SVG arc) ────────── */

function ConfidenceGauge({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;
  const color = value >= 70 ? '#22C55E' : value >= 30 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex flex-col items-center gap-1" style={{ width: size, height: size + 20 }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#2C2C2E" strokeWidth={5}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{
          color, fontSize: size * 0.28, lineHeight: 1,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          marginTop: -10,
        }}
      >
        {value}%
      </span>
      <span className="text-[10px]" style={{ color: '#8E8E93', marginTop: -4 }}>Causation Confidence</span>
    </div>
  );
}

/* ────────── Hardcoded chart data ────────── */

const FEATURED_DATA = [
  { date: 'Feb 10', listeners: 11200, views: 800 },
  { date: 'Feb 12', listeners: 11300, views: 900 },
  { date: 'Feb 14', listeners: 11400, views: 1100 },
  { date: 'Feb 16', listeners: 11500, views: 1400 },
  { date: 'Feb 18', listeners: 11600, views: 18500 },
  { date: 'Feb 20', listeners: 12100, views: 42000 },
  { date: 'Feb 22', listeners: 14800, views: 31000 },
  { date: 'Feb 24', listeners: 16500, views: 22000 },
  { date: 'Feb 26', listeners: 18300, views: 15000 },
  { date: 'Feb 28', listeners: 19100, views: 11000 },
  { date: 'Mar 2', listeners: 18700, views: 8500 },
  { date: 'Mar 4', listeners: 18400, views: 7200 },
  { date: 'Mar 6', listeners: 18100, views: 6800 },
  { date: 'Mar 8', listeners: 18300, views: 6200 },
  { date: 'Mar 10', listeners: 18200, views: 5800 },
];

const SPARKLINE_HIGH = [
  { v: 4200 }, { v: 4300 }, { v: 4500 }, { v: 4600 },
  { v: 5100 }, { v: 5800 }, { v: 6200 }, { v: 6500 }, { v: 6600 },
];

const SPARKLINE_LOW = [
  { v: 17000 }, { v: 17200 }, { v: 17800 }, { v: 19500 },
  { v: 24000 }, { v: 28000 }, { v: 31000 }, { v: 32200 }, { v: 32100 },
];

/* ────────── Confounding factor row ────────── */

function FactorRow({ icon, text, tag, negative }: { icon: string; text: string; tag: string; negative: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-sm flex-shrink-0">{icon}</span>
      <span className="text-xs flex-1" style={{ color: '#ccc' }}>{text}</span>
      <span
        className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: negative ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
          color: negative ? '#F59E0B' : '#22C55E',
        }}
      >
        {tag}
      </span>
    </div>
  );
}

/* ────────── Custom tooltip ────────── */

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1C1C1E', border: '1px solid #3A3A3C' }}>
      <p className="font-medium mb-1" style={{ color: '#fff' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value >= 1000 ? (p.value / 1000).toFixed(1) + 'K' : p.value}
        </p>
      ))}
    </div>
  );
}

/* ────────── Small campaign card ────────── */

function SmallCampaignCard({
  handle, confidence, sparklineData, summary, factors,
  avatarUrl,
}: {
  handle: string;
  confidence: number;
  sparklineData: { v: number }[];
  summary: string;
  factors: { icon: string; text: string; tag: string; negative: boolean }[];
  avatarUrl?: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: '#1C1C1E', border: '1px solid #3A3A3C' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avatarUrl && !imgError ? (
            <img src={avatarUrl} alt={handle} className="w-7 h-7 rounded-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: '#3A3A3C', color: '#fff' }}>
              {handle[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-xs font-medium" style={{ color: '#fff' }}>@{handle}</span>
        </div>
        <div className="relative flex items-center justify-center">
          <ConfidenceGauge value={confidence} size={56} />
        </div>
      </div>

      <div style={{ height: 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line
              type="monotone" dataKey="v" dot={false}
              stroke={confidence >= 70 ? '#22C55E' : confidence >= 30 ? '#F59E0B' : '#EF4444'}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: '#8E8E93' }}>{summary}</p>

      <div className="border-t pt-2" style={{ borderColor: '#2C2C2E' }}>
        {factors.map((f, i) => (
          <FactorRow key={i} {...f} />
        ))}
      </div>
    </div>
  );
}

/* ────────── Main section ────────── */

export default function AdImpactSection({ avatarMap }: { avatarMap?: Map<string, string | null> }) {
  const tobiasAvatar = avatarMap?.get('tobiassten') ?? null;
  const lillecaesarAvatar = avatarMap?.get('lillecaesar') ?? null;
  const [featuredImgError, setFeaturedImgError] = useState(false);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#fff' }}>Ad Impact Attribution</h2>
        <p className="text-xs mt-0.5" style={{ color: '#8E8E93' }}>Beta — Launching Q2 2026</p>
      </div>

      {/* Featured campaign card */}
      <div className="rounded-xl p-6 space-y-5" style={{ background: '#1C1C1E', border: '1px solid #3A3A3C' }}>
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {tobiasAvatar && !featuredImgError ? (
              <img src={tobiasAvatar} alt="tobiassten" className="w-10 h-10 rounded-full object-cover" onError={() => setFeaturedImgError(true)} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: '#3A3A3C', color: '#fff' }}>T</div>
            )}
            <div>
              <span className="text-sm font-semibold" style={{ color: '#fff' }}>@tobiassten</span>
              <p className="text-xs mt-0.5 max-w-xs truncate" style={{ color: '#8E8E93' }}>
                "Eg e så takknemlig for at dåke forsatt høyre..."
              </p>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <ConfidenceGauge value={35} size={80} />
          </div>
        </div>

        {/* Dual-axis chart */}
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={FEATURED_DATA} margin={{ top: 30, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" />
              <XAxis dataKey="date" tick={{ fill: '#8E8E93', fontSize: 11 }} axisLine={{ stroke: '#2C2C2E' }} tickLine={false} />
              <YAxis
                yAxisId="left" orientation="left"
                tick={{ fill: '#8E8E93', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => (v / 1000).toFixed(0) + 'K'}
              />
              <YAxis
                yAxisId="right" orientation="right"
                tick={{ fill: '#8E8E93', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => (v / 1000).toFixed(0) + 'K'}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine
                x="Feb 18" yAxisId="left"
                stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1.5}
                label={{ value: 'Ad Started — Feb 18', position: 'insideTopLeft', fill: '#F59E0B', fontSize: 10, dy: -20 }}
              />
              <Line
                yAxisId="left" type="monotone" dataKey="listeners" name="Spotify Listeners"
                stroke="#22C55E" strokeWidth={2} dot={false}
              />
              <Line
                yAxisId="right" type="monotone" dataKey="views" name="TikTok Views"
                stroke="#3B82F6" strokeWidth={2} dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-[11px]" style={{ color: '#8E8E93' }}>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: '#22C55E' }} /> Spotify Monthly Listeners</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: '#3B82F6' }} /> TikTok Views (boosted post)</span>
        </div>

        {/* Confounding factors */}
        <div className="border-t pt-4" style={{ borderColor: '#2C2C2E' }}>
          <p className="text-[11px] font-medium mb-2" style={{ color: '#8E8E93' }}>Why not 100%?</p>
          <FactorRow icon="🟡" text="Artist posted new video on Feb 20" tag="−20% confidence" negative />
          <FactorRow icon="🟡" text="UGC spike: ~340 fan videos detected Feb 17-19" tag="−25% confidence" negative />
          <FactorRow icon="🟢" text="No new playlist placements detected" tag="No impact" negative={false} />
          <FactorRow icon="🟢" text="No concert/event in period" tag="No impact" negative={false} />
        </div>

        {/* Summary */}
        <p className="text-xs leading-relaxed" style={{ color: '#8E8E93' }}>
          Spotify listeners increased <span className="font-bold" style={{ color: '#fff' }}>+7.1K (+63%)</span> during campaign window. Estimated <span className="font-bold" style={{ color: '#fff' }}>35%</span> attributable to paid boost.
        </p>
      </div>

      {/* Two smaller cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmallCampaignCard
          handle="lillecaesar"
          confidence={82}
          sparklineData={SPARKLINE_HIGH}
          avatarUrl={lillecaesarAvatar}
          summary="Listeners +2.4K (+18%). High confidence — no competing signals detected."
          factors={[
            { icon: '🟢', text: 'No new playlist placements detected', tag: 'No impact', negative: false },
            { icon: '🟢', text: 'No concert/event in period', tag: 'No impact', negative: false },
            { icon: '🟢', text: 'No viral UGC activity', tag: 'No impact', negative: false },
          ]}
        />
        <SmallCampaignCard
          handle="tobiassten"
          confidence={12}
          sparklineData={SPARKLINE_LOW}
          avatarUrl={tobiasAvatar}
          summary="Listeners +15.2K (+89%). Low confidence — viral UGC wave likely primary driver."
          factors={[
            { icon: '🔴', text: 'Viral fan video (2.1M views)', tag: '−60% confidence', negative: true },
            { icon: '🟡', text: 'Song added to Discover Weekly', tag: '−20% confidence', negative: true },
          ]}
        />
      </div>
    </section>
  );
}
