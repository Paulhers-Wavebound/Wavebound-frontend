import { useRef, useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Video } from '@/types/content';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Play, Sparkles, Filter } from 'lucide-react';
import TikTokThumbnail from './TikTokThumbnail';
import ReelThumbnail from './ReelThumbnail';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';

// Helper to parse content_style which may be JSON array or plain string
const parseContentStyles = (contentStyle: string | null | undefined): string[] => {
  if (!contentStyle) return [];
  
  try {
    const parsed = JSON.parse(contentStyle);
    if (Array.isArray(parsed)) {
      return parsed.map(s => String(s).trim()).filter(Boolean);
    }
    return [String(parsed).trim()];
  } catch {
    const cleaned = contentStyle.replace(/^\[|\]$/g, '').replace(/^["']|["']$/g, '').trim();
    return cleaned.split(',').map(s => s.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
  }
};

// Helper to parse effort which may be JSON object like {"string":"Low"} or plain string
const parseEffort = (effort: string | null | undefined): string | null => {
  if (!effort) return null;
  
  try {
    const parsed = JSON.parse(effort);
    if (parsed && typeof parsed === 'object' && parsed.string) {
      return String(parsed.string).trim();
    }
    return String(parsed).trim();
  } catch {
    return effort.replace(/[{}"]/g, '').replace(/string:/gi, '').trim();
  }
};

interface ContentPlanWorkspaceViewProps {
  planVideos: Video[];
  onReorder: (videos: Video[]) => void;
  onVideoClick: (video: Video) => void;
  onPhotoCarouselClick?: (carousel: any) => void;
  notes: Record<string, string>;
  onNotesChange: (videoId: number, notes: string) => void;
  onAskAI?: (video: Video) => void;
  onShowMoreLikeThis?: (video: Video) => void;
}

interface DayItemProps {
  video: Video;
  dayIndex: number;
  onVideoClick: (video: Video) => void;
  onPhotoCarouselClick?: (carousel: any) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onAskAI?: (video: Video) => void;
  onShowMoreLikeThis?: (video: Video) => void;
}

const DayItem = ({ video, dayIndex, onVideoClick, onPhotoCarouselClick, notes, onNotesChange, onAskAI, onShowMoreLikeThis }: DayItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };


  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 bg-card/60 border-border/40 hover:bg-card/80 transition-all">
        <div className="flex gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Day Label */}
          <div className="flex-shrink-0 w-16">
            <div className="text-center">
              <div className="text-xs font-medium text-muted-foreground mb-1">Day</div>
              <div className="text-2xl font-bold">{dayIndex + 1}</div>
            </div>
          </div>

          {/* Video/Photo Carousel Thumbnail */}
          <div 
            className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden bg-muted/20 cursor-pointer group relative"
            onClick={() => {
              const isPhotoCarousel = (video as any).is_photo_carousel;
              if (isPhotoCarousel && onPhotoCarouselClick) {
                onPhotoCarouselClick(video);
              } else {
                onVideoClick(video);
              }
            }}
          >
            {(video as any).is_photo_carousel && fixSupabaseStorageUrl((video as any).photo_url_1) ? (
              <img
                src={fixSupabaseStorageUrl((video as any).photo_url_1) || ''}
                alt={video.caption || 'Photo carousel preview'}
                className="w-full h-full object-cover"
              />
            ) : (video as any).is_photo_carousel && ((video as any).embedded_url || video.embedded_ulr) ? (
              // Photo carousel without photo_url_1 - use oEmbed fallback
              <TikTokThumbnail
                videoId={video.id}
                tiktokUrl={(video as any).embedded_url || video.embedded_ulr}
                className="w-full h-full"
              />
            ) : video.is_reel && (video as any).thumbnail_url ? (
              // Instagram Reels — use cached thumbnail (direct video URLs are unreliable)
              <img src={(video as any).thumbnail_url} alt={video.caption || ''} className="w-full h-full object-cover" />
            ) : (video as any).thumbnail_url ? (
              // Cached thumbnail (Reels or other)
              <img
                src={(video as any).thumbnail_url}
                alt={video.caption || 'Video preview'}
                className="w-full h-full object-cover"
              />
            ) : video.embedded_ulr ? (
              <TikTokThumbnail
                videoId={video.id}
                tiktokUrl={video.embedded_ulr}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Content Details */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {/* Video Table ID */}
              <Badge variant="outline" className="text-xs border-muted-foreground/50 text-muted-foreground">
                ID: {video.plan_video_id || video.id}
              </Badge>
              {/* Viral Score Badge */}
              {video.viral_score != null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs border-purple-500 text-purple-500 cursor-help">
                      🔥 {video.viral_score}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px]">Viral Score: How likely this content style is to go viral (higher = better)</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Performance Multiplier Badge */}
              {video.performance_multiplier && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs border-orange-500 text-orange-500 cursor-help">
                      {video.performance_multiplier}x
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px]">Performance Multiplier: Views relative to creator's average (e.g., 2x = double their usual views)</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Effort Badge */}
              {video.ai_effort && (() => {
                const effort = parseEffort(video.ai_effort);
                if (!effort) return null;
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={`text-xs cursor-help ${
                          effort.toLowerCase() === 'low' ? 'border-green-500 text-green-500' :
                          effort.toLowerCase() === 'medium' ? 'border-yellow-500 text-yellow-500' :
                          'border-red-500 text-red-500'
                        }`}
                      >
                        {effort} Effort
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px]">Effort Level: Estimated production effort needed to recreate this content style</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })()}
              {/* Content Type & Platform Badge */}
              {video.ai_content_type_platform && (
                <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">
                  {video.ai_content_type_platform}
                </Badge>
              )}
              {(video as any).is_photo_carousel && (
                <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">
                  📸 Picture Carousel
                </Badge>
              )}
              {video.is_reel && (
                <Badge variant="default" className="text-xs bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600">
                  📷 Instagram Reel
                </Badge>
              )}
              {parseContentStyles(video.content_style).map((style, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {style}
                </Badge>
              ))}
              {/* Ask AI Actions */}
              {(onAskAI || onShowMoreLikeThis) && (
                <div className="flex items-center gap-1 ml-auto">
                  <TooltipProvider>
                    {onShowMoreLikeThis && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShowMoreLikeThis(video);
                            }}
                            className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-500 transition-all duration-200"
                          >
                            <Filter className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Show more like this</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onAskAI && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAskAI(video);
                            }}
                            className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ask AI about this video</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {((video as any).is_photo_carousel 
                ? (video as any).photo_views 
                : video.video_views)?.toLocaleString() || '0'} views
            </div>

            {/* Hook */}
            {(video.hook || video.ai_hook) && (
              <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
                <div className="text-sm text-foreground/90"><span className="font-semibold text-primary/80">Hook Example:</span> <span className="italic">"{(() => { const raw = video.hook || video.ai_hook || ''; try { const parsed = typeof raw === 'string' && raw.trim().startsWith('{') ? JSON.parse(raw) : null; return parsed?.string || raw; } catch { return raw; } })()}"</span></div>
              </div>
            )}

            {/* Content Idea */}
            {video.ai_description && (
              <div className="p-2 bg-accent/10 border border-accent/20 rounded-md">
                <div className="text-xs font-semibold text-accent mb-1">Content Idea:</div>
                <div className="text-sm text-foreground/90">{video.ai_description}</div>
              </div>
            )}

            <Textarea
              placeholder="Type your ideas here"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="min-h-[100px] resize-none bg-background/50 border-border/40 focus:bg-background/80 transition-colors"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export const ContentPlanWorkspaceView = ({ planVideos, onReorder, onVideoClick, onPhotoCarouselClick, notes, onNotesChange, onAskAI, onShowMoreLikeThis }: ContentPlanWorkspaceViewProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = planVideos.findIndex((v) => v.id.toString() === active.id);
      const newIndex = planVideos.findIndex((v) => v.id.toString() === over.id);

      const newVideos = [...planVideos];
      const [removed] = newVideos.splice(oldIndex, 1);
      newVideos.splice(newIndex, 0, removed);

      onReorder(newVideos);
    }
  };

  if (planVideos.length === 0) return null;

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={planVideos.map((v) => v.id.toString())} strategy={verticalListSortingStrategy}>
          {planVideos.map((video, index) => (
            <div key={video.id}>
              <DayItem 
                video={video} 
                dayIndex={index} 
                onVideoClick={onVideoClick}
                onPhotoCarouselClick={onPhotoCarouselClick}
                notes={notes[video.id] || ''}
                onNotesChange={(newNotes) => onNotesChange(video.id, newNotes)}
                onAskAI={onAskAI}
                onShowMoreLikeThis={onShowMoreLikeThis}
              />
              {index < planVideos.length - 1 && (
                <Separator className="my-3 bg-border/30" />
              )}
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
