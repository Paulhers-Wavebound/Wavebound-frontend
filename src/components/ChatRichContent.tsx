import { Eye, TrendingUp, Camera, Music, Video, Calendar, Lightbulb, Zap, User, Clock, CheckCircle2 } from 'lucide-react';
import { EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

// Format large numbers nicely
const formatViews = (views: number | undefined): string => {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
  return views.toString();
};

interface RichVideoCardProps {
  idea: EnrichedIdea;
  compact?: boolean;
  onClick?: () => void;
}

// Compact video card for horizontal scroll
export function RichVideoCard({ idea, compact = false, onClick }: RichVideoCardProps) {
  const thumbnail = idea.videoData?.thumbnail_url;
  const title = idea.title || 'Video Idea';
  const views = idea.videoData?.video_views || idea.videoData?.photo_views || 0;
  const isSlides = idea.contentType === 'photo_carousel';
  
  return (
    <div 
      className={cn(
        "group flex-shrink-0 rounded-xl overflow-hidden bg-muted/50 border border-border hover:border-primary/30 transition-all cursor-pointer",
        compact ? "w-[140px]" : "w-[180px]"
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className={cn("relative", compact ? "h-[100px]" : "h-[120px]")}>
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Video className="w-8 h-8 text-primary/50" />
          </div>
        )}
        
        {/* Overlay with title */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Slides badge */}
        {isSlides && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/90 px-2 py-0.5 rounded-full text-[10px] font-medium">
            <Camera className="w-3 h-3" />
            Slides
          </div>
        )}
        
        {/* Title overlay */}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-xs font-medium leading-tight line-clamp-2">{title}</p>
          <div className="flex items-center gap-1 text-white/80 text-[10px] mt-1">
            <Eye className="w-3 h-3" />
            <span>{formatViews(views)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Video list item (vertical layout with thumbnail + description)
interface VideoListItemProps {
  idea: EnrichedIdea;
  description?: string;
  avgViews?: number;
  onClick?: () => void;
}

export function VideoListItem({ idea, description, avgViews, onClick }: VideoListItemProps) {
  const thumbnail = idea.videoData?.thumbnail_url;
  const title = idea.title || idea.why_it_works || 'Video Idea';
  
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Video className="w-6 h-6 text-primary/50" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground line-clamp-1">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{description}</p>
        )}
        {avgViews && (
          <div className="flex items-center gap-1 text-xs text-success mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{formatViews(avgViews)} avg</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook suggestion item
interface HookSuggestionProps {
  hookText: string;
  thumbnail?: string;
  avgViews?: number;
  onClick?: () => void;
}

export function HookSuggestion({ hookText, thumbnail, avgViews, onClick }: HookSuggestionProps) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-500/50" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">"{hookText}"</p>
        {avgViews && (
          <div className="flex items-center gap-1 text-xs text-success mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>{formatViews(avgViews)} avg</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Timeline item
interface TimelineItemProps {
  time: string;
  action: string;
  isLast?: boolean;
}

export function TimelineItem({ time, action, isLast }: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20" />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>
      
      {/* Content */}
      <div className={cn("pb-4", isLast && "pb-0")}>
        <p className="text-sm font-medium text-primary">{time}</p>
        <p className="text-sm text-foreground">{action}</p>
      </div>
    </div>
  );
}

// Timeline container
interface TimelineProps {
  items: { time: string; action: string }[];
  title?: string;
}

export function Timeline({ items, title }: TimelineProps) {
  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
      )}
      <div className="ml-2">
        {items.map((item, i) => (
          <TimelineItem key={i} time={item.time} action={item.action} isLast={i === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

// Analytics stat card
interface StatCardProps {
  label: string;
  value: string;
  variant?: 'default' | 'warning' | 'success';
}

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const bgColor = variant === 'warning' 
    ? 'bg-warning-muted border-warning/30' 
    : variant === 'success' 
    ? 'bg-success-muted border-success/30'
    : 'bg-muted/50 border-border';
    
  return (
    <div className={cn("rounded-lg p-3 border", bgColor)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

// Trend bar
interface TrendBarProps {
  label: string;
  percentage: number;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

export function TrendBar({ label, percentage, color = 'blue' }: TrendBarProps) {
  const gradients = {
    blue: 'from-blue-400 to-cyan-400',
    green: 'from-emerald-400 to-teal-400',
    orange: 'from-orange-400 to-red-400',
    purple: 'from-purple-400 to-pink-400',
  };
  
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-foreground w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
        <div 
          className={cn("h-full rounded-full bg-gradient-to-r", gradients[color])}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground">
          +{percentage}%
        </span>
      </div>
    </div>
  );
}

// Pro tip callout
interface ProTipProps {
  tip: string;
}

export function ProTip({ tip }: ProTipProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-info-muted border border-info/20">
      <Lightbulb className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
      <p className="text-sm text-foreground">
        <span className="font-semibold text-warning">Pro tip:</span> {tip}
      </p>
    </div>
  );
}

// Quick prep checklist
interface QuickPrepProps {
  items: string[];
}

export function QuickPrep({ items }: QuickPrepProps) {
  return (
    <div className="p-4 rounded-xl bg-warning-muted border border-warning/20">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-warning" />
        <span className="font-semibold text-warning text-sm">Quick Prep</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-warning" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Video feedback card (for video analysis)
interface FeedbackItemProps {
  label: string;
  feedback: string;
  status: 'good' | 'warning' | 'info';
}

export function FeedbackItem({ label, feedback, status }: FeedbackItemProps) {
  const colors = {
    good: 'bg-success-muted border-success/30',
    warning: 'bg-warning-muted border-warning/30',
    info: 'bg-info-muted border-info/30',
  };
  
  const dotColors = {
    good: 'bg-success',
    warning: 'bg-warning',
    info: 'bg-info',
  };
  
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl border", colors[status])}>
      <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", dotColors[status])} />
      <span className="font-medium text-sm text-foreground w-20 flex-shrink-0">{label}</span>
      <span className="text-sm text-muted-foreground">{feedback}</span>
    </div>
  );
}

// Rollout strategy card
interface RolloutDayProps {
  day: number;
  title: string;
  platform: string;
  thumbnail?: string;
}

export function RolloutDay({ day, title, platform, thumbnail }: RolloutDayProps) {
  return (
    <div className="flex-shrink-0 w-[160px] rounded-xl overflow-hidden bg-muted/50 border border-border">
      {/* Thumbnail */}
      <div className="relative h-[100px]">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 bg-background/90 px-2 py-0.5 rounded text-xs font-semibold">
          Day {day}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-2">
        <p className="font-medium text-sm text-foreground line-clamp-1">{title}</p>
        <p className="text-xs text-muted-foreground">{platform}</p>
      </div>
    </div>
  );
}

// Horizontal scrolling video row
interface VideoRowProps {
  ideas: EnrichedIdea[];
  title?: string;
}

export function VideoRow({ ideas, title }: VideoRowProps) {
  if (ideas.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {title && <p className="text-sm text-muted-foreground">{title}</p>}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {ideas.map((idea, i) => (
          <RichVideoCard key={idea.id || i} idea={idea} />
        ))}
      </div>
    </div>
  );
}

// Main CTA button
interface ActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function ActionButton({ label, icon, onClick }: ActionButtonProps) {
  return (
    <Button 
      className="w-full gap-2 h-12 text-base font-semibold bg-primary hover:bg-primary/90"
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
