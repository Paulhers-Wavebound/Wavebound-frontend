import { Video, PhotoCarousel, ContentItem } from '@/types/content';
import { parseGenreJson, parseSubGenreJson } from './genreParser';

/**
 * Parse genre/sub-genre data and extract confidence scores
 * Format: {"Hiphop": 9.2, "Pop": 7.2, "R&B": 5.0}
 * Returns map of genre name -> confidence score
 */
export const parseGenreWithScores = (genreData: any): Map<string, number> => {
  const scoreMap = new Map<string, number>();
  
  if (!genreData) return scoreMap;
  
  try {
    // If we already have an object with scores, use it directly
    if (typeof genreData === 'object') {
      const parsed = genreData as Record<string, number>;
      Object.entries(parsed).forEach(([genre, score]) => {
        scoreMap.set(genre.toLowerCase().trim(), Number(score));
      });
    } else if (typeof genreData === 'string') {
      const str = genreData as string;
      // Check if it's JSON format with scores
      if (str.includes('{') && str.includes(':')) {
        const parsed = JSON.parse(str.replace(/'/g, '"')) as Record<string, number>;
        Object.entries(parsed).forEach(([genre, score]) => {
          scoreMap.set(genre.toLowerCase().trim(), Number(score));
        });
      } else {
        // Plain string format - assign default score of 5.0
        const genres = str.split(/[,/]/).map(g => g.trim()).filter(g => g);
        genres.forEach(genre => {
          scoreMap.set(genre.toLowerCase().trim(), 5.0);
        });
      }
    }
  } catch (error) {
    console.warn('Error parsing genre scores:', error);
  }
  
  return scoreMap;
};

/**
 * Calculate relevance score for a content item based on audio analysis genres
 * 
 * Scoring logic:
 * - Content with multiple matching genres: multiply their confidence scores (highest priority)
 * - Content with single matching genre: use that confidence score
 * - Content with no matching genres: score of 0 (filtered out)
 * 
 * Example:
 * Audio has: {"Hiphop": 9.2, "Pop": 7.2, "R&B": 5.0}
 * - Content with Hiphop + Pop tags → 9.2 × 7.2 = 66.24
 * - Content with only Hiphop → 9.2
 * - Content with only R&B → 5.0
 * - Content with Jazz → 0 (no match)
 */
export const calculateContentRelevanceScore = (
  content: ContentItem,
  audioGenreScores: Map<string, number>,
  audioSubGenreScores: Map<string, number>
): number => {
  // Parse content's genres and sub-genres with better error handling
  let contentGenres: string[] = [];
  let contentSubGenres: string[] = [];
  
  try {
    contentGenres = parseGenreJson(content.genre || '').map(g => g.toLowerCase().trim());
  } catch (error) {
    // Fallback: try simple string split
    contentGenres = (content.genre || '')
      .split(/[,/]/)
      .map(g => g.trim().toLowerCase())
      .filter(g => g && g.length > 0);
  }
  
  try {
    contentSubGenres = parseSubGenreJson(content.sub_genre || '').map(sg => sg.toLowerCase().trim());
  } catch (error) {
    // Fallback: try simple string split
    contentSubGenres = (content.sub_genre || '')
      .split(/[,/]/)
      .map(sg => sg.trim().toLowerCase())
      .filter(sg => sg && sg.length > 0);
  }
  
  // Find matching genres with their scores
  const matchingGenreScores: number[] = [];
  contentGenres.forEach(genre => {
    const score = audioGenreScores.get(genre);
    if (score !== undefined) {
      matchingGenreScores.push(score);
    }
  });
  
  // Find matching sub-genres with their scores (weighted higher for exact matches)
  const matchingSubGenreScores: number[] = [];
  contentSubGenres.forEach(subGenre => {
    const score = audioSubGenreScores.get(subGenre);
    if (score !== undefined) {
      // Boost sub-genre matches by 1.5x to prioritize them
      matchingSubGenreScores.push(score * 1.5);
    }
  });
  
  // Combine all matching scores
  const allMatchingScores = [...matchingGenreScores, ...matchingSubGenreScores];
  
  // No matches = 0 score
  if (allMatchingScores.length === 0) {
    return 0;
  }
  
  // Single match = use that score
  if (allMatchingScores.length === 1) {
    return allMatchingScores[0];
  }
  
  // Multiple matches = add scores together (changed from multiply to add)
  // This ensures high-confidence matches like instrumental (1.0) dominate
  return allMatchingScores.reduce((sum, score) => sum + score, 0);
};

/**
 * Sort content by relevance score (highest first)
 * Does NOT filter out content - just sorts it so best matches appear first
 */
export const sortContentByRelevance = <T extends ContentItem>(
  content: T[],
  audioGenreScores: Map<string, number>,
  audioSubGenreScores: Map<string, number>
): T[] => {
  return content
    .map(item => ({
      item,
      score: calculateContentRelevanceScore(item, audioGenreScores, audioSubGenreScores)
    }))
    // Sort by score descending - matching content at top, non-matching at bottom
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
};

/**
 * Get sorted genres/sub-genres by confidence score
 * Returns array of [name, score] tuples sorted by score descending
 */
export const getSortedGenresWithScores = (genreData: string | null | undefined): [string, number][] => {
  const scoreMap = parseGenreWithScores(genreData);
  return Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1]);
};
