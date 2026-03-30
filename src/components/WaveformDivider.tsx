import React from "react";
import { motion } from "framer-motion";

type WaveBar = {
  id: number;
  base: number;
  peak: number;
  delay: number;
  duration: number;
};

const makeBars = (count: number): WaveBar[] => {
  const bars: WaveBar[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);

    // Center-heavy envelope + gentle harmonics for an audio-ish silhouette
    const envelope = Math.sin(t * Math.PI) * 0.85 + 0.15;
    const h1 = Math.sin(t * Math.PI * 10) * 0.22;
    const h2 = Math.sin(t * Math.PI * 22 + 0.7) * 0.12;
    const shape = Math.max(0.12, Math.min(1, envelope + h1 + h2));

    const base = 3 + shape * 7;
    const peak = 6 + shape * 18;

    bars.push({
      id: i,
      base,
      peak,
      delay: i * 0.012,
      duration: 1.05 + (i % 9) * 0.03,
    });
  }

  return bars;
};

const BARS = makeBars(140);

export default function WaveformDivider() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-full flex items-end justify-center px-6"
    >
      <div className="w-full flex items-end justify-center gap-[2px]">
        {BARS.map((bar) => (
          <motion.div
            key={bar.id}
            className="flex-1 max-w-[4px] rounded-t-full bg-black/10 dark:bg-white/5"
            style={{ originY: 1 }}
            animate={{ height: [bar.base, bar.peak, bar.base] }}
            transition={{
              duration: bar.duration,
              repeat: Infinity,
              delay: bar.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
