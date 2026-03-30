import React from 'react';
import { motion } from 'framer-motion';

interface StatItem {
  value: string;
  label: string;
}

interface BlogStatsRowProps {
  stats: StatItem[];
  source?: string;
}

const BlogStatsRow: React.FC<BlogStatsRowProps> = ({ stats, source }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-8 p-6 rounded-2xl bg-primary/5 border border-primary/10"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      {source && (
        <p className="text-xs text-center text-muted-foreground mt-4 pt-4 border-t border-primary/10">
          {source}
        </p>
      )}
    </motion.div>
  );
};

export default BlogStatsRow;
