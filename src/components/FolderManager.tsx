import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Folder, Plus, Trash2, Edit } from 'lucide-react';
import { useFavoriteFolders } from '@/hooks/useFavoriteFolders';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { useDroppable } from '@dnd-kit/core';

interface FolderManagerProps {
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  favoritesByFolder: Record<string, number>;
  onDropToFolder: (folderId: string | null) => void;
}

const DroppableFolder = ({ 
  folderId, 
  isSelected, 
  onClick, 
  children 
}: { 
  folderId: string | null; 
  isSelected: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: folderId || 'all-favorites',
  });

  return (
    <Card
      ref={setNodeRef}
      onClick={onClick}
      className={`p-3 cursor-pointer transition-all ${
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
      } ${isOver ? 'bg-primary/10 border-primary' : ''}`}
    >
      {children}
    </Card>
  );
};

const FolderManager = ({ selectedFolder, onSelectFolder, favoritesByFolder, onDropToFolder }: FolderManagerProps) => {
  const { folders, createFolder, updateFolder, deleteFolder } = useFavoriteFolders();
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsDialogOpen(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (editName.trim()) {
      updateFolder({ id, name: editName.trim() });
      setEditingId(null);
      setEditName('');
    }
  };

  const allCount = favoritesByFolder['all'] || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Folders</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 px-2">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1">
        {/* All Favorites */}
        <DroppableFolder
          folderId={null}
          isSelected={selectedFolder === null}
          onClick={() => onSelectFolder(null)}
        >
          <Button
            variant={selectedFolder === null ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
          >
            <Folder className="w-4 h-4" />
            <span className="flex-1 text-left">All Favorites</span>
            <Badge variant="secondary" className="text-xs">
              {allCount}
            </Badge>
          </Button>
        </DroppableFolder>

        {/* Custom Folders */}
        {folders.map((folder) => (
          <DroppableFolder
            key={folder.id}
            folderId={folder.id}
            isSelected={selectedFolder === folder.id}
            onClick={() => onSelectFolder(folder.id)}
          >
            <div className="group relative">
              {editingId === folder.id ? (
                <div className="flex gap-1 p-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(folder.id)}
                    onBlur={() => handleUpdate(folder.id)}
                    className="h-8"
                    autoFocus
                  />
                </div>
              ) : (
                <Button
                  variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  <Folder className="w-4 h-4" style={{ color: folder.color || '#8b5cf6' }} />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {favoritesByFolder[folder.id] || 0}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(folder.id);
                        setEditName(folder.name);
                      }}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this folder? Items will not be deleted.')) {
                          deleteFolder(folder.id);
                        }
                      }}
                      className="p-1 hover:bg-destructive/20 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </Button>
              )}
            </div>
          </DroppableFolder>
        ))}
      </div>
    </div>
  );
};

export default FolderManager;