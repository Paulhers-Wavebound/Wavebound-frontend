import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, X, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface FilterState {
  genre: string[];
  subGenre: string[];
  contentStyle: string[];
  gender: string[];
  platform: string[];
  performanceRange: string;
  followerRange: string;
  effort: string;
  excludeGenre: string[];
  excludeContentStyle: string[];
}

interface HeroGuideProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableGenres: { genre: string; count: number; percentage: number }[];
  availableContentStyles: { style: string; count: number; percentage: number }[];
  sortBy: string;
  onSortChange: (value: string) => void;
  totalResults?: number;
}

const CONTENT_STYLE_TABS = [
  'Trending Now',
  'Hook Statements',
  'Selfie Performance',
  'Covers',
  'Lipsync',
  'Live Performance',
];

const VIRAL_SCORE_OPTIONS = [
  { value: 'all', label: 'Any Score' },
  { value: '10x+', label: '10x+ Viral' },
  { value: '5x+', label: '5x+ Viral' },
  { value: '3x+', label: '3x+ Viral' },
  { value: '2x+', label: '2x+ Viral' },
];

const MIN_VIEWS_OPTIONS = [
  { value: 'all', label: 'Any Views' },
  { value: '10m+', label: '10M+ Views' },
  { value: '5m+', label: '5M+ Views' },
  { value: '1m+', label: '1M+ Views' },
  { value: '500k+', label: '500K+ Views' },
  { value: '100k+', label: '100K+ Views' },
];

const HeroGuide: React.FC<HeroGuideProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  setFilters,
  availableGenres,
  availableContentStyles,
  sortBy,
  onSortChange,
  totalResults,
}) => {
  const [selectedTab, setSelectedTab] = useState('Trending Now');

  // Get all active filters for display
  const activeFilters = [
    ...filters.genre.map(g => ({ type: 'genre', value: g })),
    ...filters.contentStyle.map(cs => ({ type: 'contentStyle', value: cs })),
    ...(filters.performanceRange !== 'all' ? [{ type: 'performance', value: filters.performanceRange }] : []),
    ...(filters.followerRange !== 'all' ? [{ type: 'followers', value: filters.followerRange }] : []),
  ];

  const clearFilter = (type: string, value: string) => {
    setFilters(prev => {
      if (type === 'genre') {
        return { ...prev, genre: prev.genre.filter(g => g !== value) };
      }
      if (type === 'contentStyle') {
        return { ...prev, contentStyle: prev.contentStyle.filter(cs => cs !== value) };
      }
      if (type === 'performance') {
        return { ...prev, performanceRange: 'all' };
      }
      if (type === 'followers') {
        return { ...prev, followerRange: 'all' };
      }
      return prev;
    });
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      ...prev,
      genre: [],
      contentStyle: [],
      performanceRange: 'all',
      followerRange: 'all',
    }));
  };

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
    if (tab === 'Trending Now') {
      setFilters(prev => ({ ...prev, contentStyle: [] }));
    } else {
      // Map tab names to content style values
      const tabToStyle: Record<string, string> = {
        'Hook Statements': 'Hook Statement',
        'Selfie Performance': 'Selfie Performance',
        'Covers': 'Cover',
        'Lipsync': 'Selfie Lipsync',
        'Live Performance': 'Live Performance',
      };
      const style = tabToStyle[tab];
      if (style) {
        setFilters(prev => ({ ...prev, contentStyle: [style] }));
      }
    }
  };

  return (
    <div className="relative pt-8 pb-6 px-6 overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Subtle gradient blobs */}
      <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
        <div className="absolute top-10 left-[20%] w-80 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-[15%] w-96 h-32 bg-primary/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center space-y-4 mb-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/30"
          >
            <Sparkles className="w-4 h-4" />
            Viral Content Library
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight"
          >
            Discover what's <span className="italic text-primary">working</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-base max-w-xl mx-auto"
          >
            Browse viral videos from creators blowing up right now.
          </motion.p>
        </div>

        {/* Filter Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative flex items-center gap-3">
            <form 
              className="relative flex-1 flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                // Search is handled reactively via onSearchChange
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Search by artist, genre, or keyword..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-12 pr-4 py-5 text-base rounded-xl border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-5 h-auto gap-2 font-medium"
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
            </form>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Genre */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Genre</label>
              <Select
                value={filters.genre[0] || 'all'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  genre: value === 'all' ? [] : [value]
                }))}
              >
                <SelectTrigger className="bg-slate-700/80 border-slate-600 text-white rounded-lg h-11">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">All Genres</SelectItem>
                  {availableGenres.slice(0, 15).map(g => (
                    <SelectItem key={g.genre} value={g.genre} className="text-white hover:bg-slate-700">
                      {g.genre} ({g.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content Style */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Content Style</label>
              <Select
                value={filters.contentStyle[0] || 'all'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  contentStyle: value === 'all' ? [] : [value]
                }))}
              >
                <SelectTrigger className="bg-slate-700/80 border-slate-600 text-white rounded-lg h-11">
                  <SelectValue placeholder="All Styles" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">All Styles</SelectItem>
                  {availableContentStyles.slice(0, 15).map(s => (
                    <SelectItem key={s.style} value={s.style} className="text-white hover:bg-slate-700">
                      {s.style} ({s.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Viral Score */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Viral Score</label>
              <Select
                value={filters.performanceRange}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  performanceRange: value
                }))}
              >
                <SelectTrigger className="bg-primary border-primary text-primary-foreground rounded-lg h-11 hover:bg-primary/90">
                  <SelectValue placeholder="Any Score" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {VIRAL_SCORE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min Views */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Min Views</label>
              <Select
                value={filters.followerRange}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  followerRange: value
                }))}
              >
                <SelectTrigger className="bg-primary border-primary text-primary-foreground rounded-lg h-11 hover:bg-primary/90">
                  <SelectValue placeholder="Any Views" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {MIN_VIEWS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-700">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">Active:</span>
              {activeFilters.map((filter, idx) => (
                <button
                  key={`${filter.type}-${filter.value}-${idx}`}
                  onClick={() => clearFilter(filter.type, filter.value)}
                  className="inline-flex items-center gap-1.5 bg-violet-500/80 text-white text-xs px-3 py-1.5 rounded-full hover:bg-violet-600 transition-colors"
                >
                  {filter.value}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-400 hover:text-white ml-auto transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
            {CONTENT_STYLE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTab === tab
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Results Count & Sort */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <span className="text-sm text-slate-400">
              Showing <span className="text-white font-medium">{totalResults || 0}</span> results
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Sort:</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="bg-slate-700/60 border-slate-600 text-white rounded-lg h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="popular" className="text-white hover:bg-slate-700">Most Viral</SelectItem>
                  <SelectItem value="latest" className="text-white hover:bg-slate-700">Latest</SelectItem>
                  <SelectItem value="views" className="text-white hover:bg-slate-700">Most Views</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroGuide;
