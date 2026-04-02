import { ReactNode, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import LabelSidebar from '@/components/label/LabelSidebar';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface LabelLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

function useLabelTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('label-theme');
      return stored ? stored === 'dark' : true;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    const value = dark ? 'dark' : 'light';
    root.setAttribute('data-label-theme', value);
    localStorage.setItem('label-theme', value);
    return () => root.removeAttribute('data-label-theme');
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

export default function LabelLayout({ children }: LabelLayoutProps) {
  const { dark, toggle } = useLabelTheme();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { labelId } = useUserProfile();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ flexShrink: 0 }}>
          <LabelSidebar dark={dark} onToggleTheme={toggle} />
        </div>
      )}

      {/* Mobile: top bar + sheet sidebar */}
      {isMobile && (
        <>
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
            height: 48, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 16px',
          }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: 4 }}
            >
              <Menu size={22} />
            </button>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[280px] border-none" style={{ background: 'var(--surface)' }}>
              <LabelSidebar dark={dark} onToggleTheme={toggle} onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        paddingTop: isMobile ? 48 : 0,
      }}>
        <div key={labelId ?? 'default'} style={{ animation: 'labelFadeIn 250ms ease-out' }}>
          {children}
        </div>
      </main>

      <style>{`
        @keyframes labelFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
