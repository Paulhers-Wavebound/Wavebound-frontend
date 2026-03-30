import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Play, 
  Heart, 
  Trash2,
  GripVertical,
  Check,
  Music,
  Sparkles,
  FolderInput,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FavoriteItem {
  id: number;
  type: 'tiktok' | 'photo_carousel' | 'instagram_reel';
  caption?: string;
  video_views?: number;
  video_likes?: number;
  thumbnail_url?: string;
  gif_url?: string;
  content_style?: string;
  genre?: string;
  sub_genre?: string;
  created_at?: string;
  folder_id?: string | null;
  video_url?: string;
  embedded_ulr?: string;
  // Extended fields for AI context
  hook?: string;
  outliar_score?: number;
  profile_followers?: number;
  Artist?: string;
}

interface FolderOption {
  id: string;
  name: string;
  color?: string | null;
}

interface DraggableFavoriteItemProps {
  item: FavoriteItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  isSelectionMode: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onAskAI?: (item: FavoriteItem) => void;
  onShowMoreLikeThis?: (item: FavoriteItem) => void;
  onClick?: (item: FavoriteItem) => void;
  onMoveToFolder?: (item: FavoriteItem, folderId: string | null) => void;
  folders?: FolderOption[];
  formatNumber: (num: number) => string;
}

export function DraggableFavoriteItem({
  item,
  viewMode,
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onRemove,
  onAskAI,
  onShowMoreLikeThis,
  onClick,
  onMoveToFolder,
  folders = [],
  formatNumber,
}: DraggableFavoriteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${item.type}-${item.id}`,
    data: { item },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  const handleAskAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAskAI?.(item);
  };

  const handleShowMoreLikeThis = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowMoreLikeThis?.(item);
  };

  const handleClick = () => {
    if (!isSelectionMode) {
      onClick?.(item);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-4 p-3 rounded-xl border transition-all",
          isDragging && "opacity-50 shadow-lg",
          isSelected && "ring-2 ring-primary bg-primary/5",
          !isDragging && "border-border hover:bg-muted/50",
          onClick && !isSelectionMode && "cursor-pointer"
        )}
      >
        {/* Drag Handle */}
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Selection checkbox */}
        {isSelectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
              isSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/50 hover:border-primary"
            )}
          >
            {isSelected && <Check className="w-3 h-3" />}
          </button>
        )}

        {/* Thumbnail */}
        <div className="w-16 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground line-clamp-2 mb-1">
            {item.caption || 'Untitled'}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatNumber(item.video_views || 0)} views</span>
            <span>{formatNumber(item.video_likes || 0)} likes</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onMoveToFolder && folders.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  onClick={(e) => e.stopPropagation()}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                >
                  <FolderInput className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Move</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onMoveToFolder(item, null)}>
                  Uncategorized
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map(folder => (
                  <DropdownMenuItem 
                    key={folder.id} 
                    onClick={() => onMoveToFolder(item, folder.id)}
                    className={cn(item.folder_id === folder.id && "bg-accent")}
                  >
                    <span 
                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                      style={{ backgroundColor: folder.color || 'hsl(var(--muted-foreground))' }} 
                    />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onAskAI && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleAskAI}
                    size="sm"
                    className="h-8 px-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Ask AI</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get AI insights about this video</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        "group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted transition-all",
        isDragging && "opacity-50 shadow-2xl scale-105",
        isSelected && "ring-2 ring-primary ring-offset-2",
        onClick && !isSelectionMode && "cursor-pointer"
      )}
    >
      {/* Drag zone - only the top part */}
      <div
        {...listeners}
        {...attributes}
        className="absolute inset-x-0 top-0 h-12 z-20 cursor-grab active:cursor-grabbing"
      />

      {item.thumbnail_url || item.gif_url ? (
        <img
          src={item.thumbnail_url || item.gif_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <Play className="w-8 h-8 text-primary/50" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

      {/* Selection checkbox */}
      {isSelectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className={cn(
            "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-30",
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-white/70 bg-black/30 hover:border-primary"
          )}
        >
          {isSelected && <Check className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Top right actions - show on hover */}
      {!isSelectionMode && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          {onMoveToFolder && folders.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-primary transition-colors"
                  title="Move to folder"
                >
                  <FolderInput className="w-3.5 h-3.5 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onMoveToFolder(item, null)}>
                  Uncategorized
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map(folder => (
                  <DropdownMenuItem 
                    key={folder.id} 
                    onClick={() => onMoveToFolder(item, folder.id)}
                    className={cn(item.folder_id === folder.id && "bg-accent")}
                  >
                    <span 
                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                      style={{ backgroundColor: folder.color || 'hsl(var(--muted-foreground))' }} 
                    />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* Type indicator */}
      <div className="absolute top-2 left-2 z-20">
        {!isSelectionMode && (
          <Badge variant="secondary" className="text-[10px] h-5 bg-white/20 backdrop-blur-sm text-white border-0">
            {item.type === 'instagram_reel' ? 'Reel' : item.type === 'photo_carousel' ? 'Carousel' : 'TikTok'}
          </Badge>
        )}
      </div>

      {/* Bottom area with stats and actions */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 z-20">
        {/* Stats row */}
        <div className="flex items-center gap-2 text-white text-xs mb-2">
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {formatNumber(item.video_views || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {formatNumber(item.video_likes || 0)}
          </span>
        </div>

        {/* Action buttons - show on hover */}
        {onAskAI && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleAskAI}
              size="sm"
              className="flex-1 h-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Ask AI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}