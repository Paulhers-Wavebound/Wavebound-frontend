import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LabelLayout from './LabelLayout';
import SEOHead from '@/components/SEOHead';
import { Search, ChevronRight, Play, Eye, Heart, Flame } from 'lucide-react';
import TikTokEmbed from '@/components/TikTokEmbed';

/* ── types ── */
interface Artist {
  id: string;
  artist_name: string;
  artist_handle: string | null;
  avatar_url: string | null;
  content_plan_html: string | null;
  updated_at: string | null;
}

interface TikTokVideo {
  id: number;
  video_embedded_url: string | null;
  video_url: string | null;
  caption: string | null;
  video_views: number | null;
  video_likes: number | null;
  viral_score: number | null;
  date_posted: string | null;
  duration: number | null;
}

/* ── helpers ── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(date: string | null): string {
  if (!date) return '—';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400);
  if (d < 7) return d + 'd ago';
  if (d < 30) return Math.floor(d / 7) + 'w ago';
  return Math.floor(d / 30) + 'mo ago';
}

function formatNum(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

/**
 * Extract numeric IDs from content_plan_html using multiple strategies:
 * - data-video-id="123"
 * - data-id="123"
 * - id="video-123" or id="video_123"
 * - Standalone numeric patterns in href/src attributes referencing videos
 * - JSON-like "id": "123" or "video_embed_id": "123"
 */
function extractVideoIdsFromHtml(html: string): number[] {
  const ids = new Set<number>();

  // data-video-id="123"
  const dataVideoId = /data-video-id=["'](\d+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = dataVideoId.exec(html)) !== null) ids.add(parseInt(m[1]));

  // data-id="123"
  const dataId = /data-id=["'](\d+)["']/g;
  while ((m = dataId.exec(html)) !== null) ids.add(parseInt(m[1]));

  // id="video-123" or id="video_123"
  const videoIdAttr = /id=["']video[-_](\d+)["']/g;
  while ((m = videoIdAttr.exec(html)) !== null) ids.add(parseInt(m[1]));

  // JSON-style: "id": "123", "id": 123, "video_embed_id": "123"
  const jsonId = /["'](id|video_embed_id|video_id|content_id)["']\s*:\s*["']?(\d+)["']?/g;
  while ((m = jsonId.exec(html)) !== null) ids.add(parseInt(m[2]));

  // data-content-id="123"
  const contentId = /data-content-id=["'](\d+)["']/g;
  while ((m = contentId.exec(html)) !== null) ids.add(parseInt(m[1]));

  // TikTok URL patterns: /video/1234567890
  const tiktokVideoUrl = /\/video\/(\d{10,})/g;
  while ((m = tiktokVideoUrl.exec(html)) !== null) {
    // These are TikTok post IDs, not DB IDs — skip
  }

  return Array.from(ids);
}

/* ── Video Card (click-to-play) ── */
function VideoCard({ video }: { video: TikTokVideo }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = video.video_embedded_url || video.video_url;

  if (playing && embedUrl) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
        <TikTokEmbed tiktokUrl={embedUrl} showShareOverlay={false} className="!min-w-0" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="text-left rounded-2xl overflow-hidden transition-all duration-150 w-full border-none cursor-pointer group"
      style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Thumbnail placeholder */}
      <div
        className="relative flex items-center justify-center"
        style={{ aspectRatio: '9/16', maxHeight: 320, background: 'var(--bg-subtle)' }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
          <Play size={24} fill="white" color="white" />
        </div>
        {/* Viral score badge */}
        {video.viral_score != null && video.viral_score > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
            <Flame size={12} color="#f97316" />
            <span className="font-['JetBrains_Mono'] text-[11px] font-semibold text-white">{video.viral_score}</span>
          </div>
        )}
        {/* Duration */}
        {video.duration != null && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="font-['JetBrains_Mono'] text-[11px] text-white">
              {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        {video.caption && (
          <p className="font-['DM_Sans'] text-xs line-clamp-2 mb-2.5" style={{ color: 'var(--ink)' }}>
            {video.caption.slice(0, 100)}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Eye size={13} style={{ color: 'var(--ink-faint)' }} />
            <span className="font-['JetBrains_Mono'] text-[11px]" style={{ color: 'var(--ink-tertiary)' }}>
              {formatNum(video.video_views)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={13} style={{ color: 'var(--ink-faint)' }} />
            <span className="font-['JetBrains_Mono'] text-[11px]" style={{ color: 'var(--ink-tertiary)' }}>
              {formatNum(video.video_likes)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Main Page ── */
export default function LabelContentPlans() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [videosByArtist, setVideosByArtist] = useState<Record<string, TikTokVideo[]>>({});

  // Fetch artists
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('artist_intelligence' as any)
        .select('id, artist_name, artist_handle, avatar_url, content_plan_html, updated_at')
        .order('artist_name');
      setArtists((data as any) || []);
      setLoading(false);
    })();
  }, []);

  // Extract video IDs and fetch from TikTok table
  useEffect(() => {
    if (artists.length === 0) return;

    const artistsWithPlan = artists.filter(a => a.content_plan_html);
    if (artistsWithPlan.length === 0) return;

    // Build a map of artist id -> extracted video IDs
    const artistIdMap: Record<string, number[]> = {};
    const allIds = new Set<number>();

    for (const a of artistsWithPlan) {
      const ids = extractVideoIdsFromHtml(a.content_plan_html!);
      artistIdMap[a.id] = ids;
      ids.forEach(id => allIds.add(id));
    }

    if (allIds.size === 0) return;

    (async () => {
      const idArray = Array.from(allIds);
      // Supabase .in() has a limit; batch if needed
      const batchSize = 100;
      const allVideos: TikTokVideo[] = [];

      for (let i = 0; i < idArray.length; i += batchSize) {
        const batch = idArray.slice(i, i + batchSize);
        const { data } = await supabase
          .from('0.1. Table 2 - Video - TikTok' as any)
          .select('id, video_embedded_url, video_url, caption, video_views, video_likes, viral_score, date_posted, duration')
          .in('id', batch);
        if (data) allVideos.push(...(data as any));
      }

      // Build lookup
      const videoMap = new Map<number, TikTokVideo>();
      for (const v of allVideos) videoMap.set(v.id, v);

      // Assign videos per artist
      const result: Record<string, TikTokVideo[]> = {};
      for (const a of artistsWithPlan) {
        const ids = artistIdMap[a.id] || [];
        result[a.id] = ids.map(id => videoMap.get(id)).filter(Boolean) as TikTokVideo[];
      }

      setVideosByArtist(result);
    })();
  }, [artists]);

  const filtered = useMemo(() =>
    artists.filter(a =>
      !search || a.artist_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.artist_handle && a.artist_handle.toLowerCase().includes(search.toLowerCase()))
    ),
  [artists, search]);

  const withPlan = filtered.filter(a => a.content_plan_html);
  const withoutPlan = filtered.filter(a => !a.content_plan_html);

  if (loading) {
    return (
      <LabelLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-6 h-6 border-[2.5px] border-border border-t-accent rounded-full animate-spin" />
        </div>
      </LabelLayout>
    );
  }

  return (
    <LabelLayout>
      <SEOHead title="Content Plans — Wavebound Label" description="Artist content plans" />
      <div className="p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-['Playfair_Display'] text-2xl font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            Content Plans
          </h1>
          <p className="font-['DM_Sans'] text-sm" style={{ color: 'var(--ink-tertiary)' }}>
            View and manage content plans for your roster
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl flex-1 min-w-[200px] max-w-[320px]"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
          >
            <Search size={16} style={{ color: 'var(--ink-faint)' }} />
            <input
              type="text"
              placeholder="Search artists..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none font-['DM_Sans'] text-sm w-full"
              style={{ color: 'var(--ink)' }}
            />
          </div>
        </div>

        {/* Per-artist sections with videos */}
        {withPlan.map(artist => {
          const videos = videosByArtist[artist.id] || [];
          return (
            <div key={artist.id} className="mb-10">
              {/* Artist header */}
              <button
                onClick={() => navigate(`/label/artist/${artist.id}?tab=plan`)}
                className="flex items-center gap-3 mb-4 group cursor-pointer bg-transparent border-none p-0"
              >
                <div
                  className="w-10 h-10 rounded-[10px] overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg)', border: '1.5px solid var(--border)' }}
                >
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.artist_name} className="w-10 h-10 object-cover" />
                  ) : (
                    <span className="font-['DM_Sans'] text-xs font-semibold" style={{ color: 'var(--ink-tertiary)' }}>
                      {getInitials(artist.artist_name)}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-['DM_Sans'] text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                    {artist.artist_name}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--ink-faint)' }} />
                  </div>
                  <div className="font-['JetBrains_Mono'] text-xs" style={{ color: 'var(--ink-tertiary)' }}>
                    {videos.length} video{videos.length !== 1 ? 's' : ''} · Updated {timeAgo(artist.updated_at)}
                  </div>
                </div>
              </button>

              {/* Video grid */}
              {videos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {videos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl px-4 py-6 text-center" style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border)' }}>
                  <p className="font-['DM_Sans'] text-xs" style={{ color: 'var(--ink-faint)' }}>
                    No linked videos found in this plan
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Artists without plans */}
        {withoutPlan.length > 0 && (
          <>
            <div className="font-['DM_Sans'] text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--ink-faint)' }}>
              No plan yet ({withoutPlan.length})
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
              {withoutPlan.map((artist, i) => (
                <div
                  key={artist.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: i < withoutPlan.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.artist_name} className="w-8 h-8 object-cover" />
                    ) : (
                      <span className="font-['DM_Sans'] text-[10px] font-semibold" style={{ color: 'var(--ink-tertiary)' }}>
                        {getInitials(artist.artist_name)}
                      </span>
                    )}
                  </div>
                  <span className="font-['DM_Sans'] text-sm" style={{ color: 'var(--ink)' }}>
                    {artist.artist_name}
                  </span>
                  <span className="font-['DM_Sans'] text-xs ml-auto" style={{ color: 'var(--ink-faint)' }}>
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="font-['Playfair_Display'] text-xl" style={{ color: 'var(--ink)' }}>No artists found</p>
            <p className="font-['DM_Sans'] text-sm" style={{ color: 'var(--ink-tertiary)' }}>Try a different search term.</p>
          </div>
        )}
      </div>
    </LabelLayout>
  );
}
