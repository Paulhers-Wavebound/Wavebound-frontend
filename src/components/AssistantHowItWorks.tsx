import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  Sparkles,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssistantHowItWorksProps {
  onPromptClick?: (prompt: string) => void;
  className?: string;
}

const examplePrompts = [
  "What content works for indie pop artists?",
  "I'm dropping a single Friday — what should I post?",
  "Show me viral hooks that are working right now"
];

export function AssistantHowItWorks({ onPromptClick, className }: AssistantHowItWorksProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn("w-full mb-4", className)}>
      {/* Collapsed toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg",
          "text-sm font-medium transition-all",
          "bg-muted/30 hover:bg-muted/50 border border-border/50",
          "text-muted-foreground hover:text-foreground",
          isExpanded && "bg-muted/50 text-foreground"
        )}
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span>How does this work?</span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {/* Brief explanation */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Database className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Recommendations from <span className="text-foreground font-medium">15,000+ viral videos</span>. 
                  Tell me your genre and I'll show what's working.
                </p>
              </div>

              {/* Example prompts - simple list */}
              <div className="flex flex-wrap gap-1.5">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onPromptClick?.(prompt)}
                    className={cn(
                      "text-left px-3 py-1.5 rounded-full text-xs",
                      "bg-muted/40 border border-border/50",
                      "hover:border-primary/30 hover:bg-muted/60",
                      "transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
