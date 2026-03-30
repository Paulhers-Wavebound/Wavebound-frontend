import React, { useState, useEffect, useRef } from 'react';
import { getTikTokEmbedProps } from '@/utils/tiktokEmbed';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { stopAllMedia } from '@/utils/mediaEvents';

interface TikTokEmbedProps {
  tiktokUrl: string;
  videoId?: string | number;
  className?: string;
  caption?: string;
  username?: string;
  thumbnailUrl?: string;
  showShareOverlay?: boolean;
  videoDbId?: number; // Database ID for generating share link
}

const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ 
  tiktokUrl,
  className = '',
  showShareOverlay = true,
  videoDbId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showTimeoutError, setShowTimeoutError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const props = getTikTokEmbedProps(tiktokUrl);
  
  // Set a timeout to detect if iframe fails to load initially
  useEffect(() => {
    // Only start timeout if iframe hasn't loaded yet
    if (!iframeLoaded) {
      timeoutRef.current = setTimeout(() => {
        if (!iframeLoaded) {
          setShowTimeoutError(true);
        }
      }, 15000); // 15 second timeout for initial load only
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tiktokUrl]);

  // Clear timeout when iframe loads — also stop other media since TikTok will start playing
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setShowTimeoutError(false);
    stopAllMedia(); // Pause all other media when TikTok embed loads
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Handle Wavebound share overlay click
  const handleWaveboundShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Generate share URL - if we have a database ID, use the deep link
    const baseUrl = window.location.origin;
    const shareUrl = videoDbId 
      ? `${baseUrl}/explore?video=${videoDbId}`
      : tiktokUrl;
    
    const shareText = `found this on Wavebound 🔥 ${shareUrl}`;
    
    try {
      // Try native share first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this video!',
          text: 'found this on Wavebound 🔥',
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Link copied! 🔥', {
          description: 'Share it with your friends',
          duration: 2000,
        });
      }
    } catch (err) {
      // If share was cancelled or failed, try clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Link copied! 🔥', {
          description: 'Share it with your friends',
          duration: 2000,
        });
      } catch {
        console.error('Failed to share or copy', err);
      }
    }
  };
  
  if (!props) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 ${className}`}>
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid TikTok URL</p>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => window.open(tiktokUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on TikTok
          </Button>
        </div>
      </div>
    );
  }

  const { videoId } = props;
  // Use /player/v1/ endpoint - more reliable for play button interaction than /embed/v2/
  const embedUrl = `https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1&controls=1&volume_control=1`;

  const handleIframeError = () => {
    setError('Video may be unavailable or deleted');
  };

  // Only show error if there's an actual error OR timeout occurred without load
  if (error || (showTimeoutError && !iframeLoaded)) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 ${className}`}>
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Video unavailable</p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            {error || 'This video may have been deleted or is not accessible'}
          </p>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => window.open(tiktokUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Try on TikTok
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`} style={{ minWidth: '320px' }}>
      {/* Wrapper to keep overlay aligned with the centered iframe */}
      <div className="relative" style={{ width: '100%', maxWidth: '360px' }}>
        <iframe
          src={embedUrl}
          className="w-full rounded-lg"
          style={{ 
            height: '640px',
            width: '100%',
            border: 'none'
          }}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share; clipboard-write"
          allowFullScreen
          title="TikTok Video"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-forms allow-presentation"
        />
        
        {/* Invisible share button overlay - positioned over TikTok's share button */}
        {showShareOverlay && iframeLoaded && (
          <button
            onClick={handleWaveboundShare}
            className="absolute cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors rounded-full"
            style={{
              // Position over TikTok's share button (right side action bar)
              right: '12px',
              bottom: '145px',
              width: '44px',
              height: '52px',
              zIndex: 10,
            }}
            title="Share via Wavebound"
            aria-label="Share this video"
          />
        )}
      </div>
    </div>
  );
};

export default TikTokEmbed;