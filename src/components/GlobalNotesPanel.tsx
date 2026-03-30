import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { StickyNote } from 'lucide-react';
import { WorkspaceNotesEditor } from '@/components/WorkspaceNotesEditor';

export const GlobalNotesPanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          title="Open Notes"
        >
          <StickyNote className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Workspace Notes
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <WorkspaceNotesEditor compact autoFocus />
        </div>
      </SheetContent>
    </Sheet>
  );
};
