# 2026-04-25 — Kill standalone Fan Briefs page

## What changed

Retired the standalone `/label/fan-briefs` window. Fan briefs now live exclusively inside Content Factory V2 (Create wizard + Review queue).

**Deleted:**

- `src/pages/label/LabelFanBriefs.tsx`
- `src/pages/label/previews/FanBriefsPreview.tsx`
- `src/components/fan-briefs/` (BriefCard, BriefDetail, BriefAuditModal, venues)
- `src/components/coming-soon/mocks/FanBriefsMock.tsx`

**Modified:**

- `src/App.tsx` — removed `LabelFanBriefs` lazy import, `FanBriefsPreview` import, and the `<Route path="fan-briefs">` block
- `src/components/label/LabelSidebar.tsx` — removed Fan Briefs nav entry, removed `fan-briefs` from `FEATURE_TO_NAV`, removed unused `Sparkles` icon import
- `src/pages/label/LabelLayout.tsx` — removed `/label/fan-briefs` from `ROUTE_MAP` and command palette `NAV_COMMANDS`, removed unused `Sparkles` icon import
- `src/config/previewFeatures.ts` — removed `"fan-briefs"` from `PreviewFeatureId` union, Warner Music UK preview list, and `PREVIEW_FEATURE_LABELS`
- `src/pages/label/ContentFactoryV2.tsx` — removed dead `setQueryData` writes to the standalone page's `["fan-briefs", labelId, "content"|"clips"]` cache keys (they no longer have a reader); kept the `fan_briefs.status='archived'` cascade since that's the source of truth
- `src/types/fanBriefs.ts` — updated comment that referenced `LabelFanBriefs`
- `src/components/content-factory-v2/types.ts` — updated comment that referenced `/label/fan-briefs`
- `src/components/content-factory-v2/CreateView.tsx` — updated placeholder text that referenced `/label/fan-briefs`
- `docs/features/fan-briefs.md` — rewrote to reflect that the feature now lives entirely under Content Factory V2

## Why

Paul: "kill the fan briefs window and feature now that we have made it in content factory V2. that should be the only place it lives."

The wizard + Review queue in CF v2 are now the canonical surface — having a second standalone window was duplicative.

## What was tested

- `npx tsc --noEmit` — clean (twice, after edits and after comment cleanup)
- `git status` — confirms 7 files staged-deleted + 3 modified (unstaged) cover all references; no stray imports
- `grep -rn "LabelFanBriefs|FanBriefsPreview|FanBriefsMock" src` — clean
- `grep -rn "/label/fan-briefs" src` — clean

## What to verify in browser

- Sidebar no longer shows Fan Briefs entry between The Vault and Content Factory
- ⌘K command palette no longer lists Fan Briefs
- Direct nav to `/label/fan-briefs` falls through to NotFound (404) — expected
- Content Factory V2 → Create → Fan brief preset still kicks off jobs and reconciles into Review (the path that mattered)
- Kill-with-feedback on a live-sourced QueueItem still archives the underlying `fan_briefs` row (verified the cascade is intact; only the dead React Query cache writes were removed)

## While I was in here, I also recommend...

1. **Audit `migrations/fan-briefs-schema.sql` references in docs.** The doc refers to it but I didn't verify the file still lives in the backend repo at the documented path. Worth a 30s check next time you're in `wavebound-backend`.
2. **Remove `FanBrief["status"]` values that the new flow can't produce.** With the standalone approve/skip/modify UI gone, `'skipped'` and `'modified'` may be effectively dead values for new briefs (the wizard goes straight to `'approved'`, kill goes to `'archived'`). Worth checking the backend pipeline to see if any path still writes them — if not, prune them from the union next clean-up pass.
3. **Stop preserving the kill-cascade comment trail in CF v2.** Now that there's no second reader, the inline `fan_briefs` archive write reads as a leftover. Either inline-document it as the kill-feedback contract, or extract into a tiny `archiveFanBrief(id)` helper for clarity — your call.
4. **Drop `dist/assets/LabelFanBriefs-*.js` build artifacts.** They'll regenerate on next `npm run build`, but if there's a CDN or stale dist deploy somewhere, those chunks now reference deleted code. Low risk; flagging for the next deploy.
5. **Consider deleting `src/components/coming-soon/mocks/` if FanBriefsMock was the last one.** Quick check: if the directory is empty after this commit, sweep it and any unused `coming-soon` plumbing the mock used to satisfy.
