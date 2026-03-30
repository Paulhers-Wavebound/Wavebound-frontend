import { motion } from "framer-motion";
import { Clock, Brain, Music, Sparkles } from "lucide-react";

const stats = [
  {
    value: "5+",
    label: "Hours saved per week",
    icon: Clock,
    iconColor: "text-sky-500",
  },
  {
    value: "Real-Time",
    label: "Trend tracking",
    icon: Brain,
    iconColor: "text-indigo-500",
  },
  {
    value: "3x",
    label: "Faster content creation",
    icon: Music,
    iconColor: "text-fuchsia-500",
  },
  {
    value: "15K+",
    label: "Viral videos in our database",
    icon: Sparkles,
    iconColor: "text-teal-500",
  },
];

export const StatsSection = () => {
  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            The #1 tool for artists and teams to{" "}
            <span className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] bg-clip-text text-transparent">accelerate growth.</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Like having a world-class social media strategist — at a fraction of the cost.
          </p>
        </motion.div>

        {/* Stats grid - clean cards with colored icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="text-center p-5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-3 ${stat.iconColor}`} />
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
