# 2026-04-25 — Cartoon entry in Create menu (V1)

## What changed

- `src/components/content-factory-v2/types.ts` — added `"cartoon"` to
  `OutputType`.
- `src/components/content-factory-v2/mockData.ts` — added
  `cartoon: "Cartoon"` to `OUTPUT_TYPE_LABEL`. Existing
  `Record<OutputType, string>` typing made this required.
- `src/components/content-factory-v2/CreateView.tsx` — added Cartoon preset
  card (Smile icon) to PRESETS, imported and rendered `CartoonPanel` inline
  when `activePreset === "cartoon"`, and excluded cartoon from the generic
  Tune/Generate footer (the panel owns its own Generate button).
- `src/components/content-factory-v2/CartoonPanel.tsx` (new) — wizard
  (artist + count + cost preview + Generate) and status board (5-stage
  timeline, MP4 player, copy-link). Owns the SSE → poll → render flow,
  persisted in localStorage under `cartoon-runs-v1-<labelId>`.
- `docs/features/cartoon-create.md` (new) — feature doc.

## Why

Backend deploy `c864138` shipped the end-to-end Image-Zoom Cartoon pipeline:
`label-chat` (role `cartoon_writer`) writes a script, then
`content-factory-cartoon-vo` chains VO render → image worker → Creatomate
composer to a 60s vertical MP4. Until now the only way to fire it was via
chat. The frontend prompt asked for a one-click Create-menu entry: pick an
artist, pick a count (1–3), watch a 5-stage status board, get an inline
player. V1 explicitly excludes story-angle override, voice/music
customization, regenerate-this-shot, and cross-user sharing.

## What was tested

- `npx tsc --noEmit` — clean (no output).
- The `cartoon_scripts` and `cartoon_videos` tables are not yet in
  `src/integrations/supabase/types.ts` (the Database type is generated and
  was last regenerated before the backend deploy). Used the established
  `.from("cartoon_scripts" as never)` cast pattern (matches
  `useContentIntelligence.ts` for similarly out-of-type tables) so tsc
  doesn't reject the unknown identifier.

## What to verify in browser

1. **Create tab → Cartoon preset card** is visible alongside the existing
   presets. Selecting it opens the wizard.
2. **Roster fetch** — artist dropdown lists every roster artist for the
   active label; empty roster shows the `/label/admin` hint; failure falls
   back to a manual `@handle` text input.
3. **Cost preview** updates as count chips toggle (1, 2, 3 → ~$8, ~$16,
   ~$24).
4. **Generate** disables while in flight; "Submitting…" shows briefly.
5. **Status board** renders one row per run with a 5-stage timeline. The
   current stage spins, past stages check, future stages are dim.
6. **Refresh during render** — runs reappear from localStorage and the
   polling loop continues advancing stages.
7. **Done state** — vertical 9:16 inline player plays the final MP4 and
   "Copy link" puts the URL on the clipboard.
8. **Failed state** — the row shows a red banner with the backend
   `error_message` and a "Dismiss" button.
9. **Tab away mid-render** — bring the tab back, the polling loop catches
   up immediately via the visibility-change listener.

## While I was in here

1. **Cartoon doesn't show up in Review** — V1 deliberately keeps cartoon
   out of the QueueItem / Review tab system to avoid changing Review's
   semantics. Worth a follow-up to surface completed cartoons in Review
   alongside fan briefs (could route through QueueItem with
   `outputType: "cartoon"` and a `cartoonScriptId` field). Recommend after
   we trust the pipeline end-to-end.
2. **`OUTPUT_TYPE_LABEL[cartoon]` shows up as a filter chip in
   `ReviewView.tsx`** but will always render `0` items in V1. Harmless but
   could be hidden when `count === 0` for that type — generic improvement
   that would also clean up other empty filters.
3. **`useLabelArtists` is duplicated in spirit by `LabelRoster.tsx`'s own
   query path**. The hook header already calls this out as a TODO. Worth
   migrating LabelRoster the next time it's touched so there's one source
   of truth for roster fetches.
4. **Polling vs Realtime** — fan-brief flow uses Supabase Realtime + a 15s
   polling fallback. Cartoon V1 just polls every 6s for simplicity. If
   we add many concurrent cartoons or want a snappier UX, switching to
   Realtime on `cartoon_scripts` and `cartoon_videos` would be a clean
   upgrade (the reconciler logic is already centralized in `tickRun`).
5. **Backend handoff** — the panel assumes
   `content-factory-cartoon-vo` returns either `{ script_id }` or `{ id }`
   (defensive parse). If the actual contract is different, only that one
   field needs to change. Worth confirming once a real run lands.
