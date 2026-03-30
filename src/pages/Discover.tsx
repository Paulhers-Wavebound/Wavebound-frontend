import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import SEOHead from '@/components/SEOHead';
import { Sparkles, ChevronRight, Sparkle, ArrowUp } from 'lucide-react';
import { DiscoverLibrary } from '@/components/discover/DiscoverLibrary';
import { cn } from '@/lib/utils';
import { useDiscover } from '@/contexts/DiscoverContext';
import { useAISidebar } from '@/contexts/AISidebarContext';
import { Video } from '@/types/content';
import DiscoverOnboardingModal, { hasCompletedOnboarding, checkAndHydrateFromDB } from '@/components/discover/DiscoverOnboardingModal';
import { supabase } from '@/integrations/supabase/client';

/**
 * Discover Page - The core of Wavebound
 * 
 * Browse Library is the main view.
 * "Ask AI" tab opens the global AI sidebar (same as other pages).
 */
function DiscoverContent({ userId }: { userId?: string }) {
  const {
    isAIPanelOpen,
    setAIPanelOpen,
    sendVideoToAI,
    isDraggingToAI,
    setIsDraggingToAI,
  } = useDiscover();

  const { openSidebar, closeSidebar, isOpen: isSidebarOpen } = useAISidebar();

  // Auto-open AI sidebar when Discover page loads (desktop only)
  useEffect(() => {
    if (window.innerWidth >= 768 && window.location.pathname.startsWith('/discover')) {
      openSidebar();
      setAIPanelOpen(true);
    }
  }, []);

  // Sync the "Ask AI" tab state with the global sidebar
  useEffect(() => {
    if (isAIPanelOpen && !isSidebarOpen) {
      openSidebar();
    }
  }, [isAIPanelOpen, isSidebarOpen, openSidebar]);

  // When global sidebar closes, update local state
  useEffect(() => {
    if (!isSidebarOpen && isAIPanelOpen) {
      setAIPanelOpen(false);
    }
  }, [isSidebarOpen, isAIPanelOpen, setAIPanelOpen]);

  const handleOpenAI = () => {
    setAIPanelOpen(true);
    openSidebar();
  };

  const handleCloseAI = () => {
    setAIPanelOpen(false);
    closeSidebar();
  };

  return (
    <AppLayout fullHeight withHeaderPadding>
      <SEOHead 
        title="Discover - Wavebound"
        description="Find viral content ideas for your music. Chat with AI or browse our curated library of what's working on TikTok and Reels."
      />

      <div className="h-full flex flex-col">
        {/* Tab-style Header */}
        <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              {/* Simple Tab Toggle */}
              <div className="flex items-center">
                <button
                  onClick={handleCloseAI}
                  className={cn(
                    "relative px-6 py-4 text-base font-medium transition-colors",
                    !isAIPanelOpen 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Discover
                  {!isAIPanelOpen && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                  )}
                </button>
                <button
                  onClick={handleOpenAI}
                  className={cn(
                    "relative px-6 py-4 text-base font-medium transition-colors flex items-center gap-2",
                    isAIPanelOpen 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative">
                    <Sparkle 
                      className={cn(
                        "w-4 h-4 text-primary transition-all duration-300",
                        isAIPanelOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                      )}
                      style={{
                        filter: 'drop-shadow(0 0 3px hsl(var(--primary) / 0.5))',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    />
                  </span>
                  Ask AI
                  {isAIPanelOpen && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Bottom border spans full width */}
          <div className="border-b border-border/8" />
        </div>

        {/* Content Area - Full width library */}
        <div className="flex-1 overflow-hidden">
          <DiscoverLibrary userId={userId} />
        </div>

        {/* Floating Toggle Button - hidden when AI sidebar is open, hidden on mobile */}
        {!isSidebarOpen && (
          <button
            onClick={handleOpenAI}
            className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 group items-center gap-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground pl-4 pr-3 py-3"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">Ask AI</span>
            <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Mobile floating Ask AI button */}
        {!isSidebarOpen && (
          <button
            onClick={handleOpenAI}
            className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-all"
            aria-label="Ask AI"
          >
            <Sparkles className="w-6 h-6" />
          </button>
        )}

        <BackToTopButton />
      </div>
    </AppLayout>
  );
}

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.querySelector('[data-discover-scroll]') as HTMLElement;
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > 400);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);



  return (
    <div
      onClick={() => {
        const el = document.querySelector('[data-discover-scroll]');
        el?.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="fixed top-20 right-4 z-50 cursor-pointer text-muted-foreground/60 hover:text-foreground transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <ArrowUp className="w-4 h-4" />
    </div>
  );
}

// DiscoverProvider is now at App level for global AI sidebar access
export default function Discover() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        // Not authenticated — redirect to auth with return path
        navigate('/auth', { state: { from: '/discover' }, replace: true });
        return;
      }
      setUserId(uid);
      const completed = hasCompletedOnboarding(uid) || await checkAndHydrateFromDB(uid);
      setShowOnboarding(!completed);
      setAuthChecked(true);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id;
      if (!uid) {
        navigate('/auth', { state: { from: '/discover' }, replace: true });
        return;
      }
      setUserId(uid);
      const completed = hasCompletedOnboarding(uid) || await checkAndHydrateFromDB(uid);
      setShowOnboarding(!completed);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Wait for auth check before rendering
  if (!authChecked || showOnboarding === null) return null;

  if (showOnboarding) {
    return <DiscoverOnboardingModal userId={userId} onComplete={() => {
      // Use React Router navigate to clear stale URL params so fresh onboarding prefs take priority
      navigate('/discover', { replace: true });
      setShowOnboarding(false);
    }} />;
  }

  return <DiscoverContent userId={userId} />;
}
