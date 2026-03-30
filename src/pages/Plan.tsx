import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import HeaderAuth from "@/components/HeaderAuth";
import FooterSection from "@/components/FooterSection";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronLeft, RotateCcw, Calendar, List, Sparkles, Target } from "lucide-react";
import throttle from "just-throttle";
import ContentPlanCard from "@/components/ContentPlanCard";
import CalendarView from "@/components/CalendarView";

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
  gif_url?: string | null;
  thumbnail_url?: string | null;
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

const Plan = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showNamingDialog, setShowNamingDialog] = useState(false);
  const [planName, setPlanName] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const videoIds = searchParams.getAll('videos').map(Number).filter(Boolean);
  const genres = searchParams.get('genres')?.split(/[,/]/) || [];
  const contentStyles = searchParams.get('content_styles')?.split(',') || [];

  useEffect(() => {
    checkAuth();
    generatePlan();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const generatePlan = async () => {
    try {
      let videos: Video[] = [];

      if (videoIds.length > 0) {
        const { data, error } = await supabase
          .from('tiktok_videos_all')
          .select('*')
          .in('id', videoIds);
        
        if (error) throw error;
        videos = data || [];
      }

      while (videos.length < 7) {
        const existingIds = videos.map(v => v.id);
        let query = supabase
          .from('tiktok_videos_all')
          .select('*');
        
        if (existingIds.length > 0) {
          query = query.not('id', 'in', `(${existingIds.join(',')})`);
        }

        if (genres.length > 0) {
          const { data: genreVideos } = await query
            .order('outliar_score', { ascending: false })
            .limit(100);
          
          if (genreVideos && genreVideos.length > 0) {
            let filtered = genreVideos.filter(video => {
              if (!video.genre) return false;
              
              let genreMatch = false;
              try {
                const genreObj = typeof video.genre === 'string' 
                  ? JSON.parse(video.genre.replace(/'/g, '"'))
                  : video.genre;
                const videoGenres = Object.keys(genreObj || {});
                
                genreMatch = genres.some(selectedGenre => 
                  videoGenres.some(videoG => 
                    videoG.toLowerCase().includes(selectedGenre.toLowerCase()) ||
                    selectedGenre.toLowerCase().includes(videoG.toLowerCase())
                  )
                );
              } catch (e) {
                const videoGenres = (video.genre || '')
                  .split(/[,/]/)
                  .map(g => g.trim().replace(/['"{}]/g, '').split(':')[0].trim())
                  .filter(g => g && g.length > 0);
                
                genreMatch = genres.some(selectedGenre => 
                  videoGenres.some(videoG => 
                    videoG.toLowerCase().includes(selectedGenre.toLowerCase()) ||
                    selectedGenre.toLowerCase().includes(videoG.toLowerCase())
                  )
                );
              }
              
              if (contentStyles.length > 0 && video.content_style) {
                const styleMatch = contentStyles.some(style => 
                  video.content_style?.toLowerCase().includes(style.toLowerCase())
                );
                return genreMatch && styleMatch;
              }
              
              return genreMatch;
            });
            
            if (filtered.length === 0 && contentStyles.length > 0) {
              filtered = genreVideos.filter(video => {
                if (!video.genre) return false;
                
                try {
                  const genreObj = typeof video.genre === 'string' 
                    ? JSON.parse(video.genre.replace(/'/g, '"'))
                    : video.genre;
                  const videoGenres = Object.keys(genreObj || {});
                  
                  return genres.some(selectedGenre => 
                    videoGenres.some(videoG => 
                      videoG.toLowerCase().includes(selectedGenre.toLowerCase()) ||
                      selectedGenre.toLowerCase().includes(videoG.toLowerCase())
                    )
                  );
                } catch (e) {
                  const videoGenres = (video.genre || '')
                    .split(/[,/]/)
                    .map(g => g.trim().replace(/['"{}]/g, '').split(':')[0].trim())
                    .filter(g => g && g.length > 0);
                  
                  return genres.some(selectedGenre => 
                    videoGenres.some(videoG => 
                      videoG.toLowerCase().includes(selectedGenre.toLowerCase()) ||
                      selectedGenre.toLowerCase().includes(videoG.toLowerCase())
                    )
                  );
                }
              });
            }
            
            if (filtered.length > 0) {
              const randomVideo = filtered[Math.floor(Math.random() * filtered.length)];
              videos.push(randomVideo);
              continue;
            }
          }
        }

        const { data: randomVideos } = await query
          .order('outliar_score', { ascending: false })
          .limit(20);
        
        if (randomVideos && randomVideos.length > 0) {
          const randomVideo = randomVideos[Math.floor(Math.random() * randomVideos.length)];
          videos.push(randomVideo);
        } else {
          break;
        }
      }

      const videoIdsToFetch = videos.map(v => v.id);
      const { data: gifData } = await supabase
        .from('media_assets_gif_thumbnail')
        .select('video_id, url')
        .in('video_id', videoIdsToFetch);

      const gifMap = new Map();
      gifData?.forEach(g => {
        if (!gifMap.has(g.video_id)) {
          gifMap.set(g.video_id, g.url);
        }
      });

      const plan = videos.slice(0, 7).map((video, index) => ({
        day: index + 1,
        video_id: video.id,
        video,
        gif_url: gifMap.get(video.id) || null,
        fields: {
          hookIdea: '',
          caption: '',
          location: '',
          equipment: ['Phone'],
          timeToFilm: '00:30',
          notes: ''
        }
      }));

      setPlanDays(plan);
      
      if (user) {
        await autoSavePlan(plan);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error generating plan",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoSavePlan = async (plan: PlanDay[]) => {
    try {
      const planData = {
        days: plan,
        selected_video_ids: videoIds,
        selected_genres: genres
      };
      
      const { data: existingPlans } = await supabase
        .from('content_plans')
        .select('id, plan')
        .eq('user_id', user.id);
      
      const hasSamePlan = existingPlans?.some(p => {
        try {
          const existingPlan = typeof p.plan === 'string' ? JSON.parse(p.plan) : p.plan;
          return JSON.stringify(existingPlan.selected_video_ids) === JSON.stringify(videoIds);
        } catch {
          return false;
        }
      });
      
      if (hasSamePlan) {
        return;
      }

      const planName = `Plan - ${genres.slice(0, 2).join(', ')} (${new Date().toLocaleDateString()})`;

      await supabase.from('content_plans').insert([{
        user_id: user.id,
        name: planName,
        plan: JSON.stringify(planData)
      }]);
    } catch (error) {
      console.error('Error auto-saving plan:', error);
    }
  };

  const saveDraft = throttle(async (updatedPlan: PlanDay[]) => {
    if (!user) return;
    
    try {
      await supabase
        .from('content_plan_drafts')
        .upsert({
          user_id: user.id,
          draft: JSON.stringify({
            days: updatedPlan,
            selected_video_ids: videoIds,
            selected_genres: genres
          })
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, 1000);

  const updatePlanDay = (dayIndex: number, fields: Partial<PlanDay['fields']>) => {
    const updated = [...planDays];
    updated[dayIndex] = {
      ...updated[dayIndex],
      fields: { ...updated[dayIndex].fields, ...fields }
    };
    setPlanDays(updated);
    saveDraft(updated);
  };

  const refreshVideo = async (dayIndex: number, forceRandom = false, contentStyle?: string) => {
    try {
      const currentVideo = planDays[dayIndex].video;
      const currentGenres = currentVideo?.genre?.split(/[,/]/) || genres;
      
      let query = supabase
        .from('tiktok_videos_all')
        .select('*')
        .neq('id', planDays[dayIndex].video_id);

      if (contentStyle && contentStyle !== 'random') {
        const { data: styleVideos } = await query
          .ilike('content_style', `%${contentStyle}%`)
          .order('outliar_score', { ascending: false })
          .limit(50);
        
        if (styleVideos && styleVideos.length > 0) {
          const randomVideo = styleVideos[Math.floor(Math.random() * styleVideos.length)];
          await updateVideoInPlan(dayIndex, randomVideo);
          return;
        }
      } else if (!forceRandom && currentGenres.length > 0) {
        const { data: genreVideos } = await query
          .order('outliar_score', { ascending: false })
          .limit(50);
        
        if (genreVideos) {
          const filtered = genreVideos.filter(video => {
            const videoGenres = (video.genre || '')
              .split(/[,/]/)
              .map(g => g.trim().replace(/['"]/g, '').replace(/\s+/g, ' ').trim())
              .filter(g => g && g.length > 0);
            
            return currentGenres.some(selectedGenre => 
              videoGenres.some(videoG => 
                videoG.toLowerCase() === selectedGenre.toLowerCase()
              )
            );
          });
          
          if (filtered.length > 0) {
            const randomVideo = filtered[Math.floor(Math.random() * filtered.length)];
            await updateVideoInPlan(dayIndex, randomVideo);
            return;
          }
        }
      }

      const { data, error } = await query
        .order('outliar_score', { ascending: false })
        .limit(20);
      
      if (error) throw error;

      if (data && data.length > 0) {
        const randomVideo = data[Math.floor(Math.random() * data.length)];
        await updateVideoInPlan(dayIndex, randomVideo);
      }
    } catch (error) {
      console.error('Error refreshing video:', error);
      toast({
        title: "Error refreshing video",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateVideoInPlan = async (dayIndex: number, newVideo: Video) => {
    const { data: gifData } = await supabase
      .from('media_assets_gif_thumbnail')
      .select('url')
      .eq('video_id', newVideo.id)
      .limit(1)
      .maybeSingle();

    const updated = [...planDays];
    updated[dayIndex] = {
      ...updated[dayIndex],
      video_id: newVideo.id,
      video: newVideo,
      gif_url: gifData?.url || null,
      fields: {
        ...updated[dayIndex].fields,
        caption: ''
      }
    };
    setPlanDays(updated);
    saveDraft(updated);
    
    toast({
      title: "Video refreshed! 🔄",
      description: "New content inspiration loaded.",
    });
  };

  const savePlan = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your plan.",
        variant: "destructive"
      });
      return;
    }

    setShowNamingDialog(true);
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your content plan.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await supabase.from('content_plans').insert({
        user_id: user.id,
        name: planName.trim(),
        plan: JSON.stringify({
          days: planDays,
          selected_video_ids: videoIds,
          selected_genres: genres
        })
      });

      // Check for first_plan achievement
      const { data: existingAchievement } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_type', 'first_plan')
        .maybeSingle();
      
      if (!existingAchievement) {
        await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_type: 'first_plan',
        });
        
        toast({
          title: "🏆 Achievement Unlocked: Content Planner!",
          description: "You created your first content plan!",
        });
      } else {
        toast({
          title: "Plan saved! 🎉",
          description: "Your content plan has been saved.",
        });
      }

      setShowNamingDialog(false);
      setPlanName("");
      navigate('/my-plans');
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error saving plan",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshAllVideos = async () => {
    toast({
      title: "Refreshing all videos...",
      description: "Finding new content for you.",
    });

    for (let i = 0; i < planDays.length; i++) {
      await refreshVideo(i, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderAuth variant="light" />
        <div className="pt-24 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="w-12 h-12 mx-auto animate-spin rounded-full border-2 border-primary/20 border-t-primary mb-4"></div>
            <p className="text-muted-foreground">Crafting your perfect plan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderAuth variant="light" />
      
      <div className="pt-20 px-6 pb-20 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl bg-card border border-border/50 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg ${
                    viewMode === 'list' 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <List className="w-3 h-3 mr-1" />
                  List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg ${
                    viewMode === 'calendar' 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Calendar
                </Button>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Your Content Plan</h1>
            <p className="text-lg text-muted-foreground">
              7 days of viral-ready content inspiration
            </p>
            
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI Selected</span>
              </div>
              <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
                <Target className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">Genre Matched</span>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-end mb-6">
            <Button
              variant="outline"
              onClick={refreshAllVideos}
              className="glass-card glass-hover"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-6 md:space-y-8 bg-card/80 dark:bg-card/40 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] p-4 md:p-6 lg:p-8">
              {planDays.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ContentPlanCard
                    day={day}
                    onUpdate={(fields) => updatePlanDay(index, fields)}
                    onRefresh={(forceRandom, contentStyle) => refreshVideo(index, forceRandom, contentStyle)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <CalendarView 
              planDays={planDays}
              onRefresh={(dayIndex, forceRandom, contentStyle) => refreshVideo(dayIndex, forceRandom, contentStyle)}
            />
          )}

          <motion.div 
            className="text-center mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="glass-card p-12 rounded-3xl">
              <Save className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">Ready to Create?</h3>
              <p className="text-muted-foreground mb-6">
                Save your content plan and start creating
              </p>
              
              <Button
                size="lg"
                onClick={savePlan}
                disabled={saving}
                className="px-12 py-4 text-lg font-semibold"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-3" />
                    Save Plan
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={showNamingDialog} onOpenChange={setShowNamingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input
              id="plan-name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., Rock Content Strategy"
              onKeyDown={(e) => e.key === 'Enter' && handleSavePlan()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNamingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FooterSection />
    </div>
  );
};

export default Plan;
