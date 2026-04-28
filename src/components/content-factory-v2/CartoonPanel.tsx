import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useLabelArtists } from "@/hooks/useLabelArtists";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { createCartoonLeadHunterJob } from "@/services/cartoonLeadHunterService";
import { useCartoonLeadHunter } from "@/hooks/useCartoonLeadHunter";
import type {
  LeadHunterLead,
  LeadHunterProgress,
  LeadHunterResult,
} from "@/types/cartoonLeadHunter";
import SmoothSelect, { type SmoothSelectOption } from "./SmoothSelect";
import LeadHunterRecentPopover from "./LeadHunterRecentPopover";
import { loadActiveJobId, saveActiveJobId } from "./cartoonLeadHunterStorage";

const COST_PER_CARTOON_USD = 8;
// Real-footage path (yt-dlp clips + ElevenLabs VO + Creatomate) — no
// gpt-image-2 spend, so meaningfully cheaper. Per memory project doc:
// "$1.10 vs $8 per render".
const COST_PER_REALFOOTAGE_USD = 1.1;

export type StorySubFormat = "cartoon" | "realfootage";
// Capped at 1 while ElevenLabs is on the 5-concurrent tier. Each cartoon
// fires 5 parallel TTS requests (RENDER_BATCH_SIZE in cartoon-vo), so N>1
// in parallel exceeds the ceiling and reliably 429s a clip — which marks
// the whole script vo_failed. Lift this back to 10 once ElevenLabs is
// upgraded to Pro (10 concurrent) or RENDER_BATCH_SIZE is lowered.
const MAX_COUNT = 1;

// ElevenLabs voice catalog. Settings tuned per voice — Brian's the locked
// house voice from A/B vs Liam + George; Sarah brings camera-friendly
// influencer energy; George is the deeper-male variant. voice_settings
// here override scriptJson.voice_settings_hint downstream.
export interface VoiceOption {
  id: string;
  label: string;
  description: string;
  voice_settings: {
    stability: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export const VOICE_CATALOG: VoiceOption[] = [
  {
    id: "nPczCjzI2devNBz1zQrb",
    label: "Brian",
    description: "Male · documentary friend (default)",
    voice_settings: { stability: 0.4, style: 0.7, use_speaker_boost: true },
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    label: "Sarah",
    description: "Female · TikTok influencer energy",
    voice_settings: { stability: 0.45, style: 0.65, use_speaker_boost: true },
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    label: "George",
    description: "Male · deeper docu-narrator",
    voice_settings: { stability: 0.5, style: 0.6, use_speaker_boost: true },
  },
];

export const DEFAULT_VOICE_ID = VOICE_CATALOG[0].id;

export interface CartoonGenerateInput {
  artistName: string;
  artistHandle: string;
  count: number;
  voiceId: string;
  voiceSettings: VoiceOption["voice_settings"];
  leadHunterJobId?: string;
  selectedLead: LeadHunterLead;
  // Sub-format under the "Story" preset. cartoon = gpt-image-2 stills + ken-burns
  // zoom; realfootage = RAG-selected real artist clips via yt-dlp. Both use the
  // same script writer + dispatcher (`content-factory-vo-dispatch`).
  subFormat: StorySubFormat;
}

interface CartoonPanelProps {
  onGenerate: (input: CartoonGenerateInput) => Promise<void> | void;
  inFlightCount: number;
}

/**
 * Wizard-only entry point for the Image-Zoom Cartoon pipeline. Picks an
 * artist + count and hands off to the parent (ContentFactoryV2) which owns
 * SSE script generation, the cartoon-vo render call, the Realtime / polling
 * reconciler, and the QueueItem placeholders that surface in Review.
 */
export default function CartoonPanel({
  onGenerate,
  inFlightCount,
}: CartoonPanelProps) {
  const { labelId } = useUserProfile();
  const labelArtistsQuery = useLabelArtists(labelId);
  const labelArtists = (labelArtistsQuery.data ?? []).filter(
    (a) => !!a.artist_handle,
  );

  const queryClient = useQueryClient();

  const [artistHandle, setArtistHandle] = useState("");
  const [count, setCount] = useState(1);
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subFormat, setSubFormat] = useState<StorySubFormat>("cartoon");
  // Active job id only — status/progress/result come from React Query, so they
  // survive CartoonPanel unmount on tab switch (the cache outlives the
  // component). localStorage carries the active id across hard refreshes.
  const [leadHunterJobId, setLeadHunterJobId] = useState<string | undefined>();
  const [isStartingLeadHunt, setIsStartingLeadHunt] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  // Errors raised by the create/start call (network, 4xx). Job-level failures
  // surface via leadHunterQuery.data.error_message instead.
  const [startError, setStartError] = useState<string | null>(null);

  const leadHunterQuery = useCartoonLeadHunter(leadHunterJobId);
  const leadHunterStatus = leadHunterQuery.data?.status ?? null;
  const leadHunterProgress: LeadHunterProgress =
    leadHunterQuery.data?.progress ?? {};
  const leadHunterResult: LeadHunterResult | null =
    leadHunterQuery.data?.result_json ?? null;
  const leadHunterError =
    startError ??
    (leadHunterQuery.error instanceof Error
      ? leadHunterQuery.error.message
      : null) ??
    leadHunterQuery.data?.error_message ??
    null;

  const selectedVoice =
    VOICE_CATALOG.find((v) => v.id === voiceId) ?? VOICE_CATALOG[0];

  const selectedArtist = labelArtists.find(
    (a) => a.artist_handle === artistHandle,
  );

  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return (
      leadHunterResult?.leads.find((lead) => lead.lead_id === selectedLeadId) ??
      null
    );
  }, [leadHunterResult?.leads, selectedLeadId]);

  const recommendedLeadIds = useMemo(
    () =>
      new Set(
        leadHunterResult?.top_3_recommended_for_angle_board.map(
          (rec) => rec.lead_id,
        ) ?? [],
      ),
    [leadHunterResult?.top_3_recommended_for_angle_board],
  );

  const leadHunterRunning =
    isStartingLeadHunt ||
    leadHunterStatus === "pending" ||
    leadHunterStatus === "running";

  const generateDisabled =
    !labelId ||
    !artistHandle ||
    !selectedArtist ||
    !selectedLead ||
    isSubmitting ||
    leadHunterRunning;
  const perUnitCost =
    subFormat === "realfootage"
      ? COST_PER_REALFOOTAGE_USD
      : COST_PER_CARTOON_USD;
  const totalCost = count * perUnitCost;

  const handleGenerate = async () => {
    if (generateDisabled || !selectedArtist?.artist_handle || !selectedLead)
      return;
    setIsSubmitting(true);
    try {
      await onGenerate({
        artistName: selectedArtist.artist_name,
        artistHandle: selectedArtist.artist_handle,
        count,
        voiceId: selectedVoice.id,
        voiceSettings: selectedVoice.voice_settings,
        leadHunterJobId,
        selectedLead,
        subFormat,
      });
    } catch (err) {
      toast({
        title: "Submit failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArtistChange = (nextHandle: string) => {
    setArtistHandle(nextHandle);
    // Clear panel-local picks; the hydrate effect below will reload an
    // existing run for the new artist (if any) from localStorage.
    setSelectedLeadId(null);
    setStartError(null);
  };

  const handleStartLeadHunt = async () => {
    if (!selectedArtist?.artist_name || !selectedArtist.artist_handle) return;
    setIsStartingLeadHunt(true);
    setStartError(null);
    setSelectedLeadId(null);
    // Drop the previous job from view immediately so "Run again" doesn't show
    // stale leads while the new hunt warms up. The old jobId stays in React
    // Query's cache (terminal status, GC'd eventually) but no UI subscribes
    // to it after this point.
    setLeadHunterJobId(undefined);
    try {
      const created = await createCartoonLeadHunterJob({
        artist_name: selectedArtist.artist_name,
        artist_handle: selectedArtist.artist_handle,
      });
      saveActiveJobId(labelId, selectedArtist.artist_handle, created.job_id);
      setLeadHunterJobId(created.job_id);
      toast({
        title: "Lead Hunt started",
        description: `Finding story options for ${selectedArtist.artist_name}.`,
      });
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Lead Hunter failed to start",
      );
      toast({
        title: "Lead Hunt failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setIsStartingLeadHunt(false);
    }
  };

  // Hydrate the active jobId from localStorage whenever the (labelId,
  // artistHandle) pair changes. Picking an artist that has a previous run
  // restores its leads instantly; picking one with no prior run clears the
  // panel. This is also what makes results "survive" tab switches: when
  // CartoonPanel remounts after the AnimatePresence wrapper unmounts it,
  // this effect re-reads the active id and the React Query cache returns
  // the cached result_json with no flicker.
  useEffect(() => {
    if (!labelId || !artistHandle) {
      setLeadHunterJobId(undefined);
      return;
    }
    const stored = loadActiveJobId(labelId, artistHandle);
    setLeadHunterJobId(stored);
    setSelectedLeadId(null);
    setStartError(null);
  }, [labelId, artistHandle]);

  // Auto-select the top recommended lead the first time a result lands.
  // Mirrors the previous in-poll selection, but driven by the React Query
  // data flow instead.
  useEffect(() => {
    if (!leadHunterResult || selectedLeadId) return;
    const preferred =
      leadHunterResult.top_3_recommended_for_angle_board[0]?.lead_id ??
      leadHunterResult.leads[0]?.lead_id;
    if (preferred) setSelectedLeadId(preferred);
  }, [leadHunterResult, selectedLeadId]);

  // When a hunt finishes (complete or failed), refresh the recent-runs list
  // so the popover shows the just-completed run without waiting 30s for
  // staleTime to expire.
  useEffect(() => {
    if (leadHunterStatus === "complete" || leadHunterStatus === "failed") {
      queryClient.invalidateQueries({
        queryKey: ["cartoon-lead-hunter-recent"],
      });
    }
  }, [leadHunterStatus, queryClient]);

  // Loading a past run from the recent picker. May switch the artist if the
  // selected run belongs to a different one. Writes the chosen jobId to
  // localStorage so the hydrate effect (which fires after setArtistHandle)
  // reads the same value back.
  const handleSelectRecent = (
    jobId: string,
    handle: string | null,
    name: string | null,
  ) => {
    if (!labelId) return;
    const targetHandle = handle ?? artistHandle;
    if (!targetHandle) return;
    saveActiveJobId(labelId, targetHandle, jobId);
    if (handle && handle !== artistHandle) {
      setArtistHandle(handle);
      // The hydrate effect will run on the new handle and pick up the jobId
      // we just wrote. setSelectedLeadId/setStartError get cleared there.
    } else {
      // Same artist — set jobId directly and pre-seed the cache hit.
      setLeadHunterJobId(jobId);
      setSelectedLeadId(null);
      setStartError(null);
    }
    if (name) {
      toast({
        title: "Story arc loaded",
        description: `Restored Lead Hunter run for ${name}.`,
      });
    }
  };

  if (!labelId) {
    return (
      <div
        className="rounded-[10px] px-3 py-3 text-[12px]"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          color: "var(--ink-tertiary)",
        }}
      >
        Story generation requires a logged-in label session.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-[140px]">
      <Field label="Artist">
        {labelArtistsQuery.isLoading ? (
          <div
            className="rounded-[10px] px-3 py-2 text-[12px] flex items-center gap-2"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              color: "var(--ink-tertiary)",
            }}
          >
            <Loader2 size={12} className="animate-spin" />
            Loading roster…
          </div>
        ) : labelArtistsQuery.isError ? (
          <input
            type="text"
            value={artistHandle}
            onChange={(e) => handleArtistChange(e.target.value.trim())}
            placeholder="@handle (roster fetch failed — type manually)"
            className="w-full h-10 px-3 rounded-[10px] text-[13px] outline-none"
            style={{
              background: "var(--bg-subtle)",
              color: "var(--ink)",
              border: "1px solid var(--border)",
            }}
          />
        ) : labelArtists.length === 0 ? (
          <div
            className="rounded-[10px] px-3 py-2 text-[12px]"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              color: "var(--ink-tertiary)",
            }}
          >
            No artists in roster — see /label/admin to onboard.
          </div>
        ) : (
          <SmoothSelect
            value={artistHandle}
            onChange={handleArtistChange}
            placeholder="Pick an artist"
            searchPlaceholder="Search roster…"
            options={labelArtists.map<SmoothSelectOption>((a) => ({
              value: a.artist_handle ?? "",
              primary: a.artist_name,
              secondary: a.artist_handle ? `@${a.artist_handle}` : undefined,
              leading: {
                avatarUrl: a.avatar_url,
                node: initialsFor(a.artist_name),
              },
            }))}
          />
        )}
      </Field>

      <Field label="Story lead">
        <div
          className="rounded-[10px] px-3 py-3"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-[13px] font-semibold"
                style={{ color: "var(--ink)" }}
              >
                Lead Hunter
              </div>
              <div
                className="text-[11px] mt-0.5 leading-snug"
                style={{ color: "var(--ink-tertiary)" }}
              >
                Finds story options first, so rendering only starts after you
                choose the angle.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {labelId && (
                <LeadHunterRecentPopover
                  labelId={labelId}
                  currentArtistHandle={artistHandle || null}
                  onSelect={handleSelectRecent}
                />
              )}
              <button
                type="button"
                onClick={handleStartLeadHunt}
                disabled={!selectedArtist || leadHunterRunning}
                className="h-10 px-4 rounded-[10px] inline-flex items-center gap-2 shrink-0 disabled:opacity-45 disabled:cursor-not-allowed transition-shadow"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-on)",
                  fontFamily: "var(--display-font)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled)
                    e.currentTarget.style.boxShadow =
                      "0 0 24px var(--accent-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {leadHunterRunning ? (
                  <span
                    className="inline-block w-2 h-2 rounded-full higgs-orb-running"
                    style={{ background: "var(--accent-on)", opacity: 0.85 }}
                  />
                ) : (
                  <Search size={14} />
                )}
                {leadHunterResult ? "Run again" : "Find leads"}
              </button>
            </div>
          </div>

          {!selectedArtist && (
            <div
              className="mt-3 text-[11px]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              Pick an artist before hunting for story leads.
            </div>
          )}

          {(leadHunterStatus === "pending" ||
            leadHunterStatus === "running") && (
            <LeadHunterProgressPanel progress={leadHunterProgress} />
          )}

          {leadHunterError && (
            <div
              className="mt-3 rounded-[9px] px-3 py-2 text-[11px] flex gap-2"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.26)",
                color: "#fca5a5",
              }}
            >
              <AlertTriangle size={13} className="mt-[1px] shrink-0" />
              <span>{leadHunterError}</span>
            </div>
          )}

          {leadHunterResult && leadHunterResult.leads.length > 0 && (
            <LeadHunterBoard
              result={leadHunterResult}
              selectedLeadId={selectedLeadId}
              recommendedLeadIds={recommendedLeadIds}
              onSelect={setSelectedLeadId}
            />
          )}
        </div>
      </Field>

      <Field label="Style">
        <div className="flex gap-1.5">
          {[
            {
              k: "cartoon" as StorySubFormat,
              label: "Cartoon",
              hint: "AI stills + ken-burns zoom",
            },
            {
              k: "realfootage" as StorySubFormat,
              label: "Real edit",
              hint: "Real artist clips via RAG",
            },
          ].map((opt) => {
            const active = opt.k === subFormat;
            return (
              <button
                key={opt.k}
                type="button"
                onClick={() => setSubFormat(opt.k)}
                className="flex-1 px-3 h-10 rounded-[10px] text-[13px] font-medium text-left flex flex-col justify-center"
                style={{
                  background: active
                    ? "var(--accent-light)"
                    : "var(--bg-subtle)",
                  color: active ? "var(--accent)" : "var(--ink-secondary)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <span className="leading-tight">{opt.label}</span>
                <span
                  className="text-[10px] leading-tight mt-0.5"
                  style={{
                    color: active ? "var(--accent)" : "var(--ink-tertiary)",
                  }}
                >
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="text-[11px] mt-1.5"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {subFormat === "realfootage"
            ? "Real edit pulls clips from the artist's asset library (music videos, podcasts, interviews) with Brian narrating over a muted source."
            : "Cartoon generates AI stills with a ken-burns zoom — same script, more stylized look."}
        </div>
      </Field>

      <Field label="Voice">
        <SmoothSelect
          value={voiceId}
          onChange={setVoiceId}
          options={VOICE_CATALOG.map<SmoothSelectOption>((v) => ({
            value: v.id,
            primary: v.label,
            secondary: v.description,
            leading: { node: v.label.charAt(0) },
          }))}
        />
        <div
          className="text-[11px] mt-1.5"
          style={{ color: "var(--ink-tertiary)" }}
        >
          ElevenLabs v3 voice for the narrator. Brian = current house voice.
        </div>
      </Field>

      <Field label={`Count — ${count} ${count === 1 ? "story" : "stories"}`}>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: MAX_COUNT }, (_, i) => i + 1).map((n) => {
            const active = n === count;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className="px-3 h-9 rounded-[10px] text-[13px] font-semibold tabular-nums"
                style={{
                  background: active
                    ? "var(--accent-light)"
                    : "var(--bg-subtle)",
                  color: active ? "var(--accent)" : "var(--ink-secondary)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  fontFamily: '"JetBrains Mono", monospace',
                  minWidth: 36,
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div
          className="text-[11px] mt-2"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Cost preview · ~${perUnitCost.toFixed(perUnitCost < 2 ? 2 : 0)} per
          story × {count} ={" "}
          <span
            className="font-semibold"
            style={{ color: "var(--ink-secondary)" }}
          >
            ~${totalCost.toFixed(totalCost < 2 ? 2 : 0)}
          </span>{" "}
          ·{" "}
          {subFormat === "realfootage"
            ? "Opus + ElevenLabs v3 + yt-dlp clips + Creatomate."
            : "Opus + ElevenLabs v3 + gpt-image-2 + Creatomate."}
          <div className="mt-1" style={{ color: "var(--ink-tertiary)" }}>
            Single story per run while we're on the ElevenLabs 5-concurrent
            tier. Parallel runs collide on TTS rate limits.
          </div>
        </div>
      </Field>

      {inFlightCount > 0 && (
        <div
          className="rounded-[10px] px-3 py-2 text-[12px] flex items-center gap-2"
          style={{
            background: "var(--accent-light)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
          }}
        >
          <Loader2 size={12} className="animate-spin" />
          {inFlightCount} stor{inFlightCount === 1 ? "y" : "ies"} in flight —
          watch the timeline in Review. You can queue more right now.
        </div>
      )}

      {/* Sticky-bottom prompt dock — Higgsfield-style fixed command bar that
        keeps the Generate CTA always reachable while the user scrolls through
        artist / preset / voice / leads above. The 5%-accent perimeter mirrors
        higgsfield.ai's image-form border. Outer 2px frame in page-bg-with-haze
        gives the dock a "floats above" feel without a hard shadow. */}
      <div className="sticky bottom-4 z-30 -mx-1">
        <div
          className="p-0.5 rounded-[26px]"
          style={{ background: "rgba(15, 17, 19, 0.96)" }}
        >
          <div
            className="rounded-3xl border p-4 sm:p-[18px] flex items-center justify-between gap-4"
            style={{
              borderColor: "var(--accent-hairline)",
              background: "var(--surface)",
            }}
          >
            <div
              className="text-[12px] flex-1 min-w-0"
              style={{ color: "var(--ink-secondary)" }}
            >
              {!artistHandle
                ? "Pick an artist to continue."
                : !selectedLead
                  ? "Run Lead Hunter and pick one story before spending a render."
                  : `Generates ${count} 60s vertical ${
                      subFormat === "realfootage" ? "real-edit" : "cartoon"
                    } stor${count === 1 ? "y" : "ies"} for ${
                      selectedArtist?.artist_name ?? `@${artistHandle}`
                    } from “${selectedLead.working_title}”. End-to-end runs ~15-20 min — items land in Review.`}
            </div>
            <Button
              type="button"
              variant="cta"
              onClick={handleGenerate}
              disabled={generateDisabled}
              className="h-[64px] min-w-[160px] px-5 text-[14px] shrink-0"
              style={{
                fontFamily: "var(--display-font)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.boxShadow =
                    "0 0 32px var(--accent-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Submitting…" : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Two-letter initials for the avatar fallback when avatar_url is missing
// or 404s. "Addison Rae Easterling" → "AE", "El Papi" → "EP".
function initialsFor(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label
        style={{
          fontFamily: "var(--display-font)",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--ink-tertiary)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function LeadHunterProgressPanel({
  progress,
}: {
  progress: LeadHunterProgress;
}) {
  const toolCounts = progress.tool_call_counts ?? {};
  return (
    <div
      className="mt-4 rounded-[12px] px-4 py-3.5"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0 higgs-orb-running"
            style={{ background: "var(--accent)" }}
          />
          <span
            className="truncate"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              color: "var(--ink-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            lead-hunter · {phaseLabel(progress.phase).toLowerCase()}
          </span>
        </div>
        <span
          className="px-2 h-6 inline-flex items-center rounded-full tabular-nums shrink-0"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0,
          }}
        >
          {progress.elapsed_seconds ? `${progress.elapsed_seconds}s` : "queued"}
        </span>
      </div>
      <div className="higgs-thinking-bar mb-3" />
      <div className="grid grid-cols-3 gap-3">
        <ProgressStat label="Leads" value={String(progress.leads_found ?? 0)} />
        <ProgressStat label="Web" value={`${toolCounts.web_search ?? 0}/10`} />
        <ProgressStat
          label="Dossier"
          value={String(toolCounts.search_artist ?? 0)}
        />
      </div>
      {progress.current_focus && (
        <div
          className="mt-3 text-[11px] truncate"
          style={{
            color: "var(--ink-tertiary)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          → {progress.current_focus}
        </div>
      )}
    </div>
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--display-font)",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--ink-tertiary)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        className="text-[14px] tabular-nums"
        style={{
          color: "var(--ink)",
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 500,
          letterSpacing: 0,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LeadHunterBoard({
  result,
  selectedLeadId,
  recommendedLeadIds,
  onSelect,
}: {
  result: LeadHunterResult;
  selectedLeadId: string | null;
  recommendedLeadIds: Set<string>;
  onSelect: (leadId: string) => void;
}) {
  return (
    <div className="mt-3">
      <div
        className="text-[11px] leading-snug mb-2"
        style={{ color: "var(--ink-tertiary)" }}
      >
        {result.lead_hunter_summary}
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {result.leads.map((lead) => (
          <LeadCard
            key={lead.lead_id}
            lead={lead}
            selected={lead.lead_id === selectedLeadId}
            recommended={recommendedLeadIds.has(lead.lead_id)}
            onSelect={() => onSelect(lead.lead_id)}
          />
        ))}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  selected,
  recommended,
  onSelect,
}: {
  lead: LeadHunterLead;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
}) {
  const score = lead.scores?.overall_promise ?? 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left rounded-[14px] px-4 py-4 transition-all min-h-[170px] group hover:-translate-y-0.5"
      style={{
        background: selected ? "var(--accent-soft)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        color: "var(--ink)",
        boxShadow: selected
          ? "0 0 0 1px var(--accent), 0 0 24px var(--accent-glow)"
          : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="line-clamp-2"
            style={{
              fontFamily: "var(--display-font)",
              fontSize: 16,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              lineHeight: 1.15,
              color: selected ? "var(--accent)" : "var(--ink)",
            }}
          >
            {lead.working_title}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {recommended && (
              <LeadPill
                icon={<Sparkles size={10} />}
                label="Top pick"
                selected={selected}
              />
            )}
            <LeadPill
              label={formatTension(lead.tension_source)}
              selected={selected}
            />
          </div>
        </div>
        <div
          className="h-7 min-w-7 px-1.5 rounded-[8px] text-[12px] font-bold tabular-nums inline-flex items-center justify-center shrink-0"
          style={{
            background: selected
              ? "rgba(232, 67, 10, 0.16)"
              : "rgba(255, 255, 255, 0.04)",
            color: selected ? "var(--accent)" : scoreColor(score),
            border: `1px solid ${selected ? "rgba(232, 67, 10, 0.32)" : "rgba(255, 255, 255, 0.08)"}`,
            fontFamily: '"JetBrains Mono", monospace',
          }}
          aria-label={`Overall promise ${score} out of 5`}
        >
          {score}
        </div>
      </div>

      <p
        className="mt-2 text-[11.5px] leading-snug line-clamp-3"
        style={{ color: selected ? "var(--accent)" : "var(--ink-secondary)" }}
      >
        {lead.one_sentence_angle}
      </p>
      <p
        className="mt-2 text-[10.5px] leading-snug line-clamp-2"
        style={{ color: selected ? "var(--accent)" : "var(--ink-tertiary)" }}
      >
        {lead.why_fans_would_care}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className="text-[10px]"
          style={{ color: selected ? "var(--accent)" : "var(--ink-tertiary)" }}
        >
          {(lead.source_breadcrumbs ?? []).length} sources ·{" "}
          {(lead.verification_questions ?? []).length} checks
        </span>
        {selected && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: "var(--accent)" }}
          >
            <CheckCircle2 size={11} />
            Selected
          </span>
        )}
      </div>

      {lead.risk_notes && lead.risk_notes.toLowerCase() !== "low risk" && (
        <div
          className="mt-2 flex gap-1.5 text-[10px] leading-snug"
          style={{ color: selected ? "var(--accent)" : "#f6b36d" }}
        >
          <AlertTriangle size={11} className="mt-[1px] shrink-0" />
          <span className="line-clamp-2">{lead.risk_notes}</span>
        </div>
      )}
    </button>
  );
}

function LeadPill({
  icon,
  label,
  selected,
}: {
  icon?: React.ReactNode;
  label: string;
  selected: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[7px] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
      style={{
        background: selected
          ? "rgba(232, 67, 10, 0.14)"
          : "rgba(255, 255, 255, 0.045)",
        color: selected ? "var(--accent)" : "var(--ink-tertiary)",
        border: `1px solid ${selected ? "rgba(232, 67, 10, 0.24)" : "rgba(255, 255, 255, 0.06)"}`,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function phaseLabel(phase?: string): string {
  switch (phase) {
    case "fetching_dossier":
      return "Reading dossier";
    case "researching_web":
      return "Checking sources";
    case "drafting_leads":
      return "Drafting lead board";
    case "finalizing":
      return "Finalizing";
    default:
      return "Waiting for worker";
  }
}

function formatTension(source: string): string {
  return source.replace(/_/g, " ");
}

function scoreColor(score: number): string {
  if (score >= 5) return "#f6b36d";
  if (score >= 4) return "var(--ink-secondary)";
  return "var(--ink-tertiary)";
}
