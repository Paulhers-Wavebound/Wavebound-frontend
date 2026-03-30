import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderOpen, 
  MoreVertical,
  Trash2,
  Play,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkspacePlansProps {
  userId: string;
}

interface ContentPlan {
  id: string;
  name: string;
  plan: any;
  created_at: string;
  updated_at: string;
}

export function WorkspacePlans({ userId }: WorkspacePlansProps) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailMap, setThumbnailMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    loadPlans();
  }, [userId]);

  const extractVideoIds = (plans: ContentPlan[]): number[] => {
    const ids: number[] = [];
    for (const plan of plans) {
      const planData = typeof plan.plan === 'string' ? JSON.parse(plan.plan) : plan.plan;
      const videos = planData?.videos || [];
      for (const v of videos) {
        if (v.id && typeof v.id === 'number') ids.push(v.id);
      }
    }
    return [...new Set(ids)];
  };

  const fetchThumbnails = async (videoIds: number[]) => {
    if (videoIds.length === 0) return;

    const [tiktokRes, reelsRes] = await Promise.all([
      supabase
        .from('0.1. Table 4 - Assets - TikTok')
        .select('video_id, thumbnail_url')
        .in('video_id', videoIds),
      supabase
        .from('0.1. Table 4.2 - Assets - Reels')
        .select('video_id, thumbnail_url')
        .in('video_id', videoIds),
    ]);

    const map = new Map<number, string>();
    for (const row of (tiktokRes.data || [])) {
      if (row.video_id && row.thumbnail_url) map.set(row.video_id, row.thumbnail_url);
    }
    for (const row of (reelsRes.data || [])) {
      if (row.video_id && row.thumbnail_url && !map.has(row.video_id)) {
        map.set(row.video_id, row.thumbnail_url);
      }
    }
    setThumbnailMap(map);
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('content_plans')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      const loadedPlans = data || [];
      setPlans(loadedPlans);

      const videoIds = extractVideoIds(loadedPlans);
      await fetchThumbnails(videoIds);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    const { error } = await supabase
      .from('content_plans')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', planId);

    if (!error) {
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success('Plan archived');
    }
  };

  const getVideoCount = (plan: ContentPlan): number => {
    const planData = typeof plan.plan === 'string' ? JSON.parse(plan.plan) : plan.plan;
    const videos = planData?.videos || planData?.days || [];
    return Array.isArray(videos) ? videos.length : 0;
  };

  const getThumbnails = (plan: ContentPlan): (string | null)[] => {
    const planData = typeof plan.plan === 'string' ? JSON.parse(plan.plan) : plan.plan;
    const videos = planData?.videos || [];
    return videos.slice(0, 4).map((v: any) => thumbnailMap.get(v.id) || null);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border/50 px-4 py-2 flex items-center justify-between bg-muted/30">
        <span className="text-sm text-muted-foreground">
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </span>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/discover')}
            className="h-8"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {plans.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">No plans yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create content plans from the Discover page to organize your strategy
                </p>
              </div>
              <Button onClick={() => navigate('/discover')} variant="outline">
                Start Planning
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => {
                  const planData = typeof plan.plan === 'string' ? JSON.parse(plan.plan) : plan.plan;
                  if (planData?.video_id) {
                    navigate(`/analyze-video/${planData.video_id}`);
                  } else if (planData?.audio_id) {
                    navigate(`/analyze-audio/${planData.audio_id}`);
                  } else {
                    navigate(`/my-plans/${plan.id}`);
                  }
                }}
                className="group relative p-4 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md"
              >
                {/* Plan thumbnails preview */}
                <div className="flex gap-1 mb-3">
                  {getThumbnails(plan).some(url => url !== null) ? (
                    getThumbnails(plan).map((url, i) => (
                      <div key={i} className="flex-1 h-20 rounded-lg bg-muted overflow-hidden">
                        {url ? (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 h-20 rounded-lg bg-muted flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Plan info */}
                <h3 className="font-medium text-foreground mb-1 truncate">
                  {plan.name || 'Untitled Plan'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getVideoCount(plan)} videos</span>
                  <span>•</span>
                  <span>{format(new Date(plan.created_at), 'MMM d, yyyy')}</span>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Arrow indicator */}
                <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
