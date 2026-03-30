import { motion } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";

const comparisonData = [
  {
    feature: "Finds outlier content (not just popular creators)",
    others: false,
    wavebound: true,
  },
  {
    feature: "Matches content to your actual music",
    others: false,
    wavebound: true,
  },
  {
    feature: "Analyzes audio genre, mood & tempo",
    others: false,
    wavebound: true,
  },
  {
    feature: "Shows what worked for small creators",
    others: false,
    wavebound: true,
  },
  {
    feature: "7-day content plan generation",
    others: false,
    wavebound: true,
  },
  {
    feature: "Real viral score (not just view count)",
    others: false,
    wavebound: true,
  },
  {
    feature: "AI-powered hook analysis",
    others: false,
    wavebound: true,
  },
  {
    feature: "Identifies content style patterns",
    others: false,
    wavebound: true,
  },
  {
    feature: "Performance multiplier tracking",
    others: false,
    wavebound: true,
  },
  {
    feature: "Save & organize favorites into folders",
    others: false,
    wavebound: true,
  },
  {
    feature: "Filter by follower count range",
    others: false,
    wavebound: true,
  },
  {
    feature: "Cross-platform insights (TikTok + Reels)",
    others: false,
    wavebound: true,
  },
  {
    feature: "Photo carousel analysis",
    others: false,
    wavebound: true,
  },
  {
    feature: "Effort level estimation",
    others: false,
    wavebound: true,
  },
  {
    feature: "Caption & hashtag strategy insights",
    others: false,
    wavebound: true,
  },
  {
    feature: "Real-time content database updates",
    others: false,
    wavebound: true,
  },
];

export const ComparisonSection = () => {
  return (
    <section className="py-16 px-6 bg-muted/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium uppercase tracking-wide mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Why Wavebound?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Other content tools vs{" "}
            <span className="text-primary">Wavebound</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most tools show you what big creators post. We show you strategies <span className="text-primary font-medium">proven to perform</span> for artists like you.
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/50 rounded-lg border border-border overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-[1fr,100px,120px] md:grid-cols-[1fr,140px,160px] bg-muted/30 border-b border-border">
            <div className="p-4 md:p-6">
              <span className="text-sm font-medium text-muted-foreground">Feature</span>
            </div>
            <div className="p-4 md:p-6 text-center border-l border-border">
              <span className="text-sm font-medium text-muted-foreground/70">Others</span>
            </div>
            <div className="p-4 md:p-6 text-center border-l border-border bg-primary/10">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Wavebound</span>
              </div>
            </div>
          </div>

          {/* Table rows */}
          {comparisonData.map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className={`grid grid-cols-[1fr,100px,120px] md:grid-cols-[1fr,140px,160px] ${
                index !== comparisonData.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div className="p-4 md:p-6 flex items-center">
                <span className="text-sm md:text-base text-foreground/80">{row.feature}</span>
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center border-l border-border/50">
                {row.others ? (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center border-l border-border/50 bg-primary/5">
                {row.wavebound ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
