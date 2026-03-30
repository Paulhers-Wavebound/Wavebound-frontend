import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ArtistRowProps {
  id: string;
  artist_name: string;
  artist_handle: string | null;
  avatar_url: string | null;
  tiktok_followers: number | null;
  spotify_popularity: number | null;
  freq_tt: number | null;
  freq_ig: number | null;
  last_post_date: string | null;
  avg_views?: number | null;
  median_views?: number | null;
  avg_engagement?: number | null;
  avg_saves?: number | null;
  has_plan?: boolean;
  isOnboarding?: boolean;
  index: number;
}

function formatNumber(n: number | null): string {
  if (n == null) return '–';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getFreqColor(days: number | null): string {
  if (days === null) return 'var(--ink)';
  if (days <= 7) return 'var(--green)';
  if (days <= 14) return 'var(--yellow)';
  return 'var(--red)';
}

function getEngagementColor(eng: number | null): string {
  if (eng == null) return 'var(--ink-secondary)';
  if (eng >= 8) return 'var(--green)';
  if (eng >= 5) return 'var(--ink)';
  return 'var(--red)';
}

export function ArtistRow(props: ArtistRowProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/label/artist/${props.id}`)}
      className="group grid items-center px-6 cursor-pointer transition-colors duration-100"
      style={{
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr',
        height: 76,
        borderBottom: '1px solid var(--border)',
        animation: `labelRowIn 200ms ease-out ${props.index * 25}ms both`,
        minWidth: 1200,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Artist — avatar + name + handle */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            width: 48, height: 48, borderRadius: 10,
            background: 'var(--bg-subtle)',
          }}
        >
          {props.avatar_url ? (
            <img src={props.avatar_url} alt={props.artist_name} className="w-full h-full object-cover" />
          ) : (
            <span
              className="font-['DM_Sans'] text-sm font-semibold"
              style={{ color: 'var(--ink-tertiary)' }}
            >
              {getInitials(props.artist_name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div
            className="font-['DM_Sans'] text-[15px] font-semibold truncate"
            style={{ color: 'var(--ink)' }}
          >
            {props.artist_name}
          </div>
          <div
            className="font-['DM_Sans'] text-xs truncate"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            {props.artist_handle ? `@${props.artist_handle}` : '—'}
          </div>
        </div>
      </div>

      {/* Last Post */}
      <div className="hidden lg:block">
        <span className="font-['JetBrains_Mono'] text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
          {formatDate(props.last_post_date)}
        </span>
      </div>

      {/* TikTok Followers */}
      <div className="hidden lg:block">
        <span className="font-['JetBrains_Mono'] text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
          {formatNumber(props.tiktok_followers)}
        </span>
      </div>

      {/* TikTok Frequency */}
      <div className="hidden lg:block">
        <span
          className="font-['JetBrains_Mono'] text-[14px] font-medium"
          style={{ color: getFreqColor(props.freq_tt) }}
        >
          {props.freq_tt !== null ? `Every ${Math.round(props.freq_tt)}d` : '—'}
        </span>
      </div>

      {/* Instagram Frequency */}
      <div className="hidden lg:block">
        <span
          className="font-['JetBrains_Mono'] text-[14px] font-medium"
          style={{ color: getFreqColor(props.freq_ig) }}
        >
          {props.freq_ig !== null ? `Every ${Math.round(props.freq_ig)}d` : '—'}
        </span>
      </div>

      {/* Spotify */}
      <div className="hidden lg:block">
        <span className="font-['JetBrains_Mono'] text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
          {props.spotify_popularity !== null ? (
            <>{props.spotify_popularity}<span style={{ color: 'var(--ink-faint)' }}>/100</span></>
          ) : '—'}
        </span>
      </div>

      {/* Avg Views */}
      <div className="hidden lg:block">
        <span className="font-['JetBrains_Mono'] text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
          {formatNumber(props.avg_views)}
        </span>
      </div>

      {/* Median Views */}
      <div className="hidden lg:block">
        <span className="font-['JetBrains_Mono'] text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
          {formatNumber(props.median_views)}
        </span>
      </div>

      {/* Engagement % */}
      <div className="hidden lg:block">
        <span
          className="font-['JetBrains_Mono'] text-[14px] font-medium"
          style={{ color: getEngagementColor(props.avg_engagement) }}
        >
          {props.avg_engagement != null ? `${Math.round(props.avg_engagement)}%` : '–'}
        </span>
      </div>

      {/* Avg Saves */}
      <div className="hidden lg:block">
        <span className="font-['JetBrains_Mono'] text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
          {formatNumber(props.avg_saves)}
        </span>
      </div>

      {/* Status + Chevron */}
      <div className="flex items-center justify-between">
        {props.isOnboarding ? (
          <span
            className="animate-pulse"
            style={{
              display: 'inline-flex', alignItems: 'center',
              height: 24, padding: '0 10px', borderRadius: 12,
              background: 'hsl(38 92% 50% / 0.15)', color: 'hsl(38 92% 50%)',
              border: '1px solid hsl(38 92% 50% / 0.25)',
              fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.3px', whiteSpace: 'nowrap',
            }}
          >
            Onboarding...
          </span>
        ) : (
          <StatusBadge lastPostDate={props.last_post_date} postingFrequencyDays={props.freq_tt} />
        )}
        <ChevronRight
          size={16}
          className="group-hover:translate-x-1 transition-transform duration-200"
          style={{ color: 'var(--ink-faint)' }}
        />
      </div>

      {/* Content Plan */}
      <div className="flex items-center justify-center">
        {props.has_plan ? (
          <Check size={16} style={{ color: 'var(--green)' }} />
        ) : (
          <span className="font-['JetBrains_Mono'] text-[14px]" style={{ color: 'var(--ink-faint)' }}>–</span>
        )}
      </div>
    </div>
  );
}
