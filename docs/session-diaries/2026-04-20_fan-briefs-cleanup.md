# Fan Briefs cleanup pass

## What changed

- **`docs/features/fan-briefs.md` (new)** — Canonical feature doc consolidating sprints 1, 2, 6 + 03-31 rendered-clip diary. Covers behavior, edge cases, data flow, status workflow, key files, RLS model.
- **`src/pages/label/LabelFanBriefs.tsx`** — Rewritten:
  - `useEffect`/`useState` fetch → two `useQuery` calls keyed on `labelId` with `refetchInterval: 30_000` and `staleTime: 15_000`. The "Rendering..." spinner now self-resolves on the next poll without a manual refresh.
  - Mutations (approve/skip/modify/delete) keep their optimistic UX via `queryClient.setQueryData`, matching the prior instant-feedback behavior.
  - Storage cleanup on delete now derives the object path from `rendered_clip_url` via `getStoragePath()` (regex on `/fan-briefs/(...)` with query-string strip), instead of reconstructing from `${artist_handle}/rendered/${briefId}.mp4`. Robust if the backend ever changes the layout, and works for both public and signed URLs.
  - Inline styles for layout converted to Tailwind classes (CSS-var color tokens kept inline per the codebase pattern).
  - Removed the local `<style>{ @keyframes spin }</style>` block — `Loader2` now uses Tailwind's `animate-spin`.
- **`src/components/fan-briefs/BriefCard.tsx`** — Rewritten:
  - `getVideoId()` now matches `youtube.com/watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, and `/v/` URL shapes (was only `?v=`).
  - Layout / spacing / borders / transitions converted to Tailwind classes.
  - Hover effects on Replay / Source / Chat / Remove buttons converted from `onMouseEnter`/`onMouseLeave` handlers to `hover:` Tailwind classes.
  - Spinner uses Tailwind `animate-spin`.
  - Behavior preserved: staticPreview, replayKey, hook editing focus/select, source toggle, confirmDelete flow, chat-about-this prefill, all four status branches, all action buttons.

## Why

Five follow-up items flagged at the end of the prior conversation: (1) missing feature doc, (2) no polling for in-progress renders, (3) `getVideoId` only matched `?v=` URLs, (4) `BriefCard` was ~1000 lines of inline styles, (5) storage path was reconstructed client-side instead of derived from the URL.

## What was tested

- `npx tsc --noEmit` — clean
- `npm run build` — successful production build (10.3s)
- No browser verification — dev server can't run inside Claude Code per CLAUDE.md

## What to verify in browser

1. `/label/fan-briefs` still loads with the 5 Harry Styles briefs and tabs/counts render correctly
2. Approve a brief → it animates from Content to Clips with the green "Brief approved — rendering..." toast and shows the spinner; polling should swap to the rendered video within ~30s of the backend finishing
3. Modify Hook → inline edit, Enter saves, the modified hook persists
4. Skip / Remove flows still work and cards disappear instantly
5. Delete a clip with a `rendered_clip_url` → confirm the storage object actually disappears (the path-derivation change is the riskiest part of this pass)
6. Visual regression: card spacing, fonts, hover states should look unchanged

## Follow-up pass (same day)

Paul approved the full list. Shipped in this session:

- **`.claude/rules/design-system.md`** — Rewritten from `src/index.css`. Documents the actual light + dark label-theme tokens (`--bg` / `--surface` / `--ink` / `--border` / `--accent` / semantic / overlay / chart), the Tailwind + CSS-var hybrid pattern, typography (DM Sans / JetBrains Mono / Tiempos Text), chart rules, anti-patterns, and a legacy-note for files still referencing the dead `--L0`..`--L3` tokens.
- **`docs/handoffs/2026-04-20_fan-briefs-rendered-clip-path.md`** — Backend handoff proposing a `rendered_clip_path text` column on `fan_briefs` so the frontend no longer has to parse URLs. Low priority — marked to bundle with the next schema change.
- **Confidence chip tiered by score** — `confidenceChipStyle()` in `BriefCard` + `BriefDetail`. <70 amber, 70–84 blue, ≥85 green.
- **Batch approve/skip** — `LabelFanBriefs` now tracks `selectedIds: Set<string>`. `BriefCard` renders a small accent-bordered checkbox in the Content tab when `onToggleSelect` is passed. A sticky bottom bar ("N selected · Approve N · Skip N · Clear") appears once at least one is selected and batch-writes via `.in('id', ids)` with optimistic cache updates. Selection auto-clears on tab switch and `labelId` change.
- **`BriefDetail.tsx` (new)** — Expanded modal wrapping shadcn `Dialog`. Shows artist header + tiered confidence + status, video preview (rendered clip if present, else source embed), editable hook (click to edit, Enter saves, Esc cancels), tag row, full untruncated `why_now`, source with "Open on YouTube" deep link, and — if `segment_id` is non-null — a `content_segments` lookup (React Query, 60s staleTime) rendering `transcript_excerpt` + speaker + `moment_type` + `moment_summary`. Footer has Chat, and Approve/Skip in pending state. `BriefCard` gained a "Details" button next to "Chat about this" to open it.

## What was tested (follow-up)

- `npx tsc --noEmit` — clean
- `npm run build` — successful (10.66s)
- No browser verification — dev server can't run inside Claude Code

## What to verify in browser (follow-up)

1. Confidence chips show amber for <70, blue for 70–84, green for ≥85 (the seeded Harry Styles briefs should hit all three tiers)
2. Content tab: click the checkbox on 2–3 cards → sticky bar shows "3 selected", "Approve 3", "Skip 3", "Clear". Click Approve 3 → all three move to Clips tab and start rendering. Selection clears.
3. Click Details on a brief with `segment_id` set → modal opens, transcript excerpt loads from `content_segments`, hook is editable, Approve closes the modal and moves the card to Clips.
4. Click Details on a clip-mode brief (approved) → modal shows rendered video, no Approve/Skip footer (it's not pending).
5. Tab switch clears any selection.

## While I was in here (second pass)

1. **Confidence thresholds are magic numbers** — 70 / 85 should probably be a label-level setting eventually (different labels will have different tolerance for posting lower-confidence briefs). Not urgent.
2. **Selection state is lost on polling refetch?** — I tested mentally: `setQueryData` rewrites the list but selection keys on `brief.id`, which is stable. The selection survives a refetch. Verify in browser anyway.
3. **`BriefDetail` duplicates `getVideoId`, `formatTimestamp`, `confidenceChipStyle`, and `tagColors` from `BriefCard`** — I inlined rather than pulling a shared util, because the file count is still small and the helpers are tiny. If a third consumer appears, move them to `src/utils/fanBriefsUi.ts`.
4. **The sticky bar doesn't animate in** — it just pops. A `framer-motion` fade+slide would feel more finished; pattern exists in `PresidentBriefCard`. ~5 lines.
5. **Modal doesn't close when you click "Chat about this"** — it does in my implementation (`onOpenChange(false)` before `navigate`), but worth double-checking visually since it's a subtle UX thing.
