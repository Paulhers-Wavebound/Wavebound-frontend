import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { toast } from '@/hooks/use-toast';

interface AddArtistModalProps {
  open: boolean;
  onClose: () => void;
  onAdded?: (handle: string, name: string) => void;
  existingHandles?: string[];
}

export default function AddArtistModal({ open, onClose, onAdded, existingHandles = [] }: AddArtistModalProps) {
  const { labelId } = useUserProfile();
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelId) {
      toast({ title: 'Label not loaded yet', description: 'Please wait a moment and try again.', variant: 'destructive' });
      return;
    }
    if (!tiktokHandle.trim()) return;

    const handle = tiktokHandle.trim().replace(/^@/, '').toLowerCase();

    if (existingHandles.includes(handle)) {
      toast({ title: 'Artist already on roster', description: `@${handle} has already been added.`, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const igHandle = instagramHandle.trim().replace(/^@/, '').toLowerCase();
      const { data: { user } } = await supabase.auth.getUser();

      // Pre-insert stub rows with correct label_id
      await (supabase.from as any)('artist_intelligence')
        .insert({ artist_handle: handle, label_id: labelId, status: 'processing' });
      await (supabase.from as any)('roster_dashboard_metrics')
        .insert({ artist_handle: handle, label_id: labelId });

      const { error } = await supabase.functions.invoke('start-onboarding', {
        body: {
          tiktok_handle: handle,
          artist_name: artistName.trim() || undefined,
          instagram_handle: igHandle || handle,
          platform: 'tiktok',
          initiated_by: user?.id || null,
          label_id: labelId,
        },
      });

      if (error) throw error;

      const name = artistName.trim() || handle;
      toast({
        title: 'Pipeline started',
        description: 'Artist will be ready in ~2 hours.',
      });
      onAdded?.(handle, name);
      setTiktokHandle('');
      setInstagramHandle('');
      setArtistName('');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to start onboarding.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md font-['DM_Sans']">
        <DialogHeader>
          <DialogTitle>Add Artist</DialogTitle>
          <DialogDescription>Enter details to start the onboarding pipeline.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tiktok">TikTok Handle *</Label>
            <Input
              id="tiktok"
              placeholder="@handle"
              value={tiktokHandle}
              onChange={e => setTiktokHandle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input
              id="instagram"
              placeholder="@handle (optional)"
              value={instagramHandle}
              onChange={e => setInstagramHandle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Artist Name</Label>
            <Input
              id="name"
              placeholder="Display name (optional)"
              value={artistName}
              onChange={e => setArtistName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !tiktokHandle.trim() || !labelId}>
              {submitting ? 'Starting…' : 'Add Artist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
