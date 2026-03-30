// Universal color coding system for genres and content categories
// All colors use HSL format for consistency with the design system

export const GENRE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // Rock & Metal
  'Rock': { bg: 'hsl(0, 70%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(0, 70%, 40%)' },
  'Alternative Rock': { bg: 'hsl(15, 65%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(15, 65%, 45%)' },
  'Indie Rock': { bg: 'hsl(30, 70%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(30, 70%, 50%)' },
  'Metal': { bg: 'hsl(0, 0%, 20%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(0, 0%, 10%)' },
  'Hard Rock': { bg: 'hsl(10, 75%, 45%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(10, 75%, 35%)' },
  
  // Pop & Dance
  'Pop': { bg: 'hsl(330, 80%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(330, 80%, 50%)' },
  'Dance': { bg: 'hsl(280, 70%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(280, 70%, 50%)' },
  'Electronic': { bg: 'hsl(260, 75%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(260, 75%, 45%)' },
  'EDM': { bg: 'hsl(270, 80%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(270, 80%, 50%)' },
  'Synth-pop': { bg: 'hsl(290, 70%, 65%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(290, 70%, 55%)' },
  
  // Hip Hop & R&B
  'Hip Hop': { bg: 'hsl(40, 80%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(40, 80%, 40%)' },
  'Rap': { bg: 'hsl(45, 75%, 45%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(45, 75%, 35%)' },
  'R&B': { bg: 'hsl(200, 60%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(200, 60%, 40%)' },
  'Soul': { bg: 'hsl(210, 65%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(210, 65%, 45%)' },
  'Trap': { bg: 'hsl(50, 85%, 55%)', text: 'hsl(0, 0%, 0%)', border: 'hsl(50, 85%, 45%)' },
  
  // Country & Folk
  'Country': { bg: 'hsl(35, 70%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(35, 70%, 45%)' },
  'Folk': { bg: 'hsl(25, 60%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(25, 60%, 40%)' },
  'Americana': { bg: 'hsl(20, 65%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(20, 65%, 45%)' },
  
  // Jazz & Blues
  'Jazz': { bg: 'hsl(220, 50%, 45%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(220, 50%, 35%)' },
  'Blues': { bg: 'hsl(215, 60%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(215, 60%, 40%)' },
  
  // Latin & World
  'Latin': { bg: 'hsl(5, 80%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(5, 80%, 45%)' },
  'Reggaeton': { bg: 'hsl(355, 75%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(355, 75%, 50%)' },
  'Afrobeat': { bg: 'hsl(30, 85%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(30, 85%, 45%)' },
  
  // Other
  'Indie': { bg: 'hsl(180, 60%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(180, 60%, 40%)' },
  'Alternative': { bg: 'hsl(170, 55%, 45%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(170, 55%, 35%)' },
  'Punk': { bg: 'hsl(345, 80%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(345, 80%, 40%)' },
  'Funk': { bg: 'hsl(280, 65%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(280, 65%, 45%)' },
  'Disco': { bg: 'hsl(300, 70%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(300, 70%, 50%)' },
};

export const CONTENT_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Hook Statement': { bg: 'hsl(280, 65%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(280, 65%, 45%)' },
  'Selfie Performance': { bg: 'hsl(340, 70%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(340, 70%, 50%)' },
  'Selfie Lipsync': { bg: 'hsl(320, 75%, 65%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(320, 75%, 55%)' },
  'Pro Camera Lipsync': { bg: 'hsl(200, 70%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(200, 70%, 45%)' },
  'Live Performance': { bg: 'hsl(20, 75%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(20, 75%, 45%)' },
  'Lyric Video': { bg: 'hsl(180, 65%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(180, 65%, 40%)' },
  'Cover': { bg: 'hsl(140, 60%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(140, 60%, 40%)' },
  'Meme': { bg: 'hsl(50, 85%, 60%)', text: 'hsl(0, 0%, 0%)', border: 'hsl(50, 85%, 50%)' },
  'Transition': { bg: 'hsl(270, 70%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(270, 70%, 50%)' },
  'Fast Pace': { bg: 'hsl(350, 75%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(350, 75%, 45%)' },
  'Production': { bg: 'hsl(230, 65%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(230, 65%, 45%)' },
  'Compilation Visuals': { bg: 'hsl(160, 60%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(160, 60%, 40%)' },
  'Cinematic Edit': { bg: 'hsl(250, 70%, 60%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(250, 70%, 50%)' },
  'Instrument Performance': { bg: 'hsl(30, 65%, 55%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(30, 65%, 45%)' },
  'Photo Carousel': { bg: 'hsl(290, 75%, 65%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(290, 75%, 55%)' },
};

// Helper function to get genre color
export const getGenreColor = (genre: string) => {
  const normalized = genre.trim();
  return GENRE_COLORS[normalized] || {
    bg: 'hsl(220, 60%, 55%)',
    text: 'hsl(0, 0%, 100%)',
    border: 'hsl(220, 60%, 45%)'
  };
};

// Helper function to get content category color
export const getContentCategoryColor = (category: string) => {
  const normalized = category.trim();
  return CONTENT_CATEGORY_COLORS[normalized] || {
    bg: 'hsl(180, 55%, 50%)',
    text: 'hsl(0, 0%, 100%)',
    border: 'hsl(180, 55%, 40%)'
  };
};

// Helper function to determine if a tag is a genre or content category
export const getTagColor = (tag: string, type: 'genre' | 'content' | 'auto' = 'auto') => {
  if (type === 'genre') return getGenreColor(tag);
  if (type === 'content') return getContentCategoryColor(tag);
  
  // Auto-detect
  if (GENRE_COLORS[tag.trim()]) return getGenreColor(tag);
  if (CONTENT_CATEGORY_COLORS[tag.trim()]) return getContentCategoryColor(tag);
  
  // Default fallback
  return getGenreColor(tag);
};
