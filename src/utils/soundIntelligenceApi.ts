import { supabase } from "@/integrations/supabase/client";
import type {
  SoundMonitoring,
  SoundAlert,
  MonitoringSnapshot,
  MonitoringHistorySummary,
  SoundSubscription,
  SoundComparisonResponse,
} from "@/types/soundIntelligence";

const BASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY";

async function getAuthHeaders() {
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession();
  const token = session?.access_token;
  if (!token || error) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    apikey: ANON_KEY,
    "Content-Type": "application/json",
  };
}

/** Extract the numeric sound_id from a TikTok music URL */
export function extractSoundId(input: string): string | null {
  // /music/Track-Name-1234567890 (standard)
  const named = input.match(/\/music\/[^/]+-(\d+)/);
  if (named) return named[1];
  // /music/1234567890 (no track name, just digits)
  const bare = input.match(/\/music\/(\d+)/);
  if (bare) return bare[1];
  return null;
}

/** Check if a URL is a valid TikTok music URL we can parse */
export function validateSoundUrl(input: string): {
  valid: boolean;
  reason?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false };

  // Shortened URLs we can't resolve client-side
  if (/tiktok\.com\/t\//.test(trimmed) || /vm\.tiktok\.com/.test(trimmed)) {
    return {
      valid: false,
      reason:
        "Shortened URLs are not supported. Please paste the full TikTok sound URL (contains /music/ in the path).",
    };
  }

  // Must be a tiktok.com URL
  if (!/(tiktok\.com)/.test(trimmed)) {
    return {
      valid: false,
      reason: "Please paste a TikTok sound URL (e.g. tiktok.com/music/...)",
    };
  }

  // Must contain /music/ path
  if (!trimmed.includes("/music/")) {
    return {
      valid: false,
      reason:
        "This doesn't look like a sound URL. Look for a link containing /music/ in the path.",
    };
  }

  // Must have extractable sound ID
  if (!extractSoundId(trimmed)) {
    return {
      valid: false,
      reason:
        "Could not extract sound ID from this URL. Make sure it ends with a number (e.g. /music/Song-Name-1234567890).",
    };
  }

  return { valid: true };
}

export async function cancelSoundAnalysis(jobId: string) {
  const { error } = await supabase
    .from("sound_intelligence_jobs")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) throw new Error(error.message || "Cancel failed");
}

export async function retrySoundAnalysis(jobId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/retry-sound-analysis`, {
    method: "POST",
    headers,
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Retry failed" }));
    throw new Error(err.error || "Retry failed");
  }
  return res.json() as Promise<{
    success: boolean;
    job_id: string;
    retried_stage: string;
  }>;
}

export async function triggerSoundAnalysis(
  soundUrl: string,
  labelId: string | null,
) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/trigger-sound-analysis`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sound_url: soundUrl, label_id: labelId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json() as Promise<{
    success: boolean;
    job_id: string;
    cached: boolean;
  }>;
}

export async function getSoundAnalysis(params: {
  job_id?: string;
  sound_id?: string;
  label_id?: string;
}) {
  const query = new URLSearchParams();
  if (params.job_id) query.set("job_id", params.job_id);
  if (params.sound_id) query.set("sound_id", params.sound_id);
  if (params.label_id) query.set("label_id", params.label_id);

  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/get-sound-analysis?${query}`, {
    headers,
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json() as Promise<GetSoundAnalysisResponse>;
}

export interface GetSoundAnalysisResponse {
  status: string;
  job_id: string;
  sound_id: string;
  track_name: string;
  artist_name: string;
  user_count?: number;
  completed_at?: string;
  last_refresh_at?: string | null;
  refresh_count?: number;
  monitoring?: SoundMonitoring | null;
  progress?: { videos_scraped: number; videos_analyzed: number };
  analysis?: import("@/types/soundIntelligence").SoundAnalysis;
  // When the response IS the full analysis (formats/velocity at top level)
  formats?: unknown;
  velocity?: unknown;
  [key: string]: unknown;
}

export const PROCESSING_STATUSES = [
  "pending",
  "scraping",
  "classifying",
  "synthesizing",
  "refreshing",
] as const;

export const JOB_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "#8E8E93" },
  scraping: { label: "Analysing...", color: "#FF9F0A" },
  classifying: { label: "Classifying...", color: "#0A84FF" },
  synthesizing: { label: "Synthesizing...", color: "#30D158" },
  refreshing: { label: "Refreshing...", color: "#0A84FF" },
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "Preparing analysis...",
  scraping: "Analysing...",
  classifying: "Classifying content...",
  synthesizing: "Synthesizing insights...",
  refreshing: "Refreshing analysis...",
};

export interface ListAnalysisEntry {
  job_id: string;
  sound_id: string;
  cover_url?: string | null;
  track_name: string;
  artist_name: string;
  album_name: string;
  status:
    | "pending"
    | "scraping"
    | "classifying"
    | "synthesizing"
    | "refreshing"
    | "completed"
    | "failed";
  videos_scraped: number;
  videos_analyzed: number;
  created_at: string;
  completed_at: string | null;
  last_refresh_at: string | null;
  refresh_count: number;
  monitoring: SoundMonitoring | null;
  summary: {
    engagement_rate: number;
    share_rate?: number;
    winner_format: string;
    winner_multiplier: number;
    total_views: number;
    velocity_status: string;
    peak_day: string;
    format_count: number;
    videos_analyzed: number;
  } | null;
  artist_handle: string | null;
  source: "manual" | "auto_discovery";
  tracking_expires_at: string | null;
}

export async function listSoundAnalyses(
  labelId: string,
  filters?: { source?: string; artist_handle?: string },
): Promise<ListAnalysisEntry[]> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ label_id: labelId });
  if (filters?.source) params.set("source", filters.source);
  if (filters?.artist_handle)
    params.set("artist_handle", filters.artist_handle);
  const res = await fetch(
    `${BASE_URL}/list-sound-analyses?${params.toString()}`,
    { headers },
  );
  if (!res.ok) throw new Error("Failed to list analyses");
  const data = await res.json();
  return data.analyses || [];
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  if (seconds < 604800) return Math.floor(seconds / 86400) + "d ago";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000)
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(0) + "K";
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

// --- Sound Subscriptions API ---

export async function subscribeSound(
  jobId: string,
  opts?: { is_own_sound?: boolean; notes?: string },
): Promise<{
  subscription: {
    id: string;
    job_id: string;
    is_own_sound: boolean;
    created_at: string;
  };
  message: string;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/subscribe-sound`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      job_id: jobId,
      is_own_sound: opts?.is_own_sound ?? true,
      notes: opts?.notes,
    }),
  });
  if (res.status === 409) throw new Error("Already subscribed to this sound");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to subscribe");
  }
  return res.json();
}

export async function unsubscribeSound(jobId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/unsubscribe-sound?job_id=${jobId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to unsubscribe");
  }
}

export async function getMySounds(): Promise<SoundSubscription[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/get-my-sounds`, { headers });
  if (!res.ok) throw new Error("Failed to fetch subscribed sounds");
  const data = await res.json();
  return data.sounds || [];
}

export async function getSoundComparison(
  jobIdA: string,
  jobIdB: string,
): Promise<SoundComparisonResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ job_id_a: jobIdA, job_id_b: jobIdB });
  const res = await fetch(`${BASE_URL}/get-sound-comparison?${params}`, {
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to fetch comparison");
  }
  return res.json();
}

// --- Monitoring API ---

export async function getSoundAlerts(
  labelId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<{ alerts: SoundAlert[]; unread_count: number }> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ label_id: labelId });
  if (options?.unreadOnly) params.set("unread_only", "true");
  if (options?.limit) params.set("limit", String(options.limit));
  const res = await fetch(`${BASE_URL}/get-sound-alerts?${params}`, {
    headers,
  });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function markAlertRead(alertId: string): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${BASE_URL}/get-sound-alerts?alert_id=${alertId}`, {
    method: "PATCH",
    headers,
  });
}

export async function getSoundMonitoringHistory(
  jobId: string,
  hours?: number,
): Promise<{
  snapshots: MonitoringSnapshot[];
  summary: MonitoringHistorySummary;
}> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ job_id: jobId });
  if (hours) params.set("hours", String(hours));
  const res = await fetch(
    `${BASE_URL}/get-sound-monitoring-history?${params}`,
    { headers },
  );
  if (!res.ok) throw new Error("Failed to fetch monitoring history");
  return res.json();
}
