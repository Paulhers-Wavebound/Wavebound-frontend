import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ContentPlanPage() {
  const [planHtml, setPlanHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setError(true); setLoading(false); return; }

        const { data: profile } = await (supabase as any)
          .from('user_profiles')
          .select('artist_handle')
          .eq('user_id', session.user.id)
          .single();

        if (!profile?.artist_handle) { setError(true); setLoading(false); return; }

        const { data: intel } = await (supabase as any)
          .from('artist_intelligence')
          .select('content_plan_html')
          .eq('artist_handle', profile.artist_handle)
          .single();

        if (intel?.content_plan_html) {
          setPlanHtml(intel.content_plan_html);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  return (
    <AppLayout fullHeight>
      <div className="flex-1 flex flex-col bg-[#0A0A0A]">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <Skeleton className="w-full max-w-[600px] h-8 rounded" />
            <Skeleton className="w-full max-w-[600px] h-48 rounded" />
            <Skeleton className="w-full max-w-[600px] h-32 rounded" />
            <p className="text-sm text-muted-foreground mt-2">Loading your content plan...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              No content plan available yet. Your team is working on it.
            </p>
          </div>
        )}

        {!loading && !error && planHtml && (
          <iframe
            srcDoc={planHtml}
            className="w-full flex-1 border-none"
            sandbox="allow-scripts allow-same-origin"
            title="Content Plan"
            style={{ minHeight: 'calc(100dvh - 64px)' }}
          />
        )}
      </div>
    </AppLayout>
  );
}
