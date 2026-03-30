import { Flame, Music, Video, Sparkles, TrendingUp, Mic2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServerFilterState } from '@/hooks/useServerFilters';

export interface DiscoveryPreset {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  filters: Partial<ServerFilterState>;
  gradient: string;
}

const presets: DiscoveryPreset[] = [
  {
    id: 'viral-hiphop',
    label: 'Viral Hip-Hop',
    icon: <Flame className="w-4 h-4" />,
    description: 'High-performing rap & hip-hop content',
    filters: {
      genre: ['Hip-Hop', 'Rap'],
      performanceRange: 'viral',
    },
    gradient: 'from-orange-500/20 to-red-500/20',
  },
  {
    id: 'trending-pop',
    label: 'Trending Pop',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Popular pop music moments',
    filters: {
      genre: ['Pop'],
      performanceRange: 'high',
    },
    gradient: 'from-pink-500/20 to-purple-500/20',
  },
  {
    id: 'lipsync-hits',
    label: 'Lipsync Hits',
    icon: <Mic2 className="w-4 h-4" />,
    description: 'Best lipsync performances',
    filters: {
      contentStyle: ['Lipsync'],
      performanceRange: 'high',
    },
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'studio-sessions',
    label: 'Studio Sessions',
    icon: <Music className="w-4 h-4" />,
    description: 'Behind-the-scenes studio content',
    filters: {
      contentStyle: ['Studio', 'BTS'],
    },
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'performance-clips',
    label: 'Live Performances',
    icon: <Video className="w-4 h-4" />,
    description: 'Concert & live performance clips',
    filters: {
      contentStyle: ['Performance', 'Live'],
    },
    gradient: 'from-violet-500/20 to-indigo-500/20',
  },
  {
    id: 'rising-creators',
    label: 'Rising Creators',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Viral content from small accounts',
    filters: {
      followerRange: 'micro',
      performanceRange: 'viral',
    },
    gradient: 'from-amber-500/20 to-yellow-500/20',
  },
];

interface DiscoveryPresetsProps {
  onSelectPreset: (filters: Partial<ServerFilterState>, presetId?: string) => void;
  activePresetId?: string | null;
}

export const DiscoveryPresets = ({ onSelectPreset, activePresetId }: DiscoveryPresetsProps) => {
  const handleSelect = (preset: DiscoveryPreset) => {
    if (activePresetId === preset.id) {
      onSelectPreset({});
    } else {
      onSelectPreset(preset.filters, preset.id);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Quick Discovery</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset)}
            className={cn(
              'group relative flex flex-col items-start gap-1 p-3 rounded-lg border transition-all duration-200 text-left',
              'hover:border-primary/50 hover:shadow-sm',
            activePresetId === preset.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/50 bg-card/50'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 rounded-lg bg-gradient-to-br opacity-0 transition-opacity',
                preset.gradient,
                activePresetId === preset.id ? 'opacity-100' : 'group-hover:opacity-50'
              )}
            />
            <div className="relative flex items-center gap-2">
              <span
                className={cn(
                  'text-muted-foreground transition-colors',
                  activePresetId === preset.id && 'text-primary'
                )}
              >
                {preset.icon}
              </span>
              <span className="text-sm font-medium">{preset.label}</span>
            </div>
            <p className="relative text-xs text-muted-foreground line-clamp-1">
              {preset.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
