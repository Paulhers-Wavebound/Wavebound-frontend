import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import waveboundLogo from '@/assets/wavebound-logo.png';

interface LabelLayoutProps {
  children: ReactNode;
}

export function LabelLayout({ children }: LabelLayoutProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl bg-background/95 border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/label" className="flex items-center gap-2">
              <img src={waveboundLogo} alt="Wavebound" className="w-8 h-8" />
              <span className="font-semibold text-lg tracking-tight text-foreground">
                Wavebound
              </span>
              <span className="text-xs font-medium text-muted-foreground ml-1">
                Label
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="pt-14">{children}</main>
    </div>
  );
}
