import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { callAdminOnboarding } from '@/utils/adminOnboarding';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Copy, Check, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  artist_handle: string;
  artist_name: string | null;
  label_id: string | null;
  status: string | null;
  plan_review_status: string | null;
  invite_code: string | null;
  updated_at: string | null;
}

const pipelineBadge = (s: string | null) => {
  if (!s) return <span className="text-[#a8a29e] text-xs">—</span>;
  if (s === 'completed') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Done</Badge>;
  if (s === 'failed') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
  return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Running</Badge>;
};

const reviewBadge = (s: string | null) => {
  if (s === 'approved') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
  if (s === 'needs_changes') return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Flagged</Badge>;
  return <Badge className="bg-[#1C1C1E] text-[#a8a29e] border-[#a8a29e]/20">Pending</Badge>;
};

export function AdminArtistsTab() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      callAdminOnboarding('pipeline_status'),
      callAdminOnboarding('list_labels'),
    ]).then(([jobsData, labelsData]) => {
      setJobs(jobsData?.jobs || []);
      const map: Record<string, string> = {};
      (labelsData?.labels || []).forEach((l: any) => { map[l.id] = l.name; });
      setLabelMap(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(j =>
      (j.artist_name || '').toLowerCase().includes(q) ||
      (j.artist_handle || '').toLowerCase().includes(q)
    );
  }, [jobs, search]);

  function copyCode(code: string, handle: string) {
    navigator.clipboard.writeText(code);
    toast.success('Copied');
    setCopiedHandle(handle);
    setTimeout(() => setCopiedHandle(null), 2000);
  }

  async function handleDelete() {
    if (!deleteTarget || confirmText !== deleteTarget.artist_handle) return;
    setDeleting(true);
    try {
      await callAdminOnboarding('delete_artist', {
        artist_handle: deleteTarget.artist_handle,
        confirm_handle: confirmText,
      });
      setJobs(prev => prev.filter(j => j.artist_handle !== deleteTarget.artist_handle));
      toast.success(`Deleted @${deleteTarget.artist_handle}`);
      setDeleteTarget(null);
      setConfirmText('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-[#a8a29e] text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#ede8dc]">All Artists</h2>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a8a29e]" />
          <Input
            placeholder="Search by name or handle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#1C1C1E] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]"
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#1C1C1E] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C1C1E]">
              <th className="text-left p-3 font-medium text-[#a8a29e]">Artist</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Label</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Pipeline</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Review</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Invite Code</th>
              <th className="text-left p-3 font-medium text-[#a8a29e]">Updated</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(j => (
              <tr
                key={j.artist_handle}
                onClick={() => navigate(`/label/artists/${j.artist_handle}?from=admin`)}
                className="border-b border-[#1C1C1E] hover:bg-[#1C1C1E] cursor-pointer transition-colors"
              >
                <td className="p-3">
                  <div className="font-medium text-[#ede8dc]">{j.artist_name || j.artist_handle}</div>
                  <div className="text-xs text-[#a8a29e]">@{j.artist_handle}</div>
                </td>
                <td className="p-3 text-[#a8a29e]">{j.label_id ? labelMap[j.label_id] || '—' : '—'}</td>
                <td className="p-3">{pipelineBadge(j.status)}</td>
                <td className="p-3">{reviewBadge(j.plan_review_status)}</td>
                <td className="p-3">
                  {j.invite_code ? (
                    <button
                      onClick={e => { e.stopPropagation(); copyCode(j.invite_code!, j.artist_handle); }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a8a29e] hover:text-[#ede8dc] transition-colors"
                    >
                      {j.invite_code}
                      {copiedHandle === j.artist_handle ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  ) : <span className="text-[#a8a29e] text-xs">—</span>}
                </td>
                <td className="p-3 text-xs text-[#a8a29e]">
                  {j.updated_at ? formatDistanceToNow(new Date(j.updated_at), { addSuffix: true }) : '—'}
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#a8a29e] hover:text-red-400 hover:bg-red-500/10"
                    onClick={e => { e.stopPropagation(); setDeleteTarget(j); setConfirmText(''); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-[#a8a29e] text-sm py-8">No artists found.</p>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) { setDeleteTarget(null); setConfirmText(''); } }}>
        <AlertDialogContent className="bg-[#1C1C1E] border-[#2a2a2e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#ede8dc]">Delete Artist</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a8a29e]">
              This will permanently delete <span className="font-semibold text-red-400">@{deleteTarget?.artist_handle}</span> and all associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-[#a8a29e]">Type <span className="font-mono font-semibold text-[#ede8dc]">{deleteTarget?.artist_handle}</span> to confirm:</p>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="artist_handle"
              className="bg-[#111] border-[#2a2a2e] text-[#ede8dc]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#2a2a2e] text-[#a8a29e] hover:bg-white/5">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirmText !== deleteTarget?.artist_handle || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting…' : 'Delete Forever'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
