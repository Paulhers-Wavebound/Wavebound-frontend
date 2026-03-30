import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

interface AnalysisProgressLoaderProps {
  loadedCount: number;
  totalCount: number;
  isComplete?: boolean;
}

const AnalysisProgressLoader = ({ loadedCount, totalCount, isComplete = false }: AnalysisProgressLoaderProps) => {
  const percentage = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;
  const isWaitingForData = totalCount === 0 && loadedCount === 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 px-4"
      >
        {/* Main loading text */}
        <motion.div
          animate={{ 
            opacity: isComplete ? 1 : [0.5, 1, 0.5],
          }}
          transition={{ 
            duration: 2,
            repeat: isComplete ? 0 : Infinity,
            ease: "easeInOut"
          }}
          className="space-y-2"
        >
          {isWaitingForData ? (
            <>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Loading Results
              </h2>
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                Preparing analysis...
              </p>
            </>
          ) : (
            <>
              <h2 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {loadedCount}/{totalCount}
              </h2>
              <p className="text-2xl md:text-3xl font-semibold text-foreground">
                Content Pieces Loaded
              </p>
            </>
          )}
        </motion.div>
        
        {/* Animated spinner or checkmark */}
        {isComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="flex justify-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            className="flex justify-center"
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
        )}
        
        {/* Progress bar */}
        {!isWaitingForData && (
          <div className="w-80 max-w-full mx-auto space-y-2">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
          </div>
        )}
        
        {/* Status message */}
        <div className="space-y-1">
          {isComplete ? (
            <p className="text-lg text-green-500 font-medium">
              Analysis complete!
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {isWaitingForData 
                  ? "Fetching profile data and videos..."
                  : "Analyzing content... Please wait"
                }
              </p>
              <p className="text-xs text-muted-foreground/70">
                (around 1 minute wait)
              </p>
            </>
          )}
        </div>
        
        {/* Pulsing dots - only when loading */}
        {!isComplete && (
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AnalysisProgressLoader;