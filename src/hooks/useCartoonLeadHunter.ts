import { useQuery } from "@tanstack/react-query";
import {
  getCartoonLeadHunterJob,
  listCartoonLeadHunterJobs,
} from "@/services/cartoonLeadHunterService";
import type {
  LeadHunterJobResponse,
  LeadHunterJobSummary,
} from "@/types/cartoonLeadHunter";

// Single Lead Hunter job — polls every 5s while the run is pending/running,
// then caches the terminal state forever (Infinity staleTime) so a tab
// switch / remount returns instant data with no re-fetch flicker. The cache
// key is the job_id so navigating to a *different* historical run via the
// recent-runs picker just spawns a parallel cache entry — switching back is
// also instant.
export const LEAD_HUNTER_JOB_KEY = (jobId: string | undefined) =>
  ["cartoon-lead-hunter-job", jobId] as const;

export function useCartoonLeadHunter(jobId: string | undefined) {
  return useQuery<LeadHunterJobResponse>({
    queryKey: LEAD_HUNTER_JOB_KEY(jobId),
    queryFn: () => getCartoonLeadHunterJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? 5_000 : false;
    },
    // Once the job is complete/failed it cannot change — pin it in cache.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

// Recent runs for the picker. Filtered server-side by label_id (RLS already
// scopes to the caller, but the explicit filter keeps the index hit). When
// `artistHandle` is set the list narrows to that artist; when omitted the
// popover shows everything for the label.
export const LEAD_HUNTER_RECENT_KEY = (
  labelId: string | null | undefined,
  artistHandle: string | null | undefined,
) =>
  [
    "cartoon-lead-hunter-recent",
    labelId ?? null,
    artistHandle ?? "all",
  ] as const;

export function useCartoonLeadHunterRecent(
  labelId: string | null | undefined,
  artistHandle?: string | null,
) {
  return useQuery<LeadHunterJobSummary[]>({
    queryKey: LEAD_HUNTER_RECENT_KEY(labelId, artistHandle),
    queryFn: () =>
      listCartoonLeadHunterJobs({
        labelId: labelId!,
        artistHandle: artistHandle ?? undefined,
        limit: 50,
      }),
    enabled: !!labelId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
