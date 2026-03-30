import { Badge } from './ui/badge';
import { Music, Mic, Heart, Zap, Volume2, Waves, Sparkles, FileText, Quote } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { parseGenreWithScores } from '@/utils/contentRelevanceScoring';
import { cn } from '@/lib/utils';

interface AudioAnalysisChartsProps {
  analysisData: any;
}

// Minimal progress bar component
const MiniProgress = ({ value, label, color = 'primary' }: { value: number; label: string; color?: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-muted-foreground w-24 truncate">{label}</span>
    <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
      <div 
        className={cn(
          "h-full rounded-full transition-all duration-500",
          color === 'primary' && "bg-primary/70",
          color === 'secondary' && "bg-secondary/70",
          color === 'accent' && "bg-accent/70"
        )}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
    <span className="text-xs text-muted-foreground w-8 text-right">{value.toFixed(0)}%</span>
  </div>
);

// Section wrapper component
const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-3", className)}>
    {children}
  </div>
);

// Section header
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 pb-1">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
  </div>
);

export const AudioAnalysisCharts = ({ analysisData }: AudioAnalysisChartsProps) => {
  if (!analysisData) {
    return null;
  }

  // Handle both formats: hooks_captions can be array or single object
  const hooksData = analysisData.hooks_captions;
  const hookItem = Array.isArray(hooksData) ? hooksData[0] : hooksData;
  
  // Get audio_analysis from the hook item
  const audioAnalysis = hookItem?.audio_analysis || {};

  console.log('🎵 AudioAnalysisCharts received:', { 
    hasHooksData: !!hooksData, 
    hookItemType: hookItem ? typeof hookItem : 'none',
    audioAnalysisKeys: Object.keys(audioAnalysis)
  });

  // Helper to safely parse JSON strings
  const safeParse = (data: any): any => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  // Parse all the audio analysis fields
  const moodData = safeParse(audioAnalysis.mood);
  const genreData = safeParse(audioAnalysis.genre);
  const subGenreData = safeParse(audioAnalysis.sub_genre);
  const instrumentsData = safeParse(audioAnalysis.instruments);
  const voicesData = safeParse(audioAnalysis.voices);
  const emotionalProfile = safeParse(audioAnalysis.emotional_profile);
  const technicalFeedback = safeParse(audioAnalysis.technical_feedback);
  const lyricAnalysis = safeParse(audioAnalysis.lyric_analysis);

  // Convert mood object to array for radar chart
  const moodChartData = moodData 
    ? Object.entries(moodData)
        .map(([mood, value]) => ({
          mood,
          value: typeof value === 'number' ? value * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Convert genre object to array
  const genreChartData = genreData
    ? Object.entries(genreData)
        .map(([genre, value]) => ({
          genre,
          value: typeof value === 'number' ? value * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Convert sub-genre object to array  
  const subGenreChartData = subGenreData
    ? Object.entries(subGenreData)
        .map(([subGenre, value]) => ({
          subGenre,
          value: typeof value === 'number' ? value * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Convert instruments object to array
  const instrumentsChartData = instrumentsData
    ? Object.entries(instrumentsData)
        .map(([instrument, value]) => ({
          instrument,
          value: typeof value === 'number' ? value * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  const hasData = moodChartData.length > 0 || genreChartData.length > 0 || 
                  instrumentsChartData.length > 0 || emotionalProfile || 
                  voicesData || technicalFeedback || lyricAnalysis;

  if (!hasData) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-border/30">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Genre Confidence */}
        {genreChartData.length > 0 && (
          <Section>
            <SectionHeader icon={Music} title="Genre" />
            <div className="space-y-2">
              {genreChartData.slice(0, 4).map((item, i) => (
                <MiniProgress key={i} label={item.genre} value={item.value} color="primary" />
              ))}
            </div>
          </Section>
        )}

        {/* Sub-Genres */}
        {subGenreChartData.length > 0 && (
          <Section>
            <SectionHeader icon={Waves} title="Sub-Genre" />
            <div className="space-y-2">
              {subGenreChartData.slice(0, 3).map((item, i) => (
                <MiniProgress key={i} label={item.subGenre} value={item.value} color="secondary" />
              ))}
            </div>
          </Section>
        )}

        {/* Instruments */}
        {instrumentsChartData.length > 0 && (
          <Section>
            <SectionHeader icon={Volume2} title="Instruments" />
            <div className="space-y-2">
              {instrumentsChartData.map((item, i) => (
                <MiniProgress key={i} label={item.instrument} value={item.value} color="accent" />
              ))}
            </div>
          </Section>
        )}

        {/* Mood - Compact Radar */}
        {moodChartData.length > 0 && (
          <Section className="lg:col-span-1">
            <SectionHeader icon={Heart} title="Mood Profile" />
            <div className="h-40 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={moodChartData.slice(0, 8)} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <PolarAngleAxis 
                    dataKey="mood" 
                    tick={{ 
                      fill: 'hsl(var(--muted-foreground))', 
                      fontSize: 9,
                      fontWeight: 400
                    }}
                    tickLine={false}
                  />
                  <Radar 
                    name="Mood" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.15} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {/* Technical Details */}
        {technicalFeedback && (
          <Section>
            <SectionHeader icon={Zap} title="Technical" />
            <div className="flex flex-wrap gap-2">
              {technicalFeedback.key && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-full">
                  <span className="text-xs text-muted-foreground">Key</span>
                  <span className="text-xs font-medium">{technicalFeedback.key}</span>
                </div>
              )}
            </div>
            {technicalFeedback.effects && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(Array.isArray(technicalFeedback.effects) 
                  ? technicalFeedback.effects 
                  : typeof technicalFeedback.effects === 'string' 
                    ? technicalFeedback.effects.split(',').map((e: string) => e.trim())
                    : []
                ).slice(0, 4).map((effect: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                    {effect}
                  </Badge>
                ))}
              </div>
            )}
            {technicalFeedback.quality && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {technicalFeedback.quality}
              </p>
            )}
          </Section>
        )}

        {/* Voice Analysis */}
        {voicesData && (
          <Section>
            <SectionHeader icon={Mic} title="Vocals" />
            <div className="flex flex-wrap gap-2">
              {voicesData.predominant_gender && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-full">
                  <span className="text-xs font-medium capitalize">{voicesData.predominant_gender}</span>
                </div>
              )}
              {voicesData.confidence !== undefined && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-full">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="text-xs font-medium">{(voicesData.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              {voicesData.presence_profile && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-full">
                  <span className="text-xs font-medium">{voicesData.presence_profile} Presence</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Emotional Profile */}
        {emotionalProfile && (
          <Section>
            <SectionHeader icon={Sparkles} title="Emotional Profile" />
            <div className="flex flex-wrap gap-2">
              {emotionalProfile.profile && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {emotionalProfile.profile}
                </Badge>
              )}
              {emotionalProfile.energy_level && (
                <Badge variant="outline" className="text-xs font-normal">
                  {emotionalProfile.energy_level} Energy
                </Badge>
              )}
              {emotionalProfile.dynamics && (
                <Badge variant="outline" className="text-xs font-normal">
                  {emotionalProfile.dynamics} Dynamics
                </Badge>
              )}
              {emotionalProfile.energy_dynamics && (
                <Badge variant="outline" className="text-xs font-normal">
                  {emotionalProfile.energy_dynamics} Energy Dynamics
                </Badge>
              )}
            </div>
          </Section>
        )}

        {/* Lyric Analysis - NEW */}
        {lyricAnalysis && (
          <Section className="lg:col-span-2">
            <SectionHeader icon={FileText} title="Lyric Analysis" />
            <div className="space-y-3">
              {/* Themes & Sentiment */}
              <div className="flex flex-wrap gap-2">
                {lyricAnalysis.sentiment && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {lyricAnalysis.sentiment} Sentiment
                  </Badge>
                )}
                {lyricAnalysis.language && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {lyricAnalysis.language}
                  </Badge>
                )}
                {lyricAnalysis.themes && Array.isArray(lyricAnalysis.themes) && lyricAnalysis.themes.map((theme: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal">
                    {theme}
                  </Badge>
                ))}
              </div>
              
              {/* Transcription */}
              {lyricAnalysis.transcription && (
                <div className="relative">
                  <Quote className="absolute -left-1 -top-1 w-4 h-4 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground italic leading-relaxed pl-4 pr-2 py-1 bg-muted/20 rounded-md">
                    "{lyricAnalysis.transcription}"
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};
