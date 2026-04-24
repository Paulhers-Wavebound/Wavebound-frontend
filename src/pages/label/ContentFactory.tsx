import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Film, Loader2, RefreshCw, Upload, X } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  supabase,
  SUPABASE_URL_RAW,
  SUPABASE_ANON_KEY,
} from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const STORAGE_BUCKET = "content-factory";
const MAX_MP3_BYTES = 10 * 1024 * 1024;
const POLL_INTERVAL_MS = 3000;
const ACTIVE_JOB_STORAGE_KEY = "cf:active_job";
// Don't rehydrate jobs older than this — likely abandoned or already terminal.
const ACTIVE_JOB_MAX_AGE_MS = 30 * 60 * 1000;
// Surface a "this may be stuck" banner once the backend has gone quiet
// while the UI is still non-terminal. 10min > any legitimate pipeline step.
const STALE_BANNER_THRESHOLD_MS = 10 * 60 * 1000;

interface StoredActiveJob {
  jobId: string;
  createdAt: number;
  artistHandle: string;
  refUrl: string;
  transcribeProvider: TranscribeProvider;
}

function loadActiveJob(): StoredActiveJob | null {
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_JOB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActiveJob;
    if (
      !parsed ||
      typeof parsed.jobId !== "string" ||
      typeof parsed.createdAt !== "number" ||
      !isTranscribeProvider(parsed.transcribeProvider)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveActiveJob(job: StoredActiveJob): void {
  try {
    window.sessionStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(job));
  } catch {
    // storage disabled / quota — rehydrate-on-reload just won't work
  }
}

function clearActiveJob(): void {
  try {
    window.sessionStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
  } catch {
    // storage disabled — nothing to clear
  }
}

type JobStatus =
  | "pending"
  | "ingested"
  | "decomposed"
  | "transcribed"
  | "lyrics_fixed"
  | "cast"
  | "rendering"
  | "done"
  | "error";

interface JobStatusResponse {
  status: JobStatus;
  error: string | null;
  final_url: string | null;
  cost_cents: number;
  created_at: string;
  updated_at: string;
  ref_metadata?: Record<string, unknown> | null;
}

const STAGES: { id: JobStatus; label: string }[] = [
  { id: "ingested", label: "Ingested" },
  { id: "decomposed", label: "Decomposed" },
  { id: "transcribed", label: "Transcribed" },
  { id: "lyrics_fixed", label: "Lyrics fixed" },
  { id: "cast", label: "Cast" },
  { id: "rendering", label: "Rendering" },
  { id: "done", label: "Done" },
];

const STAGE_ORDER: Record<JobStatus, number> = {
  pending: -1,
  ingested: 0,
  decomposed: 1,
  transcribed: 2,
  lyrics_fixed: 3,
  cast: 4,
  rendering: 5,
  done: 6,
  error: -1,
};

function isKnownStatus(s: string): s is JobStatus {
  return Object.prototype.hasOwnProperty.call(STAGE_ORDER, s);
}

type TranscribeProvider = "audioshake" | "whisperx";

const TRANSCRIBE_PROVIDER_OPTIONS: {
  value: TranscribeProvider;
  label: string;
}[] = [
  { value: "audioshake", label: "AudioShake — premium (~11¢/clip)" },
  { value: "whisperx", label: "WhisperX — free (self-hosted)" },
];

const DEFAULT_TRANSCRIBE_PROVIDER: TranscribeProvider = "audioshake";

function isTranscribeProvider(v: unknown): v is TranscribeProvider {
  return v === "audioshake" || v === "whisperx";
}

function transcribeProviderStorageKey(userId: string): string {
  return `cf:transcribe_provider:${userId}`;
}

type UiState = "idle" | "uploading" | "polling" | "done" | "error";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "artist"
  );
}

function stripHandle(input: string): string {
  return input.trim().replace(/^@+/, "");
}

function isValidTikTokUrl(raw: string): boolean {
  const v = raw.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    return (
      /(^|\.)tiktok\.com$/i.test(u.hostname) ||
      /(^|\.)vm\.tiktok\.com$/i.test(u.hostname)
    );
  } catch {
    return false;
  }
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function friendlyError(raw: string | null | undefined): string {
  if (!raw) return "Pipeline failed";
  if (raw === "sound_no_play_url") {
    return "This TikTok has no usable audio. Upload an MP3 or pick a different reference clip.";
  }
  if (raw.startsWith("sound_fetch_")) {
    return "Could not download the TikTok's sound. Try again or upload an MP3.";
  }
  if (raw.startsWith("audioshake_") || raw.startsWith("whisperx_")) {
    return `${raw} — try the other provider and re-submit.`;
  }
  return raw;
}

export default function ContentFactory() {
  const { labelId } = useUserProfile();

  const [uiState, setUiState] = useState<UiState>("idle");
  const [refUrl, setRefUrl] = useState("");
  const [artistHandle, setArtistHandle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcribeProvider, setTranscribeProvider] =
    useState<TranscribeProvider>(DEFAULT_TRANSCRIBE_PROVIDER);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;
      try {
        const stored = window.localStorage.getItem(
          transcribeProviderStorageKey(uid),
        );
        if (isTranscribeProvider(stored)) setTranscribeProvider(stored);
      } catch {
        // localStorage disabled — fall back to default
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    try {
      window.localStorage.setItem(
        transcribeProviderStorageKey(userId),
        transcribeProvider,
      );
    } catch {
      // localStorage disabled — skip persistence
    }
  }, [userId, transcribeProvider]);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>("pending");
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [costCents, setCostCents] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [failedStageIdx, setFailedStageIdx] = useState<number | null>(null);
  // Backend's `updated_at` from the most recent poll — used to detect when
  // the pipeline has gone quiet for too long (stale banner below).
  const [backendUpdatedAt, setBackendUpdatedAt] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  // Tracks the last non-terminal status so we can locate which stepper row
  // was in flight when `error` hits (the failed row is the one after it).
  const lastNonTerminalRef = useRef<JobStatus>("pending");

  const clearTimers = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Rehydrate an in-flight job across page reloads. Runs once on mount; the
  // poll loop itself handles 404 / terminal-on-first-poll via the same code
  // path as a freshly submitted job.
  useEffect(() => {
    const saved = loadActiveJob();
    if (!saved) return;
    if (Date.now() - saved.createdAt > ACTIVE_JOB_MAX_AGE_MS) {
      clearActiveJob();
      return;
    }
    setJobId(saved.jobId);
    setArtistHandle(saved.artistHandle);
    setRefUrl(saved.refUrl);
    setTranscribeProvider(saved.transcribeProvider);
    setStartedAt(saved.createdAt);
    setElapsedMs(Date.now() - saved.createdAt);
    setUiState("polling");
    startPolling(saved.jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (startedAt == null) return;
    tickRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 500);
    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [startedAt]);

  const fetchJobStatus = useCallback(
    async (id: string): Promise<JobStatusResponse> => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(
        `${SUPABASE_URL_RAW}/functions/v1/content-factory-status/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Status ${res.status}: ${text}`);
      }
      return (await res.json()) as JobStatusResponse;
    },
    [],
  );

  const startPolling = useCallback(
    (id: string) => {
      const tick = async () => {
        try {
          const data = await fetchJobStatus(id);

          if (!isKnownStatus(data.status)) {
            // Front-end enum drifted from backend — log so the next new status
            // shows up as a real signal instead of a silent stall.
            console.warn(
              `[content-factory] unknown status "${data.status}" — UI is out of date`,
            );
          }

          setJobStatus(data.status);
          setCostCents(data.cost_cents ?? 0);
          setBackendUpdatedAt(data.updated_at);

          const isTerminal = data.status === "done" || data.status === "error";

          if (isTerminal) {
            // Freeze elapsed to the backend-authoritative duration so the UI
            // can't lie if the tick interval somehow keeps running.
            const created = new Date(data.created_at).getTime();
            const updated = new Date(data.updated_at).getTime();
            if (Number.isFinite(created) && Number.isFinite(updated)) {
              setElapsedMs(Math.max(0, updated - created));
            }
          } else if (isKnownStatus(data.status)) {
            lastNonTerminalRef.current = data.status;
          }

          if (data.status === "done") {
            setFinalUrl(data.final_url);
            setUiState("done");
            clearTimers();
            clearActiveJob();
          } else if (data.status === "error") {
            const lastIdx = STAGE_ORDER[lastNonTerminalRef.current] ?? -1;
            // The failed row is the one that was in flight: lastCompleted + 1.
            // Clamp into the stepper range in case the backend reported an
            // error before the first real transition.
            const failedIdx = Math.min(lastIdx + 1, STAGES.length - 1);
            setFailedStageIdx(failedIdx);
            setErrorMsg(friendlyError(data.error));
            setUiState("error");
            clearTimers();
            clearActiveJob();
          }
        } catch (e) {
          // 404 means the job was deleted / never existed — typical after a
          // stale sessionStorage rehydrate. Bail back to the form instead of
          // infinitely spamming the endpoint.
          if (e instanceof Error && /Status 404/.test(e.message)) {
            clearTimers();
            clearActiveJob();
            setUiState("idle");
            setJobId(null);
            setStartedAt(null);
            setElapsedMs(0);
            return;
          }
          console.error("[content-factory] poll error", e);
        }
      };
      void tick();
      pollRef.current = window.setInterval(tick, POLL_INTERVAL_MS);
    },
    [fetchJobStatus, clearTimers],
  );

  const canSubmit = useMemo(() => {
    if (!labelId) return false;
    if (!isValidTikTokUrl(refUrl)) return false;
    if (!stripHandle(artistHandle)) return false;
    return uiState === "idle";
  }, [labelId, refUrl, artistHandle, uiState]);

  const handleFile = (f: File | null) => {
    setErrorMsg(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_MP3_BYTES) {
      setErrorMsg(
        `MP3 is ${(f.size / 1024 / 1024).toFixed(1)} MB — max 10 MB.`,
      );
      setFile(null);
      return;
    }
    if (!/\.mp3$/i.test(f.name) && f.type !== "audio/mpeg") {
      setErrorMsg("File must be an MP3.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const resetAll = () => {
    clearTimers();
    clearActiveJob();
    setUiState("idle");
    setRefUrl("");
    setArtistHandle("");
    setFile(null);
    setErrorMsg(null);
    setJobId(null);
    setJobStatus("pending");
    setFinalUrl(null);
    setCostCents(0);
    setStartedAt(null);
    setElapsedMs(0);
    setFailedStageIdx(null);
    setBackendUpdatedAt(null);
    lastNonTerminalRef.current = "pending";
  };

  const handleSubmit = async () => {
    if (!canSubmit || !labelId) return;
    setErrorMsg(null);
    setUiState("uploading");

    try {
      const handle = stripHandle(artistHandle);

      // Only upload when the operator provided a file; otherwise the backend
      // falls back to the sound attached to the ref TikTok.
      let artistMp3Path: string | undefined;
      if (file) {
        const rand = crypto.randomUUID().slice(0, 8);
        artistMp3Path = `sources/${labelId}/${rand}-${slugify(handle)}.mp3`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(artistMp3Path, file, {
            contentType: "audio/mpeg",
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }

      const { data, error: invokeError } = await supabase.functions.invoke(
        "content-factory-generate",
        {
          body: {
            label_id: labelId,
            artist_handle: handle,
            ref_tiktok_url: refUrl.trim(),
            transcribe_provider: transcribeProvider,
            ...(artistMp3Path ? { artist_mp3_path: artistMp3Path } : {}),
          },
        },
      );
      if (invokeError) throw invokeError;

      const returnedJobId =
        (data as { job_id?: string } | null)?.job_id ?? null;
      if (!returnedJobId) {
        throw new Error("No job_id returned from generate endpoint");
      }

      const now = Date.now();
      setJobId(returnedJobId);
      setJobStatus("pending");
      setStartedAt(now);
      setElapsedMs(0);
      setFailedStageIdx(null);
      setBackendUpdatedAt(null);
      lastNonTerminalRef.current = "pending";
      setUiState("polling");
      saveActiveJob({
        jobId: returnedJobId,
        createdAt: now,
        artistHandle: handle,
        refUrl: refUrl.trim(),
        transcribeProvider,
      });
      startPolling(returnedJobId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setUiState("error");
      toast({
        title: "Generation failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const copyUrl = async () => {
    if (!finalUrl) return;
    try {
      await navigator.clipboard.writeText(finalUrl);
      toast({ title: "URL copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const currentStageIdx = STAGE_ORDER[jobStatus];
  const showForm = uiState === "idle" || uiState === "uploading";
  const showProgress = uiState === "polling" || uiState === "error";
  const showResult = uiState === "done";
  // True when the backend row hasn't moved in STALE_BANNER_THRESHOLD_MS while
  // the UI is still actively polling. Re-evaluates every render, which the
  // 500ms tick interval already drives during a live job.
  const isStale =
    uiState === "polling" &&
    backendUpdatedAt !== null &&
    Date.now() - new Date(backendUpdatedAt).getTime() >
      STALE_BANNER_THRESHOLD_MS;

  return (
    <div
      className="mx-auto px-6 pt-8 pb-20 font-['DM_Sans',sans-serif]"
      style={{ maxWidth: 720 }}
    >
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <Film size={24} color="var(--accent)" className="shrink-0" />
          <h1 className="text-[28px] font-bold" style={{ color: "var(--ink)" }}>
            Content Factory
          </h1>
        </div>
        <p
          className="text-[15px] leading-snug"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Paste a TikTok reference and optionally upload the artist MP3 — skip
          the upload and we'll use the sound from the TikTok. Out comes a 9:16
          MP4 that mirrors the reference's vibe.
        </p>
      </div>

      {!labelId && (
        <div
          className="rounded-2xl p-5 text-[14px]"
          style={{
            background: "var(--surface)",
            color: "var(--ink-secondary)",
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          No label scope found on your profile — contact Paul.
        </div>
      )}

      {labelId && showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: "var(--surface)",
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          <Field label="TikTok reference URL" htmlFor="cf-ref-url">
            <input
              id="cf-ref-url"
              type="url"
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@creator/video/..."
              disabled={uiState !== "idle"}
              className="w-full h-10 px-3 rounded-[10px] text-[14px] outline-none transition-colors"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            />
            {refUrl && !isValidTikTokUrl(refUrl) && (
              <HelpText tone="warn">
                Must be a tiktok.com or vm.tiktok.com URL.
              </HelpText>
            )}
          </Field>

          <Field label="Artist handle" htmlFor="cf-artist-handle">
            <input
              id="cf-artist-handle"
              type="text"
              value={artistHandle}
              onChange={(e) => setArtistHandle(e.target.value)}
              placeholder="e.g. sombr"
              disabled={uiState !== "idle"}
              className="w-full h-10 px-3 rounded-[10px] text-[14px] outline-none transition-colors"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            />
            <HelpText>Free-text — leading @ is stripped.</HelpText>
          </Field>

          <Field label="Artist MP3 (optional, max 10 MB)" htmlFor="cf-mp3">
            <label
              htmlFor="cf-mp3"
              className="flex items-center justify-between gap-3 h-12 px-3 rounded-[10px] cursor-pointer transition-colors"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                color: file ? "var(--ink)" : "var(--ink-tertiary)",
              }}
            >
              <span className="flex items-center gap-2 truncate">
                <Upload size={16} />
                <span className="truncate text-[14px]">
                  {file ? file.name : "Choose MP3 file"}
                </span>
              </span>
              {file && (
                <span
                  className="text-[12px] font-['JetBrains_Mono',monospace] shrink-0"
                  style={{ color: "var(--ink-tertiary)" }}
                >
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
            </label>
            <input
              id="cf-mp3"
              type="file"
              accept="audio/mpeg,.mp3"
              className="hidden"
              disabled={uiState !== "idle"}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <HelpText>
              Skip to use the sound attached to the ref TikTok.
            </HelpText>
          </Field>

          <Field
            label="Transcription provider"
            htmlFor="cf-transcribe-provider"
          >
            <select
              id="cf-transcribe-provider"
              value={transcribeProvider}
              onChange={(e) => {
                const next = e.target.value;
                if (isTranscribeProvider(next)) setTranscribeProvider(next);
              }}
              disabled={uiState !== "idle"}
              className="w-full h-10 px-3 rounded-[10px] text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            >
              {TRANSCRIBE_PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <HelpText>
              AudioShake is higher quality. WhisperX is free but self-hosted;
              pick it for throwaway tests or to save credits.
            </HelpText>
          </Field>

          {errorMsg && (
            <div
              className="rounded-[10px] px-3 py-2 text-[13px]"
              style={{
                background: "var(--red-light, rgba(220,38,38,0.08))",
                color: "var(--red, #dc2626)",
                border: "1px solid var(--red, #dc2626)",
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-10 rounded-[10px] px-4 font-semibold text-[14px] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
            }}
          >
            {uiState === "uploading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading…
              </>
            ) : (
              "Generate"
            )}
          </button>
        </form>
      )}

      {labelId && showProgress && (
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: "var(--surface)",
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "var(--ink-secondary)" }}
              >
                Generating
              </div>
              <div
                className="text-[16px] font-semibold truncate"
                style={{ color: "var(--ink)" }}
              >
                @{stripHandle(artistHandle)}
              </div>
              <a
                href={refUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] truncate block max-w-full"
                style={{ color: "var(--ink-tertiary)" }}
              >
                {refUrl}
              </a>
            </div>
            <div
              className="flex flex-col items-end gap-1 font-['JetBrains_Mono',monospace] shrink-0"
              style={{ color: "var(--ink-secondary)" }}
            >
              <div className="text-[13px]">{formatElapsed(elapsedMs)}</div>
              <div className="text-[12px]">{formatCost(costCents)}</div>
            </div>
          </div>

          {isStale && (
            <div
              className="rounded-[10px] px-3 py-2 text-[13px]"
              style={{
                background: "var(--yellow-light, rgba(234,179,8,0.08))",
                color: "var(--yellow, #b45309)",
                border: "1px solid var(--yellow, #eab308)",
              }}
            >
              This job may be stuck — no backend progress in{" "}
              {Math.floor(STALE_BANNER_THRESHOLD_MS / 60_000)}+ minutes. Check
              the server logs for {jobId ?? "this job"}.
            </div>
          )}

          <Stepper
            currentIdx={currentStageIdx}
            isError={uiState === "error"}
            failedStageIdx={failedStageIdx}
            errorMsg={errorMsg}
          />

          {uiState === "error" && failedStageIdx === null && (
            <div
              className="rounded-[10px] px-3 py-2 text-[13px]"
              style={{
                background: "var(--red-light, rgba(220,38,38,0.08))",
                color: "var(--red, #dc2626)",
                border: "1px solid var(--red, #dc2626)",
              }}
            >
              {errorMsg || "Pipeline failed."}
            </div>
          )}

          {jobId && (
            <div
              className="text-[11px] font-['JetBrains_Mono',monospace]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              job_id: {jobId}
            </div>
          )}

          {uiState === "error" && (
            <button
              type="button"
              onClick={resetAll}
              className="h-10 rounded-[10px] px-4 font-semibold text-[14px] flex items-center justify-center gap-2"
              style={{
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            >
              <RefreshCw size={14} />
              Start over
            </button>
          )}
        </div>
      )}

      {labelId && showResult && finalUrl && (
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: "var(--surface)",
            borderTop: "0.5px solid var(--card-edge)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--ink-secondary)" }}
            >
              Done · {formatElapsed(elapsedMs)} · {formatCost(costCents)}
            </div>
          </div>

          <div
            className="mx-auto rounded-[10px] overflow-hidden"
            style={{
              width: "100%",
              maxWidth: 320,
              aspectRatio: "9 / 16",
              background: "#000",
            }}
          >
            <video
              src={finalUrl}
              controls
              playsInline
              className="w-full h-full"
              style={{ display: "block" }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={resetAll}
              className="h-10 rounded-[10px] px-4 font-semibold text-[14px] flex items-center justify-center gap-2 flex-1"
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
              }}
            >
              <RefreshCw size={14} />
              Generate another
            </button>
            <button
              type="button"
              onClick={copyUrl}
              className="h-10 rounded-[10px] px-4 font-semibold text-[14px] flex items-center justify-center gap-2 flex-1"
              style={{
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            >
              <Copy size={14} />
              Copy URL
            </button>
            <a
              href={finalUrl}
              target="_blank"
              rel="noreferrer"
              className="h-10 rounded-[10px] px-4 font-semibold text-[14px] flex items-center justify-center gap-2 flex-1"
              style={{
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function HelpText({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn";
}) {
  return (
    <span
      className="text-[12px]"
      style={{
        color: tone === "warn" ? "var(--red, #dc2626)" : "var(--ink-tertiary)",
      }}
    >
      {children}
    </span>
  );
}

function Stepper({
  currentIdx,
  isError,
  failedStageIdx,
  errorMsg,
}: {
  currentIdx: number;
  isError: boolean;
  failedStageIdx: number | null;
  errorMsg: string | null;
}) {
  return (
    <ol className="flex flex-col gap-2">
      {STAGES.map((stage, i) => {
        // In error state: do not show green checks anywhere. The failed row
        // gets the red X + the inline error message; every other row is grey.
        // Otherwise: backend status X means "X just completed", so rows with
        // rank <= currentIdx render green and rank currentIdx+1 is in flight.
        const isFailed =
          isError && failedStageIdx !== null && i === failedStageIdx;
        const isPast = !isError && i <= currentIdx;
        const isCurrent = !isError && i === currentIdx + 1;

        let dotBg = "var(--border)";
        let dotColor = "var(--ink-tertiary)";
        let labelColor = "var(--ink-tertiary)";
        let icon: React.ReactNode = (
          <span className="text-[11px] font-['JetBrains_Mono',monospace]">
            {i + 1}
          </span>
        );

        if (isPast) {
          dotBg = "var(--green, #1a8917)";
          dotColor = "#fff";
          labelColor = "var(--ink-secondary)";
          icon = <Check size={12} strokeWidth={3} />;
        } else if (isFailed) {
          dotBg = "var(--red, #dc2626)";
          dotColor = "#fff";
          labelColor = "var(--red, #dc2626)";
          icon = <X size={12} strokeWidth={3} />;
        } else if (isCurrent) {
          dotBg = "var(--accent)";
          dotColor = "#fff";
          labelColor = "var(--ink)";
          icon = <Loader2 size={12} className="animate-spin" />;
        }

        return (
          <li key={stage.id} className="flex items-start gap-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-[1px]"
              style={{ background: dotBg, color: dotColor }}
            >
              {icon}
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className="text-[14px] leading-6"
                style={{
                  color: labelColor,
                  fontWeight: isCurrent || isFailed ? 600 : 500,
                }}
              >
                {stage.label}
              </span>
              {isFailed && errorMsg && (
                <span
                  className="text-[12px] leading-snug"
                  style={{ color: "var(--red, #dc2626)" }}
                >
                  {errorMsg}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
