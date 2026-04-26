# 2026-04-25 — Retire old Content Factory page

## What changed

Retired `/label/content-factory`. Content Factory V2 is now the only Content Factory — V2 covers the old page's single Link → Video preset (same `content-factory-generate` + `content-factory-status` endpoints) plus 7 other output types, the Review queue, scheduling, and rich filtering.

**Deleted:**

- `src/pages/label/ContentFactory.tsx` (1,032 lines, fully standalone — no associated component directory ever existed)

**Modified:**

- `src/App.tsx` — dropped the `ContentFactory` lazy import and replaced `<Route path="content-factory" element={<ContentFactory />}>` with a `<Navigate to="/label/content-factory-v2" replace />` redirect so saved bookmarks don't 404
- `src/components/label/LabelSidebar.tsx` — removed the old "Content Factory" nav entry, renamed V2's "Factory v2" → "Content Factory", dropped the `PREVIEW` badge from V2, removed unused `Film` icon import

## Why

V2 is a strict superset and stable enough to be the only Content Factory. Two nav entries pointing at overlapping product was confusing.

## What was tested

- `npx tsc --noEmit` — clean
- Confirmed no other files reference `/label/content-factory` as a route (LabelLayout.tsx had no breadcrumb / command-palette entry for it; only App.tsx + LabelSidebar.tsx needed touching)
- Backend endpoints (`content-factory-generate`, `content-factory-status`, `content-factory` storage bucket) are kept — V2 still calls them via `linkVideoReconciler` and `CreateView`

## What to verify in browser

- Sidebar shows one "Content Factory" entry (Factory icon, no PREVIEW badge) where there used to be two
- `/label/content-factory` (old URL) redirects to `/label/content-factory-v2` without flashing 404
- Link → Video preset in V2 still kicks off `content-factory-generate` and reconciles via `content-factory-status` polling — this is the one path V2 inherited from the old page that's worth a real test before fully trusting the migration

## While I was in here, I also recommend...

1. **Test Link → Video in V2 with a real reference URL.** This was the single use-case the old page existed for; V2's `linkVideoReconciler` claims parity but it's the only thing that wasn't smoke-tested before retiring.
2. **Drop the `isNew` flag on the V2 entry once you're past the soft-launch window.** It's been "new" for a while; the NEW badge starts to feel like noise once it's the only Factory.
3. **Audit `link-video-v2.md` and `cartoon-create.md` feature docs for stale `/label/content-factory` references.** Both presets used to live behind that route; if they describe the old form-flow they should now describe the V2 wizard.
4. **Consider whether the `content-factory` Supabase storage bucket name is still the right primary for V2 uploads.** It's currently shared (CreateView writes MP3 uploads there), which is fine — just flagging that the bucket name leaks the old route nomenclature into the data layer.
