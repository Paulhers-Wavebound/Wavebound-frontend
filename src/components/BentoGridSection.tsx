import { motion } from "framer-motion";
import { Sparkles, Zap, Target, Brain, LineChart, Palette } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Sound Analysis",
    description: "Understands your music's DNA — genre, mood, tempo, instruments.",
    size: "large",
    gradient: "from-purple-600 via-violet-600 to-indigo-600",
  },
  {
    icon: Target,
    title: "Outlier Detection",
    description: "Finds viral content from small creators.",
    size: "small",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: LineChart,
    title: "Performance Scoring",
    description: "Real viral potential, not vanity metrics.",
    size: "small",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description: "Content ideas matched to your exact sound profile.",
    size: "medium",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Zap,
    title: "Instant Plans",
    description: "7-day content calendars in seconds.",
    size: "medium",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Palette,
    title: "Style Library",
    description: "Browse by content style, effort level, and format.",
    size: "large",
    gradient: "from-pink-500 via-rose-500 to-red-500",
  },
];

export const BentoGridSection = () => {
  return (
    <section className="py-16 px-6 bg-muted/50 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            6 ways we make your content unstoppable
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature designed to save you time and help you create better content.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[200px]">
          {features.map((feature, index) => {
            const colSpan = feature.size === "large" ? "md:col-span-2" : feature.size === "medium" ? "md:col-span-2" : "";
            const rowSpan = feature.size === "large" ? "row-span-2" : "";
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`${colSpan} ${rowSpan} relative group`}
              >
                <div className="relative h-full bg-card border border-border rounded-lg p-6 flex flex-col justify-between overflow-hidden hover:border-border/80 hover:shadow-md transition-all duration-300">
                  <div className="relative z-10">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  </div>
                  
                  <p className="text-muted-foreground text-sm relative z-10">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
