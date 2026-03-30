import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Users, Eye, Heart, MessageCircle } from 'lucide-react';

interface BlogStatCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: 'trending' | 'chart' | 'users' | 'views' | 'likes' | 'comments';
  color?: 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose';
}

const iconMap = {
  trending: TrendingUp,
  chart: BarChart3,
  users: Users,
  views: Eye,
  likes: Heart,
  comments: MessageCircle,
};

const colorMap = {
  sky: 'from-[hsl(var(--primary))] to-[hsl(var(--primary-glow,var(--primary)))]',
  indigo: 'from-[hsl(var(--primary))] to-[hsl(var(--primary-glow,var(--primary)))]',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-500',
};

const BlogStatCard: React.FC<BlogStatCardProps> = ({
  value,
  label,
  description,
  icon = 'chart',
  color = 'sky',
}) => {
  const Icon = iconMap[icon];
  const gradient = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
          <p className="text-lg font-semibold text-foreground mt-1">{label}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default BlogStatCard;
