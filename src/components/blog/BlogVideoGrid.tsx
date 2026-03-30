import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Eye, TrendingUp } from 'lucide-react';

interface VideoExample {
  url: string;
  handle: string;
  hook?: string;
  views: number;
  multiplier: string;
  contentStyle?: string;
}

interface BlogVideoGridProps {
  title: string;
  description?: string;
  videos: VideoExample[];
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

const BlogVideoGrid: React.FC<BlogVideoGridProps> = ({ title, description, videos }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-10"
    >
      <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <a
            key={index}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 border border-border hover:border-primary/50 transition-all hover:shadow-lg"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">@{video.handle}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              
              {video.hook && video.hook.length > 10 && !video.hook.includes('No') && (
                <p className="text-sm text-foreground/70 italic mb-3 line-clamp-2">
                  "{video.hook}"
                </p>
              )}

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  {formatNumber(video.views)}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {video.multiplier}
                </span>
              </div>

              {video.contentStyle && (
                <span className="inline-block mt-3 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                  {video.contentStyle}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  );
};

export default BlogVideoGrid;
