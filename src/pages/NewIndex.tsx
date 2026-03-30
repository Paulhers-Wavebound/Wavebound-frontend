import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Sparkles, 
  Play,
  CheckCircle2,
  Compass,
  Music,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/layout/AppHeader';
import SEOHead from '@/components/SEOHead';
import waveboundLogo from '@/assets/wavebound-logo.png';
import FooterSection from '@/components/FooterSection';

const FEATURES = [
  {
    icon: Compass,
    title: 'Discover What Works',
    description: 'Browse viral content from artists like you. Filter by genre, style, and what\'s trending now.',
  },
  {
    icon: Sparkles,
    title: 'AI Strategy Assistant',
    description: 'Chat with AI that has real-time access to our database of viral music content.',
  },
  {
    icon: Music,
    title: 'Analyze Your Sound',
    description: 'Upload your track and get content ideas matched to your genre, mood, and style.',
  },
];

const STATS = [
  { value: '10K+', label: 'Viral videos analyzed' },
  { value: '15+', label: 'Music genres covered' },
  { value: '6hrs', label: 'Average time saved weekly' },
  { value: '2x', label: 'Performance boost guaranteed' },
];

export default function NewIndex() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Wavebound - Find Viral Content Ideas for Musicians"
        description="Discover what's working for artists on TikTok and Reels. AI-powered content strategy for independent musicians."
        canonical="/"
      />
      <AppHeader />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center relative"
            >
              <img 
                src={waveboundLogo} 
                alt="Wavebound" 
                className="w-16 h-16 rounded-2xl shadow-lg" 
              />
              <span className="absolute -top-1 -right-8 text-xs font-medium text-primary">(beta)</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Find viral content ideas
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                in minutes, not hours
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              See what's working for artists on TikTok & Reels. 
              Get AI-powered content ideas matched to your sound.
            </p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/discover')}
                className="px-8 h-12 text-base"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas with AI
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/create')}
                className="px-8 h-12 text-base"
              >
                <Zap className="w-4 h-4 mr-2" />
                AI Content Planner
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to win on social
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One tool. All your content research. No more endless scrolling.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-4 h-4" />
            Ready to grow?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Stop guessing. Start creating.
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of independent artists who use Wavebound to stay ahead of trends.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/discover')}
            className="px-8 h-12 text-base"
          >
            Get started free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </section>

      <FooterSection />
    </div>
  );
}
