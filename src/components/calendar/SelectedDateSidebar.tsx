import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Play, Image as ImageIcon, Trash2, Clock, Lightbulb } from "lucide-react";
import { format } from "date-fns";

interface CalendarItem {
  id: string;
  date: string;
  title: string;
  type: "video" | "photo" | "idea";
  description?: string;
  time?: string;
  sourceId?: number;
  thumbnailUrl?: string;
  projectColor?: string;
}

interface SelectedDateSidebarProps {
  selectedDate: Date | null;
  items: CalendarItem[];
  onAddItem: () => void;
  onDeleteItem: (id: string) => void;
}

const SelectedDateSidebar = ({
  selectedDate,
  items,
  onAddItem,
  onDeleteItem,
}: SelectedDateSidebarProps) => {
  const getItemIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "photo":
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
    }
  };

  const getItemStyles = (item: CalendarItem) => {
    if (item.projectColor) {
      return {
        backgroundColor: `${item.projectColor}10`,
        borderColor: `${item.projectColor}30`,
      };
    }
    switch (item.type) {
      case "video":
        return { backgroundColor: "rgb(59 130 246 / 0.1)", borderColor: "rgb(59 130 246 / 0.2)" };
      case "photo":
        return { backgroundColor: "rgb(168 85 247 / 0.1)", borderColor: "rgb(168 85 247 / 0.2)" };
      default:
        return { backgroundColor: "rgb(245 158 11 / 0.1)", borderColor: "rgb(245 158 11 / 0.2)" };
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-border/30 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {selectedDate ? format(selectedDate, "EEEE") : "Select a date"}
            </h3>
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "MMMM d, yyyy")}
              </p>
            )}
          </div>
          {selectedDate && (
            <Button size="sm" onClick={onAddItem} className="gap-1.5 rounded-xl">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {selectedDate ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-10"
                >
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No content scheduled
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag items here or click "Add"
                  </p>
                </motion.div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    layout
                    className="p-3 rounded-xl border group transition-all duration-200 hover:shadow-md"
                    style={getItemStyles(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getItemIcon(item.type)}
                          <span className="font-medium text-foreground text-sm truncate">
                            {item.title}
                          </span>
                        </div>
                        {item.time && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteItem(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Click on a date to view details
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border/30 bg-muted/20">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Content Types</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm bg-blue-500/30" />
            <span className="text-muted-foreground">Video</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm bg-purple-500/30" />
            <span className="text-muted-foreground">Photo</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm bg-amber-500/30" />
            <span className="text-muted-foreground">Idea</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedDateSidebar;
