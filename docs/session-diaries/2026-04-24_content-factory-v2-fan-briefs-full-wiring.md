# 2026-04-24 — Content Factory v2: full fan-briefs wiring (card inline + write path)

## What changed

Finishes the fan-briefs integration in `/label/content-factory-v2` → Create → Fan brief preset. Two complementary additions:

1. **Inline BriefCard list replaces the mock Select UI.** When a label scope has live pending briefs, the Create view now renders the real `<BriefCard>` component per brief — peak_evidence, venue badge, "Why this moment" accordion with top fan comments, YouTube embed (static preview), confidence chip, tag row, why_now block. Same component `/label/fan-briefs` uses; shared query key (`["fan-briefs", labelId, "content"]`) so cache updates propagate across both routes.
2. **Write path wired.** Approve / Skip / Modify hook from each BriefCard write straight to `fan_briefs` (matches `/label/fan-briefs` mutations). Approve also pushes a new `QueueItem` into v2's Review with `fanBriefId` set. When Review's Kill-with-feedback fires on a queue item that has a `fanBriefId`, it cascades an `UPDATE fan_briefs SET status='archived'` and purges the row from both pending + clips caches.

## Files modified

- `src/components/content-factory-v2/types.ts`
  - Added optional `fanBriefId`, `artistDisplayName`, `artistDisplayHandle` on `QueueItem` so live-brief items can reference a backend row and render correctly in Review when the brief's artist isn't in `MOCK_ARTISTS`.

- `src/components/content-factory-v2/CreateView.tsx`
  - Dropped local `PendingBriefRow`; imports `FanBrief` from `src/types/fanBriefs.ts`.
  - `BRIEFS_SELECT` constant (same join string as `LabelFanBriefs`) with nested `content_segments.peak_evidence`, `hook_source`, and `content_catalog.live_venue` / `content_type` / `title` / `duration_seconds`.
  - Query key aligned: `["fan-briefs", labelId, "content"]` with `refetchInterval: 30_000`, `staleTime: 15_000` — same options as the live route so cache is shared.
  - New handlers:
    - `handleApproveBrief(id)` → `UPDATE fan_briefs SET status='approved', approved_at=now() WHERE id=?` + optimistic removal from cache + `onGenerate` call that pushes a `QueueItem { source: "fan_brief", status: "pending", fanBriefId, artistDisplayName/Handle }` into Review.
    - `handleSkipBrief(id)` → `UPDATE fan_briefs SET status='skipped'` + optimistic cache removal.
    - `handleModifyBriefHook(id, hook)` → `UPDATE fan_briefs SET modified_hook=?` + optimistic in-place cache update. `BriefCard` re-renders with the new hook via `brief.modified_hook`.
  - `mutatingBriefId` local state → applied as opacity+pointer-events gate on the card currently being mutated.
  - Fan-brief preset UI:
    - **Live branch** (`usingLiveBriefs === true`): vertical stack of `<BriefCard brief mode="content" staticPreview onApprove onSkip onModifyHook />`. `staticPreview` keeps N YouTube iframes from hammering the page.
    - **Mock branch** (no labelId / no pending / query errored): the existing Select + textarea UI, labeled "mock".
  - Hidden the default **Tune + Generate** footer when `activePreset === "fan_brief"` AND `usingLiveBriefs` — each card owns its own Approve. The mock branch still shows the footer so Paul can exercise the flow without a labelId.

- `src/components/content-factory-v2/ReviewView.tsx`
  - `QueueCard`: `artistName` / `artistHandle` fall back to `item.artistDisplayName` / `item.artistDisplayHandle` when `artistById(item.artistId)` misses (live briefs can come from artists outside the mock roster).

- `src/pages/label/ContentFactoryV2.tsx`
  - Imports `useQueryClient`, `useUserProfile`, `supabase`, `FanBrief`.
  - `handleKillWithFeedback` is now `async` and, when the item carries a `fanBriefId`, performs `UPDATE fan_briefs SET status='archived' WHERE id=?`. On success: drops the row from both `["fan-briefs", labelId, "content"]` and `["fan-briefs", labelId, "clips"]` caches. On failure: keeps the local kill but surfaces a destructive toast so Paul knows sync failed.
  - Dependency list updated to include `queue`, `labelId`, `queryClient`.

## Why

The 2026-04-23 third pass had only a read-only picker. Paul asked to finish the two next items:

1. Replace the mock Select with the actual fan-briefs card inline (surface peak_evidence + segments + reasoning).
2. Wire the write path so v2 Create's fan-brief actions actually mutate `fan_briefs`.

Both shipped. The v2 prototype now has a production-equivalent fan-briefs surface embedded inside the Create tab, with full approve/skip/modify-hook semantics and a kill-cascade from Review. `/label/fan-briefs` and `/label/content-factory-v2` stay in sync via shared React Query cache.

## What was tested

- `npx tsc --noEmit` — clean.
- `npm run build` — production build succeeds (10.68s, no new warnings beyond the pre-existing chunk-size notice).
- Shared query-key behavior: confirmed same key + same queryFn + same options as `LabelFanBriefs`, so React Query dedupes to a single cache entry and both routes see the same data + mutations.
- BriefCard dependency chain: `useNavigate` ok (v2 route is inside the Router), `peakEvidenceOf`/`venueFromBrief`/`isLiveBrief` resolve from `@/components/fan-briefs/venues`.
- Not tested in browser — requires a real label-scoped session to see the live path. Mock path is visually identical to before.

## What to verify in browser (needs Paul's eyes)

1. As a Columbia-scoped session (or any label with pending briefs):
   - Navigate to **Factory v2** → **Create** tab → pick **Fan brief edit** preset.
   - You should see the same BriefCards as `/label/fan-briefs` Content tab, with static thumbnails instead of live iframes.
   - Click the hook text on any card → inline textarea → type → Save Hook. Toast "Hook saved". Navigate to `/label/fan-briefs` → the same brief should show the modified hook (optimistic cache share).
   - Click **Approve** on a card → toast "Brief approved — rendering". Card disappears from the Create list. Switch to the **Review** tab → a new Pending item appears at the top titled `Fan brief · @handle — <hook>`.
   - Navigate to `/label/fan-briefs` → the brief you just approved should no longer appear in Content, should appear in Clips (rendering).
   - Back to Factory v2 Review → **Kill + feedback** the fan-brief item you just added → pick a reason + note → submit. The item disappears from Review. Navigate to `/label/fan-briefs` Clips tab → the brief should be gone from Clips too (status='archived').
2. As Paul's own account (no label scope):
   - Factory v2 Create → Fan brief preset → should see the **mock fallback** Select + textarea exactly as before, with the "No label scope — showing mock" dot.
   - Generate still works and pushes a mock fan_brief item to Review (no `fanBriefId`, no backend write).
3. Regression sweep:
   - `/label/fan-briefs` Content tab still loads, approves, skips, modifies as before.
   - `/label/content-factory` (v1) still loads unchanged.
   - Other Factory v2 presets (Short-form, Mini-doc, Sensational, Self-help, Tour recap, Link→video) still show their own field sets + footer Generate button.

## Design notes / decisions

- **Hidden the Tune + Generate footer for live fan-brief mode.** Each BriefCard owns its own Approve button; a second Generate button would be confusing. Mock branch keeps the footer so the flow is exerciseable without a scoped session.
- **`staticPreview={true}` on the v2 BriefCards.** N live YouTube iframes on one page was the wrong default — the card's thumbnail + Replay button path is enough for Create context.
- **Shared query key**, not a separate `v2-*` key. With the same shape and same options, the two components dedupe into one cache entry. Mutations from either surface propagate for free. When the merge-path lands and we collapse the routes, nothing has to change here.
- **Kill cascades to `status='archived'`, not `'skipped'`**. Semantic match: by the time the item is in Review, the brief is already `approved` (we flipped it on Approve). Archiving matches the Delete-from-Clips path in the live route. Skipped implies "don't want this one" — too late for that at Review stage.
- **No backend hook-edit path from Review.** You can only modify the hook from the Create BriefCard. Review's QueueCard just shows the title. If Paul wants inline edit in Review later, we'd need another mutation path; for now, the expected flow is "edit in Create before Approve, re-edit in /label/fan-briefs if needed".
- **`fanBriefId` as optional.** Keeps the existing mock flow intact (mock items have no fanBriefId, kill doesn't write). Zero behavior change for non-fan-brief queue items.
- **The `TODO: feeds back into artist's Autopilot priors` comment stays.** Unchanged — still the separate handoff at `docs/handoffs/2026-04-23_factory-v2-kill-feedback-priors.md`.

## While I was in here — recommendations (ranked by operator impact)

1. **Add a "View in Fan Briefs" link on v2 Review fan_brief items.** When a clip is rendering and Paul wants to see the full source context, clicking the queue card could jump straight to `/label/fan-briefs?highlight=<id>`. The highlight param already exists in the live route's URL state — we'd just need a deep-link.
2. **Inline-render the approved clip's `rendered_clip_url` in Review once it lands.** The fan_briefs row eventually gets a `rendered_clip_url` when backend rendering completes — we could swap the `FileText` thumb for a small looping `<video>` once it exists. Needs a 30s poll on the queue's `fanBriefId`s or a realtime subscription.
3. **Extract `BRIEFS_SELECT` + the query key into `src/utils/fanBriefsApi.ts`.** The two routes now both declare it verbatim. Low risk, high clarity — one-line import instead of the two copies. Would do now but holding for the merge-path PR since that'll collapse both references into a single hook.
4. **Handle the fan-brief `BriefCard`'s Chat-about-this navigate target.** Currently jumps to `/label/assistant` with a prefill. Works fine, but there's no trail back to v2. Consider adding a `fromRoute` state so the assistant page can offer a "Back to Factory v2" chip.
5. **Soft-confirm on Approve.** A 300ms undo-toast after Approve would let Paul catch a mistap before the backend fires rendering. Right now Approve is a one-click irreversible hop; a 3-second "Undo" would match the feel of email/labels tools and cost almost nothing.

## Decisions still deferred (explicit)

- **Merge-path** for the real routes. Unchanged since 2026-04-23 — see `docs/handoffs/2026-04-23_factory-v2-merge-path.md`. The inline BriefCard + shared cache makes option A (redirect old → new) cheaper now, but still Paul's call.
- **Library + Autopilot** tabs. Intentionally out of scope.
- **Kill-feedback priors** table + edge function — `docs/handoffs/2026-04-23_factory-v2-kill-feedback-priors.md`.
