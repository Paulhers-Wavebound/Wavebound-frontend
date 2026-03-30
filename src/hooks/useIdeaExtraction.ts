import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedIdea, parseHiddenData, ExtractedStat, ExtractedTrend, ExtractedActionButton, ExtractedSection, ExtractedHook, ExtractedActionStep } from '@/utils/hiddenDataParser';

export interface EnrichedIdea extends ExtractedIdea {
  contentType?: 'tiktok' | 'reel' | 'photo_carousel';
  videoData?: {
    video_embedded_url?: string;
    embedded_url?: string;
    post_url?: string;
    video_url?: string;
    video_file_url?: string;
    caption?: string;
    video_views?: number;
    video_likes?: number;
    photo_views?: number;
    photo_likes?: number;
    duration?: number;
    thumbnail_url?: string;
    photo_url_1?: string;
    viral_score?: number;
    performance_multiplier?: string;
  };
  isLoading?: boolean;
}

interface RagContentMetadata {
  content_id: number;
  content_type: string;
  platform: string;
  views?: number;
  likes?: number;
  performance_multiplier?: number;
  viral_score?: number;
}

export function useIdeaExtraction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingIdeasRef = useRef<EnrichedIdea[]>([]);

  const processMessage = useCallback(async (rawMessage: string): Promise<{ cleanMessage: string; hasNewIdeas: boolean; ideas: EnrichedIdea[]; suggestedPrompts: string[]; stats: ExtractedStat[]; trends: ExtractedTrend[]; proTips: string[]; actionButtons: ExtractedActionButton[]; sections: ExtractedSection[]; hooks: ExtractedHook[]; actionSteps: ExtractedActionStep[] }> => {
    const { cleanMessage, extractedData, suggestedPrompts, stats, trends, proTips, actionButtons, sections, hooks, actionSteps } = parseHiddenData(rawMessage);
    
    console.log('[HIDDEN_DATA DEBUG] processMessage (useIdeaExtraction):', {
      rawMessageLength: rawMessage.length,
      containsTags: rawMessage.includes('<hidden_data>'),
      extractedDataCount: extractedData.length,
      sectionsCount: sections.length,
      hooksCount: hooks.length,
      actionStepsCount: actionSteps.length,
      proTipsCount: proTips.length,
    });

    if (extractedData.length === 0) {
      return { cleanMessage, hasNewIdeas: false, ideas: [], suggestedPrompts, stats, trends, proTips, actionButtons, sections, hooks, actionSteps };
    }

    setIsProcessing(true);

    // Extract all numeric IDs from AI response (these are rag_content IDs)
    // Also track platform hints from the AI response for fallback queries
    const ragIdMap = new Map<string, { idea: typeof extractedData[0], ragId: number, platformHint?: string }>();
    for (const idea of extractedData) {
      const rawId = idea.video_embed_id || idea.id;
      const ragId = parseInt(String(rawId).replace(/^(video_|reel_|pc_)/, ''));
      if (!isNaN(ragId)) {
        ragIdMap.set(idea.id, { idea, ragId, platformHint: idea.platform });
      }
    }

    const ragIds = Array.from(ragIdMap.values()).map(v => v.ragId);

    if (ragIds.length === 0) {
      setIsProcessing(false);
      return { cleanMessage, hasNewIdeas: false, ideas: [], suggestedPrompts, stats, trends, proTips, actionButtons, sections, hooks, actionSteps };
    }

    // Step 1: First try to treat the IDs as rag_content IDs (preferred)
    const { data: ragContent, error: ragError } = await supabase
      .from('rag_content')
      .select('id, metadata')
      .in('id', ragIds);

    if (ragError) {
      setIsProcessing(false);
      return { cleanMessage, hasNewIdeas: false, ideas: [], suggestedPrompts, stats, trends, proTips, actionButtons, sections, hooks, actionSteps };
    }


    // Build a map: ragId -> { content_id, platform, ... }
    // NOTE: metadata values sometimes come through as strings; normalize ids to numbers.
    const ragContentMap = new Map<number, RagContentMetadata>();
    (ragContent || []).forEach((rag) => {
      const metaRaw = rag.metadata as unknown as RagContentMetadata;
      const contentId = Number((metaRaw as any)?.content_id);
      if (Number.isFinite(contentId) && contentId > 0) {
        ragContentMap.set(rag.id, { ...metaRaw, content_id: contentId } as RagContentMetadata);
      }
    });

    // IMPORTANT FALLBACK:
    // Some agents return platform table IDs directly instead of rag_content.id.
    // Track which IDs need fallback and their platform hints
    const missingRagIds = ragIds.filter((id) => !ragContentMap.has(id));
    
    // Build platform-specific fallback ID lists using hints from AI response
    const fallbackTikTokIds: number[] = [];
    const fallbackInstagramIds: number[] = [];
    const fallbackPcIds: number[] = [];
    const fallbackUnknownIds: number[] = [];
    
    for (const [, entry] of ragIdMap) {
      if (missingRagIds.includes(entry.ragId)) {
        const hint = entry.platformHint?.toLowerCase();
        if (hint === 'instagram' || hint === 'reel' || hint === 'reels') {
          fallbackInstagramIds.push(entry.ragId);
        } else if (hint === 'tiktok') {
          fallbackTikTokIds.push(entry.ragId);
        } else if (hint === 'photo_carousel' || hint === 'pc') {
          fallbackPcIds.push(entry.ragId);
        } else {
          // No platform hint - need to check all tables
          fallbackUnknownIds.push(entry.ragId);
        }
      }
    }

    // Separate content IDs by platform (from RAG metadata)
    const tiktokIds: number[] = [];
    const instagramIds: number[] = [];
    const pcIds: number[] = [];

    for (const [, meta] of ragContentMap) {
      const contentId = Number((meta as any).content_id);
      if (!Number.isFinite(contentId) || contentId <= 0) continue;

      if (meta.content_type === 'photo_carousel') {
        pcIds.push(contentId);
      } else if (meta.platform === 'instagram') {
        instagramIds.push(contentId);
      } else {
        tiktokIds.push(contentId);
      }
    }

    // Step 2: Fetch actual video data from the respective tables
    const [
      tiktokVideos,
      reels,
      photoCarousels,
      tiktokAssets,
      reelAssets,
      pcAssets,
      reelMediaAssets,
      fallbackTikTokVideos,
      fallbackReels,
      fallbackPhotoCarousels,
      fallbackTikTokAssets,
      fallbackReelAssets,
      fallbackPcAssets,
      fallbackReelMediaAssets,
    ] = await Promise.all([
      tiktokIds.length > 0
        ? supabase
            .from('0.1. Table 2 - Video - TikTok')
            .select('id, video_embedded_url, video_url, caption, video_views, video_likes, duration, viral_score, performance_multiplier')
            .in('id', tiktokIds)
        : { data: [] },
      instagramIds.length > 0
        ? supabase
            .from('0.1. Table 2.2 - Video - Reels')
            .select('id, video_embedded_url, video_url, caption, video_views, video_likes, duration, viral_score, performance_multiplier')
            .in('id', instagramIds)
        : { data: [] },
      pcIds.length > 0
        ? supabase
            .from('0.1. Table 2.1 - PC - TikTok')
            .select('id, post_url, caption, photo_views, photo_likes, viral_score, performance_multiplier')
            .in('id', pcIds)
        : { data: [] },
      tiktokIds.length > 0
        ? supabase.from('0.1. Table 4 - Assets - TikTok').select('video_id, thumbnail_url').in('video_id', tiktokIds)
        : { data: [] },
      instagramIds.length > 0
        ? supabase.from('0.1. Table 4.2 - Assets - Reels').select('video_id, thumbnail_url').in('video_id', instagramIds)
        : { data: [] },
      pcIds.length > 0
        ? supabase.from('0.1. Table 4.1 - Assets - PC - TikTok').select('video_id, thumbnail_url').in('video_id', pcIds)
        : { data: [] },
      instagramIds.length > 0
        ? supabase.from('media_assets_instagram_reels').select('video_id, url').in('video_id', instagramIds)
        : { data: [] },

      // Fallback & cross-platform queries: always query ALL ragIds on both platforms
      // This handles both missing rag_content entries AND cross-platform mislabeling
      ragIds.length > 0
        ? supabase
            .from('0.1. Table 2 - Video - TikTok')
            .select('id, video_embedded_url, video_url, caption, video_views, video_likes, duration, viral_score, performance_multiplier')
            .in('id', ragIds)
        : { data: [] },
      ragIds.length > 0
        ? supabase
            .from('0.1. Table 2.2 - Video - Reels')
            .select('id, video_embedded_url, video_url, caption, video_views, video_likes, duration, viral_score, performance_multiplier')
            .in('id', ragIds)
        : { data: [] },
      ragIds.length > 0
        ? supabase
            .from('0.1. Table 2.1 - PC - TikTok')
            .select('id, post_url, caption, photo_views, photo_likes, viral_score, performance_multiplier')
            .in('id', ragIds)
        : { data: [] },
      ragIds.length > 0
        ? supabase.from('0.1. Table 4 - Assets - TikTok').select('video_id, thumbnail_url').in('video_id', ragIds)
        : { data: [] },
      ragIds.length > 0
        ? supabase.from('0.1. Table 4.2 - Assets - Reels').select('video_id, thumbnail_url').in('video_id', ragIds)
        : { data: [] },
      ragIds.length > 0
        ? supabase.from('0.1. Table 4.1 - Assets - PC - TikTok').select('video_id, thumbnail_url').in('video_id', ragIds)
        : { data: [] },
      ragIds.length > 0
        ? supabase.from('media_assets_instagram_reels').select('video_id, url').in('video_id', ragIds)
        : { data: [] },
    ]);

    // Create lookup maps by content_id
    const tiktokMap = new Map<number, any>();
    ((tiktokVideos.data as any[]) || []).forEach((v) => tiktokMap.set(v.id, v));

    const reelMap = new Map<number, any>();
    ((reels.data as any[]) || []).forEach((r) => reelMap.set(r.id, r));

    const pcMap = new Map<number, any>();
    ((photoCarousels.data as any[]) || []).forEach((pc) => pcMap.set(pc.id, pc));

    // Fallback maps (IDs were already the platform table IDs)
    const fallbackTikTokMap = new Map<number, any>();
    ((fallbackTikTokVideos.data as any[]) || []).forEach((v) => fallbackTikTokMap.set(v.id, v));

    const fallbackReelMap = new Map<number, any>();
    ((fallbackReels.data as any[]) || []).forEach((r) => fallbackReelMap.set(r.id, r));

    const fallbackPcMap = new Map<number, any>();
    ((fallbackPhotoCarousels.data as any[]) || []).forEach((pc) => fallbackPcMap.set(pc.id, pc));

    // Thumbnail maps
    const tiktokThumbnailMap = new Map<number, string>();
    [...(((tiktokAssets.data as any[]) || [])), ...(((fallbackTikTokAssets.data as any[]) || []))].forEach((a: any) => {
      if (a.video_id && a.thumbnail_url) tiktokThumbnailMap.set(a.video_id, a.thumbnail_url);
    });

    const reelThumbnailMap = new Map<number, string>();
    [...(((reelAssets.data as any[]) || [])), ...(((fallbackReelAssets.data as any[]) || []))].forEach((a: any) => {
      if (a.video_id && a.thumbnail_url) reelThumbnailMap.set(a.video_id, a.thumbnail_url);
    });

    const pcThumbnailMap = new Map<number, string>();
    [...(((pcAssets.data as any[]) || [])), ...(((fallbackPcAssets.data as any[]) || []))].forEach((a: any) => {
      if (a.video_id && a.thumbnail_url) pcThumbnailMap.set(a.video_id, a.thumbnail_url);
    });

    const reelVideoFileMap = new Map<number, string>();
    [...(((reelMediaAssets.data as any[]) || [])), ...(((fallbackReelMediaAssets.data as any[]) || []))].forEach((a: any) => {
      if (a.video_id && a.url) reelVideoFileMap.set(a.video_id, a.url);
    });

    // Build enriched ideas - preserve original order from extractedData
    const enrichedIdeas: EnrichedIdea[] = [];

    // Helper to build video data from a direct platform table match
    const buildFromTikTok = (idea: ExtractedIdea, id: number, data: any): EnrichedIdea => ({
      ...idea,
      videoData: {
        video_embedded_url: data.video_embedded_url || undefined,
        video_url: data.video_url || undefined,
        caption: data.caption || undefined,
        video_views: data.video_views || undefined,
        video_likes: data.video_likes || undefined,
        duration: data.duration || undefined,
        thumbnail_url: tiktokThumbnailMap.get(id) || undefined,
        viral_score: data.viral_score || undefined,
        performance_multiplier: data.performance_multiplier || undefined,
      },
      contentType: 'tiktok',
      isLoading: false,
    });

    const buildFromReel = (idea: ExtractedIdea, id: number, data: any): EnrichedIdea => ({
      ...idea,
      videoData: {
        video_embedded_url: data.video_embedded_url || undefined,
        video_url: data.video_url || undefined,
        video_file_url: data.video_url || reelVideoFileMap.get(id) || undefined,
        caption: data.caption || undefined,
        video_views: data.video_views || undefined,
        video_likes: data.video_likes || undefined,
        duration: data.duration || undefined,
        thumbnail_url: reelThumbnailMap.get(id) || undefined,
        viral_score: data.viral_score || undefined,
        performance_multiplier: data.performance_multiplier || undefined,
      },
      contentType: 'reel',
      isLoading: false,
    });

    const buildFromPc = (idea: ExtractedIdea, id: number, data: any): EnrichedIdea => ({
      ...idea,
      videoData: {
        post_url: data.post_url || undefined,
        caption: data.caption || undefined,
        photo_views: data.photo_views || undefined,
        photo_likes: data.photo_likes || undefined,
        thumbnail_url: pcThumbnailMap.get(id) || undefined,
        viral_score: data.viral_score || undefined,
        performance_multiplier: data.performance_multiplier || undefined,
      },
      contentType: 'photo_carousel',
      isLoading: false,
    });

    // Iterate in the original order from extractedData
    for (const idea of extractedData) {
      const rawId = idea.video_embed_id || idea.id;
      const ragId = parseInt(String(rawId).replace(/^(video_|reel_|pc_)/, ''));
      
      if (isNaN(ragId)) {
        enrichedIdeas.push({
          ...idea,
          videoData: idea.video_url || idea.thumbnail_url ? {
            video_url: idea.video_url || undefined,
            thumbnail_url: idea.thumbnail_url || undefined,
          } : undefined,
          contentType: idea.platform === 'tiktok' ? 'tiktok' : idea.platform === 'instagram' ? 'reel' : undefined,
          isLoading: false,
        });
        continue;
      }

      // PRIORITY 1: Direct platform table match using the AI-provided ID
      // The AI typically returns platform table IDs directly, so check these FIRST
      // before falling back to rag_content mapping (which may map to different content_ids)
      const directTikTok = fallbackTikTokMap.get(ragId);
      const directReel = fallbackReelMap.get(ragId);
      const directPc = fallbackPcMap.get(ragId);
      const platformHint = idea.platform?.toLowerCase();

      let directMatch: EnrichedIdea | null = null;

      // Use platform hint to pick the right direct match
      if (platformHint === 'instagram' || platformHint === 'reel' || platformHint === 'reels') {
        if (directReel) directMatch = buildFromReel(idea, ragId, directReel);
        else if (directTikTok) directMatch = buildFromTikTok(idea, ragId, directTikTok);
      } else if (platformHint === 'tiktok') {
        if (directTikTok) directMatch = buildFromTikTok(idea, ragId, directTikTok);
        else if (directReel) directMatch = buildFromReel(idea, ragId, directReel);
      } else if (platformHint === 'photo_carousel' || platformHint === 'pc') {
        if (directPc) directMatch = buildFromPc(idea, ragId, directPc);
      } else {
        // No hint — check all (TikTok first, then Reel, then PC)
        if (directTikTok) directMatch = buildFromTikTok(idea, ragId, directTikTok);
        else if (directReel) directMatch = buildFromReel(idea, ragId, directReel);
        else if (directPc) directMatch = buildFromPc(idea, ragId, directPc);
      }

      if (directMatch) {
        enrichedIdeas.push(directMatch);
        continue;
      }

      // PRIORITY 2: Fall back to rag_content mapping (ragId -> content_id -> platform table)
      const ragMeta = ragContentMap.get(ragId);
      
      if (!ragMeta) {
        // Preserve backend-provided video_url/thumbnail_url as fallback
        enrichedIdeas.push({
          ...idea,
          videoData: idea.video_url || idea.thumbnail_url ? {
            video_url: idea.video_url || undefined,
            video_embedded_url: idea.video_url || undefined,
            thumbnail_url: idea.thumbnail_url || undefined,
          } : undefined,
          contentType: idea.platform === 'tiktok' ? 'tiktok' : idea.platform === 'instagram' ? 'reel' : undefined,
          isLoading: false,
        });
        continue;
      }

      const contentId = ragMeta.content_id;
      let videoData: EnrichedIdea['videoData'] = undefined;
      let contentType: EnrichedIdea['contentType'] = undefined;

      // Check based on platform from RAG metadata
      if (ragMeta.content_type === 'photo_carousel') {
        const pcData = pcMap.get(contentId);
        if (pcData) {
          videoData = {
            post_url: pcData.post_url || undefined,
            caption: pcData.caption || undefined,
            photo_views: pcData.photo_views || ragMeta.views || undefined,
            photo_likes: pcData.photo_likes || ragMeta.likes || undefined,
            thumbnail_url: pcThumbnailMap.get(contentId) || undefined,
            viral_score: pcData.viral_score || ragMeta.viral_score || undefined,
            performance_multiplier: pcData.performance_multiplier || String(ragMeta.performance_multiplier) || undefined,
          };
          contentType = 'photo_carousel';
        }
      } else if (ragMeta.platform === 'instagram') {
        const reelData = reelMap.get(contentId);
        if (reelData) {
          const directVideoUrl = reelData.video_url || reelVideoFileMap.get(contentId) || undefined;
          videoData = {
            video_embedded_url: reelData.video_embedded_url || undefined,
            video_url: reelData.video_url || undefined,
            video_file_url: directVideoUrl,
            caption: reelData.caption || undefined,
            video_views: reelData.video_views || ragMeta.views || undefined,
            video_likes: reelData.video_likes || ragMeta.likes || undefined,
            duration: reelData.duration || undefined,
            thumbnail_url: reelThumbnailMap.get(contentId) || undefined,
            viral_score: reelData.viral_score || ragMeta.viral_score || undefined,
            performance_multiplier: reelData.performance_multiplier || String(ragMeta.performance_multiplier) || undefined,
          };
          contentType = 'reel';
        } else {
          // Cross-platform fallback: try TikTok table if not found in Reels
          const fallbackTikTokData = fallbackTikTokMap.get(contentId);
          if (fallbackTikTokData) {
            videoData = {
              video_embedded_url: fallbackTikTokData.video_embedded_url || undefined,
              video_url: fallbackTikTokData.video_url || undefined,
              caption: fallbackTikTokData.caption || undefined,
              video_views: fallbackTikTokData.video_views || ragMeta.views || undefined,
              video_likes: fallbackTikTokData.video_likes || ragMeta.likes || undefined,
              duration: fallbackTikTokData.duration || undefined,
              thumbnail_url: tiktokThumbnailMap.get(contentId) || undefined,
              viral_score: fallbackTikTokData.viral_score || ragMeta.viral_score || undefined,
              performance_multiplier: fallbackTikTokData.performance_multiplier || String(ragMeta.performance_multiplier) || undefined,
            };
            contentType = 'tiktok';
          }
        }
      } else {
        // TikTok (with cross-platform fallback to Reels)
        const tiktokData = tiktokMap.get(contentId);
        if (tiktokData) {
          videoData = {
            video_embedded_url: tiktokData.video_embedded_url || undefined,
            video_url: tiktokData.video_url || undefined,
            caption: tiktokData.caption || undefined,
            video_views: tiktokData.video_views || ragMeta.views || undefined,
            video_likes: tiktokData.video_likes || ragMeta.likes || undefined,
            duration: tiktokData.duration || undefined,
            thumbnail_url: tiktokThumbnailMap.get(contentId) || undefined,
            viral_score: tiktokData.viral_score || ragMeta.viral_score || undefined,
            performance_multiplier: tiktokData.performance_multiplier || String(ragMeta.performance_multiplier) || undefined,
          };
          contentType = 'tiktok';
        } else {
          // Cross-platform fallback: try Reels table if not found in TikTok
          const fallbackReelData = fallbackReelMap.get(contentId);
          if (fallbackReelData) {
            const directVideoUrl = fallbackReelData.video_url || reelVideoFileMap.get(contentId) || undefined;
            videoData = {
              video_embedded_url: fallbackReelData.video_embedded_url || undefined,
              video_url: fallbackReelData.video_url || undefined,
              video_file_url: directVideoUrl,
              caption: fallbackReelData.caption || undefined,
              video_views: fallbackReelData.video_views || ragMeta.views || undefined,
              video_likes: fallbackReelData.video_likes || ragMeta.likes || undefined,
              duration: fallbackReelData.duration || undefined,
              thumbnail_url: reelThumbnailMap.get(contentId) || undefined,
              viral_score: fallbackReelData.viral_score || ragMeta.viral_score || undefined,
              performance_multiplier: fallbackReelData.performance_multiplier || String(ragMeta.performance_multiplier) || undefined,
            };
            contentType = 'reel';
          }
        }
      }

      // If no video data found but we have RAG metadata, still provide some data
      if (!videoData && ragMeta) {
        videoData = {
          video_views: ragMeta.views,
          video_likes: ragMeta.likes,
          viral_score: ragMeta.viral_score,
          performance_multiplier: String(ragMeta.performance_multiplier),
        };
        contentType = ragMeta.platform === 'instagram' ? 'reel' : 'tiktok';
      }

      enrichedIdeas.push({
        ...idea,
        videoData,
        contentType,
        isLoading: false,
      });
    }

    setIsProcessing(false);
    return { cleanMessage, hasNewIdeas: enrichedIdeas.length > 0, ideas: enrichedIdeas, suggestedPrompts, stats, trends, proTips, actionButtons, sections, hooks, actionSteps };
  }, []);

  return {
    isProcessing,
    processMessage,
  };
}
