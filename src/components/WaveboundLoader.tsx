import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import waveboundLogo from '@/assets/wavebound-logo.png';

interface WaveboundLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showPulse?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const WaveboundLoader = ({ 
  size = 'md', 
  className,
  showPulse = true 
}: WaveboundLoaderProps) => {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Pulsing glow behind logo */}
      {showPulse && (
        <motion.div
          className={cn('absolute rounded-full bg-primary/30', sizeMap[size])}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      {/* Animated logo */}
      <motion.img
        src={waveboundLogo}
        alt="Loading"
        className={cn(sizeMap[size], 'relative z-10 object-contain')}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default WaveboundLoader;
