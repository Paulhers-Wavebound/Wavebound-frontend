import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  FolderOpen, 
  FolderClosed,
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Share2,
  Heart,
  ChevronRight,
  Palette,
  Check,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteFolders } from '@/hooks/useFavoriteFolders';
import { useDroppable } from '@dnd-kit/core';
import { toast } from 'sonner';

interface FavoritesFolderSidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  favoriteCounts: { all: number; uncategorized: number; byFolder: Record<string, number> };
}

const FOLDER_COLORS = [
  { name: 'Default', value: null },
  { name: 'Red', value: 'hsl(0 84% 60%)' },
  { name: 'Orange', value: 'hsl(25 95% 53%)' },
  { name: 'Yellow', value: 'hsl(48 96% 53%)' },
  { name: 'Green', value: 'hsl(142 71% 45%)' },
  { name: 'Blue', value: 'hsl(217 91% 60%)' },
  { name: 'Purple', value: 'hsl(263 70% 50%)' },
  { name: 'Pink', value: 'hsl(330 81% 60%)' },
];

function DroppableFolder({ 
  id, 
  children 
}: { 
  id: string; 
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "transition-colors rounded-lg",
        isOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
    >
      {children}
    </div>
  );
}

export function FavoritesFolderSidebar({ 
  selectedFolderId, 
  onSelectFolder,
  favoriteCounts 
}: FavoritesFolderSidebarProps) {
  const { folders, createFolder, createFolderAsync, updateFolder, deleteFolder, isLoading } = useFavoriteFolders();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [colorPickerFolder, setColorPickerFolder] = useState<string | null>(null);
  const [shareDialogFolder, setShareDialogFolder] = useState<{ id: string; name: string } | null>(null);
  const [foldersOpen, setFoldersOpen] = useState(true);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const newFolder = await createFolderAsync(newFolderName.trim());
        onSelectFolder(newFolder.id);
      } catch {}
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleRenameFolder = () => {
    if (editingFolder && editingFolder.name.trim()) {
      updateFolder({ id: editingFolder.id, name: editingFolder.name.trim() });
      setEditingFolder(null);
    }
  };

  const handleSetColor = (folderId: string, color: string | null) => {
    updateFolder({ id: folderId, color: color || undefined });
    setColorPickerFolder(null);
  };

  const handleShareFolder = async () => {
    if (!shareDialogFolder) return;
    
    // Generate share link (placeholder - would need backend support)
    const shareUrl = `${window.location.origin}/shared/folder/${shareDialogFolder.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!', {
        description: 'Share this link to let others view your folder',
      });
    } catch {
      toast.error('Failed to copy link');
    }
    setShareDialogFolder(null);
  };

  return (
    <div className="w-56 border-r border-border/50 bg-muted/20 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">Library</h3>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {/* All Favorites */}
        <DroppableFolder id="all">
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedFolderId === null
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Heart className="w-4 h-4" />
            <span className="flex-1 text-left">All Favorites</span>
            <span className="text-xs opacity-60">{favoriteCounts.all}</span>
          </button>
        </DroppableFolder>

        {/* Folders Section */}
        <Collapsible open={foldersOpen} onOpenChange={setFoldersOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <ChevronRight className={cn("w-3 h-3 transition-transform", foldersOpen && "rotate-90")} />
              <span>Folders</span>
              <span className="ml-auto text-[10px] opacity-60">{folders.length}</span>
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-1 mt-1">
            {/* Uncategorized */}
            <DroppableFolder id="uncategorized">
              <button
                onClick={() => onSelectFolder('uncategorized')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedFolderId === 'uncategorized'
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="flex-1 text-left">Uncategorized</span>
                <span className="text-xs opacity-60">{favoriteCounts.uncategorized}</span>
              </button>
            </DroppableFolder>


            {folders.map((folder) => (
              <DroppableFolder key={folder.id} id={folder.id}>
                <div
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                    selectedFolderId === folder.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  {selectedFolderId === folder.id ? (
                    <FolderOpen 
                      className="w-4 h-4 flex-shrink-0" 
                      style={{ color: folder.color || undefined }}
                    />
                  ) : (
                    <FolderClosed 
                      className="w-4 h-4 flex-shrink-0" 
                      style={{ color: folder.color || undefined }}
                    />
                  )}
                  <span className="flex-1 truncate text-left">{folder.name}</span>
                  <span className="text-xs opacity-60">{favoriteCounts.byFolder[folder.id] || 0}</span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-background rounded transition-opacity">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setColorPickerFolder(folder.id)}>
                        <Palette className="w-4 h-4 mr-2" />
                        Change Color
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShareDialogFolder({ id: folder.id, name: folder.name })}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteFolder(folder.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DroppableFolder>
            ))}

            {/* Create New Folder */}
            {isCreating ? (
              <div className="px-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewFolderName('');
                    }
                  }}
                  onBlur={() => {
                    if (newFolderName.trim()) {
                      handleCreateFolder();
                    } else {
                      setIsCreating(false);
                    }
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Folder</span>
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={editingFolder?.name || ''}
            onChange={(e) => setEditingFolder(prev => prev ? { ...prev, name: e.target.value } : null)}
            placeholder="Folder name..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameFolder();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>Cancel</Button>
            <Button onClick={handleRenameFolder}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Picker Dialog */}
      <Dialog open={!!colorPickerFolder} onOpenChange={() => setColorPickerFolder(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Choose Color</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {FOLDER_COLORS.map((color) => {
              const folder = folders.find(f => f.id === colorPickerFolder);
              const isSelected = folder?.color === color.value || (!folder?.color && !color.value);
              
              return (
                <button
                  key={color.name}
                  onClick={() => colorPickerFolder && handleSetColor(colorPickerFolder, color.value)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                    color.value ? "" : "bg-muted border border-border",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ backgroundColor: color.value || undefined }}
                  title={color.name}
                >
                  {isSelected && (
                    <Check className={cn("w-4 h-4", color.value ? "text-white" : "text-foreground")} />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={!!shareDialogFolder} onOpenChange={() => setShareDialogFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share "{shareDialogFolder?.name}"</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Anyone with this link can view the contents of this folder.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={shareDialogFolder ? `${window.location.origin}/shared/folder/${shareDialogFolder.id}` : ''}
              className="flex-1"
            />
            <Button onClick={handleShareFolder}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
