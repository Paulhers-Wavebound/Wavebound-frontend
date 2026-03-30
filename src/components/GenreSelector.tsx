import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, Music, Disc3, Check, X, Search } from "lucide-react";
import { parseGenreJson, parseSubGenreJson } from "@/utils/genreParser";
import { getGenreColor } from "@/utils/tagColors";

interface GenreSelectorProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

const GenreSelector = ({ selectedGenres, onGenresChange }: GenreSelectorProps) => {
  const [genres, setGenres] = useState<string[]>([]);
  const [subGenres, setSubGenres] = useState<string[]>([]);
  const [showSubGenres, setShowSubGenres] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const { data: videosData } = await supabase
        .from('tiktok_videos_all')
        .select('genre, sub_genre');
      
      const { data: carouselsData } = await supabase
        .from('tiktok_photo_carousel')
        .select('genre, sub_genre');
      
      if (videosData || carouselsData) {
        const genreCounts = new Map<string, number>();
        const subGenreCounts = new Map<string, number>();
        
        videosData?.forEach(video => {
          if (video.genre) {
            const genres = parseGenreJson(video.genre);
            genres.forEach(genre => {
              genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
            });
          }
          if (video.sub_genre) {
            const subGenres = parseSubGenreJson(video.sub_genre);
            subGenres.forEach(subGenre => {
              subGenreCounts.set(subGenre, (subGenreCounts.get(subGenre) || 0) + 1);
            });
          }
        });
        
        carouselsData?.forEach(carousel => {
          if (carousel.genre) {
            const genres = parseGenreJson(carousel.genre);
            genres.forEach(genre => {
              genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
            });
          }
          if (carousel.sub_genre) {
            const subGenres = parseSubGenreJson(carousel.sub_genre);
            subGenres.forEach(subGenre => {
              subGenreCounts.set(subGenre, (subGenreCounts.get(subGenre) || 0) + 1);
            });
          }
        });
        
        const allGenres = Array.from(genreCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12) // Show only top 12 main genres
          .map(([genre]) => genre);
        
        const allSubGenres = Array.from(subGenreCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([subGenre]) => subGenre);
        
        setGenres(allGenres);
        setSubGenres(allSubGenres);
      }
    } catch (error) {
      console.error('Error loading genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const selectAllGenres = () => {
    const allMain = [...genres];
    const currentSub = selectedGenres.filter(g => subGenres.includes(g));
    onGenresChange([...new Set([...allMain, ...currentSub])]);
  };

  const selectAllSubGenres = () => {
    const allSub = [...subGenres];
    const currentMain = selectedGenres.filter(g => genres.includes(g));
    onGenresChange([...new Set([...currentMain, ...allSub])]);
  };

  const clearAll = () => {
    onGenresChange([]);
  };

  const selectedMainCount = selectedGenres.filter(g => genres.includes(g)).length;
  const selectedSubCount = selectedGenres.filter(g => subGenres.includes(g)).length;

  const filteredGenres = genres.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSubGenres = subGenres.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 mx-auto animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
        <p className="mt-3 text-muted-foreground">Loading genres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search and Header controls */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedGenres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium"
              >
                {selectedGenres.length} selected
              </motion.div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={selectedGenres.length === 0}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Main Genres Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Genres</h3>
              <p className="text-sm text-muted-foreground">
                {selectedMainCount}/{genres.length} selected
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllGenres}
            className="text-xs"
          >
            <Check className="w-3 h-3 mr-1" />
            Select all
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredGenres.map((genre, index) => {
            const isSelected = selectedGenres.includes(genre);
            
            return (
              <motion.button
                key={genre}
                onClick={() => toggleGenre(genre)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`
                  relative px-3 py-2.5 rounded-lg text-sm font-medium
                  border transition-all duration-200
                  ${isSelected 
                    ? 'border-primary/50 bg-primary/20 text-foreground shadow-sm' 
                    : 'border-border/50 bg-card/50 text-muted-foreground hover:bg-card hover:border-border hover:text-foreground'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSelected && (
                  <motion.div
                    layoutId={`check-${genre}`}
                    className="absolute top-1 right-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="w-3 h-3 text-primary" />
                  </motion.div>
                )}
                <span className="truncate block">{genre}</span>
              </motion.button>
            );
          })}
          {filteredGenres.length === 0 && searchQuery && (
            <p className="col-span-full text-center text-muted-foreground py-4">No genres match "{searchQuery}"</p>
          )}
        </div>
      </div>

      {/* Sub-Genres Section */}
      <div className="space-y-4">
        <button
          onClick={() => setShowSubGenres(!showSubGenres)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-card/30 border border-border/50 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Disc3 className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground">Sub-Genres</h3>
              <p className="text-sm text-muted-foreground">
                {selectedSubCount}/{subGenres.length} selected • {subGenres.length} available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSubGenres ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {(showSubGenres || (searchQuery && filteredSubGenres.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllSubGenres}
                    className="text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Select all sub-genres
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredSubGenres.map((subGenre, index) => {
                    const isSelected = selectedGenres.includes(subGenre);
                    
                    return (
                      <motion.button
                        key={subGenre}
                        onClick={() => toggleGenre(subGenre)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`
                          relative px-3 py-2 rounded-lg text-xs font-medium
                          border transition-all duration-200
                          ${isSelected 
                            ? 'border-accent/50 bg-accent/20 text-foreground shadow-sm' 
                            : 'border-border/30 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:border-border/50 hover:text-foreground'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSelected && (
                          <motion.div
                            className="absolute top-0.5 right-0.5"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-2.5 h-2.5 text-accent-foreground" />
                          </motion.div>
                        )}
                        <span className="truncate block">{subGenre}</span>
                      </motion.button>
                    );
                  })}
                  {filteredSubGenres.length === 0 && searchQuery && (
                    <p className="col-span-full text-center text-muted-foreground py-4">No sub-genres match "{searchQuery}"</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GenreSelector;
