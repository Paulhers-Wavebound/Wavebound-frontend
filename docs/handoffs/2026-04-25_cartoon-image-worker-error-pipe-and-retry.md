# Cartoon image worker — pipe error_message to cartoon_scripts + retry transient art-director 5xx

**Repo:** `wavebound-backend`
**File:** `scripts/content-factory/cartoon-image-worker.ts`
**Priority:** Medium — silent failures + losing one cartoon to a transient
503 are both happening in production today.

## Symptom

Live run on 2026-04-26 01:52 UTC: 2 Addison Rae cartoons generated.

- Cartoon 1 → `complete` ✓
- Cartoon 2 (`cartoon_scripts.id = 8b96cecd-19ac-47b4-b18b-8e0aa02b85a2`)
  → `images_failed` with `error_message: NULL`

Frontend reads `cartoon_scripts.error_message` to surface a user-visible
failure reason. Null = no reason shown. The frontend now synthesizes a
fallback label ("Image generation failed") since this null pattern has
been observed twice (Harry Styles `vo_failed` earlier today + this one),
but ground truth on the script row would be much better.

## Root cause

`cartoon_image_jobs.id = 5f5233fb-14da-4fba-bb51-bd410d9b2156` (the job
row for the failed script) does have the real reason:

```
art director 503: {"code":"SUPABASE_EDGE_RUNTIME_ERROR","message":"Service is temporarily unavailable"}
```

Two bugs combined:

1. **Transient 5xx from `content-factory-cartoon-art-director` not
   retried.** `callArtDirector` (line 167) does one fetch and throws on
   non-2xx. Edge runtime cold-starts and scaling events return 503
   regularly — these are retryable. We lost a $8 cartoon to a 503.
2. **Worker captures the error on `cartoon_image_jobs` but not on
   `cartoon_scripts`.** Both `images_failed` write paths in
   `setScriptStatus` are called without an `extra` arg containing
   `error_message`:
   - Line 492 — all-shots-failed branch (`finalStatus === "failed"`):
     never plumbs through any per-shot error.
   - Line 555 — exception branch: `setJobStatus` writes
     `{ error_message: msg.slice(0, 1000) }` to `cartoon_image_jobs` but
     the very next line writes only `status` to `cartoon_scripts`.

## Fix

### Part 1 — Retry transient 5xx in `callArtDirector` (line 167)

```ts
async function callArtDirector(
  scriptId: string,
  characterRefUrls: Record<string, string>,
) {
  var lastErr: string | null = null;
  for (var attempt = 1; attempt <= 3; attempt++) {
    var res = await fetch(ART_DIRECTOR_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script_id: scriptId,
        character_reference_urls: characterRefUrls,
      }),
    });
    if (res.ok) {
      var data = await res.json();
      if (!data.shot_plan_json?.shots)
        throw new Error("art director returned no shots");
      return data.shot_plan_json;
    }
    var body = await res.text();
    lastErr = "art director " + res.status + ": " + body.slice(0, 500);
    // Retry only transient infra errors. 4xx is a permanent contract bug.
    if (res.status < 500 || attempt === 3) {
      throw new Error(lastErr);
    }
    log("art director " + res.status + " on attempt " + attempt + ", retrying");
    await new Promise((r) => setTimeout(r, attempt * 1500)); // 1.5s, 3s
  }
  throw new Error(lastErr || "art director failed after 3 attempts");
}
```

Same retry pattern would help the Creatomate compose call
(`maybeTriggerCompose`, line 509) and the per-shot gpt-image-2 calls,
but those aren't blocking today's failure — defer.

### Part 2 — Pipe error_message to cartoon_scripts on both `images_failed` paths

**Line 492 (all-shots-failed branch):** capture the last per-shot error
in the rendering loop into a local `var lastShotError`, then:

```ts
await setScriptStatus(
  scriptId,
  allDone ? "images_complete" : anyDone ? "images_complete" : "images_failed",
  {
    images_completed_at: anyDone ? nowIso : null,
    ...(anyDone
      ? {}
      : { error_message: lastShotError ?? "All shots failed to render" }),
  },
);
```

**Line 555 (exception branch):** mirror the same `error_message` write:

```ts
} catch (e: any) {
  var msg = (e as Error).message;
  err("job " + job.id + " errored: " + msg);
  await setJobStatus(job.id, "failed", { error_message: msg.slice(0, 1000) });
  await setScriptStatus(job.script_id, "images_failed", { error_message: msg.slice(0, 1000) });
  Deno.exit(1);
}
```

(The 1000-char clamp is to stay well under any TEXT column limit and
match the pattern already used for `cartoon_image_jobs.error_message`.)

## Test plan

1. After deploy, force a transient failure: temporarily set
   `CARTOON_ART_DIRECTOR_URL` to a non-existent path on a test script,
   confirm 3 retries are logged before the error propagates, then check
   `cartoon_scripts.error_message` is populated.
2. Generate a real cartoon and confirm normal happy path still works
   (no extra latency from the retry on the success case — first attempt
   should return 200 immediately).

## Frontend side (already shipped)

The frontend reconciler now treats `vo_failed` / `images_failed` /
`video_failed` as terminal and synthesizes a stage-specific label
when `cartoon_scripts.error_message` is null. So the UI degrades
gracefully even before this backend fix lands. After this fix lands,
the user-visible label will be the actual backend reason instead of the
generic "Image generation failed" fallback.

## Cross-reference

- Frontend reconciler: `src/components/content-factory-v2/cartoonReconciler.ts`
  (`FAILED_STATUSES` set + `statusToErrorLabel` helper)
- Frontend session diary:
  `docs/session-diaries/2026-04-25_cartoon-stage-map-and-queued-pill.md`
- Live failure row:
  `cartoon_image_jobs.id = 5f5233fb-14da-4fba-bb51-bd410d9b2156`
  `cartoon_scripts.id = 8b96cecd-19ac-47b4-b18b-8e0aa02b85a2`
