import { Card } from '@/components/ui/card';
import { ExternalLink, GripVertical, MoreHorizontal, Trash2, Sparkles } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DraggableFavoriteCardProps {
  id: string;
  type: 'video' | 'photo' | 'reel';
  thumbnail?: string | null;
  gifUrl?: string | null;
  viralScore: number;
  title: string;
  views: number;
  followers: number;
  artist: string;
  isHovered: boolean;
  onHover: (hovering: boolean) => void;
  onClick: () => void;
  onRemove?: () => void;
  onFindSimilar?: () => void;
  formatNumber: (num: number) => string;
  category?: string;
  colorClass?: string;
  itemId?: number;
}

const DraggableFavoriteCard = ({
  id,
  type,
  thumbnail,
  gifUrl,
  viralScore,
  title,
  views,
  followers,
  artist,
  isHovered,
  onHover,
  onClick,
  onRemove,
  onFindSimilar,
  formatNumber,
  category,
  colorClass,
  itemId
}: DraggableFavoriteCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Native HTML5 drag handlers for dropping into contenteditable
  // Use inline styles instead of Tailwind classes so they persist after save/reload
  const handleNativeDragStart = (e: React.DragEvent) => {
    // Only handle native drag if not dragging from grip handle
    if ((e.target as HTMLElement).closest('[data-grip-handle]')) {
      e.preventDefault();
      return;
    }
    
    if (!category || itemId === undefined) return;
    
    // Define badge colors as inline styles based on type
    const getStyleForType = (type: string) => {
      if (type === 'video') return 'background: rgba(59, 130, 246, 0.2); color: rgb(147, 197, 253); border: 1px solid rgba(59, 130, 246, 0.3);';
      if (type === 'photo') return 'background: rgba(34, 197, 94, 0.2); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);';
      return 'background: linear-gradient(to right, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2)); color: rgb(216, 180, 254); border: 1px solid rgba(168, 85, 247, 0.3);';
    };
    
    const baseStyle = `display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin: 0 4px; white-space: nowrap; cursor: move; ${getStyleForType(type)}`;
    
    let badge = '';
    if (type === 'video') {
      badge = `<span draggable="true" style="${baseStyle}" contenteditable="false" data-video-id="${itemId}" data-type="video">🎬 ${category}</span>`;
    } else if (type === 'photo') {
      badge = `<span draggable="true" style="${baseStyle}" contenteditable="false" data-photo-id="${itemId}" data-type="photo">📷 ${category}</span>`;
    } else if (type === 'reel') {
      badge = `<span draggable="true" style="${baseStyle}" contenteditable="false" data-reel-id="${itemId}" data-type="reel">📹 ${category}</span>`;
    }
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/html', badge);
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        draggable
        onDragStart={handleNativeDragStart}
        className="p-4 bg-card border-border hover:border-primary/30 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
      <div className="flex items-start gap-3 relative">
        {/* Drag handle - visual indicator */}
        <div 
          data-grip-handle
          {...listeners}
          {...attributes}
          className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onDragStart={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Thumbnail */}
        <div 
          className="flex-shrink-0" 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <div className="w-16 h-20 bg-muted rounded overflow-hidden relative cursor-pointer">
            {thumbnail || gifUrl ? (
              <img
                src={isHovered && gifUrl ? gifUrl : thumbnail || gifUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const icon = document.createElement('div');
                    icon.className = 'w-full h-full flex items-center justify-center';
                    icon.innerHTML = '<svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>';
                    parent.appendChild(icon);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-1 min-w-0" 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-500">
              #{viralScore}
            </span>
            <span className="text-xs text-muted-foreground">
              {type === 'video' ? 'TikTok' : type === 'photo' ? 'Photo' : 'Reel'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1 truncate cursor-pointer">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
            <span>▶ {formatNumber(views)} views</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span>👥 {formatNumber(followers)} followers</span>
            <span>• @{artist}</span>
          </div>
        </div>

        {/* More options dropdown */}
        {(onRemove || onFindSimilar) && (
          <div 
            className="flex-shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-lg z-50">
                {onFindSimilar && (
                  <DropdownMenuItem 
                    onClick={() => onFindSimilar()}
                    className="cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find more like this
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <DropdownMenuItem 
                    onClick={() => onRemove()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete from favorites
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      </Card>
    </div>
  );
};

export default DraggableFavoriteCard;
