import React from 'react';
import { Sparkles, Filter, MoreVertical, ExternalLink, Star, Share2, CalendarPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Video } from '@/types/content';
import { cn } from '@/lib/utils';

interface VideoActionMenuProps {
  video: Video;
  onAskAI: () => void;
  onShowMoreLikeThis: () => void;
  onAddToPlan?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onOpenExternal?: () => void;
  onCreatePlan?: () => void;
  isFavorited?: boolean;
  hasPlan?: boolean;
  className?: string;
  variant?: 'icon' | 'button';
}

export function VideoActionMenu({
  video,
  onAskAI,
  onShowMoreLikeThis,
  onAddToPlan,
  onFavorite,
  onShare,
  onOpenExternal,
  onCreatePlan,
  isFavorited,
  hasPlan,
  className,
  variant = 'icon',
}: VideoActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'button' ? (
          <Button
            size="sm"
            className={cn(
              "h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 flex items-center justify-center gap-1.5",
              className
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Actions</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200",
              className
            )}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg">
        {/* Primary actions */}
        <DropdownMenuItem
          onClick={onAskAI}
          className="gap-3 cursor-pointer py-2.5 focus:bg-primary/10"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Ask AI About This</span>
            <span className="text-xs text-muted-foreground">Get insights, hooks, or ideas</span>
          </div>
        </DropdownMenuItem>
        
        {/* Add to Plan - only show when a plan is active */}
        {hasPlan && onAddToPlan && (
          <DropdownMenuItem
            onClick={onAddToPlan}
            className="gap-3 cursor-pointer py-2.5 focus:bg-primary/10"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">Replace in Plan</span>
              <span className="text-xs text-muted-foreground">Add to your 7-day content plan</span>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          onClick={onShowMoreLikeThis}
          className="gap-3 cursor-pointer py-2.5 focus:bg-primary/10"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <Filter className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Show More Like This</span>
            <span className="text-xs text-muted-foreground">
              Filter by {video.genre || video.content_style || 'similar content'}
            </span>
          </div>
        </DropdownMenuItem>
        
        {/* Create Content Plan from favorite */}
        {isFavorited && onCreatePlan && (
          <DropdownMenuItem
            onClick={onCreatePlan}
            className="gap-3 cursor-pointer py-2.5 focus:bg-primary/10"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">Create Content Plan</span>
              <span className="text-xs text-muted-foreground">Generate a 7-day plan from this video</span>
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Secondary actions */}
        {onFavorite && (
          <DropdownMenuItem
            onClick={onFavorite}
            className="gap-3 cursor-pointer"
          >
            <Star className={cn("w-4 h-4", isFavorited && "fill-yellow-500 text-yellow-500")} />
            <span>{isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}</span>
          </DropdownMenuItem>
        )}
        
        {onShare && (
          <DropdownMenuItem
            onClick={onShare}
            className="gap-3 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </DropdownMenuItem>
        )}
        
        {onOpenExternal && (
          <DropdownMenuItem
            onClick={onOpenExternal}
            className="gap-3 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Original</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact version for quick access - just the two primary actions as buttons
 */
export function VideoQuickActions({
  onAskAI,
  onShowMoreLikeThis,
  onAddToPlan,
  hasPlan,
  className,
}: {
  onAskAI: () => void;
  onShowMoreLikeThis: () => void;
  onAddToPlan?: () => void;
  hasPlan?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowMoreLikeThis}
              className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-500 transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Show more like this</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {hasPlan && onAddToPlan && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddToPlan}
                className="w-8 h-8 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Replace in content plan</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAskAI}
              className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ask AI about this video</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
