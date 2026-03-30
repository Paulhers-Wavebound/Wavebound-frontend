import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Play, 
  Image as ImageIcon,
  GripVertical,
  Lightbulb
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import HeaderAuth from "@/components/HeaderAuth";
import FooterSection from "@/components/FooterSection";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarDayCell from "@/components/calendar/CalendarDayCell";
import ContentLibraryPanel from "@/components/calendar/ContentLibraryPanel";
import SelectedDateSidebar from "@/components/calendar/SelectedDateSidebar";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { useCalendarItems, CalendarItem } from "@/hooks/useCalendarItems";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

// CalendarItem type is now imported from useCalendarItems hook

interface ContentPlan {
  id: string;
  name: string;
  plan: any;
  created_at: string;
  project_id?: string;
}

interface DraggableContentItem {
  id: string;
  title: string;
  type: "video" | "photo" | "reel";
  thumbnailUrl?: string;
  sourceId: number;
  source: "favorites" | "plan";
  projectColor?: string;
}

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [newItem, setNewItem] = useState<Partial<CalendarItem>>({
    type: "video",
    title: "",
    description: "",
    time: "12:00",
  });
  
  // Content sources
  const [contentPlans, setContentPlans] = useState<ContentPlan[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<any[]>([]);
  const [favoritePhotos, setFavoritePhotos] = useState<any[]>([]);
  const [favoriteReels, setFavoriteReels] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(["favorites"]);
  const [activeDragItem, setActiveDragItem] = useState<DraggableContentItem | null>(null);
  
  const { toast } = useToast();
  const { favoriteVideoIds, favoritePhotoIds, favoriteReelIds } = useFavorites();
  
  // Use Supabase-backed calendar items hook
  const { 
    items, 
    addItem, 
    deleteItem, 
    getItemsForDate,
  } = useCalendarItems();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Note: localStorage code removed - now using Supabase via useCalendarItems hook

  // Load content plans and projects
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [plansResult, projectsResult] = await Promise.all([
        supabase
          .from('content_plans')
          .select('*')
          .eq('user_id', user.id)
          .is('archived_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('content_projects')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (plansResult.data) setContentPlans(plansResult.data);
      if (projectsResult.data) setProjects(projectsResult.data);
    };
    loadData();
  }, []);

  // Load favorite videos
  useEffect(() => {
    const loadFavorites = async () => {
      if (favoriteVideoIds.length > 0) {
        const { data } = await supabase
          .from('tiktok_videos_all')
          .select('id, caption, embedded_ulr')
          .in('id', favoriteVideoIds);
        if (data) setFavoriteVideos(data);
      }
      
      if (favoritePhotoIds.length > 0) {
        const { data } = await supabase
          .from('tiktok_photo_carousel')
          .select('id, caption, photo_url_1')
          .in('id', favoritePhotoIds);
        if (data) setFavoritePhotos(data);
      }

      if (favoriteReelIds.length > 0) {
        const { data } = await supabase
          .from('reels_all')
          .select('id, caption, embedded_url')
          .in('id', favoriteReelIds);
        if (data) setFavoriteReels(data);
      }
    };
    loadFavorites();
  }, [favoriteVideoIds, favoritePhotoIds, favoriteReelIds]);

  const prevPeriod = () => {
    if (viewMode === "week") {
      setCurrentMonth(subWeeks(currentMonth, 1));
    } else {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === "week") {
      setCurrentMonth(addWeeks(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setNewItem(prev => ({ ...prev, date: format(day, "yyyy-MM-dd") }));
  };

  const handleQuickAdd = (day: Date) => {
    setSelectedDate(day);
    setNewItem(prev => ({ ...prev, date: format(day, "yyyy-MM-dd") }));
    setIsAddDialogOpen(true);
  };

  const handleAddItem = async () => {
    if (!newItem.title || !selectedDate) return;
    
    const item = {
      date: format(selectedDate, "yyyy-MM-dd"),
      title: newItem.title,
      type: newItem.type as "video" | "photo" | "idea",
      description: newItem.description,
      time: newItem.time,
    };
    
    const result = await addItem(item);
    if (result) {
      setIsAddDialogOpen(false);
      setNewItem({ type: "video", title: "", description: "", time: "12:00" });
      
      toast({
        title: "Added to calendar",
        description: `${item.title} scheduled for ${format(selectedDate, "MMM d")}`,
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    const success = await deleteItem(id);
    if (success) {
      toast({ title: "Removed from calendar" });
    }
  };

  // getItemsForDate is now provided by the hook

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current as DraggableContentItem);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const dragItem = active.data.current as DraggableContentItem;
    const dropDate = over.id as string;

    const newCalendarItem = {
      date: dropDate,
      title: dragItem.title,
      type: (dragItem.type === "reel" ? "video" : dragItem.type) as "video" | "photo" | "idea",
      sourceId: dragItem.sourceId,
      thumbnailUrl: dragItem.thumbnailUrl,
      projectColor: dragItem.projectColor,
      time: "12:00",
    };

    const result = await addItem(newCalendarItem);
    if (result) {
      toast({
        title: "Added to calendar",
        description: `Scheduled for ${format(new Date(dropDate), "MMM d")}`,
      });
    }
  };

  // Build draggable items list
  const draggableItems: DraggableContentItem[] = [
    ...favoriteVideos.map(v => ({
      id: `fav-video-${v.id}`,
      title: v.caption?.slice(0, 50) || "TikTok Video",
      type: "video" as const,
      sourceId: v.id,
      source: "favorites" as const,
    })),
    ...favoritePhotos.map(p => ({
      id: `fav-photo-${p.id}`,
      title: p.caption?.slice(0, 50) || "Photo Carousel",
      type: "photo" as const,
      thumbnailUrl: p.photo_url_1,
      sourceId: p.id,
      source: "favorites" as const,
    })),
    ...favoriteReels.map(r => ({
      id: `fav-reel-${r.id}`,
      title: r.caption?.slice(0, 50) || "Instagram Reel",
      type: "reel" as const,
      sourceId: r.id,
      source: "favorites" as const,
    })),
  ];

  // Prepare content plans with project info
  const plansWithProjects = contentPlans.map(plan => ({
    ...plan,
    project: plan.project_id ? projects.find(p => p.id === plan.project_id) : undefined,
  }));

  const renderCalendarDays = () => {
    let startDate: Date;
    let endDate: Date;

    if (viewMode === "week") {
      startDate = startOfWeek(currentMonth);
      endDate = endOfWeek(currentMonth);
    } else {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(monthStart);
      startDate = startOfWeek(monthStart);
      endDate = endOfWeek(monthEnd);
    }

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;
      const dayItems = getItemsForDate(currentDay);
      const isCurrentMonth = isSameMonth(currentDay, currentMonth);
      const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
      const isTodayDate = isToday(currentDay);

      days.push(
        <CalendarDayCell
          key={currentDay.toString()}
          day={currentDay}
          isCurrentMonth={viewMode === "week" ? true : isCurrentMonth}
          isSelected={!!isSelected}
          isTodayDate={isTodayDate}
          dayItems={dayItems}
          isWeekView={viewMode === "week"}
          onClick={() => handleDateClick(currentDay)}
          onQuickAdd={() => handleQuickAdd(currentDay)}
        />
      );
      day = addDays(day, 1);
    }

    return days;
  };

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : [];

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Content Calendar - Wavebound"
          description="Plan and schedule your content with a drag-and-drop calendar. Organize posts by date and time."
        />
        <HeaderAuth variant="light" />
        
        <main className="pt-24 pb-16 px-4 md:px-8 max-w-[1800px] mx-auto">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <CalendarHeader
              currentMonth={currentMonth}
              viewMode={viewMode}
              onPrevMonth={prevPeriod}
              onNextMonth={nextPeriod}
              onViewModeChange={setViewMode}
              onToday={goToToday}
            />
          </motion.div>

          {/* Main grid - all three columns aligned at top */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Content Library Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3 xl:col-span-3 order-2 lg:order-1 lg:mt-11"
            >
              <div className="sticky top-24">
                <ContentLibraryPanel
                  draggableItems={draggableItems}
                  contentPlans={plansWithProjects}
                  expandedSections={expandedSections}
                  onToggleSection={toggleSection}
                />
              </div>
            </motion.div>

            {/* Calendar Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-6 xl:col-span-6 order-1 lg:order-2"
            >
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className={`grid grid-cols-7 gap-2 ${viewMode === "week" ? "" : ""}`}>
                {renderCalendarDays()}
              </div>
            </motion.div>

            {/* Selected Date Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-3 xl:col-span-3 order-3 lg:mt-11"
            >
              <div className="sticky top-24">
                <SelectedDateSidebar
                  selectedDate={selectedDate}
                  items={selectedDateItems}
                  onAddItem={() => setIsAddDialogOpen(true)}
                  onDeleteItem={handleDeleteItem}
                />
              </div>
            </motion.div>
          </div>
        </main>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-primary bg-background shadow-2xl">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              {activeDragItem.thumbnailUrl ? (
                <img src={activeDragItem.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Play className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                {activeDragItem.title}
              </span>
            </div>
          )}
        </DragOverlay>

        {/* Add Item Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Add content for {selectedDate && format(selectedDate, "MMMM d")}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select 
                  value={newItem.type} 
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <span className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-blue-500" /> Video
                      </span>
                    </SelectItem>
                    <SelectItem value="photo">
                      <span className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-500" /> Photo Carousel
                      </span>
                    </SelectItem>
                    <SelectItem value="idea">
                      <span className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" /> Idea / Note
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="e.g., Kitchen performance video"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time (optional)</label>
                <Input 
                  type="time"
                  value={newItem.time}
                  onChange={(e) => setNewItem(prev => ({ ...prev, time: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea 
                  placeholder="Any additional details..."
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={!newItem.title} className="rounded-xl">
                <Plus className="w-4 h-4 mr-1.5" />
                Add to Calendar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <FooterSection />
      </div>
    </DndContext>
  );
};

export default Calendar;
