import React, { useState } from 'react';
import { Search, SlidersHorizontal, Music, Video, Smartphone, Sparkles, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import FilterPanel, { FilterState } from './FilterPanel';

interface ExploreTopFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onGenreClick: (genre: string) => void;
  onContentStyleClick: (style: string) => void;
  selectedGenres: string[];
  selectedContentStyles: string[];
  availableGenres: string[];
  availableContentStyles: string[];
  // New props for filter panel
  filters: FilterState;
  pendingFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  availableGenresWithCount: { genre: string; count: number; percentage: number }[];
  availableSubGenres: { subGenre: string; count: number; percentage: number }[];
  availableContentStylesWithCount: { style: string; count: number }[];
  availableGenders: { value: string; count: number; percentage: number }[];
  hasFilterChanges: boolean;
}

const PLATFORMS = ['TikTok', 'Reels'];
const FEATURES = ['Audio Analysis', 'Video Analysis', '7-Day Plans'];
const FEATURE_LINKS = ['/analyze-audio', '/analyze', '/discover'];

const CATEGORY_ICONS = {
  genres: Music,
  styles: Video,
  platforms: Smartphone,
  features: Sparkles,
};

const ExploreTopFilters: React.FC<ExploreTopFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  sortBy,
  onSortChange,
  onGenreClick,
  onContentStyleClick,
  selectedGenres,
  selectedContentStyles,
  availableGenres,
  availableContentStyles,
  filters,
  pendingFilters,
  onFiltersChange,
  onApplyFilters,
  availableGenresWithCount,
  availableSubGenres,
  availableContentStylesWithCount,
  availableGenders,
  hasFilterChanges,
}) => {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const activeFilterCount = 
    pendingFilters.genre.length + 
    pendingFilters.subGenre.length + 
    pendingFilters.contentStyle.length + 
    pendingFilters.gender.length + 
    pendingFilters.platform.length + 
    pendingFilters.excludeGenre.length + 
    pendingFilters.excludeContentStyle.length + 
    (pendingFilters.performanceRange !== 'all' ? 1 : 0) +
    (pendingFilters.followerRange !== 'all' ? 1 : 0) +
    (pendingFilters.effort !== 'all' ? 1 : 0);

  const CategoryCard = ({ 
    title, 
    icon: Icon, 
    children, 
    gradient 
  }: { 
    title: string; 
    icon: React.ElementType; 
    children: React.ReactNode;
    gradient: string;
  }) => (
    <div className="group relative bg-card/60 dark:bg-card/30 backdrop-blur-xl rounded-sm border border-border/20 hover:border-border/50 transition-all duration-500 overflow-hidden shadow-md hover:shadow-xl">
      {/* Premium subtle gradient accent */}
      <div className={cn("absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-gradient-to-br", gradient)} />
      
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
      
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "p-2.5 rounded-sm shadow-lg",
            "bg-gradient-to-br",
            gradient
          )}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xs font-semibold tracking-[0.2em] text-foreground/70 uppercase">{title}</h3>
        </div>
        <div className="space-y-1">
          {children}
        </div>
      </div>
    </div>
  );

  const FilterButton = ({ 
    isActive, 
    onClick, 
    children 
  }: { 
    isActive: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] rounded-sm transition-all duration-300",
        isActive
          ? "bg-primary/10 text-primary font-medium shadow-sm"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      )}
    >
      <span className="tracking-wide">{children}</span>
      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
    </button>
  );

  const LinkButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
      href={href}
      className="flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] text-muted-foreground hover:bg-muted/40 hover:text-foreground rounded-sm transition-all duration-300 group/link"
    >
      <span className="tracking-wide">{children}</span>
      <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300" />
    </a>
  );

  return (
    <div className="bg-gradient-to-b from-muted/30 via-muted/15 to-background border-b border-border/30 relative">
      {/* Premium top highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
      
      {/* Top bar with platform tabs and search */}
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-1 p-1.5 bg-muted/30 backdrop-blur-sm rounded-sm border border-border/20">
            <button
              onClick={() => onPlatformChange('tiktok')}
              className={cn(
                "px-5 py-2 text-sm font-medium rounded-sm transition-all duration-300",
                selectedPlatform === 'tiktok' || selectedPlatform === ''
                  ? "bg-background text-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Videos
            </button>
            <button
              onClick={() => onPlatformChange('reels')}
              className={cn(
                "px-5 py-2 text-sm font-medium rounded-sm transition-all duration-300",
                selectedPlatform === 'reels'
                  ? "bg-background text-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Reels
            </button>
          </div>
          
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 bg-background/80 backdrop-blur-sm border-border/30 rounded-sm text-sm h-11 focus-visible:ring-1 focus-visible:ring-primary/40 shadow-sm placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </div>

      {/* Category cards */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {/* Genres card */}
          <CategoryCard title="Genres" icon={CATEGORY_ICONS.genres} gradient="from-violet-500 to-purple-600">
            {availableGenres.slice(0, 5).map((genre) => (
              <FilterButton
                key={genre}
                isActive={selectedGenres.includes(genre)}
                onClick={() => onGenreClick(genre)}
              >
                {genre}
              </FilterButton>
            ))}
          </CategoryCard>
          {/* Content Styles card */}
          <div id="content-styles-card">
            <CategoryCard title="Content Styles" icon={CATEGORY_ICONS.styles} gradient="from-blue-500 to-cyan-500">
              {availableContentStyles.slice(0, 5).map((style) => (
                <FilterButton
                  key={style}
                  isActive={selectedContentStyles.includes(style)}
                  onClick={() => {
                    onContentStyleClick(style);
                    // Auto-scroll to this card
                    document.getElementById('content-styles-card')?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    });
                  }}
                >
                  {style}
                </FilterButton>
              ))}
            </CategoryCard>
          </div>

          {/* Platforms card */}
          <CategoryCard title="Platforms" icon={CATEGORY_ICONS.platforms} gradient="from-pink-500 to-rose-500">
            {PLATFORMS.map((platform) => (
              <FilterButton
                key={platform}
                isActive={
                  (selectedPlatform === platform.toLowerCase()) ||
                  (platform === 'TikTok' && selectedPlatform === 'tiktok') ||
                  (platform === 'Reels' && selectedPlatform === 'reels')
                }
                onClick={() => onPlatformChange(platform.toLowerCase())}
              >
                {platform}
              </FilterButton>
            ))}
            <FilterButton
              isActive={selectedPlatform === ''}
              onClick={() => onPlatformChange('')}
            >
              All Platforms
            </FilterButton>
          </CategoryCard>

          {/* Features card */}
          <CategoryCard title="Features" icon={CATEGORY_ICONS.features} gradient="from-amber-500 to-orange-500">
            {FEATURES.map((feature, index) => (
              <LinkButton key={feature} href={FEATURE_LINKS[index]}>
                {feature}
              </LinkButton>
            ))}
          </CategoryCard>
        </div>
      </div>

      {/* Sort bar */}
      <div className="container mx-auto px-4 md:px-6 py-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPlatformChange('tiktok')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-medium rounded-sm transition-all duration-200",
                selectedPlatform === 'tiktok' || selectedPlatform === ''
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              TikTok
            </button>
            <button
              onClick={() => onPlatformChange('reels')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-medium rounded-sm transition-all duration-200",
                selectedPlatform === 'reels'
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Reels
            </button>
            <div className="w-px h-4 bg-border mx-3" />
            <button
              onClick={() => onSortChange('latest')}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors",
                sortBy === 'latest'
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Latest
            </button>
            <button
              onClick={() => onSortChange('popular')}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors",
                sortBy === 'popular'
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Most popular
            </button>
            <button
              onClick={() => onSortChange('top')}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors",
                sortBy === 'top'
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Top rated
            </button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={cn(
              "text-xs gap-1.5 rounded-sm border-border/50",
              filterPanelOpen || activeFilterCount > 0
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                : "hover:bg-muted"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-background text-primary rounded-sm font-semibold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        pendingFilters={pendingFilters}
        onFiltersChange={onFiltersChange}
        onApplyFilters={onApplyFilters}
        availableGenres={availableGenresWithCount}
        availableSubGenres={availableSubGenres}
        availableContentStyles={availableContentStylesWithCount}
        availableGenders={availableGenders}
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        hasChanges={hasFilterChanges}
      />
    </div>
  );
};

export default ExploreTopFilters;
