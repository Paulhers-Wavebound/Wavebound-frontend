// Active Lead Hunter job-id persistence — keyed by (labelId, artistHandle) so
// switching between artists in CartoonPanel auto-rehydrates whichever hunt
// is currently open for the picked artist. Mirrors the localStorage pattern
// used by cartoonReconciler.ts for cartoon-script snapshots: a quiet,
// non-fatal best-effort write that lets the UI come back instantly after a
// remount or refresh while the React Query cache (and ultimately the DB) is
// the authoritative source for the actual result_json.

const PREFIX = "cartoon-lead-hunter-active-v1";

function key(labelId: string, artistHandle: string): string {
  return `${PREFIX}-${labelId}-${artistHandle}`;
}

export function loadActiveJobId(
  labelId: string | null | undefined,
  artistHandle: string | null | undefined,
): string | undefined {
  if (!labelId || !artistHandle) return undefined;
  try {
    const raw = localStorage.getItem(key(labelId, artistHandle));
    return raw && raw.length > 0 ? raw : undefined;
  } catch {
    return undefined;
  }
}

export function saveActiveJobId(
  labelId: string | null | undefined,
  artistHandle: string | null | undefined,
  jobId: string,
): void {
  if (!labelId || !artistHandle) return;
  try {
    localStorage.setItem(key(labelId, artistHandle), jobId);
  } catch {
    /* quota / private mode — non-fatal */
  }
}

export function clearActiveJobId(
  labelId: string | null | undefined,
  artistHandle: string | null | undefined,
): void {
  if (!labelId || !artistHandle) return;
  try {
    localStorage.removeItem(key(labelId, artistHandle));
  } catch {
    /* non-fatal */
  }
}
