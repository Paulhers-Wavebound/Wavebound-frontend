import { useEffect, useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LabelArtist {
  artist_handle: string;
  artist_name: string;
  avatar_url: string | null;
  status: string;
}

interface Label {
  id: string;
  name: string;
  slug: string;
  invite_code: string | null;
  is_active: boolean;
  artist_count: number;
  artists: LabelArtist[];
}

export default function AdminLabels() {
  const { invoke, loading } = useAdminData();
  const [labels, setLabels] = useState<Label[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', invite_code: '', is_active: true });
  const [creating, setCreating] = useState(false);

  const fetchLabels = async () => {
    const data = await invoke('all_labels');
    if (data?.labels) setLabels(data.labels);
  };

  useEffect(() => { fetchLabels(); }, []);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const createLabel = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    setCreating(true);
    try {
      await invoke('create_label', form);
      toast.success('Label created');
      setDialogOpen(false);
      setForm({ name: '', slug: '', invite_code: '', is_active: true });
      fetchLabels();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create label');
    }
    setCreating(false);
  };

  if (loading && labels.length === 0) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Create Label
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Label</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Label name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Slug (URL-safe)"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              />
              <Input
                placeholder="Invite code (optional)"
                value={form.invite_code}
                onChange={e => setForm(f => ({ ...f, invite_code: e.target.value }))}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
                />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <Button onClick={createLabel} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-8 p-3"></th>
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Invite Code</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Artists</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Active</th>
            </tr>
          </thead>
          <tbody>
            {labels.map(l => (
              <>
                <tr
                  key={l.id}
                  onClick={() => toggle(l.id)}
                  className="border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  <td className="p-3 text-muted-foreground">
                    {expanded.has(l.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </td>
                  <td className="p-3 font-medium text-foreground">{l.name}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{l.slug}</td>
                  <td className="p-3">
                    {l.invite_code ? (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(l.invite_code!);
                          toast.success('Copied');
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono"
                      >
                        {l.invite_code} <Copy className="h-3 w-3" />
                      </button>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-right tabular-nums text-foreground">{l.artist_count}</td>
                  <td className="p-3 text-center">
                    <Badge className={l.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
                      {l.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
                {expanded.has(l.id) && l.artists.length > 0 && (
                  <tr key={`${l.id}-artists`}>
                    <td colSpan={6} className="bg-muted/20 p-3">
                      <div className="flex flex-wrap gap-3">
                        {l.artists.map(a => (
                          <div key={a.artist_handle} className="flex items-center gap-2 bg-card rounded-md px-3 py-1.5 border border-border">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={a.avatar_url || ''} />
                              <AvatarFallback className="text-[10px]">{(a.artist_name || '?')[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-foreground">{a.artist_name || a.artist_handle}</span>
                            <Badge variant="outline" className="text-[10px] px-1">{a.status || '—'}</Badge>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {expanded.has(l.id) && l.artists.length === 0 && (
                  <tr key={`${l.id}-empty`}>
                    <td colSpan={6} className="bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                      No artists in this label.
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {labels.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No labels found.</p>
        )}
      </div>
    </div>
  );
}
