import { useState } from 'react';
import { Palette, Lock, Check, Crown, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppTheme, THEMES, ThemeId } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ThemeSwatch({ colors, className }: { colors: string[]; className?: string }) {
  return (
    <div className={cn("flex rounded-md overflow-hidden shadow-sm", className)}>
      {colors.map((color, i) => (
        <div
          key={i}
          className="w-4 h-6"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function UnlockIcon({ type }: { type?: 'subscription' | 'referral' | 'achievement' }) {
  switch (type) {
    case 'subscription':
      return <Crown className="w-3 h-3" />;
    case 'referral':
      return <Users className="w-3 h-3" />;
    case 'achievement':
      return <Trophy className="w-3 h-3" />;
    default:
      return <Lock className="w-3 h-3" />;
  }
}

export function ThemeSelector() {
  const { currentTheme, setTheme, isThemeUnlocked } = useAppTheme();
  const [open, setOpen] = useState(false);

  const handleSelectTheme = (themeId: ThemeId) => {
    const config = THEMES.find(t => t.id === themeId);
    
    if (!isThemeUnlocked(themeId)) {
      toast.info('Upgrade to Pro to unlock this theme', {
        description: config?.unlockRequirement || 'Premium themes require an upgrade',
        action: config?.unlockType === 'subscription' 
          ? { label: 'Upgrade', onClick: () => toast.info('Premium feature coming soon!') }
          : config?.unlockType === 'referral'
          ? { label: 'Invite friends', onClick: () => toast.info('Referral feature coming soon!') }
          : undefined,
      });
      return;
    }

    setTheme(themeId);
    setOpen(false);
  };

  const currentConfig = THEMES.find(t => t.id === currentTheme);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          title="Change theme"
        >
          <Palette className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <div className="mb-3">
          <h4 className="font-semibold text-sm text-foreground">Choose Theme</h4>
          <p className="text-xs text-muted-foreground">Personalize your Wavebound experience</p>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {THEMES.map((theme) => {
            const isUnlocked = isThemeUnlocked(theme.id);
            const isActive = currentTheme === theme.id;
            
            return (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={cn(
                  "relative flex items-center gap-3 p-2.5 rounded-lg text-left transition-all",
                  isUnlocked && "hover:bg-muted/80 cursor-pointer hover:scale-[1.01]",
                  isActive && "bg-primary/10 ring-1 ring-primary/30",
                  !isUnlocked && "opacity-50 cursor-not-allowed"
                )}
              >
                <ThemeSwatch colors={theme.previewColors} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "font-medium text-sm",
                      isActive ? "text-primary" : "text-foreground"
                    )}>
                      {theme.name}
                    </span>
                    {theme.isPremium && !isUnlocked && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                        <UnlockIcon type={theme.unlockType} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {!isUnlocked ? theme.unlockRequirement : theme.description}
                  </p>
                </div>
                
                {isActive && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            🔓 Unlock themes by subscribing or referring friends
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
