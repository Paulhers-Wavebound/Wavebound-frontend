import { TrendingUp, Sparkles, Quote, Calendar, type LucideIcon } from 'lucide-react';

export interface GenreButtonConfig {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  prompt: string; // hidden prompt with [genre] and [role] placeholders
}

export interface GenreConfig {
  accent: string; // hex color
  greeting: string;
  subtitle: string;
  genreLabel: string;
  buttons: GenreButtonConfig[];
}

// Shared button factory — all genres use identical prompts, only labels/subtitles vary cosmetically
function makeButtons(genre: string): GenreButtonConfig[] {
  return [
    { icon: TrendingUp, label: `What sounds are trending in ${genre} right now?`, subtitle: `Latest trending sounds in ${genre}`, prompt: "What sounds are trending in [genre] right now?" },
    { icon: Sparkles, label: `What content should I make as a ${genre} artist?`, subtitle: 'Based on top-performing formats', prompt: "What content should I make as a [genre] artist?" },
    { icon: Quote, label: `What content patterns are going viral in ${genre}?`, subtitle: 'From 50x+ performers', prompt: "What content patterns are going viral in [genre]?" },
    { icon: Calendar, label: `Create a 7-day content plan for a ${genre} artist`, subtitle: 'Personalized to your style', prompt: "Create a 7-day content plan for a [genre] artist releasing new music. Base it on what's actually performing in the data right now." },
  ];
}

const hiphop: GenreConfig = {
  accent: '#3B82F6',
  genreLabel: 'Hip-Hop',
  greeting: '🔥 Your niche is moving fast right now.',
  subtitle: '3 new outliers dropped in Hip-Hop since yesterday',
  buttons: makeButtons('Hip-Hop'),
};

const indie: GenreConfig = {
  accent: '#10B981',
  genreLabel: 'Indie',
  greeting: '🌿 Something interesting is happening in Indie.',
  subtitle: 'Bedroom content is outperforming studio 4:1',
  buttons: makeButtons('Indie'),
};

const edm: GenreConfig = {
  accent: '#8B5CF6',
  genreLabel: 'EDM',
  greeting: '⚡ The EDM space is heating up.',
  subtitle: 'Festival content + visualizers dominating this week',
  buttons: makeButtons('EDM'),
};

const pop: GenreConfig = {
  accent: '#EC4899',
  genreLabel: 'Pop',
  greeting: '✨ Pop content is shifting this week.',
  subtitle: 'Stripped-back vocals outperforming produced clips',
  buttons: makeButtons('Pop'),
};

const rock: GenreConfig = {
  accent: '#EF4444',
  genreLabel: 'Rock',
  greeting: '🎸 Rock content is having a moment.',
  subtitle: 'Raw energy + live clips crushing it right now',
  buttons: makeButtons('Rock'),
};

const defaultConfig: GenreConfig = {
  accent: '#3B82F6',
  genreLabel: 'Music',
  greeting: '👋 Your niche has new data.',
  subtitle: 'Fresh outliers ready to explore',
  buttons: makeButtons('music'),
};

export function matchGenreConfig(userGenres: string[]): GenreConfig {
  const joined = userGenres.join(' ').toLowerCase();
  if (/hip.hop|rap|trap|drill/.test(joined)) return hiphop;
  if (/indie|alternative|folk/.test(joined)) return indie;
  if (/edm|electronic|house|techno/.test(joined)) return edm;
  if (/pop|r&b|rnb|soul/.test(joined)) return pop;
  if (/rock|metal|punk/.test(joined)) return rock;
  return defaultConfig;
}

export function interpolatePrompt(prompt: string, genre: string, role: string): string {
  return prompt.replace(/\[genre\]/g, genre || 'music').replace(/\[role\]/g, role || 'artist');
}
