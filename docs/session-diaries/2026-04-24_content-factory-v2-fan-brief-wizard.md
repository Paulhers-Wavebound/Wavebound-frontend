# 2026-04-24 — Content Factory v2: Fan-brief preset becomes a wizard

## What changed

Replaced the inline "dump every pending brief" UX with a 3-knob wizard that gates the BriefCard list. Same data, same write path, much less noise.

**Phase 1 (when the user picks Fan brief edit):**

1. Artist picker — dropdown of `artist_intelligence` rows for the active label, sorted by `artist_name`, requires a non-null `artist_handle`.
2. Source — two chips: **Live performance** (matches `content_type='live_performance'`) and **Podcasts** (matches `content_type IN ('interview','podcast')`).
3. Clip count — range slider 1–20, default 5.
4. Primary CTA: **Show briefs**. Disabled until both artist and source are chosen.

**Phase 2 (after CTA):**

- Breadcrumb strip with `@handle` chip + source chip + `up to N` counter + a **Change filters** button that flips back to Phase 1 with state preserved.
- Counter line below: `Live performance · @handle · X of Y pending briefs on this label.`
- Filtered `BriefCard` list, capped at the requested clip count. Empty state suggests the right CLI command (`scripts/fan-briefs/discover-live.ts @handle`).

The mock fallback (no labelId / zero pending briefs) is unchanged — Paul's own account still gets the Select + textarea path.

## Files modified

- `src/components/content-factory-v2/CreateView.tsx`
  - Added wizard state: `briefArtistHandle`, `briefSource` (`"live_performance" | "podcasts" | ""`), `briefCount` (default 5), `wizardDone`.
  - Added `labelArtistsQuery` — `artist_intelligence.select("id, artist_name, artist_handle").eq("label_id", labelId).not("artist_handle", "is", null).order("artist_name")`. Same shape as `LabelRoster.tsx:51-71`. Query key `["label-artists-v2-create", labelId]`, `staleTime: 5 * 60_000`.
  - Added `filteredBriefs` memo + `totalMatches` memo so the breadcrumb counter reads honestly even when `briefCount` is below the matching pool.
  - Added a reset `useEffect` keyed on `activePreset !== "fan_brief"` that clears all four wizard pieces — re-entering the preset always starts fresh.
  - Replaced the `usingLiveBriefs ? (…)` JSX with the two-phase render described above. Mock fallback branch unchanged.

No other files touched. The approve/skip/modify-hook handlers, the queue write path, and Review's kill-cascade all keep working as-is — they operate on `brief.id`, not on the filter set.

## Why

The previous wiring (shipped earlier today) rendered every pending brief inline the moment the preset was clicked. Two problems:

1. **Noise at scale.** A label with 30 pending briefs would scroll forever; the surface didn't help the user pick.
2. **Live-performance feature wasn't surfaced.** The 2026-04-21 → 2026-04-23 work mined live videos for fan-comment peaks, but you'd see those briefs mixed in with interview briefs with no way to ask "show me 5 live clips for Harry Styles."

The wizard frames the question the user is actually answering ("which artist, what kind, how many?") and only then drops them into the heavyweight BriefCard view.

## What was tested

- `npx tsc --noEmit` — clean.
- `npm run build` — production build succeeds (10.25s, no new warnings beyond the pre-existing chunk-size notice).
- Reasoned through state transitions:
  - Preset switch → reset effect fires → wizard returns to defaults next time Fan brief is opened.
  - "Change filters" → preserves state, flips to Phase 1.
  - Artist picked, source unset → CTA disabled.
  - `labelArtistsQuery.isError` → soft-fall to free-text input so wizard still functions.
  - `labelArtists.length === 0` → roster empty-state shown; user can't proceed (no handle to filter on).

## What to verify in browser (needs Paul's eyes)

1. **Columbia / scoped session**:
   - Factory v2 → Create → click **Fan brief edit** → wizard appears with artist dropdown populated from the label roster, two source chips, clip slider.
   - Pick `@kitharlow` (or any artist with live briefs) → **Live performance** → 5 clips → Show briefs → BriefCard list shows ≤5 live briefs for that artist only. Breadcrumb reads `@kitharlow · Live performance · up to 5`.
   - Click **Change filters** → returns to Phase 1 with selections preserved. Tweak source to **Podcasts** → Show briefs → list updates to interview/podcast briefs only.
   - Pick an artist with zero live briefs → empty-state CTA copy shows the `discover-live.ts @handle` hint.
   - Approve a card → toast fires, card disappears, `/label/fan-briefs` Content tab also reflects the removal (shared cache).
   - Switch away to **Mini-doc** preset, then back to **Fan brief edit** → wizard resets to defaults.

2. **Paul-only / no labelId**:
   - Fan brief preset → mock Select + textarea unchanged from before. Wizard does not appear.

3. **Regression sweep**:
   - `/label/fan-briefs` works as before.
   - `/label/content-factory` works as before.
   - Other Factory v2 presets (Short-form, Mini-doc, Sensational, Self-help, Tour recap, Link→video) untouched.

## Decisions worth flagging

- **"Podcasts" groups two content_types.** Maps to `interview OR podcast`. The taxonomy is honest in the schema but `podcast` is unused in practice; the user-facing label says what most labels actually have (interview clips from podcast appearances).
- **Wizard resets on preset re-entry.** Tradeoff: lose state across navigations vs. avoid stale filters. Picked the reset for simplicity — this is a 5-second decision per visit. If Paul wants persistence, easy follow-up via URL params.
- **Free-text fallback when roster fetch fails.** Soft-fail instead of erroring out — the user can still type a handle manually. Roster query failure shouldn't block brief filtering.
- **Slice in JS, not in the SQL.** We already pull all 20 pending briefs in `pendingBriefsQuery`; filtering and slicing client-side is cheap and keeps the cache shared with `/label/fan-briefs`. If a label ever exceeds 20 pending, we'd want server-side filter + a higher limit, but that's a real-data problem, not a today problem.

## While I was in here — recommendations (ranked by impact)

1. **Persist wizard state in URL params.** `?artist=...&source=...&n=...&done=1` would make filters shareable + survive refresh. ~20 LOC. Keeps Paul from re-picking when iterating between Create and Review.
2. **Add a "Why this brief?" cue on Live results.** Each Live BriefCard already has the "N fans flagged this moment" accordion — but it's collapsed by default. In the wizard's narrowed view, opening the first card by default would showcase the live-performance feature without an extra click.
3. **Surface clip count vs available** in the slider label. Currently reads "Clip count — up to 5"; a "(7 available)" suffix once an artist+source pair is picked would prevent the user from cranking the slider past what exists.
4. **Extract `useLabelArtists` hook.** Same query now lives in `LabelRoster.tsx` (read into `setArtists` via `useEffect`) and `CreateView.tsx` (read via `useQuery`). When a third caller appears, extract to `src/hooks/useLabelArtists.ts` with React Query as the canonical mode.
5. **Telemetry for wizard usage.** A simple `console.log` (or actual analytics call once instrumented) on `setWizardDone(true)` capturing artist + source + count would give Paul early signal on which artists/sources are getting reviewed most. Useful for prioritising backend pipeline runs.
