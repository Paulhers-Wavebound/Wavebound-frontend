import React from 'react';
import TikTokVideoCard from './TikTokVideoCard';
import type { ExtractedVideo } from '@/utils/extractTikTokVideos';

interface VideoCardStripProps {
  videos: ExtractedVideo[];
}

const VideoCardStrip: React.FC<VideoCardStripProps> = ({ videos }) => {
  if (videos.length === 0) return null;

  return (
    <div
      className="video-card-strip flex gap-3 overflow-x-auto pb-2 mt-3 mb-1"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style>{`.video-card-strip::-webkit-scrollbar { display: none; }`}</style>
      {videos.map((video) => (
        <TikTokVideoCard
          key={video.url}
          url={video.url}
          description={video.description}
          stats={video.stats}
        />
      ))}
    </div>
  );
};

export default React.memo(VideoCardStrip);
