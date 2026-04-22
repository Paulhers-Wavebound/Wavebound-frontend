# 2026-04-22 — Content Factory UI (T7)

## What changed

New files:

- `src/pages/label/ContentFactory.tsx` — full page: form → upload → polling
  → inline video. State machine: `idle | uploading | polling | done | error`.
- (this diary)

Modified files (only T7 scope):

- `src/App.tsx` — lazy import + `<Route path="content-factory" />` inside
  `/label` tree.
- `src/components/label/LabelSidebar.tsx` — Film icon import + nav entry
  "Content Factory" after Fan Briefs.

Pre-existing dirty files (NOT touched — another session owns them):

- `src/components/label/content-social/SoundPerformanceSection.tsx`
- `src/hooks/useContentDashboardData.ts`
- `src/pages/label/ArtistIntelligence.tsx`
- `src/pages/label/LabelArtistProfile.tsx`
- `src/pages/label/SoundIntelligenceDetail.tsx`
- `src/pages/label/SoundIntelligenceOverview.tsx`
- `docs/session-diaries/2026-04-21_sound-performance-missing-songs.md`

## Why

Day 6 / T7 from `goals/content-factory.md`. Backend pipeline (T1–T6) is live
and produces a 9:16 MP4 on Backblaze via Creatomate. T7 is the operator UI.

## Shape

- **Form panel** — TikTok URL (validated client-side for tiktok.com /
  vm.tiktok.com), artist handle (free-text, leading `@` stripped), MP3 file
  picker (client-side 10 MB cap + mime/extension check). Submit disabled
  until all three valid. If `useUserProfile().labelId` is null, form is
  replaced with "No label scope — contact Paul".
- **Submit flow** —
  1. Upload to `content-factory` bucket at
     `sources/{label_id}/{rand8}-{slug(handle)}.mp3` (matches the RLS
     prefix policy in the goal file Schema section).
  2. `supabase.functions.invoke('content-factory-generate', { body: {
label_id, artist_handle, ref_tiktok_url, artist_mp3_path } })`.
  3. Stash returned `job_id`, transition to `polling`.
- **Progress panel** — 6-step stepper
  (ingested → decomposed → transcribed → cast → rendering → done). Past
  steps green-checked, current step accent w/ spinner, error state turns
  current step red + shows the backend `error` text. Elapsed timer + live
  `cost_cents` rendered top-right in JetBrains Mono.
- **Polling** — `GET /functions/v1/content-factory-status/:job_id` with
  Bearer session JWT + apikey, every 3s. First poll fires immediately.
  Interval stored in a ref and cleared on unmount / done / error.
- **Done panel** — `<video controls playsInline>` wrapped in a 9:16
  aspect-ratio box (`aspectRatio: '9 / 16'`, `max-width: 320`). Buttons:
  Generate another (accent, resets state), Copy URL, Open (new tab).

## What was tested

- `npx tsc --noEmit` — exit 0, no errors.
- `npm run build` — exit 0, `ContentFactory-*.js` chunk emitted
  (11.76 kB / 3.90 kB gzip).
- Backend edge functions probed via `curl` (no auth) — both
  `GET /content-factory-status/:id` and `POST /content-factory-status`
  responded 401 UNAUTHORIZED_NO_AUTH_HEADER. Functions are deployed and
  reachable; shape per goal file (GET path-param) is wired accordingly.

## What needs browser verification (Paul)

CLAUDE.md forbids dev/preview server inside Claude Code so the following
wasn't verified in a running browser. Please check:

1. Navigate to `/label/content-factory` — page renders with Film icon,
   title, three inputs, disabled "Generate" button.
2. Sidebar shows "Content Factory" item with Film icon after Fan Briefs,
   marked NEW.
3. Fill: TikTok URL + `sombr` + a small MP3 → submit enables; click
   Generate → toast if it errors, otherwise form swaps to the stepper
   panel with the artist/ref header and a job_id footer.
4. Stepper advances at least through `ingested`. Elapsed ticker runs.
5. On `done`, the 9:16 `<video>` plays. "Generate another" resets to an
   empty form.
6. Styling: matches light/dark label theme (uses `var(--surface)`,
   `var(--ink)`, `var(--accent)`, `var(--border)` — no hardcoded hex).

## "While I was in here" — recommendations

Ranked by user impact:

1. **Past-runs list for the route.** Right now a refresh mid-polling
   loses the in-progress job. A bottom-of-page "Recent jobs" table
   (`cf_jobs` filtered by `label_id`, with status + final_url link)
   would both (a) recover state after refresh and (b) give operators a
   way back to earlier outputs. ~1 evening of work — needs a real
   column trace against `cf_jobs` first.
2. **Reconnect to in-flight job from URL.** `/label/content-factory/
:jobId` as a second route that hydrates the stepper panel for any
   job the user's `label_id` owns. Makes the feature shareable
   internally. Pairs naturally with #1.
3. **Drag-and-drop MP3 zone.** The current `<label for=>` wrapper is
   functional but unremarkable. A dropzone + waveform preview would
   feel a lot more like a "factory" than a form. Low-lift — a few
   lines + the existing shadcn components.
4. **Cost cap nudge.** Goal file has a $50 hard cap (5000 cents) across
   all V1 jobs. Pull `SELECT COALESCE(SUM(cost_cents),0) FROM cf_jobs`
   and render a small indicator ("$3.17 / $50.00 V1 budget"). Stops
   Paul from accidentally blowing the cap via the UI. Needs the
   backend `goal_meta` row confirmed live.
5. **Playwright test.** No Playwright harness in this repo beyond the
   `.playwright-mcp/` helper dir. A single smoke spec (load route,
   assert three inputs rendered, submit disabled until filled) would
   prevent regressions and costs ~an hour to set up. Ask before
   adding since it's a new dep.
