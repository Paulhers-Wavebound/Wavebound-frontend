# Lead Hunter — Persist Active Run + Browse Past Arcs

## What changed

- `src/types/cartoonLeadHunter.ts` — added `LeadHunterJobSummary` for the recent-runs picker.
- `src/services/cartoonLeadHunterService.ts` — new `listCartoonLeadHunterJobs({ labelId, artistHandle?, limit? })` projection query against `cartoon_lead_hunter_jobs` (RLS already scopes by user).
- `src/components/content-factory-v2/cartoonLeadHunterStorage.ts` — **new.** localStorage helpers (`load/save/clearActiveJobId`) keyed by `(labelId, artistHandle)`. Mirrors the pattern used by `cartoonReconciler.ts`.
- `src/hooks/useCartoonLeadHunter.ts` — **new.** Two React Query hooks:
  - `useCartoonLeadHunter(jobId)` polls every 5s while `pending`/`running`, pins the cache forever once terminal (`staleTime: Infinity`).
  - `useCartoonLeadHunterRecent(labelId, artistHandle?)` lists prior runs with 30s staleTime.
- `src/components/content-factory-v2/LeadHunterRecentPopover.tsx` — **new.** Radix popover with This-artist / All-artists toggle, search, and a list of past runs. Click loads a run.
- `src/components/content-factory-v2/CartoonPanel.tsx` — replaced 6 `useState` declarations and the manual `setTimeout` poller with the hook. Hydrates the active jobId from localStorage on mount and on artist change. Persists the new jobId on `handleStartLeadHunt`. Auto-pick of recommended lead now lives in a dedicated `useEffect`. Recent popover wired into the Story-lead section header next to "Find leads".

## Why

You shipped the Lead Hunter "pick an angle" UX yesterday and noticed two bugs the moment you started using it:

1. **Active run vanished on tab switch.** The page-level `<motion.div key={activeTab}>` in `ContentFactoryV2.tsx` unmounts the entire create-tab subtree on every tab change. CartoonPanel's `useState`-held `leadHunterJobId` / `leadHunterResult` / etc. + the polling `useEffect` were all destroyed. Switch to Assets and back → empty panel, dead poll.
2. **No way to find old arcs.** Every run is persisted server-side in `cartoon_lead_hunter_jobs` (`result_json` is the full Lead Hunter output), but no client surface listed or loaded them.

The fix is purely client-side. The DB has everything; we just needed:

- A cache that outlives CartoonPanel unmount (React Query).
- A pointer so we know which jobId to rehydrate when the artist is re-picked (localStorage, scoped to label+artist).
- A list view + a way to open prior runs (popover + service listing).

The page-level tab unmount stays as-is. Once lead-hunter state is decoupled from the component instance, unmounting CartoonPanel is harmless.

## What was tested

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (10.8s).
- Live DB sanity check (read-only): confirmed `cartoon_lead_hunter_jobs` has `id, user_id, label_id, artist_handle, artist_name, status, progress_json, result_json, error_message, started_at, completed_at, created_at, updated_at`. Verified via PostgREST that Addison Rae's run from 18:49 today is persisted with full `result_json`.

## What to verify in browser

1. **Tab-switch persistence (the headline bug):**
   - Pick an artist in Story → Cartoon, click "Find leads", wait for results.
   - Switch to Assets, then back to Create. Expect the leads grid still rendered, the same lead pre-selected, no flicker, no re-poll.

2. **In-flight survival:**
   - Start a hunt, immediately switch to Assets (before it completes).
   - Wait the ~5 minute run. Switch back. Expect either the in-flight progress panel or the completed result, depending on timing — but never the idle "Find leads" state.

3. **Refresh persistence:**
   - With a completed hunt visible, hard refresh.
   - Expect: same artist auto-picked (it always was, that's the existing dropdown), and as soon as you re-pick the same artist (or it auto-loads), the leads come back from the DB via the active jobId stored in localStorage. The first frame after refresh hits the network once; subsequent tab switches are instant from cache.

4. **Recent runs picker:**
   - Click the new **Recent** button next to "Find leads".
   - Default view is "This artist" — should show the current Addison Rae run + the 18:49 run from earlier today.
   - Toggle to "All artists" — list expands across the label's roster.
   - Search by artist name / summary — filtering works.
   - Click an old run — panel switches to that run's leads. If it's a different artist, the artist picker auto-switches.

5. **"Run again":**
   - With a result on screen, click "Run again". Expect the leads grid to disappear immediately (no stale leads showing) and a fresh progress panel to come up.

6. **Failed-hunt error display:**
   - If a hunt enters `failed`, the existing error banner still surfaces (now from `data.error_message` instead of a local state setter).

## "While I was in here" notes

- `src/integrations/supabase/types.ts` does not include `cartoon_lead_hunter_jobs` — used the `as never` cast like `cartoonReconciler.ts` already does for `cartoon_scripts` / `realfootage_*`. **Recommend** regenerating types in a follow-up so we drop the cast: `npx supabase gen types typescript --project-id kxvgbowrkmowuyezoeke --schema public > src/integrations/supabase/types.ts`.
- React Query v5 default `gcTime` is 5 minutes — long enough for any reasonable tab switch within CFV2. If a user idles on Assets for >5 min mid-hunt, the cache is GC'd and on return the hook re-fetches via the active jobId. No correctness issue, just a single extra fetch.
- `refetchInterval` pauses while CartoonPanel is unmounted (no observers). On remount it resumes within 5s. This means a hunt that completed _while the panel was unmounted_ shows stale "running" state for up to 5s on return, then catches up. Acceptable; can be tightened by invalidating the query in `handleSelectRecent` / on mount if it ever becomes annoying.
- The popover rules out edge cases for `artist_handle === null` (a few legacy rows in the DB). The dialog defaults to "All artists" view in that case via the `disabled` flag on the This-artist toggle.

## Recommendations (ranked by user impact)

1. **Regenerate Supabase types** so we drop the `as never` cast in `cartoonLeadHunterService.ts`. 30-second job, removes a footgun.
2. **Pin a favorite arc** — extend the popover with a star toggle backed by a `pinned_at` column on `cartoon_lead_hunter_jobs` (or a tiny new junction table). Lets you keep curated arcs at the top of the list as the history grows.
3. **Group the recent list by artist** when in "All artists" mode — currently it's a flat chronological list. Once the label has 50+ runs, grouping makes scanning easier.
4. **Show working_title preview in the popover row** — currently we show only `lead_hunter_summary`, which is generic. Surfacing the top-recommended lead's `working_title` would make each row visually identifiable at a glance.
5. **Cleanup of stale `pending` jobs** — if a worker dies mid-hunt, the row stays `running`/`pending` indefinitely and pollutes the recent list. A simple "older than 30 minutes still non-terminal → mark failed" sweep in pg_cron would keep the picker clean.
