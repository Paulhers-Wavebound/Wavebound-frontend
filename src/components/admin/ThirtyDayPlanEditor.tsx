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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, Plus, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/* ── Reusable field components ── */

function PlanTextField({ label, value, onChange, rows, mono }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">{label}</label>
      {rows ? (
        <Textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
          className={`text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc] placeholder:text-[#a8a29e]/50 ${mono ? 'font-mono' : ''}`} placeholder="Not available" />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)}
          className={`h-8 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc] placeholder:text-[#a8a29e]/50 ${mono ? 'font-mono' : ''}`} placeholder="Not available" />
      )}
    </div>
  );
}

function PlanListEditor({ label, items, onChange }: {
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

/* ── Play Card ── */
function PlayCard({ play, isHero, onChange }: {
  play: any; isHero: boolean; onChange: (v: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const update = (key: string, val: any) => onChange({ ...play, [key]: val });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg overflow-hidden ${isHero ? 'border-l-[3px] border-l-amber-500' : ''}`}>
        <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#2A2A2E]/30">
          <ChevronDown className={`w-3.5 h-3.5 text-[#a8a29e] transition-transform ${open ? 'rotate-180' : ''}`} />
          <span className="text-xs font-bold text-[#ede8dc] flex-1">{play.title || 'Untitled Play'}</span>
          {play.format && <span className="text-[10px] text-[#a8a29e] bg-[#2A2A2E] px-1.5 py-0.5 rounded">{play.format}</span>}
          {isHero && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] py-0">HERO</Badge>}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2.5 border-t border-[#2A2A2E]">
            <PlanTextField label="Title" value={play.title || ''} onChange={v => update('title', v)} />
            <div className="grid grid-cols-2 gap-2">
              <PlanTextField label="Format" value={play.format || ''} onChange={v => update('format', v)} />
              <div>
                <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">Effort</label>
                <Select value={play.effort || ''} onValueChange={v => update('effort', v)}>
                  <SelectTrigger className="h-8 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
                    <SelectItem value="15 min" className="text-[#ede8dc] text-xs">15 min</SelectItem>
                    <SelectItem value="1 hour" className="text-[#ede8dc] text-xs">1 hour</SelectItem>
                    <SelectItem value="Half-day" className="text-[#ede8dc] text-xs">Half-day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <PlanTextField label="Hook" value={play.hook || ''} onChange={v => update('hook', v)} rows={2} />
            <PlanTextField label="Script" value={play.script || ''} onChange={v => update('script', v)} rows={4} />
            <PlanListEditor label="Shot List" items={play.shot_list || []} onChange={v => update('shot_list', v)} />
            <PlanTextField label="Caption" value={play.caption || ''} onChange={v => update('caption', v)} rows={3} />
            <PlanTextField label="CTA" value={play.cta || ''} onChange={v => update('cta', v)} />
            <PlanTextField label="Why This Play" value={play.why_this_play || ''} onChange={v => update('why_this_play', v)} rows={3} />
            <PlanTextField label="Source" value={play.source || ''} onChange={v => update('source', v)} mono />
            <PlanTextField label="Evidence" value={play.evidence || ''} onChange={v => update('evidence', v)} mono />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ── Main ── */
interface ThirtyDayPlanEditorProps {
  thirtyDayPlan: any;
  thirtyDayPlanHtml: string | null;
  artistHandle: string;
  jobId: string | null;
  onSaved: () => void;
}

export default function ThirtyDayPlanEditor({ thirtyDayPlan, thirtyDayPlanHtml, artistHandle, jobId, onSaved }: ThirtyDayPlanEditorProps) {
  const [doc, setDoc] = useState<any>(() => thirtyDayPlan ? JSON.parse(JSON.stringify(thirtyDayPlan)) : null);
  const originalDoc = useRef<string>(JSON.stringify(thirtyDayPlan));
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(thirtyDayPlanHtml);
  const [previewKey, setPreviewKey] = useState(0);

  // Reset doc only when the JSON plan prop changes (artist switch)
  useEffect(() => {
    if (thirtyDayPlan) {
      setDoc(JSON.parse(JSON.stringify(thirtyDayPlan)));
      originalDoc.current = JSON.stringify(thirtyDayPlan);
    } else {
      setDoc(null);
    }
  }, [thirtyDayPlan]);

  // Update preview separately — don't touch doc
  useEffect(() => {
    setPreviewHtml(thirtyDayPlanHtml);
  }, [thirtyDayPlanHtml]);

  const hasChanges = useMemo(() => {
    if (!doc) return false;
    return JSON.stringify(doc) !== originalDoc.current;
  }, [doc]);

  const get = useCallback((path: string) => {
    if (!doc) return undefined;
    return path.split('.').reduce((o: any, k) => {
      if (o == null) return undefined;
      const idx = parseInt(k);
      return isNaN(idx) ? o[k] : o[idx];
    }, doc);
  }, [doc]);

  const set = useCallback((path: string, value: any) => {
    setDoc((prev: any) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const idx = parseInt(parts[i]);
        const key = isNaN(idx) ? parts[i] : idx;
        if (obj[key] == null) obj[key] = {};
        obj = obj[key];
      }
      const lastKey = parts[parts.length - 1];
      const lastIdx = parseInt(lastKey);
      obj[isNaN(lastIdx) ? lastKey : lastIdx] = value;
      return next;
    });
  }, []);

  const saveDraft = async () => {
    if (!doc || !jobId) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from as any)('deep_research_jobs')
        .update({ thirty_day_plan: doc })
        .eq('id', jobId);
      if (error) throw error;
      originalDoc.current = JSON.stringify(doc);
      toast.success('30-day plan draft saved');
      onSaved();
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message || 'Unknown error'));
    } finally { setSaving(false); }
  };

  const saveAndRerender = async () => {
    await saveDraft();
    setRendering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/trigger-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session?.access_token,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY',
        },
        body: JSON.stringify({ webhook: 'render-thirty-day-plan', payload: { job_id: jobId, artist_handle: artistHandle } }),
      });
      toast.success('Saved & re-rendering 30-day plan…');
      const currentHtml = previewHtml;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const { data } = await (supabase.from as any)('artist_intelligence')
            .select('thirty_day_plan_html')
            .eq('artist_handle', artistHandle)
            .single();
          if (data?.thirty_day_plan_html && data.thirty_day_plan_html !== currentHtml) {
            clearInterval(poll);
            setPreviewHtml(data.thirty_day_plan_html);
            setPreviewKey(k => k + 1);
            setRendering(false);
            onSaved();
            toast.success('30-day plan preview updated');
          } else if (attempts >= 6) {
            clearInterval(poll);
            setRendering(false);
            toast.info('Render may still be in progress — refresh manually if needed');
          }
        } catch {
          clearInterval(poll);
          setRendering(false);
        }
      }, 5000);
    } catch {
      toast.error('Re-render trigger failed');
      setRendering(false);
    }
  };

  const discardChanges = () => {
    if (thirtyDayPlan) setDoc(JSON.parse(JSON.stringify(thirtyDayPlan)));
  };

  if (!thirtyDayPlan || !doc) {
    return <div className="flex items-center justify-center h-64 text-[#a8a29e] text-sm">No 30-day plan generated yet</div>;
  }

  const weeks: any[] = doc.weeks || [];
  const formatPlaybook: any[] = doc.format_playbook || [];
  const snapshot: any[] = doc.current_snapshot || [];

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: iframe preview */}
        <ResizablePanel defaultSize={50} minSize={15} collapsible className="overflow-auto relative">
          {previewHtml ? (
            <iframe key={previewKey} srcDoc={previewHtml} className="w-full h-full bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}
              title="30-Day Plan Preview" sandbox="allow-scripts allow-same-origin" />
          ) : (
            <div className="flex items-center justify-center h-full text-[#a8a29e] text-sm">
              No rendered preview yet — save & re-render to generate
            </div>
          )}
          {rendering && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-white text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Re-rendering 30-day plan…
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

              {/* S1 — The Mission */}
              <AccordionItem value="s1" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  The Mission
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3">
                  <PlanTextField label="Mission Statement" value={doc.mission || ''} onChange={v => set('mission', v)} rows={3} />
                  <div>
                    <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-2">Current Snapshot — {snapshot.length} metrics</label>
                    <div className="grid grid-cols-2 gap-2">
                      {snapshot.map((m: any, i: number) => (
                        <div key={i} className="bg-[#1A1A1C] rounded-lg p-3 space-y-1.5 relative">
                          <button onClick={() => { const arr = [...snapshot]; arr.splice(i, 1); set('current_snapshot', arr); }}
                            className="absolute top-1.5 right-1.5 text-[#a8a29e] hover:text-red-400"><X className="w-3 h-3" /></button>
                          <Input value={m.metric || ''} onChange={e => { const arr = [...snapshot]; arr[i] = { ...arr[i], metric: e.target.value }; set('current_snapshot', arr); }}
                            className="h-6 text-[10px] font-bold bg-transparent border-[#2A2A2E] text-[#ede8dc]" placeholder="Metric" />
                          <Input value={m.value || ''} onChange={e => { const arr = [...snapshot]; arr[i] = { ...arr[i], value: e.target.value }; set('current_snapshot', arr); }}
                            className="h-6 text-xs bg-transparent border-[#2A2A2E] text-amber-400 font-bold" placeholder="Value" />
                          <Textarea value={m.observation || ''} onChange={e => { const arr = [...snapshot]; arr[i] = { ...arr[i], observation: e.target.value }; set('current_snapshot', arr); }}
                            className="min-h-[60px] text-[10px] bg-transparent border-[#2A2A2E] text-[#a8a29e] resize-y" placeholder="Observation" />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => set('current_snapshot', [...snapshot, { metric: '', value: '', observation: '' }])}
                      className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-2"><Plus className="w-3 h-3" /> Add metric</button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* S2 — Week by Week */}
              <AccordionItem value="s2" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Week by Week — {weeks.length} weeks
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-2">
                  {weeks.map((week: any, wi: number) => {
                    const plays: any[] = week.content_plays || [];
                    const heroNum = week.hero_post?.play_number;
                    return (
                      <Accordion key={wi} type="multiple" className="space-y-1">
                        <AccordionItem value={`w${wi}`} className="border-none">
                          <AccordionTrigger className="bg-[#2A2A2E]/60 px-3 py-2 rounded text-xs text-[#ede8dc] font-semibold hover:no-underline">
                            Week {week.number || wi + 1}: {week.theme || 'Untitled'}
                          </AccordionTrigger>
                          <AccordionContent className="pt-3 space-y-3 pl-2">
                            <PlanTextField label="Theme" value={week.theme || ''} onChange={v => set(`weeks.${wi}.theme`, v)} />
                            <PlanTextField label="Why This Theme" value={week.why || ''} onChange={v => set(`weeks.${wi}.why`, v)} rows={2} />
                            <PlanTextField label="Target Metric" value={week.target_metric || ''} onChange={v => set(`weeks.${wi}.target_metric`, v)} />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block mb-1">Hero Post</label>
                                <Select value={String(week.hero_post?.play_number || '')} onValueChange={v => set(`weeks.${wi}.hero_post.play_number`, parseInt(v))}>
                                  <SelectTrigger className="h-8 text-xs bg-[#1C1C1E] border-[#333] text-[#ede8dc]"><SelectValue placeholder="Select play" /></SelectTrigger>
                                  <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
                                    {plays.map((_, pi) => (
                                      <SelectItem key={pi + 1} value={String(pi + 1)} className="text-[#ede8dc] text-xs">Play {pi + 1}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <PlanTextField label="Why Hero" value={week.hero_post?.why_hero || ''} onChange={v => set(`weeks.${wi}.hero_post.why_hero`, v)} rows={2} />
                            </div>

                            <label className="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Content Plays — {plays.length}</label>
                            <div className="space-y-2">
                              {plays.map((play: any, pi: number) => (
                                <PlayCard key={pi} play={play} isHero={heroNum === pi + 1}
                                  onChange={v => {
                                    const arr = [...plays]; arr[pi] = v;
                                    set(`weeks.${wi}.content_plays`, arr);
                                  }} />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>

              {/* S3 — Format Playbook */}
              <AccordionItem value="s3" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Format Playbook — {formatPlaybook.length} formats
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-2">
                  {formatPlaybook.map((fp: any, fi: number) => {
                    const verdictColor = fp.verdict === 'SCALE' ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : fp.verdict === 'STOP' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                    return (
                      <div key={fi} className="bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg p-3 relative">
                        <button onClick={() => { const arr = [...formatPlaybook]; arr.splice(fi, 1); set('format_playbook', arr); }}
                          className="absolute top-2 right-2 text-[#a8a29e] hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                        <div className="flex items-center gap-2 mb-2">
                          <Input defaultValue={fp.format || ''} onBlur={e => { const arr = [...formatPlaybook]; arr[fi] = { ...arr[fi], format: e.target.value }; set('format_playbook', arr); }}
                            className="h-7 text-xs bg-transparent border-[#2A2A2E] text-[#ede8dc] font-bold flex-1" placeholder="Format name" />
                          <Select value={fp.verdict || ''} onValueChange={v => { const arr = [...formatPlaybook]; arr[fi] = { ...arr[fi], verdict: v }; set('format_playbook', arr); }}>
                            <SelectTrigger className={`h-7 w-24 text-[10px] border ${verdictColor} bg-transparent`}><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#1C1C1E] border-[#2A2A2E]">
                              <SelectItem value="SCALE" className="text-green-400 text-xs">SCALE</SelectItem>
                              <SelectItem value="TEST" className="text-amber-400 text-xs">TEST</SelectItem>
                              <SelectItem value="STOP" className="text-red-400 text-xs">STOP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input defaultValue={fp.reason || ''} onBlur={e => { const arr = [...formatPlaybook]; arr[fi] = { ...arr[fi], reason: e.target.value }; set('format_playbook', arr); }}
                          className="h-7 text-[10px] bg-transparent border-[#2A2A2E] text-[#a8a29e]" placeholder="Reason" />
                      </div>
                    );
                  })}
                  <button onClick={() => set('format_playbook', [...formatPlaybook, { format: '', verdict: 'TEST', reason: '' }])}
                    className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"><Plus className="w-3 h-3" /> Add format</button>
                </AccordionContent>
              </AccordionItem>

              {/* S4 — Day 30 Checkpoint */}
              <AccordionItem value="s4" className="border-none">
                <AccordionTrigger className="bg-[#2A2A2E] px-3 py-2 rounded text-sm text-[#ede8dc] font-semibold hover:no-underline">
                  Day 30 Checkpoint
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <PlanTextField label="Checkpoint" value={doc.checkpoint || ''} onChange={v => set('checkpoint', v)} rows={3} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Sticky footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-[#1C1C1E]/95 backdrop-blur border-t border-[#2A2A2E] px-4 py-3 flex items-center gap-3 rounded-b-lg">
        <Button onClick={discardChanges} variant="ghost" className="text-[#a8a29e] text-xs hover:text-[#ede8dc]" disabled={!hasChanges}>
          Discard Changes
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-amber-500">Changes go live immediately when saved</span>
        </div>
        <Button onClick={saveDraft} variant="outline" className="text-xs border-[#2A2A2E] text-[#ede8dc] bg-[#1C1C1E] hover:bg-[#2A2A2E]" disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button onClick={saveAndRerender} className="text-xs bg-amber-600 hover:bg-amber-700 text-white" disabled={saving || rendering}>
          {rendering ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Re-rendering…</> : 'Save & Re-render HTML'}
        </Button>
      </div>
    </div>
  );
}
