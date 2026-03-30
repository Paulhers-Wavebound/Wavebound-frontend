import { useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { parsePostingDates, calcFrequency } from '@/utils/postingFrequency';

interface Artist {
  id: string;
  artist_name: string;
  avatar_url: string | null;
  last_post_date: string | null;
  posting_dates: unknown;
}

interface AttentionCardProps {
  artists: Artist[];
  totalCount: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getIssue(artist: Artist): string {
  if (!artist.last_post_date) return 'No posting data available';
  const days = differenceInDays(new Date(), new Date(artist.last_post_date));
  if (days > 14) return `Hasn't posted in ${days} days`;
  if (days > 7) return `Posting slowed — last post ${days} days ago`;
  const freq = calcFrequency(parsePostingDates(artist.posting_dates), 30);
  if (freq !== null && freq > 14) return `Posting frequency dropped to every ${Math.round(freq)}d`;
  return 'Needs review';
}

export function AttentionCard({ artists, totalCount }: AttentionCardProps) {
  const navigate = useNavigate();
  const needsAttention = artists.filter(a => {
    if (!a.last_post_date) return true;
    return differenceInDays(new Date(), new Date(a.last_post_date)) > 7;
  });

  if (needsAttention.length === 0) return null;

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-sm)',
      padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--red)',
            animation: 'attentionPulse 2s infinite',
          }} />
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>
            Needs Attention
          </span>
        </div>
        <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-tertiary)' }}>
          {needsAttention.length} of {totalCount} artists
        </span>
      </div>

      {needsAttention.map((artist, i) => (
        <div
          key={artist.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            height: 56, 
            borderBottom: i < needsAttention.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
            background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {artist.avatar_url ? (
              <img src={artist.avatar_url} style={{ width: 36, height: 36, objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--ink-tertiary)' }}>
                {getInitials(artist.artist_name)}
              </span>
            )}
          </div>
          <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 15, color: 'var(--ink)', flexShrink: 0 }}>
            {artist.artist_name}
          </span>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'var(--ink-secondary)', flex: 1 }}>
            {getIssue(artist)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/label/artist/${artist.id}`); }}
            style={{
              fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 500,
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '6px 14px', background: 'transparent', color: 'var(--ink-secondary)',
              cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-secondary)'; }}
          >
            View
          </button>
        </div>
      ))}

      <style>{`
        @keyframes attentionPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
