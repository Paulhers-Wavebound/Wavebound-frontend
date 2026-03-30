import React from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import VideoCard from './VideoCard';
import PhotoCarouselCard from './PhotoCarouselCard';
import { Video, PhotoCarousel, ContentItem } from '../types/content';

interface VideoGridProps {
  allContent: ContentItem[];
  viewMode: 'grid' | 'table';
  isContentSelected: (item: ContentItem) => boolean;
  toggleContentSelection: (item: ContentItem) => void;
  handleVideoClick: (video: Video) => void;
  handlePhotoCarouselClick: (carousel: PhotoCarousel) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  allContent,
  viewMode,
  isContentSelected,
  toggleContentSelection,
  handleVideoClick,
  handlePhotoCarouselClick,
}) => {
  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 lg:gap-8 px-3 md:px-6" 
      : "space-y-4"
    }>
      {allContent.length > 0 ? (
        allContent.map((item, index) => {
          // Create unique keys to prevent duplicate key warnings
          const uniqueKey = 'video_url' in item ? `video-${item.id}-${index}` : `carousel-${item.id}-${index}`;
          
          if ('video_url' in item) {
            // This is a video
            return (
              <VideoCard
                key={uniqueKey}
                video={item}
                isSelected={isContentSelected(item)}
                onToggleSelect={() => toggleContentSelection(item)}
                onVideoClick={() => handleVideoClick(item)}
                viewMode={viewMode}
                allContent={allContent}
                currentIndex={index}
              />
            );
          } else {
            // This is a photo carousel
            return (
              <PhotoCarouselCard
                key={`carousel-${item.id}`}
                photoCarousel={item}
                isSelected={isContentSelected(item)}
                onToggleSelect={() => toggleContentSelection(item)}
                onClick={() => handlePhotoCarouselClick(item)}
              />
            );
          }
        })
      ) : (
        <div className="col-span-full text-center py-12">
          <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No videos match your filters
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filter criteria to see more results
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;