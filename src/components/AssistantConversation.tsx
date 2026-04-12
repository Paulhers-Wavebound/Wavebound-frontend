import { useState, useRef, useEffect, useCallback, useMemo, createRef } from 'react';
import VideoCardStrip from './chat/VideoCardStrip';
import { extractTikTokVideos } from '@/utils/extractTikTokVideos';
import InlineTikTokPill from './chat/InlineTikTokPill';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { useAISidebar } from '@/contexts/AISidebarContext';
import { motion, AnimatePresence } from 'framer-motion';
import BlobLoader from './chat/BlobLoader';
import { matchGenreConfig } from '@/config/genreWelcomeConfig';
import { getUserPreferences } from '@/components/discover/DiscoverOnboardingModal';
import { useDiscover } from '@/contexts/DiscoverContext';
import {
  Send,
  Square,
  Video,
  Music,
  Link2,
  User,
  Camera,
  ExternalLink,
  X,
  RotateCcw,
  Copy,
  Heart,
  Users,
  Bookmark,
  CalendarPlus,
  Check,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { useFavorites } from '@/hooks/useFavorites';
import InstagramEmbed from './InstagramEmbed';
import TikTokEmbed from './TikTokEmbed';
import { AssistantWelcomeScreen } from './AssistantWelcomeScreen';
import { ShareButton } from './ShareButton';
import waveboundLogo from '@/assets/wavebound-logo.png';
import { toast } from 'sonner';
import { useContentPlan } from '@/contexts/ContentPlanContext';
import { Video as VideoType } from '@/types/content';

// Wavebound logo component for consistent sizing
const WaveboundIcon = ({ className }: { className?: string }) => (
  <img src={waveboundLogo} alt="Wavebound" className={cn("object-contain", className)} />
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedPrompts?: string[];
  timestamp: Date;
  isNew?: boolean;
}

interface ChatMessageFromDB {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface AssistantConversationProps {
  onMessage?: (
    message: string,
    history: { role: string; content: string }[],
    streamingCallbacks?: { onDelta?: (text: string) => void; onStatus?: (tool: string, status: string) => void },
    signal?: AbortSignal,
  ) => Promise<string>;
  className?: string;
  sessionId?: string | null;
  initialMessages?: ChatMessageFromDB[];
  /** Hide the header when used inside a container that already has one */
  hideHeader?: boolean;
  /** When true, keeps the loading animation visible even if initialMessages is empty */
  isHistoryLoading?: boolean;
}

const loadingMessages = [
  "Analyzing viral patterns...",
  "Scanning top performers...",
  "Finding winning strategies...",
  "Building your insights...",
];

// Detect message type icon
function getMessageIcon(content: string) {
  const lower = content.toLowerCase();
  if (lower.includes('video') || lower.includes('tiktok') || lower.includes('reel')) return Video;
  if (lower.includes('music') || lower.includes('track') || lower.includes('song') || lower.includes('audio')) return Music;
  if (lower.includes('profile') || lower.includes('analyze my')) return User;
  if (lower.includes('concert') || lower.includes('show') || lower.includes('event') || lower.includes('timeline')) return Link2;
  if (lower.includes('film') || lower.includes('camera') || lower.includes('shoot') || lower.includes('minute')) return Camera;
  return Video;
}

// Format views
function formatViews(views: number | undefined): string {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
  return views.toString();
}

// Clean orphan markdown markers that aren't properly closed
function cleanOrphanMarkdown(text: string): string {
  let cleaned = text;
  
  // Only remove truly orphaned ** markers (odd count means one is unpaired)
  const matches = cleaned.match(/\*\*/g);
  if (matches && matches.length % 2 !== 0) {
    const lastIndex = cleaned.lastIndexOf('**');
    if (lastIndex !== -1) {
      cleaned = cleaned.slice(0, lastIndex) + cleaned.slice(lastIndex + 2);
    }
  }
  
  return cleaned.trim();
}

// Find video by ID - checks both actual IDs and 1-based index
function findVideoByReference(videoId: string, videos?: EnrichedIdea[]): EnrichedIdea | undefined {
  if (!videos || videos.length === 0) return undefined;
  
  // First try exact match on id or video_embed_id
  const exactMatch = videos.find(v => 
    String(v.id) === videoId || 
    String(v.video_embed_id) === videoId
  );
  if (exactMatch) return exactMatch;
  
  // If the ID is a small number (1-20), treat it as 1-based index
  const numId = parseInt(videoId, 10);
  if (!isNaN(numId) && numId >= 1 && numId <= 20 && numId <= videos.length) {
    return videos[numId - 1]; // Convert to 0-based index
  }
  
  return undefined;
}

// Process inline markdown (bold, italic, links — TikTok links render as inline pills)
function processInlineMarkdown(text: string): React.ReactNode[] {
  const cleanedText = cleanOrphanMarkdown(text);
  const parts: React.ReactNode[] = [];
  let remaining = cleanedText;
  let partIndex = 0;
  
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    
    // Find earliest match
    const candidates = [
      boldMatch ? { type: 'bold' as const, index: boldMatch.index!, match: boldMatch } : null,
      italicMatch ? { type: 'italic' as const, index: italicMatch.index!, match: italicMatch } : null,
      linkMatch ? { type: 'link' as const, index: linkMatch.index!, match: linkMatch } : null,
    ].filter(Boolean).sort((a, b) => a!.index - b!.index);

    const first = candidates[0];
    if (!first) {
      parts.push(<span key={`t-${partIndex++}`}>{remaining}</span>);
      break;
    }

    if (first.index > 0) {
      let before = remaining.slice(0, first.index);
      // Strip trailing open-paren before TikTok pill links like ([Watch on TikTok](url))
      if (first.type === 'link' && first.match[2].includes('tiktok.com')) {
        before = before.replace(/\(\s*$/, '');
      }
      if (before) parts.push(<span key={`t-${partIndex++}`}>{before}</span>);
    }

    if (first.type === 'bold') {
      parts.push(<strong key={`b-${partIndex++}`} className="font-semibold text-foreground">{first.match[1]}</strong>);
    } else if (first.type === 'italic') {
      parts.push(<em key={`i-${partIndex++}`} className="italic text-muted-foreground">{first.match[1]}</em>);
    } else if (first.match[2].includes('tiktok.com')) {
      // Render TikTok links as inline watch pills
      parts.push(<InlineTikTokPill key={`tt-${partIndex++}`} url={first.match[2]} />);
      // Strip leading close-paren after the link
      const after = remaining.slice(first.index + first.match[0].length);
      remaining = after.replace(/^\s*\)/, '');
      continue;
    } else {
      parts.push(
        <a key={`a-${partIndex++}`} href={first.match[2]} target="_blank" rel="noopener noreferrer"
           className="text-primary underline underline-offset-2 hover:text-primary/80">{first.match[1]}</a>
      );
    }
    remaining = remaining.slice(first.index + first.match[0].length);
  }
  return parts;
}

// Pre-process dense prose responses (e.g. Cached_Trend) into bullet-formatted text
function preprocessDenseResponse(text: string): string {
  // Only process if it's dense prose: long text with very few newlines
  const newlineCount = (text.match(/\n/g) || []).length;
  if (text.length < 300 || newlineCount >= 3) return text;

  // Split on genre/topic transition patterns (lookahead so delimiter stays with its segment)
  const splitPattern = /(?=(?:For\s+(?:original|new|emerging)\s+\w+|In\s+(?:country|hip\s*hop|R&B|pop|EDM|rock|latin|jazz|folk|indie|electronic|alternative|metal|punk|soul|funk|reggae|gospel|blues|classical|dance|trap|drill|afrobeats|amapiano|K-pop|J-pop)\b|The\s+(?:emerging|single\s+hottest|biggest|key|most\s+important|top)|Overall|Meanwhile|Additionally|On\s+the\s+(?:other|flip)\s+side|Looking\s+at|When\s+it\s+comes\s+to|What(?:'s|\s+is)\s+(?:interesting|notable|worth)))/i;

  const segments = text.split(splitPattern).map(s => s.trim()).filter(Boolean);

  // If splitting didn't produce multiple segments, try sentence-level splitting for long prose
  if (segments.length < 2) {
    // Split on sentence boundaries followed by a capital letter (new topic)
    const sentenceSegments = text
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (sentenceSegments.length >= 3) {
      return sentenceSegments.map(s => `- ${s}`).join('\n');
    }
    return text;
  }

  return segments.map(s => `- ${s}`).join('\n');
}

// Simple markdown renderer — headers, bold, lists, paragraphs
function parseTextContent(text: string): React.ReactNode[] {
  const preprocessed = preprocessDenseResponse(text);
  const lines = preprocessed.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line.trim()) {
      elements.push(<div key={`br-${i}`} className="h-3" />);
      return;
    }

    // Horizontal rules
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={i} className="my-4 border-border/30" />);
      return;
    }

    // H1
    const h1Match = line.match(/^#\s+(.+)/);
    if (h1Match) {
      elements.push(<h1 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{processInlineMarkdown(h1Match[1])}</h1>);
      return;
    }

    // H2
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      elements.push(<h2 key={i} className="text-base font-bold text-foreground mt-4 mb-1.5">{processInlineMarkdown(h2Match[1])}</h2>);
      return;
    }

    // H3
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      elements.push(<h3 key={i} className="text-[15px] font-semibold text-foreground mt-3 mb-1">{processInlineMarkdown(h3Match[1])}</h3>);
      return;
    }

    // Bullet points
    const bulletMatch = line.match(/^[\*\-•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 my-1">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span className="text-[15px] text-foreground leading-relaxed break-words [overflow-wrap:anywhere]">{processInlineMarkdown(bulletMatch[1])}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 my-1">
          <span className="text-muted-foreground font-medium text-[15px] w-5 flex-shrink-0">{numberedMatch[1]}.</span>
          <span className="text-[15px] text-foreground leading-relaxed break-words [overflow-wrap:anywhere]">{processInlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    // Bold standalone line
    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={i} className="font-semibold text-foreground mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>);
      return;
    }

    // Regular text
    elements.push(
      <p key={i} className="text-[15px] text-foreground leading-relaxed my-0.5 break-words [overflow-wrap:anywhere]">
        {processInlineMarkdown(line)}
      </p>
    );
  });

  return elements;
}

// (Rich card components removed — clean markdown only)

// Bookmark button for assistant messages
function BubbleBookmarkButton({ messageId, isPinned, onToggle }: { messageId: string; isPinned: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(messageId);
      }}
      className={cn(
        "absolute top-2 right-10 transition-opacity p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10",
        isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}
      aria-label={isPinned ? "Unpin message" : "Pin message"}
    >
      <Bookmark className={cn("w-4 h-4", isPinned ? "fill-primary text-primary" : "text-[#999] hover:text-[#666]")} />
    </button>
  );
}

// Hover copy button for assistant messages
function BubbleCopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanContent = content.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim();
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={copied || undefined}>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[#999] hover:text-[#666]" />
            )}
          </button>
        </TooltipTrigger>
        {copied && (
          <TooltipContent side="left" className="text-xs">
            Copied!
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/** Small wrapper that renders parsed markdown with inline TikTok pills */
function AssistantContentWithPills({ content }: { content: string }) {
  const cleaned = content.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim();
  return (
    <div className="space-y-1 break-words [overflow-wrap:anywhere]">
      {parseTextContent(cleaned)}
    </div>
  );
}

export function AssistantConversation({ onMessage, className, sessionId, initialMessages, hideHeader = false, isHistoryLoading = false }: AssistantConversationProps) {
  const scrollAreaContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [currentSuggestedPrompts, setCurrentSuggestedPrompts] = useState<string[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const streamingTextRef = useRef('');


  // --- Pinned messages ---
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('wavebound_pinned_messages');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const togglePin = useCallback((messageId: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      localStorage.setItem('wavebound_pinned_messages', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Persistent loading state from context (survives sidebar close/open)
  const { isWaitingForResponse, setWaitingForResponse, isFocusMode } = useAISidebar();

  // --- Slash commands ---
  const { activeGenreFilters } = useDiscover();
  const slashPrefs = useMemo(() => getUserPreferences(), []);
  const slashGenres = activeGenreFilters.length > 0 ? activeGenreFilters : (slashPrefs?.genres ?? []);
  const slashGenreLabel = useMemo(() => matchGenreConfig(slashGenres).genreLabel, [slashGenres]);

  const SLASH_COMMANDS = useMemo(() => [
    { command: '/trends', emoji: '🔥', label: 'Trending Sounds', template: 'What sounds are trending in {genre} right now?' },
    { command: '/hooks', emoji: '🪝', label: 'Hook Ideas', template: 'Give me 10 hook ideas based on what\'s performing' },
    { command: '/plan', emoji: '📅', label: 'Content Plan', template: 'Create a 7-day content plan for a {genre} artist' },
    { command: '/analyze', emoji: '🔬', label: 'Deep Analysis', template: 'Do a deep analysis of what\'s working in {genre}' },
    { command: '/creators', emoji: '👀', label: 'Top Creators', template: 'Who are the top creators to watch in {genre}?' },
  ], []);

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const filteredSlashCommands = useMemo(() => {
    if (!slashFilter) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter(c => c.command.startsWith(slashFilter));
  }, [slashFilter, SLASH_COMMANDS]);

  // Reset selected index when filter changes
  useEffect(() => {
    setSlashSelectedIndex(0);
  }, [filteredSlashCommands.length]);

  const handleSubmitRef = useRef<(text?: string) => void>();
  const handleSlashSelect = useCallback((cmd: typeof SLASH_COMMANDS[number]) => {
    const resolved = cmd.template.replace(/\{genre\}/g, slashGenreLabel || 'music');
    setInput('');
    setShowSlashMenu(false);
    setSlashFilter('');
    setTimeout(() => handleSubmitRef.current?.(resolved), 0);
  }, [slashGenreLabel]);

  // Click outside to dismiss slash menu
  useEffect(() => {
    if (!showSlashMenu) return;
    const handler = (e: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
        setSlashFilter('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSlashMenu]);
  
  // Favorites hook for adding to favorites
  const { toggleFavorite, isFavorited } = useFavorites();
  
  // Content plan hook for adding videos to plan
  const { hasPlan, openDaySelector } = useContentPlan();
  const [preview, setPreview] = useState<
    | null
    | {
        platform: 'tiktok' | 'instagram';
        id: string;
        url?: string;
        title?: string;
        videoFileUrl?: string;
        // Extended metadata for stats display
        views?: number;
        likes?: number;
        followers?: number;
        viralScore?: number;
        genre?: string;
        contentStyle?: string;
        caption?: string;
        // The full EnrichedIdea for favorites
        videoData?: EnrichedIdea;
      }
  >(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousSessionIdRef = useRef<string | null | undefined>(sessionId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false); // Prevent useEffect re-enrichment during active send

  const openPreview = useCallback((video: EnrichedIdea) => {
    const vd: any = video.videoData || {};
    const embedId = video.video_embed_id || video.id;

    console.log('[openPreview] Video data:', {
      id: video.id,
      video_embed_id: video.video_embed_id,
      contentType: video.contentType,
      videoData: vd,
    });

    // Prefer canonical platform URLs if present (these are what our Explore embeds expect)
    const candidateUrl: string | undefined =
      vd.video_embedded_url ||
      vd.embedded_url ||
      vd.embedded_ulr ||
      vd.video_url ||
      vd.post_url ||
      vd.content_url ||
      vd.video_file_url;

    console.log('[openPreview] candidateUrl:', candidateUrl);

    // Extract stats from videoData
    const views = vd.video_views || vd.photo_views || 0;
    const likes = vd.video_likes || vd.photo_likes || 0;
    const followers = vd.profile_followers || 0;
    const viralScore = vd.viral_score || vd.outliar_score || 0;
    const genre = vd.genre || '';
    const contentStyle = vd.content_style || '';
    const caption = vd.caption || '';

    const isInstagram =
      video.contentType === 'reel' ||
      (typeof candidateUrl === 'string' && candidateUrl.includes('instagram.com'));

    if (isInstagram) {
      const postId =
        vd.post_id ||
        (typeof candidateUrl === 'string'
          ? candidateUrl.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/)?.[1]
          : undefined);

      const canonicalUrl = postId ? `https://www.instagram.com/reel/${postId}/` : candidateUrl;
      
      // Don't pass videoFileUrl for Reels — direct video URLs are unreliable.
      // Force iframe embed (same fix as Discover page).
      const videoFileUrl = undefined;

      console.log('[openPreview] Instagram preview:', { postId, canonicalUrl, videoFileUrl });

      setPreview({
        platform: 'instagram',
        id: String(postId || embedId),
        url: canonicalUrl,
        title: video.title,
        videoFileUrl,
        views,
        likes,
        followers,
        viralScore,
        genre,
        contentStyle,
        caption,
        videoData: video,
      });
      return;
    }

    // TikTok: we strongly prefer a real TikTok post id (18-19 digits), not the DB row id.
    const tiktokUrl =
      typeof candidateUrl === 'string' && candidateUrl.includes('tiktok.com') ? candidateUrl : undefined;

    // Extract TikTok post id from URL  
    const idFromUrl =
      typeof tiktokUrl === 'string' ? tiktokUrl.match(/\/(?:video|photo)\/(\d+)/)?.[1] : undefined;

    console.log('[openPreview] TikTok preview:', { tiktokUrl, idFromUrl });

    setPreview({
      platform: 'tiktok',
      id: String(idFromUrl || embedId),
      url: tiktokUrl,
      title: video.title,
      views,
      likes,
      followers,
      viralScore,
      genre,
      contentStyle,
      caption,
      videoData: video,
    });
  }, []);

  // (processMessage removed — using simple text rendering now)

  // Track the last loaded session to detect actual session switches
  const lastLoadedSessionRef = useRef<string | null>(null);

  // Load messages from DB when session changes
  useEffect(() => {
    const sessionChanged = sessionId !== lastLoadedSessionRef.current;
    
    if (sessionChanged) {
      console.log('[AssistantConversation] Session changed to:', sessionId);
      lastLoadedSessionRef.current = sessionId;
      previousSessionIdRef.current = sessionId;
      setCurrentSuggestedPrompts([]);
      setInput('');
      setMessages([]); // Clear messages immediately for visual feedback
      setIsSessionLoading(true); // Show loading state
    }

    // Convert DB messages to our internal format AND re-enrich assistant messages
    const loadAndEnrichMessages = async () => {
      if (!initialMessages || initialMessages.length === 0) {
        if (sessionChanged) {
          setMessages([]);
          // Only cancel loading if history fetch is actually done
          if (!isHistoryLoading) {
            setIsSessionLoading(false);
          }
        }
        return;
      }

      // Only reload messages if session changed or if messages array is empty
      // IMPORTANT: Skip if we're currently sending a message (handleSubmit manages state directly)
      if (!sessionChanged && (messages.length > 0 || isSendingRef.current)) {
        return;
      }

      const enrichedMessages: Message[] = [];
      
      for (const msg of initialMessages) {
        const content = msg.role === 'assistant' 
          ? msg.content.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim() || msg.content
          : msg.content;
        enrichedMessages.push({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content,
          timestamp: new Date(msg.created_at),
        });
      }
      
      setMessages(enrichedMessages);
      setIsSessionLoading(false); // Done loading
    };

    loadAndEnrichMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, initialMessages]);

  // Loading message animation
  useEffect(() => {
    if (!isLoading) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-scroll: show the user's message at the top after sending
  useEffect(() => {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    if (lastUserMsg) {
      const el = document.getElementById(`msg-${lastUserMsg.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streamingText) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingText]);

  const handleSubmit = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);
    setWaitingForResponse(true);
    isSendingRef.current = true;
    setCurrentSuggestedPrompts([]);
    setStreamingText('');
    setToolStatus(null);
    streamingTextRef.current = '';
    
    textareaRef.current?.blur();

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      // Streaming callbacks that update the UI progressively
      const streamingCallbacks = {
        onDelta: (chunk: string) => {
          streamingTextRef.current += chunk;
          setStreamingText(streamingTextRef.current);
        },
        onStatus: (tool: string, status: string) => {
          const toolLabels: Record<string, string> = {
            search_artist_data: '🔍 Searching your data...',
            search_viral_videos: '🔍 Finding viral examples...',
            analyze_trends: '📊 Analyzing trends...',
            generate_hooks: '🪝 Crafting hooks...',
            search_sounds: '🎵 Searching sounds...',
          };
          setToolStatus(toolLabels[tool] || `🔍 ${status || 'Working...'}` );
        },
      };

      let rawResponse = onMessage 
        ? await onMessage(
            text,
            [...history, { role: 'user', content: text }],
            streamingCallbacks,
            abortControllerRef.current.signal,
          )
        : 'No response handler configured.';

      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Clear streaming state
      setStreamingText('');
      setToolStatus(null);
      streamingTextRef.current = '';

      // Check for empty AI response
      const isEmptyResponse = !rawResponse || 
        rawResponse.trim() === '' || 
        rawResponse.trim() === '{"output":""}' ||
        rawResponse.trim() === '{ "output": "" }';

      if (isEmptyResponse) {
        rawResponse = 'AI Agent is not responding, please try again.';
      }

      // Strip hidden_data and use raw text
      const cleanContent = rawResponse.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim() || rawResponse;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      console.error('Error:', error);
      setStreamingText('');
      setToolStatus(null);
      streamingTextRef.current = '';
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong, try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setWaitingForResponse(false);
      isSendingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages, onMessage, setWaitingForResponse]);

  // Keep ref in sync for slash commands
  handleSubmitRef.current = handleSubmit;

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setWaitingForResponse(false);
    isSendingRef.current = false;
    setStreamingText('');
    setToolStatus(null);
    streamingTextRef.current = '';
    setMessages(prev => [...prev, {
      id: `stopped-${Date.now()}`,
      role: 'assistant' as const,
      content: 'Stopped by user 🥀',
      timestamp: new Date(),
    }]);
  }, [setWaitingForResponse]);

  return (
    <div className={cn(
      "relative flex flex-col h-full overflow-hidden font-['Inter',sans-serif]",
      className
    )}>
      {/* Header - can be hidden when embedded in a container with its own header */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-6 py-4 pb-0">
          <div className="flex items-center gap-2">
            <WaveboundIcon className="w-6 h-6" />
            <h1 className="font-semibold text-foreground">Wavebound Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPinnedOnly(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                showPinnedOnly
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Bookmark className={cn("w-3.5 h-3.5", showPinnedOnly && "fill-current")} />
              {showPinnedOnly ? "All Messages" : "Saved"}
            </button>
            <WaveboundIcon className="w-5 h-5 opacity-50" />
          </div>
        </div>
      )}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden overscroll-contain chat-scroll-area" ref={scrollAreaContainerRef} style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="px-4 py-6 pb-40 w-full max-w-full box-border">
          {/* Session loading state */}
          {isSessionLoading && (
            <div className="text-center py-20">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <WaveboundIcon className="w-10 h-10 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Loading conversation...</span>
                </div>
              </motion.div>
            </div>
          )}

          {/* Empty state with starter prompts */}
          {messages.length === 0 && !isLoading && !isSessionLoading && (
            <AssistantWelcomeScreen onPromptClick={handleSubmit} />
          )}

          {/* Pinned empty state */}
          {showPinnedOnly && messages.filter(m => pinnedIds.has(m.id)).length === 0 && !isLoading && !isSessionLoading && (
            <div className="text-center py-20">
              <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No saved messages yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Bookmark important responses to find them here.</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages
              .filter(m => !showPinnedOnly || pinnedIds.has(m.id))
              .map((message) => {
              const Icon = getMessageIcon(message.content);
              
              return (
                <motion.div
                  key={message.id}
                  id={`msg-${message.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6"
                >
                  {/* User Message */}
                  {message.role === 'user' && (
                    <div className="flex justify-end pr-3">
                      <div className={cn("min-w-0", isFocusMode ? "max-w-[70%]" : "max-w-[82%]")}>
                        <div className="inline-block px-4 py-3 rounded-[18px_18px_4px_18px] bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.35)] [overflow-wrap:anywhere] whitespace-pre-wrap">
                          <p className="font-normal break-words [overflow-wrap:anywhere] text-[15px] text-primary-foreground">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assistant Message */}
                  {message.role === 'assistant' && (
                    <div className={cn("relative group space-y-3 min-w-0 overflow-hidden [word-break:break-word] [overflow-wrap:anywhere] bg-[hsl(0_0%_94%)] dark:bg-muted/30 rounded-[18px_18px_18px_4px] px-4 py-3 box-border", isFocusMode ? "max-w-[70%]" : "max-w-[85%]")}>
                      {/* Hover copy & bookmark buttons */}
                      <BubbleCopyButton content={message.content} />
                      <BubbleBookmarkButton messageId={message.id} isPinned={pinnedIds.has(message.id)} onToggle={togglePin} />

                      {/* Pinned indicator */}
                      {pinnedIds.has(message.id) && (
                        <div className="absolute bottom-2 right-2 pointer-events-none">
                          <Bookmark className="w-3 h-3 fill-primary text-primary" />
                        </div>
                      )}

                      {/* TikTok video card strip — above text */}
                      {(() => {
                        const videos = extractTikTokVideos(message.content);
                        return videos.length > 0 ? <VideoCardStrip videos={videos} /> : null;
                      })()}

                      {/* Clean markdown rendering */}
                      {message.content && (
                        <AssistantContentWithPills content={message.content} />
                      )}

                      {/* Message action buttons */}
                      <div className="flex items-center gap-1 pt-2">
                        <button
                          onClick={() => {
                            const cleanContent = message.content.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim();
                            navigator.clipboard.writeText(cleanContent);
                            toast.success('Copied to clipboard');
                          }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const msgIndex = messages.findIndex(m => m.id === message.id);
                            if (msgIndex > 0) {
                              for (let i = msgIndex - 1; i >= 0; i--) {
                                if (messages[i].role === 'user') {
                                  handleSubmit(messages[i].content);
                                  break;
                                }
                              }
                            }
                          }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Retry"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Streaming / Loading */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="relative group space-y-3 min-w-0 overflow-hidden [word-break:break-word] [overflow-wrap:anywhere] bg-[hsl(0_0%_94%)] dark:bg-muted/30 rounded-[18px_18px_18px_4px] px-4 py-3 box-border max-w-[85%]">
                {streamingText ? (
                  <>
                    {/* Streaming text rendered progressively */}
                    <div className="space-y-2 break-words overflow-wrap-anywhere">
                      {parseTextContent(
                        streamingText.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim()
                      )}
                    </div>
                    {/* Blinking cursor */}
                    <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
                  </>
                ) : (
                  /* Pre-stream blob loader */
                  <BlobLoader label={loadingMessage} />
                )}

                {/* Tool status indicator */}
                {toolStatus && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 pt-1 text-xs text-muted-foreground"
                  >
                    <span className="inline-block w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                    <span>{toolStatus}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* In-chat video preview with stats and actions */}
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-[420px] w-full bg-background border-border p-0 overflow-hidden" hideClose>
          <VisuallyHidden>
            <DialogTitle>Video preview</DialogTitle>
            <DialogDescription>Embedded video preview with stats</DialogDescription>
          </VisuallyHidden>

          {/* Header with title and close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium text-foreground line-clamp-1">
                {preview?.title || 'Video'}
              </p>
              {preview?.genre && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {preview.genre}
                  </span>
                  {preview.contentStyle && (
                    <span className="text-xs border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                      {preview.contentStyle}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreview(null)} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats bar */}
          {(preview?.views || preview?.likes || preview?.followers || preview?.viralScore) && (
            <div className="flex items-center justify-around px-4 py-2.5 bg-muted/20 border-b border-border/50">
              {preview.views !== undefined && preview.views > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatViews(preview.views)}</span>
                </div>
              )}
              {preview.likes !== undefined && preview.likes > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatViews(preview.likes)}</span>
                </div>
              )}
              {preview.followers !== undefined && preview.followers > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatViews(preview.followers)}</span>
                </div>
              )}
              {preview.viralScore !== undefined && preview.viralScore > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">{Math.round(preview.viralScore * 100)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Video embed */}
          <div className="flex items-center justify-center bg-black">
            {preview?.platform === 'instagram' && (preview.videoFileUrl || preview.url) ? (
              <InstagramEmbed 
                reelUrl={preview.url || ''} 
                videoId={preview.id} 
                videoFileUrl={preview.videoFileUrl}
                className="mx-auto" 
              />
            ) : preview?.platform === 'tiktok' ? (
              preview.url ? (
                <TikTokEmbed tiktokUrl={preview.url} className="mx-auto" />
              ) : (
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${preview?.id}`}
                  className="w-full rounded-lg"
                  style={{
                    height: '580px',
                    width: '100%',
                    minWidth: '320px',
                    maxWidth: '360px',
                    margin: '0 auto',
                    display: 'block',
                    pointerEvents: 'auto',
                    border: 'none',
                  }}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share; clipboard-write"
                  allowFullScreen
                  title="TikTok Video"
                  referrerPolicy="no-referrer-when-downgrade"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-forms allow-presentation"
                  loading="lazy"
                />
              )
            ) : null}
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {/* Add to favorites button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (preview?.videoData) {
                    const videoId = parseInt(String(preview.videoData.video_embed_id || preview.videoData.id).replace(/\D/g, ''), 10);
                    if (!isNaN(videoId)) {
                      const videoType = preview.platform === 'instagram' ? 'instagram_reel' : 'tiktok';
                      toggleFavorite(videoId, videoType);
                      toast.success(isFavorited(videoId, videoType) ? 'Removed from favorites' : 'Added to favorites');
                    }
                  }
                }}
                className="gap-1.5"
              >
                <Bookmark className={cn(
                  "w-4 h-4",
                  preview?.videoData && isFavorited(
                    parseInt(String(preview.videoData.video_embed_id || preview.videoData.id).replace(/\D/g, ''), 10),
                    preview.platform === 'instagram' ? 'instagram_reel' : 'tiktok'
                  ) && "fill-current text-primary"
                )} />
                {preview?.videoData && isFavorited(
                  parseInt(String(preview.videoData.video_embed_id || preview.videoData.id).replace(/\D/g, ''), 10),
                  preview.platform === 'instagram' ? 'instagram_reel' : 'tiktok'
                ) ? 'Favorited' : 'Favorite'}
              </Button>

              {/* Add to Plan button - only show when a plan is active */}
              {hasPlan && preview?.videoData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (preview.videoData) {
                      // Convert EnrichedIdea to Video type
                      const vd = preview.videoData.videoData as any || {};
                      const videoForPlan: VideoType = {
                        id: parseInt(String(preview.videoData.video_embed_id || preview.videoData.id).replace(/\D/g, ''), 10) || 0,
                        video_url: vd.video_url || preview.url || '',
                        embedded_ulr: vd.embedded_ulr || vd.video_embedded_url || preview.url,
                        thumbnail_url: vd.thumbnail_url,
                        outliar_score: vd.outliar_score || preview.viralScore || 0,
                        video_views: vd.video_views || preview.views || 0,
                        video_likes: vd.video_likes || preview.likes || 0,
                        comments: vd.comments || '',
                        profile_followers: vd.profile_followers || preview.followers || 0,
                        genre: vd.genre || preview.genre,
                        sub_genre: vd.sub_genre,
                        content_style: vd.content_style || preview.contentStyle,
                        hook: vd.hook || preview.title,
                        caption: vd.caption || preview.caption,
                        Artist: vd.Artist,
                        is_reel: preview.platform === 'instagram',
                      };
                      openDaySelector(videoForPlan);
                      setPreview(null); // Close preview modal
                    }
                  }}
                  className="gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Add to Plan
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Share button */}
              <ShareButton
                url={preview?.url}
                title={preview?.title || 'Check out this video'}
                variant="outline"
                size="sm"
              />
              
              {/* Open original link */}
              {preview?.url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(preview.url, '_blank')}
                  className="gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating input area overlaying scroll content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        {/* Gradient fade from transparent to background */}
        <div className="h-16 bg-gradient-to-b from-transparent to-background" />

        <div className="bg-background pointer-events-auto">
          {/* Suggested Prompts */}
          {currentSuggestedPrompts.length > 0 && !isLoading && (
            <div className="px-5 pt-1 pb-3">
              <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
                {currentSuggestedPrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(prompt)}
                    className="text-sm px-3.5 py-2 rounded-xl border border-border/10 bg-card/60 backdrop-blur-sm shadow-[0_2px_8px_-3px_hsl(var(--foreground)/0.04)] hover:shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.1)] hover:translate-y-[-0.5px] text-foreground transition-all duration-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-5 pb-3 pt-0">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-[24px] bg-white dark:bg-card border border-[hsl(240_5%_90%)] dark:border-border transition-all duration-300 focus-within:border-[hsl(240_5%_84%)]">
                <div className="flex items-end gap-2 p-3">
                  <div className="flex-1 relative" ref={slashMenuRef}>
                    {/* Slash command dropdown */}
                    <AnimatePresence>
                      {showSlashMenu && filteredSlashCommands.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-xl bg-white dark:bg-card border border-border/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden"
                        >
                          {filteredSlashCommands.map((cmd, i) => (
                            <button
                              key={cmd.command}
                              type="button"
                              onClick={() => handleSlashSelect(cmd)}
                              onMouseEnter={() => setSlashSelectedIndex(i)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                                i === slashSelectedIndex ? "bg-primary/5" : "hover:bg-primary/5"
                              )}
                            >
                              <span className="text-base">{cmd.emoji}</span>
                              <span className="text-sm text-muted-foreground font-mono">{cmd.command}</span>
                              <span className="text-sm text-foreground font-medium">{cmd.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInput(val);
                        // Slash menu logic: show when starts with / and no spaces
                        if (val.startsWith('/') && !val.includes(' ')) {
                          setShowSlashMenu(true);
                          setSlashFilter(val);
                        } else {
                          setShowSlashMenu(false);
                          setSlashFilter('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (showSlashMenu && filteredSlashCommands.length > 0) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSlashSelectedIndex(prev => (prev + 1) % filteredSlashCommands.length);
                            return;
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSlashSelectedIndex(prev => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length);
                            return;
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSlashSelect(filteredSlashCommands[slashSelectedIndex]);
                            return;
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setShowSlashMenu(false);
                            setSlashFilter('');
                            return;
                          }
                        }
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Ask anything about content strategy..."
                      className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 py-2 text-[15px] placeholder:text-[hsl(0_0%_74%)]"
                      rows={1}
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={isLoading ? handleCancel : () => handleSubmit()}
                    disabled={!isLoading && !input.trim()}
                    className={cn(
                      "h-9 w-9 rounded-full transition-all shadow-sm",
                      isLoading ? "bg-destructive hover:bg-destructive/90" : "shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)]"
                    )}
                    aria-label={isLoading ? "Stop generating" : "Send message"}
                  >
                    {isLoading ? (
                      <Square className="w-3 h-3 fill-current" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
