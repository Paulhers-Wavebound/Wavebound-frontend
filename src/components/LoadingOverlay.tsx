import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import waveboundLogo from '@/assets/wavebound-logo.png';

interface LoadingOverlayProps {
  messages?: string[];
  fullPage?: boolean;
}

const LoadingOverlay = ({ 
  messages = ["Loading content...", "Finding viral trends...", "Almost there..."],
  fullPage = false
}: LoadingOverlayProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [messages.length]);

  const containerClass = fullPage 
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30"
    : "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={containerClass}
    >
      <div className="text-center px-4">
        {/* Animated Wavebound Logo */}
        <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
          {/* Pulsing background glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Outer wave ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Animated Wavebound logo */}
          <motion.img
            src={waveboundLogo}
            alt="Loading"
            className="w-20 h-20 object-contain relative z-10"
            animate={{
              scale: [1, 1.1, 1],
              y: [0, -4, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Animated message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {messages[currentMessageIndex]}
            </h2>
          </motion.div>
        </AnimatePresence>
        
        {/* Loading dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              animate={{
                y: [0, -12, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;