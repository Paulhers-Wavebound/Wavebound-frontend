import {
  supabase,
  SUPABASE_ANON_KEY,
  SUPABASE_URL_RAW,
} from "@/integrations/supabase/client";
import type {
  CreateLeadHunterJobInput,
  CreateLeadHunterJobResponse,
  LeadHunterJobResponse,
  LeadHunterJobStatus,
  LeadHunterJobSummary,
} from "@/types/cartoonLeadHunter";

async function authHeaders() {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
}

export async function createCartoonLeadHunterJob(
  input: CreateLeadHunterJobInput,
): Promise<CreateLeadHunterJobResponse> {
  const response = await fetch(
    `${SUPABASE_URL_RAW}/functions/v1/cartoon-lead-hunter-create`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(input),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      body?.error || `Lead Hunter failed to start (${response.status})`,
    );
  }
  if (!body?.job_id) {
    throw new Error("Lead Hunter returned no job_id");
  }
  return body as CreateLeadHunterJobResponse;
}

export async function getCartoonLeadHunterJob(
  jobId: string,
): Promise<LeadHunterJobResponse> {
  const url = new URL(
    `${SUPABASE_URL_RAW}/functions/v1/cartoon-lead-hunter-get`,
  );
  url.searchParams.set("job_id", jobId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: await authHeaders(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      body?.error || `Lead Hunter poll failed (${response.status})`,
    );
  }
  return body as LeadHunterJobResponse;
}

// `cartoon_lead_hunter_jobs` post-dates the last regen of supabase types, so
// the supabase-js generic doesn't know about it — `as never` is the same
// escape hatch cartoonReconciler.ts uses for cartoon_scripts/realfootage_*.
// RLS already restricts rows by label_id+user_id, so the anon-keyed client
// returns only the caller's rows.
interface RawLeadHunterJobSummary {
  id: string;
  artist_name: string | null;
  artist_handle: string | null;
  status: string | null;
  completed_at: string | null;
  created_at: string;
  result_json: { lead_hunter_summary?: string | null } | null;
}

export async function listCartoonLeadHunterJobs(opts: {
  labelId: string;
  artistHandle?: string;
  limit?: number;
}): Promise<LeadHunterJobSummary[]> {
  const limit = opts.limit ?? 50;
  let query = supabase
    .from("cartoon_lead_hunter_jobs" as never)
    .select(
      "id,artist_name,artist_handle,status,completed_at,created_at,result_json",
    )
    .eq("label_id", opts.labelId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.artistHandle) {
    query = query.eq("artist_handle", opts.artistHandle);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to list Lead Hunter runs");
  }
  const rows = (data ?? []) as unknown as RawLeadHunterJobSummary[];
  return rows.map((row) => ({
    id: row.id,
    artist_name: row.artist_name,
    artist_handle: row.artist_handle,
    status: (row.status ?? "pending") as LeadHunterJobStatus,
    completed_at: row.completed_at,
    created_at: row.created_at,
    lead_hunter_summary: row.result_json?.lead_hunter_summary ?? null,
  }));
}
