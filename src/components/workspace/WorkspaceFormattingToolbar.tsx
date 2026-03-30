import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Palette, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

interface WorkspaceFormattingToolbarProps {
  onApplyFormat: (command: string, value?: string) => void;
  onApplyHeading: (level: 'h1' | 'h2') => void;
  onApplyColor: (color: string) => void;
  onApplyFont: (fontClass: string) => void;
}

const WorkspaceFormattingToolbar = ({
  onApplyFormat,
  onApplyHeading,
  onApplyColor,
  onApplyFont,
}: WorkspaceFormattingToolbarProps) => {
  return (
    <div className="mb-4 flex items-center gap-2 pb-4 border-b border-border flex-wrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('bold')}
        className="h-8 px-2 hover:bg-muted"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('italic')}
        className="h-8 px-2 hover:bg-muted"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('underline')}
        className="h-8 px-2 hover:bg-muted"
        title="Underline"
      >
        <Underline className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyHeading('h1')}
        className="h-8 px-2 hover:bg-muted"
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyHeading('h2')}
        className="h-8 px-2 hover:bg-muted"
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('insertUnorderedList')}
        className="h-8 px-2 hover:bg-muted"
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('insertOrderedList')}
        className="h-8 px-2 hover:bg-muted"
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('justifyLeft')}
        className="h-8 px-2 hover:bg-muted"
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('justifyCenter')}
        className="h-8 px-2 hover:bg-muted"
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onApplyFormat('justifyRight')}
        className="h-8 px-2 hover:bg-muted"
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-muted"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1">
            {[
              '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e',
              '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b',
            ].map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded-sm border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => onApplyColor(color)}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-muted"
            title="Font"
          >
            <Type className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onApplyFont('font-sans')}>
            <span className="font-sans">Sans Serif</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onApplyFont('font-serif')}>
            <span className="font-serif">Serif</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onApplyFont('font-mono')}>
            <span className="font-mono">Monospace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default WorkspaceFormattingToolbar;
