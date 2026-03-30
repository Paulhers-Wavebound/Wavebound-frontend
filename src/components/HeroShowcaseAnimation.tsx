import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Eye, TrendingUp, Zap, Music, Video, 
  Camera, Upload, User, Calendar, CheckCircle, Flame,
  MessageSquare, Mic2, Image, ExternalLink,
  Lightbulb, Target, Wand2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Animated W Logo with waveform effect
const WaveformLogo = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const wavePoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 20; i++) {
      points.push(i);
    }
    return points;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center py-16"
    >
      <div className="relative w-24 h-20">
        <svg viewBox="0 0 100 80" className="w-full h-full">
          {wavePoints.map((i) => {
            const x = (i / 19) * 100;
            const baseHeight = 
              Math.sin((x / 100) * Math.PI * 2 - Math.PI / 2) * 25 + 40;
            
            return (
              <motion.rect
                key={i}
                x={x - 2}
                width={3}
                rx={1.5}
                fill="url(#waveGradient)"
                initial={{ y: 40, height: 0 }}
                animate={{ 
                  y: [40, baseHeight - 15, baseHeight],
                  height: [0, 30, 20],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              />
            );
          })}
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
        
        <motion.div
          className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
};

interface Thumbnail {
  id: number;
  url: string;
  type: 'tiktok' | 'reel';
}

interface ConversationScenario {
  id: string;
  icon: typeof Music;
  userQuery: string;
  type: 'video-ideas' | 'audio-analysis' | 'hook-suggestions' | 'no-camera' | 'profile-audit' | 'concert-prep' | 'music-video' | 'producer-content' | 'video-improve';
}

const scenarios: ConversationScenario[] = [
  {
    id: 'quick-ideas',
    icon: Camera,
    userQuery: "I only have 5 minutes. I'm in my bedroom with just my phone.",
    type: 'video-ideas'
  },
  {
    id: 'audio-analysis',
    icon: Music,
    userQuery: "I just made this, what should I do on social media for it",
    type: 'audio-analysis'
  },
  {
    id: 'hook-help',
    icon: Video,
    userQuery: "i filmed this, what should the hook be?",
    type: 'hook-suggestions'
  },
  {
    id: 'no-camera',
    icon: Camera,
    userQuery: "i don't feel comfortable in front of the camera, how can I promote my song",
    type: 'no-camera'
  },
  {
    id: 'profile-audit',
    icon: User,
    userQuery: "analyze my profile and give me advice",
    type: 'profile-audit'
  },
  {
    id: 'concert',
    icon: Mic2,
    userQuery: "i'm having a concert tomorrow, what to do",
    type: 'concert-prep'
  },
  {
    id: 'music-video',
    icon: Video,
    userQuery: "how do i promote my music video on TikTok",
    type: 'music-video'
  },
  {
    id: 'producer',
    icon: Music,
    userQuery: "what content works for producers/DJs right now",
    type: 'producer-content'
  },
  {
    id: 'improve',
    icon: Video,
    userQuery: "how can i make this video do better",
    type: 'video-improve'
  }
];

// Response components for each scenario type
const VideoIdeasResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const ideas = [
    { title: "Mirror Lipsync", emoji: "🪞", views: "2.1M" },
    { title: "Bedroom Studio Tour", emoji: "🛏️", views: "1.8M" },
    { title: "POV: Writing This", emoji: "✍️", views: "3.2M" },
    { title: "Quick Acoustic Take", emoji: "🎸", views: "2.7M" },
    { title: "Phone Selfie Vibe", emoji: "📱", views: "1.5M" },
  ];

  const carouselIdeas = [
    { title: "Lyric Breakdown Slides", views: "890K" },
    { title: "Behind The Song Story", views: "1.2M" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <p className="text-sm text-gray-600">Here are 5 video ideas you can film in under 5 minutes:</p>
      
      <div className="grid grid-cols-5 gap-2">
        {ideas.map((idea, i) => (
          <motion.div
            key={idea.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative group"
          >
            <div className="h-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20">
              {thumbnails[i]?.url ? (
                <img src={thumbnails[i].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">{idea.emoji}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                <p className="text-[10px] font-medium text-white truncate">{idea.title}</p>
                <div className="flex items-center gap-0.5 text-[9px] text-white/70">
                  <Eye className="w-2.5 h-2.5" />
                  {idea.views}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-xs text-gray-500 mb-2">You can also make picture slides:</p>
        <div className="flex gap-2">
          {carouselIdeas.map((idea, i) => (
            <motion.div
              key={idea.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex-1 bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="h-16 bg-gradient-to-br from-primary/20 to-primary/10 relative">
                {thumbnails[5 + i]?.url ? (
                  <img src={thumbnails[5 + i].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary/40" />
                  </div>
                )}
                <div className="absolute top-1 left-1">
                  <span className="text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">📷 Slides</span>
                </div>
              </div>
              <div className="p-2">
                <span className="text-xs font-medium text-gray-800">{idea.title}</span>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                  <Eye className="w-2.5 h-2.5" />
                  {idea.views} views
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const AudioAnalysisResponse = ({ phase, thumbnails }: { phase: 'analyzing' | 'results' | 'plan-prompt' | 'plan', thumbnails: Thumbnail[] }) => {
  const analysisSteps = ["Analyzing audio waveform...", "Detecting mood & energy...", "Matching to viral content..."];
  const [currentStep, setCurrentStep] = useState(0);
  
  const analysis = { bpm: 128, key: "F Minor", mood: "Energetic", genre: "Electronic" };
  const videoIdeas = [
    { title: "Club Night Teaser", why: "High energy drops match peak viral moments" },
    { title: "Production Breakdown", why: "Shows the craft behind the sound" },
    { title: "First Listen Reaction", why: "Authentic reactions drive shares" },
    { title: "Sunset Drive POV", why: "Matches the track's emotional arc" },
    { title: "Dance Challenge", why: "Catchy drop perfect for choreography" },
  ];

  const contentPlan = [
    { day: "Mon", content: "Teaser clip - 15s hook" },
    { day: "Tue", content: "Production BTS" },
    { day: "Wed", content: "Full drop reveal" },
    { day: "Thu", content: "Fan reaction duets" },
    { day: "Fri", content: "Dance challenge launch" },
    { day: "Sat", content: "Behind the lyrics" },
    { day: "Sun", content: "Live Q&A announcement" },
    { day: "Mon", content: "Remix preview" },
    { day: "Tue", content: "Studio tour" },
    { day: "Wed", content: "Collab tease" },
    { day: "Thu", content: "Acoustic version" },
    { day: "Fri", content: "Fan appreciation" },
    { day: "Sat", content: "Music video BTS" },
    { day: "Sun", content: "Full release push" },
  ];

  useEffect(() => {
    if (phase === 'analyzing') {
      const interval = setInterval(() => {
        setCurrentStep(s => Math.min(s + 1, 2));
      }, 600);
      return () => clearInterval(interval);
    }
  }, [phase]);

  if (phase === 'analyzing') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Wand2 className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-xs text-gray-600">{analysisSteps[currentStep]}</span>
        </div>
        <div className="space-y-1.5">
          {analysisSteps.map((step, i) => (
            <div key={step} className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: i <= currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.4 }}
              />
            </div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: currentStep >= 1 ? 1 : 0 }}
          className="flex gap-2 pt-2"
        >
          {Object.entries(analysis).map(([key, value], i) => (
            <motion.div
              key={key}
              initial={{ scale: 0 }}
              animate={{ scale: currentStep >= 1 ? 1 : 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-primary/10 rounded px-2 py-1"
            >
              <p className="text-[8px] text-gray-400 uppercase">{key}</p>
              <p className="text-[10px] font-medium text-gray-800">{value}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (phase === 'results') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <p className="text-sm text-gray-600">Based on your track, here are 5 video concepts:</p>
        <div className="space-y-2">
          {videoIdeas.map((idea, i) => (
            <motion.div
              key={idea.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                {thumbnails[i]?.url ? (
                  <img src={thumbnails[i].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <Video className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">{idea.title}</p>
                <p className="text-[11px] text-gray-500">{idea.why}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (phase === 'plan-prompt') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {/* Show previous results summary */}
        <div className="space-y-1">
          {videoIdeas.map((idea, i) => (
            <motion.div
              key={idea.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="flex items-center gap-2 p-1 rounded-lg bg-gray-50/50 border border-gray-100/50"
            >
              <div className="w-5 h-7 rounded overflow-hidden flex-shrink-0">
                {thumbnails[i]?.url ? (
                  <img src={thumbnails[i].url} alt="" className="w-full h-full object-cover opacity-70" />
                ) : (
                  <div className="w-full h-full bg-primary/10" />
                )}
              </div>
              <p className="text-[9px] text-gray-500">{idea.title}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-gray-700">Should I make a content plan for you?</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex justify-end"
        >
          <div className="bg-primary/10 rounded-lg px-4 py-2 border border-primary/20">
            <p className="text-xs font-medium text-primary">yes</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-gray-800">Your 14-Day Content Plan</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {contentPlan.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gradient-to-b from-primary/20 to-primary/5 rounded p-1.5 border border-primary/20"
          >
            <p className="text-[9px] font-bold text-primary text-center">{item.day}</p>
            <p className="text-[8px] text-gray-600 text-center mt-0.5 line-clamp-2">{item.content}</p>
          </motion.div>
        ))}
      </div>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded py-2 flex items-center justify-center gap-1.5 border border-primary/20 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Edit plan in workspace
      </motion.button>
    </motion.div>
  );
};

const HookSuggestionsResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const hooks = [
    { text: "POV: you just discovered your new favorite song", views: "4.2M" },
    { text: "I spent 3 months making this...", views: "2.8M" },
    { text: "This is what heartbreak sounds like", views: "3.1M" },
    { text: "Nobody talks about this part of being an artist", views: "2.4M" },
    { text: "Wait for the drop...", views: "5.1M" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      <p className="text-sm text-gray-600">Based on similar videos that did well:</p>
      
      <div className="space-y-1.5">
        {hooks.map((hook, i) => (
          <motion.div
            key={hook.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
          >
            <div className="w-8 h-11 rounded overflow-hidden flex-shrink-0">
              {thumbnails[i]?.url ? (
                <img src={thumbnails[i].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-gray-800 truncate">"{hook.text}"</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                <TrendingUp className="w-2.5 h-2.5" />
                {hook.views} avg
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const NoCameraResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const content = [
    { type: "Photo Carousel", title: "Lyric Story Slides", views: "1.2M", isCarousel: true },
    { type: "Video", title: "Aesthetic B-Roll Only", views: "890K", isCarousel: false },
    { type: "Photo Carousel", title: "Behind The Music", views: "2.1M", isCarousel: true },
    { type: "Video", title: "Hand/Instrument Close-ups", views: "1.5M", isCarousel: false },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <p className="text-sm text-gray-600">Content that works without showing your face:</p>
      
      <div className="grid grid-cols-4 gap-2">
        {content.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-lg overflow-hidden border border-gray-200"
          >
            <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5">
              {thumbnails[i]?.url && (
                <img src={thumbnails[i].url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute top-1.5 left-1.5">
              <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                {item.isCarousel ? "📷" : "🎬"}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-[11px] font-medium text-white">{item.title}</p>
              <p className="text-[10px] text-white/70">{item.views}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const ProfileAuditResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const insights = [
    { label: "Posting Frequency", value: "2.3x below optimal", status: "warning" },
    { label: "Hook Strength", value: "Strong first 2 seconds", status: "good" },
    { label: "Sound Usage", value: "Missing trending sounds", status: "warning" },
    { label: "Best Post Time", value: "Audience peaks 7PM EST", status: "insight" },
  ];

  // Mini chart data points
  const chartData = [35, 52, 45, 68, 42, 78, 65];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-gray-800">Profile Analysis Complete</span>
        </div>
        {/* Mini engagement graph */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-end gap-0.5 h-6"
        >
          {chartData.map((value, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${value}%` }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
              className="w-1.5 bg-primary/60 rounded-t-sm"
            />
          ))}
          <span className="text-[8px] text-gray-400 ml-1">7d</span>
        </motion.div>
      </div>
      
      <div className="flex gap-3">
        <div className="flex-1 grid grid-cols-2 gap-2">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-2 rounded-lg border ${
                insight.status === 'good' ? 'bg-emerald-50 border-emerald-200' :
                insight.status === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-primary/10 border-primary/20'
              }`}
            >
              <p className="text-[10px] text-gray-500">{insight.label}</p>
              <p className="text-[11px] font-medium text-gray-800">{insight.value}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Engagement trend chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-28 bg-gray-50 rounded-lg border border-gray-200 p-2"
        >
          <p className="text-[9px] text-gray-500 mb-1">Engagement Trend</p>
          <svg viewBox="0 0 100 40" className="w-full h-10">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0,30 Q15,25 25,28 T50,20 T75,15 T100,8"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />
            <path
              d="M0,30 Q15,25 25,28 T50,20 T75,15 T100,8 L100,40 L0,40 Z"
              fill="url(#areaGradient)"
            />
          </svg>
          <p className="text-[10px] text-emerald-500 font-medium">↑ 24% this week</p>
        </motion.div>
      </div>

      {/* Open Full Analytics Button */}
      <motion.button
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <TrendingUp className="w-4 h-4" />
        Open Full Analytics
      </motion.button>
    </motion.div>
  );
};

const ConcertPrepResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const timeline = [
    { time: "2 hours before", task: "Arrive & walkthrough", status: "pending" },
    { time: "1 hour before", task: "Soundcheck + film POV", status: "pending" },
    { time: "During show", task: "Have friend film 3 angles", status: "pending" },
    { time: "Right after", task: "Post thank you story", status: "pending" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Mic2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-gray-800">Your Concert Day Timeline</span>
      </div>

      {/* Timeline visual */}
      <div className="relative pl-4 border-l-2 border-primary/30 space-y-3">
        {timeline.map((item, i) => (
          <motion.div
            key={item.time}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="relative"
          >
            <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
              <p className="text-[10px] font-bold text-primary">{item.time}</p>
              <p className="text-xs text-gray-700">{item.task}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick checklist */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-amber-50 border border-amber-200 rounded-lg p-2.5"
      >
        <p className="text-[10px] font-bold text-amber-700 mb-1">⚡ Quick Prep</p>
        <div className="flex gap-3 text-[10px] text-amber-600">
          <span>✓ Phone at 100%</span>
          <span>✓ Clear 5GB storage</span>
          <span>✓ Extra battery pack</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MusicVideoResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const rolloutPlan = [
    { day: "Day 1", content: "BTS teaser", platform: "TikTok", icon: "🎬" },
    { day: "Day 2", content: "15s best clip", platform: "Reels", icon: "✂️" },
    { day: "Day 3", content: "Full premiere", platform: "YouTube", icon: "🎥" },
    { day: "Day 4", content: "Behind scenes", platform: "TikTok", icon: "📱" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-gray-800">Music Video Rollout Strategy</span>
      </div>
      
      {/* 4-day rollout grid */}
      <div className="grid grid-cols-4 gap-2">
        {rolloutPlan.map((item, i) => (
          <motion.div
            key={item.day}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg overflow-hidden border border-gray-200 bg-white"
          >
            <div className="h-16 relative">
              {thumbnails[i + 8]?.url ? (
                <img src={thumbnails[i + 8].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-xl">{item.icon}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-1 left-1.5">
                <p className="text-[9px] font-bold text-white">{item.day}</p>
              </div>
            </div>
            <div className="p-1.5 bg-gray-50">
              <p className="text-[9px] font-medium text-gray-800">{item.content}</p>
              <p className="text-[8px] text-gray-500">{item.platform}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20"
      >
        <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-[11px] text-gray-700">
          <span className="font-medium">Pro tip:</span> Post the "making of" content BEFORE the premiere to build anticipation
        </p>
      </motion.div>
    </motion.div>
  );
};

const ProducerContentResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const trendingFormats = [
    { format: "Before/After", growth: "+340%", color: "from-emerald-400 to-teal-500" },
    { format: "Sample Flip", growth: "+420%", color: "from-purple-400 to-indigo-500" },
    { format: "Studio ASMR", growth: "+250%", color: "from-orange-400 to-red-500" },
  ];

  const exampleHooks = [
    "\"I turned a $1 sample into this...\"",
    "\"POV: mixing at 3am hits different\"",
    "\"Nobody asked but here's my plugin chain\"",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-gray-800">What's Working for Producers Right Now</span>
      </div>

      {/* Trending formats as horizontal bars */}
      <div className="space-y-2">
        {trendingFormats.map((item, i) => (
          <motion.div
            key={item.format}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="flex items-center gap-2"
          >
            <div className="w-24 text-[11px] font-medium text-gray-700">{item.format}</div>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${70 + i * 10}%` }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                className={`h-full bg-gradient-to-r ${item.color} rounded-full flex items-center justify-end pr-2`}
              >
                <span className="text-[10px] font-bold text-white">{item.growth}</span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Example hooks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-1.5"
      >
        <p className="text-xs font-medium text-gray-800">Hooks that convert:</p>
        {exampleHooks.map((hook, i) => (
          <motion.div
            key={hook}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 rounded px-2 py-1"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            {hook}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

const VideoImproveResponse = ({ thumbnails }: { thumbnails: Thumbnail[] }) => {
  const analysis = [
    { metric: "Hook", status: "weak", suggestion: "First 0.5s needs motion" },
    { metric: "Pacing", status: "good", suggestion: "Good cut rhythm" },
    { metric: "Sound", status: "weak", suggestion: "Add trending audio" },
  ];

  const similarHits = [
    { title: "Used faster cuts in hook", boost: "+2.3x views" },
    { title: "Added text overlay", boost: "+1.8x shares" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
        <Upload className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-600">Analyzing your_video.mp4...</span>
      </div>

      <div className="space-y-2">
        {analysis.map((item, i) => (
          <motion.div
            key={item.metric}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 p-2.5 rounded-lg border ${
              item.status === 'good' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${item.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-xs font-medium text-gray-800 w-14">{item.metric}</span>
            <span className="text-[11px] text-gray-600 flex-1">{item.suggestion}</span>
          </motion.div>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-800">Similar videos that improved:</p>
        <div className="grid grid-cols-2 gap-2">
          {similarHits.map((hit, i) => (
            <motion.div
              key={hit.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="h-16 bg-gradient-to-br from-primary/20 to-primary/10 relative">
                {thumbnails[i]?.url ? (
                  <img src={thumbnails[i].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1 right-1">
                  <span className="text-[10px] font-bold text-emerald-400">{hit.boost}</span>
                </div>
              </div>
              <div className="p-1.5 bg-gray-50">
                <p className="text-[10px] text-gray-600">{hit.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const HeroShowcaseAnimation = () => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'thinking' | 'results'>('typing');
  const [typedText, setTypedText] = useState('');
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [audioPhase, setAudioPhase] = useState<'analyzing' | 'results' | 'plan-prompt' | 'plan'>('analyzing');
  const [isPaused, setIsPaused] = useState(false);

  const scenario = scenarios[currentScenario];
  const Icon = scenario.icon;

  // Fetch thumbnails from normalized Assets tables
  useEffect(() => {
    const fetchThumbnails = async () => {
      const { data: tiktokData } = await supabase
        .from('0.1. Table 4 - Assets - TikTok')
        .select('video_id, thumbnail_url')
        .not('thumbnail_url', 'is', null)
        .limit(10);
      
      const { data: reelsData } = await supabase
        .from('0.1. Table 4.2 - Assets - Reels')
        .select('video_id, thumbnail_url')
        .not('thumbnail_url', 'is', null)
        .limit(10);

      const combined: Thumbnail[] = [
        ...(tiktokData?.filter(d => d.thumbnail_url && d.thumbnail_url.length > 20).map(d => ({ id: d.video_id, url: d.thumbnail_url!, type: 'tiktok' as const })) || []),
        ...(reelsData?.filter(d => d.thumbnail_url && d.thumbnail_url.length > 20).map(d => ({ id: d.video_id, url: d.thumbnail_url!, type: 'reel' as const })) || []),
      ];
      
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }
      
      setThumbnails(combined);
    };
    fetchThumbnails();
  }, []);

  const runAnimation = useCallback(() => {
    setTypedText("");
    setPhase("typing");
    setAudioPhase("analyzing");

    let charIndex = 0;
    const text = scenario.userQuery;
    let typeInterval: NodeJS.Timeout;
    
    // Delay typing start to let fade transition complete
    const startDelay = setTimeout(() => {
      typeInterval = setInterval(() => {
        if (charIndex < text.length) {
          setTypedText(text.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setPhase("thinking"), 300);
          setTimeout(() => setPhase("results"), 1200);
        }
      }, 12);
    }, 400);

    return () => {
      clearTimeout(startDelay);
      clearInterval(typeInterval);
    };
  }, [scenario.userQuery]);

  useEffect(() => {
    const cleanup = runAnimation();
    return cleanup;
  }, [currentScenario, runAnimation]);

  // Audio analysis sub-phases
  useEffect(() => {
    if (phase === 'results' && scenario.type === 'audio-analysis') {
      if (audioPhase === 'analyzing') {
        const timer = setTimeout(() => setAudioPhase('results'), 2000);
        return () => clearTimeout(timer);
      }
      if (audioPhase === 'results') {
        const timer = setTimeout(() => setAudioPhase('plan-prompt'), 2500);
        return () => clearTimeout(timer);
      }
      if (audioPhase === 'plan-prompt') {
        const timer = setTimeout(() => setAudioPhase('plan'), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, scenario.type, audioPhase]);

  // Auto-advance scenarios
  useEffect(() => {
    if (isPaused || phase !== "results") return;
    
    const delay = scenario.type === 'audio-analysis' ?
      (audioPhase === 'plan' ? 3000 : 0) : 
      3000;
    
    if (scenario.type === 'audio-analysis' && audioPhase !== 'plan') return;
    
    const timer = setTimeout(() => {
      setCurrentScenario((prev) => (prev + 1) % scenarios.length);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentScenario, isPaused, phase, scenario.type, audioPhase]);

  const renderResponse = () => {
    switch (scenario.type) {
      case 'video-ideas':
        return <VideoIdeasResponse thumbnails={thumbnails} />;
      case 'audio-analysis':
        return <AudioAnalysisResponse phase={audioPhase} thumbnails={thumbnails} />;
      case 'hook-suggestions':
        return <HookSuggestionsResponse thumbnails={thumbnails} />;
      case 'no-camera':
        return <NoCameraResponse thumbnails={thumbnails} />;
      case 'profile-audit':
        return <ProfileAuditResponse thumbnails={thumbnails} />;
      case 'concert-prep':
        return <ConcertPrepResponse thumbnails={thumbnails} />;
      case 'music-video':
        return <MusicVideoResponse thumbnails={thumbnails} />;
      case 'producer-content':
        return <ProducerContentResponse thumbnails={thumbnails} />;
      case 'video-improve':
        return <VideoImproveResponse thumbnails={thumbnails} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto mb-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-2xl overflow-hidden">
          {/* Mac-style Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs font-medium text-gray-500">Wavebound Assistant</span>
            <Sparkles className="w-3 h-3 text-primary ml-auto" />
          </div>

          {/* Content */}
          <div className="p-6 h-[420px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenario}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* User Query */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="max-w-[85%] flex flex-col items-start gap-2">
                    {/* File attachment indicator */}
                    {scenario.type === 'audio-analysis' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="self-start bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2 border border-gray-200 inline-flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                          <Music className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">new_track_v2.mp3</p>
                          <p className="text-[10px] text-gray-500">3:24 • 4.2 MB</p>
                        </div>
                      </motion.div>
                    )}
                    {(scenario.type === 'hook-suggestions' || scenario.type === 'video-improve') && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="self-start bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2 border border-gray-200 inline-flex items-center gap-2"
                      >
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center relative">
                          {thumbnails[0]?.url ? (
                            <img src={thumbnails[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Video className="w-4 h-4 text-primary" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-gray-800 border-b-[4px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{scenario.type === 'hook-suggestions' ? 'video_take_3.mp4' : 'my_video.mp4'}</p>
                          <p className="text-[10px] text-gray-500">0:18 • 12.4 MB</p>
                        </div>
                      </motion.div>
                    )}
                    <div className="self-start bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                      <p className="text-sm text-gray-800">{typedText}<span className="animate-pulse">|</span></p>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <AnimatePresence>
                  {phase === "thinking" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 ml-11 mb-4"
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-primary rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">Analyzing...</span>
                    </motion.div>
                  )}

                  {phase === "results" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-11 space-y-3"
                    >
                      {renderResponse()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer with dots */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
            {scenarios.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentScenario(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentScenario ? "bg-primary w-6" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroShowcaseAnimation;
