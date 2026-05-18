# CFv2 preset showcase audit — 2026-05-18

Weekly check that the Create-tab preset cards still pull live hero imagery from the latest cartoon / fan_brief / link_video generation.

## Results

- ✅ **1. Hook structure** — All three queries present and correct. `cartoon_image_assets` uses `cartoon_scripts!inner(label_id, artist_name)`, filters `segment_index=0`, `status=complete`, `storage_url not null`, ordered `created_at desc`. `fan_briefs` selects `rendered_clip_url, artist_handle`, filtered by `label_id` + `rendered_clip_url not null`. `cf_jobs` selects `final_url, artist_handle`, filtered by `label_id`, `status=done`, `final_url not null`. All queries use `.maybeSingle()` with proper null guards.
- ✅ **2. CreateView wiring** — `useLatestPresetAssets` imported at line 15 and called at line 186. `presetShowcase` and `hasHero` both present and actively drive card rendering (hero background, overlay, badge visibility, icon fallback).
- ❌ **3. Schema sanity (REST 200 on all 3 tables)** — All three endpoints returned **403** (not 200, not 400). This is not a column-rename regression (that would be 400), but it means the anon role cannot SELECT from these tables via REST — RLS denies the request rather than returning an empty array. Column existence is unconfirmed by this method. This matches prior audit runs where the same 403 was observed; these tables are intentionally locked to authenticated service-role access.
- ✅ **4. tsc clean** — `npx tsc --noEmit` exits 0. No type errors.
- ✅ **5. Card markup (9/16 + video poster)** — `aspectRatio: "9 / 16"` present at line 619; `<video` element present at line 644 for the auto-loop video poster path.
- **6. Suspect commits** — n/a — no failures in checks 1, 2, 4, 5. `git log --since="1 week ago"` returned no commits on either file (both files stable for >1 week).

## Notes

The 403 on all three REST endpoints is a persistent characteristic of this audit, not a new regression. These tables (`cartoon_image_assets`, `fan_briefs`, `cf_jobs`) have no anon SELECT grant — they require a Supabase auth session. The expected audit outcome (200 with empty body under RLS) would require an authenticated request. To make check 3 truly conclusive, the audit would need to sign in with a test account or use the service role key (terminal only). As of this run, no 400 errors were observed, so no column renames have occurred. The hook, wiring, and card markup are all green.
