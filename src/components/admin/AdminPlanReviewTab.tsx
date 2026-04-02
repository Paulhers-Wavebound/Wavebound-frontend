import { useState, useEffect, useMemo } from 'react';
import { callAdminOnboarding } from '@/utils/adminOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Eye, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';

interface Job {
  artist_handle: string;
  artist_name: string | null;
  label_id: string | null;
  status: string;
  plan_review_status: string | null;
}

type Filter = 'all' | 'pending' | 'approved' | 'needs_changes';
type DocTab = 'content_plan_html' | 'intelligence_report_html' | 'thirty_day_plan_html' | 'artist_brief_html';

const DOC_TABS: { key: DocTab; label: string }[] = [
  { key: 'content_plan_html', label: '7-Day Plan' },
  { key: 'intelligence_report_html', label: 'Intel Report' },
  { key: 'thirty_day_plan_html', label: '30-Day Plan' },
  { key: 'artist_brief_html', label: 'Artist Brief' },
];

const reviewBadge = (s: string | null) => {
  if (s === 'approved') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
  if (s === 'needs_changes') return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Flagged</Badge>;
  return <Badge className="bg-[#1C1C1E] text-[#a8a29e] border-[#a8a29e]/20">Pending</Badge>;
};

export function AdminPlanReviewTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [docTab, setDocTab] = useState<DocTab>('content_plan_html');
  const [docs, setDocs] = useState<Record<string, string | null>>({});
  const [docsLoading, setDocsLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      callAdminOnboarding('pipeline_status'),
      callAdminOnboarding('list_labels'),
    ]).then(([jobsData, labelsData]) => {
      const completed = (jobsData?.jobs || []).filter((j: Job) => j.status === 'completed');
      setJobs(completed);
      const map: Record<string, string> = {};
      (labelsData?.labels || []).forEach((l: any) => { map[l.id] = l.name; });
      setLabelMap(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const refetchDocs = (handle: string) => {
    setDocsLoading(true);
    supabase.from('artist_intelligence')
      .select('content_plan_html, intelligence_report_html, thirty_day_plan_html, artist_brief_html')
      .eq('artist_handle', handle)
      .single()
      .then(({ data }: any) => {
        setDocs(data || {});
        setDocsLoading(false);
      })
      .catch(() => { setDocs({}); setDocsLoading(false); });
  };

  // Fetch docs when artist selected
  useEffect(() => {
    if (!selectedHandle) { setDocs({}); return; }
    refetchDocs(selectedHandle);
  }, [selectedHandle]);

  const counts = useMemo(() => {
    const c = { all: jobs.length, pending: 0, approved: 0, needs_changes: 0 };
    jobs.forEach(j => {
      const s = j.plan_review_status || 'pending';
      if (s in c) c[s as keyof typeof c]++;
      else c.pending++;
    });
    return c;
  }, [jobs]);

  const filtered = useMemo(() => {
    let result = filter === 'all' ? jobs : jobs.filter(j => (j.plan_review_status || 'pending') === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        (j.artist_name || '').toLowerCase().includes(q) ||
        j.artist_handle.toLowerCase().includes(q) ||
        (j.label_id && (labelMap[j.label_id] || '').toLowerCase().includes(q))
      );
    }
    return result;
  }, [jobs, filter, search, labelMap]);

  async function handleReview(status: string) {
    if (!selectedHandle) return;
    setReviewing(true);
    try {
      await callAdminOnboarding('review_artist', { artist_handle: selectedHandle, status });
      toast.success(`@${selectedHandle} marked as ${status}`);
      setJobs(prev => prev.map(j => j.artist_handle === selectedHandle ? { ...j, plan_review_status: status } : j));
    } catch {
      toast.error('Review failed');
    } finally {
      setReviewing(false);
    }
  }

  const currentDoc = docs[docTab] as string | null;
  const filterPills: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'approved', label: `Approved (${counts.approved})` },
    { key: 'needs_changes', label: `Needs Changes (${counts.needs_changes})` },
  ];

  if (loading) return <p className="text-[#a8a29e] text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#ede8dc]">
          {counts.approved} of {counts.all} plans reviewed
          <span className="ml-2 text-sm font-normal text-[#a8a29e]">
            ({counts.all > 0 ? Math.round((counts.approved / counts.all) * 100) : 0}%)
          </span>
        </h2>
        {selectedHandle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="text-[#a8a29e] hover:text-[#ede8dc]"
          >
            <Clock className="w-4 h-4 mr-1" /> History
          </Button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filterPills.map(p => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === p.key
                ? 'bg-[#ede8dc] text-[#0a0a0a]'
                : 'bg-[#1C1C1E] text-[#a8a29e] hover:text-[#ede8dc]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Artist list */}
        <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="relative sticky top-0 z-10 pb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#a8a29e]" />
            <Input
              placeholder="Search artists…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-[#1C1C1E] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/60"
            />
          </div>
          {filtered.length === 0 && <p className="text-[#a8a29e] text-sm">No plans to review</p>}
          {filtered.map(j => (
            <div
              key={j.artist_handle}
              onClick={() => { setSelectedHandle(j.artist_handle); setDocTab('content_plan_html'); }}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedHandle === j.artist_handle
                  ? 'border-orange-500 bg-orange-500/5'
                  : 'border-[#1C1C1E] hover:border-[#a8a29e]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#ede8dc] text-sm">{j.artist_name || j.artist_handle}</div>
                  <div className="text-xs text-[#a8a29e]">@{j.artist_handle}</div>
                </div>
                {reviewBadge(j.plan_review_status)}
              </div>
              {j.label_id && <div className="text-xs text-[#a8a29e] mt-1">{labelMap[j.label_id] || ''}</div>}
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-3">
          {selectedHandle ? (
            <>
              {/* Doc tabs */}
              <div className="flex gap-1 flex-wrap">
                {DOC_TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setDocTab(t.key)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      docTab === t.key
                        ? 'bg-[#1C1C1E] text-[#ede8dc]'
                        : 'text-[#a8a29e] hover:text-[#ede8dc]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center h-64 text-[#a8a29e]">Loading preview…</div>
              ) : currentDoc ? (
                <div className="rounded-lg border border-[#1C1C1E] overflow-hidden">
                  <iframe
                    srcDoc={currentDoc}
                    className="w-full bg-white"
                    style={{ minHeight: 'calc(100vh - 250px)' }}
                    title={`${docTab} for ${selectedHandle}`}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-[#a8a29e] text-sm">
                  Preview unavailable — deliverable may not be generated yet.
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleReview('approved')}
                  disabled={reviewing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  onClick={() => handleReview('needs_changes')}
                  disabled={reviewing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <AlertCircle className="w-4 h-4 mr-1" /> Flag
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-[#a8a29e]">
              <Eye className="w-5 h-5 mr-2" /> Select an artist to preview their deliverables
            </div>
          )}
        </div>
      </div>

      <VersionHistoryDrawer
        artistHandle={selectedHandle}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onReverted={() => { if (selectedHandle) refetchDocs(selectedHandle); }}
      />
    </div>
  );
}
