import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, FolderInput, Eye, Heart, Users, Clock } from 'lucide-react';
import TikTokThumbnail from './TikTokThumbnail';
import { parseGenreJson } from '@/utils/genreParser';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface GridFavoriteCardProps {
  content: any;
  onOpen: () => void;
  formatNumber: (num: number) => string;
  folders: Array<{ id: string; name: string; color: string | null }>;
  currentFolderId: string | null;
  onMoveToFolder: (videoId: number, videoType: string, folderId: string | null) => void;
}

const GridFavoriteCard = ({ content, onOpen, formatNumber, folders, currentFolderId, onMoveToFolder }: GridFavoriteCardProps) => {
  const getThumbnail = () => {
    // Instagram Reels - use thumbnail_url or video_file_url as poster
    if (content.is_reel) {
      if (content.thumbnail_url) {
        return <img src={content.thumbnail_url} alt="" className="w-full h-full object-cover" />;
      }
      // Fallback: use video element with poster from video itself
      if (content.video_file_url) {
        return (
          <video 
            src={content.video_file_url} 
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        );
      }
      // Final fallback: placeholder gradient
      return <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-muted-foreground text-sm">Reel</div>;
    }
    // Photo Carousel
    if (content.photo_url_1) {
      return <img src={fixSupabaseStorageUrl(content.photo_url_1) || ''} alt="" className="w-full h-full object-cover" />;
    }
    // TikTok Video - use direct thumbnail if available, otherwise TikTokThumbnail component
    if (content.thumbnail_url || content.gif_url) {
      return <img src={content.gif_url || content.thumbnail_url} alt="" className="w-full h-full object-cover" />;
    }
    return <TikTokThumbnail videoId={content.id} tiktokUrl={content.embedded_ulr || content.video_url} />;
  };

  const getType = () => {
    if (content.is_reel) return 'Reel';
    if (content.photo_url_1) return 'Photos';
    return 'Video';
  };

  const getUrl = () => {
    return content.embedded_ulr || content.embedded_url || content.video_url || content.profile_url;
  };

  const getViralBadge = () => {
    const score = content.outliar_score || 0;
    const formattedScore = Math.floor(score * 100);
    if (score >= 0.8) return { label: `🔥 ${formattedScore}x`, color: "bg-red-500/90 text-white" };
    if (score >= 0.6) return { label: `⚡ ${formattedScore}x`, color: "bg-orange-500/90 text-white" };
    if (score >= 0.4) return { label: `📈 ${formattedScore}x`, color: "bg-yellow-500/90 text-white" };
    if (score > 0) return { label: `✨ ${formattedScore}x`, color: "bg-emerald-500/90 text-white" };
    return null;
  };

  const viralBadge = getViralBadge();

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const formattedDate = formatDate(content.date_posted || content.favorited_at);

  return (
    <motion.div
      layout
      whileHover={{ y: -8, scale: 1.02, rotateX: 2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className="bg-gradient-to-b from-card via-card to-card/95 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_8px_24px_-4px_rgba(0,0,0,0.12),0_16px_48px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_8px_24px_-4px_rgba(0,0,0,0.4),0_16px_48px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1),0_16px_40px_-8px_rgba(0,0,0,0.18),0_32px_64px_-16px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.5),0_32px_64px_-16px_rgba(0,0,0,0.4)] transition-all duration-300 relative group w-full overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none before:-z-10 cursor-pointer"
      onClick={onOpen}
    >
      {/* Thumbnail - 9:16 aspect ratio */}
      <div className="aspect-[9/16] bg-muted overflow-hidden relative group/video">
        {/* Gradient overlay for better badge visibility */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />
        
        {/* Type badge */}
        <Badge className="absolute top-2 left-2 z-20 text-[10px] px-2 py-0.5 bg-black/70 text-white border-0 rounded-md font-medium">
          {getType()}
        </Badge>

        {/* Viral score badge */}
        {viralBadge && (
          <Badge className={`absolute top-2 right-2 z-20 ${viralBadge.color} border-0 text-[10px] px-2 py-0.5 rounded-md font-medium shadow-sm`}>
            {viralBadge.label}
          </Badge>
        )}

        {getThumbnail()}

        {/* Action buttons - appear on hover */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              const url = getUrl();
              if (url) window.open(url, '_blank');
            }}
            className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md transition-colors"
              >
                <FolderInput className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {currentFolderId && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToFolder(content.id, content.content_type, null);
                  }}
                >
                  Remove from folder
                </DropdownMenuItem>
              )}
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToFolder(content.id, content.content_type, folder.id);
                  }}
                  disabled={currentFolderId === folder.id}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color || '#8b5cf6' }} />
                    {folder.name}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3 space-y-3">
        {/* Date posted */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        )}

        {/* Stats with icons */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-medium">{formatNumber(content.video_views || content.photo_views || 0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span className="font-medium">{formatNumber(content.video_likes || content.photo_likes || 0)}</span>
          </div>
          {(content.profile_followers || 0) > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{formatNumber(content.profile_followers)}</span>
            </div>
          )}
        </div>

        {/* Genre/Style tags */}
        {(content.genre || content.content_style) && (
          <div className="flex flex-wrap gap-1">
            {content.genre && parseGenreJson(content.genre).slice(0, 1).map((genre, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0.5 bg-muted/50 border-border/50">
                {genre}
              </Badge>
            ))}
            {content.content_style && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 border-primary/20 text-primary">
                {content.content_style}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GridFavoriteCard;
