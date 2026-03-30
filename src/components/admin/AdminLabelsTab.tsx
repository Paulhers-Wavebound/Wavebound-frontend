import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callAdminOnboarding } from '@/utils/adminOnboarding';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Label {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  is_active: boolean;
  onboarding_status: string | null;
  artist_count: number;
  approved_count: number;
  created_at: string;
}

const onboardingBadge = (s: string | null) => {
  if (!s) return <span className="text-[#a8a29e] text-xs">—</span>;
  const map: Record<string, string> = {
    generating: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    pending_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return <Badge className={map[s] || 'bg-[#1C1C1E] text-[#a8a29e]'}>{s.replace('_', ' ')}</Badge>;
};

export function AdminLabelsTab() {
  const navigate = useNavigate();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Label | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    callAdminOnboarding('list_labels')
      .then(data => setLabels(data?.labels || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    toast.success('Copied');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete() {
    if (!deleteTarget || confirmName !== deleteTarget.name) return;
    setDeleting(true);
    try {
      const res = await callAdminOnboarding('delete_label', {
        label_id: deleteTarget.id,
        confirm_name: confirmName,
      });
      if (!res?.success) throw new Error(res?.error || 'Server did not confirm deletion');
      toast.success(`Deleted "${deleteTarget.name}" and ${res.deleted_artists || 0} artists`);
      setLabels(prev => prev.filter(l => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      setConfirmName('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete label');
    }
    setDeleting(false);
  }

  if (loading) return <p className="text-[#a8a29e] text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#ede8dc]">Labels</h2>

      <div className="rounded-lg border border-[#1C1C1E] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C1C1E]">
              <th className="text-left p-3 font-medium text-[#a8a29e]">Name</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Invite Code</th>
              <th className="text-right p-3 font-medium text-[#a8a29e]">Artists</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Status</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Onboarding</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Created</th>
              <th className="w-10 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {labels.map(l => (
              <tr
                key={l.id}
                onClick={() => navigate('/admin/onboarding')}
                className="border-b border-[#1C1C1E] hover:bg-white/5 cursor-pointer transition-colors"
              >
                <td className="p-3 font-medium text-[#ede8dc]">{l.name}</td>
                <td className="p-3">
                  <button
                    onClick={e => { e.stopPropagation(); copyCode(l.invite_code, l.id); }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a8a29e] hover:text-[#ede8dc] transition-colors"
                  >
                    {l.invite_code}
                    {copiedId === l.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </td>
                <td className="p-3 text-right text-[#ede8dc] tabular-nums">{l.artist_count}</td>
                <td className="p-3">
                  {l.is_active
                    ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                    : <Badge className="bg-[#1C1C1E] text-[#a8a29e]">Inactive</Badge>}
                </td>
                <td className="p-3">{onboardingBadge(l.onboarding_status)}</td>
                <td className="p-3 text-xs text-[#a8a29e]">
                  {l.created_at ? formatDistanceToNow(new Date(l.created_at), { addSuffix: true }) : '—'}
                </td>
                <td className="p-3">
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(l); setConfirmName(''); }}
                    className="p-1 rounded hover:bg-red-500/20 text-[#a8a29e] hover:text-red-400 transition-colors"
                    title="Delete label"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {labels.length === 0 && (
          <p className="text-center text-[#a8a29e] text-sm py-8">No labels found.</p>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) { setDeleteTarget(null); setConfirmName(''); } }}>
        <DialogContent className="bg-[#0a0a0a] border-[#1C1C1E]">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#a8a29e]">
              This will <strong className="text-[#ede8dc]">permanently delete</strong> the label
              <strong className="text-[#ede8dc]"> "{deleteTarget?.name}"</strong> and
              <strong className="text-[#ede8dc]"> all {deleteTarget?.artist_count || 0} artists</strong> on it.
              This action cannot be undone.
            </p>
            <p className="text-sm text-[#a8a29e]">
              Type <strong className="text-[#ede8dc]">{deleteTarget?.name}</strong> to confirm:
            </p>
            <Input
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              placeholder={deleteTarget?.name}
              className="bg-[#1C1C1E] border-[#2a2a2a] text-[#ede8dc]"
            />
            <Button
              variant="destructive"
              className="w-full"
              disabled={confirmName !== deleteTarget?.name || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete Label & All Artists'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
