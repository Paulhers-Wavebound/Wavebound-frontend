import { motion } from "framer-motion";
import { Eye, Heart, MessageCircle, TrendingUp, Zap, Clock, Trophy, Lightbulb, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ContentStyleData {
  label: string;
  value: number;
  views: string;
  isTop?: boolean;
}

interface PostingTimeData {
  day: string;
  time: string;
  score: number;
}

interface HiddenGemData {
  views: string;
  label: string;
  multiplier: string;
}

interface ProfileAnalysisSummaryCardProps {
  profile: {
    handle?: string | null;
    profile_nickname?: string | null;
    profile_avatar?: string | null;
  } | null;
  videosAnalyzed: number;
  isComplete: boolean;
  stats: {
    avgViews: number;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
  };
  contentStyles: ContentStyleData[];
  postingTimes: PostingTimeData[];
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    topKeywords: string[];
  };
  hiddenGems: HiddenGemData[];
  recommendations: string[];
}

const formatNumber = (num: number | null | undefined) => {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const ProfileAnalysisSummaryCard = ({
  profile,
  videosAnalyzed,
  isComplete,
  stats,
  contentStyles,
  postingTimes,
  sentiment,
  hiddenGems,
  recommendations,
}: ProfileAnalysisSummaryCardProps) => {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <div className="bg-card rounded-lg border border-border shadow-lg flex flex-col w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.profile_avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-violet-600 text-white font-semibold text-sm">
                {profile?.profile_nickname || profile?.handle 
                  ? getInitials(profile?.profile_nickname || profile?.handle)
                  : <User className="w-4 h-4" />
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-medium text-foreground">
                @{profile?.handle || "profile"}
              </span>
              <p className="text-xs text-muted-foreground">
                {videosAnalyzed} videos analyzed
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
            isComplete 
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" 
              : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
          }`}>
            <Zap className="w-3 h-3" />
            {isComplete ? "Analysis Complete" : "Analyzing..."}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 border-b border-border">
          {[
            { icon: Eye, label: "Avg Views", value: formatNumber(stats.avgViews) },
            { icon: Heart, label: "Avg Likes", value: formatNumber(stats.avgLikes) },
            { icon: MessageCircle, label: "Avg Comments", value: formatNumber(stats.avgComments) },
            { icon: TrendingUp, label: "Eng. Rate", value: `${stats.engagementRate.toFixed(1)}%` },
          ].map((stat, idx) => (
            <div key={idx} className="p-3 md:p-4 text-center border-r last:border-r-0 border-border">
              <stat.icon className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-base md:text-lg font-semibold text-foreground">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Content Performance */}
        {contentStyles.length > 0 && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-foreground uppercase tracking-wide">
                Content Style Performance
              </span>
              <span className="text-[10px] text-muted-foreground">by avg views</span>
            </div>
            <div className="space-y-3">
              {contentStyles.slice(0, 5).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/80">{item.label}</span>
                      {item.isTop && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          <Trophy className="w-2 h-2" />
                          TOP
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">{item.views}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + idx * 0.08, ease: "easeOut" }}
                      className={`h-full rounded ${
                        item.isTop 
                          ? "bg-gradient-to-r from-sky-500 to-violet-500" 
                          : "bg-sky-500/60"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column: Best Times + Sentiment */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
          {/* Best Posting Times */}
          {postingTimes.length > 0 && (
            <div className="p-4 border-b md:border-b-0 md:border-r border-border">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Best Posting Times</span>
              </div>
              <div className="space-y-2">
                {postingTimes.slice(0, 4).map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/70">{slot.day} {slot.time}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 rounded" 
                          style={{ width: `${slot.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-6">{slot.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fan Sentiment */}
          {sentiment && (
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Fan Sentiment</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-foreground/70">Positive</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {sentiment.positive}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-foreground/70">Neutral</span>
                  </div>
                  <span className="text-muted-foreground font-medium">{sentiment.neutral}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-foreground/70">Negative</span>
                  </div>
                  <span className="text-rose-500 font-medium">{sentiment.negative}%</span>
                </div>
              </div>
              {/* Top Keywords */}
              {sentiment.topKeywords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Top keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {sentiment.topKeywords.slice(0, 4).map((kw, idx) => (
                      <span 
                        key={idx} 
                        className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-foreground/70"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden Gems Section */}
        {hiddenGems.length > 0 && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-1.5 mb-3">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-foreground">Hidden Gems Discovered</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {hiddenGems.slice(0, 3).map((gem, idx) => (
                <div key={idx} className="bg-muted/50 rounded-md p-2 md:p-3 text-center">
                  <p className="text-sm md:text-base font-semibold text-foreground">{gem.views}</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">{gem.label}</p>
                  <p className="text-[10px] md:text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {gem.multiplier}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-sky-50 to-violet-50 dark:from-sky-500/5 dark:to-violet-500/5">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground mb-1.5">AI Recommendations</p>
                <ul className="text-xs text-foreground/70 leading-relaxed space-y-1">
                  {recommendations.slice(0, 3).map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileAnalysisSummaryCard;
