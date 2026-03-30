import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Early adopter cutoff: first year of Wavebound (adjust date as needed)
const EARLY_ADOPTER_CUTOFF = new Date('2027-01-01');

export const AchievementsSection = () => {
  const { getAllAchievements, unlockAchievement, loading } = useAchievements();
  const [checkedEarlyAdopter, setCheckedEarlyAdopter] = useState(false);

  // Check for early adopter achievement
  useEffect(() => {
    const checkEarlyAdopter = async () => {
      if (checkedEarlyAdopter) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const createdAt = new Date(user.created_at);
      if (createdAt < EARLY_ADOPTER_CUTOFF) {
        await unlockAchievement('early_adopter');
      }
      setCheckedEarlyAdopter(true);
    };

    if (!loading) {
      checkEarlyAdopter();
    }
  }, [loading, checkedEarlyAdopter, unlockAchievement]);

  const allAchievements = getAllAchievements();
  const unlockedCount = allAchievements.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Achievements</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Achievements</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {unlockedCount}/{allAchievements.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {allAchievements.map((achievement, index) => (
          <Tooltip key={achievement.type}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-default
                  transition-all duration-200
                  ${achievement.unlocked 
                    ? 'bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 hover:border-primary/50' 
                    : 'bg-muted/50 border border-border opacity-50 grayscale'
                  }
                `}
              >
                <span className="text-2xl mb-1">
                  {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                </span>
                <span className={`text-[10px] text-center font-medium leading-tight ${
                  achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {achievement.title}
                </span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="font-semibold">{achievement.icon} {achievement.title}</p>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
              {achievement.unlocked && achievement.unlockedAt && (
                <p className="text-xs text-primary mt-1">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default AchievementsSection;
