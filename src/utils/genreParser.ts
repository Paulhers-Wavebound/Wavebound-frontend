/**
 * Parse JSON-formatted genre data from photo carousels
 * Format: {"R&B":0.95,"Singer-Songwriter":0.9,"Pop":0.8}
 * Returns array of genre names sorted by confidence score (highest first)
 */
export const parseGenreJson = (genreData: string | null | undefined): string[] => {
  if (!genreData) return [];
  
  try {
    // If it's already a plain string (old format), return it as array
    if (!genreData.includes('{') && !genreData.includes(':')) {
      return genreData.split(/[,/]/).map(g => g.trim()).filter(g => g);
    }
    
    // Parse JSON format
    const parsed = JSON.parse(genreData);
    
    // Convert to array of [genre, score] and sort by score
    const entries = Object.entries(parsed) as [string, number][];
    return entries
      .sort((a, b) => b[1] - a[1]) // Sort by confidence score descending
      .map(([genre]) => genre);
  } catch (error) {
    // Fallback: try to parse as comma-separated
    console.warn('Error parsing genre JSON:', error);
    return genreData.split(/[,/]/).map(g => g.trim()).filter(g => g);
  }
};

/**
 * Parse JSON-formatted sub-genre data
 * Same format as genre data
 */
export const parseSubGenreJson = (subGenreData: string | null | undefined): string[] => {
  return parseGenreJson(subGenreData);
};

/**
 * Get the primary genre (highest confidence)
 */
export const getPrimaryGenre = (genreData: string | null | undefined): string | null => {
  const genres = parseGenreJson(genreData);
  return genres.length > 0 ? genres[0] : null;
};

/**
 * Get the primary sub-genre (highest confidence)
 */
export const getPrimarySubGenre = (subGenreData: string | null | undefined): string | null => {
  const subGenres = parseSubGenreJson(subGenreData);
  return subGenres.length > 0 ? subGenres[0] : null;
};

/**
 * Check if content has a specific genre
 */
export const hasGenre = (genreData: string | null | undefined, targetGenre: string): boolean => {
  const genres = parseGenreJson(genreData);
  return genres.some(g => g.toLowerCase() === targetGenre.toLowerCase());
};

/**
 * Check if content has a specific sub-genre
 */
export const hasSubGenre = (subGenreData: string | null | undefined, targetSubGenre: string): boolean => {
  const subGenres = parseSubGenreJson(subGenreData);
  return subGenres.some(sg => sg.toLowerCase() === targetSubGenre.toLowerCase());
};

/**
 * Extract genre confidence scores from JSON
 * Format: {"Hiphop": 9.2, "Pop": 7.2}
 * Returns map of genre -> confidence score
 */
export const getGenreScores = (genreData: string | null | undefined): Map<string, number> => {
  const scores = new Map<string, number>();
  
  if (!genreData) return scores;
  
  try {
    if (genreData.includes('{') && genreData.includes(':')) {
      const parsed = JSON.parse(genreData);
      Object.entries(parsed).forEach(([genre, score]) => {
        scores.set(genre, Number(score));
      });
    }
  } catch (error) {
    console.warn('Error parsing genre scores:', error);
  }
  
  return scores;
};
