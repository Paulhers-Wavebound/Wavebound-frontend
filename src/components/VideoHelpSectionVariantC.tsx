import { motion } from "framer-motion";
import { Lightbulb, Video, Zap, MessageCircle, ArrowRight, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Variant C: Card-based features with hook examples
export const VideoHelpSectionVariantC = () => {
  const hookExamples = [
    "me testing the mf that 'listens to everything'",
    "POV: you're watching the local indie band become even more insufferable",
    "when you're raised by an indie dad (pt.2)"
  ];

  return (
    <section className="px-6 py-16 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl opacity-50" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          className="text-center mb-10"
        >
          <motion.div 
            initial={{ scale: 0.9 }} 
            whileInView={{ scale: 1 }} 
            viewport={{ once: true }} 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium uppercase tracking-wide mb-4"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Creative Tools
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Never stare at a <span className="bg-gradient-to-r from-violet-500 to-pink-500 dark:from-violet-400 dark:to-pink-400 bg-clip-text text-transparent">blank screen</span> again
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Get hook ideas, video feedback, and creative direction — all tailored to your music and style.
          </p>
        </motion.div>

        {/* Main feature cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Hook Ideas Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hook Ideas</h3>
            <p className="text-sm text-foreground/70 mb-4">Proven hook templates based on what's working in your genre.</p>
            
            {/* Hook examples */}
            <div className="space-y-1.5">
              {hookExamples.slice(0, 3).map((hook, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-md px-3 py-2 text-xs text-foreground/80 border border-gray-100 dark:border-gray-600/30"
                >
                  "{hook}"
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Video Feedback Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center mb-4">
              <Video className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Video Feedback</h3>
            <p className="text-sm text-foreground/70 mb-4">Upload your draft and get specific feedback on what to improve.</p>
            
            {/* Feedback preview */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">AI Feedback</span>
              </div>
              <div className="space-y-1.5 text-xs text-foreground/80">
                <div className="flex items-start gap-2">
                  <Star className="w-3 h-3 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Move hook to 0:00</span>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-3 h-3 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Add text overlay</span>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-3 h-3 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Try a different angle</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Help Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Quick Answers</h3>
            <p className="text-sm text-foreground/70 mb-4">Ask anything — answers are pulled from our viral content database.</p>
            
            {/* Chat preview */}
            <div className="space-y-2">
              <div className="bg-amber-50 dark:bg-amber-500/20 rounded-md px-3 py-2 text-xs text-foreground/80 ml-4">
                "What hooks are working for R&B artists?"
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md px-3 py-2 text-xs text-foreground/80 border border-gray-100 dark:border-gray-600/30 mr-4">
                "Transition videos with 'The setup:' text hooks — @artistname got 17M views with this format..."
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-5 py-3 border border-gray-200 dark:border-gray-700 shadow-md">
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-sm text-foreground/80">Available in the Content Assistant</span>
            <ArrowRight className="w-4 h-4 text-foreground/40" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
