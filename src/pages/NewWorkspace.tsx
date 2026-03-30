import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import SEOHead from '@/components/SEOHead';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  FolderOpen, 
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceFavorites } from '@/components/workspace/WorkspaceFavorites';
import { WorkspacePlans } from '@/components/workspace/WorkspacePlans';

/**
 * New Workspace Page - Your Creative Studio
 * 
 * Combines all "saving" functionality into one Notion-style interface:
 * - Notes: Free-form workspace notes
 * - Favorites: Saved content from discovery
 * - Plans: Content plans and calendar
 */
export default function NewWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'favorites' | 'plans' | null;
  const activeTab = tabFromUrl || 'favorites';
  const [user, setUser] = useState<any>(null);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Only check auth when this page is actually active (not when hidden by CoreKeepAlive)
  const isActive = location.pathname.startsWith('/workspace');

  useEffect(() => {
    if (!isActive) return;
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth', { state: { from: '/workspace' } });
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate, isActive]);

  if (!user) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout fullHeight withHeaderPadding>
      <SEOHead 
        title="Workspace - Wavebound"
        description="Your creative workspace. Organize notes, saved content, and content plans in one place."
      />
      
      <div className="h-full flex flex-col">
        {/* Header with tabs */}
        <div className="border-b border-border/50 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Workspace</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Your creative studio</p>
              </div>
              <Button onClick={() => navigate('/discover')} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="h-11 bg-transparent border-0 gap-0 -mb-px">
                <TabsTrigger 
                  value="favorites"
                  className={cn(
                    "relative h-11 px-4 rounded-none border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
                    "data-[state=active]:after:bg-primary",
                    "text-muted-foreground data-[state=active]:text-foreground"
                  )}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </TabsTrigger>
                <TabsTrigger 
                  value="plans"
                  className={cn(
                    "relative h-11 px-4 rounded-none border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
                    "data-[state=active]:after:bg-primary",
                    "text-muted-foreground data-[state=active]:text-foreground"
                  )}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Plans
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'favorites' && <WorkspaceFavorites userId={user.id} />}
          {activeTab === 'plans' && <WorkspacePlans userId={user.id} />}
        </div>
      </div>
    </AppLayout>
  );
}
