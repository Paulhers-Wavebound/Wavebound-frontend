import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Folder,
  FolderPlus,
  Calendar,
  MoreVertical,
  Trash2,
  Edit3,
  Play,
  Eye,
  Heart,
  TrendingUp,
  X,
  Check,
  Sparkles,
  LayoutGrid,
  Clock,
  ArrowRight,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareButton } from "@/components/ShareButton";
import HeaderAuth from "@/components/HeaderAuth";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import WaveboundLoader from "@/components/WaveboundLoader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ContentProject {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface ContentPlan {
  id: string;
  name: string;
  plan: any;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

const PROJECT_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

const MyPlans = () => {
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ContentProject | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'project' | 'plan'; id: string; name: string } | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Cache for video thumbnails
  const [videoThumbnails, setVideoThumbnails] = useState<Record<number, string>>({});

  // Load projects and plans
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Load projects
      const { data: projectsData } = await supabase
        .from('content_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (projectsData) setProjects(projectsData);

      // Load plans
      const { data: plansData } = await supabase
        .from('content_plans')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (plansData) {
        setPlans(plansData as ContentPlan[]);
        
        // Extract all video IDs that need thumbnails
        const videoIds = new Set<number>();
        plansData.forEach((plan: any) => {
          const days = plan.plan?.days || plan.plan?.videos || [];
          if (Array.isArray(days)) {
            days.forEach((day: any) => {
              const id = day.video_id || day.id;
              if (id && !day.gif_url && !day.video?.gif_url) {
                videoIds.add(Number(id));
              }
            });
          }
        });

        // Fetch thumbnails for these video IDs
        if (videoIds.size > 0) {
          const idsArray = Array.from(videoIds);
          const { data: thumbnailData } = await supabase
            .from('0.1. Table 4 - Assets - TikTok')
            .select('video_id, thumbnail_url')
            .in('video_id', idsArray);

          if (thumbnailData) {
            const thumbnailMap: Record<number, string> = {};
            thumbnailData.forEach((t: any) => {
              if (t.video_id && t.thumbnail_url) {
                thumbnailMap[t.video_id] = t.thumbnail_url;
              }
            });
            setVideoThumbnails(thumbnailMap);
          }
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Filter plans by selected project
  const filteredPlans = selectedProjectId === null
    ? plans
    : selectedProjectId === 'uncategorized'
      ? plans.filter(p => !p.project_id)
      : selectedProjectId === 'favorites'
        ? plans.filter(p => p.is_favorite)
        : plans.filter(p => p.project_id === selectedProjectId);

  // Create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('content_projects')
      .insert({
        user_id: user.id,
        name: newProjectName.trim(),
        color: newProjectColor,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating project", variant: "destructive" });
      return;
    }

    if (data) {
      setProjects([...projects, data]);
      setIsNewProjectDialogOpen(false);
      setNewProjectName("");
      toast({ title: "Project created", description: newProjectName });
    }
  };

  // Update project
  const handleUpdateProject = async () => {
    if (!editingProject || !newProjectName.trim()) return;

    const { error } = await supabase
      .from('content_projects')
      .update({ name: newProjectName.trim(), color: newProjectColor })
      .eq('id', editingProject.id);

    if (error) {
      toast({ title: "Error updating project", variant: "destructive" });
      return;
    }

    setProjects(projects.map(p => 
      p.id === editingProject.id 
        ? { ...p, name: newProjectName.trim(), color: newProjectColor }
        : p
    ));
    setIsEditProjectDialogOpen(false);
    setEditingProject(null);
    toast({ title: "Project updated" });
  };

  // Delete project or plan
  const handleDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'project') {
      // First, unassign plans from this project
      await supabase
        .from('content_plans')
        .update({ project_id: null })
        .eq('project_id', itemToDelete.id);

      const { error } = await supabase
        .from('content_projects')
        .delete()
        .eq('id', itemToDelete.id);

      if (!error) {
        setProjects(projects.filter(p => p.id !== itemToDelete.id));
        if (selectedProjectId === itemToDelete.id) {
          setSelectedProjectId(null);
        }
        toast({ title: "Project deleted" });
      }
    } else {
      const { error } = await supabase
        .from('content_plans')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', itemToDelete.id);

      if (!error) {
        setPlans(plans.filter(p => p.id !== itemToDelete.id));
        toast({ title: "Plan archived" });
      }
    }

    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  // Move plan to project
  const handleMovePlan = async (planId: string, projectId: string | null) => {
    const { error } = await supabase
      .from('content_plans')
      .update({ project_id: projectId })
      .eq('id', planId);

    if (!error) {
      setPlans(plans.map(p => p.id === planId ? { ...p, project_id: projectId } : p));
      toast({ title: "Plan moved" });
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (planId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('content_plans')
      .update({ is_favorite: !currentValue })
      .eq('id', planId);

    if (!error) {
      setPlans(plans.map(p => p.id === planId ? { ...p, is_favorite: !currentValue } : p));
      toast({ 
        title: !currentValue ? "Added to favorites" : "Removed from favorites",
        description: !currentValue ? "Plan starred!" : undefined
      });
    }
  };

  // Delete all filtered plans
  const handleDeleteAllPlans = async () => {
    const idsToDelete = filteredPlans.map(p => p.id);
    if (idsToDelete.length === 0) return;

    const { error } = await supabase
      .from('content_plans')
      .delete()
      .in('id', idsToDelete);

    if (!error) {
      setPlans(plans.filter(p => !idsToDelete.includes(p.id)));
      toast({ title: `Deleted ${idsToDelete.length} plans` });
      setDeleteAllConfirmOpen(false);
    } else {
      toast({ title: "Error deleting plans", variant: "destructive" });
    }
  };

  // Calculate plan stats
  const getPlanStats = (plan: ContentPlan) => {
    const days = plan.plan?.days || plan.plan || [];
    const videos = Array.isArray(days) ? days : [];
    
    let totalViews = 0;
    let totalLikes = 0;
    let avgViralScore = 0;
    let videoCount = 0;

    videos.forEach((day: any) => {
      if (day.video) {
        totalViews += day.video.video_views || 0;
        totalLikes += day.video.video_likes || 0;
        avgViralScore += day.video.outliar_score || 0;
        videoCount++;
      }
    });

    return {
      videoCount,
      totalViews,
      totalLikes,
      avgViralScore: videoCount > 0 ? Math.round(avgViralScore / videoCount) : 0,
    };
  };

  // Get thumbnails from plan (with fallback to fetched thumbnails)
  const getPlanThumbnails = (plan: ContentPlan): string[] => {
    const days = plan.plan?.days || plan.plan?.videos || [];
    const videos = Array.isArray(days) ? days : [];
    
    const thumbnails: string[] = [];
    
    videos.forEach((day: any) => {
      // Check multiple possible sources for the thumbnail
      const thumbnail = day.gif_url || 
                       day.video?.gif_url || 
                       day.video?.thumbnail_url ||
                       day.thumbnail_url;
      
      if (thumbnail) {
        thumbnails.push(thumbnail);
      } else {
        // Fallback to fetched thumbnails from database
        const videoId = day.video_id || day.id;
        if (videoId && videoThumbnails[videoId]) {
          thumbnails.push(videoThumbnails[videoId]);
        }
      }
    });
    
    return thumbnails.slice(0, 4);
  };

  // Get video count from plan
  const getVideoCount = (plan: ContentPlan): number => {
    const days = plan.plan?.days || plan.plan?.videos || [];
    return Array.isArray(days) ? days.length : 0;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <>
      <SEOHead 
        title="My Plans - Wavebound"
        description="Organize your content plans by project. Schedule and manage your social media strategy."
      />
      <HeaderAuth variant="light" />
      <div className="min-h-screen bg-background">
        {/* Compact Header - matching Workspace style */}
        <section className="border-b border-border bg-card/50 pt-24 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Your <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Plans</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  Organize by project or song. Schedule posts to your calendar.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => navigate('/plan')} 
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Plan
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <main className="py-6 px-4 md:px-8 max-w-7xl mx-auto bg-muted/30 dark:bg-muted/10 rounded-2xl mt-2">

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Projects Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/40 sticky top-24 overflow-hidden shadow-xl shadow-black/5">
              <div className="p-4 border-b border-border/30 flex items-center justify-between bg-muted/30">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" />
                  Projects
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setNewProjectName("");
                    setNewProjectColor(PROJECT_COLORS[0]);
                    setIsNewProjectDialogOpen(true);
                  }}
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="h-[450px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="p-3 space-y-1">
                  {/* All Plans */}
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                      ${selectedProjectId === null 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'hover:bg-muted/70 text-foreground'}
                    `}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm font-medium flex-1">All Plans</span>
                    <Badge 
                      variant={selectedProjectId === null ? "secondary" : "outline"} 
                      className={`text-xs ${selectedProjectId === null ? 'bg-white/20 text-white border-0' : ''}`}
                    >
                      {plans.length}
                    </Badge>
                  </button>

                  {/* Favorites */}
                  <button
                    onClick={() => setSelectedProjectId('favorites')}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                      ${selectedProjectId === 'favorites' 
                        ? 'bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-500/25' 
                        : 'hover:bg-muted/70 text-foreground'}
                    `}
                  >
                    <Star className={`w-4 h-4 ${selectedProjectId === 'favorites' ? '' : 'text-yellow-500'}`} />
                    <span className="text-sm font-medium flex-1">Favorites</span>
                    <Badge 
                      variant={selectedProjectId === 'favorites' ? "secondary" : "outline"} 
                      className={`text-xs ${selectedProjectId === 'favorites' ? 'bg-yellow-950/20 text-yellow-950 border-0' : ''}`}
                    >
                      {plans.filter(p => p.is_favorite).length}
                    </Badge>
                  </button>

                  {/* Uncategorized */}
                  <button
                    onClick={() => setSelectedProjectId('uncategorized')}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                      ${selectedProjectId === 'uncategorized' 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'hover:bg-muted/70 text-foreground'}
                    `}
                  >
                    <Folder className="w-4 h-4 opacity-60" />
                    <span className="text-sm font-medium flex-1">Uncategorized</span>
                    <Badge 
                      variant={selectedProjectId === 'uncategorized' ? "secondary" : "outline"} 
                      className={`text-xs ${selectedProjectId === 'uncategorized' ? 'bg-white/20 text-white border-0' : ''}`}
                    >
                      {plans.filter(p => !p.project_id).length}
                    </Badge>
                  </button>

                  {projects.length > 0 && (
                    <div className="pt-3 pb-2">
                      <span className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Your Projects
                      </span>
                    </div>
                  )}

                  {/* Project List */}
                  {projects.map(project => (
                    <div
                      key={project.id}
                      className={`
                        group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                        ${selectedProjectId === project.id 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                          : 'hover:bg-muted/70'}
                      `}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/30"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className={`text-sm font-medium flex-1 truncate ${
                        selectedProjectId === project.id ? 'text-primary-foreground' : 'text-foreground'
                      }`}>
                        {project.name}
                      </span>
                      <Badge 
                        variant={selectedProjectId === project.id ? "secondary" : "outline"} 
                        className={`text-xs ${selectedProjectId === project.id ? 'bg-white/20 text-white border-0' : ''}`}
                      >
                        {plans.filter(p => p.project_id === project.id).length}
                      </Badge>
                      
                      <div
                        className="pointer-events-auto"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                                selectedProjectId === project.id ? 'hover:bg-white/20' : 'hover:bg-muted'
                              }`}
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingProject(project);
                              setNewProjectName(project.name);
                              setNewProjectColor(project.color);
                              setIsEditProjectDialogOpen(true);
                            }}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setItemToDelete({ type: 'project', id: project.id, name: project.name });
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="lg:col-span-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {selectedProjectId === null 
                    ? 'All Plans' 
                    : selectedProjectId === 'uncategorized'
                      ? 'Uncategorized'
                      : selectedProjectId === 'favorites'
                        ? 'Favorites'
                        : projects.find(p => p.id === selectedProjectId)?.name || 'Plans'}
                  {selectedProjectId === 'favorites' && (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  )}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} • Click to view details
                </p>
              </div>
              {filteredPlans.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  onClick={() => setDeleteAllConfirmOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete All
                </Button>
              )}
            </motion.div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[4/3] bg-muted/40 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredPlans.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl border-2 border-dashed border-border/50"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No plans yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create your first content plan to start building your content strategy
                </p>
                <Button onClick={() => navigate('/plan')} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Plan
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredPlans.map((plan, index) => {
                    const stats = getPlanStats(plan);
                    const thumbnails = getPlanThumbnails(plan);
                    const videoCount = getVideoCount(plan);
                    const projectColor = plan.project_id 
                      ? projects.find(p => p.id === plan.project_id)?.color 
                      : undefined;
                    
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="group bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 cursor-pointer"
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
                      >
                        {/* Thumbnail Grid - Improved layout */}
                        <div className="aspect-[16/10] bg-muted/20 relative overflow-hidden">
                          {thumbnails.length > 0 ? (
                            <div className={`grid h-full gap-[1px] ${
                              thumbnails.length === 1 ? 'grid-cols-1' :
                              thumbnails.length === 2 ? 'grid-cols-2' :
                              thumbnails.length === 3 ? 'grid-cols-3' : 'grid-cols-2 grid-rows-2'
                            }`}>
                              {thumbnails.map((url, i) => (
                                <div key={i} className="relative overflow-hidden bg-muted">
                                  <img 
                                    src={url} 
                                    alt="" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30">
                              <div className="text-center space-y-2">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                                  <Calendar className="w-6 h-6 text-primary/50" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">{videoCount} day plan</p>
                                  <p className="text-xs text-muted-foreground/60">Thumbnails loading...</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Hover Overlay with Stats */}
                          {stats.totalViews > 0 && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-white text-sm">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    {formatNumber(stats.totalViews)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5" />
                                    {formatNumber(stats.totalLikes)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Video Count Badge */}
                          <Badge className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white border-0 text-xs font-medium">
                            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                          </Badge>
                          
                          {/* Project Color Indicator */}
                          {projectColor && (
                            <div 
                              className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full shadow-md ring-2 ring-white/40"
                              style={{ backgroundColor: projectColor }}
                            />
                          )}
                        </div>

                        {/* Plan Info - Cleaner layout */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                  {plan.name}
                                </h3>
                                {plan.is_favorite && (
                                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {format(new Date(plan.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div
                              className="pointer-events-auto flex-shrink-0 flex items-center gap-1"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Favorite Button */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-7 w-7 ${plan.is_favorite ? 'text-yellow-500 hover:text-yellow-600' : 'hover:text-yellow-500 hover:bg-yellow-500/10'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(plan.id, plan.is_favorite);
                                }}
                              >
                                <Star className={`w-4 h-4 ${plan.is_favorite ? 'fill-current' : ''}`} />
                              </Button>
                              
                              {/* Delete Button */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete({ type: 'plan', id: plan.id, name: plan.name });
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>

                              {/* Share Button */}
                              <ShareButton 
                                url={`${window.location.origin}/my-plans/${plan.id}`}
                                title={plan.name}
                                description={`Content plan with ${getVideoCount(plan)} videos`}
                                attribution="via @WaveboundHQ"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              />
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted -mr-1">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuSeparator />
                                  {projects.length > 0 && (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                        Move to project
                                      </div>
                                      {projects.map(project => (
                                        <DropdownMenuItem 
                                          key={project.id}
                                          onClick={() => handleMovePlan(plan.id, project.id)}
                                        >
                                          <div 
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: project.color }}
                                          />
                                          {project.name}
                                          {plan.project_id === project.id && (
                                            <Check className="w-4 h-4 ml-auto text-primary" />
                                          )}
                                        </DropdownMenuItem>
                                      ))}
                                      {plan.project_id && (
                                        <DropdownMenuItem onClick={() => handleMovePlan(plan.id, null)}>
                                          <X className="w-4 h-4 mr-2" />
                                          Remove from project
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setItemToDelete({ type: 'plan', id: plan.id, name: plan.name });
                                      setDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" />
              Create New Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Project Name</label>
              <Input
                placeholder="e.g., Summer Single, Album Launch"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewProjectColor(color)}
                    className={`w-9 h-9 rounded-full transition-all duration-200 ${
                      newProjectColor === color 
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' 
                        : 'hover:scale-110 hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-border'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Project Name</label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewProjectColor(color)}
                    className={`w-9 h-9 rounded-full transition-all duration-200 ${
                      newProjectColor === color 
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' 
                        : 'hover:scale-110 hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-border'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} disabled={!newProjectName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToDelete?.type === 'project' ? 'Delete Project?' : 'Archive Plan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'project'
                ? `This will delete "${itemToDelete.name}" and move all its plans to Uncategorized.`
                : `"${itemToDelete?.name}" will be archived and can be restored within 7 days.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {itemToDelete?.type === 'project' ? 'Delete' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Plans?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} 
              {selectedProjectId === 'favorites' ? ' from your favorites' : selectedProjectId === 'uncategorized' ? ' from uncategorized' : selectedProjectId ? ` from this project` : ''}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllPlans} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FooterSection />
      </div>
    </>
  );
};

export default MyPlans;
