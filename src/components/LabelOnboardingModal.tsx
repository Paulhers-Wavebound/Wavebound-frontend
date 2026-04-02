import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LabelOnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const LabelOnboardingModal = ({ open, onClose }: LabelOnboardingModalProps) => {
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = handle.replace(/^@/, '').trim();
    if (!cleaned) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('user_profiles')
        .update({ artist_handle: cleaned })
        .eq('user_id', user.id);

      toast({ title: 'Handle saved!', description: `Your TikTok handle is @${cleaned}` });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {/* non-dismissible */}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide the close button by not rendering it
        hideClose
      >
        <DialogHeader>
          <DialogTitle>Welcome to your label!</DialogTitle>
          <DialogDescription>What's your TikTok handle? This helps your label find you.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tiktok-handle">TikTok Handle</Label>
            <Input
              id="tiktok-handle"
              placeholder="@yourhandle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving || !handle.replace(/^@/, '').trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LabelOnboardingModal;
