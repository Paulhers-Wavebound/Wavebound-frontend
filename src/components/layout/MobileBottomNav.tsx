import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Sparkles, FolderOpen, Calendar, Heart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAISidebar } from '@/contexts/AISidebarContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useUserProfile } from '@/contexts/UserProfileContext';

const consumerNavItems = [
  { id: 'discover', label: 'Discover', icon: Compass, path: '/discover' },
  { id: 'ask-ai', label: 'Ask AI', icon: Sparkles, path: null },
  { id: 'create', label: 'Create', icon: Sparkles, path: '/create' },
  { id: 'workspace', label: 'Workspace', icon: FolderOpen, path: '/workspace' },
] as const;

const artistNavItems = [
  { id: 'discover', label: 'Discover', icon: Compass, path: '/discover' },
  { id: 'content-plan', label: 'Plan', icon: ClipboardList, path: '/content-plan' },
  { id: 'create', label: 'Create', icon: Sparkles, path: '/create' },
  { id: 'ask-ai', label: 'Ask AI', icon: Sparkles, path: null },
] as const;

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen: isSidebarOpen, openSidebar, closeSidebar } = useAISidebar();
  const { navigateToAnalysis } = useAnalysis();
  const { isArtist } = useUserProfile();

  const navItems = isArtist ? artistNavItems : consumerNavItems;

  // Hide on landing page, auth, and label pages
  const hiddenPaths = isArtist ? ['/auth'] : ['/', '/auth'];
  if (hiddenPaths.includes(location.pathname)) return null;
  if (location.pathname.startsWith('/label')) return null;
  if (/^\/label\d/.test(location.pathname)) return null;

  const handleTap = (item: { id: string; label: string; icon: any; path: string | null }) => {
    if (item.id !== 'ask-ai') {
      closeSidebar();
    }

    if (item.id === 'ask-ai') {
      openSidebar();
      return;
    }

    if (item.id === 'discover') {
      try {
        const lastHref = sessionStorage.getItem('discover_last_href') || '/discover';
        navigate(lastHref);
      } catch {
        navigate('/discover');
      }
      return;
    }

    if (item.id === 'create') {
      const resumePath = navigateToAnalysis();
      navigate(resumePath || '/create');
      return;
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (item: { id: string; path: string | null }) => {
    if (isSidebarOpen) return item.id === 'ask-ai';
    if (item.path) return location.pathname === item.path;
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => handleTap(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className={cn(
                "text-[10px] font-medium leading-tight",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
