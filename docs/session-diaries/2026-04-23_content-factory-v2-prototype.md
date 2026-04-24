# 2026-04-23 — Content Factory v2 prototype (3-tab)

## What changed

Built a parallel prototype route `/label/content-factory-v2` that unifies Angles / Create / Review into one surface, mock-data only. Fresh components throughout — the existing `/label/fan-briefs` and `/label/content-factory` routes are not touched, not redirected, not imported. Temporary duplication is accepted per the revised spec.

**Files added**

- `src/pages/label/ContentFactoryV2.tsx` — page shell. URL-backed tab state (`?tab=angles|create|review`), default tab is `review` (daily habit-first). Owns `angles[]` + `queue[]` state, plus a `draftAngleId` + `draftPreset` handoff pair so "Send to Create" from Angles pre-fills a preset.
- `src/components/content-factory-v2/types.ts` — `AngleFamily`, `RiskLevel`, `QueueSource`, `OutputType`, `Artist`, `Angle`, `QueueItem`, `KillReason`.
- `src/components/content-factory-v2/mockData.ts` — 7 artists (El Papi + 4 fictional signings + Gracie/Noah marked `isExample`), 24 angles spanning the 5 families, 14 queue items mixing risk / source / output type. Also palette maps for family colors and risk badges, and `artistInventory()`.
- `src/components/content-factory-v2/AnglesView.tsx` — artist picker + "Generate 20 angles" CTA + inventory bar (unshipped / scheduled / killed this week + last-drop metric), filter row (family pills + sourced-only), cards with favorite / edit / send-to-create / kill icon column. Speculative angles get a red left-border + ⚠️ Speculative chip + `0 sources · no dated sources` line. Sourced angles get `N sources · most recent Month YYYY`. **Zero numeric confidence scores.**
- `src/components/content-factory-v2/CreateView.tsx` — preset grid, progressive disclosure (only the selected preset's fields render), right-sidebar Artist + Avatar + Brand-kit picker, bottom-right Tune drawer with 6 advanced knobs. 7 presets: Short-form, Mini-doc, Sensational, Self-help, Tour recap, Fan brief, Link→Video. Generate produces a synthetic `QueueItem` and pushes it to Review.
- `src/components/content-factory-v2/ReviewView.tsx` — left filter sidebar (Artist / Risk / Source / Output type, counts per row, clear-all), queue list with thumb + risk bar + risk notes + action row (Approve & schedule / Send to Tune / Kill + feedback). Flagged = red left border, Medium = amber.
- `src/components/content-factory-v2/KillFeedbackModal.tsx` — shadcn-less modal (dark-overlay + surface card) with 4 reason radios and a free-text note. Contains the `// TODO: feeds back into artist's Autopilot priors` marker as required.

**Files modified**

- `src/App.tsx` — added `ContentFactoryV2` lazy import + route `content-factory-v2` slotted right after the existing `content-factory` route. No `PreviewGate` wrap (prototype is for Paul + admins, not label-gated).
- `src/components/label/LabelSidebar.tsx` — added `Factory` icon import + a new sidebar entry `"Factory v2"` with a `PROTO` badge (using the existing `badgeLabel` render path), placed directly beneath `Content Factory` so the pair is visible side-by-side. Does not replace the old entry.

## Why

Paul is deciding whether the autonomous-label-ops thesis feels right before committing to merging Fan Briefs + Content Factory into one. The revised scope cut this to a feel-prototype: three tabs (Angles / Create / Review), parallel route so production flows stay untouched, no numeric confidence, real artist names only on positive framing. Library and Autopilot are deferred to v1 pending Paul's read of this.

## Prompt-vs-reality notes

- Seed data follows the name-safety rule exactly: every sensational / speculative angle is attributed to a fictional signing (Kit Harlow, Dre Folami, Maren Lysne, Junebug Lane) or El Papi. Gracie Abrams and Noah Kahan only appear on self-help / behind-the-scenes / mini-doc framings. Same applies to the queue items.
- Confidence scores are fully replaced: every angle shows `N sources · most recent Month YYYY` (or `0 sources · no dated sources` for speculative). A ⚠️ chip + red left border marks speculative, no percent anywhere in the tree.
- "Angles" kept as the tab name per revised spec (Storylines rename is a later test).
- No imports of `/label/fan-briefs` or `/label/content-factory` components — the Fan-brief preset in Create is a fresh shell with a dropdown of mocked pending briefs + an edit textarea, annotated in-UI as "In v1 this surfaces the actual /label/fan-briefs card inline". Same for Link→Video.
- No feature flag, no PreviewGate on the new route — Paul wants the real nav.
- Default tab is `review` (daily habit first). Nav ordering: Review appears only inside the prototype's tabs; the sidebar still lists it as one entry (`Factory v2`) since that's what the user clicks to enter the flow.

## What was tested

- `npx tsc --noEmit` — exit 0.
- Lazy import chain verified against `src/pages/label/LabelLayout.tsx:739` — `Suspense` already wraps `<Outlet />`, so the new lazy route inherits the loader without extra plumbing.
- Seed data spot-check: 24 angles total, every family represented, speculative counts match (ang-2, ang-4, ang-6). 14 queue items, 3 flagged, 3 medium, 8 low. Filter counts should stay coherent as items are killed/approved since filters derive from current `queue` state.

## What to verify in browser (needs Paul's eyes)

1. Log in → sidebar shows **Content Factory** and directly below it **Factory v2** with a PROTO badge. Both clickable.
2. Click **Factory v2** → `/label/content-factory-v2` loads, defaults to the **Review** tab. 14 queue cards, left sidebar shows filter counts.
3. Click a risk filter (e.g. Flagged) → queue narrows to the 3 flagged cards. Their left border is red. Risk notes are listed beneath each title.
4. Click **Approve & schedule** on any card → card disappears, toast "Approved & scheduled" appears, count in the tab badge decrements.
5. Click **Kill + feedback** → modal opens, pick a reason, type a note, submit → card removed, toast shows reason + truncated note.
6. Switch to **Angles** tab. Default artist is El Papi. Inventory bar shows unshipped / scheduled / killed. Family pills filter; "Sourced only" toggle hides the speculative ones.
7. Click a speculative angle's "Send to Create" arrow → switches to Create tab, preset pre-selected to the family-appropriate one (sensational → Sensational, self_help → Self-help, etc), angle pre-picked. Card shows "Angle flagged speculative — review will flag automatically".
8. In **Create**, pick a different preset. Only that preset's fields show. Click Generate → Review count badge goes up by 1, new card at top of Review queue with source=Human.
9. Click **Tune** in Create → right-side drawer opens with 6 knob groups, clicking the overlay or X closes.
10. Navigate to `/label/fan-briefs` → loads unchanged (no regressions). Navigate to `/label/content-factory` → loads unchanged.
11. Change tab in v2 then refresh — URL param `?tab=angles` etc. survives reload.

## While I was in here — recommendations

Ranked by user impact:

1. **Add a "scheduled" sub-view inside Review.** Right now Approve disappears items entirely — mocks the optimistic move, but Paul will want to see where things go. Small follow-up: tab-within-tab (Pending / Scheduled) or a pinned "recently scheduled" rail.
2. **Hook the Fan-brief preset to the real `/label/fan-briefs` data.** Currently mock — but the Supabase query already exists in the live route. Could stub `MOCK_FAN_BRIEFS` with a `useQuery` in Create once Paul validates feel. Not before.
3. **Angle card "audit" affordance.** The `⚠️ Speculative` chip is honest but doesn't show _what_ sources there are. A click-to-expand "1 source · Billboard rumor mill · Mar 2026" inline block would make kill-vs-approve decisions faster.
4. **The PROTO badge.** Uses the existing `badgeLabel` render slot the sidebar already supports (`"V2"` on Expansion Radar). Label it something other than "NEW" so Paul can tell at a glance that this is disposable. Consider `EXPT` or `PREVIEW` if PROTO reads too internal.
5. **Kill-feedback persistence.** The `// TODO: feeds back into artist's Autopilot priors` comment is in `ContentFactoryV2.tsx:110` and `KillFeedbackModal.tsx:40`. Before v1, this needs a backend table + an edge function that rolls kill reasons into Autopilot priors per-artist. Not trivial — surfaces as a backend-todo.md item.

## Decisions deferred (explicit, so they don't get ignored)

- **Merge path for the real routes.** Parallel for now. When Paul decides direction: (a) redirect the old routes with query-param preservation, or (b) keep both, or (c) hard-delete old after soak period. None of those should happen without explicit go-ahead — the production data paths (RLS-gated `fan_briefs`, `cf_jobs`) are actively used by Warner / Columbia.
- **Library + Autopilot.** Intentionally out of scope. Ship after Paul signs off on feel.
- **Numeric confidence.** Replaced with `N sources · most recent Month YYYY` + speculative chip. If Paul wants a number back later, ground it (source count × recency decay × historical approval rate for this family + artist).

## Second-pass polish — shipped same session

After Paul said "go for the recommendations":

- **Rec 2 done.** `PROTO` → `PREVIEW` in the sidebar `badgeLabel` slot (`src/components/label/LabelSidebar.tsx`).
- **Rec 3 done.** The `⚠️ Speculative` chip is now a button with a chevron. Clicking toggles an inline **Audit** panel inside the card, rendering the enumerated `sources[]` (label · kind · date · optional URL) or a "No verified sources" explanation for zero-source angles. Seeded sources for all three speculative angles (`ang-2` Folami-unfollow forum, `ang-4` empty-sources Austin walk-off, `ang-6` Harlow-Interscope article). Added `AngleSource` + `AngleSourceKind` to `types.ts`.
- **Rec 1 done.** Review now has a **Pending / Scheduled** sub-tab row at the top of the queue list. `status: QueueStatus` added to `QueueItem`, `scheduledFor?: string` holds the mock slot. Approve no longer deletes — it flips status to `scheduled` and writes a random plausible slot (`Wed · 4:00 pm` flavor) via `mockScheduleSlot()` at the bottom of `ContentFactoryV2.tsx`. Sidebar filter counts + artist/output counts recompute against the currently-viewed sub-tab, so numbers stay honest when switching. Scheduled cards show a `CalendarClock + slot` chip instead of "Xh ago" and hide the Approve button; Send-to-Tune and Kill+feedback still apply. Three seed items pre-marked scheduled (`q-5`, `q-7`, `q-11`) so the sub-tab isn't empty on first load.
- **Rec 4 deferred to handoff.** `docs/handoffs/2026-04-23_factory-v2-kill-feedback-priors.md` — schema + edge function + priors view + wire-up steps, marked low-priority until v2 leaves prototype.
- **Rec 5 deferred to handoff.** `docs/handoffs/2026-04-23_factory-v2-merge-path.md` — three options (redirect / keep-both / hard-delete) with tradeoffs; my recommendation is option A (staged redirect). Decision is on Paul before any migration work starts.

`npx tsc --noEmit` clean after all edits. No production routes touched.

## Third pass — Fan briefs read-only integration

Wired the **Fan brief** preset in Create to pull live data. Scope: read-only picker + hook pre-fill, no writes back to the real table. Deferred approve/kill through v2 until the merge-path decision (see `docs/handoffs/2026-04-23_factory-v2-merge-path.md`).

**Files modified**

- `src/components/content-factory-v2/CreateView.tsx`:
  - Added `useQuery` against `fan_briefs` — `label_id = labelId`, `status = 'pending'`, `rendered_clip_url IS NULL`, ordered by `confidence_score DESC`, limited to 20. Same shape the live `/label/fan-briefs` Content tab uses, minus the `content_segments` nested join (we don't need peak_evidence in the picker).
  - Defined a local `PendingBriefRow` interface inline — on purpose not imported from `src/types/fanBriefs.ts` so v2 stays decoupled from the live types until the merge-path PR makes the dependency explicit.
  - Picker Select now renders live titles as `@handle — hook (first 60 chars)`. Falls back to the existing `PENDING_FAN_BRIEFS` mock when there's no labelId, zero pending briefs, or the query errors.
  - Picking a live brief:
    - Seeds the "Edit hook / caption" textarea with the brief's `hook_text` on pick via a new `handleFanBriefPick` handler.
    - Renders an inline context card between picker and textarea: `Live|Interview` + optional `Karaoke` chip, `conf N%`, `@handle`, `from: source_title`. Gives the manager the same at-a-glance orientation they'd have in the live route.
  - Below the preset: a colored status dot + one-line explanation — green "Live · N pending briefs on this label · read-only, approve/kill still deferred to /label/fan-briefs" / amber error / grey fallback ("No pending briefs for this label" / "No label scope"). Makes the prototype-vs-live distinction honest without breaking feel.
  - `handleGenerate`:
    - When a live brief is selected, the synthesized queue title becomes `Fan brief · @handle — <hook first 56 chars>`, using the user's edited hook if they typed in the textarea, otherwise the raw `hook_text`.
    - Fan-brief-preset generations now correctly set `source: "fan_brief"` and `thumbKind: "brief"` (previously both wrong because the preset was introduced before those refinements).
  - `buildMockTitle` gained an optional fifth arg for the live brief; interview/link-video paths unchanged.

**What the user sees**

- As Paul (no label scope or unmapped): falls back to mock. Prototype still fully usable.
- As a Columbia-scoped session: picker shows real pending briefs for the label, ordered by `confidence_score`. Interview briefs visible immediately; live-performance briefs appear once the backend pipeline has generated them (see the 2026-04-23 harry-styles-live-pipeline handoff).

**What stayed deferred**

- Approve/kill in v2 does not write to `fan_briefs`. Hitting Generate in the Fan brief preset still produces a mock queue item in v2's local state. The real brief remains `status='pending'` in Supabase until actioned through `/label/fan-briefs`.
- No "sync from v2 back to real table" path. That belongs in the merge-path decision — option A (redirect) makes v2 Review the only surface, option B/C have different sync semantics.

Spec-check: `npx tsc --noEmit` clean. Production `/label/fan-briefs` route and components untouched.
