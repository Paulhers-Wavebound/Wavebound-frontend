import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import SEOHead from "@/components/SEOHead";

import { 
  ArrowRight, Sparkles, TrendingUp, 
  Zap, Filter, Play, Flame, Quote, Award, Disc3, 
  Mic2, Lightbulb, Telescope, Route
} from "lucide-react";
import { TbMap } from "react-icons/tb";
import waveboundLogo from "@/assets/wavebound-logo.png";
import paulStudio from "@/assets/paul-studio.jpg";
import adenStage from "@/assets/aden-stage.jpg";
import HeroMusicWaves from "@/components/HeroMusicWaves";
import WaveformDivider from "@/components/WaveformDivider";
import heroStudioPhoto from "@/assets/hero-studio.jpg";
import HeroShowcaseAnimation from "@/components/HeroShowcaseAnimation";
import FooterSection from '@/components/FooterSection';
import { StatsSection } from '@/components/StatsSection';
import { FAQSection } from '@/components/FAQSection';
import { GradientCTASection } from '@/components/GradientCTASection';
import OnboardingModal from '@/components/OnboardingModal';
import { VideoHelpSectionVariantC } from '@/components/VideoHelpSectionVariantC';
import { LANDING_PAGE_SECTIONS } from '@/config/featureFlags';
import BreakoutMomentsCarousel from '@/components/BreakoutMomentsCarousel';
import { AppLayout } from '@/components/layout/AppLayout';

const trustedBy = [
  { name: "Universal Music", logo: "/logos/universal.png" },
  { name: "Sony Music", logo: "/logos/sony.png" },
  { name: "Warner Music", logo: "/logos/warner.jpg" },
  { name: "Atlantic Records", logo: "/logos/atlantic.png" },
  { name: "Republic Records", logo: "/logos/republic.png" },
  { name: "Columbia Records", logo: "/logos/columbia.png" }
];

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const hasLocal = localStorage.getItem('wavebound_onboarding_completed');
      if (hasLocal) return;
      // Check DB before showing modal
      const { checkAndHydrateFromDB } = await import('@/components/discover/DiscoverOnboardingModal');
      const hydrated = await checkAndHydrateFromDB(user.id);
      if (hydrated) {
        localStorage.setItem('wavebound_onboarding_completed', 'true');
        return;
      }
      setShowOnboarding(true);
    };
    checkOnboarding();
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppLayout withHeaderPadding={false} className="min-h-screen bg-white dark:bg-gray-900">
      <SEOHead 
        title="Wavebound - AI-Powered Content Discovery for Musicians"
        description="Discover viral music content trends, analyze your TikTok performance, and plan your content strategy with AI. Built for independent artists and music marketers."
        canonical="/"
      />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-10 left-[10%] w-96 h-32 bg-sky-500/30 rounded-full blur-3xl" />
          <div className="absolute top-40 right-[15%] w-80 h-28 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <HeroMusicWaves />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center space-y-6 mb-12">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="flex justify-center">
              <img src={waveboundLogo} alt="Wavebound" className="w-14 h-14 rounded-xl shadow-lg" />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              Your music <span className="italic bg-gradient-to-r from-sky-600 to-cyan-500 dark:from-sky-400 dark:to-cyan-300 bg-clip-text text-transparent">deserves</span> a strategy.
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The <span className="font-semibold text-gray-900 dark:text-gray-200">first</span> AI tool that analyzes both <span className="font-semibold text-gray-900 dark:text-gray-200">your music</span> and what's working on social media - combining it into a strategy that is <span className="font-semibold text-gray-900 dark:text-gray-200">proven</span>. Save your time and energy for <span className="font-semibold text-gray-900 dark:text-gray-200">music</span>.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 pt-2 justify-center">
              <Button onClick={() => navigate('/discover')} className="btn-shimmer bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all h-auto">
                <Sparkles className="w-5 h-5" />
                Discover What's Working
              </Button>
              <Button onClick={() => navigate('/create')} variant="outline" className="border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-white/30 px-8 py-4 rounded-xl font-semibold text-lg group h-auto">
                <Sparkles className="w-5 h-5" />
                Generate Content Plan
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>

          {/* Product showcase animation */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.4 }} 
            className="mb-6"
          >
            <div id="assistant-showcase">
              <HeroShowcaseAnimation />
            </div>
          </motion.div>

          {/* Studio photo banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/30 via-30% to-transparent z-10 pointer-events-none rounded-xl dark:from-gray-900 dark:via-gray-900/30" />
            <div className="rounded-xl overflow-hidden">
              <img 
                src={heroStudioPhoto} 
                alt="" 
                className="w-full h-32 md:h-40 object-cover opacity-100 dark:opacity-90" 
                style={{ objectPosition: 'center 45%' }} 
              />
            </div>
          </motion.div>

          {/* Trusted by */}
          {LANDING_PAGE_SECTIONS.showTrustedByLogos && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-6 pt-6 border-t border-gray-200 dark:border-white/15">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 text-center font-medium">Trusted by content teams at</p>
              <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14">
                {trustedBy.map((company, idx) => (
                  <img key={idx} src={company.logo} alt={company.name} className="h-8 md:h-10 object-contain opacity-50 grayscale hover:opacity-70 transition-opacity dark:invert" />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Waveform divider */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900" />
          <WaveformDivider />
          <div className="absolute inset-x-0 bottom-0 border-t border-gray-200/60 dark:border-white/10" />
        </div>
      </section>

      {/* Breakout Moments Carousel */}
      <BreakoutMomentsCarousel />

      {/* Stats Section */}
      <StatsSection />

      {/* Full Toolkit */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium uppercase tracking-wide mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Full Toolkit
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              A <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">new standard</span> for artist tools
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Cutting-edge technology built for modern artists and the teams behind them.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Telescope, 
                title: "Explore Library", 
                description: "A curated library of viral music content. Filter by genre, style, effort, and creator size. Updated daily with fresh breakout moments.",
                iconBg: "bg-teal-50 dark:bg-teal-500/20",
                iconColor: "text-teal-600 dark:text-teal-400",
                link: "/explore",
              },
              { 
                icon: Disc3, 
                title: "Audio Analysis", 
                description: "AI breaks down your song's genre, mood, tempo, and instruments to find the perfect content match.",
                iconBg: "bg-rose-50 dark:bg-rose-500/20",
                iconColor: "text-rose-600 dark:text-rose-400",
                link: "/create",
              },
              { 
                icon: Route, 
                title: "Personalized Content Plans", 
                description: "Skip thousands of hours of research. AI delivers the optimal content plan matched to your sound.",
                iconBg: "bg-violet-50 dark:bg-violet-500/20",
                iconColor: "text-violet-600 dark:text-violet-400",
                link: "/plan",
              },
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                whileInView={{ opacity: 1, y: 0, scale: 1 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.6, delay: idx * 0.1 }} 
                className="group relative"
              >
                <div 
                  onClick={() => navigate(feature.link)}
                  className="relative bg-white dark:bg-gray-800/80 backdrop-blur rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
                    {idx === 2 ? (
                      <TbMap className={`w-6 h-6 ${feature.iconColor}`} />
                    ) : (
                      <feature.icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.75} />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Plus more features row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.5, delay: 0.6 }} 
            className="mt-8 mb-2"
          >
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">Plus more built-in</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: "🤝", label: "Shared Workspaces" },
                { icon: "📅", label: "Content Calendar" },
                { icon: "🔄", label: "Daily Updates" },
                { icon: "📁", label: "Favorites & Folders" },
                { icon: "🎯", label: "Smart Filters" },
                { icon: "📱", label: "TikTok + Reels" }
              ].map((extra, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 + idx * 0.05 }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span>{extra.icon}</span>
                  <span className="whitespace-nowrap">{extra.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Roadmap callout */}
            <div className="mt-6 flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-lg">🗺️</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                We're always building.{' '}
                <button 
                  onClick={() => {
                    navigate('/discover');
                    window.scrollTo(0, 0);
                  }} 
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  See what's next & suggest features →
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Founders Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-medium uppercase tracking-wide mb-6">
              <Quote className="w-3.5 h-3.5" />
              Built by Artists
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">We've been in <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">your shoes</span></h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
              We built Wavebound because <span className="font-semibold text-gray-900 dark:text-white">artists deserve AI that actually helps them</span>. Born from our own frustration with content creation, we built the tool we wished existed.
            </p>
            <Button
              variant="outline"
              onClick={() => { navigate('/about'); window.scrollTo(0, 0); }}
              className="rounded-md text-sm px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 font-medium bg-white dark:bg-gray-800 transition-colors"
            >
              Read Our Full Story
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors h-full flex flex-col">
                <div className="h-48 overflow-hidden">
                  <img src={paulStudio} alt="Paul Hers in studio" className="w-full h-full object-cover" style={{ objectPosition: 'center 60%' }} />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paul Hers</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Co-Founder</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Multi-Platinum Producer & Songwriter</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed flex-1">
                    "After a decade of creating hits for artists, I've seen them struggle more and more to keep up with content. We built Wavebound because great music deserves to be heard - and artists deserve to stay artists."
                  </p>
                  <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Disc3 className="w-4 h-4 text-sky-500" />
                      <span>Platinum records • 500M+ streams</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors h-full flex flex-col">
                <div className="h-48 overflow-hidden">
                  <img src={adenStage} alt="Aden Foyer on stage" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }} />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Aden Foyer</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Co-Founder</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Chart-Topping Artist • 200M+ Streams</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed flex-1">
                    "As an artist, the hardest part isn't making great music anymore - it's getting anyone to hear it. You shouldn't have to be a natural-born influencer to succeed as an artist. We're here to change that."
                  </p>
                  <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Mic2 className="w-4 h-4 text-sky-500" />
                      <span>Platinum records • 100M+ social views</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Outlier Detection */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium uppercase tracking-wide mb-6">
              <Zap className="w-3.5 h-3.5" />
              Outlier Detection
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              We find the <span className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">outliers</span>, not just the popular
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our AI identifies videos that went viral despite the creator's small following — real breakout moments you can learn from.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-5">
            {/* Other Tools - Muted card */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-gray-100 dark:bg-gray-800/80 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <span className="font-medium text-gray-500 dark:text-gray-400">Other Tools</span>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden grayscale">
                    <img 
                      src="https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_73.jpg" 
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">@BigCreator</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">2M followers</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-gray-600 dark:text-gray-300">1.5M</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">views</div>
                  </div>
                </div>
                <div className="flex justify-center pt-3">
                  <div className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-md text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                    0.75x their average
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Wavebound - Vibrant card */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="bg-amber-50 dark:bg-gray-900 rounded-lg p-6 border-2 border-amber-200 dark:border-amber-500/40 relative shadow-lg shadow-amber-100 dark:shadow-amber-500/10">
              <div className="absolute top-4 right-4">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white dark:bg-gray-800 rounded-md px-1.5 py-0.5 shadow-md shadow-amber-500/20 border border-amber-200 dark:border-amber-500/30"
                >
                  <img src={waveboundLogo} alt="Wavebound" className="h-8 w-auto" />
                </motion.div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-md bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Outlier Discovery</span>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shadow-md ring-2 ring-amber-300 dark:ring-amber-500/50">
                    <img 
                      src="https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_93.jpg" 
                      alt="Viral video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">@SmallArtist</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">8K followers</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">2.1M</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">views</div>
                  </div>
                </div>
                <div className="flex justify-center pt-3">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-md shadow-orange-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    87x their average
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Why it matters callout */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 shadow-lg shadow-gray-200/50 dark:shadow-black/20">
              <motion.div
                animate={{ 
                  filter: ['drop-shadow(0 0 0px #fbbf24)', 'drop-shadow(0 0 8px #fbbf24)', 'drop-shadow(0 0 0px #fbbf24)'],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
              </motion.div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Why it matters:</span> Small creators = strategies you can actually replicate
              </p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 text-center"
          >
            <Button 
              onClick={() => navigate('/discover')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all h-auto"
            >
              Explore Outliers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </section>


      {/* Creative Tools Section */}
      <VideoHelpSectionVariantC />

      {/* Explore Library Preview */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                whileInView={{ scale: 1, opacity: 1 }} 
                viewport={{ once: true }} 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium uppercase tracking-wide mb-4"
              >
                <Filter className="w-3.5 h-3.5" />
                Viral Content Library
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Research that would take you weeks — <span className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">in seconds</span>
              </h2>
              
              <p className="text-lg text-foreground/80 mb-6 leading-relaxed">
                Stop scrolling through feeds hoping to find what works. Access 15,000+ viral videos, filtered by your exact genre, style, and creator size — so you can study winning formats in minutes, not hours.
              </p>

              <ul className="space-y-2 mb-8">
                {[
                  { title: "Smart Filters", desc: "Genre, content style, effort level, follower count, and viral score." },
                  { title: "Outlier Detection", desc: "Find videos that blew up despite small followings — strategies you can replicate." },
                  { title: "Cross-Platform", desc: "TikToks, Reels, and photo carousels in one searchable library." },
                  { title: "Updated Daily", desc: "Fresh breakout content added every day. Never miss a trend." }
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{item.title}:</span>{" "}
                      <span className="text-foreground/70">{item.desc}</span>
                    </div>
                  </motion.li>
                ))}
              </ul>

              <div className="flex items-center gap-4 mb-6">
                <Button 
                  onClick={() => navigate('/discover')} 
                  variant="outline"
                  className="border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                >
                  Explore the Library
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white dark:border-gray-900" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white dark:border-gray-900" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white dark:border-gray-900" />
                  </div>
                  <span>15,000+ videos indexed</span>
                </div>
              </div>
            </motion.div>

            {/* Right side - Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.8 }} 
              className="relative"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Explore Library</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Updated today
                  </div>
                </div>

                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex flex-wrap gap-1.5">
                    {["Hip-Hop", "Lipsync", "Under 50K", "Score 8+"].map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-xs font-medium rounded-md border border-cyan-200 dark:border-cyan-500/30">{tag}</span>
                    ))}
                    <span className="px-2 py-1 text-gray-400 dark:text-gray-500 text-xs">+8 more</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { thumb: "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_73.jpg", views: "2.1M", score: 9.2, hot: true },
                      { thumb: "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_93.jpg", views: "847K", score: 8.7, hot: true },
                      { thumb: "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_77.jpg", views: "1.3M", score: 8.4 },
                      { thumb: "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_187.jpg", views: "623K", score: 8.1 },
                      { thumb: "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_187.jpg", views: "1.8M", score: 9.0 },
                      { thumb: "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/thumbnails/thumbnail_73.jpg", views: "512K", score: 7.9 }
                    ].map((item, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        whileInView={{ opacity: 1, scale: 1 }} 
                        viewport={{ once: true }} 
                        transition={{ delay: 0.5 + idx * 0.05 }} 
                        className="aspect-[9/16] rounded-lg relative overflow-hidden group cursor-pointer"
                      >
                        <img src={item.thumb} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                          <span className="text-white text-[10px] font-medium">{item.views}</span>
                          <span className="bg-white/90 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded">{item.score}</span>
                        </div>
                        {item.hot && (
                          <div className="absolute top-1.5 right-1.5">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                              <Flame className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-900 dark:text-white">247</span> results</span>
                    <span className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-900 dark:text-white">12</span> genres</span>
                  </div>
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium">View all →</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Gradient CTA */}
      <GradientCTASection />

      {/* Onboarding Modal */}
      <OnboardingModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      
      <FooterSection />
    </AppLayout>
  );
};

export default Index;
