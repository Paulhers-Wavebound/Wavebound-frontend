import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  ExternalLink,
  Play,
  Heart,
  Users,
  Camera,
  Clock,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';

interface Video {
  id: number;
  video_url: string;
  outliar_score: number;
  video_views: number;
  video_likes: number;
  comments: string;
  profile_followers: number;
  caption?: string;
  hook?: string;
  who?: string;
  genre?: string;
  sub_genre?: string;
  content_style?: string;
  audience?: string;
  gender?: string;
  date_posted?: string;
  embedded_ulr?: string;
  Artist?: string;
  profile_bio?: string;
  is_photo_carousel?: boolean;
  photo_url_1?: string;
  photo_views?: number;
  embedded_url?: string;
}

interface PlanDay {
  day: number;
  video_id: number;
  video?: Video;
  gif_url?: string;
  fields: {
    hookIdea?: string;
    caption?: string;
    location?: string;
    equipment?: string[];
    timeToFilm?: string;
    notes?: string;
  };
}

interface ContentPlanCardProps {
  day: PlanDay;
  onUpdate: (fields: Partial<PlanDay['fields']>) => void;
  onRefresh: (forceRandom?: boolean, contentStyle?: string) => void;
}

const ContentPlanCard: React.FC<ContentPlanCardProps> = ({
  day,
  onUpdate,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showContentStyles, setShowContentStyles] = useState(false);
  const [contentStyles, setContentStyles] = useState<string[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const getContentStyle = () => {
    const style = day.video?.content_style || day.video?.genre || 'Casual Promo';
    return style.split(',')[0].trim();
  };

  const getViralScore = (score: number) => {
    return Math.round(score);
  };

  const loadContentStyles = async () => {
    if (contentStyles.length > 0) return; // Already loaded
    
    setLoadingStyles(true);
    try {
      const { data } = await supabase
        .from('tiktok_videos_all')
        .select('content_style')
        .not('content_style', 'is', null)
        .limit(500);
      
      if (data) {
        const styles = [...new Set(
          data
            .map(item => item.content_style)
            .filter(Boolean)
            .flatMap(style => style.split(',').map(s => s.trim()))
            .filter(style => style.length > 0)
        )].sort();
        
        setContentStyles(styles);
      }
    } catch (error) {
      console.error('Error loading content styles:', error);
    } finally {
      setLoadingStyles(false);
    }
  };

  const handleRefresh = async () => {
    const newCount = refreshCount + 1;
    setRefreshCount(newCount);
    
    if (newCount >= 2) {
      // Show random message after second refresh
      const shouldGoRandom = window.confirm("Want to try something completely random?");
      if (shouldGoRandom) {
        onRefresh(true);
        setRefreshCount(0);
        return;
      }
    }
    
    // Load content styles and show selection
    await loadContentStyles();
    setShowContentStyles(true);
    
    // Reset count after 3 seconds
    setTimeout(() => setRefreshCount(0), 3000);
  };

  const handleContentStyleSelect = (contentStyle: string) => {
    onRefresh(false, contentStyle);
    setShowContentStyles(false);
    setRefreshCount(0);
  };

  const getEffortLevel = () => {
    return 'Low effort'; // Static for now
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl relative"
      style={{ overflow: 'visible' }}
    >
      {/* Collapsed Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">DAY {day.day}</h2>
            <Badge className="bg-slate-600 text-white px-3 py-1 text-sm">
              Video ID: {day.video_id}
            </Badge>
            <Badge className="bg-green-600 text-white px-3 py-1">
              {getEffortLevel()}
            </Badge>
          </div>
          
          {/* Refresh button moved to top-right */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 border border-primary/30 hover:border-primary/50 text-primary hover:text-primary-foreground transition-all duration-300 rounded-lg group"
              title={refreshCount >= 1 ? "Click again for random video" : "Refresh with similar content"}
            >
              <motion.div
                animate={{ rotate: refreshCount > 0 ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">
                {refreshCount >= 1 ? "Try Random" : "Refresh Idea"}
              </span>
            </Button>
            
            {/* Content Style Dropdown */}
            <AnimatePresence>
              {showContentStyles && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowContentStyles(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-80 overflow-y-auto"
                    style={{ 
                      zIndex: 9999
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-white">Choose Content Style</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowContentStyles(false)}
                          className="text-slate-400 hover:text-white p-1 h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {loadingStyles ? (
                        <div className="text-center py-4">
                          <div className="w-5 h-5 mx-auto animate-spin rounded-full border-2 border-white/20 border-t-white mb-2"></div>
                          <p className="text-slate-400 text-xs">Loading...</p>
                        </div>
                          ) : (
                            <div className="space-y-1">
                              {/* Random option at the top */}
                              <button
                                onClick={() => handleContentStyleSelect('random')}
                                className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-slate-700 hover:text-orange-300 rounded transition-colors font-medium border-b border-slate-600 mb-2"
                              >
                                🎲 Random content style
                              </button>
                              
                              {contentStyles.slice(0, 12).map((style) => (
                                <button
                                  key={style}
                                  onClick={() => handleContentStyleSelect(style)}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded transition-colors"
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Video Preview and Info */}
        <div className="flex items-start gap-6">
          {/* Video Thumbnail/GIF */}
          <div className="relative bg-slate-900 rounded-lg overflow-hidden w-48 h-64 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 left-2 z-10 bg-slate-600/80 hover:bg-slate-500/80 text-white p-2"
              onClick={() => {
                const videoUrl = day.video?.is_photo_carousel 
                  ? (day.video?.embedded_url || day.video?.video_url)
                  : (day.video?.video_url || day.video?.embedded_ulr);
                if (videoUrl) {
                  window.open(videoUrl, '_blank');
                }
              }}
              title={day.video?.is_photo_carousel ? "View original photo carousel" : "View original video"}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-orange-500 text-white px-2 py-1 text-sm font-bold">
                #{getViralScore(day.video?.outliar_score || 0)}
              </Badge>
            </div>

            {day.gif_url || day.video?.photo_url_1 ? (
              <img 
                src={day.gif_url || fixSupabaseStorageUrl(day.video?.photo_url_1) || ''}
                alt={day.video?.is_photo_carousel ? "Photo carousel preview" : "Video preview"}
                className={`w-full h-full object-cover transition-all duration-200 ${
                  isExpanded ? '' : 'hover:scale-105'
                }`}
                style={{
                  animationPlayState: isExpanded ? 'running' : 'paused'
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.animationPlayState = 'running';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) {
                    e.currentTarget.style.animationPlayState = 'paused';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <span className="text-sm block">Preview unavailable</span>
                  <span className="text-xs opacity-60">Video ID: {day.video_id}</span>
                </div>
              </div>
            )}

            {/* Artist info */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                #{getViralScore(day.video?.outliar_score || 0)}
              </div>
              <span className="text-white text-sm">
                @{day.video?.Artist || day.video?.['artist'] || 'unknown'}
              </span>
            </div>

            {/* Play stats */}
            <div className="absolute bottom-2 right-2 text-white text-xs">
              ▶ {formatNumber(day.video?.is_photo_carousel ? (day.video?.photo_views || 0) : (day.video?.video_views || 0))}
            </div>
          </div>

          {/* Content Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-white">{getContentStyle()}</h3>
              <div className="w-6 h-6 text-orange-400">📈</div>
            </div>
            
            <div className="mb-3">
              <Badge variant="outline" className="border-slate-500 text-slate-300 bg-slate-800/50">
                Reference Video ID: {day.video_id}
              </Badge>
            </div>
            
            <p className="text-slate-300 text-lg mb-4">
              {day.video?.who || ''}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 text-slate-400">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>{formatNumber(day.video?.video_views || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{formatNumber(day.video?.video_likes || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{formatNumber(day.video?.profile_followers || 0)}</span>
            </div>
          </div>
        </div>

        {/* Main Planning Fields - Always Visible */}
        <div className="mt-6 border-t border-slate-700 pt-6 space-y-6">
          {/* Hook Example - Read Only */}
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <span className="text-yellow-400">💡</span>
              Hook Example (from reference video)
            </h4>
            <div className="bg-slate-900 rounded-lg p-4 text-slate-300 italic min-h-[60px] flex items-center border border-slate-700">
              {day.video?.hook || 'No hook example available for this video'}
            </div>
          </div>

          {/* Hook Idea - Editable */}
          <div>
            <h4 className="text-white font-medium mb-2">Your Hook Idea</h4>
            <Textarea
              value={day.fields.hookIdea || ''}
              onChange={(e) => onUpdate({ hookIdea: e.target.value })}
              placeholder="Write your hook idea based on the example above..."
              className="bg-slate-900 border-slate-700 text-white placeholder-slate-400 min-h-[80px]"
            />
          </div>

          {/* Caption - Editable */}
          <div>
            <h4 className="text-white font-medium mb-2">Caption</h4>
            <Textarea
              value={day.fields.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder="Write your caption..."
              className="bg-slate-900 border-slate-700 text-white placeholder-slate-400 min-h-[80px]"
            />
          </div>

          {/* Notes - Editable */}
          <div>
            <h4 className="text-white font-medium mb-2">Notes</h4>
            <Textarea
              value={day.fields.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Any additional notes, reminders, outfit ideas..."
              className="bg-slate-900 border-slate-700 text-white placeholder-slate-400 min-h-[60px]"
            />
          </div>
        </div>

        {/* Expandable Production Details Section */}
        <motion.div 
          className="relative mt-6 border-t border-primary/20 bg-gradient-to-br from-primary/8 via-primary/12 to-secondary/8 hover:from-primary/12 hover:via-primary/18 hover:to-secondary/12 transition-all duration-500 cursor-pointer group overflow-hidden rounded-b-xl"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.998 }}
        >
          <div className="relative p-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <motion.div
                animate={{ 
                  rotate: isExpanded ? 180 : 0
                }}
                transition={{ 
                  rotate: { duration: 0.5, ease: "easeInOut" }
                }}
              >
                <ChevronDown className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                {isExpanded ? 'Hide Production Details' : 'Production Details'}
              </h3>
              
              <p className="text-sm text-foreground/80 group-hover:text-foreground transition-colors duration-500 max-w-lg mx-auto">
                {isExpanded 
                  ? 'Collapse to hide equipment and timing details' 
                  : 'Equipment, location, and filming time'
                }
              </p>
            </div>
          </div>
        </motion.div>

        </div>
      </div>

      {/* Expanded Production Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-700"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Location */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-400">📍</span>
                  <h4 className="text-white font-medium">Location</h4>
                </div>
                <Input
                  value={day.fields.location || ''}
                  onChange={(e) => onUpdate({ location: e.target.value })}
                  placeholder="e.g bedroom..."
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-400"
                />
              </div>

              {/* Equipment */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4 text-orange-400" />
                  <h4 className="text-white font-medium">Equipment</h4>
                </div>
                <div className="flex gap-2">
                  {['Phone', 'Pro Camera'].map((equipment) => (
                    <Button
                      key={equipment}
                      variant={day.fields.equipment?.includes(equipment) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const current = day.fields.equipment || [];
                        const updated = current.includes(equipment)
                          ? current.filter(e => e !== equipment)
                          : [...current, equipment];
                        onUpdate({ equipment: updated });
                      }}
                      className={`text-xs ${
                        day.fields.equipment?.includes(equipment)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {equipment}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time to film */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white font-medium">Time to film</h4>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={day.fields.timeToFilm || ''}
                    onChange={(e) => onUpdate({ timeToFilm: e.target.value })}
                    placeholder="00:00"
                    className="bg-slate-900 border-slate-700 text-white placeholder-slate-400 w-20"
                  />
                  <span className="text-slate-400 self-center">-</span>
                  <Input
                    placeholder="19:20"
                    className="bg-slate-900 border-slate-700 text-white placeholder-slate-400 w-20"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ContentPlanCard;