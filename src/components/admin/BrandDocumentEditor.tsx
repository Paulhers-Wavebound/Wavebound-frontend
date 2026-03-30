import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { X, Plus, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/* ── Reusable sub-components ── */

function BriefTextField({ label, value, onChange, rows, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">{label}</label>
      {rows ? (
      <Textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
          className="text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc] placeholder:text-[#a8a29e]/50" placeholder="Not available" />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} type={type}
          className="h-8 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc] placeholder:text-[#a8a29e]/50" placeholder="Not available" />
      )}
    </div>
  );
}

function BriefPillEditor({ label, items, onChange, color = 'neutral' }: {
  label: string; items: string[]; onChange: (v: string[]) => void; color?: 'green' | 'red' | 'neutral';
}) {
  const [input, setInput] = useState('');
  const chipClass = color === 'green' ? 'bg-green-500/15 text-green-400' : color === 'red' ? 'bg-red-500/15 text-red-400' : 'bg-[#333] text-[#a8a29e]';
  return (
    <div>
      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 items-center">
        {(items || []).map((it, i) => (
          <span key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${chipClass}`}>
            {it}
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
          </span>
        ))}
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { e.preventDefault(); onChange([...(items || []), input.trim()]); setInput(''); } }}
          placeholder="Add…" className="w-28 h-6 text-xs bg-transparent border-[#2A2A2E] text-[#ede8dc] placeholder:text-[#a8a29e]/50" />
      </div>
    </div>
  );
}

function BriefListEditor({ label, items, onChange }: {
  label: string; items: string[]; onChange: (v: string[]) => void;
}) {
  const safeItems = items || [];
  return (
    <div>
      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">{label}</label>
      <div className="space-y-1">
        {safeItems.map((it, i) => (
          <div key={i} className="flex gap-1.5">
            <Input value={it} onChange={e => { const arr = [...safeItems]; arr[i] = e.target.value; onChange(arr); }}
              className="h-7 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc] flex-1" />
            <button onClick={() => onChange(safeItems.filter((_, idx) => idx !== i))} className="text-[#a8a29e] hover:text-red-400"><X className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => onChange([...safeItems, ''])} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
      </div>
    </div>
  );
}

function BriefEditableTable({ label, columns, rows, onChange }: {
  label: string; columns: { key: string; label: string; type?: string; options?: string[] }[];
  rows: Record<string, any>[]; onChange: (v: Record<string, any>[]) => void;
}) {
  const safeRows = rows || [];
  return (
    <div>
      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">{label} — {safeRows.length} items</label>
      <div className="border border-[#333] rounded-lg overflow-hidden">
        <div className="grid gap-0 text-[10px] text-[#a8a29e] uppercase tracking-wider px-2 py-1.5 bg-[#2A2A2E]/50 border-b border-[#333]"
          style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 28px` }}>
          {columns.map(c => <span key={c.key}>{c.label}</span>)}
          <span />
        </div>
        {safeRows.map((row, ri) => (
          <div key={ri} className="grid gap-0 px-2 py-1 border-b border-[#333]/50 items-start"
            style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 28px` }}>
            {columns.map(c => (
              <div key={c.key} className="pr-1">
                {c.options ? (
                  <Select value={row[c.key] || ''} onValueChange={v => { const arr = [...safeRows]; arr[ri] = { ...arr[ri], [c.key]: v }; onChange(arr); }}>
                    <SelectTrigger className="h-6 text-[10px] bg-transparent border-none text-[#ede8dc] p-0"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
                      {c.options.map(o => <SelectItem key={o} value={o} className="text-[#ede8dc] text-xs">{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : c.type === 'longtext' ? (
                  <Textarea value={row[c.key] ?? ''} onChange={e => { const arr = [...safeRows]; arr[ri] = { ...arr[ri], [c.key]: e.target.value }; onChange(arr); }}
                    rows={3} className="text-[10px] bg-transparent border-none text-[#ede8dc] p-1 resize-y min-h-[60px]" />
                ) : (
                  <Input value={row[c.key] ?? ''} onChange={e => { const arr = [...safeRows]; arr[ri] = { ...arr[ri], [c.key]: c.type === 'number' ? Number(e.target.value) : e.target.value }; onChange(arr); }}
                    type={c.type || 'text'} className="h-6 text-[10px] bg-transparent border-none text-[#ede8dc] p-0 px-1" />
                )}
              </div>
            ))}
            <button onClick={() => onChange(safeRows.filter((_, idx) => idx !== ri))} className="text-[#a8a29e] hover:text-red-400 justify-self-center mt-1"><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
      <button onClick={() => { const empty: Record<string, any> = {}; columns.forEach(c => { empty[c.key] = ''; }); onChange([...safeRows, empty]); }}
        className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-1"><Plus className="w-3 h-3" /> Add row</button>
    </div>
  );
}

function BriefCardList<T extends Record<string, any>>({ label, items, onChange, renderCard }: {
  label: string; items: T[]; onChange: (v: T[]) => void; renderCard: (item: T, update: (v: T) => void) => React.ReactNode;
}) {
  const safeItems = items || [];
  return (
    <div>
      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">{label} — {safeItems.length} items</label>
      <div className="space-y-2">
        {safeItems.map((item, i) => (
          <div key={i} className="bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg p-3 relative">
            <button onClick={() => onChange(safeItems.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-[#a8a29e] hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
            {renderCard(item, (updated) => { const arr = [...safeItems]; arr[i] = updated; onChange(arr); })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */
interface BrandDocumentEditorProps {
  brandDocument: any;
  artistBriefHtml: string | null;
  artistHandle: string;
  onSaved: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function BrandDocumentEditor({ brandDocument, artistBriefHtml, artistHandle, onSaved, onDirtyChange }: BrandDocumentEditorProps) {
  const [doc, setDoc] = useState<any>(() => brandDocument ? JSON.parse(JSON.stringify(brandDocument)) : null);
  const originalDoc = useRef<string>(JSON.stringify(brandDocument));
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setPreviewKey(k => k + 1);
  }, [artistBriefHtml]);

  const hasChanges = useMemo(() => {
    if (!doc) return false;
    return JSON.stringify(doc) !== originalDoc.current;
  }, [doc]);

  // Notify parent of dirty state
  useMemo(() => { onDirtyChange?.(hasChanges); }, [hasChanges, onDirtyChange]);

  const get = useCallback((path: string) => {
    if (!doc) return undefined;
    return path.split('.').reduce((o: any, k) => o?.[k], doc);
  }, [doc]);

  const set = useCallback((path: string, value: any) => {
    setDoc((prev: any) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  }, []);

  const ninetyDayMetricsPath = useMemo(() => {
    const candidates = [
      'ninety_day_targets.metrics',
      'ninety_day_targets.kpis',
      'ninety_day_targets.growth_targets',
      'ninety_day_targets.targets',
      'ninety_day_targets.metric_targets',
    ];

    return candidates.find((path) => Array.isArray(get(path))) || 'ninety_day_targets.metrics';
  }, [get]);

  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const saveBrief = async (showRerender = false) => {
    if (!doc || !artistHandle) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from as any)('artist_intelligence')
        .update({ brand_document: doc })
        .eq('artist_handle', artistHandle);
      if (error) throw error;
      originalDoc.current = JSON.stringify(doc);
      onSaved();

      if (showRerender) {
        // Trigger WF14 webhook via edge function proxy
        try {
          await supabase.auth.refreshSession();
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch('https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/trigger-webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + session?.access_token,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY',
            },
            body: JSON.stringify({ webhook: 'wf14-artist-brief', payload: { artist_handle: artistHandle } }),
          });
          if (!res.ok) throw new Error('Webhook error');
          toast.success('Saved & re-rendering brief…');
          setRefreshing(true);
          const currentHtml = artistBriefHtml;
          if (pollRef.current) clearInterval(pollRef.current);
          let attempts = 0;
          pollRef.current = setInterval(async () => {
            attempts++;
            try {
              const { data } = await (supabase.from as any)('artist_intelligence')
                .select('artist_brief_html')
                .eq('artist_handle', artistHandle)
                .single();
              if (data?.artist_brief_html && data.artist_brief_html !== currentHtml) {
                clearInterval(pollRef.current!);
                pollRef.current = null;
                setRefreshing(false);
                onSaved();
                toast.success('Brief preview updated');
              } else if (attempts >= 9) {
                clearInterval(pollRef.current!);
                pollRef.current = null;
                setRefreshing(false);
                toast.info('Render may still be in progress — refresh manually if needed');
              }
            } catch {
              clearInterval(pollRef.current!);
              pollRef.current = null;
              setRefreshing(false);
            }
          }, 10000);
        } catch {
          toast.error('Brief saved but re-render failed');
        }
      } else {
        toast.success('Artist brief data saved');
      }
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message || 'Unknown error'));
    } finally { setSaving(false); }
  };

  const discardChanges = () => {
    if (brandDocument) {
      setDoc(JSON.parse(JSON.stringify(brandDocument)));
    }
  };

  if (!brandDocument || !doc) {
    return <div className="flex items-center justify-center h-64 text-[#a8a29e] text-sm">No artist brief data generated yet</div>;
  }

  const sectionCount = (path: string) => {
    const v = get(path);
    return Array.isArray(v) ? v.length : 0;
  };

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: iframe preview */}
        <ResizablePanel defaultSize={50} minSize={15} collapsible className="overflow-auto relative">
        {artistBriefHtml ? (
            <iframe key={previewKey} srcDoc={artistBriefHtml} className="w-full h-full bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}
              title="Artist Brief Preview" sandbox="allow-scripts allow-same-origin" />
          ) : (
            <div className="flex items-center justify-center h-full text-[#a8a29e] text-sm">No rendered brief yet</div>
          )}
          {refreshing && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-white text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Re-rendering brief…
              </div>
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-[#2A2A2E] hover:bg-[#3A3A3E] transition-colors" />

        {/* Right: structured form */}
        <ResizablePanel defaultSize={50} minSize={15} collapsible>
        <ScrollArea className="h-full">
          <div className="p-4">
            <Accordion type="multiple" defaultValue={['s1']} className="space-y-1">

              {/* S1 — Artist Identity */}
              <AccordionItem value="s1" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Artist Identity
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefTextField label="Stage Name" value={get('identity.stage_name') || ''} onChange={v => set('identity.stage_name', v)} />
                  <BriefTextField label="Genre" value={get('identity.genre') || ''} onChange={v => set('identity.genre', v)} />
                  <BriefPillEditor label="Sub-genres" items={get('identity.sub_genres') || []} onChange={v => set('identity.sub_genres', v)} />
                  <BriefTextField label="Sonic Identity" value={get('identity.sonic_identity') || ''} onChange={v => set('identity.sonic_identity', v)} rows={3} />
                  <BriefTextField label="Artist Archetype" value={get('identity.artist_archetype') || ''} onChange={v => set('identity.artist_archetype', v)} />
                  <BriefTextField label="Visual Aesthetic" value={get('identity.visual_aesthetic') || ''} onChange={v => set('identity.visual_aesthetic', v)} rows={3} />
                  <BriefPillEditor label="Musical Influences" items={get('identity.musical_influences') || []} onChange={v => set('identity.musical_influences', v)} />
                  <BriefPillEditor label="Key Personality Traits" items={get('identity.key_personality_traits') || []} onChange={v => set('identity.key_personality_traits', v)} />
                </AccordionContent>
              </AccordionItem>

              {/* S2 — Career Context */}
              <AccordionItem value="s2" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Career Context
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefTextField label="Origin Story" value={get('career.origin_story') || ''} onChange={v => set('career.origin_story', v)} rows={4} />
                  <div>
                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">Most Recent Release</label>
                    <div className="grid grid-cols-3 gap-2">
                      <BriefTextField label="Name" value={get('career.most_recent_release.name') || ''} onChange={v => set('career.most_recent_release.name', v)} />
                      <div>
                        <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">Type</label>
                        <Select value={get('career.most_recent_release.type') || ''} onValueChange={v => set('career.most_recent_release.type', v)}>
                          <SelectTrigger className="h-8 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
                            {['single', 'album', 'EP'].map(t => <SelectItem key={t} value={t} className="text-[#ede8dc] text-xs">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <BriefTextField label="Date" value={get('career.most_recent_release.date') || ''} onChange={v => set('career.most_recent_release.date', v)} />
                    </div>
                  </div>
                  <BriefEditableTable label="Top Tracks" columns={[
                    { key: 'track', label: 'Track Name' },
                    { key: 'streams', label: 'Streams' },
                  ]} rows={get('career.biggest_tracks') || []} onChange={v => set('career.biggest_tracks', v)} />
                  <BriefEditableTable label="Chart Positions" columns={[
                    { key: 'track', label: 'Track/Album' },
                    { key: 'chart', label: 'Chart' },
                    { key: 'peak', label: 'Peak #' },
                    { key: 'date', label: 'Date' },
                  ]} rows={get('career.chart_positions') || []} onChange={v => set('career.chart_positions', v)} />
                  <div>
                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">Discography Summary</label>
                    <div className="grid grid-cols-3 gap-2">
                      <BriefTextField label="Albums" value={String(get('career.discography_summary.albums') ?? '')} onChange={v => set('career.discography_summary.albums', Number(v) || 0)} type="number" />
                      <BriefTextField label="EPs" value={String(get('career.discography_summary.eps') ?? '')} onChange={v => set('career.discography_summary.eps', Number(v) || 0)} type="number" />
                      <BriefTextField label="Singles" value={String(get('career.discography_summary.singles') ?? '')} onChange={v => set('career.discography_summary.singles', Number(v) || 0)} type="number" />
                    </div>
                  </div>
                  <BriefListEditor label="Awards & Recognition" items={get('career.awards_and_recognition') || []} onChange={v => set('career.awards_and_recognition', v)} />
                  <BriefEditableTable label="Notable Collaborations" columns={[
                    { key: 'track', label: 'Track' },
                    { key: 'artist', label: 'Artist' },
                    { key: 'date', label: 'Date' },
                  ]} rows={get('career.notable_collaborations') || []} onChange={v => set('career.notable_collaborations', v)} />
                </AccordionContent>
              </AccordionItem>

              {/* S3 — Audience Intelligence */}
              <AccordionItem value="s3" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Audience Intelligence
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefTextField label="Core Demographic" value={get('audience.core_demographic') || ''} onChange={v => set('audience.core_demographic', v)} rows={2} />
                  <BriefTextField label="Fan Sentiment" value={get('audience.fan_sentiment') || ''} onChange={v => set('audience.fan_sentiment', v)} rows={2} />
                  <BriefTextField label="Cross-Genre Appeal" value={get('audience.cross_genre_appeal') || ''} onChange={v => set('audience.cross_genre_appeal', v)} rows={2} />
                  <BriefListEditor label="Inside Jokes & Memes" items={get('audience.inside_jokes_or_memes') || []} onChange={v => set('audience.inside_jokes_or_memes', v)} />
                  <BriefPillEditor label="Identified Superfans" items={get('audience.superfans') || []} onChange={v => set('audience.superfans', v)} />
                </AccordionContent>
              </AccordionItem>

              {/* S4 — Content DNA */}
              <AccordionItem value="s4" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Content DNA
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-4">
                  {/* Audio Signature */}
                  <div className="space-y-3">
                    <h4 className="text-xs text-[#ede8dc] font-semibold">Audio Signature</h4>
                    <BriefTextField label="Primary Genre" value={get('content_dna.audio_signature.primary_genre') || ''} onChange={v => set('content_dna.audio_signature.primary_genre', v)} />
                    <BriefPillEditor label="Sub-genres" items={get('content_dna.audio_signature.sub_genres') || []} onChange={v => set('content_dna.audio_signature.sub_genres', v)} />
                    <BriefTextField label="Vocal Profile" value={get('content_dna.audio_signature.vocal_profile') || ''} onChange={v => set('content_dna.audio_signature.vocal_profile', v)} />
                    <BriefPillEditor label="Instruments" items={get('content_dna.audio_signature.instruments') || []} onChange={v => set('content_dna.audio_signature.instruments', v)} />
                    <BriefPillEditor label="Dominant Moods" items={get('content_dna.audio_signature.dominant_moods') || []} onChange={v => set('content_dna.audio_signature.dominant_moods', v)} />
                  </div>

                  {/* Format Performance */}
                  <BriefEditableTable label="Format Performance" columns={[
                    { key: 'format_name', label: 'Format' },
                    { key: 'video_count', label: 'Videos', type: 'number' },
                    { key: 'pct_of_content', label: '% Content', type: 'number' },
                    { key: 'avg_performance_ratio', label: 'Avg Ratio', type: 'number' },
                    { key: 'efficiency_score', label: 'Efficiency', type: 'number' },
                    { key: 'verdict', label: 'Verdict', options: ['SCALE', 'MAINTAIN', 'TEST', 'STOP'] },
                  ]} rows={get('content_dna.performance_by_format') || []} onChange={v => set('content_dna.performance_by_format', v)} />

                  {/* Visual Signature */}
                  <div className="space-y-3">
                    <h4 className="text-xs text-[#ede8dc] font-semibold">Visual Signature</h4>
                    <BriefTextField label="Primary Format" value={get('content_dna.visual_signature.primary_format') || ''} onChange={v => set('content_dna.visual_signature.primary_format', v)} />
                    <BriefTextField label="Camera Quality" value={get('content_dna.visual_signature.camera_quality') || ''} onChange={v => set('content_dna.visual_signature.camera_quality', v)} />
                    <BriefPillEditor label="Visual Motifs" items={get('content_dna.visual_signature.visual_motifs') || []} onChange={v => set('content_dna.visual_signature.visual_motifs', v)} />
                  </div>

                  {/* Top 5 Videos */}
                  <BriefCardList label="Top 5 Videos" items={get('content_dna.top_5_videos') || []} onChange={v => set('content_dna.top_5_videos', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <BriefTextField label="URL" value={item.url || ''} onChange={v => update({ ...item, url: v })} />
                        <div className="grid grid-cols-4 gap-2">
                          <BriefTextField label="Views" value={String(item.views ?? '')} onChange={v => update({ ...item, views: Number(v) || 0 })} type="number" />
                          <BriefTextField label="Perf. Ratio" value={String(item.performance_ratio ?? '')} onChange={v => update({ ...item, performance_ratio: v })} />
                          <BriefTextField label="Share Rate" value={String(item.share_rate ?? '')} onChange={v => update({ ...item, share_rate: v })} />
                          <BriefTextField label="Duration" value={String(item.duration ?? '')} onChange={v => update({ ...item, duration: Number(v) || 0 })} type="number" />
                        </div>
                        <BriefTextField label="Why it worked" value={item.why_it_worked || ''} onChange={v => update({ ...item, why_it_worked: v })} rows={2} />
                      </div>
                    )} />

                  {/* Bottom 5 Videos */}
                  <BriefCardList label="Bottom 5 Videos" items={get('content_dna.bottom_5_videos') || []} onChange={v => set('content_dna.bottom_5_videos', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <BriefTextField label="URL" value={item.url || ''} onChange={v => update({ ...item, url: v })} />
                        <div className="grid grid-cols-3 gap-2">
                          <BriefTextField label="Views" value={String(item.views ?? '')} onChange={v => update({ ...item, views: Number(v) || 0 })} type="number" />
                          <BriefTextField label="Perf. Ratio" value={String(item.performance_ratio ?? '')} onChange={v => update({ ...item, performance_ratio: v })} />
                        </div>
                        <BriefTextField label="Why it failed" value={item.why_it_failed || ''} onChange={v => update({ ...item, why_it_failed: v })} rows={2} />
                      </div>
                    )} />
                </AccordionContent>
              </AccordionItem>

              {/* S5 — Platform Metrics */}
              <AccordionItem value="s5" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Platform Metrics
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                    {/* TikTok */}
                    <div className="bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg p-3 space-y-2">
                      <h4 className="text-xs text-[#ede8dc] font-semibold">TikTok</h4>
                      <BriefTextField label="Handle" value={get('platform_metrics.tiktok.handle') || ''} onChange={v => set('platform_metrics.tiktok.handle', v)} />
                      <BriefTextField label="Followers" value={String(get('platform_metrics.tiktok.followers') ?? '')} onChange={v => set('platform_metrics.tiktok.followers', Number(v) || 0)} type="number" />
                      <BriefTextField label="Avg Views" value={String(get('platform_metrics.tiktok.avg_views') ?? '')} onChange={v => set('platform_metrics.tiktok.avg_views', Number(v) || 0)} type="number" />
                      <BriefTextField label="Engagement Rate" value={get('platform_metrics.tiktok.engagement_rate') || ''} onChange={v => set('platform_metrics.tiktok.engagement_rate', v)} />
                      <BriefTextField label="Share Rate" value={get('platform_metrics.tiktok.share_rate') || ''} onChange={v => set('platform_metrics.tiktok.share_rate', v)} />
                      <BriefTextField label="Original Sound Rate" value={get('platform_metrics.tiktok.original_sound_rate') || ''} onChange={v => set('platform_metrics.tiktok.original_sound_rate', v)} />
                      <BriefTextField label="Posting Frequency" value={get('platform_metrics.tiktok.posting_frequency') || ''} onChange={v => set('platform_metrics.tiktok.posting_frequency', v)} />
                      <BriefTextField label="What Works" value={get('platform_metrics.tiktok.what_works') || ''} onChange={v => set('platform_metrics.tiktok.what_works', v)} rows={2} />
                      <BriefTextField label="What Doesn't Work" value={get('platform_metrics.tiktok.what_doesnt_work') || ''} onChange={v => set('platform_metrics.tiktok.what_doesnt_work', v)} rows={2} />
                    </div>
                    {/* Spotify */}
                    <div className="bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg p-3 space-y-2">
                      <h4 className="text-xs text-[#ede8dc] font-semibold">Spotify</h4>
                      <BriefTextField label="Monthly Listeners" value={get('platform_metrics.spotify.monthly_listeners') || ''} onChange={v => set('platform_metrics.spotify.monthly_listeners', v)} />
                      <BriefTextField label="Followers" value={String(get('platform_metrics.spotify.followers') ?? '')} onChange={v => set('platform_metrics.spotify.followers', Number(v) || 0)} type="number" />
                      <BriefTextField label="Popularity Score" value={String(get('platform_metrics.spotify.popularity_score') ?? '')} onChange={v => set('platform_metrics.spotify.popularity_score', Number(v) || 0)} type="number" />
                    </div>
                    {/* Instagram */}
                    <div className="bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg p-3 space-y-2">
                      <h4 className="text-xs text-[#ede8dc] font-semibold">Instagram</h4>
                      <BriefTextField label="Handle" value={get('platform_metrics.instagram.handle') || ''} onChange={v => set('platform_metrics.instagram.handle', v)} />
                      <BriefTextField label="Followers" value={get('platform_metrics.instagram.followers') || ''} onChange={v => set('platform_metrics.instagram.followers', v)} />
                      <BriefTextField label="Engagement Rate" value={get('platform_metrics.instagram.engagement_rate') || ''} onChange={v => set('platform_metrics.instagram.engagement_rate', v)} />
                      <BriefTextField label="Content Focus" value={get('platform_metrics.instagram.content_focus') || ''} onChange={v => set('platform_metrics.instagram.content_focus', v)} />
                      <BriefTextField label="TikTok vs IG Multiplier" value={get('platform_metrics.instagram.tiktok_vs_ig_multiplier') || ''} onChange={v => set('platform_metrics.instagram.tiktok_vs_ig_multiplier', v)} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* S6 — Streaming Bridge */}
              <AccordionItem value="s6" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Streaming Bridge
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefTextField label="Trajectory" value={get('streaming_bridge.popularity_trajectory') || ''} onChange={v => set('streaming_bridge.popularity_trajectory', v)} rows={2} />
                  <BriefTextField label="Critical Next Threshold" value={get('streaming_bridge.critical_next_threshold') || ''} onChange={v => set('streaming_bridge.critical_next_threshold', v)} rows={2} />
                  <BriefTextField label="TikTok-to-Stream Signals" value={get('streaming_bridge.tiktok_to_stream_signals') || ''} onChange={v => set('streaming_bridge.tiktok_to_stream_signals', v)} rows={2} />
                  <BriefTextField label="Original Sound Strength" value={get('streaming_bridge.original_sound_strength') || ''} onChange={v => set('streaming_bridge.original_sound_strength', v)} rows={2} />
                  <BriefTextField label="Release Campaign Effectiveness" value={get('streaming_bridge.release_campaign_effectiveness') || ''} onChange={v => set('streaming_bridge.release_campaign_effectiveness', v)} rows={2} />
                </AccordionContent>
              </AccordionItem>

              {/* S7 — Competitive Landscape */}
              <AccordionItem value="s7" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Competitive Landscape
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-4">
                  <BriefCardList label="Comparable Artists" items={get('competitive_landscape.comparable_artists') || []} onChange={v => set('competitive_landscape.comparable_artists', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <div className="grid grid-cols-2 gap-2">
                          <BriefTextField label="Name" value={item.name || ''} onChange={v => update({ ...item, name: v })} />
                          <BriefTextField label="Handle" value={item.handle || ''} onChange={v => update({ ...item, handle: v })} />
                        </div>
                        <BriefTextField label="Why Comparable" value={item.why_comparable || ''} onChange={v => update({ ...item, why_comparable: v })} rows={2} />
                        <BriefTextField label="What They Do Well" value={item.what_they_do_well || ''} onChange={v => update({ ...item, what_they_do_well: v })} rows={2} />
                      </div>
                    )} />
                  <BriefCardList label="Whitespace Opportunities" items={get('competitive_landscape.whitespace_opportunities') || []} onChange={v => set('competitive_landscape.whitespace_opportunities', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <BriefTextField label="Opportunity" value={item.opportunity || ''} onChange={v => update({ ...item, opportunity: v })} />
                        <BriefTextField label="Detail" value={item.detail || ''} onChange={v => update({ ...item, detail: v })} rows={2} />
                      </div>
                    )} />
                  <BriefListEditor label="Where Competitors Lead" items={get('competitive_landscape.what_competitors_do_better') || []} onChange={v => set('competitive_landscape.what_competitors_do_better', v)} />
                </AccordionContent>
              </AccordionItem>

              {/* S8 — Quick Wins */}
              <AccordionItem value="s8" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Quick Wins
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-4">
                  <BriefCardList label="Rehook & Repost" items={get('quick_wins.rehook_and_repost') || []} onChange={v => set('quick_wins.rehook_and_repost', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <BriefTextField label="Diagnosis" value={item.diagnosis || ''} onChange={v => update({ ...item, diagnosis: v })} rows={2} />
                        <BriefTextField label="New Hook Suggestion" value={item.new_hook_suggestion || ''} onChange={v => update({ ...item, new_hook_suggestion: v })} rows={2} />
                      </div>
                    )} />
                  <BriefCardList label="Cross-Post Opportunities" items={get('quick_wins.cross_post_opportunities') || []} onChange={v => set('quick_wins.cross_post_opportunities', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">Source Platform</label>
                            <Select value={item.source_platform || ''} onValueChange={v => update({ ...item, source_platform: v })}>
                              <SelectTrigger className="h-8 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc]"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
                                {['tiktok', 'instagram'].map(p => <SelectItem key={p} value={p} className="text-[#ede8dc] text-xs">{p}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <BriefTextField label="Source Views" value={String(item.source_views ?? '')} onChange={v => update({ ...item, source_views: Number(v) || 0 })} type="number" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <BriefTextField label="Source Ratio" value={item.source_ratio || ''} onChange={v => update({ ...item, source_ratio: v })} />
                          <BriefTextField label="Target Platform" value={item.target_platform || ''} onChange={v => update({ ...item, target_platform: v })} />
                        </div>
                        <BriefTextField label="Adaptation Notes" value={item.adaptation_notes || ''} onChange={v => update({ ...item, adaptation_notes: v })} rows={2} />
                      </div>
                    )} />
                  <BriefCardList label="Evergreen Repost Candidates" items={get('quick_wins.evergreen_repost_candidates') || []} onChange={v => set('quick_wins.evergreen_repost_candidates', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <BriefTextField label="Why Repost" value={item.why_repost || ''} onChange={v => update({ ...item, why_repost: v })} rows={2} />
                        <BriefTextField label="Fresh Angle" value={item.fresh_angle || ''} onChange={v => update({ ...item, fresh_angle: v })} rows={2} />
                      </div>
                    )} />
                  <BriefCardList label="Top 5 Immediate Actions" items={get('quick_wins.top_5_immediate_actions') || []} onChange={v => set('quick_wins.top_5_immediate_actions', v)}
                    renderCard={(item, update) => (
                      <div className="space-y-2 pr-6">
                        <BriefTextField label="Action" value={item.action || ''} onChange={v => update({ ...item, action: v })} />
                        <BriefTextField label="Why" value={item.why || ''} onChange={v => update({ ...item, why: v })} rows={2} />
                        <div className="grid grid-cols-3 gap-2">
                          <BriefTextField label="Format" value={item.format || ''} onChange={v => update({ ...item, format: v })} />
                          <BriefTextField label="Platform" value={item.platform || ''} onChange={v => update({ ...item, platform: v })} />
                          <BriefTextField label="Expected Multiplier" value={item.expected_multiplier || ''} onChange={v => update({ ...item, expected_multiplier: v })} />
                        </div>
                      </div>
                    )} />
                </AccordionContent>
              </AccordionItem>

              {/* S9 — Content Recommendations */}
              <AccordionItem value="s9" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Content Recommendations
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefPillEditor label="Content Pillars" items={get('content_recommendations.content_pillars') || []} onChange={v => set('content_recommendations.content_pillars', v)} />
                  <BriefPillEditor label="Formats to Scale" items={get('content_recommendations.formats_to_scale') || []} onChange={v => set('content_recommendations.formats_to_scale', v)} color="green" />
                  <BriefPillEditor label="Formats to Kill" items={get('content_recommendations.formats_to_kill') || []} onChange={v => set('content_recommendations.formats_to_kill', v)} color="red" />
                  <BriefPillEditor label="Avoid" items={get('content_recommendations.avoid') || []} onChange={v => set('content_recommendations.avoid', v)} color="red" />
                  <BriefTextField label="Optimal Posting Strategy" value={get('content_recommendations.optimal_posting_strategy') || ''} onChange={v => set('content_recommendations.optimal_posting_strategy', v)} rows={3} />
                </AccordionContent>
              </AccordionItem>

              {/* S10 — Brand Guardrails */}
              <AccordionItem value="s10" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Brand Guardrails
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefPillEditor label="Tone — Do" items={get('brand_aesthetic_guardrails.tone_do') || []} onChange={v => set('brand_aesthetic_guardrails.tone_do', v)} color="green" />
                  <BriefPillEditor label="Tone — Don't" items={get('brand_aesthetic_guardrails.tone_dont') || []} onChange={v => set('brand_aesthetic_guardrails.tone_dont', v)} color="red" />
                  <BriefPillEditor label="Visual — Do" items={get('brand_aesthetic_guardrails.visual_do') || []} onChange={v => set('brand_aesthetic_guardrails.visual_do', v)} color="green" />
                  <BriefPillEditor label="Visual — Don't" items={get('brand_aesthetic_guardrails.visual_dont') || []} onChange={v => set('brand_aesthetic_guardrails.visual_dont', v)} color="red" />
                  <BriefTextField label="Summary" value={get('brand_aesthetic_guardrails.brand_guardrail_summary') || ''} onChange={v => set('brand_aesthetic_guardrails.brand_guardrail_summary', v)} rows={3} />
                  <BriefTextField label="Fan Expectation Contract" value={get('brand_aesthetic_guardrails.fan_expectation_contract') || ''} onChange={v => set('brand_aesthetic_guardrails.fan_expectation_contract', v)} rows={2} />
                  <BriefTextField label="Coolness Spectrum" value={get('brand_aesthetic_guardrails.coolness_spectrum') || ''} onChange={v => set('brand_aesthetic_guardrails.coolness_spectrum', v)} />
                </AccordionContent>
              </AccordionItem>

              {/* S11 — 90-Day Targets */}
              <AccordionItem value="s11" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  90-Day Targets
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefTextField label="Context" value={get('ninety_day_targets.context') || ''} onChange={v => set('ninety_day_targets.context', v)} rows={2} />
                  <BriefEditableTable label="Metrics" columns={[
                    { key: 'metric', label: 'Metric' },
                    { key: 'current', label: 'Current' },
                    { key: 'target', label: 'Target' },
                    { key: 'rationale', label: 'Rationale', type: 'longtext' },
                  ]} rows={get(ninetyDayMetricsPath) || []} onChange={v => set(ninetyDayMetricsPath, v)} />
                </AccordionContent>
              </AccordionItem>

              {/* S12 — Current Activity */}
              <AccordionItem value="s12" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Current Activity
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <BriefEditableTable label="Recent Press" columns={[
                    { key: 'outlet', label: 'Outlet' },
                    { key: 'topic', label: 'Topic' },
                    { key: 'date', label: 'Date' },
                  ]} rows={get('current_activity.recent_press') || []} onChange={v => set('current_activity.recent_press', v)} />
                  <BriefListEditor label="Personal Milestones" items={get('current_activity.personal_milestones') || []} onChange={v => set('current_activity.personal_milestones', v)} />
                  <BriefListEditor label="Recent Viral Moments" items={get('current_activity.recent_viral_moments') || []} onChange={v => set('current_activity.recent_viral_moments', v)} />
                  <div className="space-y-2">
                    <h4 className="text-xs text-[#ede8dc] font-semibold">Upcoming Tour</h4>
                    <BriefTextField label="Name" value={get('current_activity.upcoming_tour.name') || ''} onChange={v => set('current_activity.upcoming_tour.name', v)} />
                    <BriefTextField label="Dates" value={get('current_activity.upcoming_tour.dates') || ''} onChange={v => set('current_activity.upcoming_tour.dates', v)} />
                    <BriefListEditor label="Key Venues" items={get('current_activity.upcoming_tour.key_venues') || []} onChange={v => set('current_activity.upcoming_tour.key_venues', v)} />
                  </div>
                  <BriefListEditor label="Upcoming Festivals" items={get('current_activity.upcoming_festivals') || []} onChange={v => set('current_activity.upcoming_festivals', v)} />
                </AccordionContent>
              </AccordionItem>

              {/* S13 — Data Confidence */}
              <AccordionItem value="s13" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Data Confidence
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <div>
                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">Data Quality</label>
                    <Select value={get('research_confidence.data_quality') || ''} onValueChange={v => set('research_confidence.data_quality', v)}>
                      <SelectTrigger className="h-8 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
                        {['high', 'medium', 'low'].map(q => <SelectItem key={q} value={q} className="text-[#ede8dc] text-xs">{q}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <BriefTextField label="Videos Analyzed" value={String(get('research_confidence.videos_analyzed') ?? '')} onChange={v => set('research_confidence.videos_analyzed', Number(v) || 0)} type="number" />
                  <BriefListEditor label="Sources Consulted" items={get('research_confidence.sources_consulted') || []} onChange={v => set('research_confidence.sources_consulted', v)} />
                  <BriefListEditor label="Known Gaps" items={get('research_confidence.gaps') || []} onChange={v => set('research_confidence.gaps', v)} />
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#1C1C1E]/95 backdrop-blur border-t border-[#2A2A2E] px-4 py-3 flex items-center gap-3">
        <Button onClick={discardChanges} variant="ghost" className="text-[#a8a29e] text-xs hover:text-[#ede8dc]" disabled={!hasChanges}>
          Discard Changes
        </Button>
        <div className="flex-1" />
        <Button onClick={() => saveBrief(false)} variant="outline" className="text-xs border-[#2A2A2E] text-[#ede8dc] bg-[#1C1C1E] hover:bg-[#2A2A2E]" disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save Brief'}
        </Button>
        <Button onClick={() => saveBrief(true)} className="text-xs bg-amber-600 hover:bg-amber-700 text-white" disabled={saving || !hasChanges}>
          Save & Re-render Brief
        </Button>
      </div>
    </div>
  );
}
