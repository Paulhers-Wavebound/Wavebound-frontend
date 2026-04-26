# 2026-04-25 — Rehydrate hardening pass (link_video + polling gates + backend handoff)

## What changed

- `src/components/content-factory-v2/linkVideoReconciler.ts` — added
  exported helpers mirroring the cartoon ones: `CfJobRow` type,
  `deriveLinkVideoItemState(row)` (single source of truth for status /
  stage / error derivation), `buildLinkVideoItemFromJob(row)` (DB row →
  fresh QueueItem). Internal stage-label table extracted to a single
  `STAGE_LABEL_FOR_DB` constant.
- `src/pages/label/ContentFactoryV2.tsx` — added `recentCfJobsQuery`
  (label-scoped, last 24h, max 50, refetched every 30s while at least
  one link_video item is generating) plus a merge effect that patches
  matching items by `linkVideoJobId` and prepends fresh items for any
  unknown DB row. Same recovery path as the cartoon merge.
- `src/pages/label/ContentFactoryV2.tsx` — also gated
  `recentCartoonScriptsQuery.refetchInterval` on `queue.some(in-flight)`.
  Initial fetches still run unconditionally (orphan discovery on mount);
  periodic polling only happens while there's something to watch.
- `docs/features/link-video-v2.md` — documented the new authoritative
  rehydrate path and updated the stall edge case to note that
  `failed → pending` recovery is automatic when the DB row eventually
  completes.
- `docs/handoffs/2026-04-25_cartoon-scripts-source-chat-job-id-uniqueness.md`
  — backend handoff for the duplicate-cartoon-script bug. Includes the
  symptom (live evidence: two scripts for one chat_job_id, ~$8 of
  duplicate spend), root cause (no SELECT-by-source_chat_job_id before
  INSERT in `ensureCartoonScript`), and a 3-part fix (unique partial
  index migration, SELECT-then-INSERT in the edge function, one-time
  cleanup SQL).

## Why

User flagged three follow-ups from the cartoon-DB-rehydrate fix:
link_video had the same race, the polling was unconditional, and the
backend was inserting duplicate cartoon_scripts. All three closed.

## What was tested

- `npx tsc --noEmit` — clean (exit 0).
- DB confirmed: `cf_jobs` table exists with all required columns
  (`label_id`, `artist_handle`, `ref_tiktok_url`, `status`, `error`,
  `final_url`, `cost_cents`, `created_at`, `updated_at`). Sample row
  shape verified via service-role read.
- Cartoon-script duplicate live-confirmed: two
  `cartoon_scripts.source_chat_job_id =
beaa6af4-17e2-4a7d-99c1-7d6b0d304d2a` (one complete with video, one
  rendering_images without).

## What to verify in browser

1. Open `/label/content-factory-v2`. Within ~30s the in-flight Addison
   Rae cartoon should land in Review (already-fixed by yesterday's
   pass — confirm it's still working).
2. Submit a fresh **Link → video** run. Hard-refresh during the
   `transcribed` / `cast` / `rendering` phase. Within 30s the
   placeholder should reappear in Review with the right stage label.
3. Open `/label/content-factory-v2` in a brand-new incognito window
   while a link_video run is in-flight on a normal window. The
   incognito window should also see the placeholder within 30s
   (proves DB rehydrate, not sessionStorage).
4. After all in-flight items hit terminal, watch DevTools → Network.
   The `cf_jobs` and `cartoon_scripts` REST calls should stop firing
   on the 30s cadence (refetchInterval gated on in-flight presence).

## While I was in here

- Same architectural rehydrate gap exists for **fan-brief mid-pipeline**
  (`fan_brief_jobs`). The existing `activeJobsQuery` already does this
  for jobs <1h old, capped at 10. That's narrower than the new
  cartoon/link_video windows (24h, 50). Worth widening for symmetry,
  but the user-visible pain isn't there yet. Defer.
- `ReviewView` filters cartoons / link_videos through the same
  `MOCK_ARTISTS` artist filter pane. DB-rehydrated items have synthetic
  artistIds (`cartoon-{handle}` / `linkvideo-{handle}`) that don't
  appear in MOCK_ARTISTS, so they won't show up in the per-artist
  filter list — they only render under "All artists." Shipping the V2
  to real users will need to surface artistIds from the live roster
  instead of `MOCK_ARTISTS`. Tracked separately.
- The cartoon `cartoonReconcileLocksRef` is process-local and doesn't
  survive HMR / remount. The backend handoff's Part 2
  (SELECT-then-INSERT) closes that gap server-side, so we don't need a
  separate FE-side fix. If the handoff doesn't ship, the FE could
  also stash a per-chat-job-id "vo-call sent" flag in sessionStorage
  to survive remount — but DB-side is the correct layer.
- The merge effect for both flows respects local `scheduled` state
  (won't downgrade) but doesn't preserve local "killed" state — a
  dismissed item resurrects on next poll. Fixing that properly needs
  a `dismissed_at` column on cartoon_scripts/cf_jobs (backend
  change). For now the FE could maintain a `dismissedIds` Set ref that
  filters incoming DB rows, but that's session-local. Flag for
  product input — is "kill survives across sessions" worth a column?
