/**
 * Parses AI messages for hidden data blocks wrapped in <hidden_data> tags
 * Returns the cleaned message and extracted data
 * Includes fallback parsing for truncated/incomplete JSON responses
 */

export interface ExtractedIdea {
  id: string;
  video_embed_id?: string;
  platform?: 'tiktok' | 'instagram' | string;
  title: string;
  why_it_works: string;
  performance_score?: number | string;
  action?: string;
  thumbnail?: string;
  video_url?: string;
  thumbnail_url?: string;
  handle?: string;
}

export interface ExtractedStat {
  label: string;
  value: string;
  detail?: string;
}

export interface ExtractedTrend {
  label: string;
  percentage: number;
}

export interface ExtractedActionButton {
  label: string;
  action: string;
}

export interface ExtractedSection {
  title: string;
  emoji?: string;
  subtitle?: string;
  body: string;
  tags?: string[];
  metric?: { label: string; value: string };
  type?: 'sound' | 'hook' | 'tip' | 'creator' | 'general';
}

export interface ExtractedHook {
  text: string;
  based_on?: string;
  category?: string;
}

export interface ExtractedActionStep {
  step: string;
  timing?: string;
  platform?: string;
}

export interface ParseResult {
  cleanMessage: string;
  extractedData: ExtractedIdea[];
  suggestedPrompts: string[];
  stats: ExtractedStat[];
  trends: ExtractedTrend[];
  proTips: string[];
  actionButtons: ExtractedActionButton[];
  sections: ExtractedSection[];
  hooks: ExtractedHook[];
  actionSteps: ExtractedActionStep[];
}

/**
 * Fallback parser that extracts individual video objects from truncated JSON
 * Uses regex to find complete video object patterns
 */
function extractVideosFromTruncatedJson(jsonContent: string): ExtractedIdea[] {
  const videos: ExtractedIdea[] = [];
  const seenIds = new Set<string>();
  
  // Regex to match individual video objects - looks for complete objects with id field
  const videoObjectRegex = /\{\s*"id"\s*:\s*"(\d+)"[^{}]*?"title"\s*:\s*"([^"]*)"[^{}]*?"why_it_works"\s*:\s*"([^"]*)"[^{}]*?"performance_score"\s*:\s*"([^"]*)"[^{}]*?"action"\s*:\s*"([^"]*)"\s*\}/g;
  
  let match;
  while ((match = videoObjectRegex.exec(jsonContent)) !== null) {
    const id = match[1];
    if (!seenIds.has(id)) {
      seenIds.add(id);
      videos.push({
        id,
        video_embed_id: id,
        title: match[2],
        why_it_works: match[3],
        performance_score: match[4],
        action: match[5],
      });
    }
  }
  
  // If the above didn't work, try a more lenient pattern
  if (videos.length === 0) {
    const lenientRegex = /\{\s*"id"\s*:\s*"(\d+)"\s*,\s*"video_embed_id"\s*:\s*"(\d+)"\s*,\s*"title"\s*:\s*"([^"]*)"/g;
    while ((match = lenientRegex.exec(jsonContent)) !== null) {
      const id = match[1];
      if (!seenIds.has(id)) {
        seenIds.add(id);
        videos.push({
          id,
          video_embed_id: match[2],
          title: match[3],
          why_it_works: '',
          performance_score: '',
          action: '',
        });
      }
    }
  }
  
  return videos;
}

export function parseHiddenData(rawMessage: string): ParseResult {
  console.log('[HIDDEN_DATA DEBUG] parseHiddenData called:', {
    messageLength: rawMessage.length,
    containsHiddenDataTag: rawMessage.includes('<hidden_data>'),
    containsClosingTag: rawMessage.includes('</hidden_data>'),
    tagIndex: rawMessage.indexOf('<hidden_data>'),
  });

  // Handle both complete and incomplete (truncated) hidden_data blocks
  const completeBlockRegex = /<hidden_data>\s*([\s\S]*?)\s*<\/hidden_data>/gi;
  const truncatedBlockRegex = /<hidden_data>\s*([\s\S]*)$/i;
  
  const extractedData: ExtractedIdea[] = [];
  const suggestedPrompts: string[] = [];
  const stats: ExtractedStat[] = [];
  const trends: ExtractedTrend[] = [];
  const proTips: string[] = [];
  const actionButtons: ExtractedActionButton[] = [];
  const sections: ExtractedSection[] = [];
  const hooks: ExtractedHook[] = [];
  const actionSteps: ExtractedActionStep[] = [];
  const seenIds = new Set<string>();
  
  // First try complete blocks
  let foundComplete = false;
  let match;
  while ((match = completeBlockRegex.exec(rawMessage)) !== null) {
    foundComplete = true;
    console.log('[HIDDEN_DATA DEBUG] Found complete block, JSON length:', match[1].trim().length, 'preview:', match[1].trim().slice(0, 150));
    processJsonContent(match[1].trim(), extractedData, suggestedPrompts, seenIds, stats, trends, proTips, actionButtons, sections, hooks, actionSteps);
  }
  
  // If no complete blocks found, try truncated block
  if (!foundComplete && rawMessage.includes('<hidden_data>')) {
    const truncatedMatch = truncatedBlockRegex.exec(rawMessage);
    if (truncatedMatch) {
      console.log('[HIDDEN_DATA DEBUG] Found truncated block, JSON length:', truncatedMatch[1].trim().length);
      processJsonContent(truncatedMatch[1].trim(), extractedData, suggestedPrompts, seenIds, stats, trends, proTips, actionButtons, sections, hooks, actionSteps);
    }
  }
  
  // Remove all hidden_data blocks (both complete and truncated) from the visible message
  let cleanMessage = rawMessage
    .replace(completeBlockRegex, '')
    .replace(/<hidden_data>[\s\S]*$/i, '') // Remove truncated blocks too
    .trim();
  
  console.log('[HIDDEN_DATA DEBUG] parseHiddenData result:', {
    cleanMessageLength: cleanMessage.length,
    extractedDataCount: extractedData.length,
    sectionsCount: sections.length,
    hooksCount: hooks.length,
    actionStepsCount: actionSteps.length,
    suggestedPromptsCount: suggestedPrompts.length,
    statsCount: stats.length,
    trendsCount: trends.length,
    proTipsCount: proTips.length,
  });

  return { cleanMessage, extractedData, suggestedPrompts, stats, trends, proTips, actionButtons, sections, hooks, actionSteps };
}

function processJsonContent(
  jsonContent: string,
  extractedData: ExtractedIdea[],
  suggestedPrompts: string[],
  seenIds: Set<string>,
  stats: ExtractedStat[],
  trends: ExtractedTrend[],
  proTips: string[],
  actionButtons: ExtractedActionButton[],
  sections: ExtractedSection[],
  hooks: ExtractedHook[],
  actionSteps: ExtractedActionStep[]
): void {
  try {
    const parsed = JSON.parse(jsonContent);
    console.log('[HIDDEN_DATA DEBUG] processJsonContent parsed successfully:', {
      isArray: Array.isArray(parsed),
      type: typeof parsed,
      keys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : 'N/A',
      hasSections: !!(parsed?.sections),
      hasHooks: !!(parsed?.hooks),
      hasActionSteps: !!(parsed?.action_steps),
      hasVideos: !!(parsed?.videos),
      hasSuggestedPrompts: !!(parsed?.suggested_prompts),
      hasProTips: !!(parsed?.pro_tips),
    });
    processParseResult(parsed, extractedData, suggestedPrompts, seenIds, stats, trends, proTips, actionButtons, sections, hooks, actionSteps);
  } catch (e) {
    console.warn('[HIDDEN_DATA DEBUG] JSON.parse failed, trying fallback:', e);
    // Try to repair/parse truncated JSON
    const fallbackVideos = extractVideosFromTruncatedJson(jsonContent);
    for (const video of fallbackVideos) {
      const itemId = String(video.id || video.video_embed_id || '');
      if (itemId && !seenIds.has(itemId)) {
        seenIds.add(itemId);
        extractedData.push(video);
      }
    }
    
    // Also try to extract suggested_prompts if present
    const promptsMatch = jsonContent.match(/"suggested_prompts"\s*:\s*\[([\s\S]*?)\]/);
    if (promptsMatch) {
      const promptsStr = promptsMatch[1];
      const individualPrompts = promptsStr.match(/"([^"]+)"/g);
      if (individualPrompts) {
        for (const p of individualPrompts) {
          const cleaned = p.replace(/"/g, '').trim();
          if (cleaned && !suggestedPrompts.includes(cleaned)) {
            suggestedPrompts.push(cleaned);
          }
        }
      }
    }
  }
}

function processParseResult(
  parsed: any,
  extractedData: ExtractedIdea[],
  suggestedPrompts: string[],
  seenIds: Set<string>,
  stats: ExtractedStat[],
  trends: ExtractedTrend[],
  proTips: string[],
  actionButtons: ExtractedActionButton[],
  sections: ExtractedSection[],
  hooks: ExtractedHook[],
  actionSteps: ExtractedActionStep[]
): void {
  let items: any[] = [];
  
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && typeof parsed === 'object') {
    // Extract suggested_prompts first
    if (parsed.suggested_prompts && Array.isArray(parsed.suggested_prompts)) {
      for (const prompt of parsed.suggested_prompts) {
        if (typeof prompt === 'string' && prompt.trim() && !suggestedPrompts.includes(prompt.trim())) {
          suggestedPrompts.push(prompt.trim());
        }
      }
    }
    
    // Extract stats
    if (parsed.stats && Array.isArray(parsed.stats)) {
      for (const s of parsed.stats) {
        if (s && s.label && s.value) {
          stats.push({ label: s.label, value: s.value, detail: s.detail });
        }
      }
    }
    
    // Extract trends
    if (parsed.trends && Array.isArray(parsed.trends)) {
      for (const t of parsed.trends) {
        if (t && t.label && typeof t.percentage === 'number') {
          trends.push({ label: t.label, percentage: t.percentage });
        }
      }
    }
    
    // Extract pro_tips
    if (parsed.pro_tips && Array.isArray(parsed.pro_tips)) {
      for (const tip of parsed.pro_tips) {
        if (typeof tip === 'string' && tip.trim()) {
          proTips.push(tip.trim());
        }
      }
    }
    
    // Extract action_buttons
    if (parsed.action_buttons && Array.isArray(parsed.action_buttons)) {
      for (const btn of parsed.action_buttons) {
        if (btn && btn.label && btn.action) {
          actionButtons.push({ label: btn.label, action: btn.action });
        }
      }
    }

    // Extract sections
    if (parsed.sections && Array.isArray(parsed.sections)) {
      for (const s of parsed.sections) {
        if (s && s.title && s.body) {
          sections.push({
            title: s.title,
            emoji: s.emoji,
            subtitle: s.subtitle,
            body: s.body,
            tags: Array.isArray(s.tags) ? s.tags : undefined,
            metric: s.metric && s.metric.label && s.metric.value ? s.metric : undefined,
            type: s.type,
          });
        }
      }
    }

    // Extract hooks
    if (parsed.hooks && Array.isArray(parsed.hooks)) {
      for (const h of parsed.hooks) {
        if (h && h.text) {
          hooks.push({
            text: h.text,
            based_on: h.based_on,
            category: h.category,
          });
        }
      }
    }

    // Extract action_steps
    if (parsed.action_steps && Array.isArray(parsed.action_steps)) {
      for (const a of parsed.action_steps) {
        if (a && a.step) {
          actionSteps.push({
            step: a.step,
            timing: a.timing,
            platform: a.platform,
          });
        }
      }
    }
    
    // Extract items from various possible keys
    if (parsed.videos && Array.isArray(parsed.videos)) {
      items = parsed.videos;
    } else if (parsed.ideas && Array.isArray(parsed.ideas)) {
      items = parsed.ideas;
    } else if (parsed.id || parsed.video_embed_id) {
      items = [parsed];
    }
  }
  
  // Process all items
  for (const item of items) {
    const itemId = String(item.id || item.video_embed_id || '');
    if (itemId && !seenIds.has(itemId)) {
      seenIds.add(itemId);
      extractedData.push(item);
    } else if (!itemId) {
      extractedData.push(item);
    }
  }
}
