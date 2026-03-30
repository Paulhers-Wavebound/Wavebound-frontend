import React, { useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';

interface TikTokEmbedModalProps {
  embedHtml: string | null;
  loading?: boolean;
  onClose: () => void;
}

const TikTokEmbedModal: React.FC<TikTokEmbedModalProps> = ({ embedHtml, loading, onClose }) => {
  useEffect(() => {
    if (embedHtml) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [embedHtml]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[340px] max-h-[90vh] relative overflow-auto">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 z-10 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
          </div>
        ) : embedHtml ? (
          <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
        ) : null}
      </div>
    </div>
  );
};

export default React.memo(TikTokEmbedModal);
