import React, { useState, useEffect, useCallback } from 'react';
import { Play } from 'lucide-react';
import TikTokEmbedModal from './TikTokEmbedModal';
import { supabase } from '@/integrations/supabase/client';

interface TikTokVideoCardProps {
  url: string;
  description?: string;
  stats?: string;
}

const TikTokVideoCard: React.FC<TikTokVideoCardProps> = ({ url, description, stats }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchOembed = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-tiktok-oembed', {
          body: { tiktokUrl: url },
        });
        if (cancelled) return;
        if (!error && data?.thumbnail_url) {
          setThumbnail(data.thumbnail_url);
        }
        if (data?.author_name) {
          setAuthorName(data.author_name);
        }
        if (data?.html) {
          setEmbedHtml(data.html);
        }
      } catch {
        // fallback handled by null thumbnail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOembed();
    return () => { cancelled = true; };
  }, [url]);

  const handleClick = useCallback(() => {
    if (embedHtml) {
      setIsModalOpen(true);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [embedHtml, url]);

  return (
    <>
      <div
        onClick={handleClick}
        className="w-[140px] flex-shrink-0 cursor-pointer group/card"
      >
        {/* Thumbnail */}
        <div className="aspect-[4/5] bg-[hsl(var(--muted))] rounded-lg overflow-hidden relative">
          {loading ? (
            <div className="w-full h-full bg-white/5 animate-pulse" />
          ) : thumbnail ? (
            <img
              src={thumbnail}
              alt={description || 'TikTok video'}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-muted-foreground/30" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.82a4.83 4.83 0 0 1-1-.13z" />
              </svg>
            </div>
          )}

          {/* Play button overlay */}
          {!loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-black/40 group-hover/card:bg-black/60 transition-colors duration-200 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Meta */}
        <p className="text-xs text-muted-foreground/50 mt-1.5 truncate">
          {authorName ? `@${authorName}` : 'TikTok'}
        </p>
        {description && (
          <p className="text-sm text-foreground/80 truncate mt-0.5">{description}</p>
        )}
        {stats && (
          <p className="text-xs text-muted-foreground/40 mt-0.5 truncate">{stats}</p>
        )}
      </div>

      {isModalOpen && (
        <TikTokEmbedModal
          embedHtml={embedHtml}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default React.memo(TikTokVideoCard);
