import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { RotateCw } from 'lucide-react';

interface Job {
  id: string;
  artist_handle: string;
  label_id: string | null;
  label_name?: string;
  status: string;
  tiktok_status: string | null;
  instagram_status: string | null;
  spotify_status: string | null;
  deep_research_status: string | null;
  synthesis_status: string | null;
  rag_status: string | null;
  deliverable_status: string | null;
  plan_render_status: string | null;
  report_render_status: string | null;
}

const PHASES = [
  { key: 'tiktok_status', label: 'TikTok' },
  { key: 'instagram_status', label: 'IG' },
  { key: 'spotify_status', label: 'Spotify' },
  { key: 'deep_research_status', label: 'Research' },
  { key: 'synthesis_status', label: 'Synthesis' },
  { key: 'rag_status', label: 'RAG' },
  { key: 'deliverable_status', label: 'Deliver' },
  { key: 'plan_render_status', label: 'Plan' },
  { key: 'report_render_status', label: 'Report' },
] as const;

function statusIcon(s: string | null) {
  if (!s || s === 'pending') return '⏳';
  if (s === 'completed') return '✅';
  if (s === 'processing') return '🔄';
  if (s === 'failed') return '❌';
  return '⏳';
}

export function AdminPipelineTab() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    const [{ data: jobsData }, { data: labels }] = await Promise.all([
      supabase.from('deep_research_jobs').select('id, artist_handle, label_id, status, tiktok_status, instagram_status, spotify_status, deep_research_status, synthesis_status, rag_status, deliverable_status, plan_render_status, report_render_status').order('created_at', { ascending: false }),
      supabase.from('labels').select('id, name'),
    ]);
    const lm: Record<string, string> = {};
    (labels || []).forEach((l: any) => { lm[l.id] = l.name; });
    setJobs((jobsData || []).map((j: any) => ({ ...j, label_name: j.label_id ? lm[j.label_id] || '—' : '—' })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Auto-refresh every 30s if any processing jobs
  useEffect(() => {
    const hasProcessing = jobs.some(j => j.status === 'processing');
    if (hasProcessing) {
      intervalRef.current = setInterval(fetchJobs, 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jobs, fetchJobs]);

  async function retrigger(handle: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.functions.invoke('start-onboarding', {
        body: { tiktok_handle: handle, artist_name: handle, instagram_handle: handle, platform: 'tiktok', initiated_by: user?.id || null },
      });
      toast({ title: `Re-triggered pipeline for @${handle}` });
      fetchJobs();
    } catch {
      toast({ title: 'Failed to re-trigger', variant: 'destructive' });
    }
  }

  const filtered = jobs.filter(j => {
    if (filter === 'all') return true;
    if (filter === 'failed') return j.status === 'failed';
    if (filter === 'processing') return j.status === 'processing';
    if (filter === 'completed') return j.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground">Pipeline Status</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <p className="text-muted-foreground text-sm">Loading…</p> : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handle</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Overall</TableHead>
                {PHASES.map(p => <TableHead key={p.key} className="text-center text-xs">{p.label}</TableHead>)}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(j => (
                <TableRow key={j.id}>
                  <TableCell className="font-mono text-sm">@{j.artist_handle}</TableCell>
                  <TableCell className="text-sm">{j.label_name}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${j.status === 'completed' ? 'bg-green-500/20 text-green-400' : j.status === 'processing' ? 'bg-amber-500/20 text-amber-400' : j.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-muted text-muted-foreground'}`}>
                      {j.status}
                    </span>
                  </TableCell>
                  {PHASES.map(p => <TableCell key={p.key} className="text-center">{statusIcon((j as any)[p.key])}</TableCell>)}
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => retrigger(j.artist_handle)}><RotateCw className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
