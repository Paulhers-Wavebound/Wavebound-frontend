import React, { useState, useCallback } from 'react';
import { Music, Upload, Link, Loader2, AudioLines, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AudioAnalysisResult {
  genre: string;
  sub_genre?: string;
  mood?: string;
  bpm?: number;
  instruments?: string;
  emotional_profile?: string;
}

export interface MatchedVideo {
  id: number;
  video_url: string;
  embedded_ulr?: string;
  video_views: number;
  video_likes: number;
  viral_score?: number;
  outliar_score: number;
  caption?: string;
  date_posted?: string;
  genre?: string;
  sub_genre?: string;
  content_style?: string;
  hook?: string;
  thumbnail_url?: string;
  is_reel?: boolean;
  matchScore: number;
  matchReason: string;
}

export interface RagMatchResult {
  topMatches: MatchedVideo[];
  semiMatchGenres: string[];
  audioAnalysis: AudioAnalysisResult;
}

interface SongUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalysisComplete: (analysis: AudioAnalysisResult, ragResult?: RagMatchResult) => void;
}

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'matching' | 'complete' | 'error';

export function SongUploadDialog({ open, onOpenChange, onAnalysisComplete }: SongUploadDialogProps) {
  const [linkValue, setLinkValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [ragResult, setRagResult] = useState<RagMatchResult | null>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setLinkValue('');
    setSelectedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setAnalysisResult(null);
    setRagResult(null);
  }, []);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  }, [onOpenChange, resetState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type;
      if (fileType === 'audio/mpeg' || fileType === 'audio/mp4' || fileType === 'audio/wav' || fileType === 'audio/x-wav') {
        setSelectedFile(file);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an MP3, MP4, or WAV audio file.',
          variant: 'destructive',
        });
      }
    }
  };

  const uploadAndAnalyze = async (file: File) => {
    setUploadState('uploading');
    setUploadProgress(0);

    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to analyze audio.',
          variant: 'destructive',
        });
        setUploadState('error');
        return;
      }

      const userId = session.user.id;
      const sanitizedName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${userId}/${Date.now()}_${sanitizedName}`;

      // Upload to Supabase Storage with progress tracking
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/user_videos/${fileName}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
        
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('apikey', supabaseAnonKey);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      const { data: { publicUrl } } = supabase.storage
        .from('user_videos')
        .getPublicUrl(fileName);

      // Create record in database
      const { data: audioRecord, error: insertError } = await supabase
        .from('user_uploaded_videos')
        .insert({
          user_id: userId,
          video_url: publicUrl,
          storage_path: fileName,
          content_category: 'discover_filter',
          music_genre: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Now analyze the audio and get matched videos
      setUploadState('analyzing');
      setUploadProgress(100);

      const SUPABASE_URL = 'https://kxvgbowrkmowuyezoeke.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      // Send JSON payload via authenticated Edge Function
      const webhookResponse = await fetch(`${SUPABASE_URL}/functions/v1/trigger-audio-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          audio_url: publicUrl,
          video_id: audioRecord.id,
          user_id: userId,
          filename: file.name,
          mode: 'discover_match',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (webhookResponse.status === 429) {
        toast({ variant: 'destructive', title: 'Weekly analysis limit reached. Upgrade for more.' });
        return;
      }
      if (!webhookResponse.ok) {
        throw new Error(`Analysis failed: ${webhookResponse.status}`);
      }

      const responseData = await webhookResponse.json();
      console.log('Audio analysis + matching response:', responseData);

      // Parse the response
      let audioAnalysis: any = null;
      let matchedVideos: MatchedVideo[] = [];
      
      if (Array.isArray(responseData) && responseData.length > 0) {
        audioAnalysis = responseData[0];
        // Check if matched videos are in the response
        matchedVideos = responseData[0].matched_videos || responseData[0].topMatches || [];
      } else if (responseData && typeof responseData === 'object') {
        audioAnalysis = responseData;
        matchedVideos = responseData.matched_videos || responseData.topMatches || [];
      }

      if (!audioAnalysis) {
        throw new Error('Invalid response format from analysis service');
      }

      // Extract the relevant attributes for filtering
      const result: AudioAnalysisResult = {
        genre: audioAnalysis.genre || '',
        sub_genre: audioAnalysis.sub_genre || '',
        mood: audioAnalysis.mood || '',
        bpm: audioAnalysis.technical_feedback 
          ? JSON.parse(audioAnalysis.technical_feedback)?.tempo_bpm 
          : audioAnalysis.bpm,
        instruments: audioAnalysis.instruments || '',
        emotional_profile: audioAnalysis.emotional_profile || '',
      };

      setAnalysisResult(result);
      
      // Set RAG result from webhook response
      if (matchedVideos.length > 0) {
        const ragData: RagMatchResult = {
          topMatches: matchedVideos,
          semiMatchGenres: [result.genre.toLowerCase(), result.sub_genre?.toLowerCase()].filter(Boolean) as string[],
          audioAnalysis: result,
        };
        setRagResult(ragData);
      }

      setUploadState('complete');

      toast({
        title: 'Analysis complete!',
        description: matchedVideos.length > 0 
          ? `Found ${matchedVideos.length} matching videos for ${result.genre}`
          : `Analyzed: ${result.genre}. Filtering content...`,
      });

    } catch (error) {
      console.error('Upload/Analysis error:', error);
      setUploadState('error');
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) return;
    await uploadAndAnalyze(selectedFile);
  };

  const handleApplyFilters = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult, ragResult || undefined);
      handleClose(false);
    }
  };

  const handleLinkSubmit = async () => {
    // TODO: Handle TikTok sound link - would need to fetch the audio from TikTok
    toast({
      title: 'Coming soon',
      description: 'TikTok sound link analysis is coming soon. Please upload an audio file for now.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Upload Song
          </DialogTitle>
          <DialogDescription>
            Upload your track to find matching viral content
          </DialogDescription>
        </DialogHeader>

        {uploadState === 'idle' && (
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-2">
                <Link className="w-4 h-4" />
                Paste Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp4,audio/wav,audio/x-wav"
                  onChange={handleFileChange}
                  className="hidden"
                  id="song-upload"
                />
                <label
                  htmlFor="song-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : 'Click to select an audio file (MP3, WAV)'}
                  </span>
                </label>
              </div>
              <Button
                onClick={handleFileSubmit}
                disabled={!selectedFile}
                className="w-full"
              >
                Analyze & Find Matching Content
              </Button>
            </TabsContent>

            <TabsContent value="link" className="space-y-4 mt-4">
              <Input
                placeholder="https://www.tiktok.com/music/..."
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={handleLinkSubmit}
                disabled={!linkValue.trim()}
                className="w-full"
              >
                Analyze Sound
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {(uploadState === 'uploading' || uploadState === 'analyzing' || uploadState === 'matching') && (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              {uploadState === 'uploading' ? (
                <>
                  <Upload className="w-12 h-12 text-primary animate-pulse" />
                  <p className="text-sm font-medium">Uploading your track...</p>
                </>
              ) : uploadState === 'analyzing' ? (
                <>
                  <AudioLines className="w-12 h-12 text-primary animate-pulse" />
                  <p className="text-sm font-medium">Analyzing audio DNA...</p>
                </>
              ) : (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-sm font-medium">Finding matching videos with AI...</p>
                </>
              )}
            </div>
            <Progress 
              value={uploadState === 'uploading' ? uploadProgress : uploadState === 'analyzing' ? 66 : 90} 
              className="w-full" 
            />
            <p className="text-xs text-muted-foreground text-center">
              {uploadState === 'uploading' 
                ? `${uploadProgress}% uploaded` 
                : uploadState === 'analyzing'
                  ? 'Detecting genre, mood, tempo...'
                  : 'Matching your song to viral content...'}
            </p>
          </div>
        )}

        {uploadState === 'complete' && analysisResult && (
          <div className="py-6 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-primary" />
              <p className="text-sm font-medium">Analysis Complete!</p>
              {ragResult && ragResult.topMatches.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Found {ragResult.topMatches.length} matching videos
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Genre</span>
                <span className="font-medium">{analysisResult.genre || 'Unknown'}</span>
              </div>
              {analysisResult.sub_genre && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sub-genre</span>
                  <span className="font-medium">{analysisResult.sub_genre}</span>
                </div>
              )}
              {analysisResult.mood && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mood</span>
                  <span className="font-medium">{analysisResult.mood}</span>
                </div>
              )}
              {analysisResult.bpm && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BPM</span>
                  <span className="font-medium">{analysisResult.bpm}</span>
                </div>
              )}
            </div>

            <Button onClick={handleApplyFilters} className="w-full">
              Show {ragResult?.topMatches?.length || 0} Matching Videos
            </Button>
          </div>
        )}

        {uploadState === 'error' && (
          <div className="py-6 space-y-4">
            <p className="text-center text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
            <Button onClick={resetState} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
