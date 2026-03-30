import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Eye, Heart, User } from 'lucide-react';
import TikTokEmbed from '@/components/TikTokEmbed';

interface BlogTikTokEmbedProps {
  tiktokUrl: string;
  handle: string;
  hook?: string;
  views?: number;
  likes?: number;
  multiplier?: string;
  followers?: number;
  caption?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const BlogTikTokEmbed: React.FC<BlogTikTokEmbedProps> = ({
  tiktokUrl,
  handle,
  hook,
  views,
  likes,
  multiplier,
  followers,
  caption,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-8 rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 border border-border"
    >
      {/* Header with stats */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">@{handle}</span>
            {followers && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {formatNumber(followers)} followers
              </span>
            )}
          </div>
          {multiplier && (
            <span className="px-2 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              {multiplier} above average
            </span>
          )}
        </div>
        
        {hook && hook !== 'No' && !hook.includes('None') && (
          <p className="text-sm text-foreground/80 italic mb-3">
            "{hook}"
          </p>
        )}

        <div className="flex items-center gap-4 text-sm">
          {views && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="font-medium text-foreground">{formatNumber(views)}</span> views
            </span>
          )}
          {likes && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="w-4 h-4" />
              <span className="font-medium text-foreground">{formatNumber(likes)}</span> likes
            </span>
          )}
        </div>
      </div>

      {/* TikTok Embed */}
      <div className="aspect-[9/16] max-h-[500px] w-full flex items-center justify-center bg-black/5 dark:bg-white/5 overflow-hidden">
        <TikTokEmbed tiktokUrl={tiktokUrl} />
      </div>

      {/* Caption excerpt */}
      {caption && (
        <div className="p-4 border-t border-border">
          <p className="text-sm text-muted-foreground line-clamp-2">{caption}</p>
        </div>
      )}

      {/* Open in TikTok link */}
      <a
        href={tiktokUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 p-3 border-t border-border text-sm font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
      >
        Open in TikTok
        <ExternalLink className="w-4 h-4" />
      </a>
    </motion.div>
  );
};

export default BlogTikTokEmbed;
