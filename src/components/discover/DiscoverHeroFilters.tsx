import React, { useState, useMemo, memo } from 'react';
import { Search, Sparkles, Music, Video, X, Filter, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { SongUploadDialog, AudioAnalysisResult } from './SongUploadDialog';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

interface DiscoverHeroFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onReset?: () => void;
  onApply?: () => void;
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  selectedSubGenres: string[];
  onSubGenresChange: (subGenres: string[]) => void;
  selectedContentStyles: string[];
  onContentStylesChange: (styles: string[]) => void;
  selectedViralScore: string;
  onViralScoreChange: (score: string) => void;
  selectedMinViews: string;
  onMinViewsChange: (views: string) => void;
  selectedQuickFilter: string;
  onQuickFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  resultsCount: number;
  availableGenres: string[];
  availableSubGenres: string[];
  availableContentStyles: string[];
  // Audio analysis filter
  audioAnalysis?: AudioAnalysisResult | null;
  onAudioAnalysisComplete?: (analysis: AudioAnalysisResult) => void;
  onClearAudioFilter?: () => void;
}

const VIRAL_SCORES = [
  { value: 'any', label: 'All' },
  { value: '10', label: '10x+ their average' },
  { value: '5', label: '5x+ their average' },
  { value: '2', label: '2x+ their average' },
];

const MIN_VIEWS = [
  { value: 'any', label: 'Any Views' },
  { value: '1000000', label: '1M+' },
  { value: '500000', label: '500K+' },
  { value: '100000', label: '100K+' },
  { value: '50000', label: '50K+' },
];

const SORT_OPTIONS = [
  { value: 'viral', label: 'Most Viral' },
  { value: 'latest', label: 'Latest' },
  { value: 'views', label: 'Most Views' },
];

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VideoUploadDialog({ open, onOpenChange }: VideoUploadDialogProps) {
  const [linkValue, setLinkValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    console.log('Uploading video:', { link: linkValue, file: selectedFile });
    onOpenChange(false);
    setLinkValue('');
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Upload Video
          </DialogTitle>
          <DialogDescription>
            Upload a video file or paste a TikTok link
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Paste Link</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4 mt-4">
            <Input
              placeholder="https://www.tiktok.com/@user/video/..."
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!linkValue.trim()}
              className="w-full"
            >
              Submit Link
            </Button>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload"
              />
              <label 
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Video className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : 'Click to select a video file'}
                </span>
              </label>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedFile}
              className="w-full"
            >
              Upload Video
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function DiscoverHeroFilters({
  searchQuery,
  onSearchChange,
  onSearch,
  onReset,
  selectedGenres,
  onGenresChange,
  selectedSubGenres,
  onSubGenresChange,
  selectedContentStyles,
  onContentStylesChange,
  selectedViralScore,
  onViralScoreChange,
  selectedMinViews,
  onMinViewsChange,
  sortBy,
  onSortChange,
  resultsCount,
  availableGenres,
  availableSubGenres,
  availableContentStyles,
  audioAnalysis,
  onAudioAnalysisComplete,
  onClearAudioFilter,
  onApply,
}: DiscoverHeroFiltersProps) {
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const handleSongAnalysisComplete = (analysis: AudioAnalysisResult) => {
    if (onAudioAnalysisComplete) {
      onAudioAnalysisComplete(analysis);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedGenres.length > 0 ||
      selectedSubGenres.length > 0 ||
      selectedContentStyles.length > 0 ||
      selectedViralScore !== 'any' ||
      selectedMinViews !== 'any' ||
      searchQuery.trim() !== ''
    );
  }, [selectedGenres, selectedSubGenres, selectedContentStyles, selectedViralScore, selectedMinViews, searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    onSearchChange('');
    onGenresChange([]);
    onSubGenresChange([]);
    onContentStylesChange([]);
    onViralScoreChange('any');
    onMinViewsChange('any');
    if (onReset) {
      onReset();
    } else {
      onSearch();
    }
    const scrollContainer = document.querySelector('[data-discover-scroll]') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedGenres.length > 0) count += selectedGenres.length;
    if (selectedSubGenres.length > 0) count += selectedSubGenres.length;
    if (selectedContentStyles.length > 0) count += selectedContentStyles.length;
    if (selectedViralScore !== 'any') count++;
    if (selectedMinViews !== 'any') count++;
    return count;
  }, [selectedGenres, selectedSubGenres, selectedContentStyles, selectedViralScore, selectedMinViews]);

  // Shared filter controls (used in both desktop inline and mobile drawer)
  const filterControls = (
    <>
      {/* Genre - Multi-select */}
      <MultiSelectDropdown
        label="Genre"
        options={availableGenres}
        selected={selectedGenres}
        onChange={onGenresChange}
        placeholder="All Genres"
        className="w-full md:w-[140px]"
      />

      {/* Sub-Genre - Multi-select */}
      <MultiSelectDropdown
        label="Sub-Genre"
        options={availableSubGenres}
        selected={selectedSubGenres}
        onChange={onSubGenresChange}
        placeholder="All Sub-Genres"
        className="w-full md:w-[140px]"
      />

      {/* Content Style - Multi-select */}
      <MultiSelectDropdown
        label="Style"
        options={availableContentStyles}
        selected={selectedContentStyles}
        onChange={onContentStylesChange}
        placeholder="All Styles"
        className="w-full md:w-[160px]"
      />

      {/* Performance */}
      <Select value={selectedViralScore} onValueChange={onViralScoreChange}>
        <SelectTrigger className={cn(
          "w-full md:w-[140px] h-10 text-sm rounded-xl border-transparent bg-background",
          "shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06),0_1px_2px_-1px_hsl(var(--foreground)/0.04)]",
          "hover:shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.1)] hover:translate-y-[-0.5px]",
          "transition-all duration-200",
          selectedViralScore !== 'any' && "border-primary/30 bg-primary/5 shadow-[0_2px_10px_-2px_hsl(var(--primary)/0.15)]"
        )}>
          <SelectValue placeholder="Performance" />
        </SelectTrigger>
        <SelectContent>
          {VIRAL_SCORES.map((score) => (
            <SelectItem key={score.value} value={score.value}>
              {score.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Min Views */}
      <Select value={selectedMinViews} onValueChange={onMinViewsChange}>
        <SelectTrigger className={cn(
          "w-full md:w-[130px] h-10 text-sm rounded-xl border-transparent bg-background",
          "shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06),0_1px_2px_-1px_hsl(var(--foreground)/0.04)]",
          "hover:shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.1)] hover:translate-y-[-0.5px]",
          "transition-all duration-200",
          selectedMinViews !== 'any' && "border-primary/30 bg-primary/5 shadow-[0_2px_10px_-2px_hsl(var(--primary)/0.15)]"
        )}>
          <SelectValue placeholder="Min Views" />
        </SelectTrigger>
        <SelectContent>
          {MIN_VIEWS.map((views) => (
            <SelectItem key={views.value} value={views.value}>
              {views.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-3 md:px-6 py-5 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Viral Content Library</h2>
            <p className="text-sm text-muted-foreground">Find what's working right now</p>
          </div>
        </div>

        {/* Audio Filter Active Banner */}
        {audioAnalysis && (
          <div className="mb-4">
            <div className="bg-primary/10 border-0 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">
                  Filtering by your song: <strong>{audioAnalysis.genre}</strong>
                  {audioAnalysis.mood && <span className="text-muted-foreground"> • {audioAnalysis.mood}</span>}
                  {audioAnalysis.bpm && <span className="text-muted-foreground"> • {audioAnalysis.bpm} BPM</span>}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAudioFilter}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Row */}
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-foreground transition-colors" />
              <Input
                placeholder="Search by mood, style, artist..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "pl-11 pr-4 h-[52px] bg-background border-border/15 rounded-2xl text-base",
                  "shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06),0_1px_2px_-1px_hsl(var(--foreground)/0.04)]",
                  "hover:shadow-[0_4px_16px_-4px_hsl(var(--foreground)/0.1),0_2px_4px_-2px_hsl(var(--foreground)/0.06)]",
                  "focus-visible:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.15),0_2px_4px_-2px_hsl(var(--foreground)/0.06)]",
                  "focus-visible:border-primary/30 focus-visible:ring-0 focus-visible:ring-offset-0",
                  "transition-all duration-300",
                  searchQuery.trim() && "pr-10"
                )}
              />
              {searchQuery.trim() && (
                <button
                  onClick={handleResetFilters}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button 
              onClick={onSearch}
              className={cn(
                "h-[52px] px-6 md:px-8 gap-2.5 rounded-2xl font-medium text-base",
                "shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)]",
                "hover:shadow-[0_6px_20px_-3px_hsl(var(--primary)/0.5)]",
                "hover:translate-y-[-1px] active:translate-y-[0px]",
                "transition-all duration-200"
              )}
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
            </Button>
          </div>

          {/* Mobile: Filters button + Sort */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(true)}
              className="h-10 gap-2 rounded-xl border-transparent shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)] hover:shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.1)] hover:translate-y-[-0.5px] transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 gap-1.5 text-muted-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[120px] h-10 text-sm rounded-xl border-transparent shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)] hover:shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.1)] hover:translate-y-[-0.5px] transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop: Inline Filters Row */}
          <div className="hidden md:flex flex-wrap items-center gap-3">
            {/* Filter Icon with badge */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>

            {filterControls}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Reset button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[130px] h-10 text-sm rounded-xl border-transparent shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)] hover:shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.1)] hover:translate-y-[-0.5px] transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips - visible on all sizes */}
        {(selectedGenres.length > 0 || selectedSubGenres.length > 0 || selectedContentStyles.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-3">
            {selectedGenres.map(g => (
              <Badge key={`genre-${g}`} variant="secondary" className="gap-1 pr-1.5 text-xs">
                {g}
                <button
                  onClick={() => {
                    onGenresChange(selectedGenres.filter(x => x !== g));
                    setTimeout(() => onApply?.(), 0);
                  }}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                  aria-label={`Remove ${g}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {selectedSubGenres.map(sg => (
              <Badge key={`sub-${sg}`} variant="secondary" className="gap-1 pr-1.5 text-xs">
                {sg}
                <button
                  onClick={() => {
                    onSubGenresChange(selectedSubGenres.filter(x => x !== sg));
                    setTimeout(() => onApply?.(), 0);
                  }}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                  aria-label={`Remove ${sg}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {selectedContentStyles.map(s => (
              <Badge key={`style-${s}`} variant="secondary" className="gap-1 pr-1.5 text-xs">
                {s}
                <button
                  onClick={() => {
                    onContentStylesChange(selectedContentStyles.filter(x => x !== s));
                    setTimeout(() => onApply?.(), 0);
                  }}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                  aria-label={`Remove ${s}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
            {filterControls}
          </div>
          <DrawerFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                handleResetFilters();
                setMobileFilterOpen(false);
              }}
            >
              Reset
            </Button>
            <DrawerClose asChild>
              <Button
                className="flex-1"
                onClick={() => {
                  onSearch();
                  setMobileFilterOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Upload Dialogs */}
      <SongUploadDialog 
        open={songDialogOpen} 
        onOpenChange={setSongDialogOpen}
        onAnalysisComplete={handleSongAnalysisComplete}
      />
      <VideoUploadDialog 
        open={videoDialogOpen} 
        onOpenChange={setVideoDialogOpen}
      />
    </div>
  );
}
