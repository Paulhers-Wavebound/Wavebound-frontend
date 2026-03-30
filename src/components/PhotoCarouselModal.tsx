import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { X, Heart, Users, ExternalLink, ChevronLeft, ChevronRight, Eye, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { parseGenreJson, parseSubGenreJson } from '@/utils/genreParser';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';

interface PhotoCarousel {
  id: number;
  embedded_url?: string;
  outliar_score?: number;
  photo_views?: number;
  photo_likes?: number;
  comments?: string;
  profile_followers?: number;
  caption?: string;
  Hook?: string;
  "who?"?: string;
  genre?: string;
  sub_genre?: string;
  content_style?: string;
  Audience?: string;
  gender?: string;
  date_posted?: string;
  artist?: string;
  profile_bio?: string;
  photo_text_1?: string;
  photo_text_2?: string;
  photo_text_3?: string;
  photo_text_4?: string;
  photo_text_5?: string;
  photo_url_1?: string;
  photo_url_2?: string;
  photo_url_3?: string;
  video_file_url?: string;
  audio_url_96k?: string;
}

interface PhotoCarouselModalProps {
  photoCarousel: PhotoCarousel | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showReplaceMode?: boolean;
  onReplaceInPlan?: (carousel: PhotoCarousel, dayIndex: number) => void;
  currentPlanVideos?: any[];
  selectedForReplace?: any | null;
  onSelectForReplace?: (item: any | null) => void;
}

const PhotoCarouselModal: React.FC<PhotoCarouselModalProps> = ({
  photoCarousel,
  isOpen,
  onClose,
  isSelected = false,
  onToggleSelect,
  showReplaceMode = false,
  onReplaceInPlan,
  currentPlanVideos = [],
  selectedForReplace,
  onSelectForReplace,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    if (!photoCarousel) return;
    
    if (videoRef.current && isOpen && photoCarousel.video_file_url) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
    if (audioRef.current && isOpen && photoCarousel.audio_url_96k && !photoCarousel.video_file_url) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen, photoCarousel?.id, photoCarousel]);

  if (!photoCarousel) return null;

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    if (audioRef.current && !photoCarousel.video_file_url) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlaybackRate = () => {
    if (videoRef.current) {
      const rates = [1, 1.25, 1.5, 1.75, 2];
      const currentIndex = rates.indexOf(playbackRate);
      const newRate = rates[(currentIndex + 1) % rates.length];
      videoRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
    if (audioRef.current) {
      const rates = [1, 1.25, 1.5, 1.75, 2];
      const currentIndex = rates.indexOf(playbackRate);
      const newRate = rates[(currentIndex + 1) % rates.length];
      audioRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const getViralScore = (score: number) => {
    return Math.round(score * 100);
  };

  const getGenreTags = () => {
    const tags = [];
    if (photoCarousel.genre) {
      // Parse JSON-formatted genre data
      tags.push(...parseGenreJson(photoCarousel.genre));
    }
    return tags.slice(0, 2);
  };

  const getContentStyleTags = () => {
    const tags = [];
    if (photoCarousel.content_style) {
      tags.push(...photoCarousel.content_style.split(',').map(s => s.trim()));
    }
    if (photoCarousel.Hook) {
      tags.push('Hook');
    }
    return tags.slice(0, 2);
  };

  // Get all available photos - fix URLs for Supabase storage
  const photos = [
    { url: fixSupabaseStorageUrl(photoCarousel.photo_url_1), text: photoCarousel.photo_text_1 },
    { url: fixSupabaseStorageUrl(photoCarousel.photo_url_2), text: photoCarousel.photo_text_2 },
    { url: fixSupabaseStorageUrl(photoCarousel.photo_url_3), text: photoCarousel.photo_text_3 },
  ].filter(photo => photo.url || photo.text);

  const nextPhoto = () => {
    setIsLoadingPhoto(true);
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setIsLoadingPhoto(true);
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handlePhotoLoad = () => {
    setIsLoadingPhoto(false);
  };

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] bg-slate-900 border-slate-700 p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Left side - Photo Carousel */}
          <div className="w-1/2 relative bg-black flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Viral score badge */}
            <Badge className="absolute top-4 left-4 z-10 bg-orange-500 text-white px-3 py-1 text-sm font-bold">
              {getViralScore(photoCarousel.outliar_score)}
            </Badge>

            {/* Photo Carousel indicator */}
            <Badge className="absolute top-16 left-4 z-10 bg-purple-600 text-white px-3 py-1 text-sm font-bold">
              Photo Carousel
            </Badge>

            {/* Photo/Video display */}
            <div className="w-full h-full relative">
              {photoCarousel.video_file_url ? (
                <>
                  <video 
                    ref={videoRef}
                    src={photoCarousel.video_file_url}
                    autoPlay
                    loop
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Unified controls and stats bar */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 space-y-3">
                    {/* Progress bar */}
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    
                    {/* Controls and stats row */}
                    <div className="flex items-center justify-between text-white">
                      {/* Left: Play/pause, speed, and time */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={togglePlayPause}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8 hover:bg-white/20"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 fill-white" />
                          ) : (
                            <Play className="w-5 h-5 fill-white" />
                          )}
                        </Button>
                        
                        <Button
                          onClick={togglePlaybackRate}
                          variant="ghost"
                          size="sm"
                          className="px-2 h-8 hover:bg-white/20 text-xs font-bold"
                        >
                          {playbackRate}x
                        </Button>
                        
                        <span className="text-sm font-medium ml-1">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      {/* Right: Volume and Stats */}
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={toggleMute}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8 hover:bg-white/20"
                        >
                          {isMuted ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </Button>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 fill-white" />
                            <span className="text-sm font-medium">{formatNumber(photoCarousel.photo_views)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 fill-white" />
                            <span className="text-sm font-medium">{formatNumber(photoCarousel.photo_likes)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 fill-white" />
                            <span className="text-sm font-medium">{formatNumber(photoCarousel.profile_followers)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : currentPhoto?.url ? (
                <>
                  <img 
                    src={currentPhoto.url} 
                    alt={`Photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-contain"
                    onLoad={handlePhotoLoad}
                  />
                  {isLoadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                  )}
                </>
              ) : currentPhoto?.text ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-8">
                  <p className="text-white text-lg text-center leading-relaxed max-w-md">
                    {currentPhoto.text}
                  </p>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center text-white">
                    <span className="text-lg block">Photo Carousel</span>
                    <span className="text-sm opacity-60">No photos available</span>
                  </div>
                </div>
              )}

              {/* Navigation arrows - only show for photo carousels, not videos */}
              {!photoCarousel.video_file_url && photos.length > 1 && (
                <>
                  <Button
                    onClick={prevPhoto}
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    onClick={nextPhoto}
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Photo counter - only show for photo carousels, not videos */}
              {!photoCarousel.video_file_url && photos.length > 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              )}
              
              {/* Audio player for photo carousels with audio */}
              {!photoCarousel.video_file_url && photoCarousel.audio_url_96k && (
                <>
                  <audio 
                    ref={audioRef}
                    src={photoCarousel.audio_url_96k}
                    autoPlay
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                  
                  {/* Audio controls bar */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 space-y-3">
                    {/* Progress bar */}
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    
                    {/* Controls and stats row */}
                    <div className="flex items-center justify-between text-white">
                      {/* Left: Play/pause, speed, and time */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={togglePlayPause}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8 hover:bg-white/20"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 fill-white" />
                          ) : (
                            <Play className="w-5 h-5 fill-white" />
                          )}
                        </Button>
                        
                        <Button
                          onClick={togglePlaybackRate}
                          variant="ghost"
                          size="sm"
                          className="px-2 h-8 hover:bg-white/20 text-xs font-bold"
                        >
                          {playbackRate}x
                        </Button>
                        
                        <span className="text-sm font-medium ml-1">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      {/* Right: Volume and Stats */}
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={toggleMute}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8 hover:bg-white/20"
                        >
                          {isMuted ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </Button>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 fill-white" />
                            <span className="text-sm font-medium">{formatNumber(photoCarousel.photo_views)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 fill-white" />
                            <span className="text-sm font-medium">{formatNumber(photoCarousel.photo_likes)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 fill-white" />
                            <span className="text-sm font-medium">{formatNumber(photoCarousel.profile_followers)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Stats for photo carousels without video or audio */}
              {!photoCarousel.video_file_url && !photoCarousel.audio_url_96k && (
                <div className="absolute bottom-4 left-4 flex items-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 fill-white" />
                    <span className="text-lg font-medium">{formatNumber(photoCarousel.photo_views)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 fill-white" />
                    <span className="text-lg font-medium">{formatNumber(photoCarousel.photo_likes)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 fill-white" />
                    <span className="text-lg font-medium">{formatNumber(photoCarousel.profile_followers)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Add button */}
            {onToggleSelect && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onToggleSelect}
                      className={`absolute top-4 right-16 text-white rounded-lg p-3 ${
                        isSelected 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    >
                      <span className="text-xl">+</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add to your content plan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Right side - Information */}
          <div className="w-1/2 bg-slate-900 text-white p-6 overflow-y-auto">
            {/* Header with username and genre tags */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📷</span>
                <span className="text-xl font-medium">@{photoCarousel.artist || 'unknown'}</span>
                <div className="flex gap-2 ml-auto">
                  {getGenreTags().map((tag, idx) => (
                    <Badge key={idx} className="bg-slate-700 text-white hover:bg-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Content category */}
              <div className="mb-4">
                <p className="text-lg font-medium mb-2">Content category :</p>
                <div className="flex gap-2">
                  {getContentStyleTags().map((tag, idx) => (
                    <Badge key={idx} className="bg-slate-700 text-white hover:bg-slate-600 px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Hook section */}
            {photoCarousel.Hook && (
              <div className="mb-6">
                <h3 className="text-xl font-medium mb-3">Hook</h3>
                <p className="text-gray-300 italic leading-relaxed">
                  {photoCarousel.Hook}
                </p>
              </div>
            )}

            {/* Caption section */}
            {photoCarousel.caption && (
              <div className="mb-6">
                <h3 className="text-xl font-medium mb-3">Caption</h3>
                <p className="text-gray-300 leading-relaxed">
                  {photoCarousel.caption}
                </p>
              </div>
            )}

            {/* About section */}
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-3">About</h3>
              <p className="text-gray-300 leading-relaxed">
                {photoCarousel["who?"] || 'No artist information available.'}
              </p>
            </div>

            {/* Replace mode buttons */}
            {showReplaceMode && currentPlanVideos && currentPlanVideos.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-medium mb-3">Replace in Plan</h3>
                <div className="grid grid-cols-7 gap-2">
                  {currentPlanVideos.map((planItem, index) => (
                    <Button
                      key={index}
                      onClick={() => {
                        if (onReplaceInPlan && photoCarousel) {
                          const carouselWithFlag = { ...photoCarousel, is_photo_carousel: true };
                          onReplaceInPlan(carouselWithFlag, index);
                          onClose();
                        }
                      }}
                      variant={selectedForReplace?.id === photoCarousel?.id ? "default" : "outline"}
                      className="h-16 text-sm"
                    >
                      Day {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* View Original button */}
            <Button 
              onClick={() => {
                if (photoCarousel.embedded_url) {
                  window.open(photoCarousel.embedded_url, '_blank');
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCarouselModal;