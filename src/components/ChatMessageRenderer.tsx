import { useMemo } from 'react';
import { Camera, Video, Music, User, TrendingUp, Eye, Lightbulb } from 'lucide-react';
import { EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { 
  RichVideoCard, 
  VideoListItem, 
  HookSuggestion,
  Timeline,
  StatCard,
  TrendBar,
  ProTip,
  QuickPrep,
  FeedbackItem,
  RolloutDay,
  VideoRow,
  ActionButton
} from './ChatRichContent';
import { cn } from '@/lib/utils';
import waveboundLogo from '@/assets/wavebound-logo.png';

// Format views
const formatViews = (views: number | undefined): string => {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
  return views.toString();
};

// Pre-process dense prose responses (e.g. Cached_Trend) into bullet-formatted text
function preprocessDenseResponse(text: string): string {
  const newlineCount = (text.match(/\n/g) || []).length;
  if (text.length < 300 || newlineCount >= 3) return text;

  const splitPattern = /(?=(?:For\s+(?:original|new|emerging)\s+\w+|In\s+(?:country|hip\s*hop|R&B|pop|EDM|rock|latin|jazz|folk|indie|electronic|alternative|metal|punk|soul|funk|reggae|gospel|blues|classical|dance|trap|drill|afrobeats|amapiano|K-pop|J-pop)\b|The\s+(?:emerging|single\s+hottest|biggest|key|most\s+important|top)|Overall|Meanwhile|Additionally|On\s+the\s+(?:other|flip)\s+side|Looking\s+at|When\s+it\s+comes\s+to|What(?:'s|\s+is)\s+(?:interesting|notable|worth)))/i;

  const segments = text.split(splitPattern).map(s => s.trim()).filter(Boolean);

  if (segments.length < 2) {
    const sentenceSegments = text.split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.trim()).filter(s => s.length > 0);
    if (sentenceSegments.length >= 3) {
      return sentenceSegments.map(s => `- ${s}`).join('\n');
    }
    return text;
  }

  return segments.map(s => `- ${s}`).join('\n');
}

// Simple markdown renderer
function renderMarkdown(text: string): React.ReactNode[] {
  const preprocessed = preprocessDenseResponse(text);
  const lines = preprocessed.split('\n');
  const elements: React.ReactNode[] = [];
  
  const processInline = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Process links first
    const linkProcessed = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '‹LINK:$1:$2›');
    if (linkProcessed !== str) {
      const linkParts = linkProcessed.split(/(‹LINK:[^›]+›)/g);
      const result: React.ReactNode[] = [];
      linkParts.forEach((part, i) => {
        const linkMatch = part.match(/‹LINK:([^:]+):(.+)›/);
        if (linkMatch) {
          result.push(
            <a key={`link-${i}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
              {linkMatch[1]}
            </a>
          );
        } else if (part) {
          result.push(<span key={`lt-${i}`}>{part}</span>);
        }
      });
      return result;
    }
    let remaining = str;
    let partIndex = 0;
    
    while (remaining.length > 0) {
      const codeMatch = remaining.match(/`([^`]+)`/);
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      
      // Find earliest match
      const matches = [
        codeMatch ? { type: 'code', match: codeMatch } : null,
        boldMatch ? { type: 'bold', match: boldMatch } : null,
        italicMatch ? { type: 'italic', match: italicMatch } : null,
      ].filter(Boolean).sort((a, b) => a!.match.index! - b!.match.index!);
      
      if (matches.length === 0) {
        parts.push(<span key={`t-${partIndex++}`}>{remaining}</span>);
        break;
      }
      
      const first = matches[0]!;
      if (first.match.index! > 0) {
        parts.push(<span key={`t-${partIndex++}`}>{remaining.slice(0, first.match.index)}</span>);
      }
      
      if (first.type === 'code') {
        parts.push(
          <code key={`c-${partIndex++}`} className="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">
            {first.match[1]}
          </code>
        );
      } else if (first.type === 'bold') {
        parts.push(<strong key={`b-${partIndex++}`} className="font-semibold text-white">{first.match[1]}</strong>);
      } else {
        parts.push(<em key={`i-${partIndex++}`} className="italic text-[#A3A3A3]">{first.match[1]}</em>);
      }
      
      remaining = remaining.slice(first.match.index! + first.match[0].length);
    }
    return parts;
  };
  
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeBlockStart = 0;
  
  lines.forEach((line, lineIndex) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${codeBlockStart}`} className="bg-[#141414] border border-white/10 rounded-lg p-4 overflow-x-auto my-2">
            <code className="text-[#E5E5E5] text-sm font-mono whitespace-pre">{codeLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeLines = [];
      } else {
        inCodeBlock = true;
        codeBlockStart = lineIndex;
      }
      return;
    }
    
    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }
    
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      elements.push(<hr key={lineIndex} className="my-3 border-white/10" />);
      return;
    }

    // Blockquote
    const blockquoteMatch = line.match(/^>\s+(.+)/);
    if (blockquoteMatch) {
      elements.push(
        <blockquote key={lineIndex} className="border-l-2 border-purple-500/50 pl-4 text-[#A3A3A3] italic my-3">
          {processInline(blockquoteMatch[1])}
        </blockquote>
      );
      return;
    }
    
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      elements.push(
        <h3 key={lineIndex} className="font-semibold text-white text-base mt-6 mb-2">
          {processInline(h3Match[1])}
        </h3>
      );
      return;
    }
    
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      elements.push(
        <h2 key={lineIndex} className="font-semibold text-white text-lg mt-6 mb-2">
          {processInline(h2Match[1])}
        </h2>
      );
      return;
    }
    
    const h1Match = line.match(/^#\s+(.+)/);
    if (h1Match) {
      elements.push(
        <h1 key={lineIndex} className="font-semibold text-white text-xl mt-6 mb-2">
          {processInline(h1Match[1])}
        </h1>
      );
      return;
    }
    
    const dayMatch = line.match(/^[\*\-•]?\s*\*?\*?(Day\s+\d+):?\*?\*?\s*(.*)$/i);
    if (dayMatch) {
      elements.push(
        <h4 key={lineIndex} className="font-semibold text-foreground mt-3 mb-1 flex items-center gap-2">
          <span className="text-primary">📅</span>
          <span>{dayMatch[1]}{dayMatch[2] ? `: ${dayMatch[2].replace(/^\*\*|\*\*$/g, '').replace(/^:\s*/, '')}` : ''}</span>
        </h4>
      );
      return;
    }
    
    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={lineIndex} className="flex gap-2 pl-4 mb-1.5">
          <span className="text-purple-400 font-mono text-sm">{numberedMatch[1]}.</span>
          <span className="text-[#E5E5E5]">{processInline(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    const bulletMatch = line.match(/^[\*\-•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <div key={lineIndex} className="flex gap-2 pl-4 mb-1.5">
          <span className="text-purple-500">•</span>
          <span className="text-[#E5E5E5]">{processInline(bulletMatch[1])}</span>
        </div>
      );
      return;
    }
    
    if (line.trim() === '') {
      elements.push(<div key={lineIndex} className="h-2" />);
      return;
    }
    
    elements.push(<p key={lineIndex} className="text-[#E5E5E5] leading-relaxed mb-3">{processInline(line)}</p>);
  });
  
  // Handle unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key={`code-${codeBlockStart}`} className="bg-[#141414] border border-white/10 rounded-lg p-4 overflow-x-auto my-2">
        <code className="text-[#E5E5E5] text-sm font-mono whitespace-pre">{codeLines.join('\n')}</code>
      </pre>
    );
  }
  
  return elements;
}

// Get context icon based on message content
function getContextIcon(content: string): React.ReactNode {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('video') || lowerContent.includes('film') || lowerContent.includes('tiktok') || lowerContent.includes('reel')) {
    return <Video className="w-4 h-4 text-muted-foreground" />;
  }
  if (lowerContent.includes('audio') || lowerContent.includes('music') || lowerContent.includes('track') || lowerContent.includes('song')) {
    return <Music className="w-4 h-4 text-muted-foreground" />;
  }
  if (lowerContent.includes('photo') || lowerContent.includes('picture') || lowerContent.includes('slide')) {
    return <Camera className="w-4 h-4 text-muted-foreground" />;
  }
  if (lowerContent.includes('profile') || lowerContent.includes('analyze') || lowerContent.includes('audit')) {
    return <User className="w-4 h-4 text-muted-foreground" />;
  }
  
  return <Camera className="w-4 h-4 text-muted-foreground" />;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  ideas?: EnrichedIdea[];
  timestamp?: Date;
  isLoading?: boolean;
  loadingStatus?: string;
}

export function ChatMessage({ 
  role, 
  content, 
  ideas = [],
  timestamp,
  isLoading,
  loadingStatus
}: ChatMessageProps) {
  // Determine if this message has rich content
  const hasRichContent = ideas.length > 0;
  
  // Group ideas by type for different display formats
  const videoIdeas = ideas.filter(i => i.contentType === 'tiktok' || !i.contentType);
  const reelIdeas = ideas.filter(i => i.contentType === 'reel');
  const carouselIdeas = ideas.filter(i => i.contentType === 'photo_carousel');
  
  if (role === 'user') {
    return (
      <div className="flex items-start gap-3">
        {/* Context icon */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          {getContextIcon(content)}
        </div>
        
        {/* Message bubble */}
        <div className="flex-1">
          <div className="inline-block bg-muted rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[90%]">
            <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Assistant message with potential rich content
  return (
    <div className="space-y-4">
      {/* Video cards in horizontal scroll - displayed first */}
      {videoIdeas.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {videoIdeas.map((idea, i) => (
              <RichVideoCard key={idea.id || i} idea={idea} />
            ))}
          </div>
        </div>
      )}
      
      {/* Text content - displayed after videos */}
      {content && (
        <div className="text-sm text-[#E5E5E5] leading-relaxed">
          {renderMarkdown(content)}
        </div>
      )}
      
      {/* Reel cards */}
      {reelIdeas.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {reelIdeas.map((idea, i) => (
              <RichVideoCard key={idea.id || i} idea={idea} />
            ))}
          </div>
        </div>
      )}
      
      {/* Photo carousel / slides */}
      {carouselIdeas.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">You can also make picture slides:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {carouselIdeas.slice(0, 2).map((idea, i) => (
              <div 
                key={idea.id || i}
                className="rounded-xl overflow-hidden bg-muted/40 shadow-[0_2px_12px_-4px_hsl(var(--foreground)/0.06)]"
              >
                {/* Thumbnail */}
                <div className="relative h-32">
                  {idea.videoData?.thumbnail_url ? (
                    <img 
                      src={idea.videoData.thumbnail_url} 
                      alt={idea.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/90 px-2 py-0.5 rounded-full text-[10px] font-medium">
                    <Camera className="w-3 h-3" />
                    Slides
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-3">
                  <p className="font-medium text-sm text-foreground">{idea.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatViews(idea.videoData?.photo_views)} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">{loadingStatus || 'Analyzing...'}</span>
        </div>
      )}
    </div>
  );
}

// User message with file attachment preview
interface UserMessageWithFileProps {
  content: string;
  fileName?: string;
  fileType?: 'video' | 'audio';
  fileDuration?: string;
  fileSize?: string;
}

export function UserMessageWithFile({ 
  content, 
  fileName, 
  fileType, 
  fileDuration, 
  fileSize 
}: UserMessageWithFileProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Context icon */}
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        {fileType === 'audio' ? (
          <Music className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Video className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        {/* File attachment */}
        {fileName && (
          <div className="inline-flex items-center gap-3 bg-muted/60 rounded-xl px-4 py-3 shadow-[0_2px_12px_-4px_hsl(var(--foreground)/0.06)]">
            <div className="w-12 h-12 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
              {fileType === 'audio' ? (
                <Music className="w-6 h-6 text-primary" />
              ) : (
                <Video className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {fileDuration && `${fileDuration}`}{fileDuration && fileSize && ' • '}{fileSize && fileSize}
              </p>
            </div>
          </div>
        )}
        
        {/* Message */}
        <div className="inline-block bg-muted rounded-2xl rounded-tl-md px-4 py-2.5">
          <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
}
