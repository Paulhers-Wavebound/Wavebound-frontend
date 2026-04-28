# Cartoon — Create-menu entry

## What it does

Adds a "Story" preset to the Content Factory v2 → Create tab. The user picks an
artist, runs Lead Hunter to choose a story angle, then fires either the cartoon
pipeline (script → VO → images → 60s 9:16 MP4) or the real-edit pipeline
(script → VO → real footage → 60s 9:16 MP4). Each generated story lands as a
QueueItem in Review with a live 5-stage timeline; once the MP4 is ready, the
same QueueCard plays the rendered video and exposes a Copy-link action.

## Who uses it and why

Label users (logged-in, scoped to a label) who want to spin up artist-positive
story posts from the dashboard without dropping into the Label Assistant chat.
Lead Hunter gives them control over the narrative before the expensive render
pipeline starts.

## Architecture

- `src/components/content-factory-v2/CartoonPanel.tsx` — wizard only. Picks
  artist, runs Lead Hunter, renders the selectable lead board, then collects
  style + voice + count + cost preview. Fires the parent's `onGenerate`
  callback with the selected lead.
- `src/services/cartoonLeadHunterService.ts` — small authenticated client for
  `cartoon-lead-hunter-create` and `cartoon-lead-hunter-get`.
- `src/types/cartoonLeadHunter.ts` — frontend contract for lead-hunter jobs,
  progress, result JSON, and individual leads.
- `src/pages/label/ContentFactoryV2.tsx` — orchestrator. Owns the SSE
  label-chat call (one per cartoon), captures `chat_job_id` from each, and
  pushes placeholder QueueItems into the queue with `status='generating'`.
  Holds Realtime subscriptions on chat_jobs / cartoon_scripts /
  cartoon_videos with a 15s polling fallback + visibility-change catch-up.
  Persists in-flight + completed cartoon QueueItems to localStorage for
  instant rehydrate, and runs `recentCartoonScriptsQuery` (every 30s,
  label-scoped, last 24h) as the **authoritative** rehydrate so a hard
  refresh / HMR / cross-browser session can never orphan a cartoon.
- `src/components/content-factory-v2/cartoonReconciler.ts` — pure helpers:
  localStorage shape, snapshot ↔ QueueItem conversion, selected-lead
  persistence, reconcile function that reads chat_jobs / script/video tables
  and returns the patch to apply.
- `src/components/content-factory-v2/ReviewView.tsx` — renders the 5-stage
  timeline (`CartoonStageTimeline`) inside QueueCard for cartoon items in
  flight, and a `CopyLinkButton` whenever `cartoonFinalUrl` is set.

## Correct behavior

- Story preset card visible alongside the existing presets in
  `/label/content-factory-v2?tab=create`.
- Wizard only renders when a `labelId` is present; otherwise shows a
  "requires logged-in label session" notice.
- Artist picker reads from `useLabelArtists(labelId)` (the canonical roster
  hook — also used by `/label/roster`). Roster fetch failure falls back to a
  manual `@handle` text input. Artists without an `artist_handle` are filtered
  out client-side.
- Lead Hunter starts only after an artist is selected. While it runs, the panel
  shows phase, lead count, web-search count, dossier-search count, elapsed time,
  and current focus.
- Lead Hunter completion renders a selectable lead board. Generate is disabled
  until one lead is selected.
- Count picker is currently **1** while ElevenLabs is on the 5-concurrent tier.
  Cost preview reads `~$8 × N — Opus + ElevenLabs v3 + gpt-image-2 +
  Creatomate` for cartoon, or `~$1.10 × N — Opus + ElevenLabs v3 + yt-dlp clips
  + Creatomate` for real edit.
- Generate is enabled even while other cartoons are mid-flight — users can
  queue more right now. An informational pill ("X cartoons in flight —
  watch the timeline in Review") surfaces when `cartoonsInFlight > 0`.
- On Generate, the wizard invokes `onCartoonGenerate({ artistName,
artistHandle, count, selectedLead, leadHunterJobId, subFormat, voiceId,
voiceSettings })`.
- ContentFactoryV2 then, for each of N cartoons:
  1. Pushes a placeholder QueueItem (`outputType='cartoon'`,
     `status='generating'`, `cartoonStage='script'`) with
     `cartoonSelectedLead` and `cartoonLeadHunterJobId`.
  2. Switches the active tab to Review so the user sees the timeline.
  3. Opens a `streamChatMessage` SSE against `/functions/v1/label-chat` with
     `{ message, role: "cartoon_writer", session_id: <uuid> }`. The user
     message (built by `buildStoryWriterMessage`) wraps the selected lead in
     an `<operator_selected_lead>` JSON block and tells the writer to treat
     it as **creative direction, not locked legal copy** — verify enough to
     avoid obviously false claims, soften shaky specifics rather than pivot,
     and only abandon the lead if the core claim is clearly unsupported. The
     backend `cartoon_writer` system prompt has a matching OPERATOR-SELECTED
     LEAD MODE section that codifies the same contract. The `onJobId`
     callback writes `cartoonChatJobId` onto the QueueItem.
- **Reconcile loop** — on Realtime UPDATE / 15s poll / visibility-change,
  for each in-flight cartoon QueueItem:
  1. If `cartoonChatJobId` is set but `cartoonScriptId` is not, query
     `chat_jobs` by id. On `status='complete'`, POST
     `/functions/v1/content-factory-vo-dispatch` with `{ chat_job_id }`,
     selected voice settings, and kickoff source. Write `cartoonScriptId`
     (defensively reads `script_id` or `id` from the response). On
     `status='failed'`, mark the QueueItem failed.
  2. If `cartoonScriptId` is set, query `cartoon_scripts` (status,
     error_message, hook_title) + `cartoon_videos` (status, final_url,
     error_message) in parallel. Map `cartoon_scripts.status` to UI stage:
     - `draft` / `rendering_vo` → VO
     - `vo_complete` / `planning_images` / `rendering_images` → Images
     - `images_complete` / `rendering_video` → Video
     - `complete` (with `cartoon_videos.final_url`) → flip QueueItem to
       `status='pending'`, set `cartoonFinalUrl`/`renderedClipUrl`,
       update the title with `hook_title`.
     - `vo_failed` / `images_failed` / `video_failed` → mark the QueueItem
       failed with a stage-specific label (the backend can leave
       `error_message` null, so the reconciler synthesizes one).
  3. Sub-state hint (`cartoonStageDetail`) — backend serializes image and
     video rendering, so N>1 cartoons spend real time at `vo_complete` /
     `images_complete` waiting for the previous run to vacate the worker.
     The reconciler maps:
     - `vo_complete` / `images_complete` → "Queued · waiting for slot"
     - `planning_images` → "Preparing"
       The timeline renders this as a small text hint after the "Done" pill,
       so users can tell idle queueing apart from a stalled render.
- Realtime channel layout:
  - One channel per in-flight cartoon item, keyed by phase:
    - `chat-{itemId}-{chatJobId}` while no scriptId is set, listens for
      `chat_jobs` UPDATE filtered by `id=eq.{chatJobId}`.
    - `script-{itemId}-{scriptId}` once scriptId is set, listens for
      `cartoon_scripts` UPDATE (id), `cartoon_videos` UPDATE (script_id),
      and `cartoon_videos` INSERT (script_id).
  - Channel set is reconciled on every queue change; old-phase channels
    are torn down when the lifecycle moves on.
- Each cartoon QueueItem renders:
  - Generic "Generating" badge + a 5-stage pill timeline (Script → VO →
    Images → Video → Done) with spinner on current stage, check on past
    stages, dimmed icons on future ones.
  - When done: the existing `BriefViewerModal` thumb-click path opens the
    9:16 MP4 (set via `renderedClipUrl`). A "Copy link" action button on
    the QueueCard puts `cartoonFinalUrl` on the clipboard.
  - When failed: red banner with backend `error_message`, "Dismiss" button.
- Filter sidebar in Review hides empty Risk/Source/OutputType chips so the
  list stays focused on what's actually present.

## Edge cases

- **Empty state** — Pending tab shows a "queue is clear" hint when no cartoon
  or other items match.
- **Lead Hunter failure** — inline error stays in the Story panel; the user can
  run Lead Hunter again before generating.
- **No selected lead** — Generate remains disabled even if artist, style, voice,
  and count are selected.
- **Multiple concurrent stories** — count is currently capped to 1 per click,
  but the user may start another run while previous stories are in flight. The
  reconciler handles each item independently.
- **Tab hidden** — visibility-change listener forces a fresh reconcile when
  the tab regains focus, closing the gap from background-tab timer
  throttling.
- **Refresh during render** — placeholder QueueItems are restored from
  localStorage on labelId hydrate (instant). Within 30s, the
  `recentCartoonScriptsQuery` polls `cartoon_scripts` (label-scoped, last
  24h, joined with cartoon_videos) and either patches the localStorage-
  rehydrated items with the latest DB state or, if localStorage was lost
  (HMR before SSE first event, cross-browser session, incognito), builds
  fresh placeholders via `buildCartoonItemFromScript`. The merge effect
  dedupes by `cartoonScriptId` first, then by `cartoonChatJobId`, so an
  in-session placeholder mid-script-phase upgrades to a script-tracked
  placeholder rather than duplicating.
- **Realtime drop** — polling fallback every 15s + visibility-change keeps
  stuck items moving even when the WebSocket has silently disconnected.
- **Cartoon-vo retry race** — `cartoonVoCallInFlight` is set in-memory only
  while the POST is pending so concurrent ticks don't double-fire the
  edge function. After a hard refresh the flag is gone; if the call had
  already created the script row, the next tick will see `chat_jobs.status
= complete` and re-issue the POST. (V2 follow-up: query
  `cartoon_scripts.chat_job_id = X` first to recover the script_id without
  another POST. Requires confirming the schema column.)
- **Quota exceeded on localStorage** — write is wrapped in try/catch; the
  in-memory state still works for the current session.
