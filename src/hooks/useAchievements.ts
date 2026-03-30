import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<string, { title: string; description: string; icon: string }> = {
  'first_analysis': {
    title: 'First Analysis',
    description: 'Analyzed your first TikTok profile',
    icon: '🔍',
  },
  'five_analyses': {
    title: 'Trend Watcher',
    description: 'Analyzed 5 different profiles',
    icon: '👀',
  },
  'first_plan': {
    title: 'Content Planner',
    description: 'Created your first content plan',
    icon: '📅',
  },
  'first_favorite': {
    title: 'Curator',
    description: 'Saved your first video to favorites',
    icon: '⭐',
  },
  'first_referral': {
    title: 'Community Builder',
    description: 'Invited your first friend to Wavebound',
    icon: '🤝',
  },
  'power_user': {
    title: 'Power User',
    description: 'Used Wavebound for 7 days in a row',
    icon: '🔥',
  },
  'explorer': {
    title: 'Explorer',
    description: 'Browsed 100+ videos in the library',
    icon: '🧭',
  },
  'early_adopter': {
    title: 'Early Adopter',
    description: 'Joined Wavebound in its first year',
    icon: '🚀',
  },
};

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const formattedAchievements = data.map((a: any) => ({
          id: a.id,
          type: a.achievement_type,
          title: ACHIEVEMENT_DEFINITIONS[a.achievement_type]?.title || a.achievement_type,
          description: ACHIEVEMENT_DEFINITIONS[a.achievement_type]?.description || '',
          icon: ACHIEVEMENT_DEFINITIONS[a.achievement_type]?.icon || '🏆',
          unlockedAt: a.unlocked_at,
        }));
        setAchievements(formattedAchievements);
      }
      setLoading(false);
    };

    fetchAchievements();
  }, []);

  const unlockAchievement = useCallback(async (achievementType: string) => {
    if (!userId) return false;

    // Check if already unlocked
    const existing = achievements.find(a => a.type === achievementType);
    if (existing) return false;

    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_type: achievementType,
      });

    if (!error) {
      const definition = ACHIEVEMENT_DEFINITIONS[achievementType];
      if (definition) {
        toast({
          title: `🏆 Achievement Unlocked!`,
          description: `${definition.icon} ${definition.title}: ${definition.description}`,
        });

        setAchievements(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: achievementType,
            title: definition.title,
            description: definition.description,
            icon: definition.icon,
            unlockedAt: new Date().toISOString(),
          },
        ]);
      }
      return true;
    }
    return false;
  }, [userId, achievements]);

  const hasAchievement = useCallback((achievementType: string) => {
    return achievements.some(a => a.type === achievementType);
  }, [achievements]);

  const getAllAchievements = useCallback(() => {
    return Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => ({
      type,
      ...def,
      unlocked: achievements.some(a => a.type === type),
      unlockedAt: achievements.find(a => a.type === type)?.unlockedAt || null,
    }));
  }, [achievements]);

  return {
    achievements,
    loading,
    unlockAchievement,
    hasAchievement,
    getAllAchievements,
  };
}

export default useAchievements;
