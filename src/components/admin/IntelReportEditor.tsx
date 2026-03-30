import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  html: string | null;
  artistHandle: string;
  onSaved: () => void;
}

export default function IntelReportEditor({ html, artistHandle, onSaved }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [originalHtml, setOriginalHtml] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const writeToIframe = useCallback((content: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(content);
    doc.close();
    doc.designMode = 'on';
    doc.body.addEventListener('input', () => setHasUnsavedChanges(true));
  }, []);

  useEffect(() => {
    setOriginalHtml(html || '');
    setHasUnsavedChanges(false);
  }, [html]);

  useEffect(() => {
    if (originalHtml) {
      // Small delay to ensure iframe is mounted
      const t = setTimeout(() => writeToIframe(originalHtml), 50);
      return () => clearTimeout(t);
    }
  }, [originalHtml, artistHandle, writeToIframe]);

  if (!html) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No intel report generated yet
      </div>
    );
  }

  const handleSave = async () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setSaving(true);
    try {
      const newHtml = '<!DOCTYPE html><html>' + doc.documentElement.innerHTML + '</html>';
      const { error } = await (supabase.from as any)('artist_intelligence')
        .update({ intelligence_report_html: newHtml })
        .eq('artist_handle', artistHandle);
      if (error) throw error;
      setOriginalHtml(newHtml);
      setHasUnsavedChanges(false);
      toast.success('Intel report saved — changes are live');
      onSaved();
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    writeToIframe(originalHtml);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          key={artistHandle}
          style={{
            width: '100%',
            height: 'calc(100vh - 160px)',
            border: 'none',
            borderRadius: '8px',
            background: '#fff',
          }}
        />
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Changes go live immediately when saved</span>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button variant="ghost" size="sm" onClick={handleDiscard}>
              Discard Changes
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Save Report
          </Button>
        </div>
      </div>
    </div>
  );
}
