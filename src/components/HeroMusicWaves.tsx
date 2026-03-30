import React from 'react';
import { motion } from 'framer-motion';

// Generate realistic waveform pattern with natural audio-like variations
const generateWaveData = () => {
  const bars: { id: number; baseHeight: number; maxHeight: number; delay: number; duration: number }[] = [];
  const totalBars = 100;
  
  for (let i = 0; i < totalBars; i++) {
    // Create natural wave envelope - higher in middle, tapered at edges
    const position = i / totalBars;
    const envelope = Math.sin(position * Math.PI) * 0.7 + 0.3;
    
    // Add harmonic variations for realistic audio look
    const harmonic1 = Math.sin(position * Math.PI * 8) * 0.3;
    const harmonic2 = Math.sin(position * Math.PI * 16 + 0.5) * 0.15;
    const harmonic3 = Math.sin(position * Math.PI * 24 + 1) * 0.1;
    
    // Combine for organic shape
    const variation = envelope + harmonic1 + harmonic2 + harmonic3;
    const normalizedHeight = Math.max(0.15, Math.min(1, variation));
    
    bars.push({
      id: i,
      baseHeight: normalizedHeight * 30 + 8,
      maxHeight: normalizedHeight * 80 + 15,
      delay: i * 0.015,
      duration: 1.2 + Math.random() * 0.6,
    });
  }
  return bars;
};

const WAVE_BARS = generateWaveData();

const HeroMusicWaves: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Waveform visualization - positioned behind hero text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-5xl h-40 flex items-center justify-center gap-[2px] opacity-[0.08] dark:opacity-[0.12]">
        {WAVE_BARS.map((bar) => (
          <motion.div
            key={bar.id}
            className="flex-1 max-w-[5px] bg-gray-900 dark:bg-white rounded-full"
            style={{ originY: 0.5 }}
            animate={{
              height: [bar.baseHeight, bar.maxHeight, bar.baseHeight],
            }}
            transition={{
              duration: bar.duration,
              repeat: Infinity,
              delay: bar.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroMusicWaves;
