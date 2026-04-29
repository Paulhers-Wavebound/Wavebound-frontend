import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import waveboundLogo from '@/assets/wavebound-logo.png';
import { cn } from '@/lib/utils';
import { matchGenreConfig, interpolatePrompt, type GenreConfig } from '@/config/genreWelcomeConfig';
import { getUserPreferences } from '@/components/discover/DiscoverOnboardingModal';
import { useDiscover } from '@/contexts/DiscoverContext';

interface AssistantWelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
  className?: string;
}

export function AssistantWelcomeScreen({ onPromptClick, className }: AssistantWelcomeScreenProps) {
  const { activeGenreFilters } = useDiscover();
  const prefs = useMemo(() => getUserPreferences(), []);
  // Prioritize live Discover page filters over stored onboarding prefs
  const role = prefs?.role ?? prefs?.accountType ?? 'artist';
  const config = useMemo(() => {
    const genres = activeGenreFilters.length > 0 ? activeGenreFilters : (prefs?.genres ?? []);
    return matchGenreConfig(genres);
  }, [activeGenreFilters, prefs?.genres]);

  const handleButtonClick = useCallback((promptTemplate: string) => {
    const genreLabel = config.genreLabel;
    const prompt = interpolatePrompt(promptTemplate, genreLabel, role);
    onPromptClick(prompt);
  }, [config.genreLabel, role, onPromptClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div className={cn('py-12 px-4 flex flex-col items-center overflow-x-hidden', className)}>
      {/* 3D Premium Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
        transition={{
          opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 3, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' },
        }}
        className="mb-6"
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-2xl blur-xl"
            animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.15, 1] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
            style={{ background: `radial-gradient(circle, ${config.accent}60, transparent)` }}
          />
          <img
            src={waveboundLogo}
            alt="Wavebound"
            className="w-14 h-14 rounded-2xl relative z-10 shadow-lg"
            style={{ boxShadow: `0 8px 24px ${config.accent}25, 0 4px 12px rgba(0,0,0,0.15)` }}
          />
        </div>
      </motion.div>
      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-2 mb-8"
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: config.accent,
            boxShadow: `0 0 6px ${config.accent}80, 0 0 12px ${config.accent}40`,
          }}
        />
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
          Wavebound AI · Scanning {config.genreLabel}
        </span>
      </motion.div>

      {/* Greeting */}
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="text-[22px] font-bold text-foreground text-center mb-2 tracking-tight font-['Inter',sans-serif] break-words"
      >
        {config.greeting}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4 }}
        className="text-sm text-muted-foreground text-center mb-10 max-w-md"
      >
        {config.subtitle}
      </motion.p>

      {/* Action buttons */}
      <div className="w-full max-w-full space-y-3">
        {config.buttons.map((btn, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => handleButtonClick(btn.prompt)}
            onMouseMove={handleMouseMove}
            className={cn(
              'w-full flex items-center gap-3.5 p-4 rounded-[14px] text-left group cursor-pointer',
              'transition-all duration-250',
              '[--mouse-x:50%] [--mouse-y:50%]',
            )}
            style={{
              background: `radial-gradient(circle 120px at var(--mouse-x) var(--mouse-y), ${config.accent}10, transparent), hsl(var(--muted) / 0.35)`,
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 20px ${config.accent}15, 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.04)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 20px ${config.accent}15, 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)`;
            }}
          >
            {/* Icon */}
            <div
              className="w-[38px] h-[38px] rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
              style={{
                backgroundColor: `${config.accent}14`,
              }}
              ref={(el) => {
                if (!el) return;
                const parent = el.closest('button');
                if (parent) {
                  parent.addEventListener('mouseenter', () => { el.style.backgroundColor = `${config.accent}26`; });
                  parent.addEventListener('mouseleave', () => { el.style.backgroundColor = `${config.accent}14`; });
                }
              }}
            >
              <btn.icon className="w-[18px] h-[18px]" style={{ color: config.accent }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-foreground leading-tight">{btn.label}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5 leading-tight">{btn.subtitle}</div>
            </div>

            {/* Chevron */}
            <ChevronRight
              className="w-4 h-4 text-foreground/[0.15] group-hover:text-foreground/[0.4] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
            />
          </motion.button>
        ))}
      </div>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-[12px] text-muted-foreground/60 italic text-center mt-8"
      >
        or type anything — I've already scanned your niche
      </motion.p>
    </div>
  );
}
