import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import throttle from 'just-throttle';

interface WorkspaceNotesProps {
  userId: string;
}

export function WorkspaceNotes({ userId }: WorkspaceNotesProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      const { data } = await supabase
        .from('workspace_notes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setNotes(data.notes || '');
        setWorkspaceId(data.id);
        setLastSaved(new Date(data.updated_at));
      }
    };
    loadNotes();
  }, [userId]);

  // Auto-save
  const saveNotes = async (content: string) => {
    setSaving(true);
    try {
      if (workspaceId) {
        await supabase
          .from('workspace_notes')
          .update({ notes: content, updated_at: new Date().toISOString() })
          .eq('id', workspaceId);
      } else {
        const { data } = await supabase
          .from('workspace_notes')
          .insert({ user_id: userId, notes: content })
          .select()
          .single();
        if (data) setWorkspaceId(data.id);
      }
      setLastSaved(new Date());
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const throttledSave = throttle(saveNotes, 2000);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      throttledSave(value);
    }, 1000);
  };

  const handleCopyShareLink = async () => {
    // Note: share_id column needs to be added to workspace_notes table
    // For now, just copy the notes content
    if (!notes) return;
    
    await navigator.clipboard.writeText(notes);
    setCopied(true);
    toast.success('Notes copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border/50 px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : lastSaved ? (
            <>
              <Save className="w-3.5 h-3.5" />
              Saved {lastSaved.toLocaleTimeString()}
            </>
          ) : null}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/workspace')}
            className="h-8"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Full Editor
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyShareLink}
            disabled={!notes}
            className="h-8"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-1.5" />
            ) : (
              <Copy className="w-4 h-4 mr-1.5" />
            )}
            Copy
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <Textarea
            ref={editorRef}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Start typing your notes, ideas, and plans..."
            className="min-h-[500px] resize-none border-0 bg-transparent text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>
    </div>
  );
}
