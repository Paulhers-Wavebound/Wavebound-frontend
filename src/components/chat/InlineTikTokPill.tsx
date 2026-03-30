import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import TikTokEmbedModal from './TikTokEmbedModal';

interface InlineTikTokPillProps {
  url: string;
}

const InlineTikTokPill: React.FC<InlineTikTokPillProps> = ({ url }) => {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (embedHtml) {
      setIsModalOpen(true);
      return;
    }

    setIsModalOpen(true);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-tiktok-oembed', {
        body: { tiktokUrl: url },
      });
      if (!error && data?.html) {
        setEmbedHtml(data.html);
      } else {
        setIsModalOpen(false);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setIsModalOpen(false);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  }, [embedHtml, url]);

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-colors text-xs align-middle cursor-pointer"
      >
        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9" /></svg>
        watch
      </button>
      {isModalOpen && (
        <TikTokEmbedModal
          embedHtml={embedHtml}
          loading={loading}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default React.memo(InlineTikTokPill);
