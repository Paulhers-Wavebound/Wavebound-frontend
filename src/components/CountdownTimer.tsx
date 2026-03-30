import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (isComplete) return null;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
            {value.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl -z-10 blur-sm opacity-50" />
      </motion.div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider mt-2">{label}</span>
    </div>
  );

  return (
    <div className="py-6">
      <p className="text-center text-muted-foreground text-sm mb-4 uppercase tracking-wider">
        Drops in
      </p>
      <div className="flex items-center justify-center gap-3 md:gap-4">
        <TimeBlock value={timeLeft.days} label="Days" />
        <span className="text-2xl text-muted-foreground font-light mt-[-20px]">:</span>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <span className="text-2xl text-muted-foreground font-light mt-[-20px]">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="text-2xl text-muted-foreground font-light mt-[-20px]">:</span>
        <TimeBlock value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
}
