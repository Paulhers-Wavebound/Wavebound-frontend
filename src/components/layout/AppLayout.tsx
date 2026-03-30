import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { cn } from '@/lib/utils';
import { useAISidebar } from '@/contexts/AISidebarContext';
import { useProfileBackfill } from '@/hooks/useProfileBackfill';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  /** Whether to show padding for header (most pages need this) */
  withHeaderPadding?: boolean;
  /** Full height layout for workspace-style pages */
  fullHeight?: boolean;
}

export function AppLayout({ 
  children, 
  className,
  withHeaderPadding = true,
  fullHeight = false,
}: AppLayoutProps) {
  const { isOpen, mode, width, isFocusMode } = useAISidebar();
  useProfileBackfill();
  
  // When docked and open, shrink the main content area
  const isDocked = isOpen && mode === 'dock' && !isFocusMode;
  const isFloating = isOpen && mode === 'float' && !isFocusMode;

  return (
    <div 
      className={cn(
        "min-h-screen bg-background transition-[margin] duration-300",
        fullHeight && "h-screen flex flex-col"
      )}
      style={{ 
        marginRight: isDocked ? `${width}px` : isFloating ? 4 : 0,
      }}
    >
      <AppHeader />
      <main className={cn(
        withHeaderPadding && "pt-16",
        "pb-16 md:pb-0",
        fullHeight && "flex-1 overflow-hidden",
        className
      )}>
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
