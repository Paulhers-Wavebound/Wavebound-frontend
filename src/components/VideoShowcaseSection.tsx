import { motion } from "framer-motion";
import { Sparkles, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

// Replace this with your actual YouTube video ID once uploaded
const YOUTUBE_VIDEO_ID = "dQw4w9WgXcQ"; // Placeholder - replace with your video ID

export const VideoShowcaseSection = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--border) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Youtube className="w-4 h-4" />
            Behind The Scenes
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Watch how we{" "}
            <span className="text-primary">built it</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See the journey from idea to product – the tools, the process, and everything in between.
          </p>
        </motion.div>

        {/* Video container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative group"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          {/* Video frame */}
          <div className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-2xl">
            {/* Browser chrome */}
            <div className="bg-muted/80 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-border/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-muted rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <Youtube className="w-3 h-3 text-red-500" />
                  youtube.com
                </div>
              </div>
            </div>
            
            {/* YouTube Embed */}
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`}
                title="Wavebound - Behind The Scenes"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* CTA below video */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25">
            <Sparkles className="w-5 h-5 mr-2" />
            Try It Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
};