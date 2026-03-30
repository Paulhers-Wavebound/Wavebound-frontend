import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Music, User, Sparkles, ArrowRight, X, HelpCircle } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const tips = [
  {
    icon: Music,
    title: "Step 1: Upload your music",
    description: "Start by uploading a track to get your personalized content plan"
  },
  {
    icon: User,
    title: "Step 2: Analyze a profile",
    description: "Enter any TikTok handle to see what's working for them"
  },
  {
    icon: Sparkles,
    title: "Step 3: Chat with AI",
    description: "Ask questions anytime using the chat assistant"
  }
];

const OnboardingModal = ({ open, onClose }: OnboardingModalProps) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand after 5 seconds
  useEffect(() => {
    if (open && !isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [open, isExpanded]);

  const handleDismiss = () => {
    localStorage.setItem('wavebound_onboarding_completed', 'true');
    onClose();
  };

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      handleDismiss();
    }
  };

  if (!open) return null;

  const tip = tips[currentTip];
  const TipIcon = tip.icon;

  return (
    <div className="fixed top-20 right-4 z-50">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed bubble state
          <motion.button
            key="bubble"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onClick={() => setIsExpanded(true)}
            className="relative flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Tutorial</span>
            
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />
          </motion.button>
        ) : (
          // Expanded tutorial card
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-72"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 relative overflow-hidden">
              {/* Orange accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Tutorial badge */}
              <div className="flex items-center gap-2 mb-3 mt-1">
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-500/20">
                  Tutorial
                </span>
                <span className="text-[10px] text-gray-400">
                  {currentTip + 1} of {tips.length}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] flex items-center justify-center flex-shrink-0">
                  <TipIcon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0 pr-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTip}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="font-semibold text-gray-900 text-sm">{tip.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{tip.description}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-1.5">
                  {tips.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentTip ? 'bg-[#0EA5E9]' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs h-7 px-3"
                >
                  {currentTip < tips.length - 1 ? 'Next' : 'Got it'}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingModal;
