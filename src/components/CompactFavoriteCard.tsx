import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ExternalLink, GripVertical, FolderInput } from 'lucide-react';
import TikTokThumbnail from './TikTokThumbnail';
import { useDraggable } from '@dnd-kit/core';
import { parseGenreJson } from '@/utils/genreParser';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface CompactFavoriteCardProps {
  id: string;
  content: any;
  onOpen: () => void;
  formatNumber: (num: number) => string;
  folders: Array<{ id: string; name: string; color: string | null }>;
  currentFolderId: string | null;
  onMoveToFolder: (videoId: number, videoType: string, folderId: string | null) => void;
}

const CompactFavoriteCard = ({ id, content, onOpen, formatNumber, folders, currentFolderId, onMoveToFolder }: CompactFavoriteCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

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
      return <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-muted-foreground text-xs">Reel</div>;
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="glass-card p-3 hover:border-primary/50 transition-all cursor-pointer"
    >
      <div className="flex gap-3">
        {/* Left side controls */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Drag Handle */}
          <div {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* Folder button - prominent placement */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-2 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors border border-primary/20"
                title="Add to folder"
              >
                <FolderInput className="w-5 h-5 text-primary" />
              </button>
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

        {/* Thumbnail */}
        <div 
          className="w-20 h-24 bg-muted rounded overflow-hidden flex-shrink-0 relative"
          onClick={onOpen}
        >
          {getThumbnail()}
          
          {/* Type badge */}
          <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0.5 bg-black/70 text-white border-0">
            {getType()}
          </Badge>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0" onClick={onOpen}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">
              {content.hook || content.Hook || content.caption?.substring(0, 50) || 'No title'}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {content.outliar_score && (
                <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30">
                  {Math.floor(content.outliar_score * 100)}
                </Badge>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const url = getUrl();
                  if (url) window.open(url, '_blank');
                }}
                className="p-1 hover:bg-accent rounded transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>👁️ {formatNumber(content.video_views || content.photo_views || 0)}</span>
              <span>•</span>
              <span>❤️ {formatNumber(content.video_likes || content.photo_likes || 0)}</span>
            </div>

            {content.genre && (
              <div className="flex flex-wrap items-center gap-1">
                {parseGenreJson(content.genre).map((genre, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0.5">
                    {genre}
                  </Badge>
                ))}
                {content.sub_genre && parseGenreJson(content.sub_genre).map((subgenre, idx) => (
                  <Badge key={`sub-${idx}`} variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10">
                    {subgenre}
                  </Badge>
                ))}
                {content.content_style && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-accent/10">
                    {content.content_style}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CompactFavoriteCard;