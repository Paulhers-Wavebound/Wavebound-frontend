import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Sparkles, Search, Wand2, TrendingUp, Brain, Loader2, Film, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisLoadingAnimationProps {
  mode?: 'audio' | 'video';
  /** If true, renders as a contained element instead of fixed fullscreen overlay */
  contained?: boolean;
  /** Called when user cancels the analysis */
  onCancel?: () => void;
}

const audioStages = [
  { icon: Music, title: "Analyzing Audio", description: "Processing BPM, key, and musical characteristics", color: "text-blue-400" },
  { icon: Brain, title: "AI Analysis", description: "Processing audio with advanced AI", color: "text-purple-400" },
  { icon: Sparkles, title: "Detecting Genre & Mood", description: "Identifying genre, sub-genre, and emotional profile", color: "text-pink-400" },
  { icon: Search, title: "Matching Viral Content", description: "Finding videos that match your sound", color: "text-green-400" },
  { icon: TrendingUp, title: "Analyzing Content Categories", description: "Organizing by Hook Statement, Lipsync, Performance", color: "text-orange-400" },
  { icon: Wand2, title: "Generating Content Plan", description: "Creating your personalized content strategy", color: "text-cyan-400" },
];

const videoStages = [
  { icon: Film, title: "Analyzing Video", description: "Extracting frames and audio track", color: "text-sky-400" },
  { icon: Music, title: "Processing Audio", description: "Analyzing BPM, key, and musical characteristics", color: "text-blue-400" },
  { icon: Eye, title: "Visual Analysis", description: "Detecting content style, camera work, and editing", color: "text-violet-400" },
  { icon: Sparkles, title: "Detecting Genre & Mood", description: "Identifying genre, sub-genre, and emotional profile", color: "text-pink-400" },
  { icon: Search, title: "Matching Viral Content", description: "Finding videos that match your style", color: "text-green-400" },
  { icon: Wand2, title: "Generating Content Plan", description: "Creating your personalized content strategy", color: "text-cyan-400" },
];

export const AnalysisLoadingAnimation = ({ mode = 'audio', contained = false, onCancel }: AnalysisLoadingAnimationProps) => {
  const analysisStages = mode === 'video' ? videoStages : audioStages;
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % analysisStages.length);
    }, 3000); // Change stage every 3 seconds

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stageInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const stage = analysisStages[currentStage];
  const StageIcon = stage.icon;

  // Contained mode: renders inside a layout, not as fullscreen overlay
  if (contained) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8rem)] p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-2xl p-12 max-w-2xl w-full shadow-xl border border-border relative"
        >
          <div className="flex flex-col items-center space-y-8">
            {/* Main spinning loader */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="relative z-10"
              >
                <Loader2 className="h-16 w-16 text-primary" />
              </motion.div>
            </div>

            {/* Current stage animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-4 min-h-[100px]"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <StageIcon className={`w-10 h-10 mx-auto ${stage.color}`} />
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {stage.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {stage.description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress indicator */}
            <div className="w-full space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing</span>
                <span className="font-mono">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStage + 1) / analysisStages.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              {/* Stage dots */}
              <div className="flex justify-center gap-2 pt-2">
                {analysisStages.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStage ? 'bg-primary' : 
                      index < currentStage ? 'bg-primary/50' : 'bg-muted'
                    }`}
                    animate={index === currentStage ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
            
            {/* Helpful message */}
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Feel free to browse Discover or chat with AI while this processes — your analysis will be ready when you return.
            </p>
            
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel Analysis
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Original fullscreen overlay mode (for Create page during upload)
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              scale: 0 
            }}
            animate={{ 
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-12 max-w-2xl w-full mx-4 shadow-2xl border border-primary/20 relative z-10"
      >
        <div className="flex flex-col items-center space-y-8">
          {/* Main spinning loader */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative z-10"
            >
              <Loader2 className="h-20 w-20 text-primary" />
            </motion.div>
          </div>

          {/* Current stage animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 min-h-[120px]"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <StageIcon className={`w-12 h-12 mx-auto ${stage.color}`} />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {stage.title}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {stage.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress indicator */}
          <div className="w-full space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Processing</span>
              <span className="font-mono">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStage + 1) / analysisStages.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Stage dots */}
            <div className="flex justify-center gap-2 pt-2">
              {analysisStages.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStage ? 'bg-primary' : 
                    index < currentStage ? 'bg-primary/50' : 'bg-muted'
                  }`}
                  animate={index === currentStage ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
