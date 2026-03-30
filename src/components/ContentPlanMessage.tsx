import { useMemo } from 'react';
import { Calendar, Video, Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayPlan {
  day: number;
  title: string;
  action: string;
  conceptType?: string;
}

interface ContentPlanMessageProps {
  content: string;
  className?: string;
}

// Parse the AI response to extract structured day plans
function parseDayPlans(content: string): { intro: string; days: DayPlan[]; outro: string } {
  const days: DayPlan[] = [];
  let intro = '';
  let outro = '';
  
  // Split by day patterns
  const dayPattern = /###?\s*Day\s+(\d+):\s*(.+?)(?=###?\s*Day\s+\d+:|$)/gis;
  
  // Get intro text (before first day)
  const firstDayMatch = content.match(/###?\s*Day\s+\d+:/i);
  if (firstDayMatch && firstDayMatch.index !== undefined) {
    intro = content.slice(0, firstDayMatch.index).trim();
  }
  
  let match;
  let lastIndex = 0;
  
  while ((match = dayPattern.exec(content)) !== null) {
    const dayNum = parseInt(match[1]);
    const dayContent = match[2].trim();
    
    // Parse title (after the concept type, before the action)
    const titleMatch = dayContent.match(/(?:^|\n)\s*\*?\s*\*?Title:?\*?\*?\s*["""]?(.+?)["""]?(?:\n|$)/i);
    const actionMatch = dayContent.match(/(?:^|\n)\s*\*?\s*\*?Action:?\*?\*?\s*(.+?)(?=\n\s*\*|\n###|$)/is);
    
    // Extract concept type (The Throwback, The Emo Meme, etc.)
    const conceptType = dayContent.split('\n')[0]?.replace(/^\*+|\*+$/g, '').trim();
    
    days.push({
      day: dayNum,
      title: titleMatch?.[1]?.replace(/^\*+|\*+$/g, '').replace(/^["""]|["""]$/g, '').trim() || '',
      action: actionMatch?.[1]?.trim() || '',
      conceptType: conceptType || undefined,
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Get outro (after last day)
  if (lastIndex > 0 && lastIndex < content.length) {
    outro = content.slice(lastIndex).trim();
  }
  
  return { intro, days, outro };
}

// Render inline markdown (bold, italic)
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    
    if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
      if (boldMatch.index! > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
    } else if (italicMatch) {
      if (italicMatch.index! > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++} className="italic text-muted-foreground">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  
  return parts;
}

// Day card component
function DayCard({ day, isLast }: { day: DayPlan; isLast: boolean }) {
  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
      )}
      
      <div className="flex gap-3">
        {/* Day indicator */}
        <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{day.day}</span>
        </div>
        
        {/* Card content */}
        <div className="flex-1 pb-4">
          <div className="bg-muted/30 rounded-xl border border-border/50 p-3 hover:border-primary/20 transition-colors">
            {/* Concept type badge */}
            {day.conceptType && (
              <div className="flex items-center gap-1.5 mb-2">
                <Video className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">{day.conceptType}</span>
              </div>
            )}
            
            {/* Title */}
            {day.title && (
              <h4 className="font-semibold text-sm text-foreground mb-1.5 leading-tight">
                "{day.title}"
              </h4>
            )}
            
            {/* Action */}
            {day.action && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {renderInlineMarkdown(day.action)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentPlanMessage({ content, className }: ContentPlanMessageProps) {
  const { intro, days, outro } = useMemo(() => parseDayPlans(content), [content]);
  
  // If no days were parsed, render as plain markdown
  if (days.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground leading-relaxed space-y-2", className)}>
        {content.split('\n').map((line, i) => {
          if (line.trim() === '') return <div key={i} className="h-1" />;
          return <p key={i}>{renderInlineMarkdown(line)}</p>;
        })}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Intro text */}
      {intro && (
        <div className="text-sm text-muted-foreground leading-relaxed">
          {renderInlineMarkdown(intro)}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center gap-2 py-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">7-Day Content Plan</span>
      </div>
      
      {/* Day cards */}
      <div className="space-y-0">
        {days.map((day, i) => (
          <DayCard key={day.day} day={day} isLast={i === days.length - 1} />
        ))}
      </div>
      
      {/* Outro / CTA */}
      {outro && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{renderInlineMarkdown(outro)}</p>
        </div>
      )}
    </div>
  );
}
