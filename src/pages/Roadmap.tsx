import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, Rocket, Clock, Lightbulb, ArrowUp, ArrowDown, Lock, Globe, Send, Loader2, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import FooterSection from '@/components/FooterSection';
import SEOHead from '@/components/SEOHead';
import waveboundLogo from '@/assets/wavebound-logo.png';

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  display_name: string | null;
  is_public: boolean;
  created_at: string;
  vote_count: number;
  user_vote: number | null; // 1, -1, or null
}

// Wave-themed anonymous names for users who don't provide a name
const WAVE_NAMES = [
  'Ripple', 'Tide', 'Surge', 'Curl', 'Drift', 'Echo', 'Crest', 'Swell', 
  'Current', 'Harbor', 'Reef', 'Coral', 'Shore', 'Breaker', 'Lagoon',
  'Wavelength', 'Momentum', 'Frequency', 'Horizon', 'Undertow'
];

const getRandomWaveName = () => {
  const name = WAVE_NAMES[Math.floor(Math.random() * WAVE_NAMES.length)];
  return `Anonymous ${name}`;
};

const Roadmap = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['active']);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes');
  const [isLoading, setIsLoading] = useState(true);
  const [anonymousId, setAnonymousId] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  // Generate or retrieve anonymous ID for voting + pre-fill name for logged-in users
  useEffect(() => {
    let storedId = localStorage.getItem('wavebound_anonymous_id');
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem('wavebound_anonymous_id', storedId);
    }
    setAnonymousId(storedId);

    // Check if user is logged in and pre-fill their name (only if they have a real display name)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        // Only use actual display name from metadata, not email
        const userDisplayName = user.user_metadata?.display_name || 
                               user.user_metadata?.full_name || '';
        setDisplayName(userDisplayName);
      }
    };
    checkUser();
  }, []);

  // Fetch suggestions
  useEffect(() => {
    fetchSuggestions();
  }, [sortBy, anonymousId]);

  const fetchSuggestions = async () => {
    if (!anonymousId) return;
    
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch public suggestions
      const { data: suggestionsData, error } = await supabase
        .from('feature_suggestions')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch vote counts and user's votes for each suggestion
      const suggestionsWithVotes = await Promise.all(
        (suggestionsData || []).map(async (suggestion) => {
          // Get total vote count
          const { data: votes } = await supabase
            .from('feature_votes')
            .select('vote_type')
            .eq('suggestion_id', suggestion.id);

          const voteCount = votes?.reduce((sum, v) => sum + v.vote_type, 0) || 0;

          // Get user's vote
          let userVote = null;
          if (user) {
            const { data: userVoteData } = await supabase
              .from('feature_votes')
              .select('vote_type')
              .eq('suggestion_id', suggestion.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userVote = userVoteData?.vote_type || null;
          } else {
            const { data: anonVoteData } = await supabase
              .from('feature_votes')
              .select('vote_type')
              .eq('suggestion_id', suggestion.id)
              .eq('anonymous_id', anonymousId)
              .maybeSingle();
            userVote = anonVoteData?.vote_type || null;
          }

          return {
            ...suggestion,
            vote_count: voteCount,
            user_vote: userVote,
          };
        })
      );

      // Sort based on preference
      const sorted = [...suggestionsWithVotes].sort((a, b) => {
        if (sortBy === 'votes') {
          return b.vote_count - a.vote_count;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setSuggestions(sorted);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleSubmitSuggestion = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Use provided name or generate a wave-themed anonymous name
      const finalDisplayName = displayName.trim() || getRandomWaveName();

      const { error } = await supabase.from('feature_suggestions').insert({
        title: title.trim(),
        description: description.trim() || null,
        display_name: finalDisplayName,
        is_public: isPublic,
        user_id: user?.id || null,
        anonymous_id: user ? null : anonymousId,
      });

      if (error) throw error;

      toast({
        title: "Suggestion submitted!",
        description: isPublic ? "Others can now vote on your idea." : "We'll review your private suggestion.",
      });

      setTitle('');
      setDescription('');
      // Reset name only if not logged in
      if (!isLoggedIn) {
        setDisplayName('');
      }
      setIsPublic(true);
      fetchSuggestions();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast({ title: "Failed to submit", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (suggestionId: string, voteType: 1 | -1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      // If user already voted the same way, remove the vote
      if (suggestion.user_vote === voteType) {
        if (user) {
          await supabase
            .from('feature_votes')
            .delete()
            .eq('suggestion_id', suggestionId)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('feature_votes')
            .delete()
            .eq('suggestion_id', suggestionId)
            .eq('anonymous_id', anonymousId);
        }
      } else {
        // Upsert the vote
        if (user) {
          await supabase
            .from('feature_votes')
            .upsert({
              suggestion_id: suggestionId,
              user_id: user.id,
              anonymous_id: null,
              vote_type: voteType,
            }, { onConflict: 'suggestion_id,user_id' });
        } else {
          await supabase
            .from('feature_votes')
            .upsert({
              suggestion_id: suggestionId,
              user_id: null,
              anonymous_id: anonymousId,
              vote_type: voteType,
            }, { onConflict: 'suggestion_id,anonymous_id' });
        }
      }

      // Optimistically update UI
      setSuggestions(prev => prev.map(s => {
        if (s.id !== suggestionId) return s;
        const wasVoted = s.user_vote === voteType;
        const newVote = wasVoted ? null : voteType;
        const voteDiff = wasVoted ? -voteType : (s.user_vote ? voteType * 2 : voteType);
        return {
          ...s,
          user_vote: newVote,
          vote_count: s.vote_count + voteDiff,
        };
      }));
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: "Failed to vote", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead 
        title="Product Roadmap"
        description="See what's coming to Wavebound. View our product roadmap, vote on features, and suggest new ideas."
        canonical="/roadmap"
      />
      <AppHeader />
      
      {/* Hero Section */}
      <section className="pt-20 pb-4 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wide bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-0">
              Roadmap
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
              Building the future of <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">artist tools</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-4">
              Wavebound is in early access. Your feedback shapes what we build next — expect rapid updates, new features weekly, and the occasional bug. Thanks for being here early!
            </p>
            
            {/* Personal share CTA */}
            <div className="mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ 
                    title: "Link copied! 🙏", 
                    description: "Thanks for helping us grow" 
                  });
                }}
                className="gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/40"
              >
                <Heart className="w-4 h-4" />
                Know someone with ideas? Share this page — it really helps
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                We're a small team and every suggestion helps us build something better
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Suggest Feature + Community Ideas - Side by Side */}

      {/* Suggest Feature + Community Ideas - Side by Side */}
      <section className="py-4 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Suggest a Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800/80 rounded-md border border-gray-200 dark:border-gray-700 p-5 h-fit"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suggest a Feature</h2>
                  <p className="text-sm text-muted-foreground">Share your ideas with us</p>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Feature title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900/50"
                />
                <Textarea
                  placeholder="Describe your idea (optional)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[60px] bg-gray-50 dark:bg-gray-900/50"
                />
                <div className="space-y-1.5">
                  <Label htmlFor="display-name" className="text-xs text-muted-foreground">
                    Your name (optional)
                  </Label>
                  <Input
                    id="display-name"
                    placeholder="Leave blank for a wave-themed alias ✨"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-900/50"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    id="public-toggle"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="public-toggle" className="flex items-center gap-2 text-sm cursor-pointer">
                    {isPublic ? (
                      <>
                        <Globe className="w-4 h-4 text-green-600" />
                        <span>Public - others can vote</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Private - only we see it</span>
                      </>
                    )}
                  </Label>
                </div>
                
                <Button 
                  onClick={handleSubmitSuggestion} 
                  disabled={!title.trim() || isSubmitting}
                  className="w-full gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Suggestion
                </Button>
              </div>
            </motion.div>

            {/* Community Ideas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800/80 rounded-md border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Community Ideas</h2>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1">
                  <button
                    onClick={() => setSortBy('votes')}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      sortBy === 'votes' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      sortBy === 'newest' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto pr-2 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No community suggestions yet. Be the first!</p>
                  </div>
                ) : (
                  suggestions.map((suggestion, idx) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 p-3"
                    >
                      {/* Vote buttons */}
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => handleVote(suggestion.id, 1)}
                          className={`p-1 rounded transition-colors ${
                            suggestion.user_vote === 1 
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-600' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className={`text-xs font-semibold ${
                          suggestion.vote_count > 0 ? 'text-green-600' : 
                          suggestion.vote_count < 0 ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {suggestion.vote_count}
                        </span>
                        <button
                          onClick={() => handleVote(suggestion.id, -1)}
                          className={`p-1 rounded transition-colors ${
                            suggestion.user_vote === -1 
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-500' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">{suggestion.title}</h3>
                        {suggestion.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suggestion.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          <span className="font-medium">{suggestion.display_name || 'Anonymous'}</span>
                          {' · '}
                          {new Date(suggestion.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      {/* Share button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/roadmap?suggestion=${suggestion.id}`;
                          navigator.clipboard.writeText(url);
                          toast({ title: "Link copied!", description: "Share to get more votes" });
                        }}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Share this suggestion"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Wavebound Roadmap - Bottom Section */}
      <section className="py-10 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Prominent centered header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src={waveboundLogo} alt="Wavebound" className="w-10 h-10" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Wavebound{' '}
                <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">
                  Roadmap
                </span>
              </h2>
            </div>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Our commitment to building the best tools for artists
            </p>
          </motion.div>

          {/* Active Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('active')}
              className="flex items-center gap-3 w-full text-left mb-4 group"
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSections.includes('active') ? 'rotate-90' : ''
                }`}
              />
              <Rocket className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="text-xl font-bold">Active</h3>
                <p className="text-sm text-muted-foreground">What we're working on now</p>
              </div>
            </button>
            {expandedSections.includes('active') && (
              <div className="ml-14 space-y-3">
                {[
                  { title: "Instagram Reels Integration", desc: "Expanding our database to include more Instagram Reels content" },
                  { title: "TikTok Photo Carousel Support", desc: "Full analysis support for TikTok photo carousels" },
                  { title: "AI Content Assistant", desc: "Chat with AI to get personalized content recommendations" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded border-l-2 border-l-orange-400 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-4">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planned Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('planned')}
              className="flex items-center gap-3 w-full text-left mb-4 group"
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSections.includes('planned') ? 'rotate-90' : ''
                }`}
              />
              <Clock className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="text-xl font-bold">Planned</h3>
                <p className="text-sm text-muted-foreground">What we intend to do</p>
              </div>
            </button>
            {expandedSections.includes('planned') && (
              <div className="ml-14 space-y-3">
                {[
                  { title: "Multi-profile Comparison", desc: "Compare analytics across multiple TikTok profiles" },
                  { title: "Scheduled Content Calendar", desc: "Plan and schedule your content strategy" },
                  { title: "Sound Library Search", desc: "Search through trending sounds by genre, mood, or performance" },
                  { title: "Collaboration Features", desc: "Share insights and plans with your team" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded border-l-2 border-l-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Considering Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('considering')}
              className="flex items-center gap-3 w-full text-left mb-4 group"
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSections.includes('considering') ? 'rotate-90' : ''
                }`}
              />
              <Lightbulb className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="text-xl font-bold">Considering</h3>
                <p className="text-sm text-muted-foreground">Haven't committed to it (yet)</p>
              </div>
            </button>
            {expandedSections.includes('considering') && (
              <div className="ml-14 space-y-3">
                {[
                  { title: "YouTube Shorts Support", desc: "Analyze and plan content for YouTube Shorts" },
                  { title: "Mobile App", desc: "Native mobile experience for on-the-go content planning" },
                  { title: "Scheduling Integration", desc: "Direct posting to TikTok and Instagram from your content plan" },
                  { title: "Creator Marketplace", desc: "Connect with other creators for collaborations" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded border-l-2 border-l-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('completed')}
              className="flex items-center gap-3 w-full text-left mb-4 group"
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  expandedSections.includes('completed') ? 'rotate-90' : ''
                }`}
              />
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="text-xl font-bold">Completed</h3>
                <p className="text-sm text-muted-foreground">Recently finished</p>
              </div>
            </button>
            {expandedSections.includes('completed') && (
              <div className="ml-14 space-y-3">
                {[
                  { title: "Video Analysis Engine", desc: "Deep analysis of TikTok videos with AI-powered insights" },
                  { title: "Profile Analytics Dashboard", desc: "Comprehensive profile performance metrics" },
                  { title: "Content Style Classification", desc: "Automatic categorization of content types and styles" },
                  { title: "Favorites & Collections", desc: "Save and organize your favorite content" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded border-l-2 border-l-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-8 text-muted-foreground text-sm">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      
      <FooterSection />
    </div>
  );
};

export default Roadmap;