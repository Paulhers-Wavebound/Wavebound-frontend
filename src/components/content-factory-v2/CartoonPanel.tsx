import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useLabelArtists } from "@/hooks/useLabelArtists";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import SmoothSelect, { type SmoothSelectOption } from "./SmoothSelect";

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

  const [artistHandle, setArtistHandle] = useState("");
  const [count, setCount] = useState(1);
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subFormat, setSubFormat] = useState<StorySubFormat>("cartoon");

  const selectedVoice =
    VOICE_CATALOG.find((v) => v.id === voiceId) ?? VOICE_CATALOG[0];

  const selectedArtist = labelArtists.find(
    (a) => a.artist_handle === artistHandle,
  );

  const generateDisabled =
    !labelId || !artistHandle || !selectedArtist || isSubmitting;
  const perUnitCost =
    subFormat === "realfootage"
      ? COST_PER_REALFOOTAGE_USD
      : COST_PER_CARTOON_USD;
  const totalCost = count * perUnitCost;

  const handleGenerate = async () => {
    if (generateDisabled || !selectedArtist?.artist_handle) return;
    setIsSubmitting(true);
    try {
      await onGenerate({
        artistName: selectedArtist.artist_name,
        artistHandle: selectedArtist.artist_handle,
        count,
        voiceId: selectedVoice.id,
        voiceSettings: selectedVoice.voice_settings,
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
    <div className="flex flex-col gap-5">
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
            onChange={(e) => setArtistHandle(e.target.value.trim())}
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
            onChange={setArtistHandle}
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

      <Field label="Style">
        <div className="flex gap-1.5">
          {([
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
          ]).map((opt) => {
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

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-[11px]" style={{ color: "var(--ink-tertiary)" }}>
          {!artistHandle
            ? "Pick an artist to continue. The writer chooses the angle from their dossier."
            : `Generates ${count} 60s vertical ${
                subFormat === "realfootage" ? "real-edit" : "cartoon"
              } stor${count === 1 ? "y" : "ies"} for ${
                selectedArtist?.artist_name ?? `@${artistHandle}`
              }. End-to-end runs ~15-20 min — items land in Review.`}
        </div>
        <Button
          type="button"
          variant="cta"
          onClick={handleGenerate}
          disabled={generateDisabled}
          className="px-5 text-[14px]"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isSubmitting ? "Submitting…" : "Generate"}
        </Button>
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
    <div className="flex flex-col gap-1.5 min-w-0">
      <label
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
