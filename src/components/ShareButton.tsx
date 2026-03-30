import { useState } from 'react';
import { Share2, Twitter, Link2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface ShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  attribution?: string; // e.g. "Found on Wavebound" or "Powered by Wavebound"
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function ShareButton({
  url,
  title = '',
  description = '',
  attribution = 'via @WaveboundHQ',
  variant = 'ghost',
  size = 'sm',
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;

  const handleCopyLink = async () => {
    const textToCopy = attribution 
      ? `${title ? title + ' - ' : ''}${shareUrl} ${attribution}`
      : shareUrl;
    
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({ title: 'Link copied!', description: 'Ready to share' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = title 
      ? `${title} ${attribution}`
      : `Check this out ${attribution}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Wavebound',
          text: description || attribution,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4" />
          {size !== 'icon' && <span className="ml-1.5">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShareTwitter} className="gap-2 cursor-pointer">
          <Twitter className="w-4 h-4" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          Copy link
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="gap-2 cursor-pointer">
            <Link2 className="w-4 h-4" />
            More options...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ShareButton;
