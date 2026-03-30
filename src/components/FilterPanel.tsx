import React, { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Music, TrendingUp, ChevronDown, X, Zap, Filter, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoveryPresets } from './DiscoveryPresets';
import { ServerFilterState } from '@/hooks/useServerFilters';
export interface FilterState {
  genre: string[];
  subGenre: string[];
  contentStyle: string[];
  performanceRange: string;
  followerRange: string;
  effort: string;
  gender: string[];
  platform: string[];
  excludeGenre: string[];
  excludeContentStyle: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  pendingFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  availableGenres: { genre: string; count: number; percentage: number }[];
  availableSubGenres: { subGenre: string; count: number; percentage: number }[];
  availableContentStyles: { style: string; count: number }[];
  availableGenders: { value: string; count: number; percentage: number }[];
  isOpen: boolean;
  onClose: () => void;
  hasChanges: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  pendingFilters,
  onFiltersChange,
  onApplyFilters,
  availableGenres,
  availableSubGenres,
  availableContentStyles,
  availableGenders,
  isOpen,
  onClose,
  hasChanges,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handlePresetSelect = (presetFilters: Partial<ServerFilterState>, presetId?: string) => {
    if (Object.keys(presetFilters).length === 0) {
      // Clearing preset
      setActivePresetId(null);
      clearAllFilters();
    } else {
      // Apply preset filters
      setActivePresetId(presetId || null);
      const newFilters: FilterState = {
        ...pendingFilters,
        genre: presetFilters.genre || [],
        subGenre: presetFilters.subGenre || [],
        contentStyle: presetFilters.contentStyle || [],
        performanceRange: presetFilters.performanceRange || 'all',
        followerRange: presetFilters.followerRange || 'all',
        effort: presetFilters.effort || 'all',
        gender: presetFilters.gender || [],
        platform: presetFilters.platform || [],
        excludeGenre: [],
        excludeContentStyle: [],
      };
      onFiltersChange(newFilters);
    }
  };

  const updateFilters = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...pendingFilters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      genre: [],
      subGenre: [],
      contentStyle: [],
      performanceRange: 'all',
      followerRange: 'all',
      effort: 'all',
      gender: [],
      platform: [],
      excludeGenre: [],
      excludeContentStyle: []
    });
  };

  const hasActiveFilters = () => {
    return (
      pendingFilters.genre.length > 0 ||
      pendingFilters.subGenre.length > 0 ||
      pendingFilters.contentStyle.length > 0 ||
      pendingFilters.performanceRange !== 'all' ||
      pendingFilters.followerRange !== 'all' ||
      pendingFilters.effort !== 'all' ||
      pendingFilters.gender.length > 0 ||
      pendingFilters.platform.length > 0 ||
      pendingFilters.excludeGenre.length > 0 ||
      pendingFilters.excludeContentStyle.length > 0
    );
  };

  const hasAdvancedFilters = () => {
    return (
      pendingFilters.subGenre.length > 0 ||
      pendingFilters.followerRange !== 'all' ||
      pendingFilters.effort !== 'all' ||
      pendingFilters.gender.length > 0 ||
      pendingFilters.excludeGenre.length > 0 ||
      pendingFilters.excludeContentStyle.length > 0
    );
  };

  const toggleArrayFilter = (key: 'genre' | 'subGenre' | 'contentStyle' | 'gender' | 'platform' | 'excludeGenre' | 'excludeContentStyle', value: string) => {
    const currentArray = pendingFilters[key];
    const updated = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters(key, updated);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleApplyAndClose = () => {
    onApplyFilters();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full z-50 bg-background border-b border-border shadow-lg"
          >
            <div className="container mx-auto px-4 md:px-6 py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Filters</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleApplyAndClose}
                    disabled={!hasChanges}
                    size="sm"
                    className={cn(
                      "text-xs",
                      hasChanges 
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Discovery Presets */}
              <div className="mb-6">
                <DiscoveryPresets 
                  onSelectPreset={handlePresetSelect}
                  activePresetId={activePresetId}
                />
              </div>

              {/* Main Filters - Always visible: Genre, Content Style, Platform, Performance */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Genre */}
                <div className="space-y-2">
                  <Collapsible open={expandedSection === 'genre'} onOpenChange={() => toggleSection('genre')}>
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "w-full rounded-lg p-3 flex items-center justify-between transition-all duration-200",
                        expandedSection === 'genre' 
                          ? "bg-accent text-accent-foreground" 
                          : "bg-muted/50 hover:bg-muted text-muted-foreground"
                      )}>
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          <span className="text-sm font-medium">Genre</span>
                          {pendingFilters.genre.length > 0 && (
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full font-medium">{pendingFilters.genre.length}</span>
                          )}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", expandedSection === 'genre' && "rotate-180")} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-muted/30 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                        {availableGenres.map(({ genre, count }) => (
                          <div key={genre} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50">
                            <Checkbox
                              id={`panel-genre-${genre}`}
                              checked={pendingFilters.genre.includes(genre)}
                              onCheckedChange={() => toggleArrayFilter('genre', genre)}
                              className="h-4 w-4"
                            />
                            <label htmlFor={`panel-genre-${genre}`} className="text-sm text-foreground cursor-pointer flex-1">
                              {genre}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Content Style */}
                <div className="space-y-2">
                  <Collapsible open={expandedSection === 'style'} onOpenChange={() => toggleSection('style')}>
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "w-full rounded-lg p-3 flex items-center justify-between transition-all duration-200",
                        expandedSection === 'style' 
                          ? "bg-accent text-accent-foreground" 
                          : "bg-muted/50 hover:bg-muted text-muted-foreground"
                      )}>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-medium">Style</span>
                          {pendingFilters.contentStyle.length > 0 && (
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full font-medium">{pendingFilters.contentStyle.length}</span>
                          )}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", expandedSection === 'style' && "rotate-180")} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-muted/30 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                        {availableContentStyles.map(({ style, count }) => (
                          <div key={style} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50">
                            <Checkbox
                              id={`panel-style-${style}`}
                              checked={pendingFilters.contentStyle.includes(style)}
                              onCheckedChange={() => toggleArrayFilter('contentStyle', style)}
                              className="h-4 w-4"
                            />
                            <label htmlFor={`panel-style-${style}`} className="text-sm text-foreground cursor-pointer flex-1">
                              {style}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <div className="rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Platform</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleArrayFilter('platform', 'tiktok')}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm rounded-lg border transition-colors",
                          pendingFilters.platform.includes('tiktok')
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        TikTok
                      </button>
                      <button
                        onClick={() => toggleArrayFilter('platform', 'reels')}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm rounded-lg border transition-colors",
                          pendingFilters.platform.includes('reels')
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        Reels
                      </button>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="space-y-2">
                  <div className="rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Performance</span>
                      {pendingFilters.performanceRange !== 'all' && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <Select
                      value={pendingFilters.performanceRange}
                      onValueChange={(value) => updateFilters('performanceRange', value)}
                    >
                      <SelectTrigger className="w-full h-9 text-sm bg-background">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-[100]">
                        <SelectItem value="all">All Performance</SelectItem>
                        <SelectItem value="viral">🔥 Mega Viral (8+)</SelectItem>
                        <SelectItem value="trending">⚡ Viral (6+)</SelectItem>
                        <SelectItem value="popular">📈 Trending (4+)</SelectItem>
                        <SelectItem value="growing">✨ Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                  <span>Advanced Filters</span>
                  {hasAdvancedFilters() && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full font-medium">Active</span>
                  )}
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                        {/* Sub-Genre */}
                        <div className="space-y-2">
                          <Collapsible open={expandedSection === 'subgenre'} onOpenChange={() => toggleSection('subgenre')}>
                            <CollapsibleTrigger className="w-full">
                              <div className={cn(
                                "w-full rounded-lg p-3 flex items-center justify-between transition-all duration-200",
                                expandedSection === 'subgenre' 
                                  ? "bg-accent text-accent-foreground" 
                                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
                              )}>
                                <div className="flex items-center gap-2">
                                  <Music className="w-4 h-4" />
                                  <span className="text-sm font-medium">Sub-Genre</span>
                                  {pendingFilters.subGenre.length > 0 && (
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full font-medium">{pendingFilters.subGenre.length}</span>
                                  )}
                                </div>
                                <ChevronDown className={cn("w-4 h-4 transition-transform", expandedSection === 'subgenre' && "rotate-180")} />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="bg-muted/30 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                                {availableSubGenres.length === 0 ? (
                                  <p className="text-sm text-muted-foreground p-2">No sub-genres available</p>
                                ) : (
                                  availableSubGenres.slice(0, 20).map(({ subGenre, count }) => (
                                    <div key={subGenre} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50">
                                      <Checkbox
                                        id={`panel-subgenre-${subGenre}`}
                                        checked={pendingFilters.subGenre.includes(subGenre)}
                                        onCheckedChange={() => toggleArrayFilter('subGenre', subGenre)}
                                        className="h-4 w-4"
                                      />
                                      <label htmlFor={`panel-subgenre-${subGenre}`} className="text-sm text-foreground cursor-pointer flex-1">
                                        {subGenre}
                                      </label>
                                      <span className="text-xs text-muted-foreground">{count}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>

                        {/* Followers */}
                        <div className="space-y-2">
                          <div className="rounded-lg p-3 bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">Followers</span>
                              {pendingFilters.followerRange !== 'all' && (
                                <span className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                            <Select
                              value={pendingFilters.followerRange}
                              onValueChange={(value) => updateFilters('followerRange', value)}
                            >
                              <SelectTrigger className="w-full h-9 text-sm bg-background">
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border border-border z-[100]">
                                <SelectItem value="all">All Followers</SelectItem>
                                <SelectItem value="micro">Under 10K</SelectItem>
                                <SelectItem value="small">10K - 100K</SelectItem>
                                <SelectItem value="medium">100K - 500K</SelectItem>
                                <SelectItem value="large">500K - 1M</SelectItem>
                                <SelectItem value="mega">1M+</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Effort Level */}
                        <div className="space-y-2">
                          <div className="rounded-lg p-3 bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">Effort</span>
                              {pendingFilters.effort !== 'all' && (
                                <span className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                            <Select
                              value={pendingFilters.effort}
                              onValueChange={(value) => updateFilters('effort', value)}
                            >
                              <SelectTrigger className="w-full h-9 text-sm bg-background">
                                <SelectValue placeholder="Select effort" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border border-border z-[100]">
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="low">🟢 Low</SelectItem>
                                <SelectItem value="medium">🟡 Medium</SelectItem>
                                <SelectItem value="high">🔴 High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                          <div className="rounded-lg p-3 bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">Gender</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {availableGenders.map((g) => (
                                <button
                                  key={g.value}
                                  onClick={() => toggleArrayFilter('gender', g.value)}
                                  className={cn(
                                    "px-2.5 py-1.5 text-sm rounded-lg border transition-colors",
                                    pendingFilters.gender.includes(g.value)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background text-foreground border-border hover:border-primary/50"
                                  )}
                                >
                                  {g.value}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Exclude Filters */}
                        <div className="space-y-2">
                          <div className="rounded-lg p-3 bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <X className="w-4 h-4 text-destructive" />
                              <span className="text-sm font-medium text-muted-foreground">Exclude</span>
                              {(pendingFilters.excludeGenre.length > 0 || pendingFilters.excludeContentStyle.length > 0) && (
                                <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 rounded-full font-medium">
                                  {pendingFilters.excludeGenre.length + pendingFilters.excludeContentStyle.length}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Use the X button next to genres/styles in their filters to exclude them
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
