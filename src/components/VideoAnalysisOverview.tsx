import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { 
  Sparkles, Music, Activity, Gauge, Heart, Mic, 
  KeyRound, Timer, Star, Wand2, Quote, Globe, ChevronDown, ChevronUp 
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Cell 
} from 'recharts';
import { cn } from '@/lib/utils';

interface VideoAnalysisOverviewProps {
  analysisData: any;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
};

const safeParse = (data: any): any => {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try { return JSON.parse(data); } catch { return null; }
};

const getStatColor = (value: string) => {
  const v = value?.toLowerCase();
  if (['high', 'positive'].includes(v)) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (['medium', 'neutral'].includes(v)) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};

export const VideoAnalysisOverview = ({ analysisData }: VideoAnalysisOverviewProps) => {
  const [lyricsExpanded, setLyricsExpanded] = useState(false);

  if (!analysisData) return null;

  const hooksData = analysisData.hooks_captions;
  const hookItem = Array.isArray(hooksData) ? hooksData[0] : hooksData;
  const audioAnalysis = hookItem?.audio_analysis || {};

  const moodData = safeParse(audioAnalysis.mood);
  const genreData = safeParse(audioAnalysis.genre);
  const subGenreData = safeParse(audioAnalysis.sub_genre);
  const instrumentsData = safeParse(audioAnalysis.instruments);
  const voicesData = safeParse(audioAnalysis.voices);
  const emotionalProfile = safeParse(audioAnalysis.emotional_profile);
  const technicalFeedback = safeParse(audioAnalysis.technical_feedback);
  const lyricAnalysis = safeParse(audioAnalysis.lyric_analysis);
  const contentPlanText = hookItem?.content_plan_text;

  // Top genre/sub-genre labels
  const topGenre = genreData ? Object.entries(genreData).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] : null;
  const topSubGenre = subGenreData ? Object.entries(subGenreData).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] : null;

  // Mood radar data — only > 30%
  const moodChartData = moodData
    ? Object.entries(moodData)
        .filter(([, v]) => typeof v === 'number' && (v as number) > 0.3)
        .map(([mood, value]) => ({ mood, value: Math.round((value as number) * 100) }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Instruments — only > 20%
  const instrumentChartData = instrumentsData
    ? Object.entries(instrumentsData)
        .filter(([, v]) => typeof v === 'number' && (v as number) > 0.2)
        .map(([name, value]) => ({ name, value: Math.round((value as number) * 100) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const transcription = lyricAnalysis?.transcription || '';
  const themes = lyricAnalysis?.themes || [];
  const language = lyricAnalysis?.language;
  const sentiment = lyricAnalysis?.sentiment;
  const energy = emotionalProfile?.energy_level;
  const dynamics = emotionalProfile?.dynamics;

  const voiceGender = voicesData?.predominant_gender;
  const voicePresence = voicesData?.presence_profile;
  const voiceConfidence = voicesData?.confidence;

  const techKey = technicalFeedback?.key;
  const techTempo = technicalFeedback?.tempo_bpm;
  const techQuality = technicalFeedback?.quality;
  const techEffects = technicalFeedback?.effects;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4 pt-4"
    >
      {/* Mood Radar + Audio DNA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood & Emotion Radar */}
        {moodChartData.length > 0 && (
          <motion.div variants={item} className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-blue-500" />
              Mood & Emotion
            </h3>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={moodChartData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="mood" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip 
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-1.5 text-xs shadow-lg">
                          <span className="font-medium">{d.mood}</span>: {d.value}%
                        </div>
                      );
                    }}
                  />
                  <Radar 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.2} 
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Emotional Profile Pills */}
            <div className="flex flex-wrap gap-2">
              {energy && (
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getStatColor(energy))}>
                  <Activity className="w-3 h-3 inline mr-1" />Energy: {energy}
                </span>
              )}
              {dynamics && (
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getStatColor(dynamics))}>
                  <Gauge className="w-3 h-3 inline mr-1" />Dynamics: {dynamics}
                </span>
              )}
              {sentiment && (
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getStatColor(sentiment))}>
                  <Heart className="w-3 h-3 inline mr-1" />Sentiment: {sentiment}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Audio DNA */}
        <motion.div variants={item} className="rounded-xl border bg-card p-5 space-y-5">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Music className="w-4 h-4 text-blue-500" />
            Audio DNA
          </h3>

          {/* Instruments Bar Chart */}
          {instrumentChartData.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Instruments Detected</p>
              <div className="w-full h-[calc(2.5rem*var(--bar-count))]" style={{ '--bar-count': instrumentChartData.length } as any}>
                <ResponsiveContainer width="100%" height={instrumentChartData.length * 36}>
                  <BarChart data={instrumentChartData} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background px-3 py-1.5 text-xs shadow-lg">
                            <span className="font-medium">{d.name}</span>: {d.value}%
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                      {instrumentChartData.map((_, i) => (
                        <Cell key={i} fill="#3B82F6" fillOpacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Technical Specs Grid */}
          {(techKey || techTempo || techQuality || techEffects) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Technical Specs</p>
              <div className="grid grid-cols-2 gap-2">
                {techKey && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                    <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Key</p>
                      <p className="text-xs font-medium">{techKey}</p>
                    </div>
                  </div>
                )}
                {techTempo && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                    <Timer className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Tempo</p>
                      <p className="text-xs font-medium">{techTempo} BPM</p>
                    </div>
                  </div>
                )}
                {techQuality && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                    <Star className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Quality</p>
                      <p className="text-xs font-medium">{techQuality}</p>
                    </div>
                  </div>
                )}
                {techEffects && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 col-span-2">
                    <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Effects</p>
                      <p className="text-xs font-medium">{techEffects}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voice Badge */}
          {voiceGender && (
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-foreground/80">
                {voiceGender} Vocal · {voicePresence} Presence
                {voiceConfidence && ` · ${Math.round(voiceConfidence * 100)}% confidence`}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* 4. Lyric Analysis Card */}
      {(themes.length > 0 || transcription) && (
        <motion.div variants={item} className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Quote className="w-4 h-4 text-purple-500" />
            Lyric Analysis
          </h3>

          {/* Theme Tags */}
          {themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {themes.map((theme: string) => (
                <Badge 
                  key={theme} 
                  className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300/30 dark:border-purple-700/30 hover:bg-purple-500/25"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          )}

          {/* Transcription Quote */}
          {transcription && (
            <div>
              <div className="border-l-2 border-blue-400/50 pl-4 py-1">
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{lyricsExpanded ? transcription : transcription.slice(0, 150)}{!lyricsExpanded && transcription.length > 150 ? '...' : ''}"
                </p>
              </div>
              {transcription.length > 150 && (
                <button
                  onClick={() => setLyricsExpanded(!lyricsExpanded)}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-2 transition-colors"
                >
                  {lyricsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {lyricsExpanded ? 'Show less' : 'Show full lyrics'}
                </button>
              )}
            </div>
          )}

          {/* Language Badge */}
          {language && (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">{language}</Badge>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
