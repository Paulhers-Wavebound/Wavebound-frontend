import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload,
  Music,
  Video,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Wand2,
  Disc3,
  Heart,
  ChevronRight,
} from "lucide-react";
import { SiDropbox, SiGoogledrive } from "react-icons/si";
import { pickFromDropbox, pickFromGoogleDrive } from "@/utils/cloudFilePickers";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  FavoritesSelector,
  FavoriteVideoItem,
} from "@/components/FavoritesSelector";
import { fetchEnrichedVideoData } from "@/services/favoriteDataService";
import { needsCompression, compressAudioToMp3 } from "@/utils/audioCompressor";
import AudioTrimmer from "@/components/AudioTrimmer";

type UploadType = "video" | "audio" | "favorites";

const SUPABASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY";

const UPLOAD_TYPES = [
  {
    id: "audio" as UploadType,
    title: "From Audio",
    description:
      "Upload your song to get AI-analyzed content ideas matched to your track",
    icon: Music,
    bgColor: "bg-rose-500/10",
    textColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "video" as UploadType,
    title: "From Video",
    description: "Analyze a TikTok/Reel and build a plan around it",
    icon: Video,
    bgColor: "bg-sky-500/10",
    textColor: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "favorites" as UploadType,
    title: "From Favorites",
    description: "Pick a saved video and generate a plan inspired by it",
    icon: Heart,
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
  },
];

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMountedRef = useRef(true);
  const isCreateActiveRef = useRef(true);
  const {
    startAnalysis,
    updateAnalysis,
    activeAnalysis,
    hasActiveAnalysis,
    navigateToAnalysis,
  } = useAnalysis();

  useEffect(() => {
    isCreateActiveRef.current = location.pathname.startsWith("/create");
    // Reset stale upload state when returning to /create via keep-alive
    if (location.pathname.startsWith("/create")) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setUploadProgress(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Upload state
  const [selectedType, setSelectedType] = useState<UploadType | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);

  // Upload/analysis state
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const [cloudLoading, setCloudLoading] = useState<"dropbox" | "gdrive" | null>(
    null,
  );

  // Stable blob URL for instant video preview
  const videoPreviewUrl = useMemo(() => {
    if (file && selectedType === "video") return URL.createObjectURL(file);
    return null;
  }, [file, selectedType]);
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Authenticated Edge Function calls for analysis

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (selectedType === "audio") {
      setPendingAudioFile(f);
      setShowTrimmer(true);
    } else {
      setFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (selectedType === "audio") {
      setPendingAudioFile(f);
      setShowTrimmer(true);
    } else {
      setFile(f);
    }
  };

  const handleTrimConfirm = (trimmedFile: File) => {
    setFile(trimmedFile);
    setShowTrimmer(false);
    setPendingAudioFile(null);
  };

  const handleTrimCancel = () => {
    setShowTrimmer(false);
    setPendingAudioFile(null);
  };

  const handleCreatePlan = async () => {
    if (!selectedType) return;

    if (selectedType === "favorites") return; // handled by FavoritesSelector callback

    if (!file) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to create content plans");
      navigate("/auth", { state: { from: "/create" } });
      return;
    }

    if (selectedType === "audio") {
      await handleAudioAnalysis(session);
    } else if (selectedType === "video") {
      await handleVideoAnalysis(session);
    }
  };

  const handleFavoritePlan = async (fav: FavoriteVideoItem) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to create content plans");
      navigate("/auth", { state: { from: "/create" } });
      return;
    }

    setIsFavLoading(true);
    try {
      const userId = session.user.id;
      const platform =
        fav.type === "instagram_reel" ? "instagram_reel" : "tiktok";

      // Fetch enriched data
      const enrichedData = await fetchEnrichedVideoData(
        fav.id,
        platform as "tiktok" | "instagram_reel",
      );

      // Create DB record
      const { data: record, error: insertError } = await supabase
        .from("user_uploaded_videos")
        .insert({
          user_id: userId,
          video_url: fav.embedded_ulr || fav.video_url || "",
          storage_path: `favorite_plan/${userId}/${Date.now()}_${fav.id}`,
          content_category: "favorite_plan",
          music_genre: enrichedData.sound?.genre || "pending",
          notes: JSON.stringify({
            source_video_id: fav.id,
            source_platform: platform,
            source_embed_url: fav.embedded_ulr || fav.video_url,
            source_caption: fav.caption,
          }),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create analysis record
      await supabase.from("video_analysis_results").insert({
        video_id: record.id,
        user_id: userId,
        status: "processing",
      });

      startAnalysis(record.id, "video");
      updateAnalysis({ status: "processing" });

      // Navigate immediately
      if (isCreateActiveRef.current) {
        navigate(`/analyze-favorite/${record.id}`);
      }

      // Send webhook
      const payload = {
        mode: "favorite_plan",
        user_id: userId,
        video_id: record.id,
        source_video_id: fav.id,
        source_platform: platform,
        profile: enrichedData.profile,
        video: enrichedData.video,
        sound: enrichedData.sound,
        ai_analysis: enrichedData.ai_analysis,
      };

      try {
        const {
          data: { session: latestSession },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/trigger-plan-analysis`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${latestSession?.access_token}`,
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(payload),
          },
        );
        if (res.status === 429) {
          toast.error("Weekly analysis limit reached. Upgrade for more.");
          return;
        }
        if (!res.ok) throw new Error(`Edge function error: ${res.status}`);
        toast.success("Content plan generation started!");
      } catch {
        toast.error("Could not reach analysis service.");
      }
    } catch {
      toast.error("Failed to create plan. Please try again.");
    } finally {
      setIsFavLoading(false);
    }
  };

  const handleVideoAnalysis = async (session: any) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: file.size });

    let videoRecordId: string | null = null;

    try {
      const userId = session.user.id;
      const sanitizedName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${userId}/${Date.now()}_${sanitizedName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("user_videos")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(null);

      const {
        data: { publicUrl },
      } = supabase.storage.from("user_videos").getPublicUrl(fileName);

      // Create database record - use 'video_analysis' category to differentiate
      const { data: videoRecord, error: insertError } = await supabase
        .from("user_uploaded_videos")
        .insert({
          user_id: userId,
          video_url: publicUrl,
          storage_path: fileName,
          content_category: "video_analysis",
          music_genre: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      videoRecordId = videoRecord.id;

      // Create analysis record
      await supabase.from("video_analysis_results").insert({
        video_id: videoRecord.id,
        user_id: userId,
        status: "processing",
      });

      // Register the video analysis session in context (matches audio flow)
      startAnalysis(videoRecord.id, "video");
      updateAnalysis({ status: "processing" });

      if (isMountedRef.current) {
        setIsUploading(false);
        setIsAnalyzing(true);
      }

      // Navigate immediately (fire-and-forget — workspace will trigger/poll)
      if (isCreateActiveRef.current) {
        navigate(`/analyze-video/${videoRecord.id}`);
      }

      // Send video analysis request via Edge Function

      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/trigger-video-analysis`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ video_id: videoRecord.id }),
          },
        );
        if (res.status === 429) {
          toast.error("Weekly analysis limit reached. Upgrade for more.");
          return;
        }
        if (!res.ok) throw new Error(`Edge function error: ${res.status}`);
        toast.success("Video analysis started!");
      } catch {
        toast.error(
          "Could not reach analysis service. You can retry from the workspace.",
        );
      }

      // Clean up if still on /create
      if (isCreateActiveRef.current && isMountedRef.current) {
        setIsUploading(false);
        setIsAnalyzing(false);
        setUploadProgress(null);
        setFile(null);
      }
    } catch {
      // Reset state on error
      if (isMountedRef.current) {
        setIsUploading(false);
        setIsAnalyzing(false);
        setUploadProgress(null);
      }

      if (videoRecordId) {
        toast.error(
          "Something went wrong, but you can resume from the workspace.",
        );
        startAnalysis(videoRecordId, "video");
        setFile(null);
        if (isCreateActiveRef.current) {
          navigate(`/analyze-video/${videoRecordId}`);
        }
      } else {
        toast.error("Failed to create analysis record. Please try again.");
      }
    }
  };

  const handleAudioAnalysis = async (session: any) => {
    if (!file) return;

    let uploadFile = file;

    // Auto-compress large or non-MP3 files to MP3
    if (needsCompression(file)) {
      try {
        setIsCompressing(true);
        uploadFile = await compressAudioToMp3(file);
      } catch {
        toast.error(
          "Could not compress audio. Try converting to MP3 manually.",
        );
        setIsCompressing(false);
        return;
      } finally {
        setIsCompressing(false);
      }
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: uploadFile.size });

    let audioRecordId: string | null = null;

    try {
      const userId = session.user.id;
      const sanitizedName = uploadFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${userId}/${Date.now()}_${sanitizedName}`;

      // Upload to storage (use the configured client; do not rely on env vars)
      const { error: uploadError } = await supabase.storage
        .from("user_videos")
        .upload(fileName, uploadFile, {
          contentType: uploadFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Storage upload completed (no byte-level progress available via this API)
      setUploadProgress(null);
      const {
        data: { publicUrl },
      } = supabase.storage.from("user_videos").getPublicUrl(fileName);

      // Create database record
      const { data: audioRecord, error: insertError } = await supabase
        .from("user_uploaded_videos")
        .insert({
          user_id: userId,
          video_url: publicUrl,
          storage_path: fileName,
          content_category: "audio_analysis",
          music_genre: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      audioRecordId = audioRecord.id;

      // Create analysis record
      await supabase.from("video_analysis_results").insert({
        video_id: audioRecord.id,
        user_id: userId,
        status: "processing",
      });

      // Register the analysis session ASAP (so returning to /create can resume/redirect)
      startAnalysis(audioRecord.id, "audio");
      updateAnalysis({ status: "processing" });

      if (isMountedRef.current) {
        setIsUploading(false);
        setIsAnalyzing(true);
      }

      // If the user is still on /create, immediately take them to the workspace.
      // If they navigated away mid-upload, do NOT hijack their navigation.
      if (isCreateActiveRef.current) {
        navigate(`/analyze-audio/${audioRecord.id}`);
      }

      // Send audio analysis request via Edge Function

      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/trigger-audio-analysis`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ video_id: audioRecord.id }),
          },
        );
        if (res.status === 429) {
          toast.error("Weekly analysis limit reached. Upgrade for more.");
        } else if (!res.ok) {
          toast.error(
            "Analysis request failed. You can retry from the workspace.",
          );
        } else {
          toast.success("Analysis started!");
        }
      } catch {
        toast.error(
          "Could not reach analysis service. You can retry from the workspace.",
        );
      }

      // If the user left /create while this was running, keep state as-is.
      // If they're still here, clean up so the button/UI isn't stuck.
      if (isCreateActiveRef.current && isMountedRef.current) {
        setIsUploading(false);
        setIsAnalyzing(false);
        setUploadProgress(null);
        setFile(null);
      }
    } catch {
      // Reset state on error
      if (isMountedRef.current) {
        setIsUploading(false);
        setIsAnalyzing(false);
        setUploadProgress(null);
      }

      // If we have an audioRecordId, register it for resume.
      if (audioRecordId) {
        toast.error(
          "Something went wrong, but you can resume from the workspace.",
        );
        startAnalysis(audioRecordId, "audio");
        setFile(null);

        if (isCreateActiveRef.current) {
          navigate(`/analyze-audio/${audioRecordId}`);
        }
      } else {
        toast.error("Failed to create analysis record. Please try again.");
      }
    }
  };

  const canAnalyze =
    (selectedType === "video" || selectedType === "audio") && file;

  const resumePath = navigateToAnalysis();

  // If there's an active analysis, /create should not look like a fresh start.
  // Returning here should take the user back to the active (or completed) workspace.
  useEffect(() => {
    if (!location.pathname.startsWith("/create")) return;
    if (!hasActiveAnalysis || !activeAnalysis) return;
    if (activeAnalysis.status === "error") return;
    if (!resumePath) return;

    navigate(resumePath, { replace: true });
  }, [
    activeAnalysis,
    hasActiveAnalysis,
    location.pathname,
    navigate,
    resumePath,
  ]);

  const showResumeCallout =
    location.pathname.startsWith("/create") &&
    hasActiveAnalysis &&
    !!activeAnalysis &&
    !!resumePath &&
    activeAnalysis.status !== "error";

  return (
    <AppLayout fullHeight withHeaderPadding>
      <SEOHead
        title="Create Content Plan - Wavebound"
        description="Create AI-powered content plans for your music. Get personalized strategies and video ideas."
      />

      {/* If an analysis is already running in the background, let users resume it */}
      {showResumeCallout && (
        <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg border border-border/30 bg-card px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Analysis in progress
              </p>
              <p className="text-xs text-muted-foreground truncate">
                You can keep browsing — resume anytime.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => navigate(resumePath)}
            >
              Resume
            </Button>
          </div>
        </div>
      )}

      {/* Upload progress shown inline, not as blocking overlay */}
      {isUploading && (
        <div className="fixed bottom-4 right-4 z-50 bg-card border border-border/30 rounded-lg p-4 shadow-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Uploading...</span>
        </div>
      )}

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="relative border-b border-border/10 overflow-hidden">
          {/* Aurora animated background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
              style={{
                background: "hsl(var(--primary) / 0.4)",
                animation: "aurora 15s ease infinite",
                backgroundSize: "200% 200%",
              }}
            />
            <div
              className="absolute -bottom-1/3 -left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
              style={{
                background: "hsl(var(--primary-glow) / 0.3)",
                animation: "aurora 15s ease infinite 5s",
                backgroundSize: "200% 200%",
              }}
            />
            <div
              className="absolute top-1/4 left-1/2 w-[400px] h-[300px] rounded-full opacity-15 blur-[100px]"
              style={{
                background:
                  "linear-gradient(135deg, hsl(180 60% 50% / 0.3), hsl(var(--primary) / 0.2))",
                animation: "aurora 15s ease infinite 10s",
                backgroundSize: "200% 200%",
              }}
            />
          </div>
          <div className="absolute inset-0 backdrop-blur-xl bg-background/60" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="flex items-center justify-between py-12 sm:py-16"
              style={{ animation: "fade-up-in 0.6s ease-out both" }}
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-5 backdrop-blur-sm"
                >
                  <Disc3 className="w-3.5 h-3.5" />
                  Content Plan Generator
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
                >
                  Create Content Plan
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground mt-4 text-base max-w-lg"
                >
                  Upload your content and let AI build your strategy
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto dot-grid">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            {/* Upload progress indicator */}
            {isUploading && uploadProgress && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="font-medium">Uploading your track...</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.loaded / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatBytes(uploadProgress.loaded)} /{" "}
                  {formatBytes(uploadProgress.total)}
                </p>
              </motion.div>
            )}

            {/* Section label */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">
              Choose your source
            </p>

            {/* Upload Type Cards */}
            <div className="grid md:grid-cols-3 gap-5 mb-12">
              {UPLOAD_TYPES.map((type, i) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  onClick={() => {
                    setSelectedType(type.id);
                    setFile(null);
                  }}
                  disabled={isUploading || isAnalyzing || isCompressing}
                  className={cn(
                    "group relative p-6 rounded-2xl border text-left transition-all duration-300 ease-out",
                    "bg-card/40 backdrop-blur-md border-border/10",
                    selectedType === type.id
                      ? "border-primary/25 bg-primary/[0.08] shadow-[0_0_30px_-6px_hsl(var(--primary)/0.3),0_4px_20px_-4px_hsl(var(--primary)/0.15)] ring-1 ring-primary/15"
                      : "hover:scale-[1.02] hover:border-primary/15 hover:shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.25)] hover:bg-card/60",
                    (isUploading || isAnalyzing || isCompressing) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {selectedType === type.id && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="absolute top-3.5 right-3.5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                      "bg-gradient-to-br",
                      type.bgColor,
                      "group-hover:shadow-md",
                    )}
                  >
                    <type.icon
                      className={cn(
                        "w-7 h-7 transition-transform duration-300 group-hover:animate-create-float",
                        type.textColor,
                      )}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>

                  {/* Hover chevron */}
                  <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              ))}
            </div>

            {/* Input Area */}
            <AnimatePresence mode="wait">
              {selectedType && selectedType !== "favorites" && (
                <motion.div
                  key={selectedType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card/80 backdrop-blur-sm border border-border/20 rounded-2xl p-8 mb-6 shadow-sm"
                >
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-border/40",
                      file ? "border-solid border-primary/25 bg-primary/5" : "",
                      (isUploading || isAnalyzing) &&
                        "opacity-50 pointer-events-none",
                    )}
                  >
                    {file ? (
                      <div className="space-y-3">
                        {selectedType === "video" ? (
                          <div className="max-w-xs mx-auto">
                            <video
                              src={videoPreviewUrl || undefined}
                              controls
                              className="w-full rounded-lg aspect-[9/16] object-cover bg-black"
                            />
                          </div>
                        ) : (
                          <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
                        )}
                        <p className="font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFile(null)}
                          disabled={isUploading || isAnalyzing}
                        >
                          Change file
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            Drop your{" "}
                            {selectedType === "video" ? "video" : "audio"} here
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedType === "audio"
                              ? "All formats accepted — large files are auto-compressed to MP3"
                              : "MP4, MOV, or WebM video files supported"}
                          </p>
                        </div>
                        <input
                          type="file"
                          accept={
                            selectedType === "video" ? "video/*" : "audio/*"
                          }
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                          disabled={isUploading || isAnalyzing}
                        />
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer"
                            >
                              <Upload className="w-4 h-4 mr-1.5" />
                              Select File
                            </label>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              cloudLoading !== null ||
                              isUploading ||
                              isAnalyzing
                            }
                            onClick={async () => {
                              try {
                                setCloudLoading("dropbox");
                                const ext =
                                  selectedType === "audio"
                                    ? [
                                        ".mp3",
                                        ".wav",
                                        ".aac",
                                        ".flac",
                                        ".ogg",
                                        ".m4a",
                                      ]
                                    : [".mp4", ".mov", ".webm"];
                                const f = await pickFromDropbox(ext);
                                if (f) {
                                  if (selectedType === "audio") {
                                    setPendingAudioFile(f);
                                    setShowTrimmer(true);
                                  } else {
                                    setFile(f);
                                  }
                                }
                              } catch (err: any) {
                                toast.error(
                                  err?.message ||
                                    "Could not import from Dropbox",
                                );
                              } finally {
                                setCloudLoading(null);
                              }
                            }}
                          >
                            {cloudLoading === "dropbox" ? (
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                              <SiDropbox className="w-4 h-4 mr-1.5" />
                            )}
                            Dropbox
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              cloudLoading !== null ||
                              isUploading ||
                              isAnalyzing
                            }
                            onClick={async () => {
                              try {
                                setCloudLoading("gdrive");
                                const mimes =
                                  selectedType === "audio"
                                    ? [
                                        "audio/mpeg",
                                        "audio/wav",
                                        "audio/aac",
                                        "audio/flac",
                                        "audio/ogg",
                                        "audio/mp4",
                                      ]
                                    : [
                                        "video/mp4",
                                        "video/quicktime",
                                        "video/webm",
                                      ];
                                const f = await pickFromGoogleDrive(mimes);
                                if (f) {
                                  if (selectedType === "audio") {
                                    setPendingAudioFile(f);
                                    setShowTrimmer(true);
                                  } else {
                                    setFile(f);
                                  }
                                }
                              } catch (err: any) {
                                toast.error(
                                  err?.message ||
                                    "Could not import from Google Drive",
                                );
                              } finally {
                                setCloudLoading(null);
                              }
                            }}
                          >
                            {cloudLoading === "gdrive" ? (
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                              <SiGoogledrive className="w-4 h-4 mr-1.5" />
                            )}
                            Google Drive
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {selectedType === "favorites" && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card/80 backdrop-blur-sm border border-border/20 rounded-2xl p-8 mb-6 shadow-sm"
                >
                  <FavoritesSelector
                    onSelect={handleFavoritePlan}
                    isLoading={isFavLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Create Plan Button - not shown for favorites (has its own button) */}
            {selectedType && selectedType !== "favorites" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <Button
                  size="lg"
                  onClick={handleCreatePlan}
                  disabled={
                    !canAnalyze || isUploading || isAnalyzing || isCompressing
                  }
                  className="px-8"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compressing audio...
                    </>
                  ) : isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Create Content Plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {selectedType === "audio" && (
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    AI will analyze your track's genre, mood, and style to
                    create a personalized 7-day content plan with matching video
                    ideas
                  </p>
                )}
              </motion.div>
            )}

            {/* What you get section */}
            {selectedType === "audio" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-16"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 mb-6 text-center">
                  What you'll get
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: Music,
                      color: "bg-rose-500/10 text-rose-500",
                      title: "Audio Analysis",
                      desc: "AI breaks down genre, mood, tempo, and instrumentation",
                    },
                    {
                      icon: Video,
                      color: "bg-sky-500/10 text-sky-500",
                      title: "Matched Videos",
                      desc: "Get curated video ideas that match your track's unique DNA",
                    },
                    {
                      icon: Wand2,
                      color: "bg-amber-500/10 text-amber-500",
                      title: "7-Day Strategy",
                      desc: "Complete content plan with hooks, formats, and posting schedule",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                      className="group text-center p-6 rounded-2xl border border-border/10 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border/30 hover:shadow-md transition-all duration-300"
                    >
                      <div
                        className={cn(
                          "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110",
                          item.color.split(" ")[0],
                        )}
                      >
                        <item.icon
                          className={cn("w-5 h-5", item.color.split(" ")[1])}
                        />
                      </div>
                      <h3 className="font-semibold mb-1.5 text-sm">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Audio Trimmer Modal */}
      {pendingAudioFile && selectedType === "audio" && (
        <AudioTrimmer
          file={pendingAudioFile}
          open={showTrimmer}
          onConfirm={handleTrimConfirm}
          onCancel={handleTrimCancel}
        />
      )}
    </AppLayout>
  );
}
