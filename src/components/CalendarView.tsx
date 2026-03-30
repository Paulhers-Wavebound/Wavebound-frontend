import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, RotateCcw, Play, Heart, Users } from 'lucide-react';
import { format, addDays } from 'date-fns';

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

interface CalendarViewProps {
  planDays: PlanDay[];
  onRefresh: (dayIndex: number, forceRandom?: boolean, contentStyle?: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ planDays, onRefresh }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const getContentStyle = (video?: Video) => {
    const style = video?.content_style || video?.genre || 'Casual Promo';
    return style.split(',')[0].trim();
  };

  const getViralScore = (score: number) => {
    return Math.round(score);
  };

  const today = new Date();
  
  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2">7-Day Content Calendar</h3>
        <p className="text-muted-foreground">Starting {format(today, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {planDays.map((day, index) => {
          const dayDate = addDays(today, index);
          
          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group"
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{format(dayDate, 'd')}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {format(dayDate, 'EEE')}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary text-xs">
                    Day {day.day}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRefresh(index)}
                    className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20"
                    title="Refresh video"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Video Preview */}
              <div className="relative mb-3">
                <div className="aspect-[9/16] bg-slate-900 rounded-lg overflow-hidden relative">
                  {day.gif_url ? (
                    <img 
                      src={day.gif_url}
                      alt="Video preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <span className="text-xs">Preview unavailable</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-orange-500 text-white text-xs">
                        #{getViralScore(day.video?.outliar_score || 0)}
                      </Badge>
                    </div>
                    
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-white text-xs mb-1 truncate">
                        @{day.video?.Artist || 'unknown'}
                      </div>
                      <div className="flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          <span>{formatNumber(day.video?.video_views || 0)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-5 h-5 p-0 text-white hover:text-primary"
                          onClick={() => {
                            const videoUrl = day.video?.video_url || day.video?.embedded_ulr;
                            if (videoUrl) {
                              window.open(videoUrl, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">
                    {getContentStyle(day.video)}
                  </Badge>
                </div>
                
                {day.video?.who && (
                  <p className="text-sm text-foreground/80 line-clamp-2">
                    {day.video.who}
                  </p>
                )}
                
                {/* Quick Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>{formatNumber(day.video?.video_likes || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{formatNumber(day.video?.profile_followers || 0)}</span>
                  </div>
                </div>
                
                {/* Planning Status */}
                {(day.fields.hookIdea || day.fields.caption || day.fields.location) && (
                  <div className="pt-2">
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      ✓ Planned
                    </Badge>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;