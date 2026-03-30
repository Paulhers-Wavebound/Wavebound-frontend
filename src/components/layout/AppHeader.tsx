import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { 
  Compass, 
  FolderOpen, 
  Sparkles, 
  LogIn, 
  LogOut,
  Menu,
  X,
  StickyNote,
  Heart,
  Calendar,
  ChevronDown,
  Info,
  BookOpen,
  Map,
  User as UserIcon,
  ClipboardList,
  Search as SearchIcon
} from 'lucide-react';
import waveboundLogo from '@/assets/wavebound-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeSelector } from '@/components/ThemeSelector';

const consumerNavItems = [
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/create', label: 'Create Content Plan', icon: Sparkles },
];

const artistNavItems = [
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/content-plan', label: 'Content Plan', icon: ClipboardList },
  { path: '/create', label: 'Create', icon: Sparkles },
];

const consumerWorkspaceSubItems = [
  { path: '/workspace?tab=favorites', label: 'Favorites', icon: Heart },
  { path: '/workspace?tab=plans', label: 'Plans', icon: Calendar },
];

const artistWorkspaceSubItems = [
  { path: '/favorites', label: 'Favorites', icon: Heart },
];

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { navigateToAnalysis } = useAnalysis();
  const { isArtist } = useUserProfile();

  const navItems = isArtist ? artistNavItems : consumerNavItems;
  const workspaceSubItems = isArtist ? artistWorkspaceSubItems : consumerWorkspaceSubItems;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path.split('?')[0];
  const isWorkspaceActive = location.pathname === '/workspace';

  // Hide consumer header on label pages (LabelLayout provides its own)
  if (location.pathname.startsWith('/label')) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm transition-all duration-300 backdrop-blur-xl bg-background/95 border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 relative">
              <img 
                src={waveboundLogo} 
                alt="Wavebound" 
                className="w-8 h-8"
              />
              <span className="font-semibold text-lg tracking-tight text-foreground hidden sm:block">
                Wavebound
              </span>
              <span className="absolute -top-1 -right-8 text-[10px] font-medium text-primary hidden sm:block">
                (beta)
              </span>
            </Link>
          </div>

          {/* Desktop Nav - Centered */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              const href = (() => {
                if (item.path !== '/discover') return item.path;
                try {
                  return sessionStorage.getItem('discover_last_href') || '/discover';
                } catch {
                  return '/discover';
                }
              })();

              return (
                <div key={item.path} className="relative">
                  <Link
                    to={href}
                    onClick={(e) => {
                      if (item.path === '/create') {
                        e.preventDefault();
                        const resumePath = navigateToAnalysis();
                        navigate(resumePath || '/create');
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive(item.path)
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-foreground/40" />
                  )}
                </div>
              );
            })}
            
            {/* Workspace Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isWorkspaceActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FolderOpen className="w-4 h-4" />
                  Workspace
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="z-50 min-w-[160px] p-2 bg-card border-border">
                {workspaceSubItems.map((item) => (
                  <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)} className="cursor-pointer gap-3 px-4 py-3 text-sm font-medium">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">

            {/* About Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  About
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 min-w-[160px] p-2 bg-card border-border">
                <DropdownMenuItem onClick={() => navigate('/about')} className="cursor-pointer gap-3 px-4 py-3 text-sm font-medium">
                  <Info className="w-4 h-4" />
                  About Us
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/blog')} className="cursor-pointer gap-3 px-4 py-3 text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  Blog
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/roadmap')} className="cursor-pointer gap-3 px-4 py-3 text-sm font-medium">
                  <Map className="w-4 h-4" />
                  Roadmap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/me')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <UserIcon className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Log in
              </Button>
            )}

            <ThemeSelector />
          </div>

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.filter(item => item.path !== '/create').map((item) => {
                  const href = (() => {
                    if (item.path !== '/discover') return item.path;
                    try {
                      return sessionStorage.getItem('discover_last_href') || '/discover';
                    } catch {
                      return '/discover';
                    }
                  })();

                  return (
                    <Link
                      key={item.path}
                      to={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                
                {/* Workspace section in mobile */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Workspace</p>
                  {workspaceSubItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                        location.pathname === '/workspace' && location.search.includes(item.path.split('?')[1])
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* More section in mobile */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">More</p>
                  {[
                    { path: '/subscription', label: 'Pricing', icon: Sparkles },
                    { path: '/about', label: 'About Us', icon: Info },
                    { path: '/blog', label: 'Blog', icon: BookOpen },
                    { path: '/roadmap', label: 'Roadmap', icon: Map },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                </div>
                {!user && (
                  <Button 
                    onClick={() => {
                      navigate('/auth');
                      setMobileMenuOpen(false);
                    }} 
                    className="mt-4"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
