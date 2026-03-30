import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Video } from 'lucide-react';
import { useContentPlan } from '@/contexts/ContentPlanContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import TikTokThumbnail from './TikTokThumbnail';

/**
 * Dialog to select which day to add a video to in the content plan.
 * Opens when user clicks "Add to Plan" on an AI-recommended video.
 */
export function DaySelectorDialog() {
  const { videoToAdd, closeDaySelector, planVideos, replaceVideoAtDay } = useContentPlan();

  const handleSelectDay = (dayIndex: number) => {
    if (videoToAdd) {
      replaceVideoAtDay(videoToAdd, dayIndex);
      toast.success(`Added to Day ${dayIndex + 1} of your content plan`);
      closeDaySelector();
    }
  };

  const dayLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  return (
    <Dialog open={!!videoToAdd} onOpenChange={(open) => !open && closeDaySelector()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Add to Content Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a day to add this video to your 7-day content plan:
          </p>

          {/* Day grid */}
          <div className="grid grid-cols-1 gap-2">
            {planVideos.map((video, index) => (
              <button
                key={index}
                onClick={() => handleSelectDay(index)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                )}
              >
                {/* Current video thumbnail */}
                <div className="w-12 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : video.embedded_ulr ? (
                    <TikTokThumbnail 
                      videoId={video.id}
                      tiktokUrl={video.embedded_ulr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Day info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {dayLabels[index]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {video.hook || video.content_style || 'Current video'}
                  </p>
                </div>

                {/* Replace indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-primary">
                  <Check className="w-4 h-4" />
                  Replace
                </div>
              </button>
            ))}
          </div>

          {planVideos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No content plan active</p>
              <p className="text-xs mt-1">Create a content plan from an audio analysis first</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={closeDaySelector}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
