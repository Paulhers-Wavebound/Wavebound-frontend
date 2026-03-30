import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';


const T = {
  surface: '#141414',
  elevated: '#1E1E1E',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  accent: '#8B5CF6',
  accentHover: '#A78BFA',
} as const;

interface ChatInputProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ChatInput({ onSubmit, onCancel, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 5 * 24)}px`;
  }, [input]);

  const handleSubmit = useCallback(() => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput('');
    onSubmit(msg);
  }, [input, isLoading, onSubmit]);


  return (
    <div className="shrink-0 px-4 pb-4 pt-2 backdrop-blur-xl bg-[#0A0A0A]/80 border-t border-white/5">
      <div className="max-w-3xl mx-auto space-y-2">

        {/* Input container */}
        <div
          className="flex items-end gap-2 px-3 py-2 rounded-xl transition-shadow"
          style={{ backgroundColor: T.surface, border: '1px solid rgba(255,255,255,0.1)' }}
          onFocusCapture={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(139,92,246,0.3)'; }}
          onBlurCapture={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { textareaRef.current?.blur(); } if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Ask about your music, content, or strategy..."
            className="flex-1 min-h-[42px] max-h-[120px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none px-1 py-2 text-[15px] placeholder:text-white/30"
            style={{ color: T.text }}
            rows={1}
          />
          <Button
            size="icon"
            onClick={isLoading ? onCancel : handleSubmit}
            disabled={!isLoading && !input.trim()}
            className={cn(
              'h-9 w-9 rounded-full shrink-0 transition-all duration-200 mb-0.5',
              !isLoading && !input.trim() && 'opacity-50 cursor-not-allowed',
            )}
            style={{
              backgroundColor: isLoading ? 'rgba(239,68,68,0.8)' : (input.trim() ? T.accent : T.elevated),
              color: '#FFFFFF',
              boxShadow: !isLoading && input.trim() ? '0 0 20px rgba(139,92,246,0.15)' : 'none',
              transition: 'background-color 200ms ease-out, box-shadow 200ms ease-out',
            }}
            onMouseEnter={e => {
              if (isLoading) return;
              if (input.trim()) e.currentTarget.style.backgroundColor = T.accentHover;
            }}
            onMouseLeave={e => {
              if (isLoading) return;
              e.currentTarget.style.backgroundColor = input.trim() ? T.accent : T.elevated;
            }}
          >
            {isLoading ? <Square className="w-3.5 h-3.5 fill-current" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
