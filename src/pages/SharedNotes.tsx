import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import FooterSection from '@/components/FooterSection';
import waveboundLogo from '@/assets/wavebound-logo.png';
import { SharedPlanHeader } from '@/pages/SharedPlan';

export default function SharedNotes() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [notesContent, setNotesContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSharedNotes = async () => {
      if (!shareId) return;

      try {
        const { data, error } = await supabase
          .from('shared_workspace_notes')
          .select('*')
          .eq('share_id', shareId)
          .maybeSingle();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setNotesContent(data.notes_content);
        setTitle(data.title || 'Shared Planning Notes');

        await supabase
          .from('shared_workspace_notes')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('share_id', shareId);

      } catch (err) {
        console.error('Error loading shared notes:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadSharedNotes();
  }, [shareId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading shared notes...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <SharedPlanHeader />
        <div className="flex items-center justify-center px-4 py-32">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4">Notes Not Found</h1>
            <p className="text-muted-foreground mb-6">This shared notes link is invalid or has been removed.</p>
            <Button onClick={() => navigate('/')}>Try Wavebound Free</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Branded Header */}
      <SharedPlanHeader />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Shared Notes Content */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1">Read-only view</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          <div className="p-6">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notesContent) }}
            />
          </div>
        </div>

        {/* Built with Wavebound CTA */}
        <div className="mt-10">
          <Card className="p-8 text-center border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <img src={waveboundLogo} alt="Wavebound" className="h-10 mx-auto mb-4 object-contain" />
            <h3 className="text-2xl font-bold mb-2">Built with Wavebound</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              AI-powered content planning for music artists. Discover viral trends, plan your posts, and grow your audience.
            </p>
            <Button size="lg" onClick={() => navigate('/')} className="group">
              Try Wavebound Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                10K+ viral videos analyzed
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                AI-powered plans
              </span>
            </div>
          </Card>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
