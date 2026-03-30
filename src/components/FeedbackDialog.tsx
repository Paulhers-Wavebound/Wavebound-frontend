import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackType: 'positive' | 'negative';
  sessionId: string | null;
  messageContent?: string;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  feedbackType,
  sessionId,
  messageContent,
}: FeedbackDialogProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to submit feedback');
        return;
      }

      const { error } = await supabase.from('assistant_feedback').insert({
        user_id: user.id,
        session_id: sessionId || 'unknown',
        feedback_type: feedbackType,
        feedback_message: message.trim() || null,
        message_content: messageContent?.substring(0, 500) || null,
      });

      if (error) throw error;

      toast.success(
        feedbackType === 'positive' 
          ? 'Thanks for the positive feedback!' 
          : 'Thanks for the feedback, we\'ll work on improving!'
      );
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Submit feedback without message
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.success('Thanks for the feedback!');
        onOpenChange(false);
        return;
      }

      await supabase.from('assistant_feedback').insert({
        user_id: user.id,
        session_id: sessionId || 'unknown',
        feedback_type: feedbackType,
        feedback_message: null,
        message_content: messageContent?.substring(0, 500) || null,
      });

      toast.success('Thanks for the feedback!');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.success('Thanks for the feedback!');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {feedbackType === 'positive' ? (
              <>
                <ThumbsUp className="w-5 h-5 text-green-500" />
                What did you like?
              </>
            ) : (
              <>
                <ThumbsDown className="w-5 h-5 text-orange-500" />
                What could be improved?
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {feedbackType === 'positive'
              ? 'Tell us what worked well (optional)'
              : 'Help us improve by sharing what went wrong (optional)'}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder={
            feedbackType === 'positive'
              ? 'The response was helpful because...'
              : 'The response could be better if...'
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px] resize-none"
        />

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
