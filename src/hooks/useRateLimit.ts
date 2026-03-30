import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

const MAX_MESSAGES_PER_HOUR = 30;
const COOLDOWN_MS = 3000; // 3 seconds between messages
const MAX_MESSAGE_LENGTH = 5000;

interface RateLimitState {
  timestamps: number[];
  lastSentAt: number;
}

/**
 * Client-side rate limiting and input validation for chat endpoints.
 * Enforces cooldown between messages and hourly limits.
 */
export function useRateLimit() {
  const stateRef = useRef<RateLimitState>({
    timestamps: [],
    lastSentAt: 0,
  });

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const state = stateRef.current;

    // Cooldown check
    if (now - state.lastSentAt < COOLDOWN_MS) {
      toast.error('Slow down! Please wait a few seconds.');
      return false;
    }

    // Hourly limit check — prune old timestamps
    const oneHourAgo = now - 60 * 60 * 1000;
    state.timestamps = state.timestamps.filter(t => t > oneHourAgo);

    if (state.timestamps.length >= MAX_MESSAGES_PER_HOUR) {
      toast.error('You have reached the hourly message limit. Please try again later.');
      return false;
    }

    // Record this message
    state.timestamps.push(now);
    state.lastSentAt = now;
    return true;
  }, []);

  const validateInput = useCallback((message: string): string | null => {
    const trimmed = message.trim();
    if (!trimmed) {
      return null; // Empty — silently reject
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message is too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`);
      return null;
    }
    return trimmed;
  }, []);

  return { checkRateLimit, validateInput };
}
