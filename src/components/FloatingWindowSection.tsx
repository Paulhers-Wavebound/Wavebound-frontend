import { motion } from "framer-motion";
import { Music, Sparkles, ArrowRight, Play, Pause } from "lucide-react";
import { useState } from "react";

export const FloatingWindowSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-32 px-6 bg-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your music. <span className="text-primary">Decoded.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Upload any track and watch our AI break down exactly what makes it unique.
          </p>
        </motion.div>

        {/* Floating windows layout */}
        <div className="relative h-[600px] md:h-[500px]">
          {/* Main window - Audio analysis */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-xl z-20"
            style={{ perspective: '1000px' }}
          >
            <div className="bg-card rounded-2xl shadow-2xl shadow-black/10 border border-border overflow-hidden">
              {/* Window header */}
              <div className="bg-muted px-4 py-3 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-muted-foreground text-sm font-medium">Audio Analysis</span>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Track info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">Midnight Dreams.mp3</h4>
                    <p className="text-muted-foreground text-sm">3:42 • 24-bit • 44.1kHz</p>
                  </div>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Analysis results */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Genre", value: "Electronic Pop", color: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300" },
                    { label: "BPM", value: "128", color: "bg-primary/10 text-primary" },
                    { label: "Mood", value: "Energetic", color: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300" },
                    { label: "Key", value: "A Minor", color: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-xl p-4">
                      <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Secondary window - Matched content */}
          <motion.div
            initial={{ opacity: 0, x: 100, rotate: 3 }}
            whileInView={{ opacity: 1, x: 0, rotate: 3 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute right-0 md:right-10 top-32 w-72 z-10 hidden md:block"
          >
            <div className="bg-card rounded-2xl shadow-xl shadow-black/10 border border-border overflow-hidden transform rotate-3">
              <div className="bg-muted px-4 py-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-sm font-medium">Matched Content</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { views: "2.4M", match: "94%" },
                  { views: "1.8M", match: "91%" },
                  { views: "980K", match: "88%" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    <div className="w-10 h-14 bg-muted rounded-lg" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{item.views} views</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">{item.match} match</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tertiary window - Content plan */}
          <motion.div
            initial={{ opacity: 0, x: -100, rotate: -3 }}
            whileInView={{ opacity: 1, x: 0, rotate: -3 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute left-0 md:left-10 top-40 w-64 z-10 hidden md:block"
          >
            <div className="bg-card rounded-2xl shadow-xl shadow-black/10 border border-border overflow-hidden transform -rotate-3">
              <div className="bg-primary px-4 py-3">
                <span className="text-primary-foreground text-sm font-medium">7-Day Plan Ready</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-foreground">7</span>
                  <span className="text-muted-foreground text-sm">content ideas</span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors">
                  View Plan
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};