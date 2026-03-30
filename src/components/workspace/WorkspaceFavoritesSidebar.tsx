import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableFavoriteCard from '@/components/DraggableFavoriteCard';
import WaveboundLoader from '@/components/WaveboundLoader';
import { Video as BaseVideo, PhotoCarousel as BasePhotoCarousel } from '@/types/content';

type Video = BaseVideo & { Artist?: string };
type PhotoCarousel = BasePhotoCarousel & { "who?"?: string };

interface WorkspaceFavoritesSidebarProps {
  sortedVideos: Video[];
  sortedPhotos: PhotoCarousel[];
  loading: boolean;
  hoveredVideo: number | null;
  setHoveredVideo: (id: number | null) => void;
  onVideoClick: (video: Video) => void;
  onPhotoClick: (photo: PhotoCarousel) => void;
  onRemoveVideo: (id: number) => void;
  onRemovePhoto: (id: number) => void;
  formatNumber: (num: number) => string;
  getCategoryColor: (category: string) => string;
  getViralScore: (score?: number) => number;
}

const WorkspaceFavoritesSidebar = ({
  sortedVideos,
  sortedPhotos,
  loading,
  hoveredVideo,
  setHoveredVideo,
  onVideoClick,
  onPhotoClick,
  onRemoveVideo,
  onRemovePhoto,
  formatNumber,
  getCategoryColor,
  getViralScore,
}: WorkspaceFavoritesSidebarProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-4 bg-card border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-slate-500" />
          Favorites ({sortedVideos.length + sortedPhotos.length})
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <WaveboundLoader />
        </div>
      ) : sortedVideos.length === 0 && sortedPhotos.length === 0 ? (
        <div className="py-6 text-center">
          <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No favorites yet</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/explore')}
          >
            Explore Videos
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 custom-scrollbar">
          <SortableContext
            items={[...sortedVideos.map(v => `video-${v.id}`), ...sortedPhotos.map(p => `photo-${p.id}`)]}
            strategy={verticalListSortingStrategy}
          >
            {sortedVideos.map((video) => {
              const category = video.content_style || video.genre || 'Video';
              return (
                <DraggableFavoriteCard
                  key={`video-${video.id}`}
                  id={`video-${video.id}`}
                  type="video"
                  thumbnail={video.thumbnail_url}
                  gifUrl={video.gif_url}
                  viralScore={getViralScore(video.outliar_score)}
                  title={category}
                  views={video.video_views || 0}
                  followers={video.profile_followers || 0}
                  artist={video.Artist || 'unknown'}
                  isHovered={hoveredVideo === video.id}
                  onHover={(hovering) => setHoveredVideo(hovering ? video.id : null)}
                  onClick={() => onVideoClick(video)}
                  onRemove={() => onRemoveVideo(video.id)}
                  onFindSimilar={() => navigate(`/explore?contentStyle=${encodeURIComponent(category)}`)}
                  formatNumber={formatNumber}
                  category={category}
                  colorClass={getCategoryColor(category)}
                  itemId={video.id}
                />
              );
            })}

            {sortedPhotos.map((photo) => {
              const category = photo.content_style || photo.genre || 'Photo Carousel';
              return (
                <DraggableFavoriteCard
                  key={`photo-${photo.id}`}
                  id={`photo-${photo.id}`}
                  type="photo"
                  thumbnail={photo.photo_url_1}
                  gifUrl={null}
                  viralScore={getViralScore(photo.outliar_score)}
                  title={category}
                  views={photo.photo_views || 0}
                  followers={Number(photo.profile_followers) || 0}
                  artist={photo.artist || 'unknown'}
                  isHovered={false}
                  onHover={() => {}}
                  onClick={() => onPhotoClick(photo)}
                  onRemove={() => onRemovePhoto(photo.id)}
                  onFindSimilar={() => navigate(`/explore?contentStyle=${encodeURIComponent(category)}`)}
                  formatNumber={formatNumber}
                  category={category}
                  colorClass={getCategoryColor(category)}
                  itemId={photo.id}
                />
              );
            })}
          </SortableContext>
        </div>
      )}
    </Card>
  );
};

export default WorkspaceFavoritesSidebar;
