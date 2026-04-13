# Signal Report Decision Point Avatars — Fix

**Date:** 2026-04-12
**Touched:** `src/components/label/content-social/SignalReportCard.tsx`, `docs/handoffs/backend-todo.md`, `artist_intelligence` table (data hot-patch).

## What changed

1. **Data hot-patch** — updated `artist_intelligence.avatar_url` for 4 Columbia roster artists (`addisonre`, `malcolmtodddd`, `hshq`, `presleylynhaile`) to point at Supabase Storage avatars (`avatars/<handle>.jpg`) instead of expired TikTok CDN signed URLs. Re-ran `refresh_roster_metrics()` to propagate to `roster_dashboard_metrics`. Verified all four return 200.
2. **Frontend resilience** — added an `ArtistAvatar` component to `SignalReportCard.tsx` with chained fallback:
   - Try the URL from data
   - Fall back to deterministic `avatars/<handle>.jpg` storage URL
   - Fall back to artist initials inside a category-colored circle
3. **DecisionPointRow** now uses `ArtistAvatar` instead of the old inline `<img>` + category-icon fallback. Avatar is bumped from 32px to 36px so it reads as a "full avatar" rather than an icon-sized chip.
4. **Backend handoff** — added a section to `docs/handoffs/backend-todo.md` describing the root cause (n8n WF2 writes raw `tiktokcdn-us.com` URLs that expire) and the long-term fix (always download to Storage, write the storage URL).

## Why

User reported that Signal Report decision points were showing category icons instead of artist avatars. Root cause: 4 of 13 Columbia artists had expired TikTok CDN signed URLs in `roster_dashboard_metrics.avatar_url` (HTTP 403). The existing `<img>` tag's `onError` handler was correctly falling back to the category icon — but the user expected the photo. Storage already had working JPGs for all 4 artists; the upstream pipeline just wasn't writing the storage URL into `artist_intelligence`.

## What was tested

- `npx tsc --noEmit` — clean
- `curl` against all 4 storage URLs after the SQL UPDATE — all return 200
- `refresh_roster_metrics()` — `{"processed": 25}` success
- `roster_dashboard_metrics` SELECT — confirmed all 4 rows now point to storage URLs

## What to verify in browser

- Open `/label/content-social` as a Columbia user — Decision Points section should now show round artist photos for Addison Rae, Malcolm Todd, Harry Styles, etc., with a category-colored ring around each.
- Force the fallback path: in DevTools, block the storage URL and watch it cascade to initials — should render a clean colored circle with initials, not a lucide icon.

## While I was in here

1. **Other avatar surfaces have the same fragility.** `ContentRosterTable`, `LabelArtistProfile`, `WelcomeGreeting`, `RiskAlerts` all render avatars from `roster_dashboard_metrics.avatar_url` and will silently break the same way when CDN URLs expire. Worth promoting `ArtistAvatar` to a shared component (`src/components/ui/artist-avatar.tsx`?) and replacing the bare `<img>` tags everywhere.
2. **Backfill pass.** Once backend WF2 is fixed to always cache to storage, run a one-time backfill across `artist_intelligence` to rewrite any remaining `tiktokcdn-us.com` URLs — same UPDATE pattern as the hot-patch.
3. **Multi-artist decision points** (e.g. the "The Kid LAROI, Chance Peña, Miles Caton, Presley Haile, Bb trickz, Max McNown" case) only show one avatar. A stacked/overlapping avatar group (max 3, then "+N") would communicate the multi-artist nature visually.
4. **Todo row avatar** at `SignalReportCard.tsx:676` is a 14px `<img>` that has the same `onError` problem (no fallback at all — it just shows broken-image). Same `ArtistAvatar` component would fix it.
5. **Initials fallback for new artists.** Any artist scraped _today_ whose photo hasn't been backfilled to storage yet will show the initials avatar. That's already a much better degraded state than the category icon, but it's worth ensuring WF2 writes the storage URL on first scrape so this only happens during the backfill window.
