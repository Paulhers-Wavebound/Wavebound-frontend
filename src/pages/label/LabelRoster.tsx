import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLabelRole } from '@/hooks/useLabelRole';
import LabelLayout from './LabelLayout';
import { ArtistRow } from '@/components/label/ArtistRow';
import SEOHead from '@/components/SEOHead';
import { parsePostingDates, calcFrequency, getLastPostDate, type FrequencyWindow } from '@/utils/postingFrequency';

interface ArtistRaw {
  id: string;
  artist_name: string;
  artist_handle: string | null;
  avatar_url: string | null;
  tiktok_followers: number | null;
  spotify_popularity: number | null;
  posting_dates_tiktok: unknown;
  posting_dates_instagram: unknown;
  last_post_date: string | null;
  status: string | null;
  updated_at: string | null;
}

type SortKey = 'name' | 'updated' | 'frequency' | 'attention';

const FREQ_OPTIONS: { label: string; value: FrequencyWindow }[] = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export default function LabelRosterPage() {
  const navigate = useNavigate();
  const { isLabel, loading: roleLoading } = useLabelRole();
  const [artists, setArtists] = useState<ArtistRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [freqWindow, setFreqWindow] = useState<FrequencyWindow>(30);

  useEffect(() => {
    if (!roleLoading && !isLabel) navigate('/', { replace: true });
  }, [roleLoading, isLabel, navigate]);

  useEffect(() => {
    if (!isLabel) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('artist_intelligence' as any)
        .select('id, artist_name, artist_handle, avatar_url, tiktok_followers, spotify_popularity, posting_dates_tiktok, posting_dates_instagram, last_post_date, status, updated_at')
        .order('artist_name');
      if (err) { setError(true); setLoading(false); return; }
      setArtists((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [isLabel]);

  const enriched = useMemo(() => {
    return artists.map(a => {
      const tiktokDates = parsePostingDates(a.posting_dates_tiktok);
      const instaDates = parsePostingDates(a.posting_dates_instagram);
      const allDates = [...tiktokDates, ...instaDates];
      const freqTT = calcFrequency(tiktokDates, freqWindow);
      const freqIG = calcFrequency(instaDates, freqWindow);
      const lastPost = a.last_post_date || getLastPostDate(allDates);
      return { ...a, freq_tt: freqTT, freq_ig: freqIG, last_post_date: lastPost };
    });
  }, [artists, freqWindow]);

  const sorted = [...enriched].sort((a, b) => {
    switch (sortBy) {
      case 'updated': return (new Date(b.updated_at || 0).getTime()) - (new Date(a.updated_at || 0).getTime());
      case 'frequency': return (a.freq_tt || 999) - (b.freq_tt || 999);
      case 'attention': {
        const score = (x: typeof a) => {
          if (!x.last_post_date) return 0;
          const days = (Date.now() - new Date(x.last_post_date).getTime()) / 86400000;
          return days > 14 ? 0 : days > 7 ? 1 : 2;
        };
        return score(a) - score(b);
      }
      default: return a.artist_name.localeCompare(b.artist_name);
    }
  });

  if (roleLoading || (loading && !error)) {
    return (
      <LabelLayout>
        <SEOHead title="Roster — Wavebound Label" description="Your artist roster" />
        <div style={{ padding: 32 }}>
          <div style={{ width: 200, height: 32, background: 'var(--bg-subtle)', borderRadius: 4, marginBottom: 12, animation: 'labelPulse 1.5s infinite' }} />
          <div style={{ width: 100, height: 20, background: 'var(--bg-subtle)', borderRadius: 4, marginBottom: 32, animation: 'labelPulse 1.5s infinite' }} />
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', height: 76, gap: 16, padding: '0 0', borderBottom: '1px solid var(--border)', animation: `labelPulse 1.5s infinite ${i * 100}ms` }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-subtle)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 160, height: 16, background: 'var(--bg-subtle)', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: 100, height: 12, background: 'var(--bg-subtle)', borderRadius: 4 }} />
              </div>
              <div className="hidden lg:flex" style={{ gap: 24 }}>
                {[0,1,2,3].map(j => <div key={j} style={{ width: 60, height: 14, background: 'var(--bg-subtle)', borderRadius: 4 }} />)}
              </div>
            </div>
          ))}
        </div>
        <style>{`@keyframes labelPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
      </LabelLayout>
    );
  }

  if (error) {
    return (
      <LabelLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 16, color: 'var(--ink)' }}>Something went wrong</div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 14, color: 'var(--ink-tertiary)' }}>Could not load your roster. Try refreshing.</div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 8, padding: '8px 20px', border: '1px solid var(--accent)', borderRadius: 6, background: 'transparent', color: 'var(--accent)', fontFamily: '"Syne", sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </LabelLayout>
    );
  }

  return (
    <LabelLayout>
      <SEOHead title="Roster — Wavebound Label" description="Your artist roster" />
      <div style={{ padding: '32px 32px 0' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 32, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          Your Roster
        </h1>
        <p style={{ fontFamily: '"Syne", sans-serif', fontSize: 15, color: 'var(--ink-tertiary)', margin: '8px 0 0' }}>
          {sorted.length} artist{sorted.length !== 1 ? 's' : ''}
        </p>

        {/* Sort + Freq window */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12, alignItems: 'center' }}>
          {/* Frequency window toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {FREQ_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFreqWindow(opt.value)}
                className="font-['JetBrains_Mono'] text-[11px] font-medium px-2.5 py-1.5 cursor-pointer border-none"
                style={{
                  background: freqWindow === opt.value ? 'var(--accent)' : 'transparent',
                  color: freqWindow === opt.value ? '#fff' : 'var(--ink-tertiary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            style={{
              fontFamily: '"Syne", sans-serif', fontSize: 13, color: 'var(--ink)',
              border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px',
              background: 'var(--surface)', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="name">Sort by name</option>
            <option value="updated">Sort by last updated</option>
            <option value="frequency">Sort by posting frequency</option>
            <option value="attention">Sort by attention needed</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {sorted.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 8 }}>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, color: 'var(--ink)' }}>No artists yet</div>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 15, color: 'var(--ink-tertiary)' }}>Artists will appear here once they've been analyzed.</div>
          </div>
        ) : (
          sorted.map((artist, i) => (
            <ArtistRow
              key={artist.id}
              index={i}
              id={artist.id}
              artist_name={artist.artist_name}
              artist_handle={artist.artist_handle}
              avatar_url={artist.avatar_url}
              tiktok_followers={artist.tiktok_followers}
              spotify_popularity={artist.spotify_popularity}
              freq_tt={artist.freq_tt}
              freq_ig={artist.freq_ig}
              last_post_date={artist.last_post_date}
            />
          ))
        )}
      </div>
    </LabelLayout>
  );
}
