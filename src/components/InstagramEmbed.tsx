import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, AlertCircle, Play } from 'lucide-react';
import { stopAllMedia, onStopAllMedia } from '@/utils/mediaEvents';
import { Button } from './ui/button';

interface InstagramEmbedProps {
  reelUrl: string;
  videoId?: string | number;
  videoFileUrl?: string; // Direct video URL from Supabase storage
  className?: string;
}

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ 
  reelUrl,
  videoFileUrl,
  className = ''
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoFailed, setVideoFailed] = useState(false);

  // If we have a direct video URL, use native video player
  if (videoFileUrl) {
    const handlePlay = () => {
      if (videoRef.current) {
        stopAllMedia(); // Pause all other media
        videoRef.current.play();
        setIsPlaying(true);
      }
    };

    // ReelThumbnail-style fallback when video fails to load
    if (videoFailed) {
      return (
        <div className={`relative w-full ${className}`}>
          <div
            className="w-full rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-orange-500/10"
            style={{ maxHeight: '640px', maxWidth: '360px', margin: '0 auto', height: '480px' }}
          >
            <Play className="w-12 h-12 text-muted-foreground/40" />
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full ${className}`}>
        <video
          ref={videoRef}
          src={videoFileUrl}
          className="w-full h-full rounded-lg object-contain bg-black"
          style={{ 
            maxHeight: '640px',
            maxWidth: '360px',
            margin: '0 auto',
            display: 'block'
          }}
          controls
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
          onPlay={() => {
            stopAllMedia(); // In case played via native controls
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
        />
        {!isPlaying && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors rounded-lg"
            style={{ 
              maxHeight: '640px',
              maxWidth: '360px',
              margin: '0 auto',
              left: 0,
              right: 0
            }}
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
            </div>
          </button>
        )}
      </div>
    );
  }

  // Fallback to Instagram embed if no direct URL
  const extractPostId = (url: string): string | null => {
    const match = url.match(/\/(?:reel|p|tv)\/([^/?]+)/);
    return match ? match[1] : null;
  };

  const postId = extractPostId(reelUrl);

  const handleIframeError = () => {
    console.error('❌ Instagram iframe failed to load');
    setError('Failed to load reel');
  };

  if (error || !postId) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 ${className}`}>
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {error || 'Reel unavailable'}
          </p>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => window.open(reelUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on Instagram
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <iframe
        src={`https://www.instagram.com/p/${postId}/embed`}
        width="100%"
        height="600"
        frameBorder="0"
        scrolling="no"
        allowFullScreen
        onError={handleIframeError}
        className="rounded-lg"
        title="Instagram Reel"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-forms"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
};

export default InstagramEmbed;