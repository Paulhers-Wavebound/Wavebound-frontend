import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Download, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchVersions,
  fetchVersionDetail,
  revertVersion,
  DeliverableVersion,
  DeliverableType,
  CurrentDeliverable,
  DELIVERABLE_TYPE_CONFIG,
  CREATED_BY_CONFIG,
  formatBytes,
  downloadBlob,
} from '@/utils/adminVersionHistory';
import { VersionPreviewModal } from './VersionPreviewModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface Props {
  artistHandle: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReverted: () => void;
}

const TYPE_FILTERS: { key: DeliverableType | 'all'; label: string }[] = [
  { key: 'all', label: 'All Types' },
  ...Object.entries(DELIVERABLE_TYPE_CONFIG).map(([key, cfg]) => ({ key: key as DeliverableType, label: cfg.label })),
];

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function VersionHistoryDrawer({ artistHandle, open, onOpenChange, onReverted }: Props) {
  const [versions, setVersions] = useState<DeliverableVersion[]>([]);
  const [current, setCurrent] = useState<Record<string, CurrentDeliverable>>({});
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<DeliverableType | 'all'>('all');

  // Preview
  const [previewVersion, setPreviewVersion] = useState<DeliverableVersion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState<number | null>(null);

  // Revert
  const [revertTarget, setRevertTarget] = useState<DeliverableVersion | null>(null);
  const [reRender, setReRender] = useState(true);
  const [isReverting, setIsReverting] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!artistHandle) return;
    setLoading(true);
    try {
      const data = await fetchVersions(artistHandle);
      setVersions(data.versions || []);
      setCurrent(data.current || {});
    } catch (e: any) {
      toast.error(e.message || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  }, [artistHandle]);

  useEffect(() => {
    if (open && artistHandle) {
      loadVersions();
      setFilterType('all');
    }
  }, [open, artistHandle, loadVersions]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return versions;
    return versions.filter(v => v.deliverable_type === filterType);
  }, [versions, filterType]);

  async function handlePreview(v: DeliverableVersion) {
    // If we already have content, show directly
    if (v.content_html || v.content) {
      setPreviewVersion(v);
      setPreviewOpen(true);
      return;
    }
    setLoadingPreview(v.id);
    try {
      const full = await fetchVersionDetail(v.id);
      setPreviewVersion(full);
      setPreviewOpen(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load preview');
    } finally {
      setLoadingPreview(null);
    }
  }

  async function handleDownload(v: DeliverableVersion, format: 'html' | 'json') {
    let version = v;
    if (!v.content_html && !v.content) {
      try {
        version = await fetchVersionDetail(v.id);
      } catch {
        toast.error('Failed to fetch version for download');
        return;
      }
    }
    const fname = `${version.artist_handle}_${version.deliverable_type}_v${version.version_number}`;
    if (format === 'html' && version.content_html) {
      downloadBlob(version.content_html, `${fname}.html`, 'text/html');
    } else if (format === 'json' && version.content) {
      downloadBlob(JSON.stringify(version.content, null, 2), `${fname}.json`, 'application/json');
    } else {
      toast.error('Content not available for this format');
    }
  }

  async function handleRevert() {
    if (!revertTarget || !artistHandle) return;
    setIsReverting(true);
    try {
      const shouldReRender = revertTarget.deliverable_type === 'content_plan_7day' && reRender;
      const result = await revertVersion(revertTarget.id, artistHandle, shouldReRender);
      toast.success(`Restored to version ${result.restored_version}. Current version was archived.`);
      setRevertTarget(null);
      setPreviewOpen(false);
      await loadVersions();
      onReverted();
    } catch (e: any) {
      toast.error(e.message || 'Revert failed');
    } finally {
      setIsReverting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[480px] max-w-full bg-[#0a0a0a] border-[#1C1C1E] text-[#ede8dc] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-[#ede8dc]">Version History</SheetTitle>
            {artistHandle && <p className="text-xs text-[#a8a29e]">@{artistHandle}</p>}
          </SheetHeader>

          {/* Filter pills */}
          <div className="flex gap-1.5 flex-wrap px-4 pb-3">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  filterType === f.key
                    ? 'bg-[#ede8dc] text-[#0a0a0a]'
                    : 'bg-[#1C1C1E] text-[#a8a29e] hover:text-[#ede8dc]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Version list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-[#a8a29e]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-[#a8a29e] text-sm py-12">
                No version history yet.<br />
                <span className="text-xs">Versions are saved automatically each time the pipeline runs.</span>
              </div>
            ) : (
              filtered.map(v => {
                const typeConfig = DELIVERABLE_TYPE_CONFIG[v.deliverable_type];
                const createdByConfig = CREATED_BY_CONFIG[v.created_by] || CREATED_BY_CONFIG.pipeline;
                return (
                  <div
                    key={v.id}
                    className="rounded-lg bg-[#111] border border-[#1C1C1E] p-3 hover:border-[#a8a29e]/30 transition-colors"
                    style={{ borderLeftWidth: 4, borderLeftColor: typeConfig.color }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1C1C1E] text-xs font-bold text-[#ede8dc]">
                          v{v.version_number}
                        </span>
                        <Badge style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color, borderColor: `${typeConfig.color}50`, fontSize: 10 }}>
                          {typeConfig.label}
                        </Badge>
                        <Badge className={`${createdByConfig.className} text-[10px]`}>{createdByConfig.label}</Badge>
                      </div>
                      <span className="text-[10px] text-[#a8a29e] whitespace-nowrap" title={new Date(v.created_at).toLocaleString()}>
                        {timeAgo(v.created_at)}
                      </span>
                    </div>

                    {v.week_of && <p className="text-[10px] text-[#a8a29e] mt-1">Week of {v.week_of}</p>}
                    {v.notes && <p className="text-[11px] text-[#a8a29e] italic mt-1 truncate">{v.notes}</p>}

                    <div className="flex items-center gap-1.5 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[#a8a29e] hover:text-[#ede8dc]"
                        onClick={() => handlePreview(v)}
                        disabled={loadingPreview === v.id}
                      >
                        {loadingPreview === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="ml-1 text-[11px]">Preview</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[#a8a29e] hover:text-[#ede8dc]"
                        onClick={() => handleDownload(v, v.content_html ? 'html' : 'json')}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="ml-1 text-[11px]">Download</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-orange-400 hover:text-orange-300 ml-auto"
                        onClick={() => { setRevertTarget(v); setReRender(true); }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="ml-1 text-[11px]">Restore</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview modal */}
      <VersionPreviewModal
        version={previewVersion}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onRevert={(v) => { setRevertTarget(v); setReRender(true); }}
      />

      {/* Revert confirmation */}
      <AlertDialog open={!!revertTarget} onOpenChange={(open) => { if (!open) setRevertTarget(null); }}>
        <AlertDialogContent className="bg-[#0a0a0a] border-[#1C1C1E] text-[#ede8dc]">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore version {revertTarget?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a8a29e]">
              This will archive the current version and replace it with the selected one.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {revertTarget?.deliverable_type === 'content_plan_7day' && (
            <div className="flex items-center gap-2 py-2">
              <Checkbox
                id="re-render"
                checked={reRender}
                onCheckedChange={(c) => setReRender(!!c)}
              />
              <label htmlFor="re-render" className="text-xs text-[#a8a29e] cursor-pointer">
                Re-render HTML after restoring
              </label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1C1C1E] text-[#a8a29e] hover:bg-[#1C1C1E]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevert}
              disabled={isReverting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isReverting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RotateCcw className="w-4 h-4 mr-1" />}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
