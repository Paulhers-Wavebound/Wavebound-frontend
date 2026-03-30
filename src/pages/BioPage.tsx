import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Music, Video, Globe, Share2, Link2, ExternalLink, Loader2, Mail, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CountdownTimer } from "@/components/CountdownTimer";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface BioLink {
  id: string;
  title: string;
  url: string;
  platform_type: string;
  is_active: boolean;
}

interface BioProfile {
  id: string;
  slug: string;
  bio_name: string | null;
  bio_text: string | null;
  profile_image_url: string | null;
  theme_settings: any;
  presave_mode: boolean;
  presave_release_date: string | null;
  presave_isrc: string | null;
  presave_spotify_uri: string | null;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ReactNode; gradient: string }> = {
  spotify: { 
    icon: <Music className="w-5 h-5" />, 
    gradient: "from-green-500 to-green-600" 
  },
  apple: { 
    icon: <Music className="w-5 h-5" />, 
    gradient: "from-pink-500 to-red-500" 
  },
  youtube: { 
    icon: <Video className="w-5 h-5" />, 
    gradient: "from-red-500 to-red-600" 
  },
  soundcloud: { 
    icon: <Music className="w-5 h-5" />, 
    gradient: "from-orange-500 to-orange-600" 
  },
  instagram: { 
    icon: <Share2 className="w-5 h-5" />, 
    gradient: "from-purple-500 via-pink-500 to-orange-500" 
  },
  tiktok: { 
    icon: <Video className="w-5 h-5" />, 
    gradient: "from-gray-900 to-gray-800" 
  },
  twitter: { 
    icon: <Globe className="w-5 h-5" />, 
    gradient: "from-sky-400 to-sky-500" 
  },
  custom: { 
    icon: <Link2 className="w-5 h-5" />, 
    gradient: "from-indigo-500 to-purple-600" 
  },
};

export default function BioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [isPresaveActive, setIsPresaveActive] = useState(false);
  
  // Email signup states
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProfile(slug);
    }
  }, [slug]);

  const loadProfile = async (profileSlug: string) => {
    const { data: profileData, error } = await supabase
      .from("bio_profiles")
      .select("*")
      .eq("slug", profileSlug)
      .single();

    if (error || !profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Check if presave should be active
    // Presave is active if: presave_mode is ON AND (no release date set OR release date is in the future)
    const releaseDate = profileData.presave_release_date ? new Date(profileData.presave_release_date) : null;
    const now = new Date();
    const presaveActive = profileData.presave_mode && (!releaseDate || releaseDate > now);
    setIsPresaveActive(presaveActive);

    const { data: linksData } = await supabase
      .from("bio_links")
      .select("*")
      .eq("profile_id", profileData.id)
      .eq("is_active", true)
      .order("sort_order");

    if (linksData) {
      setLinks(linksData);
    }

    setLoading(false);
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    await supabase.rpc("increment_link_click", { link_id: linkId });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !email.trim()) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("pre_release_subscribers")
        .insert({
          email: email.trim().toLowerCase(),
          artist_name: profile.bio_name || slug || "Unknown Artist",
          song_title: profile.presave_isrc || null,
          profile_id: profile.id,
        });

      if (error) {
        // Check for duplicate email
        if (error.code === "23505") {
          toast.info("You're already on the list! 🎉");
          setSubscribed(true);
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCountdownComplete = () => {
    setIsPresaveActive(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white px-4">
        <SEOHead title="Page Not Found | Wavebound" />
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-400 mb-8">This link-in-bio page doesn't exist.</p>
        <Link 
          to="/" 
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-medium transition-colors"
        >
          Go to Wavebound
        </Link>
      </div>
    );
  }

  const releaseDate = profile?.presave_release_date ? new Date(profile.presave_release_date) : null;

  return (
    <>
      <SEOHead
        title={`${profile?.bio_name || slug} | Wavebound`}
        description={profile?.bio_text || `Check out ${profile?.bio_name || slug}'s links`}
        ogImage={profile?.profile_image_url || undefined}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 flex flex-col">
        <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-24 max-w-lg mx-auto w-full">
          
          {/* Profile Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            {profile?.profile_image_url ? (
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse" />
                <img
                  src={profile.profile_image_url}
                  alt={profile.bio_name || "Profile"}
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-slate-800"
                />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 mx-auto">
                <span className="text-4xl font-bold text-white">
                  {(profile?.bio_name || slug || "?")[0].toUpperCase()}
                </span>
              </div>
            )}

            <h1 className="text-2xl font-bold text-white mb-2">
              {profile?.bio_name || slug}
            </h1>
            
            {profile?.bio_text && (
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                {profile.bio_text}
              </p>
            )}
          </motion.div>

          {/* Countdown Timer - Only shown when presave is active */}
          {isPresaveActive && releaseDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full mb-8"
            >
              <CountdownTimer 
                targetDate={releaseDate} 
                onComplete={handleCountdownComplete}
              />
            </motion.div>
          )}

          {/* Pre-save Section - Email Signup */}
          <AnimatePresence mode="wait">
            {isPresaveActive && !subscribed && (
              <motion.div
                key="presave-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full mb-8"
              >
                {!showEmailForm ? (
                  // Main CTA Button
                  <motion.button
                    onClick={() => setShowEmailForm(true)}
                    className="w-full group relative overflow-hidden rounded-2xl"
                  >
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 animate-pulse" />
                    <div className="absolute inset-[2px] bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl" />
                    
                    {/* Button content */}
                    <div className="relative flex items-center justify-center gap-3 px-6 py-6">
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      <span className="text-xl font-bold text-white tracking-wide">
                        Join the Release List
                      </span>
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                  </motion.button>
                ) : (
                  // Email Form
                  <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={handleEmailSubmit}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30" />
                      <div className="relative bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-4">
                          <Mail className="w-5 h-5 text-emerald-400" />
                          <span className="text-white font-medium">Get notified on release day</span>
                        </div>
                        
                        <div className="flex gap-3">
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-slate-900/80 border-slate-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              "Join"
                            )}
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setShowEmailForm(false)}
                          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </motion.div>
            )}

            {/* Success State */}
            {subscribed && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full mb-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 animate-pulse" />
                  <div className="relative bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/30 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      You're on the list! 🎉
                    </h3>
                    <p className="text-gray-400 text-sm">
                      We'll email you the moment the song drops so you can be the first to stream it.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regular Links - Hidden when presave mode is active */}
          {!isPresaveActive && (
            <div className="w-full space-y-4">
              {links.length > 0 ? (
                links.map((link, index) => {
                  const config = PLATFORM_CONFIG[link.platform_type] || PLATFORM_CONFIG.custom;
                  
                  return (
                    <motion.button
                      key={link.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleLinkClick(link.id, link.url)}
                      className={`w-full group relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r ${config.gradient}`}
                    >
                      <div className="relative flex items-center justify-between px-6 py-4 bg-slate-900/90 rounded-2xl backdrop-blur-sm transition-all group-hover:bg-slate-900/70">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl bg-gradient-to-r ${config.gradient} text-white`}>
                            {config.icon}
                          </div>
                          <span className="font-medium text-white">
                            {link.title}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </motion.button>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No links added yet</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer Badge */}
        <footer className="py-6 text-center">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
          >
            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
              Strategy & Analytics by
            </span>
            <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Wavebound.ai
            </span>
          </Link>
        </footer>
      </div>
    </>
  );
}