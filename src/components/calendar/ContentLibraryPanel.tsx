import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Star, Folder, GripVertical, Play, Image as ImageIcon, Video } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

interface DraggableContentItem {
  id: string;
  title: string;
  type: "video" | "photo" | "reel";
  thumbnailUrl?: string;
  sourceId: number;
  source: "favorites" | "plan";
  projectColor?: string;
}

interface ContentPlan {
  id: string;
  name: string;
  plan: any;
  created_at: string;
  project?: {
    id: string;
    name: string;
    color: string | null;
  };
}

interface ContentLibraryPanelProps {
  draggableItems: DraggableContentItem[];
  contentPlans: ContentPlan[];
  expandedSections: string[];
  onToggleSection: (section: string) => void;
}

// Draggable content item component
const DraggableItem = ({ item }: { item: DraggableContentItem }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/80 
        cursor-grab active:cursor-grabbing hover:bg-muted/60 hover:border-border/60 
        transition-all duration-200 shadow-sm hover:shadow-md
        ${isDragging ? "opacity-50 ring-2 ring-slate-400 shadow-lg scale-105" : ""}
      `}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm" />
      ) : (
        <div 
          className="w-12 h-12 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0"
          style={item.projectColor ? { backgroundColor: `${item.projectColor}15` } : undefined}
        >
          {item.type === "video" && <Play className="w-5 h-5 text-muted-foreground" />}
          {item.type === "photo" && <ImageIcon className="w-5 h-5 text-muted-foreground" />}
          {item.type === "reel" && <Video className="w-5 h-5 text-muted-foreground" />}
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{item.title}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 bg-muted/50 rounded-md">{item.type}</span>
        </div>
      </div>
    </div>
  );
};

const ContentLibraryPanel = ({
  draggableItems,
  contentPlans,
  expandedSections,
  onToggleSection,
}: ContentLibraryPanelProps) => {
  return (
    <div className="glass-card rounded-2xl border border-border/30 overflow-hidden min-w-[280px]">
      {/* Header */}
      <div className="p-5 border-b border-border/30 bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-800/50 dark:to-transparent">
        <h3 className="font-semibold text-foreground flex items-center gap-2.5 text-base">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Folder className="w-4.5 h-4.5 text-slate-600 dark:text-slate-300" />
          </div>
          Content Library
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Drag items onto calendar dates
        </p>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-3">
          {/* Favorites Section */}
          <Collapsible
            open={expandedSections.includes("favorites")}
            onOpenChange={() => onToggleSection("favorites")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Favorites</span>
                <Badge variant="secondary" className="text-xs h-5 px-2 ml-1">
                  {draggableItems.length}
                </Badge>
              </div>
              {expandedSections.includes("favorites") ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2.5 pt-3 pl-1">
              {draggableItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No favorites yet
                </p>
              ) : (
                draggableItems.map((item) => <DraggableItem key={item.id} item={item} />)
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Content Plans Section */}
          {contentPlans.map((plan) => {
            const projectColor = plan.project?.color || "#8b5cf6";
            const planItems = plan.plan?.days?.flatMap((day: any, dayIndex: number) =>
              day.items?.map((item: any, itemIndex: number) => ({
                id: `plan-${plan.id}-${dayIndex}-${itemIndex}`,
                title: item.caption?.slice(0, 50) || item.title || "Content",
                type: item.is_photo_carousel ? "photo" : "video",
                thumbnailUrl: item.thumbnail_url || item.photo_url_1,
                sourceId: item.id,
                source: "plan" as const,
                projectColor,
              })) || []
            ) || [];

            return (
              <Collapsible
                key={plan.id}
                open={expandedSections.includes(plan.id)}
                onOpenChange={() => onToggleSection(plan.id)}
              >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${projectColor}15` }}
                    >
                      <Folder className="w-4 h-4" style={{ color: projectColor }} />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                      {plan.name}
                    </span>
                    <Badge variant="secondary" className="text-xs h-5 px-2 ml-1">
                      {planItems.length}
                    </Badge>
                  </div>
                  {expandedSections.includes(plan.id) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2.5 pt-3 pl-1">
                  {planItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No items in this plan
                    </p>
                  ) : (
                    planItems.map((item: DraggableContentItem) => (
                      <DraggableItem key={item.id} item={item} />
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContentLibraryPanel;
