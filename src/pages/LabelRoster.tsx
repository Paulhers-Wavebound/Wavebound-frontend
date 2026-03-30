import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLabelRole } from '@/hooks/useLabelRole';
import { LabelLayout } from '@/components/layout/LabelLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, AlertTriangle, Music, Users } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import SEOHead from '@/components/SEOHead';
import { parsePostingDates, calcFrequency } from '@/utils/postingFrequency';

interface ArtistRow {
  id: string;
  artist_name: string;
  artist_handle: string | null;
  avatar_url: string | null;
  tiktok_followers: number | null;
  spotify_popularity: number | null;
  posting_dates: unknown;
  last_post_date: string | null;
  status: string | null;
  updated_at: string | null;
}

export default function LabelRoster() {
  const navigate = useNavigate();
  const { isLabel, loading: roleLoading } = useLabelRole();
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isLabel) {
      navigate('/', { replace: true });
    }
  }, [roleLoading, isLabel, navigate]);

  useEffect(() => {
    if (!isLabel) return;

    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from('artist_intelligence' as any)
        .select('id, artist_name, artist_handle, avatar_url, tiktok_followers, spotify_popularity, posting_dates, last_post_date, status, updated_at')
        .order('artist_name');

      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists((data as any) || []);
      }
      setLoading(false);
    };

    fetchArtists();
  }, [isLabel]);

  const needsAttention = (artist: ArtistRow) => {
    const freq = calcFrequency(parsePostingDates(artist.posting_dates), 30);
    if (freq !== null && freq > 14) return true;
    if (artist.last_post_date) {
      const daysSince = differenceInDays(new Date(), parseISO(artist.last_post_date));
      if (daysSince > 14) return true;
    }
    return false;
  };

  const formatFollowers = (n: number | null) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  if (roleLoading || (!isLabel && !roleLoading)) {
    return (
      <LabelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </LabelLayout>
    );
  }

  return (
    <LabelLayout>
      <SEOHead title="Artist Roster — Wavebound" description="Manage your artist roster and intelligence reports." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Artist Roster</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {artists.length} artist{artists.length !== 1 ? 's' : ''} in your roster
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : artists.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No artists in your roster yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => {
              const attention = needsAttention(artist);
              return (
                <Card
                  key={artist.id}
                  className="p-5 cursor-pointer hover:border-primary/40 transition-colors group relative"
                  onClick={() => navigate(`/label/artist/${artist.id}`)}
                >
                  {attention && (
                    <Badge variant="destructive" className="absolute top-3 right-3 text-[10px] gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Needs attention
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={artist.avatar_url || undefined} alt={artist.artist_name} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                        {artist.artist_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{artist.artist_name}</p>
                      {artist.artist_handle && (
                        <p className="text-xs text-muted-foreground truncate">@{artist.artist_handle}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">TikTok</p>
                      <p className="font-medium text-foreground">{formatFollowers(artist.tiktok_followers)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Spotify</p>
                      <p className="font-medium text-foreground">{artist.spotify_popularity ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Post Freq.</p>
                      <p className="font-medium text-foreground">
                        {(() => { const f = calcFrequency(parsePostingDates(artist.posting_dates), 30); return f ? `${Math.round(f)}d` : '—'; })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Last Post</p>
                      <p className="font-medium text-foreground">
                        {artist.last_post_date
                          ? formatDistanceToNow(parseISO(artist.last_post_date), { addSuffix: true })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {artist.updated_at && (
                    <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border">
                      Updated {formatDistanceToNow(new Date(artist.updated_at), { addSuffix: true })}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </LabelLayout>
  );
}
