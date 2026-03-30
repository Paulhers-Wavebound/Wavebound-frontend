import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Video, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIDropZoneProps {
  onVideoDrop: (videoData: { id: number; metadata: Record<string, unknown> }) => void;
  isActive: boolean;
  className?: string;
}

export function AIDropZone({ onVideoDrop, isActive, className }: AIDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Try to get video data from dataTransfer
    const videoDataStr = e.dataTransfer.getData('application/json');
    if (videoDataStr) {
      try {
        const videoData = JSON.parse(videoDataStr);
        if (videoData.type === 'video-for-ai' && videoData.id) {
          onVideoDrop(videoData);
        }
      } catch (err) {
        console.error('Failed to parse dropped video data:', err);
      }
    }
  }, [onVideoDrop]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative rounded-2xl border-2 border-dashed transition-all duration-200",
            isDragOver
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-primary/40 bg-primary/5",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <motion.div
              animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative mb-4"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Video className="w-3.5 h-3.5 text-primary-foreground" />
                </motion.div>
              )}
            </motion.div>

            <h4 className="font-semibold text-foreground mb-1">
              {isDragOver ? 'Drop to Ask AI' : 'Drop Video Here'}
            </h4>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {isDragOver
                ? "I'll analyze this video for you"
                : "Drag any video card to ask AI about it"}
            </p>

            {!isDragOver && (
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-4"
              >
                <ArrowDown className="w-5 h-5 text-primary/50" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact drop indicator that appears at the top of the chat
 */
export function AIDropIndicator({
  isDragOver,
  className,
}: {
  isDragOver: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "overflow-hidden border-b border-primary/30",
            className
          )}
        >
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Drop to ask AI about this video
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
