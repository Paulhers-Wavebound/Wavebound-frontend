import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  ThumbsUp, 
  ThumbsDown, 
  Users, 
  MessageSquare,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface FeedbackItem {
  id: string;
  user_id: string;
  session_id: string;
  feedback_type: 'positive' | 'negative';
  feedback_message: string | null;
  message_content: string | null;
  created_at: string;
}

interface Stats {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  totalUsers: number;
  totalSessions: number;
  recentFeedback: FeedbackItem[];
}

export function AdminConsole() {
  const [stats, setStats] = useState<Stats>({
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    totalUsers: 0,
    totalSessions: 0,
    recentFeedback: [],
  });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch feedback stats
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('assistant_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (feedbackError) throw feedbackError;

      const positive = feedbackData?.filter(f => f.feedback_type === 'positive').length || 0;
      const negative = feedbackData?.filter(f => f.feedback_type === 'negative').length || 0;

      // Fetch unique users count from chat_sessions
      const { count: sessionsCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true });

      // Get unique user count from feedback
      const uniqueUsers = new Set(feedbackData?.map(f => f.user_id) || []).size;

      setStats({
        totalFeedback: feedbackData?.length || 0,
        positiveFeedback: positive,
        negativeFeedback: negative,
        totalUsers: uniqueUsers,
        totalSessions: sessionsCount || 0,
        recentFeedback: (feedbackData as FeedbackItem[]) || [],
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const satisfactionRate = stats.totalFeedback > 0 
    ? Math.round((stats.positiveFeedback / stats.totalFeedback) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-violet-500/5 transition-colors"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-500" />
          Admin Console
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="Total Feedback"
              value={stats.totalFeedback}
              color="text-blue-500"
            />
            <StatCard
              icon={<ThumbsUp className="w-5 h-5" />}
              label="Positive"
              value={stats.positiveFeedback}
              color="text-green-500"
            />
            <StatCard
              icon={<ThumbsDown className="w-5 h-5" />}
              label="Negative"
              value={stats.negativeFeedback}
              color="text-orange-500"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Satisfaction"
              value={`${satisfactionRate}%`}
              color="text-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Users (Feedback)"
              value={stats.totalUsers}
              color="text-cyan-500"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Total Sessions"
              value={stats.totalSessions}
              color="text-pink-500"
            />
          </div>

          <Separator className="bg-violet-500/20" />

          {/* Recent Feedback */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Recent Feedback
            </h3>
            
            {stats.recentFeedback.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No feedback yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {stats.recentFeedback.map((feedback) => (
                  <FeedbackCard key={feedback.id} feedback={feedback} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string; 
  color: string;
}) {
  return (
    <div className="bg-card/50 border border-border rounded-lg p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: FeedbackItem }) {
  const isPositive = feedback.feedback_type === 'positive';
  
  return (
    <div className={`p-3 rounded-lg border ${
      isPositive 
        ? 'bg-green-500/5 border-green-500/20' 
        : 'bg-orange-500/5 border-orange-500/20'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-full ${
          isPositive ? 'bg-green-500/20' : 'bg-orange-500/20'
        }`}>
          {isPositive ? (
            <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <ThumbsDown className="w-3.5 h-3.5 text-orange-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {feedback.feedback_message ? (
            <p className="text-sm">{feedback.feedback_message}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No message</p>
          )}
          {feedback.message_content && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Re: "{feedback.message_content.substring(0, 100)}..."
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}
