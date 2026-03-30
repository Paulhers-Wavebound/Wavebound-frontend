import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { parseGenreJson } from "@/utils/genreParser";
import { CREATOR_ROLES, getRoleGenres } from "@/utils/roleCategoryConfig";
import { Check, ArrowRight, ArrowLeft, Mic2, Building2, Loader2, Sparkles } from "lucide-react";

const ONBOARDING_KEY = "wavebound_discover_onboarding_v6";
const PREFS_KEY = "wavebound_user_preferences_v6";

function getOnboardingKey(userId?: string) {
  return userId ? `${ONBOARDING_KEY}_${userId}` : ONBOARDING_KEY;
}

function getPrefsKey(userId?: string) {
  return userId ? `${PREFS_KEY}_${userId}` : PREFS_KEY;
}

export function hasCompletedOnboarding(userId?: string): boolean {
  if (userId) {
    return localStorage.getItem(getOnboardingKey(userId)) === "true";
  }
  // Fallback: check old global key for backward compat
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export async function checkAndHydrateFromDB(userId: string): Promise<boolean> {
  try {
    const { data } = await (supabase.from as any)('user_profiles')
      .select('account_type, creator_role, genres')
      .eq('user_id', userId)
      .maybeSingle();
    if (data?.account_type) {
      localStorage.setItem(getPrefsKey(userId), JSON.stringify({
        genres: data.genres || [],
        accountType: data.account_type,
        role: data.creator_role || undefined,
      }));
      localStorage.setItem(getOnboardingKey(userId), 'true');
      return true;
    }
  } catch { /* silent */ }
  return false;
}

export function getUserPreferences(userId?: string): { genres: string[]; accountType: string; role?: string } | null {
  try {
    const key = userId ? getPrefsKey(userId) : PREFS_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    // Fallback to global key if user-specific not found
    if (userId) {
      const globalRaw = localStorage.getItem(PREFS_KEY);
      return globalRaw ? JSON.parse(globalRaw) : null;
    }
    return null;
  } catch {
    return null;
  }
}

const ACCOUNT_TYPES = [
  { id: "artist", label: "Artist / Creator", icon: Mic2, description: "I make music and want to grow my audience" },
  { id: "manager", label: "Manager / Label", icon: Building2, description: "I manage artists or run a label" },
];

interface DiscoverOnboardingModalProps {
  onComplete: () => void;
  userId?: string;
}

export default function DiscoverOnboardingModal({ onComplete, userId }: DiscoverOnboardingModalProps) {
  const [step, setStep] = useState<number>(1);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [agencyGenres, setAgencyGenres] = useState<string[]>([]);
  const [loadingAgencyGenres, setLoadingAgencyGenres] = useState(false);
  const [building, setBuilding] = useState(false);

  const isAgency = accountType === "manager";
  const totalSteps = isAgency ? 2 : 3;

  // For agency users, load top genres from DB
  const loadAgencyGenres = useCallback(async () => {
    if (agencyGenres.length > 0) return;
    setLoadingAgencyGenres(true);
    try {
      const { data } = await supabase.from("tiktok_videos_all").select("genre");
      if (data) {
        const counts = new Map<string, number>();
        data.forEach((row) => {
          if (row.genre) {
            parseGenreJson(row.genre).forEach((g) => {
              counts.set(g, (counts.get(g) || 0) + 1);
            });
          }
        });
        const sorted = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([g]) => g);
        setAgencyGenres(sorted);
      }
    } catch (e) {
      console.error("Failed to load genres:", e);
    } finally {
      setLoadingAgencyGenres(false);
    }
  }, [agencyGenres.length]);

  // Get the genre list for the current path
  const genreList = isAgency ? agencyGenres : (getRoleGenres(selectedRole) ?? []);
  const genreLoading = isAgency && loadingAgencyGenres;

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleStep1Continue = () => {
    if (isAgency) {
      loadAgencyGenres();
      setStep(3); // skip step 2
    } else {
      setStep(2);
    }
  };

  const handleFinish = async () => {
    setBuilding(true);
    localStorage.setItem(
      getPrefsKey(userId),
      JSON.stringify({ genres: selectedGenres, accountType, role: selectedRole })
    );
    localStorage.setItem(getOnboardingKey(userId), "true");

    // Persist to user_profiles in Supabase
    if (userId) {
      try {
        await (supabase.from as any)('user_profiles').upsert({
          user_id: userId,
          account_type: accountType,
          creator_role: selectedRole,
          genres: selectedGenres,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        // Track onboarding completed
        await (supabase.from as any)('user_activity').insert({
          user_id: userId,
          action: 'onboarding_completed',
          metadata: { accountType, role: selectedRole, genres: selectedGenres },
        });
      } catch { /* silent */ }
    }

    setTimeout(() => onComplete(), 1500);
  };

  // Current step number for progress display
  const displayStep = step === 3 ? totalSteps : step;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-hero)" }} />

      {/* Building feed overlay */}
      <AnimatePresence>
        {building && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-4"
            >
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              <h2 className="text-2xl font-bold text-foreground">Building your feed...</h2>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl mx-4"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  displayStep >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {displayStep > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < totalSteps && (
                <div className={`w-12 h-0.5 rounded-full transition-colors ${displayStep > s ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <AnimatePresence mode="wait">
            {/* ─── Step 1: Account Type ─── */}
            {step === 1 && (
              <StepWrapper key="step1" direction={-1}>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-foreground">Welcome to Wavebound</h1>
                  <p className="text-muted-foreground mt-2">Tell us about yourself so we can personalise your experience.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ACCOUNT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const selected = accountType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setAccountType(type.id)}
                        className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                          selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        {selected && <div className="absolute top-3 right-3"><Check className="w-4 h-4 text-primary" /></div>}
                        <Icon className={`w-6 h-6 mb-3 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <h3 className="font-semibold text-foreground">{type.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-8">
                  <Button onClick={handleStep1Continue} disabled={!accountType}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </StepWrapper>
            )}

            {/* ─── Step 2: Creator Role ─── */}
            {step === 2 && (
              <StepWrapper key="step2" direction={1}>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-foreground">What best describes you?</h1>
                  <p className="text-muted-foreground mt-2">We'll tailor your feed to match your creative style.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CREATOR_ROLES.map((role) => {
                    const Icon = role.icon;
                    const selected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        {selected && <div className="absolute top-3 right-3"><Check className="w-4 h-4 text-primary" /></div>}
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <h3 className="font-semibold text-foreground text-sm">{role.label}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-8">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!selectedRole}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </StepWrapper>
            )}

            {/* ─── Step 3: Genre Selection ─── */}
            {step === 3 && (
              <StepWrapper key="step3" direction={1}>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-foreground">Pick your genres</h1>
                  <p className="text-muted-foreground mt-2">Select at least 1 genre to personalise your Discover feed.</p>
                </div>

                {genreLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {genreList.map((genre) => {
                      const selected = selectedGenres.includes(genre);
                      return (
                        <motion.button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`relative px-3 py-3 rounded-lg text-sm font-medium border transition-all ${
                            selected
                              ? "border-primary/50 bg-primary/15 text-foreground"
                              : "border-border/50 bg-card/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          {selected && <div className="absolute top-1 right-1"><Check className="w-3 h-3 text-primary" /></div>}
                          <span className="truncate block">{genre}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {selectedGenres.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    {selectedGenres.length} genre{selectedGenres.length !== 1 ? "s" : ""} selected
                  </p>
                )}

                <div className="flex items-center justify-between mt-8">
                  <Button variant="ghost" onClick={() => setStep(isAgency ? 1 : 2)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleFinish} disabled={selectedGenres.length < 1}>
                    Get Started <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>
        </div>

        {/* Skip link */}
        <button
          onClick={handleFinish}
          className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}

// ── Shared step animation wrapper ──────────────────────────────────────────────
function StepWrapper({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -20 }}
    >
      {children}
    </motion.div>
  );
}
