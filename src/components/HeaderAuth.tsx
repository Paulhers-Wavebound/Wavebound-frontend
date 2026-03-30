import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";

import { 
  LogIn, UserPlus, User as UserIcon, LogOut, Menu, X, 
  BarChart3, Sparkles, Home, FolderOpen, FileText, Heart, 
  Upload, Music, Search, Star, BookmarkCheck, Crown, ChevronDown, Palette, PlusCircle, Info, CalendarDays, Bot, Map, BookOpen
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import waveboundLogo from "@/assets/wavebound-logo.png";
interface HeaderAuthProps {
  triggerSignIn?: boolean;
  onSignInComplete?: () => void;
  variant?: 'dark' | 'light';
}
const HeaderAuth = ({
  triggerSignIn = false,
  onSignInComplete,
  variant = 'dark'
}: HeaderAuthProps = {}) => {
  const { currentTheme } = useAppTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'ocean' || currentTheme === 'midnight';
  // Only treat the header as "light" when BOTH:
  // 1) the page requested the light variant, and
  // 2) the app is currently in light mode.
  const isLight = variant === 'light' && !isDarkMode;
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  
  // Refs for hover timeout to prevent flickering
  const createPlanTimeout = useRef<NodeJS.Timeout | null>(null);
  const libraryTimeout = useRef<NodeJS.Timeout | null>(null);
  const analyzeTimeout = useRef<NodeJS.Timeout | null>(null);
  const aboutTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const handleDropdownEnter = (
    setter: (value: boolean) => void, 
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setter(true);
  };
  
  const handleDropdownLeave = (
    setter: (value: boolean) => void, 
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) => {
    // Small delay before closing to prevent flickering when moving between trigger and content
    timeoutRef.current = setTimeout(() => {
      setter(false);
    }, 50);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const {
    favoriteVideoIds,
    favoritePhotoIds
  } = useFavorites();
  const queryClient = useQueryClient();
  const totalFavorites = favoriteVideoIds.length + favoritePhotoIds.length;
  const isOnWorkspace = location.pathname === '/workspace';
  const isBlogRoute = location.pathname.startsWith('/blog');

  // Use semantic (theme-aware) header styling:
  // - Always on blog routes (solid background required)
  // - Also in dark mode across the app, so the header matches the darker aesthetic
  const useSemanticHeader = isBlogRoute || isDarkMode;

  const logoTextClass = useSemanticHeader
    ? 'text-foreground'
    : isLight
      ? 'text-gray-900'
      : 'text-white';

  const navButtonClass = useSemanticHeader
    ? 'text-foreground hover:text-foreground hover:bg-muted'
    : isLight
      ? 'text-gray-800 hover:text-gray-900 hover:bg-gray-100'
      : 'text-white hover:text-white/80';

  const activeUnderlineClass = useSemanticHeader
    ? 'bg-foreground/40'
    : isLight
      ? 'bg-gray-600'
      : 'bg-white/50';

  const dropdownContentClass = useSemanticHeader
    ? 'bg-card border-border text-foreground'
    : isLight
      ? 'bg-white border-gray-200 text-gray-900'
      : 'bg-card border-border text-foreground';

  const dropdownItemClass = useSemanticHeader
    ? 'text-foreground hover:bg-muted'
    : isLight
      ? 'text-gray-800 hover:bg-gray-100'
      : 'text-foreground hover:bg-muted';

  // Prefetch data when hovering over navigation links
  const handleNavHover = (path: string) => {
    if (path === '/workspace' && user) {
      // Prefetch workspace favorites
      if (favoriteVideoIds.length > 0) {
        queryClient.prefetchQuery({
          queryKey: ['workspace-videos', favoriteVideoIds],
          queryFn: async () => {
            const {
              data
            } = await supabase.from('tiktok_videos_all').select('*').in('id', favoriteVideoIds);
            return data;
          }
        });
      }
    }
  };
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        setIsAuthOpen(false);
        setIsMobileMenuOpen(false);
        onSignInComplete?.();
        toast({
          title: "Welcome back! 👋",
          description: "You're now signed in."
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [toast, onSignInComplete]);
  useEffect(() => {
    if (triggerSignIn) {
      setIsAuthOpen(true);
    }
  }, [triggerSignIn]);
  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    const {
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email! 📧",
        description: "We sent you a confirmation link."
      });
    }
    setLoading(false);
  };
  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you next time! ✨"
    });
  };
  // Primary nav items (always visible)
  const primaryNavItems = [
    { name: 'Assistant', path: '/assistant', icon: Bot },
  ];

  // My Library dropdown items
  const libraryItems = [
    { name: 'Workspace', path: '/workspace', icon: FileText },
    { name: 'My Plans', path: '/my-plans', icon: FolderOpen },
    
    { name: 'Favorites', path: '/favorites', icon: Star },
  ];

  // Analyze dropdown items
  const analyzeItems = [
    { name: 'My Analyses', path: '/my-analyses', icon: BookmarkCheck },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  // All items for mobile menu
  const allNavigationItems = [...primaryNavItems, ...libraryItems, ...analyzeItems];
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b shadow-sm ${
        isBlogRoute
          ? "bg-background border-border"
          : isLight
            ? "backdrop-blur-xl bg-white/95 border-gray-200"
            : "backdrop-blur-xl bg-background/95 border-border"
      }`}
      style={isBlogRoute ? { backgroundColor: "hsl(var(--background))" } : undefined}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo - Left */}
        <div className="flex items-center flex-shrink-0">
          <div 
            className="flex items-center gap-2 cursor-pointer relative" 
            onClick={() => {
              if (location.pathname === '/') {
                window.location.reload();
              } else {
                navigate('/');
              }
            }}
          >
            <img src={waveboundLogo} alt="Wavebound" className="w-8 h-8" />
            <span className={`text-lg font-semibold tracking-tight ${logoTextClass}`}>Wavebound</span>
            <span className="absolute -top-1 -right-8 text-[10px] font-medium text-sky-500">
              (beta)
            </span>
          </div>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {/* Primary nav items */}
          {primaryNavItems.map(item => (
            <div key={item.path} className="relative">
              <Button
                variant="ghost"
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => handleNavHover(item.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${navButtonClass}`}
              >
                {item.name}
              </Button>
              {location.pathname === item.path && (
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px ${activeUnderlineClass}`}></div>
              )}
            </div>
          ))}
          
          {/* Create Plan Dropdown */}
          <DropdownMenu open={createPlanOpen} modal={false}>
            <div
              onMouseEnter={() => handleDropdownEnter(setCreatePlanOpen, createPlanTimeout)}
              onMouseLeave={() => handleDropdownLeave(setCreatePlanOpen, createPlanTimeout)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 gap-1 ${navButtonClass}`}
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Create Plan
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={4}
                className={`z-50 min-w-[180px] p-2 ${dropdownContentClass}`}
              >
                <DropdownMenuItem
                  onClick={() => handleNavigation('/analyze-audio')}
                  className={`cursor-pointer gap-3 px-4 py-3 text-base font-medium ${dropdownItemClass}`}
                >
                  <Music className="w-5 h-5" />
                  Using Audio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/analyze')}
                  className={`cursor-pointer gap-3 px-4 py-3 text-base font-medium ${dropdownItemClass}`}
                >
                  <Upload className="w-5 h-5" />
                  Using Video
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          {/* My Library Dropdown */}
          <DropdownMenu open={libraryOpen} modal={false}>
            <div
              onMouseEnter={() => handleDropdownEnter(setLibraryOpen, libraryTimeout)}
              onMouseLeave={() => handleDropdownLeave(setLibraryOpen, libraryTimeout)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 gap-1 ${navButtonClass} ${libraryItems.some(i => location.pathname === i.path) ? (useSemanticHeader ? 'bg-muted/50' : 'bg-white/10') : ''}`}
                >
                  <FolderOpen className="w-4 h-4 mr-1" />
                  My Library
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={4}
                className={`z-50 min-w-[180px] p-2 ${dropdownContentClass}`}
              >
                {libraryItems.map(item => (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`cursor-pointer gap-3 px-4 py-3 text-base font-medium ${dropdownItemClass}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          {/* Analyze Dropdown */}
          <DropdownMenu open={analyzeOpen} modal={false}>
            <div
              onMouseEnter={() => handleDropdownEnter(setAnalyzeOpen, analyzeTimeout)}
              onMouseLeave={() => handleDropdownLeave(setAnalyzeOpen, analyzeTimeout)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 gap-1 ${navButtonClass} ${analyzeItems.some(i => location.pathname === i.path) ? (useSemanticHeader ? 'bg-muted/50' : 'bg-white/10') : ''}`}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Analyze
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={4}
                className={`z-50 min-w-[180px] p-2 ${dropdownContentClass}`}
              >
                {analyzeItems.map(item => (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`cursor-pointer gap-3 px-4 py-3 text-base font-medium ${dropdownItemClass}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`lg:hidden ${useSemanticHeader ? 'text-foreground' : isLight ? 'text-gray-600' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Right side: Pricing + About + Auth Section */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <div className="w-px h-5 bg-border/30 mx-1" />
          {/* About Dropdown */}
          <DropdownMenu open={aboutOpen} modal={false}>
            <div
              onMouseEnter={() => handleDropdownEnter(setAboutOpen, aboutTimeout)}
              onMouseLeave={() => handleDropdownLeave(setAboutOpen, aboutTimeout)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1 ${useSemanticHeader ? 'text-foreground hover:bg-muted' : isLight ? 'text-gray-800 hover:text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}
                >
                  About
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={4}
                className={`z-50 min-w-[160px] p-2 ${dropdownContentClass}`}
              >
                <DropdownMenuItem
                  onClick={() => handleNavigation('/about')}
                  className={`cursor-pointer gap-3 px-4 py-3 text-base font-medium ${dropdownItemClass}`}
                >
                  <Info className="w-5 h-5" />
                  About Us
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/blog')}
                  className={`cursor-pointer gap-3 px-4 py-3 text-base font-medium ${dropdownItemClass}`}
                >
                  <BookOpen className="w-5 h-5" />
                  Blog
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/roadmap')}
                  className={`cursor-pointer gap-3 px-4 py-3 text-base font-medium ${dropdownItemClass}`}
                >
                  <Map className="w-5 h-5" />
                  Roadmap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/me')}
              className={useSemanticHeader ? 'text-foreground hover:bg-muted' : isLight ? 'text-gray-800 hover:text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/20'}
            >
              <UserIcon className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAuthOpen(true)}
              className={useSemanticHeader ? 'text-foreground hover:bg-muted' : isLight ? 'text-gray-800 hover:text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/20'}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Log in
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu - Condensed */}
      {isMobileMenuOpen && (
        <div
          className={`lg:hidden max-h-[70vh] overflow-y-auto ${
            useSemanticHeader
              ? 'bg-card border-t border-border'
              : isLight
                ? 'bg-white border-t border-gray-100'
                : 'bg-card border-t border-border'
          }`}
        >
          <div className="px-4 py-3">
            {/* Primary Actions - Grid Layout */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {primaryNavItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary/10 text-primary'
                      : useSemanticHeader 
                        ? 'text-foreground hover:bg-muted' 
                        : isLight 
                          ? 'text-gray-700 hover:bg-gray-100' 
                          : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              ))}
            </div>

            {/* Compact Grouped Sections */}
            <div className={`border-t pt-3 ${useSemanticHeader ? 'border-border' : isLight ? 'border-gray-100' : 'border-border'}`}>
              {/* My Library - Horizontal scroll */}
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">My Library</p>
              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                {libraryItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-3 h-3" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={`border-t pt-3 mt-2 ${useSemanticHeader ? 'border-border' : isLight ? 'border-gray-100' : 'border-border'}`}>
              {/* Analyze - Horizontal scroll */}
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Analyze</p>
              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                {analyzeItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-3 h-3" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={`border-t pt-3 mt-2 ${useSemanticHeader ? 'border-border' : isLight ? 'border-gray-100' : 'border-border'}`}>
              {/* Create Plan - Horizontal scroll */}
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Create Plan</p>
              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                <button
                  onClick={() => handleNavigation('/analyze-audio')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Music className="w-3 h-3" />
                  Audio
                </button>
                <button
                  onClick={() => handleNavigation('/analyze')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Video
                </button>
                <button
                  onClick={() => handleNavigation('/explore')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Palette className="w-3 h-3" />
                  Genre
                </button>
              </div>
            </div>

            {/* Bottom row: Subscribe + Auth */}
            <div className={`border-t pt-3 mt-2 flex items-center justify-between ${useSemanticHeader ? 'border-border' : isLight ? 'border-gray-100' : 'border-border'}`}>
              <button
                onClick={() => handleNavigation('/subscription')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-colors"
              >
                <Crown className="w-3 h-3" />
                Subscribe
              </button>
              
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNavigation('/me')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <UserIcon className="w-3 h-3" />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  Log in
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Dialog */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Wavebound</DialogTitle>
          </DialogHeader>
          <AuthForm onSignUp={handleSignUp} onSignIn={handleSignIn} loading={loading} />
        </DialogContent>
      </Dialog>
    </header>
  );
};
const AuthForm = ({
  onSignUp,
  onSignIn,
  loading
}: {
  onSignUp: (email: string, password: string) => void;
  onSignIn: (email: string, password: string) => void;
  loading: boolean;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (action: 'signin' | 'signup') => {
    if (action === 'signin') {
      onSignIn(email, password);
    } else {
      onSignUp(email, password);
    }
  };
  return <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2 glass-card">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      
      <TabsContent value="signin" className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="glass-card" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="glass-card" />
        </div>
        <Button onClick={() => handleSubmit('signin')} disabled={loading || !email || !password} className="w-full bg-primary/20 hover:bg-primary/30">
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </TabsContent>
      
      <TabsContent value="signup" className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="email-signup">Email</Label>
          <Input id="email-signup" type="email" value={email} onChange={e => setEmail(e.target.value)} className="glass-card" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-signup">Password</Label>
          <Input id="password-signup" type="password" value={password} onChange={e => setPassword(e.target.value)} className="glass-card" />
        </div>
        <Button onClick={() => handleSubmit('signup')} disabled={loading || !email || !password} className="w-full bg-primary/20 hover:bg-primary/30">
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </TabsContent>
    </Tabs>;
};
export default HeaderAuth;